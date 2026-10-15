import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const cutoff = '2026-10-15 09:58:45';
const bound = '2026-10-10T10:00:00';
const row = (id, cohort = 'new') => ({
  pmid: id, account3_id: id, cohort, fb: bound, registered_at: cohort === 'new' ? bound : '2025-01-01T00:00:00',
  asset_at_bind: 0, first_buy_ever: null, last_buy_before: null, gender: 'M', age: 40,
});
const trade = (id, time, type, extra, amount, canceled = 0) => ({
  user_id: id, accept_time: time, trade_type: type, extra, buy_amount: amount,
  redeem_amount: 0, canceled, po_code: type === 'wallet.recharge' ? 'WALLET' : 'ZH000001', po_name: '测试产品',
});

for (const platform of ['qianwen', 'doubao']) {
  test(`${platform}: wallet recharge is first investment; prior inflow and existing balance are handled correctly`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'inflow-definition-'));
    try {
      const candidates = [row('91001'), row('91002', 'existing'), row('91003', 'existing'), row('91004')];
      // 仅充值的新户；历史已充值但绑定后才首次买产品的老户；第一次充值的老户；仅宝余额买产品。
      candidates[1].first_buy_ever = '2026-10-11T11:00:00';
      candidates[0].first_inflow_ever = candidates[0].first_inflow_after = '2026-10-10T10:05:00';
      const fixtures = {
        'candidates.json': candidates,
        'd_trades.json': [
          trade('91001', '2026-10-10T10:01:00', 'wallet.recharge', 'by.online', 10, 1),
          trade('91001', '2026-10-10T10:05:00', 'wallet.recharge', 'by.online', 100),
          trade('91001', '2026-10-15T10:00:00', 'wallet.recharge', 'by.online', 999),
          trade('91002', '2025-01-02T12:00:00', 'wallet.recharge', 'by.offline', 200),
          trade('91002', '2026-10-11T11:00:00', 'po.buy', 'from.card', 80),
          trade('91003', '2026-10-11T12:00:00', 'wallet.recharge', 'by.offline', 50),
          trade('91004', '2026-10-11T13:00:00', 'po.buy', 'from.wallet', 500),
        ],
        'd_risk.json': [], 'd_asks.json': [], 'd_assets.json': [],
        'd_device.json': [
          { po_manager_id: '91001', platform: '3', created_on: '2026-10-16T10:00:00', updated_on: '2026-10-16T10:00:00' },
          { po_manager_id: '91003', platform: '3', created_on: '2026-10-11T11:59:00', updated_on: '2026-10-16T10:00:00' },
        ],
        'm_sensors.json': [
          { broker_user_id: '91001', event_time: '2026-10-10T10:05:00', lib: 'MiniProgram', event_category: '浏览', page_name: '资产页' },
          { broker_user_id: '91002', event_time: '2026-10-11T11:00:00', lib: 'Android', event_category: '浏览', page_name: '资产页' },
        ],
      };
      for (const [name, data] of Object.entries(fixtures)) writeFileSync(join(dir, name), JSON.stringify(data));
      const run = spawnSync('python3', [`scripts/${platform}-cases/assemble-users.py`, dir, cutoff, '4'], { cwd: root, encoding: 'utf8' });
      assert.equal(run.status, 0, run.stderr);
      const users = JSON.parse(readFileSync(join(dir, 'users.json'))).users;
      assert.equal(users.length, 3, '宝余额买产品不进入新增入金客群');
      const byId = new Map(users.map(u => [u.pmid, u]));
      assert.equal(byId.get('91001').flags.new_first_invest, true, '仅充值也算新户首投');
      assert.equal(byId.get('91001').derived.inflow_after, 100, '取消和截止后的充值不计入');
      assert.equal(byId.get('91001').derived.first_buy_after, null, '产品事实保留为空');
      assert.equal(byId.get('91001').derived.first_inflow_after, '2026-10-10T10:05:00');
      assert.equal(byId.get('91002').flags.first_invest_after, false, '历史充值用户不能因首次买产品再次计首投');
      assert.equal(byId.get('91002').flags.recall, true);
      assert.equal(byId.get('91003').flags.first_invest_after, true, '首次充值老户也算首投');
      assert.equal(byId.get('91001').dev.length, 0, '截止后设备注册不能倒灌');
      assert.equal(byId.get('91003').dev[0].updated_on, null, '截止后的设备活动不能倒灌');
      const build = spawnSync('python3', [`scripts/${platform}-cases/build-cases.py`, join(dir, 'users.json'), join(dir, 'page.html'), `scripts/${platform}-cases/base.css`], { cwd: root, encoding: 'utf8' });
      assert.equal(build.status, 0, build.stderr);
      const html = readFileSync(join(dir, 'page.html'), 'utf8');
      assert.match(html, /data-scope-link="existing_first_inv">首投 1 人/);
      assert.match(html, /data-scope-link="existing_returned">清仓后唤回 1 人/);
      assert.match(html, /绑定后首笔入金/);
      assert.doesNotMatch(html, /绑定后首笔投资/);
      assert.match(html, /id="scope-existing_returned"/);
      assert.match(html, /2\/3 人有 App 设备注册或原生使用记录，1 人绑定后有原生记录；1 人首笔入金前后 30 分钟有原生 App 记录/);
      assert.doesNotMatch(html, /MiniProgram App|下载 App|没有装 App|直接确认在 App 完成/);
      assert.match(html, /小程序/);
      assert.match(html, /App 使用证据/);
      candidates[0].first_inflow_ever = '2026-10-10T10:06:00';
      writeFileSync(join(dir, 'candidates.json'), JSON.stringify(candidates));
      const mismatch = spawnSync('python3', [`scripts/${platform}-cases/assemble-users.py`, dir, cutoff, '4'], { cwd: root, encoding: 'utf8' });
      assert.notEqual(mismatch.status, 0, '候选首投时点与历史不一致必须阻断发布');
      assert.match(mismatch.stderr, /候选与完整交易历史不一致/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
