/**
 * 混合检索（Hybrid Retrieval）主流程
 *
 * 核心思路：把一条用户问题用 LLM 改写成多条不同角度的问句，
 * 每条问句分别去 Elasticsearch（BM25 关键词）和 Milvus（向量语义）双路召回，
 * 合并去重后用 Rerank 模型重排，最后交给 LLM 生成答案。
 *
 * LangGraph 图结构：
 *   START → query_augment → (es_recall ∥ milvus_recall 并行) → merge → rerank → generate_answer → END
 *
 * 为什么需要混合检索：
 *   - 关键词（ES/BM25）：精确命中专有名词、型号、订单号（如 "PO-20250409-K9"）
 *   - 向量（Milvus）：理解语义、同义改写（如 "无线断断续续" ≈ "WiFi 频繁掉线"）
 *   - 两者互补，合并后召回更全，再靠 Rerank 精排提升精度
 */
import "dotenv/config";
import { Client } from "@elastic/elasticsearch";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Milvus } from "@langchain/community/vectorstores/milvus";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { DashScopeRerank } from "../rerank/dashscope-rerank.mjs";
import { augmentQuery, retrievalQueryStrings } from "./query-augment.mjs";
import { embeddings } from "../../../utils/get-embedding.mjs";
import { getMilvusClient } from "../../../utils/get-milvus-client.js";
import { createModel } from "../../../utils/create-model.mjs";

// ES 中生活笔记的索引名（与 seed-data.mjs 保持一致）
const INDEX = "life_notes";

/**
 * LangGraph 的共享状态（State）定义。
 * 图里的每个节点读写这些字段，节点返回值会自动合并回 state。
 * - query:            用户原始问题
 * - queryAugmentation: LLM 改写的多角度问句结果（{ queries: [...] }）
 * - esHits:           ES 关键词检索命中的文档列表
 * - milvusHits:       Milvus 向量检索命中的文档列表
 * - merged:           ES + Milvus 合并去重后的文档列表
 * - topDocuments:     Rerank 重排后保留的 Top 文档
 * - answer:           最终 LLM 生成的回答
 */
const HybridRetrievalState = Annotation.Root({
  query: Annotation(),
  queryAugmentation: Annotation(),
  esHits: Annotation(),
  milvusHits: Annotation(),
  merged: Annotation(),
  topDocuments: Annotation(),
  answer: Annotation(),
});

/**
 * 把 ES 的搜索结果（hit）转成 LangChain 的 Document 对象。
 * ES 的 _source 里存着 note_title / note_body，这里拼成一段正文文本，
 * 并保留 id、source='es' 以及原始字段作为 metadata，供后续去重和溯源。
 */
function docFromEsHit(hit) {
  const s = hit._source ?? {};
  // 兼容 note_title/note_body 或 title/content 两种字段命名
  const text = [s.note_title ?? s.title, s.note_body ?? s.content]
    .filter(Boolean) // 去掉空字段
    .join("\n");
  return new Document({
    pageContent: text,
    metadata: { id: hit._id, source: "es", ...s },
  });
}

/**
 * 合并 ES 与 Milvus 两路结果：先拼接，再按 metadata.id 去重。
 * ES 在前（通常关键词命中更精确），所以保留首次出现（即 ES 的版本）。
 */
function merge(esDocs, milvusDocs) {
  const combined = [...(esDocs ?? []), ...(milvusDocs ?? [])].filter(
    (d) => d?.pageContent, // 过滤掉没有正文的文档
  );
  return dedupeDocsById(combined);
}

/**
 * 按 metadata.id 去重：
 * - 去重键仅是 id（trim 后非空），不做正文相似度去重（保留各自召回的信息）
 * - 无 id 的文档直接丢弃
 * - 保留首次出现顺序（先 ES 后 Milvus，所以重复时通常保留 ES 的）
 */
