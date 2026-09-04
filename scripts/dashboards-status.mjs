#!/usr/bin/env node
/**
 * 数据看板统一状态总览：一条命令看所有看板的数据新鲜度、更新机制与定时任务健康。
 * 用法：node scripts/dashboards-status.mjs   （或 npm run dashboards:status）
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const HOME = process.env.HOME;

const DASHBOARDS = [
  {
    name: "需求脉搏 product-demand-pulse",
    data: path.join(root, "public/reports/product-demand-pulse/data/latest.json"),
    time: (d) => d.meta?.generated_at,
    mechanism: "全自动：launchd 定时 + 常驻 agent（automation/pain-off/）",
    launchd: ["com.clair.pain-off.schedule", "com.clair.pain-off.agent"],
    staleHours: 26,
  },
  {
    name: "千问用户数据看板",
    data: path.join(root, "public/reports/qianwen-user-acquisition-dashboard/data/latest.json"),
    time: (d) => d.meta?.generated_at,
    mechanism: "半自动：scripts/qianwen-refresh/（runbook 见其 README）+ 本机刷新服务",
    launchd: ["com.clair.qianwen-user-acquisition-refresh"],
    staleHours: 24 * 4,
  },
  {
    name: "OAP × 且慢用户看板",
    data: path.join(root, "public/reports/oap-qieman-user-dashboard/data/latest.json"),
    time: (d) => d.meta?.generated_at,
    mechanism: "手动：内网取数后随构建发布（页面 2026-09-04 起改为只读快照）",
    launchd: [],
    staleHours: 24 * 21,
  },
  {
    name: "OAP 8·3 汇报 latest.json",
    data: path.join(root, "public/reports/yingmi-ai-oap-framework-2026-08-03/data/latest.json"),
    time: (d) => d.generatedAt ?? d.meta?.generated_at,
    mechanism: "手动（其 05·用户增长 iframe 随下面的 OAP 关键历程图自动更新）",
    launchd: [],
    staleHours: 24 * 21,
  },
  {
    name: "OAP 关键历程图 live JSON（qieman-product-research-library）",
    data: path.join(root, "../qieman-product-research-library/public/pages/oap/oap-metrics-live.json"),
    time: (d) => d.generatedAt,
    mechanism: "半自动：launchd 每 2 小时（9-21 点）sync-oap-live-metrics.mjs（Redash→JSON→push）",
    launchd: ["com.clair.oap-metrics-sync"],
    staleHours: 26,
    log: path.join(HOME, "Library/Logs/oap-metrics-sync.log"),
  },
];

function launchdState(label) {
  try {
    const uid = execFileSync("id", ["-u"], { encoding: "utf8" }).trim();
    const out = execFileSync("launchctl", ["print", `gui/${uid}/${label}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const state = out.match(/state = ([^\n]+)/)?.[1]?.trim() ?? "?";
    return `${label}: ${state}`;
  } catch {
    return `${label}: 未加载`;
  }
}

function lastLogOutcome(file) {
  try {
    const lines = readFileSync(file, "utf8").trimEnd().split("\n");
    for (let i = lines.length - 1; i >= 0 && i > lines.length - 80; i--) {
      if (/^(ok|FAILED|skipped|push deferred)/.test(lines[i])) {
        const start = lines.slice(0, i).reverse().find((l) => l.startsWith("---- "));
        return `${lines[i]}${start ? `（${start.replace("---- ", "").replace(" start", "")}）` : ""}`;
      }
    }
  } catch {}
  return null;
}

let warnings = 0;
for (const d of DASHBOARDS) {
  console.log(`\n■ ${d.name}`);
  console.log(`  机制：${d.mechanism}`);
  if (!existsSync(d.data)) {
    console.log("  数据：⚠️ 文件不存在（本地 checkout 可能落后，先 git pull）");
    warnings++;
    continue;
  }
  let ts;
  try {
    ts = d.time(JSON.parse(readFileSync(d.data, "utf8")));
  } catch (e) {
    console.log(`  数据：⚠️ 解析失败 ${e.message}`);
    warnings++;
    continue;
  }
  if (!ts || !Number.isFinite(Date.parse(ts))) {
    console.log(`  数据：⚠️ 找不到时间戳字段（${ts}）`);
    warnings++;
    continue;
  }
  const ageH = (Date.now() - Date.parse(ts)) / 3600e3;
  const stale = ageH > d.staleHours;
  if (stale) warnings++;
  console.log(`  数据：${stale ? "⚠️" : "✅"} ${ts}（${ageH < 48 ? `${ageH.toFixed(1)} 小时前` : `${(ageH / 24).toFixed(1)} 天前`}${stale ? `，超过 ${d.staleHours}h 阈值` : ""}）`);
  for (const label of d.launchd) console.log(`  任务：${launchdState(label)}`);
  if (d.log) {
    const outcome = lastLogOutcome(d.log);
    if (outcome) console.log(`  上轮：${outcome}`);
  }
}

console.log(`\n${warnings ? `⚠️ ${warnings} 项需要关注` : "✅ 全部正常"}`);
process.exitCode = warnings ? 1 : 0;
