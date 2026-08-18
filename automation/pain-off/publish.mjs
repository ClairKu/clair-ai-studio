#!/usr/bin/env node
/**
 * 把快照发布到 GitHub Pages（public/ 与 docs/ 两份），走 Git Data API 直接建 commit。
 *
 * 为什么不用 git push：这台机器到 github.com:443 的 SNI 会被阻断，git 传输走不通，
 * 但 api.github.com 可达（必要时用 --resolve 绕开坏路由）。所以这里 shell out 到 curl，
 * 只改这两个文件的 blob，基于远端最新 commit 建新 commit——不碰别人正在改的其它文件。
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

const OWNER = "ClairKu";
const REPO = "clair-ai-studio";
const BRANCH = "main";
const TARGET_PATHS = [
  "public/reports/product-demand-pulse/data/latest.json",
  "docs/reports/product-demand-pulse/data/latest.json",
];
const API_HOST_FALLBACK_IP = "140.82.113.6";

async function githubToken() {
  const { stdout } = await run("gh", ["auth", "token"]);
  return stdout.trim();
}

async function api(token, method, path, body) {
  const url = `https://api.github.com${path}`;
  const args = [
    "-sS", "--max-time", "40",
    "--resolve", `api.github.com:443:${API_HOST_FALLBACK_IP}`,
    "-X", method,
    "-H", `Authorization: Bearer ${token}`,
    "-H", "Accept: application/vnd.github+json",
    "-w", "\n%{http_code}",
    url,
  ];
  if (body !== undefined) args.push("-H", "Content-Type: application/json", "-d", JSON.stringify(body));

  const { stdout } = await run("curl", args, { maxBuffer: 32 * 1024 * 1024 });
  const cut = stdout.lastIndexOf("\n");
  const status = Number(stdout.slice(cut + 1));
  const payload = stdout.slice(0, cut);
  if (status >= 400) throw new Error(`GitHub ${method} ${path} → HTTP ${status}: ${payload.slice(0, 300)}`);
  return payload ? JSON.parse(payload) : null;
}

export async function publishToGitHub(snapshot, { message } = {}) {
  const token = await githubToken();
  const content = `${JSON.stringify(snapshot, null, 2)}\n`;

  const ref = await api(token, "GET", `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const headSha = ref.object.sha;
  const headCommit = await api(token, "GET", `/repos/${OWNER}/${REPO}/git/commits/${headSha}`);

  const blob = await api(token, "POST", `/repos/${OWNER}/${REPO}/git/blobs`, {
    content: Buffer.from(content, "utf8").toString("base64"),
    encoding: "base64",
  });

  const tree = await api(token, "POST", `/repos/${OWNER}/${REPO}/git/trees`, {
    base_tree: headCommit.tree.sha,
    tree: TARGET_PATHS.map((path) => ({ path, mode: "100644", type: "blob", sha: blob.sha })),
  });

  const summary = snapshot.summary || {};
  const commit = await api(token, "POST", `/repos/${OWNER}/${REPO}/git/commits`, {
    message:
      message ||
      `chore(pain-off): 刷新需求脉搏快照（提交 ${summary.submitted ?? "?"} / 上线 ${summary.released ?? "?"}）`,
    tree: tree.sha,
    parents: [headSha],
  });

  await api(token, "PATCH", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, { sha: commit.sha });
  return { commit: commit.sha.slice(0, 8) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readJson, PUBLIC_SNAPSHOT } = await import("./lib/paths.mjs");
  const snapshot = readJson(PUBLIC_SNAPSHOT);
  if (!snapshot) throw new Error(`还没有快照可发布：${PUBLIC_SNAPSHOT}`);
  const result = await publishToGitHub(snapshot);
  console.log(`已推送 ${result.commit}`);
}
