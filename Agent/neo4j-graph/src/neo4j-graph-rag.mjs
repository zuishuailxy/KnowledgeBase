/**
 * Neo4j GraphRAG：基于知识图谱的检索增强生成
 *
 * 核心思路（Text-to-Cypher）：
 *   1. 用户自然语言问题 → LLM 生成 Cypher 查询语句
 *   2. 用 Cypher 查询 Neo4j 知识图谱（奶茶产品/配料/类型/工艺/人群）
 *   3. 把查询结果作为上下文，让 LLM 生成最终回答
 *
 * LangGraph 工作流（线性三步）：
 *   START → generateCypher → executeGraph → generateAnswer → END
 *
 * 与向量 RAG 的区别：这里检索的是「结构化图数据」，而不是文本片段；
 * 图谱的节点/关系本身就是知识，能回答多跳关系类问题（如“某奶茶包含什么配料”）。
 */
import "dotenv/config"; // 加载 .env 环境变量
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph"; // LangChain 封装的 Neo4j 图客户端
import { createModel } from "../../utils/create-model.mjs"; // 统一的 Qwen 模型工厂
import { StateGraph, END, START } from "@langchain/langgraph"; // LangGraph 状态机
import { HumanMessage } from "@langchain/core/messages"; // LangChain 消息类（用户消息）

// ----------------------
// 连接 Neo4j 知识图谱
// ----------------------
const graph = new Neo4jGraph({
  url: "bolt://localhost:7687", // Neo4j Bolt 协议地址（本地 Docker）
  username: "neo4j",
  password: "12345678",
});

// ----------------------
// 大模型
// ----------------------
// 创建 Qwen 对话模型（temperature=0，让生成更确定、可控，适合 Cypher 生成）
const llm = createModel(0);

// ----------------------
// 定义 LangGraph 共享状态（State）
// ----------------------
const state = {
  // messages: 对话消息列表，带自定义 reducer（累积拼接）
  messages: {
    // value 是 LangGraph 的自定义合并函数：新消息拼到旧消息后面
    value: (left, right) => left.concat(Array.isArray(right) ? right : [right]),
    default: () => [], // 无初始值时默认空数组
  },
  cypher: null, // 步骤1 生成的 Cypher 查询语句
  context: null, // 步骤2 图查询返回的结果（JSON 字符串）
  answer: null, // 步骤3 最终生成的回答
};

/**
 * 从状态里取出用户的最后一条问题文本。
 * 因为 messages 是数组，最后一条就是当前用户问题。
 */
function userQuery(state) {
  const last = state.messages[state.messages.length - 1];
  return last.content;
}

// ----------------------
// 步骤1：生成 Cypher
// ----------------------
/**
 * 把用户自然语言问题转成 Cypher 查询语句。
 * 通过 prompt 向 LLM 描述图结构（节点/关系/方向），让它生成可执行的 Cypher。
 */
async function generateCypher(state) {
  const prompt = `
      你是一个专业的 Neo4j Cypher 生成器。
      严格按照下面的结构生成正确语句，只返回纯 Cypher 代码，不要任何解释、不要标点、不要 markdown。
  
      节点：
      - Product: 奶茶产品
      - Ingredient: 配料
      - Type: 奶茶类型
      - Method: 制作工艺
      - People: 适合人群
  
      关系方向（必须严格遵守）：
      - (Product)-[:属于]->(Type)
      - (Product)-[:包含]->(Ingredient)
      - (Product)-[:适合]->(People)
      - (Ingredient)-[:使用]->(Method)
  
      规则：
      1. 关系方向绝对不能反
      2. 多跳查询请使用多个 MATCH，不要连错路径
      3. 只返回最终可运行的 Cypher 语句
  
      用户问题：${userQuery(state)}
    `;
  // 把 prompt 作为用户消息发给 LLM
  const res = await llm.invoke([new HumanMessage(prompt)]);
  // 返回生成的 Cypher（res.content 可能是字符串或数组，通常为字符串）
  return { cypher: res.content };
}

