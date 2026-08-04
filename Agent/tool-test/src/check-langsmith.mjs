import "dotenv/config";
import { Client } from "langsmith";

const client = new Client();

// 1. 列出所有项目，确认 trace 落在哪个项目
console.log("LangSmith 项目列表:");
for await (const p of client.listProjects({ limit: 20 })) {
  console.log("  -", p.name, "|", p.id);
}

// 2. 列出指定项目最近的 runs（异步迭代器）
console.log(`\n项目 ${process.env.LANGSMITH_PROJECT} 最近的 runs:`);
let count = 0;
for await (const run of client.listRuns({
  projectName: process.env.LANGSMITH_PROJECT,
  limit: 5,
})) {
  console.log("  -", run.name, "|", run.run_type, "|", run.status, "|", run.id);
  count++;
  if (count >= 5) break;
}
if (count === 0) {
  console.log("  （没有找到 runs，可能 trace 进了默认项目）");
}
