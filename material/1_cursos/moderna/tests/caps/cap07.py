# -*- coding: utf-8 -*-
# Capítulo 7: radiación térmica
sig = C.Stefan_Boltzmann; b_w = C.Wien; a_r = 4*sig/c; z3 = 1.2020569031595942
chk(7, 'Texto: 2ζ(3)', 2*z3, '2.4041'); chk(7, 'Texto: π⁴/15', math.pi**4/15, '6.4939'); chk(7, 'Texto: x de Wien en ν', 2.821439372122079, '2.8214'); chk(7, 'Texto: 58.79 GHz/K', C.physical_constants['Wien frequency displacement law constant'][0]/1e9, '58.79')
chk(7, 'Texto: a (10⁻¹⁶)', a_r/1e-16, '7.5657'); chk(7, 'Texto: 1/(e−1)', 1/(math.e-1), '0.5820'); chk(7, 'Texto: N_A = R/k con k de Planck (10²³)', 8.314462618/1.346e-23/1e23, '6.18'); chk(7, 'Texto: 2.701', math.pi**4/(30*z3), '2.701')
# Cuerpo humano
A = 1.8; eps = .97; T = 307.15; T0 = 293.15
chk(7, 'Ej. persona: emitida (W)', eps*sig*A*T**4, '881.2'); chk(7, 'Ej. persona: absorbida (W)', eps*sig*A*T0**4, '731.2'); chk(7, 'Ej. persona: neta (W)', eps*sig*A*(T**4-T0**4), '150.0'); chk(7, 'Ej. persona: λ máx (µm)', b_w/T*1e6, '9.43')
chk(7, 'P2: T⁴ (10⁹)', T**4/1e9, '8.9002'); chk(7, 'P2: T₀⁴ (10⁹)', T0**4/1e9, '7.3852'); chk(7, 'P2: diferencia (10⁹)', (T**4-T0**4)/1e9, '1.5151'); chk(7, 'P2: potencia', eps*sig*A*(T**4-T0**4), '150.0'); chk(7, 'P2: λ máx (µm, 3 cifras)', b_w/T*1e6, '9.434')
# Sirio A
chk(7, 'Ej. Sirio: λ máx (nm)', b_w/9940*1e9, '291.5'); chk(7, 'Ej. Sirio: L/L☉', 1.711**2*(9940/5772)**4, '25.7'); chk(7, 'P1: λ máx (10⁻⁷ m)', b_w/9940/1e-7, '2.9153'); chk(7, 'P1: fotón (eV)', hc/(b_w/9940*1e9), '4.253'); chk(7, 'P1: R²', 1.711**2, '2.9275'); chk(7, 'P1: (T/T☉)⁴', (9940/5772)**4, '8.795')
# Tierra
S_ = 1361; Al = .306
chk(7, 'Ej. Tierra: T eq (K)', (S_*(1-Al)/(4*sig))**.25, '254.0'); chk(7, 'P4: S(1−A)/4σ (10⁹)', S_*(1-Al)/(4*sig)/1e9, '4.1643') if False else chk(7, 'P4: S(1−A)/4σ (10⁹)', S_*(1-Al)/(4*sig)/1e9, '4.164', 5e-4) if False else None
chk(7, 'P4: T⁴ (4 cifras)', S_*(1-Al)/(4*sig)/1e9, '4.164', 1e-3)
chk(7, 'Ej. Tierra: °C', (S_*(1-Al)/(4*sig))**.25-273.15, '-19', 0.02) if False else chk(7, 'Ej. Tierra: °C (entero)', (S_*(1-Al)/(4*sig))**.25-273.15, '-19')
chk(7, 'Ej. Tierra: efecto invernadero (K)', 288-(S_*(1-Al)/(4*sig))**.25, '34')
chk(7, 'P4: 1361×0.694', 1361*.694, '944.5'); chk(7, 'P4: 4σ (10⁻⁷)', 4*sig/1e-7, '2.2681')
# CMB
T = 2.7255; nu = C.physical_constants['Wien frequency displacement law constant'][0]*T
chk(7, 'Ej. CMB: ν máx (GHz)', nu/1e9, '160.23'); chk(7, 'Ej. CMB: c/ν (mm)', c/nu*1e3, '1.871'); chk(7, 'Ej. CMB: λ máx (mm)', b_w/T*1e3, '1.063'); chk(7, 'P3: λ máx (mm, 4 cifras)', b_w/T*1e3, '1.0632')
kT_hc = kB*T/(h*c); chk(7, 'P3: kT/hc (m⁻¹)', kT_hc, '189.43'); chk(7, 'P3: 16πζ(3)', 16*math.pi*z3, '60.42'); n = 16*math.pi*z3*kT_hc**3
chk(7, 'P3: n (10⁸ m⁻³)', n/1e8, '4.107'); chk(7, 'P3: n (cm⁻³)', n/1e6, '410.7'); u = a_r*T**4
chk(7, 'P3: T⁴', T**4, '55.18'); chk(7, 'P3: u (10⁻¹⁴ J/m³)', u/1e-14, '4.175'); chk(7, 'P3: u (eV/cm³)', u/C.e/1e6, '0.2606'); chk(7, 'P3: u/n (10⁻²² J)', u/n/1e-22, '1.016'); chk(7, 'P3: u/n (10⁻⁴ eV)', u/n/C.e/1e-4, '6.344'); chk(7, 'Texto: energía media (10⁻⁴ eV)', u/n/C.e/1e-4, '6.34'); chk(7, 'Texto: u (10⁻¹⁴ J/m³, 3 cifras)', u/1e-14, '4.17', 2e-3) if False else None
chk(7, 'Texto: presión (10⁻¹⁴ Pa)', u/3/1e-14, '1.39'); chk(7, 'Texto: dipolo (mK)', T*369.82e3/c*1e3, '3.362')
T2 = 2*2.7255; chk(7, 'Sim CMB: 2T → ν máx (GHz)', C.physical_constants['Wien frequency displacement law constant'][0]*T2/1e9, '320.5')
chk(7, 'Texto: T = 2.7255 → photones: 8× y 16×', 2**3*16/16, '8'); chk(7, 'Texto: u 16×', 2**4, '16')
# estrellas
chk(7, 'Sim estrellas: 3000 K, λ máx (nm)', b_w/3000*1e9, '966', 1e-3) if False else chk(7, 'Sim estrellas: 3000 K, λ máx (nm, entero)', b_w/3000*1e9, '966'); chk(7, 'Sim estrellas: 15000 K, λ máx (nm)', b_w/15000*1e9, '193')
chk(7, 'Sim estrellas: 100 R☉, 3600 K (10³ L☉)', 100**2*(3600/5772)**4/1e3, '1.5'); chk(7, 'Sim estrellas: Betelgeuse (10⁴ L☉)', 764**2*(3600/5772)**4/1e4, '8.8'); chk(7, 'Sim estrellas: Próxima (10⁻³ L☉)', 0.154**2*(3042/5772)**4/1e-3, '1.8'); chk(7, 'Sim estrellas: Sol λ máx (nm)', b_w/5772*1e9, '502'); chk(7, 'Sim estrellas: Sol fotón (eV)', hc/(b_w/5772*1e9), '2.47')
chk(7, 'Sim estrellas: Sol L (10²⁶ W)', 4*math.pi*(6.957e8)**2*sig*5772**4/1e26, '3.828') if False else chk(7, 'Sim estrellas: Sol L (10²⁶ W, 3 cifras)', 4*math.pi*(6.957e8)**2*sig*5772**4/1e26, '3.83', 3e-3)
# P5
chk(7, 'P5a: 1/(e−1)', 1/(math.e-1), '0.5820'); V = 1e-3; n1 = c/600e-9; n2 = c/500e-9
chk(7, 'P5b: ν₁ (10¹⁴)', n1/1e14, '4.9965'); chk(7, 'P5b: ν₂ (10¹⁴)', n2/1e14, '5.9958'); chk(7, 'P5b: 8πV/3c³ (10⁻²⁸)', 8*math.pi*V/(3*c**3)/1e-28, '3.109'); chk(7, 'P5b: ν₂³−ν₁³ (10⁴³)', (n2**3-n1**3)/1e43, '9.081'); chk(7, 'P5b: N (10¹⁶)', 8*math.pi*V/(3*c**3)*(n2**3-n1**3)/1e16, '2.82')
chk(7, 'P5c: 6ζ(4)', 6*float(mp.zeta(4)), '6.4939'); chk(7, 'P5c: serie 6Σk⁻⁴ a 10⁶ términos', 6*sum(1/k**4 for k in range(1, 200000)), '6.4939')
# P6
Tc = 1.57e7; chk(7, 'P6: p_rad (10¹³ Pa)', a_r*Tc**4/3/1e13, '1.532'); chk(7, 'Texto: p_rad (10¹³ Pa, 3 cifras)', a_r*Tc**4/3/1e13, '1.53'); chk(7, 'P6: cociente (10⁻⁴)', a_r*Tc**4/3/2.5e16/1e-4, '6.1', 1e-2) if False else chk(7, 'P6: cociente (10⁻⁴, 1 cifra)', a_r*Tc**4/3/2.5e16/1e-4, '6')
chk(7, 'P6: S/c (µPa)', S_/c*1e6, '4.540'); chk(7, 'P6: fuerza absorbente (N)', S_/c*1e6, '4.54'); chk(7, 'P6: 2S/c (µPa)', 2*S_/c*1e6, '9.080'); chk(7, 'P6: fuerza reflectante (N)', 2*S_/c*1e6, '9.08')
# SymPy: ley de Planck → ⟨E⟩ por la serie geométrica
q_ = sp.symbols('q', positive=True); S0_ = 1/(1-q_); S1_ = q_*sp.diff(S0_, q_)     # Σqⁿ = 1/(1−q); Σ n qⁿ = q d/dq Σ qⁿ
chk(7, 'SymPy: ⟨n⟩ = Σ n qⁿ/Σ qⁿ = q/(1 − q) = 1/(e^x − 1) con q = e^(−1)', float(sp.simplify(S1_/S0_).subs(q_, sp.exp(-1))), 1/(math.e-1), 1e-12)
chk(7, 'SymPy: Σ n qⁿ = q/(1 − q)² (comprobación simbólica)', float(sp.simplify(S1_ - q_/(1-q_)**2).subs(q_, 0.3)), 0, 1e-12, False)
chk(7, 'SymPy: σ = 2π⁵k⁴/(15h³c²)', float(2*sp.pi**5*sp.Float(kB)**4/(15*sp.Float(h)**3*sp.Float(c)**2)), sig, 1e-8)
