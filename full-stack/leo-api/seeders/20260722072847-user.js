"use strict";
const bcrypt = require("bcryptjs");
// 哈希密码
const salt = bcrypt.genSaltSync(10);

/** @type {import('sequelize-cli').Migration} */
(
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
        "Users",
        [
          {
            email: "admin@leo.cn",
            username: "admin",
            password: bcrypt.hashSync("123124", salt),
            nickname: "超厉害的管理员",
            sex: 2,
            role: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            email: "user@leo.cn",
            username: "user",
            password: bcrypt.hashSync("123124", salt),
            nickname: "普通用户",
            sex: 1,
            role: 0,
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
      await queryInterface.bulkDelete("Users", null, {});
    },
  }
);
