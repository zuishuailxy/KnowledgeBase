"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../utils/date");
module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Setting.init(
    {
      name: DataTypes.STRING,
      copyright: DataTypes.STRING,
      icp: DataTypes.STRING,
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
      modelName: "Setting",
    },
  );
  return Setting;
};
