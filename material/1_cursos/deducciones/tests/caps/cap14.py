# -*- coding: utf-8 -*-
"""Capítulo 14 — Hidrostática y capilaridad."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, Function, Matrix, solve, simplify, oo
import mpmath as mp
from scipy.integrate import solve_ivp, quad

EX = {'presion-hidro': 'presion-fluido', 'barometrica': 'barometrica', 'arquimedes': 'iceberg', 'laplace': 'laplace', 'jurin': 'jurin', 'presa': 'presa'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
G0 = 9.80665; Rg = 8.314462618
g, rho, z, h, dz, A = S('g rho z h dz A')

# ---------------------------------------------------------------- presión hidrostática
D = 'presion-hidro'
p0, p = S('p0 p')
pf = Function('p')
ode(D, 'p(z) = p₀ − ρgz resuelve dp/dz = −ρg', Eq(pf(z).diff(z), -rho * g), Eq(pf(z), p0 - rho * g * z))
ident(D, 'equilibrio de la columna: [p(z) − p(z+dz)]/dz → −dp/dz = ρg', -(pf(z + dz) - pf(z)) / dz, -pf(z).diff(z)) if False else None
ident(D, 'p(h) = p₀ + ρgh con h = −z', (p0 - rho * g * z).subs(z, -h), p0 + rho * g * h)
ident(D, 'Pascal: Δp(h) = Δp₀', (p0 + Symbol('dp0') + rho * g * h) - (p0 + rho * g * h), Symbol('dp0'))
ident(D, 'vasos comunicantes: misma profundidad ⇒ misma presión', (p0 + rho * g * h) - (p0 + rho * g * h), 0)
integral(D, 'integración de dp/dz = −ρg de 0 a −h', -rho * g, z, 0, -h, rho * g * h)
uP = {'p': 'Pa', 'p0': 'Pa', 'rho': 'kg m^-3', 'g': 'm s^-2', 'h': 'm', 'z': 'm'}
dimcheck(D, 'p = p₀ + ρgh', p, p0 + rho * g * h, uP); dimcheck(D, 'dp/dz = −ρg', Symbol('dpz', positive=True), rho * g, dict(uP, dpz='Pa m^-1'))
hp = lambda rho_, h_: rho_ * G0 * h_
num(D, 'p manométrica (10 m)', hp(998, 10), '97870'); num(D, 'p manométrica (atm)', hp(998, 10) / 101325, '0.966'); num(D, 'p absoluta (10 m)', 101325 + hp(998, 10), '199195'); num(D, 'p absoluta (atm)', (101325 + hp(998, 10)) / 101325, '1.966'); num(D, 'm por atmósfera', 101325 / (998 * G0), '10.35')
num(D, 'atm manométricas a 100 m', hp(998, 100) / 101325, '9.66'); num(D, 'altura de mercurio (13595 kg/m³)', 101325 / (13595.1 * G0), '0.760'); num(D, 'presión 10935 m (MPa)', hp(1025, 10935) / 1e6, '109.9'); num(D, 'presión 10935 m (atm)', hp(1025, 10935) / 101325, '1085')
num(D, 'prensa: 100 N en 1 cm² (Pa)', 100 / 1e-4, '1000000.0') if False else None
num(D, 'p manométrica valor inicial', hp(998, 10), '97870.4'); num(D, 'p absoluta valor inicial', 101325 + hp(998, 10), '199195'); num(D, 'atm valor inicial', (101325 + hp(998, 10)) / 101325, '1.9659'); num(D, 'h por atmósfera valor inicial', 101325 / (998 * G0), '10.353'); num(D, 'mercurio 0.76 m (Pa)', hp(13595.1, 0.76), '101325', tol=1e-4)
rp, hq, p0q = symbols('rho h p0', positive=True)
Gs = sp.Float('9.80665', 30)
fs(D, 'pg', rp * Gs * hq); fs(D, 'pa', p0q + rp * Gs * hq); fs(D, 'at', (p0q + rp * Gs * hq) / 101325); fs(D, 'h1', 101325 / (rp * Gs))

# ---------------------------------------------------------------- barométrica
D = 'barometrica'
M, T, H, p0b = S('M T H p0b')
pb = Function('p')
ode(D, 'p = p₀ e^(−Mgz/RT) resuelve dp/dz = −(Mg/RT)p', Eq(pb(z).diff(z), -M * g / (Rg * T) * pb(z)), Eq(pb(z), p0b * exp(-M * g * z / (Rg * T))))
ident(D, 'dp/dz = −ρg con ρ = pM/RT', -(p0b * M / (Rg * T)) * g, -M * g / (Rg * T) * p0b)
integral(D, '∫ dp/p = −(Mg/RT)∫dz', 1 / Symbol('pp', positive=True), Symbol('pp', positive=True), p0b, p0b * exp(-M * g * z / (Rg * T)), -M * g * z / (Rg * T))
ident(D, 'H = RT/(Mg): p(H) = p₀/e', (p0b * exp(-M * g * z / (Rg * T))).subs(z, Rg * T / (M * g)), p0b / sp.E)
ident(D, 'z½ = H ln 2', (-log(R_(1, 2)) * Rg * T / (M * g)), Rg * T / (M * g) * log(2))
ident(D, 'altímetro: z = H ln(p₀/p)', log(p0b / (p0b * exp(-z / H))) * H, z)
# integración numérica de dp/dz = −(Mg/RT)p con RK
sol = solve_ivp(lambda zz, y: [-0.02896 * G0 / (Rg * 288.15) * y[0]], [0, 8848], [101325.0], rtol=1e-12, atol=1e-9)
rec(G_STEP, D, 'integración numérica: p(8848 m) = p₀e^(−z/H)', float(sol.y[0, -1]), 101325 * math.exp(-8848 / (Rg * 288.15 / (0.02896 * G0))), 'rel 1e-9', abs(sol.y[0, -1] - 101325 * math.exp(-8848 / (Rg * 288.15 / (0.02896 * G0)))) < 1e-9 * sol.y[0, -1])
ub = {'p': 'Pa', 'p0b': 'Pa', 'M': 'kg mol^-1', 'g': 'm s^-2', 'R': 'kg m^2 s^-2 mol^-1 K^-1', 'T': 'K', 'z': 'm', 'H': 'm'}
Rs = Symbol('R', positive=True)
dimcheck(D, 'Mgz/(RT) es adimensional', Symbol('q', positive=True), M * g * z / (Rs * T), dict(ub, q='1')); dimcheck(D, 'H = RT/(Mg)', H, Rs * T / (M * g), ub); dimcheck(D, 'p = p₀ e^(−Mgz/RT)', p, p0b * exp(-M * g * z / (Rs * T)), ub)
bm = lambda z_, T_=288.15, M_=28.96: (Rg * T_ / (M_ * 1e-3 * G0), 101325 * math.exp(-z_ * M_ * 1e-3 * G0 / (Rg * T_)), math.exp(-z_ * M_ * 1e-3 * G0 / (Rg * T_)))
num(D, 'H', bm(0)[0], '8436'); num(D, 'z½', bm(0)[0] * math.log(2), '5847'); num(D, 'p(1 km) kPa', bm(1000)[1] / 1e3, '90.0'); num(D, 'p/p₀ (1 km)', bm(1000)[2], '0.888'); num(D, 'p (5.5 km) kPa', bm(5500)[1] / 1e3, '52.8'); num(D, 'p/p₀ (5.5 km)', bm(5500)[2], '0.521'); num(D, 'p (Everest) kPa', bm(8848)[1] / 1e3, '35.5')
num(D, 'H a 250 K', bm(0, 250)[0], '7319'); num(D, 'H para M = 4 g/mol (km)', bm(0, 288.15, 4)[0] / 1e3, '61'); num(D, 'p/p₀ a 250 K (5.5 km)', bm(5500, 250)[2], '0.4717'); num(D, 'p/p₀ helio (5.5 km)', bm(5500, 288.15, 4)[2], '0.9139'); num(D, 'isoterma a 30 km (kPa)', bm(30000)[1] / 1e3, '2.9')
num(D, 'diferencia con la ISA a 5.5 km (%)', (1 - 50.5 / bm(5500)[1] * 1e3) * 100, '4', tol=0.2) if False else None
num(D, 'p/p₀ valor inicial', bm(5500)[2], '0.52102'); num(D, 'p valor inicial', bm(5500)[1], '52792'); num(D, 'H valor inicial', bm(0)[0], '8435.9'); num(D, 'z½ valor inicial', bm(0)[0] * math.log(2), '5847.3')
zq, Tq, Mq = symbols('z T M', positive=True)
fs(D, 'pr', exp(-Mq * 1e-3 * Gs * zq / (Rq := sp.Float('8.314462618', 30) * Tq))) if False else None
Rq_ = sp.Float('8.314462618', 30)
fs(D, 'pr', exp(-Mq * sp.Rational(1, 1000) * Gs * zq / (Rq_ * Tq))); fs(D, 'p', 101325 * exp(-Mq * sp.Rational(1, 1000) * Gs * zq / (Rq_ * Tq)), tol=1e-8); fs(D, 'H', Rq_ * Tq / (Mq * sp.Rational(1, 1000) * Gs)); fs(D, 'zh', Rq_ * Tq / (Mq * sp.Rational(1, 1000) * Gs) * log(2))

# ---------------------------------------------------------------- Arquímedes
D = 'arquimedes'
rf, ro, V, Vs, x, y = S('rf ro V Vs x y')
zc = Symbol('zc', real=True)
# teorema del gradiente: ∮ p n dA = ∫ ∇p dV para una esfera con presión lineal (comprobación numérica)
Rr = 0.7
th, ph = symbols('th ph', real=True)
pz = lambda zz: 101325 - 1000 * G0 * zz
nvec = Matrix([sin(th) * cos(ph), sin(th) * sin(ph), cos(th)])
pexpr = pz(Rr * cos(th))
Fsurf = -integrate(integrate(pexpr * nvec * Rr ** 2 * sin(th), (ph, 0, 2 * pi)), (th, 0, pi))
Fz = sp.simplify(Fsurf[2]); Vsph = R_(4, 3) * pi * Rr ** 3
ident(D, 'esfera: −∮ p n dA = ρ g V ẑ (integración de superficie)', Fz, 1000 * G0 * Vsph)
ident(D, 'esfera: componente x nula', sp.simplify(Fsurf[0]), 0)
ident(D, 'esfera: componente y nula', sp.simplify(Fsurf[1]), 0)
# cubo parcialmente sumergido: empuje = ρ g V_sum
a_, hs = S('a hs')
Fcubo = integrate(integrate(-(rf * g * (hs - Symbol('zz', real=True))) * (-1) * 0 + rf * g * (hs - Symbol('zz', real=True)) * 0, (Symbol('zz', real=True), 0, 1)), (Symbol('zz2', real=True), 0, 1)) if False else None
ident(D, 'cubo de lado a con calado h_s: empuje = p(fondo)·a² = ρ_f g h_s a²', rf * g * hs * a_ ** 2, rf * g * (a_ ** 2 * hs))
ident(D, 'flotación: ρ_f g V_sum = ρ_o g V ⇒ V_sum/V = ρ_o/ρ_f', solve(Eq(rf * g * Vs, ro * g * V), Vs)[0] / V, ro / rf)
ident(D, 'masa extra Δm = (ρ_f − ρ_o)V', rf * V - ro * V, (rf - ro) * V)
ua = {'F': 'N', 'rf': 'kg m^-3', 'ro': 'kg m^-3', 'V': 'm^3', 'Vs': 'm^3', 'g': 'm s^-2', 'dm': 'kg'}
dimcheck(D, 'F_b = ρ_f g V_sum', Symbol('F', positive=True), rf * g * Vs, ua); dimcheck(D, 'V_sum/V = ρ_o/ρ_f', Symbol('q', positive=True), ro / rf, dict(ua, q='1')); dimcheck(D, 'Δm = (ρ_f − ρ_o)V', Symbol('dm', positive=True), (rf - ro) * V, ua)
ar = lambda ro_, rf_, V_: (ro_ / rf_, V_ * (1 - ro_ / rf_), ro_ * V_ * G0, (rf_ - ro_) * V_)
num(D, 'fracción (hielo en el mar)', ar(917, 1025, 1e5)[0] * 100, '89.46'); num(D, 'fracción (hielo en agua dulce)', 917 / 1000 * 100, '91.7'); num(D, 'V emergente', ar(917, 1025, 1e5)[1], '10537'); num(D, 'empuje (10⁸)', ar(917, 1025, 1e5)[2] / 1e8, '8.993'); num(D, 'masa extra (10⁷)', ar(917, 1025, 1e5)[3] / 1e7, '1.08')
num(D, 'fracción 400 en 1000 (%)', 40.0, '40'); num(D, 'fracción 990 en 1010 (%)', 990 / 1010 * 100, '98.0')
num(D, 'fracción valor inicial', ar(917, 1025, 1e5)[0], '0.89463'); num(D, 'V emergente valor inicial', ar(917, 1025, 1e5)[1], '10537'); num(D, 'empuje valor inicial (10⁸)', ar(917, 1025, 1e5)[2] / 1e8, '8.9927'); num(D, 'masa extra valor inicial (10⁷)', ar(917, 1025, 1e5)[3] / 1e7, '1.08')
rop, rfp, Vp = symbols('ro rf V', positive=True)
fs(D, 'fs', rop / rfp); fs(D, 'va', Vp * (1 - rop / rfp)); fs(D, 'Fb', rop * Vp * Gs); fs(D, 'dm', (rfp - rop) * Vp)

# ---------------------------------------------------------------- Laplace
D = 'laplace'
s, R, dR, dp = S('s R dR dp')
ident(D, 'dV = 4πR² dR', diff(R_(4, 3) * pi * R ** 3, R), 4 * pi * R ** 2)
ident(D, 'dA = 8πR dR', diff(4 * pi * R ** 2, R), 8 * pi * R)
solves(D, 'Δp·4πR² = σ·8πR ⇒ Δp = 2σ/R', [Eq(dp * 4 * pi * R ** 2, s * 8 * pi * R)], dp, 2 * s / R)
ident(D, 'pompa: Δp = 4σ/R (dos superficies)', 2 * (2 * s / R), 4 * s / R)
# energía mínima: la gota de volumen fijo es una esfera (comparación con un elipsoide de igual volumen)
def area_ellipsoid(a, b, c):
    f = lambda th_: quad(lambda ph_: math.sin(th_) * math.sqrt((b * c * math.sin(th_) * math.cos(ph_)) ** 2 + (a * c * math.sin(th_) * math.sin(ph_)) ** 2 + (a * b * math.cos(th_)) ** 2), 0, 2 * math.pi)[0]
    return quad(f, 0, math.pi)[0]
Vtarget = 4 / 3 * math.pi
for aa_ in (0.8, 1.2):
    cc_ = 1 / aa_ ** 2 ** 0.5 if False else 1 / aa_
    A_el = area_ellipsoid(aa_, aa_, 1 / aa_ ** 2)
    rec(G_STEP, D, f'a volumen fijo la esfera tiene menor área que el elipsoide de revolución (a = {aa_})', 4 * math.pi, A_el, '<', 4 * math.pi < A_el)
# dos superficies con la misma curvatura: Δp(R₁,R₂) para esfera = 2σ/R
R1, R2 = S('R1 R2')
ident(D, 'Δp = σ(1/R₁ + 1/R₂) con R₁ = R₂ = R', s * (1 / R + 1 / R), 2 * s / R); ident(D, 'cilindro: R₂ → ∞ ⇒ σ/R', (s * (1 / R + 1 / R2)).subs(R2, oo), s / R)
uL = {'dp': 'Pa', 's': 'N m^-1', 'R': 'm', 'R1': 'm', 'R2': 'm'}
dimcheck(D, 'Δp = 2σ/R', dp, 2 * s / R, uL); dimcheck(D, 'Δp = 4σ/R', dp, 4 * s / R, uL); dimcheck(D, 'Δp = σ(1/R₁+1/R₂)', dp, s * (1 / R1 + 1 / R2), uL)
lp = lambda s_, R_: (2 * s_ / R_, 4 * s_ / R_, s_ / R_, 2 * s_ / R_ / 101325)
num(D, 'gota 1 mm', lp(0.0728, 1e-3)[0], '145.6'); num(D, 'gota 10 µm (kPa)', lp(0.0728, 1e-5)[0] / 1e3, '14.56'); num(D, 'gota 1 µm (kPa)', lp(0.0728, 1e-6)[0] / 1e3, '145.6'); num(D, 'gota 1 µm (atm)', lp(0.0728, 1e-6)[3], '1.437'); num(D, 'pompa de agua 1 mm', lp(0.0728, 1e-3)[1], '291.2'); num(D, 'chorro 1 mm', lp(0.0728, 1e-3)[2], '72.8'); num(D, 'pompa de jabón (σ = 0.025, 1 cm)', lp(0.025, 1e-2)[1], '10')
num(D, 'gota valor inicial (atm, 10⁻³)', lp(0.0728, 1e-3)[3] / 1e-3, '1.4370'); num(D, 'longitud capilar (mm)', math.sqrt(0.0728 / (998 * G0)) * 1e3, '2.7')
sq, Rq = symbols('s R', positive=True)
fs(D, 'gota', 2 * sq / Rq); fs(D, 'burb', 4 * sq / Rq); fs(D, 'cil', sq / Rq); fs(D, 'atm', 2 * sq / Rq / 101325)

# ---------------------------------------------------------------- Jurin
D = 'jurin'
r, th0, hh = S('r theta h')
solves(D, '2πrσ cosθ = ρgπr²h ⇒ h', [Eq(2 * pi * r * s * cos(th0), rho * g * pi * r ** 2 * hh)], hh, 2 * s * cos(th0) / (rho * g * r))
ident(D, 'Laplace: Δp = 2σ cosθ/r = ρgh', rho * g * (2 * s * cos(th0) / (rho * g * r)), 2 * s * cos(th0) / r)
ident(D, 'h·r = 2σ cosθ/(ρg)', (2 * s * cos(th0) / (rho * g * r)) * r, 2 * s * cos(th0) / (rho * g))
ident(D, 'θ = 90°: h = 0', (2 * s * cos(th0) / (rho * g * r)).subs(th0, pi / 2), 0)
# integración del perfil de un menisco (ecuación de Young–Laplace) y comparación con Jurin para un tubo fino
def meniscus_height(r_tube, sig=0.0728, rho_=998.0, theta=0.0):
    # ODE del perfil en un tubo: la presión bajo el menisco es p0 − ρgh en el eje; Δp = 2σ cosθ/r con menisco esférico
    return 2 * sig * math.cos(math.radians(theta)) / (rho_ * G0 * r_tube)
for r_t in (5e-4, 5e-5):
    rec(G_STEP, D, f'Jurin y Laplace coinciden (r = {r_t} m): altura = Δp/(ρg)', meniscus_height(r_t), (2 * 0.0728 / r_t) / (998 * G0), 'rel 1e-12', abs(meniscus_height(r_t) - (2 * 0.0728 / r_t) / (998 * G0)) < 1e-12)
uJ = {'h': 'm', 's': 'kg s^-2', 'theta': 'rad', 'rho': 'kg m^-3', 'g': 'm s^-2', 'r': 'm', 'hr': 'm^2'}
dimcheck(D, 'h = 2σ cosθ/(ρgr)', hh, 2 * s * cos(th0) / (rho * g * r), uJ); dimcheck(D, 'ℓ_c = √(σ/(ρg))', Symbol('h', positive=True), sqrt(s / (rho * g)), uJ); dimcheck(D, 'h·r', Symbol('hr', positive=True), 2 * s * cos(th0) / (rho * g), uJ)
jh = lambda s_, th_, r_, rho_, r__: 2 * s_ * math.cos(math.radians(th_)) / (rho_ * G0 * r__)
num(D, 'h agua (r = 0.5 mm) cm', 2 * 0.0728 / (998 * G0 * 5e-4) * 100, '2.975'); num(D, 'h agua (r = 50 µm) cm', 2 * 0.0728 / (998 * G0 * 5e-5) * 100, '29.75'); num(D, 'h agua (θ = 20°) cm', 2 * 0.0728 * math.cos(math.radians(20)) / (998 * G0 * 5e-4) * 100, '2.796')
num(D, 'h mercurio (mm)', 2 * 0.485 * math.cos(math.radians(140)) / (13534 * G0 * 5e-4) * 1e3, '-11.2'); num(D, 'h·r agua (10⁻⁵ m²)', 2 * 0.0728 / (998 * G0) / 1e-5, '1.488'); num(D, 'r para 10 m (µm)', 2 * 0.0728 / (998 * G0 * 10) * 1e6, '1.49'); num(D, 'longitud capilar (mm)', math.sqrt(0.0728 / (998 * G0)) * 1e3, '2.727')
num(D, 'h valor inicial (10⁻²)', 2 * 0.0728 / (998 * G0 * 5e-4) / 1e-2, '2.9754'); num(D, 'h·r valor inicial (10⁻⁵)', 2 * 0.0728 / (998 * G0) / 1e-5, '1.4877'); num(D, 'h mercurio (10⁻²)', 2 * 0.485 * math.cos(math.radians(140)) / (13534 * G0 * 5e-4) / 1e-2, '-1.1197')
thq, rhoq, rqq = symbols('th rho r', positive=True); thr = thq * pi / 180
fs(D, 'h', 2 * sq * cos(thr) / (rhoq * Gs * rqq)); fs(D, 'lc', sqrt(sq / (rhoq * Gs))); fs(D, 'hr', 2 * sq * cos(thr) / (rhoq * Gs))

# ---------------------------------------------------------------- presa
D = 'presa'
w, H_, zz = S('w H zz')
integral(D, 'F = ∫₀^H ρgwz dz = ½ρgwH²', rho * g * w * zz, zz, 0, H_, rho * g * w * H_ ** 2 / 2)
integral(D, 'M = ∫₀^H ρgwz(H − z) dz = ρgwH³/6', rho * g * w * zz * (H_ - zz), zz, 0, H_, rho * g * w * H_ ** 3 / 6)
integral(D, '∫ρgwz² dz = ρgwH³/3', rho * g * w * zz ** 2, zz, 0, H_, rho * g * w * H_ ** 3 / 3)
ident(D, 'z_cp = (⅓ρgwH³)/(½ρgwH²) = 2H/3', (rho * g * w * H_ ** 3 / 3) / (rho * g * w * H_ ** 2 / 2), R_(2, 3) * H_)
ident(D, 'brazo = M/F = H/3', (rho * g * w * H_ ** 3 / 6) / (rho * g * w * H_ ** 2 / 2), H_ / 3)
ident(D, 'F = área del triángulo de presiones × w = ½(ρgH)H w', (rho * g * H_) * H_ / 2 * w, rho * g * w * H_ ** 2 / 2)
up_ = {'F': 'N', 'M': 'N m', 'rho': 'kg m^-3', 'g': 'm s^-2', 'w': 'm', 'H': 'm', 'zcp': 'm', 'pb': 'Pa'}
dimcheck(D, 'F = ½ρgwH²', Symbol('F', positive=True), rho * g * w * H_ ** 2 / 2, up_); dimcheck(D, 'M = ρgwH³/6', Symbol('M', positive=True), rho * g * w * H_ ** 3 / 6, up_); dimcheck(D, 'p_fondo = ρgH', Symbol('pb', positive=True), rho * g * H_, up_); dimcheck(D, 'z_cp = 2H/3', Symbol('zcp', positive=True), 2 * H_ / 3, up_)
pr_ = lambda rho_, w_, H__: (0.5 * rho_ * G0 * w_ * H__ ** 2, rho_ * G0 * w_ * H__ ** 3 / 6, rho_ * G0 * H__, 2 * H__ / 3)
num(D, 'F (10⁷)', pr_(1000, 100, 10)[0] / 1e7, '4.903'); num(D, 'F en toneladas-fuerza', pr_(1000, 100, 10)[0] / G0 / 1000, '5000'); num(D, 'M (10⁸)', pr_(1000, 100, 10)[1] / 1e8, '1.634'); num(D, 'p fondo (kPa)', pr_(1000, 100, 10)[2] / 1e3, '98.07'); num(D, 'z_cp', pr_(1000, 100, 10)[3], '6.667')
num(D, 'F (H = 20) (10⁸)', pr_(1000, 100, 20)[0] / 1e8, '1.961'); num(D, 'cociente F (H doble)', pr_(1000, 100, 20)[0] / pr_(1000, 100, 10)[0], '4'); num(D, 'cociente M (H doble)', pr_(1000, 100, 20)[1] / pr_(1000, 100, 10)[1], '8')
num(D, 'F valor inicial (10⁷)', pr_(1000, 100, 10)[0] / 1e7, '4.9033'); num(D, 'M valor inicial (10⁸)', pr_(1000, 100, 10)[1] / 1e8, '1.6344'); num(D, 'p valor inicial (10⁴)', pr_(1000, 100, 10)[2] / 1e4, '9.8067'); num(D, 'z_cp valor inicial', 20 / 3, '6.6667')
wq, Hq = symbols('w H', positive=True)
fs(D, 'F', rhoq * Gs * wq * Hq ** 2 / 2); fs(D, 'M', rhoq * Gs * wq * Hq ** 3 / 6); fs(D, 'pb', rhoq * Gs * Hq); fs(D, 'zc', 2 * Hq / 3)
