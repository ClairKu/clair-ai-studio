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
  setAttribute(name, value) { this[name] = value; }
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
  assert.equal(h.element('workspace-connection').hidden, true, 'successful connections should not take up workspace space');
  assert.equal(h.element('connection-status').textContent, '');
  assert.equal(h.element('connection-description').textContent, '');
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
  assert.equal(h.element('workspace-connection').hidden, true);
  assert.equal(h.element('connection-actions').children.length, 0);
  h.context.data = {candidates: []};
  vm.runInContext(source.split('\n').find(line=>line.startsWith('function candidateEmptyState(')),h.context);
  const empty=vm.runInContext('candidateEmptyState()',h.context);
  assert.equal(empty.children[0].textContent, '名单已隐藏');
  const restore = empty.children[1].children[0];
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
  assert.equal(h.element('workspace-connection').hidden, false, 'real failures must still expose recovery');
  assert.equal(h.element('connection-actions').children[0].textContent, '重试连接');
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

const scoreSource = source.split('// BEGIN DISPLAY SCORE\n')[1].split('// END DISPLAY SCORE')[0];
const historySource = source.split('// BEGIN COMMUNICATION HISTORY\n')[1].split('// END COMMUNICATION HISTORY')[0];
const sourceFunction = (name) => source.split('\n').filter(line => line.startsWith(`function ${name}(`)).at(-1);

test('all displayed scores use 100 while preserving original partial points and coverage', () => {
  const context = vm.createContext({}); vm.runInContext(scoreSource, context);
  const partial = vm.runInContext('scoreForDisplay({score:56,scale:70,partial:true})', context);
  assert.equal(partial.score, 80); assert.equal(partial.scale, 100);
  assert.equal(partial.source_raw_score, 56); assert.equal(partial.source_scale, 70);
  assert.equal(partial.coverage, .7);
  const canonical = vm.runInContext('scoreForDisplay({score:80,scale:100,source_raw_score:56,source_scale:70,coverage:.7,is_partial:true})', context);
  assert.equal(canonical.score, 80, 'canonical backend score must not be normalized twice');
  assert.equal(vm.runInContext('scoreForDisplay({score:75,scale:100}).score', context), 75);
  assert.equal(vm.runInContext('scoreForDisplay({score:0,scale:70,partial:true}).score', context), 0);
  assert.equal(vm.runInContext('scoreForDisplay(null)', context), null);
  assert.match(vm.runInContext('scoreCoverageText(null)', context), /待评分/);
  assert.equal(vm.runInContext('scoreForDisplay({score:71,scale:70})', context), null);
  assert.equal(vm.runInContext('scoreForDisplay({score:1,scale:0})', context), null);
  assert.match(vm.runInContext('scoreCoverageText(scoreForDisplay({score:80,scale:100,is_policy_stale:true}))', context), /旧标准待复核/);
});

test('a partial 80/100 display does not silently apply the complete-resume interview threshold', () => {
  const context = vm.createContext({
    status: () => ({ label: '阶段待核' }), reviewIsStale: () => false, pendingReview: () => false,
    assignedRole: () => 'advisory_pm', latestAI: () => null, arr: value => value || [],
    plainCopy: value => value, personSentence: () => null, shortAnswer: value => value,
  });
  vm.runInContext(sourceFunction('scoreObject') + '\n' + sourceFunction('interviewAdvice') + `
    const interviewAdvicePolicy={fullResumeThreshold:70};
    const candidate={display_score:{score:80,scale:100},resume_score_ai:{role:'advisory_pm',score:56,scale:70,partial:true,dimensions:[{points:20,max_points:25},{points:20,max_points:25},{points:16,max_points:20}]}};
    globalThis.result=interviewAdvice(candidate,{interview:{label:'先问清',text:'材料需要补齐'},match:{text:'已有部分证据'}});
  `, context);
  assert.equal(context.result.label, '较不匹配');
  assert.match(context.result.policy, /原始分项/);
  vm.runInContext(sourceFunction('radarModel') + '\nglobalThis.axes=radarModel({review_standard_stale:true}).axes;', context);
  assert.equal(context.axes.length, 0, 'old points must not be plotted against a new rubric');
});

