/* Salário.IA | consulta local a catálogo CBO e benchmarks agregados.
   Nenhum valor de salário informado pelo usuário é enviado ao servidor. */
(function(){
"use strict";
var autoFilled=false, occupations=[],catalogLoaded=false;
function byId(id){return document.getElementById(id)}
function status(s){var el=byId("marketStatus");if(el)el.textContent=s}
function fold(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function closeMatches(){var list=byId("marketMatches");list.hidden=true;byId("marketOccupation").setAttribute("aria-expanded","false")}
function clearAutomatic(){
 if(autoFilled){["m25","m50","m75"].forEach(function(k){byId(k).value=""});autoFilled=false;if(typeof updatePremium==="function")updatePremium()}
}
async function loadCatalog(){
 if(catalogLoaded)return;
 var response=await fetch("./cbo-ocupacoes.json",{cache:"force-cache"});
 if(!response.ok)throw Error("Catálogo indisponível");
 var data=await response.json();
 if(!Array.isArray(data.occupations))throw Error("Formato inválido");
 occupations=data.occupations.filter(function(x){return /^\d{6}$/.test(x.cbo)&&typeof x.name==="string"});
 catalogLoaded=true;
}
function selectOccupation(item){
 byId("marketCbo").value=item.cbo;
 byId("marketOccupation").value=item.name;
 byId("selectedOccupation").textContent="CBO "+item.cbo+" • "+item.name;
 closeMatches();
 clearAutomatic();
 status("Ocupação selecionada. A base salarial oficial ainda está em preparação.");
}
function showMatches(){
 var query=fold(byId("marketOccupation").value),list=byId("marketMatches");
 list.replaceChildren();
 if(query.length<2){closeMatches();return}
 var digits=query.replace(/\D/g,"");
 var hits=occupations.filter(function(item){return fold(item.name).includes(query)||(digits.length>=3&&item.cbo.includes(digits))}).slice(0,35);
 if(!hits.length){closeMatches();byId("selectedOccupation").textContent="Nenhuma ocupação encontrada. Tente outro termo ou código.";return}
 hits.forEach(function(item){
  var button=document.createElement("button");
  button.type="button";
  button.setAttribute("role","option");
  button.textContent=item.name+" • "+item.cbo;
  button.addEventListener("click",function(){selectOccupation(item)});
  list.appendChild(button);
 });
 list.hidden=false;
 byId("marketOccupation").setAttribute("aria-expanded","true");
}
window.lookupMarket=async function(){
 var cbo=byId("marketCbo").value,uf=byId("marketUf").value;
 if(!cbo){status("Escolha uma ocupação na lista de resultados da pesquisa.");return}
 if(window.lastMode!=="clt"){status("O Novo CAGED informa salários CLT, não notas fiscais PJ. Esta comparação precisa de benchmark PJ específico ou conversão fundamentada.");return}
 status("Consultando a base agregada...");
 try{
  var response=await fetch("./market-data.json",{cache:"no-store"});
  if(!response.ok)throw Error("HTTP "+response.status);
  var data=await response.json();
  if(data.schema_version!==1||!Array.isArray(data.records))throw Error("Schema inválido");
  var item=data.records.find(function(x){return x.cbo===cbo&&x.uf===uf&&x.n>=30&&[x.p25,x.p50,x.p75].every(function(v){return typeof v==="number"&&Number.isFinite(v)&&v>0})&&x.p25<=x.p50&&x.p50<=x.p75});
  if(!item){
   clearAutomatic();
   status(data.records.length?"Sem amostra suficiente para esta ocupação e UF. Nenhuma faixa será inventada.":"Sem dados salariais ainda: o catálogo CBO foi carregado, mas os microdados oficiais do CAGED ainda não foram processados. Os percentis permanecem em branco.");
   return;
  }
  byId("m25").value=item.p25;
  byId("m50").value=item.p50;
  byId("m75").value=item.p75;
  autoFilled=true;
  status("Fonte: "+data.source+" | "+data.dataset+" | "+data.period_start+" a "+data.period_end+" | n="+item.n+" admissões | "+byId("marketUf").selectedOptions[0].text+". Salários CLT brutos, sem benefícios.");
  if(typeof updatePremium==="function")updatePremium();
 }catch(e){clearAutomatic();status("Não foi possível consultar a base agregada. Você pode informar uma pesquisa salarial comparável.")}
};
async function checkDataAvailability(){
 var button=document.querySelector(".marketLookupButton");
 if(!button)return;
 try{
  var response=await fetch("./market-data.json",{cache:"no-store"});
  if(!response.ok)throw Error("sem base");
  var data=await response.json();
  if(!Array.isArray(data.records)||!data.records.length){
   button.disabled=true;
   button.textContent="Base salarial em preparação";
   status("A busca de profissões já funciona, mas ainda não existem salários oficiais carregados. Para avaliar a proposta agora, informe P25, P50 e P75 de uma pesquisa comparável.");
  }else{
   button.disabled=false;
   button.textContent="Consultar salários oficiais";
   status("Base oficial disponível. Pesquise sua profissão e consulte os percentis por localização.");
  }
 }catch(e){
  button.disabled=true;
  button.textContent="Base salarial indisponível";
  status("Não foi possível carregar a base salarial. Informe referências de uma pesquisa comparável.");
 }
}
checkDataAvailability();
var input=byId("marketOccupation");
if(input){
 input.addEventListener("focus",async function(){
  if(!catalogLoaded){
   byId("selectedOccupation").textContent="Carregando catálogo de profissões...";
   try{await loadCatalog();byId("selectedOccupation").textContent="Digite pelo menos 2 letras para pesquisar entre "+occupations.length+" ocupações.";showMatches()}
   catch(e){byId("selectedOccupation").textContent="Catálogo indisponível. Tente novamente mais tarde."}
  }else showMatches();
 });
 input.addEventListener("input",function(){
  byId("marketCbo").value="";
  clearAutomatic();
  byId("selectedOccupation").textContent="Selecione uma ocupação sugerida para consultar os salários.";
  showMatches();
 });
 input.addEventListener("keydown",function(e){if(e.key==="Escape")closeMatches()});
 document.addEventListener("click",function(e){if(!e.target.closest(".occupationField"))closeMatches()});
}
var uf=byId("marketUf");if(uf)uf.addEventListener("change",function(){clearAutomatic()});
["m25","m50","m75"].forEach(function(id){
 var el=byId(id);
 if(el)el.addEventListener("input",function(){if(autoFilled){autoFilled=false;status("Percentis alterados manualmente. Confira fonte, período, cargo e localidade.")}});
});
})();
