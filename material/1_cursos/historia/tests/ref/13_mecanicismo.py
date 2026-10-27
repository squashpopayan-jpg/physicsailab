import numpy as np
from scipy import optimize, integrate

def run(R):
    # Fermat: mínimo del tiempo con scipy
    a, b, d, v1, v2 = 1.0, 1.0, 2.0, 1.0, 1/1.333
    f = lambda x: np.hypot(x, a)/v1 + np.hypot(d-x, b)/v2
    r = optimize.minimize_scalar(f, bounds=(0, d), method='bounded', options={'xatol': 1e-12})
    x = r.x
    R['fermat'] = {'x': float(x), 't': float(r.fun), 'ratio': float((x/np.hypot(x, a))/((d-x)/np.hypot(d-x, b)))}
    # Choque elástico con numpy: sistema lineal de conservación de p y E
    m1, v1i, m2 = 2.0, 4.0, 6.0
    u2 = 2*m1*v1i/(m1+m2); u1 = (m1-m2)*v1i/(m1+m2)
    R['elastic'] = {'u1': float(u1), 'u2': float(u2), 'p': float(m1*u1+m2*u2), 'E': float(0.5*m1*u1**2+0.5*m2*u2**2)}
    # Cicloide: tiempo de descenso desde φ0 hasta el fondo con quad (g=9.80665, a=0.4), debe valer π sqrt(a/g)
    g, aa = 9.80665, 0.4
    ts = {}
    for f_ in (0.35, 0.95):
        ph0 = np.arccos(1-2*f_)
        integrand = lambda ph: 2*aa*np.cos(ph/2)/np.sqrt(2*g*aa*(np.cos(ph)-np.cos(ph0)))
        ts[str(f_)] = float(integrate.quad(integrand, 0, ph0, limit=200)[0])
    R['cycloid_t'] = ts
    R['cycloid_quarter'] = float(np.pi*np.sqrt(aa/g))
    # Refracción de Huygens: construcción numérica de la envolvente
    th1, n = np.radians(45), 1.5
    R['huygens_th2'] = float(np.degrees(np.arcsin(np.sin(th1)/n)))
    # Aceleración centrípeta de la Luna: v²/r con órbita circular
    T = 27.321661*86400; r = 3.844e8
    R['moon_ac'] = float((2*np.pi*r/T)**2/r)
