#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 43122;
const DEFAULT_ORIGINS = ["https://clairku.github.io"];
const MAX_BODY_BYTES = 16 * 1024;
const MAX_LOG_BYTES = 2 * 1024 * 1024;
const PRODUCTION_URL = "https://clairku.github.io/clair-ai-studio/reports/qianwen-user-acquisition-dashboard/";
const REPORT_PATH = "reports/qianwen-user-acquisition-dashboard";
const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
const defaultRepo = resolve(scriptDir, "..");

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function allowedOrigins(env = process.env) {
  return new Set((env.QIANWEN_REFRESH_ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(","))
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean));
}

export function isAllowedOrigin(origin, origins = allowedOrigins()) {
  return typeof origin === "string" && origins.has(origin);
}

function cleanText(value, maxLength = 300) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanSummary(value) {
  return cleanText(value)
    .replace(/https?:\/\/\S+/giu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 180);
}

function safeCount(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function parseTime(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function safeCutoff(value) {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+08:00$/.test(value)
    && Number.isFinite(Date.parse(value))
    ? value
    : null;
}

function safeUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "clairku.github.io" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function sanitizeAgentResult(input, fallbackCutoff = null) {
  const status = ["updated", "no_change", "blocked"].includes(input?.status) ? input.status : "blocked";
  return {
    status,
    summary: cleanSummary(input?.summary) || "刷新任务没有返回可用结果。",
    data_cutoff: safeCutoff(input?.data_cutoff) || safeCutoff(fallbackCutoff),
    metrics: {
      bound_accounts: safeCount(input?.metrics?.bound_accounts),
      new_accounts: safeCount(input?.metrics?.new_accounts),
      existing_accounts: safeCount(input?.metrics?.existing_accounts),
    },
    production_url: safeUrl(input?.production_url),
  };
}

function sanitizeRequest(input) {
  if (input?.schema !== "qianwen-user-acquisition-refresh/v1") throw new Error("更新请求格式不正确");
  const publishedCutoff = input.published_cutoff === null ? null : safeCutoff(input.published_cutoff);
  if (input.published_cutoff !== null && !publishedCutoff) throw new Error("页面数据时间无效");
  return { schema: input.schema, published_cutoff: publishedCutoff };
}

async function findOntologyBin(repo, env) {
  const candidates = [
    env.QIANWEN_ONTOLOGY_BIN,
    join(dirname(repo), ".claude", "skills", "ontology", "ontology"),
    join(repo, ".claude", "skills", "ontology", "ontology"),
    join(homedir(), ".claude", "skills", "ontology", "ontology"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return resolve(candidate);
    } catch {
      // Try the next supported installation location.
    }
  }
  return null;
}

export function buildRefreshPrompt({ workspace, publishedCutoff, ontologyBin }) {
  return `立即执行一次“千问 X 且慢AI小顾用户数据看板”的真实生产数据刷新，并把结果写入隔离工作目录。

隔离工作目录：${workspace}
当前页面截止时间：${publishedCutoff || "未知"}
本体 CLI：${ontologyBin || "未找到（这种情况必须返回 blocked）"}
生产页：${PRODUCTION_URL}
权威快照：public/reports/qianwen-user-acquisition-dashboard/data/latest.json

必须完成的取数：
1. 使用上面的本体 CLI；先执行 auth status。未登录、401、需要浏览器交互或本体不可用时，不得猜数，直接返回 blocked。
2. 只发起一次新的本体问题，effort=medium（不要使用 high）。明确要求它实时查询生产数据库，统计从 2026-08-03 00:00:00（Asia/Shanghai）到本次查询时点的数据；回答必须是可落入现有 latest.json 的完整、匿名、聚合快照，不得返回用户明细。
3. 本体问题必须作为非空的直接参数传给 CLI，或先写入隔离目录中的临时文件再完整读取；禁止依赖未显式导出的 shell 环境变量传递问题。调用前检查问题文本包含“千问 X 且慢AI小顾”和“2026-08-03”，否则返回 blocked，不得发起空问题。
4. 绑定定义、千问来源识别、新/老用户分类、每日趋势、画像、行为和经营口径必须沿用现有 latest.json 与 scripts/validate-qianwen-user-acquisition-dashboard.mjs。新用户=首次绑定时尚未注册且慢；老用户=首次绑定时已有且慢账户。
5. 画像、行为、经营数据对 all/new/existing 三个 cohort 分别计算。执行 k=20 的主抑制和互补抑制，禁止通过“全部减一类”反推出小样本；禁止输出用户 ID、手机号、单用户金额、原始对话、内部任务/查询标识或生产凭证。
6. 查询时点必须写入 meta.generated_at 和 meta.data_cutoff（北京时间 +08:00）；当天 daily.partial=true，历史日期 false；所有总数、每日数、分组和观察窗口必须闭合。

写入与校验要求：
- 只在上面的隔离工作目录内工作；不要执行 git fetch、clone、commit 或 push。后台服务会在你完成后原子发布。
- 以现有 latest.json 为严格模板，只替换真实查询得到的数据；不得删减模块、改变 schema_version 或放宽隐私规则。
- 写入 public 下的 latest.json，运行 node scripts/validate-qianwen-user-acquisition-dashboard.mjs --write-fallback；校验不通过必须修正，绝不能放宽校验器。
- 若真实查询的 cutoff 不晚于已发布 cutoff，且所有指标完全相同，返回 no_change；否则写好快照后返回 updated。不要自行发布。
- 任何取数或校验失败都返回 blocked，并保留隔离目录中的上一版数据。
- 最终 summary 只写面向看板使用者的结论，控制在 100 个汉字内；不要写内部链接、命令或凭证。

最终必须严格按给定 JSON Schema 返回，不要写额外文字。`;
}

async function runProcess(command, args, { cwd, env, input = "" } = {}) {
  const stdout = [];
  const stderr = [];
  const child = spawn(command, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
  child.stdout.on("data", (chunk) => appendCapped(stdout, chunk));
  child.stderr.on("data", (chunk) => appendCapped(stderr, chunk));
  child.stdin.end(input);
  const exitCode = await new Promise((resolveExit, rejectExit) => {
    child.once("error", rejectExit);
    child.once("close", resolveExit);
  });
  const output = Buffer.concat(stdout).toString("utf8");
  if (exitCode !== 0) {
    const errorOutput = Buffer.concat(stderr).toString("utf8").trim().slice(0, 500);
    throw new Error(errorOutput || `${command} 退出（${exitCode}）`);
  }
  return output;
}

async function prepareRefreshWorkspace(repo) {
  const workspace = await mkdtemp(join(tmpdir(), "qianwen-refresh-work-"));
  const copies = [
    [join(repo, "public", REPORT_PATH), join(workspace, "public", REPORT_PATH)],
    [join(repo, "docs", REPORT_PATH), join(workspace, "docs", REPORT_PATH)],
    [join(repo, "scripts", "validate-qianwen-user-acquisition-dashboard.mjs"), join(workspace, "scripts", "validate-qianwen-user-acquisition-dashboard.mjs")],
    [join(repo, "src", "app.js"), join(workspace, "src", "app.js")],
    [join(repo, "public", "previews", "qianwen-user-acquisition-dashboard.svg"), join(workspace, "public", "previews", "qianwen-user-acquisition-dashboard.svg")],
  ];
  for (const [source, target] of copies) {
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true });
  }
  try {
    const response = await fetch(`${PRODUCTION_URL}data/latest.json?prepare=${Date.now()}`, { signal: AbortSignal.timeout(20_000) });
    if (response.ok) {
      const snapshot = await response.json();
      if (safeCutoff(snapshot?.meta?.data_cutoff)) {
        const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
        await Promise.all([
          writeFile(join(workspace, "public", REPORT_PATH, "data", "latest.json"), serialized),
          writeFile(join(workspace, "docs", REPORT_PATH, "data", "latest.json"), serialized),
        ]);
      }
    }
  } catch {
    // The checked-in, already validated snapshot remains the safe fallback.
  }
  return workspace;
}

async function githubCredentials() {
  const text = await runProcess("/usr/bin/git", ["credential", "fill"], {
    input: "protocol=https\nhost=github.com\n\n",
  });
  const values = Object.fromEntries(text.trim().split("\n").map((line) => {
    const split = line.indexOf("=");
    return split > 0 ? [line.slice(0, split), line.slice(split + 1)] : [line, ""];
  }));
  if (!values.password) throw new Error("GitHub 发布凭证不可用");
  return values.password;
}

async function githubApi(path, token, init = {}) {
  const response = await fetch(`https://api.github.com/repos/ClairKu/clair-ai-studio${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${cleanText(body.message) || "发布请求失败"}`);
  return body;
}

export async function publishWorkspace(workspace, cutoff) {
  const paths = [
    "public/reports/qianwen-user-acquisition-dashboard/data/latest.json",
    "public/reports/qianwen-user-acquisition-dashboard/data/fallback-data.js",
    "docs/reports/qianwen-user-acquisition-dashboard/data/latest.json",
    "docs/reports/qianwen-user-acquisition-dashboard/data/fallback-data.js",
  ];
  const token = await githubCredentials();
  const blobs = await Promise.all(paths.map(async (path) => {
    const contents = await readFile(join(workspace, path));
    const blob = await githubApi("/git/blobs", token, {
      method: "POST",
      body: JSON.stringify({ content: contents.toString("base64"), encoding: "base64" }),
    });
    return { path, mode: "100644", type: "blob", sha: blob.sha };
  }));

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const ref = await githubApi("/git/ref/heads/main", token);
    const parent = ref.object.sha;
    const parentCommit = await githubApi(`/git/commits/${parent}`, token);
    const tree = await githubApi("/git/trees", token, {
      method: "POST",
      body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: blobs }),
    });
    const commit = await githubApi("/git/commits", token, {
      method: "POST",
      body: JSON.stringify({
        message: `feat(qianwen): refresh dashboard data to ${cutoff.slice(0, 10)}`,
        tree: tree.sha,
        parents: [parent],
        author: { name: "Clair", email: "9941648+ClairKu@users.noreply.github.com" },
        committer: { name: "Clair", email: "9941648+ClairKu@users.noreply.github.com" },
      }),
    });
    try {
      await githubApi("/git/refs/heads/main", token, {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha, force: false }),
      });
      return commit.sha;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error("生产分支并发更新，请重试");
}