function dedupeDocsById(docs) {
  const seen = new Set(); // 记录已见过的 id
  const out = [];
  for (const d of docs ?? []) {
    if (!d?.pageContent) continue; // 空文档跳过
    const id = d.metadata?.id != null ? String(d.metadata.id).trim() : "";
    if (!id) continue; // 无 id 丢弃
    if (seen.has(id)) continue; // 已出现过则跳过（去重）
    seen.add(id);
    out.push(d);
  }
  return out;
}

/**
 * 调试工具：打印一批文档，每篇只显示前 200 字符 + metadata。
 */
function printDocs(label, docs) {
  console.log(`\n=== ${label} (${docs?.length ?? 0} 条) ===`);
  for (let i = 0; i < (docs ?? []).length; i++) {
    const d = docs[i];
    const preview = (d.pageContent ?? "").slice(0, 200).replace(/\n/g, " ");
    console.log(`[${i}] ${preview}${d.pageContent?.length > 200 ? "…" : ""}`);
    console.log(`    metadata:`, d.metadata ?? {});
  }
}

/**
 * 调试工具：打印 LLM 生成的多角度问句，以及最终要逐条检索的串（含原始问题）。
 */
function printQueryRewrite(original, augmentation) {
  const qs = augmentation?.queries ?? []; // LLM 生成的问句
  const forRetrieval = retrievalQueryStrings(original, augmentation); // 原始+生成的完整检索串

  console.log(`\n--- 查询扩展（LLM 生成 ${qs.length} 条检索问句）---`);
  console.log("原始 query:", original ?? "");
  for (let i = 0; i < qs.length; i++) {
    console.log(`  [${i + 1}] ${qs[i] ?? ""}`);
  }
  console.log(
    `\n逐条 ES + Milvus（共 ${forRetrieval.length} 条检索串，含原始问题）:`,
  );
  for (let i = 0; i < forRetrieval.length; i++) {
    console.log(`  [${i + 1}] ${forRetrieval[i] ?? ""}`);
  }
}

/**
 * 把 LangChain 消息的 content 转成纯文本。
 * 兼容三种形态：纯字符串、数组（带 text 字段的块）、null/undefined。
 */
function stringifyMessageContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content ?? "");
  return content
    .map((c) =>
      typeof c === "string" ? c : typeof c?.text === "string" ? c.text : "",
    )
    .join("");
}

/**
 * 把重排后的文档拼成给 LLM 的上下文文本。
 * 每篇带上 [序号]、id、来源（es/milvus），便于 LLM 引用。
 */
function formatDocsAsContext(docs) {
  return (docs ?? [])
    .map((d, i) => {
      const meta = d.metadata ?? {};
      const src = meta.source ?? "";
      const id = meta.id != null ? String(meta.id) : "";
      // 头部信息：如 "[1] id=life_04 source=es"
      const head = id
        ? `[${i + 1}] id=${id}${src ? ` source=${src}` : ""}`
        : `[${i + 1}]`;
      return `${head}\n${d.pageContent ?? ""}`;
    })
    .join("\n\n---\n\n"); // 文档之间用分隔线隔开
}

// 有上下文时的作答 Prompt：只根据片段回答，不编造
const ANSWER_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是阅读用户「生活笔记」知识库并作答的助手。
规则：
- 只根据下方「检索片段」推断答案；片段里没有的信息不要编造。
- 若片段不足以回答，明确说明「笔记里未提到」，并可给出一句保守建议。
- 回答简洁有条理，可使用简短列表；口吻自然中文。`,
  ],
  [
    "human",
    `用户问题：{query}

检索片段：
{context}`,
  ],
]);

// 无上下文时的作答 Prompt：诚实说明没检索到
const NO_CONTEXT_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是阅读用户「生活笔记」知识库并作答的助手。当前没有检索到任何片段。
请用一两句话说明无法从笔记中回答，并礼貌询问用户是否换个说法或补充关键词。`,
  ],
  ["human", "用户问题：{query}"],
]);

