/* Negocia.AI v0.9.4.1 - hardening dos casos de volume e prazo financeiro */
(function(){
  const prevBuildAnalysis=window.buildAnalysis;
  const prevToneResponse=window.toneResponse;

  function txt(v){return String(v||'')}
  function brl(v){try{return typeof money==='function'?money(v):new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v||0))}catch(e){return `R$ ${Number(v||0).toLocaleString('pt-BR')}`}}
  function extendedQuantityCondition(text,structure){
    const t=txt(text).toLowerCase();
    if(!structure||!structure.quantity)return false;
    if(/\b(?:se\s+(?:eu\s+|voc[eê]\s+)?(?:levar|comprar|fechar)|para)\s+\d{1,3}\s*(?:unidades?|unid\.?|itens?|carros?|ve[ií]culos?|licen[cç]as?|pe[cç]as?)/i.test(t))return true;
    if(/\bm[ií]nimo\s*(?:[ée]|de|:)?\s*\d{1,3}\s*(?:unidades?|unid\.?|itens?|carros?|ve[ií]culos?|licen[cç]as?|pe[cç]as?)/i.test(t))return true;
    if(/\b\d{1,3}\s*(?:unidades?|unid\.?|itens?|carros?|ve[ií]culos?|licen[cç]as?|pe[cç]as?)\b.*\b(?:cada|por unidade|unit[aá]ri[oa])\b/i.test(t))return true;
    return false;
  }
  function amountWithDays(text){
    const t=txt(text).toLowerCase();
    if(/entrega|frete|lead\s*time/.test(t))return false;
    return /(?:r\$\s*)?\d[\d.\s]*(?:,\d{1,2})?\s*(?:mil|k|mi|milh[aã]o|milh[oõ]es)?\s+em\s+\d{1,3}\s+dias?\b/i.test(t);
  }

  window.buildAnalysis=function(text,n){
    const a=prevBuildAnalysis(text,n),s=a&&a.structure;
    if(extendedQuantityCondition(text,s)&&a.type!=='acceptance'){
      a.type='quantity';a.label='Quantidade / volume';a.intent='A estrutura econômica depende do volume. O preço unitário precisa ser avaliado junto com quantidade e desembolso total.';
      a.lever='Volume é uma concessão econômica. Só aumente quantidade se houver necessidade real ou compensação suficiente em preço ou condição.';
      const insight=a.quantityInsight||((s&&s.quantity&&s.unitPrice)?`${s.quantity} un. x ${brl(s.unitPrice)} = ${brl(s.quantity*s.unitPrice)} no total.`:'');
      a.args=[insight||'Calcule preço unitário e total antes de aceitar o volume.','Compare o volume com a necessidade real.','Se aumentar quantidade, exija uma contrapartida proporcional.'];
      a.questions=['Qual é o melhor preço para a quantidade que eu realmente preciso?','Se eu aumentar o volume, qual redução adicional por unidade você consegue conceder?'];
      a.concession='Não aumente quantidade apenas para preservar o preço unitário.';
      a.dont='Não trate desconto unitário como saving se o desembolso total ou o estoque desnecessário aumentarem.';
      a.nextMove=`${insight} Negocie quantidade, preço unitário e valor total como um pacote.`;
    }
    if(amountWithDays(text)&&a.type!=='acceptance'&&a.type!=='scope'&&!a.comparison){
      a.type='payment';a.label='Prazo / condição financeira';a.intent='O valor foi associado a um prazo financeiro. Compare o nominal com o valor presente e o impacto de caixa.';
      a.lever='Prazo tem valor econômico. Use custo de capital e liquidez para decidir se a condição compensa o preço.';
      if(a.payment&&a.payment.cashEquivalent){
        a.args=[`Valor nominal: ${a.offer?brl(a.offer):'não identificado'}.`,`Equivalente à vista estimado: ${brl(a.payment.cashEquivalent)}.`,`Benefício financeiro estimado do prazo: ${brl(a.payment.benefit||0)}.`];
        a.nextMove=`Compare o equivalente à vista de ${brl(a.payment.cashEquivalent)} com sua alternativa antes de mover preço.`;
      }
      a.questions=['Esse prazo é condição de pagamento ou prazo de entrega?','Se eu reduzir o prazo de pagamento, qual melhora adicional de preço você consegue oferecer?'];
      a.dont='Não misture prazo de pagamento com prazo de entrega. Eles têm impactos econômicos diferentes.';
    }
    return a;
  };

  window.toneResponse=function(original){
    const a=state&&state.lastAnalysis;
    if(a&&a.type==='payment'&&amountWithDays((a.structure&&a.structure.text)||'')){
      const vp=a.payment&&a.payment.cashEquivalent?brl(a.payment.cashEquivalent):null;
      if(state.tone==='colaborativo')return `Entendo a proposta e o prazo pode agregar valor. ${vp?`Pelo valor presente, o equivalente fica perto de ${vp}. `:''}Podemos confirmar que esse prazo é de pagamento e avaliar qual melhora adicional de preço existe se eu antecipar o fluxo?`;
      if(state.tone==='firme')return `Prazo financeiro não substitui preço. ${vp?`O equivalente à vista está perto de ${vp}. `:''}Preciso separar claramente prazo de pagamento, entrega e preço antes de qualquer concessão.`;
      return `Vou comparar o valor e o prazo pelo valor presente. ${vp?`O equivalente à vista fica próximo de ${vp}. `:''}Confirme se o prazo informado é de pagamento e qual melhora de preço existe para uma condição mais curta.`;
    }
    return prevToneResponse?prevToneResponse(original):original;
  };
})();
