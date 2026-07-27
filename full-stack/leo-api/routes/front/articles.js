const express = require("express");
const router = express.Router();
const { Article } = require("../../models");
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFoundError } = require("../../utils/errors");

// 查询文章列表（不含正文）
router.get("/", async function (req, res) {
  try {
    const { title } = req.query;
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

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

    success(res, "查询文章列表成功", {
      articles: rows,
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

// 查询文章详情（包含正文）
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);

    if (!article) {
      throw new NotFoundError(`ID: ${id} 的文章未找到`);
    }

    success(res, "查询文章详情成功", { article });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