// ----------------------
// 步骤2：执行图查询
// ----------------------
/**
 * 用步骤1生成的 Cypher 查询 Neo4j 图，把结果 JSON 化作为上下文。
 * 查询失败时返回占位文案，不让流程中断。
 */
async function executeGraphQuery(state) {
  try {
    const res = await graph.query(state.cypher); // 执行 Cypher
    return { context: JSON.stringify(res) }; // 结果转 JSON 字符串存入 context
  } catch (e) {
    // Cypher 语法错误 / 图里没数据等 → 不抛错，给个友好占位
    return { context: "未查询到相关知识" };
  }
}

// ----------------------
// 步骤3：生成答案
// ----------------------
/**
 * 把图查询结果（context）作为检索上下文，让 LLM 生成面向用户的回答。
 * 约束：只依据图谱事实回答，不编造未出现的配料。
 */
async function generateAnswer(state) {
  const prompt = `
    你是奶茶专家，根据下方「检索结果」回答用户问题；检索结果为空或不足时简要说明无法从图谱得到答案，不要编造。
    回答要求：
    - 直接列出事实，不要推断图谱里未出现的配料（如水、冰、添加剂等）。

    检索结果：${state.context}
    用户问题：${userQuery(state)}
  `;
  const res = await llm.invoke([new HumanMessage(prompt)]);
  return { answer: res.content }; // 最终回答写入 state.answer
}

// ----------------------
// 构建 LangGraph 工作流
// ----------------------
// 线性三步流水线：生成 Cypher → 查图 → 作答
const workflow = new StateGraph({ channels: state })
  .addNode("generateCypher", generateCypher) // 节点1：问题 → Cypher
  .addNode("executeGraph", executeGraphQuery) // 节点2：Cypher → 图查询结果
  .addNode("generateAnswer", generateAnswer) // 节点3：查询结果 → 回答
  .addEdge(START, "generateCypher") // 入口 → 生成 Cypher
  .addEdge("generateCypher", "executeGraph") // 生成 Cypher → 查图
  .addEdge("executeGraph", "generateAnswer") // 查图 → 生成答案
  .addEdge("generateAnswer", END); // 生成答案 → 结束

const app = workflow.compile(); // 编译成可执行的图

/** 打印工作流的 Mermaid 图（可复制到 mermaid.live 查看） */
async function printWorkflowMermaid() {
  const drawable = await app.getGraphAsync();
  const mermaid = drawable.drawMermaid({ withStyles: true });
  console.log("--- LangGraph 工作流 (Mermaid) ---");
  console.log(mermaid);
  console.log("-----------------------------------------------------------");
}

// ----------------------
// 运行 GraphRAG
// ----------------------
/**
 * 跑一遍完整流程（生成 Cypher → 查图 → 作答），并打印各阶段产物。
 * @param {string} question 用户自然语言问题
 */
async function runGraphRAG(question) {
  // 调用编译好的图，传入含用户问题的 messages
  const res = await app.invoke({
    messages: [new HumanMessage(question)],
  });

  console.log("======================================");
  console.log("用户问题：", question);
  console.log("生成 Cypher：", res.cypher);
  console.log("检索结果：", res.context);
  console.log("最终回答：", res.answer);
  console.log("======================================");
}

// ======================
// 测试：打印流程图 + 并发跑 3 个问题
// ======================
(async () => {
  await printWorkflowMermaid();
  // 并发测试 3 个问题（注意：并发可能对 Qwen 网关造成压力）
  await Promise.all([
    runGraphRAG("我们这款珍珠奶茶有哪些配料？"),
    runGraphRAG("台式奶茶的饮品都有哪些配料？"),
    runGraphRAG("珍珠奶茶适合哪些人群饮用？"),
  ]);
})().catch(console.error);
