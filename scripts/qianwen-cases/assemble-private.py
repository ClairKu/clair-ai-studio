#!/usr/bin/env python3
"""Current private source assembly without historical temporary-code dependencies.

Usage: assemble-private.py CONFIG.json prepare|assemble
Only previous stable identity and reviewed narrative fields are carried forward.
Every numeric fact is reconstructed from the current run's fetched evidence.
"""
import pathlib,json,sys,importlib.util,collections,decimal,datetime,subprocess
read=lambda p:json.loads(pathlib.Path(p).read_text())
def write(p,v):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=1))
D=lambda x:decimal.Decimal(str(x));T=lambda x:datetime.datetime.fromisoformat(str(x).replace(' ','T')[:19])
def load(p,name):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
class Assembly:
 def __init__(self,config):
  self.cfg=read(config);self.H=pathlib.Path(self.cfg['private_root']);self.W=self.H/'qianwen-cases';self.R=self.W/'rich';self.S=pathlib.Path(self.cfg['source'])/'scripts/qianwen-cases';self.O=pathlib.Path(self.cfg['previous_private_root'])/'qianwen-cases';self.AD=self.cfg['asset_as_of'];self.CUT=self.cfg['cutoff'];self.old={str(x['pmid']):x for x in read(self.O/'users-with-dates.json')['users']};self.ext=load(self.S/'extend-funded-users.py','extend_current_funded')
 def prepare(self):
  hist={str(x['pmid']):x for x in read(self.W/'history.json')};bind={str(x['pmid']):x for x in read(self.W/'binding_all_root_sums.json')};tx=collections.defaultdict(list)
  for x in read(self.W/'txns.json'):tx[str(x['pmid'])].append(x)
  candidates=[];labels={p:str(u['letter'])for p,u in self.old.items()};n=max(map(int,labels.values()))+1
  for m in sorted(read(self.W/'metadata.json'),key=lambda x:(x['fb'],str(x['pmid']))):
   p=str(m['pmid']);ts=sorted(tx[p],key=lambda x:(x['accept_time'],str(x['order_id'])));row={**m,**hist[p],**bind.get(p,{'asset_at_bind':None,'asset_bind_date':None}),'first_inflow_after':ts[0]['accept_time'],'last_inflow_after':ts[-1]['accept_time'],'inflow_events_after':len(ts),'inflow_after_amount':float(sum(D(x['buy_amount'])for x in ts))}
   candidates.append(row)
   if p not in labels:labels[p]=str(n);n+=1
  rich=[];narr={}
  for row in candidates:
   p=str(row['pmid']);flags,_=self.ext.classify(row)
   if p in self.old and self.old[p].get('coverage')!='funding_only' or flags['zero_at_bind']or flags['first_invest_after']:
    rich.append(row);narr[p]={k:self.old[p][k]for k in('insight','conversion_path_label','conversion_path','behavior_insight','narrative','verdict')if p in self.old and k in self.old[p]};narr[p]['letter']=labels[p]
  write(self.W/'candidates.json',candidates);write(self.R/'candidates.json',rich);write(self.R/'narratives.json',narr);write(self.W/'stable-labels.json',labels)
  print(json.dumps({'funded':len(candidates),'rich':len(rich),'new_labels':{labels[p]:p for p in labels if p not in self.old}},ensure_ascii=False))
 def assemble(self):
  bound=int((self.W/'bound-total.txt').read_text());command=[sys.executable,str(self.S/'assemble-users.py'),str(self.R),self.CUT,str(bound)];result=subprocess.run(command,capture_output=True,text=True);(self.R/'assemble-users.py.log').write_text(result.stdout+result.stderr);result.check_returncode();rich=read(self.R/'users.json');candidates=read(self.W/'candidates.json');tx=read(self.W/'txns.json');data=self.ext.extend(rich,candidates,tx,[]);labels=read(self.W/'stable-labels.json')
  for u in data['users']:
   u['letter']=labels[str(u['pmid'])]
   if str(u['pmid'])in self.old:u['surname']=self.old[str(u['pmid'])].get('surname')
  write(self.W/'users-extended.json',data)
  exact={str(x['account3_id']):x for x in read(self.W/'assets_exact.json')};last={str(x['account3_id']):x for x in read(self.W/'assets_missing_latest.json')};hist={str(x['pmid']):x for x in read(self.W/'history.json')};meta={str(x['pmid']):x for x in read(self.W/'metadata.json')};review=[]
  for u in data['users']:
   p=str(u['pmid']);a3=str(meta[p]['account3_id']);h=hist[p]
   if a3 in exact:r=exact[a3];row={'pmid':p,'as_of':self.AD,'total_asset':r['total_asset'],'status':'exact','basis':'fresh_same_day_SUM_of_all_ROOT_rows','source_date':self.AD}
   elif a3 in last and D(last[a3]['total_asset'])==0 and (not h['last_noncanceled_trade_before_asset_day_end']or h['last_noncanceled_trade_before_asset_day_end'][:10]<=last[a3]['cal_date']):row={'pmid':p,'as_of':self.AD,'total_asset':0,'status':'verified_zero','basis':'fresh_latest_whole_ROOT_SUM_zero_and_no_later_noncancelled_trade_through_asset_day','source_date':last[a3]['cal_date']}
   elif a3 not in last and h['first_inflow_ever'][:10]>self.AD and (not h['first_buy_ever']or h['first_buy_ever'][:10]>self.AD):row={'pmid':p,'as_of':self.AD,'total_asset':0,'status':'verified_zero','basis':'fresh_complete_preasset_ROOT_history_absent_and_lifetime_first_funding_product_buy_after_asset_day','source_date':None}
   else:raise ValueError('unproved current asset missing for anonymous '+u['letter'])
   review.append(row)
  write(self.W/'reviewed-assets.json',review);data=load(self.S/'apply-reviewed-assets.py','apply_assets_current').apply_review(data,review)
  qs=[{**x,'total_questions':int(x['total_questions']),'pre_first_inflow_questions':int(x['pre_first_inflow_questions'])}for x in read(self.W/'question_counts.json')];data=load(self.S/'apply-question-counts.py','apply_Q_current').apply_counts(data,qs)
  ops=collections.defaultdict(list);devices=collections.defaultdict(set)
  for x in read(self.W/'app_ops.json'):ops[str(x['pmid'])].append(x)
  plat={'3':'iOS','4':'Android','5':'HarmonyOS'}
  for x in read(self.W/'devices.json'):devices[str(x['pmid'])].add(plat[str(x['platform'])])
  oprows=[]
  for u in data['users']:
   p=str(u['pmid']);r=min(ops[p],key=lambda x:x['first_app_operation_at'],default=None);oprows.append({'pmid':p,'first_app_operation_at':r['first_app_operation_at']if r else None,'first_app_operation_platform':r['lib']if r else None,'device_platforms':sorted(devices[p]),'reviewed':True})
  write(self.W/'app-operation-stats.json',oprows);data=load(self.S/'apply-app-operations.py','apply_app_current').apply_operations(data,oprows)
  bhr=[{**x,'reviewed':True}for x in read(self.W/'binding_history.json')];data=load(self.S/'apply-binding-history.py','apply_history_current').apply_history(data,bhr)
  dates=[{'pmid':p,'first_inflow_ever':x['first_inflow_ever'],'reviewed':True}for p,x in hist.items()];data=load(self.S/'apply-first-inflow-dates.py','apply_dates_current').apply_dates(data,dates)
  write(self.W/'users-with-dates.json',data);print(json.dumps({'funded':len(data['users']),'rich':data['meta']['rich_cases'],'asset_date':self.AD,'asset_yuan':str(sum(D(u['asset_latest']['ta'])for u in data['users']))},ensure_ascii=False))
if __name__=='__main__':getattr(Assembly(sys.argv[1]),sys.argv[2])()
