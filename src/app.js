const STORAGE_KEY = "clair-service-report-workbench-v1";
const AUTH_KEY = "clair-service-report-workbench-access";
const DATA_VERSION = 3;

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
let draggingId = "";
let draggingGroupId = "";
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
        position: initialState.groups.length + index,
      });
    });
  groups.sort((a, b) => (a.position || 0) - (b.position || 0));

  const knownReportGroups = {
    "seed-mcp-benchmark": "ai-platform",
    "seed-fund-report": "research",
    "seed-agreement": "ai-platform",
    "seed-xiaogu": "xiaogu",
    "seed-strategy": "research",
    "seed-ecosystem": "ai-platform",
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
      groupId: groups.some((group) => group.id === savedReport.groupId)
        ? savedReport.groupId
        : report.groupId,
      pinned: Boolean(savedReport.pinned),
      position: Number.isFinite(savedReport.position)
        ? savedReport.position
        : report.position,
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
    groups,
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

function dateLabel(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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

function cardMarkup(report, pinnedView = false) {
  const accessLabel = report.access === "org"
    ? "需组织登录"
    : report.access === "account"
      ? "需账号登录"
      : "生产可访问";
  return `
    <article class="report-card ${pinnedView ? "pinned-card" : ""}" draggable="true" data-report-id="${escapeHtml(report.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${escapeHtml(report.id)}">
        <span class="report-icon">${escapeHtml(report.title.slice(0, 1))}</span>
        <span class="report-copy">
          <strong>${escapeHtml(report.title)}</strong>
          <span>${escapeHtml(domainOf(report.url))}</span>
        </span>
        <span class="open-arrow" aria-hidden="true">↗</span>
      </button>
      <div class="card-meta">
        <span>${escapeHtml(dateLabel(report.createdAt))}</span>
        <span class="source-badge">${escapeHtml(report.source || "手动添加")}</span>
        <span class="access-badge ${report.access !== "production" ? "access-org" : ""}">${accessLabel}</span>
        <span class="drag-hint" title="拖动到其他分组">⠿ 拖动</span>
        <a class="external-link" href="${escapeHtml(report.url)}" target="_blank" rel="noreferrer" title="在新窗口打开">新窗口 ↗</a>
        <div class="card-actions">
          <button type="button" data-action="pin" data-id="${escapeHtml(report.id)}" title="${report.pinned ? "取消置顶" : "置顶"}">${report.pinned ? "★" : "☆"}</button>
          <button type="button" data-action="edit" data-id="${escapeHtml(report.id)}">编辑</button>
          <button type="button" data-action="delete" data-id="${escapeHtml(report.id)}">删除</button>
        </div>
      </div>
    </article>`;
}

function modalMarkup() {
  if (!modal) return "";
  if (modal.type === "group") {
    return `
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div><span class="section-kicker">NEW COLLECTION</span><h2>新增分组</h2></div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <label>分组名称
            <input name="name" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>分组说明
            <input name="description" placeholder="这个分组主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">创建分组</button>
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
        <span class="eyebrow">CLAIR · PERSONAL WORKSPACE</span>
        <h1>Clair的工作台</h1>
        <p>产品方案、服务报告、投研结论与知识资产，一个入口持续管理。</p>
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
  return `
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${escapeHtml(report.title)}</strong>
          <span>${escapeHtml(domainOf(report.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="quiet-button" href="${escapeHtml(report.url)}" target="_blank" rel="noreferrer">新窗口 ↗</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${escapeHtml(report.id)}">编辑</button>
        </div>
      </header>
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${escapeHtml(report.title)}" src="${escapeHtml(report.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>
      ${modalMarkup()}
    </main>`;
}

function workbenchMarkup() {
  const normalized = query.trim().toLowerCase();
  const reports = normalized
    ? state.reports.filter((report) =>
      `${report.title} ${report.url} ${report.source || ""} ${report.access || ""}`
        .toLowerCase()
        .includes(normalized))
    : state.reports;
  const pinned = reports
    .filter((report) => report.pinned)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const productionCount = state.reports.filter((report) => report.access === "production").length;
  const restrictedCount = state.reports.filter((report) => report.access !== "production").length;
  return `
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark small">C</div>
          <div><strong>Clair的工作台</strong><span>Product · AI · Wealth</span></div>
        </div>
        <label class="search"><span aria-hidden="true">⌕</span>
          <input id="search-input" value="${escapeHtml(query)}" placeholder="搜索报告名称或网址" aria-label="搜索报告" />
          ${query ? '<button type="button" data-action="clear-search">清除</button>' : ""}
        </label>
        <div class="top-actions">
          <button class="quiet-button desktop-only" type="button" data-action="lock">锁定</button>
          <button class="primary-button" type="button" data-action="add-report"><span aria-hidden="true">＋</span>新增报告</button>
        </div>
      </header>
      <section class="workspace">
        <div class="hero-row">
          <div><span class="eyebrow">PRODUCTION CATALOG · VERIFIED 2026-07-29</span><h1>把每天的产品判断，<br />沉淀成工作资产。</h1><p>已整合且慢产品研究库与最近一个月的生产产出；重复版本、失效页面和仅本地草稿未进入主清单。</p></div>
          <div class="metrics">
            <div><strong>${state.reports.length}</strong><span>整理后产出</span></div>
            <div><strong>${productionCount}</strong><span>生产可访问</span></div>
            <div><strong>${restrictedCount}</strong><span>需账号权限</span></div>
          </div>
        </div>
        ${pinned.length ? `
          <section class="pinned-section">
            <div class="section-heading"><div><span class="section-kicker">PINNED</span><h2>置顶服务</h2></div><span>${pinned.length} 个常用入口</span></div>
            <div class="pinned-grid">${pinned.map((report) => cardMarkup(report, true)).join("")}</div>
          </section>` : ""}
        <section class="groups-section">
          <div class="section-heading"><div><span class="section-kicker">ROLE-BASED COLLECTIONS</span><h2>我的工作分组</h2></div><button class="text-button" type="button" data-action="add-group">＋ 新增分组</button></div>
          <div class="board">
            ${state.groups.map((group) => {
              const groupReports = reports
                .filter((report) => report.groupId === group.id)
                .sort((a, b) => (a.position || 0) - (b.position || 0));
              return `
                <section class="group-column accent-${escapeHtml(group.accent)}" data-group-id="${escapeHtml(group.id)}">
                  <header class="group-header" draggable="true" data-group-drag-id="${escapeHtml(group.id)}">
                    <div class="group-heading-copy">
                      <span class="accent-dot"></span>
                      <div><h3>${escapeHtml(group.name)}</h3><small>${escapeHtml(group.description || "自定义工作分组")}</small></div>
                      <span class="count">${groupReports.length}</span>
                    </div>
                    <div class="group-header-actions">
                      <button class="group-drag-handle" type="button" data-group-drag-id="${escapeHtml(group.id)}" title="拖动分组排序" aria-label="拖动分组：${escapeHtml(group.name)}">⠿</button>
                      <div class="group-menu">
                        <button type="button" data-action="rename-group" data-id="${escapeHtml(group.id)}">改名</button>
                        ${group.id !== "inbox" ? `<button type="button" data-action="delete-group" data-id="${escapeHtml(group.id)}">删除</button>` : ""}
                      </div>
                    </div>
                  </header>
                  <div class="group-cards">
                    ${groupReports.map((report) => cardMarkup(report)).join("")}
                    ${groupReports.length
                      ? `<button type="button" class="add-inline" data-action="add-to-group" data-id="${escapeHtml(group.id)}">＋ 添加到此分组</button>`
                      : `<button type="button" class="empty-drop" data-action="add-to-group" data-id="${escapeHtml(group.id)}"><span>拖报告到这里</span><small>或点击新增</small></button>`}
                  </div>
                </section>`;
            }).join("")}
            <button type="button" class="new-group-card" data-action="add-group"><span>＋</span><strong>新增分组</strong><small>让报告按你的方式归位</small></button>
          </div>
        </section>
      </section>
      <footer><span>CLAIR WORKSPACE · GITHUB PAGES</span><span>自动保存到当前浏览器</span></footer>
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
      } else if (action === "pin") {
        const report = state.reports.find((item) => item.id === itemId);
        if (report) report.pinned = !report.pinned;
        saveState();
        render();
        showToast(report?.pinned ? "报告已置顶" : "已取消置顶");
      } else if (action === "delete") {
        const report = state.reports.find((item) => item.id === itemId);
        if (report && confirm(`确定删除“${report.title}”吗？此操作不可撤销。`)) {
          state.reports = state.reports.filter((item) => item.id !== itemId);
          if (readerId === itemId) readerId = "";
          saveState();
          render();
          showToast("报告已删除");
        }
      } else if (action === "add-group") {
        modal = { type: "group" };
        render();
      } else if (action === "rename-group") {
        const group = state.groups.find((item) => item.id === itemId);
        const name = group && prompt("新的分组名称", group.name);
        if (name?.trim()) {
          group.name = name.trim().slice(0, 60);
          saveState();
          render();
          showToast("分组名称已更新");
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

  document.querySelectorAll(".report-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      draggingId = card.dataset.reportId;
      draggingGroupId = "";
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggingId);
      card.classList.add("is-dragging");
    });
    card.addEventListener("dragend", () => {
      draggingId = "";
      card.classList.remove("is-dragging");
    });
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
  });

  document.querySelectorAll(".group-header").forEach((header) => {
    header.addEventListener("dragstart", (event) => {
      draggingGroupId = header.dataset.groupDragId;
      draggingId = "";
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggingGroupId);
      header.closest(".group-column")?.classList.add("is-group-dragging");
    });
    header.addEventListener("dragend", () => {
      draggingGroupId = "";
      header.closest(".group-column")?.classList.remove("is-group-dragging");
      document.querySelectorAll(".group-column").forEach((column) => {
        column.classList.remove("is-group-drop-target", "is-drop-ready");
      });
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
      if (report) {
        report.groupId = column.dataset.groupId;
        report.position = Math.max(
          -1,
          ...state.reports.filter((item) => item.groupId === report.groupId).map((item) => item.position || 0),
        ) + 1;
        saveState();
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
    state.groups.push({
      id: id("group"),
      name: name.slice(0, 60),
      description: description?.slice(0, 80) || "自定义工作分组",
      accent: ["blue", "violet", "amber", "green"][state.groups.length % 4],
      position: state.groups.length,
    });
    saveState();
    modal = null;
    render();
    showToast("分组已新增");
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
