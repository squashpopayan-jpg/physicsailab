# -*- coding: utf-8 -*-
"""Capítulo 4 — Ecuaciones diferenciales y funciones especiales."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, oo, diff, integrate, sin, cos, atan, atan2, legendre, Function, Derivative, limit, I, re, im, Abs, conjugate, factorial
import mpmath as mp
from scipy.special import eval_legendre, jv, jn_zeros, sici

EX = {'relax': 'relax', 'oscilador-edo2': 'amort', 'forzado-fasorial': 'forzado', 'fourier': 'fourier-onda', 'legendre-pl': 'legendre-pl', 'bessel-tambor': 'bessel-tambor'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
fp_ = lambda D_, *a, **k: fsim_py(EX.get(D_, D_), *a, deriv=D_, **k)

# ---------------------------------------------------------------- relajación
D = 'relax'
t, tau, T0, Te = S('t tau T0 Te')
Tf = Function('T')
Tsol = Te + (T0 - Te) * exp(-t / tau)
eq = Eq(Tf(t).diff(t), -(Tf(t) - Te) / tau)
ode(D, 'T(t) resuelve dT/dt = −(T − Te)/τ', eq, Eq(Tf(t), Tsol))
dsolve_is(D, 'dsolve con T(0) = T0', eq, Tf(t), {Tf(0): T0}, Tsol)
ident(D, 'condición inicial T(0) = T0', Tsol.subs(t, 0), T0)
mu = exp(t / tau)
ident(D, 'factor integrante: (μT)′ = μ Te/τ', diff(mu * Tsol, t), mu * Te / tau)
u_ = Function('u')
ode(D, 'u = T − Te: du/dt = −u/τ', Eq(u_(t).diff(t), -u_(t) / tau), Eq(u_(t), (T0 - Te) * exp(-t / tau)))
integral(D, '∫du/u = −t/τ (límites u0 → u)', 1 / Symbol('uu', positive=True), Symbol('uu', positive=True), Symbol('u0', positive=True), Symbol('u0', positive=True) * exp(-t / tau), -t / tau)
solves(D, 'mitad: e^(−t/τ) = 1/2 → t = τ ln 2', [Eq(exp(-t / tau), R_(1, 2))], t, tau * log(2))
solves(D, '1 %: e^(−t/τ) = 1/100 → t = τ ln 100', [Eq(exp(-t / tau), R_(1, 100))], t, tau * log(100))
dimcheck(D, 'T(t) = Te + (T0 − Te)e^(−t/τ)', Symbol('Tt', positive=True), Tsol, {'Tt': 'K', 'Te': 'K', 'T0': 'K', 'tau': 's', 't': 's'})
dimcheck(D, 'dT/dt = −(T0 − Te)e^(−t/τ)/τ', Symbol('Td', positive=True), (T0 - Te) * exp(-t / tau) / tau, {'Td': 'K s^-1', 'Te': 'K', 'T0': 'K', 'tau': 's', 't': 's'})
Tn = lambda T0v, Tev, tv, tauv: Tev + (T0v - Tev) * math.exp(-tv / tauv)
num(D, 'T(10 min)', Tn(90, 20, 10, 10), '45.75'); num(D, 'T(30 min)', Tn(90, 20, 30, 10), '23.49'); num(D, 'T(15 min)', Tn(90, 20, 15, 10), '35.62')
num(D, 'fracción restante a τ (%)', math.exp(-1) * 100, '36.8'); num(D, 'fracción restante a 3τ (%)', math.exp(-3) * 100, '5.0')
num(D, 'dT/dt (15 min)', -(70) * math.exp(-1.5) / 10, '-1.562'); num(D, 't½', 10 * math.log(2), '6.931'); num(D, 't99', 10 * math.log(100), '46.05')
num(D, 'T(15 min, τ = 20)', Tn(90, 20, 15, 20), '53.07'); num(D, 'T(46.05 min)', Tn(90, 20, 46.05, 10), '20.70')
num(D, 'T valor inicial', Tn(90, 20, 15, 10), '35.619'); num(D, 'dT/dt valor inicial', -70 * math.exp(-1.5) / 10, '-1.5619'); num(D, 't½ valor inicial', 10 * math.log(2), '6.9315'); num(D, 't99 valor inicial', 10 * math.log(100), '46.052')
T0p, Tep, taup, tp = symbols('T0 Te tau t', positive=True)
fs(D, 'T', Tep + (T0p - Tep) * exp(-tp / taup)); fs(D, 'rate', -(T0p - Tep) * exp(-tp / taup) / taup)
fs(D, 'th', taup * log(2)); fs(D, 't99', taup * log(100))

# ---------------------------------------------------------------- oscilador amortiguado
D = 'oscilador-edo2'
g, wd, w0, x0, v0, C1, C2 = S('g wd w0 x0 v0 C1 C2')
xf = Function('x')
ode2 = lambda w02: Eq(xf(t).diff(t, 2) + 2 * g * xf(t).diff(t) + w02 * xf(t), 0)
ode(D, 'subamortiguado: e^(−γt)(C1 cos ω_d t + C2 sen ω_d t)', ode2(wd ** 2 + g ** 2), Eq(xf(t), exp(-g * t) * (C1 * cos(wd * t) + C2 * sin(wd * t))))
ode(D, 'crítico: (C1 + C2 t)e^(−γt) con ω₀ = γ', ode2(g ** 2), Eq(xf(t), (C1 + C2 * t) * exp(-g * t)))
rp_, rm_ = -g + sqrt(g ** 2 - w0 ** 2), -g - sqrt(g ** 2 - w0 ** 2)
ode(D, 'sobreamortiguado: C₊e^(r₊t) + C₋e^(r₋t)', ode2(w0 ** 2), Eq(xf(t), C1 * exp(rp_ * t) + C2 * exp(rm_ * t)))
r_ = Symbol('r')
solves(D, 'ecuación característica: r = −γ ± √(γ²−ω₀²)', [Eq(r_ ** 2 + 2 * g * r_ + w0 ** 2, 0)], r_, -g + sqrt(g ** 2 - w0 ** 2))
ident(D, 'sustituir e^(rt): (r² + 2γr + ω₀²)e^(rt)', (diff(exp(r_ * t), t, 2) + 2 * g * diff(exp(r_ * t), t) + w0 ** 2 * exp(r_ * t)), (r_ ** 2 + 2 * g * r_ + w0 ** 2) * exp(r_ * t))
xs = exp(-g * t) * (x0 * cos(wd * t) + (v0 + g * x0) / wd * sin(wd * t))
ident(D, 'x(0) = x₀', xs.subs(t, 0), x0); ident(D, 'ẋ(0) = v₀', diff(xs, t).subs(t, 0), v0)
Td = 2 * pi / wd
ident(D, 'cociente de máximos sucesivos: x(t+T_d)/x(t) = e^(−γT_d)', (xs.subs(t, t + Td)) / xs, exp(-g * Td))
ident(D, 'ω_d² = ω₀² − γ²', sqrt(w0 ** 2 - (w0 / 2) ** 2) ** 2, w0 ** 2 * R_(3, 4))
crit = (1 + g * t) * exp(-g * t)
ident(D, 'crítico: x₀(1+γt)e^(−γt) tiene ẋ(0) = 0', diff(crit, t).subs(t, 0), 0)
uu_ = {'x': 'm', 'x0': 'm', 'v0': 'm s^-1', 'w0': 'rad s^-1', 'g': 's^-1', 'wd': 'rad s^-1', 't': 's'}
dimcheck(D, 'x(t) subamortiguado', Symbol('x', positive=True), xs, uu_)
dimcheck(D, 'ω_d = √(ω₀² − γ²)', wd, sqrt(w0 ** 2 - g ** 2), uu_)
dimcheck(D, 'Q = ω₀/(2γ)', Symbol('Q', positive=True), w0 / (2 * g), {'Q': '1', 'w0': 'rad s^-1', 'g': 's^-1'})
dimcheck(D, 'δ = 2πγ/ω_d', Symbol('dl', positive=True), 2 * pi * g / wd, {'dl': '1', 'g': 's^-1', 'wd': 'rad s^-1'})
xn = lambda z_, w0_, t_, x0_=1: (lambda g_, wd_: x0_ * math.exp(-g_ * t_) * (math.cos(wd_ * t_) + g_ / wd_ * math.sin(wd_ * t_)))(z_ * w0_, w0_ * math.sqrt(1 - z_ * z_))
wdn = lambda z_, w0_=10: w0_ * math.sqrt(1 - z_ * z_)
num(D, 'ω_d (ζ = 0.1)', wdn(0.1), '9.950'); num(D, 'ω_d (ζ = 0.1) valor inicial', wdn(0.1), '9.9499'); num(D, 'Q', 1 / 0.2, '5.000')
num(D, 'periodo T_d', 2 * math.pi / wdn(0.1), '0.6315'); num(D, 'δ', 2 * math.pi * 0.1 / math.sqrt(1 - 0.01), '0.6315'); num(D, 'δ valor inicial', 2 * math.pi * 0.1 / math.sqrt(0.99), '0.63148')
num(D, 'razón de máximos', math.exp(-2 * math.pi * 0.1 / math.sqrt(0.99)), '0.5318'); num(D, 'x(0.5 s)', xn(0.1, 10, 0.5), '0.0986'); num(D, 'x(1 s)', xn(0.1, 10, 1), '-0.3369'); num(D, 'x(1 s) valor inicial', xn(0.1, 10, 1), '-0.33685')
num(D, 'ω₀ − ω_d (%)', (10 - wdn(0.1)) / 10 * 100, '0.5')
num(D, 'ω_d (ζ = 0.01)', wdn(0.01), '9.9995'); num(D, 'Q (ζ = 0.01)', 50.0, '50.0'); num(D, 'ω_d (ζ = 0.3)', wdn(0.3), '9.539'); num(D, 'Q (ζ = 0.3)', 1 / 0.6, '1.667')
num(D, 'ω_d (ζ = 0.7)', wdn(0.7), '7.141'); num(D, 'δ (ζ = 0.7)', 2 * math.pi * 0.7 / math.sqrt(1 - 0.49), '6.159'); num(D, 'razón de máximos (ζ = 0.7) %', math.exp(-2 * math.pi * 0.7 / math.sqrt(0.51)) * 100, '0.2')
num(D, 'ω_d (ζ = 0.95)', wdn(0.95), '3.122'); num(D, 'δ (ζ = 0.95)', 2 * math.pi * 0.95 / math.sqrt(1 - 0.9025), '19.1'); num(D, 'Q (ζ = 0.7)', 1 / 1.4, '0.714')
num(D, 'crítico x(0.2 s)', (1 + 10 * 0.2) * math.exp(-2), '0.4060')
num(D, 'raíz sobreamortiguada r₊', -20 + math.sqrt(300), '-2.679'); num(D, 'raíz sobreamortiguada r₋', -20 - math.sqrt(300), '-37.32'); num(D, 'tiempo lento 1/|r₊|', 1 / (20 - math.sqrt(300)), '0.373')
wp, zp, x0p, tp = symbols('w0 z x0 t', positive=True)
gp = zp * wp; wdp = wp * sqrt(1 - zp ** 2)
fs(D, 'x', x0p * exp(-gp * tp) * (cos(wdp * tp) + gp / wdp * sin(wdp * tp)))
fs(D, 'wd', wdp); fs(D, 'Q', 1 / (2 * zp)); fs(D, 'ld', 2 * pi * zp / sqrt(1 - zp ** 2)); fs(D, 'tg', 1 / gp)

# ---------------------------------------------------------------- forzado
D = 'forzado-fasorial'
w, F0, A_, dl = S('w F0 A delta')
Dn = (w0 ** 2 - w ** 2) ** 2 + 4 * g ** 2 * w ** 2
xp = F0 / Dn * ((w0 ** 2 - w ** 2) * cos(w * t) + 2 * g * w * sin(w * t))
ident(D, 'x_p resuelve ẍ + 2γẋ + ω₀²x = F₀ cos ωt', diff(xp, t, 2) + 2 * g * diff(xp, t) + w0 ** 2 * xp, F0 * cos(w * t))
Ch = F0 / (w0 ** 2 - w ** 2 + 2 * I * g * w)
ident(D, '|Ĉ|² = F₀²/D', sp.simplify(Ch * conjugate(Ch)), F0 ** 2 / Dn)
zc = Ch * exp(I * w * t)
ident(D, 'ecuación compleja: z̈ + 2γż + ω₀²z = F₀ e^(iωt)', sp.simplify(diff(zc, t, 2) + 2 * g * diff(zc, t) + w0 ** 2 * zc), F0 * exp(I * w * t))
_Ch = 1 / complex(100 - 25, 2 * 5)
_t0 = 0.37
_lhs = (_Ch * __import__('cmath').exp(1j * 5 * _t0)).real
_rhs = 1 / math.sqrt(75 ** 2 + 100) * math.cos(5 * _t0 - math.atan2(10, 75))
rec(G_STEP, D, 'Re(Ĉ e^(iωt)) = A cos(ωt − δ) (ω = 5)', _lhs, _rhs, 'rel 1e-12', abs(_lhs - _rhs) < 1e-12)
wr_sq = Symbol('W2', positive=True)
Dw = (w0 ** 2 - wr_sq) ** 2 + 4 * g ** 2 * wr_sq
solves(D, 'resonancia: dD/d(ω²) = 0 → ω_r² = ω₀² − 2γ²', [Eq(diff(Dw, wr_sq), 0)], wr_sq, w0 ** 2 - 2 * g ** 2)
ident(D, 'D(ω_r) = 4γ²(ω₀² − γ²)', Dw.subs(wr_sq, w0 ** 2 - 2 * g ** 2), 4 * g ** 2 * (w0 ** 2 - g ** 2))
ident(D, 'A_máx = F₀/(2γ√(ω₀²−γ²))', F0 / sqrt(Dw.subs(wr_sq, w0 ** 2 - 2 * g ** 2)), F0 / (2 * g * sqrt(w0 ** 2 - g ** 2)))
_A0 = float(sp.N((F0 / sqrt(Dn)).subs({w: 0, F0: 1, w0: 10, g: 1})))
rec(G_STEP, D, 'A(0) = F₀/ω₀²', _A0, 0.01, 'exacto', abs(_A0 - 0.01) < 1e-15)
rec(G_STEP, D, 'límite ω→∞: A ω² → F₀', float(limit((F0 / sqrt(Dn) * w ** 2).subs({F0: 1, w0: 10, g: 1}), w, oo)), 1.0, 'exacto', limit((F0 / sqrt(Dn) * w ** 2).subs({F0: 1, w0: 10, g: 1}), w, oo) == 1)
rec(G_STEP, D, 'límite γ→0: A_máx/A(0)·(2γ/ω₀) → 1', float(limit((F0 / (2 * g * sqrt(w0 ** 2 - g ** 2)) / (F0 / w0 ** 2)) * (2 * g / w0), g, 0)), 1.0, 'exacto', limit((F0 / (2 * g * sqrt(w0 ** 2 - g ** 2)) / (F0 / w0 ** 2)) * (2 * g / w0), g, 0) == 1)
ident(D, 'δ en ω = ω₀: tan δ → ∞ (δ = 90°)', sp.atan2(2 * g * w0, 0), pi / 2)
uf = {'A': 'm', 'F0': 'm s^-2', 'w': 'rad s^-1', 'w0': 'rad s^-1', 'g': 's^-1', 'wr': 'rad s^-1'}
dimcheck(D, 'A(ω)', A_, F0 / sqrt(Dn), uf)
dimcheck(D, 'ω_r = √(ω₀² − 2γ²)', Symbol('wr', positive=True), sqrt(w0 ** 2 - 2 * g ** 2), uf)
dimcheck(D, 'A_máx', A_, F0 / (2 * g * sqrt(w0 ** 2 - g ** 2)), uf)
dimcheck(D, 'δ = arctan(2γω/(ω₀²−ω²))', Symbol('dl', positive=True), atan(2 * g * w / (w0 ** 2 - w ** 2)), dict(uf, dl='rad'))
Af = lambda w_, z_=0.1, w0_=10, F_=1: F_ / math.sqrt((w0_ ** 2 - w_ ** 2) ** 2 + (2 * z_ * w0_ * w_) ** 2)
dlf = lambda w_, z_=0.1, w0_=10: math.degrees(math.atan2(2 * z_ * w0_ * w_, w0_ ** 2 - w_ ** 2))
num(D, 'A(0)', Af(1e-12), '0.01'); num(D, 'A(ω₀)', Af(10), '0.05'); num(D, 'δ(ω₀)', dlf(10), '90.000'); num(D, 'ω_r', math.sqrt(100 - 2), '9.8995'); num(D, 'A_máx', 1 / (2 * math.sqrt(99)), '0.050252')
num(D, 'A(5)', Af(5), '0.013216'); num(D, 'δ(5)', dlf(5), '7.59'); num(D, 'A(20) en 10⁻³', Af(20) / 1e-3, '3.3041'); num(D, 'δ(20)', dlf(20), '172.4')
num(D, 'A(ω₀) con ζ = 0.3', Af(10, 0.3), '0.016667'); num(D, 'A(ω₀) con ζ = 0.7', Af(10, 0.7), '0.0071429'); num(D, 'ω_r con ζ = 0.7', 10 * math.sqrt(1 - 2 * 0.49), '1.41')
num(D, 'A_máx con ζ = 0.7', 1 / (2 * 7 * math.sqrt(100 - 49)), '0.010002', tol=1e-3)
num(D, 'A_máx/A(0) ≈ Q', (1 / (2 * math.sqrt(99))) / 0.01, '5.03', tol=1e-2)
nz = lambda w_: float(sp.N((Symbol('zz', positive=True) * diff(F0 / sqrt((w0 ** 2 - w ** 2) ** 2 + (2 * Symbol('zz', positive=True) * w0 * w) ** 2), Symbol('zz', positive=True)) / (F0 / sqrt((w0 ** 2 - w ** 2) ** 2 + (2 * Symbol('zz', positive=True) * w0 * w) ** 2))).subs({w0: 10, w: w_, F0: 1, Symbol('zz', positive=True): 0.1})))
rec(G_NUM, D, 'n_ζ en ω = ω₀ es −1', nz(10), -1.0, 'rel 1e-9', abs(nz(10) + 1) < 1e-9)
rec(G_NUM, D, '|n_ζ| < 0.1 en ω = 5', abs(nz(5)), 0.0, '< 0.1', abs(nz(5)) < 0.1)
Fp, wpp, zp2, w0p = symbols('F w z w0', positive=True)
gpp = zp2 * w0p
Dp = (w0p ** 2 - wpp ** 2) ** 2 + 4 * gpp ** 2 * wpp ** 2
fs(D, 'A', Fp / sqrt(Dp)); fs(D, 'dl', atan2(2 * gpp * wpp, w0p ** 2 - wpp ** 2) * 180 / pi); fs(D, 'As', Fp / w0p ** 2)
fs(D, 'wr', w0p * sqrt(1 - 2 * zp2 ** 2)); fs(D, 'Am', Fp / (2 * gpp * sqrt(w0p ** 2 - gpp ** 2))); fs(D, 'Q', 1 / (2 * zp2))

# ---------------------------------------------------------------- Fourier
D = 'fourier'
x = Symbol('x', real=True)
for n_, m_ in ((1, 1), (2, 2), (1, 2), (3, 1), (3, 3)):
    cc = integrate(cos(n_ * x) * cos(m_ * x), (x, -pi, pi)); ss = integrate(sin(n_ * x) * sin(m_ * x), (x, -pi, pi)); sc = integrate(sin(n_ * x) * cos(m_ * x), (x, -pi, pi))
    ident(D, f'ortogonalidad cos·cos (n,m = {n_},{m_})', cc, pi * (1 if n_ == m_ else 0)); ident(D, f'ortogonalidad sen·sen ({n_},{m_})', ss, pi * (1 if n_ == m_ else 0)); ident(D, f'ortogonalidad sen·cos ({n_},{m_})', sc, 0)
A = Symbol('A', positive=True)
for k_ in range(1, 8):
    bn = 2 / pi * integrate(A * sin(k_ * x), (x, 0, pi))
    ident(D, f'b_{k_} = (2A/(nπ))(1 − cos nπ)', bn, 2 * A / (k_ * pi) * (1 - cos(k_ * pi)))
rec(G_STEP, D, 'a_n = 0 para f impar (n = 1…5)', 0.0, 0.0, 'exacto', all(sp.simplify(integrate(sp.sign(x) * cos(k_ * x), (x, -pi, pi))) == 0 for k_ in range(1, 6)))
rec(G_STEP, D, 'Leibniz: 1 − 1/3 + 1/5 − … = π/4 (mpmath)', float(mp.nsum(lambda k: (-1) ** int(k) / (2 * k + 1), [0, mp.inf])), math.pi / 4, 'rel 1e-12', abs(float(mp.nsum(lambda k: (-1) ** int(k) / (2 * k + 1), [0, mp.inf])) - math.pi / 4) < 1e-12)
rec(G_STEP, D, 'Parseval: Σ_impar 1/n² = π²/8', float(mp.nsum(lambda k: 1 / (2 * k + 1) ** 2, [0, mp.inf])), math.pi ** 2 / 8, 'rel 1e-12', abs(float(mp.nsum(lambda k: 1 / (2 * k + 1) ** 2, [0, mp.inf])) - math.pi ** 2 / 8) < 1e-12)
tt = Symbol('tt', real=True)
for M in range(1, 7):
    ident(D, f'Σ_(j=1..{M}) cos(2j−1)t = sen 2Mt/(2 sen t)', sum(cos((2 * j - 1) * tt) for j in range(1, M + 1)), sin(2 * M * tt) / (2 * sin(tt)))
SM = lambda M, xv: 4 / math.pi * sum(math.sin((2 * j - 1) * xv) / (2 * j - 1) for j in range(1, M + 1))
for M, xv in ((5, 0.7), (3, 1.3), (10, 0.2)):
    q = float(mp.quad(lambda s: mp.sin(2 * M * s) / mp.sin(s), [0, xv])) * 2 / math.pi
    rec(G_STEP, D, f'S_(2M−1) = (2/π)∫sen 2Mt/sen t dt (M = {M}, x = {xv})', SM(M, xv), q, 'rel 1e-10', abs(SM(M, xv) - q) < 1e-10)
gib = 2 / math.pi * float(sici(math.pi)[0])
num(D, 'Si(π)', float(sici(math.pi)[0]), '1.8519'); num(D, '(2/π)Si(π)', gib, '1.1790'); num(D, 'exceso sobre A (%)', (gib - 1) * 100, '17.9'); num(D, 'exceso sobre el salto 2A (%)', (gib - 1) / 2 * 100, '8.95')
uF = {'f': 'm', 'A': 'm', 'b': 'm', 'x': 'rad', 'n': '1', 'e': 'm'}
dimcheck(D, 'b_n = 4A/(nπ)', Symbol('b', positive=True), 4 * A / (Symbol('n', positive=True) * pi), uF)
dimcheck(D, 'f ≈ (4A/π)(sen x + sen 3x/3 + sen 5x/5)', Symbol('f', positive=True), 4 * A / pi * (sin(x) + sin(3 * x) / 3 + sin(5 * x) / 5), uF)
dimcheck(D, 'ε² = A²(1 − (8/π²)(1 + 1/9 + 1/25))', Symbol('e', positive=True), A * sqrt(1 - 8 / pi ** 2 * (1 + R_(1, 9) + R_(1, 25))), uF)
def S_N(N, xv):
    M = (int(N) + 1) // 2
    return 4 / mp.pi * sum(mp.sin((2 * j + 1) * xv) / (2 * j + 1) for j in range(M))
def rms_N(N):
    M = (int(N) + 1) // 2
    return mp.sqrt(1 - 8 / mp.pi ** 2 * sum(mp.mpf(1) / (2 * j + 1) ** 2 for j in range(M)))
def pk_N(N):
    M = (int(N) + 1) // 2
    return S_N(2 * M - 1, mp.pi / (2 * M))
for N in (1, 3, 9, 99, 999):
    num(D, f'error rms (N = {N})', float(rms_N(N)), {1: '0.4352', 3: '0.3152', 9: '0.2010', 99: '0.0637', 999: '0.0201'}[N])
for N, vv in ((1, '1.2732'), (3, '1.2004'), (9, '1.1823'), (19, '1.1798'), (99, '1.1790'), (999, '1.17898')):
    num(D, f'pico de Gibbs (N = {N})', float(pk_N(N)), vv)
num(D, 'S₉(π/2)', float(S_N(9, mp.pi / 2)), '1.0631'); num(D, 'S₉₉(π/2)', float(S_N(99, mp.pi / 2)), '0.9936')
num(D, 'S₉(π/4)', float(S_N(9, mp.pi / 4)), '0.9918')
fp_(D, 'S', lambda p: p['A'] * S_N(round(p['N']), p['xp'] * mp.pi), tol=1e-9, atol=1e-6)
fp_(D, 'rms', lambda p: p['A'] * rms_N(round(p['N'])), tol=1e-9, atol=1e-6)
fp_(D, 'pk', lambda p: p['A'] * pk_N(round(p['N'])), tol=1e-9)

# ---------------------------------------------------------------- Legendre
D = 'legendre-pl'
xl = Symbol('x', real=True)
ll = Symbol('l')
for k_ in range(0, 7):
    P = legendre(k_, xl)
    ident(D, f'P_{k_} resuelve (1−x²)y″ − 2xy′ + l(l+1)y = 0', (1 - xl ** 2) * diff(P, xl, 2) - 2 * xl * diff(P, xl) + k_ * (k_ + 1) * P, 0)
    ident(D, f'Rodrigues: P_{k_}', diff((xl ** 2 - 1) ** k_, xl, k_) / (2 ** k_ * factorial(k_)), P)
for k_ in range(1, 6):
    ident(D, f'recurrencia de tres términos (l = {k_})', (k_ + 1) * legendre(k_ + 1, xl), (2 * k_ + 1) * xl * legendre(k_, xl) - k_ * legendre(k_ - 1, xl))
# recurrencia de coeficientes a_(k+2) para l = 4 con a0 = 3/8 → P4
a = {0: R_(3, 8)}
for k_ in (0, 2):
    a[k_ + 2] = R_(k_ * (k_ + 1) - 4 * 5, (k_ + 1) * (k_ + 2)) * a[k_]
ident(D, 'serie terminada para l = 4: a₂ = −15/4 a₀, a₄ = −(2·3−20)/(3·4)… → P₄', a[0] + a[2] * xl ** 2 + a[4] * xl ** 4, legendre(4, xl))
rec(G_STEP, D, 'a₆ = 0 para l = 4 (la serie termina)', float(R_(4 * 5 - 20, 5 * 6)), 0.0, 'exacto', R_(4 * 5 - 20, 5 * 6) == 0)
rec(G_STEP, D, 'a_(k+2)/a_k → 1 (k = 10⁶, l = 3)', float(R_(10 ** 6 * (10 ** 6 + 1) - 12, (10 ** 6 + 1) * (10 ** 6 + 2))), 1.0, 'rel 1e-5', abs(float(R_(10 ** 6 * (10 ** 6 + 1) - 12, (10 ** 6 + 1) * (10 ** 6 + 2))) - 1) < 1e-5)
for l1 in range(0, 5):
    for l2 in range(l1, 5):
        v = integrate(legendre(l1, xl) * legendre(l2, xl), (xl, -1, 1))
        ident(D, f'∫P_{l1}P_{l2} = 2/(2l+1)δ', v, R_(2, 2 * l1 + 1) if l1 == l2 else 0)
ident(D, 'l(l+1) − m(m+1) = (l−m)(l+m+1)', Symbol('l1') * (Symbol('l1') + 1) - Symbol('m1') * (Symbol('m1') + 1), (Symbol('l1') - Symbol('m1')) * (Symbol('l1') + Symbol('m1') + 1))
for k_ in range(0, 7):
    ident(D, f'P_{k_}(1) = 1', legendre(k_, 1), 1)
    ident(D, f'P_{k_}(−x) = (−1)^l P_{k_}(x)', legendre(k_, -xl), (-1) ** k_ * legendre(k_, xl))
dimcheck(D, 'P₂(x) = (3x²−1)/2 es adimensional', Symbol('P', positive=True), (3 * xl ** 2 - 1) / 2, {'P': '1', 'x': '1'})
dimcheck(D, 'norma 2/(2l+1)', Symbol('nm', positive=True), 2 / (2 * Symbol('ll', positive=True) + 1), {'nm': '1', 'll': '1'})
Pl = lambda l_, x_: float(eval_legendre(l_, x_))
for l_, vv in ((0, '1.0000'), (1, '0.5000'), (2, '-0.1250'), (3, '-0.4375'), (4, '-0.2891'), (5, '0.0898'), (6, '0.3232')):
    num(D, f'P_{l_}(0.5)', Pl(l_, 0.5), vv)
num(D, 'P₃(0.9)', Pl(3, 0.9), '0.4725'); num(D, 'P₅(0.9)', Pl(5, 0.9), '-0.0411'); num(D, 'P₆(0.9)', Pl(6, 0.9), '-0.241164'); num(D, "P₃'(0.5)", float(diff(legendre(3, xl), xl).subs(xl, R_(1, 2))), '0.375'); num(D, '2/7', 2 / 7, '0.285714'); num(D, 'P₂(0)', Pl(2, 0.0), '-0.5')
fp_(D, 'P', lambda p: eval_legendre(round(p['l']), p['x']), tol=1e-9, atol=1e-9)
fp_(D, 'dP', lambda p: mp.diff(lambda tq: mp.legendre(round(p['l']), tq), p['x']), tol=1e-7, atol=1e-8)
fp_(D, 'nm', lambda p: 2 / (2 * round(p['l']) + 1), tol=1e-12)

# ---------------------------------------------------------------- Bessel
D = 'bessel-tambor'
xb = Symbol('x', positive=True)
for m_ in range(0, 4):
    K = 12
    Jm = sum((-1) ** k_ / (factorial(k_) * factorial(k_ + m_)) * (xb / 2) ** (2 * k_ + m_) for k_ in range(K))
    res = sp.expand(xb ** 2 * diff(Jm, xb, 2) + xb * diff(Jm, xb) + (xb ** 2 - m_ ** 2) * Jm)
    lowest = min(sp.Poly(res, xb).monoms())[0] if res != 0 else 99
    rec(G_STEP, D, f'serie de Frobenius J_{m_} (12 términos): el residuo empieza en x^{lowest} ≥ x^{2*K+m_}', float(lowest), float(2 * K + m_), 'potencia mínima', lowest >= 2 * K + m_)
    Jbig = sum((-1) ** k_ / (factorial(k_) * factorial(k_ + m_)) * (xb / 2) ** (2 * k_ + m_) for k_ in range(45))
    for xv in (0.5, 3.0, 7.5):
        v = float(sp.N(Jbig.subs(xb, xv), 20)); rf = float(jv(m_, xv))
        rec(G_STEP, D, f'J_{m_}({xv}) por la serie = SciPy', v, rf, 'rel 1e-9', abs(v - rf) <= 1e-9 * max(abs(rf), 1e-3))
a0 = Symbol('a0'); jj = Symbol('j', positive=True, integer=True); mm_ = Symbol('m', positive=True, integer=True)
ident(D, 'recurrencia: (j+m)² − m² = j(j+2m)', (jj + mm_) ** 2 - mm_ ** 2, jj * (jj + 2 * mm_))
ident(D, 'a₄ de J₂ con a₀ = 1/(2²·2!) y a₂ₖ = −a₂ₖ₋₂/(4k(k+m)): 1/3072 = 1/(2!·4!·2⁶)', R_(1, 8) * R_(1, 12) * R_(1, 32), R_(1, 48 * 64))
for m_ in range(0, 4):
    zs = float(mp.besseljzero(m_, 1))
    rec(G_STEP, D, f'primer cero j_({m_},1) por mpmath = SciPy', zs, float(jn_zeros(m_, 1)[0]), 'rel 1e-12', abs(zs - float(jn_zeros(m_, 1)[0])) < 1e-12)
uB = {'f': 'Hz', 'c': 'm s^-1', 'a': 'm', 'j': '1', 'k': 'm^-1'}
dimcheck(D, 'f = c j/(2πa)', Symbol('f', positive=True), Symbol('c', positive=True) * Symbol('j', positive=True) / (2 * pi * Symbol('a', positive=True)), uB)
dimcheck(D, 'k = j/a', Symbol('k', positive=True), Symbol('j', positive=True) / Symbol('a', positive=True), uB)
num(D, 'j₀₁', float(jn_zeros(0, 1)[0]), '2.4048'); num(D, 'j₁₁', float(jn_zeros(1, 1)[0]), '3.8317'); num(D, 'j₂₁', float(jn_zeros(2, 1)[0]), '5.1356'); num(D, 'j₀₂', float(jn_zeros(0, 2)[1]), '5.5201')
for nm_, val_, vv in (('j₁₁/j₀₁', jn_zeros(1, 1)[0] / jn_zeros(0, 1)[0], '1.593'), ('j₂₁/j₀₁', jn_zeros(2, 1)[0] / jn_zeros(0, 1)[0], '2.136'), ('j₀₂/j₀₁', jn_zeros(0, 2)[1] / jn_zeros(0, 1)[0], '2.295')):
    num(D, nm_, float(val_), vv)
fr = lambda m_, a_=0.15, c_=100: c_ * float(jn_zeros(m_, 1)[0]) / (2 * math.pi * a_)
num(D, 'f₀₁', fr(0), '255.16'); num(D, 'f₁₁', fr(1), '406.6'); num(D, 'f₃₁', fr(3), '677.0'); num(D, 'f₀₁ con a = 0.3', fr(0, 0.3), '127.58'); num(D, 'f₀₁ con c·√2 / f₀₁', math.sqrt(2), '1.414')
for m_, xv, vv in ((0, 2, '0.22389'), (1, 2, '0.57672'), (2, 2, '0.35283'), (0, 5, '-0.17760'), (1, 5, '-0.32758'), (2, 5, '0.04657')):
    num(D, f'J_{m_}({xv})', float(jv(m_, xv)), vv)
num(D, 'j₀₁ valor inicial', float(jn_zeros(0, 1)[0]), '2.404826'); num(D, 'j₁₁ valor inicial', float(jn_zeros(1, 1)[0]), '3.831706'); num(D, 'j₃₁ valor inicial', float(jn_zeros(3, 1)[0]), '6.380162')
fp_(D, 'J', lambda p: mp.besselj(round(p['m']), p['x']), tol=1e-8, atol=1e-9)
fp_(D, 'j1', lambda p: mp.besseljzero(round(p['m']), 1), tol=1e-9)
fp_(D, 'f1', lambda p: p['c'] * mp.besseljzero(round(p['m']), 1) / (2 * mp.pi * p['a']), tol=1e-9)
