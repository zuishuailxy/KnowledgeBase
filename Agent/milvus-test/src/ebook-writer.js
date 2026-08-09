import { parse } from "path";
import { get_data_from_milvus } from "./query.js";
import { createModel } from "./create-model.mjs";
import { getEmbedding } from "./get-embedding.mjs";
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { DataType, MetricType } from "@zilliz/milvus2-sdk-node";
import { getMilvusClient } from "./get-milvus-client.js";

const COLLECTION_NAME = "ebook_collection";
const VECTOR_DIM = 1024;
const CHUNK_SIZE = 500; // 拆分到 500 个字符
const CHUNK_OVER_LAP = 50;
const EPUB_FILE = "./天龙八部.epub";
const client = getMilvusClient();

// 从文件名提取书名（去掉扩展名）
const BOOK_NAME = parse(EPUB_FILE).name;
console.log(BOOK_NAME);

// 创建数据库
async function createCollection(params) {
  try {
    console.log("start connecting");
    await client.connectPromise;
    console.log("connect done");

    // 检查集合是否存在（SDK v3 返回 { status, value }，需取 .value）
    const hasCollection = await client.hasCollection({
      collection_name: COLLECTION_NAME,
    });
    if (hasCollection.value) return;

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
      index_params: [
        {
          field_name: "vector",
          index_type: "HNSW",
          metric_type: MetricType.COSINE,
          params: { M: 16, efConstruction: 256 },
        },
      ],
    });

    console.log("旧集合已清理");
  } catch (error) {
    console.error("创建 collection 失败");
  }
}

// batch insert data into vector database
async function batchInsertChunks(chunks, bookId, chapterNum) {
  try {
    if (chunks.length === 0) return 0;

    // embedding doc chunk and insert into database
    const insertData = await Promise.all(
      chunks.map(async (chunk, chunkIndex) => {
        const vector = await getEmbedding(chunk);

        return {
          id: `${bookId}_${chapterNum}_${chunkIndex}`,
          book_id: String(bookId),
          book_name: BOOK_NAME,
          chapter_num: chapterNum,
          index: chunkIndex,
          content: chunk,
          vector,
        };
      }),
    );

    // insert into milvus
    const insertRes = await client.insert({
      collection_name: COLLECTION_NAME,
      data: insertData,
    });

    return Number(insertRes.insert_cnt) || 0;
  } catch (error) {
    console.error("insert error", error);
    throw error;
  }
}

// load epub
async function loadAndProcessEpub(bookId) {
  try {
    console.log("start loading EPUB");
    // load epub and split
    const loader = new EPubLoader(EPUB_FILE, {
      splitChapters: true,
    });
    const documents = await loader.load();
    const docLength = documents.length;
    console.log(`load done, total ${docLength} chapters`);

    // split chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVER_LAP,
    });

    // loop documents and split into small part
    let totalInserted = 0;
    for (let i = 0; i < docLength; i++) {
      const chapter = documents[i];
      const chapterContent = chapter.pageContent;
      console.log(`processing ${i + 1} / ${docLength}`);

      // use splitter to split again
      const chunks = await textSplitter.splitText(chapterContent);
      console.log(`split into ${chunks.length} parts`);
      if (chunks.length === 0) {
        console.log("skip null chapter");
        continue;
      }

      console.log("insert into vector database...");

      const insertedCount = await batchInsertChunks(chunks, bookId, i + 1);
      totalInserted += insertedCount;
      console.log(
        `inserted ${insertedCount} records, (total: ${totalInserted})`,
      );
    }

    return totalInserted;
  } catch (error) {
    console.error("handle epub error", error);
    throw error;
  }
}

async function main(params) {
  try {
    console.log("=".repeat(80));
    console.log("电子书处理程序");
    console.log("=".repeat(80));

    // 连接 Milvus
    console.log("\n连接 Milvus...");
    await client.connectPromise;
    console.log("✓ 已连接\n");

    // 设置 book_id（
    const bookId = 1;

    // 确保集合存在
    await createCollection(bookId);

    // 加载和处理 EPUB 文件（流式处理，边处理边插入）
    await loadAndProcessEpub(bookId);

    console.log("=".repeat(80));
    console.log("处理完成！");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("\n错误:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
