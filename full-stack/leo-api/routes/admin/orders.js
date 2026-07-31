const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const orderService = require("../../services/orderService");

/**
 * 查询所有订单（支持搜索）
 * 查询参数：outTradeNo（模糊）, tradeNo（模糊）, status, userId（精确）
 */
router.get("/", async (req, res) => {
  try {
    const { outTradeNo, tradeNo, status, userId } = req.query;
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;

    const { count, rows } = await orderService.listOrders({
      outTradeNo,
      tradeNo,
      status,
      userId,
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
    const order = await orderService.getOrder(outTradeNo);

    success(res, "查询订单详情成功", { order });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
