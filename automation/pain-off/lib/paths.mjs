import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const ROOT = resolve(here, "..");
export const REPO_ROOT = resolve(ROOT, "..", "..");
export const REPORT_DIR = resolve(REPO_ROOT, "public/reports/product-demand-pulse");
export const PUBLIC_SNAPSHOT = resolve(REPORT_DIR, "data/latest.json");
export const DOCS_SNAPSHOT = resolve(REPO_ROOT, "docs/reports/product-demand-pulse/data/latest.json");
export const DETAIL_FILE = resolve(ROOT, "state/detail.json");
export const PREVIOUS_FILE = resolve(ROOT, "state/previous-snapshot.json");

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function loadConfig() {
  const rules = readJson(resolve(ROOT, "config/rules.json"));
  const roster = readJson(resolve(ROOT, "config/roster.json"));
  const curated = readJson(resolve(ROOT, "config/curated-records.json"), { records: [] });
  return { rules, roster, curated: curated.records || [] };
}
