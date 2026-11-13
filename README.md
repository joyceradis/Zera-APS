# Zera-APS — rascunho SOAP e roteiro de conferência no PEC

Aplicativo interativo para organizar a conferência documental de registros de APS. Versão 0.3.0: critérios de C3, C4, C5 e C7 e caminhos confrontados com fontes oficiais. A apuração oficial não é calculada.

## Como usar

1. Selecione as situações já reconhecidas no atendimento. A seleção apenas organiza o roteiro; não confirma diagnóstico, elegibilidade, histórico ou indicação clínica.
2. Se selecionar gestação/puerpério, escolha a fase.
3. Clique em **Montar meu roteiro** e confira os critérios e caminhos.
4. Use **Copiar Evolução e Checklist** para copiar um rascunho SOAP em branco e os lembretes de conferência dos itens selecionados.
5. Complete os campos SOAP com fatos reais. Confira os dados diretamente no PEC e com a equipe responsável. Antes de salvar, remova placeholders e lembretes operacionais que não façam parte do registro clínico.
6. Use **Novo atendimento** para apagar escolhas, busca e marcações.

Não informe identificadores de pacientes. As escolhas existem apenas na memória da página: recarregar também as apaga. O aplicativo não cria sintomas, achados físicos, medidas, diagnósticos, exames, prescrições, orientações ou retornos automaticamente. Lembretes copiados não comprovam que uma ação ocorreu.

## Limites clínicos, regulatórios e de apuração

- O aplicativo não acessa ou altera o PEC, o histórico ou o sistema oficial de indicadores.
- A base não foi validada na instalação local do PEC nem na unidade de Vitor Hugo, em Marechal Floriano.
- Os códigos e critérios são referências documentais; devem ser conferidos na fonte vigente e aplicados apenas se corresponderem ao atendimento e à indicação clínica.
- O checklist não é um protocolo clínico nem um comprovante de execução, e a cópia não é “à prova de auditoria”.
- Uma ausência no histórico não indica automaticamente que um procedimento deva ser repetido.
- C1, C2, C6, saúde mental e outros percursos ainda não estão incluídos.
- Os critérios metodológicos foram revisados em 02/11/2026; os caminhos/campos foram confrontados documentalmente com o Manual PEC 5.6 em 12/11/2026. Isso não valida a configuração da unidade nem substitui validação local.
- O Siaps é a referência oficial para monitoramento de indicadores agregados; listas de cidadãos no PEC e relatórios nominativos do Siaps permanecem sujeitos aos perfis de acesso e às regras de proteção de dados.

## Desenvolvimento

A lógica e a base são executadas localmente; não há servidor de aplicação, bibliotecas externas, rastreadores ou persistência. Os caminhos do PEC foram revisados documentalmente, mas precisam de validação por responsáveis municipais na versão local autorizada.

Arquivos principais:

- `index.html`: seleção de situações, roteiro e ação de cópia.
- `app.js`: seleção, separação por fase, organização e montagem do texto para a área de transferência.
- `styles.css`: layout e acessibilidade.
- `data/regras-aps-2026.json`: fonte dos critérios e caminhos.
- `data/regras.js`: base estática consumida pelo navegador.
- `docs/REVISAO-FONTES-2026-11-02.md`: revisão dos critérios.
- `tools/gerar-base.py`: sincroniza o JSON para o arquivo JS.

Após uma alteração validada no JSON, execute `python3 tools/gerar-base.py` para atualizar a versão JS.

A publicação do site não está incluída nesta alteração.
