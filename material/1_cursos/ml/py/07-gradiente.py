# Descenso de gradiente a mano: tasa de aprendizaje, escalado y mini-lotes
import numpy as np
from sklearn.linear_model import LinearRegression, SGDRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

rng = np.random.default_rng(7)
n = 500
area = rng.uniform(40, 200, n)                 # m²
habit = rng.integers(1, 6, n).astype(float)    # habitaciones
precio = 50 + 2.0 * area + 15 * habit + rng.normal(0, 20, n)   # millones
X = np.column_stack([area, habit])
y = precio

def gd(X, y, eta, iters=20000, tol=1e-8):
    """Descenso de gradiente por lotes completos sobre el MSE. Devuelve pesos e iteraciones."""
    A = np.column_stack([np.ones(len(X)), X])
    w = np.zeros(A.shape[1])
    for k in range(iters):
        g = 2 / len(y) * A.T @ (A @ w - y)
        w -= eta * g
        if not np.all(np.isfinite(w)):
            return w, k, "diverge"
        if np.linalg.norm(g) < tol * (1 + np.linalg.norm(w)):
            return w, k, "converge"
    return w, iters, "sin converger"

ols = LinearRegression().fit(X, y)
print("solución exacta (MCO):", np.round(np.r_[ols.intercept_, ols.coef_], 3))

print("\nSin escalar (área en m², habitaciones en unidades):")
for eta in [1e-4, 3e-5, 1e-5]:
    w, k, st = gd(X, y, eta)
    print(f"  η = {eta:.0e}: {st:13s} tras {k:5d} iteraciones, w = {np.round(w, 3)}")

Z = StandardScaler().fit_transform(X)
print("\nCon variables estandarizadas:")
for eta in [1.2, 0.5, 0.1]:
    w, k, st = gd(Z, y, eta)
    print(f"  η = {eta}: {st:13s} tras {k:5d} iteraciones")
A = np.column_stack([np.ones(n), Z])
H = 2 / n * A.T @ A                          # hessiano del MSE
ev = np.linalg.eigvalsh(H)
print(f"  autovalores del hessiano: {np.round(ev, 3)} → η máximo estable = 2/λmax = {2 / ev.max():.3f}")

# Mini-lotes a mano: una época = recorrer todos los datos una vez
def minibatch(Z, y, eta, batch, epochs, seed=0):
    r = np.random.default_rng(seed)
    A = np.column_stack([np.ones(len(Z)), Z]); w = np.zeros(A.shape[1]); hist = []
    for ep in range(epochs):
        for idx in np.array_split(r.permutation(len(y)), max(1, len(y) // batch)):
            g = 2 / len(idx) * A[idx].T @ (A[idx] @ w - y[idx])
            w -= eta * g
        hist.append(np.mean((A @ w - y) ** 2))
    return w, hist
print("\nMSE tras cada época (η = 0.01):")
for b in [1, 16, 500]:
    w, h = minibatch(Z, y, 0.01, b, 5)
    print(f"  lote {b:3d}: " + "  ".join(f"{v:9.1f}" for v in h))

sgd = make_pipeline(StandardScaler(), SGDRegressor(max_iter=1000, tol=1e-6, random_state=0)).fit(X, y)
print(f"\nSGDRegressor R² = {sgd.score(X, y):.4f}   LinearRegression R² = {ols.score(X, y):.4f}")
