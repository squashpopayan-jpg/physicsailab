# -*- coding: utf-8 -*-
"""Cifras de los capítulos 8–9 (problemas)."""
# ---------- 8 ----------
chk(8, 'P1: paso del ADC del UNO (mV)', 5000/1024, '4.88')
chk(8, 'P1: paso del ADC del ESP32 (mV)', 3300/4096, '0.81')
chk(8, 'P1: cuántas veces más fino', (5000/1024)/(3300/4096), 6.0, tol=0.02)
chk(8, 'P2: LED a 15 mA con 200 mA', 200/15, '13.3')
chk(8, 'P3: divisor 2.2k/3.3k (V)', 5*3.3/5.5, '3.0')
chk(8, 'P3: nivel alto del ESP32 (V)', 0.75*3.3, '2.475')
chk(8, 'P4: umbral alto del UNO (V)', 0.6*5, '3.0')
chk(8, 'P4: margen (V)', 3.3-3.0, '0.3')
# ---------- 9 ----------
chk(9, 'P1: frecuencia 2 s + 1 s (Hz)', 1/3, '0.333')
chk(9, 'P3: periodo a 5 Hz (ms)', 1000/5, '200')
chk(9, 'P4: corriente del LED en el ESP32 (mA)', (3.3-1.9)/(330+30+6)*1000, '3.8')
chk(9, 'P4: porcentaje de su luz (%)', 3.8/20*100, '19', tol=0.06)
