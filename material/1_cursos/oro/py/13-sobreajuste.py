# 13-sobreajuste.py — Optimizar parámetros sobre ruido: la ilusión del mejor ajuste
import itertools
import numpy as np
import motor
from ayuda import *

GRID = list(itertools.product((0.5, 0.8, 1.2, 1.6, 2.0), (0.8, 1.4, 2.0, 3.0, 4.0), (15, 30, 60)))      # slk, tpk, w1m = 75 combinaciones
print('Rejilla: %d combinaciones de (stop en ATR, TP en ATR, ventana corta); entrada «ema» sin rechazo (la variante con más operaciones).\n' % len(GRID))


def evaluar(S, ctx, cfg, kw):
    slk, tpk, w1 = cfg
    P = motor.params(slk=slk, slmin=0, slmax=999, tpk=tpk, tpmin=0, tpmax=999, w1m=w1, **kw)
    ops = motor.correr(S, P, ctx)
    return R_de(ops) if ops else np.array([])


KW = dict(modo='ema', maxdist=12, rechazo=False)

# A) Mundos sin ventaja: se optimiza en el primero y se prueba en el segundo
print('A) 30 pares de mundos sintéticos SIN ventaja (60 días cada uno): se elige el mejor de 75 en el mundo 1 y se prueba en el mundo 2')
mejor_is = []; oos = []; todos_oos = []
for s in range(30):
    A = mundo(semilla=300 + s); B = mundo(semilla=900 + s)
    ra = [evaluar(A, None, g, KW) for g in GRID]
    rb = [evaluar(B, None, g, KW) for g in GRID]
    ma = np.array([r.mean() if len(r) >= 8 else -9 for r in ra]); mb = np.array([r.mean() if len(r) >= 8 else np.nan for r in rb])
    k = int(np.argmax(ma))
    mejor_is.append(ma[k]); oos.append(mb[k]); todos_oos.append(np.nanmean(mb))
print('   R medio del mejor ajuste en el mundo 1 (dentro de muestra): %+.3f' % np.mean(mejor_is))
print('   R medio de ESE mismo ajuste en el mundo 2 (fuera de muestra): %+.3f' % np.mean(oos))
print('   R medio promedio de las 75 combinaciones en el mundo 2:       %+.3f' % np.mean(todos_oos))
print('   En %d de 30 pares el mejor ajuste dio positivo dentro de muestra; en %d de 30 fuera de muestra' % (sum(np.array(mejor_is) > 0), sum(np.array(oos) > 0)))

# B) Datos reales: primera mitad vs segunda mitad de M5
print('\nB) Oro real M5: elegir en la primera mitad (8.5 meses) y probar en la segunda')
S = motor.cargar('m5')
h = S.n // 2
A = motor.Serie(S.t[:h], S.o[:h], S.h[:h], S.l[:h], S.c[:h], S.sp[:h], 5, 'A')
B = motor.Serie(S.t[h:], S.o[h:], S.h[h:], S.l[h:], S.c[h:], S.sp[h:], 5, 'B')
ra = [evaluar(A, S, g, KW) for g in GRID]; rb = [evaluar(B, S, g, KW) for g in GRID]
ma = np.array([r.mean() if len(r) >= 8 else np.nan for r in ra]); mb = np.array([r.mean() if len(r) >= 8 else np.nan for r in rb])
ok = ~np.isnan(ma) & ~np.isnan(mb)
k = int(np.nanargmax(ma))
print('   Mejor de la primera mitad: stop %.1f ATR, TP %.1f ATR, ventana %d min -> R %+.3f (n=%d)' % (*GRID[k], ma[k], len(ra[k])))
print('   Esa misma combinación en la segunda mitad:                       R %+.3f (n=%d)' % (mb[k], len(rb[k])))
print('   Correlación entre los R de las 75 combinaciones en ambas mitades: %+.2f' % np.corrcoef(ma[ok], mb[ok])[0, 1])
print('   Combinaciones con R > 0: primera mitad %d de %d | segunda mitad %d de %d' % ((ma[ok] > 0).sum(), ok.sum(), (mb[ok] > 0).sum(), ok.sum()))
print('   R medio de todas las combinaciones: primera mitad %+.3f | segunda mitad %+.3f' % (np.nanmean(ma), np.nanmean(mb)))
