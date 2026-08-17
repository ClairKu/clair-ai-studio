import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportDir = path.join(root, "public/reports/yingmi-ai-oap-framework-2026-08-03");
const snapshotPath = path.join(root, "public/reports/oap-qieman-user-dashboard/data/latest.json");
const reportPath = path.join(reportDir, "report.json");
const htmlPath = path.join(reportDir, "index.html");
const researchPath = path.join(root, "research/yingmi-ai-oap-framework-2026-08-03.md");
const coveragePath = path.join(root, "research/yingmi-ai-oap-framework-2026-08-03-coverage.md");

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
if (snapshot.schema_version !== "oap-qieman-user-dashboard-v1") throw new Error("Unsupported OAP snapshot schema");
if (snapshot.meta?.timezone !== "Asia/Shanghai") throw new Error("Unexpected OAP snapshot timezone");

const usage = snapshot.usage || {};
for (const key of ["approved_users", "active_30d_users", "total_calls"]) {
  if (!Number.isInteger(usage[key]) || usage[key] < 0) throw new Error(`Invalid usage.${key}`);
}

const goals = { calls: 13_000_000, users: 10_000, active30d: 2_000 };
const progress = (actual, target) => Math.round((actual / target) * 1000) / 10;
const number = (value) => new Intl.NumberFormat("en-US").format(value);
const cutoffDay = snapshot.meta.data_cutoff.slice(0, 10);
const cutoffCn = cutoffDay.replace(/-(\d{2})-(\d{2})$/, (_, month, day) => `-${Number(month)}-${Number(day)}`);
const callsGap = goals.calls - usage.total_calls;
const usersGap = goals.users - usage.approved_users;
const activeOver = usage.active_30d_users - goals.active30d;
const callsProgress = progress(usage.total_calls, goals.calls);
const usersProgress = progress(usage.approved_users, goals.users);
const activeProgress = progress(usage.active_30d_users, goals.active30d);
const activeOverPercent = Math.round((activeProgress - 100) * 10) / 10;

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
report.meta.cutoff = `${cutoffDay}（年度目标采用截至 23:59:59 的完整自然日快照；千问传播材料截至 8 月 13 日）`;
report.meta.annualGoalSnapshot = {
  schemaVersion: snapshot.schema_version,
  generatedAt: snapshot.meta.generated_at,
  dataCutoff: snapshot.meta.data_cutoff,
  source: snapshot.meta.source,
  privacy: snapshot.meta.privacy,
};
report.hero.conclusion = `申请用户距离年度目标仅差 ${number(usersGap)} 人，近 30 日活跃用户超目标 ${activeOverPercent}%，累计调用完成 ${callsProgress}%；下一阶段要把微信、千问等新入口转成可追溯、可经营的服务闭环。`;

const okr = report.sections.find((section) => section.id === "okr");
if (!okr || okr.items.length < 3) throw new Error("Annual-goal section is missing");
okr.title = "申请用户逼近目标，近 30 日活跃持续超额";
okr.lead = `申请用户已完成 ${usersProgress}%，距离年度目标仅差 ${number(usersGap)} 人；近 30 日活跃用户超目标 ${activeOverPercent}%，累计调用完成 ${callsProgress}%，AI 实验室仍待启动并建立经营闭环。`;
Object.assign(okr.items[0], {
  metric: number(usage.total_calls),
  progress: callsProgress,
  body: `年度目标 ${number(goals.calls)}，尚差 ${number(callsGap)} 次。`,
  source: `OAP 生产数仓只读聚合 · 截至 ${cutoffDay} 完整自然日`,
});
Object.assign(okr.items[1], {
  metric: number(usage.approved_users),
  progress: usersProgress,
  body: `年度目标 ${number(goals.users)}，尚差 ${number(usersGap)} 人。`,
  source: `OAP 批准申请用户去重口径 · 截至 ${cutoffDay} 完整自然日`,
});
Object.assign(okr.items[2], {
  title: "近 30 日活跃",
  metric: number(usage.active_30d_users),
  progress: activeProgress,
  body: `年度目标 ${number(goals.active30d)}，已超目标 ${number(activeOver)} 人。`,
  source: `OAP 最近 30 个完整自然日活跃口径 · 截至 ${cutoffDay}`,
});
okr.callout.text = `申请用户距离 1 万仅差 ${number(usersGap)} 人，近 30 日活跃已超年度目标 ${number(activeOver)} 人；累计调用距离 1,300 万仍差 ${number(callsGap)} 次，下一阶段要同时补足调用规模与实验室经营闭环。`;

