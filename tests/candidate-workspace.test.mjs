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
  showModal() { this.open=true; }
  close() { this.open=false; }
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
    openUnlock() { stats.unlocks++; }, renderMonthFilter() {}, renderHiringMetrics() {},canManageProgress:()=>false,manualProgressState:()=>null,resetProgressEditor(){},
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
const sourceFunction = (name) => {
  const lines=source.split('\n');
  const start=lines.findLastIndex(line=>line.startsWith(`function ${name}(`)||line.startsWith(`async function ${name}(`));
  if(start<0)throw Error('Missing function: '+name);
  if(lines[start].endsWith('}'))return lines[start];
  const end=lines.findIndex((line,index)=>index>start&&line==='}');
  return lines.slice(start,end+1).join('\n');
};

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

test('a partial 80/100 display does not silently satisfy the required evidence coverage', () => {
  const context = decisionHarness();
  context.mechanism.dimensions=[{id:'a',weight:25},{id:'b',weight:25},{id:'c',weight:20},{id:'d',weight:30}];
  context.candidate={display_score:{score:80,scale:100},resume_score_ai:{role:'advisory_pm',mechanism_version:'current-v3',score:56,scale:70,partial:true,dimensions:[{id:'a',points:20,max_points:25},{id:'b',points:20,max_points:25},{id:'c',points:16,max_points:20}]}};
  vm.runInContext('globalThis.result=interviewAdvice(candidate);',context);
  assert.equal(context.result.label, '待补证据');
  assert.match(context.result.reason, /70%/);
  vm.runInContext(sourceFunction('aiReviewStandardStale')+'\n'+sourceFunction('radarModel') + '\nglobalThis.axes=radarModel({review_standard_stale:true}).axes;', context);
  assert.equal(context.axes.length, 0, 'old points must not be plotted against a new rubric');
});

const progressSource=source.split('// BEGIN MANUAL PROGRESS\n')[1].split('// END MANUAL PROGRESS')[0];
const decisionSource=source.split('// BEGIN RESUME DECISION POLICY\n')[1].split('// END RESUME DECISION POLICY')[0];
function decisionHarness(){
  const context=vm.createContext({
    status:()=>({label:'阶段待核'}),reviewIsStale:c=>!!(c.review_standard_stale||c.review_feedback_stale),pendingReview:()=>false,
    assignedRole:()=> 'advisory_pm',arr:value=>value==null?[]:Array.isArray(value)?value:[value],unique:values=>[...new Set(values)],requirementsData:null,threePoint:()=>null,
    mechanism:{version:'current-v3',dimensions:[20,20,20,15,15,10].map((weight,index)=>({id:'d'+index,weight})),decision_policy:{full_resume_threshold:70,min_coverage:1,critical_dimensions:[],source_note:'工作规则；未验证统计最优'}},
  });
  context.scoreMechanism=()=>context.mechanism;
  vm.runInContext(scoreSource+'\n'+sourceFunction('scoreOrigin')+'\n'+decisionSource,context);
  return context;
}

