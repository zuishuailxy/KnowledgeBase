/**
 * 双层记忆 Agent：Redis 记短期对话，Mem0 记长期事实。
 *
 * 设计哲学：
 * - 用户层（Mem0, user_id 维度）：跨会话长期记忆，换天聊还认得你
 *   —— 如姓名、居住地、饮食禁忌、长期偏好
 * - 会话层（Mem0, run_id 维度）：仅当前会话有效的任务上下文
 *   —— 如当前任务、大纲、进度、临时待办
 * - Redis 短期层：这个聊天窗口内的原始对话消息（TTL 过期）
 *
 * 运行前置：
 *   docker compose up -d redis   # 启动 Redis
 *   pnpm agent                   # 运行本脚本
 * 交互命令：
 *   :clear        清 Redis 短期记忆
 *   :clear-mem0   清 Mem0（用户层 + 当前会话层）
 *   exit / :q     退出
 */

// dotenv/config：自动加载 .env 中的 MEM0_API_KEY / OPENAI_API_KEY 等到 process.env
import "dotenv/config";

// ioredis：Redis 的 Node 客户端（用于短期记忆存储）
import Redis from "ioredis";

// readline/promises：Node 内置的逐行读取终端输入（Promise 版），实现命令行一问一答
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

// zod：运行时 schema 校验。用于定义“记忆分类器”的结构化输出，
// 保证 LLM 返回的 write_user / write_session / reason 是合法布尔/字符串
import { z } from "zod";

// mem0ai 的官方客户端：管理长期记忆（增删查），底层可接 Redis 等向量库
import { MemoryClient } from "mem0ai";

// createModel：本地封装，统一创建 LLM 模型实例
import { createModel } from "../../utils/create-model.mjs";

// @langchain/core/messages 提供的类型与转换函数：
// - SystemMessage / SystemMessageChunk：系统消息类型（用于区分“注入的记忆”与“真实对话”）
// - HumanMessage：人类用户消息
// - mapChatMessagesToStoredMessages / mapStoredMessagesToChatMessages：
//   在 ChatMessage 数组与可 JSON 存储的普通对象之间互转（写/读 Redis 用）
import {
  SystemMessage,
  SystemMessageChunk,
  HumanMessage,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
} from "@langchain/core/messages";

// langchain 核心：createAgent 创建 Agent；summarizationMiddleware 对话压缩中间件
import { createAgent, summarizationMiddleware } from "langchain";

// ───────────────────────── Redis 短期记忆配置 ─────────────────────────
const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);
const REDIS_DB = Number(process.env.REDIS_DB ?? 0);
const MEMORY_TTL = Number(process.env.MEMORY_TTL_SECONDS ?? 1800); // 默认 30 分钟过期
const KEY_PREFIX = process.env.MEMORY_KEY_PREFIX ?? "agent:short_memory";

// ───────────────────────── Mem0 长期记忆配置 ─────────────────────────
const USER_ID = process.env.MEM0_USER_ID ?? "demo_user_001"; // 用户标识（跨会话）
const SESSION_ID = process.env.MEMORY_SESSION_ID ?? "session_002"; // 会话标识（仅本次会话）
const MEM0_TOP_K = Number(process.env.MEM0_TOP_K ?? 5); // 检索时返回的记忆条数上限

// 记忆分类器的结构化输出 schema（用 zod 定义，配合 withStructuredOutput 使用）：
// LLM 在每轮对话后判断是否有“新事实”要写入 Mem0，并给出两层标记：
// - write_user：是否写入用户层（跨会话长期事实）
// - write_session：是否写入会话层（仅当前会话）
// - reason：一句话说明分类理由（便于调试/审计）
const memorySchema = z.object({
  write_user: z
    .boolean()
    .describe(
      "写入用户层：换一个新会话仍应保留的长期事实（身份、居住地、长期爱好、饮食禁忌、持久偏好）。不含仅本轮任务。",
    ),
  write_session: z
    .boolean()
    .describe(
      "写入会话层：仅当前会话/thread 有效的任务、大纲、进度、待办、临时决策（如「这次先写…」「数据部分明天补」）。",
    ),
  reason: z.string().describe("分类理由，一句话"),
});

