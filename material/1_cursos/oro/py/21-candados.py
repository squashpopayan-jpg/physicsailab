# 21-candados.py — Qué hacen realmente los candados diarios: cambian la forma del día, no la esperanza
import numpy as np
import motor
from ayuda import *

rng = np.random.default_rng(21)
S, ctx = serie_y_contexto('m5')
ops = motor.correr(S, motor.params(modo='ema', maxdist=12, rechazo=False), ctx)
R0 = R_de(ops); tp0 = np.array([t['motivo'] == 'TP' for t in ops])
print('Forma de R: %d operaciones reales (variante «ema»), media %+.3f R; TP en %.0f %% de ellas.' % (len(R0), R0.mean(), 100 * tp0.mean()))
RISK = 125.0


def dias(edge, balas, onedone, meta, topdia, lam=0.8, n=40000):
    out = np.zeros(n)
    for s in range(n):
        k = min(balas, rng.poisson(lam)); dp = 0.0; bloq = False
        for _ in range(k):
            if bloq:
                break
            i = rng.integers(len(R0)); r = R0[i] - R0.mean() + edge
            pnl = r * RISK; dp += pnl
            if (onedone and tp0[i] and pnl > 0) or dp >= meta or dp <= -topdia:
                bloq = True
        out[s] = dp
    return out


for edge in (0.0, 0.10):
    print('\n=== Ventaja verdadera %+.2f R por operación (0.8 operaciones por día disponibles) ===' % edge)
    print('   política                                   media/día   días verdes  días rojos  días sin operar  peor día   sd/día')
    for nom, kw in (('sin candados (hasta 5 balas)', dict(balas=5, onedone=False, meta=1e9, topdia=1e9)),
                    ('2 balas sin candados', dict(balas=2, onedone=False, meta=1e9, topdia=1e9)),
                    ('manual: 2 balas + One and Done + 180/-250', dict(balas=2, onedone=True, meta=180, topdia=250)),
                    ('1 sola bala', dict(balas=1, onedone=True, meta=180, topdia=250)),
                    ('manual con meta 90 (cierra antes)', dict(balas=2, onedone=True, meta=90, topdia=250))):
        d = dias(edge, **kw)
        print('   %-42s %+8.1f   %8.1f %%   %8.1f %%   %9.1f %%    %+8.0f  %7.1f' % (nom, d.mean(), 100 * (d > 0).mean(), 100 * (d < 0).mean(), 100 * (d == 0).mean(), d.min(), d.std()))
print('\nLa media diaria cambia poco entre políticas porque los candados no alteran el precio: solo deciden cuándo dejar de operar.')
