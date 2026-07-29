const express = require("express");
const router = express.Router();
const { Article } = require("../../models");
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFound, BadRequest } = require("http-errors");
const { delByPattern } = require("../../utils/redis");

// Get title and content
const getAttr = (source) => {
  const { title, content } = source;

  return { title, content };
};

// define a common function to query article
async function getArticle(req) {
  const { id } = req.params;

  // 1.判断id 是否存在
  const article = await Article.findOne({
    where: { id },
  });
  if (!article) {
    throw new NotFound(`ID: ${id}的文章未找到`);
  }

  return article;
}

/* GET home page. */
router.get("/", async function (req, res, next) {
  // 把我的代码放到 try catch
  try {
    // currentPage 当前页，pageSize 每页条数；默认值分别为 1 和 10 都是数字类型
    const { title, content } = getAttr(req.query);
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

    if (req.query.deleted === "true") {
      condition.paranoid = false;
      condition.where.deletedAt = {
        [Op.not]: null,
      };
    }
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
    success(res, "查询文章列表成功", {
      articles: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
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
    const article = await getArticle(req);

    success(res, "查询文章详情成功", { article });
  } catch (error) {
    failure(res, error);
  }
});

// 新增文章
router.post("/", async function (req, res, next) {
  try {
    // 白名单过滤
    const body = getAttr(req.body);

    const article = await Article.create(body);
    await delByPattern("articles:*");
    success(res, "新增文章成功", { article }, 201);
  } catch (error) {
    console.log(error);
    failure(res, error);
  }
});

// 删除文章（支持单条/批量）
router.post("/delete", async function (req, res, next) {
  try {
    const { id } = req.body || {};

    if (!id) {
      throw new BadRequest("文章 ID 不能为空");
    }

    const ids = Array.isArray(id) ? id : [id];
    await Article.destroy({
      where: {
        id: ids,
        // force: true 强制删除，变为硬删除
        // force: true,
      },
    });
    await delByPattern("articles:*");
    success(res, `成功删除 ${ids.length} 篇文章`);
  } catch (error) {
    failure(res, error);
  }
});

// 恢复文章（支持单条/批量）
router.post("/restore", async function (req, res, next) {
  try {
    const { id } = req.body || {};

    if (!id) {
      throw new BadRequest("文章 ID 不能为空");
    }

    const ids = Array.isArray(id) ? id : [id];
    await Article.restore({ where: { id: ids } });
    await delByPattern("articles:*");
    success(res, `成功恢复 ${ids.length} 篇文章`);
  } catch (error) {
    failure(res, error);
  }
});

// 更新文章，先找到对应的文章，再更新
router.put("/:id", async function (req, res, next) {
  try {
    const article = await getArticle(req);
    // 白名单过滤
    const body = getAttr(req.body);
    await article.update(body);
    await delByPattern("articles:*");

    success(res, "更新文章成功", { article });
  } catch (error) {
    failure(res, error);
  }
});
module.exports = router;
