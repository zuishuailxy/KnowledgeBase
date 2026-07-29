const express = require("express");
const router = express.Router();
const { User } = require("../../models");
const { Op, fn, col, where } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFound } = require("http-errors");

// 查询用户性别
router.get("/sex", async (req, res) => {
  try {
    const [male, female, unknown] = await Promise.all([
      User.count({ where: { sex: 0 } }),
      User.count({ where: { sex: 1 } }),
      User.count({ where: { sex: { [Op.notIn]: [0, 1] } } }),
    ]);

    // 2（未知）、0（男）或 1（女）
    const data = [
      { value: male, name: "男性" },
      { value: female, name: "女性" },
      { value: unknown, name: "未知" },
    ];

    success(res, "查询用户性别成功", { data });
  } catch (error) {
    failure(res, error);
  }
});

// 查询每月新增用户数量
router.get("/user", async (req, res) => {
  try {
    const { year } = req.query;
    const condition = {};

    if (year !== undefined) {
      if (!/^\d{4}$/.test(year)) {
        return res.status(400).json({
          message: "查询年份格式不正确。",
          status: false,
          errors: ["year 必须是四位数字。"],
        });
      }
      condition.where = where(fn("YEAR", col("createdAt")), year);
    }

    const rows = await User.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "month"],
        [fn("COUNT", col("id")), "count"],
      ],
      ...condition,
      group: [fn("DATE_FORMAT", col("createdAt"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    const data = {
      months: rows.map((row) => row.month),
      values: rows.map((row) => Number(row.count)),
    };

    success(res, "查询每月用户数量成功", { data });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
