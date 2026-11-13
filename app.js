/* Roteiro em memória: nenhuma consulta ao PEC, persistência ou cálculo de pontuação. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const data = window.ZERA_APS_DATA;
  if (!Array.isArray(data?.cards)) {
    $("setup").textContent =
      "Não foi possível carregar a base. Reabra o aplicativo com a pasta data disponível.";
    return;
  }

  // Apenas organização editorial. Critérios, códigos, caminhos e ressalvas vêm da base.
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

  let selected = [];
  let phase = "";
  let groups = [];
  let toastTimer;
  const reviewed = new Set();
  let query = "";
  let teamOpen = false;

  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const normalize = (value) =>
    String(value ?? "")
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const sourceLink = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  };
  const labelFor = (card) =>
    card.id === "prenatal"
      ? phase === "puerperio"
        ? "Puerpério"
        : "Pré-natal"
      : card.title;
  const keysFromForm = () =>
    Array.from(
      document.querySelectorAll('[name="condition"]:checked'),
      (el) => el.value,
    );

  function updateSelection() {
    const keys = keysFromForm();
    reviewed.clear();
    query = "";
    teamOpen = false;
    $("search").value = "";
    $("soap-dialog").close();
    clearTimeout(toastTimer);
    $("toast").hidden = true;
    const needsPhase = keys.includes("prenatal");
    $("phase-field").hidden = !needsPhase;
    $("new-visit").hidden = !keys.length;
    if (!keys.length) {
      selected = [];
      phase = "";
      groups = [];
      $("guide").hidden = true;
      $("copy-dock").hidden = true;
      $("selection-hint").textContent = "Selecione um ou mais indicadores.";
      $("empty-state").hidden = false;
      $("empty-heading").textContent = "Seu roteiro começa aqui.";
      $("empty-description").textContent =
        "Selecione um indicador para ver onde registrar, quais códigos consultar e o que conferir.";
      $("action-list").replaceChildren();
      return;
    }
    const phaseChoice = document.querySelector('[name="phase"]:checked');
    if (needsPhase && !phaseChoice) {
      $("guide").hidden = true;
      $("copy-dock").hidden = true;
      selected = [];
      phase = "";
      groups = [];
      $("action-list").replaceChildren();
      $("empty-state").hidden = false;
      $("empty-heading").textContent = "Qual é a fase do acompanhamento?";
      $("empty-description").textContent =
        "Escolha pré-natal ou puerpério nos indicadores para montar o roteiro.";
      $("selection-hint").textContent =
        "Escolha pré-natal ou puerpério para continuar.";
      return;
    }
    $("selection-hint").textContent =
      "Roteiro atualizado. Você pode combinar outros indicadores.";
    $("empty-state").hidden = true;
    buildGuide();
  }

  function makeGroups() {
    const map = new Map();
    data.cards
      .filter((card) => selected.includes(card.id))
      .forEach((card) => {
        (card.rules || []).forEach((rule) => {
          if (card.id === "prenatal" && rule.phase !== phase) return;
          const [key, title, instruction, lane] = actions[rule.id] || [
            rule.id,
            rule.title,
            "Confira o registro e as condições de aplicação na base.",
            "medical",
          ];
          if (!map.has(key))
            map.set(key, { key, title, instruction, lane, variants: [] });
          map.get(key).variants.push({ rule, card });
        });
      });
    const laneOrder = { medical: 0, shared: 1, team: 2 };
    return Array.from(map.values()).sort(
      (a, b) => laneOrder[a.lane] - laneOrder[b.lane],
    );
  }

  function criteriaMarkup(group) {
    // Cada regra conserva seu próprio caminho, prazo, código, profissional, fonte e ressalvas.
    return group.variants
      .map(({ rule, card }) => {
        const link = sourceLink(rule.source);
        const methodology = sourceLink(rule.methodology_source);
        const diagnosticCodes =
          group.key === "consulta"
            ? Object.entries(card.codes || {}).flatMap(([system, codes]) =>
                codes.map((value) => ({
                  system:
                    system === "cid10"
                      ? "CID-10"
                      : system === "ciap2"
                        ? "CIAP-2"
                        : system,
                  value,
                  label:
                    "Referência diagnóstica: selecionar somente se corresponder ao diagnóstico.",
                })),
              )
            : [];
        const codes = [...(rule.codes || []), ...diagnosticCodes];
        return `<section class="criterion" aria-label="${esc(rule.id)}">
        <h4>${esc(labelFor(card))} <span>${esc(rule.id)}</span></h4>
        <dl><dt>Critério da ficha do indicador</dt><dd>${esc(rule.goal)} · ${esc(rule.window)}</dd>
        <dt>Campo no PEC / sistema da equipe</dt><dd>${esc(rule.pec_location)}</dd>
        <dt>Profissional indicado na base</dt><dd>${esc(rule.actor)}</dd></dl>
        ${(rule.cautions || []).length ? `<div class="cautions"><strong>Cuidados para este item</strong><ul>${rule.cautions.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>` : ""}
        ${codes.length ? `<details class="codes"><summary>Códigos de referência — somente se aplicáveis</summary><p>Copiar não registra o atendimento. Confira os campos estruturados antes de acrescentar procedimentos.</p>${codes.map((code) => `<div class="code-row"><span><small>${esc(code.system)}</small><code>${esc(code.value)}</code>${code.label ? `<small>${esc(code.label)}</small>` : ""}</span><button type="button" class="button secondary copy-button" data-copy="${esc(code.value)}" aria-label="Copiar ${esc(code.value)}">Copiar</button></div>`).join("")}</details>` : ""}
        ${link ? `<a class="source-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Fonte indicada na base ↗</a>` : "<p>Fonte específica não disponível.</p>"}
        ${methodology ? `<a class="source-link" href="${esc(methodology)}" target="_blank" rel="noopener noreferrer">Nota metodológica oficial ↗</a>` : ""}
      </section>`;
      })
      .join("");
  }

  function codeSummaryMarkup(group) {
    const entries = group.variants
      .map(({ rule, card }) => {
        const parts = [];
        if (group.key === "consulta") {
          if (Array.isArray(card.codes?.ciap2) && card.codes.ciap2.length)
            parts.push(
              '<span class="code-chip">CIAP-2 ' +
                esc(card.codes.ciap2.join(" / ")) +
                "</span>",
            );
          const cid = card.codes?.cid10 || card.codes?.cid10_examples || [];
          if (Array.isArray(cid) && cid.length) {
            if (cid.length <= 6)
              parts.push(
                '<span class="code-chip">CID-10 ' +
                  esc(cid.join(" / ")) +
                  "</span>",
              );
            else
              parts.push(
                '<details class="all-codes"><summary>CID-10 · ' +
                  cid.length +
                  " opções</summary><p>" +
                  esc(cid.join(", ")) +
                  "</p></details>",
              );
          }
        }
        (rule.codes || []).forEach((code) => {
          parts.push(
            '<span class="code-chip">' +
              esc(code.system) +
              " " +
              esc(code.value) +
              (code.label ? " · " + esc(code.label) : "") +
              "</span>",
          );
        });
        return parts.length
          ? '<div class="code-line"><small>' +
              esc(rule.id) +
              "</small><div>" +
              parts.join("") +
              "</div></div>"
          : "";
      })
      .filter(Boolean);
    return entries.length
      ? '<div class="code-summary"><strong>CÓDIGOS</strong>' +
          entries.join("") +
          "</div>"
      : "";
  }

  function actionMarkup(group, index) {
    const badges = group.variants.map(({ rule }) => rule.id).join(" · ");
    const paths = [
      ...new Set(group.variants.map(({ rule }) => rule.pec_location)),
    ];
    return `<article class="action${reviewed.has(group.key) ? " is-reviewed" : ""}" data-action="${esc(group.key)}">
      <div class="action-main"><span class="number" aria-hidden="true">${index + 1}</span><div><h3>${esc(group.title)}</h3><p class="action-badges">${esc(badges)}</p></div><label class="review-control"><input type="checkbox" data-review="${esc(group.key)}" aria-label="Conferir ${esc(group.title)}" ${reviewed.has(group.key) ? "checked" : ""}><span>Conferido</span></label></div>
      <div class="click-path"><strong>CLIQUE NO PEC</strong>${paths.map((path) => `<p>${esc(path)}</p>`).join("")}</div>
      ${codeSummaryMarkup(group)}
      <details class="action-details"><summary>Prazo, responsável e observações</summary>${criteriaMarkup(group)}</details>
    </article>`;
  }

  function updateProgress() {
    $("review-summary").textContent =
      `${reviewed.size} de ${groups.length} itens conferidos`;
    $("review-progress").max = Math.max(groups.length, 1);
    $("review-progress").value = reviewed.size;
  }

  function renderActions() {
    const matching = groups.filter(
      (group) =>
        !query ||
        normalize(
          [
            group.title,
            group.instruction,
            ...group.variants.map(({ rule, card }) =>
              JSON.stringify({
                rule,
                title: labelFor(card),
                diagnosticCodes:
                  group.key === "consulta" ? card.codes : undefined,
              }),
            ),
          ].join(" "),
        ).includes(query),
    );
    const medical = matching.filter((group) => group.lane !== "team");
    const team = matching.filter((group) => group.lane === "team");
    $("action-list").innerHTML =
      (medical.length
        ? '<p class="lane-label">REGISTROS DO ATENDIMENTO</p>'
        : "") +
      medical
        .map((group) => actionMarkup(group, groups.indexOf(group)))
        .join("") +
      (team.length
        ? `<details class="team-lane" ${query || teamOpen ? "open" : ""}><summary>Conferir com a equipe <span>(${team.length})</span></summary><p>Confira com quem realizou. Não registre ação alheia como realizada pelo médico.</p>${team.map((group) => actionMarkup(group, groups.indexOf(group))).join("")}</details>`
        : "");
    $("no-results").hidden = matching.length > 0;
    $("search-count").textContent = query
      ? `${matching.length} de ${groups.length}`
      : "";
    const teamDetails = document.querySelector(".team-lane");
    if (teamDetails)
      teamDetails.addEventListener("toggle", () => {
        if (!query) teamOpen = teamDetails.open;
      });
    updateProgress();
  }

  function buildGuide() {
    selected = keysFromForm();
    const phaseChoice = document.querySelector('[name="phase"]:checked');
    phase = selected.includes("prenatal") ? phaseChoice?.value || "" : "";
    groups = makeGroups();

    $("item-count").textContent = `${groups.length} itens`;
    $("guide-heading").textContent = data.cards
      .filter((card) => selected.includes(card.id))
      .map(labelFor)
      .join(" + ");
    $("guide-context").textContent = selected.includes("prenatal")
      ? phase === "puerperio"
        ? "Puerpério · confira os registros C3-I e C3-J."
        : "Pré-natal · confira os registros C3-A a C3-H e C3-K."
      : selected.includes("mulher")
        ? "Confira os campos, o histórico e os critérios. A seleção não confirma elegibilidade."
        : "Localize o campo, consulte os códigos e confira os critérios de cada item.";
    const paIndicators = [
      selected.includes("has") ? "C5-B" : "",
      selected.includes("dm") ? "C4-B" : "",
    ].filter(Boolean);
    $("copy-warning").textContent = paIndicators.length
      ? "PA na evolução não substitui o campo estruturado " +
        paIndicators.join(" / ") +
        "."
      : "O texto livre não substitui os campos estruturados do PEC.";
    $("base-date").textContent =
      `Critérios: ${data.reviewed_on || "não disponível"}. Manual PEC ${data.pec_manual_review?.version || "não informado"} consultado em ${data.pec_manual_review?.date || "data não informada"}. Versão: ${data.version || "não informada"}.`;
    $("guide").hidden = false;
    $("copy-dock").hidden = false;
    renderActions();
  }

  function resetVisit() {
    $("visit-form").reset();
    selected = [];
    phase = "";
    groups = [];
    $("action-list").replaceChildren();
    $("guide-heading").textContent = "";
    $("guide-context").textContent = "";
    clearTimeout(toastTimer);
    $("toast").hidden = true;
    $("guide").hidden = true;
    $("copy-dock").hidden = true;
    $("new-visit").hidden = true;
    $("selection-hint").textContent =
      "Marque uma ou mais situações para ver o mapa de cliques.";
    $("visit-form").querySelector("input").focus();
    updateSelection();
  }

  function buildSoapChecklist() {
    const checklist = groups
      .map((group) => {
        const lines = [
          "⚠️ " +
            group.variants.map(({ rule }) => rule.id).join(" / ") +
            " — " +
            group.title,
        ];
        const paths = [
          ...new Set(group.variants.map(({ rule }) => rule.pec_location)),
        ];
        paths.forEach((path) => lines.push("   CLIQUE/CAMPO: " + path));
        group.variants.forEach(({ rule, card }) => {
          lines.push(
            "   " + rule.id + ": " + rule.goal + " (" + rule.window + ").",
          );
          if (group.lane === "team")
            lines.push(
              "   RESPONSÁVEL: " +
                rule.actor +
                "; conferir com a equipe, sem registrar em nome de quem executou.",
            );
          if (group.key === "consulta") {
            if (Array.isArray(card.codes?.ciap2) && card.codes.ciap2.length)
              lines.push(
                "   CIAP-2 de referência: " +
                  card.codes.ciap2.join(", ") +
                  " — selecione apenas o correspondente ao diagnóstico.",
              );
            const cid = card.codes?.cid10 || card.codes?.cid10_examples || [];
            if (Array.isArray(cid) && cid.length)
              lines.push(
                "   CID-10 de referência: " +
                  cid.join(", ") +
                  " — selecione apenas o correspondente ao diagnóstico.",
              );
          }
          const procedureCodes = (rule.codes || []).map(
            (code) =>
              code.system +
              " " +
              code.value +
              (code.label ? " (" + code.label + ")" : ""),
          );
          if (procedureCodes.length)
            lines.push(
              "   CÓDIGO(S) DO REGISTRO: " + procedureCodes.join("; "),
            );
        });
        return lines.join("\n");
      })
      .join("\n");
    return [
      "RASCUNHO SOAP — COMPLETAR ANTES DE SALVAR",
      "S: [Relato real.]",
      "O: [Achados observados e medidas realmente aferidas.]",
      "A: [Avaliação clínica realizada.]",
      "P: [Conduta decidida, orientações e seguimento, se aplicáveis.]",
      "",
      "MAPA DE CLIQUES — confira o campo estruturado e o histórico do indicador.",
      checklist,
      "",
      "Use somente códigos compatíveis com o diagnóstico e o registro real. Apague este mapa antes de salvar a evolução.",
    ].join("\n");
  }

  async function writeClipboardText(value, button) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch {
        /* Tenta seleção local quando a permissão de clipboard não está disponível. */
      }
    }
    {
      const field = document.createElement("textarea");
      field.value = value;
      field.className = "clipboard-field";
      ($("soap-dialog").open ? $("soap-dialog") : document.body).append(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();
      button?.focus();
      if (!ok) throw new Error("copy unavailable");
    }
  }
  async function copyCode(button) {
    try {
      await writeClipboardText(button.dataset.copy, button);
      $("toast").textContent = "Código copiado. O registro é feito no PEC.";
    } catch {
      $("toast").textContent =
        "Cópia indisponível. Selecione o código ao lado do botão.";
    }
    clearTimeout(toastTimer);
    $("toast").hidden = false;
    toastTimer = setTimeout(() => {
      $("toast").hidden = true;
    }, 3000);
  }

  async function copySoapChecklist(event) {
    const button = event.currentTarget;
    try {
      await writeClipboardText(buildSoapChecklist(), button);
      $("toast").textContent = "SOAP e mapa copiados. Revise antes de salvar.";
      $("dialog-copy-status").textContent = "Rascunho copiado.";
    } catch {
      openPreview();
      const message =
        "Cópia indisponível. Selecione e copie o texto da prévia.";
      $("toast").textContent = message;
      $("dialog-copy-status").textContent = message;
    }
    clearTimeout(toastTimer);
    $("toast").hidden = false;
    toastTimer = setTimeout(() => {
      $("toast").hidden = true;
    }, 4500);
  }

  function openPreview() {
    $("soap-preview").textContent = buildSoapChecklist();
    $("dialog-copy-status").textContent = "";
    if (!$("soap-dialog").open) $("soap-dialog").showModal();
  }
  $("visit-form").addEventListener("submit", (event) => event.preventDefault());
  $("visit-form").addEventListener("change", updateSelection);
  $("search").addEventListener("input", (event) => {
    query = normalize(event.target.value.trim());
    renderActions();
  });
  $("clear-search").addEventListener("click", () => {
    query = "";
    $("search").value = "";
    renderActions();
    $("search").focus();
  });
  $("action-list").addEventListener("change", (event) => {
    const key = event.target.dataset.review;
    if (!key) return;
    if (event.target.checked) reviewed.add(key);
    else reviewed.delete(key);
    event.target
      .closest(".action")
      .classList.toggle("is-reviewed", event.target.checked);
    updateProgress();
  });
  $("preview-soap").addEventListener("click", openPreview);
  $("close-preview").addEventListener("click", () => $("soap-dialog").close());
  $("copy-preview").addEventListener("click", copySoapChecklist);
  $("new-visit").addEventListener("click", resetVisit);
  $("copy-soap-checklist").addEventListener("click", copySoapChecklist);
  $("action-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-copy]");
    if (button) copyCode(button);
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) resetVisit();
  });
  $("visit-form").reset();
  $("new-visit").hidden = true;
  updateSelection();
})();
