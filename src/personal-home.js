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

export function personalLaunchpadMarkup({ reports, escapeHtml: e, storage }) {
  const active = new Map(reports.filter((report) => !report.archived).map((report) => [report.id, report]));
  const resource = (item, inner, className) => {
    if (item.url) return `<a class="${className}" href="${e(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(item.label)}">${inner}</a>`;
    const report = active.get(item.reportId);
    if (!report) return "";
    return `<button type="button" class="${className}" data-action="open" data-id="${e(report.id)}" title="${e(report.title)}" aria-label="${e(item.label)}">${inner}</button>`;
  };
  const card = (area) => {
    const content = `<span class="studio-shortcut-icon">${icon(area.icon)}</span><span class="studio-shortcut-copy"><span class="studio-shortcut-title">${e(area.title)}</span><span class="studio-shortcut-description">${e(area.project ? area.status : area.category)}</span></span>${arrow}`;
    return `<article class="studio-shortcut studio-shortcut-${area.theme}" id="personal-${area.id}">
      ${resource({...area.primary, label:area.primary.url ? area.primary.label : `打开${area.title}`},content,"studio-shortcut-main") || `<button type="button" class="studio-shortcut-main" data-action="show-archive">${content}</button>`}
      <div class="studio-shortcut-links">${area.links.map((link) => resource(link,e(link.label),"studio-shortcut-link")).join("") || `<span class="studio-shortcut-meta">${e(area.meta)}</span>`}</div>
    </article>`;
  };
  const recent = recentPersonalVisits(storage).map((id) => active.get(id)).filter(Boolean).slice(0,3);
  return `<section class="studio-shortcuts" id="studio-shortcuts" aria-labelledby="studio-shortcuts-title">
    <div class="studio-shortcuts-heading"><h1 id="studio-shortcuts-title">常用入口</h1><span>介绍材料与重点项目</span></div>
    <div class="studio-shortcuts-grid">${PERSONAL_AREAS.map(card).join("")}</div>
    ${recent.length ? `<div class="studio-shortcut-recent"><span>最近打开</span><div>${recent.map((report) => resource({reportId:report.id,label:report.title},e(report.title),"studio-recent-link")).join("")}</div></div>` : ""}
  </section>`;
}
