# Curva de automaticidad de Lally y otros (2010): ajuste no lineal y días hasta el 95 % de la meseta
import numpy as np
from scipy.optimize import curve_fit

def curva(t, a, b, c):
    return a - b * np.exp(-c * t)                    # A(t) = a − b·e^(−c t)

def t95(a, b, c):
    return np.log(b / (0.05 * a)) / c                 # a − b e^(−c t) = 0,95 a

rng = np.random.default_rng(15)
# 1) Una persona: autorreporte semanal de automaticidad (escala 1–7) durante 12 semanas
t = np.arange(0, 85, 7.0)
real = (5.8, 4.4, 0.045)
y = np.clip(curva(t, *real) + 0.3 * rng.standard_normal(t.size), 1, 7)
p, cov = curve_fit(curva, t, y, p0=[6, 4, 0.05], maxfev=20000)
err = np.sqrt(np.diag(cov))
print("Una persona, 13 respuestas semanales")
print(f"  asíntota a = {p[0]:.2f} ± {err[0]:.2f}   tasa c = {p[2]:.4f} ± {err[2]:.4f} por día")
print(f"  días hasta el 95 % de su meseta: {t95(*p):.0f}   (con los parámetros reales: {t95(*real):.0f})")

# 2) Cuarenta personas con tasas distintas (log-normal) y su propio ruido de respuesta
print("\nCuarenta personas, autorreporte diario durante 84 días")
tt = np.arange(0, 85, 1.0)
dias = []
for i in range(40):
    c = np.exp(np.log(0.035) + 0.7 * rng.standard_normal())
    a = rng.uniform(4.5, 6.5)
    yy = np.clip(curva(tt, a, a - 1.3, c) + 0.4 * rng.standard_normal(tt.size), 1, 7)
    try:
        q, _ = curve_fit(curva, tt, yy, p0=[6, 4, 0.05], maxfev=20000)
        if q[2] > 0 and q[1] > 0:
            dias.append(t95(*q))
    except RuntimeError:
        pass
dias = np.array(dias)
print(f"  curvas ajustadas: {dias.size}")
print(f"  mediana de días hasta el 95 %: {np.median(dias):.0f}")
print(f"  rango: {dias.min():.0f} a {dias.max():.0f} días")
print(f"  personas que superan 84 días (más allá de lo observado): {np.sum(dias > 84)}")
