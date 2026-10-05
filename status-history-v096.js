/* Negocia.AI v0.9.6 - status correto e filtros funcionais no historico */
(function(){
  window.__negociaHistoryFilter = window.__negociaHistoryFilter || 'all';

  function statusMeta(n){
    const outcome=n&&n.result&&n.result.outcome;
    if(outcome==='paused')return{label:'Pausada',cls:'warn'};
    if(n&&n.status==='closed'){
      if(outcome==='lost')return{label:'Sem acordo',cls:'warn'};
      return{label:'Concluída',cls:'good'};
    }
    return{label:'Em andamento',cls:'good'};
  }

  window.negCard=function(n){
    const st=statusMeta(n);
    const finalValue=n&&n.result&&Number(n.result.finalValue||0);
    return `<div class="card" onclick="openNeg('${n.id}')"><span class="pill ${st.cls}">${st.label}</span><h3 style="margin-top:8px">${n.title}</h3><div class="row"><span>Pedido</span><b>${money(n.asking)}</b></div><div class="row"><span>Alvo</span><b>${money(n.target)}</b></div>${n.status==='closed'&&finalValue?`<div class="row"><span>Valor final</span><b>${money(finalValue)}</b></div>`:''}<div class="row"><span>Poder de barganha</span><b>${n.diagnosis?.bargaining||'-'}</b></div></div>`;
  };

  window.setHistoryFilter=function(filter){
    window.__negociaHistoryFilter=filter;
    renderHistory();
  };

  window.renderHistory=function(){
    const data=db.get();
    const filter=window.__negociaHistoryFilter||'all';
    const items=data.negotiations.filter(n=>{
      if(filter==='active')return n.status!=='closed';
      if(filter==='closed')return n.status==='closed';
      return true;
    }).slice().reverse();
    const empty=filter==='active'?'Nenhuma negociação em andamento.':filter==='closed'?'Nenhuma negociação concluída.':'Nenhuma negociação registrada.';
    APP.innerHTML=shell(`<div class="page"><h2>Minhas negociações</h2><div class="tabs"><button class="tab ${filter==='all'?'active':''}" onclick="setHistoryFilter('all')">Todas</button><button class="tab ${filter==='active'?'active':''}" onclick="setHistoryFilter('active')">Em andamento</button><button class="tab ${filter==='closed'?'active':''}" onclick="setHistoryFilter('closed')">Concluídas</button></div>${items.length?items.map(n=>negCard(n)).join(''):`<div class="empty">${empty}</div>`}</div>`);
  };
})();
