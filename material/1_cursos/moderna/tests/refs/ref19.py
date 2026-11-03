# Cap. 19: estadística cuántica — integrales de Fermi–Dirac con mpmath, μ(T) por cuadratura de SciPy, Debye por quad, conteo directo de las ocupaciones
from scipy.integrate import quad
from scipy.optimize import brentq
import mpmath as mpm
mpm.mp.dps = 30
hb = C.hbar; me_ = C.m_e
def FD_mp(j, eta): return float(mpm.re(-mpm.gamma(j+1)*mpm.polylog(j+1, -mpm.exp(eta))))
ref['fdint'] = [dict(j=j, eta=eta, F=FD_mp(j, eta)) for j in (0.5, 1.5, 2.0) for eta in (-2.0, 0.0, 1.0, 5.0, 50.0, 500.0)]
# potencial químico de un gas de electrones libres (n de Cu = 8.47e28 m⁻³) por integración numérica de g(ε) f(ε) y brentq
def mu_num(n, T):
    kT = C.k*T; g0 = (2*me_/hb**2)**1.5/(2*math.pi**2)
    EF = hb**2*(3*math.pi**2*n)**(2/3)/(2*me_)
    N_ = lambda mu: quad(lambda x: g0*math.sqrt(x*kT)/(math.exp(min((x*kT-mu)/kT, 700))+1)*kT, 0, 60+max(mu/kT, 0), limit=500, epsabs=0, epsrel=1e-12)[0]
    return brentq(lambda mu: N_(mu)-n, -50*kT, 2*EF, xtol=1e-30, rtol=1e-13)
n_cu = 8.47e28
ref['mu19'] = [dict(n=n_cu, T=T, mu=mu_num(n_cu, T)) for T in (300, 3000, 30000, 100000)]
ref['EF'] = dict(n=n_cu, EF=hb**2*(3*math.pi**2*n_cu)**(2/3)/(2*me_), TF=hb**2*(3*math.pi**2*n_cu)**(2/3)/(2*me_)/C.k, vF=hb*(3*math.pi**2*n_cu)**(1/3)/me_)
# Debye por quad
R_ = C.R
def debye_q(T, th): return 9*R_*(T/th)**3*quad(lambda x: x**4*math.exp(x)/math.expm1(x)**2, 0, th/T, epsabs=0, epsrel=1e-13)[0]
ref['debye'] = [dict(T=T, th=th, C=debye_q(T, th)) for (T, th) in ((300, 343), (10, 343), (50, 343), (300, 2230), (100, 645), (5, 105), (150, 165))]
ref['einstein'] = [dict(T=T, th=th, C=3*R_*(th/T)**2*math.exp(th/T)/math.expm1(th/T)**2) for (T, th) in ((300, 1320), (100, 1320), (300, 240), (20, 240))]
ref['zeta32'] = float(mpm.zeta(1.5))
# conteo directo de las ocupaciones medias (suma sobre los números de ocupación de un nivel)
def occ_direct(x, kind):
    if kind == 'fd': ns = range(0, 2)
    elif kind == 'be': ns = range(0, 3000)
    else: return None
    w = [math.exp(-n*x) for n in ns]; return sum(n*wi for n, wi in zip(ns, w))/sum(w)
ref['occ'] = [dict(x=x, fd=occ_direct(x, 'fd'), be=occ_direct(x, 'be')) for x in (0.05, 0.5, 1.0, 3.0, 8.0)] + [dict(x=-2.0, fd=occ_direct(-2.0, 'fd'), be=None)]
