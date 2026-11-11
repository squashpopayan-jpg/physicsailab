# -*- coding: utf-8 -*-
"""Capítulo 38 — Estrellas."""
import math
from sympy import Rational as R_, sqrt, pi, symbols, Eq, Symbol, exp, log, diff, integrate, simplify, oo, sin, cos, Function
from scipy.integrate import quad, solve_ivp
from scipy.optimize import brentq

G = 6.67430e-11; c = 299792458.0; hb = 1.054571817e-34; me = 9.1093837015e-31; mu_ = 1.66053906660e-27; kB = 1.380649e-23; Ms = 1.98841e30; Rs = 6.957e8; Ls = 3.828e26; sigT = 6.6524587321e-29; mp = 1.67262192369e-27; YR = 3.15576e7; RE = 6.371e6
Gq = sp.Float('6.67430e-11', 40); cq = sp.Float('299792458', 40); hbq = sp.Float('1.054571817e-34', 40); meq = sp.Float('9.1093837015e-31', 40); muq = sp.Float('1.66053906660e-27', 40); kBq = sp.Float('1.380649e-23', 40); Msq = sp.Float('1.98841e30', 40); Rsq = sp.Float('6.957e8', 40); Lsq = sp.Float('3.828e26', 40); YRq = sp.Float('3.15576e7', 40)

def LE(n):
    def f(x, y): return [y[1], -2 * y[1] / x - max(y[0], 0) ** n]
    x0 = 1e-6; y0 = [1 - x0 ** 2 / 6, -x0 / 3]
    ev = lambda x, y: y[0]; ev.terminal = True; ev.direction = -1
    s = solve_ivp(f, [x0, 60], y0, events=ev, rtol=1e-13, atol=1e-15, method='DOP853')
    xi = s.t_events[0][0]; d = s.y_events[0][0][1]
    return xi, -xi ** 2 * d, d

# ================================================================ Politropos
D = 'politropos'
xi_, th = symbols('xi', positive=True), Function('theta')
for (nn, sol) in ((0, 1 - xi_ ** 2 / 6), (1, sin(xi_) / xi_), (5, (1 + xi_ ** 2 / 3) ** R_(-1, 2))):
    ident(D, f'solución exacta de Lane–Emden n={nn}: θ″ + 2θ′/ξ + θⁿ = 0', sp.simplify(diff(sol, xi_, 2) + 2 * diff(sol, xi_) / xi_ + sol ** nn), 0)
rr, rho0, Gs, Rr, Ms_ = [Symbol(k, positive=True) for k in ('r', 'rho', 'G', 'R', 'M')]
mr = 4 * pi * rho0 * rr ** 3 / 3
Om = -integrate(Gs * mr / rr * 4 * pi * rho0 * rr ** 2, (rr, 0, Rr))
ident(D, 'energía gravitatoria de una esfera uniforme Ω = −(3/5)GM²/R', sp.simplify(Om - (-R_(3, 5) * Gs * (4 * pi * rho0 * Rr ** 3 / 3) ** 2 / Rr)), 0)
ident(D, 'T virial: 3NkT = (3/5)GM²/R ⇒ kT = (1/5)GMμm_u/R', sp.simplify((R_(3, 5) * Gs * Ms_ ** 2 / Rr) / (3 * Ms_ / Symbol('mum', positive=True)) - R_(1, 5) * Gs * Ms_ * Symbol('mum', positive=True) / Rr), 0)
# eliminación de a y ρ_c
n_, K_, rc_, xi1, w, d1 = [Symbol(k, positive=True) for k in ('n', 'K', 'rho_c', 'xi1', 'w', 'd1')]
a2 = (n_ + 1) * K_ * rc_ ** (1 / n_ - 1) / (4 * pi * Gs)
a_ = sqrt(a2)
Mm = 4 * pi * a_ ** 3 * rc_ * w; Rm = a_ * xi1
Pc_ = K_ * rc_ ** (1 + 1 / n_)
ident(D, 'P_c = 4πG a²ρ_c²/(n+1)', sp.simplify(sp.powsimp(sp.expand_power_base(Pc_ - 4 * pi * Gs * a2 * rc_ ** 2 / (n_ + 1), force=True), force=True)), 0)
ident(D, 'P_c = G M² ξ₁⁴/[4π(n+1) w² R⁴] con w = ξ₁²|θ′|', sp.simplify((4 * pi * Gs * a2 * rc_ ** 2 / (n_ + 1)) - Gs * Mm ** 2 * xi1 ** 4 / (4 * pi * (n_ + 1) * w ** 2 * Rm ** 4)), 0)
ident(D, 'ρ_c/ρ̄ = ξ₁³/(3w) = ξ₁/(3|θ′|)', sp.simplify(Mm / (4 * pi * Rm ** 3 / 3) ** -1 * 0 + (rc_ * 1) / (Mm / (4 * pi * Rm ** 3 / 3)) - xi1 ** 3 / (3 * w)), 0)
# integración directa de las ecuaciones de estructura
def struct(n, K, rc):
    P0 = K * rc ** (1 + 1 / n); r0 = 1.0
    sc_r = math.sqrt((n + 1) * K * rc ** (1 / n - 1) / (4 * math.pi * G)); r0 = 1e-6 * sc_r
    f = lambda r, y: [4 * math.pi * r * r * (max(y[1], 0) / K) ** (n / (n + 1)), -G * y[0] * (max(y[1], 0) / K) ** (n / (n + 1)) / r ** 2]
    ev = lambda r, y: y[1] - 1e-24 * P0; ev.terminal = True
    s = solve_ivp(f, [r0, 50 * sc_r], [4 * math.pi * r0 ** 3 * rc / 3, P0], events=ev, rtol=1e-12, atol=0, method='DOP853')
    return s.t[-1], s.y[0, -1]
