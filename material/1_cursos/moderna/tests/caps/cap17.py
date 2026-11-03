# -*- coding: utf-8 -*-
# Capítulo 17: láser
amu = C.physical_constants['atomic mass constant'][0]; nu0 = c/632.8e-9
sr = lambda nu, T: math.expm1(h*nu/(kB*T))
chk(17, 'P1a: x (500 nm, 6000 K)', hc/500/(kB*6000/e), '4.796'); chk(17, 'P1a: hc/λ (eV)', hc/500, '2.4797'); chk(17, 'P1a: kT (eV)', kB*6000/e, '0.51704'); chk(17, 'Texto/P1a: razón', sr(c/500e-9, 6000), '120', 0.5) if False else chk(17, 'Texto/P1a: razón', sr(c/500e-9, 6000), '120')
chk(17, 'P1b: x', h*1e10/(kB*300)*1000, '1.5997') if False else chk(17, 'P1b: x (10⁻³)', h*1e10/(kB*300)/1e-3, '1.5997'); chk(17, 'Texto/P1b: razón', sr(1e10, 300), '0.0016'); chk(17, 'Texto/P1b: 1/razón', 1/sr(1e10, 300), '625')
chk(17, 'Guía: hν (eV)', h*nu0/e, '1.959'); chk(17, 'Guía: razón 632.8 nm 300 K (10³²)', sr(nu0, 300)/1e32, '8.2'); chk(17, 'Guía: N2/N1 (10⁻³³)', math.exp(-h*nu0/(kB*300))/1e-33, '1.2'); chk(17, 'Guía: T de igualdad (K, redondeado a centenas)', h*nu0/(kB*math.log(2))/100, '328.0') if False else chk(17, 'Guía: T de igualdad (K)', h*nu0/(kB*math.log(2)), 32800, 1e-3)
chk(17, 'Guía: razón CO₂ 10.6 µm 300 K', sr(c/10.6e-6, 300), '91')
dop = lambda T: 2*nu0*math.sqrt(2*kB*T*math.log(2)/(20.1797*amu*c*c))
chk(17, 'Texto/P2: Doppler 300 K (GHz)', dop(300)/1e9, '1.31'); chk(17, 'Texto/P2: Doppler 400 K (GHz)', dop(400)/1e9, '1.51'); chk(17, 'P2: Doppler 300 K (GHz, 3 dec)', dop(300)/1e9, '1.308'); chk(17, 'P2: Doppler 400 K (GHz, 3 dec)', dop(400)/1e9, '1.511'); chk(17, 'P2: ν0 (10¹⁴)', nu0/1e14, '4.738')
chk(17, 'Texto: FSR (MHz)', c/0.6/1e6, '499.65'); chk(17, 'P2: modos', dop(400)/1e6/(c/0.6/1e6), '3.02'); chk(17, 'Texto: ancho natural (MHz)', 3.4e6/(2*math.pi)/1e6, '0.54'); chk(17, 'Texto: FSR 10 cm (GHz)', c/0.2/1e9, '1.5')
g0 = 2*math.sqrt(math.log(2)/math.pi)/dop(400); sig = (632.8e-9)**2*3.4e6*g0/(8*math.pi)
chk(17, 'Texto/P6: g0 (10⁻¹⁰ s)', g0/1e-10, '6.2'); chk(17, 'Texto: 0.939/Δν', 2*math.sqrt(math.log(2)/math.pi), '0.939'); chk(17, 'Texto/P6: σ (10⁻¹⁷ m²)', sig/1e-17, '3.4'); chk(17, 'Texto/P6: σ (10⁻¹³ cm²)', sig*1e4/1e-13, '3.4')
th = lambda R2: -math.log(0.999*R2)/0.6
chk(17, 'P3: R1R2', 0.999*0.98, '0.97902'); chk(17, 'Texto/P3: γth (m⁻¹)', th(0.98), '0.0353'); chk(17, 'P3: γth (4 dec, m⁻¹)', th(0.98), '0.0353'); chk(17, 'P3: γth (5 dec)', th(0.98), '0.03534'); chk(17, 'P3: % por paso', th(0.98)*0.3*100, '1.06'); chk(17, 'P3: τc (ns)', 1/(c*th(0.98))*1e9, '94.4'); chk(17, 'P3: Q (10⁸)', 2*math.pi*nu0/(c*th(0.98))/1e8, '2.81')
chk(17, 'Texto: γth R2 = 0.99', th(0.99), '0.0184'); chk(17, 'Texto: τc R2 = 0.99 (ns)', 1/(c*th(0.99))*1e9, '181'); chk(17, 'Guía: % por paso', th(0.99)*0.3*100, '0.55')
# modos de la guía
fs = c/0.6; s = dop(400)/(2*math.sqrt(2*math.log(2))); non = [q for q in range(-20, 21) if 0.08*math.exp(-0.5*(q*fs/s)**2) > th(0.99)]
chk(17, 'Guía: modos (L = 30 cm, γ0 = 0.08)', len(non), '5'); chk(17, 'Texto: FSR (MHz, 1 dec)', fs/1e6, '499.7')
# balance
tau = 230e-6; tc = 1e-9; B = 1e-5; Nth = 1/(B*tc); Rth = Nth/tau; r = 2.5
chk(17, 'P4: Nth (10¹⁴)', Nth/1e14, '1.0'); chk(17, 'P4: Rth (10¹⁷)', Rth/1e17, '4.348'); chk(17, 'Texto: Rth (10¹⁷, 2 dec)', Rth/1e17, '4.35'); chk(17, 'P4: φ (10⁸)', tc*(r*Rth-Rth)/1e8, '6.52'); chk(17, 'Texto: φ (10⁸, 1 dec)', tc*(r*Rth-Rth)/1e8, '6.5')
chk(17, 'P4: f (kHz)', math.sqrt((r-1)/(tau*tc)-(r/(2*tau))**2)/(2*math.pi)/1e3, '406.4'); chk(17, 'Texto: f (kHz)', math.sqrt((r-1)/(tau*tc)-(r/(2*tau))**2)/(2*math.pi)/1e3, '406'); chk(17, 'P4/Texto: 2τ/r (µs)', 2*tau/r*1e6, '184')
# haces
lam = 632.8e-9; w0 = 0.3e-3; zR = math.pi*w0**2/lam
chk(17, 'Texto/P5: zR (m)', zR, '0.447'); chk(17, 'P5: zR (4 dec)', zR, '0.4468'); chk(17, 'Texto/P5: θ (mrad)', lam/(math.pi*w0)*1e3, '0.671'); chk(17, 'P5: θ (4 dec)', lam/(math.pi*w0)*1e3, '0.6714'); chk(17, 'P5: factor', math.sqrt(1+(10/zR)**2), '22.40'); chk(17, 'P5: w (mm)', w0*math.sqrt(1+(10/zR)**2)*1e3, '6.72')
Lc, R1, R2 = 0.3, 1.0, 1.0; w0c = math.sqrt(lam/math.pi*math.sqrt(Lc*(R1-Lc)*(R2-Lc)*(R1+R2-Lc))/(R1+R2-2*Lc)); wm = w0c*math.sqrt(1+(0.15/(math.pi*w0c**2/lam))**2)
chk(17, 'Texto: w0 resonador (mm)', w0c*1e3, '0.268'); chk(17, 'Texto: w en espejos (mm)', wm*1e3, '0.291')
Lc, R1, R2 = 0.5, 2.0, 3.0
chk(17, 'Guía: g1', 1-Lc/R1, '0.75'); chk(17, 'Guía: g2', 1-Lc/R2, '0.833'); chk(17, 'Guía: g1g2', (1-Lc/R1)*(1-Lc/R2), '0.625'); chk(17, 'Guía: zw (m)', Lc*(R2-Lc)/(R1+R2-2*Lc), '0.3125')
# pulsos
dn = c*100e-9/(800e-9)**2
chk(17, 'Texto/P6: Δν (THz)', dn/1e12, '46.8'); chk(17, 'P6: Δν (THz, 2 dec)', dn/1e12, '46.84'); chk(17, 'Texto/P6: Δt (fs)', 0.4413/dn*1e15, '9.4'); chk(17, 'P6: Δt (2 dec)', 0.4413/dn*1e15, '9.42'); chk(17, 'Texto: periodo (fs)', 800e-9/c*1e15, '2.67'); chk(17, 'P6: periodo (3 dec)', 800e-9/c*1e15, '2.669'); chk(17, 'Texto: ciclos', 0.4413/dn/(800e-9/c), '3.5'); chk(17, 'Texto: TBP gauss', 2*math.log(2)/math.pi, '0.4413')
chk(17, 'Guía: retardo τ ln[r/(r−1)] (µs)', tau*math.log(r/(r-1))*1e6, '117.5'); chk(17, 'Guía: periodo 1/f (µs)', 1/(math.sqrt((r-1)/(tau*tc)-(r/(2*tau))**2)/(2*math.pi))*1e6, '2.5', 0.1)
