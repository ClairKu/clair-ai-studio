/* 独立交互演示；预设文本；不连接模型，不上传输入。 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const scenarios = {
    verify:{answer:'已根据仓库整理实现链路，但尚未证实线上当前发布版本。', suggestion:'继续核验线上当前生效的版本，补齐发布记录，不要只依赖旧仓库。'},
    deliver:{answer:'分析已完成，原目标还包括让团队能据此验收，但清单尚未形成。', suggestion:'把这些结论整理成验收清单，逐项写明证据、通过标准和未确认内容。'},
    understand:{answer:'已解释历史数据的含义；当前样例仍未列明时间和费用口径。', suggestion:'补充这组历史数据的时间、费用口径与适用限制，便于核对。'},
    complete:{answer:'已按原要求完成整理、核对和交付，没有发现需要继续处理的事项。', suggestion:null}
  };
  let epoch=0, revision=0, composing=false, suggestion=null, accepted=null;
  let pendingTimer=null, raceTypingTimer=null, mode='idle';
  function log(message) {
    const row=document.createElement('div');
    row.textContent=message;
    $('log').append(row);
    while($('log').children.length>10) $('log').firstChild.remove();
    $('log').scrollTop=$('log').scrollHeight;
  }
  function render(status) {
    $('ghost').textContent=suggestion || '';
    $('draft').placeholder=suggestion ? '' : '输入自己的消息，或采用建议';
    $('accept').disabled=!suggestion || composing;
    $('dismiss').disabled=!suggestion;
    $('send').disabled=!$('draft').value.trim() || composing;
    $('status').textContent=status || (mode==='visible'?'预测已展示 · 尚未成为草稿':mode==='draft'?'可编辑草稿 · 尚未发送':mode==='requesting'?'正在模拟生成，不影响输入':'暂无预测');
  }
  function invalidate(cancelPending=true) {
    epoch++;
    suggestion=null;
    if(cancelPending && pendingTimer!==null) clearTimeout(pendingTimer);
    if(cancelPending) pendingTimer=null;
    if(raceTypingTimer!==null) clearTimeout(raceTypingTimer);
    raceTypingTimer=null;
  }
  function startPrediction({race=false}={}) {
    if($('draft').value) {
      log('保留已有草稿：请先发送或清空，再请求预测。');
      render('已有草稿，预测暂停');
      return;
    }
    invalidate();
    accepted=null;
    $('draft').value='';
    revision++;
    const key=$('scenario').value;
    const snapshot=revision;
    const mine=epoch;
    $('answer').textContent=scenarios[key].answer;
    mode='requesting';render();log('请求：'+key+'；快照 v'+snapshot);
    pendingTimer=setTimeout(() => {
      pendingTimer=null;
      if(mine!==epoch || snapshot!==revision || key!==$('scenario').value || composing || $('draft').value) {
        log('丢弃：返回结果已过期；当前草稿保持不变。');
        mode=$('draft').value?'draft':'idle';render('旧结果已拦截 · 输入保持不变');return;
      }
      suggestion=scenarios[key].suggestion;
      mode=suggestion?'visible':'idle';
      render(suggestion?undefined:'选择不展示：任务已完整结束');
      log(suggestion?'展示：灰字尚未写入真实草稿。':'空结果：没有值得新增的下一步。');
    },race?900:400);
    if(race) {
      raceTypingTimer=setTimeout(() => {
        raceTypingTimer=null;
        $('draft').value='这是请求期间形成的新草稿，请保留。';
        revision++;invalidate(false);mode='draft';render();
        log('模拟用户输入：使旧请求失效，故意保留其返回以验证拦截。');
      },250);
    }
  }
  function accept() {
    if(!suggestion || composing || $('draft').value) return;
    const text=suggestion;
    invalidate();
    accepted=text;$('draft').value=text;revision++;
    mode='draft';render();log('接受：写入可编辑草稿；没有发送。');
    $('draft').focus();$('draft').setSelectionRange(text.length,text.length);
  }
  function dismiss() {
    invalidate();mode=$('draft').value?'draft':'idle';render('本轮建议已关闭');log('关闭：本轮不自动重现。');
  }
  function send() {
    if(composing || !$('draft').value.trim()) return;
    const text=$('draft').value.trim();
    const outcome=accepted===null?'用户自行输入':text===accepted?'接受后原样发送':'接受后编辑再发送';
    invalidate();log('仅在本页演示发送：'+outcome+'。');
    $('draft').value='';accepted=null;revision++;mode='idle';render('演示发送完成 · 未连接真实服务');
  }
  $('scenario').addEventListener('change',()=>startPrediction());
  $('reset').addEventListener('click',()=>startPrediction());
  $('race').addEventListener('click',()=>startPrediction({race:true}));
  $('accept').addEventListener('click',accept);
  $('dismiss').addEventListener('click',dismiss);
  $('send').addEventListener('click',send);
  $('draft').addEventListener('input',()=>{revision++;invalidate(false);mode=$('draft').value?'draft':'idle';render();});
  $('draft').addEventListener('compositionstart',()=>{composing=true;revision++;invalidate(false);mode='draft';render('组合输入中 · 建议暂停');});
  $('draft').addEventListener('compositionend',()=>{composing=false;revision++;render();});
  $('draft').addEventListener('keydown',event=>{
    if(event.isComposing || composing || event.keyCode===229) return;
    if(event.repeat && ['Tab','ArrowRight','Enter'].includes(event.key)) {event.preventDefault();return;}
    const plain=!(event.shiftKey||event.ctrlKey||event.metaKey||event.altKey);
    if(suggestion && plain && ['Tab','ArrowRight','Enter'].includes(event.key)) {event.preventDefault();accept();return;}
    if(event.key==='Escape' && suggestion){event.preventDefault();dismiss();return;}
    if(event.key==='Enter' && plain && $('draft').value.trim()){event.preventDefault();send();}
  });
  startPrediction();
})();