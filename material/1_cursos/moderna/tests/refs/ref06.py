# Cap. 6: relatividad general con referencias independientes (ODE de geodésicas con DOP853, mpmath, astropy)
import astropy.constants as _ac, astropy.units as _u
ref['astropy_const'] = dict(G=float(_ac.G.value), GMsun=float(_ac.GM_sun.value), Rsun=float(_ac.R_sun.value), GMearth=float(_ac.GM_earth.value), AU=float(_ac.au.value), pc=float(_ac.pc.value), Msun=float(_ac.M_sun.value),
                            hbar=float(_ac.hbar.value), kB=float(_ac.k_B.value), c=float(_ac.c.value))
# --- GPS: tasas exactas con la métrica de Schwarzschild (mpmath, 40 dígitos) frente a la aproximación lineal ---
mp.mp.dps = 40
GM_E = mp.mpf('3.986004418e14'); c_ = mp.mpf(299792458); W0 = mp.mpf('62636856.0')
def gps_exact(a):
    a = mp.mpf(a); rs = 2*GM_E/c_**2
    Om2 = GM_E/a**3
    rate_sat = mp.sqrt(1 - rs/a - a**2*Om2/c_**2)         # dτ/dt de un reloj en órbita circular (exacto en Schwarzschild)
    rate_ground = mp.sqrt(1 - 2*W0/c_**2)                  # reloj en el geoide (potencial W0 incluye la rotación)
    return float(rate_sat/rate_ground - 1)
ref['gps'] = [dict(a=a, rate=gps_exact(a)) for a in (26561750.0, 42164000.0, 6778000.0, 20000000.0)]
# --- Deflexión de la luz: integración de u'' = −u + 3u² (m = 1), u(0) = 0, u'(0) = 1/B, hasta que u vuelve a 0 ---
def deflection_ode(B):
    f = lambda phi, y: [y[1], -y[0] + 3*y[0]**2]
    ev = lambda phi, y: y[0]
    ev.terminal = True; ev.direction = -1
    sol = integrate.solve_ivp(f, [0, 4*math.pi], [0.0, 1.0/B], method='DOP853', rtol=1e-13, atol=1e-16, events=ev, first_step=1e-6, dense_output=False)
    phi_end = sol.t_events[0][0]
    return phi_end - math.pi
ref['deflection'] = [dict(B=B, alpha=deflection_ode(B)) for B in (6.0, 8.0, 10.0, 30.0, 100.0)]
# --- Precesión por integración de u'' + u = 1/ℓ² + 3u² entre apoastros sucesivos ---
def precession_ode(rp, ra):
    u1, u2 = 1/rp, 1/ra; u3 = 0.5-u1-u2; l2 = 1/(u1*u2+u3*(u1+u2))
    f = lambda phi, y: [y[1], -y[0] + 1/l2 + 3*y[0]**2]
    ev = lambda phi, y: y[1]
    ev.terminal = False; ev.direction = 1                         # du/dφ pasa de − a +: apoastro (u mínimo)
    sol = integrate.solve_ivp(f, [1e-9, 3*2*math.pi*1.5], [u2, 1e-30], method='DOP853', rtol=1e-13, atol=1e-16, events=ev, first_step=1e-5)
    te = [t for t in sol.t_events[0] if t > 1.0]
    return te[0]
ref['precession'] = [dict(rp=rp, ra=ra, dphi=precession_ode(rp, ra)) for (rp, ra) in ((10.0, 40.0), (8.0, 20.0), (20.0, 60.0), (7.0, 30.0))]
# --- Coalescencia (Peters): integración de da/dt ---
_G = 6.67430e-11; _c = 299792458.0; _Ms = 1.3271244e20/_G
def coalescence_ode(a0, m1, m2, a_end_frac=1e-3):
    k = (64/5)*_G**3*m1*m2*(m1+m2)/_c**5
    f = lambda t, y: [-k/y[0]**3]
    ev = lambda t, y: y[0]-a0*a_end_frac
    ev.terminal = True
    sol = integrate.solve_ivp(f, [0, 1e20], [a0], method='DOP853', rtol=1e-13, atol=1e-30, events=ev)
    return float(sol.t_events[0][0]), a0*a_end_frac, k
ref['coal'] = []
for (a0, m1, m2) in ((1e9, 36*_Ms, 29*_Ms), (3e8, 1.4*_Ms, 1.4*_Ms), (1e10, 10*_Ms, 10*_Ms)):
    t, a1, k = coalescence_ode(a0, m1, m2)
    ref['coal'].append(dict(a0=a0, m1=m1, m2=m2, a1=a1, t=t))
# --- Constantes con unidades de astropy: Hawking, sombra de M87* ---
Mb = 1.0*_ac.M_sun
ref['hawking'] = dict(T=float((_ac.hbar*_ac.c**3/(8*math.pi*_ac.G*Mb*_ac.k_B)).to(_u.K).value), tev=float((5120*math.pi*_ac.G**2*Mb**3/(_ac.hbar*_ac.c**4)).to(_u.yr).value))
M87 = 6.5e9*_ac.M_sun; D87 = (16.8*_u.Mpc)
ref['shadow'] = float(((2*math.sqrt(27)*_ac.G*M87/(_ac.c**2*D87.to(_u.m))).decompose().value*_u.rad).to(_u.uas).value)
# --- Mercurio: parámetros orbitales (JPL) ---
ref['mercury'] = dict(a=0.38709927*_ac.au.value, e=0.20563593, P=87.9691)
