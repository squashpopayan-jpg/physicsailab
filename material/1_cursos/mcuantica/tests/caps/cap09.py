# -*- coding: utf-8 -*-
# Capítulo 9: oscilador armónico
u_ = C.u; CMEV = 1.239841984e-4; CMKJ = 0.011962656
def ell(w, mu): return math.sqrt(hbar/(mu*u_*2*math.pi*c*100*w))*1e10
mol = {'H2': (4401.21, 0.50391), 'HCl': (2990.95, 0.97959), 'CO': (2169.81, 6.8562)}
chk(9, 'Ej./P1: ℓ de HCl (Å)', ell(*mol['HCl']), '0.1073'); chk(9, 'Ej./P1: ℓ de CO (Å)', ell(*mol['CO']), '0.0476'); chk(9, 'Ej.: ℓ de H₂ (Å)', ell(*mol['H2']), '0.1233')
chk(9, 'Ej.: ZPE de HCl (cm⁻¹)', 2990.95/2, '1495.5'); chk(9, 'Ej.: ZPE de HCl (eV)', 2990.95/2*CMEV, '0.1854'); chk(9, 'Ej.: ZPE de HCl (kJ/mol)', 2990.95/2*CMKJ, '17.89')
chk(9, 'P1: ZPE de CO (cm⁻¹)', 2169.81/2, '1084.9'); chk(9, 'P1: ZPE de CO (eV)', 2169.81/2*CMEV, '0.1345'); chk(9, 'P1: ZPE de CO (4 cifras, eV)', 2169.81/2*CMEV, '0.13451'); chk(9, 'P1: ZPE de CO (kJ/mol)', 2169.81/2*CMKJ, '12.98'); chk(9, 'P1: λ de la transición (µm)', 1e4/2169.81, '4.609')
w = 2*math.pi*c*100*2169.81; mu = 6.8562*u_
chk(9, 'P1: ω (10¹⁴ s⁻¹)', w/1e14, '4.0872'); chk(9, 'P1: μ (10⁻²⁶ kg)', mu/1e-26, '1.1385'); chk(9, 'P1: ℓ (10⁻¹² m)', math.sqrt(hbar/(mu*w))/1e-12, '4.761'); chk(9, 'P1: 1 cm⁻¹ en eV', CMEV, '0.0001239842', 1e-6) if False else chk(9, 'P1: 1 cm⁻¹ en eV (10⁻⁴)', CMEV/1e-4, '1.239842')
chk(9, 'Ej.: ℓ/r_e de HCl (%)', ell(*mol['HCl'])/1.275*100, '8.4'); chk(9, 'Ej.: ℓ/r_e de CO (%)', ell(*mol['CO'])/1.128*100, '4.2')
chk(9, 'Sim: E(n=2) de HCl (cm⁻¹)', 2.5*2990.95, '7477'); chk(9, 'Sim: E(n=2) de HCl (eV)', 2.5*2990.95*CMEV, '0.927'); chk(9, 'Sim: punto de retorno n=2 de HCl (Å)', math.sqrt(5)*ell(*mol['HCl']), '0.240')
# probabilidad prohibida
fb = lambda n_: 2*integrate.quad(lambda x: (special.eval_hermite(n_, x)**2*math.exp(-x*x)/(2.0**n_*math.factorial(n_)*math.sqrt(math.pi))), math.sqrt(2*n_+1), math.sqrt(2*n_+1)+20, epsabs=1e-14, epsrel=1e-12)[0]*100
for n_, v in ((0, '15.73'), (1, '11.16'), (2, '9.51'), (5, '7.40'), (10, '6.01'), (20, '4.84')): chk(9, f'Sim: P prohibida n = {n_} (%)', fb(n_), v)
chk(9, 'P2: erfc(1)', float(special.erfc(1)), '0.15730'); chk(9, 'P2: 2√3 e⁻³/√π', 2*math.sqrt(3)*math.exp(-3)/math.sqrt(math.pi), '0.09730'); chk(9, 'P2: erfc(√3)', float(special.erfc(math.sqrt(3))), '0.01431'); chk(9, 'P2: P₁', 2*math.sqrt(3)*math.exp(-3)/math.sqrt(math.pi)+float(special.erfc(math.sqrt(3))), '0.1116')
chk(9, 'P2: P₁ = integral numérica', fb(1)/100, 2*math.sqrt(3)*math.exp(-3)/math.sqrt(math.pi)+float(special.erfc(math.sqrt(3))), 1e-10)
chk(9, 'Sim: decaimiento ~ n^(−1/3): P(20)/P(10)', fb(20)/fb(10), 2**(-1/3), 0.1)
# identidad de la integral ∫ξ² e^{−ξ²}
a_ = 1.3; chk(9, 'P2: ∫_a^∞ ξ² e^{−ξ²} = (a/2)e^{−a²} + (√π/4) erfc a', integrate.quad(lambda t: t*t*math.exp(-t*t), a_, 40)[0], a_/2*math.exp(-a_**2)+math.sqrt(math.pi)/4*float(special.erfc(a_)), 1e-12)
# operadores de escalera con matrices (truncadas, N = 60)
N = 60; a = np.diag(np.sqrt(np.arange(1, N)), 1); ad = a.T
chk(9, '[a, a†] = 1 (salvo la última fila)', np.linalg.norm((a@ad-ad@a)[:N-1, :N-1]-np.eye(N-1)), 0.0, 1e-12, rel=False)
X = (a+ad)/math.sqrt(2); Pm = 1j*(ad-a)/math.sqrt(2); H = 0.5*(Pm@Pm+X@X)
chk(9, 'H = a†a + ½ (diagonal n + ½)', np.linalg.norm(np.diag(H)[:N-2].real-(np.arange(N-2)+0.5)), 0.0, 1e-12, rel=False)
x2 = X@X; p2 = (Pm@Pm).real
for n_ in (0, 1, 2): chk(9, f'P3: ⟨x²⟩_{n_}', x2[n_, n_], n_+0.5, 1e-12); chk(9, f'P3: ⟨p²⟩_{n_}', p2[n_, n_], n_+0.5, 1e-12); chk(9, f'P3: ΔxΔp_{n_}/(ħ/2)', 2*math.sqrt(x2[n_, n_]*p2[n_, n_]), 2*n_+1, 1e-12)
x4 = np.linalg.matrix_power(X, 4); chk(9, 'P4: ⟨x⁴⟩₀', x4[0, 0], '0.75'); chk(9, 'P4: ⟨x⁴⟩₀ (integral)', integrate.quad(lambda t: t**4*math.exp(-t*t)/math.sqrt(math.pi), -40, 40)[0], '0.75')
v0 = np.zeros(N); v0[0] = 1; v1 = (a+ad)@(a+ad)@v0; chk(9, 'P4: (a+a†)²|0⟩ = |0⟩ + √2|2⟩ (norma² = 3)', float(np.vdot(v1, v1).real), '3.0')
# P5: ψ₂ simbólico
xi = sp.symbols('xi', real=True); psi0 = sp.pi**sp.Rational(-1, 4)*sp.exp(-xi**2/2)
ad_ = lambda f: (xi*f-sp.diff(f, xi))/sp.sqrt(2)
psi1 = sp.simplify(ad_(psi0)); psi2 = sp.simplify(ad_(psi1)/sp.sqrt(2))
chk(9, 'P5: ψ₁ = √2 ξ ψ₀ (SymPy)', 1.0 if sp.simplify(psi1-sp.sqrt(2)*xi*psi0) == 0 else 0.0, '1.0'); chk(9, 'P5: ψ₂ = (2ξ²−1)ψ₀/√2 (SymPy)', 1.0 if sp.simplify(psi2-(2*xi**2-1)*psi0/sp.sqrt(2)) == 0 else 0.0, '1.0')
chk(9, 'P5: ‖ψ₂‖² = 1 (SymPy)', float(sp.integrate(psi2**2, (xi, -sp.oo, sp.oo))), '1.0'); chk(9, 'P5: ⟨ψ₀|ψ₂⟩ = 0 (SymPy)', float(sp.integrate(psi0*psi2, (xi, -sp.oo, sp.oo))), 0.0, 1e-12, rel=False)
chk(9, 'P5: ⟨ξ²⟩₀ = 1/2', float(sp.integrate(xi**2*psi0**2, (xi, -sp.oo, sp.oo))), '0.5')
H2 = sp.hermite(2, xi); chk(9, 'P5: H₂ = 4ξ²−2', 1.0 if sp.expand(H2-(4*xi**2-2)) == 0 else 0.0, '1.0')
# Hermite: recurrencia y ecuación diferencial
for n_ in (3, 6): Hn = sp.hermite(n_, xi); chk(9, f'Ecuación de Hermite H_{n_}: H″ − 2ξH′ + 2nH = 0 (SymPy)', 1.0 if sp.simplify(sp.diff(Hn, xi, 2)-2*xi*sp.diff(Hn, xi)+2*n_*Hn) == 0 else 0.0, '1.0')
# P6: H2
wH = 2*math.pi*c*100*4401.21; muH = 0.50391*u_; lH = math.sqrt(hbar/(muH*wH))
chk(9, 'P6: ω (10¹⁴ s⁻¹)', wH/1e14, '8.2903'); chk(9, 'P6: T (fs)', 2*math.pi/wH*1e15, '7.579'); chk(9, 'Ej.: T (fs, 3 cifras)', 2*math.pi/wH*1e15, '7.58'); chk(9, 'P6: ℓ/√2 (Å)', lH/math.sqrt(2)*1e10, '0.0872'); chk(9, 'P6: ħω (eV)', hbar*wH/e, '0.5457'); chk(9, 'P6: ħω (eV, 3 cifras)', hbar*wH/e, '0.546')
chk(9, 'Sim: ⟨E⟩ y ΔE de (|0⟩+|1⟩)/√2', math.sqrt(0.5*(0.25+2.25)-1), '0.5')
# KIE
mH = 1.00782503; mD = 2.01410178
def kie(w_, m1, T=298.15):
    muH_ = m1*mH/(m1+mH); muD_ = m1*mD/(m1+mD); wD = w_*math.sqrt(muH_/muD_); dz = 0.5*(w_-wD)*CMKJ
    return muH_, muD_, wD, dz, math.exp(dz*1000/(8.314462618*T))
