#!/usr/bin/env python3
"""Config-driven read-only DS41 case queries; facts and receipts stay in private_root.

Usage: refresh-private.py CONFIG.json QUERY [QUERY ...], at most two concurrent.
Templates contain no user identities. Prior facts are only the identity baseline.
"""
import pathlib,json,datetime,decimal,hashlib,time,sys,concurrent.futures,types,re
read=lambda p:json.loads(pathlib.Path(p).read_text())
def write(p,v):pathlib.Path(p).parent.mkdir(parents=True,exist_ok=True);pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=1))
class Refresh:
 def __init__(self,config):
  self.cfg=read(config);self.W=pathlib.Path(self.cfg['private_root'])/'qianwen-cases';self.R=self.W/'rich';self.W.mkdir(exist_ok=True);self.R.mkdir(exist_ok=True);self.CUT=self.cfg['cutoff'];self.AD=self.cfg['asset_as_of'];self.START='2026-08-03';self.SOURCE=pathlib.Path(self.cfg['source']);self.OLD=pathlib.Path(self.cfg['previous_private_root'])/'qianwen-cases';self.old_users=read(self.OLD/'users-with-dates.json')['users'];self.old_meta={str(x['pmid']):x for x in read(self.OLD/'candidates.json')};self.old_rich=[u for u in self.old_users if u.get('coverage')!='funding_only'];self.read=read;self.write=write
 def funded(self):
  if (self.W/'metadata.json').exists():return read(self.W/'metadata.json')
  return list({str(x['pmid']):{'pmid':x['pmid'],'fb':x['fb']}for x in read(self.W/'txns.json')}.values())
 def rich_candidates(self):return read(self.R/'candidates.json')
 def ids(self,rows,key='pmid',quote=False):
  xs=sorted({str(x[key])for x in rows if x.get(key)is not None});assert all(re.fullmatch(r'[A-Za-z0-9_]+',x)for x in xs)
  return ','.join("'"+x+"'"if quote else x for x in xs)or("'0'"if quote else'0')
 def queries(self,kind):
  if kind=='binding_days_recent' or kind=='binding_days_prior':
   rows=self.funded()if kind.endswith('recent')else read(self.W/'binding-missing-recent.json');condition=f"cal_date>='{self.START}' AND cal_date<='{self.CUT[:10]}'"if kind.endswith('recent')else f"cal_date<'{self.START}'"
   return f"SELECT account3_id,cal_date,COUNT(*) root_rows,SUM(total_asset) asset_at_bind FROM ying99_asset.dwd_app_service_account_profit_combine USE INDEX(idx_user) WHERE account3_id IN ({self.ids(rows,'account3_id')}) AND relation_account_type='ROOT' AND {condition} GROUP BY account3_id,cal_date"
  if kind=='asset_date_coverage':
   prior_day=read(self.OLD/'users-with-dates.json')['meta']['asset_as_of'];candidate=self.cfg['asset_as_of'];dates=sorted({prior_day,candidate,self.CUT[:10],(datetime.date.fromisoformat(candidate)-datetime.timedelta(days=1)).isoformat()});dates=','.join("'"+v+"'"for v in dates)
   return f"SELECT account3_id,cal_date,COUNT(*) root_rows,SUM(total_asset) total_asset,SUM(input_amount) input_amount,SUM(output_amount) output_amount FROM ying99_asset.dwd_app_service_account_profit_combine USE INDEX(idx_cal_date_saId) WHERE cal_date IN ({dates}) AND relation_account_type='ROOT' AND account3_id IN ({self.ids(self.funded(),'account3_id')}) GROUP BY account3_id,cal_date"
  rich=kind.startswith('rich/');rows=self.rich_candidates()if rich else(self.funded()if kind!='txns'else[])
  first={}
  if kind!='txns':
   for x in read(self.W/'txns.json'):first[str(x['pmid'])]=min(first.get(str(x['pmid']),x['accept_time']),x['accept_time'])
  cte=' UNION ALL '.join(f"SELECT {int(x['pmid'])} pmid,CAST('{str(x['fb']).replace('T',' ')[:19]}' AS DATETIME) fb,CAST('{str(first[str(x['pmid'])]).replace('T',' ')[:19]}' AS DATETIME) first_inflow_after"for x in rows)
  ca=[x for x in read(self.R/'m_combine17.json')if x['relation_account_type']=='CA']if kind=='rich/m_meta'else[]
  vals={'CUT':self.CUT,'CUTDAY':self.CUT[:10],'AD':self.AD,'ADM3':(datetime.date.fromisoformat(self.AD)-datetime.timedelta(days=3)).isoformat(),'ADEND':(datetime.date.fromisoformat(self.AD)+datetime.timedelta(days=1)).isoformat()+' 00:00:00','IDS':self.ids(rows),'IDQ':self.ids(rows,quote=True),'A3':self.ids(rows,'account3_id'),'A3Q':self.ids(rows,'account3_id',True),'CA':self.ids(ca,'service_account_id',True),'FUNDED':cte}
  sql=(pathlib.Path(__file__).with_name('query-templates')/(kind+'.sql')).read_text()
  for k,v in vals.items():sql=sql.replace('{{'+k+'}}',v)
  assert '{{'not in sql,kind
  return sql
 def fetch(self,name,sql,timeout=900):
  sys.path.insert(0,'/Users/guty/.claude/skills/redash');import redash
  out=self.W/(name+'.json');audit=self.W/(name+'.query-audit.json');query=self.W/(name+'.sql');note={'cutoff':self.CUT,'asset_as_of':self.AD,'started_at':datetime.datetime.now().isoformat(),'data_source_id':41,'query_sha256':hashlib.sha256(sql.encode()).hexdigest(),'state':'started'}
  if audit.exists():
   a=read(audit)
   if a['state']=='success'and a['cutoff']==self.CUT and a['query_sha256']==note['query_sha256']and hashlib.sha256(out.read_bytes()).hexdigest()==a['output_sha256']:print(name+': existing successful fresh query retained',flush=True);return
   raise RuntimeError('existing non-success/query mismatch: inspect its saved job; do not auto-resubmit '+name)
  query.parent.mkdir(parents=True,exist_ok=True);query.write_text(sql);write(audit,note);start=time.monotonic()
  try:
   response=redash._request('POST','/api/query_results',{'query':sql,'data_source_id':41,'max_age':0});job=response.get('job',{})
   if job.get('id'):
    note['job_id']=job['id'];write(audit,note);deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
     j=redash._request('GET','/api/jobs/'+job['id']).get('job',{})
     if j.get('status')==3:response=redash._request('GET','/api/query_results/'+str(j['query_result_id']));note['query_result_id']=j['query_result_id'];break
     if j.get('status')in(4,5):raise RuntimeError(str(j.get('error')))
     time.sleep(2)
    else:raise TimeoutError('saved job not complete; do not resubmit')
   result=response['query_result']['data']['rows'];write(out,result);note.update(state='success',rows=len(result),seconds=round(time.monotonic()-start,3),output_sha256=hashlib.sha256(out.read_bytes()).hexdigest());write(audit,note);print(name+': '+str(len(result))+' fresh rows',flush=True)
  except Exception as error:note.update(state='failed',seconds=round(time.monotonic()-start,3),error=str(error));write(audit,note);raise
if __name__=='__main__':
 q=Refresh(sys.argv[1])
 with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:
  jobs={pool.submit(q.fetch,n,q.queries(n)):n for n in sys.argv[2:]}
  for future in concurrent.futures.as_completed(jobs):future.result()
