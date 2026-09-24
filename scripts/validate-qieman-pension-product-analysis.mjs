import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const slug = "qieman-pension-product-analysis-2026-09-21";
const path = (base, suffix) => join(new URL(".", root).pathname, base, suffix);
const files = {
  publicHtml: path("public/reports", `${slug}/index.html`),
  docsHtml: path("docs/reports", `${slug}/index.html`),
  publicPreview: path("public/previews", `${slug}.svg`),
  docsPreview: path("docs/previews", `${slug}.svg`),
};
const fail = (message) => { throw new Error(message); };
for (const [name, file] of Object.entries(files)) if (!existsSync(file)) fail(`${name} 缺失：${file}`);
const html = readFileSync(files.publicHtml, "utf8");
const docs = readFileSync(files.docsHtml, "utf8");
const preview = readFileSync(files.publicPreview, "utf8");
if (preview !== readFileSync(files.docsPreview, "utf8")) fail("docs/public 预览镜像不一致");
for (const signal of ["且慢养老产品数据分析报告", "3,020", "669.98", "69.9%", "历史业绩与风险提示", "已授权工作台发布"]) {
  if (!html.includes(signal) || !docs.includes(signal)) fail(`docs/public 报告缺少关键内容：${signal}`);
}
for (const signal of ["且慢养老产品数据分析", "3,020", "669.98万", "69.9%", "授权发布版"]) {
  if (!preview.includes(signal)) fail(`预览缺少关键内容：${signal}`);
}
const prohibited = [
  /ontology\.yingmi-inc\.com/i,
  /Ue7-bF10S6227B2dSW3jZ5x-LkTAvi-C/,
  /ying99_/i,
  /qm_meta/i,
  /dw-tidb/i,
  /MaxCompute/i,
  /identity_no/i,
  /risk5_level/i,
  /uma\.qmp\.js/i,
];
for (const rule of prohibited) if (rule.test(`${html}\n${docs}\n${preview}`)) fail(`公开产物含内部或敏感标记：${rule}`);
if (!/width:min\(1080px,calc\(100% - 32px\)\)/.test(html) || !/@media\(max-width:430px\)/.test(html)) fail("缺少响应式布局");
console.log("且慢养老产品数据分析报告校验通过：正文、预览、镜像、风险提示与敏感信息检查均通过。");
