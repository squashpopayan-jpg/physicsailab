# Errores frecuentes y producción: paradoja de Simpson, deriva de datos (PSI y KS) y equidad entre grupos
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score

rng = np.random.default_rng(0)

# 1) Paradoja de Simpson: el efecto agregado se invierte dentro de cada grupo
df = pd.DataFrame({
    "hospital": ["A"] * 1000 + ["B"] * 1000,
    "tratamiento": ["nuevo"] * 800 + ["viejo"] * 200 + ["nuevo"] * 200 + ["viejo"] * 800,
})
grave = (df.hospital == "A")                                      # el hospital A recibe los casos graves
p = np.where(grave, 0.55, 0.85) + np.where(df.tratamiento == "nuevo", 0.05, 0.0)
df["sobrevive"] = rng.random(len(df)) < p
print("supervivencia por tratamiento (todo junto):")
print(df.groupby("tratamiento").sobrevive.mean().round(3).to_string())
print("supervivencia por hospital y tratamiento:")
print(df.groupby(["hospital", "tratamiento"]).sobrevive.mean().unstack().round(3).to_string())

# 2) Deriva de datos: un modelo entrenado en 2024 se usa en 2025
def gen(n, media_ingreso, prop_joven):
    ingreso = rng.normal(media_ingreso, 1.0, n)
    joven = rng.random(n) < prop_joven
    logit = -0.5 + 1.2 * ingreso - 1.0 * joven
    return np.column_stack([ingreso, joven]), (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)

X24, y24 = gen(5000, 0.0, 0.3)
m = LogisticRegression().fit(X24, y24)
def psi(a, b, bins=10):
    """Índice de estabilidad poblacional entre la referencia a y los datos nuevos b."""
    cortes = np.quantile(a, np.linspace(0, 1, bins + 1)); cortes[0], cortes[-1] = -np.inf, np.inf
    pa = np.histogram(a, cortes)[0] / len(a); pb = np.histogram(b, cortes)[0] / len(b)
    pa, pb = np.clip(pa, 1e-6, None), np.clip(pb, 1e-6, None)
    return np.sum((pb - pa) * np.log(pb / pa))
print("\nmes   media del ingreso   PSI del ingreso   KS p-valor   AUC del modelo   tasa real de positivos   tasa predicha")
for mes, (mu, pj) in enumerate([(0.0, 0.3), (0.2, 0.32), (0.5, 0.4), (1.0, 0.55), (1.5, 0.7)], start=1):
    Xn, yn = gen(3000, mu, pj)
    pr = m.predict_proba(Xn)[:, 1]
    print(f"{mes:3d}   {Xn[:, 0].mean():17.2f}   {psi(X24[:, 0], Xn[:, 0]):15.3f}   {stats.ks_2samp(X24[:, 0], Xn[:, 0]).pvalue:10.1e}   "
          f"{roc_auc_score(yn, pr):14.3f}   {yn.mean():22.3f}   {pr.mean():13.3f}")

# Deriva de concepto: las entradas no cambian, pero sí su relación con la respuesta
print("\nderiva de concepto (misma distribución de entradas, nueva relación con y):")
for nombre, (b1, b2) in [("como en 2024", (1.2, -1.0)), ("efecto del ingreso a la mitad", (0.6, -1.0)), ("efecto de joven invertido", (1.2, 1.0))]:
    ingreso = rng.normal(0, 1, 3000); joven = rng.random(3000) < 0.3
    yc = (rng.random(3000) < 1 / (1 + np.exp(-(-0.5 + b1 * ingreso + b2 * joven)))).astype(int)
    pr = m.predict_proba(np.column_stack([ingreso, joven]))[:, 1]
    print(f"  {nombre:30s} PSI = {psi(X24[:, 0], ingreso):.3f}   AUC = {roc_auc_score(yc, pr):.3f}   "
          f"tasa real = {yc.mean():.3f}   predicha = {pr.mean():.3f}")

# 3) Equidad: el mismo umbral produce tasas de error distintas en dos grupos
n = 6000
grupo = rng.random(n) < 0.5
y = (rng.random(n) < np.where(grupo, 0.3, 0.5)).astype(int)            # prevalencias distintas
puntaje = y * 1.0 + rng.normal(0, np.where(grupo, 0.9, 0.6))           # el modelo es menos preciso en el grupo 1
print("\ngrupo   prevalencia   tasa de aprobación   TPR (exhaustividad)   FPR   precisión")
for g in [False, True]:
    s = grupo == g; pred = puntaje[s] > 0.5
    tp = np.sum(pred & (y[s] == 1)); fp = np.sum(pred & (y[s] == 0))
    print(f"{int(g):5d}   {y[s].mean():11.2f}   {pred.mean():18.2f}   {tp / y[s].sum():19.2f}   {fp / (1 - y[s]).sum():.2f}   {tp / max(pred.sum(), 1):9.2f}")
