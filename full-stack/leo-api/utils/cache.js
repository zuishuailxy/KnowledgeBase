const { Course, Category, User, Chapter } = require("../models");
const { getKey, setKey } = require("./redis");
const { COURSE_DETAIL_TTL, CHAPTER_TTL } = require("./constants");

// 获取课程（带缓存）
async function getCourseById(id) {
  const key = `course:${id}`;
  let data = await getKey(key);
  if (data) return data;

  const course = await Course.findByPk(id, {
    attributes: ["id", "name", "userId", "categoryId"],
  });
  if (!course) return null;
  data = course.toJSON();
  await setKey(key, data, COURSE_DETAIL_TTL);
  return data;
}

// 获取分类（带缓存）
async function getCategoryById(id) {
  const key = `category:${id}`;
  let data = await getKey(key);
  if (data) return data;

  const category = await Category.findByPk(id, { attributes: ["id", "name"] });
  if (!category) return null;
  data = category.toJSON();
  await setKey(key, data, COURSE_DETAIL_TTL);
  return data;
}

// 获取用户（带缓存）
async function getUserById(id) {
  const key = `user:${id}`;
  let data = await getKey(key);
  if (data) return data;

  const user = await User.findByPk(id, {
    attributes: ["id", "username", "nickname", "avatar", "company"],
  });
  if (!user) return null;
  data = user.toJSON();
  delete data.password;
  await setKey(key, data, COURSE_DETAIL_TTL);
  return data;
}

// 获取课程章节列表（带缓存，不含正文）
async function getChaptersByCourseId(courseId) {
  const key = `chapters:${courseId}`;
  let data = await getKey(key);
  if (data) return data;

  const chapters = await Chapter.findAll({
    attributes: { exclude: ["CourseId", "content"] },
    where: { courseId },
    order: [
      ["rank", "ASC"],
      ["id", "DESC"],
    ],
  });
  data = chapters.map((c) => c.toJSON());
  await setKey(key, data, COURSE_DETAIL_TTL);
  return data;
}

// 获取章节（带缓存）
async function getChapterById(id) {
  const key = `chapter:${id}`;
  let data = await getKey(key);
  if (data) return data;

  const chapter = await Chapter.findByPk(id, {
    attributes: { exclude: ["CourseId"] },
  });
  if (!chapter) return null;
  data = chapter.toJSON();
  await setKey(key, data, CHAPTER_TTL);
  return data;
}

// 获取文章（带缓存）
async function getArticleById(id) {
  const key = `article:${id}`;
  let data = await getKey(key);
  if (data) return data;

  const article = await Article.findByPk(id);
  if (!article) return null;
  data = article.toJSON();
  await setKey(key, data, COURSE_DETAIL_TTL);
  return data;
}

module.exports = {
  getCourseById,
  getCategoryById,
  getUserById,
  getChaptersByCourseId,
  getChapterById,
  getArticleById,
};
