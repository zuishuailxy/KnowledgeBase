const express = require("express");
const router = express.Router();
const { Article } = require("../../models");
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFound } = require("http-errors");
const { getKey, setKey } = require("../../utils/redis");
const { ARTICLES_TTL } = require("../../utils/constants");

// 查询文章列表（不含正文）
router.get("/", async function (req, res) {
  try {
    const { title } = req.query;
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    const cacheKey = `articles:${currentPage}:${pageSize}:${title || "all"}`;

    // 读缓存
    const cached = await getKey(cacheKey);
    if (cached) {
      return success(res, "查询文章列表成功", cached);
    }

    const condition = {
      attributes: { exclude: ["content"] },
      where: {},
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
    };

    if (title) {
      condition.where.title = {
        [Op.like]: `%${title}%`,
      };
    }

    const { count, rows } = await Article.findAndCountAll(condition);

    const data = {
      articles: rows,
      pagination: { total: count, currentPage, pageSize },
    };

    await setKey(cacheKey, data, ARTICLES_TTL);

    success(res, "查询文章列表成功", data);
  } catch (error) {
    failure(res, error);
  }
});

// 查询文章详情（包含正文）
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);

    if (!article) {
      throw new NotFound(`ID: ${id} 的文章未找到`);
    }

    success(res, "查询文章详情成功", { article });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
