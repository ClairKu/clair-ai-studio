import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterQuotes, filterComparisons, safeSourceUrl } from "../public/reports/knowledge-report-hub/quotes/app.js";
import { validateQuoteFeed, validPartialDate, canonicalSource } from "../scripts/validate-ai-classic-quotes.mjs";

const hub = "reports/knowledge-report-hub/";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const loadFeed = () => JSON.parse(read(`public/${hub}data/ai-classic-quotes.json`));
const hasText = (value) => typeof value === "string" && value.trim().length > 0;

function quote(id, person, date, overrides = {}) {
  return {
    id, speakerId:person, personName:person === "person-a" ? "Person A" : "Person B",
    speaker:person === "person-a" ? "Person A" : "Person B", speakerRole:"发言时研究机构负责人",
    organizationId:person === "person-a" ? "lab-a" : "lab-b", organization:person === "person-a" ? "Lab A" : "Lab B",
    quoteEn:"A short verifiable statement.", quoteZh:"一条可核验的简短观点。", originalLanguage:"en",
    date, dateLabel:`${date} · 原始发表日期`, era:date < "2020" ? "classic" : "contemporary", verifiedAt:"2026-11-19",
    occasion:"官方公开演讲", context:"讨论研究目标与技术实现的公开活动。", target:"系统能力与责任",
    thesis:"提炼具体论点，同时说明判断的适用边界。", interpretation:"编辑分析不能替代原作者陈述的语境。",
    caveat:"此处是简短原文节选，不将其推演为普遍成立的结论。", topics:["能力","治理"],
    source:{title:`Original source ${id}`,url:`https://example.org/${id}`,locator:"正文第二段",type:"官方一手全文"},
    relations:[], ...overrides,
  };
}
function validFixture() {
  return {
    schema:"clair-ai-classic-quotes/v1", updatedAt:"2026-11-19", editorialNote:"原话、本站译文和编辑解读分别标注。",
    quotes:[
      quote("quote-a1","person-a","2019-03",{relations:[{targetId:"quote-b1",type:"tension",reason:"两者针对相同研究议题，但对风险边界的关注点不同。"}]}),
      quote("quote-a2","person-a","2025-05-12",{speaker:"Person A、Researcher C（合著）",authorIds:["person-a","person-c"]}),
      quote("quote-b1","person-b","2024",{quoteZh:"人的监督很重要。",quoteEn:"Human oversight matters.",source:{title:"Official transcript",url:"https://example.org/quote-b1",locator:"Section 3",type:"官方演讲文字稿"}}),
      quote("quote-b2","person-b","2026-01-01",{originalLanguage:"zh",quoteZh:"智能需要扎根现实。",quoteEn:"Intelligence needs grounding in reality.",topics:["现实世界"]}),
    ],
    comparisons:[{id:"comparison-ab",type:"tension",title:"同一议题，不同的关注重点",topic:"治理",leftId:"quote-a1",rightId:"quote-b1",commonGround:"都讨论系统的能力及安全边界。",divide:"前者讨论方法，后者讨论监督。",readingGuide:"先明确评价对象，再比较适用范围。",caveat:"编辑对照不表示人物曾直接辩论。"}],
    coverage:{checkedAt:"2026-11-19",organizations:[{id:"lab-a",name:"Lab A",representatives:["person-a"],status:"covered",note:"已核验两条公开材料。",sourceUrls:["https://example.org/quote-a1"]},{id:"lab-b",name:"Lab B",representatives:["person-b"],status:"partial",note:"仅代表已核验材料，不声称完整覆盖。"},{id:"lab-gap",name:"Uncovered Lab",representatives:[],status:"gap",note:"尚待可核验的一手资料。"}]},
    dailyUpdate:{status:"active",scheduleLabel:"每日 08:15（北京时间）",lastVerifiedAt:"2026-11-19",note:"仅核验后新增；无新材料不代表人物没有新观点。"},
  };
}
function rejects(mutate, pattern) { const feed=validFixture(); mutate(feed); assert.throws(()=>validateQuoteFeed(feed),pattern); }

