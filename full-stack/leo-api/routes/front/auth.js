const express = require("express");
const router = express.Router();
const { User } = require("../../models");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const { success, failure } = require("../../utils/responses");
const { NotFound, BadRequest, Unauthorized } = require("http-errors");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const validateCaptcha = require("../../middlewares/validate-captcha");
const { sendMailViaQueue } = require("../../utils/mail");
const logger = require("../../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "8h";

// 用户注册
router.post("/register", validateCaptcha, async (req, res) => {
  try {
    const { username, email, nickname, password } = req.body || {};

    if (!username) {
      throw new BadRequest("用户名不能为空");
    }
    if (!email) {
      throw new BadRequest("邮箱不能为空");
    }
    if (!nickname) {
      throw new BadRequest("昵称不能为空");
    }
    if (!password) {
      throw new BadRequest("密码不能为空");
    }

    // 白名单过滤，默认 role=0, sex=2
    const user = await User.create({
      username,
      email,
      nickname,
      password,
      role: 0,
      sex: 2,
    });

    // 注册成功后自动生成 token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    // 返回时剔除密码
    const userData = user.toJSON();
    delete userData.password;

    // 通过消息队列异步发送欢迎邮件
    sendMailViaQueue({
      to: email,
      subject: "欢迎加入 Leo 教育",
      template: "welcome",
      context: { nickname, username, email },
    }).catch((err) => logger.error("邮件入队失败:", err.message));

    success(res, "注册成功", { user: userData, token }, 201);
  } catch (error) {
    logger.error(error);
    failure(res, error);
  }
});

// 用户登录
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body || {};

    if (!login) {
      throw new BadRequest("用户名/邮箱不能为空");
    }
    if (!password) {
      throw new BadRequest("密码不能为空");
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: login }, { username: login }],
      },
    });

    if (!user) {
      throw new NotFound("用户不存在");
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new Unauthorized("密码错误");
    }

    // 生成 token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    // 返回时剔除密码
    const userData = user.toJSON();
    delete userData.password;

    success(res, "登录成功", { user: userData, token });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
