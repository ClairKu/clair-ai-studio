#!/usr/bin/env node
/**
 * 千问用户数据看板 · 本机刷新 agent
 *
 * 盈米本体是内网服务，公网侧（GitHub Pages、Actions runner、Cloudflare Worker）都查不到它。
 * 这个进程跑在能访问内网的本机上，只发出站请求，不监听任何端口：
 *
 *   1. 每 15 秒向中继心跳 + 领任务（公网访客输对口令才会产生任务）
 *   2. 领到任务就按固定口径问本体，把答案解析成看板快照
 *   3. 用与构建期同一份校验（qianwen-dashboard-data-validator.mjs）把关
 *   4. 快照回传中继（访客立刻看到），同时经 GitHub API 落库（公开静态页保持新鲜）
 *   5. 另外每天 09:00 / 21:00 自己刷新一次，保证没人点按钮时数据也不会太旧
 *
 * 用法：
 *   node scripts/qianwen-dashboard-refresh-agent.mjs            # 常驻，供 launchd 拉起
 *   node scripts/qianwen-dashboard-refresh-agent.mjs --once     # 立刻刷新一次后退出
 *   node scripts/qianwen-dashboard-refresh-agent.mjs --once --no-publish   # 只查数校验，不发布
 *
 * 环境变量：
 *   RELAY_AGENT_TOKEN   必填，与 Worker 的 AGENT_TOKEN 一致
 *   RELAY_BASE          中继地址，默认 https://clair-refresh-relay.clairku.workers.dev
 *   GITHUB_REPO         默认 clairku/clair-ai-studio
 *   ONTOLOGY_BIN        本体 CLI 路径，默认自动定位
 */

import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateQianwenDashboardData } from "./qianwen-dashboard-data-validator.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");
const REPORT_PATH = "reports/qianwen-user-acquisition-dashboard/data";
const TEMPLATE_PATH = join(repoRoot, "public", REPORT_PATH, "latest.json");

const RELAY_BASE = (process.env.RELAY_BASE || "https://clair-refresh-relay.clairku.workers.dev").replace(/\/+$/, "");
const AGENT_TOKEN = process.env.RELAY_AGENT_TOKEN || "";
const DASHBOARD_ID = "qianwen-user-acquisition";
const GITHUB_REPO = process.env.GITHUB_REPO || "clairku/clair-ai-studio";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
// 该网络环境下 api.github.com 直连偶发整段路由失联，留一个已验证可用的 IP 兜底。
const GITHUB_FALLBACK_IP = process.env.GITHUB_API_RESOLVE_IP || "140.82.113.6";

const POLL_INTERVAL_MS = 15_000;
const READINESS_INTERVAL_MS = 60_000;
const SCHEDULED_HOURS = [9, 21];
const ONTOLOGY_TIMEOUT_SECONDS = 900;
const MAX_QUERY_ATTEMPTS = 3;
const STATE_FILE = join(homedir(), ".clair", "qianwen-dashboard-refresh-state.json");

const flags = new Set(process.argv.slice(2));
const RUN_ONCE = flags.has("--once");
const NO_PUBLISH = flags.has("--no-publish") || flags.has("--dry-run");

const log = (message) => process.stdout.write(`${new Date().toISOString()} ${message}\n`);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------------------------------------------------------------- 基础工具 */

function runCommand(command, args, { timeoutMs = 60_000, input = "" } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      resolve({ code: -1, stdout, stderr: `${stderr}\n命令超时` });
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: String(error?.message || error) });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    if (input) child.stdin.write(input);
    child.stdin.end();
  });
}

/** 北京时间的日期部件，不依赖本机时区设置。 */
function shanghaiParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour === "24" ? "00" : parts.hour),
    time: `${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}:${parts.second}`,
  };
}

const shanghaiNowIso = () => {
  const { date, time } = shanghaiParts();
  return `${date}T${time}+08:00`;
};

/* ------------------------------------------------------------------ 中继 */

