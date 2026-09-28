import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = join(root, "public", "apps", "yingmi-advisor-workbench-2026-09-10");
const expected = [
  "qieman-behavior-bias-checkup.html",
  "morningstar-schwab-behavior-reports.html",
  "client-behavior-bias-quant-report.html",
];

for (const name of expected) {
  const path = join(sourceRoot, name);
  if (!existsSync(path)) throw new Error(`投资者行为项目缺少正式构建源：${path}`);
  const html = readFileSync(path, "utf8");
  if (!/<title>[^<]+<\/title>/i.test(html)) throw new Error(`页面缺少标题：${name}`);
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) throw new Error(`页面缺少移动端 viewport：${name}`);
}

const checkup = readFileSync(join(sourceRoot, expected[0]), "utf8");
const reportPath = join(root, "public", "reports", "investor-behavior-correction-system-2026-09-28", "index.html");
const previewPath = join(root, "public", "previews", "investor-behavior-correction-system-2026-09-28.svg");
const catalogPath = join(root, "src", "app.js");
if (!existsSync(reportPath) || !existsSync(previewPath)) throw new Error("投资者行为项目缺少公开安全报告或预览图");
const report = readFileSync(reportPath, "utf8");
const catalog = readFileSync(catalogPath, "utf8");
for (const marker of ["公开安全版", "不新增公开客户", "DR=PGR−PLR", "Morningstar · Mind the Gap 2026"]) {
  if (!report.includes(marker)) throw new Error(`公开安全报告缺少标记：${marker}`);
}
if (!catalog.includes('id: "investor-behavior-correction-system-2026-09-28"')) throw new Error("Clair 工作台未登记投资者行为项目");
const requiredMarkers = [
  "演示页，不是您的真实账户诊断",
  "缺失指标不再按人群均值填充",
  "默认不勾选",
  "只看非个性化原则",
  "DR=PGR−PLR",
  "路径差",
  "planSel=new Set()",
];
for (const marker of requiredMarkers) {
  if (!checkup.includes(marker)) throw new Error(`行为体检缺少治理标记：${marker}`);
}

const forbiddenPatterns = [
  /isN\(norm\[k\]\)\?norm\[k\]:REF\.all\[k\]/,
  /PGR\/PLR\s*&gt;\s*1\.2\s*视为明显处置效应/,
  /接入真实账户后口径一致。/,
  /这就是行为差的代价/,
];
for (const pattern of forbiddenPatterns) {
  if (pattern.test(checkup)) throw new Error(`行为体检仍含未经验证的生产化表述：${pattern}`);
}

console.log(`投资者行为项目验证通过：${expected.length} 个正式源页面 + 1 份公开安全报告，方法与合规护栏已就位。`);
