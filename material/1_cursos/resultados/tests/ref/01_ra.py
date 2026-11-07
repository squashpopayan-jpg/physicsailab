"""Referencias independientes (NumPy, SciPy, scikit-learn) para tests/t-01-ra.js"""
import numpy as np
from scipy import stats
from sklearn.metrics import cohen_kappa_score


def expand(M):
    a, b = [], []
    for i, r in enumerate(M):
        for j, c in enumerate(r):
            a += [i] * c
            b += [j] * c
    return a, b


def run(R):
    M1 = [[20, 5, 1, 0], [4, 18, 6, 1], [1, 5, 15, 4], [0, 1, 3, 16]]
    M2 = [[12, 3, 0], [2, 14, 4], [1, 3, 11]]
    for k, M in (('m1', M1), ('m2', M2)):
        a, b = expand(M)
        R['kappa_' + k] = float(cohen_kappa_score(a, b))
        R['kappa_lin_' + k] = float(cohen_kappa_score(a, b, weights='linear'))
        R['kappa_cuad_' + k] = float(cohen_kappa_score(a, b, weights='quadratic'))
        R['acuerdo_' + k] = float(np.mean(np.array(a) == np.array(b)))
    R['M1'] = M1
    R['M2'] = M2

    rng = np.random.default_rng(7)
    X = np.clip(np.round(rng.normal(3, 1, (25, 1)) + rng.normal(0, 0.6, (25, 5))), 1, 5)
    k = X.shape[1]
    R['alfa_X'] = X.tolist()
    R['alfa'] = float(k / (k - 1) * (1 - X.var(axis=0, ddof=1).sum() / X.sum(axis=1).var(ddof=1)))

    for conf in (0.80, 0.85, 0.90, 0.95, 0.99):
        R['z_%d' % round(conf * 100)] = float(stats.norm.ppf(0.5 + conf / 2))

    def n_fin(N, e, conf, p=0.5):
        z = stats.norm.ppf(0.5 + conf / 2)
        n0 = z * z * p * (1 - p) / (e * e)
        return int(np.ceil(n0 / (1 + (n0 - 1) / N)))

    R['muestra'] = [[N, e, c, n_fin(N, e, c)] for N, e, c in
                    [(120, 0.05, 0.95), (60, 0.10, 0.90), (400, 0.05, 0.95), (35, 0.05, 0.95), (1000, 0.03, 0.99)]]

    def wilson(x, n, conf):
        z = stats.norm.ppf(0.5 + conf / 2)
        p = x / n
        c = (p + z * z / (2 * n)) / (1 + z * z / n)
        h = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
        return [float(c - h), float(c + h)]

    casos = [(18, 25), (7, 30), (50, 60)]
    R['wilson'] = [[x, n, 0.95] + wilson(x, n, 0.95) for x, n in casos]
    # Intervalo exacto de Clopper-Pearson como cota de comparación
    R['cp'] = [[x, n, float(stats.beta.ppf(0.025, x, n - x + 1)), float(stats.beta.ppf(0.975, x + 1, n - x))] for x, n in casos]
