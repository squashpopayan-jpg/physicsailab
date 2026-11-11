# -*- coding: utf-8 -*-
"""Capítulo 16 — Termodinámica."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, Function, solve, simplify, oo, limit, series
import mpmath as mp
from scipy.integrate import solve_ivp, quad

EX = {'adiabatica': 'adiabatica', 'carnot': 'carnot', 'otto': 'otto', 'entropia-gas': 'entropia', 'vdw-critico': 'vdw'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
Rg = 8.314462618
RL = 0.08314462618
Rq_ = sp.Float('8.314462618', 40)
RLq = sp.Float('0.08314462618', 40)

# ---------------------------------------------------------------- adiabática y Mayer
D = 'adiabatica'
n_, Cv, Cp, R, T, V, p, gam, r_, T1, T2, V1, V2, p1, T0 = S('n Cv Cp R T V p gam r T1 T2 V1 V2 p1 T0')
dT, dV = symbols('dT dV', real=True)
ident(D, 'Mayer: nC_p dT = nC_v dT + nR dT ⇒ C_p = C_v + R', (n_ * Cv * dT + n_ * R * dT) / (n_ * dT), Cv + R)
solves(D, 'γ = C_p/C_v = 1 + R/C_v ⇒ C_v = R/(γ − 1)', [Eq(gam, (Cv + R) / Cv)], Cv, R / (gam - 1))
ident(D, 'R/C_v = γ − 1', R / (R / (gam - 1)), gam - 1)
Tf = Function('T')
ode(D, 'n C_v dT/dV = −nRT/V con T = c V^−(γ−1) y C_v = R/(γ−1)', Eq(R / (gam - 1) * Tf(V).diff(V), -R * Tf(V) / V), Eq(Tf(V), T0 * V ** (-(gam - 1))))
ident(D, 'TV^(γ−1) = cte ⇒ T₂ = T₁ r^(γ−1) con V₂ = V₁/r', (T1 * V1 ** (gam - 1)) / (V1 / r_) ** (gam - 1), T1 * r_ ** (gam - 1))
ident(D, 'pV^γ = cte: p₂/p₁ = (V₁/V₂)^γ = r^γ', (V1 / (V1 / r_)) ** gam, r_ ** gam)
ident(D, 'pV^γ = pV·V^(γ−1) = nRT V^(γ−1) = cte', (n_ * R * T) * V ** (gam - 1) / (n_ * R), T * V ** (gam - 1))
integral(D, 'W = −∫ p dV = p₁V₁^γ ∫V^(−γ) dV = (p₁V₁/(γ−1))(r^(γ−1) − 1), p = p₁(V₁/V)^γ', -p1 * V1 ** gam * V ** (-gam), V, V1, V1 / r_, p1 * V1 * (r_ ** (gam - 1) - 1) / (gam - 1))
ident(D, 'W = nC_v(T₂ − T₁) = nRT₁(r^(γ−1) − 1)/(γ−1)', n_ * (R / (gam - 1)) * (T1 * r_ ** (gam - 1) - T1), n_ * R * T1 * (r_ ** (gam - 1) - 1) / (gam - 1))
# integración numérica independiente del proceso: dT/dV = −(R/Cv)T/V con dos γ
for gm in (1.4, 5 / 3, 1.1):
    s_ = solve_ivp(lambda Vv, y: [-(gm - 1) * y[0] / Vv], [1.0, 0.1], [300.0], rtol=1e-12, atol=1e-12)
    ref = 300 * 10 ** (gm - 1)
    rec(G_STEP, D, f'integración numérica de dT/dV (γ = {gm:.3f}): T₂ = T₁r^(γ−1)', float(s_.y[0, -1]), ref, 'rel 1e-9', abs(s_.y[0, -1] - ref) < 1e-9 * ref)
# trabajo por cuadratura (n = 1, V₁ = 1 m³ así p₁ = RT₁/V₁)
for gm in (1.4, 5 / 3):
    p1_ = Rg * 300.0
    Wq = -quad(lambda Vv: p1_ * (1.0 / Vv) ** gm, 1.0, 0.1, epsabs=1e-10, epsrel=1e-12)[0]
    ref = Rg * 300 * (10 ** (gm - 1) - 1) / (gm - 1)
    rec(G_STEP, D, f'cuadratura del trabajo −∫p dV (γ = {gm:.3f})', Wq, ref, 'rel 1e-9', abs(Wq - ref) < 1e-9 * ref)
uA = {'gam': '1', 'Cp': 'J mol^-1 K^-1', 'Cv': 'J mol^-1 K^-1', 'R': 'J mol^-1 K^-1', 'n': 'mol', 'T1': 'K', 'T2': 'K', 'p': 'Pa', 'V': 'm^3', 'r': '1', 'W': 'J'}
Wsym, Tsym, p2sym = S('W T2s p2s')
dimcheck(D, 'C_p = C_v + R', Cp, Cv + R, uA)
dimcheck(D, 'T₂ = T₁ r^(γ−1)', T2, T1 * r_ ** (gam - 1), uA)
dimcheck(D, 'W = nRT₁(r^(γ−1) − 1)/(γ − 1)', Wsym, n_ * R * T1 * (r_ ** (gam - 1) - 1) / (gam - 1), uA)
dimcheck(D, 'pV = nRT', p * V, n_ * R * T1, uA)
ad = lambda g_, T1_, r__: (T1_ * r__ ** (g_ - 1), r__ ** g_, Rg * T1_ * (r__ ** (g_ - 1) - 1) / (g_ - 1), Rg * T1_ * math.log(r__))
num(D, 'T₂ (aire, r = 10)', ad(1.4, 300, 10)[0], '753.6'); num(D, 'p₂/p₁', ad(1.4, 300, 10)[1], '25.12'); num(D, 'W (kJ/mol)', ad(1.4, 300, 10)[2] / 1e3, '9.428'); num(D, 'W isotérmico (kJ/mol)', ad(1.4, 300, 10)[3] / 1e3, '5.743')
num(D, 'T₂ (r = 20)', ad(1.4, 300, 20)[0], '994.3'); num(D, 'T₂ monoatómico', ad(5 / 3, 300, 10)[0], '1392.5'); num(D, 'p₂/p₁ monoatómico', ad(5 / 3, 300, 10)[1], '46.42'); num(D, 'T₂ (γ = 1.1)', ad(1.1, 300, 10)[0], '377.7')
num(D, 'T₂ (T₁ = 500 K)', ad(1.4, 500, 10)[0], '1255.9'); num(D, 'W (T₁ = 500) kJ/mol', ad(1.4, 500, 10)[2] / 1e3, '15.713'); num(D, 'T₂ (r = 2)', ad(1.4, 300, 2)[0], '395.9'); num(D, 'W (r = 2) kJ/mol', ad(1.4, 300, 2)[2] / 1e3, '1.992')
num(D, 'T₂ valor inicial', ad(1.4, 300, 10)[0], '753.566'); num(D, 'p₂/p₁ valor inicial', ad(1.4, 300, 10)[1], '25.1189'); num(D, 'W valor inicial', ad(1.4, 300, 10)[2], '9427.89'); num(D, 'W isotérmico valor inicial', ad(1.4, 300, 10)[3], '5743.43')
gq, T1q, rq = symbols('gam T1 r', positive=True)
fs(D, 'T2', T1q * rq ** (gq - 1)); fs(D, 'pr', rq ** gq); fs(D, 'W', Rq_ * T1q * (rq ** (gq - 1) - 1) / (gq - 1)); fs(D, 'Wi', Rq_ * T1q * log(rq))

# ---------------------------------------------------------------- Carnot
D = 'carnot'
Th, Tc, Qh, Qc, V3, V4, W_, eta = S('Th Tc Qh Qc V3 V4 W eta')
gm1 = gam - 1
V3s = V2 * (Th / Tc) ** (1 / gm1)
V4s = V1 * (Th / Tc) ** (1 / gm1)
ident(D, 'adiabática 2→3: T_h V₂^(γ−1) = T_c V₃^(γ−1)', Th * V2 ** gm1, Tc * V3s ** gm1)
ident(D, 'adiabática 4→1: T_h V₁^(γ−1) = T_c V₄^(γ−1)', Th * V1 ** gm1, Tc * V4s ** gm1)
ident(D, 'V₂/V₁ = V₃/V₄', V2 / V1, V3s / V4s)
ident(D, 'Q_c/Q_h = T_c ln(V₃/V₄)/(T_h ln(V₂/V₁)) = T_c/T_h', (n_ * R * Tc * log(V3s / V4s)) / (n_ * R * Th * log(V2 / V1)), Tc / Th)
ident(D, 'Q_h/T_h − Q_c/T_c = 0', n_ * R * log(V2 / V1) - n_ * R * log(V3s / V4s), 0)
solves(D, 'η = W/Q_h con W = Q_h − Q_c y Q_c = (T_c/T_h)Q_h', [Eq(eta, W_ / Qh), Eq(W_, Qh - Qc), Eq(Qc, Tc / Th * Qh)], eta, 1 - Tc / Th, vars=[eta, W_, Qc])
ident(D, 'COP del refrigerador inverso: Q_c/(Q_h − Q_c) = T_c/(T_h − T_c)', (Tc / Th * Qh) / (Qh - Tc / Th * Qh), Tc / (Th - Tc))
# ciclo completo calculado por cuadratura (1 mol, γ = 1.4, 500 K y 300 K, de 1 a 2 L)
g_ = 1.4; Th_, Tc_ = 500.0, 300.0; nV1, nV2 = 1.0, 2.0
nV3 = nV2 * (Th_ / Tc_) ** (1 / (g_ - 1)); nV4 = nV1 * (Th_ / Tc_) ** (1 / (g_ - 1))
pis = lambda Tt: (lambda Vv: Rg * Tt / Vv)
Q_iso_h = quad(pis(Th_), nV1, nV2)[0]
Q_iso_c = -quad(pis(Tc_), nV3, nV4)[0]
K2 = Rg * Th_ * nV2 ** (g_ - 1)
W23 = quad(lambda Vv: K2 * Vv ** (-g_), nV2, nV3)[0]
K4 = Rg * Tc_ * nV4 ** (g_ - 1)
W41 = quad(lambda Vv: Rg * Th_ * nV1 ** (g_ - 1) * Vv ** (-g_), nV4, nV1)[0]
Wcic = Q_iso_h + W23 - Q_iso_c + W41
rec(G_STEP, D, 'cuadratura del ciclo: V₂/V₁ = V₃/V₄', nV2 / nV1, nV3 / nV4, 'rel 1e-12', abs(nV2 / nV1 - nV3 / nV4) < 1e-12)
rec(G_STEP, D, 'cuadratura del ciclo: W neto = Q_h − Q_c', Wcic, Q_iso_h - Q_iso_c, 'rel 1e-8', abs(Wcic - (Q_iso_h - Q_iso_c)) < 1e-8 * Wcic)
rec(G_STEP, D, 'cuadratura del ciclo: η = W/Q_h = 1 − T_c/T_h', Wcic / Q_iso_h, 1 - Tc_ / Th_, 'rel 1e-8', abs(Wcic / Q_iso_h - 0.4) < 1e-8)
uC = {'eta': '1', 'Th': 'K', 'Tc': 'K', 'Qh': 'J', 'Qc': 'J', 'W': 'J', 'n': 'mol', 'R': 'J mol^-1 K^-1', 'V1': 'm^3', 'V2': 'm^3', 'COP': '1'}
COPs = Symbol('COP', positive=True)
dimcheck(D, 'η = 1 − T_c/T_h', eta, 1 - Tc / Th, uC)
dimcheck(D, 'Q_h = nRT_h ln(V₂/V₁)', Qh, n_ * R * Th * log(V2 / V1), uC)
dimcheck(D, 'COP = T_c/(T_h − T_c)', COPs, Tc / (Th - Tc), uC)
dimcheck(D, 'Q_h/T_h = Q_c/T_c (entropía por ciclo)', Symbol('S', positive=True), Qh / Th, dict(uC, S='J K^-1')) if False else None
ca = lambda Th_, Tc_, Qh_=1000.: (1 - Tc_ / Th_, (1 - Tc_ / Th_) * Qh_, Tc_ / Th_ * Qh_, Tc_ / (Th_ - Tc_))
num(D, 'η (500 K, 300 K)', ca(500, 300)[0], '0.4'); num(D, 'W (J)', ca(500, 300)[1], '400'); num(D, 'Q_c (J)', ca(500, 300)[2], '600'); num(D, 'η (600 K, 300 K)', ca(600, 300)[0], '0.5'); num(D, 'η (500 K, 250 K)', ca(500, 250)[0], '0.5')
num(D, 'η (central 540 °C, 30 °C)', ca(813.15, 303.15)[0], '0.6272'); num(D, 'η (100 °C, 20 °C) %', ca(373.15, 293.15)[0] * 100, '21.4'); num(D, 'COP (−20 °C, 30 °C)', ca(303.15, 253.15)[3], '5.063'); num(D, 'COP τ = 0.5', ca(600, 300)[3], '1.0'); num(D, 'COP valor inicial', ca(500, 300)[3], '1.5')
num(D, 'η Carnot 300–1800 K', ca(1800, 300)[0], '0.833', tol=1e-3); num(D, 'η valor inicial', ca(500, 300)[0], '0.40000'); num(D, 'T_c valor inicial', 500 * 0.6, '300.00')
Thq, tq, Qhq = symbols('Th tau Qh', positive=True)
fs(D, 'eta', 1 - tq); fs(D, 'W', (1 - tq) * Qhq); fs(D, 'Qc', tq * Qhq); fs(D, 'Tc', tq * Thq); fs(D, 'cop', tq / (1 - tq))

# ---------------------------------------------------------------- Otto
D = 'otto'
T3, T4, Qin, Qout = S('T3 T4 Qin Qout')
ident(D, 'T₂ = T₁ r^(γ−1) y T₁ = T₂ r^(1−γ)', T1 * r_ ** gm1 * r_ ** (1 - gam), T1)
ident(D, 'T₄ − T₁ = (T₃ − T₂) r^(1−γ)', T3 * r_ ** (1 - gam) - T1, (T3 - T1 * r_ ** gm1) * r_ ** (1 - gam))
ident(D, 'η = 1 − (T₄ − T₁)/(T₃ − T₂) = 1 − r^(1−γ)', 1 - ((T3 - T1 * r_ ** gm1) * r_ ** (1 - gam)) / (T3 - T1 * r_ ** gm1), 1 - r_ ** (1 - gam))
ident(D, 'η = 1 − 1/r^(γ−1)', 1 - r_ ** (1 - gam), 1 - 1 / r_ ** gm1)
ident(D, 'W = Q_in − Q_out = ηQ_in', n_ * Cv * (T3 - T1 * r_ ** gm1) - n_ * Cv * (T3 * r_ ** (1 - gam) - T1), (1 - r_ ** (1 - gam)) * n_ * Cv * (T3 - T1 * r_ ** gm1))
# cuadratura del ciclo (1 mol)
def otto_num(r, g, T1_, T3_):
    n1 = 1.0; V1_ = n1 * Rg * T1_ / 1e5
    V2_ = V1_ / r
    T2_ = T1_ * r ** (g - 1)
    T4_ = T3_ * r ** (1 - g)
    Cv_ = Rg / (g - 1)
    Q_in = Cv_ * (T3_ - T2_)
    W12 = -quad(lambda Vv: Rg * T1_ * V1_ ** (g - 1) * Vv ** (-g), V1_, V2_)[0]   # trabajo sobre el gas
    W34 = quad(lambda Vv: Rg * T3_ * V2_ ** (g - 1) * Vv ** (-g), V2_, V1_)[0]
    return W34 - W12, Q_in
for (r, g, T1_, T3_) in ((10, 1.4, 300.0, 1800.0), (8, 1.4, 300.0, 1800.0), (10, 1.3, 300.0, 1800.0)):
    Wn, Qn = otto_num(r, g, T1_, T3_)
    rec(G_STEP, D, f'cuadratura del ciclo Otto: W/Q_in = 1 − r^(1−γ) (r={r}, γ={g})', Wn / Qn, 1 - r ** (1 - g), 'rel 1e-9', abs(Wn / Qn - (1 - r ** (1 - g))) < 1e-9)
uO = {'eta': '1', 'r': '1', 'gam': '1', 'T1': 'K', 'T2': 'K', 'T3': 'K', 'T4': 'K', 'Qin': 'J', 'Qout': 'J', 'Cv': 'J mol^-1 K^-1', 'n': 'mol'}
dimcheck(D, 'η = 1 − r^(1−γ)', eta, 1 - r_ ** (1 - gam), uO)
dimcheck(D, 'T₄ = T₃ r^(1−γ)', T4, T3 * r_ ** (1 - gam), uO)
dimcheck(D, 'Q_in = nC_v(T₃ − T₂)', Qin, n_ * Cv * (T3 - T2), uO)
dimcheck(D, 'Q_out = nC_v(T₄ − T₁)', Qout, n_ * Cv * (T4 - T1), uO)
otf = lambda r, g, T1_, Tm: (1 - r ** (1 - g), T1_ * r ** (g - 1), Tm * r ** (1 - g), Rg / (g - 1) * (Tm - T1_ * r ** (g - 1)))
num(D, 'η (r = 10)', otf(10, 1.4, 300, 1800)[0], '0.6019'); num(D, 'T₂', otf(10, 1.4, 300, 1800)[1], '753.6'); num(D, 'T₄', otf(10, 1.4, 300, 1800)[2], '716.6'); num(D, 'Q_in (kJ/mol)', otf(10, 1.4, 300, 1800)[3] / 1e3, '21.751'); num(D, 'W (kJ/mol)', otf(10, 1.4, 300, 1800)[0] * otf(10, 1.4, 300, 1800)[3] / 1e3, '13.092')
num(D, 'η (r = 8)', otf(8, 1.4, 300, 1800)[0], '0.5647'); num(D, 'η (r = 12)', otf(12, 1.4, 300, 1800)[0], '0.6299'); num(D, 'W (T₃ = 2200) kJ/mol', otf(10, 1.4, 300, 2200)[0] * otf(10, 1.4, 300, 2200)[3] / 1e3, '18.096'); num(D, 'η (γ = 1.3)', otf(10, 1.3, 300, 1800)[0], '0.4988')
num(D, 'η valor inicial', otf(10, 1.4, 300, 1800)[0], '0.601893'); num(D, 'T₂ valor inicial', otf(10, 1.4, 300, 1800)[1], '753.566'); num(D, 'T₄ valor inicial', otf(10, 1.4, 300, 1800)[2], '716.593'); num(D, 'Q_in valor inicial', otf(10, 1.4, 300, 1800)[3], '21751.3'); num(D, 'W valor inicial', otf(10, 1.4, 300, 1800)[0] * otf(10, 1.4, 300, 1800)[3], '13092.0')
Tmq = symbols('Tm', positive=True)
Cvq = Rq_ / (gq - 1)
fs(D, 'eta', 1 - rq ** (1 - gq)); fs(D, 'T2', T1q * rq ** (gq - 1)); fs(D, 'T4', Tmq * rq ** (1 - gq)); fs(D, 'Qin', Cvq * (Tmq - T1q * rq ** (gq - 1))); fs(D, 'W', (1 - rq ** (1 - gq)) * Cvq * (Tmq - T1q * rq ** (gq - 1)))

# ---------------------------------------------------------------- entropía del gas ideal
D = 'entropia-gas'
f_, dS, Tr, Vr, p2, Cp_ = S('f dS Tr Vr p2 Cp')
Tt, Vv = symbols('Tt Vv', positive=True)
integral(D, '∫ nC_v dT/T = nC_v ln(T₂/T₁)', n_ * Cv / Tt, Tt, T1, T2, n_ * Cv * log(T2 / T1))
integral(D, '∫ nR dV/V = nR ln(V₂/V₁)', n_ * R / Vv, Vv, V1, V2, n_ * R * log(V2 / V1))
ident(D, 'dS = (nC_v dT + p dV)/T con p = nRT/V', (n_ * Cv * dT + (n_ * R * T / V) * dV) / T, n_ * Cv * dT / T + n_ * R * dV / V)
Cvf = f_ / 2 * R
ident(D, 'C_p = C_v + R = (f/2 + 1)R', Cvf + R, (f_ / 2 + 1) * R)
ident(D, 'forma (T, p): nC_v ln τ + nR ln v = nC_p ln τ − nR ln(p₂/p₁), con p₂/p₁ = τ/v', n_ * Cvf * log(Tr) + n_ * R * log(Vr), n_ * (Cvf + R) * log(Tr) - n_ * R * log(Tr / Vr))
ident(D, 'V₂/V₁ = (T₂/T₁)(p₁/p₂) ⇒ ln(V₂/V₁) = ln(T₂/T₁) − ln(p₂/p₁)', log(Tr / (Tr / Vr)), log(Vr))
ident(D, 'S es función de estado: camino isócoro+isotermo = isotermo+isócoro', n_ * Cvf * log(Tr) + n_ * R * log(Vr), n_ * R * log(Vr) + n_ * Cvf * log(Tr))
ident(D, 'expansión libre: ΔS = nR ln(V₂/V₁) con T₂ = T₁', (n_ * Cvf * log(Tr) + n_ * R * log(Vr)).subs(Tr, 1), n_ * R * log(Vr))
# cuadratura independiente de ΔS por la ruta reversible T(s), V(s)
for (f, n, tr, vr) in ((3, 1, 2, 2), (5, 1, 2, 2), (3, 2, 2, 2)):
    # δQ_rev = nCv dT + p dV a lo largo de T = T1·tr^s, V = V1·vr^s; integrar δQ/T
    T1_ = 300.0; V1_ = 0.0249
    Tq_ = lambda s: T1_ * tr ** s; Vq_ = lambda s: V1_ * vr ** s
    dTds = lambda s: T1_ * tr ** s * math.log(tr); dVds = lambda s: V1_ * vr ** s * math.log(vr)
    val = quad(lambda s: (n * f / 2 * Rg * dTds(s) + (n * Rg * Tq_(s) / Vq_(s)) * dVds(s)) / Tq_(s), 0, 1, epsabs=1e-12, epsrel=1e-12)[0]
    ref = n * f / 2 * Rg * math.log(tr) + n * Rg * math.log(vr)
    rec(G_STEP, D, f'cuadratura de ∫δQ_rev/T (f = {f}, n = {n})', val, ref, 'rel 1e-10', abs(val - ref) < 1e-10 * abs(ref))
uE = {'dS': 'J K^-1', 'n': 'mol', 'Cv': 'J mol^-1 K^-1', 'Cp': 'J mol^-1 K^-1', 'R': 'J mol^-1 K^-1', 'T1': 'K', 'T2': 'K', 'V1': 'm^3', 'V2': 'm^3', 'f': '1', 'p2': 'Pa', 'p1': 'Pa'}
dimcheck(D, 'ΔS = nC_v ln(T₂/T₁) + nR ln(V₂/V₁)', dS, n_ * Cv * log(T2 / T1) + n_ * R * log(V2 / V1), uE)
dimcheck(D, 'ΔS = nC_p ln(T₂/T₁) − nR ln(p₂/p₁)', dS, n_ * Cp * log(T2 / T1) - n_ * R * log(p2 / p1), uE)
dimcheck(D, 'C_v = (f/2)R', Cv, f_ / 2 * R, uE)
enf = lambda f, n, tr, vr: (n * f / 2 * Rg * math.log(tr) + n * Rg * math.log(vr), n * f / 2 * Rg * math.log(tr), n * Rg * math.log(vr))
num(D, 'ΔS (f = 3)', enf(3, 1, 2, 2)[0], '14.408'); num(D, 'parte térmica', enf(3, 1, 2, 2)[1], '8.645'); num(D, 'parte de volumen', enf(3, 1, 2, 2)[2], '5.763'); num(D, 'ΔS (f = 5)', enf(5, 1, 2, 2)[0], '20.171')
num(D, 'R ln 2', Rg * math.log(2), '5.763'); num(D, 'ΔS (n = 2)', enf(3, 2, 2, 2)[0], '28.816'); num(D, 'R ln 10', Rg * math.log(10), '19.145'); num(D, 'compresión a la mitad', Rg * math.log(0.5), '-5.763')
num(D, 'ΔS valor inicial', enf(3, 1, 2, 2)[0], '14.4079'); num(D, 'parte térmica valor inicial', enf(3, 1, 2, 2)[1], '8.64472'); num(D, 'parte de volumen valor inicial', enf(3, 1, 2, 2)[2], '5.76315')
fq, nq, Trq, Vrq = symbols('f n Tr Vr', positive=True)
fs(D, 'dS', nq * (fq / 2) * Rq_ * log(Trq) + nq * Rq_ * log(Vrq)); fs(D, 'dST', nq * (fq / 2) * Rq_ * log(Trq)); fs(D, 'dSV', nq * Rq_ * log(Vrq)); fs(D, 'dSp', nq * (fq / 2 + 1) * Rq_ * log(Trq) - nq * Rq_ * log(Trq / Vrq))

# ---------------------------------------------------------------- van der Waals
D = 'vdw-critico'
a_, b_, Vc_, Tc_s, pc_, Tt2 = S('a b Vc Tc pc Tt2')
Vs = Symbol('V', positive=True)
pvdw = R * T / (Vs - b_) - a_ / Vs ** 2
d1 = diff(pvdw, Vs); d2 = diff(pvdw, Vs, 2)
ident(D, '∂p/∂V = −RT/(V−b)² + 2a/V³', d1, -R * T / (Vs - b_) ** 2 + 2 * a_ / Vs ** 3)
ident(D, '∂²p/∂V² = 2RT/(V−b)³ − 6a/V⁴', d2, 2 * R * T / (Vs - b_) ** 3 - 6 * a_ / Vs ** 4)
ident(D, 'RT de la 1.ª: 2a(V−b)²/V³ anula ∂p/∂V', d1.subs(T, 2 * a_ * (Vs - b_) ** 2 / (R * Vs ** 3)), 0)
ident(D, 'RT de la 2.ª: 3a(V−b)³/V⁴ anula ∂²p/∂V²', d2.subs(T, 3 * a_ * (Vs - b_) ** 3 / (R * Vs ** 4)), 0)
solves(D, '2(V−b)²/V³ = 3(V−b)³/V⁴ ⇒ V_c = 3b', [Eq(2 * (Vs - b_) ** 2 / Vs ** 3, 3 * (Vs - b_) ** 3 / Vs ** 4)], Vs, 3 * b_)
sol = solve([d1, d2], [Vs, T], dict=True)
ok_sol = any(same(s_[Vs], 3 * b_)[0] and same(s_[T], 8 * a_ / (27 * R * b_))[0] for s_ in sol)
rec(G_STEP, D, 'sistema ∂p/∂V = ∂²p/∂V² = 0: (V_c, T_c) = (3b, 8a/27Rb)', 1.0 if ok_sol else 0.0, 1.0, 'solución exacta', ok_sol)
ident(D, 'T_c = 8a/(27Rb)', 2 * a_ * (2 * b_) ** 2 / (R * (3 * b_) ** 3), 8 * a_ / (27 * R * b_))
ident(D, 'p_c = a/(27b²)', pvdw.subs({Vs: 3 * b_, T: 8 * a_ / (27 * R * b_)}), a_ / (27 * b_ ** 2))
ident(D, 'Z_c = p_c V_c/(RT_c) = 3/8', (a_ / (27 * b_ ** 2)) * (3 * b_) / (R * (8 * a_ / (27 * R * b_))), R_(3, 8))
pi_, ph_, ta_ = S('pi_ ph_ ta_')
Pr = pvdw.subs({Vs: 3 * b_ * ph_, T: 8 * a_ / (27 * R * b_) * ta_}) / (a_ / (27 * b_ ** 2))
ident(D, 'ecuación reducida: (π + 3/φ²)(3φ − 1) = 8τ', (Pr + 3 / ph_ ** 2) * (3 * ph_ - 1) - 8 * ta_, 0)
u_ = Symbol('u', positive=True)
series_is(D, 'p(u = 1/V) = RT u + (RTb − a)u² + ...', R * T * u_ / (1 - b_ * u_) - a_ * u_ ** 2, u_, 0, 3, R * T * u_ + (R * T * b_ - a_) * u_ ** 2)
solves(D, 'B(T) = b − a/(RT) = 0 ⇒ T_B = a/(Rb)', [Eq(b_ - a_ / (R * T), 0)], T, a_ / (R * b_))
ident(D, 'T_B/T_c = 27/8', (a_ / (R * b_)) / (8 * a_ / (27 * R * b_)), R_(27, 8))
# resolución numérica independiente del punto crítico (CO₂) con mpmath
mp.mp.dps = 30
aN, bN = mp.mpf('3.640'), mp.mpf('0.04267')
Rm = mp.mpf('0.08314462618')
fT = lambda V, T: -Rm * T / (V - bN) ** 2 + 2 * aN / V ** 3
fT2 = lambda V, T: 2 * Rm * T / (V - bN) ** 3 - 6 * aN / V ** 4
rt = mp.findroot(lambda V, T: [fT(V, T), fT2(V, T)], (mp.mpf('0.13'), mp.mpf('300')))
Vn, Tn = float(rt[0]), float(rt[1])
pn = float(Rm * Tn / (Vn - bN) - aN / Vn ** 2)
rec(G_STEP, D, 'raíz numérica (CO₂): V_c = 3b', Vn, 3 * 0.04267, 'rel 1e-12', abs(Vn - 3 * 0.04267) < 1e-12 * Vn)
rec(G_STEP, D, 'raíz numérica (CO₂): T_c = 8a/27Rb', Tn, 8 * 3.640 / (27 * RL * 0.04267), 'rel 1e-12', abs(Tn - 8 * 3.640 / (27 * RL * 0.04267)) < 1e-12 * Tn)
rec(G_STEP, D, 'raíz numérica (CO₂): p_c = a/27b²', pn, 3.640 / (27 * 0.04267 ** 2), 'rel 1e-12', abs(pn - 3.640 / (27 * 0.04267 ** 2)) < 1e-12 * pn)
uV = {'a': 'Pa m^6 mol^-2', 'b': 'm^3 mol^-1', 'Tc': 'K', 'pc': 'Pa', 'Vc': 'm^3 mol^-1', 'R': 'J mol^-1 K^-1', 'T': 'K', 'Z': '1', 'V': 'm^3 mol^-1', 'p': 'Pa'}
dimcheck(D, 'T_c = 8a/(27Rb)', Tc_s, 8 * a_ / (27 * R * b_), uV)
dimcheck(D, 'p_c = a/(27b²)', pc_, a_ / (27 * b_ ** 2), uV)
dimcheck(D, 'V_c = 3b', Vc_, 3 * b_, uV)
dimcheck(D, 'p = RT/(V − b) − a/V²', p, pvdw, uV)
dimcheck(D, 'T_B = a/(Rb)', T, a_ / (R * b_), uV)
dimcheck(D, 'Z_c = p_cV_c/(RT_c)', Symbol('Z', positive=True), pc_ * Vc_ / (R * Tc_s), uV)
vd = lambda a, b: (8 * a / (27 * RL * b), a / (27 * b ** 2), 3 * b, a / (RL * b), 3 / 8)
num(D, 'T_c (CO₂)', vd(3.640, 0.04267)[0], '304.0'); num(D, 'p_c (CO₂, bar)', vd(3.640, 0.04267)[1], '74.04'); num(D, 'V_c (CO₂, L/mol)', vd(3.640, 0.04267)[2], '0.1280'); num(D, 'T_c (N₂)', vd(1.370, 0.0387)[0], '126.15'); num(D, 'p_c (N₂)', vd(1.370, 0.0387)[1], '33.88')
num(D, 'T_B (CO₂)', vd(3.640, 0.04267)[3], '1026'); num(D, 'T_B/T_c', vd(3.640, 0.04267)[3] / vd(3.640, 0.04267)[0], '3.375'); num(D, 'p_c/4 con b doble', vd(3.640, 0.08534)[1] / vd(3.640, 0.04267)[1], '0.25'); num(D, 'T_c/2 con b doble', vd(3.640, 0.08534)[0] / vd(3.640, 0.04267)[0], '0.5')
num(D, 'T_c valor inicial', vd(3.640, 0.04267)[0], '303.998'); num(D, 'p_c valor inicial', vd(3.640, 0.04267)[1], '74.0444'); num(D, 'V_c valor inicial', vd(3.640, 0.04267)[2], '0.12801'); num(D, 'T_B valor inicial', vd(3.640, 0.04267)[3], '1025.99'); num(D, 'Z_c', 3 / 8, '0.375')
aq, bq = symbols('a b', positive=True)
fs(D, 'Tc', 8 * aq / (27 * RLq * bq)); fs(D, 'pc', aq / (27 * bq ** 2)); fs(D, 'Vc', 3 * bq); fs(D, 'TB', aq / (RLq * bq)); fs(D, 'Zc', (aq / (27 * bq ** 2)) * (3 * bq) / (RLq * 8 * aq / (27 * RLq * bq)))
