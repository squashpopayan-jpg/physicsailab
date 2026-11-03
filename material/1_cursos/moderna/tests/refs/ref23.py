# Cap. 23: radiactividad — cadenas de Bateman por scipy.linalg.expm y DOP853, WKB de Gamow por quad, espectro β por quad
from scipy.linalg import expm as _expm
from scipy.integrate import quad as _quad, solve_ivp as _ivp
_YR = 365.25*86400
def _chain(lams, N0, ts):
    n = len(lams); M = np.zeros((n, n))
    for i in range(n):
        M[i, i] = -lams[i]
        if i > 0: M[i, i-1] = lams[i-1]
    out = []
    for t in ts: v = _expm(M*t)@np.eye(n)[:, 0]*N0; out.append([float(x) for x in v])
    return out
_ln2 = math.log(2)
_chains = {
    'mo99': dict(lam=[_ln2/(65.94*3600), _ln2/(6.0067*3600), _ln2/(2.111e5*_YR)], ts=[1*3600, 6*3600, 23*3600, 66*3600, 150*3600]),
    'rn': dict(lam=[_ln2/(3.8235*86400), _ln2/(3.098*60), _ln2/(26.8*60), _ln2/(19.9*60)], ts=[10*60, 3600, 6*3600, 86400, 5*86400]),
    'gen': dict(lam=[1.0, 0.7, 0.3, 0.11, 0.05], ts=[0.5, 2.0, 6.0, 15.0, 40.0]),
}
ref['bate'] = {k: dict(lam=v['lam'], ts=v['ts'], N=_chain(v['lam'], 1e6, v['ts'])) for k, v in _chains.items()}
# DOP853 para la cadena del Mo-99 (tres miembros)
_l = _chains['mo99']['lam']; _s = _ivp(lambda t, y: [-_l[0]*y[0], _l[0]*y[0]-_l[1]*y[1], _l[1]*y[1]-_l[2]*y[2]], (0, 150*3600), [1e6, 0, 0], method='DOP853', t_eval=[23*3600, 150*3600], rtol=1e-12, atol=1e-6)
ref['bate_ode'] = [[float(x) for x in _s.y[:, i]] for i in range(2)]
# Gamow: ∫_R^b √(2μ(V − Q))/ħ dr por quad
_hbarc = 197.3269804; _ac = 1.43996448; _uMeV = 931.49410242
def _g2(Z1, Z2, A1, A2, Q, R):
    mu = A1*A2*_uMeV/(A1+A2); b = _ac*Z1*Z2/Q
    return 2*_quad(lambda r: math.sqrt(max(0.0, 2*mu*(_ac*Z1*Z2/r-Q)))/_hbarc, R, b, epsabs=0, epsrel=1e-12, limit=400)[0]
ref['gamow'] = [dict(Z=Z, A=A, Q=Q, R=1.2*((A-4)**(1/3)+4**(1/3)), G2=_g2(2, Z-2, 4, A-4, Q, 1.2*((A-4)**(1/3)+4**(1/3)))) for (Z, A, Q) in ((84, 212, 8.954), (84, 210, 5.408), (88, 226, 4.871), (92, 238, 4.270), (90, 232, 4.082))]
# espectro β: media con quad (F de Fermi no relativista)
_me = 0.51099895; _al = 1/137.035999084
def _S(T, Zd, Q):
    W = T+_me; p = math.sqrt(W*W-_me**2); eta = Zd*_al*W/p; x = 2*math.pi*eta; F = x/(-math.expm1(-x)) if abs(x) > 1e-8 else 1.0; return F*p*W*(Q-T)**2
def _beta_mean(Zd, Q):
    n = _quad(lambda T: _S(T, Zd, Q), 0, Q, epsabs=0, epsrel=1e-12, limit=400)[0]; m = _quad(lambda T: T*_S(T, Zd, Q), 0, Q, epsabs=0, epsrel=1e-12, limit=400)[0]; return m/n
ref['betamean'] = [dict(Zd=Zd, Q=Q, T=_beta_mean(Zd, Q)) for (Zd, Q) in ((2, 0.018591), (7, 0.1565), (16, 1.7107), (28, 2.8228), (56, 1.1756))]
