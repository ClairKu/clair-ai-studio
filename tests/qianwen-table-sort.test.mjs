import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../scripts/qianwen-cases/table-sort.html',import.meta.url),'utf8');
const helpers=source.split('// BEGIN_TABLE_SORT_HELPERS')[1].split('// END_TABLE_SORT_HELPERS')[0];
const h=vm.runInNewContext(helpers+';({isTableSortMissing,parseTableSortValue,nextTableSort,sortTableEntries})');
const parsed=value=>h.parseTableSortValue(value,2026);

test('Generic table numbers preserve zero and normalize commas, amounts and percentages',()=>{
  for(const [raw,value] of [['0',0],['1,234.50',1234.5],['￥1，234 元',1234],['2.89 万',28900],['1.2亿元',120000000],['12.5%',.125],['-4,000.20 元',-4000.2],['24 人',24]]){
    assert.equal(parsed(raw).kind,'number',raw);assert.equal(parsed(raw).value,value,raw);
  }
  for(const raw of ['','—','待核验','未审查','未查到操作','无记录','暂无数据','N/A'])assert.equal(parsed(raw),null,raw);
  assert.equal(parsed('0 元').value,0);
});

test('Generic table dates and Chinese/compact durations sort by actual values',()=>{
  assert.equal(parsed('2026-10-15').value,Date.UTC(2026,9,15));
  assert.equal(parsed('10-15 09:58').value,Date.UTC(2026,9,15,9,58));
  assert.equal(parsed('2026-10-15T09:58:45+08:00').value,Date.UTC(2026,9,15,1,58,45));
  assert.equal(parsed('2026-02-30'),null,'invalid calendar dates are not normalized into another month');
  for(const [raw,value] of [['2 小时21分',8460],['4天0h',345600],['9分12秒',552],['1天2h03m',93780],['5 分 30 秒',330],['0 秒',0],['1.5 小时',5400]])assert.equal(parsed(raw).value,value,raw);
});

test('Generic table tri-state sorting is stable, non-mutating and keeps missing values last',()=>{
  const entries=Object.freeze([{id:'a',index:0,value:parsed('10')},{id:'b',index:1,value:parsed('0')},{id:'c',index:2,value:parsed('10')},{id:'d',index:3,value:null}]);
  const sorted=direction=>Array.from(h.sortTableEntries(entries,direction),row=>row.id);
  assert.deepEqual(sorted('asc'),['b','a','c','d']);assert.deepEqual(sorted('desc'),['a','c','b','d']);assert.deepEqual(sorted('none'),['a','b','c','d']);
  assert.deepEqual(entries.map(row=>row.id),['a','b','c','d']);
  const text=[{id:1,index:0,value:parsed('策略10')},{id:2,index:1,value:parsed('策略2')}];
  assert.deepEqual(Array.from(h.sortTableEntries(text,'asc'),row=>row.id),[2,1]);
  let current={column:null,direction:'none'};
  for(const direction of ['asc','desc','none']){current=h.nextTableSort(current,2);assert.equal(current.direction,direction);}
  assert.equal(h.nextTableSort({column:2,direction:'desc'},3).direction,'asc');
});

class Element{
  constructor(tag,text=''){this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;this.attrs={};this.events={};this._text=String(text);this.colSpan=1;this.rowSpan=1;this.className='';this.classList={contains:name=>this.className.split(/\s+/).includes(name)};}
  get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
  set textContent(value){this._text=String(value);this.children=[];}
  get childNodes(){if(this._text){const text=new Element('#text',this._text);this._text='';text.parentNode=this;this.children.unshift(text);}return this.children;}
  appendChild(child){if(child.parentNode){const old=child.parentNode.children.indexOf(child);if(old>=0)child.parentNode.children.splice(old,1);}child.parentNode=this;this.children.push(child);return child;}
  append(...children){children.forEach(child=>this.appendChild(child));}
  get cells(){return this.children.filter(child=>['TH','TD'].includes(child.tagName));}
  get rows(){return this.children.filter(child=>child.tagName==='TR');}
  get tBodies(){return this.children.filter(child=>child.tagName==='TBODY');}
  get tHead(){return this.children.find(child=>child.tagName==='THEAD')||null;}
  setAttribute(key,value){this.attrs[key]=String(value);}
  getAttribute(key){return Object.hasOwn(this.attrs,key)?this.attrs[key]:null;}
  hasAttribute(key){return Object.hasOwn(this.attrs,key);}
  addEventListener(key,handler){this.events[key]=handler;}
  closest(selector){let current=this;while(current){if(selector==='#question-top100'&&current.getAttribute('id')==='question-top100')return current;current=current.parentNode;}return null;}
  querySelector(selector){const tags=selector.split(',').map(tag=>tag.toUpperCase());const visit=element=>{for(const child of element.children){if(tags.includes(child.tagName))return child;const found=visit(child);if(found)return found;}return null;};return visit(this);}
}
const element=(tag,text)=>new Element(tag,text);
function tableFixture(values,{fixed=false,footer=false}={}){
  const table=element('table'),head=element('thead'),header=element('tr'),th=element('th','金额');th.setAttribute('title','原表头说明');header.append(th);head.append(header);table.append(head);
  const body=element('tbody');table.append(body);const rows=values.map((value,index)=>{const row=element('tr'),cell=element('td',value);row.append(cell);row.id=String(index);return row;});
  if(fixed){const total=element('tr'),cell=element('td','汇总');total.className='total';total.append(cell);rows.splice(1,0,total);}
  body.append(...rows);
  let foot=null;if(footer){foot=element('tfoot');const row=element('tr');row.append(element('td','脚注汇总'));foot.append(row);table.append(foot);}
  return {table,body,th,rows,foot};
}
function boot(tables){
  const body=element('body');body.setAttribute('data-report-year','2026');
  const script=source.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script,{document:{readyState:'complete',body,querySelectorAll:selector=>{assert.equal(selector,'table');return tables;},createElement:tag=>element(tag)}});
}

