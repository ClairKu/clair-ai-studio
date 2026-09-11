#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportDir = path.join(root, "public/reports/personal-ai-token-usage-audit-2026-09-10");
const data = JSON.parse(fs.readFileSync(path.join(reportDir, "audit-data.json"), "utf8"));
const html = fs.readFileSync(path.join(reportDir, "index.html"), "utf8");

const sum = (values) => values.reduce((total, value) => total + Number(value || 0), 0);
const global = data.summaries.global.total;
const byDevice = sum(Object.values(data.summaries.devices).map((item) => item.total));
const byPlatform = sum(Object.values(data.summaries.platforms).map((item) => item.total));
const dated = sum(data.daily.flatMap((row) => Object.values(row.values)));

const checks = [
  [global === byDevice, `global ${global} must equal device total ${byDevice}`],
  [global === byPlatform, `global ${global} must equal platform total ${byPlatform}`],
  [global === dated + data.summaries.undatedTotal, `global ${global} must equal dated + undated ${dated + data.summaries.undatedTotal}`],
  [data.devicePlatformMatrix.shared.cursor.total === data.summaries.devices.shared.total, "Cursor must exist once in shared bucket"],
  [!data.devicePlatformMatrix.company.cursor && !data.devicePlatformMatrix.personal.cursor, "Cursor must not be duplicated into device-local buckets"],
  [html.includes("双设备 AI Token 使用看板"), "HTML title is missing"],
  [html.includes('id="deviceChecks"') && html.includes('id="platformChecks"'), "Device/platform filters are missing"],
  [html.includes("个人电脑") && html.includes("公司电脑") && html.includes("账号共享"), "Device labels are incomplete"],
  [html.includes("Kiro") && html.includes("无日期"), "Undated Kiro boundary is missing"],
  [!html.includes("gutengyudeMacBook-Air") && !html.includes("/Users/clair"), "Private hostname or local path leaked into HTML"],
  [!/(https?:)?\/\/[^"']*(?:cdn|fonts\.googleapis)/i.test(html), "HTML contains a CDN or external font dependency"],
];

const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  failed.forEach(([, message]) => console.error(`FAIL: ${message}`));
  process.exit(1);
}

console.log(`Device token audit validation passed: ${checks.length}/${checks.length}`);
