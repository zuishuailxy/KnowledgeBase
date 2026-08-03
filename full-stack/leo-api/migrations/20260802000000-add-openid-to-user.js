"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 微信登录 openid：可空（不是所有用户都走微信登录），加唯一索引（openid 是微信侧唯一标识）
    await queryInterface.addColumn("Users", "openid", {
      type: Sequelize.STRING(64),
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "openid");
  },
};
