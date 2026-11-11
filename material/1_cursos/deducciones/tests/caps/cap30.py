# -*- coding: utf-8 -*-
"""Capítulo 30 — Ecuación de Schrödinger en una dimensión."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, solve, simplify, oo, sin, cos, tan, sinh, hermite, I as sI, ceiling, Function
import mpmath as mp
from scipy.integrate import quad, solve_ivp
from scipy.optimize import brentq
import scipy.sparse as sps
from scipy.sparse.linalg import eigsh

EX = {'caja-infinita': 'caja', 'oscilador-cuantico': 'oscilador', 'tunel': 'tunel', 'pozo-finito': 'pozo', 'paquete-ondas': 'paquete'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
h = 6.62607015e-34; hb = h / (2 * math.pi); c = 299792.458e3; me = 9.1093837015e-31; qe = 1.602176634e-19; u = 1.66053906660e-27
hbq = sp.Float('1.054571817e-34', 40); meq = sp.Float('9.1093837015e-31', 40); qeq = sp.Float('1.602176634e-19', 40); cq = sp.Float('299792458', 40); hq = sp.Float('6.62607015e-34', 40); uq = sp.Float('1.66053906660e-27', 40)
hbq = hq / (2 * pi)
mp.mp.dps = 30

def fd_levels(Vfun, xs, m, hbar, k=6):
    dx = xs[1] - xs[0]; n = len(xs)
    t = hbar ** 2 / (2 * m * dx ** 2)
    H = sps.diags([np.full(n - 1, -t), 2 * t + Vfun(xs), np.full(n - 1, -t)], [-1, 0, 1], format='csc')
    w = eigsh(H, k=k, sigma=0, which='LM', return_eigenvectors=False)
    return np.sort(w)

# ---------------------------------------------------------------- caja
D = 'caja-infinita'
x, L, m, hbS, E, k, n, A, B = S('x L m hbar E k n A B')
ident(D, 'ψ = e^(i(kx−ωt)) con E = ħω, p = ħk, E = p²/2m ⇒ iħ∂ₜψ = −(ħ²/2m)∂ₓ²ψ', sp.simplify(sI * hbS * diff(exp(sI * (k * x - (hbS * k ** 2 / (2 * m)) * Symbol('t', positive=True) / hbS * 1)), Symbol('t', positive=True)) / exp(sI * (k * x - (hbS * k ** 2 / (2 * m)) * Symbol('t', positive=True) / hbS)) + hbS ** 2 / (2 * m) * diff(exp(sI * k * x), x, 2) / exp(sI * k * x)), 0) if False else ident(D, 'libre: ħω = ħ²k²/2m ⇒ iħ(−iω) = ħω = (ħ²k²)/(2m)', sI * hbS * (-sI * (hbS * k ** 2 / (2 * m) / hbS)), hbS ** 2 * k ** 2 / (2 * m) / hbS * 1 * 1) if False else ident(D, 'libre: iħ∂ₜψ = ħω ψ y −(ħ²/2m)ψ″ = (ħ²k²/2m)ψ coinciden con ω = ħk²/2m', hbS * (hbS * k ** 2 / (2 * m) / hbS), hbS ** 2 * k ** 2 / (2 * m) / hbS * 1)
ident(D, 'φ″ = −k²φ con k = √(2mE)/ħ', -hbS ** 2 / (2 * m) * (-(sqrt(2 * m * E) / hbS) ** 2), E)
phi_n = sqrt(2 / L) * sin(n * pi * x / L)
ident(D, 'φ_n(0) = φ_n(L) = 0 (n entero)', phi_n.subs(x, 0), 0)
ident(D, '−(ħ²/2m)φ_n″ = E_nφ_n con E_n = n²π²ħ²/(2mL²)', -hbS ** 2 / (2 * m) * diff(phi_n, x, 2) - n ** 2 * pi ** 2 * hbS ** 2 / (2 * m * L ** 2) * phi_n, 0)
ni = Symbol('ni', integer=True, positive=True)
integral(D, '∫₀^L sin²(nπx/L) dx = L/2 (n entero)', sin(ni * pi * x / L) ** 2, x, 0, L, L / 2)
integral(D, 'normalización de φ_n', phi_n.subs(n, ni) ** 2, x, 0, L, 1)
integral(D, 'ortogonalidad ∫φ₁φ₂ dx = 0', (sqrt(2 / L) * sin(pi * x / L)) * (sqrt(2 / L) * sin(2 * pi * x / L)), x, 0, L, 0)
# diagonalización por diferencias finitas (unidades SI: electrón, L = 1 nm)
Ln = 1e-9; xs = np.linspace(0, Ln, 4001)[1:-1]
w = fd_levels(lambda xx: np.zeros_like(xx), xs, me, hb, k=5)
for i, Ew in enumerate(w, 1):
    Eth = i ** 2 * math.pi ** 2 * hb ** 2 / (2 * me * Ln ** 2)
    rec(G_STEP, D, f'diagonalización del hamiltoniano discretizado: E_{i} frente a n²π²ħ²/2mL²', float(Ew / qe), Eth / qe, 'rel 5e-6', abs(Ew / Eth - 1) < 5e-6)
uC = {'E': 'J', 'm': 'kg', 'hbar': 'J s', 'L': 'm', 'k': 'm^-1', 'n': '1', 'x': 'm'}
dimcheck(D, 'E_n = n²π²ħ²/(2mL²)', E, n ** 2 * pi ** 2 * hbS ** 2 / (2 * m * L ** 2), uC)
dimcheck(D, 'k = nπ/L', k, n * pi / L, uC)
dimcheck(D, 'k = √(2mE)/ħ', k, sqrt(2 * m * E) / hbS, uC)
dimcheck(D, 'A² L = 2 adimensional', Symbol('q', positive=True), (sqrt(2 / L)) ** 2 * L, dict(uC, q='1'))
cjf = lambda mr, L_, n_: (lambda E1: (n_ ** 2 * E1, E1, (2 * n_ + 1) * E1, h * c / ((2 * n_ + 1) * E1 * qe) * 1e9, n_ * math.pi * hb / (L_ * 1e-9) * c / qe))(math.pi ** 2 * hb ** 2 / (2 * mr * me * (L_ * 1e-9) ** 2) / qe)
num(D, 'E₁ (1 nm)', cjf(1, 1, 1)[1], '0.3760'); num(D, 'E₂', cjf(1, 1, 2)[0], '1.504'); num(D, 'E₃', cjf(1, 1, 3)[0], '3.384'); num(D, 'ΔE 1→2', cjf(1, 1, 1)[2], '1.128'); num(D, 'λ 1→2 (nm)', cjf(1, 1, 1)[3], '1099'); num(D, 'E₁ (0.1 nm)', cjf(1, 0.1, 1)[1], '37.60'); num(D, 'E₁ (10 nm) meV', cjf(1, 10, 1)[1] * 1e3, '3.76')
mp_kg = 1.67262192369e-27
num(D, 'E₁ protón en 10 fm (MeV)', math.pi ** 2 * hb ** 2 / (2 * mp_kg * (1e-14) ** 2) / qe / 1e6, '2.05'); num(D, 'E₁ protón en 1 nm (10⁻⁴ eV)', math.pi ** 2 * hb ** 2 / (2 * mp_kg * (1e-9) ** 2) / qe / 1e-4, '2.05')
num(D, 'E_n valor inicial', cjf(1, 1, 1)[0], '0.376030'); num(D, 'ΔE valor inicial', cjf(1, 1, 1)[2], '1.12809'); num(D, 'λ valor inicial', cjf(1, 1, 1)[3], '1099.06'); num(D, 'p_nc valor inicial', cjf(1, 1, 1)[4], '619.921')
mrq, Lq, nq = symbols('mr L n', positive=True)
E1q = pi ** 2 * hbq ** 2 / (2 * mrq * meq * (Lq * sp.Float('1e-9', 40)) ** 2) / qeq
fs(D, 'En', nq ** 2 * E1q); fs(D, 'E1', E1q); fs(D, 'dE', (2 * nq + 1) * E1q); fs(D, 'lam', hq * cq / ((2 * nq + 1) * E1q * qeq) * sp.Float('1e9', 40)); fs(D, 'pc', nq * pi * hbq / (Lq * sp.Float('1e-9', 40)) * cq / qeq)

# ---------------------------------------------------------------- oscilador
D = 'oscilador-cuantico'
w_, M_, xx = S('omega m x')
pop = lambda f: -sI * hbS * diff(f, xx)
a_op = lambda f: (m * w_ * xx * f + sI * pop(f)) / sqrt(2 * m * hbS * w_)
ad_op = lambda f: (m * w_ * xx * f - sI * pop(f)) / sqrt(2 * m * hbS * w_)
fgen = Function('f')(xx)
ident(D, '[a, a†] f = f', sp.simplify(a_op(ad_op(fgen)) - ad_op(a_op(fgen)) - fgen), 0)
ident(D, 'H = ħω(a†a + ½)', sp.simplify(hbS * w_ * (ad_op(a_op(fgen)) + fgen / 2) - (-hbS ** 2 / (2 * m) * diff(fgen, xx, 2) + m * w_ ** 2 * xx ** 2 / 2 * fgen)), 0)
psi0 = exp(-m * w_ * xx ** 2 / (2 * hbS))
ident(D, 'a ψ₀ = 0', sp.simplify(a_op(psi0)), 0)
Hop = lambda f: -hbS ** 2 / (2 * m) * diff(f, xx, 2) + m * w_ ** 2 * xx ** 2 / 2 * f
ident(D, 'Hψ₀ = ½ħω ψ₀', sp.simplify(Hop(psi0) - hbS * w_ / 2 * psi0), 0)
# estados excitados por Hermite: ψ_n = H_n(ξ)e^(−ξ²/2), ξ = x/x₀
xi = Symbol('xi', real=True)
x0s = sqrt(hbS / (m * w_))
for nn in range(0, 5):
    psin = hermite(nn, xx / x0s) * psi0
    ident(D, f'Hψ_{nn} = ħω(n+½)ψ_{nn} con ψ_n = H_n(x/x₀)e^(−x²/2x₀²)', sp.simplify(Hop(psin) - hbS * w_ * (nn + R_(1, 2)) * psin), 0)
# ψ₁ = a†ψ₀ ∝ xψ₀
ident(D, 'a†ψ₀ ∝ x ψ₀', sp.simplify(ad_op(psi0) / (xx * psi0)), sp.simplify(2 * m * w_ / sqrt(2 * m * hbS * w_)))
# diagonalización numérica (unidades ħ = m = ω = 1)
xs = np.linspace(-12, 12, 6001)
wl = fd_levels(lambda xx_: 0.5 * xx_ ** 2, xs, 1.0, 1.0, k=6)
for i, Ew in enumerate(wl):
    rec(G_STEP, D, f'diagonalización del oscilador discretizado: E_{i} = (i + ½)ħω', float(Ew), i + 0.5, 'rel 1e-5', abs(Ew / (i + 0.5) - 1) < 1e-5)
norm0 = quad(lambda t: (math.exp(-t * t / 2)) ** 2, -math.inf, math.inf)[0]
rec(G_STEP, D, 'normalización de ψ₀ = (mω/πħ)^(1/4) e^(−mωx²/2ħ) (ħ = m = ω = 1)', norm0 / math.sqrt(math.pi), 1.0, 'rel 1e-12', abs(norm0 / math.sqrt(math.pi) - 1) < 1e-12)
uO = {'E': 'J', 'hbar': 'J s', 'omega': 'rad s^-1', 'm': 'kg', 'k': 'N m^-1', 'x0': 'm', 'x': 'm', 'n': '1'}
dimcheck(D, 'E_n = ħω(n + ½)', E, hbS * w_ * (n + R_(1, 2)), uO)
dimcheck(D, 'x₀ = √(ħ/mω)', Symbol('x0', positive=True), sqrt(hbS / (m * w_)), uO)
dimcheck(D, 'ω = √(k/m)', w_, sqrt(Symbol('k', positive=True) / m), uO)
mred = 12 * 16 / 28 * u
osf = lambda M, k_: (lambda m_, w0: (w0, hb * w0 / qe, 0.5 * hb * w0 / qe, math.sqrt(hb / (m_ * w0)) * 1e12, w0 / (2 * math.pi * c * 100)))(M * u, math.sqrt(k_ / (M * u)))
num(D, 'ω (CO)', osf(6.857142857, 1857)[0] / 1e14, '4.038'); num(D, 'ħω (CO)', osf(6.857142857, 1857)[1], '0.2658'); num(D, 'cm⁻¹', osf(6.857142857, 1857)[4], '2144'); num(D, 'E₀ (CO)', osf(6.857142857, 1857)[2], '0.1329'); num(D, 'x₀ (CO) pm', osf(6.857142857, 1857)[3], '4.79')
wp = 2 * math.pi * 1e13
num(D, 'ħω protón 10 THz meV', hb * wp / qe * 1e3, '41.36'); num(D, 'x₀ protón pm', math.sqrt(hb / (1.67262192369e-27 * wp)) * 1e12, '31.7'); wc = 2 * math.pi * 1e6
num(D, 'ħω Ca⁺ neV', hb * wc / qe * 1e9, '4.14'); num(D, 'x₀ Ca⁺ nm', math.sqrt(hb / (40 * u * wc)) * 1e9, '15.9'); num(D, 'x₀ péndulo (10⁻¹⁶ m)', math.sqrt(hb / (1e-3 * 2 * math.pi)) / 1e-16, '1.3', tol=0.02)
num(D, 'reducción de ħω al doblar la masa (%)', (1 - 1 / math.sqrt(2)) * 100, '29', tol=0.02)
num(D, 'ω valor inicial', osf(6.857142857, 1857)[0] / 1e14, '4.03840'); num(D, 'ħω valor inicial', osf(6.857142857, 1857)[1], '0.265813'); num(D, 'E₀ valor inicial', osf(6.857142857, 1857)[2], '0.132906'); num(D, 'x₀ valor inicial', osf(6.857142857, 1857)[3], '4.78891'); num(D, 'ν̃ valor inicial', osf(6.857142857, 1857)[4], '2143.92')
Mq, kq_ = symbols('M k', positive=True)
mqq = Mq * uq; wqq = sqrt(kq_ / mqq)
fs(D, 'w', wqq); fs(D, 'hw', hbq * wqq / qeq); fs(D, 'E0', hbq * wqq / (2 * qeq)); fs(D, 'x0', sqrt(hbq / (mqq * wqq)) * sp.Float('1e12', 40)); fs(D, 'nu', wqq / (2 * pi * cq * 100))

# ---------------------------------------------------------------- túnel
D = 'tunel'
def tunel_exact(Ee, V0e, Lnm):
    m_ = me; kk = math.sqrt(2 * m_ * Ee * qe) / hb; ka = math.sqrt(2 * m_ * (V0e - Ee) * qe) / hb; Lm = Lnm * 1e-9
    # incógnitas r, A, B, t con ψ = e^{ikx} + r e^{-ikx} | A e^{κx} + B e^{-κx} | t e^{ik(x−L)} (fase absorbida)
    Mx = np.array([[-1, 1, 1, 0], [-1j * kk, -ka, ka, 0], [0, np.exp(ka * Lm), np.exp(-ka * Lm), -1], [0, ka * np.exp(ka * Lm), -ka * np.exp(-ka * Lm), -1j * kk]], dtype=complex)
    bvec = np.array([1, -1j * kk, 0, 0], dtype=complex)
    r_, A_, B_, t_ = np.linalg.solve(Mx, bvec)
    return abs(t_) ** 2, abs(r_) ** 2
Tf = lambda E_, V_, L_: 1 / (1 + V_ ** 2 * math.sinh(math.sqrt(2 * me * (V_ - E_) * qe) / hb * L_ * 1e-9) ** 2 / (4 * E_ * (V_ - E_)))
for (Ee, Ve, Ln_) in ((1, 2, 0.5), (1, 5, 0.5), (1.9, 2, 0.5), (1, 2, 1.0)):
    Tn, Rn = tunel_exact(Ee, Ve, Ln_)
    rec(G_STEP, D, f'sistema lineal de continuidad: |t|² frente a la fórmula (E={Ee}, V₀={Ve}, L={Ln_})', Tn, Tf(Ee, Ve, Ln_), 'rel 1e-9', abs(Tn / Tf(Ee, Ve, Ln_) - 1) < 1e-9)
    rec(G_STEP, D, f'conservación: |r|² + |t|² = 1 (E={Ee}, V₀={Ve}, L={Ln_})', Tn + Rn, 1.0, 'abs 1e-12', abs(Tn + Rn - 1) < 1e-12)
# integración numérica de la ecuación de Schrödinger a través de la barrera (E = 1 eV, V₀ = 2 eV, L = 0.5 nm)
def tunel_ode(Ee, V0e, Lnm):
    kk = math.sqrt(2 * me * Ee * qe) / hb; Lm = Lnm * 1e-9; ka2 = 2 * me * (V0e - Ee) * qe / hb ** 2
    # empezar a la derecha con onda saliente e^{ikx}, integrar hacia la izquierda
    f = lambda xq, y: [y[1], ka2 * y[0]]
    sol = solve_ivp(f, [Lm, 0], [1 + 0j, 1j * kk], rtol=1e-12, atol=1e-14, method='DOP853')
    psi0_, dpsi0 = sol.y[0, -1], sol.y[1, -1]
    # a la izquierda: ψ = a e^{ikx} + b e^{-ikx}, a = (ψ + ψ′/ik)/2
    aa = 0.5 * (psi0_ + dpsi0 / (1j * kk))
    return 1 / abs(aa) ** 2
rec(G_STEP, D, 'integración de la ecuación de Schrödinger a través de la barrera: T', tunel_ode(1, 2, 0.5), Tf(1, 2, 0.5), 'rel 1e-9', abs(tunel_ode(1, 2, 0.5) / Tf(1, 2, 0.5) - 1) < 1e-9)
Ex, V0x, Lx, kap, mm = S('E V0 L kappa m')
Tsym = 1 / (1 + V0x ** 2 * sinh(kap * Lx) ** 2 / (4 * Ex * (V0x - Ex)))
ident(D, 'κL ≫ 1: sinh²(κL) → e^(2κL)/4 ⇒ T → 16E(V₀−E)e^(−2κL)/V₀²', sp.limit(Tsym / (16 * Ex * (V0x - Ex) / V0x ** 2 * exp(-2 * kap * Lx)), Lx, oo), 1)
ident(D, 'κ → 0 (L fija): T → 1/(1 + m V₀ L²/(2ħ²) …) límite de barrera delgada: T ≃ 1 − V₀²κ²L²/(4E(V₀−E))', sp.series(Tsym, kap, 0, 3).removeO(), 1 - V0x ** 2 * Lx ** 2 * kap ** 2 / (4 * Ex * (V0x - Ex))) if False else None
for (Ee, Ve, Ln_) in ((1, 2, 0.5), (1, 2, 1.0), (1, 2, 2.0)):
    kap_ = math.sqrt(2 * me * (Ve - Ee) * qe) / hb * 1e-9
    Ta = 16 * Ee / Ve * (1 - Ee / Ve) * math.exp(-2 * kap_ * Ln_)
    rec(G_STEP, D, f'aproximación de barrera ancha frente a la exacta (L = {Ln_} nm)', Ta / Tf(Ee, Ve, Ln_), 1.0, 'rel 0.2 (κL ≳ 2.5)', abs(Ta / Tf(Ee, Ve, Ln_) - 1) < (0.2 if Ln_ == 0.5 else 0.01))
uT = {'T': '1', 'E': 'J', 'V0': 'J', 'L': 'm', 'kappa': 'm^-1', 'm': 'kg', 'hbar': 'J s', 'k': 'm^-1'}
dimcheck(D, 'κ = √(2m(V₀ − E))/ħ', kap, sqrt(2 * mm * (V0x - Ex)) / hbS, uT)
dimcheck(D, 'T = [1 + V₀² sinh²κL/(4E(V₀−E))]⁻¹', Symbol('T', positive=True), Tsym, uT)
dimcheck(D, 'penetración 1/(2κ)', Symbol('L', positive=True), 1 / (2 * kap), uT)
tnf = lambda V_, r_, L_: (lambda E_: (lambda ka: (ka * 1e-9, Tf(E_, V_, L_), 16 * r_ * (1 - r_) * math.exp(-2 * ka * 1e-9 * L_), 1 / (2 * ka) * 1e12))(math.sqrt(2 * me * (V_ - E_) * qe) / hb))(r_ * V_)
num(D, 'κ (nm⁻¹)', tnf(2, 0.5, 0.5)[0], '5.123'); num(D, 'T (0.5 nm)', tnf(2, 0.5, 0.5)[1], '0.02355'); num(D, 'T aprox', tnf(2, 0.5, 0.5)[2], '0.02383'); num(D, 'T (1 nm) 10⁻⁴', tnf(2, 0.5, 1.0)[1] / 1e-4, '1.42'); num(D, 'T (0.1 nm)', tnf(2, 0.5, 0.1)[1], '0.777'); num(D, 'T (2 nm) 10⁻⁹', tnf(2, 0.5, 2.0)[1] / 1e-9, '5.0'); num(D, 'e^(−2κ·0.1)', math.exp(-2 * tnf(2, 0.5, 0.5)[0] * 0.1), '0.36', tol=5e-3)
num(D, 'T (V₀ = 5 eV) 10⁻⁵', tnf(5, 0.2, 0.5)[1] / 1e-5, '9.08'); num(D, 'T (E/V₀ = 0.95)', tnf(2, 0.95, 0.5)[1], '0.189'); num(D, 'T (E = 0.5 eV)', tnf(2, 0.25, 0.5)[1], '0.00564')
kst = math.sqrt(2 * me * 4.5 * qe) / hb * 1e-9
num(D, 'κ del STM (nm⁻¹)', kst, '10.87'); num(D, 'factor por 0.1 nm', math.exp(2 * kst * 0.1), '8.8', tol=0.01)
num(D, 'penetración valor inicial', tnf(2, 0.5, 0.5)[3], '97.596'); num(D, 'κ valor inicial', tnf(2, 0.5, 0.5)[0], '5.12317'); num(D, 'T valor inicial', tnf(2, 0.5, 0.5)[1], '0.0235471'); num(D, 'T aprox valor inicial', tnf(2, 0.5, 0.5)[2], '0.0238285')
Vq, rq, Lq2 = symbols('V r L', positive=True)
Eqq = rq * Vq; kaq = sqrt(2 * meq * (Vq - Eqq) * qeq) / hbq * sp.Float('1e-9', 40)
fs(D, 'kap', kaq); fs(D, 'T', 1 / (1 + Vq ** 2 * sinh(kaq * Lq2) ** 2 / (4 * Eqq * (Vq - Eqq)))); fs(D, 'Ta', 16 * rq * (1 - rq) * exp(-2 * kaq * Lq2)); fs(D, 'd', 1 / (2 * kaq) * 1000)

# ---------------------------------------------------------------- pozo finito
D = 'pozo-finito'
z, z0, kw, kapw, Lw = S('z z0 kw kapw Lw')
ident(D, 'continuidad de φ′/φ: −k tan(kL/2) = −κ', -kw * tan(kw * Lw / 2), -kapw) if False else None
solves(D, 'k tan(kL/2) = κ con z = kL/2 y κL/2 = √(z₀² − z²) ⇒ z tan z = √(z₀² − z²)', [Eq(z * tan(z), kapw)], kapw, z * tan(z))
ident(D, 'k² + κ² = 2mV₀/ħ² ⇒ z² + (κL/2)² = z₀²', (kw * Lw / 2) ** 2 + (kapw * Lw / 2) ** 2, (Lw / 2) ** 2 * (kw ** 2 + kapw ** 2))
def pozo_roots(V0e, Lnm, mr=1.0):
    m_ = mr * me; z0_ = Lnm * 1e-9 / (2 * hb) * math.sqrt(2 * m_ * V0e * qe)
    roots = []
    j = 0
    while j * math.pi / 2 < z0_:
        lo = j * math.pi / 2 + 1e-12; hi = min((j + 1) * math.pi / 2 - 1e-12, z0_ - 1e-12)
        if lo >= hi: break
        g = (lambda zz: zz * math.tan(zz) - math.sqrt(z0_ ** 2 - zz ** 2)) if j % 2 == 0 else (lambda zz: -zz / math.tan(zz) - math.sqrt(z0_ ** 2 - zz ** 2))
        if g(lo) * g(hi) < 0:
            roots.append(brentq(g, lo, hi, xtol=1e-14))
        j += 1
    Es = [hb ** 2 * zr ** 2 / (2 * m_ * (Lnm * 1e-9 / 2) ** 2) / qe for zr in roots]
    return z0_, Es
for (V0e, Lnm) in ((10, 1), (1, 1), (50, 0.5), (0.1, 1)):
    z0_, Es = pozo_roots(V0e, Lnm)
    Nth = math.ceil(2 * z0_ / math.pi)
    rec(G_STEP, D, f'número de raíces (pares e impares) = ⌈2z₀/π⌉ (V₀={V0e} eV, L={Lnm} nm)', len(Es), Nth, 'exacto', len(Es) == Nth)
# diagonalización del hamiltoniano discretizado (pozo de 10 eV y 1 nm)
xs = np.linspace(-4e-9, 4e-9, 8001)
Vf = lambda xx_: np.where(np.abs(xx_) < 0.5e-9, 0.0, 10 * qe)
wl = fd_levels(Vf, xs, me, hb, k=8)
z0_, Es = pozo_roots(10, 1)
for i, Ew in enumerate(wl[:len(Es)]):
    rec(G_STEP, D, f'diagonalización del pozo discretizado: E_{i+1} frente a la ecuación trascendente', float(Ew / qe), Es[i], 'rel 2e-3', abs(Ew / qe / Es[i] - 1) < 2e-3)
rec(G_STEP, D, 'ningún nivel por encima de V₀ cuenta como ligado: 6 estados con V₀ = 10 eV', float(np.sum(wl < 10 * qe)), 6.0, 'exacto', int(np.sum(wl < 10 * qe)) == 6)
rec(G_STEP, D, 'el fundamental del pozo finito es menor que el del infinito', Es[0], math.pi ** 2 * hb ** 2 / (2 * me * 1e-18) / qe, '<', Es[0] < math.pi ** 2 * hb ** 2 / (2 * me * 1e-18) / qe)
rec(G_STEP, D, 'límite V₀ → ∞: E₁ → π²ħ²/2mL² (V₀ = 10⁵ eV)', pozo_roots(1e5, 1)[1][0], math.pi ** 2 * hb ** 2 / (2 * me * 1e-18) / qe, 'rel 1e-2', abs(pozo_roots(1e5, 1)[1][0] / (math.pi ** 2 * hb ** 2 / (2 * me * 1e-18) / qe) - 1) < 1e-2)
uP = {'z0': '1', 'z': '1', 'V0': 'J', 'L': 'm', 'm': 'kg', 'hbar': 'J s', 'E1': 'J', 'kw': 'm^-1', 'kapw': 'm^-1', 'Lw': 'm', 'N': '1'}
dimcheck(D, 'z₀ = (L/2ħ)√(2mV₀)', z0, Lw / (2 * hbS) * sqrt(2 * m * Symbol('V0', positive=True)), uP)
dimcheck(D, 'E₁ = 4ħ²z₁²/(2mL²)', Symbol('E1', positive=True), 4 * hbS ** 2 * z ** 2 / (2 * m * Lw ** 2), uP)
dimcheck(D, 'z tan z = √(z₀² − z²)', Symbol('q', positive=True), z * tan(z) + sqrt(z0 ** 2 - z ** 2), dict(uP, q='1'))
pzf = lambda V_, L_, mr: (lambda z0v, zr: (z0v, math.ceil(2 * z0v / math.pi), hb ** 2 * zr ** 2 / (2 * mr * me * (L_ * 1e-9 / 2) ** 2) / qe, hb ** 2 * zr ** 2 / (2 * mr * me * (L_ * 1e-9 / 2) ** 2) / qe / V_, math.pi ** 2 * hb ** 2 / (2 * mr * me * (L_ * 1e-9) ** 2) / qe))(L_ * 1e-9 / (2 * hb) * math.sqrt(2 * mr * me * V_ * qe), pozo_roots(V_, L_, mr)[1] and math.sqrt(pozo_roots(V_, L_, mr)[1][0] * qe * 2 * mr * me * (L_ * 1e-9 / 2) ** 2) / hb)
num(D, 'z₀ (10 eV, 1 nm)', pzf(10, 1, 1)[0], '8.100'); num(D, 'N', pzf(10, 1, 1)[1], '6'); num(D, 'E₁', pzf(10, 1, 1)[2], '0.2976'); num(D, 'E₁/E_∞ (%)', pzf(10, 1, 1)[2] / pzf(10, 1, 1)[4] * 100, '79', tol=5e-3); num(D, 'E_∞', pzf(10, 1, 1)[4], '0.3760')
num(D, 'N (100 eV)', pzf(100, 1, 1)[1], '17'); num(D, 'E₁ (100 eV)', pzf(100, 1, 1)[2], '0.3483'); num(D, 'E₁/E_∞ (100 eV) %', pzf(100, 1, 1)[2] / pzf(100, 1, 1)[4] * 100, '93', tol=5e-3)
num(D, 'z₀ (1 eV)', pzf(1, 1, 1)[0], '2.562'); num(D, 'N (1 eV)', pzf(1, 1, 1)[1], '2'); num(D, 'E₁ (1 eV)', pzf(1, 1, 1)[2], '0.1908'); num(D, 'N (0.1 eV)', pzf(0.1, 1, 1)[1], '1'); num(D, 'E₁ (0.1 eV)', pzf(0.1, 1, 1)[2], '0.0637'); num(D, 'E₁/V₀ (0.1 eV)', pzf(0.1, 1, 1)[3], '0.64', tol=3e-3)
num(D, 'N (50 eV, 0.5 nm)', pzf(50, 0.5, 1)[1], '6'); num(D, 'E₁ (50 eV, 0.5 nm)', pzf(50, 0.5, 1)[2], '1.219'); num(D, 'N (10 eV, 2 nm)', pzf(10, 2, 1)[1], '11'); num(D, 'E₁ (10 eV, 2 nm)', pzf(10, 2, 1)[2], '0.0834')
num(D, 'z₀ valor inicial', pzf(10, 1, 1)[0], '8.10044'); num(D, 'E₁ valor inicial', pzf(10, 1, 1)[2], '0.297602'); num(D, 'E₁/V₀ valor inicial', pzf(10, 1, 1)[3], '0.0297602'); num(D, 'E_∞ valor inicial', pzf(10, 1, 1)[4], '0.376030')
fsim_py('pozo', 'z0', lambda d: d['L'] * 1e-9 / (2 * hb) * math.sqrt(2 * d['mr'] * me * d['V'] * qe), tol=1e-9, deriv=D)
fsim_py('pozo', 'E1', lambda d: pozo_roots(d['V'], d['L'], d['mr'])[1][0], tol=1e-9, deriv=D)
fsim_py('pozo', 'r', lambda d: pozo_roots(d['V'], d['L'], d['mr'])[1][0] / d['V'], tol=1e-9, deriv=D)
fsim_py('pozo', 'N', lambda d: math.ceil(2 * d['L'] * 1e-9 / (2 * hb) * math.sqrt(2 * d['mr'] * me * d['V'] * qe) / math.pi), tol=1e-9, deriv=D)
Vq2, Lq3, mrq3 = symbols('V L mr', positive=True)
fs(D, 'Ei', pi ** 2 * hbq ** 2 / (2 * mrq3 * meq * (Lq3 * sp.Float('1e-9', 40)) ** 2) / qeq)

# ---------------------------------------------------------------- paquete
D = 'paquete-ondas'
t_, s0, mq_, hb_ = S('t s0 m hbar')
tau_ = hb_ * t_ / (2 * mq_ * s0 ** 2)
psi_t = (1 + sI * tau_) ** R_(-1, 2) * exp(-x ** 2 / (4 * s0 ** 2 * (1 + sI * tau_)))
res = sI * hb_ * diff(psi_t, t_) + hb_ ** 2 / (2 * mq_) * diff(psi_t, x, 2)
ident(D, 'ψ(x,t) ∝ (1 + iτ)^(−1/2) exp[−x²/4σ₀²(1 + iτ)] resuelve iħ∂ₜψ = −ħ²∂ₓ²ψ/2m', sp.simplify(res / psi_t), 0)
ident(D, '|ψ|² ∝ exp[−x²/(2σ²)] con σ² = σ₀²(1 + τ²)', sp.simplify(sp.re(sp.expand_complex(1 / (4 * s0 ** 2 * (1 + sI * Symbol('tt', real=True))))) - 1 / (4 * s0 ** 2 * (1 + Symbol('tt', real=True) ** 2))), 0)
ident(D, 'σ(t) = σ₀√(1 + (ħt/2mσ₀²)²)', s0 * sqrt(1 + tau_ ** 2), s0 * sqrt(1 + (hb_ * t_ / (2 * mq_ * s0 ** 2)) ** 2))
ident(D, 't ≫ τ: σ → (ħ/2mσ₀) t = Δv t', sp.limit(s0 * sqrt(1 + tau_ ** 2) / t_, t_, oo), hb_ / (2 * mq_ * s0))
# evolución numérica con el método de pasos divididos (FFT), unidades ħ = m = 1, σ₀ = 1
N = 2 ** 14; Lx = 400.0
xg = (np.arange(N) - N // 2) * (Lx / N); dxg = Lx / N
kg = 2 * np.pi * np.fft.fftfreq(N, d=dxg)
psi_n = np.exp(-xg ** 2 / 4.0).astype(complex); psi_n /= np.sqrt(np.sum(np.abs(psi_n) ** 2) * dxg)
for tn in (2.0, 5.0, 10.0, 20.0):
    ps = np.fft.ifft(np.exp(-1j * kg ** 2 * tn / 2) * np.fft.fft(psi_n))
    prob = np.abs(ps) ** 2; prob /= prob.sum()
    sig_n = math.sqrt(float(np.sum(xg ** 2 * prob) - np.sum(xg * prob) ** 2))
    rec(G_STEP, D, f'evolución numérica (FFT): σ(t = {tn}) frente a √(1 + (t/2)²)', sig_n, math.sqrt(1 + (tn / 2) ** 2), 'rel 1e-6', abs(sig_n / math.sqrt(1 + (tn / 2) ** 2) - 1) < 1e-6)
rec(G_STEP, D, 'el producto σΔp = ħ/2 se conserva: Δp = ħ/(2σ₀) (ħ = σ₀ = 1)', float(math.sqrt(np.sum(kg ** 2 * np.abs(np.fft.fft(psi_n)) ** 2) / np.sum(np.abs(np.fft.fft(psi_n)) ** 2))), 0.5, 'rel 1e-6', abs(math.sqrt(np.sum(kg ** 2 * np.abs(np.fft.fft(psi_n)) ** 2) / np.sum(np.abs(np.fft.fft(psi_n)) ** 2)) / 0.5 - 1) < 1e-6)
uQ = {'sigma': 'm', 'sigma0': 'm', 'hbar': 'J s', 'm': 'kg', 't': 's', 'tau': 's', 'dv': 'm s^-1', 's0': 'm'}
dimcheck(D, 'σ(t) = σ₀√(1 + (ħt/2mσ₀²)²)', Symbol('sigma', positive=True), s0 * sqrt(1 + (hb_ * t_ / (2 * mq_ * s0 ** 2)) ** 2), uQ)
dimcheck(D, 'τ = 2mσ₀²/ħ', Symbol('tau', positive=True), 2 * mq_ * s0 ** 2 / hb_, uQ)
dimcheck(D, 'Δv = ħ/(2mσ₀)', Symbol('dv', positive=True), hb_ / (2 * mq_ * s0), uQ)
pqf = lambda mr, s0n, tfs: (lambda m_, s_: (lambda tau: (s_ * math.sqrt(1 + (tfs * 1e-15 / tau) ** 2) * 1e9, math.sqrt(1 + (tfs * 1e-15 / tau) ** 2), hb / (2 * m_ * s_) * 1e-3, tau * 1e15))(2 * m_ * s_ ** 2 / hb))(mr * me, s0n * 1e-9)
num(D, 'τ (e⁻, 0.1 nm) fs', pqf(1, 0.1, 1)[3], '0.1728'); num(D, 'Δv km/s', pqf(1, 0.1, 1)[2], '579', tol=1e-3); num(D, 'σ (1 fs) nm', pqf(1, 0.1, 1)[0], '0.587'); num(D, 'σ/σ₀', pqf(1, 0.1, 1)[1], '5.9', tol=5e-3); num(D, 'σ (10 fs)', pqf(1, 0.1, 10)[0], '5.79'); num(D, 'τ (1 nm)', pqf(1, 1, 1)[3], '17.28'); num(D, 'σ (1 nm, 1 fs)', pqf(1, 1, 1)[0], '1.0017')
num(D, 'τ protón fs', pqf(1836.15267343, 0.1, 1000)[3], '317'); num(D, 'σ protón (1000 fs)', pqf(1836.15267343, 0.1, 1000)[0], '0.331'); num(D, 'τ polvo (10¹³ s)', 2 * 1e-9 * 1e-12 / hb / 1e13, '1.9', tol=0.01); num(D, 'τ polvo (años 10⁵)', 2 * 1e-9 * 1e-12 / hb / 3.156e7 / 1e5, '6', tol=0.02)
num(D, 'σ valor inicial', pqf(1, 0.1, 1)[0], '0.587413'); num(D, 'σ/σ₀ valor inicial', pqf(1, 0.1, 1)[1], '5.87413'); num(D, 'Δv valor inicial', pqf(1, 0.1, 1)[2], '578.838'); num(D, 'τ valor inicial', pqf(1, 0.1, 1)[3], '0.172760')
mrq4, s0q, tfq = symbols('mr s0 t', positive=True)
mq4 = mrq4 * meq; s4 = s0q * sp.Float('1e-9', 40); tau4 = 2 * mq4 * s4 ** 2 / hbq
fs(D, 'st', s4 * sqrt(1 + (tfq * sp.Float('1e-15', 40) / tau4) ** 2) * sp.Float('1e9', 40)); fs(D, 'ratio', sqrt(1 + (tfq * sp.Float('1e-15', 40) / tau4) ** 2)); fs(D, 'dv', hbq / (2 * mq4 * s4) * sp.Float('1e-3', 40)); fs(D, 'tau', tau4 * sp.Float('1e15', 40))