/**
 * 构建混合检索的 LangGraph 图。
 * 依赖注入：esClient（ES 客户端）、milvus（Milvus 向量库）、reranker（重排）、chatModel（LLM）
 * 这样图逻辑与具体实例解耦，便于测试和替换。
 */
export function compileHybridRetrievalGraph(
  esClient,
  milvus,
  reranker,
  chatModel,
) {
  // 每个检索源最多召回 15 条（会在多条问句间分摊）
  const ES_K = 15;
  const MILVUS_K = 15;

  return (
    new StateGraph(HybridRetrievalState)
      // ── 节点 1：查询扩展 ─────────────────────────────
      // 用 LLM 把用户问题改写成多条角度不同的问句，存进 queryAugmentation
      .addNode("query_augment", async (state) => ({
        queryAugmentation: await augmentQuery(chatModel, state.query ?? ""),
      }))

      // ── 节点 2：ES 关键词检索 ─────────────────────────
      // 对每条问句做 multi_match（BM25 关键词）检索，再汇总去重
      .addNode("es_recall", async (state) => {
        // 拿到完整检索串列表：原始问题 + LLM 生成的问句
        const qs = retrievalQueryStrings(state.query, state.queryAugmentation);
        const n = Math.max(1, qs.length); // 问句数量（至少 1）
        // 把总预算 K 摊到每条问句上（向上取整，且至少 2 条）
        const kEach = Math.max(2, Math.ceil(ES_K / n));
        // 并行对所有问句做 ES 搜索
        const batches = await Promise.all(
          qs.map((q) =>
            esClient.search({
              index: INDEX,
              size: kEach, // 每条问句取前 kEach 条
              query: {
                multi_match: {
                  query: q,
                  // note_title 权重更高（^2），正文其次
                  fields: ["note_title^2", "note_body", "title", "content"],
                  type: "best_fields", // 取最佳字段匹配
                  analyzer: "ik_smart", // 用 IK 中文分词
                },
              },
            }),
          ),
        );
        // 展平所有批次的命中，转成 Document，按 id 去重
        const flat = batches.flatMap((res) =>
          (res.hits?.hits ?? []).map(docFromEsHit),
        );
        return { esHits: dedupeDocsById(flat) };
      })

      // ── 节点 3：Milvus 向量检索 ───────────────────────
      // 对每条问句做向量相似度检索，再汇总去重（语义召回）
      .addNode("milvus_recall", async (state) => {
        const qs = retrievalQueryStrings(state.query, state.queryAugmentation);
        const n = Math.max(1, qs.length);
        const kEach = Math.max(2, Math.ceil(MILVUS_K / n));
        // 并行对所有问句做向量检索
        const batches = await Promise.all(
          qs.map((q) => milvus.similaritySearch(q, kEach)),
        );
        const flat = batches.flat(); // 展平（Milvus 返回的已是 Document）
        return { milvusHits: dedupeDocsById(flat) };
      })

      // ── 节点 4：合并去重 ───────────────────────────────
      // 把 ES 和 Milvus 两路结果拼一起，按 id 去重（ES 优先）
      .addNode("merge", async (state) => ({
        merged: merge(state.esHits, state.milvusHits),
      }))

      // ── 节点 5：Rerank 重排 ───────────────────────────
      // 用专门的 Rerank 模型对合并后的文档按与问题的相关性精排，
      // 只保留最相关的 topN（这里 topN=3），供生成回答使用
      .addNode("rerank", async (state) => {
        const merged = state.merged ?? [];
        if (!merged.length) return { topDocuments: [] }; // 没有候选就不排
        const topDocuments = await reranker.compressDocuments(
          merged,
          state.query,
        );
        return { topDocuments };
      })

      // ── 节点 6：生成回答 ───────────────────────────────
      .addNode("generate_answer", async (state) => {
        const query = state.query ?? "";
        const docs = state.topDocuments ?? [];
        // 无检索结果：用专门的“无上下文”Prompt 诚实说明
        if (!docs.length) {
          const chain = NO_CONTEXT_PROMPT.pipe(chatModel);
          const msg = await chain.invoke({ query });
          return { answer: stringifyMessageContent(msg.content).trim() };
        }
        // 有结果：拼好上下文，用正常 Prompt 生成答案
        const chain = ANSWER_PROMPT.pipe(chatModel);
        const msg = await chain.invoke({
          query,
          context: formatDocsAsContext(docs),
        });
        return { answer: stringifyMessageContent(msg.content).trim() };
      })

      // ── 连线：定义执行顺序 ─────────────────────────────
      .addEdge(START, "query_augment") // 入口 → 查询扩展
      .addEdge("query_augment", "es_recall") // 扩展 → ES 检索
      .addEdge("query_augment", "milvus_recall") // 扩展 → Milvus 检索（与上一条并行）
      .addEdge(["es_recall", "milvus_recall"], "merge") // 两路都完成 → 合并
      .addEdge("merge", "rerank") // 合并 → 重排
      .addEdge("rerank", "generate_answer") // 重排 → 生成
      .addEdge("generate_answer", END) // 生成 → 结束
      .compile()
  ); // 编译成可执行的图
}
// ── 实例化依赖 ────────────────────────────────────────────
// ES 客户端（本地 Docker Elasticsearch）
const esClient = new Client({ node: "http://localhost:9200" });

