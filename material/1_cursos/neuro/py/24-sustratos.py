# Calorimetría indirecta: grasa y carbohidrato oxidados según la intensidad (ecuaciones de Frayn y de Weir)
import numpy as np

def rer_tipico(x, entrenado=0.0):
    """Cociente respiratorio ilustrativo: 0,80 en reposo, sube con la intensidad (concepto de cruce)."""
    return np.minimum(1.0, 0.8 + (0.2 - 0.03 * entrenado) * (np.maximum(0, x - 0.1) / 0.85) ** (1.6 - 0.25 * entrenado))

def oxidacion(vo2, vco2):
    grasa = np.maximum(0, 1.67 * vo2 - 1.67 * vco2)      # g/min (Frayn, 1983)
    cho = np.maximum(0, 4.55 * vco2 - 3.21 * vo2)        # g/min
    kcal = 3.941 * vo2 + 1.106 * vco2                     # kcal/min (Weir, 1949, sin nitrógeno)
    return grasa, cho, kcal

VO2MAX = 3.0                                              # L/min (por ejemplo, 40 mL/kg/min con 75 kg)
x = np.linspace(0.25, 0.95, 701)
vo2 = VO2MAX * x
grasa, cho, kcal = oxidacion(vo2, vo2 * rer_tipico(x))
i = int(np.argmax(grasa))
print(f"FatMax en esta curva: {100 * x[i]:.0f} % del VO2máx, {grasa[i]:.2f} g de grasa por minuto")
print(f"Por encima de {100 * x[np.argmax((x > x[i]) & (grasa < 0.05))]:.0f} % del VO2máx la grasa oxidada es casi cero\n")

print("Sesión                         kcal   grasa (g)   carbohidrato (g)   % de energía de la grasa")
for nombre, xi, mins in (("60 min suave (45 %)", 0.45, 60), ("60 min moderado (64 %)", 0.64, 60),
                         ("30 min intenso (80 %)", 0.80, 30), ("60 min intenso (80 %)", 0.80, 60)):
    v = VO2MAX * xi
    g, c, k = oxidacion(v, v * rer_tipico(xi))
    print(f"{nombre:28s} {k * mins:6.0f}   {g * mins:8.1f}   {c * mins:13.1f}        {100 * 9.4 * g / k:5.0f} %")

print("\nUna sesión «quema» como mucho unos 30 a 40 g de grasa. Lo que decide la pérdida de grasa es el balance")
print("de energía de días y semanas: la grasa que no se oxida en el ejercicio se oxida en reposo si hay déficit.")
