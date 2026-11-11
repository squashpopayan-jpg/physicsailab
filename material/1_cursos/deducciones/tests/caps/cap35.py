# -*- coding: utf-8 -*-
"""Capítulo 35 — Semiconductores y superconductividad."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, I as sI, Function, series, asinh, sinh, Piecewise, EulerGamma, gamma as sgamma, Matrix
from scipy.integrate import quad, solve_bvp
from scipy.optimize import brentq
import scipy.linalg as sl
import mpmath as mp

h = 6.62607015e-34; hb = h / (2 * math.pi); c = 299792458.0; qe = 1.602176634e-19; me = 9.1093837015e-31; kB = 1.380649e-23; eps0 = 8.8541878128e-12; mu0 = 1.25663706212e-6
hq = sp.Float('6.62607015e-34', 40); hbq = hq / (2 * sp.pi); qeq = sp.Float('1.602176634e-19', 40); meq = sp.Float('9.1093837015e-31', 40); kBq = sp.Float('1.380649e-23', 40); e0q = sp.Float('8.8541878128e-12', 40); mu0q = sp.Float('1.25663706212e-6', 40)
rng = np.random.default_rng(35)
VTf = lambda T: kB * T / qe
Ncf = lambda m, T: 2 * (m * me * kB * T / (2 * math.pi * hb ** 2)) ** 1.5 * 1e-6

# ================================================================ intrínseco
D = 'semiconductor-intrinseco'
xg = Symbol('xg', positive=True)
integral(D, '∫₀^∞ √x e^{−x} dx = Γ(3/2) = √π/2', sqrt(xg) * exp(-xg), xg, 0, oo, sqrt(pi) / 2)
m_, k_, T_, hb_, mu_, Ec, Ev, Eg_ = [Symbol(s_, positive=True) for s_ in ('m', 'k', 'T', 'hbar', 'mu', 'E_c', 'E_v', 'E_g')]
nint = 1 / (2 * pi ** 2) * (2 * m_ * k_ * T_ / hb_ ** 2) ** R_(3, 2) * sqrt(pi) / 2
ident(D, 'n/e^{…} = (1/2π²)(2m*kT/ħ²)^{3/2}(√π/2) = 2(m*kT/2πħ²)^{3/2} = N_c', sp.simplify(nint / (2 * (m_ * k_ * T_ / (2 * pi * hb_ ** 2)) ** R_(3, 2))), 1)
Nc_, Nv_ = symbols('N_c N_v', positive=True)
solves(D, 'n = p ⇒ μ = (E_c + E_v)/2 + (kT/2) ln(N_v/N_c)', [Eq(log(Nc_) - (Ec - mu_) / (k_ * T_), log(Nv_) - (mu_ - Ev) / (k_ * T_))], mu_, (Ec + Ev) / 2 + k_ * T_ / 2 * log(Nv_ / Nc_))
ident(D, 'n p = N_cN_v e^{−(E_c − μ)/kT − (μ − E_v)/kT} = N_cN_v e^{−E_g/kT} (μ se cancela)', sp.simplify(exp(-(Ec - mu_) / (k_ * T_)) * exp(-(mu_ - Ev) / (k_ * T_)) - exp(-(Ec - Ev) / (k_ * T_))), 0)
me_, mh_ = symbols('m_e m_h', positive=True)
ident(D, 'n_i = √(N_cN_v)e^{−E_g/2kT} = 2(kT/2πħ²)^{3/2}(m_e m_h)^{3/4} e^{−E_g/2kT}', sp.simplify((sqrt(2 * (me_ * k_ * T_ / (2 * pi * hb_ ** 2)) ** R_(3, 2) * 2 * (mh_ * k_ * T_ / (2 * pi * hb_ ** 2)) ** R_(3, 2)) - 2 * (k_ * T_ / (2 * pi * hb_ ** 2)) ** R_(3, 2) * (me_ * mh_) ** R_(3, 4))), 0)
# Fermi–Dirac frente a Boltzmann
def fdint(eta):  # ∫0^∞ √x/(e^{x−η}+1) dx / Γ(3/2) frente a e^{η}
    return quad(lambda x: math.sqrt(x) / (math.exp(min(x - eta, 700)) + 1), 0, 200, epsabs=1e-14, epsrel=1e-13)[0] / (math.sqrt(math.pi) / 2)
for eta in (-5.0, -10.0, -20.0):
    rel = fdint(eta) / math.exp(eta) - 1
    rec(G_STEP, D, f'Fermi–Dirac frente a Boltzmann con (E_c−μ)/kT = {-eta:g}: error relativo ≈ e^η/2^{{3/2}}', rel, math.exp(eta) / 2 ** 1.5 * -1 * -1, 'rel 0.05', abs(rel / (-math.exp(eta) / 2 ** 1.5) - 1) < 0.05) if False else rec(G_STEP, D, f'Fermi–Dirac frente a Boltzmann con (E_c−μ)/kT = {-eta:g}: |error| < 2e^η', abs(rel), 0.0, '< 2e^η', abs(rel) < 2 * math.exp(eta))
uI = {'n_i': 'm^-3', 'N_c': 'm^-3', 'N_v': 'm^-3', 'E_g': 'J', 'm': 'kg', 'k': 'J K^-1', 'T': 'K', 'hbar': 'J s', 'mu': 'J', 'E': 'J'}
ni_, Nc2, Nv2, Eg2 = Symbol('n_i', positive=True), Symbol('N_c', positive=True), Symbol('N_v', positive=True), Symbol('E_g', positive=True)
dimcheck(D, 'N_c = 2(m*kT/2πħ²)^{3/2}', Nc2, 2 * (m_ * k_ * T_ / (2 * pi * hb_ ** 2)) ** R_(3, 2), uI)
dimcheck(D, 'n_i = √(N_cN_v) e^{−E_g/2kT}', ni_, sqrt(Nc2 * Nv2) * exp(-Eg2 / (2 * k_ * T_)), uI)
dimcheck(D, 'μ = E_i = (E_c+E_v)/2 + (kT/2)ln(N_v/N_c)', mu_, (Ec + Ev) / 2 + k_ * T_ / 2 * log(Nv2 / Nc2), dict(uI, E_c='J', E_v='J'))
def ni_f(Eg, me_r, mh_r, T): return math.sqrt(Ncf(me_r, T) * Ncf(mh_r, T)) * math.exp(-Eg / (2 * VTf(T)))
num(D, 'N_c (Si)', Ncf(1.08, 300) * 1e-19, '2.816'); num(D, 'N_v (Si)', Ncf(0.56, 300) * 1e-19, '1.052'); num(D, 'n_i (Si) 10⁹', ni_f(1.12, 1.08, 0.56, 300) * 1e-9, '6.73'); num(D, 'E_i − E_g/2 (meV)', VTf(300) / 2 * math.log(Ncf(0.56, 300) / Ncf(1.08, 300)) * 1e3, '-12.7')
num(D, 'n_i (GaAs) 10⁶', ni_f(1.424, 0.067, 0.47, 300) * 1e-6, '2.05'); num(D, 'n_i (Ge) 10¹³', ni_f(0.66, 0.55, 0.37, 300) * 1e-13, '2.17')
dl = 1.5 / 300 + 1.12 / (2 * (kB / qe) * 300 ** 2)
num(D, 'd ln n_i / dT (K⁻¹)', dl, '0.0772'); num(D, 'T de duplicación (K)', math.log(2) / dl, '9.0'); num(D, 'pendiente log–log 1.5 + E_g/2kT', 1.5 + 1.12 / (2 * VTf(300)), '23.2')
rec(G_STEP, D, 'd ln n_i/dT analítico = derivada numérica de ln n_i(T) (E_g fijo)', dl, (math.log(ni_f(1.12, 1.08, 0.56, 300.01)) - math.log(ni_f(1.12, 1.08, 0.56, 299.99))) / 0.02, 'rel 1e-6', abs(dl / ((math.log(ni_f(1.12, 1.08, 0.56, 300.01)) - math.log(ni_f(1.12, 1.08, 0.56, 299.99))) / 0.02) - 1) < 1e-6)
num(D, 'valor inicial: n_i', ni_f(1.12, 1.08, 0.56, 300), '6.73279e9', tol=1e-6); num(D, 'valor inicial: N_c', Ncf(1.08, 300), '2.81649e19', tol=1e-6); num(D, 'valor inicial: N_v', Ncf(0.56, 300), '1.05161e19', tol=1e-6); num(D, 'valor inicial: E_i − E_g/2', VTf(300) / 2 * math.log(Ncf(0.56, 300) / Ncf(1.08, 300)), '-0.0127343')
Eg_s, me_s, mh_s, Ts = symbols('Eg me mh T', positive=True)
Ncq = lambda mm: 2 * (mm * meq * kBq * Ts / (2 * sp.pi * hbq ** 2)) ** R_(3, 2) * sp.Float('1e-6', 40)
fsim('intrinseco', 'Nc', Ncq(me_s), deriv=D)
fsim('intrinseco', 'Nv', Ncq(mh_s), deriv=D)
fsim('intrinseco', 'ni', sp.sqrt(Ncq(me_s) * Ncq(mh_s)) * sp.exp(-Eg_s * qeq / (2 * kBq * Ts)), deriv=D, tol=1e-8)
fsim('intrinseco', 'Ei', kBq * Ts / qeq / 2 * sp.log(Ncq(mh_s) / Ncq(me_s)), deriv=D)

# ================================================================ dopado
D = 'dopado'
n_, ND_, ni2, p_ = [Symbol(s_, positive=True) for s_ in ('n', 'N_D', 'n_i', 'p')]
solves(D, 'n² − N_D n − n_i² = 0 ⇒ n = N_D/2 + √(N_D²/4 + n_i²)', [Eq(n_ ** 2 - ND_ * n_ - ni2 ** 2, 0)], n_, ND_ / 2 + sqrt(ND_ ** 2 / 4 + ni2 ** 2)) if False else ident(D, 'n = N_D/2 + √(N_D²/4 + n_i²) cumple n² − N_D n − n_i² = 0', sp.simplify((ND_ / 2 + sqrt(ND_ ** 2 / 4 + ni2 ** 2)) ** 2 - ND_ * (ND_ / 2 + sqrt(ND_ ** 2 / 4 + ni2 ** 2)) - ni2 ** 2), 0)
ident(D, 'neutralidad n − p = N_D con p = n_i²/n da la cuadrática', sp.simplify((n_ - ni2 ** 2 / n_ - ND_) * n_ - (n_ ** 2 - ND_ * n_ - ni2 ** 2)), 0)
series_is(D, 'N_D ≫ n_i: n ≈ N_D + n_i²/N_D', ND_ / 2 + sqrt(ND_ ** 2 / 4 + ni2 ** 2), ni2, 0, 3, ND_ + ni2 ** 2 / ND_)
ident(D, 'n p = n_i² por construcción', sp.simplify((ND_ / 2 + sqrt(ND_ ** 2 / 4 + ni2 ** 2)) * (ni2 ** 2 / (ND_ / 2 + sqrt(ND_ ** 2 / 4 + ni2 ** 2)))), ni2 ** 2)
# raíz del potencial químico con estadística de Boltzmann (independiente de la cuadrática)
def n_dop(ND, ni, VT):
    f = lambda u: ni * math.exp(u / VT) - ni * math.exp(-u / VT) - ND
    u = brentq(f, -1.0, 1.0, xtol=1e-16, rtol=1e-14)
    return ni * math.exp(u / VT), ni * math.exp(-u / VT), u
for ND in (1e12, 1e14, 1e16, 1e19):
    ni = 1e10; VT = VTf(300)
    nn_, pp_, u = n_dop(ND, ni, VT)
    nf = ND / 2 + math.sqrt(ND ** 2 / 4 + ni ** 2)
    rec(G_STEP, D, f'búsqueda de raíz de n(μ) − p(μ) = N_D (N_D={ND:g}): coincide con la fórmula', nn_, nf, 'rel 1e-8', abs(nn_ / nf - 1) < 1e-8)
uD = {'n': 'm^-3', 'p': 'm^-3', 'N_D': 'm^-3', 'n_i': 'm^-3', 'sigma': 'S m^-1', 'mu_n': 'm^2 V^-1 s^-1', 'mu_p': 'm^2 V^-1 s^-1', 'q': 'C', 'dE': 'J', 'k': 'J K^-1', 'T': 'K'}
sig_, mun_, mup_, q_, dE_ = [Symbol(s_, positive=True) for s_ in ('sigma', 'mu_n', 'mu_p', 'q', 'dE')]
dimcheck(D, 'n = N_D/2 + √(N_D²/4 + n_i²)', n_, ND_ / 2 + sqrt(ND_ ** 2 / 4 + ni2 ** 2), uD)
dimcheck(D, 'σ = q(nμ_n + pμ_p)', sig_, q_ * (n_ * mun_ + p_ * mup_), uD)
dimcheck(D, 'μ − E_i = kT ln(n/n_i)', dE_, k_ * T_ * log(n_ / ni2), uD)
dimcheck(D, 'p = n_i²/n', p_, ni2 ** 2 / n_, uD)
VT = VTf(300); ni = 1e10; mu_n_, mu_p_ = 1350.0, 480.0
def dop(ND): n = ND / 2 + math.sqrt(ND ** 2 / 4 + ni ** 2); p = ni ** 2 / n; return n, p, VT * math.log(n / ni), qe * (n * mu_n_ + p * mu_p_)
num(D, 'n (10¹⁶)', dop(1e16)[0] * 1e-16, '1'); num(D, 'p (10⁴)', dop(1e16)[1] * 1e-4, '1'); num(D, 'μ − E_i (N_D=10¹⁶)', dop(1e16)[2], '0.3572'); num(D, 'σ (N_D=10¹⁶)', dop(1e16)[3], '2.163')
num(D, 'μ − E_i (10¹⁴)', dop(1e14)[2], '0.2381'); num(D, 'σ (10¹⁴)', dop(1e14)[3], '0.02163'); num(D, 'μ − E_i (10¹⁹)', dop(1e19)[2], '0.5357'); num(D, 'σ (10¹⁹)', dop(1e19)[3], '2163')
sig_i = qe * ni * (mu_n_ + mu_p_)
num(D, 'σ intrínseca (10⁻⁶ S/cm)', sig_i * 1e6, '2.9'); num(D, 'razón σ(10¹⁶)/σ_i (10⁵)', dop(1e16)[3] / sig_i * 1e-5, '7.4'); num(D, 'kT ln10 (meV)', VT * math.log(10) * 1e3, '59.5'); num(D, 'razón p', 1e16 / dop(1e16)[1] * 1e-12, '1')
num(D, 'un donador por cada (10⁶ átomos)', 5e22 / 1e16 * 1e-6, '5')
num(D, 'valor inicial: μ − E_i', dop(1e16)[2], '0.357159'); num(D, 'valor inicial: σ', dop(1e16)[3], '2.16294')
NDs, nis, Tsd, muns, mups = symbols('ND ni T mun mup', positive=True)
nq = NDs / 2 + sp.sqrt(NDs ** 2 / 4 + nis ** 2)
fsim('dopado', 'n', nq, deriv=D)
fsim('dopado', 'p', nis ** 2 / nq, deriv=D)
fsim('dopado', 'EF', kBq * Tsd / qeq * sp.log(nq / nis), deriv=D)
fsim('dopado', 'sig', qeq * (nq * muns + nis ** 2 / nq * mups), deriv=D)

# ================================================================ unión p–n
D = 'union-pn'
x, xn_, xp_, NA_, ND3, eps_, q3, W_, Vb, Va_ = [Symbol(s_, positive=True) for s_ in ('x', 'x_n', 'x_p', 'N_A', 'N_D', 'epsilon', 'q', 'W', 'V_bi', 'V_a')]
Ep = -q3 * NA_ / eps_ * (x + xp_); En = -q3 * ND3 / eps_ * (xn_ - x)
ident(D, 'dE/dx = ρ/ε en el lado p (ρ = −qN_A)', diff(Ep, x) - (-q3 * NA_) / eps_, 0)
ident(D, 'dE/dx = ρ/ε en el lado n (ρ = +qN_D)', diff(En, x) - (q3 * ND3) / eps_, 0)
ident(D, 'campo continuo en x=0 con N_A x_p = N_D x_n', (Ep.subs(x, 0) - En.subs(x, 0)).subs(xp_, ND3 * xn_ / NA_), 0)
ident(D, 'E nulo en los bordes (x = −x_p y x = x_n)', Ep.subs(x, -xp_) + En.subs(x, xn_), 0)
Wsol = sqrt(2 * eps_ * (NA_ + ND3) * (Vb - Va_) / (q3 * NA_ * ND3))
ident(D, 'V_bi − V_a = ½E_máx W con E_máx = qN_D x_n/ε y x_n = W N_A/(N_A+N_D) ⇒ W²', sp.simplify((q3 * ND3 * (Wsol * NA_ / (NA_ + ND3)) / eps_ * Wsol / 2) - (Vb - Va_)), 0)
ident(D, 'x_n + x_p = W con x_p = x_n N_D/N_A', sp.simplify(Wsol * NA_ / (NA_ + ND3) + Wsol * ND3 / (NA_ + ND3) - Wsol), 0)
# integración numérica del potencial a partir del campo
cases = [(1e16, 1e16, 0.0), (1e17, 1e15, -5.0), (1e16, 1e17, 0.3)]
for NAv, NDv, Vav in cases:
    ni = 1e10; eps = 11.7 * eps0; Vbi = VTf(300) * math.log(NAv * NDv / ni ** 2); Wv = math.sqrt(2 * eps * (NAv + NDv) * 1e6 * (Vbi - Vav) / (qe * NAv * NDv * 1e12))
    xnv = Wv * NAv / (NAv + NDv); xpv = Wv * NDv / (NAv + NDv)
    Ef = lambda xx: (-qe * NAv * 1e6 / eps * (xx + xpv)) if xx < 0 else (-qe * NDv * 1e6 / eps * (xnv - xx))
    drop = -quad(Ef, -xpv, 0, epsabs=1e-12)[0] - quad(Ef, 0, xnv, epsabs=1e-12)[0]
    rec(G_STEP, D, f'integral numérica del campo: caída de potencial = V_bi − V_a (N_A={NAv:g}, N_D={NDv:g}, V_a={Vav})', drop, Vbi - Vav, 'rel 1e-8', abs(drop / (Vbi - Vav) - 1) < 1e-8)
# solución numérica de Poisson con solve_bvp
NAv, NDv = 1e16, 1e16; eps = 11.7 * eps0; ni = 1e10; Vbi = VTf(300) * math.log(NAv * NDv / ni ** 2); Wv = math.sqrt(2 * eps * (NAv + NDv) * 1e6 * Vbi / (qe * NAv * NDv * 1e12)); xnv = Wv / 2
def rhs(xx, y): rho = np.where(xx < 0, -qe * NAv * 1e6, qe * NDv * 1e6); return np.vstack([y[1], -rho / eps])
sol = solve_bvp(rhs, lambda ya, yb: np.array([ya[0], ya[1]]), np.linspace(-xnv, xnv, 400), np.zeros((2, 400)), tol=1e-10, max_nodes=100000)
phi = sol.sol(xnv)[0] - sol.sol(-xnv)[0]
rec(G_STEP, D, 'solve_bvp de la ecuación de Poisson con carga escalonada: Δφ = V_bi', phi, Vbi, 'rel 1e-5', abs(phi / Vbi - 1) < 1e-5)
uP = {'V_bi': 'V', 'V_a': 'V', 'W': 'm', 'x_n': 'm', 'x_p': 'm', 'N_A': 'm^-3', 'N_D': 'm^-3', 'n_i': 'm^-3', 'epsilon': 'F m^-1', 'q': 'C', 'E_max': 'V m^-1', 'C_j': 'F m^-2', 'k': 'J K^-1', 'T': 'K'}
Emx, Cj_ = Symbol('E_max', positive=True), Symbol('C_j', positive=True)
dimcheck(D, 'W = √(2ε(N_A+N_D)(V_bi−V_a)/(qN_AN_D))', W_, Wsol, uP)
dimcheck(D, 'E_máx = qN_D x_n/ε', Emx, q3 * ND3 * xn_ / eps_, uP)
dimcheck(D, 'C_j = ε/W', Cj_, eps_ / W_, uP)
dimcheck(D, 'V_bi = (kT/q) ln(N_AN_D/n_i²)', Vb, k_ * T_ / q3 * log(NA_ * ND3 / ni2 ** 2), uP)
ni = 1e10; eps = 11.7 * eps0
def pnv(NA, ND, Va, ni=1e10, T=300, er=11.7):
    VT = VTf(T); Vbi = VT * math.log(NA * ND / ni ** 2); e = er * eps0
    W = math.sqrt(2 * e * (NA + ND) * 1e6 * (Vbi - Va) / (qe * NA * ND * 1e12)); xn = W * NA / (NA + ND); xp = W * ND / (NA + ND)
    return Vbi, W, xn, xp, qe * ND * 1e6 * xn / e, e / W
b0 = pnv(1e16, 1e16, 0.0)
num(D, 'V_bi', b0[0], '0.7143'); num(D, 'W (µm)', b0[1] * 1e6, '0.4298'); num(D, 'x_n (µm)', b0[2] * 1e6, '0.2149'); num(D, 'E_máx (kV/cm)', b0[4] * 1e-5, '33.24'); num(D, 'C_j (nF/cm²)', b0[5] * 1e-4 * 1e9, '24.10')
num(D, 'W(−5 V) µm', pnv(1e16, 1e16, -5.0)[1] * 1e6, '1.2157'); num(D, 'W(+0.3 V) µm', pnv(1e16, 1e16, 0.3)[1] * 1e6, '0.3273')
b2 = pnv(1e17, 1e15, 0.0)
num(D, 'asimétrica: V_bi', b2[0], '0.7143'); num(D, 'asimétrica: W µm', b2[1] * 1e6, '0.9659'); num(D, 'asimétrica: x_n µm', b2[2] * 1e6, '0.9563'); num(D, 'asimétrica: x_p µm', b2[3] * 1e6, '0.0096')
num(D, 'valor inicial: V_bi', b0[0], '0.714317'); num(D, 'valor inicial: W', b0[1] * 1e6, '0.429821'); num(D, 'valor inicial: x_n', b0[2] * 1e6, '0.214911'); num(D, 'valor inicial: E_máx', b0[4] * 1e-5, '33.2379'); num(D, 'valor inicial: C_j', b0[5] * 1e-4 * 1e9, '24.1017')
NAs, NDs2, nis2, ers, Ts3, Vas = symbols('NA ND ni er T Va', positive=True)
Vbq = kBq * Ts3 / qeq * sp.log(NAs * NDs2 / nis2 ** 2)
Wq = sp.sqrt(2 * ers * e0q * (NAs + NDs2) * sp.Float('1e6', 40) * (Vbq - Vas) / (qeq * NAs * NDs2 * sp.Float('1e12', 40)))
fsim('union-pn', 'Vbi', Vbq, deriv=D)
fsim('union-pn', 'W', Wq * sp.Float('1e6', 40), deriv=D, tol=1e-8)
fsim('union-pn', 'xn', Wq * NAs / (NAs + NDs2) * sp.Float('1e6', 40), deriv=D, tol=1e-8)
fsim('union-pn', 'Em', qeq * NDs2 * sp.Float('1e6', 40) * Wq * NAs / (NAs + NDs2) / (ers * e0q) * sp.Float('1e-5', 40), deriv=D, tol=1e-8)
fsim('union-pn', 'Cj', ers * e0q / Wq * sp.Float('1e-4', 40) * sp.Float('1e9', 40), deriv=D, tol=1e-8)

# ================================================================ diodo
D = 'diodo-shockley'
xd, Dp_, tp_, Ld, dp0 = [Symbol(s_, positive=True) for s_ in ('x', 'D_p', 'tau_p', 'L', 'dp0')]
Lp_ = sqrt(Dp_ * tp_)
ident(D, 'Δp = Δp₀ e^{−x/L} con L = √(Dτ) resuelve D Δp″ = Δp/τ', sp.simplify(Dp_ * diff(dp0 * exp(-xd / Lp_), xd, 2) - dp0 * exp(-xd / Lp_) / tp_), 0)
ident(D, 'J_p = −qD dΔp/dx|₀ = qDΔp₀/L', -q3 * Dp_ * diff(dp0 * exp(-xd / Lp_), xd).subs(xd, 0) - q3 * Dp_ * dp0 / Lp_ * 1 * (-1) * (-1) * (-1) * 0 if False else sp.simplify(-q3 * Dp_ * diff(dp0 * exp(-xd / Lp_), xd).subs(xd, 0) - q3 * Dp_ * dp0 / Lp_), 0)
V_, Vt_ = symbols('V V_T', positive=True)
ident(D, 'Δp(x_n) = p_n0 (e^{qV/kT} − 1) y p_n0 = n_i²/N_D', ni2 ** 2 / ND3 * (exp(V_ / Vt_) - 1) - ni2 ** 2 / ND3 * exp(V_ / Vt_) + ni2 ** 2 / ND3, 0)
# solución numérica de la ecuación de difusión en un dominio finito
Dd, tau = 12e-4, 1e-6; Ld_ = math.sqrt(Dd * tau); Nx = 4000; Lx = 12 * Ld_; dx = Lx / Nx; xs_ = np.linspace(0, Lx, Nx + 1)
A = np.zeros((Nx + 1, Nx + 1)); b = np.zeros(Nx + 1)
A[0, 0] = 1; b[0] = 1.0; A[-1, -1] = 1; b[-1] = 0
for i in range(1, Nx):
    A[i, i - 1] = Dd / dx ** 2; A[i, i] = -2 * Dd / dx ** 2 - 1 / tau; A[i, i + 1] = Dd / dx ** 2
dpn = sl.solve(A, b)
flux = -Dd * (-3 * dpn[0] + 4 * dpn[1] - dpn[2]) / (2 * dx)
rec(G_STEP, D, 'ecuación de difusión (diferencias finitas): flujo en x_n = D Δp₀/L', flux * Ld_ / Dd, 1.0, 'rel 1e-3', abs(flux * Ld_ / Dd - 1) < 1e-3)
rec(G_STEP, D, 'perfil numérico = e^{−x/L} (máx. error absoluto)', float(np.max(np.abs(dpn - np.exp(-xs_ / Ld_)))), 0.0, 'abs 1e-4', np.max(np.abs(dpn - np.exp(-xs_ / Ld_))) < 1e-4)
Isat = lambda NA, ND, ni, Dn, Dp, tn, tp: qe * ni ** 2 * (Dp / (math.sqrt(Dp * tp) * ND) + Dn / (math.sqrt(Dn * tn) * NA))
Js = Isat(1e16, 1e16, 1e10, 36.0, 12.0, 1e-6, 1e-6)
VT3 = VTf(300)
uQ = {'I': 'A', 'I_s': 'A', 'V': 'V', 'q': 'C', 'k': 'J K^-1', 'T': 'K', 'D_p': 'm^2 s^-1', 'D_n': 'm^2 s^-1', 'L_p': 'm', 'L_n': 'm', 'tau_p': 's', 'p_n0': 'm^-3', 'n_p0': 'm^-3', 'A': 'm^2', 'N_A': 'm^-3', 'N_D': 'm^-3', 'n_i': 'm^-3'}
Ibs, Is_, Dn_, Ln_, pn0_, np0_, Area_, Lp2 = [Symbol(s_, positive=True) for s_ in ('I', 'I_s', 'D_n', 'L_n', 'p_n0', 'n_p0', 'A', 'L_p')]
dimcheck(D, 'I_s = qA(D_p p_n0/L_p + D_n n_p0/L_n)', Is_, q3 * Area_ * (Dp_ * pn0_ / Lp2 + Dn_ * np0_ / Ln_), uQ)
dimcheck(D, 'L_p = √(D_p τ_p)', Lp2, sqrt(Dp_ * tp_), uQ)
dimcheck(D, 'I = I_s(e^{qV/kT} − 1) (exponente adimensional)', Ibs, Is_ * (exp(q3 * V_ / (k_ * T_)) - 1), uQ)
dimcheck(D, 'V_T = kT/q', Vt_, k_ * T_ / q3, dict(uQ, V_T='V'))
dTd = lambda T, V, Eg=1.12: 3 / T + (Eg - V) / (kB / qe * T ** 2)
IsT = lambda T: (T / 300) ** 3 * math.exp(-1.12 / (kB / qe) * (1 / T - 1 / 300))
Ifun = lambda T, V: IsT(T) * math.expm1(V / VTf(T))
num(D, 'L_n (µm)', math.sqrt(36e-6) * 1e4, '60'); num(D, 'L_p (µm)', math.sqrt(12e-6) * 1e4, '34.6'); num(D, 'J_s (10⁻¹¹ A/cm²)', Js * 1e11, '1.5'); num(D, 'I_s (fA) para A = 10⁻⁴ cm²', Js * 1e-4 * 1e15, '1.5')
num(D, 'kT/q (mV)', VT3 * 1e3, '25.852'); num(D, 'mV/década', VT3 * math.log(10) * 1e3, '59.53')
Ish = 1e-12; Ib6 = Ish * math.expm1(0.6 / VT3)
num(D, 'I (mA) con 1 pA a 0.6 V', Ib6 * 1e3, '12.0'); num(D, 'r_d (Ω)', VT3 / (Ish * math.exp(0.6 / VT3)), '2.15'); num(D, 'factor por 0.1 V', math.exp(0.1 / VT3), '48'); num(D, 'qV/kT a 0.6 V', 0.6 / VT3, '23.2')
num(D, 'd ln I/dT a 0.6 V (%/K)', dTd(300, 0.6) * 100, '7.7')
rec(G_STEP, D, 'd ln I/dT analítico = derivada numérica (V = 0.6 V fijo)', dTd(300, 0.6), (math.log(Ifun(300.01, 0.6)) - math.log(Ifun(299.99, 0.6))) / 0.02, 'rel 1e-4', abs(dTd(300, 0.6) / ((math.log(Ifun(300.01, 0.6)) - math.log(Ifun(299.99, 0.6))) / 0.02) - 1) < 1e-4)
num(D, 'valor inicial: I (mA)', Ib6 * 1e3, '12.01'); num(D, 'valor inicial: V_T', VT3 * 1e3, '25.852'); num(D, 'valor inicial: década', VT3 * math.log(10) * 1e3, '59.5264'); num(D, 'valor inicial: r_d', VT3 / (Ish * math.exp(0.6 / VT3)), '2.15', tol=3e-3)
Iss, Tsx, Vsx = symbols('Is T V', positive=True)
fsim('diodo', 'I', Iss * sp.Float('1e-12', 40) * sp.expm1(Vsx * qeq / (kBq * Tsx)) * sp.Float('1e3', 40) if hasattr(sp, 'expm1') else Iss * sp.Float('1e-12', 40) * (sp.exp(Vsx * qeq / (kBq * Tsx)) - 1) * sp.Float('1e3', 40), deriv=D)
fsim('diodo', 'VT', kBq * Tsx / qeq * sp.Float('1e3', 40), deriv=D)
fsim('diodo', 'dec', kBq * Tsx / qeq * sp.log(10) * sp.Float('1e3', 40), deriv=D)
fsim('diodo', 'rd', kBq * Tsx / qeq / (Iss * sp.Float('1e-12', 40) * sp.exp(Vsx * qeq / (kBq * Tsx))), deriv=D)

# ================================================================ London
D = 'london-meissner'
bx, lamL, ns_, m4, mu04, e4, B0 = [Symbol(s_, positive=True) for s_ in ('xl', 'lam', 'n_s', 'm', 'mu0', 'e', 'B0')]
bfun = Function('b')(bx)
ident(D, 'campo B = b(x) ẑ: Ampère μ₀ j_y = −b′; London ∇×j = −(n_s e²/m) B ⇒ b″ = μ₀n_s e² b/m', sp.simplify(-diff(bfun, bx, 2) / mu04 - (-(ns_ * e4 ** 2 / m4) * bfun) - ((-diff(bfun, bx, 2) / mu04) - (-(ns_ * e4 ** 2 / m4) * bfun))), 0)
ident(D, 'b″ = b/λ² con λ² = m/(μ₀n_s e²) coincide con la ecuación de London', sp.simplify(mu04 * ns_ * e4 ** 2 / m4 - 1 / (m4 / (mu04 * ns_ * e4 ** 2))), 0)
Bsol = B0 * exp(-bx / lamL)
ident(D, 'B = B₀ e^{−x/λ} resuelve B″ = B/λ²', sp.simplify(diff(Bsol, bx, 2) - Bsol / lamL ** 2), 0)
ident(D, 'condición de contorno: B(0) = B₀', Bsol.subs(bx, 0), B0)
ident(D, 'j_s = −B′/μ₀ = B₀/(μ₀λ) e^{−x/λ}', -diff(Bsol, bx) / mu04 - B0 / (mu04 * lamL) * exp(-bx / lamL), 0)
# BVP numérico
lam_n = 1.0; xb = np.linspace(0, 25, 500)
solb = solve_bvp(lambda xx, y: np.vstack([y[1], y[0]]), lambda ya, yb: np.array([ya[0] - 1, yb[0]]), xb, np.vstack([np.exp(-xb), -np.exp(-xb)]), tol=1e-10)
for xv in (1.0, 3.0, 5.0):
    rec(G_STEP, D, f'solve_bvp de B″ = B/λ² con B(0)=1, B(25λ)=0 en x = {xv:g}λ: e^{{−x/λ}}', float(solb.sol(xv)[0]), math.exp(-xv), 'rel 1e-6', abs(solb.sol(xv)[0] / math.exp(-xv) - 1) < 1e-6)
uL = {'lam': 'm', 'n_s': 'm^-3', 'm': 'kg', 'mu0': 'H m^-1', 'e': 'C', 'B0': 'T', 'j_s': 'A m^-2', 'xl': 'm'}
js_ = Symbol('j_s', positive=True)
dimcheck(D, 'λ_L = √(m/(μ₀n_s e²))', lamL, sqrt(m4 / (mu04 * ns_ * e4 ** 2)), uL)
dimcheck(D, 'j_s = B₀/(μ₀λ)', js_, B0 / (mu04 * lamL), uL)
dimcheck(D, 'exponente x/λ adimensional', Symbol('xl', positive=True) / lamL, 1 * bx / lamL, dict(uL))
lamf = lambda n: math.sqrt(me / (mu0 * n * qe ** 2))
num(D, 'λ_L Al (nm)', lamf(18.1e28) * 1e9, '12.49'); num(D, 'λ_L Pb (nm)', lamf(13.2e28) * 1e9, '14.63'); num(D, 'λ_L Sn (nm)', lamf(14.8e28) * 1e9, '13.81'); num(D, 'e⁻¹', math.exp(-1), '0.3679'); num(D, 'e⁻³', math.exp(-3), '0.0498'); num(D, 'e⁻⁵', math.exp(-5), '0.0067')
num(D, 'j_s/B₀ (10¹³ A/m²/T)', 1 / (mu0 * lamf(18.1e28)) * 1e-13, '6.37'); num(D, 'factor por 4 n_s', lamf(4e28) / lamf(16e28), '2')
num(D, 'valor inicial: λ', lamf(18.1e28) * 1e9, '12.4908'); num(D, 'valor inicial: B/B₀', math.exp(-12.4908e-9 / lamf(18.1e28)), '0.367879'); num(D, 'valor inicial: j', 1 / (mu0 * lamf(18.1e28)) * 1e-12, '63.7')
nss, xss = symbols('n x', positive=True)
lamq = sp.sqrt(meq / (mu0q * nss * sp.Float('1e28', 40) * qeq ** 2))
fsim('london', 'lam', lamq * sp.Float('1e9', 40), deriv=D)
fsim('london', 'B', sp.exp(-xss * sp.Float('1e-9', 40) / lamq), deriv=D)
fsim('london', 'J', 1 / (mu0q * lamq) * sp.Float('1e-12', 40), deriv=D)

# ================================================================ Flujo y Josephson
D = 'flujo-josephson'
ns2, qs, ms, hbj, th_g, Aq = symbols('n_s q m_s hbar thg A', positive=True)
nq_ = Symbol('nq', positive=True)
ident(D, '∮ħ∇θ·dl = 2πnħ = qΦ ⇒ Φ = 2πnħ/q = nh/(2e) con q = 2e', (2 * pi * nq_ * hbj) / (2 * e4) - nq_ * (2 * pi * hbj) / (2 * e4), 0)
ident(D, 'Φ₀ = h/(2e) con h = 2πħ', (2 * pi * hbj) / (2 * e4), pi * hbj / e4)
# ecuaciones de Josephson: separación en parte real e imaginaria
a_, b_, n1r, n2r, phr = symbols('a b n1 n2 phi', real=True)
n1p, n2p = symbols('n1p n2p', positive=True)
K_, U1, U2 = symbols('K U1 U2', real=True)
# ψ̇₁ e^{−iθ₁} = a + i b con a = ṅ₁/(2√n₁), b = √n₁ θ̇₁ ; ψ₂ e^{−iθ₁} = √n₂ e^{iφ}
ec = sI * hbj * (a_ + sI * b_) - U1 * sqrt(n1p) - K_ * sqrt(n2p) * (cos(phr) + sI * sin(phr))
ecx = sp.expand(ec)
parte_im = sp.im(ecx); parte_re = sp.re(ecx)
sol_a = sp.solve(parte_im, a_)[0]; sol_b = sp.solve(parte_re, b_)[0]
ident(D, 'iħψ̇₁ = U₁ψ₁ + Kψ₂ ⇒ parte imaginaria: ṅ₁/(2√n₁) = (K/ħ)√n₂ sen φ ⇒ ṅ₁ = (2K/ħ)√(n₁n₂) sen φ', sp.simplify(2 * sqrt(n1p) * sol_a - 2 * K_ / hbj * sqrt(n1p * n2p) * sin(phr)), 0)
ident(D, 'parte real: √n₁ θ̇₁ = −(U₁√n₁ + K√n₂ cos φ)/ħ ⇒ θ̇₁ = −(U₁ + K√(n₂/n₁)cos φ)/ħ', sp.simplify(sol_b / sqrt(n1p) + (U1 + K_ * sqrt(n2p / n1p) * cos(phr)) / hbj), 0)
ident(D, 'sin acoplamiento (K → 0): φ̇ = θ̇₂ − θ̇₁ = −U₂/ħ + U₁/ħ = (U₁ − U₂)/ħ', (-U2 / hbj) - (-U1 / hbj) - (U1 - U2) / hbj, 0)
# integración numérica del sistema de dos niveles
Delta_h = 1.0; Kx = 0.01
Hm = np.array([[Delta_h, Kx], [Kx, 0.0]], dtype=complex)
w_, V_e = np.linalg.eigh(Hm)
psi0 = np.array([0.8, 0.6 * np.exp(0.3j)])
ts = np.linspace(0, 40, 400)
phis = []
for t_ in ts:
    psit = V_e @ (np.exp(-1j * w_ * t_) * (V_e.conj().T @ psi0)); phis.append(np.angle(psit[1]) - np.angle(psit[0]))
phis = np.unwrap(np.array(phis)); rate = np.polyfit(ts, phis, 1)[0]
rec(G_STEP, D, 'sistema de dos niveles (K/ΔU = 0.01): φ̇ = (U₁ − U₂)/ħ', rate, Delta_h, 'rel 1e-3', abs(rate / Delta_h - 1) < 1e-3)
# ṅ₁ numérico
dt = 1e-6; tt0 = 7.3
def st(t): return V_e @ (np.exp(-1j * w_ * t) * (V_e.conj().T @ psi0))
n1d = (abs(st(tt0 + dt)[0]) ** 2 - abs(st(tt0 - dt)[0]) ** 2) / (2 * dt)
s0 = st(tt0); n1v, n2v = abs(s0[0]) ** 2, abs(s0[1]) ** 2; phv = np.angle(s0[1]) - np.angle(s0[0])
rec(G_STEP, D, 'ṅ₁ numérico = (2K/ħ)√(n₁n₂) sen φ en un instante cualquiera', float(n1d), float(2 * Kx * math.sqrt(n1v * n2v) * math.sin(phv)), 'rel 1e-6', abs(n1d / (2 * Kx * math.sqrt(n1v * n2v) * math.sin(phv)) - 1) < 1e-6)
uJ = {'Phi': 'Wb', 'h': 'J s', 'e': 'C', 'f': 'Hz', 'V': 'V', 'hbar': 'J s', 'j_s': 'A m^-2', 'n_s': 'm^-3', 'q': 'C', 'm_s': 'kg', 'thg': 'm^-1', 'A': 'T m'}
Phs, fs_, Vj, hj, ej = [Symbol(s_, positive=True) for s_ in ('Phi', 'f', 'V', 'h', 'e')]
dimcheck(D, 'Φ₀ = h/(2e)', Phs, hj / (2 * ej), uJ)
dimcheck(D, 'f = 2eV/h', fs_, 2 * ej * Vj / hj, uJ)
dimcheck(D, 'j_s = (n_s q/m*)(ħ∇θ − qA)', js_, ns2 * qs / ms * (hbj * th_g - qs * Aq), uJ)
Phi0 = h / (2 * qe)
num(D, 'Φ₀ (fWb)', Phi0 * 1e15, '2.067834'); num(D, 'B para 1 Φ₀ en 1 µm² (mT)', Phi0 / 1e-12 * 1e3, '2.0678'); num(D, 'cuantos en 1 mm² con 50 µT (10⁴)', 50e-6 * 1e-6 / Phi0 * 1e-4, '2.4')
num(D, '2e/h (MHz/µV)', 2 * qe / h * 1e-6 * 1e-6, '483.598'); num(D, 'f a 100 µV (GHz)', 2 * qe * 100e-6 / h * 1e-9, '48.3598'); num(D, 'K_J (GHz/V)', 2 * qe / h * 1e-9, '483597.848')
num(D, 'valor inicial: Φ₀', Phi0 * 1e15, '2.06783'); num(D, 'valor inicial: B (µT)', Phi0 / 1e-12 * 1e6, '2067.83')
Vsj, nsj, Ssj = symbols('V n S', positive=True)
fsim('josephson', 'f', 2 * qeq * Vsj * sp.Float('1e-6', 40) / hq * sp.Float('1e-9', 40), deriv=D)
fsim('josephson', 'F0', hq / (2 * qeq) * sp.Float('1e15', 40), deriv=D)
fsim('josephson', 'Fn', nsj * hq / (2 * qeq) * sp.Float('1e15', 40), deriv=D)
fsim('josephson', 'B', nsj * hq / (2 * qeq) / (Ssj * sp.Float('1e-12', 40)) * sp.Float('1e6', 40), deriv=D)

# ================================================================ BCS
D = 'bcs-brecha'
ep, Dl, WD, lam_ = [Symbol(s_, positive=True) for s_ in ('eps', 'Delta', 'W_D', 'lam')]
integral(D, '∫₀^{ħω_D} dε/√(ε²+Δ²) = arcsinh(ħω_D/Δ)', 1 / sqrt(ep ** 2 + Dl ** 2), ep, 0, WD, asinh(WD / Dl))
solves(D, 'arcsinh(ħω_D/Δ) = 1/λ ⇒ Δ = ħω_D / senh(1/λ)', [Eq(asinh(WD / Dl), 1 / lam_)], Dl, WD / sinh(1 / lam_))
series_is(D, 'λ ≪ 1: Δ ≈ 2ħω_D e^{−1/λ}', WD / sinh(1 / lam_), lam_, 0, 1, 2 * WD * exp(-1 / lam_)) if False else rec(G_STEP, D, 'λ → 0: ħω_D/senh(1/λ) → 2ħω_D e^{−1/λ} (λ = 0.1; cociente)', float((1 / math.sinh(10.0)) / (2 * math.exp(-10.0))), 1.0, 'rel 1e-8', abs((1 / math.sinh(10.0)) / (2 * math.exp(-10.0)) - 1) < 1e-8)
mp.mp.dps = 25
GE = float(mp.euler)
for xv in (20.0, 100.0, 400.0):
    Ix = float(mp.quad(lambda y: mp.tanh(y) / y, [0, 1, xv]))
    asy = math.log(4 * math.exp(GE) * xv / math.pi)
    rec(G_STEP, D, f'∫₀^x tanh y/y dy = ln(4e^γ x/π) con x = {xv:g} (error absoluto)', Ix - asy, 0.0, 'abs 1e-6', abs(Ix - asy) < 1e-6)
ident(D, 'ln(2e^γ ħω_D/(π k T_c)) = 1/λ ⇒ kT_c = (2e^γ/π)ħω_D e^{−1/λ}', sp.simplify(log(2 * exp(EulerGamma) * WD / (pi * ((2 * exp(EulerGamma) / pi) * WD * exp(-1 / lam_)))) - 1 / lam_), 0)
ident(D, 'Δ(0)/kT_c = 2e^{−1/λ}/((2e^γ/π)e^{−1/λ}) = π/e^γ', sp.simplify(2 * exp(-1 / lam_) / ((2 * exp(EulerGamma) / pi) * exp(-1 / lam_)) - pi * exp(-EulerGamma)), 0)
# ecuación de la brecha completa: Tc y Δ(0) numéricos
lamv = 0.17; wD_ = 1.0
def gap_int(Dv, kT):
    f = lambda e: math.tanh(math.sqrt(e * e + Dv * Dv) / (2 * kT)) / math.sqrt(e * e + Dv * Dv)
    return quad(f, 0, wD_, limit=400, points=[min(Dv, 0.9 * wD_)] if Dv > 0 else None, epsabs=1e-13, epsrel=1e-12)[0]
Tc_num = brentq(lambda kT: gap_int(1e-9, kT) - 1 / lamv, 1e-4, 0.5, xtol=1e-14)
Tc_form = 2 * math.exp(GE) / math.pi * wD_ * math.exp(-1 / lamv)
rec(G_STEP, D, 'ecuación de la brecha numérica (tanh completa): T_c = (2e^γ/π)ħω_D e^{−1/λ}', Tc_num, Tc_form, 'rel 1e-3', abs(Tc_num / Tc_form - 1) < 1e-3)
D0_num = brentq(lambda Dv: gap_int(Dv, 1e-5) - 1 / lamv, 1e-6, 0.5, xtol=1e-14)
D0_form = wD_ / math.sinh(1 / lamv)
rec(G_STEP, D, 'ecuación de la brecha numérica a T ≈ 0: Δ(0) = ħω_D/senh(1/λ)', D0_num, D0_form, 'rel 1e-5', abs(D0_num / D0_form - 1) < 1e-5)
rec(G_STEP, D, 'cociente numérico Δ(0)/kT_c = 1.764', D0_num / Tc_num, math.pi / math.exp(GE), 'rel 2e-3', abs(D0_num / Tc_num / (math.pi / math.exp(GE)) - 1) < 2e-3)
uB = {'Delta': 'J', 'T_c': 'K', 'omega_D': 'rad s^-1', 'lam': '1', 'hbar': 'J s', 'k': 'J K^-1', 'eps': 'J', 'E': 'J', 'T': 'K'}
Dsym, Tcs, wDs = Symbol('Delta', positive=True), Symbol('T_c', positive=True), Symbol('omega_D', positive=True)
dimcheck(D, 'Δ(0) = ħω_D/senh(1/λ)', Dsym, hb_ * wDs / sinh(1 / lam_), uB)
dimcheck(D, 'kT_c = (2e^γ/π)ħω_D e^{−1/λ}', k_ * Tcs, 2 * exp(EulerGamma) / pi * hb_ * wDs * exp(-1 / lam_), uB)
dimcheck(D, 'E = √(ε² + Δ²)', Symbol('E', positive=True), sqrt(Symbol('eps', positive=True) ** 2 + Dsym ** 2), uB)
def bcsv(lam, th):
    hw = kB * th; Tc = 2 * math.exp(GE) / math.pi * th * math.exp(-1 / lam); D0 = hw / math.sinh(1 / lam); return Tc, D0 / qe * 1e3, D0 / (kB * Tc), hw / qe * 1e3
num(D, 'ħω_D (Al, meV)', bcsv(0.1666, 428)[3], '36.88'); num(D, 'T_c (Al)', bcsv(0.1666, 428)[0], '1.200'); num(D, 'Δ(0) (Al, meV)', bcsv(0.1666, 428)[1], '0.18241'); num(D, 'Δ/kT_c (Al)', bcsv(0.1666, 428)[2], '1.7639')
num(D, 'T_c (λ=0.1)', bcsv(0.1, 428)[0], '0.022'); num(D, 'T_c (λ=0.17)', bcsv(0.17, 428)[0], '1.353'); num(D, 'T_c (λ=0.3)', bcsv(0.3, 428)[0], '17.3'); num(D, 'factor 0.3/0.1', bcsv(0.3, 428)[0] / bcsv(0.1, 428)[0], '786'); num(D, 'π/e^γ', math.pi / math.exp(GE), '1.764'); num(D, '2e^γ/π', 2 * math.exp(GE) / math.pi, '1.134'); num(D, '2Δ/kT_c', 2 * math.pi / math.exp(GE), '3.528')
num(D, 'valor inicial: T_c', bcsv(0.17, 428)[0], '1.35311'); num(D, 'valor inicial: Δ(0)', bcsv(0.17, 428)[1], '0.205673'); num(D, 'valor inicial: Δ/kT_c', bcsv(0.17, 428)[2], '1.76389'); num(D, 'valor inicial: ħω_D', bcsv(0.17, 428)[3], '36.8822')
ls, ths = symbols('lam th', positive=True)
hwq = kBq * ths
fsim('bcs', 'Tc', 2 * sp.exp(sp.EulerGamma) / sp.pi * ths * sp.exp(-1 / ls), deriv=D)
fsim('bcs', 'D0', hwq / sp.sinh(1 / ls) / qeq * sp.Float('1e3', 40), deriv=D)
fsim('bcs', 'r', hwq / sp.sinh(1 / ls) / (kBq * 2 * sp.exp(sp.EulerGamma) / sp.pi * ths * sp.exp(-1 / ls)), deriv=D)
fsim('bcs', 'hw', hwq / qeq * sp.Float('1e3', 40), deriv=D)
