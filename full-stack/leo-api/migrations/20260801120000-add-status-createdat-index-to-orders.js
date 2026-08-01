"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 联合索引：加速定时关单任务的 WHERE status=0 AND createdAt < cutoff
    await queryInterface.addIndex("Orders", ["status", "createdAt"], {
      name: "idx_orders_status_created_at",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("Orders", "idx_orders_status_created_at");
  },
};
