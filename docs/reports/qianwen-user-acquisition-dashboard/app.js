const DATA_URL = "./data/latest.json";
const LOCAL_REFRESH_BASES = ["http://127.0.0.1:43123", "http://127.0.0.1:43122"];
const REFRESH_POLL_MS = 3000;
const REFRESH_TIMEOUT_MS = 45 * 60 * 1000;
const PUBLISHED_POLL_MS = 5000;
const PUBLISHED_TIMEOUT_MS = 5 * 60 * 1000;
const SCHEMA_VERSION = "qianwen-user-acquisition-v6";
const LAUNCH_AT = "2026-08-10T08:00:00+08:00";
const WINDOW_START_AT = "2026-08-03T00:00:00+08:00";
const LAUNCH_DAY = LAUNCH_AT.slice(0, 10);
const number = new Intl.NumberFormat("zh-CN");
const percent = new Intl.NumberFormat("zh-CN", { style: "percent", maximumFractionDigits: 1 });
const $ = (selector) => document.querySelector(selector);

const SERIES = {
  bound: {
    label: "累计绑定",
    field: "window_cumulative_bound",
    type: "cumulative",
  },
  new: {
    label: "累计新用户",
    field: "window_cumulative_new",
    type: "cumulative",
  },
  existing: {
    label: "累计老用户",
    field: "window_cumulative_existing",
    type: "cumulative",
  },
  daily: {
    label: "当日新增",
    field: "bound_accounts_today",
    type: "daily",
  },
};
const CUMULATIVE_KEYS = ["bound", "new", "existing"];
const SERIES_ORDER = ["bound", "new", "existing", "daily"];
const COHORT_ORDER = ["all", "new", "existing"];
const COHORT_LABELS = {
  all: "全部绑定用户",
  new: "新用户",
  existing: "老用户",
};
const PROFILE_DIMENSIONS = {
  asset_holding_status: {
    label: "当前资产状态",
    description: "使用每个可识别投资账户的最近资产记录",
    panel: "asset",
  },
  asset_bucket: {
    label: "保有规模分布",
    description: "按当前持有市值分档，使用各账户最近资产记录",
    panel: "asset",
  },
  lifetime_investment_status: {
    label: "历史投资情况",
    description: "看是否曾在且慢完成投资",
    panel: "asset",
  },
  age_bucket: {
    label: "年龄分布",
    description: "按证件出生日期推算，取查询时点年龄",
    panel: "profile",
  },
  gender: {
    label: "性别分布",
    description: "取实名信息中的性别字段",
    panel: "profile",
  },
  residence_province: {
    label: "居住地分布",
    description: "取实名/联系信息中的省级归属，仅列前若干位",
    panel: "profile",
  },
  app_usage_status: {
    label: "且慢APP使用情况",
    description: "看是否有来自且慢APP端的登录或活跃行为",
    panel: "touchpoint",
  },
  wechat_mp_status: {
    label: "微信公众号绑定",
    description: "看是否已关注并绑定且慢微信公众号",
    panel: "touchpoint",
  },
  bank_card_status: {
    label: "银行卡准备情况",
    description: "看是否已完成银行卡绑定",
    panel: "touchpoint",
  },
  risk_assessment_status: {
    label: "风险测评情况",
    description: "看是否已完成风险测评",
    panel: "touchpoint",
  },
};
const REQUIRED_PROFILE_DIMENSIONS = ["asset_holding_status", "asset_bucket", "lifetime_investment_status"];
const PROFILE_PANELS = {
  asset: "#asset-distribution",
  profile: "#profile-distribution",
  touchpoint: "#touchpoint-distribution",
};
const BEHAVIOR_METRICS = {
  funded_after_binding: {
    label: "绑定后完成入金",
    description: "绑定后发生银行卡入金/转入并到账",
  },
  first_investment_after_binding: {
    label: "绑定后首次投资",
    description: "首次投资里程碑发生在绑定后",
  },
  investment_activity_after_binding: {
    label: "绑定后发起买入",
    description: "绑定后发生受理且未取消的买入类交易",
  },
  redemption_after_binding: {
    label: "绑定后发生赎回",
    description: "绑定后发生受理且未取消的卖出类交易",
  },
  xiaogu_used_after_binding: {
    label: "绑定后有效使用AI小顾",
    description: "绑定后至少一次有效提问",
  },
};
const REQUIRED_BEHAVIOR_METRICS = ["first_investment_after_binding", "investment_activity_after_binding"];
// 金额型指标单独放在 business 段：人数类走 behavior，金额类走这里，避免两种量纲混在一张图上。
const BUSINESS_STATS = {
  holding_amount: {
    label: "当前保有规模",
    description: "所选用户在且慢的持有市值合计",
    tone: "scale",
  },
  inflow_amount: {
    label: "绑定后入金",
    description: "绑定后新增转入且慢的资金合计",
    tone: "flow",
  },
  buy_amount: {
    label: "绑定后买入",
    description: "绑定后受理且未取消的买入金额合计",
    tone: "flow",
  },
  sell_amount: {
    label: "绑定后赎回",
    description: "绑定后受理且未取消的卖出金额合计",
    tone: "flow",
  },
};
const PUBLIC_STATES = new Set(["confirmed", "suppressed", "unavailable"]);

const viewState = {
  visibleSeries: new Set(SERIES_ORDER),
  range: "full-window",
  start: "",
  end: "",
  selectedDate: "",
  hoverDate: "",
  audienceCohort: "all",
};

