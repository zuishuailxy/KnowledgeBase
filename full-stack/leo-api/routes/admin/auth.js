const express = require("express");
const router = express.Router();
const { User } = require("../../models");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const { success, failure } = require("../../utils/responses");
const { NotFound, BadRequest, Unauthorized } = require("http-errors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "8h";

// 管理员登录
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body || {};

    if (!login) {
      throw new BadRequest("用户名/邮箱不能为空");
    }
    if (!password) {
      throw new BadRequest("密码不能为空");
    }

    const condition = {
      where: {
        [Op.or]: [{ email: login }, { username: login }],
      },
    };

    const user = await User.findOne(condition);
    if (!user) {
      throw new NotFound("用户不存在");
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new Unauthorized("密码错误");
    }

    // check if it is super admin
    if (user.role !== 100) {
      throw new Unauthorized("你没有权限登陆管理员平台");
    }

    // 生成 JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    success(res, "登陆成功", { token });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
