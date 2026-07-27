const express = require("express");
const router = express.Router();
const { Course, Category, User, Chapter } = require("../../models");
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFoundError } = require("../../utils/errors");

// 白名单过滤
const getAttr = (source) => {
  const { categoryId, name, image, recommended, introductory, content } =
    source;

  return {
    categoryId,
    name,
    image,
    recommended,
    introductory,
    content,
  };
};

const getConditions = () => {
  return {
    attributes: { exclude: ["CategoryId", "UserId"] },
    include: [
      { model: Category, as: "category", attributes: ["id", "name"] },
      { model: User, as: "user", attributes: ["id", "username", "avatar"] },
    ],
  };
};

// define a common function to query course
async function getCourse(req) {
  const { id } = req.params;

  // 1.判断id 是否存在
  const course = await Course.findOne({
    ...getConditions(),
    where: { id },
  });
  if (!course) {
    throw new NotFoundError(`ID: ${id}的课程未找到`);
  }

  return course;
}

/* GET home page. */
router.get("/", async function (req, res, next) {
  // 把我的代码放到 try catch
  try {
    // currentPage 当前页，pageSize 每页条数；默认值分别为 1 和 10 都是数字类型
    const { categoryId, userId, name, recommended, introductory } = req.query;
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    // 计算 offset
    const offset = (currentPage - 1) * pageSize;
    // 如果 name 有值，则添加根据 name 的模糊搜索
    const condition = {
      ...getConditions(),
      where: {},
      order: [["id", "DESC"]],
      limit: pageSize,
      offset: offset,
    };
    if (categoryId) {
      condition.where.categoryId = {
        [Op.eq]: categoryId,
      };
    }
    if (userId) {
      condition.where.userId = {
        [Op.eq]: userId,
      };
    }
    if (name) {
      condition.where.name = {
        [Op.like]: `%${name}%`,
      };
    }
    if (recommended !== undefined) {
      condition.where.recommended = {
        [Op.eq]: recommended === "true",
      };
    }
    if (introductory !== undefined) {
      condition.where.introductory = {
        [Op.eq]: introductory === "true",
      };
    }

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
    res.status(500).json({
      message: "查询课程列表失败",
      status: false,
      errors: [error.message],
    });
  }
});

// 根据 id 查询课程详情
router.get("/:id", async function (req, res, next) {
  try {
    const course = await getCourse(req);

    success(res, "查询课程详情成功", { course });
  } catch (error) {
    failure(res, error);
  }
});

// 新增课程
router.post("/", async function (req, res, next) {
  try {
    // 白名单过滤
    const body = getAttr(req.body);
    // 登陆用户中 挂在了全局的user，可以直接取值
    body.userId = req.user.id;

    const course = await Course.create(body);
    success(res, "新增课程成功", { course }, 201);
  } catch (error) {
    failure(res, error);
  }
});

// 删除课程
router.delete("/:id", async function (req, res, next) {
  try {
    const count = await Chapter.count({
      where: { courseId: req.params.id },
    });
    if (count > 0) {
      throw new Error("当前分类有关联课程，无法删除");
    }
    const course = await getCourse(req);
    // 2.删除课程
    await course.destroy();
    success(res, "删除课程成功");
  } catch (error) {
    failure(res, error);
  }
});

// 更新课程，先找到对应的课程，再更新
router.put("/:id", async function (req, res, next) {
  try {
    const course = await getCourse(req);
    // 白名单过滤
    const body = getAttr(req.body);
    await course.update(body);

    success(res, "更新课程成功", { course });
  } catch (error) {
    failure(res, error);
  }
});
module.exports = router;
