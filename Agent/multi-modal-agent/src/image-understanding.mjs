/**
 * 图像理解 — qwen-vl-plus
 * DashScope OpenAI 兼容接口 + ChatOpenAI
 *
 * 注意：DashScope 云端无法访问本地 OSS（localhost 指向云端自己），
 * 必须先从本地 OSS 拉取图片，转成 base64 data URI 内联传给模型。
 */
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// 本地 S3 兼容 OSS（RustFS / MinIO）客户端
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT, // http://localhost:9000/（S3 API 端口）
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  signatureVersion: "v4",
  region: "aaa", // 本地私有存储随便填
});

/**
 * 从本地 OSS 读取对象并转为 base64 data URI
 * @param {string} bucket 桶名
 * @param {string} key 对象路径，如 aaa/bbb/first.png
 * @param {string} mime 图片 MIME 类型
 * @returns {Promise<string>} data:image/png;base64,xxxx
 */
async function objectToDataUrl(bucket, key, mime = "image/png") {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3Client.send(cmd);
  const bytes = await res.Body.transformToByteArray();
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${mime};base64,${base64}`;
}

const bucket = "hello";
const key = "aaa/bbb/first.png";
const imageUrl = await objectToDataUrl(bucket, key);

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "qwen-vl-plus",
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const response = await model.invoke([
  new HumanMessage({
    content: [
      { type: "text", text: "详细描述这张图片的内容" },
      { type: "image_url", image_url: { url: imageUrl } },
    ],
  }),
]);

console.log("model: qwen-vl-plus");
console.log(response.content);
