# ZERA-APS

Plataforma de orientação de registros no e-SUS APS (PEC), em desenvolvimento. **A base clínica é preliminar e não homologada; a interface não substitui prontuário, decisão clínica ou regras oficiais de financiamento.**

## Versões

| Linha | Referência | Estado |
| --- | --- | --- |
| v0.1 congelada | archive/v0.1-frozen-2026-11-01 | Reprodução integral da versão inicial |
| v0.2 interface piloto | feat/pilot-ui-v02 | Design desktop-first, busca, fluxos, biblioteca e plano de arquitetura |
| Produção | main | Permanece sem alterações até revisão/merge |

**Atenção:** o repositório é público. Não suba senhas, dados pessoais, prontuários ou arquivos reais de municípios.

## Executar a interface

No branch de trabalho v0.2, abra index.html em um navegador moderno ou execute um servidor HTTP local. Não exige contas, pacotes npm nem contratação de hospedagem. A base continua em data/regras.js, derivada de data/regras-aps-2026.json.

A versão 0.2 oferece quatro áreas: Espaço de trabalho; Biblioteca de códigos; Fontes e limites; Preparação do piloto. Os cinco módulos clínicos são Hipertensão, Diabetes, Gestante e puerpério, Saúde da mulher e Saúde mental (pendente).

Fluxo:
1. Selecionar módulo.
2. Expandir uma orientação e conferir campo PEC, janela temporal e ressalvas.
3. Copiar o código **apenas se clinicamente pertinente**.
4. Usar a revisão de leitura como apoio temporário, jamais como indicador cumprido.
5. Pressionar Ctrl+K ou Cmd+K para busca em orientações e códigos.

**Não há sessão médica, backend, cálculo oficial, gravação de pacientes ou integração ao PEC.** As revisões desaparecem ao atualizar a página.

## Arquivos de maior relevância

- index.html — estrutura e navegação.
- styles.css — design system responsivo.
- app.js — interface, busca global, código contextual e filtros de revisão.
- data/regras-aps-2026.json — base clínica parcial, com ressalvas.
- data/regras.js — versão JS gerada a partir do JSON.
- docs/ESPECIFICACAO-CLINICO-FUNCIONAL.md — escopo e cenários.
- docs/PLANO-PILOTO-50.md — arquitetura server-backed proposta, gestão de contas e critérios de aceite de 50 médicos.
- tests/test_ui.py — testes automatizados de interface para Chromium/Playwright.

## Desenvolvedor — Estevão

Para regenerar a base após alterar JSON:

~~~sh
python3 tools/gerar-base.py
~~~

Para validar sintaxe e interface (depende de Chromium/Playwright local):

~~~sh
node --check app.js
python3 tests/test_ui.py
~~~

O teste em Python espera Chromium em /usr/bin/chromium. Ajuste se usar macOS.

### Antes de demonstrar a médicos externos

1. Revisar e homologar regras e códigos contra a versão vigente das fontes oficiais.
2. Testar com dados fictícios, especialmente HAS/DM, gestação, multimorbidade e versões PEC.
3. Não anunciar capacidade autenticada para 50 usuários sem implantação e teste de carga.
4. Implementar autenticação, autorização, segregação de contas e sessões seguras **no servidor**.
5. Tratar LGPD, segurança, direitos de uso, termos e responsabilidade antes de comercializar.
6. Planejar domínio, deploy e custos **antes** de contratar qualquer coisa.

A arquitetura futura **não obriga** um provedor específico. A interface pode ser migrada sem reescrever o conteúdo editorial.

## Limites funcionais

O ZERA-APS **não confirma** que uma orientação foi seguida, que um SIGTAP foi registrado, que um indicador foi atingido, que houve transmissão de dados ao SISAB ou que houve repasse de recursos. Uma marcação na interface é somente leitura manual. As ações de saúde devem corresponder ao que efetivamente foi realizado pelo profissional responsável.

## Referências iniciais

- Guia e-SUS APS: https://sisaps.saude.gov.br/sistemas/esusaps/docs/guias-preenchimento%20Atual/equipeaps/
- Fichas técnicas da APS: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia
