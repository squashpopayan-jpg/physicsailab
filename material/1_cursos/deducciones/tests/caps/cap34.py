# -*- coding: utf-8 -*-
"""Capítulo 34 — Sólidos: Bragg, fonones, Debye, Sommerfeld y Kronig–Penney."""
import math, cmath
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, I as sI, Function, series, gamma as sgamma, zeta, Matrix
from scipy.integrate import quad
from scipy.optimize import brentq
import scipy.linalg as sl
import mpmath as mp

h = 6.62607015e-34; hb = h / (2 * math.pi); c = 299792458.0; qe = 1.602176634e-19; me = 9.1093837015e-31; kB = 1.380649e-23; amu = 1.66053906660e-27; RG = 8.314462618
hq = sp.Float('6.62607015e-34', 40); hbq = hq / (2 * sp.pi); cq = sp.Float('299792458', 40); qeq = sp.Float('1.602176634e-19', 40); meq = sp.Float('9.1093837015e-31', 40); kBq = sp.Float('1.380649e-23', 40); amuq = sp.Float('1.66053906660e-27', 40); Rq = sp.Float('8.314462618', 40)
rng = np.random.default_rng(34)

# ================================================================ Bragg
D = 'bragg'
kk, GG, th, nn, lam, dd = [Symbol(s_, positive=True) for s_ in ('k', 'G', 'theta', 'n', 'lam', 'd')]
solves(D, '2k·G + G² = 0 con k·G = −kG sinθ ⇒ 2k sinθ = G', [Eq(2 * (-kk * GG * sin(th)) + GG ** 2, 0)], sin(th), GG / (2 * kk)) if False else ident(D, '2(−kG sinθ) + G² = 0 ⇔ 2k sinθ = G (G ≠ 0)', sp.simplify((2 * (-kk * GG * sin(th)) + GG ** 2) / GG - (GG - 2 * kk * sin(th))), 0)
ident(D, 'k = 2π/λ, G = 2πn/d ⇒ 2k sinθ = G ⇔ 2d sinθ = nλ', sp.simplify((2 * (2 * pi / lam) * sin(th) - 2 * pi * nn / dd) * lam * dd / (2 * pi)), 2 * dd * sin(th) - nn * lam)
hh, kh, ll_, a_ = symbols('h kh l a', positive=True)
ident(D, 'red cúbica: |G_hkl| = (2π/a)√(h²+k²+l²) ⇒ d = 2π/|G| = a/√(h²+k²+l²)', 2 * pi / ((2 * pi / a_) * sqrt(hh ** 2 + kh ** 2 + ll_ ** 2)), a_ / sqrt(hh ** 2 + kh ** 2 + ll_ ** 2))
# suma sobre la red: interferencia constructiva solo si Δk a = 2πm
Nsite = 50
def lat(dka): return abs(sum(cmath.exp(-1j * dka * j) for j in range(Nsite))) ** 2
rec(G_STEP, D, 'suma de 50 puntos: |Σ|² = N² en Δk·a = 0', lat(0.0), float(Nsite ** 2), 'rel 1e-12', abs(lat(0.0) / Nsite ** 2 - 1) < 1e-12)
rec(G_STEP, D, 'suma de 50 puntos: |Σ|² = N² en Δk·a = 2π', lat(2 * math.pi), float(Nsite ** 2), 'rel 1e-9', abs(lat(2 * math.pi) / Nsite ** 2 - 1) < 1e-9)
rec(G_STEP, D, 'suma de 50 puntos: |Σ|² ≈ 0 en Δk·a = π (fuera de Bragg)', lat(math.pi), 0.0, '< N²/1000', lat(math.pi) < Nsite ** 2 / 1000)
# cristal 3D simple cúbico 8×8×8: máximo en el ángulo de Bragg (111)
Nc = 8; idx = np.arange(Nc); Rg = np.stack(np.meshgrid(idx, idx, idx, indexing='ij'), -1).reshape(-1, 3).astype(float)
nh = np.array([1, 1, 1]) / math.sqrt(3); a_c = 1.0; d111 = a_c / math.sqrt(3); lam_c = 0.7
thB = math.asin(lam_c / (2 * d111)); kmod = 2 * math.pi / lam_c
def intensity(thd):
    perp = np.array([1.0, -1.0, 0.0]) / math.sqrt(2)
    kv = kmod * (math.sin(thd) * nh + math.cos(thd) * perp)
    kp = kv - 2 * np.dot(kv, nh) * nh
    A = np.sum(np.exp(-1j * (Rg @ (kp - kv))))
    return abs(A) ** 2
Ntot = Nc ** 3
rec(G_STEP, D, 'cristal 8×8×8: I(θ_Bragg) = N²', intensity(thB) / Ntot ** 2, 1.0, 'rel 1e-9', abs(intensity(thB) / Ntot ** 2 - 1) < 1e-9)
rec(G_STEP, D, 'cristal 8×8×8: a 6° del ángulo de Bragg la intensidad cae por debajo del 5 % del máximo', intensity(thB + math.radians(6)) / Ntot ** 2, 0.0, '< 0.05', intensity(thB + math.radians(6)) / Ntot ** 2 < 0.05)
# factor de estructura del diamante: reglas de extinción
def Fd(h_, k_, l_): return abs((1 + cmath.exp(1j * math.pi * (h_ + k_)) + cmath.exp(1j * math.pi * (h_ + l_)) + cmath.exp(1j * math.pi * (k_ + l_))) * (1 + cmath.exp(1j * math.pi * (h_ + k_ + l_) / 2)))
def rule(h_, k_, l_):
    par = [x % 2 for x in (h_, k_, l_)]
    if par[0] == par[1] == par[2] == 1: return True
    if par[0] == par[1] == par[2] == 0: return (h_ + k_ + l_) % 4 == 0
    return False