function historyHarness({ local = true } = {}) {
  const h = harness({ local });
  Object.assign(h.context, {
    arr: value => value == null ? [] : Array.isArray(value) ? value : [value],
    fmt: value => String(value), concise: value => String(value || ''), textOf: value => String(value || ''),
    reviewArrays: candidate => ({ pre:[...(candidate.human_pre_interview||[]),...(candidate.human_reviews||[]).filter(row=>row.stage==='before')],post:[...(candidate.human_post_interview||[]),...(candidate.human_reviews||[]).filter(row=>row.stage==='after')],unknown:(candidate.human_reviews||[]).filter(row=>!['before','after'].includes(row.stage)) }), uncertainEvidence:()=>[],unique:values=>[...new Set(values)],digestText: async () => 'a'.repeat(64),
    TextEncoder,
    api: async () => ({}), candidateName: () => 'synthetic candidate',
  });
  vm.runInContext(sourceFunction('latestAIRecord')+'\n'+sourceFunction('aiReviewStandardStale')+'\n'+sourceFunction('stateCode')+'\n'+progressSource+'\n'+historySource, h.context);
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
  assert.doesNotMatch(rendered, /unverified quote/);
  assert.doesNotMatch(panel.children[1].children[0].textContent,/我 →|我在群内/);
  assert.doesNotMatch(rendered, /面试时间待补/);
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

test('unknown names stay pending and source filenames are not promoted to identity', () => {
  const context = vm.createContext({ sanitizeName: value => String(value).slice(0, 180),arr:value=>value==null?[]:Array.isArray(value)?value:[value] });
  vm.runInContext(sourceFunction('chineseIdentityName')+'\n'+sourceFunction('candidateIdentityName') + '\n' + sourceFunction('candidateName'), context);
  context.candidate = { name: '姓名待确认', display_label: '../../\u202e产品履历\u0000.pdf' };
  assert.equal(vm.runInContext('candidateName(candidate)', context), '姓名待核');
  assert.equal(context.candidate.name, '姓名待确认');
  assert.equal(vm.runInContext("candidateName({name:'已核实姓名',display_label:'different filename.pdf'})", context), '已核实姓名');
});

test('a filename display label does not become a candidate-name search match', () => {
  const context = vm.createContext({
    sanitizeName: value => String(value).slice(0, 180),
    candidateSearchCompanies: () => [],
    unique: values => [...new Set(values)], arr: value => value || [],
  });
  for (const name of ['chineseIdentityName','candidateIdentityName', 'candidateName', 'candidateSearchNames', 'normalizeSearch', 'candidateSearchMatch']) vm.runInContext(sourceFunction(name), context);
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
  for(const name of ['chineseIdentityName','candidateIdentityName','candidateSearchNames','normalizeSearch','candidateSearchMatch'])vm.runInContext(sourceFunction(name),context);
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
  vm.runInContext(scoreSource+'\n'+sourceFunction('latestScore')+'\n'+sourceFunction('scoreOrigin')+'\n'+sourceFunction('scoreBadge'),h.context);
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
  vm.runInContext(scoreSource+'\n'+sourceFunction('latestScore')+'\n'+sourceFunction('scoreOrigin')+'\n'+sourceFunction('scoreBadge')+'\n'+sourceFunction('renderDetail'),h.context);
  vm.runInContext("renderDetail({id:'synthetic-record',display_score:{score:79,scale:100}})",h.context);
  const identity=h.element('candidate-detail').children[0].children[0].children[0];
  assert.equal(identity.children.length,1,'the profile title must not gain a second technical line');
  assert.equal(identity.children[0].children[1].textContent,'79分');
});

const listSource=source.split('// BEGIN CANDIDATE LIST PRESENTATION\n')[1].split('// END CANDIDATE LIST PRESENTATION')[0];
function listHarness(){
  const h=historyHarness();
  Object.assign(h.context,{
    unique:values=>[...new Set(values)],assignedRole:()=> 'advisory_pm',assignedRoleName:()=> 'AI投顾产品',
    reviewIsStale:()=>false,pendingReview:()=>false,threePoint:()=>null,interviewAdvice:()=>null,
    reviewArrays:()=>({pre:[],post:[],unknown:[]}),status:()=>({label:'阶段待核'}),
  });
  for(const name of ['factText','normalizeSearch','shortCompany','candidateSearchCompanies','scoreObject'])vm.runInContext(sourceFunction(name),h.context);
  vm.runInContext(listSource+'\n'+scoreSource+'\n'+sourceFunction('latestScore')+'\n'+sourceFunction('scoreBadge'),h.context);
  return h;
}
const elementText=element=>[element.textContent||'',...element.children.flatMap(elementText)].join('\n');

test('source-backed Chinese identity outranks metadata filenames and unverified filename hints stay hidden',()=>{
  const h=listHarness();
  h.context.candidate={name:'product_12years_12345.pdf',identity_status:'filename_label_unverified',display_label:'filename-name.pdf',identity_evidence:{name:'周示例',sha256:'a'.repeat(64),quote:'synthetic header'}};
  assert.equal(vm.runInContext('candidateName(candidate)',h.context),'周示例');
  assert.equal(vm.runInContext("candidateName({name:'product_12years.pdf',identity_status:'filename_label_unverified',profile_facts:{verified_name:'林示例'}})",h.context),'林示例');
  assert.equal(vm.runInContext("candidateName({name:'李示例_10年.pdf',identity_status:'filename_label_unverified',display_label:'李示例_10年.pdf'})",h.context),'姓名待核');
  assert.equal(vm.runInContext("candidateName({name:'王示例',identity_status:'user_confirmed',historical_name_evidence:{name:'旧示例',sha256:'a'.repeat(64)}})",h.context),'王示例');
});

test('recent company chips use dated employment fields, deduplicate and never substitute software skills',()=>{
  const h=listHarness();
  h.context.candidate={profile_facts:{work_history:[
    {company:'Python',start:'2025-01',end:'至今'},
    {company:'示例乙有限责任公司',start:'2017-01',end:'2020-12'},
    {company:'示例甲有限公司',start:'2023-01',end:'至今'},
    {company:'示例甲',start:'2021-01',end:'2022-12'},
    {company:'示例丙有限公司',start:'2014-01',end:'2016-12'},
  ]}};
  const companies=vm.runInContext('recentCompanyNames(candidate)',h.context);
  assert.equal(companies.map(item=>item.short).join('|'),'示例甲|示例乙');
  assert.equal(companies[0].full,'示例甲有限公司');
});

test('profile chips show only sourced age/location and the highest completed degree with its own major',()=>{
  const h=listHarness();
  h.context.candidate={profile_facts:{age:36,current_location:'示例城市',evidence:[
    {field:'age',sha256:'a',quote:'synthetic stated age'},
    {field:'current_location',sha256:'a',quote:'synthetic stated city'},
  ],education:[
    {degree:'硕士',status:'在读',major:'在读专业',sha256:'a',quote:'synthetic ongoing degree'},
    {degree:'本科',major:'示例学科',sha256:'a',quote:'synthetic completed undergraduate degree'},
  ]}};
  const chips=vm.runInContext('candidateProfileChips(candidate)',h.context);
  assert.equal(chips.map(item=>item.text).join('|'),'36岁|示例城市|本科|示例学科');
  assert.equal(vm.runInContext('candidateProfileChips({profile_facts:{age:36,current_location:"unsourced"}}).length',h.context),0);
});

test('career keywords exclude demographic, school-tier and personality features',()=>{
  const h=listHarness();
  h.context.candidate={name:'林示例',career_tags:['36岁','男性','已婚','985','INTJ','优秀','资产配置','RAG','产品设计','其他主题']};
  assert.equal(vm.runInContext('candidateCareerKeywords(candidate).join("|")',h.context),'资产配置|RAG|产品设计');
  assert.equal(vm.runInContext("candidateCareerKeywords({profile_facts:{career_tags:['履历职业主题']},concise_view:{tags:['AI建议性主题']}}).join('|')",h.context),'履历职业主题');
});

test('AI recommendations and source-backed recruitment states remain separate, with no default interview state',()=>{
  const h=listHarness();
  h.context.interviewAdvice=()=>({label:'建议面试',type:'blue',reason:'a long reason must stay in detail'});
  assert.equal(vm.runInContext('candidateAdviceTag({}).text',h.context),'建议面试');
  assert.equal(vm.runInContext("candidateActualState({status:'interviewed'})",h.context),null);
  const state=vm.runInContext("candidateActualState({communication_events:[{kind:'second_interview',status:'approved',evidence_verified:true}]})",h.context);
  assert.match(state.text,/复面已获准.*日期待核/);
  assert.equal(vm.runInContext("candidateActualState({communication_events:[{kind:'offer',status:'completed',offer_stage:'issued',evidence_verified:true},{kind:'offer',status:'completed',offer_stage:'accepted',evidence_verified:true}]}).text",h.context),'已接受Offer');
  assert.equal(vm.runInContext("candidateActualState({communication_events:[{kind:'offer',status:'completed',evidence_verified:true}]}).text",h.context),'已发Offer');
  h.context.reviewIsStale=()=>true;
  assert.equal(vm.runInContext('candidateAdviceTag({})',h.context),null);
});

test('card hierarchy keeps name/role/colored score compact and puts facts and companies on separate rows',()=>{
  const h=listHarness();
  h.context.candidate={name:'林示例',display_score:{score:82.9,scale:100,origin:'ai'},profile_facts:{work_history:[{company:'示例甲有限公司',end:'至今'},{company:'示例乙有限公司',end:'2020-01'}]},career_tags:['产品设计']};
  const main=vm.runInContext('candidateListMain(candidate)',h.context);
  assert.equal(main.children[0].textContent,'林示例');assert.equal(main.children[1].textContent,'AI投顾产品');
  assert.equal(main.children[2].textContent,'82.9分');assert.match(main.children[2].className,/score-origin-ai/);
  const context=vm.runInContext('candidateListContext(candidate)',h.context);
  const companyRow=context.children.find(row=>row.className==='candidate-company-row');
  assert.match(companyRow.children[0].className,/company-order-0/);assert.match(companyRow.children[1].className,/company-order-1/);
  assert.doesNotMatch(elementText(context),/a long reason/);
  const manual=vm.runInContext("scoreBadge({display_score:{score:79,scale:100,origin:'manual',is_manual:true}})",h.context);
  assert.match(manual.className,/score-origin-manual/);assert.match(manual.title,/手动评分/);
});

test('manual scoring sends only the captured score context and reports the real calibration result',async()=>{
  const h=listHarness();h.context.engineConnected=true;
  const candidate={id:'synthetic-record',name:'林示例',display_score:{score:75,scale:100,stage:'resume',origin:'ai'},score_edit_context:{token:'opened-context'},profile_facts:{age:36,education:[{degree:'本科'}]}};
  h.context.data={candidates:[candidate]};h.context.document.querySelectorAll=()=>[];
  h.context.renderCandidates=()=>{};h.context.renderMaterials=()=>{};
  let request;
  h.context.api=async(path,payload)=>{request={path,payload};return {calibration_result:{status:'updated',sample_n:1}};};
  vm.runInContext('refreshEngine=async()=>{};\n'+sourceFunction('changeMetadata')+'\n'+sourceFunction('renderScoreEditor')+'\n'+sourceFunction('openScoreEditor'),h.context);
  const handlerLine=source.split('\n').find(line=>line.includes("$('score-form').addEventListener('submit'"));
  const handler=handlerLine.slice(handlerLine.indexOf("$('score-form').addEventListener('submit'"));
  vm.runInContext(handler,h.context);
  h.context.candidate=candidate;vm.runInContext('openScoreEditor(candidate)',h.context);
  candidate.score_edit_context.token='background-refresh-context';
  h.element('score-value').value='83';
  await h.element('score-form').handlers.submit({preventDefault(){}});
  assert.equal(request.path,'/api/metadata');assert.equal(request.payload.resume_score,83);
  assert.equal(request.payload.score_context_token,'opened-context');
  assert.equal(Object.keys(request.payload).sort().join('|'),'candidate_id|resume_score|score_context_token');
  assert.match(h.stats.toasts.at(-1)[0],/校准已更新/);
  assert.equal(h.element('score-dialog').open,false);
});

test('manual scoring never claims calibration when the server marks it ineligible',()=>{
  const h=listHarness();
  const copy=vm.runInContext("scoreSaveMessage({status:'not_eligible',reason_text:'没有同阶段AI基准'})",h.context);
  assert.match(copy,/分数已保存/);assert.match(copy,/没有同阶段AI基准/);assert.doesNotMatch(copy,/已更新|已调优/);
  assert.equal(vm.runInContext('scoreSaveMessage(null)',h.context),'分数已保存。');
});

test('recruitment statistics use English labels and no people or document units',()=>{
  const block=source.split('<div class="hiring-metrics">')[1].split('</div><p class="metrics-note"')[0];
  for(const [key,label]of Object.entries({resume:'Resume',interviewed:'Interview',follow_up:'Interview 2',offer:'Offer',onboard:'Joined',pass:'Pass',reject:'Reject',pending:'Hold'})){
    const button=block.match(new RegExp('<button[^>]*data-metric-filter="'+key+'"[\\s\\S]*?</button>'))[0];
    assert.ok(button.includes('<span>'+label+'</span>'));assert.ok(button.includes('aria-label="'+label+'"'));
  }
  assert.doesNotMatch(block,/<small>|份|人/);
});

test('Joined keeps actual onboarding semantics and accessible numeric counts have no units',()=>{
  const h=harness(),keys=['resume','interviewed','follow_up','offer','onboard','pass','reject','pending'];
  const buttons=keys.map(key=>{const button=new Element('button');button.dataset.metricFilter=key;return button});
  h.context.document.querySelectorAll=()=>buttons;h.context.metricFilter='all';h.context.uiMetricsScope='all|all';
  h.context.data.hiring_metrics={total_documents:5,viewed_documents:4,interviewed_people:3,follow_up_people:2,offer_people:2,onboard_people:1,pending_people:0,pass_people:2,reject_people:1,candidate_ids_by_metric:Object.fromEntries(keys.map(key=>[key,[]]))};
  vm.runInContext(sourceFunction('hiringMetricLabel')+'\n'+sourceFunction('metricCount')+'\n'+sourceFunction('metricCandidateIds')+'\n'+sourceFunction('renderHiringMetrics')+'\nrenderHiringMetrics();',h.context);
  assert.equal(h.element('metric-offer').textContent,'2');assert.equal(h.element('metric-onboard').textContent,'1');
  assert.equal(buttons.find(button=>button.dataset.metricFilter==='onboard')['aria-label'],'Joined 1');
  assert.ok(buttons.every(button=>!/份|人/.test(button['aria-label'])));
});

test('the list total renders only a number while recommendation titles identify manual-score rules',()=>{
  const h=listHarness();
  Object.assign(h.context,{renderMonthFilter(){},activeMetricIds:()=>null,metricFilter:'all',uiMetricsScope:'all|all',initialCandidateSelected:false,selected:null,resetListScroll:false,renderDetail(){},filterScope:()=> 'all|all'});
  h.context.document.querySelectorAll=()=>[];h.context.document.activeElement={};h.element('candidate-list').scrollTop=0;
  h.context.data={candidates:[{id:'synthetic-record',name:'林示例',display_score:null}]};h.element('role-filter').value='all';
  vm.runInContext(sourceFunction('renderCandidates')+'\nrenderCandidates();',h.context);
  assert.equal(h.element('filtered-count').textContent,'1');
  h.context.interviewAdvice=()=>({label:'建议面试',type:'blue',origin:'manual'});
  assert.match(vm.runInContext('candidateAdviceTag({}).title',h.context),/基于人工评分的建议/);
  h.context.interviewAdvice=()=>({label:'建议面试',type:'blue',origin:'ai'});
  assert.match(vm.runInContext('candidateAdviceTag({}).title',h.context),/^AI建议/);
});

test('six current rubric dimensions are complete and frozen AI calibration can cross the interview threshold',()=>{
  const context=decisionHarness();
  context.candidate={resume_score_ai:{role:'advisory_pm',mechanism_version:'current-v3',score:60,scale:100,dimensions:context.mechanism.dimensions.map(d=>({id:d.id,points:d.weight*.6,max_points:d.weight})),calibration:{applied_score:80,version_id:'frozen-model'}}};
  let advice=vm.runInContext('interviewAdvice(candidate)',context);
  assert.equal(advice.label,'建议面试');assert.match(advice.reason,/80/);assert.equal(advice.origin,'ai');
  context.mechanism.decision_policy.full_resume_threshold=85;
  advice=vm.runInContext('interviewAdvice(candidate)',context);
  assert.equal(advice.label,'暂不优先面试');assert.match(advice.policy,/85/);
});

test('partial normalized scores need explicit coverage and critical-dimension evidence',()=>{
  const context=decisionHarness();
  context.candidate={resume_score_ai:{role:'advisory_pm',mechanism_version:'current-v3',score:81,scale:90,partial:true,dimensions:context.mechanism.dimensions.slice(0,5).map(d=>({id:d.id,points:d.weight*.9,max_points:d.weight}))}};
  assert.equal(vm.runInContext('interviewAdvice(candidate).label',context),'待补证据');
  context.mechanism.decision_policy.min_coverage=.8;
  context.mechanism.decision_policy.critical_dimensions=[{id:'d5',min_ratio:.5,required:true}];
  assert.equal(vm.runInContext('interviewAdvice(candidate).label',context),'待补证据');
  context.mechanism.decision_policy.critical_dimensions=[{id:'d0',min_ratio:.5,required:true}];
  assert.equal(vm.runInContext('interviewAdvice(candidate).label',context),'建议面试');
});

test('post-interview manual totals never replace the resume score used for interview advice',()=>{
  const context=decisionHarness();
  const dimensions=context.mechanism.dimensions.map(d=>({id:d.id,points:d.weight*.6,max_points:d.weight}));
  context.candidate={display_score:{score:100,scale:100,stage:'post_interview',origin:'manual'},post_interview_score:{score:100,scale:100,origin:'manual'},resume_score_ai:{role:'advisory_pm',mechanism_version:'current-v3',score:60,scale:100,dimensions}};
  let advice=vm.runInContext('interviewAdvice(candidate)',context);
  assert.equal(advice.label,'暂不优先面试');assert.equal(advice.origin,'ai');
  context.candidate.resume_score={score:80,scale:100,source:'用户调整',origin:'manual',mechanism_version:'current-v3',role:'advisory_pm'};
  advice=vm.runInContext('interviewAdvice(candidate)',context);
  assert.equal(advice.label,'建议面试');assert.equal(advice.origin,'manual');
});

test('the canonical resume recommendation wins and stale rule versions cannot show current advice',()=>{
  const context=decisionHarness();
  context.candidate={display_score:{score:100,stage:'post_interview'},resume_recommendation:{status:'needs_evidence',label:'待补证据',reason:'canonical coverage check',score_origin:'manual',rubric_version:'current-v3'}};
  assert.equal(vm.runInContext('interviewAdvice(candidate).reason',context),'canonical coverage check');
  context.candidate.resume_recommendation.rubric_version='old-v2';
  assert.equal(vm.runInContext('interviewAdvice(candidate)',context),null);
});

test('empty feedback categories do not render and filled categories remain separately editable',()=>{
  const h=historyHarness();h.context.engineConnected=true;
  h.context.candidate={feedback_notes:{resume:{text:'履历专业判断'},interview:{text:''},hr:{text:'人力补充'},other:{text:'  '}}};
  const panel=vm.runInContext('feedbackNotesPanel(candidate)',h.context);
  const text=elementText(panel);
  assert.match(text,/履历评价/);assert.match(text,/人力评价/);assert.doesNotMatch(text,/面试评价|其他补充/);
  assert.equal(panel.children.length,2);assert.equal(panel.children[0].children[0].children[1].textContent,'编辑');
  assert.equal(vm.runInContext('feedbackNotesPanel({feedback_notes:{}})',h.context),null);
});

test('editing imported communication saves a new note revision while the original remains unchanged',async()=>{
  const h=historyHarness();h.context.engineConnected=true;
  const original=Object.freeze({id:'source-event',source_id:'source-ledger',quote:'original source wording',kind:'post_interview_feedback',sender_identity:'owner',contact:'王印',evidence_verified:true});
  const candidate={id:'synthetic-record',feedback_notes:{interview:{text:'old manual note',revision_id:'revision-1'}},feedback_note_history:[{category:'interview',text:'old manual note',revision_id:'revision-1'}],communication_events:[original]};
  h.context.data={candidates:[candidate]};h.context.candidate=candidate;
  let saved,sequence=1;h.context.api=async(path,payload)=>{assert.equal(path,'/api/notes');saved=payload;const revision='revision-'+(++sequence);candidate.feedback_notes[payload.category]={text:payload.text,revision_id:revision};candidate.feedback_note_history.push({...payload,revision_id:revision});return {revision_id:revision,memory_version:sequence,updated_context:true,review_requested:true};};
  vm.runInContext('refreshEngine=async()=>{};',h.context);
  vm.runInContext("openFeedbackNotes(candidate,'interview',{record_id:'source-event',source_id:'source-ledger',kind:'communication_event',text:'original source wording'})",h.context);
  h.element('notes-text').value='manual revised wording';
  await vm.runInContext('saveFeedbackNote()',h.context);
  assert.equal(saved.previous_revision_id,'revision-1');assert.equal(saved.request_review,true);assert.equal(saved.source_reference.record_id,'source-event');
  assert.equal(original.quote,'original source wording');assert.equal(candidate.feedback_note_history[0].text,'old manual note');
  assert.match(h.element('notes-message').textContent,/正在重新评价/);
  h.element('notes-text').value='';await vm.runInContext('saveFeedbackNote()',h.context);
  assert.equal(saved.previous_revision_id,'revision-2');assert.equal(candidate.feedback_notes.interview.text,'');
  assert.equal(candidate.feedback_note_history.length,3);
});

test('feedback save messages distinguish queued review from context-only and excluded content',()=>{
  const h=historyHarness();
  assert.match(vm.runInContext('feedbackNoteSaveMessage({updated_context:true,review_requested:false})',h.context),/后续评价依据/);
  assert.doesNotMatch(vm.runInContext('feedbackNoteSaveMessage({updated_context:true,review_requested:false})',h.context),/正在重新评价/);
  assert.match(vm.runInContext('feedbackNoteSaveMessage({updated_context:true,professional_context_included:false})',h.context),/未将该内容作为能力评分依据/);
});

const rubricSource=source.split('// BEGIN RUBRIC EDITING\n')[1].split('// END RUBRIC EDITING')[0];
function rubricHarness(){
  const h=historyHarness();h.context.engineConnected=true;
  Object.assign(h.context,{ROLE_LABELS:{advisory_pm:'AI投顾产品'},requirementsData:{roles:{advisory_pm:{current_rubric_version:'rules-1',resume_score_mechanism:{version:'rules-1',dimensions:[{id:'first',label:'第一职业能力',weight:50,criteria:'first criterion'},{id:'second',label:'第二职业能力',weight:50,criteria:'second criterion'}]},rubric_versions:[{version_id:'rules-1',dimensions:[{id:'first',weight:50},{id:'second',weight:50}]}]}}},loadRequirements:async()=>{}});
  h.context.scoreMechanism=role=>h.context.requirementsData.roles[role].resume_score_mechanism;
  vm.runInContext(decisionSource+'\n'+rubricSource+'\nrefreshEngine=async()=>{};',h.context);
  return h;
}

test('rubric validation requires 2–12 unique professional dimensions and positive weights totaling 100',()=>{
  const h=rubricHarness();
  assert.equal(vm.runInContext("validateRubricDimensions([{id:'a',label:'A',weight:60,criteria:'ability A'},{id:'b',label:'B',weight:40,criteria:'ability B'}]).length",h.context),2);
  assert.throws(()=>vm.runInContext("validateRubricDimensions([{id:'a',label:'A',weight:51,criteria:'A'},{id:'b',label:'B',weight:50,criteria:'B'}])",h.context),/合计必须为100/);
  assert.throws(()=>vm.runInContext("validateRubricDimensions([{id:'a',label:'A',weight:100,criteria:'A'},{id:'b',label:'B',weight:0,criteria:'B'}])",h.context),/大于0/);
  assert.throws(()=>vm.runInContext("validateRubricDimensions([{id:'a',label:'A',weight:50,criteria:'A'},{id:'a',label:'B',weight:50,criteria:'B'}])",h.context),/唯一/);
  assert.throws(()=>vm.runInContext("validateDecisionPolicy({full_resume_threshold:70,min_coverage:1,critical_dimensions:[{id:'missing',min_ratio:.5}]},[{id:'a'}])",h.context),/关键项/);
});

test('editing rules creates a new version with decision policy and preserves the old version data',async()=>{
  const h=rubricHarness(),before=JSON.stringify(h.context.requirementsData.roles.advisory_pm.rubric_versions[0]);
  vm.runInContext("openRubricEditor('advisory_pm');rubricDraft[0].weight=60;rubricDraft[1].weight=40;",h.context);
  h.element('rubric-threshold').value='75';h.element('rubric-coverage').value='90';
  let posted;h.context.api=async(path,payload)=>{assert.equal(path,'/api/requirements');if(!payload)return {requirements:h.context.requirementsData};posted=payload;return {version_id:'rules-2'};};
  await vm.runInContext('saveRubric()',h.context);
  assert.equal(posted.action,'set_rubric');assert.equal(posted.previous_version_id,'rules-1');assert.equal(posted.dimensions[0].weight,60);assert.equal(posted.decision_policy.full_resume_threshold,75);assert.equal(posted.decision_policy.min_coverage,.9);
  assert.equal(JSON.stringify(h.context.requirementsData.roles.advisory_pm.rubric_versions[0]),before);
});

test('a concurrent rules revision is not silently overwritten',async()=>{
  const h=rubricHarness();vm.runInContext("openRubricEditor('advisory_pm')",h.context);
  let writes=0;h.context.api=async(path,payload)=>{if(payload){writes++;return {}}return {requirements:{roles:{advisory_pm:{current_rubric_version:'rules-newer'}}}};};
  await assert.rejects(vm.runInContext('saveRubric()',h.context),/标准已更新/);
  assert.equal(writes,0);
});

test('a critical-dimension threshold prompts verification rather than declaring mismatch even when the total is high',()=>{
  const context=decisionHarness();context.mechanism.decision_policy.critical_dimensions=[{id:'d0',min_ratio:.5,required:true}];
  context.candidate={resume_score_ai:{role:'advisory_pm',mechanism_version:'current-v3',score:80,scale:100,dimensions:context.mechanism.dimensions.map((d,index)=>({id:d.id,points:index===0?5:d.weight*.9375,max_points:d.weight}))}};
  const advice=vm.runInContext('interviewAdvice(candidate)',context);
  assert.equal(advice.label,'待补证据');assert.match(advice.reason,/补证或初聊核验/);
});

test('feedback and rubric writes are unavailable from public pages',async()=>{
  const notes=historyHarness({local:false});notes.context.engineConnected=true;
  await assert.rejects(vm.runInContext('saveFeedbackNote()',notes.context),/本机工作台/);
  const rules=rubricHarness();rules.context.isLoopback=false;
  await assert.rejects(vm.runInContext('saveRubric()',rules.context),/本机工作台/);
});

test('a late feedback response does not restore private editor state after locking',async()=>{
  const h=historyHarness();h.context.engineConnected=true;h.context.candidate={id:'synthetic-record',feedback_notes:{}};h.context.data={candidates:[h.context.candidate]};
  vm.runInContext("openFeedbackNotes(candidate,'resume')",h.context);h.element('notes-text').value='private synthetic note';
  let finish;h.context.api=()=>new Promise(resolve=>{finish=resolve});
  const saving=vm.runInContext('saveFeedbackNote()',h.context);h.context.sessionLocked=true;h.context.sessionEpoch++;
  h.element('notes-message').textContent='';finish({revision_id:'late-revision',updated_context:true,review_requested:true});await saving;
  assert.equal(h.element('notes-message').textContent,'');
});

test('rubric anchor edits are explicit and do not mutate prior anchor records',()=>{
  const h=rubricHarness(),old={level:1,score_fraction:.25,description:'old professional anchor'};
  h.context.requirementsData.roles.advisory_pm.resume_score_mechanism.dimensions[0].anchors=[old];
  vm.runInContext("openRubricEditor('advisory_pm');rubricDraft[0].anchors[0].description='updated professional anchor';rubricDraft[0].anchors_dirty=true;globalThis.cleanDimensions=validateRubricDimensions(rubricDraft);",h.context);
  assert.equal(h.context.cleanDimensions[0].anchors[0].description,'updated professional anchor');
  assert.equal(old.description,'old professional anchor');
});

test('saving decision policy preserves its versioned working-rule provenance and gate action',()=>{
  const h=rubricHarness();
  const value=vm.runInContext("validateDecisionPolicy({full_resume_threshold:70,min_coverage:.8,critical_dimensions:[],gate_failure_action:'supplement_evidence_or_initial_verification_not_mismatch',critical_ratio_basis:'adjustable_ai_working_default_not_user_specified_not_statistically_optimized'},[{id:'a'}])",h.context);
  assert.equal(value.gate_failure_action,'supplement_evidence_or_initial_verification_not_mismatch');
  assert.match(value.critical_ratio_basis,/not_user_specified/);
});

function projectionHarness(){
  const h=historyHarness();
  Object.assign(h.context,{reviewIsStale:c=>!!(c.review_feedback_stale||c.review_role_stale)||h.context.aiReviewStandardStale(c),pendingReview:()=>false,scoreMechanism:()=>({version:'current-v3'}),assignedRole:()=> 'advisory_pm',latestAI:c=>c.ai_reviews?.at(-1)?.review});
  return h;
}
const currentAiCandidate=()=>({id:'synthetic-record',resume_score_ai:{role:'advisory_pm',mechanism_version:'current-v3',review_id:'ai-current',is_current_context:true},ai_reviews:[{id:'ai-current',is_current_context:true,review:{three_point:{match:{text:'current professional analysis'},interview:{text:'current supporting reasoning'}}}}]});

test('current AI and attributed before-review populate resume evaluation without creating manual revisions',()=>{
  const h=projectionHarness();h.context.candidate=currentAiCandidate();
  h.context.candidate.human_pre_interview=[{id:'human-before',sender_identity:'owner',text:'owner before-review',stage:'before'}];
  const projection=vm.runInContext("feedbackNoteProjection(candidate,'resume')",h.context);
  assert.equal(projection.manual,false);assert.equal(projection.revision_id,null);
  assert.match(projection.text,/current professional analysis/);assert.match(projection.text,/owner before-review/);
  assert.equal(projection.source_references.length,2);assert.equal(projection.source_references[0].kind,'ai_review');
  const text=elementText(vm.runInContext('feedbackNotesPanel(candidate)',h.context));
  assert.match(text,/履历评价/);assert.match(text,/current professional analysis/);assert.match(text,/owner before-review/);assert.doesNotMatch(text,/AI履历分析|本人履历评价/);
  assert.equal(h.context.candidate.feedback_notes,undefined);
});

test('stale AI analysis is never projected as a current resume evaluation',()=>{
  const h=projectionHarness();h.context.candidate=currentAiCandidate();h.context.candidate.ai_review_standard_stale=true;
  assert.equal(vm.runInContext("feedbackNoteProjection(candidate,'resume').text",h.context),'');
  delete h.context.candidate.ai_review_standard_stale;h.context.candidate.resume_score_ai.mechanism_version='old-v2';
  assert.equal(vm.runInContext("feedbackNoteProjection(candidate,'resume').text",h.context),'');
});

test('explicit owner stage and HR evaluation determine categories while availability stays out',()=>{
  const h=projectionHarness();h.context.candidate={human_reviews:[
    {id:'after-owner',stage:'after',sender_identity:'owner',text:'explicit owner after-review'},
    {id:'after-contact',stage:'after',sender_identity:'contact',text:'contact opinion cannot become mine'},
    {id:'hr-eval',stage:'hr',category:'hr',sender_identity:'hr',text:'attributed HR evaluation'},
    {id:'hr-schedule',stage:'hr',category:'hr',sender_identity:'hr',kind:'availability',text:'available Friday',recorded_at:'2099-01-01'},
  ],communication_events:[{id:'unknown-owner',kind:'owner_feedback',sender_identity:'owner',evidence_verified:true,quote:'owner wording with unknown stage'}]};
  assert.equal(vm.runInContext("feedbackNoteProjection(candidate,'interview').text",h.context),'explicit owner after-review');
  assert.equal(vm.runInContext("feedbackNoteProjection(candidate,'hr').text",h.context),'attributed HR evaluation');
  assert.equal(vm.runInContext("feedbackNoteProjection(candidate,'other').text",h.context),'owner wording with unknown stage');
  const hr=h.context.candidate.human_reviews.find(row=>row.id==='hr-eval');hr.text='raw HR source with protected facts and professional evidence';hr.professional_excerpt='professional evidence';
  const rawBefore=hr.text;
  assert.equal(vm.runInContext("feedbackNoteProjection(candidate,'hr').text",h.context),'professional evidence');
  h.context.engineConnected=true;h.context.candidate.id='synthetic-hr';h.context.data={candidates:[h.context.candidate]};
  vm.runInContext("openFeedbackNotes(candidate,'hr')",h.context);assert.equal(h.element('notes-text').value,'professional evidence');
  hr.professional_excerpt='';assert.equal(vm.runInContext("feedbackNoteProjection(candidate,'hr').text",h.context),'');
  vm.runInContext("openFeedbackNotes(candidate,'hr')",h.context);assert.equal(h.element('notes-text').value,'');
  h.context.simpleReview=record=>{const row=new Element('article');row.append(Object.assign(new Element('p'),{textContent:record.text||''}));return row;};
  h.context.uncertainEvidence=c=>c.human_reviews.filter(row=>row.stage==='hr');
  const originals=vm.runInContext('sourceCommunicationPanel(candidate)',h.context);assert.match(elementText(originals),/raw HR source with protected facts/);
  originals.children.find(row=>elementText(row).includes('raw HR source')).children.at(-1).callback();
  assert.equal(h.element('notes-category').value,'hr');assert.equal(h.element('notes-text').value,'');assert.equal(hr.text,rawBefore);
});

test('an empty manual key suppresses all derived content even after a new AI review arrives',()=>{
  const h=projectionHarness();h.context.candidate=currentAiCandidate();h.context.candidate.feedback_notes={resume:{text:'',revision_id:'clear-version'}};
  h.context.candidate.human_pre_interview=[{id:'before',sender_identity:'owner',stage:'before',text:'old owner material'}];
  const projection=vm.runInContext("feedbackNoteProjection(candidate,'resume')",h.context);
  assert.equal(projection.manual,true);assert.equal(projection.text,'');assert.equal(projection.revision_id,'clear-version');
  assert.equal(vm.runInContext('feedbackNotesPanel(candidate)',h.context),null);
});

test('editing a derived resume note pre-fills source text and saves validated references as a new manual version',async()=>{
  const h=projectionHarness();h.context.engineConnected=true;h.context.candidate=currentAiCandidate();
  h.context.candidate.human_pre_interview=[{id:'before',sender_identity:'owner',stage:'before',text:'owner professional note'}];h.context.data={candidates:[h.context.candidate]};
  const before=JSON.stringify(h.context.candidate.ai_reviews);vm.runInContext("openFeedbackNotes(candidate,'resume')",h.context);
  assert.match(h.element('notes-text').value,/current professional analysis/);assert.match(h.element('notes-text').value,/owner professional note/);assert.doesNotMatch(h.element('notes-text').value,/AI履历分析|本人履历评价/);
  let request;h.context.api=async(path,payload)=>{request={path,payload};return {revision_id:'new-manual',updated_context:true,review_requested:false}};
  vm.runInContext('refreshEngine=async()=>{};',h.context);h.element('notes-text').value='human revised professional assessment';
  await vm.runInContext('saveFeedbackNote()',h.context);
  assert.equal(request.path,'/api/notes');assert.equal(request.payload.previous_revision_id,null);
  assert.equal(request.payload.source_references.length,2);assert.equal(request.payload.source_references[0].kind,'ai_review');
  assert.equal(request.payload.source_references[1].record_id,'before');assert.equal(JSON.stringify(h.context.candidate.ai_reviews),before);
});

test('rule summary is natural language and friendly version labels replace internal audit copy',()=>{
  const h=rubricHarness();
  const text=vm.runInContext("decisionPolicyText({full_resume_threshold:70,min_coverage:.8,critical_dimensions:[{id:'a',min_ratio:.5}],source_note:'root min_ratio=0.5 internal audit'})",h.context);
  assert.equal(text,'参考线 70 · 依据覆盖至少 80% · 关键项至少达到本项50%要求');assert.doesNotMatch(text,/root|min_ratio|audit/);
  h.context.requirementsData.roles.advisory_pm.rubric_versions[0].label='v3初版';
  assert.equal(vm.runInContext("friendlyRubricName('advisory_pm',{version:'rules-1',name:'generic mechanism'})",h.context),'v3初版');
  assert.doesNotMatch(vm.runInContext("friendlyRuleExplanation('root updated min_ratio audit')",h.context),/root|min_ratio/);
  h.context.requirementsData.roles.advisory_pm.rubric_versions[0].label='历史履历基线 · 2026.11';
  h.context.designHost=new Element('section');
  vm.runInContext("appendRubricDesignBasis('advisory_pm',{version:'rules-1'},designHost)",h.context);
  assert.match(elementText(h.context.designHost),/172份不同原件/);assert.match(elementText(h.context.designHost),/116份有完整职业事实/);
  h.context.requirementsData.roles.advisory_pm.rubric_versions[0].label='后续工作规则';h.context.designHost=new Element('section');
  vm.runInContext("appendRubricDesignBasis('advisory_pm',{version:'rules-1'},designHost)",h.context);
  assert.doesNotMatch(elementText(h.context.designHost),/172|116/);
});

test('AI analytical text is shown in resume evaluation rather than repeated in the heading',()=>{
  const h=listHarness();h.context.engineConnected=true;
  Object.assign(h.context,{uploadActive:false,detailRenderSignature:'',clearResumeFrames(){},reviewJob:()=>({}),scoreMechanism:()=>({version:'current-v3'}),latestAI:c=>c.ai_reviews.at(-1).review,
    personSentence:()=>({text:'unique professional reasoning'}),interviewAdvice:()=>({label:'建议面试',reason:'unique professional reasoning',type:'blue'}),profileFacts:()=>null,radarPanel:()=>null,resumePanel:()=>new Element('section'),worksPanel:()=>null,append:(parent,...children)=>parent.append(...children),openFeedbackNotes(){},openMaterials(){},changeMetadata(){},retryReview(){},openFeedback(){}});
  h.context.candidate=currentAiCandidate();h.context.candidate.name='林示例';h.context.candidate.ai_reviews[0].review.three_point.match.text='unique professional reasoning';h.context.candidate.display_score={score:80,scale:100};h.context.candidate.communication_events=[{kind:'interview_scheduled',status:'scheduled',evidence_verified:true,quote:'evidence-only original scheduling record'}];
  vm.runInContext(sourceFunction('renderDetail')+'\nrenderDetail(candidate);',h.context);
  const host=h.element('candidate-detail');
  assert.doesNotMatch(elementText(host.children[0]),/unique professional reasoning/);
  assert.match(elementText(host.children[1]),/履历评价/);assert.match(elementText(host.children[1]),/unique professional reasoning/);assert.doesNotMatch(elementText(host.children[1]),/原始沟通记录|另存人工修订|evidence-only original scheduling record|AI履历分析/);
});


test('fresh state scoring rules outrank a previously opened requirements cache',()=>{
  const h=projectionHarness();h.context.data.resume_score_mechanisms={advisory_pm:{version:'current-v3',dimensions:[{id:'current',weight:100}]}};
  h.context.requirementsData={roles:{advisory_pm:{resume_score_mechanism:{version:'old-v2',dimensions:[{id:'old',weight:100}]}}}};
  vm.runInContext(sourceFunction('scoreMechanism'),h.context);h.context.candidate=currentAiCandidate();
  assert.equal(vm.runInContext("scoreMechanism('advisory_pm').version",h.context),'current-v3');
  assert.match(vm.runInContext('currentAiFeedbackEntry(candidate).text',h.context),/current professional analysis/);
  assert.equal(h.context.requirementsData.roles.advisory_pm.resume_score_mechanism.version,'old-v2','rendering must not mutate the cached requirements record');
});

function selectionHarness(){
  const h=projectionHarness();
  vm.runInContext(['plainCopy','shortAnswer','latestAI','threePoint','reviewIsStale'].map(sourceFunction).join('\n'),h.context);
  return h;
}

test('current score, AI summary and three-point text select the same review instead of an old completed job',()=>{
  const h=selectionHarness();h.context.candidate=currentAiCandidate();
  h.context.candidate.ai_reviews[0].review.quick_review_fingerprint='current-fingerprint';
  h.context.candidate.ai_reviews.unshift({id:'old-job',is_current_context:false,review:{three_point:{match:{text:'obsolete job analysis'}},quick_review_fingerprint:'old-fingerprint'}});
  Object.assign(h.context.candidate,{latest_ai_review_id:'ai-current',latest_quick_review_id:'old-job',quick_review_job:{status:'completed',review_id:'old-job',fingerprint:'other-old-fingerprint'},latest_ai_review:{is_current_context:false},concise_view:{role:'advisory_pm',source_review_id:'old-job',three_point:{match:{text:'obsolete concise copy'}}}});
  const before=JSON.stringify(h.context.candidate);
  assert.equal(vm.runInContext('latestAIRecord(candidate).id',h.context),'ai-current');
  assert.equal(vm.runInContext('threePoint(candidate).match.text',h.context),'current professional analysis');
  assert.equal(vm.runInContext('reviewIsStale(candidate)',h.context),false);
  const entry=vm.runInContext('currentAiFeedbackEntry(candidate)',h.context);
  assert.equal(entry.source_reference.record_id,'ai-current');assert.match(entry.text,/current professional analysis/);assert.doesNotMatch(entry.text,/obsolete/);
  assert.equal(JSON.stringify(h.context.candidate),before);
});

test('an expired score pointer cannot outrank the current AI pointer and a matching-job mismatch still marks stale',()=>{
  const h=selectionHarness();h.context.candidate=currentAiCandidate();
  h.context.candidate.ai_reviews.unshift({id:'old-score',review:{three_point:{match:{text:'expired scoring body'}}}});
  h.context.candidate.resume_score_ai={role:'advisory_pm',mechanism_version:'old-v2',review_id:'old-score'};h.context.candidate.latest_ai_review_id='ai-current';
  assert.equal(vm.runInContext('latestAIRecord(candidate).id',h.context),'ai-current');
  assert.equal(vm.runInContext('threePoint(candidate).match.text',h.context),'current professional analysis');
  h.context.candidate.resume_score_ai={role:'advisory_pm',mechanism_version:'current-v3',review_id:'ai-current'};
  h.context.candidate.quick_review_job={status:'completed',review_id:'ai-current',fingerprint:'wrong-current-input'};h.context.candidate.ai_reviews.at(-1).review.quick_review_fingerprint='current-input';
  assert.equal(vm.runInContext('reviewIsStale(candidate)',h.context),true);
});

test('a new canonical resume recommendation remains separate from an actual human Pass decision',()=>{
  const h=listHarness();h.context.scoreMechanism=()=>({version:'current-v3',decision_policy:{}});h.context.requirementsData=null;
  h.context.status=()=>({label:'不推进',type:'red',source:'explicit human decision'});
  vm.runInContext(decisionSource,h.context);
  h.context.candidate={verified_recruitment_status:'not_proceeding',resume_recommendation:{status:'interview',label:'建议面试',score_origin:'ai',rubric_version:'current-v3'}};
  const before=JSON.stringify(h.context.candidate),advice=vm.runInContext('candidateAdviceTag(candidate)',h.context),actual=vm.runInContext('candidateActualState(candidate)',h.context);
  assert.equal(advice.text,'建议面试');assert.equal(actual.text,'不推进');assert.equal(actual.kind,'red');
  assert.equal(JSON.stringify(h.context.candidate),before,'display must neither revoke Pass nor restart recruitment');
});

test('Pass uses only the legacy employer-decision alias while missing Reject remains unknown and disabled',()=>{
  const h=harness(),buttons=['pass','reject'].map(key=>{const b=new Element('button');b.dataset.metricFilter=key;return b});
  Object.assign(h.context,{filterScope:()=> 'all|all',uiMetricsScope:'all|all',metricFilter:'all'});h.context.document.querySelectorAll=()=>buttons;
  h.context.data.hiring_metrics={total_documents:3,viewed_documents:2,interviewed_people:1,follow_up_people:0,offer_people:1,onboard_people:0,pending_people:0,rejected_people:2,candidate_ids_by_metric:{rejected:['employer-pass-a','employer-pass-b']}};
  vm.runInContext(['hiringMetricLabel','metricCount','metricCandidateIds','renderHiringMetrics','activeMetricIds'].map(sourceFunction).join('\n')+'\nrenderHiringMetrics()',h.context);
  assert.equal(h.element('metric-pass').textContent,'2');assert.equal(h.element('metric-reject').textContent,'—');assert.equal(buttons[0].disabled,false);assert.equal(buttons[1].disabled,true);
  h.context.metricFilter='pass';assert.equal(vm.runInContext('Array.from(activeMetricIds()).join("|")',h.context),'employer-pass-a|employer-pass-b');
  Object.assign(h.context.data.hiring_metrics,{pass_people:1,reject_people:1,candidate_ids_by_metric:{pass:['explicit-pass'],reject:['offer-finally-declined']}});
  vm.runInContext('renderHiringMetrics()',h.context);assert.equal(h.element('metric-pass').textContent,'1');assert.equal(h.element('metric-reject').textContent,'1');assert.equal(buttons[1].disabled,false);
  h.context.metricFilter='reject';assert.equal(vm.runInContext('Array.from(activeMetricIds()).join("|")',h.context),'offer-finally-declined');
});


const progressRecord=(stage='interview_2',phase='approved')=>({stage,phase,revision_id:'progress-synthetic',recorded_at:'2026-11-04T09:00:00+08:00',schema_version:'recruitment-progress-v1',source:'explicit_user_progress',evidence_verified:true,explicit_user_assertion:true,occurred_at:null,reason:'synthetic progress note'});
function progressHarness({local=true}={}){
  const h=historyHarness({local});h.context.engineConnected=true;let requestSequence=0;
  Object.assign(h.context,{crypto:{randomUUID:()=> 'synthetic-request-'+(++requestSequence)},candidateName:()=> '林示例',refreshEngine:async()=>{}});
  h.context.candidate={id:'synthetic-record'};h.context.data={candidates:[h.context.candidate],capabilities:{manual_progress:true}};
  return h;
}

test('manual progress is available only with the local capability and capability changes update the detail actions',()=>{
  const h=listHarness();Object.assign(h.context,{engineConnected:true,uploadActive:false,detailRenderSignature:'',clearResumeFrames(){},reviewJob:()=>({}),scoreMechanism:()=>null,personSentence:()=>null,profileFacts:()=>null,radarPanel:()=>null,resumePanel:()=>new Element('section'),worksPanel:()=>null,append:(host,...children)=>host.append(...children)});
  h.context.candidate={id:'synthetic-record',name:'林示例',display_score:null};h.context.data={candidates:[h.context.candidate],capabilities:{}};
  vm.runInContext(sourceFunction('renderDetail')+'\nrenderDetail(candidate)',h.context);assert.doesNotMatch(elementText(h.element('candidate-detail')),/跟进/);
  h.context.data.capabilities.manual_progress=true;vm.runInContext('renderDetail(candidate)',h.context);assert.match(elementText(h.element('candidate-detail')),/跟进/);
  h.context.status=()=>({label:'不推进',type:'red'});h.context.candidate.recruitment_progress=progressRecord();vm.runInContext('renderDetail(candidate)',h.context);assert.doesNotMatch(elementText(h.element('candidate-detail').children[0].children[0]),/不推进/);
  h.context.isLoopback=false;vm.runInContext('renderDetail(candidate)',h.context);assert.doesNotMatch(elementText(h.element('candidate-detail')),/跟进/);
  const publicPage=progressHarness({local:false});vm.runInContext('openProgressEditor(candidate)',publicPage.context);assert.notEqual(publicPage.element('progress-dialog').open,true);
});

test('progress dates preserve unknown, day and minute precision and allow future only for scheduled phases',()=>{
  const h=progressHarness();h.context.now=new Date('2026-11-04T12:00:00+08:00');
  assert.equal(vm.runInContext("progressOccurrence('','','completed',now)",h.context),null);
  assert.equal(vm.runInContext("progressOccurrence('2026-11-01','','completed',now)",h.context),'2026-11-01');
  assert.equal(vm.runInContext("progressOccurrence('2026-11-01','10:30','completed',now)",h.context),'2026-11-01T10:30');
  assert.throws(()=>vm.runInContext("progressOccurrence('','10:30','scheduled',now)",h.context),/补充日期/);
  assert.throws(()=>vm.runInContext("progressOccurrence('2026-02-30','','completed',now)",h.context),/有效日期/);
  assert.throws(()=>vm.runInContext("progressOccurrence('2026-13-01','','completed',now)",h.context),/有效日期/);
  assert.throws(()=>vm.runInContext("progressOccurrence('2026-11-05','','approved',now)",h.context),/未来/);
  assert.throws(()=>vm.runInContext("progressOccurrence('2026-11-04','12:01','completed',now)",h.context),/未来/);
  assert.equal(vm.runInContext("progressOccurrence('2099-01-01','09:00','scheduled',now)",h.context),'2099-01-01T09:00');
});

test('opening progress never inserts now and correctly pre-fills existing day or Shanghai minute precision with readonly history',()=>{
  const h=progressHarness();vm.runInContext('openProgressEditor(candidate)',h.context);
  assert.equal(h.element('progress-date').value,'');assert.equal(h.element('progress-time').value,'');assert.equal(h.element('progress-stage').value,'');
  h.context.candidate.recruitment_progress={...progressRecord(),occurred_at:'2026-11-01',occurred_at_precision:'day'};h.context.candidate.recruitment_progress_history=[h.context.candidate.recruitment_progress];
  vm.runInContext('openProgressEditor(candidate)',h.context);assert.equal(h.element('progress-date').value,'2026-11-01');assert.equal(h.element('progress-time').value,'');assert.equal(h.element('progress-phase').value,'approved');
  h.context.candidate.recruitment_progress.occurred_at='2026-11-01T23:15:00Z';vm.runInContext('openProgressEditor(candidate)',h.context);assert.equal(h.element('progress-date').value,'2026-11-02');assert.equal(h.element('progress-time').value,'07:15');
  assert.match(elementText(h.element('progress-history')),/复面已获准/);assert.doesNotMatch(elementText(h.element('progress-history')),/另存|采用/);
});

test('manual progress retries reuse their request ID and captured revision without saving feedback or requesting a model',async()=>{
  const h=progressHarness();h.context.candidate.recruitment_progress=progressRecord();vm.runInContext('openProgressEditor(candidate)',h.context);h.element('progress-date').value='2026-01-02';h.element('progress-reason').value='professional follow-up';
  const before=JSON.stringify(h.context.candidate),requests=[];let refreshes=0;h.context.refreshEngine=async()=>{refreshes++};
  h.context.api=async(path,payload)=>{requests.push({path,payload});if(requests.length===1)throw Error('temporary transport failure');return {status:'saved',progress:progressRecord(),model_requested:false}};
  await assert.rejects(vm.runInContext('saveManualProgress()',h.context),/transport/);await vm.runInContext('saveManualProgress()',h.context);
  assert.equal(requests.length,2);assert.equal(requests[0].payload.request_id,requests[1].payload.request_id);assert.equal(requests[1].payload.previous_revision_id,'progress-synthetic');assert.equal(requests[1].payload.occurred_at,'2026-01-02');
  assert.ok(requests.every(request=>request.path==='/api/progress'));assert.deepEqual(Object.keys(requests[1].payload).sort(),['candidate_id','occurred_at','phase','previous_revision_id','reason','request_id','stage']);
  assert.equal(refreshes,1);assert.equal(JSON.stringify(h.context.candidate),before);assert.equal(h.element('progress-dialog').open,false);
});

test('progress content changes receive a new request ID and simultaneous saves cannot create overlapping writes',async()=>{
  const h=progressHarness();vm.runInContext('openProgressEditor(candidate)',h.context);h.element('progress-stage').value='hold';vm.runInContext('renderProgressPhases()',h.context);
  const ids=[];h.context.api=async(path,payload)=>{ids.push(payload.request_id);throw Error('retry')};
  await assert.rejects(vm.runInContext('saveManualProgress()',h.context),/retry/);h.element('progress-reason').value='changed manual reason';await assert.rejects(vm.runInContext('saveManualProgress()',h.context),/retry/);assert.notEqual(ids[0],ids[1]);
  let release,calls=0;h.context.api=async()=>{calls++;await new Promise(resolve=>{release=resolve});return {status:'saved',model_requested:false}};
  const one=vm.runInContext('saveManualProgress()',h.context),two=vm.runInContext('saveManualProgress()',h.context);await Promise.resolve();assert.equal(calls,1);release();await Promise.all([one,two]);
});

test('trusted manual progress wins over legacy process labels while AI advice and original records stay unchanged',()=>{
  const h=listHarness();h.context.candidate={verified_recruitment_status:'not_proceeding',recruitment_progress:progressRecord(),resume_recommendation:{status:'interview',label:'建议面试',score_origin:'ai',rubric_version:'current-v3'}};
  Object.assign(h.context,{scoreMechanism:()=>({version:'current-v3',decision_policy:{}}),requirementsData:null,status:()=>({label:'不推进',type:'red'})});vm.runInContext(decisionSource,h.context);
  const before=JSON.stringify(h.context.candidate);assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'复面已获准 · 日期待核');assert.equal(vm.runInContext('candidateAdviceTag(candidate).text',h.context),'建议面试');assert.equal(JSON.stringify(h.context.candidate),before);
  h.context.record=progressRecord('reject','completed');assert.equal(vm.runInContext('trustedManualProgress(record)',h.context),false);Object.assign(h.context.record,{offer_confirmed:true,outcome:'not_joined_after_offer'});assert.equal(vm.runInContext('trustedManualProgress(record)',h.context),true);h.context.record.schema_version='untrusted-version';assert.equal(vm.runInContext('trustedManualProgress(record)',h.context),false);
});

