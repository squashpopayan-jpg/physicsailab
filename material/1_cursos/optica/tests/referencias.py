"""Referencias independientes para validar src/core/30-optics.js y 31-num.js.
SciPy (funciones especiales, raíces, integrales, FFT de NumPy), SymPy (sympy.physics.optics:
Fresnel, lentes, haces gaussianos, Jones/Stokes/Mueller), tmm de S. Byrnes (multicapas),
miepython de S. Prahl (dispersión de Mie) y colour-science (colorimetría CIE).
Escribe tests/referencias.json. Ejecutar: python tests/referencias.py"""
import json, math, os, warnings
import numpy as np
from scipy import special, integrate, optimize
warnings.filterwarnings('ignore')

ref = {}
# ---------------- SciPy: funciones especiales ----------------
xs = [0.25, 1.0, 2.5, 3.8317, 7.0, 15.0, 42.0]
ref['J'] = {f'{n},{x}': float(special.jv(n, x)) for n in [0, 1, 2, 5] for x in xs}
ref['K'] = {f'{n},{x}': float(special.kv(n, x)) for n in [0, 1, 2] for x in [0.05, 0.5, 1.0, 3.0, 8.0]}
ref['jzeros'] = {str(n): [float(z) for z in special.jn_zeros(n, 4)] for n in [0, 1, 2]}
ref['fresnel'] = {str(x): [float(special.fresnel(x)[1]), float(special.fresnel(x)[0])] for x in [0.1, 0.7, 1.5, 1.79, 1.81, 2.5, 4.0, 7.3, 20.0]}
ref['hermite'] = {f'{n},{x}': float(special.eval_hermite(n, x)) for n in [3, 6] for x in [-1.3, 0.4, 2.2]}
ref['laguerre'] = {f'{p},{l},{x}': float(special.eval_genlaguerre(p, l, x)) for p, l in [(2, 1), (3, 2), (4, 0)] for x in [0.3, 1.7, 4.5]}
# FFT de NumPy para una señal determinista
k = np.arange(64)
sig = np.cos(0.3 * k) + 0.5 * np.sin(1.7 * k ** 2 / 64) + 1j * 0.25 * np.cos(2.1 * k)
F = np.fft.fft(sig)
ref['fft'] = {'re': [float(v) for v in sig.real], 'im': [float(v) for v in sig.imag], 'bins': {str(b): [float(F[b].real), float(F[b].imag)] for b in [0, 3, 17, 31, 32, 50]}}
Z = (np.add.outer(np.arange(16), 2 * np.arange(16)) % 7) / 7.0
F2 = np.fft.fft2(Z)
ref['fft2'] = {'z': Z.flatten().tolist(), 'bins': {f'{a},{b}': [float(F2[a, b].real), float(F2[a, b].imag)] for a, b in [(0, 0), (1, 2), (5, 11), (8, 8)]}}

# ---------------- SciPy: radiación ----------------
h, c, kB = 6.62607015e-34, 299792458.0, 1.380649e-23
def planck(l, T): return 2 * h * c * c / l ** 5 / np.expm1(h * c / (l * kB * T))
ref['planck_total'] = {str(T): integrate.quad(planck, 1e-8, 2.9e-3 / T * 40, args=(T,), limit=500, epsabs=0, epsrel=1e-13, points=[2.9e-3 / T])[0] + integrate.quad(planck, 2.9e-3 / T * 40, 10.0, args=(T,), limit=500, epsabs=0, epsrel=1e-13)[0] for T in [300.0, 1500.0, 5772.0]}
ref['bb_frac'] = {f'{lnm},{T}': integrate.quad(planck, 1e-9, lnm * 1e-9, args=(T,), epsrel=1e-12, limit=500)[0] * math.pi / (5.670374419e-8 * T ** 4) for lnm, T in [(400, 5772), (700, 5772), (1000, 3000), (10000, 300)]}
xw = optimize.brentq(lambda x: x - 5 * (1 - math.exp(-x)), 1, 10, xtol=1e-15)
ref['wien_b'] = h * c / (kB * xw)

# ---------------- SciPy: óptica geométrica ----------------
def dev(th, n, k): t = math.asin(math.sin(th) / n); return 2 * (th - t) + k * (math.pi - 2 * t)
ref['rainbow'] = {}
for n in [1.3311, 1.3330, 1.3435]:
    for kk in [1, 2, 3]:
        f = (lambda th: dev(th, n, kk)) if kk % 2 == 1 or True else None
        # primario: mínimo de D; secundario: mínimo de D (D > 180°); terciario: mínimo
        r = optimize.minimize_scalar(lambda th: dev(th, n, kk), bounds=(0.01, math.pi / 2 - 1e-9), method='bounded', options={'xatol': 1e-12})
        ref['rainbow'][f'{n},{kk}'] = [float(r.x), float(r.fun)]
