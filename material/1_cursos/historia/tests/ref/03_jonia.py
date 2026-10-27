import numpy as np
from fractions import Fraction
from scipy import integrate

def run(R):
    # Intervalos pitagóricos en cents
    R['cents'] = {k: float(1200*np.log2(v)) for k, v in {'octava': 2.0, 'quinta': 1.5, 'cuarta': 4/3, 'tono': 9/8}.items()}
    R['comma'] = float(Fraction(3, 2)**12 / 2**7)
    R['comma_cents'] = float(1200*np.log2(R['comma']))
    # Zenón: suma exacta de la serie con integración numérica del tiempo de alcance
    va, vt, d = 10.0, 1.0, 100.0
    t = 0.0; gap = d
    for _ in range(60):
        dt = gap/va; t += dt; gap = vt*dt
    R['zeno_t'] = t
    R['zeno_exact'] = d/(va-vt)
    # Cuerda vibrante: f = (1/2L) sqrt(T/mu), mu = 1e-3 kg/m, T = 100 N, L = 0.6 m
    R['string_f1'] = float(np.sqrt(100/1e-3)/(2*0.6))
