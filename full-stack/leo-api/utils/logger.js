const winston = require("winston");
const SequelizeTransport = require("./sequelize-transport");
// 注意：不在此处 require models，避免被模型文件引用时形成循环依赖；
// Log 模型在 getModel 里运行时懒取。

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "leo-api" },
  transports: [
    //
    // - Write all logs with importance level of `error` or higher to `error.log`
    //   (i.e., error, fatal, but not other levels)
    //
    // new winston.transports.File({ filename: "error.log", level: "error" }),
    //
    // - Write all logs with importance level of `info` or higher to `combined.log`
    //   (i.e., fatal, error, warn, and info, but not trace)
    //
    // new winston.transports.File({ filename: "combined.log" }),
    //
    // - Write all logs to the Logs table via Sequelize
    // getModel 延迟解析：写日志时才取 models.Log，避免与模型加载形成循环依赖
    new SequelizeTransport({ getModel: () => require("../models").Log, level: "warn" }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

module.exports = logger;
