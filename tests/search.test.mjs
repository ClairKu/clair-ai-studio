import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSearchText,
  reportMatchesQuery,
  reportSearchScore,
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

test("ranks title matches before tags and body content", () => {
  const titleMatch = { ...report, title: "OAP 产品档案", tags: [], savedContent: "" };
  const tagMatch = { ...report, title: "产品档案", tags: ["OAP"], savedContent: "" };
  const bodyMatch = { ...report, title: "产品档案", tags: [], savedContent: "正文包含 OAP" };
  assert.ok(
    reportSearchScore(titleMatch, "OAP", context) > reportSearchScore(tagMatch, "OAP", context),
  );
  assert.ok(
    reportSearchScore(tagMatch, "OAP", context) > reportSearchScore(bodyMatch, "OAP", context),
  );
});

test("searches saved HTML and uploaded-file excerpts", () => {
  assert.equal(
    reportMatchesQuery({ ...report, title: "其他", tags: [], savedHtml: "<p>关键结论：客户旅程</p>" }, "客户旅程", context),
    true,
  );
  assert.equal(
    reportMatchesQuery({ ...report, title: "其他", tags: [], savedFiles: [{ name: "memo.md", excerpt: "增长飞轮" }] }, "增长飞轮", context),
    true,
  );
  assert.equal(
    reportMatchesQuery({ ...report, title: "其他", tags: [], searchContent: "正文中的机器可读令牌" }, "机器可读令牌", context),
    true,
  );
});
