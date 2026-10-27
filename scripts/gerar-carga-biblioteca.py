"""Gera conhecimento/carga-biblioteca.sql a partir de conhecimento/biblioteca.

Uso:  python scripts/gerar-carga-biblioteca.py
A carga faz upsert: pode rodar de novo sempre que a biblioteca crescer.
"""
import json
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent
bib = raiz / "conhecimento" / "biblioteca"
saida = raiz / "conhecimento" / "carga-biblioteca.sql"  # fora do GitHub: a biblioteca é parte do valor do produto


def q(v):
    return "'" + str(v).replace("'", "''") + "'"


def arr_txt(l):
    return "array[" + ",".join(q(x) for x in l) + "]::text[]" if l else "'{}'::text[]"


def arr_int(l):
    return "array[" + ",".join(str(int(x)) for x in l) + "]::int[]" if l else "'{}'::int[]"


linhas = [
    "-- Postei: carga da biblioteca de assuntos e convites (gerado por scripts/gerar-carga-biblioteca.py)",
    "-- Rode no SQL Editor do Supabase depois do 0009_area_privada.sql (precisa da coluna voz). Pode rodar de novo: atualiza o que já existe.",
    "",
]

assuntos = []
for nicho_dir in sorted(p for p in bib.iterdir() if p.is_dir()):
    for arq in sorted(nicho_dir.glob("*.json")):
        for a in json.loads(arq.read_text(encoding="utf-8")):
            assuntos.append((nicho_dir.name, a))

linhas.append("insert into public.biblioteca_assuntos (id, nicho, servico, tipo, angulo, gancho, titulo, pontos, olhar_profissional, exemplo, veredito, intensidade_convite, risco, fonte, formatos, sazonal, status) values")
vals = []
for nicho, a in assuntos:
    vals.append(
        "(" + ", ".join([
            q(a["id"]), q(nicho), q(a["servico"]), q(a["tipo"]), q(a["angulo"]), q(a["gancho"]), q(a["titulo"]),
            q(json.dumps(a["pontos"], ensure_ascii=False)) + "::jsonb", q(a["olhar_profissional"]), q(a["exemplo"]),
            q(a["veredito"]) if a.get("veredito") else "null", str(int(a["intensidade_convite"])), q(a["risco"]),
            q(a.get("fonte", "")), arr_txt(a["formatos"]), arr_int(a.get("sazonal", [])), q(a["status"]),
        ]) + ")"
    )
linhas.append(",\n".join(vals))
linhas.append("""on conflict (id) do update set
  nicho = excluded.nicho, servico = excluded.servico, tipo = excluded.tipo, angulo = excluded.angulo,
  gancho = excluded.gancho, titulo = excluded.titulo, pontos = excluded.pontos,
  olhar_profissional = excluded.olhar_profissional, exemplo = excluded.exemplo, veredito = excluded.veredito,
  intensidade_convite = excluded.intensidade_convite, risco = excluded.risco, fonte = excluded.fonte,
  formatos = excluded.formatos, sazonal = excluded.sazonal, status = excluded.status, atualizado_em = now();
""")

convites = json.loads((bib / "convites.json").read_text(encoding="utf-8"))["convites"]
for c in convites:
    c.setdefault("voz", "negocio")
pessoa = bib / "convites-pessoa.json"
if pessoa.exists():
    convites += json.loads(pessoa.read_text(encoding="utf-8"))["convites"]
linhas.append("insert into public.biblioteca_convites (id, tom, intensidade, voz, texto) values")
linhas.append(",\n".join(f"({q(c['id'])}, {q(c['tom'])}, {int(c['intensidade'])}, {q(c['voz'])}, {q(c['texto'])})" for c in convites))
linhas.append("on conflict (id) do update set tom = excluded.tom, intensidade = excluded.intensidade, voz = excluded.voz, texto = excluded.texto;")
linhas.append("")

saida.write_text("\n".join(linhas), encoding="utf-8")
print(f"{len(assuntos)} assuntos e {len(convites)} convites -> {saida}")