let currentData = null;
let currentRows = [];
let resizeTimer = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseTime(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatCutoff(value, includeYear = false) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: includeYear ? "numeric" : undefined,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDay(value) {
  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${Number(month)}月${Number(day)}日` : String(value);
}

function safeShare(part, total) {
  return total > 0 ? part / total : null;
}

function formatShare(part, total) {
  const share = safeShare(part, total);
  return share === null ? "—" : percent.format(share);
}

function nextDate(value) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function isWholeCount(value) {
  return Number.isInteger(value) && value >= 0;
}

function validateAudienceData(data) {
  const privacy = data.privacy || {};
  const minimumCell = privacy.minimum_public_cell;
  if (
    !Number.isInteger(minimumCell)
    || minimumCell < 20
    || privacy.scope !== "profile_and_behavior_only"
    || privacy.protected_sections?.join(",") !== "profile,behavior,business"
    || privacy.multi_dimension_cross_tabs_public !== false
  ) throw new Error("画像与行为隐私保护口径异常");
  if (
    data.behavior?.window_start_at !== WINDOW_START_AT
    || data.behavior?.window_end_at !== data.meta.data_cutoff
    || data.behavior?.anchor !== "first_bound_at"
  ) throw new Error("绑定后行为观察窗口异常");
  const expectedPopulation = {
    all: data.metrics.bound_accounts,
    new: data.metrics.new_accounts,
    existing: data.metrics.existing_accounts,
  };
  const assertPublicCount = (value, label) => {
    if (!isWholeCount(value) || (value > 0 && value < minimumCell)) throw new Error(`${label} 未通过小样本保护`);
  };
  const sections = [
    { key: "profile", listKey: "dimensions", allowed: PROFILE_DIMENSIONS, required: REQUIRED_PROFILE_DIMENSIONS, name: "用户画像" },
    { key: "behavior", listKey: "metrics", allowed: BEHAVIOR_METRICS, required: REQUIRED_BEHAVIOR_METRICS, name: "用户行为" },
    { key: "business", listKey: "stats", allowed: BUSINESS_STATS, required: [], name: "经营金额" },
  ];
  sections.forEach(({ key, listKey, allowed, required, name }) => {
    const section = data[key];
    if (!section || typeof section !== "object" || !section.cohorts || typeof section.cohorts !== "object") {
      throw new Error(`${name}数据缺失`);
    }
    COHORT_ORDER.forEach((cohortKey) => {
      const cohort = section.cohorts[cohortKey];
      if (!cohort || cohort.population_accounts !== expectedPopulation[cohortKey] || !Array.isArray(cohort[listKey])) {
        throw new Error(`${COHORT_LABELS[cohortKey]}${name}数据格式异常`);
      }
      // 允许只发布其中一部分口径（未接入的直接不出现），但核心口径必须齐、且不得出现白名单外的指标。
      const ids = cohort[listKey].map((item) => item?.id);
      if (new Set(ids).size !== ids.length || required.some((id) => !ids.includes(id))) {
        throw new Error(`${COHORT_LABELS[cohortKey]}${name}指标不完整`);
      }
      cohort[listKey].forEach((item) => {
        if (!item || !Object.hasOwn(allowed, item.id) || !PUBLIC_STATES.has(item.state)) {
          throw new Error(`${COHORT_LABELS[cohortKey]}存在未允许的公开指标`);
        }
        if (item.state !== "unavailable" && (!item.data_as_of || (parseTime(item.data_as_of) && parseTime(item.data_as_of) > parseTime(data.meta.data_cutoff)))) {
          throw new Error(`${allowed[item.id].label}截止时间异常`);
        }
        if (item.state !== "confirmed") {
          for (const forbidden of ["buckets", "population_accounts", "eligible_accounts", "excluded_accounts", "reached_accounts", "not_reached_accounts", "unknown_accounts", "event_count", "accounts", "amount_wan", "per_capita_wan", "median_wan"]) {
            if (Object.hasOwn(item, forbidden)) throw new Error(`${allowed[item.id].label}隐藏后仍带精确数据`);
          }
          return;
        }
        if (key === "profile") {
          if (!Array.isArray(item.buckets) || !item.buckets.length) throw new Error("资产分布缺少分组");
          let total = 0;
          item.buckets.forEach((bucket) => {
            if (!bucket || typeof bucket.id !== "string" || !bucket.id) {
              throw new Error("资产分布人数异常");
            }
            assertPublicCount(bucket.accounts, `${allowed[item.id].label}${bucket.id}`);
            total += bucket.accounts;
          });
          if (total !== cohort.population_accounts) throw new Error(`${allowed[item.id].label}无法闭合`);
        }
        if (key === "behavior") {
          [
            "population_accounts",
            "eligible_accounts",
            "excluded_accounts",
            "reached_accounts",
            "not_reached_accounts",
            "unknown_accounts",
          ].forEach((field) => {
            assertPublicCount(item[field], `${BEHAVIOR_METRICS[item.id].label}${field}`);
          });
          if (item.population_accounts !== cohort.population_accounts || item.population_accounts !== item.eligible_accounts + item.excluded_accounts) {
            throw new Error(`${BEHAVIOR_METRICS[item.id].label}总人数无法闭合`);
          }
          if (item.eligible_accounts !== item.reached_accounts + item.not_reached_accounts + item.unknown_accounts) {
            throw new Error(`${BEHAVIOR_METRICS[item.id].label}可统计人数无法闭合`);
          }
          if (item.event_count !== undefined) {
            assertPublicCount(item.event_count, `${BEHAVIOR_METRICS[item.id].label}次数`);
            if (item.event_count < item.reached_accounts) throw new Error(`${BEHAVIOR_METRICS[item.id].label}次数异常`);
          }
        }
        if (key === "business") {
          const label = BUSINESS_STATS[item.id].label;
          if (!Number.isFinite(item.amount_wan) || item.amount_wan < 0) throw new Error(`${label}金额异常`);
          assertPublicCount(item.accounts, `${label}人数`);
          if (item.accounts > cohort.population_accounts) throw new Error(`${label}人数超出总人数`);
          for (const field of ["per_capita_wan", "median_wan"]) {
            if (item[field] !== undefined && (!Number.isFinite(item[field]) || item[field] < 0)) throw new Error(`${label}人均或中位数异常`);
          }
        }
      });
    });
  });
  COHORT_ORDER.forEach((cohortKey) => {
    const populations = ["profile", "behavior", "business"].map((key) => data[key].cohorts[cohortKey].population_accounts);
    if (new Set(populations).size !== 1) {
      throw new Error(`${COHORT_LABELS[cohortKey]}画像、行为与经营人数不一致`);
    }
  });
}

function validateData(data) {
  if (!data || data.schema_version !== SCHEMA_VERSION) throw new Error("数据版本不兼容");
  const { meta = {}, metrics = {} } = data;
  if (meta.window_start_at !== WINDOW_START_AT || meta.launch_at !== LAUNCH_AT || meta.timezone !== "Asia/Shanghai") {
    throw new Error("统计窗口或服务上线时间口径异常");
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+08:00$/.test(meta.data_cutoff || "") || !parseTime(meta.data_cutoff)) {
    throw new Error("数据截止时间异常");
  }
  if (!parseTime(meta.generated_at) || parseTime(meta.data_cutoff) < parseTime(meta.window_start_at)) throw new Error("数据生成时间异常");
  const metricKeys = [
    "bound_accounts",
    "new_accounts",
    "existing_accounts",
    "missing_registration_time",
    "duplicate_bindings",
    "unmatched_accounts",
  ];
  for (const key of metricKeys) {
    if (!Number.isInteger(metrics[key]) || metrics[key] < 0) throw new Error(`指标 ${key} 无效`);
  }
  if (metrics.bound_accounts !== metrics.new_accounts + metrics.existing_accounts + metrics.missing_registration_time) {
    throw new Error("用户分类与总数无法闭合");
  }
  if (!Array.isArray(data.daily) || !data.daily.length) throw new Error("缺少每日趋势");
  const cutoffDay = meta.data_cutoff.slice(0, 10);
  let runningNew = 0;
  let runningExisting = 0;
  let runningUnclassified = 0;
  let runningBound = 0;
  let previousDate = "";
  data.daily.forEach((row, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date || "")) throw new Error("趋势日期格式异常");
    if (index === 0 && row.date !== WINDOW_START_AT.slice(0, 10)) throw new Error("趋势没有从统计窗口起始日开始");
    if (previousDate && row.date !== nextDate(previousDate)) throw new Error("趋势日期不连续");
    previousDate = row.date;
    for (const key of [
      "new_accounts_today",
      "existing_accounts_today",
      "unclassified_accounts_today",
      "bound_accounts_today",
      "cumulative_new_accounts",
      "cumulative_existing_accounts",
      "cumulative_unclassified_accounts",
      "cumulative_bound_accounts",
    ]) {
      if (!Number.isInteger(row[key]) || row[key] < 0) throw new Error(`每日趋势 ${key} 异常`);
    }
    if (typeof row.partial !== "boolean") throw new Error("每日完整性标记异常");
    const shouldBePartial = index === data.daily.length - 1;
    if (row.partial !== shouldBePartial) throw new Error("只有最新日应标记为非完整自然日");
    if (row.bound_accounts_today !== row.new_accounts_today + row.existing_accounts_today + row.unclassified_accounts_today) {
      throw new Error("每日用户分类无法闭合");
    }
    runningNew += row.new_accounts_today;
    runningExisting += row.existing_accounts_today;
    runningUnclassified += row.unclassified_accounts_today;
    runningBound += row.bound_accounts_today;
    if (
      row.cumulative_new_accounts !== runningNew
      || row.cumulative_existing_accounts !== runningExisting
      || row.cumulative_unclassified_accounts !== runningUnclassified
      || row.cumulative_bound_accounts !== runningBound
    ) throw new Error("累计趋势无法闭合");
  });
  if (data.daily.at(-1).date !== cutoffDay) throw new Error("趋势没有覆盖到数据截止日");
  if (meta.latest_day_is_partial !== true || data.daily.at(-1).partial !== true) throw new Error("最新日必须标记为非完整日");
  if (
    runningNew !== metrics.new_accounts
    || runningExisting !== metrics.existing_accounts
    || runningUnclassified !== metrics.missing_registration_time
    || runningBound !== metrics.bound_accounts
  ) throw new Error("趋势总数与关键数据不一致");
  validateAudienceData(data);
  return data;
}

async function loadPublishedData({ allowFallback = true } = {}) {
  try {
    const url = `${DATA_URL}?refresh=${Date.now()}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return validateData(await response.json());
  } catch (error) {
    if (allowFallback && window.QIANWEN_ACQUISITION_DATA) return validateData(window.QIANWEN_ACQUISITION_DATA);
    throw error;
  }
}

