# -*- coding: utf-8 -*-
"""Cifras de los capítulos 1–3 (problemas)."""
# ---------- 1 ----------
chk(1, 'P1: R del LED a 20 mA (Ω)', (5-2)/0.020, '150')
chk(1, 'P1: potencia (W)', 0.02**2*150, '0.06')
chk(1, 'P2: tolerancia 5 % de 10 kΩ (Ω)', 10000*0.05, '500')
chk(1, 'P3: corriente de 47 Ω a 5 V (mA)', 5/47*1000, '106.4')
chk(1, 'P3: potencia (W)', 5*5/47, '0.532')
chk(1, 'P3: veces el límite de ¼ W', 5*5/47/0.25, '2.13')
chk(1, 'P4: duración de 2000 mAh a 25 mA (h)', 2000/25, '80')
chk(1, 'P4: días', 80/24, '3.3')
chk(1, 'P5: R del motor (Ω)', 12/0.040, '300')
chk(1, 'P5: potencia (W)', 12*0.040, '0.48')
chk(1, 'P5: potencia en el arranque (W)', 12*0.2, '2.4')
chk(1, 'P5: resistencia equivalente en el arranque (Ω)', 12/0.2, '60')
# ---------- 2 ----------
chk(2, 'P2: 104 = 100 nF (pF)', 10*10**4, '100000')
T, T25, beta = 323.15, 298.15, 3950
chk(2, 'P3: 1/T', 1/T, '0.0030945')
chk(2, 'P3: 1/T25', 1/T25, '0.0033540')
chk(2, 'P3: exponente', beta*(1/T-1/T25), '-1.0249')
chk(2, 'P3: R a 50 °C (kΩ)', 10*math.exp(beta*(1/T-1/T25)), '3.59')
chk(2, 'P4: tensión en A0 (V)', 5*10/20, '2.5')
chk(2, 'P4: lectura', 2.5/5*1024, '512')
# ---------- 3 ----------
chk(3, 'P1: puntos de la protoboard', 63*10 + 4*50, '830')
chk(3, 'P1: columnas 63×10', 63*10, '630')
chk(3, 'P1: rieles 4×50', 4*50, '200')
chk(3, 'P5: corriente con el LED cortocircuitado (mA)', 9/470*1000, '19.1')
chk(3, 'P5: potencia (W)', 81/470, '0.172')
chk(3, 'P5: fracción de ¼ W (%)', 81/470/0.25*100, '69')
chk(3, 'P5: con 100 Ω (W)', 81/100, '0.81')
