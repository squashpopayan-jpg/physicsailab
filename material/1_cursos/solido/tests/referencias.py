"""Referencias independientes para validar src/core/29-lin.js, 30-ss.js y 31-ss2.js.
SciPy / NumPy / mpmath (funciones especiales, cuadraturas, raíces, autovalores), ASE (redes,
puntos especiales, Lennard-Jones), spglib (grupos espaciales de las estructuras del curso) y
pymatgen (difracción de rayos X y sumas de Ewald). Todo se programa aquí de forma independiente
del código JavaScript del curso. Escribe tests/referencias.json.
Ejecutar: python tests/referencias.py"""
import json, math, os, subprocess, warnings
import numpy as np
import mpmath as mp
from scipy import special, integrate, optimize
from scipy.spatial import Voronoi, ConvexHull
warnings.filterwarnings('ignore')
HERE = os.path.dirname(os.path.abspath(__file__))
subprocess.run(['node', os.path.join(HERE, '..', 'tools', 'export_structs.js')], check=True)
ST = json.load(open(os.path.join(HERE, 'estructuras.json'), encoding='utf8'))

e, me, h, kB, eps0, c = 1.602176634e-19, 9.1093837015e-31, 6.62607015e-34, 1.380649e-23, 8.8541878128e-12, 299792458.0
hbar = h / (2 * math.pi)
ref = {}

# ---------------- funciones especiales ----------------
mp.mp.dps = 30
ref['fd'] = {f'{j},{eta}': float(mp.re(-mp.polylog(j + 1, -mp.e ** eta))) for j in [-0.5, 0.5, 1.5] for eta in [-6.0, -1.0, 0.0, 1.0, 3.0, 10.0, 30.0]}
ref['gamma'] = {str(x): float(special.gamma(x)) for x in [0.5, 1.5, 2.5, 4.5, 7.3]}
ref['zeta'] = {str(s): float(special.zeta(s)) for s in [1.5, 2.0, 2.5, 3.0, 5.0]}
ref['ellipk'] = {str(m): float(special.ellipk(m)) for m in [0.1, 0.5, 0.9, 0.999]}
ref['ellipe'] = {str(m): float(special.ellipe(m)) for m in [0.1, 0.5, 0.9]}
ref['erfc'] = {str(x): float(special.erfc(x)) for x in [0.1, 0.8, 2.0, 3.0, 4.5]}
ref['k0'] = {str(x): float(special.k0(x)) for x in [0.2, 0.5, 1.0, 2.5, 5.0]}
rng = np.random.default_rng(11)
A = rng.normal(size=(12, 12)); A = A + A.T
Hc = rng.normal(size=(8, 8)) + 1j * rng.normal(size=(8, 8)); Hc = Hc + Hc.conj().T
ref['eig'] = {'A': A.flatten().tolist(), 'val': np.linalg.eigvalsh(A).tolist(), 'Hre': Hc.real.flatten().tolist(), 'Him': Hc.imag.flatten().tolist(), 'hval': np.linalg.eigvalsh(Hc).tolist()}

# ---------------- estructuras: ASE y spglib ----------------
import spglib
from ase.build import bulk
def shells(atoms, i=0, n=3):
    pos = atoms.get_positions(); cell = atoms.get_cell().array; d = []
    for a in range(-3, 4):
        for b in range(-3, 4):
            for cc in range(-3, 4):
                sh = a * cell[0] + b * cell[1] + cc * cell[2]
                for p in pos:
                    r = np.linalg.norm(p + sh - pos[i])
                    if r > 1e-8: d.append(r)
    d = np.sort(np.array(d)); out = []
    for r in d:
        if out and abs(r - out[-1][0]) < 1e-6 * max(1, r): out[-1][1] += 1
        elif len(out) < n: out.append([float(r), 1])
        else: break
    return out
