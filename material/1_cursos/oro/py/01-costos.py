# 01-costos.py — pip, lote, spread y el costo de cada operación expresado en R
import numpy as np
import motor
from ayuda import *

S = motor.cargar('m1')                                   # M1 real de XAUUSD (26-jun a 7-oct de 2026)
X = motor.contexto(S, motor.cargar('m5'))
precio = S.c.mean()
print('Precio medio del periodo: %.0f USD/onza  ->  1 lote = 100 onzas = %.0f USD nocionales' % (precio, 100 * precio))
print('1 pip = 0.10 USD; 1 lote mueve 10 USD por pip; 0.01 lote mueve 0.10 USD por pip\n')

# 1) Spread observado en la ventana de entradas (08:57-13:00 de Madrid)
ven = (X['mm'] >= 537) & (X['mm'] < 780) & (X['sem'] < 5)
sp = S.sp[ven]
print('Spread en la ventana de Londres (USD): mediana %.2f  p10 %.2f  p90 %.2f  máx %.2f  (%d velas)' % (
    np.median(sp), *np.percentile(sp, [10, 90]), sp.max(), len(sp)))
print('Spread por hora de Madrid (mediana, USD):')
for h in range(9, 13):
    m = ven & (X['mm'] // 60 == h)
    print('   %02d:00  %.2f' % (h, np.median(S.sp[m])))

# 2) Costo por intento en R: c = (100*spread + comisión) / (100*D + comisión), con D = stop + spread
print('\nCosto fijo por intento en R (se paga en cada operación, gane o pierda):')
for slp in (30, 45, 55, 60, 90):
    D = slp * motor.PIP + 0.27
    print('   stop %3d pips (%.2f USD): spread 0.27 -> %.1f %% de R | con comisión 7 USD/lote -> %.1f %% de R' % (
        slp, slp * motor.PIP, 100 * (100 * 0.27) / (100 * D), 100 * (100 * 0.27 + 7) / (100 * D + 7)))

# 3) Tamaño de posición y margen (riesgo 125 USD, cuenta de 100 000, apalancamiento 1:100)
print('\nLote que arriesga 125 USD según el stop (más 0.27 de spread en el stop) y margen requerido a 1:100:')
for slp in (45, 55, 60):
    D = slp * motor.PIP + 0.27
    lots = np.floor(100 * 125 / (D * 100)) / 100
    print('   stop %d pips -> %.2f lotes | pérdida real al stop %.1f USD | margen %.0f USD (%.2f %% de la cuenta)' % (
        slp, lots, lots * D * 100, lots * 100 * precio / 100, 100 * lots * 100 * precio / 100 / 100000))
