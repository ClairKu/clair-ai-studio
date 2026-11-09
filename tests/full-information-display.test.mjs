import {readFileSync} from 'node:fs';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {runInNewContext,Script} from 'node:vm';
import assert from 'node:assert/strict';

test('complete dossiers preserve all evidence, versions and human decisions without fetching originals',()=>{
const html=readFileSync(new URL('../public/reports/candidate-evaluator-2026-10-29/index.html',import.meta.url),'utf8');
const fixture=JSON.parse(readFileSync(new URL('./fixtures/clair-select-full-information.synthetic.json',import.meta.url),'utf8'));
const before=JSON.stringify(fixture);
class N{
  constructor(tag='div',cls='',text=''){this.tagName=tag.toUpperCase();this.className=cls;this._text=String(text??'');this.children=[];this.attrs={};this.listeners={};this.open=false;this.classList={add:(...v)=>{this.className+=' '+v.join(' ');},toggle:()=>{},contains:v=>this.className.split(/\s+/).includes(v)};}
  append(...items){for(const item of items){if(item===null||item===undefined)continue;const child=typeof item==='string'?new N('#text','',item):item;child.parentNode=this;this.children.push(child);}}
  replaceChildren(...items){this.children=[];this._text='';this.append(...items);}
  setAttribute(k,v){this.attrs[k]=String(v);} getAttribute(k){return this.attrs[k];}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);} dispatchEvent(e){for(const fn of this.listeners[e.type]||[])fn.call(this,e);}
  get textContent(){return this._text+this.children.map(x=>x.textContent).join('');} set textContent(v){this._text=String(v);this.children=[];}
  showModal(){this.open=true;} close(){this.open=false;} remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);}
  after(item){if(this.parentNode){const a=this.parentNode.children;a.splice(a.indexOf(this)+1,0,item);item.parentNode=this.parentNode;}}
}
function nodes(root,predicate){return [root,...root.children.flatMap(child=>nodes(child,predicate))].filter(predicate);}
function expand(root){let changed=true;while(changed){changed=false;for(const d of nodes(root,n=>n.tagName==='DETAILS'))if(!d._expanded){d._expanded=true;d.open=true;d.dispatchEvent({type:'toggle'});changed=true;}}}
function fn(src,name){const all=[...src.matchAll(new RegExp('(?:async )?function '+name+'\\(','g'))];assert(all.length,'Missing function '+name);const start=all.at(-1).index,lineEnd=src.indexOf('\n',start);if(src.slice(start,lineEnd).trimEnd().endsWith('}'))return src.slice(start,lineEnd);const rest=src.slice(lineEnd),close=rest.match(/^\}/m);assert(close,'Missing close '+name);return src.slice(start,lineEnd+close.index+1);}
const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,new N());return elements.get(id);};
let networkCalls=0;
const context={console,Map,Set,Object,Array,Number,String,JSON,Math,Date,
  data:fixture,engineConnected:false,isLoopback:false,sessionLocked:false,sessionEpoch:0,
  materialsCandidateId:fixture.candidates[0].id,materialsTab:'history',selected:fixture.candidates[0].id,
  $:get,node:(tag,cls='',text='')=>new N(tag,cls,text),arr:v=>Array.isArray(v)?v:[],
  button:(text,click,cls='')=>{const n=new N('button',cls,text);n.addEventListener('click',click);return n;},
  append:(host,...items)=>host.append(...items),plainCopy:v=>String(v??''),fmt:v=>String(v||''),
  scoreMechanism:role=>fixture.resume_score_mechanisms[role],assignedRole:c=>c.role_assignment?.role||c.role,
  reviewIsStale:c=>!!(c.review_feedback_stale||c.ai_review_standard_stale||c.review_role_stale),
  feedbackRecordActor:r=>r.sender_identity==='owner'?'owner':r.sender_identity==='hr'?'hr':'peer',
  evidenceSource:event=>'synthetic source '+(event.source_id||''),candidateName:c=>c.name,
  clearResumeFrames:()=>{},localOriginalVersions:()=>new N('section','','SYNTHETIC_LOCAL_LINKS_NOT_CLICKED'),
  documentUrl:()=>{networkCalls++;throw Error('Document URL should not be requested in archive mode');},
  fetch:()=>{networkCalls++;throw Error('Read-only renderer attempted network');},
  document:{querySelectorAll:()=>[],getElementById:()=>null},changeCandidateRole:()=>{},changeMetadata:()=>{},firstReceivedMonth:c=>c.first_received_month,
  applicationRole:c=>c.application?.role,applicationName:()=> 'synthetic application',candidateFiles:c=>c.documents.map(d=>d.filename),
  FEEDBACK_CATEGORIES:{resume:'履历评价',interview:'面试评价',hr:'人力评价',other:'其他补充'},
  feedbackNoteProjection:(c,category)=>category==='resume'?{text:'synthetic visible feedback',manual:false,entries:[{text:'AI_SYNTHETIC_FEEDBACK',source_label:'AI履历分析',source_reference:{kind:'ai_review'},recorded_at:'2026-01-21T10:20:30+08:00'}]}:{text:'',entries:[],manual:false},
  openFeedbackNotes:()=>{},
};
for(const name of ['scoreForDisplay','latestScore','latestAIRecord'])runInNewContext(fn(html,name),context);
const helper=html.split('// BEGIN COMPLETE READ-ONLY CANDIDATE INFORMATION')[1].split('// END COMPLETE READ-ONLY CANDIDATE INFORMATION')[0];
runInNewContext(helper,context);
for(const name of ['renderScoreHistory','renderResumePanel','renderMaterials','feedbackNotesPanel'])runInNewContext(fn(html,name),context);

