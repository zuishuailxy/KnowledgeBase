# Agent 总索引

如果需要查看这套 A 股成长股投研体系的完整设计、分层边界、输入输出契约和维护规则，优先阅读：

- [.github/a-share-growth-system-design.md](../a-share-growth-system-design.md)

当前目录下的 Agent 按“入口层总控 Agent”和“内部子 Agent”组织使用。本文档统一整理每个 Agent 的职责、适用场景、是否建议直接使用，以及在系统中的层级位置。

## 使用原则

- 优先从入口层总控 Agent 进入，不要从叶子能力开始手动拼装流程。
- 内部子 Agent 保持单一职责，默认由总控 Agent 自动调用。
- 组合动作判断遵循顺序：质量先于估值，估值先于时机，时机先于动作。
- 凡涉及财务、行情、估值、持仓、新闻、情绪或市场状态数据，必须先做数据来源真实性校验，再输出结论。
- 具体的系统边界、字段契约、升级规则和维护原则，以系统设计说明为准。

## 入口层 Agent 总表

| Agent | 文件 | 层级 | 主要职责 | 典型使用场景 |
| --- | --- | --- | --- | --- |
| A股硬阈值总控台 | [a-share-quant-gate.agent.md](./a-share-quant-gate.agent.md) | 筛选入口 | 用统一门槛完成 5 年 ROE、3 年 FCF、分红率、负债率资格筛选，并做标准化数据清洗 | 先判断一家公司或一批公司值不值得进入深度研究 |
| A股投研总控台 | [a-share-moat.agent.md](./a-share-moat.agent.md) | 基本面入口 | 统筹财报阅读、ROE 拆解、现金流、护城河、风险反证与成长质量分析 | 想判断公司是否属于高质量成长企业 |
| A股估值总控台 | [a-share-valuation.agent.md](./a-share-valuation.agent.md) | 估值入口 | 统筹 DCF、相对估值、反向估值、机会成本和安全边际判断 | 想知道当前价格是否值得买、等还是放弃 |
| 持仓截图归档师 | [stock-holdings-tracker.agent.md](./stock-holdings-tracker.agent.md) | 持仓沉淀入口 | 解析持仓截图并生成或更新 `stocks/my/holder.json`，同时可沉淀 thesis 和决策日志 | 还没有标准化持仓 JSON，想把截图变成可追踪数据 |
| 持仓长期持有审判官 | [portfolio-keeper.agent.md](./portfolio-keeper.agent.md) | 组合治理入口 | 对现有持仓逐股做长期持有审判，判断保留、观察、卖出与组合重构方向 | 想体检整个组合，清理不配占用资本的持仓 |
| A股持仓比例审计官 | [portfolio-allocation-guard.agent.md](./portfolio-allocation-guard.agent.md) | 仓位治理入口 | 审计核心仓、次核心仓、观察仓、现金比例、行业集中度与重复逻辑持仓 | 想看当前组合仓位结构是否失衡、是否需要调仓 |
| A股持仓操作总控台 | [portfolio-action.agent.md](./portfolio-action.agent.md) | 动作决策入口 | 将质量、估值、仓位、成本和 thesis 收敛为继续持有、加仓、减仓、退出或等待，并强制给出盈利/亏损两套动作预案 | 已经持有一只股票，想得到下一步可执行操作建议 |

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
7. 还没有持仓 JSON：先用 持仓截图归档师，默认写入 `stocks/my/holder.json`。

## 持仓数据源

- 默认持仓事实源：`stocks/my/holder.json`
- 基础字段：`股票名称`、`股票代码`、`持仓数量`、`买入成本`
- 匹配规则：股票代码优先，股票名称次之；股票代码必须按字符串处理，保留前导零。
- 查询优先级：用户本次明确提供的持仓 > `stocks/my/holder.json` 中匹配持仓 > 无持仓。

## 持仓盈利/亏损分场景规则

- 只要问题处于“我已经持有”语境，持仓层 agents 默认必须把盈利场景和亏损场景分开回答。
- 盈利场景重点检查：是否高估、是否仓位过重、是否只是情绪驱动的估值扩张、是否已有更优替代项。
- 亏损场景重点检查：thesis 是否破坏、是否仍在 Buy Zone / Strong Buy Zone、是否只是价格波动、是否存在沉没成本驱动的错误补仓。
- 任何持仓动作建议都不能只给一句“继续持有/补仓/卖出”，必须至少附带一个相反盈亏状态下的预案。

## System Version 共性能力

当前这套 Agent 已统一升级为更完整的“巴菲特 + 费雪 + 林奇 + 格雷厄姆 + 芒格 + 价值投资 3.0” System Version：

- 四合一投资框架
  - 巴菲特：护城河、资本回报、现金流质量与管理层资本配置。
  - 费雪：增长跑道、Scuttlebutt、再投资能力与长期扩张力。
  - 林奇：公司分类、PEG / GARP、故事可理解性与验证。
  - 格雷厄姆：内在价值、安全边际、历史估值分位与下行保护。

- 芒格升级
  - 默认先做反向思考：先问什么会让结论失效，再问为什么成立。
  - 默认加入多元思维模型：会计、激励、竞争、心理、资本配置与系统反馈至少做交叉验证。
  - 默认强制做激励分析：管理层、渠道、客户、监管与资本市场激励若错位，必须下调结论。
  - 默认检查误判心理学：确认偏误、从众、沉没成本、叙事成瘾、权威崇拜与剥夺超级反应。
  - 默认把机会成本、等待纪律和少犯错优先写入动作与排序逻辑。
  - 默认在多因素同向共振时显式提示 Lollapalooza 效应，而不是孤立描述单项利好或利空。

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

