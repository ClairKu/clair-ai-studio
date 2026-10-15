import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
      coverage:'funding_only',trades:[],asks:[],dev:[],risk:[],events:[],channels:{},
      asset_latest:{cal_date:'2026-10-14',ta:100*(i+1)},
      inflow_txns:[{t:'2026-10-10 11:00:00',amt:10*(i+1)}],
      derived:{inflow_after:10*(i+1),first_inflow_after:'2026-10-10 11:00:00',buy_amount_after:null,cancels_after:0},
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
    assert.match(page,/sumrow-four/);
  } finally { rmSync(dir,{recursive:true,force:true}); }
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