bad = [(h_, k_, l_) for h_ in range(0, 7) for k_ in range(0, 7) for l_ in range(0, 7) if (h_, k_, l_) != (0, 0, 0) and ((Fd(h_, k_, l_) > 1e-9) != rule(h_, k_, l_))]
rec(G_STEP, D, 'factor de estructura del diamante: |F| ≠ 0 ⇔ (todos impares) o (todos pares con h+k+l = 4n), 342 reflexiones', float(len(bad)), 0.0, 'sin excepciones', len(bad) == 0)
uB = {'d': 'm', 'lam': 'm', 'theta': 'rad', 'n': '1', 'G': 'm^-1', 'k': 'm^-1', 'a': 'm'}
dimcheck(D, 'sen θ = nλ/(2d)', sin(th), nn * lam / (2 * dd), uB)
dimcheck(D, 'G = 2π/d', GG, 2 * pi / dd, uB)
dimcheck(D, 'd = a/√(h²+k²+l²)', dd, a_ / sqrt(hh ** 2 + kh ** 2 + ll_ ** 2), dict(uB, h='1', kh='1', l='1'))
dimcheck(D, 'k = 2π/λ', kk, 2 * pi / lam, uB)
aS, lamC = 5.431, 1.5406
dd_ = lambda N: aS / math.sqrt(N)
tt2 = lambda N, n=1: 2 * math.degrees(math.asin(n * lamC / (2 * dd_(N))))
num(D, 'd(111)', dd_(3), '3.1356'); num(D, '2θ(111)', tt2(3), '28.442'); num(D, 'd(220)', dd_(8), '1.9201'); num(D, '2θ(220)', tt2(8), '47.302'); num(D, 'd(311)', dd_(11), '1.6375'); num(D, '2θ(311)', tt2(11), '56.122'); num(D, 'd(200)', dd_(4), '2.7155')
num(D, 'sen θ del 2.º orden de (111)', 2 * lamC / (2 * dd_(3)), '0.4913'); num(D, '2θ del 2.º orden', tt2(3, 2), '58.856'); num(D, 'd(222)', dd_(12), '1.5678'); num(D, '|F(220)|/f', Fd(2, 2, 0), '8', tol=1e-9); num(D, '|F(311)|/f', Fd(3, 1, 1), '5.657'); num(D, '|F(400)|/f', Fd(4, 0, 0), '8', tol=1e-9)
num(D, 'valor inicial: d', dd_(3), '3.13559'); num(D, 'valor inicial: |G|', 2 * math.pi / dd_(3), '2.00383'); num(D, 'valor inicial: sen θ', lamC / (2 * dd_(3)), '0.245664'); num(D, 'valor inicial: 2θ', tt2(3), '28.4421')
def bg_ref(d, outk):
    dd0 = d['a'] / math.sqrt(d['N']); s = d['n'] * d['lam'] / (2 * dd0)
    return {'d': dd0, 'G': 2 * math.pi / dd0, 's': s, 'tt': (2 * math.degrees(math.asin(s)) if s <= 1 else 0.0)}[outk]
for ok_ in ('d', 'G', 's', 'tt'):
    fsim_py('bragg', ok_, (lambda o: (lambda d: bg_ref(d, o)))(ok_), tol=1e-9, deriv=D)

