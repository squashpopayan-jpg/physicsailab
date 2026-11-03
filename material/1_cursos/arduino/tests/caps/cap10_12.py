# -*- coding: utf-8 -*-
"""Cifras de los capítulos 10–12 (problemas)."""
def i16(x): return ((x + 32768) % 65536) - 32768
# ---------- 10 ----------
chk(10, 'P1: ciclo del semáforo (s)', 6+4+2, '12')
chk(10, 'P1: ciclos por minuto', 60/12, '5')
chk(10, 'P3: 30000 + 5000 con int de 16 bits', i16(35000), '-30536')
chk(10, 'P4: letra S (ms)', 3*(200+200), '1200')
chk(10, 'P4: letra O (ms)', 3*(600+200), '2400')
chk(10, 'P4: total SOS (ms)', 1200+2400+1200, '4800')
chk(10, 'P4: con pausas entre letras (s)', (4800+2*400)/1000, '5.6')
# ---------- 11 ----------
chk(11, 'P1: corriente de la pull-down (mA)', 5/10000*1000, '0.5')
chk(11, 'P1: potencia (mW)', 5*5/10000*1000, '2.5')
chk(11, 'P3: corriente de la pull-up interna (mA)', 5/35000*1000, '0.143')
chk(11, 'P4: lecturas durante un rebote de 5 ms', 5e-3/10e-6, '500')
# ---------- 12 ----------
chk(12, 'P1: 768 de 1023 a 5 V', 768*5/1023, '3.754')
chk(12, 'P2: map(300,0,1023,0,180) sin truncar', 300*180/1023, '52.8')
chk(12, 'P2: truncado', int(300*180/1023), '52')
chk(12, 'P3: ESP32 3000 de 4095 a 3.3 V', 3000*3.3/4095, '2.418')
chk(12, 'P4: tensión a 10 lux (V)', 5*10/(10+20), '1.667')
chk(12, 'P4: lectura a 10 lux', int(5*10/30/5*1024), '341')
chk(12, 'P4: tensión a 100 lux (V)', 5*10/(10+4), '3.571')
chk(12, 'P4: lectura a 100 lux', int(5*10/14/5*1024), '731')
