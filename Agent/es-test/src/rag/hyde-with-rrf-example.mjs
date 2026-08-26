/**
 * 示例：ES + Milvus + HyDE 三路检索，用 RRF 融合
 *
 * 流程：
 *   query ──┬─► ES 关键词检索 ──┐
 *           ├─► Milvus 向量检索 ──┼─► RRF 融合 ─► rerank(可选) ─► generate
 *           └─► HyDE: LLM 生成假设文档 ─► 用假设文档 embedding 检索 ─┘
 */
import { rrfFusion, printFusionResults } from "./rrf-fusion.mjs";

/**
 * 假设你已有三个检索函数（各返回 [{ id, pageContent, ... }] 按相关性排序）：
 *  - esRetrieve(query)      → ES BM25 结果
 *  - milvusRetrieve(query)  → Milvus 向量结果
 *  - hydeRetrieve(query)    → HyDE 结果（见下方 hydeRetrieve 实现）
 */
async function retrieveAndFuse(
  query,
  { esRetrieve, milvusRetrieve, hydeRetrieve },
) {
  // 三路并行检索
  const [esDocs, milvusDocs, hydeDocs] = await Promise.all([
    esRetrieve(query),
    milvusRetrieve(query),
    hydeRetrieve(query),
  ]);

  // 用 RRF 融合三路（各自内部已按相关性排序）
  const fused = rrfFusion(
    [
      { source: "es", docs: esDocs },
      { source: "milvus", docs: milvusDocs },
      { source: "hyde", docs: hydeDocs },
    ],
    { k: 60, idKey: "id" },
  );

  printFusionResults(fused);
  return fused;
}

/* ──────────────────────────────────────────────
 * HyDE 检索实现（假设文档嵌入检索）
 * ────────────────────────────────────────────── */

/**
 * 步骤 1：让 LLM 根据问题生成一篇"假设文档"（hypothetical document）
 * @param {string} query 用户问题
 * @param {import('@langchain/core/language_models/chat_models').BaseChatModel} llm
 * @returns {string} 假设文档文本
 */
export async function generateHypotheticalDocument(query, llm) {
  const res = await llm.invoke(
    `请写一篇能回答以下问题的假设性短文（类似维基百科/知识库条目的陈述风格，
     直接给出事实信息，不要提及"假设/猜测"，不要出现"用户问"等字样）：
     
问题：${query}

只输出正文，不要任何前缀或解释。`,
  );
  const text =
    typeof res.content === "string" ? res.content : JSON.stringify(res.content);
  console.log(
    `  📄 HyDE 假设文档（${text.length} 字）: ${text.slice(0, 80)}...`,
  );
  return text;
}

/**
 * 步骤 2：用假设文档的 embedding 去向量库检索
 * @param {string} hypotheticalDoc LLM 生成的假设文档
 * @param {import('@langchain/community/vectorstores/milvus').Milvus} vectorStore
 * @param {number} k
 * @returns {Promise<Array>} 检索结果（含 score，按相关性排序）
 */
export async function searchWithHypotheticalDoc(
  hypotheticalDoc,
  vectorStore,
  k = 8,
) {
  // 关键：用假设文档（而非原始 query）做相似度检索
  const docs = await vectorStore.similaritySearchWithScore(hypotheticalDoc, k);
  return docs.map(([doc, score]) => ({
    id:
      doc.metadata?.id ??
      doc.metadata?.pk ??
      `doc-${Math.random().toString(36).slice(2, 8)}`,
    pageContent: doc.pageContent,
    metadata: doc.metadata,
    score, // HyDE 源的相似度分数（RRF 里其实用不到，仅溯源用）
  }));
}

/**
 * 组合：query → HyDE 假设文档 → 检索
 */
export async function hydeRetrieve(query, { llm, vectorStore, k = 8 }) {
  const hypoDoc = await generateHypotheticalDocument(query, llm);
  return searchWithHypotheticalDoc(hypoDoc, vectorStore, k);
}