function setFreshness(mode, text) {
  const freshness = $("#freshness");
  freshness.classList.toggle("is-loading", mode === "loading");
  freshness.classList.toggle("is-error", mode === "error");
  freshness.querySelector("span").textContent = text;
}

function setNotice(message) {
  $("#refresh-status").textContent = message;
}

function setRefreshButtonLoading(loading) {
  const button = $("#data-refresh-button");
  button.disabled = loading;
  button.setAttribute("aria-busy", String(loading));
  button.querySelector("span").textContent = loading ? "更新中" : "更新数据";
}

const pause = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function callRefreshService(path, init = {}) {
  let response;
  let connectionError;
  for (const base of LOCAL_REFRESH_BASES) {
    try {
      response = await fetch(`${base}${path}`, {
        cache: "no-store",
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers || {}),
        },
      });
      break;
    } catch (error) {
      connectionError = error;
    }
  }
  if (!response) throw connectionError || new Error("无法连接本机更新服务");
  const body = await response.json().catch(() => ({}));
  if (!response.ok && !(response.status === 409 && body.run_id)) {
    const error = new Error(body.summary || body.error || `更新服务返回 ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function waitForRefresh(runId) {
  const deadline = Date.now() + REFRESH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await pause(REFRESH_POLL_MS);
    const state = await callRefreshService(`/status?run_id=${encodeURIComponent(runId)}`);
    if (state.status === "running") {
      setNotice(state.summary || "正在从生产数据源重新取数…");
      continue;
    }
    return state;
  }
  throw new Error("实时更新仍在后台执行，请稍后再点一次查看结果。");
}

async function waitForPublishedData(expectedCutoff, previousCutoff) {
  const deadline = Date.now() + PUBLISHED_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const data = await loadPublishedData({ allowFallback: false });
    const cutoff = data.meta.data_cutoff;
    if (
      (expectedCutoff && parseTime(cutoff) >= parseTime(expectedCutoff))
      || (!expectedCutoff && cutoff !== previousCutoff)
    ) return data;
    setNotice("新快照已生成，正在等待生产页面发布…");
    await pause(PUBLISHED_POLL_MS);
  }
  throw new Error("新快照已生成，但生产页面尚未完成发布，请稍后再试。");
}

async function refreshPublishedData() {
  const previousCutoff = currentData?.meta?.data_cutoff;
  setRefreshButtonLoading(true);
  setFreshness("loading", "正在更新数据");
  setNotice("正在启动生产数据刷新…");
  try {
    let state = await callRefreshService("/refresh", {
      method: "POST",
      headers: { "X-Qianwen-Action": "refresh-v1" },
      body: JSON.stringify({
        schema: "qianwen-user-acquisition-refresh/v1",
        published_cutoff: previousCutoff || null,
      }),
    });
    if (state.status === "running") state = await waitForRefresh(state.run_id);
    if (state.status === "blocked") throw new Error(state.summary || "生产数据刷新受阻。");
    const data = state.status === "updated"
      ? await waitForPublishedData(state.data_cutoff, previousCutoff)
      : await loadPublishedData({ allowFallback: false });
    render(data);
    const changed = previousCutoff && previousCutoff !== data.meta.data_cutoff;
    const summary = state.summary ? `${state.summary} ` : "";
    setNotice(changed
      ? `${summary}数据已更新至 ${formatCutoff(data.meta.data_cutoff)}`
      : `${summary}已是最新数据（截至 ${formatCutoff(data.meta.data_cutoff)}）`);
  } catch (error) {
    try {
      const data = await loadPublishedData({ allowFallback: false });
      if (!currentData || data.meta.data_cutoff !== currentData.meta.data_cutoff) render(data);
    } catch {
      // 保留已经通过校验的当前快照。
    }
    if (currentData) setFreshness("ready", `数据截至 ${formatCutoff(currentData.meta.data_cutoff)}`);
    else setFreshness("error", "数据读取失败");
    const serviceUnavailable = error instanceof TypeError;
    setNotice(serviceUnavailable
      ? "实时更新服务未启动；当前展示最近发布数据。"
      : `更新未完成：${error?.message || "当前数据已保留，请稍后重试。"}`);
  } finally {
    setRefreshButtonLoading(false);
  }
}

function decorateRows(rows) {
  let cumulativeNew = 0;
  let cumulativeExisting = 0;
  let cumulativeUnclassified = 0;
  let cumulativeBound = 0;
  return rows.map((row) => {
    cumulativeNew += row.new_accounts_today;
    cumulativeExisting += row.existing_accounts_today;
    cumulativeUnclassified += row.unclassified_accounts_today;
    cumulativeBound += row.bound_accounts_today;
    return {
      ...row,
      window_cumulative_new: cumulativeNew,
      window_cumulative_existing: cumulativeExisting,
      window_cumulative_unclassified: cumulativeUnclassified,
      window_cumulative_bound: cumulativeBound,
    };
  });
}

function filteredRows() {
  if (!currentData) return [];
  let rows = currentData.daily;
  if (viewState.range === "since-launch") rows = rows.filter((row) => row.date >= LAUNCH_DAY);
  if (viewState.range === "last-7") rows = rows.slice(-7);
  if (viewState.range === "custom") rows = rows.filter((row) => row.date >= viewState.start && row.date <= viewState.end);
  return decorateRows(rows);
}

function scopeLabel(rows, short = false) {
  if (viewState.range === "full-window") return short ? "全部区间" : `${formatDay(currentData.daily[0].date)}以来（含上线前灰度）`;
  if (viewState.range === "since-launch") return short ? "上线以来" : "服务上线以来";
  if (viewState.range === "last-7") return "近 7 日";
  if (!rows.length) return "自定义日期";
  return `${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)}`;
}

function rangeTotals(rows) {
  const latest = rows.at(-1);
  return latest ? {
    bound: latest.window_cumulative_bound,
    new: latest.window_cumulative_new,
    existing: latest.window_cumulative_existing,
    unclassified: latest.window_cumulative_unclassified,
  } : { bound: 0, new: 0, existing: 0, unclassified: 0 };
}

function renderKpis(rows) {
  const totals = rangeTotals(rows);
  const scope = scopeLabel(rows);
  $("#bound-total").textContent = number.format(totals.bound);
  $("#new-accounts").textContent = number.format(totals.new);
  $("#existing-accounts").textContent = number.format(totals.existing);
  $("#new-share").textContent = formatShare(totals.new, totals.bound);
  $("#existing-share").textContent = formatShare(totals.existing, totals.bound);
  $("#kpi-scope").textContent = scope;
  $("#bound-context").textContent = `${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)} · ${rows.length} 天累计`;
  const prelaunchTotal = rows.filter((row) => row.date < LAUNCH_DAY).reduce((sum, row) => sum + row.bound_accounts_today, 0);
  const prelaunchCopy = prelaunchTotal
    ? `其中 ${number.format(prelaunchTotal)} 人在 8 月 10 日 08:00 正式上线前的灰度期间完成绑定。`
    : "";
  $("#hero-lead").textContent = `截至 ${formatCutoff(currentData.meta.data_cutoff)}，${scope}绑定用户 ${number.format(totals.bound)} 人，其中新用户 ${number.format(totals.new)} 人，占 ${formatShare(totals.new, totals.bound)}。${prelaunchCopy}`;
  setFreshness("ready", `数据截至 ${formatCutoff(currentData.meta.data_cutoff)}`);
}

function niceMaximum(value) {
  if (value <= 10) return 10;
  const target = value * 1.04;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const normalized = target / magnitude;
  const rounded = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((candidate) => candidate >= normalized) || 10;
  return rounded * magnitude;
}

function chartLayout(rows) {
  const mobile = window.matchMedia("(max-width: 620px)").matches;
  const showEndLabels = !mobile && rows.length > 1;
  const width = mobile ? 430 : 1040;
  const left = mobile ? 40 : 56;
  const right = showEndLabels ? 96 : mobile ? 16 : 28;
  const top = mobile ? 32 : 36;
  const cumulativeHeight = mobile ? 176 : 244;
  const gap = mobile ? 44 : 52;
  const dailyHeight = mobile ? 78 : 106;
  const axisHeight = mobile ? 30 : 34;
  const cumulativeBase = top + cumulativeHeight;
  const dailyTop = cumulativeBase + gap;
  const dailyBase = dailyTop + dailyHeight;
  return {
    mobile,
    showEndLabels,
    width,
    height: dailyBase + axisHeight,
    left,
    right,
    top,
    plotWidth: width - left - right,
    cumulativeHeight,
    cumulativeBase,
    dailyTop,
    dailyHeight,
    dailyBase,
  };
}

function barPath(centerX, halfWidth, top, bottom, radius) {
  const height = Math.max(0, bottom - top);
  const corner = Math.min(radius, halfWidth, height);
  const startX = centerX - halfWidth;
  const endX = centerX + halfWidth;
  if (corner <= 0) return `M${startX},${bottom} L${startX},${top} L${endX},${top} L${endX},${bottom} Z`;
  return `M${startX},${bottom} L${startX},${top + corner} Q${startX},${top} ${startX + corner},${top}`
    + ` L${endX - corner},${top} Q${endX},${top} ${endX},${top + corner} L${endX},${bottom} Z`;
}

// 端点数值标签互相靠得太近时上下微推，并用引线连回端点，避免标签脱离所属折线。
function declutter(labels, minimumGap) {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  for (let index = 1; index < sorted.length; index += 1) {
    const gap = sorted[index].y - sorted[index - 1].y;
    if (gap < minimumGap) sorted[index].y = sorted[index - 1].y + minimumGap;
  }
  return sorted;
}

function chartMarkup(rows) {
  const layout = chartLayout(rows);
  const cumulativeKeys = CUMULATIVE_KEYS.filter((key) => viewState.visibleSeries.has(key));
  const dailyVisible = viewState.visibleSeries.has("daily");
  const step = layout.plotWidth / Math.max(rows.length, 1);
  const x = (index) => layout.left + step * index + step / 2;
  const cumulativeValues = cumulativeKeys.length
    ? rows.flatMap((row) => cumulativeKeys.map((key) => row[SERIES[key].field]))
    : [0];
  const cumulativeMaximum = niceMaximum(Math.max(1, ...cumulativeValues));
  const dailyMaximum = niceMaximum(Math.max(1, ...rows.map((row) => row.bound_accounts_today)));
  const yCumulative = (value) => layout.cumulativeBase - (value / cumulativeMaximum) * layout.cumulativeHeight;
  const yDaily = (value) => layout.dailyBase - (value / dailyMaximum) * layout.dailyHeight;
  const plotRight = layout.width - layout.right;

  const gridLines = (ratios, base, plotHeight, maximum) => ratios.map((ratio) => {
    const gridY = base - ratio * plotHeight;
    return `<line class="${ratio === 0 ? "chart-baseline" : "chart-grid"}" x1="${layout.left}" y1="${gridY}" x2="${plotRight}" y2="${gridY}"></line>
      <text class="chart-axis-label" x="${layout.left - 9}" y="${gridY + 4}" text-anchor="end">${number.format(Math.round(maximum * ratio))}</text>`;
  }).join("");
  const grids = (cumulativeKeys.length ? gridLines([0, 0.25, 0.5, 0.75, 1], layout.cumulativeBase, layout.cumulativeHeight, cumulativeMaximum) : "")
    + (dailyVisible ? gridLines([0, 0.5, 1], layout.dailyBase, layout.dailyHeight, dailyMaximum) : "");
  const panelTitles = `${cumulativeKeys.length ? `<text class="chart-panel-title" x="${layout.left}" y="${layout.top - 14}">累计绑定用户（人）</text>` : ""}
    ${dailyVisible ? `<text class="chart-panel-title" x="${layout.left}" y="${layout.dailyTop - 12}">每日新增绑定（人）</text>` : ""}`;

  // 上线前灰度区间：底纹 + 分界线，让 8/10 08:00 正式上线的位置一眼可辨。
  const launchIndex = rows.findIndex((row) => row.date === LAUNCH_DAY);
  let launchMarkup = "";
  if (launchIndex > 0) {
    const ruleX = layout.left + step * launchIndex;
    const shade = (top, height) => `<rect class="chart-prelaunch" x="${layout.left}" y="${top}" width="${ruleX - layout.left}" height="${height}"></rect>`;
    launchMarkup = `${cumulativeKeys.length ? shade(layout.top, layout.cumulativeHeight) : ""}
      ${dailyVisible ? shade(layout.dailyTop, layout.dailyHeight) : ""}
      <line class="chart-launch-rule" x1="${ruleX}" y1="${layout.top}" x2="${ruleX}" y2="${layout.dailyBase}"></line>
      <text class="chart-prelaunch-label" x="${(layout.left + ruleX) / 2}" y="${layout.top + 17}" text-anchor="middle">上线前灰度</text>
      <text class="chart-launch-label" x="${ruleX + 8}" y="${layout.top + 17}">8/10 08:00 正式上线</text>`;
  }

  // 累计绑定是总量线，最后画保证压在分项线之上——上线前两条线数值完全相同，否则总量线会被盖住。
  const lines = [...cumulativeKeys].sort((a, b) => (a === "bound" ? 1 : 0) - (b === "bound" ? 1 : 0)).map((key) => {
    const points = rows.map((row, index) => `${x(index)},${yCumulative(row[SERIES[key].field])}`).join(" ");
    return `<polyline class="chart-line chart-line-${key}" data-series="${key}" points="${points}"></polyline>`;
  }).join("");

  let endMarkup = "";
  if (cumulativeKeys.length && rows.length) {
    const lastIndex = rows.length - 1;
    const centerX = x(lastIndex);
    const anchors = cumulativeKeys.map((key) => ({
      key,
      y: yCumulative(rows[lastIndex][SERIES[key].field]),
      value: rows[lastIndex][SERIES[key].field],
    }));
    const dots = anchors.map((anchor) => `<circle class="chart-end-dot chart-end-${anchor.key}" cx="${centerX}" cy="${anchor.y}" r="4.5"></circle>`).join("");
    const labels = layout.showEndLabels
      ? declutter(anchors.map((anchor) => ({ ...anchor, origin: anchor.y })), 17).map((anchor) => {
        const leader = Math.abs(anchor.y - anchor.origin) > 2
          ? `<line class="chart-grid" x1="${centerX + 5}" y1="${anchor.origin}" x2="${centerX + 11}" y2="${anchor.y}"></line>`
          : "";
        return `${leader}<text class="chart-end-value" x="${centerX + 13}" y="${anchor.y + 4}">${number.format(anchor.value)}</text>`;
      }).join("")
      : "";
    endMarkup = `${dots}${labels}`;
  }

  const barHalfWidth = Math.max(1.5, Math.min(12, step * 0.3));
  const bars = dailyVisible ? rows.map((row, index) => {
    const centerX = x(index);
    const segments = [
      { value: row.new_accounts_today, className: "chart-bar-new" },
      { value: row.existing_accounts_today, className: "chart-bar-existing" },
      { value: row.unclassified_accounts_today, className: "chart-bar-unclassified" },
    ].filter((segment) => segment.value > 0);
    let stacked = 0;
    const drawn = segments.map((segment) => {
      const bottom = yDaily(stacked);
      stacked += segment.value;
      return { ...segment, bottom, top: yDaily(stacked) };
    }).filter((segment) => segment.bottom - segment.top >= 0.6);
    const shapes = drawn.map((segment, segmentIndex) => {
      const isTop = segmentIndex === drawn.length - 1;
      // 段间留 2px 背景色空隙做分隔，顶端 4px 圆角、基线端保持方角；
      // 极薄的段（如个别日期只有几个老用户）不再抠空隙，否则整段会被吃掉。
      const thickness = segment.bottom - segment.top;
      const bottom = segmentIndex && thickness > 3.5 ? segment.bottom - 2 : segment.bottom;
      return `<path class="${segment.className}" d="${barPath(centerX, barHalfWidth, segment.top, bottom, isTop ? 4 : 0)}"></path>`;
    }).join("");
    const cap = index === rows.length - 1 && row.bound_accounts_today > 0
      ? `<text class="chart-bar-cap" x="${centerX}" y="${yDaily(row.bound_accounts_today) - 12}" text-anchor="middle">+${number.format(row.bound_accounts_today)}</text>`
      : "";
    return `<g class="chart-bar-group" data-date="${row.date}">${shapes}${cap}</g>`;
  }).join("") : "";

  const showEvery = rows.length <= 10 ? 1 : Math.ceil(rows.length / (layout.mobile ? 5 : 9));
  const dateLabels = rows.map((row, index) => {
    const [month, day] = row.date.slice(5).split("-");
    const show = index === 0 || index === rows.length - 1 || index % showEvery === 0;
    return show ? `<text class="chart-axis-label" x="${x(index)}" y="${layout.dailyBase + 22}" text-anchor="middle">${Number(month)}.${Number(day)}</text>` : "";
  }).join("");

  const interactivePoints = viewState.visibleSeries.size ? rows.map((row, index) => {
    const centerX = x(index);
    const dots = cumulativeKeys.map((key) => `<circle class="chart-dot chart-end-${key}" cx="${centerX}" cy="${yCumulative(row[SERIES[key].field])}" r="4.5"></circle>`).join("")
      + (dailyVisible && row.bound_accounts_today > 0 ? `<circle class="chart-dot chart-end-bound" cx="${centerX}" cy="${yDaily(row.bound_accounts_today)}" r="3.5"></circle>` : "");
    const ariaValues = SERIES_ORDER.filter((key) => viewState.visibleSeries.has(key))
      .map((key) => `${SERIES[key].label}${key === "daily" ? "+" : ""}${number.format(row[SERIES[key].field])}人`).join("，");
    const selected = row.date === viewState.selectedDate;
    return `<g class="chart-point${selected ? " is-selected" : ""}" data-index="${index}" data-date="${row.date}" data-x="${centerX}" data-y="${layout.dailyTop - 8}" tabindex="${selected ? "0" : "-1"}" role="button" aria-pressed="${selected}" aria-label="${escapeHtml(formatDay(row.date))}，${escapeHtml(ariaValues)}">
      <rect class="chart-hit" x="${centerX - step / 2}" y="${layout.top}" width="${step}" height="${layout.dailyBase - layout.top}"></rect>
      <line class="chart-crosshair" x1="${centerX}" y1="${layout.top}" x2="${centerX}" y2="${layout.dailyBase}"></line>
      ${dots}
    </g>`;
  }).join("") : "";

  const emptyState = viewState.visibleSeries.size
    ? ""
    : `<text class="chart-empty" x="${layout.left + layout.plotWidth / 2}" y="${layout.top + layout.cumulativeHeight / 2}" text-anchor="middle">请选择至少一项数据</text>`;

  const markup = `${launchMarkup}${grids}${panelTitles}${lines}${bars}${endMarkup}${dateLabels}${interactivePoints}${emptyState}`;
  return { width: layout.width, height: layout.height, cumulativeMaximum, dailyMaximum, markup };
}

function rowLabel(row) {
  const lastDate = currentData.daily.at(-1).date;
  if (row.date === lastDate) return `${formatDay(row.date)} · 截至 ${formatTime(currentData.meta.data_cutoff)}`;
  if (row.date === LAUNCH_DAY) return `${formatDay(row.date)} · 08:00 正式上线`;
  if (row.date < LAUNCH_DAY) return `${formatDay(row.date)} · 上线前灰度`;
  return formatDay(row.date);
}

// 读数条：默认停在最新一天的累计值；hover / 键盘移动时切换到对应日期。
function renderReadout(row) {
  const isLatest = row.date === currentRows.at(-1)?.date;
  $("#readout-label").textContent = isLatest ? "最新读数" : "该日读数";
  $("#readout-date").textContent = rowLabel(row);
  SERIES_ORDER.forEach((key) => {
    const value = row[SERIES[key].field];
    $(`#value-${key}`).textContent = `${key === "daily" ? "+" : ""}${number.format(value)}`;
  });
}