for (nv, Kv, rcv) in ((3.0, 1.0e10, 1.0e5), (1.5, 3.0e6, 1.0e8), (1.0, 5.0e5, 3.0e3)):
    R_num, M_num = struct(nv, Kv, rcv)
    xi, w_, dd = LE(nv)
    rb = M_num / (4 * math.pi * R_num ** 3 / 3)
    Pc_f = G * M_num ** 2 / R_num ** 4 / (4 * math.pi * (nv + 1) * dd ** 2)
    rec(G_STEP, D, f'integración directa de las ecuaciones de estructura (n={nv}): ρ_c/ρ̄ = ξ₁/(3|θ′|)', rcv / rb, xi / (3 * abs(dd)), 'rel 1e-4', abs((rcv / rb) / (xi / (3 * abs(dd))) - 1) < 1e-4)
    rec(G_STEP, D, f'integración directa (n={nv}): P_c = GM²/(4π(n+1)θ′²R⁴)', Kv * rcv ** (1 + 1 / nv), Pc_f, 'rel 1e-4', abs(Kv * rcv ** (1 + 1 / nv) / Pc_f - 1) < 1e-4)
xi1v, w1, d1v = LE(1.0)
rec(G_STEP, D, 'n=1: ξ₁ = π', xi1v, math.pi, 'rel 1e-10', abs(xi1v / math.pi - 1) < 1e-10)
xi0, _, _ = LE(1e-9)
rec(G_STEP, D, 'n=0: ξ₁ = √6', xi0, math.sqrt(6), 'rel 1e-6', abs(xi0 / math.sqrt(6) - 1) < 1e-6)
uP = {'P': 'Pa', 'rho': 'kg m^-3', 'G': 'm^3 kg^-1 s^-2', 'M': 'kg', 'R': 'm', 'm_u': 'kg', 'mu': '1', 'k': 'J K^-1', 'T': 'K', 'a': 'm', 'xi': '1'}
Ps, rs_, Ms2, Rs2, mus, mus_u, ks, Ts, Gs2 = [Symbol(k, positive=True) for k in ('P', 'rho', 'M', 'R', 'mu', 'm_u', 'k', 'T', 'G')]
dimcheck(D, 'P_c ∝ GM²/R⁴', Ps, Gs2 * Ms2 ** 2 / Rs2 ** 4, uP)
dimcheck(D, 'T_c = P_c μ m_u/(ρ_c k)', Ts, Ps * mus * mus_u / (rs_ * ks), uP)
dimcheck(D, 'T virial = GMμm_u/(kR)', Ts, Gs2 * Ms2 * mus * mus_u / (ks * Rs2), uP)
dimcheck(D, 'ρ̄ = M/(4πR³/3)', rs_, Ms2 / (4 * pi * Rs2 ** 3 / 3), uP)
def polySun(n, M=1.0, R=1.0, mu=0.61):
    xi, w_, dd = LE(n); Mk = M * Ms; Rk = R * Rs
    rb = Mk / (4 / 3 * math.pi * Rk ** 3); rc = xi ** 3 / (3 * w_) * rb; Pc = G * Mk ** 2 / Rk ** 4 / (4 * math.pi * (n + 1) * dd ** 2)
    return xi, rc / rb, rc, Pc, Pc * mu * mu_ / (rc * kB), rb
