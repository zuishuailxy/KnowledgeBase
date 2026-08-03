const crypto = require("crypto");
const { Order, Membership, User, sequelize } = require("../models");
const { Op } = require("sequelize");
const { NotFound, BadRequest } = require("http-errors");
const { notifyOrderChanged } = require("../stream/count-order");

/** 订单返回字段（排除内部字段） */
const ORDER_ATTRS = { exclude: ["id", "UserId", "membershipId"] };

/** 关联的会员信息字段 */
const MEMBERSHIP_ATTRS = ["id", "name", "durationMonths", "price"];

/** 关联的用户信息字段 */
const USER_ATTRS = ["id", "username", "avatar"];

/**
 * 统一给订单对象补上顶层 membershipMonths，便于前端直接读取
 */
function normalizeOrder(order) {
  if (!order) {
    return order;
  }

  const plainOrder = order.toJSON ? order.toJSON() : order;
  plainOrder.membershipMonths =
    plainOrder.membership?.durationMonths ??
    plainOrder.membershipMonths ??
    null;

  return plainOrder;
}

/**
 * 查询自己的订单（含归属校验）
 * @param {string} outTradeNo - 商户订单号
 * @param {number} userId - 当前用户 ID
 * @param {Object} [options] - { includeUser }
 */
async function getOwnOrder(outTradeNo, userId, options = {}) {
  const include = [
    { model: Membership, as: "membership", attributes: MEMBERSHIP_ATTRS },
  ];

  if (options.includeUser) {
    include.push({ model: User, as: "user", attributes: USER_ATTRS });
  }

  const order = await Order.findOne({
    where: { outTradeNo, userId },
    attributes: ORDER_ATTRS,
    include,
  });

  if (!order) {
    throw new NotFound(`订单号 ${outTradeNo} 的订单未找到`);
  }

  return normalizeOrder(order);
}

/**
 * 分页查询自己的订单列表（支持搜索）
 * @param {Object} params
 */
async function listOwnOrders({
  userId,
  outTradeNo,
  tradeNo,
  status,
  currentPage = 1,
  pageSize = 10,
}) {
  const where = { userId };

  if (outTradeNo) {
    where.outTradeNo = { [Op.like]: `%${outTradeNo}%` };
  }
  if (tradeNo) {
    where.tradeNo = { [Op.like]: `%${tradeNo}%` };
  }
  if (status !== undefined && status !== "") {
    where.status = Number(status);
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    order: [["id", "DESC"]],
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
    attributes: ORDER_ATTRS,
    include: [
      { model: Membership, as: "membership", attributes: MEMBERSHIP_ATTRS },
      { model: User, as: "user", attributes: USER_ATTRS },
    ],
  });

  return { count, rows: rows.map(normalizeOrder) };
}

/**
 * 创建会员订单
 * @param {Object} params
 */
async function createMembershipOrder({ userId, membershipId, paymentMethod }) {
  const membership = await Membership.findByPk(membershipId);
  if (!membership) {
    throw new NotFound(`ID: ${membershipId} 的会员方案未找到`);
  }

  const order = await Order.create({
    outTradeNo: `ORD${crypto.randomUUID().replace(/-/g, "")}`,
    tradeNo: null,
    userId,
    membershipId,
    subject: membership.name,
    totalAmount: membership.price,
    paymentMethod: paymentMethod ?? 0,
    status: 0,
  });

  // 通知 SSE 客户端有新订单，推送最新统计
  notifyOrderChanged();

  const data = order.toJSON();
  delete data.id;
  data.membershipMonths = membership.durationMonths;
  return data;
}

/**
 * 支付前查询订单（校验归属 + 待支付状态）
 * @param {string} outTradeNo - 商户订单号
 * @param {number} userId - 当前用户 ID
 */
async function getOrderForPayment(outTradeNo, userId) {
  const order = await Order.findOne({
    where: { outTradeNo, userId },
  });

  if (!order) {
    throw new NotFound(`订单号 ${outTradeNo} 的订单未找到`);
  }
  if (order.status !== 0) {
    throw new BadRequest("该订单已支付或已关闭，无法发起支付");
  }

  return order;
}

/**
 * 更新订单支付结果（同步回调/异步通知共用）
 * @param {Object} params - userId 可选，回调场景下按 outTradeNo（全局唯一）查订单
 *   paymentMethod 可选：0=微信 1=支付宝 2=其他；传入才更新，便于扩展不同支付渠道
 */