const candidate=fixture.candidates[0],archive=new N();context.renderFullAssessmentArchive(candidate,archive);
assert(!archive.textContent.includes('FULL_CURRENT_AI_SUMMARY'),'AI versions should be lazy before disclosure');
expand(archive);const text=archive.textContent;
for(const marker of ['SYNTHETIC_OTHER_SAVED_FIT_VERDICT','SYNTHETIC_SECOND_DIMENSION_OBSERVATION','FULL_CURRENT_AI_SUMMARY','FULL_OLD_AI_SUMMARY','FULL_AI_CLAIM','OLD_AI_CLAIM','FULL_AI_LIMITATION','OLD_AI_LIMITATION','NESTED_MATERIAL_LIMITATION','OLD_DIMENSION_VIEW','BASIS_END','CONTINUOUS_QUOTE_END','SYNTHETIC_LEGACY_REVIEW_LOCATOR','2026-01-21T10:20:30+08:00','2026-01-11T02:03:04+08:00'])assert(text.includes(marker),'Missing full AI content: '+marker);
assert(text.includes(candidate.ai_reviews[1].review.claims[0].evidence[0].quote),'Continuous quote was truncated');
assert(text.includes(candidate.resume_score_ai.dimensions[0].basis),'Dimension basis was truncated');
assert(!text.includes('AI_QUESTION_MUST_NOT_SHOW'),'An AI question list was rendered');
assert(text.includes('未知（未评，不记0）')&&!/(?:^|[^\d])0 \/ 25/.test(text),'Unknown dimensions were coerced to zero');
assert.equal(nodes(archive,n=>n.className==='full-info-version').length,2);
assert.equal(nodes(archive,n=>n.className==='full-info-score-history').length,2);
assert(text.includes('合成用户修订')&&text.includes('2026-01-21T11:11:11+08:00'),'Nested score_history wrapper metadata was lost');
assert.equal(context.latestScore(candidate).score,66,'Primary post-interview/manual priority changed');

const oldCandidate=structuredClone(candidate);oldCandidate.resume_score_ai.mechanism_version='synthetic-old-v0';oldCandidate.ai_review_standard_stale=true;
const oldPanel=context.fullInfoCurrentAssessment(oldCandidate);expand(oldPanel);assert(oldPanel.textContent.includes('保存的AI履历分（旧岗位／旧标准）'));
assert(oldPanel.textContent.includes('不把它当作当前岗位有效主分'));

const sources=new N();context.renderFullOriginalSources(candidate,sources,'doc-synthetic-B');
assert(sources.textContent.includes('DOC_B_PAGE2_ONLY')&&!sources.textContent.includes('DOC_A_PAGE2_ONLY'),'Source versions were mixed');
assert(sources.textContent.includes('合成B 第2页第3段')&&sources.textContent.includes('b'.repeat(64)),'Page or full SHA missing');
assert(sources.textContent.includes('seed_summary_only')&&sources.textContent.includes('SYNTHETIC_EXTRACTION_WARNING'),'Incomplete extraction warning lost');
const mainResume=new N();context.renderResumePanel(candidate,mainResume,'doc-synthetic-B');
assert(mainResume.textContent.includes('DOC_B_PAGE2_ONLY')&&!mainResume.textContent.includes('DOC_A_PAGE2_ONLY'));
assert(!nodes(mainResume,n=>n.tagName==='IMG'||n.tagName==='IFRAME').length,'Original or external content was auto-loaded');

