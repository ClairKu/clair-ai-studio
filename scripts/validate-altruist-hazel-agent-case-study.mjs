import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const slug = "altruist-hazel-agent-case-study-2026-09-28";
const publicDir = join(root, "public", "reports", slug);
const docsDir = join(root, "docs", "reports", slug);
const publicHtml = readFileSync(join(publicDir, "index.html"), "utf8");
const docsHtml = readFileSync(join(docsDir, "index.html"), "utf8");
const app = readFileSync(join(root, "src", "app.js"), "utf8");
const fail = (message) => { throw new Error(message); };

if (!docsHtml.includes("Altruist × Hazel 双智能体深度案例")) fail("Altruist 报告 docs 构建页缺少标题");
for (const asset of [
  "client-intelligence.png",
  "deterministic-calculators.png",
  "financial-plan-overview.png",
  "tax-planning-workflow.png",
]) {
  const publicAsset = join(publicDir, "assets", asset);
  const docsAsset = join(docsDir, "assets", asset);
  if (!existsSync(publicAsset) || !existsSync(docsAsset)) fail(`报告素材缺失：${asset}`);
  if (readFileSync(publicAsset).compare(readFileSync(docsAsset)) !== 0) fail(`报告素材镜像不一致：${asset}`);
}

const requiredSignals = [
  "第一个：税务规划智能体",
  "第二个：金融规划智能体",
  "零数据保留针对 AI 模型提供商/子处理商",
  "已签署最终协议",
  "官方未披露条款",
  "6.30% 受访者使用份额",
  "确定性计算",
  "90 天可执行路线",
  "EV-018",
];
for (const signal of requiredSignals) {
  if (!publicHtml.includes(signal)) fail(`报告缺少关键口径：${signal}`);
  if (!docsHtml.includes(signal)) fail(`报告 docs 构建页缺少关键口径：${signal}`);
}

if (!app.includes(`id: "${slug}"`)) fail("Altruist 报告未进入工作台目录");
if (!app.includes(`reports/${slug}/`)) fail("Altruist 报告工作台 URL 缺失");
if (!existsSync(join(root, "public", "previews", `${slug}.svg`))) fail("Altruist 报告预览图缺失");
if (!existsSync(join(root, "docs", "previews", `${slug}.svg`))) fail("Altruist 报告 docs 预览图缺失");

const sourceCount = [...publicHtml.matchAll(/class="source"/g)].length;
if (sourceCount !== 18) fail(`证据索引数量异常：${sourceCount}`);
if (!/@media\(max-width:850px\)/.test(publicHtml)) fail("报告缺少移动端布局");
if (!/@media print/.test(publicHtml)) fail("报告缺少打印样式");

console.log("Altruist × Hazel 双智能体案例校验通过：18 项证据、4 张官方素材、public 源与 docs 构建页内容一致。");
