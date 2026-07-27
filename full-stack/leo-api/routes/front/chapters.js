const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const { NotFoundError } = require("../../utils/errors");
const { Chapter, Course, Category, User } = require("../../models");
const course = require("../../models/course");

// 根据 id 查询章节详情（包含课程、其余章节、用户信息）
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    // condition = {
    //   where: { id },
    //   attributes: {
    //     exclude: ["CourseId"],
    //   },
    //   include: [
    //     {
    //       model: Course,
    //       as: "course",
    //       attributes: ["id", "name"],
    //       include: [
    //         {
    //           model: User,
    //           as: "user",
    //           attributes: ["id", "username", "nickname", "avatar", "company"],
    //         },
    //       ],
    //     },
    //   ],
    // };

    const chapter = await Chapter.findOne({
      attributes: {
        exclude: ["CourseId"],
      },
    });

    if (!chapter) {
      throw new NotFoundError(`ID: ${id} 的章节未找到`);
    }
    // 1.查询章节关联的课程
    const course = await chapter.getCourse({
      attributes: ["id", "name", "userId"],
    });
    // 2. 根据课程查询关联的用户
    const user = await course.getUser({
      attributes: ["id", "username", "nickname", "avatar", "company"],
    });

    const chapters = await Chapter.findAll({
      attributes: {
        exclude: ["CourseId", "content"],
        where: { courseId: chapter.courseId },
        order: [
          ["rank", "ASC"],
          ["id", "DESC"],
        ],
      },
    });

    success(res, "查询章节详情成功", { chapter, course, user, chapters });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
