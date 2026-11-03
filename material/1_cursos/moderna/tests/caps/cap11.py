# -*- coding: utf-8 -*-
# Capítulo 11: caja, dinámica, puntos cuánticos
E1 = lambda L, m=me: math.pi**2*hbar**2/(2*m*L*L)/e
chk(11, 'Ej. E₁(1 nm) (eV)', E1(1e-9), '0.37603'); chk(11, 'Ej. E₁(0.4 nm)', E1(0.4e-9), '2.350'); chk(11, 'Ej. E₂', 4*E1(0.4e-9), '9.401'); chk(11, 'Ej. E₃', 9*E1(0.4e-9), '21.15'); chk(11, 'Ej. 3E₁', 3*E1(0.4e-9), '7.051'); chk(11, 'Ej. λ(2→1)', hc/(3*E1(0.4e-9)), '175.85'); chk(11, 'Ej. 5E₁', 5*E1(0.4e-9), '11.75'); chk(11, 'Ej. λ(3→2)', hc/(5*E1(0.4e-9)), '105.5')
chk(11, 'Ej. 1 nm: 5E₁ (eV)', 5*E1(1e-9), '1.88'); chk(11, 'Ej. 1 nm: λ(3→2) (nm)', hc/(5*E1(1e-9)), '659', 1e-3) if False else chk(11, 'Ej. 1 nm: λ(3→2) (nm, entero)', hc/(5*E1(1e-9)), '659'); chk(11, 'Ej. protón 10 fm (MeV)', E1(10e-15, C.m_p)/1e6, '2.05')
chk(11, 'P1: E₁ (0.4 nm, 3 cifras)', E1(0.4e-9), '2.350'); chk(11, 'P1: 0.376030', E1(1e-9), '0.376030'); chk(11, 'P1: λ(2→1)', hc/(3*E1(0.4e-9)), '175.85')
# sim caja
chk(11, 'Sim caja: E₃ (1 nm)', 9*E1(1e-9), '3.384'); chk(11, 'Sim caja: 5E₁ (eV, 3 cifras)', 5*E1(1e-9), '1.880'); chk(11, 'Sim caja: λ(3→2) (nm)', hc/(5*E1(1e-9)), '659.4'); P3 = 0.5-(math.sin(2*3*math.pi*.75)-math.sin(2*3*math.pi*.25))/(6*math.pi); chk(11, 'Sim caja: P(n=3, [¼,¾]) (%)', P3*100, '39.4'); chk(11, 'Sim caja: P(n=1)', (.5+1/math.pi)*100, '81.8'); chk(11, 'Sim caja: E₁(0.1 nm)', E1(1e-10), '37.6')
chk(11, 'Sim caja: ΔxΔp/(ħ/2) n=1', math.sqrt(math.pi**2/3-2), '1.136') if False else chk(11, 'Sim caja: ΔxΔp/(ħ/2) n=1 (3 cifras)', math.sqrt(math.pi**2/3-2), '1.14', 1e-2) if False else chk(11, 'Sim caja: n=1 (4 decimales)', math.sqrt(math.pi**2/3-2), '1.1357'); chk(11, 'Sim caja: n=8', math.sqrt(64*math.pi**2/3-2), '14.4')
# P2
for n_, v in ((1, '0.1955'), (2, '0.4022'), (3, '0.3333')): chk(11, f'P2: P(n={n_}, [0, L/3])', 1/3-(math.sin(2*n_*math.pi/3))/(2*n_*math.pi), v)
chk(11, 'P2: sen(2π/3)/2π', math.sin(2*math.pi/3)/(2*math.pi), '0.1378'); chk(11, 'P2: sen(4π/3)/4π', -math.sin(4*math.pi/3)/(4*math.pi), '0.0689'); chk(11, 'P2: ½ + 1/π', .5+1/math.pi, '0.8183')
# P3
dx = lambda n: math.sqrt(1/12-1/(2*n*n*math.pi**2))
chk(11, 'P3: Δx n=1', dx(1), '0.1808'); chk(11, 'P3: Δx n=10', dx(10), '0.2878'); chk(11, 'P3: ΔxΔp n=1 (ħ)', dx(1)*math.pi, '0.568'); chk(11, 'P3: ΔxΔp/(ħ/2) n=10', math.sqrt(100*math.pi**2/3-2), '18.083')
# P4: superposición
dE = 3*E1(1e-9); T = h/(dE*e)
chk(11, 'P4/Ej: ΔE (eV)', dE, '1.1281'); chk(11, 'P4: ΔE (10⁻¹⁹ J)', dE*e/1e-19, '1.8074'); chk(11, 'P4: ν (10¹⁴ Hz)', dE*e/h/1e14, '2.728'); chk(11, 'P4: λ (nm)', hc/dE, '1099'); chk(11, 'P4: T (fs)', T*1e15, '3.666'); chk(11, 'P4: ⟨E⟩ (eV)', 2.5*E1(1e-9), '0.940'); trev = 4*me*1e-18/(math.pi*hbar)
chk(11, 'P4: T_rev (10⁻¹⁴ s)', trev/1e-14, '1.0998'); chk(11, 'P4: T_rev (fs)', trev*1e15, '10.998'); chk(11, 'P4: T_rev/T', trev/T, '3.0', 1e-3) if False else chk(11, 'P4: T_rev/T (1 decimal)', trev/T, '3.0')
# Brus
Eg, mE, mH, eps = 1.74, 0.13, 0.45, 10.6
def brus(R): return Eg+math.pi**2*hbar**2/(2*me*R*R)*(1/mE+1/mH)/e-1.786*e*e/(4*math.pi*C.epsilon_0*eps*R)/e
chk(11, 'P5: 1/0.13+1/0.45', 1/mE+1/mH, '9.9145'); chk(11, 'P5: confinamiento R=2 nm', math.pi**2*hbar**2/(2*me*(2e-9)**2)*(1/mE+1/mH)/e, '0.9320'); chk(11, 'P5: 0.09401', E1(2e-9), '0.09401'); chk(11, 'P5: Coulomb', 1.786*1.43996454/(eps*2), '0.1213'); chk(11, 'P5: E(2)', brus(2e-9), '2.551'); chk(11, 'P5: λ(2)', hc/brus(2e-9), '486.1'); chk(11, 'P5: E(1.5)', brus(1.5e-9), '3.235'); chk(11, 'P5: λ(1.5)', hc/brus(1.5e-9), '383'); chk(11, 'P5: E(3)', brus(3e-9), '2.073'); chk(11, 'P5: λ(3)', hc/brus(3e-9), '598')
chk(11, 'Sim puntos: E(2.5)', brus(2.5e-9), '2.239'); chk(11, 'Sim puntos: λ(2.5)', hc/brus(2.5e-9), '554'); chk(11, 'Sim puntos: E(4)', brus(4e-9), '1.912'); chk(11, 'Sim puntos: λ(4)', hc/brus(4e-9), '648'); chk(11, 'Sim puntos: λ(E_g)', hc/1.74, '713')
chk(11, 'Texto: 1.43996 eV·nm', e*e/(4*math.pi*C.epsilon_0)/e*1e9, '1.43996'); chk(11, 'Texto: conf/E_g CdSe R=2 (%)', 0.9320/1.74*100, '54'); chk(11, 'Texto: Coulomb/E_g (%)', 0.1213/1.74*100, '7')
chk(11, 'Sim puntos: confinamiento InP 2 nm vs CdSe', math.pi**2*hbar**2/(2*me*(2e-9)**2)*(1/0.08+1/0.6)/e, '1.332')
# Yu et al.: D(λ) para λ=580
lamb = 580.0; D = 1.6122e-9*lamb**4-2.6575e-6*lamb**3+1.6242e-3*lamb**2-0.4277*lamb+41.57; chk(11, 'Texto: calibración de Yu et al. (D en nm para 580 nm)', D, '3.8')
# P6
chk(11, 'P6: 0.64+0.36', .64+.36, '1.00'); chk(11, 'P6: ⟨E⟩ (E₁)', .64+.36*4, '2.08'); chk(11, 'P6: ⟨E⟩ (eV)', 2.08*E1(1e-9), '0.7821'); chk(11, 'P6: ⟨E²⟩ (E₁²)', .64+.36*16, '6.40'); chk(11, 'P6: ΔE (E₁)', math.sqrt(6.4-2.08**2), '1.440'); chk(11, 'P6: ΔE (eV)', math.sqrt(6.4-2.08**2)*E1(1e-9), '0.5415')
# SymPy: normalización
x, L_, n_ = sp.symbols('x L n', positive=True); A_ = sp.symbols('A', positive=True)
nrm = sp.integrate((A_*sp.sin(n_*sp.pi*x/L_))**2, (x, 0, L_)).subs(n_, 3)
chk(11, 'SymPy: ∫A²sen²(3πx/L)dx = A²L/2 → A = √(2/L) con L = 1', float(sp.solve(sp.Eq(nrm.subs(L_, 1), 1), A_)[0]), math.sqrt(2), 1e-12)
chk(11, 'SymPy: ∫ψ₁ψ₂ dx = 0 (ortogonalidad)', float(sp.integrate(2*sp.sin(sp.pi*x)*sp.sin(2*sp.pi*x), (x, 0, 1))), 0, 1e-12, False)
# E_n con la relación de dispersión de de Broglie: λ = 2L/n
chk(11, 'Texto: E_n con λ = 2L/n: p = h/λ → p²/2m = n²h²/(8mL²) = n²π²ħ²/(2mL²)', (h/(2*1e-9/1))**2/(2*me)/e, E1(1e-9), 1e-9)
