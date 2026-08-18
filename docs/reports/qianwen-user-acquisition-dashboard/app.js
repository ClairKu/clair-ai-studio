const DATA_URL = "./data/latest.json";
// 盈米本体是内网服务，公网页面查不到它。更新走中继：页面把口令交给中继，中继派任务给
// 内网侧的刷新服务，查完再把快照回传。口令只在中继校验，页面不保存也不缓存。
const RELAY_BASE = "https://clair-refresh-relay.clairku.workers.dev";
const DASHBOARD_ID = "qianwen-user-acquisition";
const LOCAL_DATA_KEY = "clair-qianwen-acquisition-latest-v5";
const SCHEMA_VERSION = "qianwen-user-acquisition-v5";
const LAUNCH_AT = "2026-08-10T08:00:00+08:00";
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
  },
  asset_bucket: {
    label: "资产规模分布",
    description: "使用每个可识别投资账户的最近资产记录分组",
  },
  lifetime_investment_status: {
    label: "历史投资情况",
    description: "看是否曾在且慢完成投资",
  },
  bank_card_status: {
    label: "银行卡准备情况",
    description: "看是否已完成银行卡绑定",
  },
  risk_assessment_status: {
    label: "风险测评情况",
    description: "看是否已完成风险测评",
  },
};
const BEHAVIOR_METRICS = {
  first_investment_after_binding: {
    label: "绑定后首次投资",
    description: "首次投资里程碑发生在绑定后",
  },
  investment_activity_after_binding: {
    label: "绑定后发起投资",
    description: "绑定后发生受理且未取消的买入类交易",
  },
  xiaogu_used_after_binding: {
    label: "绑定后有效使用AI小顾",
    description: "绑定后至少一次有效提问",
  },
  funded_after_binding: {
    label: "绑定后完成入金",
    description: "权威外部资金入账口径待接入",
  },
  qieman_app_used_after_binding: {
    label: "绑定后使用且慢APP",
    description: "且慢APP有效使用口径待接入",
  },
};
const PUBLIC_STATES = new Set(["confirmed", "suppressed", "unavailable"]);

const viewState = {
  visibleSeries: new Set(SERIES_ORDER),
  range: "since-launch",
  start: "",
  end: "",
  selectedDate: "",
  audienceCohort: "all",
};

