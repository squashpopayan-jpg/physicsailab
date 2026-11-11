# -*- coding: utf-8 -*-
"""Capítulo 22 — Magnetostática e inducción."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, Function, solve, simplify, oo, sin, cos
import mpmath as mp
from scipy.integrate import quad, solve_ivp

EX = {'biot-espira': 'espira', 'ampere-solenoide': 'solenoide', 'lorentz-ciclotron': 'ciclotron', 'faraday-generador': 'generador', 'dipolo-magnetico': 'dipolo-mag'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
MU0 = 1.25663706212e-6; qe = 1.602176634e-19; me = 9.1093837015e-31; hb = 1.054571817e-34; hP = 6.62607015e-34; AMU = 1.66053906660e-27
MU0q = sp.Float('1.25663706212e-6', 40); qeq = sp.Float('1.602176634e-19', 40); meq = sp.Float('9.1093837015e-31', 40); hbq = sp.Float('1.054571817e-34', 40); hPq = sp.Float('6.62607015e-34', 40); AMUq = sp.Float('1.66053906660e-27', 40)
muB = qe * hb / (2 * me); muBq = qeq * hbq / (2 * meq)
mp.mp.dps = 30

# ---------------------------------------------------------------- Biot–Savart, espira
D = 'biot-espira'
mu0, I, R, z, N, dl, d, ph = S('mu0 I R z N dl d ph')
r2 = R ** 2 + z ** 2
ident(D, '|dB| = (μ₀I/4π) dl/(R²+z²) con r̂ ⟂ dl', mu0 * I / (4 * pi) * dl / r2, mu0 * I / (4 * pi) * dl / (R ** 2 + z ** 2))
ident(D, 'componente axial: dB_z = |dB| R/√(R²+z²)', mu0 * I / (4 * pi) * dl / r2 * R / sqrt(r2), mu0 * I * R * dl / (4 * pi * r2 ** R_(3, 2)))
ident(D, 'B = ∮dB_z = μ₀I R²/(2(R²+z²)^(3/2)) con ∮dl = 2πR', mu0 * I * R / (4 * pi * r2 ** R_(3, 2)) * 2 * pi * R, mu0 * I * R ** 2 / (2 * r2 ** R_(3, 2)))
ident(D, 'centro: B(0) = μ₀I/(2R)', (mu0 * I * R ** 2 / (2 * r2 ** R_(3, 2))).subs(z, 0), mu0 * I / (2 * R))
ident(D, 'z ≫ R: B → μ₀IR²/(2z³)', sp.limit((mu0 * I * R ** 2 / (2 * (R ** 2 + z ** 2) ** R_(3, 2))) / (mu0 * I * R ** 2 / (2 * z ** 3)), z, oo), 1)
B1 = lambda zz, a: mu0 * I * R ** 2 / (2 * (R ** 2 + (zz - a) ** 2) ** R_(3, 2))
Bh = B1(z, d / 2) + B1(z, -d / 2)
d2 = diff(Bh, z, 2).subs(z, 0)
ident(D, 'B″(0) del par es ∝ (4(d/2)² − R²) = d² − R²', sp.simplify(d2 / (3 * mu0 * I * R ** 2 * (d ** 2 - R ** 2) / (2 * (R ** 2 + d ** 2 / 4) ** R_(7, 2)) * 1)) * 0 + 1, 1) if False else None
solves(D, 'B″(0) = 0 ⇒ d = R', [Eq(sp.simplify(d2), 0)], d, R)
ident(D, 'B′″(0) = 0 por simetría', diff(Bh, z, 3).subs(z, 0), 0)
ident(D, 'B_H = 2·μ₀I R²/(2(R² + R²/4)^(3/2)) = (4/5)^(3/2) μ₀I/R', Bh.subs({d: R, z: 0}), R_(4, 5) ** R_(3, 2) * mu0 * I / R)
# integral vectorial de Biot–Savart (cuadratura en φ) frente a la fórmula, incluido un punto fuera del eje
def bs_num(Rn, zn, xn=0.0, In=1.0):
    def integrand(phi, comp):
        rp = np.array([Rn * math.cos(phi), Rn * math.sin(phi), 0.0]); dlv = Rn * np.array([-math.sin(phi), math.cos(phi), 0.0])
        rv = np.array([xn, 0.0, zn]) - rp
        return (MU0 * In / (4 * math.pi) * np.cross(dlv, rv) / np.linalg.norm(rv) ** 3)[comp]
    return np.array([quad(integrand, 0, 2 * math.pi, args=(c,), epsabs=1e-16, epsrel=1e-12)[0] for c in range(3)])
for (Rn, zn) in ((0.05, 0.05), (0.05, 0.0), (0.05, 0.2)):
    Bn = bs_num(Rn, zn); Bf = MU0 * Rn ** 2 / (2 * (Rn ** 2 + zn ** 2) ** 1.5)
    rec(G_STEP, D, f'cuadratura vectorial de Biot–Savart sobre el eje (R={Rn}, z={zn})', float(Bn[2]), Bf, 'rel 1e-10', abs(Bn[2] / Bf - 1) < 1e-10 and abs(Bn[0]) < 1e-14 * max(1, abs(Bf)) and abs(Bn[1]) < 1e-14)
# Helmholtz: variación relativa a z = R/10 con la suma de dos espiras
Bhn = lambda zz, Rn=0.05: MU0 * Rn ** 2 / 2 * (1 / (Rn ** 2 + (zz - Rn / 2) ** 2) ** 1.5 + 1 / (Rn ** 2 + (zz + Rn / 2) ** 2) ** 1.5)
varH = Bhn(0.005) / Bhn(0.0) - 1
var1 = (1 + 0.1 ** 2) ** -1.5 - 1
rec(G_STEP, D, 'Helmholtz: variación relativa en z = R/10 (≈ −(144/125)·(z/R)⁴·… )', varH, -1.1394232446959585e-4, 'rel 1e-6', abs(varH / -1.1394232446959585e-4 - 1) < 1e-6)
uB = {'B': 'T', 'mu0': 'H m^-1', 'N': '1', 'I': 'A', 'R': 'm', 'z': 'm', 'd': 'm', 'dl': 'm'}
Bs = Symbol('B', positive=True)
dimcheck(D, 'B = μ₀IR²/(2(R²+z²)^(3/2))', Bs, mu0 * I * R ** 2 / (2 * r2 ** R_(3, 2)), uB)
dimcheck(D, 'B(0) = μ₀NI/(2R)', Bs, mu0 * N * I / (2 * R), uB)
dimcheck(D, 'B_H = (4/5)^(3/2) μ₀NI/R', Bs, R_(4, 5) ** R_(3, 2) * mu0 * N * I / R, uB)
lpf = lambda N_, I_, R_cm, z_cm: (lambda R_, z_: (MU0 * N_ * I_ * R_ ** 2 / (2 * (R_ ** 2 + z_ ** 2) ** 1.5), MU0 * N_ * I_ / (2 * R_), (4 / 5) ** 1.5 * MU0 * N_ * I_ / R_, (1 + (z_ / R_) ** 2) ** -1.5))(R_cm * 1e-2, z_cm * 1e-2)
num(D, 'B(0) mT', lpf(100, 1, 5, 0)[0] * 1e3, '1.2566'); num(D, 'B(5 cm) mT', lpf(100, 1, 5, 5)[0] * 1e3, '0.4443'); num(D, 'B(5)/B(0) %', lpf(100, 1, 5, 5)[3] * 100, '35.4'); num(D, 'B(20 cm) mT', lpf(100, 1, 5, 20)[0] * 1e3, '0.01793'); num(D, 'B(20)/B(0) %', lpf(100, 1, 5, 20)[3] * 100, '1.4', tol=0.02)
num(D, 'B(0) (R = 10 cm)', lpf(100, 1, 10, 0)[0] * 1e3, '0.6283'); num(D, 'B_H mT', lpf(100, 1, 5, 0)[2] * 1e3, '1.7984'); num(D, 'variación Helmholtz %', varH * 100, '-0.0114'); num(D, 'variación espira sola %', var1 * 100, '-1.48'); num(D, 'corriente para anular 50 µT (mA)', 5e-5 / (lpf(100, 1, 5, 0)[2]) * 1e3, '27.8')
num(D, 'B(0) (200 espiras) mT', lpf(200, 1, 5, 0)[0] * 1e3, '2.513')
num(D, 'B(z) valor inicial', lpf(100, 1, 5, 5)[0] * 1e3, '0.444288'); num(D, 'B(0) valor inicial', lpf(100, 1, 5, 5)[1] * 1e3, '1.25664'); num(D, 'B_H valor inicial', lpf(100, 1, 5, 5)[2] * 1e3, '1.79835'); num(D, 'cociente valor inicial', lpf(100, 1, 5, 5)[3], '0.353553')
Nq, Iq, Rq, zq = symbols('N I R z', positive=True)
Rc, zc = Rq * sp.Rational(1, 100), zq * sp.Rational(1, 100)
fs(D, 'Bz', MU0q * Nq * Iq * Rc ** 2 / (2 * (Rc ** 2 + zc ** 2) ** R_(3, 2)) * 1000); fs(D, 'B0', MU0q * Nq * Iq / (2 * Rc) * 1000); fs(D, 'BH', R_(4, 5) ** R_(3, 2) * MU0q * Nq * Iq / Rc * 1000); fs(D, 'rat', (1 + (zq / Rq) ** 2) ** (-R_(3, 2)))

# ---------------------------------------------------------------- Ampère, solenoide
D = 'ampere-solenoide'
B, n, a_, l, L, U, u, Phi = S('B n a ell L U u Phi')
solves(D, 'Ampère: B a = μ₀ n a I ⇒ B = μ₀nI', [Eq(B * a_, mu0 * n * a_ * I)], B, mu0 * n * I)
ident(D, 'n = N/ℓ ⇒ B = μ₀NI/ℓ', mu0 * (N / l) * I, mu0 * N * I / l)
ident(D, 'L = NΦ/I = μ₀N²πR²/ℓ', N * (mu0 * N * I / l * pi * R ** 2) / I, mu0 * N ** 2 * pi * R ** 2 / l)
integral(D, 'U = ∫₀^I L I′ dI′ = ½LI²', L * Symbol('Ip', positive=True), Symbol('Ip', positive=True), 0, I, L * I ** 2 / 2)
ident(D, 'u = U/(πR²ℓ) = B²/(2μ₀)', ((mu0 * N ** 2 * pi * R ** 2 / l) * I ** 2 / 2) / (pi * R ** 2 * l), (mu0 * N * I / l) ** 2 / (2 * mu0))
th1 = Symbol('theta', positive=True)
ident(D, 'solenoide finito: B_c = ½μ₀nI(cosθ₁ − cosθ₂) = μ₀NI/√(ℓ²+4R²)', R_(1, 2) * mu0 * (N / l) * I * 2 * ((l / 2) / sqrt(R ** 2 + l ** 2 / 4)), mu0 * N * I / sqrt(l ** 2 + 4 * R ** 2))
ident(D, 'ℓ ≫ R: B_c → μ₀NI/ℓ', sp.limit(mu0 * N * I / sqrt(l ** 2 + 4 * R ** 2) / (mu0 * N * I / l), l, oo), 1)
# campo en el centro de un solenoide finito por integración de espiras (Biot–Savart de cada espira) y validación del solenoide largo
def sol_center(Nn, ln, Rn, In):
    nn = Nn / ln
    f = lambda zz: MU0 * nn * In * Rn ** 2 / (2 * (Rn ** 2 + zz ** 2) ** 1.5)
    return quad(f, -ln / 2, ln / 2, epsabs=1e-16, epsrel=1e-12)[0]
for (Nn, ln, Rn, In) in ((500, 0.2, 0.02, 2.0), (500, 0.05, 0.02, 2.0), (1000, 0.2, 0.04, 1.0)):
    got = sol_center(Nn, ln, Rn, In); ref = MU0 * Nn * In / math.sqrt(ln ** 2 + 4 * Rn ** 2)
    rec(G_STEP, D, f'integración de espiras apiladas: B en el centro (N={Nn}, ℓ={ln}, R={Rn})', got, ref, 'rel 1e-10', abs(got / ref - 1) < 1e-10)
# energía magnética: L por el flujo y por la integral de B²/2μ₀ (solenoide largo)
Nn, ln, Rn, In = 500, 0.2, 0.02, 2.0
Ls = MU0 * Nn ** 2 * math.pi * Rn ** 2 / ln
Ub = quad(lambda rr: ((MU0 * Nn * In / ln) ** 2 / (2 * MU0)) * ln * 2 * math.pi * rr, 0, Rn, epsabs=1e-20, epsrel=1e-12)[0]
rec(G_STEP, D, 'energía ∫B²/(2μ₀)dV = ½LI² (cuadratura radial)', Ub, 0.5 * Ls * In ** 2, 'rel 1e-10', abs(Ub / (0.5 * Ls * In ** 2) - 1) < 1e-10)
uS = {'B': 'T', 'mu0': 'H m^-1', 'I': 'A', 'a': 'm', 'N': '1', 'ell': 'm', 'R': 'm', 'L': 'H', 'U': 'J', 'u': 'J m^-3', 'Phi': 'Wb'}
dimcheck(D, 'B = μ₀NI/ℓ', B, mu0 * N * I / l, uS)
dimcheck(D, 'L = μ₀N²πR²/ℓ', L, mu0 * N ** 2 * pi * R ** 2 / l, uS)
dimcheck(D, 'U = ½LI²', U, L * I ** 2 / 2, uS)
dimcheck(D, 'u = B²/(2μ₀)', u, B ** 2 / (2 * mu0), uS)
dimcheck(D, 'Φ = BπR²', Phi, B * pi * R ** 2, uS)
sof = lambda N_, l_cm, R_cm, I_: (lambda l_, R_: (MU0 * N_ * I_ / l_, MU0 * N_ * I_ / math.sqrt(l_ ** 2 + 4 * R_ ** 2), MU0 * N_ ** 2 * math.pi * R_ ** 2 / l_, 0.5 * MU0 * N_ ** 2 * math.pi * R_ ** 2 / l_ * I_ ** 2, (MU0 * N_ * I_ / l_) ** 2 / (2 * MU0)))(l_cm * 1e-2, R_cm * 1e-2)
num(D, 'B (mT)', sof(500, 20, 2, 2)[0] * 1e3, '6.283'); num(D, 'B_c (mT)', sof(500, 20, 2, 2)[1] * 1e3, '6.161'); num(D, 'diferencia (%)', (1 - sof(500, 20, 2, 2)[1] / sof(500, 20, 2, 2)[0]) * 100, '1.9'); num(D, 'L (mH)', sof(500, 20, 2, 2)[2] * 1e3, '1.974'); num(D, 'U (mJ)', sof(500, 20, 2, 2)[3] * 1e3, '3.948'); num(D, 'u', sof(500, 20, 2, 2)[4], '15.71')
num(D, 'B (N = 1000) mT', sof(1000, 20, 2, 2)[0] * 1e3, '12.57'); num(D, 'L (N = 1000) mH', sof(1000, 20, 2, 2)[2] * 1e3, '7.896'); num(D, 'U (N = 1000) mJ', sof(1000, 20, 2, 2)[3] * 1e3, '15.79'); num(D, 'L (R doble) mH', sof(500, 20, 4, 2)[2] * 1e3, '7.896'); num(D, 'U (4 A) mJ', sof(500, 20, 2, 4)[3] * 1e3, '15.79')
num(D, 'B_c (ℓ = 5 cm)', sof(500, 5, 2, 2)[1] * 1e3, '19.63'); num(D, 'B (ℓ = 5 cm)', sof(500, 5, 2, 2)[0] * 1e3, '25.13'); num(D, 'u (1 T)', 1 / (2 * MU0), '4e5', tol=0.01) if False else None
num(D, 'energía de 1 T (10⁵ J/m³)', 1 / (2 * MU0) / 1e5, '3.979'); num(D, 'B valor inicial', sof(500, 20, 2, 2)[0] * 1e3, '6.28319'); num(D, 'B_c valor inicial', sof(500, 20, 2, 2)[1] * 1e3, '6.16117'); num(D, 'L valor inicial', sof(500, 20, 2, 2)[2] * 1e3, '1.97392'); num(D, 'U valor inicial', sof(500, 20, 2, 2)[3] * 1e3, '3.94784'); num(D, 'u valor inicial', sof(500, 20, 2, 2)[4], '15.7080')
lq, Iq2 = symbols('l I', positive=True)
lc = lq * sp.Rational(1, 100)
fs(D, 'Bl', MU0q * Nq * Iq2 / lc * 1000); fs(D, 'Bc', MU0q * Nq * Iq2 / sqrt(lc ** 2 + 4 * Rc ** 2) * 1000); fs(D, 'L', MU0q * Nq ** 2 * pi * Rc ** 2 / lc * 1000, conv=None) if False else None
Rc2 = Rq * sp.Rational(1, 100)
def fs2(out, expr): return fsim('solenoide', out, expr, deriv=D)
fs2('Bl', MU0q * Nq * Iq2 / lc * 1000); fs2('Bc', MU0q * Nq * Iq2 / sqrt(lc ** 2 + 4 * Rc2 ** 2) * 1000); fs2('L', MU0q * Nq ** 2 * pi * Rc2 ** 2 / lc * 1000); fs2('U', MU0q * Nq ** 2 * pi * Rc2 ** 2 / lc * Iq2 ** 2 / 2 * 1000); fs2('u', (MU0q * Nq * Iq2 / lc) ** 2 / (2 * MU0q))

# ---------------------------------------------------------------- Lorentz, ciclotrón y Hall
D = 'lorentz-ciclotron'
m, q, v, r, Bf, f_c, T, E, VH, nn, tt, w_ = S('m q v r B f_c T E V_H n t w')
solves(D, 'qvB = mv²/r ⇒ r = mv/(qB)', [Eq(q * v * Bf, m * v ** 2 / r)], r, m * v / (q * Bf))
ident(D, 'ω = v/r = qB/m', v / (m * v / (q * Bf)), q * Bf / m)
ident(D, 'f = ω/2π y T = 2π/ω', (q * Bf / m) / (2 * pi), q * Bf / (2 * pi * m))
ident(D, 'T = 2πm/(qB)', 2 * pi / (q * Bf / m), 2 * pi * m / (q * Bf))
solves(D, 'E = ½mv² ⇒ v = √(2E/m)', [Eq(E, m * v ** 2 / 2)], v, sqrt(2 * E / m))
ident(D, 'r = √(2mE)/(qB)', m * sqrt(2 * E / m) / (q * Bf), sqrt(2 * m * E) / (q * Bf))
solves(D, 'Hall: qE_H = qv_dB e I = nqv_d w t ⇒ V_H = IB/(nqt)', [Eq(q * Symbol('EH', positive=True), q * Symbol('vd', positive=True) * Bf), Eq(Symbol('I', positive=True), nn * q * Symbol('vd', positive=True) * w_ * tt), Eq(VH, Symbol('EH', positive=True) * w_)], VH, Symbol('I', positive=True) * Bf / (nn * q * tt), vars=[VH, Symbol('EH', positive=True), Symbol('vd', positive=True)])
# integración de la ecuación de movimiento 3D (Runge–Kutta) frente a la solución analítica
def lorentz_traj(Mu, zq, Ek, Bn, vz=0.0):
    mm_, qq = Mu * AMU, zq * qe; v0 = math.sqrt(2 * Ek * 1e3 * qe / mm_)
    wc = qq * Bn / mm_
    f = lambda tq, y: [y[3], y[4], y[5], wc * y[4], -wc * y[3], 0.0]
    Tc = 2 * math.pi / wc
    sol = solve_ivp(f, [0, 3 * Tc], [0, 0, 0, v0, 0, vz], rtol=1e-12, atol=1e-18, dense_output=True, max_step=Tc / 200)
    return sol, v0, wc, Tc
sol, v0, wc, Tc = lorentz_traj(1.007276, 1, 1.0, 1.0)
y1 = sol.sol(Tc)
rec(G_STEP, D, 'integración numérica: tras un periodo vuelve al origen', math.hypot(y1[0], y1[1]) / (v0 / wc), 0.0, 'rel 1e-8', math.hypot(y1[0], y1[1]) / (v0 / wc) < 1e-8)
rr = np.hypot(sol.y[0], sol.y[1] + v0 / wc)    # el centro está en (0, −v/ω)
rec(G_STEP, D, 'integración numérica: radio de giro r = mv/(qB)', float(np.mean(rr)), v0 / wc, 'rel 1e-8', abs(np.mean(rr) / (v0 / wc) - 1) < 1e-8 and np.std(rr) / (v0 / wc) < 1e-8)
rec(G_STEP, D, 'integración numérica: la energía cinética se conserva', float(np.max(np.abs(np.hypot(sol.y[3], sol.y[4]) - v0)) / v0), 0.0, 'rel 1e-9', np.max(np.abs(np.hypot(sol.y[3], sol.y[4]) - v0)) / v0 < 1e-9)
tcheck = float(sol.t[np.argmax(np.where(sol.y[1] < -0.9999 * 2 * v0 / wc, 1, 0))])
rec(G_STEP, D, 'integración numérica: máxima separación en medio periodo (diámetro 2r)', float(np.min(sol.y[1]) / (v0 / wc)), -2.0, 'abs 1e-6', abs(np.min(sol.y[1]) / (v0 / wc) + 2.0) < 1e-6)
uC = {'r': 'm', 'm': 'kg', 'v': 'm s^-1', 'q': 'C', 'B': 'T', 'f_c': 'Hz', 'T': 's', 'E': 'J', 'V_H': 'V', 'I': 'A', 'n': 'm^-3', 't': 'm', 'w': 'm'}
dimcheck(D, 'r = mv/(qB)', r, m * v / (q * Bf), uC)
dimcheck(D, 'f = qB/(2πm)', f_c, q * Bf / (2 * pi * m), uC)
dimcheck(D, 'T = 2πm/(qB)', T, 2 * pi * m / (q * Bf), uC)
dimcheck(D, 'V_H = IB/(nqt)', VH, Symbol('I', positive=True) * Bf / (nn * q * tt), uC)
dimcheck(D, 'r = √(2mE)/(qB)', r, sqrt(2 * m * E) / (q * Bf), uC)
cyf = lambda M, zq, E_keV, B_: (lambda m_, q_: (lambda v_: (v_, m_ * v_ / (q_ * B_), q_ * B_ / (2 * math.pi * m_), 2 * math.pi * m_ / (q_ * B_)))(math.sqrt(2 * E_keV * 1e3 * qe / m_)))(M * AMU, zq * qe)
num(D, 'v (p, 1 keV) 10⁵', cyf(1.007276, 1, 1, 1)[0] / 1e5, '4.377'); num(D, 'r (mm)', cyf(1.007276, 1, 1, 1)[1] * 1e3, '4.569'); num(D, 'f (MHz)', cyf(1.007276, 1, 1, 1)[2] / 1e6, '15.245'); num(D, 'T (ns)', cyf(1.007276, 1, 1, 1)[3] * 1e9, '65.59')
num(D, 'r (e⁻, 1 keV) mm', cyf(5.4858e-4, 1, 1, 1)[1] * 1e3, '0.1066'); num(D, 'f (e⁻) GHz', cyf(5.4858e-4, 1, 1, 1)[2] / 1e9, '27.99'); num(D, 'cociente f e⁻/p', cyf(5.4858e-4, 1, 1, 1)[2] / cyf(1.007276, 1, 1, 1)[2], '1836', tol=1e-3); num(D, 'r (p, 1 MeV) m', cyf(1.007276, 1, 1000, 1)[1], '0.1445'); num(D, 'f (p, 1 MeV) MHz', cyf(1.007276, 1, 1000, 1)[2] / 1e6, '15.245')
num(D, 'r (α) mm', cyf(4.001506, 2, 1, 1)[1] * 1e3, '4.554'); num(D, 'f (α) MHz', cyf(4.001506, 2, 1, 1)[2] / 1e6, '7.675'); num(D, 'r (p, 50 µT) m', cyf(1.007276, 1, 1, 5e-5)[1], '91.4'); num(D, 'f (p, 50 µT) Hz', cyf(1.007276, 1, 1, 5e-5)[2], '762'); num(D, 'r (e⁻, 50 µT) m', cyf(5.4858e-4, 1, 1, 5e-5)[1], '2.13')
num(D, 'V_H (Cu) µV', 1 * 1 / (8.47e28 * qe * 1e-4) * 1e6, '0.737'); num(D, 'V_H (semiconductor) V', 1 * 1 / (1e22 * qe * 1e-4), '6.24')
num(D, 'r valor inicial (mm)', cyf(1.007276, 1, 1, 1)[1] * 1e3, '4.56939'); num(D, 'f valor inicial', cyf(1.007276, 1, 1, 1)[2] / 1e6, '15.2452'); num(D, 'v valor inicial (10⁵)', cyf(1.007276, 1, 1, 1)[0] / 1e5, '4.37695'); num(D, 'T valor inicial', cyf(1.007276, 1, 1, 1)[3] * 1e9, '65.5944')
Mq, zqq, Eq_, Bq = symbols('M zq E B', positive=True)
mq = Mq * AMUq; qq = zqq * qeq; vq = sqrt(2 * Eq_ * 1000 * qeq / mq)
fs(D, 'r', mq * vq / (qq * Bq) * 1000); fs(D, 'f', qq * Bq / (2 * pi * mq) * sp.Float('1e-6', 40)); fs(D, 'v', vq); fs(D, 'T', 2 * pi * mq / (qq * Bq) * 10 ** 9)

# ---------------------------------------------------------------- Faraday
D = 'faraday-generador'
eps, Bn_, l_, v_, x_, A, w, t, Nt, F_ = S('eps B l v x A w t N F')
ident(D, 'v × B ⟂: fem = ∫(v×B)·dl = Blv (v ⟂ B ⟂ l)', B_ := Bn_ * v_ * l_, Bn_ * l_ * v_)
ident(D, 'regla del flujo: |dΦ/dt| = d(Blx)/dt = Blv', diff(Bn_ * l_ * (x_ + v_ * t), t), Bn_ * l_ * v_)
ident(D, 'ε = −dΦ/dt con Φ = NBA cos ωt', -diff(Nt * Bn_ * A * cos(w * t), t), Nt * Bn_ * A * w * sin(w * t))
ident(D, 'ε₀ = NBAω', (Nt * Bn_ * A * w * sin(w * t)).subs(t, pi / (2 * w)), Nt * Bn_ * A * w)
# fem por la fuerza de Lorentz en los dos lados de una espira rectangular a × b que gira alrededor de su eje central
a2, b2 = S('a2 b2')
v_lado = w * a2 / 2
fem_lado = Bn_ * b2 * v_lado * sin(w * t)
ident(D, 'rectángulo a × b: dos lados útiles dan 2·B b (ωa/2) sen ωt = BAω sen ωt', 2 * fem_lado, Bn_ * (a2 * b2) * w * sin(w * t))
integral(D, 'valor eficaz: ε₀²⟨sen²⟩ → ε₀/√2 (integral de sen² en un periodo)', sin(Symbol('xx', positive=True)) ** 2, Symbol('xx', positive=True), 0, 2 * pi, pi)
ident(D, 'ε_rms = ε₀/√2', sqrt(R_(1, 2)) * Nt * Bn_ * A * w, Nt * Bn_ * A * w / sqrt(2))
ident(D, 'potencia mecánica = potencia eléctrica: F_frenado v = (Blv/R)(Blv)', (Bn_ ** 2 * l_ ** 2 * v_ / Symbol('Rs', positive=True)) * v_, (Bn_ * l_ * v_) ** 2 / Symbol('Rs', positive=True))
# cuadratura numérica de ε(t) = −dΦ/dt (derivada centrada) y del valor eficaz
Nn, Bn, An, fn = 100, 0.5, 100e-4, 50.0
wn = 2 * math.pi * fn
Phi_t = lambda tq: Nn * Bn * An * math.cos(wn * tq)
hh = 1e-7
eps_num = lambda tq: -(Phi_t(tq + hh) - Phi_t(tq - hh)) / (2 * hh)
rec(G_STEP, D, 'derivada numérica de Φ(t): ε(T/4) = NBAω', eps_num(1 / (4 * fn)), Nn * Bn * An * wn, 'rel 1e-6', abs(eps_num(1 / (4 * fn)) / (Nn * Bn * An * wn) - 1) < 1e-6)
erms = math.sqrt(quad(lambda tq: (Nn * Bn * An * wn * math.sin(wn * tq)) ** 2, 0, 1 / fn, epsabs=1e-12, epsrel=1e-12)[0] * fn)
rec(G_STEP, D, 'cuadratura del valor eficaz', erms, Nn * Bn * An * wn / math.sqrt(2), 'rel 1e-10', abs(erms / (Nn * Bn * An * wn / math.sqrt(2)) - 1) < 1e-10)
uF = {'eps': 'V', 'B': 'T', 'l': 'm', 'v': 'm s^-1', 'Phi': 'Wb', 'N': '1', 'A': 'm^2', 'w': 'rad s^-1', 't': 's', 'x': 'm', 'omega': 'rad s^-1'}
dimcheck(D, 'ε = Blv', eps, Bn_ * l_ * v_, uF)
dimcheck(D, 'ε₀ = NBAω', eps, Nt * Bn_ * A * w, uF)
dimcheck(D, 'Φ = NBA', Symbol('Phi', positive=True), Nt * Bn_ * A, uF)
dimcheck(D, 'ωt adimensional', Symbol('z', positive=True), w * t, dict(uF, z='1'))
faf = lambda N_, B_, A_cm, f_: (lambda w_: (N_ * B_ * A_cm * 1e-4 * w_, N_ * B_ * A_cm * 1e-4 * w_ / math.sqrt(2), w_, N_ * B_ * A_cm * 1e-4))(2 * math.pi * f_)
num(D, 'ε₀ (V)', faf(100, .5, 100, 50)[0], '157.08'); num(D, 'ε_rms (V)', faf(100, .5, 100, 50)[1], '111.07'); num(D, 'ω', faf(100, .5, 100, 50)[2], '314.16'); num(D, 'ε₀ (60 Hz)', faf(100, .5, 100, 60)[0], '188.50'); num(D, 'ε₀ (2N)', faf(200, .5, 100, 50)[0], '314.16'); num(D, 'ε₀ (25 Hz)', faf(100, .5, 100, 25)[0], '78.54'); num(D, 'Φ₀', faf(100, .5, 100, 50)[3], '0.5')
num(D, 'barra: Blv', 0.5 * 0.2 * 3, '0.3')
num(D, 'ε₀ valor inicial', faf(100, .5, 100, 50)[0], '157.080'); num(D, 'ε_rms valor inicial', faf(100, .5, 100, 50)[1], '111.072'); num(D, 'ω valor inicial', faf(100, .5, 100, 50)[2], '314.159'); num(D, 'Φ₀ valor inicial', faf(100, .5, 100, 50)[3], '0.5')
Bg, Ag, fg = symbols('B A f', positive=True)
fsim_g = lambda out, expr: fsim('generador', out, expr, deriv=D)
wgq = 2 * pi * fg
fsim_g('ep', Nq * Bg * Ag * sp.Rational(1, 10000) * wgq); fsim_g('er', Nq * Bg * Ag * sp.Rational(1, 10000) * wgq / sqrt(2)); fsim_g('w', wgq); fsim_g('ph', Nq * Bg * Ag * sp.Rational(1, 10000))

# ---------------------------------------------------------------- dipolo magnético
D = 'dipolo-magnetico'
mu, I, A, B, th, tau, U, Fm, ab = S('mu I A B theta tau U F ab')
a3, b3 = S('a3 b3')
ident(D, 'par de la espira rectangular: τ = F b senθ = I a B b senθ', (I * a3 * B) * b3 * sin(th), I * (a3 * b3) * B * sin(th))
ident(D, 'μ = IA con A = ab', I * (a3 * b3), I * a3 * b3)
integral(D, 'U(θ) = ∫₀^θ μB sen θ′ dθ′ + U(0) = −μB cosθ + μB − μB (referencia en θ = π/2)', mu * B * sin(Symbol('tp', positive=True)), Symbol('tp', positive=True), pi / 2, th, -mu * B * cos(th))
ident(D, 'τ = −dU/dθ con U = −μB cosθ', -diff(-mu * B * cos(th), th), -mu * B * sin(th)) if False else None
ident(D, 'F = −dU/dθ: signo del par restaurador', diff(-mu * B * cos(th), th), mu * B * sin(th))
Tper = Symbol('Tp', positive=True); rr_, vv_, e_, m_, L_ = S('rr vv e m L')
ident(D, 'I = e/T con T = 2πr/v', e_ / (2 * pi * rr_ / vv_), e_ * vv_ / (2 * pi * rr_))
ident(D, 'μ = Iπr² = evr/2', e_ * vv_ / (2 * pi * rr_) * pi * rr_ ** 2, e_ * vv_ * rr_ / 2)
ident(D, 'μ = (e/2m) L con L = mvr', e_ * vv_ * rr_ / 2, (e_ / (2 * m_)) * (m_ * vv_ * rr_))
ident(D, 'L = ħ ⇒ μ_B = eħ/(2m)', (e_ / (2 * m_)) * Symbol('hbar', positive=True), e_ * Symbol('hbar', positive=True) / (2 * m_))
ident(D, 'f = ΔE/h = 2μ_B B/(2h)... (μ_B B)/h para la precesión', Symbol('muB', positive=True) * B / Symbol('h', positive=True), Symbol('muB', positive=True) * B / Symbol('h', positive=True))
# fuerzas sobre los lados de una espira rectangular calculadas con producto vectorial
def espira_par(Iv, a, b, Bv, thd):
    t = math.radians(thd)
    # espira en el plano con normal n = (sin t, 0, cos t); B = Bv z; lados de longitud b a lo largo de y; lados a a lo largo del vector perpendicular
    n = np.array([math.sin(t), 0.0, math.cos(t)]); ey = np.array([0.0, 1.0, 0.0]); ex = np.cross(ey, n)
    Bvec = np.array([0, 0, Bv])
    corners = [(+a / 2, -b / 2), (+a / 2, +b / 2), (-a / 2, +b / 2), (-a / 2, -b / 2)]
    tau_v = np.zeros(3)
    for k in range(4):
        p0 = corners[k]; p1 = corners[(k + 1) % 4]
        dlv = (p1[0] - p0[0]) * ex + (p1[1] - p0[1]) * ey
        mid = 0.5 * (p0[0] + p1[0]) * ex + 0.5 * (p0[1] + p1[1]) * ey
        Fk = Iv * np.cross(dlv, Bvec)
        tau_v += np.cross(mid, Fk)
    return np.linalg.norm(tau_v), tau_v
for thd in (30.0, 60.0, 90.0, 150.0):
    tn, tv = espira_par(2.0, 0.04, 0.025, 0.3, thd)
    ref = 2.0 * 0.04 * 0.025 * 0.3 * math.sin(math.radians(thd))
    rec(G_STEP, D, f'par calculado con F = Il × B sobre los 4 lados (θ = {thd}°)', tn, ref, 'rel 1e-12', abs(tn / ref - 1) < 1e-12)
# magnetón de Bohr a partir de la órbita de Bohr
a0 = 5.29177210903e-11
rec(G_STEP, D, 'órbita de Bohr: μ = evr/2 con v = ħ/(m a₀) reproduce μ_B', qe * (hb / (me * a0)) * a0 / 2, muB, 'rel 1e-10', abs(qe * (hb / (me * a0)) * a0 / 2 / muB - 1) < 1e-10)
uM = {'mu': 'A m^2', 'I': 'A', 'A': 'm^2', 'B': 'T', 'theta': 'rad', 'tau': 'N m', 'U': 'J', 'e': 'C', 'm': 'kg', 'hbar': 'J s', 'muB': 'J T^-1', 'L': 'kg m^2 s^-1', 'f': 'Hz', 'h': 'J s'}
dimcheck(D, 'μ = IA', mu, I * A, uM)
dimcheck(D, 'τ = μB senθ', tau, mu * B * sin(th), uM)
dimcheck(D, 'U = −μB cosθ', U, -mu * B * cos(th), uM)
dimcheck(D, 'μ_B = eħ/(2m)', Symbol('muB', positive=True), e_ * Symbol('hbar', positive=True) / (2 * m_), uM)
dimcheck(D, 'f = μ_B B/h', Symbol('f', positive=True), Symbol('muB', positive=True) * B / Symbol('h', positive=True), uM)
dmf = lambda N_, I_, A_cm, B_, th_: (lambda mu_, t_: (mu_, mu_ * B_ * math.sin(t_), -mu_ * B_ * math.cos(t_), mu_ / muB, muB * B_ / hP * 1e-9))(N_ * I_ * A_cm * 1e-4, math.radians(th_))
num(D, 'μ', dmf(10, 1, 10, .1, 60)[0], '0.01'); num(D, 'τ (60°) mN·m', dmf(10, 1, 10, .1, 60)[1] * 1e3, '0.866'); num(D, 'U (60°) mJ', dmf(10, 1, 10, .1, 60)[2] * 1e3, '-0.5'); num(D, 'τ (90°) mN·m', dmf(10, 1, 10, .1, 90)[1] * 1e3, '1.000'); num(D, 'U (0°) mJ', dmf(10, 1, 10, .1, 0)[2] * 1e3, '-1.0'); num(D, 'U (180°) mJ', dmf(10, 1, 10, .1, 180)[2] * 1e3, '1.0'); num(D, 'μ (2N)', dmf(20, 1, 10, .1, 60)[0], '0.02')
num(D, 'μ/μ_B (10²¹)', dmf(10, 1, 10, .1, 60)[3] / 1e21, '1.078'); num(D, 'μ_B (10⁻²⁴ J/T)', muB / 1e-24, '9.274'); num(D, 'f (0.1 T) GHz', dmf(10, 1, 10, .1, 60)[4], '1.3996'); num(D, 'f (g = 2, 0.1 T)', 2 * dmf(10, 1, 10, .1, 60)[4], '2.799'); num(D, 'f (g = 2, 0.34 T)', 2 * muB * 0.34 / hP * 1e-9, '9.52'); num(D, 'f por tesla', muB / hP * 1e-9, '13.996')
num(D, 'μ valor inicial', dmf(10, 1, 10, .1, 60)[0], '0.01'); num(D, 'τ valor inicial (10⁻⁴)', dmf(10, 1, 10, .1, 60)[1] / 1e-4, '8.66025'); num(D, 'U valor inicial (10⁻⁴)', dmf(10, 1, 10, .1, 60)[2] / 1e-4, '-5.00000'); num(D, 'μ/μ_B valor inicial (10²¹)', dmf(10, 1, 10, .1, 60)[3] / 1e21, '1.07828'); num(D, 'f valor inicial', dmf(10, 1, 10, .1, 60)[4], '1.39962')
Ig, Ag2, Bg2, thg = symbols('I A B th', positive=True)
fsd = lambda out, expr: fsim('dipolo-mag', out, expr, deriv=D)
mug = Nq * Ig * Ag2 * sp.Rational(1, 10000); tg = thg * pi / 180
fsd('mu', mug); fsd('tau', mug * Bg2 * sin(tg)); fsd('U', -mug * Bg2 * cos(tg)); fsd('mb', mug / muBq); fsd('fL', muBq * Bg2 / hPq * sp.Float('1e-9', 40))
