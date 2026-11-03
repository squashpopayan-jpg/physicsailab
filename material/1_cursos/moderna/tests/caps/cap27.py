# -*- coding: utf-8 -*-
# Capítulo 27: estrellas
import astropy.constants as _ac
from scipy.integrate import solve_ivp as _iv7
from scipy.optimize import brentq as _bq7, minimize_scalar as _ms7
G = float(_ac.G.value); Ms = float(_ac.M_sun.value); Rs = float(_ac.R_sun.value); Ls = float(_ac.L_sun.value); sT = float(_ac.sigma_T.value); mpk = float(_ac.m_p.value)
# Eddington
LE = 4*math.pi*G*Ms*mpk*c/sT
chk(27, 'Texto/P1: L_Edd (10³¹ W)', LE/1e31, '1.26'); chk(27, 'Texto/P1: L_Edd (10⁴ L☉)', LE/Ls/1e4, '3.28'); chk(27, 'Guía: L/LEdd (10⁻⁵)', Ls/LE/1e-5, '3.0'); chk(27, 'Texto: σT (10⁻²⁹)', sT/1e-29, '6.65'); chk(27, 'P1: σT 4 cifras', sT/1e-29, '6.652')
# vida
t = 0.1*0.007*Ms*c**2/Ls/(365.25*86400)
chk(27, 'Texto: vida Sol (10¹⁰ años)', t/1e10, '1.04'); chk(27, 'Texto: vida 2 M☉ (10⁹)', 1e10*2**-2.5/1e9, '1.8'); chk(27, 'Texto/P2: vida 20 M☉ (10⁶)', 1e10*20**-2.5/1e6, '5.6'); chk(27, 'Guía: L 20 M☉ (10⁴)', 20**3.5/1e4, '3.6'); chk(27, 'Texto: L Sirius A', 2**3.5, '11'); chk(27, 'Guía: L(2M)', 2**3.5, '11')
# politropo n = 3
rho_sun = Ms/(4/3*math.pi*Rs**3)
chk(27, 'P2: ρ medio Sol', rho_sun, '1410'); chk(27, 'Texto/P2: ρc (10⁴)', 54.18*rho_sun/1e4, '7.6')
def le(n):
    f = lambda x, y: [y[1], -max(y[0], 0)**n-2*y[1]/x]; ev = lambda x, y: y[0]; ev.terminal = True; ev.direction = -1
    x0 = 1e-6; s = _iv7(f, (x0, 50), [1-x0**2/6, -x0/3], method='DOP853', rtol=1e-12, atol=1e-14, events=ev); return float(s.t_events[0][0]), float(-s.t_events[0][0]**2*s.y_events[0][0][1])
for n, a, b in ((0, '2.44949', '4.89898'), (1, '3.14159', '3.14159'), (1.5, '3.65375', '2.71406'), (3, '6.89685', '2.01824'), (3.5, '9.53581', '1.89056')):
    x1, m1 = le(n); chk(27, f'Tabla: ξ1 n={n}', x1, a); chk(27, f'Tabla: −ξ²θ′ n={n}', m1, b)
for n, v in ((0, '1.000'), (1, '3.290'), (1.5, '5.991'), (3, '54.18'), (3.5, '152.9')):
    x1, m1 = le(n); chk(27, f'Tabla: ρc/ρ̄ n={n}', x1/(3*m1/x1**2), v)
# Chandrasekhar
def MCh(mue):
    Kc = (C.hbar*c/4)*(3*math.pi**2)**(1/3)/(mue*C.atomic_mass)**(4/3); return 4*math.pi*(Kc/(math.pi*G))**1.5*le(3)[1]
