const express = require("express");
const router = express.Router();
const { User } = require("../../models");
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFound } = require("http-errors");

const getAttr = (source) => {
  const { email, username, nickname, role, password, sex, company, introduce } =
    source;

  return { email, username, nickname, role, password, sex, company, introduce };
};

// define a common function to query user
async function getUser(req) {
  const { id } = req.params;

  // 1.判断id 是否存在
  const user = await User.findOne({
    where: { id },
  });
  if (!user) {
    throw new NotFound(`ID: ${id}的用户未找到`);
  }

  return user;
}

/* GET home page. */
router.get("/", async function (req, res, next) {
  // 把我的代码放到 try catch
  try {
    // currentPage 当前页，pageSize 每页条数；默认值分别为 1 和 10 都是数字类型
    const { email, username, nickname, role } = req.query;
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    // 计算 offset
    const offset = (currentPage - 1) * pageSize;
    // 如果 title 有值，则添加根据 title 的模糊搜索
    const condition = {
      where: {},
      order: [["id", "DESC"]],
      limit: pageSize,
      offset: offset,
    };
    if (email) {
      condition.where.email = {
        [Op.eq]: email,
      };
    }
    if (username) {
      condition.where.username = {
        [Op.eq]: username,
      };
    }
    if (nickname) {
      condition.where.nickname = {
        [Op.like]: `%${nickname}%`,
      };
    }
    if (role) {
      condition.where.role = {
        [Op.eq]: role,
      };
    }

    const { count, rows } = await User.findAndCountAll(condition);
    success(res, "查询用户列表成功", {
      users: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "查询用户列表失败",
      status: false,
      errors: [error.message],
    });
  }
});

// 根据 id 查询用户详情
router.get("/:id", async function (req, res, next) {
  try {
    const user = await getUser(req);

    success(res, "查询用户详情成功", { user });
  } catch (error) {
    failure(res, error);
  }
});

// 新增用户
router.post("/", async function (req, res, next) {
  try {
    // 白名单过滤
    const body = getAttr(req.body);

    const user = await User.create(body);
    success(res, "新增用户成功", { user }, 201);
  } catch (error) {
    failure(res, error);
  }
});

// 更新用户，先找到对应的用户，再更新
router.put("/:id", async function (req, res, next) {
  try {
    const user = await getUser(req);
    // 白名单过滤
    const body = getAttr(req.body);
    await user.update(body);
    success(res, "更新用户成功", { user });
  } catch (error) {
    failure(res, error);
  }
});
module.exports = router;
