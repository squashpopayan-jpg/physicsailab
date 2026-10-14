# Del perceptrón (1958) a la retropropagación (1986): por qué una neurona no resuelve XOR y dos capas sí
import numpy as np

X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
tablas = {"AND": [0, 0, 0, 1], "OR": [0, 1, 1, 1], "XOR": [0, 1, 1, 0]}

def perceptron(y, epocas=100, eta=0.1):
    w, b = np.zeros(2), 0.0
    for e in range(1, epocas + 1):
        errores = 0
        for xi, yi in zip(X, y):
            salida = 1 if w @ xi + b > 0 else 0
            if salida != yi:                      # regla del perceptrón: corrige solo cuando se equivoca
                w += eta * (yi - salida) * xi
                b += eta * (yi - salida)
                errores += 1
        if errores == 0:
            return w, b, e, True
    return w, b, epocas, False

print("Perceptrón de una neurona:")
for nombre, y in tablas.items():
    w, b, e, ok = perceptron(np.array(y))
    estado = f"aprendió en {e} épocas, w = {np.round(w, 2)}, b = {b:.1f}" if ok else f"no converge en {e} épocas"
    print(f"  {nombre:3s}: {estado}")

# Red de dos capas (2-3-1) con sigmoides, entrenada por retropropagación del error
rng = np.random.default_rng(8)
sig = lambda z: 1 / (1 + np.exp(-z))
W1, b1 = rng.normal(0, 1, (2, 3)), np.zeros(3)
W2, b2 = rng.normal(0, 1, (3, 1)), np.zeros(1)
y = np.array(tablas["XOR"], float).reshape(-1, 1)
eta = 1.0
print("\nRed 2-3-1 con retropropagación, problema XOR:")
for epoca in range(1, 5001):
    h = sig(X @ W1 + b1)                          # capa oculta
    out = sig(h @ W2 + b2)                        # salida
    error = out - y
    perdida = float(np.mean(error ** 2))
    d2 = error * out * (1 - out)                  # retropropagación: regla de la cadena
    d1 = (d2 @ W2.T) * h * (1 - h)
    W2 -= eta * h.T @ d2;  b2 -= eta * d2.sum(0)
    W1 -= eta * X.T @ d1;  b1 -= eta * d1.sum(0)
    if epoca in (1, 100, 500, 1000, 2000, 5000):
        print(f"  época {epoca:5d}   error cuadrático medio = {perdida:.5f}")
print("  salidas finales:", np.round(out.ravel(), 3), " (objetivo 0 1 1 0)")
