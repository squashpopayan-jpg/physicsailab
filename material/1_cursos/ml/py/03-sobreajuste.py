# Curvas de validación y de aprendizaje para diagnosticar sesgo y varianza
import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import validation_curve, learning_curve, KFold

rng = np.random.default_rng(1)
n = 120
x = rng.uniform(-1.6, 1.6, n)
y = np.sin(2.2 * x) + rng.normal(scale=0.3, size=n)      # ruido irreducible 0.09
X = x.reshape(-1, 1)

def modelo(grado):
    return make_pipeline(PolynomialFeatures(grado, include_bias=False),
                         StandardScaler(), LinearRegression())

cv = KFold(5, shuffle=True, random_state=0)
grados = [1, 2, 3, 5, 7, 10, 13, 15]
tr, va = validation_curve(modelo(1), X, y, param_name="polynomialfeatures__degree",
                          param_range=grados, cv=cv, scoring="neg_mean_squared_error")
print("grado   MSE entrenamiento   MSE validación (media ± de)")
for g, a, b in zip(grados, -tr.mean(1), -va):
    print(f"{g:5d}   {a:17.3f}   {b.mean():10.3f} ± {b.std():.3f}")
mejor = grados[int(np.argmin(-va.mean(1)))]
print("grado con menor error de validación:", mejor)

for g in (1, 15):
    sizes, tr, va = learning_curve(modelo(g), X, y, cv=cv, scoring="neg_mean_squared_error",
                                   train_sizes=[20, 40, 60, 96], shuffle=True, random_state=0)
    print(f"\nCurva de aprendizaje, grado {g}")
    for s, a, b in zip(sizes, -tr.mean(1), -va.mean(1)):
        print(f"  n = {s:3d}   entrenamiento = {a:7.3f}   validación = {b:9.3f}")