function showChartTooltip(element, row) {
  const tooltip = $("#chart-tooltip");
  if (!viewState.visibleSeries.size || !row.bound_accounts_today) {
    tooltip.hidden = true;
    return;
  }
  const entries = [
    { key: "new", label: "新用户", value: row.new_accounts_today },
    { key: "existing", label: "老用户", value: row.existing_accounts_today },
    { key: "bound", label: "待识别", value: row.unclassified_accounts_today },
  ].filter((entry) => entry.value > 0).map((entry) => `<dt><i class="key-${entry.key}" aria-hidden="true"></i>${entry.label}</dt>`
    + `<dd>+${number.format(entry.value)}<em>${formatShare(entry.value, row.bound_accounts_today)}</em></dd>`).join("");
  tooltip.innerHTML = `<strong>${escapeHtml(rowLabel(row))} 新增 ${number.format(row.bound_accounts_today)} 人</strong><dl>${entries}</dl>`;
  const viewBox = $("#trend-chart").viewBox.baseVal;
  const left = Number(element.dataset.x) / viewBox.width * 100;
  tooltip.style.left = `${Math.max(13, Math.min(87, left))}%`;
  tooltip.style.top = `${Number(element.dataset.y) / viewBox.height * 100}%`;
  tooltip.hidden = false;
}

