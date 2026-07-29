const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const { NotFound } = require("http-errors");
const {
  getChapterById,
  getCourseById,
  getUserById,
  getChaptersByCourseId,
} = require("../../utils/cache");

// 根据 id 查询章节详情（包含课程、其余章节、用户信息）
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    // 1. 查章节
    const chapter = await getChapterById(id);
    if (!chapter) throw new NotFound(`ID: ${id} 的章节未找到`);

    // 2. 并行查关联数据
    const [course, chapters] = await Promise.all([
      getCourseById(chapter.courseId),
      getChaptersByCourseId(chapter.courseId),
    ]);

    const user = course ? await getUserById(course.userId) : null;

    success(res, "查询章节详情成功", { chapter, course, user, chapters });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
