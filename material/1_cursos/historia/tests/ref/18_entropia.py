import numpy as np
from scipy import stats, special, constants as sc

def run(R):
    rng = np.random.default_rng(3)
    # Colisión 2D: conservación y distribución de Rayleigh como referencia
    N = 3000
    th = rng.uniform(0, 2*np.pi, N)
    v = np.c_[np.cos(th), np.sin(th)]
    # referencia: la media de la rapidez de Maxwell 2D con kT/m = 0.5 es sqrt(pi*0.5/2)... se compara con scipy.stats.rayleigh
    R['rayleigh'] = {'mean_s2_0_5': float(stats.rayleigh(scale=np.sqrt(0.5)).mean()), 'cdf1': float(stats.rayleigh(scale=np.sqrt(0.5)).cdf(1.0)), 'pdf1': float(stats.rayleigh(scale=np.sqrt(0.5)).pdf(1.0))}
    R['lnbinom'] = {str(n): float(special.gammaln(41) - special.gammaln(n+1) - special.gammaln(41-n)) for n in (0, 5, 20, 33)}
    R['lnbinom_20_10'] = float(special.gammaln(21) - 2*special.gammaln(11))
    # Perrin
    kB = sc.k; T = 293.0; r = 0.212e-6; drho = 206.0
    mp = 4/3*np.pi*r**3*drho
    hs = kB*T/(mp*sc.g)
    R['perrin'] = {'hs': float(hs), 'NA': float(sc.R*T/(mp*sc.g*hs)), 'NA_exact': sc.N_A}
    # Kelvin
    R['kelvin'] = float(3900**2/(np.pi*1.18e-6*0.0365**2)/(365.25*86400)/1e6)
    R['landauer'] = float(sc.k*300*np.log(2))
    # Urna de Ehrenfest: distribución estacionaria binomial; media de n tras muchos pasos ≈ N/2 y varianza N/4
    Nb = 40; g = np.random.default_rng(1); n = Nb; vals = []
    for i in range(400000):
        n = n-1 if g.random() < n/Nb else n+1
        if i > 1000: vals.append(n)
    vals = np.array(vals)
    R['ehr'] = {'mean': float(vals.mean()), 'var': float(vals.var())}
