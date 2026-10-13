# Árboles de decisión: reglas legibles, profundidad, poda e inestabilidad
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.tree import DecisionTreeClassifier, export_text

data = load_breast_cancer()
X, y, nombres = data.data, data.target, list(data.feature_names)   # y = 1: benigno
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, stratify=y, random_state=0)

t3 = DecisionTreeClassifier(max_depth=3, random_state=0).fit(Xtr, ytr)
print(export_text(t3, feature_names=nombres, show_weights=True, decimals=2))
imp = sorted(zip(t3.feature_importances_, nombres), reverse=True)[:4]
print("importancias (reducción de Gini):", ", ".join(f"{n} {v:.3f}" for v, n in imp))

print("\nprofundidad   hojas   exactitud entrenamiento / prueba")
for d in [1, 2, 3, 4, 6, 8, None]:
    t = DecisionTreeClassifier(max_depth=d, random_state=0).fit(Xtr, ytr)
    print(f"{str(d):>10s}   {t.get_n_leaves():5d}   {t.score(Xtr, ytr):.3f} / {t.score(Xte, yte):.3f}")

# Poda de costo–complejidad elegida con validación cruzada
path = DecisionTreeClassifier(random_state=0).cost_complexity_pruning_path(Xtr, ytr)
cv = StratifiedKFold(5, shuffle=True, random_state=0)
res = [(a, cross_val_score(DecisionTreeClassifier(ccp_alpha=a, random_state=0), Xtr, ytr, cv=cv).mean())
       for a in path.ccp_alphas[:-1]]
mejor = max(res, key=lambda r: r[1])
print(f"\n{len(path.ccp_alphas)} valores de α en el camino de poda; mejor α = {mejor[0]:.4f} (CV {mejor[1]:.3f})")
tp = DecisionTreeClassifier(ccp_alpha=mejor[0], random_state=0).fit(Xtr, ytr)
print(f"árbol podado: {tp.get_n_leaves()} hojas, profundidad {tp.get_depth()}, prueba {tp.score(Xte, yte):.3f}")

# Inestabilidad: la primera pregunta cambia con pequeñas perturbaciones de los datos
rng = np.random.default_rng(0)
raices = []
for b in range(20):
    idx = rng.choice(len(Xtr), len(Xtr), replace=True)
    t = DecisionTreeClassifier(max_depth=3, random_state=0).fit(Xtr[idx], ytr[idx])
    raices.append(nombres[t.tree_.feature[0]])
print("\nvariable de la raíz en 20 muestras bootstrap:")
for n in sorted(set(raices), key=raices.count, reverse=True):
    print(f"  {n:22s} {raices.count(n):2d} veces")
