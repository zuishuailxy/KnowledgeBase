// 自定义 404 错误类
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

module.exports = {
  NotFoundError,
};
