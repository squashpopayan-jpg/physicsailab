import mpmath as mp
from scipy import constants as sc

def run(R):
    mp.mp.dps = 60
    c = mp.mpf(sc.c)
    def delta(L, v):
        b2 = (mp.mpf(v)/c)**2
        return float(c*(2*mp.mpf(L)/c)*(1/(1-b2) - 1/mp.sqrt(1-b2)))
    R['mm'] = [[L, v, delta(L, v)] for L, v in ((11.0, 29780.0), (11.0, 5000.0), (1.2, 29780.0), (11.0, 3e7))]
    # Fizeau: composición relativista de velocidades (mpmath) y expansión de primer orden de Fresnel
    n = mp.mpf(4)/3; v = mp.mpf(7)
    u = (c/n + v)/(1 + v/(n*c))
    R['fizeau_rel'] = float(u - c/n)
    R['fresnel_k'] = float(1 - 1/n**2)
    R['sc_c'] = float(sc.c)