test('locking discards a late progress response without reopening or refilling the editor',async()=>{
  const h=progressHarness();vm.runInContext('openProgressEditor(candidate)',h.context);h.element('progress-stage').value='interview_2';vm.runInContext('renderProgressPhases()',h.context);h.element('progress-reason').value='private draft';
  let release,refreshes=0;h.context.api=()=>new Promise(resolve=>{release=resolve});h.context.refreshEngine=async()=>{refreshes++};const pending=vm.runInContext('saveManualProgress()',h.context);await Promise.resolve();
  h.context.sessionLocked=true;h.context.sessionEpoch++;vm.runInContext('resetProgressEditor()',h.context);release({status:'saved',progress:progressRecord()});await pending;
  assert.equal(refreshes,0);assert.equal(h.element('progress-reason').value,'');assert.equal(h.element('progress-dialog').open,false);assert.equal(h.stats.toasts.length,0);
});

test('Interview 2 prefers verified entered-stage metrics and IDs while retaining old completed-stage fallback',()=>{
  const h=harness();vm.runInContext(sourceFunction('metricCount')+'\n'+sourceFunction('metricCandidateIds'),h.context);
  h.context.metrics={follow_up_people:2,candidate_ids_by_metric:{follow_up:['completed-old']}};assert.equal(vm.runInContext("metricCount(metrics,'follow_up_people')",h.context),'2');assert.equal(vm.runInContext("metricCandidateIds(metrics,'follow_up').join('|')",h.context),'completed-old');
  Object.assign(h.context.metrics,{second_round_people:1,second_round_undated_people:1});h.context.metrics.candidate_ids_by_metric.second_round=['approved-undated'];assert.equal(vm.runInContext("metricCount(metrics,'follow_up_people')",h.context),'1');assert.equal(vm.runInContext("metricCandidateIds(metrics,'follow_up').join('|')",h.context),'approved-undated');
  h.context.metrics.second_round_people=0;h.context.metrics.candidate_ids_by_metric.second_round=[];assert.equal(vm.runInContext("metricCount(metrics,'follow_up_people')",h.context),'0');assert.equal(vm.runInContext("metricCandidateIds(metrics,'follow_up').length",h.context),0);
});


