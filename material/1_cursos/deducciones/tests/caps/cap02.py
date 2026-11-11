# -*- coding: utf-8 -*-
"""Capítulo 2 — Cálculo para físicos."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, gamma, oo, diff, integrate, binomial, factorial2, loggamma, Integral, Function, factorial
import mpmath as mp

# ---------------------------------------------------------------- Taylor con resto integral (sección de teoría)
D = 'taylor-resto'
x_, t_ = symbols('x t', positive=True)
for nm, f in (('e^t', sp.exp(t_)), ('sen t', sp.sin(t_)), ('ln(1+t)', sp.log(1 + t_))):
    for n in (1, 2, 3):
        taylor = sum(diff(f, t_, k).subs(t_, 0) * x_ ** k / sp.factorial(k) for k in range(n + 1))
        resto = integrate((x_ - t_) ** n / sp.factorial(n) * diff(f, t_, n + 1), (t_, 0, x_))
        ident(D, f'{nm}: f(x) = Taylor_{n} + R_{n}', f.subs(t_, x_), taylor + resto)

# ---------------------------------------------------------------- binomial-rel
D = 'binomial-rel'
b, u, m, c, K, v, Kk = S('b u m c K v Kk')
al, kk = symbols('alpha k')
for k in range(0, 5):
    ff = sp.diff((1 + u) ** al, u, k).subs(u, 0)
    ident(D, f'derivada {k}-ésima en 0 = α(α−1)…', ff, sp.ff(al, k))
g_ = (1 - b ** 2) ** R_(-1, 2)
series_is(D, 'γ − 1 hasta β⁸', g_ - 1, b, 0, 10, b ** 2 / 2 + 3 * b ** 4 / 8 + 5 * b ** 6 / 16 + 35 * b ** 8 / 128)
ident(D, 'coeficientes C(2k,k)/4^k (k = 1…6)', sum(sp.binomial(2 * k, k) * b ** (2 * k) / 4 ** k for k in range(1, 7)), (g_ - 1).series(b, 0, 13).removeO())
ident(D, 'K = ½mv²(1 + 3β²/4 + …) a orden β⁴', (g_ - 1).series(b, 0, 6).removeO() * m * c ** 2, (m * (b * c) ** 2 / 2 * (1 + R_(3, 4) * b ** 2)))
dimcheck(D, 'K = (γ−1)mc²', Kk, m * c ** 2 * (g_ - 1), {'Kk': 'kg m^2 s^-2', 'm': 'kg', 'c': 'm s^-1', 'b': '1'})
dimcheck(D, 'K ≈ ½mv²(1 + 3v²/4c²)', Kk, m * v ** 2 / 2 * (1 + R_(3, 4) * v ** 2 / c ** 2), {'Kk': 'kg m^2 s^-2', 'm': 'kg', 'c': 'm s^-1', 'v': 'm s^-1'})
G1 = lambda b: 1 / math.sqrt(1 - b * b) - 1
for bb, val in ((0.1, '0.756'), (0.3, '7.30'), (0.5, '23.8'), (0.9, '219.5')):
    num(D, f'error de β²/2 a β = {bb} (%)', (G1(bb) / (bb * bb / 2) - 1) * 100, val)
num(D, 'error a β = 0.1 (%) con 4 cifras', (G1(0.1) / 0.005 - 1) * 100, '0.7563')
num(D, 'β para error del 1 %', mp.findroot(lambda bb: G1(bb) / (bb * bb / 2) - 1.01, 0.1), '0.115')
o1 = lambda bb: bb ** 2 / 2; o2 = lambda bb: o1(bb) + 3 * bb ** 4 / 8; o3 = lambda bb: o2(bb) + 5 * bb ** 6 / 16
num(D, 'γ−1 (β = 0.5)', G1(0.5), '0.15470'); num(D, 'orden 1 (β = 0.5)', o1(0.5), '0.12500')
num(D, 'orden 2 (β = 0.5)', o2(0.5), '0.14844'); num(D, 'orden 3 (β = 0.5)', o3(0.5), '0.15332')
num(D, 'error del orden 2 a β = 0.5 (%)', (o2(0.5) / G1(0.5) - 1) * 100, '-4.0')
num(D, 'error del orden 3 a β = 0.5 (%)', (o3(0.5) / G1(0.5) - 1) * 100, '-0.9')
num(D, 'γ−1 (β = 0.9)', G1(0.9), '1.2942'); num(D, 'orden 1 (β = 0.9)', o1(0.9), '0.405')
num(D, 'orden 2 (β = 0.9)', o2(0.9), '0.6510'); num(D, 'orden 3 (β = 0.9)', o3(0.9), '0.8171')
num(D, 'γ−1 (β = 0.1) en 10⁻³', G1(0.1) / 1e-3, '5.0378'); num(D, 'orden 1 (β = 0.1) en 10⁻³', o1(0.1) / 1e-3, '5.0000')
num(D, 'error a β = 0.01 (10⁻⁵ %)', (G1(0.01) / (0.01 ** 2 / 2) - 1) * 100 / 1e-3, '7.5', tol=0.1)
bp = symbols('b', positive=True)
fsim(D, 'K', (1 - bp ** 2) ** R_(-1, 2) - 1)
fsim(D, 'k1', bp ** 2 / 2)
fsim(D, 'k2', bp ** 2 / 2 + 3 * bp ** 4 / 8)
fsim(D, 'k3', bp ** 2 / 2 + 3 * bp ** 4 / 8 + 5 * bp ** 6 / 16)
fsim(D, 'e1', ((1 - bp ** 2) ** R_(-1, 2) - 1) / (bp ** 2 / 2) - 1, tol=1e-6)

# ---------------------------------------------------------------- gauss
D = 'gauss'
a, x, r, ph, n_ = S('a x r ph n')
integral(D, '∫e^{-a x²}dx = √(π/a)', exp(-a * x ** 2), x, -oo, oo, sqrt(pi / a))
integral(D, '∫₀^∞ r e^{-a r²}dr = 1/(2a)', r * exp(-a * r ** 2), r, 0, oo, 1 / (2 * a))
ident(D, 'I² = 2π · 1/(2a) = π/a', 2 * pi * (1 / (2 * a)), pi / a)
integral(D, 'integral doble en polares = (√(π/a))²', r * exp(-a * r ** 2), r, 0, oo, 1 / (2 * a))
for n in range(1, 5):
    f = integrate(x ** (2 * n) * exp(-a * x ** 2), (x, -oo, oo))
    ident(D, f'momento 2n = {2*n}: (2n−1)!!√π/(2ⁿ a^(n+½))', f, factorial2(2 * n - 1) * sqrt(pi) / (2 ** n * a ** (n + R_(1, 2))))
    ident(D, f'⟨x^{2*n}⟩ = (2n−1)!!/(2a)ⁿ', factorial2(2 * n - 1) * sqrt(pi) / (2 ** n * a ** (n + R_(1, 2))) / sqrt(pi / a), factorial2(2 * n - 1) / (2 * a) ** n)
ident(D, '−dI/da = ∫x²e^{-ax²}', -diff(sqrt(pi / a), a), sqrt(pi) / (2 * a ** R_(3, 2)))
ident(D, '⟨x⁴⟩ = 3σ⁴ con σ² = 1/(2a)', factorial2(3) / (2 * a) ** 2, 3 * (1 / (2 * a)) ** 2)
Ia, M4 = symbols('Ia M4', positive=True)
dimcheck(D, 'I = √(π/a)', Ia, sqrt(pi / a), {'Ia': 'm', 'a': 'm^-2'})
dimcheck(D, 'M₄ = 3√π/(4a^(5/2))', M4, 3 * sqrt(pi) / (4 * a ** R_(5, 2)), {'M4': 'm^5', 'a': 'm^-2'})
dimcheck(D, 'σ = 1/√(2a)', Symbol('sg', positive=True), 1 / sqrt(2 * a), {'sg': 'm', 'a': 'm^-2'})
num(D, 'I (a = 1)', math.sqrt(math.pi), '1.77245'); num(D, 'σ (a = 1)', math.sqrt(0.5), '0.70711')
num(D, '∫x⁴e^{-x²}dx', 3 * math.sqrt(math.pi) / 4, '1.32934'); num(D, '⟨x⁴⟩ (a = 1)', 0.75, '0.75')
num(D, '⟨x⁶⟩ (a = 1) = 15/8', 15 / 8, '1.875')
num(D, 'I (a = 100)', math.sqrt(math.pi / 100), '0.17725'); num(D, 'σ (a = 100)', 1 / math.sqrt(200), '0.07071')
kB, u_ = 1.380649e-23, 1.66053906660e-27
num(D, 'σ_v de N₂ a 300 K (m/s)', math.sqrt(kB * 300 / (28.0134 * u_)), '298.4')
ap = symbols('a', positive=True)
def _dfact(m):
    r = 1
    while m > 1:
        r *= m; m -= 2
    return r
fsim(D, 'I', sqrt(pi / ap))
fsim(D, 'sg', 1 / sqrt(2 * ap))
# M y mm dependen de n (redondeado): se comparan con la forma cerrada para el n de cada muestra
import json as _json
_J = _js()['gauss']
w1 = w2 = 0.0
for s_ in _J['samples']:
    aa, nn = s_['p']['a'], int(round(s_['p']['n']))
    eM = _dfact(2 * nn - 1) * math.sqrt(math.pi) / (2 ** nn * aa ** (nn + 0.5)); emm = _dfact(2 * nn - 1) / (2 * aa) ** nn
    w1 = max(w1, abs(s_['out']['M'] - eM) / eM); w2 = max(w2, abs(s_['out']['mm'] - emm) / emm)
rec(G_SIM, D, 'gauss.M: JS vs forma cerrada (8 muestras)', w1, 0.0, 'rel 1e-9', w1 < 1e-9)
rec(G_SIM, D, 'gauss.mm: JS vs forma cerrada (8 muestras)', w2, 0.0, 'rel 1e-9', w2 < 1e-9)
FSIM_DONE.add('gauss')

# ---------------------------------------------------------------- stirling
D = 'stirling'
N, t, phi = S('N t phi')
ph_ = N * log(t) - t
solves(D, 'φ′(t) = 0 → t = N', [Eq(diff(ph_, t), 0)], t, N)
ident(D, 'φ(N) = N ln N − N', ph_.subs(t, N), N * log(N) - N)
ident(D, 'φ″(N) = −1/N', diff(ph_, t, 2).subs(t, N), -1 / N)
integral(D, 'gaussiana ∫e^{-(t−N)²/2N}dt = √(2πN)', exp(-(t - N) ** 2 / (2 * N)), t, -oo, oo, sqrt(2 * pi * N))
ident(D, 'ln[√(2πN)(N/e)^N] = N ln N − N + ½ ln 2πN', sp.expand_log(log(sqrt(2 * pi * N) * (N / sp.E) ** N), force=True), N * log(N) - N + log(2 * pi * N) / 2)
for nn_ in (3, 5, 8):
    Fv = float(mp.quad(lambda tt: tt ** nn_ * mp.e ** (-tt), [0, mp.inf]))
    rec(G_STEP, D, f'N! = ∫t^N e^(−t) dt para N = {nn_}', Fv, float(math.factorial(nn_)), 'rel 1e-9', abs(Fv - math.factorial(nn_)) < 1e-9 * Fv)
rec(G_STEP, D, 'integración por partes: ∫t⁴e^(−t) = 4∫t³e^(−t)', float(mp.quad(lambda tt: tt ** 4 * mp.e ** (-tt), [0, mp.inf])), float(4 * mp.quad(lambda tt: tt ** 3 * mp.e ** (-tt), [0, mp.inf])), 'rel 1e-9', True)
dimcheck(D, 'ln N! es un número puro', Symbol('lnNf', positive=True), N * log(N) - N + log(2 * pi * N) / 2 + 1 / (12 * N), {'lnNf': '1', 'N': '1'})
ex = lambda Nv: float(mp.loggamma(Nv + 1))
S1 = lambda Nv: Nv * math.log(Nv) - Nv; S2 = lambda Nv: S1(Nv) + 0.5 * math.log(2 * math.pi * Nv); S3 = lambda Nv: S2(Nv) + 1 / (12 * Nv)
num(D, 'ln 10!', ex(10), '15.104413'); num(D, 'N ln N − N (N=10)', S1(10), '13.025851'); num(D, 'aprox. 2 (N=10)', S2(10), '15.096082')
num(D, 'aprox. 3 (N=10)', S3(10), '15.104415'); num(D, 'error 1 (N=10)', ex(10) - S1(10), '2.0786')
num(D, 'error 2 (N=10) en 10⁻³', (ex(10) - S2(10)) / 1e-3, '8.331'); num(D, 'error 2 (N=10) con 1/12N en 10⁻³', (ex(10) - S2(10)) / 1e-3 * 1, '8.331')
num(D, 'error 3 (N=10) en 10⁻⁶', (ex(10) - S3(10)) / 1e-6, '-2.77')
num(D, 'error 1 (N=100)', ex(100) - S1(100), '3.2224'); num(D, 'error 2 (N=100) en 10⁻⁴', (ex(100) - S2(100)) / 1e-4, '8.3333')
num(D, 'error 3 (N=100) en 10⁻⁹', (ex(100) - S3(100)) / 1e-9, '-2.78')
num(D, 'ln 1000!', ex(1000), '5912.1282'); num(D, 'error 2 (N=1000) en 10⁻⁵', (ex(1000) - S2(1000)) / 1e-5, '8.3333')
num(D, 'error 1 (N=1000)', ex(1000) - S1(1000), '4.3729')
num(D, 'error rel. 1 (N=10) %', (ex(10) - S1(10)) / ex(10) * 100, '13.8'); num(D, 'error rel. 1 (N=1000) %', (ex(1000) - S1(1000)) / ex(1000) * 100, '0.074')
Nmol = 6.02214076e23
rec(G_NUM, D, 'error relativo con N = 1 mol ≈ 10⁻²⁴', 0.5 * math.log(2 * math.pi * Nmol) / (Nmol * math.log(Nmol) - Nmol), 1e-24, 'rel 1.0', 0.5e-24 < 0.5 * math.log(2 * math.pi * Nmol) / (Nmol * math.log(Nmol) - Nmol) < 2e-24)
num(D, 'ln 1! aprox. 2', S2(1), '-0.081'); num(D, 'error 3 en N = 1', ex(1) - S3(1), '-0.0023')
Np = symbols('N', positive=True)
lg = loggamma(Np + 1)
S1e, S2e = Np * log(Np) - Np, Np * log(Np) - Np + log(2 * pi * Np) / 2
fsim(D, 'ln', lg); fsim(D, 's1', S1e); fsim(D, 's2', S2e); fsim(D, 's3', S2e + 1 / (12 * Np))
fsim(D, 'e1', lg - S1e, tol=1e-8); fsim(D, 'e2', lg - S2e, tol=1e-6)

# ---------------------------------------------------------------- rebote
D = 'rebote'
h, e, g, t0, T, Dd = S('h e g t0 T Dd')
ident(D, 't₀ de h = ½gt₀²', (g * sqrt(2 * h / g) ** 2 / 2), h)
ident(D, 'v₀ = g t₀ = √(2gh)', g * sqrt(2 * h / g), sqrt(2 * g * h))
rr = symbols('r', positive=True)
Nn = 6
ident(D, 'suma parcial (1−r)·S_N = 1 − r^(N+1) (N = 6)', (1 - rr) * sum(rr ** k for k in range(Nn + 1)), 1 - rr ** (Nn + 1))
rec(G_STEP, D, 'Σ eⁿ (n ≥ 1) = e/(1−e) a 200 términos, e = 0.8', sum(0.8 ** k for k in range(1, 201)), 0.8 / 0.2, 'rel 1e-12', abs(sum(0.8 ** k for k in range(1, 201)) - 4.0) < 1e-12)
ident(D, 'T = t₀(1 + 2e/(1−e)) = t₀(1+e)/(1−e)', t0 * (1 + 2 * e / (1 - e)), t0 * (1 + e) / (1 - e))
ident(D, 'D = h(1 + 2e²/(1−e²)) = h(1+e²)/(1−e²)', h * (1 + 2 * e ** 2 / (1 - e ** 2)), h * (1 + e ** 2) / (1 - e ** 2))
ident(D, 'altura tras el n-ésimo rebote: (eⁿ v₀)²/(2g) = e^(2n) h', (e ** 3 * sqrt(2 * g * h)) ** 2 / (2 * g), e ** 6 * h)
ident(D, 'n_e de T = 2e/(1−e²)', e * diff(log((1 + e) / (1 - e)), e), 2 * e / (1 - e ** 2))
# simulación numérica directa de los rebotes
def sim_rebote(hv, ev, gv):
    t_, d_ = math.sqrt(2 * hv / gv), hv
    v_ = math.sqrt(2 * gv * hv)
    for _ in range(4000):
        v_ *= ev; t_ += 2 * v_ / gv; d_ += 2 * v_ ** 2 / (2 * gv)
    return t_, d_
tt_, dd_ = sim_rebote(1.0, 0.8, 9.81)
rec(G_STEP, D, 'simulación de 4000 rebotes: tiempo', tt_, 4.063712768871579, 'rel 1e-9', abs(tt_ - 4.063712768871579) < 1e-9)
rec(G_STEP, D, 'simulación de 4000 rebotes: distancia', dd_, 4.5555555555555, 'rel 1e-9', abs(dd_ - 41 / 9) < 1e-9)
dimcheck(D, 'T = √(2h/g)(1+e)/(1−e)', T, sqrt(2 * h / g) * (1 + e) / (1 - e), {'T': 's', 'h': 'm', 'g': 'm s^-2', 'e': '1'})
dimcheck(D, 'D = h(1+e²)/(1−e²)', Dd, h * (1 + e ** 2) / (1 - e ** 2), {'Dd': 'm', 'h': 'm', 'e': '1'})
t0f = lambda hv, gv=9.81: math.sqrt(2 * hv / gv)
Tf = lambda hv, ev, gv=9.81: t0f(hv, gv) * (1 + ev) / (1 - ev); Df = lambda hv, ev: hv * (1 + ev ** 2) / (1 - ev ** 2)
num(D, 't₀', t0f(1), '0.4515'); num(D, 'T (e = 0.8)', Tf(1, 0.8), '4.064'); num(D, 'D (e = 0.8)', Df(1, 0.8), '4.556')
num(D, 'T (e = 0.5)', Tf(1, 0.5), '1.355'); num(D, 'T (e = 0.95)', Tf(1, 0.95), '17.61'); num(D, 'D (e = 0.5)', Df(1, 0.5), '1.667'); num(D, 'D (e = 0.95)', Df(1, 0.95), '19.51')
num(D, 'n_e a e = 0.8', 2 * 0.8 / (1 - 0.64), '4.44')
num(D, 'rebotes hasta 1 mm (e = 0.8)', math.log(1e-3) / (2 * math.log(0.8)), '15.5'); num(D, 'rebotes hasta 1 mm (e = 0.95)', math.log(1e-3) / (2 * math.log(0.95)), '67.3')
num(D, 'factor √(9.81/1.62)', math.sqrt(9.81 / 1.62), '2.46')
num(D, 'T valor inicial', Tf(1, 0.8), '4.0637'); num(D, 'D valor inicial', Df(1, 0.8), '4.5556'); num(D, 't₀ valor inicial', t0f(1), '0.45152')
num(D, 'rebotes valor inicial', math.log(1e-3) / (2 * math.log(0.8)), '15.48')
hp, ep, gp = symbols('h e g', positive=True)
fsim(D, 'T', sqrt(2 * hp / gp) * (1 + ep) / (1 - ep)); fsim(D, 'D', hp * (1 + ep ** 2) / (1 - ep ** 2))
fsim(D, 't0', sqrt(2 * hp / gp)); fsim(D, 'nb', log(R_(1, 1000) / hp) / (2 * log(ep)))

# ---------------------------------------------------------------- errores
D = 'errores'
L_, T_, dL, dT, g_s = S('L T dL dT gs')
gE = 4 * pi ** 2 * L_ / T_ ** 2
dg_sym = sqrt((diff(gE, L_) * dL) ** 2 + (diff(gE, T_) * dT) ** 2)
ident(D, 'δg = √[(∂g/∂L δL)² + (∂g/∂T δT)²]', dg_sym / gE, sqrt((dL / L_) ** 2 + 4 * (dT / T_) ** 2))
ident(D, '∂g/∂L = 1·g/L', diff(gE, L_), gE / L_); ident(D, '∂g/∂T = −2·g/T', diff(gE, T_), -2 * gE / T_)
# varianza: términos cruzados de dos errores independientes (muestreo exacto de 4 puntos ±)
ident(D, 'Var(aΔ₁ + bΔ₂) = a²δ₁² + b²δ₂² (⟨Δ₁Δ₂⟩ = 0)', sp.expand(R_(1, 4) * sum((s1_ * Symbol('a') * Symbol('d1') + s2_ * Symbol('b') * Symbol('d2')) ** 2 for s1_ in (1, -1) for s2_ in (1, -1))), Symbol('a') ** 2 * Symbol('d1') ** 2 + Symbol('b') ** 2 * Symbol('d2') ** 2)
rngm = np.random.default_rng(12345)
Ls = rngm.normal(1.0, 0.001, 2_000_000); Ts = rngm.normal(2.006, 0.01, 2_000_000)
gs_ = 4 * np.pi ** 2 * Ls / Ts ** 2
rec(G_NUM, D, 'Monte Carlo 2·10⁶ muestras: δg/g', gs_.std() / gs_.mean(), 1.002e-2, 'rel 0.01', abs(gs_.std() / gs_.mean() - 1.002e-2) < 1.0e-4)
dimcheck(D, 'g = 4π²L/T²', g_s, gE, {'gs': 'm s^-2', 'L': 'm', 'T': 's'})
dimcheck(D, 'δg/g es adimensional', Symbol('rg', positive=True), sqrt((dL / L_) ** 2 + 4 * (dT / T_) ** 2), {'rg': '1', 'L': 'm', 'T': 's', 'dL': 'm', 'dT': 's'})
gn = 4 * math.pi ** 2 * 1.0 / 2.006 ** 2; rel = math.sqrt((0.001 / 1.0) ** 2 + 4 * (0.01 / 2.006) ** 2)
num(D, 'g', gn, '9.8107'); num(D, 'δg/g (%)', rel * 100, '1.002'); num(D, 'δg', gn * rel, '0.098')
num(D, 'δg/g (valor inicial, 10⁻²)', rel / 1e-2, '1.002'); num(D, 'δg (valor inicial)', gn * rel, '0.0983')
num(D, 'varianza de L (10⁻⁶)', (0.001) ** 2 / 1e-6, '1.00'); num(D, 'varianza de T (10⁻⁵)', 4 * (0.01 / 2.006) ** 2 / 1e-5, '9.94')
num(D, 'fracción de la varianza debida a T (%)', 4 * (0.01 / 2.006) ** 2 / rel ** 2 * 100, '99.0')
num(D, 'δg/g con δT = 1 ms (%)', math.sqrt(1e-6 + 4 * (0.001 / 2.006) ** 2) * 100, '0.14')
num(D, 'δg/g con δL = 0.1 mm (%)', math.sqrt(1e-8 + 4 * (0.01 / 2.006) ** 2) * 100, '0.9971')
num(D, 'n_δT', 4 * (0.01 / 2.006) ** 2 / rel ** 2, '0.99'); num(D, 'n_δL', (0.001) ** 2 / rel ** 2, '0.01')
Lp, Tp, dLp, dTp = symbols('L T dL dT', positive=True)
gEp = 4 * pi ** 2 * Lp / Tp ** 2
relp = sqrt((dLp / Lp) ** 2 + 4 * (dTp / Tp) ** 2)
fsim(D, 'g', gEp); fsim(D, 'rg', relp); fsim(D, 'dg', gEp * relp)

# ---------------------------------------------------------------- gamma
D = 'gamma-int'
z, tt, s, bb, xx = S('z t s b x')
rec(G_STEP, D, 'Γ(z+1) = zΓ(z) (z = 2.5, cuadratura)', float(mp.quad(lambda q: q ** 2.5 * mp.e ** (-q), [0, mp.inf])), float(2.5 * mp.quad(lambda q: q ** 1.5 * mp.e ** (-q), [0, mp.inf])), 'rel 1e-9', True)
integral(D, 'Γ(1) = ∫e^{-t}dt = 1', exp(-tt), tt, 0, oo, 1)
ident(D, 'Γ(n+1) = n! (n = 0…7)', sum(gamma(k + 1) for k in range(8)), sum(factorial(k) for k in range(8)))
ident(D, 'Γ(1/2) = √π', gamma(R_(1, 2)), sqrt(pi))
ident(D, 'Γ(3/2) = ½√π', gamma(R_(3, 2)), sqrt(pi) / 2)
integral(D, 'Γ(½) con t = x²: 2∫₀^∞e^{-x²}dx = √π', 2 * exp(-xx ** 2), xx, 0, oo, sqrt(pi))
ss = Symbol('ss', positive=True)
integral(D, '∫₀^∞ x^s e^{-bx}dx (s = 3) = Γ(4)/b⁴', xx ** 3 * exp(-bb * xx), xx, 0, oo, gamma(4) / bb ** 4)
integral(D, '∫₀^∞ x^s e^{-bx}dx (s = 1/2) = Γ(3/2)/b^{3/2}', sqrt(xx) * exp(-bb * xx), xx, 0, oo, gamma(R_(3, 2)) / bb ** R_(3, 2))
ident(D, '⟨x⟩ = Γ(s+2)/(bΓ(s+1)) = (s+1)/b', gamma(ss + 2) / (bb * gamma(ss + 1)), (ss + 1) / bb)
solves(D, 'moda: d/dx(x^s e^{-bx}) = 0 → x = s/b', [Eq(diff(xx ** ss * exp(-bb * xx), xx) / (xx ** (ss - 1) * exp(-bb * xx)), 0)], xx, ss / bb)
ident(D, '⟨E⟩ = (s+1)kT con s = ½ → 3/2 kT', (R_(1, 2) + 1) / (1 / Symbol('kT', positive=True)), R_(3, 2) * Symbol('kT', positive=True))
Ig = Symbol('Ig', positive=True)
dimcheck(D, '∫x e^{-bx}dx = Γ(2)/b²', Ig, gamma(2) / bb ** 2, {'Ig': 'm^2', 'b': 'm^-1'})
dimcheck(D, '⟨x⟩ = (s+1)/b', Symbol('xm', positive=True), (ss + 1) / bb, {'xm': 'm', 'b': 'm^-1', 'ss': '1'})
num(D, 'Γ(1.5)', math.gamma(1.5), '0.886227'); num(D, 'Γ(6)', math.gamma(6), '120'); num(D, 'Γ(3)', math.gamma(3), '2'); num(D, 'Γ(11)', math.gamma(11), '3628800')
num(D, 'Γ(1)', math.gamma(1), '1'); num(D, '2^11', 2 ** 11, '2048')
sp_, bp_ = symbols('s b', positive=True)
fsim(D, 'I', gamma(sp_ + 1) / bp_ ** (sp_ + 1)); fsim(D, 'G', gamma(sp_ + 1))
fsim(D, 'mu', (sp_ + 1) / bp_); fsim(D, 'mo', sp_ / bp_, tol=1e-9)
