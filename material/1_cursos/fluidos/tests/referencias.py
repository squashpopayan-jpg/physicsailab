"""Referencias independientes para validar src/core/30-fluid.js y 31-num.js.
CoolProp 8 (IAPWS-95, IAPWS 2008, Lemmon et al.), la biblioteca fluids de Caleb Bell
(fricción, arrastre, atmósfera estándar, Manning) y SciPy (capa límite, funciones de
Bessel, flujo compresible, dispersión, estabilidad).
Escribe tests/referencias.json. Ejecutar: python tests/referencias.py"""
import json, math, os
import numpy as np
from scipy import special, integrate, optimize
from CoolProp.CoolProp import PropsSI as P
import fluids
from fluids import friction, drag, atmosphere, open_flow, fittings

ref = {}
# ---------------- CoolProp: estados fuera de los nodos de las tablas ----------------
ref['agua'] = {str(T): [P('D', 'T', T, 'P', 101325, 'Water'), P('V', 'T', T, 'P', 101325, 'Water'), P('C', 'T', T, 'P', 101325, 'Water'),
                        P('L', 'T', T, 'P', 101325, 'Water'), P('A', 'T', T, 'P', 101325, 'Water'), P('P', 'T', T, 'Q', 0, 'Water')]
               for T in [274.65, 278.65, 288.4, 293.15, 303.7, 310.15, 318.9, 336.2, 352.35, 368.75]}
ref['agua_sat'] = {str(T): [P('D', 'T', T, 'Q', 0, 'Water'), P('V', 'T', T, 'Q', 0, 'Water'), P('P', 'T', T, 'Q', 0, 'Water')]
                   for T in [393.7, 431.2, 487.9, 551.3, 612.4]}
ref['aire'] = {str(T): [P('D', 'T', T, 'P', 101325, 'Air'), P('V', 'T', T, 'P', 101325, 'Air'), P('L', 'T', T, 'P', 101325, 'Air'),
                        P('C', 'T', T, 'P', 101325, 'Air'), P('A', 'T', T, 'P', 101325, 'Air')]
               for T in [213.4, 251.7, 288.15, 333.3, 457.8, 795.2, 1234.5]}
ref['liq'] = {}
for name, f, Ts in [('etanol', 'Ethanol', [278.4, 298.4, 321.7]), ('metanol', 'Methanol', [283.2, 305.6]), ('tolueno', 'Toluene', [293.7, 341.2]), ('heptano', 'n-Heptane', [289.9, 330.1])]:
    for T in Ts:
        ref['liq'][f'{name},{T}'] = [P('D', 'T', T, 'P', 101325, f), P('V', 'T', T, 'P', 101325, f), P('I', 'T', T, 'Q', 0, f)]
# Tensión superficial y presión de vapor (fórmulas IAPWS del curso frente a CoolProp)
ref['sigma'] = {str(T): P('I', 'T', T, 'Q', 0, 'Water') for T in [273.16, 283.15, 298.15, 323.15, 353.15, 373.15, 423.15, 523.15, 623.15]}
ref['psat'] = {str(T): P('P', 'T', T, 'Q', 0, 'Water') for T in [273.16, 283.15, 293.15, 313.15, 333.15, 353.15, 373.15, 453.15, 573.15, 643.15]}
# Ebullición en Popayán (1760 m, presión de la atmósfera estándar)
pPop = atmosphere.ATMOSPHERE_1976(1760).P
ref['popayan'] = {'P': pPop, 'Tb': P('T', 'P', pPop, 'Q', 0, 'Water')}

