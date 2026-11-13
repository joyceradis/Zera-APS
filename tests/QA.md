# Validação da interface 0.8.0

A suíte `test_ui.py` acompanha a seleção automática de indicadores e valida:

- Critérios, caminhos e fontes distintos de HAS e diabetes, reunidos sem perda de informação.
- Busca por código e texto; estado vazio; ações da equipe acessíveis durante a busca.
- Conferência manual preservada ao filtrar e apagada quando o cenário muda.
- Prévia SOAP, cópia de códigos/rascunho e alternativa visível quando a cópia falha.
- Pré-natal e puerpério, multimorbidade, limpeza, recarregamento e teclado.
- Ausência de rolagem horizontal em 320, 390 e 768 px, inclusive com detalhes e prévia.
- Ausência de erros JavaScript, persistência e requisições externas durante o fluxo.

Executar com Python + Playwright e Chromium instalados:

```sh
pip install playwright==1.56.0
python -m playwright install chromium
ZERA_REVIEW_DIR=review python tests/test_ui.py
```

`CHROMIUM_EXECUTABLE` permite indicar um Chromium já instalado. O workflow da PR executa a mesma suíte e guarda capturas por 7 dias. A base clínica não foi alterada; os testes de interface não validam critérios clínicos nem a instalação municipal do PEC.
