import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/reports/candidate-evaluator-2026-10-29/index.html', import.meta.url), 'utf8');
const production = readFileSync(new URL('../docs/reports/candidate-evaluator-2026-10-29/index.html', import.meta.url), 'utf8');
const connection = source.split('// BEGIN WORKSPACE CONNECTION\n')[1].split('// END WORKSPACE CONNECTION')[0];

class Element {
  constructor(tag = 'div', cls = '', text = '') {
    this.tag = tag; this.className = cls; this.textContent = text;
    this.value = ''; this.children = []; this.dataset = {}; this.handlers = {};
    this.classList = { toggle() {} };
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  querySelector() { return new Element('option'); }
  addEventListener(name, callback) { this.handlers[name] = callback; }
}

const state = (query = '') => ({ candidates: [{ id: 'synthetic-record' }], filter_scope: { query } });
const response = (body = state(), etag = '"synthetic-v1"') => ({
  ok: true, status: 200, headers: { get: () => etag }, json: async () => body,
});

function harness({ local = true, fetch = async () => response() } = {}) {
  const elements = new Map(), timers = new Map(), stats = { merges: 0, renders: 0, unlocks: 0, fetches: [], toasts: [] };
  let timerId = 0;
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  element('role-filter').value = 'all'; element('month-filter').value = 'all';
  const context = vm.createContext({
    isLoopback: local, engineConnected: false, engineSignature: null, sessionLocked: false,
    sessionEpoch: 0, uiMetricsScope: '', scope: 'all|all', data: { candidates: [] }, engineIds: new Set(),
    document: { hidden: false }, AbortSignal: { timeout: () => undefined },
    $: element, node: (tag, cls, text) => new Element(tag, cls, text),
    button: (label, callback, cls) => Object.assign(new Element('button', cls, label), { callback }),
    openUnlock() { stats.unlocks++; }, renderMonthFilter() {}, renderHiringMetrics() {},
    filterScope: () => context.scope,
    normalizeSearch: (value) => String(value || '').trim().toLowerCase(),
    mergePayload: (payload) => { stats.merges++; context.data = payload; },
    pendingReview: (candidate) => ['queued', 'running'].includes(candidate.quick_review_job?.status),
    fetch: async (...args) => { stats.fetches.push(args); return fetch(...args); },
    setTimeout: (callback, delay) => {
      const id = ++timerId;
      timers.set(id, { callback: () => { timers.delete(id); return callback(); }, delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    toast: (...args) => stats.toasts.push(args),
  });
  vm.runInContext(connection + `
    function renderAll(){renderConnectionStatus();}
    globalThis.client={connectEngine,refreshEngine,renderConnectionStatus,localWorkspaceLink,scheduleEnginePoll,nextEnginePollDelay,
      status:()=>({state:engineStatus,failures:engineFailures,inflight:!!engineRefreshPromise})};
  `, context);
  return { context, client: context.client, element, timers, stats };
}

test('production preserves the shared gate and the same application as the local template', () => {
  const withoutGate = production.replace(/<head>\s*<meta name="robots"[^>]*>\s*<script\b[^>]*data-clair-access-gate[^>]*><\/script>/, '<head>');
  assert.equal(withoutGate, source);
  assert.equal((production.match(/data-clair-access-gate/g) || []).length, 1);
  assert.match(production, /data-clair-access-scope="report"/);
  assert.match(source, /fetch\('\.\/private\.enc\.json'/);
  assert.match(source, /data-gate="decrypt"/);
  for (const html of [source, production]) {
    for (const [, script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(script);
  }
});

test('public entry opens a top-level local workspace and does not probe private APIs', async () => {
  const h = harness({ local: false });
  h.client.renderConnectionStatus();
  const link = h.element('connection-actions').children[0];
  assert.equal(link.href, 'http://127.0.0.1:8768/');
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener noreferrer');
  assert.match(h.element('connection-description').textContent, /加密历史快照/);
  assert.equal(await h.client.connectEngine(), false);
  assert.equal(h.stats.fetches.length, 0);
});

test('failed startup gives an actionable offline state and retry reconnects', async () => {
  let online = false;
  const h = harness({ fetch: async (url) => {
    if (!online) throw Error('connection refused');
    return url === '/api/health' ? response({ ok: true, mode: 'local_only' }) : response();
  } });
  assert.equal(await h.client.connectEngine(), false);
  assert.equal(h.client.status().state, 'offline');
  assert.match(h.element('connection-description').textContent, /双击启动\.command/);
  assert.equal(h.element('connection-actions').children[0].disabled, false);
  assert.equal([...h.timers.values()][0].delay, 5000);
  online = true;
  await h.element('connection-actions').children[0].callback();
  assert.equal(h.context.engineConnected, true);
  assert.equal(h.client.status().state, 'online');
  assert.equal(h.stats.merges, 1);
  assert.equal([...h.timers.values()][0].delay, 15000);
});

test('concurrent refresh callers serialize reads and coalesce a follow-up for changed filters', async () => {
  let release, active = 0, maximum = 0, calls = 0;
  const h = harness({ fetch: async () => {
    active++; maximum = Math.max(maximum, active); calls++;
    if (calls === 1) await new Promise(resolve => { release = resolve; });
    active--; return response();
  } });
  h.context.engineConnected = true;
  const first = h.client.refreshEngine(), second = h.client.refreshEngine(), third = h.client.refreshEngine();
  assert.equal(first, second); assert.equal(first, third); assert.equal(calls, 1);
  release(); await Promise.all([first, second, third]);
  assert.equal(calls, 2); assert.equal(maximum, 1); assert.equal(h.client.status().inflight, false);
});

test('a hidden local list retains an accessible restore action', async () => {
  const h = harness({ fetch: async (url) => url === '/api/health'
    ? response({ ok: true, mode: 'local_only' }) : response() });
  await h.client.connectEngine();
  h.context.sessionLocked = true;
  h.client.renderConnectionStatus();
  assert.match(h.element('connection-status').textContent, /名单已隐藏/);
  const restore = h.element('connection-actions').children[0];
  assert.equal(restore.textContent, '读取名单');
  restore.callback();
  assert.equal(h.stats.unlocks, 1);
});

test('unchanged exact-query state uses ETag and 304 never parses or merges a body', async () => {
  let calls = 0;
  const h = harness({ fetch: async () => {
    calls++;
    if (calls === 2) return { status: 304, json: () => { throw Error('304 has no body'); } };
    return response(state(calls === 3 ? 'different' : ''));
  } });
  h.context.engineConnected = true;
  await h.client.refreshEngine(); await h.client.refreshEngine();
  assert.equal(h.stats.fetches[1][1].headers['If-None-Match'], '"synthetic-v1"');
  assert.equal(h.stats.merges, 1);
  h.element('candidate-query').value = 'different'; h.context.scope = 'all|all|different';
  await h.client.refreshEngine();
  assert.equal(h.stats.fetches[2][1].headers['If-None-Match'], undefined);
  assert.match(h.stats.fetches[2][0], /query=different$/);
});

test('refresh failure keeps the loaded records, exposes offline state, and backs off', async () => {
  const h = harness({ fetch: async () => { throw Error('network unavailable'); } });
  h.context.engineConnected = true; h.context.data = state();
  const loaded = h.context.data;
  await assert.rejects(h.client.refreshEngine(), /network unavailable/);
  assert.equal(h.context.data, loaded);
  assert.equal(h.context.engineConnected, false);
  assert.equal(h.client.status().state, 'offline');
  assert.equal(h.client.nextEnginePollDelay(), 5000);
});

test('polling is fast only for active reviews and stops fetching while hidden or locked', async () => {
  const h = harness(); h.context.engineConnected = true;
  assert.equal(h.client.nextEnginePollDelay(), 15000);
  h.context.data = { candidates: [{ quick_review_job: { status: 'running' } }] };
  assert.equal(h.client.nextEnginePollDelay(), 2000);
  h.context.document.hidden = true; assert.equal(h.client.nextEnginePollDelay(), 30000);
  h.client.scheduleEnginePoll(0);
  await [...h.timers.values()][0].callback();
  assert.equal(h.stats.fetches.length, 0);
  h.context.sessionLocked = true; h.client.scheduleEnginePoll();
  assert.equal(h.timers.size, 0);
});

test('public and disconnected feedback cannot claim a session-only save', async () => {
  const h = harness({ local: false });
  const activeOpenFeedback = source.split('\n').filter(line => line.startsWith('function openFeedback(')).at(-1);
  const feedbackSubmit = source.split('\n').find(line => line.startsWith("$('feedback-form').addEventListener('submit'"));
  vm.runInContext(activeOpenFeedback + '\n' + feedbackSubmit, h.context);
  vm.runInContext("openFeedback({id:'synthetic-record'})", h.context);
  assert.match(h.stats.toasts[0][0], /已连接的本机工作台/);
  h.element('feedback-text').value = 'unsaved synthetic draft';
  await h.element('feedback-form').handlers.submit({ preventDefault() {} });
  assert.match(h.element('feedback-error').textContent, /尚未保存/);
  assert.equal(h.element('feedback-text').value, 'unsaved synthetic draft');
  assert.equal(h.stats.fetches.length, 0);
});
