// 定时任务：检查大会员是否过期，过期则改为普通用户
const schedule = require("node-schedule");
const { Op } = require("sequelize");
const { User } = require("../models");
const logger = require("../utils/logger");

/**
 * 将已过期的大会员降级为普通用户
 * 规则：
 *  - 只处理 role=1（会员），role=100（管理员）不受影响
 *  - membershipExpiresAt 早于当前时间（或为空）→ 降级为 role=0
 */
async function expireMemberships() {
  const now = new Date();

  const [affectedCount] = await User.update(
    { role: 0 },
    {
      where: {
        role: 1,
        [Op.or]: [
          { membershipExpiresAt: { [Op.lt]: now } },
          { membershipExpiresAt: null },
        ],
      },
    },
  );

  if (affectedCount > 0) {
    logger.warn(
      `[check-membership] ${now.toISOString()} 已降级 ${affectedCount} 个过期会员为普通用户`,
    );
  }
}

// 每 30 分钟执行一次（cron 表达式：分 时 日 月 周）
schedule.scheduleJob("*/30 * * * *", () => {
  expireMemberships().catch((error) => {
    // 记录到 Log 表（logger 通过 SequelizeTransport 写入，级别为 error）
    logger.error(`[check-membership] 检查会员过期失败: ${error.message}`, {
      stack: error.stack,
    });
  });
});

module.exports = { expireMemberships };
