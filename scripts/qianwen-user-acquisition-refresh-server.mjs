#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 43120;
const DEFAULT_ORIGINS = ["https://clairku.github.io"];
const MAX_BODY_BYTES = 16 * 1024;
const MAX_LOG_BYTES = 2 * 1024 * 1024;
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

export function buildRefreshPrompt({ repo, publishedCutoff, ontologyBin }) {
  return `立即执行一次“千问 X 且慢AI小顾用户数据看板”的真实生产数据刷新，并在成功后发布 GitHub Pages。

仓库锚点：${repo}
当前页面截止时间：${publishedCutoff || "未知"}
本体 CLI：${ontologyBin || "未找到（这种情况必须返回 blocked）"}
生产页：https://clairku.github.io/clair-ai-studio/reports/qianwen-user-acquisition-dashboard/
权威快照：public/reports/qianwen-user-acquisition-dashboard/data/latest.json

必须完成的取数：
1. 使用上面的本体 CLI；先执行 auth status。未登录、401、需要浏览器交互或本体不可用时，不得猜数，直接返回 blocked。
2. 只发起一次新的本体问题，effort=high。明确要求它实时查询生产数据库，统计从 2026-08-03 00:00:00（Asia/Shanghai）到本次查询时点的数据；回答必须是可落入现有 latest.json 的完整、匿名、聚合快照，不得返回用户明细。
3. 绑定定义、千问来源识别、新/老用户分类、每日趋势、画像、行为和经营口径必须沿用现有 latest.json 与 scripts/validate-qianwen-user-acquisition-dashboard.mjs。新用户=首次绑定时尚未注册且慢；老用户=首次绑定时已有且慢账户。
4. 画像、行为、经营数据对 all/new/existing 三个 cohort 分别计算。执行 k=20 的主抑制和互补抑制，禁止通过“全部减一类”反推出小样本；禁止输出用户 ID、手机号、单用户金额、原始对话、内部任务/查询标识或生产凭证。
5. 查询时点必须写入 meta.generated_at 和 meta.data_cutoff（北京时间 +08:00）；当天 daily.partial=true，历史日期 false；所有总数、每日数、分组和观察窗口必须闭合。

仓库与发布要求：
- 先 fetch origin/main。用独立临时 worktree 基于最新 origin/main 工作，绝不切换、覆盖或提交仓库锚点中的其他任务改动。
- 以现有 latest.json 为严格模板，只替换真实查询得到的数据；不得删减模块、改变 schema_version 或放宽隐私规则。
- 同步更新 public 与 docs 下的 latest.json 和 fallback-data.js。运行 node scripts/validate-qianwen-user-acquisition-dashboard.mjs --write-fallback，再同步 fallback 到 docs；运行 npm run build、npm test、git diff --check。
- 若本次 cutoff 不晚于已发布 cutoff，且所有指标完全相同，返回 no_change，不提交。
- 有新快照则只提交本报告的必要文件，提交信息用 feat(qianwen): refresh dashboard data，推送到 origin/main；遇到并发更新先 fetch/rebase 再安全重试，禁止 force push。
- 推送后轮询生产 latest.json，确认线上 data_cutoff 已达到本次值且关键指标一致，再返回 updated。任何取数、校验、推送或 Pages 验证失败都返回 blocked，并保留上一版生产数据。
- 最终 summary 只写面向看板使用者的结论，控制在 100 个汉字内；不要写内部链接、命令或凭证。

最终必须严格按给定 JSON Schema 返回，不要写额外文字。`;
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
    const ontologyBin = await findOntologyBin(repo, env);
    const prompt = buildRefreshPrompt({ repo, publishedCutoff: packet.published_cutoff, ontologyBin });
    const outputPath = join(tmpdir(), `qianwen-refresh-${runId}.json`);
    const stdout = [];
    const stderr = [];
    const child = spawn(codexCli, [
      "exec",
      "--json",
      "--color", "never",
      "--sandbox", "danger-full-access",
      "-c", 'approval_policy="never"',
      "--cd", repo,
      "--output-schema", schemaPath,
      "--output-last-message", outputPath,
      "-",
    ], { cwd: repo, env: { ...env, CODEX_HOME: codexHome, NO_COLOR: "1" }, stdio: ["pipe", "pipe", "pipe"] });
    child.stdout.on("data", (chunk) => appendCapped(stdout, chunk));
    child.stderr.on("data", (chunk) => appendCapped(stderr, chunk));
    child.stdin.end(prompt);

    const exitCode = await new Promise((resolveExit, rejectExit) => {
      child.once("error", rejectExit);
      child.once("close", resolveExit);
    });
    const finishedAt = new Date().toISOString();
    await writeFile(join(logDir, `${runId}.log`), Buffer.concat([
      Buffer.from(`started_at=${startedAt}\nfinished_at=${finishedAt}\nexit_code=${exitCode}\n\n`),
      ...stdout,
      Buffer.from("\n--- stderr ---\n"),
      ...stderr,
    ]));
    if (exitCode !== 0) throw new Error(`后台刷新进程退出（${exitCode}）`);

    const rawResult = JSON.parse(await readFile(outputPath, "utf8"));
    const result = sanitizeAgentResult(rawResult, packet.published_cutoff);
    state = { ...result, run_id: runId, started_at: startedAt, finished_at: finishedAt };
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
