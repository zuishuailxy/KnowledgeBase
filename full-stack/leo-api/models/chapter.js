"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../utils/date");
const logger = require("../utils/logger");
const {
  upsertChapter,
  deleteChapter,
  upsertCourse,
} = require("../utils/meilisearch");
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    static associate(models) {
      // define association here
      models.Chapter.belongsTo(models.Course, { as: "course" });
    }
  }
  Chapter.init(
    {
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "课程必须选择。" },
          isInt: { msg: "课程 ID 必须是整数。" },
          isPositive(value) {
            if (value <= 0) {
              throw new Error("课程 ID 必须是正整数。");
            }
          },
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "标题必须填写。" },
          notEmpty: { msg: "标题不能为空。" },
          len: {
            args: [2, 45],
            msg: "标题长度必须在 2 ~ 45 之间。",
          },
        },
      },
      content: {
        type: DataTypes.TEXT,
      },
      video: {
        type: DataTypes.STRING,
        validate: {
          isUrl: { msg: "视频地址必须是合法的 URL。" },
        },
      },
      rank: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "排序必须填写。" },
          isInt: { msg: "排序必须是整数。" },
          isPositive(value) {
            if (value <= 0) {
              throw new Error("排序必须是正整数。");
            }
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
      modelName: "Chapter",
      hooks: {
        beforeCreate: async (chapter) => {
          const { Course } = require("./index");
          const course = await Course.findByPk(chapter.courseId);
          if (!course) {
            throw new Error("所选课程不存在。");
          }
        },
        beforeUpdate: async (chapter) => {
          if (chapter.changed("courseId")) {
            const { Course } = require("./index");
            const course = await Course.findByPk(chapter.courseId);
            if (!course) {
              throw new Error("所选课程不存在。");
            }
          }
        },
        // 同步 Meilisearch 索引（logger/meilisearch 已在顶部引用，失败只记日志不影响主流程）
        afterCreate: async (chapter) => {
          // Course 懒加载：chapter 在 course 之前被加载
          const { Course } = require("./index");
          upsertChapter(chapter).catch((err) =>
            logger.error(`[meilisearch] 章节索引创建同步失败: ${err.message}`),
          );
          // chaptersCount 变化 → 同步所属课程
          const course = await Course.findByPk(chapter.courseId);
          if (course) {
            upsertCourse(course).catch((err) =>
              logger.error(`[meilisearch] 课程索引同步失败: ${err.message}`),
            );
          }
        },
        afterUpdate: async (chapter) => {
          upsertChapter(chapter).catch((err) =>
            logger.error(`[meilisearch] 章节索引更新同步失败: ${err.message}`),
          );
        },
        afterDestroy: async (chapter) => {
          // Course 懒加载：chapter 在 course 之前被加载
          const { Course } = require("./index");
          deleteChapter(chapter.id).catch((err) =>
            logger.error(`[meilisearch] 章节索引删除同步失败: ${err.message}`),
          );
          // chaptersCount 变化 → 同步所属课程
          const course = await Course.findByPk(chapter.courseId);
          if (course) {
            upsertCourse(course).catch((err) =>
              logger.error(`[meilisearch] 课程索引同步失败: ${err.message}`),
            );
          }
        },
      },
    },
  );
  return Chapter;
};
