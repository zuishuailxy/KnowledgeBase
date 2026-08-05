// 用 LangChain 的 | 管道符改写 mini-cousor.mjs
//
// 关键认知：`|` 组合出的是 RunnableSequence，它是"单遍"管线——每步各执行一次，不会自己循环。
// 而 agent 工具调用的本质是"模型→工具→模型→…"的反馈循环，所以：
//   1. 每一步（初始化 / 模型推理 / 工具执行）都可以封装成 RunnableLambda，用 `|` 优雅组合；
//   2. 但"循环"本身必须保留（要么显式写在 runAgent 里，要么包进一个 RunnableLambda）。
// 如果想完全不用手写循环，应该用 LangGraph 的 createReactAgent（需安装 @langchain/langgraph）。

import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { RunnableLambda } from "@langchain/core/runnables";
import { createModel } from "./create-model.mjs";
import { tools } from "./tools.mjs";
import { Chalk } from "chalk";

const cl = new Chalk({ level: 3 });
const model = createModel(0);
const MAX_ITERATIONS = 5;
const model_with_tools = model.bindTools(tools);

const prompt = `你是一个项目管理助手，使用工具完成任务。
当前工作目录: ${process.cwd()}

工具：
1. read_file: 读取文件
2. write_file: 写入文件
3. execute_command: 执行命令

重要规则 - execute_command：
- cwd 参数会自动切换到指定目录
- 当使用 cwd 时，绝对不要在 command 中使用 cd
- 错误示例: { command: "cd react-todo-app && pnpm install", cwd: "react-todo-app" }
这是错误的！因为 cwd 已经在 react-todo-app 目录了，再 cd react-todo-app 会找不到目录
- 正确示例: { command: "pnpm install", cwd: "react-todo-app" }
这样就对了！cwd 已经切换到 react-todo-app，直接执行命令即可

回复要简洁，只说做了什么`;

// ---- 把每一步封装成 RunnableLambda ----

// 1. 初始化：把用户的 query 转成初始 messages
const initMessages = RunnableLambda.from((query) => [
  new SystemMessage(prompt),
  new HumanMessage(query),
]);

// 2. 模型推理：输入 messages，输出带 tool_calls 的 AIMessage
const modelStep = RunnableLambda.from((messages) =>
  model_with_tools.invoke(messages),
);

// 3. 工具执行：输入 { messages, response }，执行所有工具并回喂 ToolMessage
const toolStep = RunnableLambda.from(async ({ messages, response }) => {
  for (const call of response.tool_calls) {
    const tool = tools.find((t) => t.name === call.name);
    const result = tool
      ? await tool.invoke(call.args)
      : `工具 ${call.name} 未找到`;
    console.log(`[Tool Call] ${call.name} -> ${String(result).slice(0, 200)}`);
    messages.push(
      new ToolMessage({ content: String(result), tool_call_id: call.id }),
    );
  }
  return messages;
});

// ---- 用 | 组合成"单遍管线"（这是 | 能做到的极限）----
// initMessages -> modelStep -> toolStep，每个输入输出类型衔接
const onePass = initMessages.pipe(modelStep).pipe(toolStep);

// ---- agent 循环仍然需要显式保留 ----
// 因为模型可能要"多轮"调用工具才能完成任务，| 无法表达这种反馈循环
async function runAgent(query) {
  // 用 | 风格初始化消息
  let messages = await initMessages.invoke(query);

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`\n[Iteration ${i + 1}]`);
    const response = await modelStep.invoke(messages);
    messages.push(response);

    // 没有工具调用 -> 结束
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`[Final Response]`, response.content);
      return response.content;
    }

    // 有工具调用 -> 执行并回喂，继续下一轮
    messages = await toolStep.invoke({ messages, response });
  }
  return messages[messages.length - 1].content;
}

const case1 = `创建一个功能丰富的 React TodoList 应用：

1. 创建项目：echo -e "n\nn" | pnpm create vite react-todo-app --template react-ts
2. 修改 src/App.tsx，实现完整功能的 TodoList：
 - 添加、删除、编辑、标记完成
 - 分类筛选（全部/进行中/已完成）
 - 统计信息显示
 - localStorage 数据持久化
3. 添加复杂样式：
 - 渐变背景（蓝到紫）
 - 卡片阴影、圆角
 - 悬停效果
4. 添加动画：
 - 添加/删除时的过渡动画
 - 使用 CSS transitions
5. 列出目录确认

注意：使用 pnpm，功能要完整，样式要美观，要有动画效果

之后在 react-todo-app 项目中：
1. 使用 pnpm install 安装依赖
2. 使用 pnpm run dev 启动服务器
`;

try {
  await runAgent(case1);
} catch (error) {
  console.error(cl.red("[Error]"), error);
}