// 分类器系统提示词：给 LLM 明确“什么该写入哪一层、什么不写”的规则。
// 用示例化的“决策原则”引导，避免把纯会话任务误标成用户层、
// 也避免把寒暄/助手生成内容当新事实写入
const CLASSIFIER_PROMPT = `你是记忆分层分类器。判断本轮对话是否有「新事实」需写入 Mem0，并分到正确层级。

## user 层（跨会话长期）
- 用户身份与画像：姓名、职业、居住地、长期爱好
- 长期偏好与约束：饮食过敏、回答风格、常用技术栈
- 持续数周以上的个人背景（非单次任务）

## session 层（仅当前会话）
- 当前正在做的任务、目标、文档大纲、方案草稿
- 本会话内的进度、决策、待办、临时约定
- 用户明确用「这次」「本轮」「当前会话」描述的工作上下文

## 均不写入
- 寒暄、致谢、纯确认
- 助手生成的通用内容（攻略、示例代码、建议清单），用户未明确采纳为新事实
- 无信息增量的复述

## 决策原则
1. 「这次我们先写 Q1 总结」「当前在排查 XX」→ 优先 session，不要标成 user
2. user 与 session 可同时为 true（如同时说职业+当前任务），但勿把纯会话任务只标 user
3. 一次性请求（如「帮我做旅行攻略」）且未产生需跨轮记住的约定 → 均为 false`;

// Redis 短期对话的压缩摘要提示词：压缩时只保留“会话内进度/报错/待办”。
// 特意注明“用户级长期偏好由外部记忆（Mem0）维护，摘要勿重复堆砌”——
// 避免两套记忆系统存储内容重叠、互相冗余
const summaryPrompt = `你是对话摘要助手。用中文简洁总结：话题、会话内进度/报错/待办。
用户级长期偏好由外部记忆维护，摘要勿重复堆砌。不要编造。

待摘要的对话：
{messages}

摘要：`;

/**
 * messagesForRedis：过滤掉“不该写回 Redis”的消息。
 *
 * 原因：Mem0 在每次调用时会把长期记忆以 SystemMessage 的形式注入到消息列表。
 * 这些 SystemMessage 是“临时拼装的记忆”，若写回 Redis 会：(1) 污染短期对话历史；
 * (2) 反复膨胀。(2) 让摘要/压缩重复看到同样的记忆。
 * 所以写回 Redis 前，把 SystemMessage / SystemMessageChunk 过滤掉。
 */
function messagesForRedis(messages) {
  return messages.filter(
    (m) => !SystemMessage.isInstance(m) && !SystemMessageChunk.isInstance(m),
  );
}

/**
 * RedisMessageStore：短期记忆存储层（会话级原始消息，带 TTL）。
 * 与“记忆分层”无直接关系——它只负责保存当前聊天窗口内的完整对话历史，
 * 供下一次调用时把上下文拼回去，以及供 summarizationMiddleware 压缩。
 */
class RedisMessageStore {
  constructor({ redis, keyPrefix, ttlSeconds }) {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
    this.ttlSeconds = ttlSeconds;
  }

  // 生成某会话的 Redis key，例如 agent:short_memory:demo_user_001:messages
  messagesKey(sessionId) {
    return `${this.keyPrefix}:${sessionId}:messages`;
  }

  // 读取会话历史；无数据返回空数组（首次对话）
  async loadMessages(sessionId) {
    const raw = await this.redis.get(this.messagesKey(sessionId));
    if (!raw) return [];
    return mapStoredMessagesToChatMessages(JSON.parse(raw));
  }

  // 写入会话历史（序列化 + 带过期时间 EX）
  async saveMessages(sessionId, messages) {
    const payload = JSON.stringify(mapChatMessagesToStoredMessages(messages));
    await this.redis.set(
      this.messagesKey(sessionId),
      payload,
      "EX",
      this.ttlSeconds,
    );
  }

  // 清空会话历史
  async clear(sessionId) {
    await this.redis.del(this.messagesKey(sessionId));
  }

  // 查询剩余有效秒数
  async ttl(sessionId) {
    return this.redis.ttl(this.messagesKey(sessionId));
  }
}

/**
 * Mem0MemoryStore：长期记忆存储层（Mem0 客户端封装）。
 *
 * 三个能力：
 * 1. search —— 按查询语义检索两层记忆（用户层 + 会话层），并行执行
 * 2. buildSystemMessage —— 把检索到的记忆拼成一条 SystemMessage 注入给 LLM
 * 3. classifyAndPersist —— 用分类器判断本轮是否有新事实，并写入对应层
 */
