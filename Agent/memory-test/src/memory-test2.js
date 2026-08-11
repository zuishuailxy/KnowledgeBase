// 长时记忆 硬盘

import "dotenv/config";
import { createModel } from "./create-model.mjs";
import { FileSystemChatMessageHistory } from "@langchain/community/stores/message/file_system";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import path from "node:path";

const model = createModel();

async function fileHistoryDemo() {
  // 指定储存文件的路径
  const filePath = path.join(process.cwd(), "chat_history.json");
  const sessionId = "user_session_001";

  const systemMessage = new SystemMessage(
    "你是个友好，幽默的做菜助手，喜欢分享美食和烹饪技巧",
  );
  // 第一轮对话
  console.log("[第一轮对话]");
  const history = new FileSystemChatMessageHistory({
    filePath,
    sessionId,
  });
  const userMessage1 = new HumanMessage("如何做红烧肉");
  await history.addMessage(userMessage1);

  const messages1 = [systemMessage, ...(await history.getMessages())];
  const response1 = await model.invoke(messages1);
  console.log(`用户: ${userMessage1.content}`);
  console.log(`助手: ${response1.content}\n`);

  await history.addMessage(response1);
  console.log(`✓ 对话已保存到文件: ${filePath}\n`);

  console.log("[第二轮对话]");
  const userMessage2 = new HumanMessage("好吃吗？");

  const messages2 = [systemMessage, ...(await history.getMessages())];
  const response2 = await model.invoke(messages2);
  await history.addMessage(response2);

  console.log(`用户: ${userMessage2.content}`);
  console.log(`助手: ${response2.content}`);
  console.log(`✓ 对话已更新到文件\n`);

  await history.addMessage(response2);
  // 展示所有历史消息
  console.log("[历史消息记录]");
  const allMessages = await history.getMessages();
  console.log(`共保存了 ${allMessages.length} 条消息：`);
  allMessages.forEach((msg, index) => {
    const type = msg.type;
    const prefix = type === "human" ? "用户" : "助手";
    console.log(
      `  ${index + 1}. [${prefix}]: ${msg.content.substring(0, 50)}...`,
    );
  });
}
fileHistoryDemo().catch(console.error);
