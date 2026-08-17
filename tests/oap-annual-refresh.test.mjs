import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportDir = path.join(root, "public/reports/yingmi-ai-oap-framework-2026-08-03");
const html = fs.readFileSync(path.join(reportDir, "index.html"), "utf8");
const report = JSON.parse(fs.readFileSync(path.join(reportDir, "report.json"), "utf8"));
const embeddedMatch = html.match(/<script type="application\/json" id="report-data">([\s\S]*?)<\/script>/);

test("annual-goal report ships the safe refresh control", () => {
  assert.match(html, /id="okr-refresh-button"/);
  assert.match(html, /id="okr-refresh-status"/);
  assert.match(html, /http:\/\/127\.0\.0\.1:41792/);
  assert.match(html, /X-Clair-Dashboard/);
  assert.match(html, /oap-qieman-user-dashboard-v1/);
  assert.match(html, /\.\.\/oap-qieman-user-dashboard\/data\/latest\.json/);
  assert.match(html, /JSON\.stringify\(\{action:"refresh"\}\)/);
  assert.match(html, /本机更新器未连接，已读取最近可用快照/);
  assert.match(html, /本机更新器未连接，当前已是最近可用快照/);
});

test("annual-goal snapshot and definitions are synchronized", () => {
  const okr = report.sections.find((section) => section.id === "okr");
  assert.ok(okr);
  assert.deepEqual(
    okr.items.slice(0, 3).map(({ title, metric, progress }) => ({ title, metric, progress })),
    [
      { title: "累计调用", metric: "9,458,599", progress: 72.8 },
      { title: "申请用户", metric: "9,855", progress: 98.6 },
      { title: "近 30 日活跃", metric: "2,266", progress: 113.3 },
    ],
  );
  assert.match(okr.items[0].source, /完整自然日/);
  assert.match(okr.items[1].source, /批准申请用户去重口径/);
  assert.match(okr.items[2].source, /最近 30 个完整自然日活跃口径/);
  assert.equal(report.meta.annualGoalSnapshot.dataCutoff, "2026-08-16T23:59:59+08:00");
});

test("embedded report data matches standalone report.json", () => {
  assert.ok(embeddedMatch, "embedded report-data JSON is missing");
  assert.deepEqual(JSON.parse(embeddedMatch[1]), report);
  assert.match(html, /id="ending-data-cutoff">年度目标：生产数仓只读聚合截至 2026-08-16 23:59:59/);
});
