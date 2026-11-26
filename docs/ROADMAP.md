# Roadmap do Zera APS

Atualizado em 25/11/2026. Fonte de tarefas: [Issues](https://github.com/joyceradis/Zera-APS/issues). A versão pública é uma ferramenta de referência documental, não prontuário ou indicador individual automatizado.

| Prioridade | Entrega | Critério de saída | Issue |
|---|---|---|---|
| P0 | Ergonomia do modo consulta | 5 cenários sintéticos, tempos e cliques medidos, nenhum bloqueio crítico; desktop e celular | [#6](https://github.com/joyceradis/Zera-APS/issues/6) |
| P0 | Homologação clínica | 25 regras revisadas, fontes vigentes, caminhos locais e exceções documentados | [#7](https://github.com/joyceradis/Zera-APS/issues/7) |
| P1 | Busca e multimorbidade | Sinônimos, códigos, teclado, reset e testes de regressão | [#8](https://github.com/joyceradis/Zera-APS/issues/8) |
| P2 | Piloto autenticado | Recuperação seletiva do backend; revisão de segurança e persistência; testes em ambiente isolado | [#9](https://github.com/joyceradis/Zera-APS/issues/9) |
| P3 | Comercialização | Piloto gradual, proposta de valor comprovada, termos e custos aprovados | [#10](https://github.com/joyceradis/Zera-APS/issues/10) |

O [issue #2](https://github.com/joyceradis/Zera-APS/issues/2) contém o checklist histórico de homologação e piloto; ele continua aberto como épico, não como autorização de implantação. Não abrir novos módulos antes dos gates P0; não introduzir cobrança ou dados clínicos.

## Gestão de branches

- `main`: interface pública, CI e base documental vigente no repositório. Alterações via PR com testes.
- `feat/pilot-ui-v02`: protótipo isolado com Node/SQLite, convites e favoritos. Em 25/11, 86 commits exclusivos e 48 atrás de main (antes deste documento). Não fazer merge integral; recuperar componentes selecionados a partir de main, com testes e revisão de segurança.
- `archive/v0.1-frozen-2026-11-01`: snapshot histórico; não modificar.
- `refactor/consulta-compacta`: PR #5 já incorporado; manter até limpeza deliberada.

Não eliminar branches históricas ou alterar configurações de hospedagem sem avaliar impactos. Não confundir deploy público estático com piloto autenticado em produção.
