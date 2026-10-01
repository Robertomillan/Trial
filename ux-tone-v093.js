/* Negocia.AI v0.9.3 - papeis da conversa e tons realmente distintos */
(function(){
  const previousSendCopilot = window.sendCopilot;
  const previousToneResponse = window.toneResponse;

  function brl(v){
    try{return typeof money==='function'?money(v):new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v||0))}
    catch(e){return `R$ ${Number(v||0).toLocaleString('pt-BR')}`}
  }

  function structureText(a){
    const s=a&&a.structure||{};
    const q=s.quantity||null;
    const p=s.unitPrice||a&&a.offer||null;
    const total=s.total||(q&&p?q*p:null);
    return {q,p,total};
  }

  function responseByTone(a,tone,fallback){
    if(!a)return fallback;
    const {q,p,total}=structureText(a);
    const next=a.next?brl(a.next):null;
    const qty=q?`${q} unidade${q>1?'s':''}`:'';
    const price=p?`${brl(p)}${q?' por unidade':''}`:'';
    const totalText=total?`total de ${brl(total)}`:'';

    if(a.type==='acceptance'){
      if(tone==='colaborativo')return `Perfeito, obrigado. Então estamos alinhados em ${[qty,price,totalText].filter(Boolean).join(', ')}. Para concluirmos sem ruído, só quero confirmar especificação, frete, impostos, condição de pagamento, garantia e prazo de entrega. Me confirme esses pontos e seguimos com o fechamento.`;
      if(tone==='firme')return `Fechado. Confirmo ${[qty,price,totalText].filter(Boolean).join(', ')}. Antes de emitir o pedido, preciso apenas da confirmação por escrito de especificação, frete, impostos, pagamento, garantia e prazo de entrega. Sem alteração nesses pontos, seguimos para o fechamento.`;
      return `Perfeito. Então fechamos ${[qty,price,totalText].filter(Boolean).join(', ')}. Só confirmando antes de concluir: especificação correta, frete e impostos conforme combinado, condição de pagamento, garantia e prazo de entrega. Com esses pontos confirmados, seguimos.`;
    }

    if(a.type==='quantity'){
      if(tone==='colaborativo')return `Entendo a lógica de vincular o preço ao volume. Para avaliarmos isso de forma justa, preciso comparar o custo total com a quantidade que realmente necessito. Para ${qty||'o volume informado'}, qual é a melhor condição unitária que você consegue oferecer e o que muda em frete, prazo ou pagamento?`;
      if(tone==='firme')return `Não vou aumentar volume apenas para preservar preço unitário. Primeiro preciso comparar necessidade real e desembolso total. Para ${qty||'essa quantidade'}, preciso de uma melhora econômica adicional ou mantenho a quantidade necessária e renegociamos o preço unitário.`;
      return `Esse preço está condicionado a ${qty||'um volume maior'}. Antes de aumentar quantidade, preciso olhar custo total e necessidade real. Para a quantidade que efetivamente preciso, qual é o melhor preço unitário? Se eu assumir ${qty||'esse volume'}, preciso de contrapartida econômica adicional.`;
    }

    if(a.type==='payment'){
      const pv=a.payment&&a.payment.cashEquivalent?brl(a.payment.cashEquivalent):null;
      if(tone==='colaborativo')return `Entendo a condição de pagamento e ela pode ajudar, desde que o efeito econômico seja real. ${pv?`Pelo valor presente, o equivalente fica próximo de ${pv}. `:''}Se mantivermos essa condição, que ajuste adicional de preço você consegue oferecer?`;
      if(tone==='firme')return `Prazo de pagamento tem valor econômico e não vou tratá-lo como benefício gratuito. ${pv?`O equivalente à vista está próximo de ${pv}. `:''}Se o preço nominal permanecer, preciso de condição financeira melhor; se a condição permanecer, preciso de redução adicional no preço.`;
      return `Vou comparar preço e prazo pelo valor presente. ${pv?`O equivalente à vista fica próximo de ${pv}. `:''}Se mantivermos essa condição de pagamento, qual melhora adicional você consegue fazer no preço?`;
    }

    if(a.type==='price'){
      if(tone==='colaborativo')return `Entendo sua posição. Para buscarmos um ponto viável para os dois lados, preciso entender o que sustenta esse limite. Se houver uma contrapartida concreta em prazo, escopo ou condição, consigo avaliar ${next||'um próximo movimento'}.`;
      if(tone==='firme')return `Entendo a posição, mas não vou mover meu valor sem justificativa objetiva e contrapartida clara. Se esse é o limite econômico real, preciso saber o que muda em prazo, escopo ou condição para qualquer avanço.`;
      return `Entendo sua posição. Antes de mover meu número, preciso entender se esse é um limite econômico real ou uma posição de negociação. Se houver contrapartida concreta, consigo avaliar ${next||'o próximo movimento'}.`;
    }

    if(a.type==='time'){
      if(tone==='colaborativo')return `Consigo avaliar uma decisão mais rápida. Para que isso seja equilibrado, o que vocês conseguem melhorar em preço, condição ou escopo se eu antecipar o fechamento?`;
      if(tone==='firme')return `Urgência por si só não muda minha posição. Se vocês precisam do fechamento agora, preciso de uma contrapartida objetiva em preço, condição ou escopo.`;
      return `Consigo priorizar a decisão, mas velocidade precisa gerar valor para os dois lados. O que melhora na condição se eu antecipar o fechamento?`;
    }

    if(a.type==='authority'){
      if(tone==='colaborativo')return `Entendo que existe uma etapa de aprovação. Para eu ajudar a construir uma proposta que tenha chance real de aprovação, qual faixa e quais critérios sua gestão precisa ver?`;
      if(tone==='firme')return `Não vou reformular a proposta sem conhecer a alçada e o critério de aprovação. Preciso saber qual faixa você consegue defender internamente e o que exatamente libera a decisão.`;
      return `Para eu não reformular a proposta no escuro, o que exatamente a gestão precisa enxergar para aprovar: faixa, critério e condição?`;
    }

    if(a.type==='scope'){
      if(tone==='colaborativo')return `Podemos ajustar a construção do acordo. Se houver necessidade de reduzir preço, prefiro revisarmos juntos escopo, prazo e responsabilidades para preservar o resultado dos dois lados.`;
      if(tone==='firme')return `Não vou reduzir preço mantendo o mesmo escopo e o mesmo risco. Se o número precisa cair, precisamos retirar escopo, alterar prazo ou receber outra contrapartida objetiva.`;
      return `Podemos trabalhar o número, mas preço, escopo e risco precisam andar juntos. Mantendo o pacote atual, preservo minha referência. Se ajustarmos escopo, reavaliamos.`;
    }

    if(a.type==='competition'){
      if(tone==='colaborativo')return `É natural comparar alternativas. Para fazermos uma comparação justa, gostaria apenas de alinhar escopo, garantia, prazo e condição financeira. Se forem equivalentes, ajustamos a conversa a partir daí.`;
      if(tone==='firme')return `Só considero comparação válida em bases equivalentes. Se escopo, garantia, prazo e condição financeira forem diferentes, o menor preço isolado não é referência suficiente para eu mover minha posição.`;
      return `Faz sentido comparar. Quero apenas garantir equivalência de escopo, risco e condição financeira. Se a comparação for equivalente, ajustamos a conversa a partir disso.`;
    }

    if(tone==='colaborativo')return `Quero avançar e entender melhor a restrição. O que exatamente está impedindo o fechamento agora? Se identificarmos o ponto principal, podemos trabalhar uma solução sem criar concessões desnecessárias.`;
    if(tone==='firme')return `Não vou mover minha posição sem identificar a trava real. Preciso saber objetivamente se o problema é preço, prazo, pagamento, escopo, risco ou aprovação.`;
    return `Quero avançar, mas antes de mover minha posição preciso identificar a trava real. O que exatamente precisa mudar para fecharmos?`;
  }

  window.toneResponse = function(original){
    try{
      if(!window.state||!state.lastAnalysis)return previousToneResponse?previousToneResponse(original):original;
      return responseByTone(state.lastAnalysis,state.tone||'equilibrado',original);
    }catch(e){
      return previousToneResponse?previousToneResponse(original):original;
    }
  };

  /* Mantem toda a inteligencia v0.9.2 e apenas marca quem falou para a UI */
  window.sendCopilot = function(){
    const before=state&&Array.isArray(state.chat)?state.chat.length:0;
    const speaker=state&&state.speaker;
    previousSendCopilot();
    if(!state||!Array.isArray(state.chat))return;
    const added=state.chat.length-before;
    if(added>=2){
      const first=state.chat.length-2,second=state.chat.length-1;
      if(speaker==='me'){
        state.chat[first].role='me';
        state.chat[second].role='tool-own';
      }else{
        state.chat[first].role='counterparty';
        state.chat[second].role='tool-counterparty';
      }
      render();
    }
  };
})();