- 数据来源真实性校验
  - 默认先核验来源渠道、抓取或引用时间、报告期或交易日、指标口径、是否一手来源。
  - 优先使用公司公告、交易所、年报季报等一手来源；第三方聚合数据和行情接口必须标注可能滞后或口径偏差。
  - 若口径冲突、期次不明、实时性不足或无法交叉核验，必须降低置信度并标记“数据待核实”或“可信度不足”。
  - 不得编造实时价格、财报期次、分红方案、新闻情绪、市场状态或量化分数。

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

## Agent -> Prompt -> 输出偏置栏目 对照表

| Agent | Agent 文件 | 对应 Prompt | Prompt 文件 | 关键输出偏置栏目 |
| --- | --- | --- | --- | --- |
| A股硬阈值总控台 | [a-share-quant-gate.agent.md](./a-share-quant-gate.agent.md) | A股硬阈值筛选报告 | [../prompts/a-share-threshold-report.prompt.md](../prompts/a-share-threshold-report.prompt.md) | 假通过检查、错误放行风险、待补证重点 |
| A股投研总控台 | [a-share-moat.agent.md](./a-share-moat.agent.md) | A股基本面研究报告 | [../prompts/a-share-fundamental-report.prompt.md](../prompts/a-share-fundamental-report.prompt.md) | 反方整合、结论降级触发、激励错配风险 |
| A股估值总控台 | [a-share-valuation.agent.md](./a-share-valuation.agent.md) | A股估值决策报告 | [../prompts/a-share-valuation-report.prompt.md](../prompts/a-share-valuation-report.prompt.md) | 预期透支检查、最脆弱假设、等待条件 |
| A股估值总控台 | [a-share-valuation.agent.md](./a-share-valuation.agent.md) | A股机会成本比较报告 | [../prompts/a-share-opportunity-cost-report.prompt.md](../prompts/a-share-opportunity-cost-report.prompt.md) | 淘汰赛视角、等待优先、替代项压力 |
| A股投研总控台 | [a-share-moat.agent.md](./a-share-moat.agent.md) | A股财报事件变化报告 | [../prompts/a-share-earnings-event-report.prompt.md](../prompts/a-share-earnings-event-report.prompt.md) | Thesis 破坏检查、措辞危险信号、不能直接升格的变化 |
| agent 编排入口 | 无单独 agent 文件 | A股完整投资决策总报告 | [../prompts/a-share-full-investment-report.prompt.md](../prompts/a-share-full-investment-report.prompt.md) | 假通过风险、最强反方、预期透支、等待条件、激励/行为误判风险 |
| agent 编排入口 | 无单独 agent 文件 | A股边界案例例外复核报告 | [../prompts/a-share-edge-case-report.prompt.md](../prompts/a-share-edge-case-report.prompt.md) | 错误放行风险、谁在被奖励、为什么便宜不能翻案 |
| 持仓截图归档师 | [stock-holdings-tracker.agent.md](./stock-holdings-tracker.agent.md) | 持仓截图批量导入 | [../prompts/stock-holdings-batch-import.prompt.md](../prompts/stock-holdings-batch-import.prompt.md) | 行为偏差与失效触发记录、等待条件、更优替代线索 |
| 持仓截图归档师 | [stock-holdings-tracker.agent.md](./stock-holdings-tracker.agent.md) | 持仓成本补录 | [../prompts/stock-holdings-cost-backfill.prompt.md](../prompts/stock-holdings-cost-backfill.prompt.md) | 决策日志补录检查、估值区间回填、行为偏差补录 |
| agent 编排入口 | 无单独 agent 文件 | 持仓月报复盘 | [../prompts/stock-holdings-monthly-review.prompt.md](../prompts/stock-holdings-monthly-review.prompt.md) | 行为偏差与资本占用检查、决策日志完整度、盈利/亏损预案 |
| agent 编排入口 | 无单独 agent 文件 | 持仓周报复盘 | [../prompts/stock-holdings-weekly-review.prompt.md](../prompts/stock-holdings-weekly-review.prompt.md) | 坏动作预警、如果今天没有持仓是否会重买、sell trigger 检查、盈利/亏损预案 |

维护规则：
- 改 agent 的角色偏置时，要同步检查对应 prompt 是否已经要求输出相同栏目。
- 改 prompt 栏目时，要反向检查对应 agent 的输出格式是否已有同名或同义必答段。
- 改数据口径、行情来源或真实性校验规则时，要同步检查所有 `.agent.md` 是否仍包含“数据来源真实性校验”。
- 对没有独立 prompt 的叶子 agent，优先在上游总控 agent 或报告 prompt 中维护其偏置反映，而不是单独新增模板。

推荐维护顺序：
1. 先看 [.github/a-share-growth-system-design.md](../a-share-growth-system-design.md) 确认原则是否要变。
2. 再看 [.github/charlie-munger-agent-upgrade.md](../charlie-munger-agent-upgrade.md) 确认偏置逻辑是否要变。
3. 再改具体 agent 与 prompt。
4. 最后回到这张表确认映射没有漂移。

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