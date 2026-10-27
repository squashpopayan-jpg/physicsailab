import numpy as np
from scipy import integrate
from scipy.spatial.transform import Rotation as Rot

def fall(rb, rm, d, h, cd=0.47, g=9.80665):
    a = g*(1-rm/rb); k = 3*rm*cd/(4*rb*d)
    def f(t, y): return [y[1], a - k*y[1]**2]
    ev = lambda t, y: y[0]-h
    ev.terminal = True
    s = integrate.solve_ivp(f, [0, 200], [0, 0], events=ev, rtol=1e-11, atol=1e-12)
    return float(s.t_events[0][0])

def run(R):
    R['fall'] = {'plomo_aire': fall(11340, 1.2, 0.05, 10), 'madera_aire': fall(500, 1.2, 0.05, 10), 'plomo_agua': fall(11340, 1000, 0.05, 10), 'piedra_agua': fall(2600, 1000, 0.05, 10), 'piedra_aire_1m': fall(2600, 1.2, 0.1, 1)}
    R['free_fall'] = float(np.sqrt(2*10/9.80665))
    # Eudoxo: rotaciones con scipy
    def eud(alpha, S, P, t):
        w = 2*np.pi/S; W = 2*np.pi/P
        a3 = np.array([1, 0, 0]); a4 = np.array([np.cos(alpha), 0, np.sin(alpha)]); p0 = np.array([0, 1, 0])
        p = Rot.from_rotvec(a3*w*t).apply(Rot.from_rotvec(-a4*w*t).apply(p0))
        lon = np.arctan2(p[1], p[0]) - np.pi/2 + W*t
        return float(np.degrees(lon)), float(np.degrees(np.arcsin(p[2])))
    R['eudoxus'] = [[a, S, P, t, *eud(a, S, P, t)] for a, S, P, t in [(0.1, 378.09, 10759.2, 100.0), (0.3, 398.88, 4332.6, 250.0), (0.9, 779.94, 686.98, 400.0), (0.2, 583.92, 365.256, 55.0)]]
