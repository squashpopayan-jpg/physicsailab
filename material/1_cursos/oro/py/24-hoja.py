# 24-hoja.py — Hoja de estrategia: manual v1.3 frente a la región candidata, con todas las pruebas de robustez
import numpy as np
import motor
from ayuda import *

CAND = dict(slk=0.5, slmin=20, slmax=80, tpk=2.5, tpmin=100, tpmax=300, sld=False, beratio=0.2, bemargin=5, stag=False)
CONFIGS = [('Manual v1.3 (tal cual)', {}), ('Candidata: stop corto, TP largo, solo break-even', CAND)]


def mitades(S, ctx_full):
    h = S.n // 2
    A = motor.Serie(S.t[:h], S.o[:h], S.h[:h], S.l[:h], S.c[:h], S.sp[:h], S.bm, 'A')
    B = motor.Serie(S.t[h:], S.o[h:], S.h[h:], S.l[h:], S.c[h:], S.sp[h:], S.bm, 'B')
    return A, B


for nombre in ('m5', 'm1', 'm15'):
    S, ctx = serie_y_contexto(nombre)
    full = ctx if ctx is not None else S
    print('=== %s' % nombre.upper())
    for nom, kw in CONFIGS:
        kw = dict(kw)
        if nombre == 'm15':
            kw['stagmin'] = 60
        P = motor.params(**kw)
        ops = motor.correr(S, P, ctx)
        print(linea(nom, ops))
        if nombre != 'm15':
            R = R_de(ops)
            nu = nulo(S, ctx, P, n_rep=100, semilla=24)
            A, B = mitades(S, full)
            ra = R_de(motor.correr(A, P, full)); rb = R_de(motor.correr(B, P, full))
            pes = R_de(motor.correr(S, motor.params(pess=True, **kw), ctx))
            cos = R_de(motor.correr(S, motor.params(comm=7.0, slip=1.0, **kw), ctx))
            print('      azar %+.3f (la señal supera al %.0f %% de las réplicas) | 1.ª mitad %+.3f (n=%d) | 2.ª mitad %+.3f (n=%d) | pesimista %+.3f | comisión 7 + desliz. 1 pip %+.3f' % (
                nu.mean(), 100 * (nu < R.mean()).mean(), ra.mean(), len(ra), rb.mean(), len(rb), pes.mean(), cos.mean()))
    print()

print('Operaciones a acumular en vivo para decidir (sd de R ~ 1.2 en la candidata por su payoff alto):')
for e in (0.30, 0.20, 0.10):
    print('   ventaja verdadera %+.2f R -> %5d operaciones' % (e, int(np.ceil(((1.96 + 0.84) * 1.2 / e) ** 2))))
