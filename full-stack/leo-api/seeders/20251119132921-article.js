"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 批量插入
    const articles = [];
    const count = 100;
    for (let i = 0; i < count; i++) {
      articles.push({
        title: `文章的标题 ${i + 1}`,
        content: `文章内容 ${i + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await queryInterface.bulkInsert("Articles", articles, {});
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Articles", null, {});
  },
};