function announceSelection(row) {
  const values = SERIES_ORDER.filter((key) => viewState.visibleSeries.has(key)).map((key) => `${SERIES[key].label}${key === "daily" ? "+" : ""}${number.format(row[SERIES[key].field])}人`);
  $("#selection-announcement").textContent = values.length ? `${formatDay(row.date)}，${values.join("，")}。` : "当前未选择走势图数据。";
}

function applySelectedDate(date, { announce = true, focusPoint = false, showTooltip = false } = {}) {
  const row = currentRows.find((item) => item.date === date);
  if (!row) return;
  viewState.selectedDate = date;
  document.querySelectorAll(".chart-point").forEach((point) => {
    const selected = point.dataset.date === date;
    point.classList.toggle("is-selected", selected);
    point.tabIndex = selected ? 0 : -1;
    point.setAttribute("aria-pressed", String(selected));
    if (selected && focusPoint) point.focus();
    if (selected && showTooltip) showChartTooltip(point, row);
  });
  document.querySelectorAll("#daily-table tr").forEach((tableRow) => tableRow.classList.toggle("is-selected", tableRow.dataset.date === date));
  document.querySelectorAll(".date-button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.date === date)));
  if (!viewState.hoverDate) renderReadout(row);
  if (announce) announceSelection(row);
}

function bindChartInteractions(rows) {
  const tooltip = $("#chart-tooltip");
  const leave = () => {
    tooltip.hidden = true;
    viewState.hoverDate = "";
    const fallback = rows.find((item) => item.date === viewState.selectedDate) || rows.at(-1);
    if (fallback) renderReadout(fallback);
  };
  document.querySelectorAll(".chart-point").forEach((point) => {
    const row = rows[Number(point.dataset.index)];
    const enter = () => {
      viewState.hoverDate = row.date;
      renderReadout(row);
      showChartTooltip(point, row);
    };
    point.addEventListener("mouseenter", enter);
    point.addEventListener("focus", enter);
    point.addEventListener("mouseleave", leave);
    point.addEventListener("blur", leave);
    point.addEventListener("click", () => applySelectedDate(row.date, { showTooltip: true }));
    point.addEventListener("keydown", (event) => {
      const index = Number(point.dataset.index);
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = Math.min(rows.length - 1, index + 1);
      else if (event.key === "ArrowLeft") nextIndex = Math.max(0, index - 1);
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = rows.length - 1;
      else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        applySelectedDate(row.date, { showTooltip: true });
        return;
      } else return;
      event.preventDefault();
      applySelectedDate(rows[nextIndex].date, { focusPoint: true, showTooltip: true });
    });
  });
}