function historyHarness({ local = true } = {}) {
  const h = harness({ local });
  Object.assign(h.context, {
    arr: value => value == null ? [] : Array.isArray(value) ? value : [value],
    fmt: value => String(value), concise: value => String(value || ''), textOf: value => String(value || ''),
    reviewArrays: () => ({ post: [] }), digestText: async () => 'a'.repeat(64),
    TextEncoder,
    api: async () => ({}), candidateName: () => 'synthetic candidate',
  });
  vm.runInContext(historySource, h.context);
  return h;
}

test('interview stages require verified completed events, not appointments or a message timestamp', () => {
  const h = historyHarness();
  const stages = vm.runInContext(`communicationStageModel({communication_events:[
    {kind:'interviewed',status:'scheduled',evidence_verified:true,sent_at:'2026-11-01T12:00:00+08:00'},
    {kind:'second_interview',status:'completed',evidence_verified:false},
    {kind:'offer',status:'completed',evidence_verified:true}
  ]})`, h.context);
  assert.equal(stages[0].complete, false); assert.equal(stages[1].complete, false);
  assert.equal(stages[2].complete, true); assert.equal(stages[3].complete, false);
  assert.match(vm.runInContext("communicationTime('2026-11-01','day')", h.context), /具体时刻待核/);
});

test('main communication summary only attributes verified owner feedback to the named contacts', () => {
  const h = historyHarness();
  const panel = vm.runInContext(`communicationPanel({communication_events:[
    {kind:'post_interview_feedback',evidence_verified:true,sender_identity:'owner',contact:'王印',quote:'verified owner quote',sent_at:'2026-11-01',sent_at_precision:'day'},
    {kind:'post_interview_feedback',evidence_verified:true,sender_identity:'contact',contact:'王甜',quote:'contact quote must not be mine'},
    {kind:'post_interview_feedback',evidence_verified:false,sender_identity:'owner',contact:'王印',quote:'unverified quote'}
  ]},true)`, h.context);
  const texts = (element) => [element.textContent || '', ...element.children.flatMap(texts)];
  const rendered = texts(panel).join('\n');
  assert.match(rendered, /我 → 王印/); assert.match(rendered, /verified owner quote/);
  assert.doesNotMatch(rendered, /contact quote must not be mine|unverified quote/);
  assert.match(rendered, /面试时间待补/);
});

test('communication imports stay local, preserve evidence uncertainty and never derive interview time from sent_at', async () => {
  const publicPage = historyHarness({ local: false });
  await assert.rejects(vm.runInContext("importHistoryPayload('{}')", publicPage.context), /本机工作台/);
  const h = historyHarness(); h.context.engineConnected = true;
  let imported;
  h.context.api = async (path, payload) => {
    assert.equal(path, '/api/history/import'); imported = payload;
    return { messages_added: 1, events_added: 0, feedback_added: 0, pending_added: 1, duplicates: 0 };
  };
  vm.runInContext('refreshEngine=async()=>{};', h.context);
  h.context.raw = JSON.stringify({ schema_version: 1, records: [{
    message_id: 'synthetic-message', conversation_contact: '王印', sender: { identity: 'unknown', verified: false },
    sent_at: '2026-11-01T12:00:00+08:00', candidate_link_verified: false,
    events: [{ kind: 'post_interview_feedback', interview_at: null }],
  }] });
  await vm.runInContext('importHistoryPayload(raw)', h.context);
  assert.equal(imported.records[0].sender.verified, false);
  assert.equal(imported.records[0].candidate_link_verified, false);
  assert.equal(imported.records[0].events[0].interview_at, null);
  assert.equal(imported.period.from, '2023-11-04');
  assert.match(h.element('history-message').textContent, /1 条进入待核/);
});

test('locking the session discards a late communication-source response', async () => {
  const h = historyHarness(); h.context.engineConnected = true;
  h.element('history-dialog').showModal = () => {};
  let finish;
  h.context.api = () => new Promise(resolve => { finish = resolve; });
  const opening = vm.runInContext('openHistorySources()', h.context);
  h.context.sessionLocked = true; h.context.sessionEpoch++;
  finish({ communication_source_ledger: [{ id: 'private-source', label: 'must stay hidden' }], pending_communication_records: [{ quote: 'private pending evidence' }] });
  await opening;
  assert.equal(h.context.data.communication_source_ledger, undefined);
  assert.equal(h.element('history-pending').children.length, 0);
});

