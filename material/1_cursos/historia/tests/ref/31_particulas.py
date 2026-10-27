import numpy as np
import mpmath as mp
from scipy import optimize, constants as sc

def run(R):
    mp.mp.dps = 30
    def p2(M, a, b):
        M, a, b = mp.mpf(M), mp.mpf(a), mp.mpf(b)
        return float(mp.sqrt((M**2-(a+b)**2)*(M**2-(a-b)**2))/(2*M))
    R['twobody'] = [[M, a, b, p2(M, a, b)] for M, a, b in ((139.57039, 105.6583755, 0.0), (493.677, 105.6583755, 0.0), (91187.6, 0.51099895, 0.51099895), (938.272, 0.0, 0.0))]
    R['hbarc'] = float(sc.hbar*sc.c/sc.e*1e9*1e15/1e6/1e9*1e9)  # MeV·fm
    R['hbarc'] = float(sc.hbar*sc.c/sc.e/1e6*1e15)
    # Resonancia: curva sintética y ajuste con curve_fit
    M0, G0 = 91187.6, 2495.2
    def sig(E, M, G, A):
        s = E**2
        return A*s*G*G/((s-M*M)**2+s*s*G*G/(M*M))
    E = np.linspace(88000, 95000, 29)
    y = sig(E, M0, G0, 41.5)
    popt, _ = optimize.curve_fit(sig, E, y, p0=[91000, 2000, 40])
    R['bw_fit'] = [float(v) for v in popt]
    R['bw_peak'] = float(12*np.pi/M0**2*83.984*1744.4/2495.2**2*3.89379372e11)
    R['bw_halfwidth'] = []
    # ancho a media altura numérico
    f = lambda e: sig(e, M0, G0, 1.0) - 0.5*sig(M0, M0, G0, 1.0)
    lo = optimize.brentq(f, 85000, M0); hi = optimize.brentq(f, M0, 97000)
    R['bw_fwhm'] = float(hi-lo)
    R['nnu'] = float((2495.2-1744.4-3*83.984)/167.2)
