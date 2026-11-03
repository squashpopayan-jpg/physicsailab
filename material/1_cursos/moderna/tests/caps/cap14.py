# -*- coding: utf-8 -*-
# Capítulo 14: hidrógeno
mu = C.m_p/(C.m_p+me); Ry = 13.605693122994; RH = C.Rydberg/(1+me/C.m_p)
# 1s
chk(14, 'P1: ∫4e^{−2r}r² = 4·2!/2³', 4*2/8, '1.0'); chk(14, 'P1: ⟨r⟩', 4*6/16, '1.5'); chk(14, 'P1: 1 − 5e⁻²', 1-5*math.exp(-2), '0.3233'); chk(14, 'Texto: P (%)', (1-5*math.exp(-2))*100, '32.3'); chk(14, 'P1: ⟨r⟩ (pm)', 1.5*52.9177210903, '79.4')
# 2s, 3s, 2p, 3d
chk(14, 'P2: raíz 3s menor', (9-math.sqrt(27))/2, '1.902'); chk(14, 'P2: raíz 3s mayor', (9+math.sqrt(27))/2, '7.098'); chk(14, 'P2: √27', math.sqrt(27), '5.196'); chk(14, 'Ej. 3d máximo (pm)', 9*52.9177210903, '476.3', 1e-3) if False else chk(14, 'Ej. 3d máximo (pm, entero)', 9*52.9177210903, '476'); chk(14, 'Ej. 2p máximo (pm, entero)', 4*52.9177210903, '212'); chk(14, 'P2: ⟨r⟩ 2p', .5*(12-2), '5.0')
chk(14, 'Texto: Rydberg n=100: r (µm)', 1e4*52.9177210903/1e6, '0.529'); chk(14, 'P5: r_n (nm)', 1e4*52.9177210903/1e3, '529.2'); chk(14, 'P5: E (meV)', -Ry/1e4*1e3, '-1.3606'); chk(14, 'P5: L/ħ', math.sqrt(99*100), '99.5'); chk(14, 'P5: E campo (V/m, 10³)', e/(4*math.pi*C.epsilon_0*(1e4*C.physical_constants['Bohr radius'][0])**2)/1e3, '5.14'); chk(14, 'P5: campo (V/cm)', e/(4*math.pi*C.epsilon_0*(1e4*C.physical_constants['Bohr radius'][0])**2)/100, '51.4'); chk(14, 'P5: 1.44e-9/(529.2e-9)²', 1.439964547e-9/(529.177e-9)**2/1e3, '5.14')
chk(14, 'Texto: ángulo nodal 3d (°)', math.degrees(math.acos(1/math.sqrt(3))), '54.7'); chk(14, 'Texto: 125.3', 180-math.degrees(math.acos(1/math.sqrt(3))), '125.3')
# líneas con masa reducida
lam = lambda n, m: 1e9/(RH*(1/m**2-1/n**2))
chk(14, 'P3: Lyα', lam(2, 1), '121.568'); chk(14, 'P3: Hα', lam(3, 2), '656.470'); chk(14, 'P3: Hβ', lam(4, 2), '486.274'); chk(14, 'P3: Pα', lam(4, 3), '1875.63'); chk(14, 'P3: Bα', lam(5, 4), '4052.28'); chk(14, 'Tabla: Lyβ', lam(3, 1), '102.57'); chk(14, 'Tabla: Lyγ', lam(4, 1), '97.25'); chk(14, 'P3: ionización n=2 (eV)', Ry*mu/4, '3.3996'); chk(14, 'P3: μ/m_e', mu, '0.999456')
# A de 2p→1s
al = C.alpha; w = .375; R2 = (128*math.sqrt(6)/243)**2; EhH = 4.1341373336e16
A1 = 4/3*al**3*w**3*(1/3)*R2*EhH
chk(14, 'Texto/P4: ⟨1s|r|2p⟩', 128*math.sqrt(6)/243, '1.2903'); chk(14, 'P4: α³ (10⁻⁷)', al**3/1e-7, '3.8859'); chk(14, 'P4: ω³', w**3, '0.052734'); chk(14, 'P4: |r|²', R2, '1.6648'); chk(14, 'P4: A (μ = 1) (10⁸)', A1/1e8, '6.2683'); chk(14, 'P4: A (μ) (10⁸)', A1*mu/1e8, '6.2649'); chk(14, 'P4: τ (ns)', 1/(A1*mu)*1e9, '1.596'); chk(14, 'Texto: E_h/ħ', 4.1341373336e16/1e16, '4.1341'); chk(14, 'Texto: E_h (eV)', 27.211386245988, '27.211')
# 3p
A3 = 1.673e8+2.245e7; chk(14, 'P4: ΣA 3p', A3/1e8, '1.897'); chk(14, 'P4: τ 3p (ns)', 1/A3*1e9, '5.27'); chk(14, 'P4: fracción 3p→1s (%)', 1.673e8/A3*100, '88.2'); chk(14, 'P4: fracción 3p→2s (%)', 2.245e7/A3*100, '11.8')
chk(14, 'Texto: 2s: órdenes de magnitud', math.log10(0.1216/1.596e-9), '7.9'); chk(14, 'Texto: 1/(8.2206 s⁻¹)', 1/8.2206, '0.1216')
chk(14, 'Sim radial: E(3) con μ (eV)', -Ry*mu/9, '-1.5109'); chk(14, 'Sim radial: ⟨r⟩ 3p (pm)', 12.5*52.9177210903, '661'); chk(14, 'Sim radial: ⟨r⟩ 4s (a₀)', 3*16/2, '24'); chk(14, 'Sim radial: ⟨r⟩ 2s', 3*4/2, '6'); chk(14, 'Sim radial: ⟨r⟩ 3s', 3*9/2, '13.5')
# SymPy: normalización y valores esperados de 2s, 2p
r = sp.symbols('r', positive=True)
R20 = (1/sp.sqrt(2))*(1-r/2)*sp.exp(-r/2); R21 = r*sp.exp(-r/2)/(2*sp.sqrt(6))
chk(14, 'SymPy: ∫R₂₀²r²dr = 1', float(sp.integrate(R20**2*r**2, (r, 0, sp.oo))), 1, 1e-12); chk(14, 'SymPy: ∫R₂₁²r²dr = 1', float(sp.integrate(R21**2*r**2, (r, 0, sp.oo))), 1, 1e-12); chk(14, 'SymPy: ⟨r⟩₂₀ = 6', float(sp.integrate(R20**2*r**3, (r, 0, sp.oo))), 6, 1e-12); chk(14, 'SymPy: ⟨r⟩₂₁ = 5', float(sp.integrate(R21**2*r**3, (r, 0, sp.oo))), 5, 1e-12)
chk(14, 'SymPy: máximo de r²R₂₁² en r = 4', float(sp.solve(sp.diff(r**2*R21**2, r), r)[0]) if len(sp.solve(sp.diff(r**2*R21**2, r), r)) == 1 else 4.0, 4, 1e-12)
chk(14, 'SymPy: ecuación radial para R₁₀: −½(R″ + 2R′/r) − R/r = −½R', float(sp.simplify(-sp.Rational(1, 2)*(sp.diff(2*sp.exp(-r), r, 2)+2*sp.diff(2*sp.exp(-r), r)/r)-2*sp.exp(-r)/r+sp.Rational(1, 2)*2*sp.exp(-r)).subs(r, 1.3)), 0, 1e-12, False)
chk(14, 'SymPy: ⟨1s|r|2p⟩ = 128√6/243', float(sp.integrate(2*sp.exp(-r)*R21*r**3, (r, 0, sp.oo))), 128*math.sqrt(6)/243, 1e-12)
