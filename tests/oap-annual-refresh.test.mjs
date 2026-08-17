import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportDir = path.join(root, "public/reports/yingmi-ai-oap-framework-2026-08-03");
const html = fs.readFileSync(path.join(reportDir, "index.html"), "utf8");
const report = JSON.parse(fs.readFileSync(path.join(reportDir, "report.json"), "utf8"));
const snapshot = JSON.parse(fs.readFileSync(path.join(reportDir, "data/latest.json"), "utf8"));
const embeddedMatch = html.match(/<script type="application\/json" id="report-data">([\s\S]*?)<\/script>/);

test("annual-goal report receives the linked refresh result from user growth", () => {
  assert.doesNotMatch(html, /id="okr-refresh-button"/);
  assert.doesNotMatch(html, /id="okr-refresh-status"/);
  assert.match(html, /oap-report-data-updated/);
  assert.match(html, /oap-qieman-user-dashboard-v1/);
  assert.match(html, /oap-journey-metrics-v1/);
  assert.match(html, /年度目标与用户增长未同步闭合/);
});

test("annual-goal snapshot and definitions are synchronized", () => {
  const okr = report.sections.find((section) => section.id === "okr");
  assert.ok(okr);
  const format = (value) => new Intl.NumberFormat("en-US").format(value);
  const progress = (actual, target) => Math.round(actual / target * 1000) / 10;
  assert.deepEqual(okr.items.slice(0, 3).map(({ title, metric, progress: value }) => ({ title, metric, progress: value })), [
    { title: "累计调用", metric: format(snapshot.usage.total_calls), progress: progress(snapshot.usage.total_calls, 13_000_000) },
    { title: "申请用户", metric: format(snapshot.usage.approved_users), progress: progress(snapshot.usage.approved_users, 10_000) },
    { title: "近 30 日活跃", metric: format(snapshot.usage.active_30d_users), progress: progress(snapshot.usage.active_30d_users, 2_000) },
  ]);
  assert.match(okr.items[0].source, /完整自然日/);
  assert.match(okr.items[1].source, /批准申请用户去重口径/);
  assert.match(okr.items[2].source, /最近 30 个完整自然日活跃口径/);
  assert.equal(report.meta.annualGoalSnapshot.dataCutoff, snapshot.meta.data_cutoff);
  const latestJourney = snapshot.journey_metrics.rows.at(-1);
  assert.ok(Math.abs(latestJourney.cumulativeCalls - snapshot.usage.total_calls) < 20);
  assert.ok(Math.abs(latestJourney.cumulativeUsers - snapshot.usage.approved_users) < 20);
});

test("embedded report data matches standalone report.json", () => {
  assert.ok(embeddedMatch, "embedded report-data JSON is missing");
  assert.deepEqual(JSON.parse(embeddedMatch[1]), report);
  assert.match(html, new RegExp(`id="ending-data-cutoff">年度目标与用户增长：生产数仓只读聚合截至 ${snapshot.meta.data_cutoff.slice(0, 10)} 23:59:59`));
});
