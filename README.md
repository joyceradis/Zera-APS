# Zera APS

Ferramenta independente de consulta rápida aos critérios e campos do e-SUS APS PEC. **Versão 0.9.1** (referência documental pública; não homologada como sistema assistencial).

[Abrir site](https://joyceradis.github.io/Zera-APS/) · [Modo consulta](https://joyceradis.github.io/Zera-APS/consulta.html) · [Roadmap](docs/ROADMAP.md) · [Issues](https://github.com/joyceradis/Zera-APS/issues) · [CI](https://github.com/joyceradis/Zera-APS/actions)

## Escopo
C3/C4/C5/C7, 25 regras, seleção de condições, busca global, tabela compacta, detalhes com fontes e conferência manual efêmera por critério. Sem C1/C2/C6, autenticação, cobrança, prontuário, integração PEC, acesso ao histórico ou cálculo de pontuação. A seleção não estabelece elegibilidade. Não inserir instruções administrativas em prontuário. O tema é a única preferência persistida no navegador.

## Estrutura
| Arquivo | Função |
|---|---|
| index.html / landing.css | Página comercial |
| consulta.html / consulta.css / app.js | Ambiente de consulta |
| theme.css / theme.js | Temas compartilhados |
| novidades-5-6.html | Referência complementar |
| data/regras-aps-2026.json | Fonte canônica de regras |
| data/regras.js | Base gerada para navegador |
| tests/ | Validação automatizada |
| docs/ | Roadmap, revisão documental, especificação e referências |
| AGENTS.md | Regras para colaboradores e agentes |

Os CSS anteriores permanecem por compatibilidade histórica até verificação de dependências. A branch do piloto autenticado não integra a versão pública.

## Desenvolvimento local
```sh
python -m http.server 8000
# Em outro terminal:
python tests/test_integrity.py
node --check app.js
pip install playwright==1.56.0
python -m playwright install chromium
python tests/test_ui.py
```

Atualizar a base gerada apenas a partir do JSON com `python tools/gerar-base.py`. Usar dados sintéticos. A base normativa requer revisão vigente e validação local antes de adoção assistencial. Ver [QA](tests/QA.md), [referências](docs/REFERENCIAS-E-QUALIDADE.md) e [changelog](CHANGELOG.md). 
