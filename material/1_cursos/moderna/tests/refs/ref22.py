# Cap. 22: núcleo — mínimos cuadrados de la fórmula de masas con NumPy (masas de periodictable), Woods–Saxon por scipy.linalg.eigh_tridiagonal, línea de estabilidad
import periodictable as _pt
from scipy.linalg import eigh_tridiagonal as _eigt
_uMeV = C.physical_constants['atomic mass constant energy equivalent in MeV'][0]
_mn = _pt.neutron.mass; _mH = _pt.elements[1][1].mass
def _B(Z, A, M): return (Z*_mH+(A-Z)*_mn-M)*_uMeV
_rows = []
for el in _pt.elements:
    if el.number < 1 or el.number > 92: continue
    for A in el.isotopes:
        iso = el[A]
        if iso.abundance and iso.abundance > 0: _rows.append((el.number, A, iso.mass))
def _feat(Z, A):
    pair = 0 if A % 2 else (-1 if Z % 2 else 1)
    return [A, -A**(2/3), -Z*(Z-1)/A**(1/3), -(A-2*Z)**2/A, pair/math.sqrt(A)]
_Xs = np.array([_feat(Z, A) for Z, A, M in _rows if A >= 20]); _y = np.array([_B(Z, A, M) for Z, A, M in _rows if A >= 20])
_coef, *_ = np.linalg.lstsq(_Xs, _y, rcond=None)
ref['semf'] = dict(coef=[float(x) for x in _coef], rms=float(np.sqrt(np.mean((_Xs@_coef-_y)**2))), n=int(len(_y)))
ref['bind'] = {f'{Z},{A}': _B(Z, A, _pt.elements[Z][A].mass) for (Z, A) in ((1, 2), (2, 4), (6, 12), (8, 16), (26, 56), (28, 62), (92, 238) if False else (82, 208), (20, 40))}
# Woods–Saxon: autovalores más bajos por canal (l, j)
def ws_channel(V0, R, a, lam, l, jj, k=3, h=0.025, Rmax=None):
    hb2m = 197.3269804**2/(2*938.918); Rmax = Rmax or R+12; Np = int(Rmax/h); r = h*np.arange(1, Np+1)
    ls = l/2 if jj == 1 else -(l+1)/2
    x = np.exp((r-R)/a); f = 1/(1+x); dfdr = -x/(a*(1+x)**2)
    d = 2*hb2m/h**2-V0*f+hb2m*l*(l+1)/r**2+lam*dfdr/r*ls; off = -hb2m/h**2*np.ones(Np-1)
    ev = _eigt(d, off, select='i', select_range=(0, k-1), eigvals_only=True); return [float(v) for v in ev]
_A = 208; _R = 1.27*_A**(1/3); _V0 = 51+33*(126-82)/208
ref['ws'] = dict(V0=_V0, R=_R, a=0.67, lam=45.0, ch={f'{l},{jj}': ws_channel(_V0, _R, 0.67, 45.0, l, jj) for (l, jj) in ((0, 1), (1, 1), (1, -1), (2, 1), (2, -1), (3, 1), (3, -1), (4, 1), (4, -1), (5, 1), (5, -1), (6, 1), (6, -1))})
# línea de estabilidad: Z más estable por A (mínimo de M) con los coeficientes de NumPy
def _zbest(A):
    best, e0 = 1, 1e99
    for Z in range(1, A):
        Bz = float(np.dot(_feat(Z, A), _coef)); en = Z*C.physical_constants['proton mass energy equivalent in MeV'][0]+(A-Z)*C.physical_constants['neutron mass energy equivalent in MeV'][0]+Z*0.51099895-Bz
        if en < e0: e0, best = en, Z
    return best
ref['zbest'] = {str(A): _zbest(A) for A in (16, 40, 56, 90, 120, 138, 208, 238)}
_stable = {}
for Z, A, M in _rows: _stable.setdefault(A, []).append(Z)
_n = 0; _ok = 0
for A, zs in _stable.items():
    if A < 20: continue
    _n += 1; zb = _zbest(A)
    if min(abs(zb-z) for z in zs) <= 1: _ok += 1
ref['zscore'] = dict(n=_n, ok=_ok)
