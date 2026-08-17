// 本地 embedding 模型（BAAI/bge-small-zh-v1.5, ONNX, 512 维）
// 使用 @huggingface/transformers 在本地运行，无需调用外部 API
import { pipeline, env } from "@huggingface/transformers";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 禁止远程下载，强制使用本地模型文件（避免访问 huggingface.co）
env.allowRemoteModels = false;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// models 目录在 Agent 根目录（本文件在 Agent/utils，上跳一级到 Agent）
const MODEL_DIR = path.join(
  __dirname,
  "..",
  "models",
  "Xenova",
  "bge-small-zh-v1.5",
);
const DEFAULT_DIMENSIONS = 512;

// 缓存 feature-extractor，避免每次调用都重新加载模型
let extractorPromise;

async function getExtractor() {
  if (!extractorPromise) {
    console.log("加载本地 embedding 模型（bge-small-zh-v1.5）...");
    extractorPromise = pipeline("feature-extraction", MODEL_DIR, {
      dtype: "q8", // 使用 int8 量化模型，CPU 推理更快
    });
  }
  return extractorPromise;
}

async function getEmbedding(text, dimensions = DEFAULT_DIMENSIONS) {
  try {
    const extractor = await getExtractor();
    const output = await extractor(text, {
      pooling: "mean", // BGE 模型使用 mean pooling
      normalize: true, // 归一化向量，配合 COSINE 距离
    });
    return Array.from(output.data).slice(0, dimensions);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

import { Embeddings } from "@langchain/core/embeddings";
class LocalEmbeddings extends Embeddings {
  async embedDocuments(documents) {
    return Promise.all(documents.map((doc) => getEmbedding(doc)));
  }
  async embedQuery(document) {
    return getEmbedding(document);
  }
}
const embeddings = new LocalEmbeddings();

export { getEmbedding, embeddings };
