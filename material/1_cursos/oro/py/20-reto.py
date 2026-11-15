# 20-reto.py — Probabilidad de aprobar un reto de fondeo de 2 pasos según el riesgo por operación y la ventaja
import numpy as np
import motor
from ayuda import *

rng = np.random.default_rng(20)
S, ctx = serie_y_contexto('m5')
ops = motor.correr(S, motor.params(modo='ema', maxdist=12, rechazo=False), ctx)
R0 = R_de(ops); tp0 = np.array([t['motivo'] == 'TP' for t in ops])
Rc = R0 - R0.mean()
CUENTA = 100000.0


def reto(edge, riesgo_pct, lam=0.8, balas=2, objetivo=0.10, max_dias=365, nsim=3000, limite_dia=0.05, limite_total=0.10, onedone=True, meta=180.0, topdia=250.0):
    """Simula un reto: ventaja `edge` (R por operación) sobre la forma real de R; `lam` operaciones diarias promedio."""
    risk = CUENTA * riesgo_pct
    pasa = 0; falla = 0; dias = []
    for _ in range(nsim):
        eq = 0.0; estado = 0
        for d in range(1, max_dias + 1):
            k = min(balas, rng.poisson(lam)); dp = 0.0; bloq = False
            for _q in range(k):
                if bloq:
                    break
                i = rng.integers(len(Rc)); r = Rc[i] + edge
                pnl = r * risk; dp += pnl; eq += pnl
                if -dp >= limite_dia * CUENTA or -eq >= limite_total * CUENTA:
                    estado = -1; break
                if (onedone and tp0[i] and pnl > 0) or dp >= meta or dp <= -topdia:
                    bloq = True
            if estado == -1:
                break
            if eq >= objetivo * CUENTA and d >= 4:
                estado = 1; break
        if estado == 1:
            pasa += 1; dias.append(d)
        elif estado == -1:
            falla += 1
    return pasa / nsim, falla / nsim, (np.median(dias) if dias else np.nan)


print('Reto de 2 pasos, paso 1 (objetivo 10 %, pérdida diaria 5 %, pérdida total 10 %). 0.8 operaciones/día, 2 balas, candados del manual.')
print('Con topes del bot de 125 USD por operación el tope diario es -250 USD; para riesgos mayores se escalan el tope (2 balas) y la meta (1.44 R).')
print('   ventaja   riesgo/op   aprueba(365 días)  falla   mediana de días al aprobar')
for e in (0.0, 0.05, 0.10, 0.20):
    for r in (0.00125, 0.0025, 0.005, 0.01):
        esc = r / 0.00125
        a, f, md = reto(e, r, meta=180 * esc, topdia=250 * esc, nsim=1500)
        print('   %+.2f R    %5.3f %%      %5.1f %%      %5.1f %%    %s' % (e, 100 * r, 100 * a, 100 * f, ('%.0f' % md) if md == md else '—'))
    print()
