/**
 * 基于 Redis 的 Agent 短期记忆（Short-term Memory）
 *
 * 核心模式：把 Agent 的完整对话历史（messages）存到 Redis，
 * 让 Agent 在多次调用之间“记得”之前聊过什么。
 *
 * 工作流：
 * - invoke 前：从 Redis 读取该会话的 messages（历史记忆）
 * - invoke 后：把 agent 返回的 messages 写回 Redis（带 TTL 过期时间）
 * - 压缩：当消息超过阈值时，由 langchain 的 summarizationMiddleware
 *   在 agent 内部把旧消息压缩成一段摘要，避免上下文无限膨胀
 *
 * 前置条件：先启动 Redis 容器
 *   docker compose up -d redis
 *
 * 运行：
 *   node src/agent-with-redis-memory.mjs
 * 交互命令：
 *   exit / quit / :q  退出
 *   :clear            清空当前会话记忆
 */

// dotenv/config：自动加载项目根目录的 .env 文件到 process.env，
// 这样下面的 REDIS_* / MEMORY_* 等配置就能从环境变量里读取
import "dotenv/config";

// ioredis：Redis 的 Node 客户端（支持 Promise 与集群等高级特性）
import Redis from "ioredis";

// readline/promises：Node 内置的“逐行读取终端输入”的 Promise 版本，
// 用于在命令行里和用户交互（一问一答）
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

// createModel：本地封装，用来统一创建 LLM 模型实例（参数 0 通常是模型配置下标）
import { createModel } from "../../utils/create-model.mjs";

// @langchain/core/messages 提供的两条转换函数：
// - mapChatMessagesToStoredMessages：把 LangChain 的 ChatMessage 数组
//   序列化成可安全 JSON 存储的普通对象数组（写库用）
// - mapStoredMessagesToChatMessages：反过来，把存库对象还原成
//   ChatMessage 数组（读库用）
import {
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
} from "@langchain/core/messages";

// langchain 核心 API：
// - createAgent：创建可带 middleware 的 Agent
// - HumanMessage：表示“人类用户消息”的消息类型
// - summarizationMiddleware：对话压缩中间件，负责把过长历史压成摘要
import { createAgent, HumanMessage, summarizationMiddleware } from "langchain";

// ───────────────────────── 配置项（可用环境变量覆盖）─────────────────────────
// Redis 连接配置：host 默认 localhost，端口 6379，默认库 0
const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);
const REDIS_DB = Number(process.env.REDIS_DB ?? 0);

// 记忆过期时间（秒）：默认 1800 秒（30 分钟）后自动清除，
// 实现“短期记忆”——聊天的记忆不会永久保留
const MEMORY_TTL = Number(process.env.MEMORY_TTL_SECONDS ?? 1800);

// Redis Key 前缀：所有记忆 key 都会以它为开头，便于区分不同业务
// 例如：agent:short_memory:demo_user_001:messages
const KEY_PREFIX = process.env.MEMORY_KEY_PREFIX ?? "agent:short_memory";

// 会话 ID：用于区分不同用户/不同会话的记忆，互不串扰
const SESSION_ID = process.env.MEMORY_SESSION_ID ?? "demo_user_001";

// 摘要提示词模板：交给 LLM，把旧对话压缩成结构化摘要。
// 其中 {messages} 会被替换成实际的对话内容。
// 设计要点：要求“保留原文信息（姓名/偏好/日期）”“不编造”，
// 避免 LLM 在压缩过程中丢失关键事实或幻觉出不存在的内容
const summaryPrompt = `你是对话摘要助手。请用中文总结以下对话，包含：
1. 讨论的主要话题
2. 用户提到的重要事实（姓名、偏好、日期等，务必保留原文信息）
3. 继续对话所需的关键上下文

保持简洁，不要编造，不要遗漏用户明确说过的信息。

待摘要的对话：
{messages}

摘要：`;

/**
 * RedisMessageStore：封装“把消息存到 Redis / 从 Redis 读回”的存储层。
 *
 * 职责：
 * - 构造 key（每个会话一个 key）
 * - 序列化/反序列化消息（依赖 @langchain/core 的转换函数）
 * - 写入时带上 TTL（过期自动清理）
 *
 * 好处：上层（invokeWithMemory / Agent）不用关心 Redis 细节，
 * 只调用 loadMessages / saveMessages 即可。
 */
class RedisMessageStore {
  constructor({ redis, keyPrefix, ttlSeconds }) {
    this.redis = redis; // Redis 客户端实例
    this.keyPrefix = keyPrefix; // key 前缀
    this.ttlSeconds = ttlSeconds; // 过期秒数
  }

  // 生成某个会话对应的 Redis key：
  //   例：agent:short_memory:demo_user_001:messages
  messagesKey(sessionId) {
    return `${this.keyPrefix}:${sessionId}:messages`;
  }

  // 读取某个会话的历史消息
  // 1. 从 Redis 取原始 JSON 字符串
  // 2. 若无数据则返回空数组（首次对话）
  // 3. 有数据则 JSON.parse 后，再还原成 ChatMessage 对象数组
  async loadMessages(sessionId) {
    const raw = await this.redis.get(this.messagesKey(sessionId));
    if (!raw) return [];
    return mapStoredMessagesToChatMessages(JSON.parse(raw));
  }

