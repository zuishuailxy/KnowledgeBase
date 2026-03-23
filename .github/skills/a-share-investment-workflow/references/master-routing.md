# Master Routing Map

## 总原则
- 标准情况优先走主 Skill。
- 只有当硬阈值不过线、但用户明确要求复核时，才切到边界 Skill。
- 边界 Skill 负责“是否允许继续研究”，不负责推翻原始门槛结论。
- 如果用户想直接得到统一报告，优先从对应 Prompt 入口进入，而不是手动拼装多段分析。
- 主流程默认采用“费雪成长股框架 + 价值投资 3.0”混合标准：先看长期成长质量，再看价格是否合理。

## 总路由图

```text
开始
  |
  |-- 任务是标准单公司/候选池研究？ -- 是 --> 主 Skill：a-share-investment-workflow
  |                                           |
  |                                           |-- 想直接拿完整统一报告？
  |                                           |     |-- 是 --> Prompt：a-share-full-investment-report.prompt.md
  |                                           |     |-- 否 --> 按阶段继续
  |                                           |
  |                                           |-- 第1层：硬阈值
  |                                           |     |-- 达标 ------> 第2层：基本面
  |                                           |     |-- 观察 ------> 第2层：基本面（保留缺口说明）
  |                                           |     |-- 淘汰 ------> 默认停止
  |                                           |     |                  |
  |                                           |     |                  |-- 用户明确要求边界复核？ -- 是 --> 边界 Skill
  |                                           |     |                  |-- 否 --> 结束
  |                                           |     |-- 不适用 ----> 第2层：基本面（说明门槛不适用）
  |                                           |     |
  |                                           |     |-- 如果用户只要门槛报告 --> Prompt：a-share-threshold-report.prompt.md
  |                                           |
  |                                           |-- 第2层：基本面
  |                                           |     |-- 优质 ------> 第3层：估值
  |                                           |     |-- 观察 ------> 第3层：估值（更谨慎）
  |                                           |     |-- 回避 ------> 默认停止
  |                                           |     |
  |                                           |     |-- 核心补充：增长跑道 / 再投资能力 / 管理层质量 / Scuttlebutt 旁证
  |                                           |     |-- 如果用户只要基本面报告 --> Prompt：a-share-fundamental-report.prompt.md
  |                                           |
  |                                           |-- 第3层：估值
  |                                           |     |-- 买入 ------> 可进入机会成本比较或事件跟踪
  |                                           |     |-- 观望 ------> 等待条件/继续跟踪
  |                                           |     |-- 放弃 ------> 结束
  |                                           |     |
  |                                           |     |-- 核心补充：成长溢价判断
  |                                           |     |-- 如果用户只要估值报告 --> Prompt：a-share-valuation-report.prompt.md
  |                                           |
  |                                           |-- 可选附加层
  |                                                 |-- 多标的比较 --> 机会成本比较师
  |                                                 |     |-- 统一入口 --> Prompt：a-share-opportunity-cost-report.prompt.md
  |                                                 |-- 财报/公告变化 --> 财报事件追踪师
  |                                                       |-- 统一入口 --> Prompt：a-share-earnings-event-report.prompt.md
  |
  |-- 任务本身就是边界案例？ -- 是 --> 边界 Skill：a-share-edge-case-workflow
                                              |
                                              |-- 想直接拿例外复核统一报告？
                                              |     |-- 是 --> Prompt：a-share-edge-case-report.prompt.md
                                              |     |-- 否 --> 按边界流程继续
                                              |
                                              |-- 锁定原始硬阈值结论
                                              |-- 判断失败原因是否可解释
                                              |-- 重做基本面复核
                                              |-- 强制反证检查
                                              |-- 允许继续？
                                                    |-- 否 --> 停止例外处理
                                                    |-- 是 --> 允许进入估值层，但默认最高只保持观望
```

## 什么时候走主 Skill
- 用户要做单公司完整投资决策
- 用户要筛候选池
- 用户要做标准硬阈值、基本面、估值三层研究
- 用户没有强调“不过线但我仍然想研究”
- 用户要判断一家公司是否属于优质成长股、潜在成长股，还是并不符合费雪式长期复利标准

对应 Prompt 入口：
- 完整总报告：a-share-full-investment-report.prompt.md
- 门槛报告：a-share-threshold-report.prompt.md
- 基本面报告：a-share-fundamental-report.prompt.md
- 估值报告：a-share-valuation-report.prompt.md
- 机会成本比较：a-share-opportunity-cost-report.prompt.md
- 财报事件变化：a-share-earnings-event-report.prompt.md

## 什么时候走边界 Skill
- 原始硬阈值是 观察 或 淘汰
- 不过线集中在少数单项，而不是系统性失败
- 用户明确要研究边界案例
- 目标是判断“是否允许继续研究”，不是直接给买入结论

对应 Prompt 入口：
- 边界案例统一复核：a-share-edge-case-report.prompt.md

## 主 Skill 与边界 Skill 的职责边界

### 主 Skill 负责
- 标准流程
- 标准三层结论
- 买入 / 观望 / 放弃 的正式投资判断
- 优质成长股 / 潜在成长股 / 不符合 的成长股定位
- 增长跑道、再投资能力、管理层质量和成长溢价判断

### 边界 Skill 负责
- 保留原始不过线结论
- 解释不过线原因是否可逆
- 判断是否允许例外进入基本面或估值层
- 默认把最终动作压到观望，由用户自己决定是否买入
- 判断边界项是否已经破坏费雪式成长叙事

## 快速判断口诀
- 过线正常研究：走主 Skill
- 不过线但想继续看：走边界 Skill
- 回避、高风险、不可解释：停止
- 多标的排序：在主流程后加机会成本比较
- 财报事件改变逻辑：在原研究后加事件跟踪
- 成长股先问四件事：增长能否持续、护城河是否支撑、管理层是否可信、利润能否高回报再投资

## Prompt 对齐总结
- 主流程完整入口：a-share-full-investment-report.prompt.md
- 主流程分段入口：threshold / fundamental / valuation / opportunity-cost / earnings-event
- 边界流程入口：a-share-edge-case-report.prompt.md
- 原则：标准问题优先主流程 Prompt；不过线但仍要复核时，优先边界案例 Prompt
- 当前所有 Prompt 已同步输出增长跑道、管理层与再投资、Scuttlebutt 旁证和成长溢价判断