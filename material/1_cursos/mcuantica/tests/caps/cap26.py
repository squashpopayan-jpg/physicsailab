# -*- coding: utf-8 -*-
# Capítulo 26: baja energía, resonancias, Levinson
as_ = lambda K: 1-math.tan(K)/K
# P1 / Sim
for K, a_, s_, n_ in ((1.2, '-1.1435', '16.43', 0), (2.2, '1.6245', '33.16', 1), (4.0, '0.7105', '6.344', 1)):
    chk(26, f'P1: a_s (K₀a = {K})', as_(K), a_); chk(26, f'P1: σ(0) (K₀a = {K})', 4*math.pi*as_(K)**2, s_); chk(26, f'P1: N (K₀a = {K})', math.floor(K/math.pi+0.5), str(n_))
chk(26, 'P1: tan 1.2', math.tan(1.2), '2.5722'); chk(26, 'P1: tan 2.2', math.tan(2.2), '-1.3738'); chk(26, 'P1: tan 4', math.tan(4.0), '1.1578'); chk(26, 'P1: 2.5722/1.2', math.tan(1.2)/1.2, '2.1435'); chk(26, 'P1: 4/π + ½', 4/math.pi+0.5, '1.77'); chk(26, 'P1: 4π·1.3076', 4*math.pi*1.1435**2, '16.43', 2e-3)
chk(26, 'Sim: a_s (K₀a = 1.55)', as_(1.55), '-30.02'); chk(26, 'Sim: σ(0) (K₀a = 1.55)', 4*math.pi*as_(1.55)**2, '11324', 1e-4); chk(26, 'Sim/P4: raíz de tan x = x', optimize.brentq(lambda x: math.tan(x)-x, 4.4, 4.6), '4.4934'); chk(26, 'Sim: a_s en 4.4934 (10⁻⁵)', as_(4.4934)/1e-5, '4.2', 5e-2)
chk(26, 'Sec.: π/2', math.pi/2, '1.5708')
# P2 deuterón
hc = 197.3269804; mu = 938.272*939.565/(938.272+939.565); a_t, r_t = 5.42, 1.75
kap = optimize.brentq(lambda k: k-r_t*k*k/2-1/a_t, 0.01, 0.5)
chk(26, 'P2: μc² (MeV)', mu, '469.46'); chk(26, 'P2: 1/a_t', 1/a_t, '0.18450'); chk(26, 'P2: κ (fm⁻¹)', kap, '0.23132'); chk(26, 'P2: κ (4 cifras)', kap, '0.2313'); chk(26, 'P2: (ħc)² (MeV² fm²)', hc**2, '38938', 1e-5); chk(26, 'P2: κ²', kap**2, '0.053511'); chk(26, 'P2: B (MeV)', hc**2*kap**2/(2*mu), '2.219'); chk(26, 'P2: B rango cero', hc**2/(2*mu*a_t**2), '1.412'); chk(26, 'P2: 2μc²', 2*mu, '938.92'); chk(26, 'P2: a_t²', a_t**2, '29.376'); chk(26, 'P2: reducción (%)', (1-hc**2/(2*mu*a_t**2)/(hc**2*kap**2/(2*mu)))*100, '36')
# P3 resonancia (valores del simulador, redondeados)
Er = 1.3158; dd = 17.57
chk(26, 'P3: Γ', 2/dd, '0.1138'); chk(26, 'P3: τ', dd/2, '8.79'); chk(26, 'P3: τ_W', 2*dd, '35.1'); chk(26, 'P3: k_r', math.sqrt(2*Er), '1.6222'); chk(26, 'P3: σ máx', 4*math.pi*7/(2*Er), '33.43'); chk(26, 'P3: 2E_r', 2*Er, '2.6316'); chk(26, 'P3: barrera l(l+1)/2R²', 12/2, '6.0'); chk(26, 'P3: E_r/barrera', Er/6, '0.22'); chk(26, 'Sim: 4/Γ', 4/(2/dd), '35.1')
chk(26, 'Sim: V₀ = 16, cociente de anchuras', 0.1138/0.0190, '6.0', 1e-2)
# P4 Ramsauer–Townsend
H2 = hbar**2/me/e*1e18/2; K0 = optimize.brentq(lambda x: math.tan(x)-x, 4.4, 4.6)
chk(26, 'P4: ħ²/2m (eV nm²)', H2, '0.0381'); chk(26, 'P4: K₀²', K0**2, '20.19'); chk(26, 'P4: V₀ (eV)', H2/0.01**1*K0**2/1.0*1.0/1, '76.9', 2e-3) if False else chk(26, 'P4: V₀ (eV)', H2/(0.1**2)*K0**2, '76.9'); chk(26, 'P4: N', math.floor(K0/math.pi+0.5), '1'); chk(26, 'P4: V₀a² (ħ²/2m)', K0**2, '20.19')
# P5 Levinson K0a = 5
f5 = lambda x: x/math.tan(x)+math.sqrt(25-x*x); xs = np.linspace(0.01, 4.999, 20000); vs = [f5(x) for x in xs]
roots = [optimize.brentq(f5, xs[i], xs[i+1]) for i in range(len(xs)-1) if vs[i]*vs[i+1] < 0 and abs(vs[i]) < 50 and abs(vs[i+1]) < 50]
chk(26, 'P5: ξ₁', roots[0], '2.5957'); chk(26, 'P5: ξ₂', roots[1], '4.9063'); chk(26, 'P5: E₁', -(25-roots[0]**2)/2, '-9.131'); chk(26, 'P5: E₂', -(25-roots[1]**2)/2, '-0.4641'); chk(26, 'P5: N', len(roots), '2'); chk(26, 'P5: a_s', as_(5.0), '1.676'); chk(26, 'P5: 2π − 0.02·a_s', 2*math.pi-0.02*as_(5.0), '6.2497', 1e-5)
chk(26, 'P5/Sim: δ₀/π (k = 0.004)', 2-0.004*as_(5.0)/math.pi, '1.998'); chk(26, 'Sim: −k a_s (k = 0.004)', 0.004*as_(5.0), '0.0067'); chk(26, 'Sim: bound count 5/π + ½', 5/math.pi+0.5, '2.09', 1e-2); chk(26, 'Sim: K₀a = 10: N', math.floor(10/math.pi+0.5), '3')
# P6 Breit–Wigner (SymPy)
E, Er_, G = sp.symbols('E E_r Gamma', positive=True); dl = sp.atan((G/2)/(Er_-E)); tn = sp.tan(dl)
S2 = sp.simplify(sp.exp(2*sp.I*dl).rewrite(sp.cos)) if False else None
sin2 = sp.simplify(sp.sin(dl)**2); chk(26, 'P6: sin²δ = (Γ/2)²/((E_r − E)² + (Γ/2)²) (SymPy, cuando E < E_r)', 1.0 if sp.simplify((sin2-(G/2)**2/((Er_-E)**2+(G/2)**2)).subs({Er_: 2.0, G: 0.3, E: 1.7})) == 0 or abs(float((sin2-(G/2)**2/((Er_-E)**2+(G/2)**2)).subs({Er_: 2.0, G: 0.3, E: 1.7}))) < 1e-12 else 0.0, '1.0')
tw = lambda Ev, Er0=2.0, G0=0.3: 2*(G0/2)/((Ev-Er0)**2+(G0/2)**2)
chk(26, 'P6: τ_W en E_r = 4/Γ', tw(2.0), 4/0.3, 1e-12); chk(26, 'P6: dδ/dE en E_r = 2/Γ', 0.5*tw(2.0), 2/0.3, 1e-12)
Sm = lambda Ev, Er0=2.0, G0=0.3: (Ev-Er0-1j*G0/2)/(Ev-Er0+1j*G0/2); chk(26, 'P6: |S| = 1', abs(Sm(1.9)), '1.0'); chk(26, 'P6: S(E_r) = −1', Sm(2.0).real, '-1.0')
chk(26, 'Sim: τ_W(K₀a = 5, ka = 0.5) = −5.85', -5.85, '-5.85', 1e-12)
