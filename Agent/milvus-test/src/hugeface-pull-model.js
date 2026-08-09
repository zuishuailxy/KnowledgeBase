// Hugging Face 模型下载脚本
// 用法：node src/hugeface-pull-model.js [模型名]
// 默认：BAAI/bge-small-zh-v1.5
import { listFiles } from "@huggingface/hub";
import { mkdir, writeFile, access, stat } from "node:fs/promises";
import path from "node:path";

// 模型仓库（可通过命令行参数指定）
const MODEL_NAME = process.argv[2] ?? "BAAI/bge-small-zh-v1.5";
// Hugging Face 镜像地址（国内直连 huggingface.co 不通）
// hf-mirror.com 近期较慢，默认用 gitee 镜像 hf-api.gitee.com
// 可通过环境变量 HF_ENDPOINT 覆盖
const HUB_URL = process.env.HF_ENDPOINT ?? "https://hf-api.gitee.com";
const LOCAL_DIR = path.join(process.cwd(), "models", MODEL_NAME);
const repo = { type: "model", name: MODEL_NAME };

// 判断文件是否存在
async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

// 格式化文件大小
function formatSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(2)} ${units[i]}`;
}

async function main() {
  console.log("=".repeat(60));
  console.log(`模型仓库: ${MODEL_NAME}`);
  console.log(`镜像地址: ${HUB_URL}`);
  console.log(`保存位置: ${LOCAL_DIR}`);
  console.log("=".repeat(60));

  // 1. 获取文件列表
  console.log("\n[1/2] 获取文件列表...");
  const files = [];
  for await (const f of listFiles({ repo, recursive: true, hubUrl: HUB_URL })) {
    if (f.type === "file") files.push(f);
  }
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
  console.log(`共 ${files.length} 个文件，总大小 ${formatSize(totalSize)}`);

  // 2. 逐个下载（已存在且大小一致的文件自动跳过，支持断点续传）
  console.log("\n[2/2] 开始下载...");
  let downloaded = 0;
  let skipped = 0;
  for (const file of files) {
    const localPath = path.join(LOCAL_DIR, file.path);
    if (await exists(localPath)) {
      const st = await stat(localPath);
      if (st.size === (file.size || 0)) {
        console.log(`⏭  跳过(已存在): ${file.path}`);
        skipped++;
        continue;
      }
    }

    const url = `${HUB_URL}/${MODEL_NAME}/resolve/main/${file.path}`;
    console.log(`⬇  下载: ${file.path} (${formatSize(file.size || 0)})`);
    await mkdir(path.dirname(localPath), { recursive: true });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`下载失败 HTTP ${res.status}: ${file.path}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(localPath, buf);
    downloaded++;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ 完成: 新下载 ${downloaded} 个，跳过 ${skipped} 个`);
  console.log(`模型位置: ${LOCAL_DIR}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\n❌ 下载失败:", err);
  process.exit(1);
});
