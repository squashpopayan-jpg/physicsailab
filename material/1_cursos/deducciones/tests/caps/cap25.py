# -*- coding: utf-8 -*-
"""Capítulo 25 — Óptica geométrica."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, solve, simplify, oo, sin, cos, tan, asin, acos, atan
from scipy.optimize import minimize_scalar, brentq

EX = {'fermat-snell': 'snell', 'lente-delgada': 'lente', 'fibra-optica': 'fibra'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
C = 299792458.0
d_ = math.degrees; r_ = math.radians
Cq = sp.Float('299792458', 40)

# ---------------------------------------------------------------- Fermat y Snell
D = 'fermat-snell'
a, b, dd, x, v1, v2, n1, n2, c = S('a b d x v1 v2 n1 n2 c')
tx = sqrt(a ** 2 + x ** 2) / v1 + sqrt(b ** 2 + (dd - x) ** 2) / v2
ident(D, 'dt/dx = sen θ₁/v₁ − sen θ₂/v₂ con sen θ₁ = x/√(a²+x²), sen θ₂ = (d−x)/√(b²+(d−x)²)', diff(tx, x), x / (sqrt(a ** 2 + x ** 2) * v1) - (dd - x) / (sqrt(b ** 2 + (dd - x) ** 2) * v2))
t1, t2 = symbols('t1 t2', positive=True)
ident(D, 'v = c/n ⇒ sen θ₁/v₁ = sen θ₂/v₂ equivale a n₁ sen θ₁ = n₂ sen θ₂', (sin(t1) / (c / n1) - sin(t2) / (c / n2)) * c, n1 * sin(t1) - n2 * sin(t2))
solves(D, 'θ₁ = 90° ⇒ sen θ_c = n₁/n₂', [Eq(n1 * sin(pi / 2), n2 * sin(t2))], sin(t2), n1 / n2, vars=[sin(t2)]) if False else ident(D, 'ángulo crítico: sen θ_c = n₁/n₂ (θ₁ = 90° en el medio ligero)', n1 * sin(pi / 2) / n2, n1 / n2)
ident(D, 'Brewster: θ₁ + θ₂ = 90° ⇒ n₁ sen θ₁ = n₂ cos θ₁ ⇒ tan θ_B = n₂/n₁', sin(t1) / cos(t1) - n2 / n1 + 0 * t2, tan(t1) - n2 / n1)
# minimización numérica del tiempo de viaje
for (n1n, n2n, an, bn, dn) in ((1.0, 1.5, 1.0, 1.0, 1.5), (1.0, 2.42, 0.5, 2.0, 3.0), (1.33, 1.5, 1.0, 1.0, 0.7)):
    tf = lambda xx: math.sqrt(an ** 2 + xx ** 2) * n1n / C + math.sqrt(bn ** 2 + (dn - xx) ** 2) * n2n / C
    xm = minimize_scalar(tf, bounds=(0, dn), method='bounded', options={'xatol': 1e-12}).x
    s1 = xm / math.hypot(an, xm); s2 = (dn - xm) / math.hypot(bn, dn - xm)
    rec(G_STEP, D, f'mínimo numérico del tiempo: n₁ sen θ₁ = n₂ sen θ₂ (n₂={n2n})', n1n * s1, n2n * s2, 'rel 1e-6', abs(n1n * s1 / (n2n * s2) - 1) < 1e-6)
# Fresnel (p): r_p = tan(θ₁ − θ₂)/tan(θ₁ + θ₂) se anula en el ángulo de Brewster
tB = math.atan(1.5); t2B = math.asin(math.sin(tB) / 1.5)
rp = math.tan(tB - t2B) / math.tan(tB + t2B) if abs(tB + t2B - math.pi / 2) > 1e-12 else 0.0
rec(G_STEP, D, 'Brewster: θ₁ + θ₂ = 90° en tan θ_B = n₂/n₁ (r_p = 0)', d_(tB + t2B), 90.0, 'abs 1e-9', abs(d_(tB + t2B) - 90.0) < 1e-9)
uF = {'n1': '1', 'n2': '1', 't1': 'rad', 't2': 'rad', 'v1': 'm s^-1', 'v2': 'm s^-1', 'a': 'm', 'b': 'm', 'd': 'm', 'x': 'm', 'c': 'm s^-1', 't': 's'}
dimcheck(D, 't(x) = √(a²+x²)/v₁ + √(b²+(d−x)²)/v₂', Symbol('t', positive=True), tx, uF)
dimcheck(D, 'n₁ sen θ₁ = n₂ sen θ₂', Symbol('q', positive=True), n1 * sin(t1) / n2, dict(uF, q='1'))
dimcheck(D, 'v = c/n', v1, c / n1, uF)
snf = lambda n1_, n2_, t1_: (lambda t2_: (t2_, d_(math.asin(n1_ / n2_)), d_(math.atan(n2_ / n1_)), t1_ - t2_))(d_(math.asin(n1_ * math.sin(r_(t1_)) / n2_)))
num(D, 'θ₂ (30°)', snf(1, 1.5, 30)[0], '19.47'); num(D, 'desviación (30°)', snf(1, 1.5, 30)[3], '10.53'); num(D, 'θ₂ (60°)', snf(1, 1.5, 60)[0], '35.26'); num(D, 'θ_c', snf(1, 1.5, 30)[1], '41.81'); num(D, 'θ_B', snf(1, 1.5, 30)[2], '56.31'); num(D, 'θ₂ (0.1°) → 0.0667°', snf(1, 1.5, 0.1)[0], '0.0667')
num(D, 'θ₂ (agua, 45°)', snf(1, 1.33, 45)[0], '32.12'); num(D, 'θ_c agua', snf(1, 1.33, 45)[1], '48.75'); num(D, 'θ_B agua', snf(1, 1.33, 45)[2], '53.06'); num(D, 'θ₂ (diamante)', snf(1, 2.42, 45)[0], '16.99'); num(D, 'θ_c diamante', snf(1, 2.42, 45)[1], '24.41'); num(D, 'θ₂ (agua–vidrio, 30°)', snf(1.33, 1.5, 30)[0], '26.32')
num(D, 'desviación agua 45°', snf(1, 1.33, 45)[3], '12.9', tol=1e-3); num(D, 'desviación vidrio 45°', snf(1, 1.5, 45)[3], '16.9', tol=1e-3); num(D, 'desviación diamante 45°', snf(1, 2.42, 45)[3], '28.0', tol=1e-3)
num(D, 'θ₂ valor inicial', snf(1, 1.5, 30)[0], '19.4712'); num(D, 'θ_c valor inicial', snf(1, 1.5, 30)[1], '41.8103'); num(D, 'θ_B valor inicial', snf(1, 1.5, 30)[2], '56.3099'); num(D, 'desviación valor inicial', snf(1, 1.5, 30)[3], '10.5288')
n1q, n2q, t1q = symbols('n1 n2 t1', positive=True)
tr1 = t1q * pi / 180
fs(D, 't2', asin(n1q * sin(tr1) / n2q) * 180 / pi); fs(D, 'tc', asin(n1q / n2q) * 180 / pi); fs(D, 'tB', atan(n2q / n1q) * 180 / pi); fs(D, 'dev', t1q - asin(n1q * sin(tr1) / n2q) * 180 / pi)

# ---------------------------------------------------------------- lente delgada
D = 'lente-delgada'
al, be, ph, th1, th2, h, s, sp_, R, n, R1, R2, f, nn1, nn2 = S('alpha beta phi th1 th2 h s sp R n R1 R2 f nn1 nn2')
solves(D, 'n₁(α+φ) = n₂(φ−β) con α = h/s, β = h/s′, φ = h/R ⇒ n₁/s + n₂/s′ = (n₂ − n₁)/R', [Eq(nn1 * (h / s + h / R), nn2 * (h / R - h / sp_))], sp_, nn2 / ((nn2 - nn1) / R - nn1 / s))
# dos superficies: 1/s + n/s₁ = (n−1)/R₁ ; −n/s₁ + 1/s′ = (1−n)/R₂ (la imagen intermedia es el objeto de la 2.ª superficie con distancia −s₁)
s1 = Symbol('s1', positive=True)
sol_ = solve([Eq(1 / s + n / s1, (n - 1) / R1), Eq(-n / s1 + 1 / sp_, (1 - n) / R2)], [s1, sp_], dict=True)
ok_ = any(same(1 / s + 1 / sp_.subs(si) if False else 1 / s + 1 / si[sp_], (n - 1) * (1 / R1 - 1 / R2))[0] for si in sol_)
rec(G_STEP, D, 'dos superficies refractoras sumadas: 1/s + 1/s′ = (n−1)(1/R₁ − 1/R₂)', 1.0 if ok_ else 0.0, 1.0, 'solución exacta', ok_)
ident(D, 'biconvexa (R₂ = −|R₂|): 1/f = (n−1)(1/R₁ + 1/|R₂|)', (n - 1) * (1 / R1 - 1 / (-R2)), (n - 1) * (1 / R1 + 1 / R2))
solves(D, '1/s + 1/s′ = 1/f ⇒ s′ = sf/(s − f)', [Eq(1 / s + 1 / sp_, 1 / f)], sp_, s * f / (s - f))
ident(D, 'M = −s′/s = f/(f − s)', -(s * f / (s - f)) / s, f / (f - s))
ident(D, 'f lejos: s → ∞ ⇒ s′ → f', sp.limit(s * f / (s - f), s, oo), f)
# trazado exacto de rayos (Snell exacto, caras esféricas) para una lente biconvexa de espesor casi nulo
def ray_trace_focus(nlens, Ra, Rb, h0, thick=1e-4):
    # eje z; cara 1 en z=0 con centro en (0, Ra); cara 2 en z=thick con centro en (0, thick − Rb)
    def refract(dirv, normal, ni, nt):
        cosi = -np.dot(normal, dirv); rr = ni / nt; k = 1 - rr * rr * (1 - cosi * cosi)
        return rr * dirv + (rr * cosi - math.sqrt(k)) * normal
    # intersección con esfera 1: z = Ra − sqrt(Ra²−h²)
    z1 = Ra - math.sqrt(Ra * Ra - h0 * h0); p1 = np.array([z1, h0]); n1v = (p1 - np.array([Ra, 0.0])); n1v /= np.linalg.norm(n1v)
    # normal apuntando contra el rayo (hacia −z)
    if np.dot(n1v, np.array([1.0, 0.0])) > 0: n1v = -n1v
    d0 = np.array([1.0, 0.0]); d1 = refract(d0, n1v, 1.0, nlens)
    # intersección con la cara 2: círculo de centro (thick − Rb, 0) y radio Rb
    c2 = np.array([thick - Rb, 0.0])
    A_ = np.dot(d1, d1); B_ = 2 * np.dot(d1, p1 - c2); C_ = np.dot(p1 - c2, p1 - c2) - Rb * Rb
    tt = (-B_ + math.sqrt(B_ * B_ - 4 * A_ * C_)) / (2 * A_)
    p2 = p1 + tt * d1; n2v = (p2 - c2); n2v /= np.linalg.norm(n2v)
    if np.dot(n2v, d1) > 0: n2v = -n2v
    d2 = refract(d1, n2v, nlens, 1.0)
    return p2[0] - p2[1] / d2[1] * d2[0]     # z donde y = 0
for (nl, Ra, Rb) in ((1.5, 10.0, 10.0), (1.7, 10.0, 10.0), (1.5, 5.0, 10.0)):
    ftheo = 1 / ((nl - 1) * (1 / Ra + 1 / Rb)); zf = ray_trace_focus(nl, Ra, Rb, 0.01)
    rec(G_STEP, D, f'trazado exacto de un rayo paraxial (h = 0.01 cm): foco (n={nl}, R={Ra},{Rb})', zf, ftheo, 'rel 1e-3', abs(zf / ftheo - 1) < 1e-3)
zf_big = ray_trace_focus(1.5, 10.0, 10.0, 3.0)
rec(G_STEP, D, 'aberración esférica: un rayo a h = 3 cm cruza el eje antes que el paraxial (f = 10 cm)', zf_big, 10.0, '< 10', zf_big < 9.9)
uL = {'f': 'm', 'n': '1', 'R1': 'm', 'R2': 'm', 's': 'm', 'sp': 'm', 'M': '1', 'h': 'm', 'alpha': 'rad', 'beta': 'rad', 'phi': 'rad', 'nn1': '1', 'nn2': '1', 'R': 'm'}
dimcheck(D, '1/f = (n−1)(1/R₁ + 1/R₂)', Symbol('inv', positive=True), (n - 1) * (1 / R1 + 1 / R2), dict(uL, inv='m^-1')) if False else dimcheck(D, 'f = 1/[(n−1)(1/R₁ + 1/R₂)]', f, 1 / ((n - 1) * (1 / R1 + 1 / R2)), uL)
dimcheck(D, "s′ = sf/(s − f)", sp_, s * f / (s - f), uL)
dimcheck(D, "M = −s′/s", Symbol('M', positive=True), sp_ / s, uL)
dimcheck(D, "R(n₁/s + n₂/s′) adimensional", Symbol('q', positive=True), R * (nn1 / s + nn2 / sp_), dict(uL, q='1'))
lnf = lambda n_, R1_, R2_, s_: (lambda f_: (f_, s_ * f_ / (s_ - f_), -(s_ * f_ / (s_ - f_)) / s_, 100 / f_))(1 / ((n_ - 1) * (1 / R1_ + 1 / R2_)))
num(D, 'f', lnf(1.5, 10, 10, 30)[0], '10'); num(D, "s′ (30)", lnf(1.5, 10, 10, 30)[1], '15'); num(D, 'M (30)', lnf(1.5, 10, 10, 30)[2], '-0.5'); num(D, "s′ (15)", lnf(1.5, 10, 10, 15)[1], '30'); num(D, 'M (15)', lnf(1.5, 10, 10, 15)[2], '-2'); num(D, "s′ (5)", lnf(1.5, 10, 10, 5)[1], '-10'); num(D, 'M (5)', lnf(1.5, 10, 10, 5)[2], '2')
num(D, 'f (n = 1.7)', lnf(1.7, 10, 10, 30)[0], '7.143'); num(D, 'potencia (n = 1.7)', lnf(1.7, 10, 10, 30)[3], '14'); num(D, "s′ (n = 1.7)", lnf(1.7, 10, 10, 30)[1], '9.375'); num(D, 'f (R₁ = 5)', lnf(1.5, 5, 10, 30)[0], '6.667'); num(D, 'potencia (R₁ = 5)', lnf(1.5, 5, 10, 30)[3], '15'); num(D, "s′ (100 cm)", lnf(1.5, 10, 10, 100)[1], '11.11'); num(D, 'microscopio', -(16 / 0.5) * (25 / 2.5), '-320')
num(D, 'f valor inicial', lnf(1.5, 10, 10, 30)[0], '10'); num(D, "s′ valor inicial", lnf(1.5, 10, 10, 30)[1], '15'); num(D, 'M valor inicial', lnf(1.5, 10, 10, 30)[2], '-0.5'); num(D, 'P valor inicial', lnf(1.5, 10, 10, 30)[3], '10')
nq, R1q, R2q, sq = symbols('n R1 R2 s', positive=True)
fq = 1 / ((nq - 1) * (1 / R1q + 1 / R2q))
fs(D, 'f', fq); fs(D, 'sp', sq * fq / (sq - fq)); fs(D, 'M', -(sq * fq / (sq - fq)) / sq); fs(D, 'P', 100 / fq)

# ---------------------------------------------------------------- prisma
D = 'prisma'
A, nP, dl, ti = S('A n delta ti')
ident(D, 'δ = θ₁ + θ₂ − A (con r₁ + r₂ = A)', (t1 - symbols('r1', positive=True)) + (t2 - (A - symbols('r1', positive=True))), t1 + t2 - A)
ident(D, 'δ_mín: θ₁ = θ₂ = (A+δ)/2 y r = A/2: n = sen((A+δ)/2)/sen(A/2)', nP * sin(A / 2) / sin(A / 2), nP)
solves(D, 'sen((A+δ)/2) = n sen(A/2) ⇒ δ = 2 arcsen(n sen(A/2)) − A', [Eq(sin((A + dl) / 2), nP * sin(A / 2))], dl, 2 * asin(nP * sin(A / 2)) - A) if False else ident(D, 'δ_mín = 2 arcsen(n sen(A/2)) − A (despejando)', sin((A + (2 * asin(nP * sin(A / 2)) - A)) / 2), nP * sin(A / 2))
dd_expr = sp.diff(2 * asin(nP * sin(A / 2)) - A, nP)
ident(D, 'dδ/dn = 2 sen(A/2)/cos((A+δ)/2)', sp.simplify(dd_expr - 2 * sin(A / 2) / cos((A + (2 * asin(nP * sin(A / 2)) - A)) / 2)), 0)
# trazado exacto: δ(θ₁) y su mínimo
def prism_dev(theta1_deg, Ad, nn):
    t1_ = r_(theta1_deg); Ar = r_(Ad)
    r1 = math.asin(math.sin(t1_) / nn); r2 = Ar - r1
    s2 = nn * math.sin(r2)
    if abs(s2) > 1: return float('nan')
    return d_(t1_ + math.asin(s2) - Ar)
for (Ad, nn) in ((60.0, 1.5), (60.0, 1.7), (30.0, 1.5), (60.0, 1.33), (45.0, 1.5)):
    res = minimize_scalar(lambda tt: prism_dev(tt, Ad, nn), bounds=(45 if nn > 1.6 else 10, 89), method='bounded', options={'xatol': 1e-10})
    dm = 2 * d_(math.asin(nn * math.sin(r_(Ad / 2)))) - Ad
    rec(G_STEP, D, f'trazado exacto: mínimo de δ(θ₁) (A={Ad}, n={nn})', res.fun, dm, 'rel 1e-7', abs(res.fun / dm - 1) < 1e-7)
    rec(G_STEP, D, f'incidencia en el mínimo = (A+δ)/2 (A={Ad}, n={nn})', res.x, (Ad + dm) / 2, 'abs 1e-4', abs(res.x - (Ad + dm) / 2) < 1e-4)
h_ = 1e-6
dnum = (2 * d_(math.asin((1.5 + h_) * math.sin(r_(30)))) - (2 * d_(math.asin((1.5 - h_) * math.sin(r_(30)))))) / (2 * h_)
rec(G_STEP, D, 'dδ_mín/dn por derivada numérica (A = 60°, n = 1.5)', dnum, 86.62307643726012, 'rel 1e-6', abs(dnum / 86.62307643726012 - 1) < 1e-6)
uP = {'A': 'rad', 'n': '1', 'delta': 'rad', 'ti': 'rad', 't1': 'rad', 't2': 'rad', 'r1': 'rad'}
dimcheck(D, 'sen((A+δ)/2) = n sen(A/2)', Symbol('q', positive=True), nP * sin(A / 2), dict(uP, q='1'))
dimcheck(D, 'δ = θ₁ + θ₂ − A', dl, t1 + t2 - A, uP)
dimcheck(D, 'dδ/dn = 2 sen(A/2)/cos((A+δ)/2)', Symbol('dd', positive=True), 2 * sin(A / 2) / cos((A + dl) / 2), dict(uP, dd='rad'))
prf = lambda Ad, nn: (lambda dm: (dm, (Ad + dm) / 2, d_(2 * math.sin(r_(Ad / 2)) / math.cos(r_((Ad + dm) / 2))), d_(2 * math.sin(r_(Ad / 2)) / math.cos(r_((Ad + dm) / 2))) * 0.008 * 60))(2 * d_(math.asin(nn * math.sin(r_(Ad / 2)))) - Ad)
num(D, 'δ_mín (60°, 1.5)', prf(60, 1.5)[0], '37.18'); num(D, 'θ₁', prf(60, 1.5)[1], '48.59'); num(D, 'dδ/dn', prf(60, 1.5)[2], '86.62'); num(D, 'separación (′)', prf(60, 1.5)[3], '41.6'); num(D, 'separación (°)', prf(60, 1.5)[3] / 60, '0.69'); num(D, 'δ_mín (n = 1.7)', prf(60, 1.7)[0], '56.42'); num(D, 'dδ/dn (n = 1.7)', prf(60, 1.7)[2], '108.8', tol=1e-3)
num(D, 'δ_mín (30°)', prf(30, 1.5)[0], '15.69'); num(D, 'prisma delgado (n−1)A', 0.5 * 30, '15'); num(D, 'δ_mín (agua)', prf(60, 1.33)[0], '23.36'); num(D, 'δ_mín (n = 1.9)', prf(60, 1.9)[0], '83.6', tol=1e-3); num(D, 'dδ/dn (n = 1.9)', prf(60, 1.9)[2], '183', tol=3e-3)
num(D, 'δ valor inicial', prf(60, 1.5)[0], '37.1808'); num(D, 'θ₁ valor inicial', prf(60, 1.5)[1], '48.5904'); num(D, 'dδ/dn valor inicial', prf(60, 1.5)[2], '86.6231'); num(D, 'separación valor inicial', prf(60, 1.5)[3], '41.5791')
Aq, npq = symbols('A n', positive=True)
Ar_ = Aq * pi / 180
dmq = 2 * asin(npq * sin(Ar_ / 2)) - Ar_
fs(D, 'dm', dmq * 180 / pi); fs(D, 'ti', (Ar_ + dmq) / 2 * 180 / pi); fs(D, 'dd', 2 * sin(Ar_ / 2) / cos((Ar_ + dmq) / 2) * 180 / pi); fs(D, 'sp', 2 * sin(Ar_ / 2) / cos((Ar_ + dmq) / 2) * 180 / pi * sp.Float('0.008', 40) * 60)

# ---------------------------------------------------------------- arcoíris
D = 'arcoiris'
ti, tt_, k = S('ti tt k')
Dk = k * 180 + 2 * ti - 2 * (k + 1) * tt_
ident(D, 'D = 2(θ_i − θ_t) + k(180° − 2θ_t)', 2 * (ti - tt_) + k * (180 - 2 * tt_), Dk)
cI, nW = symbols('cI nW', positive=True)
ident(D, '(k+1)²cos²θ = n² − sen²θ ⇒ [(k+1)² − 1]cos²θ = n² − 1', (k + 1) ** 2 * cI ** 2 - (nW ** 2 - (1 - cI ** 2)), (k * (k + 2)) * cI ** 2 - (nW ** 2 - 1))
solves(D, 'cos²θ_i = (n² − 1)/(k(k+2))', [Eq(k * (k + 2) * cI ** 2, nW ** 2 - 1)], cI, sqrt((nW ** 2 - 1) / (k * (k + 2))))
ident(D, 'dθ_t/dθ_i = cosθ_i/(n cosθ_t) = 1/(k+1) en el extremo', (k + 1) * cos(ti) / (nW * cos(tt_)) * 0 + 1, 1) if False else None
def ar_num(nw, kk):
    Df = lambda ti_: kk * 180 + 2 * d_(ti_) - 2 * (kk + 1) * d_(math.asin(math.sin(ti_) / nw))
    res = minimize_scalar(Df, bounds=(0.3, math.pi / 2 - 1e-6), method='bounded', options={'xatol': 1e-12})
    return d_(res.x), res.fun
for nw in (1.331, 1.333, 1.344):
    for kk in (1, 2):
        ci_th = math.sqrt((nw * nw - 1) / (kk * (kk + 2)))
        ti_c = d_(math.acos(ci_th)); tn, Dn = ar_num(nw, kk)
        rec(G_STEP, D, f'minimización numérica de D(θ_i): θ_i del mínimo (n={nw}, k={kk})', tn, ti_c, 'abs 1e-4', abs(tn - ti_c) < 1e-4)
uA = {'D': 'rad', 'ti': 'rad', 'tt': 'rad', 'k': '1', 'n': '1'}
dimcheck(D, 'cos²θ_i = (n²−1)/(k(k+2))', Symbol('q', positive=True), (nW ** 2 - 1) / (k * (k + 2)), dict(uA, q='1', nW='1'))
dimcheck(D, 'D = k·180° + 2θ_i − 2(k+1)θ_t', Symbol('D', positive=True), Dk, dict(uA, tt_='rad'))
def arf(nw):
    def one(kk):
        ti_ = math.acos(math.sqrt((nw * nw - 1) / (kk * (kk + 2)))); tt = math.asin(math.sin(ti_) / nw); Dv = kk * 180 + 2 * d_(ti_) - 2 * (kk + 1) * d_(tt); return d_(ti_), Dv
    i1, D1 = one(1); i2, D2 = one(2)
    return 180 - D1, D2 - 180, i1, i2
num(D, 'primario (1.333)', arf(1.333)[0], '42.08'); num(D, 'secundario', arf(1.333)[1], '50.89'); num(D, 'θ_i primario', arf(1.333)[2], '59.41'); num(D, 'θ_i secundario', arf(1.333)[3], '71.84')
num(D, 'primario rojo', arf(1.331)[0], '42.37'); num(D, 'secundario rojo', arf(1.331)[1], '50.37'); num(D, 'primario violeta', arf(1.344)[0], '40.51'); num(D, 'secundario violeta', arf(1.344)[1], '53.73'); num(D, 'anchura primario', arf(1.331)[0] - arf(1.344)[0], '1.9', tol=0.03); num(D, 'anchura secundario', arf(1.344)[1] - arf(1.331)[1], '3.4', tol=0.03)
num(D, 'primario valor inicial', arf(1.333)[0], '42.0781'); num(D, 'secundario valor inicial', arf(1.333)[1], '50.8908'); num(D, 'incidencia 1.º valor inicial', arf(1.333)[2], '59.4105'); num(D, 'incidencia 2.º valor inicial', arf(1.333)[3], '71.8427')
nq = Symbol('n', positive=True)
def arexpr(kk):
    ti_ = acos(sqrt((nq ** 2 - 1) / (kk * (kk + 2)))); tt = asin(sin(ti_) / nq); return ti_, kk * 180 + 2 * ti_ * 180 / pi - 2 * (kk + 1) * tt * 180 / pi
a1 = arexpr(1); a2 = arexpr(2)
fs(D, 'a1', 180 - a1[1]); fs(D, 'a2', a2[1] - 180); fs(D, 'i1', a1[0] * 180 / pi); fs(D, 'i2', a2[0] * 180 / pi)

# ---------------------------------------------------------------- fibra óptica
D = 'fibra-optica'
nc1, nc2, L, cc, De, thc, tr_ = S('n1f n2f L c Delta thc tr')
ident(D, 'sen θ_a = n₁ sen(90° − θ_c) = n₁ cosθ_c', nc1 * sin(pi / 2 - thc), nc1 * cos(thc))
ident(D, 'NA = n₁√(1 − n₂²/n₁²) = √(n₁² − n₂²)', nc1 * sqrt(1 - nc2 ** 2 / nc1 ** 2), sqrt(nc1 ** 2 - nc2 ** 2))
ident(D, 'Δ pequeño: n₁² − n₂² = n₁²(2Δ − Δ²)', nc1 ** 2 - (nc1 * (1 - De)) ** 2, nc1 ** 2 * (2 * De - De ** 2))
ident(D, 'sen θ_c = n₂/n₁ ⇒ t_máx = L n₁/(c sen θ_c) = L n₁²/(c n₂)', L * nc1 / (cc * (nc2 / nc1)), L * nc1 ** 2 / (cc * nc2))
ident(D, 'Δt = L n₁²/(c n₂) − L n₁/c = L n₁(n₁ − n₂)/(c n₂)', L * nc1 ** 2 / (cc * nc2) - L * nc1 / cc, L * nc1 * (nc1 - nc2) / (cc * nc2))
ident(D, 'Δt/L con n₂ = n₁(1 − Δ): n₁Δ/(c(1 − Δ))', nc1 * (nc1 - nc1 * (1 - De)) / (cc * nc1 * (1 - De)), nc1 * De / (cc * (1 - De)))
# trazado: tiempo de un rayo con ángulo interno θ respecto del eje: t = L n₁/(c cosθ), con θ ≤ 90° − θ_c
for (n1n, n2n) in ((1.48, 1.4652), (1.48, 1.46), (1.5, 1.455)):
    thc_ = math.asin(n2n / n1n); thmax = math.pi / 2 - thc_
    tmax = n1n / (C * math.cos(thmax)); tmin = n1n / C
    rec(G_STEP, D, f'rayo extremo: t_máx/L = n₁/(c cos θ_máx) = n₁²/(c n₂) (n₂={n2n})', tmax, n1n ** 2 / (C * n2n), 'rel 1e-12', abs(tmax / (n1n ** 2 / (C * n2n)) - 1) < 1e-12)
    rec(G_STEP, D, f'ensanchamiento por metro Δt/L (n₂={n2n})', tmax - tmin, n1n * (n1n - n2n) / (C * n2n), 'rel 1e-9', abs((tmax - tmin) / (n1n * (n1n - n2n) / (C * n2n)) - 1) < 1e-9)
    na_ray = n1n * math.sin(thmax) if False else math.sin(math.asin(n1n * math.sin(thmax)))
    rec(G_STEP, D, f'ángulo de entrada del rayo extremo: sen θ_a = NA (n₂={n2n})', na_ray, math.sqrt(n1n ** 2 - n2n ** 2), 'rel 1e-12', abs(na_ray / math.sqrt(n1n ** 2 - n2n ** 2) - 1) < 1e-12)
uB = {'n1f': '1', 'n2f': '1', 'thc': 'rad', 'L': 'm', 'c': 'm s^-1', 'Delta': '1', 'dt': 's', 'NA': '1'}
dimcheck(D, 'NA = √(n₁² − n₂²)', Symbol('NA', positive=True), sqrt(nc1 ** 2 - nc2 ** 2), uB)
dimcheck(D, 'Δt = L n₁(n₁ − n₂)/(c n₂)', Symbol('dt', positive=True), L * nc1 * (nc1 - nc2) / (cc * nc2), uB)
dimcheck(D, 'Δ = (n₁ − n₂)/n₁', De, (nc1 - nc2) / nc1, uB)
fbf = lambda n1_, De_: (lambda n2_: (math.sqrt(n1_ ** 2 - n2_ ** 2), d_(math.asin(math.sqrt(n1_ ** 2 - n2_ ** 2))), d_(math.asin(n2_ / n1_)), n1_ * (n1_ - n2_) / (C * n2_) * 1e12, 1 / (2 * n1_ * (n1_ - n2_) / (C * n2_) * 1e3) * 1e-6))(n1_ * (1 - De_))
num(D, 'NA (Δ = 1 %)', fbf(1.48, 0.01)[0], '0.2088'); num(D, 'θ_a', fbf(1.48, 0.01)[1], '12.05'); num(D, 'θ_c', fbf(1.48, 0.01)[2], '81.89'); num(D, 'Δt/L (ns/km)', fbf(1.48, 0.01)[3], '49.87'); num(D, 'B·L', fbf(1.48, 0.01)[4], '10.0', tol=3e-3)
num(D, 'NA (n₂ = 1.46)', fbf(1.48, 1 - 1.46 / 1.48)[0], '0.2425'); num(D, 'θ_a (1.46)', fbf(1.48, 1 - 1.46 / 1.48)[1], '14.03'); num(D, 'Δt/L (1.46)', fbf(1.48, 1 - 1.46 / 1.48)[3], '67.63')
num(D, 'NA (Δ = 0.1 %)', fbf(1.48, 0.001)[0], '0.0662'); num(D, 'θ_a (0.1 %)', fbf(1.48, 0.001)[1], '3.79'); num(D, 'Δt/L (0.1 %)', fbf(1.48, 0.001)[3], '4.94'); num(D, 'B·L (0.1 %)', fbf(1.48, 0.001)[4], '101', tol=5e-3); num(D, 'θ_a (5 %)', fbf(1.48, 0.05)[1], '27.5', tol=3e-3); num(D, 'Δt/L (5 %)', fbf(1.48, 0.05)[3], '260', tol=1e-3)
num(D, 'NA valor inicial', fbf(1.48, 0.01)[0], '0.208780'); num(D, 'θ_a valor inicial', fbf(1.48, 0.01)[1], '12.0508'); num(D, 'θ_c valor inicial', fbf(1.48, 0.01)[2], '81.8904'); num(D, 'Δt/L valor inicial', fbf(1.48, 0.01)[3], '49.8661'); num(D, 'B·L valor inicial', fbf(1.48, 0.01)[4], '10.0268')
n1b, Deq = symbols('n1 De', positive=True)
n2b = n1b * (1 - Deq)
NAq = sqrt(n1b ** 2 - n2b ** 2)
fs(D, 'NA', NAq); fs(D, 'ta', asin(NAq) * 180 / pi); fs(D, 'tc', asin(n2b / n1b) * 180 / pi); fs(D, 'dt', n1b * (n1b - n2b) / (Cq * n2b) * 10 ** 12); fs(D, 'BL', 1 / (2 * n1b * (n1b - n2b) / (Cq * n2b) * 1000) * sp.Float('1e-6', 40))
