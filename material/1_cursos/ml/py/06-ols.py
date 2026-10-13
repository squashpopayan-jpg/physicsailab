# Regresión lineal: ajuste, inferencia, diagnóstico y multicolinealidad
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.datasets import load_diabetes
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error

d = load_diabetes(as_frame=True, scaled=False)        # unidades originales
X, y = d.data, d.target                              # progresión de la diabetes al año
X = X.assign(sex=(X["sex"] == 2).astype(int))         # 1 = segundo grupo de sexo
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)

m = LinearRegression().fit(Xtr, ytr)
n, p = Xtr.shape

# Errores estándar, estadísticos t y valores p (lo que imprime statsmodels.OLS)
A = np.column_stack([np.ones(n), Xtr])
beta = np.r_[m.intercept_, m.coef_]
res = ytr - A @ beta
s2 = res @ res / (n - p - 1)
se = np.sqrt(np.diag(s2 * np.linalg.inv(A.T @ A)))
t = beta / se
pv = 2 * stats.t.sf(np.abs(t), n - p - 1)
tq = stats.t.ppf(0.975, n - p - 1)
tabla = pd.DataFrame({"coef": beta, "EE": se, "t": t, "p": pv,
                      "IC95 inf": beta - tq * se, "IC95 sup": beta + tq * se},
                     index=["intercepto"] + list(X.columns))
pd.set_option("display.float_format", lambda v: f"{v:9.3f}")
print(tabla, "\n")

r2 = m.score(Xtr, ytr)
print(f"R² entrenamiento = {r2:.3f}   R² ajustado = {1 - (1 - r2) * (n - 1) / (n - p - 1):.3f}")
print(f"R² prueba        = {r2_score(yte, m.predict(Xte)):.3f}")
print(f"RMSE prueba      = {mean_squared_error(yte, m.predict(Xte)) ** 0.5:.1f}   (desviación de y: {y.std():.1f})")

# Diagnóstico de residuos
aj = A @ beta
print(f"\ncorrelación residuo–ajustado: {np.corrcoef(res, aj)[0, 1]:+.3f} (por construcción ≈ 0)")
print(f"correlación |residuo|–ajustado: {np.corrcoef(np.abs(res), aj)[0, 1]:+.3f} (> 0 sugiere heterocedasticidad)")
print(f"prueba de normalidad de Shapiro–Wilk: p = {stats.shapiro(res).pvalue:.3f}")
H = A @ np.linalg.inv(A.T @ A) @ A.T
lev = np.diag(H)
cook = res ** 2 / (p + 1) / s2 * lev / (1 - lev) ** 2
print(f"palanca máxima = {lev.max():.3f} (promedio {(p + 1) / n:.3f});  Cook máxima = {cook.max():.3f}")

# Multicolinealidad: factores de inflación de la varianza
vif = {c: 1 / (1 - LinearRegression().fit(Xtr.drop(columns=c), Xtr[c]).score(Xtr.drop(columns=c), Xtr[c]))
       for c in X.columns}
print("\nVIF:", {k: round(v, 1) for k, v in vif.items()})
