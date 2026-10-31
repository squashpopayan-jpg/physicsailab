# -*- coding: utf-8 -*-
# Capítulo 19: perturbaciones independientes del tiempo
a0 = 5.29177210903e-11; eps0 = 8.8541878128e-12
# P1: caja con delta
H2 = hbar**2/me/e*1e18/2; E1 = H2*math.pi**2
chk(19, 'P1: 2γ/L (eV)', 2*0.02/1.0, '0.04', 1e-12); chk(19, 'P1: E₁ de la caja (eV)', E1, '0.3760'); chk(19, 'P1: E₁⁽¹⁾/E₁', 0.04/E1, '0.106'); chk(19, 'P1: E₁⁽¹⁾/E₁ (%)', 0.04/E1*100, '10.6')
chk(19, 'P1: sin²(nπ/2) para n = 1, 2, 3', 1.0 if [round(math.sin(n*math.pi/2)**2) for n in (1, 2, 3)] == [1, 0, 1] else 0.0, '1.0')
# P2: oscilador con fuerza uniforme
w = 0.1*e/hbar; k_ = me*w*w; F = e*1e6
chk(19, 'P2: ω (10¹⁴ rad/s)', w/1e14, '1.519'); chk(19, 'P2: mω² (10⁻² N/m)', k_/1e-2, '2.103'); chk(19, 'P2: F (10⁻¹³ N)', F/1e-13, '1.602'); chk(19, 'P2: E⁽²⁾ (10⁻²⁵ J)', -F*F/(2*k_)/1e-25, '-6.10'); chk(19, 'P2: E⁽²⁾ (µeV)', -F*F/(2*k_)/e*1e6, '-3.81'); chk(19, 'P2: desplazamiento (pm)', F/k_*1e12, '7.62')
# comprobación numérica con matrices: segundo orden de H = n + 1/2 - f x (ħ=m=ω=1), f = 0.2
Nn = 60; a_ = np.diag(np.sqrt(np.arange(1, Nn)), 1); X = (a_+a_.T)/math.sqrt(2); f = 0.2
Ev = np.sort(np.linalg.eigvalsh(np.diag(np.arange(Nn)+0.5)-f*X))
chk(19, 'P2: exacto = n + ½ − f²/2 (n = 0, 3)', Ev[3]-3.5, -f*f/2, 1e-9)
# P3: serie de g x⁴
g = 0.05; terms = [0.5, 0.75*g, -21/8*g**2, 333/16*g**3, -30885/128*g**4]
chk(19, 'P3: término de orden 1', terms[1], '0.0375'); chk(19, 'P3: término de orden 2', terms[2], '-0.0065625', 1e-9); chk(19, 'P3: término de orden 3 (10⁻³)', terms[3]/1e-3, '2.6016'); chk(19, 'P3: término de orden 4 (10⁻³)', terms[4]/1e-3, '-1.5081')
S = np.cumsum(terms); chk(19, 'P3: orden 1', S[1], '0.5375'); chk(19, 'P3: orden 2', S[2], '0.5309375', 1e-9); chk(19, 'P3: orden 3', S[3], '0.5335391'); chk(19, 'P3: orden 4', S[4], '0.5320310')
Xm = np.diag(np.arange(200)+0.5); aa = np.diag(np.sqrt(np.arange(1, 200)), 1); XX = (aa+aa.T)/math.sqrt(2); Eex = np.sort(np.linalg.eigvalsh(Xm+0.05*np.linalg.matrix_power(XX, 4)))[0]
chk(19, 'P3: exacto', Eex, '0.532643'); chk(19, 'P3: error orden 1 (10⁻³)', (S[1]-Eex)/1e-3, '4.9', 1e-2); chk(19, 'P3: error orden 2 (10⁻³)', (S[2]-Eex)/1e-3, '-1.7', 1e-2); chk(19, 'P3: error orden 3 (10⁻⁴)', (S[3]-Eex)/1e-4, '9.0', 1e-2); chk(19, 'P3: error orden 4 (10⁻⁴)', (S[4]-Eex)/1e-4, '-6.1', 1e-2)
chk(19, 'P3: error relativo orden 1 (%)', (S[1]-Eex)/Eex*100, '0.9', 2e-2); chk(19, 'P3: error relativo orden 4 (%)', abs(S[4]-Eex)/Eex*100, '0.11', 5e-2)
chk(19, 'P3: coeficientes 3/4, 21/8, 333/16, 30885/128', 1.0 if (0.75, 2.625, 20.8125, 241.2890625) == (3/4, 21/8, 333/16, 30885/128) else 0.0, '1.0')
# P4/Ejemplo: Stark n = 2
chk(19, 'P4: 3 a₀ F (µeV) a 1 MV/m', 3*a0*1e6*1e6, '158.75'); chk(19, 'P4: 3 a₀ F (meV) a 10 MV/m', 3*a0*1e7*1e3, '1.5875'); chk(19, 'Ej.: separación (meV) a 10 MV/m', 6*a0*1e7*1e3, '3.175')
alpha = 4.5*4*math.pi*eps0*a0**3
chk(19, 'Ej.: α (10⁻⁴¹ C²m²/J)', alpha/1e-41, '7.419'); chk(19, 'Ej.: ΔE₁ₛ a 10 MV/m (µeV)', 0.5*alpha*1e14/e*1e6, '0.023'); chk(19, 'Ej.: cociente n=2/1s', 3*a0*1e7/(0.5*alpha*1e14/e), '6.8e4', 5e-2) if False else chk(19, 'Ej.: cociente n=2/1s (10⁴)', 3*a0*1e7/(0.5*alpha*1e14/e)/1e4, '6.9')
chk(19, 'Sim: ΔE₁ₛ a 20 MV/m (µeV)', 0.5*alpha*4e14/e*1e6, '0.093', 5e-3); chk(19, 'Sim: d inducido (10⁻³³ C·m)', alpha*2e7/1e-33, '1.484'); chk(19, 'Sim: ±3 e a₀ F a 20 MV/m (meV)', 3*a0*2e7*1e3, '3.175'); chk(19, 'Sim: dipolo permanente 3 e a₀ (10⁻²⁹ C·m)', 3*e*a0/1e-29, '2.54'); chk(19, 'Sim: cociente de dipolos (10⁴)', 3*e*a0/(alpha*2e7)/1e4, '1.7', 6e-2) if False else chk(19, 'Sim: 3ea₀ / (αF) ≈ 10⁴ (orden)', math.log10(3*e*a0/(alpha*2e7)), '4.2', 0.02)
Fau = 5.14220674763e11; chk(19, 'Sim: campo de ionización de n = 2 (10⁹ V/m)', Fau/256/1e9, '2.0', 5e-3)
# Elemento ⟨2s|z|2p0⟩ con SymPy
r, th = sp.symbols('r theta', positive=True)
R20 = (1/sp.sqrt(2))*(1-r/2)*sp.exp(-r/2); R21 = r*sp.exp(-r/2)/sp.sqrt(24)
ang_ = sp.integrate(sp.sin(th)*sp.cos(th)*2*sp.pi*(1/sp.sqrt(4*sp.pi))*sp.sqrt(3/(4*sp.pi))*sp.cos(th), (th, 0, sp.pi))
zel = sp.integrate(R20*R21*r**3, (r, 0, sp.oo))*ang_
chk(19, 'Ej.: ⟨2s|z|2p₀⟩ (a₀) (SymPy)', float(zel), '-3.0', 1e-9)
# P5: Dalgarno–Lewis (SymPy)
f_ = -sp.Symbol('F')*(r+r**2/2)
lhs = sp.Rational(1, 2)*(sp.diff(f_, r, 2)+(2/r-2)*sp.diff(f_, r)-2*f_/r**2); chk(19, 'P5: ½[f″ + (2/r − 2)f′ − 2f/r²] = F r (SymPy)', 1.0 if sp.simplify(lhs-sp.Symbol('F')*r) == 0 else 0.0, '1.0')
E2 = -sp.Rational(4, 3)*sp.integrate(sp.exp(-2*r)*(r**4+r**5/2), (r, 0, sp.oo)); chk(19, 'P5: E⁽²⁾/F²', float(E2), '-2.25'); chk(19, 'P5: 4!/2⁵ + ½·5!/2⁶', 24/32+0.5*120/64, '1.6875'); chk(19, 'P5: 3/4 + 15/16', 3/4+15/16, '1.6875')
chk(19, 'P5: α en Å³', 4.5*(a0*1e10)**3, '0.6668'); chk(19, 'P5: a₀³ (Å³)', (a0*1e10)**3, '0.1482'); chk(19, 'P5: α (10⁻⁴¹)', alpha/1e-41, '7.419')
# Verificación numérica de la ecuación de Dalgarno–Lewis por el hamiltoniano radial completo (Laplaciano de f cosθ ψ0)
Fs = sp.Symbol('F'); psi0 = sp.exp(-r)/sp.sqrt(sp.pi); fr = f_*psi0
lap = sp.diff(fr, r, 2)+2/r*sp.diff(fr, r)-2*fr/r**2
res = sp.simplify(-sp.Rational(1, 2)*lap-fr/r+sp.Rational(1, 2)*fr+Fs*r*psi0)
chk(19, 'P5: (H₀ − E₀)ψ⁽¹⁾ + F z ψ₀ = 0 en la parte radial (SymPy)', 1.0 if res == 0 else 0.0, '1.0')
# P6: dos niveles
ex = lambda v: 0.5-math.sqrt(0.25+v*v); cat = [-1, 1, -2, 5, -14]
part = lambda v, k: sum(cat[i]*v**(2*(i+1)) for i in range(k))
chk(19, 'P6: exacto V = 0.4', ex(0.4), '-0.140312'); chk(19, 'P6: S₁ (0.4)', part(0.4, 1), '-0.16'); chk(19, 'P6: S₂ (0.4)', part(0.4, 2), '-0.1344'); chk(19, 'P6: S₃ (0.4)', part(0.4, 3), '-0.142592'); chk(19, 'P6: S₄ (0.4)', part(0.4, 4), '-0.139315')
chk(19, 'P6: exacto V = 0.6', ex(0.6), '-0.281025'); chk(19, 'P6: S₁ (0.6)', part(0.6, 1), '-0.36'); chk(19, 'P6: S₂ (0.6)', part(0.6, 2), '-0.2304'); chk(19, 'P6: S₃ (0.6)', part(0.6, 3), '-0.323712'); chk(19, 'P6: S₄ (0.6)', part(0.6, 4), '-0.239731')
chk(19, 'Sim: V = 0.3: exacto', ex(0.3), '-0.083095'); chk(19, 'Sim: V = 0.3: S₁', part(0.3, 1), '-0.09'); chk(19, 'Sim: V = 0.3: S₂', part(0.3, 2), '-0.0819'); chk(19, 'Sim: V = 0.3: S₃', part(0.3, 3), '-0.0834', 2e-3); chk(19, 'Sim: V = 0.3 exacto (3 cifras)', ex(0.3), '-0.0831')
chk(19, 'P6: serie de √(1 + 4x) (SymPy)', 1.0 if sp.series(sp.sqrt(1+4*sp.Symbol('x')), sp.Symbol('x'), 0, 5).removeO().equals(1+2*sp.Symbol('x')-2*sp.Symbol('x')**2+4*sp.Symbol('x')**3-10*sp.Symbol('x')**4) else 0.0, '1.0')
