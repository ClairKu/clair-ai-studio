import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parseBindingReceipt, readOptionalBindingReceipt, restoreBindingReceipt } from "../scripts/qianwen-refresh/binding-receipt.mjs";

const cutoff = "2026-11-24T09:28:46+08:00";
const receipt = { as_of: "2026-11-26T11:23:39+08:00", bound_accounts: 21827, new_accounts: 20052, existing_accounts: 1775 };

test("binding-only receipt accepts the separately dated, reconciled counters", () => {
  assert.deepEqual(parseBindingReceipt(JSON.stringify(receipt), cutoff), receipt);
});

test("binding-only receipt rejects inconsistent, unsafe or personal fields", () => {
  for (const value of [
    { ...receipt, bound_accounts: 21828 },
    { ...receipt, new_accounts: -1 },
    { ...receipt, new_accounts: 20052.5 },
    { ...receipt, bound_accounts: Number.MAX_SAFE_INTEGER + 1 },
    { ...receipt, user_id: "must-not-be-published" },
    { ...receipt, as_of: "invalid" },
    { ...receipt, as_of: "2026-11-31T11:23:39+08:00" },
  ]) assert.throws(() => parseBindingReceipt(JSON.stringify(value), cutoff));
});

test("valid equal/older receipts yield to a complete newer snapshot", async () => {
  assert.equal(parseBindingReceipt(JSON.stringify({ ...receipt, as_of: cutoff }), cutoff), null);
  assert.equal(parseBindingReceipt(JSON.stringify({ ...receipt, as_of: "2026-11-23T11:23:39+08:00" }), cutoff), null);
  assert.equal(parseBindingReceipt(JSON.stringify(receipt), receipt.as_of), null);
  assert.equal(parseBindingReceipt(JSON.stringify(receipt), "2026-11-27T09:00:00+08:00"), null);
  const dir = await mkdtemp(join(tmpdir(), "qianwen-binding-stale-"));
  try {
    const file = join(dir, "binding-receipt.json");
    await writeFile(file, JSON.stringify(receipt));
    assert.equal(await readOptionalBindingReceipt(file, "2026-11-27T09:00:00+08:00"), null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("receipt is optional, but malformed present data cannot silently pass", async () => {
  const dir = await mkdtemp(join(tmpdir(), "qianwen-binding-receipt-"));
  try {
    const file = join(dir, "binding-receipt.json");
    assert.equal(await readOptionalBindingReceipt(file, cutoff), null);
    await writeFile(file, "{invalid");
    await assert.rejects(readOptionalBindingReceipt(file, cutoff));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("post-cleanup restoration preserves exact receipt bytes and no complete data", async () => {
  const dir = await mkdtemp(join(tmpdir(), "qianwen-binding-restore-"));
  try {
    const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
    const file = join(dir, "source.json");
    await writeFile(file, bytes);
    const validated = await readOptionalBindingReceipt(file, cutoff);
    const out = join(dir, "data");
    await restoreBindingReceipt(out, validated);
    assert.deepEqual(await readFile(join(out, "binding-receipt.json")), bytes);
    await assert.rejects(readFile(join(out, "latest.json")), { code: "ENOENT" });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("dashboard validator accepts the reviewed alias without weakening cutoff or denominator checks", async () => {
  const project = fileURLToPath(new URL("../", import.meta.url));
  const fixture = await mkdtemp(join(tmpdir(), "qianwen-binding-validator-"));
  try {
    const reportRel = "public/reports/qianwen-user-acquisition-dashboard";
    const sourceReport = join(project, reportRel);
    const fixtureReport = join(fixture, reportRel);
    await mkdir(fixtureReport, { recursive: true });
    await mkdir(join(fixture, "scripts"));
    await copyFile(join(project, "scripts/validate-qianwen-user-acquisition-dashboard.mjs"), join(fixture, "scripts/validate-qianwen-user-acquisition-dashboard.mjs"));
    await copyFile(join(project, "scripts/validate-app-usage.mjs"), join(fixture, "scripts/validate-app-usage.mjs"));
    for (const name of await readdir(sourceReport)) {
      if (name !== "app.js") await symlink(join(sourceReport, name), join(fixtureReport, name));
    }
    await symlink(join(project, "public/previews"), join(fixture, "public/previews"));
    await symlink(join(project, "src"), join(fixture, "src"));
    const source = await readFile(join(sourceReport, "app.js"), "utf8");
    const run = async (value) => {
      await writeFile(join(fixtureReport, "app.js"), value);
      return spawnSync(process.execPath, [join(fixture, "scripts/validate-qianwen-user-acquisition-dashboard.mjs")], { cwd: fixture, encoding: "utf8" });
    };
    const valid = await run(source);
    assert.equal(valid.status, 0, valid.stderr);
    for (const mutation of [
      (value) => value.replace("formatShare(app.cohorts.all.users, currentData.metrics.bound_accounts)", "formatShare(app.cohorts.all.users, metrics.bound_accounts)"),
      (value) => value.replace("parseTime(receipt.as_of) > parseTime(snapshot.meta.data_cutoff)", "parseTime(receipt.as_of) >= parseTime(snapshot.meta.data_cutoff)"),
      (value) => value.replace("以下转化、App 使用及逐日数据截至 ", "以下数据 "),
      (value) => value.replaceAll("const metrics = bindingReceipt || currentData.metrics;", "const metrics = bindingReceipt || filteredRows;"),
    ]) {
      const mutated = mutation(source);
      assert.notEqual(mutated, source);
      const rejected = await run(mutated);
      assert.notEqual(rejected.status, 0, "Unsafe binding-source change unexpectedly passed");
    }
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
