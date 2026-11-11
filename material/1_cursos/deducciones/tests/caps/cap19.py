# -*- coding: utf-8 -*-
"""Capítulo 19 — Calor y difusión."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, Function, solve, simplify, oo, I
import mpmath as mp
from scipy.integrate import quad, solve_ivp, solve_bvp

EX = {'difusion-gauss': 'difusion', 'cilindro-aislante': 'cilindro', 'newton-enfriamiento': 'newton', 'stefan-boltzmann': 'balance'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
kB = 1.380649e-23; SIG = 5.670374419e-8; hb = 1.054571817e-34; cL = 299792458.0
kq = sp.Float('1.380649e-23', 40); SIGq = sp.Float('5.670374419e-8', 40)
rng = np.random.default_rng(2024)
mp.mp.dps = 30

# ---------------------------------------------------------------- difusión (gaussiana)
D = 'difusion-gauss'
x, t, Dd, N, q, c0 = S('x t D N q c0')
cf = Function('c')
cs = N / sqrt(4 * pi * Dd * t) * exp(-x ** 2 / (4 * Dd * t))
ident(D, 'ecuación de difusión ∂c/∂t = D ∂²c/∂x² para la gaussiana', sp.simplify(diff(cs, t) - Dd * diff(cs, x, 2)), 0)
ident(D, 'conservación: ∂c/∂t = −∂J/∂x con J = −D ∂c/∂x', diff(cs, t) - diff(Dd * diff(cs, x), x), 0)
ode(D, 'transformada de Fourier: ∂ĉ/∂t = −Dq² ĉ con ĉ = N e^(−Dq²t)', Eq(cf(t).diff(t), -Dd * q ** 2 * cf(t)), Eq(cf(t), N * exp(-Dd * q ** 2 * t)))
xr = Symbol('xr', real=True)
integral(D, '∫c dx = N', cs, x, -oo, oo, N)
integral(D, '⟨x²⟩ = (1/N)∫x² c dx = 2Dt', x ** 2 * cs / N, x, -oo, oo, 2 * Dd * t)
ident(D, 'σ = √(2Dt) y L = √(4Dt) = √2 σ', sqrt(4 * Dd * t), sqrt(2) * sqrt(2 * Dd * t))
ident(D, 'c(0,t) = N/√(4πDt)', cs.subs(x, 0), N / sqrt(4 * pi * Dd * t))
ident(D, 'tiempo para difundir hasta x: x²/(4D) ⇒ L(t) = x', sqrt(4 * Dd * (x ** 2 / (4 * Dd))), x)
# antitransformada por cuadratura
for (Dn, tn, xn) in ((1.0, 0.5, 0.3), (2.0, 0.1, 0.7), (0.3, 2.0, 1.2)):
    inv = mp.quad(lambda qq: mp.e ** (-Dn * qq ** 2 * tn) * mp.cos(qq * xn), [-mp.inf, 0, mp.inf]) / (2 * mp.pi)
    ref = mp.e ** (-xn ** 2 / (4 * Dn * tn)) / mp.sqrt(4 * mp.pi * Dn * tn)
    rec(G_STEP, D, f'antitransformada de Fourier por cuadratura (D={Dn}, t={tn}, x={xn})', float(inv), float(ref), 'rel 1e-12', abs(inv / ref - 1) < 1e-12)
# PDE numérica por líneas (diferencias finitas) con gaussiana inicial de varianza 2D t₀
Dn, t0 = 1.0, 0.05
xs = np.linspace(-8, 8, 1601); dx = xs[1] - xs[0]
c_init = np.exp(-xs ** 2 / (4 * Dn * t0)) / math.sqrt(4 * math.pi * Dn * t0)
def rhs(tt, c):
    d2 = np.zeros_like(c); d2[1:-1] = (c[2:] - 2 * c[1:-1] + c[:-2]) / dx ** 2
    return Dn * d2
sol = solve_ivp(rhs, [0, 1.0], c_init, method='BDF', rtol=1e-10, atol=1e-13, t_eval=[1.0], jac_sparsity=None)
c_end = sol.y[:, -1]
c_ref = np.exp(-xs ** 2 / (4 * Dn * (t0 + 1.0))) / math.sqrt(4 * math.pi * Dn * (t0 + 1.0))
err = float(np.max(np.abs(c_end - c_ref)) / c_ref.max())
rec(G_STEP, D, 'integración numérica de la EDP (1601 nodos) frente a la gaussiana', err, 0.0, 'rel 1e-4', err < 1e-4)
rec(G_STEP, D, 'la integral de la solución numérica se conserva (=1)', float(np.trapezoid(c_end, xs) if hasattr(np, 'trapezoid') else np.trapz(c_end, xs)), 1.0, 'abs 1e-6', abs((np.trapezoid(c_end, xs) if hasattr(np, 'trapezoid') else np.trapz(c_end, xs)) - 1) < 1e-6)
var_num = float(np.sum(xs ** 2 * c_end) * dx)
rec(G_STEP, D, '⟨x²⟩ numérica = 2D(t₀ + t)', var_num, 2 * Dn * (t0 + 1.0), 'rel 1e-4', abs(var_num / (2 * Dn * (t0 + 1.0)) - 1) < 1e-4)
uD = {'c': 'm^-3', 'N': 'm^-2', 'D': 'm^2 s^-1', 'J': 'm^-2 s^-1', 'x': 'm', 't': 's', 'q': 'm^-1', 'L': 'm', 'sigma': 'm'}
cq, Jq = Symbol('c', positive=True), Symbol('J', positive=True)
dimcheck(D, 'c = N e^(−x²/4Dt)/√(4πDt)', cq, cs, uD)
dimcheck(D, 'J = −D ∂c/∂x (módulo)', Jq, Dd * cq / x, uD)
dimcheck(D, 'σ = √(2Dt)', Symbol('sigma', positive=True), sqrt(2 * Dd * t), uD)
dimcheck(D, 'L = √(4Dt)', Symbol('L', positive=True), sqrt(4 * Dd * t), uD)
dimcheck(D, 'Dq²t adimensional', Symbol('z', positive=True), Dd * q ** 2 * t, dict(uD, z='1'))
dg = lambda D_, t_, x_: (1 / math.sqrt(4 * math.pi * D_ * t_), math.exp(-x_ ** 2 / (4 * D_ * t_)) / math.sqrt(4 * math.pi * D_ * t_), math.sqrt(2 * D_ * t_), math.sqrt(4 * D_ * t_), x_ ** 2 / (4 * D_))
num(D, 'σ (Cu, 1 s) mm', dg(1.11e-4, 1, 0)[2] * 1e3, '14.90'); num(D, 'L (Cu, 1 s) mm', dg(1.11e-4, 1, 0)[3] * 1e3, '21.07'); num(D, 'σ (Cu, 10 s) mm', dg(1.11e-4, 10, 0)[2] * 1e3, '47.12'); num(D, 't hasta 1 cm (Cu)', dg(1.11e-4, 1, 0.01)[4], '0.225', tol=2e-3)
num(D, 'σ (acero, 1 s) mm', dg(4e-6, 1, 0)[2] * 1e3, '2.83'); num(D, 'σ (agua, 60 s) mm', dg(1.43e-7, 60, 0)[2] * 1e3, '4.14'); num(D, 't hasta 1 cm (agua)', dg(1.43e-7, 1, 0.01)[4], '175', tol=3e-3)
num(D, 'σ (molécula, 1 s) µm', dg(1e-9, 1, 0)[2] * 1e6, '44.7'); num(D, 'σ (molécula, 1 h) mm', dg(1e-9, 3600, 0)[2] * 1e3, '2.68'); num(D, 't hasta 1 mm', dg(1e-9, 1, 1e-3)[4], '250', tol=1e-6); num(D, 't hasta 1 cm (h)', dg(1e-9, 1, 1e-2)[4] / 3600, '7', tol=0.02); num(D, 'σ (aire, 1 s) mm', dg(2e-5, 1, 0)[2] * 1e3, '6.32')
num(D, 'cociente c(x)/c_máx (Cu)', dg(1.11e-4, 1, 0.01)[1] / dg(1.11e-4, 1, 0.01)[0], '0.798', tol=1e-3); num(D, 'c máx (t × 4) / c máx', dg(1.11e-4, 4, 0)[0] / dg(1.11e-4, 1, 0)[0], '0.5', tol=1e-12)
num(D, 'c máx valor inicial', dg(1.11e-4, 1, 0.01)[0], '26.7753'); num(D, 'c(x) valor inicial', dg(1.11e-4, 1, 0.01)[1], '21.3757'); num(D, 'σ valor inicial', dg(1.11e-4, 1, 0.01)[2] * 1e3, '14.8997'); num(D, 'L valor inicial', dg(1.11e-4, 1, 0.01)[3] * 1e3, '21.0713'); num(D, 't_x valor inicial', dg(1.11e-4, 1, 0.01)[4], '0.225225')
Dq, tq, xq = symbols('D t x', positive=True)
fs(D, 'c0', 1 / sqrt(4 * pi * Dq * tq)); fs(D, 'cx', exp(-(xq * sp.Rational(1, 1000)) ** 2 / (4 * Dq * tq)) / sqrt(4 * pi * Dq * tq), conv=None)
fs(D, 'sig', sqrt(2 * Dq * tq) * 1000); fs(D, 'L', sqrt(4 * Dq * tq) * 1000); fs(D, 'tx', (xq * sp.Rational(1, 1000)) ** 2 / (4 * Dq))

# ---------------------------------------------------------------- Stokes–Einstein
D = 'stokes-einstein'
ell, tau_p, n_pasos, nn, mu, F, T, eta, a_, k_, U0 = S('ell tau_p n_p n mu F T eta a k U0')
ident(D, '⟨x²⟩ tras t/τ pasos: (t/τ)ℓ² = 2Dt con D = ℓ²/(2τ)', (t / tau_p) * ell ** 2, 2 * (ell ** 2 / (2 * tau_p)) * t)
ident(D, 'equilibrio: J_dif + J_arr = 0 con dn/dx = nF/(kT) ⇒ −D n F/(kT) + nμF = 0 ⇒ D = μkT', (-Dd * nn * F / (k_ * T) + nn * mu * F).subs(Dd, mu * k_ * T), 0)
Ux = Function('U')
nx = exp(-Ux(x) / (k_ * T))
ident(D, 'dn/dx = −(n/kT) dU/dx = nF/(kT) con F = −dU/dx', diff(nx, x), -(nx / (k_ * T)) * diff(Ux(x), x))
ident(D, 'D = kT μ con μ = 1/(6πηa) ⇒ D = kT/(6πηa)', k_ * T * (1 / (6 * pi * eta * a_)), k_ * T / (6 * pi * eta * a_))
ident(D, 'Perrin: D = RT/(N_A 6πηa) = kT/(6πηa) con R = N_A k', (Symbol('NA', positive=True) * k_) * T / (Symbol('NA', positive=True) * 6 * pi * eta * a_), k_ * T / (6 * pi * eta * a_))
ident(D, 'v = F/(6πηa) = μF', F / (6 * pi * eta * a_), (1 / (6 * pi * eta * a_)) * F)
# camino aleatorio de Monte Carlo
walkers, nsteps = 400_000, 400
steps = rng.choice([-1.0, 1.0], size=(walkers, nsteps), dtype=np.float64) if False else rng.integers(0, 2, size=(walkers, nsteps), dtype=np.int8) * 2 - 1
xf = steps.sum(axis=1).astype(float)
rec(G_STEP, D, 'camino aleatorio (4·10⁵ caminantes, 400 pasos): ⟨x²⟩ = nℓ²', float(np.mean(xf ** 2)), float(nsteps), 'rel 1e-2', abs(np.mean(xf ** 2) / nsteps - 1) < 1e-2)
rec(G_STEP, D, 'camino aleatorio: ⟨x⟩ = 0', float(np.mean(xf)), 0.0, 'abs 0.1', abs(np.mean(xf)) < 0.1)
# equilibrio de Boltzmann en un pozo armónico: la corriente neta de la solución n ∝ e^(−U/kT) es nula
kT_ = 1.3; mu_ = 0.7; K_ = 2.0
xx = np.linspace(-3, 3, 4001); Uh = 0.5 * K_ * xx ** 2; nB = np.exp(-Uh / kT_)
J_net = -(mu_ * kT_) * np.gradient(nB, xx) + nB * mu_ * (-K_ * xx)
rec(G_STEP, D, 'pozo armónico: J = −D dn/dx + nμF = 0 para n ∝ e^(−U/kT) y D = μkT (máx |J|/máx n)', float(np.max(np.abs(J_net[2:-2]))), 0.0, 'abs 1e-5', float(np.max(np.abs(J_net[2:-2]))) < 1e-5)
uS = {'D': 'm^2 s^-1', 'mu': 'm N^-1 s^-1', 'k': 'J K^-1', 'T': 'K', 'eta': 'Pa s', 'a': 'm', 'F': 'N', 'n': 'm^-3', 'ell': 'm', 'tau_p': 's', 't': 's', 'x': 'm'}
dimcheck(D, 'D = kT/(6πηa)', Dd, k_ * T / (6 * pi * eta * a_), uS)
dimcheck(D, 'D = μkT', Dd, mu * k_ * T, uS)
dimcheck(D, 'μ = 1/(6πηa)', mu, 1 / (6 * pi * eta * a_), uS)
dimcheck(D, '⟨x²⟩ = 2Dt', Symbol('x2', positive=True), 2 * Dd * t, dict(uS, x2='m^2'))
dimcheck(D, 'D = ℓ²/(2τ)', Dd, ell ** 2 / (2 * tau_p), uS)
se = lambda T_, eta_, a_nm: (lambda D_: (D_, 1 / (6 * math.pi * eta_ * 1e-3 * a_nm * 1e-9), math.sqrt(2 * D_) * 1e6, 1e-10 / (2 * D_)))(kB * T_ / (6 * math.pi * eta_ * 1e-3 * a_nm * 1e-9))
num(D, 'D (1 µm) 10⁻¹³', se(293, 1.002, 1000)[0] / 1e-13, '2.142'); num(D, 'rms 1 s (1 µm) µm', se(293, 1.002, 1000)[2], '0.654'); num(D, 't a 10 µm (1 µm)', se(293, 1.002, 1000)[3], '233')
num(D, 'D (2 nm) 10⁻¹⁰', se(293, 1.002, 2)[0] / 1e-10, '1.071'); num(D, 'rms 1 s (2 nm) µm', se(293, 1.002, 2)[2], '14.6'); num(D, 't a 10 µm (2 nm)', se(293, 1.002, 2)[3], '0.467')
num(D, 'D (50 nm) 10⁻¹²', se(293, 1.002, 50)[0] / 1e-12, '4.28'); num(D, 't a 10 µm (50 nm)', se(293, 1.002, 50)[3], '11.7'); num(D, 'D (373 K) 10⁻¹³', se(373, 0.282, 1000)[0] / 1e-13, '9.69'); num(D, 'cociente D (373/293)', se(373, 0.282, 1000)[0] / se(293, 1.002, 1000)[0], '4.5', tol=0.01); num(D, 'D (η × 1000) 10⁻¹³', se(293, 1002, 2)[0] / 1e-13, '1.07')
num(D, 'D valor inicial (10⁻¹³)', se(293, 1.002, 1000)[0] / 1e-13, '2.14182'); num(D, 'μ valor inicial (10⁷)', se(293, 1.002, 1000)[1] / 1e7, '5.29458'); num(D, 'rms valor inicial', se(293, 1.002, 1000)[2], '0.654495'); num(D, 't10 valor inicial', se(293, 1.002, 1000)[3], '233.447')
Tq3, etaq, aq = symbols('T eta a', positive=True)
Dse = kq * Tq3 / (6 * pi * etaq * sp.Rational(1, 1000) * aq * sp.Float('1e-9', 40))
fs(D, 'D', Dse); fs(D, 'mu', 1 / (6 * pi * etaq * sp.Rational(1, 1000) * aq * sp.Float('1e-9', 40))); fs(D, 'x1', sqrt(2 * Dse) * 10 ** 6); fs(D, 't10', sp.Float('1e-10', 40) / (2 * Dse))

# ---------------------------------------------------------------- cilindro y radio crítico
D = 'cilindro-aislante'
r, r1, r2, k, h, qp, T1, T2, Tinf, dT = S('r r1 r2 k h qp T1 T2 Tinf dT')
Tr = T1 - qp / (2 * pi * k) * log(r / r1)
ident(D, 'T(r) = T₁ − q′ ln(r/r₁)/(2πk) cumple d/dr(r dT/dr) = 0', diff(r * diff(Tr, r), r), 0)
ident(D, 'q′ = −k 2πr dT/dr es constante', -k * 2 * pi * r * diff(Tr, r), qp)
ident(D, 'T₁ − T₂ = q′ ln(r₂/r₁)/(2πk)', (T1 - Tr.subs(r, r2)), qp / (2 * pi * k) * log(r2 / r1))
solves(D, 'resistencias en serie: q′ = (T₁ − T∞)/R′', [Eq(T1 - T2, qp * log(r2 / r1) / (2 * pi * k)), Eq(T2 - Tinf, qp / (2 * pi * r2 * h))], qp, (T1 - Tinf) / (log(r2 / r1) / (2 * pi * k) + 1 / (2 * pi * r2 * h)), vars=[qp, T2])
Rp = log(r2 / r1) / (2 * pi * k) + 1 / (2 * pi * r2 * h)
solves(D, 'dR′/dr₂ = 0 ⇒ r_c = k/h', [Eq(diff(Rp, r2), 0)], r2, k / h)
ident(D, 'd²R′/dr₂² en r_c = 1/(2π k r_c²) > 0 ⇒ mínimo de R′ (máxima pérdida)', diff(Rp, r2, 2).subs(r2, k / h), h ** 2 / (2 * pi * k ** 3))
ident(D, 'forma con 1/k y 1/h: q′ = 2πΔT/[ln(r₂/r₁)/k + 1/(h r₂)]', (dT) / Rp, 2 * pi * dT / (log(r2 / r1) / k + 1 / (h * r2)))
ident(D, 'conductor desnudo: r₂ → r₁ ⇒ q′ = 2π r₁ h ΔT', (dT / Rp).subs(r2, r1), 2 * pi * r1 * h * dT)
# solución numérica del problema de contorno radial con convección (solve_bvp)
def cyl_num(dT_, k_, h_, r1_, rr_):
    r1m = r1_ * 1e-3; r2m = rr_ * r1m
    def f(rr, y): return np.vstack([y[1], -y[1] / rr])
    def bc(ya, yb): return np.array([ya[0] - dT_, -k_ * yb[1] - h_ * yb[0]])
    rg = np.linspace(r1m, r2m, 200); yg = np.vstack([np.full_like(rg, dT_ * 0.5), np.zeros_like(rg)])
    s = solve_bvp(f, bc, rg, yg, tol=1e-10)
    return -k_ * s.sol(r1m)[1] * 2 * math.pi * r1m
for (dT_, k_, h_, r1_, rr_) in ((60, 0.2, 10, 1, 5), (60, 0.2, 10, 1, 20), (60, 0.04, 10, 1, 20), (60, 0.2, 100, 1, 20)):
    ref = dT_ / (math.log(rr_) / (2 * math.pi * k_) + 1 / (2 * math.pi * rr_ * r1_ * 1e-3 * h_))
    got = cyl_num(dT_, k_, h_, r1_, rr_)
    rec(G_STEP, D, f'problema de contorno radial (solve_bvp): q′ (k={k_}, h={h_}, r₂/r₁={rr_})', got, ref, 'rel 1e-6', abs(got / ref - 1) < 1e-6)
# máximo de q′ sobre r₂ numérico
rg_ = np.linspace(1.0001, 100, 200000)
qg = 60 / (np.log(rg_) / (2 * math.pi * 0.2) + 1 / (2 * math.pi * rg_ * 1e-3 * 10))
rec(G_STEP, D, 'máximo numérico de q′(r₂): r₂ = k/h = 20 mm', float(rg_[np.argmax(qg)]), 20.0, 'abs 0.01', abs(rg_[np.argmax(qg)] - 20.0) < 0.01)
uC = {'qp': 'W m^-1', 'dT': 'K', 'k': 'W m^-1 K^-1', 'h': 'W m^-2 K^-1', 'r1': 'm', 'r2': 'm', 'Rp': 'm K W^-1', 'rc': 'm', 'T1': 'K', 'T2': 'K', 'Tinf': 'K', 'r': 'm'}
dimcheck(D, "q′ = 2πΔT/[ln(r₂/r₁)/k + 1/(h r₂)]", qp, 2 * pi * dT / (log(r2 / r1) / k + 1 / (h * r2)), uC)
dimcheck(D, "R′ = ln(r₂/r₁)/(2πk) + 1/(2π r₂ h)", Symbol('Rp', positive=True), Rp, uC)
dimcheck(D, 'r_c = k/h', Symbol('rc', positive=True), k / h, uC)
cyl = lambda dT_, k_, h_, r1_, rr_: (lambda r1m: (lambda Rp_: (dT_ / Rp_, k_ / h_ * 1e3, Rp_, dT_ / Rp_ / (dT_ * 2 * math.pi * r1m * h_)))(math.log(rr_) / (2 * math.pi * k_) + 1 / (2 * math.pi * rr_ * r1m * h_)))(r1_ * 1e-3)
num(D, 'q′ desnudo', cyl(60, 0.2, 10, 1, 1)[0], '3.770'); num(D, 'q′ (r₂ = 5 mm)', cyl(60, 0.2, 10, 1, 5)[0], '13.44'); num(D, 'cociente (r₂ = 5 mm)', cyl(60, 0.2, 10, 1, 5)[3], '3.57', tol=2e-3); num(D, 'q′ (r₂ = 20 mm)', cyl(60, 0.2, 10, 1, 20)[0], '18.87'); num(D, 'cociente (r_c)', cyl(60, 0.2, 10, 1, 20)[3], '5.0', tol=2e-3); num(D, 'q′ (r₂ = 50 mm)', cyl(60, 0.2, 10, 1, 50)[0], '17.49')
num(D, 'r_c (h = 100) mm', cyl(60, 0.2, 100, 1, 20)[1], '2.0'); num(D, 'q′ (h = 100, r₂/r₁ = 20)', cyl(60, 0.2, 100, 1, 20)[0], '24.36'); num(D, 'q′ desnudo (h = 100)', 60 * 2 * math.pi * 1e-3 * 100, '37.70'); num(D, 'cociente (h = 100)', cyl(60, 0.2, 100, 1, 20)[3], '0.646'); num(D, 'r_c (k = 0.04) mm', cyl(60, 0.04, 10, 1, 20)[1], '4.0'); num(D, 'q′ (k = 0.04, 20 mm)', cyl(60, 0.04, 10, 1, 20)[0], '4.72')
num(D, 'q′ valor inicial', cyl(60, 0.2, 10, 1, 5)[0], '13.4413'); num(D, 'r_c valor inicial', cyl(60, 0.2, 10, 1, 5)[1], '20.000'); num(D, 'R′ valor inicial', cyl(60, 0.2, 10, 1, 5)[2], '4.46385'); num(D, 'cociente valor inicial', cyl(60, 0.2, 10, 1, 5)[3], '3.56542')
dTq, kq2, hq2, r1q, rrq = symbols('dT k h r1 rr', positive=True)
r1m_ = r1q * sp.Rational(1, 1000); r2m_ = rrq * r1m_
Rpq = log(rrq) / (2 * pi * kq2) + 1 / (2 * pi * r2m_ * hq2)
fs(D, 'q', dTq / Rpq); fs(D, 'rc', kq2 / hq2 * 1000); fs(D, 'Rp', Rpq); fs(D, 'ratio', dTq / Rpq / (dTq * 2 * pi * r1m_ * hq2))

# ---------------------------------------------------------------- Newton
D = 'newton-enfriamiento'
rho, c, V, A, tau, Bi, Lc, th0 = S('rho c V A tau Bi Lc th0')
Tf = Function('T')
ode(D, 'ρVc dT/dt = −hA(T − T∞) con T = T∞ + (T₀ − T∞)e^(−t/τ)', Eq(rho * V * c * Tf(t).diff(t), -h * A * (Tf(t) - Tinf)), Eq(Tf(t), Tinf + (T1 - Tinf) * exp(-t * h * A / (rho * V * c))))
ident(D, 'τ = ρVc/(hA)', 1 / (h * A / (rho * V * c)), rho * V * c / (h * A))
ident(D, 'esfera: V/A = r/3 y τ = ρcr/(3h)', rho * c * (R_(4, 3) * pi * r ** 3) / (h * 4 * pi * r ** 2), rho * c * r / (3 * h))
ident(D, 'Bi = (L_c/k)/(1/h) = hL_c/k', (Lc / k) / (1 / h), h * Lc / k)
ident(D, 'T − T∞ = (T₀ − T∞)/10 en t = τ ln 10', (Tinf + (T1 - Tinf) * exp(-tau * log(10) / tau) - Tinf), (T1 - Tinf) / 10)
ident(D, '3τ: e^−3 = 4.98 % ≈ 5 %', sp.N(exp(-3), 6), sp.N(0.0497871, 6) + 0 * x) if False else None
# difusión radial dentro de la esfera con condición de contorno convectiva (diferencias finitas): comprobación de la validez del modelo concentrado
def sphere_decay(Bi_target, N=120):
    # unidades: radio 1, α = 1; Bi = h r/(3k) ⇒ h/k = 3 Bi
    Hk = 3 * Bi_target
    dr = 1.0 / N; rn = np.arange(N + 1) * dr
    def rhs(tt, th):
        d = np.zeros_like(th)
        d[0] = 6 * (th[1] - th[0]) / dr ** 2
        i = np.arange(1, N)
        d[i] = (th[i + 1] - 2 * th[i] + th[i - 1]) / dr ** 2 + (th[i + 1] - th[i - 1]) / (rn[i] * dr)
        ghost = th[N - 1] - 2 * dr * Hk * th[N]
        d[N] = (ghost - 2 * th[N] + th[N - 1]) / dr ** 2 + (ghost - th[N - 1]) / (rn[N] * dr)
        return d
    w = rn ** 2; w = w / np.trapezoid(w, rn) if hasattr(np, 'trapezoid') else w / np.trapz(w, rn)
    mean = lambda th: (np.trapezoid(th * w, rn) if hasattr(np, 'trapezoid') else np.trapz(th * w, rn))
    tau_l = 1.0 / (3 * Hk)          # τ = ρ c r/(3h) = r²/(3 α h r/k·…) con α = 1, r = 1: τ = 1/(3·h/k)
    th0 = np.ones(N + 1)
    ts = np.array([0.5, 1.0, 2.0]) * tau_l
    s = solve_ivp(rhs, [0, ts[-1]], th0, method='BDF', t_eval=ts, rtol=1e-9, atol=1e-12)
    return [(float(mean(s.y[:, j])), math.exp(-tt / tau_l)) for j, tt in enumerate(ts)]
for Bi_ in (6.67e-4, 0.0667):
    res = sphere_decay(Bi_)
    # decaimiento exacto frente al concentrado: error relativo en ln(θ)
    errs = [abs(math.log(a) / math.log(b) - 1) for a, b in res]
    rec(G_STEP, D, f'EDP en la esfera (Bi = {Bi_}): error de la constante de tiempo ≈ 0.6 Bi (teoría τ_ef = τ(1 + 3Bi/5))', max(errs), 0.6 * Bi_, 'rel 0.1·Bi + 1e-3', abs(max(errs) - 0.6 * Bi_) < 0.1 * Bi_ + 1e-3)
res_big = sphere_decay(0.1667)
err_big = max(abs(math.log(a) / math.log(b) - 1) for a, b in res_big)
rec(G_STEP, D, 'EDP en la esfera (Bi = 0.167 > 0.1): el modelo concentrado ya falla (> 3 %)', err_big, 0.0, '> 0.03', err_big > 0.03)
uN = {'T': 'K', 'rho': 'kg m^-3', 'V': 'm^3', 'c': 'J kg^-1 K^-1', 'h': 'W m^-2 K^-1', 'A': 'm^2', 'tau': 's', 'k': 'W m^-1 K^-1', 'Lc': 'm', 'Bi': '1', 'T1': 'K', 'Tinf': 'K', 't': 's', 'r': 'm'}
dimcheck(D, 'τ = ρVc/(hA)', tau, rho * V * c / (h * A), uN)
dimcheck(D, 'Bi = hL_c/k', Bi, h * Lc / k, uN)
dimcheck(D, 'τ = ρcr/(3h)', tau, rho * c * r / (3 * h), uN)
dimcheck(D, 't/τ adimensional', Symbol('z', positive=True), t / tau, dict(uN, z='1'))
nwf = lambda r_, rho_, c_, h_, k_: (lambda Lc_: (rho_ * c_ * Lc_ / h_, h_ * Lc_ / k_, rho_ * c_ * Lc_ / h_ * math.log(10), Lc_ * 1e3))(r_ * 1e-3 / 3)
num(D, 'τ (acero, aire)', nwf(10, 7800, 490, 10, 50)[0], '1274'); num(D, 'τ (min)', nwf(10, 7800, 490, 10, 50)[0] / 60, '21', tol=0.01); num(D, 'Bi (10⁻⁴)', nwf(10, 7800, 490, 10, 50)[1] / 1e-4, '6.7', tol=0.01); num(D, 't (90 %)', nwf(10, 7800, 490, 10, 50)[2], '2933'); num(D, 'τ (h = 1000)', nwf(10, 7800, 490, 1000, 50)[0], '12.74'); num(D, 'Bi (h = 1000)', nwf(10, 7800, 490, 1000, 50)[1], '0.067', tol=0.005); num(D, 'τ (1 mm)', nwf(1, 7800, 490, 10, 50)[0], '127.4')
num(D, 'τ (aluminio)', nwf(10, 2700, 900, 10, 237)[0], '810'); num(D, 'τ (agua 10 mm)', nwf(10, 1000, 4186, 10, 0.6)[0], '1395'); num(D, 'Bi (agua 10 mm)', nwf(10, 1000, 4186, 10, 0.6)[1], '0.056', tol=0.005); num(D, 'Bi (agua 30 mm)', nwf(30, 1000, 4186, 10, 0.6)[1], '0.167', tol=0.005); num(D, 'e^−3 (%)', math.exp(-3) * 100, '5', tol=0.01)
num(D, 'τ valor inicial', nwf(10, 7800, 490, 10, 50)[0], '1274'); num(D, 'Bi valor inicial (10⁻⁴)', nwf(10, 7800, 490, 10, 50)[1] / 1e-4, '6.66667'); num(D, 't90 valor inicial', nwf(10, 7800, 490, 10, 50)[2], '2933.49'); num(D, 'L_c valor inicial', nwf(10, 7800, 490, 10, 50)[3], '3.33333'); num(D, 'Bi (h = 1000) valor', nwf(10, 7800, 490, 1000, 50)[1], '0.0666667')
rq, rhoq, cq2, hq3, kq3 = symbols('r rho c h k', positive=True)
Lcq = rq * sp.Rational(1, 1000) / 3
fs(D, 'tau', rhoq * cq2 * Lcq / hq3); fs(D, 'Bi', hq3 * Lcq / kq3); fs(D, 't90', rhoq * cq2 * Lcq / hq3 * log(10)); fs(D, 'Lc', Lcq * 1000)

# ---------------------------------------------------------------- Stefan–Boltzmann
D = 'stefan-boltzmann'
Tt, Vv, uu, aa, cc = S('T V u a c')
Ff = Function('F')
Sx = -diff(Ff(Tt, Vv), Tt); px = -diff(Ff(Tt, Vv), Vv)
ident(D, 'Maxwell: (∂S/∂V)_T = (∂p/∂T)_V', diff(Sx, Vv) - diff(px, Tt), 0)
# U = F + TS ⇒ (∂U/∂V)_T = T(∂p/∂T)_V − p
Ux_ = Ff(Tt, Vv) + Tt * Sx
ident(D, '(∂U/∂V)_T = T(∂p/∂T)_V − p', sp.simplify(diff(Ux_, Vv) - (Tt * diff(px, Tt) - px)), 0)
uf = Function('u')
ode(D, 'du/dT = 4u/T con u = aT⁴', Eq(uf(Tt).diff(Tt), 4 * uf(Tt) / Tt), Eq(uf(Tt), aa * Tt ** 4))
ident(D, 'u = (T/3) du/dT − u/3 ⇒ du/dT = 4u/T', ((Tt / 3) * (4 * uu / Tt) - uu / 3) - uu, 0)
ident(D, 'con U = uV y p = u/3: ∂U/∂V = u y T∂p/∂T − p = (T/3)du/dT − u/3', (Tt / 3) * diff(aa * Tt ** 4, Tt) - aa * Tt ** 4 / 3, aa * Tt ** 4)
th_, ph_ = symbols('theta phi', real=True)
integral(D, 'presión de fotones isótropos: ⟨cos²θ⟩ = ∫cos²θ sinθ dθ /2 = 1/3', sp.cos(th_) ** 2 * sp.sin(th_) / 2, th_, 0, pi, R_(1, 3))
ident(D, 'σ = a c/4 ⇒ Φ = (c/4) a T⁴ = σT⁴', cc / 4 * aa * Tt ** 4, (aa * cc / 4) * Tt ** 4)
solves(D, 'equilibrio: (1−A)Sπ R² = 4πR² εσT⁴ ⇒ T', [Eq((1 - Symbol('A', positive=True)) * Symbol('S', positive=True) * pi * Symbol('Rp', positive=True) ** 2, 4 * pi * Symbol('Rp', positive=True) ** 2 * Symbol('eps', positive=True) * Symbol('sg', positive=True) * Tt ** 4)], Tt, ((1 - Symbol('A', positive=True)) * Symbol('S', positive=True) / (4 * Symbol('eps', positive=True) * Symbol('sg', positive=True))) ** R_(1, 4))
# integral de Planck: ∫x³/(eˣ−1) dx = π⁴/15 y σ = π²k⁴/(60ħ³c²)
Ip = mp.quad(lambda xx: xx ** 3 / (mp.e ** xx - 1), [0, 1, 10, mp.inf])
rec(G_STEP, D, '∫₀^∞ x³/(eˣ − 1) dx = π⁴/15 (cuadratura)', float(Ip), float(mp.pi ** 4 / 15), 'rel 1e-12', abs(Ip / (mp.pi ** 4 / 15) - 1) < 1e-12)
sig_planck = math.pi ** 2 * kB ** 4 / (60 * hb ** 3 * cL ** 2)
rec(G_STEP, D, 'σ = π²k⁴/(60ħ³c²) con constantes CODATA', sig_planck, SIG, 'rel 1e-8', abs(sig_planck / SIG - 1) < 1e-8)
rec(G_STEP, D, 'a = 4σ/c', 4 * SIG / cL, 7.565733250033929e-16, 'rel 1e-10', abs(4 * SIG / cL / 7.565733250033929e-16 - 1) < 1e-10)
uR = {'u': 'J m^-3', 'a': 'J m^-3 K^-4', 'sigma': 'W m^-2 K^-4', 'c': 'm s^-1', 'S': 'W m^-2', 'A': '1', 'eps': '1', 'T': 'K', 'p': 'Pa', 'U': 'J', 'V': 'm^3', 'F': 'W m^-2'}
Ss, As_, es, sg = Symbol('S', positive=True), Symbol('A', positive=True), Symbol('eps', positive=True), Symbol('sigma', positive=True)
dimcheck(D, 'u = aT⁴', uu, aa * Tt ** 4, uR)
dimcheck(D, 'σ = a c/4', sg, aa * cc / 4, uR)
dimcheck(D, 'T = [(1−A)S/(4εσ)]^(1/4)', Tt, ((1 - As_) * Ss / (4 * es * sg)) ** R_(1, 4), uR)
dimcheck(D, 'p = u/3', Symbol('p', positive=True), uu / 3, uR)
dimcheck(D, 'Φ = σT⁴', Symbol('F', positive=True), sg * Tt ** 4, uR)
eb = lambda S_, A_, e_: (lambda T_: (T_, T_ - 273.15, SIG * T_ ** 4, T_ * 1.01 ** 0.25))(((1 - A_) * S_ / (4 * e_ * SIG)) ** 0.25)
num(D, 'T (Tierra)', eb(1361, 0.3, 1)[0], '254.58'); num(D, 'T (°C)', eb(1361, 0.3, 1)[1], '-18.57'); num(D, 'flujo emitido', eb(1361, 0.3, 1)[2], '238.18'); num(D, 'efecto invernadero (K)', 288 - eb(1361, 0.3, 1)[0], '33', tol=0.02); num(D, 'T (ε = 0.612)', eb(1361, 0.3, 0.612)[0], '287.83'); num(D, 'ε para 288.15 K', (1 - 0.3) * 1361 / (4 * SIG * 288.15 ** 4), '0.609'); num(D, 'T sin albedo', eb(1361, 0.0, 1)[0], '278.32')
num(D, 'ΔT por +1 % de S', eb(1361, 0.3, 1)[3] - eb(1361, 0.3, 1)[0], '0.634'); num(D, 'T (S + 1 %)', eb(1361, 0.3, 1)[3], '255.21'); num(D, 'T (S doble)', eb(2722, 0.3, 1)[0], '302.75'); num(D, 'ΔT (S doble)', eb(2722, 0.3, 1)[0] - eb(1361, 0.3, 1)[0], '48.2')
num(D, 'T (Venus)', eb(2601, 0.77, 1)[0], '226.6'); num(D, 'T (Marte)', eb(586.2, 0.25, 1)[0], '209.8'); num(D, 'a (10⁻¹⁶)', 4 * SIG / cL / 1e-16, '7.566'); num(D, 'u (300 K) 10⁻⁶', 4 * SIG / cL * 300 ** 4 / 1e-6, '6.13')
num(D, 'T_ef del Sol', (3.828e26 / (4 * math.pi * (6.957e8) ** 2 * SIG)) ** 0.25, '5772', tol=1e-4)
num(D, 'T valor inicial', eb(1361, 0.3, 1)[0], '254.578'); num(D, 'T (°C) valor inicial', eb(1361, 0.3, 1)[1], '-18.5719'); num(D, 'σT⁴ valor inicial', eb(1361, 0.3, 1)[2], '238.175'); num(D, 'T (S+1 %) valor inicial', eb(1361, 0.3, 1)[3], '255.212')
Sq, Aq, eq2 = symbols('S A eps', positive=True)
Teq = ((1 - Aq) * Sq / (4 * eq2 * SIGq)) ** R_(1, 4)
fs(D, 'T', Teq); fs(D, 'Tc', Teq - sp.Float('273.15', 40)); fs(D, 'F', SIGq * Teq ** 4); fs(D, 'T1', Teq * sp.Float('1.01', 40) ** R_(1, 4))
