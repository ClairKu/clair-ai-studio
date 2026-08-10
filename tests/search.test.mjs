import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSearchText,
  reportArchiveMatchesQuery,
  reportMatchesQuery,
  reportSearchMatchFields,
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

test("matches title, category, tags, and body content", () => {
  for (const query of [
    "上线以来",
    "经营汇报",
    "AI 开放平台",
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

test("keeps archive search compatible with source, URL, and access metadata", () => {
  assert.equal(reportArchiveMatchesQuery(report, "AI 开放平台", context), true);
  assert.equal(reportArchiveMatchesQuery(report, "oap-trend", context), true);
  assert.equal(reportArchiveMatchesQuery(report, "生产 直达", context), true);
  assert.equal(reportMatchesQuery(report, "   ", context), true);
});

test("ranks title before category, tags, and body content", () => {
  const titleMatch = { ...report, title: "OAP 产品档案", tags: [], savedContent: "" };
  const categoryMatch = { ...report, title: "产品档案", tags: [], savedContent: "" };
  const tagMatch = { ...report, title: "产品档案", tags: ["OAP"], savedContent: "" };
  const bodyMatch = { ...report, title: "产品档案", tags: [], savedContent: "正文包含 OAP" };
  const categoryContext = { group: { name: "OAP 分类" }, workTypeName: "" };
  assert.ok(
    reportSearchScore(titleMatch, "OAP", { group: {}, workTypeName: "" })
      > reportSearchScore(categoryMatch, "OAP", categoryContext),
  );
  assert.ok(
    reportSearchScore(categoryMatch, "OAP", categoryContext)
      > reportSearchScore(tagMatch, "OAP", { group: {}, workTypeName: "" }),
  );
  assert.ok(
    reportSearchScore(tagMatch, "OAP", { group: {}, workTypeName: "" })
      > reportSearchScore(bodyMatch, "OAP", { group: {}, workTypeName: "" }),
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

test("reports whether a query matched title, category, tags, or content", () => {
  const searchable = {
    ...report,
    title: "资产配置工作台",
    tags: ["投顾服务"],
    searchContent: "正文包含客户旅程和持仓诊断",
  };
  assert.deepEqual(reportSearchMatchFields(searchable, "资产配置", context), ["title"]);
  assert.deepEqual(reportSearchMatchFields(searchable, "Agents", context), ["category"]);
  assert.deepEqual(reportSearchMatchFields(searchable, "投顾服务", context), ["tags"]);
  assert.deepEqual(reportSearchMatchFields(searchable, "持仓诊断", context), ["content"]);
  assert.deepEqual(
    reportSearchMatchFields(searchable, "资产配置 投顾服务", context),
    ["title", "tags"],
  );
});
