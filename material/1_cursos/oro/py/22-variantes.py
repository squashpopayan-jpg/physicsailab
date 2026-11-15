# 22-variantes.py — Comparar variantes con la misma vara: intervalo, modelo nulo y corrección por probar muchas
import numpy as np
import motor
from ayuda import *
from scipy import stats

VAR = [('Tocar y rechazar (manual)', {}),        ('Zona H120 + EMA 40 (motor v1.2)', dict(modo='zona', dema=40)), ('Zona H120 sin distancia a la EMA', dict(modo='zona', dema=0)),
       ('Rechazo en la EMA20 de M15', dict(modo='ema', maxdist=12)), ('Rechazo en la EMA20 sin vela', dict(modo='ema', maxdist=12, rechazo=False)),
       ('Ruptura a favor del sesgo (momento)', dict(modo='ruptura', maxdist=15)),
       ('Manual + contra-tendencia', dict(contra=True)), ('Tocar con extremo de 15 min', dict(w1m=15)),
       ('Tocar con extremo de 60 min', dict(w1m=60)), ('Tocar, solo compras', dict(dir='compra')), ('Tocar, solo ventas', dict(dir='venta'))]
K = len(VAR)
umbral = stats.norm.ppf(1 - 0.05 / (2 * K))
print('Se prueban K = %d variantes. Umbral de |t| para 5 %% de falsos positivos global (Bonferroni): %.2f (frente a 1.96 de una sola prueba).\n' % (K, umbral))
for nombre in ('m5', 'm1'):
    S, ctx = serie_y_contexto(nombre)
    print('=== %s' % nombre.upper())
    print('   %-40s %5s %9s %17s %7s %9s %6s' % ('variante', 'n', 'R medio', 'IC95', 't', 'azar', 'ok'))
    for nom, kw in VAR:
        P = motor.params(**kw)
        ops = motor.correr(S, P, ctx)
        if len(ops) < 10:
            print('   %-40s %5d  (pocas operaciones)' % (nom, len(ops))); continue
        R = R_de(ops); c = ic(R)
        nu = nulo(S, ctx, P, n_rep=40, semilla=22)
        print('   %-40s %5d %+9.3f [%+.3f, %+.3f] %+7.2f %+9.3f %6s' % (nom, c['n'], c['media'], c['lo'], c['hi'], c['t'], nu.mean(), 'sí' if abs(c['t']) > umbral else '—'))
    print()
