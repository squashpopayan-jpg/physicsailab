# Cap. 2: transformación de Lorentz (SymPy/numpy), muón (PDG vía `particle`), Fizeau (impulso directo del par de sucesos)
from particle import Particle
_mu = Particle.from_pdgid(13)
ref['muon'] = dict(tau=float(_mu.lifetime)*1e-9, mass_MeV=float(_mu.mass))
# Invariancia del intervalo y composición de impulsos: matrices 2x2 numéricas
def lam(b):
    g = 1/math.sqrt(1-b*b); return np.array([[g, -g*b], [-g*b, g]])   # actúa sobre (ct, x)
ref['boost_chain'] = []
for betas in ((0.3, 0.5), (0.5, 0.5, 0.5), (0.9, -0.2, 0.7), (0.99, 0.99)):
    M = np.eye(2)
    for b in betas: M = lam(b) @ M
    ref['boost_chain'].append(dict(betas=list(betas), M=M.tolist(), w=float(np.tanh(sum(np.arctanh(b) for b in betas)))))
# Fizeau: el medio (n, v) visto desde el laboratorio: la luz en el medio recorre (x', t') = (L, nL/c); se hace el impulso y se divide
def fizeau_u(n, v):
    b = v/c; g = 1/math.sqrt(1-b*b); L = 1.0; xp, tp = L, n*L/c
    x = g*(xp + b*c*tp); t = g*(tp + b*xp/c); return x/t
ref['fizeau'] = [dict(n=n, v=v, u=fizeau_u(n, v)) for (n, v) in ((1.333, 7.059), (1.333, 1e6), (1.5, 1e7), (1.0003, 30.0), (2.4, 5e7))]
# Supervivencia de muones: integración numérica de la ley exponencial en el tiempo propio
def surv_num(h, g, tau):
    b = math.sqrt(1-1/g**2); tlab = h/(b*c); tp = tlab/g
    return math.exp(-tp/tau)
ref['muon_surv'] = [dict(h=h, g=g, S=surv_num(h, g, ref['muon']['tau'])) for (h, g) in ((15e3, 15.8193), (15e3, 28.3934), (10e3, 5.0), (20e3, 40.0))]
# Fórmula de Fizeau con SymPy: serie de u a primer orden en v
_n, _v, _c = sp.symbols('n v c', positive=True)
_u = (_c/_n + _v)/(1 + _v/(_n*_c)); ref['fizeau_series_coef'] = float(sp.series(_u, _v, 0, 2).removeO().coeff(_v, 1).subs({_n: 1.333, _c: 1}))
