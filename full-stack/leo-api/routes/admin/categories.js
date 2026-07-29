const express = require("express");
const router = express.Router();
const { Category, Course } = require("../../models");
const { Op, where } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFound, Conflict } = require("http-errors");
const { delKey } = require("../../utils/redis");
const { CACHE_CATEGORIES } = require("../../utils/constants");

// Get name and rank
const getAttr = (source) => {
  const { name, rank } = source;

  return { name, rank };
};

const getConditions = () => {
  return {
    include: [{ model: Course, as: "courses", attributes: ["id", "name"] }],
  };
};

// define a common function to query category
async function getCategory(req) {
  const { id } = req.params;

  // 1.判断id 是否存在
  const category = await Category.findOne({
    // ...getConditions(),
    where: { id },
  });
  if (!category) {
    throw new NotFound(`ID: ${id}的分类未找到`);
  }

  return category;
}

/* GET home page. */
router.get("/", async function (req, res, next) {
  // 把我的代码放到 try catch
  try {
    // currentPage 当前页，pageSize 每页条数；默认值分别为 1 和 10 都是数字类型
    const { name, rank } = req.query;
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    // 计算 offset
    const offset = (currentPage - 1) * pageSize;
    // 如果 name 有值，则添加根据 name 的模糊搜索
    const condition = {
      where: {},
      order: [
        ["rank", "ASC"],
        ["id", "DESC"],
      ],
      limit: pageSize,
      offset: offset,
    };
    if (name) {
      condition.where.name = {
        [Op.like]: `%${name}%`,
      };
    }
    // 添加 rank 的模糊搜索条件
    if (rank) {
      condition.where.rank = {
        [Op.like]: `%${rank}%`,
      };
    }

    const { count, rows } = await Category.findAndCountAll(condition);
    success(res, "查询分类列表成功", {
      categories: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "查询分类列表失败",
      status: false,
      errors: [error.message],
    });
  }
});

// 根据 id 查询分类详情
router.get("/:id", async function (req, res, next) {
  try {
    const category = await getCategory(req);

    success(res, "查询分类详情成功", { category });
  } catch (error) {
    failure(res, error);
  }
});

// 新增分类
router.post("/", async function (req, res, next) {
  try {
    // 白名单过滤
    const body = getAttr(req.body);

    const category = await Category.create(body);
    await delKey(CACHE_CATEGORIES);
    success(res, "新增分类成功", { category }, 201);
  } catch (error) {
    failure(res, error);
  }
});

// 删除分类
router.delete("/:id", async function (req, res, next) {
  try {
    const count = await Course.count({
      where: { categoryId: req.params.id },
    });
    if (count > 0) {
      throw new Conflict("当前分类有关联课程，无法删除");
    }
    const category = await getCategory(req);
    // 2.删除分类
    await category.destroy();
    await delKey(CACHE_CATEGORIES);
    await delKey(`category:${req.params.id}`);
    success(res, "删除分类成功");
  } catch (error) {
    failure(res, error);
  }
});

// 更新分类，先找到对应的分类，再更新
router.put("/:id", async function (req, res, next) {
  try {
    const category = await getCategory(req);
    // 白名单过滤
    const body = getAttr(req.body);
    await category.update(body);
    await delKey(CACHE_CATEGORIES);
    await delKey(`category:${req.params.id}`);

    success(res, "更新分类成功", { category });
  } catch (error) {
    failure(res, error);
  }
});
module.exports = router;