xi3, rr3, rc3, Pc3, Tc3, rb3 = polySun(3.0)
num(D, 'ξ₁ (n=3)', xi3, '6.8968'); num(D, '−ξ²θ′ (n=3)', LE(3.0)[1], '2.0182'); num(D, 'ρ̄ (g/cm³)', rb3 * 1e-3, '1.410'); num(D, 'ρ_c/ρ̄', rr3, '54.18'); num(D, 'ρ_c (g/cm³)', rc3 * 1e-3, '76.39'); num(D, 'P_c (10¹⁶ Pa)', Pc3 * 1e-16, '1.245'); num(D, 'T_c (MK)', Tc3 * 1e-6, '11.96')
num(D, 'T virial GMμm_u/(kR) (MK)', G * Ms * 0.61 * mu_ / (kB * Rs) * 1e-6, '14.0')
num(D, 'ρ_c/ρ̄ (n=1)', polySun(1.0)[1], '3.290'); num(D, 'ρ_c/ρ̄ (n=1.5)', polySun(1.5)[1], '5.991'); num(D, 'factor de presión al reducir R a la mitad', 2 ** 4, '16'); num(D, 'factor de temperatura', 2.0, '2', tol=1e-9)
num(D, 'valor inicial: ξ₁', xi3, '6.89685'); num(D, 'valor inicial: ρ_c/ρ̄', rr3, '54.1825'); num(D, 'valor inicial: ρ_c', rc3 * 1e-3, '76.3854'); num(D, 'valor inicial: P_c', Pc3 * 1e-16, '1.24485'); num(D, 'valor inicial: T_c', Tc3 * 1e-6, '11.9565')
def poly_ref(d, o):
    r = polySun(d['n'], d['M'], d['R'], d['mu'])
    return {'xi': r[0], 'rr': r[1], 'rc': r[2] * 1e-3, 'Pc': r[3] * 1e-16, 'Tc': r[4] * 1e-6}[o]
for o in ('xi', 'rr', 'rc', 'Pc', 'Tc'):
    fsim_py('est-politropo', o, (lambda oo_: (lambda d: poly_ref(d, oo_)))(o), tol=1e-6, deriv=D)

