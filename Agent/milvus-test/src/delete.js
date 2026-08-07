import { getMilvusClient } from "./get-milvus-client.js";

const COLLECTION_NAME = "test_collection";
const client = getMilvusClient();

// ============ 1. 单条删除：按主键 id 删除一条 ============
async function deleteSingle(id) {
  const res = await client.delete({
    collection_name: COLLECTION_NAME,
    ids: [id],
  });
  console.log(`单条删除 ${id}: 删除 ${res.delete_cnt} 条`);
  return res;
}

// ============ 2. 批量删除：按多个主键 id 删除 ============
async function deleteBatch(ids) {
  const res = await client.delete({
    collection_name: COLLECTION_NAME,
    ids,
  });
  console.log(`批量删除 [${ids.join(", ")}]: 删除 ${res.delete_cnt} 条`);
  return res;
}

// ============ 3. 条件删除：按 filter 表达式删除 ============
async function deleteByFilter(filter) {
  const res = await client.delete({
    collection_name: COLLECTION_NAME,
    filter,
  });
  console.log(`条件删除 "${filter}": 删除 ${res.delete_cnt} 条`);
  return res;
}

// ============ 辅助：查看当前所有 id ============
async function listIds() {
  const res = await client.query({
    collection_name: COLLECTION_NAME,
    filter: 'id != ""',
    output_fields: ["id"],
  });
  return res.data.map((r) => r.id);
}

async function main() {
  try {
    await client.connectPromise;

    console.log("删除前记录:", (await listIds()).join(", "));

    // 1. 单条删除：diary_001
    await deleteSingle("diary_001");

    // 2. 批量删除：diary_002、diary_003
    await deleteBatch(["diary_002", "diary_003"]);

    // 3. 条件删除：mood 为 curious 的记录（diary_004）
    // filter: 'id in ["diary_001", "diary_002"]'   // IN 条件
    // filter: 'mood == "happy" && date >= "2026-01-11"'  // 组合条件
    // filter: 'tag contains "生活"'                  // 数组字段包含
    await deleteByFilter('mood == "curious"');

    console.log("删除后记录:", (await listIds()).join(", "));
  } catch (error) {
    console.error("删除失败:", error);
  }
}

main();
