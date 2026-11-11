# -*- coding: utf-8 -*-
"""Capítulo 18 — Mecánica estadística."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, Function, solve, simplify, oo, sinh, gamma, zeta, summation, binomial
import mpmath as mp
from scipy.integrate import quad
from scipy.optimize import minimize_scalar, brentq
from scipy.special import zeta as szeta

EX = {'boltzmann-dos-niveles': 'dos-niveles', 'einstein-solido': 'einstein', 'sackur-tetrode': 'sackur', 'fermi-dirac': 'fermi', 'bose-einstein': 'bose'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
kB = 1.380649e-23; NA = 6.02214076e23; Rg = kB * NA; h = 6.62607015e-34; hb = h / (2 * math.pi); qe = 1.602176634e-19; me = 9.1093837015e-31
kq = sp.Float('1.380649e-23', 40); NAq = sp.Float('6.02214076e23', 40); Rq = kq * NAq; hq = sp.Float('6.62607015e-34', 40); eq_ = sp.Float('1.602176634e-19', 40); meq = sp.Float('9.1093837015e-31', 40)
hbq = hq / (2 * pi)
mm = lambda M: M * 1e-3 / NA
mp.mp.dps = 30

# ---------------------------------------------------------------- Boltzmann y dos niveles
D = 'boltzmann-dos-niveles'
be, De, ee, E, a_, Z, x_, k, T, N = S('beta Delta eps E a Z x k T N')
Om = Function('Om')
series_is(D, 'ln Ω_R(E − ε) ≃ ln Ω_R(E) − ε a/E con Ω_R = E^a y β = ∂lnΩ/∂E = a/E', a_ * log(E - ee), ee, 0, 2, a_ * log(E) - a_ * ee / E)
ident(D, 'β = ∂lnΩ_R/∂E = a/E = 1/(kT)', diff(a_ * log(E), E), a_ / E)
ident(D, 'Z = Σ e^(−βε_i) con los dos niveles 0 y Δ', 1 + exp(-be * De), 1 + exp(-be * De))
Z2 = 1 + exp(-be * De)
ident(D, 'P₀ + P₁ = 1', 1 / Z2 + exp(-be * De) / Z2, 1)
ident(D, 'P₁ = 1/(e^(βΔ) + 1)', exp(-be * De) / Z2, 1 / (exp(be * De) + 1))
U2 = -diff(log(Z2), be)
ident(D, 'U = −∂lnZ/∂β = Δ/(e^(βΔ) + 1)', U2, De / (exp(be * De) + 1))
ident(D, 'U = Σ ε_i P_i = Δ P₁', De * exp(-be * De) / Z2, U2)
Tt = Symbol('Tt', positive=True)
Ut = De / (exp(De / (k * Tt)) + 1)
xx = De / (k * Tt)
ident(D, 'C = ∂U/∂T = N k x² eˣ/(1 + eˣ)²', diff(Ut, Tt) / k, xx ** 2 * exp(xx) / (1 + exp(xx)) ** 2)
F2 = -k * Tt * log(1 + exp(-De / (k * Tt)))
ident(D, 'S = −∂F/∂T = k[ln(1 + e^−x) + x/(eˣ + 1)]', -diff(F2, Tt) / k, log(1 + exp(-xx)) + xx / (exp(xx) + 1))
ident(D, 'S = (U − F)/T', (Ut - F2) / Tt / k, log(1 + exp(-xx)) + xx / (exp(xx) + 1))
xs = Symbol('xs', positive=True)
ident(D, 'T → ∞: S/Nk → ln 2', sp.limit(log(1 + exp(-xs)) + xs / (exp(xs) + 1), xs, 0), log(2))
series_is(D, 'T → ∞: C/Nk ≃ x²/4', xs ** 2 * exp(xs) / (1 + exp(xs)) ** 2, xs, 0, 3, xs ** 2 / 4)
# sistema + baño de N_R espines: P₁/P₀ = Ω_R(E − Δ)/Ω_R(E) → e^(−Δ/kT)
NR = 10 ** 6
for m_exc in (10 ** 3, 10 ** 4, 10 ** 5):
    ratio = m_exc / (NR - m_exc + 1)         # C(NR, m−1)/C(NR, m)
    boltz = m_exc / (NR - m_exc)             # e^(−βΔ) con 1/kT = ∂lnΩ/∂E = ln((NR − m)/m)/Δ
    rec(G_STEP, D, f'baño de 10⁶ espines con {m_exc} excitados: P₁/P₀ = e^(−Δ/kT)', ratio, boltz, 'rel 1e-3', abs(ratio / boltz - 1) < 1e-3)
# suma directa de 6 niveles con energías aleatorias: U = −∂lnZ/∂β = ΣεP, C = k β²(⟨ε²⟩ − ⟨ε⟩²)
eps = [0.0, 0.7, 1.1, 1.1, 2.3, 4.0]
lnZ = lambda b: mp.log(sum(mp.e ** (-b * e_) for e_ in eps))
b0 = mp.mpf('0.9')
Uex = -mp.diff(lnZ, b0)
Zs = sum(mp.e ** (-b0 * e_) for e_ in eps); Uav = sum(e_ * mp.e ** (-b0 * e_) for e_ in eps) / Zs
rec(G_STEP, D, 'seis niveles: U = −∂lnZ/∂β = Σ ε_i P_i', float(Uex), float(Uav), 'rel 1e-12', abs(Uex - Uav) < 1e-12 * abs(Uav))
varE = sum(e_ ** 2 * mp.e ** (-b0 * e_) for e_ in eps) / Zs - Uav ** 2
rec(G_STEP, D, 'seis niveles: ∂²lnZ/∂β² = ⟨ε²⟩ − ⟨ε⟩² (fluctuación = kT²C)', float(mp.diff(lnZ, b0, 2)), float(varE), 'rel 1e-10', abs(mp.diff(lnZ, b0, 2) - varE) < 1e-10 * abs(varE))
uD = {'P': '1', 'eps': 'J', 'beta': 'J^-1', 'Z': '1', 'Delta': 'J', 'x': '1', 'U': 'J', 'F': 'J', 'C': 'J K^-1', 'S': 'J K^-1', 'N': '1', 'k': 'J K^-1', 'T': 'K'}
Cs, Ss, Us, Ps = [Symbol(s_, positive=True) for s_ in ('C', 'S', 'U', 'P')]
dimcheck(D, 'x = Δ/kT adimensional', x_, De / (k * T), dict(uD, x='1'))
dimcheck(D, 'P₁ = 1/(e^(βΔ) + 1)', Ps, 1 / (exp(be * De) + 1), uD)
dimcheck(D, 'U/N = Δ/(e^x + 1)', Us, De / (exp(De / (k * T)) + 1), uD)
dimcheck(D, 'C = N k x² eˣ/(1 + eˣ)²', Cs, N * k * (De / (k * T)) ** 2 * exp(De / (k * T)) / (1 + exp(De / (k * T))) ** 2, uD)
dimcheck(D, 'S = N k [ln(1 + e^−x) + x/(eˣ + 1)]', Ss, N * k * (log(1 + exp(-De / (k * T))) + (De / (k * T)) / (exp(De / (k * T)) + 1)), uD)
tl = lambda D_, T_: (lambda x: (x, 1 / (1 + math.exp(x)), D_ / (1 + math.exp(x)), x * x * math.exp(x) / (1 + math.exp(x)) ** 2, math.log(1 + math.exp(-x)) + x / (math.exp(x) + 1)))(D_ * 1e-3 * qe / (kB * T_))
num(D, 'x (10 meV, 100 K)', tl(10, 100)[0], '1.1605'); num(D, 'P₁', tl(10, 100)[1], '0.2386'); num(D, 'U/N (meV)', tl(10, 100)[2], '2.386'); num(D, 'C/Nk', tl(10, 100)[3], '0.2446'); num(D, 'S/Nk', tl(10, 100)[4], '0.5494')
num(D, 'x (1000 K)', tl(10, 1000)[0], '0.1160'); num(D, 'P₁ (1000 K)', tl(10, 1000)[1], '0.4710'); num(D, 'S/Nk (1000 K)', tl(10, 1000)[4], '0.69147'); num(D, 'ln 2', math.log(2), '0.6931'); num(D, 'x (30 K)', tl(10, 30)[0], '3.868'); num(D, 'C/Nk (30 K)', tl(10, 30)[3], '0.3000')
rs = minimize_scalar(lambda x: -(x * x * math.exp(x) / (1 + math.exp(x)) ** 2), bounds=(0.5, 5), method='bounded', options={'xatol': 1e-10})
num(D, 'x del máximo de Schottky', rs.x, '2.399'); num(D, 'C/Nk máximo', -rs.fun, '0.4392'); num(D, 'T del máximo (10 meV)', 10e-3 * qe / (kB * rs.x), '48.4'); num(D, 'C/Nk (1000 K)', tl(10, 1000)[3], '0.003355'); num(D, 'P₁ (Δ = 1 meV, 100 K)', tl(1, 100)[1], '0.4710')
num(D, 'x valor inicial', tl(10, 100)[0], '1.16045'); num(D, 'P₁ valor inicial', tl(10, 100)[1], '0.238585'); num(D, 'U/N valor inicial', tl(10, 100)[2], '2.38585'); num(D, 'C/Nk valor inicial', tl(10, 100)[3], '0.244635'); num(D, 'S/Nk valor inicial', tl(10, 100)[4], '0.549444')
Dq, Tq = symbols('D T', positive=True)
xq = Dq * sp.Rational(1, 1000) * eq_ / (kq * Tq)
fs(D, 'x', xq); fs(D, 'p1', 1 / (1 + exp(xq))); fs(D, 'U', Dq / (1 + exp(xq))); fs(D, 'C', xq ** 2 * exp(xq) / (1 + exp(xq)) ** 2); fs(D, 'S', log(1 + exp(-xq)) + xq / (exp(xq) + 1))

# ---------------------------------------------------------------- Einstein
D = 'einstein-solido'
nn = Symbol('nn', integer=True, nonnegative=True)
xe = Symbol('xe', positive=True)
Zs_ = summation(exp(-xe * (nn + R_(1, 2))), (nn, 0, oo))
ident(D, 'Z = Σ e^(−x(n+½)) = e^(−x/2)/(1 − e^−x)', Zs_, exp(-xe / 2) / (1 - exp(-xe)))
ident(D, 'Z = 1/(2 sinh(x/2))', exp(-xe / 2) / (1 - exp(-xe)), 1 / (2 * sinh(xe / 2)))
hw, bq_ = S('hw beta')
Zb = 1 / (2 * sinh(bq_ * hw / 2))
ident(D, '⟨E⟩ = −∂lnZ/∂β = ħω(½ + 1/(e^x − 1))', -diff(log(Zb), bq_), hw * (R_(1, 2) + 1 / (exp(bq_ * hw) - 1)))
Tq2, th_, R = S('T theta R')
Em = R * th_ * 3 * (R_(1, 2) + 1 / (exp(th_ / Tq2) - 1))
xt = th_ / Tq2
ident(D, 'C = ∂U/∂T = 3R x² eˣ/(eˣ − 1)²', diff(Em, Tq2), 3 * R * xt ** 2 * exp(xt) / (exp(xt) - 1) ** 2)
series_is(D, 'x → 0: x²eˣ/(eˣ − 1)² ≃ 1 − x²/12', xe ** 2 * exp(xe) / (exp(xe) - 1) ** 2, xe, 0, 4, 1 - xe ** 2 / 12)
ident(D, 'x → ∞: C → 3R x² e^−x', sp.limit((xe ** 2 * exp(xe) / (exp(xe) - 1) ** 2) / (xe ** 2 * exp(-xe)), xe, oo), 1)
ident(D, 'n̄ = 1/(e^x − 1) = valor de Bose–Einstein con μ = 0', 1 / (exp(xe) - 1), 1 / (exp(xe) - 1))
# suma directa de niveles (mpmath) y derivada numérica respecto de T
def cv_sum(th, T):
    x0 = mp.mpf(th) / mp.mpf(T)
    f = lambda Tn: sum((mp.mpf(n) + mp.mpf(1) / 2) * mp.mpf(th) * mp.e ** (-(mp.mpf(n) + mp.mpf(1) / 2) * mp.mpf(th) / Tn) for n in range(0, 400)) / sum(mp.e ** (-(mp.mpf(n) + mp.mpf(1) / 2) * mp.mpf(th) / Tn) for n in range(0, 400))
    return 3 * mp.mpf(Rg) * mp.diff(f, mp.mpf(T))
for (th, T) in ((1320, 300), (300, 300), (300, 30), (300, 3000)):
    ref = 3 * Rg * (th / T) ** 2 * math.exp(th / T) / (math.exp(th / T) - 1) ** 2
    got = float(cv_sum(th, T))
    rec(G_STEP, D, f'suma directa de niveles y derivada: C_v (θ = {th}, T = {T})', got, ref, 'rel 1e-8', abs(got / ref - 1) < 1e-8)
uE = {'E': 'J', 'hw': 'J', 'x': '1', 'theta': 'K', 'Z': '1', 'Cv': 'J mol^-1 K^-1', 'R': 'J mol^-1 K^-1', 'T': 'K', 'nb': '1'}
dimcheck(D, 'x = ħω/kT = θ/T', xe, th_ / Tq2, dict(uE, xe='1'))
dimcheck(D, 'C_v = 3R x² eˣ/(eˣ − 1)²', Symbol('Cv', positive=True), 3 * R * xt ** 2 * exp(xt) / (exp(xt) - 1) ** 2, uE)
dimcheck(D, '⟨E⟩ = ħω(½ + n̄)', Symbol('E', positive=True), hw * (R_(1, 2) + 1 / (exp(hw / (Symbol('kT', positive=True))) - 1)), dict(uE, kT='J'))
ei = lambda th, T: (lambda x: (3 * Rg * x * x * math.exp(x) / (math.exp(x) - 1) ** 2, 3 * x * x * math.exp(x) / (math.exp(x) - 1) ** 2 * Rg / (3 * Rg), 1 / (math.exp(x) - 1), 3 * Rg * th * (0.5 + 1 / (math.exp(x) - 1))))(th / T)
num(D, 'C_v (diamante, 300 K)', ei(1320, 300)[0], '6.077'); num(D, 'C_v/3R (%)', ei(1320, 300)[1] * 100, '24.4'); num(D, 'C_v (1000 K)', ei(1320, 1000)[0], '21.62'); num(D, 'C_v/3R (1000 K) %', ei(1320, 1000)[1] * 100, '86.7'); num(D, 'C_v (100 K) 10⁻³', ei(1320, 100)[0] / 1e-3, '8.0')
num(D, 'C_v (θ = T = 300)', ei(300, 300)[0], '22.96'); num(D, 'C_v/3R (%)', ei(300, 300)[1] * 100, '92.1'); num(D, 'C_v (3000 K)', ei(300, 3000)[0], '24.92'); num(D, 'C_v/3R (3000 K) %', ei(300, 3000)[1] * 100, '99.92'); num(D, 'C_v (30 K)', ei(300, 30)[0], '0.113')
vib = lambda th, T: (th / T) ** 2 * math.exp(th / T) / (math.exp(th / T) - 1) ** 2
num(D, 'N₂ vib. 300 K', vib(3374, 300), '0.00165'); num(D, 'N₂ vib. 1000 K', vib(3374, 1000), '0.418'); num(D, 'N₂ vib. 2000 K', vib(3374, 2000), '0.793'); num(D, 'H₂ vib. 300 K (10⁻⁷)', vib(6215, 300) / 1e-7, '4.3')
num(D, 'C_v valor inicial', ei(1320, 300)[0], '6.07708'); num(D, 'C/3R valor inicial', ei(1320, 300)[1], '0.243635'); num(D, 'n̄ valor inicial (10⁻²)', ei(1320, 300)[2] / 1e-2, '1.24299'); num(D, 'U valor inicial', ei(1320, 300)[3], '16871.9'); num(D, 'U punto cero', 3 * Rg * 1320 / 2, '16462.6')
thq, Tq3 = symbols('th T', positive=True)
xq3 = thq / Tq3
fs(D, 'C', 3 * Rq * xq3 ** 2 * exp(xq3) / (exp(xq3) - 1) ** 2); fs(D, 'CR', xq3 ** 2 * exp(xq3) / (exp(xq3) - 1) ** 2); fs(D, 'nb', 1 / (exp(xq3) - 1)); fs(D, 'U', 3 * Rq * thq * (R_(1, 2) + 1 / (exp(xq3) - 1)))

# ---------------------------------------------------------------- Sackur–Tetrode
D = 'sackur-tetrode'
p_, mq, Vq, Nq, lam, kT = S('p m V N lam kT')
integral(D, '∫e^(−p_x²/2mkT) dp_x = √(2πmkT)', exp(-Symbol('px', real=True) ** 2 / (2 * mq * kT)), Symbol('px', real=True), -oo, oo, sqrt(2 * pi * mq * kT))
ident(D, 'z = V(2πmkT)^(3/2)/h³ = V/λ³ con λ = h/√(2πmkT)', Vq * (2 * pi * mq * kT) ** R_(3, 2) / Symbol('h', positive=True) ** 3, Vq / (Symbol('h', positive=True) / sqrt(2 * pi * mq * kT)) ** 3)
bT = Symbol('b', positive=True)
lb = Symbol('hh', positive=True) * sqrt(bT) / sqrt(2 * pi * mq)    # λ(β)
lnZ = Nq * log(Vq / lb ** 3) - (Nq * log(Nq) - Nq)
ident(D, 'F = −kT ln Z = −NkT[ln(V/(Nλ³)) + 1]', -(1 / bT) * lnZ, -(Nq / bT) * (log(Vq / (Nq * lb ** 3)) + 1))
ident(D, 'p = −∂F/∂V = NkT/V', -diff(-(Nq / bT) * (log(Vq / (Nq * lb ** 3)) + 1), Vq), Nq / (bT * Vq))
ident(D, 'U = −∂lnZ/∂β = 3N/(2β)', -diff(lnZ, bT), R_(3, 2) * Nq / bT)
Fx = -(Nq / bT) * (log(Vq / (Nq * lb ** 3)) + 1)
ident(D, 'S = (U − F)/T = Nk[ln(V/(Nλ³)) + 5/2]  (k = 1, T = 1/β)', (R_(3, 2) * Nq / bT - Fx) * bT, Nq * (log(Vq / (Nq * lb ** 3)) + R_(5, 2)))
# S = −∂F/∂T con derivada numérica (mpmath), independiente de la algebra
def S_num(T_, p_bar, M):
    m = mm(M); n = p_bar * 1e5 / (kB * T_)
    Ff = lambda Tn: -mp.mpf(kB) * Tn * (mp.log(1 / (mp.mpf(n) * (mp.mpf(h) / mp.sqrt(2 * mp.pi * mp.mpf(m) * mp.mpf(kB) * Tn)) ** 3)) + 1)
    return float(-mp.diff(Ff, mp.mpf(T_)))   # S por partícula con V/N fijo = 1/n
for (T_, p_, M_) in ((298.15, 1.0, 4.0026), (500.0, 1.0, 39.948)):
    # a V/N fijo (n constante), S/N = k[ln(1/(nλ³)) + 5/2]
    m_ = mm(M_); n_ = p_ * 1e5 / (kB * T_); lam_ = h / math.sqrt(2 * math.pi * m_ * kB * T_)
    ref = kB * (math.log(1 / (n_ * lam_ ** 3)) + 2.5)
    got = S_num(T_, p_, M_)
    rec(G_STEP, D, f'S = −∂F/∂T por derivada numérica (T = {T_}, M = {M_})', got, ref, 'rel 1e-9', abs(got / ref - 1) < 1e-9)
# Stirling
for N_ in (10 ** 3, 10 ** 6):
    ex = float(mp.loggamma(N_ + 1)); ap = N_ * math.log(N_) - N_
    rec(G_STEP, D, f'Stirling: ln N! ≈ N ln N − N (N = {N_}), error relativo', abs(ex - ap) / ex, 0.0, 'rel 1e-2', abs(ex - ap) / ex < (1e-2 if N_ == 10 ** 3 else 1e-5))
uS = {'S': 'J K^-1', 'N': '1', 'k': 'J K^-1', 'lam': 'm', 'V': 'm^3', 'm': 'kg', 'h': 'J s', 'T': 'K', 'p': 'Pa', 'n': 'm^-3', 'F': 'J'}
hs = Symbol('h', positive=True); Tk = Symbol('T', positive=True)
dimcheck(D, 'λ = h/√(2πmkT)', lam, hs / sqrt(2 * pi * mq * k * Tk), uS)
dimcheck(D, 'V/(Nλ³) adimensional', Symbol('q', positive=True), Vq / (Nq * lam ** 3), dict(uS, q='1'))
dimcheck(D, 'S = Nk[ln(V/(Nλ³)) + 5/2]', Symbol('S', positive=True), Nq * k * (log(Vq / (Nq * lam ** 3)) + R_(5, 2)), uS)
dimcheck(D, 'p = NkT/V', Symbol('p', positive=True), Nq * k * Tk / Vq, uS)
st_ = lambda T_, p_b, M_: (lambda m_: (lambda lam_, n_: (h / math.sqrt(2 * math.pi * m_ * kB * T_) * 1e12, n_ * lam_ ** 3, Rg * (math.log(1 / (n_ * lam_ ** 3)) + 2.5), math.log(1 / (n_ * lam_ ** 3)) + 2.5))(h / math.sqrt(2 * math.pi * m_ * kB * T_), p_b * 1e5 / (kB * T_)))(mm(M_))
num(D, 'λ (He) pm', st_(298.15, 1, 4.0026)[0], '50.54'); num(D, 'nλ³ (He) 10⁻⁶', st_(298.15, 1, 4.0026)[1] / 1e-6, '3.136'); num(D, 'S (He)', st_(298.15, 1, 4.002602)[2], '126.15'); num(D, 'S (Ne)', st_(298.15, 1, 20.1797)[2], '146.33'); num(D, 'S (Ar)', st_(298.15, 1, 39.948)[2], '154.85'); num(D, 'S (Kr)', st_(298.15, 1, 83.798)[2], '164.09'); num(D, 'S (Xe)', st_(298.15, 1, 131.293)[2], '169.69')
num(D, 'ΔS al duplicar T (5R/2 ln 2)', 2.5 * Rg * math.log(2), '14.41'); num(D, 'S (596.3 K)', st_(596.3, 1, 4.0026)[2], '140.56'); num(D, 'R ln 10', Rg * math.log(10), '19.14'); num(D, 'S (10 bar)', st_(298.15, 10, 4.0026)[2], '107.01'); num(D, '3R/2 ln 2', 1.5 * Rg * math.log(2), '8.645'); num(D, 'S (M = 8.0052)', st_(298.15, 1, 8.0052)[2], '134.80')
num(D, 'λ (He, 4.2 K) pm', st_(4.2, 1, 4.0026)[0], '425.8'); num(D, 'nλ³ (He, 4.2 K)', st_(4.2, 1, 4.0026)[1], '0.133'); num(D, 'S (He, 4.2 K)', st_(4.2, 1, 4.0026)[2], '37.55')
num(D, 'S valor inicial', st_(298.15, 1, 4.0026)[2], '126.153'); num(D, 'λ valor inicial', st_(298.15, 1, 4.0026)[0], '50.5372'); num(D, 'nλ³ valor inicial (10⁻⁶)', st_(298.15, 1, 4.0026)[1] / 1e-6, '3.13557'); num(D, 'S/Nk valor inicial', st_(298.15, 1, 4.0026)[3], '15.1727')
Mq4, pq4 = symbols('M p', positive=True)
m4 = Mq4 * sp.Rational(1, 1000) / NAq
lam4 = hq / sqrt(2 * pi * m4 * kq * Tq3)
n4 = pq4 * 100000 / (kq * Tq3)
fs(D, 'S', Rq * (log(1 / (n4 * lam4 ** 3)) + R_(5, 2))); fs(D, 'lam', lam4 * 10 ** 12); fs(D, 'nl3', n4 * lam4 ** 3); fs(D, 'Sk', log(1 / (n4 * lam4 ** 3)) + R_(5, 2))

# ---------------------------------------------------------------- Fermi–Dirac
D = 'fermi-dirac'
eP, mu, bF = S('eps mu beta')
Xi = 1 + exp(-bF * (eP - mu))
ident(D, '⟨n⟩ = e^(−β(ε−μ))/(1 + e^(−β(ε−μ))) = 1/(e^(β(ε−μ)) + 1)', exp(-bF * (eP - mu)) / Xi, 1 / (exp(bF * (eP - mu)) + 1))
ident(D, '⟨n⟩ = ∂lnΞ/∂(βμ)', diff(log(Xi.subs(mu, Symbol('c', positive=True) / bF)), Symbol('c', positive=True)).subs(Symbol('c', positive=True), mu * bF), 1 / (exp(bF * (eP - mu)) + 1))
n_, kF, VF, EF, Nn, mF, hbar = S('n kF V EF N m hbar')
solves(D, 'N = 2V/(2π)³ · (4/3)πk_F³ ⇒ k_F = (3π²n)^(1/3)', [Eq(Nn, 2 * VF / (2 * pi) ** 3 * R_(4, 3) * pi * kF ** 3), Eq(Nn, n_ * VF)], kF, (3 * pi ** 2 * n_) ** R_(1, 3), vars=[kF, Nn])
ident(D, 'E_F = ħ²k_F²/2m = (ħ²/2m)(3π²n)^(2/3)', hbar ** 2 * ((3 * pi ** 2 * n_) ** R_(1, 3)) ** 2 / (2 * mF), hbar ** 2 / (2 * mF) * (3 * pi ** 2 * n_) ** R_(2, 3))
ee_ = Symbol('e', positive=True)
Ne = Nn * (ee_ / EF) ** R_(3, 2)
ident(D, 'g(ε) = dN/dε = (3N/2E_F)(ε/E_F)^(1/2)', diff(Ne, ee_), R_(3, 2) * Nn / EF * sqrt(ee_ / EF))
ident(D, 'g(E_F) = 3N/(2E_F)', diff(Ne, ee_).subs(ee_, EF), R_(3, 2) * Nn / EF)
Cs_ = (pi ** 2 / 3) * k * Symbol('T', positive=True) * k * (R_(3, 2) * Nn / EF)
ident(D, 'C = (π²/3)k²T g(E_F) = (π²/2)Nk T/T_F', Cs_, pi ** 2 / 2 * Nn * k * Symbol('T', positive=True) / (EF / k))
ident(D, 'U(T) − U(0) = (π²/6)(kT)² g ⇒ C = ∂/∂T', diff(pi ** 2 / 6 * (k * Symbol('T', positive=True)) ** 2 * R_(3, 2) * Nn / EF, Symbol('T', positive=True)), Cs_)
# lema de Sommerfeld, verificación numérica con mpmath
def sommer(Hf, mu_, kT_):
    I = mp.quad(lambda e_: Hf(e_) / (mp.e ** ((e_ - mu_) / kT_) + 1), [0, mu_, mu_ + 40 * kT_])
    H0 = mp.quad(Hf, [0, mu_])
    d1 = mp.diff(Hf, mu_, 1); d3 = mp.diff(Hf, mu_, 3)
    return I, H0 + mp.pi ** 2 / 6 * kT_ ** 2 * d1 + 7 * mp.pi ** 4 / 360 * kT_ ** 4 * d3
for (muv, kTv) in ((1.0, 0.02), (1.0, 0.05)):
    I, A_ = sommer(lambda e_: e_ ** mp.mpf(1.5), mp.mpf(muv), mp.mpf(kTv))
    rec(G_STEP, D, f'lema de Sommerfeld para H = ε^(3/2) (kT/μ = {kTv}), error relativo', float(abs(I - A_) / I), 0.0, 'rel 1e-6', abs(I - A_) / I < 1e-6)
# C a partir de U(T) con N fijo (mpmath) para kT/E_F pequeño
def U_of_T(t):   # E_F = 1, N = 1, g(ε) = (3/2)ε^(1/2)
    t = mp.mpf(t)
    Nfun = lambda mu_: mp.quad(lambda e_: mp.mpf(1.5) * mp.sqrt(e_) / (mp.e ** ((e_ - mu_) / t) + 1), [0, 1, 1 + 40 * t])
    mu0 = mp.findroot(lambda mu_: Nfun(mu_) - 1, 1 - mp.pi ** 2 / 12 * t ** 2)
    return mp.quad(lambda e_: e_ * mp.mpf(1.5) * mp.sqrt(e_) / (mp.e ** ((e_ - mu0) / t) + 1), [0, 1, 1 + 40 * t])
t0 = mp.mpf('0.01')
Cnum = mp.diff(U_of_T, t0)
Cth = mp.pi ** 2 / 2 * t0
rec(G_STEP, D, 'C = ∂U/∂T con N fijo y μ(T) numérico (kT/E_F = 0.01) frente a (π²/2) T/T_F', float(Cnum), float(Cth), 'rel 2e-3', abs(Cnum / Cth - 1) < 2e-3)
dU = U_of_T(t0) - U_of_T(mp.mpf('1e-4'))
rec(G_STEP, D, 'U(T) − U(0) = (π²/6)(kT)² g(E_F) (kT/E_F = 0.01)', float(dU), float(mp.pi ** 2 / 6 * t0 ** 2 * 1.5), 'rel 3e-3', abs(dU / (mp.pi ** 2 / 6 * t0 ** 2 * 1.5) - 1) < 3e-3)
uF = {'eps': 'J', 'mu': 'J', 'beta': 'J^-1', 'n': 'm^-3', 'kF': 'm^-1', 'EF': 'J', 'hbar': 'J s', 'm': 'kg', 'C': 'J K^-1', 'N': '1', 'k': 'J K^-1', 'T': 'K', 'vF': 'm s^-1', 'TF': 'K'}
dimcheck(D, 'k_F = (3π²n)^(1/3)', kF, (3 * pi ** 2 * n_) ** R_(1, 3), uF)
dimcheck(D, 'E_F = (ħ²/2m)(3π²n)^(2/3)', EF, hbar ** 2 / (2 * mF) * (3 * pi ** 2 * n_) ** R_(2, 3), uF)
dimcheck(D, 'v_F = ħk_F/m', Symbol('vF', positive=True), hbar * kF / mF, uF)
dimcheck(D, 'C = (π²/2)Nk T/T_F', Symbol('C', positive=True), pi ** 2 / 2 * Nn * k * Symbol('T', positive=True) / Symbol('TF', positive=True), uF)
dimcheck(D, 'βε adimensional', Symbol('q', positive=True), bF * eP, dict(uF, q='1'))
fm = lambda n28, ms, T: (lambda kF_, m_: (lambda EF_: (EF_ / qe, EF_ / kB, hb * kF_ / m_, math.pi ** 2 / 2 * T / (EF_ / kB), math.pi ** 2 / 2 * Rg / (EF_ / kB) * 1e3))(hb ** 2 * kF_ ** 2 / (2 * m_)))((3 * math.pi ** 2 * n28 * 1e28) ** (1 / 3), ms * me)
num(D, 'E_F (Cu)', fm(8.47, 1, 300)[0], '7.033'); num(D, 'T_F (Cu)', fm(8.47, 1, 300)[1], '81612', tol=1e-5); num(D, 'v_F (10⁶ m/s)', fm(8.47, 1, 300)[2] / 1e6, '1.573'); num(D, 'v_F/c (%)', fm(8.47, 1, 300)[2] / 2.99792458e8 * 100, '0.5', tol=0.06)
num(D, 'E_F (Na)', fm(2.65, 1, 300)[0], '3.241'); num(D, 'E_F (Al)', fm(18.1, 1, 300)[0], '11.67'); num(D, 'E_F (Au)', fm(5.90, 1, 300)[0], '5.526')
num(D, 'C_el/Nk (300 K)', fm(8.47, 1, 300)[3], '0.01814'); num(D, 'C_el/(3Nk/2) (%)', fm(8.47, 1, 300)[3] / 1.5 * 100, '1.2', tol=0.02); num(D, 'γ (Cu)', fm(8.47, 1, 300)[4], '0.503'); num(D, 'm*/m = 0.695/0.503', 0.695 / fm(8.47, 1, 300)[4], '1.38', tol=0.005)
num(D, 'E_F (m* = 2m)', fm(8.47, 2, 300)[0], '3.516'); num(D, 'aumento de E_F (2n)', fm(16.94, 1, 300)[0] / fm(8.47, 1, 300)[0] * 100 - 100, '58.7'); num(D, 'E_F (2n)', fm(16.94, 1, 300)[0], '11.16'); num(D, 'C_el/Nk (2n)', fm(16.94, 1, 300)[3], '0.01143'); num(D, 'C_el/Nk (3000 K)', fm(8.47, 1, 3000)[3], '0.1814'); num(D, 'C_el/Nk (1 K) 10⁻⁵', fm(8.47, 1, 1)[3] / 1e-5, '6.05')
num(D, 'E_F valor inicial', fm(8.47, 1, 300)[0], '7.03276'); num(D, 'T_F valor inicial', fm(8.47, 1, 300)[1], '81611.8'); num(D, 'v_F valor inicial (10⁶)', fm(8.47, 1, 300)[2] / 1e6, '1.57285'); num(D, 'C_el valor inicial', fm(8.47, 1, 300)[3], '0.0181400'); num(D, 'γ valor inicial', fm(8.47, 1, 300)[4], '0.502749')
nq, msq = symbols('n ms', positive=True)
kFq = (3 * pi ** 2 * nq * 10 ** 28) ** R_(1, 3)
EFq = hbq ** 2 * kFq ** 2 / (2 * msq * meq)
fs(D, 'EF', EFq / eq_); fs(D, 'TF', EFq / kq); fs(D, 'vF', hbq * kFq / (msq * meq)); fs(D, 'Ce', pi ** 2 / 2 * Tq3 / (EFq / kq)); fs(D, 'gam', pi ** 2 / 2 * Rq / (EFq / kq) * 1000)

# ---------------------------------------------------------------- Bose–Einstein
D = 'bose-einstein'
nb_ = Symbol('nb', integer=True, nonnegative=True)
eB, muB, bB = S('eps mu beta')
y_ = Symbol('y', positive=True)
Xib = summation(exp(-nb_ * y_), (nb_, 0, oo))
for yv in (0.3, 1.0, 2.5):
    sm = mp.nsum(lambda n_: mp.e ** (-n_ * yv), [0, mp.inf]); rf = 1 / (1 - mp.e ** (-yv))
    rec(G_STEP, D, f'Ξ = Σ e^(−n y) = 1/(1 − e^(−y)) (suma numérica, y = {yv})', float(sm), float(rf), 'rel 1e-12', abs(sm / rf - 1) < 1e-12)
ident(D, 'serie geométrica: Σ r^n (1 − r) = 1 con r = e^(−y)', (1 / (1 - exp(-y_))) * (1 - exp(-y_)), 1)
ident(D, '⟨n⟩ = −∂lnΞ/∂y = 1/(e^y − 1)', -diff(log(1 / (1 - exp(-y_))), y_), 1 / (exp(y_) - 1))
xx_ = Symbol('xx', positive=True)
Ig = mp.quad(lambda t: mp.sqrt(t) / (mp.e ** t - 1), [0, 1, 10, mp.inf])
rec(G_STEP, D, '∫₀^∞ x^(1/2)/(eˣ − 1) dx = Γ(3/2) ζ(3/2) (cuadratura)', float(Ig), float(mp.gamma(1.5) * mp.zeta(1.5)), 'rel 1e-12', abs(Ig / (mp.gamma(1.5) * mp.zeta(1.5)) - 1) < 1e-12)
ident(D, 'Γ(3/2) = √π/2', gamma(R_(3, 2)), sqrt(pi) / 2)
mB, kT_, hbB, hB, nB = S('m kT hbar h n')
nex = 1 / (4 * pi ** 2) * (2 * mB * kT_ / hbB ** 2) ** R_(3, 2) * sqrt(pi) / 2
ident(D, 'N_ex/V = (1/4π²)(2mkT/ħ²)^(3/2) Γ(3/2) ζ(3/2) = ζ(3/2)/λ³ (con ħ = h/2π)', (nex.subs(hbB, hB / (2 * pi))) , 1 / (hB / sqrt(2 * pi * mB * kT_)) ** 3)
Tcs = 2 * pi * hbB ** 2 / (mB * Symbol('kk', positive=True)) * (nB / Symbol('z', positive=True)) ** R_(2, 3)
ident(D, 'n λ_Tc³ = ζ(3/2) ⇒ T_c = (2πħ²/mk)(n/ζ)^(2/3)', (nB * (hB / sqrt(2 * pi * mB * Symbol('kk', positive=True) * Tcs)) ** 3).subs(hB, 2 * pi * hbB) / Symbol('z', positive=True), 1)
TT, Tc_ = S('T Tc')
ident(D, 'N₀/N = 1 − N_ex/N = 1 − (T/T_c)^(3/2)', 1 - ((TT / Tc_) ** R_(3, 2)), 1 - (TT / Tc_) ** R_(3, 2))
ident(D, 'N_ex ∝ λ_T⁻³ ∝ T^(3/2)', (1 / (1 / sqrt(TT)) ** 3) / (1 / (1 / sqrt(Tc_)) ** 3), (TT / Tc_) ** R_(3, 2))
# comprobación numérica: N_ex(T_c) = N con la integral de la densidad de estados
def Tc_num(n, M):
    m = mm(M)
    pref = 1 / (4 * math.pi ** 2) * (2 * m * kB / hb ** 2) ** 1.5 * float(Ig)      # N_ex/V = pref·T^(3/2)
    return (n / pref) ** (2 / 3)
for (n_, M_) in ((2.18e28, 4.0026), (1e20, 86.909)):
    Tc_f = 2 * math.pi * hb ** 2 / (mm(M_) * kB) * (n_ / float(szeta(1.5))) ** (2 / 3)
    rec(G_STEP, D, f'T_c por cuadratura de la densidad de estados (n = {n_:g}, M = {M_})', Tc_num(n_, M_), Tc_f, 'rel 1e-10', abs(Tc_num(n_, M_) / Tc_f - 1) < 1e-10)
uB = {'Tc': 'K', 'n': 'm^-3', 'm': 'kg', 'hbar': 'J s', 'k': 'J K^-1', 'lam': 'm', 'h': 'J s', 'T': 'K', 'f': '1', 'eps': 'J', 'mu': 'J', 'kT': 'J'}
dimcheck(D, 'T_c = (2πħ²/mk)(n/ζ)^(2/3)', Symbol('Tc', positive=True), 2 * pi * hbB ** 2 / (mB * Symbol('k', positive=True)) * (nB / Symbol('z', positive=True)) ** R_(2, 3), dict(uB, z='1'))
dimcheck(D, 'λ_T = h/√(2πmkT)', Symbol('lam', positive=True), hB / sqrt(2 * pi * mB * Symbol('kT', positive=True)), uB)
dimcheck(D, 'N₀/N = 1 − (T/T_c)^(3/2)', Symbol('f', positive=True), 1 - (TT / Tc_) ** R_(3, 2), uB)
dimcheck(D, 'nλ³ adimensional', Symbol('q', positive=True), nB * (hB / sqrt(2 * pi * mB * Symbol('kT', positive=True))) ** 3, dict(uB, q='1'))
bo = lambda n, M, T: (lambda m_: (lambda Tc: (Tc, max(0.0, 1 - (T / Tc) ** 1.5), h / math.sqrt(2 * math.pi * m_ * kB * T) * 1e9, n * (h / math.sqrt(2 * math.pi * m_ * kB * T)) ** 3))(2 * math.pi * hb ** 2 / (m_ * kB) * (n / float(szeta(1.5))) ** (2 / 3)))(mm(M))
num(D, 'T_c (He-4)', bo(2.18e28, 4.0026, 1)[0], '3.133'); num(D, 'N₀/N (1 K)', bo(2.18e28, 4.0026, 1)[1], '0.820'); num(D, 'λ_T (1 K) nm', bo(2.18e28, 4.0026, 1)[2], '0.873'); num(D, 'nλ³ (1 K)', bo(2.18e28, 4.0026, 1)[3], '14.49'); num(D, 'N₀/N (2 K)', bo(2.18e28, 4.0026, 2)[1], '0.490'); num(D, 'N₀/N (3 K)', bo(2.18e28, 4.0026, 3)[1], '0.0629')
num(D, 'T_c (Rb) nK', bo(1e20, 86.909, 1e-7)[0] * 1e9, '398.3'); num(D, 'N₀/N (100 nK)', bo(1e20, 86.909, 1e-7)[1], '0.874'); num(D, 'N₀/N (170 nK)', bo(1e20, 86.909, 1.7e-7)[1], '0.721'); num(D, 'N₀/N (300 nK)', bo(1e20, 86.909, 3e-7)[1], '0.346'); num(D, 'N₀/N (1 µK)', bo(1e20, 86.909, 1e-6)[1], '0.0'); num(D, 'nλ³ (1 µK)', bo(1e20, 86.909, 1e-6)[3], '0.657'); num(D, 'ζ(3/2)', float(szeta(1.5)), '2.612')
num(D, 'T_c(8n)/T_c(n)', bo(8 * 2.18e28, 4.0026, 1)[0] / bo(2.18e28, 4.0026, 1)[0], '4', tol=1e-9); num(D, 'T_c(m/4)/T_c', bo(2.18e28, 4.0026 / 4, 1)[0] / bo(2.18e28, 4.0026, 1)[0], '4', tol=1e-9)
num(D, 'T_c valor inicial', bo(2.18e28, 4.0026, 1)[0], '3.13284'); num(D, 'N₀/N valor inicial', bo(2.18e28, 4.0026, 1)[1], '0.819660'); num(D, 'λ_T valor inicial', bo(2.18e28, 4.0026, 1)[2], '0.872627'); num(D, 'nλ³ valor inicial', bo(2.18e28, 4.0026, 1)[3], '14.4858')
Tcf = lambda n, M: 2 * pi * hbq ** 2 / (M * sp.Rational(1, 1000) / NAq * kq) * (n / sp.Float(str(float(szeta(1.5))), 40)) ** R_(2, 3)
nbq, Mbq = symbols('n M', positive=True)
mbq = Mbq * sp.Rational(1, 1000) / NAq
fs(D, 'Tc', 2 * pi * hbq ** 2 / (mbq * kq) * (nbq / sp.Float('2.612375348685488', 40)) ** R_(2, 3))
fs(D, 'lam', hq / sqrt(2 * pi * mbq * kq * Tq3) * 10 ** 9)
fs(D, 'nl3', nbq * (hq / sqrt(2 * pi * mbq * kq * Tq3)) ** 3)
fsim_py('bose', 'f0', lambda p: max(0.0, 1 - (p['T'] / (2 * math.pi * hb ** 2 / (mm(p['M']) * kB) * (p['n'] / float(szeta(1.5))) ** (2 / 3))) ** 1.5), tol=1e-9, deriv=D)
