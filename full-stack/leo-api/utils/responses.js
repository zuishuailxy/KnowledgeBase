const createError = require("http-errors");

function success(res, message, data = {}, code = 200) {
  return res.status(code).json({
    message,
    status: true,
    data,
  });
}

function failure(res, error) {
  let statusCode = 500;
  let errors = ["服务器错误"];

  if (error.name === "SequelizeValidationError") {
    statusCode = 400;
    errors = error.errors.map((e) => e.message);
  }

  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    statusCode = 401;
    errors = ["token 错误"];
  }

  if (error.status && error.expose) {
    statusCode = error.status;
    errors = [error.message];
  }

  return res.status(statusCode).json({
    message: `请求失败：${error.message}`,
    status: false,
    errors,
  });
}

module.exports = {
  success,
  failure,
};
