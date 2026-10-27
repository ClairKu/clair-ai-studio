// Encrypt a fully self-contained authoring file outside this public repository.
// Uses the existing shared report credential supplied in REPORT_PASSWORD.
import {createHash, randomBytes, webcrypto} from 'node:crypto';
import {readFile,writeFile,mkdir,mkdtemp,copyFile,rm} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {gzipSync,gunzipSync} from 'node:zlib';

const args=Object.fromEntries(process.argv.slice(2).reduce((a,v,i,all)=>v.startsWith('--')?[...a,[v.slice(2),all[i+1]]]:a,[]));
if(!args.input || !args.scratch)throw new Error('Usage: --input <private single HTML> --scratch <outside-repo work directory> [--expected-sha256 <hash>]');
if(!process.env.REPORT_PASSWORD)throw new Error('Supply the existing shared report credential through REPORT_PASSWORD.');
const root=fileURLToPath(new URL('../',import.meta.url));
const input=resolve(args.input);
if(input.startsWith(resolve(root)+'/'))throw new Error('The authoring plaintext must remain outside the public repository.');
const plain=await readFile(input);
const sourceSha=createHash('sha256').update(plain).digest('hex');
if(args['expected-sha256'] && sourceSha!==args['expected-sha256'])throw new Error('Authoring file hash differs from the reviewed final file.');
const text=plain.toString('utf8');
if(/<(?:script|link)\b[^>]*(?:src|href)\s*=\s*["'][^"']+["']/i.test(text))throw new Error('The encrypted authoring page must have all scripts and styles inlined.');
const salt=randomBytes(16),iv=randomBytes(12),iterations=250000;
const material=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(process.env.REPORT_PASSWORD),'PBKDF2',false,['deriveKey']);
const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
const compressed=gzipSync(plain,{level:9});
const encrypted=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,compressed);
const payload={salt:salt.toString('base64'),iv:iv.toString('base64'),data:Buffer.from(encrypted).toString('base64'),iterations,compression:'gzip'};
const roundTrip=gunzipSync(Buffer.from(await webcrypto.subtle.decrypt({name:'AES-GCM',iv},key,encrypted)));
if(!roundTrip.equals(plain))throw new Error('Encrypted payload round-trip mismatch.');
await mkdir(resolve(args.scratch),{recursive:true});
const stage=await mkdtemp(join(resolve(args.scratch),'cockpit-cipher-stage-'));
const slug='ai-strategy-cockpit-2026-10-27';
try{
 await mkdir(join(stage,'reports',slug),{recursive:true});
 await copyFile(join(root,'public/access-gate.js'),join(stage,'access-gate.js'));
 await copyFile(join(root,'public/report-access.json'),join(stage,'report-access.json'));
 const stub='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>AI 业务增长驾驶舱</title></head><body><script>/* AES-GCM PBKDF2 */const payload='+JSON.stringify(payload)+';</script></body></html>';
 await writeFile(join(stage,'reports',slug,'index.html'),stub);
 const result=spawnSync(process.execPath,[join(root,'scripts/inject-site-access-gate.mjs'),stage],{encoding:'utf8'});
 if(result.status!==0)throw new Error(result.stderr||'Existing shared access shell generation failed.');
 const shell=await readFile(join(stage,'reports',slug,'index.html'));
 if(!shell.toString().includes('data-clair-encrypted-report="true"'))throw new Error('The report ID is absent from the immutable shared encryption policy.');
 for(const scope of ['public','docs']){
  const folder=join(root,scope,'reports',slug);await mkdir(folder,{recursive:true});
  await writeFile(join(folder,'index.html'),shell);
  await rm(join(folder,'assets/growth-data.js'),{force:true});
 }
 console.log(JSON.stringify({source_sha256:sourceSha,round_trip_sha256:createHash('sha256').update(roundTrip).digest('hex'),cipher_sha256:createHash('sha256').update(shell).digest('hex'),source_bytes:plain.length,cipher_bytes:shell.length,encrypted:true}));
}finally{await rm(stage,{recursive:true,force:true});}