async function updateOrderPaymentStatus({
  outTradeNo,
  userId,
  tradeNo,
  tradeStatus,
  totalAmount,
  paymentMethod,
}) {
  const where = { outTradeNo };
  if (userId) {
    where.userId = userId;
  }

  // 悲观锁：整个“查-改-开通会员”放在一个事务里，并对订单行加排他锁（FOR UPDATE）。
  // 并发回调（/return 与 /notify 同时到达）时，后到者会阻塞在加锁处，
  // 等先到者提交后再读到最新状态，从而走幂等分支，避免重复开通会员。
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      throw new NotFound(`订单号 ${outTradeNo} 的订单未找到`);
    }

    // 金额校验：回调金额必须等于订单应付金额，防止篡改回调参数
    if (
      totalAmount !== undefined &&
      Number(totalAmount) !== Number(order.totalAmount)
    ) {
      throw new BadRequest("支付金额与订单金额不一致");
    }

    const isSuccess = ["TRADE_SUCCESS", "TRADE_FINISHED"].includes(tradeStatus);

    if (!isSuccess) {
      await transaction.commit();
      return order;
    }

    // 幂等：加锁后重新校验，已支付订单不重复更新，保留首次支付时间
    if (order.status === 1) {
      await transaction.commit();
      return order;
    }

    // 1. 更新订单为已支付
    await order.update(
      {
        tradeNo: tradeNo || order.tradeNo,
        status: 1,
        ...(paymentMethod !== undefined ? { paymentMethod } : {}),
        paidAt: new Date(),
      },
      { transaction },
    );

    // 2. 同步会员权益：改 role + 叠加会员到期时间
    await grantMembership(order, { transaction });

    await transaction.commit();

    // 订单状态变化（待支付 → 已支付），通知 SSE 客户端刷新统计
    notifyOrderChanged();

    return order;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * 根据已支付订单为用户开通/续费会员
 * 会员未过期：在现有到期时间上叠加时长；
 * 已过期或从未购买：从当前时间开始计算。
 * @param {Object} order - 已支付订单（需含 userId、membershipId）
 * @param {Object} [options] - { transaction }
 */
async function grantMembership(order, options = {}) {
  if (!order.userId || !order.membershipId) {
    return;
  }

  const membership = await Membership.findByPk(order.membershipId, options);
  const user = await User.findByPk(order.userId, options);

  if (!membership || !user) {
    return;
  }

  const now = new Date();
  const currentExpiry = user.membershipExpiresAt
    ? new Date(user.membershipExpiresAt)
    : null;

  // 未过期：在剩余时间上叠加；已过期/无会员：从当前时间开始
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(base);
  newExpiry.setMonth(newExpiry.getMonth() + membership.durationMonths);

  const updates = {
    membershipExpiresAt: newExpiry,
  };

  // 管理员（100）不能被降级为会员（1），但仍可叠加会员到期时间
  if (user.role !== 100) {
    updates.role = 1;
  }

  await user.update(updates, options);
}

/** 管理员关联的用户字段（含邮箱） */
const ADMIN_USER_ATTRS = ["id", "username", "avatar", "nickname", "email"];

/**
 * 管理员：分页查询所有订单（支持搜索）
 * @param {Object} params - { outTradeNo, tradeNo, status, userId, currentPage, pageSize }
 */
async function listOrders({
  outTradeNo,
  tradeNo,
  status,
  userId,
  currentPage = 1,
  pageSize = 10,
}) {
  const where = {};

  if (outTradeNo) where.outTradeNo = { [Op.like]: `%${outTradeNo}%` };
  if (tradeNo) where.tradeNo = { [Op.like]: `%${tradeNo}%` };
  if (status !== undefined && status !== "") where.status = Number(status);
  if (userId) where.userId = Number(userId);

  const { count, rows } = await Order.findAndCountAll({
    where,
    order: [["id", "DESC"]],
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
    attributes: { exclude: ["UserId", "membershipId"] },
    include: [
      { model: Membership, as: "membership", attributes: MEMBERSHIP_ATTRS },
      { model: User, as: "user", attributes: ADMIN_USER_ATTRS },
    ],
  });

  return { count, rows: rows.map(normalizeOrder) };
}

/**
 * 管理员：根据商户订单号查询订单详情
 * @param {string} outTradeNo - 商户订单号
 */
async function getOrder(outTradeNo) {
  const order = await Order.findOne({
    where: { outTradeNo },
    attributes: { exclude: ["id", "UserId", "membershipId"] },
    include: [
      { model: Membership, as: "membership", attributes: MEMBERSHIP_ATTRS },
      { model: User, as: "user", attributes: ADMIN_USER_ATTRS },
    ],
  });

  if (!order) {
    throw new NotFound(`订单号 ${outTradeNo} 的订单未找到`);
  }

  return normalizeOrder(order);
}

module.exports = {
  getOwnOrder,
  listOwnOrders,
  createMembershipOrder,
  getOrderForPayment,
  updateOrderPaymentStatus,
  listOrders,
  getOrder,
};