ase_list = {'sc': bulk('Po', 'sc', a=1.0), 'bcc': bulk('Fe', 'bcc', a=1.0, cubic=True), 'fcc': bulk('Cu', 'fcc', a=1.0, cubic=True),
            'diamond': bulk('Si', 'diamond', a=1.0, cubic=True), 'hcp': bulk('Mg', 'hcp', a=1.0, c=math.sqrt(8 / 3)),
            'NaCl': bulk('NaCl', 'rocksalt', a=1.0, cubic=True), 'CsCl': bulk('CsCl', 'cesiumchloride', a=1.0),
            'zincblende': bulk('GaAs', 'zincblende', a=1.0, cubic=True), 'fluorite': bulk('CaF2', 'fluorite', a=1.0, cubic=True)}
ref['shells'] = {k: shells(v) for k, v in ase_list.items()}
ref['packing'] = {}
for k in ['sc', 'bcc', 'fcc', 'diamond', 'hcp']:
    at = ase_list[k]; r = ref['shells'][k][0][0] / 2
    ref['packing'][k] = len(at) * 4 / 3 * math.pi * r ** 3 / at.get_volume()
ref['spg'] = {}
for k, s in ST.items():
    nums = {el: i + 1 for i, el in enumerate(sorted(set(s['species'])))}
    ds = spglib.get_symmetry_dataset((s['cell'], s['frac'], [nums[x] for x in s['species']]), symprec=1e-4)
    ref['spg'][k] = [int(ds.number), ds.international]
# red recíproca y puntos especiales (ASE: Cell.reciprocal() sin el factor 2π)
ref['recip'] = {}
for k, at in [('fcc', bulk('Cu', 'fcc', a=1.0)), ('bcc', bulk('Fe', 'bcc', a=1.0)), ('sc', bulk('Po', 'sc', a=1.0)), ('hex', bulk('Mg', 'hcp', a=1.0, c=math.sqrt(8 / 3)))]:
    cell = at.cell; B = cell.reciprocal()  # unidades 1/a → |k| en unidades de 2π/a
    sp = cell.bandpath().special_points
    ref['recip'][k] = {'vol': float(abs(np.linalg.det(B))), 'pts': {lab: float(np.linalg.norm(np.array(v) @ B)) for lab, v in sp.items()}}
# zonas de Brillouin: celda de Voronoi de la red recíproca (scipy.spatial)
ref['bz'] = {}
for k, at in [('fcc', bulk('Cu', 'fcc', a=1.0)), ('bcc', bulk('Fe', 'bcc', a=1.0)), ('sc', bulk('Po', 'sc', a=1.0)), ('hex', bulk('Mg', 'hcp', a=1.0, c=math.sqrt(8 / 3)))]:
    B = 2 * math.pi * at.cell.reciprocal()
    pts = np.array([i * B[0] + j * B[1] + l * B[2] for i in range(-2, 3) for j in range(-2, 3) for l in range(-2, 3)])
    vor = Voronoi(pts); i0 = int(np.argmin(np.linalg.norm(pts, axis=1)))
    reg = vor.regions[vor.point_region[i0]]; V = vor.vertices[reg]
    hull = ConvexHull(V)
    # caras: agrupar facetas coplanares
    normals = np.round(hull.equations, 8); nf = len({tuple(x) for x in normals})
    ref['bz'][k] = {'nv': len(reg), 'nf': nf, 'vol': float(hull.volume)}
# distancias interplanares con pymatgen
from pymatgen.core import Lattice, Structure
ref['dhkl'] = {}
for k, lat in [('cub', Lattice.cubic(4.0)), ('hex', Lattice.hexagonal(3.209, 5.211))]:
    for hkl in [(1, 0, 0), (1, 1, 0), (1, 1, 1), (2, 1, 0), (2, 1, 3), (0, 0, 2), (1, 0, 1)]:
        ref['dhkl'][f'{k},{hkl[0]},{hkl[1]},{hkl[2]}'] = float(lat.d_hkl(hkl))

