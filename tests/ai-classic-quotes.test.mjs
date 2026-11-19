import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { filterQuotes, safeSourceUrl } from "../public/reports/knowledge-report-hub/quotes/app.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const hub = "reports/knowledge-report-hub/";
const read = (path) => readFileSync(new URL(path, `file://${root}`), "utf8");
const loadFeed = () => JSON.parse(read(`public/${hub}data/ai-classic-quotes.json`));
const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const relationTypes = new Set(["similar", "tension", "complement"]);

function validPartialDate(value) {
  if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return false;
  const [year, month = "01", day = "01"] = value.split("-");
  const full = `${year}-${month}-${day}`;
  const parsed = new Date(`${full}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === full;
}

test("classic quotes feed has complete bilingual provenance and editorial boundaries", () => {
  const feed = loadFeed();
  assert.equal(feed.schema, "clair-ai-classic-quotes/v1");
  assert.ok(Number.isFinite(Date.parse(feed.updatedAt)), "updatedAt must be a valid timestamp");
  assert.ok(hasText(feed.editorialNote), "editorial and translation status must be stated");
  assert.ok(Array.isArray(feed.quotes) && feed.quotes.length >= 10);
  assert.equal(new Set(feed.quotes.map((quote) => quote.id)).size, feed.quotes.length);

  for (const quote of feed.quotes) {
    for (const field of ["id", "quoteEn", "quoteZh", "speaker", "speakerRole", "date", "dateLabel", "occasion", "context", "target", "thesis", "interpretation", "caveat"]) {
      assert.ok(hasText(quote[field]), `${quote.id}: missing ${field}`);
    }
    assert.match(quote.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(quote.quoteEn, /[A-Za-z]/, `${quote.id}: English excerpt required`);
    assert.match(quote.quoteZh, /[\u3400-\u9fff]/u, `${quote.id}: Chinese translation required`);
    assert.ok(validPartialDate(quote.date), `${quote.id}: invalid date or unsupported precision`);
    assert.ok(Array.isArray(quote.topics) && quote.topics.length > 0 && quote.topics.every(hasText));
    for (const field of ["title", "url", "locator", "type"]) {
      assert.ok(hasText(quote.source?.[field]), `${quote.id}: missing source.${field}`);
    }
    const url = new URL(quote.source.url);
    assert.equal(url.protocol, "https:", `${quote.id}: source must use HTTPS`);
    assert.equal(url.username + url.password, "", `${quote.id}: no credentials in source URL`);
    assert.ok(!/^(?:localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(url.hostname));
    assert.ok(!/(?:^|\.)(?:feishu\.cn|larksuite\.com|wecom\.qq\.com|yingmi\.cn|qieman\.com)$/.test(url.hostname), `${quote.id}: internal work sources do not belong in this public industry module`);
  }
});

test("classic quote excerpts remain short and are limited per original source", () => {
  const wordsPerSource = new Map();
  for (const quote of loadFeed().quotes) {
    const source = new URL(quote.source.url);
    source.hash = "";
    const key = source.href;
    const count = quote.quoteEn.trim().split(/\s+/u).length;
    assert.ok(count <= 25, `${quote.id}: excerpt exceeds 25 words`);
    wordsPerSource.set(key, (wordsPerSource.get(key) || 0) + count);
  }
  for (const [source, count] of wordsPerSource) {
    assert.ok(count <= 25, `${source}: cumulative excerpt length is ${count} words`);
  }
});

test("classic quotes relations resolve with explicit, non-empty editorial rationale", () => {
  const quotes = loadFeed().quotes;
  const ids = new Set(quotes.map((quote) => quote.id));
  const typesPresent = new Set();
  for (const quote of quotes) {
    assert.ok(Array.isArray(quote.relations), `${quote.id}: relations must be an array`);
    const targets = new Set();
    for (const relation of quote.relations) {
      assert.ok(ids.has(relation.targetId), `${quote.id}: dangling relation ${relation.targetId}`);
      assert.notEqual(relation.targetId, quote.id, `${quote.id}: no self relation`);
      assert.ok(!targets.has(relation.targetId), `${quote.id}: duplicate relation target`);
      targets.add(relation.targetId);
      assert.ok(relationTypes.has(relation.type), `${quote.id}: unsupported relation type`);
      typesPresent.add(relation.type);
      assert.ok(hasText(relation.reason) && relation.reason.trim().length >= 12, `${quote.id}: explain the relationship, not just its label`);
    }
  }
  assert.deepEqual([...typesPresent].sort(), [...relationTypes].sort());
});

test("classic quotes public package is mirrored without private material", () => {
  for (const path of ["data/ai-classic-quotes.json", "quotes/index.html", "quotes/app.js", "quotes/styles.css"]) {
    const source = read(`public/${hub}${path}`);
    assert.ok(source.trim().length > 0, `${path}: must not be empty`);
    const deployed = read(`docs/${hub}${path}`);
    if (path.endsWith('.html')) {
      const withoutGate = (html) => html.replace(/<script\b[^>]*data-clair-access-gate[^>]*><\/script>/gi, '').replace(/<meta\b[^>]*data-clair-access-robots[^>]*>/gi, '').replace(/\s+/g, ' ').trim();
      assert.equal(withoutGate(deployed), withoutGate(source), `${path}: only the deployment access gate may differ`);
      assert.match(deployed, /data-clair-access-scope="report"/);
    } else assert.equal(deployed, source, `${path}: public/docs must match`);
    assert.doesNotMatch(source, /(?:\/Users\/|file:\/\/|Bearer\s+[A-Za-z0-9._-]{15,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,})/, `${path}: local path or credential-like content`);
  }
});

test("classic quotes module is reachable from the industry hub and identifies itself", () => {
  const app = read(`public/${hub}app.js`);
  const index = read(`public/${hub}index.html`);
  assert.match(app, /\.\/quotes\//, "hub navigation must link to the quotes module");
  assert.match(index, /\.\/quotes\//, "hub HTML must include a discoverable module link");
  const moduleHtml = read(`public/${hub}quotes/index.html`);
  assert.match(moduleHtml, /AI\s*经典语录/);
  assert.match(moduleHtml, /<meta\s+name="viewport"/);
  assert.match(moduleHtml, /<script[^>]*type="module"[^>]*src="\.\/app\.js"/);
});

const exampleQuotes = [
  { id: "q-new", speaker: "Person A", date: "2024-10", topics: ["安全", "能力"], quoteEn: "Human oversight matters.", quoteZh: "人的监督很重要。", context: "一次公开演讲", target: "自主系统", source: {title: "Official transcript", locator: "Section 3"}, relations: [{targetId: "q-old", type: "tension", reason: "责任与能力的关注点存在张力。"}] },
  { id: "q-old", speaker: "Person B", date: "1950", topics: ["能力"], quoteEn: "A testable question.", quoteZh: "可测试的问题。", context: "学术论文", target: "智能定义", source: {title: "Original paper"}, relations: [{targetId: "q-new", type: "tension", reason: "从能力测试扩展到责任边界。"}] },
  { id: "q-middle", speaker: "Person A", date: "2007-11-12", topics: ["安全"], quoteEn: "Build for people.", quoteZh: "为人服务。", context: "大学讲座", target: "设计目标", source: {title: "University archive"}, relations: [{targetId: "q-new", type: "complement", reason: "人本目标补充系统监督方法。"}] },
];

test("classic quotes full-text search and combined filters keep the user's selected scope", () => {
  assert.deepEqual(filterQuotes(exampleQuotes, {search: "HUMAN oversight"}).map((q) => q.id), ["q-new"]);
  assert.deepEqual(filterQuotes(exampleQuotes, {search: "section 3"}).map((q) => q.id), ["q-new"]);
  assert.deepEqual(filterQuotes(exampleQuotes, {search: "智能定义"}).map((q) => q.id), ["q-old"]);
  assert.deepEqual(filterQuotes(exampleQuotes, {speaker: "Person A", topic: "安全", relation: "tension"}).map((q) => q.id), ["q-new"]);
  assert.deepEqual(filterQuotes(exampleQuotes, {search: "不存在的短语", speaker: "Person A"}), []);
  assert.deepEqual(filterQuotes(exampleQuotes, {speaker: "Person B", topic: "安全"}), []);
});

test("classic quote sorting and local bookmarks do not mutate source data", () => {
  const original = JSON.stringify(exampleQuotes);
  assert.deepEqual(filterQuotes(exampleQuotes, {sort: "oldest"}).map((q) => q.id), ["q-old", "q-middle", "q-new"]);
  assert.deepEqual(filterQuotes(exampleQuotes, {sort: "newest"}).map((q) => q.id), ["q-new", "q-middle", "q-old"]);
  assert.deepEqual(filterQuotes(exampleQuotes, {sort: "curated"}).map((q) => q.id), ["q-new", "q-old", "q-middle"]);
  assert.deepEqual(filterQuotes(exampleQuotes, {saved: true}, new Set(["q-old", "stale-id"])).map((q) => q.id), ["q-old"]);
  assert.deepEqual(filterQuotes(exampleQuotes, {saved: true}, new Set()), []);
  assert.equal(JSON.stringify(exampleQuotes), original);
});

test("classic quote source URLs reject executable and non-HTTPS schemes", () => {
  assert.equal(safeSourceUrl("https://example.org/paper#section-2"), "https://example.org/paper#section-2");
  for (const value of ["javascript:alert(1)", "data:text/html,test", "file:///tmp/report", "http://example.org", "/relative", "not a URL", undefined, null]) {
    assert.equal(safeSourceUrl(value), "", String(value));
  }
});
