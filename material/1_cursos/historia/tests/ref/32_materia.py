import numpy as np
from scipy import optimize, integrate, constants as sc

def run(R):
    # Kronig-Penney: bordes de banda con brentq
    def edges(P, amax):
        F = lambda a: np.cos(a) + P*np.sin(a)/a
        g = lambda a: abs(F(a)) - 1
        grid = np.linspace(1e-6, amax, 40000)
        vals = np.array([g(a) for a in grid])
        out = []
        for i in range(len(grid)-1):
            if vals[i]*vals[i+1] < 0:
                out.append(float(optimize.brentq(g, grid[i], grid[i+1], xtol=1e-14)))
        return [x*x for x in out]
    R['kp'] = [[P, edges(P, 3*np.pi + 0.3)] for P in (1.0, 3*np.pi/2, 6.0)]
    # Diodo
    Is, n, T = 1e-12, 1.0, 300.0
    Vt = sc.k*T/sc.e
    R['diode'] = [[v, float(Is*np.expm1(v/(n*Vt)))] for v in (-0.5, 0.2, 0.6, 0.7)]
    R['vt300'] = float(Vt)
    # Moore
    d = [[1971,2300],[1974,6000],[1978,29000],[1982,134000],[1985,275000],[1989,1180000],[1993,3100000],[1997,7500000],[1999,9500000],[2000,42000000],[2006,291000000],[2010,1170000000],[2015,1750000000],[2020,11800000000]]
    x = np.array([a for a, b in d]); y = np.log2([b for a, b in d])
    m, b = np.polyfit(x, y, 1)
    R['moore_T2'] = float(1/m)
    # BCS: gap a T = 0 y Tc
    def tc(g):
        f = lambda T: integrate.quad(lambda x: np.tanh(x/(2*T))/x, 0, 1, limit=400)[0] - 1/g
        return float(optimize.brentq(f, 1e-4, 1.0, xtol=1e-14))
    R['bcs'] = [[g, 1/np.sinh(1/g), tc(g)] for g in (0.2, 0.25, 0.3)]
    R['bcs_ratio_limit'] = float(np.pi/np.exp(np.euler_gamma))
    # Láser: integración temporal de las ecuaciones de balance hasta el estacionario
    tau, G, tauc, beta, Rp = 1.0, 1.0, 0.01, 1e-4, 150.0
    def rhs(t, y):
        n, p = y
        return [Rp - n/tau - G*n*p, G*n*p - p/tauc + beta*n/tau]
    sol = integrate.solve_ivp(rhs, (0, 50), [0.0, 0.0], method='Radau', rtol=1e-10, atol=1e-12)
    R['laser'] = [tau, G, tauc, beta, Rp, float(sol.y[0][-1]), float(sol.y[1][-1])]
    R['A_over_B_500nm'] = float(8*np.pi*sc.h*(sc.c/500e-9)**3/sc.c**3)
