// The personal home references the existing catalog so edits, archives and
// report access continue to follow the same records as the full library.
export const PERSONAL_VISITS_KEY = "clair-personal-home-recent-v1";

export const PERSONAL_AREAS = Object.freeze([
  {
    id: "xiaogu", number: "01", title: "小顾介绍", category: "AI 投资助手",
    description: "从认识小顾开始，了解它如何回答问题、理解需求与陪伴投资。",
    theme: "lilac", icon: "spark", primary: { reportId: "seed-xiaogu", label: "打开介绍" },
    meta: "介绍文案 · 2026.07.27",
    links: [{ reportId: "xiaogu-3-investment-review-2026-09-04", label: "小顾 3.0 产品理念" }, { reportId: "ai-xiaogu-product-handbook-2026-10-13", label: "产品手册" }],
    visual: ["理解需求", "专业解答", "持续陪伴"],
  },
  {
    id: "qieman", number: "02", title: "且慢介绍", category: "买方投顾服务",
    description: "认识且慢的服务理念，了解四笔钱与面向生活目标的财富安排。",
    theme: "green", icon: "leaf", primary: { url: "https://qieman.com/", label: "访问且慢官网" },
    meta: "官网介绍 · 功能研究",
    links: [{ reportId: "qieman-app-map", label: "APP 功能全景" }],
    visual: ["活钱", "稳钱", "长钱", "保险"],
  },
  {
    id: "yingmi-ai", number: "03", title: "盈米 AI 介绍", category: "企业 AI 能力全景",
    description: "串起客户服务、投研、内容与工程场景，查看共用的技术能力与协作方式。",
    theme: "blue", icon: "orbit", primary: { reportId: "yingmi-ai-capabilities-2026-10-27", label: "打开能力全景" },
    meta: "全场景介绍 · 2026.10.27",
    links: [], visual: ["客户服务", "业务协作", "技术底座"],
  },
  {
    id: "open-platform", number: "04", title: "开放平台介绍", category: "专业金融能力开放",
    description: "查看 MCP、Skills、Agents 的能力结构，以及面向外部平台的接入与合作方式。",
    theme: "sand", icon: "nodes", primary: { reportId: "yingmi-ai-open-platform-intro-2026-10-22", label: "打开平台介绍" },
    meta: "产品与合作介绍 · 2026.10.22",
    links: [{ reportId: "oap-journey-metrics-2026-08-02", label: "平台发展与指标" }],
    visual: ["MCP", "Skills", "Agents"],
  },
  {
    id: "advisor", number: "05", title: "投顾工作台", category: "项目资料夹",
    description: "围绕客户、任务和服务流程，把工作台演示、项目提报与落地方案放在一起。",
    theme: "green", icon: "panel", primary: { reportId: "yingmi-advisor-workbench-2026-09-10", label: "打开交互演示" },
    meta: "演示使用合成数据，未接生产接口", status: "方案与交互演示", project: true,
    links: [{ reportId: "advisorflow-l3-application-2026-10-21", label: "AdvisorFlow · L3 申报" }, { reportId: "qieman-advisor-l3-project-proposals-2026-10-20", label: "12 个场景与项目建议书" }],
    visual: ["客户", "机会", "任务", "服务"],
  },
  {
    id: "qianwen-xiaogu", number: "06", title: "千问小顾智能运营转化项目", category: "项目资料夹",
    description: "从资金安排与攒钱目标切入，推进千问到且慢的跨端续办与转化实验设计。",
    theme: "lilac", icon: "path", primary: { reportId: "qianwen-xiaogu-l3-l4-conversion-2026-10-20", label: "打开转化方案" },
    meta: "产品评审方案 · 2026.10.20 · 效果待实验验证", status: "方案与原型", project: true,
    links: [{ reportId: "qianwen-user-acquisition-dashboard", label: "千问引流分析看板" }, { reportId: "qianwen-first-investor-cases-2026-09-17", label: "用户转化个例分析" }],
    visual: ["识别需求", "形成计划", "跨端续办"],
  },
]);

