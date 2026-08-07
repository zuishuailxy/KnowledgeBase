import { getEmbedding } from "./get-embedding.mjs";
import {
  MilvusClient,
  DataType,
  MetricType,
  IndexType,
} from "@zilliz/milvus2-sdk-node";

const COLLECTION_NAME = "test_collection";
const VECTOR_DIM = 1024;

// Local Milvus
const client = new MilvusClient({ address: "localhost:19530" });

// 插入日记数据
const diaryContents = [
  {
    id: "diary_001",
    content:
      "今天天气很好，去公园散步了，心情愉快。看到了很多花开了，春天真美好。",
    date: "2026-01-10",
    mood: "happy",
    tag: ["生活", "散步"],
  },
  {
    id: "diary_002",
    content:
      "今天工作很忙，完成了一个重要的项目里程碑。团队合作很愉快，感觉很有成就感。",
    date: "2026-01-11",
    mood: "excited",
    tag: ["工作", "成就"],
  },
  {
    id: "diary_003",
    content: "周末和朋友去爬山，天气很好，心情也很放松。享受大自然的感觉真好。",
    date: "2026-01-12",
    mood: "relaxed",
    tag: ["户外", "朋友"],
  },
  {
    id: "diary_004",
    content:
      "今天学习了 Milvus 向量数据库，感觉很有意思。向量搜索技术真的很强大。",
    date: "2026-01-12",
    mood: "curious",
    tag: ["学习", "技术"],
  },
  {
    id: "diary_005",
    content:
      "晚上做了一顿丰盛的晚餐，尝试了新菜谱。家人都说很好吃，很有成就感。",
    date: "2026-01-13",
    mood: "proud",
    tag: ["美食", "家庭"],
  },
];

async function main() {
  try {
    console.log("start connecting");
    await client.connectPromise;
    console.log("connect done");

    // 0. 删除旧集合（如果存在），确保干净重建，避免脏数据/旧 schema 问题
    await client
      .dropCollection({ collection_name: COLLECTION_NAME })
      .catch(() => {});
    console.log("旧集合已清理");

    // 1. Create collection with schema
    await client.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        {
          name: "id",
          data_type: DataType.VarChar,
          is_primary_key: true,
          max_length: 100,
        },
        { name: "vector", data_type: DataType.FloatVector, dim: VECTOR_DIM },
        { name: "content", data_type: DataType.VarChar, max_length: 5000 },
        { name: "date", data_type: DataType.VarChar, max_length: 50 },
        { name: "mood", data_type: DataType.VarChar, max_length: 50 },
        {
          name: "tag",
          data_type: DataType.Array,
          element_type: DataType.VarChar,
          max_capacity: 10,
          max_length: 50,
        },
      ],
      index_params: [
        {
          field_name: "vector",
          index_type: "HNSW",
          metric_type: MetricType.COSINE,
          params: { M: 16, efConstruction: 256 },
        },
      ],
      enable_dynamic_field: true,
    });
    console.log("collection created");

    // 2. Insert data（先插入数据）
    const diaryData = await Promise.all(
      diaryContents.map(async (data) => ({
        ...data,
        vector: await getEmbedding(data.content, VECTOR_DIM),
      })),
    );
    const insertResult = await client.insert({
      collection_name: COLLECTION_NAME,
      data: diaryData,
    });
    console.log(JSON.stringify(insertResult, null, 2));

    // 3. Flush：持久化数据并构建索引（不 flush 的话数据只在增长段，索引覆盖不全）
    await client.flush({ collection_names: [COLLECTION_NAME] });
    console.log("flush done");

    // 4. Load into memory（搜索/查询前必须加载）
    await client.loadCollection({ collection_name: COLLECTION_NAME });
    console.log("collection loaded");

    // 4. Search
    // const results = await client.search({
    //   collection_name: COLLECTION_NAME,
    //   data: [
    //     ...(await getEmbedding(
    //       "晚上做了一顿丰盛的晚餐，尝试了新菜谱。家人都说很好吃，很有成就感。",
    //       VECTOR_DIM,
    //     )),
    //   ],
    //   limit: 10,
    //   output_fields: ["content"],
    // });
    // console.log("query:", results);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
