# -*- coding: utf-8 -*-
"""Cifras de los capítulos 22–28 (proyectos de física y de aplicación)."""
g0 = 9.777
def agm(a, b):
    for _ in range(40): a, b = (a+b)/2, math.sqrt(a*b)
    return a
def T(L, deg): return 2*math.pi*math.sqrt(L/g0)/agm(1, math.cos(math.radians(deg)/2))

# ---------- 22 · gravedad con fotopuertas ----------
chk(22, 'caída 50 cm: t = √(2d/g)', math.sqrt(2*0.5/g0), '0.3198')
chk(22, 'error de 1 ms en t → error de g (%)', 2*0.001/math.sqrt(2*0.5/g0)*100, '0.6')
chk(22, 'caída 30 cm', math.sqrt(2*0.3/g0), '0.2477')
chk(22, 'caída 80 cm', math.sqrt(2*0.8/g0), '0.4045')
chk(22, 'P1: g = 2d/t² con 1.00 m y 0.452 s', 2*1.00/0.452**2, '9.789')
chk(22, 'P2: t para 0.80 m', math.sqrt(1.6/g0), '0.4045')
t = math.sqrt(2*0.5/g0)
chk(22, 'P3: Δd/d (%)', 1/500*100, '0.2')
chk(22, 'P3: 2Δt/t (%)', 2*0.0002/0.3198*100, '0.125')
chk(22, 'P3: suma (%)', (1/500 + 2*0.0002/0.3198)*100, '0.325')
chk(22, 'P4: v = g t (m/s)', g0*0.3198, '3.127')
chk(22, 'P4: tiempo de bloqueo con 2 cm (ms)', 0.020/(g0*0.3198)*1000, '6.4')

# ---------- 23 · péndulo ----------
chk(23, 'T0 con L = 0.50 m', 2*math.pi*math.sqrt(0.5/g0), '1.4209')
chk(23, 'T0 con L = 1.00 m', 2*math.pi*math.sqrt(1.0/g0), '2.0094')
for a, r in ((5, '1.0005'), (20, '1.0077'), (40, '1.0313'), (60, '1.0732'), (80, '1.1375')):
    chk(23, f'T/T0 con {a}° (exacto)', T(1, a)/T(1, 1e-6), r)
chk(23, 'T exacto 20°, L = 0.5 m', T(0.5, 20), '1.4318')
chk(23, 'T exacto 60°, L = 0.5 m', T(0.5, 60), '1.5249')
chk(23, 'g calculado con ángulos pequeños a 20°', g0/ (T(0.5, 20)/T(0.5, 1e-6))**2, '9.63')
chk(23, 'g calculado con ángulos pequeños a 60°', g0/ (T(0.5, 60)/T(0.5, 1e-6))**2, '8.49')
chk(23, 'P1: T de 0.80 m', 2*math.pi*math.sqrt(0.8/g0), '1.80')
chk(23, 'P1: L/g', 0.8/g0, '0.08182')
chk(23, 'P2: L con T = 1.40 s', g0*1.40**2/(4*math.pi**2), '0.4854')
chk(23, 'P3: T real a 60°, L = 1 m', T(1.0, 60), '2.1565')
chk(23, 'P3: g calculado con la fórmula de ángulos pequeños', 4*math.pi**2*1.0/T(1.0, 60)**2, '8.49')
chk(23, 'P3: razón 1/1.0732²', 1/1.0732**2, '0.868')
chk(23, 'P4: 1 − cos 20°', 1-math.cos(math.radians(20)), '0.0603')
v = math.sqrt(2*g0*0.5*(1-math.cos(math.radians(20))))
chk(23, 'P4: velocidad en el punto más bajo', v, '0.768')
chk(23, 'P4: tiempo de bloqueo (ms)', 0.012/v*1000, '15.6')

# ---------- 24 · enfriamiento ----------
for k, tm in ((0.001, '11.6'), (0.0006, '19.3'), (0.0001, '115.5')):
    chk(24, f'vida media con k = {k}', math.log(2)/k/60, tm)
