import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,randomBytes} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {redactQuestion,loadQuestionRules,encryptUserChunk} from '../scripts/qianwen-cases/build-question-top100.mjs';

test('Question originals retain lines while masking direct identifiers and credentials',()=>{
  const raw='请比较020602\n电话13812345678 邮箱test@example.com\napi_key=sk-abcdefghijklmnopqrstuvwxyz123456';
  const safe=redactQuestion(raw);
  assert.match(safe,/020602\n/);
  assert.doesNotMatch(safe,/13812345678|test@example\.com|sk-abcdefghijklmnopqrstuvwxyz/);
  assert.match(safe,/手机号已隐藏/);
});

test('Reused question rules do not execute source fetching and distinguish known presets',async()=>{
  const classify=await loadQuestionRules(resolve(import.meta.dirname,'..'));
  assert.equal(classify('帮我看看现在的持仓结构，给出优化建议').preset.version,'launch_v1');
  assert.equal(classify('我想找一个和自己投资计划更匹配的且慢策略，可以推荐几个候选，并说说它们分别适合什么样的情况吗？').preset.version,'qieman_guided_v3');
  assert.equal(classify('我这笔钱三年后要用，如何分配？').preset,null);
});

test('User question chunks are compressed encrypted and cryptographically bound to the anonymous user',async()=>{
  const salt=randomBytes(16),material=await webcrypto.subtle.importKey('raw',new TextEncoder().encode('fixture-only'),'PBKDF2',false,['deriveKey']);
  const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  const value={key:'anon_fixture',questions:[{i:1,t:'2026-10-15 08:00:00',q:'原文测试'}]};
  const out=await encryptUserChunk(value,key,salt,'anon_fixture');
  assert.doesNotMatch(JSON.stringify(out),/原文测试/);
  const options={name:'AES-GCM',iv:Buffer.from(out.iv,'base64'),additionalData:new TextEncoder().encode('anon_fixture')};
  const plain=await webcrypto.subtle.decrypt(options,key,Buffer.from(out.data,'base64'));
  assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(plain))),value);
  await assert.rejects(webcrypto.subtle.decrypt({...options,additionalData:new TextEncoder().encode('another_user')},key,Buffer.from(out.data,'base64')));
});

test('Top100 panel is non-eager and renders originals through textContent, with no inline raw-HTML insertion',async()=>{
  const panel=await readFile(new URL('../scripts/qianwen-cases/question-top100-panel.html',import.meta.url),'utf8');
  assert.doesNotMatch(panel,/\.innerHTML\s*=|console\.(?:log|debug)/);
  assert.match(panel,/每页 50 条/);
  assert.match(panel,/查看提问原文/);
  assert.match(panel,/推荐题匹配（推断）/);
  assert.match(panel,/其它输入（来源未确认）/);
  assert.match(panel,/selectUser\(first,false\)/);
});
