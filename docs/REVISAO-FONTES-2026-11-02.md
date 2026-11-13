# Revisão documental — 02/11/2026 — versão 0.2.0

Escopo: cruzamento dos critérios dos componentes C3, C4, C5 e C7 publicados pelo Ministério da Saúde com o guia de preenchimento e-SUS APS. Revisão de documentos públicos, sem acesso ao PEC, teste em unidade, certificação institucional ou cálculo da apuração real. Complementa a especificação inicial; não constitui protocolo de conduta clínica.

## Fontes efetivamente consultadas

- [Índice oficial das notas metodológicas](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia).
- [Guia e-SUS APS 2026](https://sisaps.saude.gov.br/sistemas/esusaps/docs/guias-preenchimento%20Atual/equipeaps/), seções de gestação/puerpério, diabetes, hipertensão e saúde da mulher.
- [C3 — Gestação e puerpério](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/nota-metodologica-c3-cuidado-na-gestacao-e-puerperio/view), SEI 0054619475, item 16, datas relevantes e quadros de detalhamento.
- [C4 — Diabetes](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/nota-metodologica-c4-cuidado-da-pessoa-com-diabetes/view), SEI 0055986848, item 16 e quadros 2–7.
- [C5 — Hipertensão](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/nota-metodologica-c5-cuidado-da-pessoa-com-hipertensao/view), item 16 e quadros 2–5.
- [C7 — Saúde da mulher](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/nota-metodologica-c7-cuidado-da-mulher-na-prevencao-do-cancer/view), SEI 0054641718, item 16 e quadros 2–5.
- [Nota Técnica 8/2026](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/nota-tecnica-no-8-2026-deaps-saps-ms), SEI 0055690090: distingue monitoramento mensal, apuração quadrimestral e transmissão para Siaps; revoga NT 6/2025. Não foi implementada calculadora financeira.

## Critérios conferidos e correções

| Componente | Critério documental incorporado |
| --- | --- |
| C5 A–D | Consulta e PA em 6 meses; peso/altura no mesmo dia em 12 meses; duas visitas ACS com intervalo mínimo de 30 dias em 12 meses. |
| C4 A–F | Consulta e PA em 6 meses; peso/altura, visitas ACS, solicitação/avaliação de HbA1c e avaliação dos pés nas janelas de 12 meses. Exame dos pés: descrição em Objetivo e procedimento em Plano. |
| C3 A–F | Primeira consulta até 12 semanas; sete consultas, sete PA e sete pares de peso/altura na gestação; três visitas após a primeira consulta; dTpa a partir de 20 semanas. |
| C3 G/H | Registro de testes rápidos realizados ou exames avaliados: sífilis, HIV, hepatites B/C no primeiro trimestre; sífilis e HIV no terceiro. Solicitação isolada não equivale ao critério. |
| C3 I/J | Separação de consulta puerperal e visita ACS. Puerpério de 42 dias; nota prioriza data de desfecho, usando DUM + 294 dias para o término apenas na falta do desfecho. |
| C3 K | Atividade de saúde bucal durante a gestação, com profissionais e modelos especificados pela nota. Encaminhamento isolado não comprova execução. |
| C7 A–D | Colo: 25–64 anos, 36 meses; exceção SIGTAP 02.02.10.025-1 de 60 meses, considerada desde janeiro/2026. HPV: população feminina de 9–14 anos. Saúde sexual/reprodutiva: 14–69 anos e 12 meses. Mama: população de 50–69 anos e 24 meses na ficha, sem substituir diretrizes clínicas de rastreamento. |

A base anterior usava C3-G para um item agregado de puerpério. Isso foi corrigido para G/H (testes), I (consulta puerperal), J (visita puerperal) e K (saúde bucal). O guia HTML apresenta letra J também na saúde bucal; para a identificação dos componentes prevalece a nota metodológica C3, que usa K.

Foram preservados os critérios, fontes, CBO/responsáveis, caminhos e ressalvas de cada regra ao reunir ações de HAS/DM. Acrescentados ABEX008 (HbA1c), avaliação antropométrica e observações sobre eAP tipo 76 para visitas. Não foi presumido o tipo da equipe da unidade. A lista de códigos apresentada é de referência, não exaustiva.

## Integridade dos documentos consultados

SHA-256 dos arquivos recebidos das URLs oficiais em 02/11/2026 (os PDFs não são embarcados no aplicativo):

```text
C3: 1f6a57eeb9832e7bd0af6bde9c8339950dce88d3af552cc2318d1618f8dd4ccd
C4: fa9a8abbdab8623b9d776d6b730c1bdf7e1e01925205cd1bfb2973c5352e4ddc
C5: 0c5ef0ad7dfaa68245b7f8244d8026c0d48814b1cd02da79111c2c023ba64804
C7: 78687310444b370d25933266458f5a24cb54c30999dd2203ddb2d8e110f633c7
NT8: 7d4ccc95b776608cb356c073e57126f73dbab27b449ddf0bac9dfaf5c36917b0
Guia HTML: 6d100284df0c624bfda68f0884915ce0b877b0b2a917717faec12ca1d473c3f6
```

## Limites mantidos

Critérios documentais não comprovam elegibilidade, vínculo, situação cadastral, CBO, envio, processamento ou resultado real do indicador. A versão do PEC e os fluxos da unidade ainda precisam de conferência local. C1, C2 e C6 não estão disponíveis nesta entrega. Não há dados identificáveis, registro fictício, acesso ao PEC ou persistência entre atendimentos.


## Adendo — caminhos no PEC 5.6 e cópia segura (12/11/2026)

A versão 5.6 do PEC, publicada em 09/11/2026, acrescentou estratificação de risco cardiovascular, vulnerabilidade familiar e inativação de imóveis. A revisão abaixo trata dos caminhos do PEC; não foi realizada validação na instalação municipal. Os recursos novos são nativos e não são reproduzidos pelo Zera-APS.

### Campos e caminhos conferidos

- Pressão arterial e antropometria: padronizado o caminho para o bloco SOAP **Objetivo → Antropometria, sinais vitais e glicemia capilar**, incluindo os campos próprios de PA, peso e altura.
- Visita domiciliar: explicitada a **Visita ao Cidadão** no e-SUS Território, por ACS/TACS, com marcação de visita realizada e preenchimento de “Motivo da visita”. Para puerpério, permanece a orientação adicional sobre desfecho. A visita é responsabilidade do profissional que a realizou.
- HbA1c: mantidos os caminhos para solicitação no Plano e resultado em Objetivo; a solicitação exige justificativa e o resultado precisa de valor e data.
- C7-A: mantida a janela de 60 meses somente para o SIGTAP 02.02.10.025-1 e ampliada a lista de códigos de referência conforme a nota metodológica vigente.
- Acompanhamentos: o PEC oferece listas temáticas sob perfis autorizados. A exportação CSV é dado de nível cidadão e não deve ser transformada em uma base paralela do Zera-APS.

### Comportamento da cópia

A cópia produz um esqueleto SOAP com campos em branco e checklist dos itens selecionados. Não preenche sintomas, achados, diagnósticos, medidas, condutas, prescrições ou retornos. A seleção da tela não comprova diagnóstico, elegibilidade ou histórico. Cada item do checklist é um lembrete para conferência, não prova de execução; completar os campos e retirar lembretes operacionais antes de salvar a evolução.

Fontes consultadas para este adendo:

- [Versão 5.6 do PEC](https://sisaps.saude.gov.br/sistemas/esusaps/blog/versao-5-6/).
- [Manual do PEC — Acompanhamentos](https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/PEC/PEC_10_acompanhamento_condicoes_saude/).
- [Guia de preenchimento dos componentes de qualidade](https://sisaps.saude.gov.br/sistemas/esusaps/docs/guias-preenchimento%20Atual/equipeaps/).
- [Nota metodológica C7](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/nota-metodologica-c7-cuidado-da-mulher-na-prevencao-do-cancer/view).

A data da revisão metodológica dos componentes permanece 02/11/2026; este adendo registra apenas a conferência de caminhos e a mudança de comportamento da cópia em 12/11/2026.
