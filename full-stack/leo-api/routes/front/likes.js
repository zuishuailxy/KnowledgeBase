const express = require("express");
const router = express.Router();
const { Like, Course, Category, User } = require("../../models");
const { success, failure } = require("../../utils/responses");
const { BadRequest, NotFound } = require("http-errors");
const { delKey } = require("../../utils/redis");
const { CACHE_HOMEPAGE } = require("../../utils/constants");
// Sequelize 的 increment 不触发 update 钩子，点赞场景需显式同步索引
const { upsertCourse } = require("../../utils/meilisearch");
const logger = require("../../utils/logger");

// 点赞/取消点赞（切换）
router.post("/", async (req, res) => {
  try {
    const { courseId } = req.body || {};

    if (!courseId) {
      throw new BadRequest("课程 ID 不能为空");
    }

    // 检查课程是否存在
    const course = await Course.findByPk(courseId);
    if (!course) {
      throw new NotFound("课程不存在");
    }

    const userId = req.user.id;

    // 查找是否已点赞
    const like = await Like.findOne({
      where: { courseId, userId },
    });

    if (like) {
      // 已点赞 → 取消点赞
      await like.destroy();
      await course.decrement("likesCount");
      // increment/decrement 不更新实例内存值，reload 后同步索引（likesCount 是可排序字段）
      await course.reload();
      upsertCourse(course).catch((err) =>
        logger.error(`[meilisearch] 课程索引同步失败: ${err.message}`),
      );
      await delKey(CACHE_HOMEPAGE);
      success(res, "取消点赞成功", {
        liked: false,
        likesCount: course.likesCount,
      });
    } else {
      // 未点赞 → 点赞
      await Like.create({ courseId, userId });
      await course.increment("likesCount");
      // increment/decrement 不更新实例内存值，reload 后同步索引（likesCount 是可排序字段）
      await course.reload();
      upsertCourse(course).catch((err) =>
        logger.error(`[meilisearch] 课程索引同步失败: ${err.message}`),
      );
      await delKey(CACHE_HOMEPAGE);
      success(res, "点赞成功", {
        liked: true,
        likesCount: course.likesCount,
      });
    }
  } catch (error) {
    failure(res, error);
  }
});

// 查询当前用户点赞过的课程
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    const user = await User.findByPk(userId);

    const [courses, count] = await Promise.all([
      user.getLikedCourses({
        attributes: { exclude: ["CategoryId", "UserId", "content"] },
        joinTableAttributes: [],
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
        order: [["id", "DESC"]],
        limit: pageSize,
        offset,
      }),
      user.countLikedCourses(),
    ]);

    success(res, "查询点赞课程成功", {
      courses,
      pagination: { total: count, currentPage, pageSize },
    });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
