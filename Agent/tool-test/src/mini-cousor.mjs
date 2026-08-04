import { tool } from "@langchain/core/tools";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import fs from "node:fs/promises";
import { z } from "zod";
import { createModel } from "./create-mode.mjs";

const model = createModel(0.2);
const MAX_ITERATIONS = 5;
let iterations = 0;

// define tool
// 注意：@langchain/core v1 的 tool 签名是 tool(func, fields) 两个参数
const fileReadTool = tool(
  async ({ path }) => {
    const content = await fs.readFile(path, "utf-8");
    console.log(
      `[Tool] Read file content from ${path}, the length is`,
      content.length,
    );
    return content;
  },
  {
    name: "file_read",
    description:
      "当用户需要读取文件内容，查看代码，分析文件内容时使用此工具。输入为文件路径(相对或者绝对路径)，输出为文件内容。",
    schema: z.object({
      path: z.string().describe("The path to the file to read"),
    }),
  },
);

const Tools = [fileReadTool];
const model_with_tools = model.bindTools(Tools);

const prompt = `你是一个代码助手，可以使用工具读取文件并解释代码。
工作流程：
1. 当用户要求读取文件时，立即调用工具
2. 等待工具返回文件内容
3. 读取文件内容后，分析并给出解释

可用工具：
- file_read: 读取文件内容，输入为文件路径，输出为文件内容
`;

const messages = [
  new SystemMessage(prompt),
  new HumanMessage(
    "请读取 /Users/magicyoung/Documents/GitHub/KnowledgeBase/Agent/tool-test/src/tool-file-read.mjs 文件内容,然后解释内容",
  ),
];

let response = await model_with_tools.invoke(messages);
messages.push(response);

while (response.tool_calls?.length > 0) {
  if (iterations >= MAX_ITERATIONS) {
    console.log("[Tool Call] Reached max iterations, stopping tool calls.");
    break;
  }
  iterations++;

  console.log("[Tool Call] Invoking tool:", response.tool_calls[0].name);

  // 逐个调用工具：单个失败不回滚全部，错误信息回喂给模型
  const toolResults = await Promise.all(
    response.tool_calls.map(async (call) => {
      const tool = Tools.find((t) => t.name === call.name);
      if (!tool) {
        return { ok: false, error: `Tool ${call.name} not found` };
      }
      console.log("[Tool Call] Tool invoke:", call.name, call.args);
      try {
        const result = await tool.invoke(call.args);
        return { ok: true, result };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }),
  );

  // ToolMessage 必须带 tool_call_id，模型才知道结果对应哪次调用
  response.tool_calls.forEach((call, index) => {
    const r = toolResults[index];
    messages.push(
      new ToolMessage({
        content: r.ok ? r.result : `工具执行失败: ${r.error}`,
        tool_call_id: call.id,
      }),
    );
  });

  // 关键：把工具结果发给模型，拿它的下一轮回复（必须在循环内更新 response）
  response = await model_with_tools.invoke(messages);
}

// 循环结束后打印最终答案（无工具调用时也会走到这里）
console.log("最终回复:", response.content);
