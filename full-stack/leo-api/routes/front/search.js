const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { BadRequest } = require("http-errors");
const { Course, Chapter, Category, User } = require("../../models");
const { client, INDEXES } = require("../../utils/meilisearch");
const logger = require("../../utils/logger");

// ---------- 课程 ----------
const COURSE_ATTRS = { exclude: ["CategoryId", "UserId", "content"] };
const COURSE_INCLUDE = [
  { model: Category, as: "category", attributes: ["id", "name"] },
  {
    model: User,
    as: "user",
    attributes: ["id", "username", "nickname", "avatar", "company"],
  },
];

// ---------- 章节 ----------
const CHAPTER_ATTRS = { exclude: ["CourseId", "content"] };
const CHAPTER_INCLUDE = [
  { model: Course, as: "course", attributes: ["id", "name"] },
];

/** 数据库 LIKE 兜底：课程 */
async function searchCoursesFromDb(name, { currentPage, pageSize }) {
  const offset = (currentPage - 1) * pageSize;
  const { count, rows } = await Course.findAndCountAll({
    attributes: COURSE_ATTRS,
    where: { name: { [Op.like]: `%${name}%` } },
    include: COURSE_INCLUDE,
    order: [["id", "DESC"]],
    limit: pageSize,
    offset,
  });
  return { total: count, rows };
}

/** 数据库 LIKE 兜底：章节 */
async function searchChaptersFromDb(name, { currentPage, pageSize }) {
  const offset = (currentPage - 1) * pageSize;
  const { count, rows } = await Chapter.findAndCountAll({
    attributes: CHAPTER_ATTRS,
    where: { title: { [Op.like]: `%${name}%` } },
    include: CHAPTER_INCLUDE,
    order: [["id", "DESC"]],
    limit: pageSize,
    offset,
  });
  return { total: count, rows };
}

/** 按 type 生成排序参数（章节索引只有 updatedAt 可排序） */
function buildSortParams(type, sort) {
  if (type === "chapter") {
    return sort === "latest" ? ["updatedAt:desc"] : undefined;
  }
  if (sort === "likes") return ["likesCount:desc"];
  if (sort === "latest") return ["updatedAt:desc"];
  return undefined;
}

/**
 * 按类型搜索：type=course 搜课程索引，type=chapter 搜章节索引
 * Meilisearch 负责匹配与相关度排序，数据库取完整数据
 */
async function searchByType(type, name, { currentPage, pageSize, sort }) {
  const isChapter = type === "chapter";
  const indexName = isChapter ? INDEXES.CHAPTERS : INDEXES.COURSES;

  try {
    // 1. Meilisearch 搜索，拿到命中文档 id
    const searchParams = {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      attributesToHighlight: ["*"],
    };
    const sortRules = buildSortParams(type, sort);
    if (sortRules) {
      searchParams.sort = sortRules;
    }

    const searchRes = await client.index(indexName).search(name, searchParams);
    const hits = searchRes.hits;
    const ids = hits.map((h) => h.id);
    const total = searchRes.estimatedTotalHits;
    // 保留 Meilisearch 返回的高亮字段（_formatted），供前端展示
    const formattedMap = new Map(hits.map((h) => [h.id, h._formatted]));

    // 2. 按 id 从数据库取完整数据
    let rows = [];
    if (ids.length > 0) {
      if (isChapter) {
        rows = await Chapter.findAll({
          attributes: CHAPTER_ATTRS,
          where: { id: { [Op.in]: ids } },
          include: CHAPTER_INCLUDE,
        });
      } else {
        rows = await Course.findAll({
          attributes: COURSE_ATTRS,
          where: { id: { [Op.in]: ids } },
          include: COURSE_INCLUDE,
        });
      }

      // 3. 保持 Meilisearch 的相关度/排序顺序（findAll 顺序不保证）
      const orderMap = new Map(ids.map((id, i) => [id, i]));
      rows.sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));

      // 4. 把 Meilisearch 的高亮字段合并进每条返回数据
      for (const row of rows) {
        const formatted = formattedMap.get(row.id);
        if (formatted) {
          row.setDataValue("_formatted", formatted);
        }
      }
    }

    return { total, rows };
  } catch (error) {
    // Meilisearch 不可用 → 回退数据库 LIKE
    logger.error(
      `[search] Meilisearch 搜索失败，回退数据库: ${error.message}`,
      { stack: error.stack },
    );
    return isChapter
      ? searchChaptersFromDb(name, { currentPage, pageSize })
      : searchCoursesFromDb(name, { currentPage, pageSize });
  }
}

/**
 * 搜索：type=course 搜课程，type=chapter 搜章节
 * 查询参数：
 *   name  - 关键词（必填）
 *   type  - course（默认）| chapter
 *   sort  - likes（按点赞数）| latest（按更新时间），默认按相关度
 */
router.get("/", async function (req, res) {
  try {
    const { name, sort, type = "course" } = req.query;

    if (!name) {
      throw new BadRequest("搜索关键词不能为空");
    }
    if (!["course", "chapter"].includes(type)) {
      throw new BadRequest("type 必须为 course 或 chapter");
    }

    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;

    const result = await searchByType(type, name, {
      currentPage,
      pageSize,
      sort,
    });

    success(res, "搜索成功", {
      [type === "chapter" ? "chapters" : "courses"]: result.rows,
      pagination: {
        total: result.total,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