# ================================================================ Cadena de fonones
D = 'cadena-fonones'
Kc, Mc, ac, kc, w_, t_, nj = [Symbol(s_, positive=True) for s_ in ('K', 'M', 'a', 'k', 'omega', 't', 'n')]
ident(D, 'e^{ika} + e^{−ika} − 2 = −4 sin²(ka/2)', sp.simplify((exp(sI * kc * ac) + exp(-sI * kc * ac) - 2).rewrite(cos) + 4 * sin(kc * ac / 2) ** 2), 0)
un = lambda n_: exp(sI * (kc * n_ * ac - w_ * t_))
ecm = -Mc * w_ ** 2 * un(nj) - Kc * (un(nj + 1) + un(nj - 1) - 2 * un(nj))
ident(D, 'M ü_n = K(u_{n+1} + u_{n−1} − 2u_n) con ω² = (4K/M) sin²(ka/2)', sp.simplify((ecm.subs(w_, 2 * sqrt(Kc / Mc) * sin(kc * ac / 2))).rewrite(cos)), 0)
kr = Symbol('kr', real=True)
ident(D, '|sen(ka/2)| es periódica con período 2π/a: ω(k + 2π/a) = ω(k)', sp.simplify(sp.Abs(sin((kr + 2 * pi / ac) * ac / 2)) - sp.Abs(sin(kr * ac / 2))), 0)
series_is(D, 'ondas largas: ω ≈ a√(K/M) k', 2 * sqrt(Kc / Mc) * sin(kc * ac / 2), kc, 0, 2, ac * sqrt(Kc / Mc) * kc)
deriv_is(D, 'v_g = dω/dk = a√(K/M) cos(ka/2)', 2 * sqrt(Kc / Mc) * sin(kc * ac / 2), kc, ac * sqrt(Kc / Mc) * cos(kc * ac / 2))
ident(D, 'v_g = 0 en el borde de zona (k = π/a)', sp.simplify((ac * sqrt(Kc / Mc) * cos(kc * ac / 2)).subs(kc, pi / ac)), 0)
# diagonalización de la matriz dinámica de un anillo de N átomos
Nat = 64; Kn, Mn = 30.0, 63.546 * amu
Dm = (2 * np.eye(Nat) - np.roll(np.eye(Nat), 1, 0) - np.roll(np.eye(Nat), -1, 0)) * Kn / Mn
wd = np.sort(np.sqrt(np.abs(sl.eigvalsh(Dm))))
wf = np.sort(2 * math.sqrt(Kn / Mn) * np.abs(np.sin(np.pi * np.arange(Nat) / Nat)))
rec(G_STEP, D, 'diagonalización de la matriz dinámica (64 átomos, anillo): ω_k = 2√(K/M)|sen(πk/N)|', float(np.max(np.abs(wd - wf) / wf.max())), 0.0, 'rel 1e-6', np.max(np.abs(wd - wf) / wf.max()) < 1e-6)
vs_c = lambda K_, M_, a_: a_ * math.sqrt(K_ / M_)
uC = {'omega': 'rad s^-1', 'k': 'm^-1', 'K': 'N m^-1', 'M': 'kg', 'a': 'm', 'v_s': 'm s^-1', 'v_g': 'm s^-1'}
vsS, vgS = Symbol('v_s', positive=True), Symbol('v_g', positive=True)
dimcheck(D, 'ω = 2√(K/M) sen(ka/2)', w_, 2 * sqrt(Kc / Mc) * sin(kc * ac / 2), uC)
dimcheck(D, 'v_s = a√(K/M)', vsS, ac * sqrt(Kc / Mc), uC)
dimcheck(D, 'v_g = v_s cos(ka/2)', vgS, ac * sqrt(Kc / Mc) * cos(kc * ac / 2), uC)
w0c = 2 * math.sqrt(30.0 / (63.546 * amu)); ac_ = 2.55e-10
num(D, 'v_s', ac_ * w0c / 2, '4299.6'); num(D, 'f_máx (THz)', w0c / (2 * math.pi) * 1e-12, '5.367'); num(D, 'ħω_máx (meV)', hb * w0c / qe * 1e3, '22.20'); num(D, 'ħω_máx/k (K)', hb * w0c / kB, '257.6'); num(D, 'f a ka/π = 0.5', w0c * math.sin(math.pi / 4) / (2 * math.pi) * 1e-12, '3.795'); num(D, 'v_g a ka/π = 0.5', ac_ * w0c / 2 * math.cos(math.pi / 4), '3040.3'); num(D, 'λ', 2 * 2.55 / 0.5, '10.2'); num(D, 'factor √2', math.sqrt(2), '1.4142')
num(D, 'valor inicial: f', w0c * math.sin(math.pi / 4) / (2 * math.pi) * 1e-12, '3.79513'); num(D, 'valor inicial: v_s', ac_ * w0c / 2, '4299.64'); num(D, 'valor inicial: v_g', ac_ * w0c / 2 * math.cos(math.pi / 4), '3040.30'); num(D, 'valor inicial: f_máx', w0c / (2 * math.pi) * 1e-12, '5.36713')
Ks, Ms, as_, xs = symbols('K M a x', positive=True)
w0q = 2 * sp.sqrt(Ks / (Ms * amuq))
fsim('cadena', 'f', w0q * sp.sin(sp.pi * xs / 2) / (2 * sp.pi) * sp.Float('1e-12', 40), deriv=D)
fsim('cadena', 'vs', as_ * sp.Float('1e-10', 40) * w0q / 2, deriv=D)
fsim('cadena', 'vg', as_ * sp.Float('1e-10', 40) * w0q / 2 * sp.cos(sp.pi * xs / 2), deriv=D, tol=1e-8)
fsim('cadena', 'fm', w0q / (2 * sp.pi) * sp.Float('1e-12', 40), deriv=D)
fsim('cadena', 'lam', 2 * as_ / xs, deriv=D)

