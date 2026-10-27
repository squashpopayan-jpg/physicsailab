import numpy as np
from scipy import optimize, integrate

def dev(i, n, k):
    r = np.arcsin(np.sin(i)/n)
    return k*np.pi + 2*i - 2*(k+1)*r

def run(R):
    out = {}
    for n in (1.331, 1.333, 1.344):
        for k in (1, 2):
            s = optimize.minimize_scalar(lambda i: dev(i, n, k), bounds=(0.3, 1.5), method='bounded', options={'xatol': 1e-12})
            D = np.degrees(s.fun)
            out[f'{n}_{k}'] = {'i': float(np.degrees(s.x)), 'D': float(D), 'ang': float(180-D if k == 1 else D-180)}
    R['rainbow'] = out
    a, T = 5.0, 4.0
    R['merton_s'] = float(integrate.quad(lambda t: a*t, 0, T)[0])
    R['merton_mean'] = (0 + a*T)/2*T
    R['odd'] = [int(2*k-1) for k in range(1, 8)]
    R['harm'] = {str(k): float(np.sum(1.0/np.arange(1, 2**k+1))) for k in (4, 10, 16)}
    R['harm_12367'] = [float(np.sum(1.0/np.arange(1, 12366+1))), float(np.sum(1.0/np.arange(1, 12367+1)))]
