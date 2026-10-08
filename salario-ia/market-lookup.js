/* Salário.IA | local, aggregated benchmark lookup.
   Only fetches a same-origin JSON file. No salary inputs or personal data are sent. */
(function(){
"use strict";
var autoFilled=false;
function status(s){var el=document.getElementById("marketStatus");if(el)el.textContent=s}
function clearAutomatic(){
 if(autoFilled){["m25","m50","m75"].forEach(function(k){document.getElementById(k).value=""});autoFilled=false;if(typeof updatePremium==="function")updatePremium()}
}
window.lookupMarket=async function(){
 var cbo=document.getElementById("marketCbo").value,uf=document.getElementById("marketUf").value;
 if(!cbo){status("Selecione uma ocupação CBO.");return}
 if(window.lastMode!=="clt"){status("Consulta oficial indisponível para valores PJ. Os dados do CAGED são salários CLT, não notas fiscais PJ.");return}
 status("Consultando base agregada...");
 try{
  var response=await fetch("./market-data.json",{cache:"no-store"});
  if(!response.ok)throw Error("HTTP "+response.status);
  var data=await response.json();
  if(data.schema_version!==1||!Array.isArray(data.records))throw Error("Schema inválido");
  var item=data.records.find(function(x){return x.cbo===cbo&&x.uf===uf&&x.n>=30&&[x.p25,x.p50,x.p75].every(function(v){return typeof v==="number"&&Number.isFinite(v)&&v>0})&&x.p25<=x.p50&&x.p50<=x.p75});
  if(!item){
   clearAutomatic();
   status(data.records.length?"Não há amostra suficiente para esta ocupação e UF. Nenhuma faixa será inventada.":"A base oficial ainda não foi processada. O mecanismo de consulta está pronto, mas não há percentis publicados.");
   return;
  }
  document.getElementById("m25").value=item.p25;
  document.getElementById("m50").value=item.p50;
  document.getElementById("m75").value=item.p75;
  autoFilled=true;
  status("Fonte: "+data.source+" | "+data.dataset+" | "+data.period_start+" a "+data.period_end+" | n="+item.n+" admissões | "+document.getElementById("marketUf").selectedOptions[0].text+". Salários CLT brutos, sem benefícios.");
  if(typeof updatePremium==="function")updatePremium();
 }catch(e){clearAutomatic();status("Falha ao consultar a base agregada. Você ainda pode informar uma pesquisa salarial comparável.")}
};
["m25","m50","m75"].forEach(function(id){
 var el=document.getElementById(id);
 if(el)el.addEventListener("input",function(){if(autoFilled){autoFilled=false;status("Percentis alterados manualmente. Confira fonte, período, cargo e localidade.")}});
});
})();