function renderChart(rows) {
  const chart = chartMarkup(rows);
  const svg = $("#trend-chart");
  svg.setAttribute("viewBox", `0 0 ${chart.width} ${chart.height}`);
  const visibleKeys = SERIES_ORDER.filter((key) => viewState.visibleSeries.has(key));
  const visibleLabels = visibleKeys.map((key) => SERIES[key].label);
  svg.dataset.visibleSeries = visibleKeys.join(",");
  svg.dataset.cumulativeMaximum = String(chart.cumulativeMaximum);
  svg.dataset.dailyMaximum = String(chart.dailyMaximum);
  svg.innerHTML = `<title id="chart-title">${escapeHtml(scopeLabel(rows, true))}用户增长走势</title>
    <desc id="chart-desc">${visibleLabels.length ? `上下两图分别显示${escapeHtml(visibleLabels.join("、"))}` : "当前未选择数据"}；图表与下方明细表按日期联动。</desc>${chart.markup}`;
  const prelaunch = rows.filter((row) => row.date < LAUNCH_DAY);
  const prelaunchNote = prelaunch.length
    ? `其中 ${formatDay(prelaunch[0].date)}—${formatDay(prelaunch.at(-1).date)} 为正式上线前的灰度绑定 ${number.format(prelaunch.reduce((sum, row) => sum + row.bound_accounts_today, 0))} 人。`
    : rows.some((row) => row.date === LAUNCH_DAY)
      ? `${formatDay(LAUNCH_DAY)}按自然日统计，含当日 08:00 正式上线前的灰度绑定。`
      : "";
  $("#chart-note").textContent = `当前范围：${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)}。${prelaunchNote}最新数据截至 ${formatCutoff(currentData.meta.data_cutoff)}，当日尚未走完。`;
  $("#chart-tooltip").hidden = true;
  viewState.hoverDate = "";
  bindChartInteractions(rows);
}

function metricCell(value, share, className, prefix = "") {
  return `<td class="metric-cell ${className}"><strong>${prefix}${number.format(value)}</strong><small>${share}</small></td>`;
}

function renderTable(rows) {
  const totals = rangeTotals(rows);
  const hasUnclassified = totals.unclassified > 0;
  const columnCount = hasUnclassified ? 4 : 3;
  $("#detail-head").innerHTML = `<tr>
      <th rowspan="2">日期</th>
      <th class="group-heading" colspan="${columnCount}">当日新增</th>
      <th class="group-heading" colspan="${columnCount}">所选范围累计</th>
    </tr>
    <tr>
      <th class="metric-bound">绑定用户</th><th class="metric-new">新用户</th><th class="metric-existing">老用户</th>${hasUnclassified ? "<th>待识别</th>" : ""}
      <th class="metric-bound">绑定用户</th><th class="metric-new">新用户</th><th class="metric-existing">老用户</th>${hasUnclassified ? "<th>待识别</th>" : ""}
    </tr>`;
  $("#daily-table").innerHTML = rows.map((row) => `<tr data-date="${row.date}" class="${row.date === viewState.selectedDate ? "is-selected" : ""}">
      <td><button class="date-button" type="button" data-date="${row.date}" aria-pressed="${row.date === viewState.selectedDate}">${escapeHtml(formatDay(row.date))}</button></td>
      ${metricCell(row.bound_accounts_today, "当日总量", "metric-bound", "+")}
      ${metricCell(row.new_accounts_today, formatShare(row.new_accounts_today, row.bound_accounts_today), "metric-new", "+")}
      ${metricCell(row.existing_accounts_today, formatShare(row.existing_accounts_today, row.bound_accounts_today), "metric-existing", "+")}
      ${hasUnclassified ? metricCell(row.unclassified_accounts_today, formatShare(row.unclassified_accounts_today, row.bound_accounts_today), "", "+") : ""}
      ${metricCell(row.window_cumulative_bound, "区间总量", "metric-bound")}
      ${metricCell(row.window_cumulative_new, formatShare(row.window_cumulative_new, row.window_cumulative_bound), "metric-new")}
      ${metricCell(row.window_cumulative_existing, formatShare(row.window_cumulative_existing, row.window_cumulative_bound), "metric-existing")}
      ${hasUnclassified ? metricCell(row.window_cumulative_unclassified, formatShare(row.window_cumulative_unclassified, row.window_cumulative_bound), "") : ""}
    </tr>`).join("");
  document.querySelectorAll(".date-button").forEach((button) => button.addEventListener("click", () => applySelectedDate(button.dataset.date, { showTooltip: true })));
  $("#detail-range").textContent = `${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)}`;
  $("#detail-count").textContent = `${rows.length} 个日期 · 增量、占比与累计`;
  $("#data-footnote").textContent = `新用户指在千问绑定时当场新注册且慢账户；老用户指绑定前账户已经存在——按每个用户自己的绑定时刻判定，与服务上线时刻无关。统计窗口自 ${formatDay(currentData.daily[0].date)} 起，按自然日归集绑定时间；${formatDay(currentData.daily.at(-1).date)}截至 ${formatTime(currentData.meta.data_cutoff)}，不是完整自然日。`;
}

const REASON_COPY = {
  minimum_group_size: "为保护较小分组，暂不展示",
  cross_cohort_inference: "为避免相减反推，仅在「全部」口径下展示",
  source_not_closed: "该分组数据暂未对齐，先不展示",
  no_authoritative_source: "权威口径待接入",
  authoritative_source_unavailable: "权威口径待接入",
  not_refreshed_this_cycle: "本次刷新未包含",
  query_in_progress: "数据查询中",
};

function publicStateCopy(item) {
  const reasonCode = typeof item === "string" ? "" : item?.reason_code;
  if (reasonCode && REASON_COPY[reasonCode]) return REASON_COPY[reasonCode];
  const state = typeof item === "string" ? item : item?.state;
  if (state === "suppressed") return REASON_COPY.minimum_group_size;
  return "数据源待确认";
}

function cohortSections(cohortKey) {
  return {
    profile: currentData?.profile?.cohorts?.[cohortKey] || null,
    behavior: currentData?.behavior?.cohorts?.[cohortKey] || null,
    business: currentData?.business?.cohorts?.[cohortKey] || null,
  };
}

function hasConfirmedAudienceMetric(cohortKey) {
  const { profile, behavior, business } = cohortSections(cohortKey);
  return Boolean(profile?.dimensions?.some((item) => item.state === "confirmed")
    || behavior?.metrics?.some((item) => item.state === "confirmed")
    || business?.stats?.some((item) => item.state === "confirmed"));
}

function syncAudienceControls() {
  const available = COHORT_ORDER.filter(hasConfirmedAudienceMetric);
  if (!available.includes(viewState.audienceCohort)) viewState.audienceCohort = available[0] || "all";
  document.querySelectorAll('input[name="audience-cohort"]').forEach((input) => {
    const enabled = available.includes(input.value);
    input.disabled = !enabled;
    input.checked = input.value === viewState.audienceCohort;
    input.parentElement.classList.toggle("is-disabled", !enabled);
  });
  return available;
}

function audiencePopulation(profile, behavior) {
  if (isWholeCount(profile?.population_accounts)) return profile.population_accounts;
  if (isWholeCount(behavior?.population_accounts)) return behavior.population_accounts;
  return null;
}

const amount0 = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });
const amount1 = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function formatAmount(wan) {
  if (!Number.isFinite(wan)) return "—";
  if (wan === 0) return "0 万元";
  if (wan >= 10000) return `${amount1.format(wan / 10000)} 亿元`;
  if (wan >= 1000) return `${amount0.format(wan)} 万元`;
  return `${amount1.format(wan)} 万元`;
}

function bucketLabel(bucket) {
  const fixedLabels = {
    has_asset: "有资产",
    has_assets: "有资产",
    no_asset: "暂无资产",
    no_assets: "暂无资产",
    with_asset: "有资产",
    without_asset: "暂无资产",
    invested: "曾投资",
    not_invested: "尚未投资",
    never_invested: "未投资",
    lt_10k: "1 万元及以下",
    "10k_100k": "1—10 万元",
    "100k_500k": "10—50 万元",
    gte_500k: "50 万元以上",
    card_bound: "已绑卡",
    card_not_bound: "尚未绑卡",
    assessed: "已完成测评",
    not_assessed: "尚未完成测评",
    lt_25: "25 岁以下",
    "25_30": "25—30 岁",
    "31_40": "31—40 岁",
    "41_50": "41—50 岁",
    "51_60": "51—60 岁",
    gt_60: "60 岁以上",
    male: "男",
    female: "女",
    app_used: "已使用APP",
    app_not_used: "未使用APP",
    mp_bound: "已绑定公众号",
    mp_not_bound: "未绑定公众号",
    other: "其他",
    suppressed_small: "其他（小分组合并）",
    unknown: "暂无法判断",
  };
  return fixedLabels[bucket.id] || bucket.label || "其他";
}

