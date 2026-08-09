import { DataType, MetricType } from "@zilliz/milvus2-sdk-node";
import { getMilvusClient } from "./get-milvus-client.js";
import { getEmbedding } from "./get-embedding.mjs";
import { createModel } from "./create-model.mjs";
import { retrieveEbookRelevantContent } from "./ebook-query.js";

const COLLECTION_NAME = "ebook_collection";
const VECTOR_DIM = 512; // 本地 bge-small-zh-v1.5 输出 512 维
const client = getMilvusClient();
const LLM = createModel();

async function ebookRag(query, k) {
  try {
    console.log("=".repeat(80));
    console.log(`问题: ${query}`);
    console.log("=".repeat(80));

    // 1. 检索相关内容
    console.log("\n【检索相关内容】");
    const retrievedContent = await retrieveEbookRelevantContent(query, k);

    if (retrievedContent.length === 0) {
      console.log("未找到相关内容");
      return "抱歉，我没有找到相关的《天龙八部》内容。";
    }

    // 构建上下文
    const dynamicPrompt =
      retrievedContent.length === 0
        ? ""
        : retrievedContent
            .map((item, i) => {
              return `[片段 ${i + 1}]
章节: 第 ${item.chapter_num} 章
内容: ${item.content}`;
            })
            .join("\n\n━━━━━\n\n");

    const prompt = `你是一个专业的《天龙八部》小说助手。基于小说内容回答问题，用准确、详细的语言。
请根据以下《天龙八部》小说片段内容回答问题：
${dynamicPrompt}

用户问题: ${query}

回答要求：
1. 如果片段中有相关信息，请结合小说内容给出详细、准确的回答
2. 可以综合多个片段的内容，提供完整的答案
3. 如果片段中没有相关信息，请如实告知用户
4. 回答要准确，符合小说的情节和人物设定
5. 可以引用原文内容来支持你的回答

AI 助手的回答:`;

    // LangChain JS 不支持 Python 的 `|` 管道语法，直接用 invoke 传入完整 prompt
    const result = await LLM.invoke(prompt);
    console.log("\n【AI 回答】");
    console.log(result.content);
    console.log("\n");
  } catch (error) {
    console.error("rag 失败：", error);
  }
}

async function main() {
  try {
    console.log("连接到 Milvus...");
    await client.connectPromise;
    console.log("✓ 已连接\n");

    // 确保集合已加载
    try {
      await client.loadCollection({ collection_name: COLLECTION_NAME });
      console.log("✓ 集合已加载\n");
    } catch (error) {
      // 如果已经加载，会报错，忽略即可
      if (!error.message.includes("already loaded")) {
        throw error;
      }
      console.log("✓ 集合已处于加载状态\n");
    }

    // 问一个关于《天龙八部》的问题
    await ebookRag("段誉喜欢谁？", 5);
  } catch (error) {
    console.error("错误:", error.message);
  }
}

main();
