import numpy as np
from scipy import optimize

def run(R):
    h, th = 305.0, np.radians(34/60)
    # geometría exacta: cos θ = R/(R+h)  =>  R = h cosθ/(1-cosθ), comprobado resolviendo la ecuación numéricamente
    f = lambda Rr: Rr/(Rr+h) - np.cos(th)
    R['biruni_R'] = float(optimize.brentq(f, 1e5, 1e8))
    R['dip_real'] = float(np.degrees(np.arccos(6371000/(6371000+305)))*60)
    lam, ff = 550e-9, 0.5
    B = lambda d: np.hypot(d, 2.44*lam*ff/d)
    R['pinhole_opt'] = float(optimize.minimize_scalar(B, bounds=(1e-5, 1e-2), method='bounded', options={'xatol': 1e-12}).x)
    R['snell_n15_40'] = float(np.degrees(np.arcsin(np.sin(np.radians(40))/1.5)))
    R['tusi'] = [[t, float(2*np.cos(t)), 0.0] for t in (0.3, 1.0, 2.2, 5.0)]
