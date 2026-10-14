# Reglas de plasticidad: Hebb explota, Oja aprende la componente principal, STDP depende del orden
import numpy as np

rng = np.random.default_rng(4)
# Entradas correlacionadas: dos neuronas presinápticas cuya actividad varía junta (correlación 0,6)
C = np.array([[1.0, 0.3], [0.3, 0.25]])            # covarianza (desviaciones 1 y 0,5)
X = rng.multivariate_normal([0, 0], C, size=20000)

def entrenar(regla, eta=0.002):
    w = np.array([0.3, -0.8])
    for x in X:
        y = w @ x                                    # actividad postsináptica
        if regla == "hebb":
            w = w + eta * y * x                      # Hebb puro: Δw = η·y·x
        else:
            w = w + eta * y * (x - y * w)            # Oja: Hebb con un término de olvido
        if not np.all(np.isfinite(w)) or np.linalg.norm(w) > 1e6:
            return w, "diverge"
    return w, "converge"

valores, vectores = np.linalg.eigh(C)
v1 = vectores[:, np.argmax(valores)]
print("Vector propio principal de la covarianza (NumPy):", np.round(v1 * np.sign(v1[0]), 4))
for regla in ("hebb", "oja"):
    w, estado = entrenar(regla)
    coseno = abs(w @ v1) / np.linalg.norm(w)
    print(f"{regla:5s}: {estado:9s} w = {np.round(w, 4)}  |w| = {np.linalg.norm(w):.4g}  coseno con v1 = {coseno:.5f}")

# STDP: 60 emparejamientos con desfase Δt = t_post − t_pre, límites suaves
def stdp(dt, Ap=0.8, Am=0.35, tp=17.0, tm=34.0):
    return Ap * np.exp(-dt / tp) if dt > 0 else -Am * np.exp(dt / tm)
print("\nSTDP tras 60 pares (Δt en ms):")
for dt in (-40, -20, -10, -5, 5, 10, 20, 40):
    w = 1.0
    for _ in range(60):
        d = stdp(dt)
        w += 0.012 * d * ((3 - w) if d > 0 else w)
    print(f"  Δt = {dt:+4d} ms   cambio de peso = {100 * (w - 1):+5.0f} %")
