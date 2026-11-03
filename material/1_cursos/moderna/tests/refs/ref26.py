# Cap. 26: aceleradores y detectores — luminosidad con dblquad, rango CSDA con quad, sección eficaz μμ por integración angular, α(Q) por solve_ivp, ciclotrón relativista por DOP853
from scipy.integrate import dblquad as _dq, quad as _q4, solve_ivp as _iv4
from scipy.optimize import brentq as _bq4
# luminosidad: ∫ρ₁ρ₂ dx dy para dos haces gaussianos idénticos con σx ≠ σy
def _lum(N, f, nb, sx, sy):
    g = lambda y, x: (math.exp(-x*x/(2*sx*sx)-y*y/(2*sy*sy))/(2*math.pi*sx*sy))**2
    I = _dq(g, -8*sx, 8*sx, -8*sy, 8*sy, epsabs=0, epsrel=1e-10)[0]; return N*N*f*nb*I*1e-4
ref['lumi'] = [dict(N=1.15e11, f=11245.5, nb=2808, sx=16.6e-6, sy=16.6e-6, L=_lum(1.15e11, 11245.5, 2808, 16.6e-6, 16.6e-6)), dict(N=2.0e10, f=40000.0, nb=500, sx=20e-6, sy=5e-6, L=_lum(2.0e10, 40000.0, 500, 20e-6, 5e-6))]
# Bethe–Bloch y rango CSDA con quad
def _bethe(T, Mp, ZA, I_eV, z=1):
    me = 0.51099895; g = 1+T/Mp; b2 = 1-1/g**2; bg2 = g*g-1; Tmax = 2*me*bg2/(1+2*g*me/Mp+(me/Mp)**2); I = I_eV*1e-6
    return 0.307075*z*z*ZA/b2*(0.5*math.log(2*me*bg2*Tmax/I**2)-b2)
ref['range'] = [dict(T=T, R=_q4(lambda t: 1/_bethe(t, 938.272, 0.5551, 75), 0.5, T, epsabs=0, epsrel=1e-12)[0]) for T in (10, 50, 100, 150, 200)]
# e+e- → μ+μ-: integral angular de dσ/dΩ = α²(1+cos²θ)/(4s)
_al = 1/137.035999084
ref['mumu'] = [dict(rs=rs, nb=2*math.pi*_q4(lambda c_: _al**2/(4*rs*rs)*(1+c_*c_), -1, 1)[0]*0.3893793721e6) for rs in (3.0, 10.0, 30.0, 91.1876)]
# invariantes con vectores de cuatro componentes (NumPy) y umbral por brentq
def _s_collider(E1, E2, m=0.938272):
    p1 = math.sqrt(E1**2-m*m); p2 = math.sqrt(E2**2-m*m); P = np.array([E1+E2, 0, 0, p1-p2]); return float(P[0]**2-P[3]**2)
def _s_fixed(E, m=0.938272):
    p = math.sqrt(E**2-m*m); P = np.array([E+m, 0, 0, p]); return float(P[0]**2-P[3]**2)
ref['inv'] = dict(coll=_s_collider(6800., 6800.), fix=_s_fixed(9.8564e7), thr=_bq4(lambda T: _s_fixed(T+0.938272)-(4*0.938272)**2, 0.01, 50))
# α(Q) por integración de la ecuación del grupo de renormalización a un lazo (solve_ivp), con umbrales
_m = [(0.000511, 1, 1), (0.1057, 1, 1), (1.777, 1, 1), (0.3, 3, 4/9), (0.3, 3, 1/9), (0.5, 3, 1/9), (1.5, 3, 4/9), (4.5, 3, 1/9)]
def _alpha_ode(Q):
    # d(1/α)/d ln Q² = −(1/3π) Σ_{m<Q} N_c q²; se integra por tramos entre los umbrales
    ths = sorted(set(m for m, _, _ in _m)); inv = 1/_al; prev = 0.0
    pts = [t for t in ths if t < Q]+[Q]
    lo = None
    for i, hi in enumerate(pts):
        pass
    inv = 1/_al
    def f(lnQ2, y, act): return [-(1/(3*math.pi))*sum(Nc*q2 for m_, Nc, q2 in act)]
    edges = [m_ for m_ in sorted(set(m for m, _, _ in _m)) if m_ < Q]
    for k, m0 in enumerate(edges):
        m1 = edges[k+1] if k+1 < len(edges) else Q; act = [x for x in _m if x[0] <= m0]
        s = _iv4(lambda t, y: f(t, y, act), (math.log(m0*m0), math.log(m1*m1)), [inv], rtol=1e-12, atol=1e-12); inv = s.y[0][-1]
    return 1/inv
ref['arun'] = [dict(Q=Q, a=_alpha_ode(Q)) for Q in (1.0, 10.0, 91.1876)]
# ciclotrón relativista: periodo por DOP853 (protón en B = 1.5 T, γ = 1 y γ = 1.5)
def _cyc(gamma, B=1.5):
    m = C.m_p; q = C.e; v0 = C.c*math.sqrt(1-1/gamma**2); p0 = gamma*m*v0
    f = lambda t, y: [y[2]/(math.sqrt(m*m+(y[2]**2+y[3]**2)/C.c**2)), y[3]/(math.sqrt(m*m+(y[2]**2+y[3]**2)/C.c**2)), q*y[3]/math.sqrt(m*m+(y[2]**2+y[3]**2)/C.c**2)*B, -q*y[2]/math.sqrt(m*m+(y[2]**2+y[3]**2)/C.c**2)*B]
    T0 = 2*math.pi*gamma*m/(q*B); ev = lambda t, y: y[0]; ev.direction = 1; ev.terminal = False
    s = _iv4(f, (0, 1.5*T0), [0, 0, p0, 0], method='DOP853', rtol=1e-12, atol=[1e-12, 1e-12, 1e-30, 1e-30], events=ev, max_step=T0/200)
    te = [t for t in s.t_events[0] if t > 0.2*T0]; return float(te[0]) if te else None
ref['cyc'] = [dict(gamma=g, T=_cyc(g)) for g in (1.0001, 1.5, 3.0)]
