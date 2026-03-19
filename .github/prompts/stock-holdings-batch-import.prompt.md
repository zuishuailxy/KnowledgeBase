---
name: "持仓截图批量导入"
description: "Use when: 批量解析多张持仓截图，统一落到 stocks/StockHoldings/portfolio-tracker.xlsx，并输出本次导入摘要与待确认项。"
argument-hint: "输入批量导入范围，例如：把我这次上传的全部持仓截图批量写入总台账"
agent: "持仓截图归档师"
---
把本次请求里用户上传的持仓相关图片做一次批量导入，统一写入单一总台账 stocks/StockHoldings/portfolio-tracker.xlsx。

## 固定规则
1. 默认处理本次请求里全部附件图片；如果用户指定子集，只处理用户点名的图片。
2. 默认写入单一总台账，不为单只股票拆分多个 Excel。
3. 如果截图没有明确日期，使用导入当天日期，并标记“截图日期未知，已按导入日记账”。
4. 不覆盖旧记录；对同一股票的新截图按时间追加为新快照。
5. 对不清晰字段留空并写入 `parse_issues`，不要猜测。
6. `holdings_snapshots` 中的“股票名称”默认直接使用图片文件名，例如 `贵州茅台.jpg`。

## 执行要求
1. 逐张识别图片类型，区分持仓快照、交易记录线索、K 线辅助信息。
2. 将持仓主信息写入 `holdings_snapshots`。
3. 将截图中可见但不完整的交易动作或 BS 点写入 `trade_clues`。
4. 将低置信度、缺失字段、人工待核项写入 `parse_issues`。
5. 如果总台账不存在，则创建 `portfolio-tracker.xlsx`；若已存在，则保留原表并追加。
6. 若写入 Excel 需要本地脚本支持，可使用工作区现成 Python 环境和最小必要依赖完成。

## 强制输出格式

# 批量导入结果
- 处理图片数量：
- 成功写入记录数：
- 更新文件：stocks/StockHoldings/portfolio-tracker.xlsx

# 图片解析摘要
- 图片 1：股票 / 类型 / 关键字段
- 图片 2：股票 / 类型 / 关键字段
- 其余图片：按同样格式列出

# 数据质量
- 低置信度字段：
- 缺失字段：
- 人工待确认项：

# 本次新增内容
- holdings_snapshots 新增：
- trade_clues 新增：
- parse_issues 新增：

# 后续动作
- 是否建议补传更清晰截图：是 / 否
- 是否建议补录买入成本或交易明细：是 / 否