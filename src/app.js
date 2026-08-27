import {
  bindTaskCenter,
  taskWorkspaceMarkup,
} from "./task-center.js";
import {
  beginReportEditing,
  bindReportEditor,
  downloadPublishedReport,
  isEditingReport,
  reportEditorMarkup,
  sharePublishedReport,
} from "./report-editor.js";
import { filePresentation } from "./file-types.js";
import { renderRichFile } from "./file-renderers.js";
import {
  normalizeSearchText,
  reportArchiveMatchesQuery,
  reportSearchDetails,
} from "./search.js";
import {
  archiveFilename,
  formatBytes,
  packReportArchive,
} from "./single-file-archive.js";

const STORAGE_KEY = "clair-service-report-workbench-v1";
const VIEW_KEY = "clair-service-report-workbench-view";
const TIME_SORT_KEY = "clair-service-report-time-sort-v1";
const BUCKET_ORDER_KEY = "clair-service-report-workbench-bucket-order-v1";
const REPORT_ORDER_KEY = "clair-service-report-workbench-report-order-v1";
const FILE_DATABASE_NAME = "clair-ai-studio-files";
const FILE_STORE_NAME = "files";
const DATA_VERSION = 59;
const SEARCH_INPUT_DEBOUNCE_MS = 160;
const VIEWPORT_RESTORE_SETTLE_MS = 720;
const APPLICATION_UPDATE_CHECK_INTERVAL_MS = 30_000;

const WORK_TYPES = [
  { id: "requirement-review", name: "需求评审" },
  { id: "reporting", name: "汇报材料" },
  { id: "competitive-research", name: "竞品调研" },
  { id: "product-planning", name: "产品规划" },
  { id: "data-analysis", name: "数据分析" },
  { id: "investment-research", name: "投研分析" },
  { id: "governance-review", name: "治理审查" },
  { id: "product-demo", name: "原型 Demo" },
];

const TAG_ORDER = [
  "手动保存",
  "生产",
  "个人",
  "HTML",
  "本体",
  "飞书",
  "调研",
  "产品规划",
  "AI 小顾",
  "AI 工作台",
  "AI 开放平台",
  "且慢",
  "OAP",
  "MCP",
  "Skills",
  "投顾服务",
  "投研",
  "数据分析",
  "需求评审",
  "经营汇报",
  "知识治理",
];

const UI_ICONS = {
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>',
  minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"></path></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="m13 7 4 4"></path></svg>',
  archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v13H4z"></path><path d="M3 4h18v3H3zM9 11h6"></path></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"></path></svg>',
  top: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14M12 19V8m0 0-4 4m4-4 4 4"></path></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5"></path></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"></path></svg>',
  bottom: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19h14M12 5v11m0 0-4-4m4 4 4-4"></path></svg>',
};

