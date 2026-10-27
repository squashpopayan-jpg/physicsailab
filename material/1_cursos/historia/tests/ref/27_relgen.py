import numpy as np
from scipy import integrate, constants as sc

def run(R):
    # Precesión: w'' + w = 1 + 3 eps w^2
    def prec(eps, e):
        f = lambda t, s: [s[1], 1 + 3*eps*s[0]**2 - s[0]]
        ev = lambda t, s: s[1]
        ev.direction = -1
        sol = integrate.solve_ivp(f, (0, 8), [1+e, 0.0], events=ev, rtol=1e-13, atol=1e-14, method='DOP853')
        te = [t for t in sol.t_events[0] if t > 1.0]
        return float(te[0] - 2*np.pi)
    R['gr_prec'] = [[eps, e, prec(eps, e)] for eps, e in ((1e-3, 0.3), (1e-4, 0.2056), (3e-3, 0.5))]
    # Deflexión de la luz: u'' + u = 3 m u^2 con b = 1
    def defl(m):
        f = lambda t, s: [s[1], 3*m*s[0]**2 - s[0]]
        ev = lambda t, s: s[0]
        ev.direction = -1
        sol = integrate.solve_ivp(f, (0, 4), [0.0, 1.0], events=ev, rtol=1e-13, atol=1e-15, method='DOP853')
        te = [t for t in sol.t_events[0] if t > 1.0]
        return float(te[0] - np.pi)
    R['gr_defl'] = [[m, defl(m)] for m in (1e-3, 1e-4, 5e-3)]
    # Mercurio
    GM = 1.32712440018e20
    a, e, P = 5.7909e10, 0.2056, 87.969
    R['mercury'] = float(6*np.pi*GM/(sc.c**2*a*(1-e**2))*(36525/P)/(np.pi/648000))
    R['sun_defl'] = float(4*GM/(sc.c**2*6.957e8)/(np.pi/648000))
    R['sun_rs'] = float(2*sc.G*1.98847e30/sc.c**2)
    # GPS
    GMe = 3.986004418e14; r = 26571e3; Re = 6378137.0
    R['gps'] = [float(GMe/sc.c**2*(1/Re-1/r)*86400*1e6), float(-(GMe/r)/(2*sc.c**2)*86400*1e6)]
    # Chirrido: integración numérica de df/dt = (96/5) pi^(8/3) (G Mc/c^3)^(5/3) f^(11/3)
    m1, m2 = 36*1.98847e30, 29*1.98847e30
    Mc = (m1*m2)**0.6/(m1+m2)**0.2
    k = 96/5*np.pi**(8/3)*(sc.G*Mc/sc.c**3)**(5/3)
    f0 = 35.0
    sol = integrate.solve_ivp(lambda t, f: k*f**(11/3), (0, 0.5), [f0], events=lambda t, f: f[0]-250.0, rtol=1e-11, atol=1e-9, method='DOP853')
    R['chirp'] = {'Mc': float(Mc/1.98847e30), 't35_250': float(sol.t_events[0][0])}
    # Media ponderada
    v = np.array([1.98, 1.61]); s = np.array([0.12, 0.30])
    w = 1/s**2
    R['wmean2'] = [float(np.sum(w*v)/np.sum(w)), float(1/np.sqrt(np.sum(w)))]
    v3 = np.array([0.86, 1.98, 1.61]); s3 = np.array([0.48, 0.12, 0.30]); w3 = 1/s3**2
    R['wmean3'] = [float(np.sum(w3*v3)/np.sum(w3)), float(1/np.sqrt(np.sum(w3)))]
    R['chi2_gr_2'] = float(np.sum(((v-1.75)/s)**2)); R['chi2_nw_2'] = float(np.sum(((v-0.87)/s)**2))
