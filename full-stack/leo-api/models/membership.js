'use strict';
const { Model } = require('sequelize');
const { formatDate } = require('../utils/date');
module.exports = (sequelize, DataTypes) => {
  class Membership extends Model {
    static associate(models) {
      // define association here
    }
  }
  Membership.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '会员名称必须填写。' },
          notEmpty: { msg: '会员名称不能为空。' },
          len: {
            args: [2, 50],
            msg: '会员名称长度必须在 2 ~ 50 之间。',
          },
        },
      },
      durationMonths: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: '有效时长必须填写。' },
          isInt: { msg: '有效时长必须是整数。' },
          min: {
            args: [1],
            msg: '有效时长必须大于 0。',
          },
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          notNull: { msg: '价格必须填写。' },
          isDecimal: { msg: '价格必须是合法金额。' },
          min: {
            args: [0],
            msg: '价格不能为负数。',
          },
        },
      },
      rank: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          notNull: { msg: '排序必须填写。' },
          isInt: { msg: '排序必须是整数。' },
          min: {
            args: [0],
            msg: '排序不能为负数。',
          },
        },
      },
      description: {
        type: DataTypes.STRING,
        validate: {
          len: {
            args: [0, 200],
            msg: '描述长度不能超过 200 个字符。',
          },
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        get() {
          return formatDate(this.getDataValue('createdAt'));
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        get() {
          return formatDate(this.getDataValue('updatedAt'));
        },
      },
    },
    {
      sequelize,
      modelName: 'Membership',
    },
  );
  return Membership;
};