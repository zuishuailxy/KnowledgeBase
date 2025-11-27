const express = require("express");
const router = express.Router();
const { Article } = require("../../models");
const { Op } = require("sequelize");
const { NotFoundError } = require("../../utils/response");

// 白名单过滤
const getTitleAndContent = (source) => {
  const { title, content } = source;

  return { title, content };
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  // 把我的代码放到 try catch
  try {
    // currentPage 当前页，pageSize 每页条数；默认值分别为 1 和 10 都是数字类型
    const { title, content } = req.query;
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    // 计算 offset
    const offset = (currentPage - 1) * pageSize;
    // 如果 title 有值，则添加根据 title 的模糊搜索
    const condition = {
      where: {},
      order: [["id", "DESC"]],
      limit: pageSize,
      offset: offset,
    };
    if (title) {
      condition.where.title = {
        [Op.like]: `%${title}%`,
      };
    }
    // 添加 content 的模糊搜索条件
    if (content) {
      condition.where.content = {
        [Op.like]: `%${content}%`,
      };
    }

    const { count, rows } = await Article.findAndCountAll(condition);
    res.json({
      message: "查询文章列表成功",
      status: true,
      data: {
        articles: rows,
        pagination: {
          total: count,
          currentPage,
          pageSize,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "查询文章列表失败",
      status: false,
      errors: [error.message],
    });
  }
});

// 根据 id 查询文章详情
router.get("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const condition = {
      where: {
        id,
      },
    };

    const article = await Article.findOne(condition);
    // 判断有没有值，没有值则返回404
    if (!article) {
      return res.status(404).json({
        message: "文章不存在",
        status: false,
        errors: ["文章不存在"],
      });
    }
    res.json({ message: "查询文章详情成功", status: true, data: { article } });
  } catch (error) {
    res.status(500).json({
      message: "查询文章详情失败",
      status: false,
      errors: [error.message],
    });
  }
});

// 新增文章
router.post("/", async function (req, res, next) {
  try {
    // 白名单过滤
    const body = getTitleAndContent(req.body);

    const article = await Article.create(body);
    res
      .status(201)
      .json({ message: "新增文章成功", status: true, data: { article } });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((e) => e.message);
      res.status(400).json({
        message: "新增文章失败",
        status: false,
        errors,
      });
    } else {
      res.status(500).json({
        message: "新增文章失败",
        status: false,
        errors: [error.message],
      });
    }
  }
});

// 删除文章
router.delete("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;

    // 1.判断id 是否存在
    const article = await Article.findOne({
      where: { id },
    });
    if (!article) {
      return res.status(404).json({
        message: "文章不存在",
        status: false,
        errors: ["文章不存在"],
      });
    }
    // 2.删除文章
    await article.destroy();
    res.json({ message: "删除文章成功", status: true });
  } catch (error) {
    res.status(500).json({
      message: "删除文章失败",
      status: false,
      errors: [error.message],
    });
  }
});

// 更新文章，先找到对应的文章，再更新
router.put("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const article = await Article.findOne({
      where: { id },
    });
    if (!article) {
      return res.status(404).json({
        message: "文章不存在",
        status: false,
        errors: ["文章不存在"],
      });
    }
    // 白名单过滤
    const body = getTitleAndContent(req.body);
    await article.update(body);
    res.json({ message: "更新文章成功", status: true, data: article });
  } catch (error) {
    res.status(500).json({
      message: "更新文章失败",
      status: false,
      errors: [error.message],
    });
  }
});
module.exports = router;