const initialState = {
  version: DATA_VERSION,
  groups: [
    {
      id: "xiaogu",
      name: "AI 小顾与投顾服务",
      description: "AI 小顾、顾问服务与客户体验",
      accent: "green",
      position: 0,
    },
    {
      id: "ai-workbench",
      name: "AI 工作台与生产力",
      description: "个人工作台、评审工具与 AI 生产力",
      accent: "blue",
      position: 1,
    },
    {
      id: "ai-platform",
      name: "AI 开放平台",
      description: "OAP、MCP、Skills、Agents 与治理",
      accent: "violet",
      position: 2,
    },
    {
      id: "product-planning",
      name: "且慢产品与体验",
      description: "产品规划、体验分析与交互方案",
      accent: "blue",
      position: 3,
    },
    {
      id: "research",
      name: "投研与策略研究",
      description: "基金、策略与资产配置研究",
      accent: "amber",
      position: 4,
    },
    {
      id: "reporting",
      name: "经营分析与汇报",
      description: "业务分析、周报与管理汇报",
      accent: "blue",
      position: 5,
    },
    {
      id: "knowledge",
      name: "知识治理与组织协同",
      description: "本体、飞书、SOUL 与知识资产",
      accent: "slate",
      position: 6,
    },
  ],
  reports: [
    {
      id: "qieman-risk-lens-2026-08-27",
      groupId: "product-planning",
      title: "风险透镜｜且慢持仓风险测算：个人风险分 × 舒适区间 × 持仓落点（交互工具）",
      url: "https://clairku.github.io/clair-ai-studio/apps/risk-lens/",
      preview: "qieman-risk-lens.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-27T15:10:00.000+08:00",
      source: "交互式风险测算工具（React SPA，离线内置数据可直接演示）｜个人风险四来源：带入且慢等级/手选五档/输入分数/现场复刻风测（0000-20240506 全 17 题，KYC 计分 out-of-sample C 档命中 96%、一票否决 100%）｜持仓四来源：搜基金（2.4 万在售）/导入 Excel/选官方在售策略（advisor_prod_shelf_info broker0008）/登录且慢｜0–100 风险标尺画五档色带+舒适区间高亮+持仓整体落点｜基金晨星风险分：实时走 bmdj /fund/risk-info，离线用回归兜底（R²=0.966，CV MAE 3.35）｜组合分含 HHI 分散化；私募（is_public_fund=0）与未知代码不臆造、剔除并标注｜适当性匹配复刻 bmdj doCheckRisk 矩阵｜口径经盈米本体+Redash 核实｜官方且慢蓝 #1B88EE",
      access: "production",
      workType: "product-demo",
      tags: ["且慢", "风险测算", "风险测评", "KYC", "晨星风险分", "舒适区间", "适当性匹配", "持仓诊断", "投顾策略", "交互工具", "原型 Demo", "盈米本体", "且慢蓝", "生产"],
    },
    {
      id: "yingmi-qieman-geo-effect-audit-2026-08-26",
      groupId: "reporting",
      title: "盈米基金与且慢 GEO 效果审计｜有引用，但尚未形成可控增长闭环",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-qieman-geo-effect-audit-2026-08-26/",
      preview: "yingmi-qieman-geo-effect-audit-2026-08-26.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-26T10:50:00.000+08:00",
      source: "内部 GEO 发布/引用台账（更新至 2026-07-31）+ 公开搜索与官网技术审计（2026-08-26）｜115 个发布链接，20 条已记录 AI 引用；17.4% 仅为台账记录下限，不等同真实命中率｜头条/搜狐体系占 80%，并贡献全部已记录引用｜品牌词与四笔钱较强，非品牌痛点词和官方信源主导偏弱｜建议进入官网技术修复、事实注册表、Answer Hub 与业务归因闭环｜内部经营研究，聚合披露",
      access: "production",
      workType: "competitive-research",
      tags: ["盈米基金", "且慢", "GEO", "AI 搜索", "品牌", "内容分发", "搜索可见度", "数据效果", "官网技术", "经营汇报", "调研", "CLAIR", "HTML", "生产"],
    },
    {
      id: "fund-data-mcp-capability-audit-2026-08-24",
      groupId: "ai-platform",
      title: "公募基金数据能力盘点｜哪些已有，哪些能封装成对外 MCP",
      url: "https://clairku.github.io/clair-ai-studio/reports/fund-data-mcp-capability-audit-2026-08-24/",
      preview: "fund-data-mcp-capability-audit-2026-08-24.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-24T16:30:00.000+08:00",
      source: "内部本体、服务源码、生产数据新鲜度与工具注册交叉核验的原始完整报告｜六类数据能力中 4 类已有可封装（公告事件、基金经理、持有人结构、历史报告期持仓），2 类部分已有（基金公司、ETF）｜包含原始库表、路由、数据量、负责人及权限授权分析｜建议首期五个 MCP 工具｜内部材料，请勿外传",
      access: "production",
      workType: "data-analysis",
      tags: ["MCP", "AI 开放平台", "基金数据", "数据能力", "基金公告", "基金经理", "持有人", "基金持仓", "ETF", "数据治理", "本体", "调研", "数据分析", "CLAIR", "HTML", "生产"],
    },
    {
      id: "yingmiwork-product-brief-2026-08-20",
      groupId: "ai-workbench",
      title: "YingmiWork 产品简报｜盈米自己的 AI 工作台：定位、能力与使用指引",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmiwork-product-brief-2026-08-20/",
      preview: "yingmiwork-product-brief-2026-08-20.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-20T16:30:00.000+08:00",
      source: "基于 v0.0.4 实机验证（CDP 驱动真实界面 + 本地数据核对）+ 官方下载页口径｜定位：投顾的数字员工，本地 Agent 引擎 FinClaw + 技能市场 317 个 + 7 国产模型池｜四大能力支柱逐条实测标注｜19 项功能表 + 六步使用指引 + 0.0.1→0.0.4 版本节奏｜路线图伏笔（定时任务/团队/远程 Agent/TAMP 六步法）标注推断口径｜内部工具，请勿外传",
      access: "production",
      workType: "reporting",
      tags: ["YingmiWork", "AI 工作台", "产品简报", "Agent", "技能市场", "IM 渠道", "使用指引", "汇报材料", "HTML", "生产"],
    },
    {
      id: "qieman-selfservice-vs-advisory-cohorts-2026-08-19",
      groupId: "xiaogu",
      title: "且慢用户分层｜纯自助 vs 投顾占比<50% vs 投顾占比≥50% 五维对比",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-selfservice-vs-advisory-cohorts-2026-08-19/",
      preview: "qieman-selfservice-vs-advisory-cohorts-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T15:40:00.000+08:00",
      source: "且慢持仓用户按投顾策略持仓占比三分组（0 / <50% / ≥50%）对比五维指标｜覆盖 291,857 户全量（G3 占 94%）｜核心结论：投顾占比越高波动率越低（8.31% vs 19.07%）、回撤越小（11.60% vs 18.25%）、盈利面越广（83.56% vs 78.15%）｜均值收益 G1 最高但右偏长尾+小样本，中位数三组接近且 G2 最高｜统计时点 2026-08-14｜回撤/波动率近120日哈希抽样｜生产数仓 dw-tidb（redash ds41）｜盈米本体取数｜官方且慢蓝 #1B88EE 单色阶梯｜CLAIR 单页 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "用户分层", "自助交易", "投顾策略", "投顾占比", "收益率", "最大回撤", "波动率", "持有时长", "盈利占比", "数据分析", "盈米本体", "且慢蓝", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-goal-account-longterm-value-2026-08-19",
      groupId: "xiaogu",
      title: "且慢目标投顾｜目标规划的长期价值：有无目标账户 24 个月对照",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-goal-account-longterm-value-2026-08-19/",
      preview: "qieman-goal-account-longterm-value-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T21:30:00.000+08:00",
      source: "基准日 2024-06-28 在管活跃用户 263,485 人两组对照（有目标账户 61,056 / 无目标账户 202,429）｜留存率 12 月 91.86% vs 81.30%（+10.6pp）、24 月 86.12% vs 70.55%（+15.6pp，差距随时间扩大）｜复投率 98.57% vs 89.54%（+9.0pp，首投不含盈米宝）｜平均在管天数 1914.9 vs 1702.6（+212 天）｜目标账户=财富目标场景或目标年化收益率任一｜官方且慢蓝 #1B88EE｜CLAIR 单页图表 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "目标投顾", "目标账户", "目标规划", "留存率", "复投率", "持有时长", "用户分组", "长期价值", "数据分析", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-advisor-value-ca-compare-2026-08-19",
      groupId: "xiaogu",
      title: "且慢投顾｜投顾价值透视：投顾策略 CA vs 自助基金交易 CA",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-advisor-value-ca-compare-2026-08-19/",
      preview: "qieman-advisor-value-ca-compare-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T12:10:00.000+08:00",
      source: "且慢投顾价值专题（自助 vs 投顾五维对比报告的投顾价值视角版）｜四维证据：累计MWR 19.93% vs 12.47%（+7.46pp）、最大回撤 7.71% vs 8.60%（-0.89pp）、年化波动 9.28% vs 11.46%（-2.18pp）、盈利占比 81.93% vs 70.12%（+11.8pp）｜持有时长≈817天持平佐证差异来自配置与陪伴｜水下回撤曲线+日收益率241交易日全序列｜快照 2026-08-17｜生产数仓 dw-tidb（redash ds41）｜盈米本体取数｜官方且慢蓝 #1B88EE｜CLAIR 单页 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "投顾价值", "投顾策略", "自助交易", "CA", "累计收益", "最大回撤", "波动率", "盈利占比", "水下曲线", "数据分析", "盈米本体", "ECharts", "且慢蓝", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-dual-account-cohort-comparison-2026-08-19",
      groupId: "xiaogu",
      title: "且慢用户｜稳钱+长钱双持 vs 单持：五维投资表现对比",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-dual-account-cohort-comparison-2026-08-19/",
      preview: "qieman-dual-account-cohort-comparison-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T16:30:00.000+08:00",
      source: "且慢三组用户对比（稳钱+长钱双持 83,475 / 仅长钱 136,938 / 仅稳钱 108,775）｜累计收益率 acc_mwr 17.83% / 34.08% / 15.15%｜盈利用户占比 79.3% / 67.4% / 82.2%｜人均累计收益额 3.68万 / 1.59万 / 0.28万｜持有时长 1,105 / 1,016 / 767 天｜近3月年化波动率 9.88% / 13.09% / 4.43%（1/20 抽样）｜近3月最大回撤均值 6.45% / 8.85% / 2.30%（1/100 抽样）｜数据截至 2026-07-31｜盈米本体 × redash ds41｜官方且慢蓝 #1B88EE 单色阶梯｜CLAIR 单页图表 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "四笔钱", "稳钱", "长钱", "账户结构", "用户分层", "投资收益", "最大回撤", "波动率", "持有时长", "盈利占比", "数据分析", "盈米本体", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-risk-comfort-match-2026-08-19",
      groupId: "xiaogu",
      title: "且慢投顾适当性｜持仓风险 × 风险舒适区三组用户对比",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-risk-comfort-match-2026-08-19/",
      preview: "qieman-risk-comfort-match-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T11:00:00.000+08:00",
      source: "且慢持仓用户 297,401 人按持仓晨星风险分 vs 风险舒适区分三组｜风险过低 61.1% / 匹配 24.0% / 过高 15.0%｜匹配组资金加权收益率 9.50% 三组最高｜过高组盈利占比 71.33% 与持有时长 1,274 天双垫底｜波动率/最大回撤以晨星持仓风险分代理（mc-query 缺 ODPS 凭证，口径限制见页内）｜晨星 KYP 周频快照 2026-08-15 × ying99_asset 收益表｜盈米本体下钻 73 轮｜且慢蓝单色阶梯可视化｜CLAIR 单页图表 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "投顾适当性", "风险舒适区", "晨星风险", "KYP", "持仓风险", "投资收益", "盈利占比", "持有时长", "用户分组", "数据分析", "盈米本体", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-business-trends-2026-08-19",
      groupId: "xiaogu",
      title: "盈米经营走势｜公司成立至今规模与用户",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-business-trends-2026-08-19/",
      preview: "qieman-business-trends-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T23:30:00.000+08:00",
      source: "盈米经营走势两图整合（公司/蜂鸟/且慢/启明四维度，全口径 AUM 回溯至公司成立）｜规模走势实线=全口径 AUM（dwd combine ROOT 综合资产，2015-09-28 起 132 个月：公司 0.01 亿→2757.07 亿 / 蜂鸟 1970.15 / 且慢 408.41 / 启明 378.52 亿；2016-12=9.96 亿、2018-12=173 亿、2020-12=650 亿；跨度 7 万倍配对数刻度开关；2018 年前分 BU 归属语义不一致已注明）｜虚线=柜台清算口径投顾组合保有（2021-07 起：公司 531.63 / 且慢 324.53 / 启明 205.27 亿）｜且慢柜台保有/自助/组合灰色开关，悬停附自助占比｜用户走势（签约 53.9 万 / 有资产 42.4 万 / 在管 29.5 万 / 有交易月度 2016-06 起）｜图例勾选 + 时间范围（含近 10 年）+ 线性/对数切换 + 十字线 + 表格｜官方且慢蓝 #1B88EE 家族｜生产数仓 dw-tidb（redash ds41/ds31）：回溯段 70 个月单日串行实拉、衔接点 805.70→808.92 平滑｜自绘 SVG 零依赖单文件｜CLAIR 可视化 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "经营指标", "AUM", "基金规模", "基金投顾", "自助基金", "签约人数", "有交易用户", "在管用户", "走势图", "数据分析", "盈米本体", "且慢蓝", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-advisory-value-key-charts-2026-08-19",
      groupId: "xiaogu",
      title: "且慢投顾价值｜先算得出来的两件事（图表版）",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-advisory-value-key-charts-2026-08-19/",
      preview: "qieman-advisory-value-key-charts-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T11:30:00.000+08:00",
      source: "且慢投顾价值证明的两张关键图｜实测截至 2026-08-19，全平台口径非投顾组｜图一：同一个盈利用户占比三种口径（累计在管 80.3%、累计全量 73.0%、2026 年内区间 29.7%，同一批 652,953 人相差 43.3pp）｜图二：定投计划状态分布（全量 1,001,102 个计划，中断率 26.8%，termination_cause 全部为 NULL 无法归因）｜含投顾组对照的切分口径（sign_record 542,371 人 / drive_mode DR 184,281）与尚未建成说明｜redash ds31/ds41 + MaxCompute｜CLAIR 可视化 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "投顾价值", "投顾服务", "收益口径", "定投", "中断率", "持有体验", "拿得住", "数据可视化", "图表", "数据分析", "盈米本体", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-pension-user-growth-2026-08-19",
      groupId: "xiaogu",
      title: "且慢养老场景｜用户数据与规模增长分析",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-pension-user-growth-2026-08-19/",
      preview: "qieman-pension-user-growth-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T18:30:00.000+08:00",
      source: "且慢养老场景用户数据与规模增长分析｜三支柱口径（TD 个养 4,592 + QMP 3,004 去重 7,175 人 / 颐养天年 PCCA 761 户）｜总资产 14.43 亿（ROOT 口径）/ 累计净流入 11.26 亿 / 人均 38.71 万｜2022-11 个养制度落地为分水岭，2022-2024 年均新增 ~1,880，2026 月均 ~50，红利期已过转入存量经营｜已开通未注资 3,544 户为可激活存量｜30-49 岁 84% / 男 67% / 1-10 万档 37.8%｜三处数据缺口如实标注（隔离 AUM / TD 资金流 / 月度 AUM 趋势）｜生产数仓 dw-tidb（redash ds41/ds31）盈米本体下钻 91 轮｜官方且慢蓝 #1B88EE × 9 个 ECharts｜CLAIR 可视化 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "养老", "个人养老金", "TD", "QMP", "颐养天年", "用户增长", "AUM", "用户画像", "数据分析", "盈米本体", "ECharts", "且慢蓝", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-multi-account-performance-2026-08-19",
      groupId: "reporting",
      title: "且慢多账户用户｜账户越多，在场更久、赚得更多，也扛着更大的波动",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-multi-account-performance-2026-08-19/",
      preview: "qieman-multi-account-performance-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T12:30:00.000+08:00",
      source: "且慢用户按投资账户（UMA）数量分组对比｜202608 快照在管用户 288,460 人：1 组 190,153 / 2 组 45,093 / 3+ 组 53,214｜投资收益率、最大回撤、年化波动率、持有时长、盈利用户占比五指标单调走高｜观察性分组，仅证明相关关系｜盈米本体 73 轮下钻，redash/TiDB asset4 月度表｜CLAIR 可视化 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "多账户", "UMA", "投资收益", "最大回撤", "波动率", "持有时长", "盈利占比", "用户分层", "数据分析", "本体", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-selffund-vs-advisor-ca-2026-08-19",
      groupId: "xiaogu",
      title: "且慢用户｜自助基金交易 CA vs 投顾策略 CA 表现对比",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-selffund-vs-advisor-ca-2026-08-19/",
      preview: "qieman-selffund-vs-advisor-ca-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T11:20:00.000+08:00",
      source: "且慢自助基金交易 CA（po_code∈FUND/QS_FUND，6.4万CA/29.1亿AUM）vs 投顾策略 CA（78.3万CA/331.8亿AUM）五维对比｜累计MWR 12.47% vs 19.93%、近一年TWR 6.30% vs 2.11%、年化波动 11.46% vs 9.28%、最大回撤 8.60% vs 7.71%（峰谷同源 01-29→03-23）、持有时长≈817天持平、盈利占比 70.12% vs 81.93%｜近一年241交易日净值/日收益率全序列｜快照 2026-08-17｜生产数仓 dw-tidb（redash ds41）｜盈米本体 42 轮下钻｜且慢蓝 ECharts 可视化｜CLAIR 单页 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "自助交易", "投顾策略", "CA", "投资收益", "最大回撤", "波动率", "持有时长", "盈利占比", "净值曲线", "数据分析", "盈米本体", "ECharts", "且慢蓝", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-vip-fee-service-results-2026-08-19",
      groupId: "xiaogu",
      title: "且慢高客｜VIP 收费服务上线至今成果分析",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-vip-fee-service-results-2026-08-19/",
      preview: "qieman-vip-fee-service-results-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T10:40:00.000+08:00",
      source: "高客 VIP 收费服务成果分析｜2025-11-19 上线至 2026-08-19｜累计 16 户 / 36 笔有效订单 / 收入 9.33 万（v4 年费占 68.6%）｜10 户可关联 AUM 合计 2020 万、户均 202 万、中位数 100 万（v1 分→元换算错 100 倍已修正；含 1 疑似测试户）｜新增 16 户客户清单（注册/绑卡/首投/最高规模/付费日期/存量/风险等级）｜年费 17 单均在服务期（最早 2026-11 到期）、次费复购活跃｜服务履约数据缺口（member_service_records 空表）｜生产数仓 dw-tidb（redash ds41）｜用户脱敏 U01~U16｜盈米本体分析 × 7 个 ECharts 图表｜CLAIR 可视化 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "高客", "VIP", "收费服务", "付费会员", "收入", "AUM", "续费", "复购", "数据分析", "盈米本体", "ECharts", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-goal-account-value-chart-2026-08-19",
      groupId: "xiaogu",
      title: "且慢目标投顾｜目标的复利（图表版）",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-goal-account-value-chart-2026-08-19/",
      preview: "qieman-goal-account-value-chart-2026-08-19.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-19T10:40:00.000+08:00",
      source: "且慢目标账户长期价值单页图表｜基准日 2024-06-28，活跃持仓用户 263,485 人｜有目标账户 61,056 人、无目标账户 202,429 人｜留存衰减曲线（12 月 +10.6pp、24 月 +15.6pp）、复投率哑铃图、平均在管天数哑铃图、人群构成条｜含全量数据表与口径说明｜观察性分组，仅证明相关关系｜CLAIR 可视化 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "目标账户", "目标投顾", "用户价值", "留存", "复投", "在管时长", "数据可视化", "图表", "数据分析", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-goal-account-user-value-2026-08-18",
      groupId: "xiaogu",
      title: "且慢目标投顾｜有目标，更容易长期在场",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-goal-account-user-value-2026-08-18/",
      preview: "qieman-goal-account-user-value-2026-08-18.png",
      pinned: true,
      position: 0,
      createdAt: "2026-08-18T23:56:33.000+08:00",
      source: "且慢目标账户用户价值数据分析｜基准日 2024-06-28，活跃持仓用户 263,485 人｜有目标账户 61,056 人、无目标账户 202,429 人｜复投率、平均在管天数及 12/24 月留存对比｜观察性分组，仅证明相关关系，不代表净因果效应｜CLAIR 可视化 HTML",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "目标账户", "目标投顾", "用户价值", "复投", "留存", "在管时长", "数据分析", "证据边界", "CLAIR", "HTML", "生产"],
    },
    {
      id: "yingmi-ai-financial-innovation-public-overview-2026-08-17",
      groupId: "reporting",
      title: "盈米 AI 金融创新与生态合作｜公开信息索引",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-financial-innovation-public-overview-2026-08-17/",
      preview: "yingmi-ai-financial-innovation-public-overview-2026-08-17.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-17T12:00:00.000+08:00",
      source: "盈米基金官网 × 阿里云开发者社区 × 千问开放平台公开报道 × 广州 AI 投顾十条 × 金融产品网络营销及基金销售规则｜公开脱敏索引：不含监管沟通正文、内部运行数据、账户画像、联调截图、代码缺陷或证据附件｜不构成产品推荐、业务许可或监管认可",
      access: "production",
      workType: "reporting",
      tags: ["盈米基金", "AI 金融创新", "AI 小顾", "MCP", "Skills", "Agent", "A2A", "千问", "生态合作", "审慎治理", "公开信息", "CLAIR", "HTML", "公开脱敏", "生产"],
    },
    {
      id: "oap-qieman-user-dashboard",
      groupId: "reporting",
      title: "OAP 用户画像 × 且慢持仓与行为看板",
      url: "https://clairku.github.io/clair-ai-studio/reports/oap-qieman-user-dashboard/",
      preview: "oap-qieman-user-dashboard.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-17T11:12:46.000+08:00",
      source: "盈米本体 × 生产数仓只读聚合｜批准、历史调用、近 30 日活跃三组用户联动｜且慢新注册、资产入账代理、账户持仓、资产结构、近 90 日行为与低覆盖画像｜数据截止与资金口径以页内为准｜支持 Clair Mac 本机一键更新｜公开脱敏聚合，不含用户明细与数据库凭证",
      access: "production",
      workType: "data-analysis",
      tags: ["OAP", "且慢", "新注册用户", "资产入账代理", "增长分析", "用户画像", "用户行为", "用户持仓", "AUM", "活跃用户", "交易行为", "数据分析", "数据看板", "本体", "一键更新", "证据边界", "公开脱敏", "HTML", "生产"],
    },
    {
      id: "qianwen-user-acquisition-dashboard",
      groupId: "xiaogu",
      title: "千问 X 且慢AI小顾｜用户数据看板",
      url: "https://clairku.github.io/clair-ai-studio/reports/qianwen-user-acquisition-dashboard/",
      preview: "qianwen-user-acquisition-dashboard.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-17T10:38:15.000+08:00",
      source: "盈米本体 × 生产数据库｜数据截至 2026-08-19 09:46（北京时间）｜新老口径按每个用户绑定当刻是否新注册判定：累计绑定用户 1,639，其中绑定时新注册 1,245、绑定时已有账户 394｜统计窗口往前延长一周至 8 月 3 日，含正式上线前灰度绑定 383（新 335 / 老 48）｜「在且慢的经营情况与用户画像」：保有规模 5,480 万元（179 人）、绑定后入金 180.9 万元（116 人）、绑定后买入 61.5 万元（77 人 / 289 笔）、公众号绑定 236 人，并含年龄、性别、居住地分布｜走势图为累计与每日新增上下分栏、默认显示各项最新累计值，划到某一天即读该日数值｜20 人以下分组隐藏，不含用户明细、单用户金额或原始对话",
      access: "production",
      workType: "data-analysis",
      tags: ["千问", "且慢", "AI 小顾", "千问引流", "用户增长", "用户画像", "用户行为", "新用户", "老用户", "用户资产", "保有规模", "入金", "交易", "首次投资", "投资行为", "年龄分布", "性别分布", "居住地", "微信公众号", "小顾使用", "每日增量", "交互分析", "数据明细", "数据看板", "本体", "生产数据", "HTML", "生产"],
    },
    {
      id: "qieman-ai-growth-oap-integrated-2026-08-14",
      groupId: "reporting",
      title: "AI时代，且慢如何存在与增长｜小顾 × OAP 完整证据版",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-ai-growth-oap-integrated-2026-08-14/",
      preview: "qieman-ai-growth-oap-integrated-2026-08-14.png",
      pinned: true,
      position: 0,
      createdAt: "2026-08-14T03:18:00.000+08:00",
      source: "且慢 AI 增长报告 × 盈米 AI 开放平台生产报告 × CAP × 外部平台与监管一手资料｜42 屏完整证据：投顾信任内核—App / Agent 双端角色—小顾真实任务与生产实测—OAP 能力治理—AI 实验室—外部分发—可归因任务飞轮—指标树与 90 天行动｜公开脱敏交互式 HTML；事实、推断、缺失与目标态分开",
      access: "production",
      workType: "reporting",
      tags: ["且慢", "AI 时代", "存在形态", "投顾服务网络", "AI 小顾", "AI 开放平台", "OAP", "MCP", "Skills", "Agent", "AI 实验室", "机构服务", "增长", "管理汇报", "证据治理", "CLAIR", "HTML", "公开脱敏", "生产"],
    },
    {
      id: "yingmi-ai-oap-growth-showcase-2026-08-14",
      groupId: "reporting",
      title: "且慢 AI 产品实践｜服务做深，能力破圈",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-oap-growth-showcase-2026-08-14/",
      preview: "yingmi-ai-oap-growth-showcase-2026-08-14.png",
      pinned: true,
      position: 0,
      createdAt: "2026-08-14T02:55:00.000+08:00",
      source: "飞书《且慢AI产品实践》revision 2157 × P3 能力边界实证 × P5 脱敏完成态录频 × OAP 502 日增长图 × 千问传播去重审计｜18 屏逐章完整覆盖，含可播放 MP4｜公开脱敏版",
      access: "production",
      workType: "reporting",
      tags: ["且慢", "AI 小顾", "AI 开放平台", "OAP", "CAP", "用户增长", "微信", "千问", "完成态录频", "证据审计", "管理汇报", "CLAIR", "HTML", "脱敏", "生产"],
    },
    {
      id: "qieman-ai-growth-practice-2026-08-14",
      groupId: "ai-platform",
      title: "且慢怎么快起来、怎么破圈？｜从服务验证到增长闭环",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-ai-growth-practice-2026-08-14/",
      preview: "qieman-ai-growth-practice-2026-08-14.png",
      pinned: true,
      position: 0,
      createdAt: "2026-08-14T03:10:00.000+08:00",
      source: "飞书汇报 revision 1748 × 8·14 CAP 模式 × 8·13 小顾生产实测 × OAP 近期经营报告 × 千问传播与归因审计｜13 章单线叙事：服务价值验证—能力资产化—外部入口分发—经营闭环｜20 万 / 300 万及 95% / 80% / 40% 等冲突口径不做成果大屏｜公开脱敏交互式 HTML",
      access: "production",
      workType: "reporting",
      tags: ["且慢", "AI 小顾", "AI 开放平台", "OAP", "CAP", "增长", "服务生产", "千问", "产品实践", "管理汇报", "证据治理", "CLAIR", "HTML", "公开脱敏", "生产"],
    },
    {
      id: "qieman-cap-product-paradigm-2026-08-14",
      groupId: "product-planning",
      title: "且慢 CAP 产品模式｜从固定产品到服务生产系统",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-cap-product-paradigm-2026-08-14/",
      preview: "qieman-cap-product-paradigm-2026-08-14.png",
      pinned: true,
      position: 0,
      createdAt: "2026-08-14T00:45:00.000+08:00",
      source: "《2026且慢产品思考规划》7 页 PPTX｜逐页重构为生态拓扑、责任契约、双重不可能三角、CAP 生成引擎、九维变形、需求沙盘与 Workflow 构建器｜70%、30%、1 小时～1 天均按原稿标为目标态，不作为已达成结果｜专属可交互 HTML 报告",
      access: "production",
      workType: "product-planning",
      tags: ["且慢", "CAP", "产品模式", "产品规划", "AI 实验室", "AI 开放平台", "服务生产", "原子能力", "需求分流", "工作流", "管理汇报", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qianwen-impact-showcase-2026-08-13",
      groupId: "reporting",
      title: "盈米 × 千问｜上线传播成效与经典案例",
      url: "https://clairku.github.io/clair-ai-studio/reports/qianwen-impact-showcase-2026-08-13/",
      preview: "qianwen-impact-showcase-2026-08-13.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-13T11:05:00.000+08:00",
      source: "佳静两版媒体监测表 × 今日头条公开信息流 × 5 段用户提供录屏｜257 个独立内容、235 篇文章、22 条视频｜表内阅读 3,274,357、公开展现 448,514，阅读/展现/播放不混加｜5 个直版经典案例同时呈现、可直接播放｜公开脱敏版",
      access: "production",
      workType: "executive-report",
      tags: ["盈米基金", "且慢小顾", "阿里千问", "传播成效", "经典案例", "媒体传播", "视频案例", "曝光口径", "品牌影响力", "管理汇报", "CLAIR", "HTML", "脱敏", "生产"],
    },
    {
      id: "qieman-xiaogu-service-card-landscape-2026-08-13",
      groupId: "xiaogu",
      title: "且慢小顾全服务问题与卡片画廊｜15 问覆盖 35 卡",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-xiaogu-service-card-landscape-2026-08-13/",
      preview: "qieman-xiaogu-service-card-landscape-2026-08-13.png",
      pinned: true,
      position: 0,
      createdAt: "2026-08-13T10:48:42.000+08:00",
      modifiedAt: "2026-08-13T13:30:00.000+08:00",
      source: "且慢小顾登录态生产体验 × 前端 CARD_REGISTRY 核验｜15 个核心问题覆盖 35 个注册组件，20 个快捷服务与 15 张生产效果截图集中展示｜23 个真实独立落卡、5 个降级呈现、7 个未独立落卡｜公开基金/市场原图；账户收益与定制方案脱敏",
      access: "production",
      workType: "competitive-research",
      tags: ["且慢", "AI 小顾", "服务卡片", "生产体验", "问题集", "截图画廊", "组件清单", "场景测试", "账户服务", "基金研究", "产品评测", "CLAIR", "HTML", "脱敏", "生产"],
    },
    {
      id: "yingmi-qianwen-launch-media-monitor-2026-08-12",
      groupId: "reporting",
      title: "盈米 × 千问上线事件｜准确口径与正文去重",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-qianwen-launch-media-monitor-2026-08-12/",
      preview: "yingmi-qianwen-launch-media-monitor-2026-08-12.png",
      pinned: true,
      position: 0,
      createdAt: "2026-08-12T16:20:00.000+08:00",
      modifiedAt: "2026-08-13T09:10:00.000+08:00",
      source: "佳静去重版 296 条为内容母表，不去重版 1,478 条用于追溯｜规范标题后以导出正文强一致证据合并同稿，最终 257 个独立内容：235 篇文章、22 条视频｜佳静表内阅读量 3,274,357（2026-08-12 快照）｜公开阅读更新 0 条；今日头条两条公开展现合计 448,514，阅读/展现/播放不混加｜11 个表内阅读破万内容全部可点击｜动态汇总、筛选搜索排序、重复合并审计与 CSV 导出｜公开脱敏版",
      access: "production",
      workType: "data-analysis",
      tags: ["盈米基金", "且慢小顾", "阿里千问", "舆情分析", "传播分析", "正文去重", "准确口径", "阅读与展现", "破万链接", "视频传播", "企微补充", "数据看板", "筛选汇总", "CLAIR", "HTML", "脱敏", "生产"],
    },
    {
      id: "fund-benchmark-display-audit-2026-08-12",
      groupId: "product-planning",
      title: "基金业绩比较基准同步展示｜监管、盈米与平台实测",
      url: "https://clairku.github.io/clair-ai-studio/reports/fund-benchmark-display-audit-2026-08-12/",
      preview: "fund-benchmark-display-audit-2026-08-12.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-12T18:00:00.000+08:00",
      source: "证监会第 3 号公告 × 基金业协会操作细则 × 内部受限项目台账 × 且慢/天天/好买/雪球 005827 网页实测｜公开脱敏版",
      access: "production",
      workType: "competitive-research",
      tags: ["且慢", "业绩比较基准", "合规", "竞品调研", "需求评审", "证据审计", "CLAIR", "HTML", "脱敏", "生产"],
    },
    {
      id: "oap-tool-governance-audit-2026-08-11",
      groupId: "ai-platform",
      title: "OAP 工具全量审计｜官网 69 项 vs 官方空间 174 条",
      url: "https://clairku.github.io/clair-ai-studio/reports/oap-tool-governance-audit-2026-08-11/",
      preview: "oap-tool-governance-audit-2026-08-11.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-12T10:04:27.000+08:00",
      source: "OAP 官网 × 官方空间 Dashboard × 服务分组 × 发布审核 × 审计日志｜公开脱敏版：69/174 口径、逐项映射、重复、分类漂移、历史与治理",
      access: "production",
      workType: "governance-review",
      tags: ["OAP", "MCP", "工具治理", "数据口径", "重复审计", "发布治理", "HTML", "脱敏", "生产"],
    },
    {
      id: "product-demand-pulse-2026-08-11",
      groupId: "product-planning",
      title: "痛点消消乐｜产品共创作战台",
      url: "https://clairku.github.io/clair-ai-studio/reports/product-demand-pulse/",
      preview: "product-demand-pulse-2026-08-11.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-11T19:20:00.000+08:00",
      source: "产品共创作战台｜4 个已提交，4 个已上线，2 位 PM 跑通端到端；支持新增待处理需求、PM 指派、四象限与增量更新包",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "产品团队", "本体", "用户痛点", "需求共创", "端到端", "需求地图", "HTML", "脱敏", "生产"],
    },
    {
      id: "qieman-mcp-account-username-bug-2026-08-11",
      groupId: "ai-platform",
      title: "且慢 MCP 个人中心用户名异常｜BUG 与修复前置准备",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-mcp-account-username-bug-2026-08-11/",
      preview: "qieman-mcp-account-username-bug-2026-08-11.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-11T15:55:00.000+08:00",
      source: "实践文档 × 线上复现 × 当前主干 × 本体生产聚合｜4 位用户、0.043%；脱敏公开版不含 PII、API Key、生产明细或更新语句",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "MCP", "BUG", "STARGATE", "本体", "根因分析", "数据质量", "修复准备", "HTML", "脱敏", "生产"],
    },
    {
      id: "ai-trading-capability-plan-2026-08-11",
      groupId: "xiaogu",
      title: "AI 交易能力规划｜从五条任务收口为一条服务闭环",
      url: "https://clairku.github.io/clair-ai-studio/reports/ai-trading-capability-plan-2026-08-11/",
      preview: "ai-trading-capability-plan-2026-08-11.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-11T11:17:00.000+08:00",
      source: "5 张内部协同截图 × 内容生产工作包 Wiki revision 258｜脱敏公开版：P0 沙箱纵切、P1 三个支撑样板、P2 服务入口扩展",
      access: "production",
      workType: "product-planning",
      tags: ["且慢", "AI 小顾", "投顾服务", "AI 交易", "产品规划", "市场温度", "Skills", "工具治理", "CLAIR", "HTML", "脱敏", "生产"],
    },
    {
      id: "auto-follow-requirement-review-2026-08-10",
      groupId: "product-planning",
      title: "长赢自动跟车即时提醒｜需求评审",
      url: "https://clairku.github.io/clair-ai-studio/reports/auto-follow-requirement-review-2026-08-10/",
      preview: "auto-follow-requirement-review-2026-08-10.png",
      pinned: true,
      position: 0,
      createdAt: "2026-08-10T14:12:00.000+08:00",
      source: "GitLab e10f400 × Figma 自动跟车优化｜交易状态、自动/手动防重、跨 15:00 交易日一致性、验收与根因治理",
      access: "production",
      workType: "requirement-review",
      tags: ["且慢", "长赢", "需求评审", "自动跟车", "交易安全", "Figma", "CLAIR", "HTML", "生产"],
    },
    {
      id: "individual-finance-agent-evaluation-2026-08-10",
      groupId: "ai-platform",
      title: "个人理财 Agent 候选作品｜全场景能力测评",
      url: "https://clairku.github.io/clair-ai-studio/reports/individual-finance-agent-evaluation-2026-08-10/",
      preview: "individual-finance-agent-evaluation-2026-08-10.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-10T13:30:00.000+08:00",
      source: "公开仓库 master@7f117a1｜构建、562 条单测、52 条 E2E、9 类场景、3 基金问答矩阵、桌面/390px 与安全审计",
      access: "production",
      workType: "data-analysis",
      tags: ["Agents", "候选人评测", "金融 Agent", "数据分析", "安全审查", "响应式", "HTML", "生产"],
    },
    {
      id: "yingmi-skill-stability-eval-2026-08-09",
      groupId: "ai-platform",
      title: "yingmi-skill 三轮稳定性评测｜真实波动与测试误报",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-skill-stability-eval-2026-08-09/",
      preview: "yingmi-skill-stability-eval-2026-08-09.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-09T20:00:00.000+08:00",
      source: "skill-upper 0.7.0 × yingmi-skill 0.1.5｜4 个核心用例 × 3 次独立运行｜公开页仅保留脱敏结果与治理建议",
      access: "production",
      workType: "data-analysis",
      tags: ["AI 开放平台", "Skills", "yingmi-skill", "稳定性评测", "MCP", "数据分析", "HTML", "脱敏", "生产"],
    },
    {
      id: "skill-governance-audit-2026-08-09",
      groupId: "knowledge",
      title: "Skill 全量治理审计｜重复、失效、风险与可删减清单",
      url: "https://clairku.github.io/clair-ai-studio/reports/skill-governance-audit-2026-08-09/",
      preview: "skill-governance-audit-2026-08-09.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-09T19:28:00.000+08:00",
      source: "248 个 Skill 目录实时盘点｜公开页仅保留数量、方法与治理结论；完整名称、路径、逐项判断和 CSV 仅本地保存",
      access: "production",
      workType: "governance-review",
      tags: ["Skill 治理", "知识治理", "安全审查", "重复清理", "Codex", "HTML", "脱敏", "生产"],
    },
    {
      id: "obsidian-agent-stack-install-2026-08-09",
      groupId: "knowledge",
      title: "Obsidian × Agent 本地知识栈｜安装与安全验证",
      url: "https://clairku.github.io/clair-ai-studio/reports/obsidian-agent-stack-install-2026-08-09/",
      preview: "obsidian-agent-stack-install-2026-08-09.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-09T18:50:00.000+08:00",
      source: "9 个公共仓库 × 69 个 Skills × ctx 本地索引 × 4 个 Obsidian 插件｜分层安装、真实运行验证与自动写入门禁",
      access: "production",
      workType: "governance-review",
      tags: ["Obsidian", "Agent Skills", "Codex", "知识治理", "本地优先", "安全审查", "HTML", "生产"],
    },
    {
      id: "third-party-platform-regulatory-filing-2026-08-08",
      groupId: "knowledge",
      title: "第三方平台合作监管报送｜受控材料索引",
      url: "https://clairku.github.io/clair-ai-studio/reports/third-party-platform-regulatory-filing-2026-08-08/",
      preview: "third-party-platform-regulatory-filing-2026-08-08.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-08T23:20:00.000+08:00",
      source: "内部监管报送准备｜公开页仅保留脱敏索引，不存储申请正文、业务流程、系统边界、测试截图或个人信息",
      access: "production",
      workType: "governance-review",
      tags: ["知识治理", "治理审查", "监管报备", "第三方平台", "HTML", "生产"],
    },
    {
      id: "qieman-advisor-service-redesign-2026-08-07",
      groupId: "xiaogu",
      title: "且慢投顾全生命周期盘点与重构｜从页面经营到个人投资服务",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-advisor-service-redesign-2026-08-07/",
      preview: "qieman-advisor-service-redesign-2026-08-07.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-07T18:20:00.000+08:00",
      source: "全量页面 × 2026月度趋势 × 资金归因审计｜规划默认、定制优先、主动编排、自助筛选与用户组件自定义",
      access: "production",
      workType: "product-planning",
      tags: ["且慢", "投顾服务", "AI 小顾", "产品规划", "数据分析", "本体", "概念原型", "HTML", "生产"],
    },
    {
      id: "qieman-advisor-page-redesign-2026-08-07",
      groupId: "product-planning",
      title: "且慢投顾页｜本体盘点与新版设计方案",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-advisor-page-redesign-2026-08-07/",
      preview: "qieman-advisor-page-redesign-2026-08-07.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-07T10:00:00.000Z",
      source: "投顾页 × 投资工具 × 策略营销 × AI 小顾｜本体实测 + 埋点转化 + 十年迭代史 → 五问题诊断 · 五条洞察 · 小顾驱动的七层新版蓝图与组件化路线",
      access: "production",
      workType: "product-planning",
      tags: ["且慢", "投顾服务", "产品规划", "AI 小顾", "投顾页改版", "使用转化", "配置地图", "服务组件", "CLAIR", "HTML", "生产"],
    },
    {
      id: "clair-product-design-reviewer-2026-08-06",
      groupId: "ai-workbench",
      title: "Clair Review OS｜产品与设计智能评审器",
      url: "https://clairku.github.io/clair-ai-studio/reports/clair-product-design-reviewer-2026-08-06/",
      preview: "clair-product-design-reviewer-2026-08-06.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-06T16:30:00.000Z",
      source: "高级产品原则 × 且慢业务红线 × Clair 个人规则 × 正反边界案例｜原文定位、PM 版复制、案例学习与受控进化",
      access: "production",
      workType: "requirement-review",
      tags: ["AI 工作台", "需求评审", "产品设计", "案例库", "受控进化", "且慢", "Skills", "HTML", "生产"],
    },
    {
      id: "gpt-codex-plan-analysis-2026-08-04",
      groupId: "ai-workbench",
      title: "GPT / Codex 使用分析与方案建议",
      url: "https://clairku.github.io/clair-ai-studio/reports/gpt-codex-plan-analysis-2026-08-04/",
      preview: "gpt-codex-plan-analysis-2026-08-04.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-04T09:25:00.000Z",
      source: "近两个月本地 Codex Token 结构 × 官方套餐与费率核验 × 模型路由建议｜公开直达",
      access: "production",
      workType: "data-analysis",
      tags: ["个人", "Codex", "GPT", "Token", "数据分析", "模型路由", "套餐建议", "公开", "CLAIR", "HTML", "生产"],
    },
    {
      id: "yingmi-oap-report-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜8·3 项目汇报（增长可视化内嵌版）",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-oap-report-2026-08-03/",
      preview: "yingmi-oap-report-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-03T22:30:00.000Z",
      source: "飞书十项框架 × Clair 视觉模版｜用户增长章节内嵌 OAP 历程·里程碑与增长走势交互图（oap-journey-metrics-2026-08-02）",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "项目汇报", "飞书框架", "用户增长", "微信", "千问", "AI 实验室", "商化准备", "HTML", "生产"],
    },
    {
      id: "oap-executive-report-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜8·3 项目汇报（Executive 视觉版）",
      url: "https://clairku.github.io/clair-ai-studio/reports/oap-executive-report-2026-08-03/",
      preview: "oap-executive-report-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-03T20:00:00.000Z",
      source: "飞书 revision 30 十项框架｜OKR 复算 · 微信千问双入口 · 九平台三层货架 · AI 实验室 · 商化闭环",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "项目汇报", "OKR 复算", "微信", "千问", "AI 实验室", "商业化", "HTML", "生产"],
    },
    {
      id: "oap-project-report-feishu-framework-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜8·3 汇报（十项框架）",
      url: "https://clairku.github.io/clair-ai-studio/reports/oap-project-report-feishu-framework-2026-08-03/",
      preview: "oap-project-report-feishu-framework-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-03T19:45:00.000Z",
      source: "飞书 v2 revision 66 十项大纲｜用户增长可视化已纳入 · 四类机构榜单 · OKR 复算 · 千问微信双入口 · 公开直达",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "项目汇报", "OKR 复算", "千问", "微信", "货架矩阵", "AI 实验室", "公开", "HTML", "生产"],
    },
    {
      id: "yingmi-ai-oap-h2-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜2026 H2 项目汇报",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-oap-h2-2026-08-03/",
      preview: "yingmi-ai-oap-h2-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-03T19:00:00.000Z",
      source: "飞书文档五条主线｜项目进展 × 产品规划 × 商化准备 × 往外看 × 向内看 → OAP 商业闭环",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "MCP", "Skills", "Agent", "千问", "商化准备", "竞品分析", "HTML", "生产"],
    },
    {
      id: "yingmi-ai-open-platform-progress-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台项目汇报",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-open-platform-progress-2026-08-03/",
      preview: "yingmi-ai-oap-framework-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-03T18:00:00.000Z",
      source: "飞书文档｜平台架构、业务规模与商业化进展全景视图",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "MCP", "Skills", "Agent", "商业化", "项目汇报", "HTML", "生产"],
    },
    {
      id: "oap-project-review-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜8·3 项目汇报（证据版）",
      url: "https://clairku.github.io/clair-ai-studio/reports/oap-project-review-2026-08-03/",
      preview: "oap-project-review-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-02T19:30:00.000Z",
      source: "指定飞书 Wiki revision 30｜OKR 数据 × 用户增长可视化 × 微信/千问双入口 × 渠道矩阵 × 能力治理 × AI 实验室 × 商化，15 章节 13 张原图证据",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "项目汇报", "OKR", "微信", "千问", "AI 实验室", "商化准备", "HTML", "生产"],
    },
    {
      id: "yingmi-oap-project-briefing-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜8·3 项目汇报（框架全景）",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-oap-project-briefing-2026-08-03/",
      preview: "yingmi-oap-project-briefing-2026-08-03.svg",
      pinned: false,
      createdAt: "2026-08-02T19:15:00.000Z",
      source: "飞书源稿十项框架（revision 1934）｜OKR → 关键举措 → 里程碑 → 微信/千问 → 渠道矩阵 → 能力体系 → 系统建设 → AI 实验室 → 商化 → 行业 → 问题回顾",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "项目汇报", "飞书框架", "微信", "千问", "渠道矩阵", "AI 实验室", "HTML", "生产"],
    },
    {
      id: "oap-report-collaboration-retrospective-2026-08-04",
      groupId: "ai-platform",
      title: "一次报告，如何变成一套系统｜OAP 协作复盘",
      url: "https://clairku.github.io/clair-ai-studio/reports/oap-report-collaboration-retrospective-2026-08-04/",
      preview: "oap-report-collaboration-retrospective-2026-08-04.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-04T11:30:00.000Z",
      source: "2026-08-02—03 OAP 报告任务｜证据审计 × 管理叙事 × 多版本收敛 × CLAIR 生产发布",
      access: "production",
      workType: "reporting",
      tags: ["项目复盘", "AI 开放平台", "OAP", "报告方法", "协作", "证据治理", "版本管理", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-ai-practice-sharing-2026-08-13",
      groupId: "ai-platform",
      title: "且慢 AI 产品实践｜小顾验证服务 × 开放平台重构增长",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-ai-practice-sharing-2026-08-13/",
      preview: "qieman-ai-practice-sharing-2026-08-13.png",
      pinned: true,
      position: 0,
      createdAt: "2026-08-13T12:00:00.000+08:00",
      source: "完整实践报告｜战略问题—小顾价值验证—三支清晰产品演示—三次走出—能力与系统关系—微信/千问超级入口—五支传播案例—502 日 OAP 交互增长—NEXT",
      access: "production",
      workType: "reporting",
      tags: ["且慢", "AI 小顾", "AI 开放平台", "OAP", "千问", "微信", "增长", "产品实践", "案例视频", "CLAIR", "HTML", "生产"],
    },
    {
      id: "xiaogu-oap-practice-results-2026-08-10",
      groupId: "ai-platform",
      title: "且慢 AI 小顾 × 盈米 AI 开放平台｜产品实践与成效（中层汇报）",
      url: "https://clairku.github.io/clair-ai-studio/reports/xiaogu-oap-practice-results-2026-08-10/",
      preview: "xiaogu-oap-practice-results-2026-08-10.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-10T14:30:00.000Z",
      source: "小顾八条经验 × OAP 8·3 框架版 × 8·10 最新数据｜月活 2,155 超年度目标 · 申请 9,520 · 调用 935 万 · 内嵌四指标增长交互图",
      access: "production",
      workType: "reporting",
      tags: ["AI 小顾", "AI 开放平台", "OAP", "中层汇报", "产品实践", "成效", "微信", "千问", "行业认可", "用户增长", "CLAIR", "HTML", "生产"],
    },
    {
      id: "qieman-ai-product-practice-oap-edition-2026-08-04",
      groupId: "ai-platform",
      title: "盈米 AI 产品实践｜OAP 模版重制版",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-ai-product-practice-oap-edition-2026-08-04/",
      preview: "qieman-ai-product-practice-oap-edition-2026-08-04.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-04T13:30:00.000Z",
      source: "原《盈米 AI 产品实践》完整内容｜套用 OAP 22 屏框架、视觉系统与交互｜新增独立报告",
      access: "production",
      workType: "reporting",
      tags: ["盈米 AI", "且慢产品", "OAP 模版", "金融服务操作系统", "AI 小顾", "投顾工作台", "微信", "千问", "CLAIR", "HTML", "生产"],
    },
    {
      id: "yingmi-ai-oap-outline-concepts-2026-08-04",
      groupId: "ai-platform",
      title: "OAP 报告大纲页｜三版设计预览",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-oap-outline-concepts-2026-08-04/",
      preview: "yingmi-ai-oap-outline-concepts-2026-08-04.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-04T07:10:00.000Z",
      source: "盈米 AI OAP 28 屏正式报告｜管理层决策地图 × 增长叙事路线 × 平台系统全景",
      access: "production",
      workType: "product-planning",
      tags: ["AI 开放平台", "OAP", "报告大纲", "管理汇报", "信息架构", "视觉设计", "CLAIR", "HTML", "生产"],
    },
    {
      id: "yingmi-ai-oap-framework-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜把能力做成增长",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-oap-framework-2026-08-03/",
      preview: "yingmi-ai-oap-framework-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-03T02:55:00.000Z",
      source: "飞书文档 revision 1978｜真实增长图 × 微信/千问场景 × 五层能力生产线 × AI 实验室用户共创 × 商化收费路由 × 机构使用 × MCP TOP20",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "项目汇报", "微信", "千问", "能力生产线", "AI 实验室", "用户共创", "商化收费", "企业年包", "按量预付", "机构使用", "MCP TOP20", "HTML", "生产"],
    },
    {
      id: "qieman-mcp-top20-2026-08-03",
      groupId: "ai-platform",
      title: "MCP 全量调用 TOP20｜69 项接口审计",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-mcp-top20-2026-08-03/",
      preview: "qieman-mcp-top20-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-03T05:00:00.000Z",
      source: "盈米 MCP 接口市场 7 页 69 项全量审计｜剔除时间查询后的业务 TOP20、集中度与类别结构",
      access: "production",
      workType: "data-analysis",
      tags: ["AI 开放平台", "OAP", "MCP", "数据分析", "调用统计", "且慢", "HTML", "生产"],
    },
    {
      id: "yingmi-ai-bottom-up-architecture-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI｜双关系图视觉重绘",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-bottom-up-architecture-2026-08-03/",
      preview: "yingmi-ai-bottom-up-architecture-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-03T10:30:00.000Z",
      source: "服务关系图 × 系统关系图｜原图内容与关系不变 · CLAIR 紫色系宋体重绘",
      access: "production",
      workType: "product-planning",
      tags: ["AI 开放平台", "OAP", "AI 实验室", "AI 工作台", "Stargate", "产品规划", "经营汇报", "HTML", "生产"],
    },
    {
      id: "yingmi-ai-brand-building-effects-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI｜品牌建设与效果",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-brand-building-effects-2026-08-03/",
      preview: "yingmi-ai-brand-building-effects-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-03T02:00:00.000Z",
      source: "MCP 首发 → 分层内容 → 生态共建 → 行业标准｜品牌效果与经营闭环",
      access: "production",
      workType: "reporting",
      tags: ["盈米 AI", "品牌建设", "MCP", "传播复盘", "生态合作", "经营汇报", "HTML", "生产"],
    },
    {
      id: "yingmi-ai-two-modes-four-continuous-2026-08-02",
      groupId: "ai-platform",
      title: "盈米 AI｜持续引擎与势能放大",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-two-modes-four-continuous-2026-08-02/",
      preview: "yingmi-ai-two-modes-four-continuous-2026-08-02.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-02T14:30:00.000Z",
      source: "一张总图｜四个持续核心引擎 → 开放平台 → 两种接入模式 → 更多群体与势能",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "MCP", "Skills", "Agent", "经营汇报", "渠道布局", "HTML", "生产"],
    },
    {
      id: "clair-executive-visual-report-template-2026-08-02",
      groupId: "ai-workbench",
      title: "Clair 专用报告模板 2.1",
      url: "https://clairku.github.io/clair-ai-studio/reports/clair-executive-visual-report-template-2026-08-02/",
      preview: "clair-executive-visual-report-template-2026-08-02.png",
      pinned: true,
      position: 0,
      createdAt: "2026-08-02T15:30:00.000Z",
      source: "Clair Editorial System 2.1｜OAP 同款封面封底 × 统一标题基线 × 报告大纲 × 九类模块 × 双端校验",
      access: "production",
      workType: "reporting",
      tags: ["AI 工作台", "Skills", "专用模板", "经营汇报", "设计系统", "HTML", "生产"],
    },
    {
      id: "yingmi-ai-communications-evidence-report-2026-07-31",
      groupId: "ai-platform",
      title: "盈米 AI｜阶段成果与三路布局",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-communications-evidence-report-2026-07-31/",
      preview: "yingmi-ai-stage-summary-2026-08-02.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-07-31T08:30:00.000Z",
      source: "目标完成 × 三路分发 × 机构使用 × 商业验证 × 品牌影响力",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "MCP", "Skills", "Agents", "经营汇报", "渠道布局", "HTML", "生产"],
    },
    {
      id: "oap-project-report-2026-08-03",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台项目汇报｜从势能走向经营闭环",
      url: "https://clairku.github.io/clair-ai-studio/reports/oap-project-report-2026-08-03/",
      preview: "oap-project-report-2026-08-03.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-02T16:30:00.000Z",
      source: "飞书 P1—P15｜项目进展、双模式四持续、新流量、三层能力、治理、商化与 90 天行动",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "MCP", "Skills", "Agent", "商业化", "老板汇报", "HTML", "生产"],
    },
    {
      id: "stargate-financial-institutions-2026-08-02",
      groupId: "ai-platform",
      title: "Stargate 金融机构使用统计｜488 家接入、需求聚焦基金 AI 投研",
      url: "https://clairku.github.io/clair-ai-studio/reports/stargate-financial-institutions-2026-08-02/",
      preview: "stargate-financial-institutions-2026-08-02.svg",
      pinned: false,
      position: 1,
      createdAt: "2026-08-02T14:30:00.000Z",
      source: "生产数仓实查（ying99_oap）｜剔除盈米口径、类型 TOP10、需求场景与重点机构",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "OAP", "Stargate", "金融机构", "数据报告", "CLAIR", "公开", "HTML", "生产"],
    },
    {
      id: "ai-h1-review-h2-okr-2026",
      groupId: "ai-platform",
      title: "AI 产品上半年复盘｜下半年 OKR",
      url: "https://clairku.github.io/clair-ai-studio/reports/ai-h1-review-h2-okr-2026/",
      preview: "ai-h1-review-h2-okr-2026.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-02T09:55:00.000Z",
      source: "飞书源文档｜挑战、规模证据、千问/微信、小顾、顾问提效、开放生态与组织转型",
      access: "production",
      workType: "reporting",
      tags: ["AI 开放平台", "AI 小顾", "顾问工作台", "OKR", "经营汇报", "产品规划", "HTML", "生产"],
    },
    {
      id: "qieman-return-rate-incident-review-2026-08-04",
      groupId: "product-planning",
      title: "且慢累计收益率异常｜口径、边界与修复决策",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-return-rate-incident-review-2026-08-04/",
      preview: "qieman-return-rate-incident-review-2026-08-04.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-08-04T14:30:00.000Z",
      source: "QMRD-46867｜三页面同一收益额对应三种收益率；证据审计、算法有效域、指标治理与 PM 决策，公开直达",
      access: "production",
      workType: "data-analysis",
      tags: ["且慢", "累计收益率", "数据分析", "产品规划", "需求评审", "Modified Dietz", "TWR", "口径治理", "公开", "HTML", "生产"],
    },
    {
      id: "family-asset-report-five-visual-directions-2026-07-31",
      groupId: "product-planning",
      title: "家庭资产报告｜五套全新视觉方向",
      url: "https://clairku.github.io/clair-ai-studio/reports/family-asset-report-five-visual-directions-2026-07-31/",
      preview: "family-asset-report-five-visual-directions-2026-07-31.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-07-31T14:30:00.000Z",
      source: "五套 Figma 原生视觉系统｜30 张 A4 样张与选型建议",
      access: "production",
      workType: "requirement-review",
      tags: ["且慢", "需求评审", "产品规划", "投顾服务", "HTML", "生产"],
    },
    {
      id: "family-asset-report-visual-review-2026-07-31",
      groupId: "product-planning",
      title: "家庭资产报告｜旧版视觉评审（已迭代）",
      url: "https://clairku.github.io/clair-ai-studio/reports/family-asset-report-visual-review-2026-07-31/",
      preview: "family-asset-report-visual-review-2026-07-31.svg",
      pinned: false,
      position: 0,
      createdAt: "2026-07-31T13:30:00.000Z",
      source: "旧版 Figma 视觉方案评审｜已由五套全新视觉方向替代",
      access: "production",
      workType: "requirement-review",
      tags: ["且慢", "需求评审", "产品规划", "投顾服务", "HTML", "生产"],
    },
    {
      id: "content-classification-review-sop-2026-07-30",
      groupId: "knowledge",
      title: "宣传推介材料｜内容分层标准与审核 SOP",
      url: "https://clairku.github.io/clair-ai-studio/reports/content-classification-review-sop-2026-07-30/",
      preview: "content-classification-review-sop-2026-07-30.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-07-30T10:40:00.000Z",
      source: "盈米内容治理｜两级分类、事前审核、双轨巡检与记录留痕",
      access: "production",
      workType: "governance-review",
      tags: ["知识治理", "HTML", "生产"],
    },
    {
      id: "qieman-longwin-group-page-review-2026-07-30",
      groupId: "product-planning",
      title: "长赢同路人小组详情页｜双版产品评审",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-longwin-group-page-review-2026-07-30/",
      preview: "qieman-longwin-group-page-review-2026-07-30.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-07-30T08:57:42.000Z",
      source: "左右双版视觉稿｜信息层级、加入资格、协议状态与转化闭环",
      access: "production",
      workType: "requirement-review",
      tags: ["且慢", "需求评审", "投顾服务", "产品规划", "HTML", "生产"],
    },
    {
      id: "ai-xiaogu-personal-service-demo-2026-07-30",
      groupId: "xiaogu",
      title: "AI 小顾｜个人投资服务与卡片广场 Demo",
      url: "https://clairku.github.io/clair-ai-studio/reports/ai-xiaogu-personal-service-demo-2026-07-30/",
      preview: "ai-xiaogu-personal-service-demo-2026-07-30.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-07-30T18:00:00.000Z",
      source: "AI 小顾主动服务、追问归因、账户报告与卡片市场产品原型",
      access: "production",
      workType: "product-demo",
      tags: ["AI 小顾", "投顾服务", "产品规划", "HTML", "生产"],
    },
    {
      id: "ai-service-blueprint-serif-2026-07-30",
      groupId: "reporting",
      title: "盈米 AI 服务蓝图｜统一能力底座与三端业务",
      url: "https://clairku.github.io/clair-ai-studio/reports/ai-service-blueprint-serif-2026-07-30/",
      preview: "ai-service-blueprint-serif-2026-07-30.png",
      pinned: true,
      position: 0,
      createdAt: "2026-07-30T16:30:00.000Z",
      source: "两张业务蓝图视觉稿｜统一宋体版",
      access: "production",
    },
    {
      id: "ai-xiaogu-product-experience-2026-07-30",
      groupId: "xiaogu",
      title: "且慢 AI 小顾｜八条关键产品经验",
      url: "https://clairku.github.io/clair-ai-studio/reports/ai-xiaogu-product-experience-2026-07-30/",
      preview: "ai-xiaogu-product-experience-2026-07-30.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-07-30T12:00:00.000Z",
      source: "AI 小顾产品经验总结",
      access: "production",
    },
    {
      id: "workbench-quality-audit-2026-07-30",
      groupId: "ai-workbench",
      title: "Clair's Studio｜全站质量审计与修复报告",
      url: "https://clairku.github.io/clair-ai-studio/reports/workbench-quality-audit-2026-07-30/",
      preview: "workbench-quality-audit-2026-07-30.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-07-29T18:20:00.000Z",
      source: "生产质量审计",
      access: "production",
    },
    {
      id: "yingmi-ai-materials-compendium-2026-07-30",
      groupId: "ai-platform",
      title: "盈米 AI 业务全景档案｜OAP × 小顾 × 顾问工作台",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-materials-compendium-2026-07-30/",
      pinned: true,
      position: 0,
      createdAt: "2026-07-30T06:30:00.000Z",
      source: "飞书根材料与 40 个档案节点",
      access: "production",
    },
    {
      id: "qieman-ai-product-practice-2026-07-30",
      groupId: "ai-platform",
      title: "盈米 AI 产品实践｜且慢产品团队",
      url: "https://clairku.github.io/clair-ai-studio/reports/qieman-ai-product-practice-2026-07-30/",
      preview: "qieman-ai-product-practice-2026-07-30.svg",
      pinned: true,
      position: 1,
      createdAt: "2026-07-30T10:30:00.000Z",
      source: "且慢产品团队｜业务蓝图 × 微信/千问外部入口 × 小顾全局规划 × 服务生态",
      access: "production",
    },
    {
      id: "ai-three-projects-management-deck-2026-07-30",
      groupId: "reporting",
      title: "盈米 AI 金融服务操作系统蓝图｜用 AI 重做服务生产",
      url: "https://clairku.github.io/clair-ai-studio/reports/ai-three-projects-management-deck-2026-07-30/",
      preview: "ai-three-projects-management-deck-2026-07-30.png",
      pinned: true,
      position: 0,
      createdAt: "2026-07-30T07:00:00.000Z",
      source: "飞书根材料与三个项目汇总",
      access: "production",
    },
    {
      id: "seed-mcp-benchmark",
      groupId: "ai-platform",
      title: "三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",
      url: "https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",
      pinned: true,
      position: 0,
      createdAt: "2026-07-28T10:00:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "seed-fund-report",
      groupId: "research",
      title: "东方财富妙想版｜010350 基金深度诊断",
      url: "https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",
      pinned: false,
      position: 1,
      createdAt: "2026-07-28T09:30:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "storage-big-three-fund-screening",
      groupId: "research",
      title: "存储三巨头基金筛选｜境内 QDII 与港股通",
      url: "https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",
      pinned: true,
      position: 0,
      createdAt: "2026-07-29T04:49:24.000Z",
      source: "盈米 Skills / MCP",
      access: "production",
    },
    {
      id: "seed-agreement",
      groupId: "ai-platform",
      title: "盈米 MCP 协议审查台",
      url: "https://clairku.github.io/yingmi-mcp-agreement-review/",
      pinned: true,
      position: 0,
      createdAt: "2026-07-28T08:50:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "seed-xiaogu",
      groupId: "xiaogu",
      title: "且慢小顾介绍｜AI 投资助手",
      url: "https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",
      pinned: false,
      position: 1,
      createdAt: "2026-07-27T07:40:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "seed-strategy",
      groupId: "research",
      title: "公募策略多指标双轴探索器｜四笔钱",
      url: "https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",
      pinned: false,
      position: 0,
      createdAt: "2026-07-27T07:20:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "seed-ecosystem",
      groupId: "ai-platform",
      title: "盈米 AI 实验室｜服务组件编排 Demo",
      url: "https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",
      pinned: false,
      position: 2,
      createdAt: "2026-07-26T14:40:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "qieman-library-index",
      groupId: "knowledge",
      title: "且慢产品研究页面库｜原始总入口",
      url: "https://clairku.github.io/qieman-product-research-library/",
      pinned: true,
      position: 0,
      createdAt: "2026-07-26T09:23:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-advisor-inventory",
      groupId: "product-planning",
      title: "且慢投顾模块现况盘点报告",
      url: "https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",
      pinned: false,
      position: 0,
      createdAt: "2026-07-24T09:00:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-advisor-direction-research",
      groupId: "product-planning",
      title: "且慢 APP 投顾模块｜现况盘点与改版方向",
      url: "https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",
      pinned: false,
      position: 1,
      createdAt: "2026-07-23T09:00:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-advisor-v09",
      groupId: "product-planning",
      title: "且慢投顾页改版｜方向与方案设计 V0.9",
      url: "https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",
      pinned: true,
      position: 2,
      createdAt: "2026-07-24T09:10:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-network-research",
      groupId: "product-planning",
      title: "且慢产品现况网络调研报告",
      url: "https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",
      pinned: false,
      position: 3,
      createdAt: "2026-07-24T09:20:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-advisor-final",
      groupId: "product-planning",
      title: "且慢投顾页改版｜推荐方案定稿与备选",
      url: "https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",
      pinned: false,
      position: 4,
      createdAt: "2026-07-24T09:30:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-advisor-demo",
      groupId: "product-planning",
      title: "且慢投顾页改版交互 Demo｜方案 B",
      url: "https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",
      pinned: false,
      position: 5,
      createdAt: "2026-07-24T09:40:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-advisor-plan",
      groupId: "product-planning",
      title: "且慢投顾页改版｜产品规划与计划书",
      url: "https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",
      pinned: false,
      position: 6,
      createdAt: "2026-07-24T09:50:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-home-entry-analysis",
      groupId: "xiaogu",
      title: "且慢 App 首页金刚位分析报告｜修正版",
      url: "https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",
      pinned: false,
      position: 2,
      createdAt: "2026-07-23T10:00:00.000Z",
      source: "研究库",
      access: "org",
    },
    {
      id: "qieman-advisor-click-analysis",
      groupId: "product-planning",
      title: "且慢投顾页点击与转化分析",
      url: "https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",
      pinned: false,
      position: 7,
      createdAt: "2026-07-24T10:00:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-app-map",
      groupId: "xiaogu",
      title: "且慢 APP 完整功能全景",
      url: "https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",
      pinned: false,
      position: 3,
      createdAt: "2026-07-24T10:10:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-app-deep-analysis",
      groupId: "xiaogu",
      title: "且慢 App 深度产品分析报告",
      url: "https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",
      pinned: false,
      position: 4,
      createdAt: "2026-07-24T10:20:00.000Z",
      source: "研究库",
      access: "org",
    },
    {
      id: "qieman-app-usage",
      groupId: "xiaogu",
      title: "且慢 APP 使用情况与证据",
      url: "https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",
      pinned: false,
      position: 5,
      createdAt: "2026-07-24T10:30:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-app-roadmap",
      groupId: "xiaogu",
      title: "且慢 APP 深度产品判断与路线图",
      url: "https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",
      pinned: false,
      position: 6,
      createdAt: "2026-07-24T10:40:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "qieman-ai-native",
      groupId: "xiaogu",
      title: "且慢 APP AI 原生转型三案",
      url: "https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",
      pinned: true,
      position: 7,
      createdAt: "2026-07-24T10:50:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "oap-progress-roadmap",
      groupId: "ai-platform",
      title: "OAP 进展与规划汇报",
      url: "https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",
      pinned: false,
      position: 3,
      createdAt: "2026-07-24T11:00:00.000Z",
      source: "研究库",
      access: "production",
    },
    {
      id: "oap-metrics-trend",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜上线以来运营趋势",
      url: "https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",
      pinned: true,
      position: 4,
      createdAt: "2026-07-28T10:11:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "oap-journey-metrics-2026-08-02",
      groupId: "ai-platform",
      title: "盈米 AI｜关键历程 × 用户增长",
      url: "https://clairku.github.io/qieman-product-research-library/pages/oap/oap-journey-metrics-2026-08-02.html",
      preview: "oap-journey-metrics-2026-08-02.svg",
      pinned: true,
      position: 5,
      createdAt: "2026-08-02T13:40:00.000Z",
      source: "16 个时间组 × 32 件事项 × 置顶联动 × 用户增长走势",
      access: "production",
    },
    {
      id: "oap-reporting-framework",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜阶段复盘与 2026 下半年经营计划",
      url: "https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",
      pinned: true,
      position: 6,
      createdAt: "2026-07-30T08:00:00.000Z",
      source: "OAP 管理层汇报成稿",
      access: "production",
    },
    {
      id: "oap-h2-okr-iteration-review",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜上线以来迭代复盘与下半年 OKR 汇报",
      url: "https://clairku.github.io/qieman-product-research-library/pages/oap/oap-h2-okr-iteration-review-2026-07-31.html",
      pinned: true,
      position: 7,
      createdAt: "2026-07-31T15:30:00.000Z",
      source: "OAP 管理层汇报",
      access: "production",
    },
    {
      id: "oap-traffic-analysis",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜官网统计范围与访问走势",
      url: "https://clairku.github.io/qieman-product-research-library/pages/oap/oap-site-traffic-scope-and-trend-2026-08-27/",
      preview: "oap-site-traffic-scope-and-trend-2026-08-27.png",
      pinned: true,
      position: 8,
      createdAt: "2026-08-27T10:57:00.000Z",
      source: "生产神策 · 全站口径与趋势",
      access: "production",
    },
    {
      id: "eastmoney-platform",
      groupId: "ai-platform",
      title: "东方财富 AI Skills 平台深度竞品分析",
      url: "https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",
      pinned: false,
      position: 9,
      createdAt: "2026-07-28T08:57:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "qieman-strategy-explorer",
      groupId: "research",
      title: "四笔钱策略检视台｜筛选、对比与全指标分析",
      url: "https://clairku.github.io/qieman-strategy-explorer/",
      pinned: false,
      position: 2,
      createdAt: "2026-07-27T16:43:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "financial-planning-review",
      groupId: "research",
      title: "财务规划报告｜现金流与目标可达性改稿建议",
      url: "https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",
      pinned: false,
      position: 3,
      createdAt: "2026-07-27T11:27:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "investment-behavior-report",
      groupId: "research",
      title: "投资行为画像｜行为金融洞察报告（脱敏版）",
      url: "https://clairku.github.io/my-investment-behavior-report/",
      pinned: false,
      position: 4,
      createdAt: "2026-07-16T14:56:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "product-review-workbench",
      groupId: "product-planning",
      title: "产品需求评审工作台",
      url: "https://clairku.github.io/product-review-workbench/",
      pinned: true,
      position: 8,
      createdAt: "2026-07-08T06:43:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "community-ai-review",
      groupId: "product-planning",
      title: "社区 AI 运营方案｜需求评审报告",
      url: "https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",
      pinned: false,
      position: 9,
      createdAt: "2026-07-28T08:20:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "jinzhenzi-review",
      groupId: "reporting",
      title: "金榛子奖申报材料审查报告",
      url: "https://clairku.github.io/jinzhenzi-submission-review/",
      pinned: false,
      position: 0,
      createdAt: "2026-07-28T11:01:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "jinzhenzi-history",
      groupId: "reporting",
      title: "金榛子奖历届获奖项目档案",
      url: "https://clairku.github.io/jinzhenzi-submission-review/history.html",
      pinned: false,
      position: 1,
      createdAt: "2026-07-28T11:20:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "xiaogu-user-needs",
      groupId: "xiaogu",
      title: "小顾用户需求分析与关键钩子工具方案",
      url: "https://clairku.github.io/xiaogu-user-needs-report/",
      pinned: false,
      position: 8,
      createdAt: "2026-07-16T09:58:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "qieman-ai-advisor-ecosystem",
      groupId: "xiaogu",
      title: "且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",
      url: "https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",
      pinned: true,
      position: 9,
      createdAt: "2026-07-26T15:05:00.000Z",
      source: "近月新增",
      access: "account",
    },
    {
      id: "oap-h2-plan",
      groupId: "reporting",
      title: "2026 下半年 AI 开放平台目标计划与里程碑",
      url: "https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",
      pinned: false,
      position: 2,
      createdAt: "2026-07-26T09:00:00.000Z",
      source: "研究库",
      access: "org",
    },
    {
      id: "ai-productization-roadshow-2026-07-30",
      groupId: "reporting",
      title: "AI 产品化实践路演｜CEO / CTO",
      url: "https://clairku.github.io/clair-ai-studio/reports/ai-productization-roadshow-2026-07-30/",
      pinned: true,
      position: 0,
      createdAt: "2026-07-30T00:00:00.000Z",
      source: "CEO / CTO 路演材料",
      access: "production",
    },
    {
      id: "advisor-report-skill-ai-practice",
      groupId: "reporting",
      title: "AI 工具实践案例｜顾问报告 Skill",
      url: "https://clairku.github.io/clair-ai-studio/reports/advisor-report-skill-ai-practice-2026-07-29/",
      pinned: true,
      position: 0,
      createdAt: "2026-07-29T15:30:00.000Z",
      source: "顾问报告 Skill 材料",
      access: "production",
    },
    {
      id: "ai-weekly-2026-07-13",
      groupId: "reporting",
      title: "AI 项目周报｜2026-07-13",
      url: "https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",
      pinned: false,
      position: 3,
      createdAt: "2026-07-13T02:20:23.000Z",
      source: "近月补录",
      access: "production",
    },
    {
      id: "pension-business-analysis",
      groupId: "reporting",
      title: "盈米及且慢养老金业务分析",
      url: "https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",
      pinned: false,
      position: 4,
      createdAt: "2026-07-13T08:47:33.000Z",
      source: "近月补录",
      access: "production",
    },
    {
      id: "advisor-2-business-onboarding",
      groupId: "reporting",
      title: "盈米投顾 2.0｜新负责人业务入职报告",
      url: "https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",
      pinned: false,
      position: 5,
      createdAt: "2026-07-13T09:12:10.000Z",
      source: "近月补录",
      access: "production",
    },
    {
      id: "schwab-ria-benchmark",
      groupId: "reporting",
      title: "嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",
      url: "https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",
      pinned: false,
      position: 6,
      createdAt: "2026-07-22T02:40:53.000Z",
      source: "近月补录",
      access: "production",
    },
    {
      id: "skill-audit-2026-07-16",
      groupId: "ai-workbench",
      title: "25 项 Skills 可用性与一致性审查",
      url: "https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",
      pinned: false,
      position: 0,
      createdAt: "2026-07-16T03:30:04.000Z",
      source: "近月补录",
      access: "production",
    },
    {
      id: "html-editor-guide",
      groupId: "ai-workbench",
      title: "Clair's Studio｜HTML 编辑器使用与安全说明",
      url: "https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/",
      pinned: true,
      position: 1,
      createdAt: "2026-07-29T16:00:00.000Z",
      source: "产品能力",
      access: "production",
    },
    {
      id: "yingmi-ai-capability-system",
      groupId: "ai-platform",
      title: "盈米 AI 能力体系专业报告｜2026.07",
      url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",
      pinned: false,
      position: 8,
      createdAt: "2026-07-13T09:43:42.000Z",
      source: "近月补录",
      access: "production",
    },
  ],
};

