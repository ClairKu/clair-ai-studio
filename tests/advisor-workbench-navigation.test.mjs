import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const slug = "yingmi-advisor-workbench-2026-09-10";
const expectedPages = [
  "qieman-market-signal.html",
  "qieman-pension-planner.html",
  "qieman-pension-dashboard.html",
  "qieman-pension-data-analysis.html",
  "qieman-pension-strategy-brief.html",
  "vesta-pension-engine-analysis.html",
  "wechat-ai-dashboard.html",
  "customer-360.html",
  "customer-360-cockpit.html",
  "ontology-explorer.html",
  "index-dark.html",
  "index.html",
];

for (const surface of ["public", "docs"]) {
  test(`${surface} 顾问工作台保留市场信号和全部工具入口`, () => {
    const directory = join(root, surface, "apps", slug);
    const indexPath = join(directory, "index.html");
    const html = readFileSync(indexPath, "utf8");

    assert.match(html, /\{k:'signal',ico:'◐',lb:'市场信号灯'\}/);
    assert.match(html, /\{k:'toolbox',ico:'▦',lb:'全部工具'\}/);
    assert.match(html, /function pgSignal\(\)/);
    assert.match(html, /function pgToolbox\(\)/);

    for (const page of expectedPages) {
      assert.match(html, new RegExp(`file:'${page.replaceAll(".", "\\.")}'`));
      assert.ok(existsSync(join(directory, page)), `${surface} 缺少顾问工作台子页面：${page}`);
    }
  });
}
