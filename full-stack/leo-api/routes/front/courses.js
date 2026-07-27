const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const { BadRequestError } = require("../../utils/errors");
const { Course, Category, User, Chapter } = require("../../models");
const { NotFoundError } = require("../../utils/errors");

const getOption = () => {
  return {
    attributes: {
      exclude: ["CategoryId", "UserId", "content"],
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

/* 根据分类 ID 查询课程列表 */
router.get("/", async function (req, res) {
  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      throw new BadRequestError("分类 ID 不能为空");
    }

    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    const condition = {
      ...getOption(),
      where: { categoryId },
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
    };

    const { count, rows } = await Course.findAndCountAll(condition);

    success(res, "查询课程列表成功", {
      courses: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    failure(res, error);
  }
});

// 根据 id 查询课程详情（包含分类、章节、用户信息）
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const course = await Course.findOne({
      where: { id },
      exclude: ["CategoryId", "UserId"],
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
        {
          model: Chapter,
          as: "chapters",
          attributes: ["id", "title", "rank", "video", "createdAt"],
          order: [
            ["rank", "ASC"],
            ["id", "ASC"],
          ],
        },
      ],
    });

    if (!course) {
      throw new NotFoundError(`ID: ${id} 的课程未找到`);
    }

    success(res, "查询课程详情成功", { course });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
