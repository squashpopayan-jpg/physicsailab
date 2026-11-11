# -*- coding: utf-8 -*-
"""Capítulo 12 — Sistemas no inerciales y elasticidad."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, tan, I, Function, Matrix, solve, simplify, oo, atan
import mpmath as mp
from scipy.integrate import solve_ivp
from scipy.linalg import eigh

EX = {'fuerzas-ficticias': 'coriolis-caida', 'foucault': 'foucault', 'cubeta': 'cubeta', 'viga': 'viga', 'pandeo': 'pandeo'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
W = 2 * math.pi / 86164.1
m, g, t = S('m g t')

# ---------------------------------------------------------------- fuerzas ficticias
D = 'fuerzas-ficticias'
w, lam, h = S('w lambda h')
# derivada en el sistema que gira: base rotante en el plano
ph = Function('phi')
e1 = Matrix([cos(w * t), sin(w * t), 0]); e2 = Matrix([-sin(w * t), cos(w * t), 0]); e3 = Matrix([0, 0, 1])
wvec = Matrix([0, 0, w])
ident(D, 'dê₁/dt = ω×ê₁ (x)', e1.diff(t)[0], wvec.cross(e1)[0]); ident(D, 'dê₁/dt = ω×ê₁ (y)', e1.diff(t)[1], wvec.cross(e1)[1])
ident(D, 'dê₂/dt = ω×ê₂ (x)', e2.diff(t)[0], wvec.cross(e2)[0]); ident(D, 'dê₂/dt = ω×ê₂ (y)', e2.diff(t)[1], wvec.cross(e2)[1])
A1, A2 = Function('A1')(t), Function('A2')(t)
Avec = A1 * e1 + A2 * e2
dA_rot = A1.diff(t) * e1 + A2.diff(t) * e2
for i in range(3):
    ident(D, f'(dA/dt)_in = (dA/dt)_rot + ω×A (componente {i})', Avec.diff(t)[i], dA_rot[i] + wvec.cross(Avec)[i])
# aceleración: a = a' + 2ω×v' + ω×(ω×r') con r' = x1 ê₁ + x2 ê₂
X1, X2 = Function('X1')(t), Function('X2')(t)
rv = X1 * e1 + X2 * e2
vp = X1.diff(t) * e1 + X2.diff(t) * e2; ap = X1.diff(t, 2) * e1 + X2.diff(t, 2) * e2
for i in range(3):
    ident(D, f'a = a′ + 2ω×v′ + ω×(ω×r′) (componente {i})', rv.diff(t, 2)[i], ap[i] + 2 * wvec.cross(vp)[i] + wvec.cross(wvec.cross(rv))[i])
# caída: ω = ω(0, cosλ, sinλ), v′ = (0,0,−gt)
om = Matrix([0, w * cos(lam), w * sin(lam)]); vprime = Matrix([0, 0, -g * t])
cor = -2 * om.cross(vprime)
ident(D, 'Coriolis en la caída: a_este = 2ωgt cosλ', cor[0], 2 * w * g * t * cos(lam)); ident(D, 'Coriolis en la caída: a_norte = 0', cor[1], 0); ident(D, 'Coriolis en la caída: a_vertical = 0', cor[2], 0)
tp = Symbol('tp', positive=True)
xe = integrate(integrate(2 * w * g * cos(lam) * tp, (tp, 0, t)), (t, 0, t)) if False else w * g * cos(lam) * t ** 3 / 3
ident(D, 'x = ⅓ωg cosλ t³ (ẍ = 2ωg cosλ t)', diff(xe, t, 2), 2 * w * g * cos(lam) * t)
ident(D, 'δ = (2√2/3) ω cosλ √(h³/g)', xe.subs(t, sqrt(2 * h / g)), 2 * sqrt(2) / 3 * w * cos(lam) * sqrt(h ** 3 / g))
# integración numérica de la caída en el sistema giratorio (ecuación completa de Coriolis, sin centrífuga)
def fall(h_, lat, g_=9.80665):
    om = W * np.array([0, math.cos(math.radians(lat)), math.sin(math.radians(lat))])
    def rhs(tt, y): v = np.array(y[3:]); a = np.array([0, 0, -g_]) - 2 * np.cross(om, v); return list(v) + list(a)
    T = math.sqrt(2 * h_ / g_); s = solve_ivp(rhs, [0, T], [0, 0, 0, 0, 0, 0], rtol=1e-13, atol=1e-16, dense_output=True)
    return s.y[0, -1]
for h_, lat in ((100, 45), (100, 0), (300, 45)):
    dn = fall(h_, lat); df = 2 * math.sqrt(2) / 3 * W * math.cos(math.radians(lat)) * math.sqrt(h_ ** 3 / 9.80665)
    rec(G_STEP, D, f'integración con Coriolis completo: desviación (h = {h_}, λ = {lat}°)', dn, df, 'rel 1e-4', abs(dn - df) < 1e-4 * df)
uc = {'w': 'rad s^-1', 'lambda': 'rad', 'g': 'm s^-2', 't': 's', 'h': 'm', 'delta': 'm', 'x': 'm'}
dimcheck(D, 'δ = (2√2/3) ω cosλ √(h³/g)', Symbol('delta', positive=True), 2 * sqrt(2) / 3 * w * cos(lam) * sqrt(h ** 3 / g), uc); dimcheck(D, 'x = ⅓ωg cosλ t³', Symbol('x', positive=True), xe, uc)
dimcheck(D, 'aceleración de Coriolis = 2ωgt cosλ', Symbol('a', positive=True), 2 * w * g * t * cos(lam), dict(uc, a='m s^-2'))
cf = lambda h_, lat: (math.sqrt(2 * h_ / 9.80665), W * 9.80665 * math.sqrt(2 * h_ / 9.80665) ** 3 * math.cos(math.radians(lat)) / 3, W * 2 * h_ * math.cos(math.radians(lat)))
num(D, 't (100 m)', cf(100, 45)[0], '4.516'); num(D, 'δ (100 m, 45°) cm', cf(100, 45)[1] * 100, '1.552'); num(D, 'v lateral cm/s', cf(100, 45)[2] * 100, '1.03'); num(D, 'δ ecuador cm', cf(100, 0)[1] * 100, '2.195'); num(D, 'δ 60° cm', cf(100, 60)[1] * 100, '1.098'); num(D, 'δ 89° cm', cf(100, 89)[1] * 100, '0.038')
num(D, 'δ (300 m) cm', cf(300, 45)[1] * 100, '8.07'); num(D, 'cociente 300/100', cf(300, 45)[1] / cf(100, 45)[1], '5.2'); num(D, 'ω²R (m/s²)', W ** 2 * 6.371e6, '0.0339'); num(D, 'ω²R/g (%)', W ** 2 * 6.371e6 / 9.80665 * 100, '0.35')
num(D, 'δ valor inicial (10⁻²)', cf(100, 45)[1] / 1e-2, '1.5524'); num(D, 't valor inicial', cf(100, 45)[0], '4.5160'); num(D, 'v valor inicial (10⁻²)', cf(100, 45)[2] / 1e-2, '1.0313')
Wp = sp.Float(str(W), 30)
hp, latp, gp = symbols('h lat g', positive=True); latr = latp * pi / 180
fs(D, 'd', Wp * gp * sqrt(2 * hp / gp) ** 3 * cos(latr) / 3); fs(D, 't', sqrt(2 * hp / gp)); fs(D, 'vx', Wp * 2 * hp * cos(latr))

# ---------------------------------------------------------------- Foucault
D = 'foucault'
Om, g_L, x_, y_ = S('Omega gL x y')
zeta = Function('zeta')
xi0, wp_ = symbols('xi0 wp', positive=True)
ximp = xi0 * cos(wp_ * t)
zsol = ximp * exp(-I * Om * t)
ode_res = diff(zsol, t, 2) + g_L * zsol + 2 * I * Om * diff(zsol, t)
ident(D, 'ζ = ξ e^(−iΩt) resuelve ζ̈ + (g/L)ζ = −2iΩ ζ̇ si ω′² = g/L + Ω²', sp.simplify(ode_res.subs(wp_, sqrt(g_L + Om ** 2))), 0)
xx, yy = Function('x')(t), Function('y')(t)
zc = xx + I * yy
ident(D, 'ẍ + iÿ = −(g/L)ζ + 2Ω(ẏ − iẋ)', sp.expand(-g_L * zc + 2 * Om * (yy.diff(t) - I * xx.diff(t))), sp.expand(-g_L * zc - 2 * I * Om * zc.diff(t)))
# integración numérica de las ecuaciones (x, y) con Coriolis y comparación con la fórmula
gLn, Omn = 1.0, 0.02
sol = solve_ivp(lambda tt, y: [y[2], y[3], -gLn * y[0] + 2 * Omn * y[3], -gLn * y[1] - 2 * Omn * y[2]], [0, 200], [1.0, 0.0, 0.0, 0.0], rtol=1e-12, atol=1e-14, dense_output=True)
wpn = math.sqrt(gLn + Omn ** 2)
for tq in (37.0, 100.0, 180.0):
    zq = sol.sol(tq)[0] + 1j * sol.sol(tq)[1]
    # solución con ξ(0) = 1, ξ̇(0) = iΩ ⇒ ξ = cos ω′t + i(Ω/ω′) sen ω′t  (porque ζ̇(0) = 0 = ξ̇ − iΩξ)
    zf = (math.cos(wpn * tq) + 1j * Omn / wpn * math.sin(wpn * tq)) * np.exp(-1j * Omn * tq)
    rec(G_STEP, D, f'integración: ζ(t = {tq}) = ξ e^(−iΩt) con ξ armónico', float(abs(zq - zf)), 0.0, 'abs 1e-8', abs(zq - zf) < 1e-8)
# el plano rota a −Ω: ángulo del eje mayor tras un número entero de oscilaciones
tt = np.linspace(0, 200, 400001); xs_ = np.array([sol.sol(x__)[0] for x__ in tt[::40]]); ys_ = np.array([sol.sol(x__)[1] for x__ in tt[::40]]); ts_ = tt[::40]
# nodos de |ζ| mínimo (retorno del péndulo al centro) → ángulo de ζ en cada paso por el centro
r_ = np.hypot(xs_, ys_); pas = [i for i in range(1, len(r_) - 1) if r_[i] < r_[i - 1] and r_[i] < r_[i + 1] and r_[i] < 0.15]
ang = np.unwrap(2 * np.arctan2(ys_[pas], xs_[pas])) / 2
tasa = np.polyfit(ts_[pas], ang, 1)[0]
rec(G_STEP, D, 'la dirección del plano de oscilación gira a −Ω (ajuste en 6 pasos por el centro)', float(tasa), -Omn, 'rel 5e-2', abs(tasa + Omn) < 5e-2 * Omn)
uf = {'Omega': 'rad s^-1', 'T': 's', 'omega': 'rad s^-1', 'lambda': 'rad', 'gL': 's^-2', 'w': 'rad s^-1'}
dimcheck(D, 'Ω = ω senλ', Om, Symbol('omega', positive=True) * sin(lam), uf); dimcheck(D, 'T_F = 2π/(ω senλ)', Symbol('T', positive=True), 2 * pi / (Symbol('omega', positive=True) * sin(lam)), uf); dimcheck(D, 'ω′² = g/L + Ω²', Symbol('w', positive=True) ** 2, g_L + Om ** 2, uf)
fo = lambda lat, T0=86164.1: (2 * math.pi / T0 * math.sin(math.radians(lat)), 360 / (T0 / 3600) * math.sin(math.radians(lat)), T0 / math.sin(math.radians(lat)) / 3600)
num(D, 'Ω_F París (10⁻⁵)', fo(48.8566)[0] / 1e-5, '5.4914'); num(D, '°/h París', fo(48.8566)[1], '11.33'); num(D, 'T París (h)', fo(48.8566)[2], '31.78'); num(D, '°/h 45°', fo(45)[1], '10.64'); num(D, 'T 45° (h)', fo(45)[2], '33.85')
num(D, '°/h polo', fo(90)[1], '15.04'); num(D, 'T polo (h)', fo(90)[2], '23.93'); num(D, '°/h Popayán', fo(2.4419)[1], '0.64'); num(D, 'T Popayán (h)', fo(2.4419)[2], '561.8'); num(D, 'T Popayán (d)', fo(2.4419)[2] / 24, '23.4')
num(D, '°/h París valor inicial', fo(48.8566)[1], '11.327'); num(D, 'T París valor inicial', fo(48.8566)[2], '31.783')
latq, T0q = symbols('lat T0', positive=True); lr = latq * pi / 180
fs(D, 'O', 2 * pi / T0q * sin(lr)); fs(D, 'dh', 360 / (T0q / 3600) * sin(lr)); fs(D, 'T', T0q / sin(lr) / 3600)

# ---------------------------------------------------------------- cubeta
D = 'cubeta'
r, z, wc, f_ = S('r z wc f')
ident(D, 'pendiente: dz/dr = ω²r/g con z = ω²r²/(2g)', diff(w ** 2 * r ** 2 / (2 * g), r), w ** 2 * r / g)
ident(D, 'equipotencial: Φ = gz − ½ω²r² constante', (g * (w ** 2 * r ** 2 / (2 * g)) - w ** 2 * r ** 2 / 2), 0)
ident(D, 'z = r²/(4f) con f = g/(2ω²)', w ** 2 * r ** 2 / (2 * g), r ** 2 / (4 * (g / (2 * w ** 2))))
ident(D, 'rpm = 30ω/π', 30 * w / pi * (pi / 30), w)
# la superficie es perpendicular a g_ef en cada punto
gef = Matrix([w ** 2 * r, -g]); tang = Matrix([1, diff(w ** 2 * r ** 2 / (2 * g), r)])
ident(D, 'g_ef · tangente = 0', (gef.T * tang)[0], 0)
# espejo parabólico: los rayos paralelos al eje pasan por el foco (reflexión)
rr0 = 0.3; slope = w ** 2 * rr0 / g
f_val = (g / (2 * w ** 2))
zz0 = w ** 2 * rr0 ** 2 / (2 * g)
# normal al espejo y rayo reflejado: pasa por (0, f)
nrm = np.array([-float(slope.subs({w: 0.7, g: 9.80665})), 1.0]); nrm /= np.linalg.norm(nrm)
dire = np.array([0.0, -1.0]); refl = dire - 2 * np.dot(dire, nrm) * nrm
zv = float(zz0.subs({w: 0.7, g: 9.80665})); fv = float(f_val.subs({w: 0.7, g: 9.80665}))
t_ = (fv - zv) / refl[1]; xfocus = rr0 + refl[0] * t_
rec(G_STEP, D, 'un rayo paralelo al eje se refleja pasando por el foco (0, f)', float(abs(xfocus)), 0.0, 'abs 1e-12', abs(xfocus) < 1e-12)
ucb = {'z': 'm', 'r': 'm', 'w': 'rad s^-1', 'g': 'm s^-2', 'f': 'm'}
dimcheck(D, 'z = ω²r²/(2g)', z, w ** 2 * r ** 2 / (2 * g), ucb); dimcheck(D, 'f = g/(2ω²)', f_, g / (2 * w ** 2), ucb); dimcheck(D, 'tanα = ω²r/g es adimensional', Symbol('q', positive=True), w ** 2 * r / g, dict(ucb, q='1'))
cb = lambda w_, r_, g_=9.80665: (w_ ** 2 * r_ ** 2 / (2 * g_), g_ / (2 * w_ ** 2), 30 * w_ / math.pi, w_ ** 2 * r_ / g_)
num(D, 'f (ω = 0.7)', cb(0.7, 1)[1], '10.01'); num(D, 'rpm', cb(0.7, 1)[2], '6.685'); num(D, 'z (r = 1) cm', cb(0.7, 1)[0] * 100, '2.50'); num(D, 'z (r = 3) cm', cb(0.7, 3)[0] * 100, '22.5'); num(D, 'pendiente (r = 1)', cb(0.7, 1)[3], '0.04997')
num(D, 'ω para f = 9.9', math.sqrt(9.80665 / (2 * 9.9)), '0.7038'); num(D, 'rpm para f = 9.9', 30 * math.sqrt(9.80665 / (2 * 9.9)) / math.pi, '6.72'); num(D, 'periodo para f = 9.9', 2 * math.pi / math.sqrt(9.80665 / (2 * 9.9)), '8.93')
num(D, 'f (ω = 2)', cb(2, 1)[1], '1.226'); num(D, 'z (ω = 5, r = 0.1) cm', cb(5, 0.1)[0] * 100, '1.27')
num(D, 'z valor inicial', cb(0.7, 1)[0], '0.024983'); num(D, 'f valor inicial', cb(0.7, 1)[1], '10.007'); num(D, 'rpm valor inicial', cb(0.7, 1)[2], '6.6845'); num(D, 'pendiente valor inicial', cb(0.7, 1)[3], '0.049966')
wq, rq, gq = symbols('w r g', positive=True)
fs(D, 'z', wq ** 2 * rq ** 2 / (2 * gq)); fs(D, 'f', gq / (2 * wq ** 2)); fs(D, 'rpm', 30 * wq / pi); fs(D, 'sl', wq ** 2 * rq / gq)

# ---------------------------------------------------------------- viga
D = 'viga'
F, L, E, b, hh, x, y, Iz, zz = S('F L E b hh x y Iz zz')
integral(D, 'I = ∫z² b dz = bh³/12', zz ** 2 * b, zz, -hh / 2, hh / 2, b * hh ** 3 / 12)
ys = F / (E * Iz) * (L * x ** 2 / 2 - x ** 3 / 6)
ident(D, 'EI y″ = F(L − x)', E * Iz * diff(ys, x, 2), F * (L - x)); ident(D, 'y(0) = 0', ys.subs(x, 0), 0); ident(D, 'y′(0) = 0', diff(ys, x).subs(x, 0), 0)
ident(D, 'δ = y(L) = FL³/(3EI)', ys.subs(x, L), F * L ** 3 / (3 * E * Iz)); ident(D, 'k = F/δ = 3EI/L³', F / (F * L ** 3 / (3 * E * Iz)), 3 * E * Iz / L ** 3)
yf = Function('y')
sol = sp.dsolve(Eq(E * Iz * yf(x).diff(x, 2), F * (L - x)), yf(x), ics={yf(0): 0, yf(x).diff(x).subs(x, 0): 0})
ident(D, 'dsolve con empotramiento reproduce y(x)', sol.rhs, ys)
ident(D, 'σ_máx = M c/I = 6FL/(bh²)', (F * L) * (hh / 2) / (b * hh ** 3 / 12), 6 * F * L / (b * hh ** 2))
# integración numérica (diferencias finitas) de la ecuación de la viga
def viga_fd(F_, L_, EI_, n=2000):
    xs = np.linspace(0, L_, n + 1); hstep = xs[1] - xs[0]
    A = np.zeros((n - 1, n - 1)); rhs = F_ * (L_ - xs[2:n + 1]) * 0
    # resolver y″ = F(L−x)/EI con y(0) = 0, y′(0) = 0 por integración doble acumulada
    yp = np.concatenate([[0], np.cumsum((F_ * (L_ - xs[:-1] - hstep / 2) / EI_) * hstep)]); yy = np.concatenate([[0], np.cumsum((yp[:-1] + yp[1:]) / 2 * hstep)])
    return yy[-1]
dfd = viga_fd(20, 0.5, 200e9 * 0.02 * 0.005 ** 3 / 12)
rec(G_STEP, D, 'integración numérica doble de y″ = F(L−x)/EI: δ', dfd, 20 * 0.5 ** 3 / (3 * 200e9 * 0.02 * 0.005 ** 3 / 12), 'rel 1e-6', abs(dfd - 20 * 0.5 ** 3 / (3 * 200e9 * 0.02 * 0.005 ** 3 / 12)) < 1e-6 * dfd)
uv = {'F': 'N', 'L': 'm', 'E': 'Pa', 'Iz': 'm^4', 'b': 'm', 'hh': 'm', 'd': 'm', 'k': 'kg s^-2', 's': 'Pa'}
dimcheck(D, 'δ = FL³/(3EI)', Symbol('d', positive=True), F * L ** 3 / (3 * E * Iz), uv); dimcheck(D, 'I = bh³/12', Iz, b * hh ** 3 / 12, uv); dimcheck(D, 'k = 3EI/L³', Symbol('k', positive=True), 3 * E * Iz / L ** 3, uv); dimcheck(D, 'σ = 6FL/(bh²)', Symbol('s', positive=True), 6 * F * L / (b * hh ** 2), uv)
Ib = lambda b_, h_: b_ * h_ ** 3 / 12
dv = lambda F_, L_, E_, b_, h_: F_ * L_ ** 3 / (3 * E_ * Ib(b_, h_))
num(D, 'I (10⁻¹⁰)', Ib(0.02, 0.005) / 1e-10, '2.083'); num(D, 'δ (cm)', dv(20, 0.5, 200e9, 0.02, 0.005) * 100, '2.00'); num(D, 'k', 3 * 200e9 * Ib(0.02, 0.005) / 0.5 ** 3, '1000'); num(D, 'σ_máx (MPa)', 6 * 20 * 0.5 / (0.02 * 0.005 ** 2) / 1e6, '120')
num(D, 'δ (L = 1) cm', dv(20, 1, 200e9, 0.02, 0.005) * 100, '16.0'); num(D, 'δ (h = 10 mm) cm', dv(20, 0.5, 200e9, 0.02, 0.01) * 100, '0.25'); num(D, 'δ (b = 40 mm) cm', dv(20, 0.5, 200e9, 0.04, 0.005) * 100, '1.0'); num(D, 'δ (aluminio) cm', dv(20, 0.5, 70e9, 0.02, 0.005) * 100, '5.71')
num(D, 'δ valor inicial', dv(20, 0.5, 200e9, 0.02, 0.005), '0.02'); num(D, 'σ valor inicial (10⁸)', 6 * 20 * 0.5 / (0.02 * 0.005 ** 2) / 1e8, '1.2')
Fq, Lq, Eq, bq, hq = symbols('F L E b h', positive=True)
Iq = Eq * 1e9 * bq * 1e-3 * (hq * 1e-3) ** 3 / 12
fs(D, 'd', Fq * Lq ** 3 / (3 * Iq)); fs(D, 'k', 3 * Iq / Lq ** 3); fs(D, 's', 6 * Fq * Lq / (bq * 1e-3 * (hq * 1e-3) ** 2))

# ---------------------------------------------------------------- pandeo
D = 'pandeo'
P, k_, A_, B_, Ei = S('P k A B EI')
ysol = A_ * sin(k_ * x) + B_ * cos(k_ * x)
ident(D, 'y″ + k²y = 0 para y = A senkx + B coskx', diff(ysol, x, 2) + k_ ** 2 * ysol, 0)
ident(D, 'EI y″ = −P y con k² = P/EI', (Ei * diff(ysol, x, 2) + P * ysol).subs(P, Ei * k_ ** 2), 0)
ident(D, 'y(0) = 0 ⇒ B = 0', ysol.subs(x, 0), B_)
nn = Symbol('n', positive=True, integer=True)
ident(D, 'kL = nπ ⇒ P_n = n²π²EI/L²', (nn * pi / L) ** 2 * Ei, nn ** 2 * pi ** 2 * Ei / L ** 2)
ident(D, 'senkL = 0 para k = nπ/L', sin((nn * pi / L) * L), 0)
ident(D, 'σ_cr = π²E/(KL/r)² con r² = I/A', pi ** 2 * Ei / (L ** 2) / Symbol('Ar', positive=True), pi ** 2 * (Ei / Symbol('Ar', positive=True)) / L ** 2)
# valores propios por diferencias finitas: −y″ = k² y con y(0) = y(L) = 0
def eig_fd(L_, n=800):
    hstep = L_ / n; Mx = (np.diag(2 * np.ones(n - 1)) - np.diag(np.ones(n - 2), 1) - np.diag(np.ones(n - 2), -1)) / hstep ** 2
    return eigh(Mx, eigvals_only=True)[:3]
ev_ = eig_fd(0.5)
for n_ in (1, 2, 3):
    rec(G_STEP, D, f'valor propio por diferencias finitas: (nπ/L)² con n = {n_}', float(ev_[n_ - 1]), (n_ * math.pi / 0.5) ** 2, 'rel 1e-4', abs(ev_[n_ - 1] - (n_ * math.pi / 0.5) ** 2) < 1e-4 * (n_ * math.pi / 0.5) ** 2)
up = {'Pcr': 'N', 'E': 'Pa', 'Iz': 'm^4', 'L': 'm', 'K': '1', 'sc': 'Pa', 'r': 'm'}
Kq = Symbol('K', positive=True); rg = Symbol('r', positive=True)
dimcheck(D, 'P_cr = π²EI/(KL)²', Symbol('Pcr', positive=True), pi ** 2 * E * Iz / (Kq * L) ** 2, up); dimcheck(D, 'σ_cr = π²E/(KL/r)²', Symbol('sc', positive=True), pi ** 2 * E / (Kq * L / rg) ** 2, up)
pc = lambda E_, b_, h_, L_, K_=1: math.pi ** 2 * E_ * Ib(b_, h_) / (K_ * L_) ** 2
num(D, 'P_cr', pc(200e9, 0.02, 0.005, 0.5), '1645'); num(D, 'kgf', pc(200e9, 0.02, 0.005, 0.5) / 9.80665, '168'); num(D, 'σ_cr (MPa)', pc(200e9, 0.02, 0.005, 0.5) / (0.02 * 0.005) / 1e6, '16.45'); num(D, 'esbeltez', 0.5 / (0.005 / math.sqrt(12)), '346')
num(D, 'P_cr K = 2', pc(200e9, 0.02, 0.005, 0.5, 2), '411'); num(D, 'P_cr K = 0.7', pc(200e9, 0.02, 0.005, 0.5, 0.7), '3357'); num(D, 'P_cr K = 0.5', pc(200e9, 0.02, 0.005, 0.5, 0.5), '6580'); num(D, 'P_cr L = 1', pc(200e9, 0.02, 0.005, 1), '411'); num(D, 'P_cr h = 10 mm', pc(200e9, 0.02, 0.01, 0.5), '13159')
num(D, 'P_cr valor inicial', pc(200e9, 0.02, 0.005, 0.5), '1644.9'); num(D, 'σ_cr valor inicial (10⁷)', pc(200e9, 0.02, 0.005, 0.5) / (0.02 * 0.005) / 1e7, '1.645'); num(D, 'esbeltez valor inicial', 0.5 / (0.005 / math.sqrt(12)), '346.41'); num(D, 'P_cr K = 2 (2 decimales)', pc(200e9, 0.02, 0.005, 0.5, 2), '411.23')
Ep, bp, hp, Lp, Kp = symbols('E b h L K', positive=True)
Ip = Ep * 1e9 * bp * 1e-3 * (hp * 1e-3) ** 3 / 12
fs(D, 'P', pi ** 2 * Ip / (Kp * Lp) ** 2); fs(D, 's', pi ** 2 * Ip / (Kp * Lp) ** 2 / (bp * 1e-3 * hp * 1e-3)); fs(D, 'esb', Kp * Lp / (hp * 1e-3 / sqrt(12)))
