import fs from 'node:fs';
import assert from 'node:assert/strict';
const slug='xiaogu-dialogue-four-dimensions-since-launch-2026-10-13';
const read=base=>{const html=fs.readFileSync(`${base}/reports/${slug}/index.html`,'utf8');return JSON.parse(html.match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);};
const D=read('public');assert.deepEqual(D,read('docs'));
const sum=(rows,k)=>rows.reduce((s,r)=>s+(r[k]??0),0),dates=rows=>new Set(rows.map(r=>r.day));
assert.equal(D.meta.launch,'2024-01-23');assert.equal(D.meta.cutoff,'2026-10-12');assert.equal(D.meta.historyCutoff,D.meta.cutoff);
assert.equal(D.history.length,994);assert.equal(dates(D.history).size,994);assert.equal(D.history[0].pv,null);assert.equal(D.history.at(-1).day,D.meta.cutoff);
for(const[k,v]of Object.entries({pv:16084644,input:645876,faq:18425,shortcut:163526,option:115346,questions:943173,confirmed:664301}))assert.equal(sum(D.history,k),v,k);
for(const h of D.history){if(h.pv!=null)assert(h.pv>=h.uv);if(h.input!=null){assert.equal(h.confirmed,h.input+h.faq);assert.equal(h.questions,h.input+h.faq+h.shortcut+h.option);assert(h.input>=h.input_uv);}}
assert.equal(D.historyMonthly.length,34);assert.equal(D.historyControls.find(r=>r.label==='全期').uv,D.uniqueControlsSource.all.visit_uv);
for(const m of D.historyMonthly){assert.equal(m.uv,D.uniqueControlsSource.monthly[m.day].visit_uv);assert.equal(m.input_uv,D.uniqueControlsSource.monthly[m.day].input_uv);}
for(const m of D.historyMonthly){let rs=D.history.filter(r=>r.day.startsWith(m.day));assert(m.uv>=Math.max(...rs.map(r=>r.uv??0)));assert(m.uv<=sum(rs,'uv'));assert.equal(m.pv,sum(rs,'pv'));if(m.input_uv!=null){assert(m.input_uv>=Math.max(...rs.map(r=>r.input_uv??0)));assert(m.input_uv<=sum(rs,'input_uv'));}}
const t=D.three.filter(r=>r.scope==='all'&&r.channel==='total'),a=D.three.filter(r=>r.scope==='active'&&r.channel==='total'),b=D.backendUnique.find(r=>r.grain==='all');
assert.equal(sum(D.legacy,'rounds'),2031824);assert.equal(sum(D.legacy,'human_rounds'),50514);assert.equal(sum(D.legacy,'self_input'),375379);assert.equal(sum(D.mia,'rounds'),706909);assert.equal(sum(t,'rounds'),205647);assert.equal(sum(t,'rounds')-sum(a,'rounds'),23566);assert.equal(sum(t,'tokens'),60792661554);
assert.equal(b.uv,219181);assert.equal(b.missing_id,0);assert.equal(b.rounds,2944380);assert.equal(b.rounds,sum(D.miaCombined,'rounds')+sum(t,'rounds'));assert.equal(b.active_rounds,sum(D.miaCombined,'rounds')+sum(a,'rounds'));
for(const r of D.backendUnique.filter(r=>r.grain==='daily')){const mia=D.miaCombined.find(x=>x.day===r.period);const three=t.find(x=>x.day===r.period);assert.equal(r.rounds,(mia?.rounds??0)+(three?.rounds??0));assert(r.uv<=(mia?.uv??0)+(three?.uv??0));assert(r.uv>=Math.max(mia?.uv??0,three?.uv??0));}
assert.equal(D.today.mia.rounds,689);assert.equal(D.today.frontend.input_cnt,797);assert.equal(D.today.frontend.pv,2607);assert(D.today.freshnessNote.includes('01:33:46'));assert(D.today.freshnessNote.includes('15:28:55'));
assert.equal(D.sources.some(r=>r.url.includes('k=')),false,'no artifact access tokens in public sources');
console.log('PASS full-history sources: 994 days, 34 months, frontend controls, legacy split, backend union, task scope, current-day freshness and public/docs parity');
