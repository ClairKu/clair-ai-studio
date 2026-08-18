#!/usr/bin/env node
/**
 * 常驻取数 agent：轮询公网 Worker 上排队的刷新请求，跑 GitLab 取数，把结果推回去。
 * 这是「公网点一下就更新」这条链路里唯一能进内网的一环。
 *
 *   PAIN_OFF_WORKER_URL=... PAIN_OFF_AGENT_TOKEN=... GIT_ACCESS_TOKEN=... \
 *     node automation/pain-off/agent.mjs
 *
 * 平时由 launchd 常驻（见 launchd/），不需要手动跑。
 */
import { buildSnapshot } from "./lib/snapshot.mjs";
import { loadConfig, readJson, writeJson, PUBLIC_SNAPSHOT, DETAIL_FILE } from "./lib/paths.mjs";
import { claimJob, completeJob, pushToWorker, workerConfigured } from "./lib/worker-client.mjs";
import { publishToGitHub } from "./publish.mjs";

const POLL_MS = Number(process.env.PAIN_OFF_POLL_MS || 20000);
const IDLE_LOG_EVERY = 30;

const log = (...parts) => console.log(`[${new Date().toISOString()}]`, ...parts);

async function runRefresh() {
  const { rules, roster, curated } = loadConfig();
  const { snapshot, detail, delta } = await buildSnapshot({
    rules,
    roster,
    token: process.env[rules.source.token_env],
    curated,
    previousSnapshot: readJson(DETAIL_FILE) || readJson(PUBLIC_SNAPSHOT),
  });
  writeJson(PUBLIC_SNAPSHOT, snapshot);
  writeJson(DETAIL_FILE, detail);
  return { snapshot, delta };
}

function summarize(delta) {
  if (!delta.changed) return "没有新的提交或上线，数字保持不变。";
  const parts = [];
  if (delta.new_submitted) parts.push(`新增 ${delta.new_submitted} 个提交`);
  if (delta.new_released) parts.push(`新增 ${delta.new_released} 个上线`);
  return `${parts.join("，")}；仍有 ${delta.pending_release} 个在途。`;
}

async function handleJob(job) {
  log(`领到刷新请求 ${job.id}（来源：${job.reason || "公网"}）`);
  try {
    const { snapshot, delta } = await runRefresh();
    await pushToWorker(snapshot);
    await completeJob(job.id, {
      status: delta.changed ? "updated" : "no_change",
      summary: summarize(delta),
      delta,
      snapshot,
    });
    log(`完成 ${job.id}：${summarize(delta)}`);
    // GitHub Pages 是「底」：Worker 挂了也还有一份能读的快照。推失败不影响本次结果。
    await publishToGitHub(snapshot).then(
      (result) => log(`Pages 已同步 ${result.commit}`),
      (error) => log(`Pages 同步失败（不影响本次结果）：${error.message}`),
    );
  } catch (error) {
    log(`处理 ${job.id} 失败：${error.message}`);
    await completeJob(job.id, { status: "failed", summary: `取数失败：${error.message}` }).catch(() => {});
  }
}

async function main() {
  if (!workerConfigured()) {
    console.error("缺少 PAIN_OFF_WORKER_URL / PAIN_OFF_AGENT_TOKEN，agent 无法连中继。");
    process.exit(1);
  }
  log(`agent 启动，每 ${POLL_MS / 1000}s 轮询一次。`);
  let idleTicks = 0;
  for (;;) {
    try {
      const job = await claimJob();
      if (job) {
        idleTicks = 0;
        await handleJob(job);
      } else if ((idleTicks += 1) % IDLE_LOG_EVERY === 0) {
        log("空闲中。");
      }
    } catch (error) {
      log(`轮询失败：${error.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

main();
