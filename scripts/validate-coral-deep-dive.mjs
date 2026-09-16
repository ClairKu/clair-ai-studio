import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const slug = "coral-investment-research-system-deep-dive-2026-09-16";
const docs = join(root, "docs", "reports", slug, "index.html");
const pub = join(root, "public", "reports", slug, "index.html");
const previewDocs = join(root, "docs", "previews", `${slug}.svg`);
const previewPub = join(root, "public", "previews", `${slug}.svg`);
const app = readFileSync(join(root, "src", "app.js"), "utf8");
const html = readFileSync(docs, "utf8");

const required = [
  [existsSync(pub), "public 报告镜像缺失"],
  [existsSync(previewDocs) && existsSync(previewPub), "预览图镜像缺失"],
  [readFileSync(pub, "utf8") === html, "docs/public 报告不一致"],
  [app.includes(`id: "${slug}"`), "工作台未登记报告"],
  [html.includes("data-clair-access-gate"), "报告缺少访问门禁"],
  [html.includes("15 个能力域") && html.includes("122") && html.includes("408"), "核心盘点数据缺失"],
  [html.includes("@media(max-width:560px)"), "缺少窄屏布局"],
  [html.includes("证据等级") && html.includes("当前网页实机限制"), "缺少证据边界"],
];
for (const [ok, message] of required) if (!ok) throw new Error(message);
console.log("CORAL deep-dive validation passed");
