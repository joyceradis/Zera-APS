(function zeraApp() {
  "use strict";
  const data = window.ZERA_APS_DATA;
  const byId = id => document.getElementById(id);
  if (!data || !Array.isArray(data.cards)) {
    const target = byId("rule-list");
    if (target) target.textContent = "Base documental indisponível. Verifique data/regras.js.";
    return;
  }
  const cards = data.cards;
  const glyphs = { has: "♡", dm: "◇", prenatal: "✳", mulher: "♀", mental: "◎" };
  const viewNames = { trabalho: "Espaço de trabalho", codigos: "Biblioteca de códigos", fontes: "Fontes e limites", piloto: "Preparação do piloto" };
  let selected = cards.find(c => c.id === "has")?.id || cards[0].id;
  let activeView = "trabalho";
  let activeFilter = "todos";
  let codeQuery = "";
  let toastTimer;
  const reviewed = new Set();
  const expanded = new Set();
  const safe = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const plain = s => String(s ?? "").toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const card = () => cards.find(c => c.id === selected) || cards[0];
  const ruleText = (r, c) => [c.title, c.indicator, r.id, r.title, r.goal, r.window, r.actor, r.pec_location, ...(r.cautions || []), ...(r.codes || []).map(x => [x.system, x.value, x.label || ""].join(" "))].join(" ");
  function notify(message) {
    byId("toast").textContent = message;
    byId("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => byId("toast").classList.remove("show"), 2900);
  }
  async function copyText(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement("textarea");
        el.value = value;
        el.setAttribute("readonly", "");
        el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(el);
        el.select();
        if (!document.execCommand("copy")) throw new Error("copy unsupported");
        el.remove();
      }
      notify("Copiado: " + value);
    } catch (error) {
      notify("Não foi possível copiar. Selecione o código manualmente.");
    }
  }
  function allCodes() {
    const seen = new Map();
    for (const c of cards) {
      for (const r of c.rules || []) {
        for (const z of r.codes || []) {
          const sys = String(z.system || "").toUpperCase();
          const value = String(z.value || "");
          const key = sys + ":" + value;
          if (!seen.has(key)) seen.set(key, { system: sys, value, label: z.label || r.title, context: c.title, cardId: c.id });
        }
      }
      for (const [key, values] of Object.entries(c.codes || {})) {
        const system = key === "cid10" ? "CID-10" : key === "ciap2" ? "CIAP-2" : key.toUpperCase();
        for (const value of values || []) {
          const k = system + ":" + value;
          if (!seen.has(k)) seen.set(k, { system, value, label: "Referência vinculada ao contexto. Verificar indicação clínica.", context: c.title, cardId: c.id });
        }
      }
    }
    return [...seen.values()];
  }
  const codes = allCodes();

  function changeView(view, focus) {
    if (!(view in viewNames)) return;
    activeView = view;
    for (const name of Object.keys(viewNames)) {
      byId("view-" + name).hidden = name !== view;
    }
    document.querySelectorAll("[data-view]").forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      if (button.classList.contains("side-link")) {
        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      }
    });
    byId("breadcrumb").textContent = viewNames[view];
    if (view === "codigos") renderLibrary();
    if (focus) {
      byId("main-content").scrollIntoView({ block: "start", behavior: "instant" });
      const heading = byId(view === "trabalho" ? "page-heading" : view === "codigos" ? "codes-heading" : view === "fontes" ? "sources-heading" : "pilot-heading");
      if (heading && heading.focus) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
    }
  }
  function renderModules() {
    byId("modules").innerHTML = cards.map(c => {
      const current = selected === c.id;
      const pending = !(c.rules || []).length;
      return `<button type="button" class="module-card ${current ? "active" : ""} ${pending ? "pending" : ""}" data-module="${safe(c.id)}" aria-pressed="${current}">
        <span class="module-icon" aria-hidden="true">${safe(glyphs[c.id] || "▤")}</span>
        ${current ? '<span class="module-check" aria-hidden="true">✓</span>' : ""}
        <strong>${safe(c.title)}</strong>
        <small>${c.indicator ? "Referência " + safe(c.indicator) : "Mapeamento pendente"}</small>
      </button>`;
    }).join("");
  }
  function renderQuickCodes() {
    const scoped = codes.filter(z => z.cardId === selected).slice(0, 4);
    byId("code-list").innerHTML = scoped.length
      ? scoped.map(z => `<div class="quick-code"><div class="quick-code-heading"><span>${safe(z.system)}</span><button type="button" data-copy="${safe(z.value)}" aria-label="Copiar ${safe(z.value)}">Copiar ↗</button></div><strong>${safe(z.value)}</strong><small>${safe(z.label)}</small></div>`).join("")
      : '<div class="rule-empty"><strong>Sem códigos homologados</strong>Esta área depende de mapeamento clínico.</div>';
  }
  function renderProgress() {
    const list = card().rules || [];
    const total = list.length;
    const n = list.filter(r => reviewed.has(r.id)).length;
    byId("progress-title").textContent = total ? n + " de " + total + " itens revisados nesta sessão" : "Conteúdo não disponível para revisão";
    const pct = total ? Math.round(100 * n / total) : 0;
    document.querySelector(".review-progress").style.setProperty("--progress", pct + "%");
  }
  function ruleMarkup(r) {
    const open = expanded.has(r.id);
    const checked = reviewed.has(r.id);
    const verification = r.verification === "pending_verification";
    const clauses = (r.cautions || []).map(x => `<li>${safe(x)}</li>`).join("");
    const codeBtns = (r.codes || []).map(z => `<button type="button" class="detail-code" data-copy="${safe(z.value)}" title="Copiar referência">${safe(z.system)} ${safe(z.value)} ↗</button>`).join("");
    return `<article class="rule ${open ? "open" : ""}" data-rule="${safe(r.id)}">
      <div class="rule-top">
        <input type="checkbox" class="review-checkbox" data-review="${safe(r.id)}" ${checked ? "checked" : ""} aria-label="Marcar orientação revisada: ${safe(r.title)}">
        <div class="rule-info"><h4>${safe(r.title)}</h4><p><span>${safe(r.id)}</span> &nbsp; ${safe(r.goal || "Orientação")} &nbsp;·&nbsp; ${safe(r.window || "Conforme contexto")}</p></div>
        <button type="button" class="rule-open" data-expand="${safe(r.id)}" aria-expanded="${open}">${open ? "Ocultar −" : "Ver detalhes +"}</button>
      </div>
      ${open ? `<div class="rule-detail">
        <div class="detail-line"><strong>Responsável</strong><p>${safe(r.actor || "Conferir na fonte")}</p></div>
        <div class="detail-line"><strong>Campo no PEC</strong><p>${safe(r.pec_location || "Consultar orientação oficial")}</p></div>
        <div class="detail-line"><strong>Prazo / janela</strong><p>${safe(r.window || "Conforme contexto")}</p></div>
        <div class="detail-line"><strong>Códigos relacionados</strong><div class="detail-code-list">${codeBtns || '<p>Sem código específico neste componente.</p>'}</div></div>
        ${clauses ? `<div class="caution"><strong>Antes de registrar</strong><ul>${clauses}</ul></div>` : ""}
        ${verification ? '<div class="caution"><strong>Revisão pendente</strong>Este componente ainda exige validação normativa.</div>' : ""}
        ${r.source ? `<a class="source-ref" href="${safe(r.source)}" target="_blank" rel="noopener noreferrer">Consultar fonte de referência ↗</a>` : ""}
      </div>` : ""}
    </article>`;
  }
  function renderRules() {
    const current = card();
    let list = current.rules || [];
    if (activeFilter === "pendentes") list = list.filter(r => !reviewed.has(r.id));
    if (activeFilter === "revisados") list = list.filter(r => reviewed.has(r.id));
    let empty = "";
    if (!(current.rules || []).length) empty = "<strong>Conteúdo ainda não homologado</strong>Este módulo aguarda especificação por situação clínica. Não inventamos regras para preencher espaço.";
    else if (!list.length) empty = activeFilter === "revisados" ? "<strong>Nenhum item revisado</strong>Use a caixa de marcação para controlar sua leitura nesta sessão." : "<strong>Nenhum item nesta seleção</strong>Altere o filtro para ver os outros itens.";
    byId("rule-list").innerHTML = empty ? `<div class="rule-empty">${empty}</div>` : list.map(ruleMarkup).join("");
  }
  function renderWorkspace() {
    const current = card();
    byId("work-heading").textContent = current.title;
    byId("current-context").textContent = "· " + current.title;
    byId("indicator-label").textContent = current.indicator ? "REFERÊNCIA " + current.indicator : "MÓDULO EM MAPEAMENTO";
    const count = (current.rules || []).length;
    byId("panel-summary").textContent = count ? count + " itens documentais em revisão. Consulte critérios e exceções." : "Sem orientações clínicas validadas para este contexto.";
    byId("metric-modules").innerHTML = String(cards.length).padStart(2, "0") + " <span>mapeadas</span>";
    byId("metric-rules").textContent = cards.reduce((n, c) => n + (c.rules || []).length, 0);
    renderModules();
    renderRules();
    renderProgress();
    renderQuickCodes();
  }
  function renderLibrary() {
    const q = plain(codeQuery).trim();
    const filtered = q ? codes.filter(c => plain([c.system,c.value,c.label,c.context].join(" ")).includes(q)) : codes;
    byId("code-count").textContent = filtered.length + " referências";
    byId("code-library").innerHTML = filtered.length ? filtered.map(z =>
      `<div class="library-row"><div class="library-code"><span>${safe(z.system)}</span><strong>${safe(z.value)}</strong></div>
       <div class="library-info"><strong>${safe(z.label)}</strong><span>${safe(z.context)}</span></div>
       <button type="button" data-copy="${safe(z.value)}" aria-label="Copiar ${safe(z.value)}">Copiar</button></div>`
    ).join("") : '<div class="rule-empty"><strong>Nenhum código encontrado</strong>Experimente um termo, condição ou sistema diferente.</div>';
  }
  function renderSearch() {
    const q = plain(byId("global-search").value).trim();
    const results = [];
    if (q) {
      for (const c of cards) for (const r of c.rules || [])
        if (plain(ruleText(r,c)).includes(q))
          results.push({kind:"rule",id:r.id,cardId:c.id,title:r.title,sub:c.title+" · "+r.id});
      for (const z of codes) if (plain([z.system,z.value,z.label,z.context].join(" ")).includes(q))
        results.push({kind:"code",id:z.value,cardId:z.cardId,title:z.system+" "+z.value,sub:z.label+" · "+z.context});
    }
    byId("search-results").innerHTML = !q ? '<div class="rule-empty"><strong>Busca universal</strong>Exemplos: I10, pressão arterial, HbA1c, pré-natal, SIGTAP.</div>' :
      !results.length ? '<div class="rule-empty"><strong>Nenhuma correspondência</strong>Tente uma palavra-chave ou código diferente.</div>' :
      results.slice(0,35).map(r => `<button type="button" class="search-item" data-search-kind="${safe(r.kind)}" data-search-id="${safe(r.id)}" data-search-module="${safe(r.cardId)}"><strong>${safe(r.title)}</strong><small>${safe(r.sub)}</small></button>`).join("");
  }
  function openSearch() {
    const dialog = byId("search-dialog");
    if (!dialog.open) dialog.showModal();
    byId("global-search").focus();
    renderSearch();
  }
  function closeSearch() {
    const dialog = byId("search-dialog");
    if (dialog.open) dialog.close();
  }
  document.addEventListener("click", event => {
    const copy = event.target.closest("[data-copy]");
    if (copy) { copyText(copy.dataset.copy); return; }
    const moduleButton = event.target.closest("[data-module]");
    if (moduleButton) {
      selected = moduleButton.dataset.module;
      activeFilter = "todos";
      document.querySelectorAll("[data-filter]").forEach(b=>{const a=b.dataset.filter==="todos";b.classList.toggle("active",a);b.setAttribute("aria-pressed",String(a));});
      renderWorkspace();
      return;
    }
    const filterButton = event.target.closest("[data-filter]");
    if (filterButton) {
      activeFilter=filterButton.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(b=>{const a=b===filterButton;b.classList.toggle("active",a);b.setAttribute("aria-pressed",String(a));});
      renderRules();
      return;
    }
    const expandButton = event.target.closest("[data-expand]");
    if (expandButton) {
      const id=expandButton.dataset.expand;
      if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
      renderRules();
      return;
    }
    const viewButton=event.target.closest("[data-view]");
    if (viewButton) { changeView(viewButton.dataset.view,true); return; }
    const searchButton=event.target.closest("[data-search-kind]");
    if (searchButton) {
      selected=searchButton.dataset.searchModule;
      if (searchButton.dataset.searchKind==="rule") {
        expanded.add(searchButton.dataset.searchId);
        activeFilter="todos";
        document.querySelectorAll("[data-filter]").forEach(b=>{const a=b.dataset.filter==="todos";b.classList.toggle("active",a);b.setAttribute("aria-pressed",String(a));});
        renderWorkspace();changeView("trabalho",true);
        byId("rule-list").querySelectorAll("[data-rule]").forEach(el=>{if(el.dataset.rule===searchButton.dataset.searchId)el.scrollIntoView({block:"center"});});
      } else {
        codeQuery=searchButton.dataset.searchId;
        byId("code-search").value=codeQuery;
        changeView("codigos",true);
      }
      closeSearch();
    }
  });
  document.addEventListener("change", event => {
    if (!event.target.matches("[data-review]")) return;
    if (event.target.checked) reviewed.add(event.target.dataset.review);
    else reviewed.delete(event.target.dataset.review);
    renderProgress();
    if (activeFilter !== "todos") renderRules();
  });
  byId("all-codes").addEventListener("click",()=>{codeQuery="";byId("code-search").value="";changeView("codigos",true);});
  byId("reset").addEventListener("click",()=>{reviewed.clear();renderRules();renderProgress();notify("Marcações da sessão limpas.");});
  byId("code-search").addEventListener("input",event=>{codeQuery=event.target.value;renderLibrary();});
  byId("search-trigger").addEventListener("click",openSearch);
  byId("global-search").addEventListener("input",renderSearch);
  byId("search-close").addEventListener("click",closeSearch);
  byId("guide-button").addEventListener("click",()=>byId("help-dialog").showModal());
  byId("help-close").addEventListener("click",()=>byId("help-dialog").close());
  byId("help-confirm").addEventListener("click",()=>byId("help-dialog").close());
  byId("profile-button").addEventListener("click",()=>notify("Contas individuais ainda não habilitadas no protótipo."));
  byId("brand-home").addEventListener("click",event=>{event.preventDefault();changeView("trabalho",true);});
  document.addEventListener("keydown",event=>{
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==="k") {event.preventDefault();openSearch();}
    if (event.key==="/" && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName) && !byId("search-dialog").open) {event.preventDefault();openSearch();}
  });
  renderWorkspace();
  renderLibrary();
  changeView("trabalho",false);
})();