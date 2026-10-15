import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('KPI display uses one decimal for wan and hours below one day without changing raw money', () => {
  const script = `
import ast,json
from decimal import Decimal,ROUND_HALF_UP
from pathlib import Path
tree=ast.parse(Path('scripts/qianwen-cases/build-cases.py').read_text())
selected=[node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name in ('wan','money','short_duration')]
exec(compile(ast.Module(body=selected,type_ignores=[]),'display-functions','exec'))
print(json.dumps({'amounts':[wan(v) for v in [692800,35500,10000,9999]],'raw':money(692800.12),'durations':[short_duration(v) for v in [None,0,3600,86399,86400,302400]]}))
`;
  const result=spawnSync('python3',['-c',script],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(result.stdout),{
    amounts:['69.3 万','3.6 万','1.0 万','9,999 元'],raw:'692,800.12',
    durations:['—','0.0小时','1.0小时','24.0小时','1.0天','3.5天'],
  });
});

test('Qianwen conversion leaves preserve history, missing data and overlapping evidence', () => {
  const script = `
import importlib.util,json
spec=importlib.util.spec_from_file_location('taxonomy','scripts/qianwen-cases/extend-funded-users.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base={'fb':'2026-10-10 10:00:00','cohort':'existing','asset_at_bind':0,'first_inflow_ever':'2026-10-11 10:00:00','last_buy_before':None}
rows=[base,{**base,'cohort':'new'},{**base,'first_inflow_ever':'2025-01-01 00:00:00'},
{**base,'asset_at_bind':100,'first_inflow_ever':'2025-01-01 00:00:00'},
{**base,'asset_at_bind':None,'first_inflow_ever':'2025-01-01 00:00:00'},
{**base,'asset_at_bind':None},
{**base,'last_buy_before':'2025-01-01 00:00:00'}]
print(json.dumps([m.classify(r)[0] for r in rows]))
`;
  const result = spawnSync('python3', ['-c', script], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const [oldFirst,newFirst,returned,reinvested,missing,noHistory,priorProduct] = JSON.parse(result.stdout);
  assert.equal(oldFirst.existing_first_invest, true);
  assert.equal(oldFirst.recall, true);
  assert.equal(newFirst.new_first_invest, true);
  assert.equal(returned.existing_returned, true);
  assert.equal(returned.first_invest_after, false);
  assert.equal(reinvested.existing_reinvested, true);
  assert.equal(reinvested.zero_at_bind, false);
  assert.equal(missing.asset_unknown, true, 'missing asset is not automatically zero');
  assert.equal(noHistory.zero_at_bind, true, 'no asset plus verified no funding/product history is documented zero inference');
  assert.equal(priorProduct.first_invest_after, false, 'historical product investor is not first investor');
  assert.equal(priorProduct.existing_returned, true);
  assert.equal(reinvested.qwen_side_inferred, null, 'unreviewed attribution is not zero/false');
  assert.equal(reinvested.qwen_influence_rule, null);
});

test('Qianwen-side absence alone is insufficient and partial non-matches stay unknown', () => {
  const script = `
import importlib.util,json
spec=importlib.util.spec_from_file_location('review','scripts/qianwen-cases/review-qwen-evidence.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
b={'pmid':'fixture','first_inflow_after':'2026-10-11 10:00:00','qwen_user_input_30m':1,'qieman_known_events_30m':0,'h5_unknown_events_30m':0,'other_unknown_events_30m':0}
print(json.dumps([m.review(r)['qwen_side_inferred'] for r in [b,{**b,'qwen_user_input_30m':0},{**b,'h5_unknown_events_30m':1},{**b,'qieman_known_events_30m':1}]]))
`;
  const result = spawnSync('python3', ['-c', script], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), [true, null, null, null]);
});