async function relay(path, body = {}) {
  const response = await fetch(`${RELAY_BASE}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AGENT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`中继 ${path} 返回 ${response.status}：${payload.error || ""}`);
  return payload;
}

const reportProgress = (jobId, message, progressUrl = "") => (jobId
  ? relay("/agent/progress", { job_id: jobId, message, progress_url: progressUrl }).catch(() => {})
  : Promise.resolve());

/* -------------------------------------------------------------- 本体查询 */

function locateOntologyBin() {
  if (process.env.ONTOLOGY_BIN) return process.env.ONTOLOGY_BIN;
  const candidates = [
    join(homedir(), ".claude", "skills", "ontology", "ontology"),
    join(repoRoot, ".claude", "skills", "ontology", "ontology"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) || "ontology";
}

const ONTOLOGY_BIN = locateOntologyBin();

async function ontologyReady() {
  const { code, stdout } = await runCommand(ONTOLOGY_BIN, ["auth", "status"], { timeoutMs: 20_000 });
  if (code !== 0) return { ready: false, reason: "本体 CLI 不可用（先确认已连上公司网络）" };
  try {
    const status = JSON.parse(stdout);
    if (!status.logged_in) return { ready: false, reason: "本体登录态已失效，请在本机执行 ontology auth login" };
    return { ready: true };
  } catch {
    return { ready: false, reason: "读不到本体登录状态" };
  }
}

/**
 * 固定口径提问。把当前快照原样作为结构模板给过去——这是让自然语言问答稳定产出
 * 同一套 schema 最省事也最可靠的办法：本体只需要换数字，不需要重新设计结构。
 */
function buildPrompt(template) {
  return `请查询「千问 X 且慢AI小顾」服务的最新用户数据，并**只输出一个 JSON 对象**（放在\`\`\`json 代码块里），不要任何解释文字。

## 统计口径（必须严格遵守）

1. 统计窗口：服务上线时点 2026-08-10 08:00:00（Asia/Shanghai）起，至你本次查询时点，左闭右开。
2. 累计绑定用户 bound_accounts：窗口内绑定过的且慢账号数，同一账号只计一次。
3. 新老用户划分：且慢注册时间在上线时点之后的记为新用户 new_accounts，之前的记为老用户 existing_accounts；
   拿不到注册时间的计入 missing_registration_time。三者相加必须等于 bound_accounts。
4. daily 按北京时间自然日排列，从 2026-08-10 起**逐日连续不断档**到查询当日。
   首日只含 08:00 之后、最新日只到查询时点，这两行 partial=true，中间各行 partial=false。
   每行 bound_accounts_today = new + existing + unclassified；cumulative_* 为逐日累加值，
   最后一行的 cumulative_* 必须分别等于 metrics 里的对应总数。
5. meta.data_cutoff = 本次查询时点，格式必须是 2026-08-18T14:05:00+08:00 这样的北京时间；
   meta.generated_at 同理；daily 最后一行的 date 必须等于 data_cutoff 的日期部分；
   behavior.window_end_at 必须与 data_cutoff 完全一致。
6. profile 五个维度、behavior 五个指标的 id 与模板完全一致，一个不多一个不少；
   all / new / existing 三个 cohort 的 population_accounts 必须分别等于
   bound_accounts / new_accounts / existing_accounts。
7. profile 每个维度 buckets 的 accounts 合计必须等于该 cohort 的 population_accounts。
8. behavior 每个指标必须满足：population_accounts = eligible_accounts + excluded_accounts，
   且 eligible_accounts = reached_accounts + not_reached_accounts + unknown_accounts。

## 公开小样本保护（k = 20）

- 任何要公开的人数格子，只要大于 0 且小于 20，该项必须整体改成 {"id": "...", "state": "suppressed"}，
  **不得携带任何计数字段**（没有 buckets、没有 *_accounts）。
- 口径本身查不到、没有权威数据源的，改成 {"id": "...", "state": "unavailable"}，同样不带计数字段。
- 互补隐藏：同一个 id 在 all / new / existing 三个 cohort 中，如果恰好只有两个是 confirmed、
  另一个被隐藏，那个被隐藏的人数可以相减反推出来——这种情况下必须把这一组里再多隐藏一个，
  使 confirmed 的数量不等于 2。
- 绝对不要输出任何用户明细、用户标识、手机号、单用户金额、原始对话内容。

## 输出结构

严格照抄下面这份上一版快照的结构（字段名、层级、id 全部保持一致），只把数值和时间换成最新的：

\`\`\`json
${JSON.stringify(template, null, 2)}
\`\`\`

再强调一次：只输出一个 \`\`\`json 代码块，里面是完整的 JSON 对象，不要写任何说明。`;
}

function extractJson(answer) {
  const fenced = [...answer.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)]
    .map((match) => match[1].trim())
    .filter((block) => block.startsWith("{"));
  const candidates = fenced.length ? fenced : [];
  if (!candidates.length) {
    const start = answer.indexOf("{");
    const end = answer.lastIndexOf("}");
    if (start >= 0 && end > start) candidates.push(answer.slice(start, end + 1));
  }
  for (const candidate of candidates.reverse()) {
    try {
      return JSON.parse(candidate);
    } catch { /* 试下一个候选块 */ }
  }
  throw new Error("本体的回答里没有可解析的 JSON");
}

