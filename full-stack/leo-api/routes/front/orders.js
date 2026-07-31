const express = require("express");
const router = express.Router();
const { Order, User, Membership } = require("../../models");
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFound, BadRequest } = require("http-errors");

/**
 * 当前用户的所有订单（支持搜索）
 * 查询参数：
 *   outTradeNo - 商户订单号（模糊）
 *   tradeNo   - 支付流水号（模糊）
 *   status    - 订单状态（精确）
 */
router.get("/", async (req, res) => {
  try {
    const { outTradeNo, tradeNo, status } = req.query;
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    // 构建搜索条件
    const where = { userId: req.user.id };

    if (outTradeNo) {
      where.outTradeNo = { [Op.like]: `%${outTradeNo}%` };
    }
    if (tradeNo) {
      where.tradeNo = { [Op.like]: `%${tradeNo}%` };
    }
    // status 精确匹配（0/1/2）
    if (status !== undefined && status !== "") {
      where.status = Number(status);
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
      attributes: { exclude: ["id", "UserId"] },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "avatar"],
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
      where: { outTradeNo, userId: req.user.id },
      attributes: { exclude: ["id", "UserId"] },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "avatar"],
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

/**
 * 创建订单
 */
const crypto = require("crypto");
router.post("/", async (req, res) => {
  try {
    const { membershipId, paymentMethod } = req.body;

    if (!membershipId) {
      throw new BadRequest("会员方案 ID 不能为空");
    }

    // 查询会员方案
    const membership = await Membership.findByPk(membershipId);
    if (!membership) {
      throw new NotFound(`ID: ${membershipId} 的会员方案未找到`);
    }

    const outTradeNo = `ORD${crypto.randomUUID().replace(/-/g, "")}`;

    const order = await Order.create({
      outTradeNo,
      tradeNo: null,
      userId: req.user.id,
      subject: membership.name,
      totalAmount: membership.price,
      paymentMethod: paymentMethod ?? 0,
      status: 0,
    });

    const data = order.toJSON();
    delete data.id;

    success(res, "创建订单成功", { order: data }, 201);
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