test("published quote feed satisfies the shared provenance and comparison validator", () => {
  const feed=loadFeed(), result=validateQuoteFeed(feed);
  assert.equal(result.quotes,feed.quotes.length);
  assert.equal(result.people,new Set(feed.quotes.map(q=>q.speakerId)).size);
  assert.equal(result.comparisons,feed.comparisons.length);
  assert.ok(result.people>1 && result.comparisons>0);
  assert.ok(feed.quotes.some(q=>q.originalLanguage==="zh"),"include verified Chinese originals, not just English quotations");
  assert.ok(feed.quotes.some(q=>q.originalLanguage==="en"));
  assert.ok(feed.quotes.some(q=>q.era==="classic") && feed.quotes.some(q=>q.era==="contemporary"));
  for(const q of feed.quotes){
    assert.match(q.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(q.quoteEn,/[A-Za-z]/);assert.match(q.quoteZh,/[\u3400-\u9fff]/u);
    assert.ok(q.topics.every(hasText));
    for(const key of ["dateSourceUrl","eventSourceUrl","transcriptUrl"]) if(q.source[key])assert.ok(safeSourceUrl(q.source[key]),`${q.id}: ${key}`);
  }
});

test("valid validator fixture reports identity groups without splitting coauthors", () => {
  assert.deepEqual(validateQuoteFeed(validFixture()),{quotes:4,people:2,organizations:2,comparisons:1,sources:4});
});

test("partial dates preserve source precision and reject impossible calendar values", () => {
  for(const date of ["1950","2020-02","2024-02-29","2026-11-19"])assert.equal(validPartialDate(date),true,date);
  for(const date of ["2023-02-29","2026-02-30","2026-00","2026-13","2026-01-00","2026-01-32","26-01-01","2026-1-1","2026-11-19T00:00:00Z","",undefined])assert.equal(validPartialDate(date),false,String(date));
});

test("source canonicalization groups excerpts across fragment and tracking variants", () => {
  assert.equal(canonicalSource("https://example.org/report?utm_source=x&utm_medium=y&trk=a&linkId=5&ncid=n#part"),"https://example.org/report");
  assert.equal(canonicalSource("https://example.org/report?edition=2&utm_campaign=x#part"),"https://example.org/report?edition=2");
});

test("validator rejects a dangling quote relation",()=>rejects(f=>{f.quotes[0].relations[0].targetId="missing";},/dangling\/self relation/));
test("validator rejects a self relation",()=>rejects(f=>{f.quotes[0].relations[0].targetId=f.quotes[0].id;},/dangling\/self relation/));
test("validator rejects repeated relation targets",()=>rejects(f=>{f.quotes[0].relations.push({...f.quotes[0].relations[0]});}));
test("validator rejects relationship labels without sufficient rationale",()=>rejects(f=>{f.quotes[0].relations[0].reason="相近";}));
test("validator rejects a dangling comparison endpoint",()=>rejects(f=>{f.comparisons[0].rightId="missing";}));
test("validator rejects comparing a quotation with itself",()=>rejects(f=>{f.comparisons[0].rightId=f.comparisons[0].leftId;}));
test("validator rejects duplicate comparison IDs",()=>rejects(f=>{f.comparisons.push({...f.comparisons[0]});}));
test("validator rejects opposed comparisons without evidence of same-criterion opposition",()=>rejects(f=>{f.comparisons[0].type="opposed";},/actual opposition/));
test("validator rejects opposed comparisons with only a token justification",()=>rejects(f=>{f.comparisons[0].type="opposed";f.comparisons[0].oppositionBasis="说法相反";},/actual opposition/));
test("validator accepts explicitly reasoned opposition and does not require it for tension",()=>{
  const feed=validFixture();validateQuoteFeed(feed);
  feed.comparisons[0].type="opposed";feed.comparisons[0].oppositionBasis="双方在同一个能力评价标准、相同讨论对象以及重叠适用范围内给出互不相容的判断，故可标为相反观点。";
  assert.doesNotThrow(()=>validateQuoteFeed(feed));
});
test("validator rejects an invalid source date",()=>rejects(f=>{f.quotes[0].date="2025-02-29";},/invalid date/));
test("validator rejects an invalid verification date",()=>rejects(f=>{f.quotes[0].verifiedAt="2026-13-01";},/invalid verification date/));
test("validator rejects a claim dated after its verification",()=>rejects(f=>{f.quotes[0].date="2027-01-01";},/future quote/));
test("validator rejects a person with only one collected viewpoint",()=>rejects(f=>{f.quotes[1].speakerId="one-off-person";},/expected multiple viewpoints/));
test("validator rejects missing required identity and provenance fields",()=>{
  for(const field of ["speakerId","personName","organizationId","originalLanguage","era","verifiedAt"]){rejects(f=>{delete f.quotes[0][field];});}
});
test("validator rejects unknown coverage representatives while accepting explicit gaps",()=>{
  validateQuoteFeed(validFixture());rejects(f=>{f.coverage.organizations[0].representatives=["unknown-person"];},/unknown representative/);
  rejects(f=>{f.coverage.organizations[2].status="covered";});
});
test("validator rejects private, executable, or credential-bearing sources",()=>{
  for(const url of ["http://example.org/paper","javascript:alert(1)","https://user:secret@example.org/paper","https://localhost/paper","https://10.2.3.4/paper","https://space.feishu.cn/doc","https://wecom.qq.com/private"]){rejects(f=>{f.quotes[0].source.url=url;});}
});
test("validator enforces cumulative original English quotation budget per canonical source",()=>{
  rejects(f=>{f.quotes[0].quoteEn=Array(26).fill("word").join(" ");},/original English words/);
  rejects(f=>{for(const [index,q] of f.quotes.slice(0,2).entries()){q.source.url=`https://example.org/shared?utm_source=${index}#section-${index}`;q.quoteEn=Array(13).fill("word").join(" ");}},/26 original English words/);
});
test("validator budgets Chinese originals rather than the site's English translation",()=>{
  const feed=validFixture();feed.quotes[3].quoteEn=Array(40).fill("translation").join(" ");assert.doesNotThrow(()=>validateQuoteFeed(feed));
  rejects(f=>{f.quotes[3].quoteZh="字".repeat(51);},/original Chinese characters/);
  rejects(f=>{for(const q of f.quotes.slice(2)){q.originalLanguage="zh";q.quoteZh="字".repeat(26);q.source.url="https://example.org/chinese#excerpt";}},/52 original Chinese characters/);
});
test("validator permits exactly bounded original excerpts",()=>{
  const feed=validFixture();feed.quotes[0].quoteEn=Array(25).fill("word").join(" ");feed.quotes[3].quoteZh="字".repeat(50);assert.doesNotThrow(()=>validateQuoteFeed(feed));
});

test("quote search covers source locators, Chinese context, and combined scope",()=>{
  const quotes=validFixture().quotes;
  assert.deepEqual(filterQuotes(quotes,{search:"HUMAN oversight"}).map(q=>q.id),["quote-b1"]);
  assert.deepEqual(filterQuotes(quotes,{search:"section 3"}).map(q=>q.id),["quote-b1"]);
  assert.deepEqual(filterQuotes(quotes,{search:"现实"}).map(q=>q.id),["quote-b2"]);
  assert.deepEqual(filterQuotes(quotes,{speaker:"person-a",organization:"lab-a",topic:"治理",relation:"tension",era:"classic"}).map(q=>q.id),["quote-a1"]);
  assert.deepEqual(filterQuotes(quotes,{search:"不存在的短语"}),[]);
  assert.deepEqual(filterQuotes(quotes,{speaker:"person-a",organization:"lab-b"}),[]);
});
test("person and institution identity filters group coauthors and permit legacy labels",()=>{
  const quotes=validFixture().quotes;
  assert.deepEqual(filterQuotes(quotes,{speaker:"person-a"}).map(q=>q.id),["quote-a1","quote-a2"]);
  assert.equal(filterQuotes(quotes,{speaker:"Person A"}).length,1);
  assert.equal(filterQuotes(quotes,{organization:"lab-a"}).length,2);
  assert.equal(filterQuotes(quotes,{organization:"Lab A"}).length,2);
  assert.equal(filterQuotes(quotes,{era:"contemporary"}).length,3);
});
test("quote sorting and bookmarks do not mutate data or leak stale bookmark IDs",()=>{
  const quotes=validFixture().quotes,original=JSON.stringify(quotes);
  assert.deepEqual(filterQuotes(quotes,{sort:"oldest"}).map(q=>q.id),["quote-a1","quote-b1","quote-a2","quote-b2"]);
  assert.deepEqual(filterQuotes(quotes,{sort:"newest"}).map(q=>q.id),["quote-b2","quote-a2","quote-b1","quote-a1"]);
  assert.deepEqual(filterQuotes(quotes,{sort:"curated"}).map(q=>q.id),quotes.map(q=>q.id));
  assert.deepEqual(filterQuotes(quotes,{saved:true},new Set(["quote-a2","missing"])).map(q=>q.id),["quote-a2"]);
  assert.deepEqual(filterQuotes(quotes,{saved:true},new Set()),[]);assert.equal(JSON.stringify(quotes),original);
});
test("comparison search includes both endpoints and editorial explanations",()=>{
  const {quotes,comparisons}=validFixture();
  comparisons.push({id:"comparison-other",type:"similar",leftId:"quote-a2",rightId:"quote-b2",title:"共同的工程方向",topic:"现实世界",commonGround:"扎根现实",divide:"方法不同",readingGuide:"先看场景",caveat:"不代表互相回应"});
  const before=JSON.stringify([quotes,comparisons]);
  assert.deepEqual(filterComparisons(comparisons,quotes,{search:"人的监督"}).map(c=>c.id),["comparison-ab"]);
  assert.deepEqual(filterComparisons(comparisons,quotes,{search:"前者讨论方法"}).map(c=>c.id),["comparison-ab"]);
  assert.deepEqual(filterComparisons(comparisons,quotes,{speaker:"person-a",organization:"lab-b",relation:"similar",topic:"现实世界",era:"contemporary"}).map(c=>c.id),["comparison-other"]);
  assert.deepEqual(filterComparisons(comparisons,quotes,{saved:true},new Set(["quote-b2"])).map(c=>c.id),["comparison-other"]);
  assert.deepEqual(filterComparisons(comparisons,quotes,{relation:"opposed"}),[]);
  assert.deepEqual(filterComparisons([...comparisons,{id:"broken",leftId:"missing",rightId:"quote-a1"}],quotes),comparisons);
  assert.equal(JSON.stringify([quotes,comparisons]),before);
});
test("source links reject executable and non-HTTPS schemes",()=>{
  assert.equal(safeSourceUrl("https://example.org/paper#section-2"),"https://example.org/paper#section-2");
  for(const value of ["javascript:alert(1)","data:text/html,test","file:///tmp/report","http://example.org","/relative","not a URL",undefined,null])assert.equal(safeSourceUrl(value),"",String(value));
});

test("native hub renders quote and comparison views without iframe or standalone navigation",()=>{
  const app=read(`public/${hub}app.js`),index=read(`public/${hub}index.html`),module=read(`public/${hub}quotes/app.js`);
  assert.match(app,/import\s*\{\s*mountQuoteModule\s*\}\s*from\s*["']\.\/quotes\/app\.js/);
  assert.match(app,/\["quotes",\s*"人物语录"/);assert.match(app,/\["comparisons",\s*"观点对照"/);
  assert.match(app,/id="quote-module"/);assert.match(app,/mountQuoteModule\(quoteRoot/);
  assert.doesNotMatch(app,/href="\.\/quotes\/"/);
  assert.match(index,/<link[^>]+href="\.\/quotes\/styles\.css"/);
  assert.doesNotMatch(module,/<iframe\b/i); // Reports may still embed official PDFs; the ideas module must not.
  assert.match(app,/function originalEmbedMarkup/);assert.match(app,/class="original-embed"/);
});
test("legacy quote URL redirects to native routes and retains old deep links",()=>{
  const html=read(`public/${hub}quotes/index.html`),app=read(`public/${hub}app.js`),module=read(`public/${hub}quotes/app.js`);
  assert.match(html,/location\.replace\(target\.href\)/);assert.match(html,/#quote=/);assert.match(html,/#quotes/);assert.match(html,/#comparisons/);
  assert.match(html,/<meta\s+name="viewport"/);assert.doesNotMatch(html,/<script[^>]+src="\.\/app\.js"/);
  assert.match(app,/function routeView\(/);assert.match(app,/hashchange/);assert.match(app,/history\.pushState/);
  assert.match(module,/new URLSearchParams/);assert.match(module,/quote=\$\{encodeURIComponent/);
});
test("mounted UI keeps events scoped and cleans them when hub navigation changes",()=>{
  const app=read(`public/${hub}app.js`),module=read(`public/${hub}quotes/app.js`);
  assert.match(module,/export function mountQuoteModule/);assert.match(module,/new AbortController\(/);
  assert.match(module,/root\.addEventListener/);assert.match(module,/signal:controller\.signal/);
  assert.match(module,/cleanup\(\)/);assert.match(module,/controller\.abort\(\)/);assert.match(app,/quoteModule\?\.cleanup\(\)/);
  assert.doesNotMatch(module,/document\.addEventListener|window\.addEventListener|if\s*\(typeof document[^\n]*initialize/);
  assert.match(module,/localStorage\.getItem/);assert.match(module,/localStorage\.setItem/);
  assert.doesNotMatch(module,/localStorage\.(?:clear|removeItem)\(/);
  assert.match(app,/loadQuoteFeed/);assert.match(app,/quoteFeedError/);assert.match(app,/data-retry-quotes/);assert.match(app,/controller\.abort\(\),\s*10000/);
});
test("language, source boundaries, coverage gaps and date precision are visible",()=>{
  const module=read(`public/${hub}quotes/app.js`),css=read(`public/${hub}quotes/styles.css`);
  assert.match(module,/originalLanguage\s*===\s*"zh"/);assert.match(module,/中文为原文节选 · 英文为本站译文/);assert.match(module,/英文为原文节选 · 中文为本站译文/);
  assert.match(module,/dateLabel\s*\|\|\s*q\.date/);assert.match(module,/q\.speakerId\|\|q\.speaker/);
  assert.match(module,/q-timeline/);assert.match(module,/q-comparison-pair/);assert.match(module,/c\.commonGround/);assert.match(module,/c\.divide/);assert.match(module,/c\.caveat/);
  assert.match(module,/待补一手来源/);assert.match(module,/不代表穷尽/);assert.match(module,/lastVerifiedAt/);assert.match(module,/不将今日核验误作今日发言/);
  assert.match(css,/\.ai-quote-module/);assert.doesNotMatch(css,/:root\s*\{/);
  assert.match(css,/@media\s*\(max-width:650px\)/);assert.match(css,/@media print/);
});
test("public and deployed ideas package match without private content",()=>{
  const withoutGate=html=>html.replace(/<script\b[^>]*data-clair-access-gate[^>]*><\/script>/gi,"").replace(/<meta\b[^>]*data-clair-access-robots[^>]*>/gi,"").replace(/\s+/g," ").trim();
  for(const path of ["data/ai-classic-quotes.json","index.html","app.js","styles.css","quotes/index.html","quotes/app.js","quotes/styles.css"]){
    const source=read(`public/${hub}${path}`),deployed=read(`docs/${hub}${path}`);assert.ok(source.trim());
    if(path.endsWith(".html"))assert.equal(withoutGate(deployed),withoutGate(source),`${path}: only deployment access-gate injection may differ`);
    else assert.equal(deployed,source,`${path}: public/docs mirror mismatch`);
    assert.doesNotMatch(source,/(?:\/Users\/|file:\/\/|Bearer\s+[A-Za-z0-9._-]{15,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,})/);
  }
});
