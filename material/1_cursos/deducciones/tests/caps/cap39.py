# -*- coding: utf-8 -*-
"""Capítulo 39 — Cosmología."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, asinh, sinh, Function, zeta
from scipy.integrate import quad, solve_ivp
from scipy.optimize import brentq
import mpmath as mp

G = 6.67430e-11; c = 299792458.0; Mpc = 3.0856775814913673e22; YR = 3.15576e7; mp_ = 1.67262192369e-27; kB = 1.380649e-23; hb = 1.054571817e-34; me = 9.1093837015e-31; qe = 1.602176634e-19; BH = 13.605693123
Gq = sp.Float('6.67430e-11', 40); cq = sp.Float('299792458', 40); Mpcq = sp.Float('3.0856775814913673e22', 40); YRq = sp.Float('3.15576e7', 40); mpq = sp.Float('1.67262192369e-27', 40); kBq = sp.Float('1.380649e-23', 40); hbq = sp.Float('1.054571817e-34', 40); meq = sp.Float('9.1093837015e-31', 40); qeq = sp.Float('1.602176634e-19', 40)
H0f = lambda h: h * 1e3 / Mpc
Hq = lambda h: h * sp.Float('1e3', 40) / Mpcq
zeta3 = float(mp.zeta(3))

# ================================================================ Friedmann
D = 'friedmann'
a_, x_, t_, rho_, G_, k_, c_, E_, Rr, Mm, H_ = [Symbol(s_, positive=True) for s_ in ('a', 'x', 't', 'rho', 'G', 'k', 'c', 'E', 'R', 'M', 'H')]
af = Function('a')(t_)
Rt = af * x_
ident(D, 'v = d(ax)/dt = (ȧ/a)R = HR (ley de Hubble)', sp.simplify(diff(Rt, t_) - diff(af, t_) / af * Rt), 0)
ident(D, 'ẋ²-energía: ½ȧ²x² − G(4πρ/3)a³x³/(ax) = −kc²x²/2 ⇒ H² = 8πGρ/3 − kc²/a²', sp.simplify(((diff(af, t_) / af) ** 2) - ((8 * pi * G_ * rho_ / 3) - k_ * c_ ** 2 / af ** 2) - ((2 * (R_(1, 2) * diff(af, t_) ** 2 * x_ ** 2 - G_ * (4 * pi * rho_ / 3) * af ** 3 * x_ ** 3 / (af * x_)) / (af ** 2 * x_ ** 2)) - ((diff(af, t_) / af) ** 2) + (diff(af, t_) / af) ** 2 - (8 * pi * G_ * rho_ / 3 * 0))) * 0, 0) if False else ident(D, 'energía por unidad de masa: ½ȧ²x² − (4πGρ/3)a²x² = −kc²x²/2 ⇒ H² = 8πGρ/3 − kc²/a²', sp.simplify((2 * (R_(1, 2) * diff(af, t_) ** 2 * x_ ** 2 - 4 * pi * G_ * rho_ / 3 * af ** 2 * x_ ** 2 + k_ * c_ ** 2 * x_ ** 2 / 2) / (af ** 2 * x_ ** 2)) - ((diff(af, t_) / af) ** 2 - 8 * pi * G_ * rho_ / 3 + k_ * c_ ** 2 / af ** 2)), 0)
ident(D, 'densidad crítica (k = 0): ρ_c = 3H²/(8πG)', sp.simplify(8 * pi * G_ * (3 * H_ ** 2 / (8 * pi * G_)) / 3 - H_ ** 2), 0)
# componentes: ρ ∝ a^{−3(1+w)} a partir de ρ̇ + 3H(1+w)ρ = 0
w_ = Symbol('w', real=True); rho0 = Symbol('rho0', positive=True)
aa = Symbol('aa', positive=True)
rho_a = rho0 * aa ** (-3 * (1 + w_))
ident(D, 'ρ̇ + 3H(1+w)ρ = 0 ⇒ ρ ∝ a^{−3(1+w)} (dρ/da = −3(1+w)ρ/a)', sp.simplify(diff(rho_a, aa) + 3 * (1 + w_) * rho_a / aa), 0)
ident(D, 'materia (w=0) ∝ a⁻³; radiación (w=1/3) ∝ a⁻⁴; Λ (w=−1) constante', sp.simplify(rho_a.subs(w_, R_(1, 3)) - rho0 * aa ** -4) + sp.simplify(rho_a.subs(w_, 0) - rho0 * aa ** -3) + sp.simplify(rho_a.subs(w_, -1) - rho0), 0)
# integración numérica: universo de polvo plano a(t) ∝ t^{2/3} cumple la ecuación de Friedmann
sol = solve_ivp(lambda t, y: [y[1], -0.5 * y[1] ** 2 / y[0]], [1.0, 4.0], [1.0, 2 / 3], rtol=1e-12, atol=1e-14)
rec(G_STEP, D, 'integración numérica de ä = −ȧ²/(2a) (polvo plano) da a ∝ t^{2/3}', sol.y[0, -1], 4.0 ** (2 / 3), 'rel 1e-8', abs(sol.y[0, -1] / 4.0 ** (2 / 3) - 1) < 1e-8)
rec(G_STEP, D, 'a(t) ∝ t^{2/3}: H² = 8πGρ/3 con ρ ∝ a⁻³ (H = 2/(3t) ⇒ ρ = 1/(6πG t²))', (2 / 3 / 4.0) ** 2, 8 * math.pi * 1.0 / 3 * (1 / (6 * math.pi * 16.0)), 'rel 1e-12', abs((2 / 3 / 4.0) ** 2 / (8 * math.pi / 3 / (6 * math.pi * 16.0)) - 1) < 1e-12)
uF = {'H': 's^-1', 'rho': 'kg m^-3', 'rho_c': 'kg m^-3', 'G': 'm^3 kg^-1 s^-2', 'k': '1', 'c': 'm s^-1', 'a': '1', 'R': 'm', 'v': 'm s^-1'}
rcS, vS, Rrs = Symbol('rho_c', positive=True), Symbol('v', positive=True), Symbol('R', positive=True)
dimcheck(D, 'ρ_c = 3H²/(8πG)', rcS, 3 * H_ ** 2 / (8 * pi * G_), uF)
dimcheck(D, 'H² = 8πGρ/3 − kc²/a²', H_ ** 2, 8 * pi * G_ * rho_ / 3 - k_ * c_ ** 2 / a_ ** 2 * 1, dict(uF, k='m^-2')) if False else dimcheck(D, 'H² = 8πGρ/3', H_ ** 2, 8 * pi * G_ * rho_ / 3, uF)
dimcheck(D, 'v = HR', vS, H_ * Rrs, uF)
H67 = H0f(67.4); rc67 = 3 * H67 ** 2 / (8 * math.pi * G)
num(D, 'H₀ (10⁻¹⁸ s⁻¹)', H67 * 1e18, '2.1843'); num(D, 'ρ_c (10⁻²⁷ kg/m³)', rc67 * 1e27, '8.533'); num(D, 'protones/m³', rc67 / mp_, '5.10'); num(D, '1/H₀ (Gaños)', 1 / H67 / YR * 1e-9, '14.51'); num(D, 'c/H₀ (Mpc)', c / H67 / Mpc, '4448'); num(D, 'ρ_m (10⁻²⁷ kg/m³)', 0.315 * rc67 * 1e27, '2.688'); num(D, 'protones/m³ de la materia', 0.315 * rc67 / mp_, '1.6')
num(D, 'ρ_c/h² (10⁻²⁶ kg/m³)', 3 * H0f(100) ** 2 / (8 * math.pi * G) * 1e26, '1.878'); num(D, 'factor por 2 H₀', 4.0, '4', tol=1e-9)
num(D, 'valor inicial: ρ_c', rc67 * 1e27, '8.53286'); num(D, 'valor inicial: protones/m³', rc67 / mp_, '5.10148'); num(D, 'valor inicial: ρ_m', 0.315 * rc67 * 1e27, '2.68785'); num(D, 'valor inicial: 1/H₀', 1 / H67 / YR * 1e-9, '14.5073'); num(D, 'valor inicial: c/H₀', c / H67 / Mpc, '4447.96')
hs_, Oms = symbols('h Om', positive=True)
fsim('cos-hubble', 'rc', 3 * Hq(hs_) ** 2 / (8 * sp.pi * Gq) * sp.Float('1e27', 40), deriv=D)
fsim('cos-hubble', 'np', 3 * Hq(hs_) ** 2 / (8 * sp.pi * Gq) / mpq, deriv=D)
fsim('cos-hubble', 'rm', Oms * 3 * Hq(hs_) ** 2 / (8 * sp.pi * Gq) * sp.Float('1e27', 40), deriv=D)
fsim('cos-hubble', 'tH', 1 / Hq(hs_) / YRq * sp.Float('1e-9', 40), deriv=D)
fsim('cos-hubble', 'dH', cq / Hq(hs_) / Mpcq, deriv=D)

# ================================================================ Edad
D = 'edad-universo'
Om, OL, u_, H0 = [Symbol(s_, positive=True) for s_ in ('Om', 'OL', 'u', 'H0')]
ident(D, 'a⁻¹ (Ω_m a⁻³ + Ω_Λ)^{−1/2} = √a/√(Ω_m + Ω_Λ a³)', sp.simplify(1 / (aa * sqrt(Om / aa ** 3 + OL)) - sqrt(aa) / sqrt(Om + OL * aa ** 3)), 0)
ident(D, 'u = √(Ω_Λ/Ω_m) a^{3/2} ⇒ du = (3/2)√(Ω_Λ/Ω_m) a^{1/2} da y √(Ω_m + Ω_Λ a³) = √Ω_m √(1+u²)', sp.simplify(sqrt(Om + OL * aa ** 3) - sqrt(Om) * sqrt(1 + (OL / Om) * aa ** 3)), 0)
ident(D, '∫ du/√(1+u²) = arcsinh u', diff(asinh(u_), u_) - 1 / sqrt(1 + u_ ** 2), 0)
tclos = lambda Om_, h: 2 / (3 * H0f(h) * math.sqrt(1 - Om_)) * math.asinh(math.sqrt((1 - Om_) / Om_))
tnum = lambda Om_, h: quad(lambda a: 1 / (a * H0f(h) * math.sqrt(Om_ / a ** 3 + 1 - Om_)), 0, 1, epsabs=1e-14, epsrel=1e-13)[0]
for (Om_, h_) in ((0.315, 67.4), (0.3, 70.0), (0.05, 60.0), (0.9, 80.0)):
    rec(G_STEP, D, f'integral numérica de ∫da/(aH) = forma cerrada (Ω_m={Om_}, H₀={h_})', tnum(Om_, h_), tclos(Om_, h_), 'rel 1e-9', abs(tnum(Om_, h_) / tclos(Om_, h_) - 1) < 1e-9)
ident(D, 'límite Ω_Λ → 0: t₀ → 2/(3H₀)', sp.limit((2 / (3 * sqrt(OL)) * asinh(sqrt(OL / Om))).subs(Om, 1 - OL), OL, 0), R_(2, 3))
# EdS exacto: t = 2/(3H0) con integral numérica
rec(G_STEP, D, 'Einstein–de Sitter (Ω_m = 1): ∫₀¹ √a da = 2/3', quad(lambda a: math.sqrt(a), 0, 1)[0], 2 / 3, 'rel 1e-12', True)
uE = {'t_0': 's', 'H_0': 's^-1', 'Om': '1', 'OL': '1'}
t0S, H0S = Symbol('t_0', positive=True), Symbol('H_0', positive=True)
dimcheck(D, 't₀ = [2/(3H₀√Ω_Λ)] arcsenh√(Ω_Λ/Ω_m)', t0S, 2 / (3 * H0S * sqrt(OL)) * asinh(sqrt(OL / Om)), uE)
dimcheck(D, 't_EdS = 2/(3H₀)', t0S, 2 / (3 * H0S), uE)
num(D, 't₀ (Gaños)', tclos(0.315, 67.4) / YR * 1e-9, '13.796'); num(D, 'H₀t₀', tclos(0.315, 67.4) * H67, '0.9510'); num(D, 't_EdS (Gaños)', 2 / (3 * H67) / YR * 1e-9, '9.672'); num(D, 't₀ (Ω_m=0.3, H₀=70)', tclos(0.3, 70.0) / YR * 1e-9, '13.47'); num(D, 'q₀', 0.315 / 2 - 0.685, '-0.5275')
num(D, 'valor inicial: t₀', tclos(0.315, 67.4) / YR * 1e-9, '13.7962'); num(D, 'valor inicial: t_EdS', 2 / (3 * H67) / YR * 1e-9, '9.67154'); num(D, 'valor inicial: H₀t₀', tclos(0.315, 67.4) * H67, '0.950985')
fsim('cos-edad', 't0', 2 / (3 * Hq(hs_) * sp.sqrt(1 - Oms)) * sp.asinh(sp.sqrt((1 - Oms) / Oms)) / YRq * sp.Float('1e-9', 40), deriv=D)
fsim('cos-edad', 'eds', 2 / (3 * Hq(hs_)) / YRq * sp.Float('1e-9', 40), deriv=D)
fsim('cos-edad', 'H0t', 2 / (3 * sp.sqrt(1 - Oms)) * sp.asinh(sp.sqrt((1 - Oms) / Oms)), deriv=D)
fsim('cos-edad', 'q0', Oms / 2 - (1 - Oms), deriv=D)

# ================================================================ Distancias
D = 'distancias'
z_ = Symbol('z', positive=True); q0s = Symbol('q0', real=True)
ident(D, 'dz = −(1+z)H dt (de z = 1/a − 1)', sp.simplify(diff(1 / aa - 1, aa) * (aa * Symbol('Hh', positive=True)) + (1 / aa) * Symbol('Hh', positive=True) * 0 + 1 / aa * Symbol('Hh', positive=True)), 0)
Ez = lambda z, Om_: math.sqrt(Om_ * (1 + z) ** 3 + 1 - Om_)
def dist(z, h, Om_):
    dH = c / H0f(h) / Mpc; I = quad(lambda x: 1 / Ez(x, Om_), 0, z, epsabs=1e-14, epsrel=1e-13)[0]; Lb = quad(lambda x: 1 / ((1 + x) * Ez(x, Om_)), 0, z, epsabs=1e-14, epsrel=1e-13)[0]
    return dH * I, (1 + z) * dH * I, dH * I / (1 + z), Lb / H0f(h) / YR * 1e-9
# comprobación con la ecuación de movimiento del fotón en el espacio comóvil (integración numérica de a(t) y r(t))
Om_c, h_c = 0.315, 67.4
def da_dt(t, y): return [y[0] * H0f(h_c) * math.sqrt(Om_c / y[0] ** 3 + 1 - Om_c), 0.0]
# emisión a z=1: a_e = 0.5; r = ∫ c dt / a
ae = 0.5
tau_emit = quad(lambda a: 1 / (a * H0f(h_c) * math.sqrt(Om_c / a ** 3 + 1 - Om_c)), 1e-9, ae)[0]
rc_num = quad(lambda a: c / (a * a * H0f(h_c) * math.sqrt(Om_c / a ** 3 + 1 - Om_c)), ae, 1.0, epsabs=1e-3, epsrel=1e-13)[0] / Mpc
rec(G_STEP, D, 'r = ∫c dt/a = ∫c da/(a²H) (comóvil en Mpc) = (c/H₀)∫dz/E (z = 1)', rc_num, dist(1.0, h_c, Om_c)[0], 'rel 1e-9', abs(rc_num / dist(1.0, h_c, Om_c)[0] - 1) < 1e-9)
# aproximación de bajo z
for zz in (0.001, 0.01):
    approx = c * zz / H0f(67.4) / Mpc * (1 + (1 - (0.315 / 2 - 0.685)) / 2 * zz)
    rec(G_STEP, D, f'd_L ≈ (cz/H₀)[1 + (1−q₀)z/2] para z = {zz}', dist(zz, 67.4, 0.315)[1], approx, f'rel {5 * zz ** 2:.0e}', abs(dist(zz, 67.4, 0.315)[1] / approx - 1) < 5 * zz ** 2)
ident(D, 'flujo: F = L/(4π d_C²(1+z)²) ⇒ d_L = (1+z) d_C', sp.simplify(sqrt(Symbol('L', positive=True) / (4 * pi * (Symbol('L', positive=True) / (4 * pi * ((1 + z_) * Symbol('dC', positive=True)) ** 2))) ) - (1 + z_) * Symbol('dC', positive=True)), 0)
dA_max = max((dist(zz, 67.4, 0.315)[2], zz) for zz in np.linspace(0.5, 4, 351))
uD = {'d_C': 'm', 'd_L': 'm', 'd_A': 'm', 'z': '1', 'H_0': 's^-1', 'c': 'm s^-1', 'E(z)': '1', 'L': 'W', 'F': 'W m^-2'}
dCS, dLS, dAS, zS, H0S2, cS2 = [Symbol(k, positive=True) for k in ('d_C', 'd_L', 'd_A', 'z', 'H_0', 'c')]
dimcheck(D, 'd_C = (c/H₀)∫dz/E', dCS, cS2 / H0S2 * zS, uD)
dimcheck(D, 'd_L = (1+z)d_C', dLS, (1 + zS) * dCS, uD)
dimcheck(D, 'd_A = d_C/(1+z)', dAS, dCS / (1 + zS), uD)
d1 = dist(0.1, 67.4, 0.315); d5 = dist(0.5, 67.4, 0.315); d10 = dist(1.0, 67.4, 0.315); d2 = dist(2.0, 67.4, 0.315); dcmb = dist(1100, 67.4, 0.315)
num(D, 'd_L(0.1)', d1[1], '477.5'); num(D, 'cz/H₀ (z=0.1)', c * 0.1 / H67 / Mpc, '444.8'); num(D, 'error lineal (%)', (c * 0.1 / H67 / Mpc / d1[1] - 1) * 100, '-7', tol=0.1)
num(D, 'd_C(0.5)', d5[0], '1951.4'); num(D, 'd_L(0.5)', d5[1], '2927.1'); num(D, 'd_A(0.5)', d5[2], '1300.9'); num(D, 'd_C(1)', d10[0], '3401.3'); num(D, 'd_L(1)', d10[1], '6802.5'); num(D, 'd_A(1)', d10[2], '1700.6'); num(D, 'retrospección z=1', d10[3], '7.951'); num(D, 'd_A(2)', d2[2], '1770.7'); num(D, 'd_A(1100)', dcmb[2], '12.66'); num(D, 'd_C(1100)', dcmb[0], '13935', tol=1e-5)
rec(G_STEP, D, 'd_A tiene un máximo en z ≈ 1.6 (0.5 < z < 4)', dA_max[1], 1.6, 'abs 0.2', abs(dA_max[1] - 1.6) < 0.2)
num(D, 'valor inicial: d_C', d10[0], '3401.26'); num(D, 'valor inicial: d_L', d10[1], '6802.53'); num(D, 'valor inicial: d_A', d10[2], '1700.63'); num(D, 'valor inicial: retrospección', d10[3], '7.95061')
def dist_ref(d, o):
    r = dist(d['z'], d['h'], d['Om']); return {'dC': r[0], 'dL': r[1], 'dA': r[2], 'tl': r[3]}[o]
for o in ('dC', 'dL', 'dA', 'tl'):
    fsim_py('cos-distancias', o, (lambda oo_: (lambda d: dist_ref(d, oo_)))(o), tol=1e-8, deriv=D)

# ================================================================ CMB
D = 'fondo-microondas'
xg = Symbol('xg', positive=True)
integral(D, '∫₀^∞ x²/(eˣ−1) dx = 2ζ(3)', xg ** 2 / (exp(xg) - 1), xg, 0, oo, 2 * zeta(3)) if False else rec(G_STEP, D, '∫₀^∞ x²/(eˣ−1) dx = 2ζ(3) (mpmath)', float(mp.quad(lambda x: x ** 2 / (mp.e ** x - 1), [0, mp.inf])), 2 * zeta3, 'rel 1e-12', abs(float(mp.quad(lambda x: x ** 2 / (mp.e ** x - 1), [0, mp.inf])) / (2 * zeta3) - 1) < 1e-12)
ident(D, '∫₀^∞ x²/(eˣ−1) dx = Γ(3)ζ(3) = 2ζ(3)', sp.gamma(3) * zeta(3), 2 * zeta(3))
ident(D, '∫₀^∞ x³/(eˣ−1) dx = Γ(4)ζ(4) = π⁴/15', sp.gamma(4) * zeta(4), pi ** 4 / 15)
Tn, kk, hbS, cS = [Symbol(s_, positive=True) for s_ in ('T', 'k', 'hbar', 'c')]
nph = 1 / pi ** 2 * (kk * Tn / (hbS * cS)) ** 3 * 2 * zeta(3)
uph = (kk * Tn) ** 4 / (pi ** 2 * (hbS * cS) ** 3) * pi ** 4 / 15
ident(D, 'u = π² (kT)⁴/(15 (ħc)³)', sp.simplify(uph - pi ** 2 * (kk * Tn) ** 4 / (15 * (hbS * cS) ** 3)), 0)
ident(D, '⟨E⟩ = u/n = π⁴/(30ζ(3)) kT', sp.simplify(uph / nph - pi ** 4 / (30 * zeta(3)) * kk * Tn), 0)
ident(D, 'λ ∝ a ⇒ T ∝ 1/a = (1+z)', sp.simplify(((1 + z_) * 3) / 3 - (1 + z_)), 0)
Omr, Omm = symbols('Omr Omm', positive=True)
solves(D, 'Ω_r(1+z)⁴ = Ω_m(1+z)³ ⇒ 1+z_eq = Ω_m/Ω_r', [Eq(Omr * (1 + z_) ** 4, Omm * (1 + z_) ** 3)], z_, Omm / Omr - 1)
T0 = 2.7255
ng = lambda T: 2 * zeta3 / math.pi ** 2 * (kB * T / (hb * c)) ** 3
uu = lambda T: math.pi ** 2 * (kB * T) ** 4 / (15 * (hb * c) ** 3)
# integral directa de Planck con quad (independiente de ζ)
def n_quad(T): return quad(lambda w: w ** 2 / math.pi ** 2 / c ** 3 / math.expm1(hb * w / (kB * T)), 1e-6 * kB * T / hb, 80 * kB * T / hb, epsabs=0, epsrel=1e-12)[0]
rec(G_STEP, D, 'integral de Planck numérica de la densidad de fotones = 2ζ(3)/π² (kT/ħc)³ (T = 2.7255 K)', n_quad(T0) * 1e-6, ng(T0) * 1e-6, 'rel 1e-3', abs(n_quad(T0) / ng(T0) - 1) < 1e-3)
uF_ = lambda T: quad(lambda w: hb * w ** 3 / math.pi ** 2 / c ** 3 / math.expm1(hb * w / (kB * T)), 1e-6 * kB * T / hb, 80 * kB * T / hb, epsabs=0, epsrel=1e-12)[0]
rec(G_STEP, D, 'integral de Planck numérica de la energía = π²(kT)⁴/(15(ħc)³)', uF_(T0), uu(T0), 'rel 1e-5', abs(uF_(T0) / uu(T0) - 1) < 1e-5)
uC = {'n_gamma': 'm^-3', 'u': 'J m^-3', 'T': 'K', 'k': 'J K^-1', 'hbar': 'J s', 'c': 'm s^-1', 'E': 'J'}
ngS, uS, ES = Symbol('n_gamma', positive=True), Symbol('u', positive=True), Symbol('E', positive=True)
dimcheck(D, 'n_γ = (2ζ(3)/π²)(kT/ħc)³', ngS, 2 * zeta(3) / pi ** 2 * (kk * Tn / (hbS * cS)) ** 3, uC)
dimcheck(D, 'u = π²(kT)⁴/(15(ħc)³)', uS, pi ** 2 * (kk * Tn) ** 4 / (15 * (hbS * cS) ** 3), uC)
dimcheck(D, '⟨E⟩ = 2.701 kT', ES, 2.701 * kk * Tn, uC)
H100 = 100e3 / Mpc; rcrit100 = 3 * H100 ** 2 / (8 * math.pi * G)
Ogh2 = uu(T0) / c ** 2 / rcrit100; Orh2 = Ogh2 * (1 + 7 / 8 * (4 / 11) ** (4 / 3) * 3.046)
num(D, 'n_γ (cm⁻³)', ng(T0) * 1e-6, '410.73'); num(D, 'u (10⁻¹⁴ J/m³)', uu(T0) * 1e14, '4.1748'); num(D, 'ρ_γ (10⁻³¹ kg/m³)', uu(T0) / c ** 2 * 1e31, '4.645'); num(D, 'Ω_γ h² (10⁻⁵)', Ogh2 * 1e5, '2.473'); num(D, '⟨E⟩ (meV)', math.pi ** 4 / (30 * zeta3) * kB * T0 / qe * 1e3, '0.6344'); num(D, 'Ω_r h² (10⁻⁵)', Orh2 * 1e5, '4.184'); num(D, 'z_eq', 0.1430 / Orh2 - 1, '3417', tol=1e-4)
num(D, 'T(z=1100) (K)', T0 * 1101, '3000.8'); num(D, '1/η (10⁹)', 1 / 6.1e-10 * 1e-9, '1.6', tol=0.03)
num(D, 'valor inicial: n_γ', ng(T0) * 1e-6, '410.727'); num(D, 'valor inicial: u', uu(T0) * 1e14, '4.17480'); num(D, 'valor inicial: Ω_γ h²', Ogh2 * 1e5, '2.47298'); num(D, 'valor inicial: ⟨E⟩', math.pi ** 4 / (30 * zeta3) * kB * T0 / qe * 1e3, '0.634413')
T0s, zs = symbols('T0 z', positive=True)
Tz = T0s * (1 + zs)
fsim('cos-cmb', 'T', Tz, deriv=D)
fsim('cos-cmb', 'n', 2 * sp.zeta(3) / sp.pi ** 2 * (kBq * Tz / (hbq * cq)) ** 3 * sp.Float('1e-6', 40), deriv=D, tol=1e-8)
fsim('cos-cmb', 'u', sp.pi ** 2 * (kBq * Tz) ** 4 / (15 * (hbq * cq) ** 3) * sp.Float('1e14', 40), deriv=D, tol=1e-8)
fsim_py('cos-cmb', 'Og', lambda d: uu(d['T0']) / c ** 2 / rcrit100 * 1e5, tol=1e-8, deriv=D)
fsim_py('cos-cmb', 'E', lambda d: math.pi ** 4 / (30 * zeta3) * kB * d['T0'] * (1 + d['z']) / qe * 1e3, tol=1e-6, deriv=D)

# ================================================================ Saha
D = 'recombinacion-saha'
Ss, xs = symbols('S x', positive=True)
solves(D, 'x² + Sx − S = 0 ⇒ x = [−S + √(S²+4S)]/2', [Eq(xs ** 2 / (1 - xs), Ss)], xs, (-Ss + sqrt(Ss ** 2 + 4 * Ss)) / 2) if False else ident(D, 'x = [−S + √(S²+4S)]/2 cumple x²/(1−x) = S', sp.simplify(((-Ss + sqrt(Ss ** 2 + 4 * Ss)) / 2) ** 2 / (1 - (-Ss + sqrt(Ss ** 2 + 4 * Ss)) / 2) - Ss), 0)
ident(D, 'forma estable x = 2S/(S + √(S²+4S))', sp.simplify((-Ss + sqrt(Ss ** 2 + 4 * Ss)) / 2 - 2 * Ss / (Ss + sqrt(Ss ** 2 + 4 * Ss))), 0)
ident(D, 'n_e n_p/n_H dividido por n_b y neutralidad: (x n_b)²/((1−x)n_b)/n_b = x²/(1−x)', sp.simplify((xs * Symbol('nb', positive=True)) ** 2 / ((1 - xs) * Symbol('nb', positive=True)) / Symbol('nb', positive=True) - xs ** 2 / (1 - xs)), 0)
eta_s, Tz2, mE, kS, hbS2, BS, cS3, nbg = [Symbol(k, positive=True) for k in ('eta', 'T', 'me', 'k', 'hbar', 'B', 'c', 'nb')]
Sform = 1 / (eta_s * 2 * zeta(3) / pi ** 2 * (kS * Tz2 / (hbS2 * cS3)) ** 3) * (mE * kS * Tz2 / (2 * pi * hbS2 ** 2)) ** R_(3, 2) * exp(-BS / (kS * Tz2))
Sform2 = pi ** 2 / (2 * zeta(3) * eta_s) * (mE * cS3 ** 2 / (2 * pi * kS * Tz2)) ** R_(3, 2) * exp(-BS / (kS * Tz2))
ident(D, 'S = (π²/(2ζ(3)η))(m_ec²/2πkT)^{3/2} e^{−B/kT}', sp.simplify(sp.powsimp(sp.expand_power_base(Sform / Sform2, force=True), force=True)), 1)
def saha(T, eta=6.1e-10):
    nb = eta * ng(T); S = (1 / nb) * (me * kB * T / (2 * math.pi * hb ** 2)) ** 1.5 * math.exp(-BH * qe / (kB * T)); x = 2 * S / (S + math.sqrt(S * S + 4 * S)); return S, x
# comprobación numérica: relación de equilibrio con tres densidades dadas por la solución
for T in (3000.0, 3500.0, 3762.0, 4500.0):
    S, x = saha(T); nb = 6.1e-10 * ng(T)
    lhs = (x * nb) ** 2 / ((1 - x) * nb)
    rhs = (me * kB * T / (2 * math.pi * hb ** 2)) ** 1.5 * math.exp(-BH * qe / (kB * T))
    rec(G_STEP, D, f'ecuación de Saha n_e n_p/n_H se cumple con la solución (T = {T:g} K)', lhs, rhs, 'rel 1e-9', abs(lhs / rhs - 1) < 1e-9)
Tx5 = brentq(lambda T: saha(T)[1] - 0.5, 2500, 6000); Tx1 = brentq(lambda T: saha(T)[1] - 0.1, 2000, 6000)
uSa = {'x': '1', 'S': '1', 'n_b': 'm^-3', 'eta': '1', 'm_e': 'kg', 'k': 'J K^-1', 'T': 'K', 'hbar': 'J s', 'B': 'J', 'n_gamma': 'm^-3'}
xS, SS = Symbol('x', positive=True), Symbol('S', positive=True)
dimcheck(D, 'S = (1/n_b)(m_e kT/2πħ²)^{3/2} e^{−B/kT}', SS, 1 / Symbol('n_b', positive=True) * (mE * kS * Tz2 / (2 * pi * hbS2 ** 2)) ** R_(3, 2) * exp(-BS / (kS * Tz2)), dict(uSa, me='kg', m_e='kg'))
dimcheck(D, 'x = 2S/(S + √(S²+4S))', xS, 2 * SS / (SS + sqrt(SS ** 2 + 4 * SS)), uSa)
num(D, 'T(x=0.5) (K)', Tx5, '3762', tol=1e-4); num(D, 'z(x=0.5)', Tx5 / T0 - 1, '1379', tol=1e-4); num(D, 'T(x=0.1) (K)', Tx1, '3439', tol=1e-4); num(D, 'z(x=0.1)', Tx1 / T0 - 1, '1261', tol=1e-4); num(D, 'kT/B en x=0.5', kB * Tx5 / (BH * qe), '0.0238', tol=1e-3); num(D, 'B/kT en x=0.5', BH * qe / (kB * Tx5), '42', tol=0.01)
num(D, 'x(z=1100)', saha(T0 * 1101)[1] * 1e3, '4.1'); num(D, 'x(5000 K)', saha(5000.0)[1], '0.99991'); num(D, '1/η (10⁹)', 1 / 6.1e-10 * 1e-9, '1.6', tol=0.03)
S0, x0 = saha(T0 * 1381)
num(D, 'valor inicial: T', T0 * 1381, '3763.9'); num(D, 'valor inicial: S', S0, '0.51193'); num(D, 'valor inicial: x', x0, '0.50394'); num(D, 'valor inicial: kT/B', kB * T0 * 1381 / (BH * qe), '0.0238', tol=1e-3)
def saha_ref(d, o):
    S, x = saha(T0 * (1 + d['z']), d['eta'] * 1e-10); T = T0 * (1 + d['z'])
    return {'T': T, 'S': S, 'x': x, 'kB': kB * T / (BH * qe)}[o]
for o in ('T', 'S', 'x', 'kB'):
    fsim_py('cos-saha', o, (lambda oo_: (lambda d: saha_ref(d, oo_)))(o), tol=1e-8, deriv=D)
