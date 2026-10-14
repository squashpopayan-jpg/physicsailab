# Red de Hopfield (1982): memoria asociativa, completar un patrón a partir de una pista y su capacidad
import numpy as np
from scipy.special import erf

rng = np.random.default_rng(5)

def entrenar(patrones):
    """Regla de Hebb: W = (1/N) Σ ξ ξᵀ, sin autoconexiones."""
    P = np.array(patrones, dtype=float)
    W = P.T @ P / P.shape[1]
    np.fill_diagonal(W, 0.0)
    return W

def recordar(W, s, barridos=10):
    s = s.copy()
    for _ in range(barridos):
        cambios = 0
        for i in rng.permutation(len(s)):          # actualización asíncrona
            nuevo = 1 if W[i] @ s >= 0 else -1
            cambios += nuevo != s[i]
            s[i] = nuevo
        if cambios == 0:
            break
    return s

N = 200
print(f"Red de N = {N} neuronas. Recuerdo a partir de una pista con 20 % de bits cambiados.")
print(" P    P/N    recuerdos correctos (solapamiento > 0,95)    bits inestables: medidos / teoría")
for P in (5, 10, 20, 27, 30, 40, 60):
    pats = rng.choice([-1, 1], size=(P, N))
    W = entrenar(pats)
    ok, prueba = 0, pats[:10]
    for p in prueba:
        pista = np.where(rng.random(N) < 0.2, -p, p)
        ok += (recordar(W, pista) @ p) / N > 0.95
    inest = np.mean([(W @ p) * p < 0 for p in pats])
    teoria = 0.5 * (1 - erf(np.sqrt(N / (2 * P))))
    print(f"{P:3d}   {P / N:5.3f}   {ok:2d} de {len(prueba):2d}{'':33s}{inest:7.4f} / {teoria:.4f}")
print("Capacidad teórica para recuerdo casi perfecto (Amit, Gutfreund y Sompolinsky): P ≈ 0,138 N =", round(0.138 * N))
