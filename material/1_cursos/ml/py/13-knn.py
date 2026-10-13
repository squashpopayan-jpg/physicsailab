# k vecinos más cercanos: elegir k, escalar y la maldición de la dimensionalidad
import numpy as np
from sklearn.datasets import load_wine
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

X, y = load_wine(return_X_y=True)          # 178 vinos, 13 medidas químicas, 3 cultivares
print("rango de cada variable (máx − mín):", np.round(X.max(0) - X.min(0), 1))
cv = StratifiedKFold(5, shuffle=True, random_state=0)

sin = cross_val_score(KNeighborsClassifier(5), X, y, cv=cv).mean()
con = cross_val_score(make_pipeline(StandardScaler(), KNeighborsClassifier(5)), X, y, cv=cv).mean()
print(f"\n5-NN sin escalar: {sin:.3f}    con StandardScaler: {con:.3f}")

pipe = make_pipeline(StandardScaler(), KNeighborsClassifier())
grid = GridSearchCV(pipe, {"kneighborsclassifier__n_neighbors": [1, 3, 5, 7, 9, 15, 25, 41, 61],
                           "kneighborsclassifier__weights": ["uniform", "distance"]}, cv=cv).fit(X, y)
print("\nk      uniforme   por distancia")
res = grid.cv_results_
for k in [1, 3, 5, 7, 9, 15, 25, 41, 61]:
    u = res["mean_test_score"][(res["param_kneighborsclassifier__n_neighbors"] == k) & (res["param_kneighborsclassifier__weights"] == "uniform")][0]
    d = res["mean_test_score"][(res["param_kneighborsclassifier__n_neighbors"] == k) & (res["param_kneighborsclassifier__weights"] == "distance")][0]
    print(f"{k:3d}    {u:.3f}      {d:.3f}")
print("mejor combinación:", grid.best_params_, f"→ {grid.best_score_:.3f}")

# Agregar variables de puro ruido degrada a k-NN: todas cuentan igual en la distancia
rng = np.random.default_rng(0)
print("\nvariables de ruido añadidas → exactitud del 5-NN escalado")
for extra in [0, 5, 20, 50, 200]:
    Xn = np.hstack([X, rng.normal(size=(len(X), extra))])
    print(f"  {extra:4d}: {cross_val_score(make_pipeline(StandardScaler(), KNeighborsClassifier(5)), Xn, y, cv=cv).mean():.3f}")

# Concentración de las distancias en dimensión alta
print("\ndimensión   distancia mínima / máxima desde un punto (1 000 puntos uniformes)")
for d in [2, 10, 100, 1000]:
    P = rng.random((1000, d)); q = rng.random(d)
    dist = np.linalg.norm(P - q, axis=1)
    print(f"  {d:5d}     {dist.min() / dist.max():.3f}")
