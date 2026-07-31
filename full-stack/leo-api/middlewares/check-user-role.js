const { Forbidden } = require("http-errors");

/**
 * 检查用户是否有权限访问非免费资源
 * @param {Object} user - req.user（需先经过 userAuthMiddleware）
 * @param {Object} resource - 资源对象，需包含 free 字段
 * @throws {Forbidden} 无权访问时抛出
 *
 * 使用示例：
 * const chapter = await Chapter.findByPk(req.params.id);
 * checkUserRole(req.user, chapter);
 */
module.exports = (user, resource) => {
  if (!user) {
    throw new Forbidden("请先登录");
  }

  // 免费资源直接放行
  if (resource.free) {
    return;
  }

  // 管理员可访问
  if (user.role === 100) {
    return;
  }

  // 会员需判断是否过期
  if (user.role === 1) {
    if (user.membershipExpiresAt && new Date(user.membershipExpiresAt) > new Date()) {
      return;
    }
    throw new Forbidden("大会员已过期，请续费");
  }

  throw new Forbidden("当前内容需要大会员才能访问");
};