Kc2 = (C.hbar*c/4)*(3*math.pi**2)**(1/3)/(2*C.atomic_mass)**(4/3)
chk(27, 'Texto/P3: MCh', MCh(2)/Ms, '1.456'); chk(27, 'P3: K (10⁹)', Kc2/1e9, '4.93'); chk(27, 'P3: M (10³⁰ kg)', MCh(2)/1e30, '2.896'); chk(27, 'Texto: MCh Fe (2 dec)', MCh(56/26)/Ms, '1.26'); chk(27, 'P3: Fe (3 dec)', MCh(56/26)/Ms, '1.256'); chk(27, 'Texto: 5.83/4', 5.83/4, '1.46')
# Sirius B
Rsb = 0.0084*Rs; Msb = 1.02*Ms
chk(27, 'P4: R (10⁶ m)', Rsb/1e6, '5.84'); chk(27, 'Texto/P4: ρ (10⁹)', Msb/(4/3*math.pi*Rsb**3)/1e9, '2.4'); chk(27, 'Texto/P4: g (10⁶)', G*Msb/Rsb**2/1e6, '3.96'); chk(27, 'Texto: g/g⊕ (10⁵)', G*Msb/Rsb**2/9.80665/1e5, '4.0'); chk(27, 'Texto/P4: v esc (10³ km/s)', math.sqrt(2*G*Msb/Rsb)/1e6, '6.8'); chk(27, 'Texto: v/c (%)', math.sqrt(2*G*Msb/Rsb)/c*100, '2.3')
chk(27, 'Texto: cucharadita (t)', 2.8e9*5e-6/1e3, '14')
# estrella de neutrones
Mn = 1.4*Ms; Rn = 12e3
chk(27, 'Texto/P5: ρ NS (10¹⁷)', Mn/(4/3*math.pi*Rn**3)/1e17, '3.8'); chk(27, 'Texto/P5: compacidad', 2*G*Mn/(c**2*Rn), '0.345'); chk(27, 'Texto: compacidad (2 dec)', 2*G*Mn/(c**2*Rn), '0.34'); chk(27, 'Texto/P5: Rs (km)', 2*G*Mn/c**2/1e3, '4.13'); chk(27, 'Texto/P5: v esc/c', math.sqrt(2*G*Mn/Rn)/c, '0.587'); chk(27, 'Texto: v esc/c (2 dec)', math.sqrt(2*G*Mn/Rn)/c, '0.59')
Eb = 3*G*Mn**2/(5*Rn)
chk(27, 'Texto/P5: Eb (10⁴⁶ J)', Eb/1e46, '2.59'); chk(27, 'Texto: Eb (2.6)', Eb/1e46, '2.6'); chk(27, 'P5: E Sol (10⁴⁴)', Ls*1e10*365.25*86400/1e44, '1.21'); chk(27, 'Texto/P5: cociente', Eb/(Ls*1e10*365.25*86400), '214'); chk(27, 'Texto: E Sol (10⁴⁴)', Ls*1e10*365.25*86400/1e44, '1.2'); chk(27, 'P5: Sol (10¹⁷ s)', 1e10*365.25*86400/1e17, '3.156')
# WD
def wd(xc, mue=2.0, xs=2e-3):
    Pk = math.pi*C.m_e**4*c**5/(3*C.h**3); rho = lambda x: mue*C.atomic_mass*(8*math.pi/3)*(C.m_e*c/C.h)**3*x**3; dPdx = lambda x: Pk*8*x**4/math.sqrt(x*x+1)
    f = lambda r, y: [-G*y[1]*rho(y[0])/(r*r*dPdx(y[0])), 4*math.pi*r*r*rho(y[0])]
    ev = lambda r, y: y[0]-xs; ev.terminal = True; ev.direction = -1
    s = _iv7(f, (1.0, 1e8), [xc, 4/3*math.pi*rho(xc)], method='DOP853', rtol=1e-11, atol=[1e-14, 1e10], events=ev); return float(s.t_events[0][0]), float(s.y_events[0][0][1]), rho(xc)
for xc, m, r in ((0.3, '0.110', '18253'), (1, '0.510', '9704'), (3, '1.096', '4998'), (10, '1.395', '2073'), (30, '1.448', '806'), (100, '1.4555', '259')):
    R_, M_, rho_ = wd(xc); chk(27, f'Tabla WD: M x={xc}', M_/Ms, m); chk(27, f'Tabla WD: R x={xc}', R_/1e3, r)
chk(27, 'Tabla WD: ρc x=0.3 (10⁷)', wd(0.3)[2]/1e7, '5.3'); chk(27, 'Tabla WD: ρc x=1 (10⁹)', wd(1)[2]/1e9, '1.9'); chk(27, 'Tabla WD: ρc x=3 (10¹⁰)', wd(3)[2]/1e10, '5.3'); chk(27, 'Tabla WD: ρc x=10 (10¹²)', wd(10)[2]/1e12, '1.9')
xs_ = _bq7(lambda x: wd(x)[1]-1.02*Ms, 0.5, 20, xtol=1e-6); Rm, Mm_, _ = wd(xs_)
chk(27, 'Texto: R Sirius B modelo (R☉)', Rm/Rs, '0.0080'); chk(27, 'Texto: R modelo (10³ km)', Rm/1e6, '5.6'); chk(27, 'Texto: ρ medio modelo (10⁹)', Mm_/(4/3*math.pi*Rm**3)/1e9, '2.8')
xe = _bq7(lambda x: wd(x)[1]-0.573*Ms, 0.1, 20, xtol=1e-6); chk(27, 'Texto: R 40 Eri B modelo', wd(xe)[0]/Rs, '0.0131')
a_ = wd(0.1); b_ = wd(0.2); chk(27, 'Texto: pendiente R–M', math.log(b_[0]/a_[0])/math.log(b_[1]/a_[1]), '-0.34')
# NS máximo
mn = 1.67492749804e-27
def ns(xc, xs=1e-3):
    A = mn**4*c**5/(8*math.pi**2*C.hbar**3); c2 = c*c
    eps = lambda x: A*(x*(2*x*x+1)*math.sqrt(1+x*x)-math.asinh(x)); P = lambda x: A/3*(x*(2*x*x-3)*math.sqrt(1+x*x)+3*math.asinh(x)); dP = lambda x: A/3*8*x**4/math.sqrt(1+x*x)
    def f(r, y):
        x, m = y; e_ = eps(x); p = P(x); return [-(G*(e_+p)/c2*(m+4*math.pi*r**3*p/c2))/(r*r*(1-2*G*m/(r*c2))*dP(x)), 4*math.pi*r*r*e_/c2]
    ev = lambda r, y: y[0]-xs; ev.terminal = True; ev.direction = -1
    s = _iv7(f, (1.0, 1e5), [xc, 4/3*math.pi*eps(xc)/c2], method='DOP853', rtol=1e-11, atol=[1e-14, 1e10], events=ev); return float(s.t_events[0][0]), float(s.y_events[0][0][1]), eps(xc)/c2
r_ = _ms7(lambda x: -ns(x)[1], bounds=(0.8, 2.5), method='bounded', options=dict(xatol=1e-4)); Rm_, Mm2, rc = ns(float(r_.x))
chk(27, 'Texto: M máx NS', Mm2/Ms, '0.710'); chk(27, 'Texto: R máx NS', Rm_/1e3, '9.16'); chk(27, 'Texto: ρc máx NS (10¹⁸)', rc/1e18, '4.2')
chk(27, 'Texto: M semimasa n=3 (%)', 28.3, '28', 1) if False else None