# ---------------- difracción: pymatgen ----------------
from pymatgen.analysis.diffraction.xrd import XRDCalculator
xrd = XRDCalculator(wavelength='CuKa')
ref['xrd'] = {}
for k in ['fcc', 'bcc', 'diamond', 'NaCl', 'CsCl', 'zincblende', 'hcp', 'wurtzite', 'Al', 'W', 'KCl', 'fluorite', 'perovskite']:
    s = ST[k]
    pmg = Structure(Lattice(s['cell']), s['species'], s['frac'])
    pat = xrd.get_pattern(pmg, two_theta_range=(0, 90))
    ref['xrd'][k] = [[float(x), float(y)] for x, y in zip(pat.x, pat.y)][:10]
# Ewald: constantes de Madelung
from pymatgen.analysis.ewald import EwaldSummation
ref['madelung'] = {}
for k, ch, rnn in [('NaCl', {'Na': 1, 'Cl': -1}, 0.5), ('CsCl', {'Cs': 1, 'Cl': -1}, math.sqrt(3) / 2), ('zincblende', {'Ga': 1, 'As': -1}, math.sqrt(3) / 4), ('fluorite', {'Ca': 2, 'F': -1}, math.sqrt(3) / 4)]:
    s = ST[k]; a = s['cell'][0][0]
    pmg = Structure(Lattice(np.array(s['cell']) / a), s['species'], s['frac'])
    pmg.add_oxidation_state_by_element(ch)
    E = EwaldSummation(pmg, acc_factor=12).total_energy  # eV, distancias en Å
    nf = sum(1 for x in s['species'] if ch[x] > 0)
    ref['madelung'][k] = -E * rnn / 14.399645478425668 / nf

# ---------------- enlace: sumas de red y ASE ----------------
def lj_sums(at, Rc=30.0):
    cell = at.get_cell().array; pos = at.get_positions(); r0 = shells(at, 0, 1)[0][0]
    n = int(math.ceil(Rc * r0 / min(np.linalg.norm(cell, axis=1)))) + 2
    g = np.arange(-n, n + 1); I, J, K = np.meshgrid(g, g, g, indexing='ij')
    sh = I.reshape(-1, 1) * cell[0] + J.reshape(-1, 1) * cell[1] + K.reshape(-1, 1) * cell[2]
    A6 = A12 = 0.0
    for p in pos:
        r = np.linalg.norm(sh + p - pos[0], axis=1) / r0
        r = r[(r > 1e-9) & (r <= Rc)]
        A6 += np.sum(r ** -6.0); A12 += np.sum(r ** -12.0)
    rho = len(pos) / at.get_volume() * r0 ** 3
    A6 += 4 * math.pi * rho / (3 * Rc ** 3); A12 += 4 * math.pi * rho / (9 * Rc ** 9)
    return [float(A6), float(A12)]
ref['lj'] = {k: lj_sums(ase_list[k]) for k in ['sc', 'bcc', 'fcc', 'hcp']}
from ase.calculators.lj import LennardJones
at = bulk('Ar', 'fcc', a=1.0)
def ljE(a):
    x = at.copy(); x.set_cell(at.cell * a, scale_atoms=True)
    x.calc = LennardJones(epsilon=1.0, sigma=1.0, rc=12.0, smooth=False)
    return x.get_potential_energy() / len(x)
r = optimize.minimize_scalar(lambda a: ljE(a), bounds=(1.4, 1.7), method='bounded', options={'xatol': 1e-10})
a0 = r.x; hh = 1e-3
V = lambda a: a ** 3 / 4
d2 = (ljE(a0 + hh) - 2 * ljE(a0) + ljE(a0 - hh)) / hh ** 2  # d²u/da²
ref['ase_lj'] = {'r0': a0 / math.sqrt(2), 'U': r.fun, 'B': d2 * a0 ** 2 / (9 * V(a0))}