test('all three roles and four formal advisory pillars are available without exposing local import publicly', () => {
  for (const key of ['advisory_pm', 'ai_product', 'ai_business_operations']) {
    assert.match(source, new RegExp(`data-role-filter="${key}"`));
    assert.match(source, new RegExp(`data-requirements-role="${key}"`));
  }
  for (const id of ['wealth_allocation', 'research_metrics', 'data_governance', 'scenario_ai_quality']) assert.ok(source.includes(id));
  assert.match(source, /\$\('history-open'\)\.hidden=!isLoopback/);
});

test('recruitment portraits never manufacture a pattern from zero verified samples', () => {
  const h = historyHarness();
  h.context.data.recruitment_portraits = { advisory_pm: { sample_n: 0, professional_themes: ['unverified speculation'] } };
  const portrait = source.split('// BEGIN RECRUITMENT PORTRAITS\n')[1].split('// END RECRUITMENT PORTRAITS')[0];
  vm.runInContext(portrait, h.context);
  const model = vm.runInContext("recruitmentPortraitModel('advisory_pm')", h.context);
  assert.equal(model.count, 0); assert.equal(model.themes.length, 0);
  assert.equal(model.sources.length, 0);
});

test('recruitment portrait themes remain professional and independent from formal requirements', () => {
  const h = historyHarness();
  h.context.data.recruitment_portraits = { advisory_pm: {
    sample_n: 2, professional_themes: [{term:'资产配置产品交付',sample_n:2,evidence:[{candidate_id:'synthetic-record',locator:'第1段',quote:'synthetic resume quote'}]}, '性别偏好', '985名校', 'MBTI人格', '投研指标组织'],
    matched_candidate_ids: ['synthetic-record'], sources: [{ quote: '明确安排二面' }],
  } };
  const portrait = source.split('// BEGIN RECRUITMENT PORTRAITS\n')[1].split('// END RECRUITMENT PORTRAITS')[0];
  vm.runInContext(portrait, h.context);
  const model = vm.runInContext("recruitmentPortraitModel('advisory_pm')", h.context);
  assert.equal(model.count, 2);
  assert.equal(model.themes.join('|'), '资产配置产品交付|投研指标组织');
  assert.equal(model.themeEvidence.length, 1);
  assert.equal(model.sources.length, 1);
  assert.match(portrait, /岗位要求（独立标准）/);
  assert.match(portrait, /尚未验证能提高匹配率/);
});

test('unknown names use a sanitized source label without promoting it to a verified identity', () => {
  const context = vm.createContext({ sanitizeName: value => String(value).slice(0, 180) });
  vm.runInContext(sourceFunction('candidateIdentityName') + '\n' + sourceFunction('candidateName'), context);
  context.candidate = { name: '姓名待确认', display_label: '../../\u202e产品履历\u0000.pdf' };
  assert.equal(vm.runInContext('candidateName(candidate)', context), '产品履历 · 姓名待核');
  assert.equal(context.candidate.name, '姓名待确认');
  assert.equal(vm.runInContext("candidateName({name:'已核实姓名',display_label:'different filename.pdf'})", context), '已核实姓名');
});

test('a filename display label does not become a candidate-name search match', () => {
  const context = vm.createContext({
    sanitizeName: value => String(value).slice(0, 180),
    candidateSearchCompanies: () => [],
    unique: values => [...new Set(values)], arr: value => value || [],
  });
  for (const name of ['candidateIdentityName', 'candidateName', 'candidateSearchNames', 'normalizeSearch', 'candidateSearchMatch']) vm.runInContext(sourceFunction(name), context);
  assert.equal(vm.runInContext("candidateSearchMatch({name:'姓名待确认',display_label:'filename-person.pdf'},'filename-person')", context), null);
  assert.equal(vm.runInContext("candidateSearchMatch({name:'已核实姓名',display_label:'filename-person.pdf'},'已核实姓名').field", context), 'name');
});

