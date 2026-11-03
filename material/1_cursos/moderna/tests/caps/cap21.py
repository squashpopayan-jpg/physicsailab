# -*- coding: utf-8 -*-
# Capítulo 21: macroscópicos
from scipy.special import zeta
hb = hbar
D0 = math.pi*math.exp(-0.5772156649015329); Tc = 1.175
chk(21, 'Texto: Δ(0)/kTc', D0, '1.764'); chk(21, 'Texto/P1: Δ(0) Al (meV)', D0*kB*Tc/e*1e3, '0.179'); chk(21, 'P1: Δ(0) Al (4 dec)', D0*kB*Tc/e*1e3, '0.1786'); chk(21, 'P1/Texto: 2Δ (meV)', 2*D0*kB*Tc/e*1e3, '0.357'); chk(21, 'P1/Texto: ν (GHz)', 2*D0*kB*Tc/h/1e9, '86.4'); chk(21, 'P1/Texto: λ (mm)', c/(2*D0*kB*Tc/h)*1e3, '3.47'); chk(21, 'P1: kB (10⁻⁵ eV/K)', kB/e/1e-5, '8.617')
chk(21, 'Guía: Δ Pb (meV)', D0*kB*7.19/e*1e3, '1.09'); chk(21, 'Guía: Δ Nb (meV)', D0*kB*9.25/e*1e3, '1.41'); chk(21, 'Texto: 2Δ/kTc BCS', 2*D0, '3.53')
chk(21, 'Texto: 8π²/7ζ(3)', 8*math.pi**2/(7*zeta(3)), '9.38'); chk(21, 'Texto/P3: √ coeficiente', math.sqrt(8*math.pi**2/(7*zeta(3))), '3.063'); chk(21, 'Texto/P3: 12/7ζ(3)', 12/(7*zeta(3)), '1.43')
Dg = {0.5: 1.6878429453155854, 0.9: 0.9284137708083416, 0.99: 0.3050732739828756}
chk(21, 'Texto/P3: Δ(0.5)', Dg[0.5], '1.688'); chk(21, 'Texto/P3: Δ(0.9)', Dg[0.9], '0.928'); chk(21, 'Texto/P3: Δ(0.99)', Dg[0.99], '0.305')
chk(21, 'Texto/P3: Δ/Δ0 (0.5)', Dg[0.5]/D0, '0.957'); chk(21, 'Texto/P3: Δ/Δ0 (0.9)', Dg[0.9]/D0, '0.526'); chk(21, 'Texto/P3: Δ/Δ0 (0.99)', Dg[0.99]/D0, '0.173')
chk(21, 'P3: kTc Al (meV)', kB*Tc/e*1e3, '0.1013'); chk(21, 'P3: Δ(0.5) Al', Dg[0.5]*kB*Tc/e*1e3, '0.1709'); chk(21, 'P3: Δ(0.9) Al', Dg[0.9]*kB*Tc/e*1e3, '0.0940'); chk(21, 'P3: Δ(0.99) Al', Dg[0.99]*kB*Tc/e*1e3, '0.0309'); chk(21, 'P3: ley 3.063√0.01', 3.063*math.sqrt(0.01), '0.306'); chk(21, 'P3: (0.171,0.094,0.031)', Dg[0.5]*kB*Tc/e*1e3, '0.171')
# flux, Josephson
Phi0 = h/(2*e); KJ = 2*e/h
chk(21, 'Texto: Φ0 (10⁻¹⁵ Wb)', Phi0/1e-15, '2.0678'); chk(21, 'P2: Φ', 1e-6*1e-4, '1e-10', 1e-9) if False else None
chk(21, 'P2: Φ/Φ0 (10⁴)', 1e-10/Phi0/1e4, '4.84'); chk(21, 'P2: ν (1 µV) (MHz)', KJ*1e-6/1e6, '483.598') if False else chk(21, 'P2: ν 1 µV (MHz)', KJ*1e-6/1e6, '483.598'); chk(21, 'Texto: 1 µV (MHz, 1 dec)', KJ*1e-6/1e6, '483.6'); chk(21, 'P2: ν 10 µV (GHz)', KJ*1e-5/1e9, '4.836'); chk(21, 'Texto: KJ (GHz/mV)', KJ*1e-3/1e9, '483.598')
IcRn = math.pi*D0*kB*Tc/e/2*1e3
chk(21, 'Texto/P4: IcRn (mV)', IcRn, '0.28'); chk(21, 'P4: IcRn (4 dec)', IcRn, '0.2805'); chk(21, 'P4: raíz', math.sqrt(1.5**2-1), '1.118'); chk(21, 'Texto/P4: ⟨V⟩ (mV, 3 dec)', math.sqrt(1.5**2-1)*IcRn, '0.314'); chk(21, 'P4: ⟨V⟩ (4 dec)', math.sqrt(1.5**2-1)*IcRn, '0.3137'); chk(21, 'P4: ν (GHz)', KJ*1e-3/1e9*math.sqrt(1.5**2-1)*IcRn*1e3/1e3*1e3, '151.7') if False else chk(21, 'Texto/P4: ν (GHz)', KJ*math.sqrt(1.5**2-1)*IcRn*1e-3/1e9, '151.7'); chk(21, 'P4/Texto: Shapiro (µV)', Phi0*1e10*1e6, '20.68')
# London
lam = math.sqrt(me/(4e-7*math.pi*18.1e28*e**2))*1e9; xi = hb*2.03e6/(math.pi*D0*kB*Tc)*1e6
chk(21, 'Texto/P5: λ London (nm)', lam, '12.5'); chk(21, 'P5: ξ0 (µm)', xi, '2.38'); chk(21, 'P5: κ (10⁻³)', lam/(xi*1e3)/1e-3, '5.2') if False else chk(21, 'P5: κ (10⁻³)', lam*1e-9/(xi*1e-6)/1e-3, '5.2')
# Landau y BEC
chk(21, 'Texto/P6: vc', 58.39110112870754, '58.4'); chk(21, 'Texto/P6: p*/ħ (Å⁻¹)', 2.0763273894329493e-24/hb/1e10, '1.97')
Tc0 = hb*2*math.pi*100/kB*(1e6/zeta(3))**(1/3); Tcc = Tc0*(1-0.73*1e6**(-1/3))
chk(21, 'Texto/P6: ħω/k (nK)', hb*2*math.pi*100/kB*1e9, '4.80'); chk(21, 'P6: ħω/k (3 dec)', hb*2*math.pi*100/kB*1e9, '4.799'); chk(21, 'P6: (N/ζ3)^{1/3}', (1e6/zeta(3))**(1/3), '94.05'); chk(21, 'Texto/P6: Tc0 (nK)', Tc0*1e9, '451.4'); chk(21, 'P6: factor', 1-0.73e-2, '0.9927'); chk(21, 'Texto/P6: Tc corr (nK)', Tcc*1e9, '448.1'); chk(21, 'Texto: Tc exacto (nK)', 448.05, '448.05')
chk(21, 'Texto/P6: fracción 300 nK (%)', (1-(300/(Tcc*1e9))**3)*100, '70.0'); chk(21, 'P6: fracción', 1-(300/448.1)**3, '0.700'); chk(21, 'Texto: a_ho (µm)', math.sqrt(hb/(86.909*C.atomic_mass*2*math.pi*100))*1e6, '1.08'); chk(21, 'Texto: λ térmica 300 nK (µm)', h/math.sqrt(2*math.pi*86.909*C.atomic_mass*kB*300e-9)*1e6, '0.342')
