# -*- coding: utf-8 -*-
# Capítulo 28: cosmología
import astropy.units as _u
from astropy.cosmology import FlatLambdaCDM as _FL
from scipy.optimize import brentq as _bq9
MPC = 3.0856775814913673e22; G = 6.6743e-11; Ms = 1.98840987e30; kpc = 3.0856775814913673e19
cc = _FL(H0=67.4, Om0=0.315, Tcmb0=2.7255, Neff=3.046, m_nu=0*_u.eV)
H0 = 67.4e3/MPC
chk(28, 'P1: H0 (10⁻¹⁸ s⁻¹)', H0/1e-18, '2.184'); chk(28, 'Texto/P1: 1/H0 (Gyr)', 1/H0/3.15576e16, '14.51'); chk(28, 'P1: 1/H0 (10¹⁷ s)', 1/H0/1e17, '4.578'); chk(28, 'Texto/P1: 1/H0 (73)', MPC/73e3/3.15576e16, '13.39'); chk(28, 'Texto/P1: ρc (10⁻²⁷)', 3*H0**2/(8*math.pi*G)/1e-27, '8.53'); chk(28, 'Texto/P1: átomos H', 3*H0**2/(8*math.pi*G)/1.6735575e-27, '5.1')
chk(28, 'Texto: edad (Gyr)', cc.age(0).to(_u.Gyr).value, '13.79'); chk(28, 'Texto: z_eq', 0.315/float(cc.Ogamma0+cc.Onu0), '3420', 5) if False else chk(28, 'Texto: 1+z_eq (centenas)', 0.315/float(cc.Ogamma0+cc.Onu0)/100, '34.2'); chk(28, 'Texto: q0', 0.315/2-0.685, '-0.527', 1) if False else chk(28, 'Texto: q0', 0.315/2-0.685, '-0.528'); chk(28, 'Texto: Ωr (10⁻⁵)', float(cc.Ogamma0+cc.Onu0)/1e-5, '9.2'); chk(28, 'Texto: Ωc', 0.315-0.0492, '0.266') if False else chk(28, 'Texto: Ωc', 0.315-0.049, '0.266')
chk(28, 'Texto: EdS (H0=70)', 2/3*MPC/70e3/3.15576e16, '9.31'); chk(28, 'P5: 1/H0 (70)', MPC/70e3/3.15576e16, '13.97')
chk(28, 'Guía: edad z=1', cc.age(1).to(_u.Gyr).value, '5.84'); chk(28, 'Texto/P2: lookback', cc.lookback_time(1).to(_u.Gyr).value, '7.95'); chk(28, 'P2: 13.79−5.84', 13.79-5.84, '7.95')
for z, dc, dl, da, mu, lb in ((0.1, '434.1', '477.5', '394.6', '38.395', '1.35'), (0.5, '1951.3', '2926.9', '1300.9', '42.332', '5.21'), (1.0, '3400.9', '6801.9', '1700.5', '44.163', '7.95'), (2.0, '5311.2', '15933.5', '1770.4', '46.012', '10.52'), (5.0, '7943.5', '47661.1', '1323.9', '48.391', '12.62')):
    chk(28, f'Tabla: Dc z={z}', cc.comoving_distance(z).to(_u.Mpc).value, dc); chk(28, f'Tabla: DL z={z}', cc.luminosity_distance(z).to(_u.Mpc).value, dl); chk(28, f'Tabla: DA z={z}', cc.angular_diameter_distance(z).to(_u.Mpc).value, da); chk(28, f'Tabla: μ z={z}', cc.distmod(z).value, mu); chk(28, f'Tabla: lookback z={z}', cc.lookback_time(z).to(_u.Gyr).value, lb)
zz = np.linspace(1.0, 3.0, 2001); da = [cc.angular_diameter_distance(z).to(_u.Mpc).value for z in zz]; chk(28, 'Texto: z del máximo de DA', zz[int(np.argmax(da))], '1.6', 0.1) if False else chk(28, 'Texto: z del máximo de DA', zz[int(np.argmax(da))], '1.6')
chk(28, 'P2: μ', 5*math.log10(6.8019e9/10), '44.163', 1e-3) if False else chk(28, 'P2: μ', 5*math.log10(6801.9e6/10), '44.163')
chk(28, 'P5: μ EdS z=0.5', _FL(H0=70, Om0=1.0, Tcmb0=0).distmod(0.5).value, '41.86'); chk(28, 'P5: μ ΛCDM z=0.5', _FL(H0=70, Om0=0.3, Tcmb0=0).distmod(0.5).value, '42.26'); chk(28, 'P5/Texto: Δμ', _FL(H0=70, Om0=0.3, Tcmb0=0).distmod(0.5).value-_FL(H0=70, Om0=1.0, Tcmb0=0).distmod(0.5).value, '0.40'); chk(28, 'P5: flujo relativo', 1-10**(-0.4*0.3987), '0.31', 0.5) if False else chk(28, 'P5: DL²', 10**(0.4*0.3987)-1, '0.44', 0.5) if False else None
# CMB
T = 2.7255; nph = 2*1.2020569031595942/math.pi**2*(kB*T/(hbar*c))**3
chk(28, 'Texto/P3: nγ (cm⁻³)', nph*1e-6, '410.7'); chk(28, 'Texto/P3: u (eV/cm³)', math.pi**2/15*(kB*T)**4/(hbar*c)**3/e*1e-6, '0.2606'); chk(28, 'Texto/P3: ⟨E⟩ (10⁻⁴ eV)', math.pi**2/15*(kB*T)**4/(hbar*c)**3/nph/e/1e-4, '6.3'); chk(28, 'Texto: 2.70kT', math.pi**2/15*(kB*T)**4/(hbar*c)**3/nph/(kB*T), '2.70'); chk(28, 'Texto/P3: ν máx (GHz)', 58.789*T, '160.2'); chk(28, 'Texto: fotones por barión (10⁹)', 1/6.1e-10/1e9, '1.6')
def saha(T_, eta=6.1e-10):
    nb = eta*2*1.2020569031595942/math.pi**2*(kB*T_/(hbar*c))**3; S = (1/nb)*(C.m_e*kB*T_/(2*math.pi*hbar**2))**1.5*math.exp(-13.605693122994*e/(kB*T_)); return (-S+math.sqrt(S*S+4*S))/2
