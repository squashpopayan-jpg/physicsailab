# -*- coding: utf-8 -*-
# Capítulo 6: pozo infinito
u_ = C.u; mp_ = C.m_p; mn2 = 28.0134*u_
E1e = lambda L, m=me: math.pi**2*hbar**2/(2*m*L**2)/e   # eV
chk(6, 'E₁ del electrón en 1 nm (eV)', E1e(1e-9), '0.37603')
chk(6, 'P1: E₁ en 0.5 nm', E1e(0.5e-9), '1.5041'); chk(6, 'P1: E₂', 4*E1e(0.5e-9), '6.0165'); chk(6, 'P1: E₃', 9*E1e(0.5e-9), '13.537'); chk(6, 'P1: ΔE 3→2', 5*E1e(0.5e-9), '7.5206')
chk(6, 'P1: λ (nm)', hc/(5*E1e(0.5e-9)), '164.9')
chk(6, 'Sim: E₃ en 1 nm', 9*E1e(1e-9), '3.384'); chk(6, 'Sim: ΔE 3→4', 7*E1e(1e-9), '2.632'); chk(6, 'Sim: λ 3→4 (nm)', hc/(7*E1e(1e-9)), '471')
# probabilidades en la mitad central, SymPy
x = sp.symbols('x', positive=True)
for n_, v in ((1, '0.8183'), (2, '0.5000'), (3, '0.3939')):
    chk(6, f'P2: P_{n_} en [L/4, 3L/4] (SymPy)', float(sp.integrate(2*sp.sin(n_*sp.pi*x)**2, (x, sp.Rational(1, 4), sp.Rational(3, 4)))), v)
chk(6, 'P2: 1/2 + 1/π', 0.5+1/math.pi, '0.8183'); chk(6, 'P2: 1/2 − 1/(3π)', 0.5-1/(3*math.pi), '0.3939')
chk(6, 'Sim: P₁ en %', (0.5+1/math.pi)*100, '81.8'); chk(6, 'Sim: P₃ en %', (0.5-1/(3*math.pi))*100, '39.4'); chk(6, 'Sim: P₁ (4 cifras)', (0.5+1/math.pi)*100, '81.83')
# ⟨x²⟩, Δx, ΔxΔp (SymPy y fórmula)
for n_ in (1, 2, 3, 10):
    x2 = float(sp.integrate(2*x**2*sp.sin(n_*sp.pi*x)**2, (x, 0, 1)))
    chk(6, f'P6: ⟨x²⟩ n={n_} frente a la fórmula', 1/3-1/(2*n_**2*math.pi**2), x2, 1e-10)
dxl = lambda n_: math.sqrt(1/12-1/(2*n_**2*math.pi**2))
for n_, v in ((1, '1.1357'), (2, '3.3406'), (3, '5.2544'), (10, '18.083')):
    chk(6, f'P6: ΔxΔp/(ħ/2) para n={n_}', math.sqrt(n_**2*math.pi**2/3-2), v)
    chk(6, f'P6: coherencia 2·n·π·Δx/L', 2*n_*math.pi*dxl(n_), math.sqrt(n_**2*math.pi**2/3-2), 1e-12)
for n_, v in ((1, '0.1808'), (2, '0.2658'), (3, '0.2788'), (10, '0.2878')):
    chk(6, f'P6: Δx/L n={n_}', dxl(n_), v)
