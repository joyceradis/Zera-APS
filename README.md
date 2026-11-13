# Zera-APS — versão médica para conferência no e-SUS APS

Versão 0.5.0. A primeira entrega prioriza o fluxo médico dos componentes C4 (diabetes) e C5 (hipertensão), com caminho no PEC e códigos CID-10, CIAP-2, SIGTAP e ABEX disponíveis no mapa e na cópia. C3/C7 ficam como módulos secundários.

## Uso

1. Selecione diabetes, hipertensão ou ambos. O mapa atualiza imediatamente.
2. Use **Copiar SOAP + mapa do PEC**; o botão permanece fixo na tela.
3. Complete o SOAP com fatos reais e use os caminhos estruturados descritos.
4. Confira os códigos oficiais conforme o diagnóstico e os atos realmente realizados. Não escolha código apenas para pontuar.
5. Ações de ACS/TACS, vacinação ou outros profissionais aparecem separadas como responsabilidades da equipe; o médico não registra atos em nome de quem os executou.

A tela não acessa o PEC, não guarda dados de pacientes e não calcula pontuação. Os códigos são referências para conferência, não prescrições. A validação final da V1 depende de conferência na instalação municipal autorizada. A V1 médica só deve ser congelada após essa validação. A versão de enfermagem deve ser tratada como fluxo separado, com responsabilidades e códigos próprios, após a V1 médica.

## Arquivos

- `index.html`: seleção e apresentação do mapa de campos.
- `app.js`: regras de apresentação e geração do SOAP/checklist.
- `styles.css`: interface.
- `data/regras.js`: base estática de critérios, códigos e caminhos.
- `data/regras-aps-2026.json`: fonte editável da base.
- `docs/REVISAO-FONTES-2026-11-02.md`: revisão documental.

Os critérios foram cruzados com as fichas metodológicas oficiais e com o guia e-SUS APS. Isso não substitui validação local. O projeto não integra com PEC, não cria registros, não presume elegibilidade e não afirma que uma ação foi executada.
