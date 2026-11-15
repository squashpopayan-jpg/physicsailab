# 06-salidas.py — Ninguna regla de salida crea ventaja: solo reparte el resultado entre aciertos y recompensa
import numpy as np
import motor
from ayuda import *

# A) Caminata aleatoria simétrica: stop y take profit a distintas distancias, esperanza exacta cero
rng = np.random.default_rng(11)
print('A) Caminata simétrica de pasos de 5 pips, sin costos: 20 000 operaciones por fila')
print('    stop  take profit  acierto teórico  acierto simulado  R medio simulado (EE)')
for sl, tp in ((55, 55), (55, 90), (55, 150), (55, 300), (30, 90)):
    N = 20000
    pos = np.zeros(N, dtype=int); vivo = np.ones(N, bool); gan = np.zeros(N, bool)
    while vivo.any():
        pos[vivo] += rng.choice([-5, 5], size=vivo.sum())
        up = vivo & (pos >= tp); dn = vivo & (pos <= -sl)
        gan |= up; vivo &= ~(up | dn)
    R = np.where(gan, tp / sl, -1.0)
    print('    %3d      %3d          %5.1f %%           %5.1f %%         %+.3f (%.3f)' % (sl, tp, 100 * sl / (sl + tp), 100 * gan.mean(), R.mean(), R.std(ddof=1) / np.sqrt(N)))

# B) Datos reales, entradas al azar a favor del sesgo (modelo nulo): ¿cambia la esperanza al cambiar la gestión?
print('\nB) M5 real, entradas al azar a favor del sesgo H4 (100 réplicas por fila). La esperanza no cambia;')
print('    cambian el acierto y el tamaño de las ganancias.')
S, ctx = serie_y_contexto('m5')
X = motor.contexto(S, ctx)
base = motor.params()
ui, us, ua = motor.escanear_sesgo(S, X, base)
p = len(motor.escanear(S, X, base)[0]) / len(ui)
configs = [('gestión completa (manual)', {}), ('sin gestión (SL y TP fijos)', dict(sld=False, be=False, stag=False)),
           ('solo SL defensivo', dict(be=False, stag=False)), ('solo break-even', dict(sld=False, stag=False)),
           ('solo estancamiento', dict(sld=False, be=False)), ('sin gestión, TP = 3 x ATR', dict(sld=False, be=False, stag=False, tpk=3.0, tpmax=300)),
           ('sin gestión, TP = 0.7 x ATR', dict(sld=False, be=False, stag=False, tpk=0.7, tpmin=30, tpmax=300))]
print('    %-30s %8s %9s %10s %10s' % ('configuración', 'ops', 'acierto', 'R medio', 'sd entre réplicas'))
for nom, kw in configs:
    P = motor.params(**kw)
    medias = []; aciertos = []; ns = []
    r = np.random.default_rng(5)
    for _ in range(100):
        m = r.random(len(ui)) < p
        ops = motor.correr(S, P, ctx, (ui[m], us[m], ua[m]))
        if ops:
            R = R_de(ops); medias.append(R.mean()); aciertos.append((R > 0).mean()); ns.append(len(ops))
    print('    %-30s %8.0f %8.1f %% %+10.3f %10.3f' % (nom, np.mean(ns), 100 * np.mean(aciertos), np.mean(medias), np.std(medias)))
