# Adaptación motora con dos procesos (Smith, Ghazizadeh y Shadmehr, 2006):
# uno rápido que aprende mucho y olvida pronto, otro lento que aprende poco y retiene
import numpy as np

Ar, Br = 0.92, 0.10        # proceso rápido: retención y sensibilidad al error
Al, Bl = 0.996, 0.02       # proceso lento

def correr(perturbacion):
    xr = xl = 0.0
    salida, rap, len_ = [], [], []
    for f in perturbacion:
        x = xr + xl
        salida.append(x); rap.append(xr); len_.append(xl)
        e = 0.0 if f is None else f - x      # None = «pinza de error»: no hay error que corregir
        xr, xl = Ar * xr + Br * e, Al * xl + Bl * e
    return np.array(salida), np.array(rap), np.array(len_)

# Fase A: 200 ensayos con una perturbación (por ejemplo, un campo de fuerza) de tamaño 1.
# Fase B: perturbación opuesta hasta que la salida vuelve a cero. Fase C: 100 ensayos sin error.
pert = [1.0] * 200 + [-1.0] * 6 + [None] * 100
x, r, l = correr(pert)
print("Ensayo   salida   proceso rápido   proceso lento")
for n in (0, 10, 50, 199, 205, 210, 225, 245, 305):
    print(f"{n:6d}   {x[n]:+.3f}       {r[n]:+.3f}          {l[n]:+.3f}")
print(f"\nMáximo de la recuperación espontánea en la fase C: {x[206:].max():+.3f} (ensayo {206 + x[206:].argmax()})")

# Ahorro: reaprender la perturbación después de «desaprenderla» es más rápido
def ensayos_hasta(xs, umbral=0.6):
    return int(np.argmax(xs >= umbral))
primera = correr([1.0] * 100)[0]
segunda = correr([1.0] * 200 + [-1.0] * 6 + [1.0] * 100)[0][206:]
print(f"Ensayos para llegar al 60 %: primera vez {ensayos_hasta(primera)}, al reaprender {ensayos_hasta(segunda)}")
