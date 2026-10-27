import numpy as np
from scipy import stats

def run(R):
    gaps = [9, 1, 2, 1, 0, 0, 1, 14, 3, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    R['gaps_median'] = float(np.median(gaps)); R['gaps_mean'] = float(np.mean(gaps)); R['gaps_n'] = len(gaps)
    R['psim'] = [[n, r, w, float(stats.expon(scale=1/((n-1)*r)).cdf(w))] for n, r, w in ((2, 0.2, 2.0), (5, 0.2, 2.0), (10, 0.3, 1.0), (3, 0.05, 5.0))]
    rng = np.random.default_rng(3)
    n, r, w = 5, 0.2, 2.0
    t = np.sort(rng.exponential(1/r, size=(200000, n)), axis=1)
    R['mc'] = [n, r, w, float(np.mean(t[:, 1]-t[:, 0] < w))]
