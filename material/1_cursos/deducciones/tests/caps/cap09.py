# -*- coding: utf-8 -*-
"""Capítulo 9 — Gravitación, órbitas y dispersión."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, tan, cot, atan, acos, Function, oo, solve, simplify
import mpmath as mp
from scipy.integrate import solve_ivp

EX = {'orbita-conica': 'conica', 'vis-viva': 'visviva', 'hohmann': 'hohmann', 'rutherford': 'rutherford', 'marea': 'marea'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
G = 6.6743e-11; ME = 5.972e24; MS = 1.989e30; KE = 1.439964548
m, t = S('m t')

# ---------------------------------------------------------------- Binet / cónica
D = 'orbita-conica'
L, k, p, e, th, M = S('L k p e theta M')
u = Function('u')
thf = Function('th')
us = u(th)
# r̈ − r θ̇² en función de u(θ) con θ̇ = L u²/m
ud = us.diff(th)
rdot = -(L / m) * ud
rddot = -(L ** 2 * us ** 2 / m ** 2) * us.diff(th, 2)
ident(D, 'ṙ = −(L/m) du/dθ (regla de la cadena)', (-1 / us ** 2 * us.diff(th)) * (L * us ** 2 / m), rdot)
ident(D, 'r̈ = −(L²u²/m²) u″', diff(rdot, th) * (L * us ** 2 / m), rddot)
ident(D, 'm(r̈ − rθ̇²) = −(L²u²/m)(u″ + u)', m * (rddot - (1 / us) * (L * us ** 2 / m) ** 2), -(L ** 2 * us ** 2 / m) * (us.diff(th, 2) + us))
uo = m * k / L ** 2 * (1 + e * cos(th))
ident(D, 'u″ + u = mk/L² con u = (mk/L²)(1 + e cosθ)', diff(uo, th, 2) + uo, m * k / L ** 2)
ident(D, 'r = p/(1 + e cosθ) con p = L²/(mk)', 1 / uo, (L ** 2 / (m * k)) / (1 + e * cos(th)))
pp = Symbol('pp', positive=True); ee = Symbol('ee', positive=True)
rp_, ra_ = pp / (1 + ee), pp / (1 - ee)
ident(D, 'a = (r_p + r_a)/2 = p/(1−e²)', (rp_ + ra_) / 2, pp / (1 - ee ** 2)); ident(D, 'b² = r_p r_a = p²/(1−e²)', rp_ * ra_, pp ** 2 / (1 - ee ** 2))
ident(D, 'v_p/v_a = r_a/r_p = (1+e)/(1−e)', ra_ / rp_, (1 + ee) / (1 - ee))
# integración numérica de la órbita (GM = m = 1): r(θ) y rmax
for pv, ev in ((1.0, 0.5), (2.0, 0.2), (0.7, 0.9)):
    mu = 1.0; Lq = math.sqrt(pv * mu); r0 = pv / (1 + ev)
    def rhs(tt, y):
        r_, vr_, th_ = y; return [vr_, Lq ** 2 / r_ ** 3 - mu / r_ ** 2, Lq / r_ ** 2]
    ev_ = lambda tt, y: y[2] - math.pi
    ev_.terminal = True
    sol = solve_ivp(rhs, [0, 50], [r0, 0.0, 0.0], events=ev_, rtol=1e-12, atol=1e-13, dense_output=True)
    rend = sol.y[0, -1]; ra_exact = pv / (1 - ev)
    rec(G_STEP, D, f'integración numérica: r(θ = π) = p/(1−e) (p = {pv}, e = {ev})', rend, ra_exact, 'rel 1e-8', abs(rend - ra_exact) < 1e-8 * ra_exact)
    tm = sol.t[len(sol.t) // 2]; rm, _, thm = sol.sol(tm)
    rf = pv / (1 + ev * math.cos(thm))
    rec(G_STEP, D, f'integración numérica: r(θ) en un punto intermedio (p = {pv}, e = {ev})', rm, rf, 'rel 1e-8', abs(rm - rf) < 1e-8 * rf)
uo_ = {'r': 'm', 'p': 'm', 'e': '1', 'theta': 'rad', 'L': 'kg m^2 s^-1', 'm': 'kg', 'k': 'kg m^3 s^-2'}
dimcheck(D, 'r = p/(1+e cosθ)', Symbol('r', positive=True), p / (1 + e * cos(th)), uo_); dimcheck(D, 'p = L²/(mk)', p, L ** 2 / (m * k), uo_)
num(D, 'r_p (e = 0.5)', 1 / 1.5, '0.6667'); num(D, 'r_a (e = 0.5)', 2.0, '2'); num(D, 'a (e = 0.5)', 1 / 0.75, '1.3333'); num(D, 'b (e = 0.5)', 1 / math.sqrt(0.75), '1.1547'); num(D, 'v_p/v_a (e = 0.5)', 3.0, '3')
num(D, 'r_p (e = 0.9)', 1 / 1.9, '0.526'); num(D, 'r_a (e = 0.9)', 10.0, '10'); num(D, 'v_p/v_a Tierra', 1.0167 / 0.9833, '1.034'); num(D, 'v_p/v_a Tierra exacta', 1.0167 / 0.9833, '1.034'); num(D, 'v_p/v_a Mercurio', 1.2056 / 0.7944, '1.518'); num(D, 'v_p/v_a Halley', 1.967 / 0.033, '59.6'); num(D, 'v_p/v_a (e = 0.95)', 1.95 / 0.05, '39')
num(D, 'r_p valor inicial', 1 / 1.5, '0.66667'); num(D, 'b valor inicial', 1 / math.sqrt(0.75), '1.15470'); num(D, 'a valor inicial', 4 / 3, '1.33333')
ep, pp_ = symbols('e p', positive=True)
fs(D, 'rp', pp_ / (1 + ep)); fs(D, 'ra', pp_ / (1 - ep)); fs(D, 'a', pp_ / (1 - ep ** 2)); fs(D, 'b', pp_ / sqrt(1 - ep ** 2)); fs(D, 'rr', (1 + ep) / (1 - ep))

# ---------------------------------------------------------------- vis-viva y Kepler III
D = 'vis-viva'
GM, r, a, v, rp, T, E_, Mm = S('GM r a v rp T E Mm')
vp2 = GM * (1 + e) / (a * (1 - e))
ident(D, 'v_p² = GM p/r_p² con p = a(1−e²), r_p = a(1−e)', GM * (a * (1 - e ** 2)) / (a * (1 - e)) ** 2, vp2)
Ep = vp2 / 2 - GM / (a * (1 - e))
ident(D, 'E/m = −GM/(2a) en el perihelio', Ep, -GM / (2 * a))
ra = a * (1 + e); va2 = GM * (1 - e) / (a * (1 + e))
ident(D, 'E/m en el afelio = −GM/(2a)', va2 / 2 - GM / ra, -GM / (2 * a))
ident(D, 'vis-viva en el perihelio', GM * (2 / (a * (1 - e)) - 1 / a), vp2)
ident(D, 'vis-viva en el afelio', GM * (2 / ra - 1 / a), va2)
p_ = a * (1 - e ** 2); b_ = a * sqrt(1 - e ** 2)
ident(D, 'T = 2πab/√(GM p) = 2π√(a³/GM)', 2 * pi * a * b_ / sqrt(GM * p_), 2 * pi * sqrt(a ** 3 / GM))
ident(D, 'v_esc = √2 v_c', sqrt(2 * GM / r), sqrt(2) * sqrt(GM / r))
ident(D, 'a → ∞: vis-viva da v_esc', (GM * (2 / r - 1 / a)).subs(a, oo), 2 * GM / r)
uv = {'v': 'm s^-1', 'GM': 'm^3 s^-2', 'r': 'm', 'a': 'm', 'T': 's', 'E': 'm^2 s^-2'}
dimcheck(D, 'v² = GM(2/r − 1/a)', v ** 2, GM * (2 / r - 1 / a), uv); dimcheck(D, 'T = 2π√(a³/GM)', T, 2 * pi * sqrt(a ** 3 / GM), uv); dimcheck(D, 'E/m = −GM/(2a)', E_, -GM / (2 * a), uv)
mu_ = G * ME; vvf = lambda mu, a_, r_: math.sqrt(mu * (2 / r_ - 1 / a_)); Tn = lambda mu, a_: 2 * math.pi * math.sqrt(a_ ** 3 / mu)
a0 = 6.778e6
num(D, 'v órbita baja', vvf(mu_, a0, a0) / 1e3, '7.6685'); num(D, 'T órbita baja', Tn(mu_, a0), '5553.5'); num(D, 'T (min)', Tn(mu_, a0) / 60, '92.56'); num(D, 'v_esc órbita baja', math.sqrt(2 * mu_ / a0) / 1e3, '10.845')
num(D, 'v GEO', vvf(mu_, 4.2164e7, 4.2164e7) / 1e3, '3.0746'); num(D, 'T GEO', Tn(mu_, 4.2164e7), '86164.8')
num(D, 'T Luna (d)', Tn(mu_, 3.844e8) / 86400, '27.45'); num(D, 'v Tierra órbita (km/s)', vvf(G * MS, 1.496e11, 1.496e11) / 1e3, '29.79'); num(D, 'T Tierra (d)', Tn(G * MS, 1.496e11) / 86400, '365.21'); num(D, 'T Júpiter (años)', Tn(G * MS, 5.2044 * 1.496e11) / 86400 / 365.25, '11.87')
aM, eM = 26.6e6, 0.7
num(D, 'T Molniya (h)', Tn(mu_, aM) / 3600, '11.99'); num(D, 'r_p Molniya (km)', aM * (1 - eM) / 1e3, '7980'); num(D, 'v_p Molniya', vvf(mu_, aM, aM * (1 - eM)) / 1e3, '9.215'); num(D, 'r_a Molniya (km)', aM * (1 + eM) / 1e3, '45220'); num(D, 'v_a Molniya', vvf(mu_, aM, aM * (1 + eM)) / 1e3, '1.626'); num(D, 'cociente v_p/v_a', vvf(mu_, aM, aM * (1 - eM)) / vvf(mu_, aM, aM * (1 + eM)), '5.667')
num(D, 'v inicial (m/s)', vvf(mu_, a0, a0), '7668.53'); num(D, 'T inicial', Tn(mu_, a0), '5553.53'); num(D, 'v_esc inicial', math.sqrt(2 * mu_ / a0), '10844.9')
r05 = a0 * 0.5; num(D, 'v (e = 0.5, ν = 0)', vvf(mu_, a0, r05), '13282'); num(D, 'v_esc (e = 0.5, ν = 0)', math.sqrt(2 * mu_ / r05), '15337'); num(D, 'r (e = 0.5, ν = 180°) km', a0 * 0.75 / 0.5 / 1e3, '10167'); num(D, 'v (e = 0.5, ν = 180°)', vvf(mu_, a0, a0 * 0.75 / 0.5), '4427')
# comprobación independiente: energía en una integración numérica
mu1 = 1.0; ae, ee_ = 1.0, 0.6; rpp = ae * (1 - ee_); vpp = math.sqrt(mu1 * (1 + ee_) / rpp)
def rhs(tt, y):
    x, yy, vx, vy = y; r_ = math.hypot(x, yy); return [vx, vy, -mu1 * x / r_ ** 3, -mu1 * yy / r_ ** 3]
sol = solve_ivp(rhs, [0, 2 * math.pi], [rpp, 0, 0, vpp], rtol=1e-12, atol=1e-13, dense_output=True)
rec(G_STEP, D, 'integración numérica: periodo T = 2π√(a³/GM) (la partícula vuelve al perihelio)', float(math.hypot(*(sol.sol(2 * math.pi)[:2] - [rpp, 0]))), 0.0, 'abs 1e-6', math.hypot(*(sol.sol(2 * math.pi)[:2] - [rpp, 0])) < 1e-6)
tt_ = 1.7; xx_, yy_, vx_, vy_ = sol.sol(tt_); r_ = math.hypot(xx_, yy_); v2n = vx_ ** 2 + vy_ ** 2
rec(G_STEP, D, 'integración numérica: vis-viva en un punto cualquiera', v2n, mu1 * (2 / r_ - 1 / ae), 'rel 1e-9', abs(v2n - mu1 * (2 / r_ - 1 / ae)) < 1e-9 * v2n)
Mp, ap, ep, nup = symbols('M a e nu', positive=True)
mu = G * Mp; ar = ap * 1e6; rr = ar * (1 - ep ** 2) / (1 + ep * cos(nup * pi / 180))
cvv = lambda p_: dict(M=p_['M'], a=p_['a'], e=p_['e'], nu=p_['nu'])
fs(D, 'v', sqrt(mu * (2 / rr - 1 / ar))); fs(D, 'T', 2 * pi * sqrt(ar ** 3 / mu)); fs(D, 'r', rr); fs(D, 'vc', sqrt(mu / rr)); fs(D, 've', sqrt(2 * mu / rr))

# ---------------------------------------------------------------- Hohmann
D = 'hohmann'
mu, r1, r2, at, v1, v2 = S('mu r1 r2 at v1 v2')
atx = (r1 + r2) / 2
vpx = sqrt(mu * (2 / r1 - 1 / atx)); vax = sqrt(mu * (2 / r2 - 1 / atx))
ident(D, 'v_p = v₁ √(2r₂/(r₁+r₂))', vpx, sqrt(mu / r1) * sqrt(2 * r2 / (r1 + r2))); ident(D, 'v_a = v₂ √(2r₁/(r₁+r₂))', vax, sqrt(mu / r2) * sqrt(2 * r1 / (r1 + r2)))
ident(D, 'v_p r₁ = v_a r₂ (momento angular)', vpx * r1, vax * r2)
ident(D, 't = π√(a_t³/μ) = π√((r₁+r₂)³/(8μ))', pi * sqrt(atx ** 3 / mu), pi * sqrt((r1 + r2) ** 3 / (8 * mu)))
def hoh(mu_, r1_, r2_):
    at_ = (r1_ + r2_) / 2; v1_ = math.sqrt(mu_ / r1_); v2_ = math.sqrt(mu_ / r2_); d1 = math.sqrt(mu_ * (2 / r1_ - 1 / at_)) - v1_; d2 = v2_ - math.sqrt(mu_ * (2 / r2_ - 1 / at_)); return d1, d2, d1 + d2, math.pi * math.sqrt(at_ ** 3 / mu_)
# valor máximo del total y cruce con la bielíptica: en unidades de v₁ (R = r₂/r₁)
tot = lambda R_: math.sqrt(2 * R_ / (1 + R_)) - 1 + math.sqrt(1 / R_) - math.sqrt(2 / (R_ * (1 + R_)))
Rs_ = np.linspace(1.01, 60, 590000); tv = np.array([tot(x_) for x_ in Rs_[::100]])
Rmax = float(Rs_[::100][int(np.argmax(tv))])
num(D, 'razón del máximo del total', Rmax, '15.58', tol=1e-2)
biel = lambda R_, rb: (math.sqrt(2 * rb / (1 + rb)) - 1) + (math.sqrt(2 * R_ / (rb * (rb + R_))) - math.sqrt(2 / (rb * (1 + rb)))) + (math.sqrt(2 * rb / (R_ * (R_ + rb))) - math.sqrt(1 / R_))
rec(G_STEP, D, 'bielíptica con apogeo muy lejano = Hohmann para R = 11.94 (cruce)', float(tot(11.94)), float(biel(11.94, 1e6)), 'rel 1e-3', abs(tot(11.94) - biel(11.94, 1e6)) < 1e-3 * tot(11.94))
rec(G_STEP, D, 'tot → (√2 − 1) para R → ∞', float(tot(1e8)), math.sqrt(2) - 1, 'abs 1e-3', abs(tot(1e8) - (math.sqrt(2) - 1)) < 1e-3)
um = {'mu': 'm^3 s^-2', 'r1': 'm', 'r2': 'm', 'dv': 'm s^-1', 't': 's'}
dimcheck(D, 'Δv₁', Symbol('dv', positive=True), sqrt(mu / r1) * (sqrt(2 * r2 / (r1 + r2)) - 1), um); dimcheck(D, 'Δv₂', Symbol('dv', positive=True), sqrt(mu / r2) * (1 - sqrt(2 * r1 / (r1 + r2))), um)
dimcheck(D, 't = π√((r₁+r₂)³/(8μ))', Symbol('t', positive=True), pi * sqrt((r1 + r2) ** 3 / (8 * mu)), um)
b1 = hoh(G * ME, 6.678e6, 4.2164e7)
num(D, 'Δv₁ LEO→GEO', b1[0], '2425.7'); num(D, 'Δv₂ LEO→GEO', b1[1], '1466.8'); num(D, 'Δv total LEO→GEO', b1[2], '3892.6'); num(D, 't (h)', b1[3] / 3600, '5.275'); num(D, 'v_esc desde 6678 km (km/s)', math.sqrt(2 * G * ME / 6.678e6) / 1e3, '10.926')
b2 = hoh(G * MS, 1.496e11, 2.279e11)
num(D, 'Δv₁ Tierra→Marte (km/s)', b2[0] / 1e3, '2.944'); num(D, 'Δv₂ Tierra→Marte (km/s)', b2[1] / 1e3, '2.648'); num(D, 'Δv total (km/s)', b2[2] / 1e3, '5.592'); num(D, 't (d)', b2[3] / 86400, '258.8'); num(D, 'r₂/r₁ Marte', 2.279e11 / 1.496e11, '1.523')
num(D, 'Δv total para 11.94', hoh(G * ME, 6.678e6, 6.678e6 * 11.94)[2], '4126'); num(D, 'Δv total máximo', hoh(G * ME, 6.678e6, 6.678e6 * 15.58)[2], '4143'); num(D, 'Δv total para R = 2', hoh(G * ME, 6.678e6, 2 * 6.678e6)[2], '2198'); num(D, 'v₁ en LEO (km/s)', math.sqrt(G * ME / 6.678e6) / 1e3, '7.73'); num(D, 'cociente R = 2 (%)', hoh(G * ME, 6.678e6, 2 * 6.678e6)[2] / math.sqrt(G * ME / 6.678e6) * 100, '28'); num(D, '(√2 − 1)v₁ (km/s)', (math.sqrt(2) - 1) * math.sqrt(G * ME / 6.678e6) / 1e3, '3.20')
num(D, 'Δv₁ valor inicial', b1[0], '2425.73'); num(D, 'Δv₂ valor inicial', b1[1], '1466.82'); num(D, 'Δv total valor inicial', b1[2], '3892.55'); num(D, 't valor inicial', b1[3], '18990'); num(D, 'v_esc valor inicial', math.sqrt(2 * G * ME / 6.678e6), '10925.8')
Mp, r1p, r2p = symbols('M r1 r2', positive=True)
mu_s = G * Mp; R1 = r1p * 1e6; R2 = r2p * 1e6; AT = (R1 + R2) / 2
fs(D, 'd1', sqrt(mu_s * (2 / R1 - 1 / AT)) - sqrt(mu_s / R1)); fs(D, 'd2', sqrt(mu_s / R2) - sqrt(mu_s * (2 / R2 - 1 / AT)))
fs(D, 'dt', sqrt(mu_s * (2 / R1 - 1 / AT)) - sqrt(mu_s / R1) + sqrt(mu_s / R2) - sqrt(mu_s * (2 / R2 - 1 / AT)), tol=1e-8); fs(D, 'tt', pi * sqrt(AT ** 3 / mu_s)); fs(D, 'ves', sqrt(2 * mu_s / R1))

# ---------------------------------------------------------------- Rutherford
D = 'rutherford'
E, b, kk, thR, eps, phi = S('E b kk thetaR eps phi')
ident(D, 'ε² = 1 + (2Eb/k)² con L² = 2mEb²', 1 + 2 * E * (2 * m * E * b ** 2) / (m * kk ** 2), 1 + (2 * E * b / kk) ** 2)
ident(D, 'sen(θ/2) = 1/ε ⇒ cot(θ/2) = √(ε² − 1)', cot(asin_ := sp.asin(1 / eps)), sqrt(eps ** 2 - 1))
cot_th2 = 2 * E * b / kk
ident(D, 'b = (k/2E) cot(θ/2)', (kk / (2 * E)) * cot_th2, b)
bth = kk / (2 * E) * cot(thR / 2)
ident(D, 'db/dθ = −(k/4E) csc²(θ/2)', diff(bth, thR), -(kk / (4 * E)) / sin(thR / 2) ** 2)
dsig = bth / sin(thR) * (-diff(bth, thR))
ident(D, 'dσ/dΩ = (k/4E)² / sen⁴(θ/2)', dsig, (kk / (4 * E)) ** 2 / sin(thR / 2) ** 4)
integral(D, 'sección eficaz: σ(θ > θ₀) = ∫ (dσ/dΩ) dΩ = π b(θ₀)²', (kk / (4 * E)) ** 2 / sin(Symbol('x', positive=True) / 2) ** 4 * 2 * pi * sin(Symbol('x', positive=True)), Symbol('x', positive=True), pi / 2, pi, pi * bth.subs(thR, pi / 2) ** 2)
ident(D, 'u = (mk/L²)(−1 + ε cosφ) resuelve u″ + u = −mk/L²', diff(m * kk / (2 * m * E * b ** 2) * (-1 + eps * cos(phi)), phi, 2) + m * kk / (2 * m * E * b ** 2) * (-1 + eps * cos(phi)), -m * kk / (2 * m * E * b ** 2))
# integración numérica: ángulo de dispersión con el potencial de Coulomb (m = 1, v∞ = 1, k = 1)
def deflexion(bv, kv=1.0):
    def rhs(tt, y):
        x, yy, vx, vy = y; r_ = math.hypot(x, yy); return [vx, vy, kv * x / r_ ** 3, kv * yy / r_ ** 3]
    x0 = -4000.0; sol = solve_ivp(rhs, [0, 9000], [x0, bv, 1.0, 0.0], rtol=1e-11, atol=1e-11)
    vx, vy = sol.y[2, -1], sol.y[3, -1]; return math.atan2(vy, vx)
for bv in (0.5, 1.0, 3.0):
    th_num = deflexion(bv); th_f = 2 * math.atan(1 / (2 * 0.5 * bv / 1.0 * 1.0)) if False else 2 * math.atan((1.0) / (2 * 0.5 * 1.0 * bv * 1.0 * 2)) if False else 2 * math.atan(1.0 / (2 * 0.5 * bv))
    rec(G_STEP, D, f'integración numérica: θ(b = {bv}) = 2 arctan(k/(2Eb)) (k = 1, E = ½)', abs(th_num), th_f, 'rel 2e-3', abs(abs(th_num) - th_f) < 2e-3 * th_f)
uk = {'k': 'J m', 'E': 'J', 'b': 'm', 'theta': 'rad', 'ds': 'm^2', 'dmin': 'm'}
dimcheck(D, 'dσ/dΩ', Symbol('ds', positive=True), (kk / (4 * E)) ** 2 / sin(thR / 2) ** 4, dict(uk, thetaR='rad', kk='J m')); dimcheck(D, 'b(θ)', b, kk / (2 * E) * cot(thR / 2), dict(uk, thetaR='rad', kk='J m')); dimcheck(D, 'd_mín = k/E', Symbol('dmin', positive=True), kk / E, dict(uk, kk='J m'))
Zk = lambda Z1, Z2: KE * Z1 * Z2
kv_ = Zk(2, 79)
num(D, 'k (MeV·fm)', kv_, '227.5'); num(D, 'd_mín (5 MeV)', kv_ / 5, '45.50'); num(D, 'b(90°)', kv_ / 10 / math.tan(math.radians(45)), '22.75'); num(D, 'b(30°)', kv_ / 10 / math.tan(math.radians(15)), '84.91')
ds_ = lambda E_, th_: (kv_ / (4 * E_)) ** 2 / math.sin(math.radians(th_) / 2) ** 4
num(D, 'dσ/dΩ(90°)', ds_(5, 90), '517.6'); num(D, 'dσ/dΩ(90°) en barn/sr', ds_(5, 90) / 100, '5.176'); num(D, 'cociente E doble', ds_(10, 90) / ds_(5, 90), '0.25'); num(D, 'factor 90° → 10°', (math.sin(math.radians(45)) / math.sin(math.radians(5))) ** 4, '4333', tol=1e-3)
num(D, 'dσ/dΩ valor inicial', ds_(5, 90), '517.63'); num(D, 'b valor inicial', kv_ / 10, '22.751'); num(D, 'd_mín valor inicial', kv_ / 5, '45.503')
Ep, thp = symbols('E th', positive=True)
KEs = sp.Float('1.439964548', 30)
cvr = lambda p_: dict(Z1=round(p_['Z1']), Z2=round(p_['Z2']), E=p_['E'], th=math.radians(p_['th']))
Z1p, Z2p = symbols('Z1 Z2', positive=True)
fs(D, 'ds', (KEs * Z1p * Z2p / (4 * Ep)) ** 2 / sin(thp / 2) ** 4, conv=cvr); fs(D, 'b', KEs * Z1p * Z2p / (2 * Ep) / tan(thp / 2), conv=cvr); fs(D, 'dm', KEs * Z1p * Z2p / Ep, conv=cvr)

# ---------------------------------------------------------------- mareas
D = 'marea'
GMs, R, rr_, x = S('GM R r x')
ident(D, 'GM/(r−R)² − GM/r² ≈ 2GMR/r³ (primer orden en R/r)', sp.series(GMs / (rr_ - x) ** 2 - GMs / rr_ ** 2, x, 0, 2).removeO(), 2 * GMs * x / rr_ ** 3)
ident(D, 'marea lateral: GM/r² · (R/r) = GMR/r³', GMs / rr_ ** 2 * (x / rr_), GMs * x / rr_ ** 3)
Phi = -GMs / sqrt(rr_ ** 2 + 0)
X, Y, Z = symbols('X Y Z', real=True)
phi_ = -GMs / sqrt((rr_ + X) ** 2 + Y ** 2 + Z ** 2)
tens = [diff(phi_, c, 2).subs({X: 0, Y: 0, Z: 0}) for c in (X, Y, Z)]
ident(D, 'tensor de marea: ∂²Φ/∂x² = −2GM/r³', tens[0], -2 * GMs / rr_ ** 3); ident(D, '∂²Φ/∂y² = GM/r³', tens[1], GMs / rr_ ** 3); ident(D, '∂²Φ/∂z² = GM/r³', tens[2], GMs / rr_ ** 3)
ident(D, 'traza nula (ΔΦ = 0)', sum(tens), 0)
rec(G_STEP, D, 'valor exacto vs. primer orden: Luna sobre la Tierra (diferencia ~ 2.5 %)', 2 * G * 7.342e22 * 6.371e6 / 3.844e8 ** 3 / (G * 7.342e22 * (1 / (3.844e8 - 6.371e6) ** 2 - 1 / 3.844e8 ** 2)), 1.0, 'rel 3e-2', abs(2 * G * 7.342e22 * 6.371e6 / 3.844e8 ** 3 / (G * 7.342e22 * (1 / (3.844e8 - 6.371e6) ** 2 - 1 / 3.844e8 ** 2)) - 1) < 3e-2)
ut = {'G': 'kg^-1 m^3 s^-2', 'M': 'kg', 'R': 'm', 'r': 'm', 'at': 'm s^-2'}
dimcheck(D, 'a_marea = 2GMR/r³', Symbol('at', positive=True), 2 * Symbol('G', positive=True) * M * R / rr_ ** 3, ut); dimcheck(D, 'compresión GMR/r³', Symbol('at', positive=True), Symbol('G', positive=True) * M * R / rr_ ** 3, ut)
Mm_, Rm_ = 7.342e22, 3.844e8
ta = lambda M_, r_, R_=6.371e6: 2 * G * M_ * R_ / r_ ** 3
num(D, 'a Luna (10⁻⁶)', ta(Mm_, Rm_) / 1e-6, '1.099'); num(D, 'a/g Luna (10⁻⁷)', ta(Mm_, Rm_) / 9.80665 / 1e-7, '1.12'); num(D, 'compresión Luna (10⁻⁷)', ta(Mm_, Rm_) / 2 / 1e-7, '5.50'); num(D, 'a Sol (10⁻⁷)', ta(1.989e30, 1.496e11) / 1e-7, '5.05'); num(D, 'a/g Sol (10⁻⁸)', ta(1.989e30, 1.496e11) / 9.80665 / 1e-8, '5.15')
num(D, 'cociente Luna/Sol', ta(Mm_, Rm_) / ta(1.989e30, 1.496e11), '2.18'); num(D, 'atracción Sol/Luna sobre la Tierra', 1 / ((Mm_ / 1.989e30) * (1.496e11 / Rm_) ** 2), '179'); num(D, 'marea con r doble', 2 ** -3, '0.125', tol=1e-9)
num(D, 'error relativo Luna (%)', abs(ta(Mm_, Rm_) / (G * Mm_ * (1 / (Rm_ - 6.371e6) ** 2 - 1 / Rm_ ** 2)) - 1) * 100, '2.5', tol=0.05); num(D, 'error relativo Sol (%)', abs(2 * G * 1.989e30 * 6.371e6 / 1.496e11 ** 3 / (G * 1.989e30 * (1 / (1.496e11 - 6.371e6) ** 2 - 1 / 1.496e11 ** 2)) - 1) * 100, '0.006', tol=0.1)
num(D, 'a valor inicial (10⁻⁶)', ta(Mm_, Rm_) / 1e-6, '1.0993'); num(D, 'compresión valor inicial (10⁻⁷)', ta(Mm_, Rm_) / 2 / 1e-7, '5.4964'); num(D, 'a/g valor inicial (10⁻⁷)', ta(Mm_, Rm_) / 9.80665 / 1e-7, '1.1210'); num(D, 'a Sol (10⁻⁷, 4 cifras)', ta(1.989e30, 1.496e11) / 1e-7, '5.052')
Mq, rq, Rq = symbols('M r R', positive=True)
Gs = sp.Float('6.6743e-11', 30)
fs(D, 'at', 2 * Gs * Mq * Rq / rq ** 3); fs(D, 'ap', Gs * Mq * Rq / rq ** 3); fs(D, 'rg', 2 * Gs * Mq * Rq / rq ** 3 / sp.Float('9.80665', 30))
