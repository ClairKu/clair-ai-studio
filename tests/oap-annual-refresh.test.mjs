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

test("annual-goal report directly follows the shared live-metrics JSON", () => {
  assert.doesNotMatch(html, /id="okr-refresh-button"/);
  assert.match(html, /OAP_LIVE_METRICS/);
  assert.match(html, /oap-metrics-live\.json/);
  assert.match(html, /validateLiveMetricSnapshot/);
  assert.match(html, /最新日可能为部分日/);
  assert.doesNotMatch(html, /OAP_ANNUAL_REFRESH/);
  assert.doesNotMatch(html, /批准申请用户去重口径/);
});

test("annual-goal fallback snapshot and definitions are synchronized", () => {
  const okr = report.sections.find((section) => section.id === "okr");
  assert.ok(okr);
  const format = (value) => new Intl.NumberFormat("en-US").format(value);
  const progress = (actual, target) => Math.round(actual / target * 1000) / 10;
  assert.deepEqual(okr.items.slice(0, 3).map(({ title, metric, progress: value }) => ({ title, metric, progress: value })), [
    { title: "累计调用", metric: format(snapshot.readings.cumulativeCalls), progress: progress(snapshot.readings.cumulativeCalls, 13_000_000) },
    { title: "累计申请", metric: format(snapshot.readings.cumulativeUsers), progress: progress(snapshot.readings.cumulativeUsers, 10_000) },
    { title: "近 30 日活跃", metric: format(snapshot.readings.mau), progress: progress(snapshot.readings.mau, 2_000) },
  ]);
  assert.match(okr.items[0].source, /部分数据/);
  assert.match(okr.items[1].source, /排除内部测试 apiKey/);
  assert.match(okr.items[2].source, /滚动近 30 天/);
  assert.equal(report.meta.liveMetricSnapshot.asOf, snapshot.asOf);
  assert.equal(snapshot.rows.at(-1).cumulativeCalls, snapshot.readings.cumulativeCalls);
  assert.equal(snapshot.rows.at(-1).cumulativeUsers, snapshot.readings.cumulativeUsers);
  assert.equal(okr.items[3].metric, "目标态");
  assert.match(okr.items[3].meta, /待确认/);
});

test("embedded report data matches standalone report.json", () => {
  assert.ok(embeddedMatch, "embedded report-data JSON is missing");
  assert.deepEqual(JSON.parse(embeddedMatch[1]), report);
  assert.match(html, new RegExp(`id="ending-data-cutoff">年度目标与用户增长：实时聚合更新于 ${snapshot.asOf}`));
  assert.doesNotMatch(JSON.stringify(report), /revision 1978/);
});