function knownHoldCandidate(){
  const review={id:'known-owner-hold',stage:'after',sender_identity:'owner',text:'synthetic full professional interview judgment',outcome:'先待定下',decision_scope:'latest_known_owner_outcome',evidence_completeness:'full',evidence_verified:true,counts_in_pipeline_status:true,is_new_decision:false,is_current_recruitment_decision:false,recorded_at:'2099-01-01T12:00:00+08:00'};
  return {human_reviews:[review],recruitment_status:{value:'pending',source:'legacy partial status'},latest_known_owner_outcome:{value:'hold',decision_scope:'latest_known_owner_outcome',evidence_completeness:'full',evidence_verified:true,counts_in_pipeline_status:true,is_new_decision:false,fallback_only_no_opposing_current_decision:true,human_review_id:review.id}};
}

test('a candidate-bound full owner Hold replaces partial pending wording without turning import time into a decision time',()=>{
  const h=listHarness();h.context.reviewArrays=c=>({pre:[],post:c.human_reviews||[],unknown:[]});h.context.candidate=knownHoldCandidate();const before=JSON.stringify(h.context.candidate);
  const state=vm.runInContext('candidateActualState(candidate)',h.context);assert.equal(state.text,'待定');assert.match(state.title,/最近已知/);assert.doesNotMatch(state.title,/2099/);assert.match(state.title,/日期待核/);assert.equal(JSON.stringify(h.context.candidate),before);
  delete h.context.candidate.latest_known_owner_outcome;assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'待定');
  assert.equal(h.context.candidate.human_reviews[0].is_new_decision,false);assert.equal(JSON.stringify(knownHoldCandidate()),before);
});

