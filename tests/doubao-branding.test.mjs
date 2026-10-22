import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const expected='563b9313a67d50ab1d792d9794db7a4811e6cb0ea29291fcaaa5ca10d89d8996';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('Doubao service uses the official Yingmi AI logo and consistent published branding',()=>{
 const html=read('public/reports/doubao-user-acquisition-dashboard/index.html');
 assert.ok(html.includes('<h1 id="hero-title">豆包・盈米AI服务<br />'));
 assert.ok(html.includes('DOUBAO × YINGMI AI'));
 assert.ok(!html.includes('DOUBAO × QIEMAN AI'));
 const img=html.match(/<img src="data:image\/png;base64,([^"]+)" alt="盈米AI" width="26" height="26"/);
 assert.ok(img);assert.equal(sha(Buffer.from(img[1],'base64')),expected);
 assert.equal(sha(readFileSync(new URL('public/reports/doubao-user-acquisition-dashboard/assets/yingmi-ai-logo.png',root))),expected);
 assert.ok(html.includes('alt="豆包"'));assert.ok(!html.includes('alt="且慢"'));
 const preview=read('public/previews/doubao-user-acquisition-dashboard.svg');
 assert.ok(preview.includes('豆包・盈米AI服务'));assert.ok(preview.includes('data:image/png;base64,'+img[1]));
 assert.ok(read('src/app.js').includes('title: "豆包・盈米AI服务｜用户数据看板"'));
 assert.ok(read('scripts/encrypt-doubao-dashboard.mjs').includes('<title>豆包・盈米AI服务｜用户引流成效</title>'));
 assert.ok(read('scripts/doubao-cases/build-cases.py').includes('DOUBAO × YINGMI AI · CASE EXPLORER'));
 const data=JSON.parse(read('public/reports/doubao-user-acquisition-dashboard/data/latest.json'));
 assert.equal(data.meta.title,'豆包・盈米AI服务 用户数据看板');
});

test('Doubao wan display uses one decimal without changing yuan precision or input values',()=>{
 const program=String.raw`
import ast,copy,json
from pathlib import Path
tree=ast.parse(Path('scripts/doubao-cases/build-cases.py').read_text())
nodes=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ('wan','money')]
ns={}
exec(compile(ast.Module(body=nodes,type_ignores=[]),'doubao_amount_format','exec'),ns)
values=[20858,19839.783384,16350,10000,2200,1385.969426]
before=copy.deepcopy(values)
assert [ns['wan'](v) for v in values[:5]]==['2.1 万','2.0 万','1.6 万','1.0 万','2,200 元']
assert ns['money'](values[-1])=='1,385.97'
assert ns['money'](values[0])=='20,858'
assert values==before
print(json.dumps({'status':'passed'}))
`;
 const run=spawnSync('python3',['-c',program],{cwd:root,encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 assert.equal(JSON.parse(run.stdout).status,'passed');
});
