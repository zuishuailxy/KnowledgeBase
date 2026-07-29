const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

// 前台
const indexRouter = require("./routes/front/index");
const usersRouter = require("./routes/front/users");
const categoriesRouter = require("./routes/front/categories");
const coursesRouter = require("./routes/front/courses");
const chaptersRouter = require("./routes/front/chapters");
const articlesRouter = require("./routes/front/articles");
const settingsRouter = require("./routes/front/settings");
const searchRouter = require("./routes/front/search");
const authRouter = require("./routes/front/auth");
const likesRouter = require("./routes/front/likes");
const captchaRouter = require("./routes/front/captcha");

// 后台
const adminArticlesRouter = require("./routes/admin/articles");
const adminCategoryRouter = require("./routes/admin/categories");
const adminSettingRouter = require("./routes/admin/settings");
const adminUserRouter = require("./routes/admin/users");
const adminCourseRouter = require("./routes/admin/courses");
const adminChapterRouter = require("./routes/admin/chapters");
const adminChartRouter = require("./routes/admin/charts");
const adminAuthRouter = require("./routes/admin/auth");
// 中间件
const adminAuthMiddleware = require("./middlewares/admin-auth");
const userAuthMiddleware = require("./middlewares/user-auth");

const app = express();
app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// 前端接口
app.use("/", indexRouter);
app.use("/users", userAuthMiddleware, usersRouter);
app.use("/categories", categoriesRouter);
app.use("/courses", coursesRouter);
app.use("/chapters", chaptersRouter);
app.use("/articles", articlesRouter);
app.use("/settings", settingsRouter);
app.use("/search", searchRouter);
app.use("/auth", authRouter);
app.use("/likes", userAuthMiddleware, likesRouter);
app.use("/captcha", captchaRouter);

// 后台接口
app.use("/admin/articles", adminAuthMiddleware, adminArticlesRouter);
app.use("/admin/categories", adminAuthMiddleware, adminCategoryRouter);
app.use("/admin/settings", adminAuthMiddleware, adminSettingRouter);
app.use("/admin/users", adminAuthMiddleware, adminUserRouter);
app.use("/admin/courses", adminAuthMiddleware, adminCourseRouter);
app.use("/admin/chapters", adminAuthMiddleware, adminChapterRouter);
app.use("/admin/charts", adminAuthMiddleware, adminChartRouter);
app.use("/admin/auth", adminAuthRouter);

module.exports = app;
