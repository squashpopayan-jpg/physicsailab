# La exposición no borra el miedo: crea un aprendizaje inhibitorio que depende del contexto
# Regla de Rescorla-Wagner con inhibición general (Ig) y propia de cada contexto (Ic)
import numpy as np

def exposicion(contextos=1, n_ext=24, a=0.3, ag=0.04, ac=0.2, dias=0, tau=20):
    V = 0.0
    for _ in range(12):                       # adquisición: estímulo + consecuencia aversiva
        V += a * (1 - V)
    Ig, Ic = 0.0, np.zeros(contextos)
    for i in range(n_ext):                    # exposición sin consecuencia, rotando contextos
        c = i % contextos
        p = V - Ig - Ic[c]                    # miedo esperado en este ensayo
        Ig += ag * p
        Ic[c] += ac * p
    f = np.exp(-dias / tau)                   # la inhibición se debilita con el tiempo
    fin = V - Ig - Ic[(n_ext - 1) % contextos]
    otro = V - Ig * f                         # contexto distinto (por ejemplo, la calle)
    mismo = V - (Ig + Ic[(n_ext - 1) % contextos]) * f
    return fin, mismo, otro

print("Miedo (0 a 1) después de 24 ensayos de exposición")
print("contextos   al final de la sesión   mismo lugar, 14 días   otro lugar, 14 días")
for k in (1, 2, 3, 4, 6):
    fin, mismo, otro = exposicion(k, dias=14)
    print(f"   {k}              {fin:5.2f}                  {mismo:5.2f}                  {otro:5.2f}")
print("\nExponerse en varios contextos hace que el miedo baje más despacio durante las sesiones,")
print("pero deja un aprendizaje que se generaliza mejor: el miedo vuelve menos fuera del consultorio.")