test('weak or mismatched Hold evidence cannot override a full current decision, manual progress or verified Offer',()=>{
  const h=listHarness();h.context.reviewArrays=c=>({pre:[],post:c.human_reviews||[],unknown:[]});h.context.candidate=knownHoldCandidate();h.context.candidate.latest_known_owner_outcome.human_review_id='another-candidate-record';assert.equal(vm.runInContext('latestKnownOwnerHold(candidate)',h.context),null);
  h.context.candidate=knownHoldCandidate();h.context.candidate.human_reviews[0].evidence_completeness='partial_preview';assert.equal(vm.runInContext('latestKnownOwnerHold(candidate)',h.context),null);
  h.context.candidate=knownHoldCandidate();h.context.candidate.human_reviews[0].sender_identity='contact';assert.equal(vm.runInContext('latestKnownOwnerHold(candidate)',h.context),null);
  h.context.candidate=knownHoldCandidate();h.context.candidate.human_reviews.push({id:'current-pass',stage:'after',sender_identity:'owner',evidence_completeness:'full',outcome:'不推进',is_current_recruitment_decision:true});h.context.status=()=>({label:'不推进',type:'red'});assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'不推进');
  h.context.candidate=knownHoldCandidate();h.context.candidate.recruitment_progress=progressRecord('joined','completed');assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'已入职');
  h.context.candidate=knownHoldCandidate();h.context.candidate.communication_events=[{kind:'offer',status:'completed',evidence_verified:true}];h.context.status=()=>({label:'阶段待核'});assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'已发Offer');
});

