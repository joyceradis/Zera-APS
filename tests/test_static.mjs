/**
 * Smoke test sem dependências externas, executável no Node.js >= 18.
 * Confere inicialização, base, DOM referenciado, navegação e avisos de segurança.
 * Não substitui o teste de navegador Chromium/Playwright.
 *
 * Executar: node tests/test_static.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = filename => readFileSync(resolve(root, filename), "utf8");
const html = read("index.html");
const appJs = read("app.js");
const dataJs = read("data/regras.js");
const dataJson = JSON.parse(read("data/regras-aps-2026.json"));

new vm.Script(appJs, {filename: "app.js"});
new vm.Script(dataJs, {filename: "data/regras.js"});
const dataContext = {window: {}};
vm.runInNewContext(dataJs, dataContext);
const data = dataContext.window.ZERA_APS_DATA;

assert.equal(JSON.stringify(data), JSON.stringify(dataJson), "Base JS deve corresponder integralmente à fonte JSON.");
assert.equal(data.cards.length, 5, "O protótipo documenta cinco linhas de cuidado.");
assert.equal(data.cards.reduce((n, c) => n + c.rules.length, 0), 21, "A base documental atual contém 21 itens.");

const ids = [...appJs.matchAll(/byId\("([^"]+)"\)/g)].map(match => match[1]);
for (const id of new Set(ids)) {
  assert.ok(html.includes('id="' + id + '"'), "Elemento usado no JS não encontrado no HTML: " + id);
}

const elements = new Map();
const events = {};
function node(id) {
  if (!elements.has(id)) {
    const element = {
      id, innerHTML: "", textContent: "", value: "", hidden: false, dataset: {}, open: false,
      style: {setProperty() {}},
      classList: {add() {}, remove() {}, toggle() {}},
      _events: {},
      addEventListener(name, callback) {this._events[name] = callback;},
      setAttribute() {}, removeAttribute() {}, focus() {}, scrollIntoView() {},
      querySelectorAll() {return [];},
      showModal() {this.open = true;},
      close() {this.open = false;}
    };
    elements.set(id, element);
  }
  return elements.get(id);
}
const document = {
  getElementById: node,
  querySelector: node,
  querySelectorAll() {return [];},
  addEventListener(name, callback) {events[name] = callback;},
  activeElement: {tagName: "BODY"},
  createElement() {return node("_created");}
};
vm.runInNewContext(appJs, {
  document,
  window: {ZERA_APS_DATA: data},
  navigator: {clipboard: {writeText: async () => {}}},
  setTimeout: () => 0,
  clearTimeout: () => {}
});

function click(key, value) {
  events.click({
    target: {
      closest(selector) {
        return selector === "[data-" + key + "]"
          ? {dataset: {[key]: value}}
          : null;
      }
    }
  });
}

assert.equal((node("modules").innerHTML.match(/class="module-card/g) || []).length, 5);
assert.equal((node("rule-list").innerHTML.match(/class="rule /g) || []).length, 4);
assert.equal(node("metric-rules").textContent, 21);

click("module", "dm");
assert.equal((node("rule-list").innerHTML.match(/class="rule /g) || []).length, 6);
click("module", "mental");
assert.match(node("rule-list").innerHTML, /Conteúdo ainda não homologado/);
click("module", "has");
click("expand", "C5-A");
assert.match(node("rule-list").innerHTML, /Campo no PEC/);

events.change({
  target: {matches: selector => selector === "[data-review]",
    checked: true, dataset: {review: "C5-A"}}
});
assert.match(node("progress-title").textContent, /^1 de 4/);

node("global-search").value = "I10";
node("global-search")._events.input({target: {value: "I10"}});
assert.match(node("search-results").innerHTML, /data-search-kind="code"/);

node("code-search").value = "I10";
node("code-search")._events.input({target: {value: "I10"}});
assert.match(node("code-library").innerHTML, /I10/);

for (const forbidden of ["localStorage", "sessionStorage", "indexedDB"]) {
  assert.ok(!appJs.includes(forbidden), "Não adicionar persistência de sessão ou pacientes: " + forbidden);
}

console.log("PASS: fonte JSON íntegra; 5 áreas; 21 itens; ids DOM; HAS/DM; saúde mental pendente; detalhes; revisão temporária; busca I10; sem persistência.");
