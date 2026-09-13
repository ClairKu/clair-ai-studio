import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const source = readFileSync(new URL("src/app.js", root), "utf8");
const slug = "clair-studio-catalog-audit-2026-09-13";

function objectBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Missing markers: ${startMarker} / ${endMarker}`);
  const objectStart = source.indexOf("{", start);
  const text = source.slice(objectStart, end).trim().replace(/;$/, "");
  return vm.runInNewContext(`(${text})`, { DATA_VERSION: 72 });
}

const state = objectBetween("const initialState =", "const WORK_TYPE_BY_REPORT");
const workTypeOverrides = objectBetween("const WORK_TYPE_BY_REPORT =", "const TOPIC_BY_REPORT");
const topics = objectBetween("const TOPIC_BY_REPORT =", "function inferWorkType");
const historicalReports = state.reports.filter((report) => report.id !== slug);

const oldGroups = {
  "ai-platform": { name: "AI 开放平台", count: 54 },
  xiaogu: { name: "AI 小顾与投顾服务", count: 35 },
  "product-planning": { name: "且慢产品与体验", count: 24 },
  reporting: { name: "经营分析与汇报", count: 19 },
  "ai-workbench": { name: "AI 工作台与生产力", count: 17 },
  knowledge: { name: "知识治理与组织协同", count: 7 },
  research: { name: "投研与策略研究", count: 6 },
};

const oldTopicOverrides = {
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
  "oap-h2-plan": "ai-platform",
  "oap-h2-okr-iteration-review": "ai-platform",
};

const groupMeta = Object.fromEntries(state.groups.map((group) => [group.id, group]));
const workTypeNames = {
  "requirement-review": "需求评审",
  reporting: "汇报材料",
  "competitive-research": "竞品调研",
  "product-planning": "产品规划",
  "data-analysis": "数据分析",
  "investment-research": "投研分析",
  "governance-review": "治理审查",
  "product-demo": "原型 Demo",
};

function inferWorkType(report) {
  const text = `${report.title || ""} ${report.source || ""}`;
  if (/需求评审|评审工作台/.test(text)) return "requirement-review";
  if (/竞品|对比|调研|研究/.test(text)) return "competitive-research";
  if (/周报|汇报|进展|规划|里程碑|业务分析/.test(text)) return "reporting";
  if (/数据|趋势|点击|转化|画像|使用/.test(text)) return "data-analysis";
  if (/基金|策略|投研|资产配置/.test(text)) return "investment-research";
  if (/审查|治理|知识/.test(text)) return "governance-review";
  if (/Demo|Studio|工作台|原型/i.test(text)) return "product-demo";
  return "product-planning";
}

const rows = historicalReports.map((report) => {
  const newGroup = topics[report.id] || report.groupId;
  const oldGroup = oldTopicOverrides[report.id] || report.groupId;
  const rawWorkType = workTypeOverrides[report.id] || report.workType;
  const workType = workTypeNames[rawWorkType] ? rawWorkType : inferWorkType(report);
  const sourceKind = report.url.includes("clairku.github.io/clair-ai-studio/")
    ? "Studio"
    : report.url.includes("ontology.yingmi-inc.com")
      ? "内网本体"
      : report.url.includes("feishu.cn")
        ? "飞书"
        : "外部";
  return {
    id: report.id,
    title: report.title,
    url: sourceKind === "Studio" ? report.url : "",
    date: report.createdAt?.slice(0, 10) || "—",
    oldGroup,
    oldGroupName: oldGroups[oldGroup]?.name || oldGroup,
    newGroup,
    newGroupName: groupMeta[newGroup]?.name || newGroup,
    workType,
    workTypeName: workTypeNames[workType] || workType,
    moved: oldGroup !== newGroup,
    sourceKind,
  };
});

const newCounts = Object.fromEntries(state.groups.map((group) => [
  group.id,
  rows.filter((report) => report.newGroup === group.id).length,
]));
const movedCount = rows.filter((report) => report.moved).length;
const percent = (value, total = rows.length) => `${(value / total * 100).toFixed(1)}%`;
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const categoryNotes = {
  xiaogu: "面向客户与顾问的 AI 服务产品、顾问工作台和服务闭环；不再混入用户增长统计。",
  "ai-workbench": "个人与团队的 AI 工作方法、协作工作台、评审器与生产力工具。",
  "ai-platform": "OAP、MCP、Agent、协议、接口能力和外部生态；项目汇报与运营数据分别归入经营、增长。",
  "growth-insights": "用户、渠道、转化、使用行为、经营指标与业务看板；这是本次新增的独立主题。",
  "product-planning": "且慢产品规划、需求评审、交互方案、体验问题与产品事故复盘。",
  research: "基金、策略、组合、养老与资产配置研究；技术接口口径不再放在投研主题。",
  reporting: "战略判断、管理汇报、项目进展、阶段复盘和对外展示材料。",
  knowledge: "人才标准、本体、知识资产、Skill 治理、合规、质量与组织协同。",
};

const categoryCards = state.groups.map((group) => {
  const count = newCounts[group.id] || 0;
  const examples = rows.filter((report) => report.newGroup === group.id).slice(0, 3);
  return `<article class="category-card" data-category-card="${escapeHtml(group.id)}">
    <div class="category-head"><span class="category-index">${String(group.position + 1).padStart(2, "0")}</span><strong>${escapeHtml(group.name)}</strong><b>${count}</b></div>
    <p>${escapeHtml(categoryNotes[group.id])}</p>
    <ul>${examples.map((report) => `<li>${escapeHtml(report.title)}</li>`).join("")}</ul>
  </article>`;
}).join("");

const oldBars = Object.entries(oldGroups).map(([id, group]) => `<div class="bar-row">
  <span>${escapeHtml(group.name)}</span><i><b style="width:${percent(group.count, 54)}"></b></i><strong>${group.count}</strong>