const records=new N();context.renderFullFeedbackRecords(candidate,records);expand(records);
for(const marker of ['OWNER_BEFORE_ORIGINAL','OWNER_AFTER_ORIGINAL','PEER_PLATFORM_ORIGINAL','HR_ORIGINAL','UNKNOWN_STAGE_ORIGINAL','PARTIAL_HUMAN_FRAGMENT','SCHEDULED_NOT_COMPLETED','APPROVED_DATE_UNKNOWN','TIME_CLAIM_ORIGINAL','OWNER_BEFORE_FULL_TEXT_DISTINCT_FROM_QUOTE','OWNER_BEFORE_EXTRA_CONTINUOUS_QUOTE','synthetic-human-source-A','synthetic-human-source-B','SYNTHETIC_PROGRESS_HISTORY_REASON','SYNTHETIC_DECISION_HISTORY_ORIGINAL'])assert(records.textContent.includes(marker),'Missing original human or time record: '+marker);
assert(records.textContent.includes('阶段待核')&&records.textContent.includes('内容完整性：完整来源'));
assert(records.textContent.includes('安排不等于已完成')&&records.textContent.includes('绝对日期未知'));
assert.equal(candidate.recruitment_status.value,'not_proceeding','Human decision was changed');
assert.equal(nodes(records,n=>n.className==='full-info-human').length,8,'Human records were duplicated or lost');
const staleCandidate=structuredClone(candidate);staleCandidate.review_feedback_stale=true;const staleArchive=new N();context.renderFullAiVersions(staleCandidate,staleArchive);assert(!staleArchive.textContent.includes('当前有效记录'),'Stale AI entry was labelled current');
assert.equal(nodes(records,n=>n.className==='full-info-decision-history').length,2,'Stored progress or decisions omitted');
assert.equal(networkCalls,0);
assert.equal(JSON.stringify(fixture),before,'Read-only renderers mutated stored candidate data');

const protectedPolicies={"scoreForDisplay": "e1e587a41c211e7e20ffb65392721052190664bd24b523b58f475cb0e1c8c3b5", "latestScore": "838fc79d658fbf0c86eef9100e957feb687be0e43bd7bf0b3a875ebbc9c1ef63", "scoreOrigin": "eeea6f7dcfbc2f664a147961b50a1d47f6873c8cd0785a5daf9015bb590d60f1", "radarModel": "5f8375b94ca46c563111e6f670a02f1a48335b8bfbd453279e54b849efe56fe4", "status": "44ecfd6cd77b6f0b59f33422e8c2920401f99c30050d9354bc9c82f6338451b4", "manualProgressState": "d486362c199ecfbed95b6d6e2f46f798f94430cf76cecc292b1a680404fd6a9d", "candidateActualState": "712e3540544d3845c75441829129f5aad123d3cad234a68396fc9fbe8bf23e30", "feedbackNoteProjection": "ab93161cc6c94195103ae5a517b8d28b471bb2eff605a44c5a0c9fd14cbc20d2"};
for(const [name,expected]of Object.entries(protectedPolicies))assert.equal(createHash('sha256').update(fn(html,name)).digest('hex'),expected,'Protected current score/human policy changed: '+name);
const coverageBody=new N('body');
context.document.body=coverageBody;context.document.getElementById=id=>nodes(coverageBody,n=>n.id===id)[0]||null;
context.archiveSnapshotLabel=()=> '合成快照 · 本机待同步 · 北森记录待核验';
context.data={...fixture,pending_communication_records:[{text:'SYNTHETIC_GLOBAL_PENDING',status:'pending'}],beisen_observations:{status:'pending',records:[{text:'SYNTHETIC_BEISEN_PENDING',year:null}]}};
const archiveBefore=JSON.stringify(context.data);context.openFullArchiveCoverage();const dialog=context.document.getElementById('full-archive-coverage-dialog');
assert(dialog?.open,'Unlocked read-only archive source entry must open');expand(dialog);
for(const marker of ['SYNTHETIC_GLOBAL_PENDING','SYNTHETIC_BEISEN_PENDING','历史观察不代表平台实时状态','北森已取得材料（待最终核对）'])assert(dialog.textContent.includes(marker),marker);
assert.equal(JSON.stringify(context.data),archiveBefore);assert.equal(networkCalls,0);dialog.close();
context.sessionLocked=true;context.openFullArchiveCoverage();assert.equal(dialog.open,false,'Locked archive must not reopen');
context.resetProgressEditor=()=>{};context.resetComposer=()=>{};context.resetScreening=()=>{};context.clearTimeout=()=>{};context.candidateSearchTimer=0;context.requirementsRequest=0;context.window={PRIVATE_BOOTSTRAP:{synthetic:true}};
get('score-form').reset=()=>{};get('feedback-form').reset=()=>{};
runInNewContext(fn(html,'clearSensitiveUi'),context);context.clearSensitiveUi();
assert.equal(context.document.getElementById('full-archive-coverage-dialog'),null,'Lock must remove full source text from DOM');
assert.equal(context.window.PRIVATE_BOOTSTRAP,undefined);assert.equal(networkCalls,0);

const runtime=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).join('\n');
new Script(runtime);
});
