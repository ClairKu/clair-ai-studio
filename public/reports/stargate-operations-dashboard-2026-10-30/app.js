(function (global) {
  'use strict';

  const PLATFORM_NAMES = { unidentified: '未识别平台', workbuddy: 'WorkBuddy', doubao: '豆包', qwenwork: '千问办公 · qwenwork', 'qwenwork-preregistered': 'qwenwork-preregistered（独立项）', ima: 'ima' };
  const SOURCE_NAMES = { all: '全部来源（合计 + 分列）', key: 'API Key', oauth: 'OAuth MCP' };
  const SOURCE_IDS = ['key_daily', 'oauth_daily', 'key_windows', 'oauth_uniques', 'oauth_platforms', 'oauth_quality'];
  const KNOWN_WINDOWS = { '7d': 7, '30d': 30, '90d': 90 };
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
  const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
  const platformName = value => PLATFORM_NAMES[value] || String(value);
  const fmt = value => value === null || value === undefined ? '—' : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
  const decimal = value => value === null || value === undefined ? '—' : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value);
  const percent = value => value === null || value === undefined ? '—' : (value * 100).toFixed(2) + '%';

  function datesBetween(start, end) {
    const dates = [];
    for (let stamp = Date.parse(start + 'T00:00:00Z'), stop = Date.parse(end + 'T00:00:00Z'); stamp <= stop && dates.length < 4000; stamp += 86400000) dates.push(new Date(stamp).toISOString().slice(0, 10));
    return dates;
  }

  function dateBefore(date, count) { return new Date(Date.parse(date + 'T00:00:00Z') - count * 86400000).toISOString().slice(0, 10); }
  function dateValid(value) { return typeof value === 'string' && dayPattern.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value; }
  function nativeUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'ontology-dashboard.yingmi-inc.com' ? url.href : 'https://ontology-dashboard.yingmi-inc.com/'; } catch (_) { return 'https://ontology-dashboard.yingmi-inc.com/'; } }

  function validateData(data) {
    const errors = [];
    if (!data || data.schemaVersion !== 'stargate-aggregate-v1') return ['聚合包版本不兼容'];
    const snap = data.snapshot || {};
    for (const key of ['minDate', 'maxDate', 'cutoffDate', 'partialDay', 'oauthStart']) if (!dateValid(snap[key])) errors.push('无效日期：' + key);
    if (snap.timezone !== 'Asia/Shanghai') errors.push('统计时区应为 Asia/Shanghai');
    if (snap.minDate > snap.maxDate || datesBetween(snap.minDate, snap.maxDate).length > 1000) errors.push('数据日期范围无效或过长');
    for (const key of ['keyDaily', 'oauthDaily', 'keyWindows', 'oauthUniques', 'oauthPlatforms', 'oauthQuality', 'sources']) if (!Array.isArray(data[key])) errors.push('缺少聚合数组：' + key);
    if (errors.length) return errors;
    const unique = (rows, makeKey, name) => { const keys = rows.map(makeKey); if (new Set(keys).size !== keys.length) errors.push(name + '含重复聚合行'); };
    unique(data.keyDaily, row => row.date, 'Key 日数据');
    unique(data.oauthDaily, row => row.date + '/' + row.platform, 'OAuth 日数据');
    unique(data.oauthUniques, row => row.start + '/' + row.end + '/' + row.platform, 'OAuth 去重数据');
    for (const row of data.keyDaily) if (!dateValid(row.date) || !integer(row.calls) || !integer(row.activeKeys) || row.date < snap.minDate || row.date > snap.maxDate) errors.push('Key 日聚合字段无效');
    for (const row of data.oauthDaily) if (!dateValid(row.date) || typeof row.platform !== 'string' || !integer(row.calls) || !integer(row.activeAccounts) || row.date < snap.oauthStart || row.date > snap.maxDate) errors.push('OAuth 日聚合字段无效');
    for (const row of data.keyWindows) if (!dateValid(row.start) || !dateValid(row.end) || !integer(row.calls) || !integer(row.usedKeys) || !integer(row.reusedKeys) || row.reusedKeys > row.usedKeys) errors.push('Key 窗口字段无效');
    for (const row of data.oauthUniques) if (!dateValid(row.start) || !dateValid(row.end) || typeof row.platform !== 'string' || !integer(row.accounts) || !integer(row.reusedAccounts) || row.reusedAccounts > row.accounts) errors.push('OAuth 去重字段无效');
    for (const row of data.oauthPlatforms) if (typeof row.platform !== 'string' || !integer(row.calls) || !integer(row.usedAccounts)) errors.push('OAuth 平台字段无效');
    for (const row of data.oauthQuality) if (typeof row.success !== 'boolean' || !integer(row.records) || !integer(row.logicalCalls) || !Number.isFinite(row.meanDurationMs) || row.meanDurationMs < 0) errors.push('质量聚合字段无效');
    for (const id of SOURCE_IDS) if (!data.sources.some(row => row.id === id && Number.isFinite(Date.parse(row.retrievedAt)))) errors.push('缺少有效来源时间：' + id);
    return [...new Set(errors)];
  }

  function oauthUniqueStats(data, start, end, platform) {
    const unavailable = { accounts: null, reusedAccounts: null };
    if (end < data.snapshot.oauthStart || start > data.snapshot.maxDate) return unavailable;
    const a = start < data.snapshot.oauthStart ? data.snapshot.oauthStart : start;
    const b = end > data.snapshot.maxDate ? data.snapshot.maxDate : end;
    const exact = data.oauthUniques.find(row => row.start === a && row.end === b && row.platform === platform);
    if (exact) return { accounts: exact.accounts, reusedAccounts: exact.reusedAccounts };
    const observed = data.oauthDaily.filter(row => row.date >= a && row.date <= b && (platform === 'all' || row.platform === platform));
    const knownPlatform = data.oauthPlatforms.some(row => row.platform === platform);
    const collectedDays = datesBetween(a, b).every(date => data.oauthUniques.some(row => row.platform === 'all' && row.start === date && row.end === date));
    if (!observed.length && platform !== 'all' && knownPlatform && collectedDays) return { accounts: 0, reusedAccounts: 0 };
    if (a === b && platform !== 'all' && observed.length === 1) return { accounts: observed[0].activeAccounts, reusedAccounts: 0 };
    return unavailable;
  }

  function oauthUnique(data, start, end, platform) { return oauthUniqueStats(data, start, end, platform).accounts; }
  function addObserved(values) { const known = values.filter(value => value !== null && value !== undefined); return known.length ? known.reduce((total, value) => total + value, 0) : null; }

  function aggregate(data, filter) {
    const start = filter.start, end = filter.end;
    const platform = filter.platform || 'all';
    const source = platform !== 'all' ? 'oauth' : (['all', 'key', 'oauth'].includes(filter.source) ? filter.source : 'all');
    const keyMap = new Map(data.keyDaily.map(row => [row.date, row]));
    const selectedKey = data.keyDaily.filter(row => row.date >= start && row.date <= end);
    const selectedOAuth = data.oauthDaily.filter(row => row.date >= start && row.date <= end && (platform === 'all' || row.platform === platform));
    const hasOAuthWindow = end >= data.snapshot.oauthStart && start <= data.snapshot.maxDate;
    let cumulativeKey = null, cumulativeOAuth = null, cumulativeCombined = null;
    const daily = datesBetween(start, end).map(date => {
      const key = keyMap.get(date);
      const oauthRows = selectedOAuth.filter(row => row.date === date);
      const oauthObserved = date >= data.snapshot.oauthStart && date <= data.snapshot.maxDate && data.oauthUniques.some(row => row.platform === 'all' && row.start === date && row.end === date);
      const keyCalls = key ? key.calls : null, keyActive = key ? key.activeKeys : null;
      const oauthCalls = oauthObserved ? sum(oauthRows, 'calls') : null;
      const oauthActive = oauthObserved ? oauthUnique(data, date, date, platform) : null;
      const combinedCalls = source === 'key' ? keyCalls : source === 'oauth' ? oauthCalls : addObserved([keyCalls, oauthCalls]);
      const combinedActive = source === 'key' ? keyActive : source === 'oauth' ? oauthActive : addObserved([keyActive, oauthActive]);
      if (keyCalls !== null) cumulativeKey = (cumulativeKey || 0) + keyCalls;
      if (oauthCalls !== null) cumulativeOAuth = (cumulativeOAuth || 0) + oauthCalls;
      if (combinedCalls !== null) cumulativeCombined = (cumulativeCombined || 0) + combinedCalls;
      const coverage = source === 'key' ? (keyCalls === null ? '未采集' : '仅 API Key（所选来源）') : source === 'oauth' ? (oauthCalls === null ? 'OAuth 未采集' : '仅 OAuth（所选来源）') : keyCalls !== null && oauthCalls !== null ? 'API Key + OAuth' : keyCalls !== null ? '仅 API Key；OAuth 未采集' : oauthCalls !== null ? '仅 OAuth；Key 未采集' : '未采集';
      return { date, keyCalls, keyActive, oauthCalls, oauthActive, combinedCalls, combinedActive, cumulativeKeyCalls: keyCalls === null ? null : cumulativeKey, cumulativeOAuthCalls: oauthCalls === null ? null : cumulativeOAuth, cumulativeCombinedCalls: combinedCalls === null ? null : cumulativeCombined, coverage, partial: date === data.snapshot.partialDay };
    });
    const keyWindow = data.keyWindows.find(row => row.start === start && row.end === end);
    const keyDistinct = keyWindow ? keyWindow.usedKeys : (start === end && keyMap.has(start) ? keyMap.get(start).activeKeys : null);
    const keyReused = keyWindow ? keyWindow.reusedKeys : (start === end && keyMap.has(start) ? 0 : null);
    const fullKey = selectedKey.filter(row => row.date !== data.snapshot.partialDay);
    const platformCodes = [...new Set(data.oauthPlatforms.map(row => row.platform).concat(data.oauthDaily.map(row => row.platform)))];
    const platforms = platformCodes.filter(code => platform === 'all' || platform === code).map(code => {
      const scoped = selectedOAuth.filter(row => row.platform === code);
      return { platform: code, name: platformName(code), calls: hasOAuthWindow ? sum(scoped, 'calls') : null, accounts: hasOAuthWindow ? oauthUnique(data, start, end, code) : null };
    }).sort((a, b) => (b.calls || 0) - (a.calls || 0));
    const oauthCalls = hasOAuthWindow ? sum(selectedOAuth, 'calls') : null;
    const oauthStats = oauthUniqueStats(data, start, end, platform);
    const unknownCalls = sum(selectedOAuth.filter(row => row.platform === 'unidentified'), 'calls');
    const combineSubjects = (keyValue, oauthValue) => source === 'key' ? keyValue : source === 'oauth' ? oauthValue : keyValue === null ? null : !hasOAuthWindow ? keyValue : oauthValue === null ? null : keyValue + oauthValue;
    const combinedUsedSubjects = combineSubjects(keyDistinct, oauthStats.accounts);
    const combinedReusedSubjects = combineSubjects(keyReused, oauthStats.reusedAccounts);
    const completeDaily = daily.filter(row => !row.partial && row.combinedCalls !== null);
    const fullOAuth = daily.filter(row => !row.partial && row.oauthCalls !== null);
    const combinedCalls = daily.some(row => row.combinedCalls !== null) ? sum(daily, 'combinedCalls') : null;
    return {
      start, end, source, platform, daily, platforms, selectedKey, selectedOAuth,
      keyCalls: sum(selectedKey, 'calls'), keyDistinct, keyReused,
      keyReuseRate: keyDistinct && keyReused !== null ? keyReused / keyDistinct : null,
      keyCompleteDays: fullKey.length, keyDailyAverage: fullKey.length ? sum(fullKey, 'calls') / fullKey.length : null,
      oauthCalls, oauthAccounts: oauthStats.accounts, oauthReused: oauthStats.reusedAccounts,
      oauthReuseRate: oauthStats.accounts && oauthStats.reusedAccounts !== null ? oauthStats.reusedAccounts / oauthStats.accounts : null,
      oauthCompleteDays: fullOAuth.length, oauthDailyAverage: fullOAuth.length ? sum(fullOAuth, 'oauthCalls') / fullOAuth.length : null,
      oauthObservedDays: daily.filter(row => row.oauthCalls !== null).length,
      combinedCalls, combinedUsedSubjects, combinedReusedSubjects,
      combinedReuseRate: combinedUsedSubjects && combinedReusedSubjects !== null ? combinedReusedSubjects / combinedUsedSubjects : null,
      combinedCompleteDays: completeDaily.length, combinedDailyAverage: completeDaily.length ? sum(completeDaily, 'combinedCalls') / completeDaily.length : null,
      combinedCompleteCalls: completeDaily.length ? sum(completeDaily, 'combinedCalls') : null,
      onlyKeyDays: source === 'all' ? daily.filter(row => row.keyCalls !== null && row.oauthCalls === null).length : 0,
      completeOnlyKeyDays: source === 'all' ? completeDaily.filter(row => row.keyCalls !== null && row.oauthCalls === null).length : 0,
      bothSourceDays: source === 'all' ? daily.filter(row => row.keyCalls !== null && row.oauthCalls !== null).length : 0,
      unknownCalls, unknownShare: oauthCalls ? unknownCalls / oauthCalls : null,
      hasPartialDay: start <= data.snapshot.partialDay && end >= data.snapshot.partialDay,
      keyDistinctNote: keyWindow ? '服务端固定窗口去重' : start === end ? '单日活跃 Key' : '需到本体重查，不能累加每日活跃 Key'
    };
  }

  function buildView(data, filter, exportedAt) {
    const model = aggregate(data, filter);
    const scope = { start: model.start, end: model.end, source: model.source, platform: model.platform, timezone: 'Asia/Shanghai', includesPartialDay: model.hasPartialDay, onlyKeyDays: model.onlyKeyDays, bothSourceDays: model.bothSourceDays };
    const daily = model.daily.map(row => {
      const value = { date: row.date, observedCallTotal: row.combinedCalls, cumulativeObservedCalls: row.cumulativeCombinedCalls, activeIdentitySubjectTotal: row.combinedActive, sourceCoverage: row.coverage, partial: row.partial };
      if (model.source !== 'oauth') Object.assign(value, { keyCalls: row.keyCalls, cumulativeKeyCalls: row.cumulativeKeyCalls, keyActiveKeys: row.keyActive });
      if (model.source !== 'key') Object.assign(value, { oauthMcpSuccessfulCalls: row.oauthCalls, cumulativeOAuthCalls: row.cumulativeOAuthCalls, oauthDistinctAccounts: row.oauthActive });
      return value;
    });
    const summary = { observedCallTotal: model.combinedCalls, usedIdentitySubjectTotal: model.combinedUsedSubjects, reusedIdentitySubjectTotal: model.combinedReusedSubjects, combinedReuseRate: model.combinedReuseRate, completeDayObservedCallAverage: model.combinedDailyAverage, completeDays: model.combinedCompleteDays, crossSourceIdentityDeduplicated: false };
    if (model.source !== 'oauth') Object.assign(summary, { keyCalls: model.keyCalls, keyUsedKeys: model.keyDistinct, keyReusedKeys: model.keyReused, keyCompleteDayAverage: model.keyDailyAverage, keyCompleteDays: model.keyCompleteDays });
    if (model.source !== 'key') Object.assign(summary, { oauthMcpSuccessfulCalls: model.oauthCalls, oauthDistinctAccounts: model.oauthAccounts, oauthReusedAccounts: model.oauthReused, oauthCompleteDayAverage: model.oauthDailyAverage, unknownPlatformCallShare: model.unknownShare });
    return { schemaVersion: 'stargate-view-v2', exportedAt: exportedAt || new Date().toISOString(), scope, cutoffDate: data.snapshot.cutoffDate, summary, daily, oauthPlatforms: model.source !== 'key' ? model.platforms : [], sourceTimestamps: data.sources, notes: ['记录调用合计 = API Key 日聚合调用 + OAuth MCP 成功调用；表示组合范围内已观测记录。', '身份主体合计 = 使用 Key + OAuth 区间去重账户，未跨来源去重，不是自然人数。', '复用主体合计在各来源内跨至少2日；复用率用合计分子÷合计分母重算，不相加百分比。', 'OAuth 采集起点前仍为 null；合计在这些日期仅覆盖 Key，来源覆盖逐日列示。', '平台筛选仅 OAuth；当日 partial，来源查询非统一事务快照。'] };
  }

  function buildCsvRows(view) {
    const scope = { start: view.scope.start, end: view.scope.end, source: view.scope.source, platform: view.scope.platform };
    return [Object.assign({ recordType: 'summary' }, scope, view.summary)].concat(view.daily.map(row => Object.assign({ recordType: 'daily' }, scope, row)));
  }

  function selfCheck(data) {
    const checks = [];
    const keyDates = datesBetween(data.snapshot.minDate, data.snapshot.maxDate);
    checks.push({ ok: keyDates.length === data.keyDaily.length && keyDates.every(date => data.keyDaily.some(row => row.date === date)), label: 'Key 日序列连续', detail: data.keyDaily.length + ' 个自然日，缺失不补 0' });
    data.keyWindows.forEach(row => {
      const actual = sum(data.keyDaily.filter(day => day.date >= row.start && day.date <= row.end), 'calls');
      checks.push({ ok: actual === row.calls, label: 'Key ' + row.code + ' 调用一致', detail: fmt(actual) + '，逐日求和 = 固定窗口汇总' });
    });
    const dailyCalls = sum(data.oauthDaily, 'calls'), platformCalls = sum(data.oauthPlatforms, 'calls');
    checks.push({ ok: dailyCalls === platformCalls, label: 'OAuth 两种聚合一致', detail: fmt(dailyCalls) + '，平台日汇总 = 平台区间汇总' });
    const model = aggregate(data, { start: data.snapshot.minDate, end: data.snapshot.maxDate, source: 'all', platform: 'all' });
    checks.push({ ok: model.daily.filter(row => row.date < data.snapshot.oauthStart).every(row => row.oauthCalls === null && row.oauthActive === null), label: 'OAuth 起点前留空', detail: data.snapshot.oauthStart + ' 之前为 null，不伪造历史零值' });
    const distinct = data.oauthUniques.find(row => row.platform === 'all' && row.start === data.snapshot.oauthStart && row.end === data.snapshot.maxDate);
    const dailyDistinctSum = data.oauthUniques.filter(row => row.platform === 'all' && row.start === row.end).reduce((total, row) => total + row.accounts, 0);
    checks.push({ ok: !!distinct && distinct.accounts <= dailyDistinctSum, label: 'OAuth 去重独立取值', detail: distinct ? '区间 ' + fmt(distinct.accounts) + '；每日人数相加为 ' + fmt(dailyDistinctSum) + '，未用求和替代去重' : '缺少区间去重结果' });
    checks.push({ ok: validateData(data).length === 0, label: '字段与非负数校验', detail: '日期、计数、来源时间与重复行检查' });
    checks.push({ ok: model.daily.every(row => row.combinedCalls === addObserved([row.keyCalls, row.oauthCalls])), label: '逐日调用合计一致', detail: '合计等于当日已观测 Key 与 OAuth 构成；OAuth 空值保留' });
    checks.push({ ok: model.daily.length > 0 && model.daily[model.daily.length - 1].cumulativeCombinedCalls === model.combinedCalls, label: '累计与区间合计一致', detail: '累计末值 = 当前筛选区间的已观测调用合计' });
    return checks;
  }

  global.StargateReportModel = Object.freeze({ aggregate, validateData, selfCheck, oauthUnique, oauthUniqueStats, datesBetween, buildView, buildCsvRows });
  if (typeof document === 'undefined' || !document.getElementById('report-root')) return;

  let DATA;
  try { DATA = JSON.parse(document.getElementById('report-data').textContent); } catch (_) { document.getElementById('report-root').textContent = '聚合数据包无法读取，请重新打开完整报告文件。'; return; }
  const validationErrors = validateData(DATA);
  if (validationErrors.length) { document.getElementById('report-root').textContent = validationErrors.join('；'); return; }
  const filter = { start: dateBefore(DATA.snapshot.maxDate, 29), end: DATA.snapshot.maxDate, source: 'all', platform: 'all', window: '30d', metric: 'calls', mode: 'line' };
  const $ = id => document.getElementById(id);
  let model;
  let charts = [];
  let platformChart;

  function el(tag, attrs, value) {
    const element = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs || {})) element.setAttribute(key, String(val));
    if (value !== undefined) element.textContent = String(value);
    return element;
  }
  function text(id, value) { const element = $(id); if (element) element.textContent = value; }
  function badge(value, type) { return el('span', { class: 'badge ' + (type || 'neutral') }, value); }
  function dateLabel(date) { return date.replace('2026-', '').replace('-', '/'); }
  function timeLabel(value) {
    const date = new Date(value);
    const base = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date).replaceAll('/', '-');
    return base + '.' + String(date.getUTCMilliseconds()).padStart(3, '0');
  }
  function rowTable(container, columns, rows, opts) {
    container.replaceChildren();
    const table = el('table', { class: 'table' });
    if (opts && opts.caption) table.append(el('caption', {}, opts.caption));
    const header = el('tr');
    columns.forEach(column => header.append(el('th', { scope: 'col', class: column.numeric ? 'numeric' : '' }, column.label)));
    const head = el('thead'); head.append(header); table.append(head);
    const body = el('tbody');
    rows.forEach(row => {
      const tr = el('tr');
      columns.forEach(column => {
        const value = typeof column.value === 'function' ? column.value(row) : row[column.key];
        const td = el('td', { class: (column.numeric ? 'numeric ' : '') + (column.wrap ? 'wrap ' : '') });
        if (value && value.nodeType) td.append(value); else td.textContent = value === null || value === undefined ? '—' : String(value);
        tr.append(td);
      });
      body.append(tr);
    });
    if (!rows.length) { const tr = el('tr'), td = el('td', { colspan: columns.length }); td.append(el('div', { class: 'empty-state' }, '当前筛选无可展示聚合记录')); tr.append(td); body.append(tr); }
    table.append(body); container.append(table);
  }

  function card(label, value, unit, note, options) {
    const item = el('article', { class: 'kpi' + ((options || {}).accent ? ' is-accent' : '') });
    const labelEl = el('div', { class: 'kpi-label' }); labelEl.append(el('span', {}, label));
    if (options && options.badge) labelEl.append(badge(options.badge, options.badgeType || 'neutral'));
    const main = el('div', { class: 'kpi-value' }, value); if (unit) main.append(el('small', {}, unit));
    item.append(labelEl, main, el('p', { class: 'kpi-note' }, note));
    return item;
  }

  function renderKpis() {
    const container = $('overview-kpis'); container.replaceChildren();
    const components = $('component-kpis'); components.replaceChildren();
    const combined = model.source === 'all';
    $('component-details').hidden = !combined;
    container.classList.toggle('combined-kpis', combined);
    if (combined) {
      const oauthCallsPart = model.oauthCalls === null ? 'OAuth 未采集' : fmt(model.oauthCalls) + ' OAuth';
      const identityParts = model.combinedUsedSubjects === null ? '当前区间缺少 Key 或 OAuth 的区间去重结果，需到本体重查。' : fmt(model.keyDistinct) + ' Key + ' + (model.oauthAccounts === null ? 'OAuth 未采集' : fmt(model.oauthAccounts) + ' OAuth') + '；未跨来源去重的身份主体数。';
      const reuseParts = model.combinedReusedSubjects === null ? '去重分子或分母不可推导，需到本体重查。' : fmt(model.keyReused) + ' Key + ' + (model.oauthReused === null ? 'OAuth 未采集' : fmt(model.oauthReused) + ' OAuth') + '；合计复用率 ' + percent(model.combinedReuseRate) + '。';
      container.append(card('已观测调用合计', fmt(model.combinedCalls), '次', fmt(model.keyCalls) + ' Key + ' + oauthCallsPart + '；两类记录组合。', { accent: true, badge: '合计' }));
      container.append(card('使用主体合计', model.combinedUsedSubjects === null ? '需重查' : fmt(model.combinedUsedSubjects), model.combinedUsedSubjects === null ? '' : '主体', identityParts, { accent: true, badge: '未跨源去重' }));
      container.append(card('复用主体合计', model.combinedReusedSubjects === null ? '需重查' : fmt(model.combinedReusedSubjects), model.combinedReusedSubjects === null ? '' : '主体', reuseParts, { badge: '各源跨 ≥2 日' }));
      container.append(card('完整日日均 · 合计', decimal(model.combinedDailyAverage), '次/日', '剔除今日，共 ' + model.combinedCompleteDays + ' 天；其中 ' + model.completeOnlyKeyDays + ' 天仅 Key 已观测记录。', { badge: '不含今日' }));
    }
    const split = combined ? components : container;
    if (model.source !== 'oauth') {
      split.append(card('API Key · 区间调用', fmt(model.keyCalls), '次', '日聚合调用记录求和；统计主体为 Key。', { badge: 'Key' }));
      split.append(card('API Key · 使用 Key', model.keyDistinct === null ? '需重查' : fmt(model.keyDistinct), model.keyDistinct === null ? '' : '个', model.keyDistinctNote + '；不是去重自然人数。', { badge: '凭据' }));
      split.append(card('API Key · 跨日复用', fmt(model.keyReused), model.keyReused === null ? '' : '个', '同窗口跨 ≥2 日；复用比例 ' + percent(model.keyReuseRate) + '。', { badge: 'Key' }));
      split.append(card('API Key · 完整日日均', decimal(model.keyDailyAverage), '次/日', '剔除今日，共 ' + model.keyCompleteDays + ' 个完整自然日。', { badge: '不含今日' }));
    }
    if (model.source !== 'key') {
      split.append(card('OAuth MCP · 成功调用', fmt(model.oauthCalls), model.oauthCalls === null ? '' : '次', model.oauthCalls === null ? '所选范围早于 OAuth 采集起点。' : '仅已采集 ' + model.oauthObservedDays + ' 天，MCP 成功调用口径。', { badge: 'OAuth' }));
      split.append(card('OAuth · 区间去重账户', fmt(model.oauthAccounts), model.oauthAccounts === null ? '' : '个', model.oauthAccounts === null ? '当前区间无已验证去重结果。' : '直接读取区间去重聚合，未累加每日或平台人数。', { badge: '账户' }));
      split.append(card('OAuth · 跨日复用账户', fmt(model.oauthReused), model.oauthReused === null ? '' : '个', '各账户跨 ≥2 日；当前比例 ' + percent(model.oauthReuseRate) + '，不代表周月留存。', { badge: 'OAuth' }));
      split.append(card('OAuth · 完整日日均', decimal(model.oauthDailyAverage), '次/日', '剔除今日，仅 ' + model.oauthCompleteDays + ' 个已采集完整日；与合计日均的天数不同。', { badge: '已采集日' }));
    }
    text('selected-scope', filter.start + ' — ' + filter.end + ' · ' + SOURCE_NAMES[model.source] + (filter.platform === 'all' ? '' : ' · ' + platformName(filter.platform)));
    text('range-status', model.hasPartialDay ? '包含 10/30 不完整日，禁止与完整日直接比较' : '仅包含已结束自然日');
    $('range-status').className = 'badge ' + (model.hasPartialDay ? 'warning' : 'neutral');
    $('platform-filter-note').hidden = filter.platform === 'all';
    text('platform-filter-note', '平台筛选已自动切换至 OAuth。Key 记录没有可验证的平台归属，未将 Key 强行绑定到该平台。');
    $('no-oauth-note').hidden = model.source === 'key' || model.oauthObservedDays > 0;
    text('no-oauth-note', '所选范围早于 2026-10-29，OAuth 尚无已采集历史。图表与表格保留空值，不补零。');
    text('overview-note', combined ? '记录调用合计 = API Key 日聚合调用 + OAuth MCP 成功调用。主体合计为 Key 凭据 + OAuth 去重账户，未跨来源去重。当前 ' + model.bothSourceDays + ' 天双来源、' + model.onlyKeyDays + ' 天仅 Key 记录；OAuth 未采集不代表 0。' : '当前仅展示 ' + SOURCE_NAMES[model.source] + (model.platform !== 'all' ? ' · ' + platformName(model.platform) : '') + '。选择“全部来源”查看记录调用与身份主体合计，平台筛选保持仅 OAuth。');
  }

  function trendColumns() {
    const cols = [{ label: '日期（上海）', key: 'date' }];
    if (model.source === 'all') cols.push({ label: '已观测调用合计', numeric: true, value: row => fmt(row.combinedCalls) }, { label: '累计调用合计', numeric: true, value: row => fmt(row.cumulativeCombinedCalls) }, { label: '日活主体合计（未跨源去重）', numeric: true, value: row => fmt(row.combinedActive) });
    if (model.source !== 'oauth') cols.push({ label: 'Key 调用', numeric: true, value: row => fmt(row.keyCalls) }, { label: '单日活跃 Key', numeric: true, value: row => fmt(row.keyActive) });
    if (model.source !== 'key') cols.push({ label: 'OAuth MCP 成功调用', numeric: true, value: row => row.oauthCalls === null ? '未采集' : fmt(row.oauthCalls) }, { label: 'OAuth 单日去重账户', numeric: true, value: row => row.oauthActive === null ? '未采集' : fmt(row.oauthActive) });
    if (model.source !== 'all') cols.push({ label: '区间累计调用', numeric: true, value: row => fmt(row.cumulativeCombinedCalls) });
    cols.push({ label: '来源覆盖', value: row => row.coverage }, { label: '完整性', value: row => badge(row.partial ? '今日不完整' : '完整自然日', row.partial ? 'warning' : 'neutral') });
    return cols;
  }

  function renderTrends() {
    charts.forEach(chart => chart.destroy()); charts = [];
    const combined = model.source === 'all';
    $('combined-trend-card').hidden = !combined || filter.mode === 'table';
    $('key-trend-card').hidden = model.source !== 'key' || filter.mode === 'table';
    $('oauth-trend-card').hidden = model.source !== 'oauth' || filter.mode === 'table';
    $('trend-charts').classList.add('is-single');
    $('trend-table').hidden = filter.mode !== 'table';
    const metric = ['active', 'cumulative'].includes(filter.metric) ? filter.metric : 'calls';
    const annotations = [{ date: DATA.snapshot.oauthStart, label: 'OAuth 采集起点 · 10/29', color: '#a87537' }];
    const base = { xKey: 'date', height: 292, mode: filter.mode, allowToggle: false, valueFormatter: fmt };
    const keyMetric = metric === 'active' ? 'keyActive' : metric === 'cumulative' ? 'cumulativeKeyCalls' : 'keyCalls';
    const oauthMetric = metric === 'active' ? 'oauthActive' : metric === 'cumulative' ? 'cumulativeOAuthCalls' : 'oauthCalls';
    const combinedMetric = metric === 'active' ? 'combinedActive' : metric === 'cumulative' ? 'cumulativeCombinedCalls' : 'combinedCalls';
    if (filter.mode === 'table') rowTable($('trend-table'), trendColumns(), model.daily, { caption: '当前筛选每日聚合与区间累计。合计仅使用已观测记录，OAuth 空值保留，并逐日列示来源覆盖。' });
    else {
      if (combined) charts.push(StargateCharts.line($('combined-trend'), model.daily, [{ key: combinedMetric, label: metric === 'active' ? '日活主体合计（未跨源去重）' : '已观测调用合计', color: '#087f8c' }, { key: keyMetric, label: metric === 'active' ? 'Key 活跃凭据' : 'API Key 调用记录', color: '#193b64' }, { key: oauthMetric, label: metric === 'active' ? 'OAuth 去重账户' : 'OAuth MCP 成功调用', color: '#d48835' }], Object.assign({}, base, { annotations, yLabel: metric === 'active' ? '身份主体' : '次' })));
      if (model.source === 'key') charts.push(StargateCharts.line($('key-trend'), model.daily, [{ key: keyMetric, label: metric === 'active' ? '单日活跃 Key' : 'Key 调用记录', color: '#193b64' }], Object.assign({}, base, { yLabel: metric === 'active' ? 'Key' : '次' })));
      if (model.source === 'oauth') charts.push(StargateCharts.line($('oauth-trend'), model.daily, [{ key: oauthMetric, label: metric === 'active' ? 'OAuth 去重账户' : 'OAuth MCP 成功调用', color: '#087f8c' }], Object.assign({}, base, { annotations, yLabel: metric === 'active' ? '账户' : '次' })));
    }
    text('combined-trend-title', metric === 'active' ? '日活主体合计与构成' : metric === 'cumulative' ? '累计已观测调用与构成' : '已观测调用合计与构成');
    text('combined-trend-subtitle', metric === 'active' ? 'Key 凭据 + OAuth 账户，未跨来源去重；日活不能相加为区间去重主体' : metric === 'cumulative' ? '从当前筛选起始日累计，末值与区间调用合计一致' : '同轴显示合计与两项构成；可用图例单独查看任一来源');
    text('key-trend-subtitle', metric === 'active' ? 'API Key 凭据 · 非自然人数' : metric === 'cumulative' ? '当前区间累计调用记录' : '调用记录日聚合');
    text('oauth-trend-subtitle', metric === 'active' ? '每日账户去重 · 不可相加为区间账户' : metric === 'cumulative' ? '当前区间累计 MCP 成功调用' : '仅 MCP 成功调用');
    document.querySelectorAll('[data-chart-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.chartMode === filter.mode)));
    document.querySelectorAll('[data-chart-metric]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.chartMetric === filter.metric)));
    text('trend-footnote', combined ? '合计 = 当日已观测 Key + OAuth 记录。10/29 前合计仅覆盖 Key，OAuth 系列仍留空；日活主体合计未跨来源去重。图例可开关三条序列，表格与导出包含来源覆盖；10/30 今日不完整。' : '当前单一来源视图；累计从所选起始日计算。OAuth 起点前留空，10/30 今日不完整。图例可开关指标；Tab 与方向键可查看数据点。');
  }

  function renderPlatforms() {
    if (platformChart) { platformChart.destroy(); platformChart = null; }
    $('platform-section').hidden = model.source === 'key';
    if (model.source === 'key') return;
    const sorted = model.platforms.filter(row => row.platform !== 'unidentified' && row.calls !== null).sort((a, b) => b.calls - a.calls);
    const ranked = sorted.slice(0, 8);
    if (sorted.length > 8) ranked.push({ name: '其他已识别平台', calls: sum(sorted.slice(8), 'calls'), accounts: null, platform: 'other' });
    const unknown = model.platforms.find(row => row.platform === 'unidentified');
    const distribution = ranked.concat(unknown && unknown.calls !== null ? [unknown] : []);
    if (model.oauthObservedDays) platformChart = StargateCharts.bars($('platform-bars'), distribution, 'name', 'calls', { maxRows: 10, sort: false, valueLabel: '成功调用', color: row => row.platform === 'unidentified' ? '#c18b4e' : '#087f8c', valueFormatter: fmt });
    else $('platform-bars').replaceChildren(el('div', { class: 'sg-chart-empty' }, '所选范围尚无 OAuth 采集数据'));
    rowTable($('platform-summary-table'), [
      { label: '平台', value: row => row.name },
      { label: '成功调用', numeric: true, value: row => fmt(row.calls) },
      { label: '平台内去重账户', numeric: true, value: row => fmt(row.accounts) },
      { label: '调用占比', numeric: true, value: row => model.oauthCalls ? percent(row.calls / model.oauthCalls) : '—' }
    ], model.platforms, { caption: '账户在本平台内去重；各平台账户存在交集，不累加。' });
    const dates = model.daily.filter(row => row.oauthCalls !== null).map(row => row.date);
    const platformDaily = [];
    dates.forEach(date => model.platforms.forEach(platform => {
      const exact = model.selectedOAuth.find(row => row.date === date && row.platform === platform.platform);
      platformDaily.push({ date, platform: platform.platform, name: platform.name, calls: exact ? exact.calls : 0, accounts: oauthUnique(DATA, date, date, platform.platform), partial: date === DATA.snapshot.partialDay });
    }));
    rowTable($('platform-daily-table'), [
      { label: '日期', key: 'date' }, { label: '平台', key: 'name' },
      { label: '成功调用', numeric: true, value: row => fmt(row.calls) },
      { label: '日去重账户', numeric: true, value: row => fmt(row.accounts) },
      { label: '完整性', value: row => badge(row.partial ? '今日不完整' : '完整自然日', row.partial ? 'warning' : 'neutral') }
    ], platformDaily, { caption: '按平台拆分的已采集日。无记录日可为 0；起点前不生成伪历史行。' });
    const search = $('platform-search').value.trim().toLowerCase();
    if (search) $('platform-daily-table').querySelectorAll('tbody tr').forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(search); });
    text('platform-count', model.platforms.length + ' 个平台条目');
    text('unknown-share-note', model.oauthCalls ? '未识别平台：' + fmt(model.unknownCalls) + ' 次，占当前 OAuth 调用的 ' + percent(model.unknownShare) + '。已识别覆盖 ' + percent(1 - model.unknownShare) + '。' : '当前范围没有可计算归因比例的 OAuth 调用。');
  }

  function renderKeyWindows() {
    $('key-window-section').hidden = model.source === 'oauth';
    if (model.source === 'oauth') return;
    const combined = model.source === 'all';
    const windows = DATA.keyWindows.slice().sort((a, b) => KNOWN_WINDOWS[a.code] - KNOWN_WINDOWS[b.code]).map(row => Object.assign({}, row, { view: aggregate(DATA, { start: row.start, end: row.end, source: model.source, platform: 'all' }) }));
    const columns = [
      { label: '固定窗口', value: row => row.code.toUpperCase() + ' · ' + dateLabel(row.start) + '—' + dateLabel(row.end) },
      { label: combined ? '已观测调用合计' : 'Key 调用记录', numeric: true, value: row => fmt(row.view.combinedCalls) },
      { label: combined ? '使用主体合计' : '使用 Key', numeric: true, value: row => fmt(row.view.combinedUsedSubjects) },
      { label: combined ? '复用主体合计' : '跨 ≥2 日复用 Key', numeric: true, value: row => fmt(row.view.combinedReusedSubjects) },
      { label: combined ? '合计复用率' : 'Key 窗口复用比例', numeric: true, value: row => percent(row.view.combinedReuseRate) }
    ];
    if (combined) columns.push({ label: 'Key 构成（使用 / 复用）', value: row => fmt(row.view.keyDistinct) + ' / ' + fmt(row.view.keyReused) }, { label: 'OAuth 构成（使用 / 复用）', value: row => fmt(row.view.oauthAccounts) + ' / ' + fmt(row.view.oauthReused) });
    rowTable($('key-window-table'), columns, windows, { caption: '独立固定窗口参考，均截至 10/30，不随上方日期改变。合计主体未跨来源去重；OAuth 仅覆盖 10/29—10/30。不同长度窗口比例不代表留存或增长。' });
    text('key-selected-reuse', model.combinedReusedSubjects === null ? '当前自定义区间缺少所需区间去重主体或复用结果，合计主体与比例需到本体重查；不累加每日活跃推导。' : combined ? '当前筛选：使用主体合计 ' + fmt(model.combinedUsedSubjects) + ' = ' + fmt(model.keyDistinct) + ' Key + ' + (model.oauthAccounts === null ? 'OAuth 未采集' : fmt(model.oauthAccounts) + ' OAuth') + '；复用主体合计 ' + fmt(model.combinedReusedSubjects) + '，合计复用率 ' + percent(model.combinedReuseRate) + '。复用按各来源内跨 ≥2 日统计，不额外推断跨来源复用。' : '当前筛选：使用 Key ' + fmt(model.keyDistinct) + '，跨至少 2 个自然日出现 ' + fmt(model.keyReused) + '，窗口复用比例 ' + percent(model.keyReuseRate) + '。');
  }

  function renderQuality() {
    const sourceRows = DATA.sources.map(row => ({ label: row.label, time: timeLabel(row.retrievedAt) }));
    rowTable($('source-times'), [{ label: '聚合来源', key: 'label' }, { label: '读取时间（上海）', key: 'time' }], sourceRows);
    const timeValues = DATA.sources.map(row => Date.parse(row.retrievedAt));
    text('snapshot-skew', '来源查询最早与最晚相差 ' + ((Math.max(...timeValues) - Math.min(...timeValues)) / 1000).toFixed(2) + ' 秒；来源时间分别列示，不构成统一事务快照。');
    text('workspace-scope-note', (DATA.evidence || {}).workspaceComparison || '本页与本体按全空间统计。与单工作空间看板比较时，需要先统一范围。');
    text('first-retrieved', '首次取数 ' + timeLabel(new Date(Math.min(...timeValues)).toISOString()) + '（上海）');
    const stale = Date.now() - Math.min(...timeValues) > 24 * 60 * 60 * 1000;
    $('stale-note').hidden = !stale;
    text('stale-note', '数据已过期，请到本体刷新。此页为截至 ' + timeLabel(new Date(Math.min(...timeValues)).toISOString()) + ' 首次取数的聚合快照，未自动获取新数据。');
    const quality = DATA.oauthQuality;
    rowTable($('quality-table'), [
      { label: '明细结果组', value: row => row.success ? 'success = 1' : 'success = 0' },
      { label: '原始明细事件', numeric: true, value: row => fmt(row.records) },
      { label: '组内去重 logical call', numeric: true, value: row => fmt(row.logicalCalls) },
      { label: '组内平均耗时', numeric: true, value: row => decimal(row.meanDurationMs) + ' ms' }
    ], quality, { caption: '质量面板始终展示本次完整采集范围（10/29—10/30），不随上方平台和日期筛选改变。' });
    const totalRecords = sum(quality, 'records');
    const successLogical = sum(quality.filter(row => row.success), 'logicalCalls');
    const aggregateOAuth = sum(DATA.oauthPlatforms, 'calls');
    text('quality-events', fmt(totalRecords));
    text('quality-logical', fmt(successLogical));
    text('quality-aggregate', fmt(aggregateOAuth));
    text('quality-discrepancy', '成功组 logical call 为 ' + fmt(successLogical) + '，日聚合成功调用为 ' + fmt(aggregateOAuth) + '，数值差为 ' + fmt(aggregateOAuth - successLogical) + '，标记“计数层级与链路去重待核”。原始明细、组内去重 logical call、聚合 call_count 不能硬对账；两个结果组的 logical call 是否有交集也未证明，因此不计算全局 logical call 总量或业务成功率。');
    const latest = quality.map(row => row.latestEvent).sort().pop();
    text('latest-event', '明细最近事件：' + latest.replace('T', ' ').slice(0, 23) + '（源服务上海时间）。');
    const results = selfCheck(DATA); const checks = $('check-results'); checks.replaceChildren();
    results.forEach(result => { const item = el('li', { class: 'check-item' }); item.append(badge(result.ok ? '通过' : '待核', result.ok ? '' : 'warning'), el('strong', {}, result.label), el('span', { class: 'muted' }, result.detail)); checks.append(item); });
    text('check-summary', results.filter(row => row.ok).length + ' / ' + results.length + ' 项聚合自检通过');
  }

  function renderRecommendations() {
    const allOAuth = sum(DATA.oauthPlatforms, 'calls');
    const unknown = sum(DATA.oauthPlatforms.filter(row => row.platform === 'unidentified'), 'calls');
    text('recommendation-unknown', '本次完整采集范围中，' + fmt(unknown) + ' / ' + fmt(allOAuth) + ' 次 OAuth 调用来自未识别平台，占 ' + percent(unknown / allOAuth) + '。先补可信平台映射与未知来源分层，再判断渠道贡献。qwenwork-preregistered 保留独立项。');
    const keyThirty = DATA.keyWindows.find(row => row.code === '30d');
    const allModel = keyThirty ? aggregate(DATA, { start: keyThirty.start, end: keyThirty.end, platform: 'all', source: 'all' }) : model;
    text('recommendation-key', '近 30 日已观测调用合计 ' + fmt(allModel.combinedCalls) + ' 次，使用主体合计 ' + fmt(allModel.combinedUsedSubjects) + '，复用主体合计 ' + fmt(allModel.combinedReusedSubjects) + '；合计复用率 ' + percent(allModel.combinedReuseRate) + '。主体未跨来源去重，合计日均 ' + decimal(allModel.combinedDailyAverage) + ' 次也包含 OAuth 起点前仅 Key 的记录。');
    text('recommendation-oauth', 'OAuth 仅从 10/29 开始采集，共 2 天，且 10/30 尚未结束。当前可观察平台结构与采集质量；增长、环比、同比、周月留存结论均等待完整观察周期。');
  }

  function render() {
    model = aggregate(DATA, filter);
    filter.source = model.source;
    $('source-select').value = filter.source;
    renderKpis(); renderTrends(); renderPlatforms(); renderKeyWindows();
    text('last-rendered', '筛选在本地计算 · ' + new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()));
  }

  function setupData() {
    $('start-date').min = $('end-date').min = DATA.snapshot.minDate;
    $('start-date').max = $('end-date').max = DATA.snapshot.maxDate;
    $('start-date').value = filter.start; $('end-date').value = filter.end;
    const platformSelect = $('platform-select'); platformSelect.replaceChildren(el('option', { value: 'all' }, '全部 OAuth 平台'));
    [...new Set(DATA.oauthPlatforms.map(row => row.platform))].sort((a, b) => a === 'unidentified' ? 1 : b === 'unidentified' ? -1 : a.localeCompare(b)).forEach(code => platformSelect.append(el('option', { value: code }, platformName(code))));
    platformSelect.value = filter.platform;
    document.querySelectorAll('[data-native-link]').forEach(link => { link.href = nativeUrl(DATA.nativeReportUrl); });
    const pending = new URL(nativeUrl(DATA.nativeReportUrl)).pathname === '/';
    const combinedPending = (DATA.evidence || {}).nativeCombinedStatus === 'pending_service';
    document.querySelectorAll('[data-native-link]').forEach(link => { link.textContent = pending ? '打开本体动态报告模块' : combinedPending ? '查看本体报告' : '本体实时重查'; });
    text('native-link-status', pending ? '本体原生报告创建中；当前入口指向本体首页。' : '本体原生报告已保存：本人私有、未审核' + (combinedPending ? '。' : '，可实时重查。') + '支持平台 → 分页用户 → 调用详情，含账户摘要、按日统计；工具 Top20 仅 OAuth，最长 90 天，不补无来源资料。');
    $('native-combined-status').hidden = !combinedPending;
    text('native-combined-status', combinedPending ? '本体查询服务暂不可用，合计扩展尚未保存；现可查看最近成功快照。' : '');
    text('snapshot-label', DATA.snapshot.mode);
    text('data-cutoff', '统计截止 ' + DATA.snapshot.cutoffDate + ' · 上海时区');
    renderQuality(); renderRecommendations(); render();
  }

  function toast(message) {
    const notice = $('toast'); notice.textContent = message; notice.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { notice.hidden = true; }, 4500);
  }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type: type || 'text/plain;charset=utf-8' }));
    const link = el('a', { href: url, download: name }); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  function csvCell(value) {
    let textValue = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(textValue)) textValue = "'" + textValue;
    return '"' + textValue.replaceAll('"', '""') + '"';
  }
  function exportView(format) {
    const output = buildView(DATA, filter);
    const daily = output.daily;
    const filename = 'stargate-' + filter.start + '-' + filter.end + '-' + model.source;
    if (format === 'csv') {
      const records = buildCsvRows(output);
      const keys = [...new Set(records.flatMap(row => Object.keys(row)))];
      const rows = [keys.map(csvCell).join(',')].concat(records.map(row => keys.map(key => csvCell(row[key])).join(',')));
      download(filename + '.csv', '\uFEFF' + rows.join('\r\n'), 'text/csv;charset=utf-8');
    } else {
      download(filename + '.json', JSON.stringify(output, null, 2), 'application/json;charset=utf-8');
    }
    toast('已导出当前筛选的 ' + format.toUpperCase() + '，文件仅保存在本地。');
  }

  $('range-select').addEventListener('change', event => {
    filter.window = event.target.value;
    if (KNOWN_WINDOWS[filter.window]) { filter.end = DATA.snapshot.maxDate; filter.start = dateBefore(filter.end, KNOWN_WINDOWS[filter.window] - 1); $('start-date').value = filter.start; $('end-date').value = filter.end; }
    else { $('start-date').focus(); return; }
    render();
  });
  $('apply-dates').addEventListener('click', () => {
    const start = $('start-date').value, end = $('end-date').value;
    if (!dateValid(start) || !dateValid(end) || start > end || start < DATA.snapshot.minDate || end > DATA.snapshot.maxDate) { toast('请选择 ' + DATA.snapshot.minDate + ' 至 ' + DATA.snapshot.maxDate + ' 内的有效日期范围。'); return; }
    filter.start = start; filter.end = end;
    const exact = DATA.keyWindows.find(row => row.start === start && row.end === end);
    filter.window = exact ? exact.code : 'custom'; $('range-select').value = filter.window; render();
  });
  $('source-select').addEventListener('change', event => {
    filter.source = event.target.value;
    if (filter.source !== 'oauth' && filter.platform !== 'all') { filter.platform = 'all'; $('platform-select').value = 'all'; }
    render();
  });
  $('platform-select').addEventListener('change', event => { filter.platform = event.target.value; if (filter.platform !== 'all') { filter.source = 'oauth'; $('source-select').value = 'oauth'; } render(); });
  $('platform-search').addEventListener('input', renderPlatforms);
  document.querySelectorAll('[data-chart-mode]').forEach(button => button.addEventListener('click', () => { filter.mode = button.dataset.chartMode; renderTrends(); }));
  document.querySelectorAll('[data-chart-metric]').forEach(button => button.addEventListener('click', () => { filter.metric = button.dataset.chartMetric; renderTrends(); }));
  $('export-csv').addEventListener('click', () => exportView('csv'));
  $('export-json').addEventListener('click', () => exportView('json'));
  $('export-package').addEventListener('click', () => download('stargate-aggregate-package-' + DATA.snapshot.cutoffDate + '.json', JSON.stringify(DATA, null, 2), 'application/json;charset=utf-8'));
  $('print-report').addEventListener('click', () => global.print());
  $('import-package').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files && event.target.files[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast('聚合包超过 10 MB，请使用仅含聚合数据的 JSON。'); event.target.value = ''; return; }
    try {
      const next = JSON.parse(await file.text()); const errors = validateData(next);
      if (errors.length) throw new Error(errors.join('；'));
      const checks = selfCheck(next); if (checks.some(row => !row.ok)) throw new Error('聚合一致性检查未通过');
      DATA = next; filter.end = DATA.snapshot.maxDate; filter.start = dateBefore(filter.end, 29); if (filter.start < DATA.snapshot.minDate) filter.start = DATA.snapshot.minDate;
      filter.source = 'all'; filter.platform = 'all'; filter.window = '30d'; $('range-select').value = '30d';
      setupData(); toast('已在当前页面导入聚合包；没有上传，也未写入浏览器持久存储。');
    } catch (error) { toast('导入失败：' + error.message); }
    event.target.value = '';
  });

  setupData();
})(typeof window !== 'undefined' ? window : globalThis);
