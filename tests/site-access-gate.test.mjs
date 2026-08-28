import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const docsRoot = join(root, "docs");
const gatePath = join(docsRoot, "access-gate.js");

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
  assert.doesNotMatch(source, /password\s*[!=]==?\s*["'][^"']+["']/i);
});

test("gates every published HTML entry and resolves the shared gate asset", () => {
  const htmlPaths = walkHtml(docsRoot);
  assert.ok(htmlPaths.length > 1);
  for (const htmlPath of htmlPaths) {
    const html = readFileSync(htmlPath, "utf8");
    assert.match(html, /data-clair-access-gate/, htmlPath);
    assert.match(html, /noindex,nofollow,noarchive/, htmlPath);
    assert.doesNotMatch(html, /content=["']index,follow["']/i, htmlPath);
    const source = html.match(/<script\b[^>]*data-clair-access-gate[^>]*src=["']([^"']+)["']/i)?.[1];
    assert.ok(source, htmlPath);
    assert.equal(existsSync(resolve(dirname(htmlPath), source)), true, `${htmlPath} -> ${source}`);
  }
});
