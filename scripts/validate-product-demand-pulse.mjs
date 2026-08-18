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

// v1 = 人工登记的战报；v2 = 内网 agent 从 GitLab 算出来的快照（含链路追溯）。
const isV2 = data.schema_version === "product-demand-pulse/v2";

if (!data.meta?.cutoff) fail("meta.cutoff 缺失");
if (!Array.isArray(data.records)) fail("records 必须是数组");
if (!Array.isArray(data.people)) fail("people 必须是数组");
if (data.people.length !== allowedDisplayNames.size) fail("PM 范围应为 7 人");

if (isV2) {
  if (!data.meta.contract_version) fail("meta.contract_version 缺失");
  if (!data.summary || typeof data.summary.submitted !== "number") fail("summary 缺失或格式异常");
  if (!Array.isArray(data.demands)) fail("demands 必须是数组");
  if (!data.criteria?.submitted || !data.criteria?.released) fail("口径说明缺失，公开看板必须自带口径");
} else {
  if (data.meta?.update_rule_version !== "delta-first-v1") fail("增量更新规则版本异常");
  if (!data.value_definition?.early_delivery_days || !data.value_definition?.backlog_unlocked_count) fail("价值指标定义缺失");
}

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
  if ("demand_key" in record) fail(`记录不应带 demand_key（含仓库与分支名，只能留在本机）：${record.id}`);
  recordIds.add(record.id);
}

/*
 * 链路追溯的链接是唯一被允许出现在公开数据里的内部地址，而且要满足三个条件：
 *   1. meta.link_exposure 明确写成 "public"（默认 internal_only 时一条链接都不许有）
 *   2. 只能出现在 demands[].links 里，形状必须是 MR / Jira 单的规范地址
 *   3. 任何情况下都不带 MR 标题——标题才是真正会夹带内部信息的部分
 * 其余字段照旧走全量敏感词扫描。
 */
const MR_URL = /^https:\/\/git\.frontnode\.net\/[\w.\-/]+\/-\/merge_requests\/\d+$/;
const TICKET_URL = /^https:\/\/jira\.yingmi-inc\.com\/browse\/[A-Z][A-Z0-9]*-\d+$/;
const linkExposure = data.meta?.link_exposure || "internal_only";
if (!["public", "internal_only"].includes(linkExposure)) fail(`meta.link_exposure 取值非法：${linkExposure}`);

const scrubbed = JSON.parse(JSON.stringify(data));
for (const [index, demand] of (scrubbed.demands || []).entries()) {
  const links = demand.links;
  if (!links) continue;
  const where = `demands[${index}]`;

  const hasAnyLink = Boolean(
    links.merge_requests?.length || links.demand_tickets?.length || links.release_tickets?.length || links.release_mr_url,
  );
  if (linkExposure !== "public" && hasAnyLink) {
    fail(`${where} 带了链接，但 meta.link_exposure 不是 public——要公开链接就把它显式写成 public`);
  }

  for (const mr of links.merge_requests || []) {
    if (!MR_URL.test(mr.url || "")) fail(`${where} 的 MR 地址不合规：${mr.url}`);
    if ("title" in mr) fail(`${where} 的 MR 带了标题，公开快照不允许（标题只能留在本机 detail.json）`);
  }
  if (links.release_mr_url && !MR_URL.test(links.release_mr_url)) fail(`${where} 的上线 MR 地址不合规`);
  for (const ticket of [...(links.demand_tickets || []), ...(links.release_tickets || [])]) {
    if (!TICKET_URL.test(ticket.url || "")) fail(`${where} 的单据地址不合规：${ticket.url}`);
  }

  delete demand.links;
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
inspect(scrubbed);

if (process.argv.includes("--write-fallback")) {
  writeFileSync(fallbackPath, `window.DEMAND_PULSE_DATA = ${JSON.stringify(data, null, 2)};\n`);
}

if (isV2) {
  const linked = (data.demands || []).filter((demand) => demand.links?.merge_requests?.length).length;
  console.log(
    `需求战报数据通过（${data.meta.contract_version}）：${data.summary.submitted} 个已提交，` +
      `${data.summary.released} 个已上线，${data.people.length} 位 PM，${linked} 个需求可追溯（链接暴露：${linkExposure}）。`,
  );
} else {
  const released = data.records.filter((record) => ["released", "impact_confirmed"].includes(record.status)).length;
  console.log(`需求战报数据通过：${data.records.length} 条已提交，${released} 条已上线，${data.people.length} 位 PM。`);
}