# ================================================================ Debye
D = 'debye-calor'
V_, v_, N_, om, wD, T_, hbs, kBs, x_ = [Symbol(s_, positive=True) for s_ in ('V', 'v', 'N', 'omega', 'omega_D', 'T', 'hbar', 'k', 'x')]
gom = 3 * V_ * om ** 2 / (2 * pi ** 2 * v_ ** 3)
solves(D, '∫₀^{ω_D} g dω = 3N ⇒ ω_D = v(6π²N/V)^{1/3}', [Eq(integrate(gom, (om, 0, wD)), 3 * N_)], wD, v_ * (6 * pi ** 2 * N_ / V_) ** R_(1, 3))
ident(D, 'g(ω) = 9Nω²/ω_D³ tras sustituir ω_D', sp.simplify(gom.subs(V_, 6 * pi ** 2 * N_ * v_ ** 3 / wD ** 3)), 9 * N_ * om ** 2 / wD ** 3)
th_ = hbs * wD / kBs
Uint = hbs * om / (exp(hbs * om / (kBs * T_)) - 1) * 9 * N_ * om ** 2 / wD ** 3
xx = Symbol('xx', positive=True)
subs_int = sp.simplify(Uint.subs(om, kBs * T_ * xx / hbs) * kBs * T_ / hbs)
Ux = 9 * N_ * kBs * T_ * (T_ / th_) ** 3 * xx ** 3 / (exp(xx) - 1)
ident(D, 'U = ∫ħω n̄ g dω = 9NkT(T/θ)³∫x³/(eˣ−1)dx (cambio x = ħω/kT)', sp.simplify(subs_int - Ux), 0)
series_is(D, 'integrando de C_V cerca de 0: x⁴eˣ/(eˣ−1)² = x² − x⁴/12 + …', xx ** 4 * exp(xx) / (exp(xx) - 1) ** 2, xx, 0, 5, xx ** 2 - xx ** 4 / 12)
ident(D, '∫₀^∞ x⁴eˣ/(eˣ−1)² dx = 4Γ(4)ζ(4) = 4π⁴/15', 4 * sgamma(4) * zeta(4), 4 * pi ** 4 / 15)
mp.mp.dps = 30
vint = mp.quad(lambda x: x ** 4 * mp.e ** x / (mp.e ** x - 1) ** 2, [0, mp.inf])
rec(G_STEP, D, 'integral numérica (mpmath) ∫₀^∞ x⁴eˣ/(eˣ−1)² dx = 4π⁴/15', float(vint), 4 * math.pi ** 4 / 15, 'rel 1e-12', abs(float(vint) / (4 * math.pi ** 4 / 15) - 1) < 1e-12)
ident(D, 'T ≫ θ: C → 9Nk (T/θ)³ (θ/T)³/3 = 3Nk', sp.simplify(9 * N_ * kBs * (T_ / th_) ** 3 * (th_ / T_) ** 3 / 3), 3 * N_ * kBs)
ident(D, 'T ≪ θ: C → 9Nk(T/θ)³ 4π⁴/15 = (12π⁴/5)Nk(T/θ)³', 9 * 4 * pi ** 4 / 15, 12 * pi ** 4 / 5)
# derivada numérica de U(T) frente a la fórmula de C_V
def Dint(xm): return quad(lambda x: x ** 4 * math.exp(x) / math.expm1(x) ** 2 if x > 1e-8 else x * x, 0, xm, epsabs=1e-14, epsrel=1e-13)[0]
def Cdeb(T, th): return 9 * RG * (T / th) ** 3 * Dint(th / T)
def Udeb(T, th): return 9 * RG * T * (T / th) ** 3 * quad(lambda x: x ** 3 / math.expm1(x), 1e-12, th / T, epsabs=1e-14, epsrel=1e-13)[0]
for (T0, th0) in ((50.0, 343.0), (300.0, 343.0), (20.0, 105.0)):
    dT = 1e-3 * T0
    Cn = (Udeb(T0 + dT, th0) - Udeb(T0 - dT, th0)) / (2 * dT)
    rec(G_STEP, D, f'dU/dT numérica = C_V de Debye (T={T0}, θ={th0})', Cn, Cdeb(T0, th0), 'rel 1e-6', abs(Cn / Cdeb(T0, th0) - 1) < 1e-6)
