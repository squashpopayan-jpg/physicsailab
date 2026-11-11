# -*- coding: utf-8 -*-
"""Capítulo 27 — Relatividad especial."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, solve, simplify, oo, sin, cos, tan, atanh, tanh, series
from scipy.integrate import solve_ivp, quad

EX = {'dilatacion-contraccion': 'dilatacion', 'suma-velocidades': 'velocidades', 'doppler-relativista': 'doppler-rel', 'energia-momento': 'energia', 'umbral-reacciones': 'umbral'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
C = 299792458.0
Cq = sp.Float('299792458', 40)
g = lambda b: 1 / math.sqrt(1 - b * b)

# ---------------------------------------------------------------- dilatación y contracción
D = 'dilatacion-contraccion'
dt, dt0, ell, v, c, x, t, L0, L = S('dt dt0 ell v c x t L0 L')
solves(D, '(cΔt/2)² = (vΔt/2)² + ℓ² ⇒ Δt = 2ℓ/(c√(1 − v²/c²))', [Eq((c * dt / 2) ** 2, (v * dt / 2) ** 2 + ell ** 2)], dt, 2 * ell / (c * sqrt(1 - v ** 2 / c ** 2)), vars=[dt]) if False else ident(D, 'despejar Δt de (cΔt/2)² = (vΔt/2)² + ℓ²: Δt = γΔt₀', 2 * ell / sqrt(c ** 2 - v ** 2), (2 * ell / c) / sqrt(1 - v ** 2 / c ** 2))
ident(D, 'verificación: (cΔt/2)² − (vΔt/2)² = ℓ² con Δt = γΔt₀ y Δt₀ = 2ℓ/c', (c * (2 * ell / (c * sqrt(1 - v ** 2 / c ** 2))) / 2) ** 2 - (v * (2 * ell / (c * sqrt(1 - v ** 2 / c ** 2))) / 2) ** 2, ell ** 2)
gam = 1 / sqrt(1 - v ** 2 / c ** 2)
xp = gam * (x - v * t); tp = gam * (t - v * x / c ** 2)
ident(D, 'invariante c²t′² − x′² = c²t² − x²', c ** 2 * tp ** 2 - xp ** 2, c ** 2 * t ** 2 - x ** 2)
xi_, ti_ = symbols('xi ti', real=True)
ident(D, 'transformación inversa: x = γ(x′ + vt′)', gam * (xp + v * tp), x)
ident(D, 'transformación inversa: t = γ(t′ + vx′/c²)', gam * (tp + v * xp / c ** 2), t)
ident(D, 'v ≪ c: γ → 1 y se recupera x′ = x − vt', sp.limit(xp.subs({x: Symbol('X'), t: Symbol('T')}) / (Symbol('X') - v * Symbol('T')), c, oo), 1)
ident(D, 'contracción: L₀ = γL (marcas simultáneas en el laboratorio, Δt = 0)', (xp.subs({t: 0}) - xp.subs({t: 0, x: 0})), gam * x)
ident(D, 'dilatación: el suceso (x′ = 0, t′ = Δt₀) tiene t = γΔt₀', (gam * (dt0 + v * 0 / c ** 2)), gam * dt0)
# transformación numérica
for b in (0.3, 0.8, 0.998):
    G = g(b); X, T = 5.0, 2.0
    Xp, Tp = G * (X - b * T), G * (T - b * X)
    rec(G_STEP, D, f'invariante del intervalo con números (β = {b})', T ** 2 - X ** 2, Tp ** 2 - Xp ** 2, 'rel 1e-9', abs((T ** 2 - X ** 2) - (Tp ** 2 - Xp ** 2)) < 1e-9 * abs(T ** 2 - X ** 2) * max(1, G ** 2))
# reloj de luz: tiempo calculado por la geometría de la diagonal
for b in (0.6, 0.998):
    ellv = 1.0; Dt0 = 2 * ellv / C; Dt = Dt0 * g(b)
    diag = math.hypot(b * C * Dt / 2, ellv)
    rec(G_STEP, D, f'reloj de luz: camino diagonal = cΔt/2 (β = {b})', diag, C * Dt / 2, 'rel 1e-12', abs(diag / (C * Dt / 2) - 1) < 1e-12)
uD = {'gam': '1', 'beta': '1', 'v': 'm s^-1', 'c': 'm s^-1', 'dt0': 's', 'dt': 's', 'L0': 'm', 'L': 'm', 'ell': 'm', 'x': 'm', 't': 's'}
dimcheck(D, 'Δt = γΔt₀', dt, gam * dt0, uD)
dimcheck(D, 'L = L₀/γ', L, L0 / gam, uD)
dimcheck(D, "x′ = γ(x − vt)", x, gam * (x - v * t), uD)
dimcheck(D, "ct′ y x′ tienen igual dimensión: t′ = γ(t − vx/c²)", t, gam * (t - v * x / c ** 2), uD)
dlf = lambda b, t0, L0_: (g(b), g(b) * t0, L0_ / g(b), b * C * g(b) * t0 * 1e-6 / 1e3)
num(D, 'γ (0.998)', dlf(0.998, 2.197, 1)[0], '15.82'); num(D, 'Δt (µs)', dlf(0.998, 2.197, 1)[1], '34.76'); num(D, 'distancia (km)', dlf(0.998, 2.197, 1)[3], '10.40'); num(D, 'sin relatividad (m)', 0.998 * C * 2.197e-6, '657', tol=2e-3); num(D, 'L (cm)', dlf(0.998, 2.197, 1)[2] * 100, '6.32')
t_vuelo = 15e3 / (0.998 * C) * 1e6
num(D, 'tiempo de vuelo 15 km (µs)', t_vuelo, '50.1'); num(D, 'fracción con dilatación', math.exp(-t_vuelo / dlf(0.998, 2.197, 1)[1]), '0.236'); num(D, 'fracción sin dilatación (10⁻¹⁰)', math.exp(-t_vuelo / 2.197) / 1e-10, '1.2', tol=0.03)
num(D, 'γ (0.6)', g(0.6), '1.25'); num(D, 'γ (0.8)', g(0.8), '1.667'); num(D, 'γ (0.99)', g(0.99), '7.089'); num(D, 'γ (0.9994)', g(0.9994), '28.87'); num(D, 'γ (0.9999)', g(0.9999), '70.71'); num(D, 'L (0.6) cm', 100 / g(0.6), '80'); num(D, 'L (0.8) cm', 100 / g(0.8), '60')
num(D, 'γ valor inicial', dlf(0.998, 2.197, 1)[0], '15.8193'); num(D, 'Δt valor inicial', dlf(0.998, 2.197, 1)[1], '34.7550'); num(D, 'L valor inicial', dlf(0.998, 2.197, 1)[2], '0.0632139'); num(D, 'distancia valor inicial', dlf(0.998, 2.197, 1)[3], '10.3984')
eq_, t0q, L0q = symbols('eps t0 L0', positive=True)
bq = 1 - eq_
gq = 1 / sqrt(1 - bq ** 2)
fs(D, 'b', bq); fs(D, 'g', gq); fs(D, 't', gq * t0q); fs(D, 'L', L0q / gq); fs(D, 'd', bq * Cq * gq * t0q * sp.Float('1e-9', 40))

# ---------------------------------------------------------------- composición de velocidades
D = 'suma-velocidades'
u, w, dxp, dtp = S('u w dxp dtp')
dx_ = gam * (dxp + v * dtp); dt_ = gam * (dtp + v * dxp / c ** 2)
ident(D, 'w = dx/dt = (u + v)/(1 + uv/c²) con u = dx′/dt′', (dx_ / dt_).subs(dxp, u * dtp), (u + v) / (1 + u * v / c ** 2))
f1, f2 = symbols('f1 f2', positive=True)
ident(D, 'tanh(φ₁ + φ₂) = (tanh φ₁ + tanh φ₂)/(1 + tanh φ₁ tanh φ₂)', sp.simplify(tanh(f1 + f2).rewrite(sp.exp)), sp.simplify(((tanh(f1) + tanh(f2)) / (1 + tanh(f1) * tanh(f2))).rewrite(sp.exp)))
ident(D, 'u = c: w = c (invariancia de la velocidad de la luz)', ((c + v) / (1 + c * v / c ** 2)), c)
ident(D, 'u, v ≪ c: w → u + v', sp.limit((u + v) / (1 + u * v / c ** 2), c, oo), u + v)
nn = Symbol('n', positive=True)
w_f = (c / nn + v) / (1 + v / (nn * c))
ident(D, 'Fizeau: dw/dv en v = 0 es 1 − 1/n²', diff(w_f, v).subs(v, 0), 1 - 1 / nn ** 2)
# composición con matrices de Lorentz
def boost(b):
    G = g(b); return np.array([[G, G * b], [G * b, G]])
for (b1, b2) in ((0.9, 0.9), (0.5, 0.5), (0.9, 0.5), (0.99, 0.2)):
    Mm = boost(b1) @ boost(b2); wcomp = Mm[0, 1] / Mm[0, 0]
    rec(G_STEP, D, f'producto de matrices de Lorentz B(β₁)B(β₂) = B(w) (β = {b1}, {b2})', wcomp, (b1 + b2) / (1 + b1 * b2), 'rel 1e-12', abs(wcomp / ((b1 + b2) / (1 + b1 * b2)) - 1) < 1e-12)
    rec(G_STEP, D, f'rapideces: atanh β₁ + atanh β₂ = atanh w ({b1}, {b2})', math.atanh(b1) + math.atanh(b2), math.atanh((b1 + b2) / (1 + b1 * b2)), 'rel 1e-12', abs((math.atanh(b1) + math.atanh(b2)) / math.atanh((b1 + b2) / (1 + b1 * b2)) - 1) < 1e-12)
uV = {'u': 'm s^-1', 'v': 'm s^-1', 'w': 'm s^-1', 'c': 'm s^-1', 'n': '1'}
dimcheck(D, 'w = (u + v)/(1 + uv/c²)', w, (u + v) / (1 + u * v / c ** 2), uV)
dimcheck(D, 'w ≈ c/n + v(1 − 1/n²)', w, c / nn + v * (1 - 1 / nn ** 2), uV)
vlf = lambda b1, b2, n_: ((b1 + b2) / (1 + b1 * b2), b1 + b2, math.atanh(b1) + math.atanh(b2), 1 - 1 / n_ ** 2)
num(D, 'w (0.9, 0.9)', vlf(0.9, 0.9, 1.333)[0], '0.994475'); num(D, 'w (0.5, 0.5)', vlf(0.5, 0.5, 1.333)[0], '0.8'); num(D, 'w (0.99, 0.99)', vlf(0.99, 0.99, 1.333)[0], '0.999949'); num(D, 'w (0.1, 0.1)', vlf(0.1, 0.1, 1.333)[0], '0.198020'); num(D, 'rapidez (0.9, 0.9)', vlf(0.9, 0.9, 1.333)[2], '2.9444'); num(D, 'rapidez de 0.9', math.atanh(0.9), '1.4722'); num(D, 'w (0.9, 0.5)', vlf(0.9, 0.5, 1.333)[0], '0.965517'); num(D, 'rapidez (0.9, 0.5)', vlf(0.9, 0.5, 1.333)[2], '2.0215')
num(D, 'Fizeau (agua)', vlf(0.9, 0.9, 1.333)[3], '0.4372'); num(D, 'arrastre a 7 m/s', 7 * vlf(0.9, 0.9, 1.333)[3], '3.06')
num(D, 'w valor inicial', vlf(0.9, 0.9, 1.333)[0], '0.9944751'); num(D, 'suma clásica valor inicial', 1.8, '1.8'); num(D, 'rapidez valor inicial', vlf(0.9, 0.9, 1.333)[2], '2.94444'); num(D, 'Fizeau valor inicial', vlf(0.9, 0.9, 1.333)[3], '0.437219')
uq, vq, nq = symbols('u v n', positive=True)
fs(D, 'w', (uq + vq) / (1 + uq * vq)); fs(D, 'gal', uq + vq); fs(D, 'rap', atanh(uq) + atanh(vq)); fs(D, 'fiz', 1 - 1 / nq ** 2)

# ---------------------------------------------------------------- Doppler
D = 'doppler-relativista'
T0, bt, th, f0 = S('T0 bt th f0')
Te = gam.subs(v, bt * c) * T0
ident(D, 'T = γT₀ − (v cosθ)γT₀/c = γT₀(1 − β cosθ)', Te - bt * cos(th) * Te, Te * (1 - bt * cos(th)))
for bv in (0.2, 0.5, 0.9):
    Gv = g(bv)
    rec(G_STEP, D, f'θ = 0: f/f₀ = √((1+β)/(1−β)) (β = {bv})', 1 / (Gv * (1 - bv)), math.sqrt((1 + bv) / (1 - bv)), 'rel 1e-12', abs(1 / (Gv * (1 - bv)) / math.sqrt((1 + bv) / (1 - bv)) - 1) < 1e-12)
    rec(G_STEP, D, f'θ = π: f/f₀ = √((1−β)/(1+β)) (β = {bv})', 1 / (Gv * (1 + bv)), math.sqrt((1 - bv) / (1 + bv)), 'rel 1e-12', abs(1 / (Gv * (1 + bv)) / math.sqrt((1 - bv) / (1 + bv)) - 1) < 1e-12)
    rec(G_STEP, D, f'θ = π/2: f/f₀ = 1/γ (β = {bv})', 1 / Gv, math.sqrt(1 - bv ** 2), 'rel 1e-12', abs(1 / Gv / math.sqrt(1 - bv ** 2) - 1) < 1e-12)
# transformación del cuadrivector de onda: f = γ f₀ (1 + β cosθ′) con cosθ = (cosθ′ + β)/(1 + β cosθ′)
for (b, thd) in ((0.5, 0.0), (0.5, 60.0), (0.5, 120.0), (0.9, 90.0), (0.3, 170.0)):
    thr = math.radians(thd); G = g(b)
    ratio_formula = 1 / (G * (1 - b * math.cos(thr)))
    # el ángulo θ′ en el sistema de la fuente asociado a θ del observador: cosθ′ = (cosθ − β)/(1 − β cosθ)
    cp = (math.cos(thr) - b) / (1 - b * math.cos(thr))
    ratio_boost = G * (1 + b * cp)
    ratio_formula_inv = 1 / ratio_boost if False else ratio_boost
    rec(G_STEP, D, f'cuadrivector de onda: f/f₀ = γ(1 + β cosθ′) (β = {b}, θ = {thd}°) frente a 1/[γ(1 − β cosθ)]', ratio_boost, ratio_formula, 'rel 1e-12', abs(ratio_boost / ratio_formula - 1) < 1e-12)
uP = {'f': 'Hz', 'f0': 'Hz', 'T': 's', 'T0': 's', 'bt': '1', 'th': 'rad', 'z': '1', 'gam': '1'}
dimcheck(D, 'f = f₀/[γ(1 − β cosθ)]', Symbol('f', positive=True), f0 / (1 / sqrt(1 - bt ** 2) * (1 - bt * cos(th))), uP)
dimcheck(D, 'T = γT₀(1 − β cosθ)', Symbol('T', positive=True), Te * (1 - bt * cos(th)) / Te * T0 / (1 / sqrt(1 - bt ** 2)) * (1 / sqrt(1 - bt ** 2)) if False else T0 / sqrt(1 - bt ** 2) * (1 - bt * cos(th)), uP)
dpf = lambda b, thd: (lambda r: (r, 1 / r - 1))(1 / (g(b) * (1 - b * math.cos(math.radians(thd)))))
num(D, 'f/f₀ (0.5, 0°)', dpf(0.5, 0)[0], '1.7321'); num(D, 'z (0.5, 0°)', dpf(0.5, 0)[1], '-0.423'); num(D, 'f/f₀ (180°)', dpf(0.5, 180)[0], '0.5774'); num(D, 'z (180°)', dpf(0.5, 180)[1], '0.732'); num(D, 'f/f₀ (90°)', dpf(0.5, 90)[0], '0.8660'); num(D, 'z (90°)', dpf(0.5, 90)[1], '0.155'); num(D, 'f/f₀ (60°)', dpf(0.5, 60)[0], '1.1547'); num(D, 'f/f₀ (120°)', dpf(0.5, 120)[0], '0.6928')
num(D, 'f/f₀ (0.9, 0°)', dpf(0.9, 0)[0], '4.359'); num(D, 'f/f₀ (0.99)', dpf(0.99, 0)[0], '14.11'); num(D, 'f/f₀ (0.1)', dpf(0.1, 0)[0], '1.1055'); num(D, 'clásico (0.1)', 1 / (1 - 0.1), '1.1111'); zq_ = 0.158; num(D, 'β (z = 0.158)', ((1 + zq_) ** 2 - 1) / ((1 + zq_) ** 2 + 1), '0.1457'); num(D, 'β (z = 1)', ((1 + 1) ** 2 - 1) / ((1 + 1) ** 2 + 1), '0.6')
num(D, 'ángulo de f = f₀ (β = 0.5)', math.degrees(math.acos((1 - 1 / g(0.5)) / 0.5)), '74.5')
num(D, 'f/f₀ valor inicial', dpf(0.5, 0)[0], '1.732051'); num(D, 'z valor inicial', dpf(0.5, 0)[1], '-0.422650'); num(D, 'de frente valor inicial', math.sqrt(1.5 / 0.5), '1.73205'); num(D, 'transversal valor inicial', 1 / g(0.5), '0.866025')
bq2, thq = symbols('beta th', positive=True)
gq2 = 1 / sqrt(1 - bq2 ** 2)
fs(D, 'r', 1 / (gq2 * (1 - bq2 * cos(thq * pi / 180)))); fs(D, 'z', gq2 * (1 - bq2 * cos(thq * pi / 180)) - 1); fs(D, 'ap', sqrt((1 + bq2) / (1 - bq2))); fs(D, 'tr', 1 / gq2)

# ---------------------------------------------------------------- energía y momento
D = 'energia-momento'
m, E, p, T, bb = S('m E p T beta')
Gm = 1 / sqrt(1 - bb ** 2)
ident(D, 'E² − (pc)² = γ²m²c⁴(1 − β²) = m²c⁴', (Gm * m * c ** 2) ** 2 - (Gm * m * bb * c * c) ** 2, m ** 2 * c ** 4)
series_is(D, 'γ ≃ 1 + β²/2 + 3β⁴/8', 1 / sqrt(1 - Symbol('bs') ** 2), Symbol('bs'), 0, 6, 1 + Symbol('bs') ** 2 / 2 + 3 * Symbol('bs') ** 4 / 8)
ident(D, 'T = (γ − 1)mc² ≃ ½mv² + 3mv⁴/(8c²)', (R_(1, 2) * bb ** 2 + R_(3, 8) * bb ** 4) * m * c ** 2, R_(1, 2) * m * (bb * c) ** 2 + R_(3, 8) * m * (bb * c) ** 4 / c ** 2)
solves(D, 'E² = (pc)² + (mc²)² con E = T + mc² ⇒ pc = √(T² + 2Tmc²)', [Eq((T + m * c ** 2) ** 2, p ** 2 * c ** 2 + m ** 2 * c ** 4)], p, sqrt(T ** 2 + 2 * T * m * c ** 2) / c)
ident(D, 'β = pc/E', (Gm * m * bb * c * c) / (Gm * m * c ** 2), bb)
ident(D, 'γ = 1 + T/(mc²)', (T + m * c ** 2) / (m * c ** 2), 1 + T / (m * c ** 2))
# trabajo de una fuerza constante: ∫F dx = (γ − 1)mc²
Fc, mc_ = 1.0, 1.0
sol = solve_ivp(lambda tt, y: [y[1] / math.sqrt(mc_ ** 2 + (y[1] / 1.0) ** 2 / 1.0 ** 2) if False else (y[1] / math.sqrt(1.0 + y[1] ** 2)), Fc], [0, 5.0], [0.0, 0.0], rtol=1e-12, atol=1e-14)
xN, pN = sol.y[0, -1], sol.y[1, -1]
GamN = math.sqrt(1 + pN ** 2)
rec(G_STEP, D, 'fuerza constante F = dp/dt (unidades m = c = 1): trabajo F·x = (γ − 1)mc²', Fc * xN, GamN - 1, 'rel 1e-9', abs(Fc * xN / (GamN - 1) - 1) < 1e-9)
# velocidad y momento a partir de T: comprobaciones numéricas
for (mm_, Tt) in ((0.51099895, 1.0), (938.272, 1000.0), (0.51099895, 100.0)):
    Gv = 1 + Tt / mm_; pc_ = math.sqrt(Tt ** 2 + 2 * Tt * mm_); bv = pc_ / (Tt + mm_)
    rec(G_STEP, D, f'consistencia γ, β, pc (m = {mm_}, T = {Tt}): 1/√(1 − β²) = γ', 1 / math.sqrt(1 - bv ** 2), Gv, 'rel 1e-9', abs(1 / math.sqrt(1 - bv ** 2) / Gv - 1) < 1e-9)
uE = {'E': 'J', 'T': 'J', 'p': 'kg m s^-1', 'm': 'kg', 'c': 'm s^-1', 'beta': '1'}
dimcheck(D, 'E = γmc²', E, Gm * m * c ** 2, uE)
dimcheck(D, 'p = γmβc', p, Gm * m * bb * c, uE)
dimcheck(D, 'pc = √(T² + 2Tmc²)', Symbol('E', positive=True), sqrt(T ** 2 + 2 * T * m * c ** 2), uE)
dimcheck(D, 'T = (γ − 1)mc²', T, (Gm - 1) * m * c ** 2, uE)
enf = lambda m_, T_: (lambda G, pc: (G, pc / (T_ + m_), pc, T_ + m_, math.sqrt(2 * T_ / m_)))(1 + T_ / m_, math.sqrt(T_ ** 2 + 2 * T_ * m_))
me_ = 0.51099895
num(D, 'γ (e⁻, 1 MeV)', enf(me_, 1)[0], '2.9570'); num(D, 'β', enf(me_, 1)[1], '0.94108'); num(D, 'pc', enf(me_, 1)[2], '1.4220'); num(D, 'E', enf(me_, 1)[3], '1.5110'); num(D, 'v clásica/c', enf(me_, 1)[4], '1.978'); num(D, 'β (10 keV)', enf(me_, 0.01)[1], '0.195'); num(D, 'error clásico 10 keV (%)', (enf(me_, 0.01)[4] / enf(me_, 0.01)[1] - 1) * 100, '1.5', tol=0.05)
num(D, 'γ (100 MeV)', enf(me_, 100)[0], '196.7'); num(D, '1 − β (100 MeV) 10⁻⁵', (1 - enf(me_, 100)[1]) / 1e-5, '1.3')
num(D, 'γ (p, 1 GeV)', enf(938.272, 1000)[0], '2.0658'); num(D, 'β (p, 1 GeV)', enf(938.272, 1000)[1], '0.87503'); num(D, 'pc (p, 1 GeV)', enf(938.272, 1000)[2] / 1000, '1.696'); num(D, 'β (p, 1 MeV)', enf(938.272, 1)[1], '0.0461'); num(D, 'error clásico p 1 MeV (%)', (enf(938.272, 1)[4] / enf(938.272, 1)[1] - 1) * 100, '0.1', tol=0.2)
num(D, 'γ (LHC)', 1 + 7e6 / 938.272, '7461.5'); num(D, '1 − β (LHC) 10⁻⁹', 1 / (2 * (1 + 7e6 / 938.272) ** 2) / 1e-9, '9.0', tol=0.01); num(D, '1 g (10¹³ J)', 1e-3 * C ** 2 / 1e13, '9.0', tol=0.001); num(D, 'kt de TNT', 1e-3 * C ** 2 / 4.184e12, '21', tol=0.03)
num(D, 'γ valor inicial', enf(me_, 1)[0], '2.956951'); num(D, 'β valor inicial', enf(me_, 1)[1], '0.94107923'); num(D, 'pc valor inicial', enf(me_, 1)[2], '1.4219697'); num(D, 'E valor inicial', enf(me_, 1)[3], '1.5109989'); num(D, 'clásica valor inicial', enf(me_, 1)[4], '1.97836')
mq, Tq = symbols('m T', positive=True)
pcq = sqrt(Tq ** 2 + 2 * Tq * mq)
fs(D, 'g', 1 + Tq / mq); fs(D, 'b', pcq / (Tq + mq)); fs(D, 'pc', pcq); fs(D, 'E', Tq + mq); fs(D, 'cl', sqrt(2 * Tq / mq))

# ---------------------------------------------------------------- umbral
D = 'umbral-reacciones'
E1, m1, m2, Mf, p1 = S('E1 m1 m2 Mf p1')
sfix = (E1 + m2 * c ** 2) ** 2 - p1 ** 2 * c ** 2
ident(D, 's = m₁²c⁴ + m₂²c⁴ + 2E₁m₂c² con p₁²c² = E₁² − m₁²c⁴', sfix.subs(p1, sqrt(E1 ** 2 - m1 ** 2 * c ** 4) / c), m1 ** 2 * c ** 4 + m2 ** 2 * c ** 4 + 2 * E1 * m2 * c ** 2)
Tx = Symbol('Tx', positive=True)
solves(D, 's = (Σm_f)²c⁴ ⇒ T = [(Σm_f)² − (m₁+m₂)²]c²/(2m₂)', [Eq(m1 ** 2 * c ** 4 + m2 ** 2 * c ** 4 + 2 * (Tx + m1 * c ** 2) * m2 * c ** 2, Mf ** 2 * c ** 4)], Tx, (Mf ** 2 - (m1 + m2) ** 2) * c ** 2 / (2 * m2))
solves(D, 'colisionador simétrico: (2E)² = (Σm_f)²c⁴ ⇒ T = Σm_fc²/2 − m₁c²', [Eq((2 * (Tx + m1 * c ** 2)) ** 2, Mf ** 2 * c ** 4)], Tx, Mf * c ** 2 / 2 - m1 * c ** 2)
ident(D, 'T/Q = (Σm_f + m₁ + m₂)/(2m₂) con Q = (Σm_f − m₁ − m₂)c²', (Mf ** 2 - (m1 + m2) ** 2) / (2 * m2) / (Mf - m1 - m2), (Mf + m1 + m2) / (2 * m2))
mp_ = 938.272088
ident(D, 'p + p → p + p + p + p̄: T_umbral = 6m_pc²', (16 * m1 ** 2 - 4 * m1 ** 2) / (2 * m1), 6 * m1)
# comprobación con cuadrivectores: en el umbral los productos quedan en reposo en el CM (β_cm = p/(E + m₂))
def umbral_check(ma, mb, mF):
    Tt = (mF ** 2 - (ma + mb) ** 2) / (2 * mb); Ea = Tt + ma; pa = math.sqrt(Ea ** 2 - ma ** 2)
    Etot = Ea + mb; bcm = pa / Etot; Ecm = math.sqrt(Etot ** 2 - pa ** 2)
    return Tt, bcm, Ecm, Etot / Ecm
for (ma, mb, mF) in ((mp_, mp_, 4 * mp_), (mp_, mp_, 2 * mp_ + 134.9768), (0.51099895, 0.51099895, 2 * 105.6583755)):
    Tt, bcm, Ecm, gcm = umbral_check(ma, mb, mF)
    rec(G_STEP, D, f'cuadrivectores: energía en el CM igual a Σm_f en el umbral (m₁={ma:.3f}, Σm_f={mF:.3f})', Ecm, mF, 'rel 1e-8', abs(Ecm / mF - 1) < 1e-8)
    rec(G_STEP, D, f'los productos viajan con la velocidad del CM: γ_cm = (E + m₂)/Σm_f (Σm_f={mF:.3f})', gcm, (Tt + ma + mb) / mF, 'rel 1e-8', abs(gcm / ((Tt + ma + mb) / mF) - 1) < 1e-8)
uU = {'s': 'J^2', 'm1': 'kg', 'm2': 'kg', 'Mf': 'kg', 'T': 'J', 'E1': 'J', 'c': 'm s^-1', 'Tx': 'J'}
dimcheck(D, 's = m₁²c⁴ + m₂²c⁴ + 2E₁m₂c²', Symbol('s', positive=True), m1 ** 2 * c ** 4 + m2 ** 2 * c ** 4 + 2 * E1 * m2 * c ** 2, uU)
dimcheck(D, 'T = [(Σm_f)² − (m₁+m₂)²]c²/(2m₂)', Tx, (Mf ** 2 - (m1 + m2) ** 2) * c ** 2 / (2 * m2), uU)
dimcheck(D, 'T_colisionador = Σm_fc²/2 − m₁c²', Tx, Mf * c ** 2 / 2 - m1 * c ** 2, uU)
umf = lambda m1_, m2_, Mf_: ((Mf_ ** 2 - (m1_ + m2_) ** 2) / (2 * m2_), 1 + (Mf_ ** 2 - (m1_ + m2_) ** 2) / (2 * m2_ * m1_), (Mf_ + m1_ + m2_) / (2 * m2_), Mf_ / 2 - m1_)
num(D, 'T umbral p̄ (MeV)', umf(mp_, mp_, 4 * mp_)[0], '5629.6'); num(D, 'γ', umf(mp_, mp_, 4 * mp_)[1], '7.000'); num(D, 'T/Q', umf(mp_, mp_, 4 * mp_)[2], '3.000'); num(D, 'T por haz (colisionador)', umf(mp_, mp_, 4 * mp_)[3], '938.3'); num(D, 'Q (MeV)', 4 * mp_ - 2 * mp_, '1876.5')
num(D, 'T umbral π⁰ (MeV)', umf(mp_, mp_, 2 * mp_ + 134.9768)[0], '279.7'); num(D, 'γ (π⁰)', umf(mp_, mp_, 2 * mp_ + 134.9768)[1], '1.298'); num(D, 'T umbral 3π (MeV)', umf(mp_, mp_, 2 * mp_ + 3 * 139.57)[0], '930.8')
num(D, 'T e⁺ → μ⁺μ⁻ (GeV)', umf(0.51099895, 0.51099895, 2 * 105.6583755)[0] / 1000, '43.69'); num(D, 'T colisionador μμ (MeV)', umf(0.51099895, 0.51099895, 2 * 105.6583755)[3], '105.1'); num(D, 'cociente', umf(0.51099895, 0.51099895, 2 * 105.6583755)[0] / umf(0.51099895, 0.51099895, 2 * 105.6583755)[3], '416', tol=1e-3)
num(D, 'Higgs, blanco fijo (TeV)', umf(0.938272088, 0.938272088, 2 * 0.938272088 + 125.0)[0] / 1000, '8.6', tol=0.01)
num(D, 'T valor inicial', umf(938.272088, 938.272088, 3753.088352)[0], '5629.63'); num(D, 'γ valor inicial', umf(938.272088, 938.272088, 3753.088352)[1], '7'); num(D, 'T/Q valor inicial', umf(938.272088, 938.272088, 3753.088352)[2], '3'); num(D, 'colisionador valor inicial', umf(938.272088, 938.272088, 3753.088352)[3], '938.272')
m1q, m2q, Mfq = symbols('m1 m2 Mf', positive=True)
fs(D, 'Tf', (Mfq ** 2 - (m1q + m2q) ** 2) / (2 * m2q)); fs(D, 'gb', 1 + (Mfq ** 2 - (m1q + m2q) ** 2) / (2 * m2q * m1q)); fs(D, 'ra', (Mfq + m1q + m2q) / (2 * m2q)); fs(D, 'Tc', Mfq / 2 - m1q)
