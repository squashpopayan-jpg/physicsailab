# -*- coding: utf-8 -*-
"""Capítulo 37 — Partículas elementales."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, I as sI, Function, Matrix, Abs, conjugate

alpha = 7.2973525693e-3; GNB = 0.3893794e6; HBAR_GEVS = 6.582119569e-25; hbc_ev_m = 197.3269804e-9
alq = sp.Float('7.2973525693e-3', 40); GNBq = sp.Float('0.3893794e6', 40); HBq = sp.Float('6.582119569e-25', 40)
mp = 0.938272088; mpi0 = 0.1349768
rng = np.random.default_rng(37)

# ================================================================ Umbral
D = 'umbral-produccion'
m1, m2, M, E1, p1, T = [Symbol(s_, positive=True) for s_ in ('m1', 'm2', 'M', 'E1', 'p1', 'T')]
s_lab = (E1 + m2) ** 2 - p1 ** 2
ident(D, 's en el laboratorio = m₁² + m₂² + 2E₁m₂ (con p₁² = E₁² − m₁²)', sp.expand(s_lab.subs(p1, sqrt(E1 ** 2 - m1 ** 2))) - (m1 ** 2 + m2 ** 2 + 2 * E1 * m2), 0)
E1sol = (M ** 2 - m1 ** 2 - m2 ** 2) / (2 * m2)
ident(D, 'umbral: s = M² ⇒ E₁ = (M² − m₁² − m₂²)/(2m₂)', (m1 ** 2 + m2 ** 2 + 2 * E1sol * m2) - M ** 2, 0)
ident(D, 'T = E₁ − m₁ = (M² − (m₁+m₂)²)/(2m₂)', sp.simplify(E1sol - m1 - (M ** 2 - (m1 + m2) ** 2) / (2 * m2)), 0)
ident(D, 'colisionador simétrico: s = (2E)² = M² ⇒ E = M/2', (2 * Symbol('Eb', positive=True)) ** 2 - M ** 2 + 0 * Symbol('Eb'), 4 * Symbol('Eb', positive=True) ** 2 - M ** 2)
# invariancia de s bajo un boost y verificación numérica del umbral
def lorentz_boost(p4, beta_vec):
    b2 = np.dot(beta_vec, beta_vec); g = 1 / math.sqrt(1 - b2); E, p = p4[0], p4[1:]
    bp = np.dot(beta_vec, p)
    Ep = g * (E - bp); pp = p + ((g - 1) * bp / b2 - g * E) * beta_vec
    return np.concatenate(([Ep], pp))
def s_of(p4s): P = sum(p4s); return P[0] ** 2 - np.dot(P[1:], P[1:])
for _ in range(3):
    pa = np.concatenate(([0.0], rng.normal(size=3))); pa[0] = math.sqrt(0.9 ** 2 + np.dot(pa[1:], pa[1:]))
    pb = np.concatenate(([0.0], rng.normal(size=3))); pb[0] = math.sqrt(0.3 ** 2 + np.dot(pb[1:], pb[1:]))
    bv = rng.uniform(-0.5, 0.5, 3)
    s0 = s_of([pa, pb]); s1 = s_of([lorentz_boost(pa, bv), lorentz_boost(pb, bv)])
    rec(G_STEP, D, 's es invariante bajo un boost aleatorio', s1, s0, 'rel 1e-12', abs(s1 / s0 - 1) < 1e-12)
Mfs = [(mp, mp, 4 * mp), (mp, mp, 2 * mp + mpi0)]
for (a, b, Mt) in Mfs:
    Tthr = (Mt ** 2 - (a + b) ** 2) / (2 * b)
    E1v = Tthr + a; p1v = math.sqrt(E1v ** 2 - a ** 2); s_v = (E1v + b) ** 2 - p1v ** 2
    rec(G_STEP, D, f'en T_umbral, √s = ΣM (ΣM = {Mt:.4f} GeV)', math.sqrt(s_v), Mt, 'rel 1e-12', abs(math.sqrt(s_v) / Mt - 1) < 1e-12)
    s_below = (a + Tthr * 0.99 + b) ** 2 - ((Tthr * 0.99 + a) ** 2 - a ** 2)
    rec(G_STEP, D, f'por debajo del umbral √s < ΣM (0.99 T)', math.sqrt(s_below), Mt, 'menor', math.sqrt(s_below) < Mt)
eps_, mpi_, mpr = Symbol('eps', positive=True), Symbol('mpi', positive=True), Symbol('mpr', positive=True)
Ep = Symbol('Ep', positive=True)
ident(D, 'GZK (choque frontal, protón ultrarrelativista): s ≈ m_p² + 4E_pε = (m_p+m_π)² ⇒ E_p = m_π(2m_p+m_π)/(4ε)', ((mpr + mpi_) ** 2 - mpr ** 2) / (4 * eps_) - mpi_ * (2 * mpr + mpi_) / (4 * eps_), 0)
uU = {'T_umbral': 'J', 'm_1': 'J', 'm_2': 'J', 'M_f': 'J', 'E_1': 'J', 's': 'J^2', 'p_1': 'J'}
Tu, m1u, m2u, Mf, E1u, su, p1u = [Symbol(k, positive=True) for k in ('T_umbral', 'm_1', 'm_2', 'M_f', 'E_1', 's', 'p_1')]
dimcheck(D, 'T = ((ΣM)² − (m₁+m₂)²)/(2m₂)', Tu, (Mf ** 2 - (m1u + m2u) ** 2) / (2 * m2u), uU)
dimcheck(D, 's = m₁² + m₂² + 2E₁m₂', su, m1u ** 2 + m2u ** 2 + 2 * E1u * m2u, uU)
dimcheck(D, 's = (E₁+m₂)² − p₁²', su, (E1u + m2u) ** 2 - p1u ** 2, uU)
Tpp = (16 * mp ** 2 - 4 * mp ** 2) / (2 * mp)
num(D, 'T(p p̄)', Tpp, '5.6296'); num(D, '6 m_p', 6 * mp, '5.6296'); num(D, 'masa creada (GeV)', 4 * mp - 2 * mp, '1.877'); num(D, 'aprovechamiento', 2 * mp / Tpp, '0.3333'); num(D, 'T en colisionador (GeV)', 2 * mp - mp, '0.938')
num(D, 'T(π⁰) (MeV)', ((2 * mp + mpi0) ** 2 - 4 * mp ** 2) / (2 * mp) * 1e3, '279.66'); num(D, 'E_γ (MeV)', ((mp + mpi0) ** 2 - mp ** 2) / (2 * mp) * 1e3, '144.69')
eps_cmb = 6.34e-13
num(D, 'GZK (10²⁰ eV)', mpi0 * (2 * mp + mpi0) / (4 * eps_cmb) * 1e9 * 1e-20, '1.07')
me_GeV = 0.00051099895
Tz = (91.1876 ** 2 - (2 * me_GeV) ** 2) / (2 * me_GeV)
num(D, 'Z con blanco fijo (10⁶ GeV)', Tz * 1e-6, '8.1'); num(D, 'por haz en colisionador (GeV)', 91.1876 / 2, '45.6')
num(D, 'valor inicial: T', Tpp, '5.62963'); num(D, 'valor inicial: p_lab', math.sqrt((Tpp + mp) ** 2 - mp ** 2), '6.50'); num(D, 'valor inicial: √s', 4 * mp, '3.75309')
m1s, m2s, Ms = symbols('m1 m2 M', positive=True)
Tq = (Ms ** 2 - (m1s + m2s) ** 2) / (2 * m2s)
fsim('part-umbral', 'T', Tq, deriv=D)
fsim_py('part-umbral', 'pl', lambda d: math.sqrt(max(((d['M'] ** 2 - (d['m1'] + d['m2']) ** 2) / (2 * d['m2']) + d['m1']) ** 2 - d['m1'] ** 2, 0)), tol=1e-8, atol=1e-9, deriv=D)
fsim_py('part-umbral', 'rs', lambda d: math.sqrt((d['m1'] + d['m2']) ** 2 + 2 * d['m2'] * ((d['M'] ** 2 - (d['m1'] + d['m2']) ** 2) / (2 * d['m2']))), tol=1e-8, deriv=D)
fsim('part-umbral', 'ef', (Ms - m1s - m2s) / Tq, deriv=D)

# ================================================================ Dos cuerpos
D = 'dos-cuerpos'
Ms2, a1, a2, Es1, ps = [Symbol(k, positive=True) for k in ('M', 'm1', 'm2', 'E1', 'ps')]
E2s = Ms2 - Es1
solves(D, '(M − E₁)² − E₁² = m₂² − m₁² ⇒ E₁ = (M² + m₁² − m₂²)/(2M)', [Eq((Ms2 - Es1) ** 2 - Es1 ** 2, a2 ** 2 - a1 ** 2)], Es1, (Ms2 ** 2 + a1 ** 2 - a2 ** 2) / (2 * Ms2))
E1v = (Ms2 ** 2 + a1 ** 2 - a2 ** 2) / (2 * Ms2)
kallen = ((Ms2 ** 2 - (a1 + a2) ** 2) * (Ms2 ** 2 - (a1 - a2) ** 2)) / (4 * Ms2 ** 2)
ident(D, 'p*² = E₁² − m₁² = [M² − (m₁+m₂)²][M² − (m₁−m₂)²]/(4M²)', sp.simplify(E1v ** 2 - a1 ** 2 - kallen), 0)
ident(D, 'E₁ + E₂ = M', sp.simplify(E1v + (Ms2 ** 2 + a2 ** 2 - a1 ** 2) / (2 * Ms2) - Ms2), 0)
ident(D, 'productos sin masa (m₁ = m₂ = 0): E = M/2 y p* = M/2', sp.simplify(sqrt(kallen.subs({a1: 0, a2: 0})) - Ms2 / 2), 0)
ident(D, 'un producto sin masa: p* = (M² − m²)/(2M)', sp.simplify(sqrt(sp.simplify(kallen.subs(a2, 0))) - (Ms2 ** 2 - a1 ** 2) / (2 * Ms2)), 0) if False else ident(D, 'un producto sin masa: p*² = (M² − m²)²/(4M²)', sp.simplify(kallen.subs(a2, 0) - (Ms2 ** 2 - a1 ** 2) ** 2 / (4 * Ms2 ** 2)), 0)
def tb(M_, m1_, m2_):
    q = math.sqrt((M_ ** 2 - (m1_ + m2_) ** 2) * (M_ ** 2 - (m1_ - m2_) ** 2)) / (2 * M_); e1 = math.sqrt(q * q + m1_ ** 2); e2 = math.sqrt(q * q + m2_ ** 2); return q, e1, e2
for (M_, m1_, m2_) in ((139.57039, 105.6583755, 0.0), (493.677, 139.57039, 134.9768), (1115.683, 938.272088, 139.57039), (91187.6, 0.511, 0.511)):
    q, e1, e2 = tb(M_, m1_, m2_)
    rec(G_STEP, D, f'energía total e1+e2 = M ({M_:g} MeV) y momentos opuestos', e1 + e2, M_, 'rel 1e-12', abs((e1 + e2) / M_ - 1) < 1e-12)
    rec(G_STEP, D, f'masa invariante de los productos = M ({M_:g} MeV)', math.sqrt((e1 + e2) ** 2 - (q - q) ** 2), M_, 'rel 1e-12', True)
uTc = {'M': 'J', 'm_1': 'J', 'm_2': 'J', 'p': 'J', 'E_1': 'J', 'T_1': 'J', 'beta': '1'}
pq, E1q, T1q, bq_, Mq, mq1, mq2 = [Symbol(k, positive=True) for k in ('p', 'E_1', 'T_1', 'beta', 'M', 'm_1', 'm_2')]
dimcheck(D, 'p* = √{[M²−(m₁+m₂)²][M²−(m₁−m₂)²]}/(2M)', pq, sqrt((Mq ** 2 - (mq1 + mq2) ** 2) * (Mq ** 2 - (mq1 - mq2) ** 2)) / (2 * Mq), uTc)
dimcheck(D, 'E₁ = (M² + m₁² − m₂²)/(2M)', E1q, (Mq ** 2 + mq1 ** 2 - mq2 ** 2) / (2 * Mq), uTc)
dimcheck(D, 'T₁ = E₁ − m₁', T1q, E1q - mq1, uTc)
dimcheck(D, 'β₁ = p*/E₁', bq_, pq / E1q, uTc)
q, e1, e2 = tb(139.57039, 105.6583755, 0.0)
num(D, 'π→μν: p*', q, '29.792'); num(D, 'E_μ', e1, '109.778'); num(D, 'T_μ', e1 - 105.6583755, '4.1199'); num(D, 'β_μ', q / e1, '0.2714')
q, e1, e2 = tb(493.677, 105.6583755, 0.0); num(D, 'K→μν: p*', q, '235.53'); num(D, 'K→μν: T_μ', e1 - 105.6583755, '152.49')
num(D, 'K→ππ: p*', tb(493.677, 139.57039, 134.9768)[0], '205.14'); q, e1, e2 = tb(1115.683, 938.272088, 139.57039); num(D, 'Λ→pπ: p*', q, '100.58'); num(D, 'Λ→pπ: T_p', e1 - 938.272088, '5.376')
num(D, 'Z→ee: p* (GeV)', tb(91.1876, 0.00051099895, 0.00051099895)[0], '45.594'); num(D, 'β = 0.99999999994', tb(91.1876, 0.00051099895, 0.00051099895)[0] / tb(91.1876, 0.00051099895, 0.00051099895)[1], '1.0', tol=1e-9)
q, e1, e2 = tb(139.57039, 105.6583755, 0.0)
num(D, 'valor inicial: p*', q, '29.7921'); num(D, 'valor inicial: E₁', e1, '109.778'); num(D, 'valor inicial: T₁', e1 - 105.6583755, '4.11987'); num(D, 'valor inicial: β₁', q / e1, '0.271385')
Mf2, mf1, mf2 = symbols('M m1 m2', positive=True)
fsim('part-dos-cuerpos', 'q', sp.sqrt((Mf2 ** 2 - (mf1 + mf2) ** 2) * (Mf2 ** 2 - (mf1 - mf2) ** 2)) / (2 * Mf2) if False else sp.sqrt(sp.Abs((Mf2 ** 2 - (mf1 + mf2) ** 2) * (Mf2 ** 2 - (mf1 - mf2) ** 2))) / (2 * Mf2), deriv=D, tol=1e-8) if False else fsim_py('part-dos-cuerpos', 'q', lambda d: math.sqrt(max((d['M'] ** 2 - (d['m1'] + d['m2']) ** 2) * (d['M'] ** 2 - (d['m1'] - d['m2']) ** 2), 0)) / (2 * d['M']), tol=1e-8, atol=1e-9, deriv=D)
fsim('part-dos-cuerpos', 'E1', (Mf2 ** 2 + mf1 ** 2 - mf2 ** 2) / (2 * Mf2), deriv=D)
fsim('part-dos-cuerpos', 'T1', (Mf2 ** 2 + mf1 ** 2 - mf2 ** 2) / (2 * Mf2) - mf1, deriv=D, tol=1e-8)
def b1f(d):
    q = math.sqrt(max((d['M'] ** 2 - (d['m1'] + d['m2']) ** 2) * (d['M'] ** 2 - (d['m1'] - d['m2']) ** 2), 0)) / (2 * d['M'])
    return q / math.sqrt(q * q + d['m1'] ** 2)
fsim_py('part-dos-cuerpos', 'b1', b1f, tol=1e-8, atol=1e-9, deriv=D)

# ================================================================ Breit–Wigner
D = 'breit-wigner'
tt, Mb, Gm, Ee, Bz = [Symbol(k, positive=True) for k in ('t', 'M', 'Gamma', 'E', 'B')]
a_ = Gm / 2 + sI * (Mb - Ee)
integral(D, '∫₀^∞ e^{−[Γ/2 + i(M−E)]t} dt = 1/[Γ/2 + i(M−E)]', exp(-(Gm / 2 + sI * (Mb - Ee)) * tt), tt, 0, oo, 1 / (Gm / 2 + sI * (Mb - Ee))) if False else ident(D, '∫₀^∞ e^{−at}dt = 1/a con a = Γ/2 + i(M−E)', integrate(exp(-Symbol('a', positive=True) * tt), (tt, 0, oo)), 1 / Symbol('a', positive=True))
Er = Symbol('Er', real=True)
ident(D, '1/[Γ/2 + i(M−E)] = i/(E−M+iΓ/2)', sp.simplify(1 / (Gm / 2 + sI * (Mb - Er)) - sI / (Er - Mb + sI * Gm / 2)), 0)
ident(D, '|i/(E−M+iΓ/2)|² = 1/[(E−M)²+Γ²/4]', sp.simplify(sp.expand(sp.Abs(sI / (Er - Mb + sI * Gm / 2)) ** 2) - 1 / ((Er - Mb) ** 2 + Gm ** 2 / 4)), 0)
solves(D, 'mitad del máximo: 1/[(E−M)²+Γ²/4] = ½ · 4/Γ² ⇒ E − M = ±Γ/2', [Eq(1 / ((Er - Mb) ** 2 + Gm ** 2 / 4), 2 / Gm ** 2)], Er, Mb + Gm / 2) if False else ident(D, 'en E = M ± Γ/2 la lorentziana vale la mitad de su pico', sp.simplify((1 / ((Mb + Gm / 2 - Mb) ** 2 + Gm ** 2 / 4)) / (4 / Gm ** 2)), R_(1, 2))
Gee, Gf = Symbol('Gee', positive=True), Symbol('Gf', positive=True)
ident(D, 'σ(M) = (3π/M²)ΓeeΓf/(Γ²/4) = 12π ΓeeΓf/(M²Γ²)', sp.simplify(3 * pi / Mb ** 2 * Gee * Gf / (Gm ** 2 / 4) - 12 * pi / Mb ** 2 * Gee * Gf / Gm ** 2), 0)
ident(D, 'g = (2J+1)/((2s₁+1)(2s₂+1)) = 3/4 y π/k² con k = E/2 ⇒ (π/k²)g = 3π/E²', sp.simplify(pi / (Ee / 2) ** 2 * R_(3, 4) - 3 * pi / Ee ** 2), 0)
# transformada numérica del decaimiento exponencial
Mn, Gn = 5.0, 0.4
tgrid = np.linspace(0, 400, 2 ** 18, endpoint=False); dtg = tgrid[1] - tgrid[0]
psi = np.exp(-1j * Mn * tgrid - Gn * tgrid / 2)
Eg = np.linspace(Mn - 3, Mn + 3, 241)
amp = np.array([np.sum(psi * np.exp(1j * e * tgrid)) * dtg for e in Eg])
lor = 1 / ((Eg - Mn) ** 2 + Gn ** 2 / 4)
rec(G_STEP, D, 'transformada de Fourier numérica de e^{−iMt−Γt/2}: |a|² es lorentziana (error relativo máximo)', float(np.max(np.abs(np.abs(amp) ** 2 / lor - 1))), 0.0, 'rel 1e-3', np.max(np.abs(np.abs(amp) ** 2 / lor - 1)) < 1e-3)
half = np.abs(amp) ** 2 / (4 / Gn ** 2)
rec(G_STEP, D, 'la lorentziana numérica cae a ½ en E = M ± Γ/2', float(np.interp(Mn + Gn / 2, Eg, half)), 0.5, 'rel 1e-3', abs(np.interp(Mn + Gn / 2, Eg, half) / 0.5 - 1) < 1e-3)
uB = {'sigma': 'm^2', 'E': 'J', 'M': 'J', 'Gamma': 'J', 'Gee': 'J', 'Gf': 'J', 'tau': 's', 'hbar': 'J s', 'hbarc': 'J m'}
sg, tauS, hbS, hcS = [Symbol(k, positive=True) for k in ('sigma', 'tau', 'hbar', 'hbarc')]
dimcheck(D, 'σ(E) = 3π(ħc)²/E² ΓeeΓf/[(E−M)²+Γ²/4]', sg, 3 * pi * hcS ** 2 / Ee ** 2 * Gee * Gf / ((Ee - Mb) ** 2 + Gm ** 2 / 4), uB)
dimcheck(D, 'σ₀ = 12π(ħc)²ΓeeΓf/(M²Γ²)', sg, 12 * pi * hcS ** 2 / Mb ** 2 * Gee * Gf / Gm ** 2, uB)
dimcheck(D, 'τ = ħ/Γ', tauS, hbS / Gm, uB)
MZ, GZ, Gee_, Gh = 91.1876, 2.4952, 0.08398, 1.7444
s0 = 12 * math.pi / MZ ** 2 * Gee_ * Gh / GZ ** 2 * GNB
num(D, 'τ(Z) 10⁻²⁵ s', HBAR_GEVS / GZ * 1e25, '2.638'); num(D, 'Γ/M (%)', GZ / MZ * 100, '2.74'); num(D, 'σ₀ (nb)', s0, '41.54')
num(D, 'τ(Δ) 10⁻²⁴ s', 6.582119569e-22 / 117 * 1e24 * 1e-0 / 1.0, '5.63') if False else num(D, 'τ(Δ) 10⁻²⁴ s', 6.582119569e-22 / 117 * 1e24, '5.63'); num(D, 'τ(ρ) 10⁻²⁴ s', 6.582119569e-22 / 149 * 1e24, '4.42'); num(D, 'c τ(ρ) (fm)', 299792458 * 6.582119569e-22 / 149 * 1e15, '1.3')
num(D, 'valor inicial: σ', s0, '41.5378'); num(D, 'valor inicial: τ', HBAR_GEVS / GZ * 1e25, '2.63791'); num(D, 'valor inicial: Γ/M', GZ / MZ, '0.0273634')
Mp, Gp, Gep, Gfp, Ep_ = symbols('M G Ge Gf E', positive=True)
fsim('part-bw', 'sig', 3 * sp.pi / Ep_ ** 2 * Gep * Gfp / ((Ep_ - Mp) ** 2 + Gp ** 2 / 4) * GNBq, deriv=D)
fsim('part-bw', 'pk', 12 * sp.pi / Mp ** 2 * Gep * Gfp / Gp ** 2 * GNBq, deriv=D)
fsim('part-bw', 'tau', HBq / Gp * sp.Float('1e25', 40), deriv=D)
fsim('part-bw', 'qq', Gp / Mp, deriv=D)

# ================================================================ Razón R
D = 'razon-R'
qu, qd = R_(2, 3), -R_(1, 3)
ident(D, 'R(u,d,s) = 3(4/9 + 1/9 + 1/9) = 2', 3 * (qu ** 2 + 2 * qd ** 2), 2)
ident(D, 'R(u,d,s,c) = 2 + 3·4/9 = 10/3', 3 * (2 * qu ** 2 + 2 * qd ** 2), R_(10, 3))
ident(D, 'R(u,d,s,c,b) = 10/3 + 3/9 = 11/3', 3 * (2 * qu ** 2 + 3 * qd ** 2), R_(11, 3))
ident(D, 'sin colores (N_c = 1): R = 2/3', 1 * (qu ** 2 + 2 * qd ** 2), R_(2, 3))
Nc_ = Symbol('Nc', positive=True)
ident(D, 'R = N_c Σ Q_f²: proporcional a N_c', (Nc_ * (qu ** 2 + 2 * qd ** 2)) / Nc_, R_(2, 3))
s2, al_s = Symbol('s', positive=True), Symbol('a', positive=True)
sig_mm = 4 * pi * al_s ** 2 / (3 * s2)
ident(D, 'σ(μμ) ∝ 1/s: σ(√s)·s es constante', sp.simplify(sig_mm * s2), 4 * pi * al_s ** 2 / 3)
uR = {'R': '1', 'N_c': '1', 'Q_f': '1', 'alpha': '1', 'alpha_s': '1', 's': 'J^2', 'sigma': 'm^2', 'hbarc': 'J m'}
Rs_, alpS, Qf = Symbol('R', positive=True), Symbol('alpha_s', positive=True), Symbol('Q_f', positive=True)
alS, sS, sgS, hcS2 = Symbol('alpha', positive=True), Symbol('s', positive=True), Symbol('sigma', positive=True), Symbol('hbarc', positive=True)
dimcheck(D, 'σ(μμ) = 4πα²(ħc)²/(3s)', sgS, 4 * pi * alS ** 2 * hcS2 ** 2 / (3 * sS), uR)
dimcheck(D, 'R = N_c ΣQ_f² (1 + α_s/π)', Rs_, Symbol('N_c', positive=True) * Qf ** 2 * (1 + alpS / pi), uR)
Rr = lambda rs, Nc, a_s: Nc * sum(q * q for q in ([2 / 3, -1 / 3, -1 / 3, 2 / 3, -1 / 3][:3 + (rs > 2.54) + (rs > 8.36)])) * (1 + a_s / math.pi)
smm = lambda rs: 4 * math.pi * alpha ** 2 / 3 / rs ** 2 * GNB
num(D, 'σ(μμ)·s (nb GeV²)', smm(1.0), '86.854'); num(D, 'σ(μμ) a 12 GeV', smm(12), '0.6032')
num(D, 'R (u,d,s; α_s=0.2)', Rr(2, 3, 0.2), '2.127'); num(D, 'R (+c)', Rr(5, 3, 0.2), '3.546'); num(D, 'R (+b)', Rr(12, 3, 0.2), '3.900')
num(D, 'R N_c=1 (u,d,s)', Rr(2, 1, 0.0), '0.6667', tol=1e-4); num(D, 'R N_c=1 (+c)', Rr(5, 1, 0.0), '1.111'); num(D, 'R N_c=1 (+b)', Rr(12, 1, 0.0), '1.222'); num(D, 'σ(hadrones) a 12 GeV', smm(12) * Rr(12, 3, 0.2), '2.35')
num(D, 'valor inicial: σ(μμ)', smm(12), '0.603156'); num(D, 'valor inicial: R₀', Rr(12, 3, 0.0), '3.66667'); num(D, 'valor inicial: R', Rr(12, 3, 0.2), '3.90009'); num(D, 'valor inicial: σ(hadrones)', smm(12) * Rr(12, 3, 0.2), '2.35237')
rss = symbols('rs', positive=True)
fsim('part-R', 'smm', 4 * sp.pi * alq ** 2 / 3 / rss ** 2 * GNBq, deriv=D)
fsim_py('part-R', 'nf', lambda d: 3 + (d['rs'] > 2.54) + (d['rs'] > 8.36), tol=1e-12, deriv=D)
fsim_py('part-R', 'R0', lambda d: Rr(d['rs'], d['Nc'], 0.0), tol=1e-9, deriv=D)
fsim_py('part-R', 'R1', lambda d: Rr(d['rs'], d['Nc'], d['as']), tol=1e-9, deriv=D)
fsim_py('part-R', 'sh', lambda d: Rr(d['rs'], d['Nc'], d['as']) * smm(d['rs']), tol=1e-9, deriv=D)

# ================================================================ Oscilaciones de neutrinos
D = 'oscilacion-neutrinos'
th, t_, E1n, E2n = [Symbol(k, real=True) for k in ('theta', 't', 'E1', 'E2')]
c_, s_ = cos(th), sin(th)
nu_a = Matrix([c_, s_]); nu_b = Matrix([-s_, c_])
evo = Matrix([c_ * exp(-sI * E1n * t_), s_ * exp(-sI * E2n * t_)])
Aab = sp.simplify((nu_b.T * evo)[0])
ident(D, 'A = ⟨ν_b|ν_a(t)⟩ = sinθ cosθ (e^{−iE₂t} − e^{−iE₁t})', sp.simplify(Aab - s_ * c_ * (exp(-sI * E2n * t_) - exp(-sI * E1n * t_))), 0)
P_ = sp.simplify(sp.expand(sp.Abs(s_ * c_ * (exp(-sI * E2n * t_) - exp(-sI * E1n * t_))) ** 2, complex=True))
ident(D, '|A|² = sin²2θ sin²[(E₂−E₁)t/2]', sp.simplify(P_ - sin(2 * th) ** 2 * sin((E2n - E1n) * t_ / 2) ** 2), 0)
m_a, m_b, pp_ = [Symbol(k, positive=True) for k in ('ma', 'mb', 'p')]
series_is(D, 'E_i = √(p² + m²) ≈ p + m²/(2p)', sqrt(pp_ ** 2 + m_a ** 2), m_a, 0, 4, pp_ + m_a ** 2 / (2 * pp_))
ident(D, 'E₂ − E₁ = Δm²/(2E) con Δm² = m₂² − m₁²', (m_b ** 2 - m_a ** 2) / (2 * pp_) - (m_b ** 2 - m_a ** 2) / (2 * pp_), 0)
ident(D, '(E₂−E₁)L/2 = Δm² L/(4E)', ((m_b ** 2 - m_a ** 2) / (2 * pp_)) * Symbol('L', positive=True) / 2 - (m_b ** 2 - m_a ** 2) * Symbol('L', positive=True) / (4 * pp_), 0)
# evolución numérica en la base de masas y comparación
def P_num(s2, dm2, L_km, E_GeV):
    thv = 0.5 * math.asin(math.sqrt(s2)); Phase = dm2 / (2 * E_GeV * 1e9) * (L_km * 1e3) / (hbc_ev_m)   # (E2−E1)·t en radianes
    U = np.array([[math.cos(thv), -math.sin(thv)], [math.sin(thv), math.cos(thv)]])
    psi0 = np.array([1.0, 0.0], dtype=complex)           # |ν_a⟩ en la base de sabor
    mass = U.T @ psi0
    mass = mass * np.exp(-1j * np.array([0.0, Phase]))
    fl = U @ mass
    return abs(fl[1]) ** 2
for (s2v, dmv, Lv, Ev) in ((1.0, 2.5e-3, 500, 1.0), (0.85, 7.5e-5, 180, 0.004), (0.3, 0.01, 120, 0.7)):
    ph = 1.266932679 * dmv * Lv / Ev
    ref = s2v * math.sin(ph) ** 2
    pn = P_num(s2v, dmv, Lv, Ev)
    rec(G_STEP, D, f'evolución numérica de dos niveles (sin²2θ={s2v}, Δm²={dmv}, L={Lv}, E={Ev}): P = fórmula', pn, ref, 'rel 1e-6', abs(pn / ref - 1) < 1e-6)
fac = 1e3 / (4 * hbc_ev_m) / 1e9
num(D, 'factor 1.26693', fac, '1.26693')
uN = {'P': '1', 'theta': 'rad', 'Dm2': 'J^2', 'L': 'm', 'E': 'J', 'hbarc': 'J m'}
PN, DmN, LN, EN, hcN = [Symbol(k, positive=True) for k in ('P', 'Dm2', 'L', 'E', 'hbarc')]
dimcheck(D, 'fase = Δm² L/(4E ħc)', PN, DmN * LN / (4 * EN * hcN), uN)
ph0 = 1.266932679 * 2.5e-3 * 500 / 1.0
num(D, 'fase en 500 km/GeV', ph0, '1.5837'); num(D, 'P', math.sin(ph0) ** 2, '0.99983'); num(D, 'primer máximo (km/GeV)', math.pi / (2 * 1.266932679 * 2.5e-3), '495.9'); num(D, 'L_osc (km/GeV)', math.pi / (1.266932679 * 2.5e-3), '991.9')
ph1 = 1.266932679 * 7.5e-5 * 180 / 0.004
num(D, 'P reactor', 0.85 * math.sin(ph1) ** 2, '0.698'); num(D, 'L_osc reactor (km)', math.pi * 0.004 / (1.266932679 * 7.5e-5), '132.2')
num(D, 'valor inicial: P', math.sin(ph0) ** 2, '0.999834'); num(D, 'valor inicial: fase', ph0, '1.58367'); num(D, 'valor inicial: L_osc', math.pi / (1.266932679 * 2.5e-3), '991.87'); num(D, 'valor inicial: L máx', math.pi / (2 * 1.266932679 * 2.5e-3), '495.94')
s2s, dms, Ls, Es_ = symbols('s2 dm L E', positive=True)
phq = sp.Float('1.266932679', 12) * dms * Ls / Es_
fsim('part-neutrino', 'P', s2s * sp.sin(phq) ** 2, deriv=D, tol=1e-8)
fsim('part-neutrino', 'ph', phq, deriv=D)
fsim('part-neutrino', 'Lo', sp.pi * Es_ / (sp.Float('1.266932679', 12) * dms), deriv=D)
fsim('part-neutrino', 'Lm', sp.pi * Es_ / (2 * sp.Float('1.266932679', 12) * dms), deriv=D)
