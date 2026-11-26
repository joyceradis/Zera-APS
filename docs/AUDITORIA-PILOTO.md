# Triagem técnica do piloto e limpeza da main — 25/11/2026

## Preservar
- Base clínica canônica JSON e JS gerado, 25 regras, fontes e ressalvas.
- Landing, consulta compacta e temas compartilhados; os três documentos HTML atuais não referenciam home.css nem styles.css.
- CI, testes de integridade, documentação e histórico Git.
- Branch feat/pilot-ui-v02: núcleo Node/SQLite, hash scrypt, sessões por hash, convites de uso único, revogação, favoritos isolados, testes de API e backup. São candidatos a reaproveitamento seletivo, não validação de produção.

## Remover da main
home.css e styles.css: sem referências nos HTML atuais. Recuperáveis pelo histórico. Não remover da branch piloto, que ainda depende de styles.css.

## Corrigir
A busca anterior serializava todo o objeto card em cada regra, trazendo os códigos de diagnóstico para todas as linhas. Pesquisar apenas dados do critério, códigos pertinentes e sinônimos explícitos; adicionar teste de I10 retornando apenas consulta, SIGTAP sem pontuação e HbA1c por sinônimo.

## Backend: riscos antes de reutilizar
- Roteamento antigo protege /index.html e tem allowlist estática da interface antiga. Adaptar para landing pública e consulta protegida; revisar todos os ativos, cache e testes. Não copiar UI antiga.
- Scrypt síncrono no processo HTTP: medir bloqueio do event loop e resistência a abuso em carga; considerar versão assíncrona e limites de concorrência.
- Limite de login usa endereço do socket: validar comportamento atrás de proxy confiável, sem aceitar cabeçalhos de cliente indiscriminadamente; revisar limites de convite/recovery e expiração.
- Recuperação administrativa, posse de e-mail não verificada, falta de auditoria completa e 2FA: requerem desenho e avaliação antes de expor autenticação.
- Backup verifica integridade e permissões, mas não demonstra restauração operacional; testar restauração isolada, retenção e revogação de sessões.
- Sem implantação, custo, contas reais ou armazenamento de informações de pacientes. A recuperação seletiva da branch está prevista na [issue #9](https://github.com/joyceradis/Zera-APS/issues/9). O [PR #1](https://github.com/joyceradis/Zera-APS/pull/1) foi encerrado e a branch histórica foi preservada.

Revisão estática dos arquivos server/core.mjs, server/http.mjs, server/backup.mjs, client-auth.js, tests/server.test.mjs e documentação do piloto. Não foram executados testes de backend nem auditoria externa. A revisão normativa continua pendente.