/** 定义上固定不变的字段一律以模板为准，避免每次都因为文案措辞不同触发校验重试。 */
function applyTemplateConstants(data, template) {
  return {
    ...data,
    schema_version: template.schema_version,
    meta: {
      ...data.meta,
      title: template.meta.title,
      window_start_at: template.meta.window_start_at,
      launch_at: template.meta.launch_at,
      timezone: template.meta.timezone,
      source: template.meta.source,
      evidence_state: template.meta.evidence_state,
      privacy: template.meta.privacy,
      privacy_policy: template.meta.privacy_policy,
    },
    privacy: template.privacy,
    behavior: {
      ...data.behavior,
      window_start_at: template.behavior.window_start_at,
      anchor: template.behavior.anchor,
    },
  };
}

async function queryOntologySnapshot(template, jobId) {
  let sessionId = "";
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt += 1) {
    const question = attempt === 1
      ? buildPrompt(template)
      : `上一次返回的 JSON 没有通过看板校验：${lastError}。请修正后重新只输出完整的 JSON 代码块，结构保持不变。`;
    const askArgs = ["ask", question, "--effort", "high"];
    if (sessionId) askArgs.push("--session-id", sessionId);

    const asked = await runCommand(ONTOLOGY_BIN, askArgs, { timeoutMs: 120_000 });
    if (asked.code !== 0) {
      if (/401|未授权|请先 login/i.test(`${asked.stdout}${asked.stderr}`)) {
        throw new Error("本体登录态已失效，请在本机执行 ontology auth login 后重试");
      }
      throw new Error(`向本体提问失败：${(asked.stderr || asked.stdout).trim().slice(0, 200)}`);
    }
    let started;
    try {
      started = JSON.parse(asked.stdout);
    } catch {
      throw new Error(`本体返回了预期外的响应：${asked.stdout.trim().slice(0, 200)}`);
    }
    sessionId = started.session_id || sessionId;
    await reportProgress(jobId, "正在向盈米本体查询最新数据…", started.progress_url || "");
    log(`第 ${attempt} 次查询：${started.progress_url || started.task_id}`);

    const resultArgs = ["result", started.task_id, "--timeout", String(ONTOLOGY_TIMEOUT_SECONDS)];
    if (started.view_token) resultArgs.push("--view-token", started.view_token);
    const result = await runCommand(ONTOLOGY_BIN, resultArgs, { timeoutMs: (ONTOLOGY_TIMEOUT_SECONDS + 60) * 1000 });
    if (result.code !== 0) {
      lastError = (result.stderr || result.stdout).trim().slice(0, 200);
      log(`取结果失败：${lastError}`);
      continue;
    }

    try {
      const snapshot = applyTemplateConstants(extractJson(result.stdout), template);
      validateQianwenDashboardData(snapshot);
      return snapshot;
    } catch (error) {
      lastError = String(error?.message || error).replace("千问用户数据看板校验失败：", "");
      log(`第 ${attempt} 次结果未通过校验：${lastError}`);
      await reportProgress(jobId, "数据校验未通过，正在让本体修正…");
    }
  }
  throw new Error(`连续 ${MAX_QUERY_ATTEMPTS} 次未拿到通过校验的数据：${lastError}`);
}

/* ---------------------------------------------------------- GitHub 发布 */

let githubToken = "";
let githubResolveIp = "";

async function ensureGithubToken() {
  if (githubToken) return githubToken;
  const { code, stdout } = await runCommand("gh", ["auth", "token"], { timeoutMs: 20_000 });
  if (code !== 0 || !stdout.trim()) throw new Error("拿不到 GitHub token（请先 gh auth login）");
  githubToken = stdout.trim();
  return githubToken;
}

