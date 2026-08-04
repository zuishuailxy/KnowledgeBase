import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

const createModel = (temperature) => {
  return new ChatOpenAI({
    modelName: process.env.QWEN_MODEL_NAME,
    apiKey: process.env.API_KEY,
    configuration: {
      baseURL: process.env.BASE_URL,
    },
    temperature,
  });
};

export { createModel };
