# Cap. 16: átomos con varios electrones — SCF radial en malla logarítmica (SciPy), integrales J y K exactas (SymPy), términos por enumeración de microestados,
# Slater por grupos, configuraciones/energías de ionización de pymatgen (NIST)
import itertools, re
from scipy.linalg import eigh_tridiagonal
# --- Hartree–Fock de dos electrones por el método de Roothaan con 14 orbitales de Slater tipo s (u = r e^{−ζr}, ζ en progresión geométrica; integrales exactas) ---
def Jab(a, b): return 2/(a**2*b**3)-2*a/(b**3*(a+b)**3)-4/(b**2*(a+b)**3)     # ∫∫ r1²e^{−a r1} r2²e^{−b r2}/r_>  (SymPy)
def he_roothaan(Z, K=14, z0=0.25, q=1.55):
    zt = z0*q**np.arange(K); A = zt[:, None]+zt[None, :]
    S = 2/A**3
    T = 0.5*(1/A-(zt[:, None]+zt[None, :])/A**2+2*zt[:, None]*zt[None, :]/A**3)
    V = -Z/A**2; Hc = T+V
    G = np.zeros((K, K, K, K))
    for i in range(K):
        for j in range(K):
            for k in range(K):
                for l in range(K): G[i, j, k, l] = Jab(A[i, j], A[k, l])
    c = np.ones(K)/K
    from scipy.linalg import eigh
    for it in range(300):
        c = c/math.sqrt(c@S@c)
        F = Hc+np.einsum('k,l,ijkl->ij', c, c, 2*G)-np.einsum('k,l,ikjl->ij', c, c, G)
        ev, vec = eigh(F, S); cn = vec[:, 0]; cn = cn/math.sqrt(cn@S@cn)
        if abs(abs(cn@S@c)-1) < 1e-15 and it > 5: c = cn; break
        c = 0.5*c+0.5*cn*np.sign(cn@S@c)
    c = c/math.sqrt(c@S@c)
    E = 2*c@Hc@c+np.einsum('i,j,k,l,ijkl->', c, c, c, c, G)
    Jv = np.einsum('i,j,k,l,ijkl->', c, c, c, c, G)
    return dict(E=float(E), eps=float(ev[0]), J=float(Jv))
ref['heHF'] = {str(Z): he_roothaan(Z) for Z in (1, 2, 3, 4, 5)}
# --- J y K de la configuración 1s2s con orbitales hidrogenoides (SymPy, exactos) ---
r_, s_ = sp.symbols('r s', positive=True)
def JK(Z):
    R10 = 2*Z**sp.Rational(3, 2)*sp.exp(-Z*r_); R20 = (Z/sp.Integer(2))**sp.Rational(3, 2)*(2-Z*r_)*sp.exp(-Z*r_/2)
    def pot(rho):   # ∫ρ(r')r'² / max(r,r') dr'
        inner = sp.integrate((rho*r_**2).subs(r_, s_), (s_, 0, r_)); outer = sp.integrate((rho*r_).subs(r_, s_), (s_, r_, sp.oo))
        return inner/r_+outer
    Jv = sp.integrate(sp.simplify(R20**2*r_**2*pot(R10**2)), (r_, 0, sp.oo)); Kv = sp.integrate(sp.simplify(R10*R20*r_**2*pot(R10*R20)), (r_, 0, sp.oo))
    return float(Jv), float(Kv)
ref['JK'] = {str(Z): JK(sp.Integer(Z)) for Z in (1, 2, 3)}
# --- Términos fundamentales por enumeración de microestados de una subcapa l^n (Hund: S máximo, L máximo, J) ---
def hund_bruteforce(l, n):
    cap = 2*(2*l+1)
    if n in (0, cap): return (0.0, 0, 0.0)
    orbs = [(m, s) for m in range(-l, l+1) for s in (0.5, -0.5)]
    best = (-1, -1)
    for st in itertools.combinations(orbs, n):
        S = abs(sum(s for m, s in st)); L = abs(sum(m for m, s in st))
        # S total máxima = |M_S| máximo; entre las de S máximo, L máximo (M_L máximo con M_S máximo)
        if (S, L) > best: best = (S, L)
    S, L = best
    J = abs(L-S) if n < 2*l+1 else L+S
    if n == 2*l+1: J = S
    return (S, L, J)
