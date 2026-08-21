import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

const createModel = (temperature) => {
  return new ChatOpenAI({
    // 兼容两种命名：优先 MODEL_NAME，回退 QWEN_MODEL_NAME
    modelName: process.env.MODEL_NAME ?? process.env.QWEN_MODEL_NAME,
    // 兼容：优先 API_KEY，回退 OPENAI_API_KEY
    apiKey: process.env.API_KEY ?? process.env.OPENAI_API_KEY,
    configuration: {
      // 兼容：优先 BASE_URL，回退 OPENAI_BASE_URL
      baseURL: process.env.BASE_URL ?? process.env.OPENAI_BASE_URL,
    },
    temperature,
  });
};

export { createModel };