const ICONS = {
  spark: '<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z"/><path d="m20 3 .8 2.2L23 6l-2.2.8L20 9l-.8-2.2L17 6l2.2-.8Z"/>',
  leaf: '<path d="M20 4c0 11-4 16-10 16a6 6 0 0 1-6-6C4 8 9 4 20 4Z"/><path d="M4 21 15 10M9 16v-5m0 5h5"/>',
  orbit: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-35 12 12)"/><path d="M9 3c4-1 7 3 8 8s0 9-3 10M7 7c-1 5 1 12 5 14"/>',
  nodes: '<rect x="9" y="9" width="6" height="6" rx="1.5"/><path d="M12 9V5m0 10v4M9 12H5m10 0h4"/><circle cx="12" cy="3" r="2"/><circle cx="12" cy="21" r="2"/><circle cx="3" cy="12" r="2"/><circle cx="21" cy="12" r="2"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11m4-7h4m-4 3h4"/>',
  path: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h7a4 4 0 0 1 0 8h-4a2 2 0 0 0 0 4h7m-3-3 3 3-3 3"/>',
};
const arrow = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>';
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.panel}</svg>`;

export function recentPersonalVisits(storage) {
  try {
    const ids = JSON.parse(storage.getItem(PERSONAL_VISITS_KEY) || "[]");
    return Array.isArray(ids) ? [...new Set(ids.filter((id) => typeof id === "string"))].slice(0, 4) : [];
  } catch { return []; }
}

export function rememberPersonalVisit(storage, id) {
  try { storage.setItem(PERSONAL_VISITS_KEY, JSON.stringify([id, ...recentPersonalVisits(storage).filter((value) => value !== id)].slice(0, 4))); } catch { /* Recent items are optional. */ }
}

export function personalHomeMarkup({ reports, escapeHtml: e, topbar, storage }) {
  const active = new Map(reports.filter((report) => !report.archived).map((report) => [report.id, report]));
  const resource = (item, className = "") => {
    if (item.url) return `<a class="${className}" href="${e(item.url)}" target="_blank" rel="noopener noreferrer">${e(item.label)}${arrow}</a>`;
    const report = active.get(item.reportId);
    if (!report) return "";
    return `<button type="button" class="${className}" data-action="open" data-id="${e(report.id)}" title="${e(report.title)}">${e(item.label)}${arrow}</button>`;
  };
  const card = (area) => `
    <article id="personal-${area.id}" class="personal-card personal-${area.theme} ${area.project ? "personal-project" : ""}">
      <div class="personal-card-head"><span class="personal-icon">${icon(area.icon)}</span><span>${area.project ? e(area.status) : e(area.category)}</span><span class="personal-number">${area.number}</span></div>
      <h3>${e(area.title)}</h3>
      <p class="personal-description">${e(area.description)}</p>
      <div class="personal-visual ${area.project ? "is-flow" : ""}" aria-label="${e(area.visual.join("、"))}">${area.visual.map((label, i) => `<span>${e(label)}</span>${area.project && i < area.visual.length - 1 ? '<i aria-hidden="true">→</i>' : ""}`).join("")}</div>
      <div class="personal-resources">${area.links.map((link) => resource(link, "personal-resource")).join("")}</div>
      <div class="personal-card-foot"><span>${e(area.meta)}</span>${resource(area.primary, "personal-primary") || '<button class="personal-primary" type="button" data-action="show-archive">查看归档 →</button>'}</div>
    </article>`;
  const recent = recentPersonalVisits(storage).map((id) => active.get(id)).filter(Boolean);
  return `<main class="app-shell personal-shell">
    ${topbar}
    <div class="personal-workspace">
      <header class="personal-hero">
        <div><div class="personal-eyebrow"><span></span> MY WORKSPACE</div><h1>个人工作台<span>把重要的工作，放在手边。</span></h1><p>常用介绍、重点项目与经营看板，从这里开始。</p></div>
        <form class="personal-search" data-personal-search role="search"><label for="personal-search-input">查找更多成果</label><div><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input id="personal-search-input" name="query" type="search" placeholder="搜索报告、方案、工具…" autocomplete="off" required/><button type="submit" aria-label="搜索全部成果">${arrow}</button></div></form>
      </header>
      <nav class="personal-jump-nav" aria-label="个人工作入口">${PERSONAL_AREAS.map((area) => `<a href="#personal-${area.id}"><span>${area.number}</span>${e(area.title.replace("智能运营转化项目", "项目"))}</a>`).join("")}</nav>
      <section class="personal-section" aria-labelledby="personal-intros-title"><div class="personal-section-title"><div><span>01 — REFERENCE</span><h2 id="personal-intros-title">介绍材料</h2></div><p>认识产品与能力，一键找到常用介绍。</p></div><div class="personal-intro-grid">${PERSONAL_AREAS.filter((area) => !area.project).map(card).join("")}</div></section>
      <section class="personal-section" aria-labelledby="personal-projects-title"><div class="personal-section-title"><div><span>02 — PROJECTS</span><h2 id="personal-projects-title">重点项目</h2></div><p>方案、演示、看板，沿着项目继续推进。</p></div><div class="personal-project-grid">${PERSONAL_AREAS.filter((area) => area.project).map(card).join("")}</div></section>
      ${recent.length ? `<section class="personal-recent" aria-labelledby="personal-recent-title"><div><h2 id="personal-recent-title">最近打开</h2><span>保存在当前浏览器</span></div><div>${recent.map((report) => resource({ reportId: report.id, label: report.title }, "personal-recent-link")).join("")}</div></section>` : ""}
      <div class="personal-library-callout"><div><strong>还有更多积累，随时回去找。</strong><p>全部成果库保留原有搜索、分类、收藏和归档。</p></div><button type="button" data-action="show-catalog">进入全部成果 ${arrow}</button></div>
      <footer class="personal-footer"><span>CLAIR'S STUDIO</span><span>个人工作入口 · 2026.10.28 整理</span></footer>
    </div>
  </main>`;
}
