# 23-forward.py — Del laboratorio a la cuenta: leer un historial en vivo y cuántas operaciones hacen falta para decidir
import os
import numpy as np
from ayuda import *

# A) Historial real de la cuenta de prueba de FTMO (21-27 de octubre de 2026): versión anterior del motor (escalera de 3 tramos)
ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'datos', 'ftmo_cierres.csv')
import csv
filas = list(csv.DictReader(open(ruta)))
profit = np.array([float(f['profit']) for f in filas]); t = np.array([f['time_utc'] for f in filas])
print('A) Cierres de la cuenta de prueba (versión de escalera, antes del manual v1.3): %d cierres parciales entre %s y %s' % (len(profit), t[0][:10], t[-1][:10]))
gan = profit[profit > 0]; per = profit[profit <= 0]
print('   Aciertos: %.1f %% | ganancia media %+.1f USD | pérdida media %+.1f USD | factor de beneficio %.2f | total %+.1f USD' % (100 * len(gan) / len(profit), gan.mean(), per.mean(), gan.sum() / -per.sum(), profit.sum()))
print('   Razón pérdida media / ganancia media = %.1f : 1  -> con tantos aciertos pequeños, un solo stop borra la racha' % (-per.mean() / gan.mean()))
dia = np.array([x[:10] for x in t])
print('   Por día (USD): ' + '; '.join('%s %+.0f' % (d[5:], profit[dia == d].sum()) for d in sorted(set(dia))))
print('   Los 3 grupos de stops simultáneos (22-oct 14:24, 26-oct 16:47, 27-oct 15:39) suman %+.0f USD; las %d ganancias restantes suman %+.0f USD' % (
    profit[profit < -5].sum(), (profit > 0).sum(), gan.sum()))
print('   Con 6 días y pocos grupos independientes, este historial no permite concluir nada sobre la expectativa; sí muestra el perfil: acierto alto, pérdida grande.')

# B) Cómo se estrecha la incertidumbre al acumular operaciones (sd de R = 0.88 como en los datos reales)
print('\nB) Intervalo del 95 %% del R medio medido (sd = 0.88) según las operaciones cerradas en vivo:')
for n in (20, 50, 100, 200, 400, 800):
    print('   n = %4d  ->  ± %.3f R' % (n, 1.96 * 0.88 / np.sqrt(n)))

# C) Criterio fijado de antemano: ¿cuántas operaciones, en promedio, hasta decidir con cada ventaja verdadera?
rng = np.random.default_rng(23)
print('\nC) Regla secuencial: aprobar si t > 2.5 con n >= 100; descartar si t < -1.5 con n >= 100 o si el límite superior del IC95 < +0.05 con n >= 200.')
print('   Se simulan 2000 historiales de hasta 800 operaciones con R de la forma real (sd 0.88) y la ventaja verdadera indicada.')
for edge in (-0.10, 0.0, 0.05, 0.10, 0.20, 0.30):
    ap = de = 0; ns = []
    for _ in range(2000):
        x = rng.normal(edge, 0.88, 800); res = None
        for n in range(100, 801, 10):
            m = x[:n].mean(); se = x[:n].std(ddof=1) / np.sqrt(n)
            if m / se > 2.5:
                res = 'a'; break
            if m / se < -1.5 or (n >= 200 and m + 1.96 * se < 0.05):
                res = 'd'; break
        if res == 'a':
            ap += 1; ns.append(n)
        elif res == 'd':
            de += 1; ns.append(n)
    print('   ventaja %+.2f R: aprueba %5.1f %% | descarta %5.1f %% | sin decidir en 800 operaciones %5.1f %% | operaciones medias al decidir %s' % (
        edge, 100 * ap / 2000, 100 * de / 2000, 100 * (2000 - ap - de) / 2000, '%.0f' % np.mean(ns) if ns else '—'))
