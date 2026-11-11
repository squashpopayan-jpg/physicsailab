# Distancia de edición con programación dinámica y un corrector ortográfico de canal ruidoso.
# Requiere: pip install nltk  y  nltk.download("cess_esp")  (corpus del español con 150.000 palabras).
import math, re
from collections import Counter
from nltk import edit_distance
from nltk.corpus import cess_esp


def levenshtein(a, b, sub=1):
    D = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1): D[i][0] = i
    for j in range(1, len(b) + 1): D[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            D[i][j] = min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (0 if a[i - 1] == b[j - 1] else sub))
    return D


for a, b in [("intención", "ejecución"), ("casa", "caza"), ("gato", "gata"), ("perro", "pero")]:
    d1, d2 = levenshtein(a, b)[-1][-1], levenshtein(a, b, sub=2)[-1][-1]
    print(f"{a:10}→ {b:10} costos 1/1/1: {d1}  sustitución=2: {d2}  nltk: {edit_distance(a, b)}")

# --- corrector de canal ruidoso: elegir w que maximiza P(w)·P(x|w), con P(x|w) ≈ λ^d ---
cuenta = Counter(w.lower() for w in cess_esp.words() if re.fullmatch(r"[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+", w))
total = sum(cuenta.values())
ALF = "abcdefghijklmnñopqrstuvwxyzáéíóúü"


def edits1(w):
    s = set()
    for i in range(len(w) + 1):
        l, r = w[:i], w[i:]
        if r: s.add(l + r[1:])                                   # borrado
        if len(r) > 1: s.add(l + r[1] + r[0] + r[2:])            # transposición
        if r: s.update(l + c + r[1:] for c in ALF)               # sustitución
        s.update(l + c + r for c in ALF)                         # inserción
    return s


def corregir(x, lam=0.01):
    cand = {x: 0} if x in cuenta else {}
    e1 = edits1(x)
    cand.update({c: 1 for c in e1 if c in cuenta and c != x})      # la sustitución por la misma letra devuelve x: se excluye
    if not any(d <= 1 for d in cand.values()):
        cand.update({c: 2 for e in e1 for c in edits1(e) if c in cuenta and c != x and c not in e1})
    return sorted(((math.log(cuenta[c] / total) + d * math.log(lam), c, d) for c, d in cand.items()), reverse=True)


print(f"\nmodelo de lengua: {total} tokens, {len(cuenta)} tipos")
for x in ["pais", "ladrilo", "cassa", "nesesario", "ejemlpo", "rapidamenet", "abla"]:
    top = corregir(x)[:3]
    print(f"{x:12}→ " + ", ".join(f"{c} (d={d}, n={cuenta[c]})" for _, c, d in top))
print("\nefecto de λ (probabilidad de error por edición) en palabras que ya son correctas:")
for x in ["deben", "menor", "firma"]:
    print(f"  «{x}»:", {lam: corregir(x, lam)[0][1] for lam in (0.5, 0.01, 1e-6)})