function shareWidth(part, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, part / total * 100));
}

function profileDimensionsFor(cohort, panel = null) {
  if (!cohort) return [];
  const byId = new Map(cohort.dimensions.map((item) => [item.id, item]));
  return Object.keys(PROFILE_DIMENSIONS)
    .filter((id) => !panel || PROFILE_DIMENSIONS[id].panel === panel)
    .map((id) => byId.get(id))
    .filter(Boolean);
}

function behaviorMetricsFor(cohort) {
  if (!cohort) return [];
  const byId = new Map(cohort.metrics.map((item) => [item.id, item]));
  return Object.keys(BEHAVIOR_METRICS).map((id) => byId.get(id)).filter(Boolean);
}

function businessStatsFor(cohort) {
  if (!cohort) return [];
  const byId = new Map(cohort.stats.map((item) => [item.id, item]));
  return Object.keys(BUSINESS_STATS).map((id) => byId.get(id)).filter(Boolean);
}

// 金额型指标做成数字块：金额是主角，人数与人均做辅助行，不进走势图，避免量纲混用。
function renderBusinessTiles(business, population) {
  const stats = businessStatsFor(business);
  const container = $("#business-tiles");
  if (!stats.length) {
    container.innerHTML = '<p class="audience-inline-empty">入金、规模与交易金额口径待接入</p>';
    return;
  }
  container.innerHTML = stats.map((stat) => {
    const config = BUSINESS_STATS[stat.id];
    if (stat.state !== "confirmed") {
      return `<article class="metric-tile is-${stat.state}">
        <span class="metric-tile-label">${escapeHtml(config.label)}</span>
        <strong class="metric-tile-state">${publicStateCopy(stat)}</strong>
        <small>${escapeHtml(config.description)}</small>
      </article>`;
    }
    const share = safeShare(stat.accounts, population);
    const extra = [];
    if (Number.isFinite(stat.per_capita_wan)) extra.push(`人均 ${formatAmount(stat.per_capita_wan)}`);
    if (Number.isFinite(stat.median_wan)) extra.push(`中位 ${formatAmount(stat.median_wan)}`);
    if (Number.isFinite(stat.event_count)) extra.push(`共 ${number.format(stat.event_count)} 笔`);
    return `<article class="metric-tile tone-${config.tone}">
      <span class="metric-tile-label">${escapeHtml(config.label)}</span>
      <strong class="metric-tile-value">${escapeHtml(formatAmount(stat.amount_wan))}</strong>
      <p class="metric-tile-people">涉及 ${number.format(stat.accounts)} 人<em>${share === null ? "—" : percent.format(share)}</em></p>
      <small>${escapeHtml(extra.length ? extra.join(" · ") : config.description)}</small>
    </article>`;
  }).join("");
}

function distributionMarkup(dimension, population) {
  const config = PROFILE_DIMENSIONS[dimension.id];
  if (dimension.state !== "confirmed") {
    return `<section class="asset-group is-${dimension.state}">
      <header><div><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div></header>
      <p class="audience-state-copy">${publicStateCopy(dimension)}</p>
    </section>`;
  }
  const bars = dimension.buckets.map((bucket) => {
    const share = safeShare(bucket.accounts, population);
    const label = bucketLabel(bucket);
    const muted = bucket.id === "unknown" || bucket.id === "suppressed_small" ? " is-muted" : "";
    return `<div class="asset-row">
      <div class="asset-row-copy"><span>${escapeHtml(label)}</span><strong>${number.format(bucket.accounts)}<small> 人</small></strong></div>
      <div class="audience-progress${muted}" role="img" aria-label="${escapeHtml(label)} ${number.format(bucket.accounts)} 人，占 ${share === null ? "未知" : percent.format(share)}">
        <i style="--share: ${shareWidth(bucket.accounts, population)}%"></i>
      </div>
      <em>${share === null ? "—" : percent.format(share)}</em>
    </div>`;
  }).join("");
  const note = dimension.note ? `<p class="asset-group-note">${escapeHtml(dimension.note)}</p>` : "";
  return `<section class="asset-group">
    <header><div><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div></header>
    <div class="asset-rows">${bars}</div>${note}
  </section>`;
}

function renderDistributionPanels(profile, population) {
  Object.entries(PROFILE_PANELS).forEach(([panel, selector]) => {
    const dimensions = profileDimensionsFor(profile, panel);
    $(selector).innerHTML = dimensions.length
      ? dimensions.map((dimension) => distributionMarkup(dimension, population)).join("")
      : '<p class="audience-inline-empty">数据源待确认</p>';
  });
}

function renderBehaviorBars(behavior) {
  const metrics = behaviorMetricsFor(behavior);
  if (!metrics.length) {
    $("#behavior-bars").innerHTML = '<p class="audience-inline-empty">数据源待确认</p>';
    return;
  }
  $("#behavior-bars").innerHTML = metrics.map((metric) => {
    const config = BEHAVIOR_METRICS[metric.id];
    if (metric.state !== "confirmed") {
      return `<article class="behavior-row is-${metric.state}">
        <div class="behavior-copy"><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div>
        <strong class="behavior-state">${publicStateCopy(metric)}</strong>
      </article>`;
    }
    const share = safeShare(metric.reached_accounts, metric.eligible_accounts);
    const eventCopy = metric.event_count === undefined ? "" : ` · 共 ${number.format(metric.event_count)} 笔`;
    return `<article class="behavior-row">
      <div class="behavior-copy"><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div>
      <div class="behavior-value"><strong>${number.format(metric.reached_accounts)}<small> 人</small></strong><em>${share === null ? "—" : percent.format(share)}</em></div>
      <div class="audience-progress behavior-progress" role="img" aria-label="${escapeHtml(config.label)} ${number.format(metric.reached_accounts)} 人，占可统计用户 ${share === null ? "未知" : percent.format(share)}"><i style="--share: ${shareWidth(metric.reached_accounts, metric.eligible_accounts)}%"></i></div>
      <p class="behavior-base">可统计 ${number.format(metric.eligible_accounts)} 人${eventCopy}</p>
    </article>`;
  }).join("");
}

function confirmedBehaviorNote(metric) {
  const notes = [`可统计 ${number.format(metric.eligible_accounts)} 人`];
  if (metric.not_reached_accounts) notes.push(`${number.format(metric.not_reached_accounts)} 人尚未发生`);
  if (metric.unknown_accounts) notes.push(`${number.format(metric.unknown_accounts)} 人暂无法判断`);
  if (metric.excluded_accounts) notes.push(`${number.format(metric.excluded_accounts)} 人不在本次统计范围`);
  if (metric.event_count !== undefined) notes.push(`共 ${number.format(metric.event_count)} 笔`);
  return notes.join("；");
}