test('a verified refusal document is visible without implying that an Offer was issued', () => {
  const h = historyHarness();
  const panel = vm.runInContext("communicationPanel({communication_events:[{kind:'declined_onboarding',status:'completed',sender_identity:'candidate',evidence_verified:true,quote:'synthetic refusal document'}]},true)", h.context);
  const texts = element => [element.textContent || '', ...element.children.flatMap(texts)];
  assert.match(texts(panel).join('\n'), /未入职／候选人婉拒/);
  const stages = vm.runInContext("communicationStageModel({communication_events:[{kind:'declined_onboarding',status:'completed',evidence_verified:true}]})", h.context);
  assert.equal(stages.find(stage => stage.label === 'Offer').complete, false);
  assert.equal(stages.find(stage => stage.label === '入职').complete, false);
});

test('raw chat JSON, calendar JSON and plain text go to automatic local extraction with their original content', async () => {
  for (const input of [
    JSON.stringify({messages:[{sender:'我',text:'synthetic raw message'}]}),
    JSON.stringify({events:[{summary:'synthetic interview',start:'2026-11-01T10:00:00+08:00'}]}),
    '2026-11-01 我：synthetic pasted conversation',
  ]) {
    const h = historyHarness(); h.context.engineConnected = true;
    let request;
    h.context.api = async (path,payload) => { request={path,payload}; return {messages_added:1,pending_added:1,extraction:{limitations:['身份待核']}}; };
    vm.runInContext('refreshEngine=async()=>{};', h.context);
    h.context.input = input;
    await vm.runInContext('importHistoryPayload(input)', h.context);
    assert.equal(request.path,'/api/history/extract');
    assert.equal(request.payload.content_text,input);
    assert.equal(request.payload.identity_context,undefined, 'the UI must not claim a verified sender from a display name');
    assert.match(h.element('history-message').textContent,/身份待核/);
  }
});

