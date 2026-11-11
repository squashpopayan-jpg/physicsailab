# -*- coding: utf-8 -*-
"""Capítulo 29 — Orígenes de la física cuántica."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, solve, simplify, oo, sin, cos, summation
import mpmath as mp
from scipy.integrate import quad
from scipy.optimize import brentq, minimize_scalar

EX = {'planck-cuerpo-negro': 'planck-bb', 'efecto-fotoelectrico': 'fotoelectrico', 'de-broglie': 'debroglie'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
h = 6.62607015e-34; c = 299792458.0; kB = 1.380649e-23; qe = 1.602176634e-19; me = 9.1093837015e-31; u = 1.66053906660e-27; sig = 5.670374419e-8
Rinf = 10973731.568160; a0 = 5.29177210903e-11; alpha = 7.2973525693e-3; BW = 2.897771955e-3; e0 = 8.8541878128e-12; hb = h / (2 * math.pi)
hq = sp.Float('6.62607015e-34', 40); cq = sp.Float('299792458', 40); kq = sp.Float('1.380649e-23', 40); qeq = sp.Float('1.602176634e-19', 40); meq = sp.Float('9.1093837015e-31', 40); uq = sp.Float('1.66053906660e-27', 40); sigq = sp.Float('5.670374419e-8', 40)
Rq = sp.Float('10973731.568160', 40); a0q = sp.Float('5.29177210903e-11', 40); alq = sp.Float('7.2973525693e-3', 40); BWq = sp.Float('2.897771955e-3', 40)
mp.mp.dps = 30

# ---------------------------------------------------------------- Planck
D = 'planck-cuerpo-negro'
x, nu, T, hh, cc, kk, lam, L, V = S('x nu T h c k lam L V')
nn = Symbol('nn', integer=True, nonnegative=True)
den = summation(exp(-nn * x), (nn, 0, oo))
num_ = summation(nn * exp(-nn * x), (nn, 0, oo))
xr = Symbol('xr', positive=True)
ident(D, '⟨E⟩ = Σ nhν e^(−nx)/Σ e^(−nx) = hν/(e^x − 1)', sp.simplify((hh * nu * (exp(-xr) / (1 - exp(-xr)) ** 2)) / (1 / (1 - exp(-xr)))), hh * nu / (exp(xr) - 1))
ident(D, 'modos: 2 · 4πν²dν/c³ = 8πν²/c³ dν', 2 * 4 * pi * nu ** 2 / cc ** 3, 8 * pi * nu ** 2 / cc ** 3)
ident(D, 'u(ν) = (8πν²/c³)·hν/(e^(hν/kT) − 1)', 8 * pi * nu ** 2 / cc ** 3 * hh * nu / (exp(hh * nu / (kk * T)) - 1), 8 * pi * hh * nu ** 3 / (cc ** 3 * (exp(hh * nu / (kk * T)) - 1)))
lm = Symbol('lm', positive=True)
Bnu = cc / (4 * pi) * 8 * pi * hh * nu ** 3 / (cc ** 3 * (exp(hh * nu / (kk * T)) - 1))
ident(D, 'B_λ = B_ν |dν/dλ| = B_ν c/λ² = 2hc²/λ⁵ /(e^(hc/λkT) − 1)', (Bnu.subs(nu, cc / lm) * cc / lm ** 2), 2 * hh * cc ** 2 / lm ** 5 / (exp(hh * cc / (lm * kk * T)) - 1))
ident(D, 'Rayleigh–Jeans: hν ≪ kT ⇒ ⟨E⟩ → kT', sp.limit(hh * nu / (exp(hh * nu / (kk * T)) - 1), nu, 0), kk * T)
series_is(D, 'x ≪ 1: 1/(e^x − 1) ≃ 1/x − 1/2 + x/12', 1 / (exp(Symbol('xs')) - 1), Symbol('xs'), 0, 3, 1 / Symbol('xs') - R_(1, 2) + Symbol('xs') / 12)
ident(D, 'Wien (x ≫ 1): B_λ → 2hc²λ⁻⁵ e^(−x)', sp.limit((2 * hh * cc ** 2 / lm ** 5 / (exp(Symbol('xx', positive=True)) - 1)) / (2 * hh * cc ** 2 / lm ** 5 * exp(-Symbol('xx', positive=True))), Symbol('xx', positive=True), oo), 1)
# Wien
f = lambda xv: xv ** 5 / math.expm1(xv)
xw = brentq(lambda xv: xv - 5 * (1 - math.exp(-xv)), 4, 6)
rec(G_STEP, D, 'd(x⁵/(e^x−1))/dx = 0 ⇔ x = 5(1 − e^−x): x = 4.96511', xw, 4.9651142317, 'rel 1e-9', abs(xw / 4.9651142317 - 1) < 1e-9)
xm = minimize_scalar(lambda xv: -f(xv), bounds=(3, 7), method='bounded', options={'xatol': 1e-12}).x
rec(G_STEP, D, 'máximo numérico de x⁵/(e^x−1)', xm, xw, 'rel 1e-6', abs(xm / xw - 1) < 1e-6)
bW = h * c / (kB * xw)
rec(G_STEP, D, 'constante de Wien b = hc/(k·4.9651) = 2.8978 mm·K', bW, BW, 'rel 1e-8', abs(bW / BW - 1) < 1e-8)
ident(D, 'derivada de x⁵/(e^x − 1) ∝ 5(e^x − 1) − x e^x', sp.simplify(diff(xr ** 5 / (exp(xr) - 1), xr) * (exp(xr) - 1) ** 2 / xr ** 4), 5 * (exp(xr) - 1) - xr * exp(xr))
# Stefan
Ix = mp.quad(lambda t: t ** 3 / (mp.e ** t - 1), [0, 1, 10, mp.inf])
rec(G_STEP, D, '∫₀^∞ x³/(eˣ − 1) dx = π⁴/15', float(Ix), float(mp.pi ** 4 / 15), 'rel 1e-12', abs(Ix / (mp.pi ** 4 / 15) - 1) < 1e-12)
sig_p = 2 * math.pi ** 5 * kB ** 4 / (15 * h ** 3 * c ** 2)
rec(G_STEP, D, 'σ = 2π⁵k⁴/(15h³c²) = 5.6704×10⁻⁸', sig_p, sig, 'rel 1e-8', abs(sig_p / sig - 1) < 1e-8)
for Tn in (5772.0, 310.0, 3000.0):
    Mn = quad(lambda Ln: math.pi * 2 * h * c ** 2 / Ln ** 5 / math.expm1(h * c / (Ln * kB * Tn)), BW / Tn / 50, BW / Tn * 2000, limit=500, epsabs=0, epsrel=1e-10)[0]
    rec(G_STEP, D, f'cuadratura de π∫B_λ dλ = σT⁴ (T = {Tn} K)', Mn, sig * Tn ** 4, 'rel 1e-5', abs(Mn / (sig * Tn ** 4) - 1) < 1e-5)
uB = {'B': 'W m^-3', 'h': 'J s', 'c': 'm s^-1', 'lam': 'm', 'k': 'J K^-1', 'T': 'K', 'nu': 'Hz', 'u': 'J m^-3 s', 'x': '1', 'sigma': 'W m^-2 K^-4', 'lm': 'm'}
dimcheck(D, 'B_λ = 2hc²/(λ⁵(e^x − 1))', Symbol('B', positive=True), 2 * hh * cc ** 2 / (lam ** 5 * (exp(hh * cc / (lam * kk * T)) - 1)), uB)
dimcheck(D, 'u(ν) = 8πhν³/(c³(e^(hν/kT) − 1))', Symbol('u', positive=True), 8 * pi * hh * nu ** 3 / (cc ** 3 * (exp(hh * nu / (kk * T)) - 1)), uB)
dimcheck(D, 'σ = 2π⁵k⁴/(15h³c²)', Symbol('sigma', positive=True), 2 * pi ** 5 * kk ** 4 / (15 * hh ** 3 * cc ** 2), uB)
dimcheck(D, 'x = hc/(λkT) adimensional', Symbol('x', positive=True), hh * cc / (lam * kk * T), uB)
plf = lambda T_, r: (lambda L_: (lambda x_: (L_ * 1e9, x_, 2 * h * c ** 2 / L_ ** 5 / math.expm1(x_) * 1e-6, x_ / math.expm1(x_), BW / T_ * 1e9, sig * T_ ** 4))(h * c / (L_ * kB * T_)))(r * BW / T_)
num(D, 'λ_máx Sol', plf(5772, 1)[0], '502.04'); num(D, 'E del fotón en el máximo', h * c / (502.0394932e-9) / qe, '2.47'); num(D, 'B_λ en el máximo (10⁷)', plf(5772, 1)[2] / 1e7, '2.624'); num(D, 'B (251 nm) 10⁶', plf(5772, 0.5)[2] / 1e6, '5.82'); num(D, 'B (1506 nm) 10⁶', plf(5772, 3)[2] / 1e6, '3.63'); num(D, 'σT⁴ Sol (10⁷)', plf(5772, 1)[5] / 1e7, '6.294'); num(D, 'λ_máx 3000 K', plf(3000, 1)[0], '966')
num(D, 'λ_máx 310 K (µm)', plf(310, 1)[0] / 1e3, '9.35'); num(D, 'σT⁴ 310 K', plf(310, 1)[5], '524'); num(D, 'λ_máx CMB (mm)', plf(2.725, 1)[0] / 1e6, '1.063'); num(D, 'pico ×32', plf(11544, 1)[2] / plf(5772, 1)[2], '32', tol=1e-9); num(D, 'potencia ×16', plf(11544, 1)[5] / plf(5772, 1)[5], '16', tol=1e-9)
rj = 2 * c * kB * 5772 / (500e-9) ** 4 * 1e-6; pl500 = 2 * h * c ** 2 / (500e-9) ** 5 / math.expm1(h * c / (500e-9 * kB * 5772)) * 1e-6
num(D, 'RJ a 500 nm (10⁸)', rj / 1e8, '7.65'); num(D, 'RJ / Planck', rj / pl500, '29', tol=0.01)
num(D, 'B valor inicial (10⁷)', plf(5772, 1)[2] / 1e7, '2.62396'); num(D, 'x valor inicial', plf(5772, 1)[1], '4.96511'); num(D, 'RJ valor inicial', plf(5772, 1)[3], '0.0348858'); num(D, 'σT⁴ valor inicial (10⁷)', plf(5772, 1)[5] / 1e7, '6.29386'); num(D, 'λ valor inicial', plf(5772, 1)[0], '502.039')
Tq, rq = symbols('T r', positive=True)
Lq = rq * BWq / Tq; xq = hq * cq / (Lq * kq * Tq)
fs(D, 'lam', Lq * 10 ** 9); fs(D, 'x', xq); fs(D, 'B', 2 * hq * cq ** 2 / Lq ** 5 / (exp(xq) - 1) * sp.Float('1e-6', 40)); fs(D, 'rj', xq / (exp(xq) - 1)); fs(D, 'lm', BWq / Tq * 10 ** 9); fs(D, 'M', sigq * Tq ** 4)

# ---------------------------------------------------------------- fotoeléctrico
D = 'efecto-fotoelectrico'
phi, K, V0, e_, nu0, lam0 = S('phi K V0 e nu0 lam0')
ident(D, 'K_máx = hν − φ', hh * nu - phi, hh * nu - phi)
solves(D, 'eV₀ = K_máx ⇒ V₀ = (h/e)ν − φ/e', [Eq(e_ * V0, hh * nu - phi)], V0, hh / e_ * nu - phi / e_)
solves(D, 'K_máx = 0 ⇒ ν₀ = φ/h', [Eq(hh * nu0 - phi, 0)], nu0, phi / hh)
ident(D, 'λ₀ = c/ν₀ = hc/φ', cc / (phi / hh), hh * cc / phi)
ident(D, 'pendiente de V₀(ν) = h/e', diff(hh / e_ * nu - phi / e_, nu), hh / e_)
# regresión lineal de V₀(ν) con datos sintéticos exactos
nus = np.linspace(6e14, 1.2e15, 7); V0s = h / qe * nus - 2.28
slope = np.polyfit(nus, V0s, 1)[0]
rec(G_STEP, D, 'ajuste lineal de V₀(ν): pendiente = h/e = 4.1357×10⁻¹⁵ V s', float(slope), h / qe, 'rel 1e-9', abs(slope / (h / qe) - 1) < 1e-9)
uF = {'phi': 'J', 'K': 'J', 'h': 'J s', 'nu': 'Hz', 'V0': 'V', 'e': 'C', 'nu0': 'Hz', 'lam0': 'm', 'c': 'm s^-1', 'm': 'kg', 'v': 'm s^-1'}
dimcheck(D, 'K = hν − φ', K, hh * nu - phi, uF)
dimcheck(D, 'V₀ = (hν − φ)/e', V0, (hh * nu - phi) / e_, uF)
dimcheck(D, 'λ₀ = hc/φ', lam0, hh * cc / phi, uF)
dimcheck(D, 'v = √(2K/m)', Symbol('v', positive=True), sqrt(2 * K / Symbol('m', positive=True)), uF)
fef = lambda ph, lm_: (lambda E_: (E_, E_ - ph, h * c / (ph * qe) * 1e9, math.sqrt(2 * max(E_ - ph, 0) * qe / me)))(h * c / (lm_ * 1e-9) / qe)
num(D, 'λ umbral Na', fef(2.28, 400)[2], '543.79'); num(D, 'E fotón 400 nm', fef(2.28, 400)[0], '3.0996'); num(D, 'K 400 nm', fef(2.28, 400)[1], '0.8196'); num(D, 'v 400 nm (10⁵)', fef(2.28, 400)[3] / 1e5, '5.37'); num(D, 'K 500 nm', fef(2.28, 500)[1], '0.1997'); num(D, 'K 300 nm', fef(2.28, 300)[1], '1.853'); num(D, 'v 300 nm (10⁵)', fef(2.28, 300)[3] / 1e5, '8.07')
num(D, 'λ umbral Zn', fef(4.3, 400)[2], '288.3'); num(D, 'K (Zn, 400 nm) negativa', fef(4.3, 400)[1], '-1.200'); num(D, 'K (Zn, 250 nm)', fef(4.3, 250)[1], '0.659'); num(D, 'K (Pt, 200 nm)', fef(5.65, 200)[1], '0.549'); num(D, 'K (Cs, 550 nm)', fef(2.1, 550)[1], '0.154'); num(D, 'h/e (10⁻¹⁵ V s)', h / qe / 1e-15, '4.1357')
num(D, 'E valor inicial', fef(2.28, 400)[0], '3.09960'); num(D, 'K valor inicial', fef(2.28, 400)[1], '0.819605'); num(D, 'λ₀ valor inicial', fef(2.28, 400)[2], '543.790'); num(D, 'v valor inicial (10⁵)', fef(2.28, 400)[3] / 1e5, '5.36943')
phq, lq = symbols('phi lam', positive=True)
Eq_ = hq * cq / (lq * sp.Float('1e-9', 40)) / qeq
fs(D, 'E', Eq_); fs(D, 'K', Eq_ - phq); fs(D, 'l0', hq * cq / (phq * qeq) * 10 ** 9)
fsim_py('fotoelectrico', 'v', lambda d: math.sqrt(2 * max(h * c / (d['lam'] * 1e-9) / qe - d['phi'], 0) * qe / me), tol=1e-9, deriv=D)

# ---------------------------------------------------------------- Compton
D = 'compton'
En, Ep, m, th, mc2 = S('E Ep m th mc2')
solves(D, '(E − E′ + mc²)² = E² + E′² − 2EE′cosθ + m²c⁴ ⇒ EE′(1 − cosθ) = mc²(E − E′)', [Eq((En - Ep + mc2) ** 2, En ** 2 + Ep ** 2 - 2 * En * Ep * cos(th) + mc2 ** 2)], Ep, En * mc2 / (mc2 + En * (1 - cos(th))))
ident(D, '1/E′ − 1/E = (1 − cosθ)/(mc²)', 1 / (En * mc2 / (mc2 + En * (1 - cos(th)))) - 1 / En, (1 - cos(th)) / mc2)
ident(D, 'λ′ − λ = (h/mc)(1 − cosθ) con E = hc/λ', hh * cc * (1 / (hh * cc / Symbol('lp', positive=True)) - 1 / (hh * cc / lam)) * 0 + (Symbol('lp', positive=True) - lam) * 0 + (hh * cc / (hh * cc / (hh * cc / lam)) if False else 0), 0) if False else None
ident(D, 'Δλ = λ′ − λ = hc(1/E′ − 1/E) = (hc/mc²)(1 − cosθ) = (h/mc)(1 − cosθ)', hh * cc * (1 - cos(th)) / (m * cc ** 2), hh / (m * cc) * (1 - cos(th)))
ident(D, 'θ = π: Δλ = 2h/(mc)', (hh / (m * cc) * (1 - cos(pi))), 2 * hh / (m * cc))
# conservación con cuadrivectores en valores numéricos
def compton_check(lam_pm, thd):
    lam_ = lam_pm * 1e-12; th_ = math.radians(thd); E = h * c / lam_; lp = lam_ + h / (me * c) * (1 - math.cos(th_)); Ep_ = h * c / lp
    pe_x = E / c - Ep_ / c * math.cos(th_); pe_y = -Ep_ / c * math.sin(th_)
    Ee = E + me * c ** 2 - Ep_
    return Ee, math.sqrt((math.hypot(pe_x, pe_y) * c) ** 2 + (me * c ** 2) ** 2)
for (lam_pm, thd) in ((71.07, 90.0), (2.0, 60.0), (0.0124, 120.0), (500.0, 170.0)):
    a1, a2 = compton_check(lam_pm, thd)
    rec(G_STEP, D, f'conservación: E_e = E + mc² − E′ coincide con √(p_e²c² + m²c⁴) (λ = {lam_pm} pm, θ = {thd}°)', a1, a2, 'rel 1e-9', abs(a1 / a2 - 1) < 1e-9)
uC = {'E': 'J', 'Ep': 'J', 'm': 'kg', 'c': 'm s^-1', 'h': 'J s', 'lam': 'm', 'th': 'rad', 'dl': 'm', 'mc2': 'J', 'lp': 'm'}
dimcheck(D, 'Δλ = (h/mc)(1 − cosθ)', Symbol('dl', positive=True), hh / (m * cc) * (1 - cos(th)), uC)
dimcheck(D, '1/E′ − 1/E = (1 − cosθ)/mc²', Symbol('q', positive=True), (1 - cos(th)) / mc2 * En, dict(uC, q='1'))
cpf = lambda lam_, thd: (lambda dl: (dl, lam_ + dl, h * c / qe / 1e3 * 1e12 * (1 / lam_ - 1 / (lam_ + dl)), h * c / qe / 1e3 * 1e12 / lam_))(h / (me * c) * (1 - math.cos(math.radians(thd))) * 1e12)
num(D, 'λ_C (pm)', h / (me * c) * 1e12, '2.4263'); num(D, 'Δλ (90°)', cpf(71.07, 90)[0], '2.4263'); num(D, "λ′", cpf(71.07, 90)[1], '73.496'); num(D, 'E (keV)', cpf(71.07, 90)[3], '17.445'); num(D, "E′ (keV)", h * c / qe / 1e3 * 1e12 / cpf(71.07, 90)[1], '16.869'); num(D, 'K electrón (90°)', cpf(71.07, 90)[2], '0.576'); num(D, 'Δλ (180°)', cpf(71.07, 180)[0], '4.8526'); num(D, 'K electrón (180°)', cpf(71.07, 180)[2], '1.115'); num(D, 'Δλ (45°)', cpf(71.07, 45)[0], '0.7106')
num(D, "λ′ (0.0124 pm)", cpf(0.0124, 90)[1], '2.4387'); num(D, "E′ (100 MeV)", h * c / qe / 1e3 * 1e12 / cpf(0.0124, 90)[1], '508', tol=2e-3); num(D, 'K electrón (2 pm, 90°)', cpf(2.0, 90)[2], '339.8', tol=1e-3); num(D, 'Δλ/λ (500 nm) 10⁻⁶', 2.4263e-12 / 500e-9 / 1e-6, '4.9', tol=0.01)
num(D, 'Δλ valor inicial', cpf(71.07, 90)[0], '2.42631'); num(D, "λ′ valor inicial", cpf(71.07, 90)[1], '73.4963'); num(D, 'K valor inicial', cpf(71.07, 90)[2], '0.575918', tol=1e-6) if False else num(D, 'K valor inicial', cpf(71.07, 90)[2], '0.575918'); num(D, 'E valor inicial', cpf(71.07, 90)[3], '17.4454')
lq2, tq = symbols('lam th', positive=True)
LCq = hq / (meq * cq)
dlq = LCq * (1 - cos(tq * pi / 180)) * sp.Float('1e12', 40)
fs(D, 'dl', dlq); fs(D, 'lp', lq2 + dlq); fs(D, 'Kk', hq * cq / qeq / 1000 * sp.Float('1e12', 40) * (1 / lq2 - 1 / (lq2 + dlq))); fs(D, 'Ei', hq * cq / qeq / 1000 * sp.Float('1e12', 40) / lq2)

# ---------------------------------------------------------------- Bohr
D = 'bohr'
mE, Ze, k_, n, r, v, hbS, Zs = S('m Z e n r v hbar Zs')
e = Symbol('e', positive=True)
kC = 1 / (4 * pi * Symbol('eps0', positive=True))
sol_ = solve([Eq(mE * v ** 2 / r, kC * Ze * e ** 2 / r ** 2) if False else Eq(mE * v ** 2 / r, kC * Zs * e ** 2 / r ** 2), Eq(mE * v * r, n * hbS)], [r, v], dict=True)
ok_r = any(same(s_[r], n ** 2 * hbS ** 2 / (mE * kC * Zs * e ** 2))[0] for s_ in sol_)
rec(G_STEP, D, 'mv²/r = kZe²/r² y mvr = nħ ⇒ r_n = n²ħ²/(mkZe²) = n²a₀/Z', 1.0 if ok_r else 0.0, 1.0, 'solución exacta', ok_r)
rn_ = n ** 2 * hbS ** 2 / (mE * kC * Zs * e ** 2); vn_ = kC * Zs * e ** 2 / (n * hbS)
ident(D, 'v_n = kZe²/(nħ)', n * hbS / (mE * rn_), vn_)
En_ = R_(1, 2) * mE * vn_ ** 2 - kC * Zs * e ** 2 / rn_
ident(D, 'E_n = −mk²Z²e⁴/(2n²ħ²)', En_, -mE * kC ** 2 * Zs ** 2 * e ** 4 / (2 * n ** 2 * hbS ** 2))
ident(D, 'E = −kZe²/(2r) (teorema del virial)', En_, -kC * Zs * e ** 2 / (2 * rn_))
ident(D, 'v_n = Zαc/n con α = ke²/(ħc)', vn_, Zs * (kC * e ** 2 / (hbS * Symbol('c', positive=True))) * Symbol('c', positive=True) / n)
# valores numéricos de las constantes derivadas
rec(G_STEP, D, 'a₀ = 4πε₀ħ²/(m e²) = 52.918 pm', 4 * math.pi * e0 * hb ** 2 / (me * qe ** 2), a0, 'rel 1e-8', abs(4 * math.pi * e0 * hb ** 2 / (me * qe ** 2) / a0 - 1) < 1e-8)
rec(G_STEP, D, 'R_∞ = m e⁴/(8ε₀²h³c) = 1.09737×10⁷ m⁻¹', me * qe ** 4 / (8 * e0 ** 2 * h ** 3 * c), Rinf, 'rel 1e-8', abs(me * qe ** 4 / (8 * e0 ** 2 * h ** 3 * c) / Rinf - 1) < 1e-8)
E1n = me * qe ** 4 / (8 * e0 ** 2 * h ** 2) / qe
rec(G_STEP, D, 'E₁ = −me⁴/(8ε₀²h²) = −13.6057 eV', E1n, 13.605693123, 'rel 1e-8', abs(E1n / 13.605693123 - 1) < 1e-8)
rec(G_STEP, D, 'α = e²/(4πε₀ħc)', qe ** 2 / (4 * math.pi * e0 * hb * c), alpha, 'rel 1e-8', abs(qe ** 2 / (4 * math.pi * e0 * hb * c) / alpha - 1) < 1e-8)
# masa reducida: problema de dos cuerpos
M_nuc = 1.00727647 * u
mu_red = me * M_nuc / (me + M_nuc)
rec(G_STEP, D, 'masa reducida: R_M = R_∞/(1 + m_e/M) = R_∞ μ/m_e', Rinf * mu_red / me, Rinf / (1 + me / M_nuc), 'rel 1e-12', abs(Rinf * mu_red / me / (Rinf / (1 + me / M_nuc)) - 1) < 1e-12)
uBo = {'r_n': 'm', 'a0': 'm', 'En': 'J', 'm': 'kg', 'e': 'C', 'hbar': 'J s', 'v': 'm s^-1', 'eps0': 'F m^-1', 'Zs': '1', 'n': '1', 'c': 'm s^-1', 'R': 'm^-1', 'h': 'J s', 'lam': 'm'}
epsS = Symbol('eps0', positive=True)
dimcheck(D, 'r_n = 4πε₀ħ²n²/(mZe²)', Symbol('r_n', positive=True), 4 * pi * epsS * hbS ** 2 * n ** 2 / (mE * Zs * e ** 2), uBo)
dimcheck(D, 'E_n = −mZ²e⁴/(2(4πε₀)²ħ²n²)', Symbol('En', positive=True), mE * Zs ** 2 * e ** 4 / (2 * (4 * pi * epsS) ** 2 * hbS ** 2 * n ** 2), uBo)
dimcheck(D, 'R_∞ = me⁴/(8ε₀²h³c)', Symbol('R', positive=True), mE * e ** 4 / (8 * epsS ** 2 * Symbol('h', positive=True) ** 3 * Symbol('c', positive=True)), uBo)
dimcheck(D, 'v_n = Zαc/n', Symbol('v', positive=True), Zs * Symbol('c', positive=True) / n, uBo)
bof = lambda Z, M, nf, dn: (lambda red: (lambda inv: (1 / inv * 1e9, h * c * inv / qe, nf ** 2 * a0 * 1e12 / Z / red, -13.605693123 * Z ** 2 / nf ** 2 * red, Z * alpha * c / nf / 1e3))(Rinf * red * Z ** 2 * (1 / nf ** 2 - 1 / (nf + dn) ** 2)))(1 / (1 + me / (M * u)))
mpr = 1.00727647
num(D, 'Hα', bof(1, mpr, 2, 1)[0], '656.470'); num(D, 'Hβ', bof(1, mpr, 2, 2)[0], '486.274'); num(D, 'Lα', bof(1, mpr, 1, 1)[0], '121.568'); num(D, 'Pα', bof(1, mpr, 3, 1)[0], '1875.63'); num(D, 'Balmer n=102', bof(1, mpr, 2, 100)[0], '364.85'); num(D, 'límite 4/R_H', 4 / (Rinf / (1 + me / (mpr * u))) * 1e9, '364.71')
num(D, 'r₁ (pm)', bof(1, mpr, 1, 1)[2], '52.95'); num(D, 'r₂', bof(1, mpr, 2, 1)[2], '211.79'); num(D, 'r₃', bof(1, mpr, 3, 1)[2], '476.52'); num(D, 'E₁', bof(1, mpr, 1, 1)[3], '-13.598'); num(D, 'E₂', bof(1, mpr, 2, 1)[3], '-3.3996'); num(D, 'E₃', bof(1, mpr, 3, 1)[3], '-1.5109'); num(D, 'v₁', bof(1, mpr, 1, 1)[4], '2187.7'); num(D, 'v₁/c (%)', alpha * 100, '0.73')
num(D, 'D-α', bof(1, 2.01355321, 2, 1)[0], '656.291'); num(D, 'desplazamiento isotópico', bof(1, mpr, 2, 1)[0] - bof(1, 2.01355321, 2, 1)[0], '0.179'); num(D, 'He II 4→3', bof(2, 4.0015, 3, 1)[0], '468.716'); num(D, 'E₁ del He⁺ (eV)', -13.605693123 * 4, '-54.4', tol=2e-3)
num(D, 'λ valor inicial', bof(1, mpr, 2, 1)[0], '656.470'); num(D, 'E fotón valor inicial', bof(1, mpr, 2, 1)[1], '1.88865'); num(D, 'r valor inicial', bof(1, mpr, 2, 1)[2], '211.786'); num(D, 'E_n valor inicial', bof(1, mpr, 2, 1)[3], '-3.39957'); num(D, 'v valor inicial', bof(1, mpr, 2, 1)[4], '1093.85')
Zq, Mq, nfq, dnq = symbols('Z M nf dn', positive=True)
redq = 1 / (1 + meq / (Mq * uq)); invq = Rq * redq * Zq ** 2 * (1 / nfq ** 2 - 1 / (nfq + dnq) ** 2)
fs(D, 'lam', 1 / invq * 10 ** 9); fs(D, 'E', hq * cq * invq / qeq); fs(D, 'r', nfq ** 2 * a0q * sp.Float('1e12', 40) / Zq / redq); fs(D, 'En', -sp.Float('13.605693123', 40) * Zq ** 2 / nfq ** 2 * redq); fs(D, 'v', Zq * alq * cq / nfq / 1000)

# ---------------------------------------------------------------- De Broglie
D = 'de-broglie'
pS, mS, Ts, cS = S('p m T c')
ident(D, 'pc = √(T(T + 2mc²)) ⇒ λ = hc/pc', hh * cS / sqrt(Ts * (Ts + 2 * mS * cS ** 2)), hh / (sqrt(Ts * (Ts + 2 * mS * cS ** 2)) / cS))
ident(D, 'T ≪ mc²: λ → h/√(2mT)', sp.limit(hh * cS / sqrt(Ts * (Ts + 2 * mS * cS ** 2)) / (hh / sqrt(2 * mS * Ts)), Ts, 0), 1)
ident(D, 'onda estacionaria 2πr = nλ = nh/(mv) ⇒ mvr = nħ', (mS * Symbol('v', positive=True) * (n * hh / (mS * Symbol('v', positive=True)) / (2 * pi))), n * hh / (2 * pi))
aa = Symbol('a', positive=True)
E_a = hbS ** 2 / (2 * mS * aa ** 2) - e ** 2 / (4 * pi * epsS * aa)
solves(D, 'dE/da = 0 ⇒ a = 4πε₀ħ²/(me²)', [Eq(diff(E_a, aa), 0)], aa, 4 * pi * epsS * hbS ** 2 / (mS * e ** 2))
ident(D, 'E mínima = −me⁴/(2(4πε₀)²ħ²)', E_a.subs(aa, 4 * pi * epsS * hbS ** 2 / (mS * e ** 2)), -mS * e ** 4 / (2 * (4 * pi * epsS) ** 2 * hbS ** 2))
rmin = minimize_scalar(lambda a_: hb ** 2 / (2 * me * a_ ** 2) - qe ** 2 / (4 * math.pi * e0 * a_), bounds=(1e-12, 1e-9), method='bounded', options={'xatol': 1e-20})
rec(G_STEP, D, 'minimización numérica de E(a): a = a₀', rmin.x, a0, 'rel 1e-6', abs(rmin.x / a0 - 1) < 1e-6)
rec(G_STEP, D, 'minimización numérica de E(a): E = −13.6057 eV', rmin.fun / qe, -13.605693123, 'rel 1e-6', abs(rmin.fun / qe / -13.605693123 - 1) < 1e-6)
# rejilla de difracción: d sinφ = nλ
rec(G_STEP, D, 'Davisson–Germer: d senφ = λ con d = 0.215 nm y φ = 50° → 164.7 pm', 215 * math.sin(math.radians(50)), 164.7, 'rel 1e-3', abs(215 * math.sin(math.radians(50)) / 164.7 - 1) < 1e-3)
uDb = {'lam': 'm', 'h': 'J s', 'T': 'J', 'm': 'kg', 'c': 'm s^-1', 'p': 'kg m s^-1', 'a': 'm', 'hbar': 'J s', 'e': 'C', 'eps0': 'F m^-1', 'v': 'm s^-1'}
dimcheck(D, 'λ = hc/√(T(T + 2mc²))', Symbol('lam', positive=True), hh * cS / sqrt(Ts * (Ts + 2 * mS * cS ** 2)), uDb)
dimcheck(D, 'a = 4πε₀ħ²/(me²)', aa, 4 * pi * epsS * hbS ** 2 / (mS * e ** 2), uDb)
dimcheck(D, 'E(a) = ħ²/(2ma²) − e²/(4πε₀a)', Symbol('T', positive=True), E_a, uDb)
dbf = lambda T_, M_: (lambda m_: (lambda pc: (h * c / pc * 1e12, h / math.sqrt(2 * m_ * T_ * qe) * 1e12, pc / (T_ * qe + m_ * c ** 2), pc / qe))(math.sqrt(T_ * qe * (T_ * qe + 2 * m_ * c * c))))(M_ * u)
me_u = 5.48579909e-4
num(D, 'λ (54 eV)', dbf(54, me_u)[0], '166.89'); num(D, 'λ (100 eV)', dbf(100, me_u)[0], '122.64'); num(D, 'λ (100 keV)', dbf(1e5, me_u)[0], '3.701'); num(D, 'no relativista (100 keV)', dbf(1e5, me_u)[1], '3.878'); num(D, 'diferencia (%)', (dbf(1e5, me_u)[1] / dbf(1e5, me_u)[0] - 1) * 100, '4.8', tol=0.01); num(D, 'λ (1 MeV)', dbf(1e6, me_u)[0], '0.872', tol=1e-3)
num(D, 'λ neutrón térmico', dbf(0.025, 1.00866492)[0], '180.9', tol=1e-3); num(D, 'λ He (0.04 eV)', dbf(0.04, 4.0026)[0], '71.8', tol=1e-3); num(D, 'λ C₆₀ (1 eV)', dbf(1, 720)[0], '1.07', tol=1e-2); num(D, 'pelota de tenis λ (10⁻³⁴ m)', h / (0.06 * 30) / 1e-34, '3.7', tol=0.01)
num(D, 'a₀ por incertidumbre', rmin.x * 1e12, '52.918'); num(D, 'E por incertidumbre', rmin.fun / qe, '-13.6057')
num(D, 'λ valor inicial', dbf(54, me_u)[0], '166.891'); num(D, 'λ nr valor inicial', dbf(54, me_u)[1], '166.895'); num(D, 'v/c valor inicial', dbf(54, me_u)[2], '0.0145368'); num(D, 'pc valor inicial', dbf(54, me_u)[3], '7429.05')
Tq2, Mq2 = symbols('T M', positive=True)
mqq = Mq2 * uq; Tj = Tq2 * qeq; pcq = sqrt(Tj * (Tj + 2 * mqq * cq ** 2))
fs(D, 'lam', hq * cq / pcq * sp.Float('1e12', 40)); fs(D, 'lnr', hq / sqrt(2 * mqq * Tj) * sp.Float('1e12', 40)); fs(D, 'b', pcq / (Tj + mqq * cq ** 2)); fs(D, 'pc', pcq / qeq)
