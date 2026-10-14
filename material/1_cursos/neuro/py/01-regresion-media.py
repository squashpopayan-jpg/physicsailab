# Regresión a la media: un tratamiento que no hace nada "mejora" a quienes consultan en su peor semana
import numpy as np
from scipy import stats

rng = np.random.default_rng(1)
N = 20_000                      # personas por brazo
mu, sd_between, sd_within, phi = 5.0, 1.0, 1.5, 0.6
umbral, semanas = 7.0, 4

def brazo(efecto):
    base = mu + sd_between * rng.standard_normal(N)          # nivel habitual de cada persona
    e = sd_within * rng.standard_normal(N)                   # fluctuación semanal, AR(1) estacionario
    pre = np.full(N, np.nan)
    for semana in range(52):                                 # consulta en su primera semana mala
        y = base + e
        nuevo = np.isnan(pre) & (y >= umbral)
        pre[nuevo] = y[nuevo]
        e = phi * e + sd_within * np.sqrt(1 - phi**2) * rng.standard_normal(N)
    ok = ~np.isnan(pre)
    base, pre = base[ok], pre[ok]
    e = pre - base
    for semana in range(semanas):                            # evolución hasta el seguimiento
        e = phi * e + sd_within * np.sqrt(1 - phi**2) * rng.standard_normal(e.size)
    return pre, base + e - efecto

print("1) Ensayo simulado: el 'tratamiento' no tiene ningún efecto")
pre_t, post_t = brazo(efecto=0.0)
pre_c, post_c = brazo(efecto=0.0)
mej_t, mej_c = (pre_t - post_t).mean(), (pre_c - post_c).mean()
print(f"   Consultaron:                      {pre_t.size} y {pre_c.size} personas")
print(f"   Síntoma medio al consultar:       {pre_t.mean():.2f} (escala 0-10, media de la población 5)")
print(f"   Mejora media, grupo 'tratado':    {mej_t:.2f} puntos")
print(f"   Mejora media, grupo de control:   {mej_c:.2f} puntos")
print(f"   Diferencia (efecto estimado):     {mej_t - mej_c:+.3f} puntos")
print(f"   Tratados que mejoraron >= 2:      {np.mean(pre_t - post_t >= 2):.0%}")
t = stats.ttest_ind(pre_t - post_t, pre_c - post_c, equal_var=False)
print(f"   Welch entre brazos:               p = {t.pvalue:.2f}")

print("\n2) La fórmula de la normal bivariada: seleccionar X > c y medir Y")
rho, c, s = 0.6, 7.0, 1.8
X = mu + s * rng.standard_normal(1_000_000)
Y = mu + rho * (X - mu) + s * np.sqrt(1 - rho**2) * rng.standard_normal(X.size)
sel = X > c
m_trunc = stats.truncnorm.mean((c - mu) / s, np.inf, loc=mu, scale=s)
print(f"   E[X | X > c]: simulado {X[sel].mean():.3f} · fórmula (SciPy) {m_trunc:.3f}")
print(f"   Mejora X - Y: simulada {(X[sel] - Y[sel]).mean():.3f} · fórmula (1 - rho)(E[X|X>c] - mu) = {(1 - rho) * (m_trunc - mu):.3f}")
