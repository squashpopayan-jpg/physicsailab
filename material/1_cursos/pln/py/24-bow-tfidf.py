# Bolsa de palabras, n-gramas y TF-IDF con scikit-learn sobre las 360 opiniones del laboratorio.
import csv, os
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
filas = list(csv.DictReader(open(os.path.join(RAIZ, "data", "opiniones.csv"), encoding="utf-8-sig")))
docs = [f["texto"] for f in filas]; y = np.array([f["etiqueta"] for f in filas])
print(f"{len(docs)} opiniones; clases: {dict(zip(*np.unique(y, return_counts=True)))}")

# 1) La matriz documento–término y su dispersión
for nombre, kw in [("unigramas", {}), ("uni + bigramas", {"ngram_range": (1, 2)}), ("uni + bi + trigramas", {"ngram_range": (1, 3)})]:
    X = CountVectorizer(**kw).fit_transform(docs)
    print(f"{nombre:22} {X.shape[1]:6d} rasgos; {X.nnz:6d} celdas no nulas de {X.shape[0] * X.shape[1]} ({X.nnz / (X.shape[0] * X.shape[1]):.2%})")

# 2) TF-IDF: los términos más característicos de cada clase
tv = TfidfVectorizer(); T = tv.fit_transform(docs); voc = tv.get_feature_names_out()
for c in np.unique(y):
    media = np.asarray(T[y == c].mean(axis=0)).ravel()
    print(f"{c:9}→", ", ".join(f"{voc[i]} ({media[i]:.3f})" for i in np.argsort(-media)[:6]))
vacias = "a al algo como con de del el en es esta este la las lo los me mi muy no para pero por que se si su un una y ya fue sobre".split()
tv2 = TfidfVectorizer(stop_words=vacias); T2 = tv2.fit_transform(docs); voc2 = tv2.get_feature_names_out()
print("sin palabras vacías:")
for c in np.unique(y):
    media = np.asarray(T2[y == c].mean(axis=0)).ravel()
    print(f"{c:9}→", ", ".join(f"{voc2[i]} ({media[i]:.3f})" for i in np.argsort(-media)[:6]))
idf = dict(zip(voc, tv.idf_))
print("idf mínimo y máximo:", f"{min(idf.values()):.3f} ({min(idf, key=idf.get)}), {max(idf.values()):.3f} ({max(idf, key=idf.get)})")

# 3) Búsqueda: documentos más cercanos a una consulta (coseno entre vectores TF-IDF)
for consulta in ["la guía es confusa y difícil", "excelente taller de tokenización"]:
    s = cosine_similarity(tv.transform([consulta]), T).ravel()
    print(f"«{consulta}»")
    for i in np.argsort(-s, kind="stable")[:3]:
        print(f"   {s[i]:.3f}  {docs[i]}")
