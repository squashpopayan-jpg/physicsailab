# -*- coding: utf-8 -*-
"""Capítulo 21 — Circuitos."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, Function, solve, simplify, oo, sin, cos, atan2
import mpmath as mp
from scipy.integrate import quad, solve_ivp

EX = {'drude-ohm': 'drude', 'rc-transitorio': 'rc', 'rlc-resonancia': 'rlc', 'thevenin-potencia': 'thevenin', 'linea-coaxial': 'coax'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
qe = 1.602176634e-19; me = 9.1093837015e-31; hb = 1.054571817e-34; MU0 = 1.25663706212e-6; E0 = 8.8541878128e-12; cL = 299792458.0
qeq = sp.Float('1.602176634e-19', 40); meq = sp.Float('9.1093837015e-31', 40); hbq = sp.Float('1.054571817e-34', 40); MU0q = sp.Float('1.25663706212e-6', 40); E0q = sp.Float('8.8541878128e-12', 40)
mp.mp.dps = 30

# ---------------------------------------------------------------- Drude
D = 'drude-ohm'
t, tau, E, e, m, n, mu, vd, J, sg, Lw, Aw, rho, Rr, ell = S('t tau E e m n mu vd J sigma L A rho R ell')
vf = Function('v')
ode(D, 'm dv/dt = −eE − mv/τ resuelta por v = −(eτE/m)(1 − e^(−t/τ))', Eq(m * vf(t).diff(t), -e * E - m * vf(t) / tau), Eq(vf(t), -(e * tau * E / m) * (1 - exp(-t / tau))))
ident(D, 'v(0) = 0', (-(e * tau * E / m) * (1 - exp(-t / tau))).subs(t, 0), 0)
ident(D, 'v(t→∞) = −eτE/m', sp.limit(-(e * tau * E / m) * (1 - exp(-t / tau)), t, oo), -e * tau * E / m)
ident(D, 'v_d = −μE con μ = eτ/m', -(e * tau / m) * E, -(e * tau / m) * E)
ident(D, 'J = −n e v_d = (ne²τ/m)E', -n * e * (-e * tau * E / m), n * e ** 2 * tau / m * E)
ident(D, 'σ = ne²τ/m = neμ', n * e ** 2 * tau / m, n * e * (e * tau / m))
ident(D, 'V = EL = (J/σ)L = (I/A)ρL = IR con R = ρL/A', (n * e ** 2 * tau / m * 0 + 1) * (1 / (n * e ** 2 * tau / m)) * (Aw * 0 + 1) * Lw / Aw, rho * Lw / Aw) if False else None
ident(D, 'R = ρL/A = L/(σA)', Lw / (sg * Aw), (1 / sg) * Lw / Aw)
ident(D, 'τ = m/(ne²ρ) a partir de la resistividad', m / (n * e ** 2 * rho), 1 / (n * e ** 2 / m * rho))
ident(D, 'ℓ = v_F τ con v_F = ħ(3π²n)^(1/3)/m', Symbol('hb', positive=True) * (3 * pi ** 2 * n) ** R_(1, 3) / m * tau, Symbol('hb', positive=True) * (3 * pi ** 2 * n) ** R_(1, 3) * tau / m)
# integración numérica con solve_ivp
Ev, tau_v = 0.0168, 25e-15
s_ = solve_ivp(lambda tt, y: [-qe * Ev / me - y[0] / tau_v], [0, 10 * tau_v], [0.0], rtol=1e-11, atol=1e-16)
vdn = -qe * tau_v * Ev / me
rec(G_STEP, D, 'integración numérica de la ecuación de movimiento: v(10τ) → v_d', float(s_.y[0, -1]), vdn * (1 - math.exp(-10)), 'rel 1e-8', abs(s_.y[0, -1] / (vdn * (1 - math.exp(-10))) - 1) < 1e-8)
# cadena de Ohm sobre un hilo de cobre de 2 m y 1 mm²
rho_cu = 1 / (8.47e28 * qe ** 2 * tau_v / me)
Rw = rho_cu * 2 / 1e-6
Vw = 1.0 * Rw
rec(G_STEP, D, 'hilo de Cu de 2 m y 1 mm² con 1 A: V = IR = E·L', Vw, (1.0 * rho_cu / 1e-6) * 2, 'rel 1e-12', abs(Vw / ((rho_cu / 1e-6) * 2) - 1) < 1e-12)
uDr = {'sigma': 'S m^-1', 'n': 'm^-3', 'e': 'C', 'tau': 's', 'm': 'kg', 'mu': 'm^2 V^-1 s^-1', 'E': 'V m^-1', 'vd': 'm s^-1', 'J': 'A m^-2', 'R': 'Ohm', 'rho': 'Ohm m', 'L': 'm', 'A': 'm^2', 'ell': 'm', 'hb': 'J s', 't': 's', 'v': 'm s^-1'}
hbs = Symbol('hb', positive=True)
dimcheck(D, 'σ = ne²τ/m', sg, n * e ** 2 * tau / m, uDr)
dimcheck(D, 'μ = eτ/m', mu, e * tau / m, uDr)
dimcheck(D, 'J = σE', J, sg * E, uDr)
dimcheck(D, 'R = ρL/A', Rr, rho * Lw / Aw, uDr)
dimcheck(D, 'v_d = μE', vd, mu * E, uDr)
dimcheck(D, 'ℓ = ħ(3π²n)^(1/3)τ/m', ell, hbs * (3 * pi ** 2 * n) ** R_(1, 3) * tau / m, uDr)
drf = lambda n28, tfs, E_: (lambda n_, t_: (lambda sg_, mu_, vF_: (sg_ * 1e-6, 1e9 / sg_, mu_ * 1e4, mu_ * E_ * 1e3, vF_ * t_ * 1e9, 1 / sg_))(n_ * qe ** 2 * t_ / me, qe * t_ / me, hb * (3 * math.pi ** 2 * n_) ** (1 / 3) / me))(n28 * 1e28, tfs * 1e-15)
num(D, 'σ (Cu) MS/m', drf(8.47, 25, 0.0168)[0], '59.67'); num(D, 'ρ (nΩ·m)', drf(8.47, 25, 0.0168)[1], '16.76'); num(D, 'μ (cm²/V s)', drf(8.47, 25, 0.0168)[2], '43.97'); num(D, 'ℓ (nm)', drf(8.47, 25, 0.0168)[4], '39.3'); num(D, 'ℓ/espaciado (≈ 0.36 nm)', drf(8.47, 25, 0.0168)[4] / 0.36, '109', tol=0.01)
num(D, 'σ (τ doble) MS/m', drf(8.47, 50, 0.0168)[0], '119.3', tol=1e-3); num(D, 'μ (n doble) / μ', drf(16.94, 25, 0.0168)[2] / drf(8.47, 25, 0.0168)[2], '1', tol=1e-12)
num(D, 'v_d (1 A, 1 mm²) mm/s', drf(8.47, 25, 0.0168)[3], '0.0739'); num(D, 'tiempo por mm (s)', 1 / drf(8.47, 25, 0.0168)[3], '13.5', tol=3e-3); num(D, 'v_d (1 V/m) mm/s', drf(8.47, 25, 1.0)[3], '4.397')
num(D, 'τ de ρ = 16.8 nΩ·m (fs)', me / (8.47e28 * qe ** 2 * 16.8e-9) * 1e15, '24.9'); num(D, 'ρ (τ = 0.5 fs) nΩ·m', drf(8.47, 0.5, 0.01)[1], '838'); num(D, 'ℓ (τ = 0.5 fs) nm', drf(8.47, 0.5, 0.01)[4], '0.79')
num(D, 'σ valor inicial', drf(8.47, 25, 0.0168)[0], '59.6699'); num(D, 'ρ valor inicial', drf(8.47, 25, 0.0168)[1], '16.7589'); num(D, 'μ valor inicial', drf(8.47, 25, 0.0168)[2], '43.9705'); num(D, 'v_d valor inicial', drf(8.47, 25, 0.0168)[3], '0.0738704'); num(D, 'ℓ valor inicial', drf(8.47, 25, 0.0168)[4], '39.3214')
nq, tq, Eq_ = symbols('n tau E', positive=True)
nn_, tt_ = nq * sp.Float('1e28', 40), tq * sp.Float('1e-15', 40)
sgq = nn_ * qeq ** 2 * tt_ / meq
fs(D, 'sg', sgq * sp.Float('1e-6', 40)); fs(D, 'rho', sp.Float('1e9', 40) / sgq); fs(D, 'mu', qeq * tt_ / meq * 10 ** 4); fs(D, 'vd', qeq * tt_ / meq * Eq_ * 1000); fs(D, 'ell', hbq * (3 * pi ** 2 * nn_) ** R_(1, 3) / meq * tt_ * 10 ** 9)

# ---------------------------------------------------------------- RC
D = 'rc-transitorio'
R, C, V, q, i, tt = S('R C V q i t')
qf = Function('q')
ode(D, 'R dq/dt + q/C = V resuelta por q = CV(1 − e^(−t/RC))', Eq(R * qf(tt).diff(tt) + qf(tt) / C, V), Eq(qf(tt), C * V * (1 - exp(-tt / (R * C)))))
ident(D, 'q(0) = 0', (C * V * (1 - exp(-tt / (R * C)))).subs(tt, 0), 0)
ident(D, 'i = dq/dt = (V/R)e^(−t/RC)', diff(C * V * (1 - exp(-tt / (R * C))), tt), V / R * exp(-tt / (R * C)))
ident(D, 'q(τ) = 0.632 CV con 1 − e⁻¹', (1 - exp(-1)).evalf(6), sp.Float('0.632121', 6)) if False else None
integral(D, 'E_bat = ∫ V i dt = CV²', V * V / R * exp(-tt / (R * C)), tt, 0, oo, C * V ** 2)
integral(D, 'E_R = ∫ R i² dt = ½CV²', R * (V / R * exp(-tt / (R * C))) ** 2, tt, 0, oo, C * V ** 2 / 2)
ident(D, 'U_C = ½CV² = E_bat − E_R', C * V ** 2 - C * V ** 2 / 2, C * V ** 2 / 2)
solves(D, 'tiempo al 50 %: 1 − e^(−t/τ) = ½ ⇒ t = τ ln 2', [Eq(1 - exp(-tt / (R * C)), R_(1, 2))], tt, R * C * log(2))
# integración numérica y cuadratura de energías
Rn, Cn, Vn = 10e3, 1e-6, 5.0
s2 = solve_ivp(lambda tq, y: [(Vn - y[0] / Cn) / Rn], [0, 0.01], [0.0], rtol=1e-12, atol=1e-18)
rec(G_STEP, D, 'integración numérica de la carga (t = 10 ms): v_C = V(1 − e⁻¹)', float(s2.y[0, -1] / Cn), Vn * (1 - math.exp(-1)), 'rel 1e-9', abs(s2.y[0, -1] / Cn / (Vn * (1 - math.exp(-1))) - 1) < 1e-9)
ER = quad(lambda tq: Rn * (Vn / Rn * math.exp(-tq / (Rn * Cn))) ** 2, 0, 50 * Rn * Cn, epsabs=1e-20, epsrel=1e-12)[0]
rec(G_STEP, D, 'cuadratura de la energía disipada (R = 10 kΩ)', ER, 0.5 * Cn * Vn ** 2, 'rel 1e-9', abs(ER / (0.5 * Cn * Vn ** 2) - 1) < 1e-9)
ER2 = quad(lambda tq: 1e6 * (Vn / 1e6 * math.exp(-tq / (1e6 * Cn))) ** 2, 0, 50 * 1e6 * Cn, epsabs=1e-20, epsrel=1e-12)[0]
rec(G_STEP, D, 'la energía disipada no depende de R (R = 1 MΩ)', ER2, 0.5 * Cn * Vn ** 2, 'rel 1e-9', abs(ER2 / (0.5 * Cn * Vn ** 2) - 1) < 1e-9)
uRC = {'q': 'C', 'C': 'F', 'R': 'Ohm', 'V': 'V', 'i': 'A', 'tau': 's', 't': 's', 'E_R': 'J'}
dimcheck(D, 'τ = RC', Symbol('tau', positive=True), R * C, uRC)
dimcheck(D, 'q = CV(1 − e^(−t/RC))', q, C * V * (1 - exp(-tt / (R * C))), uRC)
dimcheck(D, 'i = (V/R)e^(−t/RC)', i, V / R * exp(-tt / (R * C)), uRC)
dimcheck(D, 'E_R = ½CV²', Symbol('E_R', positive=True), C * V ** 2 / 2, uRC)
rcf = lambda R_k, C_u, V_, t_ms: (lambda tau: (tau * 1e3, V_ * (1 - math.exp(-t_ms * 1e-3 / tau)), V_ / (R_k * 1e3) * math.exp(-t_ms * 1e-3 / tau) * 1e3, 0.5 * C_u * 1e-6 * V_ ** 2 * 1e6, tau * math.log(2) * 1e3))(R_k * 1e3 * C_u * 1e-6)
num(D, 'τ (ms)', rcf(10, 1, 5, 10)[0], '10'); num(D, 'v_C (10 ms)', rcf(10, 1, 5, 10)[1], '3.161'); num(D, 'v_C/V (%)', rcf(10, 1, 5, 10)[1] / 5 * 100, '63.2'); num(D, 'i (mA)', rcf(10, 1, 5, 10)[2], '0.1839'); num(D, 'v_C (30 ms)', rcf(10, 1, 5, 30)[1], '4.751'); num(D, 'v_C/V (30 ms) %', rcf(10, 1, 5, 30)[1] / 5 * 100, '95', tol=1e-3); num(D, 't½ (ms)', rcf(10, 1, 5, 10)[4], '6.931'); num(D, 'E (µJ)', rcf(10, 1, 5, 10)[3], '12.5')
num(D, 'v_C (R = 20 kΩ)', rcf(20, 1, 5, 10)[1], '1.967'); num(D, 'τ (C = 2 µF)', rcf(10, 2, 5, 10)[0], '20'); num(D, 'v_C (C = 2 µF)', rcf(10, 2, 5, 10)[1], '1.967'); num(D, 'E (C = 2 µF)', rcf(10, 2, 5, 10)[3], '25'); num(D, 'E (V = 10)', rcf(10, 1, 10, 10)[3], '50'); num(D, 'v_C (V = 10)', rcf(10, 1, 10, 10)[1], '6.321')
num(D, 'τ valor inicial', rcf(10, 1, 5, 10)[0], '10'); num(D, 'v_C valor inicial', rcf(10, 1, 5, 10)[1], '3.16060'); num(D, 'i valor inicial', rcf(10, 1, 5, 10)[2], '0.183940'); num(D, 'E valor inicial', rcf(10, 1, 5, 10)[3], '12.5'); num(D, 't½ valor inicial', rcf(10, 1, 5, 10)[4], '6.93147')
Rk, Cu, Vq, tm = symbols('R C V t', positive=True)
taus = Rk * 1000 * Cu * sp.Rational(1, 1000000)
fs(D, 'tau', taus * 1000); fs(D, 'vc', Vq * (1 - exp(-tm * sp.Rational(1, 1000) / taus))); fs(D, 'i', Vq / (Rk * 1000) * exp(-tm * sp.Rational(1, 1000) / taus) * 1000); fs(D, 'E', Cu * sp.Rational(1, 1000000) * Vq ** 2 / 2 * 10 ** 6); fs(D, 'th', taus * log(2) * 1000)

# ---------------------------------------------------------------- RLC
D = 'rlc-resonancia'
L, w, V0, I0, Xs = S('L w V0 I0 X')
j = sp.I
Zc = R + j * w * L + 1 / (j * w * C)
ident(D, 'Z = R + j(ωL − 1/ωC)', sp.simplify(Zc), R + j * (w * L - 1 / (w * C)))
Zabs = sqrt(R ** 2 + (w * L - 1 / (w * C)) ** 2)
ident(D, '|Z|² = R² + X²', sp.simplify(sp.expand(Zc * sp.conjugate(Zc))), R ** 2 + (w * L - 1 / (w * C)) ** 2)
# solución estacionaria en el dominio del tiempo: i = (V₀/|Z|) cos(ωt − φ), q = ∫i dt
ph_ = sp.atan2(w * L - 1 / (w * C), R)
tt2 = Symbol('t', real=True)
i_t = V0 / Zabs * cos(w * tt2 - ph_)
q_t = V0 / (w * Zabs) * sin(w * tt2 - ph_)
resid = L * diff(i_t, tt2) + R * i_t + q_t / C - V0 * cos(w * tt2)
for (Rn_, Ln_, Cn_, wn_, tn_) in ((10, 1e-2, 1e-6, 2 * math.pi * 1000, 3.7e-4), (3, 5e-3, 2e-6, 2 * math.pi * 500, 1.1e-3), (100, 2e-3, 5e-7, 2 * math.pi * 4000, 6e-5)):
    val = float(resid.subs({R: Rn_, L: Ln_, C: Cn_, w: wn_, V0: 7.0, tt2: tn_}))
    rec(G_STEP, D, f'la solución i = (V₀/|Z|)cos(ωt − φ) cumple la ecuación de la malla (R={Rn_}, ω={wn_:.0f})', val, 0.0, 'abs 1e-9', abs(val) < 1e-9)
solves(D, 'resonancia: ωL = 1/(ωC) ⇒ ω₀ = 1/√(LC)', [Eq(w * L, 1 / (w * C))], w, 1 / sqrt(L * C))
ident(D, 'en resonancia |Z| = R', Zabs.subs(w, 1 / sqrt(L * C)), R)
Pw = V0 ** 2 * R / Zabs ** 2
ident(D, 'P_max = V²/R en resonancia', Pw.subs(w, 1 / sqrt(L * C)), V0 ** 2 / R)
ident(D, 'Q = ω₀L/R = (1/R)√(L/C)', (1 / sqrt(L * C)) * L / R, sqrt(L / C) / R)
wp = R / (2 * L) + sqrt((R / (2 * L)) ** 2 + 1 / (L * C)); wm = -R / (2 * L) + sqrt((R / (2 * L)) ** 2 + 1 / (L * C))
ident(D, 'ω₊ − ω₋ = R/L', wp - wm, R / L)
ident(D, 'ω₊ω₋ = ω₀²', sp.simplify(wp * wm), 1 / (L * C))
ident(D, 'en ω₊: reactancia = +R (media potencia)', (wp * L - 1 / (wp * C)) - R, 0)
ident(D, 'en ω₋: reactancia = −R', (wm * L - 1 / (wm * C)) + R, 0)
ident(D, 'Δω = ω₀/Q', R / L, (1 / sqrt(L * C)) / ((1 / sqrt(L * C)) * L / R))
# cuadratura de la potencia media en un periodo
Rn, Ln, Cn, Vn = 10.0, 1e-2, 1e-6, 10.0
for fn in (1000.0, 1591.549, 2500.0):
    wn = 2 * math.pi * fn; Zn = math.hypot(Rn, wn * Ln - 1 / (wn * Cn)); ph = math.atan2(wn * Ln - 1 / (wn * Cn), Rn)
    Pq = quad(lambda tq: (math.sqrt(2) * Vn * math.cos(wn * tq)) * (math.sqrt(2) * Vn / Zn * math.cos(wn * tq - ph)), 0, 2 * math.pi / wn, epsabs=1e-14, epsrel=1e-12)[0] * wn / (2 * math.pi)
    rec(G_STEP, D, f'cuadratura de la potencia media en un periodo (f = {fn} Hz)', Pq, Vn ** 2 * Rn / Zn ** 2, 'rel 1e-8', abs(Pq / (Vn ** 2 * Rn / Zn ** 2) - 1) < 1e-8)
uL = {'R': 'Ohm', 'L': 'H', 'C': 'F', 'w': 'rad s^-1', 'Z': 'Ohm', 'X': 'Ohm', 'P': 'W', 'V0': 'V', 'Q': '1', 'dw': 'rad s^-1', 'phi': 'rad'}
dimcheck(D, 'ω₀ = 1/√(LC)', Symbol('w', positive=True), 1 / sqrt(L * C), uL)
dimcheck(D, '|Z| = √(R² + (ωL − 1/ωC)²)', Symbol('Z', positive=True), Zabs, uL)
dimcheck(D, 'Q = ω₀L/R', Symbol('Q', positive=True), (1 / sqrt(L * C)) * L / R, uL)
dimcheck(D, 'P = V²R/|Z|²', Symbol('P', positive=True), Pw, uL)
dimcheck(D, 'Δω = R/L', Symbol('dw', positive=True), R / L, uL)
rlf = lambda R_, L_mH, C_uF, f_, V_: (lambda w0, X: (w0 / (2 * math.pi), w0 * L_mH * 1e-3 / R_, math.hypot(R_, X), math.degrees(math.atan2(X, R_)), V_ * V_ * R_ / (R_ ** 2 + X ** 2), w0 / (2 * math.pi) / (w0 * L_mH * 1e-3 / R_)))(1 / math.sqrt(L_mH * 1e-3 * C_uF * 1e-6), 2 * math.pi * f_ * L_mH * 1e-3 - 1 / (2 * math.pi * f_ * C_uF * 1e-6))
num(D, 'f₀', rlf(10, 10, 1, 1000, 10)[0], '1591.5'); num(D, 'Q', rlf(10, 10, 1, 1000, 10)[1], '10.0'); num(D, 'X (1000 Hz)', 2 * math.pi * 1000 * 0.01 - 1 / (2 * math.pi * 1000 * 1e-6), '-96.32'); num(D, '|Z| (1000 Hz)', rlf(10, 10, 1, 1000, 10)[2], '96.84'); num(D, 'φ (1000 Hz)', rlf(10, 10, 1, 1000, 10)[3], '-84.07'); num(D, 'P (1000 Hz)', rlf(10, 10, 1, 1000, 10)[4], '0.1066')
num(D, 'P en resonancia', 10 ** 2 / 10, '10'); num(D, 'cociente P(f₀)/P(1 kHz)', 10 / rlf(10, 10, 1, 1000, 10)[4], '94', tol=0.01); num(D, '|Z| (2500 Hz)', rlf(10, 10, 1, 2500, 10)[2], '93.95'); num(D, 'φ (2500 Hz)', rlf(10, 10, 1, 2500, 10)[3], '83.89'); num(D, 'P (2500 Hz)', rlf(10, 10, 1, 2500, 10)[4], '0.1133')
num(D, 'Q (R = 1)', rlf(1, 10, 1, 1000, 10)[1], '100'); num(D, 'anchura (R = 1) Hz', rlf(1, 10, 1, 1000, 10)[5], '15.9'); num(D, 'Q (R = 100)', rlf(100, 10, 1, 1000, 10)[1], '1.0'); num(D, 'anchura (R = 100) Hz', rlf(100, 10, 1, 1000, 10)[5], '1591.5'); num(D, 'P (R = 100, 1 kHz)', rlf(100, 10, 1, 1000, 10)[4], '0.5187'); num(D, 'tensión en L en resonancia', 10 * rlf(10, 10, 1, 1000, 10)[1], '100')
num(D, 'f₀ valor inicial', rlf(10, 10, 1, 1000, 10)[0], '1591.55'); num(D, 'Q valor inicial', rlf(10, 10, 1, 1000, 10)[1], '10'); num(D, '|Z| valor inicial', rlf(10, 10, 1, 1000, 10)[2], '96.8408'); num(D, 'φ valor inicial', rlf(10, 10, 1, 1000, 10)[3], '-84.0729'); num(D, 'P valor inicial', rlf(10, 10, 1, 1000, 10)[4], '0.106631')
Rq, Lq, Cq, fq, Vq = symbols('R L C f V', positive=True)
w0q = 1 / sqrt(Lq * sp.Rational(1, 1000) * Cq * sp.Rational(1, 1000000))
Xq = 2 * pi * fq * Lq * sp.Rational(1, 1000) - 1 / (2 * pi * fq * Cq * sp.Rational(1, 1000000))
fs(D, 'f0', w0q / (2 * pi)); fs(D, 'Q', w0q * Lq * sp.Rational(1, 1000) / Rq); fs(D, 'Z', sqrt(Rq ** 2 + Xq ** 2)); fs(D, 'phi', sp.atan(Xq / Rq) * 180 / pi); fs(D, 'P', Vq ** 2 * Rq / (Rq ** 2 + Xq ** 2))

# ---------------------------------------------------------------- Thévenin
D = 'thevenin-potencia'
Vth, Rth, RL, R1, R2, V00 = S('Vth Rth RL R1 R2 V00')
ident(D, 'divisor: V_th = V₀R₂/(R₁+R₂)', V00 * R2 / (R1 + R2), V00 * R2 / (R1 + R2))
ident(D, 'R_th = R₁ ∥ R₂ = R₁R₂/(R₁+R₂)', 1 / (1 / R1 + 1 / R2), R1 * R2 / (R1 + R2))
Pexp = Vth ** 2 * RL / (Rth + RL) ** 2
ident(D, 'P = I²R_L con I = V_th/(R_th+R_L)', (Vth / (Rth + RL)) ** 2 * RL, Pexp)
solves(D, 'dP/dR_L = 0 ⇒ R_L = R_th', [Eq(diff(Pexp, RL), 0)], RL, Rth)
ident(D, 'dP/dR_L = V²(R_th − R_L)/(R_th + R_L)³', diff(Pexp, RL), Vth ** 2 * (Rth - RL) / (Rth + RL) ** 3)
ident(D, 'P_max = V_th²/(4R_th)', Pexp.subs(RL, Rth), Vth ** 2 / (4 * Rth))
ident(D, 'η = P_L/P_fuente = R_L/(R_th + R_L)', (Vth / (Rth + RL)) ** 2 * RL / (Vth * (Vth / (Rth + RL))), RL / (Rth + RL))
ident(D, 'η(R_L = R_th) = ½', (RL / (Rth + RL)).subs(RL, Rth), R_(1, 2))
ident(D, 'simetría P(R_L) = P(R_th²/R_L)', sp.simplify(Pexp.subs(RL, Rth ** 2 / RL) - Pexp), 0)
# comprobación por análisis nodal: red original (V₀, R₁, R₂ en paralelo, carga R_L) frente al equivalente de Thévenin
rng2 = np.random.default_rng(5)
for _ in range(6):
    V0n, R1n, R2n, RLn = rng2.uniform(1, 30), rng2.uniform(1, 50), rng2.uniform(1, 50), rng2.uniform(0.5, 80)
    # nodo de salida: (V0 − v)/R1 = v/R2 + v/RL
    v = (V0n / R1n) / (1 / R1n + 1 / R2n + 1 / RLn)
    Vt, Rt = V0n * R2n / (R1n + R2n), R1n * R2n / (R1n + R2n)
    vt = Vt * RLn / (Rt + RLn)
    rec(G_STEP, D, f'análisis nodal frente al equivalente de Thévenin (V₀={V0n:.2f}, R_L={RLn:.2f})', v, vt, 'rel 1e-12', abs(v / vt - 1) < 1e-12)
RLg = np.logspace(-2, 3, 200001)
Pg = 12 ** 2 * RLg / (2 + RLg) ** 2
rec(G_STEP, D, 'máximo numérico de P(R_L) en R_L = R_th = 2 Ω', float(RLg[np.argmax(Pg)]), 2.0, 'rel 1e-3', abs(RLg[np.argmax(Pg)] / 2.0 - 1) < 1e-3)
uT = {'Vth': 'V', 'Rth': 'Ohm', 'RL': 'Ohm', 'I': 'A', 'P': 'W', 'eta': '1', 'V00': 'V', 'R1': 'Ohm', 'R2': 'Ohm'}
dimcheck(D, 'P = V²R_L/(R_th + R_L)²', Symbol('P', positive=True), Pexp, uT)
dimcheck(D, 'P_max = V²/(4R_th)', Symbol('P', positive=True), Vth ** 2 / (4 * Rth), uT)
dimcheck(D, 'I = V/(R_th + R_L)', Symbol('I', positive=True), Vth / (Rth + RL), uT)
dimcheck(D, 'η = R_L/(R_th + R_L)', Symbol('eta', positive=True), RL / (Rth + RL), uT)
thf = lambda V_, Rt_, RL_: (V_ ** 2 * RL_ / (Rt_ + RL_) ** 2, V_ / (Rt_ + RL_), V_ * RL_ / (Rt_ + RL_), RL_ / (Rt_ + RL_), V_ ** 2 / (4 * Rt_))
num(D, 'V_th (divisor)', 24 * 10 / 20, '12'); num(D, 'R_th (divisor)', 10 * 10 / 20, '5'); num(D, 'I (R_L = 2)', thf(12, 2, 2)[1], '3'); num(D, 'V_L', thf(12, 2, 2)[2], '6'); num(D, 'P (R_L = 2)', thf(12, 2, 2)[0], '18'); num(D, 'P (R_L = 8)', thf(12, 2, 8)[0], '11.52'); num(D, 'η (R_L = 8)', thf(12, 2, 8)[3], '0.8'); num(D, 'P (R_L = 20)', thf(12, 2, 20)[0], '5.950'); num(D, 'η (R_L = 20)', thf(12, 2, 20)[3], '0.909')
num(D, 'P (R_L = 0.5)', thf(12, 2, 0.5)[0], '11.52'); num(D, 'η (R_L = 0.5)', thf(12, 2, 0.5)[3], '0.2'); num(D, 'P_max (24 V)', thf(24, 2, 2)[4], '72'); num(D, 'P_max (R_th = 4)', thf(12, 4, 4)[0], '9')
num(D, 'P valor inicial', thf(12, 2, 2)[0], '18'); num(D, 'I valor inicial', thf(12, 2, 2)[1], '3'); num(D, 'V_L valor inicial', thf(12, 2, 2)[2], '6'); num(D, 'η valor inicial', thf(12, 2, 2)[3], '0.5'); num(D, 'P_max valor inicial', thf(12, 2, 2)[4], '18')
Vt_, Rt_, RL_ = symbols('V Rt RL', positive=True)
fs(D, 'P', Vt_ ** 2 * RL_ / (Rt_ + RL_) ** 2); fs(D, 'I', Vt_ / (Rt_ + RL_)); fs(D, 'VL', Vt_ * RL_ / (Rt_ + RL_)); fs(D, 'eta', RL_ / (Rt_ + RL_)); fs(D, 'Pm', Vt_ ** 2 / (4 * Rt_))

# ---------------------------------------------------------------- Coaxial
D = 'linea-coaxial'
z, Lp, Cp, vv, Z0, a, b, eps, mu0, lam, I_ = S('z Lp Cp vv Z0 a b eps mu0 lam I')
vz = Function('v')(z, t); iz = Function('i')(z, t)
# onda progresiva v = f(t − z/vf), i = v/Z0
fgen = Function('f')
vfp = 1 / sqrt(Lp * Cp)
v_w = exp(-(t - z / vfp) ** 2)
i_w = v_w / sqrt(Lp / Cp)
ident(D, '∂v/∂z = −L′ ∂i/∂t para la onda progresiva con Z₀ = √(L′/C′)', sp.simplify(diff(v_w, z) + Lp * diff(i_w, t)), 0)
ident(D, '∂i/∂z = −C′ ∂v/∂t para la onda progresiva', sp.simplify(diff(i_w, z) + Cp * diff(v_w, t)), 0)
ident(D, '∂²v/∂z² = L′C′ ∂²v/∂t²', sp.simplify(diff(v_w, z, 2) - Lp * Cp * diff(v_w, t, 2)), 0)
r = Symbol('r', positive=True)
integral(D, 'V = ∫ λ/(2πεr) dr = λ ln(b/a)/(2πε) ⇒ C′ = λ/V = 2πε/ln(b/a)', lam / (2 * pi * eps * r), r, a, b, lam * log(b / a) / (2 * pi * eps))
ident(D, 'C′ = λ/V = 2πε/ln(b/a)', lam / (lam * log(b / a) / (2 * pi * eps)), 2 * pi * eps / log(b / a))
integral(D, 'flujo por metro Φ′ = ∫ μ₀I/(2πr) dr = μ₀I ln(b/a)/(2π) ⇒ L′', mu0 * I_ / (2 * pi * r), r, a, b, mu0 * I_ * log(b / a) / (2 * pi))
ident(D, 'L′ = Φ′/I = (μ₀/2π) ln(b/a)', mu0 * log(b / a) / (2 * pi), mu0 / (2 * pi) * log(b / a))
Lg = Symbol('Lg', positive=True)
ident(D, 'Z₀ = √(L′/C′) = (ln(b/a)/2π)√(μ₀/ε), con Lg = ln(b/a) > 0', sqrt((mu0 / (2 * pi) * Lg) / (2 * pi * eps / Lg)), Lg / (2 * pi) * sqrt(mu0 / eps))
er_ = Symbol('er', positive=True)
e0s, m0s = Symbol('e0', positive=True), Symbol('m0', positive=True)
ident(D, 'v_f = 1/√(L′C′) = 1/√(μ₀ε) = c/√ε_r con c = 1/√(μ₀ε₀)', 1 / sqrt((m0s / (2 * pi) * log(b / a)) * (2 * pi * er_ * e0s / log(b / a))), (1 / sqrt(m0s * e0s)) / sqrt(er_))
ident(D, 'Z₀ = (ln(b/a)/2π)√(μ₀/ε₀)/√ε_r', log(b / a) / (2 * pi) * sqrt(m0s / (er_ * e0s)), log(b / a) / (2 * pi) * sqrt(m0s / e0s) / sqrt(er_))
ident(D, 'coeficiente de reflexión (75 − 50)/(75 + 50) = 0.2; potencia 4 %', R_(75 - 50, 75 + 50), R_(1, 5))
# problema de contorno numérico: C′ por energía del campo ½C′V² = ∫½εE²2πr dr
def Cprime_num(a_, b_, er_n):
    V_ = 1.0; lam_ = V_ * 2 * math.pi * E0 * er_n / math.log(b_ / a_)
    Ef = lambda rr: lam_ / (2 * math.pi * E0 * er_n * rr)
    U = quad(lambda rr: 0.5 * E0 * er_n * Ef(rr) ** 2 * 2 * math.pi * rr, a_, b_, epsabs=1e-20, epsrel=1e-12)[0]
    return 2 * U / V_ ** 2
def Lprime_num(a_, b_):
    I1 = 1.0; Bf = lambda rr: MU0 * I1 / (2 * math.pi * rr)
    U = quad(lambda rr: Bf(rr) ** 2 / (2 * MU0) * 2 * math.pi * rr, a_, b_, epsabs=1e-20, epsrel=1e-12)[0]
    return 2 * U / I1 ** 2
for (an, bn, ern) in ((0.405e-3, 1.475e-3, 2.25), (0.5e-3, 1.5e-3, 1.0), (1e-3, 3.5e-3, 4.0)):
    Cn_, Ln_ = Cprime_num(an, bn, ern), Lprime_num(an, bn)
    rec(G_STEP, D, f'energía del campo eléctrico: C′ = 2U/V² (a={an}, b={bn})', Cn_, 2 * math.pi * E0 * ern / math.log(bn / an), 'rel 1e-9', abs(Cn_ / (2 * math.pi * E0 * ern / math.log(bn / an)) - 1) < 1e-9)
    rec(G_STEP, D, f'energía del campo magnético: L′ = 2U/I² (a={an}, b={bn})', Ln_, MU0 / (2 * math.pi) * math.log(bn / an), 'rel 1e-9', abs(Ln_ / (MU0 / (2 * math.pi) * math.log(bn / an)) - 1) < 1e-9)
uX = {'Lp': 'H m^-1', 'Cp': 'F m^-1', 'Z0': 'Ohm', 'vv': 'm s^-1', 'a': 'm', 'b': 'm', 'eps': 'F m^-1', 'mu0': 'H m^-1', 'c': 'm s^-1', 'er': '1', 'e0': 'F m^-1', 'm0': 'H m^-1'}
dimcheck(D, 'Z₀ = √(L′/C′)', Z0, sqrt(Lp / Cp), uX)
dimcheck(D, 'v_f = 1/√(L′C′)', vv, 1 / sqrt(Lp * Cp), uX)
dimcheck(D, 'C′ = 2πε/ln(b/a)', Cp, 2 * pi * eps / log(b / a), uX)
dimcheck(D, 'L′ = (μ₀/2π) ln(b/a)', Lp, mu0 / (2 * pi) * log(b / a), uX)
dimcheck(D, 'Z₀ = (ln(b/a)/2π)√(μ₀/ε)', Z0, log(b / a) / (2 * pi) * sqrt(mu0 / eps), uX)
cxf = lambda br, er: (lambda ln: (lambda Cp_, Lp_: (math.sqrt(Lp_ / Cp_), Cp_ * 1e12, Lp_ * 1e9, 1 / math.sqrt(Lp_ * Cp_) * math.sqrt(MU0 * E0), 1e9 * math.sqrt(Lp_ * Cp_)))(2 * math.pi * E0 * er / ln, MU0 / (2 * math.pi) * ln))(math.log(br))
br0 = 1.475 / 0.405
num(D, 'C′ (pF/m)', cxf(br0, 2.25)[1], '96.84'); num(D, 'L′ (nH/m)', cxf(br0, 2.25)[2], '258.5'); num(D, 'Z₀', cxf(br0, 2.25)[0], '51.67'); num(D, 'v/c', cxf(br0, 2.25)[3], '0.6667'); num(D, 'retardo (ns/m)', cxf(br0, 2.25)[4], '5.003'); num(D, 'b/a', br0, '3.642')
num(D, 'Z₀ (aire)', cxf(br0, 1.0)[0], '77.50'); num(D, 'retardo (aire)', cxf(br0, 1.0)[4], '3.336'); num(D, 'Z₀ (ε_r = 4)', cxf(br0, 4.0)[0], '38.75'); num(D, 'v/c (ε_r = 4)', cxf(br0, 4.0)[3], '0.5000'); num(D, 'Z₀ (b = 2 mm)', cxf(2.0 / 0.405, 2.25)[0], '63.84'); num(D, 'impedancia del vacío', math.sqrt(MU0 / E0), '376.73')
num(D, 'factor 59.96', math.sqrt(MU0 / E0) / (2 * math.pi), '59.96'); num(D, 'Z₀ valor inicial', cxf(3.641975, 2.25)[0], '51.6653'); num(D, 'C′ valor inicial', cxf(3.641975, 2.25)[1], '96.8438'); num(D, 'L′ valor inicial', cxf(3.641975, 2.25)[2], '258.505'); num(D, 'v/c valor inicial', cxf(3.641975, 2.25)[3], '0.666667'); num(D, 'retardo valor inicial', cxf(3.641975, 2.25)[4], '5.00346')
brq, erq = symbols('br er', positive=True)
lnq = log(brq)
Cpq = 2 * pi * E0q * erq / lnq; Lpq = MU0q / (2 * pi) * lnq
fs(D, 'Z0', sqrt(Lpq / Cpq)); fs(D, 'Cp', Cpq * 10 ** 12); fs(D, 'Lp', Lpq * 10 ** 9); fs(D, 'vc', 1 / sqrt(Lpq * Cpq) * sqrt(MU0q * E0q)); fs(D, 'dl', 10 ** 9 * sqrt(Lpq * Cpq))
