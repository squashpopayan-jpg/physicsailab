# -*- coding: utf-8 -*-
"""Capítulo 36 — Física nuclear."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, tan, atan, acos, cot, Function
from scipy.integrate import quad, solve_ivp
from scipy.optimize import minimize_scalar

h = 6.62607015e-34; hb = h / (2 * math.pi); c = 299792458.0; qe = 1.602176634e-19; kB = 1.380649e-23; alpha = 7.2973525693e-3; hbc = 197.3269804; UMEV = 931.49410242; YR = 3.15576e7; NAv = 6.02214076e23
mn_MeV = 939.565421; mp_MeV = 938.272088
KE = alpha * hbc
aV, aS, aC, aA, aP = 15.75, 17.8, 0.711, 23.7, 11.18
hq = sp.Float('6.62607015e-34', 40); cq = sp.Float('299792458', 40); alq = sp.Float('7.2973525693e-3', 40); hbcq = sp.Float('197.3269804', 40); umq = sp.Float('931.49410242', 40); KEq = alq * hbcq
fl = lambda x: math.floor(x + 0.5)

# ================================================================ SEMF
D = 'semf'
def Bsemf(A, Z):
    N = A - Z; d = 0.0
    if Z % 2 == 0 and N % 2 == 0: d = aP / math.sqrt(A)
    elif Z % 2 == 1 and N % 2 == 1: d = -aP / math.sqrt(A)
    return aV * A - aS * A ** (2 / 3) - aC * Z * (Z - 1) / A ** (1 / 3) - aA * (A - 2 * Z) ** 2 / A + d
xx = Symbol('x', real=True)
series_is(D, '(1+x)^{5/3} + (1−x)^{5/3} = 2 + (10/9)x² + …', (1 + xx) ** R_(5, 3) + (1 - xx) ** R_(5, 3), xx, 0, 4, 2 + R_(10, 9) * xx ** 2)
eF, A_, Z_ = [Symbol(s_, positive=True) for s_ in ('eF', 'A', 'Z')]
ident(D, 'exceso cinético: (3/5)ε_F A (5/9) x² con x = (A−2Z)/A es (ε_F/3)(A−2Z)²/A ⇒ a_A(cin) = ε_F/3', R_(3, 5) * eF * A_ * R_(5, 9) * ((A_ - 2 * Z_) / A_) ** 2, eF / 3 * (A_ - 2 * Z_) ** 2 / A_)
# energía electrostática de una esfera uniforme
Rr, Qq, rr, e0 = [Symbol(s_, positive=True) for s_ in ('R', 'Q', 'r', 'eps0')]
Ein = Qq * rr / (4 * pi * e0 * Rr ** 3); Eout = Qq / (4 * pi * e0 * rr ** 2)
Uf = integrate(e0 / 2 * Ein ** 2 * 4 * pi * rr ** 2, (rr, 0, Rr)) + integrate(e0 / 2 * Eout ** 2 * 4 * pi * rr ** 2, (rr, Rr, oo))
ident(D, 'energía del campo de una esfera uniformemente cargada = (3/5)Q²/(4πε₀R)', sp.simplify(Uf), R_(3, 5) * Qq ** 2 / (4 * pi * e0 * Rr))
Zv, a1, a2, a3 = symbols('Zv aA aC A3', positive=True)
Bs = lambda Zv_: -aC * Zv_ * (Zv_ - 1) / A_ ** R_(1, 3) - aA * (A_ - 2 * Zv_) ** 2 / A_
Zst = (4 * aA + aC * A_ ** R_(-1, 3)) / (8 * aA / A_ + 2 * aC * A_ ** R_(-1, 3))
ident(D, 'dB/dZ = 0 en Z_est = (4a_A + a_C A^{−1/3})/(8a_A/A + 2a_C A^{−1/3})', sp.simplify(diff(Bs(Zv), Zv).subs(Zv, Zst)), 0) if False else ident(D, 'dB/dZ = 0 en Z_est', sp.simplify(diff(Bs(Z_), Z_).subs(Z_, Zst.subs({aA: aA, aC: aC}))) if False else sp.simplify(diff(Bs(Z_), Z_).subs(Z_, Zst)), 0)
ident(D, 'd²B/dZ² < 0: Z_est es un máximo de B (mínimo de masa)', sp.simplify(diff(Bs(Z_), Z_, 2) + 2 * aC / A_ ** R_(1, 3) + 8 * aA / A_), 0)
for Av in (56, 120, 208, 238):
    zf = (4 * aA + aC * Av ** (-1 / 3)) / (8 * aA / Av + 2 * aC * Av ** (-1 / 3))
    om = minimize_scalar(lambda z: -(-aC * z * (z - 1) / Av ** (1 / 3) - aA * (Av - 2 * z) ** 2 / Av), bounds=(10, 110), method='bounded', options={'xatol': 1e-10})
    rec(G_STEP, D, f'máximo numérico de B respecto a Z (A={Av}) = Z_est', om.x, zf, 'rel 1e-6', abs(om.x / zf - 1) < 1e-6)
rec(G_STEP, D, 'el máximo de B/A está en A = 58 (Z = 26) en el modelo', 1.0, 1.0, 'igualdad', max((Bsemf(A, Z) / A, A, Z) for A in range(20, 260) for Z in range(10, 100))[1:] == (58, 26))
uS = {'B': 'J', 'a_V': 'J', 'a_S': 'J', 'a_A': 'J', 'a_P': 'J', 'a_C': 'J', 'A': '1', 'Z': '1', 'r_0': 'm', 'e': 'C', 'eps0': 'F m^-1', 'eF': 'J'}
Bsy, aVy, aSy, aAy, aPy, aCy, r0y, ey, eFy = [Symbol(k, positive=True) for k in ('B', 'a_V', 'a_S', 'a_A', 'a_P', 'a_C', 'r_0', 'e', 'eF')]
dimcheck(D, 'B = a_V A − a_S A^{2/3} − a_C Z(Z−1)/A^{1/3} − a_A (A−2Z)²/A + a_P/√A', Bsy, aVy * A_ - aSy * A_ ** R_(2, 3) - aCy * Z_ * (Z_ - 1) / A_ ** R_(1, 3) - aAy * (A_ - 2 * Z_) ** 2 / A_ + aPy / sqrt(A_), uS)
dimcheck(D, 'a_C = (3/5) e²/(4πε₀ r₀)', aCy, R_(3, 5) * ey ** 2 / (4 * pi * e0 * r0y), dict(uS, eps0='F m^-1'))
dimcheck(D, 'a_A ≈ ε_F/3', aAy, eFy / 3, uS)
rho = 0.16; kfn = (3 * math.pi ** 2 * rho / 2) ** (1 / 3); eF0 = (hbc * kfn) ** 2 / (2 * (mn_MeV + mp_MeV) / 2)
mexp = {'He4': (4, 2, 28.296), 'O16': (16, 8, 127.619), 'Fe56': (56, 26, 492.254), 'Sn120': (120, 50, 1020.55), 'Pb208': (208, 82, 1636.43), 'U238': (238, 92, 1801.69)}
num(D, 'a_C de primeros principios (MeV)', 0.6 * KE / 1.2, '0.720'); num(D, 'ε_F nuclear (MeV)', eF0, '36.8'); num(D, 'a_A cinético ε_F/3 (MeV)', eF0 / 3, '12.3')
num(D, 'B(Sn-120)', Bsemf(120, 50), '1025.80'); num(D, 'error Sn-120 (%)', (Bsemf(120, 50) / 1020.55 - 1) * 100, '0.51'); num(D, 'B(Fe-56)', Bsemf(56, 26), '495.38'); num(D, 'error Fe-56', (Bsemf(56, 26) / 492.254 - 1) * 100, '0.64'); num(D, 'B(Pb-208)', Bsemf(208, 82), '1634.26'); num(D, 'error Pb', (Bsemf(208, 82) / 1636.43 - 1) * 100, '-0.13'); num(D, 'B(U-238)', Bsemf(238, 92), '1814.73'); num(D, 'error U', (Bsemf(238, 92) / 1801.69 - 1) * 100, '0.72'); num(D, 'B(O-16)', Bsemf(16, 8), '125.97'); num(D, 'error O', (Bsemf(16, 8) / 127.619 - 1) * 100, '-1.3'); num(D, 'B(He-4)', Bsemf(4, 2), '22.84'); num(D, 'error He', (Bsemf(4, 2) / 28.296 - 1) * 100, '-19')
num(D, 'B/A máximo del modelo', Bsemf(58, 26) / 58, '8.865'); num(D, 'B/A Fe-56 medido', 492.254 / 56, '8.79', tol=1e-3)
Zf = lambda Av: (4 * aA + aC * Av ** (-1 / 3)) / (8 * aA / Av + 2 * aC * Av ** (-1 / 3))
num(D, 'Z_est(56)', Zf(56), '25.28'); num(D, 'Z_est(120)', Zf(120), '50.82'); num(D, 'Z_est(208)', Zf(208), '82.43'); num(D, 'Z_est(238)', Zf(238), '92.50'); num(D, 'Z/A de U vs Fe', 92 / 238, '0.39', tol=0.02)
num(D, 'fisión simétrica ²³⁸U', 2 * Bsemf(119, 46) - Bsemf(238, 92), '183.7')
Cc = aC * 26 * 25 / 56 ** (1 / 3)
num(D, 'valor inicial: B', Bsemf(56, 26), '495.384'); num(D, 'valor inicial: B/A', Bsemf(56, 26) / 56, '8.84614'); num(D, 'valor inicial: Z_est', Zf(56), '25.2797'); num(D, 'valor inicial: E_Coulomb', Cc, '120.80')
def semf_ref(d, o):
    A = fl(d['A']); Z = fl(d['Z']); N = A - Z
    dl = aP / math.sqrt(A) if (Z % 2 == 0 and N % 2 == 0) else (-aP / math.sqrt(A) if (Z % 2 == 1 and N % 2 == 1) else 0.0)
    B = aV * A - aS * A ** (2 / 3) - aC * Z * (Z - 1) / A ** (1 / 3) - aA * (A - 2 * Z) ** 2 / A + dl
    return {'B': B, 'BA': B / A, 'Zs': (4 * aA + aC * A ** (-1 / 3)) / (8 * aA / A + 2 * aC * A ** (-1 / 3)), 'EC': aC * Z * (Z - 1) / A ** (1 / 3)}[o]
for o in ('B', 'BA', 'Zs', 'EC'):
    fsim_py('nuc-semf', o, (lambda oo_: (lambda d: semf_ref(d, oo_)))(o), tol=1e-9, atol=1e-6, deriv=D)

# ================================================================ Desintegración
D = 'desintegracion'
t, lam, N0, l1, l2, N1 = [Symbol(s_, positive=True) for s_ in ('t', 'lambda', 'N0', 'l1', 'l2', 'N1')]
Nt = N0 * exp(-lam * t)
ident(D, 'dN/dt = −λN con N = N₀e^{−λt}', diff(Nt, t) + lam * Nt, 0)
solves(D, 'N(t½) = N₀/2 ⇒ t½ = ln2/λ', [Eq(Nt.subs(t, Symbol('th', positive=True)), N0 / 2)], Symbol('th', positive=True), log(2) / lam)
ident(D, 'N = N₀ 2^{−t/t½} con λ = ln2/t½', sp.simplify(sp.powsimp((N0 * 2 ** (-t / Symbol('th', positive=True))) / (N0 * exp(-(log(2) / Symbol('th', positive=True)) * t)), force=True)), 1) if False else ident(D, '2^{−t/t½} = e^{−(ln 2/t½)t}', sp.simplify(sp.expand_power_base(2 ** (-t / Symbol('th', positive=True))) - exp(-log(2) * t / Symbol('th', positive=True))), 0)
ident(D, 'edad: A = A₀e^{−t/τ} ⇒ t = τ ln(A₀/A)', sp.simplify(sp.expand_log(Symbol('tau', positive=True) * log(Symbol('A0', positive=True) / (Symbol('A0', positive=True) * exp(-t / Symbol('tau', positive=True)))), force=True)), t)
N2t = N1 * l1 / (l2 - l1) * (exp(-l1 * t) - exp(-l2 * t))
ident(D, 'Bateman: dN₂/dt = λ₁N₁(t) − λ₂N₂ con N₁ = N₁(0)e^{−λ₁t}', sp.simplify(diff(N2t, t) - (l1 * N1 * exp(-l1 * t) - l2 * N2t)), 0)
ident(D, 'Bateman: N₂(0) = 0', N2t.subs(t, 0), 0)
ident(D, 'equilibrio secular (λ₁ ≪ λ₂): λ₂N₂ → λ₁N₁(t)', sp.limit(sp.simplify(l2 * N2t / (l1 * N1 * exp(-l1 * t))), l1, 0), 1 - exp(-l2 * t))
sol = solve_ivp(lambda tt, y: [-0.3 * y[0], 0.3 * y[0] - 2.0 * y[1]], [0, 8], [1.0, 0.0], rtol=1e-12, atol=1e-14, dense_output=True)
for tv in (1.0, 3.0, 7.0):
    ref = 0.3 / (2.0 - 0.3) * (math.exp(-0.3 * tv) - math.exp(-2.0 * tv))
    rec(G_STEP, D, f'integración numérica de la cadena (λ₁ = 0.3, λ₂ = 2): N₂({tv:g}) = fórmula de Bateman', float(sol.sol(tv)[1]), ref, 'rel 1e-8', abs(sol.sol(tv)[1] / ref - 1) < 1e-8)
uDe = {'N': '1', 'lambda': 's^-1', 't_half': 's', 'tau': 's', 't': 's', 'A': 's^-1'}
lamS, thS, tauS, tS, AS, NS = [Symbol(k, positive=True) for k in ('lambda', 't_half', 'tau', 't', 'A', 'N')]
dimcheck(D, 't½ = ln2/λ', thS, log(2) / lamS, uDe)
dimcheck(D, 'τ = 1/λ', tauS, 1 / lamS, uDe)
dimcheck(D, 'A = λN', AS, lamS * NS, uDe)
dimcheck(D, 'exponente λt adimensional', NS, exp(-lamS * tS), uDe)
lamC = math.log(2) / (5730 * YR)
num(D, 'λ(¹⁴C) 10⁻¹² s⁻¹', lamC * 1e12, '3.8332'); num(D, 'τ(¹⁴C) años', 5730 / math.log(2), '8266.6'); num(D, 'fracción a 10 000 años (%)', 2 ** (-10000 / 5730) * 100, '29.83'); num(D, 'actividad por gramo de C (Bq)', NAv / 12.011 * 1.176e-12 * lamC, '0.2260'); num(D, 'fracción a 50 000 años (10⁻³)', 2 ** (-50000 / 5730) * 1e3, '2.4')
num(D, 'dos semividas (%)', 25.0, '25', tol=1e-9); num(D, 'siete semividas (%)', 2 ** -7 * 100, '0.78')
lRa, lRn = math.log(2) / (1600 * 365.25), math.log(2) / 3.82
tt7 = 7 * 3.82
A2A1 = (lRn / (lRn - lRa)) * (1 - math.exp(-(lRn - lRa) * tt7))
num(D, 'siete semividas del Rn (días)', tt7, '26.7'); num(D, 'A₂/A₁ tras siete semividas (%)', A2A1 * 100, '99.2')
num(D, 'valor inicial: N/N₀', 2 ** (-10000 / 5730), '0.298292'); num(D, 'valor inicial: λ', lamC * 1e12, '3.83325'); num(D, 'valor inicial: τ', 5730 / math.log(2), '8266.64'); num(D, 'valor inicial: A/A₀', 2 ** (-10000 / 5730) * 100, '29.8292')
ths, ts_ = symbols('th t', positive=True)
fsim('nuc-decaimiento', 'f', 2 ** (-ts_ / ths), deriv=D)
fsim('nuc-decaimiento', 'lam', sp.log(2) / (ths * sp.Float(YR, 20)) * sp.Float('1e12', 40), deriv=D)
fsim('nuc-decaimiento', 'tau', ths / sp.log(2), deriv=D)
fsim('nuc-decaimiento', 'ac', 2 ** (-ts_ / ths) * 100, deriv=D)

# ================================================================ Rutherford
D = 'rutherford'
K, E, b, th, bb = [Symbol(s_, positive=True) for s_ in ('K', 'E', 'b', 'theta', 'bb')]
beta = K / (2 * E * b)
ident(D, 'tan(θ/2) = tan(π/2 − arctan(1/β)) = β con β = K/(2Eb)', sp.simplify(tan(pi / 2 - atan(1 / beta)) - beta), 0)
bth = K / (2 * E) / tan(th / 2)
dbdth = diff(bth, th)
ident(D, 'db/dθ = −K/(4E sen²(θ/2))', sp.simplify(dbdth + K / (4 * E * sin(th / 2) ** 2)), 0)
ident(D, 'dσ/dΩ = (b/sen θ)|db/dθ| = (K/4E)²/sen⁴(θ/2)', sp.simplify((bth / sin(th)) * (-dbdth) - (K / (4 * E)) ** 2 / sin(th / 2) ** 4), 0)
th0 = Symbol('th0', positive=True)
integral(D, '∫ᶿ⁰^π (dσ/dΩ) 2π sinθ dθ = π b(θ₀)² (conservación de las partículas)', (K / (4 * E)) ** 2 / sin(th / 2) ** 4 * 2 * pi * sin(th), th, th0, pi, pi * (K / (2 * E)) ** 2 / tan(th0 / 2) ** 2) if False else rec(G_STEP, D, 'conservación: ∫θ₀^π (dσ/dΩ)2π sen θ dθ = π b(θ₀)² (K=1, E=1, θ₀=0.7)', quad(lambda x: (1 / 4) ** 2 / math.sin(x / 2) ** 4 * 2 * math.pi * math.sin(x), 0.7, math.pi)[0], math.pi * (1 / 2) ** 2 / math.tan(0.35) ** 2, 'rel 1e-9', abs(quad(lambda x: (1 / 4) ** 2 / math.sin(x / 2) ** 4 * 2 * math.pi * math.sin(x), 0.7, math.pi)[0] / (math.pi * (1 / 2) ** 2 / math.tan(0.35) ** 2) - 1) < 1e-9)
# integración numérica de órbitas de Coulomb repulsivas
def defl(bv, Kv=1.0, Ev=0.5, mv=1.0):
    v0 = math.sqrt(2 * Ev / mv); x0 = -4000.0
    def f(tt, y):
        r = math.hypot(y[0], y[1]); F = Kv / r ** 3
        return [y[2], y[3], F * y[0] / mv, F * y[1] / mv]
    ev = lambda tt, y: y[0] - 4000.0
    ev.terminal = True
    s = solve_ivp(f, [0, 30000], [x0, bv, v0, 0.0], rtol=1e-12, atol=1e-12, events=ev)
    vf = s.y[:, -1]
    return math.atan2(vf[3], vf[2])
for bv in (0.5, 1.0, 2.0, 5.0):
    th_ref = 2 * math.atan(1.0 / (2 * 0.5 * bv))
    rec(G_STEP, D, f'integración numérica de la órbita (K=1, E=½): desviación para b={bv} = 2 arctan(K/2Eb)', abs(defl(bv)), th_ref, 'rel 5e-4', abs(abs(defl(bv)) / th_ref - 1) < 5e-4)
uRu = {'K': 'J m', 'E': 'J', 'b': 'm', 'theta': 'rad', 'sig': 'm^2', 'd': 'm', 'L': 'kg m^2 s^-1', 'm': 'kg', 'v': 'm s^-1'}
sig_, d_, L_, m_, v_ = [Symbol(k, positive=True) for k in ('sig', 'd', 'L', 'm', 'v')]
dimcheck(D, 'b = (K/2E) cot(θ/2)', b, K / (2 * E) * cot(th / 2), uRu)
dimcheck(D, 'dσ/dΩ = (K/4E)²/sen⁴(θ/2)', sig_, (K / (4 * E)) ** 2 / sin(th / 2) ** 4, uRu)
dimcheck(D, 'd = K/E', d_, K / E, uRu)
dimcheck(D, 'L = m v b', L_, m_ * v_ * b, uRu)
Kk = 2 * 79 * KE; Ee = 5.5
dsd = lambda thd: (Kk / (4 * Ee)) ** 2 / math.sin(math.radians(thd) / 2) ** 4
num(D, 'K (MeV fm)', Kk, '227.5', tol=1e-3); num(D, 'd (fm)', Kk / Ee, '41.37'); num(D, 'b(90°)', Kk / (2 * Ee), '20.68'); num(D, 'dσ/dΩ(90°)', dsd(90), '427.8'); num(D, 'dσ/dΩ(30°)', dsd(30), '23833'); num(D, 'razón 5°/175°', dsd(5) / dsd(175), '2.75e5', tol=2e-3); num(D, 'razón por duplicar E', 4.0, '4', tol=1e-9)
num(D, 'valor inicial: d', Kk / Ee, '41.3663'); num(D, 'valor inicial: b', Kk / (2 * Ee), '20.6831'); num(D, 'valor inicial: dσ/dΩ', dsd(90), '427.792')
Z1s, Z2s, Es, ths_ = symbols('Z1 Z2 E th', positive=True)
cv = lambda p: dict(Z1=p['Z1'], Z2=p['Z2'], E=p['E'], th=math.radians(p['th']))
fsim('nuc-rutherford', 'd', Z1s * Z2s * KEq / Es, conv=cv, deriv=D)
fsim('nuc-rutherford', 'b', Z1s * Z2s * KEq / Es / 2 / sp.tan(ths_ / 2), conv=cv, deriv=D)
fsim('nuc-rutherford', 'ds', (Z1s * Z2s * KEq / Es / 4) ** 2 / sp.sin(ths_ / 2) ** 4, conv=cv, deriv=D)

# ================================================================ Gamow alfa
D = 'gamow-alfa'
mA = 4.001506179 * UMEV
def gam(Ad, Zd, Q, R=0.0):
    Md = Ad * UMEV; mu = mA * Md / (mA + Md)
    if R <= 0: R = 1.2 * (Ad ** (1 / 3) + 4 ** (1 / 3))
    k = 2 * Zd * KE; b = k / Q; x = R / b
    G = math.sqrt(2 * mu * Q) / hbc * b * (math.acos(math.sqrt(x)) - math.sqrt(x * (1 - x)))
    v = c * math.sqrt(2 * Q / mu); nu = v / (2 * R * 1e-15)
    return dict(G2=2 * G, nu=nu, th=math.log(2) / (nu * math.exp(-2 * G)), b=b, R=R, mu=mu, v=v, k=k)
# la antiderivada de la integral de Gamow
for (Kv, Qv, Rv, mu_) in ((50.0, 5.0, 3.0, 3700.0), (300.0, 8.0, 9.0, 3700.0), (180.0, 4.2, 7.0, 3000.0)):
    bv = Kv / Qv
    num_int = quad(lambda r: math.sqrt(2 * mu_ * (Kv / r - Qv)), Rv, bv, epsabs=1e-13, epsrel=1e-13)[0] / hbc
    xq = Rv / bv; cl = math.sqrt(2 * mu_ * Qv) / hbc * bv * (math.acos(math.sqrt(xq)) - math.sqrt(xq * (1 - xq)))
    rec(G_STEP, D, f'G = (1/ħ)∫√(2μ(K/r − Q))dr: integral numérica = forma cerrada (K={Kv}, Q={Qv}, R={Rv})', num_int, cl, 'rel 1e-9', abs(num_int / cl - 1) < 1e-9)
s_ = Symbol('s', positive=True)
series_is(D, 'x ≪ 1: arccos(s) − s√(1−s²) = π/2 − 2s + s³/3 + … con s = √x', sp.acos(s_) - s_ * sqrt(1 - s_ ** 2), s_, 0, 4, pi / 2 - 2 * s_ + s_ ** 3 / 3)
rr_, Kq, Qq2, bq, muq = [Symbol(k, positive=True) for k in ('r', 'K', 'Q', 'b', 'mu')]
Fr = lambda R_x: sqrt(2 * muq * Qq2) * (Kq / Qq2) * (acos(sqrt(R_x * Qq2 / Kq)) - sqrt((R_x * Qq2 / Kq) * (1 - R_x * Qq2 / Kq)))
Rx = Symbol('Rx', positive=True)
dFd = diff(Fr(Rx), Rx)
rec(G_STEP, D, 'dG/dR = −√(2μ(K/R − Q)) (derivada de la forma cerrada, valor numérico)', float(dFd.subs({muq: 3700, Qq2: 5.0, Kq: 50.0, Rx: 3.0})), -math.sqrt(2 * 3700 * (50.0 / 3.0 - 5.0)), 'rel 1e-9', abs(float(dFd.subs({muq: 3700, Qq2: 5.0, Kq: 50.0, Rx: 3.0})) / -math.sqrt(2 * 3700 * (50.0 / 3.0 - 5.0)) - 1) < 1e-9)
for xr in (1e-3, 1e-4, 1e-5):
    Kv, Qv, mu_ = 300.0, 8.0, 3700.0; bv = Kv / Qv; Rv = xr * bv
    ex = 2 * math.sqrt(2 * mu_ * Qv) / hbc * bv * (math.acos(math.sqrt(xr)) - math.sqrt(xr * (1 - xr)))
    eta = Kv / (hbc * math.sqrt(2 * Qv / mu_) / c * c) if False else Kv / (hbc * math.sqrt(2 * Qv / mu_))
    apx = 2 * math.pi * eta - 4 * math.sqrt(2 * mu_ * Kv * Rv) / hbc
    rec(G_STEP, D, f'barrera ancha (x = {xr:g}): 2G ≈ 2πη − 4√(2μKR)/ħ', ex, apx, f'rel {10 * xr ** 1.5 + 1e-9:.1e}', abs(ex / apx - 1) < 10 * xr ** 1.5 + 1e-9)
uG = {'t_half': 's', 'R': 'm', 'b': 'm', 'v': 'm s^-1', 'mu': 'kg', 'Q': 'J', 'K': 'J m', 'hbar': 'J s', 'G': '1', 'eta': '1'}
thG, RG_, bG, vG, muG, QG, KG, hbG, etaG, GG = [Symbol(k, positive=True) for k in ('t_half', 'R', 'b', 'v', 'mu', 'Q', 'K', 'hbar', 'eta', 'G')]
dimcheck(D, 'b = K/Q', bG, KG / QG, uG)
dimcheck(D, 'η = K/(ħv)', etaG, KG / (hbG * vG), uG)
dimcheck(D, 'G = (√(2μQ)/ħ) b', GG, sqrt(2 * muG * QG) / hbG * bG, uG)
dimcheck(D, 't½ = (2R ln2/v) e^{2G}', thG, 2 * RG_ * log(2) / vG * exp(2 * GG), uG)
dimcheck(D, 'v = √(2Q/μ)', vG, sqrt(2 * QG / muG), uG)
cases = {'Po212': (208, 82, 8.954, 0.299e-6), 'U238': (234, 90, 4.270, 4.468e9 * YR), 'Th232': (228, 88, 4.082, 1.405e10 * YR), 'Ra226': (222, 86, 4.871, 1600 * YR)}
g = {k: gam(*v[:3]) for k, v in cases.items()}
num(D, 'R(Po)', g['Po212']['R'], '9.01'); num(D, '2G Po', g['Po212']['G2'], '32.29'); num(D, 't½ Po (10⁻⁸ s)', g['Po212']['th'] * 1e8, '6.3'); num(D, 'cociente Po medido/calculado', cases['Po212'][3] / g['Po212']['th'], '4.7')
num(D, '2G U', g['U238']['G2'], '87.99'); num(D, 't½ U (10¹⁷ s)', g['U238']['th'] * 1e-17, '1.46'); num(D, 't½ U medida (10¹⁷ s)', cases['U238'][3] * 1e-17, '1.41'); num(D, 't½ Th (10¹⁷ s)', g['Th232']['th'] * 1e-17, '4.6'); num(D, 't½ Th medida', cases['Th232'][3] * 1e-17, '4.4'); num(D, 't½ Ra (10¹⁰ s)', g['Ra226']['th'] * 1e-10, '3.3'); num(D, 't½ Ra medida', cases['Ra226'][3] * 1e-10, '5.0')
rmax = max(abs(math.log10(g[k]['th'] / cases[k][3])) for k in g)
rec(G_STEP, D, 'errores de la semivida de Gamow < factor 5 en los cuatro núcleos (24 órdenes de magnitud de rango)', rmax, math.log10(5), 'log₁₀ < 0.7', rmax < math.log10(5))
num(D, 'rango (órdenes) entre Po y U', math.log10(g['U238']['th'] / g['Po212']['th']), '24', tol=0.02)
q1 = gam(234, 90, 4.270 * 1.01)['th'] / g['U238']['th']
num(D, 'factor por +1 % en Q (U-238)', 1 / q1, '2.3')
num(D, 'valor inicial: 2G', g['Po212']['G2'], '32.2916'); num(D, 'valor inicial: log₁₀ t½', math.log10(g['Po212']['th']), '-7.2009'); num(D, 'valor inicial: b', g['Po212']['b'], '26.4'); num(D, 'valor inicial: ν (10²¹ s⁻¹)', g['Po212']['nu'] * 1e-21, '1.16')
def gam_ref(d, o):
    r = gam(d['Ad'], d['Zd'], d['Q'], d['R'])
    return {'G2': r['G2'], 'nu': r['nu'], 'lt': math.log10(r['th']), 'b': r['b']}[o]
# la JS usa Ad y Zd redondeados por 'step': se comparan con los valores del propio muestreo
for o in ('G2', 'nu', 'lt', 'b'):
    fsim_py('nuc-gamow', o, (lambda oo_: (lambda d: gam_ref(d, oo_)))(o), tol=1e-8, atol=1e-6, deriv=D)

# ================================================================ Fusión
D = 'fusion-gamow'
E_, kT, EG, E0, mu_c2, Z12 = [Symbol(s_, positive=True) for s_ in ('E', 'kT', 'E_G', 'E_0', 'mu_c2', 'Z12')]
f_ = -E_ / kT - sqrt(EG / E_)
solves(D, 'd/dE[−E/kT − √(E_G/E)] = 0 ⇒ E₀ = (E_G (kT)²/4)^{1/3}', [Eq(diff(f_, E_), 0)], E_, (EG * kT ** 2 / 4) ** R_(1, 3))
E0s = (EG * kT ** 2 / 4) ** R_(1, 3)
ident(D, 'd²f/dE² en E₀ = −3/(2 kT E₀)', sp.simplify(diff(f_, E_, 2).subs(E_, E0s) + 3 / (2 * kT * E0s)), 0)
ident(D, 'Δ = 2√2 σ con σ² = 2kT E₀/3 (anchura a 1/e): Δ = 4√(E₀kT/3)', sp.simplify((2 * sqrt(2) * sqrt(2 * kT * E0s / 3)) - 4 * sqrt(E0s * kT / 3)), 0)
ident(D, '2πη = √(E_G/E) con η = Z₁Z₂α c/v, v = √(2E/μ), E_G = 2μc²(παZ₁Z₂)²', sp.simplify((2 * pi * Z12 * alq_s * sqrt(mu_c2 / (2 * E_)))**2 - 2 * mu_c2 * (pi * alq_s * Z12) ** 2 / E_) if False else sp.simplify((2 * pi * Z12 * Symbol('al', positive=True) * sqrt(mu_c2 / (2 * E_))) ** 2 - 2 * mu_c2 * (pi * Symbol('al', positive=True) * Z12) ** 2 / E_), 0)
# máximo numérico del integrando
for (Eg_v, kT_v) in ((1182.44, 10.0), (493.4, 1.29), (986.0, 50.0)):
    om = minimize_scalar(lambda e: e / kT_v + math.sqrt(Eg_v / e), bounds=(0.01, 2000), method='bounded', options={'xatol': 1e-10})
    rec(G_STEP, D, f'máximo numérico de e^{{−E/kT − √(E_G/E)}} (E_G={Eg_v}, kT={kT_v}) = E₀', om.x, (Eg_v * kT_v ** 2 / 4) ** (1 / 3), 'rel 1e-6', abs(om.x / (Eg_v * kT_v ** 2 / 4) ** (1 / 3) - 1) < 1e-6)
# exponente de Gamow exacto con x → 0 frente a √(E_G/E)
mu_dt = 2.01410178 * 3.01604928 / (2.01410178 + 3.01604928) * UMEV
EGdt = 2 * mu_dt * (math.pi * alpha) ** 2 * 1e3
for Ekev in (1.0, 5.0, 20.0):
    Em = Ekev * 1e-3; kk_ = KE; bb_ = kk_ / Em
    G2 = 2 * math.sqrt(2 * mu_dt * Em) / hbc * bb_ * (math.acos(math.sqrt(1e-9)) - math.sqrt(1e-9))
    rec(G_STEP, D, f'2G exacto con R → 0 = √(E_G/E) (D–T, E={Ekev} keV)', G2, math.sqrt(EGdt / Ekev), 'rel 1e-4', abs(G2 / math.sqrt(EGdt / Ekev) - 1) < 1e-4)
uF = {'Q': 'J', 'E_G': 'J', 'E_0': 'J', 'kT': 'J', 'V_C': 'J', 'mu': 'kg', 'alpha': '1', 'Z_1': '1', 'Z_2': '1', 'c': 'm s^-1', 'Delta': 'J'}
QF, EGF, E0F, kTF, VCF, muF, alF, Z1F, Z2F, cF, DlF = [Symbol(k, positive=True) for k in ('Q', 'E_G', 'E_0', 'kT', 'V_C', 'mu', 'alpha', 'Z_1', 'Z_2', 'c', 'Delta')]
dimcheck(D, 'E_G = 2μc²(παZ₁Z₂)²', EGF, 2 * muF * cF ** 2 * (pi * alF * Z1F * Z2F) ** 2, uF)
dimcheck(D, 'E₀ = (E_G (kT)²/4)^{1/3}', E0F, (EGF * kTF ** 2 / 4) ** R_(1, 3), uF)
dimcheck(D, 'Δ = 4√(E₀kT/3)', DlF, 4 * sqrt(E0F * kTF / 3), uF)
dimcheck(D, 'Q = Δm c²', QF, muF * cF ** 2, uF)
mH, mD, mT, mHe, mn1 = 1.00782503223, 2.01410177812, 3.0160492779, 4.00260325413, 1.00866491595
num(D, 'Q(D+T)', (mD + mT - mHe - mn1) * UMEV, '17.589'); num(D, 'Q(4p → He)', (4 * mH - mHe) * UMEV, '26.731'); num(D, 'Q(D+D → T+p)', (2 * mD - mT - mH) * UMEV, '4.033')
def fus(Z1, Z2, A1, A2, kT_):
    mu = A1 * A2 / (A1 + A2) * UMEV; EG = 2 * mu * (math.pi * alpha * Z1 * Z2) ** 2 * 1e3; E0 = (EG * kT_ ** 2 / 4) ** (1 / 3); D_ = 4 * math.sqrt(E0 * kT_ / 3)
    Bc = Z1 * Z2 * KE / (1.2 * (A1 ** (1 / 3) + A2 ** (1 / 3))); return EG, E0, D_, Bc
dt = fus(1, 1, 2.01410178, 3.01604928, 10.0)
num(D, 'barrera D–T (MeV)', dt[3], '0.443'); num(D, 'barrera D–T como temperatura (10⁹ K)', dt[3] * 1e6 * qe / kB * 1e-9, '5.1'); num(D, 'E_G (D–T, keV)', dt[0], '1182.4'); num(D, 'kT = 10 keV en 10⁸ K', 10e3 * qe / kB * 1e-8, '1.2'); num(D, 'E₀ (D–T)', dt[1], '30.92'); num(D, 'Δ (D–T)', dt[2], '40.61')
pp = fus(1, 1, 1.00782503, 1.00782503, 1.29)
num(D, 'E_G (p–p)', pp[0], '493.4'); num(D, 'E₀ (p–p) a 1.29 keV', pp[1], '5.9'); num(D, 'T del núcleo solar (10⁷ K)', 1.29e3 * qe / kB * 1e-7, '1.5'); num(D, 'factor por duplicar T', 2 ** (2 / 3), '1.59')
num(D, 'valor inicial: E_G', dt[0], '1182.44'); num(D, 'valor inicial: E₀', dt[1], '30.9200'); num(D, 'valor inicial: Δ', dt[2], '40.6087'); num(D, 'valor inicial: barrera', dt[3], '0.443171')
Z1f, Z2f, A1f, A2f, kTf = symbols('Z1 Z2 A1 A2 kT', positive=True)
muf = A1f * A2f / (A1f + A2f) * umq
EGf = 2 * muf * (sp.pi * alq * Z1f * Z2f) ** 2 * sp.Float('1e3', 40)
E0f = (EGf * kTf ** 2 / 4) ** R_(1, 3)
fsim('nuc-fusion', 'EG', EGf, deriv=D)
fsim('nuc-fusion', 'E0', E0f, deriv=D)
fsim('nuc-fusion', 'D', 4 * sp.sqrt(E0f * kTf / 3), deriv=D)
fsim('nuc-fusion', 'Bc', Z1f * Z2f * KEq / (R_(6, 5) * (A1f ** R_(1, 3) + A2f ** R_(1, 3))), deriv=D)
