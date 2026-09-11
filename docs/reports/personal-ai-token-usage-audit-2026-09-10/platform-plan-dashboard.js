(async()=>{
  const root=document.querySelector('#platformPlanDashboard');
  if(!root)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>n>=1e9?(n/1e9).toFixed(3)+'B':n>=1e6?(n/1e6).toFixed(2)+'M':n.toLocaleString('zh-CN');
  let data;
  try{data=await fetch('platform-plan-analysis.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})}catch(e){root.innerHTML='<div class="callout"><strong>套餐分析数据暂时无法加载。</strong> 请刷新页面或下载 JSON 明细。</div>';return}
  const ps=data.platforms;
  const meter=p=>p.limits.find(x=>Number.isFinite(x.usedPercent));
  const mini=p=>{const m=meter(p);return `<button class="plan-mini" style="--platform:${p.color}" data-platform="${p.id}"><div class="name">${esc(p.name)}</div><div class="tier">${esc(p.plan)}<br>${esc(p.price)}</div><div class="mini-meter">${m?`<span style="width:${Math.min(100,m.usedPercent)}%"></span>`:''}</div><small>${esc(p.limitHeadline)}</small></button>`};
  root.querySelector('.plan-grid').innerHTML=ps.map(mini).join('');
  const detail=root.querySelector('.plan-detail');
  function render(id){
    root.querySelectorAll('.plan-tab').forEach(b=>b.classList.toggle('active',b.dataset.platform===id));
    root.querySelectorAll('.plan-mini').forEach(b=>b.classList.toggle('active',b.dataset.platform===id));
    if(id==='all'){
      detail.style.display='none';root.querySelector('.plan-matrix').style.display='block';return;
    }
    root.querySelector('.plan-matrix').style.display='none';detail.style.display='block';
    const p=ps.find(x=>x.id===id);if(!p)return;
    detail.style.setProperty('--platform',p.color);
    const limits=p.limits.map(l=>`<div class="limit-card" data-status="${esc(l.status)}"><div class="limit-head"><strong>${esc(l.label)}</strong><span>${Number.isFinite(l.usedPercent)?l.usedPercent.toFixed(l.usedPercent<10?1:0)+'%':l.status==='unknown'?'分母不可见':'状态项'}</span></div><div class="limit-rail">${Number.isFinite(l.usedPercent)?`<span style="width:${Math.min(100,l.usedPercent)}%"></span>`:''}</div><div class="limit-detail">${esc(l.detail)}</div></div>`).join('');
    const sources=p.sources.map(s=>s.url?`<a class="plan-source" href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.label)} · ${esc(s.kind)}</a>`:`<span class="plan-source">${esc(s.label)} · ${esc(s.kind)}</span>`).join('');
    detail.innerHTML=`<div class="plan-detail-head"><div class="plan-title"><div class="plan-logo">${esc(p.name.slice(0,2))}</div><div><h3>${esc(p.name)} · ${esc(p.plan)}</h3><div class="evidence-pill">${esc(p.evidenceLevel)}</div></div></div><div class="plan-price">${esc(p.price)}<small>${esc(p.billingCycle)}</small></div></div><div class="plan-facts"><div class="plan-fact"><span>冻结近月总量</span><strong>${fmt(p.usageMonthTotal)}</strong></div><div class="plan-fact"><span>新处理 + 生成</span><strong>${fmt(p.usageMonthEffective)}</strong></div><div class="plan-fact"><span>输入缓存率</span><strong>${p.cacheRate==null?'未上报':(p.cacheRate*100).toFixed(1)+'%'}</strong></div><div class="plan-fact"><span>每百万有效 Token</span><strong>${esc(p.costPerEffectiveMillion)}</strong></div></div><div><h4 style="margin:0 0 9px">额度、限时与重置</h4><div class="limits-grid">${limits}</div>${p.id==='workbuddy'?'<div class="scenario-note">虚线框是情景测算，不代表已确认账号套餐。</div>':''}</div><div class="plan-columns"><div class="plan-block"><h4>平台如何计量</h4><ul>${p.meteringRules.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="plan-block"><h4>从你的用量读出的洞察</h4><ul>${p.insights.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div><div class="plan-action"><strong>建议：</strong> ${esc(p.action)}</div><div class="plan-sources">${sources}</div>`;
  }
  root.addEventListener('click',e=>{const el=e.target.closest('[data-platform]');if(el)render(el.dataset.platform)});
  render('all');
})();