let currentData = null;
let currentRows = [];
let toastTimer = null;
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
    || privacy.protected_sections?.join(",") !== "profile,behavior"
    || privacy.multi_dimension_cross_tabs_public !== false
  ) throw new Error("画像与行为隐私保护口径异常");
  if (
    data.behavior?.window_start_at !== LAUNCH_AT
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
    { key: "profile", listKey: "dimensions", allowed: PROFILE_DIMENSIONS },
    { key: "behavior", listKey: "metrics", allowed: BEHAVIOR_METRICS },
  ];
  sections.forEach(({ key, listKey, allowed }) => {
    const section = data[key];
    if (!section || typeof section !== "object" || !section.cohorts || typeof section.cohorts !== "object") {
      throw new Error(`${key === "profile" ? "用户画像" : "用户行为"}数据缺失`);
    }
    COHORT_ORDER.forEach((cohortKey) => {
      const cohort = section.cohorts[cohortKey];
      if (!cohort || cohort.population_accounts !== expectedPopulation[cohortKey] || !Array.isArray(cohort[listKey])) {
        throw new Error(`${COHORT_LABELS[cohortKey]}数据格式异常`);
      }
      const ids = cohort[listKey].map((item) => item?.id);
      const expectedIds = Object.keys(allowed);
      if (ids.length !== expectedIds.length || new Set(ids).size !== ids.length || expectedIds.some((id) => !ids.includes(id))) {
        throw new Error(`${COHORT_LABELS[cohortKey]}指标不完整`);
      }
      cohort[listKey].forEach((item) => {
        if (!item || !Object.hasOwn(allowed, item.id) || !PUBLIC_STATES.has(item.state)) {
          throw new Error(`${COHORT_LABELS[cohortKey]}存在未允许的公开指标`);
        }
        if (item.state !== "unavailable" && (!item.data_as_of || (parseTime(item.data_as_of) && parseTime(item.data_as_of) > parseTime(data.meta.data_cutoff)))) {
          throw new Error(`${allowed[item.id].label}截止时间异常`);
        }
        if (item.state !== "confirmed") {
          for (const forbidden of ["buckets", "population_accounts", "eligible_accounts", "excluded_accounts", "reached_accounts", "not_reached_accounts", "unknown_accounts", "event_count"]) {
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
      });
    });
  });
  COHORT_ORDER.forEach((cohortKey) => {
    const profilePopulation = data.profile.cohorts[cohortKey].population_accounts;
    const behaviorPopulation = data.behavior.cohorts[cohortKey].population_accounts;
    if (profilePopulation !== behaviorPopulation) {
      throw new Error(`${COHORT_LABELS[cohortKey]}画像与行为人数不一致`);
    }
  });
}

function validateData(data) {
  if (!data || data.schema_version !== SCHEMA_VERSION) throw new Error("数据版本不兼容");
  const { meta = {}, metrics = {} } = data;
  if (meta.window_start_at !== LAUNCH_AT || meta.launch_at !== LAUNCH_AT || meta.timezone !== "Asia/Shanghai") {
    throw new Error("服务上线时间口径异常");
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+08:00$/.test(meta.data_cutoff || "") || !parseTime(meta.data_cutoff)) {
    throw new Error("数据截止时间异常");
  }
  if (!parseTime(meta.generated_at) || parseTime(meta.data_cutoff) < parseTime(meta.launch_at)) throw new Error("数据生成时间异常");
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
    if (index === 0 && row.date !== LAUNCH_AT.slice(0, 10)) throw new Error("趋势没有从服务上线日开始");
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
    const shouldBePartial = index === 0 || index === data.daily.length - 1;
    if (row.partial !== shouldBePartial) throw new Error("首日或最新日完整性标记异常");
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 1800) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadPublishedData(fresh = false) {
  try {
    const response = await fetch(`${DATA_URL}${fresh ? `?v=${Date.now()}` : ""}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return validateData(await response.json());
  } catch (error) {
    if (window.QIANWEN_ACQUISITION_DATA) return validateData(window.QIANWEN_ACQUISITION_DATA);
    throw error;
  }
}

function loadSavedLocalData() {
  try {
    return validateData(JSON.parse(localStorage.getItem(LOCAL_DATA_KEY) || "null"));
  } catch {
    return null;
  }
}

function saveLocalData(data) {
  try { localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data)); } catch { /* optional cache */ }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

function setFreshness(mode, text) {
  const freshness = $("#freshness");
  freshness.classList.toggle("is-loading", mode === "loading");
  freshness.classList.toggle("is-error", mode === "error");
  freshness.querySelector("span").textContent = text;
}

function setRefreshStatus(message, progressUrl = "") {
  const status = $("#refresh-status");
  status.textContent = message;
  if (progressUrl) {
    try {
      const url = new URL(progressUrl);
      if (url.protocol === "https:" && url.hostname === "ontology.yingmi-inc.com") {
        status.append(" · ");
        const link = document.createElement("a");
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "查看查询进度";
        status.append(link);
      }
    } catch { /* ignore invalid progress URLs */ }
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
  if (viewState.range === "last-7") rows = rows.slice(-7);
  if (viewState.range === "custom") rows = rows.filter((row) => row.date >= viewState.start && row.date <= viewState.end);
  return decorateRows(rows);
}

function scopeLabel(rows, short = false) {
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
  $("#bound-context").textContent = `${rows.length} 个日期累计`;
  $("#hero-lead").textContent = `截至 ${formatCutoff(currentData.meta.data_cutoff)}，${scope}绑定用户 ${number.format(totals.bound)} 人，其中新用户 ${number.format(totals.new)} 人，占 ${formatShare(totals.new, totals.bound)}。`;
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

function chartMarkup(rows) {
  const mobile = window.matchMedia("(max-width: 620px)").matches;
  const width = mobile ? 430 : 1040;
  const height = mobile ? 380 : 440;
  const margin = mobile
    ? { top: 48, right: 46, bottom: 54, left: 46 }
    : { top: 52, right: 66, bottom: 60, left: 66 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const leftMaximum = niceMaximum(Math.max(...rows.map((row) => row.window_cumulative_bound), 1));
  const rightMaximum = niceMaximum(Math.max(...rows.map((row) => row.bound_accounts_today), 1));
  const baseline = margin.top + plotHeight;
  const step = plotWidth / Math.max(rows.length, 1);
  const x = (index) => margin.left + step * index + step / 2;
  const yLeft = (value) => baseline - (value / leftMaximum) * plotHeight;
  const yRight = (value) => baseline - (value / rightMaximum) * plotHeight;
  const cumulativeVisible = ["bound", "new", "existing"].some((key) => viewState.visibleSeries.has(key));
  const dailyVisible = viewState.visibleSeries.has("daily");
  const grids = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const gridY = baseline - ratio * plotHeight;
    return `<line class="chart-grid" x1="${margin.left}" y1="${gridY}" x2="${width - margin.right}" y2="${gridY}"></line>
      ${cumulativeVisible ? `<text class="chart-axis-label chart-axis-left" x="${margin.left - 10}" y="${gridY + 4}" text-anchor="end">${number.format(Math.round(leftMaximum * ratio))}</text>` : ""}
      ${dailyVisible ? `<text class="chart-axis-label chart-axis-right" x="${width - margin.right + 10}" y="${gridY + 4}" text-anchor="start">${number.format(Math.round(rightMaximum * ratio))}</text>` : ""}`;
  }).join("");
  const axisTitles = `${cumulativeVisible ? `<text class="chart-axis-title" x="${margin.left}" y="20">累计用户（人）</text>` : ""}
    ${dailyVisible ? `<text class="chart-axis-title" x="${width - margin.right}" y="20" text-anchor="end">每日新增（人）</text>` : ""}`;
  const linePoints = (values) => values.map((value, index) => `${x(index)},${yLeft(value)}`).join(" ");
  const areaPath = (upper, lower) => {
    if (!upper.length) return "";
    const top = upper.map((value, index) => `${index ? "L" : "M"}${x(index)},${yLeft(value)}`).join(" ");
    const bottom = lower.map((value, index) => [value, index]).reverse().map(([value, index]) => `L${x(index)},${yLeft(value)}`).join(" ");
    return `${top} ${bottom} Z`;
  };
  const zeros = rows.map(() => 0);
  const newValues = rows.map((row) => row.window_cumulative_new);
  const existingValues = rows.map((row) => row.window_cumulative_existing);
  const unknownValues = rows.map((row) => row.window_cumulative_unclassified);
  const boundValues = rows.map((row) => row.window_cumulative_bound);
  let stackTop = zeros;
  let cohortMarkup = "";
  if (viewState.visibleSeries.has("new")) {
    const nextTop = stackTop.map((value, index) => value + newValues[index]);
    cohortMarkup += `<path class="chart-area-new" data-series="new" d="${areaPath(nextTop, stackTop)}"></path>
      <polyline class="chart-series-line chart-new-line" data-series="new" points="${linePoints(nextTop)}"></polyline>`;
    stackTop = nextTop;
  }
  if (viewState.visibleSeries.has("existing")) {
    const nextTop = stackTop.map((value, index) => value + existingValues[index]);
    cohortMarkup += `<path class="chart-area-existing" data-series="existing" d="${areaPath(nextTop, stackTop)}"></path>
      <polyline class="chart-series-line chart-existing-line" data-series="existing" points="${linePoints(existingValues)}"></polyline>`;
    stackTop = nextTop;
  }
  if ((viewState.visibleSeries.has("new") || viewState.visibleSeries.has("existing")) && unknownValues.some(Boolean)) {
    const nextTop = stackTop.map((value, index) => value + unknownValues[index]);
    cohortMarkup += `<path class="chart-area-unclassified" data-series="unclassified" d="${areaPath(nextTop, stackTop)}"></path>`;
    stackTop = nextTop;
  }
  const barWidth = Math.max(2, Math.min(mobile ? 22 : 34, step * 0.5));
  const bars = dailyVisible ? rows.map((row, index) => {
    const barY = yRight(row.bound_accounts_today);
    const selected = row.date === viewState.selectedDate;
    return `<rect class="chart-bar${selected ? " is-selected" : ""}" data-series="daily" data-date="${row.date}" x="${x(index) - barWidth / 2}" y="${barY}" width="${barWidth}" height="${Math.max(0, baseline - barY)}"></rect>`;
  }).join("") : "";
  const boundLine = viewState.visibleSeries.has("bound")
    ? `<polyline class="chart-series-line chart-bound-line" data-series="bound" points="${linePoints(boundValues)}"></polyline>`
    : "";
  const showEvery = rows.length <= 10 ? 1 : Math.ceil(rows.length / (mobile ? 5 : 9));
  const selectedDate = viewState.selectedDate;
  const dateLabels = rows.map((row, index) => {
    const [month, day] = row.date.slice(5).split("-");
    const showDate = index === 0 || index === rows.length - 1 || index % showEvery === 0;
    return showDate ? `<text class="chart-axis-label" x="${x(index)}" y="${height - 20}" text-anchor="middle">${Number(month)}.${Number(day)}</text>` : "";
  }).join("");
  const interactivePoints = viewState.visibleSeries.size ? rows.map((row, index) => {
    const centerX = x(index);
    const visibleStackValue = (viewState.visibleSeries.has("new") ? row.window_cumulative_new : 0)
      + (viewState.visibleSeries.has("existing") ? row.window_cumulative_existing : 0);
    const centerY = viewState.visibleSeries.has("bound")
      ? yLeft(row.window_cumulative_bound)
      : cumulativeVisible
        ? yLeft(visibleStackValue)
        : yRight(row.bound_accounts_today);
    const selected = row.date === selectedDate;
    const ariaValues = SERIES_ORDER.filter((key) => viewState.visibleSeries.has(key)).map((key) => `${SERIES[key].label}${key === "daily" ? "+" : ""}${number.format(row[SERIES[key].field])}人`).join("，");
    return `<g class="chart-point${selected ? " is-selected" : ""}" data-index="${index}" data-date="${row.date}" data-x="${centerX}" data-y="${centerY}" tabindex="${selected ? "0" : "-1"}" role="button" aria-pressed="${selected}" aria-label="${escapeHtml(formatDay(row.date))}，${escapeHtml(ariaValues)}">
      <rect class="chart-hit" x="${centerX - step / 2}" y="${margin.top}" width="${step}" height="${plotHeight}"></rect>
      <line class="chart-hover-line" x1="${centerX}" y1="${margin.top}" x2="${centerX}" y2="${baseline}"></line>
      ${viewState.visibleSeries.has("new") ? `<circle class="chart-series-dot" data-series="new" cx="${centerX}" cy="${yLeft(row.window_cumulative_new)}" r="4" stroke="#36d1ad"></circle>` : ""}
      ${viewState.visibleSeries.has("existing") ? `<circle class="chart-series-dot" data-series="existing" cx="${centerX}" cy="${yLeft(row.window_cumulative_existing)}" r="4" stroke="#ac9bdd"></circle>` : ""}
      ${viewState.visibleSeries.has("bound") ? `<circle class="chart-series-dot" data-series="bound" cx="${centerX}" cy="${yLeft(row.window_cumulative_bound)}" r="5" stroke="#b7a8ff"></circle>` : ""}
      ${dailyVisible ? `<circle class="chart-series-dot" data-series="daily" cx="${centerX}" cy="${yRight(row.bound_accounts_today)}" r="4" stroke="#e66f61"></circle>` : ""}
    </g>`;
  }).join("") : "";
  const firstLabel = rows[0]?.date === LAUNCH_AT.slice(0, 10)
    ? `<text class="chart-launch-label" x="${x(0)}" y="${margin.top - 12}" text-anchor="middle">首日 08:00 起</text>`
    : "";
  const emptyState = viewState.visibleSeries.size
    ? ""
    : `<text class="chart-empty" x="${margin.left + plotWidth / 2}" y="${margin.top + plotHeight / 2}" text-anchor="middle">请选择至少一项数据</text>`;
  const markup = `<defs><clipPath id="chart-clip"><rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}"></rect></clipPath></defs>
    ${axisTitles}${grids}<g clip-path="url(#chart-clip)">${cohortMarkup}${bars}${boundLine}</g>${dateLabels}${interactivePoints}${firstLabel}${emptyState}`;
  return { width, height, leftMaximum, rightMaximum, markup };
}

function selectedRowLabel(row) {
  const firstDate = currentData.daily[0].date;
  const lastDate = currentData.daily.at(-1).date;
  if (row.date === firstDate && row.date === lastDate) return `${formatDay(row.date)} · 08:00—${formatTime(currentData.meta.data_cutoff)}`;
  if (row.date === firstDate) return `${formatDay(row.date)} · 08:00 起`;
  if (row.date === lastDate) return `${formatDay(row.date)} · 截至 ${formatTime(currentData.meta.data_cutoff)}`;
  return formatDay(row.date);
}

function showChartTooltip(element, row) {
  const tooltip = $("#chart-tooltip");
  const visibleKeys = SERIES_ORDER.filter((key) => viewState.visibleSeries.has(key));
  if (!visibleKeys.length) {
    tooltip.hidden = true;
    return;
  }
  const entries = visibleKeys.map((key) => {
    const value = row[SERIES[key].field];
    const className = key === "new" ? "tooltip-new" : key === "existing" ? "tooltip-existing" : key === "daily" ? "tooltip-daily" : "";
    return `<dt>${escapeHtml(SERIES[key].label)}</dt><dd class="${className}">${key === "daily" ? "+" : ""}${number.format(value)}</dd>`;
  }).join("");
  const dailyBreakdown = viewState.visibleSeries.has("daily")
    ? `<small>当日：新用户 +${number.format(row.new_accounts_today)}（${formatShare(row.new_accounts_today, row.bound_accounts_today)}） · 老用户 +${number.format(row.existing_accounts_today)}（${formatShare(row.existing_accounts_today, row.bound_accounts_today)}）</small>`
    : "";
  tooltip.innerHTML = `<strong>${escapeHtml(selectedRowLabel(row))}</strong><dl>${entries}</dl>${dailyBreakdown}`;
  const viewBox = $("#trend-chart").viewBox.baseVal;
  const left = Number(element.dataset.x) / viewBox.width * 100;
  tooltip.style.left = `${Math.max(12, Math.min(88, left))}%`;
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
  document.querySelectorAll(".chart-bar").forEach((bar) => bar.classList.toggle("is-selected", bar.dataset.date === date));
  document.querySelectorAll("#daily-table tr").forEach((tableRow) => tableRow.classList.toggle("is-selected", tableRow.dataset.date === date));
  document.querySelectorAll(".date-button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.date === date)));
  if (announce) announceSelection(row);
}

function bindChartInteractions(rows) {
  const tooltip = $("#chart-tooltip");
  document.querySelectorAll(".chart-point").forEach((point) => {
    const row = rows[Number(point.dataset.index)];
    point.addEventListener("mouseenter", () => showChartTooltip(point, row));
    point.addEventListener("focus", () => showChartTooltip(point, row));
    point.addEventListener("mouseleave", () => { tooltip.hidden = true; });
    point.addEventListener("blur", () => { tooltip.hidden = true; });
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
  svg.dataset.leftMaximum = String(chart.leftMaximum);
  svg.dataset.rightMaximum = String(chart.rightMaximum);
  svg.innerHTML = `<title id="chart-title">${escapeHtml(scopeLabel(rows))}用户增长走势</title>
    <desc id="chart-desc">${visibleLabels.length ? `当前同图显示${escapeHtml(visibleLabels.join("、"))}` : "当前未选择数据"}；图表与下方明细表按日期联动。</desc>${chart.markup}`;
  $("#chart-note").textContent = `当前范围：${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)}。服务上线首日从 08:00 起统计，最新数据截至 ${formatTime(currentData.meta.data_cutoff)}。`;
  $("#chart-tooltip").hidden = true;
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
  $("#data-footnote").textContent = `新用户指 8 月 10 日 08:00 及之后注册且慢；老用户指此前已注册且慢。8 月 10 日首日从 08:00 起统计；${formatDay(currentData.daily.at(-1).date)}截至 ${formatTime(currentData.meta.data_cutoff)}，首日与最新日均不是完整自然日。`;
}

function publicStateCopy(state) {
  if (state === "suppressed") return "为保护较小分组，暂不展示";
  return "数据源待确认";
}

function cohortSections(cohortKey) {
  return {
    profile: currentData?.profile?.cohorts?.[cohortKey] || null,
    behavior: currentData?.behavior?.cohorts?.[cohortKey] || null,
  };
}

function hasConfirmedAudienceMetric(cohortKey) {
  const { profile, behavior } = cohortSections(cohortKey);
  const hasProfile = profile?.dimensions?.some((item) => item.state === "confirmed");
  const hasBehavior = behavior?.metrics?.some((item) => item.state === "confirmed");
  return Boolean(hasProfile || hasBehavior);
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
    unknown: "暂无法判断",
  };
  return fixedLabels[bucket.id] || bucket.label || "其他";
}

function shareWidth(part, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, part / total * 100));
}

function profileDimensionsFor(cohort) {
  if (!cohort) return [];
  const byId = new Map(cohort.dimensions.map((item) => [item.id, item]));
  return Object.keys(PROFILE_DIMENSIONS).map((id) => byId.get(id)).filter(Boolean);
}

function behaviorMetricsFor(cohort) {
  if (!cohort) return [];
  const byId = new Map(cohort.metrics.map((item) => [item.id, item]));
  return Object.keys(BEHAVIOR_METRICS).map((id) => byId.get(id)).filter(Boolean);
}

function renderAssetDistribution(profile, population) {
  const dimensions = profileDimensionsFor(profile);
  if (!dimensions.length) {
    $("#asset-distribution").innerHTML = '<p class="audience-inline-empty">数据源待确认</p>';
    return;
  }
  $("#asset-distribution").innerHTML = dimensions.map((dimension) => {
    const config = PROFILE_DIMENSIONS[dimension.id];
    if (dimension.state !== "confirmed") {
      return `<section class="asset-group is-${dimension.state}">
        <header><div><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div></header>
        <p class="audience-state-copy">${publicStateCopy(dimension.state)}</p>
      </section>`;
    }
    const bars = dimension.buckets.map((bucket) => {
      const share = safeShare(bucket.accounts, population);
      return `<div class="asset-row">
        <div class="asset-row-copy"><span>${escapeHtml(bucketLabel(bucket))}</span><strong>${number.format(bucket.accounts)}<small> 人</small></strong></div>
        <div class="audience-progress" role="img" aria-label="${escapeHtml(bucketLabel(bucket))} ${number.format(bucket.accounts)} 人，占 ${share === null ? "未知" : percent.format(share)}">
          <i style="--share: ${shareWidth(bucket.accounts, population)}%"></i>
        </div>
        <em>${share === null ? "—" : percent.format(share)}</em>
      </div>`;
    }).join("");
    return `<section class="asset-group">
      <header><div><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div></header>
      <div class="asset-rows">${bars}</div>
    </section>`;
  }).join("");
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
        <strong class="behavior-state">${publicStateCopy(metric.state)}</strong>
      </article>`;
    }
    const share = safeShare(metric.reached_accounts, metric.eligible_accounts);
    const eventCopy = metric.event_count === undefined ? "" : ` · 共 ${number.format(metric.event_count)} 次`;
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
  if (metric.event_count !== undefined) notes.push(`共 ${number.format(metric.event_count)} 次`);
  return notes.join("；");
}

