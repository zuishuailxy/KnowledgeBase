"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Courses", "free", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn("Chapters", "free", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addIndex("Courses", {
      fields: ["free"],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Courses", "free");
    await queryInterface.removeColumn("Chapters", "free");
  },
};
