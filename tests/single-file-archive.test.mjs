import assert from "node:assert/strict";
import test from "node:test";

import {
  archiveFilename,
  cssImportPattern,
  extensionOf,
  formatBytes,
  looksLikeResourcePath,
  parseSrcset,
  scanTextReferences,
  serializeSrcset,
  transformTextReferences,
} from "../src/single-file-archive.js";

test("扫描内联数据里的资源路径（报告模板把图片写在 JS 数据里）", () => {
  const source = `const report = {"image":"assets/p1.png","video":"assets/videos/demo.mp4"};
    const DATA_URL = "./data/latest.json";
    const logo = 'https://clairku.github.io/clair-ai-studio/favicon.svg';`;
  assert.deepEqual(scanTextReferences(source, "js"), [
    "assets/p1.png",
    "assets/videos/demo.mp4",
    "./data/latest.json",
    "https://clairku.github.io/clair-ai-studio/favicon.svg",
  ]);
});

test("已内联的 data: URI 不再当成待抓取资源", () => {
  const source = `<img src="data:image/svg+xml,%3Csvg /%3E"><img src="assets/x.png">`;
  assert.deepEqual(scanTextReferences(source, "js"), ["assets/x.png"]);
});

test("样式表里 url() 与 @import 都能被认出来", () => {
  const css = `@import "base.css";
    .a { background: url(../assets/bg.png) no-repeat; }
    .b { background-image: url("hero.jpg"); }`;
  /* 同级 base.css 交给 @import 展开，通用扫描不去追它——那条路上全是
     "Node.js" 之类的假路径。 */
  assert.deepEqual(scanTextReferences(css, "css"), ["../assets/bg.png", "hero.jpg"]);
  const imports = [...css.matchAll(cssImportPattern())];
  assert.equal(imports.length, 1);
  assert.equal(imports[0][4], "base.css");
});

test("改写只替换解析成功的引用，其余原样保留", () => {
  const source = `{"image":"assets/p1.png","cover":"assets/missing.png"}`;
  const output = transformTextReferences(source, "json", (raw) =>
    raw === "assets/p1.png" ? "data:image/png;base64,AAA" : null);
  assert.equal(output, `{"image":"data:image/png;base64,AAA","cover":"assets/missing.png"}`);
});

test("改写 css url() 时统一补上引号，锚点后缀保留", () => {
  const css = `.a { background: url(assets/bg.png); }`;
  assert.equal(
    transformTextReferences(css, "css", () => "blob-stand-in"),
    `.a { background: url("blob-stand-in"); }`,
  );
  assert.equal(
    transformTextReferences(`"icons.svg#arrow"`, "js", () => "clair-asset:3"),
    `"clair-asset:3#arrow"`,
  );
});

test("srcset 逐项改写后能还原描述符", () => {
  const entries = parseSrcset("a.png 1x,  b.png 2x");
  assert.deepEqual(entries, [
    { url: "a.png", descriptor: "1x" },
    { url: "b.png", descriptor: "2x" },
  ]);
  entries[0].url = "data:image/png;base64,AAA";
  assert.equal(serializeSrcset(entries), "data:image/png;base64,AAA 1x, b.png 2x");
});

test("文件名去掉非法字符，扩展名与体积展示可读", () => {
  assert.equal(archiveFilename("且慢/AI: 实践*报告"), "且慢-AI- 实践-报告.html");
  assert.equal(archiveFilename(""), "report.html");
  assert.equal(extensionOf("assets/videos/demo.mp4?v=2"), "mp4");
  assert.equal(formatBytes(900), "900 B");
  assert.equal(formatBytes(2 * 1024 * 1024), "2.0 MB");
});

test("代码里像路径的字符串要过一遍筛子，别去抓模块名和模板占位", () => {
  assert.equal(looksLikeResourcePath("assets/p1.png"), true);
  assert.equal(looksLikeResourcePath("./data/latest.json"), true);
  assert.equal(looksLikeResourcePath("https://cdn.example.com/echarts.min.js"), true);
  assert.equal(looksLikeResourcePath("hero.jpg"), true);
  assert.equal(looksLikeResourcePath("Node.js"), false);
  assert.equal(looksLikeResourcePath("XxxModel.js"), false);
  assert.equal(looksLikeResourcePath("summary.json"), false);
  assert.equal(looksLikeResourcePath("assets/cover-${id}.png"), false);
  /* 正文说明文字里的「站点/页面.html」不是引用 */
  assert.equal(looksLikeResourcePath("交互版：clairku.github.io/pages/oap.html"), false);
  assert.equal(looksLikeResourcePath("assets/图表-趋势.png"), true);
  assert.equal(looksLikeResourcePath("url(#gradient)"), false);
  assert.equal(looksLikeResourcePath("%23n"), false);
  /* 正文里提到的导出文件名不是引用，带目录的才是 */
  assert.equal(looksLikeResourcePath("导出版本-202608121553.xlsx"), false);
  assert.equal(looksLikeResourcePath("downloads/导出版本.xlsx"), true);
});

test("模板占位路径不会被改写", () => {
  const source = "`assets/oap-${data.asOf}.png`";
  assert.equal(transformTextReferences(source, "js", () => "data:image/png;base64,AAA"), source);
});
