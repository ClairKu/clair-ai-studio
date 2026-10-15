import {createHash,randomBytes,webcrypto} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync,gunzipSync} from 'node:zlib';
import vm from 'node:vm';

const encoder=new TextEncoder();
const labels={holding_diagnosis:'持仓诊断',product_research:'基金与策略研究',stock_research:'个股研究',product_selection:'产品筛选',asset_allocation:'资金规划与配置',market_insight:'市场判断',transaction_execution:'投资操作',investment_learning:'投资知识',qieman_service:'且慢服务',task_status:'任务进度',personal_context:'个人情况补充',context_followup:'对话承接',non_investment:'非投资话题',other_investment:'其它投资问题',unclear_expression:'表达待辨'};
const normalized=value=>String(value??'').replace(/\s+/g,' ').trim();
const stamp=value=>String(value??'').replace('T',' ').slice(0,19);
const dayNumber=value=>Date.parse(stamp(value).slice(0,10)+'T00:00:00Z')/86400000;

export function redactQuestion(input){
  return String(input??'').replace(/\r\n/g,'\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'')
    .replace(/https?:\/\/[^\s<>]+|www\.[^\s<>]+/gi,'[链接已隐藏]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[邮箱已隐藏]')
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g,'[手机号已隐藏]')
    .replace(/(?<!\d)\d{17}[0-9Xx](?!\d)/g,'[证件号已隐藏]')
    .replace(/(?<!\d)(?:\d[ -]?){12,19}(?!\d)/g,'[长号码已隐藏]')
    .replace(/\bsk-[A-Za-z0-9_-]{16,}\b/g,'[密钥已隐藏]')
    .replace(/((?:api[_\s-]?key|access[_\s-]?token|authorization|password|密码|密钥)\s*[:=：]\s*)["']?[A-Za-z0-9_+./=-]{6,}["']?/gi,'$1[敏感凭证已隐藏]')
    .replace(/\b(?:wxid_|openid[:：]?)[A-Za-z0-9_-]{6,}\b/gi,'[外部标识已隐藏]')
    .replace(/((?:user_id|po_manager_id|pmid|session_id|account3_id)["']?\s*[:=：]\s*)["']?[A-Za-z0-9_-]+["']?/gi,'$1[内部标识已隐藏]');
}

export async function loadQuestionRules(root){
  // Reuse the maintained classification definitions, never its network-running top level.
  const source=await readFile(resolve(root,'scripts/qianwen-refresh/build-question-corpus.mjs'),'utf8');
  const definitions=source.slice(source.indexOf('const DIRECTION_IDS ='),source.indexOf('const sql ='));
  const functions=source.slice(source.indexOf('function redact(input)'),source.indexOf('let redactedRows ='));
  if(!definitions.startsWith('const DIRECTION_IDS')||!functions.startsWith('function redact')||/await executeSql|fetch\(/.test(definitions+functions))throw new Error('Question rule anchors changed; review before running');
  const context=vm.createContext({});
  new vm.Script(definitions+'\n'+functions+'\n globalThis.classifier=classify;').runInContext(context,{timeout:1000});
  return context.classifier;
}

async function keyFor(password,salt,iterations=310000){
  const material=await webcrypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
  return webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}

export async function encryptUserChunk(value,key,salt,anonKey){
  const plain=Buffer.from(JSON.stringify(value)),compressed=gzipSync(plain,{level:9}),iv=randomBytes(12);
  const encrypted=Buffer.from(await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(anonKey)},key,compressed));
  const back=gunzipSync(Buffer.from(await webcrypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode(anonKey)},key,encrypted)));
  if(!plain.equals(back))throw new Error('Encrypted question chunk failed round-trip validation');
  return {schema_version:'qianwen-question-user-v1',iterations:310000,compression:'gzip',salt:salt.toString('base64'),iv:iv.toString('base64'),data:encrypted.toString('base64')};
}

