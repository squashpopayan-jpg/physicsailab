# Regresión logística: probabilidades, odds ratios, regularización y softmax
import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer, load_iris
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss, accuracy_score

data = load_breast_cancer(as_frame=True)
X, y = data.data, 1 - data.target           # 1 = maligno (en el original 1 = benigno)
cols = ["mean radius", "mean texture", "mean concave points", "worst area", "worst smoothness"]
X = X[cols]
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, stratify=y, random_state=1)

m = make_pipeline(StandardScaler(), LogisticRegression(C=1.0)).fit(Xtr, ytr)
lr = m[-1]
tabla = pd.DataFrame({"coef (por 1 desv.)": lr.coef_[0], "odds ratio": np.exp(lr.coef_[0])}, index=cols)
pd.set_option("display.float_format", lambda v: f"{v:9.3f}")
print(tabla)
print(f"intercepto = {lr.intercept_[0]:.3f}  →  P(maligno) de un tumor promedio = {1 / (1 + np.exp(-lr.intercept_[0])):.3f}")

p = m.predict_proba(Xte)[:, 1]
print(f"\nprueba: exactitud = {accuracy_score(yte, p >= 0.5):.3f}   log-loss = {log_loss(yte, p):.3f}")
print("cinco pacientes de prueba:")
for i in range(5):
    z = lr.decision_function(m[0].transform(Xte.iloc[[i]]))[0]
    print(f"  logit = {z:+6.2f}   P(maligno) = {p[i]:.3f}   real = {int(yte.iloc[i])}")

print("\nEfecto de C (C pequeño = más regularización):")
for C in [0.001, 0.01, 0.1, 1, 10, 1000]:
    mm = make_pipeline(StandardScaler(), LogisticRegression(C=C, max_iter=5000)).fit(Xtr, ytr)
    pp = mm.predict_proba(Xte)[:, 1]
    print(f"  C = {C:7g}: ‖w‖ = {np.linalg.norm(mm[-1].coef_):6.2f}   log-loss prueba = {log_loss(yte, pp):.3f}   exactitud = {accuracy_score(yte, pp >= 0.5):.3f}")

# Separación perfecta: sin regularización los coeficientes crecen sin límite
xs = np.array([[-2], [-1.5], [-1], [-0.5], [0.5], [1], [1.5], [2]]); ys = np.array([0, 0, 0, 0, 1, 1, 1, 1])
print("\nDatos perfectamente separables:")
for C in [1, 100, 1e4, 1e6]:
    w = LogisticRegression(C=C, max_iter=100000, tol=1e-10).fit(xs, ys).coef_[0, 0]
    print(f"  C = {C:8g}: pendiente = {w:8.2f}")

# Softmax (multinomial) en iris
Xi, yi = load_iris(return_X_y=True)
sm = make_pipeline(StandardScaler(), LogisticRegression(C=1.0)).fit(Xi, yi)
print("\nSoftmax en iris, probabilidades de tres flores (setosa, versicolor, virginica):")
print(np.round(sm.predict_proba(Xi[[0, 70, 140]]), 3))
print("las filas suman:", sm.predict_proba(Xi[[0, 70, 140]]).sum(1))
