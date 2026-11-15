# 18-filtros.py — Horario, día de la semana, volatilidad y corte antes de las noticias de Nueva York
import numpy as np
import motor
from ayuda import *

S, ctx = serie_y_contexto('m5')
X = motor.contexto(S, ctx)
# Variante con más operaciones para poder mirar por hora y día: rechazo en la EMA20 (sin vela de rechazo)
KW = dict(modo='ema', maxdist=12, rechazo=False)
P = motor.params(**KW)
ops = motor.correr(S, P, ctx)
R = R_de(ops)
print('Variante «ema» sin rechazo en M5: %s\n' % linea('', ops).strip())
hora = np.array([X['mm'][t['i']] // 60 for t in ops]); sem = np.array([X['sem'][t['i']] for t in ops])
print('Por hora de entrada (Madrid):')
for h in range(9, 13):
    m = hora == h
    c = ic(R[m]); print('   %02d:00-%02d:59  n=%3d  R %+.3f ± %.3f' % (h, h, c['n'], c['media'], 1.96 * c['ee']))
print('Por día de la semana:')
for d, nom in enumerate(('lunes', 'martes', 'miércoles', 'jueves', 'viernes')):
    m = sem == d
    c = ic(R[m]); print('   %-10s n=%3d  R %+.3f ± %.3f' % (nom, c['n'], c['media'], 1.96 * c['ee']))
atr = np.array([X['atr14'][X['im'][t['i']]] / motor.PIP for t in ops])
q = np.quantile(atr, [1 / 3, 2 / 3])
print('Por tercil de volatilidad (ATR14 M15 al entrar: cortes %.0f y %.0f pips):' % tuple(q))
for nom, m in (('baja', atr <= q[0]), ('media', (atr > q[0]) & (atr <= q[1])), ('alta', atr > q[1])):
    c = ic(R[m]); print('   %-6s n=%3d  R %+.3f ± %.3f' % (nom, c['n'], c['media'], 1.96 * c['ee']))

print('\nVentana de entradas (Madrid) con el manual «tocar y rechazar» y con la variante «ema»:')
for nom, ws, we in (('08:57-13:00 (manual)', 537, 780), ('08:57-11:00', 537, 660), ('11:00-13:00', 660, 780), ('08:00-17:00', 480, 1020), ('14:30-19:00 (Nueva York)', 870, 1140), ('02:00-08:00 (Asia-Londres)', 120, 480)):
    a = motor.correr(S, motor.params(ws=ws, we=we), ctx)
    b = motor.correr(S, motor.params(ws=ws, we=we, **KW), ctx)
    ca = ic(R_de(a)); cb = ic(R_de(b))
    print('   %-28s manual n=%3d R %+.3f ± %.3f | ema n=%3d R %+.3f ± %.3f' % (nom, ca['n'], ca['media'], 1.96 * ca['ee'] if ca['n'] > 1 else float('nan'), cb['n'], cb['media'], 1.96 * cb['ee']))

print('\nCierre forzoso antes de las noticias de Nueva York (8:30 a. m. = 14:30 de Madrid) frente al cierre de las 20:00:')
for nom, ts in (('20:00 (manual)', 1200), ('14:20 (antes de datos de NY)', 860), ('13:00 (a la salida de la ventana)', 780)):
    a = motor.correr(S, motor.params(tstop=ts), ctx)
    c = ic(R_de(a)); print('   %-34s n=%3d  R %+.3f ± %.3f  motivos %s' % (nom, c['n'], c['media'], 1.96 * c['ee'], motor.resumen(a)['motivos']))
