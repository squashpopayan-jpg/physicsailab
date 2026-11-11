# -*- coding: utf-8 -*-
"""Capítulo 8 — Oscilaciones."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, sin, cos, asin, acos, Function, elliptic_k, oo, solve, simplify
import mpmath as mp
from scipy.special import ellipk

EX = {'mas-resorte': 'mas-resorte', 'pendulo-exacto': 'pendulo-exacto', 'pendulo-fisico': 'pendulo-fisico', 'modos-acoplados': 'modos-acoplados', 'resonancia-potencia': 'resonancia-potencia'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
g, m, t = S('g m t')
G0 = 9.80665

# ---------------------------------------------------------------- MAS
D = 'mas-resorte'
k, A, w, phi, E = S('k A w phi E')
xf = Function('x')
ode(D, 'x = A cos(ωt + φ) resuelve m ẍ = −kx', Eq(m * xf(t).diff(t, 2), -k * xf(t)), Eq(xf(t), A * cos(sqrt(k / m) * t + phi)))
xs = A * cos(w * t + phi)
ident(D, 'E = ½mv² + ½kx² = ½kA² (con mω² = k)', (m * diff(xs, t) ** 2 / 2 + k * xs ** 2 / 2).subs(k, m * w ** 2), m * w ** 2 * A ** 2 / 2)
ident(D, 'a = −ω²x', diff(xs, t, 2), -w ** 2 * xs)
ident(D, 'v_máx = ωA: v² + ω²x² = ω²A²', diff(xs, t) ** 2 + w ** 2 * xs ** 2, w ** 2 * A ** 2)
y, ye, u = S('y ye u')
ident(D, 'peso: equilibrio y_e = mg/k', (-k * ye + m * g).subs(ye, m * g / k), 0)
ident(D, 'desplazamiento u = y − y_e: m ü = −k u', -k * (u + ye) + m * g, -k * u + (-k * ye + m * g))
k1, k2, Fp = S('k1 k2 F')
ident(D, 'serie: F/k_s = F/k₁ + F/k₂ con k_s = k₁k₂/(k₁+k₂)', Fp / (k1 * k2 / (k1 + k2)), Fp / k1 + Fp / k2)
ident(D, 'paralelo: F = k₁x + k₂x = (k₁+k₂)x', (k1 + k2) * Symbol('x', positive=True), k1 * Symbol('x', positive=True) + k2 * Symbol('x', positive=True))
Ul = Function('U'); xq = Symbol('xq')
Upot = k1 * (xq) ** 2 / 2
ident(D, 'U″ = k para U = ½kx²', diff(Upot, xq, 2), k1)
um = {'k': 'kg s^-2', 'm': 'kg', 'A': 'm', 'w': 'rad s^-1', 'E': 'kg m^2 s^-2', 'ye': 'm', 'g': 'm s^-2', 'T': 's', 'vm': 'm s^-1'}
dimcheck(D, 'ω = √(k/m)', w, sqrt(k / m), um); dimcheck(D, 'T = 2π√(m/k)', Symbol('T', positive=True), 2 * pi * sqrt(m / k), um); dimcheck(D, 'E = ½kA²', E, k * A ** 2 / 2, um)
dimcheck(D, 'v_máx = ωA', Symbol('vm', positive=True), sqrt(k / m) * A, um); dimcheck(D, 'y_e = mg/k', ye, m * g / k, um)
num(D, 'ω', math.sqrt(200 / 0.5), '20'); num(D, 'f', 20 / 2 / math.pi, '3.183'); num(D, 'T', 2 * math.pi / 20, '0.3142'); num(D, 'E', 0.5 * 200 * 0.05 ** 2, '0.25'); num(D, 'v_máx', 20 * 0.05, '1.00'); num(D, 'y_e (cm)', 0.5 * G0 / 200 * 100, '2.45')
num(D, 'E con A doble', 0.5 * 200 * 0.1 ** 2, '1'); num(D, 'T con m = 2 kg', 2 * math.pi * math.sqrt(2 / 200), '0.6283'); num(D, 'ω con m = 2 kg', math.sqrt(200 / 2), '10')
num(D, 'serie 100‖300', 400.0, '400'); num(D, 'serie 100–300', 100 * 300 / 400, '75'); num(D, 'serie 200–200', 200 * 200 / 400, '100')
num(D, 'f valor inicial', 20 / 2 / math.pi, '3.1831'); num(D, 'T valor inicial', 2 * math.pi / 20, '0.31416'); num(D, 'y_e valor inicial', 0.5 * G0 / 200, '0.024517')
kp, mp_, Ap = symbols('k m A', positive=True)
fs(D, 'w', sqrt(kp / mp_)); fs(D, 'f', sqrt(kp / mp_) / (2 * pi)); fs(D, 'T', 2 * pi * sqrt(mp_ / kp)); fs(D, 'E', kp * Ap ** 2 / 2); fs(D, 'vm', sqrt(kp / mp_) * Ap); fs(D, 'xe', mp_ * sp.Float('9.80665', 30) / kp)

# ---------------------------------------------------------------- péndulo exacto
D = 'pendulo-exacto'
L, th0, ph_, thv = S('L theta0 phi theta')
kk = sin(th0 / 2)
ident(D, 'cosθ − cosθ₀ = 2(sen²(θ₀/2) − sen²(θ/2))', cos(thv) - cos(th0), 2 * (sin(th0 / 2) ** 2 - sin(thv / 2) ** 2))
sub = {thv: 2 * asin(kk * sin(ph_))}
ident(D, 'k² − sen²(θ/2) = k²cos²φ', (kk ** 2 - sin(thv / 2) ** 2).subs(sub), kk ** 2 * cos(ph_) ** 2)
ident(D, 'dθ/dφ = 2k cosφ/√(1 − k² sen²φ)', diff(2 * asin(kk * sin(ph_)), ph_), 2 * kk * cos(ph_) / sqrt(1 - kk ** 2 * sin(ph_) ** 2))
ident(D, 'integrando: 1/√(k² − sen²(θ/2)) dθ = 2 dφ/√(1 − k² sen²φ)', (diff(2 * asin(kk * sin(ph_)), ph_) / (kk * cos(ph_))), 2 / sqrt(1 - kk ** 2 * sin(ph_) ** 2))
for thd in (10, 60, 120, 170):
    th_ = math.radians(thd); kv = math.sin(th_ / 2)
    q1 = 4 * float(mp.quad(lambda ps: 1 / mp.sqrt(1 - kv ** 2 * mp.sin(ps) ** 2), [0, mp.pi / 2]))
    q2 = 2 * float(mp.quad(lambda tt: 1 / mp.sqrt(mp.fabs(kv ** 2 - mp.sin(tt / 2) ** 2)), [0, th_]))
    q3 = 4 * float(mp.quad(lambda tt: 1 / mp.sqrt(mp.fabs(2 * (mp.cos(tt) - mp.cos(th_)))), [0, th_]))
    ref = 4 * float(ellipk(kv ** 2))
    rec(G_STEP, D, f'T/√(L/g) = 4K = integral de ψ ({thd}°)', q1, ref, 'rel 1e-9', abs(q1 - ref) < 1e-9 * ref)
    rec(G_STEP, D, f'T/√(L/g) = 2∫dθ/√(k²−sen²(θ/2)) ({thd}°)', q2, ref, 'rel 1e-7', abs(q2 - ref) < 1e-7 * ref)
    rec(G_STEP, D, f'T/√(L/g) = 4∫dθ/√(2(cosθ−cosθ₀)) ({thd}°)', q3, ref, 'rel 1e-8', abs(q3 - ref) < 1e-8 * ref)
mm = Symbol('mm', positive=True)
series_is(D, 'K(m) = (π/2)(1 + m/4 + 9m²/64)', elliptic_k(mm), mm, 0, 3, pi / 2 * (1 + mm / 4 + 9 * mm ** 2 / 64))
series_is(D, 'F(θ₀)/2π = 1 + θ₀²/16 + 11θ₀⁴/3072', 2 * elliptic_k(sin(th0 / 2) ** 2) / pi, th0, 0, 6, 1 + th0 ** 2 / 16 + 11 * th0 ** 4 / 3072)
Tn = lambda thd, L_=1.0, g_=9.81: 4 * math.sqrt(L_ / g_) * float(ellipk(math.sin(math.radians(thd) / 2) ** 2))
for thd, vv in ((10, '1.00191'), (30, '1.01741'), (60, '1.07318'), (90, '1.18034'), (120, '1.37288'), (150, '1.76220'), (170, '2.43936')):
    num(D, f'T/T₀ ({thd}°)', Tn(thd) / (2 * math.pi * math.sqrt(1 / 9.81)), vv)
num(D, 'T/T₀ (179°)', Tn(179) / (2 * math.pi * math.sqrt(1 / 9.81)), '3.9011'); num(D, 'T₀', 2 * math.pi * math.sqrt(1 / 9.81), '2.0061'); num(D, 'T (60°)', Tn(60), '2.153')
t60 = math.radians(60)
num(D, 'serie 1.er orden (60°)', 1 + t60 ** 2 / 16, '1.06854'); num(D, 'error 1.er orden (%)', (1 - (1 + t60 ** 2 / 16) / (Tn(60) / (2 * math.pi * math.sqrt(1 / 9.81)))) * 100, '0.43')
num(D, 'serie 2.º orden (60°)', 1 + t60 ** 2 / 16 + 11 * t60 ** 4 / 3072, '1.07285'); num(D, 'error 2.º orden (%)', (1 - (1 + t60 ** 2 / 16 + 11 * t60 ** 4 / 3072) / (Tn(60) / (2 * math.pi * math.sqrt(1 / 9.81)))) * 100, '0.03')
t120 = math.radians(120); num(D, 'serie 2.º orden (120°)', 1 + t120 ** 2 / 16 + 11 * t120 ** 4 / 3072, '1.3431'); num(D, 'serie 1.er orden (120°)', 1 + t120 ** 2 / 16, '1.2742')
num(D, 'T (60°) valor inicial', Tn(60), '2.15287'); num(D, 'T₀ valor inicial', 2 * math.pi * math.sqrt(1 / 9.81), '2.00607'); num(D, 'corrección a 10° (%)', (Tn(10) / (2 * math.pi * math.sqrt(1 / 9.81)) - 1) * 100, '0.19')
Lp, gp, thp = symbols('L g th', positive=True); thr = thp * pi / 180
cv = lambda p: dict(L=p['L'], g=p['g'], th=math.radians(p['th']))
fs(D, 'T', 4 * sqrt(Lp / gp) * elliptic_k(sin(thp / 2) ** 2), conv=cv); fs(D, 'T0', 2 * pi * sqrt(Lp / gp), conv=lambda p: dict(L=p['L'], g=p['g']))
fs(D, 'r', 2 * elliptic_k(sin(thp / 2) ** 2) / pi, conv=cv); fs(D, 'r2', 1 + thp ** 2 / 16 + 11 * thp ** 4 / 3072, conv=cv)
dimcheck(D, 'T = 4√(L/g)K', Symbol('T', positive=True), 4 * sqrt(L / g) * elliptic_k(sin(th0 / 2) ** 2), {'T': 's', 'L': 'm', 'g': 'm s^-2', 'theta0': 'rad'})

# ---------------------------------------------------------------- péndulo físico
D = 'pendulo-fisico'
d, I, Lr = S('d I Lr')
ident(D, 'T = 2π√(I/mgd) con I = mL²/12 + md²', 2 * pi * sqrt((m * Lr ** 2 / 12 + m * d ** 2) / (m * g * d)), 2 * pi * sqrt((Lr ** 2 / 12 + d ** 2) / (g * d)))
solves(D, 'minimización: d/dd(L²/(12d) + d) = 0', [Eq(diff(Lr ** 2 / (12 * d) + d, d), 0)], d, Lr / sqrt(12))
dm_ = Lr / sqrt(12)
ident(D, 'L_eq(d_m) = 2d_m', (Lr ** 2 / 12 + dm_ ** 2) / dm_, 2 * dm_)
ident(D, 'T_mín = 2π√(2d_m/g) = 2π√(L/(√3 g))', 2 * pi * sqrt(2 * dm_ / g), 2 * pi * sqrt(Lr / (sqrt(3) * g)))
ident(D, 'extremo: L_eq = 2L/3', (Lr ** 2 / 12 + (Lr / 2) ** 2) / (Lr / 2), R_(2, 3) * Lr)
ident(D, 'Kater: g = 4π²(d₁ + d₂)/T² con d₁d₂ = L²/12', 4 * pi ** 2 * (Lr ** 2 / 12 / Symbol('d1', positive=True) + Symbol('d1', positive=True)) / (2 * pi * sqrt((Lr ** 2 / 12 + Symbol('d1', positive=True) ** 2) / (g * Symbol('d1', positive=True)))) ** 2, g)
up = {'I': 'kg m^2', 'd': 'm', 'Lr': 'm', 'm': 'kg', 'g': 'm s^-2', 'T': 's'}
dimcheck(D, 'T = 2π√(I/(mgd))', Symbol('T', positive=True), 2 * pi * sqrt(I / (m * g * d)), up); dimcheck(D, 'T de la varilla', Symbol('T', positive=True), 2 * pi * sqrt((Lr ** 2 / 12 + d ** 2) / (g * d)), up)
Tfn = lambda L_, d_, g_=9.81: 2 * math.pi * math.sqrt((L_ ** 2 / 12 + d_ ** 2) / (g_ * d_))
num(D, 'T (extremo)', Tfn(1, 0.5), '1.638'); num(D, 'L_eq (extremo)', (1 / 12 + 0.25) / 0.5, '0.667'); num(D, 'd_m', 1 / math.sqrt(12), '0.2887'); num(D, 'T_mín', Tfn(1, 1 / math.sqrt(12)), '1.5243'); num(D, 'T (d = 0.1)', Tfn(1, 0.1), '1.938'); num(D, 'T (d = 0.3)', Tfn(1, 0.3), '1.5248')
rec(G_NUM, D, 'variación de T entre d = 0.27 y 0.31 m menor que 0.15 %', max(Tfn(1, 0.27), Tfn(1, 0.31)) / Tfn(1, 1 / math.sqrt(12)) - 1, 0.0015, '< 0.15 %', max(Tfn(1, 0.27), Tfn(1, 0.31)) / Tfn(1, 1 / math.sqrt(12)) - 1 < 0.0015)
num(D, 'T valor inicial', Tfn(1, 0.5), '1.63795'); num(D, 'L_eq valor inicial', 2 / 3, '0.66667'); num(D, 'd_m valor inicial', 1 / math.sqrt(12), '0.28868'); num(D, 'T_mín valor inicial', Tfn(1, 1 / math.sqrt(12)), '1.52428')
Lq, fq, gq = symbols('L f g', positive=True)
fs(D, 'T', 2 * pi * sqrt(Lq * (R_(1, 12) + fq ** 2) / (gq * fq))); fs(D, 'Le', Lq * (R_(1, 12) + fq ** 2) / fq); fs(D, 'dm', Lq / sqrt(12)); fs(D, 'Tm', 2 * pi * sqrt(2 * Lq / sqrt(12) / gq))

# ---------------------------------------------------------------- modos acoplados
D = 'modos-acoplados'
kc, x1, x2 = S('kc x1 x2')
x1f, x2f = Function('x1'), Function('x2')
w1, w2 = sqrt(k / m), sqrt((k + 2 * kc) / m)
A_ = Symbol('A', positive=True)
x1s = A_ / 2 * (cos(w1 * t) + cos(w2 * t)); x2s = A_ / 2 * (cos(w1 * t) - cos(w2 * t))
res1 = m * diff(x1s, t, 2) + k * x1s + kc * (x1s - x2s); res2 = m * diff(x2s, t, 2) + k * x2s + kc * (x2s - x1s)
ident(D, 'x₁ cumple m ẍ₁ = −kx₁ − k_c(x₁−x₂)', res1, 0); ident(D, 'x₂ cumple m ẍ₂ = −kx₂ − k_c(x₂−x₁)', res2, 0)
ident(D, 'suma: m q̈₊ = −k q₊', m * diff(x1s + x2s, t, 2) + k * (x1s + x2s), 0); ident(D, 'resta: m q̈₋ = −(k+2k_c) q₋', m * diff(x1s - x2s, t, 2) + (k + 2 * kc) * (x1s - x2s), 0)
ident(D, 'condiciones iniciales x₁(0) = A, x₂(0) = 0', x1s.subs(t, 0) - A_, 0); ident(D, 'x₂(0) = 0', x2s.subs(t, 0), 0); ident(D, 'ẋ₁(0) = 0', diff(x1s, t).subs(t, 0), 0)
ident(D, 'x₁ = A cos((ω₂−ω₁)t/2) cos((ω₁+ω₂)t/2)', x1s, A_ * cos((w2 - w1) * t / 2) * cos((w1 + w2) * t / 2))
ident(D, 'x₂ = A sen((ω₂−ω₁)t/2) sen((ω₁+ω₂)t/2)', x2s, A_ * sin((w2 - w1) * t / 2) * sin((w1 + w2) * t / 2))
tt_ = pi / (w2 - w1)
ident(D, 'x₁(t_transf) = 0', x1s.subs(t, tt_) - 0, A_ / 2 * (cos(w1 * pi / (w2 - w1)) + cos(w2 * pi / (w2 - w1))))
ident(D, 'amplitud de x₁ nula: cos((ω₂−ω₁)t/2) = 0 en t = π/(ω₂−ω₁)', cos((w2 - w1) * tt_ / 2), 0)
ident(D, 'acople débil: ω₂ − ω₁ ≈ k_c/(mω₁)', sp.series(w2 - w1, kc, 0, 2).removeO(), kc / (m * w1))
uc = {'k': 'kg s^-2', 'kc': 'kg s^-2', 'm': 'kg', 'w1': 'rad s^-1', 'w2': 'rad s^-1', 'tt': 's'}
dimcheck(D, 'ω₂ = √((k+2k_c)/m)', Symbol('w2', positive=True), w2, uc); dimcheck(D, 't = π/(ω₂−ω₁)', Symbol('tt', positive=True), pi / (w2 - w1), uc)
mc = lambda k_, kc_, m_=1.0: (math.sqrt(k_ / m_), math.sqrt((k_ + 2 * kc_) / m_))
num(D, 'ω₂', mc(100, 20)[1], '11.832'); num(D, 't_transf', math.pi / (mc(100, 20)[1] - 10), '1.715'); num(D, 'T_batido', 2 * math.pi / (mc(100, 20)[1] - 10), '3.429')
num(D, 'ω₂ (kc = 5)', mc(100, 5)[1], '10.488'); num(D, 't (kc = 5)', math.pi / (mc(100, 5)[1] - 10), '6.437'); num(D, 'ω₂ (kc = 50)', mc(100, 50)[1], '14.142'); num(D, 't (kc = 50)', math.pi / (mc(100, 50)[1] - 10), '0.758')
num(D, 'aproximación débil (kc = 5)', math.pi * 10 / 5, '6.28')
nkc = lambda kc_: -kc_ / (mc(100, kc_)[1] * (mc(100, kc_)[1] - 10))
num(D, 'n_kc en kc = 1', nkc(1), '-0.995'); num(D, 'n_kc en kc = 20', nkc(20), '-0.923')
num(D, 'ω₂ valor inicial', mc(100, 20)[1], '11.8322'); num(D, 't_transf valor inicial', math.pi / (mc(100, 20)[1] - 10), '1.71469'); num(D, 'T_batido valor inicial', 2 * math.pi / (mc(100, 20)[1] - 10), '3.42939')
kq, kcq, mq = symbols('k kc m', positive=True)
w1q, w2q = sqrt(kq / mq), sqrt((kq + 2 * kcq) / mq)
fs(D, 'w1', w1q); fs(D, 'w2', w2q); fs(D, 'tt', pi / (w2q - w1q)); fs(D, 'tb', 2 * pi / (w2q - w1q))

# ---------------------------------------------------------------- potencia en resonancia
D = 'resonancia-potencia'
w, w0, F0, gam, P = S('w w0 F0 gam P')
Dn = (w0 ** 2 - w ** 2) ** 2 + 4 * gam ** 2 * w ** 2
Aamp = F0 / m / sqrt(Dn); sd = 2 * gam * w / sqrt(Dn)
xp = Aamp * cos(w * t - sp.asin(sd))
# promedio de un periodo (numérico con integral exacta)
Pav = F0 * Aamp * w * sd / 2
ident(D, 'P = ½F₀Aω senδ = (F₀²/2m)·2γω²/D', Pav, F0 ** 2 / (2 * m) * 2 * gam * w ** 2 / Dn)
dl_ = Symbol('dl', positive=True)
prom = integrate(cos(w * t) * sin(w * t - dl_), (t, 0, 2 * pi / w)) * w / (2 * pi)
ident(D, '⟨cos ωt sen(ωt − δ)⟩ = −½ senδ', prom, -sin(dl_) / 2)
ident(D, 'balance: b⟨ẋ²⟩ = mγω²A² = P', m * gam * w ** 2 * Aamp ** 2, F0 ** 2 / (2 * m) * 2 * gam * w ** 2 / Dn)
Pw = F0 ** 2 / (2 * m) * 2 * gam * w ** 2 / Dn
ident(D, 'P(ω₀) = F₀²/(4mγ)', Pw.subs(w, w0), F0 ** 2 / (4 * m * gam))
Pmax = F0 ** 2 / (4 * m * gam)
ident(D, 'P/P_máx = 4γ²ω²/D', Pw / Pmax, 4 * gam ** 2 * w ** 2 / Dn)
for wv in (sqrt(w0 ** 2 + gam ** 2) + gam, sqrt(w0 ** 2 + gam ** 2) - gam):
    ident(D, 'P(ω±) = P_máx/2', (Pw / Pmax).subs(w, wv), R_(1, 2))
ident(D, 'ω₊ − ω₋ = 2γ', (sqrt(w0 ** 2 + gam ** 2) + gam) - (sqrt(w0 ** 2 + gam ** 2) - gam), 2 * gam)
ident(D, 'simetría P(ω) = P(ω₀²/ω)', Pw, Pw.subs(w, w0 ** 2 / w))
rec(G_STEP, D, 'máximo de P en ω = ω₀ (derivada nula)', float(abs(diff(Pw, w).subs(w, w0).subs({F0: 1, m: 1, gam: 1, w0: 10}))), 0.0, 'abs 1e-12', abs(float(diff(Pw, w).subs(w, w0).subs({F0: 1, m: 1, gam: 1, w0: 10}))) < 1e-12)
upw = {'P': 'W', 'F0': 'N', 'm': 'kg', 'gam': 's^-1', 'w': 'rad s^-1', 'w0': 'rad s^-1'}
dimcheck(D, 'P(ω)', P, Pw, upw); dimcheck(D, 'P_máx = F₀²/(4mγ)', P, Pmax, upw); dimcheck(D, 'ω± = √(ω₀²+γ²) ± γ', w, sqrt(w0 ** 2 + gam ** 2) + gam, upw)
Pn = lambda w_, m_=1, w0_=10, z_=0.1, F_=1: F_ ** 2 / (2 * m_) * 2 * z_ * w0_ * w_ ** 2 / ((w0_ ** 2 - w_ ** 2) ** 2 + 4 * (z_ * w0_) ** 2 * w_ ** 2)
num(D, 'P_máx', Pn(10), '0.25'); num(D, 'ω₋', math.sqrt(101) - 1, '9.0499'); num(D, 'ω₊', math.sqrt(101) + 1, '11.0499'); num(D, 'P(ω±)', Pn(math.sqrt(101) + 1), '0.125'); num(D, 'ancho', 2.0, '2.000'); num(D, 'Q', 10 / 2, '5')
num(D, 'P(5) en mW', Pn(5) * 1e3, '4.367'); num(D, 'P(20) en mW', Pn(20) * 1e3, '4.367'); num(D, 'P_máx con ζ = 0.01', Pn(10, z_=0.01), '2.5'); num(D, 'ancho con ζ = 0.01', 2 * 0.01 * 10, '0.2')
num(D, 'P(5) valor inicial (mW)', Pn(5) * 1e3, '4.3668'); num(D, 'altura × ancho', 0.25 * 2, '0.5')
mq, w0q, zq, Fq, wq = symbols('m w0 z F w', positive=True)
gq_ = zq * w0q
fs(D, 'P', Fq ** 2 / (2 * mq) * 2 * gq_ * wq ** 2 / ((w0q ** 2 - wq ** 2) ** 2 + 4 * gq_ ** 2 * wq ** 2)); fs(D, 'Pm', Fq ** 2 / (4 * mq * gq_)); fs(D, 'wp', sqrt(w0q ** 2 + gq_ ** 2) + gq_); fs(D, 'wm', sqrt(w0q ** 2 + gq_ ** 2) - gq_); fs(D, 'bw', 2 * gq_)