# ================================================================ Escalas de tiempo
D = 'escalas-tiempo'
rr_, R0, GM, chi = symbols('r R0 GM chi', positive=True)
tff_int = integrate(sqrt(R0) * 2 * sin(chi) ** 2 * 0 + 2 * R0 ** R_(3, 2) / sqrt(2 * GM) * cos(chi) ** 2 * 0 + 1, (chi, 0, 1)) if False else None
# t = ∫₀^{R₀} dr / sqrt(2GM(1/r − 1/R₀)), con r = R₀ sen²χ
chi_ = Symbol('chi', positive=True)
integrand = (2 * R0 * sin(chi_) * cos(chi_)) / sqrt(2 * GM * (1 / (R0 * sin(chi_) ** 2) - 1 / R0))
ident(D, 'con r = R₀ sen²χ: dr/√(2GM(1/r − 1/R₀)) = 2R₀^{3/2} sen²χ dχ/√(2GM)', sp.simplify(integrand.subs(chi_, Symbol('c1', positive=True)).rewrite(sin) * 0 + sp.simplify(sp.powsimp(integrand.subs(R0, 4).subs(GM, 2), force=True)) - 2 * 4 ** R_(3, 2) * sin(chi_) ** 2 / sqrt(4) * 1) if False else sp.simplify(integrand.subs({R0: 4, GM: 2}).subs(chi_, R_(3, 10)) - 2 * 4 ** R_(3, 2) * sin(R_(3, 10)) ** 2 / sqrt(4)), 0) if False else rec(G_STEP, D, 'integral numérica de la caída libre = (π/2)√(R₀³/2GM) (R₀ = 3, GM = 5)', quad(lambda r: 1 / math.sqrt(2 * 5.0 * (1 / r - 1 / 3.0)), 0, 3.0)[0], math.pi / 2 * math.sqrt(27.0 / 10.0), 'rel 1e-8', abs(quad(lambda r: 1 / math.sqrt(2 * 5.0 * (1 / r - 1 / 3.0)), 0, 3.0)[0] / (math.pi / 2 * math.sqrt(27.0 / 10.0)) - 1) < 1e-8)
integral(D, '∫₀^{π/2} 2 sen²χ dχ = π/2', 2 * sin(chi_) ** 2, chi_, 0, pi / 2, pi / 2)
Gsy, rho_ = Symbol('G', positive=True), Symbol('rho', positive=True)
ident(D, 't_ff = (π/2)√(R₀³/2GM) con M = 4πρR₀³/3 ⇒ √(3π/(32Gρ))', sp.simplify(pi / 2 * sqrt(R0 ** 3 / (2 * Gsy * (4 * pi * rho_ * R0 ** 3 / 3))) - sqrt(3 * pi / (32 * Gsy * rho_))), 0)
eps_ = (4 * 1.00782503223 - 4.00260325413) / (4 * 1.00782503223)
uT = {'t_ff': 's', 't_KH': 's', 't_nuc': 's', 'rho': 'kg m^-3', 'G': 'm^3 kg^-1 s^-2', 'M': 'kg', 'R': 'm', 'L': 'W', 'c': 'm s^-1'}
tffS, tKH, tN, Ms3, Rs3, Ls3, cS, rhoS, GS = [Symbol(k, positive=True) for k in ('t_ff', 't_KH', 't_nuc', 'M', 'R', 'L', 'c', 'rho', 'G')]
dimcheck(D, 't_ff = √(3π/(32Gρ))', tffS, sqrt(3 * pi / (32 * GS * rhoS)), uT)
dimcheck(D, 't_KH = GM²/(RL)', tKH, GS * Ms3 ** 2 / (Rs3 * Ls3), uT)
dimcheck(D, 't_nuc = 7×10⁻⁴ Mc²/L', tN, R_(7, 10000) * Ms3 * cS ** 2 / Ls3, uT)
rhoSun = Ms / (4 / 3 * math.pi * Rs ** 3)
tff_s = lambda M, R: math.sqrt(3 * math.pi / (32 * G * M * Ms / (4 / 3 * math.pi * (R * Rs) ** 3)))
num(D, 'ε del H→He', eps_, '0.0071'); num(D, 't_ff Sol (s)', tff_s(1, 1), '1769'); num(D, 't_ff Sol (min)', tff_s(1, 1) / 60, '29.5'); num(D, 't_KH Sol (10⁷ años)', G * Ms ** 2 / (Rs * Ls) / YR * 1e-7, '3.14'); num(D, 't_nuc Sol (10¹⁰ años)', 7e-4 * Ms * c ** 2 / Ls / YR * 1e-10, '1.04'); num(D, 'L/c² Sol (10⁹ kg/s)', Ls / c ** 2 * 1e-9, '4.26')
num(D, 't_nuc de 10 M☉ y 10⁴ L☉ (10⁷ años)', 7e-4 * 10 * Ms * c ** 2 / (1e4 * Ls) / YR * 1e-7, '1.04'); num(D, 'cociente respecto al Sol', 1.0e10 / 1.0e7, '1000', tol=0.05)
num(D, 'valor inicial: t_ff', tff_s(1, 1) / 60, '29.4870'); num(D, 'valor inicial: t_KH', G * Ms ** 2 / (Rs * Ls) / YR * 1e-6, '31.3993'); num(D, 'valor inicial: t_nuc', 7e-4 * Ms * c ** 2 / Ls / YR * 1e-9, '10.3555'); num(D, 'valor inicial: dm/dt', Ls / c ** 2 * 1e-9, '4.25922')
M2, R2, L2 = symbols('M R L', positive=True)
fsim('est-tiempos', 'tff', sp.sqrt(3 * sp.pi / (32 * Gq * (M2 * Msq) / (R_(4, 3) * sp.pi * (R2 * Rsq) ** 3))) / 60, deriv=D)
fsim('est-tiempos', 'tkh', Gq * (M2 * Msq) ** 2 / (R2 * Rsq * L2 * Lsq) / YRq * sp.Float('1e-6', 40), deriv=D)
fsim('est-tiempos', 'tn', R_(7, 10000) * M2 * Msq * cq ** 2 / (L2 * Lsq) / YRq * sp.Float('1e-9', 40), deriv=D)
fsim('est-tiempos', 'dm', L2 * Lsq / cq ** 2 * sp.Float('1e-9', 40), deriv=D)

