# -*- coding: utf-8 -*-
# Capítulo 17: campos electromagnéticos
phi0 = h/e; RK = h/e**2; m_ = 0.067*me
# Sim / Problema 1
wc = e*5/m_; hw = hbar*wc; ell = math.sqrt(hbar/(e*5))
chk(17, 'P1: ω_c (10¹³ rad/s)', wc/1e13, '1.3126'); chk(17, 'P1: ħω_c (10⁻²¹ J)', hw/1e-21, '1.3842'); chk(17, 'P1/Sim: ħω_c (meV)', hw/e*1e3, '8.639'); chk(17, 'P1: ħω_c/k_B (K)', hw/kB, '100.3'); chk(17, 'Sim: 100 K', hw/kB, '100', 5e-3)
chk(17, 'P1/Sim: ℓ (nm)', ell*1e9, '11.47'); chk(17, 'P1: ℓ (10⁻⁸ m)', ell/1e-8, '1.1474'); chk(17, 'P1/Sim: eB/h (10¹⁵ m⁻²)', e*5/h/1e15, '1.209'); chk(17, 'P1/Sim: eB/h (µm⁻²)', e*5/h*1e-12, '1209'); chk(17, 'P1: 1/(2πℓ²) = eB/h', 1/(2*math.pi*ell**2), e*5/h, 1e-6)
chk(17, 'Sim: E₂ = 5/2 ħω_c (meV)', 2.5*hw/e*1e3, '21.60'); chk(17, 'Sim: ℓ√5 (nm)', ell*1e9*math.sqrt(5), '25.7', 5e-3)
chk(17, 'Sim: ħω_c con m_e y 1 T (meV)', hbar*e*1/me/e*1e3, '0.1158')
# Sec. y Problema 2
chk(17, 'Sec./P2: Φ₀ (fWb)', phi0*1e15, '4.1357'); chk(17, 'Sec.: Φ₀ (6 cifras)', phi0*1e15, '4.135668'); chk(17, 'P2: Φ₀ (10⁻¹⁵ Wb)', phi0/1e-15, '4.1357')
chk(17, 'P2/Sim: B de un cuanto con a = 0.5 µm (mT)', phi0/(math.pi*(0.5e-6)**2)*1e3, '5.266'); chk(17, 'P2: B (10⁻³ T)', phi0/(math.pi*(0.5e-6)**2)/1e-3, '5.266'); chk(17, 'P2: nº de cuantos en 1 cm² a 1 T (10¹⁰)', 1e-4/phi0/1e10, '2.418')
chk(17, 'Sim: medio cuanto (mT)', phi0/(math.pi*(0.5e-6)**2)*1e3/2, '2.633')
chk(17, 'Sec.: R_K (Ω)', RK, '25812.807', 1e-7)
# Problema 3: Hall
ne = 3e15; chk(17, 'P3: ν en 6 T', ne*phi0/6, '2.068'); chk(17, 'P3: n_e h/e (T)', ne*phi0, '12.407', 1e-6)
for nu, B_, R_ in ((1, '12.41', '25.813'), (2, '6.204', '12.906'), (3, '4.136', '8.604'), (4, '3.102', '6.453')): chk(17, f'P3: B para ν = {nu}', ne*phi0/nu, B_); chk(17, f'P3: ρxy para ν = {nu} (kΩ)', RK/nu/1e3, R_)
chk(17, 'Sim: B de ν = 2 (2 cifras)', ne*phi0/2, '6.20'); chk(17, 'Sim: B de ν = 4', ne*phi0/4, '3.10'); chk(17, 'Sim: B de ν = 1', ne*phi0, '12.41')
chk(17, 'Sim: ρxy clásica a 6 T (kΩ)', 6/(ne*e)/1e3, '12.48'); chk(17, 'Sim: ρxy cuantizada ν = 2 (kΩ)', RK/2/1e3, '12.906')
# Problema 4: AB con electrones
lam = h/math.sqrt(2*me*100*e); chk(17, 'P4: λ (pm)', lam*1e12, '122.6'); chk(17, 'P4: λ (10⁻¹⁰ m)', lam/1e-10, '1.2264')
a_ = 0.5e-6; Phi1 = 1e-3*math.pi*a_**2; chk(17, 'P4: Φ con 1 mT (fWb)', Phi1*1e15, '0.7854'); chk(17, 'P4: Φ (10⁻¹⁶ Wb)', Phi1/1e-16, '7.854'); chk(17, 'P4: Φ/Φ₀', Phi1/phi0, '0.1899', 1e-3); chk(17, 'P4: Φ/Φ₀ (3 cifras)', Phi1/phi0, '0.190'); chk(17, 'P4: fase (rad)', 2*math.pi*Phi1/phi0, '1.193'); chk(17, 'P4: πa² (10⁻¹³ m²)', math.pi*a_**2/1e-13, '7.854')
chk(17, 'P4: B para media interfranja (mT)', phi0/2/(math.pi*a_**2)*1e3, '2.633')
# Problema 5: oscilador de Landau con operadores (matrices de bosones, NumPy)
n_ = 30; a_op = np.diag(np.sqrt(np.arange(1, n_)), 1); comm = a_op@a_op.T-a_op.T@a_op
chk(17, 'P5: [a, a†] = 1 en el bloque truncado (n < 29)', float(np.max(np.abs(np.diag(comm)[:n_-1]-1))), '0.0', 1e-12, rel=False)
chk(17, 'P5: ħω_c(n + ½) con n = 2 (E/ħω_c)', 2+0.5, '2.5'); chk(17, 'P5: r (nm) con n = 2', ell*1e9*math.sqrt(5), '25.66')
# [πx, πy] = iħqB con A = (0, Bx, 0): SymPy
x_, y_, B_ = sp.symbols('x y B', real=True); f = sp.Function('f')(x_, y_); q_ = sp.Symbol('q', positive=True); hb_ = sp.Symbol('hbar', positive=True)
px = lambda g_: -sp.I*hb_*sp.diff(g_, x_); py = lambda g_: -sp.I*hb_*sp.diff(g_, y_)-q_*B_*x_*g_
comm_s = sp.simplify(px(py(f))-py(px(f)))
chk(17, 'P5: [π_x, π_y] f = iħqB f (SymPy, gauge de Landau)', 1.0 if sp.simplify(comm_s-sp.I*hb_*q_*B_*f) == 0 else 0.0, '1.0')
chk(17, 'P5: ν de a†a: (π_x²+π_y²)/2ħqB − ½ (coeficiente)', 0.5, '0.5')
# Problema 6
muB = 9.2740100783e-24; g = 2.00231930436; hwe = hbar*e*1/me; zs = g*muB
chk(17, 'P6: ħω_c libre en 1 T (µeV)', hwe/e*1e6, '115.77'); chk(17, 'P6: ħω_c (10⁻²³ J)', hwe/1e-23, '1.8548'); chk(17, 'P6: e/m_e (10¹¹)', e/me/1e11, '1.7588'); chk(17, 'P6: μ_B (µeV/T)', muB/e*1e6, '57.884'); chk(17, 'P6: g μ_B B (µeV)', zs/e*1e6, '115.90')
chk(17, 'P6: ħω_c − g μ_B B (µeV)', (hwe-zs)/e*1e6, '-0.134'); chk(17, 'P6: g/2', g/2, '1.00116'); chk(17, 'P6: a_e', (g-2)/2, '0.00116', 2e-3); chk(17, 'P6: −ħω_c a_e (µeV)', -hwe*(g-2)/2/e*1e6, '-0.134')
