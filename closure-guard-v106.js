/* Negocia.AI v0.9.14 - fechamento validado + reparo de status inválido */
(function(){
  function repairInvalidClosures(){
    const data=db.get();
    let changed=false;
    for(const n of (data.negotiations||[])){
      const outcome=n&&n.result&&n.result.outcome;
      const finalValue=n&&n.result?Number(n.result.finalValue||0):0;
      if(n&&n.status==='closed'&&outcome==='won'&&!finalValue){
        n.status='active';
        n.result=null;
        n.updatedAt=new Date().toISOString();
        n.repairNote='Fechamento inválido revertido automaticamente: resultado Fechado sem valor final.';
        changed=true;
      }
    }
    if(changed)db.set(data);
    return changed;
  }

  repairInvalidClosures();

  window.renderResult=function(){
    const n=getCurrent();
    APP.innerHTML=shell(`<div class="page">
      <span class="pill good">Encerramento</span>
      <h2>Como terminou?</h2>
      <div class="field">
        <label>Resultado</label>
        <select id="outcome" onchange="toggleFinalValueRequirement()">
          <option value="">Selecione o resultado</option>
          <option value="won">Fechado</option>
          <option value="lost">Sem acordo</option>
          <option value="paused">Pausado / continuar depois</option>
        </select>
      </div>
      <div class="field" id="finalValueField">
        <label>Valor final <span id="finalRequired" style="color:#D34D5B">*</span></label>
        <input id="finalValue" type="number" inputmode="decimal" placeholder="Informe o valor fechado">
        <div class="tiny" id="finalHint" style="margin-top:5px;color:#718394">Obrigatório quando o resultado for Fechado.</div>
      </div>
      <div class="field">
        <label>Aprendizado</label>
        <textarea id="learning" placeholder="O que funcionou? O que faria diferente?"></textarea>
      </div>
      <button class="primary" onclick="saveResult()">Salvar resultado</button>
      <button class="secondary" style="margin-top:8px" onclick="state.route='copilot';render()">Voltar à negociação</button>
    </div>`,false);
    toggleFinalValueRequirement();
  };

  window.toggleFinalValueRequirement=function(){
    const outcome=document.getElementById('outcome');
    const field=document.getElementById('finalValueField');
    const req=document.getElementById('finalRequired');
    const hint=document.getElementById('finalHint');
    if(!outcome||!field)return;
    const won=outcome.value==='won';
    if(req)req.style.display=won?'inline':'none';
    if(hint)hint.textContent=won
      ?'Obrigatório quando o resultado for Fechado.'
      :outcome.value==='paused'
        ?'Opcional. A negociação continuará em andamento.'
        :'Opcional para registrar a última referência econômica.';
  };

  window.saveResult=function(){
    const outcomeEl=document.getElementById('outcome');
    const finalEl=document.getElementById('finalValue');
    const learningEl=document.getElementById('learning');
    const outcome=outcomeEl?outcomeEl.value:'';
    const finalValue=finalEl?Number(finalEl.value||0):0;
    const learning=learningEl?learningEl.value.trim():'';

    if(!outcome){
      showToast('Selecione como a negociação terminou.');
      if(outcomeEl)outcomeEl.focus();
      return;
    }
    if(outcome==='won'&&!(finalValue>0)){
      showToast('Informe o valor final para concluir como Fechado.');
      if(finalEl)finalEl.focus();
      return;
    }

    const data=db.get();
    const i=data.negotiations.findIndex(x=>x.id===state.currentId);
    if(i<0)return;
    const n=data.negotiations[i];
    const dir=direction(n);
    const saving=finalValue?Math.max(0,dir==='down'?n.asking-finalValue:finalValue-n.asking):0;

    n.result={finalValue,outcome,learning,saving};
    n.status=outcome==='paused'?'active':'closed';
    n.updatedAt=new Date().toISOString();
    data.negotiations[i]=n;
    db.set(data);

    state.route='history';
    render();
    showToast(outcome==='paused'?'Negociação mantida em andamento.':'Resultado salvo.');
  };

  const prevRenderHistory=window.renderHistory;
  window.renderHistory=function(){
    repairInvalidClosures();
    return prevRenderHistory();
  };
})();