ref['prism_min'] = {}
for n, A in [(1.5168, 60), (1.7847, 45), (1.31, 60)]:
    Ar = math.radians(A)
    def d(t1):
        t2 = Ar - math.asin(math.sin(t1) / n)
        return t1 + math.asin(n * math.sin(t2)) - Ar
    lo = math.asin(n * math.sin(Ar - math.asin(1 / n))) + 1e-9
    r = optimize.minimize_scalar(d, bounds=(max(lo, 0.01), math.pi / 2), method='bounded', options={'xatol': 1e-12})
    ref['prism_min'][f'{n},{A}'] = float(r.fun)

# ---------------- SciPy: guías y fibras ----------------
def slab(n1, n2, d, lam):
    k0 = 2 * math.pi / lam; V = k0 * d / 2 * math.sqrt(n1 ** 2 - n2 ** 2); out = []
    m = 0
    while m * math.pi / 2 < V:
        g = lambda u: math.tan(u - m * math.pi / 2) - math.sqrt(V * V - u * u) / u
        lo = m * math.pi / 2 + 1e-12; hi = min(V, (m + 1) * math.pi / 2) - 1e-12
        try:
            u = optimize.brentq(g, lo, hi, xtol=1e-15)
            out.append(math.sqrt(n1 ** 2 - (2 * u / d / k0) ** 2))
        except ValueError:
            pass
        m += 1
    return out
ref['slab'] = {f'{n1},{n2},{d},{lam}': slab(n1, n2, d, lam) for n1, n2, d, lam in [(1.5, 1.45, 4e-6, 1.55e-6), (3.5, 1.45, 0.5e-6, 1.55e-6), (1.46, 1.45, 10e-6, 0.8e-6)]}
def lpb(l, V, m=1):
    def f(u):
        w = math.sqrt(V * V - u * u)
        return u * special.jv(l - 1, u) / special.jv(l, u) + w * special.kv(l - 1, w) / special.kv(l, w)
    if l == 0: lo = 1e-9 if m == 1 else special.jn_zeros(1, m - 1)[-1] + 1e-9; hi = special.jn_zeros(0, m)[-1] - 1e-9
    else: lo = special.jn_zeros(l - 1, m)[-1] + 1e-9; hi = special.jn_zeros(l, m)[-1] - 1e-9
    hi = min(hi, V - 1e-12)
    u = optimize.brentq(f, lo, hi, xtol=1e-15)
    return 1 - u * u / (V * V)
ref['lp'] = {f'{l},{V},{m}': lpb(l, V, m) for l, V, m in [(0, 1.0, 1), (0, 2.0, 1), (0, 2.4, 1), (0, 5.0, 1), (1, 3.0, 1), (1, 5.0, 1), (2, 5.0, 1), (0, 5.0, 2)]}
# dispersión material de la sílice (Malitson): derivadas numéricas con mpmath (40 dígitos)
import mpmath as mp
mp.mp.dps = 40
B = [mp.mpf('0.6961663'), mp.mpf('0.4079426'), mp.mpf('0.8974794')]; Cs = [mp.mpf('0.0684043') ** 2, mp.mpf('0.1162414') ** 2, mp.mpf('9.896161') ** 2]
def n_si(L): return mp.sqrt(1 + sum(b * L * L / (L * L - cc) for b, cc in zip(B, Cs)))
ref['disp'] = {}
for L in ['0.8', '1.31', '1.55', '2.0']:
    Lm = mp.mpf(L)
    D = -(Lm * mp.mpf('1e-6') / c) * mp.diff(n_si, Lm, 2) * mp.mpf('1e12') * mp.mpf('1e6')
    ref['disp'][str(float(L))] = [float(D), float(n_si(Lm) - Lm * mp.diff(n_si, Lm))]
ref['zdw'] = float(mp.findroot(lambda L: mp.diff(n_si, L, 2), mp.mpf('1.27')))
# ajuste de fase tipo I en BBO (Eimerl)
def bbo(L):
    l2 = L * L
    return math.sqrt(2.7359 + 0.01878 / (l2 - 0.01822) - 0.01354 * l2), math.sqrt(2.3753 + 0.01224 / (l2 - 0.01667) - 0.01516 * l2)
