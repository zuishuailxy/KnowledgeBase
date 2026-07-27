const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const { NotFoundError } = require("../../utils/errors");
const { Category } = require("../../models");

router.get("/", async function (req, res) {
  try {
    const categories = await Category.findAll({
      order: [
        ["rank", "ASC"],
        ["id", "DESC"],
      ],
    });
    success(res, "查询推荐课程成功", {
      categories,
    });
  } catch (error) {
    failure(res, error);
  }
});
module.exports = router;
