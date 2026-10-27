import numpy as np
from scipy import integrate, optimize, constants as sc

def run(R):
    u = 931.49410242
    n, U235, Ba, Kr = 1.00866491595, 235.0439299, 140.914411, 91.926156
    R['fissionQ'] = float((U235 + n - Ba - Kr - 3*n)*u)
    # Exponente de Gamow por cuadratura
    mu = 4.001506179127*sc.atomic_mass
    def gam(Zd, E, Rf):
        Ej = E*1e6*sc.e; k = 1/(4*np.pi*sc.epsilon_0)*2*Zd*sc.e**2
        b = k/Ej; Rm = Rf*1e-15
        f = lambda r: np.sqrt(max(0.0, 2*mu*(k/r - Ej)))
        val, _ = integrate.quad(f, Rm, b, limit=200)
        return float(2*val/sc.hbar)
    R['gamow'] = [[Zd, E, Rf, gam(Zd, E, Rf)] for Zd, E, Rf in ((90, 4.27, 9.0), (82, 8.95, 8.5), (84, 5.3, 8.5))]
    # Probabilidad de extinción: raíz de q = exp(k(q-1)) con brentq
    def ext(k):
        if k <= 1: return 1.0
        return float(optimize.brentq(lambda q: q - np.exp(k*(q-1)), 1e-12, 1-1e-9))
    R['extinct'] = [[k, ext(k)] for k in (1.1, 1.5, 2.0, 2.43, 3.0)]
    # Taylor
    t = np.array([0.1,0.24,0.38,0.52,0.66,0.8,0.94,1.08,1.22,1.36,1.5,1.65,1.79,1.93,3.26,3.53,3.8,4.07,4.34,4.61,15,25,34,53,62])*1e-3
    r = np.array([11.1,19.9,25.4,28.8,31.9,34.2,36.3,38.9,41.0,42.8,44.4,46.0,46.9,48.7,59.0,61.1,62.9,64.3,65.6,67.3,106.5,130,145,175,185])
    m, b = np.polyfit(np.log(t), np.log(r), 1)
    R['taylor_fit'] = [float(m), float(b)]
    rho = 1.2
    xi = 1.033
    E = rho*r**5/(xi**5*t**2)
    R['taylor_E_mean_kt'] = float(np.mean(E)/4.184e12)
    # Energía de enlace: B/A del hierro con scipy.constants (masas)
    R['mn_u'] = float(sc.m_n/sc.atomic_mass)
