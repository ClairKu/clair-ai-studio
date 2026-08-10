import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSearchText,
  reportArchiveMatchesQuery,
  reportMatchesQuery,
  reportSearchDetails,
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
  assert.deepEqual(searchTokens("且慢AI小顾"), ["且慢", "ai", "小顾"]);
  assert.deepEqual(searchTokens("且 慢 / A I - 小 顾"), ["且慢", "ai", "小顾"]);
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

test("handles mixed Chinese and Latin text without spaces or with arbitrary separators", () => {
  const qiemanReport = {
    ...report,
    title: "且慢投顾页｜本体盘点与新版设计方案",
    tags: ["AI 小顾", "投顾服务"],
    searchContent: "从投前了解、持仓诊断到投后陪伴",
  };
  assert.equal(reportMatchesQuery(qiemanReport, "且慢AI小顾", context), true);
  assert.equal(reportMatchesQuery(qiemanReport, "且 慢 / A I - 小 顾", context), true);
  assert.deepEqual(
    reportSearchMatchFields(qiemanReport, "且慢AI小顾", context),
    ["title", "category", "tags"],
  );
});

test("segments a continuous Chinese compound only when the whole phrase is absent", () => {
  const qiemanReport = {
    ...report,
    title: "且慢投顾服务重构",
    tags: ["AI 小顾"],
  };
  assert.equal(reportMatchesQuery(qiemanReport, "且慢小顾", context), true);
  assert.deepEqual(reportSearchMatchFields(qiemanReport, "且慢小顾", context), ["title", "tags"]);
});

test("accepts one controlled Chinese typo and an adjacent Latin transposition", () => {
  const qiemanReport = {
    ...report,
    title: "且慢投顾服务重构",
    tags: ["AI 小顾"],
  };
  assert.equal(reportMatchesQuery(qiemanReport, "且曼AI小顾", context), true);
  assert.equal(reportMatchesQuery(report, "Agnets 治理", context), true);
  assert.equal(reportMatchesQuery(qiemanReport, "完全无关词", context), false);
  assert.equal(reportSearchDetails(qiemanReport, "且曼AI小顾", context).fuzzy, true);
});

test("keeps exact matches ahead of typo-only matches", () => {
  const exact = { ...report, title: "且曼观察", tags: [] };
  const fuzzy = { ...report, title: "且慢观察", tags: [] };
  assert.ok(
    reportSearchScore(exact, "且曼", { group: {}, workTypeName: "" })
      > reportSearchScore(fuzzy, "且曼", { group: {}, workTypeName: "" }),
  );
});

test("keeps an exact continuous phrase ahead of a segmented phrase", () => {
  const exact = {
    ...report,
    title: "报告甲",
    tags: [],
    searchContent: "接口调用量从何时开始累计",
  };
  const segmented = {
    ...report,
    title: "报告乙",
    tags: [],
    searchContent: "接口调用量、从何时、开始累计",
  };
  assert.ok(
    reportSearchScore(exact, "接口调用量从何时开始累计", { group: {}, workTypeName: "" })
      > reportSearchScore(segmented, "接口调用量从何时开始累计", { group: {}, workTypeName: "" }),
  );
});

test("treats short Latin abbreviations as whole words", () => {
  assert.equal(
    reportMatchesQuery({ ...report, title: "AI 产品方案", tags: [] }, "AI", { group: {}, workTypeName: "" }),
    true,
  );
  assert.equal(
    reportMatchesQuery({ ...report, title: "Daily detail", tags: [] }, "AI", { group: {}, workTypeName: "" }),
    false,
  );
});
