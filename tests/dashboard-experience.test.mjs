import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { runInNewContext } from 'node:vm';
import { validateAppUsage } from '../scripts/validate-app-usage.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const qianwen = JSON.parse(read('public/reports/qianwen-user-acquisition-dashboard/data/latest.json'));
const source = read('public/reports/qianwen-user-acquisition-dashboard/app.js');
const timeFunction = source.slice(source.indexOf('function questionTimeRows('), source.indexOf('\nfunction renderQuestionTime('));
const timeRows = new Function(`${timeFunction}; return questionTimeRows;`)();

test('browser-side validation accepts the published direct-access snapshot', () => {
  runInNewContext(source.replace(/\ninit\(\);\s*$/, '') + '\nvalidateData(snapshot);', { snapshot: qianwen, window: {}, document: {} });
});

test('launch-wide market timeline preserves missing question history and existing weekly counts', () => {
  const group = {
    daily: [{ start: '2026-09-01', end: '2026-09-01', questions: 12, users: 3, directions: [] }],
    weekly: [{ start: '2026-09-01', end: '2026-09-06', questions: 12, users: 3, directions: [] }],
  };
  const daily = timeRows(group, 'daily', '2026-08-10', '2026-09-01', '2026-09-01');
  assert.equal(daily.length, 23);
  assert.equal(daily[0].start, '2026-08-10');
  assert.equal(daily[21].questions, null, 'unobserved history must not be zero');
  assert.equal(daily[21].missing, true);
  assert.equal(daily[22].questions, 12);
  const weekly = timeRows(group, 'weekly', '2026-08-10', '2026-09-06', '2026-09-01');
  assert.equal(weekly.length, 4);
  assert.equal(weekly[3].start, '2026-08-31');
  assert.equal(weekly[3].questions, 12);
  assert.equal(weekly[3].users, 3, 'weekly people remain deduplicated, never summed from daily users');
  const market = qianwen.question_insights.research.market_context;
  assert.equal(market.daily[0].date, '2026-08-10');
  assert.ok(market.baseline.date < market.period_start);
  assert.ok(Math.abs(market.daily[0].close / market.baseline.close - 1 - market.daily[0].return_day) < 0.00001);
});

for (const platform of ['qianwen', 'doubao']) {
  test(`${platform}: App counts close across cohorts and evidence sources`, () => {
    const data = JSON.parse(read(`public/reports/${platform}-user-acquisition-dashboard/data/latest.json`));
    validateAppUsage(data);
    const duplicate = structuredClone(data);
    duplicate.app_usage.cohorts.all.users += 1;
    assert.throws(() => validateAppUsage(duplicate), /deduplicated/);
    const wrongCut = structuredClone(data);
    wrongCut.app_usage.as_of = '2020-01-01T00:00:00+08:00';
    assert.throws(() => validateAppUsage(wrongCut), /cutoff/);
    const wrongChannel = structuredClone(data);
    wrongChannel.app_usage.native_libs.push('MiniProgram');
    assert.throws(() => validateAppUsage(wrongChannel));
  });
}

test('question explorer opens directly and its readable corpus matches the current snapshot', () => {
  const html = read('public/reports/qianwen-user-acquisition-dashboard/index.html');
  assert.doesNotMatch(html, /question-password|question-unlock-form|查看数据边界与隐私说明/);
  assert.doesNotMatch(source, /decryptQuestionCorpus|cachedQuestionCredential/);
  const corpus = JSON.parse(gunzipSync(readFileSync(new URL('../docs/reports/qianwen-user-acquisition-dashboard/data/questions.json.gz', import.meta.url))));
  assert.equal(corpus.meta.identity_fields, 'none');
  assert.equal(corpus.meta.data_cutoff, qianwen.meta.data_cutoff);
  assert.equal(corpus.rows.length, qianwen.question_insights.summary.questions);
});

test('question download reports each received chunk so active slow transfers do not time out', async () => {
  const helper = source.slice(source.indexOf('async function readQuestionResponse('), source.indexOf('\nasync function loadQuestionCorpus('));
  const readResponse = new Function(`${helper}; return readQuestionResponse;`)();
  const progress = [];
  const response = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([31, 139]));
      controller.enqueue(new Uint8Array([8, 0, 0]));
      controller.close();
    },
  }));
  assert.deepEqual(Array.from(await readResponse(response, bytes => progress.push(bytes))), [31, 139, 8, 0, 0]);
  assert.deepEqual(progress, [2, 5]);
  assert.match(source, /received => \{\s*resetIdleTimeout\(\)/);
  assert.match(source, /clearTimeout\(idleTimeout\)/);
  assert.match(source, /clearTimeout\(totalTimeout\)/);
});
