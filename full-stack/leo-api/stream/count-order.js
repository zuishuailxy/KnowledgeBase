const { Order } = require("../models");
const { getClient } = require("../utils/redis");
const logger = require("../utils/logger");

// Redis Pub/Sub 频道：订单变化跨进程广播
const CHANNEL = "order-changed";

// 所有在线 SSE 客户端的响应对象
const clients = new Set();

// 最近一次统计结果缓存：事件广播时写一次，新连接直接复用
let statsCache = null;

// 广播进行中标记：防止并发事件导致重复查询
let broadcasting = false;

// Redis 订阅专用连接（订阅连接不能执行普通命令，必须独立 duplicate）
let subClient = null;

/**
 * 计算订单统计数据
 * @returns {Promise<Object>} { total, pending, paid, cancelled, timestamp }
 */
async function getOrderStats() {
  const [total, pending, paid, cancelled] = await Promise.all([
    Order.count(),
    Order.count({ where: { status: 0 } }),
    Order.count({ where: { status: 1 } }),
    Order.count({ where: { status: 2 } }),
  ]);

  return {
    total,
    pending,
    paid,
    cancelled,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 查一次库，把同一份数据广播给本进程所有在线客户端（写入缓存）
 */
async function broadcast() {
  if (broadcasting) {
    return;
  }
  broadcasting = true;
  try {
    const data = await getOrderStats();
    statsCache = data;
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
      res.write(payload);
    }
  } catch (error) {
    const payload = `event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`;
    for (const res of clients) {
      res.write(payload);
    }
  } finally {
    broadcasting = false;
  }
}

/**
 * 启动 Redis 订阅：收到频道消息 → 广播给本进程的 SSE 客户端
 */
async function ensureSubscriber() {
  if (subClient && subClient.isOpen) {
    return;
  }
  const main = await getClient();
  subClient = main.duplicate();
  subClient.on("error", (err) => {
    logger.error(`[stream/count-order] Redis 订阅错误: ${err.message}`, {
      stack: err.stack,
    });
  });
  await subClient.connect();
  await subClient.subscribe(CHANNEL, () => {
    broadcast();
  });
  logger.info(`[stream/count-order] 已订阅 Redis 频道: ${CHANNEL}`);
}

/**
 * 通知所有进程的 SSE 客户端：订单有变化（发布到 Redis）
 * 各进程收到消息后各自查库一次并广播给本地客户端。
 */
async function notifyOrderChanged() {
  try {
    const cli = await getClient();
    await cli.publish(CHANNEL, "1");
  } catch (error) {
    logger.error(
      `[stream/count-order] 发布订单变化消息失败: ${error.message}`,
      {
        stack: error.stack,
      },
    );
  }
}

// 进程启动时即建立订阅
ensureSubscriber().catch((error) => {
  logger.error(`[stream/count-order] Redis 订阅启动失败: ${error.message}`, {
    stack: error.stack,
  });
});

/**
 * 通过 SSE 推送订单统计数据（Redis 跨进程广播 + 本进程广播复用）
 * 连接时优先复用缓存；有新订单时 Redis 广播，本进程收到后统一推送。
 * @param {Object} req - Express 请求
 * @param {Object} res - Express 响应
 */
function streamOrderCount(req, res) {
  // SSE 基础响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // 禁用代理缓冲（nginx 等），保证数据及时到达
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // 加入在线客户端集合
  clients.add(res);

  // 1. 连接时推送初始数据：有缓存直接复用，无缓存才查一次
  const sendInitial = async () => {
    if (statsCache) {
      res.write(`data: ${JSON.stringify(statsCache)}\n\n`);
      return;
    }
    try {
      const data = await getOrderStats();
      statsCache = data;
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`,
      );
    }
  };
  sendInitial();

  // 心跳注释行：防止代理层因长时间无数据而断开连接
  const heartbeatId = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25000);

  // 2. 客户端断开时移除并清理，避免内存泄漏
  req.on("close", () => {
    clients.delete(res);
    clearInterval(heartbeatId);
    res.end();
  });
}

module.exports = { streamOrderCount, getOrderStats, notifyOrderChanged };
