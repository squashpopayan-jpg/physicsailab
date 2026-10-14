# ¿Por qué el efecto del ejercicio sobre la cognición se encoge al corregir sesgos? Simulación de muchas literaturas
import numpy as np

rng = np.random.default_rng(22)
D_REAL = 0.05        # efecto verdadero del ejercicio sobre la cognición (d)
EXPECT = 0.15        # efecto de expectativa cuando el control no hace nada (lista de espera)
P_PASIVO = 0.5       # fracción de ensayos con control pasivo
P_PUB_NULO = 0.3     # probabilidad de publicar un resultado no significativo

def literatura(k=80):
    n = np.round(10 + 140 * rng.random(k) ** 2.2)               # muchos ensayos pequeños, pocos grandes
    pasivo = rng.random(k) < P_PASIVO
    v = 2 / n + D_REAL ** 2 / (4 * n)                            # varianza de d con n por brazo
    y = D_REAL + EXPECT * pasivo + np.sqrt(v) * rng.standard_normal(k)
    sig = y / np.sqrt(v) > 1.96
    pub = sig | (rng.random(k) < P_PUB_NULO)
    return y[pub], v[pub], pasivo[pub]

def combinado(y, v):                                             # efectos aleatorios de DerSimonian-Laird
    w = 1 / v
    mu_f = np.sum(w * y) / np.sum(w)
    Q = np.sum(w * (y - mu_f) ** 2)
    tau2 = max(0.0, (Q - (len(y) - 1)) / (np.sum(w) - np.sum(w ** 2) / np.sum(w)))
    ws = 1 / (v + tau2)
    return np.sum(ws * y) / np.sum(ws)

def pet(y, v):                                                   # PET: intercepto de y frente a su error estándar
    se = np.sqrt(v)
    X = np.column_stack([np.ones_like(se), se])
    W = np.diag(1 / v)
    beta = np.linalg.solve(X.T @ W @ X, X.T @ W @ y)
    return beta[0]

res = []
for _ in range(2000):
    y, v, pas = literatura()
    act = ~pas
    res.append((combinado(y, v), combinado(y[act], v[act]), pet(y[act], v[act]), len(y)))
res = np.array(res)
print(f"Efecto verdadero: d = {D_REAL}; expectativa con control pasivo: +{EXPECT}; se publica el {100 * P_PUB_NULO:.0f} % de los nulos")
print(f"Estudios publicados por literatura (media): {res[:, 3].mean():.0f} de 80\n")
print("Estimación (media de 2000 literaturas simuladas)          d")
print(f"  todos los ensayos publicados                         {res[:, 0].mean():6.3f}")
print(f"  solo ensayos con control activo                      {res[:, 1].mean():6.3f}")
print(f"  control activo y corrección por sesgo (PET)          {res[:, 2].mean():6.3f}   (DE entre literaturas {res[:, 2].std():.3f})")
print("\nCon parámetros elegidos para ilustrar (no estimados de datos reales) aparece un patrón parecido al de")
print("Ciria y otros (2023): 0,22 → 0,13 → 0,05. La corrección PET es imprecisa en una sola literatura.")
