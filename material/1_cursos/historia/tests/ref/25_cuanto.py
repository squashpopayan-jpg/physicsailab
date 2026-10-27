import numpy as np
from scipy import integrate, optimize, constants as sc

def run(R):
    h, c, k = sc.h, sc.c, sc.k
    B = lambda lam, T: 2*h*c**2/lam**5/np.expm1(h*c/(lam*k*T))
    R['planck'] = [[lam, T, float(B(lam, T))] for lam, T in ((500e-9, 5772.0), (1e-6, 3000.0), (10e-6, 300.0), (2e-7, 8000.0))]
    R['wien_b'] = float(sc.Wien)
    R['stefan'] = float(sc.sigma)
    # Emitancia total por integración numérica en λ
    T = 5772.0
    tot, _ = integrate.quad(lambda l: np.pi*B(l, T), 1e-8, 1e-3, limit=500, points=[5e-7, 2e-6])
    R['stefan_num'] = [T, float(tot)]
    R['wien_x'] = float(optimize.brentq(lambda x: x - 5*(1-np.exp(-x)), 1, 10))
    R['compton'] = float(sc.h/(sc.m_e*sc.c))
    R['hc_ev_nm'] = float(sc.h*sc.c/sc.e*1e9)
    # Calor específico de Einstein: derivada numérica de la energía por mol
    th = 1300.0
    E = lambda T: 3*sc.R*th/np.expm1(th/T)
    R['einstein'] = [[T, float((E(T*(1+1e-5))-E(T*(1-1e-5)))/(2e-5*T))] for T in (100.0, 300.0, 1000.0)]
    # N_A y e desde las constantes de Planck de 1900
    R['planck1900'] = {'NA': float(sc.R/1.346e-23), 'e': float(96485.33/(sc.R/1.346e-23))}
