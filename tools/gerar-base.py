"""Sincroniza JSON da base clínica e arquivo JS consumido pelo site.
Não consulta internet, não lê nenhum dado de paciente.
"""
from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
source = root / 'data' / 'regras-aps-2026.json'
target = root / 'data' / 'regras.js'
content = json.loads(source.read_text(encoding='utf-8'))
assert isinstance(content.get('cards'), list), 'cards[] ausente'
rule_ids = [r['id'] for c in content['cards'] for r in c.get('rules', [])]
assert len(rule_ids) == len(set(rule_ids)), 'IDs de regras duplicados'
target.write_text('/* Base estática local. Não armazena informações de pacientes. */\nwindow.ZERA_APS_DATA = ' + json.dumps(content, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'Gerado {target.relative_to(root)} com {len(content["cards"])} cards e {len(rule_ids)} regras preliminares.')