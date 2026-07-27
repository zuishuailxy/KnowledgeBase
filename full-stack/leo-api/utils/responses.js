const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require("./errors");

function success(res, message, data = {}, code = 200) {
  return res.status(code).json({
    message,
    status: true,
    data,
  });
}

function failure(res, error) {
  if (error.name === "SequelizeValidationError") {
    const errors = error.errors.map((e) => e.message);
    return res.status(400).json({
      message: "参数校验失败",
      status: false,
      errors,
    });
  }

  if (error.name === "BadRequestError") {
    return res.status(400).json({
      message: "请求参数异常",
      status: false,
      errors: [error.message],
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "认证失败",
      status: false,
      errors: ["token 错误"],
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "认证失败",
      status: false,
      errors: ["token 过期了"],
    });
  }

  if (error.name === "UnauthorizedError") {
    return res.status(401).json({
      message: "未授权",
      status: false,
      errors: [error.message],
    });
  }

  if (error.name === "ForbiddenError") {
    return res.status(403).json({
      message: "禁止访问",
      status: false,
      errors: [error.message],
    });
  }

  if (error.name === "NotFoundError") {
    return res.status(404).json({
      message: "资源不存在",
      status: false,
      errors: [error.message],
    });
  }

  return res.status(500).json({
    message: "服务器错误",
    status: false,
    errors: [error.message],
  });
}

module.exports = {
  success,
  failure,
};
