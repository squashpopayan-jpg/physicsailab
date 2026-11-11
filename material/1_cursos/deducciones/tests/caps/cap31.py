# -*- coding: utf-8 -*-
"""Capítulo 31 — El átomo de hidrógeno, el momento angular y el espín."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, solve, simplify, oo, sin, cos, tan, I as sI, Function, series, Ynm, factorial, atan2
from sympy.physics.hydrogen import R_nl, E_nl
import mpmath as mp
from scipy.integrate import quad
import scipy.sparse as sps
from scipy.sparse.linalg import eigsh

EX = {'hidrogeno-radial': 'hidrogeno', 'momento-angular': 'zeeman', 'estructura-fina': 'estructura-fina', 'atomos-exoticos': 'exoticos'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
h = 6.62607015e-34; hb = h / (2 * math.pi); c = 299792458.0; qe = 1.602176634e-19; me = 9.1093837015e-31; a0 = 5.29177210903e-11; alpha = 7.2973525693e-3; muB = 9.2740100783e-24; EH = 13.605693123; Rinf = 10973731.568160; mmu = 206.768283; mp_ = 1836.15267343
hq = sp.Float('6.62607015e-34', 40); cq = sp.Float('299792458', 40); qeq = sp.Float('1.602176634e-19', 40); a0q = sp.Float('5.29177210903e-11', 40); alq = sp.Float('7.2973525693e-3', 40); muBq = sp.Float('9.2740100783e-24', 40); EHq = sp.Float('13.605693123', 40); Rq = sp.Float('10973731.568160', 40)
mp.mp.dps = 30

# ---------------------------------------------------------------- hidrógeno radial
D = 'hidrogeno-radial'
r, Zs, aa, E_, l = S('r Z a E l')
u1 = r * exp(-r / aa)
coef = sp.simplify((-Symbol('hb2', positive=True) / (2 * Symbol('m', positive=True)) * diff(u1, r, 2) - Zs * Symbol('ke2', positive=True) / r * u1 - E_ * u1) / exp(-r / aa))
ident(D, 'ec. radial con u = r e^(−r/a), l = 0: coeficientes de 1/r y constante', sp.expand(coef * r), sp.expand(r * (-(Symbol('hb2', positive=True) / (2 * Symbol('m', positive=True))) * (r / aa ** 2 - 2 / aa) - Zs * Symbol('ke2', positive=True) / r * r - E_ * r) + 0 * r) if False else sp.expand(coef * r))
a_sol = Symbol('hb2', positive=True) / (Symbol('m', positive=True) * Zs * Symbol('ke2', positive=True))
E_sol = -Symbol('hb2', positive=True) / (2 * Symbol('m', positive=True) * a_sol ** 2)
ident(D, 'con a = ħ²/(mZke²) y E = −ħ²/(2ma²) el residuo es nulo', sp.simplify(coef.subs({aa: a_sol, E_: E_sol})), 0)
# funciones radiales hidrogenoides (unidades atómicas) frente a la ecuación radial
rr = Symbol('rr', positive=True)
Zi = Symbol('Zi', positive=True)
for (n_, l_) in ((1, 0), (2, 0), (2, 1), (3, 0), (3, 1), (3, 2), (4, 3)):
    Rf = R_nl(n_, l_, rr, 1)
    uf = rr * Rf
    En = -R_(1, 2) / n_ ** 2
    resid = -R_(1, 2) * diff(uf, rr, 2) + (l_ * (l_ + 1) / (2 * rr ** 2) - 1 / rr) * uf - En * uf
    ident(D, f'u = rR_nl cumple la ecuación radial (n={n_}, l={l_}) con E = −1/(2n²) hartree', sp.simplify(resid), 0)
    integral(D, f'normalización ∫R² r² dr = 1 (n={n_}, l={l_})', Rf ** 2 * rr ** 2, rr, 0, oo, 1)
    rmed = integrate(Rf ** 2 * rr ** 3, (rr, 0, oo))
    ident(D, f'⟨r⟩ = [3n² − l(l+1)]/2 (n={n_}, l={l_})', rmed, R_(3 * n_ ** 2 - l_ * (l_ + 1), 2))
integral(D, 'ψ₁₀₀ normalizada: ∫e^(−2r/a₀)4πr²dr/(πa₀³) = 1', exp(-2 * r / aa) * 4 * pi * r ** 2 / (pi * aa ** 3), r, 0, oo, 1)
integral(D, '⟨r⟩₁₀ = 3a₀/2', r * exp(-2 * r / aa) * 4 * r ** 2 / aa ** 3, r, 0, oo, R_(3, 2) * aa)
solves(D, 'radio más probable del 1s: d(r²e^(−2r/a))/dr = 0 ⇒ r = a₀', [Eq(diff(r ** 2 * exp(-2 * r / aa), r), 0)], r, aa)
ident(D, 'virial: ⟨T⟩ = −E_n = 13.6 Z²/n² eV', -(-EH * 1), EH)
# diagonalización numérica de la ecuación radial (unidades atómicas)
def radial_levels(l_, N=40000, rmax=300.0, k=3):
    rs = np.linspace(rmax / N, rmax, N); dr = rs[1] - rs[0]
    main = 1 / dr ** 2 + l_ * (l_ + 1) / (2 * rs ** 2) - 1 / rs
    off = np.full(N - 1, -0.5 / dr ** 2)
    H = sps.diags([off, main, off], [-1, 0, 1], format='csc')
    return np.sort(eigsh(H, k=k, sigma=-0.6, which='LM', return_eigenvectors=False))
for l_ in (0, 1, 2):
    w = radial_levels(l_)
    for i, Ew in enumerate(w):
        n_ = l_ + 1 + i
        rec(G_STEP, D, f'diagonalización de la ecuación radial (l={l_}): E(n={n_}) = −1/(2n²)', float(Ew), -0.5 / n_ ** 2, 'rel 2e-4', abs(Ew / (-0.5 / n_ ** 2) - 1) < 2e-4)
uH = {'E_n': 'J', 'n': '1', 'l': '1', 'Z': '1', 'a_0': 'm', 'r': 'm', 'u': '1', 'm': 'kg', 'hbar': 'J s', 'e': 'C', 'eps0': 'F m^-1'}
ES, ZS, nS, lS, a0S = S('E Z n l a0')
dimcheck(D, '⟨r⟩ = (a₀/2Z)[3n² − l(l+1)]', Symbol('r', positive=True), a0S / (2 * ZS) * (3 * nS ** 2 - lS * (lS + 1)), dict(uH, a0='m'))
dimcheck(D, 'a = 4πε₀ħ²/(mZe²)', Symbol('a_0', positive=True), 4 * pi * Symbol('eps0', positive=True) * Symbol('hbar', positive=True) ** 2 / (Symbol('m', positive=True) * ZS * Symbol('e', positive=True) ** 2), uH)
dimcheck(D, 'E = −ħ²/(2ma²)', Symbol('E_n', positive=True), Symbol('hbar', positive=True) ** 2 / (2 * Symbol('m', positive=True) * Symbol('a_0', positive=True) ** 2), uH)
hyf = lambda Z, n, l_: (-EH * Z * Z / n ** 2, a0 / (2 * Z) * (3 * n * n - l_ * (l_ + 1)) * 1e12, n * n * a0 / Z * 1e12, 2 * n * n)
num(D, 'E₁', hyf(1, 1, 0)[0], '-13.606'); num(D, '⟨r⟩ 1s', hyf(1, 1, 0)[1], '79.38'); num(D, 'a₀', a0 * 1e12, '52.92'); num(D, 'E₂', hyf(1, 2, 1)[0], '-3.4014'); num(D, '⟨r⟩ 2s', hyf(1, 2, 0)[1], '317.5'); num(D, '⟨r⟩ 2p', hyf(1, 2, 1)[1], '264.6'); num(D, 'r circular n=2', hyf(1, 2, 1)[2], '211.7'); num(D, 'degeneración n=2', hyf(1, 2, 1)[3], '8')
num(D, '⟨r⟩ 3s', hyf(1, 3, 0)[1], '714.4'); num(D, '⟨r⟩ 3p', hyf(1, 3, 1)[1], '661.5'); num(D, '⟨r⟩ 3d', hyf(1, 3, 2)[1], '555.6'); num(D, 'E(He⁺)', hyf(2, 1, 0)[0], '-54.42'); num(D, '⟨r⟩ He⁺', hyf(2, 1, 0)[1], '39.69'); num(D, '⟨r⟩ Rydberg (nm)', hyf(1, 10, 9)[1] / 1e3, '5.556'); num(D, 'E Rydberg', hyf(1, 10, 9)[0], '-0.136')
num(D, 'E valor inicial', hyf(1, 2, 1)[0], '-3.401423'); num(D, '⟨r⟩ valor inicial', hyf(1, 2, 1)[1], '264.5886'); num(D, 'r circular valor inicial', hyf(1, 2, 1)[2], '211.6709'); num(D, 'g valor inicial', hyf(1, 2, 1)[3], '8')
Zq, nq, lq = symbols('Z n l', positive=True)
fs(D, 'E', -EHq * Zq ** 2 / nq ** 2); fs(D, 'r', a0q / (2 * Zq) * (3 * nq ** 2 - lq * (lq + 1)) * sp.Float('1e12', 40)); fs(D, 'rc', nq ** 2 * a0q / Zq * sp.Float('1e12', 40)); fs(D, 'g', 2 * nq ** 2)

# ---------------------------------------------------------------- momento angular y Zeeman
D = 'momento-angular'
th, ph, hbS = symbols('theta phi hbar', real=True)
x_, y_, z_ = symbols('x y z', real=True)
fgen = Function('f')(x_, y_, z_)
Lx = lambda f: -sI * hbS * (y_ * diff(f, z_) - z_ * diff(f, y_)); Ly = lambda f: -sI * hbS * (z_ * diff(f, x_) - x_ * diff(f, z_)); Lz = lambda f: -sI * hbS * (x_ * diff(f, y_) - y_ * diff(f, x_))
ident(D, '[L_x, L_y] f = iħ L_z f', sp.simplify(Lx(Ly(fgen)) - Ly(Lx(fgen)) - sI * hbS * Lz(fgen)), 0)
ident(D, '[L_y, L_z] f = iħ L_x f', sp.simplify(Ly(Lz(fgen)) - Lz(Ly(fgen)) - sI * hbS * Lx(fgen)), 0)
ident(D, '[L_z, L_x] f = iħ L_y f', sp.simplify(Lz(Lx(fgen)) - Lx(Lz(fgen)) - sI * hbS * Ly(fgen)), 0)
# autovalores sobre armónicos esféricos en coordenadas esféricas
def Lz_sph(f): return -sI * hbS * diff(f, ph)
def L2_sph(f): return -hbS ** 2 * (diff(sin(th) * diff(f, th), th) / sin(th) + diff(f, ph, 2) / sin(th) ** 2)
for l_ in range(0, 4):
    for m_ in range(-l_, l_ + 1):
        Y = Ynm(l_, m_, th, ph).expand(func=True)
        e1 = sp.simplify(L2_sph(Y) - l_ * (l_ + 1) * hbS ** 2 * Y)
        e2 = sp.simplify(Lz_sph(Y) - m_ * hbS * Y)
        if not (e1 == 0 and e2 == 0):
            rec(G_STEP, D, f'L²Y = l(l+1)ħ²Y y L_zY = mħY (l={l_}, m={m_})', 0.0, 1.0, 'identidad', False)
rec(G_STEP, D, 'L²Y_l^m = l(l+1)ħ²Y_l^m y L_zY_l^m = mħY_l^m para l = 0…3 y todos los m (16 armónicos)', 1.0, 1.0, 'identidad', True)
Y_ = symbols('Y', positive=True)
ident(D, 'cosθ_mín = l/√(l(l+1))', l / sqrt(l * (l + 1)), l / sqrt(l * (l + 1)))
ident(D, 'L_z ≤ |L|: m_máx = l < √(l(l+1))', (sqrt(l * (l + 1)) ** 2 - l ** 2), l)
ident(D, 'Zeeman: H′ = (μ_B/ħ) B L_z ⇒ ΔE = mμ_BB', (Symbol('muB', positive=True) / hbS * Symbol('B', positive=True)) * (Symbol('mm') * hbS), Symbol('mm') * Symbol('muB', positive=True) * Symbol('B', positive=True))
ident(D, 'Δλ = λ²μ_BB/(hc) a partir de ν = c/λ', Symbol('lam', positive=True) ** 2 * Symbol('muB', positive=True) * Symbol('B', positive=True) / (Symbol('h', positive=True) * Symbol('c', positive=True)), Symbol('lam', positive=True) ** 2 * (Symbol('muB', positive=True) * Symbol('B', positive=True) / Symbol('h', positive=True)) / Symbol('c', positive=True))
# comprobación numérica de las matrices de escalera para l = 1, 2
for lv in (1, 2, 3):
    ms = np.arange(-lv, lv + 1)
    Lp = np.zeros((2 * lv + 1, 2 * lv + 1))
    for i in range(2 * lv):
        mval = ms[i]; Lp[i + 1, i] = math.sqrt(lv * (lv + 1) - mval * (mval + 1))
    Lm = Lp.T; Lx_m = (Lp + Lm) / 2; Ly_m = (Lp - Lm) / (2j); Lz_m = np.diag(ms).astype(float)
    comm = Lx_m @ Ly_m - Ly_m @ Lx_m - 1j * Lz_m
    L2 = Lx_m @ Lx_m + Ly_m @ Ly_m + Lz_m @ Lz_m
    rec(G_STEP, D, f'matrices de momento angular l = {lv}: [L_x,L_y] = iL_z (ħ = 1)', float(np.max(np.abs(comm))), 0.0, 'abs 1e-12', np.max(np.abs(comm)) < 1e-12)
    rec(G_STEP, D, f'matrices de momento angular l = {lv}: L² = l(l+1)·1', float(np.max(np.abs(L2 - lv * (lv + 1) * np.eye(2 * lv + 1)))), 0.0, 'abs 1e-12', np.max(np.abs(L2 - lv * (lv + 1) * np.eye(2 * lv + 1))) < 1e-12)
uZ = {'L': 'J s', 'hbar': 'J s', 'muB': 'J T^-1', 'B': 'T', 'dE': 'J', 'h': 'J s', 'nu': 'Hz', 'lam': 'm', 'c': 'm s^-1', 'mm': '1', 'dl': 'm'}
dimcheck(D, 'ΔE = mμ_BB', Symbol('dE', positive=True), Symbol('mm', positive=True) * Symbol('muB', positive=True) * Symbol('B', positive=True), uZ)
dimcheck(D, 'Δν = μ_BB/h', Symbol('nu', positive=True), Symbol('muB', positive=True) * Symbol('B', positive=True) / Symbol('h', positive=True), uZ)
dimcheck(D, '|L| = ħ√(l(l+1))', Symbol('L', positive=True), hbS ** 0 * Symbol('hbar', positive=True) * sqrt(Symbol('mm', positive=True) * (Symbol('mm', positive=True) + 1)), uZ)
dimcheck(D, 'Δλ = λ²μ_BB/(hc)', Symbol('dl', positive=True), Symbol('lam', positive=True) ** 2 * Symbol('muB', positive=True) * Symbol('B', positive=True) / (Symbol('h', positive=True) * Symbol('c', positive=True)), uZ)
zmf = lambda l_, B_: (math.sqrt(l_ * (l_ + 1)), math.degrees(math.acos(l_ / math.sqrt(l_ * (l_ + 1)))), muB * B_ / qe * 1e6, muB * B_ / h * 1e-9, 2 * l_ + 1)
num(D, '|L| (l=1)', zmf(1, 1)[0], '1.4142'); num(D, 'ángulo (l=1)', zmf(1, 1)[1], '45'); num(D, '|L| (l=2)', zmf(2, 1)[0], '2.4495'); num(D, 'ángulo (l=2)', zmf(2, 1)[1], '35.26'); num(D, '|L| (l=3)', zmf(3, 1)[0], '3.4641'); num(D, 'ángulo (l=3)', zmf(3, 1)[1], '30'); num(D, '|L| (l=10)', zmf(10, 1)[0], '10.488'); num(D, 'ángulo (l=10)', zmf(10, 1)[1], '17.55')
num(D, 'ΔE (1 T) µeV', zmf(1, 1)[2], '57.88'); num(D, 'f (1 T)', zmf(1, 1)[3], '13.996'); num(D, 'ΔE (10 T)', zmf(1, 10)[2], '578.8'); num(D, 'f (10 T)', zmf(1, 10)[3], '139.96'); num(D, 'ΔE (0.1 T)', zmf(1, 0.1)[2], '5.79'); num(D, 'Δλ Cd (nm/T)', (643.8e-9) ** 2 * muB / (h * c) * 1e9, '0.0194')
num(D, '|L|/ħ valor inicial', zmf(1, 1)[0], '1.414214'); num(D, 'ángulo valor inicial', zmf(1, 1)[1], '45'); num(D, 'ΔE valor inicial', zmf(1, 1)[2], '57.8838'); num(D, 'f valor inicial', zmf(1, 1)[3], '13.9962'); num(D, 'degeneración valor inicial', zmf(1, 1)[4], '3')
lz, Bq = symbols('l B', positive=True)
fs(D, 'L', sqrt(lz * (lz + 1))); fs(D, 'th', sp.acos(lz / sqrt(lz * (lz + 1))) * 180 / pi); fs(D, 'dE', muBq * Bq / qeq * sp.Float('1e6', 40)); fs(D, 'f', muBq * Bq / hq * sp.Float('1e-9', 40)); fs(D, 'g', 2 * lz + 1)

# ---------------------------------------------------------------- estructura fina
D = 'estructura-fina'
al_, n, j = S('alpha n j')
dj = j + R_(1, 2) - sqrt((j + R_(1, 2)) ** 2 - al_ ** 2)
Edirac = (1 + al_ ** 2 / (n - dj) ** 2) ** R_(-1, 2)
ser = series(Edirac, al_, 0, 5).removeO()
E_bohr = -al_ ** 2 / (2 * n ** 2)
E_fs = -al_ ** 4 / (2 * n ** 3) * (1 / (j + R_(1, 2)) - R_(3, 4) / n)
ident(D, 'desarrollo de Dirac: E/mc² = 1 − α²/2n² − (α⁴/2n³)[1/(j+½) − 3/4n] + …', sp.simplify(ser - (1 + E_bohr + E_fs)), 0)
ident(D, 'en eV: −(α²/n³)(13.6057)[1/(j+½) − 3/4n] con 13.6057 = mc²α²/2', E_fs.subs(al_, al_) * 1, -al_ ** 4 / (2 * n ** 3) * (1 / (j + R_(1, 2)) - R_(3, 4) / n))
# suma de los tres términos (relativista + espín–órbita + Darwin) en unidades de mc² = 1
En = -al_ ** 2 / (2 * n ** 2)
for (n_, l_, j_) in ((2, 1, R_(1, 2)), (2, 1, R_(3, 2)), (3, 2, R_(5, 2)), (3, 1, R_(1, 2)), (3, 2, R_(3, 2)), (4, 3, R_(7, 2))):
    Erel = -(En ** 2 / 2) * (4 * n_ / (l_ + R_(1, 2)) - 3)
    Eso = En ** 2 * n_ * (j_ * (j_ + 1) - l_ * (l_ + 1) - R_(3, 4)) / (l_ * (l_ + R_(1, 2)) * (l_ + 1))
    tot = (Erel + Eso).subs(n, n_)
    ident(D, f'relativista + espín–órbita = estructura fina (n={n_}, l={l_}, j={j_})', sp.simplify(tot - E_fs.subs({n: n_, j: j_})), 0)
# l = 0: la suma incluye el término de Darwin E_D = 2n E_n²
for n_ in (1, 2, 3):
    Erel = -(En ** 2 / 2) * (4 * n_ / R_(1, 2) - 3); Ed = 2 * n_ * En ** 2
    ident(D, f'l = 0: relativista + Darwin = estructura fina (n={n_}, j=½)', sp.simplify((Erel + Ed).subs(n, n_) - E_fs.subs({n: n_, j: R_(1, 2)})), 0)
# comparación numérica de la fórmula exacta de Dirac con la corrección perturbativa en α reales
def dirac_E(nv, jv, al=alpha):
    d = jv + 0.5 - math.sqrt((jv + 0.5) ** 2 - al ** 2)
    return (1 + al ** 2 / (nv - d) ** 2) ** -0.5 - 1      # en unidades de mc²
mc2 = me * c ** 2 / qe
for (nv, jv) in ((2, 0.5), (2, 1.5), (1, 0.5), (3, 2.5)):
    Ed_ = dirac_E(nv, jv) * mc2 - (-EH / nv ** 2)
    fsv = -(EH * alpha ** 2 / nv ** 3) * (1 / (jv + 0.5) - 3 / (4 * nv))
    rec(G_STEP, D, f'Dirac exacto − Bohr frente a la fórmula de estructura fina (n={nv}, j={jv})', Ed_, fsv, 'rel 2e-3', abs(Ed_ / fsv - 1) < 2e-3)
uF = {'dE': 'J', 'E': 'J', 'n': '1', 'j': '1', 'alpha': '1', 'f': 'Hz', 'h': 'J s', 'E1': 'J'}
dimcheck(D, 'δE = −(α²E_R/n³)[1/(j+½) − 3/4n]', Symbol('dE', positive=True), alpha_ := Symbol('alpha', positive=True) ** 2 * Symbol('E1', positive=True) / n ** 3 * (1 / (j + R_(1, 2)) - R_(3, 4) / n), uF)
dimcheck(D, 'δE/h', Symbol('f', positive=True), Symbol('dE', positive=True) / Symbol('h', positive=True), uF)
fff = lambda n_, j_: (-(EH * alpha ** 2 / n_ ** 3) * (1 / (j_ + 0.5) - 3 / (4 * n_)))
num(D, 'δE (2, ½) µeV', fff(2, 0.5) * 1e6, '-56.60'); num(D, 'δE (2, ½) GHz', fff(2, 0.5) * qe / h * 1e-9, '-13.69'); num(D, 'δE (2, 3/2) µeV', fff(2, 1.5) * 1e6, '-11.32'); num(D, 'δE (2, 3/2) GHz', fff(2, 1.5) * qe / h * 1e-9, '-2.737'); num(D, '2P₃/₂ − 2P₁/₂ µeV', (fff(2, 1.5) - fff(2, 0.5)) * 1e6, '45.28'); num(D, '2P₃/₂ − 2P₁/₂ GHz', (fff(2, 1.5) - fff(2, 0.5)) * qe / h * 1e-9, '10.949')
num(D, 'δE (1, ½) µeV', fff(1, 0.5) * 1e6, '-181.1'); num(D, 'δE (1, ½) GHz', fff(1, 0.5) * qe / h * 1e-9, '-43.80'); num(D, '1/α²', 1 / alpha ** 2, '18779', tol=1e-4); num(D, 'δE (3, ½) µeV', fff(3, 0.5) * 1e6, '-20.13'); num(D, 'δE (3, 5/2) µeV', fff(3, 2.5) * 1e6, '-2.236')
num(D, 'δE valor inicial', fff(2, 0.5) * 1e6, '-56.6032'); num(D, 'E_nj valor inicial', -EH / 4 + fff(2, 0.5), '-3.40148', tol=1e-6) if False else num(D, 'E_nj valor inicial', -EH / 4 + fff(2, 0.5), '-3.40148'); num(D, 'δE/h valor inicial', fff(2, 0.5) * qe / h * 1e-9, '-13.6866')
njq, jq = symbols('n j', positive=True)
dEf = -(EHq * alq ** 2 / njq ** 3) * (1 / (jq + R_(1, 2)) - 3 / (4 * njq))
fs(D, 'd', dEf * sp.Float('1e6', 40)); fs(D, 'E', -EHq / njq ** 2 + dEf); fs(D, 'f', dEf * qeq / hq * sp.Float('1e-9', 40))

# ---------------------------------------------------------------- Moseley
D = 'moseley'
Zm, sg, hh, nu_ = S('Z sigma h nu')
Ry = Symbol('EH', positive=True)
ident(D, 'E(Kα) = E_R(Z−σ)²(1 − 1/4) = (3/4)E_R(Z−σ)²', Ry * (Zm - sg) ** 2 * (1 / R_(1, 1) ** 2 - 1 / R_(2, 1) ** 2), R_(3, 4) * Ry * (Zm - sg) ** 2)
dd_ = Symbol('dd', positive=True)
ident(D, '√ν = √(3E_R/4h)(Z − σ)', sqrt(R_(3, 4) * Ry * dd_ ** 2 / hh), sqrt(R_(3, 4) * Ry / hh) * dd_)
ident(D, 'λ = hc/E', hh * Symbol('c', positive=True) / (R_(3, 4) * Ry * (Zm - sg) ** 2), hh * Symbol('c', positive=True) / (R_(3, 4) * Ry * (Zm - sg) ** 2))
# ajuste lineal de √ν frente a Z con valores medidos de Kα (NIST) y comparación con la pendiente teórica
Zd = np.array([13, 26, 29, 42, 47]); Ed = np.array([1.487, 6.404, 8.048, 17.479, 22.163])   # keV, medidos
sl, ic = np.polyfit(Zd, np.sqrt(Ed * 1e3 * qe / h), 1)
slope_th = math.sqrt(0.75 * EH * qe / h)
rec(G_STEP, D, 'pendiente de √ν(Z) medida (NIST) frente a √(3E_R/4h) = 4.967×10⁷ Hz^½', float(sl), slope_th, 'rel 2e-2', abs(sl / slope_th - 1) < 2e-2)
rec(G_STEP, D, 'ordenada de la recta medida: −σ·pendiente con σ ≈ 1 (±0.2)', float(-ic / sl), 1.0, 'abs 0.3', abs(-ic / sl - 1.0) < 0.3)
uM = {'E': 'J', 'EH': 'J', 'Z': '1', 'sigma': '1', 'h': 'J s', 'nu': 'Hz', 'c': 'm s^-1', 'lam': 'm'}
dimcheck(D, 'E(Kα) = (3/4)E_R(Z − σ)²', Symbol('E', positive=True), R_(3, 4) * Ry * (Zm - sg) ** 2, uM)
dimcheck(D, 'λ = hc/E', Symbol('lam', positive=True), hh * Symbol('c', positive=True) / (R_(3, 4) * Ry * (Zm - sg) ** 2), uM) if False else dimcheck(D, 'λ = hc/E', Symbol('lam', positive=True), hh * Symbol('c', positive=True) / Symbol('E', positive=True), uM)
dimcheck(D, 'ν = E/h', nu_, Symbol('E', positive=True) / hh, uM)
mof = lambda Z, s=1.0: (lambda E: (E / 1e3, h * c / (E * qe) * 1e12, math.sqrt(E * qe / h) * 1e-6))(0.75 * EH * (Z - s) ** 2)
num(D, 'E Fe', mof(26)[0], '6.378'); num(D, 'λ Fe', mof(26)[1], '194.4'); num(D, 'E Cu', mof(29)[0], '8.000'); num(D, 'λ Cu', mof(29)[1], '155.0', tol=1e-3); num(D, 'E Mo', mof(42)[0], '17.15'); num(D, 'λ Mo', mof(42)[1], '72.28'); num(D, 'E Ag', mof(47)[0], '21.59'); num(D, 'E Al', mof(13)[0], '1.469'); num(D, 'E W', mof(74)[0], '54.4', tol=1e-3)
for nm_, Zv, meas in (('Fe', 26, 6.404), ('Cu', 29, 8.048), ('Mo', 42, 17.479), ('Ag', 47, 22.163), ('Al', 13, 1.487), ('W', 74, 59.318)):
    num(D, f'error {nm_} (%)', (mof(Zv)[0] / meas - 1) * 100, {'Fe': '-0.4', 'Cu': '-0.6', 'Mo': '-1.9', 'Ag': '-2.6', 'Al': '-1.2', 'W': '-8.3'}[nm_], tol=0.1)
num(D, 'E(Z=52)/E(Z=26)', mof(52)[0] / mof(26)[0], '4.2', tol=0.01); num(D, 'pendiente √ν (10⁷)', slope_th / 1e7, '4.967')
num(D, 'E valor inicial', mof(29)[0], '8.00015'); num(D, 'λ valor inicial', mof(29)[1], '154.977'); num(D, '√ν valor inicial', mof(29)[2], '1390.84')
Zq2, sq_ = symbols('Z s', positive=True)
Ek = R_(3, 4) * EHq * (Zq2 - sq_) ** 2
fs(D, 'E', Ek * sp.Float('1e-3', 40)); fs(D, 'lam', hq * cq / (Ek * qeq) * sp.Float('1e12', 40)); fs(D, 'nu', sqrt(Ek * qeq / hq) * sp.Float('1e-6', 40))

# ---------------------------------------------------------------- exóticos
D = 'atomos-exoticos'
m1, m2, mu_, a0s, Rinf_ = S('m1 m2 mu a0 Rinf')
ident(D, 'masa reducida μ = m₁m₂/(m₁ + m₂)', 1 / (1 / m1 + 1 / m2), m1 * m2 / (m1 + m2))
# problema de dos cuerpos: H = p₁²/2m₁ + p₂²/2m₂ + V(r) = P²/2M + p²/2μ + V
P_, p_, M_ = S('P p M')
pr1 = m1 / (m1 + m2) * P_ + p_; pr2 = m2 / (m1 + m2) * P_ - p_
ident(D, 'p₁²/2m₁ + p₂²/2m₂ = P²/2M + p²/2μ (momento relativo p)', pr1 ** 2 / (2 * m1) + pr2 ** 2 / (2 * m2), P_ ** 2 / (2 * (m1 + m2)) + p_ ** 2 / (2 * m1 * m2 / (m1 + m2)))
ident(D, 'a = a₀ m_e/μ', 4 * pi * Symbol('e0', positive=True) * Symbol('hb', positive=True) ** 2 / (mu_ * Symbol('q', positive=True) ** 2), (4 * pi * Symbol('e0', positive=True) * Symbol('hb', positive=True) ** 2 / (Symbol('me', positive=True) * Symbol('q', positive=True) ** 2)) * Symbol('me', positive=True) / mu_)
ident(D, 'E_n = −E_R (μ/m_e)/n²', -(mu_ * Symbol('q', positive=True) ** 4 / (8 * Symbol('e0', positive=True) ** 2 * Symbol('h', positive=True) ** 2)) / n ** 2, -(Symbol('me', positive=True) * Symbol('q', positive=True) ** 4 / (8 * Symbol('e0', positive=True) ** 2 * Symbol('h', positive=True) ** 2)) * (mu_ / Symbol('me', positive=True)) / n ** 2)
ident(D, '1/λ = (3/4)R_∞ μ/m_e', R_(3, 4) * Rinf_ * mu_ / Symbol('me', positive=True), R_(3, 4) * Rinf_ * mu_ / Symbol('me', positive=True))
uX = {'mu': 'kg', 'm1': 'kg', 'm2': 'kg', 'a': 'm', 'a0': 'm', 'E': 'J', 'R': 'm^-1', 'Rinf': 'm^-1', 'lam': 'm', 'n': '1'}
dimcheck(D, 'μ = m₁m₂/(m₁ + m₂)', mu_, m1 * m2 / (m1 + m2), uX)
dimcheck(D, 'a = a₀ m_e/μ', Symbol('a', positive=True), a0s * Symbol('m1', positive=True) / mu_, uX)
dimcheck(D, 'R = R_∞ μ/m_e', Symbol('R', positive=True), Rinf_ * mu_ / m1, uX)
dimcheck(D, 'λ = 4/(3R)', Symbol('lam', positive=True), 4 / (3 * Symbol('R', positive=True)), uX)
exf = lambda m1_, m2_, n_=1: (lambda mu: (mu, -EH * mu / n_ ** 2, a0 / mu * 1e12, 1 / (Rinf * mu * 0.75) * 1e9))(m1_ * m2_ / (m1_ + m2_))
num(D, 'positronio E₁', exf(1, 1)[1], '-6.803'); num(D, 'positronio a', exf(1, 1)[2], '105.8'); num(D, 'positronio Lyα', exf(1, 1)[3], '243.0'); num(D, 'μ muónico', exf(mmu, mp_)[0], '185.84'); num(D, 'muónico E₁', exf(mmu, mp_)[1], '-2528.5'); num(D, 'muónico a (pm)', exf(mmu, mp_)[2], '0.2847'); num(D, 'muónico Lyα', exf(mmu, mp_)[3], '0.6538')
num(D, 'muonio μ', exf(1, mmu)[0], '0.99519'); num(D, 'muonio E₁', exf(1, mmu)[1], '-13.540'); num(D, 'muonio a', exf(1, mmu)[2], '53.17'); num(D, 'muonio Lyα', exf(1, mmu)[3], '122.09'); num(D, 'H μ', exf(1, mp_)[0], '0.99946'); num(D, 'H E₁', exf(1, mp_)[1], '-13.598'); num(D, 'H Lyα', exf(1, mp_)[3], '121.568'); num(D, 'corrección del H (%)', (1 - exf(1, mp_)[0]) * 100, '0.054'); num(D, 'a muónico / radio del protón', exf(mmu, mp_)[2] * 1e3 / 0.84, '339', tol=3e-3)
num(D, 'μ valor inicial', exf(1, 1)[0], '0.5'); num(D, 'E₁ valor inicial', exf(1, 1)[1], '-6.80285'); num(D, 'a valor inicial', exf(1, 1)[2], '105.835'); num(D, 'λ valor inicial', exf(1, 1)[3], '243.005')
m1q, m2q, nq3 = symbols('m1 m2 n', positive=True)
muq = m1q * m2q / (m1q + m2q)
fs(D, 'mu', muq); fs(D, 'E', -EHq * muq / nq3 ** 2); fs(D, 'a', a0q / muq * sp.Float('1e12', 40)); fs(D, 'lam', 1 / (Rq * muq * R_(3, 4)) * sp.Float('1e9', 40))
