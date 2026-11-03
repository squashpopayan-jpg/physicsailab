# Cap. 28: cosmología — astropy.cosmology (distancias, edad, densidad crítica), Saha por brentq, horizonte sonoro por quad, Bessel de SciPy, constantes de astropy
import astropy.units as _u
from astropy.cosmology import FlatLambdaCDM as _FL, LambdaCDM as _LC
from scipy.special import i0 as _i0, i1 as _i1, k0 as _k0, k1 as _k1
from scipy.integrate import quad as _q8
from scipy.optimize import brentq as _bq8
_c0 = _FL(H0=67.4, Om0=0.315, Tcmb0=0); _c1 = _FL(H0=67.4, Om0=0.315, Tcmb0=2.7255, Neff=3.046, m_nu=0*_u.eV)
_c2 = _LC(H0=70.0, Om0=0.3, Ode0=0.8, Tcmb0=0); _c3 = _FL(H0=70.0, Om0=1.0, Tcmb0=0)
_zs = (0.1, 0.5, 1.0, 2.0, 5.0)
def _row(cc, name):
    return dict(name=name, age=float(cc.age(0).to(_u.Gyr).value), age_z1=float(cc.age(1).to(_u.Gyr).value), lb=[float(cc.lookback_time(z).to(_u.Gyr).value) for z in _zs], dc=[float(cc.comoving_distance(z).to(_u.Mpc).value) for z in _zs], dl=[float(cc.luminosity_distance(z).to(_u.Mpc).value) for z in _zs], da=[float(cc.angular_diameter_distance(z).to(_u.Mpc).value) for z in _zs], mu=[float(cc.distmod(z).value) for z in _zs], rhoc=float(cc.critical_density0.to(_u.kg/_u.m**3).value), Dm_star=float(cc.comoving_distance(1089.9).to(_u.Mpc).value))
ref['cos'] = dict(zs=list(_zs), flat0=_row(_c0, 'plana sin radiación'), flat1=_row(_c1, 'plana con radiación'), open=_row(_c2, 'abierto-Λ (Ωk ≠ 0)'), eds=_row(_c3, 'Einstein–de Sitter'))
ref['cos']['Or'] = float(_c1.Ogamma0+_c1.Onu0)
# Saha por brentq con scipy.constants
def _saha_x(T, eta=6.1e-10):
    nph = 2*1.2020569031595942/math.pi**2*(C.k*T/(C.hbar*C.c))**3; nb = eta*nph
    S = (1/nb)*(C.m_e*C.k*T/(2*math.pi*C.hbar**2))**1.5*math.exp(-13.605693122994*C.e/(C.k*T)); return S
_f = lambda T: (lambda S: (-S+math.sqrt(S*S+4*S))/2)(_saha_x(T))
ref['saha'] = dict(T50=_bq8(lambda T: _f(T)-0.5, 2500, 6000), x=[(T, _f(T)) for T in (3000, 3500, 4000, 4500)])
# horizonte sonoro por quad
def _rs(H0, Om, zstar, ob_h2=0.02237):
    h = H0/100; Og = 2.4729753287e-5/h**2; Ob = ob_h2/h**2; Or = Og*(1+0.22710731766*3.046); OL = 1-Om-Or
    E = lambda z: math.sqrt(Or*(1+z)**4+Om*(1+z)**3+OL); cs = lambda z: C.c/1e3/math.sqrt(3*(1+3*Ob/(4*Og)/(1+z)))
    return _q8(lambda z: cs(z)/(H0*E(z)), zstar, 1e9, epsabs=0, epsrel=1e-10, limit=500)[0]
_cc = _FL(H0=67.4, Om0=0.315, Tcmb0=2.7255, Neff=3.046, m_nu=0*_u.eV)
ref['rs'] = dict(rs=_rs(67.4, 0.315, 1089.9), Dm=float(_cc.comoving_distance(1089.9).to(_u.Mpc).value))
# Bessel y velocidad del disco por SciPy
_G = 6.6743e-11; _Ms = 1.98840987e30; _kpc = 3.0856775814913673e19
def _vd(R, Md, Rd):
    y = R/(2*Rd); S0 = Md/(2*math.pi*Rd**2); return math.sqrt(4*math.pi*_G*S0*Rd*y*y*(_i0(y)*_k0(y)-_i1(y)*_k1(y)))
ref['bessel'] = [dict(x=x, I0=float(_i0(x)), I1=float(_i1(x)), K0=float(_k0(x)), K1=float(_k1(x))) for x in (0.1, 0.5, 1.0, 1.9, 2.1, 3.0, 5.0)]
ref['disk'] = [dict(R=R, Md=5e10*_Ms, Rd=3*_kpc, v=_vd(R*_kpc, 5e10*_Ms, 3*_kpc)) for R in (2, 5, 8, 15)]
