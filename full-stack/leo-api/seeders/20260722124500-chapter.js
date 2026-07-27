"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert(
      "Chapters",
      [
        {
          courseId: 1,
          title: "Css 课程介绍",
          Content: "这套课程，定位是使用css来全栈开发项目。",
          video: "",
          rank: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          courseId: 2,
          title: "Node.js 课程介绍",
          Content:
            "这套课程，定位是使用J5来全栈开发项目。让我们一起从零基础开始，学习接口开发。先从最基础的项目搭建、数据库的入门，再到完整的真实项目开发，一步步",
          video: "",
          rank: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          courseId: 2,
          title: "Node.js 安装介绍",
          Content: "安装最简单的办法就是...",
          video: "",
          rank: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    queryInterface.bulkDelete("Chapters", null, {});
  },
};
