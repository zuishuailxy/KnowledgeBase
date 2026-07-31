"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      outTradeNo: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      tradeNo: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      subject: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      totalAmount: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2).UNSIGNED,
      },
      paymentMethod: {
        type: Sequelize.TINYINT,
      },
      status: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.TINYINT,
      },
      paidAt: {
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("Orders", ["outTradeNo"], {
      unique: true,
      name: "idx_orders_out_trade_no",
    });
    await queryInterface.addIndex("Orders", ["tradeNo"], {
      unique: true,
      name: "idx_orders_trade_no",
    });
    await queryInterface.addIndex("Orders", ["userId"], {
      name: "idx_orders_user_id",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Orders");
  },
};
