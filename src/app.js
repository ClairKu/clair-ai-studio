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
import { normalizeSearchText, reportMatchesQuery } from "./search.js";

const STORAGE_KEY = "clair-service-report-workbench-v1";
const AUTH_KEY = "clair-service-report-workbench-access";
const VIEW_KEY = "clair-service-report-workbench-view";
const BUCKET_ORDER_KEY = "clair-service-report-workbench-bucket-order-v1";
const DATA_VERSION = 10;

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

const initialState = {
  version: DATA_VERSION,
  groups: [
    {
      id: "inbox",
      name: "待整理",
      description: "临时入口，等待归档",
      accent: "slate",
      position: 0,
    },
    {
      id: "xiaogu",
      name: "AI 小顾与投顾服务",
      description: "AI 小顾、顾问服务与客户体验",
      accent: "green",
      position: 1,
    },
    {
      id: "ai-workbench",
      name: "AI 工作台与生产力",
      description: "个人工作台、评审工具与 AI 生产力",
      accent: "blue",
      position: 2,
    },
    {
      id: "ai-platform",
      name: "AI 开放平台",
      description: "OAP、MCP、Skills、Agents 与治理",
      accent: "violet",
      position: 3,
    },
    {
      id: "product-planning",
      name: "且慢产品与体验",
      description: "产品规划、体验分析与交互方案",
      accent: "blue",
      position: 4,
    },
    {
      id: "research",
      name: "投研与策略研究",
      description: "基金、策略与资产配置研究",
      accent: "amber",
      position: 5,
    },
    {
      id: "reporting",
      name: "经营分析与汇报",
      description: "业务分析、周报与管理汇报",
      accent: "blue",
      position: 6,
    },
    {
      id: "knowledge",
      name: "知识治理与组织协同",
      description: "本体、飞书、SOUL 与知识资产",
      accent: "slate",
      position: 7,
    },
  ],
  reports: [
    {
      id: "content-classification-review-sop-2026-07-30",
      groupId: "knowledge",
      title: "宣传推介材料｜内容分层标准与审核 SOP",
      url: "https://clairku.github.io/clair-ai-studio/reports/content-classification-review-sop-2026-07-30/",
      preview: "content-classification-review-sop-2026-07-30.svg",
      pinned: true,
      position: 0,
      createdAt: "2026-07-30T19:05:00.000Z",
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
      id: "oap-reporting-framework",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜阶段复盘与 2026 下半年经营计划",
      url: "https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",
      pinned: true,
      position: 5,
      createdAt: "2026-07-30T08:00:00.000Z",
      source: "OAP 管理层汇报成稿",
      access: "production",
    },
    {
      id: "oap-traffic-analysis",
      groupId: "ai-platform",
      title: "盈米 AI 开放平台｜全站访问与点击分析",
      url: "https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",
      pinned: true,
      position: 6,
      createdAt: "2026-07-28T12:10:00.000Z",
      source: "近月新增",
      access: "production",
    },
    {
      id: "eastmoney-platform",
      groupId: "ai-platform",
      title: "东方财富 AI Skills 平台深度竞品分析",
      url: "https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",
      pinned: false,
      position: 7,
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
  if (report.manualSaved) add("手动保存");
  if (report.isProduction) add("生产");
  if (report.isPersonal) add("个人");
  if (report.isHtml) add("HTML");
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
  }[report.workType] || "inbox";
}

initialState.reports = initialState.reports.map((report) => {
  const groupId = TOPIC_BY_REPORT[report.id] || report.groupId;
  const workType = WORK_TYPE_BY_REPORT[report.id] || inferWorkType(report);
  const next = { ...report, groupId, workType };
  return { ...next, tags: inferTags(next, workType) };
});

let state = loadState();
let bucketOrder = loadBucketOrder();
let query = "";
let readerId = "";
let archiveView = false;
let catalogView = ["topic", "type", "tag", "time"].includes(localStorage.getItem(VIEW_KEY))
  ? localStorage.getItem(VIEW_KEY)
  : "topic";
let draggingId = "";
let draggingGroupId = "";
let movingReportId = "";
let modal = null;
let toastTimer = 0;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
    inbox: "inbox",
    today: "product-planning",
    product: "xiaogu",
    research: "research",
  };
  const normalizedSavedReports = saved.reports.map((report) => ({
    ...report,
    groupId:
      TOPIC_BY_REPORT[report.id] ||
      knownReportGroups[report.id] ||
      oldGroupFallback[report.groupId] ||
      report.groupId ||
      "inbox",
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
    catalogUrls.add(reportUrl);
    catalogReportIds.add(report.id);
    const savedReport = savedById.get(report.id) || savedByUrl.get(reportUrl);
    if (!savedReport) return report;
    return {
      ...report,
      title: saved.version >= DATA_VERSION
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
  const htmlFile = files.find((file) => /\.html?$/i.test(file.name));
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
    if (!localHtml) {
      return {
        allowed: false,
        reason: hasHtmlFile
          ? "HTML 文件过大或无法读取，未保存；请上传 1MB 以内的 HTML"
          : "只能保存可正常访问的网址或 HTML 内容",
      };
    }
    return {
      allowed: true,
      access: "local",
      metadata: { title: "", description: "", reachable: true, checked: true },
      isHtml: true,
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
      groupName: state.groups.find((group) => group.id === duplicate.groupId)?.name || "待整理",
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
    groupId: "inbox",
    title: metadata.title || textTitle,
    url,
    pinned: false,
    position: 0,
    createdAt: now,
    source: url ? "快捷保存" : "本地保存",
    access: inspected.access,
    archived: false,
    archivedAt: "",
    savedContent: material,
    savedFiles: files,
    detectedDescription: metadata.description,
    manualSaved: true,
    isProduction: inspected.access === "production",
    isPersonal: personalGithubUrl(url),
    isHtml: inspected.isHtml,
    savedHtml: inspected.savedHtml,
    loginProvider: inspected.loginProvider,
  };
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
    return {
      rejected: true,
      duplicate: false,
      reason: "HTML 内容超过当前浏览器可保存容量，请先下载或精简后重试",
    };
  }
  archiveView = false;
  if (catalogView !== "time") catalogView = "topic";
  query = "";
  localStorage.setItem(VIEW_KEY, catalogView);
  return {
    ...report,
    duplicate: false,
    groupName: state.groups.find((group) => group.id === report.groupId)?.name || "待整理",
    workTypeName: workTypeName(report.workType),
  };
}

function moveGroup(groupId, targetGroupId) {
  const fromIndex = state.groups.findIndex((group) => group.id === groupId);
  const toIndex = state.groups.findIndex((group) => group.id === targetGroupId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return false;
  const [movedGroup] = state.groups.splice(fromIndex, 1);
  state.groups.splice(toIndex, 0, movedGroup);
  state.groups.forEach((group, index) => {
    group.position = index;
  });
  saveState();
  return true;
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

function moveBucket(sourceId, targetId, kind = catalogView) {
  if (!sourceId || !targetId || sourceId === targetId) return false;
  if (kind === "topic") return moveGroup(sourceId, targetId);
  const activeReports = state.reports.filter((report) => !report.archived);
  const ids = classificationBuckets(activeReports)
    .filter((bucket) => bucket.kind === kind)
    .map((bucket) => bucket.id);
  const fromIndex = ids.indexOf(sourceId);
  const toIndex = ids.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0) return false;
  const [movedId] = ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, movedId);
  bucketOrder[kind] = ids;
  localStorage.setItem(BUCKET_ORDER_KEY, JSON.stringify(bucketOrder));
  return true;
}

function moveReport(reportId, targetGroupId, targetReportId = "") {
  const report = state.reports.find((item) => item.id === reportId);
  if (!report || report.archived) return false;
  const targetGroup = state.groups.find((group) => group.id === targetGroupId);
  if (!targetGroup) return false;
  const ordered = state.reports
    .filter((item) => !item.archived && item.groupId === targetGroupId && item.id !== reportId)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  const targetIndex = targetReportId
    ? ordered.findIndex((item) => item.id === targetReportId)
    : ordered.length;
  report.groupId = targetGroupId;
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

function addedTimeLabel(value) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return "新增时间待补";
  return `新增于 ${new Intl.DateTimeFormat("zh-CN", {
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
    const byDate = new Map();
    [...reports]
      .sort((a, b) => reportCreatedTime(b) - reportCreatedTime(a))
      .forEach((report) => {
        const key = localDateKey(report.createdAt);
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key).push(report);
      });
    return orderBuckets([...byDate.entries()].map(([key, items]) => ({
      id: key,
      name: dateBucketLabel(key),
      kind: "time",
      accent: "slate",
      reports: items,
    })), "time");
  }
  if (catalogView === "type") {
    return orderBuckets(WORK_TYPES
      .map((type) => ({
        id: type.id,
        name: type.name,
        kind: "type",
        accent: "blue",
        reports: reports
          .filter((report) => report.workType === type.id)
          .sort((a, b) =>
            Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
            new Date(b.createdAt) - new Date(a.createdAt)),
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
        reports: reports
          .filter((report) => (report.tags || []).includes(tag))
          .sort((a, b) =>
            Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
            new Date(b.createdAt) - new Date(a.createdAt)),
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

function assignReportToBucket(reportId, bucketKind, bucketId, targetReportId = "") {
  const report = state.reports.find((item) => item.id === reportId);
  if (!report || report.archived) return false;
  if (bucketKind === "topic") {
    return moveReport(reportId, bucketId, targetReportId);
  }
  if (bucketKind === "type") {
    if (!WORK_TYPES.some((item) => item.id === bucketId)) return false;
    report.workType = bucketId;
    saveState();
    return true;
  }
  if (bucketKind === "tag") {
    report.tags = Array.isArray(report.tags) ? report.tags : [];
    if (!report.tags.includes(bucketId)) report.tags.push(bucketId);
    saveState();
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

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.remove(), 2600);
}

function scrollPageTop(behavior = "auto") {
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior });
  });
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

function openReportInBrowser(report) {
  const target = report.url || localHtmlUrl(report);
  if (!target) return false;
  window.open(target, "_blank", "noopener,noreferrer");
  if (!report.url) window.setTimeout(() => URL.revokeObjectURL(target), 60000);
  return true;
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
  const sourceLabel = catalogView === "time"
    ? addedTimeLabel(report.createdAt)
    : report.source || "手动添加";
  const hasPreview = !restricted && initialState.reports.some((item) => item.id === report.id);
  const previewAsset = report.preview || `${report.id}.png`;
  const preview = localHtml && report.isHtml
    ? `<iframe class="local-html-preview-frame" title="${escapeHtml(report.title)}视觉预览"
        srcdoc="${escapeHtml(localHtml)}" sandbox="allow-scripts" loading="lazy"
        tabindex="-1" aria-hidden="true"></iframe>`
    : hasPreview
    ? `<img src="./previews/${escapeHtml(previewAsset)}" alt="" loading="lazy" decoding="async" />`
    : `
      <div class="preview-placeholder ${restricted ? "preview-restricted" : ""}">
        <span>${restricted ? "ACCESS" : escapeHtml(report.title.slice(0, 2))}</span>
        <strong>${restricted ? accessLabel : localSaved ? "本地内容" : "预览待补充"}</strong>
      </div>`;
  return `
    <article class="report-card ${restricted ? "restricted-card" : ""} ${archivedView ? "archived-card" : ""} ${movingReportId === report.id ? "is-move-selected" : ""}" data-report-id="${escapeHtml(report.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${escapeHtml(report.id)}" aria-label="打开${escapeHtml(report.title)}">
        <span class="report-preview">
          ${preview}
        </span>
        <span class="report-copy">
          <span class="report-source">${escapeHtml(sourceLabel)}</span>
          <strong>${escapeHtml(report.title)}</strong>
          ${(report.tags || []).length
            ? `<span class="report-tags">${report.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</span>`
            : ""}
          ${restricted ? `<span class="report-access-note">${escapeHtml(accessLabel)}</span>` : ""}
        </span>
      </button>
      ${archivedView || catalogView === "time" ? "" : `
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${escapeHtml(report.id)}"
          aria-label="拖动《${escapeHtml(report.title)}》到其他${currentBucketLabel()}" title="拖动到其他${currentBucketLabel()}">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${archivedView
          ? `
            <button type="button" data-action="restore" data-id="${escapeHtml(report.id)}">Restore</button>
            <button type="button" data-action="delete" data-id="${escapeHtml(report.id)}">Delete permanently</button>`
          : `
            <button type="button" class="tag-edit-action" data-action="edit-tags" data-id="${escapeHtml(report.id)}" title="编辑标签" aria-label="编辑标签">#</button>
            ${report.url ? `<button type="button" data-action="edit" data-id="${escapeHtml(report.id)}">Edit</button>` : ""}
            <button type="button" data-action="archive" data-id="${escapeHtml(report.id)}">Archive</button>`}
      </div>
    </article>`;
}

function modalMarkup() {
  if (!modal) return "";
  if (modal.type === "tags") {
    const report = state.reports.find((item) => item.id === modal.reportId);
    if (!report) return "";
    return `
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog tag-dialog" id="tag-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">REPORT TAGS</span>
              <h2>编辑关键标签</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <p class="tag-dialog-title">${escapeHtml(report.title)}</p>
          <label>标签
            <input name="tags" value="${escapeHtml((report.tags || []).join("、"))}" placeholder="例如：本体、飞书、调研" autofocus />
          </label>
          <div class="tag-suggestions">
            ${TAG_ORDER.map((tag) => `<button type="button" class="${(report.tags || []).includes(tag) ? "selected" : ""}" data-tag-suggestion="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">Cancel</button>
            <button type="submit" class="primary-button">Save tags</button>
          </div>
        </form>
      </div>`;
  }
  if (modal.type === "group") {
    const editingGroup = modal.mode === "edit"
      ? state.groups.find((group) => group.id === modal.groupId)
      : null;
    return `
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">WORK TOPIC / GROUP</span>
              <h2>${editingGroup ? "编辑工作主题" : "新建工作主题"}</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
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
  return `
    <div class="dialog-backdrop">
      <form class="dialog" id="report-form">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">${editing ? "EDIT REPORT" : "NEW REPORT"}</span>
            <h2>${editing ? "编辑服务报告" : "新增服务报告"}</h2>
          </div>
          <button type="button" data-action="close-modal">×</button>
        </div>
        <label>网站地址
          <div class="url-input-row">
            <input name="url" type="url" value="${escapeHtml(editing?.url || "")}" placeholder="https://..." required autofocus />
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
        <label>关键标签
          <input name="tags" value="${escapeHtml((editing?.tags || []).join("、"))}" placeholder="本体、飞书、调研" />
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">Cancel</button>
          <button type="submit" class="primary-button">Save</button>
        </div>
      </form>
    </div>`;
}

function gateMarkup() {
  return `
    <main class="gate-shell">
      <section class="gate-card">
        <div class="gate-brand">
          <div class="brand-mark">C</div>
          <span>PERSONAL STUDIO</span>
        </div>
        <h1>Clair's Studio</h1>
        <p>把思考、决策与成果，放在同一个地方。</p>
        <form class="login-form" id="login-form">
          <label class="sr-only" for="password">访问口令</label>
          <div class="password-row">
            <input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="访问口令" autofocus />
            <button type="submit" class="primary-button" aria-label="进入 Clair's Studio">→</button>
          </div>
          <p class="form-error" hidden></p>
        </form>
        <div class="gate-foot"><span>Light access gate</span><span>Local-only data</span></div>
      </section>
    </main>`;
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
          <span class="section-kicker">SAVED MATERIAL</span>
          <h1>${escapeHtml(report.title)}</h1>
          ${report.savedContent
            ? `<div class="saved-material-content">${escapeHtml(report.savedContent).replaceAll("\n", "<br />")}</div>`
            : ""}
          ${(report.savedFiles || []).length
            ? `<section class="saved-file-list">
                <strong>附件记录</strong>
                ${report.savedFiles.map((file) => `<span><b>${escapeHtml(file.name)}</b><small>${escapeHtml(file.sizeLabel || "")}</small></span>`).join("")}
              </section>`
            : ""}
          <p class="saved-material-note">内容保存在当前浏览器；原文件不会上传到 GitHub Pages。</p>
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
              data-id="${escapeHtml(report.id)}" aria-label="下载 HTML" title="下载 HTML">
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
    .filter((report) => reportMatchesQuery(report, query, {
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
          ${query ? '<button type="button" data-action="clear-search">Clear</button>' : ""}
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

function workbenchMarkup() {
  if (archiveView) return archiveMarkup();
  const normalized = normalizeSearchText(query);
  const activeReports = state.reports.filter((report) => !report.archived);
  const reports = normalized
    ? activeReports.filter((report) => reportMatchesQuery(report, normalized, {
      group: state.groups.find((group) => group.id === report.groupId),
      workTypeName: workTypeName(report.workType),
    }))
    : activeReports;
  const archiveCount = state.reports.filter((report) => report.archived).length;
  const productionCount = activeReports.filter((report) => report.access === "production").length;
  const restrictedCount = activeReports.filter((report) => report.access !== "production").length;
  const visibleBuckets = classificationBuckets(reports, normalized)
    .filter((bucket) =>
      bucket.reports.length ||
      movingReportId ||
      (catalogView === "topic" && !normalized));
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
          <div class="results-toolbar-side">
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" type="search" value="${escapeHtml(query)}"
                placeholder="Rediscover your work" aria-label="找到一个成果"
                autocomplete="off" spellcheck="false" enterkeyhint="search" />
              ${query ? '<button type="button" data-action="clear-search">Clear</button>' : ""}
            </label>
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${normalized ? reports.length : activeReports.length}</strong><span>${normalized ? "匹配" : "成果"}</span>
              <i></i>
              <strong>${state.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${productionCount}</strong><span>直达</span>
            </div>
          </div>
        </div>
        <section class="groups-section">
          ${movingReportId ? `
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${currentBucketLabel()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">Cancel</button>
            </div>` : ""}
          ${visibleBuckets.length ? `
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${viewName}">
                <div class="library-nav-controls">
                  <div class="library-view-switcher" role="tablist" aria-label="成果分类方式">
                    <button type="button" role="tab" aria-selected="${catalogView === "topic"}" class="${catalogView === "topic" ? "active" : ""}" data-action="set-view" data-id="topic">Topic</button>
                    <button type="button" role="tab" aria-selected="${catalogView === "type"}" class="${catalogView === "type" ? "active" : ""}" data-action="set-view" data-id="type">Type</button>
                    <button type="button" role="tab" aria-selected="${catalogView === "tag"}" class="${catalogView === "tag" ? "active" : ""}" data-action="set-view" data-id="tag">Tag</button>
                    <button type="button" role="tab" aria-selected="${catalogView === "time"}" class="${catalogView === "time" ? "active" : ""}" data-action="set-view" data-id="time">Time</button>
                  </div>
                  <button class="add-topic-icon" type="button" data-action="add-group"
                    aria-label="Add topic" title="Add topic">＋</button>
                </div>
                ${visibleBuckets.map((bucket, index) => `<a href="#bucket-${index}">${escapeHtml(bucket.name)}<span>${bucket.reports.length}</span></a>`).join("")}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>Archive</strong>
                  ${archiveCount ? `<em>${archiveCount}</em>` : ""}
                </button>
              </nav>
              <div class="board catalog-view-${catalogView}">
              ${visibleBuckets.map((bucket, index) => `
                <section id="bucket-${index}" class="group-column topic-section bucket-${escapeHtml(bucket.kind)} accent-${escapeHtml(bucket.accent || "blue")}"
                  data-bucket-kind="${escapeHtml(bucket.kind)}"
                  data-bucket-id="${escapeHtml(bucket.id)}"
                  data-group-id="${escapeHtml(bucket.id)}">
                  <header class="group-header">
                    <div class="group-heading-copy group-drag-handle" role="button" tabindex="0"
                      data-group-drag-id="${escapeHtml(bucket.id)}"
                      data-group-drag-kind="${escapeHtml(bucket.kind)}"
                      aria-label="Drag ${escapeHtml(bucket.name)} to reorder"
                      title="Drag to reorder · use left or right arrow keys">
                      <div><h2>${escapeHtml(bucket.name)}</h2></div>
                      <span class="count">${bucket.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${movingReportId ? `<button class="move-here-button" type="button" data-action="move-here" data-id="${escapeHtml(bucket.id)}" data-bucket-kind="${escapeHtml(bucket.kind)}">Move here</button>` : ""}
                      ${bucket.kind === "topic"
                        ? `<button type="button" data-action="add-to-group" data-id="${escapeHtml(bucket.id)}">Add report</button>
                           <button type="button" data-action="rename-group" data-id="${escapeHtml(bucket.id)}">Rename</button>
                           ${bucket.id !== "inbox" ? `<button type="button" data-action="delete-group" data-id="${escapeHtml(bucket.id)}">Delete</button>` : ""}`
                        : ""}
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
            <div><span>分类调整仅保存在当前浏览器</span><button type="button" data-action="lock">Sign out</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${modalMarkup()}
    </main>`;
}

function render() {
  const app = document.getElementById("app");
  if (sessionStorage.getItem(AUTH_KEY) !== "ok") {
    app.innerHTML = gateMarkup();
    bindGate();
    return;
  }
  const report = readerId && state.reports.find((item) => item.id === readerId);
  app.innerHTML = report ? readerMarkup(report) : workbenchMarkup();
  bindApp();
  bindTaskCenter({
    render,
    showToast,
    saveToLibrary: saveIntakeToLibrary,
  });
}

function bindGate() {
  const form = document.getElementById("login-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = new FormData(form).get("password");
    if (password !== "2026") {
      const error = form.querySelector(".form-error");
      error.hidden = false;
      error.textContent = "口令不正确，请再试一次";
      return;
    }
    sessionStorage.setItem(AUTH_KEY, "ok");
    render();
  });
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

function bindApp() {
  const searchInput = document.getElementById("search-input");
  searchInput?.addEventListener("input", (event) => {
    // 注音、拼音等输入法组合输入期间不能重绘，否则候选字会被逐键拆开。
    if (event.isComposing) return;
    query = event.target.value;
    const selectionStart = event.target.selectionStart;
    const selectionEnd = event.target.selectionEnd;
    render();
    const input = document.getElementById("search-input");
    input?.focus();
    input?.setSelectionRange(selectionStart, selectionEnd);
  });
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !query) return;
    event.preventDefault();
    query = "";
    render();
    document.getElementById("search-input")?.focus();
  });

  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", async (event) => {
      const action = event.currentTarget.dataset.action;
      const itemId = event.currentTarget.dataset.id;
      if (action === "scroll-top") {
        scrollPageTop("smooth");
      } else if (action === "open") {
        readerId = itemId;
        render();
        scrollPageTop();
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
        } else {
          await downloadPublishedReport(report, showToast);
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
        render();
        scrollPageTop();
      } else if (action === "lock") {
        sessionStorage.removeItem(AUTH_KEY);
        render();
      } else if (action === "clear-search") {
        query = "";
        render();
        document.getElementById("search-input")?.focus();
      } else if (action === "set-view") {
        if (!["topic", "type", "tag", "time"].includes(itemId)) return;
        catalogView = itemId;
        movingReportId = "";
        localStorage.setItem(VIEW_KEY, catalogView);
        render();
        scrollPageTop();
      } else if (action === "cancel-move") {
        movingReportId = "";
        render();
      } else if (action === "move-here") {
        const bucketKind = event.currentTarget.dataset.bucketKind || catalogView;
        if (movingReportId && assignReportToBucket(movingReportId, bucketKind, itemId)) {
          movingReportId = "";
          render();
          showToast(bucketKind === "tag" ? "已添加目标标签" : `报告已移入目标${currentBucketLabel()}`);
        }
      } else if (action === "show-archive") {
        archiveView = true;
        query = "";
        readerId = "";
        render();
        scrollPageTop();
      } else if (action === "show-catalog") {
        archiveView = false;
        query = "";
        readerId = "";
        render();
        scrollPageTop();
      } else if (action === "add-report") {
        modal = { type: "report", mode: "create", groupId: state.groups[1]?.id || state.groups[0]?.id };
        render();
      } else if (action === "add-to-group") {
        modal = { type: "report", mode: "create", groupId: itemId };
        render();
      } else if (action === "edit") {
        modal = { type: "report", mode: "edit", reportId: itemId };
        render();
      } else if (action === "edit-tags") {
        modal = { type: "tags", reportId: itemId };
        render();
      } else if (action === "close-modal") {
        modal = null;
        render();
      } else if (action === "detect-title") {
        await detectTitle(event.currentTarget.closest("form"));
      } else if (action === "archive") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report) return;
        report.archived = true;
        report.archivedAt = new Date().toISOString();
        saveState();
        render();
        showToast("已归档，可随时恢复");
      } else if (action === "restore") {
        const report = state.reports.find((item) => item.id === itemId);
        if (!report) return;
        report.archived = false;
        report.archivedAt = "";
        saveState();
        render();
        showToast("报告已恢复到原主题");
      } else if (action === "delete") {
        const report = state.reports.find((item) => item.id === itemId);
        if (report?.archived && confirm(`二次确认：永久删除“${report.title}”？\n\n删除后无法从归档区恢复。`)) {
          state.reports = state.reports.filter((item) => item.id !== itemId);
          if (readerId === itemId) readerId = "";
          saveState();
          render();
          showToast("报告已永久删除");
        }
      } else if (action === "add-group") {
        modal = { type: "group", mode: "create" };
        render();
      } else if (action === "rename-group") {
        const group = state.groups.find((item) => item.id === itemId);
        if (group) {
          modal = { type: "group", mode: "edit", groupId: itemId };
          render();
        }
      } else if (action === "delete-group") {
        const group = state.groups.find((item) => item.id === itemId);
        if (group && confirm(`删除“${group.name}”？其中的报告会移到“待整理”。`)) {
          state.reports.forEach((report) => {
            if (report.groupId === itemId) report.groupId = "inbox";
          });
          state.groups = state.groups.filter((item) => item.id !== itemId);
          saveState();
          render();
          showToast("分组已删除，报告已移到待整理");
        }
      }
    });
  });

  document.querySelector(".topbar")?.addEventListener("click", (event) => {
    if (event.target.closest("button, a")) return;
    scrollPageTop("smooth");
  });

  document.querySelectorAll(".report-drag-handle").forEach((handle) => {
    let pointerStart = null;
    let pointerMoved = false;
    const clearReportPointerDrag = () => {
      draggingId = "";
      pointerStart = null;
      pointerMoved = false;
      handle.closest(".report-card")?.classList.remove("is-dragging");
      document.querySelectorAll(".report-card, .group-column").forEach((element) => {
        element.classList.remove("is-card-drop-target", "is-drop-ready");
      });
    };
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      draggingId = handle.dataset.reportDragId;
      draggingGroupId = "";
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
      const hovered = document.elementFromPoint(event.clientX, event.clientY);
      const targetCard = hovered?.closest(".report-card");
      const targetColumn = hovered?.closest(".group-column");
      document.querySelectorAll(".report-card").forEach((card) => {
        card.classList.toggle(
          "is-card-drop-target",
          Boolean(targetCard && targetCard !== handle.closest(".report-card") && card === targetCard),
        );
      });
      document.querySelectorAll(".group-column").forEach((column) => {
        column.classList.toggle("is-drop-ready", Boolean(targetColumn && column === targetColumn));
      });
    });
    handle.addEventListener("pointerup", (event) => {
      if (!draggingId) return;
      const sourceId = draggingId;
      if (!pointerMoved) {
        movingReportId = sourceId;
        clearReportPointerDrag();
        render();
        showToast(`请选择目标${currentBucketLabel()}`);
        return;
      }
      const hovered = document.elementFromPoint(event.clientX, event.clientY);
      const targetCard = hovered?.closest(".report-card");
      const targetColumn = hovered?.closest(".group-column");
      const targetReportId = targetCard?.dataset.reportId || "";
      const targetBucketId = targetColumn?.dataset.bucketId || "";
      const targetBucketKind = targetColumn?.dataset.bucketKind || catalogView;
      const moved = targetReportId && targetReportId !== sourceId
        ? assignReportToBucket(sourceId, targetBucketKind, targetBucketId, targetReportId)
        : targetBucketId
          ? assignReportToBucket(sourceId, targetBucketKind, targetBucketId)
          : false;
      clearReportPointerDrag();
      if (moved) {
        render();
        showToast(
          targetBucketKind === "tag"
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

  document.querySelectorAll(".group-drag-handle").forEach((handle) => {
    const clearGroupPointerDrag = () => {
      draggingGroupId = "";
      handle.closest(".group-column")?.classList.remove("is-group-dragging");
      document.querySelectorAll(".group-column").forEach((column) => {
        column.classList.remove("is-group-drop-target", "is-drop-ready");
      });
    };
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      draggingGroupId = handle.dataset.groupDragId;
      draggingId = "";
      handle.setPointerCapture?.(event.pointerId);
      handle.closest(".group-column")?.classList.add("is-group-dragging");
    });
    handle.addEventListener("pointermove", (event) => {
      if (!draggingGroupId) return;
      document.querySelectorAll(".group-column").forEach((column) => {
        column.classList.toggle(
          "is-group-drop-target",
          column === document.elementFromPoint(event.clientX, event.clientY)?.closest(".group-column"),
        );
      });
    });
    handle.addEventListener("pointerup", (event) => {
      if (!draggingGroupId) return;
      const sourceId = draggingGroupId;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".group-column");
      if (target && moveBucket(
        sourceId,
        target.dataset.bucketId,
        target.dataset.bucketKind,
      )) {
        draggingGroupId = "";
        render();
        showToast("分组顺序已更新");
        return;
      }
      clearGroupPointerDrag();
    });
    handle.addEventListener("pointercancel", clearGroupPointerDrag);
    handle.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const columns = [...document.querySelectorAll(".group-column")];
      const currentIndex = columns.findIndex(
        (column) => column.dataset.bucketId === handle.dataset.groupDragId,
      );
      const targetIndex = event.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
      const target = columns[targetIndex];
      if (!target || !moveBucket(
        handle.dataset.groupDragId,
        target.dataset.bucketId,
        handle.dataset.groupDragKind,
      )) return;
      render();
      showToast("分组顺序已更新");
      document
        .querySelector(`[data-group-drag-id="${CSS.escape(handle.dataset.groupDragId)}"]`)
        ?.focus();
    });
  });

  document.querySelectorAll(".group-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add(
        draggingGroupId ? "is-group-drop-target" : "is-drop-ready",
      );
    });
    column.addEventListener("dragleave", () => {
      column.classList.remove("is-drop-ready", "is-group-drop-target");
    });
    column.addEventListener("drop", (event) => {
      event.preventDefault();
      if (draggingGroupId) {
        if (moveBucket(
          draggingGroupId,
          column.dataset.bucketId,
          column.dataset.bucketKind,
        )) {
          draggingGroupId = "";
          render();
          showToast("分组顺序已更新");
          return;
        }
        draggingGroupId = "";
        column.classList.remove("is-group-drop-target");
        return;
      }
      const report = state.reports.find((item) => item.id === draggingId);
      const bucketKind = column.dataset.bucketKind || catalogView;
      if (
        report &&
        assignReportToBucket(draggingId, bucketKind, column.dataset.bucketId)
      ) {
        draggingId = "";
        render();
        showToast(
          bucketKind === "tag"
            ? "已添加目标标签"
            : bucketKind === "type"
              ? "工作类型已更新"
              : "已移入新主题",
        );
      }
      draggingId = "";
    });
  });

  document.querySelectorAll("[data-tag-suggestion]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.querySelector('#tag-form input[name="tags"]');
      if (!input) return;
      const tags = parseTags(input.value);
      const suggestion = button.dataset.tagSuggestion;
      input.value = tags.includes(suggestion)
        ? tags.filter((tag) => tag !== suggestion).join("、")
        : [...tags, suggestion].slice(0, 8).join("、");
      button.classList.toggle("selected", !tags.includes(suggestion));
      input.focus();
    });
  });

  const tagForm = document.getElementById("tag-form");
  tagForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const report = state.reports.find((item) => item.id === modal.reportId);
    if (!report) return;
    report.tags = parseTags(new FormData(tagForm).get("tags"));
    saveState();
    modal = null;
    render();
    showToast("标签已更新");
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
    modal = null;
    render();
    showToast(message);
  });

  const reportForm = document.getElementById("report-form");
  reportForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const url = reportForm.elements.url.value.trim();
    if (!validUrl(url)) return;
    const submit = reportForm.querySelector('button[type="submit"]');
    const hint = reportForm.querySelector(".field-hint");
    submit.disabled = true;
    submit.innerHTML = '<span class="mini-spinner"></span>';
    const editingId = modal.mode === "edit" ? modal.reportId : "";
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
    const tags = [...new Set([
      ...inferTags(saveMetadata, workType),
      ...manualTags,
    ])].slice(0, 8);
    if (modal.mode === "edit") {
      const report = state.reports.find((item) => item.id === modal.reportId);
      Object.assign(report, saveMetadata, { tags });
    } else {
      const newReport = {
        id: id("report"),
        groupId,
        ...saveMetadata,
        pinned: false,
        position: state.reports.filter((report) => report.groupId === groupId).length,
        createdAt: new Date().toISOString(),
        archived: false,
        archivedAt: "",
        tags,
      };
      state.reports.push(newReport);
    }
    saveState();
    modal = null;
    render();
    showToast("报告已保存");
  });

  const activeReport = readerId && state.reports.find((item) => item.id === readerId);
  if (activeReport) bindReportEditor(activeReport);
}

export function renderApp() {
  render();
}
