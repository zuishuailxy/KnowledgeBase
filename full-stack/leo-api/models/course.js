"use strict";
const { Model, ForeignKeyConstraintError } = require("sequelize");
const { formatDate } = require("../utils/date");
const logger = require("../utils/logger");
const { upsertCourse, deleteCourse } = require("../utils/meilisearch");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    static associate(models) {
      // define association here
      models.Course.belongsTo(models.Category, { as: "category" });
      models.Course.belongsTo(models.User, { as: "user" });
      models.Course.hasMany(models.Chapter, { as: "chapters" });
      models.Course.belongsToMany(models.User, {
        through: models.Like,
        foreignKey: "courseId",
        as: "likeUsers",
      });
    }
  }
  Course.init(
    {
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "分类必须选择。" },
          isInt: { msg: "分类 ID 必须是整数。" },
          isPositive(value) {
            if (value <= 0) {
              throw new Error("分类 ID 必须是正整数。");
            }
          },
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "用户必须选择。" },
          isInt: { msg: "用户 ID 必须是整数。" },
          isPositive(value) {
            if (value <= 0) {
              throw new Error("用户 ID 必须是正整数。");
            }
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "课程名称必须填写。" },
          notEmpty: { msg: "课程名称不能为空。" },
          len: {
            args: [2, 45],
            msg: "课程名称长度必须在 2 ~ 45 之间。",
          },
        },
      },
      image: {
        type: DataTypes.STRING,
        validate: {
          isUrl: { msg: "课程图片必须是合法的 URL 地址。" },
        },
      },
      recommended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
          notNull: { msg: "是否推荐必须选择。" },
          isIn: {
            args: [[true, false]],
            msg: "是否推荐只能是 true 或 false。",
          },
        },
      },
      introductory: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
          notNull: { msg: "是否入门必须选择。" },
          isIn: {
            args: [[true, false]],
            msg: "是否入门只能是 true 或 false。",
          },
        },
      },
      free: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        validate: {
          notNull: { msg: "是否免费必须选择。" },
          isIn: {
            args: [[true, false]],
            msg: "是否免费只能是 true 或 false。",
          },
        },
      },
      content: {
        type: DataTypes.TEXT,
      },
      likesCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          notNull: { msg: "点赞数必须存在。" },
          isInt: { msg: "点赞数必须是整数。" },
          min: {
            args: [0],
            msg: "点赞数不能为负数。",
          },
        },
      },
      chaptersCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          notNull: { msg: "章节数必须存在。" },
          isInt: { msg: "章节数必须是整数。" },
          min: {
            args: [0],
            msg: "章节数不能为负数。",
          },
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
      modelName: "Course",
      hooks: {
        beforeCreate: async (course) => {
          // 验证 categoryId 对应的分类是否存在
          const { Category, User } = require("./index");
          const category = await Category.findByPk(course.categoryId);
          if (!category) {
            throw new Error("所选分类不存在。");
          }
          // 验证 userId 对应的用户是否存在
          const user = await User.findByPk(course.userId);
          if (!user) {
            throw new Error("所选用户不存在。");
          }
        },
        beforeUpdate: async (course) => {
          if (course.changed("categoryId")) {
            const { Category } = require("./index");
            const category = await Category.findByPk(course.categoryId);
            if (!category) {
              throw new Error("所选分类不存在。");
            }
          }
          if (course.changed("userId")) {
            const { User } = require("./index");
            const user = await User.findByPk(course.userId);
            if (!user) {
              throw new Error("所选用户不存在。");
            }
          }
        },
        // 同步 Meilisearch 索引（logger/meilisearch 已在顶部引用，失败只记日志不影响主流程）
        afterCreate: async (course) => {
          upsertCourse(course).catch((err) =>
            logger.error(`[meilisearch] 课程索引创建同步失败: ${err.message}`),
          );
        },
        afterUpdate: async (course) => {
          upsertCourse(course).catch((err) =>
            logger.error(`[meilisearch] 课程索引更新同步失败: ${err.message}`),
          );
        },
        afterDestroy: async (course) => {
          deleteCourse(course.id).catch((err) =>
            logger.error(`[meilisearch] 课程索引删除同步失败: ${err.message}`),
          );
        },
      },
    },
  );
  return Course;
};
