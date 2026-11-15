# 15-walkforward.py — Validación progresiva: re-optimizar con el pasado, operar el futuro inmediato
import numpy as np
import motor
from ayuda import *

S = motor.cargar('m5')
KW = dict(modo='ema', maxdist=12, rechazo=False)                       # variante con operaciones suficientes
GRID = [(a, b) for a in (0.5, 0.8, 1.2) for b in (1.0, 1.4, 2.0, 3.0)]
dia = (S.t // 1440).astype(int)
d0 = dia.min()
TRAIN, TEST = 180, 60                                                  # días de calendario


def corte(i0, i1):
    n = S.n
    return motor.Serie(S.t[i0:i1], S.o[i0:i1], S.h[i0:i1], S.l[i0:i1], S.c[i0:i1], S.sp[i0:i1], 5, 'tramo')


def tramo(dd0, dd1):
    i0 = int(np.searchsorted(dia, dd0)); i1 = int(np.searchsorted(dia, dd1))
    return corte(i0, i1)


def prueba(sub, cfg):
    P = motor.params(slk=cfg[0], slmin=0, slmax=999, tpk=cfg[1], tpmin=0, tpmax=999, **KW)
    return R_de(motor.correr(sub, P, S))


print('Recorrido: entrenar %d días, probar los %d siguientes, avanzar %d días. Rejilla de %d combinaciones (stop y TP en múltiplos de ATR).' % (TRAIN, TEST, TEST, len(GRID)))
print('  tramo de prueba   elección (stop, TP)  R entrenamiento (n)   R prueba (n)   R manual fijo 0.8/1.4 en la prueba (n)')
oos = []; fijo = []; ist = []
ini = d0
while ini + TRAIN + TEST <= dia.max():
    tr = tramo(ini, ini + TRAIN); te = tramo(ini + TRAIN, ini + TRAIN + TEST)
    res = [(prueba(tr, g), g) for g in GRID]
    cand = [(r.mean() if len(r) >= 10 else -9, g, len(r)) for r, g in res]
    mejor = max(cand)
    r_te = prueba(te, mejor[1]); r_fx = prueba(te, (0.8, 1.4))
    fecha = np.datetime64(int(te.t[0]), 'm').astype('datetime64[D]')
    print('  %s   %.1f / %.1f             %+.3f (%3d)        %+.3f (%3d)        %+.3f (%3d)' % (fecha, *mejor[1], mejor[0], mejor[2], r_te.mean() if len(r_te) else np.nan, len(r_te), r_fx.mean() if len(r_fx) else np.nan, len(r_fx)))
    oos += list(r_te); fijo += list(r_fx); ist.append(mejor[0])
    ini += TEST
oos = np.array(oos); fijo = np.array(fijo)
print('\nResultado agregado fuera de muestra:')
print('   re-optimizando en cada tramo:  n=%d  R medio %+.3f  IC95 [%+.3f, %+.3f]' % (len(oos), oos.mean(), oos.mean() - 1.96 * oos.std(ddof=1) / np.sqrt(len(oos)), oos.mean() + 1.96 * oos.std(ddof=1) / np.sqrt(len(oos))))
print('   parámetros fijos del manual:   n=%d  R medio %+.3f  IC95 [%+.3f, %+.3f]' % (len(fijo), fijo.mean(), fijo.mean() - 1.96 * fijo.std(ddof=1) / np.sqrt(len(fijo)), fijo.mean() + 1.96 * fijo.std(ddof=1) / np.sqrt(len(fijo))))
print('   R medio dentro de muestra de los ganadores de cada entrenamiento: %+.3f (lo que el optimizador «veía»)' % np.mean(ist))
