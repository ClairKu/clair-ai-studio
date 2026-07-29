import {
  bindTaskCenter,
  clearActiveTask,
  confirmedResultsMarkup,
  getTaskCounts,
  hasActiveTask,
  taskCenterMarkup,
} from "./task-center.js";

const STORAGE_KEY = "clair-service-report-workbench-v1";
const AUTH_KEY = "clair-service-report-workbench-access";
const DATA_VERSION = 5;

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
      id: "product-planning",
      name: "产品规划与需求评审",
      description: "PRD、原型、需求评审与体验优化",
      accent: "blue",
      position: 1,
    },
    {
      id: "xiaogu",
      name: "AI 小顾与且慢体验",
      description: "AI 小顾、且慢服务与对客体验",
      accent: "green",
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
      id: "research",
      name: "投研与服务内容",
      description: "基金研究、策略分析与服务报告",
      accent: "amber",
      position: 4,
    },
    {
      id: "knowledge",
      name: "SOUL 知识治理",
      description: "来源治理与可复用知识资产",
      accent: "slate",
      position: 5,
    },
    {
      id: "reporting",
      name: "经营汇报与协同",
      description: "周报、汇报、招聘与跨团队推进",
      accent: "blue",
      position: 6,
    },
  ],
  reports: [
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
      title: "OAP 汇报框架｜动因、成果、复盘与规划",
      url: "https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",
      pinned: false,
      position: 5,
      createdAt: "2026-07-28T08:30:00.000Z",
      source: "近月新增",
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
  ],
};