rec(G_STEP, D, 'C_V(T → ∞) → 3R (T = 1e5 K, θ = 343 K)', Cdeb(1e5, 343) / (3 * RG), 1.0, 'rel 1e-6', abs(Cdeb(1e5, 343) / (3 * RG) - 1) < 1e-6)
rec(G_STEP, D, 'C_V(T → 0) → ley de T³ (T = 1 K, θ = 343 K)', Cdeb(1.0, 343) / (12 * math.pi ** 4 / 5 * RG * (1 / 343) ** 3), 1.0, 'rel 1e-9', abs(Cdeb(1.0, 343) / (12 * math.pi ** 4 / 5 * RG * (1 / 343) ** 3) - 1) < 1e-9)
uDb = {'omega_D': 'rad s^-1', 'v': 'm s^-1', 'N': '1', 'V': 'm^3', 'hbar': 'J s', 'k': 'J K^-1', 'T': 'K', 'theta': 'K', 'C': 'J K^-1', 'n': 'm^-3', 'R': 'J mol^-1 K^-1'}
thS, CS, nS, RS = [Symbol(s_, positive=True) for s_ in ('theta', 'C', 'n', 'R')]
dimcheck(D, 'ω_D = v(6π²n)^{1/3}', wD, v_ * (6 * pi ** 2 * nS) ** R_(1, 3), uDb)
dimcheck(D, 'θ_D = ħω_D/k', thS, hbs * wD / kBs, uDb)
dimcheck(D, 'C → 3Nk (alta T) y (12π⁴/5)Nk(T/θ)³ (baja T)', CS, 12 * pi ** 4 / 5 * N_ * kBs * (T_ / thS) ** 3, uDb)
dimcheck(D, 'C molar → 3R', Symbol('C', positive=True), 3 * RS, dict(uDb, C='J mol^-1 K^-1'))
num(D, '3R', 3 * RG, '24.943'); num(D, 'C_V(Cu, 300 K)', Cdeb(300, 343), '23.386'); num(D, 'C_V/3R (Cu, 300 K)', Cdeb(300, 343) / (3 * RG) * 100, '93.76'); num(D, 'C_V(T = θ)/3R', Cdeb(343, 343) / (3 * RG), '0.9517')
num(D, 'C_V(Cu, 10 K)', Cdeb(10, 343), '0.048168'); num(D, 'ley T³ (Cu, 10 K)', 12 * math.pi ** 4 / 5 * RG * (10 / 343) ** 3, '0.048168'); num(D, 'C_V(Al, 300 K)', Cdeb(300, 428), '22.579'); num(D, 'C_V/3R (Al, 300 K)', Cdeb(300, 428) / (3 * RG) * 100, '90.52'); num(D, 'C_V(Pb, 300 K)', Cdeb(300, 105), '24.791'); num(D, 'C_V/3R (Pb)', Cdeb(300, 105) / (3 * RG) * 100, '99.39')
num(D, 'ν_D (Cu, THz)', kB * 343 / h * 1e-12, '7.147'); num(D, 'Pb, 10 K: ley T³', 12 * math.pi ** 4 / 5 * RG * (10 / 105) ** 3, '1.679'); num(D, 'Pb, 10 K: Debye', Cdeb(10, 105), '1.646'); num(D, 'exceso de la ley T³ en Pb (%)', (12 * math.pi ** 4 / 5 * RG * (10 / 105) ** 3 / Cdeb(10, 105) - 1) * 100, '2.0')
beta = 12 * math.pi ** 4 / 5 * RG / 343 ** 3
num(D, 'cruce electrónico–red del Cu (K)', math.sqrt(0.695e-3 / beta), '3.80')
num(D, 'valor inicial: C', Cdeb(300, 343), '23.3862'); num(D, 'valor inicial: C/3R', Cdeb(300, 343) / (3 * RG), '0.937572'); num(D, 'valor inicial: ν_D', kB * 343 / h * 1e-12, '7.14696')
def deb_ref(d, o):
    C = Cdeb(d['T'], d['th'])
    return {'C': C, 'fr': C / (3 * RG)}[o]
fsim_py('debye-red', 'C', lambda d: deb_ref(d, 'C'), tol=1e-8, deriv=D)
fsim_py('debye-red', 'fr', lambda d: deb_ref(d, 'fr'), tol=1e-8, deriv=D)
ths, Ts = symbols('th T', positive=True)
fsim('debye-red', 'lo', 12 * sp.pi ** 4 / 5 * Rq * (Ts / ths) ** 3, deriv=D)
fsim('debye-red', 'nd', kBq * ths / hq * sp.Float('1e-12', 40), deriv=D)

# ================================================================ Sommerfeld
D = 'sommerfeld'
kF, nel, EF, Em, Vv, Nn, Eg = [Symbol(s_, positive=True) for s_ in ('k_F', 'n', 'E_F', 'm', 'V', 'N', 'E')]
Nk = Vv * kF ** 3 / (3 * pi ** 2)
solves(D, 'N = Vk_F³/3π² con n = N/V ⇒ k_F = (3π²n)^{1/3}', [Eq(Nk / Vv, nel)], kF, (3 * pi ** 2 * nel) ** R_(1, 3))
ident(D, 'N(k) = 2·(4πk³/3)/(2π/L)³ = Vk³/(3π²)', 2 * (4 * pi * kF ** 3 / 3) / (2 * pi / Symbol('L', positive=True)) ** 3 - Nk.subs(Vv, Symbol('L', positive=True) ** 3), 0)
gE = Vv / (2 * pi ** 2) * (2 * Em / hbs ** 2) ** R_(3, 2) * sqrt(Eg)
ident(D, 'g(E) = dN/dE con k = √(2mE)/ħ', sp.simplify(diff(Nk.subs(kF, sqrt(2 * Em * Eg) / hbs), Eg) - gE), 0)
EFs = hbs ** 2 / (2 * Em) * (3 * pi ** 2 * nel) ** R_(2, 3)
ident(D, 'g(E_F) = 3N/(2E_F)', sp.simplify(gE.subs(Eg, EFs).subs(Vv, Nn / nel) / (3 * Nn / (2 * EFs))), 1)
ident(D, 'C_el = (π²/3)k²T g(E_F) = (π²/2)Nk(T/T_F)', (pi ** 2 / 3) * kBs ** 2 * T_ * (3 * Nn / (2 * EFs)) - (pi ** 2 / 2) * Nn * kBs * T_ / (EFs / kBs), 0)
# expansión de Sommerfeld frente a la integral exacta de Fermi–Dirac
def fd_int(Hf, mu, kT): return quad(lambda E: Hf(E) / (math.exp(min((E - mu) / kT, 700)) + 1), 0, mu + 60 * kT, points=[mu], epsabs=1e-14, epsrel=1e-13, limit=300)[0]
mu0, kT0 = 1.0, 0.02
for (nm_, Hf, Hint, Hd) in (('E^{1/2}', lambda E: math.sqrt(E), lambda m: 2 / 3 * m ** 1.5, lambda m: 0.5 / math.sqrt(m)), ('E^{3/2}', lambda E: E ** 1.5, lambda m: 2 / 5 * m ** 2.5, lambda m: 1.5 * math.sqrt(m)), ('E', lambda E: E, lambda m: m * m / 2, lambda m: 1.0)):
    ex_ = fd_int(Hf, mu0, kT0); ap = Hint(mu0) + math.pi ** 2 / 6 * kT0 ** 2 * Hd(mu0)
    rec(G_STEP, D, f'expansión de Sommerfeld para H = {nm_} (kT/μ = 0.02): error relativo O((kT/μ)⁴)', abs(ex_ / ap - 1), 0.0, '< 1e-6', abs(ex_ / ap - 1) < 1e-6)