test('Case layout stays compact, hides unreviewed slices and labels old first/new/reinvestment separately', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qianwen-layout-'));
  try {
    const types = ['new','old-first','returned','reinvested'];
    const users = types.map((type,i) => ({
      pmid:`fixture-${type}`,letter:String(i+1),cohort:type==='new'?'new':'existing',age:37,
      fb:'2026-10-10 10:00:00',registered_at:'2026-10-10 10:00:00',asset_at_bind:type==='reinvested'?500:0,
      first_inflow_ever:['new','old-first'].includes(type)?'2026-10-10 11:00:00':'2025-01-01 10:00:00',
      coverage:'funding_only',trades:[],asks:[],dev:[],risk:[],events:[],channels:{},
      asset_latest:{cal_date:'2026-10-14',ta:100*(i+1)},
      inflow_txns:i===3?[{t:'2026-10-10 13:00:00',amt:20},{t:'2026-10-10 11:00:00',amt:20}]:[{t:'2026-10-10 11:00:00',amt:10*(i+1)}],
      derived:{inflow_after:10*(i+1),first_inflow_after:'2026-10-10 11:00:00',buy_amount_after:null,cancels_after:0},
      question_stats:{total_questions:i===3?0:10*(i+1),pre_first_inflow_questions:i===3?0:4*(i+1),reviewed:true,cutoff:'2026-10-15 09:58:45'},
      app_operation:{first_at:i===3?null:'2026-10-10 10:05:30',first_platform:i===3?null:'iOS',device_platforms:i===3?['Android']:['iOS'],reviewed:true,cutoff:'2026-10-15 09:58:45'},
      binding_history:{ytd_inflow_before:i===3?120:0,last_trade_before:i===3?'2026-10-09 14:00:00':null,reviewed:true,cutoff:'2026-10-15 09:58:45',bound_at:'2026-10-10 10:00:00'},
      flags:{zero_at_bind:type!=='reinvested',first_invest_after:['new','old-first'].includes(type),
        new_first_invest:type==='new',recall:['old-first','returned'].includes(type),
        existing_first_invest:type==='old-first',existing_returned:type==='returned',existing_reinvested:type==='reinvested'},
    }));
    const data={meta:{cutoff:'2026-10-15 09:58:45',bound_total:4,generated:'2026-10-15',taxonomy_version:'2026-10-15'},users};
    const input=join(dir,'users.json'),output=join(dir,'page.html');
    const build=()=>spawnSync('python3',['scripts/qianwen-cases/build-cases.py',input,output,'scripts/qianwen-cases/base.css'],{encoding:'utf8'});
    writeFileSync(input,JSON.stringify(data));
    const rejected=build();
    assert.notEqual(rejected.status,0,'Incomplete asset review must block publication');
    assert.match(rejected.stderr,/资产未核验完整/);
    data.meta.assets_audit_complete=true;
    writeFileSync(input,JSON.stringify(data));
    const questionRejected=build();
    assert.notEqual(questionRejected.status,0,'Incomplete question review must block publication');
    assert.match(questionRejected.stderr,/提问统计未核验完整/);
    data.meta.question_stats_audit_complete=true;
    writeFileSync(input,JSON.stringify(data));
    const appRejected=build();
    assert.notEqual(appRejected.status,0,'Incomplete App operation review must block publication');
    assert.match(appRejected.stderr,/首次App操作未核验完整/);
    data.meta.app_operations_audit_complete=true;
    writeFileSync(input,JSON.stringify(data));
    const historyRejected=build();
    assert.notEqual(historyRejected.status,0,'Incomplete pre-binding history must block publication');
    assert.match(historyRejected.stderr,/绑定前入金和交易历史未核验完整/);
    data.meta.binding_history_audit_complete=true;
    writeFileSync(input,JSON.stringify(data));
    const dateRejected=build();
    assert.notEqual(dateRejected.status,0,'Missing lifetime first-inflow audit must block publication');
    assert.match(dateRejected.stderr,/注册和历史首次入金日期未核验完整/);
    data.meta.first_inflow_dates_audit_complete=true;
    writeFileSync(input,JSON.stringify(data));
    const accepted=build();
    assert.equal(accepted.status,0,accepted.stderr);
    const page=readFileSync(output,'utf8');
    assert.doesNotMatch(page,/四块看懂|taxonomy-tree|taxonomy-formulas|分类与千问关系怎么判断/);
    assert.equal((page.match(/class="tab" role="tab"/g)||[]).length,7);
    assert.doesNotMatch(page,/id="scope-qwen_side"|id="scope-qwen_influenced"/);
    assert.match(page,/flex-wrap:nowrap/);
    assert.match(page,/\.tab\{flex:0 0 auto/);
    for(const label of ['新客','老客首投','老客新投','老客再投']) assert.match(page,new RegExp(`<td>${label}</td>`));
    assert.match(page,/用户原来在且慢资产为 0，从千问绑定且慢帐号后，完成新入金/);
    assert.equal((page.match(/<span>平均首投提问数<\/span>/g)||[]).length,7);
    assert.match(page,/<b>4<small class="metric-unit"> 次提问<\/small><\/b><span>平均首投提问数<\/span><em>平均提问数 10 · 总提问数 10/);
    assert.match(page,/<b>0<small class="metric-unit"> 次提问<\/small><\/b><span>平均首投提问数<\/span><em>平均提问数 0 · 总提问数 0/);
    assert.equal((page.match(/class="metric-unit"> 次提问/g)||[]).length,7);
    assert.match(page,/<span>总资产<\/span><em>持有资产 3 人 · 人均资产 200 元/);
    assert.doesNotMatch(page,/<em>[^<]*资产日/);
    assert.match(page,/title="资产日 10-14；人均资产 = 总资产 ÷ 本客群全部 3 人，包含零资产用户/);
    assert.match(page,/<span>总入金，共 3 笔交易<\/span><em>人均 0\.0 万 · 1 笔<\/em>/);
    assert.equal((page.match(/<span>首投\/复投间隔中位数<\/span>/g)||[]).length,7);
    assert.match(page,/<b>1\.0小时\/2\.0小时<\/b><span>首投\/复投间隔中位数<\/span><em>平均数：1\.0小时\/2\.0小时<\/em>/);
    assert.match(page,/<b>1\.0小时\/—<\/b><span>首投\/复投间隔中位数<\/span><em>平均数：1\.0小时\/—<\/em>/);
    assert.doesNotMatch(page,/首投平均间隔|二次平均间隔|暂无二次入金间隔/);
    assert.equal((page.match(/<th[^>]*>首笔入金<\/th><th>入金次数<\/th><th>总入金<\/th><th[^>]*>首笔入金提问数<\/th><th>总提问数<\/th>/g)||[]).length,6);
    assert.match(page,/<th[^>]*>绑定时资产<\/th><th[^>]*>今年绑前入金<\/th><th[^>]*>最近交易日<\/th><th>绑定后新增入金<\/th><th>笔数<\/th><th>当前资产<\/th>/);
    assert.equal((page.match(/<th>注册日期<\/th><th[^>]*>首次入金日期<\/th>/g)||[]).length,7);
    assert.match(page,/data-sort-value="2025-01-01">2025-01-01/);
    assert.match(page,/<body data-report-year="2026">/);
    assert.match(page,/>500<\/td>\s*<td class="num">120<\/td><td class="num">2026-10-09<\/td>\s*<td class="num">40<\/td><td class="num">2<\/td>\s*<td class="num">400<\/td>/);
    assert.match(page,/<td class="num">10<\/td><td class="num">1<\/td><td class="num">10<\/td><td class="num">4<\/td><td class="num">10<\/td>/);
    assert.doesNotMatch(page,/新客 0 人/);
    assert.match(page,/一日内入金 1 人 · 复投 0 人/);
    assert.match(page,/<th>使用设备<\/th><th[^>]*>绑定→首次App操作<\/th>/);
    assert.match(page,/<td>iOS<\/td><td[^>]*>5 分 30 秒<\/td>/);
    assert.match(page,/<td>安卓<\/td><td[^>]*>未查到操作<\/td>/);
    assert.doesNotMatch(page,/App 使用证据|iOS App ·|安卓 App ·/);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('Lifetime first-inflow date review is complete and cannot substitute a later post-bind date',()=>{
  const script=`
import importlib.util,json,copy
spec=importlib.util.spec_from_file_location('dates','scripts/qianwen-cases/apply-first-inflow-dates.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base={'meta':{},'users':[{'pmid':'fixture','first_inflow_ever':'2020-01-01 10:00:00','derived':{'first_inflow_after':'2026-10-10 10:00:00'}}]}
row={'pmid':'fixture','first_inflow_ever':'2020-01-01 10:00:00','reviewed':True}
errors=[]
for rows in [[],[row,row],[{**row,'first_inflow_ever':None}],[{**row,'first_inflow_ever':'2026-10-10 10:00:00'}],[{**row,'first_inflow_ever':'2026-10-11 10:00:00'}]]:
 try:m.apply_dates(copy.deepcopy(base),rows);errors.append(False)
 except ValueError:errors.append(True)
good=m.apply_dates(copy.deepcopy(base),[row]);print(json.dumps({'errors':errors,'first':good['users'][0]['first_inflow_ever'],'complete':good['meta']['first_inflow_dates_audit_complete']}))
`;
  const run=spawnSync('python3',['-c',script],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout),{errors:[true,true,true,true,true],first:'2020-01-01 10:00:00',complete:true});
});

test('Pre-binding history rejects incomplete coverage, unknown totals and post-binding transactions', () => {
  const script = `
import importlib.util,json,copy
spec=importlib.util.spec_from_file_location('history','scripts/qianwen-cases/apply-binding-history.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base={'meta':{'cutoff':'2026-10-15 09:58:45'},'users':[{'pmid':'fixture','fb':'2026-10-10 10:00:00'}]}
row={'pmid':'fixture','ytd_inflow_before':100,'last_trade_before':'2026-10-09 12:00:00','reviewed':True}
bad=[[],[row,row],[{**row,'reviewed':False}],[{**row,'ytd_inflow_before':None}],[{**row,'ytd_inflow_before':-1}],[{**row,'last_trade_before':None}],[{**row,'last_trade_before':'2026-10-10 10:00:00'}]]
errors=[]
for items in bad:
 try:m.apply_history(copy.deepcopy(base),items);errors.append(False)
 except ValueError:errors.append(True)
zero=m.apply_history(copy.deepcopy(base),[{**row,'ytd_inflow_before':0,'last_trade_before':None}])
print(json.dumps({'errors':errors,'zero':zero['users'][0]['binding_history']['ytd_inflow_before'],'complete':zero['meta']['binding_history_audit_complete']}))
`;
  const run=spawnSync('python3',['-c',script],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout),{errors:[true,true,true,true,true,true,true],zero:0,complete:true});
});

test('App operation audit rejects device-registration substitutions and out-of-window operations', () => {
  const script = `
import importlib.util,json,copy
spec=importlib.util.spec_from_file_location('app','scripts/qianwen-cases/apply-app-operations.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base={'meta':{'cutoff':'2026-10-15 09:58:45'},'users':[{'pmid':'fixture','fb':'2026-10-10 10:00:00'}]}
row={'pmid':'fixture','first_app_operation_at':'2026-10-10 10:05:00','first_app_operation_platform':'iOS','device_platforms':['iOS'],'reviewed':True}
bad=[{**row,'reviewed':False},{**row,'first_app_operation_at':'2026-10-10 09:59:59'},{**row,'first_app_operation_at':'2026-10-15 09:58:45'},{**row,'first_app_operation_platform':'MiniProgram'},{**row,'device_platforms':['js']},{**row,'first_app_operation_at':None}]
errors=[]
for item in bad:
 try:m.apply_operations(copy.deepcopy(base),[item]);errors.append(False)
 except ValueError:errors.append(True)
none=m.apply_operations(copy.deepcopy(base),[{**row,'first_app_operation_at':None,'first_app_operation_platform':None}])
print(json.dumps({'errors':errors,'none':none['users'][0]['app_operation']['first_at'],'devices':none['users'][0]['app_operation']['device_platforms']}))
`;
  const run=spawnSync('python3',['-c',script],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout),{errors:[true,true,true,true,true,true],none:null,devices:['iOS']});
});

test('Question audit requires full coverage, integers, consistent first inflow and actual zero counts', () => {
  const script = `
import importlib.util,json,copy
spec=importlib.util.spec_from_file_location('questions','scripts/qianwen-cases/apply-question-counts.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base={'meta':{'cutoff':'2026-10-15 09:58:45'},'users':[{'pmid':'fixture','coverage':'funding_only','fb':'2026-10-10 10:00:00','derived':{'first_inflow_after':'2026-10-10 11:00:00'}}]}
good={'pmid':'fixture','first_inflow_after':'2026-10-10T11:00:00','total_questions':10,'pre_first_inflow_questions':3}
cases=[[],[good,good],[{**good,'total_questions':None}],[{**good,'total_questions':1.5}],[{**good,'pre_first_inflow_questions':11}],[{**good,'pre_first_inflow_questions':-1}],[{**good,'first_inflow_after':'2026-10-10 12:00:00'}]]
errors=[]
for rows in cases:
 try:m.apply_counts(copy.deepcopy(base),rows);errors.append(False)
 except ValueError:errors.append(True)
result=m.apply_counts(copy.deepcopy(base),[{**good,'total_questions':0,'pre_first_inflow_questions':0}])
print(json.dumps({'errors':errors,'zero':result['users'][0]['question_stats']['total_questions'],'reviewed':result['meta']['question_stats_audit_complete']}))
`;
  const run=spawnSync('python3',['-c',script],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout),{errors:[true,true,true,true,true,true,true],zero:0,reviewed:true});
});

