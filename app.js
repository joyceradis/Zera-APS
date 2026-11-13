/* Roteiro em memória: nenhuma consulta ao PEC, persistência ou cálculo de pontuação. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const data = window.ZERA_APS_DATA;
  if (!Array.isArray(data?.cards)) {
    $('setup').textContent = 'Não foi possível carregar a base. Reabra o aplicativo com a pasta data disponível.';
    return;
  }

  // Apenas organização editorial. Critérios, códigos, caminhos e ressalvas vêm da base.
  const actions = {
    'C5-A': ['consulta', 'Consulta e condição registrada', 'Localize a consulta e confira a condição na Avaliação e na lista de problemas.', 'medical'],
    'C4-A': ['consulta', 'Consulta e condição registrada', 'Localize a consulta e confira a condição na Avaliação e na lista de problemas.', 'medical'],
    'C5-B': ['pa', 'Pressão arterial', 'Confira o valor registrado no campo de pressão arterial do PEC.', 'medical'],
    'C4-B': ['pa', 'Pressão arterial', 'Confira o valor registrado no campo de pressão arterial do PEC.', 'medical'],
    'C5-C': ['peso-altura', 'Peso e altura', 'Confira se peso e altura estão nos campos próprios e na mesma data.', 'medical'],
    'C4-C': ['peso-altura', 'Peso e altura', 'Confira se peso e altura estão nos campos próprios e na mesma data.', 'medical'],
    'C5-D': ['visitas', 'Visitas domiciliares com o ACS', 'Confira com a equipe as datas e os registros das visitas no e-SUS Território.', 'team'],
    'C4-D': ['visitas', 'Visitas domiciliares com o ACS', 'Confira com a equipe as datas e os registros das visitas no e-SUS Território.', 'team'],
    'C4-E': ['hba1c', 'Registro da HbA1c', 'Diferencie a solicitação do exame da avaliação de um resultado existente.', 'medical'],
    'C4-F': ['pes', 'Registro do exame dos pés', 'Se o exame foi realizado, confira a descrição e o procedimento correspondente.', 'medical'],
    'C3-A': ['inicio-prenatal', 'Início do pré-natal', 'Confira a DUM estruturada, a consulta inicial e o registro da gestação.', 'medical'],
    'C3-B': ['consultas-prenatal', 'Consultas de pré-natal', 'Confira as consultas no histórico e os campos estruturados de pré-natal.', 'medical'],
    'C3-C': ['pa-prenatal', 'Pressão arterial no pré-natal', 'Localize as aferições registradas durante a gestação.', 'medical'],
    'C3-D': ['peso-prenatal', 'Peso e altura no pré-natal', 'Confira os pares de registros na mesma data durante a gestação.', 'medical'],
    'C3-E': ['visitas-prenatal', 'Visitas do ACS no pré-natal', 'Confira as visitas com a equipe, considerando a fase da gestação.', 'team'],
    'C3-F': ['dtpa', 'Registro da dTpa', 'Confira a aplicação ou a transcrição de vacinação comprovada.', 'team'],
    'C3-G': ['testes-primeiro', 'Testes do primeiro trimestre', 'Confira os registros de sífilis, HIV e hepatites B e C no primeiro trimestre.', 'medical'],
    'C3-H': ['testes-terceiro', 'Testes do terceiro trimestre', 'Confira os registros de sífilis e HIV no terceiro trimestre.', 'medical'],
    'C3-I': ['consulta-puerperio', 'Consulta puerperal', 'Confira a consulta no puerpério e a data de desfecho da gestação no PEC.', 'medical'],
    'C3-J': ['visita-puerperio', 'Visita do ACS no puerpério', 'Confira com o ACS o registro da visita puerperal no e-SUS Território.', 'team'],
    'C3-K': ['bucal-gestacao', 'Saúde bucal na gestação', 'Confira com a odontologia o atendimento realizado durante a gestação.', 'team'],
    'C7-A': ['colo', 'Registro do rastreamento do colo', 'Confira modalidade, faixa etária e histórico antes de interpretar o componente.', 'medical'],
    'C7-B': ['hpv', 'Registro da vacinação HPV', 'Confira com a vacinação o registro e a elegibilidade do componente.', 'team'],
    'C7-C': ['sexual', 'Atendimento de saúde sexual e reprodutiva', 'Confira se o código da Avaliação corresponde ao atendimento realizado.', 'medical'],
    'C7-D': ['mama', 'Registro do rastreamento de mama', 'Diferencie solicitação e avaliação do exame e confira elegibilidade e histórico.', 'medical']
  };

  let selected = [];
  let phase = '';
  let groups = [];
  const reviewed = new Set();
  let toastTimer;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const normalize = value => String(value ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sourceLink = value => {
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; }
    catch { return ''; }
  };
  const labelFor = card => card.id === 'prenatal' ? phase === 'puerperio' ? 'Puerpério' : 'Pré-natal' : card.title;
  const keysFromForm = () => Array.from(document.querySelectorAll('[name="condition"]:checked'), el => el.value);

  function updateSelection() {
    const keys = keysFromForm();
    const needsPhase = keys.includes('prenatal');
    $('phase-field').hidden = !needsPhase;
    $('new-visit').hidden = !keys.length;
    if (!keys.length) {
      selected = []; phase = ''; groups = []; reviewed.clear();
      $('guide').hidden = true; $('copy-dock').hidden = true;
      $('selection-hint').textContent = 'Marque uma ou mais situações para ver o mapa de cliques.';
      return;
    }
    const phaseChoice = document.querySelector('[name="phase"]:checked');
    if (needsPhase && !phaseChoice) {
      $('guide').hidden = true; $('copy-dock').hidden = true;
      $('selection-hint').textContent = 'Escolha pré-natal ou puerpério para montar também os cliques do C3.';
      return;
    }
    $('selection-hint').textContent = 'Mapa atualizado. Copie o SOAP e confira os campos estruturados no PEC.';
    buildGuide();
  }

  function makeGroups() {
    const map = new Map();
    data.cards.filter(card => selected.includes(card.id)).forEach(card => {
      (card.rules || []).forEach(rule => {
        if (card.id === 'prenatal' && rule.phase !== phase) return;
        const [key, title, instruction, lane] = actions[rule.id] || [rule.id, rule.title, 'Confira o registro e as condições de aplicação na base.', 'medical'];
        if (!map.has(key)) map.set(key, {key, title, instruction, lane, variants: []});
        map.get(key).variants.push({rule, card});
      });
    });
    const laneOrder = {medical: 0, shared: 1, team: 2};
    return Array.from(map.values()).sort((a, b) => laneOrder[a.lane] - laneOrder[b.lane]);
  }

  function criteriaMarkup(group) {
    // Cada regra conserva seu próprio caminho, prazo, código, profissional, fonte e ressalvas.
    return group.variants.map(({rule, card}) => {
      const link = sourceLink(rule.source);
      const methodology = sourceLink(rule.methodology_source);
      const diagnosticCodes = group.key === 'consulta' ? Object.entries(card.codes || {}).flatMap(([system, codes]) => codes.map(value => ({
        system: system === 'cid10' ? 'CID-10' : system === 'ciap2' ? 'CIAP-2' : system,
        value, label: 'Referência diagnóstica: selecionar somente se corresponder ao diagnóstico.'
      }))) : [];
      const codes = [...(rule.codes || []), ...diagnosticCodes];
      return `<section class="criterion" aria-label="${esc(rule.id)}">
        <h4>${esc(labelFor(card))} <span>${esc(rule.id)}</span></h4>
        <dl><dt>Critério da ficha do indicador</dt><dd>${esc(rule.goal)} · ${esc(rule.window)}</dd>
        <dt>Campo no PEC / sistema da equipe</dt><dd>${esc(rule.pec_location)}</dd>
        <dt>Profissional indicado na base</dt><dd>${esc(rule.actor)}</dd></dl>
        ${(rule.cautions || []).length ? `<div class="cautions"><strong>Cuidados para este item</strong><ul>${rule.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
        ${codes.length ? `<details class="codes"><summary>Códigos de referência — somente se aplicáveis</summary><p>Copiar não registra o atendimento. Confira os campos estruturados antes de acrescentar procedimentos.</p>${codes.map(code => `<div class="code-row"><span><small>${esc(code.system)}</small><code>${esc(code.value)}</code>${code.label ? `<small>${esc(code.label)}</small>` : ''}</span><button type="button" class="button secondary copy-button" data-copy="${esc(code.value)}" aria-label="Copiar ${esc(code.value)}">Copiar</button></div>`).join('')}</details>` : ''}
        ${link ? `<a class="source-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Fonte indicada na base ↗</a>` : '<p>Fonte específica não disponível.</p>'}
        ${methodology ? `<a class="source-link" href="${esc(methodology)}" target="_blank" rel="noopener noreferrer">Nota metodológica oficial ↗</a>` : ''}
      </section>`;
    }).join('');
  }

  function codeSummaryMarkup(group) {
    const entries = group.variants.map(({rule, card}) => {
      const parts = [];
      if (group.key === 'consulta') {
        if (Array.isArray(card.codes?.ciap2) && card.codes.ciap2.length) parts.push('CIAP-2: ' + card.codes.ciap2.join(', '));
        if (Array.isArray(card.codes?.cid10) && card.codes.cid10.length) parts.push('CID-10 possíveis: ' + card.codes.cid10.join(', '));
        if (Array.isArray(card.codes?.cid10_examples) && card.codes.cid10_examples.length) parts.push('CID-10 de referência: ' + card.codes.cid10_examples.join(', '));
      }
      (rule.codes || []).forEach(code => parts.push(code.system + ': ' + code.value + (code.label ? ' (' + code.label + ')' : '')));
      return parts.length ? '<li><strong>' + esc(rule.id) + '</strong> · ' + esc(parts.join(' | ')) + '</li>' : '';
    }).filter(Boolean);
    return entries.length ? '<div class="code-summary"><strong>Códigos oficiais de referência</strong><p>Escolha CID/CIAP conforme o diagnóstico confirmado; SIGTAP/ABEX conforme o registro realizado ou solicitado.</p><ul>' + entries.join('') + '</ul></div>' : '';
  }

  function actionMarkup(group, index) {
    const badges = group.variants.map(({rule}) => rule.id).join(' · ');
    return `<article class="action ${reviewed.has(group.key) ? 'reviewed' : ''}" data-action="${esc(group.key)}">
      <div class="action-main"><span class="number" aria-hidden="true">${index + 1}</span><div><h3>${esc(group.title)}</h3><p>${esc(group.instruction)}</p></div></div>
      ${codeSummaryMarkup(group)}
      <details class="action-details"><summary>Ver campo do PEC e critério de conferência</summary>
        ${group.variants.length > 1 ? '<p class="merge-note">Ação reunida para facilitar a leitura. Confira cada condição abaixo: um registro não comprova automaticamente dois indicadores.</p>' : ''}
        ${criteriaMarkup(group)}
      </details>
      <label class="review-control"><input type="checkbox" data-review="${esc(group.key)}" ${reviewed.has(group.key) ? 'checked' : ''}> Já conferi este item no PEC <span>${esc(badges)}</span></label>
    </article>`;
  }

  function searchable(group) {
    return normalize(JSON.stringify([group.title, group.instruction, group.variants.map(({rule, card}) => [rule, card.title, group.key === 'consulta' ? card.codes : null])]));
  }

  function renderActions() {
    const query = normalize($('search').value).trim();
    const filtered = groups.filter(group => !query || searchable(group).includes(query));
    const lanes = [
      ['medical', 'Cliques médicos no PEC', 'Campos e códigos dos componentes C4/C5. Selecione códigos somente quando corresponderem ao diagnóstico e ao atendimento.'],
      ['shared', 'Conferir em conjunto com a equipe', 'Este componente reúne responsabilidades da consulta e da equipe.'],
      ['team', 'Ações da equipe — não registrar pelo médico', 'Confira com ACS/TACS, enfermagem ou vacinação. O médico não registra uma ação feita por outra pessoa.']
    ];
    $('action-list').innerHTML = lanes.map(([lane, title, description]) => {
      const items = filtered.filter(group => group.lane === lane);
      return items.length ? `<section class="lane ${lane}" aria-label="${title}"><div class="lane-heading"><h2>${title}</h2><p>${description}</p></div>${items.map(group => actionMarkup(group, groups.indexOf(group))).join('')}</section>` : '';
    }).join('');
    $('no-results').hidden = filtered.length > 0;
    updateProgress();
  }

  function updateProgress() {
    if ($('review-summary')) $('review-summary').textContent = `${reviewed.size} de ${groups.length} itens conferidos manualmente`;
  }

  function buildGuide() {
    selected = keysFromForm();
    const phaseChoice = document.querySelector('[name="phase"]:checked');
    phase = selected.includes('prenatal') ? (phaseChoice?.value || '') : '';
    reviewed.clear();
    groups = makeGroups();
    $('search').value = '';
    $('guide-heading').textContent = data.cards.filter(card => selected.includes(card.id)).map(labelFor).join(' + ');
    $('guide-context').textContent = selected.includes('prenatal')
      ? (phase === 'puerperio' ? 'Puerpério · confira os registros C3-I e C3-J.' : 'Pré-natal · confira os registros C3-A a C3-H e C3-K.')
      : 'Use o mapa para localizar o campo estruturado e conferir a janela do indicador.';
    const paIndicators = [selected.includes('has') ? 'C5-B' : '', selected.includes('dm') ? 'C4-B' : ''].filter(Boolean);
    $('copy-warning').textContent = paIndicators.length
      ? '⚠️ PA escrita na evolução não substitui o campo estruturado ' + paIndicators.join(' / ') + '.'
      : '⚠️ O texto livre não alimenta os campos estruturados. Siga o mapa abaixo.';
    $('base-date').textContent = `Critérios: ${data.reviewed_on || 'não disponível'}. Manual PEC ${data.pec_manual_review?.version || 'não informado'} consultado em ${data.pec_manual_review?.date || 'data não informada'}. Versão: ${data.version || 'não informada'}.`;
    $('guide').hidden = false;
    $('copy-dock').hidden = false;
    renderActions();
  }

  function resetVisit() {
    $('visit-form').reset();
    selected = []; phase = ''; groups = []; reviewed.clear();
    $('search').value = ''; $('action-list').replaceChildren();
    if ($('review-summary')) $('review-summary').textContent = '';
    $('guide-heading').textContent = ''; $('guide-context').textContent = '';
    clearTimeout(toastTimer); $('toast').hidden = true;
    $('guide').hidden = true; $('copy-dock').hidden = true;
    $('new-visit').hidden = true;
    $('selection-hint').textContent = 'Marque uma ou mais situações para ver o mapa de cliques.';
    $('page-heading').focus();
    updateSelection();
  }

  function buildSoapChecklist() {
    const checklist = groups.map(group => {
      const lines = ['⚠️ ' + group.variants.map(({rule}) => rule.id).join(' / ') + ' — ' + group.title];
      const paths = [...new Set(group.variants.map(({rule}) => rule.pec_location))];
      paths.forEach(path => lines.push('   CLIQUE/CAMPO: ' + path));
      group.variants.forEach(({rule, card}) => {
        lines.push('   ' + rule.id + ': ' + rule.goal + ' (' + rule.window + ').');
        if (group.lane === 'team') lines.push('   RESPONSÁVEL: ' + rule.actor + '; conferir com a equipe, sem registrar em nome de quem executou.');
        if (group.key === 'consulta') {
          if (Array.isArray(card.codes?.ciap2) && card.codes.ciap2.length) lines.push('   CIAP-2 de referência: ' + card.codes.ciap2.join(', ') + ' — selecione apenas o correspondente ao diagnóstico.');
          const cid = card.codes?.cid10 || card.codes?.cid10_examples || [];
          if (Array.isArray(cid) && cid.length) lines.push('   CID-10 de referência: ' + cid.join(', ') + ' — selecione apenas o correspondente ao diagnóstico.');
        }
        const procedureCodes = (rule.codes || []).map(code => code.system + ' ' + code.value + (code.label ? ' (' + code.label + ')' : ''));
        if (procedureCodes.length) lines.push('   CÓDIGO(S) DO REGISTRO: ' + procedureCodes.join('; '));
      });
      return lines.join('\n');
    }).join('\n');
    return [
      'RASCUNHO SOAP — V1 MÉDICA — PREENCHER COM FATOS REAIS',
      'S: [Relato real.]',
      'O: [Achados observados e medidas realmente aferidas.]',
      'A: [Avaliação clínica realizada.]',
      'P: [Conduta decidida, orientações e seguimento, se aplicáveis.]',
      '',
      '⚠️ MAPA DE CLIQUES — TEXTO LIVRE PODE NÃO ALIMENTAR O INDICADOR. USE O CAMPO ESTRUTURADO, CONFIRA HISTÓRICO E JANELA. NÃO REPITA PROCEDIMENTOS SÓ PARA PONTUAR.',
      checklist,
      '',
      'Os códigos são referências; use somente os compatíveis com o diagnóstico e os atos realmente realizados. Antes de salvar, retire os lembretes e complete o SOAP. Este mapa não comprova execução.'
    ].join('\n');
  }

  async function writeClipboardText(value, button) {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
    else {
      const field = document.createElement('textarea');
      field.value = value; field.className = 'clipboard-field';
      document.body.append(field); field.select();
      const ok = document.execCommand('copy'); field.remove(); button?.focus();
      if (!ok) throw new Error('copy unavailable');
    }
  }
  async function copyCode(button) {
    try {
      await writeClipboardText(button.dataset.copy, button);
      $('toast').textContent = 'Código copiado. O registro é feito no PEC.';
    } catch { $('toast').textContent = 'Cópia indisponível. Selecione o código ao lado do botão.'; }
    clearTimeout(toastTimer); $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3000);
  }

  async function copySoapChecklist(event) {
    const button = event.currentTarget;
    try {
      await writeClipboardText(buildSoapChecklist(), button);
      $('toast').textContent = 'Rascunho SOAP e checklist copiados. Complete e confira antes de salvar.';
    } catch { $('toast').textContent = 'Cópia indisponível. Revise o rascunho na tela antes de continuar.'; }
    clearTimeout(toastTimer); $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
  }

  $('visit-form').addEventListener('change', updateSelection);
  $('new-visit').addEventListener('click', resetVisit);
  $('search').addEventListener('input', renderActions);
  $('copy-soap-checklist').addEventListener('click', copySoapChecklist);
  $('action-list').addEventListener('change', event => {
    const key = event.target.dataset.review;
    if (!key) return;
    event.target.checked ? reviewed.add(key) : reviewed.delete(key);
    event.target.closest('.action').classList.toggle('reviewed', event.target.checked);
    updateProgress();
  });
  $('action-list').addEventListener('click', event => {
    const button = event.target.closest('[data-copy]');
    if (button) copyCode(button);
  });
  window.addEventListener('pageshow', event => { if (event.persisted) resetVisit(); });
  $('visit-form').reset();
  $('new-visit').hidden = true;
  updateSelection();
})();
