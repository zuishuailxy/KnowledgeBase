import { tool } from "@langchain/core/tools";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { createModel } from "./create-model.mjs";
import { tools } from "./tools.mjs";
import { Chalk } from "chalk";

// chalk v5+ 移除了 chalk.Instance，改用具名导出的 Chalk 类创建自定义实例
const cl = new Chalk({ level: 3 });

const model = createModel(0);
const MAX_ITERATIONS = 30;
let iterations = 0;

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

async function run(query) {
  const messages = [new SystemMessage(prompt), new HumanMessage(query)];
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(
      `\n[Iteration ${i + 1}] Invoking model with messages:`,
      messages,
    );
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
  await run(case1);
} catch (error) {
  console.error(cl.red("[Error]"), error);
}
