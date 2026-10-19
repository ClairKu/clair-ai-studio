import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

test('App MIA control records are not questions; real presets, acknowledgements and Doubao tokens remain',()=>{
  const program=String.raw`
import ast,copy,json,re
from pathlib import Path
from datetime import datetime
signatures=[]
for channel in ('qianwen','doubao'):
    source=Path(f'scripts/{channel}-cases/build-cases.py').read_text()
    tree=ast.parse(source)
    names={'app_mia_is_control','app_mia_questions','top_stats','all_asks','question_counts','funding_only','agg'}
    nodes=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in names or isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='APP_MIA_CONTROL_TEXTS' for t in n.targets)]
    ns={'dt':lambda x:datetime.fromisoformat(x) if x else None,'MIA_SCENE':{'MIA':'小顾'},'money':str,'wan':str,'fmt_md':str,'dur':lambda a,b:'1天'}
    exec(compile(ast.Module(body=nodes,type_ignores=[]),'case_helpers','exec'),ns)
    controls=ns['APP_MIA_CONTROL_TEXTS'];is_control=ns['app_mia_is_control'];select=ns['app_mia_questions']
    signatures.append([ast.dump(n,include_attributes=False) for n in nodes if isinstance(n,ast.FunctionDef) and n.name in ('app_mia_is_control','app_mia_questions')])
    for text in controls:
        assert is_control({'text':text,'mode':None})
        assert is_control({'content':text,'query_mode':None,'msg_type':'USER_INPUT'})
        assert is_control({'text':'  '+text+'  ','mode':' '})
        for mode in ('SELF_INPUT','AUTO_LEAD','SELF_PICK_LEAD','QUICK_MENU','OPTION'):
            assert not is_control({'text':text,'mode':mode})
    for text in ('OK','ETF','newbie','HI_AGAIN是什么意思','推荐2-3个值得长期持有的基金，并给出详细的分析'):
        assert not is_control({'text':text,'mode':None})
    rows=[{'ts':'2026-10-01T01:00:00','scene':'MIA','mode':None,'text':x} for x in controls]
    rows += [{'ts':'2026-10-01T01:01:00','scene':'MIA','mode':None,'text':''},
             {'ts':'2026-10-01T01:02:00','scene':'MIA','mode':'AUTO_LEAD','text':'推荐2-3个值得长期持有的基金，并给出详细的分析'},
             {'ts':'2026-10-01T01:03:00','scene':'MIA','mode':'SELF_INPUT','text':'HI_AGAIN'},
             {'ts':'2026-10-01T01:04:00','scene':'MIA','mode':'SELF_INPUT','text':'OK'}]
    u={'pmid':'fixture','letter':'1','cohort':'new','fb':'2026-10-01T00:00:00','coverage':'rich',
       'derived':{'first_inflow_after':'2026-10-02T00:00:00','inflow_after':0,'buy_amount_after':0,'buys_after':0,'cancels_after':0},'asset_latest':None,
       'asks':[{'ts':'2026-10-01T00:30:00','text':'我的持仓结构怎么样'}],
       'channels':{'app_mia':rows,'wechat_msgs':0,'doubao_sessions':2,'tokens':['2026-10-01T00:00:00','2026-10-01T01:00:00']},
       'question_stats':{'reviewed':True,'total_questions':1,'pre_first_inflow_questions':1}}
    before=copy.deepcopy(u)
    assert len(select(u))==3
    records=ns['all_asks'](u)
    assert len(records)==(4 if channel=='qianwen' else 6)
    assert sum(r['text']=='HI_AGAIN' for r in records)==1
    assert not any(r['text'] in ('FIRST_IN_DAY','NEWBIE','') for r in records)
    assert f'{4 if channel=="qianwen" else 6} 条' in ns['top_stats'](u)
    if channel=='qianwen':
        assert ns['question_counts'](u)==(1,1)
    else:
        assert ns['agg']([u])['asks']==1 and ns['agg']([u])['sessions']==2
        assert sum(r['ch']=='豆包' for r in records)==2
    assert u==before, 'source messages and strict KPI inputs must not be mutated'
    assert '自动入口，非用户提问' in source
    assert 'for row in app_mia_questions(u):' in source
assert signatures[0]==signatures[1], 'Q/D local semantics must stay identical'
print(json.dumps({'status':'passed','channels':2,'strict_kpi_inputs_unchanged':True}))
`;
  const run=spawnSync('python3',['-c',program],{cwd:resolve(import.meta.dirname,'..'),encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.equal(JSON.parse(run.stdout).status,'passed');
});

test('Empty holdings distinguish reviewed same-day zero assets from missing details without settlement guesses',()=>{
  const program=String.raw`
import ast,copy,json,re
from pathlib import Path
from datetime import datetime
for channel in ('qianwen','doubao'):
    tree=ast.parse(Path(f'scripts/{channel}-cases/build-cases.py').read_text())
    node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='holdings_block')
    meta={'assets_audit_complete':True,'asset_as_of':'2026-10-16'}
    ns={'dt':lambda s:datetime.fromisoformat(s),'META':meta}
    exec(compile(ast.Module(body=[node],type_ignores=[]),'holdings','exec'),ns)
    u={'derived':{},'fb':'2026-10-01T00:00:00','trades':[],'holdings':[],'fund_detail':[],
       'asset_latest':{'cal_date':'2026-10-16','ta':0}}
    page=ns['holdings_block'](u)
    assert '已核实资产为0，当前无持仓' in page
    assert not re.search('次日|落账',page)
    for asset in (None,{'cal_date':'2026-10-16','ta':None},{'cal_date':'2026-10-16','ta':100},{'cal_date':'2026-10-15','ta':0}):
        fixture=copy.deepcopy(u);fixture['asset_latest']=asset
        page=ns['holdings_block'](fixture)
        assert '暂无可展示的持仓明细' in page
        assert '已核实资产为0' not in page and not re.search('次日|落账',page)
    meta['assets_audit_complete']=False
    assert '已核实资产为0' not in ns['holdings_block'](u)
print(json.dumps({'status':'passed','channels':2}))
`;
  const run=spawnSync('python3',['-c',program],{cwd:resolve(import.meta.dirname,'..'),encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.equal(JSON.parse(run.stdout).status,'passed');
});
