import { parse } from "path";
import { get_data_from_milvus } from "./query.js";
import { createModel } from "./create-model.mjs";
import { getEmbedding } from "./get-embedding.mjs";

const COLLECTION_NAME = "ebook_collection";
const VECTOR_DIM = 1024;
const CHUNK_SIZE = 500; // 拆分到 500 个字符
const EPUB_FILE = "./天龙八部.epub";

// 从文件名提取书名（去掉扩展名）
const BOOK_NAME = parse(EPUB_FILE).name;

async function createCollection(params) {
  try {
    console.log("start connecting");
    await client.connectPromise;
    console.log("connect done");

    // 检查集合是否存在
    const hasCollection = await client.hasCollection({
      collection_name: COLLECTION_NAME,
    });
    if (hasCollection) return;

    console.log("创建集合...");
    await client.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        {
          name: "id",
          data_type: DataType.VarChar,
          max_length: 100,
          is_primary_key: true,
        },
        { name: "book_id", data_type: DataType.VarChar, max_length: 100 },
        { name: "book_name", data_type: DataType.VarChar, max_length: 200 },
        { name: "chapter_num", data_type: DataType.Int32 },
        { name: "index", data_type: DataType.Int32 },
        { name: "content", data_type: DataType.VarChar, max_length: 10000 },
        { name: "vector", data_type: DataType.FloatVector, dim: VECTOR_DIM },
      ],
    });

    console.log("旧集合已清理");
  } catch (error) {
    console.error("创建 collection 失败");
  }
}
