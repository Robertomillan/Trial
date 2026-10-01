/* Negocia.AI v0.9.2 - leitura de quantidade, preço unitário, total e aceite */
const _v091BuildAnalysis=buildAnalysis;
const _v091AnalysisHTML=analysisHTML;
const _v091SendCopilot=sendCopilot;

function qtyFromTextV2(text){
  const t=String(text||'').toLowerCase();
  const patterns=[
    /\b(\d{1,3})\s*(?:unidades?|unid\.?|unds?\.?|peças?|pcs?\.?|itens?|equipamentos?|notebooks?|computadores?|carros?|veículos?|licenças?)\b/i,
    /\b(?:comprar|compro|compraria|levar|levo|levaria|fechar|fecho|fecharia|quero|preciso de|seriam?|são)\s+(?:só\s+|apenas\s+)?(\d{1,3})\b/i,
    /\b(?:mínimo|minimo|volume|quantidade)\s*(?:de|:)?\s*(\d{1,3})\b/i,
    /\b(?:fechado|aceito|combinado|pode ser|ok)[^\d]{0,20}(\d{1,3})\b/i,
    /\b(\d{1,3})\s*(?:mas|porém|porem)\s+por\b/i,
    /\b(?:tem que|precisa|deve)\s+(?:comprar|levar|fechar)\s+(\d{1,3})\b/i
  ];
  for(const re of patterns){const m=t.match(re);if(m){const q=Number(m[1]);if(q>=1&&q<=999)return q}}
  return null;
}
function perUnitSignalV2(text){return /\bcada\b|por\s+unidade|unit[aá]ri[oa]|\/\s*(?:un|und|unid)|cada\s+um/i.test(String(text||''))}
function priceConstraintV2(text){return /dentro\s+(?:desse|deste|do)\s+valor|no\s+m[aá]ximo|m[aá]ximo\s+de|at[eé]\s+r?\$?|n[aã]o\s+passa|n[aã]o\s+acima|teto/i.test(String(text||''))}
function acceptanceSignalV2(text){return /\bfechado\b|\baceito\b|\bcombinado\b|\bpode ser\b|\bneg[oó]cio fechado\b|\bok[,!.\s]/i.test(String(text||''))}
function quantityConditionSignalV2(text){return /por esse valor|nesse valor|neste valor|tem que comprar|precisa comprar|m[ií]nimo de|volume de|s[oó] consigo.*\d+|para esse pre[cç]o/i.test(String(text||''))}
function lastEventV2(n,speaker){return (n.events||[]).slice().reverse().find(e=>e.speaker===speaker)||null}
function eventStructureV2(e,n){if(!e)return null;if(e.structure)return e.structure;const offer=e.offer||(e.analysis&&e.analysis.offer)||extractOffer(e.text||'',n);const quantity=qtyFromTextV2(e.text||'');return {quantity,unitPrice:offer,total:quantity&&offer?quantity*offer:null,text:e.text||''}}
function lastCounterOfferV2(n){const e=(n.events||[]).slice().reverse().find(x=>x.speaker==='counterparty'&&((x.analysis&&x.analysis.offer)||x.offer));return e?((e.analysis&&e.analysis.offer)||e.offer):null}
function commercialStructureV2(text,n,speaker='counterparty'){
  let quantity=qtyFromTextV2(text);
  let offers=extractOffers(text,n),unitPrice=offers.length?offers[offers.length-1]:null;
  const own=eventStructureV2(lastEventV2(n,'me'),n);
  const prevCp=eventStructureV2(lastEventV2(n,'counterparty'),n);
  if(!unitPrice&&quantity&&quantityConditionSignalV2(text))unitPrice=lastCounterOfferV2(n);
  if(!quantity&&perUnitSignalV2(text)&&own&&own.quantity)quantity=own.quantity;
  if(!quantity&&acceptanceSignalV2(text)&&own&&own.quantity)quantity=own.quantity;
  const total=quantity&&unitPrice?quantity*unitPrice:null;
  const targetTotal=quantity?quantity*Number(n.target||0):null;
  const limitTotal=quantity?quantity*Number(n.limit||0):null;
  return {quantity,unitPrice,total,targetTotal,limitTotal,perUnit:!!(unitPrice&&(quantity||perUnitSignalV2(text))),priceConstraint:priceConstraintV2(text),text,speaker,own,prevCp};
}
function matchesOwnConditionV2(struct,n){
  const own=struct.own;if(!own)return false;
  const dir=direction(n),qOk=!own.quantity||!struct.quantity||own.quantity===struct.quantity;
  let pOk=true;
  if(own.unitPrice&&struct.unitPrice)pOk=dir==='down'?struct.unitPrice<=own.unitPrice:struct.unitPrice>=own.unitPrice;
  return qOk&&pOk&&(!!own.quantity||!!own.unitPrice);
}
function quantityInsightV2(s,n){
  if(!s.quantity)return null;
  const dir=direction(n),bits=[];
  if(s.unitPrice&&s.total){bits.push(`${s.quantity} un. × ${money(s.unitPrice)} = ${money(s.total)} no total.`)}
  if(s.targetTotal&&s.total){const diff=s.total-s.targetTotal;if(dir==='down'){if(diff<=0)bits.push(`O total fica ${money(Math.abs(diff))} melhor que o alvo equivalente para ${s.quantity} unidades.`);else bits.push(`O total fica ${money(diff)} acima do alvo equivalente para ${s.quantity} unidades.`)}else{if(diff>=0)bits.push(`O total supera o alvo equivalente em ${money(diff)}.`);else bits.push(`O total fica ${money(Math.abs(diff))} abaixo do alvo equivalente.`)}}
  if(quantityConditionSignalV2(s.text))bits.push('Quantidade virou moeda de troca. Compare desembolso total e necessidade real antes de aceitar desconto unitário condicionado a volume.');
  return bits.join(' ');
}
function buildAnalysis(text,n){
  const a=_v091BuildAnalysis(text,n),s=commercialStructureV2(text,n,'counterparty'),accept=acceptanceSignalV2(text)&&matchesOwnConditionV2(s,n),qCondition=!!(s.quantity&&quantityConditionSignalV2(text));
  a.structure=s;
  a.quantityInsight=quantityInsightV2(s,n);
  if(accept){
    a.type='acceptance';a.label='Aceite da sua condição';a.intent='A contraparte aceitou a estrutura econômica que você comunicou. Agora o foco muda de barganha para fechamento e proteção das condições.';a.status='Condição atendida';
    a.lever='Pare de disputar centavos depois de obter o que pediu. Use o momento para eliminar ambiguidades de escopo, impostos, frete, garantia, pagamento e entrega.';
    a.args=['A condição econômica comunicada foi atendida.','Confirme preço unitário, quantidade e valor total por escrito.','Feche termos acessórios antes de encerrar: especificação, frete, impostos, garantia, pagamento e prazo de entrega.'];
    a.questions=['Só confirmando: esse valor é por unidade e vale para a quantidade combinada, sem custo adicional de frete ou imposto?','Qual é o prazo de entrega, condição de pagamento e garantia aplicável?'];
    a.concession='Nenhuma concessão adicional é necessária para fechar o preço. Se surgir nova exigência, trate como nova troca de valor.';
    a.dont='Não reabra o preço depois de a contraparte aceitar exatamente a condição que você propôs. Isso pode destruir confiança e perder um acordo já ganho.';
    a.next=s.unitPrice||a.next;
    const q=s.quantity||(s.own&&s.own.quantity),p=s.unitPrice||(s.own&&s.own.unitPrice),tot=q&&p?q*p:null;
    a.nextMove=`Pare de negociar preço. Confirme o fechamento${q?` de ${q} unidade${q>1?'s':''}`:''}${p?` a ${money(p)} por unidade`:''}${tot?`, total de ${money(tot)}`:''}, valide as condições comerciais e peça confirmação por escrito.`;
    a.response=`“Perfeito. Então fechamos${q?` ${q} unidade${q>1?'s':''}`:''}${p?` a ${money(p)} cada`:''}${tot?`, total de ${money(tot)}`:''}. Só confirmando antes de concluir: especificação correta, impostos e frete incluídos conforme combinado, condição de pagamento, garantia e prazo de entrega. Me confirme esses pontos e seguimos com o fechamento.”`;
    return a;
  }
  if(qCondition){
    a.type='quantity';a.label='Quantidade / volume';a.intent='A contraparte está condicionando preço a volume. Isso pode melhorar o preço unitário e piorar o resultado econômico total.';
    a.lever='Trate quantidade como concessão de valor. Só aumente volume se houver demanda real, redução de custo total ou benefício que compense estoque, caixa e risco.';
    const insight=a.quantityInsight||'';
    a.args=[insight||'Calcule preço unitário e desembolso total antes de aceitar o volume.','Compare a quantidade pedida com sua necessidade real, não apenas com o desconto aparente.','Se aceitar mais volume, exija preço unitário melhor, prazo ou outra contrapartida proporcional.'];
    a.questions=['Qual é o preço unitário para a quantidade que eu realmente preciso?','Se eu aumentar o volume, qual redução adicional por unidade você consegue conceder?','O que muda em frete, prazo, garantia ou pagamento com esse volume?'];
    a.concession=`Não aumente a quantidade apenas para preservar o preço. Se houver interesse real em ${s.quantity} unidades, condicione o volume a uma melhora econômica adicional.`;
    a.dont='Não confunda redução de preço unitário com saving se o desembolso total subir ou se você comprar volume sem necessidade.';
    a.nextMove=`${insight} Antes de mover preço, escolha a quantidade economicamente necessária e negocie preço unitário e total como um pacote.`;
    a.response=`“Entendi que esse preço está condicionado a ${s.quantity} unidades. Antes de aumentar volume, preciso olhar o custo total. Para a quantidade que eu realmente preciso, qual é o melhor preço unitário? Se eu assumir ${s.quantity}, preciso de uma contrapartida econômica adicional.”`;
  }
  return a;
}
function structureCardV2(a){const s=a&&a.structure;if(!s||!s.quantity)return'';const tone=a.type==='acceptance'?'teal':'';return `<div class="card ${tone}"><h3>Estrutura do acordo</h3><div class="intel-grid"><div class="intel-metric"><b>${s.quantity}</b><span>Quantidade</span></div><div class="intel-metric"><b>${s.unitPrice?money(s.unitPrice):'Não informado'}</b><span>Preço unitário</span></div><div class="intel-metric"><b>${s.total?money(s.total):'A calcular'}</b><span>Valor total</span></div><div class="intel-metric"><b>${s.targetTotal?money(s.targetTotal):'-'}</b><span>Alvo total equivalente</span></div></div>${a.quantityInsight?`<p class="tiny" style="margin-bottom:0">${a.quantityInsight}</p>`:''}</div>`}
function analysisHTML(a){return structureCardV2(a)+_v091AnalysisHTML(a)}
function sendCopilot(){
  const el=document.getElementById('copilotText'),t=el&&el.value.trim();if(!t)return;const n=getCurrent();
  if(state.speaker==='me'){
    const ownOffer=extractOffer(t,n),structure=commercialStructureV2(t,n,'me'),parts=[];
    if(structure.quantity)parts.push(`${structure.quantity} unidade${structure.quantity>1?'s':''}`);if(ownOffer)parts.push(`${money(ownOffer)}${structure.quantity?' por unidade':''}`);if(structure.total)parts.push(`total ${money(structure.total)}`);
    state.chat.push({role:'user',text:t},{role:'ai',text:`Sua posição foi registrada${parts.length?': '+parts.join(' · '):''}. Vou usar quantidade, preço unitário e total para avaliar a próxima resposta da contraparte.`});
    n.events.push({at:new Date().toISOString(),speaker:'me',text:t,offer:ownOffer,structure});state.lastAnalysis=null;
  }else{
    const a=buildAnalysis(t,n);state.chat.push({role:'user',text:t},{role:'ai',text:`${a.structure&&a.structure.quantity?`Quantidade percebida: ${a.structure.quantity}. `:''}${a.offer?`Preço percebido: ${money(a.offer)}${a.structure&&a.structure.quantity?' por unidade':''}. `:''}${a.structure&&a.structure.total?`Total econômico: ${money(a.structure.total)}. `:''}${a.type==='acceptance'?'A condição comunicada foi aceita. ':a.payment?'A condição financeira foi convertida em valor econômico. ':''}Abaixo está a leitura tática desta rodada.`});state.lastAnalysis=a;n.events.push({at:new Date().toISOString(),speaker:'counterparty',text:t,analysis:a,structure:a.structure});
  }
  const data=db.get(),i=data.negotiations.findIndex(x=>x.id===n.id);data.negotiations[i]=n;db.set(data);render();
}
