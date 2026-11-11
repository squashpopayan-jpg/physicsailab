# -*- coding: utf-8 -*-
"""Capítulo 11 — Mecánica analítica."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, tan, cot, atan, acos, Function, Matrix, solve, simplify, oo, Derivative
import mpmath as mp
from scipy.integrate import solve_ivp, quad

EX = {'euler-lagrange': 'aro', 'braquistocrona': 'braquistocrona', 'pendulo-conico': 'conico', 'hamilton': 'hamilton', 'doble-pendulo': 'doble'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
m, g, t = S('m g t')

# ---------------------------------------------------------------- Euler–Lagrange y aro giratorio
D = 'euler-lagrange'
R, w, th = S('R w theta')
q = Function('q'); x = Function('x')
Vf = Function('V')
Lg = m * x(t).diff(t) ** 2 / 2 - Vf(x(t))
ident(D, 'EL de la partícula: d/dt(∂L/∂ẋ) = −V′ ⇒ mẍ = F', diff(m * x(t).diff(t), t), m * x(t).diff(t, 2))
qd = Symbol('qd'); qq = Symbol('qq')
Larc = m * R ** 2 * (qd ** 2 + w ** 2 * sin(qq) ** 2) / 2 + m * g * R * cos(qq)
ident(D, '∂L/∂q̇ = mR² q̇', diff(Larc, qd), m * R ** 2 * qd)
ident(D, '∂L/∂θ = mR²ω² senθ cosθ − mgR senθ', diff(Larc, qq), m * R ** 2 * w ** 2 * sin(qq) * cos(qq) - m * g * R * sin(qq))
thddot = sin(th) * (w ** 2 * cos(th) - g / R)
ident(D, 'θ̈ = senθ(ω²cosθ − g/R)', (m * R ** 2 * w ** 2 * sin(th) * cos(th) - m * g * R * sin(th)) / (m * R ** 2), thddot)
th0 = acos(g / (w ** 2 * R))
ident(D, 'equilibrio: cosθ₀ = g/(ω²R) anula θ̈', thddot.subs(th, th0), 0)
ident(D, 'linealización: ∂θ̈/∂θ en θ₀ = −ω² sen²θ₀', diff(thddot, th).subs(th, th0), -w ** 2 * sin(th0) ** 2)
ident(D, 'ω sen θ₀ = ω√(1 − g²/(ω⁴R²))', w * sin(th0), w * sqrt(1 - g ** 2 / (w ** 4 * R ** 2)))
# integración numérica: pequeña oscilación alrededor de θ₀ con ω = 6.644, R = 0.5
Rn, gn, rr = 0.5, 9.81, 1.5; wcn = math.sqrt(gn / Rn); wn = rr * wcn; th0n = math.acos(1 / rr ** 2)
sol = solve_ivp(lambda tt, y: [y[1], math.sin(y[0]) * (wn ** 2 * math.cos(y[0]) - gn / Rn)], [0, 4], [th0n + 1e-4, 0.0], rtol=1e-12, atol=1e-14, dense_output=True)
tt = np.linspace(0, 4, 40001); sg = np.array([sol.sol(x_)[0] - th0n for x_ in tt]); cr = np.where(np.diff(np.sign(sg)) != 0)[0]
perio = 2 * np.mean(np.diff(tt[cr])); wosc_num = 2 * math.pi / perio
rec(G_STEP, D, 'integración de la ecuación de Lagrange: frecuencia de oscilación = ω senθ₀', wosc_num, wn * math.sin(th0n), 'rel 1e-3', abs(wosc_num - wn * math.sin(th0n)) < 1e-3 * wn * math.sin(th0n))
uA = {'L': 'kg m^2 s^-2', 'theta': 'rad', 'w': 'rad s^-1', 'R': 'm', 'g': 'm s^-2', 'wc': 'rad s^-1', 'theta0': 'rad', 'm': 'kg'}
dimcheck(D, 'g/(ω²R) es adimensional', Symbol('q', positive=True), g / (w ** 2 * R), dict(uA, q='1'))
dimcheck(D, 'L = ½mR²(θ̇² + ω² sen²θ) + mgR cosθ', Symbol('L', positive=True), m * R ** 2 * (Symbol('wd', positive=True) ** 2 + w ** 2 * sin(th) ** 2) / 2 + m * g * R * cos(th), dict(uA, wd='rad s^-1'))
dimcheck(D, 'ω_c = √(g/R)', Symbol('wc', positive=True), sqrt(g / R), uA)
ar = lambda R_, g_, r_: (math.sqrt(g_ / R_), math.degrees(math.acos(1 / r_ ** 2)), r_ * math.sqrt(g_ / R_) * math.sqrt(1 - r_ ** -4))
num(D, 'ω_c', ar(0.5, 9.81, 1.5)[0], '4.429'); num(D, 'ω (r = 1.5)', 1.5 * ar(0.5, 9.81, 1.5)[0], '6.644'); num(D, 'θ₀ (r = 1.5)', ar(0.5, 9.81, 1.5)[1], '63.61'); num(D, 'ω_osc (r = 1.5)', ar(0.5, 9.81, 1.5)[2], '5.952')
num(D, 'θ₀ (r = 2)', ar(0.5, 9.81, 2)[1], '75.52'); num(D, 'ω_osc (r = 2)', ar(0.5, 9.81, 2)[2], '8.578'); num(D, 'θ₀ (r = 1.01)', ar(0.5, 9.81, 1.01)[1], '11.39'); num(D, 'ω_osc (r = 1.01)', ar(0.5, 9.81, 1.01)[2], '0.884'); num(D, 'θ₀ (r = 5)', ar(0.5, 9.81, 5)[1], '87.71')
num(D, 'θ₀ valor inicial', ar(0.5, 9.81, 1.5)[1], '63.612'); num(D, 'ω_osc valor inicial', ar(0.5, 9.81, 1.5)[2], '5.9519'); num(D, 'ω_c valor inicial', ar(0.5, 9.81, 1.5)[0], '4.4294')
Rp, gp, rp = symbols('R g r', positive=True)
fs(D, 'wc', sqrt(gp / Rp)); fs(D, 'th', acos(1 / rp ** 2) * 180 / pi); fs(D, 'wo', rp * sqrt(gp / Rp) * sqrt(1 - rp ** -4))

# ---------------------------------------------------------------- braquistócrona
D = 'braquistocrona'
y, yp, C, ph, Rr = S('y yp C phi Rr')
F = sqrt((1 + yp ** 2) / y)
ident(D, 'Beltrami: F − y′ ∂F/∂y′ = 1/√(y(1+y′²))', F - yp * diff(F, yp), 1 / sqrt(y * (1 + yp ** 2)))
ident(D, 'y = 2R sen²(φ/2) con y′ = cot(φ/2) cumple y(1+y′²) = 2R', (2 * Rr * sin(ph / 2) ** 2) * (1 + cot(ph / 2) ** 2), 2 * Rr)
xph = Rr * (ph - sin(ph)); yph = Rr * (1 - cos(ph))
ident(D, 'dy/dφ ÷ dx/dφ = cot(φ/2) = y′', diff(yph, ph) / diff(xph, ph), cot(ph / 2))
ident(D, 'dx/dφ = R(1 − cosφ)', diff(xph, ph), Rr * (1 - cos(ph)))
ident(D, 'ds = 2R sen(φ/2) dφ', sqrt(diff(xph, ph) ** 2 + diff(yph, ph) ** 2), 2 * Rr * sin(ph / 2))
ident(D, 'v = √(2gy) = 2√(gR) sen(φ/2)', sqrt(2 * g * yph), 2 * sqrt(g * Rr) * sin(ph / 2))
ident(D, 'dt = ds/v = √(R/g) dφ', 2 * Rr * sin(ph / 2) / (2 * sqrt(g * Rr) * sin(ph / 2)), sqrt(Rr / g))
# comparación numérica con otras curvas (parábola y arco de circunferencia) uniendo (0,0)–(πR, 2R): la cicloide es la más rápida
R1 = 1.0; xB, yB = math.pi * R1, 2 * R1
def Tcurve(f, df, xB_=xB):
    return quad(lambda xx_: math.sqrt((1 + df(xx_) ** 2) / (2 * 9.81 * max(f(xx_), 1e-300))), 0, xB_, limit=400)[0]
Tcic = math.pi * math.sqrt(R1 / 9.81)
Tpar = Tcurve(lambda xx_: yB * math.sqrt(xx_ / xB), lambda xx_: yB / (2 * math.sqrt(xx_ * xB)))
Tlin = math.sqrt(2 * (xB ** 2 + yB ** 2) / (9.81 * yB))
rec(G_STEP, D, 'la cicloide es más rápida que la recta', Tcic, Tlin, '<', Tcic < Tlin)
rec(G_STEP, D, 'la cicloide es más rápida que la parábola y yB√(x/xB)', Tcic, Tpar, '<', Tcic < Tpar)
rec(G_STEP, D, 'tiempo por la cicloide por integración numérica de ∫ds/v', quad(lambda p_: math.sqrt(1 / 9.81 / 1.0) * 1.0, 0, math.pi)[0], Tcic, 'rel 1e-12', abs(quad(lambda p_: math.sqrt(1 / 9.81), 0, math.pi)[0] - Tcic) < 1e-12)
# tautocronismo: tiempo hasta el fondo desde cualquier φ₀
ph0s = (0.5, 1.0, 2.0, 3.0)
for p0 in ph0s:
    # tiempo desde φ₀ hasta π con energía: v = √(2g(y − y₀)), ds = 2R sen(φ/2)dφ
    f_ = lambda p_: 2 * math.sin(p_ / 2) / math.sqrt(2 * 9.81 * ((1 - math.cos(p_)) - (1 - math.cos(p0)))) if (1 - math.cos(p_)) > (1 - math.cos(p0)) else 0.0
    Tt = quad(lambda p_: 2 * math.sin(p_ / 2) / math.sqrt(2 * 9.81 * (math.cos(p0) - math.cos(p_))), p0, math.pi, limit=500)[0]
    rec(G_STEP, D, f'tautocronismo: T(φ₀ = {p0} → fondo) = π√(R/g)', Tt, Tcic, 'rel 1e-4', abs(Tt - Tcic) < 1e-4 * Tcic)
ubr = {'x': 'm', 'y': 'm', 'Rr': 'm', 'phi': 'rad', 'g': 'm s^-2', 'T': 's', 'R': 'm'}
dimcheck(D, 'T = φ_B √(R/g)', Symbol('T', positive=True), ph * sqrt(Rr / g), ubr); dimcheck(D, 'x = R(φ − senφ)', Symbol('x', positive=True), Rr * (ph - sin(ph)), ubr); dimcheck(D, 'y = R(1 − cosφ)', y, Rr * (1 - cos(ph)), ubr)
cy = lambda R_, ph_, g_=9.81: (R_ * (ph_ - math.sin(ph_)), R_ * (1 - math.cos(ph_)), ph_ * math.sqrt(R_ / g_), math.sqrt(2 * ((R_ * (ph_ - math.sin(ph_))) ** 2 + (R_ * (1 - math.cos(ph_))) ** 2) / (g_ * R_ * (1 - math.cos(ph_)))))
num(D, 'T (φ = π)', cy(1, math.pi)[2], '1.0030'); num(D, 'T recta (φ = π)', cy(1, math.pi)[3], '1.1890'); num(D, 'cociente (φ = π)', cy(1, math.pi)[2] / cy(1, math.pi)[3], '0.8436'); num(D, 'ventaja (%)', (1 - cy(1, math.pi)[2] / cy(1, math.pi)[3]) * 100, '15.6')
num(D, 'cociente (φ = 5)', cy(1, 5)[2] / cy(1, 5)[3], '0.499'); num(D, 'cociente (φ = 2)', cy(1, 2)[2] / cy(1, 2)[3], '0.942'); num(D, 'cociente (φ = 0.5)', cy(1, 0.5)[2] / cy(1, 0.5)[3], '0.9965'); num(D, 'π√(R/g)', math.pi * math.sqrt(1 / 9.81), '1.0030')
num(D, 'T valor inicial', cy(1, math.pi)[2], '1.00303'); num(D, 'T recta valor inicial', cy(1, math.pi)[3], '1.18904'); num(D, 'x_B valor inicial', math.pi, '3.14159'); num(D, 'cociente valor inicial', cy(1, math.pi)[2] / cy(1, math.pi)[3], '0.84356')
Rq, phq, gq = symbols('R ph g', positive=True)
xB_ = Rq * (phq - sin(phq)); yB_ = Rq * (1 - cos(phq))
fs(D, 'Tc', phq * sqrt(Rq / gq)); fs(D, 'Tl', sqrt(2 * (xB_ ** 2 + yB_ ** 2) / (gq * yB_))); fs(D, 'x', xB_); fs(D, 'y', yB_)
fs(D, 'ra', phq * sqrt(Rq / gq) / sqrt(2 * (xB_ ** 2 + yB_ ** 2) / (gq * yB_)))

# ---------------------------------------------------------------- péndulo cónico
D = 'pendulo-conico'
L, wd = S('L w')
phd = Symbol('phd')
Lc = m * L ** 2 * (Symbol('thd') ** 2 + sin(th) ** 2 * phd ** 2) / 2 + m * g * L * cos(th)
ident(D, '∂L/∂φ = 0 (φ es cíclica)', diff(Lc, Symbol('phi_')), 0)
ident(D, 'p_φ = ∂L/∂φ̇ = mL² sen²θ φ̇', diff(Lc, phd), m * L ** 2 * sin(th) ** 2 * phd)
thdd = diff(Lc, th) / (m * L ** 2)
ident(D, 'θ̈ = senθ cosθ φ̇² − (g/L) senθ', thdd, sin(th) * cos(th) * phd ** 2 - g / L * sin(th))
w_c = sqrt(g / (L * cos(th)))
ident(D, 'θ̈ = 0 con φ̇ = ω = √(g/(L cosθ))', thdd.subs(phd, w_c), 0)
ident(D, 'v = ωL senθ = √(gL senθ tanθ)', w_c * L * sin(th), sqrt(g * L * sin(th) * tan(th)))
ident(D, 'T_hilo cosθ = mg: T/mg = 1/cosθ', (m * g / cos(th)) / (m * g), 1 / cos(th))
ident(D, 'fuerza centrípeta: T senθ = mω²L senθ', (m * g / cos(th)) * sin(th), m * w_c ** 2 * L * sin(th))
# integración numérica del péndulo esférico (cónica): θ se mantiene constante
th0c = math.radians(30); Lc_, gc = 1.0, 9.81; wcn = math.sqrt(gc / (Lc_ * math.cos(th0c)))
def rhs(tt, y):
    th_, thd_, ph_ = y; return [thd_, math.sin(th_) * math.cos(th_) * wcn ** 2 - gc / Lc_ * math.sin(th_), wcn]
sol = solve_ivp(rhs, [0, 10], [th0c, 0.0, 0.0], rtol=1e-12, atol=1e-13)
rec(G_STEP, D, 'integración: θ permanece constante en la órbita cónica', float(np.max(np.abs(sol.y[0] - th0c))), 0.0, 'abs 1e-9', float(np.max(np.abs(sol.y[0] - th0c))) < 1e-9)
# conservación de p_φ en un movimiento general del péndulo esférico
def rhs2(tt, y):
    th_, thd_, ph_, phd_ = y; return [thd_, math.sin(th_) * math.cos(th_) * phd_ ** 2 - gc / Lc_ * math.sin(th_), phd_, -2 * thd_ * phd_ * math.cos(th_) / math.sin(th_)]
s2 = solve_ivp(rhs2, [0, 10], [0.8, 0.1, 0.0, 2.0], rtol=1e-12, atol=1e-13)
pph = Lc_ ** 2 * np.sin(s2.y[0]) ** 2 * s2.y[3]
rec(G_STEP, D, 'integración general: p_φ = mL² sen²θ φ̇ es constante', float(np.max(np.abs(pph - pph[0]))), 0.0, 'abs 1e-8', float(np.max(np.abs(pph - pph[0]))) < 1e-8)
ucn = {'L': 'm', 'theta': 'rad', 'w': 'rad s^-1', 'g': 'm s^-2', 'T': 's', 'v': 'm s^-1'}
dimcheck(D, 'ω = √(g/(L cosθ))', wd, w_c, ucn); dimcheck(D, 'T = 2π√(L cosθ/g)', Symbol('T', positive=True), 2 * pi * sqrt(L * cos(th) / g), ucn); dimcheck(D, 'v = √(gL senθ tanθ)', Symbol('v', positive=True), sqrt(g * L * sin(th) * tan(th)), ucn)
cn = lambda L_, thd, g_=9.81: (math.sqrt(g_ / (L_ * math.cos(math.radians(thd)))), 2 * math.pi * math.sqrt(L_ * math.cos(math.radians(thd)) / g_), math.sqrt(g_ * L_ * math.sin(math.radians(thd)) * math.tan(math.radians(thd))), 1 / math.cos(math.radians(thd)))
num(D, 'ω (30°)', cn(1, 30)[0], '3.366'); num(D, 'T (30°)', cn(1, 30)[1], '1.867'); num(D, 'v (30°)', cn(1, 30)[2], '1.683'); num(D, 'T/mg (30°)', cn(1, 30)[3], '1.155')
num(D, 'T (60°)', cn(1, 60)[1], '1.419'); num(D, 'v (60°)', cn(1, 60)[2], '3.836'); num(D, 'T/mg (60°)', cn(1, 60)[3], '2'); num(D, 'ω (80°)', cn(1, 80)[0], '7.516'); num(D, 'v (80°)', cn(1, 80)[2], '7.402'); num(D, 'T/mg (80°)', cn(1, 80)[3], '5.76')
num(D, 'T (5°)', cn(1, 5)[1], '2.002'); num(D, 'T (80°) (periodo)', cn(1, 80)[1], '0.836')
num(D, 'ω valor inicial', cn(1, 30)[0], '3.36565'); num(D, 'T valor inicial', cn(1, 30)[1], '1.86686'); num(D, 'v valor inicial', cn(1, 30)[2], '1.68283'); num(D, 'T/mg valor inicial', cn(1, 30)[3], '1.1547')
Lp, thp, gp = symbols('L th g', positive=True); thr = thp * pi / 180
fs(D, 'w', sqrt(gp / (Lp * cos(thr)))); fs(D, 'T', 2 * pi * sqrt(Lp * cos(thr) / gp)); fs(D, 'v', sqrt(gp * Lp * sin(thr) * tan(thr))); fs(D, 'Tn', 1 / cos(thr))

# ---------------------------------------------------------------- Hamilton
D = 'hamilton'
qs, ps, qd_, mm, ww, E = S('qs ps qd m w E')
Lh = m * qd_ ** 2 / 2 - m * w ** 2 * qs ** 2 / 2
pp_ = diff(Lh, qd_)
ident(D, 'p = ∂L/∂q̇ = m q̇', pp_, m * qd_)
Hh = (pp_ * qd_ - Lh).subs(qd_, ps / m)
ident(D, 'H = p q̇ − L = p²/2m + ½mω²q²', Hh, ps ** 2 / (2 * m) + m * w ** 2 * qs ** 2 / 2)
ident(D, 'q̇ = ∂H/∂p = p/m', diff(Hh, ps), ps / m); ident(D, 'ṗ = −∂H/∂q = −mω²q', -diff(Hh, qs), -m * w ** 2 * qs)
ident(D, 'dH/dt = 0 a lo largo de las ecuaciones de Hamilton', diff(Hh, qs) * diff(Hh, ps) + diff(Hh, ps) * (-diff(Hh, qs)), 0)
ident(D, 'Liouville: ∂q̇/∂q + ∂ṗ/∂p = 0', diff(diff(Hh, ps), qs) + diff(-diff(Hh, qs), ps), 0)
qmax = sqrt(2 * E / (m * w ** 2)); pmax = sqrt(2 * m * E)
ident(D, 'la elipse cumple q²/q_máx² + p²/p_máx² = E/E', Hh.subs({qs: qmax, ps: 0}), E); ident(D, 'H(0, p_máx) = E', Hh.subs({qs: 0, ps: pmax}), E)
ident(D, 'π q_máx p_máx = 2πE/ω', pi * qmax * pmax, 2 * pi * E / w)
# integración numérica del oscilador: el área del lazo de fase
mn, wn_, En = 0.5, 20.0, 0.25
sol = solve_ivp(lambda tt, y: [y[1] / mn, -mn * wn_ ** 2 * y[0]], [0, 2 * math.pi / wn_], [math.sqrt(2 * En / (mn * wn_ ** 2)), 0.0], rtol=1e-13, atol=1e-15, dense_output=True)
tsx = np.linspace(0, 2 * math.pi / wn_, 20001); qv = np.array([sol.sol(x_)[0] for x_ in tsx]); pv = np.array([sol.sol(x_)[1] for x_ in tsx])
area = abs(np.trapezoid(pv, qv)) if hasattr(np, 'trapezoid') else abs(np.trapz(pv, qv))
rec(G_STEP, D, 'integración numérica: ∮ p dq = 2πE/ω', float(area), 2 * math.pi * En / wn_, 'rel 1e-6', abs(area - 2 * math.pi * En / wn_) < 1e-6 * area)
rec(G_STEP, D, 'integración numérica: energía constante en la órbita', float(np.max(np.abs(pv ** 2 / (2 * mn) + mn * wn_ ** 2 * qv ** 2 / 2 - En))), 0.0, 'abs 1e-9', float(np.max(np.abs(pv ** 2 / (2 * mn) + mn * wn_ ** 2 * qv ** 2 / 2 - En))) < 1e-9)
uh = {'H': 'kg m^2 s^-2', 'p': 'kg m s^-1', 'q': 'm', 'm': 'kg', 'w': 'rad s^-1', 'E': 'kg m^2 s^-2', 'J': 'kg m^2 s^-1', 'ps': 'kg m s^-1', 'qs': 'm'}
dimcheck(D, 'H = p²/2m + ½mω²q²', Symbol('H', positive=True), ps ** 2 / (2 * m) + m * w ** 2 * qs ** 2 / 2, uh); dimcheck(D, 'J = E/ω', Symbol('J', positive=True), E / w, uh); dimcheck(D, 'área = 2πE/ω', Symbol('J', positive=True), 2 * pi * E / w, uh); dimcheck(D, 'q_máx p_máx', Symbol('J', positive=True), qmax * pmax, uh)
num(D, 'q_máx', math.sqrt(2 * En / (mn * wn_ ** 2)), '0.05'); num(D, 'p_máx', math.sqrt(2 * mn * En), '0.5'); num(D, 'área', 2 * math.pi * En / wn_, '0.07854'); num(D, 'J', En / wn_, '0.0125'); num(D, 'A/h (10³²)', 2 * math.pi * En / wn_ / 6.62607015e-34 / 1e32, '1.185')
num(D, 'área valor inicial (10⁻²)', 2 * math.pi * En / wn_ / 1e-2, '7.8540'); num(D, 'A/h valor inicial (10³²)', 2 * math.pi * En / wn_ / 6.62607015e-34 / 1e32, '1.1853')
mp_, wp, Ep = symbols('m w E', positive=True)
fs(D, 'q', sqrt(2 * Ep / (mp_ * wp ** 2))); fs(D, 'pm', sqrt(2 * mp_ * Ep)); fs(D, 'A', 2 * pi * Ep / wp); fs(D, 'J', Ep / wp); fs(D, 'n', 2 * pi * Ep / wp / sp.Float('6.62607015e-34', 30))

# ---------------------------------------------------------------- péndulo doble
D = 'doble-pendulo'
m1, m2, th1, th2, x_, mu = S('m1 m2 theta1 theta2 x mu')
Mx = L ** 2 * Matrix([[m1 + m2, m2], [m2, m2]]); Kx = g * L * Matrix([[m1 + m2, 0], [0, m2]])
Tfull = (m1 + m2) * L ** 2 * Symbol('a1') ** 2 / 2 + m2 * L ** 2 * Symbol('a2') ** 2 / 2 + m2 * L ** 2 * Symbol('a1') * Symbol('a2') * cos(th1 - th2)
Tq = Tfull.subs(cos(th1 - th2), 1)
qdv = Matrix([Symbol('a1'), Symbol('a2')])
ident(D, 'T ≈ ½ q̇ᵀ M q̇', Tq, (qdv.T * Mx * qdv)[0] / 2)
Vfull = -(m1 + m2) * g * L * cos(th1) - m2 * g * L * cos(th2)
Vq = sp.series(Vfull, th1, 0, 3).removeO()
Vq = sp.series(Vq, th2, 0, 3).removeO() + (m1 + m2) * g * L + m2 * g * L
qv_ = Matrix([th1, th2])
ident(D, 'V ≈ ½ qᵀ K q (salvo constante)', Vq, (qv_.T * Kx * qv_)[0] / 2)
om2 = Symbol('om2')
dt = sp.expand((Kx - om2 * Mx).det())
sols = sp.solve(dt, om2)
ref = [g / L * (1 + m2 / m1 - sqrt(m2 / m1 * (1 + m2 / m1))), g / L * (1 + m2 / m1 + sqrt(m2 / m1 * (1 + m2 / m1)))]
for s_ in sols:
    ok = any(same(s_, r_)[0] for r_ in ref)
    rec(G_STEP, D, 'raíz del determinante det(K − ω²M) = 0 coincide con ω±² de la fórmula', 1.0 if ok else 0.0, 1.0, 'solución exacta', ok)
xs_ = Symbol('xs', positive=True); mus = Symbol('mus', positive=True)
ident(D, '(1 + μ)(1 − x)² = μ x² ⇒ x = 1/(1 ∓ √(μ/(1+μ)))', ((1 + mus) * (1 - 1 / (1 - sqrt(mus / (1 + mus)))) ** 2) - mus * (1 / (1 - sqrt(mus / (1 + mus)))) ** 2, 0)
ident(D, '1/(1 ∓ s) = (1 ± s)(1+μ) con s² = μ/(1+μ)', 1 / (1 - sqrt(mus / (1 + mus))), (1 + sqrt(mus / (1 + mus))) * (1 + mus))
ident(D, 'ω±² (1 + μ ± √(μ(1+μ))) = (1 ± s)(1+μ)', (1 + sqrt(mus / (1 + mus))) * (1 + mus), 1 + mus + sqrt(mus * (1 + mus)))
rec(G_STEP, D, 'cociente ω₊/ω₋ = 1 + √2 para μ = 1', math.sqrt((2 + math.sqrt(2)) / (2 - math.sqrt(2))), 1 + math.sqrt(2), 'rel 1e-12', abs(math.sqrt((2 + math.sqrt(2)) / (2 - math.sqrt(2))) - 1 - math.sqrt(2)) < 1e-12)
# integración numérica de las ecuaciones completas con amplitud pequeña: frecuencias medidas
def dbl_rhs(tt, y, m1_=1.0, m2_=1.0, L_=1.0, g_=9.81):
    a1, a2, w1, w2 = y; dlt = a1 - a2; den = L_ * (2 * m1_ + m2_ - m2_ * math.cos(2 * dlt))
    dw1 = (-g_ * (2 * m1_ + m2_) * math.sin(a1) - m2_ * g_ * math.sin(a1 - 2 * a2) - 2 * math.sin(dlt) * m2_ * (w2 ** 2 * L_ + w1 ** 2 * L_ * math.cos(dlt))) / den
    dw2 = (2 * math.sin(dlt) * (w1 ** 2 * L_ * (m1_ + m2_) + g_ * (m1_ + m2_) * math.cos(a1) + w2 ** 2 * L_ * m2_ * math.cos(dlt))) / den
    return [w1, w2, dw1, dw2]
for mu_v in (1.0, 0.1, 10.0):
    m1_, m2_ = 1.0, mu_v
    ref_w = [math.sqrt(9.81 * (1 + mu_v - math.sqrt(mu_v * (1 + mu_v)))), math.sqrt(9.81 * (1 + mu_v + math.sqrt(mu_v * (1 + mu_v))))]
    # modo normal exacto: vector propio de K − ω² M
    K_ = 9.81 * np.array([[m1_ + m2_, 0], [0, m2_]]); M_ = np.array([[m1_ + m2_, m2_], [m2_, m2_]])
    for k_ in (0, 1):
        vec = np.linalg.solve(K_ - ref_w[k_] ** 2 * M_ + 1e-30, np.zeros(2)) if False else None
        ev, evec = np.linalg.eig(np.linalg.solve(M_, K_)); idx = np.argsort(ev); a = evec[:, idx[k_]] * 1e-4
        sol = solve_ivp(lambda tt, y: dbl_rhs(tt, y, m1_, m2_), [0, 20], [a[0], a[1], 0, 0], rtol=1e-12, atol=1e-14, dense_output=True)
        tt = np.linspace(0, 20, 200001); sg = np.array([sol.sol(x__)[0] for x__ in tt[::20]]); tts = tt[::20]
        cr = np.where(np.diff(np.sign(sg)) != 0)[0]; per = 2 * np.mean(np.diff(tts[cr]))
        rec(G_STEP, D, f'integración no lineal con amplitud 10⁻⁴: frecuencia del modo {k_ + 1} (μ = {mu_v})', 2 * math.pi / per, ref_w[k_], 'rel 2e-3', abs(2 * math.pi / per - ref_w[k_]) < 2e-3 * ref_w[k_])
ud = {'g': 'm s^-2', 'L': 'm', 'mu': '1', 'w': 'rad s^-1'}
dimcheck(D, 'ω±² = (g/L)(1 + μ ± √(μ(1+μ)))', Symbol('w', positive=True) ** 2, g / L * (1 + mu + sqrt(mu * (1 + mu))), ud)
dw_ = lambda mu_v, L_=1.0, g_=9.81: (math.sqrt(g_ / L_ * (1 + mu_v - math.sqrt(mu_v * (1 + mu_v)))), math.sqrt(g_ / L_ * (1 + mu_v + math.sqrt(mu_v * (1 + mu_v)))))
num(D, 'ω₋ (μ = 1)', dw_(1)[0], '2.397'); num(D, 'ω₊ (μ = 1)', dw_(1)[1], '5.787'); num(D, 'periodo lento', 2 * math.pi / dw_(1)[0], '2.621'); num(D, 'periodo rápido', 2 * math.pi / dw_(1)[1], '1.086'); num(D, '1 + √2', 1 + math.sqrt(2), '2.414')
num(D, 'ω₋ (μ = 0.1)', dw_(0.1)[0], '2.745'); num(D, 'ω₊ (μ = 0.1)', dw_(0.1)[1], '3.748'); num(D, 'cociente (μ = 0.1)', dw_(0.1)[1] / dw_(0.1)[0], '1.365'); num(D, 'ω₋ (μ = 10)', dw_(10)[0], '2.241'); num(D, 'ω₊ (μ = 10)', dw_(10)[1], '14.519'); num(D, 'cociente (μ = 10)', dw_(10)[1] / dw_(10)[0], '6.479')
num(D, '√(g/L)', math.sqrt(9.81), '3.132'); num(D, '√(g/2L)', math.sqrt(9.81 / 2), '2.215')
num(D, 'ω₋ valor inicial', dw_(1)[0], '2.39720'); num(D, 'ω₊ valor inicial', dw_(1)[1], '5.78735'); num(D, 'cociente valor inicial', dw_(1)[1] / dw_(1)[0], '2.41421'); num(D, 'T lento valor inicial', 2 * math.pi / dw_(1)[0], '2.6211')
Lq, mq, gq = symbols('L mu g', positive=True)
fs(D, 'wm', sqrt(gq / Lq * (1 + mq - sqrt(mq * (1 + mq))))); fs(D, 'wp', sqrt(gq / Lq * (1 + mq + sqrt(mq * (1 + mq)))))
fs(D, 'rt', sqrt((1 + mq + sqrt(mq * (1 + mq))) / (1 + mq - sqrt(mq * (1 + mq))))); fs(D, 'Tm', 2 * pi / sqrt(gq / Lq * (1 + mq - sqrt(mq * (1 + mq)))))
