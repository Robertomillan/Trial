/* Negocia.AI v0.9.7 - detalhe, linha do tempo, retomada e reabertura */
(function(){
  const prevSendCopilot=window.sendCopilot;
  const prevSaveResult=window.saveResult;

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function clone(v){try{return JSON.parse(JSON.stringify(v))}catch(e){return v}}
  function getById(id){const data=db.get();return data.negotiations.find(n=>n.id===id)||null}
  function fmtDate(v){if(!v)return'';try{return new Date(v).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return''}}
  function statusMeta(n){
    const outcome=n&&n.result&&n.result.outcome;
    if(outcome==='paused')return{label:'Pausada',cls:'warn'};
    if(n&&n.status==='closed'){
      if(outcome==='lost')return{label:'Sem acordo',cls:'warn'};
      return{label:'Concluída',cls:'good'};
    }
    return{label:'Em andamento',cls:'good'};
  }
  function resultLabel(outcome){return{won:'Fechado',lost:'Sem acordo',paused:'Pausado'}[outcome]||'Encerrado'}
  function lastAnalysis(n){const e=(n.events||[]).slice().reverse().find(x=>x.speaker==='counterparty'&&x.analysis);return e&&e.analysis||null}

  function eventToolSummary(e){
    if(!e)return'';
    if(e.speaker==='me'){
      const s=e.structure||{};const bits=[];
      if(s.quantity)bits.push(`${s.quantity} unidade${s.quantity>1?'s':''}`);
      if(s.unitPrice)bits.push(`${money(s.unitPrice)} por unidade`);
      else if(e.offer)bits.push(money(e.offer));
      if(s.total)bits.push(`total ${money(s.total)}`);
      return bits.length?`Posição registrada: ${bits.join(' · ')}.`:'Sua posição foi registrada para comparação com os próximos movimentos.';
    }
    const a=e.analysis;if(!a)return'';const bits=[];
    if(a.label)bits.push(a.label);
    if(a.offer)bits.push(`oferta ${money(a.offer)}`);
    if(a.status)bits.push(a.status);
    if(a.nextMove)bits.push(a.nextMove);
    return bits.join(' · ');
  }

  function reconstructChat(n){
    const out=[];
    for(const e of (n.events||[])){
      if(e.speaker==='system'){
        out.push({role:'tool-counterparty',text:e.text||'Evento da negociação'});
        continue;
      }
      if(e.speaker==='me'){
        out.push({role:'me',text:e.text||''});
        out.push({role:'tool-own',text:eventToolSummary(e)});
      }else if(e.speaker==='counterparty'){
        out.push({role:'counterparty',text:e.text||''});
        out.push({role:'tool-counterparty',text:eventToolSummary(e)||'Fala da contraparte registrada.'});
      }
    }
    return out;
  }

  function persistCurrentChat(){
    if(!state||!state.currentId||!Array.isArray(state.chat))return;
    const data=db.get(),i=data.negotiations.findIndex(x=>x.id===state.currentId);if(i<0)return;
    data.negotiations[i].chat=clone(state.chat);
    data.negotiations[i].updatedAt=new Date().toISOString();
    db.set(data);
  }

  function timelineHTML(n){
    const events=n.events||[];
    const reopeningHistory=Array.isArray(n.resultHistory)?n.resultHistory:[];
    let html='';
    if(!events.length){
      html='<div class="card empty">Ainda não há mensagens registradas nesta negociação.</div>';
    }else{
      html='<div class="timeline-wrap">'+events.map(e=>{
        if(e.speaker==='system')return `<div class="timeline-item system"><div class="timeline-card"><div class="timeline-role">Evento</div><div class="timeline-text">${esc(e.text||'Negociação atualizada')}</div>${e.at?`<div class="timeline-time">${fmtDate(e.at)}</div>`:''}</div></div>`;
        const mine=e.speaker==='me',role=mine?'Você':'Contraparte',summary=eventToolSummary(e);
        const a=e.analysis||null;
        const extra=a&&a.response?`<div style="margin-top:6px"><b>Resposta recomendada:</b> ${esc((typeof toneResponse==='function'?toneResponse(a.response):a.response))}</div>`:'';
        return `<div class="timeline-item ${mine?'me':'counterparty'}"><div class="timeline-card"><div class="timeline-role">${role}</div><div class="timeline-text">${esc(e.text||'')}</div>${e.at?`<div class="timeline-time">${fmtDate(e.at)}</div>`:''}${summary?`<div class="timeline-ai ${mine?'':'counter'}"><b>Negocia.AI:</b> ${esc(summary)}${extra}</div>`:''}</div></div>`;
      }).join('')+'</div>';
    }
    if(reopeningHistory.length){
      html+=`<div class="card"><h3>Encerramentos anteriores</h3>${reopeningHistory.slice().reverse().map((r,i)=>`<div class="row"><span>${esc(resultLabel(r.outcome))}${r.closedAt?` · ${fmtDate(r.closedAt)}`:''}</span><b>${r.finalValue?money(r.finalValue):'-'}</b></div>`).join('')}</div>`;
    }
    return html;
  }

  window.renderNegotiationDetail=function(){
    const n=getById(state.currentId);if(!n){state.route='history';render();return}
    const st=statusMeta(n),r=n.result||null,final=r&&Number(r.finalValue||0),closed=n.status==='closed';
    const resultBox=closed&&r?`<div class="result-banner ${r.outcome==='lost'?'lost':''}"><div class="row"><span>Resultado</span><b>${esc(resultLabel(r.outcome))}</b></div>${final?`<div class="row"><span>Valor final</span><b>${money(final)}</b></div>`:''}${r.saving?`<div class="row"><span>Economia registrada</span><b>${money(r.saving)}</b></div>`:''}${r.learning?`<div style="margin-top:8px"><div class="tiny" style="font-weight:800">Aprendizado</div><div>${esc(r.learning)}</div></div>`:''}</div>`:'';
    APP.innerHTML=shell(`<div class="page"><button class="secondary" style="width:auto;margin-bottom:10px" onclick="state.route='history';render()">← Negociações</button><div class="neg-detail-head"><div><span class="pill ${st.cls}">${st.label}</span><h2>${esc(n.title)}</h2><div class="tiny">${n.createdAt?`Criada em ${fmtDate(n.createdAt)}`:''}</div></div></div><div class="neg-summary-grid"><div class="neg-summary-item"><span>Pedido</span><b>${money(n.asking)}</b></div><div class="neg-summary-item"><span>Alvo</span><b>${money(n.target)}</b></div><div class="neg-summary-item"><span>Limite</span><b>${money(n.limit)}</b></div><div class="neg-summary-item"><span>Poder de barganha</span><b>${esc(n.diagnosis?.bargaining||'-')}</b></div></div>${resultBox}<div class="section-head"><h2>Tratativa passo a passo</h2><small>${(n.events||[]).length}</small></div>${timelineHTML(n)}<div class="detail-actions">${closed?`<button class="primary" onclick="reopenNegotiation('${n.id}')">Reiniciar de onde paramos</button>`:`<button class="primary" onclick="resumeNegotiation('${n.id}')">Retomar o processo</button>`}<button class="secondary" onclick="state.route='history';render()">Voltar para negociações</button></div></div>`);
  };

  window.openNeg=function(id){state.currentId=id;state.route='history';renderNegotiationDetail()};

  window.resumeNegotiation=function(id){
    const n=getById(id);if(!n)return;
    state.currentId=id;
    state.chat=Array.isArray(n.chat)&&n.chat.length?clone(n.chat):reconstructChat(n);
    state.lastAnalysis=lastAnalysis(n);
    state.speaker='counterparty';
    state.route='copilot';
    render();
  };

  window.reopenNegotiation=function(id){
    const data=db.get(),i=data.negotiations.findIndex(x=>x.id===id);if(i<0)return;
    const n=data.negotiations[i];
    if(n.result){
      n.resultHistory=Array.isArray(n.resultHistory)?n.resultHistory:[];
      n.resultHistory.push({...n.result,closedAt:new Date().toISOString()});
    }
    n.result=null;n.status='active';n.reopenedAt=new Date().toISOString();n.updatedAt=n.reopenedAt;
    n.events=Array.isArray(n.events)?n.events:[];
    n.events.push({at:n.reopenedAt,speaker:'system',kind:'reopened',text:'Negociação reaberta a partir do ponto em que havia sido encerrada.'});
    data.negotiations[i]=n;db.set(data);
    state.currentId=id;
    state.chat=Array.isArray(n.chat)&&n.chat.length?clone(n.chat):reconstructChat(n);
    state.chat.push({role:'tool-counterparty',text:'Negociação reaberta. O histórico anterior foi preservado e você pode continuar de onde parou.'});
    state.lastAnalysis=lastAnalysis(n);state.speaker='counterparty';state.route='copilot';
    persistCurrentChat();render();
  };

  window.sendCopilot=function(){
    prevSendCopilot();
    persistCurrentChat();
  };

  window.saveResult=function(){
    persistCurrentChat();
    prevSaveResult();
  };
})();
