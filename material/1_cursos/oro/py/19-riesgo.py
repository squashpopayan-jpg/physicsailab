# 19-riesgo.py — Cuánto arriesgar por operación: crecimiento, caídas y el criterio de Kelly con ventaja incierta
import numpy as np
import motor
from ayuda import *

rng = np.random.default_rng(19)
S, ctx = serie_y_contexto('m5')
ops = motor.correr(S, motor.params(modo='ema', maxdist=12, rechazo=False), ctx)       # forma realista de la distribución de R
R0 = R_de(ops)
sd = R0.std(ddof=1)
print('Distribución real de R (332 operaciones, variante «ema»): media %+.3f, sd %.2f, asimetría %.2f, peor %.2f, mejor %+.2f' % (R0.mean(), sd, ((R0 - R0.mean()) ** 3).mean() / sd ** 3, R0.min(), R0.max()))
Rc = R0 - R0.mean()

print('\nKelly: fracción de la cuenta que maximiza el crecimiento = E / sd^2 (con riesgo medido en R)')
for e in (0.05, 0.10, 0.20):
    f = e / sd ** 2
    print('   ventaja %+.2f R: Kelly completo %.1f %% por operación | medio Kelly %.1f %% | cuarto de Kelly %.1f %%' % (e, 100 * f, 50 * f, 25 * f))
print('   (Con una ventaja medida con error ±0.2 R, el Kelly «verdadero» puede ser cero: por eso se opera una fracción pequeña.)')

N_OPS, NSIM = 250, 4000
print('\nSimulación: %d operaciones (unos 12 meses a 1 por día), %d trayectorias, R remuestreados con la forma real y la ventaja indicada.' % (N_OPS, NSIM))
print('   ventaja  riesgo/op   mediana final   P(final<0)  caída máx. mediana   P(caída>10 %%)   P(caída>20 %%)')
for e in (0.0, 0.05, 0.10, 0.20):
    for r in (0.00125, 0.0025, 0.005, 0.01, 0.02):
        sample = rng.choice(Rc, size=(NSIM, N_OPS)) + e
        eq = np.cumprod(1 + r * sample, axis=1)
        eq = np.concatenate([np.ones((NSIM, 1)), eq], axis=1)
        dd = np.max(1 - eq / np.maximum.accumulate(eq, axis=1), axis=1)
        fin = eq[:, -1] - 1
        print('   %+.2f R   %5.3f %%    %+8.1f %%     %5.1f %%        %5.1f %%           %5.1f %%         %5.1f %%' % (
            e, 100 * r, 100 * np.median(fin), 100 * (fin < 0).mean(), 100 * np.median(dd), 100 * (dd > 0.10).mean(), 100 * (dd > 0.20).mean()))
    print()
