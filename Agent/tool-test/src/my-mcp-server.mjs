import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 数据库
const database = {
  users: {
    "001": {
      id: "001",
      name: "张三",
      email: "zhangsan@example.com",
      role: "admin",
    },
    "002": { id: "002", name: "李四", email: "lisi@example.com", role: "user" },
    "003": {
      id: "003",
      name: "王五",
      email: "wangwu@example.com",
      role: "user",
    },
  },
};

const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
});

// 注册工具，查询用户信息
server.registerTool(
  "query_user",
  {
    description: "查询用户信息，输入为用户ID，输出为用户信息",
    inputSchema: {
      userId: z.string().describe("用户ID: 例如 001， 002， 003"),
    },
  },
  async ({ userId }) => {
    const user = database.users[userId];
    if (!user) {
      // 注意：SDK 1.30 要求返回 CallToolResult 对象，纯字符串会被校验拒绝
      return {
        content: [{ type: "text", text: `用户ID ${userId} 未找到` }],
      };
    }

    return {
      // 注意：MCP 现行规范字段是 content（单数），不是 contents（旧版字段）
      // 用 contents 会导致新版 SDK 客户端读到 content: [] 空结果
      content: [
        {
          type: "text",
          text: `用户ID: \n- ID: ${user.id}\n- 姓名: ${user.name}\n- 邮箱: ${user.email}\n- 角色: ${user.role}`,
        },
      ],
    };
  },
);

// 注册资源
server.registerResource(
  "使用指南",
  "docs://guide",
  {
    description: "MCP Server 使用指南",
    mimeType: "text/plain",
  },
  async () => {
    return {
      contents: [
        {
          // 注意：资源内容字段是 uri，不是 url（url 会导致 SDK 校验失败）
          uri: "docs://guide",
          mimeType: "text/plain",
          text: `欢迎使用 MCP Server！\n\n这是一个示例服务器，提供了查询用户信息的工具。\n\n可用工具：\n- query_user: 查询用户信息，输入为用户ID，输出为用户信息\n\n可用资源：\n- 使用指南: docs://guide`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