class Mem0MemoryStore {
  constructor({ client, userId, sessionId, topK, classifier }) {
    this.client = client; // mem0ai 的 MemoryClient
    this.userId = userId; // 用户标识
    this.sessionId = sessionId; // 会话标识
    this.topK = topK; // 每条检索最多返回多少条记忆
    this.classifier = classifier; // 带结构化输出的分类 LLM
  }

  // 按 query 同时检索用户层与会话层记忆：
  // - 用户层：filters.user_id 匹配该用户（跨会话的长期记忆）
  // - 会话层：filters 用 AND 组合 user_id + run_id（仅本次会话的记忆）
  // 用 Promise.all 并行发起两次检索，减少等待时间
  async search(query) {
    const [userRes, sessionRes] = await Promise.all([
      this.client.search(query, {
        filters: { user_id: this.userId },
        topK: this.topK,
      }),
      this.client.search(query, {
        filters: {
          AND: [{ user_id: this.userId }, { run_id: this.sessionId }],
        },
        topK: this.topK,
      }),
    ]);
    return {
      user: userRes.results ?? [],
      session: sessionRes.results ?? [],
    };
  }

  // 把检索到的两层记忆格式化成一条 SystemMessage：
  // 「【用户长期记忆】- ...」「【当前会话记忆】- ...」
  // 两条都为空则返回 null（无需注入记忆）
  buildSystemMessage({ user, session }) {
    const blocks = [];
    if (user.length) {
      blocks.push(
        `【用户长期记忆】\n${user.map((m) => `- ${m.memory}`).join("\n")}`,
      );
    }
    if (session.length) {
      blocks.push(
        `【当前会话记忆】\n${session.map((m) => `- ${m.memory}`).join("\n")}`,
      );
    }
    if (!blocks.length) return null;
    return new SystemMessage(
      `${blocks.join("\n\n")}\n\n请结合以上记忆回答，勿编造。`,
    );
  }

  // 本轮对话后调用：判断是否写入长期记忆。
  // 1. 把“用户说 + 助手答”组成这一轮 turn
  // 2. 交给分类器（带 zod 结构化输出），拿到 write_user / write_session / reason
  // 3. 按标记写入对应层：
  //    - 用户层：只带 userId（跨会话）
  //    - 会话层：userId + runId（仅本次会话）
  // 4. 返回写入的层列表与分类理由，便于终端打印/调试
  async classifyAndPersist(userText, assistantText) {
    const turn = [
      { role: "user", content: userText },
      { role: "assistant", content: assistantText },
    ];

    const { write_user, write_session, reason } = await this.classifier.invoke([
      new SystemMessage(CLASSIFIER_PROMPT),
      new HumanMessage(`用户：${userText}\n助手：${assistantText}`),
    ]);

    const written = [];
    if (write_user) {
      await this.client.add(turn, { userId: this.userId });
      written.push("user");
    }
    if (write_session) {
      await this.client.add(turn, {
        userId: this.userId,
        runId: this.sessionId,
      });
      written.push("session");
    }
    return { written, reason };
  }

  // 清空当前用户的全部长期记忆（用户层 + 当前会话层）
  async clear() {
    await this.client.deleteAll({ userId: this.userId });
    await this.client.deleteAll({ userId: this.userId, runId: this.sessionId });
  }
}

/**
 * invokeWithMemory：带双层记忆的一次对话调用。
 *
 * 流程：
 * 1. 从 Redis 加载短期对话历史
 * 2. 从 Mem0 检索长期记忆（用户层 + 会话层，并行）
 * 3. 把 Mem0 记忆拼成 SystemMessage，与 Redis 历史 + 本轮用户消息一起交给 Agent
 * 4. Agent 回复后：
 *    - 把结果过滤掉 SystemMessage 后写回 Redis（短期层）
 *    - 用分类器判断本轮是否有新事实，写入 Mem0（长期层）
 */
