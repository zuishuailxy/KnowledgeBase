const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const { BadRequest } = require("http-errors");
const orderService = require("../../services/orderService");

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

    const { count, rows } = await orderService.listOwnOrders({
      userId: req.user.id,
      outTradeNo,
      tradeNo,
      status,
      currentPage,
      pageSize,
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
    const order = await orderService.getOwnOrder(outTradeNo, req.user.id, {
      includeUser: true,
    });

    success(res, "查询订单详情成功", { order });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建订单
 */
router.post("/", async (req, res) => {
  try {
    const { membershipId, paymentMethod } = req.body;

    if (!membershipId) {
      throw new BadRequest("会员方案 ID 不能为空");
    }

    const order = await orderService.createMembershipOrder({
      userId: req.user.id,
      membershipId,
      paymentMethod,
    });

    success(res, "创建订单成功", { order }, 201);
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
