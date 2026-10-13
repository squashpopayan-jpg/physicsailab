# Partición simple frente a validación cruzada; grupos; fuga por selección de variables
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.model_selection import (train_test_split, cross_val_score,
                                     StratifiedKFold, KFold, GroupKFold)

X, y = load_breast_cancer(return_X_y=True)        # 569 tumores, 30 variables
modelo = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))

print("1) Partición 70/30 con distintas semillas:")
for s in range(5):
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, stratify=y, random_state=s)
    print(f"   semilla {s}: exactitud = {modelo.fit(Xtr, ytr).score(Xte, yte):.3f}")

cv = StratifiedKFold(10, shuffle=True, random_state=0)
sc = cross_val_score(modelo, X, y, cv=cv)
print(f"\n2) Validación cruzada de 10 pliegues: {sc.mean():.3f} ± {sc.std():.3f}")
print("   pliegues:", np.round(sc, 3))

# 3) Grupos: 100 pacientes con 6 mediciones cada uno. Cada paciente tiene un
#    "perfil" propio, así que el modelo puede reconocerlo si lo vio al entrenar.
rng = np.random.default_rng(3)
pac = np.repeat(np.arange(100), 6)
perfil = rng.normal(size=(100, 5))
etiqueta = rng.integers(0, 2, 100)                       # diagnóstico por paciente
Xg = perfil[pac] + 0.3 * rng.normal(size=(600, 5))
Xg[:, 0] += 0.5 * etiqueta[pac]                          # señal real, débil
yg = etiqueta[pac]
from sklearn.neighbors import KNeighborsClassifier
knn = KNeighborsClassifier(1)
a = cross_val_score(knn, Xg, yg, cv=KFold(5, shuffle=True, random_state=0)).mean()
b = cross_val_score(knn, Xg, yg, cv=GroupKFold(5), groups=pac).mean()
print(f"\n3) 1-NN con pacientes repetidos: KFold = {a:.3f}   GroupKFold = {b:.3f}")

# 4) Fuga: 60 instancias, 5 000 variables aleatorias, etiquetas aleatorias
Xr = rng.normal(size=(60, 5000)); yr = rng.integers(0, 2, 60)
cv5 = StratifiedKFold(5, shuffle=True, random_state=0)
sel = SelectKBest(f_classif, k=20).fit(Xr, yr)             # ¡con TODOS los datos!
con_fuga = cross_val_score(LogisticRegression(), sel.transform(Xr), yr, cv=cv5).mean()
sin_fuga = cross_val_score(make_pipeline(SelectKBest(f_classif, k=20), LogisticRegression()),
                           Xr, yr, cv=cv5).mean()
print(f"\n4) Datos aleatorios: con fuga = {con_fuga:.3f}   sin fuga (Pipeline) = {sin_fuga:.3f}")