chk(6, 'Límite Δx/L = 1/√12', 1/math.sqrt(12), '0.2887'); chk(6, 'Sim: ΔxΔp/(ħ/2) ≈ nπ/√3 (coef.)', math.pi/math.sqrt(3), '1.814')
# caja nuclear y N₂
chk(6, 'Ej. protón 10 fm: E₁ (MeV)', E1e(10e-15, mp_)/1e6, '2.05'); chk(6, 'Ej. 3E₁ (MeV)', 3*E1e(10e-15, mp_)/1e6, '6.14')
chk(6, 'Sim: protón en 1 nm (10⁻⁴ eV)', E1e(1e-9, mp_)/1e-4, '2.05')
chk(6, 'Ej. cociente nuclear/atómico (≈ 5×10⁴)', E1e(10e-15, mp_)/E1e(1e-10), '5.4e4', 3e-2) if False else chk(6, 'Ej. E₁(p, 10 fm)/E₁(e, 1 Å) (10⁴)', E1e(10e-15, mp_)/E1e(1e-10)/1e4, '5.4')
EN = E1e(0.1, mn2); kT = kB*300/e
chk(6, 'Ej. N₂ en 10 cm: E₁ (10⁻²² eV)', EN/1e-22, '7.36'); chk(6, 'Ej. kT a 300 K (eV)', kT, '0.02585'); chk(6, 'Ej. kT/E₁ (10¹⁹)', kT/EN/1e19, '3.5'); chk(6, 'Ej. N(kT) (10²⁹)', math.pi/6*(kT/EN)**1.5/1e29, '1.1')
chk(6, 'Sim: espaciado N₂ 10 cm (10⁻²¹ eV)', 3*EN/1e-21, '2.2')
# tiempos de renacimiento
Tr = lambda L, m=me: 4*m*L**2/(math.pi*hbar)
chk(6, 'Ej. T_ren 1 nm (10⁻¹⁴ s)', Tr(1e-9)/1e-14, '1.0998'); chk(6, 'Ej. T_ren (fs)', Tr(1e-9)*1e15, '11.0'); chk(6, 'Ej. T_ren 0.1 nm (fs)', Tr(1e-10)*1e15, '0.110'); chk(6, 'P3: T_ren 0.1 nm (10⁻¹⁶ s)', Tr(1e-10)/1e-16, '1.0998')
chk(6, 'Ej. 2π ħ/E₁ = 4mL²/(πħ)', 2*math.pi*hbar/(E1e(1e-9)*e), Tr(1e-9), 1e-12)
chk(6, 'Ej. 2L/v = T/40 con k₀L = 20π', (2*(20*math.pi)**-1/ (1.0))/(4/math.pi)*0+ (2/(20*math.pi))/(4/math.pi), '0.0250')
chk(6, 'Sim: v = 20π', 20*math.pi, '62.8'); chk(6, 'Sim: 2/v', 2/(20*math.pi), '0.032'); chk(6, 'Sim: T (u. a.) = 4/π', 4/math.pi, '1.2732')
# revivals: comprobación numérica de las identidades T y T/2 y T/4 con 200 modos
M = 200; xs = np.linspace(0, 1, 4001); w = np.zeros(M+1);
ph = lambda n_, xx: math.sqrt(2)*np.sin(n_*math.pi*xx)
g0 = lambda xx: np.exp(-(xx-0.3)**2/(4*0.05**2))*np.exp(1j*8*math.pi*xx)
g0v = g0(xs); g0v = g0v/math.sqrt(np.trapezoid(abs(g0v)**2, xs))
cn = np.array([np.trapezoid(ph(n_, xs)*g0v, xs) for n_ in range(1, M+1)])
def psi_t(t):
    E1_ = math.pi**2/2; out = np.zeros_like(xs, dtype=complex)
    for n_ in range(1, M+1): out += cn[n_-1]*ph(n_, xs)*np.exp(-1j*E1_*n_*n_*t)
    return out
Tn = 4/math.pi
p0 = psi_t(0.0)
chk(6, 'Revivals: Ψ(T) = Ψ(0) (error máx.)', np.max(abs(psi_t(Tn)-p0)), 0.0, 1e-9, rel=False)
chk(6, 'Revivals: Ψ(T/2)(x) = −Ψ(0)(L−x) (error máx.)', np.max(abs(psi_t(Tn/2)-(-p0[::-1]))), 0.0, 1e-9, rel=False)
pq = psi_t(Tn/4); sol = 0.5*((1-1j)*p0-(1+1j)*p0[::-1])
chk(6, 'Revivals: Ψ(T/4) = ½[(1−i)Ψ₀(x) − (1+i)Ψ₀(L−x)] (error máx.)', np.max(abs(pq-sol)), 0.0, 1e-9, rel=False)
chk(6, 'Revivals: norma conservada en T/4', np.trapezoid(abs(pq)**2, xs), 1.0, 1e-4)
# expansión súbita a = 2
P = lambda n_: 0.5 if n_ == 2 else (0.0 if n_ % 2 == 0 else 32/(math.pi**2*(n_*n_-4)**2))
Pn = lambda n_: float(sp.integrate(2*sp.sin(sp.pi*x)*sp.sin(n_*sp.pi*x/2)*1, (x, 0, 1)))**2/2*1 if False else (math.sqrt(2)*float(sp.integrate(sp.sin(sp.pi*x)*sp.sin(n_*sp.pi*x/2), (x, 0, 1))))**2
for n_ in (1, 2, 3, 4, 5, 6, 7):
    chk(6, f'P4: P_{n_} (SymPy) frente a la fórmula', P(n_), Pn(n_), 1e-10) if P(n_) > 0 else chk(6, f'P4: P_{n_} = 0 (SymPy)', 0.0, Pn(n_), 1e-12, rel=False)
