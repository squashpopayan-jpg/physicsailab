# Gramática libre de contexto probabilista con NLTK: la ambigüedad se resuelve eligiendo el árbol de mayor probabilidad.
import math
import nltk

PCFG = nltk.PCFG.fromstring("""
S -> SN SV [1.0]
SN -> Det N [0.4] | Pron [0.2] | SN SP [0.4]
SV -> V SN [0.55] | SV SP [0.45]
SP -> P SN [1.0]
Det -> 'un' [0.5] | 'mi' [0.5]
N -> 'elefante' [0.5] | 'pijama' [0.5]
Pron -> 'yo' [1.0]
V -> 'vi' [1.0]
P -> 'en' [1.0]
""")
frase = "yo vi un elefante en mi pijama".split()
parser = nltk.ChartParser(nltk.CFG.fromstring("\n".join(str(p).split(" [")[0] for p in PCFG.productions())))
print("análisis posibles y probabilidad de cada árbol (producto de las reglas):")
total = 0
for t in parser.parse(frase):
    p = 1.0
    for pr in t.productions():
        p *= next(q.prob() for q in PCFG.productions(lhs=pr.lhs()) if q.rhs() == pr.rhs())
    total += p
    print(f"  P = {p:.5f}  {t.pformat(margin=200)[:90].replace(chr(10), ' ')}...")
print(f"probabilidad total de la oración (suma de los árboles): {total:.5f}")
mejor = next(nltk.ViterbiParser(PCFG).parse(frase))
print(f"ViterbiParser elige P = {mejor.prob():.5f}:  {' '.join(mejor.pformat(margin=200).split())}")

# estimación por conteo en un treebank: P(A → β) = C(A → β) / C(A)
from collections import Counter
arboles = [nltk.Tree.fromstring(s) for s in [
    "(S (SN (Det un) (N elefante)) (SV (V vi) (SN (Det mi) (N pijama))))",
    "(S (SN (Pron yo)) (SV (V vi) (SN (Det un) (N elefante))))",
    "(S (SN (Pron yo)) (SV (SV (V vi) (SN (Det un) (N elefante))) (SP (P en) (SN (Det mi) (N pijama)))))",
    "(S (SN (Pron yo)) (SV (V vi) (SN (SN (Det un) (N elefante)) (SP (P en) (SN (Det mi) (N pijama))))))"]]
prod = Counter(p for t in arboles for p in t.productions())
lhs = Counter()
for p, c in prod.items(): lhs[p.lhs()] += c
print("\nestimación con 4 árboles:")
for p, c in sorted(prod.items(), key=lambda x: str(x[0]))[:9]:
    print(f"  {str(p):28} {c}/{lhs[p.lhs()]} = {c/lhs[p.lhs()]:.3f}")
print("\nentropía de las expansiones de SN (bits):", round(-sum((c / lhs[nltk.Nonterminal('SN')]) * math.log2(c / lhs[nltk.Nonterminal('SN')]) for p, c in prod.items() if p.lhs() == nltk.Nonterminal('SN')), 3))
