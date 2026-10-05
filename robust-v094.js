/* Negocia.AI v0.9.4 - robustez semantica, percentuais, pacote salarial e comparacao de propostas */
(function(){
  const prevBuildAnalysis=window.buildAnalysis;
  const prevAnalysisHTML=window.analysisHTML;
  const prevToneResponse=window.toneResponse;

  function textOf(v){return String(v||'')}
  function lower(v){return textOf(v).toLowerCase()}
  function brl(v){try{return typeof money==='function'?money(v):new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v||0))}catch(e){return `R$ ${Number(v||0).toLocaleString('pt-BR')}`}}
  function percentV4(text){const m=textOf(text).match(/(-?\d+(?:[.,]\d+)?)\s*%/);return m?Number(m[1].replace(',','.')):null}

  function qtyFromTextV4(text){
    const t=lower(text);
    const patterns=[
      /\b(\d{1,3})\s*(?:unidades?|unid\.?|unds?\.?|pe[cç]as?|pcs?\.?|itens?|equipamentos?|notebooks?|computadores?|carros?|ve[ií]culos?|licen[cç]as?)\b/i,
      /\b(?:comprar|compro|compraria|levar|levo|levaria|fechar|fecho|fecharia|quero|preciso de|seriam?|s[aã]o)\s+(?:s[oó]\s+|apenas\s+)?(\d{1,3})(?!\s*%)(?:\s|$)/i,
      /\b(?:tem que|precisa|deve)\s+(?:comprar|levar|fechar)\s+(\d{1,3})(?!\s*%)/i,
      /\b(?:m[ií]nimo|minimo|volume|quantidade)\s*(?:de|:)?\s*(\d{1,3})\s*(?:unidades?|unid\.?|unds?\.?|pe[cç]as?|itens?|equipamentos?|notebooks?|computadores?|carros?|ve[ií]culos?|licen[cç]as?)\b/i,
      /\b(?:fechado|aceito|combinado|pode ser|ok)[^\d]{0,24}(\d{1,3})\s*(?:unidades?|unid\.?|carros?|ve[ií]culos?|por\b)/i,
      /\b(\d{1,3})\s+por\s+(?:r\$\s*)?\d/i
    ];
    for(const re of patterns){
      const m=t.match(re);if(!m)continue;
      const q=Number(m[1]);if(!(q>=1&&q<=999))continue;
      const pos=m.index+(m[0].indexOf(m[1]));
      const after=t.slice(pos+m[1].length,pos+m[1].length+12);
      if(/^\s*(?:%|anos?\b|meses?\b|dias?\b|x\b)/i.test(after))continue;
      return q;
    }
    return null;
  }

  function acceptanceSignalV4(text){return /\bfechado\b|\baceito\b|\bcombinado\b|\bpode ser\b|\bneg[oó]cio fechado\b|\bde acordo\b|\bok\b/i.test(lower(text))}
  function quantityConditionV4(text){return /por esse valor|nesse valor|neste valor|tem que comprar|precisa comprar|para esse pre[cç]o|volume de\s+\d+\s*(?:unidades?|itens?|carros?|ve[ií]culos?)|m[ií]nimo de\s+\d+\s*(?:unidades?|itens?|carros?|ve[ií]culos?)/i.test(lower(text))}
  function perUnitSignalV4(text){return /\bcada\b|por\s+unidade|unit[aá]ri[oa]|\/\s*(?:un|und|unid)|cada\s+um/i.test(lower(text))}

  function moneyMatchesV4(text,n){
    const re=/R\$\s*\d[\d.\s]*(?:,\d{1,2})?\s*(?:mil|k|mi|milh[aã]o|milh[oõ]es)?|\b\d+(?:[.,]\d+)?\s*(?:mil|k|mi|milh[aã]o|milh[oõ]es)\b|\b\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?\b|\b\d{4,}(?:[.,]\d+)?\b/gi;
    const raw=[];let m;
    while((m=re.exec(textOf(text)))!==null){
      const value=typeof parseMoneyToken==='function'?parseMoneyToken(m[0]):null;
      if(value&&value>100)raw.push({raw:m[0],value,index:m.index,end:m.index+m[0].length});
    }
    if(!n||!raw.length)return raw;
    const refs=[Number(n.asking)||0,Number(n.target)||0,Number(n.limit)||0].filter(Boolean);
    if(!refs.length)return raw;
    const ref=refs.reduce((a,b)=>a+b,0)/refs.length;
    const compatible=raw.filter(x=>x.value>=ref*.12&&x.value<=ref*8);
    return compatible.length?compatible:raw;
  }

  function lastEventV4(n,speaker){return (n.events||[]).slice().reverse().find(e=>e.speaker===speaker)||null}
  function eventStructureV4(e,n){if(!e)return null;return robustStructureV4(e.text||'',n,e.speaker||'counterparty',false)}
  function lastCounterOfferV4(n){
    const ev=(n.events||[]).slice().reverse().find(e=>e.speaker==='counterparty'&&e.text);
    if(!ev)return null;
    const ms=moneyMatchesV4(ev.text,n);return ms.length?ms[ms.length-1].value:null;
  }

  function robustStructureV4(text,n,speaker='counterparty',withHistory=true){
    let quantity=qtyFromTextV4(text);
    const matches=moneyMatchesV4(text,n);
    let unitPrice=matches.length?matches[matches.length-1].value:null;
    const own=withHistory?eventStructureV4(lastEventV4(n,'me'),n):null;
    const prevCp=withHistory?eventStructureV4(lastEventV4(n,'counterparty'),n):null;
    if(!unitPrice&&quantity&&quantityConditionV4(text)&&withHistory)unitPrice=lastCounterOfferV4(n);
    if(!quantity&&perUnitSignalV4(text)&&own&&own.quantity)quantity=own.quantity;
    if(!quantity&&acceptanceSignalV4(text)&&own&&own.quantity)quantity=own.quantity;
    const total=quantity&&unitPrice?quantity*unitPrice:null;
    return {quantity,unitPrice,total,targetTotal:quantity?quantity*Number(n.target||0):null,limitTotal:quantity?quantity*Number(n.limit||0):null,text:textOf(text),speaker,own,prevCp,percent:percentV4(text)};
  }

  function optionPVV4(amount,segment){
    const s=lower(segment);const annual=.15;
    if(/\b[aà]\s*vista\b/.test(s))return {pv:amount,label:'à vista',days:0};
    const xm=s.match(/\b(\d{1,2})\s*x\b/);
    if(xm){
      const k=Math.max(1,Math.min(48,Number(xm[1]))),pmt=amount/k;
      let pv=0;for(let i=1;i<=k;i++)pv+=pmt/Math.pow(1+annual,(i*30)/365);
      return {pv,label:`${k}x`,installments:k};
    }
    const dm=s.match(/\b(?:em\s*)?(\d{1,3})\s*dias?\b/);
    if(dm){const d=Number(dm[1]);return {pv:amount/Math.pow(1+annual,d/365),label:`${d} dias`,days:d}}
    return {pv:amount,label:'condição não informada'};
  }

  function comparisonV4(text,n){
    const ms=moneyMatchesV4(text,n);if(ms.length<2)return null;
    const t=textOf(text);
    if(!/(?:\bou\b|\bversus\b|\bvs\.?\b|\b[aà]\s*vista\b|\b\d+\s*x\b|\b\d+\s*dias?\b)/i.test(t))return null;
    const options=ms.slice(0,4).map((m,i)=>{
      const next=ms[i+1]?ms[i+1].index:t.length;
      const start=Math.max(0,m.index-18),segment=t.slice(start,next);
      const pv=optionPVV4(m.value,segment);
      return {amount:m.value,raw:m.raw,segment,label:pv.label,pv:pv.pv,days:pv.days||null,installments:pv.installments||null};
    });
    const dir=typeof direction==='function'?direction(n):'down';
    const ranked=options.slice().sort((a,b)=>dir==='down'?a.pv-b.pv:b.pv-a.pv);
    return {options,best:ranked[0],second:ranked[1],difference:ranked[1]?Math.abs(ranked[1].pv-ranked[0].pv):0,direction:dir,annualRate:.15};
  }

  function classifyV4(text,n,base,structure,comparison){
    const t=lower(text);
    if(acceptanceSignalV4(t)&&matchesOwnConditionV4(structure,n))return'acceptance';
    if(structure.quantity&&quantityConditionV4(t))return'quantity';
    if(n&&n.type==='salary'&&/b[oô]nus|bonus|benef[ií]cios?|plr|vari[aá]vel|stock|a[cç][oõ]es|t[ií]tulo|cargo|carro|vale|aux[ií]lio/.test(t))return'package';
    if(/escopo|garantia|frete|entrega|sla|qualidade|inclui|incluso|n[aã]o inclui|sem garantia|sem frete|sem entrega/.test(t))return'scope';
    if(comparison||/condi[cç][aã]o de pagamento|pagamento|parcel|\b[aà]\s*vista\b|entrada|prazo de pagamento|\b\d+\s*x\b/.test(t))return'payment';
    if(/chefe|diretor|ger[eê]ncia|aprova[cç][aã]o|aprovar|al[cç]ada|s[oó]cio|comit[eê]/.test(t))return'authority';
    if(/concorr|outro fornecedor|outra proposta|mercado|benchmark/.test(t))return'competition';
    if(/reajuste|\b\d+(?:[.,]\d+)?\s*%/.test(t))return'price';
    if(/caro|pre[cç]o|valor|abaixar|desconto|or[cç]amento|budget|n[aã]o consigo|n[aã]o d[aá]|menos de|abaixo de|acima de|m[aá]ximo/.test(t))return'price';
    if(/prazo|tempo|hoje|amanh[aã]|urgente|demora|preciso fechar/.test(t))return'time';
    return base&&base.type?base.type:'resistance';
  }

  function matchesOwnConditionV4(struct,n){
    const own=struct&&struct.own;if(!own)return false;
    const dir=typeof direction==='function'?direction(n):'down';
    const qOk=!own.quantity||!struct.quantity||own.quantity===struct.quantity;
    let pOk=true;if(own.unitPrice&&struct.unitPrice)pOk=dir==='down'?struct.unitPrice<=own.unitPrice:struct.unitPrice>=own.unitPrice;
    return qOk&&pOk&&(!!own.quantity||!!own.unitPrice);
  }

  function quantityInsightV4(s,n){
    if(!s||!s.quantity)return'';const dir=direction(n),bits=[];
    if(s.unitPrice&&s.total)bits.push(`${s.quantity} un. x ${brl(s.unitPrice)} = ${brl(s.total)} no total.`);
    if(s.targetTotal&&s.total){const diff=s.total-s.targetTotal;if(dir==='down')bits.push(diff<=0?`O total fica ${brl(Math.abs(diff))} melhor que o alvo equivalente.`:`O total fica ${brl(diff)} acima do alvo equivalente.`);else bits.push(diff>=0?`O total supera o alvo equivalente em ${brl(diff)}.`:`O total fica ${brl(Math.abs(diff))} abaixo do alvo equivalente.`)}
    if(quantityConditionV4(s.text))bits.push('Quantidade virou moeda de troca. Compare necessidade real, preço unitário e desembolso total.');
    return bits.join(' ');
  }

  function applyTypeV4(a,type,text,n,s,comparison){
    a.type=type;a.structure=s;a.comparison=comparison;a.quantityInsight=quantityInsightV4(s,n);a.percent=s.percent;
    if(type==='acceptance'){
      const q=s.quantity||(s.own&&s.own.quantity),p=s.unitPrice||(s.own&&s.own.unitPrice),tot=q&&p?q*p:null;
      a.label='Aceite da sua condição';a.intent='A contraparte aceitou a estrutura econômica comunicada. O foco agora é fechar e proteger as condições.';a.status='Condição atendida';
      a.lever='Não reabra preço. Elimine ambiguidades de especificação, frete, impostos, pagamento, garantia e entrega.';
      a.args=['A condição econômica foi atendida.','Confirme quantidade, preço unitário e total por escrito.','Feche os termos acessórios antes da emissão do pedido.'];
      a.questions=['Só confirmando: preço, quantidade e escopo permanecem exatamente como combinados?','Qual é o prazo de entrega, condição de pagamento e garantia aplicável?'];
      a.concession='Nenhuma concessão adicional é necessária no preço.';a.dont='Não reabra a barganha depois de obter a condição que você pediu.';
      a.next=p||a.next;a.nextMove=`Pare de negociar preço. Confirme${q?` ${q} unidade${q>1?'s':''}`:''}${p?` a ${brl(p)} por unidade`:''}${tot?`, total de ${brl(tot)}`:''} e valide as demais condições comerciais.`;
      a.response=`Perfeito. Então fechamos${q?` ${q} unidade${q>1?'s':''}`:''}${p?` a ${brl(p)} cada`:''}${tot?`, total de ${brl(tot)}`:''}. Só preciso confirmar especificação, frete, impostos, pagamento, garantia e prazo de entrega.`;
    }else if(type==='quantity'){
      a.label='Quantidade / volume';a.intent='A contraparte está usando volume como condição de preço. O desconto unitário pode piorar o desembolso total.';
      a.lever='Quantidade é uma concessão econômica. Só aumente volume se houver necessidade real ou compensação suficiente.';
      a.args=[a.quantityInsight||'Calcule preço unitário e total antes de aceitar volume.','Compare o volume exigido com a necessidade real.','Se aumentar quantidade, exija melhora proporcional em preço ou condição.'];
      a.questions=['Qual é o melhor preço para a quantidade que eu realmente preciso?','Se eu aumentar o volume, qual redução adicional por unidade você consegue conceder?'];
      a.concession='Não aumente quantidade apenas para preservar preço unitário.';a.dont='Não trate desconto unitário como saving se o desembolso total ou o estoque desnecessário aumentarem.';
      a.nextMove=`${a.quantityInsight} Negocie quantidade, preço unitário e total como um pacote.`;
    }else if(type==='package'){
      a.label='Pacote de remuneração';a.intent='A contraparte está trocando salário fixo por outros componentes do pacote. A decisão deve considerar valor total e qualidade de cada componente.';
      a.lever='Separe salário fixo, variável, bônus, benefícios, título e revisão futura. Nem todos têm o mesmo valor, risco ou liquidez.';
      a.args=['Não compare apenas salário nominal.','Dê peso diferente a fixo garantido e variável condicionado.','Use revisão futura, bônus, benefícios e título como moedas separadas.'];
      a.questions=['Qual é o valor-alvo do pacote total e quanto dele é fixo garantido?','Bônus e variável têm meta, teto e histórico de pagamento?','Existe revisão salarial formal em 6 ou 12 meses?'];
      a.concession='Só flexibilize salário fixo se receber valor equivalente e mensurável em outro componente.';a.dont='Não trate bônus incerto como equivalente a salário fixo garantido.';
      a.nextMove='Monte o pacote em componentes e compare valor esperado, risco e recorrência antes de aceitar.';
      a.response='Quero comparar o pacote completo, não apenas o salário fixo. Preciso separar fixo garantido, variável, bônus, benefícios e eventual revisão futura para avaliar equivalência real.';
    }else if(type==='scope'){
      a.label='Escopo / condições de entrega';a.intent='A objeção principal está no que está ou não incluído, e não apenas no preço nominal.';
      a.lever='Conecte preço a escopo, garantia, frete, prazo, SLA e risco. Qualquer redução de entrega deve aparecer no valor econômico.';
      a.args=['Compare propostas em escopo equivalente.','Quantifique itens excluídos antes de aceitar preço menor.','Troque redução de escopo por redução proporcional de preço ou outra compensação.'];
      a.questions=['O que exatamente está excluído desse preço?','Qual o impacto econômico de incluir garantia, frete e entrega?','Mantendo o preço, o que vocês conseguem incluir?'];
      a.concession='Não conceda preço mantendo risco maior ou escopo menor sem compensação.';a.dont='Não compare preços de propostas com escopos diferentes como se fossem equivalentes.';
      a.nextMove='Reabra a comparação pelo TCO e pelo escopo equivalente antes de mover preço.';
    }else if(type==='payment'&&comparison){
      const b=comparison.best,s2=comparison.second;
      a.label='Comparação de condições financeiras';a.intent='Há mais de uma alternativa econômica na mesma proposta. O valor nominal sozinho não mostra qual é melhor.';
      a.lever='Compare as alternativas pelo valor presente e depois considere liquidez, risco e necessidade de caixa.';
      a.args=comparison.options.map((o,i)=>`Opção ${i+1}: ${brl(o.amount)} - ${o.label} - valor presente aproximado ${brl(o.pv)}.`);
      a.questions=['Essas alternativas têm exatamente o mesmo escopo, garantia e prazo de entrega?','Existe desconto adicional para a opção de menor prazo financeiro?'];
      a.concession='Escolha a condição pelo custo econômico total, não por percepção de parcela ou prazo.';a.dont='Não compare apenas os valores nominais quando os fluxos de pagamento são diferentes.';
      a.nextMove=`Pela taxa de referência de 15% a.a., a melhor alternativa econômica é ${brl(b.amount)} (${b.label}), com vantagem aproximada de ${brl(comparison.difference)} em valor presente sobre a próxima opção.`;
      a.response=`Tenho duas estruturas diferentes. Pelo valor presente, ${brl(b.amount)} em ${b.label} é economicamente melhor. Antes de decidir, quero confirmar se escopo, garantia e entrega são idênticos nas duas opções.`;
    }else if(type==='price'&&s.percent!=null){
      a.label='Reajuste / percentual';a.intent='A contraparte está propondo uma variação percentual. Isso deve ser tratado como preço ou reajuste, nunca como quantidade.';
      a.lever='Quebre o percentual em drivers de custo, produtividade, índice e contrapartidas.';
      a.args=[`Percentual identificado: ${String(s.percent).replace('.',',')}%.`,'Peça memória de cálculo e drivers objetivos.','Negocie produtividade, prazo e escopo para reduzir o efeito líquido do reajuste.'];
      a.questions=['Quais drivers justificam esse percentual?','Quanto desse reajuste vem de índice e quanto vem de custo específico?','Que produtividade ou contrapartida reduz esse percentual?'];
      a.dont='Não aceite o percentual como dado imutável sem entender a composição.';a.nextMove='Trate o percentual como reajuste econômico e teste os drivers antes de conceder.';
    }
    return a;
  }

  window.buildAnalysis=function(text,n){
    const base=prevBuildAnalysis(text,n),s=robustStructureV4(text,n,'counterparty',true),cmp=comparisonV4(text,n),type=classifyV4(text,n,base,s,cmp);
    return applyTypeV4(base,type,text,n,s,cmp);
  };

  function comparisonCardV4(a){
    const c=a&&a.comparison;if(!c)return'';
    return `<div class="card teal"><h3>Comparação econômica</h3>${c.options.map((o,i)=>`<div class="row"><span>Opção ${i+1} · ${o.label}</span><b>${brl(o.amount)} · VP ${brl(o.pv)}</b></div>`).join('')}<p class="tiny">Taxa de referência: 15% a.a. A comparação considera apenas o fluxo financeiro informado.</p></div>`;
  }
  function confidenceCardV4(a){
    if(!a)return'';let score=72;if(a.type&&a.type!=='resistance')score+=12;if(a.offer)score+=5;if(a.structure&&a.structure.quantity)score+=5;if(a.comparison)score+=4;if(a.percent!=null)score+=2;score=Math.min(98,score);
    return `<div class="tiny" style="margin:8px 2px 0;color:#60788A">Confiança da leitura: ${score}%</div>`;
  }
  window.analysisHTML=function(a){return comparisonCardV4(a)+prevAnalysisHTML(a)+confidenceCardV4(a)};

  window.toneResponse=function(original){
    const a=state&&state.lastAnalysis;if(!a)return prevToneResponse?prevToneResponse(original):original;
    const tone=state.tone||'equilibrado';
    if(a.type==='package'){
      if(tone==='colaborativo')return 'Quero encontrar uma composição que funcione para os dois lados. Podemos separar salário fixo, variável, bônus, benefícios e revisão futura para comparar o valor total de forma justa?';
      if(tone==='firme')return 'Não vou tratar bônus ou variável incerta como equivalente a salário fixo garantido. Preciso separar cada componente, seu valor esperado e suas condições antes de flexibilizar o fixo.';
      return 'Quero comparar o pacote completo. Vamos separar fixo garantido, variável, bônus, benefícios e eventual revisão futura para avaliar equivalência real.';
    }
    if(a.comparison){
      const b=a.comparison.best;
      if(tone==='colaborativo')return `Vejo valor nas duas alternativas. Pelo valor presente, ${brl(b.amount)} em ${b.label} parece mais eficiente. Podemos confirmar que escopo, garantia e entrega são iguais e então avaliar a melhor composição para ambos?`;
      if(tone==='firme')return `As duas alternativas não são economicamente equivalentes. Pelo valor presente, ${brl(b.amount)} em ${b.label} é melhor. Só considero a outra opção se houver compensação econômica ou comercial clara.`;
      return `Comparando pelo valor presente, ${brl(b.amount)} em ${b.label} é a alternativa economicamente melhor. Antes de decidir, preciso confirmar equivalência de escopo, garantia e entrega.`;
    }
    if(a.type==='price'&&a.percent!=null){
      if(tone==='colaborativo')return `Entendo a proposta de reajuste de ${String(a.percent).replace('.',',')}%. Para buscarmos um ponto sustentável, gostaria de abrir os drivers e identificar produtividade ou contrapartidas que reduzam o efeito líquido.`;
      if(tone==='firme')return `Não vou aceitar ${String(a.percent).replace('.',',')}% como premissa sem memória de cálculo e drivers objetivos. Preciso separar índice, custo específico e produtividade antes de discutir qualquer aceite.`;
      return `Recebi o reajuste de ${String(a.percent).replace('.',',')}%. Antes de avançar, preciso entender a composição entre índice, drivers de custo e produtividade para avaliar o percentual adequado.`;
    }
    return prevToneResponse?prevToneResponse(original):original;
  };

  window.sendCopilot=function(){
    const el=document.getElementById('copilotText'),t=el&&el.value.trim();if(!t)return;const n=getCurrent();
    if(state.speaker==='me'){
      const structure=robustStructureV4(t,n,'me',true),matches=moneyMatchesV4(t,n),ownOffer=matches.length?matches[matches.length-1].value:null,parts=[];
      if(structure.quantity)parts.push(`${structure.quantity} unidade${structure.quantity>1?'s':''}`);if(ownOffer)parts.push(`${brl(ownOffer)}${structure.quantity?' por unidade':''}`);if(structure.total)parts.push(`total ${brl(structure.total)}`);if(structure.percent!=null)parts.push(`${String(structure.percent).replace('.',',')}%`);
      state.chat.push({role:'me',text:t},{role:'tool-own',text:`Sua posição foi registrada${parts.length?': '+parts.join(' · '):''}. Vou considerar preço, quantidade, percentual, prazo, escopo e demais condições na próxima leitura.`});
      n.events.push({at:new Date().toISOString(),speaker:'me',text:t,offer:ownOffer,structure});state.lastAnalysis=null;
    }else{
      const a=window.buildAnalysis(t,n),parts=[];
      if(a.structure&&a.structure.quantity)parts.push(`Quantidade percebida: ${a.structure.quantity}`);if(a.offer)parts.push(`Preço percebido: ${brl(a.offer)}`);if(a.percent!=null)parts.push(`Percentual percebido: ${String(a.percent).replace('.',',')}%`);if(a.comparison)parts.push(`${a.comparison.options.length} alternativas econômicas detectadas`);
      state.chat.push({role:'counterparty',text:t},{role:'tool-counterparty',text:`${parts.length?parts.join('. ')+'. ':''}Abaixo está a leitura tática desta rodada.`});
      state.lastAnalysis=a;n.events.push({at:new Date().toISOString(),speaker:'counterparty',text:t,analysis:a,structure:a.structure});
    }
    const data=db.get(),i=data.negotiations.findIndex(x=>x.id===n.id);if(i>=0){data.negotiations[i]=n;db.set(data)}render();
  };

  window.NEGOCIA_V094={qtyFromText:qtyFromTextV4,structure:robustStructureV4,comparison:comparisonV4,classify:classifyV4};
})();
