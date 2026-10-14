# Modelo de Hodgkin y Huxley (1952): el potencial de acción con cuatro ecuaciones diferenciales
import numpy as np
from scipy.integrate import solve_ivp

C, gNa, gK, gL = 1.0, 120.0, 36.0, 0.3          # µF/cm², mS/cm²
ENa, EK, EL = 50.0, -77.0, -54.387              # mV

# Tasas de apertura (alfa) y cierre (beta) de las compuertas m, h, n, en 1/ms
def am(V): return 0.1 * (V + 40) / (1 - np.exp(-(V + 40) / 10))
def bm(V): return 4 * np.exp(-(V + 65) / 18)
def ah(V): return 0.07 * np.exp(-(V + 65) / 20)
def bh(V): return 1 / (1 + np.exp(-(V + 35) / 10))
def an(V): return 0.01 * (V + 55) / (1 - np.exp(-(V + 55) / 10))
def bn(V): return 0.125 * np.exp(-(V + 65) / 80)

def hh(t, y, I):
    V, m, h, n = y
    INa = gNa * m**3 * h * (V - ENa)            # corriente de sodio (entra y despolariza)
    IK = gK * n**4 * (V - EK)                   # corriente de potasio (sale y repolariza)
    IL = gL * (V - EL)                          # corriente de fuga
    return [(I(t) - INa - IK - IL) / C,
            am(V) * (1 - m) - bm(V) * m,
            ah(V) * (1 - h) - bh(V) * h,
            an(V) * (1 - n) - bn(V) * n]

V0 = -65.0
y0 = [V0, am(V0) / (am(V0) + bm(V0)), ah(V0) / (ah(V0) + bh(V0)), an(V0) / (an(V0) + bn(V0))]
print(f"Reposo: V = {V0} mV, m = {y0[1]:.3f}, h = {y0[2]:.3f}, n = {y0[3]:.3f}")

def simular(I, T):
    cruce = lambda t, y, I: y[0]                # evento: V cruza 0 mV hacia arriba
    cruce.direction = 1
    return solve_ivp(hh, (0, T), y0, args=(I,), max_step=0.02, rtol=1e-8, atol=1e-8, events=cruce)

# 1) Todo o nada: pulsos de 1 ms de intensidad creciente
print("\nPulso de 1 ms (desde t = 5 ms):")
for amp in [2, 4, 6, 8, 10, 20, 40]:
    s = simular(lambda t: amp if 5 <= t < 6 else 0.0, 40)
    vmax = s.y[0].max()
    print(f"  {amp:3d} µA/cm²   V máximo = {vmax:6.1f} mV   {'espiga' if len(s.t_events[0]) else 'sin espiga'}")

# 2) Corriente constante: frecuencia de disparo
print("\nCorriente constante durante 500 ms:")
for I0 in [5, 6, 6.5, 8, 10, 20, 50]:
    s = simular(lambda t: I0, 500)
    sp = s.t_events[0]
    sp = sp[sp > 100]                           # descartar el transitorio inicial
    f = 1000 * (len(sp) - 1) / (sp[-1] - sp[0]) if len(sp) > 1 else 0.0
    print(f"  I = {I0:5.1f} µA/cm²   {f:6.1f} espigas por segundo")

# 3) Periodo refractario: segundo pulso igual al primero, cada vez más cerca
print("\nDos pulsos de 1 ms y 20 µA/cm² separados Δt:")
for dt in [3, 5, 8, 12, 16, 20]:
    s = simular(lambda t: 20.0 if (5 <= t < 6 or 5 + dt <= t < 6 + dt) else 0.0, 60)
    print(f"  Δt = {dt:2d} ms   espigas: {len(s.t_events[0])}")