async function invokeWithMemory(
  agent,
  redisStore,
  mem0Store,
  sessionId,
  userText,
) {
  // ① 短期记忆：读 Redis 里的本会话历史
  const history = await redisStore.loadMessages(sessionId);
  console.log(`  ↳ Redis 加载 ${history.length} 条历史`);

  // ② 长期记忆：并行检索 Mem0 的用户层与会话层
  const mem = await mem0Store.search(userText);
  if (mem.user.length) console.log(`  ↳ Mem0 用户层 ${mem.user.length} 条`);
  if (mem.session.length)
    console.log(`  ↳ Mem0 会话层 ${mem.session.length} 条`);

  // ③ 组装本次要发给 Agent 的消息：
  //    [Mem0 长期记忆(若有)] + [Redis 短期历史] + [本轮用户消息]
  const memoryMsg = mem0Store.buildSystemMessage(mem);
  const invokeMessages = [
    ...(memoryMsg ? [memoryMsg] : []), // mem0 长期记忆
    ...history, //redis 短期
    new HumanMessage(userText),
  ];

  const result = await agent.invoke(
    { messages: invokeMessages },
    { recursionLimit: 30 }, // 递归上限，防死循环（本脚本无工具，作安全兜底）
  );

  // ④ 写回短期记忆：先过滤掉 Mem0 注入的 SystemMessage（避免污染历史），再存 Redis
  const redisMessages = messagesForRedis(result.messages);
  const dropped = result.messages.length - redisMessages.length;
  await redisStore.saveMessages(sessionId, redisMessages);
  const ttl = await redisStore.ttl(sessionId);
  console.log(
    `  ↳ Redis 写回 ${redisMessages.length} 条` +
      (dropped ? `（过滤 ${dropped} 条 SystemMessage）` : "") +
      ` (TTL ${ttl}s)`,
  );

  // ⑤ 长期记忆：取出助手最终回复，交给分类器判断是否有新事实，写入 Mem0
  const assistantText = String(result.messages.at(-1)?.content ?? "");
  const { written, reason } = await mem0Store.classifyAndPersist(
    userText,
    assistantText,
  );
  console.log(`  ↳ 分类: ${reason}`);
  console.log(
    written.length ? `  ↳ Mem0 写入: ${written.join(", ")}` : "  ↳ Mem0 未写入",
  );

  return { messages: result.messages, redisMessages, assistantText };
}

// 环境变量校验：Mem0 需要 API Key，模型需要 OpenAI Key，缺一不可
if (!process.env.MEM0_API_KEY || !process.env.OPENAI_API_KEY) {
  console.error("需要 MEM0_API_KEY 与 OPENAI_API_KEY");
  process.exit(1);
}

// 创建两个客户端：Redis（短期）+ Mem0（长期）
const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, db: REDIS_DB });
const mem0 = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });

// 监听 Redis 连接/错误事件，便于终端观察状态
redis.on("connect", () => console.log("✅ Redis 已连接"));
redis.on("error", (err) => console.error("❌ Redis 错误:", err.message));

// 启动前先 ping 一次 Redis，连不上直接退出并提示先启动容器
try {
  await redis.ping();
} catch {
  console.error("Redis 未连接，请先执行: docker compose up -d redis");
  process.exit(1);
}

// 短期记忆存储层实例
const redisStore = new RedisMessageStore({
  redis,
  keyPrefix: KEY_PREFIX,
  ttlSeconds: MEMORY_TTL,
});

// 对话模型 + 分类模型：都基于同一 createModel(0) 创建，
// 但分类模型用 withStructuredOutput(memorySchema) 强制输出符合 zod schema 的 JSON
const model = createModel(0);
// 注意：这里显式指定 method: "functionCalling"（tool calling）。
// 原因：当前用的是 Qwen（阿里云 MaaS OpenAI 兼容端点），
// withStructuredOutput 默认会因“非 gpt-3/gpt-4”模型判定走原生 jsonSchema 路径，
// 而 Qwen 不同版本/MaaS 实例对 json_schema 的支持参差不齐。
// functionCalling 是 Qwen 兼容接口支持最稳定、最通用的方式（已实测通过）。
const classifier = createModel(0).withStructuredOutput(memorySchema);

// 长期记忆存储层实例（注入分类器）
const mem0Store = new Mem0MemoryStore({
  client: mem0,
  userId: USER_ID,
  sessionId: SESSION_ID,
  topK: MEM0_TOP_K,
  classifier,
});

/**
 * 主 Agent：
 * - 不带工具，只做对话
 * - systemPrompt 提示结合系统消息里的记忆回答
 * - 挂 summarizationMiddleware 压缩 Redis 短期历史：
 *     · 消息达 8 条触发压缩，保留最近 4 条原文
 *     · 压缩只针对 Redis 短期层（Mem0 长期层不参与压缩）
 */
