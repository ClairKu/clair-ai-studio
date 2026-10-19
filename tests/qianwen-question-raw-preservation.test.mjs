import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('scripts/qianwen-refresh/build-question-corpus.mjs','utf8');
const definitions=source.slice(source.indexOf('const DIRECTION_IDS ='),source.indexOf('const sql ='));
const functions=source.slice(source.indexOf('function redact(input)'),source.indexOf('let redactedRows ='));
const context=vm.createContext({});
new vm.Script(definitions+'\n'+functions+'\n globalThis.rules={compact,redact,redactOriginal,requireOriginalQuestion,classify};').runInContext(context,{timeout:1000});
const {compact,redact,redactOriginal,requireOriginalQuestion,classify}=context.rules;

test('Main question display retains full whitespace while analysis remains normalized',()=>{
  const raw='  第一行\r\n第二行\t两格  间距\n第三行\r第四行  '+ '完整内容'.repeat(100);
  assert.equal(redactOriginal(raw),raw);
  assert.equal(redact(raw),compact(raw));
  assert.equal(JSON.stringify(classify(compact(raw))),JSON.stringify(classify(compact(redactOriginal(raw)))));
  assert.match(source,/REGEXP_REPLACE\(TRIM\(m\.user_input\), '\[\[:space:\]\]\+', ' '\) AS question,\s+m\.user_input AS raw_question/);
  assert.match(source,/const original = compact\(row\.question\)/);
  assert.match(source,/const classified = classify\(original\)/);
  assert.doesNotMatch(source,/classify\(row\.raw_question\)/);
  assert.match(source,/q: row\.rawQuestion/);
  assert.doesNotMatch(source,/row\.raw_question\s*\?\?\s*row\.question/);
  assert.match(source,/topQuestionMap\.has\(row\.question\)/);
});

test('Missing raw query fields fail closed instead of silently flattening originals',()=>{
  assert.throws(()=>requireOriginalQuestion({question:'规范化文本'}),/raw_question/);
  assert.throws(()=>requireOriginalQuestion({raw_question:null}),/raw_question/);
  assert.throws(()=>requireOriginalQuestion({raw_question:'\n\t '}),/raw_question/);
  assert.equal(requireOriginalQuestion({raw_question:'第一行\n第二行'}),'第一行\n第二行');
  assert.match(source,/const rawOriginal = requireOriginalQuestion\(row\)/);
  assert.match(source,/const rawQuestion = redactOriginal\(rawOriginal\)/);
});

test('Original whitespace does not bypass identifier, credential or explicit self-name masking',()=>{
  const raw='第一行\nexample@example.com\tapi_key: syntheticKey123456\n1234\t5678\r\n9012 3456\n我叫示例甲乙，你还记得我吗\r最后一行';
  const safe=redactOriginal(raw);
  assert.doesNotMatch(safe,/example@example\.com|syntheticKey123456|示例甲乙|1234/);
  assert.match(safe,/\[邮箱\]/);
  assert.match(safe,/\[敏感凭证\]/);
  assert.match(safe,/\[长号码\]/);
  assert.match(safe,/\[称呼已隐藏\]/);
  assert.match(safe,/^第一行\n/);
  assert.match(safe,/\r最后一行$/);
  assert.equal(safe.replace(/\s/g,''),redact(compact(raw)).replace(/\s/g,''));
  const dateAndList='截止日期 2026-01-02\n- 123456';
  assert.equal(redactOriginal(dateAndList),dateAndList);
  assert.match(source,/redacted_rows: rawRedactedRows/);
  assert.match(source,/canonical_redacted_rows: redactedRows/);
});

test('Only the original-text table cell preserves visible whitespace',()=>{
  const css=readFileSync('public/reports/qianwen-user-acquisition-dashboard/styles.css','utf8');
  assert.match(css,/\.question-table td:last-child\s*\{[^}]*white-space:\s*pre-wrap;[^}]*overflow-wrap:\s*anywhere;/);
});
