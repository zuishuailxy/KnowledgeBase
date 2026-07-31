"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert("Memberships", [
      {
        name: "月度会员",
        durationMonths: 1,
        price: 29.9,
        rank: 1,
        description: "按月订阅，享受基础会员权益",
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "季度会员",
        durationMonths: 3,
        price: 79.9,
        rank: 2,
        description: "按季订阅，享 9 折优惠",
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "年度会员",
        durationMonths: 12,
        price: 299.0,
        rank: 3,
        description: "按年订阅，享 8 折优惠，性价比最高",
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "永久会员",
        durationMonths: 999,
        price: 999.0,
        rank: 4,
        description: "一次付费，终身使用",
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Memberships", null, {});
  },
};
