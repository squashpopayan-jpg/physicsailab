# -*- coding: utf-8 -*-
"""Capítulo 7 — Trabajo, energía, choques y potencia."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, tan, atan2, asin, Function, solve, Piecewise, cbrt, oo
import mpmath as mp

EX = {'resorte-trabajo': 'resorte', 'rizo': 'rizo', 'choque-1d': 'choque-1d', 'choque-lab': 'choque-lab', 'vehiculo': 'vehiculo'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
fp_ = lambda D_, *a, **k: fsim_py(EX.get(D_, D_), *a, deriv=D_, **k)
g, m, t = S('g m t')

# ---------------------------------------------------------------- resorte
D = 'resorte-trabajo'
k, x0, mu, v, d, s, x = S('k x0 mu v d s x')
vf = Function('v')
ident(D, 'd(½mv²)/dt = F v (F = m dv/dt)', diff(m * vf(t) ** 2 / 2, t), m * vf(t).diff(t) * vf(t))
integral(D, 'trabajo del resorte ∫_{−x₀}^{0}(−kx)dx = ½kx₀²', -k * x, x, -x0, 0, k * x0 ** 2 / 2)
solves(D, '½mv² = ½kx₀² − μmgx₀ → v', [Eq(m * v ** 2 / 2, k * x0 ** 2 / 2 - mu * m * g * x0)], v, sqrt(k * x0 ** 2 / m - 2 * mu * g * x0))
solves(D, '½kx₀² = μmg d_tot → d_tot', [Eq(k * x0 ** 2 / 2, mu * m * g * d)], d, k * x0 ** 2 / (2 * mu * m * g))
ident(D, 's = v²/(2μg) = d_tot − x₀', (k * x0 ** 2 / m - 2 * mu * g * x0) / (2 * mu * g), k * x0 ** 2 / (2 * mu * m * g) - x0)
ur = {'k': 'kg s^-2', 'x0': 'm', 'm': 'kg', 'mu': '1', 'g': 'm s^-2', 'v': 'm s^-1', 'd': 'm'}
dimcheck(D, 'v = √(kx₀²/m − 2μgx₀)', v, sqrt(k * x0 ** 2 / m - 2 * mu * g * x0), ur)
dimcheck(D, 'd_tot = kx₀²/(2μmg)', d, k * x0 ** 2 / (2 * mu * m * g), ur)
rs = lambda k_, x_, m_, mu_: (math.sqrt(k_ * x_ ** 2 / m_ - 2 * mu_ * 9.81 * x_), k_ * x_ ** 2 / (2 * mu_ * m_ * 9.81), k_ * x_ ** 2 / (2 * mu_ * m_ * 9.81) - x_)
num(D, 'v', rs(500, 0.1, 0.5, 0.3)[0], '3.068'); num(D, 'v sin rozamiento', math.sqrt(500 * 0.01 / 0.5), '3.162'); num(D, 'd_tot', rs(500, 0.1, 0.5, 0.3)[1], '1.699'); num(D, 's', rs(500, 0.1, 0.5, 0.3)[2], '1.599')
num(D, 'v (μ = 0.1)', rs(500, 0.1, 0.5, 0.1)[0], '3.131'); num(D, 'd (μ = 0.1)', rs(500, 0.1, 0.5, 0.1)[1], '5.097'); num(D, 'v (k = 1000)', rs(1000, 0.1, 0.5, 0.3)[0], '4.406'); num(D, 'v (x₀ = 0.2)', rs(500, 0.2, 0.5, 0.3)[0], '6.231'); num(D, 'd (x₀ = 0.2)', rs(500, 0.2, 0.5, 0.3)[1], '6.796')
num(D, '½kx₀²', 0.5 * 500 * 0.01, '2.5'); num(D, 'μmg d_tot', 0.3 * 0.5 * 9.81 * rs(500, 0.1, 0.5, 0.3)[1], '2.5'); num(D, 'μmg x₀', 0.3 * 0.5 * 9.81 * 0.1, '0.147')
num(D, 'v valor inicial', rs(500, 0.1, 0.5, 0.3)[0], '3.0678'); num(D, 'd valor inicial', rs(500, 0.1, 0.5, 0.3)[1], '1.6989'); num(D, 's valor inicial', rs(500, 0.1, 0.5, 0.3)[2], '1.5989')
kp, x0p, mp_, mup, gp = symbols('k x0 m mu g', positive=True)
fs(D, 'v', sqrt(kp * x0p ** 2 / mp_ - 2 * mup * gp * x0p)); fs(D, 'd', kp * x0p ** 2 / (2 * mup * mp_ * gp)); fs(D, 's', kp * x0p ** 2 / (2 * mup * mp_ * gp) - x0p)

# ---------------------------------------------------------------- rizo
D = 'rizo'
R, h, N, y, vv, q = S('R h N y vv q')
ident(D, 'v² = 2g(h − y) en y = 2R', (2 * g * (h - y)).subs(y, 2 * R), 2 * g * (h - 2 * R))
solves(D, 'N + mg = mv²/R en el punto más alto → N', [Eq(N + m * g, m * 2 * g * (h - 2 * R) / R)], N, m * g * (2 * h / R - 5))
solves(D, 'N = 0 → h = 5R/2', [Eq(m * g * (2 * h / R - 5), 0)], h, R_(5, 2) * R)
ident(D, 'v_arriba(h = 5R/2) = √(gR)', (2 * g * (R_(5, 2) * R - 2 * R)), g * R)
solves(D, 'N − mg = mv²/R abajo con v² = 2gh', [Eq(N - m * g, m * 2 * g * h / R)], N, m * g * (1 + 2 * h / R))
ident(D, 'N_abajo − N_arriba = 6mg', m * g * (1 + 2 * h / R) - m * g * (2 * h / R - 5), 6 * m * g)
ident(D, 'péndulo: v_abajo² = 5gR equivale a v_arriba² = gR', 5 * g * R - 4 * g * R, g * R)
uz = {'R': 'm', 'h': 'm', 'g': 'm s^-2', 'm': 'kg', 'N': 'N', 'v': 'm s^-1'}
dimcheck(D, 'N_arriba = mg(2h/R − 5)', N, m * g * (2 * h / R - 5), uz); dimcheck(D, 'N_abajo = mg(1 + 2h/R)', N, m * g * (1 + 2 * h / R), uz); dimcheck(D, 'v_arriba = √(2g(h−2R))', v, sqrt(2 * g * (h - 2 * R)), uz)
for qq, nt_, vt_, vb_, nb_ in ((3.5, '2', '5.425', '8.287', '8'), (2.5, '0', '3.132', '7.004', '6'), (5, '5', '7.672', '9.905', '11')):
    num(D, f'N/mg arriba (h/R = {qq})', 2 * qq - 5, nt_); num(D, f'v arriba (h/R = {qq})', math.sqrt(2 * 9.81 * (qq - 2)), vt_); num(D, f'v abajo (h/R = {qq})', math.sqrt(2 * 9.81 * qq), vb_); num(D, f'N/mg abajo (h/R = {qq})', 1 + 2 * qq, nb_)
num(D, 'v arriba (R = 0.5)', math.sqrt(2 * 9.81 * 0.5 * 1.5), '3.836'); num(D, 'v arriba valor inicial', math.sqrt(2 * 9.81 * 1.5), '5.4249'); num(D, 'v abajo valor inicial', math.sqrt(2 * 9.81 * 3.5), '8.2867')
Rp, qp, gp = symbols('R q g', positive=True)
fs(D, 'nt', 2 * qp - 5); fs(D, 'vt', sqrt(2 * gp * Rp * (qp - 2))); fs(D, 'vb', sqrt(2 * gp * Rp * qp)); fs(D, 'nb', 1 + 2 * qp)

# ---------------------------------------------------------------- choque 1D
D = 'choque-1d'
m1, m2, v1, v2, w1, w2, e = S('m1 m2 v1 v2 w1 w2 e')
eqs = [Eq(m1 * v1 + m2 * v2, m1 * w1 + m2 * w2), Eq(w2 - w1, -e * (v2 - v1))]
sol = sp.solve(eqs, [w1, w2], dict=True)[0]
ident(D, "v₁′ del sistema (momento + restitución)", sol[w1], ((m1 - e * m2) * v1 + m2 * (1 + e) * v2) / (m1 + m2))
ident(D, "v₂′ del sistema (momento + restitución)", sol[w2], ((m2 - e * m1) * v2 + m1 * (1 + e) * v1) / (m1 + m2))
W1 = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2); W2 = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2)
ident(D, 'e = 1: energía conservada', m1 * v1 ** 2 / 2 + m2 * v2 ** 2 / 2, m1 * W1 ** 2 / 2 + m2 * W2 ** 2 / 2)
ident(D, 'e = 1: v₁ + v₁′ = v₂ + v₂′', v1 + W1, v2 + W2)
w1e = ((m1 - e * m2) * v1 + m2 * (1 + e) * v2) / (m1 + m2); w2e = ((m2 - e * m1) * v2 + m1 * (1 + e) * v1) / (m1 + m2)
ident(D, 'momento conservado con e general', m1 * w1e + m2 * w2e, m1 * v1 + m2 * v2)
ident(D, 'ΔK = ½μ(1−e²)(v₁−v₂)²', (m1 * v1 ** 2 + m2 * v2 ** 2) / 2 - (m1 * w1e ** 2 + m2 * w2e ** 2) / 2, m1 * m2 / (m1 + m2) * (1 - e ** 2) * (v1 - v2) ** 2 / 2)
ident(D, 'masas iguales, e = 1: intercambian velocidades', w1e.subs({m2: m1, e: 1}), v2); ident(D, 'masas iguales, e = 1 (v₂′)', w2e.subs({m2: m1, e: 1}), v1)
ident(D, 'e = 0: velocidad común del centro de masas', w1e.subs(e, 0), (m1 * v1 + m2 * v2) / (m1 + m2))
ident(D, 'm₂ → ∞: v₁′ → −e v₁ (v₂ = 0)', sp.limit(w1e.subs(v2, 0), m2, oo), -e * v1)
ut = {'m1': 'kg', 'm2': 'kg', 'v1': 'm s^-1', 'v2': 'm s^-1', 'w1': 'm s^-1', 'w2': 'm s^-1', 'e': '1', 'dK': 'kg m^2 s^-2'}
dimcheck(D, "v₁′", w1, w1e, ut); dimcheck(D, 'ΔK', Symbol('dK', positive=True), m1 * m2 / (m1 + m2) * (1 - e ** 2) * (v1 - v2) ** 2 / 2, ut)
ch = lambda m1_, m2_, v1_, v2_, e_: (((m1_ - e_ * m2_) * v1_ + m2_ * (1 + e_) * v2_) / (m1_ + m2_), ((m2_ - e_ * m1_) * v2_ + m1_ * (1 + e_) * v1_) / (m1_ + m2_), 0.5 * m1_ * m2_ / (m1_ + m2_) * (1 - e_ ** 2) * (v1_ - v2_) ** 2)
num(D, 'v₁′ (e = 1)', ch(2, 1, 5, -2, 1)[0], '0.333'); num(D, 'v₂′ (e = 1)', ch(2, 1, 5, -2, 1)[1], '7.333'); num(D, 'K inicial', 0.5 * 2 * 25 + 0.5 * 1 * 4, '27')
num(D, 'v₁′ (e = 0.5)', ch(2, 1, 5, -2, 0.5)[0], '1.5'); num(D, 'v₂′ (e = 0.5)', ch(2, 1, 5, -2, 0.5)[1], '5.0'); num(D, 'ΔK (e = 0.5)', ch(2, 1, 5, -2, 0.5)[2], '12.25')
num(D, 'v₁′ (e = 0)', ch(2, 1, 5, -2, 0)[0], '2.667'); num(D, 'ΔK (e = 0)', ch(2, 1, 5, -2, 0)[2], '16.33'); num(D, 'ΔK/K (e = 0) %', ch(2, 1, 5, -2, 0)[2] / 27 * 100, '60')
num(D, 'masas iguales v₁′', ch(1, 1, 5, 0, 1)[0], '0'); num(D, 'masas iguales v₂′', ch(1, 1, 5, 0, 1)[1], '5')
num(D, 'm₂ = 3: v₁′', ch(1, 3, 4, 0, 1)[0], '-2'); num(D, 'm₂ = 3: v₂′', ch(1, 3, 4, 0, 1)[1], '2'); num(D, 'pesado: v₁′', ch(10, 1, 3, 0, 1)[0], '2.455'); num(D, 'pesado: v₂′', ch(10, 1, 3, 0, 1)[1], '5.455')
num(D, '1 − e² (e = 0.5) %', (1 - 0.25) * 100, '75')
num(D, 'v₁′ valor inicial', ch(2, 1, 5, -2, 1)[0], '0.3333'); num(D, 'v₂′ valor inicial', ch(2, 1, 5, -2, 1)[1], '7.3333')
m1p, m2p, v1p, e_p = symbols('m1 m2 v1 e', positive=True); v2p = Symbol('v2', real=True)
fs(D, 'w1', ((m1p - e_p * m2p) * v1p + m2p * (1 + e_p) * v2p) / (m1p + m2p)); fs(D, 'w2', ((m2p - e_p * m1p) * v2p + m1p * (1 + e_p) * v1p) / (m1p + m2p))
fs(D, 'dK', m1p * m2p / (m1p + m2p) * (1 - e_p ** 2) * (v1p - v2p) ** 2 / 2, tol=1e-8); fs(D, 'K0', m1p * v1p ** 2 / 2 + m2p * v2p ** 2 / 2)

# ---------------------------------------------------------------- dispersión lab/cm
D = 'choque-lab'
r_, th, V, u1, tl = S('r theta V u1 tl')
ident(D, 'r = V/u₁ = m₁/m₂', (m1 * v1 / (m1 + m2)) / (m2 * v1 / (m1 + m2)), m1 / m2)
ident(D, 'tanθ_lab = senθ/(r + cosθ)', (u1 * sin(th)) / (V + u1 * cos(th)), sin(th) / (V / u1 + cos(th)))
rr = Symbol('rr', positive=True)
for rv in (2, 3, 10):
    c_ = -R_(1, rv); s_ = sqrt(1 - c_ ** 2); tl_ = s_ / (rv + c_)
    ident(D, f'senθ_lab,máx = 1/r (r = {rv})', sp.sin(sp.atan(tl_)), R_(1, rv))
    d_ = float(diff(sin(th) / (rv + cos(th)), th).subs(th, sp.acos(c_)))
    rec(G_STEP, D, f'd(tanθ_lab)/dθ_cm = 0 en cosθ = −1/r (r = {rv})', d_, 0.0, 'abs 1e-12', abs(d_) < 1e-12)
ident(D, '|v₂′|² = 2V²(1 − cosθ)', (V * (1 - cos(th))) ** 2 + (V * sin(th)) ** 2, 2 * V ** 2 * (1 - cos(th)))
ident(D, '|v₂′| = 2V sen(θ/2) (al cuadrado)', 2 * V ** 2 * (1 - cos(th)), (2 * V * sin(th / 2)) ** 2)
ident(D, 'K₂′/K₁ = 4m₁m₂/(m₁+m₂)² sen²(θ/2)', (m2 * (2 * (m1 * v1 / (m1 + m2)) * sin(th / 2)) ** 2 / 2) / (m1 * v1 ** 2 / 2), 4 * m1 * m2 / (m1 + m2) ** 2 * sin(th / 2) ** 2)
# simulación vectorial: velocidades en el laboratorio desde el CM
for (m1_, m2_, thd) in ((2, 1, 90), (1, 1, 90), (1, 2, 120), (5, 1, 60)):
    v0 = 1.0; Vc = m1_ * v0 / (m1_ + m2_); U1 = m2_ * v0 / (m1_ + m2_); T = math.radians(thd)
    vx, vy = Vc + U1 * math.cos(T), U1 * math.sin(T); lab = math.degrees(math.atan2(vy, vx)); ref = math.degrees(math.atan2(math.sin(T), m1_ / m2_ + math.cos(T)))
    K1p = 0.5 * m1_ * (vx ** 2 + vy ** 2); K2p = 0.5 * m1_ * v0 ** 2 - K1p; Kt = 0.5 * m1_ * v0 ** 2
    rec(G_STEP, D, f'simulación vectorial θ_lab (m₁ = {m1_}, m₂ = {m2_}, θ_cm = {thd}°)', lab, ref, 'abs 1e-12', abs(lab - ref) < 1e-12)
    ref2 = 4 * m1_ * m2_ / (m1_ + m2_) ** 2 * math.sin(T / 2) ** 2
    rec(G_STEP, D, f'simulación vectorial: energía cedida (m₁ = {m1_}, m₂ = {m2_})', K2p / Kt, ref2, 'abs 1e-12', abs(K2p / Kt - ref2) < 1e-12)
dimcheck(D, 'tanθ_lab es adimensional', Symbol('tl', positive=True), sin(th) / (Symbol('r', positive=True) + cos(th)), {'tl': '1', 'theta': 'rad', 'r': '1'})
dimcheck(D, 'K₂′/K₁', Symbol('tl', positive=True), 4 * Symbol('r', positive=True) / (1 + Symbol('r', positive=True)) ** 2 * sin(th / 2) ** 2, {'tl': '1', 'theta': 'rad', 'r': '1'})
labf = lambda r, thd: (math.degrees(math.atan2(math.sin(math.radians(thd)), r + math.cos(math.radians(thd)))), 4 * r / (1 + r) ** 2 * math.sin(math.radians(thd) / 2) ** 2)
num(D, 'θ_lab (r=2, 90°)', labf(2, 90)[0], '26.57'); num(D, 'cedida (r=2, 90°) %', labf(2, 90)[1] * 100, '44.4'); num(D, 'θ_lab máx (r=2)', math.degrees(math.asin(0.5)), '30'); num(D, 'θ_lab (r=1, 90°)', labf(1, 90)[0], '45'); num(D, 'θ_lab (r=5, 90°)', labf(5, 90)[0], '11.31'); num(D, 'máx (r=5)', math.degrees(math.asin(0.2)), '11.54'); num(D, 'θ_lab (r=0.5, 90°)', labf(0.5, 90)[0], '63.43')
num(D, 'transferencia máx r=2 (%)', 8 / 9 * 100, '88.9'); num(D, 'transferencia máx r=0.1 (%)', 0.4 / 1.21 * 100, '33.1'); num(D, 'electrón/protón (%)', 4 / 1836 / (1 + 1 / 1836) ** 2 * 100, '0.22'); num(D, 'n/C-12 (%)', 4 / 12 / (13 / 12) ** 2 * 100, '28.4'); num(D, 'α/Au', 4 / 197, '0.020')
num(D, 'θ_lab valor inicial', labf(2, 90)[0], '26.5651'); num(D, 'cedida valor inicial', labf(2, 90)[1], '0.44444'); num(D, 'cedida (r=1, 90°)', labf(1, 90)[1], '0.5')
rp, thp = symbols('r theta', positive=True)
cv = lambda p: dict(r=p['r'], theta=math.radians(p['th']))
fs(D, 'tl', atan2(sin(thp), rp + cos(thp)) * 180 / pi, conv=cv); fs(D, 'tr', 4 * rp / (1 + rp) ** 2 * sin(thp / 2) ** 2, conv=cv)
fs(D, 'tm', Piecewise((asin(1 / rp) * 180 / pi, rp > 1), (180, True)), conv=cv)

# ---------------------------------------------------------------- vehículo
D = 'vehiculo'
P, rho, cda, crr, F, v = S('P rho cda crr F v')
vv_ = Function('v')
ident(D, 'P = F v con F = ½ρC_DA v² + C_rr mg', (rho * cda * v ** 2 / 2 + crr * m * g) * v, rho * cda * v ** 3 / 2 + crr * m * g * v)
ident(D, 'dP/dv = (3/2)ρC_DA v² + C_rr mg > 0', diff(rho * cda * v ** 3 / 2 + crr * m * g * v, v), R_(3, 2) * rho * cda * v ** 2 + crr * m * g)
solves(D, 'solo aire: P = ½ρC_DA v³ → v', [Eq(P, rho * cda * v ** 3 / 2)], v, (2 * P / (rho * cda)) ** R_(1, 3))
ident(D, 'duplicar P multiplica v (solo aire) por 2^(1/3)', ((2 * 2 * P / (rho * cda)) ** R_(1, 3)) / ((2 * P / (rho * cda)) ** R_(1, 3)), 2 ** R_(1, 3))
x_ = Symbol('x', real=True)
cub = sp.Poly(rho * cda / 2 * x_ ** 3 + crr * m * g * x_ - P, x_)
rec(G_STEP, D, 'la cúbica tiene una sola raíz real (discriminante < 0)', float(sp.discriminant(cub.as_expr().subs({rho: 1.2, cda: 0.7, crr: 0.012, m: 1500, g: 9.80665, P: 100000}), x_)), 0.0, '< 0', sp.discriminant(cub.as_expr().subs({rho: 1.2, cda: 0.7, crr: 0.012, m: 1500, g: 9.80665, P: 100000}), x_) < 0)
upv = {'P': 'kg m^2 s^-3', 'rho': 'kg m^-3', 'cda': 'm^2', 'crr': '1', 'm': 'kg', 'g': 'm s^-2', 'v': 'm s^-1'}
dimcheck(D, 'P = ½ρC_DA v³ + C_rr m g v', P, rho * cda * v ** 3 / 2 + crr * m * g * v, upv)
dimcheck(D, 'v ≈ (2P/(ρC_DA))^(1/3)', v, (2 * P / (rho * cda)) ** R_(1, 3), upv)
G0 = 9.80665
def vmax(P_, m_, cda_, crr_, rho_=1.2):
    f = lambda vq: 0.5 * rho_ * cda_ * vq ** 3 + crr_ * m_ * G0 * vq - P_ * 1000
    vm_ = float(mp.findroot(f, 30)); return vm_, vm_ * 3.6, (2 * P_ * 1000 / (rho_ * cda_)) ** (1 / 3), crr_ * m_ * G0 * vm_ / (P_ * 1000)
b0 = vmax(100, 1500, 0.7, 0.012)
num(D, 'v_máx', b0[0], '59.72'); num(D, 'v_máx km/h', b0[1], '215.0'); num(D, 'v solo aire', b0[2], '61.98'); num(D, 'v solo aire km/h', b0[2] * 3.6, '223.1'); num(D, 'fracción de rodadura %', b0[3] * 100, '10.5')
b2 = vmax(200, 1500, 0.7, 0.012); num(D, 'v (200 kW)', b2[0], '76.30'); num(D, 'v (200 kW) km/h', b2[1], '274.7'); num(D, 'aumento con 2P %', (b2[0] / b0[0] - 1) * 100, '27.8'); num(D, '2^(1/3)', 2 ** (1 / 3), '1.26')
num(D, 'C_DA = 0.5', vmax(100, 1500, 0.5, 0.012)[0], '66.51'); num(D, 'C_DA = 0.5 km/h', vmax(100, 1500, 0.5, 0.012)[1], '239.4'); num(D, 'm = 3000', vmax(100, 3000, 0.7, 0.012)[0], '57.47'); num(D, 'rodadura m = 3000 %', vmax(100, 3000, 0.7, 0.012)[3] * 100, '20')
num(D, 'ρ = 0.6', vmax(100, 1500, 0.7, 0.012, 0.6)[0], '74.50'); num(D, 'compacto', vmax(60, 1200, 0.65, 0.012)[0], '51.33'); num(D, 'compacto km/h', vmax(60, 1200, 0.65, 0.012)[1], '184.8')
Pn = lambda P_: vmax(P_, 1500, 0.7, 0.012)[0]
num(D, 'n_P', (math.log(Pn(100 * (1 + 1e-5))) - math.log(Pn(100 * (1 - 1e-5)))) / 2e-5, '0.359')
num(D, 'v valor inicial', b0[0], '59.721'); num(D, 'v km/h valor inicial', b0[1], '214.99'); num(D, 'v solo aire valor inicial', b0[2], '61.980'); num(D, 'fracción valor inicial', b0[3], '0.10542')
fp_(D, 'vm', lambda p: vmax(p['P'], p['m'], p['cda'], p['crr'], p['rho'])[0], tol=1e-9)
fp_(D, 'kmh', lambda p: vmax(p['P'], p['m'], p['cda'], p['crr'], p['rho'])[1], tol=1e-9)
fp_(D, 'fr', lambda p: vmax(p['P'], p['m'], p['cda'], p['crr'], p['rho'])[3], tol=1e-9)
Pp, rhop, cdap = symbols('P rho cda', positive=True)
fs(D, 'vd', (2 * Pp * 1000 / (rhop * cdap)) ** R_(1, 3))
