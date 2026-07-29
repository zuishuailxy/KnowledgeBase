// 总结：读多写少 + 不要求实时 → 缓存。写多 + 要求强一致 → 不缓存。

const redis = require("redis");

let client;

async function getClient() {
  if (client && client.isOpen) return client;

  client = redis.createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  });

  client.on("error", (err) => console.error("Redis 错误:", err));

  await client.connect();
  console.log("Redis 连接成功");
  return client;
}

/**
 * 设置键值（对象自动 JSON.stringify）
 */
async function setKey(key, value, seconds = null) {
  const cli = await getClient();
  const val = typeof value === "object" ? JSON.stringify(value) : String(value);

  if (seconds !== null) {
    return cli.setEx(key, seconds, val);
  }

  return cli.set(key, val);
}

/**
 * 获取键值（自动 JSON.parse）
 */
async function getKey(key) {
  const cli = await getClient();
  const val = await cli.get(key);
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

/**
 * 删除一个或多个键
 */
async function delKey(...keys) {
  const cli = await getClient();
  return cli.del(keys);
}

/**
 * 检查键是否存在
 */
async function exists(key) {
  const cli = await getClient();
  const result = await cli.exists(key);
  return result === 1;
}

/**
 * 设置过期时间（秒）
 */
async function expire(key, seconds) {
  const cli = await getClient();
  return cli.expire(key, seconds);
}

/**
 * 剩余过期时间（秒），-1 永不过期，-2 不存在
 */
async function ttl(key) {
  const cli = await getClient();
  return cli.ttl(key);
}

/**
 * 自增
 */
async function incr(key, increment = 1) {
  const cli = await getClient();
  return increment === 1 ? cli.incr(key) : cli.incrBy(key, increment);
}

/**
 * 按前缀批量删除键
 * @param {string} pattern - 如 "articles:*"
 */
async function delByPattern(pattern) {
  const cli = await getClient();
  const keys = [];
  for await (const item of cli.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    keys.push(typeof item === "string" ? item : item.key || String(item));
  }
  if (keys.length > 0) {
    return cli.del(keys);
  }
  return 0;
}

/**
 * 清空当前数据库所有缓存
 */
async function flushAll() {
  const cli = await getClient();
  return cli.flushDb();
}

module.exports = {
  setKey,
  getKey,
  delKey,
  delByPattern,
  flushAll,
  exists,
  expire,
  ttl,
  incr,
  getClient,
};
