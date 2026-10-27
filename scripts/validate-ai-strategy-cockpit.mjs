import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const slug='ai-strategy-cockpit-2026-10-27';
const entry=`reports/${slug}/`;
const check=(value,message)=>{if(!value)throw new Error(`AI cockpit access boundary: ${message}`)};
for(const scope of ['public','docs']){
 const folder=join(root,scope,'reports',slug);
 const html=readFileSync(join(folder,'index.html'),'utf8');
 check(html.includes('data-clair-encrypted-report="true"'),'shared encrypted-report branch is absent');
 check(html.includes('AES-GCM')&&html.includes('PBKDF2'),'content encryption is absent');
 check((html.match(/data-clair-access-gate/g)||[]).length===1,'the page must retain one shared access prompt');
 check(!/<input\b[^>]*type=["']password/.test(html),'a second password UI was introduced');
 const match=html.match(/const\s+payload\s*=\s*(\{[^;]+\});/s);
 check(match,'encrypted payload is absent');
 const payload=JSON.parse(match[1]);
 check(Buffer.from(payload.salt,'base64').length===16&&Buffer.from(payload.iv,'base64').length===12,'AES envelope metadata is invalid');
 check(payload.iterations>=250000&&payload.compression==='gzip','key derivation or payload compression drifted');
 check(!existsSync(join(folder,'assets/growth-data.js')),'restricted growth data was copied as a plain asset');
 const walk=path=>readdirSync(path,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(join(path,item.name)):[join(path,item.name)]);
 for(const path of walk(folder)){
  if(!/\.(?:js|html|json)$/.test(path))continue;
  const text=readFileSync(path,'utf8');
  check(!text.includes('window.COCKPIT_GROWTH_DATA')&&!text.includes('assets/growth-data.js'),'plaintext growth data or a loader reference escaped the encrypted body');
 }
 const policy=JSON.parse(readFileSync(join(root,scope,'report-access.json'),'utf8'));
 check(policy.immutableLockedEntries.includes(entry),'report was removed from the existing permanent encryption policy');
 const search=JSON.parse(readFileSync(join(root,scope,'search-index.json'),'utf8'));
 const indexed=search[slug]||'';
 check(!indexed.includes('COCKPIT_GROWTH_DATA')&&!indexed.includes('growth-data.js'),'restricted dataset escaped into the full-text index');
}
console.log('AI cockpit boundary verified: ciphertext in public/docs, one existing shared credential, no plaintext growth asset or search data.');
