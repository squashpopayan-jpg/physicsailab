# Máquinas de vectores de soporte: C, γ, vectores de soporte y escalado
import time
import numpy as np
from sklearn.datasets import load_breast_cancer, make_moons
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC, LinearSVC

X, y = load_breast_cancer(return_X_y=True)
cv = StratifiedKFold(5, shuffle=True, random_state=0)
print(f"SVC RBF sin escalar: {cross_val_score(SVC(), X, y, cv=cv).mean():.3f}   "
      f"escalado: {cross_val_score(make_pipeline(StandardScaler(), SVC()), X, y, cv=cv).mean():.3f}")

pipe = make_pipeline(StandardScaler(), SVC(kernel="rbf"))
Cs, gs = [0.01, 0.1, 1, 10, 100, 1000], [0.0001, 0.001, 0.01, 0.1, 1]
grid = GridSearchCV(pipe, {"svc__C": Cs, "svc__gamma": gs}, cv=cv).fit(X, y)
tabla = grid.cv_results_["mean_test_score"].reshape(len(Cs), len(gs))
print("\nexactitud de validación cruzada (filas C, columnas γ)")
print("C \\ γ   " + "  ".join(f"{g:7g}" for g in gs))
for C, fila in zip(Cs, tabla):
    print(f"{C:6g}  " + "  ".join(f"{v:7.3f}" for v in fila))
print("mejor:", grid.best_params_, f"{grid.best_score_:.3f}")

# Vectores de soporte y margen en las lunas
Xm, ym = make_moons(300, noise=0.25, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(Xm, ym, test_size=0.5, random_state=0)
print("\nLunas (RBF, γ = 1):  C      vectores de soporte   exactitud entrenamiento / prueba")
for C in [0.01, 0.1, 1, 10, 100, 1e4]:
    m = SVC(C=C, gamma=1).fit(Xtr, ytr)
    print(f"                   {C:7g}   {m.n_support_.sum():5d} de {len(ytr)}           {m.score(Xtr, ytr):.3f} / {m.score(Xte, yte):.3f}")
print("\nLunas (C = 1):     γ      vectores de soporte   exactitud entrenamiento / prueba")
for g in [0.01, 0.1, 1, 10, 100]:
    m = SVC(C=1, gamma=g).fit(Xtr, ytr)
    print(f"                   {g:7g}   {m.n_support_.sum():5d} de {len(ytr)}           {m.score(Xtr, ytr):.3f} / {m.score(Xte, yte):.3f}")

m = SVC(C=1, gamma=1, probability=True, random_state=0).fit(Xtr, ytr)
print("\nfunción de decisión y probabilidad (Platt) de 4 puntos de prueba:")
for f, p in zip(m.decision_function(Xte[:4]), m.predict_proba(Xte[:4])[:, 1]):
    print(f"  f(x) = {f:+6.2f}   P(clase 1) = {p:.3f}")

# Costo computacional: SVC con núcleo frente a LinearSVC
for n in [2000, 8000]:
    Xb = np.random.default_rng(0).normal(size=(n, 20)); yb = (Xb[:, 0] + Xb[:, 1] ** 2 > 1).astype(int)
    t = time.perf_counter(); SVC(kernel="linear").fit(Xb, yb); t1 = time.perf_counter() - t
    t = time.perf_counter(); LinearSVC().fit(Xb, yb); t2 = time.perf_counter() - t
    print(f"n = {n}: SVC(kernel='linear') {t1:5.2f} s   LinearSVC {t2:5.3f} s")
