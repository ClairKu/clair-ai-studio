import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const docsRoot = join(root, "docs");
const gatePath = join(docsRoot, "access-gate.js");
const accessConfigPath = join(docsRoot, "report-access.json");
const accessConfig = JSON.parse(readFileSync(accessConfigPath, "utf8"));
const selfProtectedPaths = new Set((accessConfig.immutableLockedEntries || []).map(
  (entry) => join(docsRoot, entry, "index.html"),
));

const walkHtml = (directory, results = []) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkHtml(path, results);
    else if (entry.isFile() && entry.name.endsWith(".html")) results.push(path);
  }
  return results;
};

const fromBase64 = (value) => new Uint8Array(Buffer.from(value, "base64"));

const derivesExpectedHash = async (password, salt, iterations, expectedHash) => {
  const material = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromBase64(salt), iterations },
    material,
    256,
  );
  return Buffer.from(bits).equals(Buffer.from(expectedHash, "base64"));
};

test("uses separate derived verifiers for workspace access and report password 2026", async () => {
  const source = readFileSync(gatePath, "utf8");
  assert.match(source, /PBKDF2/);
  assert.match(source, /SHA-256/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /clair-ai-studio-access-v3/);
  assert.match(source, /clair-ai-studio-report-access-v4/);
  assert.doesNotMatch(source, /password\s*[!=]==?\s*["'][^"']+["']/i);
  assert.equal(await derivesExpectedHash(
    "20260509",
    "pSPWbcuWBb/A+MHgQ+J+Cg==",
    310000,
    "RvAEQHpDP8wpmqGyQH1aO9zAJnQAjzfRUJ3mK+CsoCA=",
  ), true, "workspace password verifier drifted");
  assert.equal(await derivesExpectedHash(
    "2026",
    "Yvvn5IytrgVkVQ8lcxYV8w==",
    310000,
    "gMoR40ms0BVTOHQ7x3elCYk2lsV6djC1yc3gJl4d18c=",
  ), true, "report password verifier drifted");
});

test("shared gate submits reliably: trims input, guards re-entry, keeps the field usable", () => {
  const source = readFileSync(gatePath, "utf8");
  // Stray whitespace from autofill/IME/paste must not reject a correct password.
  assert.match(source, /input\.value\.trim\(\)/);
  // A single in-flight verification blocks concurrent submits (no double-submit race).
  assert.match(source, /if\s*\(verifying\)\s*return/);
  // The field is made read-only (not disabled) so focus and the mobile keyboard survive.
  assert.match(source, /input\.readOnly\s*=\s*busy/);
  assert.doesNotMatch(source, /input\.disabled\s*=\s*true/);
  // A visible progress state is shown before the slow key derivation blocks the thread.
  assert.match(source, /正在验证，请稍候/);
});

test("direct report access follows the central selective policy and fails closed", () => {
  const source = readFileSync(gatePath, "utf8");
  assert.equal(accessConfig.version, 2);
  assert.equal(accessConfig.defaultLocked, true);
  assert.deepEqual(accessConfig.lockedEntries, []);
  assert.deepEqual(accessConfig.unlockedEntries, [
    "reports/personal-agent-market-atlas-2026-10-10/",
    "reports/qieman-four-money-redesign-2026-09-24/",
  ]);
  assert.ok(accessConfig.immutableLockedEntries.length > 0);
  assert.match(source, /const hasWorkspacePass = \(\) =>/);
  assert.match(source, /profiles\.workspace\.sessionKey/);
  assert.match(source, /profiles\.workspace\.sessionValue/);
  assert.match(source, /requestedScope === "report" && hasWorkspacePass\(\)/);
  assert.match(source, /document\.documentElement\.classList\.add\(ROOT_CLASS\)/);
  assert.match(source, /reportRequiresPassword/);
  assert.match(source, /lockedEntries/);
  assert.match(source, /unlockedEntries/);
  assert.match(source, /immutableLockedEntries/);
  assert.match(source, /new URL\("\.\/report-access\.json", gateScript\.src\)/);
  assert.match(source, /if \(!requestedAccessEntry \|\| !reportAccessConfig\) return true/);
  assert.match(source, /unlock\("", \{ persist: false \}\)/);
});

test("a successful workspace unlock seeds every encrypted-report session without storing the workspace password", () => {
  const source = readFileSync(gatePath, "utf8");
  assert.match(source, /REPORT_CREDENTIAL_SESSION_KEY/);
  assert.match(source, /const credential = password\.slice\(0, 4\)/);
  assert.match(source, /clair-qianwen-report-unlock-v1/);
  assert.match(source, /clair-doubao-report-unlock-v1/);
  assert.match(source, /dataset\.clairEncryptedReport/);
  assert.match(source, /window\.location\.reload\(\)/);
  assert.doesNotMatch(source, /20260509/);
});

