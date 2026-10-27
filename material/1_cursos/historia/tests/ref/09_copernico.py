import numpy as np
from scipy import optimize

def run(R):
    Pe, Pm = 365.256, 686.980
    # Planeta superior: tiempo de la oposición a la cuadratura resuelto numéricamente para a = 1.52368
    a = 1.52368
    f = lambda t: 2*np.pi*t*(1/Pe - 1/Pm) - np.arccos(1/a)
    R['quad_t'] = float(optimize.brentq(f, 1, 400))
    R['syn_mars'] = float(1/(1/Pe - 1/Pm))
    # Venus: elongación máxima real para a=0.72333 -> sin ε = a
    R['venus_eps'] = float(np.degrees(np.arcsin(0.72333)))
    R['merc_a'] = float(np.sin(np.radians(23)))
    # Paralajes: distancia = línea de base / tan(π)
    R['par'] = {
        'luna': float(6371.0/np.tan(np.radians(57/60))/6371.0),
        'nova': float(6371.0/np.tan(np.radians(1/60))/6371.0),
        'cygni_ly': float(1.495978707e8/np.tan(np.radians(0.314/3600))/9.4607304725808e12),
        'pc': float(1/0.1)
    }
    # Equivalencia de los tres sistemas: vector Tierra-Marte en cada uno
    RM, TM = 1.524, 1.881
    diffs = []
    for t in np.linspace(0, 2.2, 23):
        e, m = 2*np.pi*t, 2*np.pi*t/TM
        cop = np.array([RM*np.cos(m) - np.cos(e), RM*np.sin(m) - np.sin(e)])
        tyc = np.array([-np.cos(e) + RM*np.cos(m), -np.sin(e) + RM*np.sin(m)])
        diffs.append(float(np.max(np.abs(cop - tyc))))
    R['equiv_max'] = max(diffs)
