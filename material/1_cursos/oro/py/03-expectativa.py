# 03-expectativa.py — Expectativa, R y el acierto que se necesita para no perder
import numpy as np
from ayuda import *

rng = np.random.default_rng(3)
print('Acierto de equilibrio  p* = (1 + c) / (1 + payoff + c)   (c = costo en R por operación)')
print('payoff  sin costo   c=0.05   c=0.10')
for b in (0.6, 1.0, 1.6, 1.75, 2.0, 3.0):
    print('  %.2f    %5.1f %%   %5.1f %%   %5.1f %%' % (b, *(100 * (1 + c) / (1 + b + c) for c in (0.0, 0.05, 0.10))))

print('\nExpectativa E = p*payoff - (1-p) - c  para combinaciones del manual (payoff 1.64, c = 0.05):')
for p in (0.35, 0.40, 0.45, 0.50, 0.55):
    E = p * 1.64 - (1 - p) - 0.05
    print('  acierto %2d %%  ->  E = %+.3f R por operación' % (100 * p, E))

# Simulación: 10 000 secuencias de 100 operaciones con p=0.45, payoff 1.64, c=0.05
n, N = 100, 10000
gan = rng.random((N, n)) < 0.45
R = np.where(gan, 1.64, -1.0) - 0.05
tot = R.sum(axis=1)
print('\n10 000 secuencias de 100 operaciones con p=0.45 (E=%+.3f R): suma de R' % (0.45 * 1.64 - 0.55 - 0.05))
print('  media %+.1f R | desviación %.1f R | percentil 5 %+.1f | percentil 95 %+.1f | %% de secuencias negativas: %.0f %%' % (
    tot.mean(), tot.std(), *np.percentile(tot, [5, 95]), 100 * (tot < 0).mean()))
dd = np.max(np.maximum.accumulate(np.cumsum(R, axis=1), axis=1) - np.cumsum(R, axis=1), axis=1)
print('  caída máxima: mediana %.1f R, percentil 90 %.1f R' % (np.median(dd), np.percentile(dd, 90)))
print('  mayor racha de pérdidas seguidas (mediana de las secuencias): %d' % np.median([max(len(s) for s in ''.join('W' if g else 'L' for g in row).split('W')) for row in gan[:2000]]))