test('Generic table DOM sorting preserves original nodes/listeners, totals, footer and per-table state',()=>{
  const first=tableFixture(['10','0','10','—'],{fixed:true,footer:true}),second=tableFixture(['5','1']);
  const original=[...first.body.rows],footer=[...first.foot.rows],originalSecond=[...second.body.rows];let clicked=0;original[0].addEventListener('click',()=>clicked++);
  boot([first.table,second.table]);const button=first.th.querySelector('button');assert(button);assert.equal(first.th.getAttribute('title'),'原表头说明');
  button.events.click();assert.deepEqual(first.body.rows.map(row=>row.id),['1',undefined,'0','2','3']);assert.equal(first.th.getAttribute('aria-sort'),'ascending');
  assert.equal(first.body.rows[1],original[1]);assert.deepEqual(second.body.rows,originalSecond);assert.deepEqual(first.foot.rows,footer);
  button.events.click();assert.deepEqual(first.body.rows.map(row=>row.id),['0',undefined,'2','1','3']);assert.equal(first.th.getAttribute('aria-sort'),'descending');
  button.events.click();assert.deepEqual(first.body.rows,original);assert.equal(first.th.getAttribute('aria-sort'),'none');original[0].events.click();assert.equal(clicked,1);
  second.th.querySelector('button').events.click();assert.deepEqual(second.body.rows.map(row=>row.id),['1','0']);assert.deepEqual(first.body.rows,original);
});

test('Generic table DOM uses explicit raw values and missing markers, and leaves Top100 untouched',()=>{
  const raw=tableFixture(['待核','1','0']);raw.rows[0].cells[0].setAttribute('data-sort-value','2');raw.rows[1].cells[0].setAttribute('data-sort-missing','true');
  const skip=tableFixture(['3','1']),section=element('section');section.setAttribute('id','question-top100');section.append(skip.table);
  boot([raw.table,skip.table]);raw.th.querySelector('button').events.click();assert.deepEqual(raw.body.rows.map(row=>row.id),['2','0','1']);assert.equal(skip.th.querySelector('button'),null);assert.equal(skip.table.hasAttribute('data-table-sort'),false);
  assert.doesNotMatch(source,/innerHTML|console\.|\bfetch\s*\(|selectUser|loadQuestions|querySelectorAll\(['"](?:ol|ul|\.tl)/);
});

test('Changing columns starts ascending with original tie order, and separate tbody groups stay separate',()=>{
  const fixture=tableFixture(['2','1','3']);
  const secondHead=element('th','次数');fixture.table.tHead.rows[0].append(secondHead);
  ['10','10','1'].forEach((value,index)=>fixture.rows[index].append(element('td',value)));
  const secondBody=element('tbody');
  const extra=[['8','20'],['7','10']].map((values,index)=>{const row=element('tr');row.id='extra-'+index;values.forEach(value=>row.append(element('td',value)));return row;});
  secondBody.append(...extra);fixture.table.append(secondBody);
  boot([fixture.table]);
  const first=fixture.th.querySelector('button'),second=secondHead.querySelector('button');
  assert.equal(first.type,'button');assert.equal(second.type,'button');
  first.events.click();assert.deepEqual(fixture.body.rows.map(row=>row.id),['1','0','2']);
  second.events.click();assert.deepEqual(fixture.body.rows.map(row=>row.id),['2','0','1'],'ties follow original rows, not previous sort');
  assert.deepEqual(secondBody.rows.map(row=>row.id),['extra-1','extra-0']);
  assert.equal(fixture.th.getAttribute('aria-sort'),'none');assert.equal(secondHead.getAttribute('aria-sort'),'ascending');
  second.events.click();second.events.click();
  assert.deepEqual(fixture.body.rows,fixture.rows);assert.deepEqual(secondBody.rows,extra);
});
