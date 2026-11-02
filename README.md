# Zera-APS — roteiro de conferência no PEC

Aplicativo interativo para organizar a conferência dos registros de um atendimento de APS. Versão 0.2.0: critérios de C3, C4, C5 e C7 cruzados com as notas metodológicas oficiais e o guia e-SUS APS em 02/11/2026. A apuração oficial não é calculada. Consulte a rastreabilidade em [REVISÃO DE FONTES](docs/REVISAO-FONTES-2026-11-02.md).

## Como usar

1. Selecione as situações já reconhecidas no atendimento. Pode combinar hipertensão e diabetes, por exemplo.
2. Se selecionar gestação/puerpério, escolha a fase. Os dois percursos são separados.
3. Clique em **Montar meu roteiro**.
4. Confira os itens do registro do atendimento e, separadamente, os que dependem da equipe.
5. Abra **Ver campo do PEC e critério de conferência** quando precisar do caminho, prazo, profissional, ressalvas ou código.
6. Marque **Já conferi este item no PEC** apenas como controle manual de leitura.
7. Use **Novo atendimento** para apagar as escolhas, busca e marcações antes de outro caso.

Não informe identificadores de pacientes. As escolhas existem apenas na memória da página: recarregar também as apaga. Alterar situações e montar outro roteiro limpa as marcações anteriores.

## Limites clínicos e de apuração

- O aplicativo não acessa o PEC, o histórico ou o sistema oficial de indicadores.
- A base não foi validada para a versão local do PEC nem para a unidade de Vitor Hugo, em Marechal Floriano.
- Selecionar uma situação não verifica elegibilidade, idade, histórico, modalidade de exame ou indicação clínica.
- HAS e diabetes compartilham algumas ações de leitura, com mapeamento explícito por ID. Cada regra mantém seu prazo, código, campo, responsável, ressalvas e fonte nos detalhes.
- Os componentes obstétricos não são mesclados aos de HAS/DM por semelhança de título.
- Os 11 componentes A–K de C3 estão separados em pré-natal (A–H e K) e puerpério (I e J). C1, C2, C6, saúde mental e outros percursos ainda não estão incluídos.
- A ausência de um registro não indica automaticamente repetição de procedimento.
- Os critérios e caminhos foram cruzados documentalmente com fontes públicas. Isso não valida a implementação local do PEC ou a elegibilidade real de uma pessoa. O nome antigo “Previne Brasil” não identifica por si só qual regra se aplica.

## Desenvolvimento

O navegador executa a lógica localmente; não há servidor de aplicação, bibliotecas externas, rastreadores ou persistência. Sirva a pasta com um servidor HTTP local para avaliar o aplicativo:

```sh
cd /workspace/Zera-APS
python3 -m http.server 8000 --bind 127.0.0.1
```

Arquivos principais:

- `index.html`: entrada de situações e resultado do roteiro.
- `app.js`: seleção, separação por fase, reunião explícita de ações, busca, cópia e limpeza.
- `styles.css`: layout e acessibilidade.
- `data/regras-aps-2026.json`: fonte dos critérios clínicos e documentais.
- `data/regras.js`: versão da base carregada pelo navegador.
- `tests/test_ui.py`: cenários de uso com Playwright/Chromium.

As frases de navegação em `app.js` não substituem os critérios da base. Após uma alteração validada no JSON, execute `python3 tools/gerar-base.py` para atualizar a versão JS.

Execute `python3 tests/test_ui.py` para a verificação do navegador. O teste inicia e encerra seu próprio servidor em loopback e verifica os arquivos reais do aplicativo. Para salvar capturas fora do checkout, crie uma pasta e defina `ZERA_REVIEW_DIR` com esse caminho.

Publicar o ambiente de desenvolvimento não publica as alterações no GitHub Pages. O endereço público precisa de uma publicação própria, mediante autorização.
