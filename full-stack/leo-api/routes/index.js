const express = require("express");
const router = express.Router();

// 前台
const indexRouter = require("./front/index");
const usersRouter = require("./front/users");
const categoriesRouter = require("./front/categories");
const coursesRouter = require("./front/courses");
const chaptersRouter = require("./front/chapters");
const articlesRouter = require("./front/articles");
const settingsRouter = require("./front/settings");
const searchRouter = require("./front/search");
const authRouter = require("./front/auth");
const likesRouter = require("./front/likes");
const captchaRouter = require("./front/captcha");
const membershipsRouter = require("./front/memberships");
const ordersRouter = require("./front/orders");
const alipayRouter = require("./front/alipay");

// 后台
const adminArticlesRouter = require("./admin/articles");
const adminCategoryRouter = require("./admin/categories");
const adminSettingRouter = require("./admin/settings");
const adminUserRouter = require("./admin/users");
const adminCourseRouter = require("./admin/courses");
const adminChapterRouter = require("./admin/chapters");
const adminChartRouter = require("./admin/charts");
const adminAuthRouter = require("./admin/auth");
const adminLogsRouter = require("./admin/logs");
const adminMembershipsRouter = require("./admin/memberships");
const adminOrdersRouter = require("./admin/orders");

// 中间件
const adminAuthMiddleware = require("../middlewares/admin-auth");
const userAuthMiddleware = require("../middlewares/user-auth");

// 前端接口
router.use("/", indexRouter);
router.use("/users", userAuthMiddleware, usersRouter);
router.use("/categories", categoriesRouter);
router.use("/courses", coursesRouter);
router.use("/chapters", userAuthMiddleware, chaptersRouter);
router.use("/articles", articlesRouter);
router.use("/settings", settingsRouter);
router.use("/search", searchRouter);
router.use("/auth", authRouter);
router.use("/likes", userAuthMiddleware, likesRouter);
router.use("/captcha", captchaRouter);
router.use("/memberships", membershipsRouter);
router.use("/orders", userAuthMiddleware, ordersRouter);
// 注意：alipay 路由不再整体挂用户鉴权，
// 需要登录的接口（/query、/pay）在路由内单独挂 userAuthMiddleware，
// 而 /return、/notify 是支付宝回调，必须靠验签而非登录态。
router.use("/alipay", alipayRouter);

// 后台接口
router.use("/admin/articles", adminAuthMiddleware, adminArticlesRouter);
router.use("/admin/categories", adminAuthMiddleware, adminCategoryRouter);
router.use("/admin/settings", adminAuthMiddleware, adminSettingRouter);
router.use("/admin/users", adminAuthMiddleware, adminUserRouter);
router.use("/admin/courses", adminAuthMiddleware, adminCourseRouter);
router.use("/admin/chapters", adminAuthMiddleware, adminChapterRouter);
router.use("/admin/charts", adminAuthMiddleware, adminChartRouter);
router.use("/admin/auth", adminAuthRouter);
router.use("/admin/logs", adminAuthMiddleware, adminLogsRouter);
router.use("/admin/memberships", adminAuthMiddleware, adminMembershipsRouter);
router.use("/admin/orders", adminAuthMiddleware, adminOrdersRouter);

module.exports = router;
