# Métricas de regresión, pérdidas robustas e intervalos de predicción por cuantiles
import numpy as np
from sklearn.linear_model import LinearRegression, HuberRegressor, QuantileRegressor
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import (mean_squared_error, mean_absolute_error, median_absolute_error,
                             mean_absolute_percentage_error, r2_score)

rng = np.random.default_rng(9)

def informe(nombre, y, p):
    rmse = mean_squared_error(y, p) ** 0.5
    print(f"{nombre:28s} RMSE={rmse:7.2f}  MAE={mean_absolute_error(y, p):6.2f}  "
          f"MedAE={median_absolute_error(y, p):6.2f}  MAPE={100 * mean_absolute_percentage_error(y, p):6.1f} %  "
          f"R²={r2_score(y, p):6.3f}")

# 1) Tiempos de entrega (minutos): asimétricos, con unos pocos retrasos enormes
n = 1000
dist = rng.uniform(1, 15, n)                       # km
y = 8 + 3 * dist + rng.gamma(2, 3, n)              # ruido positivo y asimétrico
idx = rng.choice(n, 30, replace=False); y[idx] += rng.uniform(60, 150, 30)   # 3 % de retrasos
X = dist.reshape(-1, 1)
Xtr, Xte, ytr, yte = X[:700], X[700:], y[:700], y[700:]
print("Tiempos de entrega (prueba):")
informe("línea base: media", yte, DummyRegressor().fit(Xtr, ytr).predict(Xte))
informe("línea base: mediana", yte, DummyRegressor(strategy="median").fit(Xtr, ytr).predict(Xte))
informe("MCO (minimiza MSE)", yte, LinearRegression().fit(Xtr, ytr).predict(Xte))
informe("Huber (robusta)", yte, HuberRegressor().fit(Xtr, ytr).predict(Xte))
informe("Cuantil 0.5 (mediana)", yte, QuantileRegressor(quantile=0.5, alpha=0, solver="highs").fit(Xtr, ytr).predict(Xte))

# 2) MAPE explota cuando hay valores verdaderos cercanos a cero
yv = np.array([100, 120, 80, 0.5, 95]); pv = np.array([110, 115, 90, 5, 100])
print(f"\nMAPE con un valor real de 0.5: {100 * mean_absolute_percentage_error(yv, pv):.0f} %   "
      f"(sin él: {100 * mean_absolute_percentage_error(np.delete(yv, 3), np.delete(pv, 3)):.1f} %)")

# 3) Intervalos de predicción del 80 % con regresión cuantílica (ruido heterocedástico)
x = rng.uniform(0, 10, 1500); yh = 2 + 1.5 * x + rng.normal(0, 0.3 + 0.4 * x)
Xh = x.reshape(-1, 1); tr, te = slice(0, 1000), slice(1000, None)
lo = GradientBoostingRegressor(loss="quantile", alpha=0.1, n_estimators=200, max_depth=2, random_state=0).fit(Xh[tr], yh[tr])
hi = GradientBoostingRegressor(loss="quantile", alpha=0.9, n_estimators=200, max_depth=2, random_state=0).fit(Xh[tr], yh[tr])
L, U = lo.predict(Xh[te]), hi.predict(Xh[te])
cob = np.mean((yh[te] >= L) & (yh[te] <= U))
print(f"\nIntervalo del 80 %: cobertura observada = {100 * cob:.1f} %")
for a, b in [(0, 2), (4, 6), (8, 10)]:
    s = (x[te] >= a) & (x[te] < b)
    print(f"  x en [{a}, {b}): ancho medio = {np.mean(U[s] - L[s]):5.2f}   cobertura = {100 * np.mean((yh[te][s] >= L[s]) & (yh[te][s] <= U[s])):5.1f} %")
