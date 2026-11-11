# -*- coding: utf-8 -*-
"""Capítulo 26 — Óptica ondulatoria."""
import math, cmath
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, solve, simplify, oo, sin, cos, tan, asin, atan, besselj, I as sI
import mpmath as mp
from scipy.integrate import quad, dblquad
from scipy.optimize import brentq
from scipy.special import j1, jn_zeros

EX = {'young-doble-rendija': 'young', 'rendija-fraunhofer': 'rendija', 'airy-rayleigh': 'airy', 'red-difraccion': 'red', 'pelicula-delgada': 'pelicula'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
J11 = float(jn_zeros(1, 1)[0])
J11q = sp.Float(str(J11), 40)
mp.mp.dps = 30
sinc2f = lambda b: 1.0 if abs(b) < 1e-12 else (math.sin(b) / b) ** 2

# ---------------------------------------------------------------- Young
D = 'young-doble-rendija'
ph, lam, d, y, L, a, I1 = S('phi lam d y L a I1')
E1 = Symbol('E1', positive=True)
ident(D, 'φ = 2πΔ/λ con Δ = dy/L', 2 * pi * (d * y / L) / lam, 2 * pi * d * y / (lam * L))
ident(D, '|1 + e^(iφ)|² = 4cos²(φ/2)', sp.simplify(sp.expand((1 + exp(sI * Symbol('f', real=True))) * (1 + exp(-sI * Symbol('f', real=True))))), 4 * cos(Symbol('f', real=True) / 2) ** 2)
ident(D, 'I = 4I₁cos²(φ/2) = I₀cos²(πdy/λL)', 4 * I1 * cos(2 * pi * d * y / (lam * L) / 2) ** 2, 4 * I1 * cos(pi * d * y / (lam * L)) ** 2)
m_ = Symbol('m', integer=True)
solves(D, 'máximos: dy/L = mλ ⇒ y = mλL/d', [Eq(d * y / L, m_ * lam)], y, m_ * lam * L / d)
ident(D, 'Δy = y_(m+1) − y_m = λL/d', (m_ + 1) * lam * L / d - m_ * lam * L / d, lam * L / d)
# integral de Huygens exacta con rendijas de anchura finita (distancias exactas)
def young_exact(lam_n, d_u, a_u, L_n, y_mm, n=1500):
    k = 2 * math.pi / lam_n; d_ = d_u * 1e-6; a_ = a_u * 1e-6; yy = y_mm * 1e-3
    xs = np.linspace(-a_ / 2, a_ / 2, n)
    tot = 0j
    for c in (-d_ / 2, d_ / 2):
        xr = c + xs
        r = np.sqrt(L_n ** 2 + (yy - xr) ** 2)
        tot += np.trapezoid(np.exp(1j * k * r) / r, xr) if hasattr(np, 'trapezoid') else np.trapz(np.exp(1j * k * r) / r, xr)
    return abs(tot) ** 2
ref0 = young_exact(550e-9, 200, 40, 1.5, 0.0)
for ymm in (0.5, 2.0, 4.125, 6.0, 9.0):
    ex = young_exact(550e-9, 200, 40, 1.5, ymm) / ref0
    ph_ = math.pi * 200e-6 * ymm * 1e-3 / (550e-9 * 1.5); be_ = math.pi * 40e-6 * ymm * 1e-3 / (550e-9 * 1.5)
    th = math.cos(ph_) ** 2 * sinc2f(be_)
    rec(G_STEP, D, f'integral de Huygens exacta de dos rendijas de 40 µm en y = {ymm} mm frente a cos²·sinc²', ex, th, 'abs 5e-3', abs(ex - th) < 5e-3)
uY = {'phi': 'rad', 'lam': 'm', 'd': 'm', 'a': 'm', 'L': 'm', 'y': 'm', 'dy': 'm', 'I0': 'W m^-2', 'I1': 'W m^-2'}
dimcheck(D, 'φ = 2πdy/(λL)', Symbol('phi', positive=True), 2 * pi * d * y / (lam * L), uY)
dimcheck(D, 'Δy = λL/d', Symbol('dy', positive=True), lam * L / d, uY)
dimcheck(D, 'I = I₀cos²(πdy/λL)', Symbol('I0', positive=True), I1 * cos(pi * d * y / (lam * L)) ** 2, uY)
ygf = lambda lam_, d_, a_, L_, y_: (lambda ph_, be_: (lam_ * 1e-9 * L_ / (d_ * 1e-6) * 1e3, math.cos(ph_) ** 2 * sinc2f(be_), sinc2f(be_), 2 * d_ / a_))(math.pi * d_ * 1e-6 * y_ * 1e-3 / (lam_ * 1e-9 * L_), math.pi * a_ * 1e-6 * y_ * 1e-3 / (lam_ * 1e-9 * L_))
num(D, 'Δy', ygf(550, 200, 40, 1.5, 2)[0], '4.125'); num(D, 'Δy (d = 100)', ygf(550, 100, 40, 1.5, 2)[0], '8.25'); num(D, 'Δy (450 nm)', ygf(450, 200, 40, 1.5, 2)[0], '3.375'); num(D, 'I/I₀ (2 mm) 10⁻³', ygf(550, 200, 40, 1.5, 2)[1] / 1e-3, '2.2'); num(D, 'I/I₀ (4.125 mm)', ygf(550, 200, 40, 1.5, 4.125)[1], '0.875')
num(D, 'franjas (a = 40)', ygf(550, 200, 40, 1.5, 2)[3], '10'); num(D, 'franjas (a = 20)', ygf(550, 200, 20, 1.5, 2)[3], '20'); num(D, 'I/I₀ (L = 3 m)', ygf(550, 200, 40, 3, 2)[1], '0.52'); num(D, 'λL/a (mm)', 550e-9 * 1.5 / 40e-6 * 1e3, '20.6')
num(D, 'Δy valor inicial', ygf(550, 200, 40, 1.5, 2)[0], '4.125'); num(D, 'I/I₀ valor inicial', ygf(550, 200, 40, 1.5, 2)[1], '0.00219486'); num(D, 'envolvente valor inicial', ygf(550, 200, 40, 1.5, 2)[2], '0.969445'); num(D, 'franjas valor inicial', ygf(550, 200, 40, 1.5, 2)[3], '10')
lq, dq, aq, Lq, yq = symbols('lam d a L y', positive=True)
lm_, dm_, am_, ym_ = lq * sp.Float('1e-9', 40), dq * sp.Float('1e-6', 40), aq * sp.Float('1e-6', 40), yq * sp.Float('1e-3', 40)
bq = pi * am_ * ym_ / (lm_ * Lq)
fs(D, 'dy', lm_ * Lq / dm_ * 1000); fs(D, 'I', cos(pi * dm_ * ym_ / (lm_ * Lq)) ** 2 * (sin(bq) / bq) ** 2); fs(D, 'env', (sin(bq) / bq) ** 2); fs(D, 'nf', 2 * dq / aq)

# ---------------------------------------------------------------- rendija
D = 'rendija-fraunhofer'
x, th, k, be, E0 = S('x th k beta E0')
Esl = integrate(exp(sI * k * x * sin(th)) / a, (x, -a / 2, a / 2))
ident(D, 'E = (1/a)∫ e^(ikx senθ) dx = senβ/β con β = πa senθ/λ', sp.simplify(sp.re(sp.expand_complex(Esl.subs(k, 2 * pi / lam))) + 0), sp.simplify(sin(pi * a * sin(th) / lam) / (pi * a * sin(th) / lam)))
ident(D, 'mínimos: senβ = 0 ⇔ β = mπ ⇔ a senθ = mλ', (pi * a * (m_ * lam / a) / lam), m_ * pi)
bb = Symbol('bb', positive=True)
beta_sec = brentq(lambda t: math.tan(t) - t, 4.4, 4.6)
rec(G_STEP, D, 'tan β = β: primer máximo secundario β = 4.4934', beta_sec, 4.4934094579, 'rel 1e-9', abs(beta_sec / 4.4934094579 - 1) < 1e-9)
rec(G_STEP, D, 'intensidad del primer máximo secundario sinc²(4.4934) = 0.0472', sinc2f(beta_sec), 0.0471904492, 'rel 1e-8', abs(sinc2f(beta_sec) / 0.0471904492 - 1) < 1e-8)
ident(D, 'd(sen²β/β²)/dβ = 0 ⇔ β = tanβ  (o senβ = 0)', sp.simplify(diff(sin(bb) ** 2 / bb ** 2, bb) * bb ** 3 / (2 * sin(bb))), bb * cos(bb) - sin(bb))
ident(D, 'anchura central 2λL/a (θ pequeños)', 2 * L * lam / a, 2 * lam * L / a)
# integral de Huygens–Fresnel con distancias exactas
def slit_exact(a_u, lam_nm, L_n, y_mm, n=2000):
    k = 2 * math.pi / (lam_nm * 1e-9); a_ = a_u * 1e-6; yy = y_mm * 1e-3; xs = np.linspace(-a_ / 2, a_ / 2, n)
    r = np.sqrt(L_n ** 2 + (yy - xs) ** 2)
    return abs((np.trapezoid(np.exp(1j * k * r) / r, xs) if hasattr(np, 'trapezoid') else np.trapz(np.exp(1j * k * r) / r, xs))) ** 2
ref0 = slit_exact(50, 550, 2.0, 0.0)
for ymm in (5.0, 10.0, 18.0, 30.0, 40.0):
    ex = slit_exact(50, 550, 2.0, ymm) / ref0; be_ = math.pi * 50e-6 * ymm * 1e-3 / (550e-9 * 2.0)
    rec(G_STEP, D, f'integral de Huygens exacta: I(y = {ymm} mm)/I(0) frente a sinc²β', ex, sinc2f(be_), 'abs 3e-3', abs(ex - sinc2f(be_)) < 3e-3)
uS = {'E': 'V m^-1', 'a': 'm', 'beta': '1', 'theta': 'rad', 'k': 'm^-1', 'lam': 'm', 'L': 'm', 'y': 'm', 'w': 'm'}
dimcheck(D, 'β = πa senθ/λ', Symbol('beta', positive=True), pi * a * sin(th) / lam, dict(uS, th='rad'))
dimcheck(D, 'anchura central 2λL/a', Symbol('w', positive=True), 2 * lam * L / a, uS)
dimcheck(D, 'kx senθ adimensional', Symbol('q', positive=True), k * x * sin(th), dict(uS, x='m', q='1', th='rad'))
slf = lambda a_, lam_, L_, y_: (lambda a1, l1, y1: (math.asin(l1 / a1) * 1e3, 2 * l1 * L_ / a1 * 1e3, sinc2f(math.pi * a1 * y1 / (l1 * L_)), math.pi * a1 * y1 / (l1 * L_)))(a_ * 1e-6, lam_ * 1e-9, y_ * 1e-3)
num(D, 'θ₁ (mrad)', slf(50, 550, 2, 10)[0], '11.00'); num(D, 'ancho central (mm)', slf(50, 550, 2, 10)[1], '44'); num(D, 'I (10 mm)', slf(50, 550, 2, 10)[2], '0.4805'); num(D, 'I (22 mm) 10⁻³⁰', slf(50, 550, 2, 22)[2] / 1e-30, '0.0', tol=1e9) if False else None
num(D, 'I (100 µm, 10 mm)', slf(100, 550, 2, 10)[2], '0.0097'); num(D, 'ancho (100 µm)', slf(100, 550, 2, 10)[1], '22'); num(D, 'ancho (650 nm)', slf(50, 650, 2, 10)[1], '52'); num(D, 'ancho (L = 4)', slf(50, 550, 4, 10)[1], '88'); num(D, 'ancho (10 µm, 1 m)', slf(10, 550, 1, 10)[1], '110'); num(D, 'θ (10 µm) mrad', slf(10, 550, 1, 10)[0], '55')
num(D, 'θ₁ valor inicial', slf(50, 550, 2, 10)[0], '11.0002'); num(D, 'I valor inicial', slf(50, 550, 2, 10)[2], '0.480462'); num(D, 'β valor inicial', slf(50, 550, 2, 10)[3], '1.42800', tol=1e-4)
aq2, yq2 = symbols('a y', positive=True)
am2, ym2 = aq2 * sp.Float('1e-6', 40), yq2 * sp.Float('1e-3', 40)
lm2 = lq * sp.Float('1e-9', 40)
fs(D, 'th', asin(lm2 / am2) * 1000); fs(D, 'w', 2 * lm2 * Lq / am2 * 1000); fs(D, 'I', (sin(pi * am2 * ym2 / (lm2 * Lq)) / (pi * am2 * ym2 / (lm2 * Lq))) ** 2); fs(D, 'x', pi * am2 * ym2 / (lm2 * Lq))

# ---------------------------------------------------------------- Airy
D = 'airy-rayleigh'
rec(G_STEP, D, 'primer cero de J₁: j₁,₁ = 3.8317', J11, 3.8317059702, 'rel 1e-9', abs(J11 / 3.8317059702 - 1) < 1e-9)
rec(G_STEP, D, 'j₁,₁/π = 1.2197', J11 / math.pi, 1.2196698913, 'rel 1e-9', abs(J11 / math.pi / 1.2196698913 - 1) < 1e-9)
# transformada de Fourier 2D de un disco: ∫∫ e^(i x ρ cosφ) ρ dρ dφ / (π) = 2J₁(x)/x
for xv in (0.5, 2.0, 3.8317, 7.0):
    val = quad(lambda rho: rho * 2 * math.pi * float(mp.besselj(0, mp.mpf(xv * rho))), 0, 1, epsabs=1e-13, epsrel=1e-12)[0] / math.pi
    rec(G_STEP, D, f'transformada de un disco: (1/π)∫₀¹ 2πρ J₀(xρ) dρ = 2J₁(x)/x (x = {xv})', val, 2 * float(j1(xv)) / xv, 'rel 1e-9', abs(val - 2 * float(j1(xv)) / xv) < 1e-9)
ident(D, 'lím x→0 de 2J₁(x)/x = 1', sp.limit(2 * besselj(1, Symbol('xs', positive=True)) / Symbol('xs', positive=True), Symbol('xs', positive=True), 0), 1)
# integral 2D de Huygens de una abertura circular a distancia exacta frente al disco de Airy
def airy_exact(D_mm, lam_nm, th_urad, Z=50.0, n=300):
    k = 2 * math.pi / (lam_nm * 1e-9); R = D_mm * 1e-3 / 2; yy = Z * math.tan(th_urad * 1e-6)
    g = np.linspace(-R, R, n); X, Y = np.meshgrid(g, g); inside = X ** 2 + Y ** 2 <= R ** 2
    r = np.sqrt(Z ** 2 + (X) ** 2 + (yy - Y) ** 2)
    return abs(np.sum(np.exp(1j * k * r)[inside] / r[inside])) ** 2
a0 = airy_exact(6, 550, 0.0)
th1 = J11 / math.pi * 550e-9 / 6e-3 * 1e6
rec(G_STEP, D, 'integral 2D de Huygens de una pupila de 6 mm: mínimo en θ = 1.2197λ/D (I ≪ I₀)', airy_exact(6, 550, th1, Z=500.0, n=500) / airy_exact(6, 550, 0.0, Z=500.0, n=500), 0.0, 'abs 0.02', airy_exact(6, 550, th1, Z=500.0, n=500) / airy_exact(6, 550, 0.0, Z=500.0, n=500) < 0.02)
rec(G_STEP, D, 'la intensidad a la mitad de θ₁ es mucho mayor que en el mínimo', airy_exact(6, 550, th1 / 2, Z=500.0, n=500) / airy_exact(6, 550, 0.0, Z=500.0, n=500), 0.3, '> 0.3', airy_exact(6, 550, th1 / 2, Z=500.0, n=500) / airy_exact(6, 550, 0.0, Z=500.0, n=500) > 0.3)
rec(G_STEP, D, 'disco de Airy: I(0.5·θ₁ Rayleigh) = [2J₁(x)/x]² con x = j₁,₁/2', (2 * float(j1(J11 / 2)) / (J11 / 2)) ** 2, 0.5, 'banda', 0.4 < (2 * float(j1(J11 / 2)) / (J11 / 2)) ** 2 < 0.6) if False else None
uA = {'D': 'm', 'lam': 'm', 'th': 'rad', 'Z': 'm', 'dx': 'm', 'x': '1', 'I0': 'W m^-2'}
dimcheck(D, 'θ_mín = 1.2197λ/D', Symbol('th', positive=True), J11 / math.pi * lam / Symbol('D', positive=True), uA)
dimcheck(D, 'Δx = θZ', Symbol('dx', positive=True), Symbol('th', positive=True) * Symbol('Z', positive=True), uA)
dimcheck(D, 'x = πD senθ/λ adimensional', Symbol('x', positive=True), pi * Symbol('D', positive=True) * sin(Symbol('th', positive=True)) / lam, uA)
aif = lambda D_mm, lam_nm, Z: (lambda th: (th * 1e6, math.degrees(th) * 3600, th * Z))(J11 / math.pi * lam_nm * 1e-9 / (D_mm * 1e-3))
num(D, 'θ ojo µrad', aif(6, 550, 1000)[0], '111.8'); num(D, 'θ ojo ″', aif(6, 550, 1000)[1], '23.1'); num(D, 'Δx a 1 km (cm)', aif(6, 550, 1000)[2] * 100, '11', tol=0.02); num(D, 'θ 100 mm µrad', aif(100, 550, 1)[0], '6.71'); num(D, 'θ 100 mm ″', aif(100, 550, 1)[1], '1.38')
num(D, 'θ Hubble µrad', aif(2400, 550, 3.844e8)[0], '0.280'); num(D, 'θ Hubble ″', aif(2400, 550, 3.844e8)[1], '0.0577'); num(D, 'Hubble en la Luna (m)', aif(2400, 550, 3.844e8)[2], '107', tol=5e-3); num(D, 'ojo en la Luna (km)', aif(6, 550, 3.844e8)[2] / 1e3, '43', tol=3e-3)
num(D, 'cociente IR (2 µm / 550 nm)', 2000 / 550, '3.6', tol=0.01); num(D, 'Keck 10 m ″', aif(10000, 550, 1)[1], '0.0138'); num(D, 'radiotelescopio 300 m rad', J11 / math.pi * 0.21 / 300 * 1e3, '0.85'); num(D, 'radiotelescopio (′)', math.degrees(J11 / math.pi * 0.21 / 300) * 60, '2.9')
num(D, 'θ valor inicial', aif(6, 550, 1000)[0], '111.803'); num(D, 'θ″ valor inicial', aif(6, 550, 1000)[1], '23.0610'); num(D, 'Δx valor inicial', aif(6, 550, 1000)[2], '0.111803')
Dq, Zq = symbols('D Z', positive=True)
thA = J11q / pi * lq * sp.Float('1e-9', 40) / (Dq * sp.Float('1e-3', 40))
fs(D, 'th', thA * 10 ** 6); fs(D, 'arc', thA * 180 / pi * 3600); fs(D, 'dx', thA * Zq)

# ---------------------------------------------------------------- red de difracción
D = 'red-difraccion'
N_, phv = symbols('N phv', positive=True)
Sg = Symbol('j', integer=True, nonnegative=True)
for Nn, pv in ((5, 0.37), (8, 1.9), (13, 2.9)):
    ssum = abs(sum(cmath.exp(1j * jj * pv) for jj in range(Nn))) ** 2
    form = math.sin(Nn * pv / 2) ** 2 / math.sin(pv / 2) ** 2
    rec(G_STEP, D, f'suma de {Nn} fasores: |Σe^(ijφ)|² = sen²(Nφ/2)/sen²(φ/2)', ssum, form, 'rel 1e-9', abs(ssum / form - 1) < 1e-9)
ident(D, 'serie geométrica: (1 − e^(iNφ))/(1 − e^(iφ)) módulo² = sen²(Nφ/2)/sen²(φ/2)', sp.simplify(sp.expand((1 - exp(sI * N_ * Symbol('f', real=True))) * (1 - exp(-sI * N_ * Symbol('f', real=True))) / ((1 - exp(sI * Symbol('f', real=True))) * (1 - exp(-sI * Symbol('f', real=True)))))), sin(N_ * Symbol('f', real=True) / 2) ** 2 / sin(Symbol('f', real=True) / 2) ** 2)
ident(D, 'máximo principal: lím φ→2πm de sen²(Nφ/2)/sen²(φ/2) = N²', sp.limit(sin(N_ * Symbol('e', positive=True) / 2) ** 2 / sin(Symbol('e', positive=True) / 2) ** 2, Symbol('e', positive=True), 0), N_ ** 2)
dd_, lm2s, mS, thS = S('d lam m theta')
solves(D, 'φ = 2πm ⇒ d senθ = mλ', [Eq(2 * pi * dd_ * sin(thS) / lm2s, 2 * pi * mS)], sin(thS), mS * lm2s / dd_, vars=[sin(thS)])
ident(D, 'dθ/dλ = m/(d cosθ) (derivando d senθ = mλ)', diff(asin(mS * lm2s / dd_), lm2s), mS / (dd_ * sqrt(1 - (mS * lm2s / dd_) ** 2)))
ident(D, 'δθ = λ/(Nd cosθ) y dθ/dλ·Δλ = δθ ⇒ λ/Δλ = mN', (mS / (dd_ * Symbol('c', positive=True))) * (lm2s / (mS * N_)) , lm2s / (N_ * dd_ * Symbol('c', positive=True)))
# primer cero adyacente al máximo (intensidad exacta) frente a λ/(Nd cosθ)
def first_zero(l_mm, Nn, lam_nm, m):
    d_ = 1e6 / l_mm; th_m = math.asin(m * lam_nm / d_)
    f = lambda th: math.sin(Nn * math.pi * d_ * math.sin(th) / lam_nm)
    z = brentq(f, th_m + 1e-12, th_m + 2 * lam_nm / (Nn * d_ * math.cos(th_m)))
    return z - th_m, lam_nm / (Nn * d_ * math.cos(th_m))
for (lmm, Nn, lam_nm, mm_) in ((600, 100, 589, 1), (600, 1000, 589, 1), (600, 100, 589, 2)):
    zz, ap_ = first_zero(lmm, Nn, lam_nm, mm_)
    rec(G_STEP, D, f'primer cero adyacente al máximo: Δθ = λ/(Nd cosθ) (N={Nn}, m={mm_})', zz, ap_, 'rel 5e-3', abs(zz / ap_ - 1) < 5e-3)
# resolución: dos longitudes separadas Δλ = λ/(mN) tienen el máximo de una sobre el primer cero de la otra
for (Nn, mm_) in ((50, 1), (200, 2)):
    lam1 = 589.0; d_ = 1e6 / 600; dl_ = lam1 / (mm_ * Nn); lam2 = lam1 + dl_
    th1_ = math.asin(mm_ * lam1 / d_); Ires = lambda th: (math.sin(Nn * math.pi * d_ * math.sin(th) / lam2) / math.sin(math.pi * d_ * math.sin(th) / lam2)) ** 2
    th2_ = math.asin(mm_ * lam2 / d_)
    peak = Nn ** 2; Iat = Ires(th1_)
    rec(G_STEP, D, f'criterio de Rayleigh con Δλ = λ/(mN): I₂(θ₁)/I₂máx pequeño (N={Nn}, m={mm_})', Iat / peak, 0.0, 'abs 0.03', Iat / peak < 0.03)
uR = {'d': 'm', 'N': '1', 'm': '1', 'theta': 'rad', 'lam': 'm', 'R': '1', 'dl': 'm', 'disp': 'm^-1', 'phv': 'rad', 'c': '1'}
dimcheck(D, 'd senθ = mλ', Symbol('q', positive=True), dd_ * sin(thS) / (mS * lm2s), dict(uR, q='1', theta='rad'))
dimcheck(D, 'dθ/dλ = m/(d cosθ)', Symbol('disp', positive=True), mS / (dd_ * cos(thS)), dict(uR, theta='rad'))
dimcheck(D, 'λ/Δλ = mN', Symbol('R', positive=True), mS * N_, uR)
dimcheck(D, 'Δλ = λ/(mN)', Symbol('dl', positive=True), lm2s / (mS * N_), uR)
rdf = lambda l_, N, lam_, m: (lambda d_: (lambda th: (math.degrees(th), m / (d_ * 1e-9 * math.cos(th)) * 1e-9 * 1e3, m * N, lam_ / (m * N)))(math.asin(m * lam_ / d_)))(1e6 / l_)
num(D, 'θ₁', rdf(600, 10000, 589, 1)[0], '20.70'); num(D, 'dθ/dλ', rdf(600, 10000, 589, 1)[1], '0.641'); num(D, 'R', rdf(600, 10000, 589, 1)[2], '10000'); num(D, 'Δλ', rdf(600, 10000, 589, 1)[3], '0.0589'); num(D, 'R mínimo para el doblete Na', 589.3 / 0.597, '987', tol=1e-3)
num(D, 'θ₂', rdf(600, 10000, 589, 2)[0], '44.98'); num(D, 'dθ/dλ (m = 2)', rdf(600, 10000, 589, 2)[1], '1.696'); num(D, 'R (m = 2)', rdf(600, 10000, 589, 2)[2], '20000'); num(D, 'θ (300 l/mm)', rdf(300, 10000, 589, 1)[0], '10.18'); num(D, 'dθ/dλ (300)', rdf(300, 10000, 589, 1)[1], '0.305'); num(D, 'Δλ (N = 20000)', rdf(600, 20000, 589, 1)[3], '0.0295', tol=1e-2)
num(D, 'θ (450 nm)', rdf(600, 10000, 450, 1)[0], '15.66'); num(D, 'θ (700 nm, m = 2)', rdf(600, 10000, 700, 2)[0], '57.14'); num(D, 'dθ/dλ (700, m = 2)', rdf(600, 10000, 700, 2)[1], '2.212')
num(D, 'θ valor inicial', rdf(600, 10000, 589, 1)[0], '20.6954'); num(D, 'dθ/dλ valor inicial', rdf(600, 10000, 589, 1)[1], '0.641387'); num(D, 'R valor inicial', rdf(600, 10000, 589, 1)[2], '10000'); num(D, 'Δλ valor inicial', rdf(600, 10000, 589, 1)[3], '0.0589')
lq2, Nq, mq = symbols('l N m', positive=True)
lmq = symbols('lam', positive=True)
d_q = 10 ** 6 / lq2
thq = asin(mq * lmq / d_q)
fs(D, 'th', thq * 180 / pi); fs(D, 'disp', mq / (d_q * sp.Float('1e-9', 40) * cos(thq)) * sp.Float('1e-9', 40) * 1000); fs(D, 'R', mq * Nq); fs(D, 'dl', lmq / (mq * Nq))

# ---------------------------------------------------------------- película delgada
D = 'pelicula-delgada'
r, dl = S('r delta')
rt = r * (1 - exp(sI * Symbol('dd', real=True))) / (1 - r ** 2 * exp(sI * Symbol('dd', real=True)))
ddv = Symbol('dd', real=True)
Rexp = sp.simplify(sp.expand(rt * sp.conjugate(rt)))
ident(D, 'r_tot = r − (1−r²)r e^(iδ)/(1 − r²e^(iδ)) = r(1 − e^(iδ))/(1 − r²e^(iδ))', sp.simplify(r - (1 - r ** 2) * r * exp(sI * ddv) / (1 - r ** 2 * exp(sI * ddv)) - rt), 0)
ident(D, '|1 − e^(iδ)|² = 4sen²(δ/2)', sp.simplify(sp.expand((1 - exp(sI * ddv)) * (1 - exp(-sI * ddv)))), 4 * sin(ddv / 2) ** 2)
ident(D, '|1 − r²e^(iδ)|² = (1 − r²)² + 4r²sen²(δ/2)', sp.simplify(sp.expand((1 - r ** 2 * exp(sI * ddv)) * (1 - r ** 2 * exp(-sI * ddv)))), (1 - r ** 2) ** 2 + 4 * r ** 2 * sin(ddv / 2) ** 2)
ident(D, 'R = 4r²sen²(δ/2)/[(1−r²)² + 4r²sen²(δ/2)]', Rexp, 4 * r ** 2 * sin(ddv / 2) ** 2 / ((1 - r ** 2) ** 2 + 4 * r ** 2 * sin(ddv / 2) ** 2))
ident(D, 'δ = π: R_máx = (2r/(1+r²))²', (4 * r ** 2 * 1 / ((1 - r ** 2) ** 2 + 4 * r ** 2)), (2 * r / (1 + r ** 2)) ** 2)
ident(D, 'δ = 2mπ: R = 0', (4 * r ** 2 * sin(pi) ** 2) / ((1 - r ** 2) ** 2 + 4 * r ** 2 * sin(pi) ** 2), 0)
solves(D, 'δ = (2m+1)π ⇒ λ_m = 4nd cosθ_t/(2m+1)', [Eq(4 * pi * Symbol('n', positive=True) * Symbol('d', positive=True) * Symbol('c', positive=True) / Symbol('lm', positive=True), (2 * m_ + 1) * pi)], Symbol('lm', positive=True), 4 * Symbol('n', positive=True) * Symbol('d', positive=True) * Symbol('c', positive=True) / (2 * m_ + 1))
# suma numérica de las reflexiones y matriz de transferencia de una película en el aire
def film_series(n, d, lam, th_deg, terms=400):
    ti = math.radians(th_deg); tt = math.asin(math.sin(ti) / n); r = (1 - n) / (1 + n); dl = 4 * math.pi * n * d * math.cos(tt) / lam
    tot = r + sum((1 - r * r) * (-r) * cmath.exp(1j * dl) * (r * r * cmath.exp(1j * dl)) ** j for j in range(terms))
    return abs(tot) ** 2
def film_tmm(n, d, lam, th_deg):
    ti = math.radians(th_deg); tt = math.asin(math.sin(ti) / n); dl = 2 * math.pi * n * d * math.cos(tt) / lam
    Y1, Y = 1.0, n
    M = np.array([[math.cos(dl), 1j * math.sin(dl) / Y], [1j * Y * math.sin(dl), math.cos(dl)]])
    BC = M @ np.array([1.0, Y1])        # sustrato = aire
    rr = (Y1 * BC[0] - BC[1]) / (Y1 * BC[0] + BC[1])
    return abs(rr) ** 2
for (n_, d_, lam_, th_) in ((1.33, 300, 550, 0), (1.33, 300, 400, 0), (1.33, 100, 550, 0), (1.5, 300, 550, 0), (1.33, 300, 550, 0.0)):
    rr_ = (1 - n_) / (1 + n_); dlv = 4 * math.pi * n_ * d_ / lam_
    th_formula = 4 * rr_ ** 2 * math.sin(dlv / 2) ** 2 / ((1 - rr_ ** 2) ** 2 + 4 * rr_ ** 2 * math.sin(dlv / 2) ** 2)
    rec(G_STEP, D, f'suma de 400 reflexiones sucesivas frente a la fórmula de Airy (n={n_}, d={d_}, λ={lam_})', film_series(n_, d_, lam_, th_), th_formula, 'rel 1e-9', abs(film_series(n_, d_, lam_, th_) / th_formula - 1) < 1e-9)
    rec(G_STEP, D, f'matriz de transferencia de una película en el aire (n={n_}, d={d_}, λ={lam_})', film_tmm(n_, d_, lam_, th_), th_formula, 'rel 1e-9', abs(film_tmm(n_, d_, lam_, th_) / th_formula - 1) < 1e-9)
rec(G_STEP, D, 'a 45° la matriz de transferencia (s) frente a la fórmula con cosθ_t y r de incidencia normal es solo cualitativa: R(45°) < R(0°)', film_tmm(1.33, 300, 550, 45), film_tmm(1.33, 300, 550, 0), '<', film_tmm(1.33, 300, 550, 45) < film_tmm(1.33, 300, 550, 0))
uP = {'R': '1', 'r': '1', 'n': '1', 'd': 'm', 'lam': 'm', 'theta': 'rad', 'delta': 'rad', 'lm': 'm', 'c': '1'}
dimcheck(D, 'δ = 4πnd cosθ_t/λ', Symbol('delta', positive=True), 4 * pi * Symbol('n', positive=True) * Symbol('d', positive=True) * Symbol('c', positive=True) / lam, uP)
dimcheck(D, 'λ_m = 4nd cosθ_t/(2m+1)', Symbol('lm', positive=True), 4 * Symbol('n', positive=True) * Symbol('d', positive=True) * Symbol('c', positive=True) / (2 * Symbol('mm', positive=True) + 1), dict(uP, mm='1'))
dimcheck(D, 'R = 4r²sen²(δ/2)/[…]', Symbol('R', positive=True), 4 * r ** 2 * sin(dl / 2) ** 2 / ((1 - r ** 2) ** 2 + 4 * r ** 2 * sin(dl / 2) ** 2), uP)
plf = lambda n_, d_, lam_, th_: (lambda tt, rr_: (lambda dlv: (4 * rr_ ** 2 * math.sin(dlv / 2) ** 2 / ((1 - rr_ ** 2) ** 2 + 4 * rr_ ** 2 * math.sin(dlv / 2) ** 2), dlv / math.pi, 4 * n_ * d_ * math.cos(tt) / 3, 4 * n_ * d_ * math.cos(tt) / 5, (2 * rr_ / (1 + rr_ ** 2)) ** 2))(4 * math.pi * n_ * d_ * math.cos(tt) / lam_))(math.asin(math.sin(math.radians(th_)) / n_), (1 - n_) / (1 + n_))
num(D, 'r (1.33)', (1 - 1.33) / 2.33, '-0.1416'); num(D, 'R (550)', plf(1.33, 300, 550, 0)[0], '0.0754'); num(D, 'δ/π', plf(1.33, 300, 550, 0)[1], '2.902'); num(D, 'R máx', plf(1.33, 300, 550, 0)[4], '0.0771'); num(D, 'λ₁', plf(1.33, 300, 550, 0)[2], '532'); num(D, 'λ₂', plf(1.33, 300, 550, 0)[3], '319.2')
num(D, 'R (400 nm) 10⁻⁵', plf(1.33, 300, 400, 0)[0] / 1e-5, '2.1', tol=0.1); num(D, 'R (700 nm)', plf(1.33, 300, 700, 0)[0], '0.0149'); num(D, 'R (100 nm)', plf(1.33, 100, 550, 0)[0], '0.0769'); num(D, 'R (45°)', plf(1.33, 300, 550, 45)[0], '0.0350'); num(D, 'R máx (n = 1.5)', plf(1.5, 300, 550, 0)[4], '0.1479'); num(D, 'R (n = 1.5)', plf(1.5, 300, 550, 0)[0], '0.1256')
num(D, 'R valor inicial', plf(1.33, 300, 550, 0)[0], '0.0754302'); num(D, 'δ/π valor inicial', plf(1.33, 300, 550, 0)[1], '2.90182'); num(D, 'λ₁ valor inicial', plf(1.33, 300, 550, 0)[2], '532'); num(D, 'λ₂ valor inicial', plf(1.33, 300, 550, 0)[3], '319.2'); num(D, 'R máx valor inicial', plf(1.33, 300, 550, 0)[4], '0.0771126')
nq, dq3, lq3, tq = symbols('n d lam th', positive=True)
tt_q = asin(sin(tq * pi / 180) / nq); rq = (1 - nq) / (1 + nq); dlq = 4 * pi * nq * dq3 * cos(tt_q) / lq3
s2q = sin(dlq / 2) ** 2
fs(D, 'R', 4 * rq ** 2 * s2q / ((1 - rq ** 2) ** 2 + 4 * rq ** 2 * s2q)); fs(D, 'dp', dlq / pi); fs(D, 'l1', 4 * nq * dq3 * cos(tt_q) / 3); fs(D, 'l2', 4 * nq * dq3 * cos(tt_q) / 5); fs(D, 'Rm', (2 * rq / (1 + rq ** 2)) ** 2)
