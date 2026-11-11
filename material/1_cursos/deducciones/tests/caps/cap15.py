# -*- coding: utf-8 -*-
"""Capítulo 15 — Hidrodinámica."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, tanh, sinh, cosh, Function, Matrix, solve, simplify, oo, limit
import mpmath as mp
from scipy.integrate import solve_ivp, quad, dblquad

EX = {'bernoulli-tanque': 'tanque', 'venturi-bernoulli': 'venturi', 'poiseuille': 'poiseuille', 'stokes-esfera': 'stokes', 'ondas-superficie': 'ondas-profundidad'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
G0 = 9.80665
Gs = sp.Float('9.80665', 40)
g, rho = S('g rho')

# ---------------------------------------------------------------- Bernoulli y Torricelli
D = 'bernoulli-tanque'
p1, p2, v1, v2, z1, z2, dV, h, A, a, h0, t = S('p1 p2 v1 v2 z1 z2 dV h A a h0 t')
solves(D, 'W = ΔE ⇒ p₂ = p₁ − ½ρ(v₂² − v₁²) − ρg(z₂ − z₁)', [Eq((p1 - p2) * dV, R_(1, 2) * rho * dV * (v2 ** 2 - v1 ** 2) + rho * g * dV * (z2 - z1))], p2,
       p1 - R_(1, 2) * rho * (v2 ** 2 - v1 ** 2) - rho * g * (z2 - z1))
ident(D, 'p + ½ρv² + ρgz es igual en 1 y 2', (p1 + R_(1, 2) * rho * v1 ** 2 + rho * g * z1) - (p2 + R_(1, 2) * rho * v2 ** 2 + rho * g * z2),
      (p1 - p2) - (R_(1, 2) * rho * (v2 ** 2 - v1 ** 2) + rho * g * (z2 - z1)))
ident(D, 'trabajo de presión: p₁A₁v₁dt − p₂A₂v₂dt = (p₁ − p₂)dV con A₁v₁dt = A₂v₂dt = dV', p1 * dV - p2 * dV, (p1 - p2) * dV)
ident(D, 'continuidad: v₁ = (a/A)v₂', (a * v2 / A) * A, a * v2)
ident(D, 'v₂²[1 − (a/A)²] = 2gh con v₂ = √(2gh)/√(1 − (a/A)²)', (sqrt(2 * g * h) / sqrt(1 - (a / A) ** 2)) ** 2 * (1 - (a / A) ** 2), 2 * g * h)
ident(D, 'a ≪ A: v → √(2gh) (Torricelli)', (sqrt(2 * g * h) / sqrt(1 - (a / A) ** 2)).subs(a, 0), sqrt(2 * g * h))
ident(D, 'caída libre: ½mv² = mgh', sqrt(2 * g * h) ** 2 / 2, g * h)
# vaciado: h(t) = (√h0 − c t)², c = (a/(A f))√(g/2)
f_ = sqrt(1 - (a / A) ** 2)
c_ = a / (A * f_) * sqrt(g / 2)
hsol = (sqrt(h0) - c_ * t) ** 2
ident(D, 'h(t) = (√h₀ − ct)² verifica dh/dt = −(a/A)√(2g h)/f', diff(hsol, t), -(a / (A * f_)) * sqrt(2 * g) * (sqrt(h0) - c_ * t))
ident(D, 'h(0) = h₀', hsol.subs(t, 0), h0)
solves(D, 'h(T) = 0 ⇒ T = (A/a)√(2h₀/g)·f', [Eq(sqrt(h0) - c_ * t, 0)], t, A / a * sqrt(2 * h0 / g) * f_)
integral(D, '∫₀^h₀ h^(−1/2) dh = 2√h₀', 1 / sqrt(Symbol('hh', positive=True)), Symbol('hh', positive=True), 0, h0, 2 * sqrt(h0))
# integración numérica independiente del vaciado
def t_num(h0_, A_, a_):
    f = math.sqrt(1 - (a_ / A_) ** 2)
    val = quad(lambda hh: 1 / math.sqrt(hh), 0, h0_, epsabs=1e-12, epsrel=1e-12)[0]
    return A_ / a_ * f / math.sqrt(2 * G0) * val
tt = lambda h0_, A_, a_: A_ / a_ * math.sqrt(2 * h0_ / G0) * math.sqrt(1 - (a_ / A_) ** 2)
for (h0_, A_, a_) in ((1, 0.5, 1e-3), (4, 0.5, 1e-3), (1, 0.5, 0.1)):
    rec(G_STEP, D, f'cuadratura del tiempo de vaciado (h₀={h0_}, a={a_})', t_num(h0_, A_, a_), tt(h0_, A_, a_), 'rel 1e-8', abs(t_num(h0_, A_, a_) - tt(h0_, A_, a_)) < 1e-8 * tt(h0_, A_, a_))
# EDO integrada con solve_ivp hasta casi vacío en variable y = √h (evita la singularidad)
f0 = math.sqrt(1 - (1e-3 / 0.5) ** 2)
sol = solve_ivp(lambda tq, y: [-(1e-3 / 0.5) / f0 * math.sqrt(G0 / 2)], [0, 400], [1.0], rtol=1e-12, atol=1e-12, events=lambda tq, y: y[0])
sol.t_events  # noqa
rec(G_STEP, D, 'integración numérica de dh/dt: tiempo de vaciado (A=0.5, a=10⁻³)', float(sol.t_events[0][0]), tt(1, 0.5, 1e-3), 'rel 1e-6', abs(float(sol.t_events[0][0]) - tt(1, 0.5, 1e-3)) < 1e-6 * tt(1, 0.5, 1e-3))
uB = {'p': 'Pa', 'rho': 'kg m^-3', 'v': 'm s^-1', 'z': 'm', 'g': 'm s^-2', 'h': 'm', 'A': 'm^2', 'a': 'm^2', 't': 's', 'h0': 'm', 'Q': 'm^3 s^-1'}
pp, vv, zz_ = S('p v z')
dimcheck(D, 'p + ½ρv² + ρgz: cada sumando es una presión', pp, rho * vv ** 2 / 2 + rho * g * zz_, uB)
dimcheck(D, 'v = √(2gh)', vv, sqrt(2 * g * h), uB)
dimcheck(D, 't = (A/a)√(2h₀/g)', t, A / a * sqrt(2 * h0 / g), uB)
dimcheck(D, 'Q = a√(2gh)', Symbol('Q', positive=True), a * sqrt(2 * g * h), uB)
tk = lambda h0_, A_, a_: (math.sqrt(2 * G0 * h0_) / math.sqrt(1 - (a_ / A_) ** 2), a_ * math.sqrt(2 * G0 * h0_) / math.sqrt(1 - (a_ / A_) ** 2), tt(h0_, A_, a_))
num(D, 'v (h = 1 m)', tk(1, .5, 1e-3)[0], '4.4287'); num(D, 'Q (L/s)', tk(1, .5, 1e-3)[1] * 1e3, '4.4287'); num(D, 't de vaciado', tk(1, .5, 1e-3)[2], '225.8'); num(D, 'minutos', tk(1, .5, 1e-3)[2] // 60, '3'); num(D, 'segundos restantes', tk(1, .5, 1e-3)[2] - 180 - 45, '0.8', tol=0.05)
num(D, 'v (h = 4 m)', tk(4, .5, 1e-3)[0], '8.857'); num(D, 't (h = 4 m)', tk(4, .5, 1e-3)[2], '451.6'); num(D, 't con a = 20 cm²', tk(1, .5, 2e-3)[2], '112.9'); num(D, 'v con a = 0.1', tk(1, .5, 0.1)[0], '4.520'); num(D, 'exceso sobre Torricelli (%)', (tk(1, .5, 0.1)[0] / math.sqrt(2 * G0) - 1) * 100, '2.1', tol=0.01)
num(D, 'v valor inicial', tk(1, .5, 1e-3)[0], '4.42870'); num(D, 'Q valor inicial (10⁻³)', tk(1, .5, 1e-3)[1] / 1e-3, '4.4287'); num(D, 't valor inicial', tk(1, .5, 1e-3)[2], '225.80'); num(D, 'Torricelli valor inicial', math.sqrt(2 * G0), '4.42869'); num(D, 't (a = 2×10⁻³)', tk(1, .5, 2e-3)[2], '112.90')
h0q, Aq, aq = symbols('h0 A a', positive=True)
fq = sqrt(1 - (aq / Aq) ** 2)
fs(D, 'v', sqrt(2 * Gs * h0q) / fq); fs(D, 'Q', aq * sqrt(2 * Gs * h0q) / fq); fs(D, 't', Aq / aq * sqrt(2 * h0q / Gs) * fq); fs(D, 'vt', sqrt(2 * Gs * h0q))

# ---------------------------------------------------------------- Venturi
D = 'venturi-bernoulli'
A1, A2, dp, vq, Q, rm, dH = S('A1 A2 dp v2 Q rm dH')
ident(D, 'Bernoulli horizontal: p₁ − p₂ = ½ρ(v₂² − v₁²)', (p1 + R_(1, 2) * rho * v1 ** 2) - (p2 + R_(1, 2) * rho * v2 ** 2), (p1 - p2) - R_(1, 2) * rho * (v2 ** 2 - v1 ** 2))
ident(D, 'continuidad: v₁ = (A₂/A₁)v₂ ⇒ p₁ − p₂ = ½ρv₂²[1 − (A₂/A₁)²]', R_(1, 2) * rho * (v2 ** 2 - (A2 / A1 * v2) ** 2), R_(1, 2) * rho * v2 ** 2 * (1 - (A2 / A1) ** 2))
solves(D, 'despejar v₂ de Δp = ½ρv₂²[1 − (A₂/A₁)²]', [Eq(dp, R_(1, 2) * rho * v2 ** 2 * (1 - (A2 / A1) ** 2))], v2, sqrt(2 * dp / (rho * (1 - (A2 / A1) ** 2))))
ident(D, 'Q = A₂v₂ = A₂√(2Δp/(ρ[1 − (A₂/A₁)²]))', A2 * sqrt(2 * dp / (rho * (1 - (A2 / A1) ** 2))), A2 * sqrt(2 * dp / (rho * (1 - (A2 / A1) ** 2))))
solves(D, 'manómetro: Δp = (ρ_m − ρ)gΔh ⇒ Δh', [Eq(dp, (rm - rho) * g * dH)], dH, dp / ((rm - rho) * g))
ident(D, 'A₂ → 0 de modo que A₂/A₁ → 0: Q → A₂√(2Δp/ρ) (Torricelli con presión)', (A2 * sqrt(2 * dp / (rho * (1 - (A2 / A1) ** 2)))).subs(A1, oo), A2 * sqrt(2 * dp / rho))
uV = {'Q': 'm^3 s^-1', 'A1': 'm^2', 'A2': 'm^2', 'dp': 'Pa', 'rho': 'kg m^-3', 'v2': 'm s^-1', 'dH': 'm', 'rm': 'kg m^-3', 'g': 'm s^-2'}
dimcheck(D, 'Q = A₂√(2Δp/(ρ[1 − (A₂/A₁)²]))', Q, A2 * sqrt(2 * dp / (rho * (1 - (A2 / A1) ** 2))), uV)
dimcheck(D, 'v₂ = √(2Δp/(ρ[…]))', vq, sqrt(2 * dp / (rho * (1 - (A2 / A1) ** 2))), uV)
dimcheck(D, 'Δh = Δp/((ρ_m − ρ)g)', dH, dp / ((rm - rho) * g), uV)
vn = lambda A1_, A2_, dp_, rho_: (lambda v2_: (v2_, A2_ * 1e-4 * v2_, A2_ * 1e-4 * v2_ / (A1_ * 1e-4)))(math.sqrt(2 * dp_ * 1e3 / (rho_ * (1 - (A2_ / A1_) ** 2))))
num(D, 'Q con β = 0.5 valor inicial (10⁻³)', vn(20, 10, 10, 1000)[1] / 1e-3, '5.16398'); num(D, 'v₂', vn(20, 5, 10, 1000)[0], '4.6188'); num(D, 'Q (L/s)', vn(20, 5, 10, 1000)[1] * 1e3, '2.3094'); num(D, 'v₁', vn(20, 5, 10, 1000)[2], '1.1547'); num(D, 'Q con 40 kPa (L/s)', vn(20, 5, 40, 1000)[1] * 1e3, '4.6188')
num(D, 'Q con A₂ = 10 cm² (L/s)', vn(20, 10, 10, 1000)[1] * 1e3, '5.164'); num(D, 'cociente de caudales (A₂ doble)', vn(20, 10, 10, 1000)[1] / vn(20, 5, 10, 1000)[1], '2.24'); num(D, 'aumento de v₂ (%)', (vn(20, 10, 10, 1000)[0] / vn(20, 5, 10, 1000)[0] - 1) * 100, '12', tol=0.05)
num(D, 'Q con A₂ = 2 cm² (L/s)', vn(20, 2, 10, 1000)[1] * 1e3, '0.899'); num(D, 'Δh con mercurio (cm)', 1e4 / ((13595 - 1000) * G0) * 100, '8.1', tol=0.01)
num(D, 'Q valor inicial (10⁻³)', vn(20, 5, 10, 1000)[1] / 1e-3, '2.30940'); num(D, 'v₂ valor inicial', vn(20, 5, 10, 1000)[0], '4.61880'); num(D, 'v₁ valor inicial', vn(20, 5, 10, 1000)[2], '1.15470')
A1q, bq, dpq, rhoq = symbols('A1 beta dp rho', positive=True)
Ak1, Ak2 = A1q * R_(1, 10000), bq * A1q * R_(1, 10000)
v2s = sqrt(2 * dpq * 1000 / (rhoq * (1 - bq ** 2)))
fs(D, 'Q', Ak2 * v2s); fs(D, 'v2', v2s); fs(D, 'v1', Ak2 * v2s / Ak1)

# ---------------------------------------------------------------- Poiseuille
D = 'poiseuille'
r, Rr, L, eta, c1, c2 = S('r R L eta c1 c2')
dpL = dp / L
vr = Function('v')
sol_v = dp / (4 * eta * L) * (Rr ** 2 - r ** 2)
ode(D, '(1/r) d/dr(r v′) = −Δp/(ηL)', Eq(diff(r * vr(r).diff(r), r) / r, -dp / (eta * L)), Eq(vr(r), sol_v))
ident(D, 'primera integración: r v′ = −Δp r²/(2ηL) + c₁', diff(-dp / (2 * eta * L) * r ** 2 + c1, r) / r, -dp / (eta * L) + 0 * c1)
ident(D, 'segunda integración: v = −Δp r²/(4ηL) + c₁ ln r + c₂ ⇒ v′ = (rv′)/r', diff(-dp / (4 * eta * L) * r ** 2 + c1 * log(r) + c2, r), (-dp / (2 * eta * L) * r ** 2 + c1) / r)
ident(D, 'c₁ = 0 (finito en el eje) y v(R) = 0 ⇒ c₂', sol_v.subs(r, Rr), 0)
ident(D, 'v(r) = Δp(R² − r²)/(4ηL)', -dp / (4 * eta * L) * r ** 2 + dp * Rr ** 2 / (4 * eta * L), sol_v)
ident(D, 'v_máx = ΔpR²/(4ηL) en r = 0', sol_v.subs(r, 0), dp * Rr ** 2 / (4 * eta * L))
integral(D, 'Q = ∫₀^R v 2πr dr = πR⁴Δp/(8ηL)', sol_v * 2 * pi * r, r, 0, Rr, pi * Rr ** 4 * dp / (8 * eta * L))
integral(D, 'v medio: (1/πR²)∫v 2πr dr = v_máx/2', sol_v * 2 * pi * r / (pi * Rr ** 2), r, 0, Rr, dp * Rr ** 2 / (8 * eta * L))
ident(D, 'τ_w = −η v′(R) = ΔpR/(2L)', (-eta * diff(sol_v, r)).subs(r, Rr), dp * Rr / (2 * L))
ident(D, 'balance de fuerzas: Δp πR² = τ_w 2πRL', dp * pi * Rr ** 2, (dp * Rr / (2 * L)) * 2 * pi * Rr * L)
# diferencias finitas independientes: (1/r)(r v')' = −1 con v(1) = 0 y v'(0) = 0
N = 2000
hh = 1.0 / N
rn = np.arange(N + 1) * hh
Mx = np.zeros((N, N)); bx = -np.ones(N)  # incógnitas v_0..v_{N-1}; v_N = 0
for i in range(N):
    if i == 0:
        Mx[0, 0] = -4 / hh ** 2; Mx[0, 1] = 4 / hh ** 2
    else:
        Mx[i, i] = -2 / hh ** 2
        Mx[i, i - 1] = 1 / hh ** 2 - 1 / (2 * rn[i] * hh)
        if i + 1 < N:
            Mx[i, i + 1] = 1 / hh ** 2 + 1 / (2 * rn[i] * hh)
vfd = np.linalg.solve(Mx, bx)
vfull = np.append(vfd, 0.0)
Qfd = float(np.trapezoid(vfull * 2 * np.pi * rn, rn)) if hasattr(np, 'trapezoid') else float(np.trapz(vfull * 2 * np.pi * rn, rn))
rec(G_STEP, D, 'diferencias finitas de la EDO: Q = π/8', Qfd, math.pi / 8, 'rel 1e-5', abs(Qfd - math.pi / 8) < 1e-5 * math.pi / 8)
rec(G_STEP, D, 'diferencias finitas: v(0) = 1/4', float(vfd[0]), 0.25, 'rel 1e-5', abs(float(vfd[0]) - 0.25) < 1e-5 * 0.25)
uP = {'Q': 'm^3 s^-1', 'R': 'm', 'dp': 'Pa', 'eta': 'Pa s', 'L': 'm', 'v': 'm s^-1', 'tw': 'Pa'}
dimcheck(D, 'Q = πR⁴Δp/(8ηL)', Q, pi * Rr ** 4 * dp / (8 * eta * L), uP)
dimcheck(D, 'v = Δp(R² − r²)/(4ηL)', Symbol('v', positive=True), dp * Rr ** 2 / (4 * eta * L), uP)
dimcheck(D, 'τ_w = ΔpR/(2L)', Symbol('tw', positive=True), dp * Rr / (2 * L), uP)
pq = lambda R_mm, L_, dp_, eta_: (math.pi * (R_mm * 1e-3) ** 4 * dp_ / (8 * eta_ * L_), dp_ * (R_mm * 1e-3) ** 2 / (4 * eta_ * L_), dp_ * R_mm * 1e-3 / (2 * L_),
                                   1000 * (dp_ * (R_mm * 1e-3) ** 2 / (8 * eta_ * L_)) * 2 * R_mm * 1e-3 / eta_)
num(D, 'Q (R = 1 mm) 10⁻⁷', pq(1, 1, 1000, 1e-3)[0] / 1e-7, '3.927'); num(D, 'Q (mL/s)', pq(1, 1, 1000, 1e-3)[0] * 1e6, '0.393'); num(D, 'v máx', pq(1, 1, 1000, 1e-3)[1], '0.25'); num(D, 'τ_w', pq(1, 1, 1000, 1e-3)[2], '0.5'); num(D, 'Re', pq(1, 1, 1000, 1e-3)[3], '250')
num(D, 'Q (R = 2 mm) 10⁻⁶', pq(2, 1, 1000, 1e-3)[0] / 1e-6, '6.283'); num(D, 'cociente (R doble)', pq(2, 1, 1000, 1e-3)[0] / pq(1, 1, 1000, 1e-3)[0], '16'); num(D, 'Re (R = 2 mm)', pq(2, 1, 1000, 1e-3)[3], '2000')
num(D, 'Q (L doble)/Q', pq(1, 2, 1000, 1e-3)[0] / pq(1, 1, 1000, 1e-3)[0], '0.5'); num(D, 'Q (η = 3.5 mPa·s) 10⁻⁷', pq(1, 1, 1000, 3.5e-3)[0] / 1e-7, '1.122'); num(D, 'estrechamiento 16 %: Q/Q₀', 0.84 ** 4, '0.50', tol=0.01)
num(D, 'Q valor inicial (10⁻⁷)', pq(1, 1, 1000, 1e-3)[0] / 1e-7, '3.9270'); num(D, 'v máx valor inicial', pq(1, 1, 1000, 1e-3)[1], '0.25000'); num(D, 'Re valor inicial', pq(1, 1, 1000, 1e-3)[3], '250.00')
Rq, Lq, dpq2, etaq = symbols('R L dp eta', positive=True)
Rm = Rq * R_(1, 1000)
fs(D, 'Q', pi * Rm ** 4 * dpq2 / (8 * etaq * Lq)); fs(D, 'vm', dpq2 * Rm ** 2 / (4 * etaq * Lq)); fs(D, 'tw', dpq2 * Rm / (2 * Lq)); fs(D, 'Re', 1000 * (dpq2 * Rm ** 2 / (8 * etaq * Lq)) * 2 * Rm / etaq)

# ---------------------------------------------------------------- Stokes
D = 'stokes-esfera'
U, Rs_, eta_, th, ph = S('U Rs eta_ th ph')
r_, th_ = symbols('r theta', positive=True)
Ar, Br, Cr, Dr = symbols('A B C D')
f4 = lambda f: diff(f, r_, 4) - 4 / r_ ** 2 * diff(f, r_, 2) + 8 / r_ ** 3 * diff(f, r_) - 8 / r_ ** 4 * f
# operador de Stokes E² aplicado dos veces a ψ = sin²θ f(r)
ff = Function('f')
psi = sin(th_) ** 2 * ff(r_)
E2 = lambda ps: diff(ps, r_, 2) + sin(th_) / r_ ** 2 * diff(diff(ps, th_) / sin(th_), th_)
E4psi = E2(E2(psi))
ident(D, 'E⁴ψ = sin²θ [f″″ − 4f″/r² + 8f′/r³ − 8f/r⁴]', sp.simplify(E4psi.doit()), sin(th_) ** 2 * f4(ff(r_)).doit())
for n in (4, 2, 1, -1):
    ident(D, f'f = r^{n} resuelve la ecuación equidimensional', sp.simplify(f4(r_ ** n)), 0)
fgen = Ar * r_ ** 4 + Br * r_ ** 2 + Cr * r_ + Dr / r_
ident(D, 'solución general f = Ar⁴ + Br² + Cr + D/r', sp.simplify(f4(fgen)), 0)
U_, R0 = symbols('U R0', positive=True)
ffs = U_ / 2 * r_ ** 2 - R_(3, 4) * U_ * R0 * r_ + U_ * R0 ** 3 / (4 * r_)
solves(D, 'f(R) = f′(R) = 0 con B = U/2 ⇒ C = −3UR/4, D = UR³/4', [Eq(fgen.subs({Ar: 0, Br: U_ / 2}).subs(r_, R0), 0), Eq(diff(fgen.subs({Ar: 0, Br: U_ / 2}), r_).subs(r_, R0), 0)], Cr, -R_(3, 4) * U_ * R0, vars=[Cr, Dr])
solves(D, 'f(R) = f′(R) = 0 ⇒ D', [Eq(fgen.subs({Ar: 0, Br: U_ / 2}).subs(r_, R0), 0), Eq(diff(fgen.subs({Ar: 0, Br: U_ / 2}), r_).subs(r_, R0), 0)], Dr, U_ * R0 ** 3 / 4, vars=[Cr, Dr])
psi_s = sin(th_) ** 2 * ffs
vr_ = diff(psi_s, th_) / (r_ ** 2 * sin(th_))
vth_ = -diff(psi_s, r_) / (r_ * sin(th_))
ident(D, 'v_r = U cosθ (1 − 3R/2r + R³/2r³)', sp.simplify(vr_), U_ * cos(th_) * (1 - 3 * R0 / (2 * r_) + R0 ** 3 / (2 * r_ ** 3)))
ident(D, 'v_θ = −U sinθ (1 − 3R/4r − R³/4r³)', sp.simplify(vth_), -U_ * sin(th_) * (1 - 3 * R0 / (4 * r_) - R0 ** 3 / (4 * r_ ** 3)))
ident(D, 'no deslizamiento v_r(R) = 0', vr_.subs(r_, R0), 0); ident(D, 'no deslizamiento v_θ(R) = 0', sp.simplify(vth_.subs(r_, R0)), 0)
ident(D, 'lejos de la esfera: v_r → U cosθ', sp.limit(vr_, r_, oo), U_ * cos(th_)); ident(D, 'lejos de la esfera: v_θ → −U sinθ', sp.limit(vth_, r_, oo), -U_ * sin(th_))
# campo cartesiano: ∇·u = 0, η∇²u = ∇p, no deslizamiento y tracción
x, y, z = symbols('x y z', real=True)
et_, Ut, Rt = sp.Rational(7, 5), sp.Rational(3, 2), sp.Rational(1, 1)
rr = sqrt(x ** 2 + y ** 2 + z ** 2)
gr = 1 - 3 * Rt / (2 * rr) + Rt ** 3 / (2 * rr ** 3)
gt = 1 - 3 * Rt / (4 * rr) - Rt ** 3 / (4 * rr ** 3)
ux = Ut * gr * z * x / rr ** 2 - (-Ut) * gt * z * x / rr ** 2 * (-1) if False else Ut * gr * z * x / rr ** 2 - Ut * gt * z * x / rr ** 2 * (-1) * (-1)
# componentes: v_r r̂ + v_θ θ̂, con v_r = U gr cosθ, v_θ = −U gt sinθ, θ̂ = (cosθ cosφ, cosθ sinφ, −sinθ)
ux = Ut * gr * z * x / rr ** 2 - Ut * gt * z * x / rr ** 2
uy = Ut * gr * z * y / rr ** 2 - Ut * gt * z * y / rr ** 2
uz = Ut * gr * z * z / rr ** 2 + Ut * gt * (x ** 2 + y ** 2) / rr ** 2
pcar = -R_(3, 2) * et_ * Ut * Rt * z / rr ** 3
uvec = Matrix([ux, uy, uz])
pts = [(0.7, 1.1, 1.3), (-1.4, 0.3, 0.9), (2.0, -1.2, -1.5)]
div_u = sum(diff(uvec[i], v_) for i, v_ in enumerate((x, y, z)))
lap_u = [sum(diff(uvec[i], v_, 2) for v_ in (x, y, z)) for i in range(3)]
grad_p = [diff(pcar, v_) for v_ in (x, y, z)]
for pt in pts:
    sb = dict(zip((x, y, z), pt))
    rec(G_STEP, D, f'∇·u = 0 en {pt}', float(div_u.subs(sb)), 0.0, 'abs 1e-12', abs(float(div_u.subs(sb))) < 1e-12)
    eqres = max(abs(float((et_ * lap_u[i] - grad_p[i]).subs(sb))) for i in range(3))
    rec(G_STEP, D, f'η∇²u = ∇p en {pt}', eqres, 0.0, 'abs 1e-12', eqres < 1e-12)
# no deslizamiento en la superficie
for (tha, pha) in ((0.4, 0.9), (1.2, 2.5), (2.6, -1.1)):
    sb = {x: math.sin(tha) * math.cos(pha), y: math.sin(tha) * math.sin(pha), z: math.cos(tha)}
    mx_ = max(abs(float(uvec[i].subs(sb))) for i in range(3))
    rec(G_STEP, D, f'u = 0 en la superficie (θ={tha}, φ={pha})', mx_, 0.0, 'abs 1e-12', mx_ < 1e-12)
# tracción sobre la esfera: σ·n = (3ηU/2R) ẑ (con p∞ = 0)
grad_u = Matrix(3, 3, lambda i, j: diff(uvec[i], (x, y, z)[j]))
sigma = -pcar * sp.eye(3) + et_ * (grad_u + grad_u.T)
for (tha, pha) in ((0.4, 0.9), (1.2, 2.5), (2.6, -1.1)):
    sb = {x: math.sin(tha) * math.cos(pha), y: math.sin(tha) * math.sin(pha), z: math.cos(tha)}
    nvec = Matrix([sb[x], sb[y], sb[z]])
    tr = [float(c) for c in (sigma.subs(sb) * nvec)]
    exp_tr = [0.0, 0.0, float(R_(3, 2) * et_ * Ut / Rt)]
    mx_ = max(abs(tr[i] - exp_tr[i]) for i in range(3))
    rec(G_STEP, D, f'tracción σ·n = (3ηU/2R) ẑ (uniforme) en (θ={tha}, φ={pha})', mx_, 0.0, 'abs 1e-10', mx_ < 1e-10)
trz = sp.lambdify((x, y, z), (sigma * Matrix([x, y, z]) / rr)[2], 'math')
Fnum = dblquad(lambda ph_, th__: trz(math.sin(th__) * math.cos(ph_), math.sin(th__) * math.sin(ph_), math.cos(th__)) * math.sin(th__), 0, math.pi, 0, 2 * math.pi, epsabs=1e-10, epsrel=1e-10)[0]
Fexp = 6 * math.pi * float(et_ * Ut * Rt)
rec(G_STEP, D, 'integración numérica de la tracción: F = 6πηRU', Fnum, Fexp, 'rel 1e-8', abs(Fnum - Fexp) < 1e-8 * Fexp)
et2, Ut2, Rt2 = S('et2 Ut2 Rt2')
ident(D, 'F = (3ηU/2R)·4πR² = 6πηRU', R_(3, 2) * et2 * Ut2 / Rt2 * 4 * pi * Rt2 ** 2, 6 * pi * et2 * Rt2 * Ut2)
th2, ph2 = symbols('th2 ph2', real=True)
Fpres = integrate(integrate(R_(3, 2) * et2 * Ut2 / Rt2 * cos(th2) * cos(th2) * Rt2 ** 2 * sin(th2), (th2, 0, pi)), (ph2, 0, 2 * pi))
ident(D, 'parte de presión: 2πηRU (un tercio del total)', Fpres, 2 * pi * et2 * Rt2 * Ut2)
ident(D, 'parte viscosa: 4πηRU (dos tercios)', 6 * pi * et2 * Rt2 * Ut2 - 2 * pi * et2 * Rt2 * Ut2, 4 * pi * et2 * Rt2 * Ut2)
Rb, Ro_s, Ro_f, vt = S('Rb Ro_s Ro_f vt')
solves(D, 'equilibrio 6πηRv = (4/3)πR³(ρ_s − ρ_f)g ⇒ v_t', [Eq(6 * pi * eta * Rb * vt, R_(4, 3) * pi * Rb ** 3 * (Ro_s - Ro_f) * g)], vt, 2 * Rb ** 2 * (Ro_s - Ro_f) * g / (9 * eta))
ident(D, 'F = 3πηvd con d = 2R (constante C = 3π del capítulo 1)', 6 * pi * eta * Rb * vt, 3 * pi * eta * vt * (2 * Rb))
uS = {'F': 'N', 'eta': 'Pa s', 'Rb': 'm', 'vt': 'm s^-1', 'Ro_s': 'kg m^-3', 'Ro_f': 'kg m^-3', 'g': 'm s^-2'}
dimcheck(D, 'F = 6πηRU', Symbol('F', positive=True), 6 * pi * eta * Rb * vt, uS)
dimcheck(D, 'v_t = 2R²(ρ_s − ρ_f)g/(9η)', vt, 2 * Rb ** 2 * (Ro_s - Ro_f) * g / (9 * eta), uS)
stk = lambda R_um, rs, rf, eta_: (lambda vt_: (vt_, rf * vt_ * 2 * R_um * 1e-6 / eta_, 6 * math.pi * eta_ * R_um * 1e-6 * vt_))(2 * (R_um * 1e-6) ** 2 * (rs - rf) * G0 / (9 * eta_))
num(D, 'v_t arena (mm/s)', stk(20, 2700, 1000, 1e-3)[0] * 1e3, '1.482'); num(D, 'Re arena', stk(20, 2700, 1000, 1e-3)[1], '0.059'); num(D, 'F arena (10⁻¹⁰)', stk(20, 2700, 1000, 1e-3)[2] / 1e-10, '5.59')
num(D, 'v_t acero (cm/s)', stk(1000, 7800, 1260, 1.41)[0] * 1e2, '1.011'); num(D, 'Re acero', stk(1000, 7800, 1260, 1.41)[1], '0.018'); num(D, 'v_t niebla (cm/s)', stk(10, 1000, 1.2, 1.81e-5)[0] * 1e2, '1.20'); num(D, 'Re niebla', stk(10, 1000, 1.2, 1.81e-5)[1], '0.016')
num(D, 'cociente v_t (R doble)', stk(40, 2700, 1000, 1e-3)[0] / stk(20, 2700, 1000, 1e-3)[0], '4'); num(D, 'corrección de Oseen (%)', 3 / 16 * stk(20, 2700, 1000, 1e-3)[1] * 100, '1.1', tol=0.02)
num(D, 'R con Re = 1 (µm)', 20 * (1 / stk(20, 2700, 1000, 1e-3)[1]) ** (1 / 3), '51', tol=0.02)
num(D, 'v_t valor inicial (10⁻³)', stk(20, 2700, 1000, 1e-3)[0] / 1e-3, '1.4819'); num(D, 'Re valor inicial', stk(20, 2700, 1000, 1e-3)[1], '0.059276'); num(D, 'F valor inicial (10⁻¹⁰)', stk(20, 2700, 1000, 1e-3)[2] / 1e-10, '5.5866')
Rsq, rsq, rfq, etq = symbols('R rs rf eta', positive=True)
Rmm = Rsq * sp.Rational(1, 1000000)
vts = 2 * Rmm ** 2 * (rsq - rfq) * Gs / (9 * etq)
fs(D, 'vt', vts); fs(D, 'Re', rfq * vts * 2 * Rmm / etq); fs(D, 'F', 6 * pi * etq * Rmm * vts)

# ---------------------------------------------------------------- ondas superficiales
D = 'ondas-superficie'
xx, zz2, tt_ = symbols('x z t', real=True)
k, w, hq, B, aa, gg = symbols('k omega h B a g', positive=True)
phi = B * cosh(k * (zz2 + hq)) * sin(k * xx - w * tt_)
eta_w = aa * cos(k * xx - w * tt_)
ident(D, '∇²φ = 0', sp.simplify(diff(phi, xx, 2) + diff(phi, zz2, 2)), 0)
ident(D, '∂φ/∂z = 0 en el fondo z = −h', diff(phi, zz2).subs(zz2, -hq), 0)
ident(D, 'cinemática: ∂η/∂t = ∂φ/∂z ⇒ aω = Bk sinh kh', sp.simplify((diff(eta_w, tt_) - diff(phi, zz2).subs(zz2, 0)) / sin(k * xx - w * tt_)), aa * w - B * k * sinh(k * hq))
ident(D, 'dinámica: ∂φ/∂t + gη = 0 ⇒ −Bω cosh kh + ga = 0', sp.simplify((diff(phi, tt_).subs(zz2, 0) + gg * eta_w) / cos(k * xx - w * tt_)), -B * w * cosh(k * hq) + gg * aa)
solves(D, 'dinámica: B = ga/(ω cosh kh)', [Eq(-B * w * cosh(k * hq) + gg * aa, 0)], B, gg * aa / (w * cosh(k * hq)))
ident(D, 'sustituir B en la cinemática: aω − Bk sinh kh = (a/ω)(ω² − gk tanh kh)', (aa * w - (gg * aa / (w * cosh(k * hq))) * k * sinh(k * hq)), (aa / w) * (w ** 2 - gg * k * tanh(k * hq)))
solves(D, 'ω² = gk tanh kh', [Eq((aa / w) * (w ** 2 - gg * k * tanh(k * hq)), 0)], w, sqrt(gg * k * tanh(k * hq)))
ident(D, 'límite aguas profundas: tanh kh → 1 ⇒ ω² = gk', limit(tanh(Symbol('u', positive=True)), Symbol('u', positive=True), oo), 1)
series_is(D, 'tanh u ≃ u − u³/3 (aguas someras)', tanh(Symbol('u')), Symbol('u'), 0, 4, Symbol('u') - Symbol('u') ** 3 / 3)
ident(D, 'aguas someras: ω² = ghk² ⇒ v = √(gh)', sqrt(gg * hq * k ** 2) / k, sqrt(gg * hq))
ident(D, 'aguas profundas: v = √(g/k) = √(gλ/2π)', sqrt(gg / (2 * pi / Symbol('lam', positive=True))), sqrt(gg * Symbol('lam', positive=True) / (2 * pi)))
vph = sqrt(gg * tanh(k * hq) / k)
ident(D, 'v_g = dω/dk = (v/2)(1 + 2kh/sinh 2kh)', diff(sqrt(gg * k * tanh(k * hq)), k), vph / 2 * (1 + 2 * k * hq / sinh(2 * k * hq)))
ident(D, 'aguas profundas: v_g → v/2', limit(1 + 2 * Symbol('u', positive=True) / sinh(2 * Symbol('u', positive=True)), Symbol('u', positive=True), oo) / 2, R_(1, 2))
ident(D, 'aguas someras: v_g → v', limit(1 + 2 * Symbol('u', positive=True) / sinh(2 * Symbol('u', positive=True)), Symbol('u', positive=True), 0) / 2, 1)
uW = {'omega': 'rad s^-1', 'k': 'm^-1', 'h': 'm', 'g': 'm s^-2', 'v': 'm s^-1', 'lam': 'm'}
vsym = Symbol('v', positive=True)
dimcheck(D, 'ω² = gk tanh(kh)', w ** 2, gg * k * tanh(k * hq), uW)
dimcheck(D, 'v = √(g tanh(kh)/k)', vsym, sqrt(gg * tanh(k * hq) / k), uW)
dimcheck(D, 'v = √(gh)', vsym, sqrt(gg * hq), uW)
dimcheck(D, 'v = √(gλ/2π)', vsym, sqrt(gg * Symbol('lam', positive=True) / (2 * pi)), uW)
# comprobaciones independientes con mpmath: raíz de la dispersión y velocidad de grupo por derivada numérica
mp.mp.dps = 30
def wave(lam, hh_):
    k_ = 2 * mp.pi / lam
    w_ = mp.findroot(lambda ww: ww ** 2 - mp.mpf(G0) * k_ * mp.tanh(k_ * hh_), mp.sqrt(mp.mpf(G0) * k_))
    vp_ = w_ / k_
    om = lambda kk: mp.sqrt(mp.mpf(G0) * kk * mp.tanh(kk * hh_))
    vg_ = mp.diff(om, k_)
    return float(vp_), float(vg_), float(k_ * hh_)
for (lam_, h_) in ((1e5, 4000), (2e5, 4000), (100, 4000), (100, 50), (100, 2), (10, 1)):
    vp_, vg_, kh_ = wave(lam_, h_)
    ref = math.sqrt(G0 / (2 * math.pi / lam_) * math.tanh(2 * math.pi / lam_ * h_))
    rec(G_STEP, D, f'raíz numérica de ω² = gk tanh kh (λ={lam_}, h={h_})', vp_, ref, 'rel 1e-12', abs(vp_ - ref) < 1e-12 * ref)
    kk_ = 2 * math.pi / lam_
    vg_ref = 0.5 * ref * (1 + 2 * kk_ * h_ / math.sinh(2 * kk_ * h_))
    rec(G_STEP, D, f'v_g numérica = ½v(1 + 2kh/sinh 2kh) (λ={lam_}, h={h_})', vg_, vg_ref, 'rel 1e-9', abs(vg_ - vg_ref) < 1e-9 * vg_ref)
wv = lambda lam_, h_: wave(lam_, h_)
num(D, 'v_p (λ = 100 km, h = 4000)', wv(1e5, 4000)[0], '196.013'); num(D, 'v_g', wv(1e5, 4000)[1], '192.004'); num(D, 'kh', wv(1e5, 4000)[2], '0.25133'); num(D, '√(gh)', math.sqrt(G0 * 4000), '198.057'); num(D, '√(gλ/2π)', math.sqrt(G0 * 1e5 / (2 * math.pi)), '395.07')
num(D, 'tsunami λ = 200 km: v', wv(2e5, 4000)[0], '197.5', tol=2e-4); num(D, 'tsunami: kh', wv(2e5, 4000)[2], '0.126', tol=0.01); num(D, 'tsunami: v (km/h) de √(gh)', math.sqrt(G0 * 4000) * 3.6, '713', tol=1e-3); num(D, 'travesía del Pacífico (h)', 1e7 / wv(2e5, 4000)[0] / 3600, '14', tol=0.02)
num(D, 'v a 10 m de profundidad', math.sqrt(G0 * 10), '9.9', tol=0.005)
num(D, 'oleaje 100 m profundo: v', wv(100, 4000)[0], '12.49', tol=1e-3); num(D, 'v_g', wv(100, 4000)[1], '6.25', tol=2e-3); num(D, 'h = 50: v', wv(100, 50)[0], '12.47', tol=1e-3); num(D, 'h = 50: v_g', wv(100, 50)[1], '6.38', tol=2e-3)
num(D, 'h = 2: v', wv(100, 2)[0], '4.417', tol=1e-3); num(D, 'h = 2: √(gh)', math.sqrt(G0 * 2), '4.429', tol=1e-3)
num(D, 'λ = 100 km, 4000 m: kh', wv(1e5, 4000)[2], '0.2513', tol=1e-3); num(D, 'v_p', wv(1e5, 4000)[0], '196.0', tol=1e-3); num(D, 'v_g', wv(1e5, 4000)[1], '192.0', tol=1e-3)
num(D, 'v_p inicial', wv(1e5, 4000)[0], '196.013'); num(D, 'v_g inicial', wv(1e5, 4000)[1], '192.004'); num(D, 'v(λ = 100 m, h = 4000)', wv(100, 4000)[0], '12.493')
lamq, hq2 = symbols('lam h', positive=True)
kq = 2 * pi / lamq
fs(D, 'vp', sqrt(Gs / kq * tanh(kq * hq2))); fs(D, 'vs', sqrt(Gs * hq2)); fs(D, 'vd', sqrt(Gs * lamq / (2 * pi))); fs(D, 'kh', 2 * pi * hq2 / lamq)
fs(D, 'vg', R_(1, 2) * sqrt(Gs / kq * tanh(kq * hq2)) * (1 + 2 * kq * hq2 / sinh(2 * kq * hq2)))
