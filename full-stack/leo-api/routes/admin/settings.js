const express = require("express");
const router = express.Router();
const { Setting } = require("../../models");
const { success, failure } = require("../../utils/responses");
const { NotFound } = require("http-errors");
const { delKey, flushAll } = require("../../utils/redis");
const { CACHE_SETTING } = require("../../utils/constants");
const {
  initIndexes,
  syncAllCourses,
  syncAllChapters,
} = require("../../utils/meilisearch");

// Get name and rank
const getAttr = (source) => {
  const { name, icp, copyright } = source;

  return { name, icp, copyright };
};

// define a common function to query setting
async function getSetting() {
  const setting = await Setting.findOne();
  if (!setting) {
    throw new NotFound(`系统设置未找到`);
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
    // 清除缓存
    await delKey(CACHE_SETTING);

    success(res, "更新系统设置成功", { setting });
  } catch (error) {
    failure(res, error);
  }
});

// 清空所有缓存
router.post("/flush-cache", async function (req, res, next) {
  try {
    await flushAll();
    success(res, "所有缓存已清空");
  } catch (error) {
    failure(res, error);
  }
});

// 初始化/全量重建 Meilisearch 搜索索引（课程 + 章节）
router.post("/sync-search-indexes", async function (req, res, next) {
  try {
    // 1. 初始化索引配置（可搜索/可排序字段）
    await initIndexes();

    // 2. 从数据库全量同步课程和章节
    const [courses, chapters] = await Promise.all([
      syncAllCourses(),
      syncAllChapters(),
    ]);

    success(res, "搜索索引初始化成功", { courses, chapters });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
