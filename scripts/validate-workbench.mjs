import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const fail = (message) => {
  throw new Error(message);
};

const appSource = read("src/app.js");
const editorSource = read("src/report-editor.js");
const fileRendererSource = read("src/file-renderers.js");
const fileTypesSource = read("src/file-types.js");
const searchSource = read("src/search.js");
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

if (reports.length !== 94) {
  fail(`初始成果数量异常：预期 94，实际 ${reports.length}`);
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
  [appSource, 'class="search-toolbar-dimensions"', "搜索框右侧缺少匹配维度筛选"],
  [appSource, 'data-action="toggle-search-dimension"', "搜索匹配维度不可切换"],
  [appSource, "searchDimensionFilters", "搜索匹配维度不支持多选"],
  [appSource, "匹配到了", "搜索结果缺少明确命中数量"],
  [appSource, "function searchPriorityGroupsMarkup(", "搜索结果没有按匹配优先级分组"],
  [appSource, 'class="search-priority-group"', "搜索结果缺少优先级区分"],
  [styleSource, ".results-search .search-clear-button", "搜索清除按钮未统一视觉样式"],
  [appSource, "function bindAppModal()", "弹窗缺少统一无障碍管理"],
  [appSource, "element.inert = true", "弹窗背景没有设置 inert"],
  [appSource, 'event.key === "Escape"', "弹窗缺少 Escape 关闭"],
  [appSource, 'role="dialog" aria-modal="true"', "弹窗缺少标准对话框语义"],
  [appSource, "function showUndoToast(", "即时管理动作缺少撤销入口"],
  [appSource, "duration: 8000", "撤销窗口不足 8 秒"],
  [appSource, 'type: "delete-report"', "永久删除缺少二次确认弹窗"],
  [appSource, 'class="search-results-panel"', "搜索仍未进入独立结果模式"],
  [appSource, 'data-nav-bucket-id="${escapeHtml(bucket.id)}"', "左侧分组不能作为拖放目标"],
  [appSource, "reportTimeSort === \"modified\"", "TIME 缺少修改时间倒序"],
  [appSource, 'data-action="toggle-time-sort"', "TIME 缺少简洁的创建/修改切换"],
  [appSource, 'class="library-time-titles"', "TIME 左栏缺少成果标题清单"],
  [appSource, 'data-action="toggle-pin"', "卡片缺少精选操作"],
  [appSource, "function bindReportDragging()", "缺少统一卡片拖动会话"],
  [appSource, 'addEventListener("compositionend"', "搜索框缺少中文输入法完成事件"],
  [appSource, "commitSearchInput", "搜索框没有统一提交查询状态"],
  [appSource, "SEARCH_INPUT_DEBOUNCE_MS", "搜索输入缺少合并提交保护"],
  [appSource, "function renderSearchAtCurrentScroll(", "搜索重绘没有精确保持滚动位置"],
  [appSource, "function renderSearchResultsInPlace()", "搜索仍会替换整个工作台"],
  [appSource, "currentGroups.replaceWith(nextGroups)", "搜索结果没有局部更新"],
  [appSource, "appSearchBound", "局部更新后搜索事件可能重复绑定"],
  [appSource, "function renderWorkbenchWithViewportSnapshot(", "局部重绘没有统一恢复语义锚点"],
  [appSource, "const anchor = resolveViewportAnchor(identity) || element", "视口快照仍可能混用子元素与父锚点坐标"],
  [appSource, "function checkForApplicationUpdate(", "长期打开的标签页无法发现新版应用"],
  [appSource, 'location.replace(latestUrl)', "新版应用提示缺少可靠刷新操作"],
  [styleSource, "scrollbar-gutter: stable", "搜索结果高度变化仍会引发滚动条横向抖动"],
  [styleSource, ".app-update-notice", "应用更新缺少可见刷新提示"],
  [searchSource, "function segmentHanToken(", "搜索缺少连续中文短语拆分"],
  [searchSource, "function damerauLevenshteinWithin(", "搜索缺少错别字与相邻字符颠倒容错"],
  [searchSource, "function fuzzyDistanceLimit(", "搜索模糊范围缺少长度约束"],
  [searchSource, "SEARCH_FIELD_WEIGHTS", "搜索模糊结果缺少字段降权排序"],
  [appSource, "persistUploadedFiles", "上传档案没有保存到浏览器文件库"],
  [appSource, "hydrateSavedFilePreviews", "已保存档案没有恢复预览"],
  [appSource, 'class="saved-file-embedded-content"', "阅读页没有直接嵌入档案正文"],
  [appSource, "renderRichFile", "阅读页没有接入富文件解析器"],
  [appSource, '"pdf-thumb"', "成果卡片没有限制为 PDF 单页缩略图"],
  [appSource, 'data-action="download-saved-file"', "已保存档案缺少下载入口"],
  [taskSource, "SUPPORTED_FILE_ACCEPT", "上传入口没有限制为支持的档案格式"],
  [taskSource, "attachment-format", "上传档案没有显示格式标识"],
  [fileTypesSource, 'label: "PDF"', "档案类型缺少 PDF"],
  [fileTypesSource, 'label: "HTML"', "档案类型缺少 HTML"],
  [fileTypesSource, 'label: "PNG"', "档案类型缺少 PNG"],
  [fileTypesSource, 'label: "WORD"', "档案类型缺少 WORD"],
  [fileTypesSource, 'label: "EXCEL"', "档案类型缺少 EXCEL"],
  [fileTypesSource, 'label: "PPT"', "档案类型缺少 PPT"],
  [fileTypesSource, 'label: "MD"', "档案类型缺少 MD"],
  [fileRendererSource, 'import("mammoth")', "缺少 Word 页面内解析"],
  [fileRendererSource, 'import("pdfjs-dist/build/pdf.mjs")', "缺少 PDF 逐页正文渲染"],
  [fileRendererSource, 'import("xlsx")', "缺少 Excel 页面内解析"],
  [fileRendererSource, 'import("pptx-preview")', "缺少 PPT 页面内解析"],
  [fileRendererSource, "markdownToHtml", "缺少 Markdown 页面内渲染"],
  [appSource, 'data-report-draggable="true"', "卡片主体未启用按住拖动"],
  [appSource, "session.holdTimer = window.setTimeout", "卡片缺少长按拖动触发"],
  [appSource, "session.previewOffsetX", "拖动预览没有保持整卡抓取位置"],
  [appSource, "const scheduleDragUpdate =", "拖动更新没有按动画帧节流"],
  [appSource, 'draggable="false"', "预览图片仍会触发浏览器原生半卡拖动"],
  [appSource, "data-add-report-tag", "编辑成果缺少新增标签入口"],
  [appSource, "card-icon-action", "编辑与归档未使用简约图标"],
  [appSource, "const hiddenCardTags", "卡片没有过滤保存介质标签"],
  [appSource, "const editingLocalCard", "本地成果仍不能使用统一编辑操作"],
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
  [appSource, "renderSearchAtCurrentScroll();", "搜索重绘没有固定当前视口"],
  [appSource, "adjacentReportSnapshot(itemId)", "删除或归档成果时没有相邻成果兜底锚点"],
  [editorSource, 'data-editor-page-counter', "HTML 编辑器缺少多页导航"],
  [editorSource, "isInlineHydrator", "动态 HTML 正文仍会在编辑器中被禁用"],
  [editorSource, "localStudioReportUrl", "HTML 编辑器没有优先读取站内源文件"],
  [editorSource, 'data-editor-command="copy"', "HTML 编辑器缺少复制操作"],
  [editorSource, 'data-editor-action="paste"', "HTML 编辑器缺少粘贴操作"],
  [editorSource, 'data-editor-command="delete"', "HTML 编辑器缺少删除操作"],
  [editorSource, 'data-editor-block="copy"', "HTML 编辑器缺少区块复制"],
  [editorSource, 'data-editor-block="paste"', "HTML 编辑器缺少区块粘贴"],
  [editorSource, 'data-editor-block="up"', "HTML 编辑器缺少区块上移"],
  [editorSource, 'data-editor-block="down"', "HTML 编辑器缺少区块下移"],
  [editorSource, 'data-editor-block="delete"', "HTML 编辑器缺少区块删除"],
  [editorSource, 'data-editor-insert', "HTML 编辑器缺少内容插入入口"],
  [editorSource, '<option value="markdown">Markdown</option>', "HTML 编辑器缺少 Markdown 区块"],
  [editorSource, '<option value="html">HTML</option>', "HTML 编辑器缺少 HTML 区块"],
  [editorSource, 'data-editor-image-input', "HTML 编辑器缺少图片插入"],
  [editorSource, 'data-editor-file-input', "HTML 编辑器缺少文件插入"],
  [editorSource, 'data-block-kind="table"', "HTML 编辑器缺少表格插入"],
  [editorSource, 'data-editor-color="foreColor"', "HTML 编辑器缺少文字颜色"],
  [editorSource, 'resize: both', "HTML 编辑器区块不能拖拉缩放"],
  [editorSource, 'document.addEventListener("dragstart"', "HTML 编辑器区块不能拖动"],
  [styleSource, ".archive-shell .top-actions .quiet-button", "移动端归档返回修复缺失"],
  [styleSource, ".topic-nav a .nav-index", "分组标题对齐修复缺失"],
  [styleSource, "body {\n  margin: 0;\n  overflow-anchor: none;", "工作台根节点仍会触发浏览器原生滚动锚定"],
  [styleSource, ".groups-section {\n  overflow-anchor: none;", "动态成果区仍会被浏览器选为原生滚动锚点"],
  [appSource, 'searchInput.addEventListener("beforeinput"', "搜索输入前未捕获滚动位置"],
  [appSource, "VIEWPORT_RESTORE_SETTLE_MS = 720", "搜索重绘后未覆盖浏览器延迟布局修正"],
];

