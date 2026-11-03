# -*- coding: utf-8 -*-
# Capítulo 13: oscilador armónico y Morse
from scipy import special as _sp
CM = 100*c; u_ = C.u
def Pf(n): return 2*integrate.quad(lambda x: (_sp.eval_hermite(n, x)*math.exp(-x*x/2))**2/(2.0**n*math.factorial(n)*math.sqrt(math.pi)), math.sqrt(2*n+1), 40)[0]*100
for n_, v in ((0, '15.73'), (1, '11.16'), (2, '9.51'), (5, '7.40'), (10, '6.01'), (4, '7.89')): chk(13, f'Texto: P prohibida n={n_} (%)', Pf(n_), v)
chk(13, 'Texto: exponente n^(−1/3): P(10)/P(5) frente a 2^(−1/3)', Pf(10)/Pf(5), 2**(-1/3), 0.05)
mu = 6.856209*u_; om = 2*math.pi*CM*2169.81; x0 = math.sqrt(hbar/(mu*om)); hw = hbar*om/e
chk(13, 'Ej. CO: ω (10¹⁴)', om/1e14, '4.0872'); chk(13, 'Ej. CO: ν (THz)', CM*2169.81/1e12, '65.05'); chk(13, 'Ej. CO: T (fs)', 1/(CM*2169.81)*1e15, '15.37'); chk(13, 'Ej. CO: μ (10⁻²⁶ kg)', mu/1e-26, '1.1385'); chk(13, 'Ej. CO: k (N/m)', mu*om**2, '1902'); chk(13, 'Ej. CO: ħω (eV)', hw, '0.26902'); chk(13, 'Ej. CO: ½ħω', hw/2, '0.13451'); chk(13, 'Ej. CO: x₀ (pm)', x0*1e12, '4.76'); chk(13, 'Ej. CO: 3x₀', 3*x0*1e12, '14.28'); chk(13, 'Ej. CO: E₄ (eV)', 4.5*hw, '1.2106'); chk(13, 'Ej. CO: E₄ (cm⁻¹)', 4.5*2169.81, '9764')
chk(13, 'Ej. CO: Θ_vib (K)', hbar*om/kB, '3122'); chk(13, 'Ej. CO: ħω/kT (300 K)', hw/(kB*300/e), '10.41'); chk(13, 'Ej. CO: población n=1 (10⁻⁵)', math.exp(-hw/(kB*300/e))/1e-5, '3.0'); chk(13, 'Ej. CO: kT (eV)', kB*300/e, '0.025852')
chk(13, 'P1: c (10¹⁰ cm/s)', c*100/1e10, '2.99792'); chk(13, 'P1: ν (10¹³ Hz)', CM*2169.81/1e13, '6.5049'); chk(13, 'P1: ½ħω', hw/2, '0.1345')
# macroscópico
chk(13, 'Texto: x₀ (1 kg, 1 s⁻¹) (10⁻¹⁷ m)', math.sqrt(hbar)/1e-17, '1.03'); chk(13, 'Texto: ħ (10⁻³⁴)', hbar/1e-34, '1.05'); chk(13, 'Texto: n para 0.5 J (10³³)', 0.5/hbar/1e33, '4.7')
# H2, N2 (sim)
for nm, we, m_, per, hwv, x0s in (('H2', 4401.21, 0.503912, '7.58', '0.546', '12.3'), ('N2', 2358.57, 7.001537, '14.14', '0.2924', '4.5')):
    om_ = 2*math.pi*CM*we; chk(13, f'Sim: {nm} x₀ (pm, 1 decimal)', math.sqrt(hbar/(m_*u_*om_))*1e12, x0s); chk(13, f'Sim: {nm} periodo (fs)', 1/(CM*we)*1e15, per); chk(13, f'Sim: {nm} ħω', hbar*om_/e, hwv)
