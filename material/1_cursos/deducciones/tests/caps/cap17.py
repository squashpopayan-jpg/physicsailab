# -*- coding: utf-8 -*-
"""Capítulo 17 — Teoría cinética de los gases."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, Function, solve, simplify, oo, erfc
import mpmath as mp
from scipy.integrate import quad
from scipy.special import erfc as serfc

EX = {'maxwell-velocidades': 'maxwell', 'efusion-graham': 'efusion'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
kB = 1.380649e-23; NA = 6.02214076e23; Rg = kB * NA; qe = 1.602176634e-19
kq = sp.Float('1.380649e-23', 40); NAq = sp.Float('6.02214076e23', 40); Rq = kq * NAq; eq_ = sp.Float('1.602176634e-19', 40)
mm = lambda M: M * 1e-3 / NA
rng = np.random.default_rng(12345)

m, k, T, n_, vx, vy, vz, v, p, A, Vv = S('m k T n vx vy vz v p A V')

# ---------------------------------------------------------------- presión cinética
D = 'presion-cinetica'
ident(D, 'Δp_x = −2mv_x en el choque', m * (-vx) - m * vx, -2 * m * vx)
ident(D, 'dN/(A dt) = ½ n v_x (solo las que se dirigen a la pared)', R_(1, 2) * n_ * vx * A / A, n_ * vx / 2)
alpha = m / (2 * k * T)
phi = sqrt(alpha / pi) * exp(-alpha * vx ** 2)
integral(D, 'p = ∫₀^∞ 2mv_x · n v_x φ(v_x) dv_x con φ de Maxwell = n kT', 2 * m * vx * n_ * vx * phi, vx, 0, oo, n_ * k * T)
integral(D, '⟨v_x²⟩ = ∫ v_x² φ dv_x = kT/m', vx ** 2 * phi, vx, -oo, oo, k * T / m)
ident(D, 'isotropía: ⟨v²⟩ = 3⟨v_x²⟩ ⇒ p = ⅓ n m⟨v²⟩', n_ * m * (3 * k * T / m) / 3, n_ * k * T)
v2, Ec = S('v2 Ec')
solves(D, '⅔ n E_c = n k T ⇒ E_c = 3kT/2', [Eq(R_(2, 3) * n_ * Ec, n_ * k * T)], Ec, R_(3, 2) * k * T)
solves(D, '½ m v_rms² = 3kT/2 ⇒ v_rms', [Eq(R_(1, 2) * m * v ** 2, R_(3, 2) * k * T)], v, sqrt(3 * k * T / m))
# muestreo de Monte Carlo (Gaussianas de la distribución de Maxwell) y presión por cuadratura sobre las colisiones
Tn, Mn = 300.0, 28.0134
sig = math.sqrt(kB * Tn / mm(Mn))
vs_ = rng.normal(0, sig, size=(2_000_000, 3))
vrms_mc = math.sqrt(np.mean(np.sum(vs_ ** 2, axis=1)))
rec(G_STEP, D, 'Monte Carlo (2·10⁶ moléculas): v_rms = √(3kT/m)', vrms_mc, math.sqrt(3 * kB * Tn / mm(Mn)), 'rel 2e-3', abs(vrms_mc / math.sqrt(3 * kB * Tn / mm(Mn)) - 1) < 2e-3)
pr_mc = np.mean(vs_[:, 0] ** 2) * mm(Mn)   # p/n = m⟨v_x²⟩
rec(G_STEP, D, 'Monte Carlo: p/n = m⟨v_x²⟩ = kT', pr_mc, kB * Tn, 'rel 3e-3', abs(pr_mc / (kB * Tn) - 1) < 3e-3)
uP = {'p': 'Pa', 'n': 'm^-3', 'm': 'kg', 'v': 'm s^-1', 'k': 'J K^-1', 'T': 'K', 'Ec': 'J', 'vrms': 'm s^-1', 'v2': 'm s^-1'}
vrms = Symbol('vrms', positive=True)
dimcheck(D, 'p = ⅓ n m v²', p, n_ * m * v ** 2 / 3, uP)
dimcheck(D, 'E_c = 3kT/2', Ec, R_(3, 2) * k * T, uP)
dimcheck(D, 'v_rms = √(3kT/m)', vrms, sqrt(3 * k * T / m), uP)
dimcheck(D, 'p = nkT', p, n_ * k * T, uP)
pc = lambda T_, M_, p_: (p_ * 1e3 / (kB * T_), 1.5 * kB * T_ / qe, math.sqrt(3 * kB * T_ / mm(M_)), p_ * 1e3 * M_ * 1e-3 / (Rg * T_))
num(D, 'v_rms (N₂)', pc(300, 28.0134, 101.325)[2], '516.8'); num(D, '⟨E_c⟩ (10⁻²¹ J)', 1.5 * kB * 300 / 1e-21, '6.213'); num(D, '⟨E_c⟩ (eV)', pc(300, 28.0134, 101.325)[1], '0.03878'); num(D, 'n (10²⁵)', pc(300, 28.0134, 101.325)[0] / 1e25, '2.446'); num(D, 'ρ', pc(300, 28.0134, 101.325)[3], '1.138')
num(D, 'v_rms (H₂)', pc(300, 2.01588, 101.325)[2], '1927'); num(D, 'v_rms (Ar)', pc(300, 39.948, 101.325)[2], '432.8'); num(D, 'v_rms (1200 K)', pc(1200, 28.0134, 101.325)[2], '1033.7'); num(D, 'v_rms (600 K)', pc(600, 28.0134, 101.325)[2], '730.9'); num(D, 'v_rms (1000 K)', pc(1000, 28.0134, 101.325)[2], '943.6'); num(D, '⟨E_c⟩ (1000 K, eV)', pc(1000, 28.0134, 101.325)[1], '0.12926')
num(D, 'n (10 kPa) 10²⁴', pc(300, 28.0134, 10)[0] / 1e24, '2.414'); num(D, 'ρ (10 kPa)', pc(300, 28.0134, 10)[3], '0.1123')
num(D, 'v_rms valor inicial', pc(300, 28.0134, 101.325)[2], '516.839'); num(D, 'E_c valor inicial (eV)', pc(300, 28.0134, 101.325)[1], '0.038778'); num(D, 'n valor inicial (10²⁵)', pc(300, 28.0134, 101.325)[0] / 1e25, '2.44631'); num(D, 'ρ valor inicial', pc(300, 28.0134, 101.325)[3], '1.13796')
Tq, Mq, pq = symbols('T M p', positive=True)
mq = Mq * sp.Rational(1, 1000) / NAq
fs(D, 'vrms', sqrt(3 * kq * Tq / mq)); fs(D, 'Ek', R_(3, 2) * kq * Tq / eq_); fs(D, 'n', pq * 1000 / (kq * Tq)); fs(D, 'rho', pq * 1000 * Mq * sp.Rational(1, 1000) / (Rq * Tq))

# ---------------------------------------------------------------- Maxwell
D = 'maxwell-velocidades'
al, A0, s_ = S('alpha A s')
phi_ = A0 * exp(-al * vx ** 2)
F_ = A0 ** 3 * exp(-al * s_)
ident(D, 'φ′/(v_x φ) = −2α para φ = A e^(−αv_x²)', diff(phi_, vx) / (vx * phi_), -2 * al)
ident(D, '2F′/F = −2α para F(s) = A³e^(−αs)', 2 * diff(F_, s_) / F_, -2 * al)
ident(D, 'φ(v_x)φ(v_y)φ(v_z) = F(v_x²+v_y²+v_z²)', phi_ * phi_.subs(vx, vy) * phi_.subs(vx, vz), F_.subs(s_, vx ** 2 + vy ** 2 + vz ** 2))
ode(D, 'φ′ = −2αv_xφ', Eq(Function('g')(vx).diff(vx), -2 * al * vx * Function('g')(vx)), Eq(Function('g')(vx), A0 * exp(-al * vx ** 2)))
integral(D, '∫φ dv_x = A√(π/α) = 1 ⇒ A = √(α/π)', sqrt(al / pi) * exp(-al * vx ** 2), vx, -oo, oo, 1)
integral(D, '⟨v_x²⟩ = 1/(2α)', vx ** 2 * sqrt(al / pi) * exp(-al * vx ** 2), vx, -oo, oo, 1 / (2 * al))
solves(D, '1/(2α) = kT/m ⇒ α = m/(2kT)', [Eq(1 / (2 * al), k * T / m)], al, m / (2 * k * T))
fv = 4 * pi * (m / (2 * pi * k * T)) ** R_(3, 2) * v ** 2 * exp(-m * v ** 2 / (2 * k * T))
integral(D, '∫₀^∞ f(v) dv = 1', fv, v, 0, oo, 1)
solves(D, 'df/dv = 0 ⇒ v_p = √(2kT/m)', [Eq(diff(fv, v) / (fv / v), 0)], v, sqrt(2 * k * T / m))
integral(D, 'v̄ = ∫ v f dv = √(8kT/πm)', v * fv, v, 0, oo, sqrt(8 * k * T / (pi * m)))
integral(D, '⟨v²⟩ = ∫ v² f dv = 3kT/m', v ** 2 * fv, v, 0, oo, 3 * k * T / m)
integral(D, '⟨½mv²⟩ = 3kT/2', m * v ** 2 / 2 * fv, v, 0, oo, R_(3, 2) * k * T)
ident(D, 'v_p : v̄ : v_rms = √2 : √(8/π) : √3', (sqrt(8 * k * T / (pi * m)) / sqrt(2 * k * T / m)) ** 2, 4 / pi)
ident(D, 'v_rms/v_p = √(3/2)', (sqrt(3 * k * T / m) / sqrt(2 * k * T / m)) ** 2, R_(3, 2))
# fracción con v > v₀: cuadratura frente a la fórmula con erfc
def frac_q(T_, M_, v0):
    msn = mm(M_); a = msn / (2 * kB * T_)
    f = lambda vv: 4 * math.pi * (a / math.pi) ** 1.5 * vv ** 2 * math.exp(-a * vv ** 2)
    return quad(f, v0, math.inf, epsabs=1e-14, epsrel=1e-12)[0]
mx = lambda T_, M_, v0: (lambda m_: (lambda vp: (vp, math.sqrt(8 * kB * T_ / (math.pi * m_)), math.sqrt(3 * kB * T_ / m_), serfc(v0 / vp) + 2 / math.sqrt(math.pi) * (v0 / vp) * math.exp(-(v0 / vp) ** 2)))(math.sqrt(2 * kB * T_ / m_)))(mm(M_))
for (T_, M_, v0) in ((300, 28.0134, 1000), (300, 28.0134, 500), (600, 28.0134, 1000), (300, 2.01588, 1000)):
    rec(G_STEP, D, f'cuadratura de ∫_v₀^∞ f dv vs erfc (T={T_}, M={M_}, v₀={v0})', frac_q(T_, M_, v0), mx(T_, M_, v0)[3], 'rel 1e-9', abs(frac_q(T_, M_, v0) - mx(T_, M_, v0)[3]) < 1e-9 * mx(T_, M_, v0)[3])
# Monte Carlo
sg = math.sqrt(kB * 300 / mm(28.0134))
vv_ = np.linalg.norm(rng.normal(0, sg, size=(2_000_000, 3)), axis=1)
rec(G_STEP, D, 'Monte Carlo: v̄ = √(8kT/πm)', float(vv_.mean()), mx(300, 28.0134, 1000)[1], 'rel 2e-3', abs(vv_.mean() / mx(300, 28.0134, 1000)[1] - 1) < 2e-3)
rec(G_STEP, D, 'Monte Carlo: fracción con v > 500 m/s', float((vv_ > 500).mean()), mx(300, 28.0134, 500)[3], 'abs 2e-3', abs((vv_ > 500).mean() - mx(300, 28.0134, 500)[3]) < 2e-3)
_h, _e = np.histogram(vv_, bins=np.arange(0, 1600, 40), density=True)
_c = 0.5 * (_e[1:] + _e[:-1]); _a = mm(28.0134) / (2 * kB * 300)
_f = 4 * math.pi * (_a / math.pi) ** 1.5 * _c ** 2 * np.exp(-_a * _c ** 2)
_w = _f > 0.1 * _f.max()
_err = float(np.max(np.abs(_h[_w] / _f[_w] - 1)))
rec(G_STEP, D, 'Monte Carlo: histograma de |v| frente a f(v) (error máx. en la zona principal)', _err, 0.0, 'rel 2e-2', _err < 2e-2)
uM = {'f': 's m^-1', 'm': 'kg', 'k': 'J K^-1', 'T': 'K', 'v': 'm s^-1', 'alpha': 's^2 m^-2', 'vp': 'm s^-1', 'vb': 'm s^-1', 'vr': 'm s^-1', 'v0': 'm s^-1', 'vx': 'm s^-1'}
dimcheck(D, 'f(v) = 4π(m/2πkT)^(3/2) v² e^(−mv²/2kT)', Symbol('f', positive=True), fv, uM)
dimcheck(D, 'α = m/(2kT)', al, m / (2 * k * T), uM)
dimcheck(D, 'v_p = √(2kT/m)', Symbol('vp', positive=True), sqrt(2 * k * T / m), uM)
dimcheck(D, 'v̄ = √(8kT/πm)', Symbol('vb', positive=True), sqrt(8 * k * T / (pi * m)), uM)
dimcheck(D, 'v_rms = √(3kT/m)', Symbol('vr', positive=True), sqrt(3 * k * T / m), uM)
num(D, 'v_p (N₂)', mx(300, 28.0134, 1000)[0], '422.0'); num(D, 'v̄', mx(300, 28.0134, 1000)[1], '476.2'); num(D, 'v_rms', mx(300, 28.0134, 1000)[2], '516.8'); num(D, 'fracción > 500 (%)', mx(300, 28.0134, 500)[3] * 100, '42.22'); num(D, 'fracción > 1000 (%)', mx(300, 28.0134, 1000)[3] * 100, '1.054')
num(D, 'fracción > 1000 a 600 K (%)', mx(600, 28.0134, 1000)[3] * 100, '13.19'); num(D, 'cociente 600 K/300 K', mx(600, 28.0134, 1000)[3] / mx(300, 28.0134, 1000)[3], '12.5', tol=0.005); num(D, 'v_p (H₂)', mx(300, 2.01588, 1000)[0], '1573'); num(D, 'H₂ > 1 km/s (%)', mx(300, 2.01588, 1000)[3] * 100, '84.75'); num(D, 'Ar > 1 km/s (%)', mx(300, 39.948, 1000)[3] * 100, '0.1126')
num(D, 'H₂ > 11.2 km/s a 300 K (10⁻²²)', mx(300, 2.01588, 11200)[3] / 1e-22, '7.9', tol=0.02); num(D, 'H > 10.8 km/s a 1000 K (%)', mx(1000, 1.00794, 10800)[3] * 100, '0.272')
num(D, 'v_p valor inicial', mx(300, 28.0134, 1000)[0], '421.997'); num(D, 'v̄ valor inicial', mx(300, 28.0134, 1000)[1], '476.173'); num(D, 'v_rms valor inicial', mx(300, 28.0134, 1000)[2], '516.839'); num(D, 'fracción valor inicial', mx(300, 28.0134, 1000)[3], '0.010541'); num(D, 'fracción (v₀ = 500) valor', mx(300, 28.0134, 500)[3], '0.4222')
v0q = Symbol('v0', positive=True)
mq2 = Mq * sp.Rational(1, 1000) / NAq
vpq = sqrt(2 * kq * Tq / mq2)
fs(D, 'vp', vpq); fs(D, 'vm', sqrt(8 * kq * Tq / (pi * mq2))); fs(D, 'vr', sqrt(3 * kq * Tq / mq2))
fs(D, 'fr', erfc(v0q / vpq) + 2 / sqrt(pi) * (v0q / vpq) * exp(-(v0q / vpq) ** 2), tol=1e-6)

# ---------------------------------------------------------------- equipartición
D = 'equiparticion'
a_, q_, be, f_, U_, Cv_, R, gam = S('a q beta f U Cv R gam')
integral(D, '∫e^(−βaq²) dq = √(π/βa)', exp(-be * a_ * q_ ** 2), q_, -oo, oo, sqrt(pi / (be * a_)))
integral(D, '∫q²e^(−βaq²) dq = √π/(2(βa)^(3/2))', q_ ** 2 * exp(-be * a_ * q_ ** 2), q_, -oo, oo, sqrt(pi) / (2 * (be * a_) ** R_(3, 2)))
ident(D, '⟨aq²⟩ = a·[√π/(2(βa)^(3/2))]/√(π/βa) = 1/(2β) = kT/2', a_ * (sqrt(pi) / (2 * (be * a_) ** R_(3, 2))) / sqrt(pi / (be * a_)), 1 / (2 * be))
integral(D, 'cociente de integrales: ⟨aq²⟩ = 1/(2β)', a_ * q_ ** 2 * exp(-be * a_ * q_ ** 2) / sqrt(pi / (be * a_)), q_, -oo, oo, 1 / (2 * be))
ident(D, 'U = (f/2) nRT ⇒ C_v = ∂U/∂T/n = (f/2)R', diff(f_ / 2 * R * T, T), f_ / 2 * R)
ident(D, 'γ = C_p/C_v = (C_v + R)/C_v = (f+2)/f', (f_ / 2 * R + R) / (f_ / 2 * R), (f_ + 2) / f_)
ident(D, 'γ = 1 + 2/f', (f_ + 2) / f_, 1 + 2 / f_)
# cuadratura independiente con valores numéricos
for (a_n, T_n) in ((1.7, 300.0), (0.01, 50.0), (25.0, 1e3)):
    b_n = 1 / (kB * T_n)
    # trabajo con unidades de β·a q²: variable reducida
    val = quad(lambda x: x * x * math.exp(-x * x), -math.inf, math.inf)[0] / quad(lambda x: math.exp(-x * x), -math.inf, math.inf)[0] * kB * T_n
    rec(G_STEP, D, f'cuadratura de ⟨aq²⟩ (a={a_n}, T={T_n}): kT/2', val, kB * T_n / 2, 'rel 1e-10', abs(val - kB * T_n / 2) < 1e-10 * kB * T_n)
uQ = {'a': 'J', 'q': '1', 'beta': 'J^-1', 'f': '1', 'U': 'J mol^-1', 'Cv': 'J mol^-1 K^-1', 'gam': '1', 'c': 'm s^-1', 'M': 'kg mol^-1', 'R': 'J mol^-1 K^-1', 'T': 'K'}
dimcheck(D, '⟨aq²⟩ = kT/2 (βa q² adimensional)', Symbol('E', positive=True), a_ * q_ ** 2, dict(uQ, E='J'))
dimcheck(D, 'βa q² es adimensional', Symbol('x', positive=True), be * a_ * q_ ** 2, dict(uQ, x='1'))
dimcheck(D, 'U = (f/2)RT', U_, f_ / 2 * R * T, uQ)
dimcheck(D, 'C_v = (f/2)R', Cv_, f_ / 2 * R, uQ)
dimcheck(D, 'c = √(γRT/M)', Symbol('c', positive=True), sqrt(gam * R * T / Symbol('M', positive=True)), uQ)
eqf = lambda f, T_, M_: (f / 2 * Rg, (f + 2) / f, f / 2 * Rg * T_, math.sqrt((f + 2) / f * Rg * T_ / (M_ * 1e-3)))
num(D, 'C_v monoatómico', eqf(3, 300, 39.948)[0], '12.472'); num(D, 'C_v diatómico', eqf(5, 300, 28.0134)[0], '20.786'); num(D, 'γ diatómico', eqf(5, 300, 28.0134)[1], '1.4'); num(D, 'C_v (f = 7)', eqf(7, 300, 28.0134)[0], '29.101'); num(D, 'γ (f = 7)', eqf(7, 300, 28.0134)[1], '1.286', tol=1e-3); num(D, 'C sólido 3R', 3 * Rg, '24.94', tol=1e-4)
num(D, 'c (Ar)', eqf(3, 300, 39.948)[3], '322.6'); num(D, 'c (N₂)', eqf(5, 300, 28.0134)[3], '353.1'); num(D, 'c (He)', eqf(3, 300, 4.0026)[3], '1019.1'); num(D, 'c (N₂, 600 K)', eqf(5, 600, 28.0134)[3], '499.3'); num(D, 'U (N₂, kJ/mol)', eqf(5, 300, 28.0134)[2] / 1e3, '6.236'); num(D, 'U (600 K, kJ/mol)', eqf(5, 600, 28.0134)[2] / 1e3, '12.472')
num(D, 'C_v valor inicial', eqf(5, 300, 28.0134)[0], '20.7862'); num(D, 'γ valor inicial', eqf(5, 300, 28.0134)[1], '1.4'); num(D, 'U valor inicial', eqf(5, 300, 28.0134)[2], '6235.85'); num(D, 'c valor inicial', eqf(5, 300, 28.0134)[3], '353.068')
fq2 = Symbol('f', positive=True); Mq3 = Symbol('M', positive=True)
fs(D, 'Cv', fq2 / 2 * Rq); fs(D, 'g', (fq2 + 2) / fq2); fs(D, 'U', fq2 / 2 * Rq * Tq); fs(D, 'c', sqrt((fq2 + 2) / fq2 * Rq * Tq / (Mq3 * sp.Rational(1, 1000))))

# ---------------------------------------------------------------- camino libre y viscosidad
D = 'camino-libre'
d, lam, nu, eta_, vb, vrel = S('d lam nu eta vb vrel')
ident(D, 'v_rel = √(8kT/(π m/2)) = √2 v̄', sqrt(8 * k * T / (pi * (m / 2))), sqrt(2) * sqrt(8 * k * T / (pi * m)))
ident(D, 'λ = v̄/ν = 1/(√2 n π d²)', vb / (sqrt(2) * n_ * pi * d ** 2 * vb), 1 / (sqrt(2) * n_ * pi * d ** 2))
ident(D, 'λ = kT/(√2 π d² p) con n = p/kT', 1 / (sqrt(2) * (p / (k * T)) * pi * d ** 2), k * T / (sqrt(2) * pi * d ** 2 * p))
ident(D, 'momento transportado: (1/6)n v̄ · m·2λ = ⅓ n m v̄ λ', R_(1, 6) * n_ * vb * m * 2 * lam, R_(1, 3) * n_ * m * vb * lam)
ident(D, 'η = ⅓ n m v̄ λ = ⅓ m v̄/(√2 π d²) (n se cancela)', R_(1, 3) * n_ * m * vb / (sqrt(2) * n_ * pi * d ** 2), R_(1, 3) * m * vb / (sqrt(2) * pi * d ** 2))
ident(D, 'η = 2√(mkT)/(3π^(3/2) d²)', R_(1, 3) * m * sqrt(8 * k * T / (pi * m)) / (sqrt(2) * pi * d ** 2), 2 * sqrt(m * k * T) / (3 * pi ** R_(3, 2) * d ** 2))
# Monte Carlo de la velocidad relativa
sg = math.sqrt(kB * 300 / mm(28.0134))
v1 = rng.normal(0, sg, size=(1_500_000, 3)); v2_ = rng.normal(0, sg, size=(1_500_000, 3))
vrel_mc = float(np.linalg.norm(v1 - v2_, axis=1).mean()); vbar = math.sqrt(8 * kB * 300 / (math.pi * mm(28.0134)))
rec(G_STEP, D, 'Monte Carlo: ⟨|v₁ − v₂|⟩ = √2 v̄', vrel_mc, math.sqrt(2) * vbar, 'rel 2e-3', abs(vrel_mc / (math.sqrt(2) * vbar) - 1) < 2e-3)
# colisiones: distancia libre en Monte Carlo (simulación de choques con esferas duras en una muestra)
uL = {'lam': 'm', 'nu': 's^-1', 'd': 'm', 'n': 'm^-3', 'vb': 'm s^-1', 'eta': 'Pa s', 'm': 'kg', 'p': 'Pa', 'k': 'J K^-1', 'T': 'K'}
dimcheck(D, 'λ = kT/(√2 π d² p)', lam, k * T / (sqrt(2) * pi * d ** 2 * p), uL)
dimcheck(D, 'ν = √2 n π d² v̄', nu, sqrt(2) * n_ * pi * d ** 2 * vb, uL)
dimcheck(D, 'η = ⅓ n m v̄ λ', eta_, n_ * m * vb * lam / 3, uL)
dimcheck(D, 'η = 2√(mkT)/(3π^(3/2)d²)', eta_, 2 * sqrt(m * k * T) / (3 * pi ** R_(3, 2) * d ** 2), uL)
clf = lambda T_, d_, p_, M_: (lambda m_, n1, vb_: (lambda lam_: (lam_ * 1e9, vb_ / lam_, vb_, n1 * m_ * vb_ * lam_ / 3 * 1e6, lam_))(1 / (math.sqrt(2) * n1 * math.pi * (d_ * 1e-10) ** 2)))(mm(M_), p_ * 1e3 / (kB * T_), math.sqrt(8 * kB * T_ / (math.pi * mm(M_))))
num(D, 'λ (nm)', clf(300, 3.7, 101.325, 28.0134)[0], '67.2'); num(D, 'λ/d', clf(300, 3.7, 101.325, 28.0134)[0] / 0.37, '182', tol=0.01); num(D, 'ν (10⁹)', clf(300, 3.7, 101.325, 28.0134)[1] / 1e9, '7.085'); num(D, 'v̄', clf(300, 3.7, 101.325, 28.0134)[2], '476.2'); num(D, 'η simple (µPa·s)', clf(300, 3.7, 101.325, 28.0134)[3], '12.14')
chap = 5 / 16 / (3.7e-10) ** 2 * math.sqrt(mm(28.0134) * kB * 300 / math.pi) * 1e6
num(D, 'η Chapman–Enskog (µPa·s)', chap, '17.88'); num(D, 'diferencia del modelo elemental (%)', (1 - clf(300, 3.7, 101.325, 28.0134)[3] / chap) * 100, '32', tol=0.02)
num(D, 'λ a 101.3 Pa (µm)', clf(300, 3.7, 0.1013, 28.0134)[0] / 1e3, '67.2', tol=2e-3); num(D, 'η a 101.3 Pa', clf(300, 3.7, 0.1013, 28.0134)[3], '12.14'); num(D, 'λ a 10⁻⁶ Torr (m)', clf(300, 3.7, 1e-6 * 0.1333224, 28.0134)[4], '51', tol=0.005)
num(D, 'λ (600 K)', clf(600, 3.7, 101.325, 28.0134)[0], '134.4'); num(D, 'η (600 K)', clf(600, 3.7, 101.325, 28.0134)[3], '17.17'); num(D, 'aumento de η (%)', (clf(600, 3.7, 101.325, 28.0134)[3] / clf(300, 3.7, 101.325, 28.0134)[3] - 1) * 100, '41', tol=0.02); num(D, 'λ (He, 2.2 Å)', clf(300, 2.2, 101.325, 4.0026)[0], '190.1')
num(D, 'λ valor inicial', clf(300, 3.7, 101.325, 28.0134)[0], '67.2078'); num(D, 'ν valor inicial (10⁹)', clf(300, 3.7, 101.325, 28.0134)[1] / 1e9, '7.08509'); num(D, 'v̄ valor inicial', clf(300, 3.7, 101.325, 28.0134)[2], '476.173'); num(D, 'η valor inicial', clf(300, 3.7, 101.325, 28.0134)[3], '12.1392')
dq = Symbol('d', positive=True)
nn_ = pq * 1000 / (kq * Tq); vbq = sqrt(8 * kq * Tq / (pi * mq2)); dm = dq * sp.Float('1e-10', 40); lamq = 1 / (sqrt(2) * nn_ * pi * dm ** 2)
fs(D, 'lam', lamq * 10 ** 9); fs(D, 'nu', vbq / lamq); fs(D, 'vb', vbq); fs(D, 'eta', nn_ * mq2 * vbq * lamq / 3 * 10 ** 6)

# ---------------------------------------------------------------- efusión
D = 'efusion-graham'
th, ph, N0, tt, tau, Phi = symbols('theta phi N0 t tau Phi', positive=True)
integral(D, '∫₀^(π/2) cosθ sinθ dθ = ½', sp.cos(th) * sp.sin(th), th, 0, pi / 2, R_(1, 2))
ident(D, '∫₀^(2π) dφ/(4π) = ½', integrate(1 / (4 * pi), (ph, 0, 2 * pi)), R_(1, 2))
ident(D, 'ángulo sólido: ½·½ = ¼', R_(1, 2) * R_(1, 2), R_(1, 4))
# flujo con la componente z de la distribución de Maxwell (calculo independiente)
al2 = m / (2 * k * T)
integral(D, 'Φ = n ∫₀^∞ v_z φ(v_z) dv_z = n v̄/4', n_ * vz * sqrt(al2 / pi) * exp(-al2 * vz ** 2), vz, 0, oo, n_ * sqrt(8 * k * T / (pi * m)) / 4)
ident(D, 'Φ = ¼ n v̄ = p/√(2π m k T) con n = p/kT', R_(1, 4) * (p / (k * T)) * sqrt(8 * k * T / (pi * m)), p / sqrt(2 * pi * m * k * T))
m1, m2 = S('m1 m2')
ident(D, 'Graham: Φ₁/Φ₂ = √(m₂/m₁) a igual p y T', (p / sqrt(2 * pi * m1 * k * T)) / (p / sqrt(2 * pi * m2 * k * T)), sqrt(m2 / m1))
Nf = Function('N')
vbs, Vs_, As_ = S('vbs Vs As')
ode(D, 'dN/dt = −(v̄A/4V)N ⇒ N = N₀e^(−t/τ), τ = 4V/(Av̄)', Eq(Nf(tt).diff(tt), -vbs * As_ / (4 * Vs_) * Nf(tt)), Eq(Nf(tt), N0 * exp(-tt * vbs * As_ / (4 * Vs_))))
ident(D, 'τ = 4V/(A v̄)', 1 / (vbs * As_ / (4 * Vs_)), 4 * Vs_ / (As_ * vbs))
ident(D, 'dN/dt = −Φ A con Φ = n v̄/4, n = N/V', (-(vbs / 4) * (Symbol('Nn', positive=True) / Vs_) * As_), -vbs * As_ / (4 * Vs_) * Symbol('Nn', positive=True))
# cuadratura 3D del flujo (coordenadas esféricas de velocidad)
a_n = mm(28.0134) / (2 * kB * 300)
fl = quad(lambda vv: 4 * math.pi * (a_n / math.pi) ** 1.5 * vv ** 3 * math.exp(-a_n * vv ** 2), 0, math.inf)[0] / 4
rec(G_STEP, D, 'cuadratura: ∫ f(v) v dv/4 = p/√(2πmkT)/n', fl, math.sqrt(8 * kB * 300 / (math.pi * mm(28.0134))) / 4, 'rel 1e-10', abs(fl / (math.sqrt(8 * kB * 300 / (math.pi * mm(28.0134))) / 4) - 1) < 1e-10)
uF = {'Phi': 'm^-2 s^-1', 'n': 'm^-3', 'vb': 'm s^-1', 'p': 'Pa', 'm': 'kg', 'T': 'K', 'A': 'm^2', 'V': 'm^3', 'tau': 's', 'N': '1', 'k': 'J K^-1'}
dimcheck(D, 'Φ = n v̄/4', Phi, n_ * vb / 4, dict(uF, vb='m s^-1'))
dimcheck(D, 'Φ = p/√(2π m k T)', Phi, p / sqrt(2 * pi * m * k * T), uF)
dimcheck(D, 'τ = 4V/(A v̄)', tau, 4 * Vv / (A * vb), dict(uF, vb='m s^-1'))
efx = lambda M_, T_, p_, A_, V_: (lambda m_: (lambda vb_: (vb_, p_ / math.sqrt(2 * math.pi * m_ * kB * T_), p_ / math.sqrt(2 * math.pi * m_ * kB * T_) * A_ * 1e-6, 4 * V_ * 1e-3 / (A_ * 1e-6 * vb_)))(math.sqrt(8 * kB * T_ / (math.pi * m_))))(mm(M_))
num(D, 'Φ (10²²)', efx(28.0134, 300, 1, 1, 1)[1] / 1e22, '2.874'); num(D, 'dN/dt (10¹⁶)', efx(28.0134, 300, 1, 1, 1)[2] / 1e16, '2.874'); num(D, 'τ (N₂)', efx(28.0134, 300, 1, 1, 1)[3], '8.400'); num(D, 'τ (He)', efx(4.0026, 300, 1, 1, 1)[3], '3.175'); num(D, 'Φ(He)/Φ(N₂)', efx(4.0026, 300, 1, 1, 1)[1] / efx(28.0134, 300, 1, 1, 1)[1], '2.646')
num(D, 'τ (A = 10 mm²)', efx(28.0134, 300, 1, 10, 1)[3], '0.840'); num(D, 'τ (V = 10 L)', efx(28.0134, 300, 1, 1, 10)[3], '84.0'); num(D, 'τ (600 K)', efx(28.0134, 600, 1, 1, 1)[3], '5.940'); num(D, 'Graham H₂/O₂', math.sqrt(31.998 / 2.01588), '3.984'); num(D, 'Graham ²³⁵UF₆/²³⁸UF₆', math.sqrt(352.04 / 349.03), '1.0043', tol=1e-4)
num(D, 'λ a 1 Pa (mm)', 1 / (math.sqrt(2) * (1 / (kB * 300)) * math.pi * (3.7e-10) ** 2) * 1e3, '6.8', tol=0.01); num(D, 'd del orificio de 1 mm² (mm)', 2 * math.sqrt(1 / math.pi), '1.1', tol=0.03)
num(D, 'Φ valor inicial (10²²)', efx(28.0134, 300, 1, 1, 1)[1] / 1e22, '2.87409'); num(D, 'dN/dt valor inicial (10¹⁶)', efx(28.0134, 300, 1, 1, 1)[2] / 1e16, '2.87409'); num(D, 'τ valor inicial', efx(28.0134, 300, 1, 1, 1)[3], '8.40031'); num(D, 'v̄ valor inicial', efx(28.0134, 300, 1, 1, 1)[0], '476.173')
Aq, Vq = symbols('A V', positive=True)
mq4 = Mq * sp.Rational(1, 1000) / NAq
vbq4 = sqrt(8 * kq * Tq / (pi * mq4))
fs(D, 'Phi', pq / sqrt(2 * pi * mq4 * kq * Tq)); fs(D, 'Nd', pq / sqrt(2 * pi * mq4 * kq * Tq) * Aq * sp.Rational(1, 1000000)); fs(D, 'tau', 4 * Vq * sp.Rational(1, 1000) / (Aq * sp.Rational(1, 1000000) * vbq4)); fs(D, 'vb', vbq4)
