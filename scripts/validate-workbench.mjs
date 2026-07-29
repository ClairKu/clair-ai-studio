import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const fail = (message) => {
  throw new Error(message);
};

const appSource = read("src/app.js");
const taskSource = read("src/task-center.js");
const styleSource = read("src/style.css");
const reportStart = appSource.indexOf("  reports: [");
const reportEnd = appSource.indexOf("\n  ],\n};", reportStart);

if (reportStart < 0 || reportEnd < 0) fail("未找到初始成果目录");

const reportBlock = appSource.slice(reportStart, reportEnd);
const reportChunks = reportBlock
  .split(/\n\s{4}\},\n\s{4}\{/)
  .map((chunk) => chunk.replace(/^.*?reports:\s*\[/s, "").trim())
  .filter((chunk) => /\bid:\s*"/.test(chunk));
const reports = reportChunks.map((chunk) => ({
  id: chunk.match(/\bid:\s*"([^"]+)"/)?.[1] || "",
  url: chunk.match(/\burl:\s*"([^"]+)"/)?.[1] || "",
  preview: chunk.match(/\bpreview:\s*"([^"]+)"/)?.[1] || "",
  access: chunk.match(/\baccess:\s*"([^"]+)"/)?.[1] || "",
}));

if (reports.length !== 47) {
  fail(`初始成果数量异常：预期 47，实际 ${reports.length}`);
}

for (const field of ["id", "url"]) {
  const values = reports.map((report) => report[field]).filter(Boolean);
  const duplicates = values.filter((value, index) =>
    values.indexOf(value) !== index);
  if (duplicates.length) {
    fail(`${field} 重复：${[...new Set(duplicates)].join("、")}`);
  }
}

const missingPreviews = reports
  .filter((report) => report.access === "production")
  .filter((report) =>
    !existsSync(join(
      new URL(".", root).pathname,
      "public",
      "previews",
      report.preview || `${report.id}.png`,
    )))
  .map((report) => report.id);
if (missingPreviews.length) {
  fail(`生产成果缺少预览图：${missingPreviews.join("、")}`);
}

const requiredSignals = [
  [appSource, 'aria-label="搜索归档"', "归档搜索入口缺失"],
  [appSource, 'data-id="type">类型</button>', "分类名称未使用“类型”"],
  [taskSource, "任务保存在当前浏览器，不会在后台自动执行", "任务队列缺少本地执行边界"],
  [taskSource, 'class="intake-action-label"', "统一输入操作缺少可见标签"],
  [styleSource, ".archive-shell .top-actions .quiet-button", "移动端归档返回修复缺失"],
];

for (const [source, signal, message] of requiredSignals) {
  if (!source.includes(signal)) fail(message);
}

const docsIndex = read("docs/index.html");
const assetPaths = [...docsIndex.matchAll(/(?:src|href)="\.\/(assets\/[^"]+)"/g)]
  .map((match) => match[1]);
for (const assetPath of assetPaths) {
  if (!existsSync(join(new URL(".", root).pathname, "docs", assetPath))) {
    fail(`构建入口引用了不存在的资源：${assetPath}`);
  }
}

console.log(`工作台校验通过：${reports.length} 个初始成果，${assetPaths.length} 个构建资源。`);
