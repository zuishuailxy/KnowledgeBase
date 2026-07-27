const express = require("express");
const router = express.Router();
const { Setting } = require("../../models");
const { success, failure } = require("../../utils/responses");
const { NotFoundError } = require("../../utils/errors");

// Get name and rank
const getAttr = (source) => {
  const { name, icp, copyright } = source;

  return { name, icp, copyright };
};

// define a common function to query setting
async function getSetting() {
  const setting = await Setting.findOne();
  if (!setting) {
    throw new NotFoundError(`系统设置未找到`);
  }

  return setting;
}

// 根据 id 查询分类详情
router.get("/", async function (req, res, next) {
  try {
    const setting = await getSetting();

    success(res, "查询分类详情成功", { setting });
  } catch (error) {
    failure(res, error);
  }
});

// 更新系统设置，先找到对应的系统设置，再更新
router.put("/", async function (req, res, next) {
  try {
    const setting = await getSetting();
    // 白名单过滤
    const body = getAttr(req.body);
    await setting.update(body);

    success(res, "更新系统设置成功", { setting });
  } catch (error) {
    failure(res, error);
  }
});
module.exports = router;
