# 02-horario.py — ¿Cuándo se mueve el oro? Perfil horario en 16 años y la ventana 08:57-13:00 de Madrid
import numpy as np
import motor
from ayuda import *

H = motor.cargar('h1')                                   # velas H1, enero 2010 - octubre 2026
t = H.t
off = motor.desfase_madrid(t)
hm = (((t + off * 60) // 60) % 24).astype(int)           # hora de Madrid al INICIO de cada vela H1
rng = H.h - H.l
sem = ((t + off * 60) // 1440 + 3) % 7
ok = sem < 5
print('Rango medio de una vela H1 por hora de Madrid (USD), toda la historia 2010-2026:')
prom = np.array([rng[ok & (hm == h)].mean() for h in range(24)])
for h in range(24):
    barra = '#' * int(round(prom[h] * 4))
    print('  %02d:00  %5.2f  %s' % (h, prom[h], barra))

# Porcentaje del rango diario total que cae dentro de [09:00, 13:00) de Madrid
dia = ((t + off * 60) // 1440).astype(int)
tot = {}; ven = {}
for i in np.flatnonzero(ok):
    tot[dia[i]] = tot.get(dia[i], 0) + rng[i]
    if 9 <= hm[i] < 13:
        ven[dia[i]] = ven.get(dia[i], 0) + rng[i]
fr = np.array([ven.get(d, 0) / tot[d] for d in tot if tot[d] > 0])
print('\nLa ventana 09:00-13:00 (4 de 24 horas = 16.7 %% del reloj) concentra el %.1f %% del rango acumulado diario' % (100 * fr.mean()))
print('La hora más movida es %02d:00 de Madrid (%.2f USD por vela H1); la ventana de entradas no incluye la apertura de Nueva York (14:30).' % (prom.argmax(), prom.max()))

# Por año: el rango de la ventana en USD y en % del precio
print('\nRango medio de vela H1 en la ventana, por año (USD y %% del precio):')
anio = (t // 525960 + 1970).astype(int)
for a in range(2010, 2027):
    m = ok & (hm >= 9) & (hm < 13) & (anio == a)
    if m.sum() > 100:
        print('   %d  %5.2f USD   %.3f %%   (precio medio %5.0f)' % (a, rng[m].mean(), 100 * (rng[m] / H.c[m]).mean(), H.c[m].mean()))
