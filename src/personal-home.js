// The personal home references the existing catalog so edits, archives and
// report access continue to follow the same records as the full library.
export const PERSONAL_VISITS_KEY = "clair-personal-home-recent-v1";

export const PERSONAL_AREAS = Object.freeze([
  {
    id: "yingmi-ai", title: "盈米 AI", theme: "blue", icon: "orbit",
    links: [
      { url: "https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-catalog-2026-11-10/?v=public-20261111", label: "能力清单", accessibleLabel: "打开 AI 能力清单" },
      { reportId: "yingmi-ai-capabilities-2026-10-27", label: "企业介绍" },
      { reportId: "yingmi-ai-open-platform-intro-2026-10-22", label: "开放平台" },
      { reportId: "oap-journey-metrics-2026-08-02", label: "发展指标" },
    ],
  },
  {
    id: "clair-select", title: "招聘工作台 · Clair Select", theme: "blue", icon: "panel",
    primary: { reportId: "candidate-evaluator-2026-10-29", label: "查看完整招聘档案" }, links: [],
  },
  {
    id: "xiaogu", title: "小顾介绍", theme: "lilac", icon: "spark",
    primary: { reportId: "seed-xiaogu", label: "打开小顾介绍" },
    links: [{ reportId: "xiaogu-3-investment-review-2026-09-04", label: "产品理念" }, { reportId: "ai-xiaogu-product-handbook-2026-10-13", label: "产品手册" }],
  },
  {
    id: "qieman", title: "且慢介绍", theme: "green", icon: "leaf",
    primary: { url: "https://qieman.com/", label: "访问且慢官网" },
    links: [{ reportId: "qieman-app-map", label: "APP 功能" }],
  },
  {
    id: "advisor", title: "投顾工作台", theme: "green", icon: "panel",
    primary: { reportId: "yingmi-advisor-workbench-2026-09-10", label: "打开投顾工作台交互演示" },
    links: [{ reportId: "advisorflow-l3-application-2026-10-21", label: "L3 申报" }, { reportId: "qieman-advisor-l3-project-proposals-2026-10-20", label: "场景方案" }],
  },
  {
    id: "qianwen-xiaogu", title: "千问小顾转化", theme: "lilac", icon: "path",
    primary: { reportId: "qianwen-xiaogu-l3-l4-conversion-2026-10-20", label: "打开千问小顾转化方案" },
    links: [{ reportId: "qianwen-user-acquisition-dashboard", label: "引流看板" }, { reportId: "qianwen-first-investor-cases-2026-09-17", label: "转化个例" }],
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

export function personalLaunchpadMarkup({ reports, escapeHtml: e }) {
  const active = new Map(reports.filter((report) => !report.archived).map((report) => [report.id, report]));
  const resource = (item, inner, className) => {
    const label = e(item.accessibleLabel || item.label);
    if (item.url) return `<a class="${className}" href="${e(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${label}">${inner}</a>`;
    const report = active.get(item.reportId);
    if (!report) return "";
    return `<button type="button" class="${className}" data-action="open" data-id="${e(report.id)}" title="${e(report.title)}" aria-label="${label}">${inner}</button>`;
  };
  const card = (area) => {
    const content = `<span class="studio-shortcut-icon">${icon(area.icon)}</span><span class="studio-shortcut-title">${e(area.title)}</span>`;
    const links = area.links.map((link) => resource(link, e(link.label), "studio-shortcut-link")).join("");
    const main = area.primary
      ? resource(area.primary, content + arrow, "studio-shortcut-main") || `<button type="button" class="studio-shortcut-main" data-action="show-archive">${content}${arrow}</button>`
      : `<div class="studio-shortcut-main studio-shortcut-label">${content}</div>`;
    return `<article class="studio-shortcut studio-shortcut-${area.theme}" id="personal-${area.id}">${main}${links ? `<div class="studio-shortcut-links">${links}</div>` : ""}</article>`;
  };
  return `<section class="studio-shortcuts group-column topic-section bucket-shortcuts" id="studio-shortcuts"
    data-bucket-kind="shortcuts" data-bucket-id="shortcuts" aria-labelledby="studio-shortcuts-title">
    <header class="group-header"><div class="group-heading-copy"><div><h2 id="studio-shortcuts-title">常用入口</h2></div></div></header>
    <div class="studio-shortcuts-grid">${PERSONAL_AREAS.map(card).join("")}</div>
  </section>`;
}
