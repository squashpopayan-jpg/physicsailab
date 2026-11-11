# -*- coding: utf-8 -*-
"""Capítulo 41 — Biofísica."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, coth, Function
from scipy.integrate import quad, solve_ivp
from scipy.optimize import brentq, fsolve

kB = 1.380649e-23; qe = 1.602176634e-19; R = 8.314462618; NA = 6.02214076e23; g0 = 9.80665
kBq = sp.Float('1.380649e-23', 40); qeq = sp.Float('1.602176634e-19', 40); Rq = sp.Float('8.314462618', 40)
rng = np.random.default_rng(41)

# ================================================================ Nernst y Goldman
D = 'nernst-goldman'
ci, co, k_, T_, e_, z_, V_, u_ = [Symbol(s_, positive=True) for s_ in ('ci', 'co', 'k', 'T', 'e', 'z', 'V', 'u')]
solves(D, 'Boltzmann: ci/co = exp(−zeV/kT) ⇒ V = (kT/ze) ln(co/ci)', [Eq(ci / co, exp(-z_ * e_ * V_ / (k_ * T_)))], V_, k_ * T_ / (z_ * e_) * log(co / ci))
# flujo de Nernst–Planck con campo constante: J = P u (ci − co e^{-u})/(1 − e^{-u}); J = 0 en u = ln(co/ci)
Jflux = lambda cin, cout, uu: uu * (cin - cout * math.exp(-uu)) / (1 - math.exp(-uu))
rec(G_STEP, D, 'flujo electrodifusivo nulo en el potencial de Nernst (u = ln(c_o/c_i))', Jflux(140, 5, math.log(5 / 140)), 0.0, 'abs 1e-12', abs(Jflux(140, 5, math.log(5 / 140))) < 1e-12)
# resolver Nernst–Planck por integración numérica de J = −D(c' + c u'(x)) con campo constante y comparar con la fórmula de Goldman
def GHK_flux_numeric(cin, cout, uu, nx=4001):
    # c(x) en [0,1] con c(0)=cout (exterior), c(1)=cin (interior); J constante = -(c' + u c) con u constante por unidad de longitud
    # solución: c(x) = A e^{-u x} + J/u  (J en unidades de D/d)
    # cin = A + J/u ; cout = A e^{-u} + J/u  ⇒ J = u (cin − cout e^{-u})/(1 − e^{-u})
    xs = np.linspace(0, 1, nx); Jf = uu * (cin - cout * math.exp(-uu)) / (1 - math.exp(-uu)); A = cout - Jf / uu
    c = A * np.exp(-uu * xs) + Jf / uu
    resid = np.gradient(c, xs) + uu * c - Jf   # c' + u c − J = 0
    return float(np.max(np.abs(resid[2:-2]))), c[-1]
res_, cfin = GHK_flux_numeric(140, 5, 1.7)
rec(G_STEP, D, 'solución c(x) = A e^{−ux} + J/u cumple c′ + uc − J = 0 y c(0) = c_o, c(1) = c_i', res_, 0.0, 'abs 1e-3', res_ < 1e-3 and abs(cfin - 140) < 1e-8)
# corriente nula del GHK
Ko_, Ki_, Nao_, Nai_, Clo_, Cli_, pNa_, pCl_ = [Symbol(s_, positive=True) for s_ in ('Ko', 'Ki', 'Nao', 'Nai', 'Clo', 'Cli', 'pNa', 'pCl')]
eu = (Ki_ + pNa_ * Nai_ + pCl_ * Clo_) / (Ko_ + pNa_ * Nao_ + pCl_ * Cli_)    # e^{-u}
I0 = (Ki_ - Ko_ * eu) + pNa_ * (Nai_ - Nao_ * eu) - pCl_ * (Cli_ * eu - Clo_)
ident(D, 'con e^{−u} = (ΣP_cat c_i + ΣP_an c_o)/(ΣP_cat c_o + ΣP_an c_i) la corriente neta es cero', sp.simplify(I0), 0)
def ghk(T, Ko, Ki, Nao, Nai, Clo, Cli, pNa, pCl):
    VT = kB * (T + 273.15) / qe * 1e3
    return VT, VT * math.log(Ko / Ki), VT * math.log(Nao / Nai), VT * math.log(Cli / Clo), VT * math.log((Ko + pNa * Nao + pCl * Cli) / (Ki + pNa * Nai + pCl * Clo))
# comprobación numérica: la corriente total se anula al potencial de GHK
def Itot(Vmv, T, Ko, Ki, Nao, Nai, Clo, Cli, pNa, pCl):
    uu = Vmv * 1e-3 * qe / (kB * (T + 273.15))
    return Jflux(Ki, Ko, uu) + pNa * Jflux(Nai, Nao, uu) - pCl * (uu * (Cli * math.exp(-uu) - Clo) / (1 - math.exp(-uu)))
VT, EK, ENa, ECl, Vm = ghk(37, 5, 140, 145, 12, 110, 10, 0.04, 0.45)
rec(G_STEP, D, 'la corriente total (Nernst–Planck) se anula en V = V_GHK (37 °C, valores de reposo)', Itot(Vm, 37, 5, 140, 145, 12, 110, 10, 0.04, 0.45), 0.0, 'abs 1e-9', abs(Itot(Vm, 37, 5, 140, 145, 12, 110, 10, 0.04, 0.45)) < 1e-9)
rec(G_STEP, D, 'si solo K⁺ es permeable (P_Na = P_Cl → 0), V_GHK → E_K', ghk(37, 5, 140, 145, 12, 110, 10, 1e-12, 1e-12)[4], EK, 'abs 1e-6', abs(ghk(37, 5, 140, 145, 12, 110, 10, 1e-12, 1e-12)[4] - EK) < 1e-6)
rec(G_STEP, D, 'si P_Na domina, V_GHK → E_Na', ghk(37, 5, 140, 145, 12, 110, 10, 1e12, 1e-12)[4], ENa, 'abs 1e-4', abs(ghk(37, 5, 140, 145, 12, 110, 10, 1e12, 1e-12)[4] - ENa) < 1e-4)
uN = {'V_m': 'V', 'k': 'J K^-1', 'T': 'K', 'e': 'C', 'z': '1', 'c_o': 'mol m^-3', 'c_i': 'mol m^-3', 'P': 'm s^-1', 'u': '1'}
Vm_, co_, ci_, P1, P2 = [Symbol(s_, positive=True) for s_ in ('V_m', 'c_o', 'c_i', 'P_K', 'P_Na')]
dimcheck(D, 'V = (kT/ze) ln(c_o/c_i)', Vm_, k_ * T_ / (z_ * e_) * log(co_ / ci_), uN)
dimcheck(D, 'V_m GHK', Vm_, k_ * T_ / e_ * log((P1 * co_ + P2 * co_) / (P1 * ci_ + P2 * ci_)), dict(uN, P_K='m s^-1', P_Na='m s^-1'))
dimcheck(D, 'u = eV_m/kT', u_, e_ * Vm_ / (k_ * T_), uN)
num(D, 'kT/e (mV)', VT, '26.73'); num(D, 'E_K', EK, '-89.06'); num(D, 'E_Na', ENa, '66.60'); num(D, 'E_Cl', ECl, '-64.09'); num(D, 'V_GHK', Vm, '-67.33'); num(D, '(kT/e) ln10', VT * math.log(10), '61.5', tol=1e-3)
VT2, EK2, ENa2, ECl2, Vm2 = ghk(37, 5, 140, 145, 12, 110, 10, 0.04, 0.45)
num(D, 'valor inicial: kT/e', VT2, '26.7267'); num(D, 'valor inicial: E_K', EK2, '-89.0587'); num(D, 'valor inicial: E_Na', ENa2, '66.5982'); num(D, 'valor inicial: E_Cl', ECl2, '-64.0877'); num(D, 'valor inicial: V_m', Vm2, '-67.3262')
Tc, Ko, Ki, Nao, Nai, Clo, Cli, pNa, pCl = symbols('T Ko Ki Nao Nai Clo Cli pNa pCl', positive=True)
VTq = kBq * (Tc + sp.Float('273.15', 20)) / qeq * 1000
fsim('bio-goldman', 'VT', VTq, deriv=D)
fsim('bio-goldman', 'EK', VTq * sp.log(Ko / Ki), deriv=D)
fsim('bio-goldman', 'ENa', VTq * sp.log(Nao / Nai), deriv=D)
fsim('bio-goldman', 'ECl', VTq * sp.log(Cli / Clo), deriv=D)
fsim('bio-goldman', 'V', VTq * sp.log((Ko + pNa * Nao + pCl * Cli) / (Ki + pNa * Nai + pCl * Clo)), deriv=D)

# ================================================================ Cable
D = 'ecuacion-cable'
ri, rm, cm, Vv, xx, tt, lam, tau, a_, Rm_, Ri_, Cm_ = [Symbol(s_, positive=True) for s_ in ('r_i', 'r_m', 'c_m', 'V', 'x', 't', 'lambda', 'tau', 'a', 'R_m', 'R_i', 'C_m')]
ident(D, 'r_i = R_i/(πa²), r_m = R_m/(2πa), c_m = 2πa C_m ⇒ λ² = r_m/r_i = aR_m/(2R_i)', sp.simplify((Rm_ / (2 * pi * a_)) / (Ri_ / (pi * a_ ** 2)) - a_ * Rm_ / (2 * Ri_)), 0)
ident(D, 'τ = r_m c_m = R_m C_m', sp.simplify((Rm_ / (2 * pi * a_)) * (2 * pi * a_ * Cm_) - Rm_ * Cm_), 0)
Vf = Function('V')(xx)
ident(D, 'V = V₀e^{−x/λ} cumple λ²V″ = V', sp.simplify(lam ** 2 * diff(Symbol('V0', positive=True) * exp(-xx / lam), xx, 2) - Symbol('V0', positive=True) * exp(-xx / lam)), 0)
# solución numérica de la ecuación del cable dependiente del tiempo (diferencias finitas)
lam_n, tau_n = 1.0, 1.0; Nx = 401; xs = np.linspace(0, 8, Nx); dx = xs[1] - xs[0]
def rhs(t, V):
    d2 = np.zeros_like(V); d2[1:-1] = (V[2:] - 2 * V[1:-1] + V[:-2]) / dx ** 2
    out = (lam_n ** 2 * d2 - V) / tau_n; out[0] = 0; out[-1] = 0; return out
V0v = np.zeros(Nx); V0v[0] = 1.0
sol = solve_ivp(rhs, [0, 40], V0v, method='BDF', rtol=1e-9, atol=1e-12, t_eval=[40])
Vss = sol.y[:, -1]
for xv in (1.0, 2.0, 4.0):
    rec(G_STEP, D, f'ecuación del cable dependiente del tiempo integrada hasta el estado estacionario: V(x = {xv}λ) = e^{{−x/λ}}', float(np.interp(xv, xs, Vss)), math.exp(-xv), 'rel 1e-3', abs(np.interp(xv, xs, Vss) / math.exp(-xv) - 1) < 1e-3)
# relajación temporal de un punto: constante de tiempo τ
tt0 = np.linspace(0, 5, 51)
sol2 = solve_ivp(lambda t, y: -y / tau_n, [0, 5], [1.0], t_eval=tt0, rtol=1e-12, atol=1e-14)
rec(G_STEP, D, 'relajación espacialmente uniforme: V(t) = e^{−t/τ} (τ = R_m C_m)', float(sol2.y[0, 10]), math.exp(-1.0), 'rel 1e-8', abs(sol2.y[0, 10] / math.exp(-1.0) - 1) < 1e-8)
uC = {'V': 'V', 'lambda': 'm', 'tau': 's', 'a': 'm', 'R_m': 'Ohm m^2', 'R_i': 'Ohm m', 'C_m': 'F m^-2', 'x': 'm'}
dimcheck(D, 'λ = √(aR_m/2R_i)', lam, sqrt(a_ * Rm_ / (2 * Ri_)), uC)
dimcheck(D, 'τ = R_m C_m', tau, Rm_ * Cm_, uC)
dimcheck(D, 'exponente x/λ adimensional', Symbol('E', positive=True), xx / lam, dict(uC, E='1'))
aa, Rmm, Rii, Cmm = 238e-4, 1000.0, 35.4, 1e-6
lamv = math.sqrt(Rmm * aa / (2 * Rii))
num(D, 'λ (mm)', lamv * 10, '5.798'); num(D, 'τ (ms)', Rmm * Cmm * 1e3, '1.000'); num(D, 'λ/τ (m/s)', lamv * 1e-2 / (Rmm * Cmm), '5.80'); num(D, 'V(1 cm)/V₀', math.exp(-1 / lamv), '0.178'); num(D, 'cuatro veces el radio', 2.0, '2', tol=1e-9)
num(D, 'valor inicial: λ', lamv * 10, '5.79792'); num(D, 'valor inicial: V/V₀', math.exp(-5.8 * 0.1 / lamv), '0.3677'); num(D, 'valor inicial: λ/τ', lamv * 1e-2 / (Rmm * Cmm), '5.79792')
as_, Rms, Ris, Cms, xs_ = symbols('a Rm Ri Cm x', positive=True)
lam_q = sp.sqrt(Rms * as_ * sp.Float('1e-4', 40) / (2 * Ris))
fsim('bio-cable', 'lam', lam_q * 10, deriv=D)
fsim('bio-cable', 'tau', Rms * Cms * sp.Float('1e-6', 40) * 1000, deriv=D)
fsim('bio-cable', 'V', sp.exp(-xs_ * sp.Rational(1, 10) / lam_q), deriv=D)
fsim('bio-cable', 'v', lam_q * sp.Float('1e-2', 40) / (Rms * Cms * sp.Float('1e-6', 40)), deriv=D)

# ================================================================ Stokes–Einstein
D = 'stokes-einstein'
n_, F_, x_, zeta, Dd, kk, Tt, eta_, r_, L_, v_ = [Symbol(s_, positive=True) for s_ in ('n', 'F', 'x', 'zeta', 'D', 'k', 'T', 'eta', 'r', 'L', 'v')]
nB = exp(F_ * x_ / (kk * Tt))
J0 = nB * F_ / zeta - Dd * diff(nB, x_)
solves(D, 'J = 0 con n ∝ e^{Fx/kT}: D = kT/ζ (relación de Einstein)', [Eq(sp.simplify(J0 / nB), 0)], Dd, kk * Tt / zeta)
ident(D, 'ζ = 6πηr ⇒ D = kT/(6πηr)', kk * Tt / (6 * pi * eta_ * r_), kk * Tt / (6 * pi * eta_ * r_))
Cf = Function('c')(x_, tt)
Dsym = Symbol('Ds', positive=True)
sol_g = exp(-x_ ** 2 / (4 * Dsym * tt)) / sqrt(4 * pi * Dsym * tt)
ident(D, 'solución fundamental de la difusión ∂c/∂t = D ∂²c/∂x²', sp.simplify(diff(sol_g, tt) - Dsym * diff(sol_g, x_, 2)), 0)
ident(D, '⟨x²⟩ = ∫x² c dx = 2Dt', sp.simplify(integrate(x_ ** 2 * sol_g, (x_, -oo, oo))), 2 * Dsym * tt)
# simulación de paseos aleatorios
Dn = 2.0; dtw = 1e-3; Np = 20000; steps = 1000
xw = np.cumsum(rng.normal(0, math.sqrt(2 * Dn * dtw), (Np, steps)), axis=1)[:, -1]
rec(G_STEP, D, '20000 paseos aleatorios: ⟨x²⟩ = 2Dt', float(np.mean(xw ** 2)), 2 * Dn * dtw * steps, 'rel 0.03', abs(np.mean(xw ** 2) / (2 * Dn * dtw * steps) - 1) < 0.03)
uS = {'D': 'm^2 s^-1', 'k': 'J K^-1', 'T': 'K', 'eta': 'Pa s', 'r': 'm', 'zeta': 'kg s^-1', 'L': 'm', 't': 's', 'F': 'N', 'v': 'm s^-1', 'x': 'm'}
dimcheck(D, 'D = kT/(6πηr)', Dd, kk * Tt / (6 * pi * eta_ * r_), uS)
dimcheck(D, 'ζ = 6πηr', zeta, 6 * pi * eta_ * r_, uS)
dimcheck(D, 't = L²/(2D)', tt, L_ ** 2 / (2 * Dd), uS)
dimcheck(D, 'v = F/ζ', v_, F_ / zeta, uS)
SE = lambda T, eta, r: kB * T / (6 * math.pi * eta * r)
Dr5 = SE(298.15, 0.89e-3, 0.5e-9); Dg = SE(298.15, 0.89e-3, 0.36e-9); Dl = SE(298.15, 0.89e-3, 1.9e-9)
num(D, 'D (r = 0.5 nm) µm²/s', Dr5 * 1e12, '490.7'); num(D, 't (10 µm) s', (10e-6) ** 2 / (2 * Dr5), '0.102'); num(D, 'D glucosa', Dg * 1e12, '681.6'); num(D, 't glucosa (ms)', (10e-6) ** 2 / (2 * Dg) * 1e3, '73.4'); num(D, 'D lisozima', Dl * 1e12, '129.1'); num(D, 't lisozima', (10e-6) ** 2 / (2 * Dl), '0.387')
num(D, 't glucosa 1 mm (minutos)', (1e-3) ** 2 / (2 * Dg) / 60, '12', tol=0.02); num(D, 'razón 1 mm / 10 µm', (1e-3 / 10e-6) ** 2, '10000', tol=1e-9)
num(D, 'valor inicial: D', Dr5 * 1e12, '490.746'); num(D, 'valor inicial: ζ (pN s/m)', 6 * math.pi * 0.89e-3 * 0.5e-9 * 1e12, '8.38805'); num(D, 'valor inicial: t', (10e-6) ** 2 / (2 * Dr5), '0.101886'); num(D, 'valor inicial: x_rms', math.sqrt(2 * Dr5 * 1.0) * 1e6, '31.3', tol=2e-3)
rs, etas, Ts_, Ls = symbols('r eta T L', positive=True)
Dq = kBq * Ts_ / (6 * sp.pi * etas * sp.Float('1e-3', 40) * rs * sp.Float('1e-9', 40))
fsim('bio-difusion', 'D', Dq * sp.Float('1e12', 40), deriv=D)
fsim('bio-difusion', 'z', 6 * sp.pi * etas * sp.Float('1e-3', 40) * rs * sp.Float('1e-9', 40) * sp.Float('1e12', 40), deriv=D)
fsim('bio-difusion', 't', Ls ** 2 / (2 * Dq * sp.Float('1e12', 40)), deriv=D)
fsim('bio-difusion', 'x1', sp.sqrt(2 * Dq * sp.Float('1e12', 40)), deriv=D)

# ================================================================ Polímeros
D = 'elasticidad-polimeros'
Nn, b_, Rg, kT, xp, Lc = [Symbol(s_, positive=True) for s_ in ('N', 'b', 'R', 'kT', 'x', 'L')]
ident(D, '⟨R²⟩ = Σ⟨b_i·b_j⟩ = Nb² (términos cruzados nulos)', Nn * b_ ** 2 + Nn * (Nn - 1) * 0 * b_ ** 2, Nn * b_ ** 2)
Pg = exp(-3 * xp ** 2 / (2 * Nn * b_ ** 2))
ident(D, 'S = k ln P = −3k x²/(2Nb²) + cte ⇒ F = −T∂S/∂x → 3kT x/(Nb²)', sp.simplify(-kT * diff(-3 * xp ** 2 / (2 * Nn * b_ ** 2), xp) - 3 * kT * xp / (Nn * b_ ** 2)) , 0) if False else ident(D, 'F = −T ∂S/∂x con S = −3k x²/(2Nb²): |F| = 3kT x/(N b²)', sp.simplify(kT * diff(3 * xp ** 2 / (2 * Nn * b_ ** 2), xp) - 3 * kT * xp / (Nn * b_ ** 2)), 0)
be_, thh = symbols('beta theta', positive=True)
Z_ = sp.integrate(exp(be_ * cos(thh)) * sin(thh), (thh, 0, pi))
ident(D, 'función de partición de un segmento: ∫e^{β cosθ} sinθ dθ = 2 sinh β/β', sp.simplify(Z_ - 2 * sp.sinh(be_) / be_), 0)
ident(D, '⟨cosθ⟩ = d ln Z/dβ = coth β − 1/β (Langevin)', sp.simplify(diff(log(2 * sp.sinh(be_) / be_), be_) - (sp.coth(be_) - 1 / be_)), 0)
series_is(D, 'Langevin a β pequeño: coth β − 1/β ≈ β/3 (límite gaussiano)', sp.coth(be_) - 1 / be_, be_, 0, 5, be_ / 3 - be_ ** 3 / 45)
# simulación Monte Carlo de la cadena de segmentos libres
Nmc, nch = 100, 40000
vec = rng.normal(size=(nch, Nmc, 3)); vec /= np.linalg.norm(vec, axis=2, keepdims=True)
Rv = vec.sum(axis=1)
rec(G_STEP, D, f'Monte Carlo ({nch} cadenas de N = {Nmc}): ⟨R²⟩ = N b²', float(np.mean((Rv ** 2).sum(axis=1)) / Nmc), 1.0, 'rel 0.02', abs(np.mean((Rv ** 2).sum(axis=1)) / Nmc - 1) < 0.02)
# muestreo de Boltzmann con fuerza: ⟨cosθ⟩ = L(β) por Monte Carlo
for bt in (0.5, 2.0, 5.0):
    ct = np.linspace(-1, 1, 400001); w = np.exp(bt * ct)
    mean = np.trapz(ct * w, ct) / np.trapz(w, ct)
    rec(G_STEP, D, f'⟨cosθ⟩ numérico con peso e^{{β cosθ}} (β = {bt}) = coth β − 1/β', mean, 1 / math.tanh(bt) - 1 / bt, 'rel 1e-8', abs(mean / (1 / math.tanh(bt) - 1 / bt) - 1) < 1e-8)
def Linv(u): return brentq(lambda be: (1 / math.tanh(be) - 1 / be) - u, 1e-9, 1e4) if u > 1e-6 else 3 * u
uP = {'R': 'm', 'N': '1', 'b': 'm', 'x': 'm', 'L': 'm', 'F': 'N', 'k': 'J K^-1', 'T': 'K'}
kS_, TS_ = Symbol('k', positive=True), Symbol('T', positive=True)
Fs = Symbol('F', positive=True)
dimcheck(D, 'R_rms = b√N', Rg, b_ * sqrt(Nn), uP)
dimcheck(D, 'F = 3kT x/(Nb²)', Fs, 3 * kS_ * TS_ * xp / (Nn * b_ ** 2), uP)
dimcheck(D, 'F = (kT/b) 𝓛⁻¹', Fs, kS_ * TS_ / b_, uP)
kTn = kB * 310.15 * 1e21
b0, N0 = 100.0, 165
num(D, 'R_rms (µm)', b0 * math.sqrt(N0) * 1e-3, '1.285'); num(D, 'kT/b (pN)', kTn / b0, '0.0428'); num(D, 'L (µm)', N0 * b0 * 1e-3, '16.5')
for fr, fg, fj in ((0.1, '0.01285', '0.01292'), (0.5, '0.0642', '0.0769'), (0.9, '0.116', '0.428')):
    num(D, f'F gauss ({fr})', 3 * kTn * fr / b0, fg); num(D, f'F FJC ({fr})', kTn / b0 * Linv(fr), fj)
num(D, 'razón FJC/gauss a 0.9', Linv(0.9) / (3 * 0.9), '3.7', tol=0.01)
num(D, 'valor inicial: R_rms', b0 * math.sqrt(N0) * 1e-3, '1.28452'); num(D, 'valor inicial: F gauss', 3 * kTn * 0.5 / b0, '0.0642312'); num(D, 'valor inicial: F FJC', kTn / b0 * Linv(0.5), '0.0769386')
Nf, bf, frf, Tf = symbols('N b fr T', positive=True)
fsim('bio-polimero', 'R', bf * sp.sqrt(Nf) * sp.Rational(1, 1000), deriv=D)
fsim('bio-polimero', 'Lc', Nf * bf * sp.Rational(1, 1000), deriv=D)
fsim('bio-polimero', 'Fg', 3 * kBq * Tf * sp.Float('1e21', 40) * frf / bf, deriv=D)
fsim_py('bio-polimero', 'Fj', lambda d: kB * d['T'] * 1e21 / d['b'] * Linv(d['fr']), tol=1e-9, deriv=D)

# ================================================================ Ósmosis
D = 'osmosis'
mu0, P_, Pi_, Vw, RR, TT, xs2, cc = [Symbol(s_, positive=True) for s_ in ('mu0', 'P', 'Pi', 'Vw', 'R', 'T', 'xs', 'c')]
solves(D, 'μ⁰ + V_w Π + RT ln(1 − x_s) = μ⁰ ⇒ Π = −(RT/V_w) ln(1 − x_s)', [Eq(Vw * Pi_ + RR * TT * log(1 - xs2), 0)], Pi_, -RR * TT / Vw * log(1 - xs2))
series_is(D, 'x_s ≪ 1: −ln(1 − x_s) ≈ x_s ⇒ Π ≈ RT x_s/V_w = cRT', -log(1 - xs2), xs2, 0, 3, xs2 + xs2 ** 2 / 2)
ident(D, 'x_s ≈ cV_w ⇒ Π = cRT', (RR * TT / Vw) * (cc * Vw) - cc * RR * TT, 0)
# comprobación numérica: la presión que iguala los potenciales químicos del agua
Vw_n = 18.2e-6; c_n = 300.0; T_n = 310.15
x_s_n = 1 - math.exp(-c_n * Vw_n)  # x_s tal que ln(1−x_s) = −c V_w (solución exacta con c definida de ese modo)
Pi_sol = brentq(lambda P: Vw_n * P + R * T_n * math.log(1 - c_n * Vw_n), 0, 1e8)
rec(G_STEP, D, 'raíz numérica de μ_w(solución, P+Π) = μ_w(agua, P) para c = 300 mol/m³', Pi_sol, -R * T_n / Vw_n * math.log(1 - c_n * Vw_n), 'rel 1e-12', abs(Pi_sol / (-R * T_n / Vw_n * math.log(1 - c_n * Vw_n)) - 1) < 1e-12)
uO = {'Pi': 'Pa', 'c': 'mol m^-3', 'R': 'J mol^-1 K^-1', 'T': 'K', 'Vw': 'm^3 mol^-1', 'xs': '1'}
dimcheck(D, 'Π = cRT', Pi_, cc * RR * TT, uO)
dimcheck(D, 'Π = −(RT/V_w) ln(1 − x_s)', Pi_, -RR * TT / Vw * log(1 - xs2), uO)
dimcheck(D, 'x_s ≈ cV_w', xs2, cc * Vw, uO)
Pvh = c_n * R * T_n; Pex = -R * T_n / Vw_n * math.log(1 - c_n * Vw_n)
num(D, 'Π (kPa)', Pvh * 1e-3, '773.6'); num(D, 'Π (atm)', Pvh / 101325, '7.64'); num(D, 'h (m)', Pvh / (1000 * g0), '78.9'); num(D, 'Π exacta (kPa)', Pex * 1e-3, '775.7'); num(D, 'Π a 25 °C (kPa)', 300 * R * 298.15 * 1e-3, '743.7'); num(D, 'exceso (%)', (Pex / Pvh - 1) * 100, '0.27'); num(D, 'agua de mar 1000 mOsm (atm)', 1000 * R * 298.15 / 101325, '24', tol=0.03)
num(D, 'valor inicial: Π', Pvh * 1e-3, '773.619'); num(D, 'valor inicial: atm', Pvh / 101325, '7.63503'); num(D, 'valor inicial: h', Pvh / (1000 * g0), '78.8872'); num(D, 'valor inicial: exacta', Pex * 1e-3, '775.739')
cs, Ts2 = symbols('c T', positive=True)
fsim('bio-osmosis', 'vh', cs * Rq * Ts2 * sp.Float('1e-3', 40), deriv=D)
fsim('bio-osmosis', 'atm', cs * Rq * Ts2 / sp.Float('101325', 20), deriv=D)
fsim('bio-osmosis', 'h', cs * Rq * Ts2 / (1000 * sp.Float('9.80665', 20)), deriv=D)
fsim('bio-osmosis', 'ex', -Rq * Ts2 / sp.Float('18.2e-6', 20) * sp.log(1 - cs * sp.Float('18.2e-6', 20)) * sp.Float('1e-3', 40), deriv=D, tol=1e-8)