const WORK_TYPE_BY_REPORT = {
  "yingmiwork-product-brief-2026-08-20": "reporting",
  "qieman-selfservice-vs-advisory-cohorts-2026-08-19": "data-analysis",
  "qieman-goal-account-longterm-value-2026-08-19": "data-analysis",
  "qieman-advisor-value-ca-compare-2026-08-19": "data-analysis",
  "qieman-dual-account-cohort-comparison-2026-08-19": "data-analysis",
  "qieman-risk-comfort-match-2026-08-19": "data-analysis",
  "qieman-advisory-value-key-charts-2026-08-19": "data-analysis",
  "qieman-business-trends-2026-08-19": "data-analysis",
  "qieman-multi-account-performance-2026-08-19": "data-analysis",
  "qieman-selffund-vs-advisor-ca-2026-08-19": "data-analysis",
  "qieman-vip-fee-service-results-2026-08-19": "data-analysis",
  "qieman-goal-account-value-chart-2026-08-19": "data-analysis",
  "qieman-goal-account-user-value-2026-08-18": "data-analysis",
  "auto-follow-requirement-review-2026-08-10": "requirement-review",
  "clair-product-design-reviewer-2026-08-06": "requirement-review",
  "ai-xiaogu-product-experience-2026-07-30": "product-planning",
  "workbench-quality-audit-2026-07-30": "governance-review",
  "yingmi-ai-materials-compendium-2026-07-30": "reporting",
  "qieman-ai-product-practice-2026-07-30": "product-planning",
  "seed-mcp-benchmark": "competitive-research",
  "seed-fund-report": "investment-research",
  "storage-big-three-fund-screening": "investment-research",
  "seed-agreement": "governance-review",
  "seed-xiaogu": "product-planning",
  "seed-strategy": "investment-research",
  "seed-ecosystem": "product-demo",
  "qieman-library-index": "governance-review",
  "qieman-advisor-inventory": "product-planning",
  "qieman-advisor-direction-research": "product-planning",
  "qieman-advisor-v09": "product-planning",
  "qieman-network-research": "competitive-research",
  "qieman-advisor-final": "product-planning",
  "qieman-advisor-demo": "product-demo",
  "qieman-advisor-plan": "product-planning",
  "qieman-home-entry-analysis": "data-analysis",
  "qieman-advisor-click-analysis": "data-analysis",
  "qieman-app-map": "product-planning",
  "qieman-app-deep-analysis": "data-analysis",
  "qieman-app-usage": "data-analysis",
  "qieman-app-roadmap": "product-planning",
  "qieman-ai-native": "product-planning",
  "oap-progress-roadmap": "reporting",
  "oap-metrics-trend": "data-analysis",
  "oap-reporting-framework": "reporting",
  "oap-h2-okr-iteration-review": "reporting",
  "oap-traffic-analysis": "data-analysis",
  "eastmoney-platform": "competitive-research",
  "qieman-strategy-explorer": "investment-research",
  "financial-planning-review": "requirement-review",
  "investment-behavior-report": "data-analysis",
  "product-review-workbench": "product-demo",
  "community-ai-review": "requirement-review",
  "jinzhenzi-review": "governance-review",
  "jinzhenzi-history": "competitive-research",
  "xiaogu-user-needs": "product-planning",
  "qieman-ai-advisor-ecosystem": "product-demo",
  "oap-h2-plan": "reporting",
  "ai-productization-roadshow-2026-07-30": "reporting",
  "advisor-report-skill-ai-practice": "reporting",
  "ai-weekly-2026-07-13": "reporting",
  "pension-business-analysis": "reporting",
  "advisor-2-business-onboarding": "reporting",
  "schwab-ria-benchmark": "competitive-research",
  "skill-audit-2026-07-16": "governance-review",
  "html-editor-guide": "product-demo",
  "yingmi-ai-capability-system": "reporting",
};

