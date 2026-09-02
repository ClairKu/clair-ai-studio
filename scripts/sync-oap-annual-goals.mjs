import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportDir = path.join(root, "public/reports/yingmi-ai-oap-framework-2026-08-03");
const snapshotPath = path.join(reportDir, "data/latest.json");
const snapshotSourcePath = process.argv[2] ? path.resolve(process.argv[2]) : snapshotPath;
const reportPath = path.join(reportDir, "report.json");
const htmlPath = path.join(reportDir, "index.html");
const researchPath = path.join(root, "research/yingmi-ai-oap-framework-2026-08-03.md");
const coveragePath = path.join(root, "research/yingmi-ai-oap-framework-2026-08-03-coverage.md");

const snapshot = JSON.parse(fs.readFileSync(snapshotSourcePath, "utf8"));
if (snapshot.schema !== 1) throw new Error("Unsupported OAP live-metrics schema");
if (snapshot.timezone !== "Asia/Shanghai") throw new Error("Unexpected OAP snapshot timezone");
if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.asOf || "")) throw new Error("Invalid OAP snapshot cutoff");
if (!Array.isArray(snapshot.rows) || snapshot.rows.length < 400) throw new Error("Incomplete OAP daily series");

const usage = {
  totalCalls: snapshot.readings?.cumulativeCalls,
  cumulativeApplications: snapshot.readings?.cumulativeUsers,
  active30dKeys: snapshot.readings?.mau ?? snapshot.latestMonthlyActiveUsers,
};
for (const [key, value] of Object.entries(usage)) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`Invalid usage.${key}`);
}
const latestRow = snapshot.rows.at(-1);
if (latestRow?.date !== snapshot.asOf) throw new Error("Latest daily row does not match snapshot cutoff");
if (latestRow.cumulativeCalls !== usage.totalCalls || latestRow.cumulativeUsers !== usage.cumulativeApplications) {
  throw new Error("OAP readings and daily series are not closed");
}
if (snapshotSourcePath !== snapshotPath) {
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
}

const goals = { calls: 13_000_000, applications: 10_000, active30d: 2_000 };
const progress = (actual, target) => Math.round((actual / target) * 1000) / 10;
const number = (value) => new Intl.NumberFormat("en-US").format(value);
const percent = (value) => `${Math.abs(value).toFixed(1)}%`;
const cutoffDay = snapshot.asOf;
const generatedLabel = String(snapshot.generatedAt || `${cutoffDay}T23:59:59+08:00`).replace("T", " ").slice(0, 16);
const isPartialDay = /部分日/.test(snapshot.note || "");
const cutoffLabel = `${generatedLabel}${isPartialDay ? "（当日部分数据）" : ""}`;
const callsGap = goals.calls - usage.totalCalls;
const applicationOver = usage.cumulativeApplications - goals.applications;
const activeOver = usage.active30dKeys - goals.active30d;
const callsProgress = progress(usage.totalCalls, goals.calls);
const applicationProgress = progress(usage.cumulativeApplications, goals.applications);
const activeProgress = progress(usage.active30dKeys, goals.active30d);
const applicationOverPercent = (usage.cumulativeApplications / goals.applications - 1) * 100;
const activeOverPercent = (usage.active30dKeys / goals.active30d - 1) * 100;
const journeyDays = snapshot.rows.length;

const replaceDeep = (value) => {
  if (typeof value === "string") return value.replaceAll("revision 1978", "revision 1981");
  if (Array.isArray(value)) return value.map(replaceDeep);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceDeep(item)]));
  return value;
};
const report = replaceDeep(JSON.parse(fs.readFileSync(reportPath, "utf8")));
report.meta.cutoff = `${cutoffLabel}；年度目标与用户增长采用同一实时聚合快照；千问传播材料截至 8 月 13 日`;
delete report.meta.annualGoalSnapshot;
report.meta.liveMetricSnapshot = {
  schema: snapshot.schema,
  generatedAt: snapshot.generatedAt,
  asOf: snapshot.asOf,
  source: "OAP Stargate Dashboard 同口径生产库实时聚合",
  definition: "累计申请与累计调用排除内部测试 apiKey；活跃为滚动近 30 天有调用记录的去重 apiKey 数",
  partialDay: isPartialDay,
};
report.hero.conclusion = `累计申请已超年度目标 ${percent(applicationOverPercent)}，近 30 日活跃超目标 ${percent(activeOverPercent)}，累计调用完成 ${callsProgress}%；下一阶段要把用户与调用规模转成可追溯、可经营的服务闭环。`;