export async function buildTop100({root,inputDir,privateOut,fundedPath,password=process.env.REPORT_PASSWORD||'2026'}){
  const read=async name=>JSON.parse(await readFile(resolve(inputDir,name),'utf8'));
  const anonymous=await read('top-users-anonymous.json');
  const raw=await read('top-union-questions-enriched-private.json');
  const coverage=await read('coverage-summary.json');
  if(coverage.raw_count_check!=='pass'||coverage.raw_unique_messages!==raw.length||coverage.raw_union_questions!==raw.length)throw new Error('Raw question coverage audit is incomplete');
  const cutoff=stamp(anonymous.meta.data_cutoff),classify=await loadQuestionRules(root);
  let fundedUsers=new Map();
  if(fundedPath){
    const funded=JSON.parse(await readFile(fundedPath,'utf8'));
    if(stamp(funded.meta.cutoff)!==cutoff||!funded.meta.assets_audit_complete)throw new Error('Conversion snapshot cutoff or review does not match question rankings');
    fundedUsers=new Map(funded.users.map(user=>[String(user.pmid),user]));
  }
  const groups=new Map();
  const messageIds=new Set();
  for(const row of raw){
    const id=String(row.message_id),when=stamp(row.question_at),anonKey=String(row.anon_key||'');
    if(messageIds.has(id)||!normalized(row.question_text)||when>=cutoff||!/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(when)||!/^[A-Za-z0-9_-]{8,80}$/.test(anonKey))throw new Error('Invalid or duplicate question record');
    messageIds.add(id);
    if(!groups.has(anonKey))groups.set(anonKey,[]);
    groups.get(anonKey).push(row);
  }
  if(groups.size!==anonymous.meta.union_count)throw new Error('Ranked user universe does not reconcile');
  const users=[],chunkPaths={},manifest=[],salt=randomBytes(16),key=await keyFor(password,salt);
  const sortedUsers=anonymous.union.slice().sort((a,b)=>String(a.anon_key).localeCompare(String(b.anon_key)));
  let totalRedacted=0,totalQuestions=0;
  for(const [index,user] of sortedUsers.entries()){
    const anonKey=String(user.anon_key),source=groups.get(anonKey)||[];
    source.sort((a,b)=>stamp(a.question_at).localeCompare(stamp(b.question_at))||String(a.message_id).localeCompare(String(b.message_id),undefined,{numeric:true}));
    const observed=dayNumber(cutoff)-dayNumber(source[0]?.question_at)+1;
    const active=new Set(source.map(row=>stamp(row.question_at).slice(0,10))).size;
    if(source.length!==Number(user.questions)||observed!==Number(user.observed_calendar_days)||active!==Number(user.active_days))throw new Error('Per-user counts or daily denominator do not reconcile');
    const ratio=source.length/observed;
    if(Math.abs(ratio-Number(user.questions_per_calendar_day))>0.00001)throw new Error('Daily-average calculation does not reconcile');
    const sessions=new Map(),counts={preset_confirmed:0,preset_inferred:0,other_input:0},topicCounts=new Map(),unique=new Set();
    const questions=source.map((row,i)=>{
      const original=String(row.question_text),q=redactQuestion(original),classified=classify(original);
      if(q!==original)totalRedacted++;
      const preset=row.preset||classified.preset;
      const origin=preset?(preset.evidence==='exact_text_confirmed'||preset.version==='launch_v1'?'preset_confirmed':'preset_inferred'):'other_input';
      counts[origin]++;
      const topic=labels[classified.direction]||'表达待辨';
      if(origin==='other_input')topicCounts.set(topic,(topicCounts.get(topic)||0)+1);
      unique.add(normalized(original));
      const session=String(row.session_id);
      if(!sessions.has(session))sessions.set(session,sessions.size+1);
      return {i:i+1,t:stamp(row.question_at),q,source:origin,topic,session:'会话 '+sessions.get(session)};
    });
    if(sessions.size!==Number(user.sessions)||Object.values(counts).reduce((a,b)=>a+b,0)!==source.length)throw new Error('Source/session counts do not reconcile');
    const topics=[...topicCounts].map(([label,n])=>({label,n})).sort((a,b)=>b.n-a.n||a.label.localeCompare(b.label,'zh-CN'));
    const meaningful=topics.filter(t=>!['对话承接','任务进度','个人情况补充','表达待辨'].includes(t.label));
    const top=meaningful.slice(0,3).map(t=>t.label).join('、');
    const repeats=source.length-unique.size;
    let summary=`观察 ${observed} 个自然日，其中 ${active} 天有提问；其它输入 ${counts.other_input} 条`+(top?`，主要涉及${top}`:'')+'。';
    if(repeats)summary+=`重复问法 ${repeats} 条（保留在总量中，不据此判断为自动任务）。`;
    if((topicCounts.get('对话承接')||0)+(topicCounts.get('任务进度')||0)>source.length*.5)summary+='承接和进度追问较多，不能把每条输入都理解为独立投资需求。';
    const funded=fundedUsers.get(String(source[0].pmid));
    if(fundedPath)summary+=funded?'同一截止日前有绑定后入金记录；这不单独证明由千问促成。':'同一截止日前未发现绑定后入金记录，不代表没有历史投资或资产。';
    const value={key:anonKey,questions};
    const envelope=await encryptUserChunk(value,key,salt,anonKey),cipherText=JSON.stringify(envelope)+'\n';
    const hash=createHash('sha256').update(cipherText).digest('hex').slice(0,12);
    const relative=`question-users/${anonKey}-${hash}.enc.json`;
    for(const tree of ['public','docs']){
      const path=`${tree}/reports/qianwen-first-investor-cases-2026-09-17/${relative}`;
      await mkdir(dirname(resolve(root,path)),{recursive:true});await writeFile(resolve(root,path),cipherText);manifest.push(path);
    }
    chunkPaths[anonKey]=relative;totalQuestions+=questions.length;
    users.push({key:anonKey,label:'提问用户 Q'+String(index+1).padStart(3,'0'),total:source.length,daily_avg:ratio,observed_days:observed,active_days:active,
      sessions:sessions.size,...counts,topics,summary,new_or_existing:user.cohort_proxy==='new'?'新客':'老客',first_at:stamp(user.first_question_at),last_at:stamp(user.last_question_at),repeated_inputs:repeats,
      ...(fundedPath?{post_bind_inflow:Boolean(funded)}:{})});
  }
  const rankings={total:anonymous.total_top100.map(u=>String(u.anon_key)),daily:anonymous.daily_top100.map(u=>String(u.anon_key))};
  for(const keys of Object.values(rankings))if(keys.length!==100||new Set(keys).size!==100||keys.some(id=>!groups.has(id)))throw new Error('Each ranking must contain 100 distinct audited users');
  if(totalQuestions!==coverage.raw_union_questions)throw new Error('Question chunks do not cover the union');
  const byKey=new Map(users.map(user=>[user.key,user]));
  const rankingAnalysis=Object.fromEntries(Object.entries(rankings).map(([name,keys])=>{
    const group=keys.map(k=>byKey.get(k)),total=group.reduce((n,u)=>n+u.total,0),newCount=group.filter(u=>u.new_or_existing==='新客').length;
    const topics=new Map();for(const user of group)for(const topic of user.topics)topics.set(topic.label,(topics.get(topic.label)||0)+topic.n);
    const top=[...topics].filter(([label])=>!['对话承接','任务进度','个人情况补充','表达待辨'].includes(label)).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([label])=>label).join('、');
    const short=group.filter(u=>u.observed_days<=7).length;
    let summary=`这 100 人占全体提问用户的 ${(100/anonymous.meta.all_asking_users*100).toFixed(2)}%，贡献 ${(total/anonymous.meta.all_questions*100).toFixed(1)}% 的用户输入；新客 ${newCount} 人、老客 ${100-newCount} 人。`;
    if(top)summary+=`其它输入主要涉及${top}。`;
    if(fundedPath)summary+=`${group.filter(u=>u.post_bind_inflow).length} 人有绑定后入金记录。`;
    if(name==='daily'&&short)summary+=`${short} 人观察期不超过 7 天，日均不能直接代表长期稳定活跃。`;
    return [name,summary];
  }));
  const data={meta:{cutoff,user_population:anonymous.meta.all_asking_users,question_population:anonymous.meta.all_questions,union_users:users.length,overlap:anonymous.meta.intersection_count,ranking_analysis:rankingAnalysis,
    source_definition:'全部千问绑定用户的有效用户输入，包含已识别默认题；不含且慢其它会话、系统/助手消息。',
    daily_definition:'观察日均＝总提问量 ÷ 首次有效提问日至截止当天的自然日数（含首尾）；末日不足全天。',
    timezone:'Asia/Shanghai',classification_note:'主题为规则归类，原文保留，仅遮蔽敏感标识；新老客按注册与绑定时间近似识别。'},users,rankings};
  await mkdir(privateOut,{recursive:true});
  await writeFile(resolve(privateOut,'question-top100-data.json'),JSON.stringify(data));
  await writeFile(resolve(privateOut,'question-top100-chunks.json'),JSON.stringify(chunkPaths));
  await writeFile(resolve(privateOut,'question-top100-manifest.json'),JSON.stringify({paths:manifest,users:users.length,questions:totalQuestions,redacted_questions:totalRedacted,cutoff},null,2));
  const template=await readFile(resolve(root,'scripts/qianwen-cases/question-top100-panel.html'),'utf8');
  const loader=await readFile(resolve(root,'scripts/qianwen-cases/question-top100-loader.html'),'utf8');
  const safe=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const fragment=loader.replace('__QUESTION_TOP100_CHUNKS__',safe(chunkPaths))+'\n'+template.replace('__QUESTION_TOP100_DATA__',safe(data));
  await writeFile(resolve(privateOut,'question-top100-fragment.html'),fragment);
  console.log(JSON.stringify({users:users.length,questions:totalQuestions,redacted_questions:totalRedacted,encrypted_chunks:users.length,fragment_kb:Math.round(Buffer.byteLength(fragment)/1024)}));
  return {data,manifest,chunkPaths};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [root,inputDir,privateOut,fundedPath]=process.argv.slice(2);
  if(!root||!inputDir||!privateOut)throw new Error('Usage: build-question-top100.mjs <repo> <private-input> <private-output>');
  await buildTop100({root:resolve(root),inputDir:resolve(inputDir),privateOut:resolve(privateOut),fundedPath:fundedPath?resolve(fundedPath):undefined});
}
