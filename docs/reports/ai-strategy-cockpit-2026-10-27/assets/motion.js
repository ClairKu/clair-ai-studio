'use strict';
window.enhanceDashboard=function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const cards=document.querySelectorAll('.metric-number');
  for(const card of cards){const txt=card.firstChild;if(!txt||txt.nodeType!==Node.TEXT_NODE)continue;const final=Number(txt.textContent.replace(/,/g,''));if(!Number.isFinite(final)||final<10)continue;const start=performance.now();function tick(now){const t=Math.min((now-start)/650,1),eased=1-Math.pow(1-t,3);txt.textContent=fmt(Math.round(final*eased));if(t<1&&card.isConnected)requestAnimationFrame(tick)}requestAnimationFrame(tick)}
};
let tooltip;
function showChartTip(el,x,y){if(!tooltip){tooltip=document.createElement('div');tooltip.className='chart-tooltip';document.body.appendChild(tooltip)}tooltip.textContent=el.dataset.chartTip;tooltip.style.left=Math.max(120,Math.min(innerWidth-120,x))+'px';tooltip.style.top=Math.max(50,y-12)+'px'}
document.addEventListener('pointerover',e=>{const el=e.target.closest('[data-chart-tip]');if(el)showChartTip(el,e.clientX,e.clientY)});
document.addEventListener('focusin',e=>{if(e.target.matches('[data-chart-tip]')){let r=e.target.getBoundingClientRect();showChartTip(e.target,r.x+r.width/2,r.y)}});
document.addEventListener('pointerout',e=>{if(e.target.closest('[data-chart-tip]')&&tooltip){tooltip.remove();tooltip=null}});
document.addEventListener('focusout',e=>{if(e.target.matches('[data-chart-tip]')&&tooltip){tooltip.remove();tooltip=null}});
window.enhanceDashboard();
