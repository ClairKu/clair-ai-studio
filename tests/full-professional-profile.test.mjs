import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../public/reports/candidate-evaluator-2026-10-29/index.html',import.meta.url),'utf8');
const source=html.split('// BEGIN FULL PROFESSIONAL PROFILE')[1].split('// END FULL PROFESSIONAL PROFILE')[0];
class Element{
  constructor(tag,cls='',text){this.tag=tag;this.className=cls;this.textContent=text===undefined?'':String(text);this.children=[];this.attributes={};this.listeners={};this.open=false;}
  append(...items){this.children.push(...items);}
  setAttribute(key,value){this.attributes[key]=String(value);}
  addEventListener(type,listener){this.listeners[type]=listener;}
  toggle(value){this.open=value;this.listeners.toggle?.({target:this,isTrusted:true});}
}
const all=(element)=>[element,...element.children.flatMap(all)];
const text=(element)=>all(element).map(x=>x.textContent).join('\n');
function setup(){
  let requests=0,opens=0,views=0,created=0;
  const context=vm.createContext({URL,arr:value=>Array.isArray(value)?value:[],node:(...args)=>{created++;return new Element(...args);},
    fetch:()=>{requests++;throw Error('no external loading allowed');},window:{open:()=>{opens++;throw Error('no automatic opening allowed');}},
    markCandidateViewed:()=>{views++;throw Error('no synthetic view event allowed');},Date:class{constructor(){throw Error('date inference forbidden');}},
  });
  vm.runInContext(source,context);
  return {context,counts:()=>({requests,opens,views,created})};
}
function fixture(){
  const sha='a'.repeat(64),quote='原公司全称股份有限公司 2019.01–至今 原始职业引句（<script>不得执行</script>）';
  return {id:'synthetic-person',profile_facts:{
    age:47,birth_year:1979,current_location:'未核当前城市_不得输出',employment_status:'未核在职_不得输出',出生年月:'未核生年月_不得输出',
    work_history:[
      {company:'原公司全称股份有限公司',start:'2019.01',end:'至今',tenure_display:null,sha256:sha,document_id:'doc-one',locator:'第1页',quote,source_type:'document'},
      {company:'历任公司乙有限公司',start:'2013年09月',end:'2018年12月',tenure_display:'原记录5年3个月',sha256:'b'.repeat(64),locator:'第2页',quote:'历任公司乙有限公司 2013年09月—2018年12月',source_type:'document'},
    ],education:[
      {school:'某大学独立学院原名',degree:'学士',major:'原专业',mode:'非全日制',status:'在读',quote:'某大学独立学院原名 学士 非全日制 在读',sha256:sha,locator:'第3页',source_type:'document'},
      {school:'原校名海外学院',degree:'PgDip',major:null,mode:null,status:null,quote:'原校名海外学院 PgDip 短期课程',source_type:'document'},
    ],career_tags:['AI产品','47岁','名校高潜','在职'],source:'AI从原件提取',method:'原件事实整理',is_current_context:true,
    evidence:[{field:'age',quote:'人口年龄标记_不得输出'},{field:'current_location',quote:'城市证据标记_不得输出'},
      {field:'employment_status',quote:'在职证据标记_不得输出'},{field:'work_history[0].company',quote:'独立职业字段原文引句',sha256:sha,locator:'第1页'}],
  },works:[
    {title:'演示项目原记录',url:'https://example.invalid/demo?version=2',kind:'在线演示',ownership_verified:false,source:'履历作品线索',evidence:[{sha256:sha,locator:'第4页',quote:'演示项目原记录 链接文字'}]},
    {title:'未提供网址的作品',url:null,kind:'作品资料',ownership_verified:null,evidence:[]},
    {title:'危险协议仅保留文本',url:'javascript:alert(1)',ownership_verified:false},
    {title:'任职公司官网原记录',url:'https://company.invalid/',kind:'company_website',ownership_verified:false},
  ],profile_facts_history:[{age:38,birth_year:1988,current_location:'旧城市_不得输出',work_history:[{company:'旧版保存公司',start:null,end:null,tenure_display:null,quote:'旧版保存公司原句',source_type:'document'}],education:[],source:'AI推断',career_tags:['旧版职业标签']} ]};
}

test('the optional panel starts collapsed and constructs all detailed material only on open',()=>{
  const env=setup(),candidate=fixture(),before=JSON.stringify(candidate),panel=env.context.fullProfessionalProfilePanel(candidate);
  assert.equal(panel.tag,'details');assert.equal(panel.open,false);
  assert.equal(panel.children[0].textContent,'完整职业与教育资料');
  assert.equal(panel.children[1].children.length,0);
  assert.deepEqual(env.counts(),{requests:0,opens:0,views:0,created:3});
  panel.toggle(true);const firstCount=all(panel).length;
  panel.toggle(false);panel.toggle(true);
  assert.equal(all(panel).length,firstCount);assert.equal(JSON.stringify(candidate),before);
});

