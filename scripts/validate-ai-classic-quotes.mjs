import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function canonicalSource(value) {
  const url = new URL(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) if (/^(utm_|trk$|linkId$|ncid$)/i.test(key)) url.searchParams.delete(key);
  return url.href;
}
export function validPartialDate(value) {
  if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return false;
  const [year,month='01',day='01']=value.split('-');
  const iso=`${year}-${month}-${day}`;
  const d=new Date(iso+'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===iso;
}
export function validateQuoteFeed(feed) {
  const text = v => typeof v === 'string' && v.trim().length > 0;
  assert.equal(feed.schema,'clair-ai-classic-quotes/v1');
  assert.ok(validPartialDate(feed.updatedAt));
  assert.ok(text(feed.editorialNote));
  assert.ok(Array.isArray(feed.quotes) && feed.quotes.length);
  const byId=new Map(), people=new Map(), budgets=new Map();
  const types=new Set(['similar','opposed','complement','tension']);
  for (const q of feed.quotes) {
    assert.ok(!byId.has(q.id),`Duplicate quote ${q.id}`); byId.set(q.id,q);
    for (const key of ['id','speakerId','personName','speaker','speakerRole','organizationId','organization','quoteEn','quoteZh','date','dateLabel','occasion','context','target','thesis','interpretation','caveat','verifiedAt']) assert.ok(text(q[key]),`${q.id}: missing ${key}`);
    assert.ok(validPartialDate(q.date),`${q.id}: invalid date`);
    assert.ok(validPartialDate(q.verifiedAt),`${q.id}: invalid verification date`);
    assert.ok(q.date.slice(0,10)<=q.verifiedAt,`${q.id}: future quote`);
    assert.ok(['en','zh'].includes(q.originalLanguage),`${q.id}: original language`);
    assert.ok(['classic','contemporary'].includes(q.era),`${q.id}: era`);
    assert.ok(Array.isArray(q.topics) && q.topics.length>0);
    for (const key of ['title','url','locator','type']) assert.ok(text(q.source?.[key]),`${q.id}: source.${key}`);
    const source = new URL(q.source.url);
    assert.equal(source.protocol,'https:'); assert.equal(source.username+source.password,'');
    assert.ok(!/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(source.hostname));
    assert.ok(!/(feishu\.cn|larksuite\.com|wecom\.qq\.com|yingmi\.cn|qieman\.com)$/.test(source.hostname));
    const key=canonicalSource(q.source.url), budget=budgets.get(key)||{en:0,zh:0};
    if(q.originalLanguage==='zh') budget.zh += [...q.quoteZh.replace(/[\s\p{P}\p{S}]/gu,'')].length;
    else budget.en += q.quoteEn.trim().split(/\s+/).length;
    budgets.set(key,budget);
    const owned=people.get(q.speakerId)||[]; owned.push(q); people.set(q.speakerId,owned);
    assert.doesNotMatch(JSON.stringify(q),/\/Users\/|file:\/\/|Bearer\s+[\w.-]{15,}|gh[pousr]_[A-Za-z0-9]{20,}/);
  }
  for (const [source,b] of budgets) { assert.ok(b.en<=25,`${source}: ${b.en} original English words`); assert.ok(b.zh<=50,`${source}: ${b.zh} original Chinese characters`); }
  for (const [id,qs] of people) assert.ok(qs.length>=2,`${id}: expected multiple viewpoints`);
  for (const q of feed.quotes) {
    assert.ok(Array.isArray(q.relations)); const seen=new Set();
    for (const rel of q.relations) {
      assert.ok(byId.has(rel.targetId)&&rel.targetId!==q.id,`${q.id}: dangling/self relation`);
      assert.ok(!seen.has(rel.targetId));seen.add(rel.targetId);
      assert.ok(types.has(rel.type));assert.ok(text(rel.reason)&&rel.reason.length>=12);
    }
  }
  assert.ok(Array.isArray(feed.comparisons)&&feed.comparisons.length>0);
  const comparisons=new Set();
  for (const c of feed.comparisons) {
    assert.ok(!comparisons.has(c.id));comparisons.add(c.id);
    for(const key of ['id','title','topic','leftId','rightId','commonGround','divide','readingGuide','caveat']) assert.ok(text(c[key]),`${c.id}: missing ${key}`);
    assert.ok(types.has(c.type));assert.ok(byId.has(c.leftId)&&byId.has(c.rightId)&&c.leftId!==c.rightId);
    if(c.type==='opposed') assert.ok(text(c.oppositionBasis)&&c.oppositionBasis.length>=25,`${c.id}: demonstrate actual opposition on same criterion`);
  }
  assert.ok(text(feed.coverage?.checkedAt));
  assert.ok(Array.isArray(feed.coverage?.organizations));
  for(const org of feed.coverage.organizations) {
    assert.ok(text(org.id)&&text(org.name)&&text(org.note));
    assert.ok(['covered','partial','gap'].includes(org.status));
    assert.ok(Array.isArray(org.representatives));
    for(const id of org.representatives) assert.ok(people.has(id),`${org.id}: unknown representative ${id}`);
    if(org.status==='covered') assert.ok(org.representatives.length>0);
  }
  assert.ok(text(feed.dailyUpdate?.scheduleLabel)&&text(feed.dailyUpdate?.note));
  return {quotes:byId.size,people:people.size,organizations:feed.coverage.organizations.filter(o=>o.representatives.length).length,comparisons:comparisons.size,sources:budgets.size};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const feed=JSON.parse(readFileSync(new URL('../public/reports/knowledge-report-hub/data/ai-classic-quotes.json',import.meta.url),'utf8'));
  console.log('AI 人物观点资料校验通过：'+JSON.stringify(validateQuoteFeed(feed)));
}
