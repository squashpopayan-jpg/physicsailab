"""Referencias independientes (NumPy, SciPy, SymPy) para validar el motor de simulación.
Ejecutar: python tests/referencias.py   ->   tests/referencias.json"""
import json
import numpy as np
from scipy import signal, optimize, integrate
import sympy as sp

R = {}
VT = 8.617333262e-5 * 300.15

# 1) Red resistiva: puente de Wheatstone desequilibrado con fuente de 9 V (nodo A y nodo B)
# nodos: A (arriba izq.), B (arriba der.), tierra abajo; R1 = 1k (Vs-A), R2 = 2k (A-gnd), R3 = 1.5k (Vs-B), R4 = 3.3k (B-gnd), Rp = 4.7k (A-B)
G = np.array([[1 / 1e3 + 1 / 2e3 + 1 / 4.7e3, -1 / 4.7e3], [-1 / 4.7e3, 1 / 1.5e3 + 1 / 3.3e3 + 1 / 4.7e3]])
b = np.array([9 / 1e3, 9 / 1.5e3])
R['puente'] = np.linalg.solve(G, b).tolist()

# 2) Escalón en un RC: V(t) = V0 (1 - e^{-t/RC}) comprobado con solve_ivp (R = 1 kΩ, C = 1 µF, 5 V)
sol = integrate.solve_ivp(lambda t, y: [(5 - y[0]) / (1e3 * 1e-6)], [0, 5e-3], [0], t_eval=[0.5e-3, 1e-3, 2e-3, 5e-3], rtol=1e-12, atol=1e-14)
R['rc_escalon'] = {'t': [0.5e-3, 1e-3, 2e-3, 5e-3], 'v': sol.y[0].tolist()}

# 3) Pasabajos de 2.º orden (Sallen–Key, K = 1.586, f0 = 995 Hz): módulo y fase
f0 = 1 / (2 * np.pi * 10e3 * 16e-9); K = 1.586; Q = 1 / (3 - K)
fs = [100.0, 500.0, 995.0, 2000.0, 5000.0, 10000.0]
w0 = 2 * np.pi * f0
_, h = signal.freqs([K * w0 ** 2], [1, w0 / Q, w0 ** 2], 2 * np.pi * np.array(fs))
R['sallen'] = {'f': fs, 'mag_db': (20 * np.log10(np.abs(h))).tolist(), 'fase': (np.angle(h, deg=True)).tolist(), 'f0': f0, 'Q': Q}

# 4) Diodo 1N4148 (Is = 2.52e-9, n = 1.752, rs = 0.568) con 5 V y 1 kΩ: resolver con brentq
Is, n, rs = 2.52e-9, 1.752, 0.568
f = lambda i: 5 - i * 1e3 - (n * VT * np.log(i / Is + 1) + i * rs)
R['diodo_i'] = optimize.brentq(f, 1e-9, 5e-3, xtol=1e-18, rtol=1e-14)

# 5) BJT 2N3904 con divisor 33k/10k, RE = 1 kΩ, RC = 3.3 kΩ, 12 V (Ebers–Moll directo con efecto Early)
Is, bf, va = 6.7e-15, 416.0, 74.0
def f_bjt(x):
    vb, ve, vc = x
    vbe, vce = vb - ve, vc - ve
    ic = Is * (np.exp(vbe / VT) - 1) * (1 + vce / va)
    ib = ic / bf
    return [(12 - vb) / 33e3 - vb / 10e3 - ib, (ic + ib) - ve / 1e3, (12 - vc) / 3.3e3 - ic]
vb, ve, vc = optimize.fsolve(f_bjt, [2.7, 2.0, 5.0], xtol=1e-14)
R['bjt'] = {'vb': vb, 've': ve, 'vc': vc, 'ic': (12 - vc) / 3.3e3}

# 6) FFT de una señal con dos armónicos (amplitudes 1.0 y 0.25) y componente continua 0.5
N = 1024
t = np.arange(N) / N
x = 0.5 + 1.0 * np.sin(2 * np.pi * 8 * t) + 0.25 * np.sin(2 * np.pi * 24 * t + 0.7)
X = np.abs(np.fft.rfft(x)) * 2 / N
R['fft'] = {'x': x.tolist(), 'bin8': X[8], 'bin24': X[24]}

# 7) Transformador ideal + divisor: razón de espiras y cargas (SymPy): V2 = V1 · N2/N1 · RL/(RL + Rs2) con Rs2 = Rs · (N2/N1)^2
a, RL, Rs = sp.symbols('a RL Rs', positive=True)
V1 = 10
exp = sp.simplify(V1 * a * RL / (RL + Rs * a ** 2))
R['trafo'] = float(exp.subs({a: 2, RL: 100, Rs: 5}))

# 8) Oscilador de puente de Wien: frecuencia y atenuación de la red RC serie-paralelo (SymPy)
w, Rr, C = sp.symbols('w R C', positive=True)
Zs = Rr + 1 / (sp.I * w * C)
Zp = 1 / (1 / Rr + sp.I * w * C)
beta = sp.simplify(Zp / (Zp + Zs))
wv = 1 / (Rr * C)
R['wien'] = {'beta0': complex(sp.N(beta.subs(w, wv).subs({Rr: 16e3, C: 10e-9}))).real, 'f0': float(1 / (2 * np.pi * 16e3 * 10e-9))}

# 9) Divisor con Monte Carlo analítico: σ relativo = 0.354·t para t = 5 % (propagación cuadrática)
R['divisor_sigma'] = 0.5 * np.sqrt(2) * (0.05 / 2)

json.dump(R, open('tests/referencias.json', 'w'), indent=1)
print('referencias.json escrito:', ', '.join(R.keys()))
