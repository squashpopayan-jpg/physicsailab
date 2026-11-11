# -*- coding: utf-8 -*-
"""Capítulo 1 — Análisis dimensional y escalamiento (pasos, dimensiones, explorador y cifras del texto)."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, elliptic_k, sin, exp, limit, oo, diff, simplify, Function

D = 'pendulo-pi'
T_, L_, g_, th_, m_ = S('T L g th m')
buckingham(D, 'Péndulo', {'T': 's', 'L': 'm', 'm': 'kg', 'g': 'm s^-2'}, [{'T': 2, 'L': -1, 'g': 1}])
a, b, c, d = symbols('a b c d')
solves(D, 'exponentes del grupo (d = 1)', [c, b + d, a - 2 * d, Eq(d, 1)], a, 2, vars=[a, b, c, d])
F_ = 4 * elliptic_k(sin(th_ / 2) ** 2)
series_is(D, 'F(θ0)/(2π) hasta θ0⁴', F_ / (2 * pi), th_, 0, 6, 1 + th_ ** 2 / 16 + 11 * th_ ** 4 / 3072)
dimcheck(D, 'T = √(L/g)·F(θ0)', T_, sqrt(L_ / g_) * F_, {'T': 's', 'L': 'm', 'g': 'm s^-2', 'th': 'rad'})
dimcheck(D, 'T0 = 2π√(L/g)', T_, 2 * pi * sqrt(L_ / g_), {'T': 's', 'L': 'm', 'g': 'm s^-2'})
fp = lambda L, g, th: float((4 * sqrt(sp.Float(L) / g) * elliptic_k(sin(sp.Float(th) * pi / 360) ** 2)).evalf(20))
Fn = lambda th: float((4 * elliptic_k(sin(sp.Float(th) * pi / 360) ** 2)).evalf(20))
num(D, 'T0 (L = 1 m, g = 9.81)', 2 * math.pi * math.sqrt(1 / 9.81), '2.006')
num(D, 'T(10°)', fp(1, 9.81, 10), '2.010')
num(D, 'F(10°)', Fn(10), '6.2952')
num(D, 'T(60°)', fp(1, 9.81, 60), '2.153')
num(D, 'F(60°)', Fn(60), '6.7430')
for th, v in ((10, '1.002'), (30, '1.017'), (60, '1.073'), (90, '1.180'), (170, '2.44')):
    num(D, f'F/2π a {th}°', Fn(th) / (2 * math.pi), v)
num(D, 'T0 en la Luna', 2 * math.pi * math.sqrt(1 / 1.62), '4.94')
num(D, 'cociente de g Tierra/Luna', math.sqrt(9.81 / 1.62), '2.46')
Lp, gp, thp = symbols('L g th', positive=True)
fsim(D, 'T', 4 * sqrt(Lp / gp) * elliptic_k(sin(thp / 2) ** 2), conv=lambda p: dict(L=p['L'], g=p['g'], th=math.radians(p['th'])))
fsim(D, 'T0', 2 * pi * sqrt(Lp / gp), conv=lambda p: dict(L=p['L'], g=p['g']))
fsim(D, 'F', 4 * elliptic_k(sin(thp / 2) ** 2), conv=lambda p: dict(L=p['L'], g=p['g'], th=math.radians(p['th'])))

# ---------------------------------------------------------------- Sedov
D = 'sedov'
R, E, rho, t, xi = S('R E rho t xi')
buckingham(D, 'Explosión', {'R': 'm', 'E': 'kg m^2 s^-2', 'rho': 'kg m^-3', 't': 's'}, [{'R': -5, 'E': 1, 'rho': -1, 't': 2}])
a, b, c, d = symbols('a b c d')
solves(D, 'exponentes (b = 1)', [b + c, a + 2 * b - 3 * c, -2 * b + d, Eq(b, 1)], a, -5, vars=[a, b, c, d])
Rf = xi * (E * t ** 2 / rho) ** R_(1, 5)
ident(D, 'Π = Et²/(ρR⁵) = ξ⁻⁵ con R = ξ(Et²/ρ)^(1/5)', E * t ** 2 / (rho * Rf ** 5), xi ** -5)
deriv_is(D, 'velocidad del frente', Rf, t, 2 * Rf / (5 * t))
ident(D, 'inversión E = ρR⁵/(ξ⁵t²)', Rf.subs(E, rho * R ** 5 / (xi ** 5 * t ** 2)), R)
dimcheck(D, 'R = ξ (Et²/ρ)^(1/5)', R, Rf, {'R': 'm', 'E': 'kg m^2 s^-2', 'rho': 'kg m^-3', 't': 's', 'xi': '1'})
Rn = lambda E, rho, t, xi=1.033: xi * (E * t * t / rho) ** 0.2
num(D, 'R(10 kt, 10 ms)', Rn(4.184e13, 1.2, 0.01), '83.7')
num(D, 'R(10 kt, 50 ms)', Rn(4.184e13, 1.2, 0.05), '159.3')
num(D, 'R(10 kt, 200 ms)', Rn(4.184e13, 1.2, 0.2), '277.3')
num(D, 'velocidad del frente a 50 ms', 0.4 * Rn(4.184e13, 1.2, 0.05) / 0.05, '1274')
num(D, 'velocidad del frente a 10 ms', 0.4 * Rn(4.184e13, 1.2, 0.01) / 0.01, '3347')
num(D, 'velocidad del frente a 200 ms', 0.4 * Rn(4.184e13, 1.2, 0.2) / 0.2, '555')
num(D, 'E por inversión (R = 100 m, 16 ms)', 1.2 * 100 ** 5 / (1.033 ** 5 * 0.016 ** 2) / 1e13, '3.99')
num(D, 'E en kt', 1.2 * 100 ** 5 / (1.033 ** 5 * 0.016 ** 2) / 4.184e12, '9.5')
num(D, '2^(1/5)', 2 ** 0.2, '1.149'); num(D, '2^(2/5)', 2 ** 0.4, '1.320'); num(D, '2^(-1/5)', 2 ** -0.2, '0.871')
num(D, 'R con ρ = 0.01', Rn(4.184e13, 0.01, 0.05), '415.0')
num(D, 'cociente 120^(1/5)', 120 ** 0.2, '2.605')
num(D, 'R(1 kJ, 1 ms)', Rn(1e3, 1.2, 1e-3), '0.25')
Ep, rp, tp, xp = symbols('E rho t xi', positive=True)
fsim(D, 'R', xp * (Ep * tp ** 2 / rp) ** R_(1, 5))
fsim(D, 'u', R_(2, 5) * xp * (Ep * tp ** 2 / rp) ** R_(1, 5) / tp)

# ---------------------------------------------------------------- Planck
D = 'planck'
hb, G, c_ = S('hbar G c')
a, b, d = symbols('a b d')
for nm, rhs, sol in (('longitud', (0, 1, 0), (R_(1, 2), R_(1, 2), -R_(3, 2))), ('tiempo', (0, 0, 1), (R_(1, 2), R_(1, 2), -R_(5, 2))), ('masa', (1, 0, 0), (R_(1, 2), -R_(1, 2), R_(1, 2)))):
    eqs = [a - b - rhs[0], 2 * a + 3 * b + d - rhs[1], -a - 2 * b - d - rhs[2]]
    s = sp.solve(eqs, [a, b, d], dict=True)[0]
    ok = (s[a], s[b], s[d]) == sol
    rec(G_STEP, D, f'exponentes de la {nm}: ħ^{sol[0]} G^{sol[1]} c^{sol[2]}', 1.0 if ok else 0.0, 1.0, 'solución exacta', ok)
lP = sqrt(hb * G / c_ ** 3); tP = sqrt(hb * G / c_ ** 5); mP = sqrt(hb * c_ / G)
ident(D, 't_P = ℓ_P/c', tP, lP / c_)
ident(D, 'm_P = ħ/(ℓ_P c)', mP, hb / (lP * c_))
u3 = {'hbar': 'kg m^2 s^-1', 'G': 'kg^-1 m^3 s^-2', 'c': 'm s^-1'}
dimcheck(D, 'ℓ_P es una longitud', Symbol('l_P', positive=True), lP, dict(u3, l_P='m'))
dimcheck(D, 't_P es un tiempo', Symbol('t_P', positive=True), tP, dict(u3, t_P='s'))
dimcheck(D, 'm_P es una masa', Symbol('m_P', positive=True), mP, dict(u3, m_P='kg'))
HB, GG, CC = 1.054571817e-34, 6.6743e-11, 299792458.0
num(D, 'ℓ_P (10⁻³⁵ m)', math.sqrt(HB * GG / CC ** 3) / 1e-35, '1.6163')
num(D, 't_P (10⁻⁴⁴ s)', math.sqrt(HB * GG / CC ** 5) / 1e-44, '5.3912')
num(D, 'm_P (10⁻⁸ kg)', math.sqrt(HB * CC / GG) / 1e-8, '2.1764')
num(D, '2^(-3/2)', 2 ** -1.5, '0.354'); num(D, '2^(-5/2)', 2 ** -2.5, '0.177')
num(D, 'm_P en µg', math.sqrt(HB * CC / GG) * 1e9, '21.8')
num(D, 'radio del protón / ℓ_P (10¹⁹)', 0.8414e-15 / math.sqrt(HB * GG / CC ** 3) / 1e19, '5.2', tol=0.1)
kG, kh, kc = symbols('kG kh kc', positive=True)
fsim(D, 'lP', sqrt(kh * HB * kG * GG / (kc * CC) ** 3))
fsim(D, 'tP', sqrt(kh * HB * kG * GG / (kc * CC) ** 5))
fsim(D, 'mP', sqrt(kh * HB * kc * CC / (kG * GG)))

# ---------------------------------------------------------------- Ondas en agua
D = 'ondas-agua'
v, lam, g, sig, rho = S('v lam g sigma rho')
buckingham(D, 'Ondas', {'v': 'm s^-1', 'lam': 'm', 'g': 'm s^-2', 'sigma': 'kg s^-2', 'rho': 'kg m^-3'},
           [{'v': 2, 'lam': -1, 'g': -1}, {'sigma': 1, 'rho': -1, 'g': -1, 'lam': -2}])
a, b, c = symbols('a b c')
s = sp.solve([1 + c, a + b - 3 * c, -2 - 2 * b], [a, b, c], dict=True)[0]
rec(G_STEP, D, 'exponentes de Π₂ = σλᵃgᵇρᶜ: (−2, −1, −1)', 1.0 if (s[a], s[b], s[c]) == (-2, -1, -1) else 0.0, 1.0, 'solución exacta', (s[a], s[b], s[c]) == (-2, -1, -1))
v2 = g * lam / (2 * pi) + 2 * pi * sig / (rho * lam)
Pi2 = sig / (rho * g * lam ** 2)
ident(D, 'v² = gλ Φ(Π₂) con Φ = 1/2π + 2π Π₂', g * lam * (1 / (2 * pi) + 2 * pi * Pi2), v2)
lm = Symbol('lm', positive=True)
solves(D, 'λₘ de d(v²)/dλ = 0', [Eq(diff(v2, lam), 0)], lam, 2 * pi * sqrt(sig / (rho * g)))
lmv = 2 * pi * sqrt(sig / (rho * g))
ident(D, 'v²(λₘ) = 2√(gσ/ρ)', v2.subs(lam, lmv), 2 * sqrt(g * sig / rho))
ident(D, 'vₘᵢₙ⁴ = 4gσ/ρ', (2 * sqrt(g * sig / rho)) ** 2, 4 * g * sig / rho)
ident(D, 'términos iguales en el mínimo', (g * lam / (2 * pi)).subs(lam, lmv), (2 * pi * sig / (rho * lam)).subs(lam, lmv))
uu = {'v': 'm s^-1', 'lam': 'm', 'g': 'm s^-2', 'sigma': 'kg s^-2', 'rho': 'kg m^-3'}
dimcheck(D, 'v² = gλ/2π + 2πσ/(ρλ)', v ** 2, v2, uu)
dimcheck(D, 'λₘ', lam, lmv, uu)
dimcheck(D, 'vₘᵢₙ', v, (4 * g * sig / rho) ** R_(1, 4), uu)
vw = lambda lam, g=9.81, s=0.0728, r=998: math.sqrt(g * lam / (2 * math.pi) + 2 * math.pi * s / (r * lam))
num(D, 'longitud capilar (mm)', math.sqrt(0.0728 / (998 * 9.81)) * 1e3, '2.73', tol=2e-3)
num(D, 'λₘ (cm)', 2 * math.pi * math.sqrt(0.0728 / (998 * 9.81)) * 1e2, '1.71')
num(D, 'vₘᵢₙ (cm/s)', (4 * 9.81 * 0.0728 / 998) ** 0.25 * 100, '23.1')
num(D, 'v(10 cm) (cm/s)', vw(0.1) * 100, '40.1')
num(D, 'v(1 m)', vw(1), '1.250')
num(D, 'v(10 m)', vw(10), '3.951')
num(D, 'v(5 mm) (cm/s)', vw(0.005) * 100, '31.5')
num(D, 'λₘ en la Luna (cm)', 2 * math.pi * math.sqrt(0.0728 / (998 * 1.62)) * 1e2, '4.22')
num(D, 'λₘ con σ = 0.01 (mm)', 2 * math.pi * math.sqrt(0.01 / (998 * 9.81)) * 1e3, '6.4')
num(D, 'v(0.1 m) valor inicial', vw(0.1), '0.4009')
num(D, 'λₘ (cm) valor inicial', 2 * math.pi * math.sqrt(0.0728 / (998 * 9.81)) * 1e2, '1.713')
num(D, 'vₘᵢₙ valor inicial', (4 * 9.81 * 0.0728 / 998) ** 0.25, '0.2313')
ev = lambda e, **k: float(e.subs({Symbol(a_, positive=True): b_ for a_, b_ in k.items()}))
nsig = lambda lamv: float((sig * diff(sp.sqrt(v2), sig) / sp.sqrt(v2)).subs({lam: lamv, g: 9.81, sig: 0.0728, rho: 998}))
ng = lambda lamv: float((g * diff(sp.sqrt(v2), g) / sp.sqrt(v2)).subs({lam: lamv, g: 9.81, sig: 0.0728, rho: 998}))
num(D, 'n_σ en λ = 5 mm', nsig(0.005), '0.461'); num(D, 'n_g en λ = 5 mm', ng(0.005), '0.039')
rec(G_NUM, D, 'n_g ≈ 0.5 en λ = 10 m', ng(10.0), 0.5, 'rel 1e-3', abs(ng(10.0) - 0.5) < 5e-4)
lamp, gp, sp_, rp = symbols('lam g sig rho', positive=True)
v2p = gp * lamp / (2 * pi) + 2 * pi * sp_ / (rp * lamp)
fsim(D, 'v', sqrt(v2p), conv=lambda p: dict(lam=p['lam'], g=p['g'], sig=p['sig'], rho=p['rho']))
fsim(D, 'lc', 2 * pi * sqrt(sp_ / (rp * gp)), conv=lambda p: dict(g=p['g'], sig=p['sig'], rho=p['rho']))
fsim(D, 'vmin', (4 * gp * sp_ / rp) ** R_(1, 4), conv=lambda p: dict(g=p['g'], sig=p['sig'], rho=p['rho']))
fsim(D, 'P1', v2p / (gp * lamp), conv=lambda p: dict(lam=p['lam'], g=p['g'], sig=p['sig'], rho=p['rho']))

# ---------------------------------------------------------------- Arrastre
D = 'arrastre'
F, d_, v, rho, eta, Re = S('F d v rho eta Re')
buckingham(D, 'Arrastre', {'F': 'N', 'd': 'm', 'v': 'm s^-1', 'rho': 'kg m^-3', 'eta': 'Pa s'},
           [{'F': 1, 'rho': -1, 'v': -2, 'd': -2}, {'rho': 1, 'v': 1, 'd': 1, 'eta': -1}])
a, b, c = symbols('a b c')
s = sp.solve([1 + c, 1 + a + b - 3 * c, -2 - b], [a, b, c], dict=True)[0]
rec(G_STEP, D, 'exponentes de Π₁ (d, v, ρ) = (−2, −2, −1)', 1.0 if (s[a], s[b], s[c]) == (-2, -2, -1) else 0.0, 1.0, 'solución exacta', (s[a], s[b], s[c]) == (-2, -2, -1))
Cc = symbols('C', positive=True)
ident(D, 'Stokes: ρ se cancela', rho * v ** 2 * d_ ** 2 * Cc / (rho * v * d_ / eta), Cc * eta * v * d_)
ident(D, 'Newton: F = ½ C_D ρ v² (πd²/4) = (π/8) C_D ρ v² d²', R_(1, 2) * Symbol('CD') * rho * v ** 2 * pi * d_ ** 2 / 4, pi / 8 * Symbol('CD') * rho * v ** 2 * d_ ** 2)
x = Symbol('x', positive=True)
CDx = (24 / x) * (1 + R_(27, 100) * x) ** R_(43, 100) + R_(47, 100) * (1 - exp(-R_(4, 100) * x ** R_(38, 100)))
rec(G_STEP, D, 'límite Re→0: C_D·Re/24 → 1 (Stokes)', float(limit(CDx * x / 24, x, 0)), 1.0, 'exacto', limit(CDx * x / 24, x, 0) == 1)
rec(G_STEP, D, 'límite Re→∞: C_D → 0.47 (Newton)', float(limit(CDx, x, oo)), 0.47, 'exacto', limit(CDx, x, oo) == R_(47, 100))
Fexp = CDx.subs(x, rho * v * d_ / eta) * pi / 8 * rho * v ** 2 * d_ ** 2
dimcheck(D, 'F = C_D(Re)(π/8)ρv²d²', F, Fexp, {'F': 'N', 'd': 'm', 'v': 'm s^-1', 'rho': 'kg m^-3', 'eta': 'Pa s'})
dimcheck(D, 'F_Stokes = 3πηvd', F, 3 * pi * eta * v * d_, {'F': 'N', 'd': 'm', 'v': 'm s^-1', 'eta': 'Pa s'})
dimcheck(D, 'Re = ρvd/η', Re, rho * v * d_ / eta, {'Re': '1', 'd': 'm', 'v': 'm s^-1', 'rho': 'kg m^-3', 'eta': 'Pa s'})
CDn = lambda Re: float(CDx.subs(x, Re).evalf(20))
Fn_ = lambda v_, d_v=0.01, r_=1.2, e_=1.81e-5: CDn(r_ * v_ * d_v / e_) * math.pi / 8 * r_ * v_ ** 2 * d_v ** 2
nv = lambda v_: float((v * diff(Fexp, v) / Fexp).subs({d_: 0.01, v: v_, rho: 1.2, eta: 1.81e-5}).evalf(20))
num(D, 'n_v en Re = 663', nv(1.0), '1.727')
num(D, 'n_v en Re = 6630', nv(10.0), '2.03')
num(D, 'n_v en Stokes (Re = 0.007)', float((v * diff(Fexp, v) / Fexp).subs({d_: 1e-5, v: 0.01, rho: 1.2, eta: 1.81e-5}).evalf(20)), '1.00')
num(D, 'Re (1 cm, 1 m/s)', 1.2 * 1 * 0.01 / 1.81e-5, '663', tol=1e-3)
num(D, 'C_D (Re = 663)', CDn(662.98), '0.515')
num(D, 'Re (1 cm, 10 m/s)', 1.2 * 10 * 0.01 / 1.81e-5, '6630', tol=1e-3)
num(D, 'C_D (Re = 6630)', CDn(6629.83), '0.409')
num(D, 'F (1 cm, 10 m/s) en mN', Fn_(10.0) * 1e3, '1.93')
num(D, 'C_D(1)', CDn(1.0), '26.6')
num(D, 'C_D(1)/24 − 1 (%)', (CDn(1.0) / 24 - 1) * 100, '10.9')
num(D, 'F del agua d = 0.1 mm, v = 10 mm/s (nN)', CDn(1.0) * math.pi / 8 * 1000 * 1e-4 * 1e-8 * 1e9, '10.45')
num(D, 'F de Stokes (nN)', 3 * math.pi * 1e-3 * 0.01 * 1e-4 * 1e9, '9.42')
num(D, 'F/F_Stokes − 1 (niebla, 10 µm, 1 cm/s) en %', (CDn(1.2 * 0.01 * 1e-5 / 1.81e-5) * (1.2 * 0.01 * 1e-5 / 1.81e-5) / 24 - 1) * 100, '0.08')
neta = float((eta * diff(Fexp, eta) / Fexp).subs({d_: 0.01, v: 10, rho: 1.2, eta: 1.81e-5}).evalf(20))
num(D, 'n_η en Re = 6630', neta, '-0.033')
num(D, 'F(2η)/F(η) − 1 (%) a Re = 6630', (Fexp.subs({d_: 0.01, v: 10, rho: 1.2, eta: 2 * 1.81e-5}) / Fexp.subs({d_: 0.01, v: 10, rho: 1.2, eta: 1.81e-5}) - 1).evalf() * 100, '-0.35', tol=0.02)
dp, vp, rp, ep = symbols('d v rho eta', positive=True)
Rep = rp * vp * dp / ep
CDp = (24 / Rep) * (1 + R_(27, 100) * Rep) ** R_(43, 100) + R_(47, 100) * (1 - exp(-R_(4, 100) * Rep ** R_(38, 100)))
fsim(D, 'F', CDp * pi / 8 * rp * vp ** 2 * dp ** 2)
fsim(D, 'Re', Rep)
fsim(D, 'CD', CDp)
fsim(D, 'Fs', 3 * pi * ep * vp * dp)