test('empty raw imports are rejected and the widget accepts both JSON and text', async () => {
  const h = historyHarness(); h.context.engineConnected = true;
  await assert.rejects(vm.runInContext("importHistoryPayload('   ')", h.context),/请先粘贴或选择/);
  assert.match(source,/id="history-file"[^>]*accept="\.txt,\.json,/);
  assert.match(source,/导入聊天／日程材料，自动提取/);
});

test('approved undated second interviews are visible without becoming completed interviews', () => {
  const h = historyHarness();
  const stage = vm.runInContext("communicationStageModel({communication_events:[{kind:'second_interview',status:'approved',evidence_verified:true,temporal_status:'undated',counts_in_period_statistics:false}]}).find(stage=>stage.label==='二面')", h.context);
  assert.equal(stage.complete,false); assert.equal(stage.approved,true); assert.equal(stage.datePending,true);
  assert.match(stage.text,/已获准／日期待核/);
});

test('generic native owner quotes retain group mention and unknown stage, not private-message or post-interview claims', () => {
  const h = historyHarness();
  const panel = vm.runInContext("communicationPanel({communication_events:[{kind:'owner_feedback',status:'completed',sender_identity:'owner',contact:'王甜',conversation_type:'group',conversation_name:'synthetic hiring group',recipient_contacts:['王甜'],sent_at:null,evidence_verified:true,quote:'synthetic owner group quote'}]},true)", h.context);
  const texts = element => [element.textContent || '', ...element.children.flatMap(texts)];
  const rendered=texts(panel).join('\n');
  assert.match(rendered,/我在群内 @王甜/); assert.match(rendered,/本人原话（阶段待核）/);
  assert.match(rendered,/synthetic hiring group/); assert.match(rendered,/发送时间待核/);
  assert.doesNotMatch(rendered,/我 → 王甜|面后反馈/);
});

test('only explicitly confirmed identity aliases participate in name search', () => {
  const context=vm.createContext({sanitizeName:String,unique:values=>[...new Set(values)],arr:value=>value||[],candidateSearchCompanies:()=>[]});
  for(const name of ['candidateIdentityName','candidateSearchNames','normalizeSearch','candidateSearchMatch'])vm.runInContext(sourceFunction(name),context);
  context.candidate={name:'canonical name',identity_aliases:[{name:'confirmed alias',confirmed_same_person:true},{name:'unverified alias',confirmed_same_person:false}]};
  assert.equal(vm.runInContext("candidateSearchMatch(candidate,'confirmed alias').field",context),'name');
  assert.equal(vm.runInContext("candidateSearchMatch(candidate,'unverified alias')",context),null);
});

test('an undated approved portrait sample retains unknown period coverage', () => {
  const h=historyHarness();
  h.context.data.recruitment_portraits={advisory_pm:{sample_n:1,dated_sample_n:0,undated_sample_n:1,period_unknown_sample_n:1,date_coverage:{from:null,to:null},professional_themes:[{term:'professional synthetic theme'}]}};
  const portrait=source.split('// BEGIN RECRUITMENT PORTRAITS\n')[1].split('// END RECRUITMENT PORTRAITS')[0];
  vm.runInContext(portrait,h.context);
  const model=vm.runInContext("recruitmentPortraitModel('advisory_pm')",h.context);
  assert.equal(model.count,1);assert.equal(model.dated,0);assert.equal(model.undated,1);assert.equal(model.periodUnknown,1);
  assert.equal(model.dateCoverage.from,null);assert.equal(model.dateCoverage.to,null);
});

test('months remain source data without an automatically visible or hidden active list filter', () => {
  const h=harness();
  h.context.data={candidates:[{id:'newer',first_received_month:'2026-10'},{id:'older',first_received_month:'2025-03'}]};
  const before=JSON.stringify(h.context.data);
  h.element('month-filter').value='2025-03';
  h.context.metricFilter='all';h.context.selected='older';
  vm.runInContext(sourceFunction('renderMonthFilter')+'\nrenderMonthFilter();',h.context);
  assert.equal(h.element('month-filter').hidden,true);
  assert.equal(h.element('month-filter').value,'all','the removed control must not leave an invisible restriction');
  assert.equal(JSON.stringify(h.context.data),before,'source dates and their order remain unchanged');
});

test('score badges show only the points while details retain scale, source, partial coverage and old-standard context', () => {
  const h=harness();
  vm.runInContext(scoreSource+'\n'+sourceFunction('latestScore')+'\n'+sourceFunction('scoreBadge'),h.context);
  h.context.assignedRole=()=> 'advisory_pm';
  h.context.openScoreEditor=()=>{};
  let badge=vm.runInContext("scoreBadge({display_score:{score:82.9,scale:100,stage:'post_interview',source:'用户面后评价'}})",h.context);
  assert.equal(badge.textContent,'82.9分');
  assert.match(badge.title,/面后/);assert.match(badge.title,/用户面后评价/);assert.match(badge.title,/原始 82.9\/100/);
  badge=vm.runInContext("scoreBadge({review_standard_stale:true,display_score:{score:79,scale:100,source_raw_score:55.3,source_scale:70,coverage:.7,is_partial:true,source:'AI履历分析'}})",h.context);
  assert.equal(badge.textContent,'79分');
  assert.match(badge.title,/原始 55.3\/70/);assert.match(badge.title,/已评权重70%/);assert.match(badge.title,/旧标准待复核/);
  assert.equal(vm.runInContext('scoreBadge({display_score:null}).textContent',h.context),'待评分');
});

test('the selected candidate heading contains the compact score without a separate technical coverage line', () => {
  const h=harness();h.context.engineConnected=true;
  Object.assign(h.context,{
    uploadActive:false,detailRenderSignature:'',assignedRole:()=> 'advisory_pm',scoreMechanism:()=>null,
    clearResumeFrames(){},threePoint:()=>null,reviewJob:()=>({}),reviewIsStale:()=>false,
    candidateName:()=> 'synthetic candidate',status:()=>({label:'阶段待核'}),pendingReview:()=>false,
    changeMetadata(){},retryReview(){},openFeedback(){},openMaterials(){},
    personSentence:()=>null,interviewAdvice:()=>null,profileFacts:()=>null,radarPanel:()=>null,
    communicationPanel:()=>null,resumePanel:()=>new Element('section'),worksPanel:()=>null,
    append:(parent,...children)=>parent.append(...children),
  });
  vm.runInContext(scoreSource+'\n'+sourceFunction('latestScore')+'\n'+sourceFunction('scoreBadge')+'\n'+sourceFunction('renderDetail'),h.context);
  vm.runInContext("renderDetail({id:'synthetic-record',display_score:{score:79,scale:100}})",h.context);
  const identity=h.element('candidate-detail').children[0].children[0].children[0];
  assert.equal(identity.children.length,1,'the profile title must not gain a second technical line');
  assert.equal(identity.children[0].children[1].textContent,'79分');
});
