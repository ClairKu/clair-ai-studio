import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const slug = "personal-agent-market-atlas-2026-10-10";
const publicReport = readFileSync(join(root, "public", "reports", slug, "index.html"), "utf8");
const docsReport = readFileSync(join(root, "docs", "reports", slug, "index.html"), "utf8");

test("Personal Agent atlas publishes 22 representative products with the promised decision layers", () => {
  assert.equal((publicReport.match(/<article class="product"/g) || []).length, 22);
  for (const marker of [
    "Meta Muse", "Instinct", "OpenAI dots", "Gemini Spark", "Claude Cowork",
    "Grok Bot", "Manus 2.0 / Cue", "Hark Pro", "Airtap", "OpenClaw",
    "Hermes Agent", "Siri AI", "Alexa+", "千问 App", "WorkBuddy / Marvis",
    "DuMate / GenFlow", "七层委托栈", "八个容易被产品演示掩盖的问题", "六步安全试用协议",
  ]) assert.match(publicReport, new RegExp(marker.replace(/[+]/g, "\\+")));
  assert.match(publicReport, /data-filter="consumer"/);
  assert.match(publicReport, /data-filter="work"/);
  assert.match(publicReport, /data-filter="ecosystem"/);
  assert.match(publicReport, /data-filter="self"/);
});

test("Personal Agent atlas keeps official claims and independent risk evidence traceable", () => {
  for (const source of [
    "about.fb.com/news/2026/09/introducing-muse-personal-ai-agent",
    "research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse",
    "instinct.com/privacy-policy",
    "instinct.com/terms",
    "arstechnica.com/ai/2026/09/muse-metas-extraordinarily-privileged-ai-assistant-has-a-serious-0-day",
    "techcrunch.com/2026/08/24/instincts-powerful-ai-assistant-is-raising-privacy-and-security-concerns",
  ]) assert.match(publicReport, new RegExp(source.replace(/[.]/g, "\\.")));
});

test("Personal Agent atlas is mirrored, public, searchable, and registered in the workbench catalog", () => {
  assert.match(docsReport, /22 款代表性产品完整介绍/);
  assert.match(docsReport, /data-clair-access-gate/);
  assert.match(docsReport, /data-clair-access-entry="reports\/personal-agent-market-atlas-2026-10-10\/"/);
  const publicPreview = readFileSync(join(root, "public", "previews", `${slug}.svg`), "utf8");
  const docsPreview = readFileSync(join(root, "docs", "previews", `${slug}.svg`), "utf8");
  assert.equal(publicPreview, docsPreview);
  assert.match(readFileSync(join(root, "src", "app.js"), "utf8"), new RegExp(slug));
  const access = JSON.parse(readFileSync(join(root, "public", "report-access.json"), "utf8"));
  assert.ok(access.unlockedEntries.includes(`reports/${slug}/`));
  const searchIndex = JSON.parse(readFileSync(join(root, "public", "search-index.json"), "utf8"));
  assert.match(searchIndex[slug] || "", /Muse.*Instinct.*22 款/s);
});
