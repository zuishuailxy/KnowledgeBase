const express = require("express");
const router = express.Router();
const { Order } = require("../../models");
const { success, failure } = require("../../utils/responses");
const { NotFound, BadRequest } = require("http-errors");
const userAuthMiddleware = require("../../middlewares/user-auth");

/**
 * 根据商户订单号查询自己的订单
 */
router.get("/query", userAuthMiddleware, async (req, res) => {
  try {
    const { outTradeNo } = req.query;

    if (!outTradeNo) {
      throw new BadRequest("订单号不能为空");
    }

    const order = await Order.findOne({
      where: { outTradeNo, userId: req.user.id },
      attributes: { exclude: ["id", "UserId"] },
    });

    if (!order) {
      throw new NotFound(`订单号 ${outTradeNo} 的订单未找到`);
    }

    success(res, "查询订单成功", { order });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