function renderAudienceTable(profile, behavior, population) {
  const rows = [];
  profileDimensionsFor(profile).forEach((dimension) => {
    const config = PROFILE_DIMENSIONS[dimension.id];
    if (dimension.state !== "confirmed") {
      rows.push({ type: "用户画像", label: config.label, state: dimension.state, note: config.description });
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
    const stateCopy = row.state === "confirmed" ? "" : publicStateCopy(row.state);
    return `<tr class="${row.state === "confirmed" ? "" : `is-${row.state}`}">
      <td data-label="类别">${escapeHtml(row.type)}</td>
      <td data-label="指标"><strong>${escapeHtml(row.label)}</strong></td>
      <td data-label="人数" class="audience-number-cell">${row.state === "confirmed" ? number.format(row.accounts) : escapeHtml(stateCopy)}</td>
      <td data-label="占比" class="audience-share-cell">${row.state === "confirmed" && row.share !== null ? percent.format(row.share) : "—"}</td>
      <td data-label="说明" class="audience-note-cell">${escapeHtml(row.note)}</td>
    </tr>`;
  }).join("");
}

function renderAudience({ announce = false } = {}) {
  const available = syncAudienceControls();
  const cohortKey = viewState.audienceCohort;
  const { profile, behavior } = cohortSections(cohortKey);
  const population = audiencePopulation(profile, behavior);
  const label = COHORT_LABELS[cohortKey];
  $("#audience-cohort-label").textContent = label;
  $("#audience-population").textContent = population === null ? "—" : number.format(population);
  const asset = profile?.dimensions?.find((item) => item.id === "asset_holding_status" && item.state === "confirmed");
  const invested = profile?.dimensions?.find((item) => item.id === "lifetime_investment_status" && item.state === "confirmed");
  const activity = behavior?.metrics?.find((item) => item.id === "investment_activity_after_binding" && item.state === "confirmed");
  const assetCount = asset?.buckets?.find((bucket) => bucket.id === "has_assets")?.accounts;
  const investedCount = invested?.buckets?.find((bucket) => bucket.id === "invested")?.accounts;
  const insight = [];
  if (isWholeCount(assetCount)) insight.push(`可识别有资产 ${number.format(assetCount)} 人（${formatShare(assetCount, population)}）`);
  if (isWholeCount(investedCount)) insight.push(`有历史投资记录 ${number.format(investedCount)} 人`);
  if (isWholeCount(activity?.reached_accounts)) insight.push(`绑定后发起投资 ${number.format(activity.reached_accounts)} 人`);
  $("#audience-summary-copy").textContent = available.length && insight.length ? `${insight.join("；")}。` : "数据源待确认";
  renderAssetDistribution(profile, population);
  renderBehaviorBars(behavior);
  renderAudienceTable(profile, behavior, population);
  $("#audience-detail-context").textContent = population === null ? label : `${label} · ${number.format(population)} 人`;
  $("#audience-footnote").textContent = `资产截至查询时点使用各账户最近记录；绑定后行为按绑定时间至 ${formatCutoff(currentData.meta.data_cutoff)} 统计。各行为独立统计，不代表前后顺序；画像与行为中的较小分组已隐藏。`;
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

function render(data, mode = "published") {
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
  document.documentElement.dataset.dataMode = mode;
  renderView();
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

class RefreshError extends Error {
  constructor(message, kind = "failed") {
    super(message);
    this.kind = kind;
  }
}

const relayMessage = (payload, fallback) => (typeof payload?.message === "string" && payload.message ? payload.message : fallback);

/** 把口令交给中继换一个更新任务。口令错误单独标记，让弹窗留在原地等重输。 */
async function startRelayRefresh(password) {
  let response;
  let payload;
  try {
    response = await fetchWithTimeout(`${RELAY_BASE}/refresh`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboard: DASHBOARD_ID, password }),
    }, 12000);
    payload = await response.json();
  } catch {
    throw new RefreshError("连不上更新服务。");
  }
  if (response.status === 401 || (response.status === 429 && payload?.error === "too_many_attempts")) {
    throw new RefreshError(relayMessage(payload, "口令不正确。"), "password");
  }
  if (!response.ok) throw new RefreshError(relayMessage(payload, `更新服务返回 ${response.status}。`));
  if (!payload.job_id) throw new RefreshError("更新服务没有返回任务编号。");
  return payload;
}

