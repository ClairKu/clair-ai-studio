import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const slug = "ifast-corporation-deep-dive-2026-09-28";
const publicHtml = readFileSync(join(root, "public", "reports", slug, "index.html"), "utf8");
const docsHtml = readFileSync(join(root, "docs", "reports", slug, "index.html"), "utf8");
const app = readFileSync(join(root, "src", "app.js"), "utf8");
const registry = JSON.parse(readFileSync(join(root, "catalog", "report-registry.json"), "utf8"));
const fail = (message) => { throw new Error(message); };

for (const signal of [
  "奕丰 iFAST 全景深度报告",
  "B2B 净收入为 1.6988 亿新元",
  "AI 不是“投顾大脑”",
  "不能把全部投诉归因于 iFAST",
  "2030 年 AUA 目标 1,000 亿新元",
  "90 天验证计划",
  "EV-018",
]) {
  if (!publicHtml.includes(signal)) fail(`报告缺少关键口径：${signal}`);
  if (!docsHtml.includes(signal)) fail(`docs 镜像缺少关键口径：${signal}`);
}
if (!app.includes(`id: "${slug}"`)) fail("iFAST 报告未进入工作台目录");
if (!app.includes(`reports/${slug}/`)) fail("iFAST 报告工作台 URL 缺失");
if (!registry.protectedReportIds.includes(slug)) fail("iFAST 报告未进入保护清单");
for (const dir of ["public", "docs"]) {
  if (!existsSync(join(root, dir, "previews", `${slug}.svg`))) fail(`${dir} 预览图缺失`);
}
const sourceCount = [...publicHtml.matchAll(/class="source"/g)].length;
if (sourceCount !== 18) fail(`证据索引数量异常：${sourceCount}`);
const evidenceIds = new Set([...publicHtml.matchAll(/EV-(\d{3})/g)].map((match) => match[0]));
if (evidenceIds.size !== 18) fail(`证据编号数量异常：${evidenceIds.size}`);
if (!/@media\(max-width:560px\)/.test(publicHtml)) fail("报告缺少手机端布局");
if (!/@media print/.test(publicHtml)) fail("报告缺少打印样式");

console.log("iFAST 全景报告校验通过：18 项证据、关键责任边界、public/docs 镜像与工作台登记完整。");
