#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { chmod, copyFile, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const label = "com.clair.product-demand-pulse-refresh";
const sourceRepo = fileURLToPath(new URL("../", import.meta.url));
const repo = resolve(process.argv[2] || sourceRepo);
const sourceServer = join(sourceRepo, "scripts", "product-demand-pulse-refresh-server.mjs");
const sourceSchema = join(sourceRepo, "scripts", "product-demand-pulse-refresh-output.schema.json");
const node = process.execPath;
const launchAgents = join(homedir(), "Library", "LaunchAgents");
const logs = join(homedir(), "Library", "Logs", "Clair AI Studio", "product-demand-pulse");
const runtime = join(homedir(), "Library", "Application Support", "Clair AI Studio", "product-demand-pulse", "runtime");
const server = join(runtime, "product-demand-pulse-refresh-server.mjs");
const schema = join(runtime, "product-demand-pulse-refresh-output.schema.json");
const plist = join(launchAgents, `${label}.plist`);
const uid = process.getuid();
const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

await Promise.all([mkdir(launchAgents, { recursive: true }), mkdir(logs, { recursive: true }), mkdir(runtime, { recursive: true })]);
await Promise.all([copyFile(sourceServer, server), copyFile(sourceSchema, schema)]);
await writeFile(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${escapeXml(node)}</string>
    <string>${escapeXml(server)}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PAIN_OFF_REPO</key><string>${escapeXml(repo)}</string>
    <key>PAIN_OFF_ALLOWED_ORIGINS</key><string>https://clairku.github.io</string>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ProcessType</key><string>Background</string>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>${escapeXml(join(logs, "service.log"))}</string>
  <key>StandardErrorPath</key><string>${escapeXml(join(logs, "service-error.log"))}</string>
</dict>
</plist>
`);
await chmod(plist, 0o644);

try {
  execFileSync("/bin/launchctl", ["bootout", `gui/${uid}`, plist], { stdio: "ignore" });
} catch {
  // The service may not be loaded yet.
}
execFileSync("/bin/launchctl", ["bootstrap", `gui/${uid}`, plist]);
console.log(`已安装本机战报刷新服务：${label}`);
