/* Negocia.AI v0.9.5 - Procurement de materiais, Incoterms, MOQ, lead time, moeda, frete e pagamento */
(function(){
  const prevBuildAnalysis=window.buildAnalysis;
  const prevAnalysisHTML=window.analysisHTML;
  const prevToneResponse=window.toneResponse;

  const INCOTERMS={
    EXW:{name:'EXW',label:'Ex Works',cost:'Fornecedor disponibiliza a mercadoria no local nomeado; transporte principal, exportação e importação tendem a ficar com o comprador.',risk:'Risco passa muito cedo ao comprador, no ponto de disponibilização.'},
    FCA:{name:'FCA',label:'Free Carrier',cost:'Fornecedor entrega ao transportador no local nomeado e normalmente cuida da liberação de exportação; transporte principal tende a ficar com o comprador.',risk:'Risco passa na entrega ao transportador/local FCA.'},
    FAS:{name:'FAS',label:'Free Alongside Ship',cost:'Fornecedor entrega a mercadoria ao lado do navio no porto de embarque; carregamento e transporte marítimo principal ficam com o comprador.',risk:'Risco passa quando a carga é colocada ao lado do navio.'},
    FOB:{name:'FOB',label:'Free On Board',cost:'Fornecedor coloca a carga a bordo no porto de embarque e libera exportação; frete marítimo principal e seguro tendem a ficar com o comprador.',risk:'Risco passa quando a mercadoria está a bordo no porto de origem.'},
    CFR:{name:'CFR',label:'Cost and Freight',cost:'Fornecedor paga o frete marítimo até o porto de destino; seguro e importação não estão automaticamente incluídos.',risk:'Apesar do frete pago até o destino, o risco passa a bordo no porto de origem.'},
    CIF:{name:'CIF',label:'Cost, Insurance and Freight',cost:'Fornecedor paga frete marítimo e providencia seguro até o porto de destino; importação e despesas posteriores precisam ser confirmadas.',risk:'O risco passa a bordo no porto de origem, mesmo com frete e seguro contratados pelo fornecedor.'},
    CPT:{name:'CPT',label:'Carriage Paid To',cost:'Fornecedor paga o transporte até o destino nomeado; seguro não está automaticamente incluído.',risk:'Risco passa quando a mercadoria é entregue ao primeiro transportador.'},
    CIP:{name:'CIP',label:'Carriage and Insurance Paid To',cost:'Fornecedor paga transporte e providencia seguro até o destino nomeado.',risk:'Risco passa quando a mercadoria é entregue ao primeiro transportador.'},
    DAP:{name:'DAP',label:'Delivered at Place',cost:'Fornecedor leva a mercadoria até o local de destino, pronta para descarga; importação, tributos e descarga precisam ser verificados.',risk:'Risco permanece com o fornecedor até o local de destino, antes da descarga.'},
    DPU:{name:'DPU',label:'Delivered at Place Unloaded',cost:'Fornecedor entrega e descarrega no local nomeado; importação e tributos precisam ser confirmados.',risk:'Risco permanece com o fornecedor até a mercadoria ser descarregada no destino.'},
    DDP:{name:'DDP',label:'Delivered Duty Paid',cost:'Fornecedor assume uma estrutura logística ampla até o destino, inclusive importação e tributos em princípio; confirme viabilidade fiscal e exatamente o que está incluído.',risk:'Risco permanece com o fornecedor até o local de destino acordado, antes da descarga.'}
  };

  function text(v){return String(v||'')}
  function low(v){return text(v).toLowerCase()}
  function esc(s){return text(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function brl(v){try{return typeof money==='function'?money(v):new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v||0))}catch(e){return `R$ ${Number(v||0).toLocaleString('pt-BR')}`}}

  function parseNum(raw){
    let s=text(raw).trim().toLowerCase(),mult=1;
    if(/\b(?:mil|k)\b/.test(s))mult=1e3;
    if(/\b(?:mi|milh[aã]o|milh[oõ]es|million|millions)\b/.test(s))mult=1e6;
    s=s.replace(/\b(?:mil|k|mi|milh[aã]o|milh[oõ]es|million|millions)\b/g,'').trim();
    if(s.includes('.')&&s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    else if(s.includes(',')){
      const p=s.split(',');s=(p.length===2&&p[1].length<=2)?p[0].replace(/\./g,'')+'.'+p[1]:s.replace(/,/g,'');
    }else if((s.match(/\./g)||[]).length>1||/\.\d{3}$/.test(s))s=s.replace(/\./g,'');
    const n=Number(s.replace(/[^\d.-]/g,''));return Number.isFinite(n)?n*mult:null;
  }

  function currencyOffers(t){
    const src=text(t),re=/(USD|US\$|EUR|BRL|R\$|GBP|CNY|RMB|CHF|JPY|\$|€|£|¥)\s*([\d.]+(?:,\d{1,2})?|\d+(?:,\d+)?)\s*(milh[oõ]es|milh[aã]o|millions?|mil|mi|k)?/gi;
    const out=[];let m;
    const code=x=>({US$:'USD','$':'USD','€':'EUR','£':'GBP','¥':'CNY','R$':'BRL',RMB:'CNY'}[x.toUpperCase()]||x.toUpperCase());
    while((m=re.exec(src))!==null){const amount=parseNum(`${m[2]} ${m[3]||''}`);if(amount)out.push({currency:code(m[1]),amount,index:m.index,end:re.lastIndex,raw:m[0]})}
    return out;
  }

  function incotermMentions(t){
    const src=text(t),re=/\b(EXW|FCA|FAS|FOB|CFR|CIF|CPT|CIP|DAP|DPU|DDP)\b/gi,out=[];let m;
    while((m=re.exec(src))!==null){
      const term=m[1].toUpperCase();
      let tail=src.slice(re.lastIndex,re.lastIndex+55);
      tail=tail.split(/\s+\bou\b\s+|[;|]/i)[0];
      tail=tail.replace(/^[\s,:-]+/,'').replace(/\s+(?:por|a|em)\s+(?:USD|US\$|EUR|BRL|R\$|GBP|CNY|RMB|CHF|JPY|\$|€|£|¥).*$/i,'').trim();
      const place=tail.replace(/[.,].*$/,'').trim().slice(0,38)||null;
      out.push({term,index:m.index,end:re.lastIndex,place,meta:INCOTERMS[term]});
    }
    return out;
  }

  function nearestOffer(mention,offers){
    if(!offers.length)return null;
    return offers.slice().sort((a,b)=>Math.min(Math.abs(a.index-mention.end),Math.abs(a.end-mention.index))-Math.min(Math.abs(b.index-mention.end),Math.abs(b.end-mention.index)))[0];
  }

  function incotermOptions(t){
    const offers=currencyOffers(t),mentions=incotermMentions(t);
    return mentions.map(m=>{const o=nearestOffer(m,offers);return {...m,offer:o?{currency:o.currency,amount:o.amount,raw:o.raw}:null}});
  }

  function moqInfo(t){
    const s=text(t);
    const pats=[/\bMOQ\s*[:=]?\s*(\d[\d.]*)\s*(unidades?|unid\.?|pe[cç]as?|itens?|kg|ton(?:eladas?)?|m\b|m2\b|m²\b)?/i,/\b(?:lote\s+m[ií]nimo|quantidade\s+m[ií]nima|m[ií]nimo\s+de)\s*(\d[\d.]*)\s*(unidades?|unid\.?|pe[cç]as?|itens?|kg|ton(?:eladas?)?|m\b|m2\b|m²\b)?/i];
    for(const re of pats){const m=s.match(re);if(m)return{quantity:Number(m[1].replace(/\./g,'')),unit:m[2]||'unidades'}}return null;
  }

  function leadTimeInfo(t){
    const s=text(t);
    const m=s.match(/\b(?:lead\s*time|prazo\s+de\s+entrega|entrega)\s*(?:de|em|:)?\s*(\d{1,3})\s*(dias?|semanas?|meses?)\b/i);
    if(!m)return null;
    const q=Number(m[1]),u=m[2].toLowerCase();
    const days=/semana/.test(u)?q*7:/mes/.test(u)?q*30:q;
    return{quantity:q,unit:u,days,label:`${q} ${u}`};
  }

  function freightInfo(t){
    const s=low(t),offers=currencyOffers(t);
    let status=null;
    if(/frete\s+(?:incluso|inclu[ií]do)|inclui\s+frete/.test(s))status='incluído';
    else if(/frete\s+(?:n[aã]o\s+incluso|n[aã]o\s+inclu[ií]do|por\s+conta\s+do\s+comprador)/.test(s))status='comprador';
    else if(/frete\s+por\s+conta\s+do\s+(?:fornecedor|vendedor)/.test(s))status='fornecedor';
    const fm=text(t).match(/frete[^.;,]{0,25}(USD|US\$|EUR|BRL|R\$|GBP|CNY|RMB|CHF|JPY|\$|€|£|¥)\s*([\d.,]+)\s*(mil|k|mi|milh[aã]o|milh[oõ]es)?/i);
    let value=null;
    if(fm){const all=currencyOffers(fm[0]);value=all[0]||null}
    return(status||value)?{status,value}:null;
  }

  function paymentMaterialInfo(t){
    const s=text(t),l=low(t),parts=[];
    const p306090=s.match(/\b(\d{1,3})\s*\/\s*(\d{1,3})(?:\s*\/\s*(\d{1,3}))?\s*dias?\b/i);if(p306090)parts.push(`${p306090.slice(1).filter(Boolean).join('/')} dias`);
    const advance=s.match(/(\d{1,3})\s*%\s*(?:antecipad[oa]|adiantad[oa]|de\s+entrada)/i);if(advance)parts.push(`${advance[1]}% antecipado`);
    if(/carta\s+de\s+cr[eé]dito|letter\s+of\s+credit|\bL\/?C\b/i.test(s))parts.push('Carta de crédito');
    if(/\bT\/?T\b|telegraphic\s+transfer/i.test(s))parts.push('T/T');
    if(/cash\s+against\s+documents|\bCAD\b/i.test(s))parts.push('CAD');
    if(/open\s+account|conta\s+aberta/i.test(s))parts.push('Open account');
    return parts.length?{terms:Array.from(new Set(parts))}:null;
  }

  function materialContext(t,n){
    const incoterms=incotermOptions(t),offers=currencyOffers(t),moq=moqInfo(t),leadTime=leadTimeInfo(t),freight=freightInfo(t),payment=paymentMaterialInfo(t);
    const currencies=Array.from(new Set(offers.map(o=>o.currency)));
    const isMaterial=incoterms.length||moq||leadTime||freight||payment||/(material|insumo|pe[cç]a|equipamento|importa[cç][aã]o|embarque|porto|container|aduana|desembara[cç]o)/i.test(text(t));
    return{isMaterial,incoterms,offers,currencies,moq,leadTime,freight,payment};
  }

  function logisticsInsight(m){
    if(!m.incoterms.length)return null;
    if(m.incoterms.length>1){
      const terms=Array.from(new Set(m.incoterms.map(x=>x.term)));
      const currencies=m.currencies;
      return `Há propostas em ${terms.join(' x ')}. Incoterms diferentes não são comparáveis apenas pelo preço do material. ${currencies.length>1?'As propostas também usam moedas diferentes; normalize o câmbio antes de comparar.':'Monte o landed cost/TCO de cada alternativa antes de decidir.'}`;
    }
    const x=m.incoterms[0];return `${x.term} ${x.place||''}`.trim()+`: ${x.meta.cost} ${x.meta.risk}`;
  }

  function applyIncotermAnalysis(a,m,n){
    if(!m.incoterms.length)return a;
    const multi=m.incoterms.length>1;
    a.material=m;
    if(a.type!=='acceptance')a.type='incoterm';
    a.label=multi?'Incoterm / comparação logística':'Incoterm / responsabilidade logística';
    a.intent=multi?'As alternativas usam estruturas logísticas diferentes. O preço nominal não representa sozinho o custo econômico total.':'O Incoterm altera custo, responsabilidade operacional e momento de transferência de risco.';
    a.lever='Negocie preço do material e responsabilidade logística como um pacote. Peça local nomeado, versão do Incoterm e abertura dos componentes que não estão incluídos.';
    a.args=[
      logisticsInsight(m),
      'Compare landed cost/TCO: material + frete + seguro + despesas de origem/destino + desembaraço + tributos + transporte interno + impacto financeiro.',
      'Confirme o local nomeado do Incoterm e quais despesas acessórias estão efetivamente incluídas na proposta.'
    ].filter(Boolean);
    a.questions=[
      'Qual é o Incoterm completo com o local nomeado e a referência contratual aplicável?',
      'Quais custos de frete, seguro, origem, destino, desembaraço, tributos e transporte local estão incluídos ou excluídos?',
      'Qual é o MOQ, lead time e condição de pagamento para essa alternativa?'
    ];
    a.concession='Se você assumir mais responsabilidade logística ou maior volume, trate isso como concessão econômica e peça contrapartida em preço ou condição.';
    a.dont='Não compare propostas com Incoterms diferentes apenas pelo preço unitário ou total da mercadoria.';
    a.nextMove=logisticsInsight(m)+' Solicite os componentes faltantes e normalize as propostas em landed cost antes de mover preço.';
    const opts=m.incoterms.map(x=>`${x.term}${x.place?' '+x.place:''}${x.offer?` a ${x.offer.currency} ${x.offer.amount.toLocaleString('pt-BR')}`:''}`).join(' versus ');
    a.response=`Para comparar corretamente ${opts}, preciso colocar as propostas na mesma base de landed cost. Por favor, confirme para cada alternativa o Incoterm com local nomeado e o que está incluído em frete, seguro, despesas locais, desembaraço, tributos e entrega final.`;
    return a;
  }

  window.buildAnalysis=function(t,n){
    const a=prevBuildAnalysis(t,n),m=materialContext(t,n);a.material=m;
    if(m.incoterms.length)a && applyIncotermAnalysis(a,m,n);
    else if(m.isMaterial&&a.type!=='acceptance'){
      if(m.moq&&a.type==='quantity'){
        a.label='MOQ / quantidade mínima';
        a.nextMove=`MOQ identificado: ${m.moq.quantity} ${m.moq.unit}. Compare necessidade real, estoque, capital empatado e preço unitário antes de aceitar o lote mínimo.`;
      }
      if(m.leadTime&&a.type==='time'){
        a.label='Lead time / entrega';
        a.nextMove=`Lead time identificado: ${m.leadTime.label}. Valide impacto em estoque, risco de ruptura e necessidade de expedição antes de trocar prazo por preço.`;
      }
    }
    return a;
  };

  function materialCard(a){
    const m=a&&a.material;if(!m||!m.isMaterial)return'';
    let rows=[];
    if(m.incoterms.length){
      rows.push(`<div class="row"><span>Incoterm(s)</span><b>${esc(m.incoterms.map(x=>x.term+(x.place?' '+x.place:'')).join(' · '))}</b></div>`);
    }
    if(m.currencies.length)rows.push(`<div class="row"><span>Moeda(s)</span><b>${esc(m.currencies.join(' · '))}</b></div>`);
    if(m.moq)rows.push(`<div class="row"><span>MOQ / lote mínimo</span><b>${m.moq.quantity} ${esc(m.moq.unit)}</b></div>`);
    if(m.leadTime)rows.push(`<div class="row"><span>Lead time</span><b>${esc(m.leadTime.label)}</b></div>`);
    if(m.freight)rows.push(`<div class="row"><span>Frete</span><b>${esc(m.freight.value?`${m.freight.value.currency} ${m.freight.value.amount.toLocaleString('pt-BR')}`:m.freight.status)}</b></div>`);
    if(m.payment)rows.push(`<div class="row"><span>Pagamento</span><b>${esc(m.payment.terms.join(' · '))}</b></div>`);
    const inc=m.incoterms.map(x=>`<div class="argument"><div class="arghead"><b>${x.term} · ${esc(x.meta.label)}</b>${x.offer?`<span class="pill good">${x.offer.currency} ${x.offer.amount.toLocaleString('pt-BR')}</span>`:''}</div><p>${esc(x.meta.cost)} ${esc(x.meta.risk)}</p></div>`).join('');
    return `<div class="card teal"><h3>Estrutura de Procurement / logística</h3>${rows.join('')}${inc}<p class="tiny">Leitura de apoio para negociação. Valide Incoterm, local nomeado, contrato, regime aduaneiro e tratamento tributário aplicável antes do fechamento.</p></div>`;
  }

  window.analysisHTML=function(a){return materialCard(a)+(prevAnalysisHTML?prevAnalysisHTML(a):'')};

  window.toneResponse=function(original){
    const a=state&&state.lastAnalysis;
    if(a&&a.type==='incoterm'&&a.material&&a.material.incoterms.length){
      const opts=a.material.incoterms.map(x=>`${x.term}${x.place?' '+x.place:''}`).join(' versus ');
      if(state.tone==='colaborativo')return `Para fazermos uma comparação justa entre ${opts}, gostaria de colocar as alternativas na mesma base de landed cost. Você consegue me confirmar, em cada opção, o local nomeado e o que está incluído em frete, seguro, despesas locais, desembaraço, tributos e entrega final?`;
      if(state.tone==='firme')return `Não vou comparar ${opts} apenas pelo preço da mercadoria. Preciso da composição de landed cost de cada opção, incluindo local nomeado, frete, seguro, despesas locais, desembaraço, tributos e entrega final. Com a mesma base econômica, avançamos na negociação.`;
      return `As propostas em ${opts} não estão na mesma base econômica. Antes de mover preço, preciso normalizar o landed cost. Confirme para cada alternativa o local nomeado e os custos incluídos ou excluídos em frete, seguro, despesas locais, desembaraço, tributos e entrega final.`;
    }
    return prevToneResponse?prevToneResponse(original):original;
  };
})();
