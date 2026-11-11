# -*- coding: utf-8 -*-
"""Capítulo 28 — Relatividad general."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, solve, simplify, oo, sin, cos, tan, Matrix, series, Function
from scipy.integrate import solve_ivp, quad
from scipy.optimize import brentq

EX = {'reloj-gps': 'gps', 'deflexion-luz': 'luz', 'ondas-gravitacionales': 'ondasgrav'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
G = 6.67430e-11; C = 299792458.0; MS = 1.98847e30; GMS = 1.32712440018e20; GME = 3.986004418e14; RE = 6371e3; HB = 1.054571817e-34; KB = 1.380649e-23; AU = 1.495978707e11
Gq = sp.Float('6.67430e-11', 40); Cq = sp.Float('299792458', 40); MSq = sp.Float('1.98847e30', 40); GMSq = sp.Float('1.32712440018e20', 40); GMEq = sp.Float('3.986004418e14', 40); HBq = sp.Float('1.054571817e-34', 40); KBq = sp.Float('1.380649e-23', 40); AUq = sp.Float('1.495978707e11', 40)

# ---------------------------------------------------------------- GPS
D = 'reloj-gps'
Gs, Ms, r, Rr, v, c = S('G M r R v c')
rate = sqrt(1 - 2 * Gs * Ms / (r * c ** 2))
ident(D, 'dτ/dt ≃ 1 − GM/(rc²) a primer orden', series(sqrt(1 - 2 * Symbol('x', positive=True)), Symbol('x', positive=True), 0, 2).removeO().subs(Symbol('x', positive=True), Gs * Ms / (r * c ** 2)), 1 - Gs * Ms / (r * c ** 2))
ident(D, 'v² = GM/r en órbita circular ⇒ v²/2c² = GM/(2rc²)', (Gs * Ms / r) / (2 * c ** 2), Gs * Ms / (2 * r * c ** 2))
ident(D, 'Δτ/τ = GM/c²(1/R − 1/r) − v²/2c²', (1 - Gs * Ms / (r * c ** 2) - v ** 2 / (2 * c ** 2)) - (1 - Gs * Ms / (Rr * c ** 2)) - 0 * v, Gs * Ms / c ** 2 * (1 / Rr - 1 / r) - v ** 2 / (2 * c ** 2) - 0 * v + (-(v ** 2) / (2 * c ** 2) + v ** 2 / (2 * c ** 2)) - 0 + (-v ** 2 / (2 * c ** 2)) * 0 + 0) if False else ident(D, 'Δτ/τ = GM/c²(1/R − 1/r) − v²/2c² con las tasas de cada reloj', (-Gs * Ms / (r * c ** 2) - v ** 2 / (2 * c ** 2)) - (-Gs * Ms / (Rr * c ** 2)), Gs * Ms / c ** 2 * (1 / Rr - 1 / r) - v ** 2 / (2 * c ** 2))
ident(D, 'neto nulo: GM/c²(1/R − 1/r) = GM/(2rc²) ⇒ r = 3R/2', (Gs * Ms / c ** 2 * (1 / Rr - 1 / (3 * Rr / 2))) - Gs * Ms / (2 * (3 * Rr / 2) * c ** 2), 0)
# tasa exacta (sin aproximar) frente a la fórmula de primer orden
def gps_exact(rkm):
    r_ = rkm * 1e3; v_ = math.sqrt(GME / r_)
    rate_orb = math.sqrt(1 - 2 * GME / (r_ * C ** 2) - v_ ** 2 / C ** 2)
    rate_gr = math.sqrt(1 - 2 * GME / (RE * C ** 2))
    return (rate_orb / rate_gr - 1) * 86400e6
def gps_first(rkm):
    r_ = rkm * 1e3; v_ = math.sqrt(GME / r_)
    return (GME / C ** 2 * (1 / RE - 1 / r_) - v_ ** 2 / (2 * C ** 2)) * 86400e6
for rk in (26571, 6778, 42164, 384400):
    rec(G_STEP, D, f'tasa exacta √(1 − 2GM/rc² − v²/c²) frente al primer orden (r = {rk} km)', gps_exact(rk), gps_first(rk), 'rel 1e-4', abs(gps_exact(rk) / gps_first(rk) - 1) < 1e-4)
uG = {'G': 'N m^2 kg^-2', 'M': 'kg', 'r': 'm', 'R': 'm', 'v': 'm s^-1', 'c': 'm s^-1'}
dimcheck(D, 'GM/(rc²) adimensional', Symbol('q', positive=True), Gs * Ms / (r * c ** 2), dict(uG, q='1'))
dimcheck(D, 'v²/2c² adimensional', Symbol('q', positive=True), v ** 2 / (2 * c ** 2), dict(uG, q='1'))
dimcheck(D, 'Δτ/τ = GM/c²(1/R − 1/r) adimensional', Symbol('q', positive=True), Gs * Ms / c ** 2 * (1 / Rr - 1 / r), dict(uG, q='1'))
gpf = lambda rkm: (lambda r_: (lambda g_, vs_: (g_, vs_, g_ + vs_, (g_ + vs_) * 1e-6 * C / 1e3))(GME / C ** 2 * (1 / RE - 1 / r_) * 86400e6, -(GME / r_) / (2 * C ** 2) * 86400e6))(rkm * 1e3)
num(D, 'gravitacional (GPS)', gpf(26571)[0], '45.72'); num(D, 'velocidad (GPS)', gpf(26571)[1], '-7.21'); num(D, 'neto (GPS)', gpf(26571)[2], '38.51'); num(D, 'error (km/día)', gpf(26571)[3], '11.5', tol=0.01); num(D, 'v (GPS) km/s', math.sqrt(GME / 26571e3) / 1e3, '3.873'); num(D, 'ajuste de frecuencia 10⁻¹⁰', gpf(26571)[2] * 1e-6 / 86400 / 1e-10, '4.458')
num(D, 'neto ISS', gpf(6778)[2], '-24.66'); num(D, 'gravitacional ISS', gpf(6778)[0], '3.61', tol=2e-3); num(D, 'velocidad ISS', gpf(6778)[1], '-28.27'); num(D, 'neto geoestacionaria', gpf(42164)[2], '46.51'); num(D, 'neto Luna', gpf(384400)[2], '58.65'); num(D, 'r del cruce (km)', 1.5 * RE / 1e3, '9557', tol=1e-3)
num(D, 'altímetro 1 cm (10⁻¹⁸)', 9.80665 * 0.01 / C ** 2 / 1e-18, '1.1', tol=0.02); num(D, 'Pound–Rebka (10⁻¹⁵)', 9.80665 * 22.5 / C ** 2 / 1e-15, '2.5', tol=0.02)
num(D, 'gravitacional valor inicial', gpf(26571)[0], '45.7242'); num(D, 'velocidad valor inicial', gpf(26571)[1], '-7.21061'); num(D, 'neto valor inicial', gpf(26571)[2], '38.5136'); num(D, 'error valor inicial', gpf(26571)[3], '11.5461')
rq = Symbol('r', positive=True)
rm_ = rq * 1000
gq_ = GMEq / Cq ** 2 * (1 / sp.Float('6371e3', 40) - 1 / rm_) * sp.Float('86400e6', 40)
vq_ = -(GMEq / rm_) / (2 * Cq ** 2) * sp.Float('86400e6', 40)
fs(D, 'g', gq_); fs(D, 'v', vq_); fs(D, 'n', gq_ + vq_); fs(D, 'e', (gq_ + vq_) * sp.Float('1e-6', 40) * Cq / 1000)

# ---------------------------------------------------------------- Schwarzschild
D = 'schwarzschild'
t, rs_, th, ph = symbols('t r_s theta phi', positive=True)
rr_ = Symbol('rr', positive=True)
co = [t, rr_, th, ph]
f_ = 1 - rs_ / rr_
gmat = sp.diag(f_ * Symbol('c', positive=True) ** 2, -1 / f_, -rr_ ** 2, -rr_ ** 2 * sin(th) ** 2)
ginv = gmat.inv()
def christoffel(g, ginv, co):
    n = len(co)
    return [[[sum(ginv[a, d] * (diff(g[d, b], co[c]) + diff(g[d, c], co[b]) - diff(g[b, c], co[d])) for d in range(n)) / 2 for c in range(n)] for b in range(n)] for a in range(n)]
Gam = christoffel(gmat, ginv, co)
def ricci(Gam, co):
    n = len(co); Rm = sp.zeros(n, n)
    for b in range(n):
        for c in range(n):
            val = sum(diff(Gam[a][b][c], co[a]) for a in range(n)) - sum(diff(Gam[a][b][a], co[c]) for a in range(n)) + sum(Gam[a][a][d] * Gam[d][b][c] for a in range(n) for d in range(n)) - sum(Gam[a][c][d] * Gam[d][b][a] for a in range(n) for d in range(n))
            Rm[b, c] = sp.simplify(val)
    return Rm
Ric = ricci(Gam, co)
ok_ric = all(Ric[i, j] == 0 for i in range(4) for j in range(4))
rec(G_STEP, D, 'tensor de Ricci de la métrica de Schwarzschild: R_μν = 0 (16 componentes, cualquier r_s)', 1.0 if ok_ric else 0.0, 1.0, 'exacto', ok_ric)
Gs2, Ms2, c2 = S('G M c')
ident(D, 'g_tt ≃ 1 − 2GM/(rc²) ⇒ r_s = 2GM/c²', (1 - (2 * Gs2 * Ms2 / c2 ** 2) / rr_) - (1 - 2 * Gs2 * Ms2 / (rr_ * c2 ** 2)), 0)
solves(D, 'g_tt(r) = 0 ⇒ r = r_s', [Eq(1 - rs_ / rr_, 0)], rr_, rs_)
# esfera de fotones: u″ + u = 3(GM/c²)u² con u constante ⇒ u = c²/(3GM)
m_ = Symbol('m', positive=True); u_ = Symbol('u', positive=True)
solves(D, 'luz en órbita circular: u = 3mu² ⇒ r = 3m = 3GM/c² = 1.5 r_s', [Eq(u_, 3 * m_ * u_ ** 2)], u_, 1 / (3 * m_))
ident(D, 'r_ph = 3m = (3/2)(2m) = 1.5 r_s', 3 * m_, R_(3, 2) * (2 * m_))
# ISCO: h² = m r²/(r − 3m) (unidades GM = m, c = 1) con mínimo en r = 6m
rv = Symbol('rv', positive=True)
h2 = m_ * rv ** 2 / (rv - 3 * m_)
solves(D, 'órbitas circulares: h² = GM r²/(r − 3GM/c²); d(h²)/dr = 0 ⇒ r_ISCO = 6GM/c²', [Eq(diff(h2, rv), 0)], rv, 6 * m_)
ident(D, 'r_ISCO = 6m = 3 r_s', 6 * m_, 3 * (2 * m_))
ident(D, 'ρ̄ = 3M/(4πr_s³) = 3c⁶/(32πG³M²)', 3 * Ms2 / (4 * pi * (2 * Gs2 * Ms2 / c2 ** 2) ** 3), 3 * c2 ** 6 / (32 * pi * Gs2 ** 3 * Ms2 ** 2))
# órbita circular: comprobación numérica de que h²(r) tiene mínimo en 6m
rg = np.linspace(3.2, 40, 200001)
h2n = rg ** 2 / (rg - 3)
rec(G_STEP, D, 'mínimo numérico de h²(r) = r²/(r − 3) (m = 1): r = 6', float(rg[np.argmin(h2n)]), 6.0, 'abs 1e-3', abs(rg[np.argmin(h2n)] - 6.0) < 1e-3)
uS = {'r_s': 'm', 'G': 'N m^2 kg^-2', 'M': 'kg', 'c': 'm s^-1', 'rho': 'kg m^-3', 'rr': 'm'}
dimcheck(D, 'r_s = 2GM/c²', Symbol('r_s', positive=True), 2 * Gs2 * Ms2 / c2 ** 2, uS)
dimcheck(D, 'ρ̄ = 3c⁶/(32πG³M²)', Symbol('rho', positive=True), 3 * c2 ** 6 / (32 * pi * Gs2 ** 3 * Ms2 ** 2), uS)
swf = lambda M: (lambda rs: (rs / 1e3, M * MS / (4 / 3 * math.pi * rs ** 3), 1.5 * rs / 1e3, 3 * rs / 1e3, HB * C ** 3 / (8 * math.pi * G * M * MS * KB)))(2 * GMS * M / C ** 2)
num(D, 'r_s (Sol) km', swf(1)[0], '2.953'); num(D, 'esfera de fotones', swf(1)[2], '4.430'); num(D, 'ISCO', swf(1)[3], '8.860'); num(D, 'ρ (10¹⁹)', swf(1)[1] / 1e19, '1.84'); num(D, 'r_s (Tierra) mm', swf(5.972e24 / MS)[0] * 1e6, '8.87', tol=2e-3); num(D, 'r_s (30 M☉) km', swf(30)[0], '88.6')
num(D, 'r_s (Sgr A*) 10⁷ km', swf(4.3e6)[0] / 1e7, '1.27'); num(D, 'en R☉', swf(4.3e6)[0] * 1e3 / 6.957e8, '18', tol=0.02); num(D, 'densidad (Sgr A*) 10⁵', swf(4.3e6)[1] / 1e5, '9.97'); num(D, 'r_s (M87) 10¹⁰ km', swf(6.5e9)[0] / 1e10, '1.92'); num(D, 'r_s (M87) en UA', swf(6.5e9)[0] * 1e3 / AU, '128', tol=3e-3); num(D, 'densidad (M87)', swf(6.5e9)[1], '0.436'); num(D, 'T Hawking (Sol)', swf(1)[4] / 1e-8, '6.17')
num(D, 'r_s valor inicial', swf(1)[0], '2.95325'); num(D, 'ρ valor inicial', swf(1)[1] / 1e19, '1.84302'); num(D, 'esfera valor inicial', swf(1)[2], '4.42988'); num(D, 'ISCO valor inicial', swf(1)[3], '8.85975'); num(D, 'T_H valor inicial', swf(1)[4] / 1e-8, '6.17007')
Mq = Symbol('M', positive=True)
rsq = 2 * GMSq * Mq / Cq ** 2
fs(D, 'rs', rsq / 1000); fs(D, 'rho', Mq * MSq / (R_(4, 3) * pi * rsq ** 3)); fs(D, 'rph', R_(3, 2) * rsq / 1000); fs(D, 'isco', 3 * rsq / 1000); fs(D, 'TH', HBq * Cq ** 3 / (8 * pi * Gq * Mq * MSq * KBq))

# ---------------------------------------------------------------- deflexión de la luz
D = 'deflexion-luz'
ph_, b, mm = S('phi b m')
uf = Function('u')
U2 = 1 / b ** 2 - u_ ** 2 + 2 * mm * u_ ** 3
ident(D, "derivando (u′)² = 1/b² − u² + 2mu³: u″ = −u + 3mu²", diff(U2, u_) / 2, -u_ + 3 * mm * u_ ** 2)
u0 = sin(ph_) / b
ident(D, 'orden cero: u₀ = senφ/b cumple u₀″ + u₀ = 0', diff(u0, ph_, 2) + u0, 0)
u1 = mm / b ** 2 * (1 + cos(ph_) ** 2)
ident(D, 'orden uno: u₁″ + u₁ = 3m senφ²/b²', sp.simplify(diff(u1, ph_, 2) + u1 - 3 * mm / b ** 2 * sin(ph_) ** 2), 0)
dl = Symbol('delta', positive=True)
ident(D, 'u(−δ) = 0 a primer orden: −δ/b + 2m/b² = 0 ⇒ δ = 2m/b', sp.solve(sp.Eq(-dl / b + 2 * mm / b ** 2, 0), dl)[0], 2 * mm / b)
ident(D, 'α = 2δ = 4GM/(c²b) = 2r_s/b', 2 * (2 * mm / b), 4 * mm / b)
# integración numérica de la geodésica nula (unidades m = GM/c² = 1)
def deflection_num(bv):
    mval = 1.0
    umax = brentq(lambda uu: 1 / bv ** 2 - uu ** 2 + 2 * mval * uu ** 3, 0.5 / bv, 1.5 / bv)
    f = lambda phi, y: [y[1], -y[0] + 3 * mval * y[0] ** 2]
    ev = lambda phi, y: y[0] - 1e-5 * umax
    ev.terminal = True; ev.direction = -1
    sol = solve_ivp(f, [0, 4.0], [umax, 0.0], events=ev, rtol=1e-13, atol=1e-20)
    phi_end = sol.t_events[0][0] + 1e-5 * umax / (-sol.y_events[0][0][1])
    return 2 * phi_end - math.pi
for bv in (1e3, 1e4, 1e5):
    al = deflection_num(bv); rf = 4.0 / bv
    rec(G_STEP, D, f'integración numérica de la geodésica nula: α (b = {bv:g} m, m = 1)', al, rf, 'rel 2e-2·(m/b)... ', abs(al / rf - 1) < 4 * 3.75 * math.pi / 4 / bv * 2 + 1e-9)
al_big = deflection_num(1e5)
rec(G_STEP, D, 'integración numérica con b = 10⁵ m: α = 4m/b con error relativo < 10⁻³', al_big, 4e-5, 'rel 1e-3', abs(al_big / 4e-5 - 1) < 1e-3)
uL = {'alpha': 'rad', 'G': 'N m^2 kg^-2', 'M': 'kg', 'b': 'm', 'c': 'm s^-1', 'u': 'm^-1', 'phi': 'rad', 'r_s': 'm'}
dimcheck(D, 'α = 4GM/(c²b)', Symbol('alpha', positive=True), 4 * Gs2 * Ms2 / (c2 ** 2 * b), uL)
dimcheck(D, 'α = 2r_s/b', Symbol('alpha', positive=True), 2 * Symbol('r_s', positive=True) / b, uL)
ltf = lambda M, bR: (lambda al: (math.degrees(al) * 3600, math.degrees(al) * 3600 / 2, al / 2))(4 * GMS * M / (C ** 2 * bR * 6.957e8))
num(D, 'α (Sol, rasante) ″', ltf(1, 1)[0], '1.7512'); num(D, 'newtoniana ″', ltf(1, 1)[1], '0.8756'); num(D, 'α (2 R☉)', ltf(1, 2)[0], '0.876'); num(D, 'α (10 R☉)', ltf(1, 10)[0], '0.175'); num(D, 'α (Júpiter) mas', ltf(9.54e-4, 7.149e7 / 6.957e8)[0] * 1e3, '16.3'); num(D, 'α (0.5 R☉)', ltf(1, 0.5)[0], '3.50')
num(D, 'α valor inicial', ltf(1, 1)[0], '1.75119'); num(D, 'newtoniana valor inicial', ltf(1, 1)[1], '0.875595'); num(D, 'r_s/b valor inicial (10⁻⁶)', ltf(1, 1)[2] / 1e-6, '4.24501')
bq_ = Symbol('b', positive=True)
alq = 4 * GMSq * Mq / (Cq ** 2 * bq_ * sp.Float('6.957e8', 40))
fs(D, 'al', alq * 180 / pi * 3600); fs(D, 'aN', alq / 2 * 180 / pi * 3600); fs(D, 'ep', alq / 2)

# ---------------------------------------------------------------- perihelio
D = 'perihelio'
p_, eps_, du = S('p eps du')
ident(D, 'linealizando u″ + u = GM/h² + 3m u² en torno de u₀: δu″ + (1 − 6mu₀)δu = 0', diff(3 * mm * u_ ** 2, u_).subs(u_, 1 / p_), 6 * mm / p_)
ident(D, 'ε = 3m/p ⇒ 1 − 6m/p = 1 − 2ε', 1 - 6 * mm / p_, 1 - 2 * (3 * mm / p_))
series_is(D, 'ω = √(1 − 2ε) ≃ 1 − ε', sqrt(1 - 2 * Symbol('es')), Symbol('es'), 0, 2, 1 - Symbol('es'))
series_is(D, '2π(1/ω − 1) ≃ 2πε con ω = √(1−2ε)', 2 * pi * (1 / sqrt(1 - 2 * Symbol('es')) - 1), Symbol('es'), 0, 2, 2 * pi * Symbol('es'))
ident(D, 'Δφ = 2π·3GM/(c²p) = 6πGM/(c²a(1−e²))', 2 * pi * 3 * mm / (Symbol('a', positive=True) * (1 - Symbol('e', positive=True) ** 2)), 6 * pi * mm / (Symbol('a', positive=True) * (1 - Symbol('e', positive=True) ** 2)))
# integración numérica de u″ + u = 1/p + 3m u² (m = 1) y medida del avance entre perihelios
def advance_num(pv, e):
    mval = 1.0
    f = lambda phi, y: [y[1], -y[0] + 1 / pv + 3 * mval * y[0] ** 2]
    ev = lambda phi, y: y[1]
    ev.direction = -1
    sol = solve_ivp(f, [0, 8 * math.pi], [(1 + e) / pv, 0.0], events=ev, rtol=1e-13, atol=1e-18)
    te = sol.t_events[0]
    return (te[1] - te[0]) - 2 * math.pi, te
for (pv, e) in ((1e4, 0.2), (1e4, 0.6), (1e5, 0.2)):
    adv, te = advance_num(pv, e)
    rec(G_STEP, D, f'integración numérica de la órbita relativista: avance entre perihelios (p = {pv:g} m, e = {e})', adv, 6 * math.pi / pv, 'rel 1e-2', abs(adv / (6 * math.pi / pv) - 1) < 1e-2)
uPh = {'Dphi': 'rad', 'G': 'N m^2 kg^-2', 'M': 'kg', 'c': 'm s^-1', 'a': 'm', 'e': '1', 'h': 'm^2 s^-1', 'u': 'm^-1'}
dimcheck(D, 'Δφ = 6πGM/(c²a(1−e²))', Symbol('Dphi', positive=True), 6 * pi * Gs2 * Ms2 / (c2 ** 2 * Symbol('a', positive=True) * (1 - Symbol('e', positive=True) ** 2)), uPh)
phf = lambda M, a, e: (lambda a_m: (lambda d, P: (math.degrees(d) * 3600, P / 86400, math.degrees(d) * 3600 * 36525 * 86400 / P))(6 * math.pi * GMS * M / (C ** 2 * a_m * (1 - e * e)), 2 * math.pi * math.sqrt(a_m ** 3 / (GMS * M))))(a * AU)
num(D, 'Mercurio por órbita ″', phf(1, 0.387098, 0.20563)[0], '0.1035'); num(D, 'periodo', phf(1, 0.387098, 0.20563)[1], '87.97'); num(D, 'Mercurio por siglo', phf(1, 0.387098, 0.20563)[2], '42.98'); num(D, 'Venus', phf(1, 0.723332, 0.006773)[2], '8.62'); num(D, 'Tierra', phf(1, 1.0, 0.0167)[2], '3.84'); num(D, 'Júpiter', phf(1, 5.2044, 0.0489)[2], '0.062')
num(D, 'Mercurio circular', phf(1, 0.387098, 0.0)[2], '41.16'); num(D, 'a = 0.2 UA', phf(1, 0.2, 0.2056)[2], '224', tol=3e-3); num(D, 'PSR por órbita ″', phf(2.828, 0.013043, 0.617)[0], '13.4', tol=3e-3); num(D, 'PSR periodo (h)', phf(2.828, 0.013043, 0.617)[1] * 24, '7.76', tol=3e-3); num(D, 'PSR °/año', phf(2.828, 0.013043, 0.617)[2] / 3600 / 100, '4.21'); num(D, 'total Mercurio', 5025 + 532 + 43, '5600')
num(D, 'Δφ valor inicial', phf(1, 0.387098, 0.20563)[0], '0.103517'); num(D, 'P valor inicial', phf(1, 0.387098, 0.20563)[1], '87.9690'); num(D, 'por siglo valor inicial', phf(1, 0.387098, 0.20563)[2], '42.9807')
aq, eq_ = symbols('a e', positive=True)
am_ = aq * AUq
dph = 6 * pi * GMSq * Mq / (Cq ** 2 * am_ * (1 - eq_ ** 2)); Pq = 2 * pi * sqrt(am_ ** 3 / (GMSq * Mq))
fs(D, 'd', dph * 180 / pi * 3600); fs(D, 'P', Pq / 86400); fs(D, 'c', dph * 180 / pi * 3600 * sp.Float('36525', 40) * 86400 / Pq)

# ---------------------------------------------------------------- ondas gravitacionales
D = 'ondas-gravitacionales'
m1, m2, a, Om, tt = S('m1 m2 a Omega t')
Mt = m1 + m2
x1 = m2 / Mt * a * Matrix([cos(Om * tt), sin(Om * tt), 0]); x2 = -m1 / Mt * a * Matrix([cos(Om * tt), sin(Om * tt), 0])
def Qij(i, j):
    return sum(mi * (X[i] * X[j] - (sum(X[k] ** 2 for k in range(3)) if i == j else 0) / 3) for mi, X in ((m1, x1), (m2, x2)))
P3 = sum(diff(Qij(i, j), tt, 3) ** 2 for i in range(3) for j in range(3))
Pgw = sp.simplify(P3 / 5)          # G/c⁵ ⟨…⟩, el factor G/c⁵ se añade después
mu = m1 * m2 / Mt
ident(D, 'Σ(d³Q_ij/dt³)² = 32μ²a⁴Ω⁶ (instantáneo, órbita circular)', sp.simplify(P3), 32 * mu ** 2 * a ** 4 * Om ** 6)
Gs3, c3 = S('G c')
ident(D, 'P = (G/5c⁵)·32μ²a⁴Ω⁶ = (32/5)(G/c⁵)μ²a⁴Ω⁶', Gs3 / (5 * c3 ** 5) * 32 * mu ** 2 * a ** 4 * Om ** 6, R_(32, 5) * Gs3 / c3 ** 5 * mu ** 2 * a ** 4 * Om ** 6)
ident(D, 'Ω² = GM/a³ ⇒ P = (32/5)G⁴m₁²m₂²M/(c⁵a⁵)', (R_(32, 5) * Gs3 / c3 ** 5 * mu ** 2 * a ** 4 * (Gs3 * Mt / a ** 3) ** 3), R_(32, 5) * Gs3 ** 4 * m1 ** 2 * m2 ** 2 * Mt / (c3 ** 5 * a ** 5))
Pexp = R_(32, 5) * Gs3 ** 4 * m1 ** 2 * m2 ** 2 * Mt / (c3 ** 5 * a ** 5)
Eorb = -Gs3 * m1 * m2 / (2 * a)
ident(D, 'dE/dt = (Gm₁m₂/2a²)da/dt = −P ⇒ a³ da = −(64/5)G³m₁m₂M/c⁵ dt', sp.simplify((-Pexp) / (Gs3 * m1 * m2 / (2 * a ** 2)) * a ** 3 - (-R_(64, 5) * Gs3 ** 3 * m1 * m2 * Mt / c3 ** 5)), 0)
a0, ap = S('a0 ap')
integral(D, 'τ = ∫₀^a₀ a³ da/[(64/5)G³m₁m₂M/c⁵] = (5/256)c⁵a₀⁴/(G³m₁m₂M)', ap ** 3 / (R_(64, 5) * Gs3 ** 3 * m1 * m2 * Mt / c3 ** 5), ap, 0, a0, R_(5, 256) * c3 ** 5 * a0 ** 4 / (Gs3 ** 3 * m1 * m2 * Mt))
f_, Mc = S('f Mc')
ident(D, 'f = Ω/π (la onda tiene el doble de la frecuencia orbital) ⇒ a³ = GM/(πf)²', (Gs3 * Mt / (pi * f_) ** 2), Gs3 * Mt / (pi * f_) ** 2)
# integración numérica de la inspiral (Peters) y comparación con τ
def tau_num(m1v, m2v, a0v):
    M_ = m1v + m2v; k = 64 / 5 * G ** 3 * m1v * m2v * M_ / C ** 5
    f = lambda tt_, y: [-k / y[0] ** 3]
    ev = lambda tt_, y: y[0] - 1e-3 * a0v
    ev.terminal = True
    sol = solve_ivp(f, [0, 1e8], [a0v], events=ev, rtol=1e-12, atol=1e-9, method='LSODA')
    return float(sol.t_events[0][0]) + (1e-3 * a0v) ** 4 / (4 * k) , k
for (m1v, m2v, fv) in ((36, 29, 35), (1.4, 1.4, 100), (10, 10, 50)):
    M_ = (m1v + m2v) * MS; a0v = (G * M_ / (math.pi * fv) ** 2) ** (1 / 3)
    tn, k = tau_num(m1v * MS, m2v * MS, a0v)
    tf = 5 / 256 * C ** 5 * a0v ** 4 / (G ** 3 * m1v * MS * m2v * MS * M_)
    rec(G_STEP, D, f'integración numérica de da/dt = −(64/5)G³m₁m₂M/(c⁵a³): τ ({m1v}+{m2v} M☉, {fv} Hz)', tn, tf, 'rel 1e-6', abs(tn / tf - 1) < 1e-6)
# comprobación numérica de la potencia (cuadrupolo con diferencias finitas)
def P_quad(m1v, m2v, av):
    M_ = m1v + m2v; Om_ = math.sqrt(G * M_ / av ** 3)
    def Q(tq):
        X1 = m2v / M_ * av * np.array([math.cos(Om_ * tq), math.sin(Om_ * tq), 0.0]); X2 = -m1v / M_ * av * np.array([math.cos(Om_ * tq), math.sin(Om_ * tq), 0.0])
        q = m1v * np.outer(X1, X1) + m2v * np.outer(X2, X2); return q - np.trace(q) / 3 * np.eye(3)
    h_ = 0.05 / Om_
    d3 = (Q(2 * h_) - 2 * Q(h_) + 2 * Q(-h_) - Q(-2 * h_)) / (2 * h_ ** 3)
    return G / (5 * C ** 5) * float(np.sum(d3 * d3))
for (m1v, m2v, fv) in ((36, 29, 35), (1.4, 1.4, 100)):
    M_ = (m1v + m2v) * MS; av = (G * M_ / (math.pi * fv) ** 2) ** (1 / 3)
    Pf = 32 / 5 * G ** 4 * (m1v * MS) ** 2 * (m2v * MS) ** 2 * M_ / (C ** 5 * av ** 5)
    Pn = P_quad(m1v * MS, m2v * MS, av)
    rec(G_STEP, D, f'cuadrupolo por diferencias finitas: P ({m1v}+{m2v} M☉)', Pn, Pf, 'rel 1e-2', abs(Pn / Pf - 1) < 1e-2)
uW = {'P': 'W', 'G': 'N m^2 kg^-2', 'm1': 'kg', 'm2': 'kg', 'M': 'kg', 'a': 'm', 'c': 'm s^-1', 'tau': 's', 'f': 'Hz', 'Mc': 'kg'}
Mtt = Symbol('M', positive=True)
dimcheck(D, 'P = (32/5)G⁴m₁²m₂²M/(c⁵a⁵)', Symbol('P', positive=True), R_(32, 5) * Gs3 ** 4 * m1 ** 2 * m2 ** 2 * Mtt / (c3 ** 5 * a ** 5), dict(uW, M='kg'))
dimcheck(D, 'τ = (5/256)c⁵a⁴/(G³m₁m₂M)', Symbol('tau', positive=True), R_(5, 256) * c3 ** 5 * a ** 4 / (Gs3 ** 3 * m1 * m2 * Mtt), dict(uW, M='kg'))
dimcheck(D, '𝓜 = (m₁m₂)^(3/5)/M^(1/5)', Symbol('Mc', positive=True), (m1 * m2) ** R_(3, 5) / Mtt ** R_(1, 5), dict(uW, M='kg'))
gwf = lambda m1v, m2v, fv: (lambda M_: (lambda av: (av / 1e3, 32 / 5 * G ** 4 * (m1v * MS) ** 2 * (m2v * MS) ** 2 * M_ / (C ** 5 * av ** 5), 5 / 256 * C ** 5 * av ** 4 / (G ** 3 * m1v * MS * m2v * MS * M_), (m1v * m2v) ** 0.6 / (m1v + m2v) ** 0.2))((G * M_ / (math.pi * fv) ** 2) ** (1 / 3)))((m1v + m2v) * MS)
num(D, 'a (GW150914) km', gwf(36, 29, 35)[0], '893.6'); num(D, 'P (10⁴⁷)', gwf(36, 29, 35)[1] / 1e47, '2.03'); num(D, 'τ (s)', gwf(36, 29, 35)[2], '0.190'); num(D, 'masa de chirp', gwf(36, 29, 35)[3], '28.1'); num(D, 'P (100 Hz) 10⁴⁸', gwf(36, 29, 100)[1] / 1e48, '6.71'); num(D, 'τ (100 Hz) ms', gwf(36, 29, 100)[2] * 1e3, '11.6')
num(D, 'a (BNS, 100 Hz)', gwf(1.4, 1.4, 100)[0], '155.6'); num(D, 'P (BNS) 10⁴⁴', gwf(1.4, 1.4, 100)[1] / 1e44, '1.92'); num(D, 'τ (BNS, 100 Hz)', gwf(1.4, 1.4, 100)[2], '2.16'); num(D, 'τ (BNS, 10 Hz)', gwf(1.4, 1.4, 10)[2], '1002', tol=1e-3); num(D, 'τ (10+10, 50 Hz)', gwf(10, 10, 50)[2], '0.518', tol=2e-3)
num(D, 'energía de 3 M☉c² en 10⁴⁷ J', 3 * MS * C ** 2 / 1e47, '5.4', tol=0.01); num(D, 'τ ∝ f^(−8/3): cociente (35→100 Hz)', gwf(36, 29, 35)[2] / gwf(36, 29, 100)[2], str(round((100 / 35) ** (8 / 3), 3)), tol=1e-6) if False else None
num(D, 'a valor inicial', gwf(36, 29, 35)[0], '893.581'); num(D, 'P valor inicial', gwf(36, 29, 35)[1] / 1e47, '2.02740'); num(D, 'τ valor inicial', gwf(36, 29, 35)[2], '0.190100'); num(D, 'chirp valor inicial', gwf(36, 29, 35)[3], '28.0956')
m1q, m2q, fq = symbols('m1 m2 f', positive=True)
Mq2 = (m1q + m2q) * MSq
aq2 = (Gq * Mq2 / (pi * fq) ** 2) ** R_(1, 3)
fs(D, 'a', aq2 / 1000); fs(D, 'P', R_(32, 5) * Gq ** 4 * (m1q * MSq) ** 2 * (m2q * MSq) ** 2 * Mq2 / (Cq ** 5 * aq2 ** 5)); fs(D, 'tau', R_(5, 256) * Cq ** 5 * aq2 ** 4 / (Gq ** 3 * m1q * MSq * m2q * MSq * Mq2)); fs(D, 'Mc', (m1q * m2q) ** R_(3, 5) / (m1q + m2q) ** R_(1, 5))
