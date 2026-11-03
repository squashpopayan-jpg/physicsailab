# Cap. 27: estrellas — Lane–Emden, enanas blancas (Chandrasekhar) y estrellas de neutrones (OV) con scipy.integrate.solve_ivp (DOP853), constantes de astropy
import astropy.constants as _ac
from scipy.integrate import solve_ivp as _iv6
from scipy.optimize import minimize_scalar as _ms6
def _le(n):
    f = lambda x, y: [y[1], -max(y[0], 0)**n-2*y[1]/x]
    ev = lambda x, y: y[0]; ev.terminal = True; ev.direction = -1
    x0 = 1e-6; s = _iv6(f, (x0, 50), [1-x0**2/6, -x0/3], method='DOP853', rtol=1e-12, atol=1e-14, events=ev)
    x1 = float(s.t_events[0][0]); d1 = float(s.y_events[0][0][1]); return dict(n=n, xi1=x1, mass=-x1**2*d1, rho=x1/(3*-d1))
ref['le'] = [_le(n) for n in (0, 1, 1.5, 3, 3.5)]
_G = float(_ac.G.value); _Ms = float(_ac.M_sun.value); _Rs = float(_ac.R_sun.value)
_h = C.h; _me = C.m_e; _c = C.c; _u = C.atomic_mass; _hb = C.hbar
def _wd(xc, mue=2.0, xs=2e-3):
    Pk = math.pi*_me**4*_c**5/(3*_h**3)
    rho = lambda x: mue*_u*(8*math.pi/3)*(_me*_c/_h)**3*x**3; dPdx = lambda x: Pk*8*x**4/math.sqrt(x*x+1)
    def f(r, y): x, m = y; return [-_G*m*rho(x)/(r*r*dPdx(x)), 4*math.pi*r*r*rho(x)]
    ev = lambda r, y: y[0]-xs; ev.terminal = True; ev.direction = -1
    r0 = 1.0; s = _iv6(f, (r0, 1e8), [xc, 4/3*math.pi*r0**3*rho(xc)], method='DOP853', rtol=1e-11, atol=[1e-14, 1e10], events=ev)
    return dict(xc=xc, R=float(s.t_events[0][0]), M=float(s.y_events[0][0][1]))
ref['wd'] = [_wd(x) for x in (0.5, 1.0, 2.0, 5.0, 10.0)]
_mn = 1.67492749804e-27
def _ns(xc, xs=1e-3):
    A = _mn**4*_c**5/(8*math.pi**2*_hb**3); c2 = _c**2
    eps = lambda x: A*(x*(2*x*x+1)*math.sqrt(1+x*x)-math.asinh(x)); P = lambda x: A/3*(x*(2*x*x-3)*math.sqrt(1+x*x)+3*math.asinh(x)); dPdx = lambda x: A/3*8*x**4/math.sqrt(1+x*x)
    def f(r, y):
        x, m = y; e_ = eps(x); p = P(x)
        return [-(_G*(e_+p)/c2*(m+4*math.pi*r**3*p/c2))/(r*r*(1-2*_G*m/(r*c2))*dPdx(x)), 4*math.pi*r*r*e_/c2]
    ev = lambda r, y: y[0]-xs; ev.terminal = True; ev.direction = -1
    r0 = 1.0; s = _iv6(f, (r0, 1e5), [xc, 4/3*math.pi*r0**3*eps(xc)/c2], method='DOP853', rtol=1e-11, atol=[1e-14, 1e10], events=ev)
    return dict(xc=xc, R=float(s.t_events[0][0]), M=float(s.y_events[0][0][1]))
ref['ns'] = [_ns(x) for x in (0.4, 0.6, 0.8, 1.0, 1.4)]
_mm = _ms6(lambda x: -_ns(x)['M'], bounds=(0.8, 2.5), method='bounded', options=dict(xatol=1e-4)); ref['nsmax'] = dict(x=float(_mm.x), M=float(-_mm.fun), R=_ns(float(_mm.x))['R'])
ref['astro'] = dict(G=_G, Msun=_Ms, Rsun=_Rs, Lsun=float(_ac.L_sun.value), sigT=float(_ac.sigma_T.value), mp=float(_ac.m_p.value), c=float(_ac.c.value))