test("isolated workbench readers request an in-memory credential through a token-bound parent handshake", () => {
  const source = readFileSync(gatePath, "utf8");
  assert.match(source, /const trustedWorkbenchParentOrigin = \(\) =>/);
  assert.match(source, /const requestWorkbenchCredential = \(\) =>/);
  assert.match(source, /window\.top === window/);
  assert.match(source, /new URLSearchParams\(location\.search\)/);
  assert.match(source, /document\.referrer/);
  assert.match(source, /if \(!document\.referrer\) return ""/);
  assert.match(source, /new URL\("\.\/", gateScript\.src\)/);
  assert.match(source, /sameProductionWorkbench/);
  assert.match(source, /loopbackWorkbench/);
  assert.match(source, /clair-report-access-request/);
  assert.match(source, /event\.source !== window\.parent/);
  assert.match(source, /window\[BRIDGED_REPORT_CREDENTIAL\] = credential/);
  assert.match(source, /if \(requestWorkbenchCredential\(\)\) return/);
});

test("publishes policy-aware gate metadata on every HTML entry", () => {
  const htmlPaths = walkHtml(docsRoot);
  assert.ok(htmlPaths.length > 1);
  for (const htmlPath of htmlPaths) {
    const html = readFileSync(htmlPath, "utf8");
    if (selfProtectedPaths.has(htmlPath)) {
      assert.match(html, /data-clair-access-gate/);
      assert.match(html, /data-clair-access-scope=["']report["']/);
      assert.match(html, /data-clair-encrypted-report=["']true["']/);
      assert.match(html, /const payload=/);
      assert.match(html, /PBKDF2/);
      assert.match(html, /AES-GCM/);
      assert.doesNotMatch(html, /type=["']password["']/);
      assert.match(html, /clair-ai-studio-report-credential-v1/);
      assert.match(html, /clair-report-access/);
      assert.match(html, /clair-report-access-bridged/);
      assert.match(html, /__clairStudioReportCredential/);
      assert.match(html, /const renderDecryptedReport=plain=>/);
      assert.match(html, /frame\.srcdoc=plain/);
      assert.doesNotMatch(html, /allow-same-origin/);
      assert.match(html, /正在打开已验证的报告/);
      assert.match(html, /noindex,nofollow/);
      continue;
    }
    assert.match(html, /data-clair-access-gate/, htmlPath);
    const expectedScope = htmlPath.startsWith(join(docsRoot, "reports"))
      || htmlPath.startsWith(join(docsRoot, "apps"))
      ? "report"
      : "workspace";
    assert.match(html, new RegExp(`data-clair-access-scope=["']${expectedScope}["']`), htmlPath);
    if (expectedScope === "report") {
      assert.match(html, /data-clair-access-entry=["'](?:reports|apps)\//, htmlPath);
    }
    assert.match(html, /noindex,nofollow,noarchive/, htmlPath);
    assert.doesNotMatch(html, /content=["']index,follow["']/i, htmlPath);
    const source = html.match(/<script\b[^>]*data-clair-access-gate[^>]*src=["']([^"']+)["']/i)?.[1];
    assert.ok(source, htmlPath);
    assert.equal(existsSync(resolve(dirname(htmlPath), source.split("?")[0])), true, `${htmlPath} -> ${source}`);
  }
});

test("workbench bridges the existing report credential into encrypted reader iframes", () => {
  const source = readFileSync(join(root, "src", "app.js"), "utf8");
  assert.match(source, /REPORT_ACCESS_MESSAGE_TYPE = "clair-report-access"/);
  assert.match(source, /REPORT_ACCESS_REQUEST_MESSAGE_TYPE = "clair-report-access-request"/);
  assert.match(source, /bindReportReaderAccessBridge\(report\)/);
  assert.match(source, /clair-access-revision/);
  assert.match(source, /clair-reader-token/);
  assert.match(source, /event\.source !== frame\.contentWindow/);
  assert.match(source, /event\.source\.postMessage/);
  assert.match(source, /credentials\["clair-ai-studio-report-credential-v1"\]/);
});

test("Qianwen encrypted reports use the shared gate and have no second password form", () => {
  const paths = [
    join(docsRoot, "reports", "qianwen-user-acquisition-dashboard", "index.html"),
    join(docsRoot, "reports", "qianwen-first-investor-cases-2026-09-17", "index.html"),
  ];
  for (const htmlPath of paths) {
    const html = readFileSync(htmlPath, "utf8");
    assert.match(html, /clair-qianwen-report-unlock-v1/);
    assert.match(html, /clair-ai-studio-report-access-v4/);
    assert.match(html, /data-clair-encrypted-report="true"/);
    assert.match(html, /document\.open\(\);document\.write/);
    assert.doesNotMatch(html, /type=["']password["']/);
  }
});

test("Doubao encrypted reports use the same shared gate and have no second password form", () => {
  const paths = [
    join(docsRoot, "reports", "doubao-user-acquisition-dashboard", "index.html"),
    join(docsRoot, "reports", "doubao-user-conversion-cases-2026-09-20", "index.html"),
  ];
  for (const htmlPath of paths) {
    const html = readFileSync(htmlPath, "utf8");
    assert.match(html, /clair-doubao-report-unlock-v1/);
    assert.match(html, /clair-ai-studio-report-access-v4/);
    assert.match(html, /data-clair-encrypted-report="true"/);
    assert.match(html, /document\.open\(\);document\.write/);
    assert.doesNotMatch(html, /type=["']password["']/);
  }
});