test('unknown interview rounds stay generic while explicit first, second and manual first-round facts retain their meaning',()=>{
  const h=listHarness();h.context.candidate={communication_events:[{kind:'interviewed',status:'completed',evidence_verified:true}]};
  assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'已面试 · 轮次待核');assert.equal(vm.runInContext('communicationStageModel(candidate)[0].text',h.context),'已面试 · 轮次待核');
  h.context.candidate.communication_events[0]={kind:'interview_scheduled',status:'scheduled',evidence_verified:true};assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'已约面试 · 轮次待核');
  h.context.candidate.communication_events[0].round=1;assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'已约一面');
  h.context.candidate.communication_events[0]={kind:'interviewed',status:'completed',evidence_verified:true,interview_type:'first_round'};assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'已一面');assert.equal(vm.runInContext('communicationStageModel(candidate)[0].label',h.context),'一面');
  h.context.candidate.communication_events[0].round=2;assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'已二面');
  h.context.candidate.recruitment_progress=progressRecord('interview_1','completed');assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'已一面');
});

test('verified full after-review facts establish only generic completed interview and a score alone proves no interview',()=>{
  const h=listHarness();h.context.reviewArrays=c=>({pre:[],post:c.human_reviews||[],unknown:[]});h.context.candidate={human_reviews:[{id:'verified-after',stage:'after',sender_identity:'owner',evidence_completeness:'full',evidence_verified:true,interview_completed_explicit:true}]};
  assert.equal(vm.runInContext('communicationStageModel(candidate)[0].text',h.context),'已面试 · 轮次待核');assert.equal(vm.runInContext('candidateActualState(candidate).text',h.context),'已面试 · 轮次待核');
  h.context.candidate={post_interview_score:{score:87}};assert.equal(vm.runInContext('candidateActualState(candidate)',h.context),null);
});

