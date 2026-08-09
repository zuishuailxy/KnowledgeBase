import { getEmbedding } from "./get-embedding.mjs";
import { getMilvusClient } from "./get-milvus-client.js";

const COLLECTION_NAME = "test_collection";
const VECTOR_DIM = 512; // 本地 bge-small-zh-v1.5 输出 512 维
const client = getMilvusClient();

const TARGET_ID = "diary_001";
const NEW_CONTENT = "今天天气很好，但是我没出门，因为我还在学习向量数据库！";

async function updateData() {
  try {
    await client.connectPromise;

    // 1. 按主键查询目标记录（filter 里字符串值要用双引号）
    const queryResult = await client.query({
      collection_name: COLLECTION_NAME,
      filter: `id == "${TARGET_ID}"`,
      output_fields: ["id", "content", "date", "mood", "tag"],
    });
    console.log("查询结果:", JSON.stringify(queryResult.data, null, 2));

    if (queryResult.data.length === 0) {
      console.log(`未找到 id=${TARGET_ID} 的记录`);
      return;
    }
    const record = queryResult.data[0];

    // 2. content 变了 → 语义变了 → 向量必须用新 content 重新生成
    const newVector = await getEmbedding(NEW_CONTENT, VECTOR_DIM);

    // 3. upsert = delete + insert，更新整行（id 相同则覆盖旧数据）
    const upsertResult = await client.upsert({
      collection_name: COLLECTION_NAME,
      data: [
        {
          id: record.id,
          content: NEW_CONTENT,
          date: record.date,
          mood: record.mood,
          tag: record.tag,
          vector: newVector,
        },
      ],
    });
    console.log("更新结果:", JSON.stringify(upsertResult, null, 2));
  } catch (error) {
    console.error("更新失败:", error);
  }
}

updateData();
