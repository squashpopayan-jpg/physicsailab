# Cap. 25: partículas — cinemática de dos cuerpos con fsolve, oscilaciones de neutrinos con expm, PMNS/CKM con NumPy, línea del Z con quad, PDG con `particle`
from scipy.optimize import fsolve as _fs3, brentq as _bq3
from scipy.linalg import expm as _expm3
from scipy.integrate import quad as _quad3
from particle import Particle as _P
def _p2(M, m1, m2):
    p = _fs3(lambda p: [math.sqrt(p[0]**2+m1**2)+math.sqrt(p[0]**2+m2**2)-M], [M/4])[0]; return float(abs(p))
_mmu = _P.from_pdgid(13).mass; _mpi = _P.from_pdgid(211).mass; _mK = _P.from_pdgid(321).mass
ref['p2'] = [dict(M=_mpi, m1=_mmu, m2=0.0, p=_p2(_mpi, _mmu, 0.0)), dict(M=_mK, m1=_mmu, m2=0.0, p=_p2(_mK, _mmu, 0.0)), dict(M=91187.6, m1=0.511, m2=0.511, p=_p2(91187.6, 0.511, 0.511)), dict(M=1115.683, m1=938.272, m2=139.570, p=_p2(1115.683, 938.272, 139.570)), dict(M=_P.from_pdgid(3334).mass, m1=_P.from_pdgid(3122).mass, m2=_mK, p=_p2(_P.from_pdgid(3334).mass, _P.from_pdgid(3122).mass, _mK))]
# oscilaciones de dos sabores: H en la base de sabor (unidades de GeV⁻¹ → km⁻¹ con ħc)
def _osc(theta, dm2, L, E):
    # H = (Δm²/4E)[[−cos2θ, sin2θ],[sin2θ, cos2θ]] ; fase = Δm²[eV²] L[km]/(4 E[GeV]) × 2.5338 (= 1/(ħc) conversions) 
    k = dm2/(4*E*1e9)*(L*1e3)/(C.hbar*C.c/C.e)   # Δm²[eV²]/(4E[eV]) × L[m]/(ħc[eV m])
    H = k*np.array([[-math.cos(2*theta), math.sin(2*theta)], [math.sin(2*theta), math.cos(2*theta)]])
    U = _expm3(-1j*H); psi = U@np.array([1, 0]); return float(abs(psi[1])**2)
ref['osc'] = [dict(th=th, dm2=dm2, L=L, E=E, P=_osc(th, dm2, L, E)) for (th, dm2, L, E) in ((math.pi/4, 2.5e-3, 295.0, 0.6), (math.pi/4, 2.5e-3, 500.0, 1.0), (0.5836, 7.5e-5, 180.0, 0.004), (0.15, 2.5e-3, 295.0, 0.6), (0.6, 7.4e-5, 53.0, 0.003))]
# unitariedad
def _mix(t12, t23, t13, dl):
    c12, s12, c23, s23, c13, s13 = math.cos(t12), math.sin(t12), math.cos(t23), math.sin(t23), math.cos(t13), math.sin(t13); e = np.exp(1j*dl)
    return np.array([[c12*c13, s12*c13, s13/e], [-s12*c23-c12*s23*s13*e, c12*c23-s12*s23*s13*e, s23*c13], [s12*s23-c12*c23*s13*e, -c12*s23-s12*c23*s13*e, c23*c13]])
_U = _mix(0.2265, 0.0412, 0.0036, 1.2); ref['ckm'] = dict(abs=np.abs(_U).tolist(), dev=float(np.abs(_U.conj().T@_U-np.eye(3)).max()))
# línea del Z: σ(√s) y área por quad
def _sig(rs, MZ, GZ, Gee, Ghad):
    s = rs*rs; return 12*math.pi*Gee*Ghad/MZ**2*s/((s-MZ**2)**2+s**2*GZ**2/MZ**2)*0.3893793721e6
ref['zline'] = []
for (GZ,) in ((2.4955,), (2.4955+0.1659,), (2.4955-0.1659,)):
    peak = max(_sig(x, 91.1876, GZ, 0.083985, 1.7444) for x in np.linspace(91.0, 91.4, 4001))
    # anchura total a media altura por brentq
    xp = float(np.linspace(91.0, 91.4, 4001)[np.argmax([_sig(x, 91.1876, GZ, 0.083985, 1.7444) for x in np.linspace(91.0, 91.4, 4001)])])
    lo = _bq3(lambda x: _sig(x, 91.1876, GZ, 0.083985, 1.7444)-peak/2, 85, xp); hi = _bq3(lambda x: _sig(x, 91.1876, GZ, 0.083985, 1.7444)-peak/2, xp, 100)
    ref['zline'].append(dict(GZ=GZ, peak=float(peak), fwhm=float(hi-lo)))
# GMO desde la tabla PDG
_m = lambda i: _P.from_pdgid(i).mass
ref['gmo'] = dict(left=((_m(2212)+_m(2112))/2+(_m(3322)+_m(3312))/2)/2, right=(3*_m(3122)+(_m(3222)+_m(3212)+_m(3112))/3)/4, omega=_m(3334))
# carga y número bariónico de los hadrones según PDG (paquete)
ref['pdgq'] = {str(i): int(round(float(_P.from_pdgid(i).charge)*3)) for i in (2212, 2112, 3122, 3222, 3112, 3312, 3322, 3334, 211, 321, 2224, 1114, 3224, 3314)}
