import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,randomBytes} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {redactQuestion,loadQuestionRules,encryptUserChunk} from '../scripts/qianwen-cases/build-question-top100.mjs';

const panelSource=await readFile(new URL('../scripts/qianwen-cases/question-top100-panel.html',import.meta.url),'utf8');
const helpersSource=panelSource.split('// BEGIN_RANK_SORT_HELPERS')[1].split('// END_RANK_SORT_HELPERS')[0];
const sortHelpers=vm.runInNewContext(helpersSource+';({usageInterval,usageFrequency,rankSortValue,nextRankSort,sortedRankKeys})');

test('All six ranking metrics support stable non-mutating ascending, descending and restored order',()=>{
  const keys=Object.freeze(['a','b','c','d']);
  const users=new Map([['a',{total:10,daily_avg:1.004,active_days:3}],['b',{total:0,daily_avg:1.003,active_days:1}],['c',{total:10,daily_avg:2,active_days:4}],['d',{total:null,daily_avg:null,active_days:null}]]);
  const ordered=(key,direction,base=keys)=>Array.from(sortHelpers.sortedRankKeys(base,users,{key,direction}));
  assert.deepEqual(ordered('total','asc'),['b','a','c','d']);
  assert.deepEqual(ordered('total','desc'),['a','c','b','d']);
  assert.deepEqual(ordered('total','none'),keys);
  assert.deepEqual(ordered('total','desc',['c','a','b','d']),['c','a','b','d'],'ties follow this ranking, not another one');
  assert.deepEqual(ordered('daily_avg','asc'),['b','a','c','d'],'daily averages use full precision');
  assert.deepEqual(ordered('active_days','desc'),['c','a','b','d']);
  assert.deepEqual([...keys],['a','b','c','d']);
  let state={key:null,direction:'none'};
  state=sortHelpers.nextRankSort(state,'total');assert.equal(state.direction,'asc');
  state=sortHelpers.nextRankSort(state,'total');assert.equal(state.direction,'desc');
  state=sortHelpers.nextRankSort(state,'total');assert.equal(state.direction,'none');assert.equal(state.key,null);
  state=sortHelpers.nextRankSort({key:'total',direction:'desc'},'daily_avg');assert.equal(state.direction,'asc');
});

test('Usage frequency uses actual active-date gaps; one-off usage is not a recurring frequency',()=>{
  const first_at='2026-10-01 23:30:00';
  const daily={first_at,last_at:'2026-10-04 00:01:00',active_days:4};
  const everyTwo={first_at,last_at:'2026-10-05 20:00:00',active_days:3};
  assert.equal(sortHelpers.usageInterval(daily),1);assert.equal(sortHelpers.usageFrequency(daily),'每日');
  assert.equal(sortHelpers.usageInterval(everyTwo),2);assert.equal(sortHelpers.usageFrequency(everyTwo),'每 2 日');
  assert.equal(sortHelpers.usageFrequency({...daily,active_days:1}),'仅1日');
  assert.equal(sortHelpers.usageInterval({...daily,active_days:1}),null);
  assert.equal(sortHelpers.rankSortValue({post_bind_inflow:false},'post_bind_inflow'),0);
  assert.equal(sortHelpers.rankSortValue({},'post_bind_inflow'),null);
  const users=new Map([['a',daily],['b',everyTwo],['c',{...daily,active_days:1}]]);
  assert.deepEqual(Array.from(sortHelpers.sortedRankKeys(['b','c','a'],users,{key:'use_interval',direction:'asc'})),['a','b','c']);
  assert.ok(sortHelpers.rankSortValue({last_at:'2026-10-14 12:00:00'},'last_at')<sortHelpers.rankSortValue({last_at:'2026-10-15 08:00:00'},'last_at'));
});

