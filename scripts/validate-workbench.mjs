import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const fail = (message) => {
  throw new Error(message);
};

const appSource = read("src/app.js");
const editorSource = read("src/report-editor.js");
const searchIndexPath = join(new URL(".", root).pathname, "public", "search-index.json");
const taskSource = read("src/task-center.js");
const styleSource = read("src/style.css");
const reportsRoot = join(new URL(".", root).pathname, "public", "reports");
const reportStart = appSource.indexOf("  reports: [");
const reportEnd = appSource.indexOf("\n  ],\n};", reportStart);

if (reportStart < 0 || reportEnd < 0) fail("未找到初始成果目录");

const reportBlock = appSource.slice(reportStart, reportEnd);
const groupBlock = appSource.slice(appSource.indexOf("  groups: ["), reportStart);
if (/\bid:\s*"inbox"/.test(groupBlock) || /\bname:\s*"待整理"/.test(groupBlock)) {
  fail("默认成果目录仍包含系统待整理分组");
}
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

if (reports.length !== 81) {
  fail(`初始成果数量异常：预期 81，实际 ${reports.length}`);
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

if (!existsSync(searchIndexPath)) fail("缺少 HTML 正文搜索索引");
const searchIndex = JSON.parse(readFileSync(searchIndexPath, "utf8"));
if (Object.keys(searchIndex).length < 40) {
  fail(`HTML 正文搜索索引数量异常：${Object.keys(searchIndex).length}`);
}

const requiredSignals = [
  [appSource, 'aria-label="搜索归档"', "归档搜索入口缺失"],
  [appSource, 'data-id="type">Type</button>', "分类按钮未使用英文"],
  [taskSource, 'placeholder="Set an idea in motion"', "统一输入缺少英文提示"],
  [taskSource, 'name: "Decide"', "统一输入操作未使用英文"],
  [taskSource, "brief copied", "决策与评审没有明确的即时结果"],
  [taskSource, "has-intake-content", "统一输入操作没有按交互意图显隐"],
  [taskSource, 'M12 4v11', "保存操作仍使用旧软盘图标"],
  [appSource, "function moveBucketByCommand(", "缺少按钮式跨维度分组排序"],
  [appSource, 'data-action="move-group"', "分组缺少排序按钮"],
  [appSource, 'data-direction="${direction}"', "分组排序按钮缺少方向指令"],
  [appSource, "[featuredBucket, ...catalogBuckets]", "精选成果未置于主题分组顶部"],
  [appSource, 'data-action="scroll-top"', "顶部缺少回顶操作"],
  [appSource, "function buildSearchHits(", "缺少独立搜索结果排序"],
  [appSource, 'fetch("./search-index.json"', "搜索未加载 HTML 正文索引"],
  [appSource, 'class="search-results-panel"', "搜索仍未进入独立结果模式"],
  [appSource, 'data-nav-bucket-id="${escapeHtml(bucket.id)}"', "左侧分组不能作为拖放目标"],
  [appSource, "reportTimeSort === \"modified\"", "TIME 缺少修改时间倒序"],
  [appSource, 'data-action="toggle-time-sort"', "TIME 缺少简洁的创建/修改切换"],
  [appSource, 'class="library-time-titles"', "TIME 左栏缺少成果标题清单"],
  [appSource, 'data-action="toggle-pin"', "卡片缺少精选操作"],
  [appSource, "function bindReportDragging()", "缺少统一卡片拖动会话"],
  [appSource, 'data-report-draggable="true"', "卡片主体未启用按住拖动"],
  [appSource, "session.holdTimer = window.setTimeout", "卡片缺少长按拖动触发"],
  [appSource, "data-add-report-tag", "编辑成果缺少新增标签入口"],
  [appSource, "card-icon-action", "编辑与归档未使用简约图标"],
  [appSource, 'class="studio-icon-button add-topic-icon"', "新增分组图标没有统一样式"],
  [appSource, 'class="studio-icon-button dialog-close-button"', "关闭图标没有统一样式"],
  [appSource, "const contextualTags =", "卡片没有整合分组、类型与完整标签"],
  [appSource, "report-context-tag", "卡片缺少分组与类型的上下文标签"],
  [appSource, 'className = "report-card report-drag-preview"', "拖动时缺少跟手卡片"],
  [appSource, 'className = "report-card report-card-placeholder"', "卡片排序缺少实时占位"],
  [appSource, "scheduleElementAlignment(() => bucketElement", "拖放完成后没有精确定位到分组"],
  [appSource, "Math.max(topbarBottom + 22, navStickyTop)", "桌面成果锚点没有与固定目录吸顶位置对齐"],
  [appSource, "const liveDestination = Math.max", "成果锚点没有在滚动动画中校正布局漂移"],
  [appSource, "function captureViewportSnapshot(", "重绘前没有记录语义化视口锚点"],
  [appSource, "function restoreViewportSnapshot(", "重绘后没有恢复语义化视口锚点"],
  [appSource, "catalogViewportSnapshot = captureViewportSnapshot", "进入成果后没有保存目录现场"],
  [appSource, "renderWithViewportSnapshot(catalogViewportSnapshot", "返回成果库没有恢复目录现场"],
  [appSource, 'renderAtCurrentScroll(() => document.querySelector(".results-toolbar, .archive-search"))', "搜索重绘没有固定结果工具栏"],
  [appSource, "adjacentReportSnapshot(itemId)", "删除或归档成果时没有相邻成果兜底锚点"],
  [editorSource, 'data-editor-page-counter', "HTML 编辑器缺少多页导航"],
  [editorSource, 'data-editor-command="copy"', "HTML 编辑器缺少复制操作"],
  [editorSource, 'data-editor-action="paste"', "HTML 编辑器缺少粘贴操作"],
  [editorSource, 'data-editor-command="delete"', "HTML 编辑器缺少删除操作"],
  [styleSource, ".archive-shell .top-actions .quiet-button", "移动端归档返回修复缺失"],
  [styleSource, ".topic-nav a .nav-index", "分组标题对齐修复缺失"],
  [styleSource, "overflow-anchor: none", "浏览器原生锚点仍会与应用恢复机制冲突"],
];

for (const [source, signal, message] of requiredSignals) {
  if (!source.includes(signal)) fail(message);
}

for (const removedSignal of [
  "taskProgressMarkup",
  "inline-task-progress",
  "clair-ai-studio-tasks-v1",
]) {
  if (taskSource.includes(removedSignal)) {
    fail(`处理队列仍有残留：${removedSignal}`);
  }
}

for (const removedSignal of [
  "AUTH_KEY",
  "gateMarkup",
  'id="login-form"',
  'data-action="lock"',
  "Sign out",
]) {
  if (appSource.includes(removedSignal)) {
    fail(`工作台访问密码仍有残留：${removedSignal}`);
  }
}

const reportHtmlPaths = readdirSync(reportsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(reportsRoot, entry.name, "index.html"))
  .filter(existsSync);
const passwordGatePattern = /type=["']password["']|id=["']password["']|id=["']pass["']|const\s+protectedPayload\s*=|const\s+payload\s*=\s*\{"salt"/i;
const gatedReports = reportHtmlPaths
  .filter((path) => passwordGatePattern.test(readFileSync(path, "utf8")))
  .map((path) => path.slice(reportsRoot.length + 1, -"/index.html".length));
if (gatedReports.length) {
  fail(`成果报告仍包含访问密码：${gatedReports.join("、")}`);
}

if (taskSource.includes("intake-action-label")) {
  fail("统一输入操作仍显示文字标签");
}

for (const removedSignal of [
  "library-time-sort",
  "set-time-sort",
  "featured-mark",
  "scrollIntoView",
  'class="report-drag-handle"',
  'data-action="edit-tags"',
  'modal.type === "tags"',
  'id="tag-form"',
  'class="tag-edit-action"',
  "featuredOnly",
  "draggingGroupId",
  "data-group-drag-id",
  "data-group-drag-kind",
]) {
  if (appSource.includes(removedSignal) || styleSource.includes(removedSignal)) {
    fail(`旧交互仍有残留：${removedSignal}`);
  }
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
