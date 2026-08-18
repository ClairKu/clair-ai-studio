#!/usr/bin/env node
/**
 * 把千问看板刷新 agent 安装成常驻 launchd 服务。
 *
 *   RELAY_AGENT_TOKEN=<与 Worker 的 AGENT_TOKEN 一致> node scripts/install-qianwen-dashboard-refresh.mjs
 *
 * 重复执行即为重装（会先卸载旧的）。卸载：
 *   launchctl unload -w ~/Library/LaunchAgents/com.clair.qianwen-dashboard-refresh.plist
 */

import { execFileSync } from "node:child_process";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const label = "com.clair.qianwen-dashboard-refresh";
const repoRoot = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, "");
const agentScript = join(repoRoot, "scripts", "qianwen-dashboard-refresh-agent.mjs");
const launchAgents = join(homedir(), "Library", "LaunchAgents");
const plistPath = join(launchAgents, `${label}.plist`);
const logPath = join(homedir(), "Library", "Logs", "clair-qianwen-refresh.log");

const token = process.env.RELAY_AGENT_TOKEN || process.argv[2] || "";
if (!token) {
  process.stderr.write("缺少 RELAY_AGENT_TOKEN（与 Worker 的 AGENT_TOKEN 一致）\n");
  process.exit(2);
}

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const plist = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${escapeXml(process.execPath)}</string>
    <string>${escapeXml(agentScript)}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${escapeXml(repoRoot)}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>RELAY_AGENT_TOKEN</key>
    <string>${escapeXml(token)}</string>
${process.env.RELAY_BASE ? `    <key>RELAY_BASE</key>\n    <string>${escapeXml(process.env.RELAY_BASE)}</string>\n` : ""}    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${escapeXml(logPath)}</string>
  <key>StandardErrorPath</key>
  <string>${escapeXml(logPath)}</string>
</dict>
</plist>
`;

await mkdir(launchAgents, { recursive: true });
await writeFile(plistPath, plist, "utf8");
// plist 里带着 agent 令牌，别让同机其他账号读到。
await chmod(plistPath, 0o600);

const launchctl = (args) => {
  try {
    execFileSync("/bin/launchctl", args, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
};

launchctl(["unload", "-w", plistPath]);
if (!launchctl(["load", "-w", plistPath])) {
  process.stderr.write(`launchctl load 失败，请手动执行：launchctl load -w ${plistPath}\n`);
  process.exit(1);
}

process.stdout.write(`已安装并启动 ${label}\n仓库：${repoRoot}\n日志：${logPath}\n`);
