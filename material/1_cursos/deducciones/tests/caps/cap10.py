# -*- coding: utf-8 -*-
"""Capítulo 10 — Cuerpo rígido."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, tan, Function, Matrix, solve, simplify, oo
import mpmath as mp
from scipy.integrate import solve_ivp

EX = {'momentos-inercia': 'inercia', 'rodar-plano': 'rodar', 'giroscopio': 'giroscopio', 'euler-libre': 'euler-libre', 'billar': 'billar'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
fp_ = lambda D_, *a, **k: fsim_py(EX.get(D_, D_), *a, deriv=D_, **k)
G0 = 9.80665
m, g, t = S('m g t')

# ---------------------------------------------------------------- momentos de inercia
D = 'momentos-inercia'
L, R, d, rho, x, r, z = S('L R d rho x r z')
integral(D, 'varilla: ∫x²(m/L)dx = mL²/12', x ** 2 * m / L, x, -L / 2, L / 2, m * L ** 2 / 12)
integral(D, 'disco: ∫r² (m/πR²) 2πr dr = ½mR²', r ** 2 * m / (pi * R ** 2) * 2 * pi * r, r, 0, R, m * R ** 2 / 2)
rho_ = 3 * m / (4 * pi * R ** 3)
integral(D, 'esfera: ∫½ρπ(R²−z²)² dz = (2/5)mR²', rho_ * pi * (R ** 2 - z ** 2) ** 2 / 2, z, -R, R, R_(2, 5) * m * R ** 2)
integral(D, 'esfera: masa total ∫ρπ(R²−z²)dz = m', rho_ * pi * (R ** 2 - z ** 2), z, -R, R, m)
integral(D, 'esfera por integración volumétrica: ∫ρ r² sen²θ dV', 3 * m / (4 * pi * R ** 3) * (Symbol('rr', positive=True) ** 2 * sin(Symbol('ph', positive=True)) ** 2) * Symbol('rr', positive=True) ** 2 * sin(Symbol('ph', positive=True)) * 2 * pi, Symbol('rr', positive=True), 0, R, 3 * m / (4 * pi * R ** 3) * 2 * pi * R ** 5 / 5 * sp.integrate(sin(Symbol('ph', positive=True)) ** 3, (Symbol('ph', positive=True), 0, pi))) if False else None
ph = Symbol('ph', positive=True); rr = Symbol('rr', positive=True)
Iv = integrate(integrate(rho_ * (rr * sin(ph)) ** 2 * rr ** 2 * sin(ph) * 2 * pi, (rr, 0, R)), (ph, 0, pi))
ident(D, 'esfera: I = ∫ρ(r senφ)² dV en esféricas = (2/5)mR²', Iv, R_(2, 5) * m * R ** 2)
# Steiner: comprobación con un conjunto de masas puntuales
rng = np.random.default_rng(11)
pts = rng.normal(size=(50, 3)); ms = rng.uniform(0.5, 2.0, 50); cm = (ms[:, None] * pts).sum(0) / ms.sum()
n_ = np.array([0.3, -0.5, 0.8]); n_ /= np.linalg.norm(n_)
def Iaxis(pt0): return float(sum(mi * (np.linalg.norm(p_ - pt0) ** 2 - np.dot(p_ - pt0, n_) ** 2) for mi, p_ in zip(ms, pts)))
off = np.array([0.4, 0.2, -0.1]); dperp = off - np.dot(off, n_) * n_
rec(G_STEP, D, 'Steiner con 50 masas puntuales: I = I_cm + M d²', Iaxis(cm + off), Iaxis(cm) + ms.sum() * float(np.dot(dperp, dperp)), 'rel 1e-12', abs(Iaxis(cm + off) - Iaxis(cm) - ms.sum() * float(np.dot(dperp, dperp))) < 1e-10)
ident(D, 'varilla por un extremo: mL²/12 + m(L/2)² = mL²/3', m * L ** 2 / 12 + m * (L / 2) ** 2, m * L ** 2 / 3)
ident(D, 'disco con d = R: ½mR² + mR² = (3/2)mR²', m * R ** 2 / 2 + m * R ** 2, R_(3, 2) * m * R ** 2)
ui = {'I': 'kg m^2', 'm': 'kg', 'R': 'm', 'L': 'm', 'd': 'm'}
for nm, e_ in (('varilla', m * L ** 2 / 12), ('disco', m * R ** 2 / 2), ('esfera', R_(2, 5) * m * R ** 2), ('aro', m * R ** 2), ('Steiner', m * R ** 2 / 2 + m * d ** 2)):
    dimcheck(D, f'I de {nm}', Symbol('I', positive=True), e_, ui)
num(D, 'disco', 0.5 * 1 * 0.01, '5.0', tol=1e-3) if False else None
Ik = lambda c, m_=1, R_=0.1: c * m_ * R_ ** 2
num(D, 'disco (10⁻³)', Ik(0.5) / 1e-3, '5.0'); num(D, 'esfera (10⁻³)', Ik(0.4) / 1e-3, '4.0'); num(D, 'aro (10⁻²)', Ik(1) / 1e-2, '1.0'); num(D, 'varilla 0.2 m (10⁻³)', 0.2 ** 2 / 12 / 1e-3, '3.33'); num(D, 'varilla por el extremo (10⁻²)', 0.2 ** 2 / 3 / 1e-2, '1.33'); num(D, 'disco con d = 0.05 (10⁻³)', (Ik(0.5) + 0.05 ** 2) / 1e-3, '7.5'); num(D, 'radio de giro', 0.1 / math.sqrt(2), '0.0707')
num(D, 'razón extremo/centro', 4.0, '4'); num(D, 'aro/disco', 2.0, '2'); num(D, 'esfera hueca/maciza', (2 / 3) / 0.4, '1.667', tol=1e-3)
num(D, 'varilla valor inicial (10⁻³)', 0.04 / 12 / 1e-3, '3.3333'); num(D, 'radio de giro valor inicial', 0.1 / math.sqrt(2), '0.070711')
mp_, Rp, dp = symbols('m R d', positive=True)
fs(D, 'Id', mp_ * Rp ** 2 / 2); fs(D, 'Is', R_(2, 5) * mp_ * Rp ** 2); fs(D, 'Ia', mp_ * Rp ** 2); fs(D, 'Ir', mp_ * 4 * Rp ** 2 / 12); fs(D, 'Ist', mp_ * Rp ** 2 / 2 + mp_ * dp ** 2); fs(D, 'kg', Rp / sqrt(2))

# ---------------------------------------------------------------- rodar
D = 'rodar-plano'
th, c, a, f, mu, h, N, v = S('theta c a f mu h N v')
solves(D, 'sistema traslación + rotación: a', [Eq(m * a, m * g * sin(th) - f), Eq(f, c * m * a)], a, g * sin(th) / (1 + c), vars=[a, f])
solves(D, 'sistema traslación + rotación: f', [Eq(m * a, m * g * sin(th) - f), Eq(f, c * m * a)], f, c / (1 + c) * m * g * sin(th), vars=[a, f])
ident(D, 'μ mín = f/N = c tanθ/(1+c)', (c / (1 + c) * m * g * sin(th)) / (m * g * cos(th)), c / (1 + c) * tan(th))
ident(D, 'energía: ½mv² + ½c m v² = mgh', (m * v ** 2 / 2 + c * m * v ** 2 / 2).subs(v, sqrt(2 * g * h / (1 + c))), m * g * h)
ident(D, 'v² = 2a s con s = h/senθ', 2 * (g * sin(th) / (1 + c)) * (h / sin(th)), 2 * g * h / (1 + c))
ident(D, 'c = 0: a = g senθ', (g * sin(th) / (1 + c)).subs(c, 0), g * sin(th))
# simulación numérica de rodadura (esfera, aro, cilindro) con la ecuación de movimiento completa
for cc in (0.4, 0.5, 1.0):
    thv = math.radians(30)
    def rhs(tt, y): return [y[1], 9.81 * math.sin(thv) / (1 + cc)]
    sol = solve_ivp(rhs, [0, 5], [0, 0], rtol=1e-12, atol=1e-13)
    s_ = 1.0 / math.sin(thv); tq = math.sqrt(2 * s_ / (9.81 * math.sin(thv) / (1 + cc)))
    v_end = (9.81 * math.sin(thv) / (1 + cc)) * tq
    rec(G_STEP, D, f'v al descender 1 m: cinemática = energía (c = {cc})', v_end, math.sqrt(2 * 9.81 / (1 + cc)), 'rel 1e-12', abs(v_end - math.sqrt(2 * 9.81 / (1 + cc))) < 1e-10)
ur = {'a': 'm s^-2', 'g': 'm s^-2', 'theta': 'rad', 'c': '1', 'f': 'N', 'm': 'kg', 'mu': '1', 'v': 'm s^-1', 'h': 'm', 'N': 'N'}
dimcheck(D, 'a = g senθ/(1+c)', a, g * sin(th) / (1 + c), ur); dimcheck(D, 'f = c m g senθ/(1+c)', f, c / (1 + c) * m * g * sin(th), ur); dimcheck(D, 'μ_mín', mu, c / (1 + c) * tan(th), ur); dimcheck(D, 'v = √(2gh/(1+c))', v, sqrt(2 * g * h / (1 + c)), ur)
rl = lambda cc, thd=30: (9.81 * math.sin(math.radians(thd)) / (1 + cc), cc / (1 + cc) * math.tan(math.radians(thd)), math.sqrt(2 * 9.81 / (1 + cc)))
for nm, cc, aa, mm_, vv_ in (('esfera', 0.4, '3.504', '0.165', '3.744'), ('cilindro', 0.5, '3.270', '0.192', '3.617'), ('casquete', 2 / 3, '2.943', '0.231', '3.431'), ('aro', 1.0, '2.452', '0.289', '3.132')):
    num(D, f'a ({nm})', rl(cc)[0], aa); num(D, f'μ mín ({nm})', rl(cc)[1], mm_); num(D, f'v ({nm})', rl(cc)[2], vv_)
num(D, 'a sin rozamiento', 9.81 * 0.5, '4.905'); num(D, 'v sin rozamiento', math.sqrt(2 * 9.81), '4.429'); num(D, 'μ mín aro a 60°', 0.5 * math.tan(math.radians(60)), '0.866')
num(D, 'a valor inicial', rl(0.4)[0], '3.5036'); num(D, 'v valor inicial', rl(0.4)[2], '3.7436'); num(D, 'μ mín valor inicial', rl(0.4)[1], '0.16496'); num(D, 'f/mg valor inicial', 0.4 / 1.4 * 0.5, '0.14286'); num(D, 'μ mín aro', rl(1.0)[1], '0.28868'); num(D, 'a cilindro', rl(0.5)[0], '3.27')
thp, cp, hp, gp = symbols('th c h g', positive=True); thr = thp * pi / 180
fs(D, 'a', gp * sin(thr) / (1 + cp)); fs(D, 'v', sqrt(2 * gp * hp / (1 + cp))); fs(D, 'mu', cp / (1 + cp) * tan(thr)); fs(D, 'fr', cp / (1 + cp) * sin(thr))

# ---------------------------------------------------------------- giróscopo
D = 'giroscopio'
Om, I, w, alpha, Lm = S('Om I w alpha L')
ident(D, '|dL| = L senα dψ = mgd senα dt ⇒ Ω = mgd/(Iω)', (m * g * d * sin(alpha) / (I * w * sin(alpha))), m * g * d / (I * w))
ident(D, 'Ω es independiente de α', (m * g * d * sin(alpha)) / (I * w * sin(alpha)), (m * g * d * sin(Symbol('beta'))) / (I * w * sin(Symbol('beta'))))
ident(D, 'ω ≫ Ω ⇔ Iω²/(mgd) ≫ 1: ω/Ω = Iω²/(mgd)', w / (m * g * d / (I * w)), I * w ** 2 / (m * g * d))
# integración numérica del trompo/giróscopo: dL/dt = τ con L = Iω n̂ (eje) y torque d × mg
mm_, dd, II, ww = 0.5, 0.05, 6.25e-4, 125.66
def rhs(tt, y):
    n_ = np.array(y[:3]); n_ = n_ / np.linalg.norm(n_); Lv = II * ww * n_
    tau = np.cross(dd * n_, mm_ * G0 * np.array([0, 0, -1.0]))
    nd = tau / (II * ww)
    return list(nd)
y0 = [math.sin(0.6), 0.0, math.cos(0.6)]
Tp = 2 * math.pi * II * ww / (mm_ * G0 * dd)
sol = solve_ivp(rhs, [0, Tp], y0, rtol=1e-11, atol=1e-12, dense_output=True)
yv = sol.y[:, -1]
rec(G_STEP, D, 'integración de dL/dt = τ: tras un periodo 2π/Ω el eje vuelve al mismo punto', float(np.linalg.norm(np.array(yv) / np.linalg.norm(yv) - np.array(y0))), 0.0, 'abs 1e-6', float(np.linalg.norm(np.array(yv) / np.linalg.norm(yv) - np.array(y0))) < 1e-6)
rec(G_STEP, D, 'integración: el ángulo con la vertical no cambia (sin caída)', float(abs(yv[2] / np.linalg.norm(yv) - y0[2])), 0.0, 'abs 1e-6', abs(yv[2] / np.linalg.norm(yv) - y0[2]) < 1e-6)
ug = {'Om': 'rad s^-1', 'm': 'kg', 'g': 'm s^-2', 'd': 'm', 'I': 'kg m^2', 'w': 'rad s^-1'}
dimcheck(D, 'Ω = mgd/(Iω)', Om, m * g * d / (I * w), ug); dimcheck(D, 'ω/Ω es adimensional', Symbol('q', positive=True), I * w ** 2 / (m * g * d), dict(ug, q='1'))
Og = lambda m_, d_, I_, w_: m_ * G0 * d_ / (I_ * w_)
num(D, 'Ω', Og(0.5, 0.05, 6.25e-4, 125.66), '3.122'); num(D, 'T precesión', 2 * math.pi / Og(0.5, 0.05, 6.25e-4, 125.66), '2.013'); num(D, 'ω/Ω', 125.66 / Og(0.5, 0.05, 6.25e-4, 125.66), '40.3'); num(D, 'Ω con ω/2', Og(0.5, 0.05, 6.25e-4, 125.66 / 2), '6.243')
num(D, 'Ω valor inicial', Og(0.5, 0.05, 6.25e-4, 125.66), '3.1216'); num(D, 'T valor inicial', 2 * math.pi / Og(0.5, 0.05, 6.25e-4, 125.66), '2.0128'); num(D, 'ω/Ω valor inicial', 125.66 / Og(0.5, 0.05, 6.25e-4, 125.66), '40.254'); num(D, 'I disco', 0.5 * 0.5 * 0.05 ** 2, '6.25e-4') if False else None
mg_, dg_, Ig_, wg_ = symbols('m d I w', positive=True)
fs(D, 'O', mg_ * sp.Float('9.80665', 30) * dg_ / (Ig_ * wg_)); fs(D, 'T', 2 * pi * Ig_ * wg_ / (mg_ * sp.Float('9.80665', 30) * dg_)); fs(D, 'ra', Ig_ * wg_ ** 2 / (mg_ * sp.Float('9.80665', 30) * dg_))

# ---------------------------------------------------------------- Euler libre
D = 'euler-libre'
I1, I2, I3, w1, w2, w3, lam = S('I1 I2 I3 w1 w2 w3 lam')
Lvec = Matrix([I1 * w1, I2 * w2, I3 * w3]); wv = Matrix([w1, w2, w3])
cr = wv.cross(Lvec)
ident(D, 'componente 1 de ω×L = (I₃ − I₂)ω₂ω₃', cr[0], (I3 - I2) * w2 * w3); ident(D, 'componente 2 de ω×L = (I₁ − I₃)ω₃ω₁', cr[1], (I1 - I3) * w3 * w1); ident(D, 'componente 3 de ω×L = (I₂ − I₁)ω₁ω₂', cr[2], (I2 - I1) * w1 * w2)
Om_ = Symbol('Om', positive=True)
lam2 = (I2 - I3) * (I1 - I2) / (I1 * I3) * Om_ ** 2
ident(D, 'eje 2: ω̈₁ = λ²ω₁ con λ² = Ω²(I₂−I₁)(I₃−I₂)/(I₁I₃)', lam2, Om_ ** 2 * (I2 - I1) * (I3 - I2) / (I1 * I3))
ident(D, 'eje 1: ω̈₂ = −ω₍₁₎² ω₂', -(I1 - I2) * 0 + (I2 - I3) * (I3 - I1) / (I1 * I2) * Om_ ** 2 * (-1) * (-1), (I2 - I3) * (I3 - I1) / (I1 * I2) * Om_ ** 2) if False else None
ident(D, 'eje 1 (ω₁ ≈ Ω): ω̈₂ = (I₃−I₁)(I₁−I₂)/(I₂I₃) Ω² ω₂ = −ω₍₁₎²ω₂', (I3 - I1) * (I1 - I2) / (I2 * I3) * Om_ ** 2, -Om_ ** 2 * (I2 - I1) * (I3 - I1) / (I2 * I3))
ident(D, 'eje 3 (ω₃ ≈ Ω): ω̈₂ = (I₂−I₃)(I₃−I₁)/(I₁I₂) Ω² ω₂ = −ω₍₃₎²ω₂', (I2 - I3) * (I3 - I1) / (I1 * I2) * Om_ ** 2, -Om_ ** 2 * (I3 - I1) * (I3 - I2) / (I1 * I2))
# integración numérica de las ecuaciones de Euler y comparación con las tasas lineales
def euler_rhs(I1_, I2_, I3_):
    return lambda tt, y: [(I2_ - I3_) / I1_ * y[1] * y[2], (I3_ - I1_) / I2_ * y[2] * y[0], (I1_ - I2_) / I3_ * y[0] * y[1]]
I1v, I2v, I3v, Omv = 1.0, 2.0, 4.0, 10.0
eps0 = 1e-9
sol = solve_ivp(euler_rhs(I1v, I2v, I3v), [0, 1.2], [eps0, Omv, 0.0], rtol=1e-12, atol=1e-30, dense_output=True)
lam_th = Omv * math.sqrt((I2v - I1v) * (I3v - I2v) / (I1v * I3v))
ts = np.linspace(0.2, 0.8, 30); ys = np.array([abs(sol.sol(tq)[0]) for tq in ts]); slope = np.polyfit(ts, np.log(ys), 1)[0]
rec(G_STEP, D, 'integración de Euler: tasa de crecimiento medida = λ (eje intermedio)', float(slope), lam_th, 'rel 1e-2', abs(slope - lam_th) < 1e-2 * lam_th)
for axis, (y0, wth, nm) in enumerate(((lambda: [Omv, eps0, 0.0], Omv * math.sqrt((I2v - I1v) * (I3v - I1v) / (I2v * I3v)), 'eje 1'), (lambda: [0.0, eps0, Omv], Omv * math.sqrt((I3v - I1v) * (I3v - I2v) / (I1v * I2v)), 'eje 3'))):
    s2 = solve_ivp(euler_rhs(I1v, I2v, I3v), [0, 4], y0(), rtol=1e-12, atol=1e-30, dense_output=True)
    tt = np.linspace(0, 4, 40001); sig = np.array([s2.sol(tq)[1] for tq in tt]); crossings = np.where(np.diff(np.sign(sig)) != 0)[0]
    per = 2 * np.mean(np.diff(tt[crossings]))
    rec(G_STEP, D, f'integración de Euler: frecuencia de oscilación del {nm} = fórmula lineal', 2 * math.pi / per, wth, 'rel 1e-3', abs(2 * math.pi / per - wth) < 1e-3 * wth)
ue = {'I1': 'kg m^2', 'I2': 'kg m^2', 'I3': 'kg m^2', 'Om': 'rad s^-1', 'lam': 's^-1', 'w1': 'rad s^-1', 'w3': 'rad s^-1'}
dimcheck(D, 'λ', lam, Om_ * sqrt((I2 - I1) * (I3 - I2) / (I1 * I3)), ue); dimcheck(D, 'ω₍₁₎', Symbol('w1', positive=True), Om_ * sqrt((I2 - I1) * (I3 - I1) / (I2 * I3)), ue); dimcheck(D, 'ω₍₃₎', Symbol('w3', positive=True), Om_ * sqrt((I3 - I1) * (I3 - I2) / (I1 * I2)), ue)
ev = lambda r2, r3, Om_v: (Om_v * math.sqrt((r2 - 1) * (r2 * r3 - r2) / (1 * r2 * r3)), Om_v * math.sqrt((r2 - 1) * (r2 * r3 - 1) / (r2 * r2 * r3)), Om_v * math.sqrt((r2 * r3 - 1) * (r2 * r3 - r2) / (1 * r2)))
l0 = ev(2, 2, 10)
num(D, 'λ', l0[0], '7.071'); num(D, '1/λ', 1 / l0[0], '0.1414'); num(D, 'ω₍₁₎', l0[1], '6.124'); num(D, 'ω₍₃₎', l0[2], '17.32'); num(D, 'periodo eje 1', 2 * math.pi / l0[1], '1.026'); num(D, 'periodo eje 3', 2 * math.pi / l0[2], '0.363')
num(D, 'λ casi simétrico', ev(1.1, 1.1, 10)[0], '0.953')
num(D, 'λ valor inicial', l0[0], '7.0711'); num(D, '1/λ valor inicial', 1 / l0[0], '0.14142'); num(D, 'ω₍₁₎ valor inicial', l0[1], '6.1237'); num(D, 'ω₍₃₎ valor inicial', l0[2], '17.3205')
r2p, r3p, Omp = symbols('r2 r3 Om', positive=True)
J1, J2, J3 = 1, r2p, r2p * r3p
fs(D, 'lam', Omp * sqrt((J2 - J1) * (J3 - J2) / (J1 * J3))); fs(D, 'tau', 1 / (Omp * sqrt((J2 - J1) * (J3 - J2) / (J1 * J3))))
fs(D, 'w1', Omp * sqrt((J2 - J1) * (J3 - J1) / (J2 * J3))); fs(D, 'w3', Omp * sqrt((J3 - J1) * (J3 - J2) / (J1 * J2)))

# ---------------------------------------------------------------- billar
D = 'billar'
v0, J, q, w0, vf, vc, Ir = S('v0 J q w0 vf vc Ir')
Ib = R_(2, 5) * m * R ** 2
ident(D, 'ω₀ = Jh/I = 5v₀h/(2R²)', (m * v0 * q * R) / Ib, 5 * v0 * q / (2 * R))
ident(D, 'v_c = v₀ − ω₀R = v₀(1 − 5q/2)', v0 - 5 * v0 * q / (2 * R) * R, v0 * (1 - R_(5, 2) * q))
solves(D, 'v_c = 0 → q = 2/5', [Eq(v0 * (1 - R_(5, 2) * q), 0)], q, R_(2, 5))
solves(D, 'conservación del momento angular respecto del contacto → v_f', [Eq(m * v0 * R + Ib * 5 * v0 * q / (2 * R), m * vf * R + Ib * vf / R)], vf, R_(5, 7) * (1 + q) * v0)
ident(D, 'I ω₀ = m R v₀ q', Ib * 5 * v0 * q / (2 * R), m * R * v0 * q)
ident(D, 'rodadura pura: ½mv² + ½I(v/R)² = (7/10)mv²', m * vf ** 2 / 2 + Ib * (vf / R) ** 2 / 2, R_(7, 10) * m * vf ** 2)
ident(D, 'q = 2/5: v_f = v₀ y ΔE = 0', (R_(5, 7) * (1 + q) * v0).subs(q, R_(2, 5)), v0)
ident(D, 'ΔE(q = 2/5) = 0', (m * v0 ** 2 / 2 + Ib * (5 * v0 * q / (2 * R)) ** 2 / 2 - R_(7, 10) * m * (R_(5, 7) * (1 + q) * v0) ** 2).subs(q, R_(2, 5)), 0)
ident(D, 'q = 0: v_f = (5/7) v₀', (R_(5, 7) * (1 + q) * v0).subs(q, 0), R_(5, 7) * v0)
# simulación temporal: deslizamiento con rozamiento cinético hasta rodar
def sim_billar(v0_, q_, mu_k=0.2, R_b=0.0286, m_b=0.17):
    w0_ = 5 * v0_ * q_ / (2 * R_b); I_ = 0.4 * m_b * R_b ** 2
    # v' = −μ g sgn(vc), ω' = (μ m g R/I) sgn(vc) (el rozamiento frena la traslación y acelera el giro cuando vc > 0)
    vc0 = v0_ - w0_ * R_b; sgn = 1 if vc0 > 0 else -1
    a_t = -sgn * mu_k * 9.80665; a_w = sgn * mu_k * m_b * 9.80665 * R_b / I_
    ts_ = -vc0 / (a_t - a_w * R_b)   # instante en que vc = 0: vc(t) = vc0 + (a_t − a_w R) t
    return v0_ + a_t * ts_, w0_ + a_w * ts_
for v0_, q_ in ((2.0, 0.0), (2.0, -0.5), (2.0, 0.8), (3.0, -0.9)):
    vfin, wfin = sim_billar(v0_, q_)
    rec(G_STEP, D, f'simulación con rozamiento cinético: v_f = (5/7)(1+q)v₀ (q = {q_})', vfin, 5 / 7 * (1 + q_) * v0_, 'rel 1e-12', abs(vfin - 5 / 7 * (1 + q_) * v0_) < 1e-10)
    rec(G_STEP, D, f'simulación: ω_f = v_f/R (q = {q_})', wfin, vfin / 0.0286, 'rel 1e-10', abs(wfin - vfin / 0.0286) < 1e-8 * abs(wfin) + 1e-9)
ub = {'v0': 'm s^-1', 'w0': 'rad s^-1', 'q': '1', 'R': 'm', 'm': 'kg', 'vf': 'm s^-1', 'vc': 'm s^-1', 'I': 'kg m^2', 'J': 'N s', 'h': 'm'}
dimcheck(D, 'ω₀ = 5v₀q/(2R)', w0, 5 * v0 * q / (2 * R), ub); dimcheck(D, 'v_c = v₀(1 − 5q/2)', vc, v0 * (1 - R_(5, 2) * q), ub); dimcheck(D, 'v_f = (5/7)(1+q)v₀', vf, R_(5, 7) * (1 + q) * v0, ub); dimcheck(D, 'J = m v₀', J, m * v0, ub)
bl = lambda v0_, q_, R_b=0.0286, m_b=0.17: (5 * v0_ * q_ / (2 * R_b), v0_ * (1 - 2.5 * q_), 5 / 7 * (1 + q_) * v0_, 0.5 * m_b * v0_ ** 2 + 0.5 * 0.4 * m_b * R_b ** 2 * (5 * v0_ * q_ / (2 * R_b)) ** 2 - 0.7 * m_b * (5 / 7 * (1 + q_) * v0_) ** 2)
num(D, 'v_c (q = 0)', bl(2, 0)[1], '2'); num(D, 'v_f (q = 0)', bl(2, 0)[2], '1.4286'); num(D, 'ΔE (q = 0)', bl(2, 0)[3], '0.0971'); num(D, 'pérdida (q = 0) %', bl(2, 0)[3] / 0.34 * 100, '28.6')
num(D, 'ω₀ (q = 0.4)', bl(2, 0.4)[0], '69.93'); num(D, 'v_f (q = 0.4)', bl(2, 0.4)[2], '2.00'); num(D, 'h (mm) de q = 0.4', 0.4 * 28.6, '11.4')
num(D, 'ω₀ (q = −0.5)', bl(2, -0.5)[0], '-87.41'); num(D, 'v_c (q = −0.5)', bl(2, -0.5)[1], '4.5'); num(D, 'v_f (q = −0.5)', bl(2, -0.5)[2], '0.714'); num(D, 'pérdida (q = −0.5) %', bl(2, -0.5)[3] / (0.5 * 0.17 * 4 + 0.5 * 0.4 * 0.17 * 0.0286 ** 2 * 87.41 ** 2) * 100, '89')
num(D, 'v_f (q = −0.9)', bl(2, -0.9)[2], '0.143'); num(D, 'v_c (q = 0.8)', bl(2, 0.8)[1], '-2'); num(D, 'v_f (q = 0.8)', bl(2, 0.8)[2], '2.571'); num(D, 'aumento (q = 0.8) %', (bl(2, 0.8)[2] / 2 - 1) * 100, '29')
K08 = 0.5 * 0.17 * 4 + 0.5 * 0.4 * 0.17 * 0.0286 ** 2 * bl(2, 0.8)[0] ** 2; num(D, 'pérdida (q = 0.8) %', bl(2, 0.8)[3] / K08 * 100, '11')
num(D, 'ω₀ valor inicial', bl(2, 0)[0], '0'); num(D, 'ΔE valor inicial', bl(2, 0)[3], '0.09714')
v0p, qp, Rp, mp_ = symbols('v0 q R m', positive=True); qr = Symbol('q', real=True)
fs(D, 'w0', 5 * v0p * qr / (2 * Rp)); fs(D, 'vs', v0p * (1 - R_(5, 2) * qr)); fs(D, 'vf', R_(5, 7) * (1 + qr) * v0p)
fs(D, 'dE', mp_ * v0p ** 2 / 2 + R_(2, 5) * mp_ * Rp ** 2 * (5 * v0p * qr / (2 * Rp)) ** 2 / 2 - R_(7, 10) * mp_ * (R_(5, 7) * (1 + qr) * v0p) ** 2, tol=1e-6)
