import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { RunnableLambda } from "@langchain/core/runnables";
import { createModel } from "./create-model.mjs";
import { Chalk } from "chalk";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import "dotenv/config";

const cl = new Chalk({ level: 3 });
const model = createModel();
const MAX_ITERATIONS = 30;

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "my-mcp-server": {
      command: "node",
      args: [
        "/Users/magicyoung/Documents/GitHub/KnowledgeBase/Agent/tool-test/src/my-mcp-server.mjs",
      ],
    },
    "amap-maps-streamableHTTP": {
      url: "https://mcp.amap.com/mcp?key=" + process.env.AMAP_API_KEY,
    },
    filesystem: {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        ...(process.env.ALLOW_PATHS.split(",") || ""),
      ],
    },
    "chrome-devtools": {
      command: "npx",
      args: ["-y", "chrome-devtools-mcp@latest"],
    },
  },
});

const tools = await mcpClient.getTools();
const model_with_tools = model.bindTools(tools);

// resource 可以当做系统 message 传递给 LLM
// let resourceContent = "";
// const res = await mcpClient.listResources();
// console.log(cl.bgYellow(`[Resource List]`), res);
// for (const [name, resources] of Object.entries(res)) {
//   for (const resource of resources) {
//     const content = await mcpClient.readResource(name, resource.uri);
//     resourceContent += content[0].text;
//   }
// }

// console.log(cl.bgYellow(resourceContent));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 高德 API 限流错误特征码：QPS 超限
const RATE_LIMIT_MARKERS = [
  "CUQPS_HAS_EXCEEDED_THE_LIMIT",
  "EXCEEDED_THE_LIMIT",
];

// 调用工具并自动处理限流重试（指数退避）
async function invokeWithRetry(tool, args, toolName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await tool.invoke(args);
      return result;
    } catch (err) {
      const msg = String(err?.message ?? err);
      const isRateLimit = RATE_LIMIT_MARKERS.some((marker) =>
        msg.includes(marker),
      );
      if (isRateLimit && attempt < maxRetries) {
        const delay = 1000 * attempt; // 1s、2s 退避
        console.log(
          cl.bgYellow(
            `[Tool Call] ${toolName} 触发限流，${delay}ms 后重试（第 ${attempt}/${maxRetries} 次）`,
          ),
        );
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
}

async function run(query) {
  const messages = [new HumanMessage(query)];
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(cl.bgGreen(`\n[Iteration ${i + 1}] :`));
    const response = await model_with_tools.invoke(messages);
    messages.push(response);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(
        `[Final Response] No more tool calls, final response:`,
        response.content,
      );
      return response.content;
    }

    // 逐个调用工具：单个失败不回滚全部，错误信息回喂给模型
    for (const call of response.tool_calls) {
      const tool = tools.find((t) => t.name === call.name);
      if (!tool) {
        console.error(`[Tool Call] Tool ${call.name} not found`);
        messages.push(
          new ToolMessage({
            content: `工具 ${call.name} 未找到`,
            tool_call_id: call.id,
          }),
        );
        continue;
      }
      console.log(cl.bgBlue(`[Tool Call] Invoking tool ${call.name}`));
      let toolResult = await invokeWithRetry(tool, call.args, call.name);
      //  file system 的返回可能不是 string
      if (toolResult?.text) {
        toolResult = toolResult.text;
      }

      messages.push(
        new ToolMessage({
          content: toolResult,
          tool_call_id: call.id,
        }),
      );

      // 工具之间加个小间隔，降低触发 QPS 限流的概率
      await sleep(300);
    }
  }
  return messages[messages.length - 1].content;
}
await run(
  "读取当前文件的根目录下的md文件，拿到第一个酒店的名字和图片，打开浏览器，展示酒店的图片，每个 tab 一个 url 展示，并且在把那个页面标题改为酒店名",
);

await mcpClient.close();