const agent = createAgent({
  model,
  tools: [],
  systemPrompt:
    "你是会话助手。结合系统消息中的长期/会话记忆回答，中文简短。有对话摘要则据此继续。",
  middleware: [
    summarizationMiddleware({
      model,
      summaryPrompt,
      trigger: { messages: 8 },
      keep: { messages: 4 },
    }),
  ],
});

console.log(`用户 ${USER_ID} | 会话 ${SESSION_ID}`);
console.log(
  "输入 exit / quit / :q 退出；:clear 清空 Redis；:clear-mem0 清空 Mem0\n",
);

// 命令行交互：从 stdin 读、往 stdout 写
const rl = readline.createInterface({ input: stdin, output: stdout });
// 记录启动时已有的 Redis 消息数，用于检测压缩是否触发
let prevCount = (await redisStore.loadMessages(SESSION_ID)).length;

try {
  // 主循环：一问一答
  while (true) {
    const userText = (await rl.question("你: ")).trim();
    if (!userText) continue; // 空输入跳过

    // 退出命令
    if (["exit", "quit", ":q"].includes(userText.toLowerCase())) break;

    // 清 Redis 短期记忆
    if (userText === ":clear") {
      await redisStore.clear(SESSION_ID);
      prevCount = 0;
      console.log("已清空 Redis 短期记忆\n");
      continue;
    }

    // 清 Mem0 长期记忆
    if (userText === ":clear-mem0") {
      await mem0Store.clear();
      console.log("已清空 Mem0 用户层与当前会话层\n");
      continue;
    }

    // 带双层记忆调用 Agent（Redis 短期 + Mem0 长期）
    const { redisMessages, assistantText } = await invokeWithMemory(
      agent,
      redisStore,
      mem0Store,
      SESSION_ID,
      userText,
    );

    // 打印助手回复与当前 Redis 消息数
    console.log("\n助手:", assistantText);
    console.log(`Redis 消息数: ${redisMessages.length}`);

    // 压缩检测：若消息数相比上一轮增长不足 2 条，
    // 说明 summarizationMiddleware 把旧消息替换成了摘要 → 已触发压缩
    if (redisMessages.length < prevCount + 2) {
      console.log("  ⚡ 已触发压缩");
    }
    prevCount = redisMessages.length;
    console.log();
  }
} finally {
  rl.close(); // 无论正常/异常退出都关闭 readline，避免进程挂起
}

await redis.quit(); // 关闭 Redis 连接，让进程干净退出

/*
 * 测试对话（复制进终端，先来 :clear-mem0 和 :clear）
 *
 * 一、寒暄
 * 你好 / 在吗 / 谢谢
 * → 纯客套，Mem0 不用记。
 *
 * 二、自我介绍
 * 我叫小明，住在杭州，平时喜欢骑行和摄影。
 * 我对海鲜过敏，出差尽量别安排沿海城市。
 * → 换天聊还得知道的事，写 user 层。
 *
 * 三、这会儿在干嘛
 * 这次我们先写 Q1 季度总结，大纲分三块：项目复盘、数据指标、下季度计划。
 * 项目复盘里重点写 order-service 的 500 错误排查过程。
 * → 只管这次聊天的事，写 session 层。
 *
 * 四、长期背景 + 手头活
 * 我长期做后端开发，这次会话的任务是排查 payment-api 超时，先从 P99 日志看起。
 * 另外我之后技术回答都希望带代码示例，这个一直记住。
 * → 职业和当前任务可能两层都写，偏好那条走 user。
 *
 * 五、Redis 和 Mem0 各管啥
 * 刚才说的 payment-api，超时阈值先假设 3 秒。
 * 上一句我说的阈值是多少？
 * → 刚说过的话 Redis 兜得住，不用等 Mem0。
 *
 * 重启 agent（别清 mem0）再问：我是谁？有什么过敏？
 * → 新会话 Redis 是空的，user 层还能认出你。
 *
 * 六、聊多了会压缩（可选，连聊 8 轮以上）
 * 继续完善 Q1 总结 / 把第二段改短 / 加个标题……
 * → 终端会出现「已触发压缩」，老消息变摘要。
 *
 * 推荐顺序：清空 → 寒暄 → 自我介绍 → 当前任务 → 重启验 user → 清 mem0 验 session 没了
 */
