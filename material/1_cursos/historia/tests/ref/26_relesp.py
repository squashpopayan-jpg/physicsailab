import numpy as np
import mpmath as mp
from scipy import integrate, constants as sc

def run(R):
    mp.mp.dps = 40
    R['gamma'] = [[b, float(1/mp.sqrt(1-mp.mpf(b)**2))] for b in (0.1, 0.6, 0.9, 0.99, 0.9999)]
    # Boost con matriz de Lorentz y comprobación del intervalo
    b = 0.8; g = 1/np.sqrt(1-b*b)
    L = np.array([[g, -g*b], [-g*b, g]])
    ev = np.array([3.0, 5.0])  # (x, t)
    out = L @ ev
    R['boost'] = [float(out[0]), float(out[1])]
    # Gemelo con velocidad variable suave: v(t) = b sen(pi t/T)^2; tiempo propio por quad frente al tiempo de la Tierra
    T = 20.0; bmax = 0.8
    beta = lambda t: bmax*np.sin(np.pi*t/T)**2
    tau, _ = integrate.quad(lambda t: np.sqrt(1-beta(t)**2), 0, T, epsabs=1e-13, epsrel=1e-13)
    R['twin_smooth'] = [T, bmax, float(tau)]
    # Cohete de aceleración constante: integración numérica de dτ = dt/γ con la solución hiperbólica
    a = 9.80665; c = sc.c; ly = sc.light_year; yr = 365.25*86400
    d = 4.0*ly/2   # 4 años luz total, la mitad aceleración y la mitad frenado... cada mitad dividida en dos tramos
    # En cada tramo de longitud d/... usamos la fórmula con acosh via mpmath
    tau_half = (c/a)*float(mp.acosh(1 + mp.mpf(a*d)/(c*c)))
    R['rocket'] = float(2*tau_half/yr)
    # Muones
    tau_mu = 2.1969811e-6
    R['muon'] = [[h, bb, float(np.exp(-h/(bb*c)/(tau_mu/np.sqrt(1-bb*bb)))), float(np.exp(-h/(bb*c)/tau_mu))] for h, bb in ((15000.0, 0.9952), (10000.0, 0.99), (20000.0, 0.9999))]
    # Abraham: serie para β pequeño con mpmath
    f = lambda bb: 3/(4*bb**2)*((1+bb**2)/(2*bb)*mp.log((1+bb)/(1-bb)) - 1)
    R['abraham'] = [[bb, float(f(mp.mpf(bb)))] for bb in (0.1, 0.5, 0.9, 0.95)]
    R['tau_mu'] = tau_mu
    R['mp_c2_MeV'] = float(sc.physical_constants['proton mass energy equivalent in MeV'][0])
    R['me_c2_MeV'] = float(sc.physical_constants['electron mass energy equivalent in MeV'][0])
    R['relbeta'] = float(np.sqrt(1-1/(1+sc.e*5e5/(sc.m_e*c*c))**2))
