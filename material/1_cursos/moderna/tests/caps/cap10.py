# -*- coding: utf-8 -*-
# Capítulo 10: Rutherford, Bohr, Franck–Hertz, Moseley
import xraydb
ke = 1.439964547   # MeV·fm
Rinf = C.Rydberg; mp = C.m_p; md = C.physical_constants['deuteron mass'][0]
RH = Rinf/(1+me/mp); RD = Rinf/(1+me/md)
# Rutherford
d0 = 2*79*ke/7.69
chk(10, 'Ej. Rutherford: d₀ (fm)', d0, '29.59'); chk(10, 'P1: 2·79·1.43996', 2*79*ke, '227.51') if False else chk(10, 'P1: d₀', d0, '29.59'); chk(10, 'Ej. R_Au (fm)', 1.2*197**(1/3), '6.98'); chk(10, 'Ej. b(90°) (fm)', d0/2, '14.79'); chk(10, 'Ej. b(150°) (fm)', d0/2/math.tan(math.radians(75)), '3.96'); chk(10, 'Texto: b(150°)/d₀', 0.5/math.tan(math.radians(75)), '0.134')
chk(10, 'Ej. r_mín (fm)', 0.5*d0*(1+math.sqrt(2)), '35.71'); chk(10, 'P1: 1+√2', 1+math.sqrt(2), '2.4142'); chk(10, 'P1: d₀/2', d0/2, '14.79')
sig = math.pi*(d0/2*1e-15)**2; chk(10, 'Ej. σ(>90°) (10⁻²⁸ m²)', sig/1e-28, '6.87'); chk(10, 'Ej. σ (b)', sig/1e-28, '6.9', 1e-2) if False else chk(10, 'Ej. σ (barns, 1 decimal)', sig/1e-28, '6.9')
fr = 5.90e28*0.4e-6*sig; chk(10, 'Ej. fracción (10⁻⁵)', fr/1e-5, '1.62'); chk(10, 'Ej. 1/fracción', 1/fr, '61636', 1e-4) if False else chk(10, 'Ej. 1/fracción (miles)', 1/fr/1e3, '62', 1e-2)
chk(10, 'Ej. cociente 10°/150° (10⁴)', (math.sin(math.radians(75))/math.sin(math.radians(5)))**4/1e4, '1.51'); chk(10, 'Sim R: b/d₀ del radio de contacto Al', 1.2*27**(1/3)+1.7, '5.3'); chk(10, 'Sim R: d₀ Al (fm)', 2*13*ke/7.69, '4.87'); chk(10, 'Sim R: contacto Au (fm)', 1.2*197**(1/3)+1.7, '8.7'); chk(10, 'Texto: barrera Au (MeV)', 2*79*ke/(1.2*197**(1/3)+1.7), '26', 1e-2) if False else chk(10, 'Texto: barrera Au (MeV, entero)', 2*79*ke/(1.2*197**(1/3)+1.7), '26')
chk(10, 'Sim R: θ para b=0.03 d₀ (°)', 2*math.degrees(math.atan(1/(2*0.03))), '173.1'); chk(10, 'Sim R: θ para b=0.5 d₀', 2*math.degrees(math.atan(1)), '90.00')
chk(10, 'Texto: 10⁻⁵ del radio atómico: b150/0.1 nm (10⁻⁵)', 3.96e-15/1e-10/1e-5, '4', 1e-1) if False else None
# Rydberg
lam = lambda n, m, R, Z=1: 1e9/(R*Z*Z*(1/m**2-1/n**2))
chk(10, 'Texto: R_H (m⁻¹)', RH, '10967758.34'); chk(10, 'Texto: R_D (m⁻¹)', RD, '10970742.66')
chk(10, 'Texto/P2: Hα', lam(3, 2, RH), '656.470'); chk(10, 'Texto/P2: Hβ', lam(4, 2, RH), '486.274'); chk(10, 'Texto/P2: Hγ', lam(5, 2, RH), '434.173'); chk(10, 'Texto: Hδ', lam(6, 2, RH), '410.294'); chk(10, 'Texto/P2: límite', 1e9*4/RH, '364.705'); chk(10, 'P2: Lyα', lam(2, 1, RH), '121.568'); chk(10, 'P2: Paschen α', lam(4, 3, RH), '1875.63'); chk(10, 'Texto: Lyman límite', 1e9/RH, '91.18', 1e-3) if False else chk(10, 'Texto: Lyman límite (2 decimales)', 1e9/RH, '91.18'); chk(10, 'Texto: Paschen límite', 1e9*9/RH, '820.6'); chk(10, 'Texto: Brackett α (µm)', lam(5, 4, RH)/1e3, '4.05')
chk(10, 'P2: Hα D', 36/(5*RD)*1e9, '656.291'); chk(10, 'P2: Δλ', lam(3, 2, RH)-36/(5*RD)*1e9, '0.179'); chk(10, 'P2: R_H·5/36', RH*5/36, '1523299.8', 1e-7) if False else chk(10, 'P2: R_H·5/36 (m⁻¹)', RH*5/36, '1523299.8')
mHe = 6.6446573357e-27; chk(10, 'Texto: Pickering He⁺', lam(4, 3, Rinf/(1+me/mHe), 2), '468.716'); chk(10, 'Sim: 4Ry (eV)', 4*13.605693122994, '54.42')
# positronio, muónico
ke2 = e*e/(4*math.pi*C.epsilon_0); lv = lambda mu: -mu*ke2**2/(2*hbar**2)/e
mmu = C.physical_constants['muon mass'][0]; mu_m = mmu*mp/(mmu+mp)
chk(10, 'Texto: m_μ/m_e', mmu/me, '206.768'); chk(10, 'Texto: μ/m_e (muónico)', mu_m/me, '185.84'); chk(10, 'Texto: E₁ positronio', lv(me/2), '-6.803'); chk(10, 'Texto: a positronio (pm)', 2*C.physical_constants['Bohr radius'][0]*1e12, '105.84'); chk(10, 'P3: ¾E₁ positronio', 0.75*abs(lv(me/2)), '5.102'); chk(10, 'Texto: λ Ps (nm)', hc/(0.75*abs(lv(me/2))), '243.0')
chk(10, 'Texto: E₁ muónico', lv(mu_m), '-2528.5'); chk(10, 'Texto: a muónico (fm)', C.physical_constants['Bohr radius'][0]*me/mu_m*1e15, '284.7'); chk(10, 'P3: ¾E₁ muónico (eV)', 0.75*abs(lv(mu_m)), '1896.4'); chk(10, 'P3: λ muónico (nm)', hc/(0.75*abs(lv(mu_m))), '0.654'); chk(10, 'P3: 13.6057×185.84', 13.6057*185.84, '2528.5')
# Franck–Hertz
chk(10, 'Texto/P4: λ Hg (nm)', hc/4.887, '253.7'); chk(10, 'P4: espaciado (V)', (20.8-6.1)/3, '4.90'); chk(10, 'P4: desplazamiento (V)', 6.1-4.887, '1.2'); chk(10, 'Sim FH: espaciado medio', (25.3-5.8)/4, '4.9', 1e-2) if False else chk(10, 'Sim FH: espaciado medio (V, 1 decimal)', (25.3-5.8)/4, '4.9')
# Moseley
els = [('Mg', 12), ('Ca', 20), ('Ti', 22), ('Cr', 24), ('Fe', 26), ('Co', 27), ('Cu', 29), ('Zn', 30)]
Z = np.array([z for _, z in els], float); E = np.array([xraydb.xray_line(s, 'Ka1').energy for s, _ in els])
a_, b_ = np.polyfit(Z, np.sqrt(E), 1); sg = -b_/a_
chk(10, 'Ajuste Moseley: a', a_, '3.1973'); chk(10, 'Ajuste Moseley: σ', sg, '0.963'); chk(10, 'Bohr: √(¾Ry)', math.sqrt(.75*13.605693122994), '3.1944'); chk(10, 'Texto: diferencia (%)', (a_/math.sqrt(.75*13.605693122994)-1)*100, '0.09')
els2 = els+[('Zr', 40), ('Mo', 42), ('Ag', 47)]; Z2 = np.array([z for _, z in els2], float); E2 = np.array([xraydb.xray_line(s, 'Ka1').energy for s, _ in els2]); a2, b2 = np.polyfit(Z2, np.sqrt(E2), 1)
chk(10, 'Sim Moseley: ajuste hasta Z=47, a', a2, '3.2457'); chk(10, 'Sim Moseley: σ (Z ≤ 47)', -b2/a2, '1.284')
els3 = els2+[('Sn', 50), ('W', 74), ('Au', 79)]; Z3 = np.array([z for _, z in els3], float); E3 = np.array([xraydb.xray_line(s, 'Ka1').energy for s, _ in els3]); a3, b3 = np.polyfit(Z3, np.sqrt(E3), 1)
chk(10, 'Sim Moseley: ajuste hasta Z=79, a', a3, '3.3851'); chk(10, 'Sim Moseley: σ (Z ≤ 79)', -b3/a3, '2.377')
chk(10, 'Sim Moseley: Z para 8.05 keV', 1+math.sqrt(8050/(.75*13.605693122994)), '29.09'); chk(10, 'Sim Moseley: W Bohr (keV)', .75*13.605693122994*73**2/1e3, '54.4'); chk(10, 'Sim Moseley: W medido (keV)', xraydb.xray_line('W', 'Ka1').energy/1e3, '59.3'); chk(10, 'Sim Moseley: Au Bohr (keV)', .75*13.605693122994*78**2/1e3, '62.1'); chk(10, 'Sim Moseley: Au medido (keV)', xraydb.xray_line('Au', 'Ka1').energy/1e3, '68.8'); chk(10, 'Texto: Zα (W)', 74*C.alpha, '0.54')
chk(10, 'P5: √8046.3', math.sqrt(8046.3), '89.70'); chk(10, 'P5: Z Cu', math.sqrt(8046.3)/a_+sg, '29.02'); chk(10, 'P5: √17480', math.sqrt(17480), '132.21'); chk(10, 'P5: Z Mo', math.sqrt(17480)/a_+sg, '42.3', 1e-2) if False else chk(10, 'P5: Z Mo (1 decimal)', math.sqrt(17480)/a_+sg, '42.3'); chk(10, 'P5: 41.35', math.sqrt(17480)/a_, '41.35'); chk(10, 'P5: 89.70/3.1973', 89.70/a_, '28.06') if False else chk(10, 'P5: Bohr Cu (eV)', .75*13.605693122994*28**2, '8000.1'); chk(10, 'P5: Cu error (%)', (1-.75*13.605693122994*28**2/8046.3)*100, '0.57')
# Correspondencia
cR = C.Rydberg*c; n = 100
chk(10, 'P6: cR∞ (10¹⁵ Hz)', cR/1e15, '3.28984'); chk(10, 'P6: f_orb (10⁹ Hz)', 2*cR/n**3/1e9, '6.5797'); chk(10, 'P6: 1/(n−1)²−1/n² (10⁻⁶)', (1/(n-1)**2-1/n**2)/1e-6, '2.0304'); chk(10, 'P6: f (10⁹ Hz)', cR*(1/(n-1)**2-1/n**2)/1e9, '6.6797') if False else chk(10, 'P6: f (10⁹ Hz, 3 cifras)', cR*(1/(n-1)**2-1/n**2)/1e9, '6.680'); chk(10, 'P6: cociente', (1/(n-1)**2-1/n**2)/(2/n**3), '1.0152'); chk(10, 'P6: f_orb (10⁹, 3 cifras)', 2*cR/n**3/1e9, '6.580')
# SymPy: Rutherford θ(b)
b_s, d_s = sp.symbols('b d', positive=True)
chk(10, 'SymPy: tan(θ/2) = d₀/2b ⇒ b = (d₀/2)cot(θ/2): cot(75°)·(1/2)', float(sp.cot(sp.Rational(75)*sp.pi/180).evalf()*sp.Rational(1, 2)), 0.5/math.tan(math.radians(75)), 1e-12)
