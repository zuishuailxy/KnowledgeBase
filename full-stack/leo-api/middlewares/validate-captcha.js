const { getKey, delKey } = require("../utils/redis");
const { BadRequest } = require("http-errors");
const { failure } = require("../utils/responses");
/**
 * 验证图形验证码中间件
 * 从 req.body 中取 captchaKey 和 captchaCode
 */
module.exports = async function validateCaptcha(req, res, next) {
  try {
    const { captchaKey, captchaCode } = req.body || {};

    if (!captchaKey || !captchaCode) {
      throw new BadRequest("验证码不能为空");
    }

    const text = await getKey(captchaKey);
    if (!text) {
      throw new BadRequest("验证码已过期，请刷新后重试");
    }

    if (text !== captchaCode.toLowerCase()) {
      throw new BadRequest("验证码错误");
    }

    // 验证通过，删除验证码（一次性使用）
    await delKey(captchaKey);
    next();
  } catch (error) {
    failure(res, error);
  }
};
