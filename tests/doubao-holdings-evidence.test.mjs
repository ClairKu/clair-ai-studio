import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

test('Doubao product table does not invent wallet retention or overstate holding certainty', () => {
  const program = String.raw`
import ast,html,json,re
from pathlib import Path
from datetime import datetime
source=Path('scripts/doubao-cases/build-cases.py').read_text()
node=next(n for n in ast.parse(source).body if isinstance(n,ast.FunctionDef) and n.name=='holdings_block')
ns={'dt':lambda s:datetime.fromisoformat(s),'money':lambda v:f'{float(v):,.2f}','esc':lambda s:html.escape(str(s))}
exec(compile(ast.Module(body=[node],type_ignores=[]),'holdings','exec'),ns)
u={'fb':'2026-10-01T00:00:00','derived':{'inflow_after':1000},'trades':[{'accept_time':'2026-10-02T00:00:00','canceled':0,'trade_type':'fund.buy','po_code':'FUND','buy':1200}],
 'holdings':[{'kind':'自助基金','code':'FUND','name':'基金自助交易','name_basis':'amount_match_inferred','value':0},{'kind':'钱包','code':'WALLET','name':'盈米宝','value':16},{'kind':'钱包','code':'WALLET','name':'盈米宝','value':1}], 'fund_detail':[],'holdings_meta':{'as_of':'2026-10-16'}}
page=ns['holdings_block'](u)
assert page.count('<td class="num">—</td>')==2
assert '买入金额' in page and '已列小计' in page and '入金金额' not in page
assert '基金自助交易（关联待核）' in page
assert '<td class="num">1,200.00 元</td><td class="num">17.00 元</td>' in page
assert '钱包的部分' not in page
u['holdings']=[{'kind':'自助基金','code':'FUND','name':'基金自助交易','name_basis':'exact_meta','value':0}]
assert '0.00 元</td></tr>' in ns['holdings_block'](u)
u['holdings']=[{'kind':'买入记录','code':'FUND','name':'基金自助交易','name_basis':'trade_history_only','value':None,'buy':1200}]
pending=ns['holdings_block'](u)
assert '买入记录，非当前持仓' in pending and '无当前持仓市值' in pending
print(json.dumps({'wallet_rows':2,'status':'passed'}))
`;
  const run = spawnSync('python3', ['-c', program], { cwd: resolve(import.meta.dirname, '..'), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).status, 'passed');
});
