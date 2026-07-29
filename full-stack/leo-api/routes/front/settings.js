const express = require("express");
const router = express.Router();
const { Setting } = require("../../models");
const { success, failure } = require("../../utils/responses");
const { NotFound } = require("http-errors");
const { getKey, setKey } = require("../../utils/redis");
const { CACHE_SETTING, SETTING_TTL } = require("../../utils/constants");

// 获取系统设置
router.get("/", async function (req, res) {
  try {
    // 读缓存
    const cached = await getKey(CACHE_SETTING);
    if (cached) {
      return success(res, "获取系统设置成功", { setting: cached });
    }

    const setting = await Setting.findOne();
    if (!setting) {
      throw new NotFound("系统设置未找到");
    }

    // 写缓存
    const settingData = setting.toJSON();
    await setKey(CACHE_SETTING, settingData, SETTING_TTL);

    success(res, "获取系统设置成功", { setting: settingData });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
