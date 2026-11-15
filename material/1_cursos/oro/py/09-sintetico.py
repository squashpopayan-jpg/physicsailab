# 09-sintetico.py — Un mercado sintético calibrado con el oro real, y cómo responde la estrategia en cada tipo de mundo
import numpy as np
import motor
from ayuda import *


def razon_varianza(S, X, q):
    mm = X['mm']; win = (mm >= 537) & (mm < 780) & (X['sem'] < 5)
    c = S.c; r1 = np.diff(c, prepend=c[0])
    rq = c[q:] - c[:-q]
    ok = win[q:] & win[:-q] & (X['dia'][q:] == X['dia'][:-q])
    ok1 = win[1:] & (X['dia'][1:] == X['dia'][:-1])
    return rq[ok].var() / (q * r1[1:][ok1].var())


real = motor.cargar('m5')
Xr = motor.contexto(real)
print('Oro real (M5, 17 meses):  rango medio %.2f USD | razón de varianza VR(6)=%.2f VR(12)=%.2f VR(24)=%.2f' % (
    (real.h - real.l).mean(), *(razon_varianza(real, Xr, q) for q in (6, 12, 24))))
print('(VR < 1 indica reversión: las variaciones a 30 min-2 h se cancelan algo más de lo que haría una caminata aleatoria.)\n')

print('Mundos sintéticos de 60 días (M5); VR promedio de 8 mundos y R medio de la estrategia en 60 mundos:')
print('   %-26s %6s %6s %6s %6s | %8s %14s' % ('mundo', 'rango', 'VR(6)', 'VR(12)', 'VR(24)', 'n ops', 'R medio (EE)'))
for nom, kw in (('sin ventaja', {}), ('momento 0.10', dict(tendencia=0.10)), ('momento 0.25', dict(tendencia=0.25)),
                ('reversión 1 (calibrado)', dict(reversion=1.0)), ('reversión 3', dict(reversion=3.0))):
    vr = {6: [], 12: [], 24: []}; rg = []; Rs = []
    for s in range(60):
        S = mundo(semilla=100 + s, **kw)
        X = motor.contexto(S)
        if s < 8:
            rg.append((S.h - S.l).mean())
            for q in vr:
                vr[q].append(razon_varianza(S, X, q))
        Rs += list(R_de(motor.correr(S, motor.params())))
    Rs = np.array(Rs)
    print('   %-26s %6.2f %6.2f %6.2f %6.2f | %8d %+8.3f (%.3f)' % (nom, np.mean(rg), np.mean(vr[6]), np.mean(vr[12]), np.mean(vr[24]), len(Rs), Rs.mean(), Rs.std(ddof=1) / np.sqrt(len(Rs))))
