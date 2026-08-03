const { Meilisearch } = require("meilisearch");
const logger = require("./logger");
require("dotenv").config();
// 注意：不在此处 require models（Course/Chapter 在函数内懒取），
// 使本模块可以在模型加载期被安全引用，避免循环依赖。

// 注意：meilisearch@0.60+ 导出的是 Meilisearch（小写 s）
const client = new Meilisearch({
  host: process.env.MEILISEARCH_HOST || "http://127.0.0.1:7700",
  apiKey: process.env.MEILISEARCH_MASTER_KEY,
});

/** 索引名常量 */
const INDEXES = {
  COURSES: "courses",
  CHAPTERS: "chapters",
};

/**
 * 课程文档序列化：把 Course 实例/原始对象转成 Meilisearch 文档
 */
function toCourseDoc(course) {
  return {
    id: course.id,
    name: course.name,
    content: course.content,
    image: course.image,
    likesCount: course.likesCount,
    chaptersCount: course.chaptersCount,
    updatedAt: course.updatedAt,
  };
}

/**
 * 初始化索引配置（幂等）：
 *  - 可搜索字段：name、content
 *  - 可排序字段：likesCount、updatedAt
 */
async function initIndexes() {
  await client.index(INDEXES.COURSES).updateSettings({
    searchableAttributes: ["name", "content"],
    sortableAttributes: ["likesCount", "updatedAt"],
    // 排序权重顺序
    rankingRules: [
      "sort",
      "words",
      "typo",
      "proximity",
      "attribute",
      "exactness",
    ],
  });
  logger.info(`[meilisearch] 索引 ${INDEXES.COURSES} 配置已初始化`);

  // 章节索引：可搜索字段为 title、content
  await client.index(INDEXES.CHAPTERS).updateSettings({
    searchableAttributes: ["title", "content"],
    sortableAttributes: ["updatedAt"],
    rankingRules: [
      "sort",
      "words",
      "typo",
      "proximity",
      "attribute",
      "exactness",
    ],
  });
  logger.info(`[meilisearch] 索引 ${INDEXES.CHAPTERS} 配置已初始化`);
}

/**
 * 新增/更新单门课程到索引
 * Meilisearch 按文档 id 幂等，addDocuments 存在即覆盖
 */
async function upsertCourse(course) {
  await client.index(INDEXES.COURSES).addDocuments([toCourseDoc(course)]);
}

/**
 * 从索引删除课程
 */
async function deleteCourse(courseId) {
  await client.index(INDEXES.COURSES).deleteDocument(courseId);
}

/**
 * 全量重建课程索引（从数据库同步所有课程）
 */
async function syncAllCourses() {
  const { Course } = require("../models"); // 运行时懒取，避免循环依赖
  const courses = await Course.findAll({ raw: true });
  const docs = courses.map(toCourseDoc);
  if (docs.length > 0) {
    await client.index(INDEXES.COURSES).addDocuments(docs);
  }
  logger.info(`[meilisearch] 已同步 ${docs.length} 门课程`);
  return docs.length;
}

/**
 * 章节文档序列化：把 Chapter 实例/原始对象转成 Meilisearch 文档
 */
function toChapterDoc(chapter) {
  return {
    id: chapter.id,
    courseId: chapter.courseId,
    title: chapter.title,
    content: chapter.content,
    free: chapter.free,
    updatedAt: chapter.updatedAt,
  };
}

// 章节文档同时含 id 和 courseId，主键推断会失败，必须显式指定 primaryKey: 'id'
const CHAPTER_OPTIONS = { primaryKey: "id" };

/**
 * 新增/更新单个章节到索引（按 id 幂等覆盖）
 */
async function upsertChapter(chapter) {
  await client
    .index(INDEXES.CHAPTERS)
    .addDocuments([toChapterDoc(chapter)], CHAPTER_OPTIONS);
}

/**
 * 从索引删除章节
 */
async function deleteChapter(chapterId) {
  await client.index(INDEXES.CHAPTERS).deleteDocument(chapterId);
}

/**
 * 全量重建章节索引（从数据库同步所有章节）
 */
async function syncAllChapters() {
  const { Chapter } = require("../models"); // 运行时懒取，避免循环依赖
  const chapters = await Chapter.findAll({ raw: true });
  const docs = chapters.map(toChapterDoc);
  if (docs.length > 0) {
    await client.index(INDEXES.CHAPTERS).addDocuments(docs, CHAPTER_OPTIONS);
  }
  logger.info(`[meilisearch] 已同步 ${docs.length} 个章节`);
  return docs.length;
}

// 注意：索引初始化改为显式调用（bin/www 启动时执行），
// 不在模块加载期自动执行，避免与模型加载形成循环依赖副作用。

module.exports = {
  client,
  INDEXES,
  initIndexes,
  upsertCourse,
  deleteCourse,
  syncAllCourses,
  upsertChapter,
  deleteChapter,
  syncAllChapters,
};
