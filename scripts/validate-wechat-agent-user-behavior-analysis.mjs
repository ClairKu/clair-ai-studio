import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const slug = "wechat-agent-user-behavior-analysis-2026-09-10";
const reportDir = path.join(root, "public", "reports", slug);
const htmlPath = path.join(reportDir, "index.html");
const dataPath = path.join(reportDir, "data", "latest.js");
const previewPath = path.join(root, "public", "previews", `${slug}.svg`);

const html = fs.readFileSync(htmlPath, "utf8");
const dataSource = fs.readFileSync(dataPath, "utf8");
const preview = fs.readFileSync(previewPath, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(dataSource, sandbox, { filename: dataPath });
const data = sandbox.window.WECHAT_AGENT_BEHAVIOR_DATA;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`✓ ${message}`);
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

assert(data?.meta?.cutoffAt === "2026-09-14 14:16:30", "生产快照截止时刻正确");
assert(data.metrics.users === data.metrics.registeredUsers + data.metrics.anonymousDevices, "用户数 = 实名 + 匿名设备");
assert(sum(data.identityRoles, "value") === data.metrics.users, "身份构成合计等于去重身份数");
assert(sum(data.environments, "identities") === data.metrics.users, "环境身份数合计等于去重身份数");
assert(sum(data.environments, "landing") === data.metrics.landing, "环境 landing 合计等于总 landing");
assert(data.metrics.atomicRaw - data.metrics.excludedManualTests === data.metrics.atomic, "原始调用减手工测试等于净调用");
assert(data.metrics.successes + data.metrics.failures === data.metrics.atomic, "成功 + 失败等于净调用");
assert(Number((data.metrics.failures / data.metrics.atomic * 100).toFixed(2)) === data.metrics.failureRate, "失败率计算正确");
assert(sum(data.skills, "calls") === data.metrics.atomic, "Skill 调用合计等于净调用");
assert(sum(data.errorCodes, "value") === data.metrics.failures, "错误码合计等于失败调用");
assert(sum(data.dailyNonZero, "newUsers") === data.metrics.users, "逐日新增身份合计正确");
assert(sum(data.dailyNonZero, "landing") === data.metrics.landing, "逐日 landing 合计正确");
assert(sum(data.dailyNonZero, "atomic") === data.metrics.atomic, "逐日 atomic 合计正确");
assert(sum(data.dailyNonZero, "failures") === data.metrics.failures, "逐日失败合计正确");
assert(data.dailyNonZero.some((row) => row.date === "2026-08-18" && row.atomic === 2 && row.failures === 2), "08-18 缺失行已补齐");
assert(data.metrics.users - data.baseline.users === data.delta.users, "用户增量与旧页面对账");
assert(data.metrics.landing - data.baseline.landing === data.delta.landing, "landing 增量与旧页面对账");
assert(data.metrics.atomic - data.baseline.atomic === data.delta.atomic, "atomic 增量与旧页面对账");
assert(data.metrics.failures - data.baseline.failures === data.delta.failures, "失败增量与旧页面对账");
assert(data.metrics.attributableConversions === 0, "可归因新增转化保持为 0");

for (const marker of [
  "2026-09-14 14:16:30",
  "2,894",
  "3,792",
  "3.88%",
  "98.3%",
  "可归因新增转化",
  "每日与累计走势",
  "数据来源与索引",
  "数据核对与逻辑自检",
  "./data/latest.js",
]) {
  assert(html.includes(marker), `报告包含关键标记：${marker}`);
}

for (const staleClaim of ["自然用户交易转化", "1 / 3", "黄**", "1947092", "8775775", "1353908"]) {
  assert(!html.includes(staleClaim) && !dataSource.includes(staleClaim) && !preview.includes(staleClaim), `公开产物移除旧结论或直接标识：${staleClaim}`);
}

assert(preview.includes("3,792") && preview.includes("2,894") && preview.includes("可归因新增转化"), "预览图关键数字已刷新");
assert(!/<script[^>]+src=["'](?!https:\/\/cdn\.jsdelivr\.net|\.\/data\/latest\.js)/.test(html), "报告未引入非预期脚本来源");

console.log(`\n微信 Agent 用户行为看板校验通过：${slug}`);
