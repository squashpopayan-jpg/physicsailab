# -*- coding: utf-8 -*-
# Capítulo 14: átomo de hidrógeno
Ry = 13.605693; a0 = 52.9177210; Eh = 2*Ry
mmu = 206.7682830; mpr = 1836.15267343; mHe = 7294.29954; mLi = 12786.39
red = lambda M: M/(1+M)
# Problema 1
chk(14, 'P1: Ry', Ry, '13.6057'); chk(14, 'P1: a₀ (pm)', a0, '52.918')
chk(14, 'P1: positronio E₁', Ry*0.5, '6.803'); chk(14, 'P1: positronio a (pm)', 2*a0, '105.8')
mumu = mmu*mpr/(mmu+mpr); chk(14, 'P1/Ej.: μ del hidrógeno muónico (mₑ)', mumu, '185.84')
chk(14, 'P1: muónico E₁ (eV)', Ry*mumu, '2528.5'); chk(14, 'P1: muónico a (fm)', a0/mumu*1e3, '284.7'); chk(14, 'P1: muónico a (pm)', a0/mumu, '0.2847')
chk(14, 'P1: 206.768·1836.153', mmu*mpr, 379658.1, 1e-6); chk(14, 'P1: 206.768 + 1836.153', mmu+mpr, '2042.921')
chk(14, 'P1: He⁺ E₁ (masa infinita)', 4*Ry, '54.42'); chk(14, 'P1: He⁺ a (pm)', a0/2, '26.46')
chk(14, 'P1: Li²⁺ E₁ (masa infinita)', 9*Ry, '122.45'); chk(14, 'P1: Li²⁺ a (pm)', a0/3, '17.64')
chk(14, 'Sec.: el muónico es 186 veces menor', mumu, 186.0, 5e-3)
# Problema 2 y ejemplo
chk(14, 'P2/Ej.: ⟨r⟩ (Å)', 1.5*a0/100, '0.794'); chk(14, 'P2/Ej.: ⟨V⟩ (eV)', -Eh, '-27.211'); chk(14, 'Ej.: ⟨V⟩ (2 cifras)', -Eh, '-27.21'); chk(14, 'P2: ⟨T⟩ (eV)', Eh/2, '13.606'); chk(14, 'Ej.: ⟨T⟩ (2 cifras)', Eh/2, '13.61')
P1 = integrate.quad(lambda x: 4*x*x*math.exp(-2*x), 0, 1)[0]; P2 = integrate.quad(lambda x: 4*x*x*math.exp(-2*x), 2, np.inf)[0]
chk(14, 'P2/Ej.: P(r < a₀)', P1, '0.3233'); chk(14, 'P2/Ej.: 1 − 5e⁻²', 1-5*math.exp(-2), '0.3233'); chk(14, 'P2/Ej.: P(r > 2a₀)', P2, '0.2381'); chk(14, 'P2/Ej.: 13e⁻⁴', 13*math.exp(-4), '0.2381')
chk(14, 'P2: ⟨r⟩ = 4·3!/2⁴', 4*math.factorial(3)/2**4, '1.5')
chk(14, 'P2: |ψ(0)|² (10³⁰ m⁻³)', 1/(math.pi*(a0*1e-12)**3)/1e30, '2.148')
chk(14, 'Ej.: oscilador, P(región prohibida)', math.erfc(1), '0.1573', 1e-3)
chk(14, 'Sec.: radio de Rydberg n = 100 (µm)', 1e4*a0*1e-12*1e6, '0.5292', 1e-3)
# Problema 3: R20
Rf = lambda x: (1/math.sqrt(2))*(1-x/2)*math.exp(-x/2)
chk(14, 'P3: normalización de R₂₀', integrate.quad(lambda x: x*x*Rf(x)**2, 0, np.inf)[0], '1.0')
chk(14, 'P3: Γ(3) − Γ(4) + Γ(5)/4', math.factorial(2)-math.factorial(3)+math.factorial(4)/4, '2.0')
chk(14, 'P3: ⟨r⟩ de 2s', integrate.quad(lambda x: x**3*Rf(x)**2, 0, np.inf)[0], '6.0')
chk(14, 'P3: Γ(4) − Γ(5) + Γ(6)/4', math.factorial(3)-math.factorial(4)+math.factorial(5)/4, '12.0')
x = sp.symbols('x', positive=True); Pm = x**2*(1-x/2)**2*sp.exp(-x)
sol = sorted([float(t) for t in sp.solve(sp.diff(Pm, x), x)]); sol = [t for t in sol if t > 0 and abs(t-2) > 1e-9]
chk(14, 'P3: máximo interior (3 − √5)', sol[0], '0.764'); chk(14, 'P3: máximo exterior (3 + √5)', sol[1], '5.236'); chk(14, 'Sim: 3 − √5', 3-math.sqrt(5), '0.76'); chk(14, 'Sim: 3 + √5', 3+math.sqrt(5), '5.24')
chk(14, 'P3: d ln P/dx = 2/x − 2/(2−x) − 1 (SymPy)', 1.0 if sp.simplify(sp.diff(sp.log(Pm), x)-(2/x-2/(2-x)-1)) == 0 else 0.0, '1.0')
chk(14, 'P3: 2(2−x) − 2x − x(2−x) = x² − 6x + 4 (SymPy)', 1.0 if sp.expand(2*(2-x)-2*x-x*(2-x)-(x**2-6*x+4)) == 0 else 0.0, '1.0')
# Problema 4: terminación de la serie
def serie(n, l, rho):
    rho0 = 2*n; c = [1.0]
    for j in range(n-l-1): c.append(c[-1]*(2*(j+l+1)-rho0)/((j+1)*(j+2*l+2)))
    return sum(ci*rho**i for i, ci in enumerate(c))