def pm(lf):
    no1, _ = bbo(lf / 1000); no2, ne2 = bbo(lf / 2000)
    return optimize.brentq(lambda th: 1 / math.sqrt(math.cos(th) ** 2 / no2 ** 2 + math.sin(th) ** 2 / ne2 ** 2) - no1, 0.01, 1.5, xtol=1e-14)
ref['pm_bbo'] = {str(l): math.degrees(pm(l)) for l in [1064, 800, 532]}

# ---------------- SymPy (sympy.physics.optics) ----------------
from sympy.physics.optics import fresnel_coefficients, lens_makers_formula, BeamParameter, gaussian_conj, hyperfocal_distance, brewster_angle, critical_angle
from sympy.physics.optics import RayTransferMatrix, FreeSpace, CurvedRefraction, ThinLens, CurvedMirror, FlatRefraction
from sympy.physics.optics.polarization import jones_vector, jones_2_stokes, linear_polarizer, phase_retarder, quarter_wave_retarder, half_wave_retarder, mueller_matrix
from sympy import N as SN, re as Sre, im as Sim, Matrix
ref['sym_fresnel'] = {}
for n1, n2, th in [(1, 1.5, 0.001), (1, 1.5, 0.5), (1, 1.5, 0.98), (1, 2.4, 1.2), (1.5, 1, 0.3), (1.5, 1, 0.8), (1.33, 1, 1.0)]:
    v = fresnel_coefficients(th, n1, n2)
    ref['sym_fresnel'][f'{n1},{n2},{th}'] = [[float(SN(Sre(x))), float(SN(Sim(x)))] for x in v]
ref['sym_brewster'] = {f'{a},{b}': float(SN(brewster_angle(a, b))) for a, b in [(1, 1.5), (1.33, 1.52), (1, 4.0)]}
ref['sym_critical'] = {f'{a},{b}': float(SN(critical_angle(a, b))) for a, b in [(1.5, 1), (1.33, 1), (2.42, 1)]}
ref['sym_lensmaker'] = {f'{n},{nm},{r1},{r2},{d}': float(SN(lens_makers_formula(n, nm, r1, r2, d))) for n, nm, r1, r2, d in [(1.5, 1, 10, -10, 0), (1.5, 1, 10, -10, 2), (1.5168, 1, 51.68, 1e12, 5), (1.7847, 1, -25, 40, 3), (1.5, 1.333, 20, -30, 4)]}
ref['sym_hyperfocal'] = {f'{f},{N},{cc}': float(SN(hyperfocal_distance(f, N, cc))) for f, N, cc in [(0.05, 8, 3e-5), (0.035, 2.8, 2e-5)]}
# matriz de un sistema: lente gruesa + espacio + espejo
M = FreeSpace(30) * CurvedMirror(-200) * FreeSpace(50) * CurvedRefraction(-40, 1.6, 1) * FreeSpace(6) * CurvedRefraction(25, 1, 1.6)
ref['sym_abcd'] = [[float(SN(M[0, 0])), float(SN(M[0, 1]))], [float(SN(M[1, 0])), float(SN(M[1, 1]))]]
ref['sym_beam'] = {}
for lam, z, w in [(633e-9, 0.5, 0.4e-3), (1064e-9, -2.0, 1.2e-3), (532e-9, 0.01, 20e-6)]:
    b = BeamParameter(lam, z, w=w)
    ref['sym_beam'][f'{lam},{z},{w}'] = [float(SN(b.w)), float(SN(b.radius)), float(SN(b.gouy)), float(SN(b.z_r)), float(SN(b.divergence))]
# gaussian_conj: solo s_out; su z_r_out usa 1 − (s/f)² en lugar de (1 − s/f)² (error de sympy 1.14), así que
# la cintura de salida se toma de la fórmula de Self (1983) implementada aparte
conj = [(0.1, 0.01, 0.05), (0.3, 0.2, 0.1), (0.02, 0.001, 0.1), (0.05, 0.03, 0.1)]
ref['sym_conj'] = {f'{s},{zr},{f}': float(SN(gaussian_conj(s, zr, f)[0])) for s, zr, f in conj}
ref['self83'] = {f'{s},{zr},{f}': zr / ((1 - s / f) ** 2 + (zr / f) ** 2) for s, zr, f in conj}
ref['sym_stokes'] = {}
cases = [(0.3, 0.2, 'pol', 0.9), (0.0, 0.0, 'qwp', 0.7853981633974483), (0.5, -0.3, 'hwp', 0.2), (1.1, 0.4, 'ret', [0.6, 1.3]), (0.0, 0.7853981633974483, 'pol', 0.0)]
for psi, chi, el, p in cases:
    e = jones_vector(psi, chi)
    J = linear_polarizer(p) if el == 'pol' else quarter_wave_retarder(p) if el == 'qwp' else half_wave_retarder(p) if el == 'hwp' else phase_retarder(p[0], p[1])
    s = jones_2_stokes(J * e)
    ref['sym_stokes'][f'{psi},{chi},{el},{p}'] = [float(SN(Sre(SN(x)))) for x in s]
