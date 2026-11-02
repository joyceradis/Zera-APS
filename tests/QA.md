# Validação do roteiro interativo

A verificação técnica demonstra funcionamento da interface; não valida critérios normativos, uso assistencial ou apuração de indicadores.

## Cenários automatizados

- Nenhuma condição selecionada inicialmente; roteiro indisponível até escolha válida.
- HAS + diabetes com seis ações, separando registro do atendimento e equipe.
- Regras C4/C5 preservam cada campo PEC, prazo, fonte e ressalva, mesmo agrupadas.
- Busca restrita às situações do roteiro, com suporte a acentos e códigos.
- Marcação manual preservada ao filtrar e apagada ao montar outro roteiro.
- Cópia entrega apenas o código; o teste usa uma API simulada e não comprova a área de transferência do dispositivo final.
- Novo atendimento remove escolhas, fase, busca, roteiro, mensagem e marcações.
- Pré-natal e puerpério mutuamente exclusivos, sem fundir seus critérios com HAS.
- Saúde da mulher mantém os alertas de elegibilidade, sem assumir faixa etária ou indicação.
- Navegação por teclado nos controles nativos.
- Layout sem transbordamento horizontal a 320 e 390 px.
- Carregamento dos arquivos reais por HTTP local, sem requisições a serviços externos nem erros JavaScript.

## Pendências identificadas

- Manutenção da revisão documental dos critérios quando houver alterações oficiais. Revisão realizada em 02/11/2026, com rastreabilidade em docs/REVISAO-FONTES-2026-11-02.md.
- Validação dos caminhos na versão do PEC da unidade e de eventuais fluxos municipais.
- Validação de usabilidade pela médica em cenários fictícios, sem dados identificáveis.
- Teste da área de transferência e do navegador do computador da unidade.
- Confirmação institucional de qualquer futura integração com PEC/histórico.
