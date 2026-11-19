import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("initial catalog entries remain discoverable by both release validators", () => {
  const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const registry = JSON.parse(readFileSync(new URL("../catalog/report-registry.json", import.meta.url), "utf8"));
  const start = app.indexOf("  reports: [");
  const end = app.indexOf("\n  ],\n};", start);
  assert.ok(start >= 0 && end > start, "initial reports block must remain identifiable");
  const block = app.slice(start, end);
  const semanticIds = [...block.matchAll(/(?:\bid|"id")\s*:\s*"([^"]+)"/g)].map((match) => match[1]);
  // The catalog validator expects unquoted id keys; the workbench validator also
  // expects each record boundary on separate lines. Keep both parsers aligned.
  const catalogIds = [...block.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]);
  const workbenchIds = block.split(/\n\s{4}\},\n\s{4}\{/)
    .map((chunk) => chunk.replace(/^.*?reports:\s*\[/s, "").trim())
    .filter((chunk) => /\bid"?:\s*"/.test(chunk))
    .map((chunk) => chunk.match(/\bid"?:\s*"([^"]+)"/)?.[1]);
  assert.deepEqual(catalogIds, semanticIds, "quoted JSON keys must not make a catalog entry invisible");
  assert.deepEqual(workbenchIds, semanticIds, "single-line objects must not merge adjacent workbench entries");
  assert.equal(new Set(semanticIds).size, semanticIds.length, "catalog IDs must be unique");
  assert.deepEqual([...semanticIds].sort(), [...registry.protectedReportIds].sort());
});
