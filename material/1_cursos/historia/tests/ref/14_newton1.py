import numpy as np
from scipy import integrate, constants as sc

def run(R):
    # Prueba de la Luna con constantes modernas
    g = sc.g
    r_m, T = 384400e3, 27.321661*86400
    a_m = 4*np.pi**2*r_m/T**2
    a60 = 4*np.pi**2*(60.27*6371e3)/T**2
    R['moon'] = {'a': float(a_m), 'ratio': float(a60/(g/60.27**2)), 'ratio_true_r': float(a_m/(g/(r_m/6.371e6)**2))}
    R['ratio_mar'] = float((4*np.pi**2*(60*5532e3)/T**2)/(g/3600))
    # Velocidades en la superficie terrestre
    GM, Re = 398600.4418, 6371.0
    R['vc'] = float(np.sqrt(GM/Re)); R['ve'] = float(np.sqrt(2*GM/Re))
    # Órbita kepleriana con solve_ivp (GM=1, r0=1, v0=1.2): excentricidad y periodo
    def rhs(t, s): r = np.hypot(s[0], s[1]); return [s[2], s[3], -s[0]/r**3, -s[1]/r**3]
    sol = integrate.solve_ivp(rhs, [0, 40], [1, 0, 0, 1.2], rtol=1e-11, atol=1e-12, dense_output=True)
    ts = np.linspace(0, 40, 40001); xy = sol.sol(ts)
    r = np.hypot(xy[0], xy[1])
    R['orbit'] = {'rmin': float(r.min()), 'rmax': float(r.max()), 'L': float(xy[0][-1]*xy[3][-1]-xy[1][-1]*xy[2][-1])}
    a = 1/(2-1.44); R['orbit']['a'] = float(a); R['orbit']['T'] = float(2*np.pi*a**1.5)
    # Ángulo apsidal para n = 2.1 y 1.9 en órbitas casi circulares (v0 = 1.02): integración con solve_ivp
    out = {}
    for n in (1.9, 2.1):
        def rhs2(t, s): rr = np.hypot(s[0], s[1]); return [s[2], s[3], -s[0]/rr**(n+1), -s[1]/rr**(n+1)]
        s = integrate.solve_ivp(rhs2, [0, 30], [1, 0, 0, 1.0], rtol=1e-11, atol=1e-12, dense_output=True)
        # órbita circular de velocidad 1 con perturbación pequeña de velocidad
        s = integrate.solve_ivp(rhs2, [0, 30], [1, 0, 0, 1.01], rtol=1e-11, atol=1e-12, dense_output=True)
        t = np.linspace(0, 30, 300001); xy = s.sol(t); rr = np.hypot(xy[0], xy[1])
        th = np.unwrap(np.arctan2(xy[1], xy[0]))
        idx = np.where((rr[1:-1] < rr[:-2]) & (rr[1:-1] < rr[2:]))[0] + 1
        out[str(n)] = float(th[idx[1]] - th[idx[0]]) if len(idx) > 1 else None
    R['apsidal'] = out
    R['apsidal_theory'] = {str(n): float(np.pi/np.sqrt(3-n)*2) for n in (1.9, 2.1)}