function aiValidityHarness(){
  const h=selectionHarness();h.context.mechanism={version:'current-v3',dimensions:[20,20,20,15,15,10].map((weight,index)=>({id:'dimension-'+index,label:'职业能力'+index,weight})),decision_policy:{full_resume_threshold:70,min_coverage:1,critical_dimensions:[]}};h.context.scoreMechanism=()=>h.context.mechanism;
  vm.runInContext(scoreSource+'\n'+['latestScore','scoreOrigin','scoreBadge','dimensionRows','radarModel'].map(sourceFunction).join('\n')+'\n'+decisionSource,h.context);
  h.context.candidate=currentAiCandidate();h.context.candidate.resume_score_ai.dimensions=h.context.mechanism.dimensions.map(d=>({id:d.id,points:d.weight*.8,max_points:d.weight}));return h;
}

test('an old manual primary score cannot suppress current AI analysis, radar or canonical recommendation',()=>{
  const h=aiValidityHarness();Object.assign(h.context.candidate,{review_standard_stale:true,ai_review_standard_stale:false,display_score:{score:82,scale:100,stage:'resume',origin:'manual',is_policy_stale:true},resume_recommendation:{status:'interview',label:'建议面试',rubric_version:'current-v3',score_origin:'ai'}});
  const before=JSON.stringify(h.context.candidate);assert.equal(vm.runInContext('reviewIsStale(candidate)',h.context),false);assert.match(vm.runInContext('currentAiFeedbackEntry(candidate).text',h.context),/current professional analysis/);assert.equal(vm.runInContext('radarModel(candidate).axes.length',h.context),6);assert.equal(vm.runInContext('interviewAdvice(candidate).label',h.context),'建议面试');
  const badge=vm.runInContext('scoreBadge(candidate)',h.context);assert.equal(badge.textContent,'82分');assert.match(badge.className,/manual/);assert.match(badge.title,/旧标准/);assert.equal(JSON.stringify(h.context.candidate),before);
});

