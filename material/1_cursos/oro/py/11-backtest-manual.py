# 11-backtest-manual.py — El manual v1.3 en datos reales: resultados, intervalos y comparación con entradas al azar
import numpy as np
import motor
from ayuda import *

for nombre, etiqueta in (('m1', 'M1 (26-jun a 7-oct de 2026, 3.4 meses)'), ('m5', 'M5 (may-2025 a oct-2026, 17 meses)'), ('m15', 'M15 (jul-2022 a oct-2026, 4.2 años; ventanas escaladas)')):
    S, ctx = serie_y_contexto(nombre)
    print('=== %s' % etiqueta)
    P = motor.params(stagmin=30 if nombre != 'm15' else 60)
    ops = motor.correr(S, P, ctx)
    print(linea('manual (tocar y rechazar)', ops))
    print(linea('  solo ventas', motor.correr(S, motor.params(dir='venta', stagmin=P['stagmin']), ctx)))
    print(linea('  solo compras', motor.correr(S, motor.params(dir='compra', stagmin=P['stagmin']), ctx)))
    print(linea('motor v1.2 (zona H120, EMA+40)', motor.correr(S, motor.params(modo='zona', dema=40, stagmin=P['stagmin']), ctx)))
    if nombre != 'm15':
        nu = nulo(S, ctx, P, n_rep=200)
        R = R_de(ops)
        print('  Entradas al azar a favor del sesgo (200 réplicas): R medio %+.3f, sd %.3f | la señal del manual supera al %.0f %% de las réplicas' % (nu.mean(), nu.std(), 100 * (nu < R.mean()).mean()))
    r = motor.resumen(ops)
    print('  Motivos de salida: %s' % r['motivos'])
    if len(ops) > 5:
        for mot in ('TP', 'SL', 'SLD', 'BE', 'STAG'):
            R = [t['R'] for t in ops if t['motivo'] == mot]
            if R:
                print('     %-5s %3d operaciones, R medio %+.2f' % (mot, len(R), np.mean(R)))
        print('  Caída máxima: %.0f USD (%.2f %% de 100 000); mayor racha negativa de R acumulado: %.1f R' % (r['caida_usd'], 100 * r['caida_usd'] / 100000, r['caida_usd'] / 125))
    print()

# Por trimestre en M5: la ganancia se concentra
S, ctx = serie_y_contexto('m5')
ops = motor.correr(S, motor.params(), ctx)
import collections
tri = collections.defaultdict(list)
for t in ops:
    f = np.datetime64(int(S.t[t['j']]), 'm')
    y = f.astype('datetime64[Y]').astype(int) + 1970
    m = f.astype('datetime64[M]').astype(int) % 12
    tri['%d-T%d' % (y, m // 3 + 1)].append(t['R'])
print('M5 por trimestre (n, R medio, R acumulado):')
for k in sorted(tri):
    v = np.array(tri[k]); print('   %s  n=%2d  R medio %+.2f  R suma %+.1f' % (k, len(v), v.mean(), v.sum()))
