# ZERA-APS — Evidência de qualidade e critérios de liberação
**Data:** 01/11/2026. **Branch:** `feat/pilot-ui-v02`. **Status:** beta técnico em PR #1 (rascunho); main e v0.1 preservadas.

## Ensaios executados nesta rodada

| Ensaio | Resultado | Ambiente e limitação |
| --- | --- | --- |
| Node `--test tests/server.test.mjs` | **PASS: 4/4** | Node 22.16, SQLite nativo; testa autenticação, convite, reemissão/cancelamento, quota e 50 sessões concorrentes via HTTP em loopback |
| Controle de acesso em HTTP | **PASS** | Testes locais: recursos protegidos exigem login; arquivo interno e `.env` não servidos; `Host` inválido rejeitado; conta médica não acessa API de administração |
| Teste local de 50 contas | **PASS funcional** | 50 contas fictícias com sessões isoladas, 50 leituras HTTP concorrentes. **Não é benchmark ou SLA no host de produção.** |
| Bootstrap administrativo, reemissão e cancelamento | **PASS** | CLI testada com banco temporário e e-mails fictícios; convites pendentes de outros administradores são rejeitados |
| DOM simulado da interface v0.3 | **PASS: 10/10** | Testa IDs referenciados, módulos, 21 regras, biblioteca de códigos, favoritos, busca e contrato de carga. **Não substitui browser real.** |
| Frontend de login em Chromium usando `page.set_content` | **PASS para layout estático** | Capturas em desktop 1440 e celular 390; sem transbordamento horizontal. Estados de erro de login, convite e recuperação conferidos com `fetch` simulado. |
| Auditoria estrutural da base | **PASS em inspeção estrutural** | 5 módulos, 21 regras, 56 referências com formato válido; base JS e JSON coerentes. **Não é revisão normativa.** |
| Playwright integrado ao servidor real | **BLOQUEADO neste ambiente** | Navegação de Chromium por URL foi impedida por política de acesso (`ERR_BLOCKED_BY_ADMINISTRATOR`). O teste automatizado do repositório permanece pendente no Mac do desenvolvedor. |
| Screenshots visuais da interface clínica completa | **PENDENTE** | Sem evidência de visual real do dashboard na sessão; executar `tests/test_ui.py` localmente. |
| Uso em produção/convites reais | **NÃO REALIZADO** | Sem hospedagem, domínio, dados de pacientes, integração com PEC, merge ou gasto. |

Os cenários da suíte do backend usam e-mails `example.test` e dados sintéticos; os valores de latência locais não têm validade para servidor externo.

## Execução no Mac de Estevão

~~~sh
node --version
npm test
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/test_ui.py
python3 tests/test_auth_ui.py
~~~

Os testes de navegador devem produzir evidências de telas desktop/mobile, navegação por teclado, favoritos persistentes, login individual, encerramento de sessão e ausência de console errors. Sempre usar apenas dados fictícios. Para revisar a experiência visual no computador de uma UBS, conferir Chrome ou Edge e zoom de 200%.

## Portões ainda obrigatórios

1. **Clínico/normativo:** homologar cada orientação, código, período, exceção e versão aplicável do PEC. Não apresentar cumprimento de indicadores ou faturamento sem evidência oficial e integração autorizada.
2. **Qualidade visual:** validar telas reais, responsividade, estados de erro, contrastes, acessibilidade, processo de login e administração de 50 usuários.
3. **Segurança:** auditoria de autenticação e autorização, testes de vulnerabilidade, logout e sessão em computador compartilhado, cópias de segurança e recuperação.
4. **Operação:** HTTPS, domínio, hospedagem com volume persistente, plano de incidentes, rollback, métricas técnicas e custo aprovado.
5. **Teste de carga:** 50 sessões no **provedor escolhido**, com relatório reproduzível de erros e desempenho.
6. **Jurídico/comercial:** termos, política de privacidade, LGPD, responsabilidade profissional e avaliação regulatória.
7. **Governança:** revisão de PR e aprovação antes de merge/deploy. O Issue #2 acompanha esses portões.

A arquitetura é um **beta executável local**. O produto para médicos externos ainda não está homologado nem concluído.
