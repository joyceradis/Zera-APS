# Zera-APS — MVP estático (v0.1)

**Situação:** protótipo funcional de navegação, pesquisa, checklist manual e cópia de códigos. **Não é** produto assistencial homologado, integração com o PEC ou calculadora de indicadores.

## Como executar (Estevão)

1. Baixe o projeto, mantendo a estrutura de pastas.
2. Abra `index.html` em um navegador moderno (Chrome, Edge ou Safari). **Não precisa instalar nada nem pagar hospedagem**.
3. Selecione um card (Hipertensão, Diabetes, Gestante e puerpério, Saúde da mulher ou Saúde mental).
4. Explore as regras, busque nomes ou códigos e use o botão **Copiar**.
5. Clique nos quadradinhos de **revisado** para acompanhar sua leitura. As marcações somem quando a página é recarregada.

A busca é global: procure uma palavra para localizar informações em todos os módulos. Saúde mental permanece sem regras clínicas, intencionalmente, até validação.

## Estrutura

- `index.html`: estrutura semântica do site.
- `styles.css`: interface responsiva para celular/computador.
- `app.js`: lógica de navegação, busca por sinônimos/códigos, checklist manual e cópia.
- `data/regras.js`: base local carregada pelo navegador (sem servidor).
- `data/regras-aps-2026.json`: base fonte de regras preliminares (versão pesquisável).
- `docs/ESPECIFICACAO-CLINICO-FUNCIONAL.md`: escopo e cenários clínico-funcionais preliminares.
- `tests/QA.md`: verificações e limitações.

Quando modificar `data/regras-aps-2026.json`, **gere novamente** `data/regras.js`:

```sh
python3 tools/gerar-base.py
```

Este comando também rejeita IDs duplicados. Depois execute `python3 tests/test_ui.py` (requer Playwright/Chromium instalado) para conferir a interface.

### Princípios de implementação

- **Sem backend:** não usa autenticação, servidores, APIs nem serviços pagos.
- **Sem dados de pacientes:** não coletar CPF, CNS, nome, idade identificável ou texto livre de evolução.
- **Sem alterações no PEC:** o botão copia códigos apenas; o profissional deve registrar informações verdadeiras nos campos apropriados.
- **Indicadores:** nenhum checkbox afirma que um indicador foi atingido.
- **Revisão obrigatória:** o JSON clínico é uma primeira extração, com cobertura parcial de condições e critérios. Cada regra precisa ser revisada e versionada contra documentos oficiais antes de comercialização ou uso assistencial.

## Antes de divulgar publicamente

1. Revisar códigos e cada regra no material normativo atualizado, com identificação de versão.
2. Criar cenários de teste de elegibilidade, temporalidade, multimorbidade e ações de outros profissionais.
3. Validar fluxos reais em ambiente autorizado do PEC, somente com dados fictícios.
4. Revisar segurança, acessibilidade, direitos de uso, regulatório e privacidade.

**Não há cobrança, instalação no PEC, deploy ou integração realizada por este pacote.**