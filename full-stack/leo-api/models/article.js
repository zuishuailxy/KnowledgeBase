"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../utils/date");
module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Article.init(
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: {
            msg: "标题必须存在",
          },
          notEmpty: {
            msg: "标题不能为空",
          },
          len: {
            args: [2, 45],
            msg: "标题长度必须在 2 ~ 45 之间",
          },
        },
      },
      content: DataTypes.TEXT,
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
      deletedAt: {
        type: DataTypes.DATE,
        get() {
          return formatDate(this.getDataValue("deletedAt"));
        },
      },
    },
    {
      sequelize,
      modelName: "Article",
      paranoid: true,
    },
  );
  return Article;
};
