# Cap. 8: fotones — Compton, Klein–Nishina, rayos X, pares
import xraydb
h, c, e, me = C.h, C.c, C.e, C.m_e
def compton_KE_eV(lam, th):
    lp = lam + h/(me*c)*(1-np.cos(th)); return h*c/e*(1/lam - 1/lp)
ref['compton_KE'] = {f'{l}_{t}': compton_KE_eV(l, math.radians(t)) for l in (71.07e-12, 1.2398e-9, 1.2398e-12) for t in (30, 90, 180)}
ref['compton_lambda'] = C.value('Compton wavelength')
ref['thomson'] = C.physical_constants['Thomson cross section'][0]
ref['re'] = C.physical_constants['classical electron radius'][0]
ref['mc2keV'] = me*c*c/e/1e3
# Klein–Nishina: integración numérica de la sección diferencial (scipy.quad)
re = ref['re']
def kn_diff(eps, th):
    r = 1/(1+eps*(1-math.cos(th))); return 0.5*re*re*r*r*(r+1/r-math.sin(th)**2)
def kn_total_num(eps):
    val, _ = integrate.quad(lambda th: 2*math.pi*math.sin(th)*kn_diff(eps, th), 0, math.pi, epsabs=0, epsrel=1e-13, limit=200); return val
ref['kn_total'] = {str(E): kn_total_num(E/ref['mc2keV']) for E in (1.0, 10.0, 100.0, 511.0, 661.657, 1000.0, 10000.0)}
ref['kn_diff'] = [dict(E=E, th=th, d=kn_diff(E/ref['mc2keV'], th)) for E in (10.0, 511.0, 5000.0) for th in (0.0, 0.7, math.pi/2, 2.5, math.pi)]
# Coeficientes másicos de atenuación Compton frente a xraydb (incoherente, Elam et al.)
ref['mass_att'] = []
for el, ZA, E in (('H', 1.00794 and 1/1.00794, 100e3), ('C', 6/12.0107, 662e3), ('C', 6/12.0107, 1000e3), ('Al', 13/26.9815, 662e3), ('Pb', 82/207.2, 2000e3)):
    ref['mass_att'].append(dict(el=el, ZA=ZA, E=E, mu=float(xraydb.mu_elam(el, E, kind='incoh')) if E <= 8e5 else None))
# Borde Compton por maximización numérica de la energía del electrón sobre el ángulo
def compton_edge_num(E):
    k = E/ref['mc2keV']
    f = lambda th: -(E - E/(1+k*(1-math.cos(th))))
    r = optimize.minimize_scalar(f, bounds=(0, math.pi), method='bounded', options=dict(xatol=1e-12)); return -r.fun, E/(1+k*(1-math.cos(r.x)))
ref['edge'] = [dict(E=E, T=compton_edge_num(E)[0], Eb=compton_edge_num(E)[1]) for E in (661.657, 1173.2, 1332.5, 100.0)]
# Duane–Hunt y Kramers
ref['hc_keVnm'] = h*c/e*1e9/1e3*1e3  # keV·nm
ref['kramers_peak'] = []
for V in (20e3, 35e3, 100e3):
    lmin = h*c/(e*V)
    f = lambda l: -(l/lmin-1)/l**2
    r = optimize.minimize_scalar(f, bounds=(lmin*1.0001, lmin*10), method='bounded', options=dict(xatol=1e-18))
    ref['kramers_peak'].append(dict(V=V, lmin=lmin, peak_ratio=float(r.x/lmin)))
# Líneas K y bordes tabulados (xraydb) frente a Moseley
ref['xray'] = {s: dict(Z=z, Ka=xraydb.xray_line(s, 'Ka1').energy, Kb=xraydb.xray_line(s, 'Kb1').energy, edge=xraydb.xray_edge(s, 'K').energy) for s, z in (('Cr', 24), ('Fe', 26), ('Cu', 29), ('Mo', 42), ('Ag', 47), ('W', 74))}
ref['xray_all_Z'] = [dict(s=s, Z=z, Ka=xraydb.xray_line(s, 'Ka1').energy) for s, z in (('Mg', 12), ('Ca', 20), ('Ti', 22), ('Co', 27), ('Zn', 30), ('Sn', 50), ('Au', 79))]
# Umbral de pares en el campo de un núcleo (masa M): √s = M + 2m con s = M² + 2EM
def pair_threshold(M):
    return optimize.brentq(lambda E: math.sqrt(M*M+2*E*M)-(M+2*me*c*c/e/1e3), 0, 1e6, xtol=1e-12, rtol=1e-14)
mp_keV = C.physical_constants['proton mass energy equivalent in MeV'][0]*1e3
ref['pair'] = dict(proton=pair_threshold(mp_keV), electron=pair_threshold(ref['mc2keV'])) if False else dict(
    proton=optimize.brentq(lambda E: math.sqrt(mp_keV**2+2*E*mp_keV)-(mp_keV+2*ref['mc2keV']), 0, 1e6, xtol=1e-12, rtol=1e-14),
    electron=optimize.brentq(lambda E: math.sqrt(ref['mc2keV']**2+2*E*ref['mc2keV'])-(ref['mc2keV']+2*ref['mc2keV']), 0, 1e6, xtol=1e-12, rtol=1e-14))
ref['Millikan'] = C.physical_constants['Planck constant in eV/Hz'][0]