const okr = report.sections.find((section) => section.id === "okr");
if (!okr || okr.items.length < 3) throw new Error("Annual-goal section is missing");
okr.title = "累计申请与活跃均已超目标";
okr.lead = `累计申请已完成 ${applicationProgress}%，超年度目标 ${number(applicationOver)}；近 30 日活跃完成 ${activeProgress}%，累计调用完成 ${callsProgress}%，AI 实验室最新进度待确认。`;
Object.assign(okr.items[0], {
  title: "累计调用",
  metric: number(usage.totalCalls),
  progress: callsProgress,
  body: `年度目标 ${number(goals.calls)}，尚差 ${number(callsGap)} 次。`,
  source: `OAP 生产库实时聚合 · 截至 ${cutoffLabel}`,
});
Object.assign(okr.items[1], {
  title: "累计申请",
  metric: number(usage.cumulativeApplications),
  progress: applicationProgress,
  body: `年度目标 ${number(goals.applications)}，已超目标 ${number(applicationOver)}。`,
  source: `OAP 申请记录累计（排除内部测试 apiKey）· 截至 ${cutoffLabel}`,
});
Object.assign(okr.items[2], {
  title: "近 30 日活跃",
  metric: number(usage.active30dKeys),
  progress: activeProgress,
  body: `年度目标 ${number(goals.active30d)}，已超目标 ${number(activeOver)}。`,
  source: `OAP 滚动近 30 天有调用记录的去重 apiKey · 截至 ${cutoffLabel}`,
});
okr.callout.text = `累计申请已超年度目标 ${number(applicationOver)}，近 30 日活跃超目标 ${number(activeOver)}；累计调用距离 1,300 万仍差 ${number(callsGap)} 次。增长重点应从“达标”转向有效使用、服务结果与商业闭环。`;
if (okr.items[3]) {
  Object.assign(okr.items[3], {
    metric: "目标态",
    progress: 0,
    meta: "最新执行进度待确认",
    body: "年度目标：用户 5,000、应用 1,000；本次主源未提供当前完成度。",
  });
}

const growth = report.sections.find((section) => section.id === "user-growth");
if (!growth || !growth.items?.length) throw new Error("User-growth section is missing");
growth.lead = `基于 ${journeyDays} 日真实记录交互查看累计调用、累计申请、每日调用凭据与每日新增；年度目标卡与图表读取同一份实时数据。`;
growth.items[0].eyebrow = `2025.03—2026.09 · ${journeyDays} 日真实记录`;
growth.items[0].meta = `OAP 生产库实时聚合 · 截至 ${cutoffLabel}`;
growth.items[0].source = `OAP 关键历程 × 四指标增长可视化 · 实时 JSON 更新于 ${generatedLabel}`;
growth.items[0].embed = "https://clairku.github.io/qieman-product-research-library/pages/oap/oap-journey-metrics-2026-08-02.html?v=live";

