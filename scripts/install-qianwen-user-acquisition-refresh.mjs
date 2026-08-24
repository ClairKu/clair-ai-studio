#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { access, chmod, copyFile, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const label = "com.clair.qianwen-user-acquisition-refresh";
const sourceRepo = fileURLToPath(new URL("../", import.meta.url));
const findPersistentRepoAnchor = (path) => {
  try {
    const commonGitDir = execFileSync("/usr/bin/git", [
      "-C", path,
      "rev-parse", "--path-format=absolute", "--git-common-dir",
    ], { encoding: "utf8" }).trim();
    return resolve(commonGitDir, "..");
  } catch {
    return path;
  }
};
const findOntologyBin = async (repo) => {
  const candidates = [
    join(dirname(repo), ".claude", "skills", "ontology", "ontology"),
    join(repo, ".claude", "skills", "ontology", "ontology"),
    join(homedir(), ".claude", "skills", "ontology", "ontology"),
  ];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next supported installation location.
    }
  }
  return "";
};
const repo = resolve(process.argv[2] || findPersistentRepoAnchor(sourceRepo));
const sourceServer = join(sourceRepo, "scripts", "qianwen-user-acquisition-refresh-server.mjs");
const sourceSchema = join(sourceRepo, "scripts", "qianwen-user-acquisition-refresh-output.schema.json");
const findNodeBin = async () => {
  for (const candidate of ["/opt/homebrew/bin/node", "/usr/local/bin/node", process.execPath]) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next persistent Node.js installation.
    }
  }
  return process.execPath;
};
const node = await findNodeBin();
const launchAgents = join(homedir(), "Library", "LaunchAgents");
const logs = join(homedir(), "Library", "Logs", "Clair AI Studio", "qianwen-user-acquisition");
const runtime = join(homedir(), "Library", "Application Support", "Clair AI Studio", "qianwen-user-acquisition", "runtime");
const server = join(runtime, "qianwen-user-acquisition-refresh-server.mjs");
const schema = join(runtime, "qianwen-user-acquisition-refresh-output.schema.json");
const plist = join(launchAgents, `${label}.plist`);
const ontologyBin = await findOntologyBin(repo);
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
    <key>QIANWEN_REPO</key><string>${escapeXml(repo)}</string>
    <key>QIANWEN_REFRESH_ALLOWED_ORIGINS</key><string>https://clairku.github.io</string>
    <key>QIANWEN_ONTOLOGY_BIN</key><string>${escapeXml(ontologyBin)}</string>
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
try {
  execFileSync("/bin/launchctl", ["bootstrap", `gui/${uid}`, plist], { stdio: "ignore" });
} catch {
  // Some sandboxed hosts may write the LaunchAgent but cannot bootstrap it in the current session.
  const child = spawn(node, [server], {
    detached: true,
    env: {
      ...process.env,
      QIANWEN_REPO: repo,
      QIANWEN_REFRESH_ALLOWED_ORIGINS: "https://clairku.github.io",
      QIANWEN_ONTOLOGY_BIN: ontologyBin,
    },
    stdio: "ignore",
  });
  child.unref();
  console.warn("当前会话无法载入 LaunchAgent，已直接启动服务；下次登录会由系统自动载入。");
}
console.log(`已安装千问看板实时更新服务：${label}`);
if (!ontologyBin) console.warn("尚未找到盈米本体 CLI；点击更新时会保留现有数据并报告阻塞原因。");
