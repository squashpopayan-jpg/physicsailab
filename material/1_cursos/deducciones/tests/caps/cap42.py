# -*- coding: utf-8 -*-
"""Capítulo 42 — Geofísica y plasmas."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, tan, atan, erf, erfc, Matrix, Function, sinh
from scipy.integrate import quad, solve_ivp, solve_bvp
from scipy.special import erfinv
from scipy.optimize import brentq

qe = 1.602176634e-19; me = 9.1093837015e-31; mp = 1.67262192369e-27; eps0 = 8.8541878128e-12; kB = 1.380649e-23; mu0 = 1.25663706212e-6; MYR = 3.15576e13; alpha_ = 7.2973525693e-3
qeq = sp.Float('1.602176634e-19', 40); meq = sp.Float('9.1093837015e-31', 40); e0q = sp.Float('8.8541878128e-12', 40)
rng = np.random.default_rng(42)

# ================================================================ Giro y deriva E×B
D = 'giro-deriva'
Ev, Bv, qv, mv, vv = [Symbol(s_, positive=True) for s_ in ('E', 'B', 'q', 'm', 'v')]
Evec = Matrix([Ev, 0, 0]); Bvec = Matrix([0, 0, Bv]); vd = Evec.cross(Bvec) / Bv ** 2
ident(D, 'v_d = E×B/B² = (0, −E/B, 0) para E = Ex̂, B = Bẑ', sp.simplify(vd[1] + Ev / Bv), 0)
tot = Evec + vd.cross(Bvec)
for i in range(3):
    ident(D, f'E + v_d × B = 0 (componente {i + 1})', sp.simplify(tot[i]), 0)
solves(D, 'm v²/r = q v B ⇒ r = m v/(q B)', [Eq(mv * vv ** 2 / Symbol('r', positive=True), qv * vv * Bv)], Symbol('r', positive=True), mv * vv / (qv * Bv))
ident(D, 'ω_c = v/r_L = qB/m (independiente de v)', sp.simplify(vv / (mv * vv / (qv * Bv)) - qv * Bv / mv), 0)
# integración numérica del movimiento: q/m = 1, B = 1, E = 0.2 (perpendicular)
Eex, Bex = 0.2, 1.0
def lor(t, y): vx, vy, vz = y[3], y[4], y[5]; return [vx, vy, vz, Eex + vy * Bex, -vx * Bex, 0.0]
sol = solve_ivp(lor, [0, 200 * math.pi], [0, 0, 0, 0.7, 0, 0.3], rtol=1e-11, atol=1e-12, dense_output=True)
ts = np.linspace(0, 200 * math.pi, 20001); yy = sol.sol(ts)
tper = 2 * math.pi / Bex
nper = 100
rec(G_STEP, D, 'deriva numérica media en 100 períodos = −E/B en y', float((yy[1][-1] - yy[1][0]) / (ts[-1] - ts[0])), -Eex / Bex, 'rel 1e-4', abs((yy[1][-1] - yy[1][0]) / (ts[-1] - ts[0]) / (-Eex / Bex) - 1) < 1e-4)
vperp = np.hypot(yy[3] - 0, yy[4] + Eex)   # velocidad en el sistema de deriva
rec(G_STEP, D, 'en el sistema de deriva |v_⊥| es constante (movimiento circular)', float(np.std(vperp) / np.mean(vperp)), 0.0, 'rel 1e-8', np.std(vperp) / np.mean(vperp) < 1e-8)
vperp0 = vperp[0]
rec(G_STEP, D, 'radio de giro numérico = v_⊥/ω_c', float(0.5 * (max(yy[0]) - min(yy[0]))), vperp0 / Bex, 'rel 2e-3', abs(0.5 * (max(yy[0]) - min(yy[0])) / (vperp0 / Bex) - 1) < 2e-3)
uG = {'r_L': 'm', 'omega_c': 'rad s^-1', 'm': 'kg', 'q': 'C', 'v_perp': 'm s^-1', 'B': 'T', 'E': 'V m^-1', 'v_d': 'm s^-1'}
rL, wc, vperpS, vdS = [Symbol(k, positive=True) for k in ('r_L', 'omega_c', 'v_perp', 'v_d')]
dimcheck(D, 'r_L = m v_⊥/(|q|B)', rL, mv * vperpS / (qv * Bv), uG)
dimcheck(D, 'ω_c = |q|B/m', wc, qv * Bv / mv, uG)
dimcheck(D, 'v_d = E/B', vdS, Ev / Bv, uG)
def gyro(m_me, q_e, W_keV, B):
    m = m_me * me; q = q_e * qe; v = math.sqrt(2 * W_keV * 1e3 * qe / m); return v, m * v / (q * B), q * B / (2 * math.pi * m)
ge = gyro(1, 1, 1, 30e-6); gp = gyro(1836.15267343, 1, 1000, 5.0); gs = gyro(1836.15267343, 1, 10, 20e-9)
num(D, 'v e⁻ (10⁷ m/s)', ge[0] * 1e-7, '1.8755'); num(D, 'r_L e⁻ (m)', ge[1], '3.55'); num(D, 'f_c e⁻ (MHz)', ge[2] * 1e-6, '0.840'); num(D, 'v p (10⁷ m/s)', gp[0] * 1e-7, '1.384'); num(D, 'r_L p (mm)', gp[1] * 1e3, '28.9'); num(D, 'f_c p (MHz)', gp[2] * 1e-6, '76.2'); num(D, 'r_L viento solar (km)', gs[1] * 1e-3, '722'); num(D, 'f_c viento solar (Hz)', gs[2], '0.305')
num(D, 'E×B (1 kV/m, 1 T)', 1e3 / 1.0, '1000', tol=1e-9); num(D, 'E×B (1000 V/m, 5 T)', 1000 / 5.0, '200', tol=1e-9)
num(D, 'valor inicial: v', gp[0] * 1e-6, '13.8411'); num(D, 'valor inicial: r_L', gp[1] * 1e3, '28.8994'); num(D, 'valor inicial: f_c', gp[2] * 1e-6, '76.2259'); num(D, 'valor inicial: v_ExB', 1000 / 5.0, '200', tol=1e-9)
ms_, qs_, Ws, Bs, Es = symbols('m q W B E', positive=True)
mq = ms_ * meq; qq = qs_ * qeq; vq = sp.sqrt(2 * Ws * sp.Float('1e3', 40) * qeq / mq)
fsim('plas-giro', 'v', vq * sp.Float('1e-6', 40), deriv=D)
fsim('plas-giro', 'r', mq * vq / (qq * Bs) * 1000, deriv=D)
fsim('plas-giro', 'f', qq * Bs / (2 * sp.pi * mq) * sp.Float('1e-6', 40), deriv=D)
fsim('plas-giro', 'vd', Es / Bs, deriv=D)

# ================================================================ Debye y plasma
D = 'debye-plasma'
r_, lamD, e0, kT_, n0, e_, m_ = [Symbol(s_, positive=True) for s_ in ('r', 'lamD', 'eps0', 'kT', 'n0', 'e', 'm')]
phi = exp(-r_ / lamD) / r_
lap = diff(r_ ** 2 * diff(phi, r_), r_) / r_ ** 2
ident(D, '∇²φ = φ/λ_D² para φ = e^{−r/λ}/r (r > 0)', sp.simplify(lap - phi / lamD ** 2), 0)
ident(D, 'λ_D² = ε₀kT/(n₀e²) en ∇²φ = n₀e²φ/(ε₀kT)', sp.simplify(1 / (n0 * e_ ** 2 / (e0 * kT_)) - e0 * kT_ / (n0 * e_ ** 2)), 0)
ident(D, 'ρ ≈ e(n₀ − n₀e^{eφ/kT}) ≈ −n₀e²φ/kT (primer orden en eφ/kT)', sp.series(e_ * n0 * (1 - exp(e_ * Symbol('p', real=True) / kT_)), Symbol('p', real=True), 0, 2).removeO(), -n0 * e_ ** 2 * Symbol('p', real=True) / kT_)
xx_, tt_ = symbols('x t', real=True)
wp2 = n0 * e_ ** 2 / (e0 * m_)
ident(D, 'x(t) = x₀cos(ω_p t) resuelve m ẍ = −(n₀e²/ε₀)x', sp.simplify(m_ * diff(Symbol('x0', positive=True) * cos(sqrt(wp2) * tt_), tt_, 2) + n0 * e_ ** 2 / e0 * Symbol('x0', positive=True) * cos(sqrt(wp2) * tt_)), 0)
# Poisson–Boltzmann no lineal con simetría esférica (unidades λ_D = 1)
def pb_solution(q, rmin=0.01, rmax=12.0):
    # φ en unidades de kT/e; ecuación: (1/r²)(r²φ')' = sinh(φ); contorno: r²φ'(rmin) = −q (carga de prueba), φ(rmax) = 0
    def f(r, y): return np.vstack([y[1], np.sinh(y[0]) - 2 * y[1] / r])
    def bc(ya, yb): return np.array([ya[1] * rmin ** 2 + q, yb[0]])
    rr = np.linspace(rmin, rmax, 600); y0 = np.vstack([q / rr * np.exp(-rr), -q * (1 / rr ** 2 + 1 / rr) * np.exp(-rr)])
    return solve_bvp(f, bc, rr, y0, tol=1e-9, max_nodes=100000)
q_small = 1e-3
sb = pb_solution(q_small)
for rv in (0.5, 1.0, 2.0, 4.0):
    deb = q_small * math.exp(-rv) / rv
    rec(G_STEP, D, f'ecuación de Poisson–Boltzmann no lineal (carga pequeña): φ(r = {rv} λ_D) = q e^{{−r/λ}}/r', float(sb.sol(rv)[0]), deb, 'rel 2e-3', abs(sb.sol(rv)[0] / deb - 1) < 2e-3)
uD = {'lamD': 'm', 'omega_p': 'rad s^-1', 'n0': 'm^-3', 'e': 'C', 'eps0': 'F m^-1', 'k': 'J K^-1', 'T': 'K', 'm': 'kg', 'phi': 'V', 'N_D': '1'}
lamS, wpS, kS_, TS_, NDS = Symbol('lamD', positive=True), Symbol('omega_p', positive=True), Symbol('k', positive=True), Symbol('T', positive=True), Symbol('N_D', positive=True)
dimcheck(D, 'λ_D = √(ε₀kT/(n₀e²))', lamS, sqrt(e0 * kS_ * TS_ / (n0 * e_ ** 2)), uD)
dimcheck(D, 'ω_p = √(n₀e²/(ε₀m))', wpS, sqrt(n0 * e_ ** 2 / (e0 * m_)), uD)
dimcheck(D, 'N_D = (4π/3) n₀ λ_D³', NDS, 4 * pi / 3 * n0 * lamS ** 3, uD)
def deb(n, TeV): T = TeV * qe; return math.sqrt(eps0 * T / (n * qe ** 2)), math.sqrt(n * qe ** 2 / (eps0 * me))
for (nm, n, Te) in (('ionosfera', 1e12, 0.1), ('viento solar', 5e6, 10.0), ('tokamak', 1e20, 1e4), ('denso frío', 1e25, 1.0)):
    l, w = deb(n, Te); globals()['pl_' + nm.replace(' ', '_').replace('í', 'i')] = (l, w, 4 * math.pi / 3 * n * l ** 3)
li, wi = deb(1e12, 0.1); ls, ws = deb(5e6, 10.0); lt, wt = deb(1e20, 1e4); lc, wc_ = deb(1e25, 1.0)
num(D, 'λ_D ionosfera (mm)', li * 1e3, '2.35'); num(D, 'f_p ionosfera (MHz)', wi / (2 * math.pi) * 1e-6, '8.979'); num(D, 'N_D ionosfera (10⁴)', 4 * math.pi / 3 * 1e12 * li ** 3 * 1e-4, '5.4'); num(D, 'λ_D viento solar (m)', ls, '10.5'); num(D, 'f_p viento solar (kHz)', ws / (2 * math.pi) * 1e-3, '20.08'); num(D, 'N_D viento solar (10¹⁰)', 4 * math.pi / 3 * 5e6 * ls ** 3 * 1e-10, '2.4')
num(D, 'λ_D tokamak (µm)', lt * 1e6, '74.3'); num(D, 'f_p tokamak (GHz)', wt / (2 * math.pi) * 1e-9, '89.8'); num(D, 'N_D tokamak (10⁸)', 4 * math.pi / 3 * 1e20 * lt ** 3 * 1e-8, '1.7'); num(D, 'λ_D denso frío (nm)', lc * 1e9, '2.35'); num(D, 'N_D denso frío', 4 * math.pi / 3 * 1e25 * lc ** 3, '0.544')
num(D, 'f_p ≈ 8.98√n', 8.9787 * math.sqrt(1e12), '8.98e6', tol=1e-3)
num(D, 'valor inicial: λ_D', li * 1e3, '2.35082'); num(D, 'valor inicial: ω_p', wi * 1e-7, '5.64146'); num(D, 'valor inicial: f_p', wi / (2 * math.pi) * 1e-6, '8.97866'); num(D, 'valor inicial: N_D', 4 * math.pi / 3 * 1e12 * li ** 3, '54418.4')
ns, Ts = symbols('n T', positive=True)
ldq = sp.sqrt(e0q * Ts * qeq / (ns * qeq ** 2)); wpq = sp.sqrt(ns * qeq ** 2 / (e0q * meq))
fsim('plas-debye', 'ld', ldq, deriv=D)
fsim('plas-debye', 'wp', wpq, deriv=D)
fsim('plas-debye', 'fp', wpq / (2 * sp.pi), deriv=D)
fsim('plas-debye', 'ND', 4 * sp.pi / 3 * ns * ldq ** 3, deriv=D)

# ================================================================ Sismología
D = 'ondas-sismicas'
x, y, z, t = symbols('x y z t', real=True)
lam_, mu_, rho_, kw, ww, A = [Symbol(s_, positive=True) for s_ in ('lam', 'mu', 'rho', 'k', 'w', 'A')]
ux = Matrix([sin(y) * cos(z), exp(x) * z, x * y])
def div(u): return diff(u[0], x) + diff(u[1], y) + diff(u[2], z)
def grad(f): return Matrix([diff(f, x), diff(f, y), diff(f, z)])
def curl(u): return Matrix([diff(u[2], y) - diff(u[1], z), diff(u[0], z) - diff(u[2], x), diff(u[1], x) - diff(u[0], y)])
lapv = Matrix([diff(c_, x, 2) + diff(c_, y, 2) + diff(c_, z, 2) for c_ in ux])
dif = lapv - (grad(div(ux)) - curl(curl(ux)))
for i in range(3):
    ident(D, f'identidad ∇²u = ∇(∇·u) − ∇×(∇×u) (componente {i + 1}, campo de prueba)', sp.simplify(dif[i]), 0)
def navier(u): return (lam_ + 2 * mu_) * grad(div(u)) - mu_ * curl(curl(u))
uP = Matrix([A * cos(kw * x - ww * t), 0, 0]); uS = Matrix([0, A * cos(kw * x - ww * t), 0])
resP = rho_ * diff(uP, t, 2) - navier(uP); resS = rho_ * diff(uS, t, 2) - navier(uS)
ident(D, 'onda P (longitudinal): ρω² = (λ+2μ)k²', sp.simplify(resP[0].subs(ww, kw * sqrt((lam_ + 2 * mu_) / rho_))), 0)
ident(D, 'onda S (transversal): ρω² = μk²', sp.simplify(resS[1].subs(ww, kw * sqrt(mu_ / rho_))), 0)
Kk = Symbol('K', positive=True)
ident(D, 'λ + 2μ = K + 4μ/3 con K = λ + 2μ/3', sp.simplify((Kk + 4 * mu_ / 3).subs(Kk, lam_ + 2 * mu_ / 3) - (lam_ + 2 * mu_)), 0)
ident(D, 'v_P/v_S = √(K/μ + 4/3)', sp.simplify(sqrt((Kk + 4 * mu_ / 3) / mu_) - sqrt(Kk / mu_ + R_(4, 3))), 0)
ident(D, 'ν = (K − 2μ/3)/(2(K + μ/3)) = (v_P² − 2v_S²)/(2(v_P² − v_S²))', sp.simplify((Kk - 2 * mu_ / 3) / (2 * (Kk + mu_ / 3)) - (((Kk + 4 * mu_ / 3) - 2 * mu_) / (2 * ((Kk + 4 * mu_ / 3) - mu_)))), 0)
# onda P unidimensional por diferencias finitas: velocidad medida
Nx = 4001; L = 4000.0; dx = L / (Nx - 1); xs = np.linspace(0, L, Nx)
vP_t = 5000.0; dt = 0.4 * dx / vP_t
u0 = np.exp(-((xs - 1000.0) / 60.0) ** 2); uprev = u0.copy(); ucur = u0.copy()
nsteps = int(0.2 / dt)
for _ in range(nsteps):
    unew = np.zeros_like(ucur); unew[1:-1] = 2 * ucur[1:-1] - uprev[1:-1] + (vP_t * dt / dx) ** 2 * (ucur[2:] - 2 * ucur[1:-1] + ucur[:-2]); uprev, ucur = ucur, unew
pos = xs[np.argmax(ucur)]; vmed = (pos - 1000.0) / (nsteps * dt)
rec(G_STEP, D, 'simulación de la ecuación de ondas con v² = (λ+2μ)/ρ: el pulso avanza a v_P', vmed, vP_t, 'rel 2e-2', abs(vmed / vP_t - 1) < 2e-2)
uSe = {'v_P': 'm s^-1', 'v_S': 'm s^-1', 'K': 'Pa', 'mu': 'Pa', 'rho': 'kg m^-3', 'lam': 'Pa', 'nu': '1'}
vPs, vSs, nus = Symbol('v_P', positive=True), Symbol('v_S', positive=True), Symbol('nu', positive=True)
dimcheck(D, 'v_P = √((K+4μ/3)/ρ)', vPs, sqrt((Kk + 4 * mu_ / 3) / rho_), uSe)
dimcheck(D, 'v_S = √(μ/ρ)', vSs, sqrt(mu_ / rho_), uSe)
dimcheck(D, 'ν = (K−2μ/3)/(2(K+μ/3))', nus, (Kk - 2 * mu_ / 3) / (2 * (Kk + mu_ / 3)), uSe)
def sis(K, mu, rho): return math.sqrt((K + 4 * mu / 3) * 1e9 / rho) * 1e-3, math.sqrt(mu * 1e9 / rho) * 1e-3, math.sqrt((K + 4 * mu / 3) / mu) if mu else None, (K - 2 * mu / 3) / (2 * (K + mu / 3))
m_ = sis(130, 70, 3300); g_ = sis(55, 30, 2700); a_ = sis(2.2, 0, 1000)
num(D, 'v_P manto', m_[0], '8.227'); num(D, 'v_S manto', m_[1], '4.606'); num(D, 'v_P/v_S manto', m_[2], '1.786'); num(D, 'ν manto', m_[3], '0.2717'); num(D, 'v_P granito', g_[0], '5.932'); num(D, 'v_S granito', g_[1], '3.333'); num(D, 'v_P agua', a_[0], '1.483'); num(D, 'ν agua', a_[3], '0.5', tol=1e-9)
num(D, 'distancia con Δt = 60 s', 60 / (1 / 4.5 - 1 / 8.0), '617'); num(D, 'v_P/v_S sólido de Poisson', math.sqrt(3), '1.732'); num(D, 'v_P/v_S mínimo', math.sqrt(4 / 3), '1.155')
num(D, 'valor inicial: v_P', m_[0], '8.22659'); num(D, 'valor inicial: v_S', m_[1], '4.60566'); num(D, 'valor inicial: razón', m_[2], '1.78619'); num(D, 'valor inicial: ν', m_[3], '0.271739')
Ks, mus, rhos = symbols('K mu rho', positive=True)
fsim('geo-sismica', 'vp', sp.sqrt((Ks + 4 * mus / 3) * sp.Float('1e9', 40) / rhos) * sp.Float('1e-3', 40), deriv=D)
fsim('geo-sismica', 'vs', sp.sqrt(mus * sp.Float('1e9', 40) / rhos) * sp.Float('1e-3', 40), deriv=D)
fsim('geo-sismica', 'r', sp.sqrt((Ks + 4 * mus / 3) / mus), deriv=D)
fsim('geo-sismica', 'nu', (Ks - 2 * mus / 3) / (2 * (Ks + mus / 3)), deriv=D)

# ================================================================ Litosfera
D = 'litosfera-oceanica'
zz, tt, kap, eta = symbols('z t kappa eta', positive=True)
Tf = erf(zz / (2 * sqrt(kap * tt)))
ident(D, 'erf(z/(2√(κt))) resuelve ∂T/∂t = κ ∂²T/∂z²', sp.simplify(diff(Tf, tt) - kap * diff(Tf, zz, 2)), 0)
ident(D, 'T(0) = T_s: erf(0) = 0', Tf.subs(zz, 0), 0)
ident(D, 'T(z → ∞) → T_m: erf(∞) = 1', sp.limit(erf(zz), zz, oo), 1)
ident(D, 'flujo en z = 0: ∂T/∂z = 1/√(πκt)', sp.simplify(diff(Tf, zz).subs(zz, 0)), 1 / sqrt(pi * kap * tt))
integral(D, '∫₀^∞ erfc(z/(2√(κt))) dz = 2√(κt/π)', erfc(zz / (2 * sqrt(kap * tt))), zz, 0, oo, 2 * sqrt(kap * tt / pi))
ident(D, 'T″(η) + 2ηT′(η) = 0 para T = erf η', sp.simplify(diff(erf(eta), eta, 2) + 2 * eta * diff(erf(eta), eta)), 0)
etaL = float(erfinv(0.9))
rec(G_STEP, D, 'erf(η_L) = 0.9 ⇒ η_L = 1.1631 (2η_L = 2.3262)', 2 * etaL, 2.3261743073533485, 'rel 1e-12', abs(2 * etaL / 2.3261743073533485 - 1) < 1e-12)
# diferencias finitas de la ecuación del calor frente a la solución erf
kap_n = 1e-6; Nz = 2001; zmax = 4.0e5; dz = zmax / (Nz - 1); zs = np.linspace(0, zmax, Nz)
age = 80 * MYR
def rhsT(t_, T): d = np.zeros_like(T); d[1:-1] = kap_n * (T[2:] - 2 * T[1:-1] + T[:-2]) / dz ** 2; return d
T0 = np.ones(Nz); T0[0] = 0.0
solT = solve_ivp(rhsT, [0, age], T0, method='BDF', rtol=1e-8, atol=1e-10, t_eval=[age])
Tnum = solT.y[:, -1]; Tex = np.array([math.erf(zv / (2 * math.sqrt(kap_n * age))) for zv in zs])
rec(G_STEP, D, 'diferencias finitas de la ecuación del calor (80 Ma): error máximo respecto a la solución erf', float(np.max(np.abs(Tnum - Tex))), 0.0, 'abs 5e-3', np.max(np.abs(Tnum - Tex)) < 5e-3)
uLi = {'T': 'K', 'kappa': 'm^2 s^-1', 't': 's', 'z': 'm', 'k': 'W m^-1 K^-1', 'q': 'W m^-2', 'z_L': 'm', 'rho_m': 'kg m^-3', 'rho_w': 'kg m^-3', 'alpha': 'K^-1', 'dT': 'K', 'w': 'm'}
zLs, qs, ks, dTs, rhm, rhw, als, wS = [Symbol(k, positive=True) for k in ('z_L', 'q', 'k', 'dT', 'rho_m', 'rho_w', 'alpha', 'w')]
dimcheck(D, 'z_L = 2.326√(κt)', zLs, 2.326 * sqrt(kap * tt), uLi)
dimcheck(D, 'q = kΔT/√(πκt)', qs, ks * dTs / sqrt(pi * kap * tt), uLi)
dimcheck(D, 'w = 2ρ_mαΔT/(ρ_m−ρ_w) √(κt/π)', wS, 2 * rhm * als * dTs / (rhm - rhw) * sqrt(kap * tt / pi), uLi)
def lito(t_Ma, kap_, dT, k):
    s = math.sqrt(kap_ * 1e-6 * t_Ma * MYR); return 2.3261743073533485 * s * 1e-3, k * dT / (math.sqrt(math.pi) * s) * 1e3, 2 * 3330 * 3.1e-5 * dT / (3330 - 1000) * s / math.sqrt(math.pi), 350 * math.sqrt(t_Ma)
for t_, zl, qm in ((10, '41.3', '128.0'), (50, '92.4', '57.2'), (80, '116.9', '45.3'), (100, '130.7', '40.5')):
    L_ = lito(t_, 1.0, 1300.0, 3.1); num(D, f'z_L({t_} Ma)', L_[0], zl); num(D, f'q({t_} Ma)', L_[1], qm)
L80 = lito(80, 1.0, 1300.0, 3.1)
num(D, 'hundimiento 80 Ma', L80[2], '3265'); num(D, '350√80', L80[3], '3130'); num(D, 'diferencia (%)', (L80[2] / L80[3] - 1) * 100, '4', tol=0.02)
num(D, 'valor inicial: z_L', L80[0], '116.880'); num(D, 'valor inicial: q', L80[1], '45.2515'); num(D, 'valor inicial: hundimiento', L80[2], '3265.47'); num(D, 'valor inicial: 350√t', L80[3], '3130.50')
ts_, kaps, dTs_, ks_ = symbols('t kap dT k', positive=True)
ss = sp.sqrt(kaps * sp.Float('1e-6', 40) * ts_ * sp.Float(MYR, 20))
fsim('geo-litosfera', 'zL', 2 * sp.erfinv(sp.Float('0.9', 40)) * ss * sp.Float('1e-3', 40), deriv=D)
fsim('geo-litosfera', 'q', ks_ * dTs_ / (sp.sqrt(sp.pi) * ss) * 1000, deriv=D)
fsim('geo-litosfera', 'dd', 2 * sp.Float('3330', 20) * sp.Float('3.1e-5', 20) * dTs_ / sp.Float('2330', 20) * ss / sp.sqrt(sp.pi), deriv=D)
fsim('geo-litosfera', 'ds', 350 * sp.sqrt(ts_), deriv=D)

# ================================================================ Dipolo
D = 'dipolo-terrestre'
rS, thS, Mm, mu0s = symbols('r theta M mu0', positive=True)
Psi = mu0s / (4 * pi) * Mm * cos(thS) / rS ** 2
Br = -diff(Psi, rS); Bth = -diff(Psi, thS) / rS
ident(D, 'B_r = −∂Ψ/∂r = (μ₀M/4π) 2cosθ/r³', sp.simplify(Br - mu0s * Mm / (4 * pi) * 2 * cos(thS) / rS ** 3), 0)
ident(D, 'B_θ = −(1/r)∂Ψ/∂θ = (μ₀M/4π) sinθ/r³', sp.simplify(Bth - mu0s * Mm / (4 * pi) * sin(thS) / rS ** 3), 0)
lat = Symbol('lat', positive=True)
Bv_ = Br.subs(thS, pi / 2 - lat); Bh_ = Bth.subs(thS, pi / 2 - lat)
ident(D, 'B_vert = 2B₀(R/r)³ sen λ y B_hor = B₀(R/r)³ cos λ con B₀ = μ₀M/(4πR³)', sp.simplify(Bv_ / Bh_ - 2 * tan(lat)), 0)
ident(D, '|B| = B₀(R/r)³ √(1 + 3 sen²λ)', sp.simplify(sp.sqrt(Bv_ ** 2 + Bh_ ** 2) - mu0s * Mm / (4 * pi * rS ** 3) * sqrt(1 + 3 * sin(lat) ** 2)), 0)
ident(D, 'tan I = 2 tan λ', sp.simplify(Bv_ / Bh_), 2 * tan(lat))
ident(D, '∇·B = 0 del dipolo (divergencia del gradiente de Ψ en esféricas, ∇²Ψ = 0)', sp.simplify(diff(rS ** 2 * diff(Psi, rS), rS) / rS ** 2 + diff(sin(thS) * diff(Psi, thS), thS) / (rS ** 2 * sin(thS))), 0)
# Biot–Savart numérico de una espira pequeña
Mmom = 1.0; a_loop = 1e-3; Iloop = Mmom / (math.pi * a_loop ** 2)
def bs(P):
    def dB(phi):
        pos = np.array([a_loop * math.cos(phi), a_loop * math.sin(phi), 0.0]); dl = np.array([-a_loop * math.sin(phi), a_loop * math.cos(phi), 0.0])
        rv = P - pos; return np.cross(dl, rv) / np.linalg.norm(rv) ** 3
    return mu0 * Iloop / (4 * math.pi) * np.array([quad(lambda ph: dB(ph)[i], 0, 2 * math.pi, epsabs=1e-30, epsrel=1e-12)[0] for i in range(3)])
for colat in (90.0, 60.0, 30.0):
    th = math.radians(colat); r0 = 1.0; P = np.array([r0 * math.sin(th), 0.0, r0 * math.cos(th)])
    Bn = bs(P); Br_n = Bn @ np.array([math.sin(th), 0, math.cos(th)]); Bth_n = Bn @ np.array([math.cos(th), 0, -math.sin(th)])
    Br_a = mu0 * Mmom / (4 * math.pi) * 2 * math.cos(th) / r0 ** 3; Bth_a = mu0 * Mmom / (4 * math.pi) * math.sin(th) / r0 ** 3
    rec(G_STEP, D, f'Biot–Savart de una espira pequeña (colatitud {colat:g}°): B_r = fórmula dipolar', float(Br_n), Br_a, 'rel 1e-4', abs(Br_n - Br_a) < 1e-4 * mu0 / (4 * math.pi) * 2)
    rec(G_STEP, D, f'Biot–Savart de una espira pequeña (colatitud {colat:g}°): B_θ = fórmula dipolar', float(Bth_n), Bth_a, 'rel 1e-4', abs(Bth_n - Bth_a) < 1e-4 * mu0 / (4 * math.pi))
uDi = {'B': 'T', 'B_0': 'T', 'M': 'A m^2', 'R': 'm', 'r': 'm', 'lambda': 'rad', 'mu0': 'H m^-1', 'Psi': 'T m'}
BS_, B0S, MS_, RS_ = [Symbol(k, positive=True) for k in ('B', 'B_0', 'M', 'R')]
dimcheck(D, 'B₀ = μ₀M/(4πR³)', B0S, mu0s * MS_ / (4 * pi * RS_ ** 3), uDi)
dimcheck(D, 'B = B₀(R/r)³√(1 + 3sen²λ)', BS_, B0S * (RS_ / rS) ** 3 * sqrt(1 + 3 * sin(lat) ** 2), dict(uDi, lat='rad'))
dimcheck(D, 'Ψ = μ₀M cosθ/(4πr²)', Symbol('Psi', positive=True), mu0s * MS_ * cos(thS) / (4 * pi * rS ** 2), dict(uDi, theta='rad'))
R_E = 6.371e6; B0e = mu0 * 7.8e22 / (4 * math.pi * R_E ** 3)
bd = lambda lat, r=1.0, B0=B0e: (B0 * r ** -3 * math.sqrt(1 + 3 * math.sin(math.radians(lat)) ** 2), 2 * B0 * r ** -3 * math.sin(math.radians(lat)), B0 * r ** -3 * math.cos(math.radians(lat)), math.degrees(math.atan(2 * math.tan(math.radians(lat)))))
num(D, 'B₀ (µT)', B0e * 1e6, '30.163'); num(D, 'B(30°)', bd(30)[0] * 1e6, '39.90'); num(D, 'I(30°)', bd(30)[3], '49.1'); num(D, 'B(45°)', bd(45)[0] * 1e6, '47.69'); num(D, 'I(45°)', bd(45)[3], '63.43'); num(D, 'B(60°)', bd(60)[0] * 1e6, '54.38'); num(D, 'I(60°)', bd(60)[3], '73.90'); num(D, 'B polos', 2 * B0e * 1e6, '60.33')
num(D, 'B a 2R (fracción)', 2 ** -3, '0.125', tol=1e-9); num(D, 'B geoestacionaria (µT)', B0e * 6.6 ** -3 * 1e6, '0.105')
num(D, 'valor inicial: B', bd(45, 1.0, 30.1628e-6)[0] * 1e6, '47.6916', tol=1e-4); num(D, 'valor inicial: B_vert', bd(45, 1.0, 30.1628e-6)[1] * 1e6, '42.66', tol=1e-3); num(D, 'valor inicial: B_hor', bd(45, 1.0, 30.1628e-6)[2] * 1e6, '21.33', tol=1e-3); num(D, 'valor inicial: I', bd(45)[3], '63.435', tol=1e-5)
lats, rrs, B0s = symbols('lat r B0', positive=True)
cvt = lambda p: dict(lat=math.radians(p['lat']), r=p['r'], B0=p['B0'])
fsim('geo-dipolo', 'B', B0s * rrs ** -3 * sp.sqrt(1 + 3 * sp.sin(lats) ** 2), conv=cvt, deriv=D)
fsim('geo-dipolo', 'Br', 2 * B0s * rrs ** -3 * sp.sin(lats), conv=cvt, deriv=D)
fsim('geo-dipolo', 'Bh', B0s * rrs ** -3 * sp.cos(lats), conv=cvt, deriv=D)
fsim('geo-dipolo', 'I', sp.atan(2 * sp.tan(lats)) * 180 / sp.pi, conv=cvt, deriv=D)
