const { User } = require("../models");
const jwt = require("jsonwebtoken");
const { failure } = require("../utils/responses");
const { Unauthorized } = require("http-errors");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * SSE 兼容鉴权中间件
 * 原生 EventSource 无法设置 Authorization 头，
 * 因此额外支持从 ?token= 查询参数读取 token。
 * 安全提示：token 出现在 URL 会进入浏览器历史/服务器日志，
 * 生产环境建议使用短期 token 或定期刷新。
 */
module.exports = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : req.query.token;

    if (!token) {
      throw new Unauthorized("当前接口需要验证才能访问");
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId } = decoded;
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Unauthorized("用户不存在");
    }
    if (user.role !== 100) {
      throw new Unauthorized("你没有权限登陆管理员平台");
    }
    req.user = user;

    next();
  } catch (error) {
    failure(res, error);
  }
};
