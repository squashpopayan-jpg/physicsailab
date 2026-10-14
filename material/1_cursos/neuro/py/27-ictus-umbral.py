# Rehabilitación del brazo tras un ictus: plasticidad que depende del uso y «no uso aprendido»
# Modelo inspirado en Han, Arbib y Schweighofer (2008): elegir el brazo afectado depende de cuánto
# se espera que funcione (aprendizaje por refuerzo); usarlo mejora su habilidad; no usarlo la deteriora.
import numpy as np

def paciente(forzado, dias_terapia=14, inicio=30, total=360, seed=0):
    rng = np.random.default_rng(seed)
    S = Q = 0.35                      # habilidad del brazo afectado y valor esperado al usarlo
    beta, alpha, eta, lam, oport, q_sano = 8, 0.05, 0.002, 0.004, 40, 0.9
    uso = []
    for d in range(total):
        terapia = inicio <= d < inicio + dias_terapia
        usos = 0
        for k in range(oport + (forzado if terapia else 0)):
            forz = k >= oport
            p = 1 / (1 + np.exp(-beta * (Q - q_sano)))
            if forz or rng.random() < p:
                r = rng.random() < S
                Q += alpha * (r - Q)
                S += eta * (1 - S)
                usos += not forz
        S *= 1 - lam
        uso.append(usos / oport)
    return S, np.mean(uso[-30:])

print("Usos forzados diarios del brazo afectado durante 14 días (terapia de restricción del lado sano)")
print("dosis   habilidad final (media)   uso espontáneo final   pacientes que recuperan el uso")
for f in (0, 10, 15, 20, 25, 30, 40, 80):
    res = np.array([paciente(f, seed=s) for s in range(30)])
    rec = np.mean(res[:, 1] > 0.3)
    print(f"{f:4d}         {res[:, 0].mean():.2f}                     {res[:, 1].mean():.2f}                  {100 * rec:3.0f} %")
print("\nPor debajo de cierta dosis el brazo vuelve a quedar sin uso y se deteriora; por encima, el uso")
print("espontáneo se mantiene solo y sigue mejorando la habilidad: un umbral, no una relación lineal.")