/** 轮询任务，直到本机侧查完把快照回传。 */
async function pollRelayJob(jobId) {
  for (let attempt = 0; attempt < 780; attempt += 1) {
    await delay(2300);
    const response = await fetchWithTimeout(`${RELAY_BASE}/status?job=${encodeURIComponent(jobId)}&v=${Date.now()}`, { cache: "no-store" }, 12000);
    if (!response.ok) throw new RefreshError(`查询状态返回 ${response.status}。`);
    const job = await response.json();
    setRefreshStatus(relayMessage(job, "正在查询最新数据。"), job.progress_url || "");
    if (job.status === "completed") return validateData(job.data);
    if (job.status === "failed") throw new RefreshError(relayMessage(job, "数据查询失败。"));
  }
  throw new RefreshError("数据查询超过 30 分钟，请稍后重试。");
}

/** 任何一条更新失败的路径，都退回到最近一份能读到的数据，并把原因说清楚。 */
async function fallbackToPublished(reason) {
  try {
    const published = await loadPublishedData(true);
    const saved = loadSavedLocalData();
    const newest = saved && parseTime(saved.meta.data_cutoff) > parseTime(published.meta.data_cutoff) ? saved : published;
    render(newest, newest === saved ? "local-cache" : "published");
    setRefreshStatus(`${reason}已展示最近数据（截至 ${formatCutoff(newest.meta.data_cutoff)}）。`);
    showToast(reason);
  } catch {
    setFreshness("error", "更新失败");
    setRefreshStatus(`更新失败：${reason}`);
    showToast("更新失败，请稍后再试");
  }
}

