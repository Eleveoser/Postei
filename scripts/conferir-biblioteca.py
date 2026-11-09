"""Confere a biblioteca de assuntos antes de gerar o SQL.
Uso:  python scripts/conferir-biblioteca.py
Aponta: ponto igual ao título ou ao gancho (a arte repetiria a frase), quantidade de pontos fora de 2 a 4,
exclamação, preço e promessa, vereditos de mito ou verdade ausentes e mito ou verdade sobre a operação do salão
(agendar, horário, preço, pagamento, atraso): o tema do mito é o procedimento (o que pode e o que não pode,
como o produto age, cuidados antes, durante e depois).
"""
import glob
import json
import re
import sys
import unicodedata
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent / "conhecimento" / "biblioteca"
norm = lambda s: re.sub(r"[^\w ]", "", s.lower()).strip()
sem_acento = lambda s: "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")
# operação do salão: não é tema de mito ou verdade (olha só o tema: ângulo, gancho e título)
OPERACAO = re.compile(
    r"(marcar|marque|agend\w*|antecedencia|horario\w*|vagas?|preco\w*|pagament\w*|parcel\w*|desconto\w*|promoc\w*|"
    r"cancel\w*|atras\w*|pontual\w*|fila|reserva\w*|sinal|lotad\w*|lotar)"
)
problemas = []
for f in sorted(glob.glob(str(raiz / "**" / "*.json"), recursive=True)):
    if "convites" in f or "metas" in f:
        continue
    for x in json.loads(Path(f).read_text(encoding="utf-8")):
        t, g = norm(x["titulo"]), norm(x["gancho"])
        if not 2 <= len(x["pontos"]) <= 4:
            problemas.append((x["id"], "quantidade de pontos"))
        for p in x["pontos"]:
            if norm(p) in (t, g):
                problemas.append((x["id"], f"ponto repete o título ou o gancho: {p}"))
        txt = json.dumps(x, ensure_ascii=False)
        if re.search(r"R\$|garant|\b100%|!", txt, re.I):
            problemas.append((x["id"], "preço, promessa ou exclamação"))
        if x["tipo"] == "mito-ou-verdade" and x.get("veredito") not in ("mito", "verdade", "depende"):
            problemas.append((x["id"], "veredito ausente"))
        if re.search(r"\buma lealdade\b", txt, re.I):
            problemas.append((x["id"], "'uma lealdade': usar 'lealdade familiar'"))
for i, m in problemas:
    print(i, "-", m)
print(f"{len(problemas)} problema(s)")
sys.exit(1 if problemas else 0)
