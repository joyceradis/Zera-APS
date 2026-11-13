# Zera-APS — V1 médica

Versão 0.6.0. A primeira entrega prioriza o fluxo médico dos componentes C4 (diabetes) e C5 (hipertensão). Selecione uma ou ambas as condições para ver, na sequência, a ação, o caminho do PEC e os códigos de referência. O mapa pode ser copiado junto com um SOAP curto.

C3 e C7 ficam recolhidos como módulos secundários. Visitas, vacinação e outros atos de equipe ficam separados do fluxo médico. A versão de enfermagem será desenvolvida como fluxo próprio depois da validação da V1 médica.

CID-10/CIAP-2 devem corresponder ao diagnóstico confirmado; SIGTAP/ABEX, ao registro solicitado ou realizado. Não escolha código apenas para pontuar. Complete o SOAP com fatos reais e remova o mapa antes de salvar.

A tela não acessa o PEC, não guarda dados de pacientes e não calcula pontuação. Os caminhos precisam ser validados na instalação municipal autorizada antes de congelar a V1.

## Fontes e arquivos

Os critérios vêm das notas metodológicas oficiais e do guia e-SUS APS. Consulte `data/regras.js` e `data/regras-aps-2026.json` para a base; `index.html`, `app.js` e `styles.css` compõem a interface.