test('Asset review cannot fill unknown as zero or mix asset dates', () => {
  const script = `
import importlib.util,json,copy
spec=importlib.util.spec_from_file_location('assets','scripts/qianwen-cases/apply-reviewed-assets.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base={'meta':{},'users':[{'pmid':'fixture'}]}
exact={'pmid':'fixture','as_of':'2026-10-14','total_asset':'12.34','status':'exact','source_date':'2026-10-14','basis':'same-day ROOT'}
bad=[{**exact,'status':'not_available'},{**exact,'total_asset':None},{**exact,'status':'verified_zero','basis':''}]
errors=[]
for row in bad:
 try:m.apply_review(copy.deepcopy(base),[row]);errors.append(False)
 except ValueError:errors.append(True)
good=m.apply_review(copy.deepcopy(base),[exact])
zero=m.apply_review(copy.deepcopy(base),[{**exact,'status':'verified_zero','total_asset':0,'source_date':None,'basis':'no historical funding or assets before as_of'}])
print(json.dumps({'errors':errors,'complete':good['meta']['assets_audit_complete'],'amount':good['users'][0]['asset_latest']['ta'],'zero':zero['users'][0]['asset_latest']['ta']}))
`;
  const run=spawnSync('python3',['-c',script],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout),{errors:[true,true,true],complete:true,amount:12.34,zero:0});
});