test('all company original names, raw dates, explicit duration and continuous references survive without tenure inference',()=>{
  const env=setup(),panel=env.context.fullProfessionalProfilePanel(fixture());panel.toggle(true);
  const value=text(panel);
  for(const expected of ['原公司全称股份有限公司','历任公司乙有限公司','2019.01','至今','2013年09月','2018年12月','原记录5年3个月','第1页','第2页','a'.repeat(64),'独立职业字段原文引句'])assert.ok(value.includes(expected),expected);
  assert.ok(value.includes('<script>不得执行</script>'));
  assert.equal(all(panel).filter(n=>n.tag==='script'||n.tag==='pre').length,0);
  assert.match(value,/未提供（未知）/);assert.doesNotMatch(value,/约\d+年/);
  assert.match(value,/旧版保存公司/);assert.match(value,/AI推断记录（不是原文事实）/);
});

test('all education names and original degree/mode/status stay intact without promotion or new school tiers',()=>{
  const env=setup(),panel=env.context.fullProfessionalProfilePanel(fixture());panel.toggle(true);
  const value=text(panel);
  for(const expected of ['某大学独立学院原名','原校名海外学院','学士','非全日制','在读','PgDip','短期课程'])assert.ok(value.includes(expected),expected);
  assert.doesNotMatch(value,/硕士|985|211|1档|一档|学校评级/);
  assert.match(value,/学习或在读形式（原记录）/);
});

test('unverified demographic/employment basics and their evidence are not dumped or inferred in the professional panel',()=>{
  const env=setup(),panel=env.context.fullProfessionalProfilePanel(fixture());panel.toggle(true);
  const value=text(panel);
  for(const excluded of ['未核当前城市_不得输出','未核在职_不得输出','未核生年月_不得输出','人口年龄标记_不得输出','城市证据标记_不得输出','在职证据标记_不得输出','旧城市_不得输出','47岁','名校高潜'])assert.ok(!value.includes(excluded),excluded);
  assert.ok(value.includes('AI产品'));assert.ok(value.includes('职业标签（整理记录，不作能力结论）'));
  assert.equal(env.counts().requests,0);assert.equal(env.counts().opens,0);assert.equal(env.counts().views,0);
});

test('every work item including a missing URL remains visible; links are safe, explicit and never fetched',()=>{
  const env=setup(),panel=env.context.fullProfessionalProfilePanel(fixture());panel.toggle(true);
  const value=text(panel),links=all(panel).filter(n=>n.tag==='a');
  for(const expected of ['演示项目原记录','未提供网址的作品','危险协议仅保留文本','任职公司官网原记录','本人归属未独立核验（原记录）','公司或报道链接原记录，不据此认定为本人作品。'])assert.ok(value.includes(expected),expected);
  assert.equal(links.length,2);
  for(const link of links){assert.match(link.href,/^https?:\/\//);assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');assert.equal(link.referrerPolicy,'no-referrer');}
  assert.equal(all(panel).filter(n=>n.tag==='img'||n.tag==='iframe').length,0);
  assert.ok(!links.some(link=>link.href.startsWith('javascript:')));assert.ok(value.includes('javascript:alert(1)'));
  assert.equal(env.counts().requests,0);assert.equal(env.counts().opens,0);assert.equal(env.counts().views,0);
});

test('alternative professional schemas receive Chinese labels while original unknown values and supplementary fields remain',()=>{
  const env=setup(),candidate={id:'alternate',profile_facts:{source:'用户修订',employment_history:[{employer:'公司原名丙',from:'原始起期文字',to:null,duration:'未明确',position:'原职位',职责补充:{交付物:'原始交付文字'}}],educations:[{institution:'海外学校完整原名',degree_type:'非学位课程',field_of_study:'原学科',study_mode:'业余',status:'结业'}],career_tags:[]},portfolio_links:[{name:'候选展示材料',link:'https://example.invalid/source',ownership_verified:false}]};
  const before=JSON.stringify(candidate),panel=env.context.fullProfessionalProfilePanel(candidate);panel.toggle(true);
  const value=text(panel);
  for(const expected of ['公司原名丙','原始起期文字','未明确','未提供（未知）','公司原名','起始日期（原记录）','职位（原记录）','海外学校完整原名','非学位课程','学习或在读形式（原记录）','原记录补充项（职责补充）','原始交付文字','人工记录（保留原来源）'])assert.ok(value.includes(expected),expected);
  assert.equal(JSON.stringify(candidate),before);assert.equal(all(panel).filter(n=>n.tag==='pre').length,0);
});

test('an already-recorded school reference can be shown without creating any tier or loading a reference site',()=>{
  const env=setup(),candidate={profile_facts:{work_history:[],education:[{school:'原校名',degree:'原学位',mode:null,school_tier:{level:3,label:'3档',basis:'既有参考记录',source_urls:['https://example.invalid/existing-reference'],reference_only_not_ability_score:true}}]}};
  const before=JSON.stringify(candidate),panel=env.context.fullProfessionalProfilePanel(candidate);panel.toggle(true);
  assert.match(text(panel),/已有学校参考记录（不参与岗位评分）/);assert.match(text(panel),/3档/);
  assert.equal(JSON.stringify(candidate),before);assert.equal(env.counts().requests,0);
});
