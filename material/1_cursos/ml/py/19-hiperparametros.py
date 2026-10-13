# Ajuste de hiperparámetros: rejilla, búsqueda aleatoria, halving y validación cruzada anidada
import time
import numpy as np
from scipy.stats import loguniform
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import (GridSearchCV, RandomizedSearchCV, StratifiedKFold,
                                     cross_val_score, train_test_split)
from sklearn.experimental import enable_halving_search_cv  # noqa: F401
from sklearn.model_selection import HalvingRandomSearchCV
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

X, y = load_breast_cancer(return_X_y=True)
pipe = make_pipeline(StandardScaler(), SVC())
cv = StratifiedKFold(5, shuffle=True, random_state=0)

t = time.perf_counter()
grid = GridSearchCV(pipe, {"svc__C": np.logspace(-2, 3, 6), "svc__gamma": np.logspace(-4, 0, 5)}, cv=cv).fit(X, y)
print(f"rejilla 6×5 = 30 combinaciones: mejor {grid.best_score_:.4f} con {dict((k, float(v)) for k, v in grid.best_params_.items())}  ({time.perf_counter() - t:.1f} s)")

t = time.perf_counter()
rnd = RandomizedSearchCV(pipe, {"svc__C": loguniform(1e-2, 1e3), "svc__gamma": loguniform(1e-4, 1)},
                         n_iter=30, cv=cv, random_state=0).fit(X, y)
bp = {k: round(float(v), 5) for k, v in rnd.best_params_.items()}
print(f"aleatoria, 30 sorteos:          mejor {rnd.best_score_:.4f} con {bp}  ({time.perf_counter() - t:.1f} s)")

t = time.perf_counter()
hal = HalvingRandomSearchCV(pipe, {"svc__C": loguniform(1e-2, 1e3), "svc__gamma": loguniform(1e-4, 1)},
                            n_candidates=120, factor=3, cv=cv, random_state=0).fit(X, y)
print(f"halving, 120 candidatos:        mejor {hal.best_score_:.4f}  ({time.perf_counter() - t:.1f} s, "
      f"{len(hal.cv_results_['params'])} evaluaciones en {hal.n_iterations_} rondas)")

# El puntaje del ganador es optimista: validación cruzada anidada
interna = StratifiedKFold(5, shuffle=True, random_state=1)
externa = StratifiedKFold(5, shuffle=True, random_state=2)
busq = RandomizedSearchCV(pipe, {"svc__C": loguniform(1e-2, 1e3), "svc__gamma": loguniform(1e-4, 1)},
                          n_iter=20, cv=interna, random_state=0)
anidada = cross_val_score(busq, X, y, cv=externa)
print(f"\nvalidación cruzada anidada (búsqueda dentro de cada pliegue externo): {anidada.mean():.4f} ± {anidada.std():.4f}")

# Maldición del ganador: con una validación pequeña, el mejor de muchos parece mejor de lo que es
print("\nvalidación de 60 casos, 40 configuraciones al azar, el ganador evaluado después en 200 casos nuevos:")
opt = []
for rep in range(10):
    r = np.random.default_rng(rep)
    idx = r.permutation(len(y)); tr, va, te = idx[:300], idx[300:360], idx[360:560]
    mejor = None
    for _ in range(40):
        C, g = 10 ** r.uniform(-2, 3), 10 ** r.uniform(-4, 0)
        m = make_pipeline(StandardScaler(), SVC(C=C, gamma=g)).fit(X[tr], y[tr])
        v = m.score(X[va], y[va])
        if mejor is None or v > mejor[0]:
            mejor = (v, m)
    opt.append((mejor[0], mejor[1].score(X[te], y[te])))
opt = np.array(opt)
for v, t in opt[:5]:
    print(f"  validación del ganador = {v:.3f}   en datos nuevos = {t:.3f}")
print(f"  promedio en 10 repeticiones: validación {opt[:, 0].mean():.3f} frente a nuevos {opt[:, 1].mean():.3f}")
