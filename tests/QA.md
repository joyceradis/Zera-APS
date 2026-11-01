# ZERA-APS | Relatório técnico de qualidade e pendências (01/11/2026)

## Entrega e versão

**Beta v0.3:** interface profissional, autenticação por convite, administração básica, recuperação de acesso, favoritos por usuário, SQLite, perfis e API. `main` preservada; versão v0.1 congelada. PR de rascunho, sem merge/deploy, sem contas reais e sem cobrança.

## Evidências de teste

| Verificação | Resultado | Limites |
| --- | --- | --- |
| Sintaxe do JavaScript principal | PASS em runtime V8 | Não é prova de funcionalidade do navegador |
| IDs do DOM em index.html | PASS, 29 referências existentes | Checagem estática |
| Base JSON e JS sincronizados | PASS na comparação de conteúdo | A base clínica continua parcial |
| UI com DOM simulado | PASS, 11/11 verificações | Simulação de componentes, não Chromium |
| Backend: senhas, convites, sessões, CSRF/Origin, perfis, favoritos e revogação | PASS, testes Node no ambiente local | Não representa auditoria de segurança externa |
| Recuperação de senha por admin | PASS, testes Node no ambiente local | Não há envio automático ou verificação de e-mail |
| Banco com 50 médicos e 50 GETs de sessão concorrentes | PASS no teste local | Não equivale a teste de carga do host final |
| Formatos de 56 referências preliminares | PASS na auditoria de padrões | Formato não prova validade clínica/normativa |
| Auditoria automatizada via `npm test` no checkout GitHub completo | PENDENTE | Executar após clonar a branch |
| Playwright desktop e 390px `tests/test_ui.py` | PENDENTE | Necessária execução visual e revisão de screenshots |
| Playwright convites/favoritos/logout `tests/test_auth_ui.py` | CRIADO, NÃO EXECUTADO | Testes de navegador real pendentes |
| Teclado, contraste, zoom 200% e leitor de tela | PENDENTE | Auditoria de acessibilidade |
| Teste de 50 usuários contra serviço HTTPS hospedado | NÃO EXECUTADO | Nenhum deploy foi realizado |
| Homologação de regras e permissões institucionais PEC | NÃO REALIZADA | Uso somente com dados fictícios |

## Procedimento reprodutível no Mac ou Linux

~~~sh
node --check app.js
node --check login.js
node --check client-auth.js
npm test
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/test_ui.py
python3 tests/test_auth_ui.py
~~~

**Não usar dados de pacientes** nos testes e não divulgar convites gerados.

## Restrições antes do uso real

1. Validar a interface em navegadores reais, acessibilidade e funcionamento com perfis de médicos.
2. Revisar clinicamente as 21 orientações e suas exceções, com normas vigentes e diferenças de versões do PEC.
3. Definir ambiente de hospedagem com TLS, DB persistente, backup/restauração, rastreabilidade e orçamento aprovado.
4. Auditar segurança e privacidade, especialmente acesso em computadores compartilhados, revogação e exposição de links de convite.
5. Conduzir teste de carga real e gradual no provedor escolhido; o teste local não atesta SLA nem throughput em produção.
6. Avaliar LGPD, responsabilidades do produto e eventual regulamentação aplicável antes de comercializar.
7. Impedir que o sistema indique falsamente registro no PEC, pontuação alcançada ou faturamento municipal.

**A aprovação de merge, deploy, inclusão de pacientes e operação assistencial continua bloqueada até as validações correspondentes.**
