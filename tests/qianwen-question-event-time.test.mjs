import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Qianwen question aggregates and encrypted corpus share actual USER business-event time and ownership', () => {
  for (const file of ['scripts/qianwen-refresh/question-insights.sql','scripts/qianwen-refresh/build-question-corpus.mjs']) {
    const source=readFileSync(file,'utf8');
    assert.match(source,/m\.role\s*=\s*'USER'/,file);
    assert.match(source,/m\.dj_gmt_create\s*>=\s*nu\.fb/,file);
    assert.match(source,/m\.dj_gmt_create\s*</,file);
    assert.match(source,/owner_session\.qmuser_user_id\s*=\s*nu\.pmid/,file);
    assert.match(source,/owner_session\.is_deleted\s*=\s*0/,file);
    assert.doesNotMatch(source,/m\.created_at|DATE_ADD\(created_at\s*,\s*INTERVAL\s+8\s+HOUR\)/i,file);
    assert.doesNotMatch(source,/s\.created_at\s*>=\s*nu\.fb/,file);
  }
});
