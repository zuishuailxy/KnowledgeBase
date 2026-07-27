const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const { NotFoundError } = require("../../utils/errors");
const { Course, Category, User } = require("../../models");

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

/* 查询推荐的课程 */
router.get("/", async function (req, res) {
  try {
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

    success(res, "查询推荐课程成功", {
      recommendedCourses,
      likeCountedCourses,
      introductoryCourses,
    });
  } catch (error) {
    failure(res, error);
  }
});
module.exports = router;
