import { DataType, MetricType } from "@zilliz/milvus2-sdk-node";
import { getMilvusClient } from "./get-milvus-client.js";
import { getEmbedding } from "./get-embedding.mjs";

const COLLECTION_NAME = "ebook_collection";

const client = getMilvusClient();

async function retrieveEbookRelevantContent(query, k = 3) {
  try {
    console.log("Connecting to Milvus...");
    await client.connectPromise;
    console.log("✓ Connected\n");

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

    // 向量搜索
    console.log("Searching for similar ebook content...");

    console.log(`Query: "${query}"\n`);

    const queryVector = await getEmbedding(query);
    const searchRes = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVector,
      limit: k,
      metric_type: MetricType.COSINE,
      output_fields: ["id", "book_id", "chapter_num", "index", "content"],
    });

    searchRes.results.forEach((item, index) => {
      console.log(`${index + 1}. [Score: ${item.score.toFixed(4)}]`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Book ID: ${item.book_id}`);
      console.log(`   Chapter: 第 ${item.chapter_num} 章`);
      console.log(`   Index: ${item.index}`);
      console.log(`   Content: ${item.content}\n`);
    });

    return searchRes.results;
  } catch (error) {
    console.error("检索内容失败：", error);
  }
}
// const query = "鸠摩智会什么武功？";
// run(query);

export { retrieveEbookRelevantContent };
