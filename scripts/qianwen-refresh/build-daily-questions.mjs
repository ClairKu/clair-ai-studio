/** Build anonymized, independently counted, date-partitioned question ciphertext.
 * Raw source files and the random content key remain outside the public tree.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash,createHmac,randomBytes,webcrypto} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {redactQuestion} from '../qianwen-cases/build-question-top100.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stamp=s=>String(s).replace('T',' ').slice(0,19);
const nextDay=d=>new Date(Date.parse(d+'T00:00:00Z')+86400000).toISOString().slice(0,10);

export async function sealDailyContentKey(bytes,cutoff,password=process.env.REPORT_PASSWORD||'2026'){
 const salt=randomBytes(16),iv=randomBytes(12),material=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt']);
 const data=Buffer.from(await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('qianwen-daily-key-v1|'+cutoff)},key,bytes));
 return{schema_version:'qianwen-daily-key-envelope-v1',cutoff,iterations:250000,salt:salt.toString('base64'),iv:iv.toString('base64'),data:data.toString('base64')};
}

export async function buildDailyQuestions({root,inputDir,privateOut,cutoff,identityKeyPath}){
 if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cutoff))throw Error('Invalid fixed question cutoff');
 const audit=read(path.join(inputDir,'daily-complete-source-audit.json'));
 if(audit.status!=='pass'||audit.cutoff!==cutoff||!audit.new_source_not_requeried)throw Error('Complete daily source has not passed');
 for(const[f,h]of Object.entries(audit.source_sha256))if(sha(fs.readFileSync(f))!==h)throw Error('Frozen daily source drift');
 if(fs.existsSync(path.join(privateOut,'private-bundle.json')))throw Error('Do not regenerate a frozen daily key or ciphertext');
 const first=read(path.join(inputDir,'main-corpus-rows.json')),second=read(path.join(inputDir,'daily-nonnew-source.json')),all=[...first,...second],counts=read(path.join(inputDir,'daily-complete-counts.json'));
 const ids=new Set(),people=new Set(),aliasOwners=new Map(),dayRows=new Map(),fullKey=read(identityKeyPath).key;
 const alias=p=>{const u='用户 '+createHmac('sha256',fullKey).update('qianwen-daily-user-v1\0'+p).digest('hex').slice(0,10).toUpperCase();if(aliasOwners.has(u)&&aliasOwners.get(u)!==p)throw Error('Anonymous alias collision');aliasOwners.set(u,p);return u;};
 let redacted=0;const sensitive=/https?:\/\/\S+|www\.\S+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?<!\d)1[3-9]\d{9}(?!\d)|(?<!\d)\d{17}[0-9Xx](?!\d)|\bsk-[A-Za-z0-9_-]{16,}\b/i;
 for(const row of all){
  const id=String(row.message_key),person=String(row.person_key),t=stamp(row.local_time),raw=row.raw_question;
  if(!/^\d+$/.test(id)||ids.has(id)||!/^\d+$/.test(person)||typeof raw!=='string'||!raw.trim()||t<'2026-08-03 00:00:00'||t>=cutoff)throw Error('Invalid, duplicated or out-of-window daily source');
  ids.add(id);people.add(person);const q=redactQuestion(raw);if(sensitive.test(q))throw Error('Daily text still contains a sensitive pattern');redacted+=q!==raw?1:0;
  const d=t.slice(0,10);if(!dayRows.has(d))dayRows.set(d,[]);dayRows.get(d).push({id,t,u:alias(person),q});
 }
 if(all.length!==audit.total_questions||people.size!==audit.total_users)throw Error('Daily raw population mismatch');
 const independent=new Map(counts.map(x=>[x.day,x]));for(const[d,rows]of dayRows){const x=independent.get(d);if(!x||rows.length!==Number(x.questions)||new Set(rows.map(x=>x.u)).size!==Number(x.users))throw Error('Daily independent count mismatch '+d);}
 const bytes=randomBytes(32),key=await webcrypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt']),encoder=new TextEncoder(),paths=[],days=[],details=[];
 fs.mkdirSync(privateOut,{recursive:true,mode:0o700});
 const max=cutoff.slice(0,10),latest=[...dayRows.keys()].sort().at(-1);
 for(let d='2026-08-03';d<=max;d=nextDay(d)){
  const source=dayRows.get(d)||[],rows=source.sort((a,b)=>a.t.localeCompare(b.t)||(BigInt(a.id)<BigInt(b.id)?-1:BigInt(a.id)>BigInt(b.id)?1:0)).map(({t,u,q})=>({t,u,q}));
  const item={date:d,questions:rows.length,users:new Set(rows.map(x=>x.u)).size,file:null,sha256:null};
  if(rows.length){
   const plain=Buffer.from(JSON.stringify({schema_version:'qianwen-daily-questions-day-v1',cutoff,date:d,rows})),iv=randomBytes(12),aad=encoder.encode(cutoff+'|'+d),encrypted=Buffer.from(await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,gzipSync(plain,{level:9})));
   const back=gunzipSync(Buffer.from(await webcrypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad},key,encrypted)));if(!back.equals(plain))throw Error('Daily authenticated crypto roundtrip mismatch');
   const envelope={schema_version:'qianwen-daily-questions-envelope-v1',cutoff,date:d,compression:'gzip',iv:iv.toString('base64'),data:encrypted.toString('base64')},body=Buffer.from(JSON.stringify(envelope)+'\n'),name=d+'-'+sha(body).slice(0,12)+'.enc.json';
   item.file='./data/daily-questions/'+name;item.sha256=sha(body);
   for(const tree of['public','docs']){const rel=tree+'/reports/qianwen-user-acquisition-dashboard/data/daily-questions/'+name,target=path.join(root,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body);paths.push(rel);}
   details.push({date:d,plaintext_sha256:sha(plain),cipher_sha256:sha(body),questions:rows.length,users:item.users,bytes:body.length});
  }days.push(item);
 }
 const index={schema_version:'qianwen-daily-questions-index-v1',cutoff,timezone:'Asia/Shanghai',min_date:'2026-08-03',max_date:max,latest_date:latest,total_questions:all.length,total_users:people.size,days,sealed_content_key:await sealDailyContentKey(bytes,cutoff)};
 const indexBytes=Buffer.from(JSON.stringify(index)+'\n');for(const tree of['public','docs']){const rel=tree+'/reports/qianwen-user-acquisition-dashboard/data/daily-questions/index.json';fs.writeFileSync(path.join(root,rel),indexBytes);paths.push(rel);}
 const bundle={schema_version:'qianwen-daily-questions-private-bundle-v1',cutoff,key:bytes.toString('base64'),index,index_sha256:sha(indexBytes)};fs.writeFileSync(path.join(privateOut,'private-bundle.json'),JSON.stringify(bundle),{mode:0o600});
 const result={status:'pass',cutoff,questions:all.length,users:people.size,active_days:dayRows.size,calendar_days:days.length,redacted_questions:redacted,rows_have_only:['t','u','q'],source_audit_sha256:sha(fs.readFileSync(path.join(inputDir,'daily-complete-source-audit.json'))),private_bundle_path:path.join(privateOut,'private-bundle.json'),private_bundle_sha256:sha(fs.readFileSync(path.join(privateOut,'private-bundle.json'))),index_sha256:sha(indexBytes),plaintext_content_key_is_only_in_private_bundle:true,public_key_envelope_uses_existing_report_protection:true,normal_build_recovers_key_without_private_temporary_path:true,stable_alias_key_never_published:true,paths,details};
 fs.writeFileSync(path.join(privateOut,'manifest.json'),JSON.stringify(result,null,2),{mode:0o600});return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const[root,inputDir,privateOut,cutoff,identityKeyPath]=process.argv.slice(2);const r=await buildDailyQuestions({root,inputDir,privateOut,cutoff,identityKeyPath});console.log(JSON.stringify({status:r.status,questions:r.questions,users:r.users,active_days:r.active_days,calendar_days:r.calendar_days,paths:r.paths.length}));}
