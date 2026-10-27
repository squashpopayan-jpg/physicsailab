import numpy as np

def run(R):
    rng = np.random.default_rng(1)
    n, steps, sigma = 20000, 100, 1.0
    p = np.cumsum(rng.normal(0, sigma, (steps, n, 2)), axis=0)
    R['msd_np_100'] = float(np.mean(np.sum(p[-1]**2, axis=1)))
    R['juliano_drift_1257'] = (365.25 - 365.24219) * 1257
    R['greg_mean'] = 365 + 97/400
    R['greg_leap_count_400'] = sum(1 for y in range(2000, 2400) if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0)
