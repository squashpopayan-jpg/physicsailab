# 16-entradas.py — Sensibilidad de la regla de entrada, un parámetro a la vez, con intervalo y comparación con el azar
import numpy as np
import motor
from ayuda import *

S, ctx = serie_y_contexto('m5')
print('M5 real (17 meses). Se varía un parámetro de entrada; salidas y gestión del manual. «Azar» = mismas condiciones de sesgo y horario,')
print('hora de entrada aleatoria con la misma frecuencia (60 réplicas). «Señal - azar» mide lo que aporta la regla de entrada.\n')


def fila(nombre, kw):
    P = motor.params(**kw)
    ops = motor.correr(S, P, ctx)
    if len(ops) < 5:
        print('   %-26s n=%3d  (muy pocas operaciones)' % (nombre, len(ops))); return
    R = R_de(ops); c = ic(R)
    nu = nulo(S, ctx, P, n_rep=60, semilla=3)
    print('   %-26s n=%4d  R %+.3f ± %.3f   azar %+.3f   señal-azar %+.3f' % (nombre, c['n'], c['media'], 1.96 * c['ee'], nu.mean(), c['media'] - nu.mean()))


print('Extremo corto (minutos):')
for v in (10, 15, 30, 45, 60, 90):
    fila('w1m = %d' % v, dict(w1m=v))
print('Anti-persecución (pips entre H30 y el cierre):')
for v in (2, 4, 8, 12, 20, 30):
    fila('maxdist = %d' % v, dict(maxdist=v))
print('Banda neutra H4 (pips):')
for v in (0, 15, 50, 100, 200, 400):
    fila('banda = %d' % v, dict(banda=v))
print('Distancia mínima a la EMA20 (pips):')
for v in (0, 20, 40, 80):
    fila('dema = %d' % v, dict(dema=v))
print('Límite sobre H120 (pips):')
for v in (0, 20, 50, 400):
    fila('techo = %d' % v, dict(techo=v))
print('Vela de rechazo y dirección:')
fila('sin vela de rechazo', dict(rechazo=False))
fila('solo ventas', dict(dir='venta'))
fila('solo compras', dict(dir='compra'))
fila('con contra-tendencia', dict(contra=True))
