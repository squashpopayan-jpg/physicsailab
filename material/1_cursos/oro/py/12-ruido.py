# 12-ruido.py — Cuántas operaciones hacen falta para distinguir una ventaja del azar
import numpy as np
import motor
from ayuda import *
from scipy import stats

rng = np.random.default_rng(12)
S, ctx = serie_y_contexto('m5')
ops = motor.correr(S, motor.params(modo='ema', maxdist=12, rechazo=False), ctx)      # variante con más operaciones
R = R_de(ops)
sd = R.std(ddof=1)
print('Desviación típica de R por operación en los datos reales: %.2f (referencia: 1.0 si todo fuese -1 / +1)' % sd)

print('\nOperaciones necesarias para detectar una ventaja con 80 %% de potencia y 5 %% de falsos positivos (sd = %.2f):' % sd)
for edge in (0.30, 0.20, 0.10, 0.05, 0.03):
    n = int(np.ceil(((stats.norm.ppf(0.975) + stats.norm.ppf(0.8)) * sd / edge) ** 2))
    print('   ventaja %+.2f R  ->  %6d operaciones  (a 0.8 por día: %5.0f días hábiles = %.1f años)' % (edge, n, n / 0.8, n / 0.8 / 252))

print('\nAncho del intervalo de confianza del 95 %% según las operaciones disponibles (sd = %.2f):' % sd)
for n in (59, 71, 184, 400, 1000):
    print('   n = %4d  ->  R medio medido ± %.3f R' % (n, 1.96 * sd / np.sqrt(n)))

# Falsos positivos: estrategias SIN ventaja (se resta la media a los R reales) con n operaciones
print('\nMil estrategias sin ninguna ventaja (R remuestreados de los reales, con media corregida a 0):')
Rc = R - R.mean()
for n in (30, 70, 150):
    t = np.array([(lambda x: x.mean() / (x.std(ddof=1) / np.sqrt(n)))(rng.choice(Rc, n)) for _ in range(1000)])
    print('   n = %3d: |t| > 2 en el %.1f %% | t > 2 en el %.1f %% | la mejor de las 1000 tiene t = %.2f' % (n, 100 * (np.abs(t) > 2).mean(), 100 * (t > 2).mean(), t.max()))

print('\nProbabilidad de que AL MENOS una de K variantes sin ventaja parezca significativa (t > 2, una cola):')
for K in (1, 5, 10, 20, 50, 100):
    print('   K = %3d variantes probadas  ->  %.0f %%' % (K, 100 * (1 - (1 - 0.0228) ** K)))
