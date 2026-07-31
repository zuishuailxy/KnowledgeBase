"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../utils/date");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      models.Order.belongsTo(models.User, {
        as: "user",
        foreignKey: "userId",
      });
      models.Order.belongsTo(models.Membership, {
        as: "membership",
        foreignKey: "membershipId",
      });
    }
  }
  Order.init(
    {
      outTradeNo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "商户订单号必须填写。" },
          notEmpty: { msg: "商户订单号不能为空。" },
        },
      },
      tradeNo: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "用户必须选择。" },
          isInt: { msg: "用户 ID 必须是整数。" },
        },
      },
      membershipId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Memberships",
          key: "id",
        },
        validate: {
          notNull: { msg: "会员方案必须选择。" },
          isInt: { msg: "会员方案 ID 必须是整数。" },
        },
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "订单标题必须填写。" },
          notEmpty: { msg: "订单标题不能为空。" },
        },
      },
      membershipMonths: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("membership")?.durationMonths ?? null;
        },
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          notNull: { msg: "金额必须填写。" },
          isDecimal: { msg: "金额必须是合法金额。" },
          min: {
            args: [0],
            msg: "金额不能为负数。",
          },
        },
      },
      paymentMethod: {
        type: DataTypes.TINYINT,
        validate: {
          isIn: {
            args: [[0, 1, 2]],
            msg: "支付方式只能是 0（微信）、1（支付宝）或 2（其他）。",
          },
        },
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
        validate: {
          notNull: { msg: "订单状态必须选择。" },
          isIn: {
            args: [[0, 1, 2]],
            msg: "订单状态只能是 0（待支付）、1（已支付）或 2（已取消）。",
          },
        },
      },
      paidAt: {
        type: DataTypes.DATE,
        get() {
          return formatDate(this.getDataValue("paidAt"));
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        get() {
          return formatDate(this.getDataValue("createdAt"));
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        get() {
          return formatDate(this.getDataValue("updatedAt"));
        },
      },
    },
    {
      sequelize,
      modelName: "Order",
      // 乐观锁：version 字段由 Sequelize 自动维护，
      // 并发更新冲突时抛出 OptimisticLockError，防止重复支付更新覆盖数据
      // version: true,
    },
  );
  return Order;
};
