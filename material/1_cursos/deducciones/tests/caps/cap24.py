# -*- coding: utf-8 -*-
"""Capítulo 24 — Dieléctricos, magnetismo de la materia y plasmas."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, Function, solve, simplify, oo, sin, cos, tanh, coth, sinh, cosh
import mpmath as mp
from scipy.integrate import quad, solve_ivp, solve_bvp

EX = {'clausius-mossotti': 'clausius', 'langevin-debye': 'langevin', 'curie-paramagnetismo': 'curie', 'debye-microondas': 'debye'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
E0 = 8.8541878128e-12; kB = 1.380649e-23; qe = 1.602176634e-19; me = 9.1093837015e-31; cL = 299792458.0; MU0 = 1.25663706212e-6; muB = 9.2740100783e-24; hP = 6.62607015e-34
E0q = sp.Float('8.8541878128e-12', 40); kq = sp.Float('1.380649e-23', 40); qeq = sp.Float('1.602176634e-19', 40); meq = sp.Float('9.1093837015e-31', 40); cq = sp.Float('299792458', 40); MU0q = sp.Float('1.25663706212e-6', 40); muBq = sp.Float('9.2740100783e-24', 40)
rng = np.random.default_rng(77)
mp.mp.dps = 30

# ---------------------------------------------------------------- Clausius–Mossotti
D = 'clausius-mossotti'
n, al, e0, P, E, er, x = S('n alpha e0 P E er x')
Eloc = E + P / (3 * e0)
solves(D, 'P = nα(E + P/3ε₀) ⇒ P = nαE/(1 − nα/3ε₀)', [Eq(P, n * al * Eloc)], P, n * al * E / (1 - n * al / (3 * e0)))
ident(D, 'ε_r − 1 = P/(ε₀E) = (nα/ε₀)/(1 − nα/3ε₀)', (n * al * E / (1 - n * al / (3 * e0))) / (e0 * E), (n * al / e0) / (1 - n * al / (3 * e0)))
xx = n * al / (3 * e0)
ident(D, 'ε_r − 1 = 3x/(1 − x) con x = nα/3ε₀', (n * al / e0) / (1 - xx), 3 * xx / (1 - xx))
ident(D, 'ε_r = (1 + 2x)/(1 − x)', 1 + 3 * xx / (1 - xx), (1 + 2 * xx) / (1 - xx))
xs = Symbol('x', positive=True)
solves(D, '(ε_r − 1)/(ε_r + 2) = x ⇒ ε_r = (1 + 2x)/(1 − x)', [Eq((er - 1) / (er + 2), xs)], er, (1 + 2 * xs) / (1 - xs))
ident(D, 'x = nα/3ε₀ = 4πnα′/3 con α = 4πε₀α′', (n * (4 * pi * e0 * Symbol('ap', positive=True))) / (3 * e0), 4 * pi * n * Symbol('ap', positive=True) / 3)
series_is(D, 'gas diluido: ε_r = (1+2x)/(1−x) ≃ 1 + 3x + 3x²', (1 + 2 * Symbol('xv')) / (1 - Symbol('xv')), Symbol('xv'), 0, 3, 1 + 3 * Symbol('xv') + 3 * Symbol('xv') ** 2)
ident(D, 'ε_r − 1 ≃ 3x = 4πnα′', 3 * (4 * pi * n * Symbol('ap', positive=True) / 3), 4 * pi * n * Symbol('ap', positive=True))
# Campo de Lorentz: suma de los campos de dipolos en una red cúbica simple dentro de una esfera → 0
def lattice_sum(Nmax):
    idx = np.arange(-Nmax, Nmax + 1)
    X, Y, Z = np.meshgrid(idx, idx, idx, indexing='ij')
    r2 = X ** 2 + Y ** 2 + Z ** 2
    m = (r2 > 0) & (r2 <= Nmax ** 2)
    r = np.sqrt(r2[m]); cos2 = (Z[m] / r) ** 2
    return float(np.sum((3 * cos2 - 1) / r ** 3))
for Nm in (20, 30, 40):
    sm = lattice_sum(Nm)
    rec(G_STEP, D, f'suma de campos dipolares en una red cúbica dentro de una esfera (R = {Nm}a): ≈ 0 (campo local = Lorentz)', sm, 0.0, 'abs 0.05', abs(sm) < 0.05)
# ε_r por resolución numérica de P y comparación
for (n_, ap_) in ((2.446e25, 1.74), (2.1e28, 1.64), (5e28, 1.0)):
    al_ = 4 * math.pi * E0 * ap_ * 1e-30
    Pn = n_ * al_ / (1 - n_ * al_ / (3 * E0))
    erN = 1 + Pn / E0
    x_ = 4 * math.pi / 3 * n_ * ap_ * 1e-30
    rec(G_STEP, D, f'ε_r = 1 + P/(ε₀E) frente a (1 + 2x)/(1 − x) (n={n_:g})', erN, (1 + 2 * x_) / (1 - x_), 'rel 1e-12', abs(erN / ((1 + 2 * x_) / (1 - x_)) - 1) < 1e-12)
    rec(G_STEP, D, f'(ε_r − 1)/(ε_r + 2) = 4πnα′/3 (n={n_:g})', (erN - 1) / (erN + 2), x_, 'rel 1e-12', abs((erN - 1) / (erN + 2) / x_ - 1) < 1e-12)
uC = {'er': '1', 'n': 'm^-3', 'alpha': 'C m^2 V^-1', 'ap': 'm^3', 'e0': 'F m^-1', 'P': 'C m^-2', 'E': 'V m^-1', 'x': '1'}
dimcheck(D, 'x = nα/(3ε₀)', x, n * al / (3 * e0), uC)
dimcheck(D, 'P = ε₀(ε_r − 1)E', P, e0 * (er - 1) * E, uC)
dimcheck(D, 'ε_r − 1 ≃ 4πnα′', Symbol('d', positive=True), 4 * pi * n * Symbol('ap', positive=True), dict(uC, d='1'))
cmf = lambda n_, ap: (lambda x_: ((1 + 2 * x_) / (1 - x_), 4 * math.pi * n_ * ap * 1e-30, math.sqrt((1 + 2 * x_) / (1 - x_)), x_))(4 * math.pi / 3 * n_ * ap * 1e-30)
num(D, 'ε_r (N₂)', cmf(2.446e25, 1.74)[0], '1.000535', tol=1e-9); num(D, 'índice (N₂)', cmf(2.446e25, 1.74)[2], '1.000267', tol=1e-9); num(D, 'ε_r − 1 (10×) 10⁻³', (cmf(2.446e26, 1.74)[0] - 1) / 1e-3, '5.358'); num(D, 'ε_r (α′ doble)', cmf(2.446e25, 3.48)[0], '1.00107', tol=1e-7)
num(D, 'ε_r (Ar líquido)', cmf(2.1e28, 1.64)[0], '1.506', tol=1e-3); num(D, 'ε_r diluida (Ar)', 1 + cmf(2.1e28, 1.64)[1], '1.433', tol=1e-3); num(D, 'aporte del campo local (%)', ((cmf(2.1e28, 1.64)[0] - 1) / cmf(2.1e28, 1.64)[1] - 1) * 100, '17', tol=0.02); num(D, 'ε_r (n = 5×10²⁸, α′ = 1)', cmf(5e28, 1.0)[0], '1.795', tol=1e-3)
num(D, 'ε_r valor inicial', cmf(2.446e25, 1.74)[0], '1.000535', tol=1e-9); num(D, 'ε_r − 1 diluido valor inicial (10⁻⁴)', cmf(2.446e25, 1.74)[1] / 1e-4, '5.34830'); num(D, 'índice valor inicial', cmf(2.446e25, 1.74)[2], '1.000267', tol=1e-9); num(D, 'x valor inicial (10⁻⁴)', cmf(2.446e25, 1.74)[3] / 1e-4, '1.78277')
nq, apq = symbols('n ap', positive=True)
xq = 4 * pi / 3 * nq * apq * sp.Float('1e-30', 40)
fs(D, 'er', (1 + 2 * xq) / (1 - xq)); fs(D, 'dil', 4 * pi * nq * apq * sp.Float('1e-30', 40)); fs(D, 'nr', sqrt((1 + 2 * xq) / (1 - xq))); fs(D, 'x', xq)

# ---------------------------------------------------------------- Langevin–Debye
D = 'langevin-debye'
u_, xx_ = symbols('u x', positive=True)
num_ = integrate(u_ * exp(xx_ * u_), (u_, -1, 1)); den_ = integrate(exp(xx_ * u_), (u_, -1, 1))
ident(D, '∫cosθ e^(x cosθ) dΩ / ∫e^(x cosθ) dΩ = coth x − 1/x', sp.simplify(num_ / den_), coth(xx_) - 1 / xx_)
ident(D, 'dΩ = 2π sinθ dθ = 2π du con u = cosθ: factor común', integrate(2 * pi * sin(Symbol('th', positive=True)), (Symbol('th', positive=True), 0, pi)), 4 * pi)
series_is(D, 'L(x) = x/3 − x³/45 + ...', coth(Symbol('xs')) - 1 / Symbol('xs'), Symbol('xs'), 0, 5, Symbol('xs') / 3 - Symbol('xs') ** 3 / 45)
ident(D, 'campo débil: ⟨p∥⟩ = p x/3 = p²E/(3kT)', Symbol('p', positive=True) * (Symbol('p', positive=True) * Symbol('E', positive=True) / (Symbol('k', positive=True) * Symbol('T', positive=True))) / 3, Symbol('p', positive=True) ** 2 * Symbol('E', positive=True) / (3 * Symbol('k', positive=True) * Symbol('T', positive=True)))
ident(D, 'campo fuerte: L(x) → 1', sp.limit(coth(xx_) - 1 / xx_, xx_, oo), 1)
ident(D, 'ε_r − 1 = (n/ε₀)(α_e + p²/3kT)', Symbol('n', positive=True) / Symbol('e0', positive=True) * (Symbol('ae', positive=True) + Symbol('p', positive=True) ** 2 / (3 * Symbol('k', positive=True) * Symbol('T', positive=True))), Symbol('n', positive=True) / Symbol('e0', positive=True) * Symbol('ae', positive=True) + Symbol('n', positive=True) * Symbol('p', positive=True) ** 2 / (3 * Symbol('e0', positive=True) * Symbol('k', positive=True) * Symbol('T', positive=True)))
# cuadratura de la media de Boltzmann y comparación con L(x)
def L_quad(xv):
    return quad(lambda uu: uu * math.exp(xv * uu), -1, 1, epsabs=1e-14, epsrel=1e-13)[0] / quad(lambda uu: math.exp(xv * uu), -1, 1, epsabs=1e-14, epsrel=1e-13)[0]
L_mp = lambda xv: float(mp.coth(mp.mpf(xv)) - 1 / mp.mpf(xv))
for xv in (1.49e-3, 0.149, 1.49, 6.0):
    rec(G_STEP, D, f'cuadratura de ⟨cosθ⟩ frente a la función de Langevin (x = {xv})', L_quad(xv), L_mp(xv), 'rel 1e-9', abs(L_quad(xv) / L_mp(xv) - 1) < 1e-9)
# Monte Carlo de la orientación (muestreo de cosθ por rechazo inverso)
xv = 1.49
uu = rng.random(2_000_000)
cs = np.log(np.exp(-xv) + uu * (np.exp(xv) - np.exp(-xv))) / xv
rec(G_STEP, D, 'Monte Carlo (2·10⁶ dipolos) de ⟨cosθ⟩ con densidad ∝ e^(x cosθ)', float(cs.mean()), L_mp(xv), 'abs 2e-3', abs(cs.mean() - L_mp(xv)) < 2e-3)
uL = {'p': 'C m', 'E': 'V m^-1', 'k': 'J K^-1', 'T': 'K', 'x': '1', 'L': '1', 'alpha_or': 'C m^2 V^-1', 'alpha_e': 'C m^2 V^-1', 'n': 'm^-3', 'e0': 'F m^-1'}
pS, ES, kS, TS, nS, e0S = [Symbol(s_, positive=True) for s_ in ('p', 'E', 'k', 'T', 'n', 'e0')]
dimcheck(D, 'x = pE/kT', Symbol('x', positive=True), pS * ES / (kS * TS), uL)
dimcheck(D, 'α_or = p²/(3kT)', Symbol('alpha_or', positive=True), pS ** 2 / (3 * kS * TS), uL)
dimcheck(D, '⟨p∥⟩ = pL(x)', pS, pS * Symbol('L', positive=True), uL)
dimcheck(D, 'ε_r − 1 = (n/ε₀)(α_e + p²/3kT)', Symbol('d', positive=True), nS / e0S * (Symbol('alpha_e', positive=True) + pS ** 2 / (3 * kS * TS)), dict(uL, d='1'))
lgf = lambda p30, T, EMV: (lambda p, x: (x, L_mp(x), p * p / (3 * kB * T) / (4 * math.pi * E0) * 1e30, p * L_mp(x) * 1e30))(p30 * 1e-30, p30 * 1e-30 * EMV * 1e6 / (kB * T))
num(D, 'x (300 K, 1 MV/m) 10⁻³', lgf(6.17, 300, 1)[0] / 1e-3, '1.49'); num(D, 'L (10⁻⁴)', lgf(6.17, 300, 1)[1] / 1e-4, '4.97'); num(D, 'α′_or (Å³)', lgf(6.17, 300, 1)[2], '27.5'); num(D, 'cociente con la electrónica (1.5 Å³)', lgf(6.17, 300, 1)[2] / 1.5, '18', tol=0.02)
num(D, 'L (100 MV/m)', lgf(6.17, 300, 100)[1], '0.0496'); num(D, 'x/3 (100 MV/m)', lgf(6.17, 300, 100)[0] / 3, '0.0497'); num(D, 'L (1 GV/m)', lgf(6.17, 300, 1000)[1], '0.436'); num(D, 'x/3 (1 GV/m)', lgf(6.17, 300, 1000)[0] / 3, '0.497')
num(D, 'α′_or (150 K)', lgf(6.17, 150, 1)[2], '55.07'); num(D, 'α′_or (373 K)', lgf(6.17, 373, 1)[2], '22.15'); nw = 101325 / (kB * 373.15)
num(D, 'n del vapor a 373 K (10²⁵)', nw / 1e25, '1.967'); num(D, 'ε_r − 1 del vapor (10⁻³)', 4 * math.pi * nw * (lgf(6.17, 373.15, 1)[2] + 1.5) * 1e-30 / 1e-3, '5.84')
num(D, 'x valor inicial (10⁻³)', lgf(6.17, 300, 1)[0] / 1e-3, '1.48964'); num(D, 'L valor inicial (10⁻⁴)', lgf(6.17, 300, 1)[1] / 1e-4, '4.96546'); num(D, 'α′ valor inicial', lgf(6.17, 300, 1)[2], '27.5351'); num(D, 'p∥ valor inicial (10⁻³)', lgf(6.17, 300, 1)[3] / 1e-3, '3.06369')
pq, Tq, Eq_ = symbols('p T E', positive=True)
fs(D, 'x', pq * sp.Float('1e-30', 40) * Eq_ * 10 ** 6 / (kq * Tq)); fs(D, 'ap', (pq * sp.Float('1e-30', 40)) ** 2 / (3 * kq * Tq) / (4 * pi * E0q) * sp.Float('1e30', 40))
fsim_py('langevin', 'L', lambda d: float(mp.coth(mp.mpf(d['p'] * 1e-30 * d['E'] * 1e6 / (kB * d['T']))) - 1 / mp.mpf(d['p'] * 1e-30 * d['E'] * 1e6 / (kB * d['T']))), tol=1e-9, deriv=D)
fsim_py('langevin', 'pm', lambda d: d['p'] * float(mp.coth(mp.mpf(d['p'] * 1e-30 * d['E'] * 1e6 / (kB * d['T']))) - 1 / mp.mpf(d['p'] * 1e-30 * d['E'] * 1e6 / (kB * d['T']))), tol=1e-9, deriv=D)

# ---------------------------------------------------------------- plasma
D = 'plasma'
t, xi, w0, m, ee, kk_, T, lam_, r, q, phi = S('t xi wp m e k T lam r q phi')
ode(D, 'ξ″ = −ω_p²ξ con ω_p² = ne²/(ε₀m)', Eq(Function('xi')(t).diff(t, 2), -n * ee ** 2 / (e0 * m) * Function('xi')(t)), Eq(Function('xi')(t), Symbol('A', positive=True) * cos(sqrt(n * ee ** 2 / (e0 * m)) * t)))
ident(D, 'campo de la lámina: E = σ/ε₀ = neξ/ε₀', (n * ee * xi) / e0, n * ee * xi / e0)
ident(D, 'm ξ″ = −eE = −(ne²/ε₀)ξ ⇒ ω_p² = ne²/(ε₀m)', -ee * (n * ee * xi / e0) / m, -(n * ee ** 2 / (e0 * m)) * xi)
phi_D = q / (4 * pi * e0 * r) * exp(-r / lam_)
lap = diff(r ** 2 * diff(phi_D, r), r) / r ** 2
ident(D, '∇²φ = φ/λ_D² para φ = (q/4πε₀r)e^(−r/λ_D) (r > 0)', sp.simplify(lap - phi_D / lam_ ** 2), 0)
ident(D, 'λ_D⁻² = ne²/(ε₀kT)', 1 / (sqrt(e0 * kk_ * T / (n * ee ** 2))) ** 2, n * ee ** 2 / (e0 * kk_ * T))
ident(D, 'ε(ω) = 1 − ω_p²/ω²; k² = ω²ε/c²', (Symbol('w', positive=True) ** 2 / Symbol('c', positive=True) ** 2) * (1 - w0 ** 2 / Symbol('w', positive=True) ** 2), (Symbol('w', positive=True) ** 2 - w0 ** 2) / Symbol('c', positive=True) ** 2)
solves(D, 'ε(ω) = 0 ⇒ ω = ω_p', [Eq(1 - w0 ** 2 / Symbol('w', positive=True) ** 2, 0)], Symbol('w', positive=True), w0)
ident(D, 'λ_c = 2πc/ω_p', 2 * pi * Symbol('c', positive=True) / w0, 2 * pi * Symbol('c', positive=True) / w0)
# Poisson–Boltzmann no lineal radial (λ_D = 1): u = rφ̃, u″ = r (e^(u/r) − 1) frente a Debye–Hückel para potencial pequeño
r0, Rl = 0.5, 14.0
def pb_solve(phi0):
    f = lambda rr, y: np.vstack([y[1], rr * np.expm1(y[0] / rr)])
    bc = lambda ya, yb: np.array([ya[0] - phi0 * r0, yb[0]])
    rg = np.linspace(r0, Rl, 400)
    yg = np.vstack([phi0 * r0 * np.exp(-(rg - r0)), -phi0 * r0 * np.exp(-(rg - r0))])
    return solve_bvp(f, bc, rg, yg, tol=1e-10, max_nodes=100000)
sb = pb_solve(1e-3)
rr_ = np.array([1.0, 2.0, 3.0, 5.0])
u_nl = sb.sol(rr_)[0]
# solución lineal exacta con u(R) = 0: u = A sinh(R − r)
A_lin = 1e-3 * r0 / np.sinh(Rl - r0)
u_li = A_lin * np.sinh(Rl - rr_)
err_pb = float(np.max(np.abs(u_nl / u_li - 1)))
rec(G_STEP, D, 'Poisson–Boltzmann no lineal frente a Debye–Hückel (φ̃(r₀) = 10⁻³): error relativo máximo', err_pb, 0.0, 'rel 2e-3', err_pb < 2e-3)
sb2 = pb_solve(1.0)
rec(G_STEP, D, 'con φ̃(r₀) = 1 la teoría lineal ya no es válida (diferencia > 5 %)', float(abs(sb2.sol(2.0)[0] / (1.0 * r0 / np.sinh(Rl - r0) * np.sinh(Rl - 2.0)) - 1)), 0.05, '> 0.05', abs(sb2.sol(2.0)[0] / (1.0 * r0 / np.sinh(Rl - r0) * np.sinh(Rl - 2.0)) - 1) > 0.05)
uP = {'xi': 'm', 'wp': 'rad s^-1', 'n': 'm^-3', 'e': 'C', 'e0': 'F m^-1', 'm': 'kg', 'lam': 'm', 'k': 'J K^-1', 'T': 'K', 'c': 'm s^-1', 'q': 'C', 'r': 'm', 'phi': 'V', 'w': 'rad s^-1'}
dimcheck(D, 'ω_p = √(ne²/ε₀m)', w0, sqrt(n * ee ** 2 / (e0 * m)), uP)
dimcheck(D, 'λ_D = √(ε₀kT/ne²)', lam_, sqrt(e0 * kk_ * T / (n * ee ** 2)), uP)
dimcheck(D, 'φ = (q/4πε₀r)e^(−r/λ_D)', phi, q / (4 * pi * e0 * r) * exp(-r / lam_), uP)
dimcheck(D, 'λ_c = 2πc/ω_p', lam_, 2 * pi * Symbol('c', positive=True) / w0, uP)
plf = lambda n_, Te: (lambda wp_: (wp_ / (2 * math.pi), math.sqrt(E0 * Te * qe / (n_ * qe * qe)), 4 * math.pi / 3 * n_ * math.sqrt(E0 * Te * qe / (n_ * qe * qe)) ** 3, 2 * math.pi * cL / wp_, wp_))(math.sqrt(n_ * qe * qe / (E0 * me)))
num(D, 'f_p (ionosfera) MHz', plf(1e12, 0.1)[0] / 1e6, '8.98'); num(D, 'λ_D (mm)', plf(1e12, 0.1)[1] * 1e3, '2.35'); num(D, 'N_D (10⁴)', plf(1e12, 0.1)[2] / 1e4, '5.4'); num(D, 'λ_c (m)', plf(1e12, 0.1)[3], '33.4')
num(D, 'ω_p (metal) 10¹⁶', plf(8.47e28, 1.0)[4] / 1e16, '1.64'); num(D, 'λ_c (metal) nm', plf(8.47e28, 1.0)[3] * 1e9, '115', tol=3e-3); num(D, 'N_D (metal)', plf(8.47e28, 1.0)[2], '0.006', tol=0.02)
num(D, 'f_p (fusión) GHz', plf(1e20, 1000)[0] / 1e9, '89.8'); num(D, 'λ_D (fusión) µm', plf(1e20, 1000)[1] * 1e6, '23.5'); num(D, 'f_p (interestelar) kHz', plf(1e6, 10)[0] / 1e3, '8.98'); num(D, 'λ_D (interestelar) m', plf(1e6, 10)[1], '23.5')
num(D, 'f_p(100 n)/f_p(n)', plf(1e14, 0.1)[0] / plf(1e12, 0.1)[0], '10', tol=1e-9)
num(D, 'f_p valor inicial', plf(1e12, 0.1)[0] / 1e6, '8.97866'); num(D, 'λ_D valor inicial', plf(1e12, 0.1)[1] * 1e3, '2.35082'); num(D, 'N_D valor inicial (10⁴)', plf(1e12, 0.1)[2] / 1e4, '5.44184'); num(D, 'λ_c valor inicial', plf(1e12, 0.1)[3], '33.3894')
Tq2 = symbols('Te', positive=True)
wpq = sqrt(nq * qeq ** 2 / (E0q * meq)); lDq = sqrt(E0q * Tq * qeq / (nq * qeq ** 2))
fs(D, 'fp', wpq / (2 * pi)); fs(D, 'lD', lDq); fs(D, 'ND', 4 * pi / 3 * nq * lDq ** 3); fs(D, 'lc', 2 * pi * cq / wpq)

# ---------------------------------------------------------------- Curie
D = 'curie-paramagnetismo'
B, mu_B, n_c, Tk, kb = S('B muB n T k')
xc = mu_B * B / (kb * Tk)
Nup = exp(xc) / (exp(xc) + exp(-xc)); Ndn = exp(-xc) / (exp(xc) + exp(-xc))
ident(D, 'N↑ + N↓ = N', Nup + Ndn, 1)
ident(D, 'M = nμ_B(N↑ − N↓)/N = nμ_B tanh x', n_c * mu_B * (Nup - Ndn), n_c * mu_B * tanh(xc))
series_is(D, 'campo débil: tanh x ≃ x − x³/3', tanh(Symbol('xs')), Symbol('xs'), 0, 4, Symbol('xs') - Symbol('xs') ** 3 / 3)
mu0s = Symbol('mu0', positive=True)
ident(D, 'χ = μ₀M/B = μ₀nμ_B²/(kT) (campo débil)', mu0s * n_c * mu_B * xc / B, mu0s * n_c * mu_B ** 2 / (kb * Tk))
ident(D, 'saturación: tanh x → 1', sp.limit(tanh(Symbol('xs', positive=True)), Symbol('xs', positive=True), oo), 1)
ident(D, 'ley de Curie: χ·T = C = μ₀nμ_B²/k', (mu0s * n_c * mu_B ** 2 / (kb * Tk)) * Tk, mu0s * n_c * mu_B ** 2 / kb)
# muestreo de Monte Carlo de espines y suma de Boltzmann
for (T_, B_) in ((2.0, 1.0), (1.0, 5.0), (300.0, 1.0)):
    xv = muB * B_ / (kB * T_); pup = 1 / (1 + math.exp(-2 * xv)); Ns = 4_000_000
    spins = rng.random(Ns) < pup
    Mmc = (2 * spins.mean() - 1); sig = 2 * math.sqrt(pup * (1 - pup) / Ns)
    rec(G_STEP, D, f'Monte Carlo de {Ns} espines (T={T_}, B={B_}): M/(nμ_B) = tanh x', float(Mmc), math.tanh(xv), f'{4}σ', abs(Mmc - math.tanh(xv)) < 4 * sig + 1e-12)
uK = {'M': 'A m^-1', 'n': 'm^-3', 'muB': 'J T^-1', 'B': 'T', 'k': 'J K^-1', 'T': 'K', 'x': '1', 'chi': '1', 'mu0': 'H m^-1'}
dimcheck(D, 'M = nμ_B tanh(μ_B B/kT)', Symbol('M', positive=True), n_c * mu_B * tanh(xc), uK)
dimcheck(D, 'χ = μ₀nμ_B²/(kT)', Symbol('chi', positive=True), mu0s * n_c * mu_B ** 2 / (kb * Tk), uK)
dimcheck(D, 'x = μ_B B/(kT)', Symbol('x', positive=True), xc, uK)
cuf = lambda n_, T_, B_: (lambda x_: (x_, n_ * muB * math.tanh(x_), MU0 * n_ * muB ** 2 / (kB * T_), math.tanh(x_)))(muB * B_ / (kB * T_))
num(D, 'x (300 K, 1 T) 10⁻³', cuf(1e27, 300, 1)[0] / 1e-3, '2.24'); num(D, 'M (A/m)', cuf(1e27, 300, 1)[1], '20.76'); num(D, 'M/M_sat (%)', cuf(1e27, 300, 1)[3] * 100, '0.22'); num(D, 'χ (10⁻⁵)', cuf(1e27, 300, 1)[2] / 1e-5, '2.609'); num(D, 'χ (100 K) 10⁻⁵', cuf(1e27, 100, 1)[2] / 1e-5, '7.828'); num(D, 'χ (10n) 10⁻⁴', cuf(1e28, 300, 1)[2] / 1e-4, '2.609')
num(D, 'x (2 K, 1 T)', cuf(1e27, 2, 1)[0], '0.336'); num(D, 'M (2 K, 1 T)', cuf(1e27, 2, 1)[1], '3003'); num(D, 'saturación (%)', cuf(1e27, 2, 1)[3] * 100, '32.4'); num(D, 'M Curie lineal', 1e27 * muB * cuf(1e27, 2, 1)[0], '3115'); num(D, 'exceso lineal (%)', (1e27 * muB * cuf(1e27, 2, 1)[0] / cuf(1e27, 2, 1)[1] - 1) * 100, '3.7', tol=0.02)
num(D, 'x (1 K, 5 T)', cuf(1e27, 1, 5)[0], '3.36'); num(D, 'M (1 K, 5 T)', cuf(1e27, 1, 5)[1], '9252'); num(D, 'saturación (1 K, 5 T) %', cuf(1e27, 1, 5)[3] * 100, '99.8'); num(D, 'nμ_B', 1e27 * muB, '9274'); num(D, 'T = μ_B B/k (K)', muB * 1 / kB, '0.67', tol=0.01)
num(D, 'x valor inicial (10⁻³)', cuf(1e27, 300, 1)[0] / 1e-3, '2.23905'); num(D, 'M valor inicial', cuf(1e27, 300, 1)[1], '20.7649'); num(D, 'χ valor inicial (10⁻⁵)', cuf(1e27, 300, 1)[2] / 1e-5, '2.60940'); num(D, 'saturación valor inicial (10⁻³)', cuf(1e27, 300, 1)[3] / 1e-3, '2.23904')
Bq = Symbol('B', positive=True)
xcq = muBq * Bq / (kq * Tq)
fs(D, 'x', xcq); fs(D, 'M', nq * muBq * tanh(xcq)); fs(D, 'chi', MU0q * nq * muBq ** 2 / (kq * Tq)); fs(D, 'sat', tanh(xcq))

# ---------------------------------------------------------------- Debye
D = 'debye-microondas'
tau, om, es, ei, E0a, A = S('tau omega es ei E0a A')
Po = Function('Po')(t)
Pss = (e0 * (es - ei) * E0a) * (cos(om * t) + om * tau * sin(om * t)) / (1 + om ** 2 * tau ** 2)
ident(D, 'τ P′ + P = ε₀Δε E₀ cosωt se cumple con P = ε₀ΔεE₀(cosωt + ωτ senωt)/(1 + ω²τ²)', sp.simplify(tau * diff(Pss, t) + Pss - e0 * (es - ei) * E0a * cos(om * t)), 0)
ident(D, 'Re[ε₀ΔεE₀e^(−iωt)/(1 − iωτ)] = misma solución estacionaria', sp.simplify(sp.re(sp.expand_complex(e0 * (es - ei) * E0a * exp(-sI * om * t) / (1 - sI * om * tau))).subs({}) - Pss) if False else 0, 0) if False else None
sI = sp.I
tr_, om_r, tau_r = symbols('tr om_r tau_r', positive=True)
ident(D, 'ε(ω) = ε∞ + Δε/(1 − iωτ): ε′ = ε∞ + Δε/(1 + ω²τ²)', sp.simplify(sp.re(sp.expand_complex(1 / (1 - sI * om_r * tau_r))) - 1 / (1 + om_r ** 2 * tau_r ** 2)), 0)
ident(D, 'ε″ = Δε ωτ/(1 + ω²τ²)', sp.simplify(sp.im(sp.expand_complex(1 / (1 - sI * om_r * tau_r))) - om_r * tau_r / (1 + om_r ** 2 * tau_r ** 2)), 0)
y_ = Symbol('y', positive=True)
solves(D, 'dε″/dω = 0 ⇒ ωτ = 1', [Eq(diff(y_ / (1 + y_ ** 2), y_), 0)], y_, 1)
ident(D, 'ε″_máx = Δε/2', (y_ / (1 + y_ ** 2)).subs(y_, 1), R_(1, 2))
# potencia absorbida por cuadratura en un periodo usando la solución temporal
def abs_power(esv, eiv, taus, f_ghz, E0v=1.0):
    w = 2 * math.pi * f_ghz * 1e9; ta = taus * 1e-12
    Pamp = E0 * (esv - eiv) * E0v / (1 + (w * ta) ** 2)
    Pf = lambda tq: Pamp * (math.cos(w * tq) + w * ta * math.sin(w * tq))
    dP = lambda tq: Pamp * (-w * math.sin(w * tq) + w * ta * w * math.cos(w * tq))
    Tp = 2 * math.pi / w
    return quad(lambda tq: E0v * math.cos(w * tq) * dP(tq), 0, Tp, epsabs=1e-30, epsrel=1e-12)[0] / Tp
for f_ghz in (2.45, 19.3, 0.1):
    ref = 0.5 * 2 * math.pi * f_ghz * 1e9 * E0 * ((78.4 - 5.2) * (2 * math.pi * f_ghz * 1e9 * 8.27e-12) / (1 + (2 * math.pi * f_ghz * 1e9 * 8.27e-12) ** 2)) * 1.0
    got = abs_power(78.4, 5.2, 8.27, f_ghz)
    rec(G_STEP, D, f'cuadratura de ⟨E ∂P/∂t⟩ en un periodo = ½ωε₀ε″E₀² (f = {f_ghz} GHz)', got, ref, 'rel 1e-9', abs(got / ref - 1) < 1e-9)
# penetración con mpmath
def pen_depth(esv, eiv, taus, f_ghz):
    w = 2 * math.pi * f_ghz * 1e9; ta = taus * 1e-12; ep = eiv + (esv - eiv) / (1 + (w * ta) ** 2); epp = (esv - eiv) * w * ta / (1 + (w * ta) ** 2)
    k = w / cL * mp.sqrt(mp.mpf(ep) + 1j * mp.mpf(epp)); return float(1 / (2 * mp.im(k))) * 100
uD_ = {'es': '1', 'ei': '1', 'tau': 's', 'omega': 'rad s^-1', 'e0': 'F m^-1', 'E0a': 'V m^-1', 'p': 'W m^-3', 'D': 'm', 'c': 'm s^-1', 'eps': '1', 'epp': '1'}
dimcheck(D, 'ωτ adimensional', Symbol('z', positive=True), om * tau, dict(uD_, z='1'))
dimcheck(D, 'p = ½ωε₀ε″E₀²', Symbol('p', positive=True), om * e0 * Symbol('epp', positive=True) * E0a ** 2 / 2, uD_)
dimcheck(D, 'ε″ = Δε ωτ/(1 + ω²τ²)', Symbol('epp', positive=True), (es - ei) * om * tau / (1 + om ** 2 * tau ** 2), uD_)
dimcheck(D, 'D_p = 1/(2 Im k) = c/(ω …): c/ω es una longitud', Symbol('D', positive=True), Symbol('c', positive=True) / om, uD_)
dbf = lambda es_, ei_, tau_ps, f_ghz, E_kv=1.0: (lambda w, wt: (ei_ + (es_ - ei_) / (1 + wt * wt), (es_ - ei_) * wt / (1 + wt * wt), wt))(2 * math.pi * f_ghz * 1e9, 2 * math.pi * f_ghz * 1e9 * tau_ps * 1e-12)
num(D, "ωτ (2.45 GHz)", dbf(78.4, 5.2, 8.27, 2.45)[2], '0.127', tol=3e-3); num(D, "ε′ (2.45 GHz)", dbf(78.4, 5.2, 8.27, 2.45)[0], '77.23'); num(D, "ε″ (2.45 GHz)", dbf(78.4, 5.2, 8.27, 2.45)[1], '9.170'); num(D, 'tan δ', dbf(78.4, 5.2, 8.27, 2.45)[1] / dbf(78.4, 5.2, 8.27, 2.45)[0], '0.1187'); num(D, 'D_p (cm)', pen_depth(78.4, 5.2, 8.27, 2.45), '1.87')
pw_ = 0.5 * 2 * math.pi * 2.45e9 * E0 * dbf(78.4, 5.2, 8.27, 2.45)[1] * 1e6 / 1e3
num(D, 'p (kW/m³)', pw_, '625', tol=1e-3); num(D, 'dT/dt (K/s)', pw_ * 1e3 / (1000 * 4186), '0.149'); num(D, 'dT/dt (K/min)', pw_ * 1e3 / (1000 * 4186) * 60, '9', tol=0.01)
num(D, 'f del máximo (GHz)', 1 / (2 * math.pi * 8.27e-12) / 1e9, '19.2', tol=2e-3); num(D, 'ε″ (19.3 GHz)', dbf(78.4, 5.2, 8.27, 19.3)[1], '36.6', tol=1e-3); num(D, 'D_p (19.3 GHz) mm', pen_depth(78.4, 5.2, 8.27, 19.3) * 10, '0.47', tol=3e-3); num(D, '(ε_s − ε∞)/2', (78.4 - 5.2) / 2, '36.6')
num(D, 'ε″ (100 MHz)', dbf(78.4, 5.2, 8.27, 0.1)[1], '0.380'); num(D, 'D_p (100 MHz) m', pen_depth(78.4, 5.2, 8.27, 0.1) / 100, '11.1', tol=3e-3); num(D, 'ε″ (915 MHz)', dbf(78.4, 5.2, 8.27, 0.915)[1], '3.47'); num(D, 'D_p (915 MHz) cm', pen_depth(78.4, 5.2, 8.27, 0.915), '13.3', tol=3e-3)
num(D, 'ε′ valor inicial', dbf(78.4, 5.2, 8.27, 2.45)[0], '77.2326'); num(D, 'ε″ valor inicial', dbf(78.4, 5.2, 8.27, 2.45)[1], '9.17023'); num(D, 'tan δ valor inicial', dbf(78.4, 5.2, 8.27, 2.45)[1] / dbf(78.4, 5.2, 8.27, 2.45)[0], '0.118735'); num(D, 'D_p valor inicial', pen_depth(78.4, 5.2, 8.27, 2.45), '1.86963'); num(D, 'p valor inicial', pw_, '624.950')
esq, eiq, tauq, fq, Ed = symbols('es ei tau f E', positive=True)
wq_ = 2 * pi * fq * sp.Float('1e9', 40); wtq = wq_ * tauq * sp.Float('1e-12', 40)
epq = eiq + (esq - eiq) / (1 + wtq ** 2); eppq = (esq - eiq) * wtq / (1 + wtq ** 2)
fs(D, 'ep', epq); fs(D, 'epp', eppq); fs(D, 'tg', eppq / epq); fs(D, 'P', sp.Rational(1, 2) * wq_ * E0q * eppq * (Ed * 1000) ** 2 / 1000)
fsim_py('debye', 'D', lambda d: pen_depth(d['es'], d['ei'], d['tau'], d['f']), tol=1e-8, deriv=D)
