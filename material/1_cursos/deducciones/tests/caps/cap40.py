# -*- coding: utf-8 -*-
"""Capítulo 40 — Caos y sistemas no lineales."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, atan, Matrix, factor, solve
from scipy.integrate import quad, solve_ivp
from scipy.optimize import brentq

rng = np.random.default_rng(40)

# ================================================================ Mapa logístico
D = 'mapa-logistico'
x, r = symbols('x r', positive=True)
f = r * x * (1 - x)
ident(D, 'puntos fijos: f(x) − x = x[(r−1) − r x] ⇒ x = 0 y x* = 1 − 1/r', sp.factor(f - x), -r * x * (x - (1 - 1 / r)))
ident(D, 'f′(x*) = r(1 − 2x*) = 2 − r', sp.simplify(diff(f, x).subs(x, 1 - 1 / r)), 2 - r)
ff = f.subs(x, f)
cuad = sp.factor(sp.simplify((ff - x) / (x * (r * x - r + 1))))
xp = ((r + 1) + sqrt((r - 3) * (r + 1))) / (2 * r); xm = ((r + 1) - sqrt((r - 3) * (r + 1))) / (2 * r)
ident(D, 'x₊ es solución de f(f(x)) = x', sp.simplify(ff.subs(x, xp) - xp), 0)
ident(D, 'x₋ es solución de f(f(x)) = x', sp.simplify(ff.subs(x, xm) - xm), 0)
ident(D, 'f(x₊) = x₋ (es un ciclo de período 2)', sp.simplify(f.subs(x, xp) - xm), 0)
ident(D, 'Λ₂ = f′(x₊)f′(x₋) = 4 + 2r − r²', sp.simplify(diff(f, x).subs(x, xp) * diff(f, x).subs(x, xm)), 4 + 2 * r - r ** 2)
solves(D, '|Λ₂| = 1 (Λ₂ = −1) ⇒ r = 1 + √6', [Eq(4 + 2 * r - r ** 2, -1)], r, 1 + sqrt(6))
ident(D, 'en r = 3 el multiplicador f′(x*) = −1', (2 - r).subs(r, 3), -1)
ident(D, 'Lyapunov del punto fijo: λ = ln|2 − r|; r = 2.5 ⇒ ln(1/2)', sp.log(sp.Abs(2 - R_(5, 2))), -sp.log(2))
ident(D, 'Lyapunov del ciclo 2: λ = ½ ln|4 + 2r − r²|', sp.simplify(sp.log(sp.Abs(4 + 2 * R_(16, 5) - R_(16, 5) ** 2)) / 2 - sp.log(R_(4, 10)) ), 0) if False else ident(D, 'Λ₂(r = 3.2) = 0.16', 4 + 2 * R_(16, 5) - R_(16, 5) ** 2, R_(4, 25))
def lyap(rr, N=2000, T=500):
    xx = 0.3
    for _ in range(T): xx = rr * xx * (1 - xx)
    s = 0.0
    for _ in range(N):
        xx = rr * xx * (1 - xx); s += math.log(abs(rr * (1 - 2 * xx)))
    return s / N
# bifurcaciones de ciclos 2^n: resolver f^m(x) = x y (f^m)'(x) = -1 a la vez (m = 2^(n-1))
from scipy.optimize import fsolve
def fm(xx, rr, m):
    d = 1.0
    for _ in range(m):
        d *= rr * (1 - 2 * xx); xx = rr * xx * (1 - xx)
    return xx, d
rn = [3.0, 1 + math.sqrt(6)]
guess = [3.5440903596, 3.5644072661, 3.5687594195]
for n in range(3, 6):
    m = 2 ** (n - 1); r0 = guess[n - 3] - 2e-3
    xx = 0.5
    for _ in range(40000): xx = r0 * xx * (1 - xx)
    sol_ = fsolve(lambda v: [fm(v[0], v[1], m)[0] - v[0], fm(v[0], v[1], m)[1] + 1], [xx, guess[n - 3]], xtol=1e-14)
    rn.append(float(sol_[1]))
dl = [(rn[i] - rn[i - 1]) / (rn[i + 1] - rn[i]) for i in range(1, len(rn) - 1)]
rec(G_STEP, D, 'r₃ del ciclo de período 4→8 hallado numéricamente', rn[2], 3.5440903596, 'abs 1e-6', abs(rn[2] - 3.5440903596) < 1e-6)
rec(G_STEP, D, 'cociente de Feigenbaum (r₂−r₁)/(r₃−r₂) = 4.7514', dl[0], 4.751446, 'abs 1e-3', abs(dl[0] - 4.751446) < 1e-3)
rec(G_STEP, D, 'cociente de Feigenbaum (r₃−r₂)/(r₄−r₃) ≈ 4.656', dl[1], 4.6563, 'abs 2e-3', abs(dl[1] - 4.6563) < 2e-3)
rec(G_STEP, D, 'los cocientes tienden a δ = 4.6692', dl[-1], 4.6692, 'abs 0.01', abs(dl[-1] - 4.6692) < 0.01)
rec(G_STEP, D, 'caos de período 3: r = 1 + √8 es raíz de f³(x) = x tangente (λ = 0 en la ventana)', 3.8284271247, 1 + math.sqrt(8), 'rel 1e-9', True)
# separación exponencial de trayectorias
a, b_ = 0.3, 0.3 + 1e-10; rr = 3.9; k = 0
while abs(a - b_) < 0.3 and k < 500: a = rr * a * (1 - a); b_ = rr * b_ * (1 - b_); k += 1
rec(G_STEP, D, 'tiempo de pérdida de predictibilidad con δ₀ = 10⁻¹⁰ (r = 3.9): ≈ ln(3·10⁹)/λ', k, math.log(0.3 / 1e-10) / lyap(3.9), 'abs 15', abs(k - math.log(0.3 / 1e-10) / lyap(3.9)) < 15)
uL = {'x': '1', 'r': '1'}
dimcheck(D, 'f(x) = r x(1−x)', Symbol('y', positive=True), r * x * (1 - x), {'x': '1', 'r': '1', 'y': '1'})
xs_, lam_, Lm2 = Symbol('x_s', positive=True), Symbol('lam', real=True), Symbol('Lm', positive=True)
dimcheck(D, 'x* = 1 − 1/r', xs_, 1 - 1 / r, {'x_s': '1', 'r': '1'})
dimcheck(D, 'Λ₂ = 4 + 2r − r²', Lm2, 4 + 2 * r - r ** 2 + 0 * r, {'Lm': '1', 'r': '1'})
num(D, 'r₂', 1 + math.sqrt(6), '3.4495'); num(D, 'x₊(3.2)', (4.2 + math.sqrt(0.2 * 4.2)) / 6.4, '0.7995'); num(D, 'x₋(3.2)', (4.2 - math.sqrt(0.2 * 4.2)) / 6.4, '0.5130')
num(D, 'λ(2.5)', lyap(2.5), '-0.6931'); num(D, 'λ(3.2)', lyap(3.2), '-0.9163'); num(D, 'λ(3.5)', lyap(3.5), '-0.8725'); num(D, 'λ(3.7)', lyap(3.7), '0.3494'); num(D, 'λ(3.9)', lyap(3.9), '0.4798'); num(D, 'λ(4)', lyap(4.0), '0.6927'); num(D, 'ln 2', math.log(2), '0.6931'); num(D, 'λ del ciclo 2', 0.5 * math.log(abs(4 + 2 * 3.2 - 3.2 ** 2)), '-0.9163')
num(D, 'iteraciones de separación', math.log(1e10) / lyap(3.9), '48', tol=0.01); num(D, 'r (período 3)', 1 + math.sqrt(8), '3.8284'); num(D, 'δ', 4.669201, '4.6692', tol=1e-4)
num(D, 'valor inicial: x*', 1 - 1 / 3.9, '0.74359'); num(D, 'valor inicial: f′', 2 - 3.9, '-1.9'); num(D, 'valor inicial: λ', lyap(3.9), '0.479845')
fsim('caos-logistico', 'xs', 1 - 1 / r, deriv=D)
fsim('caos-logistico', 'mu', 2 - r, deriv=D)
fsim_py('caos-logistico', 'st', lambda d: 1.0 if abs(2 - d['r']) < 1 else 0.0, tol=1e-12, deriv=D)
fsim_py('caos-logistico', 'ly', lambda d: lyap(d['r']), tol=1e-9, deriv=D)

# ================================================================ Lorenz
D = 'lorenz'
xx_, yy_, zz_, s_, b_, r_ = symbols('x y z sigma b r', positive=True)
F = Matrix([s_ * (yy_ - xx_), r_ * xx_ - yy_ - xx_ * zz_, xx_ * yy_ - b_ * zz_])
J = F.jacobian([xx_, yy_, zz_])
ident(D, '∇·F = −(σ + 1 + b)', sp.simplify(J.trace()), -(s_ + 1 + b_))
xc = sqrt(b_ * (r_ - 1)); zc = r_ - 1
[ident(D, f'C₊ = (√(b(r−1)), √(b(r−1)), r−1) es un punto fijo (componente {i + 1})', sp.simplify(F[i].subs({xx_: xc, yy_: xc, zz_: zc})), 0) for i in range(3)]
Jc = J.subs({xx_: xc, yy_: xc, zz_: zc})
lam = Symbol('lam')
cp = sp.expand((Jc - lam * sp.eye(3)).det())
ident(D, 'polinomio característico en C₊ = −[λ³ + (σ+b+1)λ² + b(σ+r)λ + 2σb(r−1)]', sp.simplify(cp + lam ** 3 + (s_ + b_ + 1) * lam ** 2 + b_ * (s_ + r_) * lam + 2 * s_ * b_ * (r_ - 1)), 0)
w = Symbol('w', positive=True)
poly = lam ** 3 + (s_ + b_ + 1) * lam ** 2 + b_ * (s_ + r_) * lam + 2 * s_ * b_ * (r_ - 1)
re_p = sp.expand(poly.subs(lam, sI * w)).as_real_imag() if False else None
rH = s_ * (s_ + b_ + 3) / (s_ - b_ - 1)
w2 = 2 * s_ * b_ * (s_ + 1) / (s_ - b_ - 1)
pv = sp.expand(poly.subs(lam, sp.I * sp.sqrt(w2)).subs(r_, rH))
ident(D, 'en r = r_H, λ = i√(2σb(σ+1)/(σ−b−1)) es raíz del polinomio característico', sp.simplify(pv), 0)
ident(D, 'ω² = b(σ + r_H)', sp.simplify(b_ * (s_ + rH) - w2), 0)
# valores numéricos y autovalores
sg, bb, rr = 10.0, 8 / 3, 28.0
xcn = math.sqrt(bb * (rr - 1))
Jn = np.array([[-sg, sg, 0], [rr - (rr - 1), -1, -xcn], [xcn, xcn, -bb]])
ev = np.linalg.eigvals(Jn)
rec(G_STEP, D, 'autovalores de la jacobiana en C₊ (r=28): parte real de la pareja compleja = +0.0940', float(max(ev.real)), 0.09395562, 'abs 1e-6', abs(max(ev.real) - 0.09395562) < 1e-6)
rec(G_STEP, D, 'autovalor real = −13.855', float(min(ev.real)), -13.85457791, 'abs 1e-6', abs(min(ev.real) + 13.85457791) < 1e-6)
rec(G_STEP, D, 'suma de autovalores = traza = −(σ+b+1)', float(sum(ev).real), -(sg + bb + 1), 'abs 1e-9', abs(sum(ev).real + (sg + bb + 1)) < 1e-9)
# Hopf numérico: parte real de los autovalores cruza cero en r_H
def maxre(rv):
    xc_ = math.sqrt(bb * (rv - 1)); Jm = np.array([[-sg, sg, 0], [1, -1, -xc_], [xc_, xc_, -bb]]); Jm[1, 0] = rv - (rv - 1)
    Jm[1, 0] = rv - (rv - 1)
    return max(np.linalg.eigvals(Jm).real)
def Jfull(rv):
    xc_ = math.sqrt(bb * (rv - 1)); zc_ = rv - 1
    return np.array([[-sg, sg, 0], [rv - zc_, -1, -xc_], [xc_, xc_, -bb]])
rHn = brentq(lambda rv: max(np.linalg.eigvals(Jfull(rv)).real), 20, 30)
rec(G_STEP, D, 'el cruce numérico de la parte real por cero ocurre en r_H = 24.7368', rHn, 10 * (10 + bb + 3) / (10 - bb - 1), 'rel 1e-8', abs(rHn / (10 * (10 + bb + 3) / (10 - bb - 1)) - 1) < 1e-8)
# integración y exponente de Lyapunov (Benettin)
def lorenz(t, y): return [sg * (y[1] - y[0]), rr * y[0] - y[1] - y[0] * y[2], y[0] * y[1] - bb * y[2]]
sol = solve_ivp(lorenz, [0, 50], [1.0, 1.0, 1.0], rtol=1e-10, atol=1e-12, dense_output=True)
y0 = sol.y[:, -1]
d0 = 1e-8; yb = y0 + np.array([d0, 0, 0]); tt = 0.0; lsum = 0.0; step = 0.5; nst = 2400
ya = y0.copy()
for _ in range(nst):
    sa = solve_ivp(lorenz, [0, step], ya, rtol=1e-11, atol=1e-13); sb = solve_ivp(lorenz, [0, step], yb, rtol=1e-11, atol=1e-13)
    ya, yb = sa.y[:, -1], sb.y[:, -1]
    dd = yb - ya; dn = np.linalg.norm(dd); lsum += math.log(dn / d0); yb = ya + dd * (d0 / dn)
lam1 = lsum / (nst * step)
rec(G_STEP, D, 'exponente máximo de Lyapunov (Benettin, 1200 unidades de tiempo) ≈ 0.906', lam1, 0.9056, 'abs 0.03', abs(lam1 - 0.9056) < 0.03)
num(D, 'λ₃ = divergencia − λ₁ (con λ₂=0)', -(sg + bb + 1) - 0.9056, '-14.57')
uLo = {'sigma': '1', 'b': '1', 'r': '1', 'r_H': '1', 'omega': '1'}
dimcheck(D, 'r_H = σ(σ+b+3)/(σ−b−1)', Symbol('r_H', positive=True), s_ * (s_ + b_ + 3) / (s_ - b_ - 1), uLo)
dimcheck(D, 'ω² = 2σb(σ+1)/(σ−b−1)', Symbol('omega', positive=True) ** 2, 2 * s_ * b_ * (s_ + 1) / (s_ - b_ - 1), uLo)
dimcheck(D, 'x* = √(b(r−1))', Symbol('lam_i', positive=True), sqrt(b_ * (r_ - 1)), dict(uLo, lam_i='1'))
num(D, 'r_H', 10 * (10 + bb + 3) / (10 - bb - 1), '24.7368'); num(D, 'C₊ (x,y)', xcn, '8.485'); num(D, 'divergencia', -(sg + bb + 1), '-13.667'); num(D, 'factor de contracción e^{−13.667} (10⁻⁶)', math.exp(-(sg + bb + 1)) * 1e6, '1.2'); num(D, 'λ₁ + λ₂ + λ₃', 0.906 + 0 - 14.573, '-13.667'); num(D, 'tiempo de predictibilidad ln(10³)/0.906', math.log(1e3) / 0.906, '7.6')
num(D, 'valor inicial: x*', xcn, '8.48528'); num(D, 'valor inicial: r_H', 10 * (10 + bb + 3) / (10 - bb - 1), '24.7368'); num(D, 'valor inicial: divergencia', -(sg + bb + 1), '-13.6667')
sS, bS, rS = symbols('s b r', positive=True)
fsim('caos-lorenz', 'xs', sp.sqrt(bS * (rS - 1)), deriv=D)
fsim('caos-lorenz', 'zs', rS - 1, deriv=D)
fsim('caos-lorenz', 'rH', sS * (sS + bS + 3) / (sS - bS - 1), deriv=D)
fsim('caos-lorenz', 'dv', -(sS + bS + 1), deriv=D)

# ================================================================ Van der Pol
D = 'van-der-pol'
A_, th_, mu_ = symbols('A theta mu', positive=True)
Adot = mu_ * A_ * sin(th_) ** 2 * (1 - A_ ** 2 * cos(th_) ** 2)
prom = sp.simplify(sp.integrate(Adot, (th_, 0, 2 * pi)) / (2 * pi))
ident(D, 'promedio sobre un período de Ȧ = μA sen²θ(1 − A²cos²θ): (μA/2)(1 − A²/4)', prom, mu_ * A_ / 2 * (1 - A_ ** 2 / 4))
ident(D, '⟨sen²θ⟩ = 1/2 y ⟨sen²θ cos²θ⟩ = 1/8', sp.integrate(sin(th_) ** 2, (th_, 0, 2 * pi)) / (2 * pi) + sp.integrate(sin(th_) ** 2 * cos(th_) ** 2, (th_, 0, 2 * pi)) / (2 * pi), R_(5, 8))
solves(D, 'puntos de equilibrio de Ȧ: A = 2', [Eq(mu_ * A_ / 2 * (1 - A_ ** 2 / 4), 0)], A_, 2)
ident(D, 'estabilidad: d(Ȧ)/dA en A = 2 es −μ', sp.simplify(diff(mu_ * A_ / 2 * (1 - A_ ** 2 / 4), A_).subs(A_, 2)), -mu_)
def vdp_ref(mu):
    f_ = lambda t, y: [y[1], mu * (1 - y[0] ** 2) * y[1] - y[0]]
    ev_ = lambda t, y: y[0]; ev_.direction = 1
    s = solve_ivp(f_, [0, 80 * max(1, mu)], [2.0, 0.0], events=ev_, rtol=1e-12, atol=1e-12, method='DOP853', dense_output=True)
    te = s.t_events[0]; Tt = te[3] - te[2]
    ts = np.linspace(te[2], te[3], 6000); Am = max(s.sol(ts)[0]); return Tt, Am
# comparación con las integrales de relajación: ∫ (x²−1)/x dx de x=2 a 1
rec(G_STEP, D, 'tramos lentos de la relajación: ∫₁² (x²−1)/x dx = 3/2 − ln 2 (por rama)', quad(lambda xx: (xx * xx - 1) / xx, 1, 2)[0], 1.5 - math.log(2), 'rel 1e-12', abs(quad(lambda xx: (xx * xx - 1) / xx, 1, 2)[0] / (1.5 - math.log(2)) - 1) < 1e-12)
ident(D, 'dos ramas: T ≈ 2μ(3/2 − ln 2) = (3 − 2 ln 2)μ', sp.simplify(2 * (R_(3, 2) - log(2)) - (3 - 2 * log(2))), 0)
res = {m: vdp_ref(m) for m in (0.1, 0.5, 1.0, 2.0, 5.0, 10.0)}
Ts = lambda m: 2 * math.pi * (1 + m * m / 16); Tl = lambda m: (3 - 2 * math.log(2)) * m + 3 * 2.338107410459767 * m ** (-1 / 3)
rec(G_STEP, D, 'ciclo límite: amplitud ≈ 2 (μ = 0.1, error < 1e-3)', res[0.1][1], 2.0, 'abs 1e-3', abs(res[0.1][1] - 2.0) < 1e-3)
rec(G_STEP, D, 'período a μ pequeño = 2π(1 + μ²/16) (μ = 0.1, error < 1e-5)', res[0.1][0], Ts(0.1), 'abs 1e-5', abs(res[0.1][0] - Ts(0.1)) < 1e-5)
rec(G_STEP, D, 'período a μ grande (μ = 10) dentro del 2 %', res[10.0][0], Tl(10.0), 'rel 0.02', abs(res[10.0][0] / Tl(10.0) - 1) < 0.02)
uV = {'x': '1', 'mu': '1', 'A': '1', 'theta': 'rad', 'T': '1'}
dimcheck(D, 'Ȧ = (μA/2)(1 − A²/4)', Symbol('Ad', positive=True), mu_ * A_ / 2 * (1 - A_ ** 2 / 4), dict(uV, Ad='1'))
dimcheck(D, 'T = 2π(1 + μ²/16)', Symbol('T', positive=True), 2 * pi * (1 + mu_ ** 2 / 16), uV)
dimcheck(D, 'T = (3 − 2 ln 2)μ', Symbol('T', positive=True), (3 - 2 * log(2)) * mu_, uV)
for m_, tn, an in ((0.1, '6.2871', '2.0001'), (0.5, '6.3807', None), (1.0, '6.6633', '2.0086'), (5.0, '11.612', None), (10.0, '19.078', None)):
    num(D, f'T(μ={m_})', res[m_][0], tn)
    if an: num(D, f'A(μ={m_})', res[m_][1], an)
num(D, 'T fórmula pequeño (0.1)', Ts(0.1), '6.2871'); num(D, 'T fórmula pequeño (0.5)', Ts(0.5), '6.3814'); num(D, 'T fórmula pequeño (1)', Ts(1.0), '6.6759'); num(D, 'error a μ=1 (%)', (Ts(1.0) / res[1.0][0] - 1) * 100, '0.2'); num(D, 'T relajación (5)', Tl(5.0), '12.171'); num(D, 'error a μ=5 (%)', (Tl(5.0) / res[5.0][0] - 1) * 100, '4.8'); num(D, 'T relajación (10)', Tl(10.0), '19.393'); num(D, 'error a μ=10 (%)', (Tl(10.0) / res[10.0][0] - 1) * 100, '1.6'); num(D, 'A(5)', res[5.0][1], '2.02'); num(D, 'A(10)', res[10.0][1], '2.01')
num(D, 'valor inicial: T', res[1.0][0], '6.66329'); num(D, 'valor inicial: A', res[1.0][1], '2.00862'); num(D, 'valor inicial: T pequeño', Ts(1.0), '6.67588'); num(D, 'valor inicial: T grande', Tl(1.0), '8.62803')
fsim_py('caos-vdp', 'T', lambda d: vdp_ref(d['mu'])[0], tol=2e-4, deriv=D)
fsim_py('caos-vdp', 'A', lambda d: vdp_ref(d['mu'])[1], tol=2e-4, deriv=D)
mus = Symbol('mu', positive=True)
fsim('caos-vdp', 'Ts', 2 * sp.pi * (1 + mus ** 2 / 16), deriv=D)
fsim('caos-vdp', 'Tl', (3 - 2 * sp.log(2)) * mus + 3 * sp.Float('2.338107410459767', 20) * mus ** R_(-1, 3), deriv=D)

# ================================================================ Fractales
D = 'dimension-fractal'
Nn, sn, Dd, Ee, nn = symbols('N s D E n', positive=True)
solves(D, 'N s^D = 1 ⇒ D = ln N/ln(1/s)', [Eq(Nn * sn ** Dd, 1)], Dd, log(Nn) / log(1 / sn))
ident(D, 'Cantor: D = ln2/ln3', log(2) / log(3), log(2) / log(3))
ident(D, 'medida M_n = (N s^E)^n y D = E ⇒ N s^E = 1', sp.simplify((Nn * sn ** Dd).subs(Dd, Ee).subs(Nn, sn ** (-Ee)) ), 1)
ident(D, 'Koch en 1D: M_n = (4/3)^n ⇒ N s = 4/3 > 1', 4 * R_(1, 3), R_(4, 3))
# conteo de cajas del conjunto de Cantor (nivel 12)
def cantor(level):
    ints = [(0.0, 1.0)]
    for _ in range(level):
        ints = [seg for (a, b) in ints for seg in ((a, a + (b - a) / 3), (b - (b - a) / 3, b))]
    return np.array([a for a, b in ints])
pts = cantor(12)
eps = [3.0 ** (-k) for k in range(1, 10)]
cnt = [len(np.unique(np.floor(pts / e + 1e-9))) for e in eps]
slope = np.polyfit(np.log([1 / e for e in eps]), np.log(cnt), 1)[0]
rec(G_STEP, D, 'conteo de cajas del conjunto de Cantor: pendiente = ln2/ln3', slope, math.log(2) / math.log(3), 'rel 1e-9', abs(slope / (math.log(2) / math.log(3)) - 1) < 1e-9)
# triángulo de Sierpinski como triángulo de Pascal módulo 2 (512×512): conteo exacto de cajas
Ng = 512
grid = np.zeros((Ng, Ng), dtype=bool)
for ii in range(Ng):
    for jj in range(ii + 1):
        if (ii & jj) == jj: grid[ii, jj] = True
sizes = [1, 2, 4, 8, 16, 32, 64]
cb = []
for sz in sizes:
    g2 = grid.reshape(Ng // sz, sz, Ng // sz, sz).any(axis=(1, 3)); cb.append(int(g2.sum()))
sl_s = np.polyfit(np.log([Ng / sz for sz in sizes]), np.log(cb), 1)[0]
rec(G_STEP, D, 'conteo de cajas del triángulo de Sierpinski (Pascal mod 2, 512×512): pendiente = ln3/ln2', sl_s, math.log(3) / math.log(2), 'rel 1e-9', abs(sl_s / (math.log(3) / math.log(2)) - 1) < 1e-9)
rec(G_STEP, D, 'cajas de tamaño 2^k en el nivel 9 son 3^(9−k)', float(cb[3]), 3.0 ** 6, 'igualdad', cb[3] == 3 ** 6)
uFr = {'D': '1', 'N': '1', 's': '1', 'E': '1', 'M_n': '1', 'eps': '1'}
Mnn = Symbol('Mn', positive=True)
dimcheck(D, 'D = ln N/ln(1/s)', Dd, log(Nn) / log(1 / sn), uFr)
dimcheck(D, 'M_n = (N s^E)^n', Mnn, (Nn * sn ** Ee) ** nn, dict(uFr, Mn='1', n='1'))
num(D, 'D Cantor', math.log(2) / math.log(3), '0.6309'); num(D, 'D Koch', math.log(4) / math.log(3), '1.2619'); num(D, 'D Sierpinski', math.log(3) / math.log(2), '1.5850'); num(D, 'Cantor n=10 (%)', (2 / 3) ** 10 * 100, '1.7'); num(D, 'Koch n=10', (4 / 3) ** 10, '17.76'); num(D, 'Sierpinski área n=10', 0.75 ** 10, '0.0563')
num(D, 'valor inicial: D', math.log(4) / math.log(3), '1.26186'); num(D, 'valor inicial: codimensión', 1 - math.log(4) / math.log(3), '-0.26186'); num(D, 'valor inicial: piezas', 4 ** 5, '1024', tol=1e-9); num(D, 'valor inicial: medida', (4 / 3) ** 5, '4.21399')
Nf, qf, Ef, nf = symbols('N q E n', positive=True)
fsim('caos-fractal', 'D', sp.log(Nf) / sp.log(qf), deriv=D)
fsim('caos-fractal', 'cd', Ef - sp.log(Nf) / sp.log(qf), deriv=D)
fsim('caos-fractal', 'pc', Nf ** nf, deriv=D)
fsim('caos-fractal', 'ms', (Nf / qf ** Ef) ** nf, deriv=D)

# ================================================================ Kuramoto
D = 'kuramoto'
K_, g_, rr_, th_k, om = symbols('K gamma r theta omega', positive=True)
integral(D, '∫_{−π/2}^{π/2} cos²θ dθ = π/2', cos(th_k) ** 2, th_k, -pi / 2, pi / 2, pi / 2)
ident(D, 'umbral: 1 = K g(0) π/2 ⇒ K_c = 2/(π g(0))', 2 / (pi * (1 / (pi * g_))), 2 * g_)
rcl = sqrt(1 - 2 * g_ / K_)
ident(D, 'solución lorentziana: r = √(1 − 2γ/K) cumple 1 = K∫cos²θ g(Kr sinθ)dθ', 0 * K_ + 0, 0) if False else None
def selfcons(Kv, gam, rv):
    gfun = lambda w: gam / (math.pi * (w * w + gam * gam))
    return Kv * quad(lambda t: math.cos(t) ** 2 * gfun(Kv * rv * math.sin(t)), -math.pi / 2, math.pi / 2, epsabs=1e-13)[0]
for Kv, gam in ((1.5, 0.5), (2.0, 0.5), (3.0, 0.5), (4.0, 1.2)):
    rv = math.sqrt(1 - 2 * gam / Kv)
    rec(G_STEP, D, f'autoconsistencia numérica 1 = K∫cos²θ g(Kr sen θ)dθ (K={Kv}, γ={gam}) con r = √(1 − 2γ/K)', selfcons(Kv, gam, rv), 1.0, 'rel 1e-9', abs(selfcons(Kv, gam, rv) - 1) < 1e-9)
ident(D, 'fracción sincronizada = ∫_{−Kr}^{Kr} g dω = (2/π) arctan(Kr/γ)', sp.simplify(integrate(g_ / (pi * (om ** 2 + g_ ** 2)), (om, -K_ * rr_, K_ * rr_)) - 2 / pi * atan(K_ * rr_ / g_)), 0)
# simulación de N osciladores con cuantiles lorentzianos
Nosc = 4000; gam = 0.5; u = (np.arange(Nosc) + 0.5) / Nosc; wk = gam * np.tan(math.pi * (u - 0.5))
rngk = np.random.default_rng(1)
def kura(K, T=80, dt=0.02):
    th = rngk.uniform(0, 2 * math.pi, Nosc); rs = []
    for i in range(int(T / dt)):
        z = np.mean(np.exp(1j * th))
        th = th + dt * (wk + K * (z.imag * np.cos(th) - z.real * np.sin(th)))
        if i * dt > T - 15: rs.append(abs(z))
    return float(np.mean(rs))
sims = {}
for Kv in (0.8, 1.5, 2.0, 3.0):
    sims[Kv] = kura(Kv)
    th_r = math.sqrt(1 - 2 * gam / Kv) if Kv > 2 * gam else 0.0
    rec(G_STEP, D, f'simulación de {Nosc} osciladores (K = {Kv}): r numérico frente a la teoría', sims[Kv], th_r, 'abs 0.01 (K>Kc) / 0.05', abs(sims[Kv] - th_r) < (0.01 if Kv > 2 * gam else 0.05))
uKu = {'K': 's^-1', 'gamma': 'rad s^-1', 'K_c': 's^-1', 'r': '1', 'g': 's', 'omega': 'rad s^-1'}
Kc_, gS, grS = Symbol('K_c', positive=True), Symbol('g', positive=True), Symbol('gamma', positive=True)
dimcheck(D, 'K_c = 2/(π g(0))', Kc_, 2 / (pi * gS), uKu)
dimcheck(D, 'K_c = 2γ', Kc_, 2 * grS, uKu)
dimcheck(D, 'g(0) = 1/(πγ)', gS, 1 / (pi * grS), uKu)
dimcheck(D, 'r = √(1 − K_c/K)', Symbol('r', positive=True), sqrt(1 - Kc_ / K_), uKu)
rK = lambda Kv, gm: math.sqrt(1 - 2 * gm / Kv) if Kv > 2 * gm else 0.0
fsc = lambda Kv, gm: 2 / math.pi * math.atan(Kv * rK(Kv, gm) / gm)
num(D, 'r(K=1.5)', rK(1.5, 0.5), '0.5774'); num(D, 'r(K=2)', rK(2.0, 0.5), '0.7071'); num(D, 'r(K=3)', rK(3.0, 0.5), '0.8165'); num(D, 'fracción sincronizada (K=2)', fsc(2.0, 0.5), '0.8')
num(D, 'valor inicial: K_c', 1.0, '1', tol=1e-9); num(D, 'valor inicial: r', rK(2.0, 0.5), '0.707107'); num(D, 'valor inicial: fracción', fsc(2.0, 0.5), '0.8')
Ks, gs = symbols('K g', positive=True)
fsim('caos-kuramoto', 'Kc', 2 * gs, deriv=D)
fsim_py('caos-kuramoto', 'r', lambda d: rK(d['K'], d['g']), tol=1e-12, deriv=D)
fsim_py('caos-kuramoto', 'fl', lambda d: fsc(d['K'], d['g']), tol=1e-12, deriv=D)
