const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const { BadRequest } = require("http-errors");
const userAuthMiddleware = require("../../middlewares/user-auth");
const orderService = require("../../services/orderService");
const alipaySdk = require("../../utils/alipay");
require("dotenv").config();

// 支付宝同步回跳地址（后端 /return 路由，浏览器会被支付宝重定向到这里）
const RETURN_URL = process.env.ALIPAY_RETURN_URL || "http://localhost:3000";
// 支付宝异步通知地址（支付宝服务器 POST 到这里）
const NOTIFY_URL =
  process.env.ALIPAY_NOTIFY_URL || "http://localhost:3000/api/alipay/notify";
// 处理完回调后，重定向回的前端页面地址（和 RETURN_URL 必须不同，否则死循环）
const FRONTEND_RETURN_URL =
  process.env.ALIPAY_FRONTEND_RETURN_URL || "http://localhost:3000";

/**
 * 根据商户订单号查询自己的订单
 */
router.get("/query", userAuthMiddleware, async (req, res) => {
  try {
    const { outTradeNo } = req.query;

    if (!outTradeNo) {
      throw new BadRequest("订单号不能为空");
    }

    const order = await orderService.getOwnOrder(outTradeNo, req.user.id);

    success(res, "查询订单成功", { order });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 支付完成同步回调（支付宝浏览器回跳）
 * 注意：不能挂 userAuthMiddleware，因为支付宝回跳不会带登录态；
 * 安全由 checkNotifySign 验签保证。
 * 支付宝会带回 out_trade_no、trade_no、trade_status、total_amount 等参数。
 */
router.get("/return", async (req, res) => {
  try {
    const alipayData = req.query;
    const { out_trade_no, trade_no, trade_status, total_amount } = alipayData;

    if (!out_trade_no) {
      throw new BadRequest("缺少支付回调参数 out_trade_no");
    }

    const verify = alipaySdk.checkNotifySign(alipayData);
    if (!verify) {
      throw new BadRequest("支付宝回调验签失败");
    }

    // 更新订单状态（幂等 + 金额校验），1 = 支付宝
    const order = await orderService.updateOrderPaymentStatus({
      outTradeNo: out_trade_no,
      tradeNo: trade_no,
      tradeStatus: trade_status,
      totalAmount: total_amount,
      paymentMethod: 1,
    });

    // 跳回前端页面，并把支付结果通过 query 带回去
    const redirectUrl = new URL(FRONTEND_RETURN_URL);
    redirectUrl.searchParams.set("outTradeNo", order.outTradeNo);
    redirectUrl.searchParams.set("tradeNo", order.tradeNo || trade_no || "");
    redirectUrl.searchParams.set("tradeStatus", trade_status || "");
    redirectUrl.searchParams.set(
      "paymentStatus",
      ["TRADE_SUCCESS", "TRADE_FINISHED"].includes(trade_status)
        ? "success"
        : "pending",
    );

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 支付结果异步通知（支付宝服务器 POST 回调）
 * 这是订单状态的权威来源，必须验签，且不能被登录态拦截。
 * 处理成功必须返回纯文本 "success"，否则支付宝会持续重试。
 */
router.post("/notify", async (req, res) => {
  try {
    const alipayData = req.body;
    const { out_trade_no, trade_no, trade_status, total_amount } = alipayData;

    const verify = alipaySdk.checkNotifySign(alipayData);
    if (!verify) {
      return res.send("failure");
    }

    await orderService.updateOrderPaymentStatus({
      outTradeNo: out_trade_no,
      tradeNo: trade_no,
      tradeStatus: trade_status,
      totalAmount: total_amount,
      paymentMethod: 1,
    });

    res.send("success");
  } catch (error) {
    // 无论什么错误都不能让支付宝继续重试误判成功，统一返回 failure
    res.send("failure");
  }
});

/**
 * 前端主动查询支付宝交易状态（兜底）
 * 用途：同步回跳/异步通知都失败时，前端主动调用此接口，
 * 后端向支付宝发起 alipay.trade.query，若确认已支付则同步更新本地订单。
 * 参数：
 *   outTradeNo - 商户订单号（必填）
 */
router.get("/query-status", userAuthMiddleware, async (req, res) => {
  try {
    const { outTradeNo } = req.query;

    if (!outTradeNo) {
      throw new BadRequest("订单号不能为空");
    }

    // 1. 校验订单归属（不管订单当前状态，都允许主动查询）
    const order = await orderService.getOwnOrder(outTradeNo, req.user.id);

    // 1.5 已关闭的订单没必要再查支付宝，直接短路返回本地状态
    if (Number(order.status) === 2) {
      return success(res, "订单已关闭，无需查询支付宝", {
        order,
        alipayStatus: null,
      });
    }

    // 2. 主动向支付宝发起交易查询
    let result;
    try {
      result = await alipaySdk.exec("alipay.trade.query", {
        bizContent: { outTradeNo },
      });
    } catch (error) {
      // 支付宝侧查询失败（如订单从未在支付宝发起），返回本地订单状态
      return success(res, "支付宝未查到该交易，返回本地订单状态", {
        order,
        alipayStatus: null,
      });
    }

    const { tradeStatus, tradeNo, totalAmount } = result || {};
    const isPaid = ["TRADE_SUCCESS", "TRADE_FINISHED"].includes(tradeStatus);

    // 3. 支付宝确认已支付 → 同步更新本地订单（幂等，重复调用安全）
    let finalOrder = order;
    if (isPaid) {
      await orderService.updateOrderPaymentStatus({
        outTradeNo,
        userId: req.user.id,
        tradeNo,
        tradeStatus,
        totalAmount,
        paymentMethod: 1,
      });
      // 重新查一次，返回带 membership 的规范化订单
      finalOrder = await orderService.getOwnOrder(outTradeNo, req.user.id);
    }

    success(res, "查询支付宝支付状态成功", {
      order: finalOrder,
      alipayStatus: tradeStatus || null,
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 生成支付链接
 * 参数：
 *   outTradeNo - 商户订单号
 *   platform   - web（电脑网页）| mobile（手机网页）
 */
router.get("/pay", userAuthMiddleware, async (req, res) => {
  try {
    const { outTradeNo, platform } = req.query;

    if (!outTradeNo) {
      throw new BadRequest("订单号不能为空");
    }

    if (platform && !["web", "mobile"].includes(platform)) {
      throw new BadRequest("platform 必须为 web 或 mobile");
    }

    const normalizedPlatform = platform === "mobile" ? "mobile" : "web";

    // 1. 查询订单（含归属校验 + 待支付状态校验）
    const order = await orderService.getOrderForPayment(
      outTradeNo,
      req.user.id,
    );

    // 2. 公共业务参数
    const bizContent = {
      outTradeNo: order.outTradeNo,
      totalAmount: order.totalAmount,
      subject: order.subject,
      returnUrl: RETURN_URL,
      notifyUrl: NOTIFY_URL,
    };

    // 3. 根据平台选择支付方式
    let payUrl;
    if (normalizedPlatform === "mobile") {
      // 手机网站支付
      bizContent.productCode = "QUICK_WAP_WAY";
      payUrl = alipaySdk.pageExecute("alipay.trade.wap.pay", "GET", {
        bizContent,
        returnUrl: RETURN_URL,
      });
    } else {
      // 电脑网站支付（默认）
      bizContent.productCode = "FAST_INSTANT_TRADE_PAY";
      payUrl = alipaySdk.pageExecute("alipay.trade.page.pay", "GET", {
        bizContent,
        returnUrl: RETURN_URL,
      });
    }

    success(res, "获取支付链接成功", { payUrl, platform: normalizedPlatform });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
