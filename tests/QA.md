# QA — modo consulta 0.9.0

`pip install playwright==1.56.0` e `python -m playwright install chromium`; executar `ZERA_REVIEW_DIR=review python tests/test_ui.py`.

A suíte cobre abertura direta, busca global, HAS/DM, deduplicação, conferência independente por critério, pré-natal/puerpério, saúde da mulher, cópia separada, fallback de clipboard, detalhes com fontes, reset, largura 320/390/1280, ausência de requisições externas no fluxo e ausência de persistência.

Não valida a vigência das regras, integração PEC ou tempos reais. Comparação estrutural: HAS antes exigia abrir C5 e então o roteiro (2 ações); agora basta selecionar HAS (1). O campo PEC é visível sem expansão; detalhes são opcionais. Não medir tempos sem teste real.