const mainSource = report.sources.find((source) => source.label.includes("飞书文档《8/3 盈米 AI 开放平台项目汇报》"));
if (mainSource) mainSource.detail = "yingmi.feishu.cn/wiki/ELoLwjzXmidhs6kscvbczByYnod · revision 1981 · 本次重新核对报告十项框架与静态事实";
const dashboardSource = report.sources.find((source) => source.label.includes("OAP 生产数仓只读聚合快照") || source.label.includes("OAP Stargate Dashboard"));
if (dashboardSource) {
  dashboardSource.label = "OAP Stargate Dashboard 同口径实时聚合";
  dashboardSource.detail = `生产库 dw-tidb/ying99_oap · ${cutoffLabel} · 累计调用 ${number(usage.totalCalls)}、累计申请 ${number(usage.cumulativeApplications)}、滚动近 30 日活跃 ${number(usage.active30dKeys)} · 排除内部测试 apiKey`;
}
const journeySource = report.sources.find((source) => source.label.includes("OAP 关键历程 × 四指标增长可视化"));
if (journeySource) journeySource.detail = `clairku.github.io/qieman-product-research-library/pages/oap/oap-journey-metrics-2026-08-02.html · ${journeyDays} 日序列 · 页面与年度目标卡均读取同一实时 JSON`;
const cutoffBoundary = report.uncertainties.find((item) => item.title === "数据截止口径");
if (cutoffBoundary) cutoffBoundary.detail = `年度目标与用户增长读取同一份 OAP 生产库实时聚合，最新快照生成于 ${cutoffLabel}。累计申请按申请记录累计并排除内部测试 apiKey；近 30 日活跃按有调用记录的 apiKey 去重，不等同于自然人去重。最新日可能为部分日，报告按源状态显式标注。机构统计、MCP TOP20、传播与商化数据保留各自历史截点，不与实时经营指标混算。`;
const planBoundary = report.uncertainties.find((item) => item.title === "计划状态");
if (planBoundary) planBoundary.detail = "SSO、OAuth、部分平台上架、AI 实验室与商化内容来自原计划；截至 revision 1981，主源未提供这些事项的最新完成证据，不写成已上线。";
const next = report.sections.find((section) => section.id === "next");
if (next) {
  next.title = "四项行动需按当前状态重新收口";
  next.lead = "原 H2 计划仍可作为行动框架，但 8 月节点已过；应先确认真实完成状态，再确定 9 月经营优先级。";
  const foundation = next.items?.find((item) => item.eyebrow === "FOUNDATION");
  if (foundation) foundation.body = "原计划 8 月推进 SSO 与 10 个持仓类 MCP 登录授权；截至 revision 1981 未提供完成证据，需同步复核 Stargate 授权、撤销、审计和统计状态。";
  const lab = next.items?.find((item) => item.eyebrow === "AI LAB");
  if (lab) lab.body = "先确认首版范围、负责人和上线节点，再围绕 5,000 用户、1,000 应用拆解可验收的季度经营动作。";
  next.callout = { label: "9 月收口", text: "先完成计划状态核验，再把已上线能力、待解决缺口与下一周期承诺拆开管理。" };
}

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(
  /\n    const OAP_ANNUAL_REFRESH=[\s\S]*?\n    const OAP_LIVE_METRICS=/,
  '\n    const annualNumber=value=>new Intl.NumberFormat("zh-CN").format(Number(value)||0);\n    const annualProgress=(actual,target)=>Math.round(actual/target*1000)/10;\n    const OAP_LIVE_METRICS=',
);
html = html.replaceAll("AI 实验室经营指标仍待启动", "AI 实验室最新进度待确认");
html = html.replace(
  /(<script type="application\/json" id="report-data">)[\s\S]*?(<\/script>)/,
  `$1${JSON.stringify(report)}$2`,
);
html = html.replace(
  /<span id="ending-data-cutoff">[\s\S]*?<\/span>/,
  `<span id="ending-data-cutoff">年度目标与用户增长：实时聚合更新于 ${cutoffLabel}；累计申请与近 30 日活跃按 apiKey 口径 · 其余模块保留各自证据截点</span>`,
);
fs.writeFileSync(htmlPath, html);

let research = fs.readFileSync(researchPath, "utf8");
research = research
  .replaceAll("revision 1978", "revision 1981")
  .replace(/^report_cutoff:.*$/m, `report_cutoff: ${cutoffLabel}；年度目标与用户增长实时聚合；千问传播材料截至 8 月 13 日；其余历史证据保留各自截点`)
  .replace(/^- 累计调用 .*$/m, `- 累计调用 ${number(usage.totalCalls)} / ${number(goals.calls)} = ${callsProgress}%（年末正式 OKR；距目标 ${number(callsGap)} 次）· 截至 ${cutoffLabel} · OAP 生产库实时聚合`)
  .replace(/^- (?:批准)?申请用户 .*$/m, `- 累计申请 ${number(usage.cumulativeApplications)} / ${number(goals.applications)} = ${applicationProgress}%（超目标 ${number(applicationOver)}）· 截至 ${cutoffLabel} · 申请记录累计，排除内部测试 apiKey`)
  .replace(/^- (?:近 30 日活跃用户|MAU) .*$/m, `- 近 30 日活跃 ${number(usage.active30dKeys)} / ${number(goals.active30d)} = ${activeProgress}%（超目标 ${number(activeOver)}）· 截至 ${cutoffLabel} · 滚动近 30 天有调用记录的去重 apiKey`)
  .replace(/^- 历史调用用户 .*$/m, "- 历史累计调用用户：本次公开实时快照未提供该字段，不沿用 8 月 16 日旧值（missing）")
  .replace(/^累计调用 .*$/m, `累计调用 ${(usage.totalCalls / 1_000_000).toFixed(2)}M（OKR ${callsProgress}%）、累计申请 ${number(usage.cumulativeApplications)}（${applicationProgress}%）、近 30 日活跃 ${number(usage.active30dKeys)}（${activeProgress}%）；申请与活跃已超年度目标，平台下一阶段要把规模转成有效使用、服务结果与商化闭环。`);