ref['sym_mueller'] = {}
for el, p in [('qwp', 0.3), ('ret', [0.7, 1.1]), ('pol', 0.4)]:
    J = linear_polarizer(p) if el == 'pol' else quarter_wave_retarder(p) if el == 'qwp' else phase_retarder(p[0], p[1])
    Mm = mueller_matrix(J)
    ref['sym_mueller'][f'{el},{p}'] = [[float(SN(Sre(Mm[i, j]))) for j in range(4)] for i in range(4)]

# ---------------- tmm (Byrnes) ----------------
import tmm
ref['tmm'] = {}
stacks = {
    'interfaz aire–vidrio': ([1, 1.52], [np.inf, np.inf]),
    'MgF₂ λ/4 sobre N-BK7': ([1, 1.38, 1.5168], [np.inf, 550 / 4 / 1.38, np.inf]),
    'V-coat Al₂O₃/MgF₂': ([1, 1.38, 1.63, 1.52], [np.inf, 550 / 4 / 1.38, 550 / 4 / 1.63, np.inf]),
    'Bragg (TiO₂/SiO₂)⁸ TiO₂': ([1] + [2.35, 1.46] * 8 + [2.35, 1.52], [np.inf] + [550 / 4 / 2.35, 550 / 4 / 1.46] * 8 + [550 / 4 / 2.35, np.inf]),
    'plata 40 nm sobre vidrio': ([1, 0.055 + 3.32j, 1.52], [np.inf, 40, np.inf]),
    'oro 30 nm (n complejo)': ([1, 0.47 + 2.40j, 1.52], [np.inf, 30, np.inf]),
    'hueco de aire 300 nm entre prismas': ([1.52, 1.0, 1.52], [np.inf, 300, np.inf]),
    'etalón de vidrio 2 µm': ([1, 1.5, 1], [np.inf, 2000, np.inf]),
}
for name, (ns, ds) in stacks.items():
    for pol in ['s', 'p']:
        for th in [0.0, 0.5, 0.9]:
            for lam in [450.0, 550.0, 650.0]:
                if name.startswith('hueco') and th < 0.75: thv = 0.75
                else: thv = th
                r = tmm.coh_tmm(pol, [complex(x) for x in ns], ds, thv, lam)
                ref['tmm'][f'{name}|{pol}|{thv}|{lam}'] = [float(r['R']), float(r['T'])]
ref['tmm_stacks'] = {name: [[float(np.real(x)), float(np.imag(x))] for x in ns] for name, (ns, ds) in stacks.items()}
ref['tmm_d'] = {name: [None if not np.isfinite(x) else float(x) for x in ds] for name, (ns, ds) in stacks.items()}

# ---------------- miepython (Prahl) ----------------
import miepython
ref['mie'] = {}
ref['mieS'] = {}
for m in [1.33 + 0j, 1.5 + 0.01j, 1.5 + 1.0j, 2.0 + 0j, 0.2 + 3.0j]:
    for x in [0.1, 1.0, 5.0, 20.0, 80.0]:
        qe, qs, qb, g = miepython.efficiencies_mx(complex(m.real, -m.imag), x)
        ref['mie'][f'{m.real},{m.imag},{x}'] = [float(qe), float(qs), float(qb), float(g)]
for m, x in [(1.33 + 0j, 3.0), (1.5 + 0.1j, 10.0)]:
    mu = np.cos(np.radians([0.0, 30.0, 90.0, 150.0, 180.0]))
    S1, S2 = miepython.S1_S2(complex(m.real, -m.imag), x, mu, norm='wiscombe')
    ref['mieS'][f'{m.real},{m.imag},{x}'] = [[float(abs(a) ** 2), float(abs(b) ** 2)] for a, b in zip(S1, S2)]

