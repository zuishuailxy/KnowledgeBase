const svgCaptcha = require("svg-captcha");
const express = require("express");
const router = express.Router();
const { setKey } = require("../../utils/redis");
const crypto = require("crypto");
const { success, failure } = require("../../utils/responses");

router.get("/", function (req, res) {
  try {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: "0o1il9quy",
      noise: 3,
      color: true,
      width: 100,
      height: 40,
    });
    const key = `captcha:${crypto.randomUUID()}`;

    // 存 Redis，5 分钟有效
    setKey(key, captcha.text.toLowerCase(), 300);

    success(res, "获取验证码成功", {
      captchaKey: key,
      data: captcha.data,
    });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
