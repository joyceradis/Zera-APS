# Validação técnica — Zera-APS v0.1

## Testes previstos

- [x] Carrega cinco cards sem requisições a servidores externos.
- [x] Hipertensão mostra quatro componentes de orientação, com pontos de atenção.
- [x] Diabetes apresenta seus componentes; Saúde mental exibe aviso de pendência.
- [x] Busca universal por 'pressão' retorna orientações de mais de uma área.
- [ ] Busca por 'I10' retorna código CID-10 pesquisável.
- [ ] Botões de código copiam apenas o identificador, sem afetar o PEC.
- [x] Marcação manual muda o progresso; limpar revisões zera; recarregar não mantém estado.
- [ ] Navegação por teclado e layout responsivo em 390px.
- [x] Nenhum campo ou formulário solicita informação de pacientes.

## Limitações clínicas e operacionais

- As 21 regras documentadas abrangem parcialmente quatro áreas; não foram integralmente auditadas nesta implementação.
- O módulo Saúde mental não possui conteúdo clínico.
- Sem leitura do histórico, não há como confirmar indicadores, elegibilidade, periodicidade ou versão do PEC do município.
- Não confirma se um código SIGTAP gerado pelo PEC foi efetivamente transmitido e computado.
- A atualização normativa não é automática: exige revisão editorial da base e novos testes.
- Um profissional deve revisar relevância dos códigos clínicos (não existe seleção diagnóstica automática segura).

Execução local com Chromium/Playwright: **PASS** para os cenários automatizados em `tests/test_ui.py` (incluindo largura 390px sem transbordamento). A cópia para área de transferência e navegação por teclado ainda precisam de teste manual no dispositivo final.