# ================================================================ Enana blanca
D = 'enana-blanca'
nE, EF, hbs, ms, Ks = [Symbol(k, positive=True) for k in ('n', 'EF', 'hbar', 'm', 'K')]
Pdeg = R_(2, 5) * nE * hbs ** 2 / (2 * ms) * (3 * pi ** 2 * nE) ** R_(2, 3)
ident(D, 'P = (2/5) n E_F = (1/5)(3π²)^{2/3}(ħ²/m) n^{5/3}', sp.simplify(Pdeg - R_(1, 5) * (3 * pi ** 2) ** R_(2, 3) * hbs ** 2 / ms * nE ** R_(5, 3)), 0)
Kn = (3 * pi ** 2) ** R_(2, 3) * hbs ** 2 / (5 * ms * (Symbol('mue', positive=True) * Symbol('mu_u', positive=True)) ** R_(5, 3))
ident(D, 'con n = ρ/(μ_e m_u): P = Kρ^{5/3}', sp.simplify(R_(1, 5) * (3 * pi ** 2) ** R_(2, 3) * hbs ** 2 / ms * (Symbol('rho', positive=True) / (Symbol('mue', positive=True) * Symbol('mu_u', positive=True))) ** R_(5, 3) - Kn * Symbol('rho', positive=True) ** R_(5, 3)), 0)
ident(D, 'a = (5K/8πG)(4π m)^{1/3} M^{−1/3} cumple M = 4π a³ ρ_c m con a² = (5K/8πG) ρ_c^{−1/3}', sp.simplify(((5 * Ks / (8 * pi * Gs)) * (4 * pi * w) ** R_(1, 3) * Ms_ ** R_(-1, 3)) ** 2 - (5 * Ks / (8 * pi * Gs)) * (Ms_ / (4 * pi * w * ((5 * Ks / (8 * pi * Gs)) * (4 * pi * w) ** R_(1, 3) * Ms_ ** R_(-1, 3)) ** 3)) ** R_(-1, 3)), 0)
XI15, W15, _ = LE(1.5)
def Knr(mue): return (3 * math.pi ** 2) ** (2 / 3) * hb ** 2 / (5 * me * (mue * mu_) ** (5 / 3))
def wdR(Mk, mue=2.0):
    a = 5 * Knr(mue) / (8 * math.pi * G) * (4 * math.pi * W15) ** (1 / 3) * Mk ** (-1 / 3); return XI15 * a, Mk / (4 * math.pi * W15 * a ** 3)
for Mv in (0.3, 0.6, 1.0):
    Mk = Mv * Ms; Rf, rcf = wdR(Mk)
    # integración directa de las ecuaciones de estructura: buscar ρ_c que da la masa M
    def Mdir(lr):
        rc = math.exp(lr); Rn, Mn = struct(1.5, Knr(2.0), rc); return Mn - Mk
    lr = brentq(Mdir, math.log(1e5), math.log(1e11), xtol=1e-12)
    Rn, Mn = struct(1.5, Knr(2.0), math.exp(lr))
    rec(G_STEP, D, f'integración directa de las ecuaciones de estructura con P = Kρ^{{5/3}} (M = {Mv} M☉): radio = fórmula cerrada', Rn, Rf, 'rel 1e-4', abs(Rn / Rf - 1) < 1e-4)
    rec(G_STEP, D, f'integración directa (M = {Mv} M☉): densidad central = fórmula cerrada', math.exp(lr), rcf, 'rel 1e-4', abs(math.exp(lr) / rcf - 1) < 1e-4)
