/* Remove third-party social messages, personal stories and account identifiers from public R9 report views. Keep aggregate market, fund and sentiment metrics. */
export function sanitizeR9ReportRecords(records){
 let omittedGroups=0,omittedIdentifiers=0;
 const identifiers=/^(?:user|username|user_name|nickname|nick|realname|real_name|uid|user_id|userid|author|author_name|avatar|avatar_url|phone|mobile|email|openid|unionid|wechat|weixin|password|passwd|cookie|session|authorization|api_key|apikey|access_token|refresh_token|me)$/i;
 function clean(v,path=""){if(Array.isArray(v)){const social=/tieba|xhs|xiaohongshu|weibo|guba|forum|comments|posts|tweets|replies/i.test(path),hasIdentifiedMessages=v.some(x=>x&&typeof x==="object"&&Object.keys(x).some(k=>identifiers.test(k))&&Object.keys(x).some(k=>/^(?:text|title|content|body|message|desc)$/i.test(k)));if(social&&hasIdentifiedMessages){omittedGroups++;return {archivedSampleCount:v.length,note:"第三方原始发言与账号明细已省略，保留统计指标。"};}return v.map((x,i)=>clean(x,path+"["+i+"]"));}
  if(v&&typeof v==="object"){const out={};for(const[k,x]of Object.entries(v)){if(identifiers.test(k)){omittedIdentifiers++;continue;}if(/today.*(?:tieba|xhs|xiaohongshu|weibo|guba)/i.test(path)&&/^(?:posts|notes|comments|threads|messages|replies)$/i.test(k)&&Array.isArray(x)){out[k+"SampleCount"]=x.length;out.privacyNote="第三方原始发言与账号明细已省略，保留统计指标。";omittedGroups++;continue;}out[k]=clean(x,path+"."+k);}return out;}return v;}
 const result=records.map(r=>{const out={...r};if(r.url.split("?")[0]==="/api/forum"){out.data={savedDiscussionCount:r.data?.msgs?.length||0,note:"R9 交流区保留功能说明和保存数量，第三方发言及账号明细已省略。"};omittedGroups++;return out;}out.data=clean(r.data,r.url);return out;});
 return {records:result,omittedGroups,omittedIdentifiers};
}
