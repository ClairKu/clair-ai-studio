import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const report = path.join(root, "public/reports/wechat-ai-agent-usage-dashboard-2026-09-10/index.html");
const app = path.join(root, "src/app.js");
const html = fs.readFileSync(report, "utf8");
const catalog = fs.readFileSync(app, "utf8");

function need(condition, message) {
  if (!condition) throw new Error(message);
}
function array(name) {
  const match = html.match(new RegExp(`const ${name}=(\\[[\\s\\S]*?\\]);`));
  need(match, `missing ${name}`);
  return vm.runInNewContext(match[1]);
}

const daily = array("DAILY");
const quality = array("QUALITY");
const skills = array("SKILLS");
const pages = array("PAGES");
const targets = array("TARGETS");
const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);

need(daily.length === 8, "daily window must cover 09-07 through 09-14");
need(sum(daily, "landing") === 240, "daily landing total mismatch");
need(sum(daily, "atomic") === 329, "daily atomic total mismatch");
need(quality.length === 19 && sum(quality, "total") === 3803, "API totals mismatch");
need(sum(quality, "fail") === 148, "API failure total mismatch");
need(skills.length === 7 && sum(skills, "value") === 3803, "Skill totals mismatch");
need(sum(pages, "value") === 2894, "page_name total mismatch");
need(targets.length === 8 && sum(targets, "value") === 2894, "target category total mismatch");

for (const marker of ["2026-09-14 10:06", "2,894", "3,803", "96.1%", "不完整日", "未使用 OAP 经营驾驶舱", "生活服务", "金融理财", "移动视频", "实用工具", "移动购物", "本次更新记录", "已聚合脱敏"]) {
  need(html.includes(marker), `missing marker: ${marker}`);
}
need(catalog.includes("上线以来落地 2,894 次、原子接口调用 3,803 次"), "catalog source is stale");
need(catalog.includes("明确排除 OAP 经营驾驶舱"), "catalog exclusion is missing");

for (const unsafe of ["1947092", "search/消费", "search/半导体", "SI000", "ZH000", "postId=", "target_url 分组，共 68"]) {
  need(!html.includes(unsafe), `public report still exposes stale detail: ${unsafe}`);
}

console.log("wechat AI usage dashboard validation passed");