# ---------------- fonones ----------------
def dyn_fcc(k, C=1.0, m=1.0):
    D = np.zeros((3, 3))
    for d in [(s1 * .5, s2 * .5, 0) for s1 in (1, -1) for s2 in (1, -1)] + [(s1 * .5, 0, s2 * .5) for s1 in (1, -1) for s2 in (1, -1)] + [(0, s1 * .5, s2 * .5) for s1 in (1, -1) for s2 in (1, -1)]:
        d = np.array(d); D += C / m * (1 - math.cos(np.dot(k, d) * 2 * math.pi)) * np.outer(d, d) / np.dot(d, d)
    return np.sqrt(np.clip(np.linalg.eigvalsh(D), 0, None)).tolist()
ref['fcc_ph'] = {f'{k[0]},{k[1]},{k[2]}': dyn_fcc(np.array(k)) for k in [(0, 1, 0), (0.5, 0.5, 0.5), (0.5, 1, 0), (0.75, 0.75, 0), (0.2, 0.3, 0.1)]}
def chain2(k, K1, K2, m1, m2):
    M = np.array([[(K1 + K2) / m1, -(K1 + K2 * np.exp(-1j * k)) / math.sqrt(m1 * m2)], [-(K1 + K2 * np.exp(1j * k)) / math.sqrt(m1 * m2), (K1 + K2) / m2]])
    return np.sqrt(np.clip(np.linalg.eigvalsh(M), 0, None)).tolist()
ref['chain2'] = {f'{k},{K1},{K2},{m1},{m2}': chain2(k, K1, K2, m1, m2) for k, K1, K2, m1, m2 in [(0.0, 1, 1, 1, 2), (1.0, 1, 1, 1, 2), (math.pi, 1, 1, 1, 2), (2.0, 1.0, 0.4, 1, 1), (math.pi, 2.0, 0.5, 1, 3)]}

# ---------------- propiedades térmicas ----------------
deb = lambda x: integrate.quad(lambda t: t ** 4 * math.exp(t) / math.expm1(t) ** 2 if t > 0 else 0.0, 0, x, epsabs=0, epsrel=1e-13, limit=200)[0]
ref['debye'] = {str(x): deb(x) for x in [0.1, 1.0, 3.0, 10.0, 30.0]}
R = 6.02214076e23 * kB
ref['debyeC'] = {f'{T},{th}': 9 * R * (T / th) ** 3 * deb(th / T) for T, th in [(10, 343), (50, 343), (300, 343), (77, 645), (1000, 2230)]}
ref['debyeTh'] = {}
for T, Cv in [(20.0, 0.462), (100.0, 16.0)]:
    ref['debyeTh'][f'{T},{Cv}'] = optimize.brentq(lambda th: 9 * R * (T / th) ** 3 * deb(th / T) - Cv, 1, 5000, xtol=1e-12)
def meanx(D, a, kT):
    V = lambda x: D * (1 - math.exp(-a * x)) ** 2
    lo, hi = -3 / a, 12 / a
    Z = integrate.quad(lambda x: math.exp(-V(x) / kT), lo, hi, epsrel=1e-12, limit=200)[0]
    X = integrate.quad(lambda x: x * math.exp(-V(x) / kT), lo, hi, epsrel=1e-12, limit=200)[0]
    return X / Z
ref['morse'] = {f'{kT}': meanx(1.0, 1.0, kT) for kT in [0.01, 0.05, 0.1, 0.2]}

# ---------------- electrones libres ----------------
def mu_free(n, T):
    kT = kB * T
    g = lambda E: 1 / (2 * math.pi ** 2) * (2 * me / hbar ** 2) ** 1.5 * math.sqrt(E)
    def N(mu):
        f = lambda x: g(x * kT) * kT / (1 + math.exp(x - mu / kT)) if x - mu / kT < 700 else 0.0
        top = max(mu / kT, 0) + 80
        return integrate.quad(f, 0, top, epsabs=0, epsrel=1e-12, limit=400, points=[max(mu / kT, 1e-9)] if mu > 0 else None)[0] - n
    EF = hbar ** 2 * (3 * math.pi ** 2 * n) ** (2 / 3) / (2 * me)
    return optimize.brentq(N, -50 * EF - 100 * kT, 2 * EF, xtol=1e-30, rtol=1e-14) / e
