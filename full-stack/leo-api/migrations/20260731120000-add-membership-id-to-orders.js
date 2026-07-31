"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Orders", "membershipId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Memberships",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });

    await queryInterface.sequelize.query(`
      UPDATE Orders
      SET membershipId = CASE
        WHEN subject = '月度会员' THEN 1
        WHEN subject = '季度会员' THEN 2
        WHEN subject = '年度会员' THEN 3
        WHEN subject = '永久会员' THEN 4
        ELSE 1
      END
      WHERE membershipId IS NULL OR membershipId = 0;
    `);

    await queryInterface.changeColumn("Orders", "membershipId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: "Memberships",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });

    await queryInterface.addIndex("Orders", ["membershipId"], {
      name: "idx_orders_membership_id",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("Orders", "idx_orders_membership_id");
    await queryInterface.removeColumn("Orders", "membershipId");
  },
};
