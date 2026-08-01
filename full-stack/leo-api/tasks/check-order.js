// 定时任务：定时查看过期订单，将超时未支付的订单标记为已取消
const schedule = require("node-schedule");
const { Op } = require("sequelize");
const { Order } = require("../models");
const logger = require("../utils/logger");

/** 订单超时未支付自动关闭的时长（分钟），可通过环境变量覆盖 */
const ORDER_EXPIRE_MINUTES = Number(process.env.ORDER_EXPIRE_MINUTES) || 30;

/**
 * 关闭超时未支付的订单（status: 0 待支付 → 2 已取消）
 */
async function closeExpiredOrders() {
  const cutoff = new Date(Date.now() - ORDER_EXPIRE_MINUTES * 60 * 1000);

  const [affectedCount] = await Order.update(
    { status: 2 },
    {
      where: {
        status: 0,
        createdAt: { [Op.lt]: cutoff },
      },
    },
  );

  if (affectedCount > 0) {
    console.log(
      `[check-order] ${new Date().toISOString()} 已关闭 ${affectedCount} 笔超时未支付订单`,
    );
  }
}

// 每分钟执行一次（cron 表达式：分 时 日 月 周）
schedule.scheduleJob("30 4 * * *", () => {
  closeExpiredOrders().catch((error) => {
    // 记录到 Log 表（logger 通过 SequelizeTransport 写入，级别为 error）
    logger.error(`[check-order] 关闭超时订单失败: ${error.message}`, {
      stack: error.stack,
    });
  });
});

module.exports = { closeExpiredOrders };
