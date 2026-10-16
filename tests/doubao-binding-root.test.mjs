import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

test('Doubao binding assets aggregate all ROOT rows on the latest eligible day', () => {
  const program = String.raw`
import re,sqlite3,json
from pathlib import Path
db=sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE assets(account3_id INTEGER,relation_account_type TEXT,cal_date TEXT,total_asset REAL);
INSERT INTO assets VALUES
 (10,'ROOT','2026-10-01',100),(10,'ROOT','2026-10-02',0),(10,'ROOT','2026-10-02',300),
 (10,'CA','2026-10-02',9000),(10,'ROOT','2026-10-03',500),
 (20,'ROOT','2026-10-01',500),(20,'ROOT','2026-10-02',0),(20,'ROOT','2026-10-02',0),
 (30,'CA','2026-10-02',700);
CREATE TABLE bindings(pmid INTEGER,fb TEXT);
INSERT INTO bindings VALUES(1,'2026-10-02 12:00:00'),(2,'2026-10-02 12:00:00'),(3,'2026-10-02 12:00:00');
CREATE TABLE people(po_manager_id INTEGER,account3_id INTEGER,cohort TEXT);
INSERT INTO people VALUES(1,10,'existing'),(2,20,'existing'),(3,30,'new');
''')
def portable(sql):
 return re.sub(r'USE INDEX\(idx_user\)','',sql).replace('ying99_asset.dwd_app_service_account_profit_combine','assets')
case_source=Path('scripts/doubao-cases/fetch-all.sh').read_text()
expr=re.search(r'(CASE WHEN p\.account3_id IS NULL THEN NULL ELSE.*?END) AS asset_at_bind',case_source,re.S).group(1)
scalar=[]
for account in (10,20,30,None):
 scalar.append(db.execute("WITH p AS (SELECT ? account3_id),b AS (SELECT '2026-10-02 12:00:00' fb) SELECT "+portable(expr)+" FROM p,b",(account,)).fetchone()[0])
assert scalar==[300.0,0.0,None,None],scalar
main_source=Path('scripts/doubao-refresh/run-ext-sql.sh').read_text()
query=re.search(r'Q candidates 900 "(.*?)" \|\|',main_source,re.S).group(1)
query=query.replace('$B','bindings b JOIN people p ON p.po_manager_id=b.pmid').replace('$COHORT','p.cohort')
rows=db.execute(portable(query)).fetchall()
assert rows==[('existing',1,300.0),('existing',2,0.0)],rows
print(json.dumps({'case_scalar':scalar,'latest_day_candidate_rows':rows}))
`;
  const run = spawnSync('python3', ['-c', program], { cwd: resolve(import.meta.dirname, '..'), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.deepEqual(result.case_scalar, [300, 0, null, null]);
  assert.equal(result.latest_day_candidate_rows.length, 2);
});

test('Doubao MIA detail SQL quotes its source and excludes messages after cutoff', () => {
  const program = String.raw`
import re,sqlite3,json
from pathlib import Path
source=Path('scripts/doubao-cases/fetch-all.sh').read_text()
sql=re.search(r'F "\$W/m_mia_msgs.json" "(.*?)" 300',source).group(1)
assert r'\x60' not in sql
assert r'\`ying99_mia\`.\`user_message\`' in sql
sql=sql.replace('\\'+chr(96),chr(96)).replace('$IDS','1').replace('$CUT','2026-10-16 15:06:38')
sql=sql.replace('LEFT(content,120)','SUBSTR(content,1,120)')
db=sqlite3.connect(':memory:')
db.execute("ATTACH DATABASE ':memory:' AS ying99_mia")
db.execute('CREATE TABLE ying99_mia.user_message(owner_id,sender_id,sender_platform_id,scene,query_mode,serve_mode,msg_type,content_type,bot_id,session_id,content,create_time,deleted_at)')
for t in ('2026-10-16 15:06:37','2026-10-16 15:06:39'):
 db.execute('INSERT INTO ying99_mia.user_message VALUES(1,\'USER\',NULL,NULL,NULL,NULL,NULL,NULL,NULL,\'s\',\'hello\',?,NULL)',(t,))
rows=db.execute(sql).fetchall()
assert len(rows)==1 and rows[0][-1]=='2026-10-16 15:06:37',rows
print(json.dumps({'included_messages':len(rows)}))
`;
  const run = spawnSync('python3', ['-c', program], { cwd: resolve(import.meta.dirname, '..'), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).included_messages, 1);
});
