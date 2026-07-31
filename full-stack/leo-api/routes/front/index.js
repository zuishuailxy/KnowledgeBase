const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const { Course, Category, User } = require("../../models");
const { getKey, setKey } = require("../../utils/redis");
const { CACHE_HOMEPAGE, HOMEPAGE_TTL } = require("../../utils/constants");
const newLogger = require("../../utils/logger");
const getOption = () => {
  return {
    attributes: {
      excluded: ["CategoryId", "UserId", "content"],
    },
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "nickname", "avatar", "company"],
      },
    ],
  };
};

/* 首页课程 */
router.get("/", async function (req, res) {
  try {
    // 读缓存
    const cached = await getKey(CACHE_HOMEPAGE);
    if (cached) {
      return success(res, "查询推荐课程成功", cached);
    }

    const recommendedCourses = await Course.findAll({
      ...getOption(),
      where: { recommended: true },
      order: [["id", "desc"]],
      limit: 10,
    });

    // 人气课程
    const likeCountedCourses = await Course.findAll({
      ...getOption(),
      order: [
        ["likesCount", "desc"],
        ["id", "desc"],
      ],
      limit: 10,
    });

    // 入门课程
    const introductoryCourses = await Course.findAll({
      ...getOption(),
      where: { introductory: true },
      order: [["id", "desc"]],
      limit: 10,
    });

    const data = {
      recommendedCourses,
      likeCountedCourses,
      introductoryCourses,
    };

    // 写缓存
    await setKey(CACHE_HOMEPAGE, data, HOMEPAGE_TTL);

    success(res, "查询推荐课程成功", data);
  } catch (error) {
    newLogger.error(error);
    failure(res, error);
  }
});
module.exports = router;