async function githubApi(method, path, body) {
  const token = await ensureGithubToken();
  const attempt = async (resolveIp) => {
    const args = ["-s", "-S", "--max-time", "90", "-X", method];
    if (resolveIp) args.push("--resolve", `api.github.com:443:${resolveIp}`);
    args.push(
      "-H", `Authorization: token ${token}`,
      "-H", "Accept: application/vnd.github+json",
      "-H", "Content-Type: application/json",
      "-w", "\n%{http_code}",
    );
    if (body !== undefined) args.push("--data-binary", "@-");
    args.push(`https://api.github.com${path}`);
    return runCommand("curl", args, {
      timeoutMs: 100_000,
      input: body === undefined ? "" : JSON.stringify(body),
    });
  };

  let result = await attempt(githubResolveIp);
  let [payloadText, statusText] = splitCurlOutput(result.stdout);
  if (result.code !== 0 || !statusText) {
    // 直连这条路由在该网络环境下会整段失联，换已验证可用的 IP 再来一次。
    githubResolveIp = GITHUB_FALLBACK_IP;
    result = await attempt(githubResolveIp);
    [payloadText, statusText] = splitCurlOutput(result.stdout);
  }
  const status = Number(statusText);
  if (!status) throw new Error(`GitHub 请求失败：${(result.stderr || "无响应").trim().slice(0, 200)}`);
  const payload = payloadText ? JSON.parse(payloadText) : {};
  if (status >= 400) throw new Error(`GitHub ${method} ${path} 返回 ${status}：${payload.message || ""}`);
  return payload;
}

function splitCurlOutput(stdout) {
  const index = stdout.lastIndexOf("\n");
  if (index < 0) return [stdout, ""];
  return [stdout.slice(0, index), stdout.slice(index + 1).trim()];
}

const fallbackSource = (data) => `window.QIANWEN_ACQUISITION_DATA = ${JSON.stringify(data, null, 2)};\n`;

/**
 * 一次提交同时更新 public/ 与 docs/ 两份数据。
 * docs/ 是 vite 构建产物、也是 GitHub Pages 实际 serve 的目录；静态报告目录里两者内容一致，
 * 所以直接写两份即可让线上页面立刻同步，不必在本机重跑整个构建。
 */
async function publishToGitHub(data) {
  const latestJson = `${JSON.stringify(data, null, 2)}\n`;
  const fallbackJs = fallbackSource(data);

  const [latestBlob, fallbackBlob] = await Promise.all([
    githubApi("POST", `/repos/${GITHUB_REPO}/git/blobs`, {
      content: Buffer.from(latestJson, "utf8").toString("base64"),
      encoding: "base64",
    }),
    githubApi("POST", `/repos/${GITHUB_REPO}/git/blobs`, {
      content: Buffer.from(fallbackJs, "utf8").toString("base64"),
      encoding: "base64",
    }),
  ]);

  const tree = ["public", "docs"].flatMap((root) => [
    { path: `${root}/${REPORT_PATH}/latest.json`, mode: "100644", type: "blob", sha: latestBlob.sha },
    { path: `${root}/${REPORT_PATH}/fallback-data.js`, mode: "100644", type: "blob", sha: fallbackBlob.sha },
  ]);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const ref = await githubApi("GET", `/repos/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH}`);
    const parentSha = ref.object.sha;
    const parentCommit = await githubApi("GET", `/repos/${GITHUB_REPO}/git/commits/${parentSha}`);
    const newTree = await githubApi("POST", `/repos/${GITHUB_REPO}/git/trees`, {
      base_tree: parentCommit.tree.sha,
      tree,
    });
    const commit = await githubApi("POST", `/repos/${GITHUB_REPO}/git/commits`, {
      message: `Refresh qianwen dashboard data through ${data.meta.data_cutoff}`,
      tree: newTree.sha,
      parents: [parentSha],
    });
    try {
      await githubApi("PATCH", `/repos/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`, { sha: commit.sha });
      return commit.sha;
    } catch (error) {
      // 并行会话可能刚推过，重新取一次 HEAD 再来。
      if (attempt === 1 || !/422|not a fast forward/i.test(String(error.message))) throw error;
      log("推送遇到并发更新，重新基于最新 HEAD 重试");
    }
  }
  throw new Error("推送失败");
}

/* ------------------------------------------------------------ 刷新主流程 */

let refreshing = false;

async function loadTemplate() {
  return JSON.parse(await readFile(TEMPLATE_PATH, "utf8"));
}

