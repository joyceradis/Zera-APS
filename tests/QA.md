# ZERA-APS — Matriz de qualidade (v0.2, branch de desenvolvimento)

**Estado em 01/11/2026:** desenvolvimento em PR rascunho. A versão antiga v0.1 permanece congelada. **Não confundir revisão estática com validação funcional no navegador.**

## Evidências disponíveis

| Verificação | Estado | Observação |
|---|---|---|
| Sintaxe da aplicação em JavaScript | PASS | Verificada com runtime V8 |
| IDs referenciados pela aplicação | PASS | Todos encontrados no HTML |
| Base JSON e módulos iniciais | PASS | 5 linhas; 21 orientações preliminares |
| Inicialização em DOM simulado | PASS | Sem erro de runtime no cenário isolado |
| Seleção de HAS/DM/Saúde mental | PASS (simulado) | 4/6/0 itens, respectivamente |
| Detalhes das regras, controle de leitura e busca I10 | PASS (simulado) | Não garante resultado em navegador real |
| Smoke test Node independente de dependências | CRIADO; EXECUÇÃO LOCAL PENDENTE | `node tests/test_static.mjs` |
| Interface real desktop/390px | PENDENTE | Rodar `python3 tests/test_ui.py` |
| Capturas de tela e inspeção visual | PENDENTE | Geradas pelo teste após execução |
| Navegação por teclado, leitor de tela e zoom 200% | PARCIAL / PENDENTE | Testes adicionais necessários |
| Cópia de códigos no navegador do posto | PENDENTE | Conferir política de clipboard |
| Autenticação e 50 sessões simultâneas | NÃO IMPLEMENTADO | Exige backend e teste de carga |
| Revisão normativa de cada regra | PENDENTE | Não usar para validar financiamento |
| Deploy, domínio e contas reais | NÃO REALIZADO | Sem gasto ou publicação nesta entrega |

## Rotina de testes para Estevão

~~~sh
node --check app.js
node tests/test_static.mjs
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/test_ui.py
~~~

No macOS, utilizar o navegador gerenciado pelo Playwright. O teste Chromium deve gerar `tests/preview-desktop.png` e `tests/preview-mobile.png`. Examinar manualmente ambos, inclusive tipografia, contrastes, espaços e cards nos computadores do posto.

## Riscos e limites clínicos

- As regras e códigos constituem extração **parcial**, pendente de revisão por profissional responsável e conferência das fontes oficiais vigentes.
- Nenhuma marcação ou contador representa indicador cumprido ou faturamento elegível.
- O sistema não captura registros do PEC, não faz cálculo oficial, não demonstra integração nem alega transmissão ao SISAB.
- Saúde mental permanece intencionalmente sem regras até mapeamento clínico específico.
- Não inserir pacientes, nomes, documentos, prontuários, fotografias, informações de saúde identificáveis, senhas ou segredos em repositório público.
- Cadastro de 50 médicos, segregação de sessões e segurança de servidor são condições prévias para piloto real e **não estão presentes** na v0.2.

## Critério de aprovação de merge

Não publicar nem mesclar este PR até que testes reais em Chromium, revisão visual responsiva e aceite técnico sejam documentados. O piloto com médicos externos requer também identidade, privacidade, segurança e homologação clínica antes de qualquer uso assistencial.
