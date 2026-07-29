const express = require("express");
const router = express.Router();
const { success, failure } = require("../../utils/responses");
const { Category } = require("../../models");
const { getKey, setKey } = require("../../utils/redis");
const { CACHE_CATEGORIES, CATEGORIES_TTL } = require("../../utils/constants");

router.get("/", async function (req, res) {
  try {
    const cached = await getKey(CACHE_CATEGORIES);
    if (cached) {
      return success(res, "查询课程分类成功", { categories: cached });
    }

    const categories = await Category.findAll({
      order: [
        ["rank", "ASC"],
        ["id", "DESC"],
      ],
    });

    await setKey(CACHE_CATEGORIES, categories, CATEGORIES_TTL);

    success(res, "查询课程分类成功", { categories });
  } catch (error) {
    failure(res, error);
  }
});
module.exports = router;
