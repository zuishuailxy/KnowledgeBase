---
name: "持仓成本补录"
description: "Use when: 把买入均价、买入日期、持仓股数、逐笔交易明细补录进 stocks/StockHoldings/portfolio-tracker.xlsx，完善总台账。"
argument-hint: "输入补录对象，例如：补录贵州茅台买入价 1395.34、买入日期 2026-01-29、100 股"
agent: "持仓截图归档师"
---
把用户提供的买入成本、买入日期、股数和交易明细补录到单一总台账 stocks/StockHoldings/portfolio-tracker.xlsx。

## 固定规则
1. 总台账使用同一个文件：stocks/StockHoldings/portfolio-tracker.xlsx。
2. 成本信息优先写入 `position_costs`，逐笔交易优先写入 `transaction_ledger`。
3. 如果能准确映射到已有持仓快照，可同步补充 `holdings_snapshots` 中的“买入均价”；否则只写成本表与交易表，不乱改历史快照。
4. 若用户未提供完整信息，不猜测缺失字段，保留空值并写明待补项。

## 执行要求
1. 先检查总台账是否存在；若不存在，先创建符合当前 schema 的工作簿。
2. 按股票代码和名称优先匹配已有记录；其中“股票名称”默认按图片文件名理解，例如 `贵州茅台.jpg`。若无法唯一匹配，提示用户确认但不要写错行。
3. 同一股票多次补录时，保留历史交易流水，成本表以最新确认值更新，并记录更新时间。
4. 如果用户提供的是逐笔成交，必须逐条写入 `transaction_ledger`，不要只保留汇总值。
5. 如果用户只提供汇总成本，没有逐笔成交，则更新 `position_costs`，并在 `note` 中标明“人工汇总补录”。

## 强制输出格式

# 补录结果
- 股票：
- 更新文件：stocks/StockHoldings/portfolio-tracker.xlsx
- 更新工作表：position_costs / transaction_ledger / holdings_snapshots

# 本次补录内容
- 买入均价：
- 最近一次买入日期：
- 持仓股数：
- 交易明细条数：

# 一致性检查
- 是否匹配到已有持仓：是 / 否
- 是否存在冲突数据：是 / 否
- 冲突或缺口说明：

# 后续动作
- 是否还需要补录卖出记录：是 / 否
- 是否建议回填历史截图对应成本：是 / 否