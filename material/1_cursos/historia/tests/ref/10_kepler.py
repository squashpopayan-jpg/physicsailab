import numpy as np
from scipy import optimize, integrate

def run(R):
    # Segunda ley: área barrida por el radio vector entre dos anomalías medias, integrando r²/2 dθ con quad
    e = 0.5
    def nu(M):
        E = optimize.brentq(lambda E: E - e*np.sin(E) - M, -1e-9, 2*np.pi+1e-9) if 0 < M < 2*np.pi else (0.0 if M == 0 else 2*np.pi)
        return 2*np.arctan2(np.sqrt(1+e)*np.sin(E/2), np.sqrt(1-e)*np.cos(E/2))
    def area(M1, M2):
        r = lambda th: (1-e*e)/(1+e*np.cos(th))
        return integrate.quad(lambda th: 0.5*r(th)**2, nu(M1), nu(M2))[0]
    R['area_peri'] = float(area(0.0, np.pi/3))
    R['area_af'] = float(area(np.pi - 0.3, np.pi - 0.3 + np.pi/3)) if False else float(area(np.pi, np.pi + np.pi/3))
    R['area_total'] = float(np.pi*np.sqrt(1-e*e)/6)
    # Tercera ley: ajuste log-log de los planetas con numpy
    a = np.array([0.38709927, 0.72333566, 1.00000261, 1.52371034, 5.202887, 9.53667594])
    T = np.array([87.9691, 224.701, 365.256, 686.980, 4332.589, 10759.22])
    R['slope'] = float(np.polyfit(np.log10(a), np.log10(T), 1)[0])
    R['k_planets'] = float(np.mean(T**2/a**3))
    G = 6.6743e-11
    R['GM_sun_mars'] = float(4*np.pi**2*(1.52371034*1.495978707e11)**3/(686.980*86400)**2/G)
    R['M_jup_io'] = float(4*np.pi**2*(421.77e6)**3/(1.769138*86400)**2/G)
    R['M_mars_phobos'] = float(4*np.pi**2*(9.376e6)**3/(0.31891*86400)**2/G)
    # Cometa Halley
    R['halley'] = {'a': 76**(2/3), 'rp': 76**(2/3)*(1-0.967), 'ra': 76**(2/3)*(1+0.967), 'v': 1.967/0.033}
    # Ajuste focal: genera puntos exactos de Marte y ajusta con lstsq 1/r = A + B cos + D sin
    ths = np.linspace(0, 2*np.pi, 60, endpoint=False)
    ee, aa, om = 0.0934, 1.5237, 0.4
    r = aa*(1-ee*ee)/(1+ee*np.cos(ths-om))
    M = np.vstack([np.ones_like(ths), np.cos(ths), np.sin(ths)]).T
    sol = np.linalg.lstsq(M, 1/r, rcond=None)[0]
    R['focal_fit'] = {'e': float(np.hypot(sol[1], sol[2])/sol[0]), 'a': float(1/sol[0]/(1-(np.hypot(sol[1], sol[2])/sol[0])**2)), 'om': float(np.arctan2(sol[2], sol[1])), 'ths': ths.tolist(), 'r': r.tolist()}
