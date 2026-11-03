# Cap. 4: dinámica relativista con referencias independientes
from particle import Particle
import periodictable as _pt
_names = {'mu': 13, 'pi': 211, 'pi0': 111, 'K': 321, 'W': 24, 'Z': 23, 'H': 25, 'tau': 15, 'top': 6, 'e': 11}
ref['pdg_mass'] = {k: float(Particle.from_pdgid(v).mass) for k, v in _names.items()}
ref['codata_mass'] = dict(e=C.physical_constants['electron mass energy equivalent in MeV'][0], p=C.physical_constants['proton mass energy equivalent in MeV'][0],
                         n=C.physical_constants['neutron mass energy equivalent in MeV'][0], d=C.physical_constants['deuteron mass energy equivalent in MeV'][0],
                         u=C.physical_constants['atomic mass constant energy equivalent in MeV'][0])
# Trabajo de una fuerza constante: m dv/dt = F/γ³ → K = F·x se integra numéricamente y se compara con (γ−1)mc² (unidades c = m = 1)
def work_K(F, x_end):
    f = lambda t, y: [y[1], F*(1-y[1]**2)**1.5, 0]
    ev = lambda t, y: y[0]-x_end
    ev.terminal = True
    sol = integrate.solve_ivp(f, [0, 1e3], [0.0, 0.0, 0.0], method='DOP853', rtol=1e-13, atol=1e-13, events=ev)
    v = sol.y_events[0][0][1]; g = 1/math.sqrt(1-v*v); return dict(F=F, x=x_end, gamma=g, K_work=F*x_end, K_formula=g-1)
ref['work'] = [work_K(F, x) for (F, x) in ((1.0, 1.0), (0.5, 4.0), (2.0, 10.0), (0.1, 30.0))]
# Umbral por búsqueda numérica: menor energía del haz para la que √s ≥ Σ masas finales (boost explícito de cuadrivectores)
mp.mp.dps = 60
def sqrts_fixed(m1, E1, m2):
    # s = (E1 + m2)² − p1² con aritmética de 60 dígitos (evita la cancelación catastrófica a energías muy grandes)
    m1, E1, m2 = mp.mpf(m1), mp.mpf(E1), mp.mpf(m2)
    p1sq = E1*E1-m1*m1; Et = E1+m2
    return mp.sqrt(Et*Et-p1sq)
def threshold_numeric(m1, m2, Mf):
    f = lambda K: sqrts_fixed(m1, mp.mpf(m1)+K, m2) - mp.mpf(Mf)
    return float(mp.findroot(f, (mp.mpf(0), mp.mpf(10)**14), solver='anderson', tol=1e-40, maxsteps=500))
mp_ = ref['codata_mass']['p']; me_ = ref['codata_mass']['e']
ref['threshold'] = [dict(name='pp→pppp̄', m1=mp_, m2=mp_, Mf=4*mp_, K=threshold_numeric(mp_, mp_, 4*mp_)),
                    dict(name='pp→ppπ⁰', m1=mp_, m2=mp_, Mf=2*mp_+ref['pdg_mass']['pi0'], K=threshold_numeric(mp_, mp_, 2*mp_+ref['pdg_mass']['pi0'])),
                    dict(name='e⁺e⁻ fijo→Z', m1=me_, m2=me_, Mf=ref['pdg_mass']['Z'], K=threshold_numeric(me_, me_, ref['pdg_mass']['Z'])),
                    dict(name='γ-protón→π⁰p (masa 0 del fotón)', m1=0.0, m2=mp_, Mf=mp_+ref['pdg_mass']['pi0'], K=threshold_numeric(0.0, mp_, mp_+ref['pdg_mass']['pi0']))]
# Desintegración de dos cuerpos: p tal que √(m₁²+p²)+√(m₂²+p²) = M (brentq)
def two_body(M, m1, m2):
    return optimize.brentq(lambda p: math.sqrt(m1*m1+p*p)+math.sqrt(m2*m2+p*p)-M, 0, M, xtol=1e-14, rtol=1e-14)