# calor específico exacto con N fijo (potencial químico dependiente de T)
def mu_of_T(t):  # EF = 1, g ∝ √E, N = ∫ g f = 2/3 (en unidades EF = 1)
    return brentq(lambda mu: fd_int(lambda E: math.sqrt(E), mu, t) - 2 / 3, 0.5, 1.5, xtol=1e-14)
def U_of_T(t): return fd_int(lambda E: E ** 1.5, mu_of_T(t), t)
t0 = 0.01
Cn = (U_of_T(t0 * 1.001) - U_of_T(t0 * 0.999)) / (0.002 * t0)   # en unidades de k (N k / (3/2))  U = ∫E g f con g = (3/2)√E (N = 1)
Cn *= 1.5
Cs = (math.pi ** 2 / 2) * t0
rec(G_STEP, D, 'C_el exacto (Fermi–Dirac con N fijo, T/T_F = 0.01) frente a (π²/2) T/T_F', Cn, Cs, 'rel 1e-3', abs(Cn / Cs - 1) < 1e-3)
muS = mu_of_T(0.05)
rec(G_STEP, D, 'μ(T) = E_F[1 − (π²/12)(kT/E_F)²] (T/T_F = 0.05)', muS, 1 - math.pi ** 2 / 12 * 0.05 ** 2, 'rel 1e-4', abs(muS / (1 - math.pi ** 2 / 12 * 0.05 ** 2) - 1) < 1e-4)
uS = {'E_F': 'J', 'k_F': 'm^-1', 'n': 'm^-3', 'm': 'kg', 'hbar': 'J s', 'v_F': 'm s^-1', 'g': 'J^-1', 'N': '1', 'C_el': 'J K^-1', 'T_F': 'K', 'T': 'K', 'k': 'J K^-1', 'V': 'm^3', 'E': 'J'}
vF_, gS, Cel, TF_ = [Symbol(s_, positive=True) for s_ in ('v_F', 'g', 'C_el', 'T_F')]
dimcheck(D, 'E_F = ħ²k_F²/2m', EF, hbs ** 2 * kF ** 2 / (2 * Em), uS)
dimcheck(D, 'k_F = (3π²n)^{1/3}', kF, (3 * pi ** 2 * nel) ** R_(1, 3), uS)
dimcheck(D, 'v_F = ħk_F/m', vF_, hbs * kF / Em, uS)
dimcheck(D, 'g(E_F) = 3N/(2E_F)', gS, 3 * Nn / (2 * EF), uS)
dimcheck(D, 'C_el = (π²/2)Nk(T/T_F)', Cel, pi ** 2 / 2 * Nn * kBs * T_ / TF_, uS)
def sm(nv): kf = (3 * math.pi ** 2 * nv) ** (1 / 3); EFv = hb ** 2 * kf ** 2 / (2 * me); return kf, EFv
kf, EFv = sm(8.47e28)
num(D, 'k_F (Cu)', kf * 1e-10, '1.3586'); num(D, 'E_F (Cu)', EFv / qe, '7.033'); num(D, 'T_F (Cu)', EFv / kB, '81612', tol=1e-5); num(D, 'v_F (Cu)', hb * kf / me * 1e-6, '1.573'); num(D, 'v_F/c (%)', hb * kf / me / c * 100, '0.52')
gam = lambda EFv_: math.pi ** 2 * RG / (2 * EFv_ / kB) * 1e3
num(D, 'γ (Cu)', gam(EFv), '0.5027'); num(D, 'm*/m (Cu)', 0.695 / gam(EFv), '1.38')
kf2, EF2 = sm(2.65e28)
num(D, 'E_F (Na)', EF2 / qe, '3.241'); num(D, 'T_F (Na)', EF2 / kB, '37612', tol=1e-5); num(D, 'v_F (Na)', hb * kf2 / me * 1e-6, '1.068'); num(D, 'γ (Na)', gam(EF2), '1.091')
kf3, EF3 = sm(18.1e28)
num(D, 'E_F (Al)', EF3 / qe, '11.668'); num(D, 'T_F (Al)', EF3 / kB, '135399', tol=1e-5); num(D, 'γ (Al, por mol de electrones)', gam(EF3), '0.3030'); num(D, 'γ (Al, por mol de átomos)', 3 * gam(EF3), '0.909')
num(D, 'T/T_F del Cu a 300 K (%)', 300 / (EFv / kB) * 100, '0.37'); num(D, 'C_el (Cu, 300 K)', gam(EFv) * 1e-3 * 300, '0.151'); num(D, 'C_el/3R (%)', gam(EFv) * 1e-3 * 300 / (3 * RG) * 100, '0.60')
num(D, 'valor inicial: E_F', EFv / qe, '7.03276'); num(D, 'valor inicial: T_F', EFv / kB, '81611.8'); num(D, 'valor inicial: v_F', hb * kf / me * 1e-6, '1.57285'); num(D, 'valor inicial: k_F', kf * 1e-10, '1.35863'); num(D, 'valor inicial: γ', gam(EFv), '0.502749')
ns = Symbol('n', positive=True)
kFq = sp.cbrt(3 * sp.pi ** 2 * ns * sp.Float('1e28', 40)); EFq = hbq ** 2 * kFq ** 2 / (2 * meq)
fsim('sommerfeld', 'EF', EFq / qeq, deriv=D)
fsim('sommerfeld', 'TF', EFq / kBq, deriv=D)
fsim('sommerfeld', 'vF', hbq * kFq / meq, deriv=D)
fsim('sommerfeld', 'kF', kFq * sp.Float('1e-10', 40), deriv=D)
fsim('sommerfeld', 'g', sp.pi ** 2 * Rq / (2 * EFq / kBq) * sp.Float('1e3', 40), deriv=D)

