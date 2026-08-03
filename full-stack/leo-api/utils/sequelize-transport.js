const Transport = require("winston-transport");

module.exports = class SequelizeTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
    // 兼容两种配置：model（直接传模型）或 getModel（延迟解析，避免模块加载期循环依赖）
    this.model = opts.model;
    this.getModel = opts.getModel;
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
      // 写日志时才解析模型（getModel 支持延迟获取，避免模型加载期循环依赖）
      const model = this.getModel ? this.getModel() : this.model;
      if (!model) {
        console.error("SequelizeTransport error: 未配置 Log 模型");
        return callback();
      }
      await model.create({
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
