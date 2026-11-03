# Cap. 7: radiación térmica
h, c, kB = C.h, C.c, C.k
def planck_nu(nu, T): return 2*h*nu**3/c**2/np.expm1(h*nu/(kB*T))
ref['planck_lambda'] = {f'{l}_{T}': 2*h*c**2/l**5/np.expm1(h*c/(l*kB*T)) for l in (1e-7, 4e-7, 5e-7, 1e-6, 1e-5) for T in (300, 2000, 5772)}
ref['planck_nu'] = {f'{n}_{T}': planck_nu(n, T) for n in (1e10, 1e11, 1.6e11, 5e14, 1e15) for T in (2.7255, 300, 5772)}
ref['sigma'] = C.Stefan_Boltzmann; ref['wien_b'] = C.Wien
ref['wien_nu_const'] = C.physical_constants['Wien frequency displacement law constant'][0]
ref['wien_nu_x'] = float(optimize.brentq(lambda x: x-3*(1-np.exp(-x)), 1, 5, xtol=1e-15))
ref['wien_x'] = float(optimize.brentq(lambda x: x-5*(1-np.exp(-x)), 1, 10, xtol=1e-15))
mp.mp.dps = 30
ref['zeta3'] = float(mp.zeta(3))
# integrales del gas de fotones con mpmath
ref['int_x3'] = float(mp.quad(lambda x: x**3/(mp.e**x-1), [0, mp.inf]))        # π⁴/15
ref['int_x2'] = float(mp.quad(lambda x: x**2/(mp.e**x-1), [0, mp.inf]))        # 2ζ(3)
ref['n_photon_cm3'] = float(16*mp.pi*mp.zeta(3)*(mp.mpf(kB)*mp.mpf('2.7255')/(mp.mpf(h)*mp.mpf(c)))**3/1e6)
# densidad de energía por integración numérica de u_ν (scipy.quad) = a T⁴
def u_int(T):
    f = lambda nu: 4*np.pi*planck_nu(nu, T)/c
    val, _ = integrate.quad(f, 0, 60*kB*T/h, epsabs=0, epsrel=1e-12, limit=400)
    return val
ref['u_int'] = {str(T): u_int(T) for T in (2.7255, 300, 5772)}
ref['a_rad'] = 4*C.Stefan_Boltzmann/c
# número de fotones por integración numérica
def n_int(T):
    f = lambda nu: 4*np.pi*planck_nu(nu, T)/(c*h*nu)
    val, _ = integrate.quad(f, 0, 60*kB*T/h, epsabs=0, epsrel=1e-12, limit=400); return val
ref['n_int'] = {str(T): n_int(T) for T in (2.7255, 300, 5772)}
# color: cromaticidad xy del cuerpo negro con colour-science (CIE 1931 2°)
import colour
_sh = colour.SpectralShape(360, 830, 1); _cm = colour.MSDS_CMFS['CIE 1931 2 Degree Standard Observer'].copy().align(_sh)
def xy_bb(T):
    sd = colour.sd_blackbody(T, _sh); XYZ = colour.sd_to_XYZ(sd, _cm); return [float(v) for v in colour.XYZ_to_xy(XYZ)]
ref['xy_bb'] = {str(T): xy_bb(T) for T in (2500, 3000, 4000, 5772, 6500, 10000, 15000)}
# estrella: L = 4πR²σT⁴ con valores nominales IAU 2015
ref['L_sun_nominal'] = 3.828e26; ref['Tsun'] = 5772.0; ref['Rsun'] = 6.957e8