const dashboardSource = report.sources.find((source) => source.label.includes("Stargate 管理后台 Dashboard"));
if (dashboardSource) {
  dashboardSource.label = "OAP 生产数仓只读聚合快照";
  dashboardSource.detail = `${snapshot.meta.source} · ${snapshot.meta.data_cutoff} · 总调用 ${number(usage.total_calls)}、批准申请用户 ${number(usage.approved_users)}、近 30 个完整自然日活跃用户 ${number(usage.active_30d_users)} · ${snapshot.meta.privacy}`;
}
const cutoffBoundary = report.uncertainties.find((item) => item.title === "数据截止口径");
if (cutoffBoundary) cutoffBoundary.detail = `年度目标采用 OAP 生产数仓只读聚合：累计调用与批准申请用户截至 ${snapshot.meta.data_cutoff}，活跃为最近 30 个完整自然日去重用户；点击“更新数据”时，Clair Mac 本机更新器可重新查询并校验脱敏聚合，未连接时只回退到最近发布快照。交互趋势图仍为截至 2026-08-10 的清洗快照，两者不直接拼接；机构统计分项日期不同。`;

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

let html = fs.readFileSync(htmlPath, "utf8");
html = html.replaceAll("${activeProgress-100}", "${annualOverPercent(activeProgress)}");
html = html.replace(
  /(<script type="application\/json" id="report-data">)[\s\S]*?(<\/script>)/,
  `$1${JSON.stringify(report)}$2`,
);
html = html.replace(
  /<span id="ending-data-cutoff">[\s\S]*?<\/span>|<span>年度目标：调用与 MAU 读取于 2026\.08\.14 00:37（调用为部分日）；累计用户最新至 2026\.08\.13 · 计划状态与证据边界见下方说明<\/span>/,
  `<span id="ending-data-cutoff">年度目标：生产数仓只读聚合截至 ${cutoffDay} 23:59:59；活跃采用最近 30 个完整自然日 · 更新机制与证据边界见下方说明</span>`,
);
fs.writeFileSync(htmlPath, html);

let research = fs.readFileSync(researchPath, "utf8");
research = research
  .replace(/^report_cutoff:.*$/m, `report_cutoff: ${cutoffDay}（年度目标采用截至 23:59:59 的完整自然日快照；千问传播材料截至 8 月 13 日）`)
  .replace(/- 累计调用 9,416,755 \/ 13,000,000 = 72\.4%（年末正式 OKR；距目标 3,583,245 次）· 截至 2026-08-14 00:37，为部分日数据 · OAP Stargate 管理后台默认口径/, `- 累计调用 ${number(usage.total_calls)} / ${number(goals.calls)} = ${callsProgress}%（年末正式 OKR；距目标 ${number(callsGap)} 次）· 截至 ${cutoffDay} 23:59:59，完整自然日 · OAP 生产数仓只读聚合`)
  .replace(/- 申请用户 9,851 \/ 10,000 = 98\.5%（距目标 149 人）· 累计用户表最新至 2026-08-13 · OAP Stargate 管理后台默认口径/, `- 批准申请用户 ${number(usage.approved_users)} / ${number(goals.users)} = ${usersProgress}%（距目标 ${number(usersGap)} 人）· 截至 ${cutoffDay} 23:59:59，完整自然日 · OAP 生产数仓只读聚合`)
  .replace(/- MAU 2,292 \/ 2,000 = 114\.6%（超目标 292 人）· 读取于 2026-08-14 00:37 · OAP Stargate 管理后台默认口径/, `- 近 30 日活跃用户 ${number(usage.active_30d_users)} / ${number(goals.active30d)} = ${activeProgress}%（超目标 ${number(activeOver)} 人）· 最近 30 个完整自然日 · OAP 生产数仓只读聚合`)
  .replace(/- 已使用用户 5,837；占总用户 9,851 的 59\.3% · 读取于 2026-08-14 00:37 · OAP Stargate 管理后台默认口径/, `- 历史调用用户 ${number(usage.ever_called_users)}；占批准申请用户 ${number(usage.approved_users)} 的 ${(usage.ever_called_users / usage.approved_users * 100).toFixed(1)}% · 截至 ${cutoffDay} 23:59:59 · OAP 生产数仓只读聚合`)
  .replace(/累计调用 9\.42M（OKR 72\.4%）、申请用户 9,851（98\.5%）、MAU 2,292（114\.6%，已超年度目标）/, `累计调用 ${(usage.total_calls / 1_000_000).toFixed(2)}M（OKR ${callsProgress}%）、批准申请用户 ${number(usage.approved_users)}（${usersProgress}%）、近 30 日活跃用户 ${number(usage.active_30d_users)}（${activeProgress}%，已超年度目标）`);
