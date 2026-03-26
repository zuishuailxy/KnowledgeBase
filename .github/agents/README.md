# Agent 总索引

如果需要查看这套 A 股成长股投研体系的完整设计、分层边界、输入输出契约和维护规则，优先阅读：

- [.github/a-share-growth-system-design.md](../a-share-growth-system-design.md)

当前目录下的 Agent 按“入口层总控 Agent”和“内部子 Agent”组织使用。本文档统一整理每个 Agent 的职责、适用场景、是否建议直接使用，以及在系统中的层级位置。

## 使用原则

- 优先从入口层总控 Agent 进入，不要从叶子能力开始手动拼装流程。
- 内部子 Agent 保持单一职责，默认由总控 Agent 自动调用。
- 组合动作判断遵循顺序：质量先于估值，估值先于时机，时机先于动作。
- 具体的系统边界、字段契约、升级规则和维护原则，以系统设计说明为准。

## 入口层 Agent 总表

| Agent | 文件 | 层级 | 主要职责 | 典型使用场景 |
| --- | --- | --- | --- | --- |
| A股硬阈值总控台 | [a-share-quant-gate.agent.md](./a-share-quant-gate.agent.md) | 筛选入口 | 用统一门槛完成 5 年 ROE、3 年 FCF、分红率、负债率资格筛选，并做标准化数据清洗 | 先判断一家公司或一批公司值不值得进入深度研究 |
| A股投研总控台 | [a-share-moat.agent.md](./a-share-moat.agent.md) | 基本面入口 | 统筹财报阅读、ROE 拆解、现金流、护城河、风险反证与成长质量分析 | 想判断公司是否属于高质量成长企业 |
| A股估值总控台 | [a-share-valuation.agent.md](./a-share-valuation.agent.md) | 估值入口 | 统筹 DCF、相对估值、反向估值、机会成本和安全边际判断 | 想知道当前价格是否值得买、等还是放弃 |
| 持仓截图归档师 | [stock-holdings-tracker.agent.md](./stock-holdings-tracker.agent.md) | 持仓沉淀入口 | 解析持仓截图并生成或更新持仓 Excel，同时可沉淀 thesis 和决策日志 | 还没有标准化持仓台账，想把截图变成可追踪数据 |
| 持仓长期持有审判官 | [portfolio-keeper.agent.md](./portfolio-keeper.agent.md) | 组合治理入口 | 对现有持仓逐股做长期持有审判，判断保留、观察、卖出与组合重构方向 | 想体检整个组合，清理不配占用资本的持仓 |
| A股持仓比例审计官 | [portfolio-allocation-guard.agent.md](./portfolio-allocation-guard.agent.md) | 仓位治理入口 | 审计核心仓、次核心仓、观察仓、现金比例、行业集中度与重复逻辑持仓 | 想看当前组合仓位结构是否失衡、是否需要调仓 |
| A股持仓操作总控台 | [portfolio-action.agent.md](./portfolio-action.agent.md) | 动作决策入口 | 将质量、估值、仓位、成本和 thesis 收敛为继续持有、加仓、减仓、退出或等待 | 已经持有一只股票，想得到下一步可执行操作建议 |

## 内部子 Agent 总表

| Agent | 文件 | 所属层 | 主要职责 | 默认调用方 |
| --- | --- | --- | --- | --- |
| A股硬阈值初筛器 | [a-share-quant-screener.agent.md](./a-share-quant-screener.agent.md) | 筛选层 | 用固定门槛批量扫描全 A、行业或指数成分股，产出达标、观察、淘汰名单 | A股硬阈值总控台 |
| 财务门槛复核师 | [threshold-auditor.agent.md](./threshold-auditor.agent.md) | 筛选层 | 对单家公司逐项复核 ROE、FCF、分红率、负债率是否真正达标 | A股硬阈值总控台 |
| A股初筛器 | [a-share-screener.agent.md](./a-share-screener.agent.md) | 筛选层 | 在通过门槛后继续做护城河、成长质量、财务强度的候选池筛选 | A股投研总控台 |
| 财报ROE拆解师 | [roe-breakdown.agent.md](./roe-breakdown.agent.md) | 基本面层 | 用杜邦视角拆解 ROE 质量，区分经营改善与杠杆抬升 | A股投研总控台 |
| 自由现金流追踪师 | [fcf-tracker.agent.md](./fcf-tracker.agent.md) | 基本面层 | 评估经营现金流、资本开支、利润含金量、normalized FCF 与再投资质量 | A股投研总控台、A股估值总控台 |
| 护城河反证师 | [moat-falsifier.agent.md](./moat-falsifier.agent.md) | 基本面层 | 从应收、存货、商誉、竞争格局和渠道变化里寻找反证与劣化信号 | A股投研总控台 |
| 财报事件追踪师 | [earnings-tracker.agent.md](./earnings-tracker.agent.md) | 基本面层 | 跟踪年报、季报、预告、说明会后的前提变化与验证点 | A股投研总控台、A股持仓操作总控台 |
| 内在价值估算师 | [intrinsic-value.agent.md](./intrinsic-value.agent.md) | 估值层 | 输出 DCF / SOTP / 三情景公允价值与安全边际区间 | A股估值总控台 |
| 相对估值参照师 | [relative-valuation.agent.md](./relative-valuation.agent.md) | 估值层 | 用 PE、PB、EV/EBIT、EV/EBITDA 和历史分位交叉验证价格位置 | A股估值总控台 |
| 反向估值师 | [reverse-valuation.agent.md](./reverse-valuation.agent.md) | 估值层 | 反推当前股价隐含的增长和乐观预期，识别是否过度透支 | A股估值总控台 |
| 机会成本比较师 | [opportunity-cost.agent.md](./opportunity-cost.agent.md) | 估值层 | 比较多个标的谁更值得占用当前资本，并做优先级排序 | A股估值总控台、A股持仓操作总控台 |

