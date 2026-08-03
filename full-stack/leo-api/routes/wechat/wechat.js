const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { User } = require("../../models");
const { success, failure } = require("../../utils/responses");
const { BadRequest } = require("http-errors");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "8h";

/**
 * 微信小程序登录
 * 流程：
 *  1. 前端 wx.login() 拿 code 传给后端
 *  2. 后端调微信 jscode2session 换 openid
 *  3. 按 openid 查 user 表：老用户直接登录，新用户随机生成必填字段创建
 *  4. 签发 JWT（与现有账号登录体系一致）
 */
router.get("/sign_in", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      throw new BadRequest("缺少必要的参数 code");
    }

    const response = await axios.get(
      "https://api.weixin.qq.com/sns/jscode2session",
      {
        params: {
          appid: process.env.WECHAT_APP_ID,
          secret: process.env.WECHAT_APP_SECRET,
          js_code: code,
          grant_type: "authorization_code",
        },
      },
    );

    // 微信接口返回业务错误（如 code 失效）
    if (response.data.errcode) {
      throw new BadRequest(
        `微信登录失败: ${response.data.errmsg || response.data.errcode}`,
      );
    }

    const { openid } = response.data;
    if (!openid) {
      throw new BadRequest("微信登录失败，未获取到 openid");
    }

    // 1. 按 openid 查用户，判断是否新用户
    let user = await User.findOne({ where: { openid } });
    let isNewUser = false;

    // 2. 新用户 → 随机生成必填字段创建
    if (!user) {
      isNewUser = true;
      const suffix = crypto.randomBytes(6).toString("hex");
      user = await User.create({
        openid,
        email: `wx_${suffix}@wechat.local`,
        username: `wx_${suffix}`,
        nickname: `微信用户${suffix.slice(0, 6)}`,
        password: crypto.randomBytes(16).toString("hex"),
        sex: 2,
        role: 0,
      });
    }

    // 3. 签发 JWT（与现有登录体系一致）
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

    success(res, isNewUser ? "微信注册成功" : "微信登录成功", {
      user: userData,
      token,
    });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