// Milvus 向量库：连接已存在的 collection（索引名 INDEX），
// textField=doc_text（正文）、vectorField=embedding（向量列）
const milvus = await Milvus.fromExistingCollection(embeddings, {
  url: "http://localhost:19530",
  collectionName: INDEX,
  textField: "doc_text",
  vectorField: "embedding",
});

// 阿里云百炼（DashScope）的 Rerank 模型：对检索结果按相关性精排，取 topN=3
const reranker = new DashScopeRerank({
  apiKey: process.env.OPENAI_API_KEY,
  model: "qwen3-rerank",
  topN: 3,
  baseUrl:
    "https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank",
});

// 对话模型（Qwen）：用于查询改写和最终作答，温度 0.2（偏低，保证稳定性）
const chatModel = createModel(0.2);

/** 示例用户 query（字符串列表），取消注释可测试更多问题 */
const SAMPLE_QUERIES = [
  "PO-20250409-K9 滤芯订单", // 测试专有名词/订单号召回
  //   "家里无线老是断断续续的咋整啊",
  // "那个黑凉粉粉怎么冲不结块",
  // "明火炖太久汤汁又黏又涩，起锅前要怎么处理才不腻",
];

// 用上面实例化的依赖构建混合检索图
const graph = compileHybridRetrievalGraph(
  esClient,
  milvus,
  reranker,
  chatModel,
);

// 打印图的 Mermaid 结构（可复制到 mermaid.live 查看）
const drawable = await graph.getGraphAsync();
console.log(drawable.drawMermaid());
console.log();

// 逐个问题跑一遍完整流程，打印各阶段结果
for (const query of SAMPLE_QUERIES) {
  console.log(`query: ${query}`);

  // 执行整个图，得到最终 state
  const state = await graph.invoke({ query });

  // 打印：查询扩展（LLM 改写）、ES/Milvus 各召回什么、重排后留什么
  printQueryRewrite(state.query, state.queryAugmentation);
  console.log("\n（原始 JSON）", JSON.stringify(state.queryAugmentation));

  printDocs("Elasticsearch 检索", state.esHits);
  printDocs("Milvus 检索", state.milvusHits);
  printDocs("重排后保留", state.topDocuments ?? []);

  // 打印最终生成的回答
  console.log("\n=== 大模型生成回答 ===\n");
  console.log(state.answer ?? "");
}
