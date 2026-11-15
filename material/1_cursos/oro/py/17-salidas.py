# 17-salidas.py — Sensibilidad de stop, take profit y gestión: forma del resultado y cresta de parámetros
import numpy as np
import motor
from ayuda import *

LIBRE = dict(slmin=0, slmax=999, tpmin=0, tpmax=999)
for nombre in ('m5', 'm1'):
    S, ctx = serie_y_contexto(nombre)
    print('=== %s real (manual «tocar y rechazar»)' % nombre.upper())

    def fila(nom, kw):
        ops = motor.correr(S, motor.params(**kw), ctx)
        if len(ops) < 5:
            print('   %-30s n=%d' % (nom, len(ops))); return
        R = R_de(ops); c = ic(R); gan = R[R > 0]; per = R[R <= 0]
        print('   %-30s n=%3d  aciertos %4.1f %%  R %+.3f ± %.3f   ganancia media %+.2f  pérdida media %+.2f' % (nom, c['n'], 100 * (R > 0).mean(), c['media'], 1.96 * c['ee'], gan.mean() if len(gan) else 0, per.mean() if len(per) else 0))

    print(' Stop = k x ATR (TP = 1.4 x ATR, sin topes):')
    for k in (0.3, 0.5, 0.8, 1.2, 2.0):
        fila('k = %.1f' % k, dict(slk=k, **LIBRE, tpk=1.4))
    print(' TP = k x ATR (stop = 0.5 x ATR, sin topes):')
    for k in (0.6, 1.0, 1.4, 2.0, 3.0, 4.0):
        fila('k = %.1f' % k, dict(slk=0.5, tpk=k, **LIBRE))
    print(' Topes del manual (stop 0.8 ATR en [45, 60], TP 1.4 ATR en [80, 100]) y variantes:')
    fila('manual', {})
    fila('stop [30, 60]', dict(slmin=30))
    fila('stop [45, 120]', dict(slmax=120))
    fila('TP [80, 200]', dict(tpmax=200))
    print(' Gestión:')
    for nom, kw in (('completa (manual)', {}), ('sin SL defensivo', dict(sld=False)), ('SLD a +40 pips', dict(sldact=40, sldpips=20)), ('SLD a +20 pasa a 0', dict(sldpips=0)),
                    ('sin break-even', dict(be=False)), ('BE a 25 % del TP', dict(beratio=0.25)), ('BE a 60 % del TP', dict(beratio=0.6)),
                    ('sin estancamiento', dict(stag=False)), ('estancamiento 60 min', dict(stagmin=60)), ('sin ninguna gestión', dict(sld=False, be=False, stag=False))):
        fila(nom, kw)
    print()

print('=== Cresta candidata (stop 0.5 ATR en [20, 80], TP 2.5 ATR en [100, 300]) en M5 y M1')
for nombre in ('m5', 'm1'):
    S, ctx = serie_y_contexto(nombre)
    for nom, kw in (('manual', {}), ('cresta + gestión del manual', dict(slk=0.5, slmin=20, slmax=80, tpk=2.5, tpmin=100, tpmax=300)),
                    ('cresta sin SL defensivo', dict(slk=0.5, slmin=20, slmax=80, tpk=2.5, tpmin=100, tpmax=300, sld=False)),
                    ('cresta solo break-even (20 % del TP)', dict(slk=0.5, slmin=20, slmax=80, tpk=2.5, tpmin=100, tpmax=300, sld=False, stag=False, beratio=0.2))):
        ops = motor.correr(S, motor.params(**kw), ctx)
        print('   %s %s' % (nombre.upper(), linea(nom, ops)))
