# Bagging y bosques aleatorios: varianza, OOB e importancias
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import BaggingClassifier, RandomForestClassifier
from sklearn.inspection import permutation_importance

X, y = load_breast_cancer(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, stratify=y, random_state=0)

arbol = DecisionTreeClassifier(random_state=0).fit(Xtr, ytr)
print(f"un árbol completo:          prueba = {arbol.score(Xte, yte):.3f}")
for B in [1, 5, 25, 100, 500]:
    bag = BaggingClassifier(DecisionTreeClassifier(), n_estimators=B, random_state=0).fit(Xtr, ytr)
    rf = RandomForestClassifier(n_estimators=B, random_state=0, n_jobs=-1).fit(Xtr, ytr)
    print(f"B = {B:3d} árboles:  bagging = {bag.score(Xte, yte):.3f}   bosque aleatorio = {rf.score(Xte, yte):.3f}")

rf = RandomForestClassifier(n_estimators=500, oob_score=True, random_state=0, n_jobs=-1).fit(Xtr, ytr)
print(f"\nexactitud fuera de bolsa (OOB) = {rf.oob_score_:.3f}   exactitud de prueba = {rf.score(Xte, yte):.3f}")

print("\nmax_features (variables candidatas por división) → OOB")
for mf in [1, 2, 5, "sqrt", 15, None]:
    m = RandomForestClassifier(n_estimators=300, max_features=mf, oob_score=True, random_state=0, n_jobs=-1).fit(Xtr, ytr)
    print(f"  {str(mf):>5s}: {m.oob_score_:.3f}")

# Importancias: impureza (MDI) frente a permutación. Dos variables útiles con pocos valores
# (binaria y de 3 categorías) y una continua totalmente aleatoria con miles de valores distintos.
rng = np.random.default_rng(0)
n = 2000
sexo = rng.integers(0, 2, n); clase = rng.integers(0, 3, n); azar = rng.random(n)
p = 1 / (1 + np.exp(-(-1 + 1.6 * sexo + 0.8 * clase)))
yy = (rng.random(n) < p).astype(int)
Z = np.column_stack([sexo, clase, azar]); nombres = ["sexo (binaria)", "clase (3 valores)", "azar (continua)"]
Ztr, Zte, ytr2, yte2 = train_test_split(Z, yy, test_size=0.5, random_state=0)
m = RandomForestClassifier(n_estimators=300, random_state=0, n_jobs=-1).fit(Ztr, ytr2)
pi = permutation_importance(m, Zte, yte2, n_repeats=20, random_state=0, n_jobs=-1)
print("\nvariable               MDI (entrenamiento)   permutación (prueba)")
for j, nm in enumerate(nombres):
    print(f"  {nm:20s} {m.feature_importances_[j]:8.3f}           {pi.importances_mean[j]:+.4f} ± {pi.importances_std[j]:.4f}")
print(f"exactitud de entrenamiento = {m.score(Ztr, ytr2):.3f}   prueba = {m.score(Zte, yte2):.3f}")
