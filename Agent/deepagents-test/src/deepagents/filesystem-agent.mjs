import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createModel } from "../../../utils/create-model.mjs";
import { createAgent, HumanMessage } from "langchain";
import { createFilesystemMiddleware, FilesystemBackend } from "deepagents";

const workspaceDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "workspace",
);

/** 先匹配先生效；未命中任何规则则默认允许 */
const permissions = [
  { operations: ["read"], paths: ["/secret.txt"], mode: "deny" },
  { operations: ["write"], paths: ["/todo.md"], mode: "allow" },
  { operations: ["write"], paths: ["/**"], mode: "deny" },
];

fs.rmSync(workspaceDir, { recursive: true, force: true });
fs.mkdirSync(workspaceDir);
fs.writeFileSync(
  path.join(workspaceDir, "secret.txt"),
  "机密：不得读取",
  "utf8",
);

const model = createModel(0);

const agent = createAgent({
  model,
  tools: [],
  systemPrompt:
    "工作区根路径为 /。用 ls、read_file、write_file、edit_file 操作文件，路径以 / 开头。中文回答。",
  middleware: [
    createFilesystemMiddleware({
      backend: new FilesystemBackend({
        rootDir: workspaceDir,
        virtualMode: true,
      }),
      permissions,
    }),
  ],
});

console.log("工作区:", workspaceDir);
console.log("权限:", JSON.stringify(permissions, null, 2));

async function run(label, prompt) {
  console.log(`\n=== ${label} ===\n`, prompt, "\n");
  const { messages } = await agent.invoke(
    { messages: [new HumanMessage(prompt)] },
    { recursionLimit: 20 },
  );
  for (const m of messages) {
    for (const t of m.tool_calls ?? []) console.log("→", t.name);
  }
  console.log("回复:", messages.at(-1)?.content);
}

async function expectDenied(label, prompt) {
  console.log(`\n=== ${label}（预期拒绝）===\n`, prompt, "\n");
  const { messages } = await agent.invoke(
    { messages: [new HumanMessage(prompt)] },
    { recursionLimit: 5 },
  );

  // deepagents 的 deny 实现为「工具返回 Error: permission denied 给模型」，不抛异常
  // 所以这里检查工具调用结果里是否出现拒绝标记
  const deniedMsg = messages.find(
    (m) =>
      typeof m.content === "string" &&
      /permission denied|not allowed/i.test(m.content),
  );

  console.log(
    deniedMsg ? "✗ 已被拒绝: " + deniedMsg.content : "未触发拒绝（异常）",
  );
  console.log("回复:", messages.at(-1)?.content);
}

await run(
  "允许的操作",
  "write_file 创建 /todo.md（三条待办），edit_file 把第一条标为完成，ls /，一句话总结。",
);

await expectDenied("禁止读", "只调用 read_file，路径 /secret.txt。");
await expectDenied("禁止写", "只调用 write_file，路径 /hack.txt，内容 test。");