test('legacy APIs infer AI validity from role and mechanism while explicit primary flags do not mislabel post-interview scores',()=>{
  const h=aiValidityHarness();h.context.candidate.review_standard_stale=true;assert.equal(vm.runInContext('aiReviewStandardStale(candidate)',h.context),false);
  h.context.candidate.resume_score_ai.mechanism_version='old-v2';assert.equal(vm.runInContext('aiReviewStandardStale(candidate)',h.context),true);
  delete h.context.candidate.resume_score_ai.mechanism_version;assert.equal(vm.runInContext('aiReviewStandardStale(candidate)',h.context),true);
  h.context.candidate.ai_review_standard_stale=false;assert.equal(vm.runInContext('aiReviewStandardStale(candidate)',h.context),false);
  h.context.candidate.display_score={score:87,scale:100,stage:'post_interview',origin:'manual',is_policy_stale:false};let badge=vm.runInContext('scoreBadge(candidate)',h.context);assert.equal(badge.textContent,'87分');assert.doesNotMatch(badge.title,/旧标准/);
  delete h.context.candidate.display_score.is_policy_stale;badge=vm.runInContext('scoreBadge(candidate)',h.context);assert.doesNotMatch(badge.title,/旧标准/);
  h.context.candidate.ai_review_standard_stale=true;h.context.candidate.post_interview_score={role:'advisory_pm',is_current_context:true,dimensions:h.context.mechanism.dimensions.map(d=>({id:d.id,label:d.label,points:d.weight,max_points:d.weight}))};assert.equal(vm.runInContext('radarModel(candidate).title',h.context),'面后分项');
});


test('resume evaluation prefers the new professional summary plus interview advice with no duplicate or source prefix',()=>{
  const h=projectionHarness();h.context.candidate=currentAiCandidate();const review=h.context.candidate.ai_reviews[0].review;review.summary='concise career summary';review.three_point.match.text='long match detail should stay out of the concise summary';
  let entry=vm.runInContext('currentAiFeedbackEntry(candidate)',h.context);assert.equal(entry.text,'concise career summary\n\ncurrent supporting reasoning');assert.equal(entry.source_reference.record_id,'ai-current');assert.doesNotMatch(entry.text,/long match|AI履历分析/);
  review.three_point.interview.text='  concise career summary  ';entry=vm.runInContext('currentAiFeedbackEntry(candidate)',h.context);assert.equal(entry.text,'concise career summary');
  delete review.summary;review.three_point.interview.text='current supporting reasoning';entry=vm.runInContext('currentAiFeedbackEntry(candidate)',h.context);assert.match(entry.text,/long match detail/);assert.match(entry.text,/current supporting reasoning/);
});
