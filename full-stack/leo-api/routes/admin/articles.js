const express = require("express");
const router = express.Router();
const { Article } = require("../../models");

/* GET home page. */
router.get("/", async function (req, res, next) {
  // 把我的代码放到 try catch
  try {
    const condition = {
      order: [["id", "DESC"]],
    };
    const articles = await Article1.findAll(condition);
    res.json({ message: "查询文章列表成功", status: true, data: { articles } });
  } catch (error) {
    res.status(500).json({
      message: "查询文章列表失败",
      status: false,
      errors: [error.message],
    });
  }
});
module.exports = router;
