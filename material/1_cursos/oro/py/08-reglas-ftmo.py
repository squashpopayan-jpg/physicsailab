# 08-reglas-ftmo.py — Los límites de la firma frente al riesgo del manual: qué restricción es la que manda
import numpy as np
from ayuda import *

cuenta = 100000.0
print('Reglas del reto de 2 pasos (cuenta de 100 000 USD): pérdida diaria 5 %% = %.0f USD, pérdida total 10 %% = %.0f USD' % (0.05 * cuenta, 0.10 * cuenta))
print('Piso diario del bot: B0(d) - 4 500 (colchón de 500). Piso total del bot: 91 000 (colchón de 1 000).\n')

for riesgo_pct in (0.00125, 0.0025, 0.005, 0.01, 0.02):
    r = cuenta * riesgo_pct
    print('Riesgo %.3f %% = %5.0f USD por operación:' % (100 * riesgo_pct, r), end=' ')
    print('stops seguidos para tocar el límite diario (5 %%): %5.1f | para el límite total (10 %%): %5.1f' % (0.05 * cuenta / r, 0.10 * cuenta / r))

print('\nPérdida diaria máxima del manual: 2 balas x 125 = 250 USD = %.2f %% de la cuenta (el tope duro es -250).' % (100 * 250 / cuenta))
print('Para llegar al límite diario de la firma haría falta perder %.0f veces el tope diario del bot.' % (5000 / 250))

# Probabilidad de 80 stops seguidos (el límite total con riesgo 0.125 %): con acierto p
for p in (0.30, 0.40, 0.45):
    q = 1 - p
    print('   con acierto %.0f %%: P(80 pérdidas seguidas en una secuencia dada) = %.2e' % (100 * p, q ** 80))

# Tiempo para alcanzar la meta de 10 % con distintas ventajas (movimiento browniano con deriva, sin límites de pérdida)
print('\nOperaciones necesarias para ganar el 10 %% (10 000 USD) con riesgo 125 USD, según la esperanza por operación:')
for e in (0.02, 0.05, 0.10, 0.20, 0.30):
    n = 10000 / (125 * e)
    print('   E = %+.2f R  ->  %6.0f operaciones  (%5.0f días hábiles a 0.8 operaciones/día)' % (e, n, n / 0.8))
