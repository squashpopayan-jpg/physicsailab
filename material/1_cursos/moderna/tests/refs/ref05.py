# Cap. 5: Doppler y aberración por transformación explícita del cuadrivector del fotón; Cherenkov por conservación del cuadrimomento;
# campos por la transformación del tensor F^{μν}; carga en movimiento por los campos de Liénard–Wiechert (tiempo retardado numérico)
def boost_x(E, px, py, b):
    g = 1/math.sqrt(1-b*b); return g*(E - b*px), g*(px - b*E), py
# Doppler: fuente en reposo en S′, que se mueve con velocidad b respecto del observador S. Fotón emitido en S′ a ángulo th* respecto del movimiento
def doppler_numeric(b, th_star):
    E0, px0, py0 = 1.0, math.cos(th_star), math.sin(th_star)      # fotón en el sistema de la fuente (frecuencia 1)
    E, px, py = boost_x(E0, px0, py0, -b)                         # al sistema del observador (la fuente se mueve con +b)
    return dict(b=b, th_star=th_star, f=E, th=math.atan2(py, px))
ref['doppler'] = [doppler_numeric(b, ts) for b in (0.1, 0.5, 0.9, 0.99) for ts in (0.0, 0.7, math.pi/2, 2.5, math.pi)]
# Cherenkov: partícula de masa m con momento p emite un fotón (energía hw, índice n: |k| = n hw/c); se resuelve el ángulo con conservación exacta de E y p
def cherenkov_exact(m, p, hw, n):
    E = math.hypot(p, m); kk = n*hw
    # p' = p − k, E' = E − hw con E'² = p'² + m² → cos θ = (p² + k² − (p'^2)) / (2 p k)
    f = lambda c_: (E-hw)**2 - ((p - kk*c_)**2 + (kk*math.sqrt(max(0.0, 1-c_*c_)))**2) - m*m
    c_ = optimize.brentq(f, 0.0, 1.0, xtol=1e-15, rtol=1e-15)
    return c_
ref['cherenkov'] = []
for (m, K_, n) in ((0.51099895, 5.0, 1.333), (105.6583755, 500.0, 1.333), (938.272, 5000.0, 1.5), (0.51099895, 50.0, 1.0003)):
    E = K_+m; p = math.sqrt(E*E-m*m); b = p/E; hw = 2.5e-6    # 2.5 eV
    ref['cherenkov'].append(dict(m=m, K=K_, n=n, cos_exact=cherenkov_exact(m, p, hw, n), beta=b))
# Transformación de campos mediante Λ F Λᵀ con F^{μν} (signatura +−−−, unidades c = 1)
def F_of(E, B):
    Ex, Ey, Ez = E; Bx, By, Bz = B
    return np.array([[0, -Ex, -Ey, -Ez], [Ex, 0, -Bz, By], [Ey, Bz, 0, -Bx], [Ez, -By, Bx, 0]], float)
def fields_from_F(F):
    return [F[1, 0], F[2, 0], F[3, 0]], [F[3, 2], F[1, 3], F[2, 1]]
def boost_matrix(b):
    g = 1/math.sqrt(1-b*b); L = np.eye(4); L[0, 0] = L[1, 1] = g; L[0, 1] = L[1, 0] = -g*b; return L
ref['fields'] = []
rng = np.random.default_rng(5)
for b in (0.3, 0.8, 0.95):
    E = rng.normal(size=3); B = rng.normal(size=3)
    L = boost_matrix(b); Fp = L @ F_of(E, B) @ L.T; Ep, Bp = fields_from_F(Fp)
    ref['fields'].append(dict(b=b, E=E.tolist(), B=B.tolist(), Ep=list(map(float, Ep)), Bp=list(map(float, Bp)), inv1=float(E@E-B@B), inv2=float(E@B)))
# Liénard–Wiechert: carga con velocidad uniforme b a lo largo de x; campo en (x, y) en t = 0 (la carga está en el origen en t = 0)
def lw_field(b, x, y):
    # tiempo retardado: la carga estaba en (b t_r, 0); la señal sale en t_r < 0 y llega en t = 0: |r − r_q(t_r)| = −t_r (c = 1)
    f = lambda tr: math.hypot(x-b*tr, y) + tr
    tr = optimize.brentq(f, -1e6, 0.0, xtol=1e-15, rtol=1e-15)
    Rx, Ry = x-b*tr, y; R_ = math.hypot(Rx, Ry); nx, ny = Rx/R_, Ry/R_
    g2 = 1-b*b; k = 1-(nx*b)
    Ex = g2*(nx-b)/(k**3*R_**2); Ey = g2*ny/(k**3*R_**2)
    return Ex, Ey
ref['lw'] = []
for b in (0.3, 0.6, 0.9):
    for th in (0.0, 0.5, 1.0, math.pi/2, 2.2):
        r_ = 1.7; x, y = r_*math.cos(th), r_*math.sin(th)
        Ex, Ey = lw_field(b, x, y)
        ref['lw'].append(dict(b=b, th=th, r=r_, E=math.hypot(Ex, Ey), Ex=Ex, Ey=Ey, ang=math.atan2(Ey, Ex)))
# Integral del ángulo sólido: ∫ D² dΩ = 4π (cuadratura)
ref['beam_norm'] = [dict(b=b, I=float(integrate.quad(lambda th: 2*math.pi*math.sin(th)/(math.gamma(1)*(1/math.sqrt(1-b*b)*(1-b*math.cos(th)))**2), 0, math.pi, epsabs=0, epsrel=1e-13)[0])) for b in (0.1, 0.6, 0.99)]
# Alambre de Purcell con SymPy: la fuerza magnética sobre una carga que viaja con la corriente se obtiene de la electrostática
_q, _I, _d, _v, _c, _e0 = sp.symbols('q I d v c e0', positive=True)
_g = 1/sp.sqrt(1-_v**2/_c**2)
_lam = -_g*_v*_I/_c**2      # densidad de carga lineal neta de un hilo neutro con corriente I visto desde el sistema de la carga
_E = _lam/(2*sp.pi*_e0*_d)
_F = sp.simplify(_q*_E/_g)  # fuerza en el sistema del laboratorio = F′/γ (la fuerza transversal transforma así)
ref['purcell_ratio'] = float(sp.simplify((-_F/(_q*_v*_I/(2*sp.pi*_e0*_c**2*_d)))).subs({_q: 1, _I: 1, _d: 1, _v: 0.3, _c: 1, _e0: 1}))