for (n, l) in ((1, 0), (2, 0), (3, 1), (4, 2), (5, 0)):
    rr = np.array([0.31, 1.37, 4.3, 9.1]); ratio = serie(n, l, rr)/special.eval_genlaguerre(n-l-1, 2*l+1, 2*rr)
    chk(14, f'P4: la serie con ρ₀ = 2n reproduce L (n = {n}, l = {l}): razón constante', float(np.ptp(ratio)), 0.0, 1e-9, rel=False)
chk(14, 'P4: ∫ r²e^{−2κr} = 2/(2κ)³ (κ = 1.3)', integrate.quad(lambda r: r*r*math.exp(-2*1.3*r), 0, np.inf)[0], 2/(2*1.3)**3, 1e-10)
chk(14, 'P4: 1s: c₀κ = 2κ^{3/2} (κ = 0.7)', math.sqrt(4*0.7)*0.7, 2*0.7**1.5, 1e-12)
# Problema 5: 2p
R21 = lambda x: x*math.exp(-x/2)/math.sqrt(24)
rk = lambda k: integrate.quad(lambda x: x**(k+2)*R21(x)**2, 0, np.inf)[0]
for k, v in ((1, '5.0'), (2, '30.0'), (-1, '0.25'), (-2, '0.08333')): chk(14, f'P5: ⟨r^{k}⟩ de 2p', rk(k), v)
chk(14, 'P5: Γ(6)/24', math.factorial(5)/24, '5.0'); chk(14, 'P5: Γ(7)/24', math.factorial(6)/24, '30.0'); chk(14, 'P5: Γ(4)/24', math.factorial(3)/24, '0.25'); chk(14, 'P5: Γ(3)/24', math.factorial(2)/24, '0.08333')
chk(14, 'P5: Δr', math.sqrt(30-25), '2.236'); chk(14, 'P5: Δr/⟨r⟩', math.sqrt(5)/5, '0.447')
chk(14, 'P5: ⟨1/r²⟩ = 1/(8·1.5)', 1/(8*1.5), '0.08333'); chk(14, 'P5: ⟨r²⟩ = 2(20+1−6)', 2*(20+1-6), '30.0'); chk(14, 'P5: ⟨r⟩ = (12−2)/2', (12-2)/2, '5.0')
chk(14, 'P5: virial ⟨V⟩ = 2E₂', -rk(-1), 2*(-1/8), 1e-12)
# Problema 6: degeneración
chk(14, 'P6: g₁…g₄', 1.0 if [sum(2*l+1 for l in range(n)) for n in (1, 2, 3, 4)] == [1, 4, 9, 16] else 0.0, '1.0')
chk(14, 'P6: acumulado sin espín', 1.0 if list(np.cumsum([n*n for n in (1, 2, 3, 4)])) == [1, 5, 14, 30] else 0.0, '1.0')
chk(14, 'P6: acumulado con espín', 1.0 if list(np.cumsum([2*n*n for n in (1, 2, 3, 4)])) == [2, 10, 28, 60] else 0.0, '1.0')
chk(14, 'P6: n(n+1)(2n+1)/6 (n = 4)', 4*5*9/6, '30.0')
# Simulaciones
chk(14, 'Sim: nodos 3s (1.902)', 1.5*(3-math.sqrt(3)), '1.902'); chk(14, 'Sim: nodos 3s (7.098)', 1.5*(3+math.sqrt(3)), '7.098'); chk(14, 'Sim: nodos 3s en 1.90', 1.5*(3-math.sqrt(3)), '1.90'); chk(14, 'Sim: nodos 3s en 7.10', 1.5*(3+math.sqrt(3)), '7.10'); chk(14, 'Sim: ⟨r⟩ de 3s', (3*9)/2, '13.5')
mH = red(mpr)
chk(14, 'Sim: E₁ del H con masa reducida', Ry*mH, '13.598'); chk(14, 'Sim: E₁ del H (5 cifras)', Ry*mH, '13.598'); chk(14, 'Sim: ⟨V⟩ = 2E', 2*Ry*mH, '27.197'); chk(14, 'Sim: ⟨T⟩', Ry*mH, '13.598')
mD = red(3670.48296788); chk(14, 'Sim: E₁ del deuterio', Ry*mD, '13.602'); chk(14, 'Sim: E₁ del He⁺ (masa reducida)', 4*Ry*red(mHe), '54.415'); chk(14, 'Sim: E₁ del Li²⁺', 9*Ry*red(mLi), '122.44')
chk(14, 'Sim: a del H (pm)', a0/mH, '52.95'); chk(14, 'Sim: a del He⁺ (pm)', a0/(2*red(mHe)), '26.46'); chk(14, 'Sim: a del Li²⁺ (pm)', a0/(3*red(mLi)), '17.64')
lam = lambda E1, n1, n2: 1239.841984/(E1*(1/n1**2-1/n2**2))
chk(14, 'Sim: Hα del H (nm)', lam(Ry*mH, 2, 3), '656.47'); chk(14, 'Sim: Hα del D (nm)', lam(Ry*mD, 2, 3), '656.29'); chk(14, 'Sim: n = 3→2 del He⁺ (nm)', lam(4*Ry*red(mHe), 2, 3), '164.05'); chk(14, 'Sim: n = 3→2 del positronio (nm)', lam(Ry*0.5, 2, 3), '1312.2'); chk(14, 'Sim/Sec.: Lyα del positronio (nm)', lam(Ry*0.5, 1, 2), '243.0')
chk(14, 'Sim: 3→1 del muónico (nm)', lam(Ry*mumu, 1, 3), '0.5516'); chk(14, 'Sim: 3→1 del muónico (keV)', Ry*mumu*(1-1/9)/1e3, '2.25')
Q = lambda lo, hi: integrate.quad(lambda r: r**6*math.exp(-2*r/3), lo, hi)[0]/integrate.quad(lambda r: r**6*math.exp(-2*r/3), 0, np.inf)[0]*100
chk(14, 'Sim: 3d_xz, P(r < 2a₀) (%)', Q(0, 2), '0.047'); chk(14, 'Sim: 3d_xz, P(r > 18a₀) (%)', Q(18, np.inf), '4.58')
chk(14, 'Sim: ⟨r⟩ de 2s y 2p (a)', 1.0 if (3*4-0)/2 == 6 and (3*4-2)/2 == 5 else 0.0, '1.0')
