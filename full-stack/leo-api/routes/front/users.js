const express = require("express");
const router = express.Router();
const { User } = require("../../models");
const { success, failure } = require("../../utils/responses");
const { BadRequestError, NotFoundError } = require("../../utils/errors");
const userAuth = require("../../middlewares/user-auth");
const bcrypt = require("bcryptjs");

// 查询当前登录用户信息
router.get("/me", userAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new NotFoundError("用户不存在");
    }

    const userData = user.toJSON();
    delete userData.password;

    success(res, "查询用户信息成功", { user: userData });
  } catch (error) {
    failure(res, error);
  }
});

// 更新当前登录用户信息
router.put("/me", userAuth, async (req, res) => {
  try {
    const { nickname, sex, company, introduce, avatar } = req.body || {};

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new NotFoundError("用户不存在");
    }

    await user.update({ nickname, sex, company, introduce, avatar });

    const userData = user.toJSON();
    delete userData.password;

    success(res, "更新用户信息成功", { user: userData });
  } catch (error) {
    failure(res, error);
  }
});

// 修改密码
router.put("/password", userAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body || {};

    if (!oldPassword) {
      throw new BadRequestError("旧密码不能为空");
    }
    if (!newPassword) {
      throw new BadRequestError("新密码不能为空");
    }
    if (newPassword.length < 6) {
      throw new BadRequestError("新密码长度不能少于 6 位");
    }
    if (newPassword !== confirmPassword) {
      throw new BadRequestError("两次输入的密码不一致");
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new NotFoundError("用户不存在");
    }

    const isPasswordValid = bcrypt.compareSync(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError("旧密码不正确");
    }

    await user.update({ password: newPassword });

    success(res, "修改密码成功");
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
