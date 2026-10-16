import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('Doubao publication requires every case asset to be reviewed on the same date', () => {
  const dir = mkdtempSync(join(tmpdir(), 'doubao-assets-test-'));
  try {
    const cutoff = '2026-10-16T09:26:37+08:00';
    const assetDay = '2026-10-14';
    const makeUser = (pmid, cohort, ta, status) => ({
      pmid, cohort, fb: '2026-10-01T10:00:00', first_inflow_ever: '2026-10-15T10:00:00',
      flags: { zero_at_bind: true, first_invest_after: true, new_first_invest: cohort === 'new', recall: cohort === 'existing' },
      derived: { inflow_after: 50, first_inflow_after: '2026-10-15T10:00:00' },
      inflow_txns: [{ t: '2026-10-15T10:00:00', amt: 50 }],
      asset_latest: { cal_date: assetDay, ta, status, basis: 'Reviewed source evidence', source_date: status === 'exact' ? assetDay : null },
    });
    const users = [makeUser('10001', 'new', 100, 'exact'), makeUser('10002', 'existing', 0, 'verified_zero')];
    const segment = (id, selected) => ({
      id, asset_as_of: assetDay, population_accounts: selected.length, inflow_accounts: selected.length,
      inflow_transactions: selected.length, inflow_amount_wan: selected.length * 0.005,
      total_asset_wan: selected.reduce((sum, u) => sum + u.asset_latest.ta, 0) / 10000,
      holder_accounts: selected.filter(u => u.asset_latest.ta > 0).length,
    });
    const main = { meta: { data_cutoff: cutoff }, segments: { items: [
      segment('all', users), segment('reinvested', users), segment('new_inv', users), segment('first_inv', users),
      segment('new_first_inv', [users[0]]), segment('existing_reactivated', [users[1]]), segment('existing_first_inv', [users[1]]),
    ] } };
    const cases = { meta: { cutoff, asset_as_of: assetDay, assets_audit_complete: true }, users };
    const mainPath = join(dir, 'main.json'), casesPath = join(dir, 'cases.json');
    writeFileSync(mainPath, JSON.stringify(main));
    const run = () => {
      writeFileSync(casesPath, JSON.stringify(cases));
      return spawnSync('python3', ['scripts/doubao-cases/validate-alignment.py', mainPath, casesPath], { cwd: resolve(import.meta.dirname, '..'), encoding: 'utf8' });
    };
    assert.equal(run().status, 0, 'same-day exact plus evidence-backed zero must close');
    users[1].asset_latest = null;
    const missing = run();
    assert.notEqual(missing.status, 0, 'missing assets must not silently become zero');
    assert.match(missing.stderr, /禁止按零计入总资产/);
    users[1].asset_latest = { cal_date: '2026-10-13', ta: 0, status: 'verified_zero', basis: 'reviewed' };
    assert.notEqual(run().status, 0, 'mixed asset dates must fail');
    users[1].asset_latest = { cal_date: assetDay, ta: 0, status: 'verified_zero' };
    assert.notEqual(run().status, 0, 'verified zero without evidence must fail');
    users[1].asset_latest = { cal_date: assetDay, ta: 200, status: 'exact', basis: 'reviewed' };
    assert.notEqual(run().status, 0, 'case and dashboard asset sums must match');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
