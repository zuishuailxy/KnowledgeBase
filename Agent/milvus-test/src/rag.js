import { get_data_from_milvus } from "./query.js";
import { createModel } from "./create-model.mjs";

const COLLECTION_NAME = "test_collection";
const VECTOR_DIM = 512; // 本地 bge-small-zh-v1.5 输出 512 维
const LLM = createModel();

const dynamicPrompt = (content) => {
  return content.length !== 0
    ? `请根据以下日记内容回答问题：
${content}`
    : "";
};

const createPrompt = (
  content,
  query,
) => `你是一个温暖贴心的 AI 日记助手。基于用户的日记内容回答问题，用亲切自然的语言。

${dynamicPrompt(content)}

用户问题: ${query}

回答要求：
1. 如果日记中有相关信息，请结合日记内容给出详细、温暖的回答
2. 可以总结多篇日记的内容，找出共同点或趋势
3. 如果日记中没有相关信息，请温和地告知用户
4. 用第一人称"你"来称呼日记的作者
5. 回答要有同理心，让用户感到被理解和关心

AI 助手的回答:`;

async function run_rag(query, k) {
  try {
    console.log("=".repeat(80));
    console.log(`问题: ${query}`);
    console.log("=".repeat(80));

    // 1. search from mivlus
    const data = await get_data_from_milvus(query, k);

    let content;
    if (data.length === 0) {
      console.warn("数据库中没有搜索到相关的数据");
      content = [];
    } else {
      content = data
        .map((diary, i) => {
          return `[日记 ${i + 1}]
日期: ${diary.date}
心情: ${diary.mood}
标签: ${diary.tag?.join(", ")}
内容: ${diary.content}`;
        })
        .join("\n\n━━━━━\n\n");
    }
    // 2. 把搜索结果加上构建提示词
    const prompt = createPrompt(content, query);
    console.log(prompt);
    // 3. 放入大模型，运行
    const result = await LLM.invoke(prompt);
    console.log(result.content);
  } catch (error) {
    console.error("rag 错误：", error);
  }
}

run_rag("我最近户外运动是？", 5);
