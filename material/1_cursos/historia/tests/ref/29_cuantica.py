import numpy as np
from scipy import linalg, integrate, constants as sc

def run(R):
    h, me, e = sc.h, sc.m_e, sc.e
    R['dbl'] = [[E, float(h/np.sqrt(2*me*E*e)*1e9)] for E in (54.0, 100.0, 10.0, 1000.0)]
    R['dg_theta'] = float(np.arcsin(h/np.sqrt(2*me*54*e)*1e9/0.215))
    R['box'] = [float(n**2*np.pi**2*sc.hbar**2/(2*me*(1e-9)**2)/e) for n in (1, 2, 3)]
    def tri(V, x0, x1, N, k):
        dx = (x1-x0)/(N+1)
        xs = x0 + dx*np.arange(1, N+1)
        d = 1/dx**2 + V(xs)
        off = -0.5/dx**2*np.ones(N-1)
        return [float(v) for v in linalg.eigh_tridiagonal(d, off, select='i', select_range=(0, k-1))[0]]
    R['osc'] = tri(lambda x: 0.5*x**2, -8, 8, 800, 5)
    R['well'] = tri(lambda x: 0*x, 0, 1, 400, 4)
    R['hyd'] = tri(lambda r: -1/r, 0, 60, 3000, 4)
    R['dw'] = tri(lambda x: (x**2-1)**2*2.0, -3, 3, 600, 4)
    # Incertidumbre del estado fundamental del pozo infinito (L = 1, ħ = 1)
    f = lambda x: 2*np.sin(np.pi*x)**2
    m, _ = integrate.quad(lambda x: x*f(x), 0, 1)
    m2, _ = integrate.quad(lambda x: x*x*f(x), 0, 1)
    p2, _ = integrate.quad(lambda x: (np.pi*np.sqrt(2)*np.cos(np.pi*x))**2, 0, 1)
    R['box_unc'] = float(np.sqrt(m2-m*m)*np.sqrt(p2))
