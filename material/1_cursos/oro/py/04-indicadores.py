# 04-indicadores.py — Sesgo H4 con banda neutra, ATR14 M15 y qué tan seguido se activan los topes del stop y del TP
import numpy as np
import motor
from ayuda import *

S = motor.cargar('m5')
X = motor.contexto(S)
im, ih = X['im'], X['ih']
ok = (im >= 20) & (ih >= 50)
diff = np.where(ok, X['s']['c'][np.clip(ih, 0, None)] - X['ema50'][np.clip(ih, 0, None)], np.nan)
print('Sesgo H4 en M5 (17 meses), porcentaje del tiempo según la banda neutra (USD = pips x 0.10):')
for banda in (0, 15, 50, 100, 200, 400):
    b = banda * 0.1
    v = diff[ok]
    print('  banda %3d pips (%.1f USD): bajista %4.1f %% | neutro %4.1f %% | alcista %4.1f %%' % (
        banda, b, 100 * (v < -b).mean(), 100 * (np.abs(v) <= b).mean(), 100 * (v > b).mean()))
print('  |cierre H4 - EMA50| mediano: %.1f USD (%.0f pips)' % (np.nanmedian(np.abs(diff)), np.nanmedian(np.abs(diff)) * 10))

atr = X['atr14'][np.clip(im, 0, None)][ok & (X['mm'] >= 537) & (X['mm'] < 780) & (X['sem'] < 5)] / motor.PIP
print('\nATR14 de M15 en la ventana de Londres (pips): mediana %.0f  p10 %.0f  p90 %.0f  máx %.0f' % (np.median(atr), *np.percentile(atr, [10, 90]), atr.max()))
sl = np.clip(0.8 * atr, 45, 60); tp = np.clip(1.4 * atr, 80, 100)
print('Stop = 0.8 x ATR acotado a [45, 60]: queda en el piso 45 el %.0f %% del tiempo, en el techo 60 el %.0f %%, libre el %.0f %%' % (
    100 * (0.8 * atr <= 45).mean(), 100 * (0.8 * atr >= 60).mean(), 100 * ((0.8 * atr > 45) & (0.8 * atr < 60)).mean()))
print('TP = 1.4 x ATR acotado a [80, 100]: piso 80 el %.0f %%, techo 100 el %.0f %%' % (100 * (1.4 * atr <= 80).mean(), 100 * (1.4 * atr >= 100).mean()))
print('Razón TP/SL resultante: mediana %.2f, p10 %.2f, p90 %.2f' % (np.median(tp / sl), *np.percentile(tp / sl, [10, 90])))

# Sesgo en 16 años de H1 -> H4
H = motor.cargar('h1')
f4 = motor.remuestrear(H, 240)
e50 = motor.ema(f4['c'], 50)
d4 = (f4['c'] - e50)[50:]
print('\nEn 16 años (H1 -> H4, %d velas H4), con banda de 15 pips: bajista %.1f %%, neutro %.1f %%, alcista %.1f %%' % (
    len(d4), 100 * (d4 < -1.5).mean(), 100 * (np.abs(d4) <= 1.5).mean(), 100 * (d4 > 1.5).mean()))
rach = np.diff(np.flatnonzero(np.diff(np.sign(d4)) != 0))
print('Persistencia: las rachas de sesgo duran en mediana %d velas H4 (%.1f días)' % (np.median(rach), np.median(rach) * 4 / 24))
