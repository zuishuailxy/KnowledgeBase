const express = require("express");
const router = express.Router();
const { User } = require("../models");
const jwt = require("jsonwebtoken");
const { success, failure } = require("../utils/responses");
const { Unauthorized } = require("http-errors");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

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