async function runRefresh({ jobId = "", trigger = "manual" } = {}) {
  if (refreshing) throw new Error("已有一次更新在进行中");
  refreshing = true;
  try {
    log(`开始刷新（${trigger}）`);
    const template = await loadTemplate();
    const snapshot = await queryOntologySnapshot(template, jobId);
    log(`拿到快照：绑定 ${snapshot.metrics.bound_accounts} 人，截至 ${snapshot.meta.data_cutoff}`);

    if (jobId) {
      await relay("/agent/complete", { job_id: jobId, data: snapshot });
      log("已回传中继");
    }

    // 本地也留一份，既是下次的结构模板，也方便直接跑构建期校验。
    await writeFile(TEMPLATE_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    await writeFile(join(repoRoot, "public", REPORT_PATH, "fallback-data.js"), fallbackSource(snapshot), "utf8");

    if (NO_PUBLISH) {
      log("按参数要求跳过发布");
    } else {
      const sha = await publishToGitHub(snapshot);
      log(`已推送 ${sha.slice(0, 7)}`);
    }
    return snapshot;
  } finally {
    refreshing = false;
  }
}

/* ------------------------------------------------------------ 定时与主循环 */

async function readState() {
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function writeState(state) {
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

/** 最近一个已经过去的定时档，形如 2026-08-18T09。 */
function currentScheduledSlot() {
  const { date, hour } = shanghaiParts();
  const passed = SCHEDULED_HOURS.filter((scheduled) => hour >= scheduled);
  if (!passed.length) return "";
  return `${date}T${String(Math.max(...passed)).padStart(2, "0")}`;
}

async function maybeRunScheduled() {
  const slot = currentScheduledSlot();
  if (!slot) return;
  const state = await readState();
  if (state.last_scheduled_slot === slot) return;
  try {
    await runRefresh({ trigger: `scheduled ${slot}` });
    await writeState({ ...state, last_scheduled_slot: slot, last_scheduled_at: shanghaiNowIso() });
  } catch (error) {
    log(`定时刷新失败：${error.message}`);
    // 不记 slot，下一轮还会重试；本体临时不可用时不至于整档跳过。
  }
}

function publicFailureMessage(detail) {
  if (/login|登录|401|未授权/i.test(detail)) return "更新服务需要在本机重新登录后才能查询。";
  if (/校验/.test(detail)) return "查询结果没有通过数据校验，本次更新已放弃。";
  if (/超时|timeout/i.test(detail)) return "查询超时，请稍后重试。";
  return "更新失败，请稍后重试。";
}

async function pollOnce() {
  const claimed = await relay("/agent/claim", { dashboard: DASHBOARD_ID }).catch((error) => {
    log(`领任务失败：${error.message}`);
    return null;
  });
  const job = claimed?.job;
  if (!job) return;
  log(`领到任务 ${job.job_id}`);
  try {
    await runRefresh({ jobId: job.job_id, trigger: "button" });
  } catch (error) {
    log(`任务失败：${error.message}`);
    // 失败原因会显示在公开页面上，只回可公开、对访客有意义的说法，细节留在本机日志里。
    await relay("/agent/fail", { job_id: job.job_id, message: publicFailureMessage(error.message) }).catch(() => {});
  }
}

async function main() {
  if (!AGENT_TOKEN) {
    process.stderr.write("缺少 RELAY_AGENT_TOKEN\n");
    process.exit(2);
  }

  if (RUN_ONCE) {
    const readiness = await ontologyReady();
    if (!readiness.ready) {
      process.stderr.write(`${readiness.reason}\n`);
      process.exit(1);
    }
    const snapshot = await runRefresh({ trigger: "once" });
    log(`完成：${snapshot.daily.length} 天趋势，截至 ${snapshot.meta.data_cutoff}`);
    return;
  }

  log(`刷新服务启动，中继 ${RELAY_BASE}`);
  let readiness = { ready: false, reason: "启动中" };
  let readinessCheckedAt = 0;
  let lastReason = "";

  // 心跳独立于主循环：一次刷新要跑好几分钟，期间主循环是阻塞的，
  // 靠领任务顺带心跳会让中继误判成离线，对新访客谎报「更新服务当前离线」。
  // 只有真的能查数时才心跳，中继据此如实告诉访客能不能更新。
  setInterval(() => {
    if (!readiness.ready) return;
    relay("/agent/heartbeat", { dashboard: DASHBOARD_ID }).catch(() => {});
  }, 20_000);

  for (;;) {
    if (Date.now() - readinessCheckedAt > READINESS_INTERVAL_MS) {
      readiness = await ontologyReady();
      readinessCheckedAt = Date.now();
      if (!readiness.ready && readiness.reason !== lastReason) {
        log(`暂不可用：${readiness.reason}`);
        lastReason = readiness.reason;
      }
      if (readiness.ready && lastReason) {
        log("已恢复可用");
        lastReason = "";
      }
    }

    if (readiness.ready) {
      await pollOnce();
      await maybeRunScheduled();
    }
    await delay(POLL_INTERVAL_MS);
  }
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exit(1);
});
