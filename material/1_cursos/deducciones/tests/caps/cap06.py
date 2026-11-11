# -*- coding: utf-8 -*-
"""Capítulo 6 — Dinámica de la partícula."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, tan, atan, tanh, cosh, atanh, Function, simplify, solve, oo

EX = {'plano-inclinado': 'inclinado', 'atwood': 'atwood', 'arrastre-lineal': 'lineal', 'arrastre-cuadratico': 'cuadratico', 'cohete': 'cohete', 'cabestrante': 'cabestrante'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
g, m, t = S('g m t')

# ---------------------------------------------------------------- plano inclinado
D = 'plano-inclinado'
th, mu, L, a, N = S('theta mu L a N')
Ny = Symbol('Ny', positive=True)
solves(D, 'eje normal: N − mg cosθ = 0', [Eq(N - m * g * cos(th), 0)], N, m * g * cos(th))
solves(D, 'eje del plano: ma = mg senθ − μ mg cosθ', [Eq(m * a, m * g * sin(th) - mu * m * g * cos(th))], a, g * (sin(th) - mu * cos(th)))
ident(D, 'la masa se cancela', (m * g * sin(th) - mu * m * g * cos(th)) / m, g * (sin(th) - mu * cos(th)))
ident(D, 'umbral: a = 0 ⇔ tanθ = μ', (sin(th) - mu * cos(th)).subs(mu, tan(th)), 0)
aa_ = g * (sin(th) - mu * cos(th))
ident(D, 't = √(2L/a) desde L = ½at²', (aa_ * (sqrt(2 * L / aa_)) ** 2 / 2), L)
ident(D, 'v = √(2aL) = at', sqrt(2 * aa_ * L) ** 2, (aa_ * sqrt(2 * L / aa_)) ** 2)
ident(D, 'θ → 90°: a = g', aa_.subs({th: pi / 2}), g)
ident(D, 'da/dμ = −g cosθ', diff(aa_, mu), -g * cos(th))
u_ = {'a': 'm s^-2', 'theta': 'rad', 'mu': '1', 'g': 'm s^-2', 'm': 'kg', 'N': 'N', 'L': 'm', 't': 's'}
dimcheck(D, 'a = g(senθ − μ cosθ)', a, aa_, u_)
dimcheck(D, 'N = mg cosθ', N, m * g * cos(th), u_)
dimcheck(D, 't = √(2L/a)', t, sqrt(2 * L / aa_), u_)
dimcheck(D, 'v = √(2aL)', Symbol('v', positive=True), sqrt(2 * aa_ * L), dict(u_, v='m s^-1'))
inc = lambda thd, mu_, L_=2.0, g_=9.81: (lambda a_: (a_, math.sqrt(2 * L_ / a_), math.sqrt(2 * a_ * L_)))(g_ * (math.sin(math.radians(thd)) - mu_ * math.cos(math.radians(thd))))
for (thd, mu_), (va, vt_, vv_) in (((30, 0.2), ('3.206', '1.117', '3.581')),):
    r_ = inc(thd, mu_); num(D, 'a (30°, 0.2)', r_[0], va); num(D, 't (30°, 0.2)', r_[1], vt_); num(D, 'v (30°, 0.2)', r_[2], vv_)
num(D, 'a sin rozamiento', inc(30, 0)[0], '4.905'); num(D, 't sin rozamiento', inc(30, 0)[1], '0.903'); num(D, 'a (30°, 0.35)', inc(30, 0.35)[0], '1.932'); num(D, 't (30°, 0.35)', inc(30, 0.35)[1], '1.439')
num(D, 'da/dμ a 30°', 9.81 * math.cos(math.radians(30)), '8.50'); num(D, 'a (45°)', inc(45, 0.2)[0], '5.549'); num(D, 't (45°)', inc(45, 0.2)[1], '0.849'); num(D, 'a (60°)', inc(60, 0.2)[0], '7.515'); num(D, 't (60°)', inc(60, 0.2)[1], '0.730')
num(D, 'θ crítico μ = 0.2', math.degrees(math.atan(0.2)), '11.31'); num(D, 'θ crítico μ = 0.5', math.degrees(math.atan(0.5)), '26.57')
num(D, 'a valor inicial', inc(30, 0.2)[0], '3.2059'); num(D, 't valor inicial', inc(30, 0.2)[1], '1.1170'); num(D, 'v valor inicial', inc(30, 0.2)[2], '3.5810'); num(D, 'N/mg', math.cos(math.radians(30)), '0.86603'); num(D, 'a (60°)', inc(60, 0.2)[0], '7.5147'); num(D, 't (60°)', inc(60, 0.2)[1], '0.7296')
thp, mup, Lp, gp = symbols('th mu L g', positive=True)
tr = thp * pi / 180
ai = gp * (sin(tr) - mup * cos(tr))
fs(D, 'a', ai); fs(D, 't', sqrt(2 * Lp / ai)); fs(D, 'v', sqrt(2 * Lp * ai)); fs(D, 'N', cos(tr)); fs(D, 'thc', atan(mup) * 180 / pi)

# ---------------------------------------------------------------- Atwood
D = 'atwood'
m1, m2, M, T1, T2, a = S('m1 m2 M T1 T2 a')
eqs = [Eq(m1 * g - T1, m1 * a), Eq(T2 - m2 * g, m2 * a), Eq(T1 - T2, M * a / 2)]
sol = sp.solve(eqs, [a, T1, T2], dict=True)[0]
rec(G_STEP, D, 'sistema de tres ecuaciones: a', 1.0, 1.0, 'solución exacta', same(sol[a], (m1 - m2) * g / (m1 + m2 + M / 2))[0])
rec(G_STEP, D, 'sistema de tres ecuaciones: T₁', 1.0, 1.0, 'solución exacta', same(sol[T1], m1 * (g - (m1 - m2) * g / (m1 + m2 + M / 2)))[0])
rec(G_STEP, D, 'sistema de tres ecuaciones: T₂', 1.0, 1.0, 'solución exacta', same(sol[T2], m2 * (g + (m1 - m2) * g / (m1 + m2 + M / 2)))[0])
ident(D, 'M → 0: T = 2m₁m₂g/(m₁+m₂)', (m1 * (g - (m1 - m2) * g / (m1 + m2))), 2 * m1 * m2 * g / (m1 + m2))
ident(D, 'M → 0: T₁ = T₂', (m1 * (g - (m1 - m2) * g / (m1 + m2))), (m2 * (g + (m1 - m2) * g / (m1 + m2))))
ident(D, 'm₂ → 0: a = g', ((m1 - m2) * g / (m1 + m2)).subs(m2, 0), g)
ident(D, 'T₁ − T₂ = Ma/2', (m1 * (g - (m1 - m2) * g / (m1 + m2 + M / 2))) - (m2 * (g + (m1 - m2) * g / (m1 + m2 + M / 2))), M / 2 * (m1 - m2) * g / (m1 + m2 + M / 2))
ua = {'m1': 'kg', 'm2': 'kg', 'M': 'kg', 'a': 'm s^-2', 'g': 'm s^-2', 'T1': 'N', 'T2': 'N'}
aw = (m1 - m2) * g / (m1 + m2 + M / 2)
dimcheck(D, 'a', a, aw, ua); dimcheck(D, 'T₁ = m₁(g − a)', T1, m1 * (g - aw), ua); dimcheck(D, 'T₂ = m₂(g + a)', T2, m2 * (g + aw), ua); dimcheck(D, 'T₁ − T₂ = Ma/2', T1 - T2, M * aw / 2, ua)
atw = lambda m1_, m2_, M_=0.0: (lambda a_: (a_, m1_ * (9.81 - a_), m2_ * (9.81 + a_)))((m1_ - m2_) * 9.81 / (m1_ + m2_ + M_ / 2))
num(D, 'a (2,1,0)', atw(2, 1)[0], '3.27'); num(D, 'T (2,1,0)', atw(2, 1)[1], '13.08'); num(D, 'a (2,1,1)', atw(2, 1, 1)[0], '2.803'); num(D, 'T₁ (2,1,1)', atw(2, 1, 1)[1], '14.014'); num(D, 'T₂ (2,1,1)', atw(2, 1, 1)[2], '12.613')
num(D, 'frenado por la polea (%)', (1 - atw(2, 1, 1)[0] / atw(2, 1)[0]) * 100, '14'); num(D, 'a (1.1,1)', atw(1.1, 1)[0], '0.467'); num(D, 'T (1.1,1)', atw(1.1, 1)[1], '10.277'); num(D, 'a (5,1)', atw(5, 1)[0], '6.54'); num(D, 'T (5,1)', atw(5, 1)[1], '16.35')
num(D, 'a valor inicial', atw(2, 1)[0], '3.2700'.rstrip('0') if False else '3.27'); num(D, 'a (2,1,1) 4 cifras', atw(2, 1, 1)[0], '2.8029')
m1p, m2p, Mp, gp = symbols('m1 m2 M g', positive=True)
ap = (m1p - m2p) * gp / (m1p + m2p + Mp / 2)
fs(D, 'a', ap); fs(D, 'T1', m1p * (gp - ap)); fs(D, 'T2', m2p * (gp + ap))

# ---------------------------------------------------------------- arrastre lineal
D = 'arrastre-lineal'
b, vt, tau, y = S('b vt tau y')
v = Function('v')
vsol = m * g / b * (1 - exp(-b * t / m))
ode(D, 'v(t) resuelve m dv/dt = mg − bv', Eq(m * v(t).diff(t), m * g - b * v(t)), Eq(v(t), vsol))
ident(D, 'v(0) = 0', vsol.subs(t, 0), 0)
tp = Symbol('tp', positive=True)
ys = integrate(vsol.subs(t, tp), (tp, 0, t))
ident(D, 'y = v_t[t − τ(1 − e^(−t/τ))]', ys, (m * g / b) * (t - (m / b) * (1 - exp(-t * b / m))))
ident(D, 'dy/dt = v', diff((m * g / b) * (t - (m / b) * (1 - exp(-t * b / m))), t), vsol)
series_is(D, 'caída libre: v ≈ gt para t ≪ τ', vsol, t, 0, 2, g * t)
series_is(D, 'caída libre: y ≈ ½gt² para t ≪ τ', (m * g / b) * (t - (m / b) * (1 - exp(-t * b / m))), t, 0, 3, g * t ** 2 / 2)
_lim = float(sp.limit(vsol.subs({m: 80, g: 9.81, b: 20}), t, oo))
rec(G_STEP, D, 'v → v_t = mg/b para t → ∞', _lim, 39.24, 'abs 1e-9', abs(_lim - 39.24) < 1e-9)
ul = {'m': 'kg', 'b': 'kg s^-1', 'g': 'm s^-2', 'vt': 'm s^-1', 'tau': 's', 't': 's', 'y': 'm', 'v': 'm s^-1'}
dimcheck(D, 'v_t = mg/b', vt, m * g / b, ul); dimcheck(D, 'τ = m/b', tau, m / b, ul); dimcheck(D, 'v(t)', Symbol('v', positive=True), vsol, ul)
dimcheck(D, 'y(t)', y, (m * g / b) * (t - (m / b) * (1 - exp(-t * b / m))), ul)
vl = lambda m_, b_, t_: ((m_ * 9.81 / b_) * (1 - math.exp(-t_ * b_ / m_)), (m_ * 9.81 / b_) * (t_ - (m_ / b_) * (1 - math.exp(-t_ * b_ / m_))))
num(D, 'v_t (80, 20)', 80 * 9.81 / 20, '39.24'); num(D, 'τ', 4.0, '4'); num(D, 'v(5 s)', vl(80, 20, 5)[0], '27.998'); num(D, 'v(5)/v_t (%)', vl(80, 20, 5)[0] / 39.24 * 100, '71'); num(D, 'y(5 s)', vl(80, 20, 5)[1], '84.21')
num(D, 'v(1 s)', vl(80, 20, 1)[0], '8.680'); num(D, 'y(1 s)', vl(80, 20, 1)[1], '4.521'); num(D, 'v a 3τ (%)', (1 - math.exp(-3)) * 100, '95'); num(D, 'v a 5τ (%)', (1 - math.exp(-5)) * 100, '99.3')
r_, eta_, rho_ = 1e-4, 1.81e-5, 1000.0; mm_ = 4 / 3 * math.pi * r_ ** 3 * rho_; bb_ = 6 * math.pi * eta_ * r_
num(D, 'v_t gota', mm_ * 9.81 / bb_, '1.204'); num(D, 'τ gota', mm_ / bb_, '0.1228'); num(D, 'v_t gota (2 cifras)', mm_ * 9.81 / bb_, '1.20'); num(D, 'τ gota (3 cifras)', mm_ / bb_, '0.123')
num(D, 'v valor inicial', vl(80, 20, 5)[0], '27.998'); num(D, 'y valor inicial', vl(80, 20, 5)[1], '84.210')
mq, bq, tq, gq = symbols('m b t g', positive=True)
tau_ = mq / bq
fs(D, 'v', mq * gq / bq * (1 - exp(-tq / tau_))); fs(D, 'y', (mq * gq / bq) * (tq - tau_ * (1 - exp(-tq / tau_)))); fs(D, 'vt', mq * gq / bq); fs(D, 'ta', tau_)

# ---------------------------------------------------------------- arrastre cuadrático
D = 'arrastre-cuadratico'
k, vt, rho, cda = S('k vt rho cda')
vq = Function('v')
vs_ = vt * tanh(g * t / vt)
ode(D, 'v = v_t tanh(gt/v_t) resuelve dv/dt = g(1 − v²/v_t²)', Eq(vq(t).diff(t), g * (1 - vq(t) ** 2 / vt ** 2)), Eq(vq(t), vs_))
ident(D, 'mg − kv² = mg(1 − v²/v_t²) con k = mg/v_t²', m * g - (m * g / vt ** 2) * Symbol('vv', positive=True) ** 2, m * g * (1 - Symbol('vv', positive=True) ** 2 / vt ** 2))
ident(D, 'v_t = √(2mg/(ρ C_D A))', sqrt(m * g / (rho * cda / 2)), sqrt(2 * m * g / (rho * cda)))
uu = Symbol('uu', positive=True)
integral(D, '∫₀^x du/(1−u²) = artanh x (x = 0.5)', 1 / (1 - uu ** 2), uu, 0, R_(1, 2), atanh(R_(1, 2)))
ident(D, 'v(t) = v_t tanh(gt/v_t) ⇒ (v_t/g) artanh(v/v_t) = t', vt / g * atanh(vs_ / vt), t)
tp = Symbol('tp', positive=True)
ident(D, 'dy/dt = v con y = (v_t²/g) ln cosh(gt/v_t)', diff(vt ** 2 / g * log(cosh(g * t / vt)), t), vs_)
series_is(D, 'v ≈ gt para t pequeño', vs_, t, 0, 4, g * t - g ** 3 * t ** 3 / (3 * vt ** 2))
series_is(D, 'y ≈ ½gt² para t pequeño', vt ** 2 / g * log(cosh(g * t / vt)), t, 0, 5, g * t ** 2 / 2 - g ** 3 * t ** 4 / (12 * vt ** 2))
_df = float(mp.log(mp.cosh(mp.mpf(9.81) * 100 / 40)) * 40 ** 2 / 9.81 - (40 * 100 - 40 ** 2 / 9.81 * mp.log(2)))
rec(G_STEP, D, 'y ≈ v_t t − (v_t²/g) ln 2 para t grande (t = 100 s)', _df, 0.0, 'abs 1e-9', abs(_df) < 1e-9)
uq = {'m': 'kg', 'rho': 'kg m^-3', 'cda': 'm^2', 'g': 'm s^-2', 'vt': 'm s^-1', 'v': 'm s^-1', 't': 's', 'y': 'm'}
dimcheck(D, 'v_t = √(2mg/(ρ C_D A))', vt, sqrt(2 * m * g / (rho * cda)), uq); dimcheck(D, 'v(t)', Symbol('v', positive=True), vs_, uq)
dimcheck(D, 'y(t)', y, vt ** 2 / g * log(cosh(g * t / vt)), uq)
def quad(m_, cda_, t_, rho_=1.225, g_=9.81):
    vt_ = math.sqrt(2 * m_ * g_ / (rho_ * cda_)); return vt_, vt_ * math.tanh(g_ * t_ / vt_), vt_ ** 2 / g_ * math.log(math.cosh(g_ * t_ / vt_)), vt_ / g_
num(D, 'v_t', quad(80, 0.7, 5)[0], '42.78'); num(D, 'v_t (km/h)', quad(80, 0.7, 5)[0] * 3.6, '154'); num(D, 'v_t/g', quad(80, 0.7, 5)[3], '4.361'); num(D, 'v(5)', quad(80, 0.7, 5)[1], '34.94'); num(D, 'y(5)', quad(80, 0.7, 5)[2], '102.5')
num(D, 'v(10)', quad(80, 0.7, 10)[1], '41.92'); num(D, 'y(10)', quad(80, 0.7, 10)[2], '300.4'); num(D, 'v a 3 t_c (%)', quad(80, 0.7, 3 * quad(80, 0.7, 1)[3])[1] / quad(80, 0.7, 1)[0] * 100, '99.5')
num(D, 'v_t (C_DA = 0.2)', quad(80, 0.2, 5)[0], '80.04'); num(D, 'v_t (km/h, 0.2)', quad(80, 0.2, 5)[0] * 3.6, '288'); num(D, 'v_t con doble masa (%)', (quad(160, 0.7, 5)[0] / quad(80, 0.7, 5)[0] - 1) * 100, '41'); num(D, 'v_t con ρ/4', quad(80, 0.7, 5, 1.225 / 4)[0] / quad(80, 0.7, 5)[0], '2')
num(D, 'v_t en agua', quad(80, 0.7, 5, 1000.0)[0], '1.497'); num(D, 'v_t/g en agua', quad(80, 0.7, 5, 1000.0)[3], '0.153')
num(D, 'v_t valor inicial', quad(80, 0.7, 5)[0], '42.784'); num(D, 'v(5) valor inicial', quad(80, 0.7, 5)[1], '34.936'); num(D, 'y(5) valor inicial', quad(80, 0.7, 5)[2], '102.53'); num(D, 'v_t/g valor inicial', quad(80, 0.7, 5)[3], '4.3612'); num(D, 'v_t con 0.2 (5 cifras)', quad(80, 0.2, 5)[0], '80.041')
mq, cq, rq, tq, gq = symbols('m cda rho t g', positive=True)
vtq = sqrt(2 * mq * gq / (rq * cq))
fs(D, 'vt', vtq); fs(D, 'v', vtq * tanh(gq * tq / vtq)); fs(D, 'y', vtq ** 2 / gq * log(cosh(gq * tq / vtq))); fs(D, 'tc', vtq / gq)

# ---------------------------------------------------------------- cohete
D = 'cohete'
ve, m0, mf, tb, dv, dm, Isp, R = S('ve m0 mf tb dv dm Isp R')
vv = Symbol('vv', positive=True)
mdv = symbols('mdv')
ident(D, 'conservación de momento: m dv + v_e dm + dm dv = 0 tras desarrollar', sp.expand((m + dm) * (vv + dv) - dm * (vv - ve) - m * vv), m * dv + ve * dm + dm * dv)
mm = Symbol('mm', positive=True)
integral(D, 'Δv = −v_e ∫_{m₀}^{m_f} dm/m = v_e ln(m₀/m_f)', -ve / mm, mm, m0, mf, ve * log(m0 / mf))
vfun = Function('v')
mt = m0 - Symbol('mdot', positive=True) * t
ode(D, 'con gravedad: v(t) = v_e ln(m₀/m(t)) − gt resuelve m v′ = −v_e m′ − mg', Eq(mt * vfun(t).diff(t), ve * diff(-mt, t) * 1 * (-1) * (-1) - mt * g) if False else Eq(mt * vfun(t).diff(t), ve * Symbol('mdot', positive=True) - mt * g), Eq(vfun(t), ve * log(m0 / mt) - g * t))
ident(D, 'v_e = I_sp g₀', Isp * sp.Float('9.80665', 30) / sp.Float('9.80665', 30), Isp)
ident(D, 'm₀/m_f = 1/(1 − f)', 1 / (1 - (1 - 1 / R)), R)
uc = {'dv': 'm s^-1', 've': 'm s^-1', 'R': '1', 'tb': 's', 'g': 'm s^-2', 'Isp': 's', 'g0': 'm s^-2', 'm0': 'kg', 'mf': 'kg'}
dimcheck(D, 'Δv = v_e ln(m₀/m_f)', dv, ve * log(m0 / mf), uc)
dimcheck(D, 'Δv con gravedad', dv, ve * log(m0 / mf) - g * tb, uc)
dimcheck(D, 'v_e = I_sp g₀', ve, Isp * Symbol('g0', positive=True), uc)
rk = lambda Isp_, R_, tb_, g_=9.81: (Isp_ * 9.80665 * math.log(R_), Isp_ * 9.80665 * math.log(R_) - g_ * tb_, 1 - 1 / R_, Isp_ * 9.80665)
num(D, 'v_e (300 s)', rk(300, 10, 120)[3], '2942'); num(D, 'Δv (R=2)', rk(300, 2, 100)[0], '2039'); num(D, 'Δv (R=5)', rk(300, 5, 120)[0], '4735'); num(D, 'Δv (R=10)', rk(300, 10, 120)[0], '6774'); num(D, 'Δv (R=20)', rk(300, 20, 120)[0], '8813')
num(D, 'pérdida por gravedad', 9.81 * 120, '1177'); num(D, 'Δv con gravedad (R=10)', rk(300, 10, 120)[1], '5597'); num(D, 'v_e ln 2', 2941.995 * math.log(2), '2039'); num(D, 'Δv (450 s, R=10)', rk(450, 10, 300)[0], '10161')
num(D, 'R necesario para 9.4 km/s', math.exp(9400 / 2941.995), '24.4'); num(D, 'fracción de propelente para R = 24.4', 1 - 1 / 24.4, '0.96', tol=1e-2)
num(D, 'v_e valor inicial', rk(300, 10, 120)[3], '2941.995'); num(D, 'Δv valor inicial', rk(300, 10, 120)[0], '6774.2'); num(D, 'Δv_g valor inicial', rk(300, 10, 120)[1], '5597.0'); num(D, 'n_R = 1/ln R', 1 / math.log(10), '0.434')
Ip, Rp, tbp, gp = symbols('Isp R tb g', positive=True)
g0 = sp.Float('9.80665', 40)
fs(D, 've', Ip * g0); fs(D, 'dv', Ip * g0 * log(Rp)); fs(D, 'dvg', Ip * g0 * log(Rp) - gp * tbp); fs(D, 'pf', 1 - 1 / Rp)

# ---------------------------------------------------------------- cabestrante
D = 'cabestrante'
T, phi, mu_, T1, T2, dT, dphi = S('T phi mu T1 T2 dT dphi')
ident(D, 'dN = T sen(dφ/2) + (T+dT) sen(dφ/2) ≈ T dφ (primer orden)', sp.series(T * sin(dphi / 2) + (T + dT) * sin(dphi / 2), dphi, 0, 2).removeO().subs(dT, 0), T * dphi)
Tf = Function('T')
ode(D, 'T(φ) = T₁ e^(μφ) resuelve dT/dφ = μT', Eq(Tf(phi).diff(phi), mu_ * Tf(phi)), Eq(Tf(phi), T1 * exp(mu_ * phi)))
Tt = Symbol('Tt', positive=True)
integral(D, '∫_{T₁}^{T₂} dT/T = ln(T₂/T₁)', 1 / Tt, Tt, T1, T2, log(T2 / T1))
solves(D, 'ln(T₂/T₁) = μφ → T₂ = T₁e^(μφ)', [Eq(log(T2 / T1), mu_ * phi)], T2, T1 * exp(mu_ * phi))
ident(D, 'una vuelta multiplica por e^(2πμ)', (exp(mu_ * (phi + 2 * pi)) / exp(mu_ * phi)), exp(2 * pi * mu_))
uk = {'T1': 'N', 'T2': 'N', 'mu': '1', 'phi': 'rad'}
dimcheck(D, 'T₂ = T₁ e^(μφ)', T2, T1 * exp(mu_ * phi), uk); dimcheck(D, 'T₁ = T₂ e^(−μφ)', T1, T2 * exp(-mu_ * phi), uk)
for mu_v, n_v, vv_ in ((0.3, 0.5, '2.566'), (0.3, 1, '6.586'), (0.3, 3, '285.7'), (0.5, 2, '535.5'), (0.1, 1, '1.874')):
    num(D, f'T₂/T₁ (μ = {mu_v}, n = {n_v})', math.exp(mu_v * 2 * math.pi * n_v), vv_)
num(D, 'T₁ (1000 N, μ = 0.3, 3 vueltas)', 1000 * math.exp(-0.3 * 6 * math.pi), '3.50'); num(D, 'T₂/T₁ valor inicial', math.exp(0.3 * 6 * math.pi), '285.68'); num(D, 'T₁ valor inicial', 1000 * math.exp(-0.3 * 6 * math.pi), '3.5004')
num(D, 'n_μ = μφ', 0.3 * 6 * math.pi, '5.65')
mup, np_, Wp = symbols('mu n W', positive=True)
fs(D, 'ra', exp(mup * 2 * pi * np_)); fs(D, 'T1', Wp * exp(-mup * 2 * pi * np_))
