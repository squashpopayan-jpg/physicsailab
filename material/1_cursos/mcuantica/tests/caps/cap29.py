# -*- coding: utf-8 -*-
# Capítulo 29: segunda cuantización
kB_ = 1.380649e-23; u = 1.66053906660e-27
# P1
chk(29, 'P1: a|3⟩', math.sqrt(3), '1.7321'); chk(29, 'P1: a†a|3⟩', math.sqrt(3)*math.sqrt(3), '3.0', 1e-12); chk(29, 'P1: [a, a†]|2⟩', 3-2, '1')
A = np.diag(np.sqrt(np.arange(1, 12)), 1); Ad = A.T; chk(29, 'P1: [a, a†] = 1 (bloque truncado)', float(np.max(np.abs((A@Ad-Ad@A).diagonal()[:11]-1))), '0.0', 1e-12, rel=False)
c = np.array([[0.0, 1.0], [0.0, 0.0]]); cd = c.T; chk(29, 'P1: c†c† = 0', float(np.max(np.abs(cd@cd))), '0.0', 1e-12, rel=False); chk(29, 'P1: n² = n', float(np.max(np.abs((cd@c)@(cd@c)-(cd@c)))), '0.0', 1e-12, rel=False)
# P2 cobre
n = 8.47e28; EF = hbar**2/(2*me)*(3*math.pi**2*n)**(2/3)
chk(29, 'P2: 3π²n (10³⁰)', 3*math.pi**2*n/1e30, '2.508'); chk(29, 'P2: E_F (10⁻¹⁸ J)', EF/1e-18, '1.1268'); chk(29, 'P2: E_F (eV)', EF/e, '7.033'); chk(29, 'P2: T_F (10⁴ K)', EF/kB_/1e4, '8.161'); chk(29, 'P2: T_F (3 cifras)', EF/kB_/1e4, '8.16'); chk(29, 'P2: v_F (10⁶ m/s)', math.sqrt(2*EF/me)/1e6, '1.573'); chk(29, 'P2: v_F/c (%)', math.sqrt(2*EF/me)/299792458*100, '0.52', 5e-2)
chk(29, 'P2: kT/E_F (10⁻³)', kB_*300/EF/1e-3, '3.68'); chk(29, 'P2: μ/E_F a 300 K', 1-(math.pi**2/12)*(kB_*300/EF)**2, '0.999989', 1e-9); chk(29, 'P2: C/Nk_B a 300 K', math.pi**2/2*300/(EF/kB_), '0.0181'); chk(29, 'P2: fracción del clásico (%)', math.pi**2/2*300/(EF/kB_)/1.5*100, '1.2', 5e-2)
chk(29, 'Sim: C/Nk_B a 0.05 T_F', math.pi**2/2*0.05, '0.2467'); chk(29, 'Sim/P5: P (10¹⁰ Pa)', 0.4*n*EF/1e10, '3.82'); chk(29, 'Sim: μ a 0.05 T_F (Sommerfeld)', 1-(math.pi**2/12)*0.05**2, '0.99794')
# Sim ³He, Na
EF3 = hbar**2/(2*3.01603*u)*(3*math.pi**2*1.64e28)**(2/3); chk(29, 'Sim: E_F del ³He (meV)', EF3/e*1e3, '0.43', 1e-2); chk(29, 'Sim: T_F del ³He (K)', EF3/kB_, '4.97')
# P3 Hubbard
for U, Es, D, J, cq in ((4, '-0.8284', '0.1464', '1.0', '0.828'), (20, '-0.1980', '0.00971', '0.2', '0.990')):
    r = math.sqrt(U*U/4+4); chk(29, f'P3: raíz (U = {U})', r, {4: '2.8284', 20: '10.198'}[U]); chk(29, f'P3: E_S (U = {U})', U/2-r, Es); chk(29, f'P3: ⟨D⟩ (U = {U})', 0.5*(1-(U/2)/r), D); chk(29, f'P3: 4t²/U (U = {U})', 4/U, J); chk(29, f'P3: cociente (U = {U})', (r-U/2)/(4/U), cq)
