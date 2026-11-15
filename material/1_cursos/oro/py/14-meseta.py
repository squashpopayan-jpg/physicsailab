# 14-meseta.py — Mesetas, no picos: mapas de parámetros y suavizado por vecindad
import numpy as np
import motor
from ayuda import *

SLK = (0.4, 0.6, 0.8, 1.0, 1.3, 1.6, 2.0)
TPK = (0.8, 1.1, 1.4, 1.8, 2.4, 3.0, 4.0)


def mapa(S, ctx, kw):
    M = np.full((len(SLK), len(TPK)), np.nan); N = np.zeros((len(SLK), len(TPK)), int)
    for i, a in enumerate(SLK):
        for j, b in enumerate(TPK):
            ops = motor.correr(S, motor.params(slk=a, slmin=0, slmax=999, tpk=b, tpmin=0, tpmax=999, **kw), ctx)
            N[i, j] = len(ops)
            if len(ops) >= 10:
                M[i, j] = R_de(ops).mean()
    return M, N


def suave(M):
    out = np.full_like(M, np.nan)
    for i in range(M.shape[0]):
        for j in range(M.shape[1]):
            v = M[max(0, i - 1):i + 2, max(0, j - 1):j + 2]
            if np.isfinite(v).sum() >= 6:
                out[i, j] = np.nanmean(v)
    return out


S, ctx = serie_y_contexto('m5')
for nom, kw in (('manual «tocar y rechazar» (71 operaciones)', {}), ('variante «ema» sin rechazo (332 operaciones)', dict(modo='ema', maxdist=12, rechazo=False))):
    M, N = mapa(S, ctx, kw)
    print('=== M5 real, %s: R medio por (stop en ATR, TP en ATR)' % nom)
    print('   stop\\TP ' + ' '.join('%6.1f' % b for b in TPK))
    for i, a in enumerate(SLK):
        print('   %5.1f   ' % a + ' '.join('%+6.2f' % v if np.isfinite(v) else '   n/d' for v in M[i]))
    Sm = suave(M)
    ib = np.unravel_index(np.nanargmax(M), M.shape); isb = np.unravel_index(np.nanargmax(Sm), Sm.shape)
    print('   Mejor celda bruta: stop %.1f, TP %.1f -> R %+.3f (vecindad promedio %+.3f)' % (SLK[ib[0]], TPK[ib[1]], M[ib], Sm[ib]))
    print('   Mejor por vecindad: stop %.1f, TP %.1f -> R %+.3f (vecindad promedio %+.3f)' % (SLK[isb[0]], TPK[isb[1]], M[isb], Sm[isb]))
    print('   Celdas con R > 0: %d de %d | diferencia media entre celdas vecinas: %.3f R' % ((M > 0).sum(), np.isfinite(M).sum(), np.nanmean(np.abs(np.diff(M, axis=1)))))
    # ¿Qué elección sobrevive? Elegir en la primera mitad, medir en la segunda
    h = S.n // 2
    A = motor.Serie(S.t[:h], S.o[:h], S.h[:h], S.l[:h], S.c[:h], S.sp[:h], 5, 'A'); B = motor.Serie(S.t[h:], S.o[h:], S.h[h:], S.l[h:], S.c[h:], S.sp[h:], 5, 'B')
    Ma, _ = mapa(A, S, kw); Mb, _ = mapa(B, S, kw); Sa = suave(Ma)
    ka = np.unravel_index(np.nanargmax(Ma), Ma.shape); ks = np.unravel_index(np.nanargmax(Sa), Sa.shape)
    print('   Elegir en la 1.ª mitad por la celda bruta (stop %.1f, TP %.1f): 1.ª mitad %+.3f -> 2.ª mitad %+.3f' % (SLK[ka[0]], TPK[ka[1]], Ma[ka], Mb[ka]))
    print('   Elegir en la 1.ª mitad por vecindad    (stop %.1f, TP %.1f): 1.ª mitad %+.3f -> 2.ª mitad %+.3f' % (SLK[ks[0]], TPK[ks[1]], Ma[ks], Mb[ks]))
    print('   Promedio de TODAS las celdas en la 2.ª mitad: %+.3f' % np.nanmean(Mb))
    print()

# ¿La cresta de «tocar y rechazar» (stop corto, TP largo) es mérito de la señal o de la deriva del oro en esos meses?
# Se repite el mapa con entradas AL AZAR a favor del sesgo (misma frecuencia y mismas salidas): 40 réplicas por celda.
S, ctx = serie_y_contexto('m5')
X = motor.contexto(S, ctx)
P0 = motor.params()
ui, us, ua = motor.escanear_sesgo(S, X, P0)
p = len(motor.escanear(S, X, P0)[0]) / len(ui)
NUL = np.full((len(SLK), len(TPK)), np.nan)
r = np.random.default_rng(14)
for i, a in enumerate(SLK):
    for j, b in enumerate(TPK):
        P = motor.params(slk=a, slmin=0, slmax=999, tpk=b, tpmin=0, tpmax=999)
        v = []
        for _ in range(40):
            m = r.random(len(ui)) < p
            ops = motor.correr(S, P, ctx, (ui[m], us[m], ua[m]))
            if ops:
                v.append(R_de(ops).mean())
        NUL[i, j] = np.mean(v)
M, N = mapa(S, ctx, {})
print('=== Entradas AL AZAR a favor del sesgo (40 réplicas por celda): R medio')
print('   stop\TP ' + ' '.join('%6.1f' % b for b in TPK))
for i, a in enumerate(SLK):
    print('   %5.1f   ' % a + ' '.join('%+6.2f' % v for v in NUL[i]))
D = M - NUL
print('=== Señal menos azar (la parte atribuible a la regla de entrada)')
for i, a in enumerate(SLK):
    print('   %5.1f   ' % a + ' '.join('%+6.2f' % v if np.isfinite(v) else '   n/d' for v in D[i]))
print('   Promedio de la diferencia en todas las celdas: %+.3f | en la cresta (stop <= 0.6, TP >= 2.4): %+.3f' % (np.nanmean(D), np.nanmean(D[:2, 4:])))