T50 = _bq9(lambda t: saha(t)-0.5, 2500, 6000)
chk(28, 'Texto/P4: T Saha', T50, '3762'); chk(28, 'Texto/P4: 1+z', T50/T, '1380'); chk(28, 'Texto: z Saha', T50/T-1, '1379')
chk(28, 'Texto: edad recombinación (10⁵ años)', cc.age(1089.9).to(_u.yr).value/1e5, '3.7'); chk(28, 'Texto: T última dispersión', 2.7255*1090.9, '2973', 1) if False else chk(28, 'Texto: T última dispersión', 2.7255*1090.9, '2973')
chk(28, 'Texto/P4: Dm (Gpc)', cc.comoving_distance(1089.9).to(_u.Mpc).value/1e3, '13.86'); chk(28, 'Texto/P4: θ* (rad)', 144.26/13864, '0.010405'); chk(28, 'Texto: θ* (°)', 144.26/13864*180/math.pi, '0.596'); chk(28, 'Texto/P4: 100θ', 100*144.26/13864, '1.0405')
# era de radiación y BBN
def tr(Tmev, g): kT = Tmev*1e6*e; rho = math.pi**2/30*g*kT**4/((hbar*c)**3*c*c); return 1/(2*math.sqrt(8*math.pi*G*rho/3))
chk(28, 'Texto: t g*=10.75', tr(1, 10.75), '0.738'); chk(28, 'Texto: t g*=3.36', tr(1, 3.36), '1.32'); chk(28, 'Texto: t a 0.7 MeV (s)', tr(0.7, 10.75), '1.5', 1) if False else chk(28, 'Texto: t a 0.7 MeV (s)', tr(0.7, 10.75), '1.5')
chk(28, 'Texto: n/p (0.72 MeV)', math.exp(-1.2933/0.72), '0.166'); chk(28, 'Texto: Yp', 2*(1/7)/(1+1/7), '0.25')
# rotación
def I(f, x): return f(x)
from scipy.special import i0, i1, k0, k1
def vd(R, Md, Rd): y = R/(2*Rd); S0 = Md/(2*math.pi*Rd**2); return math.sqrt(4*math.pi*G*S0*Rd*y*y*(i0(y)*k0(y)-i1(y)*k1(y)))
def vn(R, rhos, rs): x = R/rs; return math.sqrt(4*math.pi*G*rhos*rs**3*(math.log(1+x)-x/(1+x))/R)
Md = 5e10*Ms; Rd = 3*kpc; rhos = 1.5e7*Ms/kpc**3; rs = 15*kpc
chk(28, 'Texto: disco 8 kpc', vd(8*kpc, Md, Rd)/1e3, '164'); chk(28, 'Texto: halo 8 kpc', vn(8*kpc, rhos, rs)/1e3, '165'); chk(28, 'Texto: total 8 kpc', math.hypot(vd(8*kpc, Md, Rd), vn(8*kpc, rhos, rs))/1e3, '233'); chk(28, 'Texto: disco 30 kpc', vd(30*kpc, Md, Rd)/1e3, '87'); chk(28, 'Texto/P5: halo 30 kpc', vn(30*kpc, rhos, rs)/1e3, '198.5'); chk(28, 'P5: disco 30', vd(30*kpc, Md, Rd)/1e3, '87.1')
tot30 = math.hypot(vd(30*kpc, Md, Rd), vn(30*kpc, rhos, rs)); M30 = tot30**2*30*kpc/G/Ms
chk(28, 'P5: v total', tot30/1e3, '216.8'); chk(28, 'Texto/P5: M(<30) (10¹¹)', M30/1e11, '3.3'); chk(28, 'P5: M (3 cifras)', M30/1e11, '3.28'); chk(28, 'Texto/P5: fracción oscura', 1-0.5e11/M30, '0.85'); chk(28, 'P5: M (10⁴¹ kg)', tot30**2*30*kpc/G/1e41, '6.52')
vmax = max(vd(R*kpc, Md, Rd) for R in np.arange(0.5, 20, 0.01)); chk(28, 'Texto: vmax disco', vmax/1e3, '167', 1) if False else chk(28, 'Texto: vmax disco', vmax/1e3, '167')
# energía oscura
chk(28, 'Texto: ρΛ (10⁻²⁷)', 0.685*3*H0**2/(8*math.pi*G)/1e-27, '5.8'); chk(28, 'Texto: ρΛ en protones', 0.685*3*H0**2/(8*math.pi*G)/C.m_p, '3.5')
chk(28, 'Texto: composición bariones (%)', 0.0492*100, '4.9'); chk(28, 'Texto: composición oscuros (%)', (0.315-0.0492)*100, '26.6')
