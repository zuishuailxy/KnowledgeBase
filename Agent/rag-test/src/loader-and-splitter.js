import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embeddings } from "./get-embedding.mjs";
import { createModel } from "./create-model.mjs";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { VectorStore } from "@langchain/core/vectorstores";

const model = createModel(0);

const cheerioLoader = new CheerioWebBaseLoader(
  "https://juejin.cn/post/7669622241974632490",
  {
    selector: ".main-area p",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...",
    },
  },
);

const doc = await cheerioLoader.load();
console.log(doc);

// 文本分割器
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 50, //重叠字符数
  separators: [".", "。", "!", "！", "?", "？"],
});

// 如果是code
// const splitCode = new RecursiveCharacterTextSplitter.fromLanguage("js", {
//   chunkSize: 400,
//   chunkOverlap: 50,
// });

// 如果是文档
const splitDocs = await textSplitter.splitDocuments(doc);
console.log(`分割为 ${splitDocs.length}个chunk`);
// 向量库
console.log("创建向量库");
const vectorStore = await MemoryVectorStore.fromDocuments(
  splitDocs,
  embeddings,
);
console.log("创建向量库完毕");

// 定义 query

const questions = ["2026年 TS 发生了什么变化？"];
// RAG 流程

for (const q of questions) {
  const scoredResults = await vectorStore.similaritySearchWithScore(q, 5);
  const context = scoredResults
    .map(
      ([doc, score], i) =>
        `[片段${i + 1} 相似度:${score.toFixed(4)}]\n${doc.pageContent}`,
    )
    .join("\n\n━━━━━\n\n");
  console.log(context);

  const prompt = `你是个文档阅读助手，根据文档内容来回答：
  文档内容：${context}
  问题：${q}
  你的回答：
  `;

  // 直接使用 model.invoke
  console.log("\n【AI 回答】");
  const response = await model.invoke(prompt);
  console.log(response.content);
  console.log("\n");
}
