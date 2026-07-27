const express = require("express");
const router = express.Router();
const { Setting } = require("../../models");
const { success, failure } = require("../../utils/responses");
const { NotFoundError } = require("../../utils/errors");

// 获取系统设置
router.get("/", async function (req, res) {
  try {
    const setting = await Setting.findOne();

    if (!setting) {
      throw new NotFoundError("系统设置未找到");
    }

    success(res, "获取系统设置成功", { setting });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
