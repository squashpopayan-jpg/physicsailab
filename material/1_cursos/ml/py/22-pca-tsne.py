# Reducción de dimensionalidad: PCA (varianza, cargas, reconstrucción) y t-SNE
import time
import numpy as np
from sklearn.datasets import load_iris, load_digits
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.manifold import TSNE
from sklearn.neighbors import KNeighborsClassifier

Xi, yi = load_iris(return_X_y=True)
nombres = ["largo sépalo", "ancho sépalo", "largo pétalo", "ancho pétalo"]
for etiqueta, X in [("sin escalar", Xi), ("estandarizado", StandardScaler().fit_transform(Xi))]:
    p = PCA().fit(X)
    print(f"iris {etiqueta}: varianza explicada = {np.round(p.explained_variance_ratio_, 3)}")
p = PCA(2).fit(StandardScaler().fit_transform(Xi))
print("cargas (componentes) del iris estandarizado:")
for j, c in enumerate(p.components_):
    print(f"  CP{j + 1}: " + "  ".join(f"{n} {v:+.2f}" for n, v in zip(nombres, c)))

Xd, yd = load_digits(return_X_y=True)          # 1 797 imágenes de 8×8 = 64 variables
pd_ = PCA().fit(Xd)
acum = np.cumsum(pd_.explained_variance_ratio_)
for q in [0.5, 0.8, 0.9, 0.95, 0.99]:
    print(f"dígitos: componentes para explicar el {int(q * 100)} % de la varianza = {np.searchsorted(acum, q) + 1}")
for k in [2, 5, 10, 20, 40]:
    pk = PCA(k).fit(Xd)
    err = np.mean((Xd - pk.inverse_transform(pk.transform(Xd))) ** 2)
    acc = cross_val_score(make_pipeline(PCA(k), LogisticRegression(max_iter=3000)), Xd, yd, cv=5).mean()
    print(f"  k = {k:2d}: error de reconstrucción = {err:6.2f}   exactitud de una logística sobre los k componentes = {acc:.3f}")
print(f"  todas las 64 variables: exactitud = {cross_val_score(LogisticRegression(max_iter=3000), Xd, yd, cv=5).mean():.3f}")

# t-SNE: excelente para ver, no para medir distancias globales
for perp in [5, 30, 100]:
    t = time.perf_counter()
    Y = TSNE(2, perplexity=perp, init="pca", random_state=0).fit_transform(Xd)
    knn = cross_val_score(KNeighborsClassifier(5), Y, yd, cv=5).mean()
    print(f"t-SNE perplejidad {perp:3d}: 5-NN sobre el mapa 2D = {knn:.3f}  ({time.perf_counter() - t:.1f} s)")
Y2 = PCA(2).fit_transform(Xd)
print(f"PCA 2D:                 5-NN sobre el mapa 2D = {cross_val_score(KNeighborsClassifier(5), Y2, yd, cv=5).mean():.3f}")