let state = loadState();
let query = "";
let readerId = "";
let activeView = "tasks";
let archiveView = false;
let draggingId = "";
let draggingGroupId = "";
let movingReportId = "";
let modal = null;
let toastTimer = 0;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
    if (!savedGroup || saved.version < 2) return group;
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
      knownReportGroups[report.id] ||
      oldGroupFallback[report.groupId] ||
      report.groupId ||
      "inbox",
  }));
  const savedById = new Map(normalizedSavedReports.map((report) => [report.id, report]));
  const savedByUrl = new Map(
    normalizedSavedReports.map((report) => [normalizedUrl(report.url), report]),
  );
  const catalogUrls = new Set();
  const reports = catalog.reports.map((report) => {
    const reportUrl = normalizedUrl(report.url);
    catalogUrls.add(reportUrl);
    const savedReport = savedById.get(report.id) || savedByUrl.get(reportUrl);
    if (!savedReport) return report;
    return {
      ...report,
      title: savedReport.title || report.title,
      groupId: uniqueGroups.some((group) => group.id === savedReport.groupId)
        ? savedReport.groupId
        : report.groupId,
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
    if (catalogUrls.has(reportUrl)) return;
    catalogUrls.add(reportUrl);
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

function moveGroup(groupId, targetGroupId) {
  const fromIndex = state.groups.findIndex((group) => group.id === groupId);
  const toIndex = state.groups.findIndex((group) => group.id === targetGroupId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return false;
  const [movedGroup] = state.groups.splice(fromIndex, 1);
  state.groups.splice(toIndex, 0, movedGroup);
  saveState();
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

function cardMarkup(report, archivedView = false) {
  const restricted = report.access !== "production";
  const accessLabel = report.access === "org"
    ? "需组织登录"
    : report.access === "account"
      ? "需账号登录"
      : "生产可访问";
  const hasPreview = !restricted && initialState.reports.some((item) => item.id === report.id);
  const preview = hasPreview
    ? `<img src="./previews/${escapeHtml(report.id)}.png" alt="" loading="lazy" decoding="async" />`
    : `
      <div class="preview-placeholder ${restricted ? "preview-restricted" : ""}">
        <span>${restricted ? "ACCESS" : escapeHtml(report.title.slice(0, 2))}</span>
        <strong>${restricted ? accessLabel : "预览待补充"}</strong>
      </div>`;
  return `
    <article class="report-card ${restricted ? "restricted-card" : ""} ${archivedView ? "archived-card" : ""} ${movingReportId === report.id ? "is-move-selected" : ""}" data-report-id="${escapeHtml(report.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${escapeHtml(report.id)}" aria-label="打开${escapeHtml(report.title)}">
        <span class="report-preview">
          ${preview}
        </span>
        <span class="report-copy">
          <span class="report-source">${escapeHtml(report.source || "手动添加")}</span>
          <strong>${escapeHtml(report.title)}</strong>
          ${restricted ? `<span class="report-access-note">${escapeHtml(accessLabel)}</span>` : ""}
        </span>
      </button>
      ${archivedView ? "" : `
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${escapeHtml(report.id)}"
          aria-label="拖动《${escapeHtml(report.title)}》到其他工作主题" title="拖动到其他工作主题">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${archivedView
          ? `
            <button type="button" data-action="restore" data-id="${escapeHtml(report.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${escapeHtml(report.id)}">永久删除</button>`
          : `
            <button type="button" data-action="edit" data-id="${escapeHtml(report.id)}">编辑</button>
            <button type="button" data-action="archive" data-id="${escapeHtml(report.id)}">归档</button>`}
      </div>
    </article>`;
}

function modalMarkup() {
  if (!modal) return "";
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
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">${editingGroup ? "保存修改" : "创建主题"}</button>
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
            <button type="button" class="detect-button" data-action="detect-title">识别标题</button>
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
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">取消</button>
          <button type="submit" class="primary-button">保存</button>
        </div>
      </form>
    </div>`;
}

function gateMarkup() {
  return `
    <main class="gate-shell">
      <section class="gate-card">
        <div class="brand-mark">C</div>
        <span class="eyebrow">CLAIR · AI WORKSPACE</span>
        <h1>Clair的工作台</h1>
        <p>投入材料，完成关键任务，把确认后的结果沉淀为可复用成果。</p>
        <form class="login-form" id="login-form">
          <label for="password">访问口令</label>
          <div class="password-row">
            <input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="请输入口令" autofocus />
            <button type="submit" class="primary-button">进入工作台</button>
          </div>
          <p class="form-error" hidden></p>
        </form>
        <div class="gate-foot"><span>免平台登录</span><span>当前浏览器保存</span></div>
      </section>
    </main>`;
}

function readerMarkup(report) {
  const restricted = report.access !== "production";
  const accessLabel = report.access === "org" ? "组织账号" : "站点账号";
  const readerBody = restricted
    ? `
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${report.access === "org" ? "ORGANIZATION SIGN-IN" : "ACCOUNT SIGN-IN"}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该报告需要${accessLabel}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${accessLabel}登录，验证码与授权只在原网站处理。</small></div></li>
            <li><span>3</span><div><strong>继续查看报告</strong><small>登录成功后留在新窗口阅读，工作台仍保留在当前页。</small></div></li>
          </ol>
          <div class="login-handoff-actions">
            <a class="primary-button" href="${escapeHtml(report.url)}" target="_blank" rel="noreferrer">打开登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${escapeHtml(domainOf(report.url))}</p>
        </section>
      </div>`
    : `
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${escapeHtml(report.title)}" src="${escapeHtml(report.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>`;
  return `
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${escapeHtml(report.title)}</strong>
          <span>${escapeHtml(domainOf(report.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="${restricted ? "primary-button" : "quiet-button"}" href="${escapeHtml(report.url)}" target="_blank" rel="noreferrer">${restricted ? "登录打开 ↗" : "新窗口 ↗"}</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${escapeHtml(report.id)}">编辑</button>
        </div>
      </header>
      ${readerBody}
      ${modalMarkup()}
    </main>`;
}

function studioTopbarMarkup(archiveCount) {
  const taskCounts = getTaskCounts();
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair的工作台</strong><span>AI WORKSPACE</span></div>
      </div>
      <nav class="workspace-tabs" aria-label="工作台导航">
        <button type="button" data-action="show-tasks" class="${activeView === "tasks" && !archiveView ? "active" : ""}">
          任务中心${taskCounts.active ? `<span>${taskCounts.active}</span>` : ""}
        </button>
        <button type="button" data-action="show-results" class="${activeView === "results" && !archiveView ? "active" : ""}">
          成果区${taskCounts.confirmed ? `<span>${taskCounts.confirmed}</span>` : ""}
        </button>
      </nav>
      <div class="top-actions">
        ${activeView === "results" || archiveView
          ? `<button class="quiet-button archive-nav-button" type="button" data-action="${archiveView ? "show-results" : "show-archive"}">
              ${archiveView ? "返回成果区" : `归档${archiveCount ? `<span>${archiveCount}</span>` : ""}`}
            </button>
            ${archiveView ? "" : '<button class="primary-button" type="button" data-action="add-report">新增成果</button>'}`
          : '<button class="quiet-button" type="button" data-action="lock">退出</button>'}
      </div>
    </header>`;
}

function archiveMarkup() {
  const archivedReports = state.reports
    .filter((report) => report.archived)
    .filter((report) => {
      if (!query.trim()) return true;
      const normalized = query.trim().toLowerCase();
      return `${report.title} ${report.url} ${report.source || ""}`
        .toLowerCase()
        .includes(normalized);
    })
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
            <button class="quiet-button" type="button" data-action="${query ? "clear-search" : "show-catalog"}">${query ? "清除搜索" : "返回主目录"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Safe archive</span></footer>
      ${modalMarkup()}
    </main>`;
}

function workbenchMarkup() {
  if (archiveView) return archiveMarkup();
  if (hasActiveTask()) {
    return `
      <main class="app-shell">
        ${studioTopbarMarkup(state.reports.filter((report) => report.archived).length)}
        ${taskCenterMarkup(escapeHtml)}
        <footer><span>CLAIR'S WORKSPACE</span><span>Human in the loop · 2026-07-29</span></footer>
      </main>`;
  }
  if (activeView === "tasks") {
    return `
      <main class="app-shell">
        ${studioTopbarMarkup(state.reports.filter((report) => report.archived).length)}
        ${taskCenterMarkup(escapeHtml)}
        <footer><span>CLAIR'S WORKSPACE</span><span>Human in the loop · 2026-07-29</span></footer>
        ${modalMarkup()}
      </main>`;
  }
  const normalized = query.trim().toLowerCase();
  const activeReports = state.reports.filter((report) => !report.archived);
  const reports = normalized
    ? activeReports.filter((report) =>
      `${report.title} ${report.url} ${report.source || ""} ${report.access || ""}`
        .toLowerCase()
        .includes(normalized))
    : activeReports;
  const archiveCount = state.reports.filter((report) => report.archived).length;
  const productionCount = activeReports.filter((report) => report.access === "production").length;
  const restrictedCount = activeReports.filter((report) => report.access !== "production").length;
  const visibleGroups = state.groups
    .map((group) => ({
      ...group,
      reports: reports
        .filter((report) => report.groupId === group.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0)),
    }))
    .filter((group) =>
      !normalized ||
      group.reports.length ||
      `${group.name} ${group.description || ""}`.toLowerCase().includes(normalized));
  return `
    <main class="app-shell">
      ${studioTopbarMarkup(archiveCount)}
      <section class="workspace">
        <div class="results-toolbar">
          <div><span class="eyebrow">RESULTS</span><h1>成果区</h1></div>
          <label class="search results-search">
            <input id="search-input" value="${escapeHtml(query)}" placeholder="搜索成果" aria-label="搜索成果" />
            ${query ? '<button type="button" data-action="clear-search">清除</button>' : ""}
          </label>
        </div>
        ${confirmedResultsMarkup(escapeHtml)}
        <div class="hero-row">
          <div class="hero-copy">
            <span class="eyebrow">PUBLISHED WORK</span>
            <h1>已发布成果</h1>
            <p>按工作主题整理，可拖动分组与内容。</p>
          </div>
          <div class="studio-summary" aria-label="报告统计">
            <strong>${activeReports.length}</strong>
            <span>份成果</span>
            <i></i>
            <strong>${visibleGroups.length}</strong>
            <span>个主题</span>
            <i></i>
            <strong>${productionCount}</strong>
            <span>可直接访问</span>
          </div>
        </div>
        <section class="groups-section">
          ${movingReportId ? `
            <div class="move-mode-banner" role="status">
              <div><strong>正在移动报告</strong><span>选择目标主题的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>` : ""}
          <div class="collection-toolbar">
            <div>
              <span class="section-kicker">WORK TOPICS</span>
              <h2>工作主题与分组</h2>
              <p>拖动卡片可调整顺序或移入其他主题；拖动主题标题左侧把手可调整主题顺序。</p>
            </div>
            <button class="primary-button" type="button" data-action="add-group">＋ 新建工作主题</button>
          </div>
          ${visibleGroups.length ? `
            <nav class="topic-nav" aria-label="报告主题">
              ${visibleGroups.map((group) => `<a href="#topic-${escapeHtml(group.id)}">${escapeHtml(group.name)}<span>${group.reports.length}</span></a>`).join("")}
            </nav>
            <div class="board">
              ${visibleGroups.map((group, index) => `
                <section id="topic-${escapeHtml(group.id)}" class="group-column topic-section accent-${escapeHtml(group.accent)}" data-group-id="${escapeHtml(group.id)}">
                  <header class="group-header">
                    <span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${escapeHtml(group.id)}"
                      aria-label="拖动“${escapeHtml(group.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                      <span aria-hidden="true">⠿</span>
                      <small>${String(index + 1).padStart(2, "0")}</small>
                    </span>
                    <div class="group-heading-copy">
                      <div><h2>${escapeHtml(group.name)}</h2><p>${escapeHtml(group.description || "自定义工作主题")}</p></div>
                      <span class="count">${group.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${movingReportId ? `<button class="move-here-button" type="button" data-action="move-here" data-id="${escapeHtml(group.id)}">移到这里</button>` : ""}
                      <button type="button" data-action="add-to-group" data-id="${escapeHtml(group.id)}">添加报告</button>
                      <button type="button" data-action="rename-group" data-id="${escapeHtml(group.id)}">编辑主题</button>
                      ${group.id !== "inbox" ? `<button type="button" data-action="delete-group" data-id="${escapeHtml(group.id)}">删除</button>` : ""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${group.reports.length
                      ? group.reports.map((report) => cardMarkup(report)).join("")
                      : `<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${escapeHtml(group.id)}">
                          <strong>拖报告到这里</strong>
                          <span>或点击添加第一份报告</span>
                        </button>`}
                  </div>
                </section>`).join("")}
            </div>` : `
            <div class="no-results">
              <strong>没有找到相关报告</strong>
              <button type="button" data-action="clear-search">清除搜索</button>
            </div>`}
          <div class="catalog-note">
            <span>${restrictedCount} 份报告需要组织或账号登录${archiveCount ? ` · ${archiveCount} 份已安全归档` : ""}</span>
            <div><span>主题与卡片顺序仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Production archive · 2026-07-29</span></footer>
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
    escapeHtml,
    showToast,
    showResults: () => {
      activeView = "results";
      archiveView = false;
    },
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
    const metadataUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
    const response = await fetch(metadataUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("read failed");
    const payload = await response.json();
    const title = payload?.data?.title?.trim() || domainOf(url);
    titleInput.value = title.slice(0, 180);
    hint.textContent = "已识别网页标题";
    return titleInput.value;
  } catch {
    const fallback = domainOf(url);
    titleInput.value ||= fallback;
    hint.textContent = "网页暂时无法读取，已用域名作为标题，你可以手动修改";
    return titleInput.value;
  } finally {
    button.disabled = false;
    button.textContent = "识别标题";
  }
}

function bindApp() {
  document.getElementById("search-input")?.addEventListener("input", (event) => {
    query = event.target.value;
    render();
    const input = document.getElementById("search-input");
    input?.focus();
    input?.setSelectionRange(query.length, query.length);
  });

  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", async (event) => {
      const action = event.currentTarget.dataset.action;
      const itemId = event.currentTarget.dataset.id;
      if (action === "open") {
        readerId = itemId;
        render();
      } else if (action === "back") {
        readerId = "";
        modal = null;
        render();
      } else if (action === "lock") {
        sessionStorage.removeItem(AUTH_KEY);
        render();
      } else if (action === "clear-search") {
        query = "";
        render();
      } else if (action === "cancel-move") {
        movingReportId = "";
        render();
      } else if (action === "move-here") {
        if (movingReportId && moveReport(movingReportId, itemId)) {
          movingReportId = "";
          render();
          showToast("报告已移入目标主题");
        }
      } else if (action === "show-tasks") {
        activeView = "tasks";
        archiveView = false;
        readerId = "";
        clearActiveTask();
        render();
      } else if (action === "show-results") {
        activeView = "results";
        archiveView = false;
        readerId = "";
        query = "";
        clearActiveTask();
        render();
      } else if (action === "show-archive") {
        activeView = "results";
        archiveView = true;
        query = "";
        readerId = "";
        render();
      } else if (action === "show-catalog") {
        archiveView = false;
        query = "";
        readerId = "";
        render();
      } else if (action === "add-report") {
        modal = { type: "report", mode: "create", groupId: state.groups[1]?.id || state.groups[0]?.id };
        render();
      } else if (action === "add-to-group") {
        modal = { type: "report", mode: "create", groupId: itemId };
        render();
      } else if (action === "edit") {
        modal = { type: "report", mode: "edit", reportId: itemId };
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
        showToast("请选择目标主题");
        return;
      }
      const hovered = document.elementFromPoint(event.clientX, event.clientY);
      const targetCard = hovered?.closest(".report-card");
      const targetColumn = hovered?.closest(".group-column");
      const targetReportId = targetCard?.dataset.reportId || "";
      const targetGroupId = targetColumn?.dataset.groupId || "";
      const moved = targetReportId && targetReportId !== sourceId
        ? moveReport(sourceId, targetGroupId, targetReportId)
        : targetGroupId
          ? moveReport(sourceId, targetGroupId)
          : false;
      clearReportPointerDrag();
      if (moved) {
        render();
        showToast(targetReportId ? "报告顺序已更新" : "已移入新主题");
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
      if (target && moveGroup(sourceId, target.dataset.groupId)) {
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
      const currentIndex = state.groups.findIndex(
        (group) => group.id === handle.dataset.groupDragId,
      );
      const targetIndex = event.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
      const targetGroup = state.groups[targetIndex];
      if (!targetGroup || !moveGroup(handle.dataset.groupDragId, targetGroup.id)) return;
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
        if (moveGroup(draggingGroupId, column.dataset.groupId)) {
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
      if (report && moveReport(draggingId, column.dataset.groupId)) {
        draggingId = "";
        render();
        showToast("已移入新分组");
      }
      draggingId = "";
    });
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
    submit.disabled = true;
    submit.innerHTML = '<span class="mini-spinner"></span>';
    let title = reportForm.elements.title.value.trim();
    if (!title) title = await detectTitle(reportForm);
    const groupId = reportForm.elements.groupId.value;
    if (modal.mode === "edit") {
      const report = state.reports.find((item) => item.id === modal.reportId);
      Object.assign(report, { title, url, groupId });
    } else {
      state.reports.push({
        id: id("report"),
        groupId,
        title: title || domainOf(url),
        url,
        pinned: false,
        position: state.reports.filter((report) => report.groupId === groupId).length,
        createdAt: new Date().toISOString(),
        source: "手动添加",
        access: "production",
        archived: false,
        archivedAt: "",
      });
    }
    saveState();
    modal = null;
    render();
    showToast("报告已保存");
  });
}

export function renderApp() {
  render();
}
