# Similitud entre palabras: basada en WordNet (camino, Wu-Palmer, Resnik, Lin) y distribucional (PPMI + coseno) sobre CESS-ESP.
import os, sys
import numpy as np
from collections import Counter
from nltk.corpus import wordnet as wn, wordnet_ic

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "tools"))
from mk_cess import corpus_limpio

# 1) Con un tesauro: cuatro medidas sobre pares de sustantivos (primer sentido)
ic = wordnet_ic.ic("ic-brown.dat")
print(f"{'par':18}{'camino':>8}{'Wu-P.':>8}{'Resnik':>8}{'Lin':>8}")
for a, b in [("dog", "cat"), ("dog", "car"), ("car", "bicycle"), ("tree", "flower"), ("doctor", "nurse")]:
    x, y = wn.synsets(a, "n")[0], wn.synsets(b, "n")[0]
    print(f"{a + '-' + b:18}{x.path_similarity(y):8.3f}{x.wup_similarity(y):8.3f}{x.res_similarity(y, ic):8.3f}{x.lin_similarity(y, ic):8.3f}")

# 2) Distribucional: matriz palabra–contexto con ventana ±2, PPMI y coseno
corpus = [[(w.lower(), t) for w, t in s if t[0] not in "FWzZ" and " " not in w] for s in corpus_limpio()]
frec = Counter(w for s in corpus for w, _ in s)
cont = Counter(w for s in corpus for w, t in s if t[0] in "nva" and not t.startswith("va") and len(w) > 2)
filas = [w for w, _ in cont.most_common(400)]; cols = [w for w, _ in frec.most_common(800)]
fi = {w: i for i, w in enumerate(filas)}; ci = {w: i for i, w in enumerate(cols)}
M = np.zeros((len(filas), len(cols)))
for s in corpus:
    ws = [w for w, _ in s]
    for i, w in enumerate(ws):
        if w in fi:
            for j in range(max(0, i - 2), min(len(ws), i + 3)):
                if j != i and ws[j] in ci: M[fi[w], ci[ws[j]]] += 1
tot = M.sum(); pw = M.sum(1, keepdims=True) / tot; pc = M.sum(0, keepdims=True) / tot
with np.errstate(divide="ignore", invalid="ignore"):
    pmi = np.log2((M / tot) / (pw * pc))
ppmi = np.where(np.isfinite(pmi) & (pmi > 0), pmi, 0.0)
U = ppmi / np.maximum(np.linalg.norm(ppmi, axis=1, keepdims=True), 1e-12)
print(f"\nmatriz {M.shape[0]}×{M.shape[1]}; {int((M > 0).sum())} celdas no nulas; {int(tot)} pares de coocurrencia")
for w in ["gobierno", "presidente", "ministro", "partido"]:
    s = U @ U[fi[w]]
    vecinos = [(filas[i], s[i]) for i in np.argsort(-s)[1:6]]
    print(f"{w:11}→ " + ", ".join(f"{v} ({c:.2f})" for v, c in vecinos))
print(f"coseno(gobierno, presidente) = {U[fi['gobierno']] @ U[fi['presidente']]:.3f};  coseno(gobierno, años) = {U[fi['gobierno']] @ U[fi['años']]:.3f}")
