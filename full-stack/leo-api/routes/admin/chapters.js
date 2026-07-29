const express = require("express");
const router = express.Router();
const { Chapter, Course } = require("../../models");
const { Op, where } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFound, BadRequest } = require("http-errors");
const { delKey } = require("../../utils/redis");

// 白名单过滤
const getAttr = (source) => {
  const { courseId, title, content, video, rank } = source;

  return { courseId, title, content, video, rank };
};

const getConditions = () => {
  return {
    attributes: { exclude: ["CourseId"] },
    include: [{ model: Course, as: "course", attributes: ["id", "name"] }],
  };
};

// define a common function to query chapter
async function getChapter(req) {
  const { id } = req.params;

  // 1.判断id 是否存在
  const chapter = await Chapter.findOne({
    where: { id },
  });
  if (!chapter) {
    throw new NotFound(`ID: ${id}的章节未找到`);
  }

  return chapter;
}

/* GET home page. */
router.get("/", async function (req, res, next) {
  try {
    // currentPage 当前页，pageSize 每页条数；默认值分别为 1 和 10 都是数字类型
    const { courseId, title } = req.query;
    if (!courseId) {
      throw new BadRequest("获取章节列表失败，课程ID不能为空。");
    }

    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    // 计算 offset
    const offset = (currentPage - 1) * pageSize;
    // 如果 title 有值，则添加根据 title 的模糊搜索
    const condition = {
      where: {},
      order: [
        ["rank", "ASC"],
        ["id", "ASC"],
      ],
      limit: pageSize,
      offset: offset,
    };
    if (courseId) {
      condition.where.courseId = {
        [Op.eq]: courseId,
      };
    }
    if (title) {
      condition.where.title = {
        [Op.like]: `%${title}%`,
      };
    }

    const { count, rows } = await Chapter.findAndCountAll(condition);
    success(res, "查询章节列表成功", {
      chapters: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "查询章节列表失败",
      status: false,
      errors: [error.message],
    });
  }
});

// 根据 id 查询章节详情
router.get("/:id", async function (req, res, next) {
  try {
    const chapter = await getChapter(req);

    success(res, "查询章节详情成功", { chapter });
  } catch (error) {
    failure(res, error);
  }
});

// 新增章节
router.post("/", async function (req, res, next) {
  try {
    // 白名单过滤
    const body = getAttr(req.body);

    const chapter = await Chapter.create(body);
    await Course.increment("chaptersCount", {
      where: { id: chapter.courseId },
    });
    await delKey(`chapters:${chapter.courseId}`);
    success(res, "新增章节成功", { chapter }, 201);
  } catch (error) {
    failure(res, error);
  }
});

// 删除章节
router.delete("/:id", async function (req, res, next) {
  try {
    const chapter = await getChapter(req);
    // 2.删除章节
    await chapter.destroy();
    await Course.decrement("chaptersCount", {
      where: { id: chapter.courseId },
    });
    await delKey(`chapters:${chapter.courseId}`);
    await delKey(`chapter:${req.params.id}`);
    success(res, "删除章节成功");
  } catch (error) {
    failure(res, error);
  }
});

// 更新章节，先找到对应的章节，再更新
router.put("/:id", async function (req, res, next) {
  try {
    const chapter = await getChapter(req);
    // 白名单过滤
    const body = getAttr(req.body);
    await chapter.update(body);
    await delKey(`chapters:${chapter.courseId}`);
    await delKey(`chapter:${req.params.id}`);

    success(res, "更新章节成功", { chapter });
  } catch (error) {
    failure(res, error);
  }
});
module.exports = router;
