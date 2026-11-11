# -*- coding: utf-8 -*-
"""Capítulo 5 — Cinemática."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, tan, atan, asin, Abs, Function, Matrix, simplify, solve

EX = {'mrua': 'mrua', 'proyectil': 'proyectil', 'circular': 'circular', 'polares': 'polares', 'rio': 'rio'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)

# ---------------------------------------------------------------- MRUA
D = 'mrua'
t, tp = symbols('t tp', positive=True)
x0, v0, a, x, v = symbols('x0 v0 a x v', real=True)
vs = v0 + a * t
xs = x0 + integrate(v0 + a * tp, (tp, 0, t))
ident(D, 'x = x₀ + v₀t + ½at² (integral de la velocidad)', xs, x0 + v0 * t + a * t ** 2 / 2)
ident(D, 'v = v₀ + at (integral de la aceleración)', v0 + integrate(a, (tp, 0, t)), vs)
ident(D, 'v² = v₀² + 2a(x − x₀)', vs ** 2, v0 ** 2 + 2 * a * (xs - x0))
ident(D, 'velocidad media (v₀+v)/2 = (x−x₀)/t', (v0 + vs) / 2, (xs - x0) / t)
tt = (v - v0) / a
ident(D, 'eliminar t: x−x₀ = (v²−v₀²)/(2a)', (v0 * tt + a * tt ** 2 / 2), (v ** 2 - v0 ** 2) / (2 * a))
dd = Symbol('d', positive=True); aa = Symbol('aa', positive=True); vv0 = Symbol('vv0', positive=True)
solves(D, 'frenado hasta el reposo: 0 = v₀² − 2|a|d → d', [Eq(0, vv0 ** 2 - 2 * aa * dd)], dd, vv0 ** 2 / (2 * aa))
ident(D, 'tiempo de parada t_s = v₀/|a|', (vv0 - aa * (vv0 / aa)), 0)
xx, vvv, aaa, tt_, xx0, vv00 = symbols('xx vv aa_ tt xx0 vv00')
uk = {'x': 'm', 'x0': 'm', 'v': 'm s^-1', 'v0': 'm s^-1', 'a': 'm s^-2', 't': 's', 'd': 'm'}
dimcheck(D, 'x = x₀ + v₀t + ½at²', x, x0 + v0 * t + a * t ** 2 / 2, uk)
dimcheck(D, 'v = v₀ + at', v, v0 + a * t, uk)
dimcheck(D, 'v² = v₀² + 2a(x−x₀)', v ** 2, v0 ** 2 + 2 * a * (x - x0), uk)
dimcheck(D, 'd = v₀²/(2|a|)', dd, v0 ** 2 / (2 * Abs(a)), uk)
num(D, 'd (30 m/s, 7 m/s²)', 30 ** 2 / (2 * 7), '64.29'); num(D, 'd valor inicial', 30 ** 2 / 14, '64.286'); num(D, 't_s', 30 / 7, '4.286'); num(D, 'd (60 m/s)', 60 ** 2 / 14, '257.1')
num(D, 'x(2 s)', 30 * 2 - 3.5 * 4, '46'); num(D, 'v(2 s)', 30 - 14, '16'); num(D, 'v media', 23.0, '23'); num(D, 'v₀²+2ax', 900 + 2 * (-7) * 46, '256')
num(D, 'frenado a 100 km/h', (100 / 3.6) ** 2 / 14, '55.1'); num(D, 'reacción 1 s', 100 / 3.6, '27.8'); num(D, 'total con reacción', (100 / 3.6) ** 2 / 14 + 100 / 3.6, '82.9')
num(D, 'cociente de distancias al doblar v₀', 60 ** 2 / 30 ** 2, '4')
v0p, ap, tpp = symbols('v0 a t', positive=True)
ar = Symbol('a', real=True)
fs(D, 'x', v0 * t + ar * t ** 2 / 2, conv=lambda p: dict(v0=p['v0'], a=p['a'], t=p['t']))
fs(D, 'v', v0 + ar * t); fs(D, 'vm', v0 + ar * t / 2); fs(D, 'v2', v0 ** 2 + 2 * ar * (v0 * t + ar * t ** 2 / 2)); fs(D, 'ds', v0 ** 2 / (2 * Abs(ar)))

# ---------------------------------------------------------------- Proyectil
D = 'proyectil'
th, h, g = symbols('theta h g', positive=True)
v0 = Symbol('v0', positive=True)
xt = v0 * cos(th) * t; yt = h + v0 * sin(th) * t - g * t ** 2 / 2
ident(D, 'v_y = d y/dt = v₀ senθ − gt', diff(yt, t), v0 * sin(th) - g * t)
ident(D, 'trayectoria y(x)', yt.subs(t, Symbol('X', positive=True) / (v0 * cos(th))), h + Symbol('X', positive=True) * tan(th) - g * Symbol('X', positive=True) ** 2 / (2 * v0 ** 2 * cos(th) ** 2))
tm = v0 * sin(th) / g
ident(D, 'v_y(t_m) = 0', diff(yt, t).subs(t, tm), 0)
ident(D, 'H = h + v₀² sen²θ/(2g)', yt.subs(t, tm), h + v0 ** 2 * sin(th) ** 2 / (2 * g))
T_ = (v0 * sin(th) + sqrt(v0 ** 2 * sin(th) ** 2 + 2 * g * h)) / g
ident(D, 'y(T) = 0', yt.subs(t, T_), 0)
Rr = v0 * cos(th) * T_
ident(D, 'h = 0: R = v₀² sen2θ/g', Rr.subs(h, 0), v0 ** 2 * sin(2 * th) / g)
Tq = Symbol('Tq', positive=True)
rts = solve(Eq(g * Tq ** 2 / 2 - v0 * sin(th) * Tq - h, 0), Tq)
rec(G_STEP, D, 'la raíz positiva de ½gT² − v₀ senθ T − h = 0 es T', 1.0, 1.0, 'solución exacta', any(same(r_, T_)[0] for r_ in rts))
X, Y, u = symbols('X Y u', positive=True)
cuad = g * X ** 2 / (2 * v0 ** 2) * u ** 2 - X * u + (Y - h + g * X ** 2 / (2 * v0 ** 2))
ident(D, 'trayectoria como cuadrática en u = tanθ', (h + X * u - g * X ** 2 / (2 * v0 ** 2) * (1 + u ** 2)) - Y, -cuad)
disc = X ** 2 - 4 * (g * X ** 2 / (2 * v0 ** 2)) * (Y - h + g * X ** 2 / (2 * v0 ** 2))
ident(D, 'discriminante = X²[1 − (2g/v₀²)(Y−h) − g²X²/v₀⁴]', disc, X ** 2 * (1 - (2 * g / v0 ** 2) * (Y - h) - g ** 2 * X ** 2 / v0 ** 4))
env = h + v0 ** 2 / (2 * g) - g * X ** 2 / (2 * v0 ** 2)
ident(D, 'envolvente: discriminante nulo en Y = env', disc.subs(Y, env), 0)
Rmax = v0 / g * sqrt(v0 ** 2 + 2 * g * h)
ident(D, 'env(R_max) = 0', env.subs(X, Rmax), 0)
tanth = v0 ** 2 / (g * Rmax)
ident(D, 'tanθ* = v₀/√(v₀² + 2gh)', tanth, v0 / sqrt(v0 ** 2 + 2 * g * h))
# el máximo de R(θ) coincide con R_max (derivada nula en θ*)
dR = diff(Rr, th)
ths = atan(v0 / sqrt(v0 ** 2 + 2 * g * h))
for vals in ({v0: 20, h: 10, g: 9.81}, {v0: 5, h: 3, g: 1.62}, {v0: 50, h: 0.5, g: 9.81}):
    d_ = float(dR.subs(th, ths).subs(vals).evalf(30)); rr = float(Rr.subs(th, ths).subs(vals).evalf(30)); rm = float(Rmax.subs(vals).evalf(30))
    rec(G_STEP, D, f'dR/dθ = 0 en θ* y R(θ*) = R_max ({vals[v0]}, {vals[h]}, {vals[g]})', abs(d_) + abs(rr - rm), 0.0, 'abs 1e-9', abs(d_) < 1e-9 and abs(rr - rm) < 1e-9)
uP = {'v0': 'm s^-1', 'theta': 'rad', 'h': 'm', 'g': 'm s^-2', 'R': 'm', 'H': 'm', 'T': 's'}
Rs_, Hs_, Ts_ = Symbol('R', positive=True), Symbol('H', positive=True), Symbol('T', positive=True)
thetaP = Symbol('theta', positive=True)
dimcheck(D, 'R', Rs_, v0 * cos(th) / g * (v0 * sin(th) + sqrt(v0 ** 2 * sin(th) ** 2 + 2 * g * h)), {'v0': 'm s^-1', 'theta': 'rad', 'h': 'm', 'g': 'm s^-2', 'R': 'm'})
dimcheck(D, 'H', Hs_, h + v0 ** 2 * sin(th) ** 2 / (2 * g), {'v0': 'm s^-1', 'theta': 'rad', 'h': 'm', 'g': 'm s^-2', 'H': 'm'})
dimcheck(D, 'T', Ts_, T_, {'v0': 'm s^-1', 'theta': 'rad', 'h': 'm', 'g': 'm s^-2', 'T': 's'})
dimcheck(D, 'R_max', Rs_, Rmax, {'v0': 'm s^-1', 'h': 'm', 'g': 'm s^-2', 'R': 'm'})
def projf(v0_, th_deg, h_=0, g_=9.81):
    t_ = math.radians(th_deg); vy = v0_ * math.sin(t_); T = (vy + math.sqrt(vy * vy + 2 * g_ * h_)) / g_
    return v0_ * math.cos(t_) * T, h_ + vy * vy / (2 * g_), T
ths_f = lambda v0_, h_, g_=9.81: math.degrees(math.atan(v0_ / math.sqrt(v0_ ** 2 + 2 * g_ * h_)))
num(D, 'R (45°, h=0)', projf(20, 45)[0], '40.77'); num(D, 'H (45°, h=0)', projf(20, 45)[1], '10.19'); num(D, 'T (45°, h=0)', projf(20, 45)[2], '2.883')
num(D, 'R (30°)', projf(20, 30)[0], '35.31'); num(D, 'R (60°)', projf(20, 60)[0], '35.31'); num(D, 'H (30°)', projf(20, 30)[1], '5.10'); num(D, 'H (60°)', projf(20, 60)[1], '15.29')
num(D, 'R en la Luna', projf(20, 45, 0, 1.62)[0], '246.9'); num(D, 'cociente Luna/Tierra', projf(20, 45, 0, 1.62)[0] / projf(20, 45)[0], '6.06', tol=1e-2)
num(D, 'R (45°, h=10)', projf(20, 45, 10)[0], '49.08'); num(D, 'H (45°, h=10)', projf(20, 45, 10)[1], '20.19'); num(D, 'T (45°, h=10)', projf(20, 45, 10)[2], '3.471')
num(D, 'θ* (h=10)', ths_f(20, 10), '39.32'); num(D, 'R_max (h=10)', 20 / 9.81 * math.sqrt(400 + 2 * 9.81 * 10), '49.78'); num(D, 'θ* (h=2)', ths_f(20, 2), '43.66')
num(D, 'ganancia de R_max sobre 45° (%)', (20 / 9.81 * math.sqrt(596.2) / projf(20, 45, 10)[0] - 1) * 100, '1.4')
num(D, 'R (v₀=40, 45°)/R (v₀=20, 45°)', projf(40, 45)[0] / projf(20, 45)[0], '4')
num(D, 'R valor inicial', projf(20, 45, 10)[0], '49.082'); num(D, 'H valor inicial', projf(20, 45, 10)[1], '20.194'); num(D, 'T valor inicial', projf(20, 45, 10)[2], '3.4706'); num(D, 'θ* valor inicial', ths_f(20, 10), '39.321'); num(D, 'R_max valor inicial', 20 / 9.81 * math.sqrt(400 + 196.2), '49.780')
rp = lambda a_: projf(20, a_, 10)[0]
num(D, 'variación de R a ±5° del óptimo (%)', (1 - rp(ths_f(20, 10) - 5) / rp(ths_f(20, 10))) * 100, '1.0', tol=0.1)
vv0p, thp, hp, gp = symbols('v0 th h g', positive=True)
thr = thp * pi / 180
Tp = (vv0p * sin(thr) + sqrt(vv0p ** 2 * sin(thr) ** 2 + 2 * gp * hp)) / gp
fs(D, 'R', vv0p * cos(thr) * Tp); fs(D, 'H', hp + vv0p ** 2 * sin(thr) ** 2 / (2 * gp)); fs(D, 'T', Tp)
fs(D, 'ths', atan(vv0p / sqrt(vv0p ** 2 + 2 * gp * hp)) * 180 / pi); fs(D, 'Rm', vv0p / gp * sqrt(vv0p ** 2 + 2 * gp * hp))

# ---------------------------------------------------------------- Circular
D = 'circular'
Rc, w, tT = symbols('R omega T', positive=True)
phi = w * t
rv = Matrix([Rc * cos(phi), Rc * sin(phi)])
vvec = rv.diff(t); avec = vvec.diff(t)
ident(D, '|v| = ωR', sqrt(vvec.dot(vvec)), w * Rc)
ident(D, 'v·r = 0 (tangente)', vvec.dot(rv), 0)
ident(D, 'a = −ω² r (componente x)', avec[0], -w ** 2 * rv[0]); ident(D, 'a = −ω² r (componente y)', avec[1], -w ** 2 * rv[1])
ident(D, '|a| = ω²R = v²/R', sqrt(avec.dot(avec)), (w * Rc) ** 2 / Rc)
ident(D, 'a_c = 4π²R/T² con ω = 2π/T', (w ** 2 * Rc).subs(w, 2 * pi / tT), 4 * pi ** 2 * Rc / tT ** 2)
ident(D, 'v = 2πR/T', (w * Rc).subs(w, 2 * pi / tT), 2 * pi * Rc / tT)
uC = {'R': 'm', 'T': 's', 'v': 'm s^-1', 'ac': 'm s^-2', 'omega': 'rad s^-1'}
dimcheck(D, 'a_c = 4π²R/T²', Symbol('ac', positive=True), 4 * pi ** 2 * Rc / tT ** 2, uC)
dimcheck(D, 'v = 2πR/T', Symbol('v', positive=True), 2 * pi * Rc / tT, uC)
dimcheck(D, 'a_c = ω²R', Symbol('ac', positive=True), w ** 2 * Rc, uC)
RE_, Ts_, Rl_, Tl_ = 6.371e6, 86164.1, 3.844e8, 27.32 * 86400
num(D, 'v ecuatorial', 2 * math.pi * RE_ / Ts_, '464.6'); num(D, 'a_c ecuatorial', 4 * math.pi ** 2 * RE_ / Ts_ ** 2, '0.03388'); num(D, 'a_c/g (%)', 4 * math.pi ** 2 * RE_ / Ts_ ** 2 / 9.81 * 100, '0.35')
num(D, 'v Luna', 2 * math.pi * Rl_ / Tl_, '1023'); num(D, 'a_c Luna (10⁻³)', 4 * math.pi ** 2 * Rl_ / Tl_ ** 2 / 1e-3, '2.724', tol=1e-3); num(D, 'a_c Luna (10⁻³, 2 cifras)', 4 * math.pi ** 2 * Rl_ / Tl_ ** 2 / 1e-3, '2.72')
num(D, 'g/a_c Luna', 9.81 / (4 * math.pi ** 2 * Rl_ / Tl_ ** 2), '3602'); num(D, '(r/R_T)²', (Rl_ / RE_) ** 2, '3640'); num(D, 'acuerdo (%)', abs(9.81 / (4 * math.pi ** 2 * Rl_ / Tl_ ** 2) / (Rl_ / RE_) ** 2 - 1) * 100, '1', tol=0.2)
num(D, 'v Tierra en órbita (km/s)', 2 * math.pi * 1.496e11 / (365.25 * 86400) / 1e3, '29.79'); num(D, 'a_c Tierra en órbita (10⁻³)', 4 * math.pi ** 2 * 1.496e11 / (365.25 * 86400) ** 2 / 1e-3, '5.93')
num(D, 'ω ecuatorial (10⁻⁵)', 2 * math.pi / Ts_ / 1e-5, '7.2921'); num(D, 'v valor inicial', 2 * math.pi * RE_ / Ts_, '464.58'); num(D, 'a_c valor inicial', 4 * math.pi ** 2 * RE_ / Ts_ ** 2, '0.033878'); num(D, 'a_c/g valor inicial (10⁻³)', 4 * math.pi ** 2 * RE_ / Ts_ ** 2 / 9.80665 / 1e-3, '3.4546')
num(D, 'v Luna valor (T = 2.3604e6)', 2 * math.pi * 3.844e8 / 2.3604e6, '1023.2'); num(D, 'a_c Luna valor (10⁻³)', 4 * math.pi ** 2 * 3.844e8 / 2.3604e6 ** 2 / 1e-3, '2.7238')
Rcp, Tcp = symbols('R T', positive=True)
fs(D, 'w', 2 * pi / Tcp); fs(D, 'v', 2 * pi * Rcp / Tcp); fs(D, 'ac', 4 * pi ** 2 * Rcp / Tcp ** 2); fs(D, 'ag', 4 * pi ** 2 * Rcp / Tcp ** 2 / sp.Float('9.80665', 30))

# ---------------------------------------------------------------- Polares
D = 'polares'
rr_ = Function('r')(t); thf = Function('theta')(t)
er = Matrix([cos(thf), sin(thf)]); et = Matrix([-sin(thf), cos(thf)])
ident(D, 'dr̂/dt = θ̇ θ̂ (x)', er.diff(t)[0], (thf.diff(t) * et)[0]); ident(D, 'dr̂/dt = θ̇ θ̂ (y)', er.diff(t)[1], (thf.diff(t) * et)[1])
ident(D, 'dθ̂/dt = −θ̇ r̂ (x)', et.diff(t)[0], (-thf.diff(t) * er)[0]); ident(D, 'dθ̂/dt = −θ̇ r̂ (y)', et.diff(t)[1], (-thf.diff(t) * er)[1])
rvec = rr_ * er
vpol = rr_.diff(t) * er + rr_ * thf.diff(t) * et
apol = (rr_.diff(t, 2) - rr_ * thf.diff(t) ** 2) * er + (rr_ * thf.diff(t, 2) + 2 * rr_.diff(t) * thf.diff(t)) * et
for i in (0, 1):
    ident(D, f'v = ṙ r̂ + rθ̇ θ̂ (componente {i})', rvec.diff(t)[i], vpol[i])
    ident(D, f'a = (r̈ − rθ̇²) r̂ + (rθ̈ + 2ṙθ̇) θ̂ (componente {i})', rvec.diff(t, 2)[i], apol[i])
# movimiento rectilíneo uniforme: a = 0 en polares
vx, b_ = symbols('vx b', positive=True)
rl = sqrt((vx * t) ** 2 + b_ ** 2); thl = sp.atan2(b_, vx * t)
ar_l = rl.diff(t, 2) - rl * thl.diff(t) ** 2; at_l = rl * thl.diff(t, 2) + 2 * rl.diff(t) * thl.diff(t)
ident(D, 'rectilíneo uniforme: a_r = 0', ar_l, 0); ident(D, 'rectilíneo uniforme: a_θ = 0', at_l, 0)
uPo = {'r': 'm', 'rd': 'm s^-1', 'rdd': 'm s^-2', 'w': 'rad s^-1', 'al': 'rad s^-2', 'ar': 'm s^-2', 'at': 'm s^-2'}
rS, rdS, rddS, wS, alS = symbols('r rd rdd w al', positive=True)
dimcheck(D, 'a_r = r̈ − rθ̇²', Symbol('ar', positive=True), rddS - rS * wS ** 2, uPo)
dimcheck(D, 'a_θ = rθ̈ + 2ṙθ̇', Symbol('at', positive=True), rS * alS + 2 * rdS * wS, uPo)
dimcheck(D, 'v_θ = rθ̇', Symbol('rd', positive=True), rS * wS, uPo)
num(D, 'a_r', 0 - 2 * 9, '-18'); num(D, 'a_θ', 2 * 1 * 3, '6'); num(D, 'v_θ', 6.0, '6'); num(D, '|v|', math.hypot(1, 6), '6.083'); num(D, '|a|', math.hypot(-18, 6), '18.97'); num(D, 'a_θ con θ̈ = 2', 2 * 2 + 6, '10')
num(D, '|v| valor inicial', math.hypot(1, 6), '6.0828'); num(D, '|a| valor inicial', math.hypot(-18, 6), '18.974')
fs(D, 'ar', rddS - rS * wS ** 2, conv=lambda p: dict(rdd=p['rdd'], r=p['r'], w=p['w']))
fs(D, 'at', rS * alS + 2 * rdS * wS); fs(D, 'vt', rS * wS); fs(D, 'vm', sqrt(rdS ** 2 + (rS * wS) ** 2)); fs(D, 'am', sqrt((rddS - rS * wS ** 2) ** 2 + (rS * alS + 2 * rdS * wS) ** 2))

# ---------------------------------------------------------------- Río
D = 'rio'
al_, d_, u_, w_ = symbols('alpha d u w', positive=True)
Tal = d_ / (u_ * cos(al_)); dy = (w_ - u_ * sin(al_)) * Tal
ident(D, 'v_y = 0 con sen α = w/u', (w_ - u_ * (w_ / u_)), 0)
ident(D, 'T = d/(u cos α) = d/√(u² − w²) con sen α = w/u', Tal.subs(cos(al_), sqrt(1 - (w_ / u_) ** 2)), d_ / sqrt(u_ ** 2 - w_ ** 2))
ident(D, 'T mínimo con α = 0: d/u y deriva w d/u', dy.subs(al_, 0), w_ * d_ / u_)
ident(D, 'T₂/T₁ = 1/√(1 − f²)', (d_ / sqrt(u_ ** 2 - w_ ** 2)) / (d_ / u_), 1 / sqrt(1 - (w_ / u_) ** 2))
# mínimo de la deriva con u < w: sen α = u/w
sa = Symbol('sa', positive=True)
dyS = (w_ - u_ * sa) * d_ / (u_ * sqrt(1 - sa ** 2))
crit = sp.simplify(diff(dyS, sa))
ident(D, 'deriva mínima para u < w en sen α = u/w: d√(w²−u²)/u', dyS.subs(sa, u_ / w_), d_ * sqrt(w_ ** 2 - u_ ** 2) / u_ * (w_ / w_) if False else d_ * (w_ - u_ ** 2 / w_) / (u_ * sqrt(1 - u_ ** 2 / w_ ** 2)))
ident(D, 'forma simplificada d√(w²−u²)/u', d_ * (w_ - u_ ** 2 / w_) / (u_ * sqrt(1 - u_ ** 2 / w_ ** 2)), d_ * sqrt(w_ ** 2 - u_ ** 2) / u_)
rec(G_STEP, D, 'dΔy/dsenα se anula en sen α = u/w', float(abs(crit.subs({sa: R_(1, 2) * 1, u_: 1, w_: 2, d_: 1}))), 0.0, 'abs 1e-12', abs(float(crit.subs({sa: R_(1, 2), u_: 1, w_: 2, d_: 1}))) < 1e-12)
uR = {'d': 'm', 'u': 'm s^-1', 'w': 'm s^-1', 'T': 's', 'dy': 'm', 'alpha': 'rad'}
dimcheck(D, 'T_min = d/u', Symbol('T', positive=True), d_ / u_, uR)
dimcheck(D, 'Δy = w d/u', Symbol('dy', positive=True), w_ * d_ / u_, uR)
dimcheck(D, 'T = d/√(u² − w²)', Symbol('T', positive=True), d_ / sqrt(u_ ** 2 - w_ ** 2), uR)
dimcheck(D, 'α = arcsen(w/u)', Symbol('alpha', positive=True), asin(w_ / u_), uR)
Tn = lambda d, u, f: d / (u * math.sqrt(1 - f * f))
num(D, 'T mínimo', 100 / 2, '50'); num(D, 'deriva', 0.5 * 100, '50'); num(D, 'T opuesto', Tn(100, 2, 0.5), '57.74'); num(D, 'T opuesto valor inicial', Tn(100, 2, 0.5), '57.735'); num(D, 'α', math.degrees(math.asin(0.5)), '30.000')
num(D, 'exceso de tiempo (%)', (Tn(100, 2, 0.5) / 50 - 1) * 100, '15.5'); num(D, 'T (f=0.8)', Tn(100, 2, 0.8), '83.3'); num(D, 'α (f=0.8)', math.degrees(math.asin(0.8)), '53.1')
num(D, 'T (f=0.95)', Tn(100, 2, 0.95), '160.1'); num(D, 'α (f=0.95)', math.degrees(math.asin(0.95)), '71.8'); num(D, 'T (f=0.2)', Tn(100, 2, 0.2), '51.0'); num(D, 'α (f=0.2)', math.degrees(math.asin(0.2)), '11.5')
num(D, 'pendiente local f²/(1−f²) a f = 0.5', 0.25 / 0.75, '0.33'); num(D, 'pendiente local a f = 0.95', 0.95 ** 2 / (1 - 0.95 ** 2), '9.26')
dp_, up_, fp2 = symbols('d u f', positive=True)
fs(D, 'T1', dp_ / up_); fs(D, 'dr', fp2 * dp_); fs(D, 'T2', dp_ / (up_ * sqrt(1 - fp2 ** 2))); fs(D, 'al', asin(fp2) * 180 / pi)
