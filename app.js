/* Consulta de referência; nenhuma escrita no PEC, persistência ou apuração. */
(() => {
"use strict";
const $=id=>document.getElementById(id);
const data=window.ZERA_APS_DATA;
if(!Array.isArray(data?.cards)){ $("empty").textContent="Base indisponível."; return; }
  const actions = {
    "C5-A": [
      "consulta",
      "Consulta e condição registrada",
      "Localize a consulta e confira a condição na Avaliação e na lista de problemas.",
      "medical",
    ],
    "C4-A": [
      "consulta",
      "Consulta e condição registrada",
      "Localize a consulta e confira a condição na Avaliação e na lista de problemas.",
      "medical",
    ],
    "C5-B": [
      "pa",
      "Pressão arterial",
      "Confira o valor registrado no campo de pressão arterial do PEC.",
      "medical",
    ],
    "C4-B": [
      "pa",
      "Pressão arterial",
      "Confira o valor registrado no campo de pressão arterial do PEC.",
      "medical",
    ],
    "C5-C": [
      "peso-altura",
      "Peso e altura",
      "Confira se peso e altura estão nos campos próprios e na mesma data.",
      "medical",
    ],
    "C4-C": [
      "peso-altura",
      "Peso e altura",
      "Confira se peso e altura estão nos campos próprios e na mesma data.",
      "medical",
    ],
    "C5-D": [
      "visitas",
      "Visitas domiciliares com o ACS",
      "Confira com a equipe as datas e os registros das visitas no e-SUS Território.",
      "team",
    ],
    "C4-D": [
      "visitas",
      "Visitas domiciliares com o ACS",
      "Confira com a equipe as datas e os registros das visitas no e-SUS Território.",
      "team",
    ],
    "C4-E": [
      "hba1c",
      "Registro da HbA1c",
      "Diferencie a solicitação do exame da avaliação de um resultado existente.",
      "medical",
    ],
    "C4-F": [
      "pes",
      "Registro do exame dos pés",
      "Se o exame foi realizado, confira a descrição e o procedimento correspondente.",
      "medical",
    ],
    "C3-A": [
      "inicio-prenatal",
      "Início do pré-natal",
      "Confira a DUM estruturada, a consulta inicial e o registro da gestação.",
      "medical",
    ],
    "C3-B": [
      "consultas-prenatal",
      "Consultas de pré-natal",
      "Confira as consultas no histórico e os campos estruturados de pré-natal.",
      "medical",
    ],
    "C3-C": [
      "pa-prenatal",
      "Pressão arterial no pré-natal",
      "Localize as aferições registradas durante a gestação.",
      "medical",
    ],
    "C3-D": [
      "peso-prenatal",
      "Peso e altura no pré-natal",
      "Confira os pares de registros na mesma data durante a gestação.",
      "medical",
    ],
    "C3-E": [
      "visitas-prenatal",
      "Visitas do ACS no pré-natal",
      "Confira as visitas com a equipe, considerando a fase da gestação.",
      "team",
    ],
    "C3-F": [
      "dtpa",
      "Registro da dTpa",
      "Confira a aplicação ou a transcrição de vacinação comprovada.",
      "team",
    ],
    "C3-G": [
      "testes-primeiro",
      "Testes do primeiro trimestre",
      "Confira os registros de sífilis, HIV e hepatites B e C no primeiro trimestre.",
      "medical",
    ],
    "C3-H": [
      "testes-terceiro",
      "Testes do terceiro trimestre",
      "Confira os registros de sífilis e HIV no terceiro trimestre.",
      "medical",
    ],
    "C3-I": [
      "consulta-puerperio",
      "Consulta puerperal",
      "Confira a consulta no puerpério e a data de desfecho da gestação no PEC.",
      "medical",
    ],
    "C3-J": [
      "visita-puerperio",
      "Visita do ACS no puerpério",
      "Confira com o ACS o registro da visita puerperal no e-SUS Território.",
      "team",
    ],
    "C3-K": [
      "bucal-gestacao",
      "Saúde bucal na gestação",
      "Confira com a odontologia o atendimento realizado durante a gestação.",
      "team",
    ],
    "C7-A": [
      "colo",
      "Registro do rastreamento do colo",
      "Confira modalidade, faixa etária e histórico antes de interpretar o componente.",
      "medical",
    ],
    "C7-B": [
      "hpv",
      "Registro da vacinação HPV",
      "Confira com a vacinação o registro e a elegibilidade do componente.",
      "team",
    ],
    "C7-C": [
      "sexual",
      "Atendimento de saúde sexual e reprodutiva",
      "Confira se o código da Avaliação corresponde ao atendimento realizado.",
      "medical",
    ],
    "C7-D": [
      "mama",
      "Registro do rastreamento de mama",
      "Diferencie solicitação e avaliação do exame e confira elegibilidade e histórico.",
      "medical",
    ],
  };


const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v??"").toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const unique=a=>[...new Set(a)];
const safeUrl=v=>{try{const u=new URL(v);return u.protocol==="https:"?u.href:"";}catch{return "";}};
const sources=(rule)=>[["Guia PEC",rule.source],["Nota metodológica",rule.methodology_source]].filter(([,v])=>safeUrl(v));
const checks=[...document.querySelectorAll(".conditions input")];
const reviewed=new Set(); let active="",visibleGroups=[];
const phaseOf=(card,rule)=>card.id==="prenatal"?rule.phase:card.id;
const selected=()=>checks.filter(c=>c.checked).map(c=>c.value);
function ruleCodes(rule,card){
 const list=[...(rule.codes||[])];
 if(["C4-A","C5-A","C3-A","C3-I"].includes(rule.id)){
   for(const [key,values] of Object.entries(card.codes||{})) if(Array.isArray(values)) for(const value of values)
     list.push({system:key==="ciap2"?"CIAP-2":key.startsWith("cid10")?"CID-10":key,value,label:"Referência diagnóstica; confirmar pertinência."});
 }
 return list;
}
function groupsFor(selection,query){
 const map=new Map();
 for(const card of data.cards){
   if(String(card.status).startsWith("awaiting")) continue;
   for(const rule of card.rules||[]){
     if(String(rule.status).startsWith("awaiting")) continue;
     if(selection.length&&!selection.includes(phaseOf(card,rule))) continue;
     const [key,title,instruction,lane]=actions[rule.id]||[rule.id,rule.title,"Conferir critério e fonte.","medical"];
     if(!map.has(key)) map.set(key,{key,title,instruction,lane,variants:[]});
     map.get(key).variants.push({rule,card});
   }
 }
 return [...map.values()].filter(g=>!query||norm([g.title,g.instruction,...g.variants.map(v=>JSON.stringify(v))].join(" ")).includes(query)).sort((a,b)=>(a.lane==="team")-(b.lane==="team"));
}
function codesFor(g){const m=new Map();for(const {rule,card} of g.variants)for(const c of ruleCodes(rule,card))m.set(c.system+"|"+c.value,c);return [...m.values()];}
function pathText(path){return path.replace(/^Atendimento individual\s*(?:\/|→)\s*/,"").replace(/^SOAP\s*→\s*/,"");}
function row(g){
 const paths=unique(g.variants.map(v=>pathText(v.rule.pec_location)));
 const codes=codesFor(g);
 const shown=codes.length>4?codes.slice(0,3):codes;
 const copyButtons=shown.map(c=>'<button class="code-button" type="button" data-copy="'+esc(c.value)+'" aria-label="Copiar '+esc(c.system+" "+c.value)+'" title="'+esc(c.system+" "+(c.label||""))+'">'+esc(c.value)+'</button>').join("");
 return '<tr data-action="'+esc(g.key)+'"><td><button class="row-title" type="button" data-detail="'+esc(g.key)+'" aria-pressed="'+(active===g.key)+'">'+esc(g.title)+'</button><span class="meta">'+esc(g.variants.map(v=>v.rule.id).join(" / "))+'</span></td><td>'+g.variants.map(({rule})=>'<div class="criterion-short"><strong>'+esc(rule.window)+'</strong><span class="meta">'+esc(rule.goal)+'</span></div>').join("")+'</td><td>'+paths.map(p=>'<div class="criterion-short">'+esc(p)+'</div>').join("")+'</td><td>'+copyButtons+(codes.length>shown.length?'<button class="code-button" data-detail="'+esc(g.key)+'" type="button">+'+(codes.length-shown.length)+' códigos</button>':"")+g.variants.map(({rule})=>'<label class="check"><input type="checkbox" data-review="'+esc(rule.id)+'" '+(reviewed.has(rule.id)?"checked":"")+' aria-label="Conferir '+esc(rule.id)+'"> '+esc(rule.id)+' conferido</label>').join("")+'</td></tr>';
}
function showDetail(key,focus=false){
 const g=visibleGroups.find(v=>v.key===key);
 active=g?key:"";
 document.querySelectorAll(".row-title").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.detail===active)));
 $("close-detail").hidden=!g;
 $("detail-title").textContent=g?g.title:"Detalhes";
 $("detail-content").innerHTML=g?'<p>'+esc(g.instruction)+'</p>'+g.variants.map(({rule,card})=>'<section class="criterion"><h3>'+esc(rule.id+" · "+rule.title)+'</h3><p><strong>Critério:</strong> '+esc(rule.goal)+' · '+esc(rule.window)+'</p><p><strong>PEC:</strong> '+esc(rule.pec_location)+'</p><p><strong>Responsável:</strong> '+esc(rule.actor)+'</p>'+((rule.cautions||[]).length?'<ul>'+rule.cautions.map(c=>'<li>'+esc(c)+'</li>').join("")+'</ul>':"")+'<div class="code-list">'+ruleCodes(rule,card).map(c=>'<div><button class="code-button" data-copy="'+esc(c.value)+'" type="button" aria-label="Copiar '+esc(c.system+" "+c.value)+'">'+esc(c.value)+'</button> '+esc(c.system+" · "+(c.label||""))+'</div>').join("")+'</div>'+sources(rule).map(([label,url])=>'<a class="source" href="'+esc(safeUrl(url))+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>').join("")+'</section>').join(""):'<p class="note">Selecione um registro para consultar critérios, códigos, responsabilidades e fontes.</p>';
 if(g&&focus&&matchMedia("(max-width:900px)").matches){$("detail").scrollIntoView({block:"nearest"});}
}
function render(){
 const selection=selected(),query=norm($("search").value.trim());
 visibleGroups=selection.length||query?groupsFor(selection,query):[];
 const has=visibleGroups.length>0;
 $("results").hidden=!has;$("empty").hidden=has;
 $("empty").textContent=selection.length||query?"Nenhum registro encontrado.":"Selecione uma condição ou busque qualquer registro.";
 $("count").textContent=has?visibleGroups.length+" registros":"";
 $("copy-map").disabled=!has;
 const medical=visibleGroups.filter(g=>g.lane!=="team"),team=visibleGroups.filter(g=>g.lane==="team");
 $("rows").innerHTML=medical.map(row).join("")+(team.length?'<tr class="group-separator"><th colspan="4" scope="rowgroup">Conferir com a equipe responsável</th></tr>'+team.map(row).join(""):"");
 showDetail(active);
}
// Links da página comercial abrem somente linhas e critérios existentes na base.
function openLandingSelection() {
  const params = new URLSearchParams(location.search);
  const criterion = params.get("criterio");
  const line = params.get("linha");
  let selection = line === "cronicos" ? ["has", "dm"] : [line];
  let detail = "";
  if (criterion) {
    for (const card of data.cards) {
      const rule = card.rules.find(item => item.id === criterion);
      if (rule && Object.hasOwn(actions, rule.id)) {
        selection = [phaseOf(card, rule)];
        detail = actions[rule.id][0];
        break;
      }
    }
  }
  checks.forEach(input => { input.checked = selection.includes(input.value); });
  render();
  if (detail) showDetail(detail, true);
}
function reset(){
 const url = new URL(location.href);
 if (url.searchParams.has("criterio") || url.searchParams.has("linha")) {
   url.searchParams.delete("criterio");
   url.searchParams.delete("linha");
   history.replaceState(null, "", url);
 }
 checks.forEach(c=>c.checked=false);reviewed.clear();active="";$("search").value="";$("copy-status").textContent="";$("copy-fallback").hidden=true;$("copy-fallback").value="";render();$("search").focus();
}
function copyMap(){
 return ["ROTEIRO DE CONFERÊNCIA — NÃO COLAR NO PRONTUÁRIO","Histórico não verificado. Conferir registro real e elegibilidade.",...visibleGroups.flatMap(g=>[g.title,...g.variants.map(({rule,card})=>rule.id+" | "+rule.goal+" | "+rule.window+" | "+rule.pec_location+" | Responsável: "+rule.actor+" | "+ruleCodes(rule,card).map(c=>c.system+" "+c.value).join("; "))])].join("\n");
}
async function copy(text){
 $("copy-fallback").hidden=true;$("copy-fallback").value="";
 try{await navigator.clipboard.writeText(text);$("copy-status").textContent="Copiado.";}
 catch{$("copy-fallback").value=text;$("copy-fallback").hidden=false;$("copy-fallback").select();$("copy-status").textContent="Selecione e copie manualmente.";}
}
checks.forEach(c=>c.addEventListener("change",()=>{
 if(c.checked&&["gestacao","puerperio"].includes(c.value)) checks.filter(other=>other!==c&&["gestacao","puerperio"].includes(other.value)).forEach(other=>other.checked=false);
 render();
}));
$("search").addEventListener("input",render);
$("new-visit").addEventListener("click",reset);
$("close-detail").addEventListener("click",()=>showDetail(""));
$("copy-soap").addEventListener("click",()=>copy("S: \nO: \nA: \nP: "));
$("copy-map").addEventListener("click",()=>copy(copyMap()));
document.addEventListener("click",e=>{const b=e.target.closest("[data-copy],[data-detail]");if(!b)return;if(b.dataset.copy)copy(b.dataset.copy);else showDetail(b.dataset.detail,true);});
$("rows").addEventListener("change",e=>{const id=e.target.dataset.review;if(!id)return;if(e.target.checked)reviewed.add(id);else reviewed.delete(id);});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){showDetail("");}if(e.key==="/"&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)){e.preventDefault();$("search").focus();}});
window.addEventListener("pageshow",e=>{if(e.persisted)reset();});
$("base-date").textContent="Base documental: "+(data.reviewed_on||"data não informada")+" · Manual PEC: "+(data.pec_manual_review?.version||"não informado")+" · Sem acesso ao histórico ou cálculo de pontuação. Valide a instalação local.";
openLandingSelection();
})();