# ================================================================ Kronig–Penney
D = 'bandas-kronig-penney'
qa, Pp, ka_, al_, m3, hb3, qq = [Symbol(s_, positive=True) for s_ in ('qa', 'P', 'ka', 'alpha', 'm', 'hbar', 'q')]
# matriz de transferencia de una celda (libre + delta) para (ψ, ψ′)
Tfree = Matrix([[cos(qq * a_), sin(qq * a_) / qq], [-qq * sin(qq * a_), cos(qq * a_)]])
Tdel = Matrix([[1, 0], [2 * m3 * al_ / hb3 ** 2, 1]])
Tc = sp.simplify(Tdel * Tfree)
ident(D, 'det de la matriz de transferencia = 1', sp.simplify(Tc.det()), 1)
ident(D, 'tr(T)/2 = cos qa + (mα/ħ²q) sin qa (⇒ cos ka = tr T/2)', sp.simplify(Tc.trace() / 2), cos(qq * a_) + m3 * al_ / (hb3 ** 2 * qq) * sin(qq * a_))
ident(D, 'P sen(qa)/(qa) con P = mαa/ħ² reproduce (mα/ħ²q) sen qa', Pp * sin(qq * a_) / (qq * a_) - (m3 * al_ / (hb3 ** 2 * qq)) * sin(qq * a_) * 0, Pp * sin(qq * a_) / (qq * a_)) if False else ident(D, '(mα/ħ²q) sen qa = P sen(qa)/(qa) con P = mαa/ħ²', (m3 * al_ / (hb3 ** 2 * qq)) * sin(qq * a_) - (m3 * al_ * a_ / hb3 ** 2) * sin(qq * a_) / (qq * a_), 0)
fp = lambda t, P: math.cos(t) + P * math.sin(t) / t
ident(D, 'f(π) = −1 para todo P (techo de la 1.ª banda independiente de α)', sp.simplify((cos(qa) + Pp * sin(qa) / qa).subs(qa, pi)), -1)
dl = Symbol('delta', positive=True)
series_is(D, 'f(π+δ) + 1 = −Pδ/π + (½ + P/π²)δ² + O(δ³)', cos(pi + dl) + Pp * sin(pi + dl) / (pi + dl) + 1, dl, 0, 3, -Pp * dl / pi + (R_(1, 2) + Pp / pi ** 2) * dl ** 2)
solves(D, '−P/π + (½ + P/π²)δ = 0 ⇒ δ = 2πP/(π² + 2P) ≈ 2P/π', [Eq(-Pp / pi + (R_(1, 2) + Pp / pi ** 2) * dl, 0)], dl, 2 * pi * Pp / (pi ** 2 + 2 * Pp))
series_is(D, 'δ ≈ 2P/π para P pequeño', 2 * pi * Pp / (pi ** 2 + 2 * Pp), Pp, 0, 2, 2 * Pp / pi)
ident(D, 'ΔE = (ħ²/2ma²)[(π+δ)² − π²] ≈ (ħ²/2ma²)·2πδ = 4P ħ²/(2ma²) = 2α/a', (hb3 ** 2 / (2 * m3 * a_ ** 2)) * 2 * pi * (2 * (m3 * al_ * a_ / hb3 ** 2) / pi), 2 * al_ / a_)
# diagonalización independiente en ondas planas
def pw_levels(P, kappa, nb=25, nl=4):
    js = np.arange(-nb, nb + 1)
    Hm = np.diag((kappa + 2 * np.pi * js) ** 2) + 2 * P
    return sl.eigvalsh(Hm)[:nl]
def edges(P):
    t1 = brentq(lambda t: fp(t, P) - 1, 1e-9, math.pi - 1e-12)
    t = math.pi + 1e-9; st = math.pi / 4000
    while fp(t, P) < -1: t += st
    t3 = brentq(lambda t_: fp(t_, P) + 1, t - st, t)
    return t1, t3
