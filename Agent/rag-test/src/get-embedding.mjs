import { OpenAIEmbeddings } from "@langchain/openai";
import "dotenv/config";

// 注意：ChatOpenAI 是"对话模型"封装，没有 .embeddings 属性
// 取 embedding 应该用 @langchain/openai 的 OpenAIEmbeddings 类
const embeddings = new OpenAIEmbeddings({
  model: process.env.QWEN_EMBEDDING_MODEL,
  apiKey: process.env.API_KEY,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
  batchSize: 10, // Qwen Embedding API 单次最多 10 条
});

async function getEmbedding(query) {
  try {
    const vector = await embeddings.embedQuery(query);
    console.log("Embedding 维度:", vector.length);

    return vector;
  } catch (error) {
    console.error("Error:", error);
  }
}

export { getEmbedding, embeddings };
