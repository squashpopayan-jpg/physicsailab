# 10-motor.py — Supuestos del backtest: orden intrabarra, costos y la regla tramposa que ve el futuro
import numpy as np
import motor
from ayuda import *

print('A) Orden de los extremos dentro de la vela (optimista-realista vs pesimista):')
for nombre in ('m1', 'm5'):
    S, ctx = serie_y_contexto(nombre)
    for kw in ({}, dict(slk=0.5, slmin=15, slmax=60, tpk=0.5, tpmin=15, tpmax=60)):
        a = motor.correr(S, motor.params(**kw), ctx)
        b = motor.correr(S, motor.params(pess=True, **kw), ctx)
        dif = sum(1 for x, y in zip(a, b) if (x['k'], x['motivo']) != (y['k'], y['motivo'])) if len(a) == len(b) else -1
        print('   %s %-22s intrabarra normal: n=%3d R=%+.3f | pesimista: n=%3d R=%+.3f | operaciones distintas: %s' % (
            nombre.upper(), 'stop/TP del manual' if not kw else 'stop/TP de 15-60 pips', len(a), R_de(a).mean(), len(b), R_de(b).mean(), dif))

print('\nB) Costos que suelen olvidarse (M5, manual):')
S, ctx = serie_y_contexto('m5')
for nom, kw in (('sin costos extra', {}), ('spread x2 (0.54)', None), ('comisión 7 USD/lote', dict(comm=7.0)), ('deslizamiento 1 pip', dict(slip=1.0)), ('deslizamiento 3 pips', dict(slip=3.0)), ('comisión 7 + desliz. 1 pip', dict(comm=7.0, slip=1.0))):
    if kw is None:
        S2 = motor.Serie(S.t, S.o, S.h, S.l, S.c, S.sp * 2, S.bm); ops = motor.correr(S2, motor.params())
    else:
        ops = motor.correr(S, motor.params(**kw), ctx)
    print('   %-28s n=%3d  R medio %+.3f  USD %+7.0f' % (nom, len(ops), R_de(ops).mean(), sum(t['usd'] for t in ops)))

print('\nC) La regla tramposa: entrar solo si la vela SIGUIENTE cierra a favor (información del futuro):')
for nombre in ('m1', 'm5'):
    S, ctx = serie_y_contexto(nombre)
    X = motor.contexto(S, ctx)
    P = motor.params(modo='zona', dema=40)           # muchas señales para que la prueba sea clara
    ci, cs, ca = motor.escanear(S, X, P)
    honesto = motor.correr(S, P, ctx, (ci, cs, ca))
    fut = (S.c[ci + 1] - S.o[ci + 1]) * cs > 0       # la vela i+1 cierra a favor de la operación
    tramposo = motor.correr(S, P, ctx, (ci[fut], cs[fut], ca[fut]))
    print('   %s señales honestas: n=%3d R=%+.3f | con vela siguiente a favor (trampa): n=%3d R=%+.3f' % (nombre.upper(), len(honesto), R_de(honesto).mean(), len(tramposo), R_de(tramposo).mean()))
print('   Moraleja: una fuga mínima de información (un solo bit del futuro) convierte una estrategia sin ventaja en una «genial».')
