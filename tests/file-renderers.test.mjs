import test from "node:test";
import assert from "node:assert/strict";

import { markdownToHtml } from "../src/file-renderers.js";

test("renders common Markdown blocks for the inline reader", () => {
  const html = markdownToHtml("# 标题\n\n**重点**\n\n- 第一项\n- 第二项\n\n```js\nconst ok = true;\n```");
  assert.match(html, /<h1>标题<\/h1>/);
  assert.match(html, /<strong>重点<\/strong>/);
  assert.match(html, /<ul>[\s\S]*<li>第一项<\/li>/);
  assert.match(html, /<pre><code data-language="js">const ok = true;<\/code><\/pre>/);
});

test("escapes raw HTML and rejects unsafe Markdown links", () => {
  const html = markdownToHtml("<script>alert(1)</script>\n\n[危险](javascript:alert(1))");
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.match(html, /&lt;script&gt;/);
});
