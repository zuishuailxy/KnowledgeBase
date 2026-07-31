const express = require("express");
const router = express.Router();
const { Membership } = require("../../models");
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFound } = require("http-errors");

// 白名单过滤
const getAttr = (source) => {
  const { name, durationMonths, price, rank, description } = source;
  return { name, durationMonths, price, rank, description };
};

/**
 * 查询会员列表（分页）
 */
router.get("/", async (req, res) => {
  try {
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    const { count, rows } = await Membership.findAndCountAll({
      order: [
        ["rank", "ASC"],
        ["id", "DESC"],
      ],
      limit: pageSize,
      offset,
    });

    success(res, "查询会员列表成功", {
      memberships: rows,
      pagination: { total: count, currentPage, pageSize },
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询会员详情
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await Membership.findByPk(id);

    if (!membership) {
      throw new NotFound(`ID: ${id} 的会员方案未找到`);
    }

    success(res, "查询会员详情成功", { membership });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建会员
 */
router.post("/", async (req, res) => {
  try {
    const body = getAttr(req.body);
    const membership = await Membership.create(body);
    success(res, "创建会员成功", { membership }, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新会员
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await Membership.findByPk(id);

    if (!membership) {
      throw new NotFound(`ID: ${id} 的会员方案未找到`);
    }

    const body = getAttr(req.body);
    await membership.update(body);
    success(res, "更新会员成功", { membership });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除会员
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await Membership.findByPk(id);

    if (!membership) {
      throw new NotFound(`ID: ${id} 的会员方案未找到`);
    }

    await membership.destroy();
    success(res, "删除会员成功");
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
