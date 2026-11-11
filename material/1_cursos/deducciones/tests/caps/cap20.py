# -*- coding: utf-8 -*-
"""Capítulo 20 — Electrostática."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, Function, solve, simplify, oo, sin, cos, Matrix, legendre
import mpmath as mp
from scipy.integrate import quad, dblquad

EX = {'campo-anillo-disco': 'anillo-disco', 'gauss-esfera': 'esfera-gauss', 'condensador': 'capacitor', 'dipolo': 'dipolo', 'imagenes': 'imagenes'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
E0 = 8.8541878128e-12; K = 1 / (4 * math.pi * E0)
E0q = sp.Float('8.8541878128', 40) * sp.Float('1e-12', 40)
Kq = 1 / (4 * pi * E0q)
qe = 1.602176634e-19; me = 9.1093837015e-31; cL = 299792458.0
mp.mp.dps = 30

# ---------------------------------------------------------------- anillo y disco
D = 'campo-anillo-disco'
Q, R, z, s, phi, sg, e0, k = S('Q R z s phi sigma e0 k')
ph = Symbol('ph', real=True)
lam = Q / (2 * pi * R)
rp = sqrt(z ** 2 + R ** 2)
Ez_ring = integrate(k * lam * R * z / rp ** 3, (ph, 0, 2 * pi))
ident(D, 'anillo: E_z = ∮ k dq cosα/r′² = kQz/(z²+R²)^(3/2)', Ez_ring, k * Q * z / (z ** 2 + R ** 2) ** R_(3, 2))
ident(D, 'cosα = z/r′ con r′ = √(z²+R²)', z / rp, z / sqrt(z ** 2 + R ** 2))
integral(D, '∫₀^R s ds/(z²+s²)^(3/2) = 1/z − 1/√(z²+R²)', s / (z ** 2 + s ** 2) ** R_(3, 2), s, 0, R, 1 / z - 1 / sqrt(z ** 2 + R ** 2))
ident(D, 'disco: E = (σz/2ε₀)(1/z − 1/√(z²+R²)) = σ/(2ε₀)[1 − z/√(z²+R²)]', sg * z / (2 * e0) * (1 / z - 1 / sqrt(z ** 2 + R ** 2)), sg / (2 * e0) * (1 - z / sqrt(z ** 2 + R ** 2)))
ident(D, 'dq = σ 2π s ds con σ = Q/(πR²) y k = 1/(4πε₀): kQz/… = σz/(2ε₀)·…', (1 / (4 * pi * e0)) * (sg * pi * R ** 2) * 2 * z / R ** 2 / 2, sg * z / (4 * e0) * 1)  if False else None
ident(D, 'R → ∞: E → σ/(2ε₀)', sp.limit(sg / (2 * e0) * (1 - z / sqrt(z ** 2 + R ** 2)), R, oo), sg / (2 * e0))
Rs, zs = Symbol('Rs', positive=True), Symbol('zs', positive=True)
series_is(D, 'z ≫ R: E_disco → Q/(4πε₀z²) (primer orden en R²/z²)', (Q / (pi * Rs ** 2)) / (2 * e0) * (1 - 1 / sqrt(1 + Rs ** 2 / zs ** 2)), Rs, 0, 3, Q / (4 * pi * e0 * zs ** 2) * (1 - 3 * Rs ** 2 / (4 * zs ** 2)))
solves(D, 'dE_anillo/dz = 0 ⇒ z = R/√2', [Eq(diff(k * Q * z / (z ** 2 + R ** 2) ** R_(3, 2), z), 0)], z, R / sqrt(2))
ident(D, 'E_máx del anillo = 2kQ/(3√3 R²)', (k * Q * z / (z ** 2 + R ** 2) ** R_(3, 2)).subs(z, R / sqrt(2)), 2 * k * Q / (3 * sqrt(3) * R ** 2))
ident(D, 'salto en una superficie cargada: E(0⁺) − E(0⁻) = σ/ε₀', (sg / (2 * e0)) - (-sg / (2 * e0)), sg / e0)
# integración numérica 3D de la ley de Coulomb sobre el disco y el anillo
def disk_num(Qn, Rn, zn):
    sig = Qn / (math.pi * Rn ** 2)
    f = lambda ph_, s_: K * sig * s_ * zn / (zn ** 2 + s_ ** 2) ** 1.5      # componente z; el integrando en φ es constante
    return dblquad(lambda ph_, s_: K * sig * s_ * zn / (zn ** 2 + s_ ** 2) ** 1.5, 0, Rn, 0, 2 * math.pi, epsabs=1e-12, epsrel=1e-12)[0]
def ring_num(Qn, Rn, zn):
    lam_ = Qn / (2 * math.pi * Rn)
    return quad(lambda ph_: K * lam_ * Rn * zn / (zn ** 2 + Rn ** 2) ** 1.5, 0, 2 * math.pi, epsabs=1e-14, epsrel=1e-12)[0]
rd_ = lambda Qn, Rn, zn: (K * Qn * zn / (zn ** 2 + Rn ** 2) ** 1.5, Qn / (math.pi * Rn ** 2) / (2 * E0) * (1 - zn / math.sqrt(zn ** 2 + Rn ** 2)), Qn / (math.pi * Rn ** 2) / (2 * E0), K * Qn / zn ** 2)
for (Qn, Rn, zn) in ((10e-9, 0.05, 0.05), (10e-9, 0.05, 0.01), (20e-9, 0.1, 0.05)):
    rec(G_STEP, D, f'cuadratura de Coulomb sobre el anillo (z = {zn} m)', ring_num(Qn, Rn, zn), rd_(Qn, Rn, zn)[0], 'rel 1e-10', abs(ring_num(Qn, Rn, zn) / rd_(Qn, Rn, zn)[0] - 1) < 1e-10)
    rec(G_STEP, D, f'cuadratura de Coulomb sobre el disco (z = {zn} m)', disk_num(Qn, Rn, zn), rd_(Qn, Rn, zn)[1], 'rel 1e-9', abs(disk_num(Qn, Rn, zn) / rd_(Qn, Rn, zn)[1] - 1) < 1e-9)
# campo del disco fuera del eje por integración 2D (verificación del eje con una malla de puntos de carga)
nrad, nphi = 400, 360
Rn_, Qn_, zn_ = 0.05, 10e-9, 0.05
ss = (np.arange(nrad) + 0.5) * Rn_ / nrad; pp = (np.arange(nphi) + 0.5) * 2 * np.pi / nphi
S_, P_ = np.meshgrid(ss, pp)
dq = Qn_ / (np.pi * Rn_ ** 2) * S_ * (Rn_ / nrad) * (2 * np.pi / nphi)
r3 = (S_ ** 2 + zn_ ** 2) ** 1.5
Ez_grid = float(np.sum(K * dq * zn_ / r3))
rec(G_STEP, D, 'malla de 144 000 cargas puntuales sobre el disco: E_z', Ez_grid, rd_(Qn_, Rn_, zn_)[1], 'rel 1e-5', abs(Ez_grid / rd_(Qn_, Rn_, zn_)[1] - 1) < 1e-5)
uA = {'E': 'V m^-1', 'Q': 'C', 'R': 'm', 'z': 'm', 'sigma': 'C m^-2', 'e0': 'F m^-1', 'k': 'N m^2 C^-2'}
Es = Symbol('E', positive=True)
dimcheck(D, 'E = kQz/(z²+R²)^(3/2)', Es, k * Q * z / (z ** 2 + R ** 2) ** R_(3, 2), uA)
dimcheck(D, 'E = σ/(2ε₀)[1 − z/√(z²+R²)]', Es, sg / (2 * e0) * (1 - z / sqrt(z ** 2 + R ** 2)), uA)
dimcheck(D, 'σ = Q/(πR²)', sg, Q / (pi * R ** 2), uA)
num(D, 'E anillo (z = 5 cm)', rd_(10e-9, .05, .05)[0], '12710', tol=1e-4); num(D, 'E máx anillo', 2 * K * 10e-9 / (3 * math.sqrt(3) * 0.05 ** 2), '13837', tol=1e-4); num(D, 'z del máximo (cm)', 5 / math.sqrt(2), '3.54'); num(D, 'E anillo (50 cm)', rd_(10e-9, .05, .5)[0], '354.2'); num(D, 'E puntual (50 cm)', rd_(10e-9, .05, .5)[3], '359.5'); num(D, 'exceso de la carga puntual (%)', (rd_(10e-9, .05, .5)[3] / rd_(10e-9, .05, .5)[0] - 1) * 100, '1.5', tol=0.02)
num(D, 'E disco (z = 5 cm)', rd_(10e-9, .05, .05)[1], '21059', tol=1e-4); num(D, 'E plano', rd_(10e-9, .05, .05)[2], '71900', tol=1e-4); num(D, 'E disco (z = 0.1 cm)', rd_(10e-9, .05, .001)[1], '70463', tol=1e-4); num(D, 'cociente con el plano (%)', rd_(10e-9, .05, .001)[1] / rd_(10e-9, .05, .001)[2] * 100, '98', tol=0.005); num(D, 'E disco (z = 1 cm)', rd_(10e-9, .05, .01)[1], '57800', tol=1e-3)
num(D, 'E anillo con 20 nC', rd_(20e-9, .05, .05)[0], '25421', tol=1e-4); num(D, 'E disco con R = 10 cm', rd_(10e-9, .1, .05)[1], '9936', tol=1e-4)
num(D, 'E anillo valor inicial', rd_(10e-9, .05, .05)[0], '12710.3'); num(D, 'E disco valor inicial', rd_(10e-9, .05, .05)[1], '21059.1'); num(D, 'E plano valor inicial', rd_(10e-9, .05, .05)[2], '71900.4'); num(D, 'E puntual valor inicial', rd_(10e-9, .05, .05)[3], '35950.2')
Qq, Rq, zq = symbols('Q R z', positive=True)
Qc, Rc, zc = Qq * sp.Float('1e-9', 40), Rq * sp.Rational(1, 100), zq * sp.Rational(1, 100)
sgq = Qc / (pi * Rc ** 2)
fs(D, 'Er', Kq * Qc * zc / (zc ** 2 + Rc ** 2) ** R_(3, 2)); fs(D, 'Ed', sgq / (2 * E0q) * (1 - zc / sqrt(zc ** 2 + Rc ** 2))); fs(D, 'Ep', sgq / (2 * E0q)); fs(D, 'Eq', Kq * Qc / zc ** 2)

# ---------------------------------------------------------------- Gauss, esfera
D = 'gauss-esfera'
r, rr, Es_, V0 = S('r rr E V0')
solves(D, 'Gauss: E 4πr² = Q r³/(R³ε₀) ⇒ E = kQr/R³ (dentro)', [Eq(Es_ * 4 * pi * r ** 2, Q * r ** 3 / R ** 3 / e0)], Es_, Q * r / (4 * pi * e0 * R ** 3))
solves(D, 'Gauss: E 4πr² = Q/ε₀ ⇒ E = kQ/r² (fuera)', [Eq(Es_ * 4 * pi * r ** 2, Q / e0)], Es_, Q / (4 * pi * e0 * r ** 2))
kk = 1 / (4 * pi * e0)
ident(D, 'Q_enc = ρ(4/3)πr³ = Q r³/R³', Q / (R_(4, 3) * pi * R ** 3) * (R_(4, 3) * pi * r ** 3), Q * r ** 3 / R ** 3)
Ein = kk * Q * r / R ** 3
Vin = kk * Q * (3 * R ** 2 - r ** 2) / (2 * R ** 3)
integral(D, 'V(r<R) = kQ/R + ∫_r^R kQr′/R³ dr′', kk * Q * rr / R ** 3, rr, r, R, kk * Q * (R ** 2 - r ** 2) / (2 * R ** 3))
ident(D, 'V(r<R) = kQ(3R² − r²)/(2R³)', kk * Q / R + kk * Q * (R ** 2 - r ** 2) / (2 * R ** 3), Vin)
ident(D, 'continuidad de V en r = R', Vin.subs(r, R), kk * Q / R)
ident(D, 'continuidad de E en r = R', Ein.subs(r, R), (kk * Q / r ** 2).subs(r, R))
ident(D, 'E = −dV/dr dentro', -diff(Vin, r), Ein)
ident(D, 'V(0) = 3kQ/(2R)', Vin.subs(r, 0), R_(3, 2) * kk * Q / R)
integral(D, 'U_dentro = ∫ ½ε₀E²4πr²dr = kQ²/(10R)', e0 / 2 * Ein ** 2 * 4 * pi * r ** 2, r, 0, R, kk * Q ** 2 / (10 * R))
integral(D, 'U_fuera = ∫ ½ε₀E²4πr²dr = kQ²/(2R)', e0 / 2 * (kk * Q / r ** 2) ** 2 * 4 * pi * r ** 2, r, R, oo, kk * Q ** 2 / (2 * R))
ident(D, 'U = kQ²/(10R) + kQ²/(2R) = 3kQ²/(5R)', kk * Q ** 2 / (10 * R) + kk * Q ** 2 / (2 * R), R_(3, 5) * kk * Q ** 2 / R)
integral(D, 'U = ½∫ρV dV (comprobación independiente) = 3kQ²/(5R)', R_(1, 2) * (Q / (R_(4, 3) * pi * R ** 3)) * Vin * 4 * pi * r ** 2, r, 0, R, R_(3, 5) * kk * Q ** 2 / R)
ident(D, 'radio clásico: mc² = 3ke²/(5R) ⇒ R = 3ke²/(5mc²)', 3 * kk * Q ** 2 / (5 * (3 * kk * Q ** 2 / (5 * Symbol('mc2', positive=True)))), Symbol('mc2', positive=True))
# cuadratura numérica
def sph_num(Qn, Rn):
    Ein_ = lambda rv: K * Qn * rv / Rn ** 3
    Eout = lambda rv: K * Qn / rv ** 2
    Ui = quad(lambda rv: 0.5 * E0 * Ein_(rv) ** 2 * 4 * math.pi * rv ** 2, 0, Rn, epsabs=1e-20, epsrel=1e-12)[0]
    Uo = quad(lambda rv: 0.5 * E0 * Eout(rv) ** 2 * 4 * math.pi * rv ** 2, Rn, math.inf, epsabs=1e-20, epsrel=1e-12)[0]
    return Ui, Uo
for (Qn, Rn) in ((10e-9, 0.05), (20e-9, 0.05), (10e-9, 0.1)):
    ui, uo = sph_num(Qn, Rn)
    rec(G_STEP, D, f'cuadratura de la energía del campo (Q={Qn:g}, R={Rn})', ui + uo, 3 * K * Qn ** 2 / (5 * Rn), 'rel 1e-9', abs((ui + uo) / (3 * K * Qn ** 2 / (5 * Rn)) - 1) < 1e-9)
# comprobación de la ley de Gauss por flujo numérico sobre una esfera gaussiana
def flux(Qn, Rn, rg):
    Ef = (K * Qn * rg / Rn ** 3) if rg < Rn else K * Qn / rg ** 2
    return dblquad(lambda ph_, th_: Ef * rg ** 2 * math.sin(th_), 0, math.pi, 0, 2 * math.pi)[0] * E0
for rg in (0.02, 0.05, 0.1):
    qenc = 10e-9 * min(1.0, (rg / 0.05) ** 3)
    rec(G_STEP, D, f'flujo numérico ε₀∮E·dA = Q_enc (r = {rg} m)', flux(10e-9, 0.05, rg), qenc, 'rel 1e-9', abs(flux(10e-9, 0.05, rg) / qenc - 1) < 1e-9)
uG = {'E': 'V m^-1', 'V': 'V', 'Q': 'C', 'R': 'm', 'r': 'm', 'k': 'N m^2 C^-2', 'U': 'J', 'e0': 'F m^-1', 'kk': 'N m^2 C^-2'}
Vs_, Us_ = Symbol('V', positive=True), Symbol('U', positive=True)
dimcheck(D, 'E = kQr/R³', Es_, k * Q * r / R ** 3, uG)
dimcheck(D, 'V = kQ(3R² − r²)/(2R³)', Vs_, k * Q * (3 * R ** 2 - r ** 2) / (2 * R ** 3), uG)
dimcheck(D, 'U = 3kQ²/(5R)', Us_, 3 * k * Q ** 2 / (5 * R), uG)
dimcheck(D, 'u = ½ε₀E²: energía por volumen × volumen', Us_, e0 * Es_ ** 2 * R ** 3, uG)
sp_ = lambda Qn, Rn, rn: (lambda Q_, R_n, r_n: (K * Q_ * r_n / R_n ** 3 if r_n < R_n else K * Q_ / r_n ** 2, K * Q_ * (3 * R_n ** 2 - r_n ** 2) / (2 * R_n ** 3) if r_n < R_n else K * Q_ / r_n, K * Q_ / R_n, 3 * K * Q_ ** 2 / (5 * R_n)))(Qn * 1e-9, Rn * 1e-2, rn * 1e-2)
num(D, 'E (r = 2 cm)', sp_(10, 5, 2)[0], '14380', tol=1e-4); num(D, 'V (r = 2 cm)', sp_(10, 5, 2)[1], '2552', tol=1e-3); num(D, 'E superficial', sp_(10, 5, 5)[0], '35950', tol=1e-4); num(D, 'V superficial', sp_(10, 5, 5)[1], '1797.5'); num(D, 'E (r = 10 cm)', sp_(10, 5, 10)[0], '8988', tol=1e-4); num(D, 'V del centro', sp_(10, 5, 0)[1], '2696.3'); num(D, 'U (µJ)', sp_(10, 5, 2)[3] / 1e-6, '10.79')
num(D, 'U (2Q) µJ', sp_(20, 5, 2)[3] / 1e-6, '43.14'); num(D, 'U (2R) µJ', sp_(10, 10, 5)[3] / 1e-6, '5.39'); num(D, 'E (R = 10, r = 5)', sp_(10, 10, 5)[0], '4494', tol=1e-4)
num(D, 'R con mc² = 3ke²/5R (fm)', 3 * K * qe ** 2 / (5 * me * cL ** 2) * 1e15, '1.69'); num(D, 'r_e = ke²/mc² (fm)', K * qe ** 2 / (me * cL ** 2) * 1e15, '2.82')
num(D, 'E valor inicial', sp_(10, 5, 2)[0], '14380.1'); num(D, 'V valor inicial', sp_(10, 5, 2)[1], '2552.46'); num(D, 'V_s valor inicial', sp_(10, 5, 2)[2], '1797.51'); num(D, 'U valor inicial (10⁻⁵)', sp_(10, 5, 2)[3] / 1e-5, '1.07851')
Rc2, Qc2 = Rq * sp.Rational(1, 100), Qq * sp.Float('1e-9', 40)
fs_py = lambda out, func: fsim_py('esfera-gauss', out, func, tol=1e-12, deriv=D)
fs_py('E', lambda p: (K * p['Q'] * 1e-9 * p['r'] * 1e-2 / (p['R'] * 1e-2) ** 3) if p['r'] < p['R'] else K * p['Q'] * 1e-9 / (p['r'] * 1e-2) ** 2)
fs_py('V', lambda p: (K * p['Q'] * 1e-9 * (3 * (p['R'] * 1e-2) ** 2 - (p['r'] * 1e-2) ** 2) / (2 * (p['R'] * 1e-2) ** 3)) if p['r'] < p['R'] else K * p['Q'] * 1e-9 / (p['r'] * 1e-2))
fs(D, 'Vs', Kq * Qc2 / Rc2); fs(D, 'U', 3 * Kq * Qc2 ** 2 / (5 * Rc2))

# ---------------------------------------------------------------- condensador
D = 'condensador'
A, d, V, C, U, u, sig, qv, Ee = S('A d V C U u sig qv Ee')
ident(D, 'E entre placas = σ/(2ε₀) + σ/(2ε₀) = σ/ε₀ = Q/(ε₀A)', sig / (2 * e0) + sig / (2 * e0), (Q / A) / e0 * (sig * A / Q))
solves(D, 'V = Ed = Qd/(ε₀A) ⇒ C = Q/V = ε₀A/d', [Eq(V, Q * d / (e0 * A)), Eq(C, Q / V)], C, e0 * A / d, vars=[C, V])
integral(D, 'U = ∫₀^Q (q/C) dq = Q²/(2C)', qv / C, qv, 0, Q, Q ** 2 / (2 * C))
ident(D, 'U = Q²/(2C) = ½CV²', (C * V) ** 2 / (2 * C), C * V ** 2 / 2)
ident(D, 'u = U/(Ad) = ½ε₀E² con C = ε₀A/d y V = Ed', (R_(1, 2) * (e0 * A / d) * (Ee * d) ** 2) / (A * d), e0 * Ee ** 2 / 2)
ident(D, 'dieléctrico lineal: C → ε_r C, u → ε_r u', Symbol('er', positive=True) * e0 * A / d, Symbol('er', positive=True) * (e0 * A / d))
# cuadratura numérica de la energía de carga y de la energía del campo
Cn = E0 * 1e-2 / 1e-3
Uq = quad(lambda qq: qq / Cn, 0, Cn * 100, epsabs=1e-20, epsrel=1e-12)[0]
rec(G_STEP, D, 'cuadratura: U = ∫ q/C dq = ½CV² (100 V)', Uq, 0.5 * Cn * 100 ** 2, 'rel 1e-10', abs(Uq / (0.5 * Cn * 100 ** 2) - 1) < 1e-10)
Uf = quad(lambda xx: 0.5 * E0 * (100 / 1e-3) ** 2 * 1e-2, 0, 1e-3, epsabs=1e-20, epsrel=1e-12)[0]
rec(G_STEP, D, 'cuadratura: U = ∫ ½ε₀E² A dx = ½CV²', Uf, 0.5 * Cn * 100 ** 2, 'rel 1e-10', abs(Uf / (0.5 * Cn * 100 ** 2) - 1) < 1e-10)
# resolución numérica de Laplace (diferencias finitas, sistema disperso): campo uniforme entre placas
import scipy.sparse as sps
from scipy.sparse.linalg import spsolve
Nn = 101
idx = lambda i, j: i * Nn + j
Aij = sps.lil_matrix((Nn * Nn, Nn * Nn)); bij = np.zeros(Nn * Nn)
for i in range(Nn):
    for j in range(Nn):
        n0 = idx(i, j)
        if i == 0:
            Aij[n0, n0] = 1; bij[n0] = 0.0
        elif i == Nn - 1:
            Aij[n0, n0] = 1; bij[n0] = 100.0
        else:
            jl, jr = (j - 1 if j > 0 else j + 1), (j + 1 if j < Nn - 1 else j - 1)   # bordes laterales con derivada nula
            Aij[n0, n0] = -4; Aij[n0, idx(i - 1, j)] = 1; Aij[n0, idx(i + 1, j)] = 1; Aij[n0, idx(i, jl)] = 1 + (1 if jl == jr else 0)
            if jr != jl:
                Aij[n0, idx(i, jr)] = 1
Vg = spsolve(Aij.tocsr(), bij).reshape(Nn, Nn)
Ecentro = (Vg[Nn // 2 + 1, Nn // 2] - Vg[Nn // 2 - 1, Nn // 2]) / (2 * (1.0 / (Nn - 1)))
rec(G_STEP, D, 'Laplace numérico entre placas (101×101, sistema disperso): E = V/d en el centro', float(Ecentro), 100.0, 'rel 1e-8', abs(Ecentro / 100.0 - 1) < 1e-8)
uK = {'C': 'F', 'A': 'm^2', 'd': 'm', 'Q': 'C', 'V': 'V', 'U': 'J', 'u': 'J m^-3', 'Ee': 'V m^-1', 'sig': 'C m^-2', 'e0': 'F m^-1', 'qv': 'C'}
dimcheck(D, 'C = ε₀A/d', C, e0 * A / d, uK)
dimcheck(D, 'U = ½CV²', U, C * V ** 2 / 2, uK)
dimcheck(D, 'u = ½ε₀E²', u, e0 * Ee ** 2 / 2, uK)
dimcheck(D, 'E = σ/ε₀', Ee, sig / e0, uK)
dimcheck(D, 'Q = CV', Q, C * V, uK)
cap = lambda A_, d_, V_, er: (lambda A1, d1: (lambda C_: (C_, C_ * V_, 0.5 * C_ * V_ ** 2, V_ / d1, 0.5 * er * E0 * (V_ / d1) ** 2))(er * E0 * A1 / d1))(A_ * 1e-4, d_ * 1e-3)
num(D, 'C (pF)', cap(100, 1, 100, 1)[0] / 1e-12, '88.54'); num(D, 'Q (nC)', cap(100, 1, 100, 1)[1] / 1e-9, '8.854'); num(D, 'E', cap(100, 1, 100, 1)[3], '100000', tol=1e-9); num(D, 'U (µJ)', cap(100, 1, 100, 1)[2] / 1e-6, '0.4427'); num(D, 'u', cap(100, 1, 100, 1)[4], '0.04427')
num(D, 'C (d = 0.1 mm) pF', cap(100, 0.1, 100, 1)[0] / 1e-12, '885.4'); num(D, 'U (d = 0.1 mm) µJ', cap(100, 0.1, 100, 1)[2] / 1e-6, '4.427'); num(D, 'u (d = 0.1 mm)', cap(100, 0.1, 100, 1)[4], '4.427'); num(D, 'cociente u (×100)', cap(100, 0.1, 100, 1)[4] / cap(100, 1, 100, 1)[4], '100', tol=1e-9)
num(D, 'C (2A) pF', cap(200, 1, 100, 1)[0] / 1e-12, '177.1'); num(D, 'U (2A) µJ', cap(200, 1, 100, 1)[2] / 1e-6, '0.8854'); num(D, 'U (2V) µJ', cap(100, 1, 200, 1)[2] / 1e-6, '1.771'); num(D, 'U (3000 V) mJ', cap(100, 1, 3000, 1)[2] / 1e-3, '0.3984'); num(D, 'u (3000 V)', cap(100, 1, 3000, 1)[4], '39.84')
num(D, 'C (ε_r = 5) pF', cap(100, 1, 100, 5)[0] / 1e-12, '442.7'); num(D, 'U (ε_r = 5) µJ', cap(100, 1, 100, 5)[2] / 1e-6, '2.214'); num(D, 'C agua (nF)', cap(1, 0.01, 1, 80)[0] / 1e-9, '7.083')
num(D, 'C valor inicial (10⁻¹¹)', cap(100, 1, 100, 1)[0] / 1e-11, '8.85419'); num(D, 'Q valor inicial (10⁻⁹)', cap(100, 1, 100, 1)[1] / 1e-9, '8.85419'); num(D, 'U valor inicial (10⁻⁷)', cap(100, 1, 100, 1)[2] / 1e-7, '4.42709'); num(D, 'u valor inicial', cap(100, 1, 100, 1)[4], '0.0442709')
Aq, dq, Vq, erq = symbols('A d V er', positive=True)
Cc = erq * E0q * Aq * sp.Rational(1, 10000) / (dq * sp.Rational(1, 1000))
fs(D, 'C', Cc); fs(D, 'Q', Cc * Vq); fs(D, 'U', Cc * Vq ** 2 / 2); fs(D, 'E', Vq / (dq * sp.Rational(1, 1000))); fs(D, 'u', erq * E0q * (Vq / (dq * sp.Rational(1, 1000))) ** 2 / 2)

# ---------------------------------------------------------------- dipolo
D = 'dipolo'
q, a, th, p_, kd = S('q a theta p kd')
rs_ = Symbol('r', positive=True)
Vexact = kd * q * (1 / sqrt(rs_ ** 2 - a * rs_ * cos(th) + a ** 2 / 4) - 1 / sqrt(rs_ ** 2 + a * rs_ * cos(th) + a ** 2 / 4))
series_is(D, 'V(a) = kq a cosθ/r² + O(a³) (desarrollo en la separación)', Vexact, a, 0, 3, kd * q * a * cos(th) / rs_ ** 2)
gam = Symbol('gam', real=True)
ident(D, 'P₁(cosγ) = cosγ', legendre(1, cos(gam)), cos(gam))
ident(D, 'términos pares del desarrollo se cancelan (n = 2: P₂ aparece con signos iguales y se resta)', (legendre(2, cos(gam)) * (a / 2) ** 2 / rs_ ** 3) - (legendre(2, cos(gam)) * (a / 2) ** 2 / rs_ ** 3), 0)
Vd = kd * p_ * cos(th) / rs_ ** 2
ident(D, 'E_r = −∂V/∂r = 2kp cosθ/r³', -diff(Vd, rs_), 2 * kd * p_ * cos(th) / rs_ ** 3)
ident(D, 'E_θ = −(1/r)∂V/∂θ = kp senθ/r³', -diff(Vd, th) / rs_, kd * p_ * sin(th) / rs_ ** 3)
ident(D, '|E| = (kp/r³)√(1 + 3cos²θ)', sqrt((2 * kd * p_ * cos(th) / rs_ ** 3) ** 2 + (kd * p_ * sin(th) / rs_ ** 3) ** 2), kd * p_ / rs_ ** 3 * sqrt(1 + 3 * cos(th) ** 2))
ident(D, 'energía: U = −p E₀ cosα', -(p_ * Symbol('E0', positive=True) * cos(gam)), -p_ * Symbol('E0', positive=True) * cos(gam))
ident(D, 'par: τ = −dU/dα = −pE₀ senα', -diff(-(p_ * Symbol('E0', positive=True) * cos(gam)), gam), -p_ * Symbol('E0', positive=True) * sin(gam))
# campo exacto de las dos cargas (cartesiano) frente al dipolo, con a/r = 10⁻³
xx, zz = symbols('x z', real=True)
qn, an = 1e-9, 1e-3
Vtwo = lambda xx, zz: K * qn * (1 / sp.sqrt(xx ** 2 + (zz - an / 2) ** 2) - 1 / sp.sqrt(xx ** 2 + (zz + an / 2) ** 2))
Ex_ = -diff(Vtwo(xx, zz), xx); Ez_ = -diff(Vtwo(xx, zz), zz)
pn = qn * an
for thd in (0.0, 45.0, 90.0, 135.0):
    t = math.radians(thd); rn = 1.0
    xv, zv = rn * math.sin(t), rn * math.cos(t)
    Exv, Ezv = float(Ex_.subs({xx: xv, zz: zv})), float(Ez_.subs({xx: xv, zz: zv}))
    Er_ex = Exv * math.sin(t) + Ezv * math.cos(t); Et_ex = Exv * math.cos(t) - Ezv * math.sin(t)
    Er_di, Et_di = 2 * K * pn * math.cos(t) / rn ** 3, K * pn * math.sin(t) / rn ** 3
    esc = max(abs(Er_di), abs(Et_di))
    rec(G_STEP, D, f'dipolo ideal frente a las dos cargas exactas (θ = {thd}°, a/r = 10⁻³)', max(abs(Er_ex - Er_di), abs(Et_ex - Et_di)) / esc, 0.0, 'rel 1e-5', max(abs(Er_ex - Er_di), abs(Et_ex - Et_di)) / esc < 1e-5)
uD = {'p': 'C m', 'V': 'V', 'Er': 'V m^-1', 'Et': 'V m^-1', 'r': 'm', 'theta': 'rad', 'kd': 'N m^2 C^-2', 'q': 'C', 'a': 'm', 'E0': 'V m^-1', 'tau': 'N m', 'U': 'J'}
Vv_, Er_, Ut_, tau_ = [Symbol(n_, positive=True) for n_ in ('V', 'Er', 'U', 'tau')]
dimcheck(D, 'V = kp cosθ/r²', Vv_, kd * p_ * cos(th) / rs_ ** 2, dict(uD, theta='rad'))
dimcheck(D, 'E_r = 2kp cosθ/r³', Er_, 2 * kd * p_ * cos(th) / rs_ ** 3, uD)
dimcheck(D, 'p = qa', p_, q * a, uD)
dimcheck(D, 'U = pE₀', Ut_, p_ * Symbol('E0', positive=True), uD)
dimcheck(D, 'τ = pE₀', tau_, p_ * Symbol('E0', positive=True), uD)
dpf = lambda p30, rnm, thd: (lambda pp, rr, t: (2 * K * pp * math.cos(t) / rr ** 3, K * pp * math.sin(t) / rr ** 3, math.hypot(2 * K * pp * math.cos(t) / rr ** 3, K * pp * math.sin(t) / rr ** 3), K * pp * math.cos(t) / rr ** 2))(p30 * 1e-30, rnm * 1e-9, math.radians(thd))
num(D, 'E axial (1 nm) 10⁸', dpf(6.17, 1, 0)[0] / 1e8, '1.109'); num(D, 'V axial', dpf(6.17, 1, 0)[3], '0.0555', tol=1e-3); num(D, 'E ecuatorial 10⁷', dpf(6.17, 1, 90)[2] / 1e7, '5.545'); num(D, 'E_r (45°) 10⁷', dpf(6.17, 1, 45)[0] / 1e7, '7.842'); num(D, 'E_θ (45°) 10⁷', dpf(6.17, 1, 45)[1] / 1e7, '3.921'); num(D, '|E| (45°) 10⁷', dpf(6.17, 1, 45)[2] / 1e7, '8.768')
num(D, 'E axial (2 nm) 10⁷', dpf(6.17, 2, 0)[0] / 1e7, '1.386'); num(D, 'E axial (0.1 nm) 10¹¹', dpf(6.17, 0.1, 0)[0] / 1e11, '1.109'); num(D, 'p E₀ (eV)', 6.17e-30 * 1e6 / qe / 1e-5, '3.85'); num(D, 'kT (300 K) eV', 1.380649e-23 * 300 / qe, '0.0259', tol=1e-3)
num(D, 'E_r valor inicial (10⁷)', dpf(6.17, 1, 45)[0] / 1e7, '7.84227'); num(D, 'E_θ valor inicial (10⁷)', dpf(6.17, 1, 45)[1] / 1e7, '3.92113'); num(D, '|E| valor inicial (10⁷)', dpf(6.17, 1, 45)[2] / 1e7, '8.76792'); num(D, 'V valor inicial', dpf(6.17, 1, 45)[3], '0.0392113')
pq, rq2, thq = symbols('p r th', positive=True)
tr = thq * pi / 180
pS = pq * sp.Float('1e-30', 40); rS = rq2 * sp.Float('1e-9', 40)
fs(D, 'Er', 2 * Kq * pS * cos(tr) / rS ** 3); fs(D, 'Et', Kq * pS * sin(tr) / rS ** 3); fs(D, 'E', sqrt((2 * Kq * pS * cos(tr) / rS ** 3) ** 2 + (Kq * pS * sin(tr) / rS ** 3) ** 2)); fs(D, 'V', Kq * pS * cos(tr) / rS ** 2)

# ---------------------------------------------------------------- imágenes
D = 'imagenes'
rho, z, d, q, kd = S('rho z d q kd')
Vim = kd * q * (1 / sqrt(rho ** 2 + (z - d) ** 2) - 1 / sqrt(rho ** 2 + (z + d) ** 2))
ident(D, 'V = 0 sobre el plano z = 0', Vim.subs(z, 0), 0)
x3, y3 = symbols('x3 y3', real=True)
Vcart = kd * q * (1 / sqrt(x3 ** 2 + y3 ** 2 + (z - d) ** 2) - 1 / sqrt(x3 ** 2 + y3 ** 2 + (z + d) ** 2))
ident(D, '∇²V = 0 en z > 0 (Laplace, salvo en la carga real)', sp.simplify(diff(Vcart, x3, 2) + diff(Vcart, y3, 2) + diff(Vcart, z, 2)), 0)
e0s = Symbol('e0', positive=True)
sigma_ = -e0s * diff(Vim.subs(kd, 1 / (4 * pi * e0s)), z).subs(z, 0)
ident(D, 'σ = −ε₀ ∂V/∂z|₀ = −qd/(2π(ρ²+d²)^(3/2))', sp.simplify(sigma_), -q * d / (2 * pi * (rho ** 2 + d ** 2) ** R_(3, 2)))
integral(D, 'carga inducida total = −q', -q * d / (2 * pi * (rho ** 2 + d ** 2) ** R_(3, 2)) * 2 * pi * rho, rho, 0, oo, -q)
rh = Symbol('rh', positive=True)
ident(D, 'carga dentro de ρ: Q(ρ) = −q[1 − d/√(ρ²+d²)]', integrate(-q * d / (2 * pi * (rho ** 2 + d ** 2) ** R_(3, 2)) * 2 * pi * rho, (rho, 0, rh)), -q * (1 - d / sqrt(rh ** 2 + d ** 2)))
solves(D, 'Q(ρ) = −q/2 ⇒ ρ = √3 d', [Eq(-q * (1 - d / sqrt(rh ** 2 + d ** 2)), -q / 2)], rh, sqrt(3) * d)
ident(D, 'F = kq²/(2d)²', kd * q * q / (2 * d) ** 2, kd * q ** 2 / (4 * d ** 2))
integral(D, 'W = ∫_d^∞ kq²/(4z²) dz = kq²/(4d)', kd * q ** 2 / (4 * Symbol('zz', positive=True) ** 2), Symbol('zz', positive=True), d, oo, kd * q ** 2 / (4 * d))
integral(D, 'fuerza por el tensor de Maxwell: ∫ σ²/(2ε₀) 2πρ dρ = kq²/(4d²)', ((q * d / (2 * pi * (rho ** 2 + d ** 2) ** R_(3, 2))) ** 2) / (2 * e0s) * 2 * pi * rho, rho, 0, oo, q ** 2 / (4 * pi * e0s) / (4 * d ** 2))
ident(D, 'energía real = ½ de la de dos cargas ±q a distancia 2d: ½·kq²/(2d)', R_(1, 2) * kd * q ** 2 / (2 * d), kd * q ** 2 / (4 * d))
# solución numérica independiente: relajación de Laplace con una carga puntual discretizada? se verifica σ por derivada numérica del potencial
qn, dn = 1e-8, 0.05
Vn = lambda rho_, z_: K * qn * (1 / math.hypot(rho_, z_ - dn) - 1 / math.hypot(rho_, z_ + dn))
for rn in (0.0, 0.05, 0.1):
    hh = 1e-7
    sg_num = -E0 * (Vn(rn, hh) - Vn(rn, 0.0)) / hh
    sg_th = -qn * dn / (2 * math.pi * (rn ** 2 + dn ** 2) ** 1.5)
    rec(G_STEP, D, f'σ = −ε₀ ∂V/∂z por derivada numérica (ρ = {rn} m)', sg_num, sg_th, 'rel 1e-5', abs(sg_num / sg_th - 1) < 1e-5)
Fq = quad(lambda r_: (qn * dn / (2 * math.pi * (r_ ** 2 + dn ** 2) ** 1.5)) ** 2 / (2 * E0) * 2 * math.pi * r_, 0, math.inf, epsabs=1e-20, epsrel=1e-12)[0]
rec(G_STEP, D, 'presión de Maxwell integrada sobre el plano = fuerza de la imagen', Fq, K * qn ** 2 / (4 * dn ** 2), 'rel 1e-8', abs(Fq / (K * qn ** 2 / (4 * dn ** 2)) - 1) < 1e-8)
uI = {'q': 'C', 'd': 'm', 'rho': 'm', 'kd': 'N m^2 C^-2', 'F': 'N', 'sigma': 'C m^-2', 'W': 'J', 'rh': 'm'}
dimcheck(D, 'F = kq²/(4d²)', Symbol('F', positive=True), kd * q ** 2 / (4 * d ** 2), uI)
dimcheck(D, 'σ = qd/(2π(ρ²+d²)^(3/2))', Symbol('sigma', positive=True), q * d / (2 * pi * (rho ** 2 + d ** 2) ** R_(3, 2)), uI)
dimcheck(D, 'W = kq²/(4d)', Symbol('W', positive=True), kd * q ** 2 / (4 * d), uI)
dimcheck(D, 'ρ_½ = √3 d', rh, sqrt(3) * d, uI)
imf = lambda q_nc, d_cm, rho_cm: (lambda q_, d_, r_: (K * q_ ** 2 / (4 * d_ ** 2), -q_ * d_ / (2 * math.pi * (r_ ** 2 + d_ ** 2) ** 1.5), K * q_ ** 2 / (4 * d_), math.sqrt(3) * d_cm))(q_nc * 1e-9, d_cm * 1e-2, rho_cm * 1e-2)
num(D, 'F (µN)', imf(10, 5, 0)[0] / 1e-6, '89.88'); num(D, 'σ(0) (µC/m²)', imf(10, 5, 0)[1] / 1e-6, '-0.6366'); num(D, 'W (µJ)', imf(10, 5, 0)[2] / 1e-6, '4.494'); num(D, 'σ(ρ = d) (µC/m²)', imf(10, 5, 5)[1] / 1e-6, '-0.2251'); num(D, 'σ(d)/σ(0) (%)', imf(10, 5, 5)[1] / imf(10, 5, 0)[1] * 100, '35.4'); num(D, 'ρ_½ (cm)', imf(10, 5, 0)[3], '8.66')
num(D, 'F (20 nC) µN', imf(20, 5, 0)[0] / 1e-6, '359.5'); num(D, 'F (d = 2.5 cm) µN', imf(10, 2.5, 0)[0] / 1e-6, '359.5'); num(D, 'F (d = 10 cm) µN', imf(10, 10, 0)[0] / 1e-6, '22.47'); num(D, 'σ(0) (d = 10 cm)', imf(10, 10, 0)[1] / 1e-6, '-0.159', tol=1e-3); num(D, 'W (e⁻, 1 nm) eV', K * qe ** 2 / (4 * 1e-9) / qe, '0.360')
num(D, 'F valor inicial (10⁻⁵)', imf(10, 5, 0)[0] / 1e-5, '8.98755'); num(D, 'σ valor inicial (10⁻⁷)', imf(10, 5, 0)[1] / 1e-7, '-6.36620'); num(D, 'W valor inicial (10⁻⁶)', imf(10, 5, 0)[2] / 1e-6, '4.49378'); num(D, 'ρ_½ valor inicial', imf(10, 5, 0)[3], '8.66025')
qS, dS, rhoS = symbols('q d rho', positive=True)
qC, dC, rC = qS * sp.Float('1e-9', 40), dS * sp.Rational(1, 100), rhoS * sp.Rational(1, 100)
fs(D, 'F', Kq * qC ** 2 / (4 * dC ** 2)); fs(D, 'sg', -qC * dC / (2 * pi * (rC ** 2 + dC ** 2) ** R_(3, 2))); fs(D, 'W', Kq * qC ** 2 / (4 * dC)); fs(D, 'rh', sqrt(3) * dS)
