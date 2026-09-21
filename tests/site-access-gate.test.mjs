import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const docsRoot = join(root, "docs");
const gatePath = join(docsRoot, "access-gate.js");
const selfProtectedPaths = new Set([
  join(docsRoot, "reports", "qianwen-user-acquisition-dashboard", "index.html"),
  join(docsRoot, "reports", "doubao-user-acquisition-dashboard", "index.html"),
  join(docsRoot, "reports", "doubao-user-conversion-cases-2026-09-20", "index.html"),
  join(docsRoot, "reports", "qianwen-user-question-analysis-2026-09-05", "index.html"),
  join(docsRoot, "reports", "qianwen-user-question-detail-2026-09-05", "index.html"),
  join(docsRoot, "reports", "qianwen-first-investor-cases-2026-09-17", "index.html"),
]);

const walkHtml = (directory, results = []) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkHtml(path, results);
    else if (entry.isFile() && entry.name.endsWith(".html")) results.push(path);
  }
  return results;
};

test("uses a derived password verifier without a plaintext credential", () => {
  const source = readFileSync(gatePath, "utf8");
  assert.match(source, /PBKDF2/);
  assert.match(source, /SHA-256/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /clair-ai-studio-access-v1/);
  assert.match(source, /clair-ai-studio-report-access-v1/);
  assert.doesNotMatch(source, /password\s*[!=]==?\s*["'][^"']+["']/i);
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

test("gates published HTML entries except the independently encrypted ones", () => {
  const htmlPaths = walkHtml(docsRoot);
  assert.ok(htmlPaths.length > 1);
  for (const htmlPath of htmlPaths) {
    const html = readFileSync(htmlPath, "utf8");
    if (selfProtectedPaths.has(htmlPath)) {
      assert.doesNotMatch(html, /data-clair-access-gate/);
      assert.match(html, /const payload=/);
      assert.match(html, /PBKDF2/);
      assert.match(html, /AES-GCM/);
      assert.match(html, /id="password" type="password"/);
      assert.match(html, /noindex,nofollow/);
      continue;
    }
    assert.match(html, /data-clair-access-gate/, htmlPath);
    const expectedScope = htmlPath.startsWith(join(docsRoot, "reports")) ? "report" : "workspace";
    assert.match(html, new RegExp(`data-clair-access-scope=["']${expectedScope}["']`), htmlPath);
    assert.match(html, /noindex,nofollow,noarchive/, htmlPath);
    assert.doesNotMatch(html, /content=["']index,follow["']/i, htmlPath);
    const source = html.match(/<script\b[^>]*data-clair-access-gate[^>]*src=["']([^"']+)["']/i)?.[1];
    assert.ok(source, htmlPath);
    assert.equal(existsSync(resolve(dirname(htmlPath), source)), true, `${htmlPath} -> ${source}`);
  }
});

test("Qianwen encrypted reports share a reliable one-submit session unlock", () => {
  const paths = [
    join(docsRoot, "reports", "qianwen-user-acquisition-dashboard", "index.html"),
    join(docsRoot, "reports", "qianwen-first-investor-cases-2026-09-17", "index.html"),
  ];
  for (const htmlPath of paths) {
    const html = readFileSync(htmlPath, "utf8");
    assert.match(html, /clair-qianwen-report-unlock-v1/);
    assert.match(html, /sessionStorage\.setItem\(sessionKey,supplied\)/);
    assert.match(html, /let unlocking=false/);
    assert.match(html, /正在验证，请稍候/);
    assert.match(html, /input\.readOnly=busy/);
    assert.match(html, /event\.key!=="Enter"/);
    assert.match(html, /form\.requestSubmit\(\)/);
    assert.doesNotMatch(html, /input\.disabled=true/);
  }
});

test("Doubao encrypted reports share the same one-submit session unlock (own session key)", () => {
  const paths = [
    join(docsRoot, "reports", "doubao-user-acquisition-dashboard", "index.html"),
    join(docsRoot, "reports", "doubao-user-conversion-cases-2026-09-20", "index.html"),
  ];
  for (const htmlPath of paths) {
    const html = readFileSync(htmlPath, "utf8");
    assert.match(html, /clair-doubao-report-unlock-v1/);
    assert.match(html, /sessionStorage\.setItem\(sessionKey,supplied\)/);
    assert.match(html, /let unlocking=false/);
    assert.match(html, /form\.requestSubmit\(\)/);
    assert.doesNotMatch(html, /input\.disabled=true/);
  }
});