test('All metric headers expose sort buttons and sorting never changes selected user or loads originals',()=>{
  const controls=[...panelSource.matchAll(/data-qtop-sort="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(controls,['total','daily_avg','active_days','use_interval','last_at','post_bind_inflow']);
  const sortHandler=panelSource.split("root.querySelectorAll('[data-qtop-sort]').forEach(btn=>btn.addEventListener")[1].split('}));')[0];
  assert.match(sortHandler,/renderRanking\(\)/);
  assert.doesNotMatch(sortHandler,/selectUser|loadQuestions|resetFilters|state\.key\s*=/);
  assert.match(panelSource,/setAttribute\('aria-sort'/);
  assert.match(panelSource,/state\.ranking=btn\.dataset\.qtopRanking;state\.sortKey=null;state\.sortDirection='none'/);
});

test('Question originals retain lines while masking direct identifiers and credentials',()=>{
  const raw='请比较020602\n电话13812345678 邮箱test@example.com\napi_key=sk-abcdefghijklmnopqrstuvwxyz123456';
  const safe=redactQuestion(raw);
  assert.match(safe,/020602\n/);
  assert.doesNotMatch(safe,/13812345678|test@example\.com|sk-abcdefghijklmnopqrstuvwxyz/);
  assert.match(safe,/手机号已隐藏/);
});

test('Explicit personal numbers split across lines are masked without joining fund-code lists or table cells',()=>{
  assert.equal(redactQuestion('联系电话：138\n1234\n5678\n请回复'),'联系电话：[手机号已隐藏]\n请回复');
  assert.equal(redactQuestion('手机号：1\n3\n812345678\n请回复'),'手机号：[手机号已隐藏]\n请回复');
  assert.equal(redactQuestion('卡号：6222\n1234\n5678\n9012\n请核对'),'卡号：[长号码已隐藏]\n请核对');
  assert.equal(redactQuestion('身份证号：110101\n19900101\n1234\n请隐藏'),'身份证号：[证件号已隐藏]\n请隐藏');
  for(const text of ['基金代码\n020602\n163401','日期\n2026-10-01\n2026-10-02','金额\n250000\n180000','基金代码\n020602\t163401'])assert.equal(redactQuestion(text),text);
});

test('Reused question rules do not execute source fetching and distinguish known presets',async()=>{
  const classify=await loadQuestionRules(resolve(import.meta.dirname,'..'));
  assert.equal(classify('帮我看看现在的持仓结构，给出优化建议').preset.version,'launch_v1');
  assert.equal(classify('我想找一个和自己投资计划更匹配的且慢策略，可以推荐几个候选，并说说它们分别适合什么样的情况吗？').preset.version,'qieman_guided_v3');
  assert.equal(classify('我这笔钱三年后要用，如何分配？').preset,null);
});

test('Explicit self-name recall prompts are masked without rewriting investment action requests',async()=>{
  const source=await readFile(new URL('../scripts/qianwen-refresh/build-question-corpus.mjs',import.meta.url),'utf8');
  const definitions=source.slice(source.indexOf('const DIRECTION_IDS ='),source.indexOf('const sql ='));
  const functions=source.slice(source.indexOf('function redact(input)'),source.indexOf('let redactedRows ='));
  const mainRedact=vm.runInNewContext(definitions+'\n'+functions+';redact');
  const examples=[
    ['你知道我是谁吗，我叫示例甲乙你记得吗','你知道我是谁吗，我叫[称呼已隐藏]你记得吗'],
    ['我叫示例甲乙，你还记得我吗？','我叫[称呼已隐藏]，你还记得我吗？'],
    ['我叫SampleName，你记得我吗','我叫[称呼已隐藏]，你记得我吗'],
  ];
  for(const [input,expected]of examples){assert.equal(redactQuestion(input),expected);assert.equal(mainRedact(input),expected);}
  for(const input of ['我叫你帮我分析002910，你记得吗？','我叫小易重新复盘，你记得吗？','我本人是价值投资做防守，应该怎么配置？','我叫你说话就是最靠谱的。']){
    assert.equal(redactQuestion(input),input);assert.equal(mainRedact(input),input);
  }
});

test('User question chunks are compressed encrypted and cryptographically bound to the anonymous user',async()=>{
  const salt=randomBytes(16),material=await webcrypto.subtle.importKey('raw',new TextEncoder().encode('fixture-only'),'PBKDF2',false,['deriveKey']);
  const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  const value={key:'anon_fixture',questions:[{i:1,t:'2026-10-15 08:00:00',q:'原文测试'}]};
  const out=await encryptUserChunk(value,key,salt,'anon_fixture');
  assert.doesNotMatch(JSON.stringify(out),/原文测试/);
  const options={name:'AES-GCM',iv:Buffer.from(out.iv,'base64'),additionalData:new TextEncoder().encode('anon_fixture')};
  const plain=await webcrypto.subtle.decrypt(options,key,Buffer.from(out.data,'base64'));
  assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(plain))),value);
  await assert.rejects(webcrypto.subtle.decrypt({...options,additionalData:new TextEncoder().encode('another_user')},key,Buffer.from(out.data,'base64')));
});

test('Top100 panel is non-eager and renders originals through textContent, with no inline raw-HTML insertion',async()=>{
  const panel=await readFile(new URL('../scripts/qianwen-cases/question-top100-panel.html',import.meta.url),'utf8');
  assert.doesNotMatch(panel,/\.innerHTML\s*=|console\.(?:log|debug)/);
  assert.match(panel,/每页 50 条/);
  assert.match(panel,/查看提问原文/);
  assert.match(panel,/推荐题匹配（推断）/);
  assert.match(panel,/其它输入（来源未确认）/);
  assert.match(panel,/selectUser\(first,false\)/);
});