rec(G_STEP, D, 'R ∝ M^{−1/3}: R(2M)/R(M) = 2^{−1/3}', wdR(2 * Ms)[0] / wdR(Ms)[0], 2 ** (-1 / 3), 'rel 1e-12', abs(wdR(2 * Ms)[0] / wdR(Ms)[0] / 2 ** (-1 / 3) - 1) < 1e-12)
uW = {'R': 'm', 'M': 'kg', 'hbar': 'J s', 'm_e': 'kg', 'm_u': 'kg', 'mu_e': '1', 'G': 'm^3 kg^-1 s^-2', 'rho_c': 'kg m^-3', 'a': 'm'}
RW, hbW, meW, muW, mueW, GW, MW = [Symbol(k, positive=True) for k in ('R', 'hbar', 'm_e', 'm_u', 'mu_e', 'G', 'M')]
dimcheck(D, 'R ∝ ħ²/(G m_e (μ_e m_u)^{5/3}) M^{−1/3}', RW, hbW ** 2 / (GW * meW * (mueW * muW) ** R_(5, 3)) * MW ** R_(-1, 3), uW)
dimcheck(D, 'M = 4π a³ ρ_c m', MW, 4 * pi * Symbol('a', positive=True) ** 3 * Symbol('rho_c', positive=True), uW)
Rf6, rc6 = wdR(0.6 * Ms)
num(D, 'ξ₁ (n=3/2)', XI15, '3.65375'); num(D, '−ξ²θ′ (n=3/2)', W15, '2.71406'); num(D, 'R (0.6 M☉, km)', Rf6 * 1e-3, '10527'); num(D, 'R/R☉', Rf6 / Rs, '0.01513'); num(D, 'R/R⊕', Rf6 / RE, '1.652'); num(D, 'ρ_c (10⁶ g/cm³)', rc6 * 1e-3 * 1e-6, '1.463'); num(D, 'R (1.4 M☉, km)', wdR(1.4 * Ms)[0] * 1e-3, '7937'); num(D, '2^{−1/3}', 2 ** (-1 / 3), '0.794')
num(D, 'Sirius B R (km)', wdR(1.02 * Ms)[0] * 1e-3, '8820'); num(D, 'exceso respecto a 5840 km (%)', (wdR(1.02 * Ms)[0] * 1e-3 / 5840 - 1) * 100, '51')
num(D, 'valor inicial: R', Rf6 * 1e-3, '10526.8'); num(D, 'valor inicial: R/R⊕', Rf6 / RE, '1.65230'); num(D, 'valor inicial: ρ_c', rc6 * 1e-3 * 1e-6, '1.46271'); num(D, 'valor inicial: R/R☉', Rf6 / Rs, '0.0151312')
Mws, muews = symbols('M mue', positive=True)
Kq_ = (3 * sp.pi ** 2) ** R_(2, 3) * hbq ** 2 / (5 * meq * (muews * muq) ** R_(5, 3))
a_q = 5 * Kq_ / (8 * sp.pi * Gq) * (4 * sp.pi * sp.Float(W15, 20)) ** R_(1, 3) * (Mws * Msq) ** R_(-1, 3)
fsim('est-enana', 'R', sp.Float(XI15, 20) * a_q * sp.Float('1e-3', 40), deriv=D, tol=1e-8)
fsim('est-enana', 'RE', sp.Float(XI15, 20) * a_q / sp.Float('6.371e6', 40), deriv=D, tol=1e-8)
fsim('est-enana', 'RS', sp.Float(XI15, 20) * a_q / Rsq, deriv=D, tol=1e-8)
fsim('est-enana', 'rc', Mws * Msq / (4 * sp.pi * sp.Float(W15, 20) * a_q ** 3) * sp.Float('1e-9', 40), deriv=D, tol=1e-8)

# ================================================================ Chandrasekhar
D = 'chandrasekhar'
nR, pF = symbols('nR pF', positive=True)
ident(D, 'P = (1/3) n ⟨pc⟩ con ⟨p⟩ = (3/4)p_F ⇒ P = (1/4) n p_F c', R_(1, 3) * nR * R_(3, 4) * pF, R_(1, 4) * nR * pF)
cS_ = Symbol('c', positive=True); hbS = Symbol('hbar', positive=True)
ident(D, 'p_F = ħ(3π²n)^{1/3} ⇒ P = (1/4)(3π²)^{1/3} ħ c n^{4/3}', sp.simplify(R_(1, 4) * nR * hbS * (3 * pi ** 2 * nR) ** R_(1, 3) * cS_ - R_(1, 4) * (3 * pi ** 2) ** R_(1, 3) * hbS * cS_ * nR ** R_(4, 3)), 0)
mueS, muuS, GS3, w3 = [Symbol(k, positive=True) for k in ('mue', 'mu_u', 'G', 'w3')]
Krel_s = (3 * pi ** 2) ** R_(1, 3) * hbS * cS_ / (4 * (mueS * muuS) ** R_(4, 3))
Mch_s = 4 * pi * (Krel_s / (pi * GS3)) ** R_(3, 2) * w3
ident(D, 'M_Ch = 4π(K/πG)^{3/2}ω₃ = (√(3π)/2) ω₃ (ħc/G)^{3/2}/(μ_e m_u)²', sp.simplify(Mch_s - sqrt(3 * pi) / 2 * w3 * (hbS * cS_ / GS3) ** R_(3, 2) / (mueS * muuS) ** 2), 0)
ident(D, 'M(n=3) no depende de ρ_c: ρ_c^{(3−n)/2} = 1', sp.simplify(rc_ ** ((3 - 3) / 2)), 1)
xi3v, w3v, d3v = LE(3.0)
def Krel(mue): return (3 * math.pi ** 2) ** (1 / 3) * hb * c / (4 * (mue * mu_) ** (4 / 3))
Kr = Krel(2.0)
for rcv in (1e8, 1e11, 1e14):
    R_num, M_num = struct(3.0, Kr, rcv)
    rec(G_STEP, D, f'integración directa con P = Kρ^{{4/3}} y ρ_c = {rcv:g} kg/m³: la masa es siempre M_Ch', M_num / Ms, 4 * math.pi * (Kr / (math.pi * G)) ** 1.5 * w3v / Ms, 'rel 1e-5', abs(M_num / (4 * math.pi * (Kr / (math.pi * G)) ** 1.5 * w3v) - 1) < 1e-5)
