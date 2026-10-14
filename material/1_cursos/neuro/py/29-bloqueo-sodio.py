# Bloqueo de la conducción por un anestésico local en un axón de Hodgkin-Huxley (cable de 6 cm, 6,3 °C)
# El anestésico reduce la conductancia de sodio en un tramo del axón; ¿pasa el impulso?
import numpy as np

gNa, gK, gL, ENa, EK, EL, C = 120.0, 36.0, 0.3, 50.0, -77.0, -54.387, 1.0
a, Ri, dx, n = 0.0238, 35.4, 0.1, 60                     # radio (cm), resistividad (Ω·cm), compartimento (cm)
gc = 1000 * a / (2 * Ri * dx * dx)                       # acoplamiento axial, mS/cm²

def tasas(V):
    am = 0.1 * (V + 40) / (1 - np.exp(-(V + 40) / 10)); bm = 4 * np.exp(-(V + 65) / 18)
    ah = 0.07 * np.exp(-(V + 65) / 20);                 bh = 1 / (1 + np.exp(-(V + 35) / 10))
    an = 0.01 * (V + 55) / (1 - np.exp(-(V + 55) / 10)); bn = 0.125 * np.exp(-(V + 65) / 80)
    return am, bm, ah, bh, an, bn

def correr(fraccion, largo_cm, inicio=2.0, T=12.0, dt=0.005):
    V = np.full(n, -65.0)
    am, bm, ah, bh, an, bn = tasas(V)
    m, h, k = am / (am + bm), ah / (ah + bh), an / (an + bn)
    bloqueo = np.zeros(n)
    i0, i1 = int(round(inicio / dx)), int(round((inicio + largo_cm) / dx))
    bloqueo[i0:i1] = fraccion
    cruce = np.full(n, np.nan)
    t = 0.0
    while t < T:
        Vp = np.concatenate(([V[0]], V, [V[-1]]))
        Iax = gc * (Vp[:-2] - 2 * V + Vp[2:])
        Iion = gNa * (1 - bloqueo) * m**3 * h * (V - ENa) + gK * k**4 * (V - EK) + gL * (V - EL)
        Iext = np.zeros(n); Iext[0] = 200.0 if t < 0.5 else 0.0
        am, bm, ah, bh, an, bn = tasas(V)
        m += dt * (am * (1 - m) - bm * m); h += dt * (ah * (1 - h) - bh * h); k += dt * (an * (1 - k) - bn * k)
        Vn = V + dt * (Iax - Iion + Iext) / C
        nuevo = np.isnan(cruce) & (V < 0) & (Vn >= 0)
        cruce[nuevo] = t
        V, t = Vn, t + dt
    return cruce

c = correr(0, 0)
v = (35 - 15) * dx * 0.01 / ((c[35] - c[15]) * 1e-3)
print(f"Sin anestésico: velocidad de conducción {v:.2f} m/s; el impulso llega al final del axón a los {c[-1]:.2f} ms\n")
largos = (0.1, 0.3, 0.5, 1.0, 2.0)
print("fracción de canales de Na bloqueados  ·  largo del tramo bloqueado (cm)")
print("            " + "".join(f"{l:>9.1f}" for l in largos))
for f in (0.5, 0.7, 0.8, 0.85, 0.9, 1.0):
    fila = []
    for l in largos:
        c = correr(f, l)
        fila.append("   pasa  " if not np.isnan(c[-1]) else " bloquea ")
    print(f"   {100 * f:5.0f} %  " + "".join(fila))
print("\nUn tramo corto, aunque esté bloqueado por completo, puede ser saltado por la corriente que fluye por dentro")
print("del axón; un bloqueo parcial hace falta que sea profundo y lo bastante largo. Por eso la dosis y el lugar importan.")
