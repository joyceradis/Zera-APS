# ZERA-APS

**Plataforma de apoio à conferência do registro na Atenção Primária à Saúde (e-SUS PEC).** Reduz a busca por códigos, prazos, campos e referências, sem substituir o prontuário ou a decisão clínica.

**Estado em 01/11/2026:** beta técnico v0.3, não homologado e não publicado. O código está isolado em uma branch para revisão, enquanto a versão zero e a main permanecem intactas.

## Versões

| Versão | Referência | Estado |
|---|---|---|
| v0.1 original | `archive/v0.1-frozen-2026-11-01` | Imutável, commit `3a2c11effd9fb39e0a31a4e84f9d9752be2b5ccc` |
| v0.3 beta técnico | `feat/pilot-ui-v02` | Interface profissional + backend de acesso individual em desenvolvimento |
| Produção | `main` | Não alterada; nenhum merge ou deploy |

## O que foi implementado

**Interface:** navegação desktop-first responsiva, cinco linhas de cuidado (Hipertensão, Diabetes, Gestante/puerpério, Saúde da mulher e Saúde mental ainda sem regras), busca global com Ctrl/Cmd+K, biblioteca de códigos, referências, campos do PEC e alertas. Códigos são copiados para conferência, não lançados automaticamente. Favoritos por usuário quando conectado ao servidor.

**Backend piloto:** execução Node.js sem dependências npm; SQLite persistente; convites individuais com prazo e uso único; contas e sessões segregadas; autenticação por senha com scrypt; cookies HttpOnly; proteção CSRF/Origin; perfis administrador/editor/médico; controle de até 50 vagas médicas (ativos + convites pendentes); administração básica de convites, usuários e desativação de contas. O backend não recebe dados clínicos de pacientes.

**Importante:** a base documental é parcial (21 componentes em 4 linhas de cuidado). As regras exigem auditoria clínica/normativa e não calculam indicadores nem faturamento oficial.

## Executar localmente — Estevão

Requer **Node.js 22.13+** (preferencialmente Node 24) em Mac, Linux ou Windows com suporte a SQLite nativo. Sem necessidade de instalar bibliotecas npm.

~~~sh
npm test
npm start
~~~

Em outro terminal, para criar o primeiro acesso administrativo:

~~~sh
npm run bootstrap-admin -- admin@seudominio.com.br
~~~

O comando exibe um **convite único e sigiloso**. Abra o link no navegador, defina senha de no mínimo 12 caracteres e entre no servidor local em `http://localhost:8787`. Pelo botão de perfil, o administrador pode convidar médicos, copiar o link e desativar contas. O servidor **não envia e-mails**. Não enviar convites reais antes de validar o ambiente.

O backend usa SQLite em `runtime/zeraaps.sqlite` (não publicar esse arquivo). `.env.example` documenta PORT, APP_ORIGIN, HOST, ZERA_DB_PATH e ZERA_MAX_DOCTORS. Execução de desenvolvimento escuta somente `127.0.0.1`.

Para testar a interface de fato com Chromium/Playwright:

~~~sh
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/test_ui.py
~~~

Este teste não foi confirmado em navegador real nesta rodada e exige revisão de screenshots, navegação por teclado e dispositivos. O teste Node é automatizado, mas não substitui essa etapa.

## Estrutura

- `index.html`, `styles.css`, `app.js` — interface e fluxo clínico.
- `login.html`, `login.css`, `login.js`, `client-auth.js` — experiência de acesso e administração.
- `server/core.mjs`, `server/http.mjs`, `server/launch.mjs`, `server/cli.mjs` — contas, persistência, API, sessões e bootstrap.
- `data/regras-aps-2026.json` — conteúdo clínico preliminar; `data/regras.js` é gerado a partir dele por `python3 tools/gerar-base.py`.
- `tests/server.test.mjs` — suíte de identidade, privacidade e 50 sessões concorrentes **em ambiente local**.
- `tests/test_static.mjs` — smoke test sem dependências de navegador.
- `tests/test_ui.py` — testes e capturas no Chromium (execução local a confirmar).
- `docs/IMPLANTACAO-E-SEGURANCA.md` — implantação e limites de segurança.
- `docs/PLANO-PILOTO-50.md` — roadmap de produto e critérios de aceite.
- `docs/ESPECIFICACAO-CLINICO-FUNCIONAL.md` — requisitos clínico-funcionais iniciais.

## Antes de usar com até 50 médicos

Faltam revisão visual em navegador real, teste de carga na infraestrutura escolhida, auditoria de segurança, recuperação de contas, operação de backup/restauração, proteção de dados, escolha de hospedagem persistente, avaliação jurídica/regulatória e homologação clínica das regras.

**Não houve deploy, custos, compra de domínio, criação de contas reais, publicação em produção ou conexão ao PEC.** O repositório continua público: jamais colocar dados pessoais identificáveis de pacientes, segredos, tokens, convites ou bancos de produção.

O ZERA-APS não verifica se uma medição foi realizada, se um código foi registrado no PEC, se houve transmissão ao SISAB ou se um indicador foi atingido. O profissional deve documentar apenas atos efetivamente realizados.
