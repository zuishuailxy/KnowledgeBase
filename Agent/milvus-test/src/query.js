import { MilvusClient, MetricType } from "@zilliz/milvus2-sdk-node";
import { getEmbedding } from "./get-embedding.mjs";
import { getMilvusClient } from "./get-milvus-client.js";

const COLLECTION_NAME = "test_collection";
const VECTOR_DIM = 1024;
const client = getMilvusClient();

async function get_data_from_milvus(query, k = 2) {
  try {
    await client.connectPromise;

    // 获取 query 向量
    const queryVector = await getEmbedding(query);

    // 根据 query 向量 搜索数据库
    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVector,
      limit: k,
      output_fields: ["id", "content", "date", "mood", "tag"],
      metric_type: MetricType.COSINE,
    });
    console.log(`Found ${searchResult.results.length} results:\n`);
    searchResult.results.forEach((item, index) => {
      console.log(`${index + 1}. [Score: ${item.score.toFixed(4)}]`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Date: ${item.date}`);
      console.log(`   Mood: ${item.mood}`);
      console.log(`   Tag: ${item.tag?.join(", ")}`);
      console.log(`   Content: ${item.content}\n`);
    });

    return searchResult.results;
  } catch (error) {
    console.error("查询向量数据失败：", error);
    return [];
  }
}

export { get_data_from_milvus };
