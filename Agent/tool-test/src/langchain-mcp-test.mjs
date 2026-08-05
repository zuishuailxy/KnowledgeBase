import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { RunnableLambda } from "@langchain/core/runnables";
import { createModel } from "./create-model.mjs";
import { Chalk } from "chalk";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

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
  },
});

const tools = await mcpClient.getTools();
const model_with_tools = model.bindTools(tools);

// resource 可以当做系统 message 传递给 LLM
let resourceContent = "";
const res = await mcpClient.listResources();
// console.log(cl.bgYellow(`[Resource List]`), res);
for (const [name, resources] of Object.entries(res)) {
  for (const resource of resources) {
    const content = await mcpClient.readResource(name, resource.uri);
    resourceContent += content[0].text;
  }
}

async function run(query) {
  const messages = [
    new SystemMessage(resourceContent),
    new HumanMessage(query),
  ];
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
      const toolResult = await tool.invoke(call.args);
      messages.push(
        new ToolMessage({
          content: toolResult,
          tool_call_id: call.id,
        }),
      );
    }
  }
  return messages[messages.length - 1].content;
}

// await run(`查询用户信息，用户ID为 003`);
await run(`MCP Server的使用指南是什么`);

await mcpClient.close();
