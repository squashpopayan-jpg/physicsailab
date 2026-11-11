# -*- coding: utf-8 -*-
"""Capítulo 32 — Métodos de aproximación: WKB, perturbaciones, variacional y regla de oro."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, I as sI, Function, series, Ynm, factorial, sqrt as ssqrt, Matrix, airyai
from sympy.physics.hydrogen import R_nl
from scipy.integrate import quad
from scipy.special import ai_zeros
import scipy.sparse as sps
from scipy.sparse.linalg import spsolve, eigsh
import scipy.linalg as sl
from scipy.optimize import minimize_scalar

EX = {'wkb-cuantizacion': 'wkb', 'perturbacion-no-degenerada': 'anarmonico', 'perturbacion-degenerada': 'stark-lineal', 'variacional': 'variacional', 'regla-de-oro': 'emision'}
h = 6.62607015e-34; hb = h / (2 * math.pi); c = 299792458.0; qe = 1.602176634e-19; me = 9.1093837015e-31; a0 = 5.29177210903e-11; alpha = 7.2973525693e-3; EH = 13.605693123; eps0 = 8.8541878128e-12; amu = 1.66053906660e-27
hq = sp.Float('6.62607015e-34', 40); hbq = hq / (2 * sp.pi); cq = sp.Float('299792458', 40); qeq = sp.Float('1.602176634e-19', 40); a0q = sp.Float('5.29177210903e-11', 40); alq = sp.Float('7.2973525693e-3', 40); EHq = sp.Float('13.605693123', 40); e0q = sp.Float('8.8541878128e-12', 40); amuq = sp.Float('1.66053906660e-27', 40)
rng = np.random.default_rng(32)

# ================================================================ WKB
D = 'wkb-cuantizacion'
hbs, ps, xs = symbols('hbar_s p_s x_s', positive=True)
pf = Function('p')(xs)
s1 = sI / 2 * diff(pf, xs) / pf
res = sp.expand((pf + hbs * s1) ** 2 - sI * hbs * (diff(pf, xs) + hbs * diff(s1, xs)) - pf ** 2)
ident(D, 'orden ħ⁰ de (S′)² − iħS″ − p² con S₀′ = p: nulo', res.coeff(hbs, 0), 0)
ident(D, 'orden ħ¹ con S₁′ = (i/2)p′/p: nulo', sp.simplify(res.coeff(hbs, 1)), 0)
ident(D, 'amplitud: |φ|² = |C|²/p, con S₁ = (i/2)ln p ⇒ e^{iS₁} = p^{-1/2}', sp.simplify(sp.exp(sI * (sI / 2) * log(ps))), 1 / sqrt(ps))
Ii = Symbol('Ii', real=True)
for k in range(0, 6):
    ident(D, f'empalme: cos((k+½)π − I) = (−1)^k sin I (k={k})', sp.simplify(cos((k + R_(1, 2)) * pi - Ii) - (-1) ** k * sin(Ii)), 0)
ident(D, 'n = k + 1: (k + ½)π + π/4 = (n − ¼)π', ((Symbol('nn') - 1) + R_(1, 2)) * pi + pi / 4, (Symbol('nn') - R_(1, 4)) * pi)
m, g, E, z, n = symbols('m g E z n', positive=True)
integral(D, '∫₀^{E/mg} √(2m(E − mgz)) dz = 2√(2m)E^{3/2}/(3mg)', sqrt(2 * m * (E - m * g * z)), z, 0, E / (m * g), 2 * sqrt(2 * m) * E ** R_(3, 2) / (3 * m * g))
Et = (3 * pi / 2 * (n - R_(1, 4))) ** R_(2, 3) * (m * g ** 2 * hbs ** 2 / 2) ** R_(1, 3)
ident(D, 'E_n cumple (2√(2m)/(3mg))E^{3/2} = (n − ¼)πħ', sp.simplify(sp.powdenest(2 * sqrt(2 * m) / (3 * m * g) * Et ** R_(3, 2), force=True)), (n - R_(1, 4)) * pi * hbs)
l0 = (hbs ** 2 / (2 * m ** 2 * g)) ** R_(1, 3)
ident(D, 'escala: mg·l₀ = (mg²ħ²/2)^{1/3}', sp.simplify(sp.powdenest(m * g * l0, force=True)), (m * g ** 2 * hbs ** 2 / 2) ** R_(1, 3))
ident(D, 'ħ²/(2m l₀²) = mg l₀ (sin dimensiones: φ″ = (s − ε)φ)', sp.simplify(sp.powdenest(hbs ** 2 / (2 * m * l0 ** 2) - m * g * l0, force=True)), 0)
xa = Symbol('xa', real=True)
ident(D, 'Ai″ = x Ai (solución de la ecuación de Airy)', diff(airyai(xa), xa, 2) - xa * airyai(xa), 0)
# oscilador armónico con dos puntos de retorno blandos: ∮p dx = (n+½)h exacto
for (mm_, ww_, EE_) in ((1.0, 1.0, 3.5), (2.3, 0.7, 1.9), (0.4, 5.0, 0.123)):
    a_ = math.sqrt(2 * EE_ / (mm_ * ww_ ** 2))
    I_, _ = quad(lambda x: math.sqrt(max(2 * mm_ * (EE_ - 0.5 * mm_ * ww_ ** 2 * x * x), 0)), -a_, a_, epsabs=1e-13, epsrel=1e-13)
    rec(G_STEP, D, f'oscilador (m={mm_}, ω={ww_}): ∫p dx = πE/ω ⇒ E = (n+½)ħω con ∫p dx = (n+½)πħ', I_, math.pi * EE_ / ww_, 'rel 1e-9', abs(I_ / (math.pi * EE_ / ww_) - 1) < 1e-9)
# diagonalización numérica de −φ″ + sφ = εφ con φ(0) = 0 (unidades de l₀ y de mg·l₀)
Nn, Rm = 40000, 40.0
sg = np.linspace(Rm / Nn, Rm, Nn); ds = sg[1] - sg[0]
Hm = sps.diags([np.full(Nn - 1, -1 / ds ** 2), 2 / ds ** 2 + sg, np.full(Nn - 1, -1 / ds ** 2)], [-1, 0, 1], format='csc')
eps_fd = np.sort(eigsh(Hm, k=6, sigma=1.0, which='LM', return_eigenvectors=False))
aire = -ai_zeros(20)[0]
for i in range(6):
    rec(G_STEP, D, f'diagonalización (diferencias finitas) de −φ″ + sφ = εφ: ε_{i+1} = −a_{i+1} (cero de Ai)', float(eps_fd[i]), float(aire[i]), 'rel 1e-6', abs(eps_fd[i] / aire[i] - 1) < 1e-6)
tt = lambda n_: 3 * math.pi * (4 * n_ - 1) / 8
for n_ in range(1, 7):
    w_ = tt(n_) ** (2 / 3)
    rec(G_STEP, D, f'WKB frente a los ceros de Airy (n={n_}): error < 1 % y decreciente', (w_ / aire[n_ - 1] - 1) * 100, -0.0, 'abs 0.8', abs(w_ / aire[n_ - 1] - 1) < 0.0077)
uW = {'E_n': 'J', 'm': 'kg', 'g': 'm s^-2', 'hbar': 'J s', 'z_n': 'm', 'b': 'm', 'l_0': 'm', 'p': 'kg m s^-1', 'S': 'J s', 'n': '1'}
En_, m_, g_, hb_, zn_, l0_, p_, S_, b_ = [Symbol(k, positive=True) for k in ('E_n', 'm', 'g', 'hbar', 'z_n', 'l_0', 'p', 'S', 'b')]
dimcheck(D, 'E_n = (mg²ħ²/2)^{1/3}', En_, (m_ * g_ ** 2 * hb_ ** 2 / 2) ** R_(1, 3), uW)
dimcheck(D, 'l₀ = (ħ²/2m²g)^{1/3}', l0_, (hb_ ** 2 / (2 * m_ ** 2 * g_)) ** R_(1, 3), uW)
dimcheck(D, 'z_n = E_n/(mg)', zn_, En_ / (m_ * g_), uW)
dimcheck(D, 'acción ∫p dz = p·b', S_, p_ * b_, uW)
# cifras
mn = 1.00866491595 * amu; gg = 9.80665
Es = (mn * gg ** 2 * hb ** 2 / 2) ** (1 / 3); l0v = (hb ** 2 / (2 * mn ** 2 * gg)) ** (1 / 3)
Eex = aire * Es / qe * 1e12; Ewk = np.array([tt(k) ** (2 / 3) for k in range(1, 21)]) * Es / qe * 1e12
num(D, 'l₀ (µm)', l0v * 1e6, '5.8686'); num(D, 'mg l₀ (peV)', Es / qe * 1e12, '0.60165'); num(D, 'cero de Ai n=1', aire[0], '2.33811')
num(D, 'E₁ exacta', Eex[0], '1.40672'); num(D, 'z₁ exacta (µm)', aire[0] * l0v * 1e6, '13.72'); num(D, 'E₁ WKB', Ewk[0], '1.39598'); num(D, 'error n=1 (%)', (Ewk[0] / Eex[0] - 1) * 100, '-0.76')
num(D, 'E₂ exacta', Eex[1], '2.45951'); num(D, 'E₂ WKB', Ewk[1], '2.45581'); num(D, 'error n=2 (%)', (Ewk[1] / Eex[1] - 1) * 100, '-0.150'); num(D, 'E₃ exacta', Eex[2], '3.32144'); num(D, 'E₃ WKB', Ewk[2], '3.31939'); num(D, 'error n=3 (%)', (Ewk[2] / Eex[2] - 1) * 100, '-0.0615')
num(D, 'E₅ exacta', Eex[4], '4.77958'); num(D, 'E₅ WKB', Ewk[4], '4.77859'); num(D, 'error n=5 (%)', (Ewk[4] / Eex[4] - 1) * 100, '-0.0207')
num(D, 'E₂/E₁ exacta', Eex[1] / Eex[0], '1.7484'); num(D, 'E₂/E₁ WKB', Ewk[1] / Ewk[0], '1.7592'); num(D, 'E₂ − E₁ (peV)', Eex[1] - Eex[0], '1.0528'); num(D, 'frecuencia (Hz)', (Eex[1] - Eex[0]) * 1e-12 * qe / h, '254.6')
num(D, 'factor por 2g', 2 ** (2 / 3), '1.5874'); num(D, 'factor por masa ×8', 8 ** (1 / 3), '2')
e_n = [abs(Ewk[k] / Eex[k] - 1) for k in (4, 9)]
rec(G_STEP, D, 'el error de WKB decrece como n⁻² (n=5→10: cociente ≈ 4)', e_n[0] / e_n[1], 4.0, 'rel 0.15', abs(e_n[0] / e_n[1] / 4 - 1) < 0.15)
num(D, 'E₁ WKB valor inicial', Ewk[0], '1.395975'); num(D, 'z₁ WKB valor inicial (µm)', tt(1) ** (2 / 3) * Es / (mn * gg) * 1e6, '13.6167'); num(D, 'l₀ valor inicial', l0v * 1e6, '5.8686'); num(D, 'error valor inicial', (tt(1) ** (2 / 3) / aire[0] - 1) * 100, '-0.76')
Ms, gs_, ns_ = symbols('M g n', positive=True)
Esq = (Ms * amuq * gs_ ** 2 * hbq ** 2 / 2) ** R_(1, 3) if False else sp.cbrt(Ms * amuq * gs_ ** 2 * hbq ** 2 / 2)
tq = 3 * sp.pi * (4 * ns_ - 1) / 8
wkq = tq ** R_(2, 3)
airq = wkq * (1 + R_(5, 48) / tq ** 2 - R_(5, 36) / tq ** 4 + R_(77125, 82944) / tq ** 6 - R_(108056875, 6967296) / tq ** 8)
fsim('wkb', 'E', wkq * Esq / qeq * sp.Float('1e12', 40), deriv=D)
fsim('wkb', 'z', wkq * Esq / (Ms * amuq * gs_) * sp.Float('1e6', 40), deriv=D)
fsim('wkb', 'l0', sp.cbrt(hbq ** 2 / (2 * (Ms * amuq) ** 2 * gs_)) * sp.Float('1e6', 40), deriv=D)
fsim_py('wkb', 'err', lambda d: ((3 * math.pi * (4 * d['n'] - 1) / 8) ** (2 / 3) / -ai_zeros(20)[0][int(round(d['n'])) - 1] - 1) * 100, tol=1e-8, deriv=D)
fsim_py('wkb', 'Ex', lambda d: -ai_zeros(20)[0][int(round(d['n'])) - 1] * (d['M'] * amu * d['g'] ** 2 * hb ** 2 / 2) ** (1 / 3) / qe * 1e12, tol=1e-9, deriv=D)

# ================================================================ perturbaciones no degeneradas
D = 'perturbacion-no-degenerada'
Em, En, Hmn, cm = symbols('E_m E_n H_mn c_m')
solves(D, 'proyección del orden 1 sobre φ_m: (E_m − E_n)c_m + H′_mn = 0 ⇒ c_m = H′_mn/(E_n − E_m)', [Eq((Em - En) * cm + Hmn, 0)], cm, Hmn / (En - Em))
# comprobación numérica con matrices hermíticas aleatorias de dimensión 7
dim = 7
M0 = np.diag(np.sort(rng.uniform(0, 10, dim))); Hp = rng.normal(size=(dim, dim)) + 1j * rng.normal(size=(dim, dim)); Hp = (Hp + Hp.conj().T) / 2
w0 = np.diag(M0).real
for k in (0, 2, 5):
    e1 = Hp[k, k].real
    e2 = sum(abs(Hp[mm_, k]) ** 2 / (w0[k] - w0[mm_]) for mm_ in range(dim) if mm_ != k)
    lam = 1e-3
    ev = np.sort(sl.eigvalsh(M0 + lam * Hp))[k]
    r3 = abs(ev - w0[k] - lam * e1 - lam ** 2 * e2)
    rec(G_STEP, D, f'matriz aleatoria 7×7, nivel {k}: E(λ) − E⁰ − λE¹ − λ²E² = O(λ³)', float(r3 / lam ** 3), 0.0, 'cociente < 100', r3 / lam ** 3 < 100)
    rec(G_STEP, D, f'matriz aleatoria 7×7, nivel {k}: el residuo escala como λ³ (cociente λ=1e-3 / λ=2e-3 ≈ 8)', float(abs(ev - w0[k] - lam * e1 - lam ** 2 * e2) / abs(np.sort(sl.eigvalsh(M0 + 2 * lam * Hp))[k] - w0[k] - 2 * lam * e1 - 4 * lam ** 2 * e2)), 0.125, 'rel 0.3', abs(abs(ev - w0[k] - lam * e1 - lam ** 2 * e2) / abs(np.sort(sl.eigvalsh(M0 + 2 * lam * Hp))[k] - w0[k] - 2 * lam * e1 - 4 * lam ** 2 * e2) / 0.125 - 1) < 0.3)
rec(G_STEP, D, 'E² del nivel fundamental es negativo (matriz 7×7)', float(sum(abs(Hp[mm_, 0]) ** 2 / (w0[0] - w0[mm_]) for mm_ in range(1, dim))), -1.0, 'signo', sum(abs(Hp[mm_, 0]) ** 2 / (w0[0] - w0[mm_]) for mm_ in range(1, dim)) < 0)
# oscilador anarmónico: elementos exactos con álgebra de escalera (x₀ = 1)
NN = 16
Aop = Matrix(NN, NN, lambda i, j: sqrt(j) if i == j - 1 else 0)
X = (Aop + Aop.T) / sqrt(2)
X2 = X * X; X4 = X2 * X2
X4 = X4.applyfunc(sp.nsimplify)
for k in range(0, 6):
    e1 = X4[k, k]
    e2 = sum((X4[mm_, k] ** 2 / (k - mm_) for mm_ in range(NN) if mm_ != k and abs(mm_ - k) <= 4), sp.Integer(0))
    ident(D, f'⟨n|x⁴|n⟩ = (6n² + 6n + 3)/4 (n={k})', sp.nsimplify(e1), R_(6 * k * k + 6 * k + 3, 4))
    ident(D, f'E² = Σ|⟨m|x⁴|n⟩|²/(n − m) = −(34n³ + 51n² + 59n + 21)/8 (n={k})', sp.nsimplify(sp.simplify(e2)), -R_(34 * k ** 3 + 51 * k * k + 59 * k + 21, 8))
# diagonalización numérica del oscilador anarmónico
Nb = 120
al_ = np.diag(np.sqrt(np.arange(1, Nb)), 1); xm = (al_ + al_.T) / math.sqrt(2); x4 = np.linalg.matrix_power(xm, 4)
def anh(eps, nl=6): return sl.eigvalsh(np.diag(np.arange(Nb) + 0.5) + eps * x4)[:nl]
f2 = lambda n_, e_: n_ + 0.5 + e_ / 4 * (6 * n_ * n_ + 6 * n_ + 3) - e_ * e_ * (34 * n_ ** 3 + 51 * n_ ** 2 + 59 * n_ + 21) / 8
for n_ in range(0, 4):
    ee = 1e-5
    ex_ = anh(ee)[n_]
    rec(G_STEP, D, f'diagonalización del oscilador con εx⁴ (ε=1e-5, n={n_}) frente a la fórmula de 2.º orden', float(ex_), float(f2(n_, ee)), 'rel 1e-9', abs(ex_ / f2(n_, ee) - 1) < 1e-9)
# Stark: Dalgarno–Lewis en unidades atómicas
r_, th_, F_ = symbols('r theta F', positive=True)
psi0 = exp(-r_) / sqrt(pi); psi1 = -F_ * (r_ + r_ ** 2 / 2) * cos(th_) * psi0
lap = lambda f: diff(r_ ** 2 * diff(f, r_), r_) / r_ ** 2 + diff(sin(th_) * diff(f, th_), th_) / (r_ ** 2 * sin(th_))
resid = -lap(psi1) / 2 - psi1 / r_ + psi1 / 2 + F_ * r_ * cos(th_) * psi0
ident(D, '(H₀ − E₁)ψ⁽¹⁾ = −Fzψ₁₀₀ con ψ⁽¹⁾ = −F(r + r²/2)cosθ ψ₁₀₀ (Dalgarno–Lewis)', sp.simplify(resid), 0)
E2s = integrate(integrate(integrate(psi0 * F_ * r_ * cos(th_) * psi1 * r_ ** 2 * sin(th_), (r_, 0, oo)), (th_, 0, pi)), (Symbol('ph'), 0, 2 * pi))
ident(D, 'E⁽²⁾ = ⟨ψ₁₀₀|Fz|ψ⁽¹⁾⟩ = −(9/4)F²', sp.simplify(E2s), -R_(9, 4) * F_ ** 2)
ident(D, 'E⁽¹⁾ = ⟨1s|Fz|1s⟩ = 0 por paridad', integrate(integrate(psi0 * F_ * r_ * cos(th_) * psi0 * r_ ** 2 * sin(th_), (r_, 0, oo)), (th_, 0, pi)), 0)
# comprobación numérica independiente: ecuación radial para h(r) (ψ⁽¹⁾ = h cosθ ψ de l=1) por diferencias finitas
Nr, Rr = 40000, 60.0
rg = np.linspace(Rr / Nr, Rr - Rr / Nr, Nr - 1); dr = Rr / Nr
dg = 1 / dr ** 2
Hh = sps.diags([np.full(Nr - 2, -0.5 * dg + 0.5 / (dr * rg[1:])), dg + 1 / rg ** 2 - 1 / rg + 0.5, np.full(Nr - 2, -0.5 * dg - 0.5 / (dr * rg[:-1]))], [-1, 0, 1], format='csc')
rhs = -rg * np.exp(-rg) / math.sqrt(math.pi)
hh_ = spsolve(Hh, rhs)
E2num = np.sum(np.exp(-rg) / math.sqrt(math.pi) * rg * hh_ * rg ** 2) * dr * (4 * math.pi / 3)
rec(G_STEP, D, 'resolución numérica independiente (diferencias finitas): E⁽²⁾/F² = −9/4', float(E2num), -2.25, 'rel 1e-5', abs(E2num / -2.25 - 1) < 1e-5)
alp = 4.5 * 4 * math.pi * eps0 * a0 ** 3
ident(D, 'unidades atómicas: E⁽²⁾ = −(9/4)F² ⇔ ΔE = −½αF² con α = (9/2)(4πε₀)a₀³', -R_(9, 4) * F_ ** 2, -R_(1, 2) * R_(9, 2) * F_ ** 2)
Fat = qe / (4 * math.pi * eps0 * a0 ** 2)
rec(G_STEP, D, 'campo atómico e/(4πε₀a₀²) = 5.1422×10¹¹ V/m', Fat, 5.14220674763e11, 'rel 1e-8', abs(Fat / 5.14220674763e11 - 1) < 1e-8)
b_, x0_, om_, al2, F2, e0_, a0_, hb2, m2_, E_ = [Symbol(k, positive=True) for k in ('beta', 'x_0', 'omega', 'alpha', 'F', 'eps0', 'a_0', 'hbar', 'm', 'E')]
uP = {'beta': 'J m^-4', 'x_0': 'm', 'omega': 'rad s^-1', 'alpha': 'C m^2 V^-1', 'F': 'V m^-1', 'eps0': 'F m^-1', 'a_0': 'm', 'hbar': 'J s', 'm': 'kg', 'E': 'J'}
dimcheck(D, 'βx₀⁴ es una energía (x₀ = √(ħ/mω))', E_, b_ * (hb2 / (m2_ * om_)) ** 2, uP)
dimcheck(D, 'ΔE = −½αF²', E_, al2 * F2 ** 2 / 2, uP)
dimcheck(D, 'α = (9/2)(4πε₀)a₀³', al2, R_(9, 2) * 4 * pi * e0_ * a0_ ** 3, uP)
num(D, 'α/(4πε₀) (Å³)', 4.5 * (a0 * 1e10) ** 3, '0.66683'); num(D, 'α (C m²/V)', alp * 1e41, '7.4195')
for Fv, sv, mhz in ((1e7, '-0.0231544', '-5.5987'), (1e8, '-2.3154', None)):
    num(D, f'ΔE a F={Fv:g} V/m (µeV)', -0.5 * alp * Fv ** 2 / qe * 1e6, sv)
num(D, 'ΔE a 10 MV/m (MHz)', -0.5 * alp * 1e14 / h * 1e-6, '-5.5987'); num(D, 'p inducido (e a₀)', alp * 1e7 / (qe * a0) * 1e5, '8.7511')
num(D, 'α/(4πε₀) para He⁺ (Å³)', 4.5 * (a0 * 1e10) ** 3 / 16, '0.041677')
num(D, 'valor inicial Stark: α (Å³)', 4.5 * (a0 * 1e10) ** 3, '0.666831'); num(D, 'valor inicial Stark: ΔE (µeV)', -0.5 * alp * 1e14 / qe * 1e6, '-0.0231544'); num(D, 'valor inicial Stark: ΔE/h (MHz)', -0.5 * alp * 1e14 / h * 1e-6, '-5.59872')
e5 = 0.05
num(D, 'ε=0.05, n=0: 1.er orden', 0.5 + e5 / 4 * 3, '0.5375'); num(D, 'ε=0.05, n=0: 2.º orden', f2(0, e5), '0.53094'); num(D, 'ε=0.05, n=0: diagonalización', anh(e5)[0], '0.53264')
num(D, 'ε=0.05: separación n=0→1', 1 + 3 * e5, '1.15'); num(D, 'ε=0.01, n=0: 2.º orden', f2(0, 0.01), '0.507237'); num(D, 'ε=0.01, n=0: diagonalización', anh(0.01)[0], '0.507256')
num(D, 'ε=0.1, n=2: 2.º orden', f2(2, 0.1), '2.706'); num(D, 'ε=0.1, n=2: diagonalización', anh(0.1)[2], '3.139'); num(D, 'ε=0.1 n=2 fracción', 0.0, '0.0') if False else None
num(D, 'valor inicial anarmónico: 1.er orden', 0.5 + e5 / 4 * 3, '0.5375'); num(D, 'valor inicial anarmónico: 2.º orden', f2(0, e5), '0.5309375'); num(D, 'valor inicial anarmónico: corrimiento', e5 / 4 * 3, '0.0375')
ns, es = symbols('n e', positive=True)
fsim('anarmonico', 'E1', ns + R_(1, 2) + es / 4 * (6 * ns ** 2 + 6 * ns + 3), deriv=D)
fsim('anarmonico', 'E2', ns + R_(1, 2) + es / 4 * (6 * ns ** 2 + 6 * ns + 3) - es ** 2 * (34 * ns ** 3 + 51 * ns ** 2 + 59 * ns + 21) / 8, deriv=D)
fsim('anarmonico', 'sp', 1 + 3 * es * (ns + 1), deriv=D)
fsim('anarmonico', 'sh', es / 4 * (6 * ns ** 2 + 6 * ns + 3), deriv=D)
Zs, Fs = symbols('Z F', positive=True)
alq_ = R_(9, 2) * 4 * sp.pi * e0q * a0q ** 3 / Zs ** 4
fsim('stark-cuad', 'al', R_(9, 2) * a0q ** 3 / Zs ** 4 * sp.Float('1e30', 40), deriv=D)
fsim('stark-cuad', 'dE', -alq_ * (Fs * sp.Float('1e6', 40)) ** 2 / 2 / qeq * sp.Float('1e6', 40), deriv=D)
fsim('stark-cuad', 'df', -alq_ * (Fs * sp.Float('1e6', 40)) ** 2 / 2 / hq * sp.Float('1e-6', 40), deriv=D)
fsim('stark-cuad', 'pd', alq_ * Fs * sp.Float('1e6', 40) / (qeq * a0q), deriv=D)

# ================================================================ perturbaciones degeneradas
D = 'perturbacion-degenerada'
rs = Symbol('rs', positive=True)
Rr20 = R_nl(2, 0, rs, 1); Rr21 = R_nl(2, 1, rs, 1)
rad = integrate(Rr20 * Rr21 * rs ** 3, (rs, 0, oo))
ident(D, '∫R₂₀R₂₁r³dr = −3√3 a₀', rad, -3 * sqrt(3))
tha, pha = symbols('tha pha', real=True)
Y00 = Ynm(0, 0, tha, pha).expand(func=True); Y10 = Ynm(1, 0, tha, pha).expand(func=True)
ang = integrate(integrate(Y00 * cos(tha) * Y10 * sin(tha), (tha, 0, pi)), (pha, 0, 2 * pi))
ident(D, '∫Y₀₀* cosθ Y₁₀ dΩ = 1/√3', sp.simplify(ang), 1 / sqrt(3))
ident(D, '⟨2s|z|2p₀⟩ = −3a₀', sp.simplify(rad * ang), -3)
Hd = Matrix([[0, -3, 0, 0], [-3, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]])
ev = Hd.eigenvals()
rec(G_STEP, D, 'autovalores de la matriz de z en el n=2: {−3, 0, 0, 3} (unidades e a₀F)', 1.0, 1.0, 'conjunto', sorted(ev.items(), key=lambda t: t[0]) == [(-3, 1), (0, 2), (3, 1)])
Dm = Hd - Symbol('lam') * sp.eye(4)
solves(D, 'det(H′ − E⁽¹⁾) = 0 en la capa n=2 ⇒ E⁽¹⁾ = ±3', [Eq(Dm.det(), 0)], Symbol('lam'), -3) if False else ident(D, 'det(H′ − λ) = λ²(λ² − 9) en la capa n=2', sp.expand(Dm.det()), sp.expand(Symbol('lam') ** 2 * (Symbol('lam') ** 2 - 9)))
# reglas de selección con armónicos esféricos
for (l1, l2, mval) in ((1, 1, 0), (0, 2, 0), (1, 3, 1), (2, 2, 1)):
    Ya = Ynm(l1, mval, tha, pha).expand(func=True); Yb = Ynm(l2, mval, tha, pha).expand(func=True)
    v = integrate(integrate(sp.conjugate(Ya) * cos(tha) * Yb * sin(tha), (tha, 0, pi)), (pha, 0, 2 * pi))
    ident(D, f'regla de selección: ⟨l={l1},m|cosθ|l={l2},m⟩ = 0 (Δl ≠ ±1)', sp.simplify(v), 0)
for (lv, mv) in ((0, 0), (1, 0), (1, 1), (2, 1), (2, 0)):
    Ya = Ynm(lv + 1, mv, tha, pha).expand(func=True); Yb = Ynm(lv, mv, tha, pha).expand(func=True)
    v = integrate(integrate(sp.conjugate(Ya) * cos(tha) * Yb * sin(tha), (tha, 0, pi)), (pha, 0, 2 * pi))
    ident(D, f'⟨l+1,m|cosθ|l,m⟩ = √[((l+1)² − m²)/((2l+1)(2l+3))] (l={lv}, m={mv})', sp.simplify(v), sqrt(R_((lv + 1) ** 2 - mv ** 2, (2 * lv + 1) * (2 * lv + 3))))
for nv in (2, 3, 4):
    for lv in range(0, nv - 1):
        rv = integrate(R_nl(nv, lv + 1, rs, 1) * R_nl(nv, lv, rs, 1) * rs ** 3, (rs, 0, oo))
        ident(D, f'⟨n,l+1|r|n,l⟩ = −(3/2)n√(n² − (l+1)²) (n={nv}, l={lv})', sp.simplify(rv), -R_(3, 2) * nv * sqrt(nv ** 2 - (lv + 1) ** 2))
# matriz de z en la capa n y comparación con ΔE = (3/2) n q
def zmat(nv):
    st = [(l_, m_) for l_ in range(nv) for m_ in range(-l_, l_ + 1)]
    Mz = np.zeros((len(st), len(st)))
    for i, (l_, m_) in enumerate(st):
        for j, (lp, mp_) in enumerate(st):
            if m_ == mp_ and lp == l_ + 1:
                ang_ = math.sqrt(((l_ + 1) ** 2 - m_ ** 2) / ((2 * l_ + 1) * (2 * l_ + 3)))
                radv = -1.5 * nv * math.sqrt(nv ** 2 - (l_ + 1) ** 2)
                Mz[i, j] = Mz[j, i] = ang_ * radv
    return np.sort(sl.eigvalsh(Mz))
for nv in (2, 3, 4, 5, 6):
    exp_ = []
    for l_m in range(0, nv):
        for mval in range(-(nv - 1), nv):
            pass
    qs = []
    for mm_ in range(-(nv - 1), nv):
        nsum = nv - abs(mm_) - 1
        for n1 in range(nsum + 1):
            qs.append(1.5 * nv * (n1 - (nsum - n1)))
    got = zmat(nv); want = np.sort(np.array(qs))
    rec(G_STEP, D, f'diagonalización de z en la capa n={nv} ({nv * nv} estados): autovalores = (3/2)nq con q = n₁ − n₂', float(np.max(np.abs(got - want))), 0.0, 'abs 1e-9', np.max(np.abs(got - want)) < 1e-9)
Dl, e_, a0d, F3, n3, q3 = [Symbol(k, positive=True) for k in ('DE', 'e', 'a_0', 'F', 'n', 'q')]
uD = {'DE': 'J', 'e': 'C', 'a_0': 'm', 'F': 'V m^-1', 'n': '1', 'q': '1'}
dimcheck(D, 'ΔE = (3/2) n q e a₀ F', Dl, R_(3, 2) * n3 * q3 * e_ * a0d * F3, uD)
dimcheck(D, 'ΔE(n=2) = 3 e a₀ F', Dl, 3 * e_ * a0d * F3, uD)
num(D, 'ΔE (n=2, 10 MV/m) µeV', 3 * a0 * 1e7 * 1e6, '1587.53'); num(D, 'ΔE/h GHz', 3 * a0 * 1e7 * qe / h * 1e-9, '383.863'); num(D, 'dipolo 3ea₀ (D)', 3 * 2.541746473, '7.6252')
dfs = EH * alpha ** 2 / 16
num(D, 'estructura fina 2P₃/₂ − 2P₁/₂ (µeV)', dfs * 1e6, '45.28'); num(D, 'campo de igualdad (V/m)', dfs / (3 * a0), '2.852e5', tol=1e-3)
num(D, 'n=3, q=2, 10 MV/m (µeV)', 1.5 * 3 * 2 * a0 * 1e7 * 1e6, '4762.6'); num(D, 'anchura n=3, 10 MV/m (µeV)', 3 * 3 * 2 * a0 * 1e7 * 1e6, '9525.2'); num(D, 'n=10, q=9, 1 MV/m (µeV)', 1.5 * 10 * 9 * a0 * 1e6 * 1e6, '7143.9')
num(D, 'campo de ionización clásico n=2 (V/m)', 5.14220674763e11 / (9 * 16), '3.57e9', tol=2e-3); num(D, 'campo atómico', 5.14220674763e11, '5.14e11', tol=1e-3)
num(D, 'valor inicial: anchura (µeV)', 3 * 2 * 1 * a0 * 1e7 * 1e6, '3175.06'); num(D, 'valor inicial: dipolo (D)', 1.5 * 2 * 1 * 2.541746473, '7.62524')
nl, ql, Fl = symbols('n q F', positive=True)
fsim('stark-lineal', 'dE', R_(3, 2) * nl * ql * a0q * Fl * sp.Float('1e12', 40), deriv=D)
fsim('stark-lineal', 'df', R_(3, 2) * nl * ql * a0q * Fl * sp.Float('1e6', 40) * qeq / hq * sp.Float('1e-9', 40), deriv=D)
fsim('stark-lineal', 'pd', R_(3, 2) * nl * ql * sp.Float('2.541746473', 40), deriv=D)
fsim('stark-lineal', 'w', 3 * nl * (nl - 1) * a0q * Fl * sp.Float('1e12', 40), deriv=D)

# ================================================================ variacional
D = 'variacional'
zt, Zt, rr, r1, r2 = symbols('zeta Z r r1 r2', positive=True)
phi = sqrt(zt ** 3 / pi) * exp(-zt * rr)
Tint = integrate(4 * pi * rr ** 2 * phi * (-R_(1, 2)) * (diff(phi, rr, 2) + 2 * diff(phi, rr) / rr), (rr, 0, oo))
ident(D, '⟨T⟩ de un electrón 1s con carga ζ es ζ²/2', sp.simplify(Tint), zt ** 2 / 2)
ident(D, '⟨1/r⟩ = ζ', integrate(4 * pi * rr ** 2 * phi ** 2 / rr, (rr, 0, oo)), zt)
rho = zt ** 3 / pi * exp(-2 * zt * r2)
inner = integrate(rho.subs(r2, Symbol('s', positive=True)) * 4 * pi * Symbol('s', positive=True) ** 2, (Symbol('s', positive=True), 0, r1)) / r1 + integrate(rho.subs(r2, Symbol('s', positive=True)) * 4 * pi * Symbol('s', positive=True), (Symbol('s', positive=True), r1, oo))
rho1 = zt ** 3 / pi * exp(-2 * zt * r1)
V12 = integrate(sp.simplify(rho1 * 4 * pi * r1 ** 2 * inner), (r1, 0, oo))
ident(D, '⟨1/r₁₂⟩ = (5/8)ζ (teorema de Newton para nubes esféricas)', sp.simplify(V12), R_(5, 8) * zt)
Ez = zt ** 2 - 2 * Zt * zt + R_(5, 8) * zt
solves(D, 'dE/dζ = 0 ⇒ ζ = Z − 5/16', [Eq(diff(Ez, zt), 0)], zt, Zt - R_(5, 16))
ident(D, 'E mínima = −(Z − 5/16)²', sp.simplify(Ez.subs(zt, Zt - R_(5, 16))), -(Zt - R_(5, 16)) ** 2)
ident(D, 'd²E/dζ² = 2 > 0 (es un mínimo)', diff(Ez, zt, 2), 2)
# función gaussiana para el hidrógeno
al_g = Symbol('alg', positive=True)
psig = (2 * al_g / pi) ** R_(3, 4) * exp(-al_g * rr ** 2)
Tg = integrate(4 * pi * rr ** 2 * psig * (-R_(1, 2)) * (diff(psig, rr, 2) + 2 * diff(psig, rr) / rr), (rr, 0, oo))
Vg = integrate(4 * pi * rr ** 2 * psig ** 2 * (-1 / rr), (rr, 0, oo))
ident(D, 'gaussiana: ⟨T⟩ = 3α/2', sp.simplify(Tg), R_(3, 2) * al_g)
ident(D, 'gaussiana: ⟨V⟩ = −2√(2α/π)', sp.simplify(Vg), -2 * sqrt(2 * al_g / pi))
solves(D, 'gaussiana: dE/dα = 0 ⇒ α = 8/(9π)', [Eq(diff(R_(3, 2) * al_g - 2 * sqrt(2 * al_g / pi), al_g), 0)], al_g, 8 / (9 * pi))
ident(D, 'gaussiana: E mínima = −4/(3π)', sp.simplify((R_(3, 2) * al_g - 2 * sqrt(2 * al_g / pi)).subs(al_g, 8 / (9 * pi))), -4 / (3 * pi))
# principio variacional con matrices aleatorias y comprobación numérica de las integrales
ok_v = True
for _ in range(2000):
    A_ = rng.normal(size=(8, 8)); A_ = (A_ + A_.T) / 2; v_ = rng.normal(size=8); v_ /= np.linalg.norm(v_)
    ok_v &= (v_ @ A_ @ v_ >= np.linalg.eigvalsh(A_)[0] - 1e-12)
rec(G_STEP, D, 'principio variacional: ⟨ψ|H|ψ⟩ ≥ E₀ en 2000 funciones de prueba aleatorias', 1.0, 1.0, 'todas', bool(ok_v))
zz = 1.3
inn = lambda r1_: quad(lambda s: zz ** 3 / math.pi * math.exp(-2 * zz * s) * 4 * math.pi * s * s, 0, r1_)[0] / r1_ + quad(lambda s: zz ** 3 / math.pi * math.exp(-2 * zz * s) * 4 * math.pi * s, r1_, np.inf)[0]
v12n = quad(lambda r1_: zz ** 3 / math.pi * math.exp(-2 * zz * r1_) * 4 * math.pi * r1_ ** 2 * inn(r1_), 0, np.inf, epsabs=1e-12)[0]
rec(G_STEP, D, 'integral doble numérica de ⟨1/r₁₂⟩ (ζ=1.3) = 5ζ/8', v12n, 5 * zz / 8, 'rel 1e-8', abs(v12n / (5 * zz / 8) - 1) < 1e-8)
opt = minimize_scalar(lambda zeta: zeta ** 2 - 4 * zeta + 5 * zeta / 8, bracket=(1, 2), tol=1e-12)
rec(G_STEP, D, 'minimización numérica de E(ζ) para Z=2: ζ = 27/16', opt.x, 27 / 16, 'rel 1e-7', abs(opt.x / (27 / 16) - 1) < 1e-7)
E_He = -2 * EH * (27 / 16) ** 2
rec(G_STEP, D, 'cota variacional: E_var(He) ≥ E_exp = −79.005 eV', E_He, -79.005, 'ineq', E_He >= -79.005)
rec(G_STEP, D, 'cota variacional con la energía no relativista casi exacta −2.9037 hartree', -(27 / 16) ** 2, -2.9037, 'ineq', -(27 / 16) ** 2 >= -2.9037)
hbd, md, a0d2, Eh_, Es2 = [Symbol(k, positive=True) for k in ('hbar', 'm', 'a_0', 'E_h', 'E_var')]
uV = {'hbar': 'J s', 'm': 'kg', 'a_0': 'm', 'E_h': 'J', 'E_var': 'J', 'Z': '1', 'zeta': '1'}
dimcheck(D, 'E_h = ħ²/(m a₀²)', Eh_, hbd ** 2 / (md * a0d2 ** 2), uV)
dimcheck(D, 'E_var = −E_h(Z − 5/16)²', Es2, Eh_ * (Zt - R_(5, 16)) ** 2, uV)
dimcheck(D, 'E(ζ) = E_h(ζ² − 2Zζ + 5ζ/8)', Es2, Eh_ * (zt ** 2 - 2 * Zt * zt + R_(5, 8) * zt), uV)
Ehv = 2 * EH
num(D, 'hartree (eV)', Ehv, '27.2114'); num(D, 'ζ (He)', 27 / 16, '1.6875'); num(D, 'E (hartree)', -(27 / 16) ** 2, '-2.8477'); num(D, 'E_var (eV)', E_He, '-77.489'); num(D, 'error vs experimento (%)', abs(E_He / -79.005 - 1) * 100, '1.9')
E1o = -2 * EH * (4 - 5 * 2 / 8)
num(D, 'E 1.er orden (eV)', E1o, '-74.831'); num(D, 'error 1.er orden (%)', abs(E1o / -79.005 - 1) * 100, '5.3'); num(D, 'I estimada', EH * (2 * (27 / 16) ** 2 - 4), '23.066')
num(D, 'Li⁺ E_var', -2 * EH * (3 - 5 / 16) ** 2, '-196.54'); num(D, 'Li⁺ error (%)', abs(-2 * EH * (3 - 5 / 16) ** 2 / -198.094 - 1) * 100, '0.79'); num(D, 'Be²⁺ E_var', -2 * EH * (4 - 5 / 16) ** 2, '-370.01'); num(D, 'Be²⁺ error (%)', abs(-2 * EH * (4 - 5 / 16) ** 2 / -371.615 - 1) * 100, '0.43')
num(D, 'H⁻ con la misma función', -2 * EH * (1 - 5 / 16) ** 2, '-12.862'); num(D, 'gaussiana para H (hartree)', -4 / (3 * math.pi), '-0.42441'); num(D, 'gaussiana: fracción de −0.5 (%)', 4 / (3 * math.pi) / 0.5 * 100, '85')
num(D, 'valor inicial: E_var', E_He, '-77.4887'); num(D, 'valor inicial: 1.er orden', E1o, '-74.8313'); num(D, 'valor inicial: I', EH * (2 * (27 / 16) ** 2 - 4), '23.0659')
Zv = symbols('Z', positive=True)
fsim('variacional', 'zeta', Zv - R_(5, 16), deriv=D)
fsim('variacional', 'E', -2 * EHq * (Zv - R_(5, 16)) ** 2, deriv=D)
fsim('variacional', 'E1', -2 * EHq * (Zv ** 2 - 5 * Zv / 8), deriv=D)
fsim('variacional', 'I', EHq * (2 * (Zv - R_(5, 16)) ** 2 - Zv ** 2), deriv=D)

# ================================================================ regla de oro
D = 'regla-de-oro'
xx, tt_ = symbols('xx tt', real=True), Symbol('tt', positive=True)
Dl_ = Symbol('Dl', real=True)
integral(D, '∫ sin²(Δt/2)/(Δ/2)² dΔ = 2πt (P_f crece linealmente con t)', sin(Dl_ * tt_ / 2) ** 2 / (Dl_ / 2) ** 2, Dl_, -oo, oo, 2 * pi * tt_)
cft = Symbol('cft')
wfi, wv = symbols('wfi w', real=True)
ident(D, '∫₀ᵗ e^{iΔt′}dt′ = (e^{iΔt} − 1)/(iΔ) ⇒ |·|² = sin²(Δt/2)/(Δ/2)²', sp.simplify(sp.expand(sp.Abs((exp(sI * Dl_ * tt_) - 1) / (sI * Dl_)) ** 2 - sin(Dl_ * tt_ / 2) ** 2 / (Dl_ / 2) ** 2, complex=True)), 0)
integral(D, '∫ sin²θ dΩ = 2π∫sin³θ dθ = 8π/3', 2 * pi * sin(tha) ** 3, tha, 0, pi, 8 * pi / 3)
om, d2, e0, hb3, c3, V3, d_, e3 = [Symbol(k, positive=True) for k in ('omega', 'dd', 'eps0', 'hbar', 'c', 'V', 'dd2', 'e')]
prod = (2 * pi / hb3) * (hb3 * om / (2 * e0 * V3)) * (V3 * om ** 2 / (8 * pi ** 3 * c3 ** 3 * hb3)) * (8 * pi / 3) * d2
ident(D, 'A = (2π/ħ)(ħω/2ε₀V)(Vω²/8π³c³ħ)(8π/3)|d|² = ω³|d|²/(3πε₀ħc³)', sp.simplify(prod), om ** 3 * d2 / (3 * pi * e0 * hb3 * c3 ** 3))
alp_ = Symbol('al', positive=True); r2s = Symbol('r2', positive=True)
Aform = om ** 3 * (e3 ** 2 * r2s) / (3 * pi * e0 * hb3 * c3 ** 3)
ident(D, 'con d = e r y α = e²/(4πε₀ħc): A = 4αω³|r|²/(3c²)', sp.simplify(Aform.subs(e3, sqrt(alp_ * 4 * pi * e0 * hb3 * c3))), 4 * alp_ * om ** 3 * r2s / (3 * c3 ** 2))
Rr10 = R_nl(1, 0, rs, 1)
rad1 = integrate(Rr10 * Rr21 * rs ** 3, (rs, 0, oo))
ident(D, '⟨1s|z|2p₀⟩ = (2⁷√2/3⁵) a₀ = 0.744936 a₀', sp.simplify(rad1 * ang), 2 ** 7 * sqrt(2) / 3 ** 5)
num(D, '|r_fi| (a₀)', 2 ** 7 * math.sqrt(2) / 3 ** 5, '0.744936')
# modelo independiente de un nivel acoplado a un cuasi-continuo discreto (decaimiento exponencial)
N_c = 3001; dl_ = 0.02; Vc = 0.05
Hc = np.zeros((N_c + 1, N_c + 1)); Hc[1:, 1:] = np.diag((np.arange(N_c) - N_c // 2) * dl_); Hc[0, 1:] = Vc; Hc[1:, 0] = Vc
wv_, U_ = np.linalg.eigh(Hc)
tgrid = np.linspace(0.5, 3.0, 26)
Pt = np.array([abs(np.sum(U_[0, :] ** 2 * np.exp(-1j * wv_ * t_))) ** 2 for t_ in tgrid])
slope = np.polyfit(tgrid, np.log(Pt), 1)[0]
Gam = 2 * math.pi * Vc ** 2 / dl_
rec(G_STEP, D, 'cuasi-continuo discreto (3000 niveles): P(t) decae con la tasa Γ = 2πV²ρ', -slope, Gam, 'rel 2e-2', abs(-slope / Gam - 1) < 2e-2)
Aj, wj, dj, e0j, hbj, cj, aj, rj, ej, tj = [Symbol(k, positive=True) for k in ('A', 'omega', 'd', 'eps0', 'hbar', 'c', 'alpha', 'r', 'e', 'tau')]
uG = {'A': 's^-1', 'omega': 'rad s^-1', 'd': 'C m', 'eps0': 'F m^-1', 'hbar': 'J s', 'c': 'm s^-1', 'alpha': '1', 'r': 'm', 'tau': 's'}
dimcheck(D, 'A = ω³|d|²/(3πε₀ħc³)', Aj, wj ** 3 * dj ** 2 / (3 * pi * e0j * hbj * cj ** 3), uG)
dimcheck(D, 'A = 4αω³|r|²/(3c²)', Aj, 4 * aj * wj ** 3 * rj ** 2 / (3 * cj ** 2), uG)
dimcheck(D, 'τ = 1/A', tj, 1 / Aj, uG)
def Aem(Eph, r): w_ = Eph * qe / hb; return 4 * alpha * w_ ** 3 * (r * a0) ** 2 / (3 * c ** 2)
r0 = 2 ** 7 * math.sqrt(2) / 3 ** 5; E0l = 0.75 * EH
A0_ = Aem(E0l, r0)
num(D, 'ħω Lyα (masa infinita, eV)', E0l, '10.2043'); num(D, 'A (10⁸ s⁻¹)', A0_ * 1e-8, '6.2683'); num(D, 'τ (ns)', 1 / A0_ * 1e9, '1.5953'); num(D, 'Δν (MHz)', A0_ / (2 * math.pi) * 1e-6, '99.763'); num(D, 'λ (nm)', h * c / (E0l * qe) * 1e9, '121.502')
mu_ = 1 / (1 + 1 / 1836.15267343)
A_real = Aem(0.75 * EH * mu_, r0 / mu_)
num(D, 'ħω Lyα con masa reducida (eV)', 0.75 * EH * mu_, '10.1987'); num(D, 'A real (10⁸ s⁻¹)', A_real * 1e-8, '6.2649'); num(D, 'τ real (ns)', 1 / A_real * 1e9, '1.5962')
num(D, 'He⁺: A (10¹⁰ s⁻¹)', 16 * A0_ * 1e-10, '1.0029'); num(D, 'He⁺: τ (ps)', 1 / (16 * A0_) * 1e12, '99.7'); num(D, 'factor 8 por ω×2', 2 ** 3, '8')
ident(D, 'A ∝ Z⁴ en iones hidrogenoides (ω ∝ Z², r ∝ 1/Z)', (Symbol('Z', positive=True) ** 2) ** 3 * (1 / Symbol('Z', positive=True)) ** 2, Symbol('Z', positive=True) ** 4)
rec(G_STEP, D, 'A(He⁺, 2p→1s) calculada con ω y r escalados es 16 A(H)', Aem(4 * E0l, r0 / 2) / A0_, 16.0, 'rel 1e-9', abs(Aem(4 * E0l, r0 / 2) / A0_ / 16 - 1) < 1e-9)
num(D, 'a₀/λ', a0 / (121.502e-9), '4e-4', tol=0.1); num(D, 'τ de 2s→1s (s)', 1 / 8.229, '0.12', tol=0.02)
num(D, 'valor inicial: A', A0_ * 1e-8, '6.26832'); num(D, 'valor inicial: τ', 1 / A0_ * 1e9, '1.59533'); num(D, 'valor inicial: Δν', A0_ / (2 * math.pi) * 1e-6, '99.7633'); num(D, 'valor inicial: λ', h * c / (E0l * qe) * 1e9, '121.502')
Ee, rr_ = symbols('E r', positive=True)
Aq = 4 * alq * (Ee * qeq / hbq) ** 3 * (rr_ * a0q) ** 2 / (3 * cq ** 2)
fsim('emision', 'A', Aq * sp.Float('1e-8', 40), deriv=D)
fsim('emision', 'tau', 1 / Aq * sp.Float('1e9', 40), deriv=D)
fsim('emision', 'dnu', Aq / (2 * sp.pi) * sp.Float('1e-6', 40), deriv=D)
fsim('emision', 'lam', hq * cq / (Ee * qeq) * sp.Float('1e9', 40), deriv=D)