for P in (0.05, 0.2, 1.0, 1.1811079, 5.0):
    t1, t3 = edges(P)
    e0 = pw_levels(P, 0.0, nb=200)[0]; e1 = pw_levels(P, math.pi, nb=200)[:2]
    rec(G_STEP, D, f'ondas planas (161), P={P}: fondo de la 1.ª banda (k=0) = (qa)² con f=1', float(e0), t1 ** 2, 'rel 2e-3', abs(e0 / t1 ** 2 - 1) < 2e-3)
    rec(G_STEP, D, f'ondas planas, P={P}: techo de la 1.ª banda en k=π/a es π²', float(e1[0]), math.pi ** 2, 'rel 2e-3', abs(e1[0] / math.pi ** 2 - 1) < 2e-3)
    rec(G_STEP, D, f'ondas planas, P={P}: fondo de la 2.ª banda en k=π/a = (qa)² con f=−1', float(e1[1]), t3 ** 2, 'rel 2e-3', abs(e1[1] / t3 ** 2 - 1) < 2e-3)
for kap in (0.4, 1.3, 2.2, 2.9):
    P = 1.1811079
    ev = pw_levels(P, kap, nb=80)[:3]
    res = max(abs(math.cos(kap) - fp(math.sqrt(e_), P)) for e_ in ev)
    rec(G_STEP, D, f'ondas planas: los 3 primeros niveles en ka={kap} cumplen cos ka = cos qa + P sen qa/qa', float(res), 0.0, 'abs 2e-3', res < 2e-3)
uK = {'k': 'm^-1', 'q': 'm^-1', 'E': 'J', 'a': 'm', 'alpha': 'J m', 'P': '1', 'm': 'kg', 'hbar': 'J s', 'V_G': 'J', 'DE': 'J'}
Pdim, VG, DEs = Symbol('P', positive=True), Symbol('V_G', positive=True), Symbol('DE', positive=True)
dimcheck(D, 'P = mαa/ħ²', Pdim, m3 * al_ * a_ / hb3 ** 2, uK)
dimcheck(D, 'q = √(2mE)/ħ', qq, sqrt(2 * m3 * Symbol('E', positive=True)) / hb3, uK)
dimcheck(D, 'ΔE = 2α/a = 2V_G con V_G = α/a', DEs, 2 * al_ / a_, uK)
dimcheck(D, 'E_techo = ħ²π²/(2ma²)', Symbol('E', positive=True), hb3 ** 2 * pi ** 2 / (2 * m3 * a_ ** 2), uK)
hbm = hb ** 2 / (2 * me) / qe * 1e18
def kpv(a_nm, al_eVnm):
    a = a_nm * 1e-9; P = me * al_eVnm * qe * 1e-9 * a / hb ** 2; t1, t3 = edges(P); E0 = hbm / a_nm ** 2
    return P, E0, t1, t3
P0, E00, t10, t30 = kpv(0.3, 0.3)
num(D, 'P', P0, '1.1811'); num(D, 'ħ²/2ma² (eV)', E00, '0.42333'); num(D, 'fondo (eV)', E00 * t10 ** 2, '0.8308'); num(D, 'techo (eV)', E00 * math.pi ** 2, '4.1781'); num(D, 'ancho de la banda (eV)', E00 * (math.pi ** 2 - t10 ** 2), '3.347'); num(D, 'brecha (eV)', E00 * (t30 ** 2 - math.pi ** 2), '1.780'); num(D, 'sobreestimación de 2α/a (%)', (2.0 / (E00 * (t30 ** 2 - math.pi ** 2)) - 1) * 100, '12')
for P, g_exact, g_weak in ((0.05, '0.19899', '0.2'), (0.2, '0.7840', '0.8'), (1.0, '3.6228', '4.0')):
    t1, t3 = edges(P)
    num(D, f'brecha adimensional (P={P})', t3 ** 2 - math.pi ** 2, g_exact); num(D, f'estimación 4P (P={P})', 4 * P, g_weak)
num(D, 'error de 4P en P = 0.05 (%)', (0.2 / (edges(0.05)[1] ** 2 - math.pi ** 2) - 1) * 100, '0.5')
for P, w in ((0.05, '9.770'), (0.2, '9.483'), (1.0, '8.163'), (5.0, '4.651'), (20.0, '1.703')):
    t1, t3 = edges(P); num(D, f'ancho de banda adimensional (P={P})', math.pi ** 2 - t1 ** 2, w)
num(D, 'valor inicial: P', P0, '1.18111'); num(D, 'valor inicial: fondo', E00 * t10 ** 2, '0.830836'); num(D, 'valor inicial: techo', E00 * math.pi ** 2, '4.17811'); num(D, 'valor inicial: brecha', E00 * (t30 ** 2 - math.pi ** 2), '1.78007')
def kp_ref(d, o):
    P, E0, t1, t3 = kpv(d['a'], d['al'])
    return {'P': P, 'E1': E0 * t1 ** 2, 'Et': E0 * math.pi ** 2, 'gap': E0 * (t3 ** 2 - math.pi ** 2), 'gw': 2 * d['al'] / d['a']}[o]
for o in ('P', 'E1', 'Et', 'gap', 'gw'):
    fsim_py('kp', o, (lambda oo_: (lambda d: kp_ref(d, oo_)))(o), tol=1e-7, deriv=D)
