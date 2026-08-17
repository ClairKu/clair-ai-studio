#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 43117;
const DEFAULT_ORIGINS = ["https://clairku.github.io"];
const MAX_BODY_BYTES = 128 * 1024;
const MAX_LOG_BYTES = 2 * 1024 * 1024;
const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
const defaultRepo = resolve(scriptDir, "..");

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function allowedOrigins(env = process.env) {
  return new Set((env.PAIN_OFF_ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(","))
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

function safeCount(value) {
  return Number.isInteger(value) && value >= 0 ? value : 0;
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

export function sanitizeAgentResult(input) {
  const status = ["updated", "no_change", "blocked"].includes(input?.status) ? input.status : "blocked";
  const checkedThrough = new Date(input?.checked_through_at || "");
  return {
    status,
    summary: cleanText(input?.summary) || "核验没有返回可用结果。",
    delta: {
      new_submitted: safeCount(input?.delta?.new_submitted),
      pending_release: safeCount(input?.delta?.pending_release),
      new_released: safeCount(input?.delta?.new_released),
    },
    snapshot: {
      submitted: safeCount(input?.snapshot?.submitted),
      pending_release: safeCount(input?.snapshot?.pending_release),
      released: safeCount(input?.snapshot?.released),
    },
    accepted_client_ids: Array.isArray(input?.accepted_client_ids)
      ? [...new Set(input.accepted_client_ids.filter((value) => typeof value === "string").map((value) => value.slice(0, 80)))]
      : [],
    checked_through_at: Number.isNaN(checkedThrough.getTime()) ? new Date().toISOString() : checkedThrough.toISOString(),
    source_cursor: typeof input?.source_cursor === "string" ? input.source_cursor.slice(0, 300) : null,
    production_url: safeUrl(input?.production_url),
  };
}

function sanitizePacket(input) {
  if (input?.schema !== "pain-off-update-packet/v1") throw new Error("更新请求格式不正确");
  const changes = Array.isArray(input.changes) ? input.changes.slice(0, 50).map((change) => ({
    client_id: cleanText(change.client_id, 80),
    title: cleanText(change.title, 60),
    detail: cleanText(change.detail, 240),
    person_id: cleanText(change.person_id, 20),
    category: cleanText(change.category, 30),
    priority: cleanText(change.priority, 10),
    baseline_date: cleanText(change.baseline_date, 20) || null,
    originally_unscheduled: change.originally_unscheduled === true,
    submitted_at: cleanText(change.submitted_at, 40),
  })) : [];
  return {
    schema: "pain-off-update-packet/v1",
    generated_at: cleanText(input.generated_at, 40),
    source_cutoff: cleanText(input.source_cutoff, 40) || null,
    changes,
  };
}

async function readCheckpoint(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

export function buildRefreshPrompt({ packet, checkpoint, repo }) {
  return `立即执行一次“痛点消消乐”按钮触发的增量核验，并在必要时发布生产战报。

仓库：${repo}
数据：public/reports/product-demand-pulse/data/latest.json
生产页：https://clairku.github.io/clair-ai-studio/reports/product-demand-pulse/

取数范围：
1. 读取 latest.json 和下面的本机 checkpoint。优先使用 checkpoint.source_cursor；否则使用 checkpoint.checked_through_at；再否则使用 latest.json 的 meta.last_change_at / meta.cutoff 中较晚者。
2. 只查该游标之后新增或被修改的需求，以及 latest.json 中 status 不是 released / impact_confirmed 的既有记录。已经确认上线的历史记录不要重新检查。
3. 若 packet.changes 非空，逐条核验并纳入本次增量；按“问题 + 交付结果”去重，补充与追问不新增。
4. 当前 PM 范围仅：嘉鸿、家亮、春燕、刘晨、金星、刘佳、嘉烨。公开数据必须脱敏。

状态证据：
- submitted：确认已有新需求；building：已进入开发但还没有有效合并；merged：同一需求的有效 MR 链路已合并、但生产还未确认生效；released：有效 MR 链路已合并且生产环境实际生效。
- 只有 MR 合并、只有测试/产品验收、或只有生产现象都不足以标记 released。
- 原 MR 关闭时，沿同一需求、同一代码分支的替代 MR 与发布链路核验。
- 可确认计划日、实际上线日或原本无排期时才写价值字段，不推算。

执行要求：
- 先同步 origin/main；保护任何无关改动。当前工作区不干净时使用安全的临时 worktree，不覆盖他人工作。
- 无变化不写仓库、不提交、不推送。
- 有变化只更新脱敏数据与 fallback，运行 npm run build、npm test、git diff --check，提交并推送 main；验证 Pages、页面资源、控制台与 390px。
- 数据源或发布受阻时保留上次生产数据，status 返回 blocked 并说清缺口。
- 核验成功（updated 或 no_change）后，将 checked_through_at 设为本次真实完成时间；若数据源提供稳定游标，原样返回 source_cursor，否则为 null。
- delta.pending_release 表示本次新发现或新转为待发布的数量；snapshot.pending_release 表示当前全部待发布数量。

本机 checkpoint：
${JSON.stringify(checkpoint || {}, null, 2)}

页面提交的增量：
${JSON.stringify(packet, null, 2)}

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
  const port = toPositiveInt(options.port || env.PAIN_OFF_REFRESH_PORT, DEFAULT_PORT);
  const repo = resolve(options.repo || env.PAIN_OFF_REPO || defaultRepo);
  const codexCli = options.codexCli || env.PAIN_OFF_CODEX_CLI || "/Applications/ChatGPT.app/Contents/Resources/codex";
  const schemaPath = options.schemaPath || join(scriptDir, "product-demand-pulse-refresh-output.schema.json");
  const supportDir = options.supportDir || join(homedir(), "Library", "Application Support", "Clair AI Studio", "product-demand-pulse");
  const checkpointPath = join(supportDir, "checkpoint.json");
  const logDir = join(homedir(), "Library", "Logs", "Clair AI Studio", "product-demand-pulse");
  const origins = allowedOrigins(env);
  let state = { status: "idle", run_id: null, summary: "等待核验" };

  async function runRefresh(runId, packet) {
    const startedAt = new Date().toISOString();
    state = { status: "running", run_id: runId, started_at: startedAt, summary: "正在增量核验" };
    if (env.PAIN_OFF_DRY_RUN === "1") {
      const result = sanitizeAgentResult({
        status: "no_change",
        summary: "演练完成：没有新的状态变化。",
        delta: {},
        snapshot: {},
        accepted_client_ids: [],
        checked_through_at: new Date().toISOString(),
        source_cursor: null,
        production_url: "https://clairku.github.io/clair-ai-studio/reports/product-demand-pulse/",
      });
      state = { ...result, run_id: runId, started_at: startedAt, finished_at: new Date().toISOString() };
      return;
    }

    await Promise.all([mkdir(supportDir, { recursive: true }), mkdir(logDir, { recursive: true })]);
    const checkpoint = await readCheckpoint(checkpointPath);
    const prompt = buildRefreshPrompt({ packet, checkpoint, repo });
    const outputPath = join(tmpdir(), `pain-off-refresh-${runId}.json`);
    const stdout = [];
    const stderr = [];
    const child = spawn(codexCli, [
      "exec",
      "--json",
      "--color", "never",
      "--sandbox", "danger-full-access",
      "--ask-for-approval", "never",
      "--cd", repo,
      "--output-schema", schemaPath,
      "--output-last-message", outputPath,
      "-",
    ], { cwd: repo, env: { ...env, NO_COLOR: "1" }, stdio: ["pipe", "pipe", "pipe"] });
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
    if (exitCode !== 0) throw new Error(`Codex 核验进程退出（${exitCode}）`);

    const rawResult = JSON.parse(await readFile(outputPath, "utf8"));
    const result = sanitizeAgentResult(rawResult);
    state = { ...result, run_id: runId, started_at: startedAt, finished_at: finishedAt };
    if (result.status !== "blocked") {
      await writeFile(checkpointPath, `${JSON.stringify({
        checked_through_at: result.checked_through_at,
        source_cursor: result.source_cursor,
      }, null, 2)}\n`);
    }
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
      response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Pain-Off-Action");
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
      if (request.headers["x-pain-off-action"] !== "refresh-v1") return writeJson(response, 400, { error: "action_header_required" }, origin);
      if (state.status === "running") return writeJson(response, 409, state, origin);
      try {
        const packet = sanitizePacket(await readJsonBody(request));
        const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        state = { status: "running", run_id: runId, started_at: new Date().toISOString(), summary: "正在启动增量核验" };
        runRefresh(runId, packet).catch((error) => {
          state = {
            status: "blocked",
            run_id: runId,
            summary: cleanText(error?.message) || "核验服务异常",
            delta: { new_submitted: 0, pending_release: 0, new_released: 0 },
            snapshot: { submitted: 0, pending_release: 0, released: 0 },
            accepted_client_ids: [],
            finished_at: new Date().toISOString(),
          };
        });
        return writeJson(response, 202, state, origin);
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
