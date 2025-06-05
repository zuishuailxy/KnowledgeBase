import fastify from "fastify";
import proxy from "@fastify/http-proxy";
import rateLimit from "@fastify/rate-limit";
import caching from "@fastify/caching";
import CircuitBreaker from "opossum";
import proxyConfig from "./proxy/index.js"; // Import your proxy configuration
import { rateLimitConfig, cachingConfig } from "./config/index.js";

const app = fastify({ logger: false });

const breaker = new CircuitBreaker(
  (url) => {
    // test if the proxy is working
    return fetch(url);
  },
  {
    timeout: 3000, // 3 seconds
    errorThresholdPercentage: 50, // 50% of requests must fail to trip the breaker
    resetTimeout: 10000, // 10 seconds reset timeout
  }
);

// 限流
app.register(rateLimit, rateLimitConfig);

// 缓存
app.register(caching, cachingConfig);

// 路由代理
proxyConfig.forEach((config) => {
  app.register(proxy, {
    preHandler: (req, res, next) => {
      breaker
        .fire(config.upstream)
        .then(() => {
          next();
        })
        .catch(() => {
          res.send({
            code: 503,
            message: "Service Unavailable",
          });
        });
    },
    upstream: config.upstream,
    prefix: config.prefix,
    rewritePrefix: config.rewritePrefix,
    httpMethods: config.httpMethods,
    http2: config.http2,
  });
});

app.listen({ port: 5000 }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info("Server listening on http://localhost:5000");
});