chk(24, 'T a 3600 s con k = 0.001', 20+60*math.exp(-3.6), '21.6')
chk(24, 'T a 3600 s con k = 0.0001', 20+60*math.exp(-0.36), '61.9')
chk(24, 'P1: T a 10 min', 20+60*math.exp(-0.6), '52.9')
chk(24, 'P1: e^-0.6', math.exp(-0.6), '0.5488')
chk(24, 'P2: t hasta 40 °C con k = 0.0006 (s)', math.log(3)/0.0006, '1831', tol=1e-3)
chk(24, 'P2: en minutos', math.log(3)/0.0006/60, '30.5')
chk(24, 'P3: ln(60/29.2)', math.log(60/29.2), '0.7202')
chk(24, 'P3: k (1e-4 s⁻¹)', math.log(60/29.2)/1200*1e4, '6.0')
chk(24, 'P3: vida media (s)', math.log(2)/0.0006, '1155', tol=1e-3)
chk(24, 'P4: escalón del ADC (mV)', 5000/1024, '4.88')
chk(24, 'P4: escalón en °C', 5000/1024/10, '0.488')
chk(24, 'P4: error relativo con 2 °C (%)', 0.488/2*100, '24')
chk(24, 'P4: escalón con 1.1 V (mV)', 1100/1024, '1.07')
chk(24, 'P4: escalón con 1.1 V (°C)', 1100/1024/10, '0.107')

# ---------- 25 · velocidad del sonido ----------
for Tc, vv in ((20, '343.4'), (0, '331.3'), (40, '355.5'), (35, '352.5'), (30, '349.5')):
    chk(25, f'v a {Tc} °C', 331.3+0.606*Tc, vv)
chk(25, 'P1: t para 2 m ida y vuelta (µs)', 4.0/343.4*1e6, '11648')
chk(25, 'P3: pendiente (µs/cm)', (17450-2915)/250, '58.14')
chk(25, 'P3: v (m/s)', 2/((17450-2915)/250*1e-4), '344.0')
chk(25, 'P4: Δd mínimo (mm)', 343.4*4e-6/2*1000, '0.69')
chk(25, 'P4: error relativo a 1 m (%)', 4/5824*100, '0.07')
chk(25, 'tiempo a 1 m y 20 °C (µs)', 2/343.42*1e6, '5824', tol=1e-3)
chk(25, 'tiempo a 1 m y 40 °C (µs)', 2/355.54*1e6, '5625', tol=1e-3)
chk(25, 'sensor a 340 m/s en aire a 30 °C: error (%)', (1-340/349.48)*100, '2.7')

# ---------- 26 · alarma ----------
chk(26, 'P1: ciclos de parpadeo en 5 s', 5000/500, '10.0')
chk(26, 'P1: ciclos de sirena en 10 s', 10000/300, '33.3')
chk(26, 'P3: umbral alto del ATmega328P (V)', 0.6*5, '3.0')
chk(26, 'P3: margen (V)', 3.3-3.0, '0.3')

# ---------- 27 · estación ----------
chk(27, 'P2: consultas por día', 86400/10, '8640.0')
chk(27, 'P2: bytes por día', 8640*33, '285120.0')
chk(27, 'P2: longitud del texto JSON', len('{"temperatura":24.0,"humedad":60}'), '33.0')
chk(27, 'P3: duración con pantalla (h)', 2000/(100+23.5), '16.2')
chk(27, 'P3: duración sin pantalla (h)', 2000/100, '20.0')
chk(27, 'P3: pérdida (h)', 2000/100-2000/123.5, '3.8')
chk(27, 'P4: corriente por el pull-up (mA)', (5-3.6)/4700*1000, '0.30')

# ---------- 28 · proyecto final ----------
chk(28, 'P1: corriente con 220 Ω (mA)', (5-2.0)/220*1000, '13.6')
chk(28, 'P1: corriente con 22 Ω (mA)', (5-2.0)/22*1000, '136')
chk(28, 'P3: tensión en A0', 5*10/(10+10), '2.5')
chk(28, 'P3: lectura', 2.5/5*1023, '511.5', tol=1e-3)
def cdiv(a, b): return int(a/b)
chk(28, 'P3: map(511,0,1023,255,0) con división entera de C', cdiv(511*(0-255), 1023-0) + 255, '128.0')
chk(28, 'sin fallas: map(863,0,1023,255,0)', cdiv(863*(0-255), 1023) + 255, '40.0')
chk(28, 'sin fallas con 2 lux: map(142,0,1023,255,0)', cdiv(142*(0-255), 1023) + 255, '220.0')
