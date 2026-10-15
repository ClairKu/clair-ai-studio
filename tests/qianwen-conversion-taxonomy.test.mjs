import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

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
