# -*- coding: utf-8 -*-
"""Cifras de los capítulos 19–21 (problemas)."""
# ---------- 19 ----------
chk(19, 'P1: caracteres de una LCD 16×2', 16*2, '32')
chk(19, 'P2: direcciones de 7 bits', 2**7, '128')
chk(19, 'P2: direcciones utilizables', 2**7-8-8, '112')
chk(19, 'P4: ciclos de reloj de 2 bytes', 2*9, '18')
chk(19, 'P4: tiempo a 100 kHz (µs)', 18/100e3*1e6, '180')
chk(19, 'P4: transferencias de 2 bytes por segundo (≈ 5500)', 1/(180e-6), 5500, tol=0.02)
# ---------- 20 ----------
chk(20, 'P1: duración de un bit a 115200 (µs)', 1e6/115200, '8.68')
chk(20, 'P1: duración de un byte (µs)', 10e6/115200, '86.8')
chk(20, 'P1: bytes por segundo', 115200/10, '11520')
chk(20, 'P2: 67 en binario', int(bin(67)[2:]), '1000011')
chk(20, 'P2: 64+2+1', 64+2+1, '67')
chk(20, 'P3: bytes de la imagen', 128*64/8, '1024')
chk(20, 'P3: ciclos de reloj', 1024*9, '9216')
chk(20, 'P3: tiempo (ms)', 9216/400e3*1000, '23')
chk(20, 'P3: cuadros por segundo', 1/(9216/400e3), '43')
# ---------- 21 ----------
chk(21, 'P3: demanda (caracteres/s)', 10*20, '200')
chk(21, 'P3: capacidad (caracteres/s)', 115200/10, '11520')
chk(21, 'P3: fracción (%)', 200/11520*100, '1.7')
chk(21, 'P4: duración siempre activo (h)', 2000/200, '10')
chk(21, 'P4: consumo medio con sueño (mA)', 0.99*0.01+0.01*200, '2.01')
chk(21, 'P4: duración con sueño (h)', 2000/2.01, '995')
chk(21, 'P4: días', 2000/2.01/24, '41')
