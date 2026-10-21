import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

test('private refresh uses current config and durable identity-free templates', () => {
  const run = spawnSync('python3', ['-c', String.raw`
import pathlib,json,tempfile,importlib.util
source=pathlib.Path('scripts/qianwen-cases/refresh-private.py').resolve()
spec=importlib.util.spec_from_file_location('refresh_fixture',source);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
with tempfile.TemporaryDirectory() as temp:
 root=pathlib.Path(temp);old=root/'previous'/'qianwen-cases';old.mkdir(parents=True);work=root/'current';work.mkdir()
 put=lambda p,d:p.write_text(json.dumps(d))
 put(old/'users-with-dates.json',{'meta':{'asset_as_of':'2030-05-01'},'users':[]});put(old/'candidates.json',[])
 cfg={'source':str(source.parents[2]),'private_root':str(work),'previous_private_root':str(old.parent),'cutoff':'2030-05-07 10:00:00','asset_as_of':'2030-05-06'};put(root/'config.json',cfg)
 q=mod.Refresh(root/'config.json');row={'pmid':11,'fb':'2030-05-02T10:00:00','account3_id':22};put(q.W/'metadata.json',[row]);put(q.W/'txns.json',[{'pmid':11,'fb':row['fb'],'accept_time':'2030-05-03T10:00:00'}]);put(q.R/'candidates.json',[row])
 coverage=q.queries('asset_date_coverage')
 assert all(day in coverage for day in ('2030-05-01','2030-05-05','2030-05-06','2030-05-07'))
 assert '2026-10-' not in coverage and 'SUM(total_asset)' in coverage and "relation_account_type='ROOT'" in coverage
 metadata=q.queries('metadata');assert '2030-05-07 10:00:00' in metadata and 'IN (11)' in metadata
 asks=q.queries('rich/d_asks');assert '11 pmid' in asks and '2030-05-02 10:00:00' in asks and '2030-05-03 10:00:00' in asks
 assert "m.role='USER'" in asks and 'm.dj_gmt_create>=b.fb' in asks and 'm.is_deleted=0' in asks and 's.qmuser_user_id=b.pmid' in asks
 mia=q.queries('rich/m_mia_msgs');assert 'LEFT(content' not in mia and 'session_id,content,create_time' in mia and 'owner_id IN (11)' in mia and 'deleted_at IS NULL' in mia
 for path in source.parent.glob('query-templates/**/*.sql'):
  text=path.read_text();assert '/private/tmp/' not in text and 'SELECT 91 pmid' not in text
 assert '/private/tmp/' not in source.read_text()
print('pass')
`], { cwd: resolve(import.meta.dirname, '..'), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout.trim(), 'pass');
});
