"use strict";
const crypto = require("crypto");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const uid = () => crypto.randomUUID().replace(/-/g, "");

    await queryInterface.bulkInsert(
      "Orders",
      [
        {
          outTradeNo: `ORD${uid()}`,
          tradeNo: `WX${uid()}`,
          userId: 2,
          subject: "月度会员",
          totalAmount: 29.9,
          paymentMethod: 0,
          status: 1,
          paidAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          outTradeNo: `ORD${uid()}`,
          tradeNo: `WX${uid()}`,
          userId: 2,
          subject: "年度会员",
          totalAmount: 299.0,
          paymentMethod: 0,
          status: 1,
          paidAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          outTradeNo: `ORD${uid()}`,
          tradeNo: "",
          userId: 3,
          subject: "季度会员",
          totalAmount: 79.9,
          paymentMethod: 1,
          status: 0,
          paidAt: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          outTradeNo: `ORD${uid()}`,
          tradeNo: `ALI${uid()}`,
          userId: 3,
          subject: "永久会员",
          totalAmount: 999.0,
          paymentMethod: 1,
          status: 1,
          paidAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Orders", null, {});
  },
};