  // 写入某个会话的消息（带 TTL 过期）
  // 1. 先把 ChatMessage 数组转成可 JSON 序列化的普通对象
  // 2. JSON.stringify 成字符串
  // 3. 用 SET key value EX ttl 写入 Redis，并设置过期时间
  async saveMessages(sessionId, messages) {
    const payload = JSON.stringify(mapChatMessagesToStoredMessages(messages));
    await this.redis.set(
      this.messagesKey(sessionId),
      payload,
      "EX", // Redis 的 EX 参数：设置过期时间（秒）
      this.ttlSeconds,
    );
  }

  // 清空某个会话的记忆（删除 key）
  async clear(sessionId) {
    await this.redis.del(this.messagesKey(sessionId));
  }

  // 查询某个会话记忆剩余的有效秒数（TTL）
  async ttl(sessionId) {
    return this.redis.ttl(this.messagesKey(sessionId));
  }
}

/**
 * invokeWithMemory：带记忆的一次对话调用。
 *
 * 三步：
 * 1. 从 Redis 加载历史 → 拼上本轮用户消息
 * 2. 调 agent.invoke（内部可能触发摘要压缩）
 * 3. 把 agent 返回的完整消息数组写回 Redis
 *
 * 关键点：保存的是 result.messages（完整的新历史），
 * 而不是只保存新回复，这样下一次调用能拿到全部上下文。
 */
async function invokeWithMemory(agent, store, sessionId, userText) {
  // ① 读记忆：取出该会话历史消息
  const history = await store.loadMessages(sessionId);
  console.log(`  ↳ 从 Redis 加载 ${history.length} 条历史`);

  // ② 调 Agent：历史 + 本轮用户消息一起传入。
  //    recursionLimit: 30 限制 Agent 内部工具/递归调用的最大层数，
  //    防止无限循环（本脚本无工具，但保留为安全上限）
  const result = await agent.invoke(
    { messages: [...history, new HumanMessage(userText)] },
    { recursionLimit: 30 },
  );

  // ③ 写记忆：把包含本轮在内的完整对话写回 Redis，并查询剩余 TTL
  await store.saveMessages(sessionId, result.messages);
  const ttl = await store.ttl(sessionId);
  console.log(`  ↳ 写回 Redis ${result.messages.length} 条 (TTL ${ttl}s)`);

  return result;
}

// 创建 Redis 客户端实例（连接参数来自上面的配置）
const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, db: REDIS_DB });

// 监听连接/错误事件，便于在终端看到 Redis 状态
redis.on("connect", () => console.log("✅ Redis 已连接"));
redis.on("error", (err) => console.error("❌ Redis 错误:", err.message));

// 用 Redis 客户端 + 配置实例化消息存储层
const store = new RedisMessageStore({
  redis,
  keyPrefix: KEY_PREFIX,
  ttlSeconds: MEMORY_TTL,
});

// 创建 LLM 模型实例（0 = 选择 create-model.mjs 里的第 0 个模型配置）
const model = createModel(0);

/**
 * 创建 Agent：
 * - model：用到的 LLM
 * - tools：工具列表（本示例为空，Agent 只做对话）
 * - systemPrompt：系统提示词，告诉 Agent 要“记住关键事实、
 *   若消息里有摘要则据此继续”
 * - middleware：中间件数组。这里挂了 summarizationMiddleware（对话压缩）：
 *     · trigger: { messages: 8 } → 当消息总数达到 8 条时触发压缩
 *     · keep: { messages: 4 }   → 压缩后保留最近 4 条原文
 *     作用：历史太长时，把旧消息压成一段 summaryPrompt 生成的摘要，
 *     保证长期对话不撑爆上下文窗口
 */
const agent = createAgent({
  model,
  tools: [],
  systemPrompt:
    "你是会话助手。记住用户提到的关键事实，中文简短回答。若消息中有对话摘要，请据此继续对话。",
  middleware: [
    summarizationMiddleware({
      model,
      summaryPrompt,
      trigger: { messages: 8 },
      keep: { messages: 4 },
    }),
  ],
});

console.log("输入 exit / quit / :q 退出，:clear 清空记忆\n");

// 创建命令行交互接口：从 stdin 读、往 stdout 写
const rl = readline.createInterface({ input: stdin, output: stdout });

// 记录启动时已存在的消息数，用于后续判断是否触发了压缩
//（若某轮后消息数增长不足 2 条，说明旧消息被摘要替换了）
let prevCount = (await store.loadMessages(SESSION_ID)).length;

try {
  // 主循环：一问一答，直到用户输入退出命令
  while (true) {
    const userText = (await rl.question("你: ")).trim();
    if (!userText) continue; // 空输入则跳过

    // 退出命令：exit / quit / :q（大小写不敏感）
    if (["exit", "quit", ":q"].includes(userText.toLowerCase())) break;

    // 清空命令：删除当前会话的 Redis 记忆
    if (userText === ":clear") {
      await store.clear(SESSION_ID);
      prevCount = 0;
      console.log("已清空当前会话记忆\n");
      continue;
    }

    // 带记忆调用 Agent
    const { messages } = await invokeWithMemory(
      agent,
      store,
      SESSION_ID,
      userText,
    );
    console.log("\n助手:", messages.at(-1)?.content); // 打印最后一条（助手回复）
    console.log(`当前消息数: ${messages.length}`);

    // 压缩检测：若消息数相比上一轮增长不足 2 条，
    // 说明中间件把旧消息替换成了摘要 → 已触发压缩
    if (messages.length < prevCount + 2) {
      console.log("  ⚡ 已触发压缩");
    }
    prevCount = messages.length;
    console.log();
  }
} finally {
  rl.close(); // 无论正常退出还是异常，都关闭 readline，避免进程挂起
}

await redis.quit(); // 关闭 Redis 连接，让进程正常退出
