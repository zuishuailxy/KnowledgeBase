const express = require("express");
const router = express.Router();
const { Log } = require("../../models");
const { Op } = require("sequelize");
const { success, failure } = require("../../utils/responses");
const { NotFound, BadRequest } = require("http-errors");

/**
 * 查询所有日志（分页）
 */
router.get("/", async (req, res) => {
  try {
    const currentPage = Math.abs(Number(req.query.currentPage)) || 1;
    const pageSize = Math.abs(Number(req.query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    const { count, rows } = await Log.findAndCountAll({
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
    });

    success(res, "查询日志列表成功", {
      logs: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 根据 id 查询日志详情
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const log = await Log.findByPk(id);

    if (!log) {
      throw new NotFound(`ID: ${id} 的日志未找到`);
    }

    success(res, "查询日志详情成功", { log });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除某条日志
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const log = await Log.findByPk(id);
    if (!log) {
      throw new NotFound(`ID: ${id} 的日志未找到`);
    }

    await log.destroy();
    success(res, "删除日志成功");
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除所有日志
 */
router.delete("/", async (req, res) => {
  try {
    await Log.destroy({ where: {}, truncate: true });
    success(res, "已清空所有日志");
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