/** 口令通过之后的长流程：等本机侧查完，拿到快照就地重绘。 */
async function runRefreshJob(job) {
  const button = $("#refresh-button");
  button.disabled = true;
  button.classList.add("is-loading");
  button.setAttribute("aria-busy", "true");
  button.querySelector("span").textContent = "正在更新";
  setFreshness("loading", "正在查询数据");
  setRefreshStatus(relayMessage(job, "已连接更新服务，正在查询最新数据…"), job.progress_url || "");
  try {
    const refreshed = job.status === "completed" ? validateData(job.data) : await pollRelayJob(job.job_id);
    saveLocalData(refreshed);
    render(refreshed, "relay-live");
    setRefreshStatus(`更新完成，数据已刷新至 ${formatCutoff(refreshed.meta.data_cutoff)}。`);
    showToast("最新用户数据已更新");
    window.setTimeout(() => setRefreshStatus(""), 6000);
  } catch (error) {
    await fallbackToPublished(error.message || "无法查询或读取数据。");
  } finally {
    button.disabled = false;
    button.classList.remove("is-loading");
    button.setAttribute("aria-busy", "false");
    button.querySelector("span").textContent = "更新数据";
  }
}

function openRefreshDialog() {
  if ($("#refresh-button").disabled) return;
  const dialog = $("#refresh-dialog");
  $("#refresh-password").value = "";
  $("#refresh-error").textContent = "";
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  window.setTimeout(() => $("#refresh-password").focus(), 0);
}

