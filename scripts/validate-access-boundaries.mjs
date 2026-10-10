import { readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { BASE_POLICY } from "../worker/studio-access-state/src/index.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const fail = (message) => {
  throw new Error(`访问控制边界校验失败：${message}`);
};
const ensure = (condition, message) => {
  if (!condition) fail(message);
};

const publicGate = read("public/access-gate.js");
const docsGate = read("docs/access-gate.js");
const publicConfigSource = read("public/report-access.json");
const docsConfigSource = read("docs/report-access.json");
const publicConfig = JSON.parse(publicConfigSource);
const app = read("src/app.js");
const settings = read("src/report-access-settings.js");
const injector = read("scripts/inject-site-access-gate.mjs");
const packageJson = JSON.parse(read("package.json"));
const worker = read("worker/studio-access-state/src/index.js");
const pulseHtml = read("docs/reports/product-demand-pulse/index.html");
const pulseApp = read("docs/reports/product-demand-pulse/app.js");

ensure(publicGate === docsGate, "public/docs 的共享访问门不一致");
ensure(publicConfigSource === docsConfigSource, "public/docs 的访问策略引导文件不一致");
ensure(publicConfig.stateEndpoint === "https://clair-studio-access.pages.dev/v1", "在线状态服务地址漂移");
ensure(publicConfig.defaultLocked === true, "默认策略必须保持上锁（fail closed）");
ensure(
  JSON.stringify([...publicConfig.immutableLockedEntries].sort())
    === JSON.stringify([...BASE_POLICY.immutableLockedEntries].sort()),
  "静态策略与 Cloudflare 的不可解锁成果清单不一致",
);
ensure(
  JSON.stringify([...publicConfig.unlockedEntries].sort())
    === JSON.stringify([...BASE_POLICY.unlockedEntries].sort()),
  "静态兜底策略与 Cloudflare 基线公开清单不一致",
);

const namespaceContracts = [
  "clair-ai-studio-access-v4",
  "clair-ai-studio-report-access-v4",
  "clair-ai-studio-report-credential-v1",
  "clair-ai-studio-access-admin-token-v1",
  "clair-ai-studio-access-admin-expires-v1",
  "clair-qianwen-report-unlock-v1",
  "clair-doubao-report-unlock-v1",
  "pain-off-passcode",
];
ensure(new Set(namespaceContracts).size === namespaceContracts.length, "访问会话命名空间发生碰撞");
for (const key of namespaceContracts.slice(0, 7)) {
  ensure(
    publicGate.includes(key) || app.includes(key) || settings.includes(key),
    `共享访问链路缺少会话键 ${key}`,
  );
}

ensure(pulseApp.includes('const PASSCODE_KEY = "pain-off-passcode"'), "需求脉搏未使用独立口令会话");
ensure(pulseApp.includes('"X-Pulse-Passcode"'), "需求脉搏未使用独立请求头");
ensure(!pulseApp.includes("X-Studio-Passcode"), "需求脉搏错误复用了工作台管理口令");
ensure(!pulseApp.includes("clair-ai-studio-access-v4"), "需求脉搏错误复用了工作台登录会话");
ensure(!app.includes("pain-off-passcode"), "工作台错误接管了需求脉搏的动作口令");
ensure(pulseHtml.includes('data-gate="action"'), "需求脉搏口令必须只保护重算动作");

ensure(worker.includes('const POLICY_KEY = "studio:report-access:v1"'), "Cloudflare KV 策略键漂移");
ensure(worker.includes("await env.STUDIO_ACCESS.get(POLICY_KEY, \"json\")"), "在线策略没有从 KV 读取");
ensure(worker.includes("await env.STUDIO_ACCESS.put(POLICY_KEY, JSON.stringify(policy))"), "在线策略没有持久化到 KV");
ensure(worker.includes("originAllowed(request, env)"), "管理写入缺少来源隔离");
ensure(worker.includes("authorizedSession(request, env)"), "管理写入缺少短期会话隔离");

const build = packageJson.scripts?.build || "";
const test = packageJson.scripts?.test || "";
const injectStep = "node scripts/inject-site-access-gate.mjs";
const boundaryStep = "node scripts/validate-access-boundaries.mjs";
ensure(build.includes(injectStep), "正式构建没有注入共享访问门");
ensure(build.includes(boundaryStep), "正式构建没有执行访问边界校验");
ensure(build.indexOf(boundaryStep) > build.indexOf(injectStep), "访问边界校验必须在注入完成后执行");
ensure(test.includes(boundaryStep), "测试链没有执行访问边界校验");
ensure(!build.includes("remove-report-passwords"), "正式构建不应自动移除历史加密保护");
ensure(injector.includes("immutableLockedEntries"), "注入脚本未读取不可解锁成果清单");
ensure(injector.includes('data-clair-encrypted-report="true"'), "注入脚本未标记加密成果");

const copySuffix = / \d+\.html$/i;
const htmlPaths = [];
const walkHtml = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkHtml(path);
    else if (entry.isFile() && entry.name.endsWith(".html") && !copySuffix.test(entry.name)) htmlPaths.push(path);
  }
};
walkHtml(join(root, "docs"));

const allowedInlinePasswordPages = new Set([
  "reports/product-demand-pulse/index.html",
]);
let reportPages = 0;
let workspacePages = 0;
for (const htmlPath of htmlPaths) {
  const html = readFileSync(htmlPath, "utf8");
  const outputPath = relative(join(root, "docs"), htmlPath).replaceAll("\\", "/");
  const gateCount = html.match(/data-clair-access-gate/g)?.length || 0;
  ensure(gateCount === 1, `${outputPath} 必须且只能有一个共享访问门，当前为 ${gateCount}`);

  const reportScope = outputPath.startsWith("reports/") || outputPath.startsWith("apps/");
  const expectedScope = reportScope ? "report" : "workspace";
  ensure(
    new RegExp(`data-clair-access-scope=["']${expectedScope}["']`).test(html),
    `${outputPath} 的访问作用域不是 ${expectedScope}`,
  );
  if (reportScope) reportPages += 1;
  else workspacePages += 1;

  const passwordInputs = html.match(/<input\b[^>]*type=["']password["'][^>]*>/gi) || [];
  if (allowedInlinePasswordPages.has(outputPath)) {
    ensure(passwordInputs.length === 1, `${outputPath} 的动作口令框数量异常`);
    ensure(passwordInputs[0].includes('data-gate="action"'), `${outputPath} 的口令框越过了动作边界`);
  } else {
    ensure(passwordInputs.length === 0, `${outputPath} 出现未登记的第二套页面密码机制`);
  }
}

for (const entry of publicConfig.immutableLockedEntries) {
  const html = read(`docs/${entry}index.html`);
  ensure(html.includes('data-clair-encrypted-report="true"'), `${entry} 未保持不可解锁标记`);
  ensure(html.includes("AES-GCM") && html.includes("const payload="), `${entry} 未保持密文载荷`);
  ensure(!/<input\b[^>]*type=["']password["']/i.test(html), `${entry} 出现重复密码框`);
}

console.log(
  `访问控制边界校验通过：${workspacePages} 个工作台作用域页面，${reportPages} 个成果作用域页面，`
  + `${publicConfig.immutableLockedEntries.length} 个不可解锁加密成果，1 个独立动作口令且命名空间隔离。`,
);