# ---------------- fluids (Caleb Bell) ----------------
cases = [(3000, 0), (1e4, 0), (1e5, 1e-4), (5e5, 2e-3), (1e6, 1e-3), (1e7, 1e-5), (5e7, 1e-2), (1e8, 0)]
ref['colebrook'] = {f'{Re},{e}': friction.Colebrook(Re, e) for Re, e in cases}
ref['haaland'] = {f'{Re},{e}': friction.Haaland(Re, e) for Re, e in cases}
ref['swamee'] = {f'{Re},{e}': friction.Swamee_Jain_1976(Re, e) for Re, e in cases}
ref['churchill'] = {f'{Re},{e}': friction.Churchill_1977(Re, e) for Re, e in cases + [(500, 1e-3), (1500, 0)]}
Res = [0.1, 1, 10, 100, 1e3, 1e4, 1e5, 2e5, 5e5, 1e6]
ref['cd_morrison'] = {str(Re): drag.Morrison(Re) for Re in Res}
ref['cd_clift'] = {str(Re): drag.Clift_Gauvin(Re) for Re in Res[:-2]}
# velocidad terminal: (d, ρp, ρ, μ)
vt_cases = [(1e-4, 2650, 998.2, 1.002e-3), (1e-3, 2650, 998.2, 1.002e-3), (5e-3, 7800, 998.2, 1.002e-3), (2e-3, 998.2, 1.204, 1.81e-5), (4e-3, 998.2, 1.204, 1.81e-5), (0.02, 1100, 1.204, 1.81e-5)]
ref['vterm'] = {','.join(map(str, c)): drag.v_terminal(c[0], c[1], c[2], c[3], Method='Morrison') for c in vt_cases}
ref['atm'] = {}
for Z in [0, 1760, 5000, 11000, 15000, 25000, 40000, 60000, 80000]:
    a = atmosphere.ATMOSPHERE_1976(Z)
    ref['atm'][str(Z)] = [a.T, a.P, a.rho, a.v_sonic, a.mu, a.g]
# Manning: velocidad V = Rh^(2/3) S^(1/2) / n
ref['manning'] = {f'{y},{b},{z},{n},{S}': open_flow.V_Manning((b + z * y) * y / (b + 2 * y * math.sqrt(1 + z * z)), S, n) for y, b, z, n, S in [(1.2, 3, 0, 0.013, 1e-3), (0.8, 2, 1.5, 0.022, 5e-4), (2.5, 10, 2, 0.03, 2e-4)]}
ref['kexp'] = {f'{d},{D}': fittings.diffuser_sharp(d, D) for d, D in [(0.05, 0.1), (0.08, 0.1), (0.02, 0.2)]}

# ---------------- SciPy ----------------
def fs(beta, a=1.0, L=14):
    """f''' + a f f'' + β(1 − f'²) = 0 con solve_bvp"""
    eta = np.linspace(0, L, 3000)
    def rhs(t, y): return np.vstack([y[1], y[2], -a * y[0] * y[2] - beta * (1 - y[1] ** 2)])
    def bc(y0, y1): return np.array([y0[0], y0[1], y1[1] - 1])
    y = np.zeros((3, eta.size)); y[1] = 1 - np.exp(-eta); y[0] = eta - 1 + np.exp(-eta); y[2] = np.exp(-eta)
    s = integrate.solve_bvp(rhs, bc, eta, y, tol=1e-10, max_nodes=200000)
    e = np.linspace(0, L, 200001); Y = s.sol(e)
    dstar = np.trapezoid(1 - Y[1], e); theta = np.trapezoid(Y[1] * (1 - Y[1]), e)
    d99 = float(np.interp(0.99, Y[1][:np.argmax(Y[1] > 0.995)], e[:np.argmax(Y[1] > 0.995)]))
    return {'fpp0': float(s.sol(0)[2]), 'dstar': float(dstar), 'theta': float(theta), 'd99': d99}