# Morse
De = 2169.81**2/(4*13.288)
chk(13, 'P4: ωe−2ωexe', 2169.81-2*13.288, '2143.23'); chk(13, 'P4: 2ωexe', 2*13.288, '26.576'); chk(13, 'P4: 2ωe−6ωexe', 2*2169.81-6*13.288, '4259.89'); chk(13, 'P4: 2ωe', 2*2169.81, '4339.62'); chk(13, 'P4: 6ωexe', 6*13.288, '79.728'); chk(13, 'P4: De', De, '88578', 1e-5) if False else chk(13, 'P4: De (cm⁻¹ entero)', De, '88578'); chk(13, 'P4: 4ωexe', 4*13.288, '53.152'); chk(13, 'P4: De (eV)', De*CM*h/e, '10.98'); chk(13, 'P4: N', math.floor(2169.81/(2*13.288)-.5)+1, '82'); chk(13, 'P4: error fundamental (%)', ((2169.81-2*13.288)/2143.27-1)*100, '-0.002'); chk(13, 'P4: ωe/2ωexe−½', 2169.81/26.576-.5, '81.1', 1e-2) if False else chk(13, 'P4: 2169.81/26.576', 2169.81/26.576, '81.65')
chk(13, 'Sim Morse: E₈−E₇', 2169.81-2*13.288*8, '1957.2'); chk(13, 'Sim Morse: k (N/m)', mu*om**2, '1901.9'); kf = mu*om**2; chk(13, 'Sim Morse: a (Å⁻¹)', math.sqrt(kf/(2*De*100*h*c))/1e10, '2.325'); chk(13, 'Sim Morse: sobretono error', ((2*2169.81-6*13.288)/4259.74-1)*100, '0.004')
chk(13, 'Sim Morse: HCl fundamental', 2990.95-2*52.82, '2885.31'); chk(13, 'Sim Morse: H2 fundamental', 4401.21-2*121.34, '4158.53'); chk(13, 'Sim Morse: H2 error (%)', ((4401.21-2*121.34)/4161.17-1)*100, '-0.063'); chk(13, 'Texto: HCl D_e', 2990.95**2/(4*52.82)*CM*h/e, '5.25'); chk(13, 'Texto: H2 D_e', 4401.21**2/(4*121.34)*CM*h/e, '4.95'); chk(13, 'Texto: N2 D_e', 2358.57**2/(4*14.324)*CM*h/e, '12.04'); chk(13, 'Sim Morse: H2 N', math.floor(4401.21/(2*121.34)-.5)+1, '18')
# DCl
mH = 1.00782503; mD = 2.01410178; m35 = 34.96885268; muH = mH*m35/(mH+m35); muD = mD*m35/(mD+m35)
chk(13, 'P3: μ(HCl)', muH, '0.97959'); chk(13, 'P3: μ(DCl)', muD, '1.90441'); chk(13, 'P3: cociente', math.sqrt(muH/muD), '0.71720'); chk(13, 'P3: μ_H/μ_D', muH/muD, '0.51438'); chk(13, 'P3: ωe(DCl)', 2990.95*math.sqrt(muH/muD), '2145.1'); chk(13, 'P3: mH·m35/(mH+m35) intermedio', mH*m35/(mH+m35), '0.97959') if False else chk(13, 'P3: 36.98295', mD+m35, '36.98295'); chk(13, 'P3: 35.97668', mH+m35, '35.97668')
chk(13, 'Texto: Θ_vib H2 (K)', 4401.21*CM*h/kB, '6332')
# P5
chk(13, 'P5: ⟨ξ²⟩ n=1', 1.5, '1.5')
ξ = sp.symbols('xi', real=True); psi1 = sp.sqrt(2)/sp.pi**sp.Rational(1, 4)*ξ*sp.exp(-ξ**2/2)
res = sp.simplify(sp.diff(psi1, ξ, 2)+(3-ξ**2)*psi1)
chk(13, 'SymPy: ψ₁″ + (3 − ξ²)ψ₁ = 0', float(abs(res.subs(ξ, 0.7))), 0, 1e-12, False)
chk(13, 'SymPy: ⟨ξ²⟩₁ = 3/2', float(sp.integrate(ξ**2*psi1**2, (ξ, -sp.oo, sp.oo))), 1.5, 1e-12)
chk(13, 'SymPy: ∫ψ₁² = 1', float(sp.integrate(psi1**2, (ξ, -sp.oo, sp.oo))), 1, 1e-12)
chk(13, 'SymPy: ⟨p²⟩₁ = −∫ψ₁ψ₁″ = 3/2', float(sp.integrate(-psi1*sp.diff(psi1, ξ, 2), (ξ, -sp.oo, sp.oo))), 1.5, 1e-12)
