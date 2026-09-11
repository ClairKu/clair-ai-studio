#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";

const home = os.homedir();
const timezone = "Asia/Shanghai";
const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayOf(timestamp) {
  const date = new Date(typeof timestamp === "number" ? timestamp : String(timestamp));
  return Number.isNaN(date.getTime()) ? null : dayFormat.format(date);
}

function blank() {
  return { total: 0, newContent: 0, reusedContent: 0, modelGenerated: 0 };
}

function add(target, usage) {
  const input = Number(usage.input_tokens ?? usage.prompt_tokens ?? usage.inputTokens ?? 0);
  const cached = Number(
    usage.cached_input_tokens ??
      usage.prompt_cache_hit_tokens ??
      usage.cachedTokens ??
      usage.inputTokensDetails?.[0]?.cached_tokens ??
      usage.prompt_tokens_details?.cached_tokens ??
      0,
  );
  const output = Number(usage.output_tokens ?? usage.completion_tokens ?? usage.outputTokens ?? 0);
  target.total += input + output;
  target.newContent += Math.max(0, input - cached);
  target.reusedContent += Math.max(0, cached);
  target.modelGenerated += Math.max(0, output);
}

function addToPlatform(platform, day, usage) {
  add(platform.summary, usage);
  if (!day) return;
  platform.daily[day] ??= blank();
  add(platform.daily[day], usage);
}

async function walk(root, suffix) {
  const found = [];
  if (!fs.existsSync(root)) return found;
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of await fs.promises.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith(suffix)) found.push(full);
    }
  }
  return found;
}

async function scanCodex() {
  const platform = { summary: blank(), daily: {}, eventCount: 0, files: 0 };
  const roots = [path.join(home, ".codex/sessions"), path.join(home, ".codex/archived_sessions")];
  const files = (await Promise.all(roots.map((root) => walk(root, ".jsonl")))).flat();
  platform.files = files.length;
  if (!files.length) return platform;

  await new Promise((resolve, reject) => {
    const child = spawn("rg", [
      "--json",
      "--no-messages",
      "-e",
      '"type":"event_msg".*"type":"token_count"',
      ...files,
    ]);
    const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    lines.on("line", (line) => {
      try {
        const match = JSON.parse(line);
        if (match.type !== "match") return;
        const event = JSON.parse(match.data.lines.text);
        const usage = event?.payload?.info?.last_token_usage;
        if (!usage) return;
        addToPlatform(platform, dayOf(event.timestamp), usage);
        platform.eventCount += 1;
      } catch {
        platform.parseErrors = (platform.parseErrors ?? 0) + 1;
      }
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || code === 1) resolve();
      else reject(new Error(`rg failed with code ${code}: ${stderr}`));
    });
  });
  return platform;
}

async function scanJsonlFiles(files, onRow) {
  for (const file of files) {
    const input = fs.createReadStream(file, { encoding: "utf8" });
    const lines = readline.createInterface({ input, crlfDelay: Infinity });
    for await (const line of lines) {
      if (!line) continue;
      try {
        await onRow(JSON.parse(line), file);
      } catch {
        // Private content and malformed trailing writes are intentionally ignored.
      }
    }
  }
}

async function scanWorkBuddy() {
  const platform = { summary: blank(), daily: {}, eventCount: 0, duplicateCount: 0, files: 0 };
  const files = await walk(path.join(home, ".workbuddy/projects"), ".jsonl");
  platform.files = files.length;
  const seen = new Set();
  await scanJsonlFiles(files, (row) => {
    const provider = row?.providerData;
    const usage = provider?.rawUsage;
    if (!usage) return;
    const key = provider.messageId ?? `${provider.traceId ?? ""}:${row.timestamp}:${JSON.stringify(usage)}`;
    if (seen.has(key)) {
      platform.duplicateCount += 1;
      return;
    }
    seen.add(key);
    addToPlatform(platform, dayOf(row.timestamp), usage);
    platform.eventCount += 1;
  });
  return platform;
}

async function scanClaude() {
  const platform = { summary: blank(), daily: {}, eventCount: 0, duplicateCount: 0, files: 0 };
  const files = await walk(path.join(home, ".claude/projects"), ".jsonl");
  platform.files = files.length;
  const seen = new Set();
  await scanJsonlFiles(files, (row) => {
    const usage = row?.message?.usage;
    if (!usage) return;
    const key = row?.message?.id ?? `${row.timestamp}:${JSON.stringify(usage)}`;
    if (seen.has(key)) {
      platform.duplicateCount += 1;
      return;
    }
    seen.add(key);
    addToPlatform(platform, dayOf(row.timestamp), usage);
    platform.eventCount += 1;
  });
  return platform;
}

async function scanKiro() {
  const file = path.join(
    home,
    "Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent/dev_data/tokens_generated.jsonl",
  );
  const platform = { summary: blank(), daily: {}, eventCount: 0, files: 0, datePrecision: "missing" };
  if (!fs.existsSync(file)) return platform;
  platform.files = 1;
  const stats = await fs.promises.stat(file);
  platform.visibleWindow = {
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
  };
  await scanJsonlFiles([file], (row) => {
    const input = Number(row.promptTokens ?? 0);
    const output = Number(row.generatedTokens ?? 0);
    add(platform.summary, { input_tokens: input, output_tokens: output, cached_input_tokens: 0 });
    platform.eventCount += 1;
  });
  return platform;
}

const startedAt = new Date();
const [codex, workbuddy, claude, kiro] = await Promise.all([
  scanCodex(),
  scanWorkBuddy(),
  scanClaude(),
  scanKiro(),
]);

const datedDays = [...new Set([
  ...Object.keys(codex.daily),
  ...Object.keys(workbuddy.daily),
  ...Object.keys(claude.daily),
])].sort();

const result = {
  schemaVersion: 1,
  device: {
    key: "personal-macbook-air",
    label: "个人电脑 · MacBook Air",
    class: "personal",
    hostname: os.hostname(),
    architecture: os.arch(),
  },
  timezone,
  scanStartedAt: startedAt.toISOString(),
  generatedAt: new Date().toISOString(),
  observedFrom: datedDays[0] ?? null,
  through: datedDays.at(-1) ?? dayOf(Date.now()),
  platforms: { codex, workbuddy, claude, kiro },
  limitations: [
    "Cursor official usage is account-level and cannot be attributed to a device; it must not be added once per computer.",
    "Kiro exposes a local token total without event timestamps, so it is included only in device totals, not daily charts.",
    "Installed ChatGPT, Claude Desktop, Trae, and other clients do not expose reliable local token telemetry and are not estimated.",
    "Local retention may be incomplete; missing dates mean unknown, not zero usage.",
  ],
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
