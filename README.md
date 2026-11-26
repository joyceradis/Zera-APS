# Zera APS — consulta rápida do PEC

Versão 0.9.0 (refatoração em revisão). Uma tela: busca por registro/código, seleção de condições, tabela de critérios e caminhos, detalhes de referência. C3/C4/C5/C7; sem C1/C2/C6. A seleção não estabelece elegibilidade. Marcação manual por critério, preservada durante a seleção e apagada ao limpar consulta. Não comprova execução ou pontuação.

Cópias separadas: SOAP em branco para preenchimento real; roteiro exclusivamente para consulta operacional. Não colar roteiro no prontuário. Não acessa o PEC, não armazena pacientes e não calcula indicadores. A base normativa foi preservada sem alteração; validar as fontes vigentes e a instalação local.

Executar `python tests/test_ui.py` com Playwright 1.56 e Chromium. A interface usa index.html, consulta.css, app.js e data/regras.js. Os estilos antigos continuam no repositório para a página de novidades e histórico.
