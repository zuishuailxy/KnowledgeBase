const express = require("express");
const router = express.Router();
const { Membership } = require("../../models");
const { success, failure } = require("../../utils/responses");
const { getKey, setKey } = require("../../utils/redis");
const { CACHE_MEMBERSHIPS, MEMBERSHIPS_TTL } = require("../../utils/constants");

/**
 * 查询所有会员方案（按 rank 升序）
 */
router.get("/", async (req, res) => {
  try {
    const cached = await getKey(CACHE_MEMBERSHIPS);
    if (cached) {
      return success(res, "查询会员方案成功", { memberships: cached });
    }

    const memberships = await Membership.findAll({
      order: [["rank", "ASC"]],
    });

    await setKey(CACHE_MEMBERSHIPS, memberships, MEMBERSHIPS_TTL);

    success(res, "查询会员方案成功", { memberships });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