pm = ref['pdg_mass']
ref['twobody'] = [dict(name='π⁺→μ⁺ν', M=pm['pi'], m1=pm['mu'], m2=0.0, p=two_body(pm['pi'], pm['mu'], 0.0)),
                  dict(name='Z→e⁺e⁻', M=pm['Z'], m1=me_, m2=me_, p=two_body(pm['Z'], me_, me_)),
                  dict(name='K⁺→π⁺π⁰', M=pm['K'], m1=pm['pi'], m2=pm['pi0'], p=two_body(pm['K'], pm['pi'], pm['pi0'])),
                  dict(name='H→ττ', M=pm['H'], m1=pm['tau'], m2=pm['tau'], p=two_body(pm['H'], pm['tau'], pm['tau']))]
# π⁰→γγ: emisión isotrópica en el sistema del π⁰ y boost explícito (cuadrivectores) → energías y ángulo entre fotones
def pi0_gg(m, E, n=20001):
    g = E/m; b = math.sqrt(1-1/g**2)
    cs = np.linspace(-1, 1, n)
    E1 = g*(m/2)*(1+b*cs); E2 = g*(m/2)*(1-b*cs)       # fotón 1 con cosθ* y su opuesto
    # ángulo de apertura: componentes del momento en el sistema del laboratorio
    sn = np.sqrt(1-cs**2)
    p1 = np.array([g*(m/2)*(cs+b), (m/2)*sn]); p2 = np.array([g*(m/2)*(-cs+b), -(m/2)*sn])
    cosang = (p1[0]*p2[0]+p1[1]*p2[1])/(np.hypot(*p1)*np.hypot(*p2))
    return dict(m=m, E=E, Emin=float(E1.min()), Emax=float(E1.max()), thetaMin=float(np.degrees(np.arccos(cosang.max()))), mass_check=float(np.sqrt(2*E1*E2*(1-cosang)).mean()))
ref['pi0gg'] = [pi0_gg(pm['pi0'], E) for E in (200.0, 1000.0, 5000.0)]
# Q de Cockcroft–Walton con masas atómicas de periodictable (AME)
ref['qCW'] = float(((_pt.elements.Li[7].mass+_pt.elements.H[1].mass)-2*_pt.elements.He[4].mass)*ref['codata_mass']['u'])
ref['mass_u'] = dict(Li7=_pt.elements.Li[7].mass, H1=_pt.elements.H[1].mass, He4=_pt.elements.He[4].mass)
# colisión elástica simétrica: suma de γmv y de mv antes y después, en el sistema de laboratorio (boost de velocidades por la fórmula de adición)
def elastic_boost(beta_cm=0.6, theta_deg=40.0, boost=0.5):
    th = math.radians(theta_deg)
    gb = 1/math.sqrt(1-boost**2)
    def vel_boost(vx, vy):    # velocidades en el sistema que se mueve a -boost respecto del CM (el CM se ve moverse con +boost)
        d = 1 + boost*vx
        return ((vx+boost)/d, vy/(gb*d))
    before = [vel_boost(beta_cm, 0.0), vel_boost(-beta_cm, 0.0)]
    after = [vel_boost(beta_cm*math.cos(th), beta_cm*math.sin(th)), vel_boost(-beta_cm*math.cos(th), -beta_cm*math.sin(th))]
    def sums(vs, rel):
        px = sum((1/math.sqrt(1-(vx*vx+vy*vy)) if rel else 1)*vx for vx, vy in vs); py = sum((1/math.sqrt(1-(vx*vx+vy*vy)) if rel else 1)*vy for vx, vy in vs)
        return px, py
    return dict(rel_before=sums(before, True), rel_after=sums(after, True), new_before=sums(before, False), new_after=sums(after, False), vel_before=before, vel_after=after)
ref['elastic'] = elastic_boost()
