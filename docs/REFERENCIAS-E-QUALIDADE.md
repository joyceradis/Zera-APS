# Referências de produto e engenharia

Pesquisa realizada em 25/11/2026. Referências de arquitetura, não código incorporado.

| Referência | Aprendizado | Decisão |
|---|---|---|
| [Painel e-SUS APS / Fiocruz](https://github.com/CampusVirtualFiocruz/painel-esus) | Gestão e monitoramento a partir das bases municipais | Manter eventual integração separada, dependente de autorização institucional |
| [Monitora Fácil](https://github.com/rayhenrique/monitorafacil) | Modelagem de monitoramento de qualidade | Preservar regras versionadas e não confundir orientação com apuração oficial |
| [OpenMRS 3 Patient Chart](https://github.com/openmrs/openmrs-esm-patient-chart) | Modularidade da interface clínica | Não importar a arquitetura completa de um prontuário para uma ferramenta de referência |
| [NHS Frontend](https://github.com/nhsuk/nhsuk-frontend) | Padrões de acessibilidade | Validar contraste, foco e navegação por teclado |
| [Indicadores APS – e-SUS PEC](https://chromewebstore.google.com/detail/indicadores-aps-%E2%80%94-e-sus-p/lalmgbfbnnilhkdmofcgfblfjlpnheai) | Produto adjacente que anuncia pendências individuais via servidor municipal | Tratar integração como hipótese futura, não como funcionalidade atual |

## Gates de qualidade

- Workflow Interface do Zera APS: Playwright em três larguras, cópia, reset, navegação e persistência limitada à preferência visual.
- Workflow Integridade e contraste: consistência JSON/JS, IDs únicos, links internos e sintaxe JavaScript. Contraste de texto mínimo 4,5:1 e borda de campo 3:1 nas paletas avaliadas.
- O GitHub Pages mantém seu mecanismo atual de publicação. A aprovação de um teste não certifica a validade normativa nem a acessibilidade integral.
- Não reutilizar dados reais em testes. Não implementar escrita ou leitura do PEC sem autorização.
- Não adicionar autenticação, cobrança ou infraestrutura pesada antes de validar o fluxo assistencial.
