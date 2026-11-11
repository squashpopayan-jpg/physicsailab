# Categorías gramaticales y ambigüedad en CESS-ESP (corpus del español anotado con etiquetas EAGLES).
# Requiere: pip install nltk  y  nltk.download("cess_esp")
import re
from collections import Counter, defaultdict
from nltk.corpus import cess_esp


def coarse(t):
    if t[0] == "n": return "PROPN" if t.startswith("np") else "NOUN"
    if t[0] == "v": return "AUX" if t.startswith("va") else "VERB"
    return {"a": "ADJ", "r": "ADV", "d": "DET", "p": "PRON", "s": "ADP", "c": "CONJ", "z": "NUM", "Z": "NUM",
            "F": "PUNCT", "W": "DATE", "i": "INTJ", "I": "INTJ"}.get(t[0], "X")


sents = [[(w.lower(), t) for w, t in s if "." not in t and not re.fullmatch(r"\*.*\*", w)] for s in cess_esp.tagged_sents()]
tokens = [x for s in sents for x in s]
print(f"{len(sents)} oraciones, {len(tokens)} tokens, {len({w for w, _ in tokens})} tipos, {len({t for _, t in tokens})} etiquetas EAGLES")

dist = Counter(coarse(t) for _, t in tokens)
print("\ncategorías (etiquetas gruesas):")
for c, n in dist.most_common(8):
    print(f"  {c:6} {n:6d}  {100*n/len(tokens):4.1f} %")

# ambigüedad: por tipos y por tokens
d = defaultdict(Counter)
for w, t in tokens: d[w][coarse(t)] += 1
amb = {w for w, c in d.items() if len(c) > 1}
print(f"\ntipos ambiguos: {len(amb)} de {len(d)} ({100*len(amb)/len(d):.1f} %)")
print(f"tokens que son de un tipo ambiguo: {100*sum(sum(d[w].values()) for w in amb)/len(tokens):.1f} %")
for w in ["la", "que", "como", "lo", "gobierno", "según", "vino"]:
    print(f"  {w:9}", dict(d[w]))

# la «etiqueta del más frecuente» como techo sencillo de una línea de base
mas_freq = sum(max(c.values()) for c in d.values())
print(f"\nexactitud si se elige la categoría más frecuente de cada palabra (con oráculo): {100*mas_freq/len(tokens):.1f} %")

# decodificar una etiqueta EAGLES de sustantivo: N C M S 0 0 0
def nombre(t):
    tipo = {"c": "común", "p": "propio"}[t[1]]
    gen = {"m": "masculino", "f": "femenino", "c": "común"}.get(t[2], "-")
    num = {"s": "singular", "p": "plural", "n": "invariable"}.get(t[3], "-")
    return f"sustantivo {tipo}, {gen}, {num}"
for t in ["ncms000", "ncfp000", "nccs000"]:
    print(t, "→", nombre(t))