fs.writeFileSync(researchPath, research);

let coverage = fs.readFileSync(coveragePath, "utf8");
const coverageSnapshotLabel = `${generatedLabel}${isPartialDay ? "；当日部分数据" : ""}`;
const coverageSourceLine = `补充源：OAP 生产库实时聚合增长数据（更新于 ${coverageSnapshotLabel}；累计申请与近 30 日活跃均为 apiKey 口径）；用户于 2026-08-03 提供的微信对话、能力生产线、服务蓝图、系统关系、服务关系、Stargate 机构统计、个人订阅、积分运营、个人资源包与企业年包方案截图；盈米 MCP 接口市场 69 项页面核对、业务调用 TOP20 原图与飞书 API 收费表；千问传播监测两版导出、来源登记与 5 段用户提供录屏（数据 / 素材截至 2026-08-13）。`;
coverage = coverage
  .replaceAll("revision 1978", "revision 1981")
  .replace(/^版本：.*$/m, "版本：revision 1981")
  .replace(/^补充源：.*$/m, coverageSourceLine)
  .replace(/^\| OAP (?:聚合：批准申请用户|实时聚合：累计申请) .*$/m, `| OAP 实时聚合：累计申请 ${number(usage.cumulativeApplications)} / ${number(goals.applications)}（更新于 ${coverageSnapshotLabel}） | confirmed | 01 年度目标 |`)
  .replace(/^\| OAP (?:聚合：|实时聚合：)近 30 日活跃 .*$/m, `| OAP 实时聚合：近 30 日活跃 ${number(usage.active30dKeys)} / ${number(goals.active30d)}（滚动有调用 apiKey 去重） | confirmed | 01 年度目标 |`)
  .replace(/^\| OAP (?:聚合：|实时聚合：)累计调用 .*$/m, `| OAP 实时聚合：累计调用 ${number(usage.totalCalls)} / ${number(goals.calls)}（更新于 ${coverageSnapshotLabel}） | confirmed | 01 年度目标 |`)
  .replace(/\| P3：用户增长与四指标趋势；\d+ 日真实数据交互组件 \| confirmed \| 05 用户增长 \|/, `| P3：用户增长与四指标趋势；${journeyDays} 日真实数据交互组件 | confirmed | 05 用户增长 |`)
  .replace(/^- [\d,]+ ÷ 10,000 = .*$/m, `- ${number(usage.cumulativeApplications)} ÷ ${number(goals.applications)} = ${(usage.cumulativeApplications / goals.applications * 100).toFixed(2)}%，按一位小数显示 ${applicationProgress}%，已超目标 ${number(applicationOver)}。`)
  .replace(/^- [\d,]+ ÷ 2,000 = .*$/m, `- ${number(usage.active30dKeys)} ÷ ${number(goals.active30d)} = ${(usage.active30dKeys / goals.active30d * 100).toFixed(2)}%，按一位小数显示 ${activeProgress}%，已超目标 ${number(activeOver)}。`)
  .replace(/^- [\d,]+ ÷ 13,000,000 = .*$/m, `- ${number(usage.totalCalls)} ÷ ${number(goals.calls)} = ${(usage.totalCalls / goals.calls * 100).toFixed(2)}%，按一位小数显示 ${callsProgress}%。`)
  .replace(/^- 剩余缺口：.*$/m, `- 累计申请已超目标 ${number(applicationOver)}，近 30 日活跃已超目标 ${number(activeOver)}；累计调用仍差 ${number(callsGap)} 次。`)
  .replace(/^- 交互支持四指标开关.*$/m, `- 交互支持四指标开关、悬浮读数与关键历程联动；年度目标卡与用户增长图读取同一份 ${snapshot.generatedAt} 实时 JSON。最新日为部分日；累计申请与近 30 日活跃按 apiKey 口径，二者不能解释为自然人去重。`);
coverage = coverage
  .replace(/^- 原始可视化：.*$/m, "- 原始可视化：<https://clairku.github.io/qieman-product-research-library/pages/oap/oap-journey-metrics-2026-08-02.html?v=live>")
  .replace(/^- 报告第 05 章以全宽 iframe.*$/m, `- 报告第 05 章以全宽 iframe 直接嵌入实时版本，呈现关键历程与 ${journeyDays} 日真实序列；不再放置右侧说明卡。`);
fs.writeFileSync(coveragePath, coverage);

console.log(`Synced OAP report to ${cutoffLabel}: calls=${usage.totalCalls}, applications=${usage.cumulativeApplications}, active30d=${usage.active30dKeys}`);
