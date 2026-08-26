import { createAgent, HumanMessage } from "langchain";
import { createModel } from "../utils/create-model.mjs";
import { createSummarizationMiddleware, FilesystemBackend } from "deepagents";

const backend = new FilesystemBackend({ rootDir: "./tmp-ws", virtualMode: true });
const agent = createAgent({
  model: createModel(0),
  tools: [],
  systemPrompt: "你是会话助手。记住用户提到的关键事实，中文简短回答。",
  middleware: [
    createSummarizationMiddleware({
      model: createModel(0),
      backend,
      historyPathPrefix: "/conversation_history",
      trigger: { type: "messages", value: 8 },
      keep: { type: "messages", value: 4 },
    }),
  ],
});

const { messages } = await agent.invoke(
  { messages: [new HumanMessage("请记住：我的宠物猫叫小橘。")] },
  { recursionLimit: 10 },
);
const last = messages.at(-1);
console.log("type:", last.type);
console.log("name:", JSON.stringify(last.name));
console.log("content:", JSON.stringify(last.content));
console.log("additional_kwargs keys:", Object.keys(last.additional_kwargs ?? {}));
console.log("tool_calls:", JSON.stringify(last.tool_calls));
