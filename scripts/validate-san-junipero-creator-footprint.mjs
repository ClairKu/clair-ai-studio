import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const slug = "san-junipero-creator-footprint-2026-10-10";
const read = (path) => readFileSync(`${root}${path}`, "utf8");
const publicHtml = read(`public/reports/${slug}/index.html`);
const docsHtml = read(`docs/reports/${slug}/index.html`);
const publicPreview = read(`public/previews/${slug}.svg`);
const docsPreview = read(`docs/previews/${slug}.svg`);
const app = read("src/app.js");

const withoutInjectedGate = (html) => html
  .replace(
    /\s*<meta name="robots"[^>]*data-clair-access-robots[^>]*\/?>\s*<script data-clair-access-gate[^>]*><\/script>\s*/,
    "\n",
  )
  .replace(/\n[ \t]+/g, "\n");
assert.equal(withoutInjectedGate(publicHtml), withoutInjectedGate(docsHtml), "public/docs 报告正文不一致");
if (docsHtml.includes("data-clair-access-gate")) {
  assert.match(docsHtml, /data-clair-access-scope="report"/, "docs 报告访问域应为 report");
}
assert.equal(publicPreview, docsPreview, "public/docs 预览镜像不一致");
assert.match(app, new RegExp(`id: "${slug}"`));
assert.match(publicHtml, /UID 1228413958/);
assert.match(publicHtml, /76 与 74 为什么不一致/);
assert.match(publicHtml, /已证实[\s\S]*高概率[\s\S]*未证实|已证实[\s\S]*未公开/);
assert.match(publicHtml, /https:\/\/space\.bilibili\.com\/1228413958/);
assert.match(publicHtml, /https:\/\/www\.bilibili\.com\/video\/BV1zQpK63E4M\//);
assert.match(publicHtml, /7 部原创 \/ 准原创科幻/);
assert.match(publicHtml, /《黑镜》到底是什么/);
assert.match(publicHtml, /Black Umbrella \/ 黑伞公司/);

const data = publicHtml.match(/<script id="works-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
assert.ok(data, "缺少作品数据");
const works = JSON.parse(data);
assert.equal(works.length, 74, "作品档案应为 74 部");
assert.equal(new Set(works.map((work) => work[2])).size, 74, "BVID 应全部唯一");
assert.equal(works.filter((work) => work[5] === "music").length, 7, "音乐时期应为 7 部");
assert.equal(works.filter((work) => work[0] >= "2025-09-19").length, 67, "AI 时代应为 67 部");

const notesData = publicHtml.match(/<script id="work-notes-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
assert.ok(notesData, "缺少逐片导览数据");
const notes = JSON.parse(notesData);
assert.equal(Object.keys(notes).length, 74, "逐片导览应覆盖 74 部作品");
assert.deepEqual(works.filter((work) => !notes[work[2]]), [], "每部作品都应有内容导览");

const blackMirrorData = publicHtml.match(/<script id="blackmirror-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
assert.ok(blackMirrorData, "缺少《黑镜》逐集数据");
const blackMirror = JSON.parse(blackMirrorData);
assert.equal(blackMirror.length, 34, "《黑镜》导览应为 32 集 + 特别篇 + 互动电影，共 34 个观看单元");
assert.ok(blackMirror.some((episode) => episode.title.includes("San Junipero")), "缺少《San Junipero》条目");
assert.ok(blackMirror.some((episode) => episode.title.includes("Common People")), "缺少第七季《Common People》条目");

console.log(`San_Junipero 作者报告校验通过：${works.length} 部逐片导览、${blackMirror.length} 个《黑镜》观看单元，双镜像与预览一致。`);