chk(29, 'P3: ⟨D⟩ con U = 20 (3 cifras)', 0.5*(1-10/math.sqrt(104)), '0.0097', 1e-2)
chk(29, 'P3: E_S (U = 0)', -2.0, '-2.0', 1e-12); chk(29, 'Sim: U = 4t, E_S', 2-math.sqrt(8), '-0.8284'); chk(29, 'Sim: U = 20t, J', math.sqrt(104)-10, '0.1980')
Hm = np.array([[0, -2.0], [-2.0, 4.0]]); chk(29, 'P3: autovalor de [[0,−2t],[−2t,U]] (t = 1, U = 4)', float(np.linalg.eigvalsh(Hm)[0]), '-0.8284')
# P4 BEC
zeta = float(sp.zeta(sp.Rational(3, 2))); Tc = lambda nn, m: 2*math.pi*hbar**2/(m*kB_)*(nn/zeta)**(2/3); mRb = 86.909*u
chk(29, 'P4: ζ(3/2)', zeta, '2.612'); chk(29, 'P4: m_Rb (10⁻²⁵ kg)', mRb/1e-25, '1.4432'); chk(29, 'P4: 2πħ²/(m k_B) (10⁻²⁰)', 2*math.pi*hbar**2/(mRb*kB_)/1e-20, '3.507'); chk(29, 'P4: (n/ζ)^{2/3} (10¹³)', (1e20/zeta)**(2/3)/1e13, '1.136'); chk(29, 'P4: T_c Rb (nK)', Tc(1e20, mRb)*1e9, '398'); chk(29, 'P4: T_c He (K)', Tc(2.18e28, 4.0026*u), '3.13')
lam = lambda m, T: 2*math.pi*hbar/math.sqrt(2*math.pi*m*kB_*T)
chk(29, 'P4/Sim: λ_T Rb (nm)', lam(mRb, Tc(1e20, mRb))*1e9, '297'); chk(29, 'P4: λ_T He (nm)', lam(4.0026*u, Tc(2.18e28, 4.0026*u))*1e9, '0.493'); chk(29, 'P4: 1 − 0.7^{3/2}', 1-0.7**1.5, '0.4143'); chk(29, 'Sim: n^{−1/3} (nm)', (1e20)**(-1/3)*1e9, '215'); chk(29, 'Sim: cociente 2.612^{1/3}', zeta**(1/3), '1.38'); chk(29, 'Sim: T a 0.7 T_c (nm)', 0.7*Tc(1e20, mRb)*1e9, '279'); chk(29, 'Sim: nλ³ a 0.7 T_c', 1e20*lam(mRb, 0.7*Tc(1e20, mRb))**3, '4.46')
chk(29, 'Sim: n^{−1/3} del He (nm)', (2.18e28)**(-1/3)*1e9, '0.36'); chk(29, 'Sim: cociente de masas Rb/H', 86.909/1.00783, '86', 1e-2)
# P5
x = sp.Symbol('x', positive=True); chk(29, 'P5: ∫√ε dε = (2/3)E^{3/2} → (3/5) E_F (SymPy)', 1.0 if sp.simplify(sp.integrate(sp.Symbol('e', positive=True)**sp.Rational(3, 2), (sp.Symbol('e', positive=True), 0, 1))/sp.integrate(sp.sqrt(sp.Symbol('e', positive=True)), (sp.Symbol('e', positive=True), 0, 1))-sp.Rational(3, 5)) == 0 else 0.0, '1.0')
chk(29, 'P5: Ē (eV)', 0.6*EF/e, '4.22'); chk(29, 'P5: P = (2/3) U/V = (2/5) n E_F (coherencia)', 2/3*0.6, 0.4, 1e-12)
# P6
chk(29, 'P6: espectro, E_S', 2-math.sqrt(8), '-0.8284'); chk(29, 'P6: U/2 + √(U²/4 + 4t²)', 2+math.sqrt(8), '4.8284'); chk(29, 'P6: 2U (N = 4)', 8, '8')
