#!/usr/bin/env node
/**
 * 跑一次取数，把新快照写到 public/reports/product-demand-pulse/data/latest.json。
 *
 *   node automation/pain-off/refresh.mjs              # 取数 + 写盘
 *   node automation/pain-off/refresh.mjs --dry-run    # 只取数不写盘，打印结果
 *   node automation/pain-off/refresh.mjs --publish    # 取数 + 写盘 + 推 GitHub + 推 Worker
 *
 * 需要 GIT_ACCESS_TOKEN（GitLab，scope=read_api）。
 */
import { buildSnapshot } from "./lib/snapshot.mjs";
import { loadConfig, readJson, writeJson, PUBLIC_SNAPSHOT, DETAIL_FILE, PREVIOUS_FILE } from "./lib/paths.mjs";
import { pushToWorker } from "./lib/worker-client.mjs";
import { publishToGitHub } from "./publish.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const publish = args.has("--publish");

async function main() {
  const { rules, roster, curated } = loadConfig();
  const token = process.env[rules.source.token_env];
  const previousSnapshot = readJson(PUBLIC_SNAPSHOT);
  const previousDetail = readJson(DETAIL_FILE);

  const { snapshot, detail, delta } = await buildSnapshot({
    rules,
    roster,
    token,
    curated,
    previousSnapshot: previousDetail || previousSnapshot,
  });

  console.log(
    [
      `口径      ${snapshot.meta.contract_version}（${snapshot.meta.source_of_truth}）`,
      `区间      ${snapshot.meta.window_start.slice(0, 10)} 起累计`,
      `累计提交  ${snapshot.summary.submitted}`,
      `累计上线  ${snapshot.summary.released}`,
      `在途      ${snapshot.summary.in_flight}`,
      `端到端    ${snapshot.summary.end_to_end_people} 人`,
      `本次变化  新提交 ${delta.new_submitted} / 新上线 ${delta.new_released} / 待发布 ${delta.pending_release}`,
    ].join("\n"),
  );
  for (const person of snapshot.people) {
    console.log(`  ${person.display_name.padEnd(4, "　")} 提交 ${person.submitted} · 上线 ${person.released}`);
  }

  if (dryRun) {
    console.log("\n--dry-run：未写盘。");
    return;
  }

  if (previousSnapshot) writeJson(PREVIOUS_FILE, previousSnapshot);
  writeJson(PUBLIC_SNAPSHOT, snapshot);
  writeJson(DETAIL_FILE, detail);
  console.log(`\n已写入 ${PUBLIC_SNAPSHOT}`);

  if (!publish) {
    console.log("加 --publish 才会推到公网。");
    return;
  }

  await pushToWorker(snapshot).then(
    (result) => console.log(`Worker 已更新：${result.url}`),
    (error) => console.warn(`Worker 推送失败（页面会退回读 Pages 快照）：${error.message}`),
  );
  await publishToGitHub(snapshot).then(
    (result) => console.log(`GitHub Pages 已更新：${result.commit}`),
    (error) => console.error(`GitHub 推送失败：${error.message}`),
  );
}

main().catch((error) => {
  console.error(`取数失败：${error.message}`);
  if (error.hint) console.error(`提示：${error.hint}`);
  process.exitCode = 1;
});
