/* Negocia.AI v0.9.11 - valores por extenso + leitura tática contextual */
(function(){
  const prevBuildAnalysis=window.buildAnalysis;
  const prevExtractOffers=window.extractOffers;
  const prevExtractOffer=window.extractOffer;

  const UNITS={zero:0,um:1,uma:1,dois:2,duas:2,tres:3,três:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,
    dez:10,onze:11,doze:12,treze:13,quatorze:14,catorze:14,quinze:15,dezesseis:16,dezassete:17,dezessete:17,
    dezoito:18,dezenove:19};
  const TENS={vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,oitenta:80,noventa:90};
  const HUNDS={cem:100,cento:100,duzentos:200,duzentas:200,trezentos:300,trezentas:300,quatrocentos:400,quatrocentas:400,
    quinhentos:500,quinhentas:500,seiscentos:600,seiscentas:600,setecentos:700,setecentas:700,oitocentos:800,oitocentas:800,
    novecentos:900,novecentas:900};

  function clean(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function refs(n){return [Number(n&&n.asking)||0,Number(n&&n.target)||0,Number(n&&n.limit)||0].filter(Boolean)}
  function refScale(n){const r=refs(n);return r.length?r.reduce((a,b)=>a+b,0)/r.length:0}

  function wordsNumber(segment){
    const w=clean(segment).replace(/[^a-z\s]/g,' ').split(/\s+/).filter(Boolean);
    let total=0,current=0,seen=false,scaleHit=false;
    for(const x of w){
      if(x==='e')continue;
      if(Object.prototype.hasOwnProperty.call(UNITS,x)){current+=UNITS[x];seen=true;continue}
      if(Object.prototype.hasOwnProperty.call(TENS,x)){current+=TENS[x];seen=true;continue}
      if(Object.prototype.hasOwnProperty.call(HUNDS,x)){current+=HUNDS[x];seen=true;continue}
      if(x==='mil'){current=current||1;total+=current*1000;current=0;seen=true;scaleHit=true;continue}
      if(x==='milhao'||x==='milhoes'){current=current||1;total+=current*1000000;current=0;seen=true;scaleHit=true;continue}
      return null;
    }
    return seen?{value:total+current,scaleHit}:null;
  }

  function writtenCandidates(text){
    const t=clean(text);
    const vocab='(?:zero|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|duzentas|trezentos|trezentas|quatrocentos|quatrocentas|quinhentos|quinhentas|seiscentos|seiscentas|setecentos|setecentas|oitocentos|oitocentas|novecentos|novecentas|mil|milhao|milhoes)';
    const re=new RegExp('\\b'+vocab+'(?:\\s+e\\s+'+vocab+'|\\s+'+vocab+')*\\b','g');
    const out=[];let m;
    while((m=re.exec(t))!==null){
      const after=t.slice(m.index+m[0].length,m.index+m[0].length+24);
      if(/^\\s*(?:x\\b|vez(?:es)?\\b|parcelas?\\b|prestacoes?\\b)/i.test(after))continue;
      const p=wordsNumber(m[0]);
      if(p&&p.value>0)out.push({raw:m[0],value:p.value,scaleHit:p.scaleHit,index:m.index});
    }
    return out;
  }

  function numericShortCandidates(text,n){
    const t=clean(text),scale=refScale(n);
    if(scale<10000)return[];
    if(/\b(?:unidades?|pecas?|itens?|licencas?|dias?|meses?|anos?|%|por cento)\b/.test(t))return[];
    const matches=[...t.matchAll(/(?:^|\s|[,:;.!?])(?:r\$\s*)?(\d{1,3})(?:\s*(?:k|mil))?(?=$|\s|[,:;.!?])/g)];
    return matches.map(m=>{
      const idx=m.index||0;
      const tokenEnd=idx+m[0].length;
      const after=t.slice(tokenEnd,tokenEnd+24);
      if(/^\s*(?:x\b|vez(?:es)?\b|parcelas?\b|prestacoes?\b)/i.test(after))return null;
      let v=Number(m[1]);
      const raw=m[0];
      const explicit=/k|mil/.test(raw);
      if(!explicit&&v>0&&v<1000)v*=1000;
      return{raw:raw.trim(),value:v,index:idx,scaleHit:explicit};
    }).filter(x=>x&&x.value>100);
  }

  function inferWrittenValue(x,n,text){
    let v=x.value,scale=refScale(n);
    if(!x.scaleHit&&scale>=10000&&v>0&&v<1000){
      const t=clean(text);
      const looksPrice=/\b(?:preco|valor|fecho|fechar|fechado|vendo|vendi|oferta|proposta|consigo|faco|fica|por)\b/.test(t)
        || t.split(/\s+/).filter(Boolean).length<=6;
      if(looksPrice)v*=1000;
    }
    return v;
  }

  function allOffers(text,n){
    const base=prevExtractOffers?prevExtractOffers(text,n):[];
    const words=writtenCandidates(text).map(x=>inferWrittenValue(x,n,text));
    const shorts=numericShortCandidates(text,n).map(x=>x.value);
    const vals=[...base,...words,...shorts].filter(v=>Number.isFinite(v)&&v>100);
    const rs=refs(n),ref=refScale(n);
    const compatible=rs.length?vals.filter(v=>v>=ref*.15&&v<=ref*6):vals;
    const use=compatible.length?compatible:vals;
    return [...new Set(use.map(v=>Math.round(v)))];
  }


  function installmentCountToken(token){
    if(!token)return null;
    const numeric=Number(token);
    if(Number.isFinite(numeric)&&numeric>=1&&numeric<=48)return numeric;
    const p=wordsNumber(token);
    return p&&p.value>=1&&p.value<=48?p.value:null;
  }

  function installmentAmountToken(token,n){
    if(!token)return null;
    const direct=(prevExtractOffers?prevExtractOffers(token,n):[]);
    if(direct.length)return direct[direct.length-1];
    const w=writtenCandidates(token);
    if(w.length)return inferWrittenValue(w[w.length-1],n,token);
    const short=numericShortCandidates(token,n);
    if(short.length)return short[short.length-1].value;
    return null;
  }

  function countOnlyInstallments(text){
    const t=clean(text).trim();
    const countWord='(?:um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|vinte\\s+e\\s+um|vinte\\s+e\\s+dois|vinte\\s+e\\s+tres|vinte\\s+e\\s+quatro)';
    const patterns=[
      new RegExp('^(?:em\\s+)?(\\d{1,2}|'+countWord+')\\s*(?:x|vezes?|parcelas?|prestacoes?)(?:\\s+iguais?)?[.!?]?    const t=clean(text);
    const countWord='(?:um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|vinte\\s+e\\s+um|vinte\\s+e\\s+dois|vinte\\s+e\\s+tres|vinte\\s+e\\s+quatro)';
    const amountWord='(?:zero|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|duzentas|trezentos|trezentas|quatrocentos|quatrocentas|quinhentos|quinhentas|seiscentos|seiscentas|setecentos|setecentas|oitocentos|oitocentas|novecentos|novecentas|mil|milhao|milhoes)';
    const amountExpr=`(?:r\\$\\s*)?(?:\\d+(?:[.,]\\d+)?\\s*(?:k|mil|mi|milhao|milhoes)?|${amountWord}(?:\\s+e\\s+${amountWord}|\\s+${amountWord})*)`;
    const patterns=[
      new RegExp('\\b(\\d{1,2}|'+countWord+')\\s*x\\s*(?:iguais?\\s*)?(?:de|a|no valor de)?\\s*('+amountExpr+')','i'),
      new RegExp('\\b(\\d{1,2}|'+countWord+')\\s*(?:parcelas?|prestacoes?)\\s*(?:iguais?\\s*)?(?:de|a|no valor de)?\\s*('+amountExpr+')','i'),
      new RegExp('\\b(?:em\\s+)?(\\d{1,2}|'+countWord+')\\s*(?:vezes|parcelas?|prestacoes?)\\s*(?:iguais?\\s*)?(?:de|a|no valor de)?\\s*('+amountExpr+')','i')
    ];
    for(const re of patterns){
      const m=t.match(re);
      if(!m)continue;
      const installments=installmentCountToken(m[1]);
      const installmentValue=installmentAmountToken(m[2],n);
      if(!(installments&&installmentValue))continue;
      const total=installments*installmentValue;
      return{
        installments,
        installmentValue:Math.round(installmentValue),
        total:Math.round(total),
        label:`${installments}x de ${typeof money==='function'?money(installmentValue):installmentValue}`
      };
    }
    return null;
  }

  window.extractOffers=function(text,n){return allOffers(text,n)};
  window.extractOffer=function(text,n){const v=allOffers(text,n);return v.length?v[v.length-1]:(prevExtractOffer?prevExtractOffer(text,n):null)};

  function eventOffer(e){
    if(!e)return null;
    if(e.analysis&&e.analysis.offer)return Number(e.analysis.offer);
    if(e.offer)return Number(e.offer);
    return null;
  }
  function historyContext(n,current){
    const ev=(n&&n.events)||[];
    const cp=ev.filter(e=>e.speaker==='counterparty').map(eventOffer).filter(Boolean);
    const me=ev.filter(e=>e.speaker==='me').map(eventOffer).filter(Boolean);
    if(current&&(cp.length===0||cp[cp.length-1]!==current))cp.push(current);
    const lastMine=me.length?me[me.length-1]:null;
    const prevCp=cp.length>1?cp[cp.length-2]:null;
    const concession=prevCp&&current?prevCp-current:null;
    return{cp,me,lastMine,prevCp,concession};
  }
  function contextualize(a,n,text){
    const offer=a&&a.offer;if(!a||!offer)return a;
    const h=historyContext(n,offer),dir=typeof direction==='function'?direction(n):'down';
    const target=Number(n.target)||0,limit=Number(n.limit)||0,asking=Number(n.asking)||0;
    const fmt=v=>typeof money==='function'?money(v):('R$ '+Math.round(v).toLocaleString('pt-BR'));
    const gapTarget=dir==='down'?offer-target:target-offer;
    const gapLimit=dir==='down'?offer-limit:limit-offer;
    const favorable=h.concession!=null?(dir==='down'?h.concession:-h.concession):null;
    const pctFromStart=asking?Math.abs(asking-offer)/asking*100:null;

    let tactical=[];
    if(h.prevCp){
      tactical.push(`A contraparte saiu de ${fmt(h.prevCp)} para ${fmt(offer)}${favorable>0?`, cedendo ${fmt(Math.abs(favorable))} nesta rodada`:''}.`);
    }
    if(h.lastMine){
      const spread=Math.abs(offer-h.lastMine);
      tactical.push(`Sua última posição foi ${fmt(h.lastMine)}. O gap atual entre vocês é ${fmt(spread)}.`);
    }
    if(dir==='down'){
      if(offer>limit)tactical.push(`A oferta ainda está ${fmt(offer-limit)} acima do seu limite de ${fmt(limit)}. Não aceite nem revele o limite.`);
      else if(offer>target)tactical.push(`A oferta entrou na sua faixa negociável, mas ainda está ${fmt(offer-target)} acima do alvo de ${fmt(target)}.`);
      else tactical.push(`A contraparte chegou ao seu alvo ou melhor. Priorize fechamento e condições, não uma nova redução automática.`);
    }else{
      if(offer<limit)tactical.push(`A oferta ainda está ${fmt(limit-offer)} abaixo do seu limite de ${fmt(limit)}.`);
      else if(offer<target)tactical.push(`A oferta entrou na faixa negociável e está ${fmt(target-offer)} abaixo do seu alvo.`);
      else tactical.push(`A contraparte atingiu seu alvo ou melhor. Mude o foco para fechamento e proteção de condições.`);
    }
    if(pctFromStart!=null&&h.cp.length>=2)tactical.push(`Desde a referência inicial, o movimento econômico observado é de aproximadamente ${pctFromStart.toFixed(1).replace('.',',')}%.`);

    a.intent=tactical.join(' ');
    a.args=[
      h.prevCp&&favorable>0?`Há concessão real da contraparte nesta rodada: ${fmt(Math.abs(favorable))}. Não responda com concessão maior do que a recebida.`:'Não conceda apenas para manter a conversa andando; exija informação ou contrapartida.',
      h.lastMine?`Use o gap atual de ${fmt(Math.abs(offer-h.lastMine))} para propor divisão condicionada, não um salto direto ao seu limite.`:`Use seu alvo de ${fmt(target)} como referência interna e preserve o limite de ${fmt(limit)}.`,
      dir==='down'&&offer<=limit?'Como a oferta já entrou na faixa aceitável, pressione por fechamento ou melhoria de condição antes de mover novamente.':'Teste se a posição atual é realmente final antes do próximo número.'
    ].filter(Boolean);

    if(dir==='down'&&offer<=limit){
      a.questions=[
        'Se eu aproximar um pouco minha posição, você fecha agora sem reabrir o preço?',
        'Além do preço, existe alguma condição que impeça o fechamento hoje?',
        'Qual é o melhor número final que você consegue autorizar agora?'
      ];
      a.dont='Não faça uma concessão maior do que a última concessão da contraparte e não revele seu limite.';
    }else if(dir==='down'&&offer>limit){
      a.questions=[
        'O que você consegue fazer para trazer essa proposta para uma faixa realmente fechável hoje?',
        'Esse número é seu limite econômico ou ainda há margem de aprovação?',
        'Se eu mantiver escopo e condição, qual é sua melhor proposta final?'
      ];
      a.dont='Não caminhe até o seu limite só porque a contraparte reduziu. Ela ainda está fora da sua faixa.';
    }

    const suggested=Number(a.next)||target;
    if(dir==='down'){
      if(offer<=target){
        a.next=offer;
        a.nextMove=`Pare de reduzir preço. A posição de ${fmt(offer)} já atende seu alvo de ${fmt(target)}. Feche condições, pagamento, entrega e garantia.`;
      }else if(offer<=limit){
        a.nextMove=`A oferta está dentro da faixa aceitável. Use ${fmt(suggested)} apenas se a contraparte confirmar fechamento imediato ou entregar contrapartida objetiva. Se não houver compromisso de fechamento, mantenha sua posição e faça a pergunta principal.`;
      }else{
        a.nextMove=`Ainda não é hora de buscar meio-termo. A oferta de ${fmt(offer)} segue fora do seu limite. Pressione por nova concessão da contraparte antes de aproximar sua posição.`;
      }
    }
    a.contextual=true;
    return a;
  }

  window.buildAnalysis=function(text,n){
    const installment=installmentStructure(text,n);
    const countOnly=countOnlyInstallments(text);
    let detected=allOffers(text,n);
    let normalized=text;

    if(installment){
      detected=[installment.total];
      normalized=`${text} | valor total da proposta R$ ${installment.total} | ${installment.installments}x de R$ ${installment.installmentValue}`;
    }else if(detected.length){
      const v=detected[detected.length-1];
      if(!(prevExtractOffers&&prevExtractOffers(text,n).length)) normalized=`${text} | valor informado R$ ${Math.round(v)}`;
    }

    let a=prevBuildAnalysis(normalized,n);

    if(installment){
      const days=Array.from({length:installment.installments},(_,i)=>(i+1)*30);
      const annualRate=.15;
      const pv=days.reduce((sum,d)=>sum+installment.installmentValue/Math.pow(1+annualRate,d/365),0);
      a.offer=installment.total;
      a.offers=[installment.total];
      a.type='payment';
      a.label='Parcelamento / valor total';
      a.payment={
        installments:installment.installments,
        days,
        annualRate,
        pv,
        benefit:Math.max(0,installment.total-pv),
        label:`${installment.installments}x de ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue} · 30/${days.slice(1).join('/')} dias`,
        cashEquivalent:pv,
        installmentValue:installment.installmentValue,
        nominalTotal:installment.total
      };
      const dir=typeof direction==='function'?direction(n):'down';
      if(dir==='down'){
        a.status=installment.total<=Number(n.target)?'Entrou na faixa-alvo':installment.total<=Number(n.limit)?'Faixa negociável':'Ainda fora da sua faixa';
      }else{
        a.status=installment.total>=Number(n.target)?'Atingiu ou superou o alvo':installment.total>=Number(n.limit)?'Faixa negociável':'Ainda fora da sua faixa';
      }
      a.intent=`A contraparte propôs ${installment.installments} parcelas iguais de ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue}, total nominal de ${typeof money==='function'?money(installment.total):installment.total}. Compare o total e o valor presente do fluxo, não apenas a parcela isolada.`;
      a.args=[
        `Total nominal identificado: ${typeof money==='function'?money(installment.total):installment.total}.`,
        `Parcela individual: ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue} em ${installment.installments} pagamentos.`,
        'Trate prazo como moeda de negociação: compare o equivalente à vista com seu alvo e com outras alternativas.'
      ];
      a.questions=[
        'Essas parcelas vencem em 30, 60 e 90 dias ou existe outro calendário?',
        'Qual é o melhor valor total se eu reduzir o prazo de pagamento?',
        'Se mantivermos esse parcelamento, há alguma melhoria adicional no valor total?'
      ];
      a.concession='Não negocie a parcela isoladamente. Qualquer mudança no prazo deve ser trocada por melhoria no valor total ou em outra condição relevante.';
      a.dont='Não interprete o valor de uma parcela como preço total da proposta.';
      a.response=`“Entendi: são ${installment.installments} parcelas iguais de ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue}, totalizando ${typeof money==='function'?money(installment.total):installment.total}. Só preciso confirmar os vencimentos. Se eu melhorar o prazo de pagamento, qual é sua melhor condição no valor total?”`;
      a.nextMove=`A proposta econômica é de ${typeof money==='function'?money(installment.total):installment.total} nominais, não ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue}. Confirme o calendário das parcelas e use o equivalente à vista para decidir se precisa mover preço.`;
    }else if(countOnly){
      const base=lastKnownNegotiatedValue(n);
      a.type='payment';
      a.label='Condição de pagamento';
      a.offer=base||null;
      a.offers=base?[base]:[];
      a.status=base?a.status:'Valor total ainda não confirmado';
      if(base){
        const installmentValue=base/countOnly;
        const days=Array.from({length:countOnly},(_,i)=>(i+1)*30);
        const annualRate=.15;
        const pv=days.reduce((sum,d)=>sum+installmentValue/Math.pow(1+annualRate,d/365),0);
        a.payment={
          installments:countOnly,
          days,
          annualRate,
          pv,
          benefit:Math.max(0,base-pv),
          label:`${countOnly}x estimadas de ${typeof money==='function'?money(installmentValue):Math.round(installmentValue)} · ${days.join('/')} dias`,
          cashEquivalent:pv,
          installmentValue,
          nominalTotal:base
        };
        a.intent=`A contraparte informou pagamento em ${countOnly} vezes. Mantendo o último valor negociado de ${typeof money==='function'?money(base):base}, isso representa aproximadamente ${typeof money==='function'?money(installmentValue):Math.round(installmentValue)} por parcela. O preço não mudou; mudou a condição financeira.`;
        a.args=[
          `Preço-base preservado: ${typeof money==='function'?money(base):base}.`,
          `Condição informada: ${countOnly} parcelas; valor estimado por parcela de ${typeof money==='function'?money(installmentValue):Math.round(installmentValue)} se forem iguais.`,
          'Confirme datas de vencimento antes de aceitar, pois o prazo altera o valor econômico do acordo.'
        ];
        a.questions=[
          `As ${countOnly} parcelas são iguais e quais são os vencimentos?`,
          'Há entrada ou a primeira parcela vence em 30 dias?',
          'Se eu reduzir o prazo, qual melhoria você consegue fazer no valor total?'
        ];
        a.dont=`Não interprete “${countOnly} vezes” como ${typeof money==='function'?money(countOnly*1000):countOnly*1000}. Esse número é quantidade de parcelas, não preço.`;
        a.response=`“Entendi: pagamento em ${countOnly} vezes, mantendo o valor negociado. Só me confirme se as parcelas são iguais e os vencimentos para eu fechar a condição financeira corretamente.”`;
        a.nextMove=`Mantenha o preço-base em ${typeof money==='function'?money(base):base}. Trate ${countOnly} vezes apenas como condição de pagamento e confirme o calendário antes de qualquer nova concessão.`;
      }else{
        a.payment=null;
        a.intent=`A contraparte informou pagamento em ${countOnly} vezes, mas ainda não há valor total confirmado nesta rodada.`;
        a.args=['Quantidade de parcelas identificada corretamente.','Não inferir preço a partir do número de parcelas.','Peça confirmação do valor total e dos vencimentos.'];
        a.questions=['Qual é o valor total nessa condição?','As parcelas são iguais?','Quais são os vencimentos?'];
        a.dont='Não transforme quantidade de parcelas em valor monetário.';
        a.response=`“Entendi: ${countOnly} vezes. Qual é o valor total nessa condição e quais são os vencimentos?”`;
        a.nextMove='Confirme o valor total e o calendário das parcelas antes de avaliar a proposta.';
      }
      return a;
    }else if(detected.length&&!a.offer){
      a.offer=detected[detected.length-1];
    }

    return contextualize(a,n,text);
  };
})();
,'i'),
      new RegExp('^(?:pagamento\\s+)?(?:em\\s+)?(\\d{1,2}|'+countWord+')\\s*(?:x|vezes?|parcelas?|prestacoes?)(?:\\s+iguais?)?[.!?]?    const t=clean(text);
    const countWord='(?:um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|vinte\\s+e\\s+um|vinte\\s+e\\s+dois|vinte\\s+e\\s+tres|vinte\\s+e\\s+quatro)';
    const amountWord='(?:zero|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|duzentas|trezentos|trezentas|quatrocentos|quatrocentas|quinhentos|quinhentas|seiscentos|seiscentas|setecentos|setecentas|oitocentos|oitocentas|novecentos|novecentas|mil|milhao|milhoes)';
    const amountExpr=`(?:r\\$\\s*)?(?:\\d+(?:[.,]\\d+)?\\s*(?:k|mil|mi|milhao|milhoes)?|${amountWord}(?:\\s+e\\s+${amountWord}|\\s+${amountWord})*)`;
    const patterns=[
      new RegExp('\\b(\\d{1,2}|'+countWord+')\\s*x\\s*(?:iguais?\\s*)?(?:de|a|no valor de)?\\s*('+amountExpr+')','i'),
      new RegExp('\\b(\\d{1,2}|'+countWord+')\\s*(?:parcelas?|prestacoes?)\\s*(?:iguais?\\s*)?(?:de|a|no valor de)?\\s*('+amountExpr+')','i'),
      new RegExp('\\b(?:em\\s+)?(\\d{1,2}|'+countWord+')\\s*(?:vezes|parcelas?|prestacoes?)\\s*(?:iguais?\\s*)?(?:de|a|no valor de)?\\s*('+amountExpr+')','i')
    ];
    for(const re of patterns){
      const m=t.match(re);
      if(!m)continue;
      const installments=installmentCountToken(m[1]);
      const installmentValue=installmentAmountToken(m[2],n);
      if(!(installments&&installmentValue))continue;
      const total=installments*installmentValue;
      return{
        installments,
        installmentValue:Math.round(installmentValue),
        total:Math.round(total),
        label:`${installments}x de ${typeof money==='function'?money(installmentValue):installmentValue}`
      };
    }
    return null;
  }

  window.extractOffers=function(text,n){return allOffers(text,n)};
  window.extractOffer=function(text,n){const v=allOffers(text,n);return v.length?v[v.length-1]:(prevExtractOffer?prevExtractOffer(text,n):null)};

  function eventOffer(e){
    if(!e)return null;
    if(e.analysis&&e.analysis.offer)return Number(e.analysis.offer);
    if(e.offer)return Number(e.offer);
    return null;
  }
  function historyContext(n,current){
    const ev=(n&&n.events)||[];
    const cp=ev.filter(e=>e.speaker==='counterparty').map(eventOffer).filter(Boolean);
    const me=ev.filter(e=>e.speaker==='me').map(eventOffer).filter(Boolean);
    if(current&&(cp.length===0||cp[cp.length-1]!==current))cp.push(current);
    const lastMine=me.length?me[me.length-1]:null;
    const prevCp=cp.length>1?cp[cp.length-2]:null;
    const concession=prevCp&&current?prevCp-current:null;
    return{cp,me,lastMine,prevCp,concession};
  }
  function contextualize(a,n,text){
    const offer=a&&a.offer;if(!a||!offer)return a;
    const h=historyContext(n,offer),dir=typeof direction==='function'?direction(n):'down';
    const target=Number(n.target)||0,limit=Number(n.limit)||0,asking=Number(n.asking)||0;
    const fmt=v=>typeof money==='function'?money(v):('R$ '+Math.round(v).toLocaleString('pt-BR'));
    const gapTarget=dir==='down'?offer-target:target-offer;
    const gapLimit=dir==='down'?offer-limit:limit-offer;
    const favorable=h.concession!=null?(dir==='down'?h.concession:-h.concession):null;
    const pctFromStart=asking?Math.abs(asking-offer)/asking*100:null;

    let tactical=[];
    if(h.prevCp){
      tactical.push(`A contraparte saiu de ${fmt(h.prevCp)} para ${fmt(offer)}${favorable>0?`, cedendo ${fmt(Math.abs(favorable))} nesta rodada`:''}.`);
    }
    if(h.lastMine){
      const spread=Math.abs(offer-h.lastMine);
      tactical.push(`Sua última posição foi ${fmt(h.lastMine)}. O gap atual entre vocês é ${fmt(spread)}.`);
    }
    if(dir==='down'){
      if(offer>limit)tactical.push(`A oferta ainda está ${fmt(offer-limit)} acima do seu limite de ${fmt(limit)}. Não aceite nem revele o limite.`);
      else if(offer>target)tactical.push(`A oferta entrou na sua faixa negociável, mas ainda está ${fmt(offer-target)} acima do alvo de ${fmt(target)}.`);
      else tactical.push(`A contraparte chegou ao seu alvo ou melhor. Priorize fechamento e condições, não uma nova redução automática.`);
    }else{
      if(offer<limit)tactical.push(`A oferta ainda está ${fmt(limit-offer)} abaixo do seu limite de ${fmt(limit)}.`);
      else if(offer<target)tactical.push(`A oferta entrou na faixa negociável e está ${fmt(target-offer)} abaixo do seu alvo.`);
      else tactical.push(`A contraparte atingiu seu alvo ou melhor. Mude o foco para fechamento e proteção de condições.`);
    }
    if(pctFromStart!=null&&h.cp.length>=2)tactical.push(`Desde a referência inicial, o movimento econômico observado é de aproximadamente ${pctFromStart.toFixed(1).replace('.',',')}%.`);

    a.intent=tactical.join(' ');
    a.args=[
      h.prevCp&&favorable>0?`Há concessão real da contraparte nesta rodada: ${fmt(Math.abs(favorable))}. Não responda com concessão maior do que a recebida.`:'Não conceda apenas para manter a conversa andando; exija informação ou contrapartida.',
      h.lastMine?`Use o gap atual de ${fmt(Math.abs(offer-h.lastMine))} para propor divisão condicionada, não um salto direto ao seu limite.`:`Use seu alvo de ${fmt(target)} como referência interna e preserve o limite de ${fmt(limit)}.`,
      dir==='down'&&offer<=limit?'Como a oferta já entrou na faixa aceitável, pressione por fechamento ou melhoria de condição antes de mover novamente.':'Teste se a posição atual é realmente final antes do próximo número.'
    ].filter(Boolean);

    if(dir==='down'&&offer<=limit){
      a.questions=[
        'Se eu aproximar um pouco minha posição, você fecha agora sem reabrir o preço?',
        'Além do preço, existe alguma condição que impeça o fechamento hoje?',
        'Qual é o melhor número final que você consegue autorizar agora?'
      ];
      a.dont='Não faça uma concessão maior do que a última concessão da contraparte e não revele seu limite.';
    }else if(dir==='down'&&offer>limit){
      a.questions=[
        'O que você consegue fazer para trazer essa proposta para uma faixa realmente fechável hoje?',
        'Esse número é seu limite econômico ou ainda há margem de aprovação?',
        'Se eu mantiver escopo e condição, qual é sua melhor proposta final?'
      ];
      a.dont='Não caminhe até o seu limite só porque a contraparte reduziu. Ela ainda está fora da sua faixa.';
    }

    const suggested=Number(a.next)||target;
    if(dir==='down'){
      if(offer<=target){
        a.next=offer;
        a.nextMove=`Pare de reduzir preço. A posição de ${fmt(offer)} já atende seu alvo de ${fmt(target)}. Feche condições, pagamento, entrega e garantia.`;
      }else if(offer<=limit){
        a.nextMove=`A oferta está dentro da faixa aceitável. Use ${fmt(suggested)} apenas se a contraparte confirmar fechamento imediato ou entregar contrapartida objetiva. Se não houver compromisso de fechamento, mantenha sua posição e faça a pergunta principal.`;
      }else{
        a.nextMove=`Ainda não é hora de buscar meio-termo. A oferta de ${fmt(offer)} segue fora do seu limite. Pressione por nova concessão da contraparte antes de aproximar sua posição.`;
      }
    }
    a.contextual=true;
    return a;
  }

  window.buildAnalysis=function(text,n){
    const installment=installmentStructure(text,n);
    let detected=allOffers(text,n);
    let normalized=text;

    if(installment){
      detected=[installment.total];
      normalized=`${text} | valor total da proposta R$ ${installment.total} | ${installment.installments}x de R$ ${installment.installmentValue}`;
    }else if(detected.length){
      const v=detected[detected.length-1];
      if(!(prevExtractOffers&&prevExtractOffers(text,n).length)) normalized=`${text} | valor informado R$ ${Math.round(v)}`;
    }

    let a=prevBuildAnalysis(normalized,n);

    if(installment){
      const days=Array.from({length:installment.installments},(_,i)=>(i+1)*30);
      const annualRate=.15;
      const pv=days.reduce((sum,d)=>sum+installment.installmentValue/Math.pow(1+annualRate,d/365),0);
      a.offer=installment.total;
      a.offers=[installment.total];
      a.type='payment';
      a.label='Parcelamento / valor total';
      a.payment={
        installments:installment.installments,
        days,
        annualRate,
        pv,
        benefit:Math.max(0,installment.total-pv),
        label:`${installment.installments}x de ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue} · 30/${days.slice(1).join('/')} dias`,
        cashEquivalent:pv,
        installmentValue:installment.installmentValue,
        nominalTotal:installment.total
      };
      const dir=typeof direction==='function'?direction(n):'down';
      if(dir==='down'){
        a.status=installment.total<=Number(n.target)?'Entrou na faixa-alvo':installment.total<=Number(n.limit)?'Faixa negociável':'Ainda fora da sua faixa';
      }else{
        a.status=installment.total>=Number(n.target)?'Atingiu ou superou o alvo':installment.total>=Number(n.limit)?'Faixa negociável':'Ainda fora da sua faixa';
      }
      a.intent=`A contraparte propôs ${installment.installments} parcelas iguais de ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue}, total nominal de ${typeof money==='function'?money(installment.total):installment.total}. Compare o total e o valor presente do fluxo, não apenas a parcela isolada.`;
      a.args=[
        `Total nominal identificado: ${typeof money==='function'?money(installment.total):installment.total}.`,
        `Parcela individual: ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue} em ${installment.installments} pagamentos.`,
        'Trate prazo como moeda de negociação: compare o equivalente à vista com seu alvo e com outras alternativas.'
      ];
      a.questions=[
        'Essas parcelas vencem em 30, 60 e 90 dias ou existe outro calendário?',
        'Qual é o melhor valor total se eu reduzir o prazo de pagamento?',
        'Se mantivermos esse parcelamento, há alguma melhoria adicional no valor total?'
      ];
      a.concession='Não negocie a parcela isoladamente. Qualquer mudança no prazo deve ser trocada por melhoria no valor total ou em outra condição relevante.';
      a.dont='Não interprete o valor de uma parcela como preço total da proposta.';
      a.response=`“Entendi: são ${installment.installments} parcelas iguais de ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue}, totalizando ${typeof money==='function'?money(installment.total):installment.total}. Só preciso confirmar os vencimentos. Se eu melhorar o prazo de pagamento, qual é sua melhor condição no valor total?”`;
      a.nextMove=`A proposta econômica é de ${typeof money==='function'?money(installment.total):installment.total} nominais, não ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue}. Confirme o calendário das parcelas e use o equivalente à vista para decidir se precisa mover preço.`;
    }else if(detected.length&&!a.offer){
      a.offer=detected[detected.length-1];
    }

    return contextualize(a,n,text);
  };
})();
,'i')
    ];
    for(const re of patterns){
      const m=t.match(re);
      if(m){
        const installments=installmentCountToken(m[1]);
        if(installments)return installments;
      }
    }
    return null;
  }

  function lastKnownNegotiatedValue(n){
    const ev=(n&&n.events)||[];
    for(let i=ev.length-1;i>=0;i--){
      const e=ev[i];
      const v=e&&e.analysis&&e.analysis.offer?Number(e.analysis.offer):(e&&e.offer?Number(e.offer):null);
      if(v&&Number.isFinite(v))return v;
    }
    return null;
  }

  function installmentStructure(text,n){
    const t=clean(text);
    const countWord='(?:um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|vinte\\s+e\\s+um|vinte\\s+e\\s+dois|vinte\\s+e\\s+tres|vinte\\s+e\\s+quatro)';
    const amountWord='(?:zero|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|duzentas|trezentos|trezentas|quatrocentos|quatrocentas|quinhentos|quinhentas|seiscentos|seiscentas|setecentos|setecentas|oitocentos|oitocentas|novecentos|novecentas|mil|milhao|milhoes)';
    const amountExpr=`(?:r\\$\\s*)?(?:\\d+(?:[.,]\\d+)?\\s*(?:k|mil|mi|milhao|milhoes)?|${amountWord}(?:\\s+e\\s+${amountWord}|\\s+${amountWord})*)`;
    const patterns=[
      new RegExp('\\b(\\d{1,2}|'+countWord+')\\s*x\\s*(?:iguais?\\s*)?(?:de|a|no valor de)?\\s*('+amountExpr+')','i'),
      new RegExp('\\b(\\d{1,2}|'+countWord+')\\s*(?:parcelas?|prestacoes?)\\s*(?:iguais?\\s*)?(?:de|a|no valor de)?\\s*('+amountExpr+')','i'),
      new RegExp('\\b(?:em\\s+)?(\\d{1,2}|'+countWord+')\\s*(?:vezes|parcelas?|prestacoes?)\\s*(?:iguais?\\s*)?(?:de|a|no valor de)?\\s*('+amountExpr+')','i')
    ];
    for(const re of patterns){
      const m=t.match(re);
      if(!m)continue;
      const installments=installmentCountToken(m[1]);
      const installmentValue=installmentAmountToken(m[2],n);
      if(!(installments&&installmentValue))continue;
      const total=installments*installmentValue;
      return{
        installments,
        installmentValue:Math.round(installmentValue),
        total:Math.round(total),
        label:`${installments}x de ${typeof money==='function'?money(installmentValue):installmentValue}`
      };
    }
    return null;
  }

  window.extractOffers=function(text,n){return allOffers(text,n)};
  window.extractOffer=function(text,n){const v=allOffers(text,n);return v.length?v[v.length-1]:(prevExtractOffer?prevExtractOffer(text,n):null)};

  function eventOffer(e){
    if(!e)return null;
    if(e.analysis&&e.analysis.offer)return Number(e.analysis.offer);
    if(e.offer)return Number(e.offer);
    return null;
  }
  function historyContext(n,current){
    const ev=(n&&n.events)||[];
    const cp=ev.filter(e=>e.speaker==='counterparty').map(eventOffer).filter(Boolean);
    const me=ev.filter(e=>e.speaker==='me').map(eventOffer).filter(Boolean);
    if(current&&(cp.length===0||cp[cp.length-1]!==current))cp.push(current);
    const lastMine=me.length?me[me.length-1]:null;
    const prevCp=cp.length>1?cp[cp.length-2]:null;
    const concession=prevCp&&current?prevCp-current:null;
    return{cp,me,lastMine,prevCp,concession};
  }
  function contextualize(a,n,text){
    const offer=a&&a.offer;if(!a||!offer)return a;
    const h=historyContext(n,offer),dir=typeof direction==='function'?direction(n):'down';
    const target=Number(n.target)||0,limit=Number(n.limit)||0,asking=Number(n.asking)||0;
    const fmt=v=>typeof money==='function'?money(v):('R$ '+Math.round(v).toLocaleString('pt-BR'));
    const gapTarget=dir==='down'?offer-target:target-offer;
    const gapLimit=dir==='down'?offer-limit:limit-offer;
    const favorable=h.concession!=null?(dir==='down'?h.concession:-h.concession):null;
    const pctFromStart=asking?Math.abs(asking-offer)/asking*100:null;

    let tactical=[];
    if(h.prevCp){
      tactical.push(`A contraparte saiu de ${fmt(h.prevCp)} para ${fmt(offer)}${favorable>0?`, cedendo ${fmt(Math.abs(favorable))} nesta rodada`:''}.`);
    }
    if(h.lastMine){
      const spread=Math.abs(offer-h.lastMine);
      tactical.push(`Sua última posição foi ${fmt(h.lastMine)}. O gap atual entre vocês é ${fmt(spread)}.`);
    }
    if(dir==='down'){
      if(offer>limit)tactical.push(`A oferta ainda está ${fmt(offer-limit)} acima do seu limite de ${fmt(limit)}. Não aceite nem revele o limite.`);
      else if(offer>target)tactical.push(`A oferta entrou na sua faixa negociável, mas ainda está ${fmt(offer-target)} acima do alvo de ${fmt(target)}.`);
      else tactical.push(`A contraparte chegou ao seu alvo ou melhor. Priorize fechamento e condições, não uma nova redução automática.`);
    }else{
      if(offer<limit)tactical.push(`A oferta ainda está ${fmt(limit-offer)} abaixo do seu limite de ${fmt(limit)}.`);
      else if(offer<target)tactical.push(`A oferta entrou na faixa negociável e está ${fmt(target-offer)} abaixo do seu alvo.`);
      else tactical.push(`A contraparte atingiu seu alvo ou melhor. Mude o foco para fechamento e proteção de condições.`);
    }
    if(pctFromStart!=null&&h.cp.length>=2)tactical.push(`Desde a referência inicial, o movimento econômico observado é de aproximadamente ${pctFromStart.toFixed(1).replace('.',',')}%.`);

    a.intent=tactical.join(' ');
    a.args=[
      h.prevCp&&favorable>0?`Há concessão real da contraparte nesta rodada: ${fmt(Math.abs(favorable))}. Não responda com concessão maior do que a recebida.`:'Não conceda apenas para manter a conversa andando; exija informação ou contrapartida.',
      h.lastMine?`Use o gap atual de ${fmt(Math.abs(offer-h.lastMine))} para propor divisão condicionada, não um salto direto ao seu limite.`:`Use seu alvo de ${fmt(target)} como referência interna e preserve o limite de ${fmt(limit)}.`,
      dir==='down'&&offer<=limit?'Como a oferta já entrou na faixa aceitável, pressione por fechamento ou melhoria de condição antes de mover novamente.':'Teste se a posição atual é realmente final antes do próximo número.'
    ].filter(Boolean);

    if(dir==='down'&&offer<=limit){
      a.questions=[
        'Se eu aproximar um pouco minha posição, você fecha agora sem reabrir o preço?',
        'Além do preço, existe alguma condição que impeça o fechamento hoje?',
        'Qual é o melhor número final que você consegue autorizar agora?'
      ];
      a.dont='Não faça uma concessão maior do que a última concessão da contraparte e não revele seu limite.';
    }else if(dir==='down'&&offer>limit){
      a.questions=[
        'O que você consegue fazer para trazer essa proposta para uma faixa realmente fechável hoje?',
        'Esse número é seu limite econômico ou ainda há margem de aprovação?',
        'Se eu mantiver escopo e condição, qual é sua melhor proposta final?'
      ];
      a.dont='Não caminhe até o seu limite só porque a contraparte reduziu. Ela ainda está fora da sua faixa.';
    }

    const suggested=Number(a.next)||target;
    if(dir==='down'){
      if(offer<=target){
        a.next=offer;
        a.nextMove=`Pare de reduzir preço. A posição de ${fmt(offer)} já atende seu alvo de ${fmt(target)}. Feche condições, pagamento, entrega e garantia.`;
      }else if(offer<=limit){
        a.nextMove=`A oferta está dentro da faixa aceitável. Use ${fmt(suggested)} apenas se a contraparte confirmar fechamento imediato ou entregar contrapartida objetiva. Se não houver compromisso de fechamento, mantenha sua posição e faça a pergunta principal.`;
      }else{
        a.nextMove=`Ainda não é hora de buscar meio-termo. A oferta de ${fmt(offer)} segue fora do seu limite. Pressione por nova concessão da contraparte antes de aproximar sua posição.`;
      }
    }
    a.contextual=true;
    return a;
  }

  window.buildAnalysis=function(text,n){
    const installment=installmentStructure(text,n);
    let detected=allOffers(text,n);
    let normalized=text;

    if(installment){
      detected=[installment.total];
      normalized=`${text} | valor total da proposta R$ ${installment.total} | ${installment.installments}x de R$ ${installment.installmentValue}`;
    }else if(detected.length){
      const v=detected[detected.length-1];
      if(!(prevExtractOffers&&prevExtractOffers(text,n).length)) normalized=`${text} | valor informado R$ ${Math.round(v)}`;
    }

    let a=prevBuildAnalysis(normalized,n);

    if(installment){
      const days=Array.from({length:installment.installments},(_,i)=>(i+1)*30);
      const annualRate=.15;
      const pv=days.reduce((sum,d)=>sum+installment.installmentValue/Math.pow(1+annualRate,d/365),0);
      a.offer=installment.total;
      a.offers=[installment.total];
      a.type='payment';
      a.label='Parcelamento / valor total';
      a.payment={
        installments:installment.installments,
        days,
        annualRate,
        pv,
        benefit:Math.max(0,installment.total-pv),
        label:`${installment.installments}x de ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue} · 30/${days.slice(1).join('/')} dias`,
        cashEquivalent:pv,
        installmentValue:installment.installmentValue,
        nominalTotal:installment.total
      };
      const dir=typeof direction==='function'?direction(n):'down';
      if(dir==='down'){
        a.status=installment.total<=Number(n.target)?'Entrou na faixa-alvo':installment.total<=Number(n.limit)?'Faixa negociável':'Ainda fora da sua faixa';
      }else{
        a.status=installment.total>=Number(n.target)?'Atingiu ou superou o alvo':installment.total>=Number(n.limit)?'Faixa negociável':'Ainda fora da sua faixa';
      }
      a.intent=`A contraparte propôs ${installment.installments} parcelas iguais de ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue}, total nominal de ${typeof money==='function'?money(installment.total):installment.total}. Compare o total e o valor presente do fluxo, não apenas a parcela isolada.`;
      a.args=[
        `Total nominal identificado: ${typeof money==='function'?money(installment.total):installment.total}.`,
        `Parcela individual: ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue} em ${installment.installments} pagamentos.`,
        'Trate prazo como moeda de negociação: compare o equivalente à vista com seu alvo e com outras alternativas.'
      ];
      a.questions=[
        'Essas parcelas vencem em 30, 60 e 90 dias ou existe outro calendário?',
        'Qual é o melhor valor total se eu reduzir o prazo de pagamento?',
        'Se mantivermos esse parcelamento, há alguma melhoria adicional no valor total?'
      ];
      a.concession='Não negocie a parcela isoladamente. Qualquer mudança no prazo deve ser trocada por melhoria no valor total ou em outra condição relevante.';
      a.dont='Não interprete o valor de uma parcela como preço total da proposta.';
      a.response=`“Entendi: são ${installment.installments} parcelas iguais de ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue}, totalizando ${typeof money==='function'?money(installment.total):installment.total}. Só preciso confirmar os vencimentos. Se eu melhorar o prazo de pagamento, qual é sua melhor condição no valor total?”`;
      a.nextMove=`A proposta econômica é de ${typeof money==='function'?money(installment.total):installment.total} nominais, não ${typeof money==='function'?money(installment.installmentValue):installment.installmentValue}. Confirme o calendário das parcelas e use o equivalente à vista para decidir se precisa mover preço.`;
    }else if(detected.length&&!a.offer){
      a.offer=detected[detected.length-1];
    }

    return contextualize(a,n,text);
  };
})();
