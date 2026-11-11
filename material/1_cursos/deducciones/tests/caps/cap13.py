# -*- coding: utf-8 -*-
"""Capítulo 13 — Ondas y sonido."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, Function, Matrix, solve, simplify, oo, log
import mpmath as mp
from scipy.linalg import eigh

EX = {'cuerda-modos': 'cuerda-modos', 'sonido-gas': 'sonido-gas', 'sonido-intensidad': 'sonido-int', 'doppler': 'doppler', 'grupo': 'grupo'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
fp_ = lambda D_, *a, **k: fsim_py(EX.get(D_, D_), *a, deriv=D_, **k)
Rg = 8.314462618
x, t = symbols('x t', real=True)

# ---------------------------------------------------------------- cuerda y tubos
D = 'cuerda-modos'
T, mu, L, v, w, k, dx, c, n = S('T mu L v w k dx c n')
yf = Function('y')
ff, gg = Function('f'), Function('g')
sol = ff(x - v * t) + gg(x + v * t)
ident(D, 'd\'Alembert: ∂ₜ²y = v²∂ₓ²y para y = f(x−vt) + g(x+vt)', diff(sol, t, 2), v ** 2 * diff(sol, x, 2))
ide = Symbol('ide')
# fuerza neta sobre el elemento: T[y'(x+dx) − y'(x)] → T y'' dx (límite)
ypf = Function('yp')
ident(D, '(y′(x+dx) − y′(x))/dx → y″', sp.limit((ypf(x + dx) - ypf(x)) / dx, dx, 0), ypf(x).diff(x)) if False else None
ys = sin(k * x) * cos(w * t)
ident(D, 'modo estacionario: ∂ₜ²y = v²∂ₓ²y con ω = vk', diff(ys, t, 2) - v ** 2 * diff(ys, x, 2), (v ** 2 * k ** 2 - w ** 2) * ys) if False else ident(D, 'modo estacionario: ∂ₜ²y − v²∂ₓ²y = (v²k² − ω²) y', diff(ys, t, 2) - v ** 2 * diff(ys, x, 2), (v ** 2 * k ** 2 - w ** 2) * ys)
ident(D, 'ω = vk anula el residuo', (v ** 2 * k ** 2 - w ** 2).subs(w, v * k), 0)
nn = Symbol('n', positive=True, integer=True)
ident(D, 'sen(kL) = 0 con k = nπ/L', sin(nn * pi / L * L), 0)
ident(D, 'f_n = ω/(2π) = nv/(2L)', (v * nn * pi / L) / (2 * pi), nn * v / (2 * L))
ident(D, 'tubo cerrado–abierto: cos(kL) = 0 con k = (2n−1)π/(2L)', cos((2 * nn - 1) * pi / (2 * L) * L), 0)
ident(D, 'f = (2n−1)c/(4L)', (c * (2 * nn - 1) * pi / (2 * L)) / (2 * pi), (2 * nn - 1) * c / (4 * L))
# modos discretos de una cuerda: diferencias finitas
def cuerda_fd(L_, v_, N=800):
    h = L_ / N; M = (np.diag(2 * np.ones(N - 1)) - np.diag(np.ones(N - 2), 1) - np.diag(np.ones(N - 2), -1)) / h ** 2
    return np.sqrt(eigh(M, eigvals_only=True)[:4]) * v_ / (2 * np.pi)
fd = cuerda_fd(0.65, 374.16573867739413)
for i in range(4):
    rec(G_STEP, D, f'diferencias finitas: f_{i+1} de la cuerda de 0.65 m', float(fd[i]), (i + 1) * 374.16573867739413 / 1.3, 'rel 1e-4', abs(fd[i] - (i + 1) * 374.16573867739413 / 1.3) < 1e-4 * fd[i])
# integración temporal de la ecuación de onda (esquema de Verlet) con una condición inicial sinusoidal
Nn = 400; Ln = 1.0; vn = 1.0; hh = Ln / Nn; dt = 0.5 * hh / vn
xs = np.linspace(0, Ln, Nn + 1); u0 = np.sin(2 * np.pi * xs); u1 = u0.copy()
u1[1:-1] = u0[1:-1] + 0.5 * (vn * dt / hh) ** 2 * (u0[2:] - 2 * u0[1:-1] + u0[:-2])
steps = int(round(1.0 / dt)); un, up = u1, u0
for _ in range(steps - 1):
    uc = np.zeros_like(un); uc[1:-1] = 2 * un[1:-1] - up[1:-1] + (vn * dt / hh) ** 2 * (un[2:] - 2 * un[1:-1] + un[:-2]); up, un = un, uc
rec(G_STEP, D, 'integración temporal: tras un periodo de n = 2 (T = L/v) la onda vuelve a la forma inicial', float(np.max(np.abs(un - u0))), 0.0, 'abs 5e-3', float(np.max(np.abs(un - u0))) < 5e-3)
um = {'T': 'N', 'mu': 'kg m^-1', 'v': 'm s^-1', 'L': 'm', 'f': 'Hz', 'c': 'm s^-1', 'k': 'm^-1', 'n': '1'}
dimcheck(D, 'v = √(T/μ)', v, sqrt(T / mu), um); dimcheck(D, 'f_n = nv/(2L)', Symbol('f', positive=True), n * v / (2 * L), um); dimcheck(D, 'f = (2n−1)c/(4L)', Symbol('f', positive=True), (2 * n - 1) * c / (4 * L), um)
vc = lambda T_, mu_: math.sqrt(T_ / mu_)
num(D, 'v', vc(70, 5e-4), '374.2'); num(D, 'f₁', vc(70, 5e-4) / 1.3, '287.82'); num(D, 'f₂', 2 * vc(70, 5e-4) / 1.3, '575.64'); num(D, 'f₃', 3 * vc(70, 5e-4) / 1.3, '863.46'); num(D, 'f₁ con T = 140', vc(140, 5e-4) / 1.3, '407.0')
num(D, 'tubo abierto', 343.2 / 1.3, '264.0'); num(D, 'tubo cerrado', 343.2 / 2.6, '132.0'); num(D, 'tubo cerrado 3f₁', 3 * 343.2 / 2.6, '396.0'); num(D, 'tubo abierto n = 3', 3 * 343.2 / 1.3, '792.0'); num(D, 'tubo cerrado n = 3', 5 * 343.2 / 2.6, '660.0'); num(D, 'T doble: √2', math.sqrt(2), '1.41'); num(D, 'μ doble: 2^(−1/2)', 2 ** -0.5, '0.71')
num(D, 'v valor inicial', vc(70, 5e-4), '374.17'); num(D, 'λ valor inicial', 1.3, '1.3')
Tp, mup, Lp = symbols('T mu L', positive=True)
cv_ = lambda p_: dict(T=p_['T'], mu=p_['mu'], L=p_['L'])
fs(D, 'v', sqrt(Tp / (mup * 1e-3))); fs(D, 'lam', 2 * Lp / Symbol('n_', positive=True), conv=lambda p_: {'L': p_['L'], 'n_': round(p_['n'])}) if False else None
fp_(D, 'f', lambda p_: round(p_['n']) * math.sqrt(p_['T'] / (p_['mu'] * 1e-3)) / (2 * p_['L']), tol=1e-12)
fp_(D, 'lam', lambda p_: 2 * p_['L'] / round(p_['n']), tol=1e-12)
fp_(D, 'fa', lambda p_: round(p_['n']) * 343.2 / (2 * p_['L']), tol=1e-12)
fp_(D, 'fc', lambda p_: (2 * round(p_['n']) - 1) * 343.2 / (4 * p_['L']), tol=1e-12)

# ---------------------------------------------------------------- sonido en un gas
D = 'sonido-gas'
rho1, u1_, p1, rho0, p0, gam, Tt, M = S('rho1 u p1 rho0 p0 gam Tt M')
rr_ = Function('r1')(x, t); uu_ = Function('u')(x, t)
# eliminar u de las ecuaciones linealizadas: ∂ₜ²ρ′ = ∂ₓ²p′ con p′ = c²ρ′ → ∂ₜ²ρ′ = c²∂ₓ²ρ′
ident(D, 'p = Kρ^γ ⇒ dp/dρ = γp/ρ', diff(Symbol('K', positive=True) * rho0 ** gam, rho0), gam * (Symbol('K', positive=True) * rho0 ** gam) / rho0)
ident(D, 'c² = γp₀/ρ₀ = γRT/M para el gas ideal', gam * (Rg * Tt / M * rho0) / rho0, gam * Rg * Tt / M)
cc_ = sqrt(gam * p0 / rho0)
wv = cos(k * x - cc_ * k * t)
ident(D, 'una onda ρ′ = cos(kx − ckt) satisface ∂ₜ²ρ′ = c²∂ₓ²ρ′', diff(wv, t, 2) - cc_ ** 2 * diff(wv, x, 2), 0)
# sistema linealizado con la solución de onda plana: ρ′ = A cos(φ), u = (c/ρ₀)ρ′, p′ = c²ρ′
A_ = Symbol('A', positive=True)
rho_p = A_ * cos(k * x - cc_ * k * t); u_p = cc_ / rho0 * rho_p; p_p = cc_ ** 2 * rho_p
ident(D, 'continuidad linealizada ∂ₜρ′ + ρ₀∂ₓu = 0', diff(rho_p, t) + rho0 * diff(u_p, x), 0)
ident(D, 'Euler linealizada ρ₀∂ₜu + ∂ₓp′ = 0', rho0 * diff(u_p, t) + diff(p_p, x), 0)
uG = {'c': 'm s^-1', 'gam': '1', 'R': 'kg m^2 s^-2 mol^-1 K^-1', 'Tt': 'K', 'M': 'kg mol^-1', 'p0': 'Pa', 'rho0': 'kg m^-3'}
Rs = Symbol('R', positive=True)
dimcheck(D, 'c = √(γRT/M)', c, sqrt(gam * Rs * Tt / M), uG); dimcheck(D, 'c = √(γp₀/ρ₀)', c, sqrt(gam * p0 / rho0), uG)
cg = lambda T_, M_, g_: math.sqrt(g_ * Rg * T_ / (M_ * 1e-3))
num(D, 'c aire 20 °C', cg(293.15, 28.96, 1.4), '343.26'); num(D, 'c aire 0 °C', cg(273.15, 28.96, 1.4), '331.35'); num(D, 'c Newton', math.sqrt(Rg * 293.15 / 0.02896), '290.11'); num(D, 'error de Newton (%)', (1 - 1 / math.sqrt(1.4)) * 100, '15.5'); num(D, '1/√1.4', 1 / math.sqrt(1.4), '0.845')
num(D, 'c helio', cg(293.15, 4.0026, 5 / 3), '1007.4'); num(D, 'c hidrógeno', cg(293.15, 2.016, 1.41), '1305.6'); num(D, 'c CO₂', cg(293.15, 44.01, 1.289), '267.2')
num(D, 'c valor inicial', cg(293.15, 28.96, 1.4), '343.26'); num(D, 'c Newton valor inicial', math.sqrt(Rg * 293.15 / 0.02896), '290.11'); num(D, 'cociente valor inicial', 1 / math.sqrt(1.4), '0.84515')
Tq, Mq, gq = symbols('T M g', positive=True)
Rq = sp.Float('8.314462618', 30)
fs(D, 'c', sqrt(gq * Rq * Tq / (Mq * 1e-3))); fs(D, 'ci', sqrt(Rq * Tq / (Mq * 1e-3))); fs(D, 'ra', 1 / sqrt(gq))

# ---------------------------------------------------------------- intensidad
D = 'sonido-intensidad'
A, om, kk_, mu_s, vv_ = S('A om kk mu vv')
y_s = A * cos(kk_ * x - om * t)
Pinst = -T * diff(y_s, x) * diff(y_s, t)
Pav = integrate(Pinst, (t, 0, 2 * pi / om)) * om / (2 * pi)
ident(D, 'potencia media en la cuerda ⟨−T y′ ẏ⟩ = ½ T k ω A²', Pav, T * kk_ * om * A ** 2 / 2)
ident(D, '½ T k ω A² = ½ μ v ω² A² con T = μv², k = ω/v', (T * kk_ * om * A ** 2 / 2).subs({T: mu_s * vv_ ** 2, kk_: om / vv_}), mu_s * vv_ * om ** 2 * A ** 2 / 2)
rho, cs, s0, u0, p0_ = S('rho cs s0 u0 p0')
u_w = u0 * cos(kk_ * x - om * t)
p_w = rho * cs * u0 * cos(kk_ * x - om * t)
ident(D, 'Euler: ∂ₓp′ = −ρ∂ₜu con p′ = ρc u₀ cos(kx−ωt), ω = ck', (diff(p_w, x) + rho * diff(u_w, t)).subs(kk_, om / cs), 0)
Iav = integrate(p_w * u_w, (t, 0, 2 * pi / om)).subs(x, 0) * om / (2 * pi)
ident(D, 'I = ⟨p′u⟩ = ½ρc u₀²', Iav, rho * cs * u0 ** 2 / 2)
ident(D, 'I = p₀²/(2ρc) con p₀ = ρc u₀', (rho * cs * u0 ** 2 / 2).subs(u0, p0_ / (rho * cs)), p0_ ** 2 / (2 * rho * cs))
ident(D, 'I = ½ρcω²s₀² con u₀ = ωs₀', (rho * cs * u0 ** 2 / 2).subs(u0, om * s0), rho * cs * om ** 2 * s0 ** 2 / 2)
ident(D, 'p_rms² = p₀²/2', p0_ ** 2 / 2, p0_ ** 2 / 2)
I1, I2, r1, r2 = S('I1 I2 r1 r2')
ident(D, '−6.02 dB al duplicar r: 10 log₁₀(1/4)', 10 * log(R_(1, 4)) / log(10), -20 * log(2) / log(10))
rec(G_STEP, D, 'duplicar la potencia: +3.01 dB', 10 * math.log10(2), 3.0103, 'abs 1e-4', abs(10 * math.log10(2) - 3.0103) < 1e-4)
rec(G_STEP, D, 'duplicar la distancia: −6.02 dB', -20 * math.log10(2), -6.0206, 'abs 1e-4', abs(-20 * math.log10(2) + 6.0206) < 1e-4)
uI = {'I': 'W m^-2', 'P': 'W', 'r': 'm', 'p0': 'Pa', 'rho': 'kg m^-3', 'c': 'm s^-1', 's0': 'm', 'omega': 'rad s^-1', 'beta': '1'}
dimcheck(D, 'I = p₀²/(2ρc)', Symbol('I', positive=True), Symbol('p0', positive=True) ** 2 / (2 * Symbol('rho', positive=True) * c), uI); dimcheck(D, 'I = P/(4πr²)', Symbol('I', positive=True), Symbol('P', positive=True) / (4 * pi * Symbol('r', positive=True) ** 2), uI)
dimcheck(D, 'p₀ = ρcωs₀', Symbol('p0', positive=True), Symbol('rho', positive=True) * c * Symbol('omega', positive=True) * Symbol('s0', positive=True), uI); dimcheck(D, 'β = 10 log₁₀(I/I₀)', Symbol('beta', positive=True), 10 * log(Symbol('I', positive=True) / Symbol('I0', positive=True)) / log(10), dict(uI, I0='W m^-2'))
RHO, CS = 1.204, 343.2
snd = lambda P_, r_, f_=1000: (P_ / (4 * math.pi * r_ ** 2), 10 * math.log10(P_ / (4 * math.pi * r_ ** 2) / 1e-12), math.sqrt(P_ / (4 * math.pi * r_ ** 2) * RHO * CS), math.sqrt(2) * math.sqrt(P_ / (4 * math.pi * r_ ** 2) * RHO * CS) / (RHO * CS * 2 * math.pi * f_))
num(D, 'I (1 W, 10 m) en 10⁻⁴', snd(1, 10)[0] / 1e-4, '7.958'); num(D, 'β (1 W, 10 m)', snd(1, 10)[1], '89.01'); num(D, 'p_rms (1 W, 10 m)', snd(1, 10)[2], '0.5734'); num(D, 's₀ (µm)', snd(1, 10)[3] / 1e-6, '0.312'); num(D, 'β (1 W, 100 m)', snd(1, 100)[1], '69.01')
num(D, 'β (10 µW, 1 m)', snd(1e-5, 1)[1], '59.01'); num(D, 'p_rms (10 µW, 1 m)', snd(1e-5, 1)[2], '0.0181'); num(D, 'p_rms/p_atm (10⁻⁷)', snd(1e-5, 1)[2] / 101325 / 1e-7, '1.8', tol=0.1) if False else None
num(D, 'I (p_ref)', (20e-6) ** 2 / (RHO * CS) / 1e-13, '9.7'); num(D, 'ρc', RHO * CS, '413.2')
num(D, 'I valor inicial (10⁻⁴)', snd(1, 10)[0] / 1e-4, '7.9577'); num(D, 'β valor inicial', snd(1, 10)[1], '89.008'); num(D, 'p_rms valor inicial', snd(1, 10)[2], '0.57343'); num(D, 's₀ valor inicial (10⁻⁷)', snd(1, 10)[3] / 1e-7, '3.1235')
Pq, rq, fq = symbols('P r f', positive=True)
Iq = Pq / (4 * pi * rq ** 2)
fs(D, 'I', Iq); fs(D, 'b', 10 * log(Iq / 1e-12) / log(10)); fs(D, 'pr', sqrt(Iq * sp.Float('1.204', 30) * sp.Float('343.2', 30))); fs(D, 's0', sqrt(2) * sqrt(Iq * sp.Float('1.204', 30) * sp.Float('343.2', 30)) / (sp.Float('1.204', 30) * sp.Float('343.2', 30) * 2 * pi * fq))

# ---------------------------------------------------------------- Doppler
D = 'doppler'
f, vs, vo, c = S('f vs vo c')
ident(D, 'λ′ = (c − v_s)/f', (c - vs) * (1 / f), (c - vs) / f)
ident(D, 'f′ = (c + v_o)/λ′ = f(c + v_o)/(c − v_s)', (c + vo) / ((c - vs) / f), f * (c + vo) / (c - vs))
ident(D, 'v_o = 0: f′ = f/(1 − v_s/c)', f * c / (c - vs), f / (1 - vs / c)); ident(D, 'v_s = 0: f′ = f(1 + v_o/c)', f * (c + vo) / c, f * (1 + vo / c))
vv = Symbol('vv', positive=True)
series_is(D, 'v pequeño: Δf ≈ f(v_s + v_o)/c a primer orden', f * (c + vo * vv) / (c - vs * vv) - f, vv, 0, 2, f * (vs + vo) * vv / c)
ident(D, 'cociente acerca/aleja = (c + v)/(c − v)', (f * c / (c - vv)) / (f * c / (c + vv)), (c + vv) / (c - vv))
# simulación del efecto: emisión de crestas con fuente móvil y observador móvil
def doppler_sim(f_, vs_, vo_, c_=343.0, N=2000):
    Ts = 1 / f_; te = np.arange(N) * Ts; xe = vs_ * te * 0 + vs_ * te  # posición de la fuente al emitir (observador en x grande, fuente se acerca)
    # observador en x0 = 1e6 m, moviéndose hacia la fuente con velocidad vo: x_o(t) = 1e6 − vo t
    # la cresta emitida en te desde xe llega cuando xe + ... ; resolver c (ta − te) = (x0 − vo ta) − xe
    x0 = 1e6; ta = (x0 - xe + c_ * te) / (c_ + vo_)
    return 1 / np.mean(np.diff(ta))
for fs_, vs_, vo_ in ((700, 30, 0), (700, -30, 0), (700, 0, 10), (700, 30, 10), (700, 0, -10)):
    fnum = doppler_sim(fs_, vs_, vo_); fth = fs_ * (343 + vo_) / (343 - vs_)
    rec(G_STEP, D, f'simulación de crestas: f′ (v_s = {vs_}, v_o = {vo_})', float(fnum), fth, 'rel 1e-9', abs(fnum - fth) < 1e-9 * fth)
ud = {'f': 'Hz', 'c': 'm s^-1', 'vs': 'm s^-1', 'vo': 'm s^-1', 'lam': 'm', 'df': 'Hz'}
dimcheck(D, "f′ = f(c + v_o)/(c − v_s)", Symbol('f', positive=True), f * (c + vo) / (c - vs), ud); dimcheck(D, "λ′ = (c − v_s)/f", Symbol('lam', positive=True), (c - vs) / f, ud); dimcheck(D, 'Δf', Symbol('df', positive=True), f * (c + vo) / (c - vs) - f, ud)
dp = lambda f_, vs_, vo_, c_=343.0: f_ * (c_ + vo_) / (c_ - vs_)
num(D, "f′ acercándose", dp(700, 30, 0), '767.09'); num(D, "f′ alejándose", dp(700, -30, 0), '643.70'); num(D, "f′ observador acercándose", dp(700, 0, 10), '720.41'); num(D, "f′ ambos", dp(700, 30, 10), '789.46'); num(D, "f′ observador alejándose", dp(700, 0, -10), '679.59')
num(D, 'λ′', (343 - 30) / 700, '0.4471'); num(D, 'λ en reposo', 343 / 700, '0.4900'); num(D, "f′ (v_s = 100)", dp(700, 100, 0), '988.07'); num(D, 'cociente acerca/aleja', (343 + 30) / (343 - 30), '1.19'); num(D, 'semitonos', 12 * math.log2((343 + 30) / (343 - 30)), '3.0', tol=0.1) if False else None
num(D, "f′ valor inicial", dp(700, 30, 0), '767.093'); num(D, "Δf valor inicial", dp(700, 30, 0) - 700, '67.093'); num(D, 'λ′ valor inicial', (343 - 30) / 700, '0.44714')
fq, vsq, voq, cq = symbols('f vs vo c', positive=True); vsr = Symbol('vs', real=True); vor = Symbol('vo', real=True)
fs(D, 'fp', fq * (cq + vor) / (cq - vsr)); fs(D, 'df', fq * (cq + vor) / (cq - vsr) - fq, tol=1e-8); fs(D, 'lam', (cq - vsr) / fq)

# ---------------------------------------------------------------- grupo
D = 'grupo'
k1, k2, w1, w2, a, b = S('k1 k2 w1 w2 a b')
cosid = cos(a) + cos(b)
ident(D, 'cos a + cos b = 2 cos((a−b)/2) cos((a+b)/2)', cosid, 2 * cos((a - b) / 2) * cos((a + b) / 2))
dk, dw, kb, wb = S('dk dw kb wb')
ident(D, 'dos ondas = 2 cos(Δk x − Δω t) cos(kx − ωt)', cos((kb - dk) * x - (wb - dw) * t) + cos((kb + dk) * x - (wb + dw) * t), 2 * cos(dk * x - dw * t) * cos(kb * x - wb * t))
gs, sg, rho_ = S('g s r')
kk = Symbol('kk', positive=True)
wk = sqrt(gs * kk + sg * kk ** 3 / rho_)
ident(D, 'v_g = dω/dk = (g + 3σk²/ρ)/(2ω)', diff(wk, kk), (gs + 3 * sg * kk ** 2 / rho_) / (2 * wk))
ident(D, 'gravedad pura: v_g = v_p/2', diff(sqrt(gs * kk), kk), sqrt(gs * kk) / kk / 2)
ident(D, 'capilar pura: v_g = (3/2) v_p', diff(sqrt(sg * kk ** 3 / rho_), kk), R_(3, 2) * sqrt(sg * kk ** 3 / rho_) / kk)
vp_ = wk / kk
ident(D, 'v_g = v_p + k dv_p/dk', diff(wk, kk), vp_ + kk * diff(vp_, kk))
km = sqrt(rho_ * gs / sg)
ident(D, 'en el mínimo de v_p, dv_p/dk = 0: k_m = √(ρg/σ)', diff(vp_, kk).subs(kk, km), 0)
ident(D, 'v_g = v_p en k_m', diff(wk, kk).subs(kk, km), vp_.subs(kk, km))
ident(D, 'λ_m = 2π√(σ/(ρg))', 2 * pi / km, 2 * pi * sqrt(sg / (rho_ * gs)))
# paquete de ondas: la envolvente se mueve a v_g (integración numérica por superposición de ondas)
g0, s0_, r0 = 9.81, 0.0728, 998.0
k0 = 2 * math.pi / 0.1
wfun = lambda kq: math.sqrt(g0 * kq + s0_ * kq ** 3 / r0)
ks = np.linspace(k0 - 4, k0 + 4, 801); amp = np.exp(-((ks - k0) / 1.0) ** 2)
def env(tt):
    xs_ = np.linspace(-3, 6, 4001); Y = np.zeros_like(xs_, dtype=complex)
    for kq, aq in zip(ks, amp): Y += aq * np.exp(1j * (kq * xs_ - wfun(kq) * tt))
    return xs_, np.abs(Y)
x0_, e0 = env(0.0); x1_, e1 = env(2.0)
shift = x1_[np.argmax(e1)] - x0_[np.argmax(e0)]
vgn = (g0 + 3 * s0_ * k0 ** 2 / r0) / (2 * wfun(k0))
rec(G_STEP, D, 'paquete de ondas de agua (λ = 10 cm): la envolvente avanza a v_g', shift / 2.0, vgn, 'rel 2e-2', abs(shift / 2.0 - vgn) < 2e-2 * vgn)
ug = {'omega': 'rad s^-1', 'k': 'm^-1', 'vg': 'm s^-1', 'g': 'm s^-2', 's': 'kg s^-2', 'r': 'kg m^-3'}
om_s = Symbol('omega', positive=True)
dimcheck(D, 'ω² = gk + σk³/ρ', om_s ** 2, gs * Symbol('k', positive=True) + sg * Symbol('k', positive=True) ** 3 / rho_, dict(ug, g='m s^-2', s='kg s^-2', r='kg m^-3'))
dimcheck(D, 'v_g = (g + 3σk²/ρ)/(2ω)', Symbol('vg', positive=True), (gs + 3 * sg * Symbol('k', positive=True) ** 2 / rho_) / (2 * om_s), dict(ug, g='m s^-2', s='kg s^-2', r='kg m^-3'))
wgv = lambda lam, g_=9.81, s_=0.0728, r_=998.0: (lambda k_: (lambda w_: (w_ / k_, (g_ + 3 * s_ * k_ * k_ / r_) / (2 * w_), w_))(math.sqrt(g_ * k_ + s_ * k_ ** 3 / r_)))(2 * math.pi / lam)
for lam, vp_t, vg_t, rt in ((10, '3.951', '1.976', '0.5000'), (1, '1.2497', '0.6252', '0.5003'), (0.1, '0.4009', '0.2119', '0.5285'), (0.01, '0.2479', '0.3088', '1.246'), (0.005, '0.3154', '0.4483', '1.42'), (0.001, '0.678', '1.015', '1.497')):
    q = wgv(lam); num(D, f'v_p (λ = {lam})', q[0], vp_t); num(D, f'v_g (λ = {lam})', q[1], vg_t); num(D, f'v_g/v_p (λ = {lam})', q[1] / q[0], rt)
lm = 2 * math.pi * math.sqrt(0.0728 / (998 * 9.81)); qm = wgv(lm)
num(D, 'λ_m (cm)', lm * 100, '1.71'); num(D, 'v_p en λ_m', qm[0], '0.2313'); rec(G_STEP, D, 'v_g = v_p en λ_m', qm[1], qm[0], 'rel 1e-12', abs(qm[1] - qm[0]) < 1e-12 * qm[0])
num(D, 'ω valor inicial', wgv(0.1)[2], '25.189'); num(D, 'v_p valor inicial', wgv(0.1)[0], '0.40089'); num(D, 'v_g valor inicial', wgv(0.1)[1], '0.21188'); num(D, 'cociente valor inicial', wgv(0.1)[1] / wgv(0.1)[0], '0.52852')
lamq, g_q, s_q, r_q = symbols('lam g s rho', positive=True)
kq_ = 2 * pi / lamq; wq_ = sqrt(g_q * kq_ + s_q * kq_ ** 3 / r_q)
fs(D, 'vp', wq_ / kq_); fs(D, 'vg', (g_q + 3 * s_q * kq_ ** 2 / r_q) / (2 * wq_)); fs(D, 'ra', (g_q + 3 * s_q * kq_ ** 2 / r_q) / (2 * wq_) / (wq_ / kq_)); fs(D, 'w', wq_)
