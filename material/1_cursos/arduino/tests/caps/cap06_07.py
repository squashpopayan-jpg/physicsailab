# -*- coding: utf-8 -*-
"""Cifras de los capítulos 6–7 (problemas)."""
# ---------- 6 ----------
chk(6, 'P1: R del LED verde (Ω)', 2.9/0.015, '193.3')
chk(6, 'P1: 180 Ω frente a 193.3 Ω (% menos)', (2.9/0.015-180)/(2.9/0.015)*100, '6.9')
chk(6, 'P1: 220 Ω frente a 193.3 Ω (% más)', (220-2.9/0.015)/(2.9/0.015)*100, '13.8')
chk(6, 'P1: corriente con 220 Ω (mA)', 2.9/220*1000, '13.2')
chk(6, 'P1: corriente con 180 Ω (mA)', 2.9/180*1000, '16.1')
chk(6, 'P2: corriente con 47 Ω + 6 Ω (mA)', (5-1.95)/53*1000, '57.5')
chk(6, 'P2: porcentaje del máximo (%)', 57.5/30*100, '192')
chk(6, 'P3: corriente de cortocircuito (A)', 9/1.75, '5.14')
chk(6, 'P3: potencia en la pila (W)', (9/1.75)**2*1.7, '45.0')
chk(6, 'P3: potencia en el cable (W)', (9/1.75)**2*0.05, '1.32')
chk(6, 'P5: 8 LED × 13.6 mA', 8*13.6, '108.8')
# ---------- 7 ----------
tau = 2200*470e-6
chk(7, 'P1: τ (s)', tau, '1.034')
chk(7, 'P1: tensión a 1 s (V)', 5*(1-math.exp(-1/tau)), '3.10')
chk(7, 'P1: porcentaje de la carga (%)', (1-math.exp(-1/tau))*100, '62')
chk(7, 'P2: R de base (Ω)', (3.3-0.7)/0.0015, '1733')
chk(7, 'P3: rizado media onda (V)', 0.1/(60*0.001), '1.67')
chk(7, 'P3: rizado onda completa (V)', 0.1/(120*0.001), '0.83')
chk(7, 'P4: corriente por R (mA)', (9-5.1)/330*1000, '11.8')
chk(7, 'P4: corriente que queda al Zener (mA)', (9-5.1)/330*1000-10, '1.8')
chk(7, 'P5: τ de descarga (s)', 1000*100e-6, '0.1')
chk(7, 'P5: tiempo hasta 1 V (s)', 0.1*math.log(5), '0.161')
chk(7, 'P5: energía (mJ)', 0.5*100e-6*25*1000, '1.25')
