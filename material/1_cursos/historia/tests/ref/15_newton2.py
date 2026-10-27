import numpy as np
from scipy import optimize, constants as sc

def run(R):
    # Desviación mínima de un prisma de 60° (BK7, Cauchy) con minimize_scalar
    A = np.radians(60)
    out = {}
    for lam in (656, 405):
        n = 1.5046 + 0.0042/(lam/1000)**2
        dev = lambda i: i + np.arcsin(n*np.sin(A - np.arcsin(np.sin(i)/n))) - A
        r = optimize.minimize_scalar(dev, bounds=(0.3, 1.4), method='bounded', options={'xatol': 1e-12})
        out[str(lam)] = {'n': float(n), 'delta': float(np.degrees(r.fun)), 'i': float(np.degrees(r.x))}
    R['prism'] = out
    # Anillos de Newton
    R['ring'] = {'r1_589_1m': float(np.sqrt(589e-9*1.0)), 'r10': float(np.sqrt(10*589e-9*1.0))}
    R['newton_gap_lambda'] = float(4*0.0254/178000)
    R['young'] = {'rojo': float(0.0254/36000), 'violeta': float(0.0254/60000)}
    # Römer: retraso como diferencia de distancias entre la Tierra y Júpiter (círculos), con scipy.optimize
    AU = sc.au/1000; c = sc.c/1000
    def d(t):
        e = 2*np.pi*t; j = 2*np.pi*t/11.862
        return np.hypot(5.2026*np.cos(j) - np.cos(e), 5.2026*np.sin(j) - np.sin(e))
    ts = np.linspace(0, 1.5, 30001)
    R['romer_max'] = float(np.max((d(ts) - d(0))*AU/c/60))
    R['romer_2au'] = float(2*AU/c/60)
    R['romer_c'] = float(2*138e6/(22*60))
    # Aberración
    v = 29.78
    R['aberr'] = {'kappa': float(np.degrees(np.arctan(v/c))*3600), 'c_from_20_5': float(v/np.tan(np.radians(20.5/3600))), 't_sun': float(AU/c)}
    R['aberr_ellipse_b'] = float(20.49*np.sin(np.radians(51.5)))
