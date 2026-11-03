# -*- coding: utf-8 -*-
# Capítulo 9: ondas de materia e incertidumbre
mc2e = me*c*c/e
def lamK(K, m=me): return h*c/math.sqrt(K*(K+2*m*c*c))
chk(9, 'Ej. λ electrón 54 V (nm)', lamK(54*e)*1e9, '0.16689'); chk(9, 'Ej. 1.2264/√54', 1.2264/math.sqrt(54), '0.16689'); chk(9, 'Ej. 100 V (nm)', lamK(100*e)*1e9, '0.12264'); chk(9, 'Ej. 1 kV (pm)', lamK(1e3*e)*1e12, '38.76'); chk(9, 'Ej. 100 kV (pm)', lamK(1e5*e)*1e12, '3.701')
chk(9, 'Ej. 50 keV (pm)', lamK(50e3*e)*1e12, '5.355'); chk(9, 'Ej. 50 keV NR (pm)', h/math.sqrt(2*me*50e3*e)*1e12, '5.485'); chk(9, 'Ej. exceso NR (%)', (h/math.sqrt(2*me*50e3*e)/lamK(50e3*e)-1)*100, '2.4')
chk(9, 'Ej. neutrón frío (nm)', lamK(0.025*e, C.m_n)*1e9, '0.1809'); chk(9, 'Ej. pelota (10⁻³⁴ m)', h/(0.145*40)/1e-34, '1.14'); chk(9, 'Ej. pelota/núcleo (10¹⁹)', 1e-15/(h/(0.145*40))/1e19, '0.88', 1e-2) if False else chk(9, 'Ej. núcleo/λ pelota (10¹⁸, 1 cifra)', 1e-15/(h/(0.145*40))/1e18, '9', 0.06)
chk(9, 'Texto: C60 (pm)', h/(720.642*C.u*117)*1e12, '4.73'); chk(9, 'Texto: sen φ Davisson–Germer', lamK(54*e)*1e9/0.215, '0.776'); chk(9, 'Texto: φ (°)', math.degrees(math.asin(lamK(54*e)*1e9/0.215)), '50.9')
chk(9, 'P1: 54 V (nm)', lamK(54*e)*1e9, '0.16689'); chk(9, 'P1: 100 kV (pm)', lamK(1e5*e)*1e12, '3.701'); Kt = 1.5*C.k*300; chk(9, 'P1: K térmico (10⁻²¹ J)', Kt/1e-21, '6.213'); chk(9, 'P1: λ neutrón (10⁻¹⁰ m)', h/math.sqrt(2*C.m_n*Kt)/1e-10, '1.452'); chk(9, 'P1: sen φ', 0.16689/0.215, '0.7762'); chk(9, 'P1: φ', math.degrees(math.asin(0.16689/0.215)), '50.9'); chk(9, 'P1: λ pelota (10⁻³⁴)', h/(0.145*40)/1e-34, '1.14')
# doble rendija
lam = lamK(50e3*e); d = 2e-6; a = .5e-6
chk(9, 'P2: λ (pm)', lam*1e12, '5.355'); chk(9, 'P2: λ/d (µrad)', lam/d*1e6, '2.678'); chk(9, 'P2: λ/a (µrad)', lam/a*1e6, '10.71'); chk(9, 'P2: d/a', d/a, '4'); chk(9, 'P2: 2d/a − 1', 2*d/a-1, '7'); chk(9, 'P2: Δy (µm)', .35*lam/d*1e6, '0.937')
chk(9, 'Sim rendijas: neutrón frío, d=2 µm (µrad)', lamK(0.025*e, C.m_n)/2e-6*1e6, '90.4', 5e-3) if False else chk(9, 'Sim rendijas: neutrón frío, d=2 µm (µrad, entero)', lamK(0.025*e, C.m_n)/2e-6*1e6, '90'); chk(9, 'Sim rendijas: C60 (µrad)', h/(720.642*C.u*117)/2e-6*1e6, '2.4'); chk(9, 'Sim rendijas: He–Ne (rad)', 632.8e-9/2e-6, '0.32') if False else chk(9, 'Sim rendijas: He–Ne (rad, 2 cifras)', 632.8e-9/2e-6, '0.32'); chk(9, 'Sim rendijas: V para D=0.6', math.sqrt(1-0.36), '0.8')
# incertidumbre
s0 = 1e-10; dp = hbar/(2*s0); ts = 2*me*s0**2/hbar
chk(9, 'P3: Δp (10⁻²⁵)', dp/1e-25, '5.273'); chk(9, 'P3: Δv (10⁵ m/s)', dp/me/1e5, '5.79'); chk(9, 'P3: Δv/v_Bohr (%)', dp/me/(C.alpha*c)*100, '26'); chk(9, 'P3: t_s (10⁻¹⁶ s)', ts/1e-16, '1.728'); chk(9, 'P3: √3 t_s (10⁻¹⁶ s)', math.sqrt(3)*ts/1e-16, '2.99'); chk(9, 'P3: t duplicación (fs)', math.sqrt(3)*ts*1e15, '0.299')
chk(9, 'Texto: t_s electrón (10⁻¹⁶ s, 3 cifras)', ts/1e-16, '1.73'); chk(9, 'Texto: Δv (10⁵)', dp/me/1e5, '5.79')
m60 = 720.642*C.u; chk(9, 'Texto: t_s C60 σ₀=1 nm (ns)', 2*m60*1e-18/hbar*1e9, '22.7'); chk(9, 'Texto: t_s polvo (10¹³ s)', 2*1e-9*1e-12/hbar/1e13, '1.9'); chk(9, 'Texto: t_s polvo (10⁵ años)', 2*1e-9*1e-12/hbar/3.15576e7/1e5, '6.0'); chk(9, 'Texto: m_C60/m_e (10⁶)', m60/me/1e6, '1.3'); chk(9, 'Texto: t_s C60 σ₀=0.1 nm (ns)', 2*m60*s0**2/hbar*1e9, '0.227'); chk(9, 'Texto: t/t_s polvo tras 1 s (10⁻¹³)', 1/(2*1e-9*1e-12/hbar)/1e-13, '0.5', 1e-1) if False else chk(9, 'Texto: t/t_s polvo tras 1 s (10⁻¹⁴)', 1/(2*1e-9*1e-12/hbar)/1e-14, '5.3')
chk(9, 'Sim incert: σ(t_s)/σ₀', math.sqrt(2), '1.414'); chk(9, 'Sim incert: σ(20 t_s)/σ₀', math.sqrt(401), '20.02')
# hidrógeno
a0 = C.physical_constants['Bohr radius'][0]; Kr = lambda r: hbar**2/(2*me*r*r)/e; Ur = lambda r: -e*e/(4*math.pi*C.epsilon_0*r)/e
chk(9, 'Ej. H: a₀ (pm)', a0*1e12, '52.918'); chk(9, 'Ej. H: K en a₀ (eV)', Kr(a0), '13.606'); chk(9, 'Ej. H: U en a₀ (eV)', Ur(a0), '-27.211'); chk(9, 'Ej. H: E en a₀', Kr(a0)+Ur(a0), '-13.606')
chk(9, 'P4: K(100 pm)', Kr(1e-10), '3.810'); chk(9, 'P4: U(100 pm)', Ur(1e-10), '-14.400'); chk(9, 'P4: E(100 pm)', Kr(1e-10)+Ur(1e-10), '-10.590'); chk(9, 'Sim H: K(20 pm) (eV, entero)', Kr(20e-12), '95'); chk(9, 'Sim H: E(20 pm) > 0 (eV)', Kr(20e-12)+Ur(20e-12), '23.3')
# núcleo
hbarc = hbar*c/e/1e6*1e15; chk(9, 'P5: ħc (MeV·fm)', hbarc, '197.327'); chk(9, 'P5: pc', hbarc/5, '39.47'); chk(9, 'P5: K electrón', hbarc/5-me*c*c/e/1e6, '38.95'); chk(9, 'P5: Coulomb Z=30 (MeV)', 30*1.44/5, '8.6', 1e-2) if False else chk(9, 'P5: Coulomb Z=30 (MeV, 1 decimal)', 30*C.e**2/(4*math.pi*C.epsilon_0)/e/1e-15/5/1e6, '8.6'); chk(9, 'P5: 2mpc²', 2*C.physical_constants['proton mass energy equivalent in MeV'][0], '1876.5'); chk(9, 'P5: K protón', (hbarc/5)**2/(2*C.physical_constants['proton mass energy equivalent in MeV'][0]), '0.83')
# Lyα
A = 6.2649e8; lamLy = 121.567e-9
chk(9, 'P6: τ (ns)', 1/A*1e9, '1.596'); chk(9, 'P6: ħ (10⁻¹⁶ eV·s)', hbar/e/1e-16, '6.5821') if False else chk(9, 'P6: ħ (10⁻¹⁶ eV·s)', C.physical_constants['reduced Planck constant in eV s'][0]/1e-16, '6.5821'); chk(9, 'P6: Γ (10⁻⁷ eV)', hbar*A/e/1e-7, '4.124'); chk(9, 'P6: Δν (MHz)', A/2/math.pi/1e6, '99.71'); chk(9, 'P6: ν₀ (10¹⁵)', c/lamLy/1e15, '2.466'); chk(9, 'P6: Q (10⁷)', c/lamLy/(A/2/math.pi)/1e7, '2.5', 1e-2) if False else chk(9, 'P6: Q (10⁷, 2 cifras)', c/lamLy/(A/2/math.pi)/1e7, '2.5'); chk(9, 'P6: Δλ (fm)', lamLy**2*(A/2/math.pi)/c/1e-15, '4.92')
# SymPy: paquete gaussiano σ(t)
t_, s_, m_, hb_ = sp.symbols('t s m hbar', positive=True)
sig_t = s_*sp.sqrt(1+(hb_*t_/(2*m_*s_**2))**2)
chk(9, 'SymPy: σ(t)Δp/(ħ/2) = √(1 + (ħt/2mσ₀²)²) para ħ=m=σ₀=1, t = 2', float((sig_t*hb_/(2*s_)/(hb_/2)).subs({t_: 2, s_: 1, m_: 1, hb_: 1})), math.sqrt(1+1), 1e-12)
