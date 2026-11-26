# AGENTS.md — regras de trabalho no Zera APS

## Produto
Zera APS é referência operacional do e-SUS APS PEC. A página comercial está em index.html; o modo de consulta em consulta.html. Preserve a separação. Não invente funcionalidades, indicadores cumpridos ou integrações.

## UX
Priorize uma tela compacta, posições estáveis, navegação por teclado, busca rápida, contraste e fonte legível. Não adicionar cards, gradientes, animações, expansão obrigatória, modais de rotina ou dashboards assistenciais. Tema Sistema/Claro/Escuro. Não aumentar cliques para obter uma informação.

## Dados e segurança
Fonte clínica canônica: data/regras-aps-2026.json. Gerar data/regras.js via python tools/gerar-base.py. Alterar regra apenas com fonte oficial, versão e revisão registrada; preservar critérios e papéis profissionais. Sem dados de pacientes em arquivos, issues, testes, storage ou logs. Não automatizar acesso ao PEC, nem lançar registros em nome de terceiros. O browser armazena somente preferência visual. Sem credenciais, segredos, custos ou serviços externos novos sem autorização.

## Antes de alterar
Leia README.md, docs/ROADMAP.md, docs/REVISAO-FONTES-2026-11-02.md e tests/QA.md. Confirme branch, issue e escopo. A branch histórica do piloto não deve ser mesclada integralmente na main.

## Entrega
Trabalhe em branch de tarefa; PR pequeno; não refatore sem necessidade. Execute:
- python tests/test_integrity.py
- node --check app.js && node --check theme.js
- python tests/test_ui.py (Playwright 1.56 e Chromium)
Relate testes de fato executados, falhas, limites, comparação de cliques quando aplicável e mudanças de regra. Um deploy não é homologação clínica. Não declare sucesso sem evidência. Em caso de falha, interrompa promoção e proponha correção/rollback.
