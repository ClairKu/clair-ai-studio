import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dataPath = join(root, "public/reports/product-demand-pulse/data/latest.json");
const fallbackPath = join(root, "public/reports/product-demand-pulse/data/fallback-data.js");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const fail = (message) => { throw new Error(`需求战报数据校验失败：${message}`); };
const allowedStatuses = new Set(["submitted", "building", "merged", "released", "impact_confirmed", "unknown"]);
const allowedDisplayNames = new Set(["嘉鸿", "家亮", "腾玉", "春燕", "刘晨", "金星", "佳殊"]);

if (!data.meta?.cutoff) fail("meta.cutoff 缺失");
if (!Array.isArray(data.records)) fail("records 必须是数组");
if (!Array.isArray(data.people)) fail("people 必须是数组");
if (!Array.isArray(data.boundaries)) fail("boundaries 必须是数组");
if (!data.meta?.coverage || !Number.isInteger(data.meta.coverage.active_members)) fail("meta.coverage 缺失");
if (data.meta.coverage.active_members !== data.people.length) fail("团队在岗人数与 people 数量不一致");
if (data.meta.coverage.checked_members !== data.people.filter((person) => person.checked).length) fail("团队核验人数不一致");

const personIds = new Set();
for (const person of data.people) {
  if (!/^P\d{2}$/.test(person.id || "")) fail(`人员代号不合规：${person.id || "空"}`);
  if (personIds.has(person.id)) fail(`人员代号重复：${person.id}`);
  if (!allowedDisplayNames.has(person.display_name)) fail(`人员展示名不在产品团队名单：${person.id}`);
  if (!Number.isInteger(person.total) || person.total < 0) fail(`人员累计数异常：${person.id}`);
  if (!Number.isInteger(person.landed) || person.landed < 0) fail(`人员落地数异常：${person.id}`);
  personIds.add(person.id);
}

const recordIds = new Set();
for (const record of data.records) {
  if (!/^R\d+$/.test(record.id || "")) fail(`记录代号不合规：${record.id || "空"}`);
  if (recordIds.has(record.id)) fail(`记录代号重复：${record.id}`);
  if (!personIds.has(record.person_id)) fail(`记录人员不存在：${record.id}`);
  if (!allowedStatuses.has(record.status)) fail(`未知状态：${record.id} / ${record.status}`);
  if (record.person_display !== data.people.find((person) => person.id === record.person_id)?.display_name) {
    fail(`记录人员代号不一致：${record.id}`);
  }
  recordIds.add(record.id);
}

for (const person of data.people) {
  const total = data.records.filter((record) => record.person_id === person.id && record.unique !== false).length;
  const landed = data.records.filter((record) => record.person_id === person.id && ["released", "impact_confirmed"].includes(record.status)).length;
  if (person.total !== total) fail(`${person.id} 累计数应为 ${total}，实际 ${person.total}`);
  if (person.landed !== landed) fail(`${person.id} 落地数应为 ${landed}，实际 ${person.landed}`);
}

const forbiddenKeys = /(^|_)(submitter|username|real_name|source_id|source_url|internal_url|mr_url)($|_)/i;
const forbiddenContent = /(yingmi-inc\.com|frontnode\.net|pageId=|merge_requests|\bMR\s*!?\d+|@[a-z][a-z0-9_-]{2,})/i;
const inspect = (value, path = "root") => {
  if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).forEach(([key, item]) => {
      if (forbiddenKeys.test(key)) fail(`公开数据含敏感字段 ${path}.${key}`);
      inspect(item, `${path}.${key}`);
    });
  }
  if (typeof value === "string" && forbiddenContent.test(value)) fail(`公开数据含内部标识 ${path}`);
};
inspect(data);

if (process.argv.includes("--write-fallback")) {
  writeFileSync(fallbackPath, `window.DEMAND_PULSE_DATA = ${JSON.stringify(data, null, 2)};\n`);
}

console.log(`需求战报数据通过：${data.records.length} 条记录，${data.people.length} 位产品同学全部核验。`);
