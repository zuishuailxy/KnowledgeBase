const Transport = require("winston-transport");

module.exports = class SequelizeTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
    this.model = opts.model;
  }

  async log(info, callback) {
    setImmediate(() => this.emit("logged", info));

    const { level, message: rawMessage, stack, ...rest } = info;

    // message：优先使用 stack 中的完整错误信息
    const message =
      rawMessage instanceof Error
        ? rawMessage.message
        : typeof rawMessage === "string"
          ? rawMessage
          : JSON.stringify(rawMessage);

    // meta：合并堆栈信息（如果有）
    const meta = {
      ...rest,
      ...(stack ? { stack } : {}),
    };

    try {
      await this.model.create({
        level,
        message,
        meta: JSON.stringify(meta),
        timestamp: new Date(),
      });
    } catch (err) {
      // 不用 logger.error，避免循环（transport 自身失败时无法再写入 DB）
      console.error("SequelizeTransport error:", err);
    }

    callback();
  }
};
