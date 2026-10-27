import numpy as np
from scipy import integrate, constants as sc

def run(R):
    # Bateman: padre -> hijo con solve_ivp
    l1, l2, N0 = 0.3, 1.1, 1000.0
    ts = [0.5, 2.0, 5.0]
    sol = integrate.solve_ivp(lambda t, y: [-l1*y[0], l1*y[0]-l2*y[1]], (0, 5), [N0, 0.0], t_eval=ts, rtol=1e-11, atol=1e-12, method='DOP853')
    R['bateman'] = [[l1, l2, N0, t, float(sol.y[0][i]), float(sol.y[1][i])] for i, t in enumerate(ts)]
    # e/m del electrón
    R['em'] = float(sc.e/sc.m_e)
    R['qe'] = float(sc.e); R['me'] = float(sc.m_e); R['k'] = float(1/(4*np.pi*sc.epsilon_0)); R['g'] = float(sc.g)
    # Trayectoria de Coulomb (d = 1, E = 1, masa 1) con DOP853
    def ang(b):
        X = 400.0
        f = lambda t, s: [s[2], s[3], s[0]/(s[0]**2+s[1]**2)**1.5, s[1]/(s[0]**2+s[1]**2)**1.5]
        ev = lambda t, s: s[0]-X
        ev.terminal = True
        r = integrate.solve_ivp(f, (0, 1e5), [-X, b, np.sqrt(2.0), 0.0], rtol=1e-12, atol=1e-12, events=ev, method='DOP853')
        return float(np.arctan2(r.y[3][-1], r.y[2][-1]))
    R['coul2'] = [[b, ang(b)] for b in (0.25, 0.5, 1.0, 2.0)]
    # sigma(>theta) integrando dsigma/dOmega con quad
    d = 2*79*sc.e**2*R['k']/(5.3e6*sc.e)
    R['d_au'] = float(d)
    f = lambda th: (d/4)**2/np.sin(th/2)**4*2*np.pi*np.sin(th)
    R['xs_above'] = [[th, float(integrate.quad(f, th, np.pi)[0])] for th in (np.pi/2, 2.0, 1.0)]
    # Millikan sintético: n electrones, mezcla de n = 1..6
    rng = np.random.default_rng(7)
    ns = rng.integers(1, 7, size=60)
    q = ns*sc.e*(1+rng.normal(0, 0.004, size=60))
    R['millikan_q'] = [float(x) for x in q]
    R['millikan_n'] = [int(x) for x in ns]
    # Gota de aceite
    eta, rho, rho_a, E = 1.8325e-5, 886.0, 1.2, 4.0e5
    a = 0.8e-6
    vf = 2*a*a*sc.g*(rho-rho_a)/(9*eta)
    qq = 3*sc.e
    vr = qq*E/(6*np.pi*eta*a) - vf
    R['oil'] = {'eta': eta, 'drho': rho-rho_a, 'E': E, 'a': a, 'vf': float(vf), 'vr': float(vr), 'q': float(qq)}
