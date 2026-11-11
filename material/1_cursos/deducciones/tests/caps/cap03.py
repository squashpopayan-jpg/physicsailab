# -*- coding: utf-8 -*-
"""Capítulo 3 — Vectores, coordenadas curvilíneas y teoremas integrales."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, gamma, oo, diff, integrate, sin, cos, erf, erfc, legendre, Function, Derivative, Matrix, limit, simplify

EX = {'divergencia': 'div-esfera', 'laplaciano-esf': 'lap-rn', 'rotacional': 'rot-azim', 'delta-4pi': 'delta-reg', 'bola-n': 'bola-n'}
fs = lambda D_, *a, **k: fsim(EX.get(D_, D_), *a, deriv=D_, **k)
r, th, ph, rho_, z = S('r theta phi rho z')
x, y, zz = symbols('x y z', real=True)
sph = {x: r * sin(th) * cos(ph), y: r * sin(th) * sin(ph), zz: r * cos(th)}

# ---------------------------------------------------------------- factores de escala
D = 'escalas'
q = Matrix([r * sin(th) * cos(ph), r * sin(th) * sin(ph), r * cos(th)])
hs = [sp.simplify(sp.sqrt(sum(c ** 2 for c in q.diff(v)))) for v in (r, th, ph)]
for nm, h_, e_ in zip(('h_r', 'h_θ', 'h_φ'), hs, (1, r, r * sin(th))):
    ident(D, f'factor de escala esférico {nm}', h_, e_)
qc = Matrix([rho_ * cos(ph), rho_ * sin(ph), z])
hc = [sp.simplify(sp.sqrt(sum(c ** 2 for c in qc.diff(v)))) for v in (rho_, ph, z)]
for nm, h_, e_ in zip(('h_ρ', 'h_φ', 'h_z'), hc, (1, rho_, 1)):
    ident(D, f'factor de escala cilíndrico {nm}', h_, e_)
J = sp.simplify(Matrix([[sp.diff(c, v) for v in (r, th, ph)] for c in q]).det())
ident(D, 'jacobiano esférico = r² sen θ', J, r ** 2 * sin(th))

# ---------------------------------------------------------------- divergencia
D = 'divergencia'
Fc = (x * y + zz ** 2, y * zz * x + x ** 2, zz * x ** 2 - y)
divC = sum(diff(Fc[i], v) for i, v in enumerate((x, y, zz)))
Fs = [f.subs(sph) for f in Fc]
er = (sin(th) * cos(ph), sin(th) * sin(ph), cos(th)); et = (cos(th) * cos(ph), cos(th) * sin(ph), -sin(th)); ep = (-sin(ph), cos(ph), 0)
comp = lambda e_: sum(Fs[i] * e_[i] for i in range(3))
Fr, Ft, Fp = comp(er), comp(et), comp(ep)
divS = diff(r ** 2 * Fr, r) / r ** 2 + diff(sin(th) * Ft, th) / (r * sin(th)) + diff(Fp, ph) / (r * sin(th))
ident(D, 'divergencia esférica = divergencia cartesiana (campo de prueba)', divC.subs(sph), divS)
# cilíndricas
subc = {x: rho_ * cos(ph), y: rho_ * sin(ph)}
Fcy = (x * y + zz ** 2, x ** 2 - y * zz, x * zz + y ** 2)
divCy = sum(diff(Fcy[i], v) for i, v in enumerate((x, y, zz)))
Fs2 = [f.subs(subc) for f in Fcy]
Frho = Fs2[0] * cos(ph) + Fs2[1] * sin(ph); Fphi = -Fs2[0] * sin(ph) + Fs2[1] * cos(ph); Fz = Fs2[2]
divCyl = diff(rho_ * Frho, rho_) / rho_ + diff(Fphi, ph) / rho_ + diff(Fz, zz)
ident(D, 'divergencia cilíndrica = divergencia cartesiana (campo de prueba)', divCy.subs(subc), divCyl)
m, k, Rr = S('m k R')
Fm = k * r ** m
ident(D, '∇·(k rᵐ r̂) = (m+2) k r^(m−1)', diff(r ** 2 * Fm, r) / r ** 2, (m + 2) * k * r ** (m - 1))
ident(D, 'flujo = F(R)·4πR² = 4πkR^(m+2)', (Fm * 4 * pi * r ** 2).subs(r, Rr), 4 * pi * k * Rr ** (m + 2))
integral(D, '∫₀^R (m+2)k r^(m−1) 4πr² dr = 4πkR^(m+2)', (m + 2) * k * r ** (m - 1) * 4 * pi * r ** 2, r, 0, Rr, 4 * pi * k * Rr ** (m + 2))
ident(D, 'campo uniformemente expansivo (m = 1): ∇·(k r⃗) = 3k', sum(diff(k * c, v) for c, v in zip((x, y, zz), (x, y, zz))), 3 * k)
ident(D, 'm = −2: divergencia nula fuera del origen', ((m + 2) * k * r ** (m - 1)).subs(m, -2), 0)
dF = Function('F')
dimcheck(D, '∇·F esférica (parte radial)', Symbol('divF', positive=True), Derivative(r ** 2 * dF(r), r) / r ** 2, {'divF': 's^-1', 'F': 'm s^-1', 'r': 'm'})
dimcheck(D, 'flujo Φ = 4πR²F(R)', Symbol('Phi', positive=True), 4 * pi * Rr ** 2 * dF(Rr), {'Phi': 'm^3 s^-1', 'F': 'm s^-1', 'R': 'm'})
dimcheck(D, 'caso m = 1: Φ = 4πkR³', Symbol('Phi', positive=True), 4 * pi * k * Rr ** 3, {'Phi': 'm^3 s^-1', 'k': 's^-1', 'R': 'm'})
dimcheck(D, 'caso m = 1: ∇·F = 3k', Symbol('divF', positive=True), 3 * k, {'divF': 's^-1', 'k': 's^-1'})
dv = lambda mv, kv, Rv: (mv + 2) * kv * Rv ** (mv - 1); fl = lambda mv, kv, Rv: 4 * math.pi * kv * Rv ** (mv + 2)
num(D, 'div (m=1, k=1, R=1)', dv(1, 1, 1), '3'); num(D, 'flujo (m=1, k=1, R=1)', fl(1, 1, 1), '12.5664'); num(D, 'flujo (k=1, R=2, m=1)', fl(1, 1, 2), '100.53')
num(D, 'div (m=0, k=1, R=1)', dv(0, 1, 1), '2'); num(D, 'div (m=−1, k=1, R=1)', dv(-1, 1, 1), '1'); num(D, 'flujo (m=−1)', fl(-1, 1, 1), '12.566')
num(D, 'div (m=3, k=2, R=0.5)', dv(3, 2, 0.5), '2.5'); num(D, 'flujo (m=3, k=2, R=0.5)', fl(3, 2, 0.5), '0.7854')
num(D, 'razón de flujos al duplicar R con m = 1', fl(1, 1, 2) / fl(1, 1, 1), '8')
mp_, kp, Rp = symbols('m k R', positive=True)
fs(D, 'div', (mp_ + 2) * kp * Rp ** (mp_ - 1)); fs(D, 'flux', 4 * pi * kp * Rp ** (mp_ + 2))
fs(D, 'vint', 4 * pi * kp * Rp ** (mp_ + 2), tol=1e-7)

# ---------------------------------------------------------------- laplaciano esférico
D = 'laplaciano-esf'
fc = x ** 2 * zz + y * sp.exp(-zz) + x * y * zz ** 2
lapC = sum(diff(fc, v, 2) for v in (x, y, zz))
fs_ = fc.subs(sph)
grad = (diff(fs_, r), diff(fs_, th) / r, diff(fs_, ph) / (r * sin(th)))
lapS = (diff(r ** 2 * sin(th) * grad[0], r) + diff(r * sin(th) * grad[1], th) + diff(r * grad[2], ph)) / (r ** 2 * sin(th))
# Fórmula de la divergencia: (1/h1h2h3)[∂r(h2h3 F_r)+∂θ(h3h1 F_θ)+∂φ(h1h2 F_φ)], h2h3 = r² sinθ, h3h1 = r sinθ, h1h2 = r
ident(D, '∇²f esférico (vía divergencia del gradiente) = ∇²f cartesiano', lapC.subs(sph), lapS)
n, l = S('n l')
Lam = lambda f: diff(sin(th) * diff(f, th), th) / sin(th)
for ll in range(0, 5):
    f_ = r ** n * legendre(ll, cos(th))
    lap = diff(r ** 2 * diff(f_, r), r) / r ** 2 + Lam(f_) / r ** 2
    ident(D, f'∇²(rⁿ P_{ll}) = (n−{ll})(n+{ll}+1) r^(n−2) P_{ll}', lap, (n - ll) * (n + ll + 1) * r ** (n - 2) * legendre(ll, cos(th)))
ident(D, 'n(n+1) − l(l+1) = (n−l)(n+l+1)', n * (n + 1) - l * (l + 1), (n - l) * (n + l + 1))
for nm, f_ in (('z', zz), ('x²+y²−2z²', x ** 2 + y ** 2 - 2 * zz ** 2), ('xy', x * y), ('x³−3xy²', x ** 3 - 3 * x * y ** 2)):
    ident(D, f'armónica cartesiana {nm}: ∇²f = 0', sum(diff(f_, v, 2) for v in (x, y, zz)), 0)
ident(D, '∇² r² = 6', sum(diff(x ** 2 + y ** 2 + zz ** 2, v, 2) for v in (x, y, zz)), 6)
ident(D, '∇²(1/r) = 0 (r ≠ 0), cartesianas', sum(diff((x ** 2 + y ** 2 + zz ** 2) ** R_(-1, 2), v, 2) for v in (x, y, zz)), 0)
fF = Function('f')
dimcheck(D, '∇²f radial', Symbol('lapf', positive=True), Derivative(r ** 2 * Derivative(fF(r), r), r) / r ** 2, {'lapf': 'K m^-2', 'f': 'K', 'r': 'm'})
num(D, 'λ (n=2, l=0)', 2 * 3 - 0, '6'); num(D, 'λ (n=2, l=1)', 6 - 2, '4'); num(D, 'λ (n=3, l=2)', 12 - 6, '6'); num(D, 'λ (n=4, l=2)', 20 - 6, '14'); num(D, '∇²f/P (n=4, l=2, r=2)', 14 * 2 ** 2, '56')
nn_, ll_, rr_ = symbols('n l r', positive=True)
cv = lambda p: dict(n=p['n'], l=round(p['l']), r=p['r'])
fs(D, 'lam', (nn_ - ll_) * (nn_ + ll_ + 1), conv=cv); fs(D, 'lap', (nn_ - ll_) * (nn_ + ll_ + 1) * rr_ ** (nn_ - 2), conv=cv)
fs(D, 'n1', ll_, conv=cv); fs(D, 'n2', -(ll_ + 1), conv=cv)

# ---------------------------------------------------------------- rotacional
D = 'rotacional'
eps, a_, b_, x0, y0, t = symbols('epsilon a b x0 y0 t', positive=True)
Fx = x * x * y + y ** 3 + x; Fy = x * y * y + x ** 3 - y
ex = lambda e_: e_.subs({x: x0 + t, y: y0}, simultaneous=True)
circ = (integrate(Fx.subs({x: x0 + t, y: y0}), (t, 0, eps * a_)) + integrate(Fy.subs({x: x0 + eps * a_, y: y0 + t}), (t, 0, eps * b_))
        - integrate(Fx.subs({x: x0 + t, y: y0 + eps * b_}), (t, 0, eps * a_)) - integrate(Fy.subs({x: x0, y: y0 + t}), (t, 0, eps * b_)))
ident(D, 'circulación del rectángulo / área → ∂xFy − ∂yFx', limit(circ / (eps ** 2 * a_ * b_), eps, 0), (diff(Fy, x) - diff(Fx, y)).subs({x: x0, y: y0}))
a, mm, Rr = S('a m R')
# campo azimutal a r^m φ̂ en cartesianas: (−y, x)·a r^(m−1)
rc = sp.sqrt(x ** 2 + y ** 2)
Fx_ = -a * y * rc ** (mm - 1); Fy_ = a * x * rc ** (mm - 1)
ident(D, '(∇×F)_z cartesiano = (m+1) a r^(m−1)', (diff(Fy_, x) - diff(Fx_, y)).subs({x: r, y: 0}), (mm + 1) * a * r ** (mm - 1))
ident(D, '(1/r) d(r F_φ)/dr = (m+1) a r^(m−1)', diff(r * a * r ** mm, r) / r, (mm + 1) * a * r ** (mm - 1))
integral(D, '∬(∇×F)·dA = ∫₀^R (m+1) a r^(m−1) 2πr dr = 2πaR^(m+1)', (mm + 1) * a * r ** (mm - 1) * 2 * pi * r, r, 0, Rr, 2 * pi * a * Rr ** (mm + 1))
ident(D, 'circulación = F_φ(R) 2πR', a * Rr ** mm * 2 * pi * Rr, 2 * pi * a * Rr ** (mm + 1))
om = Symbol('omega', positive=True)
ident(D, 'rotación rígida v = ω×r: (∇×v)_z = 2ω', diff(om * x, x) - diff(-om * y, y), 2 * om)
ident(D, 'vórtice libre (m = −1): rotacional nulo', ((mm + 1) * a * r ** (mm - 1)).subs(mm, -1), 0)
Fphi_ = Function('F')
dimcheck(D, '(∇×F)_z = (1/r) d(rF_φ)/dr', Symbol('curlz', positive=True), Derivative(r * Fphi_(r), r) / r, {'curlz': 's^-1', 'F': 'm s^-1', 'r': 'm'})
dimcheck(D, 'circulación Γ = 2πR F_φ(R)', Symbol('Gam', positive=True), 2 * pi * Rr * Fphi_(Rr), {'Gam': 'm^2 s^-1', 'F': 'm s^-1', 'R': 'm'})
dimcheck(D, 'm = 1: Γ = 2πaR²', Symbol('Gam', positive=True), 2 * pi * a * Rr ** 2, {'Gam': 'm^2 s^-1', 'a': 's^-1', 'R': 'm'})
dimcheck(D, 'm = 1: rotacional = 2a', Symbol('curlz', positive=True), 2 * a, {'curlz': 's^-1', 'a': 's^-1'})
cr = lambda mv, av, Rv: (mv + 1) * av * Rv ** (mv - 1); ci = lambda mv, av, Rv: 2 * math.pi * av * Rv ** (mv + 1)
num(D, 'rotacional (m=1, a=1)', cr(1, 1, 1), '2'); num(D, 'circulación (m=1, a=1, R=1)', ci(1, 1, 1), '6.2832'); num(D, 'rotacional (m=2, a=1, R=1)', cr(2, 1, 1), '3')
num(D, 'circulación (m=2, a=1, R=1)/π', ci(2, 1, 1) / math.pi, '2'); num(D, 'rotacional (m=2, a=2, R=1.5)', cr(2, 2, 1.5), '9'); num(D, 'circulación (m=2, a=2, R=1.5)', ci(2, 2, 1.5), '42.41')
num(D, 'razón al duplicar R (m=1)', ci(1, 1, 2) / ci(1, 1, 1), '4')
mq, aq, Rq = symbols('m a R', positive=True)
fs(D, 'curl', (mq + 1) * aq * Rq ** (mq - 1)); fs(D, 'circ', 2 * pi * aq * Rq ** (mq + 1)); fs(D, 'sint', 2 * pi * aq * Rq ** (mq + 1), tol=1e-7)
# nota: m ≥ −0.5 en el explorador; m puede ser negativo, el símbolo se evalúa igual

# ---------------------------------------------------------------- delta
D = 'delta-4pi'
sg, Rq2, u_ = S('sigma R u')
ident(D, 'flujo de r̂/r² por la esfera R = 4π', (1 / r ** 2 * 4 * pi * r ** 2).subs(r, Rq2), 4 * pi)
ident(D, '∇·(r̂/r²) = 0 fuera del origen', diff(r ** 2 * r ** -2, r) / r ** 2, 0)
rho_s = exp(-r ** 2 / (2 * sg ** 2)) / (2 * pi * sg ** 2) ** R_(3, 2)
integral(D, 'normalización 4π∫₀^∞ ρσ r² dr = 1', 4 * pi * rho_s * r ** 2, r, 0, oo, 1)
Qc = erf(Rq2 / (sqrt(2) * sg)) - sqrt(2 / pi) * (Rq2 / sg) * exp(-Rq2 ** 2 / (2 * sg ** 2))
integral(D, 'Q(R) = 4π∫₀^R ρσ r² dr = erf − √(2/π)(R/σ)e^(−R²/2σ²)', 4 * pi * rho_s * r ** 2, r, 0, Rq2, Qc)
deriv_is(D, 'dQ/dR = 4π R² ρσ(R)', Qc, Rq2, (4 * pi * rho_s * r ** 2).subs(r, Rq2))
ident(D, '∇·F_σ = (1/r²) dQ/dr = 4πρσ', diff(Qc.subs(Rq2, r), r) / r ** 2, 4 * pi * rho_s)
xx = Symbol('xx', positive=True)
integral(D, '∫₀^x u² e^(−u²/2)du = −x e^(−x²/2) + √(π/2) erf(x/√2)', u_ ** 2 * exp(-u_ ** 2 / 2), u_, 0, xx, -xx * exp(-xx ** 2 / 2) + sqrt(pi / 2) * erf(xx / sqrt(2)))
ident(D, '∇(1/r) = −r̂/r² (cartesianas)', sp.Matrix([diff((x ** 2 + y ** 2 + zz ** 2) ** R_(-1, 2), v) for v in (x, y, zz)]).norm().simplify(), 1 / (x ** 2 + y ** 2 + zz ** 2))
Qn = lambda xv: float(sp.N(erf(sp.Float(xv, 30) / sqrt(2)) - sqrt(2 / pi) * sp.Float(xv, 30) * exp(-sp.Float(xv, 30) ** 2 / 2), 30))
rec(G_STEP, D, 'Q(R = 100σ) = 1 (límite puntual)', Qn(100.0), 1.0, 'abs 1e-12', abs(Qn(100.0) - 1) < 1e-12)
dimcheck(D, 'ρσ tiene dimensión m⁻³', Symbol('rhos', positive=True), exp(-Rq2 ** 2 / (2 * sg ** 2)) / (2 * pi * sg ** 2) ** R_(3, 2), {'rhos': 'm^-3', 'R': 'm', 'sigma': 'm'})
dimcheck(D, 'F = Q/R²', Symbol('Fm', positive=True), Symbol('Q', positive=True) / Rq2 ** 2, {'Fm': 'm^-2', 'Q': '1', 'R': 'm'})
dimcheck(D, 'x = R/σ es adimensional', Symbol('x', positive=True), Rq2 / sg, {'x': '1', 'R': 'm', 'sigma': 'm'})
for xv, vv in ((1, '0.19875'), (2, '0.7385'), (3, '0.9707'), (4, '99.887')):
    num(D, f'Q(R = {xv}σ)' + (' (%)' if xv == 4 else ''), Qn(xv) * (100 if xv == 4 else 1), vv, tol=1e-3)
num(D, 'Q(R = 2σ) (%)', Qn(2) * 100, '73.85'); num(D, 'Q(R = 3σ) (%)', Qn(3) * 100, '97.07'); num(D, 'Q(R = 5σ) (%)', Qn(5) * 100, '99.9985')
num(D, '1 − Q(5σ) en 10⁻⁵', (1 - Qn(5)) / 1e-5, '1.544'); num(D, 'Q(σ=1, R=1)', Qn(1), '0.19875')
num(D, 'F máximo (σ² F)', max(Qn(xv) / xv ** 2 for xv in np.linspace(1.0, 2.0, 20001)), '0.2140'); num(D, 'posición del máximo (σ)', float(np.linspace(1.0, 2.0, 20001)[np.argmax([Qn(xv) / xv ** 2 for xv in np.linspace(1.0, 2.0, 20001)])]), '1.369')
Rd, sd = symbols('R sg', positive=True)
Qs = erf(Rd / (sqrt(2) * sd)) - sqrt(2 / pi) * (Rd / sd) * exp(-Rd ** 2 / (2 * sd ** 2))
Os = erfc(Rd / (sqrt(2) * sd)) + sqrt(2 / pi) * (Rd / sd) * exp(-Rd ** 2 / (2 * sd ** 2))
fs(D, 'Q', Qs, tol=1e-9); fs(D, 'out', Os, tol=1e-9); fs(D, 'F', Qs / Rd ** 2, tol=1e-9)

# ---------------------------------------------------------------- bola n
D = 'bola-n'
nsym, Rs = S('n R')
for nn in range(1, 6):
    xs = symbols(f'x1:{nn+1}', real=True)
    val = sp.Integer(1)
    for xi_ in xs:
        val *= integrate(exp(-xi_ ** 2), (xi_, -oo, oo))
    ident(D, f'∫e^(−|x|²)dⁿx = π^(n/2) para n = {nn}', val, pi ** R_(nn, 2))
Sn = 2 * pi ** (nsym / 2) / gamma(nsym / 2)
ident(D, 'S·Γ(n/2)/2 = π^(n/2)', Sn * gamma(nsym / 2) / 2, pi ** (nsym / 2))
integral(D, '∫₀^∞ r^(n−1)e^(−r²)dr = Γ(n/2)/2 (n = 3)', r ** 2 * exp(-r ** 2), r, 0, oo, gamma(R_(3, 2)) / 2)
integral(D, '∫₀^∞ r^(n−1)e^(−r²)dr = Γ(n/2)/2 (n = 5)', r ** 4 * exp(-r ** 2), r, 0, oo, gamma(R_(5, 2)) / 2)
ident(D, 'V = S R^n/n = π^(n/2)R^n/Γ(n/2+1)', Sn * Rs ** nsym / nsym, pi ** (nsym / 2) * Rs ** nsym / gamma(nsym / 2 + 1))
integral(D, 'V_n = ∫₀^R S r^(n−1) dr (n = 4)', (2 * pi ** 2 / gamma(2)) * r ** 3, r, 0, Rs, pi ** 2 / 2 * Rs ** 4)
Vn = lambda nv: pi ** (nv / 2) / gamma(nv / 2 + 1)
ident(D, 'n = 1: 2R', Vn(R_(1)) * Rs, 2 * Rs); ident(D, 'n = 2: πR²', Vn(R_(2)) * Rs ** 2, pi * Rs ** 2); ident(D, 'n = 3: 4πR³/3', Vn(R_(3)) * Rs ** 3, R_(4, 3) * pi * Rs ** 3)
ident(D, 'dV/dR = S', diff(pi ** (nsym / 2) * Rs ** nsym / gamma(nsym / 2 + 1), Rs), 2 * pi ** (nsym / 2) * Rs ** (nsym - 1) / gamma(nsym / 2))
# Monte Carlo en n = 5
rngm = np.random.default_rng(7)
pts = rngm.uniform(-1, 1, (4_000_000, 5)); frac = (np.sum(pts ** 2, axis=1) <= 1).mean() * 2 ** 5
rec(G_STEP, D, 'Monte Carlo n = 5: V = 5.2638', float(frac), 5.263789, 'rel 5e-3', abs(frac - 5.263789) < 5e-3 * 5.263789)
dimcheck(D, 'V₃ = π^(3/2) R³/Γ(5/2)', Symbol('V3', positive=True), pi ** R_(3, 2) * Rs ** 3 / gamma(R_(5, 2)), {'V3': 'm^3', 'R': 'm'})
dimcheck(D, 'S₂ = 2π^(3/2) R²/Γ(3/2)', Symbol('S2', positive=True), 2 * pi ** R_(3, 2) * Rs ** 2 / gamma(R_(3, 2)), {'S2': 'm^2', 'R': 'm'})
Vf = lambda nv: math.pi ** (nv / 2) / math.gamma(nv / 2 + 1)
for nn, vv in ((1, '2.0000'), (2, '3.1416'), (3, '4.1888'), (4, '4.9348'), (5, '5.2638'), (6, '5.1677'), (10, '2.5502')):
    num(D, f'V_{nn} unidad', Vf(nn), vv)
num(D, 'V₂₀', Vf(20), '0.025807'); num(D, 'V₃₀ en 10⁻⁵', Vf(30) / 1e-5, '2.19')
nsx = np.linspace(1, 15, 140001); vsx = [Vf(v) for v in nsx]
num(D, 'máximo de V con n real', max(vsx), '5.2778'); num(D, 'n del máximo', float(nsx[int(np.argmax(vsx))]), '5.26')
num(D, 'V₂₀/2²⁰ (10⁻⁸)', Vf(20) / 2 ** 20 / 1e-8, '2.5'); num(D, 'S₁₉ (n = 20)', 2 * math.pi ** 10 / math.gamma(10), '0.51614')
num(D, 'V₃ con R = 2', Vf(3) * 8, '33.51'); num(D, 'S₂ (n = 3, R = 1)', 4 * math.pi, '12.5664')
n2, R2 = symbols('n R', positive=True)
fs(D, 'V', pi ** (n2 / 2) * R2 ** n2 / gamma(n2 / 2 + 1)); fs(D, 'S', 2 * pi ** (n2 / 2) * R2 ** (n2 - 1) / gamma(n2 / 2))
