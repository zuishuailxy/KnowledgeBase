"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");
const { formatDate } = require("../utils/date");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
      models.User.hasMany(models.Course, { as: "courses" });
      models.User.belongsToMany(models.Course, {
        through: models.Like,
        foreignKey: "userId",
        as: "likedCourses",
      });
      models.User.hasMany(models.Order, { as: "orders" });
    }
  }
  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "邮箱必须填写。" },
          notEmpty: { msg: "邮箱不能为空。" },
          isEmail: { msg: "邮箱格式不正确。" },
        },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "用户名必须填写。" },
          notEmpty: { msg: "用户名不能为空。" },
          len: {
            args: [2, 45],
            msg: "用户名长度必须在 2 ~ 45 之间。",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "密码必须填写。" },
          notEmpty: { msg: "密码不能为空。" },
          len: {
            args: [6, 255],
            msg: "密码长度必须在 6 ~ 255 之间。",
          },
        },
      },
      nickname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "昵称必须填写。" },
          notEmpty: { msg: "昵称不能为空。" },
          len: {
            args: [2, 45],
            msg: "昵称长度必须在 2 ~ 45 之间。",
          },
        },
      },
      sex: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 2,
        validate: {
          notNull: { msg: "性别必须选择。" },
          isIn: {
            args: [[0, 1, 2]],
            msg: "性别只能是 2（未知）、0（男）或 1（女）。",
          },
        },
      },
      company: {
        type: DataTypes.STRING,
        validate: {
          len: {
            args: [0, 100],
            msg: "公司名称不能超过 100 个字符。",
          },
        },
      },
      introduce: {
        type: DataTypes.TEXT,
        validate: {
          len: {
            args: [0, 255],
            msg: "简介不能超过 255 个字符。",
          },
        },
      },
      role: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
        validate: {
          notNull: { msg: "角色必须选择。" },
          isIn: {
            args: [[0, 1, 100]],
            msg: "角色只能是 0（普通用户）、1（会员）或 100（超级管理员）。",
          },
        },
      },
      membershipExpiresAt: {
        type: DataTypes.DATE,
      },
      avatar: {
        type: DataTypes.STRING,
        validate: {
          isUrl: { msg: "头像必须是合法的 URL 地址。" },
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        get() {
          return formatDate(this.getDataValue("createdAt"));
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        get() {
          return formatDate(this.getDataValue("updatedAt"));
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: async (user) => {
          const emailExist = await User.findOne({
            where: { email: user.email },
          });
          if (emailExist) {
            throw new Error("邮箱已存在，请直接登录。");
          }
          const usernameExist = await User.findOne({
            where: { username: user.username },
          });
          if (usernameExist) {
            throw new Error("用户名已存在。");
          }
          // 密码加密
          const salt = bcrypt.genSaltSync(10);
          user.password = bcrypt.hashSync(user.password, salt);
        },
        beforeUpdate: async (user) => {
          // 只有密码字段变化时才重新加密
          if (user.changed("password")) {
            const salt = bcrypt.genSaltSync(10);
            user.password = bcrypt.hashSync(user.password, salt);
          }
          const emailExist = await User.findOne({
            where: { email: user.email },
          });
          if (emailExist && emailExist.id !== user.id) {
            throw new Error("邮箱已被其他用户占用。");
          }
          const usernameExist = await User.findOne({
            where: { username: user.username },
          });
          if (usernameExist && usernameExist.id !== user.id) {
            throw new Error("用户名已被其他用户占用。");
          }
        },
      },
    },
  );
  return User;
};
