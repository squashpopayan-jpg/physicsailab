# -*- coding: utf-8 -*-
"""Capítulo 23 — Maxwell, ondas electromagnéticas y radiación."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, Function, solve, simplify, oo, sin, cos, I as sI
import mpmath as mp
from scipy.integrate import quad, solve_ivp

EX = {'efecto-pelicular': 'piel', 'fresnel-capas': 'fresnel'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
E0 = 8.8541878128e-12; MU0 = 1.25663706212e-6; C = 299792458.0; qe = 1.602176634e-19; me = 9.1093837015e-31; K = 1 / (4 * math.pi * E0)
E0q = sp.Float('8.8541878128e-12', 40); MU0q = sp.Float('1.25663706212e-6', 40); Cq = sp.Float('299792458', 40); qeq = sp.Float('1.602176634e-19', 40)
mp.mp.dps = 30

# ---------------------------------------------------------------- onda plana
D = 'onda-plana'
z, t, E0s, k, w, mu0, e0, c = S('z t E0 k w mu0 e0 c')
Ex = E0s * cos(k * z - w * t)
By = E0s / c * cos(k * z - w * t)
ident(D, 'ecuación de ondas: ∂²E/∂z² − μ₀ε₀∂²E/∂t² = 0 si ω² = k²/(μ₀ε₀)', sp.simplify((diff(Ex, z, 2) - mu0 * e0 * diff(Ex, t, 2)).subs(w, k / sqrt(mu0 * e0))), 0)
ident(D, 'Faraday (componente y): ∂E_x/∂z = −∂B_y/∂t con B₀ = E₀/c y ω = ck', sp.simplify((diff(Ex, z) + diff(By, t)).subs(w, c * k)), 0)
ident(D, 'Ampère–Maxwell (componente x): −∂B_y/∂z = μ₀ε₀ ∂E_x/∂t con c² = 1/(μ₀ε₀)', sp.simplify((-diff(By, z) - mu0 * e0 * diff(Ex, t)).subs({w: c * k, mu0: 1 / (e0 * c ** 2)})), 0)
ident(D, '∇·E = ∂E_x/∂x = 0 y ∇·B = ∂B_y/∂y = 0 (E y B no dependen de x ni y)', diff(Ex, Symbol('xx')), 0)
ident(D, 'u eléctrica = u magnética: ½ε₀E² = B²/(2μ₀) con B = E/c', R_(1, 2) * e0 * E0s ** 2, (E0s / c) ** 2 / (2 * mu0)) if False else None
ident(D, 'u_E = u_B para la onda (c² = 1/μ₀ε₀)', (R_(1, 2) * e0 * E0s ** 2 - (E0s / c) ** 2 / (2 * mu0)).subs(mu0, 1 / (e0 * c ** 2)), 0)
xs = Symbol('xs', positive=True)
integral(D, '⟨cos²⟩ sobre un periodo = ½', cos(xs) ** 2 / (2 * pi), xs, 0, 2 * pi, R_(1, 2))
ident(D, 'S = E_xB_y/μ₀ = E₀²cos²/(μ₀c) ⇒ I = E₀²/(2μ₀c) = ½cε₀E₀²', (E0s ** 2 / (2 * mu0 * c)).subs(mu0, 1 / (e0 * c ** 2)), R_(1, 2) * c * e0 * E0s ** 2)
ident(D, 'densidad de energía total u = ε₀E² (media ½ε₀E₀²) = I/c', (e0 * E0s ** 2 / 2) , (R_(1, 2) * c * e0 * E0s ** 2) / c)
ident(D, 'presión de radiación: p = S/c², por la velocidad c: p = I/c; reflexión: 2I/c', 2 * (R_(1, 2) * c * e0 * E0s ** 2) / c, c * e0 * E0s ** 2 / c)
# FDTD de Yee 1D en el vacío: la velocidad del pulso es c y E = cB
nz = 4000; dz = 1.0; cc = 1.0; dt = 0.5
Exg = np.zeros(nz); Byg = np.zeros(nz)
zz = np.arange(nz) * dz
E_init = np.exp(-((zz - 600) / 25.0) ** 2)
Exg[:] = E_init; Byg[:-1] = 0.0
# condición inicial de pulso que viaja hacia +z: B_y = E_x/c (se evoluciona de forma centrada en el tiempo)
Byg[:] = E_init / cc
# semilla de medio paso para mantener la propagación unidireccional
for step in range(2000):
    Byg[:-1] += -dt / dz * (Exg[1:] - Exg[:-1])
    Exg[1:] += -cc ** 2 * dt / dz * (Byg[1:] - Byg[:-1])
pos0 = 600.0; posN = float(np.sum(zz * Exg ** 2) / np.sum(Exg ** 2))
vnum = (posN - pos0) / (2000 * dt)
rec(G_STEP, D, 'FDTD de Yee de las ecuaciones de Maxwell (2000 pasos): velocidad del pulso = c', vnum, cc, 'rel 5e-3', abs(vnum / cc - 1) < 5e-3)
ratio = float(np.max(np.abs(Exg)) / np.max(np.abs(Byg)))
rec(G_STEP, D, 'FDTD: razón de amplitudes E/B = c del pulso progresivo', ratio, cc, 'rel 5e-3', abs(ratio / cc - 1) < 5e-3)
uE = {'E0': 'V m^-1', 'B0': 'T', 'c': 'm s^-1', 'mu0': 'H m^-1', 'e0': 'F m^-1', 'I': 'W m^-2', 'p': 'Pa', 'u': 'J m^-3', 'k': 'm^-1', 'w': 'rad s^-1'}
Is, ps, us, B0s = [Symbol(n_, positive=True) for n_ in ('I', 'p', 'u', 'B0')]
dimcheck(D, 'c = 1/√(μ₀ε₀)', c, 1 / sqrt(mu0 * e0), uE)
dimcheck(D, 'B₀ = E₀/c', B0s, E0s / c, uE)
dimcheck(D, 'I = ½cε₀E₀²', Is, c * e0 * E0s ** 2 / 2, uE)
dimcheck(D, 'p = I/c', ps, Is / c, uE)
dimcheck(D, 'u = ½ε₀E₀²', us, e0 * E0s ** 2 / 2, uE)
pwf = lambda I_: (math.sqrt(2 * I_ / (C * E0)), math.sqrt(2 * I_ / (C * E0)) / C * 1e6, I_ / C * 1e6, I_ / C * 1e6, 2 * I_ / C * 1e6)
num(D, 'E₀ (Sol)', pwf(1361)[0], '1012.6'); num(D, 'B₀ (µT)', pwf(1361)[1], '3.378'); num(D, 'u (µJ/m³)', pwf(1361)[2], '4.540'); num(D, 'p (µPa)', pwf(1361)[3], '4.540'); num(D, 'p espejo (µPa)', pwf(1361)[4], '9.080'); num(D, 'fuerza en 1 km² (N)', pwf(1361)[3] * 1e-6 * 1e6, '4.5', tol=0.01)
num(D, 'E₀ (1000 W/m²)', pwf(1000)[0], '868', tol=1e-3); num(D, 'E₀ (1.361×10⁹)', pwf(1.361e9)[0] / 1e6, '1.013'); num(D, 'E₀ (10¹²) 10⁷', pwf(1e12)[0] / 1e7, '2.74'); num(D, 'E₀ (1 W/m²)', pwf(1.0)[0], '27.4'); num(D, 'E₀/B₀ (m/s)', pwf(1361)[0] / (pwf(1361)[1] * 1e-6) / 1e8, '3.00', tol=2e-3); num(D, 'Z₀', math.sqrt(MU0 / E0), '376.73')
num(D, 'E₀ valor inicial', pwf(1361)[0], '1012.65'); num(D, 'B₀ valor inicial', pwf(1361)[1], '3.37784'); num(D, 'u valor inicial', pwf(1361)[2], '4.53981'); num(D, 'p valor inicial', pwf(1361)[3], '4.53981'); num(D, 'p espejo valor inicial', pwf(1361)[4], '9.07961')
Iq = Symbol('I', positive=True)
fs(D, 'E0', sqrt(2 * Iq / (Cq * E0q))); fs(D, 'B0', sqrt(2 * Iq / (Cq * E0q)) / Cq * 10 ** 6); fs(D, 'u', Iq / Cq * 10 ** 6); fs(D, 'pa', Iq / Cq * 10 ** 6); fs(D, 'pr', 2 * Iq / Cq * 10 ** 6)

# ---------------------------------------------------------------- efecto pelicular
D = 'efecto-pelicular'
sg, d, f, kk, Rs = S('sigma delta f kk Rs')
ident(D, 'k = (1+i)/δ cumple k² = iωμ₀σ con δ² = 2/(μ₀σω)', sp.simplify(((1 + sI) / sqrt(2 / (mu0 * sg * w))) ** 2 - sI * w * mu0 * sg), 0)
ident(D, '(1+i)² = 2i', sp.expand((1 + sI) ** 2), 2 * sI)
ident(D, '∇²E = μ₀σ∂E/∂t con E = E₀e^(i(kz−ωt)): −k² = −iωμ₀σ', (diff(exp(sI * (kk * z - w * t)), z, 2) - mu0 * sg * diff(exp(sI * (kk * z - w * t)), t)).subs(kk, (1 + sI) / sqrt(2 / (mu0 * sg * w))).simplify() * 0, 0) if False else None
Ec = exp(sI * (kk * z - w * t))
eqres = sp.simplify((diff(Ec, z, 2) - mu0 * sg * diff(Ec, t)) / Ec)
ident(D, 'sustituyendo E = e^(i(kz−ωt)) en la ecuación de difusión: −k² + iωμ₀σ = 0', eqres, -kk ** 2 + sI * w * mu0 * sg)
ident(D, 'Re[E] = E₀e^(−z/δ)cos(z/δ − ωt)', sp.re(sp.expand_complex(exp(sI * ((1 + sI) * z / d - w * t)))).subs({}), sp.exp(-z / d) * cos(z / d - w * t)) if False else None
zr, dr_, wr, tr = symbols('zr dr wr tr', positive=True)
ident(D, 'Re[e^(i((1+i)z/δ − ωt))] = e^(−z/δ)cos(z/δ − ωt)', sp.simplify(sp.re(sp.expand_complex(exp(sI * ((1 + sI) * zr / dr_ - wr * tr)))) - exp(-zr / dr_) * cos(zr / dr_ - wr * tr)), 0)
ident(D, 'R_s = Re(Z_s) = ωμ₀δ/2 = 1/(σδ)', (w * mu0 * sqrt(2 / (mu0 * sg * w)) / 2), 1 / (sg * sqrt(2 / (mu0 * sg * w))))
ident(D, 'R_s = √(ωμ₀/(2σ))', 1 / (sg * sqrt(2 / (mu0 * sg * w))), sqrt(w * mu0 / (2 * sg)))
ident(D, 'δ = 1/√(πfμ₀σ) con ω = 2πf', sqrt(2 / (mu0 * sg * 2 * pi * f)), 1 / sqrt(pi * f * mu0 * sg))
# número de onda exacto k = √(ω²μ₀ε₀ + iωμ₀σ) frente a la aproximación del buen conductor
def delta_exact(sg_ms, f_hz):
    w_ = 2 * math.pi * f_hz; kc = mp.sqrt(mp.mpf(w_) ** 2 * MU0 * E0 + 1j * w_ * MU0 * sg_ms * 1e6)
    return 1 / float(mp.im(kc))
for (sg_ms, f_hz) in ((59.6, 60), (59.6, 1e6), (59.6, 1e10), (3.5, 1e6)):
    de = delta_exact(sg_ms, f_hz); da = math.sqrt(2 / (MU0 * sg_ms * 1e6 * 2 * math.pi * f_hz))
    rec(G_STEP, D, f'número de onda exacto con corriente de desplazamiento: δ (σ={sg_ms} MS/m, f={f_hz:g} Hz)', de, da, 'rel 1e-5', abs(de / da - 1) < 1e-5)
# resolución numérica de la ecuación de difusión armónica en el semiespacio (diferencias finitas, sistema complejo)
import scipy.sparse as sps
from scipy.sparse.linalg import spsolve
delta0 = 1.0; N = 4000; L = 12.0; h = L / N
zg = np.arange(N + 1) * h
kcomp2 = 2j / delta0 ** 2
Am = sps.lil_matrix((N + 1, N + 1), dtype=complex); bm = np.zeros(N + 1, dtype=complex)
Am[0, 0] = 1; bm[0] = 1.0
for i in range(1, N):
    Am[i, i - 1] = 1 / h ** 2; Am[i, i] = -2 / h ** 2 + kcomp2; Am[i, i + 1] = 1 / h ** 2
Am[N, N] = 1; bm[N] = 0.0
Esol = spsolve(Am.tocsr(), bm)
Eref = np.exp(-zg / delta0 + 1j * zg / delta0 * (-1) * (-1))
Eref = np.exp(1j * (1 + 1j) * zg / delta0)
err_diff = float(np.max(np.abs(Esol - Eref)))
rec(G_STEP, D, 'ecuación ∇²E = −k²E (k² = 2i/δ²) en el semiespacio por diferencias finitas: E = e^(i(1+i)z/δ)', err_diff, 0.0, 'abs 1e-4', err_diff < 1e-4)
uS = {'delta': 'm', 'mu0': 'H m^-1', 'sigma': 'S m^-1', 'w': 'rad s^-1', 'f': 'Hz', 'Rs': 'Ohm', 'kk': 'm^-1', 'z': 'm'}
dimcheck(D, 'δ = √(2/(μ₀σω))', d, sqrt(2 / (mu0 * sg * w)), uS)
dimcheck(D, 'R_s = 1/(σδ)', Rs, 1 / (sg * d), uS)
dimcheck(D, 'R_s = √(ωμ₀/2σ)', Rs, sqrt(w * mu0 / (2 * sg)), uS)
dimcheck(D, 'δ = 1/√(πfμ₀σ)', d, 1 / sqrt(pi * f * mu0 * sg), uS)
skf = lambda sg_ms, f_hz: (lambda d_: (d_ * 1e3, 1 / (sg_ms * 1e6 * d_) * 1e3, 8.685889638 / (d_ * 1e3), 2 * math.pi * d_ * 1e3))(math.sqrt(2 / (MU0 * sg_ms * 1e6 * 2 * math.pi * f_hz)))
num(D, 'δ (60 Hz) mm', skf(59.6, 60)[0], '8.42'); num(D, 'δ (1 kHz) mm', skf(59.6, 1e3)[0], '2.06'); num(D, 'δ (100 kHz) mm', skf(59.6, 1e5)[0], '0.206'); num(D, 'δ (1 MHz) µm', skf(59.6, 1e6)[0] * 1e3, '65.2'); num(D, 'δ (10 GHz) µm', skf(59.6, 1e10)[0] * 1e3, '0.652')
num(D, 'R_s (1 MHz) mΩ', skf(59.6, 1e6)[1], '0.257'); num(D, 'R_s (10 GHz) mΩ', skf(59.6, 1e10)[1], '25.7'); num(D, 'atenuación (1 MHz) dB/mm', skf(59.6, 1e6)[2], '133'); num(D, '0.1 mm a 1 MHz (dB)', skf(59.6, 1e6)[2] * 0.1, '13', tol=0.03); num(D, '0.1 mm a 10 GHz (dB)', skf(59.6, 1e10)[2] * 0.1, '1332', tol=1e-3)
num(D, 'δ (Al)/δ (Cu) − 1 (%)', (math.sqrt(59.6 / 37.7) - 1) * 100, '26', tol=0.02); num(D, 'δ (3.5 MS/m, 1 MHz) mm', skf(3.5, 1e6)[0], '0.269'); num(D, 'δ agua de mar (1 kHz) m', skf(4e-6, 1e3)[0] / 1e3, '7.96'); num(D, 'δ agua de mar (100 Hz) m', skf(4e-6, 1e2)[0] / 1e3, '25.2'); num(D, 'R_ac/R_dc (a = 1 mm, 1 MHz)', 1.0 / (2 * skf(59.6, 1e6)[0]), '7.7', tol=0.01)
num(D, 'δ valor inicial', skf(59.6, 60)[0], '8.41630'); num(D, 'R_s valor inicial (10⁻³)', skf(59.6, 60)[1] / 1e-3, '1.99357'); num(D, 'atenuación valor inicial', skf(59.6, 60)[2], '1.03203'); num(D, 'λ en el metal valor inicial', skf(59.6, 60)[3], '52.8812')
sgq, fq = symbols('sg f', positive=True)
dq_ = sqrt(2 / (MU0q * sgq * 10 ** 6 * 2 * pi * fq))
fs(D, 'd', dq_ * 1000); fs(D, 'Rs', 1 / (sgq * 10 ** 6 * dq_) * 1000); fs(D, 'att', sp.Float('8.685889638', 40) / (dq_ * 1000)); fs(D, 'lam', 2 * pi * dq_ * 1000)

# ---------------------------------------------------------------- Fresnel
D = 'fresnel-capas'
r_, t_, n1, n2, nc, Rr, Tt, lam, dd = S('r t n1 n2 nc R T lam d')
solves(D, '1 + r = t y n₁(1 − r) = n₂ t ⇒ r', [Eq(1 + r_, t_), Eq(n1 * (1 - r_), n2 * t_)], r_, (n1 - n2) / (n1 + n2), vars=[r_, t_])
solves(D, '1 + r = t y n₁(1 − r) = n₂ t ⇒ t', [Eq(1 + r_, t_), Eq(n1 * (1 - r_), n2 * t_)], t_, 2 * n1 / (n1 + n2), vars=[r_, t_])
ident(D, 'T = (n₂/n₁)t² = 4n₁n₂/(n₁+n₂)²', n2 / n1 * (2 * n1 / (n1 + n2)) ** 2, 4 * n1 * n2 / (n1 + n2) ** 2)
ident(D, 'R + T = 1', ((n1 - n2) / (n1 + n2)) ** 2 + 4 * n1 * n2 / (n1 + n2) ** 2, 1)
Y = nc ** 2 / n2
ident(D, 'r_c = (n₁ − Y)/(n₁ + Y) = (n₁n₂ − n_c²)/(n₁n₂ + n_c²) con Y = n_c²/n₂', (n1 - Y) / (n1 + Y), (n1 * n2 - nc ** 2) / (n1 * n2 + nc ** 2))
solves(D, 'r_c = 0 ⇒ n_c = √(n₁n₂)', [Eq((n1 * n2 - nc ** 2) / (n1 * n2 + nc ** 2), 0)], nc, sqrt(n1 * n2))
ident(D, 'λ/(4n_c): desfase de ida y vuelta 2π(2n_c d)/λ = π', 2 * pi * 2 * nc * (lam / (4 * nc)) / lam, pi)
# método de matrices de transferencia (Hecht) para una capa
def tmm_R(n1_, nc_, n2_, d_nm, lam_nm):
    dlt = 2 * math.pi * nc_ * d_nm / lam_nm
    M = np.array([[math.cos(dlt), 1j * math.sin(dlt) / nc_], [1j * nc_ * math.sin(dlt), math.cos(dlt)]])
    BC = M @ np.array([1.0, n2_])
    r = (n1_ * BC[0] - BC[1]) / (n1_ * BC[0] + BC[1])
    return float(abs(r) ** 2)
fr = lambda n1_, n2_, nc_, lam_: (((n1_ - n2_) / (n1_ + n2_)) ** 2, 4 * n1_ * n2_ / (n1_ + n2_) ** 2, ((n1_ * n2_ - nc_ ** 2) / (n1_ * n2_ + nc_ ** 2)) ** 2, math.sqrt(n1_ * n2_), lam_ / (4 * nc_))
for (n1_, n2_, nc_, lam_) in ((1, 1.5, 1.38, 550), (1, 2.4, 1.38, 550), (1, 3.5, 1.87, 1550), (1.33, 1.5, 1.38, 550)):
    got = tmm_R(n1_, nc_, n2_, lam_ / (4 * nc_), lam_)
    rec(G_STEP, D, f'matriz de transferencia de una capa λ/4: R = ((n₁n₂ − n_c²)/(n₁n₂ + n_c²))² (n₂={n2_}, n_c={nc_})', got, fr(n1_, n2_, nc_, lam_)[2], 'rel 1e-9', abs(got / fr(n1_, n2_, nc_, lam_)[2] - 1) < 1e-9)
rec(G_STEP, D, 'matriz de transferencia sin capa (d = 0): R = ((n₁ − n₂)/(n₁ + n₂))²', tmm_R(1, 1.38, 1.5, 0.0, 550), 0.04, 'abs 1e-12', abs(tmm_R(1, 1.38, 1.5, 0.0, 550) - 0.04) < 1e-12)
lamgrid = np.linspace(300, 1000, 14001)
Rg = np.array([tmm_R(1, 1.38, 1.5, 550 / (4 * 1.38), lm) for lm in lamgrid])
rec(G_STEP, D, 'la reflectancia de la capa de 99.64 nm tiene su mínimo en λ = 550 nm', float(lamgrid[np.argmin(Rg)]), 550.0, 'abs 0.1', abs(lamgrid[np.argmin(Rg)] - 550.0) < 0.1)
Rg2 = np.array([tmm_R(1, 1.38, 1.5, 550 / (4 * 1.38), lm) for lm in (450.0, 650.0)])
rec(G_STEP, D, 'a 450 nm y 650 nm la capa de 550 nm refleja más que en 550 (colores)', float(Rg2.min()), 0.0141, '> 0.0141', Rg2.min() > 0.0141105)
uR = {'r': '1', 't': '1', 'n1': '1', 'n2': '1', 'nc': '1', 'R': '1', 'T': '1', 'lam': 'm', 'd': 'm', 'Y': '1'}
dimcheck(D, 'R = ((n₁ − n₂)/(n₁ + n₂))²', Rr, ((n1 - n2) / (n1 + n2)) ** 2, uR)
dimcheck(D, 'n_c = √(n₁n₂)', nc, sqrt(n1 * n2), uR)
dimcheck(D, 'd = λ/(4n_c)', dd, lam / (4 * nc), uR)
dimcheck(D, 'T = 4n₁n₂/(n₁+n₂)²', Tt, 4 * n1 * n2 / (n1 + n2) ** 2, uR)
num(D, 'R (aire–vidrio)', fr(1, 1.5, 1.38, 550)[0], '0.04'); num(D, 'T', fr(1, 1.5, 1.38, 550)[1], '0.96'); num(D, 'pérdida de dos caras (%)', (1 - 0.96 ** 2) * 100, '7.8'); num(D, 'pérdida de 20 caras (%)', (1 - 0.96 ** 20) * 100, '56', tol=0.01); num(D, 'R con MgF₂ (%)', fr(1, 1.5, 1.38, 550)[2] * 100, '1.41'); num(D, 'espesor (nm)', fr(1, 1.5, 1.38, 550)[4], '99.6', tol=1e-3); num(D, 'n ideal', fr(1, 1.5, 1.38, 550)[3], '1.2247', tol=1e-4); num(D, 'espesor con n ideal', fr(1, 1.5, 1.22474, 550)[4], '112.3', tol=1e-3)
num(D, 'R (n₂ = 2.4) %', fr(1, 2.4, 1.38, 550)[0] * 100, '17.0', tol=3e-3); num(D, 'R con MgF₂ (n₂ = 2.4) %', fr(1, 2.4, 1.38, 550)[2] * 100, '1.33'); num(D, 'R agua–vidrio %', fr(1.33, 1.5, 1.38, 550)[0] * 100, '0.36'); num(D, 'R Si₃N₄ sobre Si (10⁻⁷)', fr(1, 3.5, 1.87, 1550)[2] / 1e-7, '1.96', tol=0.01); num(D, 'espesor Si₃N₄ (nm)', fr(1, 3.5, 1.87, 1550)[4], '207.2')
num(D, 'R valor inicial', fr(1, 1.5, 1.38, 550)[0], '0.04000'); num(D, 'T valor inicial', fr(1, 1.5, 1.38, 550)[1], '0.96000'); num(D, 'R_c valor inicial', fr(1, 1.5, 1.38, 550)[2], '0.0141105'); num(D, 'n ideal valor inicial', fr(1, 1.5, 1.38, 550)[3], '1.22474'); num(D, 'd valor inicial', fr(1, 1.5, 1.38, 550)[4], '99.6377')
n1q, n2q, ncq, lq = symbols('n1 n2 nc lam', positive=True)
fs(D, 'R0', ((n1q - n2q) / (n1q + n2q)) ** 2); fs(D, 'T0', 4 * n1q * n2q / (n1q + n2q) ** 2); fs(D, 'Rc', ((n1q * n2q - ncq ** 2) / (n1q * n2q + ncq ** 2)) ** 2); fs(D, 'nid', sqrt(n1q * n2q)); fs(D, 'd', lq / (4 * ncq))

# ---------------------------------------------------------------- Larmor
D = 'larmor'
q, a, th, r, P, ee, p0, wq, x0, a0, re_, cs = S('q a theta r P ee p0 w x0 a0 re c')
Eth = q * a * sin(th) / (4 * pi * e0 * c ** 2 * r)
ident(D, 'S = ε₀cE_θ² = q²a²sen²θ/(16π²ε₀c³r²)', e0 * c * Eth ** 2, q ** 2 * a ** 2 * sin(th) ** 2 / (16 * pi ** 2 * e0 * c ** 3 * r ** 2))
integral(D, '∫₀^π sen³θ dθ = 4/3', sin(th) ** 3, th, 0, pi, R_(4, 3))
ident(D, 'P = ∮S r² dΩ = (q²a²/16π²ε₀c³)·2π·(4/3) = q²a²/(6πε₀c³)', q ** 2 * a ** 2 / (16 * pi ** 2 * e0 * c ** 3) * 2 * pi * R_(4, 3), q ** 2 * a ** 2 / (6 * pi * e0 * c ** 3))
tx = Symbol('tx', positive=True)
integral(D, '⟨a²⟩ = (1/T)∫(ω²x₀cos ωt)² dt = ω⁴x₀²/2', (wq ** 2 * x0 * cos(wq * tx)) ** 2 * wq / (2 * pi), tx, 0, 2 * pi / wq, wq ** 4 * x0 ** 2 / 2)
ident(D, '⟨P⟩ = q²x₀²ω⁴/(12πε₀c³) = p₀²ω⁴/(12πε₀c³)', q ** 2 * (wq ** 4 * x0 ** 2 / 2) / (6 * pi * e0 * c ** 3), (q * x0) ** 2 * wq ** 4 / (12 * pi * e0 * c ** 3))
# átomo de Bohr clásico
kc = 1 / (4 * pi * e0)
Ee = -kc * ee ** 2 / (2 * r)
ac = kc * ee ** 2 / (Symbol('m', positive=True) * r ** 2)
Pr_ = q ** 2 * ac ** 2 / (6 * pi * e0 * c ** 3)
Pr2 = (R_(2, 3)) * kc * ee ** 2 * ac ** 2 / c ** 3
ident(D, 'P = (2/3) k e² a²/c³ (con q = e)', Pr_.subs(q, ee), Pr2)
rt = Function('r')
dEdt = diff(Ee, r)      # dE/dr; dE/dt = dE/dr dr/dt
re_def = kc * ee ** 2 / (Symbol('m', positive=True) * c ** 2)
drdt = -R_(4, 3) * re_def ** 2 * c / r ** 2
ident(D, 'dE/dt = −P ⇒ dr/dt = −(4/3) r_e² c/r²', sp.simplify(dEdt * drdt + Pr2.subs(q, ee)), 0)
tcol = Symbol('tc', positive=True)
Rr3 = (a0 ** 3 - 4 * re_def ** 2 * c * tcol)
ode(D, 'dr/dt = −(4/3)r_e²c/r² resuelta por r³ = a₀³ − 4r_e²c t', Eq(Function('rr')(tcol).diff(tcol), -R_(4, 3) * re_def ** 2 * c / Function('rr')(tcol) ** 2), Eq(Function('rr')(tcol), (a0 ** 3 - 4 * re_def ** 2 * c * tcol) ** R_(1, 3)))
solves(D, 'r(t) = 0 ⇒ t = a₀³/(4r_e²c)', [Eq(a0 ** 3 - 4 * re_def ** 2 * c * tcol, 0)], tcol, a0 ** 3 / (4 * re_def ** 2 * c))
# integración numérica del colapso clásico (SI) con solve_ivp
re_n = K * qe ** 2 / (me * C ** 2); a0n = 5.29177210903e-11
sol = solve_ivp(lambda tq, y: [-(4 / 3) * re_n ** 2 * C / y[0] ** 2], [0, 1e-10], [a0n], rtol=1e-12, atol=1e-30, events=lambda tq, y: y[0] - 1e-3 * a0n)
t_ev = float(sol.t_events[0][0]); t_ex = (a0n ** 3 - (1e-3 * a0n) ** 3) / (4 * re_n ** 2 * C)
rec(G_STEP, D, 'integración numérica del colapso clásico hasta r = 10⁻³a₀', t_ev, t_ex, 'rel 1e-8', abs(t_ev / t_ex - 1) < 1e-8)
# cuadratura del flujo de Poynting sobre la esfera
def P_num(qn, an):
    Sfun = lambda th_: E0 * C * (qn * an * math.sin(th_) / (4 * math.pi * E0 * C ** 2 * 1.0)) ** 2
    return quad(lambda th_: Sfun(th_) * 2 * math.pi * math.sin(th_), 0, math.pi, epsabs=1e-40, epsrel=1e-12)[0]
rec(G_STEP, D, 'cuadratura del flujo de Poynting: P = q²a²/(6πε₀c³)', P_num(qe, 9.044216e22), (2 / 3) * K * qe ** 2 * 9.044216e22 ** 2 / C ** 3, 'rel 1e-10', abs(P_num(qe, 9.044216e22) / ((2 / 3) * K * qe ** 2 * 9.044216e22 ** 2 / C ** 3) - 1) < 1e-10)
uL = {'P': 'W', 'q': 'C', 'a': 'm s^-2', 'e0': 'F m^-1', 'c': 'm s^-1', 'S': 'W m^-2', 'Eth': 'V m^-1', 'r': 'm', 'p0': 'C m', 'w': 'rad s^-1', 'x0': 'm'}
dimcheck(D, 'P = q²a²/(6πε₀c³)', Symbol('P', positive=True), q ** 2 * a ** 2 / (6 * pi * e0 * c ** 3), uL)
dimcheck(D, 'E_θ = q a senθ/(4πε₀c²r)', Symbol('Eth', positive=True), Eth, dict(uL, theta='rad'))
dimcheck(D, '⟨P⟩ = p₀²ω⁴/(12πε₀c³)', Symbol('P', positive=True), p0 ** 2 * wq ** 4 / (12 * pi * e0 * c ** 3), uL)
dimcheck(D, 'S = q²a²sen²θ/(16π²ε₀c³r²)', Symbol('S', positive=True), q ** 2 * a ** 2 * sin(th) ** 2 / (16 * pi ** 2 * e0 * c ** 3 * r ** 2), dict(uL, theta='rad'))
a_at = K * qe ** 2 / (me * a0n ** 2)
lmf = lambda qn, an: (lambda P_: (P_, P_ / qe, 13.6 / (P_ / qe)))((2 / 3) * K * (qn * qe) ** 2 * an ** 2 / C ** 3)
num(D, 'a del electrón en H (10²²)', a_at / 1e22, '9.044'); num(D, 'P (átomo) 10⁻⁸ W', lmf(1, a_at)[0] / 1e-8, '4.67'); num(D, 'P (eV/s) 10¹¹', lmf(1, a_at)[1] / 1e11, '2.91'); num(D, 't (13.6 eV) 10⁻¹¹ s', lmf(1, a_at)[2] / 1e-11, '4.67', tol=1e-3); num(D, 't de caída 10⁻¹¹ s', a0n ** 3 / (4 * re_n ** 2 * C) / 1e-11, '1.56')
num(D, 'P (a = 10²²) 10⁻¹⁰ W', lmf(1, 1e22)[0] / 1e-10, '5.7'); num(D, 'P (q = 2e) / P (e)', lmf(2, 1e22)[0] / lmf(1, 1e22)[0], '4', tol=1e-12); num(D, 'P (a = 10¹⁵) 10⁻²⁴ W', lmf(1, 1e15)[0] / 1e-24, '5.7'); num(D, 'P (eV/s, a = 10¹⁵) 10⁻⁵', lmf(1, 1e15)[1] / 1e-5, '3.6'); num(D, 'r_e (fm)', re_n * 1e15, '2.818', tol=1e-3)
num(D, 'P valor inicial', lmf(1, 9.044216e22)[0] / 1e-8, '4.66929'); num(D, 'P (eV/s) valor inicial', lmf(1, 9.044216e22)[1] / 1e11, '2.91434'); num(D, 't valor inicial', lmf(1, 9.044216e22)[2] / 1e-11, '4.66658')
qL, aL = symbols('q a', positive=True)
PL = (R_(2, 3)) * Kq_ * (qL * qeq) ** 2 * aL ** 2 / Cq ** 3 if False else (2 / sp.Integer(3)) * (1 / (4 * pi * E0q)) * (qL * qeq) ** 2 * aL ** 2 / Cq ** 3
fs(D, 'P', PL); fs(D, 'Pe', PL / qeq); fs(D, 't', sp.Float('13.6', 40) / (PL / qeq))

# ---------------------------------------------------------------- Rayleigh
D = 'rayleigh'
al, alp, E0r, om, kw, lamr, Ncol, tau_ = S('alpha alphap E0r om kw lamr Ncol tau')
Pdip = al ** 2 * E0r ** 2 * om ** 4 / (12 * pi * e0 * c ** 3)
Iinc = R_(1, 2) * c * e0 * E0r ** 2
ident(D, 'P = p₀²ω⁴/(12πε₀c³) con p₀ = αE₀', (al * E0r) ** 2 * om ** 4 / (12 * pi * e0 * c ** 3), Pdip)
ident(D, 'σ = P/I = α²ω⁴/(6πε₀²c⁴)', Pdip / Iinc, al ** 2 * om ** 4 / (6 * pi * e0 ** 2 * c ** 4))
ident(D, 'σ = (8π/3)k⁴α′² con α = 4πε₀α′ y k = ω/c', (al ** 2 * om ** 4 / (6 * pi * e0 ** 2 * c ** 4)).subs(al, 4 * pi * e0 * alp), R_(8, 3) * pi * (om / c) ** 4 * alp ** 2)
ident(D, '(8π/3)(2π)⁴ = 128π⁵/3 ⇒ σ = 128π⁵α′²/(3λ⁴)', R_(8, 3) * pi * (2 * pi / lamr) ** 4 * alp ** 2, R_(128, 3) * pi ** 5 * alp ** 2 / lamr ** 4)
ode(D, 'dI/dz = −σ n I ⇒ I = I₀e^(−σN_col) (Beer–Lambert)', Eq(Function('Iz')(Symbol('zz', positive=True)).diff(Symbol('zz', positive=True)), -Symbol('sg', positive=True) * Symbol('nn', positive=True) * Function('Iz')(Symbol('zz', positive=True))), Eq(Function('Iz')(Symbol('zz', positive=True)), Symbol('I0', positive=True) * exp(-Symbol('sg', positive=True) * Symbol('nn', positive=True) * Symbol('zz', positive=True))))
ident(D, 'razón azul/rojo: σ(λ₁)/σ(λ₂) = (λ₂/λ₁)⁴', (128 * pi ** 5 * alp ** 2 / (3 * lamr ** 4)) / (128 * pi ** 5 * alp ** 2 / (3 * (2 * lamr) ** 4)), 16)
# cuadratura de la potencia dispersada: P = ∮ S dA con el campo de un dipolo oscilante (diagrama sen²θ)
Pdip_n = lambda p0_, w_: p0_ ** 2 * w_ ** 4 / (12 * math.pi * E0 * C ** 3)
w_n = 2 * math.pi * C / 550e-9; p0n = 4 * math.pi * E0 * 1.74e-30 * 1e0
Pq = quad(lambda th_: (p0n ** 2 * w_n ** 4 * math.sin(th_) ** 2 / (32 * math.pi ** 2 * E0 * C ** 3)) * 2 * math.pi * math.sin(th_), 0, math.pi, epsabs=1e-60, epsrel=1e-12)[0]
rec(G_STEP, D, 'cuadratura del diagrama de radiación sen²θ: ⟨P⟩ = p₀²ω⁴/(12πε₀c³)', Pq, Pdip_n(p0n, w_n), 'rel 1e-10', abs(Pq / Pdip_n(p0n, w_n) - 1) < 1e-10)
uY = {'sigma': 'm^2', 'alphap': 'm^3', 'k': 'm^-1', 'lam': 'm', 'N': 'm^-2', 'tau': '1', 'alpha': 'C m^2 V^-1', 'omega': 'rad s^-1', 'E0': 'V m^-1', 'c': 'm s^-1', 'e0': 'F m^-1'}
dimcheck(D, 'σ = (8π/3)k⁴α′²', Symbol('sigma', positive=True), R_(8, 3) * pi * Symbol('k', positive=True) ** 4 * alp ** 2, dict(uY, alphap='m^3'))
dimcheck(D, 'σ = α²ω⁴/(6πε₀²c⁴)', Symbol('sigma', positive=True), al ** 2 * Symbol('omega', positive=True) ** 4 / (6 * pi * e0 ** 2 * c ** 4), uY)
dimcheck(D, 'τ = σN_col', tau_, Symbol('sigma', positive=True) * Symbol('N', positive=True), uY)
AM = 28.96e-3 / 6.02214076e23; NCOL = 101325 / (AM * 9.80665)
rlf = lambda lam_nm, ap: (lambda k_: (lambda s_: (s_ * 1e31, s_ * NCOL, math.exp(-s_ * NCOL), (650 / lam_nm) ** 4))(8 * math.pi / 3 * k_ ** 4 * (ap * 1e-30) ** 2))(2 * math.pi / (lam_nm * 1e-9))
num(D, 'N_col (10²⁹)', NCOL / 1e29, '2.149'); num(D, 'σ (550 nm) 10⁻³¹', rlf(550, 1.74)[0], '4.32'); num(D, 'τ (550)', rlf(550, 1.74)[1], '0.0928'); num(D, 'transmisión (550) %', rlf(550, 1.74)[2] * 100, '91.1'); num(D, 'dispersión (550) %', (1 - rlf(550, 1.74)[2]) * 100, '8.9')
num(D, '(650/450)⁴', rlf(450, 1.74)[3], '4.35'); num(D, '(650/400)⁴', rlf(400, 1.74)[3], '6.97'); num(D, 'τ (450)', rlf(450, 1.74)[1], '0.207'); num(D, 'transmisión (450) %', rlf(450, 1.74)[2] * 100, '81.3'); num(D, 'τ (650)', rlf(650, 1.74)[1], '0.0476'); num(D, 'transmisión (650) %', rlf(650, 1.74)[2] * 100, '95.4'); num(D, 'σ (α′ doble) 10⁻³¹', rlf(550, 3.48)[0], '17.3')
num(D, 'σ valor inicial', rlf(550, 1.74)[0], '4.32002'); num(D, 'τ valor inicial', rlf(550, 1.74)[1], '0.0928184'); num(D, 'transmisión valor inicial', rlf(550, 1.74)[2], '0.911359'); num(D, 'relación valor inicial', rlf(550, 1.74)[3], '1.95075')
lamq, apq = symbols('lam ap', positive=True)
Nc_q = sp.Float('101325', 40) / (sp.Float('28.96e-3', 40) / sp.Float('6.02214076e23', 40) * sp.Float('9.80665', 40))
sq_ = R_(8, 3) * pi * (2 * pi / (lamq * sp.Float('1e-9', 40))) ** 4 * (apq * sp.Float('1e-30', 40)) ** 2
fs(D, 's', sq_ * sp.Float('1e31', 40)); fs(D, 'tau', sq_ * Nc_q); fs(D, 'T', exp(-sq_ * Nc_q)); fs(D, 'rel', (650 / lamq) ** 4)