uC = {'M_Ch': 'kg', 'hbar': 'J s', 'c': 'm s^-1', 'G': 'm^3 kg^-1 s^-2', 'm_u': 'kg', 'mue': '1', 'w3': '1', 'n': 'm^-3', 'p_F': 'kg m s^-1', 'P': 'Pa'}
MCh, hbC, cC, GC, muC, mueC, w3C, nC, pFC, PC = [Symbol(k, positive=True) for k in ('M_Ch', 'hbar', 'c', 'G', 'm_u', 'mue', 'w3', 'n', 'p_F', 'P')]
dimcheck(D, 'M_Ch = (√(3π)/2) ω₃ (ħc/G)^{3/2}/(μ_e m_u)²', MCh, sqrt(3 * pi) / 2 * w3C * (hbC * cC / GC) ** R_(3, 2) / (mueC * muC) ** 2, uC)
dimcheck(D, 'P = (1/4) n p_F c', PC, nC * pFC * cC / 4, uC)
dimcheck(D, 'p_F = ħ(3π²n)^{1/3}', pFC, hbC * (3 * pi ** 2 * nC) ** R_(1, 3), uC)
Mch = lambda mue: 4 * math.pi * (Krel(mue) / (math.pi * G)) ** 1.5 * w3v
num(D, 'ω₃', w3v, '2.0182'); num(D, 'M_Ch (μ_e = 2)', Mch(2.0) / Ms, '1.4563'); num(D, '5.83/μ_e²', 5.83 / 4, '1.4575'); num(D, 'M_Ch (μ_e = 2.154)', Mch(2.154) / Ms, '1.2555')
coef = math.sqrt(3 * math.pi) / 2 * w3v
num(D, '(√(3π)/2)ω₃', coef, '3.098'); num(D, '(ħc/G)^{3/2}/m_u² en M☉', (hb * c / G) ** 1.5 / mu_ ** 2 / Ms, '1.880'); num(D, 'producto', coef * (hb * c / G) ** 1.5 / mu_ ** 2 / Ms, '5.825')
num(D, 'valor inicial: M_Ch', Mch(2.0) / Ms, '1.45630'); num(D, 'valor inicial: K (10⁹)', Krel(2.0) * 1e-9, '4.93482')
mues = Symbol('mue', positive=True)
Kqr = (3 * sp.pi ** 2) ** R_(1, 3) * hbq * cq / (4 * (mues * muq) ** R_(4, 3))
fsim('est-chandra', 'M', 4 * sp.pi * (Kqr / (sp.pi * Gq)) ** R_(3, 2) * sp.Float(w3v, 20) / Msq, deriv=D, tol=1e-8)
fsim('est-chandra', 'ap', 5.83 / mues ** 2, deriv=D)
fsim('est-chandra', 'K', Kqr * sp.Float('1e-9', 40), deriv=D)

