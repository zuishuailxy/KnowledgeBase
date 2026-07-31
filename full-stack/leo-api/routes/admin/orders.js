const express = require("express");
const router = express.Router();
const { Order, User } = require("../../models");
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFound } = require("http-errors");

/**
 * 查询所有订单（支持搜索）
 * 查询参数：outTradeNo（模糊）, tradeNo（模糊）, status, userId（精确）
 */
router.get("/", async (req, res) => {
  try {
    const { outTradeNo, tradeNo, status, userId } = req.query;
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    const where = {};
    if (outTradeNo) where.outTradeNo = { [Op.like]: `%${outTradeNo}%` };
    if (tradeNo) where.tradeNo = { [Op.like]: `%${tradeNo}%` };
    if (status !== undefined && status !== "") where.status = Number(status);
    if (userId) where.userId = Number(userId);

    const { count, rows } = await Order.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
      attributes: { exclude: ["UserId"] },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "avatar", "nickname"],
        },
      ],
    });

    success(res, "查询订单列表成功", {
      orders: rows,
      pagination: { total: count, currentPage, pageSize },
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 根据商户订单号查询订单详情
 */
router.get("/:outTradeNo", async (req, res) => {
  try {
    const { outTradeNo } = req.params;
    const order = await Order.findOne({
      where: { outTradeNo },
      attributes: { exclude: ["id", "UserId"] },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "avatar", "nickname", "email"],
        },
      ],
    });

    if (!order) {
      throw new NotFound(`订单号 ${outTradeNo} 的订单未找到`);
    }

    success(res, "查询订单详情成功", { order });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