ref['hund'] = {f'{l},{n}': hund_bruteforce(l, n) for l in (1, 2, 3) for n in range(0, 4*l+3)}
# --- Slater por tabla de grupos (implementación independiente) ---
LETTERS = 'spdfg'
def slater_py(Z, occ, nl):
    order = [(1, 's'), (2, 'sp'), (3, 'sp'), (3, 'd'), (4, 'sp'), (4, 'd'), (4, 'f'), (5, 'sp'), (5, 'd'), (5, 'f'), (6, 'sp'), (6, 'd'), (7, 'sp')]
    groups = {}
    for k, v in occ.items():
        n = int(k[0]); t = 'sp' if k[1] in 'sp' else k[1]
        groups[(n, t)] = groups.get((n, t), 0)+v
    n0 = int(nl[0]); t0 = 'sp' if nl[1] in 'sp' else nl[1]
    sh = 0.0
    for (n, t), cnt in groups.items():
        if (n, t) == (n0, t0):
            sh += (cnt-1)*(0.30 if (n0 == 1) else 0.35)
        elif t0 == 'sp':
            if n == n0-1: sh += 0.85*cnt
            elif n < n0-1: sh += 1.0*cnt
        else:
            if order.index((n, t)) < order.index((n0, t0)): sh += 1.0*cnt
    return Z-sh
# --- pymatgen / NIST ---
import warnings; warnings.filterwarnings('ignore')
from pymatgen.core import Element
def parse_cfg(s):
    occ = {}
    cores = {'[He]': 2, '[Ne]': 10, '[Ar]': 18, '[Kr]': 36, '[Xe]': 54}
    def mad(Zc):
        order = sorted([(n, l) for n in range(1, 8) for l in range(n)], key=lambda t: (t[0]+t[1], t[0])); left = Zc; out = {}
        for n, l in order:
            if left <= 0: break
            k = min(left, 2*(2*l+1)); out[f'{n}{LETTERS[l]}'] = k; left -= k
        return out
    for p in s.split('.'):
        if p in cores: occ.update(mad(cores[p]))
        else:
            m = re.match(r'(\d)([spdfg])(\d+)', p)
            if m: occ[m.group(1)+m.group(2)] = int(m.group(3))
    return occ
ref['cfg'] = {}; ref['ie'] = {}; ref['slater'] = {}
for Z in range(1, 55):
    el = Element.from_Z(Z); occ = parse_cfg(el.electronic_structure)
    ref['cfg'][str(Z)] = occ; ref['ie'][str(Z)] = float(el.ionization_energies[0])
    # electrón más externo: mayor n y, de entre ellos, el mayor l entre s,p (grupo sp)
    outer = max(occ, key=lambda k: (int(k[0]) if k[1] in 'sp' else int(k[0])-0.5, k[1] == 'p'))
    ref['slater'][str(Z)] = dict(nl=outer, z=slater_py(Z, occ, outer))
# términos fundamentales (NIST Atomic Spectra Database) — lista de literatura
ref['terms'] = {1: '2S1/2', 2: '1S0', 3: '2S1/2', 4: '1S0', 5: '2P1/2', 6: '3P0', 7: '4S3/2', 8: '3P2', 9: '2P3/2', 10: '1S0', 11: '2S1/2', 12: '1S0', 13: '2P1/2', 14: '3P0', 15: '4S3/2', 16: '3P2', 17: '2P3/2', 18: '1S0', 19: '2S1/2', 20: '1S0',
                21: '2D3/2', 22: '3F2', 23: '4F3/2', 24: '7S3', 25: '6S5/2', 26: '5D4', 27: '4F9/2', 28: '3F4', 29: '2S1/2', 30: '1S0', 31: '2P1/2', 32: '3P0', 33: '4S3/2', 34: '3P2', 35: '2P3/2', 36: '1S0',
                37: '2S1/2', 38: '1S0', 39: '2D3/2', 40: '3F2', 41: '6D1/2', 42: '7S3', 43: '6S5/2', 44: '5F5', 45: '4F9/2', 46: '1S0', 47: '2S1/2', 48: '1S0'}
# primer orden y variacional con las integrales de Slater (independiente de las fórmulas cerradas de la biblioteca)
ref['J1s'] = {str(Z): 16*Z**6*Jab(2*Z, 2*Z) for Z in (1, 2, 3, 4)}
def Evar_sto(Z, zeta):
    a = 2*zeta; T = 0.5*(1/a-2*zeta/a**2+2*zeta**2/a**3)*(a**3/2)*2     # 2 electrones, u normalizado: ∫u²=1 → u = sqrt(a³/2) r e^{−ζr}
    V = -Z/a**2*(a**3/2)*2; Vee = (a**3/2)**2*Jab(a, a)
    return T+V+Vee
ref['Evar'] = [dict(Z=Z, zeta=zt, E=Evar_sto(Z, zt)) for (Z, zt) in ((2, 1.0), (2, 1.6875), (2, 2.0), (3, 2.5), (4, 3.5))]
from scipy.optimize import minimize_scalar
ref['Evar_opt'] = {str(Z): [float(minimize_scalar(lambda z: Evar_sto(Z, z), bracket=(Z-1, Z-.3, Z)).x), float(minimize_scalar(lambda z: Evar_sto(Z, z), bracket=(Z-1, Z-.3, Z)).fun)] for Z in (2, 3, 4)}
