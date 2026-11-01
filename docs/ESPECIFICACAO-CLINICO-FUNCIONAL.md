# APS Assist — especificação funcional inicial para Estevão

**Data:** 31/10/2026 · **Versão:** 0.1.0 · **Estado:** primeira extração de regras, **não** produto completo

## Para que serve

Um assistente independente do PEC para orientar o registro verdadeiro de atendimentos na APS. Não substitui prontuário, conduta clínica, sistema de indicadores ou autorização institucional.

## Divisão de trabalho

- **Análise clínica-funcional (ChatGPT):** ler e cruzar as normas; produzir objetos de regra versionados, com códigos, campos, periodicidades, exceções e testes; conferir atualização das fontes.
- **Desenvolvimento (Estevão):** consumir arquivo JSON fornecido; montar cards, checklists, busca, cópia e interface. Não precisa interpretar protocolos médicos.
- **Validação clínica e de usabilidade (Joyce):** conferir o produto final em cenários fictícios, apontar problemas reais e aceitar ou rejeitar funcionalidades; não transcrever manuais.

## Modelo de arquitetura

```
Guias e normas oficiais
        ↓ (extração/revisão clínica-funcional)
JSON versionado de regras
        ↓ (motor de decisão)
Cards / checklist / busca / cópia / mensagens de exceção
        ↓
Médico confere e registra NO PEC por seus campos próprios
```

Não guardar nome, CPF, CNS, data de nascimento ou prontuário. Não instalar extensão no PEC real sem autorização. Sem integração autorizada, não é possível garantir que determinado indicador foi computado.

## O que o código deve fazer primeiro

1. Renderizar cards a partir do `cards[]` do arquivo JSON; não hardcodar regras na interface.
2. Cada card abre componentes com objetivo, prazo, responsável, local do PEC, códigos e exceções.
3. A busca deve pesquisar nomes, sinônimos, códigos e categorias. O botão **Copiar código** copia somente texto, não faz registro.
4. Regras com `status: awaiting...` não podem ser exibidas como prontas ou obrigatórias.
5. Conservar referência da fonte e versão da regra no componente; se mudar a norma, atualizar dados e testes, não interface.
6. Não apresentar 'indicador cumprido' quando o app não possui dados oficiais do histórico. Mostrar apenas 'conferido manualmente'.

## As cinco áreas iniciais

| Card | Correspondência | O que já está traduzido neste arquivo |
|---|---|---|
| Hipertensão | C5 | Quatro componentes principais, prazos, campos PEC, códigos e visitas ACS |
| Diabetes | C4 | Seis componentes principais, exame de HbA1c e avaliação dos pés |
| Pré-natal/puerpério | C3 | Primeira consulta, consultas, PA, peso/altura, visitas, dTpa e alerta de componentes não exauridos |
| Saúde da mulher | C7 | Rastreio colo, HPV, saúde sexual/reprodutiva, mama e faixas/janelas do indicador |
| Saúde mental | Sem correspondente específico C1-C7 no conjunto consultado | Placeholder: exige validação de subfluxos clínicos antes de programar regras |

### Exemplo real: hipertensão C5

- Consulta médica/enfermagem: >=1 nos últimos 6 meses; diagnóstico pertinente em Avaliação SOAP e condição ativa em LPC.
- PA: >=1 nos últimos 6 meses; registrar valor no campo nativo de PA, SOAP > Objetivo; referência SIGTAP 03.01.10.003-9.
- Peso e altura: >=1 registro simultâneo no mesmo dia nos últimos 12 meses; campos nativos de antropometria; SIGTAPs 01.01.04.008-3 e 01.01.04.007-5 são incluídos automaticamente em condições descritas pelo guia.
- Visitas ACS/TACS: >=2 em 12 meses, com intervalo de ao menos 30 dias; registro por ACS/TACS no e-SUS Território.
- Exceção de versão: PEC 5.4.5 ou superior habilita inclusão na LPC ao selecionar código relevante; versões anteriores exigem ativar o campo manualmente.

**Atenção:** atingir um requisito clínico-documental não comprova pontuação do indicador; a base oficial agrega dados e utiliza critérios próprios.

## Regras transversais indispensáveis

- **Multimorbidade:** paciente com HAS + DM + gestação pode ativar simultaneamente módulos. Não repetir PA ou peso apenas por aparecerem em cards diferentes.
- **Regra x clínica:** recomendações de cuidado e regras de indicador são conceitos distintos. Nunca orientar conduta desnecessária só para marcar caixa.
- **Versão de PEC:** as instruções podem variar conforme versão; registrar qual versão foi validada.
- **Agendamento C1:** agendar previamente e selecionar tipo correto; o guia consultado não confirma exigência federal geral de 3 dias de antecedência.
- **Ações não médicas:** visita ACS, vacinação por profissional responsável etc. devem aparecer como responsabilidades específicas, não tarefas atribuídas automaticamente ao médico.
- **Sem dados reais:** exemplo no protótipo é sempre fictício, sem persistência de paciente.

## Cenários de teste

1. HAS isolada: ver quatro componentes e caminhos PEC.
2. HAS e DM: apresentar componentes C4 e C5 sem duplicar a mesma medição.
3. Gestante com HAS confirmada: associar C3/C5, sem escolher automaticamente CID I10.
4. Peso e altura de dias distintos: alerta de simultaneidade.
5. Versão PEC antiga: passo de LPC manual; versão atual: sinalizar inclusão habilitada e solicitar conferência.
6. PA mencionada apenas no texto livre: não exibir confirmação de campo estruturado.
7. Visitas ACS feitas em intervalo menor que 30 dias: não declarar componente C5 atendido.
8. Sem acesso ao histórico: estado 'não verificado', jamais 'cumprido'.

## Fontes públicas para rastreabilidade

- Guia do Ministério da Saúde para preenchimento e-SUS APS (2026): https://sisaps.saude.gov.br/sistemas/esusaps/docs/guias-preenchimento%20Atual/equipeaps/
- Notas metodológicas e Nota Técnica nº 8/2026: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia

## Estado e limitações deste pacote

Esta é a **primeira tradução parcial e auditável** para desenvolvimento de interface. A cobertura de pré-natal/puerpério e saúde da mulher não está exaurida; saúde mental ainda não tem mapeamento clínico por diagnóstico. Antes de uso assistencial, cada componente precisa de checagem de elegibilidade, exceções e versão local do PEC. O objetivo é entregar documentação técnica ao programador — não transferir a Joyce a interpretação das regras.