## 说明文档

| 文档 | 文件 | 作用 |
| --- | --- | --- |
| A股持仓操作总控台职责说明 | [portfolio-action-responsibility.md](./portfolio-action-responsibility.md) | 对 A股持仓操作总控台 的系统定位、输入边界、判断顺序、输出动作语义做单独说明 |

## 推荐使用顺序

1. 不知道公司是否值得研究：先用 A股硬阈值总控台。
2. 想看公司本身是否优秀：用 A股投研总控台。
3. 想看当前价格是否值得买：用 A股估值总控台。
4. 已经持有某只股票，想知道下一步怎么操作：用 A股持仓操作总控台。
5. 想审判整个持仓是否配得上长期持有：用 持仓长期持有审判官。
6. 想检查仓位比例是否失衡：用 A股持仓比例审计官。
7. 还没有 Excel 持仓表：先用 持仓截图归档师。

## System Version 共性能力

当前这套 Agent 已统一升级为更完整的 v8 System Version：

- 四合一投资框架
  - 巴菲特：护城河、资本回报、现金流质量与管理层资本配置。
  - 费雪：增长跑道、Scuttlebutt、再投资能力与长期扩张力。
  - 林奇：公司分类、PEG / GARP、故事可理解性与验证。
  - 格雷厄姆：内在价值、安全边际、历史估值分位与下行保护。

- 费雪成长股升级
  - 默认把未来 5 到 10 年持续成长能力纳入核心判断，而不是只看静态便宜与否。
  - 默认显式评估护城河强度、再投资能力、管理层资本配置与成长跑道。
  - 默认区分优质成长、周期高点、并购堆砌增长和单一爆款增长，避免把伪成长误判为长期复利。
  - 默认鼓励用财报、电话会、行业资料、竞争格局和管理层表述做交叉验证。

- 彼得·林奇升级
  - 默认先做公司类型分类：Slow Grower / Stalwart / Fast Grower / Cyclical / Turnaround / Asset Play。
  - 默认显式检查业务是否在能力圈内，故事是否足够简单且能被产品、渠道、用户与行业事实验证。
  - 对成长类标的默认加入 PEG / GARP 检查；对周期、困境与资产型标的默认切换到更保守的口径。
  - 组合层默认反对 diworseification，不鼓励用大量中庸仓位替代高信念配置。

- 数据抽取与清洗
  - 在筛选、财务和估值相关 Agent 中，优先提取 Revenue、FCF、Net Income、Shares Outstanding、Debt 等关键数据。
  - 默认识别异常值、一次性事项、并购并表和极端周期年份，并说明标准化口径。

- DCF 三情景与买入区间
  - 估值层统一支持 Conservative、Base、Optimistic 三情景 DCF。
  - 统一使用 Fair Value、Buy Zone、Strong Buy Zone 作为价格判断语言。

- 基本面与估值联动
  - 现金流、ROE、反证、财报事件等叶子 Agent，都会说明其结论如何影响 normalized FCF、折现率、终值增长率或买入区间。

- 决策日志沉淀
  - 持仓归档链路不只保存截图和交易字段，也可以沉淀 thesis、估值区间、关键风险、后续验证点和卖出触发条件。

- MQVGS 多因子扩展
  - 默认在可获得数据的前提下，将 Value / Quality / Growth 纳入统一辅助摘要。
  - Momentum、Sentiment、市场状态、组合优化和因子暴露属于可选扩展层：有足够公开数据时启用；数据不足时不臆造分数。

- 情绪与市场状态边界
  - 可基于公告、新闻、财报措辞和公开市场叙事做新闻情绪与拥挤度判断。
  - 不默认声称拥有完整社交媒体全量数据、实时 VIX 或专业因子数据库；缺数据时只输出定性或半定量判断。

## 能力分工

- 筛选层
  - A股硬阈值总控台
  - A股硬阈值初筛器
  - 财务门槛复核师
  - A股初筛器

- 基本面层
  - A股投研总控台
  - 财报ROE拆解师
  - 自由现金流追踪师
  - 护城河反证师
  - 财报事件追踪师

- 估值层
  - A股估值总控台
  - 内在价值估算师
  - 相对估值参照师
  - 反向估值师
  - 机会成本比较师

- 持仓沉淀与治理层
  - 持仓截图归档师
  - 持仓长期持有审判官
  - A股持仓比例审计官
  - A股持仓操作总控台