import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const html=readFileSync(root+'public/reports/xiaogu-usage-trends-2024/index.html','utf8');
const match=html.match(/<script id="dashboard-data" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(match,'Embedded data missing');
const d=JSON.parse(match[1]);
const fields=['uv','pv','questions','cumulative_users','cumulative_questions','new_tasks','cumulative_tasks'];
const dayMs=86400000;
const first=Date.parse('2024-01-01T00:00:00Z'),last=Date.parse(d.cutoff+'T00:00:00Z');
assert.equal(d.daily.length,Math.round((last-first)/dayMs)+1,'Calendar must be complete');
assert.equal(d.monthly.length,34,'Jan 2024 through Oct 2026');
let taskCount=0,questions=0,newUsers=0;
for(let i=0;i<d.daily.length;i++){
 const r=d.daily[i];
 assert.equal(r.date,new Date(first+i*dayMs).toISOString().slice(0,10));
 for(const k of fields)assert.ok(r[k]===null||(Number.isSafeInteger(r[k])&&r[k]>=0),r.date+' '+k);
 assert.ok(r.new_users===null||(Number.isSafeInteger(r.new_users)&&r.new_users>=0));
 if(r.uv!==null&&r.pv!==null)assert.ok(r.uv<=r.pv,r.date+' UV cannot exceed PV');
 if(r.cumulative_users!==null){newUsers+=r.new_users;assert.equal(r.cumulative_users,newUsers,r.date+' cumulative dedup first visits');assert.ok(r.uv<=r.cumulative_users);}
 if(r.questions!==null)questions+=r.questions;
 if(r.cumulative_questions!==null)assert.equal(r.cumulative_questions,questions,r.date+' cumulative questions');
 if(r.new_tasks!==null)taskCount+=r.new_tasks;
 if(r.cumulative_tasks!==null)assert.equal(r.cumulative_tasks,taskCount,r.date+' cumulative tasks');
 if(r.date<'2024-02-04')assert.equal(r.questions,null,'Input unavailable before tracking start');
 if(r.date<'2026-05-19')assert.equal(r.new_tasks,null,'Task coverage starts May 19');
}
for(const m of d.monthly){
 const days=d.daily.filter(r=>r.date.startsWith(m.date));assert.ok(days.length);
 for(const k of ['pv','questions','new_tasks']){
  const usable=days.filter(r=>r[k]!==null);
  assert.equal(m[k],usable.length?usable.reduce((s,r)=>s+r[k],0):null,m.date+' '+k+' sum');
 }
 const uvs=days.map(r=>r.uv).filter(v=>v!==null);
 assert.ok(m.uv>=Math.max(...uvs)&&m.uv<=uvs.reduce((s,v)=>s+v,0),'Independent monthly UV bounds '+m.date);
 for(const k of ['cumulative_users','cumulative_questions','cumulative_tasks'])assert.equal(m[k],days.at(-1)[k],m.date+' '+k+' end of month');
}
assert.equal(taskCount,1432,'Independent task union: 1420 + 255 - 243');
assert.equal(d.daily.at(-1).cumulative_users,d.audit.window_uv,'Independent full-window user dedup');
assert.equal(questions,d.audit.window_questions,'Independent full-window question count');
assert.equal(d.daily.reduce((s,r)=>s+(r.pv||0),0),d.audit.window_pv,'Independent full-window visit count');
assert.equal(d.versions.length,3);
for(const marker of ['id="daily"','id="monthly"','id="actual"','id="indexed"','id="export-csv"','id="export-image"','data-preset="all"','data-preset="none"','connectNulls:false'])assert.ok(html.includes(marker),marker);
assert.ok(!/(api[_-]?key\s*[=:]|Bearer [A-Za-z0-9]|ying99_|qmuser_user_id|agent_token)/.test(html),'Private source identifiers or secrets must not be embedded');
const result={daily:d.daily.length,monthly:d.monthly.length,cutoff:d.cutoff,users:newUsers,questions,tasks:taskCount,sha256:createHash('sha256').update(match[1]).digest('hex')};
console.log('AI 小顾趋势数据核验通过：'+JSON.stringify(result));
