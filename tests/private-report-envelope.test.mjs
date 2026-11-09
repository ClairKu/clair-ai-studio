import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const entry = "reports/qiming-h2-product-review-2026-11-09/index.html";

test("standalone encrypted report stays self-contained while ordinary pages retain the shared gate", async () => {
  const directory = await mkdtemp(join(tmpdir(), "clair-private-envelope-"));
  try {
    const original = await readFile(join(root, "public", entry), "utf8");
    await mkdir(join(directory, "reports/qiming-h2-product-review-2026-11-09"), { recursive: true });
    await mkdir(join(directory, "reports/control"), { recursive: true });
    await writeFile(join(directory, "access-gate.js"), "/* fixture */");
    await writeFile(join(directory, "report-access.json"), JSON.stringify({ immutableLockedEntries: [] }));
    await writeFile(join(directory, entry), original);
    await writeFile(join(directory, "reports/control/index.html"), "<!doctype html><html><head><title>Control</title></head><body>Control</body></html>");
    execFileSync(process.execPath, [join(root, "scripts/inject-site-access-gate.mjs"), directory], { stdio: "pipe" });
    assert.equal(await readFile(join(directory, entry), "utf8"), original);
    assert.equal((await readFile(join(directory, "reports/control/index.html"), "utf8")).match(/data-clair-access-gate/g)?.length, 1);
    const payload = JSON.parse(original.match(/<script id="encrypted-payload" type="application\/json">(.*?)<\/script>/s)[1]);
    assert.equal(payload.algorithm, "AES-GCM");
    assert.equal(payload.kdf, "PBKDF2");
    assert.equal(payload.iterations, 600000);
    assert.equal(Buffer.from(payload.iv, "base64").length, 12);
    assert.equal(Buffer.from(payload.salt, "base64").length, 16);
    assert(original.includes("connect-src 'none'"));
    assert(original.includes('data-gate="decrypt"'));
    assert(!/\b(?:localStorage|sessionStorage|fetch|XMLHttpRequest|sendBeacon)\b/.test(original));
    assert(!/https?:\/\//.test(original));
    await writeFile(join(directory, entry), original.replaceAll("AES-GCM", "removed"));
    assert.throws(() => execFileSync(process.execPath, [join(root, "scripts/inject-site-access-gate.mjs"), directory], { stdio: "pipe" }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
