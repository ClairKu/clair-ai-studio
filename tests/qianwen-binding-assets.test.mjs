import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

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
