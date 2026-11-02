# ZERA-APS | Arquitetura e plano de piloto para até 50 médicos

**Atualização:** 01/11/2026 · v0.3 beta técnico, sem implantação externa.

## Objetivo do produto

Transformar tempo gasto procurando códigos, regras, campos do PEC e orientações em uma consulta contextual rápida. O médico deve reconhecer o fluxo clínico e administrativo sem ter de interpretar manuais extensos, mas o aplicativo **não deve inventar atos, diagnoses, elegibilidade ou pontuações**.

**Princípio comercial:** uso recorrente obtido por confiabilidade e economia de tempo, não por barreiras artificiais à saída. A base editorial deve ser validada e versionada.

## Estado real das entregas

| Camada | Implementação | Pendente |
| --- | --- | --- |
| Interface desktop-first | Módulos, campos, detalhes, alertas, filtros, responsividade | Revisão visual em navegadores e dispositivos reais |
| Pesquisa | Busca global, pesquisa CID/CIAP/SIGTAP, cópia | Catálogo homologado e revisão de sinônimos |
| Preferências | Favoritos por médico no backend; revisão manual temporária | Avaliação de utilidade por profissionais |
| Servidor | Node.js, HTTP, SQLite, cookies e API | Infraestrutura online e teste externo |
| Identidade | Convites de uso único, login, logout, recuperação administrada, sessões e revogação | Envio de e-mail, verificação de posse de caixa postal, segundo fator e auditoria externa |
| Administração | Cota de 50 médicos, cadastro por convite e desativação de usuários | Painel de operação e trilha de auditoria completa |
| Dados clínicos | Base preliminar com 21 regras em 4 módulos; Saúde mental sem regra | Homologação normativa e ampliação criteriosa |
| Integração PEC | Nenhuma | Somente mediante autorização institucional e avaliação de segurança |
| Hospedagem/financeiro | Nenhum deploy ou gasto realizado | Escolha de provedor, domínio, backup, contratos e custo autorizado |

**50 médicos** significa uma cota de contas médicas ativas e convites pendentes; há um ensaio local automatizado com 50 sessões independentes concorrentes. **Não significa 50 acessos reais em produção ou teste de carga no provedor.**

## Mapa de navegação

1. **Espaço de trabalho:** linhas de cuidado, escolha do contexto, componentes com responsável/janela/campo PEC/cautelas e revisão efêmera.
2. **Biblioteca:** busca unificada de referências CID-10, CIAP-2 e SIGTAP, com cópia textual.
3. **Fontes e limites:** links para guias e fichas oficiais; cobertura parcial declarada e restrições.
4. **Piloto:** visualização do estágio do produto, separando beta local e implantação externa.
5. **Conta:** identidade individual, favoritos, logout; administradores podem emitir convites, consultar usuários, desativar e gerar recuperação de senha.

## Arquitetura atual

**Navegador autenticado → aplicação Node HTTP → SQLite local persistente → contas, convites, sessões e favoritos.**

A base de regras continua como arquivos JSON/JS versionados, lidos pelo navegador. Favoritos armazenam somente IDs de regras; não identificam pacientes. A revisão de orientação é temporária e não é confirmada pelo histórico do PEC.

O repositório é público, portanto nunca inserir senhas, convites, banco SQLite, fichas, prontuários, nomes/CNS/CPF ou detalhes de pacientes.

## Arquitetura de evolução

- UI componentizada, com tokens de design e fácil migração para Next.js/TypeScript ou equivalente; **não reescrever a lógica clínica como condicionais espalhadas na interface**.
- Conservar autorização no servidor, contas por convite e sessão HttpOnly/SameSite/Secure em HTTPS.
- Em implantação: persistência externa com backup e restauração comprovados, criptografia e controles organizacionais, logs sem dados de saúde, monitoramento e rollback.
- Se houver multiunidades/municípios: modelar organizações separadas e controle de acesso por tenant no banco, com testes explícitos de isolamento. Essa etapa ainda não existe.
- Regras editoriais: registro do revisor, versão do PEC, data de norma, fonte, status, validade, testes por condição e exceções; revisão antes de publicar.
- Auditoria clínica sem viés de faturamento: jamais sugerir diagnóstico ou procedimento não realizado para obter pontuação.
- Hospedagem sob controle transferível de Joyce/Estevão; não obrigar um fornecedor nem assumir serviço pago.

## Critérios de aceite antes do piloto real

**Produto e usabilidade:** capturas e testes visuais em desktop típico da UBS; celular 390px; teclado, leitor de tela, zoom 200%; testes com médicos usando apenas casos fictícios. Verificar que localizar e copiar orientações seja mais rápido que consultar manuais.

**Clínica e normativo:** revisar e homologar os códigos, critérios, janelas, exceções, elegibilidade e versões locais do PEC; conferir casos HAS/DM/gestação, multimorbidade, registros históricos ausentes e atos de ACS/enfermagem. Não exibir “indicador cumprido” sem prova.

**Segurança e contas:** auditoria de autenticação, reset, sessão, privilégios, CSRF/XSS, revogação, múltiplas contas em computador compartilhado; testar tratamento de incidentes, logs, recuperação e backup. Confirmar responsabilidades LGPD e requisitos contratuais.

**Infraestrutura e custo:** documentar latência/erros durante teste de 50 clientes simultâneos **no ambiente de hospedagem escolhido**, implantação de banco/volume persistente e plano de rollback. Nenhum deploy ou contratação sem custo previamente aprovado.

## Próximos marcos para Estevão

1. Clonar a branch de trabalho, executar `npm test` e `npm start`. Consultar `docs/IMPLANTACAO-E-SEGURANCA.md`.
2. Executar `python3 tests/test_ui.py` com Playwright e inspecionar screenshots em desktop/mobile; corrigir acessibilidade e bugs.
3. Realizar teste guiado com 3–5 médicos em cenários completamente fictícios; coletar feedback de usabilidade, sem prontuários.
4. Preparar ambiente de homologação persistente e privado, com domínio/TLS, controle de acesso e orçamento aprovado.
5. Validar carga e segurança; depois ampliar gradualmente até 50 contas.
6. Só considerar comercialização após revisão normativa, jurídica, contratual e operacional.

A versão v0.1 está congelada em `archive/v0.1-frozen-2026-11-01`; desenvolvimento em `feat/pilot-ui-v02`, PR de rascunho. **Main preservada. Nenhum deploy, merge ou gasto adicional nesta rodada.**
