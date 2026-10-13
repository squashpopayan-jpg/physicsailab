# Ridge, Lasso y Elastic Net: coeficientes, selección de λ y comparación
import numpy as np
import pandas as pd
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split, KFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.linear_model import LinearRegression, RidgeCV, LassoCV, ElasticNetCV, Ridge, lasso_path

X, y = load_diabetes(return_X_y=True, as_frame=True, scaled=False)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)
cv = KFold(10, shuffle=True, random_state=0)
alphas = np.logspace(-3, 3, 61)

modelos = {
    "MCO": make_pipeline(StandardScaler(), LinearRegression()),
    "Ridge": make_pipeline(StandardScaler(), RidgeCV(alphas=alphas, cv=cv)),
    "Lasso": make_pipeline(StandardScaler(), LassoCV(alphas=alphas, cv=cv, max_iter=50000)),
    "ElasticNet": make_pipeline(StandardScaler(), ElasticNetCV(alphas=alphas, l1_ratio=[0.2, 0.5, 0.8], cv=cv, max_iter=50000)),
}
coefs = {}
for nombre, m in modelos.items():
    m.fit(Xtr, ytr)
    est = m[-1]
    coefs[nombre] = est.coef_
    extra = f"  α = {est.alpha_:.3g}" if hasattr(est, "alpha_") else ""
    if nombre == "ElasticNet":
        extra += f", l1_ratio = {est.l1_ratio_}"
    print(f"{nombre:10s} R² prueba = {m.score(Xte, yte):.3f}{extra}")

pd.set_option("display.float_format", lambda v: f"{v:8.2f}")
print("\nCoeficientes sobre variables estandarizadas (unidades de y por desviación de x):")
print(pd.DataFrame(coefs, index=X.columns))
print("coeficientes exactamente cero en Lasso:", list(X.columns[coefs["Lasso"] == 0]))

# Camino del Lasso: qué variables entran primero al bajar α
Z = StandardScaler().fit_transform(Xtr)
a_path, c_path, _ = lasso_path(Z, ytr - ytr.mean(), alphas=[40, 20, 10, 5, 2, 1, 0.1])
print("\nCamino del Lasso (filas: α; columnas: variables con coeficiente ≠ 0)")
for a, c in zip(a_path, c_path.T):
    print(f"  α = {a:5.1f}: {[n for n, v in zip(X.columns, c) if abs(v) > 1e-10]}")

# Ridge domando un polinomio de grado 15 con 20 datos
rng = np.random.default_rng(0)
x = rng.uniform(-1.6, 1.6, 20); yy = np.sin(2.2 * x) + rng.normal(0, 0.3, 20)
xt = rng.uniform(-1.6, 1.6, 2000); yt = np.sin(2.2 * xt) + rng.normal(0, 0.3, 2000)
print("\nPolinomio de grado 15 con 20 datos (ruido σ² = 0.09):")
for a in [1e-8, 1e-5, 1e-3, 1e-2, 1e-1, 1, 10]:
    p = make_pipeline(PolynomialFeatures(15, include_bias=False), StandardScaler(), Ridge(alpha=a)).fit(x[:, None], yy)
    tr = np.mean((p.predict(x[:, None]) - yy) ** 2); te = np.mean((p.predict(xt[:, None]) - yt) ** 2)
    print(f"  α = {a:8.0e}: MSE entrenamiento = {tr:.3f}   prueba = {te:.3f}   |w| = {np.linalg.norm(p[-1].coef_):8.2f}")
