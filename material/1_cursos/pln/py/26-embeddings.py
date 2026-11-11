# Embeddings de palabras de dos maneras: SVD de la matriz PPMI (NumPy) y skip-gram con muestreo negativo (gensim Word2Vec).
import json, os, re
import numpy as np
from gensim.models import Word2Vec

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
leer = lambda f, nombre: json.loads(re.search(r"L\.corpus\." + nombre + r" = (\{.*\});", open(os.path.join(RAIZ, "src", "lib", f), encoding="utf-8").read(), re.S).group(1))

# 1) SVD de la matriz PPMI (la misma de los capítulos 23): vectores densos U·S
c = leer("11-cooc.js", "cooc"); F, C = c["filas"], c["cols"]
M = np.zeros((len(F), len(C)))
for i, fila in enumerate(c["m"]):
    for j, n in fila: M[i, j] = n
tot = M.sum()
with np.errstate(divide="ignore", invalid="ignore"):
    pmi = np.log2((M / tot) / ((M.sum(1, keepdims=True) / tot) * (M.sum(0, keepdims=True) / tot)))
P = np.where(np.isfinite(pmi) & (pmi > 0), pmi, 0.0)
U, S, Vt = np.linalg.svd(P, full_matrices=False)
print(f"SVD de la matriz PPMI {P.shape}: primeros valores singulares {np.round(S[:4], 1)}")
for k in (5, 20, 100):
    print(f"   rango {k:3d}: conserva el {(S[:k] ** 2).sum() / (S ** 2).sum():.1%} de la energía (norma de Frobenius al cuadrado)")
W_svd = U[:, :20] * S[:20]
def vecinos_svd(w, n=6):
    i = F.index(w); X = W_svd / np.linalg.norm(W_svd, axis=1, keepdims=True); s = X @ X[i]
    return [(F[j], s[j]) for j in np.argsort(-s)[1:n + 1]]

# 2) Word2Vec skip-gram con muestreo negativo, mismas oraciones del capítulo 25
lm = leer("12-lm.js", "lm"); oraciones = [s.split() for s in lm["train"]]
w2v = Word2Vec(oraciones, vector_size=24, window=2, min_count=3, sg=1, negative=5, epochs=30, seed=1, workers=1)
print(f"\nWord2Vec: vocabulario {len(w2v.wv)}; {len(oraciones)} oraciones; 30 épocas")
for w in ["gobierno", "años", "presidente", "equipo"]:
    a = ", ".join(f"{v} ({s:.2f})" for v, s in vecinos_svd(w, 5))
    b = ", ".join(f"{v} ({s:.2f})" for v, s in w2v.wv.most_similar(w, topn=5))
    print(f"{w:11}SVD → {a}\n{'':11}W2V → {b}")

# 3) ¿Se parecen los vecinos de ambos métodos? (solapamiento entre los 10 primeros, palabras en común de las dos listas)
comunes = [w for w in F if w in w2v.wv.key_to_index]
sol = []
for w in comunes[:100]:
    a = {v for v, _ in vecinos_svd(w, 10) if v in w2v.wv.key_to_index}
    b = {v for v, _ in w2v.wv.most_similar(w, topn=300) if v in F}
    sol.append(len(a & b) / 10)
print(f"\nsolapamiento medio de los 10 vecinos SVD con los 300 más cercanos de Word2Vec (100 palabras): {np.mean(sol):.1%}")
