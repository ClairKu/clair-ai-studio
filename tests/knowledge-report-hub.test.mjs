import test from "node:test";
import assert from "node:assert/strict";
import {
  createReportRecord,
  extractKnowledgeCards,
  inferCategory,
  keywordTokens,
  linkKnowledgeGraph,
} from "../public/reports/knowledge-report-hub/extractor.js";

test("extracts traceable metric, risk and action cards", () => {
  const report = {
    id: "report-a",
    title: "企业 AI 规模化研究",
    body: "2026 年已有 23% 的企业实现规模化部署。仍有 38% 未试验，主要风险是治理缺口。下一步应该优先建立审批、证据日志与回滚机制。",
    tags: ["AI", "企业"],
    createdAt: "2026-10-10T00:00:00Z",
  };
  const cards = extractKnowledgeCards(report, 6);
  assert.ok(cards.length >= 2);
  assert.ok(cards.some((card) => card.metric.includes("23%")));
  assert.ok(cards.some((card) => card.type === "risk"));
  assert.ok(cards.some((card) => card.type === "action"));
  assert.ok(cards.every((card) => card.reportId === report.id && card.anchor && Number.isInteger(card.offset)));
});

test("classifies materials and produces useful bilingual tokens", () => {
  assert.equal(inferCategory("用户转化、留存、活跃与获客漏斗分析"), "用户与增长");
  const tokens = keywordTokens("Agent workflow 与企业智能体治理，Agent 需要审计日志");
  assert.ok(tokens.includes("agent"));
  assert.ok(tokens.some((token) => token.includes("治理")));
});

test("links cards and reports through shared evidence topics", () => {
  const first = createReportRecord({ title: "Agent 企业采用", body: "企业 Agent 采用率增长到 41%，治理与审计是规模化关键。" });
  first.id = "report-1";
  first.tags = ["Agent", "治理", "企业"];
  const second = createReportRecord({ title: "Agent 治理框架", body: "Agent 规模化需要治理、审批、证据日志与回滚。" });
  second.id = "report-2";
  second.tags = ["Agent", "治理", "企业"];
  const cards = [...extractKnowledgeCards(first), ...extractKnowledgeCards(second)];
  const linked = linkKnowledgeGraph([first, second], cards);
  assert.ok(linked.reports[0].relatedReportIds.includes("report-2"));
  assert.ok(linked.cards.some((card) => card.relatedCardIds.length > 0));
});
