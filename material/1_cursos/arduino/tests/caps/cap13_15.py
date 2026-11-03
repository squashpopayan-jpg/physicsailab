# -*- coding: utf-8 -*-
"""Cifras de los capítulos 13–15 (problemas)."""
# ---------- 13 ----------
chk(13, 'P1: ciclo de trabajo de 191/255 (%)', 191/255*100, '74.9')
chk(13, 'P1: tensión media (V)', 5*191/255, '3.75')
chk(13, 'P2: periodo a 490 Hz (ms)', 1000/490, '2.04')
chk(13, 'P2: tiempo en alto al 30 % (ms)', 0.3*1000/490, '0.61')
chk(13, 'P3: ángulo del servo con 1700 µs', 180*(1700-544)/(2400-544), '112.1')
chk(13, 'P4: ciclos de 440 Hz en 0.5 s', 440*0.5, '220')
chk(13, 'P4: periodo del do (ms)', 1000/262, '3.82')
chk(13, 'P4: periodo del sol (ms)', 1000/392, '2.55')
chk(13, 'P4: razón sol/do', 392/262, '1.496')
# ---------- 14 ----------
chk(14, 'P1: bits de 19 caracteres', 19*10, '190')
chk(14, 'P1: tiempo a 9600 baudios (ms)', 190/9600*1000, '19.8')
chk(14, 'P2: 10 en binario', int(bin(10)[2:]), '1010')
chk(14, 'P3: salida del filtro con n = 5', 100*(1-0.9**5), '40.95')
chk(14, 'P3: salida del filtro con n = 20', 100*(1-0.9**20), '87.84')
chk(14, 'P3: 0.9^5', 0.9**5, '0.5905')
chk(14, 'P3: 0.9^20', 0.9**20, '0.1216')
chk(14, 'P4: capacidad (caracteres/s)', 9600/10, '960')
chk(14, 'P4: demanda (caracteres/s)', 10/0.005, '2000')
# ---------- 15 ----------
chk(15, 'P1: días hasta el desbordamiento de millis()', 2**32/(1000*86400), '49.7')
chk(15, 'P2: frecuencia de parpadeo (Hz)', 1/0.5, '2')
chk(15, 'P3: ahora − ultimo con unsigned long', (200-4294967000) % 2**32, '496')
chk(15, 'P3: 2^32', 2**32, '4294967296')
chk(15, 'P4: probabilidad de detección (%)', 150/1000*100, '15')