ref['blasius'] = fs(0, a=0.5, L=16)
ref['fs'] = {str(b): fs(b, L=12) for b in [1.0, 0.5, 0.1, -0.1, -0.18]}
xs = [0.3, 1.0, 2.5, 7.0, 15.0]
ref['besselJ0'] = {str(x): float(special.j0(x)) for x in xs}
ref['besselJ1'] = {str(x): float(special.j1(x)) for x in xs}
ref['besselJ2'] = {str(x): float(special.jv(2, x)) for x in xs}
ref['besselI0'] = {str(x): float(special.i0(x)) for x in xs}
ref['besselI1'] = {str(x): float(special.i1(x)) for x in xs}
ref['j0zeros'] = [float(z) for z in special.jn_zeros(0, 6)]
ref['erf'] = {str(x): float(special.erf(x)) for x in [0.05, 0.5, 1.0, 1.7, 2.5]}
ref['erfc'] = {str(x): float(special.erfc(x)) for x in [0.5, 1.5, 3.0, 4.5]}
# J0 complejo (Womersley): z = i^{3/2} α s
i32 = np.exp(3j * np.pi / 4)
ref['j0c'] = {f'{a}': [float(special.jv(0, i32 * a).real), float(special.jv(0, i32 * a).imag)] for a in [0.5, 2.0, 5.0, 12.0]}
# Womersley: perfil u(s, t) con Ap = 1, ρ = 1, ω = 1
def wom(s, t, al):
    u = (1 / (1j)) * (1 - special.jv(0, i32 * al * s) / special.jv(0, i32 * al)) * np.exp(1j * t)
    return float(u.real)
ref['womersley'] = {f'{s},{t},{al}': wom(s, t, al) for s, t, al in [(0, 0, 1), (0, 1, 3), (0.5, 2, 5), (0.9, 0.3, 10), (0, 4, 20)]}
# Arranque de Szymanski con 200 ceros
Z = special.jn_zeros(0, 200)
ref['szymanski'] = {f'{s},{tau}': float(1 - s * s - 8 * np.sum(special.j0(Z * s) / (Z ** 3 * special.j1(Z)) * np.exp(-Z ** 2 * tau))) for s, tau in [(0, 0.05), (0, 0.2), (0.5, 0.1), (0.8, 0.5)]}
# Plateau–Rayleigh: máximo de x I1/I0 (1 − x²)
r = optimize.minimize_scalar(lambda x: -(x * special.i1(x) / special.i0(x) * (1 - x * x)), bounds=(0.1, 0.99), method='bounded', options={'xatol': 1e-12})
ref['plateau'] = {'x': float(r.x), 's2': float(-r.fun)}
# Flujo compresible (k = 1.4)
k = 1.4
def theta(M, b): return math.atan(2 / math.tan(b) * (M * M * math.sin(b) ** 2 - 1) / (M * M * (k + math.cos(2 * b)) + 2))
ref['oblique'] = {}
for M, th in [(2.0, 10), (3.0, 20), (1.5, 5), (5.0, 30)]:
    mu = math.asin(1 / M)
    bm = optimize.minimize_scalar(lambda b: -theta(M, b), bounds=(mu, math.pi / 2), method='bounded', options={'xatol': 1e-12}).x
    b = optimize.brentq(lambda b: theta(M, b) - math.radians(th), mu + 1e-12, bm, xtol=1e-14)
    ref['oblique'][f'{M},{th}'] = [math.degrees(b), math.degrees(theta(M, bm))]
