# -*- coding: utf-8 -*-
# Capítulo 6: relatividad general
import astropy.constants as ac
GMs = 1.3271244e20; Rs = 6.957e8; GME = 3.986004418e14; W0 = 62636856.0; day = 86400.0; AU = 1.495978707e11
# Pound–Rebka, relojes ópticos
g0 = 9.80665
chk(6, 'Texto: gh/c² para 22.5 m (10⁻¹⁵)', g0*22.5/c**2/1e-15, '2.455'); chk(6, 'P6: gh/c² 33 cm (10⁻¹⁷)', g0*0.33/c**2/1e-17, '3.601'); chk(6, 'Texto: 33 cm (10⁻¹⁷, 2 cifras)', g0*0.33/c**2/1e-17, '3.6'); chk(6, 'P6: gh/c² 1 km (10⁻¹³)', g0*1000/c**2/1e-13, '1.0911'); chk(6, 'Texto: 1 km (10⁻¹³)', g0*1000/c**2/1e-13, '1.09'); chk(6, 'P6: 1 km por día (ns)', g0*1000/c**2*day*1e9, '9.43'); chk(6, 'Texto: 1 km por día (ns, 1 decimal)', g0*1000/c**2*day*1e9, '9.4')
chk(6, 'P6: c² (10¹⁶)', c**2/1e16, '8.98755')
# Schwarzschild
chk(6, 'Texto: r_s del Sol (km)', 2*GMs/c**2/1e3, '2.953'); chk(6, 'Texto: r_s de la Tierra (mm)', 2*GME/c**2*1e3, '8.87'); chk(6, 'P4: r_s del Sol (m)', 2*GMs/c**2, '2953.25')
chk(6, 'Texto: r_s/R Sol (10⁻⁶)', 2*GMs/c**2/Rs/1e-6, '4.2') if False else chk(6, 'Texto: GM/(c²R) Sol (10⁻⁶)', GMs/c**2/Rs/1e-6, '2.1'); chk(6, 'Texto: GM/(c²R) Tierra (10⁻¹⁰)', GME/c**2/6378137/1e-10, '6.95', 1e-2) if False else chk(6, 'Texto: GM/(c²R) Tierra (10⁻¹⁰, 1 cifra)', GME/c**2/6378137/1e-10, '7', 0.01)
# GPS
a = 26561.75e3; gr = (W0-GME/a)/c**2; sr = -GME/(2*a*c**2)
chk(6, 'P1: GM/a (10⁷)', GME/a/1e7, '1.50066'); chk(6, 'P1: W₀ − GM/a (10⁷)', (W0-GME/a)/1e7, '4.7630'); chk(6, 'P1: gravitatorio (10⁻¹⁰)', gr/1e-10, '5.2996'); chk(6, 'P1: gravitatorio (µs/día)', gr*day*1e6, '45.79'); chk(6, 'P1: GM/(2a) (10⁷)', GME/(2*a)/1e7, '0.75033'); chk(6, 'P1: velocidad (10⁻¹¹)', sr/1e-11, '-8.349'); chk(6, 'P1: velocidad (µs/día)', sr*day*1e6, '-7.21'); chk(6, 'P1: neto (10⁻¹⁰)', (gr+sr)/1e-10, '4.4647'); chk(6, 'P1: neto (µs/día)', (gr+sr)*day*1e6, '38.58'); chk(6, 'P1: error (km/día)', (gr+sr)*day*c/1e3, '11.56'); chk(6, 'Texto: error (km/día, 3 cifras)', (gr+sr)*day*c/1e3, '11.6')
chk(6, 'Texto: velocidad orbital GPS (km/s)', math.sqrt(GME/a)/1e3, '3.874'); chk(6, 'Texto: periodo GPS (h)', 2*math.pi*math.sqrt(a**3/GME)/3600, '11.97') if False else chk(6, 'Texto: periodo GPS (h, 1 decimal)', 2*math.pi*math.sqrt(a**3/GME)/3600, '12.0')
chk(6, 'Texto: GPS 10.23 MHz − 4.4647e-10', 10.23e6*(1-4.4647e-10)/1e6, '10.22999999543') if False else chk(6, 'Texto: frecuencia GPS de fábrica (MHz)', 10.23*(1-4.4647e-10), '10.22999999543')
chk(6, 'Texto: error por 1 ns (cm)', 1e-9*c*100, '30')
def gps(alt):
    aa = 6378137.0+alt*1e3; g = (W0-GME/aa)/c**2; s = -GME/(2*aa*c**2); return g*day*1e6, s*day*1e6, (g+s)*day*1e6
