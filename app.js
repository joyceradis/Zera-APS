/* Zera-APS — interface estática, sem APIs, persistência, cookies ou dados de pacientes. */
(() => {
  'use strict';
  const data = window.ZERA_APS_DATA;
  if (!data || !Array.isArray(data.cards)) {
    document.getElementById('rule-list').textContent = 'Base de orientações não encontrada. Verifique data/regras.js.';
    return;
  }
  const $ = (id) => document.getElementById(id);
  const icons = {has:'♥',dm:'◈',prenatal:'✦',mulher:'♀',mental:'◎'};
  const checked = new Set();
  const expanded = new Set();
  let selected = 'has';
  let query = '';
  let showAllCodes = false;
  let toastTimer;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const normalize = (s) => String(s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const cards = data.cards;
  const currentCard = () => cards.find(c => c.id === selected) || cards[0];

  function toast(msg) {
    $('toast').textContent = msg;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
  }
  async function copy(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const el = document.createElement('textarea');
        el.value = value; el.style.position = 'fixed'; el.style.opacity = '0'; document.body.appendChild(el);
        el.focus(); el.select();
        const ok = document.execCommand('copy');
        el.remove();
        if (!ok) throw new Error('Cópia indisponível');
      }
      toast('Código copiado: ' + value);
    } catch (err) { toast('Não foi possível copiar automaticamente. Selecione o código.'); }
  }
  function renderModules() {
    $('modules').innerHTML = cards.map(c => `<button type="button" class="module-card ${selected===c.id?'active':''}" aria-pressed="${selected===c.id}" data-module="${esc(c.id)}"><span class="module-icon" aria-hidden="true">${icons[c.id]||'+'}</span><strong>${esc(c.title)}</strong><small>${c.indicator?`Indicador ${esc(c.indicator)}`:'Mapeamento pendente'}</small></button>`).join('');
    $('modules').querySelectorAll('[data-module]').forEach(btn => btn.addEventListener('click', () => {
      selected = btn.dataset.module;
      query = ''; $('search').value = ''; showAllCodes = false;
      render();
    }));
  }
  function getSearchRules() {
    if (!query.trim()) return currentCard().rules.map(r=>({rule:r,card:currentCard()}));
    const q = normalize(query).trim();
    return cards.flatMap(card=>(card.rules||[]).filter(r=> normalize([card.title,card.indicator,r.id,r.title,r.goal,r.window,r.actor,r.pec_location,(r.codes||[]).map(z=>z.value).join(' '),...(r.cautions||[])].join(' ')).includes(q)).map(rule=>({rule,card})));
  }
  function getCodes() {
    const all=[]; const seen=new Set();
    const relevant = query.trim() ? cards : [currentCard()];
    for(const card of relevant){
      for(const rule of card.rules||[]) for(const code of rule.codes||[]){
        const key=`${code.system}|${code.value}`;
        if(!seen.has(key)) { seen.add(key); all.push({system:code.system,value:code.value,label:code.label||rule.title,card:card.title}); }
      }
      for(const [system,codes] of Object.entries(card.codes||{})) for(const value of codes||[]){
        const sys = system==='cid10'?'CID-10':system==='ciap2'?'CIAP-2':system.toUpperCase();
        const key=`${sys}|${value}`;
        if(!seen.has(key)) { seen.add(key); all.push({system:sys,value,label:`Código de referência • ${card.title}. Confirmar indicação antes de utilizar.`,card:card.title}); }
      }
    }
    if(query.trim()) {
      const q=normalize(query).trim();
      return all.filter(c => normalize(`${c.system} ${c.value} ${c.label} ${c.card}`).includes(q));
    }
    // Prioridade para códigos usuais de referência no cartão de hipertensão
    if(selected==='has') {
      const first=['03.01.10.003-9','I10','K86','01.01.04.008-3','01.01.04.007-5'];
      all.sort((a,b)=>{
        const x=first.indexOf(a.value),y=first.indexOf(b.value);
        return (x<0?999:x)-(y<0?999:y);
      });
    }
    return all;
  }
  function renderCodes(){
    const codes=getCodes();
    const n=showAllCodes?codes.length:Math.min(codes.length,6);
    if(!codes.length){ $('code-list').innerHTML='<div class="empty"><strong>Nenhum código correspondente</strong><p>Tente outro termo ou selecione uma área diferente.</p></div>';return; }
    $('code-list').innerHTML = codes.slice(0,n).map(c=>`<div class="code-row"><div><span class="code-type">${esc(c.system)}</span><button type="button" class="copy-btn" data-copy="${esc(c.value)}" aria-label="Copiar ${esc(c.value)}">Copiar</button></div><div class="code-value">${esc(c.value)}</div><p class="code-label">${esc(c.label)}</p></div>`).join('') +(codes.length>6?`<button type="button" class="button-outline" style="margin-top:12px;width:100%;height:36px" id="show-codes">${showAllCodes?'Mostrar menos':`Ver mais ${codes.length-6} códigos`}</button>`:'');
    $('code-list').querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>copy(btn.dataset.copy)));
    const more=$('show-codes'); if(more) more.addEventListener('click',()=>{showAllCodes=!showAllCodes;renderCodes();});
  }
  function ruleMarkup(rule,card){
    const isOpen=expanded.has(rule.id),isChecked=checked.has(rule.id);
    const extra = query.trim() && card.id!==selected ? `<span class="code-chip">${esc(card.title)}</span> `:'';
    const codes=(rule.codes||[]).map(c=>`<span class="code-chip">${esc(c.system)} ${esc(c.value)}</span>`).join('');
    const caution=(rule.cautions||[]).length?`<div class="caution"><strong>Atenção:</strong><ul style="margin:6px 0 0;padding-left:17px">${rule.cautions.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></div>`:'';
    return `<article class="rule ${isOpen?'open':''}" data-rule="${esc(rule.id)}"><div class="rule-summary"><label class="checkbox-label"><input type="checkbox" class="rule-checkbox" data-check="${esc(rule.id)}" ${isChecked?'checked':''} aria-label="Marquei como revisado: ${esc(rule.title)}" /><span><span class="rule-title">${esc(rule.title)}</span><span class="rule-meta">${extra}${esc(rule.id)} · ${esc(rule.goal||'Orientação')} · ${esc(rule.window||'Conforme contexto')}</span></span></label><button type="button" class="rule-toggle" data-toggle="${esc(rule.id)}" aria-expanded="${isOpen}" aria-label="${isOpen?'Ocultar':'Ver'} detalhes de ${esc(rule.title)}">${isOpen?'Ocultar −':'Ver detalhes +'}</button></div><div class="rule-body"><div class="rule-body-row"><strong>Profissional</strong><p>${esc(rule.actor||'Consultar regra')}</p></div><div class="rule-body-row"><strong>Onde no PEC</strong><p>${esc(rule.pec_location||'Local a validar')}</p></div><div class="rule-body-row"><strong>Referências</strong><div class="code-chips">${codes||'<span style="color:#8c96a9;font-size:11px">Sem código único definido neste componente.</span>'}</div></div>${caution}<p style="margin:12px 0 0"><a class="source-link" href="https://sisaps.saude.gov.br/sistemas/esusaps/docs/guias-preenchimento%20Atual/equipeaps/" target="_blank" rel="noopener noreferrer">Consultar fonte oficial ↗</a></p></div></article>`;
  }
  function renderRules(){
    const matches = getSearchRules();
    if(currentCard().rules.length===0 && !query.trim()){
      $('rule-list').innerHTML='<div class="empty"><strong>Conteúdo ainda não homologado</strong><p>Não existe uma regra única para toda a saúde mental. Este card está reservado para mapeamento por situação clínica, sem inventar códigos ou condutas.</p></div>';
    }else if(!matches.length){
      $('rule-list').innerHTML='<div class="empty"><strong>Nenhuma orientação encontrada</strong><p>Experimente outro termo ou selecione uma área de atendimento.</p></div>';
    }else{
      $('rule-list').innerHTML=matches.map(({rule,card})=>ruleMarkup(rule,card)).join('');
    }
    $('rule-list').querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>{
      const id=b.dataset.toggle;expanded.has(id)?expanded.delete(id):expanded.add(id);renderRules();
    }));
    $('rule-list').querySelectorAll('[data-check]').forEach(box=>box.addEventListener('change',()=>{
      box.checked?checked.add(box.dataset.check):checked.delete(box.dataset.check);
      renderProgress();
    }));
  }
  function renderProgress(){
    const c=currentCard(), total=(c.rules||[]).length, n=c.rules.filter(r=>checked.has(r.id)).length;
    $('progress-title').textContent=total?`${n} de ${total} orientações revisadas`:'Aguardando mapeamento';
    $('progress-description').textContent='Marcação manual de leitura, não validação de indicador.';
    $('progress-fill').style.width=total?`${100*n/total}%`:'0%';
  }
  function render(){
    const c=currentCard();
    renderModules();
    $('panel-heading').textContent=query.trim()?'Resultados em todas as áreas':c.title;
    $('indicator-label').textContent=query.trim()?'BUSCA GLOBAL':c.indicator?`INDICADOR ${c.indicator}`:'ÁREA RESERVADA';
    $('panel-summary').textContent=query.trim()?`Buscando “${query.trim()}” nos componentes cadastrados.`:(c.rules.length?`${c.rules.length} orientações documentais preliminares. Verifique elegibilidade, contexto e versão do PEC.`:'Não há conteúdo clínico validado para exibição.');
    $('coverage-tag').textContent=c.rules.length?'Base parcial • revisar':'Pendente';
    renderRules();renderProgress();renderCodes();
  }
  $('search').addEventListener('input',e=>{query=e.target.value;showAllCodes=false;render();});
  $('reset').addEventListener('click',()=>{checked.clear();render();toast('Marcações manuais limpas.');});
  $('help-button').addEventListener('click',()=>$('help-modal').showModal());
  $('help-close').addEventListener('click',()=>$('help-modal').close());
  render();
})();