const TOPIC_BY_REPORT = {
  "auto-follow-requirement-review-2026-08-10": "product-planning",
  "clair-product-design-reviewer-2026-08-06": "ai-workbench",
  "ai-service-blueprint-serif-2026-07-30": "reporting",
  "yingmi-ai-materials-compendium-2026-07-30": "ai-platform",
  "qieman-ai-product-practice-2026-07-30": "ai-platform",
  "qieman-home-entry-analysis": "product-planning",
  "qieman-app-map": "product-planning",
  "qieman-app-deep-analysis": "product-planning",
  "qieman-app-usage": "product-planning",
  "qieman-app-roadmap": "product-planning",
  "financial-planning-review": "xiaogu",
  "investment-behavior-report": "xiaogu",
  "product-review-workbench": "ai-workbench",
  "community-ai-review": "ai-workbench",
  "qieman-ai-advisor-ecosystem": "ai-platform",
  "oap-h2-plan": "ai-platform",
  "oap-h2-okr-iteration-review": "ai-platform",
};

function inferWorkType(report) {
  const text = `${report.title || ""} ${report.source || ""} ${report.savedContent || ""} ${report.detectedDescription || ""}`;
  if (/需求评审|评审工作台/.test(text)) return "requirement-review";
  if (/竞品|对比|调研|研究/.test(text)) return "competitive-research";
  if (/周报|汇报|进展|规划|里程碑|业务分析/.test(text)) return "reporting";
  if (/数据|趋势|点击|转化|画像|使用/.test(text)) return "data-analysis";
  if (/基金|策略|投研|资产配置/.test(text)) return "investment-research";
  if (/审查|治理|知识/.test(text)) return "governance-review";
  if (/Demo|Studio|工作台|原型/i.test(text)) return "product-demo";
  return "product-planning";
}

function inferTags(report, workType = inferWorkType(report)) {
  const text = `${report.id || ""} ${report.groupId || ""} ${report.title || ""} ${report.url || ""} ${report.savedContent || ""} ${report.detectedDescription || ""}`;
  const tags = [];
  const add = (tag) => {
    if (!tags.includes(tag)) tags.push(tag);
  };
  if (report.isProduction) add("生产");
  if (report.isPersonal) add("个人");
  if (/ontology\.yingmi-inc\.com|本体/.test(text)) add("本体");
  if (/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(text)) add("飞书");
  if (workType === "competitive-research" || /调研|研究|盘点/.test(text)) add("调研");
  if (workType === "product-planning") add("产品规划");
  if (/xiaogu|小顾|财务规划|投资行为/.test(text) || report.groupId === "xiaogu") add("AI 小顾");
  if (/studio|workbench|工作台|skill-audit/i.test(text) || report.groupId === "ai-workbench") add("AI 工作台");
  if (/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(text) || report.groupId === "ai-platform") add("AI 开放平台");
  if (/且慢|qieman/.test(text)) add("且慢");
  if (/投顾|advisor|财务规划/.test(text)) add("投顾服务");
  if (/OAP|oap-/.test(text)) add("OAP");
  if (/MCP|mcp-/.test(text)) add("MCP");
  if (/Skills|skill-/.test(text)) add("Skills");
  if (workType === "investment-research" || report.groupId === "research") add("投研");
  if (workType === "data-analysis") add("数据分析");
  if (workType === "requirement-review") add("需求评审");
  if (workType === "reporting") add("经营汇报");
  if (workType === "governance-review" || report.groupId === "knowledge") add("知识治理");
  return tags.slice(0, 5);
}

function inferGroupId(report) {
  const text = `${report.title || ""} ${report.url || ""} ${report.savedContent || ""} ${report.detectedDescription || ""}`;
  if (/小顾|财务规划|投顾服务|客户陪伴/.test(text)) return "xiaogu";
  if (/OAP|MCP|Skills?|开放平台|API|Agent|智能体/.test(text)) return "ai-platform";
  if (/Studio|工作台|生产力|Copilot|编辑器/i.test(text)) return "ai-workbench";
  if (/基金|投研|策略|资产配置|股票|债券/.test(text)) return "research";
  if (/汇报|周报|月报|经营|进展|里程碑/.test(text)) return "reporting";
  if (/知识|SOUL|飞书|治理|本体|文档库/.test(text)) return "knowledge";
  if (/且慢|产品|需求|方案|原型|体验|PRD/i.test(text)) return "product-planning";
  return {
    "requirement-review": "product-planning",
    "competitive-research": "product-planning",
    reporting: "reporting",
    "data-analysis": "reporting",
    "investment-research": "research",
    "governance-review": "knowledge",
    "product-demo": "ai-workbench",
    "product-planning": "product-planning",
  }[report.workType] || "product-planning";
}

initialState.reports = initialState.reports.map((report) => {
  const groupId = TOPIC_BY_REPORT[report.id] || report.groupId;
  const workType = WORK_TYPE_BY_REPORT[report.id] || inferWorkType(report);
  const next = { ...report, groupId, workType };
  return { ...next, tags: inferTags(next, workType) };
});

let state = loadState();
let bucketOrder = loadBucketOrder();
let reportOrder = loadReportOrder();
let query = "";
let readerId = "";
let archiveView = false;
let catalogView = ["topic", "type", "tag", "time"].includes(localStorage.getItem(VIEW_KEY))
  ? localStorage.getItem(VIEW_KEY)
  : "topic";
let reportTimeSort = ["created", "modified"].includes(localStorage.getItem(TIME_SORT_KEY))
  ? localStorage.getItem(TIME_SORT_KEY)
  : "created";
let draggingId = "";
let movingReportId = "";
let dragDropTarget = null;
let dragPlaceholder = null;
let modal = null;
let toastTimer = 0;
let modalFocusReturn = null;
let modalOpenScrollY = 0;
let controlledScrollFrame = 0;
let pendingScrollFrame = 0;
let viewportRestoreFrame = 0;
let suppressReportOpenId = "";
let suppressReportOpenUntil = 0;
let catalogViewportSnapshot = null;
let modalViewportSnapshot = null;
let searchContentIndex = {};
let searchIndexPromise = null;
let searchDimensionFilters = new Set();
let searchInputCommitTimer = 0;
let pendingSearchViewportSnapshot = null;
let applicationUpdateCheckPromise = null;
let applicationUpdateLastCheckedAt = 0;
let applicationUpdateAvailable = false;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function searchIndexKey(report) {
  try {
    const parts = new URL(report.url).pathname.split("/").filter(Boolean);
    const reportsIndex = parts.indexOf("reports");
    return reportsIndex >= 0 ? parts[reportsIndex + 1] || report.id : report.id;
  } catch {
    return report.id;
  }
}

function indexedReport(report) {
  return {
    ...report,
    searchContent: searchContentIndex[report.id] || searchContentIndex[searchIndexKey(report)] || "",
  };
}

const SEARCH_DIMENSIONS = [
  { id: "title", label: "标题" },
  { id: "category", label: "分类" },
  { id: "tags", label: "标签" },
  { id: "content", label: "内容" },
];

function ensureSearchIndex() {
  if (searchIndexPromise) return searchIndexPromise;
  searchIndexPromise = fetch("./search-index.json", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : {})
    .then((index) => {
      searchContentIndex = index && typeof index === "object" ? index : {};
      if (query && !readerId && !archiveView && !searchInputCommitTimer) {
        const selection = document.getElementById("search-input")?.selectionStart ?? query.length;
        renderSearchAtCurrentScroll();
        const input = document.getElementById("search-input");
        input?.focus({ preventScroll: true });
        input?.setSelectionRange(selection, selection);
      }
      return searchContentIndex;
    })
    .catch(() => {
      searchContentIndex = {};
      return searchContentIndex;
    });
  return searchIndexPromise;
}

function loadBucketOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(BUCKET_ORDER_KEY));
    if (saved && typeof saved === "object") {
      return Object.fromEntries(
        Object.entries(saved).map(([kind, ids]) => [
          kind,
          Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [],
        ]),
      );
    }
  } catch {
    // Fall back to the default order when saved data is invalid.
  }
  return {};
}

function loadReportOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(REPORT_ORDER_KEY));
    if (saved && typeof saved === "object") return saved;
  } catch {
    // Keep the catalog's default order when local ordering data is invalid.
  }
  return {};
}

function saveReportOrder() {
  localStorage.setItem(REPORT_ORDER_KEY, JSON.stringify(reportOrder));
}

function normalizedUrl(value = "") {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    const pathname = decodeURI(parsed.pathname)
      .replace(/\/index\.html$/, "/")
      .replace(/\/+$/, "/");
    return `${parsed.origin}${pathname}`;
  } catch {
    return String(value).trim().replace(/\/+$/, "/");
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved?.groups) && Array.isArray(saved?.reports)) {
      return migrateState(saved);
    }
  } catch {
    // Use initial state when local data is invalid.
  }
  return clone(initialState);
}