fs.writeFileSync(researchPath, research);

let coverage = fs.readFileSync(coveragePath, "utf8");
coverage = coverage
  .replace(/补充源：OAP Stargate 管理后台默认口径增长数据（[^；]+；[^；]+）；/, `补充源：OAP 生产数仓只读聚合增长数据（截至 ${cutoffDay} 23:59:59；活跃采用最近 30 个完整自然日去重口径）；`)
  .replace(/\| Stargate：申请用户 9,851 \/ 10,000（累计用户表最新至 2026-08-13） \| confirmed \| 01 年度目标 \|/, `| OAP 聚合：批准申请用户 ${number(usage.approved_users)} / ${number(goals.users)}（截至 ${cutoffDay} 完整自然日） | confirmed | 01 年度目标 |`)
  .replace(/\| Stargate：月活 2,292 \/ 2,000（读取于 2026-08-14 00:37） \| confirmed \| 01 年度目标 \|/, `| OAP 聚合：近 30 日活跃 ${number(usage.active_30d_users)} / ${number(goals.active30d)}（最近 30 个完整自然日） | confirmed | 01 年度目标 |`)
  .replace(/\| Stargate：累计调用 9,416,755 \/ 13,000,000（截至 2026-08-14 00:37，为部分日数据） \| confirmed \| 01 年度目标 \|/, `| OAP 聚合：累计调用 ${number(usage.total_calls)} / ${number(goals.calls)}（截至 ${cutoffDay} 完整自然日） | confirmed | 01 年度目标 |`)
  .replace(/- 9,851 ÷ 10,000 = 98\.51%，按一位小数显示 98\.5%。/, `- ${number(usage.approved_users)} ÷ ${number(goals.users)} = ${(usage.approved_users / goals.users * 100).toFixed(2)}%，按四舍五入一位小数显示 ${usersProgress}%。`)
  .replace(/- 2,292 ÷ 2,000 = 114\.60%，按一位小数显示 114\.6%，已超目标 292 人。/, `- ${number(usage.active_30d_users)} ÷ ${number(goals.active30d)} = ${(usage.active_30d_users / goals.active30d * 100).toFixed(2)}%，按一位小数显示 ${activeProgress}%，已超目标 ${number(activeOver)} 人。`)
  .replace(/- 9,416,755 ÷ 13,000,000 = 72\.44%，按一位小数显示 72\.4%。/, `- ${number(usage.total_calls)} ÷ ${number(goals.calls)} = ${(usage.total_calls / goals.calls * 100).toFixed(2)}%，按一位小数显示 ${callsProgress}%。`)
  .replace(/- 剩余缺口：149 名申请用户、3,583,245 次调用；MAU 已超额完成。/, `- 剩余缺口：${number(usersGap)} 名批准申请用户、${number(callsGap)} 次调用；近 30 日活跃已超额 ${number(activeOver)} 人。`)
  .replace(/年度目标页已更新为 2026-08-14 管理后台默认口径/, `年度目标页已更新为 ${cutoffDay} 生产数仓只读聚合口径`);
fs.writeFileSync(coveragePath, coverage);

console.log(`Synced annual goals to ${cutoffCn}: calls=${usage.total_calls}, users=${usage.approved_users}, active30d=${usage.active_30d_users}`);
