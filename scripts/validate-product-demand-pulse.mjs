import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dataPath = join(root, "public/reports/product-demand-pulse/data/latest.json");
const fallbackPath = join(root, "public/reports/product-demand-pulse/data/fallback-data.js");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const fail = (message) => { throw new Error(`需求战报数据校验失败：${message}`); };
const allowedStatuses = new Set(["submitted", "building", "merged", "released", "impact_confirmed", "unknown"]);
const allowedDisplayNames = new Set(["嘉鸿", "家亮", "春燕", "刘晨", "金星", "刘佳", "嘉烨"]);
const allowedCategories = new Set(["user_request", "important", "surprise", "urgent_bug"]);
const allowedPriorities = new Set(["P0", "P1", "P2"]);

if (!data.meta?.cutoff) fail("meta.cutoff 缺失");
if (data.meta?.update_rule_version !== "delta-first-v1") fail("增量更新规则版本异常");
if (!Array.isArray(data.records)) fail("records 必须是数组");
if (!Array.isArray(data.people)) fail("people 必须是数组");
if (data.people.length !== allowedDisplayNames.size) fail("PM 范围应为 7 人");
if (!data.value_definition?.early_delivery_days || !data.value_definition?.backlog_unlocked_count) fail("价值指标定义缺失");

const personIds = new Set();
const personNames = new Set();
for (const person of data.people) {
  if (!/^P\d{2}$/.test(person.id || "")) fail(`人员代号不合规：${person.id || "空"}`);
  if (personIds.has(person.id)) fail(`人员代号重复：${person.id}`);
  if (!allowedDisplayNames.has(person.display_name)) fail(`人员展示名不在当前 PM 范围：${person.id}`);
  if (personNames.has(person.display_name)) fail(`人员展示名重复：${person.display_name}`);
  personIds.add(person.id);
  personNames.add(person.display_name);
}

for (const displayName of allowedDisplayNames) {
  if (!personNames.has(displayName)) fail(`缺少 PM：${displayName}`);
}

const recordIds = new Set();
for (const record of data.records) {
  if (!/^R\d+$/.test(record.id || "")) fail(`记录代号不合规：${record.id || "空"}`);
  if (recordIds.has(record.id)) fail(`记录代号重复：${record.id}`);
  if (!personIds.has(record.person_id)) fail(`记录人员不存在：${record.id}`);
  if (!allowedStatuses.has(record.status)) fail(`未知状态：${record.id} / ${record.status}`);
  if (!allowedCategories.has(record.category)) fail(`未知需求类型：${record.id} / ${record.category}`);
  if (!allowedPriorities.has(record.priority)) fail(`未知优先级：${record.id} / ${record.priority}`);
  if (!record.public_title || !record.pain_category || !record.public_outcome) fail(`公开信息不完整：${record.id}`);
  if (record.person_display !== data.people.find((person) => person.id === record.person_id)?.display_name) fail(`记录人员代号不一致：${record.id}`);
  if (record.baseline_date && !/^\d{4}-\d{2}-\d{2}$/.test(record.baseline_date)) fail(`计划日期格式异常：${record.id}`);
  if (record.released_at && !/^\d{4}-\d{2}-\d{2}$/.test(record.released_at)) fail(`上线日期格式异常：${record.id}`);
  if (record.released_at && !["released", "impact_confirmed"].includes(record.status)) fail(`未上线记录不应有上线日期：${record.id}`);
  recordIds.add(record.id);
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

const released = data.records.filter((record) => ["released", "impact_confirmed"].includes(record.status)).length;
console.log(`需求战报数据通过：${data.records.length} 条已提交，${released} 条已上线，${data.people.length} 位 PM。`);