function migrateState(saved) {
  const catalog = clone(initialState);
  const catalogGroupIds = new Set(catalog.groups.map((group) => group.id));
  const oldDefaultIds = new Set(["inbox", "today", "product", "research"]);
  const savedGroupsById = new Map(saved.groups.map((group) => [group.id, group]));
  const groups = catalog.groups.map((group) => {
    const savedGroup = savedGroupsById.get(group.id);
    if (!savedGroup || saved.version < DATA_VERSION) return group;
    return {
      ...group,
      name: savedGroup.name || group.name,
      description: savedGroup.description || group.description,
      position: Number.isFinite(savedGroup.position) ? savedGroup.position : group.position,
    };
  });
  saved.groups
    .filter((group) => !catalogGroupIds.has(group.id) && !oldDefaultIds.has(group.id))
    .forEach((group, index) => {
      groups.push({
        ...group,
        description: group.description || "自定义工作分组",
        position: Number.isFinite(group.position)
          ? group.position
          : initialState.groups.length + index,
      });
    });
  const uniqueGroups = groups.filter(
    (group, index, list) => list.findIndex((item) => item.id === group.id) === index,
  );
  uniqueGroups.sort((a, b) => (a.position || 0) - (b.position || 0));

  const knownReportGroups = {
    "seed-mcp-benchmark": "ai-platform",
    "seed-fund-report": "research",
    "seed-agreement": "ai-platform",
    "seed-xiaogu": "xiaogu",
    "seed-strategy": "research",
    "seed-ecosystem": "ai-platform",
    "storage-big-three-fund-screening": "research",
  };
  const oldGroupFallback = {
    inbox: "product-planning",
    today: "product-planning",
    product: "xiaogu",
    research: "research",
  };
  const normalizedSavedReports = saved.reports.map((report) => ({
    ...report,
    groupId:
      TOPIC_BY_REPORT[report.id] ||
      knownReportGroups[report.id] ||
      (report.groupId === "inbox" ? inferGroupId(report) : oldGroupFallback[report.groupId]) ||
      report.groupId ||
      inferGroupId(report),
    workType: report.workType || WORK_TYPE_BY_REPORT[report.id] || inferWorkType(report),
    tags: Array.isArray(report.tags) && report.tags.length
      ? report.tags
      : inferTags(report, report.workType || WORK_TYPE_BY_REPORT[report.id]),
  }));
  const savedById = new Map(normalizedSavedReports.map((report) => [report.id, report]));
  const savedByUrl = new Map(
    normalizedSavedReports.map((report) => [normalizedUrl(report.url), report]),
  );
  const catalogUrls = new Set();
  const catalogReportIds = new Set();
  const reports = catalog.reports.map((report) => {
    const reportUrl = normalizedUrl(report.url);
    const refreshCatalogMetadata = report.id === "qieman-xiaogu-service-card-landscape-2026-08-13";
    catalogUrls.add(reportUrl);
    catalogReportIds.add(report.id);
    const savedReport = savedById.get(report.id) || savedByUrl.get(reportUrl);
    if (!savedReport) return report;
    return {
      ...report,
      title: refreshCatalogMetadata
        ? report.title
        : saved.version >= DATA_VERSION
        ? savedReport.title || report.title
        : report.title,
      groupId: saved.version >= DATA_VERSION &&
        uniqueGroups.some((group) => group.id === savedReport.groupId)
        ? savedReport.groupId
        : report.groupId,
      workType: saved.version >= DATA_VERSION && savedReport.workType
        ? savedReport.workType
        : report.workType,
      tags: saved.version >= DATA_VERSION &&
        Array.isArray(savedReport.tags) &&
        savedReport.tags.length
        ? savedReport.tags
        : report.tags,
      pinned: Boolean(savedReport.pinned),
      modifiedAt: refreshCatalogMetadata
        ? report.modifiedAt || report.createdAt
        : savedReport.modifiedAt || report.modifiedAt || report.createdAt,
      position: Number.isFinite(savedReport.position)
        ? savedReport.position
        : report.position,
      archived: Boolean(savedReport.archived),
      archivedAt: savedReport.archivedAt || "",
    };
  });
  normalizedSavedReports.forEach((report) => {
    const reportUrl = normalizedUrl(report.url);
    if (catalogReportIds.has(report.id) || (reportUrl && catalogUrls.has(reportUrl))) {
      return;
    }
    catalogReportIds.add(report.id);
    if (reportUrl) catalogUrls.add(reportUrl);
    reports.push(report);
  });
  const migrated = {
    version: DATA_VERSION,
    groups: uniqueGroups,
    reports,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

function saveState() {
  state.version = DATA_VERSION;
  state.groups.forEach((group, index) => {
    group.position = index;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function firstHttpUrl(text = "") {
  const matches = String(text).match(/https?:\/\/[^\s<>"'）)]+/gi) || [];
  return matches.find(validUrl) || "";
}

function titleFromIntake(material, files, url) {
  const localHtml = htmlFromIntake(material, files);
  const htmlTitle = localHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/\s+/g, " ")
    .trim();
  if (htmlTitle) return htmlTitle.slice(0, 100);
  const textTitle = String(material)
    .split(/\n/)
    .map((line) => line.trim().replace(/^#+\s*/, ""))
    .find((line) => line && !/^https?:\/\//i.test(line));
  if (textTitle) return textTitle.replace(/[。；;！!？?]+$/, "").slice(0, 100);
  if (files[0]?.name) return files[0].name.replace(/\.[^.]+$/, "").slice(0, 100);
  return url ? domainOf(url) : "未命名成果";
}

function normalizedSavedContent(value = "") {
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function savedFilesFingerprint(files = []) {
  return files
    .map((file) => `${String(file.name || "").trim().toLocaleLowerCase()}:${file.size || 0}:${file.type || ""}`)
    .sort()
    .join("|");
}

function findDuplicateReport({ material, files, url, excludeId = "" }) {
  const normalizedIntakeUrl = url ? normalizedUrl(url) : "";
  const normalizedContent = normalizedSavedContent(material);
  const filesFingerprint = savedFilesFingerprint(files);

  return state.reports.find((report) => {
    if (report.id === excludeId) return false;
    if (normalizedIntakeUrl && normalizedUrl(report.url) === normalizedIntakeUrl) {
      return true;
    }
    if (normalizedContent &&
      normalizedSavedContent(report.savedContent) === normalizedContent) {
      return true;
    }
    return !normalizedContent && Boolean(filesFingerprint) &&
      savedFilesFingerprint(report.savedFiles) === filesFingerprint;
  }) || null;
}

function personalGithubUrl(url = "") {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const firstPath = parsed.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
    return host === "clairku.github.io" ||
      ((host === "github.com" || host === "raw.githubusercontent.com") &&
        firstPath === "clairku");
  } catch {
    return false;
  }
}

function htmlUrl(url = "") {
  try {
    return /\.html?$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function htmlFromIntake(material = "", files = []) {
  if (/<!doctype\s+html|<html[\s>]/i.test(material)) return material.trim();
  const htmlFile = files.length === 1 && /\.html?$/i.test(files[0]?.name)
    ? files[0]
    : null;
  return htmlFile?.content || htmlFile?.excerpt || "";
}

function permissionTarget(url = "") {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (/(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/.test(host)) {
      return { access: "org", provider: "飞书组织帐号" };
    }
    if (/(^|\.)docs\.qq\.com$|(^|\.)doc\.weixin\.qq\.com$/.test(host)) {
      return { access: "account", provider: "腾讯文档帐号" };
    }
    if (/(^|\.)yingmi-inc\.com$/.test(host)) {
      return { access: "org", provider: "盈米组织帐号" };
    }
    if (host === "github.com" && /^\/login(?:\/|$)/.test(new URL(url).pathname)) {
      return { access: "account", provider: "GitHub 帐号" };
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchPageMetadata(url) {
  if (!validUrl(url)) {
    return { title: "", description: "", reachable: false, checked: true };
  }
  const parsed = new URL(url);
  if (parsed.origin !== window.location.origin) {
    return {
      title: "",
      description: "",
      reachable: false,
      checked: false,
    };
  }
  try {
    const response = await fetch(parsed.href, {
      headers: { Accept: "text/html" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      return {
        title: "",
        description: "",
        reachable: false,
        checked: true,
      };
    }
    const html = await response.text();
    const document = new DOMParser().parseFromString(html, "text/html");
    return {
      title: document.title.trim().slice(0, 180),
      description: document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
        ?.trim()
        .slice(0, 500) || "",
      reachable: true,
      checked: true,
    };
  } catch {
    return {
      title: "",
      description: "",
      reachable: false,
      checked: false,
    };
  }
}

async function inspectSaveTarget({ material = "", files = [], url = "" }, onProgress = () => {}) {
  const localHtml = htmlFromIntake(material, files);
  const hasHtmlFile = files.some((file) => /\.html?$/i.test(file.name));
  if (!url) {
    if (!localHtml && !files.length) {
      return {
        allowed: false,
        reason: hasHtmlFile
          ? "HTML 文件过大或无法读取，未保存；请上传 1MB 以内的 HTML"
          : "请上传支持的档案、粘贴内容，或输入可正常访问的网址",
      };
    }
    return {
      allowed: true,
      access: "local",
      metadata: { title: "", description: "", reachable: true, checked: true },
      isHtml: Boolean(localHtml),
      savedHtml: localHtml,
      loginProvider: "",
    };
  }

  const permission = permissionTarget(url);
  onProgress(
    permission
      ? "正在识别权限页面与登录入口…"
      : "正在检查页面是否可正常访问…",
  );
  const metadata = permission
    ? { title: "", description: "", reachable: true, checked: true }
    : await fetchPageMetadata(url);
  if (!permission && metadata.checked && !metadata.reachable) {
    return {
      allowed: false,
      reason: "页面无法正常访问，且不是可读取的 HTML，未保存",
    };
  }

  return {
    allowed: true,
    access: permission?.access || "production",
    metadata,
    isHtml: htmlUrl(url),
    savedHtml: "",
    loginProvider: permission?.provider || "",
  };
}

async function saveIntakeToLibrary({ material, files }, onProgress = () => {}) {
  const url = firstHttpUrl(material);
  onProgress("正在检查成果库是否已有相同内容…");
  const duplicate = findDuplicateReport({ material, files, url });
  if (duplicate) {
    return {
      ...duplicate,
      duplicate: true,
      groupName: state.groups.find((group) => group.id === duplicate.groupId)?.name || "未归类",
      workTypeName: workTypeName(duplicate.workType),
    };
  }

  const inspected = await inspectSaveTarget({ material, files, url }, onProgress);
  if (!inspected.allowed) {
    return {
      rejected: true,
      duplicate: false,
      reason: inspected.reason,
    };
  }

  const textTitle = titleFromIntake(material, files, url);
  const metadata = inspected.metadata;
  onProgress("正在识别标题、分组、类型与标签…");
  const now = new Date().toISOString();
  const report = {
    id: id("report"),
    groupId: "product-planning",
    title: metadata.title || textTitle,
    url,
    pinned: false,
    position: 0,
    createdAt: now,
    modifiedAt: now,
    source: url ? "快捷保存" : "本地保存",
    access: inspected.access,
    archived: false,
    archivedAt: "",
    savedContent: material,
    savedFiles: [],
    detectedDescription: metadata.description,
    manualSaved: true,
    isProduction: inspected.access === "production",
    isPersonal: personalGithubUrl(url),
    isHtml: inspected.isHtml,
    savedHtml: inspected.savedHtml,
    loginProvider: inspected.loginProvider,
  };
  try {
    report.savedFiles = await persistUploadedFiles(report.id, files);
  } catch {
    return {
      rejected: true,
      duplicate: false,
      reason: "档案无法写入浏览器文件库，请检查浏览器储存空间后重试",
    };
  }
  report.workType = inferWorkType(report);
  report.groupId = inferGroupId(report);
  report.tags = inferTags(report, report.workType);
  onProgress("正在保存到成果库…");
  report.position = state.reports.filter((item) =>
    !item.archived && item.groupId === report.groupId).length;

  state.reports.push(report);
  try {
    saveState();
  } catch {
    state.reports.pop();
    await deleteStoredFilesForReport(report.id);
    return {
      rejected: true,
      duplicate: false,
      reason: "成果资料超过当前浏览器可保存容量，请先精简内容后重试",
    };
  }
  archiveView = false;
  if (catalogView !== "time") catalogView = "topic";
  query = "";
  localStorage.setItem(VIEW_KEY, catalogView);
  return {
    ...report,
    duplicate: false,
    groupName: state.groups.find((group) => group.id === report.groupId)?.name || "未归类",
    workTypeName: workTypeName(report.workType),
  };
}

function orderBuckets(buckets, kind) {
  if (kind === "topic") return buckets;
  const saved = bucketOrder[kind] || [];
  if (!saved.length) return buckets;
  const rank = new Map(saved.map((id, index) => [id, index]));
  return [...buckets].sort((a, b) => {
    const aRank = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
    return aRank - bRank;
  });
}

function moveBucketByCommand(sourceId, direction, kind = catalogView) {
  if (!sourceId || !["top", "up", "down", "bottom"].includes(direction)) return false;
  if (kind === "time" || kind === "featured") return false;
  const ids = kind === "topic"
    ? state.groups.map((group) => group.id)
    : classificationBuckets(state.reports.filter((report) => !report.archived))
      .filter((bucket) => bucket.kind === kind)
      .map((bucket) => bucket.id);
  const fromIndex = ids.indexOf(sourceId);
  if (fromIndex < 0) return false;
  const toIndex = direction === "top"
    ? 0
    : direction === "up"
      ? fromIndex - 1
      : direction === "down"
        ? fromIndex + 1
        : ids.length - 1;
  if (toIndex < 0 || toIndex >= ids.length || toIndex === fromIndex) return false;
  const [movedId] = ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, movedId);
  if (kind === "topic") {
    const rank = new Map(ids.map((id, index) => [id, index]));
    state.groups.sort((a, b) => rank.get(a.id) - rank.get(b.id));
    state.groups.forEach((group, index) => {
      group.position = index;
    });
    saveState();
    return true;
  }
  bucketOrder[kind] = ids;
  localStorage.setItem(BUCKET_ORDER_KEY, JSON.stringify(bucketOrder));
  return true;
}

function touchReport(report) {
  report.modifiedAt = new Date().toISOString();
}

function reportOrderKey(kind, bucketId) {
  return `${kind}:${bucketId}`;
}

function orderReports(reports, kind, bucketId, fallbackSort) {
  const ordered = typeof fallbackSort === "function" ? [...reports].sort(fallbackSort) : [...reports];
  const saved = reportOrder[reportOrderKey(kind, bucketId)] || [];
  if (!saved.length) return ordered;
  const rank = new Map(saved.map((id, index) => [id, index]));
  return ordered.sort((a, b) => {
    const aRank = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
    return aRank - bRank;
  });
}

function rememberReportOrder(kind, bucketId, reportId, targetReportId = "", placeAfter = false) {
  if (!["type", "tag", "featured"].includes(kind) || !bucketId) return;
  const reports = kind === "featured"
    ? state.reports.filter((item) => !item.archived && item.pinned)
    : kind === "type"
      ? state.reports.filter((item) => !item.archived && item.workType === bucketId)
      : state.reports.filter((item) => !item.archived && (item.tags || []).includes(bucketId));
  const ids = orderReports(reports, kind, bucketId, (a, b) => reportCreatedTime(b) - reportCreatedTime(a))
    .map((item) => item.id)
    .filter((id) => id !== reportId);
  let index = targetReportId ? ids.indexOf(targetReportId) : ids.length;
  if (index < 0) index = ids.length;
  if (targetReportId && placeAfter) index += 1;
  ids.splice(index, 0, reportId);
  reportOrder[reportOrderKey(kind, bucketId)] = ids;
  saveReportOrder();
}

function moveReport(reportId, targetGroupId, targetReportId = "", placeAfter = false) {
  const report = state.reports.find((item) => item.id === reportId);
  if (!report || report.archived) return false;
  const targetGroup = state.groups.find((group) => group.id === targetGroupId);
  if (!targetGroup) return false;
  const ordered = state.reports
    .filter((item) => !item.archived && item.groupId === targetGroupId && item.id !== reportId)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  let targetIndex = targetReportId
    ? ordered.findIndex((item) => item.id === targetReportId)
    : ordered.length;
  if (targetIndex >= 0 && targetReportId && placeAfter) targetIndex += 1;
  report.groupId = targetGroupId;
  touchReport(report);
  ordered.splice(targetIndex < 0 ? ordered.length : targetIndex, 0, report);
  ordered.forEach((item, index) => {
    item.position = index;
  });
  saveState();
  return true;
}

function workTypeName(workTypeId) {
  return WORK_TYPES.find((item) => item.id === workTypeId)?.name || "产品规划";
}

function reportCreatedTime(report) {
  const timestamp = new Date(report.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function reportModifiedTime(report) {
  const timestamp = new Date(report.modifiedAt || report.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function localDateKey(value) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return "unknown";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dateBucketLabel(key) {
  if (key === "unknown") return "时间待补";
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const todayKey = localDateKey(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const dateLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
  if (key === todayKey) return `今天 · ${dateLabel}`;
  if (key === localDateKey(yesterday)) return `昨天 · ${dateLabel}`;
  return year === today.getFullYear()
    ? dateLabel
    : `${year}年 · ${dateLabel}`;
}

function addedTimeLabel(value, mode = "created") {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return "新增时间待补";
  return `${mode === "modified" ? "修改" : "创建"}于 ${new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)}`;
}

function classificationBuckets(reports, normalizedQuery = "") {
  const matchesName = (name) =>
    !normalizedQuery || normalizeSearchText(name).includes(normalizedQuery);
  if (catalogView === "time") {
    const sortedReports = [...reports]
      .sort((a, b) => reportTimeSort === "modified"
        ? reportModifiedTime(b) - reportModifiedTime(a)
        : reportCreatedTime(b) - reportCreatedTime(a));
    return [{
      id: reportTimeSort,
      name: reportTimeSort === "modified" ? "Modified" : "Created",
      kind: "time",
      accent: "slate",
      reports: sortedReports,
    }];
  }
  if (catalogView === "type") {
    return orderBuckets(WORK_TYPES
      .map((type) => ({
        id: type.id,
        name: type.name,
        kind: "type",
        accent: "blue",
        reports: orderReports(
          reports.filter((report) => report.workType === type.id),
          "type",
          type.id,
          (a, b) =>
            Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
            new Date(b.createdAt) - new Date(a.createdAt),
        ),
      }))
      .filter((bucket) => !normalizedQuery || bucket.reports.length || matchesName(bucket.name)), "type");
  }
  if (catalogView === "tag") {
    const knownTags = new Set(TAG_ORDER);
    state.reports.forEach((report) => {
      (report.tags || []).forEach((tag) => knownTags.add(tag));
    });
    const tags = [...knownTags].sort((a, b) => {
      const ai = TAG_ORDER.indexOf(a);
      const bi = TAG_ORDER.indexOf(b);
      if (ai >= 0 || bi >= 0) {
        return (ai < 0 ? Number.MAX_SAFE_INTEGER : ai) -
          (bi < 0 ? Number.MAX_SAFE_INTEGER : bi);
      }
      return a.localeCompare(b, "zh-CN");
    });
    return orderBuckets(tags
      .map((tag) => ({
        id: tag,
        name: tag,
        kind: "tag",
        accent: "violet",
        reports: orderReports(
          reports.filter((report) => (report.tags || []).includes(tag)),
          "tag",
          tag,
          (a, b) =>
            Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
            new Date(b.createdAt) - new Date(a.createdAt),
        ),
      }))
      .filter((bucket) => bucket.reports.length && (!normalizedQuery || matchesName(bucket.name) || bucket.reports.length)), "tag");
  }
  return state.groups
    .map((group) => ({
      ...group,
      kind: "topic",
      reports: reports
        .filter((report) => report.groupId === group.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0)),
    }))
    .filter((bucket) =>
      !normalizedQuery ||
      bucket.reports.length ||
      matchesName(`${bucket.name} ${bucket.description || ""}`));
}

function assignReportToBucket(reportId, bucketKind, bucketId, targetReportId = "", placeAfter = false) {
  const report = state.reports.find((item) => item.id === reportId);
  if (!report || report.archived) return false;
  if (bucketKind === "topic") {
    return moveReport(reportId, bucketId, targetReportId, placeAfter);
  }
  if (bucketKind === "type") {
    if (!WORK_TYPES.some((item) => item.id === bucketId)) return false;
    report.workType = bucketId;
    touchReport(report);
    saveState();
    rememberReportOrder("type", bucketId, reportId, targetReportId, placeAfter);
    return true;
  }
  if (bucketKind === "tag") {
    report.tags = Array.isArray(report.tags) ? report.tags : [];
    if (!report.tags.includes(bucketId)) report.tags.push(bucketId);
    touchReport(report);
    saveState();
    rememberReportOrder("tag", bucketId, reportId, targetReportId, placeAfter);
    return true;
  }
  if (bucketKind === "featured") {
    report.pinned = true;
    touchReport(report);
    saveState();
    rememberReportOrder("featured", "featured", reportId, targetReportId, placeAfter);
    return true;
  }
  return false;
}

function currentBucketLabel() {
  return catalogView === "type"
    ? "工作类型"
    : catalogView === "tag"
      ? "标签"
      : catalogView === "time"
        ? "新增时间"
        : "主题";
}

function buildSearchHits(reports, normalizedQuery) {
  return reports
    .map((report) => {
      const context = {
        group: state.groups.find((group) => group.id === report.groupId),
        workTypeName: workTypeName(report.workType),
      };
      const searchableReport = indexedReport(report);
      const searchDetails = reportSearchDetails(searchableReport, normalizedQuery, context);
      const dimensions = searchDetails.fields;
      return {
        report,
        dimensions,
        dimensionRank: Math.min(...dimensions.map((dimension) =>
          SEARCH_DIMENSIONS.findIndex((item) => item.id === dimension))),
        score: searchDetails.score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) =>
      a.dimensionRank - b.dimensionRank ||
      compareSearchHitRelevance(a, b));
}

function compareSearchHitRelevance(a, b) {
  return b.score - a.score ||
    reportModifiedTime(b.report) - reportModifiedTime(a.report) ||
    String(a.report.title).localeCompare(b.report.title, "zh-CN");
}

function searchDimensionControlsMarkup(hits, visibleCount) {
  const countFor = (dimension) => hits.filter((hit) => hit.dimensions.includes(dimension)).length;
  const option = (id, label, count) => {
    const selected = id === "all"
      ? searchDimensionFilters.size === 0
      : searchDimensionFilters.has(id);
    const disabled = id !== "all" && count === 0 && !selected;
    return `<button type="button" data-action="toggle-search-dimension" data-id="${id}"
      class="${selected ? "active" : ""}" aria-pressed="${selected}"
      ${disabled ? "disabled" : ""} title="${label}匹配 ${count} 份">${label}<em>${count}</em></button>`;
  };
  return `<div class="search-toolbar-dimensions" aria-label="按匹配维度筛选，可多选">
    <div class="search-dimension-options">
      ${option("all", "全部", hits.length)}
      ${SEARCH_DIMENSIONS.map(({ id, label }) => option(id, label, countFor(id))).join("")}
    </div>
    <span class="sr-only search-results-announcement" role="status" aria-live="polite">匹配到了 ${visibleCount} 份</span>
  </div>`;
}

function searchPriorityGroupsMarkup(hits) {
  const enabledDimensions = searchDimensionFilters.size
    ? new Set(searchDimensionFilters)
    : new Set(SEARCH_DIMENSIONS.map((dimension) => dimension.id));
  const groupedHits = new Map(SEARCH_DIMENSIONS.map(({ id }) => [id, []]));
  hits.forEach((hit) => {
    const primary = SEARCH_DIMENSIONS.find(({ id }) =>
      enabledDimensions.has(id) && hit.dimensions.includes(id));
    if (primary) groupedHits.get(primary.id).push(hit);
  });
  const groups = SEARCH_DIMENSIONS
    .map((dimension, index) => ({
      ...dimension,
      priority: String(index + 1).padStart(2, "0"),
      hits: groupedHits.get(dimension.id).sort(compareSearchHitRelevance),
    }))
    .filter(({ id }) => enabledDimensions.has(id))
    .filter((group) => group.hits.length);
  return `<div class="search-priority-groups" aria-label="按最高匹配优先级排列的搜索结果">
    ${groups.map((group) => `<section class="search-priority-group" data-search-dimension="${group.id}">
      <header class="search-priority-header">
        <div><span>${group.priority}</span><strong>${group.label}匹配</strong></div>
        <em>${group.hits.length} 份</em>
      </header>
      <div class="group-cards search-results-cards">
        ${group.hits.map(({ report }) => cardMarkup(report)).join("")}
      </div>
    </section>`).join("")}
  </div>`;
}

function id(prefix) {
  return `${prefix}-${crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const READER_ACTION_ICONS = {
  back: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6"></path>
    </svg>`,
  edit: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 20 4.2-1 10.6-10.6a2 2 0 0 0 0-2.8l-.4-.4a2 2 0 0 0-2.8 0L5 15.8z"></path>
      <path d="m14.5 6.5 3 3"></path>
    </svg>`,
  copy: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2"></rect>
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
    </svg>`,
  download: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11M8 11l4 4 4-4"></path>
      <path d="M5 18v2h14v-2"></path>
    </svg>`,
  external: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 5h6v6M19 5l-9 9"></path>
      <path d="M17 13v6H5V7h6"></path>
    </svg>`,
};

function readerActionIcon(name) {
  return READER_ACTION_ICONS[name] || "";
}

function domainOf(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function validUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function parseTags(value = "") {
  return [...new Set(
    String(value)
      .split(/[、,，;；\n]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => tag.slice(0, 20)),
  )].slice(0, 8);
}

function availableReportTags() {
  const tags = new Set(TAG_ORDER);
  state.reports.forEach((report) => {
    (report.tags || []).forEach((tag) => tags.add(tag));
  });
  return [...tags].filter((tag) => !["HTML", "手动保存", "生产"].includes(tag));
}

function showToast(message, { duration = 2600, actionLabel = "", onAction = null } = {}) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  const copy = document.createElement("span");
  copy.textContent = message;
  toast.append(copy);
  if (actionLabel && typeof onAction === "function") {
    const action = document.createElement("button");
    action.type = "button";
    action.className = "toast-action";
    action.textContent = actionLabel;
    action.addEventListener("click", () => {
      clearTimeout(toastTimer);
      toast.remove();
      onAction();
    });
    toast.append(action);
  }
  document.body.append(toast);
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.remove(), duration);
}

function showUndoToast(message, onUndo) {
  showToast(message, {
    duration: 8000,
    actionLabel: "撤销",
    onAction: () => {
      onUndo();
      showToast("已撤销刚才的操作");
    },
  });
}

function currentApplicationAssetUrl() {
  const script = document.querySelector('script[type="module"][src*="/assets/index-"]');
  return script?.src ? new URL(script.src, location.href) : null;
}

function applicationAssetUrlFromHtml(html) {
  const documentCopy = new DOMParser().parseFromString(html, "text/html");
  const script = documentCopy.querySelector('script[type="module"][src*="/assets/index-"]');
  const source = script?.getAttribute("src") || "";
  return source ? new URL(source, location.href) : null;
}

function showApplicationUpdateNotice() {
  if (document.querySelector(".app-update-notice")) return;
  const notice = document.createElement("div");
  notice.className = "app-update-notice";
  notice.setAttribute("role", "status");
  const message = document.createElement("span");
  message.textContent = "Studio 已更新，刷新后使用最新修复";
  const action = document.createElement("button");
  action.type = "button";
  action.textContent = "立即刷新";
  action.addEventListener("click", () => {
    const latestUrl = new URL(location.href);
    latestUrl.searchParams.set("v", Date.now().toString(36));
    location.replace(latestUrl);
  });
  notice.append(message, action);
  document.body.append(notice);
}

function checkForApplicationUpdate({ force = false } = {}) {
  if (applicationUpdateAvailable) {
    showApplicationUpdateNotice();
    return Promise.resolve(true);
  }
  const currentAsset = currentApplicationAssetUrl();
  if (!currentAsset) return Promise.resolve(false);
  const now = Date.now();
  if (!force && now - applicationUpdateLastCheckedAt < APPLICATION_UPDATE_CHECK_INTERVAL_MS) {
    return applicationUpdateCheckPromise || Promise.resolve(false);
  }
  if (applicationUpdateCheckPromise) return applicationUpdateCheckPromise;
  applicationUpdateLastCheckedAt = now;
  const indexUrl = new URL("./", location.href);
  indexUrl.searchParams.set("studio-update-check", now.toString(36));
  applicationUpdateCheckPromise = fetch(indexUrl, { cache: "no-store" })
    .then((response) => response.ok ? response.text() : "")
    .then((html) => {
      const latestAsset = applicationAssetUrlFromHtml(html);
      applicationUpdateAvailable = Boolean(
        latestAsset && latestAsset.pathname !== currentAsset.pathname,
      );
      if (applicationUpdateAvailable) showApplicationUpdateNotice();
      return applicationUpdateAvailable;
    })
    .catch(() => false)
    .finally(() => {
      applicationUpdateCheckPromise = null;
    });
  return applicationUpdateCheckPromise;
}

function bindApplicationUpdateChecks() {
  if (document.documentElement.dataset.studioUpdateBound === "true") return;
  document.documentElement.dataset.studioUpdateBound = "true";
  window.addEventListener("focus", () => checkForApplicationUpdate({ force: true }));
  window.addEventListener("pageshow", () => checkForApplicationUpdate({ force: true }));
  window.addEventListener("online", () => checkForApplicationUpdate({ force: true }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForApplicationUpdate({ force: true });
  });
  window.setTimeout(() => checkForApplicationUpdate({ force: true }), 1200);
  window.setInterval(() => {
    if (document.visibilityState === "visible") checkForApplicationUpdate();
  }, APPLICATION_UPDATE_CHECK_INTERVAL_MS);
}

function focusReturnIdentity(element) {
  const action = element?.closest?.("[data-action]");
  if (!action) return null;
  return {
    action: action.dataset.action || "",
    id: action.dataset.id || "",
    bucketKind: action.dataset.bucketKind || "",
    direction: action.dataset.direction || "",
  };
}

function resolveFocusReturn(identity) {
  if (!identity?.action) return null;
  const attributes = [
    `[data-action="${CSS.escape(identity.action)}"]`,
    identity.id ? `[data-id="${CSS.escape(identity.id)}"]` : "",
    identity.bucketKind ? `[data-bucket-kind="${CSS.escape(identity.bucketKind)}"]` : "",
    identity.direction ? `[data-direction="${CSS.escape(identity.direction)}"]` : "",
  ].join("");
  return document.querySelector(attributes);
}

function openAppModal(nextModal, snapshot, trigger) {
  modalViewportSnapshot = snapshot || captureViewportSnapshot();
  modalFocusReturn = focusReturnIdentity(trigger || document.activeElement);
  modalOpenScrollY = window.scrollY;
  modal = nextModal;
  renderWithViewportSnapshot(modalViewportSnapshot);
}

function closeAppModal({ fallbackSelector = ".results-toolbar, .archive-search, .reader-header" } = {}) {
  if (!modal) return;
  const snapshot = modalViewportSnapshot || { scrollY: modalOpenScrollY };
  const focusIdentity = modalFocusReturn;
  modal = null;
  renderWithViewportSnapshot(snapshot);
  modalViewportSnapshot = null;
  modalFocusReturn = null;
  requestAnimationFrame(() => {
    const fallbackContainer = document.querySelector(fallbackSelector);
    const focusTarget = resolveFocusReturn(focusIdentity)
      || fallbackContainer?.querySelector("button, input, [tabindex]:not([tabindex='-1'])")
      || fallbackContainer;
    focusTarget?.focus?.({ preventScroll: true });
  });
}

function bindAppModal() {
  const backdrop = document.querySelector(".app-shell > .dialog-backdrop");
  if (backdrop) document.body.style.setProperty("--studio-modal-scroll-top", `${-modalOpenScrollY}px`);
  else document.body.style.removeProperty("--studio-modal-scroll-top");
  document.body.classList.toggle("studio-modal-open", Boolean(backdrop));
  if (!backdrop) return;
  [...backdrop.parentElement.children].forEach((element) => {
    if (element === backdrop) return;
    element.inert = true;
    element.setAttribute("aria-hidden", "true");
  });
  const dialog = backdrop.querySelector('[role="dialog"]');
  if (!dialog) return;
  const focusable = () => [...dialog.querySelectorAll([
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(","))].filter((element) => !element.hidden && element.getClientRects().length);
  backdrop.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAppModal();
      return;
    }
    if (event.key !== "Tab") return;
    const targets = focusable();
    if (!targets.length) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }
    const first = targets[0];
    const last = targets.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  });
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeAppModal();
  });
  requestAnimationFrame(() => {
    (dialog.querySelector("[autofocus]") || focusable()[0] || dialog)
      ?.focus?.({ preventScroll: true });
  });
}

function scrollPageTop(behavior = "auto") {
  cancelControlledScroll();
  pendingScrollFrame = requestAnimationFrame(() => {
    pendingScrollFrame = 0;
    window.scrollTo({ top: 0, left: 0, behavior });
  });
}

function cancelControlledScroll() {
  if (controlledScrollFrame) cancelAnimationFrame(controlledScrollFrame);
  if (pendingScrollFrame) cancelAnimationFrame(pendingScrollFrame);
  if (viewportRestoreFrame) cancelAnimationFrame(viewportRestoreFrame);
  controlledScrollFrame = 0;
  pendingScrollFrame = 0;
  viewportRestoreFrame = 0;
}

function contentStartOffset() {
  const topbarBottom = document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0;
  const nav = document.querySelector(".topic-nav");
  const navStyle = nav ? getComputedStyle(nav) : null;
  const navRect = nav?.getBoundingClientRect();
  if (!window.matchMedia("(max-width: 840px)").matches) {
    const navStickyTop = navStyle?.position === "sticky"
      ? Number.parseFloat(navStyle.top) || 0
      : 0;
    return Math.max(topbarBottom + 22, navStickyTop);
  }
  const navBottom = navStyle?.position === "sticky" && navRect?.bottom > 0
    ? navRect.bottom
    : 0;
  return Math.max(topbarBottom, navBottom) + 10;
}

function scrollElementToStart(element, behavior = "smooth") {
  if (!element) return;
  cancelControlledScroll();
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const destination = Math.max(0, Math.min(
    maxScroll,
    window.scrollY + element.getBoundingClientRect().top - contentStartOffset(),
  ));
  const origin = window.scrollY;
  let distance = destination - origin;
  if (Math.abs(distance) < 2) return;
  if (behavior !== "smooth" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: destination, left: 0, behavior: "auto" });
    return;
  }
  const duration = Math.min(360, Math.max(180, Math.abs(distance) * 0.22));
  const startedAt = performance.now();
  const tick = (now) => {
    if (!element.isConnected) {
      controlledScrollFrame = 0;
      return;
    }
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const liveDestination = Math.max(0, Math.min(
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
      window.scrollY + element.getBoundingClientRect().top - contentStartOffset(),
    ));
    distance = liveDestination - origin;
    window.scrollTo(0, origin + distance * eased);
    if (progress < 1) {
      controlledScrollFrame = requestAnimationFrame(tick);
    } else {
      controlledScrollFrame = 0;
      window.scrollTo(0, liveDestination);
    }
  };
  controlledScrollFrame = requestAnimationFrame(tick);
}

function bucketElement(bucketKind, bucketId) {
  return document.querySelector(
    `.group-column[data-bucket-kind="${CSS.escape(bucketKind)}"][data-bucket-id="${CSS.escape(bucketId)}"]`,
  );
}

function reportElement(reportId) {
  return document.querySelector(`.board .report-card[data-report-id="${CSS.escape(reportId)}"]`);
}

function viewportAnchorIdentity(element) {
  if (!element) return null;
  const report = element.closest?.(".report-card[data-report-id]");
  if (report) {
    const reportBucket = report.closest(".group-column[data-bucket-kind][data-bucket-id]");
    return {
      type: "report",
      id: report.dataset.reportId,
      bucketKind: reportBucket?.dataset.bucketKind || "",
      bucketId: reportBucket?.dataset.bucketId || "",
    };
  }
  const bucket = element.closest?.(".group-column[data-bucket-kind][data-bucket-id]");
  if (bucket) {
    return {
      type: "bucket",
      kind: bucket.dataset.bucketKind,
      id: bucket.dataset.bucketId,
    };
  }
  const stableElement = element.closest?.(
    ".results-toolbar, .archive-search, .prompt-composer, .groups-section, .library-layout",
  );
  if (!stableElement) return null;
  return {
    type: "selector",
    selector: stableElement.classList.contains("results-toolbar")
      ? ".results-toolbar"
      : stableElement.classList.contains("archive-search")
        ? ".archive-search"
        : stableElement.classList.contains("prompt-composer")
        ? ".prompt-composer"
        : stableElement.classList.contains("groups-section")
          ? ".groups-section"
          : ".library-layout",
  };
}

function resolveViewportAnchor(identity) {
  if (!identity) return null;
  if (identity.type === "report") {
    const bucket = identity.bucketKind && identity.bucketId
      ? bucketElement(identity.bucketKind, identity.bucketId)
      : null;
    return bucket?.querySelector(`.report-card[data-report-id="${CSS.escape(identity.id)}"]`)
      || reportElement(identity.id);
  }
  if (identity.type === "bucket") return bucketElement(identity.kind, identity.id);
  if (identity.type === "selector") return document.querySelector(identity.selector);
  return null;
}

function firstVisibleViewportAnchor() {
  const top = contentStartOffset();
  const firstVisible = (selector) => [...document.querySelectorAll(selector)].filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > top && rect.top < window.innerHeight;
  }).sort((left, right) => (
    Math.abs(left.getBoundingClientRect().top - top)
    - Math.abs(right.getBoundingClientRect().top - top)
  ))[0];
  return firstVisible(".board .report-card[data-report-id]")
    || firstVisible(".group-column[data-bucket-id]")
    || firstVisible(".results-toolbar, .archive-search, .prompt-composer")
    || document.querySelector(".results-toolbar, .archive-search, .groups-section, .library-layout");
}

function captureViewportSnapshot(preferredElement = null) {
  cancelControlledScroll();
  const element = preferredElement || firstVisibleViewportAnchor();
  const identity = viewportAnchorIdentity(element);
  const anchor = resolveViewportAnchor(identity) || element;
  return {
    scrollY: window.scrollY,
    identity,
    viewportTop: anchor?.getBoundingClientRect().top ?? null,
  };
}

function restoreViewportSnapshot(snapshot) {
  if (!snapshot) return;
  cancelControlledScroll();
  const startedAt = performance.now();
  const restore = () => {
    const anchor = resolveViewportAnchor(snapshot.identity);
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const target = anchor && Number.isFinite(snapshot.viewportTop)
      ? window.scrollY + anchor.getBoundingClientRect().top - snapshot.viewportTop
      : snapshot.scrollY;
    window.scrollTo({ top: Math.max(0, Math.min(maxScroll, target)), left: 0, behavior: "auto" });
  };
  restore();
  const settle = (now) => {
    restore();
    if (now - startedAt >= VIEWPORT_RESTORE_SETTLE_MS) {
      viewportRestoreFrame = 0;
      return;
    }
    viewportRestoreFrame = requestAnimationFrame(settle);
  };
  viewportRestoreFrame = requestAnimationFrame(settle);
}

function renderWithViewportSnapshot(snapshot) {
  render();
  restoreViewportSnapshot(snapshot);
}

function adjacentReportSnapshot(reportId, preferredCard = null) {
  const card = preferredCard || reportElement(reportId);
  let sibling = card?.nextElementSibling?.matches?.(".report-card[data-report-id]")
    ? card.nextElementSibling
    : card?.previousElementSibling?.matches?.(".report-card[data-report-id]")
      ? card.previousElementSibling
      : null;
  if (!sibling) {
    const bucket = card?.closest(".group-column[data-bucket-id]");
    const adjacentBucket = bucket?.nextElementSibling?.matches?.(".group-column[data-bucket-id]")
      ? bucket.nextElementSibling
      : bucket?.previousElementSibling?.matches?.(".group-column[data-bucket-id]")
        ? bucket.previousElementSibling
        : null;
    sibling = adjacentBucket?.querySelector(".report-card[data-report-id]") || adjacentBucket || card;
  }
  return captureViewportSnapshot(sibling);
}

function adjacentBucketSnapshot(bucketKind, bucketId) {
  const bucket = bucketElement(bucketKind, bucketId);
  const sibling = bucket?.nextElementSibling?.matches?.(".group-column[data-bucket-id]")
    ? bucket.nextElementSibling
    : bucket?.previousElementSibling?.matches?.(".group-column[data-bucket-id]")
      ? bucket.previousElementSibling
      : bucket;
  return captureViewportSnapshot(sibling);
}

function scheduleElementAlignment(resolveElement, behavior = "smooth") {
  cancelControlledScroll();
  pendingScrollFrame = requestAnimationFrame(() => {
    pendingScrollFrame = requestAnimationFrame(() => {
      pendingScrollFrame = 0;
      scrollElementToStart(resolveElement(), behavior);
    });
  });
}

function renderAtCurrentScroll(resolvePreferredElement = null) {
  const preferredElement = typeof resolvePreferredElement === "function"
    ? resolvePreferredElement()
    : resolvePreferredElement;
  renderWithViewportSnapshot(captureViewportSnapshot(preferredElement));
}

function renderSearchResultsInPlace() {
  if (readerId || archiveView || modal) return false;
  const currentToolbarSide = document.querySelector(".results-toolbar-side");
  const currentSearch = currentToolbarSide?.querySelector(".results-search");
  const currentGroups = document.querySelector(".groups-section");
  if (!currentToolbarSide || !currentSearch || !currentGroups) return false;

  const template = document.createElement("template");
  template.innerHTML = workbenchMarkup();
  const nextToolbarSide = template.content.querySelector(".results-toolbar-side");
  const nextSearch = nextToolbarSide?.querySelector(".results-search");
  const nextGroups = template.content.querySelector(".groups-section");
  if (!nextToolbarSide || !nextSearch || !nextGroups) return false;

  currentSearch.querySelector(".search-clear-button")?.remove();
  const nextClear = nextSearch.querySelector(".search-clear-button");
  if (nextClear) currentSearch.append(nextClear);
  [...currentToolbarSide.children]
    .filter((element) => element !== currentSearch)
    .forEach((element) => element.remove());
  [...nextToolbarSide.children]
    .filter((element) => !element.classList.contains("results-search"))
    .forEach((element) => currentToolbarSide.append(element));
  currentToolbarSide.className = nextToolbarSide.className;
  currentGroups.replaceWith(nextGroups);
  bindApp();
  hydrateSavedFilePreviews();
  return true;
}

function renderWorkbenchWithViewportSnapshot(snapshot) {
  if (!renderSearchResultsInPlace()) render();
  restoreViewportSnapshot(snapshot);
}

function renderSearchAtCurrentScroll(resolvePreferredElement = null, viewportSnapshot = null) {
  const preferredElement = typeof resolvePreferredElement === "function"
    ? resolvePreferredElement()
    : resolvePreferredElement;
  const stableElement = preferredElement || document.querySelector(".results-toolbar");
  renderWorkbenchWithViewportSnapshot(
    viewportSnapshot || captureViewportSnapshot(stableElement),
  );
}

["wheel", "touchstart", "pointerdown"].forEach((eventName) => {
  window.addEventListener(eventName, cancelControlledScroll, { passive: true });
});

let fileDatabasePromise = null;
const activeFileObjectUrls = new Set();

function openFileDatabase() {
  if (fileDatabasePromise) return fileDatabasePromise;
  fileDatabasePromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(FILE_DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(FILE_STORE_NAME)) {
        const store = database.createObjectStore(FILE_STORE_NAME, { keyPath: "id" });
        store.createIndex("reportId", "reportId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("File database failed"));
  });
  return fileDatabasePromise;
}

async function persistUploadedFiles(reportId, files = []) {
  const storedFiles = files.map((file) => {
    const { blob, ...metadata } = file;
    return {
      ...metadata,
      storageId: blob instanceof Blob ? `${reportId}:${file.id}` : file.storageId || "",
      blob,
    };
  });
  const binaryFiles = storedFiles.filter((file) => file.blob instanceof Blob && file.storageId);
  if (binaryFiles.length) {
    const database = await openFileDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(FILE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(FILE_STORE_NAME);
      binaryFiles.forEach((file) => {
        store.put({
          id: file.storageId,
          reportId,
          name: file.name,
          type: file.type,
          size: file.size,
          blob: file.blob,
          updatedAt: new Date().toISOString(),
        });
      });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("File save failed"));
      transaction.onabort = () => reject(transaction.error || new Error("File save aborted"));
    });
  }
  return storedFiles.map(({ blob, ...metadata }) => metadata);
}

async function storedFileBlob(file) {
  if (file?.storageId) {
    try {
      const database = await openFileDatabase();
      const stored = await new Promise((resolve, reject) => {
        const request = database.transaction(FILE_STORE_NAME, "readonly")
          .objectStore(FILE_STORE_NAME)
          .get(file.storageId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("File read failed"));
      });
      if (stored?.blob instanceof Blob) return stored.blob;
    } catch {
      return null;
    }
  }
  const fallback = file?.content || file?.excerpt;
  return fallback
    ? new Blob([fallback], { type: file.type || "text/plain;charset=utf-8" })
    : null;
}

async function deleteStoredFilesForReport(reportId) {
  try {
    const database = await openFileDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(FILE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(FILE_STORE_NAME);
      const request = store.index("reportId").openKeyCursor(IDBKeyRange.only(reportId));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        store.delete(cursor.primaryKey);
        cursor.continue();
      };
      request.onerror = () => reject(request.error || new Error("File cleanup failed"));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("File cleanup failed"));
    });
  } catch {
    // A missing browser file database should not block catalog cleanup.
  }
}

function revokeFileObjectUrls() {
  activeFileObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  activeFileObjectUrls.clear();
}

function fileObjectUrl(blob) {
  const url = URL.createObjectURL(blob);
  activeFileObjectUrls.add(url);
  return url;
}

async function hydrateSavedFilePreviews() {
  const previews = [...document.querySelectorAll("[data-saved-file-preview]")];
  await Promise.all(previews.map(async (preview) => {
    const report = state.reports.find((item) => item.id === preview.dataset.reportId);
    const file = report?.savedFiles?.find((item) => item.id === preview.dataset.fileId);
    if (!file) return;
    preview.classList.add("is-loading");
    preview.setAttribute("aria-busy", "true");
    const blob = await storedFileBlob(file);
    if (!blob || !preview.isConnected) {
      preview.classList.remove("is-loading");
      preview.setAttribute("aria-busy", "false");
      return;
    }
    const mode = preview.dataset.previewMode;
    try {
      if (mode === "image") {
        const image = document.createElement("img");
        image.src = fileObjectUrl(blob);
        image.alt = file.name || "图片预览";
        image.draggable = false;
        preview.replaceChildren(image);
      } else if (mode === "html") {
        const frame = document.createElement("iframe");
        const url = fileObjectUrl(blob);
        frame.src = url;
        frame.title = `${file.name || "HTML"}内容`;
        frame.setAttribute("sandbox", "allow-forms allow-modals allow-popups allow-scripts");
        preview.replaceChildren(frame);
      } else {
        await renderRichFile(preview, blob, file, mode);
      }
      preview.classList.add("is-ready");
    } catch (error) {
      const fallback = document.createElement("div");
      fallback.className = "saved-file-render-error";
      const title = document.createElement("strong");
      title.textContent = "暂时无法直接显示这个文件";
      const detail = document.createElement("p");
      detail.textContent = error?.message || "请下载原文件后使用对应应用打开";
      fallback.append(title, detail);
      preview.replaceChildren(fallback);
      preview.classList.add("has-error");
    } finally {
      preview.classList.remove("is-loading");
      preview.setAttribute("aria-busy", "false");
    }
  }));
}

async function downloadSavedFile(file) {
  const blob = await storedFileBlob(file);
  if (!blob) return false;
  const url = fileObjectUrl(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name || "download";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    activeFileObjectUrls.delete(url);
  }, 1000);
  return true;
}

async function openSavedFile(file) {
  const popup = window.open("", "_blank");
  const blob = await storedFileBlob(file);
  if (!blob) {
    popup?.close();
    return false;
  }
  const url = fileObjectUrl(blob);
  if (popup) popup.location.href = url;
  else window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    activeFileObjectUrls.delete(url);
  }, 60000);
  return true;
}

function localHtmlForReport(report) {
  return report.savedHtml || htmlFromIntake(
    report.savedContent,
    report.savedFiles,
  );
}

function htmlFilename(report) {
  const safeTitle = String(report.title || "report")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${safeTitle || "report"}.html`;
}

function localHtmlUrl(report) {
  const html = localHtmlForReport(report);
  return html
    ? URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }))
    : "";
}

function downloadLocalHtml(report) {
  const blobUrl = localHtmlUrl(report);
  if (!blobUrl) return false;
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = htmlFilename(report);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  return true;
}

function triggerDownload(blobUrl, filename) {
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}

/*
 * 打包一份线上报告要抓几十项资源、大报告能到几十兆，必须给出可见进度和一个
 * 退出口，否则用户只会看到浏览器毫无反应。这个面板独立挂在 body 上，不进
 * render() 的模板，免得中途被整页重绘冲掉。
 */
function showArchiveProgress(title) {
  document.querySelector(".archive-progress")?.remove();
  const controller = new AbortController();
  const panel = document.createElement("div");
  panel.className = "archive-progress";
  panel.setAttribute("role", "status");
  panel.innerHTML = `
    <div class="archive-progress-body">
      <strong>正在打包单文件档案</strong>
      <span class="archive-progress-title"></span>
      <span class="archive-progress-detail">读取报告…</span>
    </div>
    <button type="button" class="archive-progress-cancel">取消</button>`;
  panel.querySelector(".archive-progress-title").textContent = title;
  const detail = panel.querySelector(".archive-progress-detail");
  panel.querySelector(".archive-progress-cancel").addEventListener("click", () => {
    controller.abort();
  });
  document.body.append(panel);
  return {
    signal: controller.signal,
    update({ resources = 0, bytes = 0, label = "" } = {}) {
      detail.textContent = resources
        ? `已打包 ${resources} 项 · ${formatBytes(bytes)}${label ? ` · ${label}` : ""}`
        : label || "读取报告…";
    },
    close() {
      panel.remove();
    },
  };
}

async function downloadReportArchive(report) {
  const progress = showArchiveProgress(report.title);
  try {
    const { html, stats } = await packReportArchive(report.url, {
      onProgress: progress.update,
      signal: progress.signal,
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    triggerDownload(URL.createObjectURL(blob), archiveFilename(report.title));
    const missing = stats.skipped.length + stats.failed.length;
    showToast(
      `单文件档案已下载 · ${stats.resources} 项资源 · ${formatBytes(blob.size)}`
        + (missing ? ` · ${missing} 项过大或抓取失败，仅保留原链接` : ""),
      { duration: missing ? 5200 : 3600 },
    );
  } catch (error) {
    if (error?.name === "AbortError") {
      showToast("已取消打包");
      return;
    }
    /* 打包失败时退回原来的行为：至少让人拿到那份 index.html。 */
    showToast("打包失败，改为下载原始 HTML");
    await downloadPublishedReport(report, showToast);
  } finally {
    progress.close();
  }
}

function openReportInBrowser(report) {
  const target = report.url || localHtmlUrl(report);
  if (!target) return false;
  window.open(target, "_blank", "noopener,noreferrer");
  if (!report.url) window.setTimeout(() => URL.revokeObjectURL(target), 60000);
  return true;
}

function savedFilePreviewMarkup(report, file, compact = false) {
  const presentation = filePresentation(file);
  const format = file.format || presentation.label;
  const canHydrate = Boolean(file.storageId && ["image", "pdf", "html"].includes(presentation.preview));
  const previewMode = compact && presentation.preview === "pdf"
    ? "pdf-thumb"
    : presentation.preview;
  const previewAttributes = canHydrate
    ? `data-saved-file-preview data-report-id="${escapeHtml(report.id)}" data-file-id="${escapeHtml(file.id)}" data-preview-mode="${previewMode}"`
    : "";
  const textPreview = presentation.preview === "text" && (file.excerpt || file.content)
    ? `<pre>${escapeHtml((file.excerpt || file.content).slice(0, compact ? 280 : 8000))}</pre>`
    : "";
  return `
    <div class="saved-file-visual file-kind-${presentation.kind} ${compact ? "compact" : ""}" ${previewAttributes}>
      <span class="saved-file-format">${escapeHtml(format)}</span>
      ${textPreview || `<div class="saved-file-fallback">
        <strong>${escapeHtml(format)}</strong>
        <small>${escapeHtml(file.name || "未命名文件")}</small>
      </div>`}
    </div>`;
}

function savedFileEmbeddedMarkup(report, file, index, total) {
  const presentation = filePresentation(file);
  const format = file.format || presentation.label;
  const canHydrate = Boolean(file.storageId || file.content || file.excerpt);
  const previewAttributes = canHydrate
    ? `data-saved-file-preview data-report-id="${escapeHtml(report.id)}" data-file-id="${escapeHtml(file.id)}" data-preview-mode="${escapeHtml(presentation.preview)}"`
    : "";
  return `<article class="saved-file-embed file-kind-${presentation.kind}">
    <header class="saved-file-embed-header">
      <div class="saved-file-identity">
        <span class="saved-file-format">${escapeHtml(format)}</span>
        <div><b>${escapeHtml(file.name || "未命名文件")}</b><small>${escapeHtml(file.sizeLabel || "")} · ${index + 1}/${total}</small></div>
      </div>
      <button type="button" class="saved-file-download" data-action="download-saved-file" data-id="${escapeHtml(report.id)}" data-file-id="${escapeHtml(file.id)}">下载原文件</button>
    </header>
    <div class="saved-file-embedded-content" ${previewAttributes}>
      <div class="saved-file-loading" aria-hidden="true"><span></span><strong>正在展开 ${escapeHtml(format)} 内容</strong></div>
    </div>
  </article>`;
}

function savedFilesReaderMarkup(report) {
  const files = report.savedFiles || [];
  if (!files.length) return "";
  return `<section class="saved-file-list embedded-file-list" aria-label="档案正文">
    <div class="embedded-file-list-heading"><strong>档案正文</strong><span>${files.length} 个文件 · 已直接展开</span></div>
    ${files.map((file, index) => savedFileEmbeddedMarkup(report, file, index, files.length)).join("")}
  </section>`;
}

function cardMarkup(report, archivedView = false) {
  const localSaved = !report.url &&
    (Boolean(report.savedContent) || Boolean((report.savedFiles || []).length));
  const restricted = ["org", "account"].includes(report.access);
  const accessLabel = report.access === "org"
    ? "需组织登录"
    : report.access === "account"
      ? "需账号登录"
      : "生产可访问";
  const localHtml = localHtmlForReport(report);
  const isPinned = Boolean(report.pinned);
  const groupLabel = state.groups.find((group) => group.id === report.groupId)?.name || "未归类";
  const hiddenCardTags = new Set(["HTML", "手动保存", "生产"]);
  const contextualTags = [...new Set([
    groupLabel,
    workTypeName(report.workType),
    ...(report.tags || []),
  ])].filter((tag) => !hiddenCardTags.has(tag));
  const hasPreview = !restricted && initialState.reports.some((item) => item.id === report.id);
  const previewAsset = report.preview || `${report.id}.png`;
  const primarySavedFile = (report.savedFiles || [])[0];
  const preview = localHtml && report.isHtml
    ? `<iframe class="local-html-preview-frame" title="${escapeHtml(report.title)}视觉预览"
        srcdoc="${escapeHtml(localHtml)}" sandbox="allow-scripts" loading="lazy"
        tabindex="-1" aria-hidden="true"></iframe>`
    : hasPreview
    ? `<img src="./previews/${escapeHtml(previewAsset)}" alt="" loading="lazy" decoding="async" draggable="false" />`
    : localSaved && primarySavedFile
    ? savedFilePreviewMarkup(report, primarySavedFile, true)
    : `
      <div class="preview-placeholder ${restricted ? "preview-restricted" : ""}">
        <span>${restricted ? "ACCESS" : escapeHtml(report.title.slice(0, 2))}</span>
        <strong>${restricted ? accessLabel : localSaved ? "本地内容" : "预览待补充"}</strong>
      </div>`;
  return `
    <article class="report-card ${restricted ? "restricted-card" : ""} ${archivedView ? "archived-card" : ""} ${isPinned ? "is-featured" : ""} ${movingReportId === report.id ? "is-move-selected" : ""}"
      data-report-id="${escapeHtml(report.id)}" ${archivedView || catalogView === "time" ? "" : 'data-report-draggable="true"'}>
      <button class="card-main" type="button" data-action="open" data-id="${escapeHtml(report.id)}" aria-label="打开${escapeHtml(report.title)}">
        <span class="report-preview">
          ${preview}
        </span>
        <span class="report-copy">
          <strong>${escapeHtml(report.title)}</strong>
          <span class="report-tags">${contextualTags.map((tag, index) => `<span class="${index < 2 ? "report-context-tag" : ""}">${escapeHtml(tag)}</span>`).join("")}</span>
          ${restricted ? `<span class="report-access-note">${escapeHtml(accessLabel)}</span>` : ""}
        </span>
      </button>
      <div class="card-actions">
        ${archivedView
          ? `
            <button type="button" data-action="restore" data-id="${escapeHtml(report.id)}">Restore</button>
            <button type="button" data-action="delete" data-id="${escapeHtml(report.id)}">Delete permanently</button>`
          : `
            <button type="button" class="studio-icon-button card-icon-action" data-action="archive" data-id="${escapeHtml(report.id)}" title="归档成果" aria-label="归档成果">
              ${UI_ICONS.archive}
            </button>
            <button type="button" class="studio-icon-button card-icon-action" data-action="edit" data-id="${escapeHtml(report.id)}" title="编辑成果" aria-label="编辑成果">
              ${UI_ICONS.edit}
            </button>
            <button type="button" class="studio-icon-button feature-action" data-action="toggle-pin" data-id="${escapeHtml(report.id)}"
              title="${isPinned ? "取消精选" : "设为精选"}" aria-label="${isPinned ? "取消精选" : "设为精选"}">${UI_ICONS.star}</button>`}
      </div>
    </article>`;
}

function modalMarkup() {
  if (!modal) return "";
  if (modal.type === "delete-report") {
    const deletingReport = state.reports.find((report) => report.id === modal.reportId);
    if (!deletingReport) return "";
    return `
      <div class="dialog-backdrop">
        <section class="dialog compact-dialog destructive-dialog" role="dialog" aria-modal="true"
          aria-labelledby="delete-report-dialog-title" aria-describedby="delete-report-dialog-description" tabindex="-1">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">PERMANENT DELETE</span>
              <h2 id="delete-report-dialog-title">永久删除这份成果？</h2>
            </div>
            <button type="button" class="studio-icon-button dialog-close-button" data-action="close-modal" title="关闭" aria-label="关闭">${UI_ICONS.close}</button>
          </div>
          <p id="delete-report-dialog-description" class="destructive-dialog-copy">
            将永久删除“<strong>${escapeHtml(deletingReport.title)}</strong>”。此操作完成后无法从归档区恢复。
          </p>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal" autofocus>Cancel</button>
            <button type="button" class="danger-button" data-action="confirm-delete" data-id="${escapeHtml(deletingReport.id)}">Delete permanently</button>
          </div>
        </section>
      </div>`;
  }
  if (modal.type === "group") {
    const editingGroup = modal.mode === "edit"
      ? state.groups.find((group) => group.id === modal.groupId)
      : null;
    return `
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form" role="dialog" aria-modal="true"
          aria-labelledby="group-dialog-title" tabindex="-1">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">WORK TOPIC / GROUP</span>
              <h2 id="group-dialog-title">${editingGroup ? "编辑工作主题" : "新建工作主题"}</h2>
            </div>
            <button type="button" class="studio-icon-button dialog-close-button" data-action="close-modal" title="关闭" aria-label="关闭">${UI_ICONS.close}</button>
          </div>
          <label>主题 / 分组名称
            <input name="name" value="${escapeHtml(editingGroup?.name || "")}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${escapeHtml(editingGroup?.description || "")}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">Cancel</button>
            <button type="submit" class="primary-button">${editingGroup ? "Save changes" : "Create topic"}</button>
          </div>
        </form>
      </div>`;
  }

  const editing = modal.mode === "edit"
    ? state.reports.find((report) => report.id === modal.reportId)
    : null;
  const groupId = editing?.groupId || modal.groupId || state.groups[0]?.id || "";
  const selectedTags = parseTags((editing?.tags || []).join("、"))
    .filter((tag) => !["HTML", "手动保存", "生产"].includes(tag));
  return `
    <div class="dialog-backdrop">
      <form class="dialog" id="report-form" role="dialog" aria-modal="true"
        aria-labelledby="report-dialog-title" tabindex="-1">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">${editing ? "EDIT REPORT" : "NEW REPORT"}</span>
            <h2 id="report-dialog-title">${editing ? "编辑服务报告" : "新增服务报告"}</h2>
          </div>
          <button type="button" class="studio-icon-button dialog-close-button" data-action="close-modal" title="关闭" aria-label="关闭">${UI_ICONS.close}</button>
        </div>
        <label>网站地址
          <div class="url-input-row">
            <input name="url" type="url" value="${escapeHtml(editing?.url || "")}" placeholder="https://..." ${!editing || editing.url ? "required" : ""} autofocus />
            <button type="button" class="detect-button" data-action="detect-title">Detect title</button>
          </div>
          <small class="field-hint">${editing ? "修改网址后可重新识别" : "保存时会自动识别网页标题"}</small>
        </label>
        <label>报告标题
          <input name="title" value="${escapeHtml(editing?.title || "")}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${state.groups.map((group) => `<option value="${escapeHtml(group.id)}" ${group.id === groupId ? "selected" : ""}>${escapeHtml(group.name)}</option>`).join("")}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${WORK_TYPES.map((type) => `<option value="${escapeHtml(type.id)}" ${type.id === (editing?.workType || "product-planning") ? "selected" : ""}>${escapeHtml(type.name)}</option>`).join("")}
          </select>
        </label>
        <fieldset class="report-tag-field">
          <legend>关键标签</legend>
          <input type="hidden" name="tags" value="${escapeHtml(selectedTags.join("、"))}" />
          <div class="report-tag-picker" aria-label="选择关键标签">
            ${availableReportTags().map((tag) => `<button type="button" class="${selectedTags.includes(tag) ? "selected" : ""}"
              data-report-tag="${escapeHtml(tag)}" aria-pressed="${selectedTags.includes(tag)}">${escapeHtml(tag)}</button>`).join("")}
            <button type="button" class="add-report-tag" data-add-report-tag aria-label="新增标签" title="新增标签">＋</button>
          </div>
          <div class="new-report-tag-row" hidden>
            <input type="text" data-new-report-tag maxlength="20" placeholder="输入新的标签名称" />
            <button type="button" data-confirm-report-tag>添加</button>
          </div>
          <small class="field-hint">选择已有标签，或点＋新增；最多 8 个</small>
        </fieldset>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">Cancel</button>
          <button type="submit" class="primary-button">Save</button>
        </div>
      </form>
    </div>`;
}

function readerMarkup(report) {
  if (isEditingReport(report.id)) return reportEditorMarkup(report, escapeHtml);
  const localSaved = !report.url &&
    (Boolean(report.savedContent) || Boolean((report.savedFiles || []).length));
  const restricted = ["org", "account"].includes(report.access);
  const accessLabel = report.loginProvider || permissionTarget(report.url)?.provider ||
    (report.access === "org" ? "组织帐号" : "站点帐号");
  const localHtml = report.savedHtml || htmlFromIntake(
    report.savedContent,
    report.savedFiles,
  );
  const editAction = localHtml
    ? "edit-local-document"
    : report.url
    ? restricted
      ? "edit"
      : "edit-document"
    : "";
  const readerBody = localHtml
    ? `
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${escapeHtml(report.title)}"
          srcdoc="${escapeHtml(localHtml)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts"></iframe>
      </div>`
    : localSaved
    ? `
      <div class="saved-material-wrap">
        <article class="saved-material-card">
          <span class="section-kicker">LOCAL FILE · INLINE READER</span>
          <h1>${escapeHtml(report.title)}</h1>
          ${report.savedContent
            ? `<div class="saved-material-content">${escapeHtml(report.savedContent).replaceAll("\n", "<br />")}</div>`
            : ""}
          ${savedFilesReaderMarkup(report)}
          <p class="saved-material-note">档案正文已在本页直接展开；原文件仍完整保存在当前浏览器的专用文件库，不会上传到 GitHub Pages。</p>
        </article>
      </div>`
    : restricted
    ? `
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${report.access === "org" ? "ORGANIZATION SIGN-IN" : "ACCOUNT SIGN-IN"}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该页面需要${accessLabel}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${accessLabel}登录，验证码与授权只在原网站处理。</small></div></li>
            <li><span>3</span><div><strong>继续查看报告</strong><small>登录成功后留在新窗口阅读，工作台仍保留在当前页。</small></div></li>
          </ol>
          <div class="login-handoff-actions">
            <a class="primary-button" href="${escapeHtml(report.url)}" target="_blank" rel="noreferrer">打开${escapeHtml(accessLabel)}登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">Back</button>
          </div>
          <p class="login-handoff-domain">${escapeHtml(domainOf(report.url))}</p>
        </section>
      </div>`
    : `
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${escapeHtml(report.title)}" src="${escapeHtml(report.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts allow-downloads"></iframe>
      </div>`;
  return `
    <main class="reader-shell compact-reader-shell">
      <header class="reader-header compact-reader-header">
        <button class="reader-icon-button back-button" type="button" data-action="back"
          aria-label="返回成果库" title="返回成果库">${readerActionIcon("back")}</button>
        <div class="reader-title">
          <strong>${escapeHtml(report.title)}</strong>
          <span>${localSaved ? "本地保存" : escapeHtml(domainOf(report.url))}</span>
        </div>
        <div class="reader-actions compact-reader-actions" aria-label="报告操作">
          ${editAction ? `
            <button class="reader-icon-button" type="button" data-action="${editAction}"
              data-id="${escapeHtml(report.id)}" aria-label="编辑" title="编辑">
              ${readerActionIcon("edit")}
            </button>` : ""}
          ${report.url && report.access === "production" ? `
            <button class="reader-icon-button" type="button" data-action="copy-production-url"
              data-id="${escapeHtml(report.id)}" aria-label="复制生产 URL" title="复制生产 URL">
              ${readerActionIcon("copy")}
            </button>` : ""}
          ${!restricted && (report.url || localHtml) ? `
            <button class="reader-icon-button" type="button" data-action="download-report"
              data-id="${escapeHtml(report.id)}" aria-label="下载单文件 HTML 档案"
              title="下载单文件 HTML 档案（含图片、样式、数据）">
              ${readerActionIcon("download")}
            </button>` : ""}
          ${report.url || localHtml ? `
            <button class="reader-icon-button" type="button" data-action="open-browser"
              data-id="${escapeHtml(report.id)}"
              aria-label="${restricted ? `打开${escapeHtml(accessLabel)}登录页` : "在浏览器打开"}"
              title="${restricted ? `打开${escapeHtml(accessLabel)}登录页` : "在浏览器打开"}">
              ${readerActionIcon("external")}
            </button>` : ""}
        </div>
      </header>
      ${readerBody}
      ${modalMarkup()}
    </main>`;
}

function studioTopbarMarkup(archiveCount) {
  return `
    <header class="topbar">
      <button class="brand topbar-home" type="button" data-action="scroll-top"
        aria-label="Back to top" title="Back to top">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </button>
      ${archiveView
        ? '<div class="top-actions"><button class="quiet-button" type="button" data-action="show-catalog">← Library</button></div>'
        : ""}
    </header>`;
}

function archiveMarkup() {
  const archivedReports = state.reports
    .filter((report) => report.archived)
    .filter((report) => reportArchiveMatchesQuery(report, query, {
      group: state.groups.find((group) => group.id === report.groupId),
      workTypeName: workTypeName(report.workType),
    }))
    .sort((a, b) => new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0));
  const archiveCount = state.reports.filter((report) => report.archived).length;
  return `
    <main class="app-shell archive-shell">
      ${studioTopbarMarkup(archiveCount)}
      <section class="workspace archive-workspace">
        <div class="archive-hero">
          <div>
            <span class="eyebrow">SAFE ARCHIVE · REVERSIBLE</span>
            <h1>先收起来，<br />随时找回来。</h1>
            <p>归档只会让报告离开主目录，不会删除内容。预览、主题和原始入口都会保留，也可以随时恢复。</p>
          </div>
          <div class="archive-total"><strong>${archiveCount}</strong><span>份已归档</span></div>
        </div>
        <label class="search archive-search">
          <span aria-hidden="true">⌕</span>
          <input id="search-input" value="${escapeHtml(query)}"
            placeholder="搜索归档标题、来源或网址" aria-label="搜索归档" />
          ${query ? `<button type="button" class="studio-icon-button search-clear-button" data-action="clear-search" title="清除搜索" aria-label="清除搜索">${UI_ICONS.close}</button>` : ""}
        </label>
        ${archivedReports.length ? `
          <section class="archive-results">
            <div class="archive-heading">
              <div><h2>${query ? "搜索结果" : "归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${archivedReports.length} 份</span>
            </div>
            <div class="archive-grid">${archivedReports.map((report) => cardMarkup(report, true)).join("")}</div>
          </section>` : `
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${query ? "没有找到相关归档" : "归档区还是空的"}</h2>
            <p>${query ? "换个关键词，或返回查看全部归档内容。" : "在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。"}</p>
            <button class="quiet-button" type="button" data-action="${query ? "clear-search" : "show-catalog"}">${query ? "Clear search" : "Back to library"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Safe archive</span></footer>
      ${modalMarkup()}
    </main>`;
}

function bucketReorderMarkup(bucket, buckets) {
  if (!["topic", "type", "tag"].includes(bucket.kind)) return "";
  const ordered = buckets.filter((item) => item.kind === bucket.kind);
  const index = ordered.findIndex((item) => item.id === bucket.id);
  if (index < 0) return "";
  const atStart = index === 0;
  const atEnd = index === ordered.length - 1;
  const button = (direction, label, icon, disabled) => `
    <button type="button" class="studio-icon-button group-order-button" data-action="move-group"
      data-id="${escapeHtml(bucket.id)}" data-bucket-kind="${escapeHtml(bucket.kind)}" data-direction="${direction}"
      title="${label}" aria-label="${label}" ${disabled ? "disabled" : ""}>${icon}</button>`;
  return [
    button("top", "置顶", UI_ICONS.top, atStart),
    button("up", "上移", UI_ICONS.up, atStart),
    button("down", "下移", UI_ICONS.down, atEnd),
    button("bottom", "置底", UI_ICONS.bottom, atEnd),
  ].join("");
}

function workbenchMarkup() {
  if (archiveView) return archiveMarkup();
  const normalized = normalizeSearchText(query);
  const activeReports = state.reports.filter((report) => !report.archived);
  const allSearchHits = normalized
    ? buildSearchHits(activeReports, normalized)
    : [];
  const visibleSearchHits = searchDimensionFilters.size
    ? allSearchHits.filter((hit) => hit.dimensions.some((dimension) =>
        searchDimensionFilters.has(dimension)))
    : allSearchHits;
  const featuredReports = orderReports(
    activeReports.filter((report) => report.pinned),
    "featured",
    "featured",
    (a, b) => reportModifiedTime(b) - reportModifiedTime(a),
  );
  const featuredBucket = {
    id: "featured",
    name: "精选成果",
    kind: "featured",
    accent: "violet",
    reports: featuredReports,
  };
  const archiveCount = state.reports.filter((report) => report.archived).length;
  const productionCount = activeReports.filter((report) => report.access === "production").length;
  const restrictedCount = activeReports.filter((report) => report.access !== "production").length;
  const catalogBuckets = classificationBuckets(activeReports, "");
  const navBuckets = catalogView === "topic" && featuredReports.length
    ? [featuredBucket, ...catalogBuckets]
    : catalogBuckets;
  const timeReports = catalogView === "time" ? catalogBuckets[0]?.reports || [] : [];
  const visibleBuckets = normalized
    ? []
    : (catalogView === "topic" && featuredReports.length ? [featuredBucket, ...catalogBuckets] : catalogBuckets)
      .filter((bucket) =>
        bucket.reports.length ||
        movingReportId ||
        catalogView === "topic");
  const viewName = catalogView === "type"
    ? "工作类型"
    : catalogView === "tag"
      ? "关键标签"
      : catalogView === "time"
        ? "新增时间"
        : "工作主题";
  return `
    <main class="app-shell">
      ${studioTopbarMarkup(archiveCount)}
      <section class="workspace">
        ${taskWorkspaceMarkup(escapeHtml)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side ${normalized ? "has-search-results" : ""}">
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" type="search" value="${escapeHtml(query)}"
                placeholder="Rediscover your work" aria-label="找到一个成果"
                autocomplete="off" spellcheck="false" enterkeyhint="search" />
              ${query ? `<button type="button" class="studio-icon-button search-clear-button" data-action="clear-search" title="清除搜索" aria-label="清除搜索">${UI_ICONS.close}</button>` : ""}
            </label>
            ${normalized
              ? searchDimensionControlsMarkup(allSearchHits, visibleSearchHits.length)
              : `<div class="studio-summary compact-summary" aria-label="成果统计">
                  <strong>${activeReports.length}</strong><span>成果</span>
                  <i></i>
                  <strong>${state.groups.length}</strong><span>主题</span>
                  <i></i>
                  <strong>${productionCount}</strong><span>直达</span>
                </div>`}
          </div>
        </div>
        <section class="groups-section">
          ${movingReportId ? `
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${currentBucketLabel()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">Cancel</button>
            </div>` : ""}
          ${normalized || visibleBuckets.length ? `
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${viewName}">
                <div class="library-nav-controls">
                  <div class="library-view-switcher" role="tablist" aria-label="成果分类方式">
                    <button type="button" role="tab" aria-selected="${catalogView === "topic"}" class="${catalogView === "topic" ? "active" : ""}" data-action="set-view" data-id="topic">Topic</button>
                    <button type="button" role="tab" aria-selected="${catalogView === "type"}" class="${catalogView === "type" ? "active" : ""}" data-action="set-view" data-id="type">Type</button>
                    <button type="button" role="tab" aria-selected="${catalogView === "tag"}" class="${catalogView === "tag" ? "active" : ""}" data-action="set-view" data-id="tag">Tag</button>
                    <button type="button" role="tab" aria-selected="${catalogView === "time"}" class="${catalogView === "time" ? "active" : ""}" data-action="set-view" data-id="time">Time</button>
                  </div>
                  <button class="studio-icon-button add-topic-icon" type="button" data-action="add-group"
                    aria-label="Add topic" title="Add topic">${UI_ICONS.plus}</button>
                </div>
                ${catalogView === "time" ? `
                  <div class="library-time-order" aria-label="时间排序">
                    <span>${reportTimeSort === "modified" ? "Modified" : "Created"}</span>
                    <button type="button" data-action="toggle-time-sort"
                      title="切换为按${reportTimeSort === "modified" ? "创建" : "修改"}时间排序"
                      aria-label="切换为按${reportTimeSort === "modified" ? "创建" : "修改"}时间倒序">
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3v9m0 0L2 10m2 2 2-2M12 13V4m0 0-2 2m2-2 2 2"></path></svg>
                    </button>
                  </div>
                  <div class="library-time-titles" aria-label="按${reportTimeSort === "modified" ? "修改" : "创建"}时间排列的成果">
                    ${timeReports.map((report) => `
                      <a href="#" data-nav-report-id="${escapeHtml(report.id)}"
                        title="${escapeHtml(report.title)}">${escapeHtml(report.title)}</a>`).join("")}
                  </div>` : navBuckets.map((bucket) => `
                  <a href="#" data-nav-bucket-kind="${escapeHtml(bucket.kind)}"
                    data-nav-bucket-id="${escapeHtml(bucket.id)}">
                    ${escapeHtml(bucket.name)}<span>${bucket.reports.length}</span>
                  </a>`).join("")}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>Archive</strong>
                  ${archiveCount ? `<em>${archiveCount}</em>` : ""}
                </button>
              </nav>
              <div class="board catalog-view-${catalogView}">
              ${normalized ? `
                <section class="search-results-panel">
                  <header class="search-results-header">
                    <div><span>SEARCH RESULTS</span><h2>“${escapeHtml(query.trim())}”</h2></div>
                    ${visibleSearchHits.length ? "<p>按最高匹配优先级归类</p>" : ""}
                  </header>
                  ${visibleSearchHits.length
                    ? searchPriorityGroupsMarkup(visibleSearchHits)
                    : allSearchHits.length
                      ? `<div class="no-results search-no-results">
                          <strong>当前匹配维度下没有成果</strong>
                          <span>可增加其他匹配维度，或查看全部搜索结果。</span>
                          <button type="button" data-action="reset-search-dimensions">查看全部</button>
                        </div>`
                      : `<div class="no-results search-no-results">
                          <strong>没有找到“${escapeHtml(query.trim())}”</strong>
                          <span>可搜索标题、分类、标签与成果正文</span>
                          <button type="button" data-action="clear-search">Clear search</button>
                        </div>`}
                </section>` : visibleBuckets.map((bucket) => `
                <section class="group-column topic-section bucket-${escapeHtml(bucket.kind)} accent-${escapeHtml(bucket.accent || "blue")}"
                  data-bucket-kind="${escapeHtml(bucket.kind)}"
                  data-bucket-id="${escapeHtml(bucket.id)}"
                  data-group-id="${escapeHtml(bucket.id)}">
                  <header class="group-header">
                    <div class="group-heading-area">
                      <div class="group-heading-copy">
                        <div><h2>${escapeHtml(bucket.name)}</h2></div>
                        <span class="count">${bucket.reports.length} 份</span>
                      </div>
                      ${bucket.kind === "topic" ? `<div class="group-primary-actions" aria-label="分组快捷操作">
                        <button type="button" class="studio-icon-button" data-action="add-to-group" data-id="${escapeHtml(bucket.id)}" title="新增成果" aria-label="新增成果">${UI_ICONS.plus}</button>
                        <button type="button" class="studio-icon-button" data-action="rename-group" data-id="${escapeHtml(bucket.id)}" title="编辑分组" aria-label="编辑分组">${UI_ICONS.edit}</button>
                      </div>` : ""}
                    </div>
                    <div class="group-menu" aria-label="分组排序操作">
                      ${movingReportId && bucket.kind !== "time" ? `<button class="move-here-button" type="button" data-action="move-here" data-id="${escapeHtml(bucket.id)}" data-bucket-kind="${escapeHtml(bucket.kind)}">Move here</button>` : ""}
                      ${bucketReorderMarkup(bucket, catalogBuckets)}
                      ${bucket.kind === "topic" ? `<button type="button" class="studio-icon-button group-delete-button" data-action="delete-group" data-id="${escapeHtml(bucket.id)}" title="删除分组" aria-label="删除分组">${UI_ICONS.minus}</button>` : ""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${bucket.reports.length
                      ? bucket.reports.map((report) => cardMarkup(report)).join("")
                      : bucket.kind === "topic"
                        ? `<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${escapeHtml(bucket.id)}">
                            <strong>Drop reports here</strong>
                            <span>or add the first report</span>
                          </button>`
                        : `<div class="empty-topic-drop passive-drop"><strong>拖报告到这里</strong></div>`}
                  </div>
                </section>`).join("")}
              </div>
            </div>` : `
            <div class="no-results">
              <strong>没有找到“${escapeHtml(query.trim())}”</strong>
              <span>可搜索标题、标签、来源、任务类型或主题</span>
              <button type="button" data-action="clear-search">Clear search</button>
            </div>`}
          <div class="catalog-note">
            <span>${restrictedCount} 份报告需要组织或账号登录${archiveCount ? ` · ${archiveCount} 份已安全归档` : ""}</span>
            <div><span>分类调整仅保存在当前浏览器</span></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${modalMarkup()}
    </main>`;
}

function render() {
  const app = document.getElementById("app");
  const report = readerId && state.reports.find((item) => item.id === readerId);
  revokeFileObjectUrls();
  app.innerHTML = report ? readerMarkup(report) : workbenchMarkup();
  bindAppModal();
  bindApp();
  bindTaskCenter({
    render: () => renderAtCurrentScroll(() => document.querySelector(".prompt-composer")),
    showToast,
    saveToLibrary: saveIntakeToLibrary,
  });
  hydrateSavedFilePreviews();
}

async function detectTitle(form) {
  const urlInput = form.elements.url;
  const titleInput = form.elements.title;
  const button = form.querySelector('[data-action="detect-title"]');
  const hint = form.querySelector(".field-hint");
  const url = urlInput.value.trim();
  if (!validUrl(url)) {
    hint.textContent = "请输入完整的 http 或 https 网址";
    return "";
  }
  button.disabled = true;
  button.innerHTML = '<span class="mini-spinner"></span>';
  hint.textContent = "正在读取网页标题…";
  try {
    const { title } = await fetchPageMetadata(url);
    if (!title) throw new Error("read failed");
    titleInput.value = title;
    hint.textContent = "已识别网页标题";
    return titleInput.value;
  } catch {
    const fallback = domainOf(url);
    titleInput.value ||= fallback;
    hint.textContent = "网页暂时无法读取，已用域名作为标题，你可以手动修改";
    return titleInput.value;
  } finally {
    button.disabled = false;
    button.textContent = "Detect title";
  }
}

function bindReportDragging() {
  const board = document.querySelector(".board");
  if (!board || board.dataset.appDraggingBound === "true") return;
  board.dataset.appDraggingBound = "true";
  let session = null;

  const clearTargetClasses = () => {
    document.querySelectorAll(".report-card, .group-column, .topic-nav a").forEach((element) => {
      element.classList.remove(
        "is-nav-drop-target",
      );
    });
  };

  const targetKey = (target) => target
    ? [target.bucketKind, target.bucketId, target.targetReportId, Number(target.placeAfter), Number(target.nav)].join("|")
    : "";

  const createPreview = () => {
    const rect = session.sourceCard.getBoundingClientRect();
    const preview = session.sourceCard.cloneNode(true);
    preview.removeAttribute("id");
    preview.className = "report-card report-drag-preview";
    preview.style.width = `${rect.width}px`;
    preview.style.height = `${rect.height}px`;
    preview.querySelectorAll("button, [role='button'], iframe").forEach((node) => {
      node.removeAttribute("data-action");
      node.setAttribute("tabindex", "-1");
    });
    document.body.append(preview);
    session.previewWidth = rect.width;
    session.previewHeight = rect.height;
    session.previewOffsetX = Math.max(18, Math.min(rect.width - 18, session.startX - rect.left));
    session.previewOffsetY = Math.max(18, Math.min(rect.height - 18, session.startY - rect.top));
    return preview;
  };

  const positionPreview = () => {
    if (!session?.preview) return;
    const maxX = Math.max(8, window.innerWidth - session.previewWidth - 8);
    const maxY = Math.max(8, window.innerHeight - session.previewHeight - 8);
    const left = Math.max(8, Math.min(maxX, session.x - session.previewOffsetX));
    const top = Math.max(8, Math.min(maxY, session.y - session.previewOffsetY));
    session.preview.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  };

  const scheduleDragUpdate = () => {
    if (!session?.active || session.updateFrame) return;
    session.updateFrame = requestAnimationFrame(() => {
      if (!session?.active) return;
      session.updateFrame = 0;
      positionPreview();
      updateDropTarget();
    });
  };

  const placePlaceholder = (container, targetCard = null, placeAfter = false) => {
    if (!container || !session?.placeholder) return;
    if (!targetCard || targetCard.parentElement !== container) {
      container.append(session.placeholder);
      return;
    }
    container.insertBefore(session.placeholder, placeAfter ? targetCard.nextSibling : targetCard);
  };

  const readDropTarget = () => {
    const hovered = document.elementFromPoint(session.x, session.y);
    if (hovered?.closest(".report-card-placeholder")) return session.target;
    const navItem = hovered?.closest(".topic-nav a[data-nav-bucket-id]");
    if (navItem) {
      return {
        bucketKind: navItem.dataset.navBucketKind,
        bucketId: navItem.dataset.navBucketId,
        targetReportId: "",
        placeAfter: false,
        nav: true,
        element: navItem,
      };
    }
    const targetCard = hovered?.closest(".report-card:not(.report-card-placeholder):not(.report-drag-preview)");
    const targetColumn = hovered?.closest(".group-column");
    if (targetCard && targetCard !== session.sourceCard) {
      const column = targetCard.closest(".group-column");
      if (!column || column.dataset.bucketKind === "time") return null;
      const rect = targetCard.getBoundingClientRect();
      const placeAfter = session.y > rect.bottom - rect.height * 0.22 || (
        session.y >= rect.top + rect.height * 0.22 &&
        session.y <= rect.bottom - rect.height * 0.22 &&
        session.x > rect.left + rect.width / 2
      );
      return {
        bucketKind: column.dataset.bucketKind || catalogView,
        bucketId: column.dataset.bucketId || "",
        targetReportId: targetCard.dataset.reportId || "",
        placeAfter,
        nav: false,
        element: targetCard,
        container: column.querySelector(".group-cards"),
      };
    }
    if (targetColumn && targetColumn.dataset.bucketKind !== "time") {
      return {
        bucketKind: targetColumn.dataset.bucketKind || catalogView,
        bucketId: targetColumn.dataset.bucketId || "",
        targetReportId: "",
        placeAfter: false,
        nav: false,
        element: targetColumn,
        container: targetColumn.querySelector(".group-cards"),
      };
    }
    return null;
  };

  const applyDropTarget = (nextTarget) => {
    if (!session || targetKey(nextTarget) === targetKey(session.target)) return;
    clearTargetClasses();
    session.target = nextTarget;
    dragDropTarget = nextTarget;
    if (!nextTarget) return;
    if (nextTarget.nav) {
      nextTarget.element.classList.add("is-nav-drop-target");
      return;
    }
    if (nextTarget.targetReportId) {
      placePlaceholder(nextTarget.container, nextTarget.element, nextTarget.placeAfter);
      return;
    }
    placePlaceholder(nextTarget.container);
  };

  const updateDropTarget = () => {
    if (!session?.active) return;
    applyDropTarget(readDropTarget());
  };

  const edgeVelocity = () => {
    const topBoundary = Math.min(window.innerHeight * 0.34, contentStartOffset() + 72);
    const bottomBoundary = window.innerHeight - 72;
    if (session.y < topBoundary) {
      const ratio = Math.min(1, (topBoundary - session.y) / 84);
      return -Math.max(1, Math.round(12 * ratio * ratio));
    }
    if (session.y > bottomBoundary) {
      const ratio = Math.min(1, (session.y - bottomBoundary) / 84);
      return Math.max(1, Math.round(12 * ratio * ratio));
    }
    return 0;
  };

  const runAutoScroll = () => {
    if (!session?.active) return;
    const velocity = edgeVelocity();
    if (velocity) {
      const before = window.scrollY;
      window.scrollBy(0, velocity);
      if (window.scrollY !== before) updateDropTarget();
    }
    session.autoScrollFrame = requestAnimationFrame(runAutoScroll);
  };

  const activateSession = () => {
    if (!session || session.active) return;
    clearTimeout(session.holdTimer);
    session.sourceCard.setPointerCapture?.(session.pointerId);
    session.active = true;
    draggingId = session.reportId;
    session.preview = createPreview();
    session.placeholder = document.createElement("div");
    session.placeholder.className = "report-card report-card-placeholder";
    session.placeholder.innerHTML = "<span>放在这里</span>";
    session.placeholder.style.minHeight = `${session.sourceCard.getBoundingClientRect().height}px`;
    session.sourceCard.before(session.placeholder);
    session.sourceCard.classList.add("is-dragging");
    document.body.classList.add("report-drag-session");
    positionPreview();
    updateDropTarget();
    session.autoScrollFrame = requestAnimationFrame(runAutoScroll);
  };

  const cleanupSession = () => {
    if (!session) return;
    clearTimeout(session.holdTimer);
    if (session.autoScrollFrame) cancelAnimationFrame(session.autoScrollFrame);
    if (session.updateFrame) cancelAnimationFrame(session.updateFrame);
    session.preview?.remove();
    session.placeholder?.remove();
    session.sourceCard.classList.remove("is-dragging");
    document.body.classList.remove("report-drag-session");
    clearTargetClasses();
    draggingId = "";
    dragDropTarget = null;
  };

  const finishSession = () => {
    if (!session) return;
    const finished = session;
    const target = finished.active ? finished.target : null;
    const sourceId = finished.reportId;
    if (finished.active) {
      suppressReportOpenId = sourceId;
      suppressReportOpenUntil = Date.now() + 500;
    }
    cleanupSession();
    session = null;
    if (!target?.bucketId || target.bucketKind === "time") return;
    const beforeState = clone(state);
    const beforeOrder = clone(reportOrder);
    const moved = assignReportToBucket(
      sourceId,
      target.bucketKind,
      target.bucketId,
      target.targetReportId || "",
      Boolean(target.placeAfter),
    );
    if (!moved) return;
    renderAtCurrentScroll(() => reportElement(sourceId));
    if (target.nav) {
      scheduleElementAlignment(() => bucketElement(target.bucketKind, target.bucketId));
    }
    const message = target.bucketKind === "featured"
        ? "已加入精选成果"
        : target.bucketKind === "tag"
          ? "已添加目标标签"
          : target.bucketKind === "type"
            ? "工作类型已更新"
            : target.targetReportId
              ? "报告顺序已更新"
              : "已移入新主题";
    showUndoToast(message, () => {
      state = beforeState;
      reportOrder = beforeOrder;
      saveState();
      saveReportOrder();
      renderAtCurrentScroll(() => reportElement(sourceId));
    });
  };

  board.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest(".card-actions")) return;
    const sourceCard = event.target.closest('.report-card[data-report-draggable="true"]');
    if (!sourceCard?.closest(".group-column")) return;
    if (event.pointerType === "mouse") event.preventDefault();
    session = {
      pointerId: event.pointerId,
      reportId: sourceCard.dataset.reportId,
      sourceCard,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      active: false,
      target: null,
      preview: null,
      placeholder: null,
      autoScrollFrame: 0,
      updateFrame: 0,
      holdTimer: 0,
    };
    session.holdTimer = window.setTimeout(() => activateSession(), 240);
  });

  board.addEventListener("pointermove", (event) => {
    if (!session || event.pointerId !== session.pointerId) return;
    session.x = event.clientX;
    session.y = event.clientY;
    if (!session.active && Math.hypot(session.x - session.startX, session.y - session.startY) >= 8) {
      activateSession();
    }
    if (!session.active) return;
    event.preventDefault();
    scheduleDragUpdate();
  });

  board.addEventListener("pointerup", (event) => {
    if (!session || event.pointerId !== session.pointerId) return;
    finishSession();
  });
  board.addEventListener("pointercancel", () => {
    cleanupSession();
    session = null;
  });
}

function bindApp() {
  const searchInput = document.getElementById("search-input");
  if (searchInput && searchInput.dataset.appSearchBound !== "true") {
    searchInput.dataset.appSearchBound = "true";
    let searchCompositionActive = false;
    const commitSearchInput = ({
      value = "",
      selectionStart = 0,
      selectionEnd = 0,
      viewportSnapshot = null,
    } = {}) => {
      if (searchInputCommitTimer) window.clearTimeout(searchInputCommitTimer);
      searchInputCommitTimer = 0;
      pendingSearchViewportSnapshot = null;
      const nextQuery = value;
      if (nextQuery === query) return;
      if (!normalizeSearchText(query) || !normalizeSearchText(nextQuery)) {
        searchDimensionFilters.clear();
      }
      query = nextQuery;
      renderSearchAtCurrentScroll(null, viewportSnapshot);
      const nextInput = document.getElementById("search-input");
      nextInput?.focus({ preventScroll: true });
      nextInput?.setSelectionRange(selectionStart, selectionEnd);
    };
    const inputSnapshot = (input) => ({
      value: input?.value || "",
      selectionStart: input?.selectionStart ?? 0,
      selectionEnd: input?.selectionEnd ?? input?.selectionStart ?? 0,
      viewportSnapshot: pendingSearchViewportSnapshot,
    });
    const scheduleSearchInput = (input) => {
      const snapshot = inputSnapshot(input);
      pendingSearchViewportSnapshot = null;
      if (snapshot.viewportSnapshot) {
        restoreViewportSnapshot(snapshot.viewportSnapshot);
      }
      if (searchInputCommitTimer) window.clearTimeout(searchInputCommitTimer);
      searchInputCommitTimer = window.setTimeout(() => {
        searchInputCommitTimer = 0;
        commitSearchInput(snapshot);
      }, SEARCH_INPUT_DEBOUNCE_MS);
    };
    searchInput.addEventListener("compositionstart", () => {
      searchCompositionActive = true;
      pendingSearchViewportSnapshot = captureViewportSnapshot(
        document.querySelector(".results-toolbar"),
      );
    });
    searchInput.addEventListener("compositionend", (event) => {
      searchCompositionActive = false;
      commitSearchInput(inputSnapshot(event.currentTarget));
    });
    searchInput.addEventListener("beforeinput", () => {
      if (!pendingSearchViewportSnapshot) {
        pendingSearchViewportSnapshot = captureViewportSnapshot(
          document.querySelector(".results-toolbar"),
        );
      }
    });
    searchInput.addEventListener("input", (event) => {
      // 注音、拼音等输入法组合输入期间不能重绘，否则候选字会被逐键拆开。
      if (event.isComposing || searchCompositionActive) return;
      scheduleSearchInput(event.currentTarget);
    });
    searchInput.addEventListener("search", (event) => commitSearchInput(inputSnapshot(event.currentTarget)));
    searchInput.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      const modifiesValue = event.key === "Backspace"
        || event.key === "Delete"
        || event.key === "Enter"
        || (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey)
        || ((event.metaKey || event.ctrlKey) && ["v", "x"].includes(key));
      if (modifiesValue && !pendingSearchViewportSnapshot) {
        pendingSearchViewportSnapshot = captureViewportSnapshot(
          document.querySelector(".results-toolbar"),
        );
      }
      if (event.key === "Enter" && event.currentTarget.value !== query) {
        event.preventDefault();
        commitSearchInput(inputSnapshot(event.currentTarget));
        return;
      }
      if (event.key !== "Escape" || (!query && !event.currentTarget.value)) return;
      event.preventDefault();
      if (searchInputCommitTimer) window.clearTimeout(searchInputCommitTimer);
      searchInputCommitTimer = 0;
      query = "";
      event.currentTarget.value = "";
      searchDimensionFilters.clear();
      renderSearchAtCurrentScroll();
      document.getElementById("search-input")?.focus({ preventScroll: true });
    });
  }

  document.querySelectorAll("[data-action]").forEach((element) => {
    if (element.dataset.appActionBound === "true") return;
    element.dataset.appActionBound = "true";
    element.addEventListener("click", async (event) => {
      const action = event.currentTarget.dataset.action;
      const itemId = event.currentTarget.dataset.id;
      const actionCard = event.currentTarget.closest(".report-card");
      if (searchInputCommitTimer) window.clearTimeout(searchInputCommitTimer);
      searchInputCommitTimer = 0;
      if (action === "scroll-top") {
        scrollPageTop("smooth");
      } else if (action === "open") {
        if (itemId === suppressReportOpenId && Date.now() < suppressReportOpenUntil) return;
        catalogViewportSnapshot = captureViewportSnapshot(actionCard || reportElement(itemId));
        readerId = itemId;
        render();
        scrollPageTop();
      } else if (action === "preview-saved-file" || action === "download-saved-file") {
        const report = state.reports.find((item) => item.id === itemId);
        const file = report?.savedFiles?.find((item) => item.id === event.currentTarget.dataset.fileId);
        if (!file) return;
        const completed = action === "preview-saved-file"
          ? await openSavedFile(file)
          : await downloadSavedFile(file);
        if (!completed) showToast("原文件未找到，请重新上传后保存");
      } else if (action === "edit-document") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report || report.access !== "production") return;
        beginReportEditing(report, { render, showToast });
      } else if (action === "edit-local-document") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report || !localHtmlForReport(report)) return;
        beginReportEditing(report, {
          render,
          showToast,
          saveLocal: async (html) => {
            const previousHtml = report.savedHtml;
            report.savedHtml = html;
            report.isHtml = true;
            report.tags = inferTags(report, report.workType);
            touchReport(report);
            try {
              saveState();
            } catch {
              report.savedHtml = previousHtml;
              throw new Error("修改后的 HTML 超过当前浏览器可保存容量，请先下载备份");
            }
          },
        });
      } else if (action === "download-report") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report) return;
        if (localHtmlForReport(report)) {
          if (downloadLocalHtml(report)) showToast("HTML 已下载");
        } else if (report.url) {
          await downloadReportArchive(report);
        }
      } else if (action === "share-report" || action === "copy-production-url") {
        const report = state.reports.find((item) => item.id === itemId);
        if (report?.url) {
          await sharePublishedReport(report, (message) => {
            showToast(
              message === "报告链接已复制" ? "生产 URL 已复制" : message,
            );
          });
        }
      } else if (action === "open-browser") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report) return;
        if (!openReportInBrowser(report)) showToast("浏览器未能打开该报告");
      } else if (action === "back") {
        readerId = "";
        modal = null;
        renderWithViewportSnapshot(catalogViewportSnapshot || { scrollY: 0 });
        catalogViewportSnapshot = null;
      } else if (action === "clear-search") {
        if (searchInputCommitTimer) window.clearTimeout(searchInputCommitTimer);
        searchInputCommitTimer = 0;
        query = "";
        const liveSearchInput = document.getElementById("search-input");
        if (liveSearchInput) liveSearchInput.value = "";
        searchDimensionFilters.clear();
        renderSearchAtCurrentScroll();
        document.getElementById("search-input")?.focus({ preventScroll: true });
      } else if (action === "toggle-search-dimension") {
        if (itemId === "all") {
          searchDimensionFilters.clear();
        } else if (SEARCH_DIMENSIONS.some((dimension) => dimension.id === itemId)) {
          if (searchDimensionFilters.has(itemId)) searchDimensionFilters.delete(itemId);
          else searchDimensionFilters.add(itemId);
        }
        renderSearchAtCurrentScroll(() => document.querySelector(".search-toolbar-dimensions"));
        requestAnimationFrame(() => {
          document.querySelector(`[data-action="toggle-search-dimension"][data-id="${CSS.escape(itemId)}"]`)
            ?.focus({ preventScroll: true });
        });
      } else if (action === "reset-search-dimensions") {
        searchDimensionFilters.clear();
        renderSearchAtCurrentScroll(() => document.querySelector(".search-toolbar-dimensions"));
        requestAnimationFrame(() => {
          document.querySelector('[data-action="toggle-search-dimension"][data-id="all"]')
            ?.focus({ preventScroll: true });
        });
      } else if (action === "set-view") {
        if (!["topic", "type", "tag", "time"].includes(itemId)) return;
        const stableScroll = { scrollY: window.scrollY, identity: null, viewportTop: null };
        catalogView = itemId;
        movingReportId = "";
        localStorage.setItem(VIEW_KEY, catalogView);
        if (normalizeSearchText(query)) renderSearchAtCurrentScroll();
        else renderWithViewportSnapshot(stableScroll);
        requestAnimationFrame(() => {
          document.querySelector(`[data-action="set-view"][data-id="${CSS.escape(itemId)}"]`)
            ?.focus({ preventScroll: true });
        });
      } else if (action === "toggle-time-sort") {
        reportTimeSort = reportTimeSort === "created" ? "modified" : "created";
        localStorage.setItem(TIME_SORT_KEY, reportTimeSort);
        if (normalizeSearchText(query)) renderSearchAtCurrentScroll();
        else renderAtCurrentScroll();
      } else if (action === "cancel-move") {
        movingReportId = "";
        renderAtCurrentScroll();
      } else if (action === "move-here") {
        const bucketKind = event.currentTarget.dataset.bucketKind || catalogView;
        const beforeState = clone(state);
        const beforeOrder = clone(reportOrder);
        if (movingReportId && assignReportToBucket(movingReportId, bucketKind, itemId)) {
          const movedReportId = movingReportId;
          movingReportId = "";
          renderAtCurrentScroll(() => reportElement(movedReportId));
          showUndoToast(
            bucketKind === "tag" ? "已添加目标标签" : `报告已移入目标${currentBucketLabel()}`,
            () => {
              state = beforeState;
              reportOrder = beforeOrder;
              saveState();
              saveReportOrder();
              renderAtCurrentScroll(() => reportElement(movedReportId));
            },
          );
        }
      } else if (action === "show-archive") {
        archiveView = true;
        query = "";
        searchDimensionFilters.clear();
        readerId = "";
        render();
        scrollPageTop();
      } else if (action === "show-catalog") {
        archiveView = false;
        query = "";
        searchDimensionFilters.clear();
        readerId = "";
        render();
        scrollPageTop();
      } else if (action === "add-report") {
        openAppModal(
          { type: "report", mode: "create", groupId: state.groups[0]?.id },
          captureViewportSnapshot(document.querySelector(".results-toolbar")),
          event.currentTarget,
        );
      } else if (action === "add-to-group") {
        openAppModal(
          { type: "report", mode: "create", groupId: itemId },
          captureViewportSnapshot(bucketElement("topic", itemId)),
          event.currentTarget,
        );
      } else if (action === "edit") {
        openAppModal(
          { type: "report", mode: "edit", reportId: itemId },
          captureViewportSnapshot(actionCard || reportElement(itemId)),
          event.currentTarget,
        );
      } else if (action === "toggle-pin") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report) return;
        const beforeReport = clone(report);
        const removingVisibleFeaturedCard = report.pinned
          && actionCard?.closest('[data-bucket-kind="featured"]');
        const snapshot = removingVisibleFeaturedCard
          ? adjacentReportSnapshot(itemId, actionCard)
          : captureViewportSnapshot(actionCard || reportElement(itemId));
        report.pinned = !report.pinned;
        touchReport(report);
        saveState();
        if (normalizeSearchText(query)) renderWorkbenchWithViewportSnapshot(snapshot);
        else renderWithViewportSnapshot(snapshot);
        const message = report.pinned ? "已加入精选成果" : "已移出精选成果";
        showUndoToast(message, () => {
          const current = state.reports.find((item) => item.id === itemId);
          if (!current) return;
          Object.assign(current, beforeReport);
          current.archived = Boolean(beforeReport.archived);
          current.archivedAt = beforeReport.archivedAt || "";
          saveState();
          if (normalizeSearchText(query)) {
            renderSearchAtCurrentScroll(() => reportElement(itemId));
          } else {
            renderAtCurrentScroll(() => reportElement(itemId));
          }
        });
      } else if (action === "close-modal") {
        closeAppModal();
      } else if (action === "detect-title") {
        await detectTitle(event.currentTarget.closest("form"));
      } else if (action === "archive") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report) return;
        const beforeReport = clone(report);
        const snapshot = adjacentReportSnapshot(itemId, actionCard);
        report.archived = true;
        report.archivedAt = new Date().toISOString();
        saveState();
        if (normalizeSearchText(query)) renderWorkbenchWithViewportSnapshot(snapshot);
        else renderWithViewportSnapshot(snapshot);
        showUndoToast("已归档，可随时恢复", () => {
          const current = state.reports.find((item) => item.id === itemId);
          if (!current) return;
          Object.assign(current, beforeReport);
          current.archived = Boolean(beforeReport.archived);
          current.archivedAt = beforeReport.archivedAt || "";
          saveState();
          if (normalizeSearchText(query)) {
            renderSearchAtCurrentScroll(() => reportElement(itemId));
          } else {
            renderAtCurrentScroll(() => reportElement(itemId));
          }
        });
      } else if (action === "restore") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report) return;
        const beforeReport = clone(report);
        const snapshot = adjacentReportSnapshot(itemId);
        report.archived = false;
        report.archivedAt = "";
        saveState();
        renderWithViewportSnapshot(snapshot);
        showUndoToast("报告已恢复到原主题", () => {
          const current = state.reports.find((item) => item.id === itemId);
          if (!current) return;
          Object.assign(current, beforeReport);
          saveState();
          renderAtCurrentScroll(() => reportElement(itemId));
        });
      } else if (action === "delete") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report?.archived) return;
        openAppModal(
          { type: "delete-report", reportId: itemId },
          adjacentReportSnapshot(itemId),
          event.currentTarget,
        );
      } else if (action === "confirm-delete") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report?.archived || modal?.type !== "delete-report") return;
        state.reports = state.reports.filter((item) => item.id !== itemId);
        if (readerId === itemId) readerId = "";
        saveState();
        await deleteStoredFilesForReport(itemId);
        closeAppModal({ fallbackSelector: ".archive-grid, .archive-search" });
        showToast(`已永久删除“${report.title}”`);
      } else if (action === "add-group") {
        openAppModal(
          { type: "group", mode: "create" },
          captureViewportSnapshot(document.querySelector(".results-toolbar")),
          event.currentTarget,
        );
      } else if (action === "rename-group") {
        const group = state.groups.find((item) => item.id === itemId);
        if (group) {
          openAppModal(
            { type: "group", mode: "edit", groupId: itemId },
            captureViewportSnapshot(bucketElement("topic", itemId)),
            event.currentTarget,
          );
        }
      } else if (action === "move-group") {
        const bucketKind = event.currentTarget.dataset.bucketKind;
        const direction = event.currentTarget.dataset.direction;
        const snapshot = captureViewportSnapshot(bucketElement(bucketKind, itemId));
        if (moveBucketByCommand(itemId, direction, bucketKind)) {
          renderWithViewportSnapshot(snapshot);
          requestAnimationFrame(() => {
            document.querySelector(
              `[data-action="move-group"][data-id="${CSS.escape(itemId)}"][data-direction="${CSS.escape(direction)}"]`,
            )?.focus({ preventScroll: true });
          });
          showToast("分组顺序已更新");
        }
      } else if (action === "delete-group") {
        const group = state.groups.find((item) => item.id === itemId);
        const fallbackGroup = state.groups.find((item) => item.id !== itemId);
        if (group && !fallbackGroup) {
          showToast("请先新增另一个分组，再删除当前分组");
        } else if (group && confirm(`删除“${group.name}”？其中的报告会移到“${fallbackGroup.name}”。`)) {
          const snapshot = adjacentBucketSnapshot("topic", itemId);
          state.reports.forEach((report) => {
            if (report.groupId === itemId) report.groupId = fallbackGroup.id;
          });
          state.groups = state.groups.filter((item) => item.id !== itemId);
          saveState();
          renderWithViewportSnapshot(snapshot);
          showToast(`分组已删除，报告已移到“${fallbackGroup.name}”`);
        }
      }
    });
  });

  const topbar = document.querySelector(".topbar");
  if (topbar && topbar.dataset.appTopbarBound !== "true") {
    topbar.dataset.appTopbarBound = "true";
    topbar.addEventListener("click", (event) => {
      if (event.target.closest("button, a")) return;
      scrollPageTop("smooth");
    });
  }

  document.querySelectorAll(".topic-nav a[data-nav-bucket-id]")
    .forEach((link) => {
      if (link.dataset.appNavBound === "true") return;
      link.dataset.appNavBound = "true";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const bucketKind = link.dataset.navBucketKind;
        const bucketId = link.dataset.navBucketId;
        if (query) {
          query = "";
          renderSearchAtCurrentScroll();
          scheduleElementAlignment(() => bucketElement(bucketKind, bucketId));
          return;
        }
        scrollElementToStart(bucketElement(bucketKind, bucketId));
      });
    });

  document.querySelectorAll(".topic-nav a[data-nav-report-id]").forEach((link) => {
    if (link.dataset.appNavBound === "true") return;
    link.dataset.appNavBound = "true";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      scrollElementToStart(reportElement(link.dataset.navReportId));
    });
  });

  bindReportDragging();

  // Kept inert during the transition from the original per-card drag listeners.
  document.querySelectorAll(".legacy-report-drag-handle").forEach((handle) => {
    let pointerStart = null;
    let pointerMoved = false;
    let dragPreview = null;
    let autoScrollFrame = 0;
    let lastPointerY = 0;

    const clearAutoScroll = () => {
      if (!autoScrollFrame) return;
      cancelAnimationFrame(autoScrollFrame);
      autoScrollFrame = 0;
    };

    const runAutoScroll = () => {
      if (!draggingId) return clearAutoScroll();
      const edge = Math.min(110, window.innerHeight * 0.18);
      const distance = lastPointerY < edge
        ? lastPointerY - edge
        : lastPointerY > window.innerHeight - edge
          ? lastPointerY - (window.innerHeight - edge)
          : 0;
      if (!distance) return clearAutoScroll();
      const speed = Math.sign(distance) * Math.min(24, 5 + Math.abs(distance) * 0.2);
      window.scrollBy(0, speed);
      autoScrollFrame = requestAnimationFrame(runAutoScroll);
    };

    const showDragPreview = (event) => {
      const sourceCard = handle.closest(".report-card");
      if (!sourceCard) return;
      if (!dragPreview) {
        const rect = sourceCard.getBoundingClientRect();
        dragPreview = sourceCard.cloneNode(true);
        dragPreview.className = "report-card report-drag-preview";
        dragPreview.style.width = `${rect.width}px`;
        dragPreview.style.height = `${rect.height}px`;
        dragPreview.querySelectorAll("button, [role='button']").forEach((node) => {
          node.removeAttribute("data-action");
          node.setAttribute("tabindex", "-1");
        });
        document.body.append(dragPreview);
      }
      dragPreview.style.transform = `translate3d(${event.clientX + 16}px, ${event.clientY + 16}px, 0)`;
    };

    const clearReportDropTarget = () => {
      dragDropTarget = null;
      dragPlaceholder?.remove();
      dragPlaceholder = null;
      document.querySelectorAll(".report-card, .group-column, .topic-nav a")
        .forEach((element) => element.classList.remove(
          "is-card-drop-target",
          "is-card-drop-before",
          "is-card-drop-after",
          "is-drop-ready",
          "is-nav-drop-target",
        ));
    };

    const ensurePlaceholder = (container, targetCard, placeAfter) => {
      if (!container) return;
      if (!dragPlaceholder) {
        dragPlaceholder = document.createElement("div");
        dragPlaceholder.className = "report-card report-card-placeholder";
        dragPlaceholder.innerHTML = "<span>放在这里</span>";
        const sourceHeight = handle.closest(".report-card")?.getBoundingClientRect().height;
        if (sourceHeight) dragPlaceholder.style.minHeight = `${sourceHeight}px`;
      }
      if (!targetCard || targetCard.parentElement !== container) {
        container.append(dragPlaceholder);
        return;
      }
      container.insertBefore(dragPlaceholder, placeAfter ? targetCard.nextSibling : targetCard);
    };

    const updateDropTarget = (event) => {
      const hovered = document.elementFromPoint(event.clientX, event.clientY);
      const navItem = hovered?.closest(".topic-nav a[data-nav-bucket-id]");
      clearReportDropTarget();
      if (navItem) {
        navItem.classList.add("is-nav-drop-target");
        dragDropTarget = {
          bucketKind: navItem.dataset.navBucketKind,
          bucketId: navItem.dataset.navBucketId,
          targetReportId: "",
          placeAfter: false,
          nav: true,
        };
        return;
      }
      const sourceCard = handle.closest(".report-card");
      const targetCard = hovered?.closest(".report-card:not(.report-card-placeholder)");
      const targetColumn = hovered?.closest(".group-column");
      if (targetCard && targetCard !== sourceCard) {
        const column = targetCard.closest(".group-column");
        const rect = targetCard.getBoundingClientRect();
        const placeAfter = event.clientY > rect.top + rect.height / 2;
        targetCard.classList.add("is-card-drop-target", placeAfter ? "is-card-drop-after" : "is-card-drop-before");
        ensurePlaceholder(column?.querySelector(".group-cards"), targetCard, placeAfter);
        dragDropTarget = {
          bucketKind: column?.dataset.bucketKind || catalogView,
          bucketId: column?.dataset.bucketId || "",
          targetReportId: targetCard.dataset.reportId || "",
          placeAfter,
          nav: false,
        };
        return;
      }
      if (targetColumn && targetColumn.dataset.bucketKind !== "time") {
        targetColumn.classList.add("is-drop-ready");
        ensurePlaceholder(targetColumn.querySelector(".group-cards"), null, false);
        dragDropTarget = {
          bucketKind: targetColumn.dataset.bucketKind || catalogView,
          bucketId: targetColumn.dataset.bucketId || "",
          targetReportId: "",
          placeAfter: false,
          nav: false,
        };
      }
    };

    const clearReportPointerDrag = () => {
      draggingId = "";
      pointerStart = null;
      pointerMoved = false;
      clearAutoScroll();
      dragPreview?.remove();
      dragPreview = null;
      clearReportDropTarget();
      handle.closest(".report-card")?.classList.remove("is-dragging");
    };
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      draggingId = handle.dataset.reportDragId;
      pointerStart = { x: event.clientX, y: event.clientY };
      pointerMoved = false;
      handle.setPointerCapture?.(event.pointerId);
      handle.closest(".report-card")?.classList.add("is-dragging");
    });
    handle.addEventListener("pointermove", (event) => {
      if (!draggingId) return;
      if (
        pointerStart &&
        Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) < 7
      ) return;
      pointerMoved = true;
      lastPointerY = event.clientY;
      showDragPreview(event);
      updateDropTarget(event);
      if (!autoScrollFrame) autoScrollFrame = requestAnimationFrame(runAutoScroll);
    });
    handle.addEventListener("pointerup", (event) => {
      if (!draggingId) return;
      const sourceId = draggingId;
      if (!pointerMoved) {
        movingReportId = sourceId;
        clearReportPointerDrag();
        renderAtCurrentScroll(() => reportElement(sourceId));
        showToast(`请选择目标${currentBucketLabel()}`);
        return;
      }
      const target = dragDropTarget;
      const targetReportId = target?.targetReportId || "";
      const targetBucketId = target?.bucketId || "";
      const targetBucketKind = target?.bucketKind || catalogView;
      const moved = targetBucketId && targetBucketKind !== "time"
        ? assignReportToBucket(
            sourceId,
            targetBucketKind,
            targetBucketId,
            targetReportId,
            Boolean(target?.placeAfter),
          )
        : false;
      clearReportPointerDrag();
      if (moved) {
        renderAtCurrentScroll(() => reportElement(sourceId));
        requestAnimationFrame(() => {
          const bucketSelector = `.group-column[data-bucket-kind="${CSS.escape(targetBucketKind)}"][data-bucket-id="${CSS.escape(targetBucketId)}"]`;
          const movedCard = document.querySelector(`${bucketSelector} .report-card[data-report-id="${CSS.escape(sourceId)}"]`)
            || document.querySelector(`.search-results-cards .report-card[data-report-id="${CSS.escape(sourceId)}"]`);
          scrollElementToStart(movedCard);
          movedCard?.classList.add("is-drop-landed");
          window.setTimeout(() => movedCard?.classList.remove("is-drop-landed"), 900);
        });
        showToast(
          targetBucketKind === "featured"
            ? "已加入精选成果"
            : targetBucketKind === "tag"
            ? "已添加目标标签"
            : targetBucketKind === "type"
              ? "工作类型已更新"
              : targetReportId
                ? "报告顺序已更新"
                : "已移入新主题",
        );
      }
    });
    handle.addEventListener("pointercancel", clearReportPointerDrag);
  });

  const groupForm = document.getElementById("group-form");
  groupForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = new FormData(groupForm).get("name")?.trim();
    const description = new FormData(groupForm).get("description")?.trim();
    if (!name) return;
    if (modal.mode === "edit") {
      const group = state.groups.find((item) => item.id === modal.groupId);
      if (!group) return;
      group.name = name.slice(0, 60);
      group.description = description?.slice(0, 80) || "自定义工作主题";
    } else {
      state.groups.push({
        id: id("group"),
        name: name.slice(0, 60),
        description: description?.slice(0, 80) || "自定义工作主题",
        accent: ["blue", "violet", "amber", "green"][state.groups.length % 4],
        position: state.groups.length,
      });
      catalogView = "topic";
      localStorage.setItem(VIEW_KEY, catalogView);
    }
    saveState();
    const message = modal.mode === "edit" ? "工作主题已更新" : "工作主题已创建，可直接拖入报告";
    closeAppModal();
    showToast(message);
  });

  const reportForm = document.getElementById("report-form");
  const reportTagsInput = reportForm?.elements.tags;
  const updateReportTagButton = (button) => {
    const selected = parseTags(reportTagsInput?.value).includes(button.dataset.reportTag);
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  };
  const bindReportTagButton = (button) => {
    button.addEventListener("click", () => {
      const selected = parseTags(reportTagsInput.value);
      const tag = button.dataset.reportTag;
      reportTagsInput.value = selected.includes(tag)
        ? selected.filter((item) => item !== tag).join("、")
        : [...selected, tag].slice(0, 8).join("、");
      updateReportTagButton(button);
    });
  };
  reportForm?.querySelectorAll("[data-report-tag]").forEach(bindReportTagButton);
  const addReportTagButton = reportForm?.querySelector("[data-add-report-tag]");
  const newReportTagRow = reportForm?.querySelector(".new-report-tag-row");
  const newReportTagInput = reportForm?.querySelector("[data-new-report-tag]");
  const revealNewReportTag = () => {
    newReportTagRow.hidden = false;
    newReportTagInput.focus();
  };
  const addNewReportTag = () => {
    const [tag] = parseTags(newReportTagInput.value);
    if (!tag) return;
    const selected = parseTags(reportTagsInput.value);
    if (!selected.includes(tag) && selected.length >= 8) {
      showToast("最多选择 8 个标签");
      return;
    }
    reportTagsInput.value = [...new Set([...selected, tag])].slice(0, 8).join("、");
    let tagButton = [...reportForm.querySelectorAll("[data-report-tag]")]
      .find((button) => button.dataset.reportTag === tag);
    if (!tagButton) {
      tagButton = document.createElement("button");
      tagButton.type = "button";
      tagButton.dataset.reportTag = tag;
      tagButton.textContent = tag;
      addReportTagButton.before(tagButton);
      bindReportTagButton(tagButton);
    }
    updateReportTagButton(tagButton);
    newReportTagInput.value = "";
    newReportTagRow.hidden = true;
    addReportTagButton.focus();
  };
  addReportTagButton?.addEventListener("click", revealNewReportTag);
  reportForm?.querySelector("[data-confirm-report-tag]")?.addEventListener("click", addNewReportTag);
  newReportTagInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addNewReportTag();
    } else if (event.key === "Escape") {
      event.preventDefault();
      newReportTagInput.value = "";
      newReportTagRow.hidden = true;
      addReportTagButton.focus();
    }
  });
  reportForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const url = reportForm.elements.url.value.trim();
    const editingId = modal.mode === "edit" ? modal.reportId : "";
    const editingReport = editingId
      ? state.reports.find((report) => report.id === editingId)
      : null;
    const editingLocalCard = Boolean(editingReport && !editingReport.url && !url);
    if (!validUrl(url) && !editingLocalCard) return;
    const submit = reportForm.querySelector('button[type="submit"]');
    const hint = reportForm.querySelector(".field-hint");
    submit.disabled = true;
    submit.innerHTML = '<span class="mini-spinner"></span>';
    if (editingLocalCard) {
      const title = reportForm.elements.title.value.trim() || editingReport.title;
      const groupId = reportForm.elements.groupId.value;
      const workType = reportForm.elements.workType.value;
      const tags = parseTags(reportForm.elements.tags.value)
        .filter((tag) => !["HTML", "手动保存", "生产"].includes(tag));
      Object.assign(editingReport, { title, groupId, workType, tags });
      touchReport(editingReport);
      saveState();
      closeAppModal();
      showToast("报告已保存");
      return;
    }
    const duplicate = findDuplicateReport({
      material: url,
      files: [],
      url,
      excludeId: editingId,
    });
    if (duplicate) {
      submit.disabled = false;
      submit.textContent = "Save";
      hint.textContent = `成果库已有“${duplicate.title}”，未重复保存`;
      showToast(`成果库已有“${duplicate.title}”，未重复保存`);
      return;
    }
    const inspected = await inspectSaveTarget(
      { material: url, files: [], url },
      (message) => {
        hint.textContent = message;
      },
    );
    if (!inspected.allowed) {
      submit.disabled = false;
      submit.textContent = "Save";
      hint.textContent = inspected.reason;
      showToast(inspected.reason);
      return;
    }
    let title = reportForm.elements.title.value.trim() || inspected.metadata.title;
    const groupId = reportForm.elements.groupId.value;
    const workType = reportForm.elements.workType.value;
    const manualTags = parseTags(reportForm.elements.tags.value);
    const saveMetadata = {
      title: title || domainOf(url),
      url,
      groupId,
      workType,
      source: "手动添加",
      access: inspected.access,
      detectedDescription: inspected.metadata.description,
      manualSaved: true,
      isProduction: inspected.access === "production",
      isPersonal: personalGithubUrl(url),
      isHtml: inspected.isHtml,
      loginProvider: inspected.loginProvider,
    };
    const tags = modal.mode === "edit"
      ? manualTags
      : [...new Set([...inferTags(saveMetadata, workType), ...manualTags])].slice(0, 8);
    if (modal.mode === "edit") {
      const report = state.reports.find((item) => item.id === modal.reportId);
      Object.assign(report, saveMetadata, { tags });
      touchReport(report);
    } else {
      const now = new Date().toISOString();
      const newReport = {
        id: id("report"),
        groupId,
        ...saveMetadata,
        pinned: false,
        position: state.reports.filter((report) => report.groupId === groupId).length,
        createdAt: now,
        modifiedAt: now,
        archived: false,
        archivedAt: "",
        tags,
      };
      state.reports.push(newReport);
    }
    saveState();
    closeAppModal();
    showToast("报告已保存");
  });

  const activeReport = readerId && state.reports.find((item) => item.id === readerId);
  if (activeReport) bindReportEditor(activeReport);
}

export function renderApp() {
  bindApplicationUpdateChecks();
  ensureSearchIndex();
  render();
}