function renderAudienceTable(profile, behavior, business, population) {
  const rows = [];
  businessStatsFor(business).forEach((stat) => {
    const config = BUSINESS_STATS[stat.id];
    rows.push({
      type: "经营金额",
      label: config.label,
      state: stat.state,
      reasonCode: stat.reason_code,
      value: stat.state === "confirmed" ? formatAmount(stat.amount_wan) : null,
      accounts: stat.state === "confirmed" ? stat.accounts : null,
      share: stat.state === "confirmed" ? safeShare(stat.accounts, population) : null,
      note: stat.state === "confirmed"
        ? [config.description, Number.isFinite(stat.per_capita_wan) ? `人均 ${formatAmount(stat.per_capita_wan)}` : ""].filter(Boolean).join("；")
        : config.description,
    });
  });
  profileDimensionsFor(profile).forEach((dimension) => {
    const config = PROFILE_DIMENSIONS[dimension.id];
    if (dimension.state !== "confirmed") {
      rows.push({ type: config.label, label: config.label, state: dimension.state, reasonCode: dimension.reason_code, note: config.description });
      return;
    }
    dimension.buckets.forEach((bucket) => rows.push({
      type: config.label,
      label: bucketLabel(bucket),
      state: "confirmed",
      accounts: bucket.accounts,
      share: safeShare(bucket.accounts, population),
      note: config.description,
    }));
  });
  behaviorMetricsFor(behavior).forEach((metric) => {
    const config = BEHAVIOR_METRICS[metric.id];
    rows.push({
      type: "绑定后行为",
      label: config.label,
      state: metric.state,
      reasonCode: metric.reason_code,
      accounts: metric.state === "confirmed" ? metric.reached_accounts : null,
      share: metric.state === "confirmed" ? safeShare(metric.reached_accounts, metric.eligible_accounts) : null,
      note: metric.state === "confirmed" ? confirmedBehaviorNote(metric) : config.description,
    });
  });
  if (!rows.length) {
    $("#audience-table-body").innerHTML = '<tr><td class="audience-table-empty" colspan="5">数据源待确认</td></tr>';
    return;
  }
  $("#audience-table-body").innerHTML = rows.map((row) => {
    const stateCopy = row.state === "confirmed" ? "" : publicStateCopy({ state: row.state, reason_code: row.reasonCode });
    const figure = row.state !== "confirmed"
      ? escapeHtml(stateCopy)
      : row.value
        ? `${escapeHtml(row.value)}<small>${number.format(row.accounts)} 人</small>`
        : number.format(row.accounts);
    return `<tr class="${row.state === "confirmed" ? "" : `is-${row.state}`}">
      <td data-label="类别">${escapeHtml(row.type)}</td>
      <td data-label="指标"><strong>${escapeHtml(row.label)}</strong></td>
      <td data-label="${row.value ? "金额" : "人数"}" class="audience-number-cell">${figure}</td>
      <td data-label="占比" class="audience-share-cell">${row.state === "confirmed" && row.share !== null ? percent.format(row.share) : "—"}</td>
      <td data-label="说明" class="audience-note-cell">${escapeHtml(row.note)}</td>
    </tr>`;
  }).join("");
}

function renderAudience({ announce = false } = {}) {
  const available = syncAudienceControls();
  const cohortKey = viewState.audienceCohort;
  const { profile, behavior, business } = cohortSections(cohortKey);
  const population = audiencePopulation(profile, behavior);
  const label = COHORT_LABELS[cohortKey];
  $("#audience-cohort-label").textContent = label;
  $("#audience-population").textContent = population === null ? "—" : number.format(population);
  const confirmed = (list, key, id) => list?.[key]?.find((item) => item.id === id && item.state === "confirmed");
  const holding = confirmed(business, "stats", "holding_amount");
  const inflow = confirmed(business, "stats", "inflow_amount");
  const asset = confirmed(profile, "dimensions", "asset_holding_status");
  const activity = confirmed(behavior, "metrics", "investment_activity_after_binding");
  const assetCount = asset?.buckets?.find((bucket) => bucket.id === "has_assets")?.accounts;
  const insight = [];
  if (holding) insight.push(`当前保有规模 ${formatAmount(holding.amount_wan)}`);
  if (inflow) insight.push(`绑定后入金 ${formatAmount(inflow.amount_wan)}（${number.format(inflow.accounts)} 人）`);
  if (isWholeCount(assetCount)) insight.push(`可识别有资产 ${number.format(assetCount)} 人（${formatShare(assetCount, population)}）`);
  if (isWholeCount(activity?.reached_accounts)) insight.push(`绑定后发起买入 ${number.format(activity.reached_accounts)} 人`);
  $("#audience-summary-copy").textContent = available.length && insight.length ? `${insight.join("；")}。` : "数据源待确认";
  renderBusinessTiles(business, population);
  renderDistributionPanels(profile, population);
  renderBehaviorBars(behavior);
  renderAudienceTable(profile, behavior, business, population);
  $("#audience-detail-context").textContent = population === null ? label : `${label} · ${number.format(population)} 人`;
  $("#audience-footnote").textContent = `规模与画像取查询时点各账户最近记录；入金、交易与绑定后行为按各自绑定时间起算至 ${formatCutoff(currentData.meta.data_cutoff)}。各指标独立统计，不代表先后顺序；人数少于 ${currentData.privacy.minimum_public_cell} 的分组已合并或隐藏；若某项只在「全部」口径下公开，是为了避免用全部减去其中一类反推出被隐藏的小分组。`;
  if (announce) $("#audience-announcement").textContent = `已切换至${label}，共 ${population === null ? "未知" : number.format(population)} 人。`;
}

function syncControls() {
  document.querySelectorAll('input[name="series"]').forEach((input) => { input.checked = viewState.visibleSeries.has(input.value); });
  document.querySelectorAll('input[name="range"]').forEach((input) => { input.checked = input.value === viewState.range; });
  $("#custom-range").hidden = viewState.range !== "custom";
}

function renderView({ announce = false } = {}) {
  if (!currentData) return;
  const rows = filteredRows();
  if (!rows.length) return;
  currentRows = rows;
  if (!rows.some((row) => row.date === viewState.selectedDate)) viewState.selectedDate = rows.at(-1).date;
  syncControls();
  renderKpis(rows);
  renderChart(rows);
  renderTable(rows);
  renderAudience();
  applySelectedDate(viewState.selectedDate, { announce });
}

function render(data) {
  currentData = validateData(data);
  const firstDate = currentData.daily[0].date;
  const lastDate = currentData.daily.at(-1).date;
  const startInput = $("#range-start");
  const endInput = $("#range-end");
  startInput.min = firstDate;
  startInput.max = lastDate;
  endInput.min = firstDate;
  endInput.max = lastDate;
  if (!viewState.start || viewState.start < firstDate || viewState.start > lastDate) viewState.start = firstDate;
  if (!viewState.end || viewState.end < firstDate || viewState.end > lastDate) viewState.end = lastDate;
  startInput.value = viewState.start;
  endInput.value = viewState.end;
  $("#range-error").textContent = "";
  document.documentElement.dataset.dataMode = "published";
  renderView();
}

function bindInteractions() {
  $("#data-refresh-button").addEventListener("click", refreshPublishedData);
  document.querySelectorAll('input[name="series"]').forEach((input) => input.addEventListener("change", () => {
    if (input.checked) viewState.visibleSeries.add(input.value);
    else viewState.visibleSeries.delete(input.value);
    renderChart(currentRows);
    applySelectedDate(viewState.selectedDate, { announce: false });
    const visibleCount = viewState.visibleSeries.size;
    $("#selection-announcement").textContent = `${input.checked ? "已显示" : "已隐藏"}${SERIES[input.value].label}，当前显示 ${visibleCount} 项数据。`;
  }));
  document.querySelectorAll('input[name="range"]').forEach((input) => input.addEventListener("change", () => {
    viewState.range = input.value;
    $("#range-error").textContent = "";
    renderView({ announce: true });
  }));
  document.querySelectorAll('input[name="audience-cohort"]').forEach((input) => input.addEventListener("change", () => {
    if (input.disabled) return;
    viewState.audienceCohort = input.value;
    renderAudience({ announce: true });
  }));
  $("#custom-range").addEventListener("submit", (event) => {
    event.preventDefault();
    const start = $("#range-start").value;
    const end = $("#range-end").value;
    if (!start || !end || start > end) {
      $("#range-error").textContent = "开始日期不能晚于结束日期。";
      return;
    }
    viewState.start = start;
    viewState.end = end;
    $("#range-error").textContent = "";
    renderView({ announce: true });
  });
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => renderView(), 140);
  });
}

async function init() {
  bindInteractions();
  setFreshness("loading", "正在读取数据");
  try {
    render(await loadPublishedData());
    setNotice("");
  } catch {
    setFreshness("error", "数据读取失败");
    setNotice("数据读取失败，请稍后重新打开页面。");
  }
}

init();