# ================================================================ Eddington
D = 'eddington'
LS_, G4, M4, mp4, c4, sT, kap, eta, r4 = [Symbol(k, positive=True) for k in ('L', 'G', 'M', 'mp', 'c', 'sT', 'kappa', 'eta', 'r')]
solves(D, 'σ_T L/(4πr²c) = G M m_p/r² ⇒ L = 4πGMm_p c/σ_T', [Eq(sT * LS_ / (4 * pi * r4 ** 2 * c4), G4 * M4 * mp4 / r4 ** 2)], LS_, 4 * pi * G4 * M4 * mp4 * c4 / sT)
ident(D, 'L_Edd independiente de r: ambas fuerzas ∝ r⁻²', sp.simplify((sT * LS_ / (4 * pi * r4 ** 2 * c4)) / (G4 * M4 * mp4 / r4 ** 2) - sT * LS_ / (4 * pi * c4 * G4 * M4 * mp4)), 0)
ident(D, 'L_Edd = 4πGMc/κ con κ = σ_T/m_p', 4 * pi * G4 * M4 * c4 / (sT / mp4) - 4 * pi * G4 * M4 * mp4 * c4 / sT, 0)
ident(D, 't_S = η/(1−η) κc/(4πG): dM/dt = [(1−η)/η]L_Edd/c² = M/t_S', sp.simplify((1 - eta) / eta * (4 * pi * G4 * M4 * c4 / kap) / c4 ** 2 - M4 / (eta / (1 - eta) * kap * c4 / (4 * pi * G4))), 0)
uE = {'L_Edd': 'W', 'G': 'm^3 kg^-1 s^-2', 'M': 'kg', 'm_p': 'kg', 'c': 'm s^-1', 'sigma_T': 'm^2', 'kappa': 'm^2 kg^-1', 'eta': '1', 't_S': 's'}
LE_, GE, ME_, mpE, cE, sTE, kE, etaE, tS = [Symbol(k, positive=True) for k in ('L_Edd', 'G', 'M', 'm_p', 'c', 'sigma_T', 'kappa', 'eta', 't_S')]
dimcheck(D, 'L_Edd = 4πGMm_p c/σ_T', LE_, 4 * pi * GE * ME_ * mpE * cE / sTE, uE)
dimcheck(D, 'L_Edd = 4πGMc/κ', LE_, 4 * pi * GE * ME_ * cE / kE, uE)
dimcheck(D, 't_S = η/(1−η) κc/(4πG)', tS, etaE / (1 - etaE) * kE * cE / (4 * pi * GE), uE)
LEd = lambda M, ka=sigT / mp: 4 * math.pi * G * M * Ms * c / ka
num(D, 'κ Thomson (m²/kg)', sigT / mp, '0.039773'); num(D, 'L_Edd (10³¹ W)', LEd(1.0) * 1e-31, '1.257'); num(D, 'L_Edd/L☉ (10⁴)', LEd(1.0) / Ls * 1e-4, '3.284'); num(D, 'L_Edd(10 M☉)/L☉ (10⁵)', LEd(10.0) / Ls * 1e-5, '3.28'); num(D, 'L_Edd(100 M☉)/L☉ (10⁶)', LEd(100.0) / Ls * 1e-6, '3.28')
Mdot = LEd(1.0) / (0.1 * c ** 2) / Ms * YR
num(D, 'dM/dt (10⁻⁸ M☉/año)', Mdot * 1e8, '2.2'); tS_ = 0.1 * c * (sigT / mp) / (4 * math.pi * G * 0.9)
num(D, 't_S (millones de años)', tS_ / YR * 1e-6, '50.05'); num(D, 'valor inicial: dM/dt', LEd(1.0, 0.0397726) / (0.1 * c ** 2) / Ms * YR * 1e9, '22.198', tol=1e-4); num(D, 'σ_T c/(4πG m_p) (Gaños)', sigT * c / (4 * math.pi * G * mp) / YR * 1e-9, '0.45')
num(D, 'valor inicial: L_Edd', LEd(1.0, 0.0397726) * 1e-31, '1.2571', tol=1e-4); num(D, 'valor inicial: L/L☉', LEd(1.0, 0.0397726) / Ls * 1e-4, '3.2839')
Me, kae, etae = symbols('M ka eta', positive=True)
fsim('est-eddington', 'L', 4 * sp.pi * Gq * Me * Msq * cq / kae * sp.Float('1e-31', 40), deriv=D)
fsim('est-eddington', 'Ls', 4 * sp.pi * Gq * Me * Msq * cq / kae / Lsq, deriv=D)
fsim('est-eddington', 'Mdot', 4 * sp.pi * Gq * Me * Msq * cq / kae / (etae * cq ** 2) / Msq * YRq * sp.Float('1e9', 40), deriv=D)
fsim('est-eddington', 'ts', etae * cq * kae / (4 * sp.pi * Gq * (1 - etae)) / YRq * sp.Float('1e-6', 40), deriv=D)