# ---------------- colour-science ----------------
import colour
shape = colour.SpectralShape(380, 780, 5)
cmfs = colour.MSDS_CMFS['CIE 1931 2 Degree Standard Observer'].copy().align(shape)
ref['bbxy'] = {}
for T in [1500, 2000, 2856, 4000, 6500, 10000]:
    sd = colour.sd_blackbody(T, shape, c1=2 * math.pi * h * c * c, c2=h * c / kB, n=1)
    XYZ = colour.colorimetry.sd_to_XYZ_integration(sd, cmfs, k=1)
    xy = colour.XYZ_to_xy(XYZ)
    ref['bbxy'][str(T)] = [float(xy[0]), float(xy[1]), float(colour.xy_to_CCT(xy, method='McCamy 1992'))]
d65 = colour.SDS_ILLUMINANTS['D65'].copy().align(shape)
XYZd = colour.colorimetry.sd_to_XYZ_integration(d65, cmfs) / 100
ref['d65xy'] = [float(v) for v in colour.XYZ_to_xy(XYZd)]
ref['srgb'] = {}
for XYZ in [[0.4124, 0.2126, 0.0193], [0.20, 0.30, 0.25], [0.6, 0.5, 0.2], [0.05, 0.06, 0.40], [0.9505, 1.0, 1.089]]:
    v = colour.XYZ_to_sRGB(np.array(XYZ), apply_cctf_encoding=False)
    ref['srgb'][','.join(map(str, XYZ))] = [float(a) for a in v]
# color de una película de jabón (n = 1.33, aire en ambos lados) bajo D65
ref['film'] = {}
for dnm in [100, 300, 450, 700]:
    lams = np.arange(380, 781, 5)
    R = [tmm.coh_tmm('s', [1, 1.33, 1], [np.inf, dnm, np.inf], 0, float(l))['R'] for l in lams]
    sd = colour.SpectralDistribution(dict(zip(lams, R)))
    XYZ = colour.colorimetry.sd_to_XYZ_integration(sd, cmfs, d65) / 100
    ref['film'][str(dnm)] = [float(v) for v in XYZ]

# ---------------- Literatura: fórmulas publicadas implementadas aparte ----------------
def iapws_water(Tc, rho, lam):
    """IAPWS R9-97 (Harvey et al. 1998): índice del agua respecto del vacío"""
    a = [0.244257733, 9.74634476e-3, -3.73234996e-3, 2.68678472e-4, 1.58920570e-3, 2.45934259e-3, 0.900704920, -1.66626219e-2]
    T = (Tc + 273.15) / 273.15; r = rho / 1000; L = lam / 0.589; LUV = 0.2292020; LIR = 5.432937
    A = r * (a[0] + a[1] * r + a[2] * T + a[3] * L * L * T + a[4] / L ** 2 + a[5] / (L * L - LUV ** 2) + a[6] / (L * L - LIR ** 2) + a[7] * r * r)
    return math.sqrt((2 * A + 1) / (1 - A))
ref['iapws_water'] = {str(l): iapws_water(20, 998.2067, l) for l in [0.4047, 0.4861, 0.5461, 0.5893, 0.6563, 0.8]}
def edlen(L):
    s2 = 1 / L ** 2
    return 1e-8 * (8342.13 + 2406030 / (130 - s2) + 15997 / (38.9 - s2))
ref['edlen'] = {str(l): edlen(l) for l in [0.4, 0.5893, 0.6328, 1.0]}

# ---------------- refractiveindex.info: metales (fuera de la rejilla de 10 nm del curso) ----------------
from refractiveindex import RefractiveIndexMaterial
ref['metals'] = {}
for k, page in [('Ag', 'Johnson'), ('Au', 'Johnson'), ('Cu', 'Johnson'), ('Al', 'Rakic')]:
    m = RefractiveIndexMaterial(shelf='main', book=k, page=page)
    for l in [415.0, 535.0, 655.0, 775.0]:
        n, kk = float(m.get_refractive_index(l)), float(m.get_extinction_coefficient(l))
        R = abs((1 - (n + 1j * kk)) / (1 + (n + 1j * kk))) ** 2
        ref['metals'][f'{k},{l}'] = [n, kk, R]

out = os.path.join(os.path.dirname(__file__), 'referencias.json')
json.dump(ref, open(out, 'w', encoding='utf8'), ensure_ascii=False, indent=0)
print('OK', out, sum(len(v) if isinstance(v, (dict, list)) else 1 for v in ref.values()), 'valores')
