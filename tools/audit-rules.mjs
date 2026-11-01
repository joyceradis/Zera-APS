/**
 * Auditoria ESTRUTURAL (não normativa/clínica) das regras preliminares.
 * Zero bibliotecas externas. Executar: node tools/audit-rules.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=JSON.parse(readFileSync(resolve(root,'data/regras-aps-2026.json'),'utf8'));
const js=readFileSync(resolve(root,'data/regras.js'),'utf8');
const sandbox={window:{}};
vm.runInNewContext(js,sandbox);
assert.equal(JSON.stringify(sandbox.window.ZERA_APS_DATA),JSON.stringify(source),'Base JSON e bundle local diferentes');

assert.ok(Array.isArray(source.cards)&&source.cards.length>=5);
assert.match(source.version,/^\\d+\\.\\d+\\.\\d+$/);
assert.ok(Array.isArray(source.verified_sources)&&source.verified_sources.length>0);
const knownSystems={
  SIGTAP:/^\\d{2}\\.\\d{2}\\.\\d{2}\\.\\d{3}-\\d$/,
  'CID-10':/^[A-Z]\\d{2}(?:\\.[0-9A-Z]{1,2})?$/,
  'CIAP-2':/^[A-Z]\\d{2}$/
};
const cardIds=new Set();
const ruleIds=new Set();
const issues=[];
let codeCount=0;
function checkCode(code,context){
  const pattern=knownSystems[code.system];
  if(!pattern)issues.push(context+': sistema não reconhecido: '+code.system);
  else if(typeof code.value!=='string'||!pattern.test(code.value))issues.push(context+': código com formato inesperado: '+code.value);
  codeCount++;
}
for(const c of source.cards){
  if(!c.id||cardIds.has(c.id))issues.push('Card duplicado/sem ID: '+c.id);
  cardIds.add(c.id);
  if(!c.title||!Array.isArray(c.rules))issues.push('Card inválido: '+c.id);
  for(const r of c.rules||[]){
    if(ruleIds.has(r.id)||!r.id)issues.push('Regra duplicada/sem ID: '+r.id);
    ruleIds.add(r.id);
    for(const key of ['title','goal','window','actor','pec_location','source','verification']){
      if(typeof r[key]!=='string'||!r[key].trim())issues.push('Regra '+r.id+': campo obrigatório ausente '+key);
    }
    if(!Array.isArray(r.codes)||!Array.isArray(r.cautions)||!Array.isArray(r.conditionals))issues.push('Regra '+r.id+': listas inválidas');
    for(const code of r.codes||[])checkCode(code,r.id);
    if(r.source&&!/^https:\/\//.test(r.source))issues.push(r.id+': URL de fonte sem HTTPS');
    if(!['confirmed_in_official_esus_2026_guide','pending_verification'].includes(r.verification))issues.push(r.id+': estado editorial desconhecido');
  }
  for(const [key,values] of Object.entries(c.codes||{})){
    const system=key==='cid10'?'CID-10':key==='ciap2'?'CIAP-2':key.toUpperCase();
    for(const value of values||[])checkCode({system,value},c.id);
  }
}
if(issues.length){console.error(issues.join('\n'));process.exitCode=1;}
else console.log('PASS ESTRUTURAL: '+cardIds.size+' módulos; '+ruleIds.size+' regras; '+codeCount+' referências; JSON e JS sincronizados. Não certifica validade clínica, normativa, indicadores nem financiamento.');
