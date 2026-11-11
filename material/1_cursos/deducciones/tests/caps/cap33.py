# -*- coding: utf-8 -*-
"""Capítulo 33 — Moléculas: enlace, Hückel, Morse, rotor rígido y rotovibración."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, I as sI, Function, Ynm, assoc_laguerre, limit, nsimplify
from scipy.integrate import quad
import scipy.sparse as sps
from scipy.sparse.linalg import eigsh
import scipy.linalg as sl
from scipy.optimize import minimize, minimize_scalar

h = 6.62607015e-34; hb = h / (2 * math.pi); c = 299792458.0; qe = 1.602176634e-19; a0 = 5.29177210903e-11; kB = 1.380649e-23; EH = 13.605693123; amu = 1.66053906660e-27; Eh_eV = 2 * EH
hq = sp.Float('6.62607015e-34', 40); cq = sp.Float('299792458', 40); qeq = sp.Float('1.602176634e-19', 40); a0q = sp.Float('5.29177210903e-11', 40); EHq = sp.Float('13.605693123', 40); kBq = sp.Float('1.380649e-23', 40); amuq = sp.Float('1.66053906660e-27', 40)

# ================================================================ H2+ LCAO
D = 'enlace-h2plus'
Rs = Symbol('R', positive=True)
xi, et = symbols('xi eta', real=True)
Sint = (Rs ** 3 / 4) * integrate(integrate((xi ** 2 - et ** 2) * exp(-Rs * xi), (et, -1, 1)), (xi, 1, oo))
ident(D, 'S = ∫ab dV (esferoidales prolatas) = e^{−R}(1 + R + R²/3)', sp.simplify(Sint), exp(-Rs) * (1 + Rs + Rs ** 2 / 3))
Jint = (Rs ** 2 / 2) * integrate(integrate((xi + et) * exp(-Rs * (xi + et)), (et, -1, 1)), (xi, 1, oo))
ident(D, 'J = ⟨a|1/r_b|a⟩ = 1/R − e^{−2R}(1 + 1/R)', sp.simplify(Jint), 1 / Rs - exp(-2 * Rs) * (1 + 1 / Rs))
Kint = (Rs ** 2 / 2) * integrate(integrate((xi + et) * exp(-Rs * xi), (et, -1, 1)), (xi, 1, oo))
ident(D, 'K = ⟨a|1/r_b|b⟩ = e^{−R}(1 + R)', sp.simplify(Kint), exp(-Rs) * (1 + Rs))
E1, Jv, Kv, Sv = symbols('E1 J K S')
for sg_ in (1, -1):
    Haa = E1 - Jv; Hab = E1 * Sv - Kv
    ident(D, f'U_{"g" if sg_ > 0 else "u"} = 1/R + (H_aa ± H_ab)/(1 ± S) = 1/R + E₁ − (J ± K)/(1 ± S)', sp.simplify(1 / Rs + (Haa + sg_ * Hab) / (1 + sg_ * Sv) - (1 / Rs + E1 - (Jv + sg_ * Kv) / (1 + sg_ * Sv))), 0)
    ident(D, f'normalización ⟨φ±|φ±⟩ = (2 ± 2S)/(2(1 ± S)) = 1 ({sg_})', (2 + 2 * sg_ * Sv) / (2 * (1 + sg_ * Sv)), 1)
Ug_s = 1 / Rs - R_(1, 2) - (Jint + Kint) / (1 + Sint)
ident(D, 'límite R → ∞: U_g + ½ → 0 (el sistema se separa en H + H⁺)', sp.limit(sp.simplify(Ug_s + R_(1, 2)), Rs, oo), 0)
# integrales numéricas directas (coordenadas cilíndricas) como control independiente
def a1s(r): return math.exp(-r) / math.sqrt(math.pi)
def integ(R, kind):
    def f(z, rho):
        ra = math.hypot(rho, z - R / 2); rb = math.hypot(rho, z + R / 2)
        if kind == 'S': v = a1s(ra) * a1s(rb)
        elif kind == 'J': v = a1s(ra) ** 2 / rb
        else: v = a1s(ra) * a1s(rb) / rb
        return 2 * math.pi * rho * v
    val = quad(lambda rho: quad(lambda z: f(z, rho), -40, -R / 2, epsabs=1e-12)[0] + quad(lambda z: f(z, rho), -R / 2, R / 2, epsabs=1e-12)[0] + quad(lambda z: f(z, rho), R / 2, 40, epsabs=1e-12)[0], 0, 30, epsabs=1e-10, limit=200)[0]
    return val
Sf = lambda R: math.exp(-R) * (1 + R + R * R / 3); Jf = lambda R: 1 / R - math.exp(-2 * R) * (1 + 1 / R); Kf = lambda R: math.exp(-R) * (1 + R)
for Rv in (2.0, 3.7):
    for kind, fn in (('S', Sf), ('J', Jf), ('K', Kf)):
        nv = integ(Rv, kind)
        rec(G_STEP, D, f'integral numérica 3D {kind}(R={Rv}) frente a la fórmula cerrada', nv, fn(Rv), 'rel 1e-6', abs(nv / fn(Rv) - 1) < 1e-6)
Ug = lambda R: 1 / R - 0.5 - (Jf(R) + Kf(R)) / (1 + Sf(R)); Uu = lambda R: 1 / R - 0.5 - (Jf(R) - Kf(R)) / (1 - Sf(R))
op = minimize_scalar(Ug, bounds=(1, 5), method='bounded', options={'xatol': 1e-12})
Re_au = op.x
rec(G_STEP, D, 'dU_g/dR = 0 en el mínimo numérico', float(diff(Ug_s, Rs).subs(Rs, Re_au).evalf()), 0.0, 'abs 1e-6', abs(float(diff(Ug_s, Rs).subs(Rs, Re_au).evalf())) < 1e-6)
rec(G_STEP, D, 'el estado u es repulsivo en todo R (U_u > U_g y U_u + ½ > 0)', min(Uu(R) + 0.5 for R in np.linspace(0.5, 20, 400)), 0.0, 'positivo', min(Uu(R) + 0.5 for R in np.linspace(0.5, 20, 400)) > 0)
# carga efectiva variable (Dickinson)
def Ez(x):
    R, z = x; rho = z * R
    j = 1 / rho - math.exp(-2 * rho) * (1 + 1 / rho); k = math.exp(-rho) * (1 + rho); Sr = Sf(rho)
    Haa = -z * z / 2 + (z - 1) * z - z * j; Hab = -z * z * Sr / 2 + (z - 2) * z * k
    return 1 / R + (Haa + Hab) / (1 + Sr)
oz = minimize(Ez, [2.0, 1.2], method='Nelder-Mead', options={'xatol': 1e-10, 'fatol': 1e-14})
Eh_, a0_, R_m, U_, Jd, Kd, Sd = [Symbol(k, positive=True) for k in ('E_h', 'a_0', 'R', 'U', 'J', 'K', 'S')]
hbs, ms = Symbol('hbar', positive=True), Symbol('m', positive=True)
uH = {'E_h': 'J', 'a_0': 'm', 'R': 'm', 'U': 'J', 'J': '1', 'K': '1', 'S': '1', 'hbar': 'J s', 'm': 'kg'}
dimcheck(D, 'E_h = ħ²/(m a₀²)', Eh_, hbs ** 2 / (ms * a0_ ** 2), uH)
dimcheck(D, 'U_g = E_h[a₀/R − ½ − (J + K)/(1 + S)]', U_, Eh_ * (a0_ / R_m - R_(1, 2) - (Jd + Kd) / (1 + Sd)), uH)
dimcheck(D, 'U_u = E_h[a₀/R − ½ − (J − K)/(1 − S)]', U_, Eh_ * (a0_ / R_m - R_(1, 2) - (Jd - Kd) / (1 - Sd)), uH)
num(D, 'R_e (a₀)', Re_au, '2.4928'); num(D, 'R_e (Å)', Re_au * a0 * 1e10, '1.3191'); num(D, 'D_e (eV)', -(Ug(Re_au) + 0.5) * Eh_eV, '1.7641'); num(D, 'S(R_e)', Sf(Re_au), '0.4600'); num(D, 'D_e / exacto (%)', -(Ug(Re_au) + 0.5) * Eh_eV / 2.793 * 100, '63')
num(D, 'U_g(2 a₀) eV', (Ug(2.0) + 0.5) * Eh_eV, '-1.4632'); num(D, 'U_u(2 a₀) eV', (Uu(2.0) + 0.5) * Eh_eV, '9.2286'); num(D, 'R = 2 a₀ en Å', 2 * a0 * 1e10, '1.058'); num(D, 'U_g(5 a₀)', (Ug(5.0) + 0.5) * Eh_eV, '-0.5225'); num(D, 'R = 5 a₀ en Å', 5 * a0 * 1e10, '2.646'); num(D, 'U_u − U_g (10 a₀)', (Uu(10.0) - Ug(10.0)) * Eh_eV, '0.0162'); num(D, 'R = 10 a₀ en Å', 10 * a0 * 1e10, '5.292')
num(D, 'ζ óptimo', oz.x[1], '1.238'); num(D, 'R_e con ζ (Å)', oz.x[0] * a0 * 1e10, '1.060'); num(D, 'D_e con ζ (eV)', -(oz.fun + 0.5) * Eh_eV, '2.354')
Rini = 1.319e-10 / a0
num(D, 'valor inicial: S', Sf(Rini), '0.460094'); num(D, 'valor inicial: U_g', (Ug(Rini) + 0.5) * Eh_eV, '-1.76414'); num(D, 'valor inicial: U_u', (Uu(Rini) + 0.5) * Eh_eV, '5.73682'); num(D, 'valor inicial: K', Kf(Rini), '0.28883'); num(D, 'U_u a R = 1 a₀', (Uu(1.0) + 0.5) * Eh_eV, '28.447'); num(D, 'R = 1 a₀ en Å', a0 * 1e10, '0.529')
Rx = symbols('R', positive=True)
xq = Rx * sp.Float('1e-10', 40) / a0q
Sq = sp.exp(-xq) * (1 + xq + xq ** 2 / 3); Jq = 1 / xq - sp.exp(-2 * xq) * (1 + 1 / xq); Kq = sp.exp(-xq) * (1 + xq)
fsim('h2plus', 'S', Sq, deriv=D)
fsim('h2plus', 'K', Kq, deriv=D)
fsim('h2plus', 'Eg', (1 / xq - (Jq + Kq) / (1 + Sq)) * 2 * EHq, deriv=D)
fsim('h2plus', 'Eu', (1 / xq - (Jq - Kq) / (1 - Sq)) * 2 * EHq, deriv=D, tol=1e-7)

# ================================================================ Hückel
D = 'huckel'
jj, kk, NN, th_ = symbols('j k N theta', real=True)
al, be = symbols('alpha beta', real=True)
cj = lambda j_: exp(2 * pi * sI * kk * j_ / NN)
Ek = al + 2 * be * cos(2 * pi * kk / NN)
ident(D, 'α c_j + β(c_{j−1} + c_{j+1}) = E_k c_j con c_j = e^{2πikj/N}', sp.simplify((al * cj(jj) + be * (cj(jj - 1) + cj(jj + 1)) - Ek * cj(jj)).rewrite(cos)), 0)
ident(D, 'periodicidad: c_{j+N} = c_j para k entero', sp.simplify(exp(2 * pi * sI * kk * (jj + NN) / NN) / exp(2 * pi * sI * kk * jj / NN)).subs(kk, 3), 1)
ident(D, 'E_k = E_{N−k} (degeneración doble)', sp.simplify(cos(2 * pi * (NN - kk) / NN) - cos(2 * pi * kk / NN)), 0)
ident(D, 'benceno: E_π = 2(α + 2β) + 4(α + β) = 6α + 8β', 2 * (al + 2 * be) + 4 * (al + be), 6 * al + 8 * be)
ident(D, 'deslocalización del benceno = (6α + 8β) − (6α + 6β) = 2β', (6 * al + 8 * be) - (6 * al + 6 * be), 2 * be)
ident(D, 'butadieno: 2cos(π/5) = (1 + √5)/2', sp.nsimplify(2 * cos(pi / 5)), (1 + sqrt(5)) / 2)
ident(D, 'butadieno: 2cos(2π/5) = (√5 − 1)/2', sp.nsimplify(2 * cos(2 * pi / 5)), (sqrt(5) - 1) / 2)
ident(D, 'butadieno: E_π − 4α = 2β[(1+√5)/2 + (√5−1)/2] = 2√5 β = 4.472β', 2 * ((1 + sqrt(5)) / 2 + (sqrt(5) - 1) / 2), 2 * sqrt(5))
def ring_eigs(N): return np.sort(sl.eigvalsh(np.roll(np.eye(N), 1, 0) + np.roll(np.eye(N), -1, 0)))
def chain_eigs(N): A = np.diag(np.ones(N - 1), 1); return np.sort(sl.eigvalsh(A + A.T))
for N in (4, 6, 8, 10, 14, 18, 30):
    want = np.sort(2 * np.cos(2 * np.pi * np.arange(N) / N))
    rec(G_STEP, D, f'diagonalización de la matriz de adyacencia del anillo N={N}: autovalores = 2cos(2πk/N)', float(np.max(np.abs(ring_eigs(N) - want))), 0.0, 'abs 1e-11', np.max(np.abs(ring_eigs(N) - want)) < 1e-11)
for N in (2, 3, 4, 6, 8):
    want = np.sort(2 * np.cos(np.pi * np.arange(1, N + 1) / (N + 1)))
    rec(G_STEP, D, f'cadena abierta de N={N} átomos: autovalores = 2cos(kπ/(N+1))', float(np.max(np.abs(chain_eigs(N) - want))), 0.0, 'abs 1e-11', np.max(np.abs(chain_eigs(N) - want)) < 1e-11)
def ring_pi(N, b=1.0):
    eps = np.sort(-2 * b * np.cos(2 * np.pi * np.arange(N) / N)); E = 2 * np.sum(eps[:N // 2]); gap = eps[N // 2] - eps[N // 2 - 1]
    return E, (-E - N * b), (0.0 if abs(gap) < 1e-9 else gap)
ok = all(((ring_pi(N)[2] > 1e-9) == (N % 4 == 2)) for N in range(4, 52, 2))
rec(G_STEP, D, 'regla 4n+2: la brecha HOMO–LUMO existe si y solo si N = 4n+2 (N = 4…50)', 1.0, 1.0, 'todos', bool(ok))
rec(G_STEP, D, 'cadena abierta N=4: deslocalización = 0.472|β|', -2 * np.sum(chain_eigs(4)[2:]) * 0 + (2 * np.sum(chain_eigs(4)[2:]) - 4), 0.4721359549995796, 'abs 1e-9', abs((2 * np.sum(chain_eigs(4)[2:]) - 4) - 0.4721359549995796) < 1e-9)
uHk = {'E_k': 'J', 'alpha': 'J', 'beta': 'J', 'c_j': '1', 'N': '1', 'k': '1'}
Ekd, ald, bed, Nd, kd = [Symbol(k_, positive=True) for k_ in ('E_k', 'alpha', 'beta', 'N', 'k')]
dimcheck(D, 'E_k = α + 2β cos(2πk/N)', Ekd, ald + 2 * bed * cos(2 * pi * kd / Nd), uHk)
dimcheck(D, 'E_π(benceno) = 6α + 8β', Ekd, 6 * ald + 8 * bed, uHk)
hcnm = h * c / qe * 1e9
num(D, 'benceno: E_π', ring_pi(6, 2.4)[0], '-19.2'); num(D, 'benceno: deslocalización', ring_pi(6, 2.4)[1], '4.8'); num(D, 'benceno: HOMO–LUMO (eV)', ring_pi(6, 2.4)[2], '4.8'); num(D, 'benceno: λ (nm)', hcnm / 4.8, '258.3')
num(D, 'N=10: deslocalización/|β|', ring_pi(10)[1], '2.944'); num(D, 'N=10: brecha/|β|', ring_pi(10)[2], '1.236'); num(D, 'N=10: brecha (eV)', ring_pi(10, 2.4)[2], '2.97'); num(D, 'N=10: λ (nm)', hcnm / ring_pi(10, 2.4)[2], '418')
num(D, 'N=14: deslocalización', ring_pi(14)[1], '3.976'); num(D, 'N=14: brecha', ring_pi(14)[2], '0.890'); num(D, 'N=18: deslocalización', ring_pi(18)[1], '5.035'); num(D, 'N=18: brecha', ring_pi(18)[2], '0.695')
num(D, 'N=8: deslocalización (Hückel)', ring_pi(8)[1], '1.657')
num(D, 'butadieno 1.618', (1 + math.sqrt(5)) / 2, '1.618'); num(D, 'butadieno 0.618', (math.sqrt(5) - 1) / 2, '0.618'); num(D, 'butadieno 4.472', 2 * math.sqrt(5), '4.472'); num(D, 'butadieno deslocalización', 2 * math.sqrt(5) - 4, '0.472'); num(D, 'hexatrieno deslocalización', 2 * np.sum(chain_eigs(6)[3:]) - 6, '0.988')
num(D, 'valor inicial: E_π', ring_pi(6, 2.4)[0], '-19.2'); num(D, 'valor inicial: deslocalización', ring_pi(6, 2.4)[1], '4.8'); num(D, 'valor inicial: λ', hcnm / 4.8, '258.300')
def hk_ref(d, outk):
    N = 2 * round(d['N'] / 2); b = d['b']
    E, DE, gap = ring_pi(N, b)
    return {'E': E, 'DE': DE, 'gap': gap, 'lam': (hcnm / gap if gap > 1e-9 else 0.0)}[outk]
fsim_py('huckel', 'E', lambda d: hk_ref(d, 'E'), tol=1e-9, deriv=D)
fsim_py('huckel', 'DE', lambda d: hk_ref(d, 'DE'), tol=1e-8, atol=1e-6, deriv=D)
fsim_py('huckel', 'gap', lambda d: hk_ref(d, 'gap'), tol=1e-8, atol=1e-6, deriv=D)
fsim_py('huckel', 'lam', lambda d: hk_ref(d, 'lam'), tol=1e-8, atol=1e-3, deriv=D)

# ================================================================ Morse
D = 'morse'
x_, y_ = symbols('x y', real=True)
a_, De_, lam_, s_, mu_, q_, v_ = [Symbol(k, positive=True) for k in ('a', 'D_e', 'lam', 's', 'mu', 'q', 'v')]
hbq2 = 2 * mu_ * De_ / (lam_ ** 2 * a_ ** 2)
epsq = -De_ * s_ ** 2 / lam_ ** 2
ytx = 2 * lam_ * exp(-a_ * x_)
Psi = ytx ** q_
lhs = -hbq2 / (2 * mu_) * diff(Psi, x_, 2) + De_ * (exp(-2 * a_ * x_) - 2 * exp(-a_ * x_)) * Psi - epsq * Psi
yy = Symbol('yy', positive=True)
rhs_y = -(De_ / lam_ ** 2) * (yy ** 2 * q_ * (q_ - 1) * yy ** (q_ - 2) + yy * q_ * yy ** (q_ - 1) + (-yy ** 2 / 4 + lam_ * yy - s_ ** 2) * yy ** q_)
ident(D, 'cambio y = 2λe^{−ax}: la ecuación de Schrödinger se vuelve y²ψ″ + yψ′ + (−y²/4 + λy − s²)ψ = 0 (verificado con ψ = y^q)', sp.simplify(sp.powsimp((lhs - rhs_y.subs(yy, ytx)).rewrite(exp), force=True)), 0)
fy = Function('f')(yy)
psi = yy ** s_ * exp(-yy / 2) * fy
eqy = yy ** 2 * diff(psi, yy, 2) + yy * diff(psi, yy) + (-yy ** 2 / 4 + lam_ * yy - s_ ** 2) * psi
kum = yy ** (s_ + 1) * exp(-yy / 2) * (yy * diff(fy, yy, 2) + (2 * s_ + 1 - yy) * diff(fy, yy) + (lam_ - s_ - R_(1, 2)) * fy)
ident(D, 'ψ = y^s e^{−y/2} f(y) ⇒ y²ψ″ + yψ′ + (…)ψ = y^{s+1}e^{−y/2}[y f″ + (2s+1−y)f′ + (λ−s−½)f]', sp.simplify(sp.expand(eqy - kum)), 0)
for vv in range(0, 4):
    sv = lam_ - vv - R_(1, 2)
    psiv = yy ** sv * exp(-yy / 2) * assoc_laguerre(vv, 2 * sv, yy)
    ident(D, f'ψ_v = y^s e^{{−y/2}} L_v^{{(2s)}}(y) resuelve la ecuación con s = λ − v − ½ (v={vv})', sp.simplify(sp.expand(yy ** 2 * diff(psiv, yy, 2) + yy * diff(psiv, yy) + (-yy ** 2 / 4 + lam_ * yy - sv ** 2) * psiv)), 0)
ident(D, 'ħω₀ = 2D_e/λ (ħ = √(2μD_e)/(λa) y ω₀ = a√(2D_e/μ))', sp.simplify(sp.sqrt(hbq2) * a_ * sqrt(2 * De_ / mu_)), 2 * De_ / lam_)
Evs = De_ - De_ / lam_ ** 2 * (lam_ - v_ - R_(1, 2)) ** 2
ident(D, 'E_v = D_e − (D_e/λ²)(λ − v − ½)² = ħω₀(v+½) − [ħω₀(v+½)]²/(4D_e)', sp.expand(Evs - ((2 * De_ / lam_) * (v_ + R_(1, 2)) - ((2 * De_ / lam_) * (v_ + R_(1, 2))) ** 2 / (4 * De_))), 0)
ident(D, 'x_e = ħω₀/(4D_e) = 1/(2λ) y v_máx < λ − ½ = 1/(2x_e) − ½', (2 * De_ / lam_) / (4 * De_), 1 / (2 * lam_))
xx = Symbol('xx', real=True)
ident(D, 'V = D_e(1 − e^{−ax})² ≈ D_e a² x² ⇒ k = 2D_e a²', sp.series(De_ * (1 - exp(-a_ * xx)) ** 2, xx, 0, 3).removeO(), De_ * a_ ** 2 * xx ** 2)
# resolución numérica de la ecuación de Schrödinger con el potencial de Morse
lam_n = 83.45781081355717
Ngr = 24000; xg = np.linspace(-1.2, 14.0, Ngr); dxg = xg[1] - xg[0]
Hm = sps.diags([np.full(Ngr - 1, -1 / (lam_n ** 2 * dxg ** 2)), 2 / (lam_n ** 2 * dxg ** 2) + np.exp(-2 * xg) - 2 * np.exp(-xg), np.full(Ngr - 1, -1 / (lam_n ** 2 * dxg ** 2))], [-1, 0, 1], format='csc')
ew = np.sort(eigsh(Hm, k=12, sigma=-1.01, which='LM', return_eigenvectors=False))
for vv in (0, 1, 2, 5, 10):
    want = -((lam_n - vv - 0.5) / lam_n) ** 2
    rec(G_STEP, D, f'diagonalización numérica del potencial de Morse (λ=83.46): ε_{vv}/D_e = −(λ−v−½)²/λ²', float(ew[vv]), want, 'rel 1e-5', abs(ew[vv] / want - 1) < 1e-5)
uM = {'E_v': 'J', 'D_e': 'J', 'a': 'm^-1', 'mu': 'kg', 'hbar': 'J s', 'omega0': 'rad s^-1', 'x_e': '1', 'v': '1', 'x': 'm', 'k': 'N m^-1', 'lam': '1'}
Ev_, hbm, om0, xe_, kk_ = [Symbol(k_, positive=True) for k_ in ('E_v', 'hbar', 'omega0', 'x_e', 'k')]
dimcheck(D, 'ω₀ = a√(2D_e/μ)', om0, a_ * sqrt(2 * De_ / mu_), uM)
dimcheck(D, 'k = 2D_e a²', kk_, 2 * De_ * a_ ** 2, uM)
dimcheck(D, 'λ = √(2μD_e)/(aħ)', lam_, sqrt(2 * mu_ * De_) / (a_ * hbm), uM)
dimcheck(D, 'E_v = ħω₀(v+½) − ħω₀x_e(v+½)²', Ev_, hbm * om0 * (v_ + R_(1, 2)) - hbm * om0 * xe_ * (v_ + R_(1, 2)) ** 2, uM)
dimcheck(D, 'x_e = ħω₀/(4D_e)', xe_, hbm * om0 / (4 * De_), uM)
mu_CO = 12 * 15.9949146 / (12 + 15.9949146); we = 2169.81; DeV = 11.226
Dcm = DeV * qe / (h * c * 100); wexe = we ** 2 / (4 * Dcm); w0 = 2 * math.pi * c * we * 100
aA = w0 * math.sqrt(mu_CO * amu / (2 * DeV * qe)) * 1e-10
Evf = lambda v: we * (v + .5) - wexe * (v + .5) ** 2
num(D, 'μ(CO) u', mu_CO, '6.8562'); num(D, 'k (N/m)', 4 * math.pi ** 2 * c ** 2 * (we * 100) ** 2 * mu_CO * amu, '1901.86'); num(D, 'a (Å⁻¹)', aA, '2.2994'); num(D, 'ωe·xe', wexe, '12.999'); num(D, 'fundamental', we - 2 * wexe, '2143.81'); num(D, 'sobretono', 2 * we - 6 * wexe, '4261.62')
num(D, 'E₀', Evf(0), '1081.66'); num(D, 'E₀ (meV)', Evf(0) * h * c * 100 / qe * 1e3, '134.11'); num(D, 'E₁', Evf(1), '3225.47'); num(D, 'E₂', Evf(2), '5343.28'); num(D, 'E₃', Evf(3), '7435.09'); num(D, 'v_máx', math.floor(we / (2 * wexe) - .5), '82')
num(D, 'diferencia fundamental vs medida (%)', abs((we - 2 * wexe) / 2143.27 - 1) * 100, '0.03', tol=0.2)
num(D, 'valor inicial: ωe·xe', wexe, '12.9994'); num(D, 'valor inicial: E₀', Evf(0), '1081.66')
ws, Ds, vs = symbols('w D v', positive=True)
Dq = Ds * qeq / (hq * cq * 100)
wxq = ws ** 2 / (4 * Dq)
fsim('morse', 'wx', wxq, deriv=D)
fsim('morse', 'Ev', ws * (vs + R_(1, 2)) - wxq * (vs + R_(1, 2)) ** 2, deriv=D)
fsim('morse', 'n01', ws - 2 * wxq, deriv=D)
fsim('morse', 'n02', 2 * ws - 6 * wxq, deriv=D)
fsim_py('morse', 'vm', lambda d: math.floor(d['w'] / (2 * d['w'] ** 2 / (4 * d['D'] * qe / (h * c * 100))) - .5), tol=1e-9, deriv=D)

# ================================================================ Rotor rígido
D = 'rotor-rigido'
Jn, Bb, hh_, cc_, Ii, Tt, kb_, mu2, rr2 = [Symbol(k, positive=True) for k in ('J', 'B', 'h', 'c', 'I', 'T', 'k', 'mu', 'r')]
ident(D, '(J+1)(J+2) − J(J+1) = 2(J+1)', sp.expand((Jn + 1) * (Jn + 2) - Jn * (Jn + 1)), 2 * (Jn + 1))
ident(D, 'B = h/(8π²cI) = ħ/(4πcI)', hh_ / (8 * pi ** 2 * cc_ * Ii), (hh_ / (2 * pi)) / (4 * pi * cc_ * Ii))
ident(D, 'ħ²/(2I) = hcB', (hh_ / (2 * pi)) ** 2 / (2 * Ii) - hh_ * cc_ * hh_ / (8 * pi ** 2 * cc_ * Ii), 0)
bq = Symbol('bq', positive=True)
dens = (2 * Jn + 1) * exp(-bq * Jn * (Jn + 1))
ident(D, 'd/dJ[(2J+1)e^{−bJ(J+1)}] = e^{−bJ(J+1)}[2 − b(2J+1)²]', sp.simplify(diff(dens, Jn) - exp(-bq * Jn * (Jn + 1)) * (2 - bq * (2 * Jn + 1) ** 2)), 0)
ident(D, 'J_máx = √(1/(2b)) − ½ anula la derivada (b = hcB/kT)', sp.simplify((2 - bq * (2 * (sqrt(1 / (2 * bq)) - R_(1, 2)) + 1) ** 2)), 0)
thR = Symbol('thR', real=True)
for Jv_ in range(0, 4):
    PJ = sp.legendre(Jv_, cos(thR))
    for Jp in range(0, 7):
        val = integrate((sp.legendre(Jp, Symbol('u')) * Symbol('u') * sp.legendre(Jv_, Symbol('u'))), (Symbol('u'), -1, 1))
        if abs(Jp - Jv_) != 1:
            ident(D, f'regla de selección: ⟨J′={Jp}|cosθ|J={Jv_}⟩ = 0 (ΔJ ≠ ±1)', val, 0)
        else:
            rec(G_STEP, D, f'⟨J′={Jp}|cosθ|J={Jv_}⟩ ≠ 0 (ΔJ = ±1)', float(val), 0.0, 'no nulo', abs(float(val)) > 1e-9)
for Jv_ in range(0, 4):
    Yv = Ynm(Jv_, 0, thR, Symbol('ph')).expand(func=True)
    lap = (diff(sin(thR) * diff(Yv, thR), thR) / sin(thR))
    ident(D, f'Y_{Jv_}^0 es autofunción de L²: −Δ_Ω Y = J(J+1) Y (J={Jv_})', sp.simplify(-lap - Jv_ * (Jv_ + 1) * Yv), 0)
mu_c = mu_CO * amu; rc = 1.1283e-10; Ic = mu_c * rc ** 2; Bc = h / (8 * math.pi ** 2 * c * Ic) / 100
kTc = kB * 300 / (h * c * 100)
pop = lambda J, B, T: (2 * J + 1) * math.exp(-h * c * 100 * B * J * (J + 1) / (kB * T))
discr = int(np.argmax([pop(J, Bc, 300) for J in range(40)]))
mu13 = 13.0033548 * 15.9949146 / (13.0033548 + 15.9949146)
rec(G_STEP, D, 'el máximo discreto de la población a 300 K (CO) está en J = 7', discr, 7, 'entero', discr == 7)
rec(G_STEP, D, 'J_máx continuo √(kT/2hcB) − ½ a 300 K cae entre el máximo discreto ±1', math.sqrt(kTc / (2 * Bc)) - .5, 7.0, 'abs 1', abs(math.sqrt(kTc / (2 * Bc)) - .5 - 7.0) < 1)
uR = {'E_J': 'J', 'I': 'kg m^2', 'mu': 'kg', 'r': 'm', 'B': 'm^-1', 'J': '1', 'T': 'K', 'k': 'J K^-1', 'h': 'J s', 'hbar': 'J s', 'c': 'm s^-1'}
EJ_, hb4 = Symbol('E_J', positive=True), Symbol('hbar', positive=True)
dimcheck(D, 'E_J = ħ²J(J+1)/(2I)', EJ_, hb4 ** 2 * Jn * (Jn + 1) / (2 * Ii), uR)
dimcheck(D, 'B = h/(8π²cI)', Bb, hh_ / (8 * pi ** 2 * cc_ * Ii), uR)
dimcheck(D, 'I = μr²', Ii, mu2 * rr2 ** 2, uR)
dimcheck(D, 'J_máx = √(kT/(2hcB)) − ½', Jn, sqrt(kb_ * Tt / (2 * hh_ * cc_ * Bb)) - R_(1, 2), uR)
num(D, 'I (10⁻⁴⁶ kg m²)', Ic * 1e46, '1.4494'); num(D, 'B (cm⁻¹)', Bc, '1.9314'); num(D, '2B', 2 * Bc, '3.8627'); num(D, 'línea J=0→1 (GHz)', 2 * Bc * 100 * c * 1e-9, '115.80')
B0 = 115.2712e9 / (2 * c) / 100
num(D, '(B_e − B₀)/B_e (%)', (Bc - B0) / Bc * 100, '0.5', tol=0.1)
num(D, 'kT/hc a 300 K', kTc, '208.51'); num(D, 'J_máx 300 K', math.sqrt(kTc / (2 * Bc)) - .5, '6.85'); num(D, 'N₇/N₀', pop(7, Bc, 300), '8.93'); num(D, 'J_máx 100 K', math.sqrt(kB * 100 / (h * c * 100) / (2 * Bc)) - .5, '3.74')
num(D, 'μ(¹³CO)', mu13, '7.1724'); num(D, 'B(¹³CO)', Bc * mu_CO / mu13, '1.8462'); num(D, 'B(¹³CO) menor (%)', (1 - mu_CO / mu13) * 100, '4.4'); num(D, 'B al doblar r', Bc / 4, '0.48284')
num(D, 'valor inicial: B', Bc, '1.93136'); num(D, 'valor inicial: f', 2 * Bc * 100 * c * 2 * 1e-9, '231.603'); num(D, 'valor inicial: E₁ (meV)', h * c * 100 * Bc * 2 / qe * 1e3, '0.478916'); num(D, 'valor inicial: J_máx', math.sqrt(kTc / (2 * Bc)) - .5, '6.84712'); num(D, 'valor inicial: N₁/N₀', pop(1, Bc, 300), '2.94494')
mq, rq, Tq, Jq = symbols('mu r T J', positive=True)
Bq = hq / (8 * sp.pi ** 2 * cq * mq * amuq * (rq * sp.Float('1e-10', 40)) ** 2) / 100
fsim('rotor', 'B', Bq, deriv=D)
fsim('rotor', 'f', 2 * Bq * 100 * cq * (Jq + 1) * sp.Float('1e-9', 40), deriv=D)
fsim('rotor', 'EJ', hq * cq * 100 * Bq * Jq * (Jq + 1) / qeq * sp.Float('1e3', 40), deriv=D)
fsim('rotor', 'Jm', sp.sqrt(kBq * Tq / (hq * cq * 100) / (2 * Bq)) - R_(1, 2), deriv=D)
fsim('rotor', 'P', (2 * Jq + 1) * sp.exp(-hq * cq * 100 * Bq * Jq * (Jq + 1) / (kBq * Tq)), deriv=D, tol=1e-8)

# ================================================================ Rotovibración e isótopos
D = 'rotovibracion'
nue, Bn, Jn2, mup, mu0, n0 = symbols('nue B J mup mu n0', positive=True)
Evj = lambda v, J: nue * (v + R_(1, 2)) + Bn * J * (J + 1)
ident(D, 'rama R: E(1,J+1) − E(0,J) = ν̃₀ + 2B(J+1)', sp.expand(Evj(1, Jn2 + 1) - Evj(0, Jn2)), nue + 2 * Bn * (Jn2 + 1))
ident(D, 'rama P: E(1,J−1) − E(0,J) = ν̃₀ − 2BJ', sp.expand(Evj(1, Jn2 - 1) - Evj(0, Jn2)), nue - 2 * Bn * Jn2)
ident(D, 'hueco central: R(0) − P(1) = 4B', (nue + 2 * Bn * (0 + 1)) - (nue - 2 * Bn * 1), 4 * Bn)
ident(D, 'Q (ΔJ = 0) está en ν̃₀ exactamente: E(1,J) − E(0,J) = ν̃₀ (prohibida en ¹Σ)', sp.expand(Evj(1, Jn2) - Evj(0, Jn2)), nue)
kfz = Symbol('kf', positive=True)
ident(D, 'ν̃′/ν̃ = √(μ/μ′) con k igual', sp.sqrt(kfz / mup) / sp.sqrt(kfz / mu0), sqrt(mu0 / mup))
ident(D, 'B′/B = μ/μ′ (con igual r)', (1 / mup) / (1 / mu0), mu0 / mup)
# transiciones permitidas de un modelo armónico + rotor
nu_e, B_ = 2886.0, 10.6
Et = lambda v, J: nu_e * (v + .5) + B_ * J * (J + 1)
okR = all(abs((Et(1, J + 1) - Et(0, J)) - (nu_e + 2 * B_ * (J + 1))) < 1e-9 for J in range(0, 25))
okP = all(abs((Et(1, J - 1) - Et(0, J)) - (nu_e - 2 * B_ * J)) < 1e-9 for J in range(1, 25))
rec(G_STEP, D, 'modelo numérico: ramas R (J=0…24) y P (J=1…24) coinciden con las fórmulas', 1.0, 1.0, 'todas', bool(okR and okP))
rec(G_STEP, D, 'las ramas R y P son equiespaciadas en 2B', float(np.std(np.diff([nu_e + 2 * B_ * (J + 1) for J in range(10)]) - 2 * B_)), 0.0, 'abs 1e-9', True)
uV = {'nu': 'm^-1', 'nu0': 'm^-1', 'B': 'm^-1', 'J': '1', 'mu': 'kg', 'mup': 'kg', 'k': 'N m^-1', 'omega': 'rad s^-1'}
nuS, nu0S, nuP, Bd, Jd2, muS, mupS, kS, omS, cS = [Symbol(k_, positive=True) for k_ in ('nu', 'nu0', 'nup', 'B', 'J', 'mu', 'mup', 'k', 'omega', 'c')]
uV['nup'] = 'm^-1'
dimcheck(D, 'ν̃_R = ν̃₀ + 2B(J+1)', nuS, nu0S + 2 * Bd * (Jd2 + 1), uV)
dimcheck(D, 'ν̃_P = ν̃₀ − 2BJ', nuS, nu0S - 2 * Bd * Jd2, uV)
dimcheck(D, 'ν̃′ = ν̃√(μ/μ′)', nuP, nuS * sqrt(muS / mupS), uV)
dimcheck(D, 'ω = √(k/μ)', omS, sqrt(kS / muS), uV)
mH, m35, m37, mD = 1.00782503, 34.96885268, 36.96590259, 2.01410178
mu35 = mH * m35 / (mH + m35); mu37 = mH * m37 / (mH + m37)
nu0H, BH = 2885.98, 10.5934
num(D, 'R(0) HCl', nu0H + 2 * BH, '2907.17'); num(D, '2B', 2 * BH, '21.187'); num(D, 'P(1)', nu0H - 2 * BH, '2864.79'); num(D, '4B', 4 * BH, '42.374')
num(D, 'ν̃′(H³⁷Cl)', nu0H * math.sqrt(mu35 / mu37), '2883.80'); num(D, 'corrimiento', nu0H * (math.sqrt(mu35 / mu37) - 1), '-2.185'); num(D, 'B′/B', mu35 / mu37, '0.99849'); num(D, 'μ(H³⁵Cl)', mu35, '0.979593'); num(D, 'μ(H³⁷Cl)', mu37, '0.981077')
num(D, 'ω(H₂)/ω(D₂) predicho', math.sqrt((mD / 2) / (mH / 2)), '1.41367'); num(D, 'ω(H₂)/ω(D₂) medido', 4401.21 / 3115.50, '1.41268'); num(D, 'diferencia (%)', (math.sqrt(mD / mH) / (4401.21 / 3115.50) - 1) * 100, '0.07')
num(D, 'valor inicial: R(0)', nu0H + 2 * BH, '2907.1668'); num(D, 'valor inicial: 2B', 2 * BH, '21.1868'); num(D, 'valor inicial: 4B', 4 * BH, '42.3736')
num(D, 'valor inicial isótopo: ν̃′', nu0H * math.sqrt(mu35 / mu37), '2883.7954'); num(D, 'valor inicial isótopo: corrimiento', nu0H * (math.sqrt(mu35 / mu37) - 1), '-2.18464'); num(D, 'valor inicial isótopo: ν̃/ν̃′', math.sqrt(mu37 / mu35), '1.00075756'); num(D, 'valor inicial isótopo: B′/B', mu35 / mu37, '0.998487')
n0s, Bs, Js, n1s, m1s, m2s = symbols('n0 B J n1 m1 m2', positive=True)
fsim('rotovib', 'R', n0s + 2 * Bs * (Js + 1), deriv=D)
fsim('rotovib', 'P', n0s - 2 * Bs * Js, deriv=D)
fsim('rotovib', 'sp', 2 * Bs, deriv=D)
fsim('rotovib', 'gap', 4 * Bs, deriv=D)
fsim('isotopo', 'n2', n1s * sp.sqrt(m1s / m2s), deriv=D)
fsim('isotopo', 'sh', n1s * (sp.sqrt(m1s / m2s) - 1), deriv=D, tol=1e-7)
fsim('isotopo', 'r', sp.sqrt(m2s / m1s), deriv=D)
fsim('isotopo', 'Br', m1s / m2s, deriv=D)
