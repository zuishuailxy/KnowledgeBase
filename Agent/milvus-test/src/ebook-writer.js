import { parse } from "path";
import { createModel } from "./create-model.mjs";
import { getEmbedding } from "../../utils/get-embedding.mjs";
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { DataType, MetricType } from "@zilliz/milvus2-sdk-node";
import { getMilvusClient } from "../../utils/get-milvus-client.js";

const COLLECTION_NAME = "ebook_collection";
const VECTOR_DIM = 512; // 本地 bge-small-zh-v1.5 输出 512 维
const CHUNK_SIZE = 500; // 拆分到 500 个字符
const CHUNK_OVER_LAP = 50;
const EPUB_FILE = "./天龙八部.epub";
const client = getMilvusClient();

// 从文件名提取书名（去掉扩展名）
const BOOK_NAME = parse(EPUB_FILE).name;
console.log(BOOK_NAME);

// 创建数据库（每次运行前删除旧集合重建，避免残留幽灵数据导致搜索异常）
async function createCollection() {
  try {
    console.log("start connecting");
    await client.connectPromise;
    console.log("connect done");

    // 释放并删除旧集合（如果存在），确保干净重建
    await client
      .releaseCollection({ collection_name: COLLECTION_NAME })
      .catch(() => {});
    await client
      .dropCollection({ collection_name: COLLECTION_NAME })
      .catch(() => console.log("旧集合不存在，无需删除"));
    console.log("旧集合已清理");

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

    console.log("集合创建完成");
  } catch (error) {
    console.error("创建 collection 失败", error);
    throw error;
  }
}

// 限制并发：每批最多 limit 个任务，避免触发 API 限流
async function mapWithConcurrency(items, limit, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(
      batch.map((item, j) => fn(item, i + j)),
    );
    results.push(...batchResults);
  }
  return results;
}

// batch insert data into vector database
async function batchInsertChunks(chunks, bookId, chapterNum) {
  try {
    if (chunks.length === 0) return 0;

    // embedding doc chunk（每次并发 10 个，避免触发 API 限流）
    const insertData = await mapWithConcurrency(
      chunks,
      10,
      async (chunk, chunkIndex) => {
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
      },
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

      // 过滤过短章节（EPUB 的封面、扉页、版权页、注释等元信息）
      if (!chapterContent || chapterContent.trim().length < 50) {
        console.log("skip short chapter (元信息/空章节)");
        continue;
      }

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

    // 所有章节插入完成后统一 flush，持久化数据（避免每章 flush 的性能开销）
    console.log("所有章节插入完成，执行 flush...");
    await client.flush({ collection_names: [COLLECTION_NAME] });
    console.log("flush done");

    return totalInserted;
  } catch (error) {
    console.error("handle epub error", error);
    throw error;
  }
}

async function main() {
  try {
    console.log("=".repeat(80));
    console.log("电子书处理程序");
    console.log("=".repeat(80));

    // 连接 Milvus
    console.log("\n连接 Milvus...");
    await client.connectPromise;
    console.log("✓ 已连接\n");

    // 设置 book_id
    const bookId = 1;

    // 确保集合存在（会先清理旧数据，避免幽灵数据）
    await createCollection();

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
