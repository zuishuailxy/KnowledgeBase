const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { BadRequestError } = require("../../utils/errors");
const { Course, Category, User } = require("../../models");

// 根据 name 模糊搜索课程
router.get("/", async function (req, res) {
  try {
    const { name } = req.query;

    if (!name) {
      throw new BadRequestError("搜索关键词不能为空");
    }

    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    const { count, rows } = await Course.findAndCountAll({
      attributes: { exclude: ["CategoryId", "UserId", "content"] },
      where: {
        name: {
          [Op.like]: `%${name}%`,
        },
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
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
    });

    success(res, "搜索课程成功", {
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

module.exports = router;
