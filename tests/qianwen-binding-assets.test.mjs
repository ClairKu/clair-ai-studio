import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

test('Binding asset candidates sum every ROOT on the latest eligible day',()=>{
  const source=readFileSync('scripts/qianwen-refresh/run-ext-sql.sh','utf8');
  const query=source.slice(source.indexOf('Q candidates 900'),source.indexOf('# 候选表 →'));
  assert.match(query,/SUM\(d\.total_asset\) AS total_asset/);
  assert.match(query,/GROUP BY u\.pmid,u\.cohort,d\.cal_date/);
  assert.match(query,/d\.cal_date<=DATE\(u\.fb\)/);
  assert.match(query,/ROW_NUMBER\(\) OVER\(PARTITION BY pmid ORDER BY cal_date DESC\)/);
  assert.doesNotMatch(query,/LIMIT 1/);
  assert.match(source,/SUM\(d\.total_asset\)[\s\S]*?MAX\(dm\.cal_date\)/);
  assert.match(query,/ORDER BY cohort,pmid" \|\| \{[^\n]*exit 1;/);
  assert.match(source,/python3 - "\$W" <<'PYEOF' \|\| exit 1/);
});

test('Operating holding totals reuse the exact same cohort aggregate as the segment panel',()=>{
  for(const channel of ['qianwen','doubao']){
    const source=readFileSync(`scripts/${channel}-refresh/build-q.py`,'utf8');
    assert.match(source,/wan = round\(F\(sg\[co\]\["asset_wan"\]\), 2\)/);
    assert.doesNotMatch(source,/wan = round\(ast\["new"\]\["wan"\] \+ ast\["existing"\]\["wan"\]/);
  }
});

test('Operating asset dates remain the asset snapshot date, not the funding cutoff',()=>{
  for(const channel of ['qianwen','doubao']){
    const source=readFileSync(`scripts/${channel}-refresh/assemble.py`,'utf8');
    assert.match(source,/"data_as_of": q4\["as_of"\] if sid == "holding_amount" else cutoff/);
  }
});

test('Operating funding totals reuse sum-before-round segment amounts',()=>{
  for(const channel of ['qianwen','doubao']){
  const script=`
import ast,json
from pathlib import Path
tree=ast.parse(Path('scripts/${channel}-refresh/build-q.py').read_text())
node=next(n for n in ast.walk(tree) if isinstance(n,ast.Assign) and any(isinstance(t,ast.Subscript) and isinstance(t.value,ast.Name) and t.value.id=='business' for t in n.targets))
out={}
for co,scope in [('all','new_inv'),('new','new_first_inv'),('existing','existing_reactivated')]:
 ns={'co':co,'business':{},'wan':0,'hcnt':0,'I':int,'F':float,
 'm':{'inflow_users':2,'inflow_wan':2.0,'inflow_txns':2,'buy_users':2,'buy_wan':2,'sell_users':0,'sell_wan':0},
 'z':{'zero_users':2,'zero_wan':2.0},'sg':{co:{'inflow_wan':'2.0001','inflow_txns':2},scope:{'inflow_wan':'2.0001'}}}
 exec(compile(ast.Module(body=[node],type_ignores=[]),'funding-rounding','exec'),ns)
 row=ns['business'][co]
 out[co]=[row['inflow_amount']['amount_wan'],row['zero_asset_inflow_amount']['amount_wan']]
print(json.dumps(out))
`;
  const result=spawnSync('python3',['-c',script],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(result.stdout),{all:[2.0001,2.0001],new:[2.0001,2.0001],existing:[2.0001,2.0001]});
  }
});