ref['mu'] = {f'{n},{T}': mu_free(n, T) for n, T in [(8.47e28, 300.0), (8.47e28, 3e4), (8.47e28, 1e5), (2.65e28, 1e4), (1e24, 300.0)]}

# ---------------- Kronig–Penney ----------------
HB2M = hbar ** 2 / (2 * me) / e * 1e18
def kpF(E, V0, a, b):
    al = math.sqrt(E / HB2M)
    if E < V0:
        be = math.sqrt((V0 - E) / HB2M)
        return math.cos(al * a) * math.cosh(be * b) + (be ** 2 - al ** 2) / (2 * al * be) * math.sin(al * a) * math.sinh(be * b)
    ga = math.sqrt((E - V0) / HB2M)
    return math.cos(al * a) * math.cos(ga * b) - (al ** 2 + ga ** 2) / (2 * al * ga) * math.sin(al * a) * math.sin(ga * b)
ref['kp'] = {}
for V0, a, b in [(0.3, 1.0, 0.3), (1.0, 0.8, 0.2), (0.5, 2.0, 0.5)]:
    Es = np.linspace(1e-6, 2.0, 20001); edges = []
    for s in [1, -1]:
        f = np.array([kpF(E, V0, a, b) - s for E in Es])
        for i in np.where(np.sign(f[:-1]) * np.sign(f[1:]) < 0)[0]:
            edges.append(optimize.brentq(lambda E: kpF(E, V0, a, b) - s, Es[i], Es[i + 1], xtol=1e-15))
    ref['kp'][f'{V0},{a},{b}'] = sorted(edges)[:6]
