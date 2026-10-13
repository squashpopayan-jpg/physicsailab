# Interpretar modelos: importancia por permutación, dependencia parcial y valores SHAP
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.inspection import permutation_importance, partial_dependence
from sklearn.model_selection import train_test_split

# Datos sintéticos con efectos conocidos: así se puede comprobar si la explicación es correcta
rng = np.random.default_rng(0)
n = 4000
df = pd.DataFrame({
    "edad": rng.uniform(20, 70, n),
    "ingreso": rng.lognormal(8, 0.5, n),
    "antiguedad": rng.uniform(0, 20, n),
    "zona": rng.integers(0, 3, n),
    "ruido": rng.normal(size=n),
})
df["ingreso_copia"] = df["ingreso"] * (1 + 0.02 * rng.normal(size=n))      # casi idéntica a ingreso
y = (0.05 * (df.edad - 45) ** 2                     # efecto en U de la edad
     + 3 * np.log(df.ingreso)                       # efecto creciente del ingreso
     + 4 * (df.zona == 2) * (df.antiguedad > 10)    # interacción zona × antigüedad
     + rng.normal(0, 1, n))
Xtr, Xte, ytr, yte = train_test_split(df, y, test_size=0.3, random_state=0)
m = HistGradientBoostingRegressor(max_iter=400, learning_rate=0.05, random_state=0).fit(Xtr, ytr)
print(f"R² de prueba = {m.score(Xte, yte):.3f}")

pi = permutation_importance(m, Xte, yte, n_repeats=10, random_state=0, n_jobs=-1)
print("\nimportancia por permutación (caída de R² en prueba):")
for j in np.argsort(pi.importances_mean)[::-1]:
    print(f"  {df.columns[j]:14s} {pi.importances_mean[j]:6.3f} ± {pi.importances_std[j]:.3f}")
sin_copia = HistGradientBoostingRegressor(max_iter=400, learning_rate=0.05, random_state=0).fit(Xtr.drop(columns="ingreso_copia"), ytr)
pi2 = permutation_importance(sin_copia, Xte.drop(columns="ingreso_copia"), yte, n_repeats=10, random_state=0, n_jobs=-1)
print(f"  sin la copia, la importancia de ingreso es {pi2.importances_mean[list(Xte.columns).index('ingreso')]:.3f}")

pd_edad = partial_dependence(m, Xte, ["edad"], grid_resolution=6, method="brute")   # "brute": promedios reales
print("\ndependencia parcial de la edad:", {int(g): round(float(v), 2) for g, v in zip(pd_edad["grid_values"][0], pd_edad["average"][0])})

ex = shap.TreeExplainer(m)
sv = ex.shap_values(Xte.iloc[:500])
print("\nmedia de |SHAP| (importancia global):")
for j in np.argsort(np.abs(sv).mean(0))[::-1]:
    print(f"  {df.columns[j]:14s} {np.abs(sv[:, j]).mean():.3f}")
i = 0
print(f"\ncaso {i}: predicción = {m.predict(Xte.iloc[[i]])[0]:.2f}, valor base E[f] = {float(np.ravel(ex.expected_value)[0]):.2f}")
for c, v, s in zip(df.columns, Xte.iloc[i], sv[i]):
    print(f"  {c:14s} = {v:9.2f}   SHAP = {s:+.2f}")
print(f"  suma de SHAP + base = {sv[i].sum() + float(np.ravel(ex.expected_value)[0]):.2f}")
