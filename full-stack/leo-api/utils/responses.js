const createError = require("http-errors");
const logger = require("../utils/logger");

function success(res, message, data = {}, code = 200) {
  return res.status(code).json({
    message,
    status: true,
    data,
  });
}

function failure(res, error) {
  let statusCode;
  let errors;

  if (error.name === "SequelizeValidationError") {
    statusCode = 400;
    errors = error.errors.map((e) => e.message);
  } else if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    statusCode = 401;
    errors = ["token 错误"];
  } else {
    statusCode = 500;
    logger.error(error);
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