# método independiente: ondas planas (serie de Fourier del potencial periódico) en k = 0 y k = π/(a+b)
def kp_pw(V0, a, b, k, NG=301):
    Lc = a + b; n = np.arange(-(NG // 2), NG // 2 + 1); G = 2 * math.pi * n / Lc
    dm = n[:, None] - n[None, :]; Gd = 2 * math.pi * dm / Lc
    # V(x) = V0 en a < x < a + b
    with np.errstate(invalid='ignore', divide='ignore'):
        Vq = np.where(dm == 0, V0 * b / Lc, V0 / (1j * Gd * Lc) * (np.exp(-1j * Gd * a) - np.exp(-1j * Gd * Lc)))
    Hm = np.diag(HB2M * (k + G) ** 2) + Vq
    return np.linalg.eigvalsh(Hm)[:3].tolist()
ref['kp_pw'] = {f'{V0},{a},{b},{kk}': kp_pw(V0, a, b, kk * math.pi / (a + b)) for V0, a, b in [(0.3, 1.0, 0.3)] for kk in [0.0, 0.5, 1.0]}
# ecuación central 1D
def central(k, U, nG=7):
    n = np.arange(-nG, nG + 1); H = np.diag((k / (2 * math.pi) + n) ** 2.0)
    for i in range(len(n)):
        for j in range(len(n)):
            d = abs(i - j)
            if 0 < d <= len(U): H[i, j] = U[d - 1]
    return np.linalg.eigvalsh(H)[:4].tolist()
ref['central'] = {f'{k},{U[0]},{U[1]}': central(k, U) for k, U in [(0.0, [0.1, 0.0]), (math.pi, [0.1, 0.0]), (math.pi, [0.05, 0.03]), (2.0, [0.2, 0.05])]}

# ---------------- enlace fuerte ----------------
ref['dossq'] = {str(E): float(special.ellipk(1 - E ** 2 / 16) / (2 * math.pi ** 2)) for E in [0.1, 1.0, 2.5, 3.9]}
def graphene(kx, ky):
    d = [np.array([0, 1.0]), np.array([math.sqrt(3) / 2, -0.5]), np.array([-math.sqrt(3) / 2, -0.5])]
    f = sum(np.exp(1j * np.dot([kx, ky], v)) for v in d)
    H = np.array([[0, f], [np.conj(f), 0]])
    return np.linalg.eigvalsh(H).tolist()
ref['graphene'] = {f'{kx},{ky}': graphene(kx, ky) for kx, ky in [(0, 0), (4 * math.pi / (3 * math.sqrt(3)), 0), (1.0, 0.5), (0.3, 2.0)]}
def ssh(N, v, w):
    H = np.zeros((2 * N, 2 * N))
    for i in range(2 * N - 1): H[i, i + 1] = H[i + 1, i] = -(v if i % 2 == 0 else w)
    return np.linalg.eigvalsh(H)
ref['ssh'] = {f'{N},{v},{w}': sorted(np.abs(ssh(N, v, w)))[:2] for N, v, w in [(20, 0.5, 1.0), (20, 1.0, 0.5), (30, 0.8, 1.0)]}
ref['ssh'] = {k: [float(x) for x in v] for k, v in ref['ssh'].items()}
def harper(p, q, kx, ky):
    H = np.zeros((q, q), dtype=complex)
    for m in range(q): H[m, m] = 2 * math.cos(ky + 2 * math.pi * p * m / q)
    for m in range(q):
        j = (m + 1) % q
        ph = np.exp(1j * q * kx) if j == 0 else 1.0
        H[j, m] += ph if j == 0 else 1.0
        H[m, j] += np.conj(ph) if j == 0 else 1.0
    return np.linalg.eigvalsh(H).tolist()
ref['harper'] = {f'{p},{q},{kx},{ky}': harper(p, q, kx, ky) for p, q, kx, ky in [(1, 3, 0.0, 0.0), (1, 3, 0.3, 0.2), (2, 5, 0.1, 0.7), (3, 7, 0.4, 0.4), (1, 4, 0.3, 0.2)]}

# ---------------- pseudopotencial empírico ----------------
EPM = {'Si': (5.43, [-0.21, 0.04, 0.08], [0, 0, 0]), 'Ge': (5.66, [-0.23, 0.01, 0.06], [0, 0, 0]), 'GaAs': (5.64, [-0.23, 0.01, 0.06], [0.07, 0.05, 0.01])}
a0b = 5.29177210903e-11 * 1e10
Glist = [np.array([i, j, l]) for i in range(-5, 6) for j in range(-5, 6) for l in range(-5, 6) if len({abs(x) % 2 for x in (i, j, l)}) == 1]
def epm(mat, k, ecut=14):
    a, S, A_ = EPM[mat]; kin = (2 * math.pi / (a / a0b)) ** 2; k = np.array(k, float)
    Gs = [G for G in Glist if np.sum((k + G) ** 2) <= ecut]
    n = len(Gs); H = np.zeros((n, n), dtype=complex)
    for i in range(n):
        H[i, i] = kin * np.sum((k + Gs[i]) ** 2)
        for j in range(n):
            if i == j: continue
            d = Gs[i] - Gs[j]; g2 = int(np.sum(d ** 2))
            ph = math.pi / 4 * np.sum(d)
            vs = S[{3: 0, 8: 1, 11: 2}[g2]] * math.cos(ph) if g2 in (3, 8, 11) else 0.0
            va = A_[{3: 0, 4: 1, 11: 2}[g2]] * math.sin(ph) if g2 in (3, 4, 11) else 0.0
            H[i, j] = vs + 1j * va
    return (np.linalg.eigvalsh(H)[:8] * 13.605693122994).tolist()
ref['epm'] = {f'{m},{k[0]},{k[1]},{k[2]}': epm(m, k) for m in EPM for k in [(0, 0, 0), (0, 1, 0), (0.5, 0.5, 0.5), (0, 0.85, 0), (0.75, 0.75, 0)]}

# ---------------- semiconductores ----------------
F12 = lambda eta: integrate.quad(lambda x: math.sqrt(x) / (1 + math.exp(x - eta)) if x - eta < 700 else 0.0, 0, max(eta, 0) + 80, epsabs=0, epsrel=1e-13, limit=400)[0] * 2 / math.sqrt(math.pi)
def neutral(T, Nd, Na, Ed, Ea, Eg0=1.1700, al=4.730e-4, be=636.0, Nc300=2.86e19, Nv300=3.10e19):
    Eg = Eg0 - al * T * T / (T + be); kT = kB * T / e
    Nc, Nv = Nc300 * (T / 300) ** 1.5, Nv300 * (T / 300) ** 1.5
    def f(EF):
        n = Nc * F12((EF - Eg) / kT); p = Nv * F12(-EF / kT)
        Ndp = Nd / (1 + 2 * math.exp((EF - (Eg - Ed)) / kT)); Nam = Na / (1 + 4 * math.exp((Ea - EF) / kT))
        return (p + Ndp - n - Nam) / (p + Ndp + n + Nam + 1)
    EF = optimize.brentq(f, -0.5 - 20 * kT, Eg + 0.5 + 20 * kT, xtol=1e-15)
    return [EF, Nc * F12((EF - Eg) / kT)]
ref['neutral'] = {f'{T},{Nd},{Na}': neutral(T, Nd, Na, 0.045, 0.045) for T, Nd, Na in [(300.0, 1e16, 0.0), (77.0, 1e16, 0.0), (40.0, 1e16, 0.0), (300.0, 0.0, 1e17), (600.0, 1e15, 0.0), (300.0, 1e19, 0.0), (300.0, 1e16, 3e15)]}
# unión p–n en equilibrio: campo en la unión por la primera integral de Poisson–Boltzmann
def pn_E0(Na, Nd, ni, T, epsr):
    vt = kB * T / e; eps = epsr * eps0 * 1e-2; q = e
    psip, psin = -vt * math.log(Na / ni), vt * math.log(Nd / ni)
    rho_p = lambda ps: q * (ni * math.exp(-ps / vt) - ni * math.exp(ps / vt) - Na)
    rho_n = lambda ps: q * (ni * math.exp(-ps / vt) - ni * math.exp(ps / vt) + Nd)
    def E2(side, ps):
        if side == 'p': return -2 / eps * integrate.quad(rho_p, psip, ps, epsrel=1e-13, epsabs=0, limit=200)[0]
        return 2 / eps * integrate.quad(rho_n, ps, psin, epsrel=1e-13, epsabs=0, limit=200)[0]
    ps0 = optimize.brentq(lambda ps: E2('p', ps) - E2('n', ps), psip + 1e-9, psin - 1e-9, xtol=1e-15)
    return [math.sqrt(E2('p', ps0)), ps0, psin - psip]
ref['pn'] = {f'{Na},{Nd}': pn_E0(Na, Nd, 1e10, 300.0, 11.7) for Na, Nd in [(1e16, 1e16), (1e17, 1e15), (1e18, 1e16)]}
# Shockley–Queisser
def phflux(Eg, T):
    kT = kB * T / e; pref = 2 * math.pi / (h ** 3 * c ** 2) * e ** 3
    return pref * kT ** 3 * integrate.quad(lambda x: x * x / math.expm1(x), Eg / kT, Eg / kT + 80, epsrel=1e-13, epsabs=0)[0]
def sq(Eg, Ts=5778.0, Tc=300.0):
    f = (6.957e8 / 1.495978707e11) ** 2; sig = 2 * math.pi ** 5 * kB ** 4 / (15 * h ** 3 * c ** 2)
    Jsc = e * f * phflux(Eg, Ts); J0 = e * phflux(Eg, Tc); vt = kB * Tc / e
    r = optimize.minimize_scalar(lambda V: -V * (Jsc - J0 * math.expm1(V / vt)), bounds=(0, vt * math.log1p(Jsc / J0)), method='bounded', options={'xatol': 1e-12})
    return [-r.fun / (f * sig * Ts ** 4), vt * math.log1p(Jsc / J0)]
ref['sq'] = {str(Eg): sq(Eg) for Eg in [0.7, 1.12, 1.34, 1.42, 2.0]}
# pozo cuántico finito
def wellf(V0, L, mr):
    c2 = HB2M / mr; u0 = L / 2 * math.sqrt(V0 / c2); out = []; m = 0
    while m * math.pi / 2 < u0:
        lo, hi = m * math.pi / 2 + 1e-12, min((m + 1) * math.pi / 2 - 1e-12, u0)
        f = (lambda u: u * math.tan(u) - math.sqrt(max(0, u0 ** 2 - u ** 2))) if m % 2 == 0 else (lambda u: -u / math.tan(u) - math.sqrt(max(0, u0 ** 2 - u ** 2)))
        if f(lo) * f(hi) <= 0: out.append(c2 * (2 * optimize.brentq(f, lo, hi, xtol=1e-15) / L) ** 2)
        m += 1
    return out
ref['well'] = {f'{V0},{L},{mr}': wellf(V0, L, mr) for V0, L, mr in [(0.3, 10.0, 0.067), (0.2, 5.0, 0.067), (1.0, 2.0, 1.0)]}

# ---------------- magnetismo ----------------
def brill(J, x):
    ms = np.arange(-J, J + 1)
    w = np.exp(ms * x / J); return float(np.sum(ms * w) / np.sum(w) / J)
ref['brillouin'] = {f'{J},{x}': brill(J, x) for J in [0.5, 1.0, 2.5, 3.5] for x in [0.1, 1.0, 3.0]}
def weiss(J, t):
    BJ = lambda x: brill(J, x)
    return optimize.brentq(lambda m: m - BJ(3 * J / (J + 1) * m / t), 1e-12, 1, xtol=1e-15)
ref['weiss'] = {f'{J},{t}': weiss(J, t) for J in [0.5, 3.5] for t in [0.2, 0.5, 0.9]}
def bcs(t):
    D0 = math.pi * math.exp(-np.euler_gamma)
    def F(d):
        D = d * D0
        I = integrate.quad(lambda xi: 1 / (math.sqrt(xi * xi + D * D) * (math.exp(math.sqrt(xi * xi + D * D) / t) + 1)), 0, 100 * t + D, epsrel=1e-13, epsabs=0, limit=200)[0]
        return math.log(1 / d) - 2 * I
    return optimize.brentq(F, 1e-10, 1 - 1e-14, xtol=1e-15)
ref['bcs'] = {str(t): bcs(t) for t in [0.2, 0.5, 0.8, 0.95]}
def bcs_cut(wD, lam):
    Tc = optimize.brentq(lambda kT: integrate.quad(lambda x: math.tanh(x / (2 * kT)) / x if x > 0 else 1 / (2 * kT), 0, wD, limit=400, epsrel=1e-13)[0] - 1 / lam, 1e-6 * wD, wD, xtol=1e-15)
    return [Tc, wD / math.sinh(1 / lam)]
ref['bcs_cut'] = {f'{wD},{lam}': bcs_cut(wD, lam) for wD, lam in [(100.0, 0.3), (100.0, 0.2), (50.0, 0.4)]}

out = os.path.join(HERE, 'referencias.json')
json.dump(ref, open(out, 'w', encoding='utf8'), ensure_ascii=False, indent=0)
print('OK', out, sum(len(v) if isinstance(v, (dict, list)) else 1 for v in ref.values()), 'grupos de valores')