r = kie(2900, 12.0)
chk(9, 'Ej.: μ_CH', r[0], '0.92974'); chk(9, 'Ej.: μ_CD', r[1], '1.72464'); chk(9, 'Ej.: ν̃_CD (cm⁻¹)', r[2], '2129.3'); chk(9, 'Ej.: ΔZPE (cm⁻¹)', 0.5*(2900-r[2]), '385.4'); chk(9, 'Ej.: ΔZPE (kJ/mol)', r[3], '4.61'); chk(9, 'Ej.: exponente', r[3]*1000/(8.314462618*298.15), '1.860'); chk(9, 'Ej.: k_H/k_D', r[4], '6.4'); chk(9, 'Sim: k_H/k_D (C–H, 298 K, 3 cifras)', r[4], '6.42')
chk(9, 'Sim: C–H a 200 K', kie(2900, 12.0, 200)[4], '16.0', 1e-2); chk(9, 'Sim: C–H a 150 K', kie(2900, 12.0, 150)[4], '40', 2e-2); chk(9, 'Sim: C–H a 500 K', kie(2900, 12.0, 500)[4], '3.0', 2e-2)
ro = kie(3400, 15.99491462); chk(9, 'Ej./Sim: O–H k_H/k_D', ro[4], '9.3'); chk(9, 'Sim: O–H ΔZPE (kJ/mol)', ro[3], '5.53')
rn = kie(3300, 14.003074); chk(9, 'Ej.: N–H k_H/k_D', rn[4], '8.5')
wD2 = 4401.21*math.sqrt((mH/2)/(mD/2)); dz2 = 0.5*(4401.21-wD2)*CMKJ
chk(9, 'Sim: ω del D₂ (cm⁻¹)', wD2, '3113.3'); chk(9, 'Sim: ΔZPE del H₂ (kJ/mol)', dz2, '7.70'); chk(9, 'Ej./Sim: H₂/D₂ (k_H/k_D)', math.exp(dz2*1000/(8.314462618*298.15)), '22.4'); chk(9, 'Ej.: H₂/D₂ (2 cifras)', math.exp(dz2*1000/(8.314462618*298.15)), '22')
# degeneración 3D: (N+1)(N+2)/2
chk(9, 'Degeneración N=3 del oscilador 3D', len([1 for a1 in range(4) for b1 in range(4) for c1 in range(4) if a1+b1+c1 == 3]), '10')
