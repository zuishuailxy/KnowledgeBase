export const rateLimitConfig = {
  max: 100, // 每个IP每分钟最多100次请求
  timeWindow: "1 minute",
};

export const cachingConfig = {
  privacy: "public", // 缓存策略
  expiresIn: 300,
};