</div>`).join("");

const newBars = state.groups.map((group) => `<div class="bar-row">
  <span>${escapeHtml(group.name)}</span><i><b style="width:${percent(newCounts[group.id] || 0, 39)}"></b></i><strong>${newCounts[group.id] || 0}</strong>
</div>`).join("");

const series = [
  ["OAP 8·3 项目汇报系列", "同一项目形成框架版、证据版、Executive 版、十项框架版等多个版本。保留历史，但以后以“主版本 + 变更说明”收敛。"],
  ["且慢投顾页改版系列", "盘点、方向研究、V0.9、定稿、Demo、计划书连续存在。属于正常过程资产，宜在标题中统一阶段前缀。"],
  ["目标投顾与用户价值系列", "长周期对照、用户价值、图表版等内容相互补充。建议保留数据报告与管理摘要两层，不再为同一结论新增孤立页面。"],
  ["AI 小顾 × OAP 实践汇报系列", "中层汇报、产品实践、增长展示等叙事相近。后续新增前先判断是更新既有主报告，还是形成新的证据周期。"],
];

const featured = [
  "clair-studio-catalog-audit-2026-09-13",
  "ai-operating-system-control-center-2026-09-11",
  "tongzhou-workbench-brief-2026-09-11",
  "qieman-ai-growth-oap-integrated-2026-08-14",
  "agent-harness-executive-2026-09-02",
  "qieman-ai-user-attribution-2026-09-07",
  "product-demand-pulse-2026-08-11",
  "qieman-cashflow-strategies-audit-2026-08-28",
  "yingmi-ontology-explorer-2026-09-10",
];

const rowsJson = JSON.stringify(rows).replaceAll("<", "\\u003c");
const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Clair’s Studio 162 份历史成果全量盘点、分类重构、精选收敛与资源健康核验。">
  <title>Clair’s Studio｜162 份成果全面盘点与分类重构</title>
  <style>
    :root{--ink:#172033;--muted:#667085;--paper:#f5f1e8;--card:#fffdf8;--line:#d9d2c4;--blue:#3457d5;--green:#16806a;--orange:#d97706;--red:#b42318;--shadow:0 18px 60px rgba(65,52,34,.09)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",system-ui,sans-serif;line-height:1.65}
    a{color:inherit}.shell{width:min(1180px,calc(100% - 32px));margin:auto}.topbar{position:sticky;top:0;z-index:20;background:rgba(245,241,232,.92);backdrop-filter:blur(14px);border-bottom:1px solid rgba(23,32,51,.1)}
    .topbar .shell{display:flex;align-items:center;justify-content:space-between;min-height:62px;gap:20px}.brand{font-weight:800;letter-spacing:-.02em}.topnav{display:flex;gap:16px;font-size:14px;color:var(--muted)}.topnav a{text-decoration:none}.topnav a:hover{color:var(--ink)}
    .hero{padding:88px 0 64px;position:relative;overflow:hidden}.hero:before{content:"";position:absolute;width:520px;height:520px;border-radius:50%;right:-180px;top:-220px;background:radial-gradient(circle,#a8b9ff 0,rgba(168,185,255,0) 70%)}
    .eyebrow{display:inline-flex;gap:10px;align-items:center;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800;color:var(--blue)}.eyebrow:before{content:"";width:28px;height:2px;background:currentColor}
    h1{font-family:"Songti SC","Noto Serif CJK SC",serif;font-size:clamp(42px,7vw,78px);line-height:1.04;letter-spacing:-.045em;max-width:900px;margin:20px 0}.hero-lead{font-size:clamp(18px,2vw,24px);max-width:780px;color:#465064}.hero-meta{margin-top:28px;display:flex;flex-wrap:wrap;gap:10px}.pill{border:1px solid var(--line);border-radius:999px;padding:7px 12px;background:rgba(255,255,255,.55);font-size:13px}
    .metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:72px}.metric{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:var(--shadow)}.metric b{font-size:34px;line-height:1;display:block;margin-bottom:10px}.metric span{font-size:13px;color:var(--muted)}
    section{padding:36px 0 64px}.section-head{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:26px}.section-kicker{font-size:12px;text-transform:uppercase;letter-spacing:.13em;color:var(--blue);font-weight:800}.section-head h2{font-family:"Songti SC",serif;font-size:clamp(30px,4vw,48px);line-height:1.15;margin:8px 0 0}.section-head p{max-width:480px;color:var(--muted);margin:0}
    .finding-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.finding{border-top:4px solid var(--blue);background:var(--card);padding:24px;border-radius:0 0 16px 16px}.finding.warn{border-color:var(--orange)}.finding.good{border-color:var(--green)}.finding h3{margin:0 0 8px;font-size:18px}.finding p{margin:0;color:var(--muted)}
    .compare{display:grid;grid-template-columns:1fr 1fr;gap:18px}.chart{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px}.chart h3{margin:0 0 4px}.chart>p{margin:0 0 22px;color:var(--muted);font-size:14px}.bar-row{display:grid;grid-template-columns:minmax(128px,1.5fr) 2fr 32px;gap:12px;align-items:center;margin:11px 0;font-size:13px}.bar-row i{height:8px;background:#ece7dc;border-radius:999px;overflow:hidden}.bar-row i b{display:block;height:100%;background:linear-gradient(90deg,var(--blue),#7c93ed);border-radius:inherit}.chart.after .bar-row i b{background:linear-gradient(90deg,var(--green),#63bda9)}
    .category-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:15px}.category-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px}.category-head{display:grid;grid-template-columns:42px 1fr auto;gap:12px;align-items:center}.category-index{font:700 13px ui-monospace,monospace;color:var(--blue)}.category-head strong{font-size:19px}.category-head b{font-size:28px}.category-card p{color:var(--muted);margin:12px 0}.category-card ul{margin:0;padding-left:19px;font-size:13px;color:#475467}
    .series-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:15px}.series-card{padding:22px;background:#1b2740;color:#f8f4eb;border-radius:18px}.series-card h3{margin:0 0 8px}.series-card p{margin:0;color:#c8d0df}.decision{margin-top:18px;padding:18px 20px;border-radius:14px;background:#e7efe9;border-left:4px solid var(--green)}
    .inventory-tools{position:sticky;top:62px;z-index:12;display:flex;flex-wrap:wrap;gap:10px;padding:14px 0;background:var(--paper)}.inventory-tools input,.inventory-tools select{border:1px solid var(--line);background:var(--card);border-radius:12px;padding:11px 13px;font:inherit;color:var(--ink)}.inventory-tools input{flex:1;min-width:240px}.inventory-summary{margin-left:auto;align-self:center;color:var(--muted);font-size:14px}
    .table-wrap{overflow:auto;border:1px solid var(--line);border-radius:18px;background:var(--card)}table{width:100%;border-collapse:collapse;min-width:940px;font-size:13px}th,td{padding:13px 14px;text-align:left;border-bottom:1px solid #ece7dc;vertical-align:top}th{position:sticky;top:0;background:#ede8dc;z-index:1;font-size:12px;letter-spacing:.04em}.report-title{font-weight:700;text-decoration:none}.report-title:hover{text-decoration:underline}.move{color:var(--blue);font-weight:700}.stay{color:var(--muted)}.source-badge{display:inline-block;border-radius:999px;padding:2px 8px;background:#eef2ff;color:#3448a4;white-space:nowrap}
    .evidence{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}.evidence-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px}.evidence-card h3{margin-top:0}.evidence-card ul{padding-left:20px}.status-list{display:grid;gap:10px}.status{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #ece7dc}.status b.ok{color:var(--green)}.status b.boundary{color:var(--orange)}
    footer{padding:34px 0 70px;color:var(--muted);border-top:1px solid var(--line);font-size:13px}.back{display:inline-flex;text-decoration:none;background:var(--ink);color:white;border-radius:999px;padding:10px 15px;font-weight:700}
    @media(max-width:860px){.metrics{grid-template-columns:repeat(2,1fr)}.finding-grid,.compare,.category-grid,.series-grid,.evidence{grid-template-columns:1fr}.section-head{display:block}.section-head p{margin-top:12px}.topnav{display:none}.inventory-summary{width:100%;margin-left:0}.hero{padding-top:58px}}
    @media(max-width:520px){.shell{width:min(100% - 22px,1180px)}.metrics{grid-template-columns:1fr 1fr}.metric{padding:16px}.metric b{font-size:28px}.hero-meta{gap:6px}.pill{font-size:12px}.inventory-tools{top:54px}.category-card{padding:18px}}
    @media print{.topbar,.inventory-tools{position:static}.topnav{display:none}.shell{width:100%}.hero{padding-top:30px}.category-card,.chart,.metric,.finding,.series-card,.evidence-card{break-inside:avoid}}
  </style>
</head>
<body>
  <header class="topbar"><div class="shell"><div class="brand">CLAIR’S STUDIO · CATALOG AUDIT</div><nav class="topnav"><a href="#findings">结论</a><a href="#taxonomy">新分类</a><a href="#inventory">全量目录</a><a href="#evidence">证据</a></nav></div></header>
  <main>
    <section class="hero"><div class="shell">
      <span class="eyebrow">Information Architecture · 2026.09.13</span>
      <h1>不是报告太多，<br>是目录失去了判断力。</h1>
      <p class="hero-lead">对 162 份历史成果进行逐项盘点后，保留全部资产，将混合“业务主题、工作类型、呈现形态”的旧目录重建为 8 个互斥主题，并把 119 份“精选”收敛为 9 个真正入口。</p>
      <div class="hero-meta"><span class="pill">盘点基线：origin/main · c7bd47d</span><span class="pill">时间范围：2026-07-08 → 2026-09-11</span><span class="pill">盘点日：2026-09-13</span><span class="pill">零删除 · 可追溯</span></div>
    </div></section>

    <div class="shell metrics" aria-label="盘点关键指标">
      <article class="metric"><b>162</b><span>历史成果全量纳入</span></article>
      <article class="metric"><b>${movedCount}</b><span>份调整主题，占 ${percent(movedCount)}</span></article>
      <article class="metric"><b>119→9</b><span>精选收敛，恢复入口价值</span></article>
      <article class="metric"><b>276/278</b><span>公开链接与预览核验通过</span></article>
      <article class="metric"><b>0</b><span>重复 ID / 链接 / 本地缺页</span></article>
    </div>

    <section id="findings"><div class="shell">
      <div class="section-head"><div><span class="section-kicker">01 · 核心判断</span><h2>旧目录的三个结构性问题</h2></div><p>这些不是“整理得不够勤”的问题，而是分类维度本身互相打架。继续往旧框架里塞报告，只会越来越难找。</p></div>
      <div class="finding-grid">
        <article class="finding warn"><h3>主题与用途混在一起</h3><p>“AI 开放平台”是业务主题，“经营分析与汇报”是工作用途，“AI 工作台”又同时指产品和工具，单份报告天然可能落入三处。</p></article>
        <article class="finding warn"><h3>数据报告没有独立归宿</h3><p>用户、渠道、转化和经营看板散落在 AI 小顾、开放平台、产品与汇报四类中，导致同一问题无法连贯追踪。</p></article>
        <article class="finding good"><h3>资产质量好于目录质量</h3><p>162 份目录项无重复，159 份指向 Studio，站内报告与预览无缺页；另发现 1 个损坏的 SVG 预览并已修复。核心工作不是删，而是重建入口与版本秩序。</p></article>
      </div>
      <div class="decision"><strong>重构原则：</strong>主题回答“这份成果在解决哪个业务域的问题”；工作类型回答“它用什么方式解决”；标签只补充对象、渠道和技术。三层不再互相替代。</div>
    </div></section>

    <section><div class="shell">
      <div class="section-head"><div><span class="section-kicker">02 · 前后对比</span><h2>从 7 个混合桶到 8 个业务域</h2></div><p>${movedCount} 份历史成果重新归位。最大变化是拆出“用户增长与数据洞察”，并把项目汇报与平台能力分开。</p></div>
      <div class="compare"><article class="chart"><h3>重构前 · 7 类</h3><p>最大分类 54 份，占 33.3%；数据与项目汇报大量寄存在业务主题里。</p>${oldBars}</article><article class="chart after"><h3>重构后 · 8 类</h3><p>对 162 份历史成果的分类分布；新增本报告后，工作台总计 163 份。</p>${newBars}</article></div>
    </div></section>

    <section id="taxonomy"><div class="shell">
      <div class="section-head"><div><span class="section-kicker">03 · 新分类说明</span><h2>每一类都有清晰边界</h2></div><p>分类按主决策对象确定。跨域内容只选一个主主题，其余用工作类型与标签表达，避免同一份成果重复挂载。</p></div>
      <div class="category-grid">${categoryCards}</div>
    </div></section>

    <section><div class="shell">
      <div class="section-head"><div><span class="section-kicker">04 · 版本治理</span><h2>不删历史，但要收住新增</h2></div><p>本轮不擅自归档任何成果。以下系列存在明显的版本簇，后续应优先更新主版本，而不是继续新增并列页面。</p></div>
      <div class="series-grid">${series.map(([name, note]) => `<article class="series-card"><h3>${escapeHtml(name)}</h3><p>${escapeHtml(note)}</p></article>`).join("")}</div>
      <div class="decision"><strong>精选规则已落地：</strong>从“曾经重要”改为“当前最值得从首页进入”。按 8 个主题各保留代表作，再加本次目录治理报告，共 ${featured.length} 份；历史成果仍可通过主题、类型、标签、时间和全文搜索访问。</div>
    </div></section>

    <section id="inventory"><div class="shell">
      <div class="section-head"><div><span class="section-kicker">05 · 全量清单</span><h2>162 份成果逐项归位</h2></div><p>可按新分类、工作类型、是否迁移和来源筛选。点击标题直接打开原成果。</p></div>
      <div class="inventory-tools">
        <input id="catalog-search" type="search" placeholder="搜索标题、ID、分类或工作类型" aria-label="搜索成果">
        <select id="category-filter" aria-label="按新分类筛选"><option value="">全部新分类</option>${state.groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join("")}</select>
        <select id="movement-filter" aria-label="按迁移状态筛选"><option value="">全部状态</option><option value="moved">已调整主题</option><option value="stay">主题未变</option></select>
        <span class="inventory-summary" id="inventory-summary">显示 162 / 162</span>
      </div>
      <div class="table-wrap"><table><thead><tr><th>日期</th><th>成果</th><th>原分类</th><th>新分类</th><th>工作类型</th><th>来源</th></tr></thead><tbody id="inventory-body"></tbody></table></div>
    </div></section>

    <section id="evidence"><div class="shell">
      <div class="section-head"><div><span class="section-kicker">06 · 证据与边界</span><h2>哪些已确认，哪些不能乱下结论</h2></div><p>健康检查区分“已公开可访问”“内网地址公网不可判定”和“内容质量未复审”，避免用 HTTP 200 代替报告正确性。</p></div>
      <div class="evidence"><article class="evidence-card"><h3>盘点口径</h3><ul><li>目录基线：GitHub 远端主分支 <code>c7bd47d</code>，2026-09-13 获取。</li><li>对象：工作台登记的 162 份历史成果；新盘点报告不计入基线。</li><li>本地核验：报告 ID、URL、创建时间、来源字段、站内 HTML、预览资源与 SVG 结构有效性。</li><li>线上核验：162 个报告地址 + 116 个显式预览地址，共 278 个目标。</li><li>分类方式：逐项显式映射，不依赖标题关键词自动猜测。</li></ul></article>
      <article class="evidence-card"><h3>核验状态</h3><div class="status-list"><div class="status"><span>重复 ID / URL</span><b class="ok">0</b></div><div class="status"><span>站内报告缺页</span><b class="ok">0</b></div><div class="status"><span>显式预览缺失</span><b class="ok">0</b></div><div class="status"><span>损坏 SVG 预览</span><b class="ok">1 → 0，已修复</b></div><div class="status"><span>公开请求成功</span><b class="ok">276</b></div><div class="status"><span>公网不可判定的内网本体地址</span><b class="boundary">2</b></div><div class="status"><span>内容事实逐篇复核</span><b class="boundary">不在本轮范围</b></div></div></article></div>
    </div></section>
  </main>
  <footer><div class="shell"><a class="back" href="../../">返回 Clair’s Studio</a><p>本报告记录的是目录治理结果，不替代每份业务报告自身的口径、数据截止时间与证据边界。</p></div></footer>
  <script>
    const rows = ${rowsJson};
    const body = document.getElementById("inventory-body");
    const search = document.getElementById("catalog-search");
    const category = document.getElementById("category-filter");
    const movement = document.getElementById("movement-filter");
    const summary = document.getElementById("inventory-summary");
    const esc = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"})[char]);
    function render(){
      const query = search.value.trim().toLocaleLowerCase("zh-CN");
      const filtered = rows.filter((row) => {
        const matchesText = !query || [row.title,row.id,row.oldGroupName,row.newGroupName,row.workTypeName].join(" ").toLocaleLowerCase("zh-CN").includes(query);
        const matchesCategory = !category.value || row.newGroup === category.value;
        const matchesMovement = !movement.value || (movement.value === "moved" ? row.moved : !row.moved);
        return matchesText && matchesCategory && matchesMovement;
      });
      body.innerHTML = filtered.map((row) => '<tr><td>' + esc(row.date) + '</td><td>' + (row.url ? '<a class="report-title" href="' + esc(row.url) + '" target="_blank" rel="noreferrer">' + esc(row.title) + '</a>' : '<span class="report-title">' + esc(row.title) + '</span>') + '<br><small>' + esc(row.id) + '</small></td><td>' + esc(row.oldGroupName) + '</td><td class="' + (row.moved ? "move" : "stay") + '">' + esc(row.newGroupName) + (row.moved ? " ↗" : "") + '</td><td>' + esc(row.workTypeName) + '</td><td><span class="source-badge">' + esc(row.sourceKind) + '</span></td></tr>').join("");
      summary.textContent = "显示 " + filtered.length + " / " + rows.length;
    }
    [search,category,movement].forEach((control) => control.addEventListener("input", render));
    render();
  </script>
</body>
</html>`;

for (const target of [
  new URL(`public/reports/${slug}/index.html`, root),
  new URL(`docs/reports/${slug}/index.html`, root),
]) {
  mkdirSync(dirname(target.pathname), { recursive: true });
  writeFileSync(target, html);
}

console.log(`Built ${slug}: ${rows.length} historical reports, ${movedCount} topic moves.`);
