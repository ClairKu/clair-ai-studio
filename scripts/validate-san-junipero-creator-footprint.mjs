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

const data = publicHtml.match(/<script id="works-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
assert.ok(data, "缺少作品数据");
const works = JSON.parse(data);
assert.equal(works.length, 74, "作品档案应为 74 部");
assert.equal(new Set(works.map((work) => work[2])).size, 74, "BVID 应全部唯一");
assert.equal(works.filter((work) => work[5] === "music").length, 7, "音乐时期应为 7 部");
assert.equal(works.filter((work) => work[0] >= "2025-09-19").length, 67, "AI 时代应为 67 部");

console.log(`San_Junipero 作者报告校验通过：${works.length} 部作品，双镜像与预览一致。`);
