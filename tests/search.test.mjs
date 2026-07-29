import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSearchText,
  reportMatchesQuery,
  searchTokens,
} from "../src/search.js";

const report = {
  title: "OAP 运营趋势｜上线以来",
  source: "AI 开放平台",
  url: "https://clairku.github.io/reports/oap-trend/",
  access: "production",
  workType: "data-analysis",
  tags: ["数据分析", "经营汇报"],
};

const context = {
  group: {
    name: "AI 开放平台",
    description: "MCP、Skills、Agents 与治理",
  },
  workTypeName: "数据分析",
};

test("normalizes case, full-width characters, accents, and whitespace", () => {
  assert.equal(normalizeSearchText("  ＯＡＰ   Résumé  "), "oap resume");
});

test("splits multi-keyword queries", () => {
  assert.deepEqual(searchTokens(" OAP   数据 "), ["oap", "数据"]);
});

test("matches title, tags, source, URL, work type, and topic metadata", () => {
  for (const query of [
    "上线以来",
    "经营汇报",
    "AI 开放平台",
    "oap-trend",
    "数据分析",
    "Agents 治理",
  ]) {
    assert.equal(reportMatchesQuery(report, query, context), true, query);
  }
});

test("requires every keyword to match", () => {
  assert.equal(reportMatchesQuery(report, "OAP 数据分析", context), true);
  assert.equal(reportMatchesQuery(report, "OAP 基金", context), false);
});

test("supports access-state aliases and blank queries", () => {
  assert.equal(reportMatchesQuery(report, "生产 直达", context), true);
  assert.equal(reportMatchesQuery(report, "   ", context), true);
});
