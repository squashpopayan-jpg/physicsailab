import numpy as np
from scipy import integrate, optimize, constants as sc

def run(R):
    k, h, me, e = sc.k, sc.h, sc.m_e, sc.e
    chi = 13.605693*e
    def saha(T, ne):
        return float((2*np.pi*me*k*T/h**2)**1.5*np.exp(-chi/(k*T))/ne)
    R['saha'] = [[T, ne, saha(T, ne)] for T, ne in ((5000.0, 1e20), (9000.0, 1e20), (12000.0, 1e20), (20000.0, 1e19))]
    def strength(T, ne):
        r = saha(T, ne); f = r/(1+r)
        x2 = 10.2*e/(k*T); p2 = 4*np.exp(-x2); p3 = 4.5*np.exp(-12.09*e/(k*T))
        return (1-f)*p2/(1+p2+p3)
    Ts = np.arange(3000, 30001, 10.0)
    R['balmer_peak'] = float(Ts[int(np.argmax([strength(T, 1e20) for T in Ts]))])
    # Noether: integración con DOP853
    def run_orbit(eps, tmax):
        f = lambda t, s: [s[2], s[3], -s[0]/(s[0]**2+s[1]**2)**1.5-eps, -s[1]/(s[0]**2+s[1]**2)**1.5]
        sol = integrate.solve_ivp(f, (0, tmax), [1, 0, 0, 0.9], rtol=1e-12, atol=1e-13, method='DOP853', t_eval=[tmax])
        x, y, vx, vy = sol.y[:, -1]
        return [float(0.5*(vx*vx+vy*vy)-1/np.hypot(x, y)+eps*x), float(x*vy-y*vx)]
    R['noether'] = [[eps, tmax] + run_orbit(eps, tmax) for eps, tmax in ((0.0, 20.0), (0.05, 6.0))]
    # Price
    d = [(1665,1),(1700,3),(1750,10),(1800,100),(1850,1000),(1900,10000),(1950,100000)]
    m, b = np.polyfit([a for a, c in d], np.log2([c for a, c in d]), 1)
    R['price_T2'] = float(1/m)
