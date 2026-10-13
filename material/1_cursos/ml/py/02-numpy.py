# Álgebra lineal, gradientes y Bayes con NumPy
import numpy as np
np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(0)

# 1. Distancias y similitud entre dos clientes: (edad, ingreso en millones, visitas)
a, b = np.array([35, 4.2, 3.0]), np.array([52, 4.0, 2.0])
print("distancia euclidiana:", round(np.linalg.norm(a - b), 3))
print("similitud coseno:    ", round(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)), 4))
clientes = np.array([a, b, [28, 6.5, 5], [61, 2.1, 1], [44, 3.3, 4]])
Z = (clientes - clientes.mean(0)) / clientes.std(0)   # estandarizar columnas
print("distancia tras estandarizar:", round(np.linalg.norm(Z[0] - Z[1]), 3))

# 2. Mínimos cuadrados con las ecuaciones normales: w = (XᵀX)⁻¹ Xᵀ y
n = 200
X = rng.normal(size=(n, 3))
y = 1.0 + X @ np.array([2.0, -1.0, 0.5]) + rng.normal(scale=0.5, size=n)
A = np.column_stack([np.ones(n), X])            # columna de unos = intercepto
w = np.linalg.solve(A.T @ A, A.T @ y)           # más estable que invertir
print("\nintercepto y pesos estimados:", w)

# 3. Covarianza y autovectores de datos correlacionados
D = rng.multivariate_normal([0, 0], [[3.0, 1.8], [1.8, 1.5]], size=500)
S = np.cov(D, rowvar=False)
vals, vecs = np.linalg.eigh(S)                  # orden ascendente
print("\ncovarianza muestral:\n", S)
print("autovalores:", vals[::-1], "\nprimer autovector:", vecs[:, -1])

# 4. Comprobación del gradiente del error cuadrático medio
def mse(w):
    return np.mean((A @ w - y) ** 2)
def grad_mse(w):
    return 2 / n * A.T @ (A @ w - y)
w0 = np.zeros(4)
h = 1e-6
num = np.array([(mse(w0 + h * e) - mse(w0 - h * e)) / (2 * h) for e in np.eye(4)])
print("\ngradiente analítico:", grad_mse(w0))
print("gradiente numérico: ", num)
print("diferencia máxima:  ", np.abs(num - grad_mse(w0)).max())

# 5. Teorema de Bayes para una prueba diagnóstica
prev, sens, espec = 0.01, 0.95, 0.95
p_pos = sens * prev + (1 - espec) * (1 - prev)
print(f"\nP(positivo) = {p_pos:.4f}   P(enfermo | positivo) = {sens * prev / p_pos:.4f}")