def nu(M): a = math.sqrt((k + 1) / (k - 1)); return a * math.atan(math.sqrt((M * M - 1) / a / a)) - math.atan(math.sqrt(M * M - 1))
ref['pm'] = {str(M): math.degrees(nu(M)) for M in [1.2, 2.0, 3.0, 5.0]}
ref['pm_inv'] = {str(n): optimize.brentq(lambda M: math.degrees(nu(M)) - n, 1, 50, xtol=1e-14) for n in [10, 26.38, 50, 80]}
def AAs(M): return 1 / M * ((2 / (k + 1)) * (1 + (k - 1) / 2 * M * M)) ** ((k + 1) / (2 * (k - 1)))
ref['mfroma'] = {str(A): [optimize.brentq(lambda M: AAs(M) - A, 1e-6, 1, xtol=1e-15), optimize.brentq(lambda M: AAs(M) - A, 1, 50, xtol=1e-15)] for A in [1.1, 1.6875, 4.0, 25.0]}
# Dispersión de ondas de gravedad: longitud de onda para periodo T y profundidad h
ref['dispersion'] = {f'{T},{h}': 2 * math.pi / optimize.brentq(lambda kk: math.sqrt(9.80665 * kk * math.tanh(kk * h)) - 2 * math.pi / T, 1e-8, 1e4, xtol=1e-15) for T, h in [(8, 10), (8, 1000), (12, 4), (2, 0.5)]}
# Capilaridad–gravedad: velocidad de fase mínima del agua (γ = 0.0728 N/m, ρ = 998.2)
sg = 0.0728 / 998.2
cmin = optimize.minimize_scalar(lambda kk: math.sqrt(9.80665 / kk + sg * kk), bounds=(10, 2000), method='bounded', options={'xatol': 1e-10})
ref['cmin'] = {'c': float(cmin.fun), 'lam': 2 * math.pi / float(cmin.x)}
# Lamb–Oseen: radio de velocidad máxima, raíz de e^{x²} = 1 + 2x²
ref['lo_rmax'] = optimize.brentq(lambda x: math.exp(x * x) - 1 - 2 * x * x, 0.5, 2, xtol=1e-15)
# Rayleigh–Bénard libre–libre: mínimo de (k²+π²)³/k²
r = optimize.minimize_scalar(lambda kk: (kk * kk + math.pi ** 2) ** 3 / kk ** 2, bounds=(1, 4), method='bounded', options={'xatol': 1e-12})
ref['rb_free'] = {'k': float(r.x), 'Ra': float(r.fun)}
# Lorenz: integración de referencia con solve_ivp (σ = 10, r = 28, b = 8/3) hasta t = 2
sol = integrate.solve_ivp(lambda t, y: [10 * (y[1] - y[0]), y[0] * (28 - y[2]) - y[1], y[0] * y[1] - 8 / 3 * y[2]], [0, 2], [1, 1, 1], rtol=1e-12, atol=1e-12)
ref['lorenz'] = [float(v) for v in sol.y[:, -1]]
# Ducto cuadrado: Q·μ/(G a⁴) por la serie de Fourier
s = sum(math.tanh(n * math.pi / 2) / n ** 5 for n in range(1, 2001, 2))
ref['duct'] = (4 / 3) * (1 - 192 / math.pi ** 5 * s) / 16
# Bingham y ley de potencia: caudales por integración numérica del perfil
def qint(u, R): return 2 * math.pi * integrate.quad(lambda r: u(r) * r, 0, R, epsabs=1e-16, epsrel=1e-13, limit=200)[0]
R, G = 0.01, 2000.0
ref['powerQ'] = {}
for K, n in [(0.5, 0.5), (0.02, 1.0), (2.0, 1.4)]:
    c = (G / (2 * K)) ** (1 / n); e = (n + 1) / n
    ref['powerQ'][f'{K},{n}'] = qint(lambda r: n / (n + 1) * c * (R ** e - r ** e), R)
ref['binghamQ'] = {}
for mup, ty in [(0.05, 2.0), (0.05, 8.0)]:
    rp = 2 * ty / G
    ref['binghamQ'][f'{mup},{ty}'] = qint(lambda r: G / (4 * mup) * (R * R - max(r, rp) ** 2) - ty / mup * (R - max(r, rp)), R)
# Sod (Toro, 2009): p* y u* por brentq
def fK(p, r, pk):
    c = math.sqrt(k * pk / r)
    if p > pk:
        A = 2 / ((k + 1) * r); B = (k - 1) / (k + 1) * pk
        return (p - pk) * math.sqrt(A / (p + B))
    return 2 * c / (k - 1) * ((p / pk) ** ((k - 1) / (2 * k)) - 1)
ps = optimize.brentq(lambda p: fK(p, 1, 1) + fK(p, 0.125, 0.1), 1e-6, 1, xtol=1e-15)
ref['sod'] = {'p': ps, 'u': 0.5 * (fK(ps, 0.125, 0.1) - fK(ps, 1, 1))}

ref['versiones'] = {'CoolProp': __import__('CoolProp').__version__, 'fluids': fluids.__version__, 'scipy': __import__('scipy').__version__, 'numpy': np.__version__}
with open(os.path.join(os.path.dirname(__file__), 'referencias.json'), 'w', encoding='utf-8') as f:
    json.dump(ref, f, indent=1)
print('referencias.json escrito:', len(ref), 'grupos')
