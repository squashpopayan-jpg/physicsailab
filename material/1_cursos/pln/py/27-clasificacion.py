# Clasificación de opiniones con scikit-learn: Bayes ingenuo y regresión logística, validación cruzada y métricas.
import csv, os
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import KFold, cross_val_score, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.metrics import classification_report, confusion_matrix

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
filas = list(csv.DictReader(open(os.path.join(RAIZ, "data", "opiniones.csv"), encoding="utf-8-sig")))
docs = [f["texto"] for f in filas]; y = np.array([f["etiqueta"] for f in filas]); tema = np.array([f["tema"] for f in filas])
cv = KFold(5)

# 1) Cuatro clasificadores de polaridad con validación cruzada (5 bloques)
modelos = {
    "NB + conteos": make_pipeline(CountVectorizer(), MultinomialNB()),
    "NB + TF-IDF (1-2 gramas)": make_pipeline(TfidfVectorizer(ngram_range=(1, 2)), MultinomialNB(alpha=0.5)),
    "Logística + conteos": make_pipeline(CountVectorizer(), LogisticRegression(max_iter=2000)),
    "Logística + TF-IDF": make_pipeline(TfidfVectorizer(), LogisticRegression(C=10, max_iter=2000)),
}
print(f"{'modelo (polaridad)':28}{'exactitud por bloque':>34}{'media':>8}")
for nombre, m in modelos.items():
    s = cross_val_score(m, docs, y, cv=cv)
    print(f"{nombre:28}{str(np.round(s, 3)):>34}{s.mean():8.3f}")

# 2) Matriz de confusión e informe del peor: Bayes ingenuo con conteos
pred = cross_val_predict(modelos["NB + conteos"], docs, y, cv=cv)
print("\nmatriz de confusión (filas = real, columnas = predicho; negativo, positivo):")
print(confusion_matrix(y, pred, labels=["negativo", "positivo"]))
print(classification_report(y, pred, digits=3))

# 3) Qué ha aprendido: las palabras con más peso
m = make_pipeline(CountVectorizer(), LogisticRegression(max_iter=2000)).fit(docs, y)
voc = m[0].get_feature_names_out(); w = m[1].coef_[0]
print("pesos de la regresión logística (positivo > 0):")
print("   positivo:", ", ".join(f"{voc[i]} ({w[i]:+.2f})" for i in np.argsort(-w)[:6]))
print("   negativo:", ", ".join(f"{voc[i]} ({w[i]:+.2f})" for i in np.argsort(w)[:6]))

# 4) Curva de aprendizaje: entrenar con los primeros n, probar con los últimos 72
print("\nexactitud en los 72 últimos según los ejemplos de entrenamiento:")
for n in (10, 20, 40, 80, 160, 288):
    r = [make_pipeline(CountVectorizer(), clf).fit(docs[:n], y[:n]).score(docs[288:], y[288:]) for clf in (MultinomialNB(), LogisticRegression(max_iter=2000))]
    print(f"   n = {n:3d}: NB {r[0]:.3f}   logística {r[1]:.3f}")

# 5) Clasificar el tema (10 clases)
p = cross_val_score(make_pipeline(CountVectorizer(), MultinomialNB(alpha=0.3)), docs, tema, cv=cv)
print(f"\ntema (10 clases), NB: exactitud media {p.mean():.3f}; azar = 0.100")