function closeRefreshDialog() {
  const dialog = $("#refresh-dialog");
  $("#refresh-password").value = "";
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

/** 每次点更新都要重新输一次口令：页面不记住，也不往任何地方存。 */
async function requestRelayRefresh(event) {
  event.preventDefault();
  const input = $("#refresh-password");
  const error = $("#refresh-error");
  const submit = $("#refresh-submit");
  const password = input.value;
  if (!password) {
    error.textContent = "请输入更新口令。";
    input.focus();
    return;
  }
  submit.disabled = true;
  error.textContent = "正在核对口令…";
  let job = null;
  try {
    job = await startRelayRefresh(password);
  } catch (refreshError) {
    if (refreshError.kind === "password") {
      error.textContent = refreshError.message;
      input.value = "";
      input.focus();
      return;
    }
    closeRefreshDialog();
    await fallbackToPublished(refreshError.message);
    return;
  } finally {
    submit.disabled = false;
  }
  closeRefreshDialog();
  await runRefreshJob(job);
}

function bindInteractions() {
  $("#refresh-button").addEventListener("click", openRefreshDialog);
  $("#refresh-form").addEventListener("submit", requestRelayRefresh);
  $("#refresh-cancel").addEventListener("click", closeRefreshDialog);
  $("#refresh-dialog").addEventListener("close", () => { $("#refresh-password").value = ""; });
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
    const published = await loadPublishedData();
    const saved = loadSavedLocalData();
    const newest = saved && parseTime(saved.meta.data_cutoff) > parseTime(published.meta.data_cutoff) ? saved : published;
    render(newest, newest === saved ? "local-cache" : "published");
    setRefreshStatus("");
  } catch {
    setFreshness("error", "数据读取失败");
    setRefreshStatus("数据读取失败，请点击“更新数据”重试。");
  }
}

init();
