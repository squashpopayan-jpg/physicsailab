# 05-entradas.py — El embudo de filtros de la señal y qué pasa con la lectura literal del manual
import numpy as np
import motor
from ayuda import *


def embudo(nombre):
    S, ctx = serie_y_contexto(nombre)
    X = motor.contexto(S, ctx)
    bm = S.bm
    W1 = max(1, round(30 / bm)); W2 = max(1, round(120 / bm))
    H30 = motor.ext_previos(S.h, W1, True)
    H120 = motor.ext_previos(S.h, W2, True)
    o, h, l, c = S.o, S.h, S.l, S.c
    im, ih = X['im'], X['ih']
    okc = (im >= 20) & (ih >= 50)
    e20 = np.where(okc, X['ema20'][np.clip(im, 0, None)], np.nan)
    diff = np.where(okc, X['s']['c'][np.clip(ih, 0, None)] - X['ema50'][np.clip(ih, 0, None)], np.nan)
    baj = diff < -1.5
    idx = np.arange(S.n)
    pasos = []
    m = (idx > max(W1, W2)) & okc
    pasos.append(('todas las velas con historia', m))
    m = m & (X['mm'] >= 537) & (X['mm'] < 780) & (X['sem'] < 5); pasos.append(('dentro de la ventana 08:57-13:00', m))
    m = m & baj; pasos.append(('sesgo H4 bajista (banda 15 pips)', m))
    m = m & (h >= H30); pasos.append(('el máximo toca o supera H30', m))
    m = m & (c <= o); pasos.append(('vela de rechazo (cierra bajista)', m))
    m = m & (np.abs(H30 - c) <= 0.8); pasos.append(('cierre a menos de 8 pips de H30', m))
    m = m & (c > e20); pasos.append(('cierre sobre la EMA20 de M15', m))
    m = m & (c <= H120 + 2.0); pasos.append(('no más de 20 pips sobre H120', m))
    print('Embudo de la señal de VENTA en %s (%d velas):' % (nombre.upper(), S.n))
    prev = None
    for nom, mm in pasos:
        k = int(mm.sum())
        print('   %-38s %7d%s' % (nom, k, '' if prev is None or prev == 0 else '   (%.1f %% del paso anterior)' % (100 * k / prev)))
        prev = k
    # Lectura literal: C >= H30 con vela bajista (C < O)
    lit = (idx > max(W1, W2)) & (c >= H30) & (c < o) & (X['mm'] >= 537) & (X['mm'] < 780)
    print('   Lectura literal «C >= H30» junto con vela bajista (C < O), en la ventana: %d velas' % lit.sum())
    print()


embudo('m1'); embudo('m5')
for nombre, kw in (('m1', {}), ('m1', {'modo': 'zona', 'dema': 40}), ('m5', {}), ('m5', {'modo': 'zona', 'dema': 40})):
    S, ctx = serie_y_contexto(nombre)
    P = motor.params(**kw)
    X = motor.contexto(S, ctx)
    ci, cs, ca = motor.escanear(S, X, P)
    print('%s %-6s señales crudas: %4d (ventas %d, compras %d)' % (nombre, P['modo'], len(ci), (cs == -1).sum(), (cs == 1).sum()))
