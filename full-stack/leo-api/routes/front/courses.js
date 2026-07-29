const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const { BadRequest, NotFound } = require("http-errors");
const { Course, Category, User } = require("../../models");
const { getKey, setKey } = require("../../utils/redis");
const { COURSES_TTL } = require("../../utils/constants");
const {
  getCourseById,
  getCategoryById,
  getUserById,
  getChaptersByCourseId,
} = require("../../utils/cache");

const getOption = () => {
  return {
    attributes: { exclude: ["CategoryId", "UserId", "content"] },
    include: [
      { model: Category, as: "category", attributes: ["id", "name"] },
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "nickname", "avatar", "company"],
      },
    ],
  };
};

router.get("/", async function (req, res) {
  try {
    const { categoryId } = req.query;
    if (!categoryId) throw new BadRequest("分类 ID 不能为空");

    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    const cacheKey = `courses:${categoryId}:${currentPage}:${pageSize}`;

    const cached = await getKey(cacheKey);
    if (cached) return success(res, "查询课程列表成功", cached);

    const offset = (currentPage - 1) * pageSize;
    const { count, rows } = await Course.findAndCountAll({
      ...getOption(),
      where: { categoryId },
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
    });

    const data = {
      courses: rows,
      pagination: { total: count, currentPage, pageSize },
    };
    await setKey(cacheKey, data, COURSES_TTL);
    success(res, "查询课程列表成功", data);
  } catch (error) {
    failure(res, error);
  }
});

// 根据 id 查询课程详情（包含分类、章节、用户信息）
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const course = await getCourseById(id);
    if (!course) throw new NotFound(`ID: ${id} 的课程未找到`);

    const [category, user, chapters] = await Promise.all([
      getCategoryById(course.categoryId),
      getUserById(course.userId),
      getChaptersByCourseId(id),
    ]);

    course.category = category;
    course.user = user;
    course.chapters = chapters;

    success(res, "查询课程详情成功", { course });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
