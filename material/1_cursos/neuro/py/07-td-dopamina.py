# Diferencias temporales (TD): el error de predicción se desplaza de la recompensa a la señal que la anuncia
import numpy as np

T, tc, tr, gamma, alpha = 25, 5, 15, 0.98, 0.2     # pasos de un ensayo, clave, recompensa, descuento, tasa
w = np.zeros(T + 1)                                  # valor de "k pasos desde la clave" (compuesto serial)

def V(t):
    return w[t - tc] if tc <= t <= T else 0.0

def ensayo(recompensa=1.0, aprender=True):
    delta = np.zeros(T)
    for t in range(T):
        r = recompensa if t == tr else 0.0
        delta[t] = r + gamma * V(t + 1) - V(t)        # error de predicción, la "dopamina" del modelo
        if aprender and t >= tc:
            w[t - tc] += alpha * delta[t]
    return delta

def resumen(d):
    return f"en la clave (t={tc - 1}→{tc}): {d[tc - 1]:+.3f}   en la recompensa (t={tr}): {d[tr]:+.3f}"

print("Ensayo   error de predicción")
for n in range(1, 301):
    d = ensayo()
    if n in (1, 2, 5, 10, 25, 50, 100, 300):
        print(f"{n:5d}    {resumen(d)}")
print("\nAprendido: valor en la clave =", round(w[0], 4), "  teoría γ^(tr−tc) =", round(gamma ** (tr - tc), 4))
d = ensayo(recompensa=0.0, aprender=False)
print("Recompensa omitida:  ", resumen(d), "← caída por debajo de cero")
d = ensayo(recompensa=2.0, aprender=False)
print("Recompensa doble:    ", resumen(d), "← mejor de lo esperado")