export async function verifyProductionSnapshot(expectedCutoff, expectedMetrics) {
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${PRODUCTION_URL}data/latest.json?verify=${Date.now()}`, { signal: AbortSignal.timeout(20_000) });
      if (response.ok) {
        const snapshot = await response.json();
        if (
          parseTime(snapshot?.meta?.data_cutoff) >= parseTime(expectedCutoff)
          && snapshot?.metrics?.bound_accounts === expectedMetrics.bound_accounts
          && snapshot?.metrics?.new_accounts === expectedMetrics.new_accounts
          && snapshot?.metrics?.existing_accounts === expectedMetrics.existing_accounts
        ) return;
      }
    } catch {
      // GitHub Pages may briefly return a cached or unavailable response during deployment.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 5000));
  }
  throw new Error("新快照已提交，但生产页面尚未完成发布");
}

function appendCapped(chunks, chunk) {
  const current = chunks.reduce((sum, item) => sum + item.length, 0);
  if (current >= MAX_LOG_BYTES) return;
  chunks.push(Buffer.from(chunk).subarray(0, MAX_LOG_BYTES - current));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("更新请求过大");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function writeJson(response, statusCode, body, origin = null) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.end(`${JSON.stringify(body)}\n`);
}

export function createRefreshService(options = {}) {
  const env = options.env || process.env;
  const port = options.port === 0 ? 0 : toPositiveInt(options.port || env.QIANWEN_REFRESH_PORT, DEFAULT_PORT);
  const repo = resolve(options.repo || env.QIANWEN_REPO || defaultRepo);
  const codexCli = options.codexCli || env.QIANWEN_CODEX_CLI || "/Applications/ChatGPT.app/Contents/Resources/codex";
  const schemaPath = options.schemaPath || join(scriptDir, "qianwen-user-acquisition-refresh-output.schema.json");
  const supportDir = options.supportDir || join(homedir(), "Library", "Application Support", "Clair AI Studio", "qianwen-user-acquisition");
  const codexHome = options.codexHome || env.QIANWEN_CODEX_HOME || join(supportDir, "codex-home");
  const logDir = options.logDir || join(homedir(), "Library", "Logs", "Clair AI Studio", "qianwen-user-acquisition");
  const origins = allowedOrigins(env);
  let state = { status: "idle", run_id: null, summary: "等待刷新" };

  async function runRefresh(runId, packet) {
    const startedAt = new Date().toISOString();
    state = { status: "running", run_id: runId, started_at: startedAt, summary: "正在从生产数据源重新取数…" };
    if (env.QIANWEN_REFRESH_DRY_RUN === "1") {
      const result = sanitizeAgentResult({
        status: "no_change",
        summary: "演练完成，当前已是最新数据。",
        data_cutoff: packet.published_cutoff,
        metrics: { bound_accounts: 1723, new_accounts: 1318, existing_accounts: 405 },
        production_url: "https://clairku.github.io/clair-ai-studio/reports/qianwen-user-acquisition-dashboard/",
      }, packet.published_cutoff);
      state = { ...result, run_id: runId, started_at: startedAt, finished_at: new Date().toISOString() };
      return;
    }

    await Promise.all([mkdir(logDir, { recursive: true }), mkdir(codexHome, { recursive: true })]);
    const workspace = await prepareRefreshWorkspace(repo);
    const ontologyBin = await findOntologyBin(repo, env);
    const prompt = buildRefreshPrompt({ workspace, publishedCutoff: packet.published_cutoff, ontologyBin });
    const outputPath = join(tmpdir(), `qianwen-refresh-${runId}.json`);
    const stdout = [];
    const stderr = [];
    const child = spawn(codexCli, [
      "exec",
      "--json",
      "--color", "never",
      "--sandbox", "danger-full-access",
      "--skip-git-repo-check",
      "-c", 'approval_policy="never"',
      "--cd", workspace,
      "--output-schema", schemaPath,
      "--output-last-message", outputPath,
      "-",
    ], { cwd: workspace, env: { ...env, CODEX_HOME: codexHome, NO_COLOR: "1" }, stdio: ["pipe", "pipe", "pipe"] });
    child.stdout.on("data", (chunk) => appendCapped(stdout, chunk));
    child.stderr.on("data", (chunk) => appendCapped(stderr, chunk));
    child.stdin.end(prompt);

    const exitCode = await new Promise((resolveExit, rejectExit) => {
      child.once("error", rejectExit);
      child.once("close", resolveExit);
    });
    const agentFinishedAt = new Date().toISOString();
    await writeFile(join(logDir, `${runId}.log`), Buffer.concat([
      Buffer.from(`started_at=${startedAt}\nagent_finished_at=${agentFinishedAt}\nexit_code=${exitCode}\nworkspace=${workspace}\n\n`),
      ...stdout,
      Buffer.from("\n--- stderr ---\n"),
      ...stderr,
    ]));
    if (exitCode !== 0) throw new Error(`后台刷新进程退出（${exitCode}）`);

    const rawResult = JSON.parse(await readFile(outputPath, "utf8"));
    let result = sanitizeAgentResult(rawResult, packet.published_cutoff);
    if (result.status === "updated") {
      await runProcess(process.execPath, [join(workspace, "scripts", "validate-qianwen-user-acquisition-dashboard.mjs"), "--write-fallback"], {
        cwd: workspace,
        env: { ...env, NO_COLOR: "1" },
      });
      await Promise.all([
        cp(join(workspace, "public", REPORT_PATH, "data", "latest.json"), join(workspace, "docs", REPORT_PATH, "data", "latest.json")),
        cp(join(workspace, "public", REPORT_PATH, "data", "fallback-data.js"), join(workspace, "docs", REPORT_PATH, "data", "fallback-data.js")),
      ]);
      const snapshot = JSON.parse(await readFile(join(workspace, "public", REPORT_PATH, "data", "latest.json"), "utf8"));
      const dataCutoff = safeCutoff(snapshot?.meta?.data_cutoff);
      const metrics = {
        bound_accounts: safeCount(snapshot?.metrics?.bound_accounts),
        new_accounts: safeCount(snapshot?.metrics?.new_accounts),
        existing_accounts: safeCount(snapshot?.metrics?.existing_accounts),
      };
      if (!dataCutoff || Object.values(metrics).some((value) => value === null)) throw new Error("刷新结果缺少有效的截止时间或关键指标");
      await publishWorkspace(workspace, dataCutoff);
      await verifyProductionSnapshot(dataCutoff, metrics);
      result = { ...result, data_cutoff: dataCutoff, metrics, production_url: PRODUCTION_URL };
    }
    state = { ...result, run_id: runId, started_at: startedAt, finished_at: new Date().toISOString() };
  }

  const server = createServer(async (request, response) => {
    const origin = request.headers.origin;
    if (!isAllowedOrigin(origin, origins)) return writeJson(response, 403, { error: "origin_not_allowed" });
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Private-Network", "true");
    response.setHeader("Vary", "Origin");

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Qianwen-Action");
      response.setHeader("Access-Control-Max-Age", "600");
      return response.end();
    }

    const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
    if (request.method === "GET" && (url.pathname === "/health" || url.pathname === "/status")) {
      if (url.pathname === "/status" && url.searchParams.get("run_id") && url.searchParams.get("run_id") !== state.run_id) {
        return writeJson(response, 404, { error: "run_not_found" }, origin);
      }
      return writeJson(response, 200, state, origin);
    }

    if (request.method === "POST" && url.pathname === "/refresh") {
      if (request.headers["x-qianwen-action"] !== "refresh-v1") return writeJson(response, 400, { error: "action_header_required" }, origin);
      if (state.status === "running") return writeJson(response, 409, state, origin);
      try {
        const packet = sanitizeRequest(await readJsonBody(request));
        const runId = `${Date.now()}-${crypto.randomUUID()}`;
        state = { status: "running", run_id: runId, started_at: new Date().toISOString(), summary: "正在启动生产数据刷新…" };
        const acceptedState = state;
        runRefresh(runId, packet).catch((error) => {
          state = {
            status: "blocked",
            run_id: runId,
            summary: cleanText(error?.message) || "后台刷新服务异常",
            data_cutoff: packet.published_cutoff,
            metrics: { bound_accounts: null, new_accounts: null, existing_accounts: null },
            production_url: null,
            finished_at: new Date().toISOString(),
          };
        });
        return writeJson(response, 202, acceptedState, origin);
      } catch (error) {
        return writeJson(response, 400, { error: cleanText(error?.message) || "invalid_request" }, origin);
      }
    }

    return writeJson(response, 404, { error: "not_found" }, origin);
  });

  return {
    port,
    server,
    start: () => new Promise((resolveStart, rejectStart) => {
      server.once("error", rejectStart);
      server.listen(port, "127.0.0.1", () => resolveStart(server));
    }),
  };
}

async function main() {
  const service = createRefreshService();
  await service.start();
  const close = () => service.server.close(() => process.exit(0));
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