for (const [source, signal, message] of requiredSignals) {
  if (!source.includes(signal)) fail(message);
}

const cardActionsSource = appSource.slice(
  appSource.indexOf('<div class="card-actions">'),
  appSource.indexOf("function modalMarkup"),
);
const cardActionOrder = [
  'data-action="archive"',
  'data-action="edit"',
  'data-action="toggle-pin"',
].map((signal) => cardActionsSource.indexOf(signal));
if (cardActionOrder.some((index) => index < 0) ||
    !(cardActionOrder[0] < cardActionOrder[1] && cardActionOrder[1] < cardActionOrder[2])) {
  fail("卡片操作未按归档、编辑、收藏排列");
}
if (styleSource.includes(".report-card:has(.local-html-preview-frame) .report-preview::before")) {
  fail("本地 HTML 卡片仍显示特殊角标");
}
if (/\.report-card\.is-card-drop-(?:before|after)/.test(styleSource)) {
  fail("卡片拖动仍显示蓝色插入定位线");
}
if (!/\.report-tags\s*>\s*\.report-context-tag\s*\{[^}]*border:\s*0;/s.test(styleSource)) {
  fail("紫色上下文标签仍有边框");
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
  "search-coverage-strip",
  "report-search-meta",
  "report-search-excerpt",
  "report-match-source",
  "report-index-state",
  "search-dimension-controls",
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
