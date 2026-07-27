# leo-api

基于 Express + Sequelize + MySQL 的在线教育平台 API。

## 技术栈

- **运行时**: Node.js
- **框架**: Express
- **ORM**: Sequelize
- **数据库**: MySQL 8.0
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs

## 快速开始

### 1. 启动 MySQL

```bash
docker compose up -d
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

`.env` 内容：

```
JWT_SECRET=你的密钥
```

### 3. 数据库迁移与填充

```bash
npx sequelize db:migrate
npx sequelize db:seed:all
```

### 4. 安装依赖并启动

```bash
pnpm install
pnpm start
```

默认运行在 `http://localhost:3000`。

---

## 项目结构

```
leo-api/
├── bin/                  # 启动入口
├── config/               # 数据库配置
├── middlewares/           # 中间件
│   ├── admin-auth.js     # 后台认证（校验 role=100）
│   └── user-auth.js      # 前端认证（任意登录用户）
├── migrations/           # 数据库迁移
├── models/               # Sequelize 模型
│   ├── User.js           # 用户
│   ├── Course.js         # 课程
│   ├── Chapter.js        # 章节
│   ├── Category.js       # 分类
│   ├── Article.js        # 文章
│   ├── Like.js           # 点赞
│   └── Setting.js        # 系统设置
├── routes/
│   ├── front/            # 前端接口
│   │   ├── auth.js       # 注册/登录
│   │   ├── users.js      # 用户信息/修改密码
│   │   ├── courses.js    # 课程列表/详情
│   │   ├── chapters.js   # 章节详情
│   │   ├── categories.js # 分类列表
│   │   ├── articles.js   # 文章列表/详情
│   │   ├── search.js     # 课程搜索
│   │   ├── likes.js      # 点赞/我的点赞
│   │   ├── settings.js   # 系统设置
│   │   └── index.js      # 首页推荐
│   └── admin/            # 后台接口（需管理员权限）
├── seeders/              # 数据填充
├── utils/
│   ├── errors.js         # 错误类定义
│   ├── response.js       # 统一响应格式
│   └── date.js           # 日期格式化
├── app.js                # 应用入口
├── docker-compose.yaml   # MySQL 容器
└── package.json
```

---

## API 接口

### 前端接口

| 方法 | 路径                   | 说明                        | 认证 |
| ---- | ---------------------- | --------------------------- | ---- |
| GET  | `/`                    | 首页（推荐/人气/入门课程）  | -    |
| POST | `/auth/register`       | 用户注册                    | -    |
| POST | `/auth/login`          | 用户登录                    | -    |
| GET  | `/categories`          | 分类列表                    | -    |
| GET  | `/courses?categoryId=` | 按分类查课程                | -    |
| GET  | `/courses/:id`         | 课程详情（含章节）          | -    |
| GET  | `/chapters/:id`        | 章节详情（含课程/其它章节） | -    |
| GET  | `/articles`            | 文章列表                    | -    |
| GET  | `/articles/:id`        | 文章详情                    | -    |
| GET  | `/search?name=`        | 搜索课程                    | -    |
| GET  | `/settings`            | 系统设置                    | -    |
| GET  | `/users/me`            | 当前用户信息                | ✅   |
| PUT  | `/users/me`            | 更新个人信息                | ✅   |
| PUT  | `/users/password`      | 修改密码                    | ✅   |
| POST | `/likes`               | 点赞/取消点赞               | ✅   |
| GET  | `/likes`               | 我点赞的课程                | ✅   |

### 后台接口

| 方法                | 路径                 | 说明         | 认证      |
| ------------------- | -------------------- | ------------ | --------- |
| POST                | `/admin/auth/login`  | 管理员登录   | -         |
| GET                 | `/admin/auth/verify` | 验证登录状态 | ✅ Token  |
| GET/POST/PUT/DELETE | `/admin/users`       | 用户 CRUD    | ✅ 管理员 |
| GET/POST/PUT/DELETE | `/admin/courses`     | 课程 CRUD    | ✅ 管理员 |
| GET/POST/PUT/DELETE | `/admin/chapters`    | 章节 CRUD    | ✅ 管理员 |
| GET/POST/PUT/DELETE | `/admin/categories`  | 分类 CRUD    | ✅ 管理员 |
| GET/POST/PUT/DELETE | `/admin/articles`    | 文章 CRUD    | ✅ 管理员 |
| GET/PUT             | `/admin/settings`    | 系统设置     | ✅ 管理员 |
| GET                 | `/admin/charts/sex`  | 用户性别统计 | ✅ 管理员 |
| GET                 | `/admin/charts/user` | 每月新增用户 | ✅ 管理员 |

---

## 统一响应格式

```json
// 成功
{
  "status": true,
  "message": "操作成功",
  "data": { ... }
}

// 失败
{
  "status": false,
  "message": "错误描述",
  "errors": ["具体错误信息"]
}
```

## 错误码

| 错误类                   | HTTP 状态码 |
| ------------------------ | ----------- |
| BadRequestError          | 400         |
| UnauthorizedError        | 401         |
| ForbiddenError           | 403         |
| NotFoundError            | 404         |
| ConflictError            | 409         |
| SequelizeValidationError | 400         |