chk(6, 'P4: P₁', P(1), '0.3603'); chk(6, 'P4: P₃', P(3), '0.1297'); chk(6, 'P4: P₅', P(5), '0.00735')
chk(6, 'P4: Σ P_n = 1 (mpmath, serie infinita)', 0.5+float(mp.nsum(lambda k: 32/(mp.pi**2*((2*k+1)**2-4)**2), [0, mp.inf])), 1.0, 1e-10)
chk(6, 'P4: ⟨E⟩ = E₁(L) = 4E₁(2L) (mpmath)', float(0.5*4*math.pi**2/8+mp.nsum(lambda k: 32*(2*k+1)**2/(mp.pi**2*((2*k+1)**2-4)**2)*mp.pi**2/8, [0, mp.inf])), math.pi**2/2, 1e-8)
chk(6, 'Sim: ⟨E⟩ truncada a 80 términos', sum(P(n_)*n_*n_*math.pi**2/8 for n_ in range(1, 81)), '4.910'); chk(6, 'Sim: E₁(L)', math.pi**2/2, '4.935')
# Sim a = 3 y 1.2 (lecturas)
def Pa(n_, a):
    return (math.sqrt(2)/math.sqrt(a)*float(sp.integrate(sp.sin(sp.pi*x)*sp.sin(n_*sp.pi*x/a), (x, 0, 1)))*math.sqrt(2)/math.sqrt(2))**2
# verificación independiente por cuadratura numérica
def Pq(n_, a):
    f = lambda t: math.sqrt(2)*math.sin(math.pi*t)*math.sqrt(2/a)*math.sin(n_*math.pi*t/a)
    return integrate.quad(f, 0, 1)[0]**2
chk(6, 'Sim: P₁ con a = 3', Pq(1, 3), '0.1282'); chk(6, 'Sim: P₂ con a = 3', Pq(2, 3), '0.3283'); chk(6, 'Sim: P₃ con a = 3', Pq(3, 3), '0.3333'); chk(6, 'Sim: P₄ con a = 3', Pq(4, 3), '0.1675')
chk(6, 'Sim: P₁ con a = 1.2', Pq(1, 1.2), '0.9044')
# degeneraciones
cnt3 = lambda E_: sorted((a_, b_, c_) for a_ in range(1, 12) for b_ in range(1, 12) for c_ in range(1, 12) if a_*a_+b_*b_+c_*c_ == E_)
chk(6, 'P5: g(14) cúbica', len(cnt3(14)), '6'); chk(6, 'P5: g(27) cúbica', len(cnt3(27)), '4')
chk(6, 'P5: g(50) cuadrada', len([1 for a_ in range(1, 12) for b_ in range(1, 12) if a_*a_+b_*b_ == 50]), '3'); chk(6, 'Sim: g(5) cuadrada', len([1 for a_ in range(1, 12) for b_ in range(1, 12) if a_*a_+b_*b_ == 5]), '2'); chk(6, 'Sim: g(25) cuadrada', len([1 for a_ in range(1, 12) for b_ in range(1, 12) if a_*a_+b_*b_ == 25]), '2')
# ley de Weyl: número de estados 3D
R2 = 10000; Nex = sum(1 for a_ in range(1, 101) for b_ in range(1, 101) for c_ in range(1, 101) if a_*a_+b_*b_+c_*c_ <= R2)
chk(6, 'Weyl: N(E = 10⁴ E₁) frente a (π/6)(E/E₁)^{3/2} (≈ 1 %)', math.pi/6*R2**1.5, Nex, 3e-2)
# 2D rectangular
rr = 1.2; chk(6, 'Sim: E(2,1) con L_y/L_x = 1.2', 4+(1/rr)**2, '4.69'); chk(6, 'Sim: E(1,2)', 1+(2/rr)**2, '3.78'); chk(6, 'Sim: |ΔE|', abs(4+(1/rr)**2-1-(2/rr)**2), '0.92')