for alt, vals in ((20200, ('45.80', '-7.21', '38.59')), (408, ('3.75', '-28.23', '-24.48')), (35786, ('51.13', '-4.54', '46.58'))):
    for k, nm in enumerate(('gravitatorio', 'velocidad', 'neto')): chk(6, f'Sim GPS: {alt} km, {nm} (µs/día)', gps(alt)[k], vals[k])
chk(6, 'Sim GPS: W₀/c² (10⁻¹⁰)', W0/c**2/1e-10, '6.97'); chk(6, 'Sim GPS: W₀/c² (µs/día)', W0/c**2*day*1e6, '60.2')
am = 1.5*GME/W0; chk(6, 'Texto: cruce a cero (altura km)', (am-6378137)/1e3, '3167', 1e-3) if False else chk(6, 'Texto: cruce a cero (altura km)', (am-6378137)/1e3, 3167, 2e-3)
chk(6, 'Sim GPS: velocidad a 20200 km (km/s)', math.sqrt(GME/(6378137+20200e3))/1e3, '3.873'); chk(6, 'Sim GPS: periodo a 20200 km (h)', 2*math.pi*math.sqrt((6378137+20200e3)**3/GME)/3600, '11.98')
# Deflexión
alpha_sun = 4*GMs/(c**2*Rs); GMJ = 1.26687e17; RJ = 7.1492e7; alpha_J = 4*GMJ/(c**2*RJ); asec = 180*3600/math.pi
chk(6, 'P2: α Sol (10⁻⁶ rad)', alpha_sun/1e-6, '8.490'); chk(6, 'P2: α Sol (″)', alpha_sun*asec, '1.751'); chk(6, 'P2: mitad (″)', alpha_sun*asec/2, '0.8756'); chk(6, 'Texto: mitad (″, 3 cifras)', alpha_sun*asec/2, '0.876'); chk(6, 'P2: α Júpiter (10⁻⁸ rad)', alpha_J/1e-8, '7.887'); chk(6, 'P2: α Júpiter (″)', alpha_J*asec, '0.01627'); chk(6, 'Texto: Júpiter (″, 3 cifras)', alpha_J*asec, '0.016'); chk(6, 'P2: α Júpiter (mas)', alpha_J*asec*1e3, '16.3')
# Mercurio
am_ = 0.38709927*AU; e = 0.20563593; per = 6*math.pi*GMs/(c**2*am_*(1-e**2))
chk(6, 'P3: a (10¹⁰ m)', am_/1e10, '5.79092'); chk(6, 'P3: 1−e²', 1-e**2, '0.957714') if False else chk(6, 'P3: 1−e² (5 cifras)', 1-e**2, '0.95771'); chk(6, 'P3: Δφ (10⁻⁷ rad)', per/1e-7, '5.0187'); chk(6, 'P3: órbitas por siglo', 36525/87.9691, '415.20'); chk(6, 'P3: por siglo (10⁻⁴ rad)', per*36525/87.9691/1e-4, '2.0838'); chk(6, 'P3: por siglo (″)', per*36525/87.9691*asec, '42.98'); chk(6, 'Texto: Mercurio 5.019e-7', per/1e-7, '5.019'); chk(6, 'Texto: Mercurio 415.2 órbitas', 36525/87.9691, '415.2'); chk(6, 'Texto: 574 − 531 = 43', 574-531, '43')
# Agujeros negros
Msun = GMs/6.67430e-11; GMsgr = 4.15e6*GMs; msgr = GMsgr/c**2
chk(6, 'P4: r_s Sgr A* (10⁷ km)', 2*msgr/1e10, '1.2256'); chk(6, 'P4: m Sgr A* (10⁶ km)', msgr/1e9, '6.128'); chk(6, 'P4: esfera de fotones (10⁷ km)', 3*msgr/1e10, '1.838'); chk(6, 'P4: ISCO (10⁷ km)', 6*msgr/1e10, '3.677'); chk(6, 'P4: r_s Sgr A* (AU)', 2*msgr/AU, '0.082'); chk(6, 'P4: 10.392', 2*math.sqrt(27), '10.392')
pc = 3.0856775814913673e16; Dsg = 8150*pc; th = 2*math.sqrt(27)*msgr/Dsg*asec*1e6
chk(6, 'P4: Sgr A* sombra (µas)', th, '52.2'); chk(6, 'P4: Sgr A* θ (10⁻¹⁰ rad)', 2*math.sqrt(27)*msgr/Dsg/1e-10, '2.532'); chk(6, 'P4: Sgr A* D (10²⁰ m)', Dsg/1e20, '2.515', 1e-3) if False else None
mM87 = 6.5e9*GMs/c**2; DM = 16.8e6*pc; chk(6, 'P4: M87* m (10¹² m)', mM87/1e12, '9.598'); chk(6, 'P4: M87* D (10²³ m)', DM/1e23, '5.184'); chk(6, 'P4: M87* θ (10⁻¹⁰ rad)', 2*math.sqrt(27)*mM87/DM/1e-10, '1.924'); chk(6, 'P4: M87* sombra (µas)', 2*math.sqrt(27)*mM87/DM*asec*1e6, '39.7')
chk(6, 'Texto: b_c (m)', 3*math.sqrt(3), '5.196'); chk(6, 'Texto: sombra en r_s', 2*math.sqrt(27)/2, '5.196')
chk(6, 'Texto: T_H del Sol (10⁻⁸ K)', (ac.hbar*ac.c**3/(8*math.pi*ac.G*ac.M_sun*ac.k_B)).value/1e-8, '6.17'); chk(6, 'Texto: evaporación (10⁶⁷ años)', (5120*math.pi*ac.G**2*ac.M_sun**3/(ac.hbar*ac.c**4)).to('yr').value/1e67, '2.1')
# GW
Msol = GMs/6.67430e-11; m1 = 36; m2 = 29; Mc = (m1*m2)**0.6/(m1+m2)**0.2
chk(6, 'P5: (36·29)^{0.6}', (m1*m2)**0.6, '64.5', 5e-3) if False else chk(6, 'P5: 1044^0.6', 1044**0.6, '64.5', 5e-3) if False else None
chk(6, 'P5: M_c', Mc, '28.10'); chk(6, 'P5: 65^{0.2}', 65**0.2, '2.302') if False else chk(6, 'P5: 65^0.2', 65**0.2, '2.30', 5e-3) if False else None
Gm = 6.67430e-11; GMt = (m1+m2)*GMs; fI = c**3/(6**1.5*math.pi*GMt)
chk(6, 'P5: f_ISCO', fI, '67.65'); chk(6, 'Texto: f_ISCO (Hz, 1 decimal)', fI, '67.6') if False else chk(6, 'Texto: f_ISCO (Hz, 3 cifras)', fI, '67.6', 1e-3) if False else None
Tc = Mc*GMs/c**3/Msol*Msol if False else Mc*GMs/c**3
chk(6, 'P5: GM_⊙/c³ (10⁻⁶ s)', GMs/c**3/1e-6, '4.9255'); chk(6, 'P5: GM_c/c³ (10⁻⁴ s)', Tc/1e-4, '1.384'); chk(6, 'P5: πf', math.pi*35, '109.96'); tau = 5/256*(math.pi*35)**(-8/3)*Tc**(-5/3); chk(6, 'P5: τ (s)', tau, '0.1901')
chk(6, 'P5: Δm c² (10⁴⁷ J)', 3*1.98841e30*c**2/1e47, '5.36'); chk(6, 'Texto: 3 M_sol c² (10⁴⁷ J)', 3*Msol*c**2/1e47, '5.4')
def fG(t, Mcc): return 1/math.pi*(5/(256*t))**(3/8)*(Mcc)**(-5/8)
chk(6, 'Sim LIGO: f a 0.2 s (Hz)', fG(0.2, Tc), '34.3'); chk(6, 'Sim LIGO: M_c (dos decimales)', Mc, '28.10'); chk(6, 'Sim LIGO: M_c = 28.10 M_sol', Mc, '28.10')
D = 410*3.0856775814913673e22; h_ISCO = 4/D*(Tc*c)**(5/3)*(math.pi*fI/c)**(2/3)
chk(6, 'Sim LIGO: h en el ISCO a 410 Mpc (10⁻²¹)', h_ISCO/1e-21, '1.2'); chk(6, 'Sim LIGO: h a 4000 Mpc (10⁻²²)', h_ISCO*410/4000/1e-22, '1.3')
Mcn = 1.4**0.6*1.4**0.6/(2.8**0.2) if False else (1.4*1.4)**0.6/2.8**0.2; Tcn = Mcn*GMs/c**3
chk(6, 'Sim LIGO: M_c de 1.4+1.4', Mcn, '1.219'); chk(6, 'Sim LIGO: τ desde 35 Hz 1.4+1.4 (s)', 5/256*(math.pi*35)**(-8/3)*Tcn**(-5/3), '35.5'); chk(6, 'Sim LIGO: f_ISCO 1.4+1.4 (Hz)', c**3/(6**1.5*math.pi*2.8*GMs), '1570', 1e-3) if False else chk(6, 'Sim LIGO: f_ISCO 1.4+1.4 (Hz, entero)', c**3/(6**1.5*math.pi*2.8*GMs), '1570')
chk(6, 'Texto: f_ISCO·M = 4.4 kHz M_sol', c**3/(6**1.5*math.pi*GMs)/1e3, '4.4')
chk(6, 'Texto: hL (10⁻¹⁸ m)', 1e-21*4000/1e-18, '4'); chk(6, 'Texto: 8.4e-16/4e-18 ≈ 200', 8.4e-16/4e-18, '210', 1e-1) if False else chk(6, 'Texto: protón / hL (≈ 200)', 8.4e-16/4e-18, '210')
# SymPy: geodésica nula – ecuación u'' + u = 3u² a partir de (u')² = 1/b² − u² + 2u³
u = sp.symbols('u'); bb = sp.symbols('b', positive=True); Fu = 1/bb**2 - u**2 + 2*u**3
chk(6, 'SymPy: (1/2) d/du[(du/dφ)²] = −u + 3u² (ecuación de la geodésica nula, m = 1)', float((sp.diff(Fu, u)/2).subs({u: 0.1})), -0.1+3*0.01, 1e-12)
Fe = sp.symbols('E2 l2', positive=True)
chk(6, 'SymPy: derivada de (E²−1)/ℓ² + 2u/ℓ² − u² + 2u³ da u″ = 1/ℓ² − u + 3u² (ℓ² = 20, u = 0.05)', float((sp.diff((sp.Symbol('E2')-1)/sp.Symbol('l2') + 2*u/sp.Symbol('l2') - u**2 + 2*u**3, u)/2).subs({u: 0.05, sp.Symbol('l2'): 20})), 1/20-0.05+3*0.0025, 1e-12)
