module.exports = {
  /** 系统设置缓存键 */
  CACHE_SETTING: "setting",
  /** 分类列表缓存键 */
  CACHE_CATEGORIES: "categories",
  /** 首页课程缓存键 */
  CACHE_HOMEPAGE: "homepage",
  /** 会员方案缓存键 */
  CACHE_MEMBERSHIPS: "memberships",

  /** 缓存过期时间（秒） */
  // 系统设置：几乎不改，1 小时
  SETTING_TTL: 3600,
  // 分类列表：很少改，1 小时
  CATEGORIES_TTL: 3600,
  // 首页课程：课程/点赞变化频繁，10 分钟
  HOMEPAGE_TTL: 600,
  // 文章列表：含分页搜索，2 分钟
  ARTICLES_TTL: 120,
  // 课程列表：含分类分页，2 分钟
  COURSES_TTL: 120,
  // 课程详情：含章节信息，5 分钟
  COURSE_DETAIL_TTL: 300,
  CHAPTER_TTL: 600,
  // 会员方案：很少改，1 小时
  MEMBERSHIPS_TTL: 3600,
};
