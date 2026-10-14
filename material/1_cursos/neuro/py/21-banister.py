# Modelo de impulso-respuesta de Banister: forma = estado físico − fatiga, y la mejor puesta a punto
import numpy as np

tau1, tau2, k1, k2 = 42.0, 7.0, 1.0, 2.0          # días y pesos típicos del modelo (ilustrativos)

def banister(cargas):
    g = h = 0.0
    G, Hh, P = [0.0], [0.0], [0.0]
    for w in cargas:                                # la carga de un día cuenta desde el día siguiente
        g = (g + w) * np.exp(-1 / tau1)
        h = (h + w) * np.exp(-1 / tau2)
        G.append(g); Hh.append(h); P.append(k1 * g - k2 * h)
    return np.array(G), np.array(Hh), np.array(P)

semana = [1, 0.6, 1, 0, 1, 0.8, 0]                  # microciclo: días fuertes, suaves y de descanso
DIAS = 84                                            # la competencia es el día 84 (12 semanas)

def plan(dias_taper, fraccion):
    """Entrena normal hasta el día 84 − dias_taper; después, solo los días de entrenamiento al `fraccion` del volumen."""
    c = []
    for d in range(DIAS):
        f = semana[d % 7]
        if d >= DIAS - dias_taper:
            f = fraccion if f > 0 else 0
        c.append(400 * f)                            # 400 unidades = 60 min × RPE 6,7
    return c

_, _, P0 = banister(plan(0, 1))
print(f"Sin puesta a punto, forma el día {DIAS}: {P0[-1]:.0f}\n")
print("Forma el día de la competencia según la duración (filas) y el volumen (columnas) de la puesta a punto")
fracs = (0.8, 0.6, 0.4, 0.2, 0.0)
print("  días  " + "".join(f"{100 * f:7.0f} %" for f in fracs))
mejor = (P0[-1], 0, 1.0)
for d in (3, 7, 10, 14, 21, 28):
    fila = []
    for f in fracs:
        p = banister(plan(d, f))[2][-1]
        fila.append(p)
        if p > mejor[0]:
            mejor = (p, d, f)
    print(f"  {d:4d}  " + "".join(f"{p:9.0f}" for p in fila))
print(f"\nÓptimo de la tabla: {mejor[1]} días al {100 * mejor[2]:.0f} % del volumen "
      f"(+{100 * (mejor[0] / P0[-1] - 1):.0f} % de forma frente a no reducir).")
print("Con τ_fatiga = 7 días, una puesta a punto larga hace perder más estado físico del que se gana al quitar fatiga.")

# ¿Y si la fatiga tarda más en irse? El óptimo depende de los parámetros de cada persona
for t2 in (7.0, 12.0, 15.0):
    tau2 = t2
    P0 = banister(plan(0, 1))[2][-1]
    res = max(((banister(plan(d, f))[2][-1], d, f) for d in range(1, 29) for f in np.arange(0, 1.01, 0.1)))
    print(f"τ_fatiga = {t2:4.0f} días → mejor puesta a punto: {res[1]:2d} días al {100 * res[2]:3.0f} % "
          f"(forma {res[0]:.0f} frente a {P0:.0f} sin reducir)")
