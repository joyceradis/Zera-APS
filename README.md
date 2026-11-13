# Zera-APS — cola médica do PEC

Versão 0.8.0. A tela prioriza a conferência dos componentes C4 (diabetes) e C5 (hipertensão). Escolha um ou ambos para ver o campo do PEC, os códigos relacionados e os critérios em detalhes. O botão fixo copia um SOAP em branco com o mapa.

C3/C7 estão em “Outros indicadores”. Ações de ACS/TACS, vacinação ou outros profissionais ficam separadas da lista médica. A versão de enfermagem será um fluxo próprio depois da validação da V1 médica.

CID-10/CIAP-2 devem corresponder ao diagnóstico confirmado; SIGTAP/ABEX, ao registro solicitado ou realizado. A ferramenta não acessa o PEC, não guarda dados de pacientes, não calcula pontuação e não confirma execução. Valide os caminhos na instalação municipal antes de congelar a V1.

Arquivos: `index.html`, `app.js`, `styles.css` e a base estática em `data/regras.js`.


A interface oferece seleção lateral, busca por campo/exame/código, conferência manual em memória e prévia do rascunho SOAP. Mudar os indicadores limpa as marcações. A conferência não representa execução nem pontuação. Layout adaptado para computador e celular.

Validação: consulte `tests/QA.md`.
