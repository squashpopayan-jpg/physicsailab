# -*- coding: utf-8 -*-
# Capítulo 15: espín ½
g = 2.00231930436; muB = 9.2740100783e-24; hb = hbar
wL = lambda B: g*muB*B/hb
# Ejemplo: Stern–Gerlach de la plata
u = 1.66053906660e-27; mAg = 107.87*u; F = muB*1e3; a = F/mAg; t = 0.035/500; d = 0.5*a*t*t
chk(15, 'Ej.: F (10⁻²¹ N)', F/1e-21, '9.274'); chk(15, 'Ej.: a (10⁴ m/s²)', a/1e4, '5.177'); chk(15, 'Ej.: t (µs)', t*1e6, '70.0', 1e-9); chk(15, 'Ej.: d (mm)', d*1e3, '0.1268'); chk(15, 'Ej.: 2d (mm)', 2*d*1e3, '0.254')
chk(15, 'Sec.: μ_B', muB/1e-24, '9.274'); chk(15, 'Sec.: g', g, '2.0023', 1e-4)
# Sec. dinámica y simulación
chk(15, 'Sec.: ω_L/B (10¹¹ rad s⁻¹ T⁻¹)', wL(1)/1e11, '1.7609'); chk(15, 'Sec./Sim: f_L (GHz/T)', wL(1)/2/math.pi/1e9, '28.025'); chk(15, 'Sim: periodo en 1 T (ps)', 2*math.pi/wL(1)*1e12, '35.68')
chk(15, 'Sec.: γ_p/2π (MHz/T)', 2.6752218744e8/2/math.pi/1e6, '42.577')
chk(15, 'Sim: probabilidad de ↑ con θ = 60°', math.cos(math.radians(30))**2, '0.75', 1e-12)
chk(15, 'Sim: cos⁴(22.5°) (%)', math.cos(math.radians(22.5))**4*100, '72.86'); chk(15, 'Sim: cos²(45°)', math.cos(math.radians(45))**2, '0.5', 1e-12)
chk(15, 'Sim: sin²α/4 máximo', max(math.sin(x)**2/4 for x in np.linspace(0, math.pi, 3601)), '0.25', 1e-9)
# Nota: muchos analizadores
for N, v in ((2, '0.25'), (5, '0.6054'), (10, '0.7805'), (100, '0.9756')): chk(15, f'Nota/P3: cos^(2N)(π/2N), N = {N}', math.cos(math.pi/(2*N))**(2*N), v)
# Problema 1
chk(15, 'P1: ω_L electrón en 1.5 T (10¹¹)', wL(1.5)/1e11, '2.641'); chk(15, 'P1: f electrón (GHz)', wL(1.5)/2/math.pi/1e9, '42.04'); chk(15, 'P1: periodo electrón (ps)', 2*math.pi/wL(1.5)*1e12, '23.79')
chk(15, 'P1: f protón (MHz)', 42.577*1.5, '63.87', 1e-4); chk(15, 'P1: periodo protón (ns)', 1/(2.6752218744e8*1.5/2/math.pi)*1e9, '15.66')
chk(15, 'P1: 28.025·1.5', 28.025*1.5, '42.04', 1e-4)
# Problema 2: ψ = (3/5, 4i/5)
sx = np.array([[0, 1], [1, 0]], complex); sy = np.array([[0, -1j], [1j, 0]]); sz = np.diag([1.0, -1.0]).astype(complex)
psi = np.array([3/5, 4j/5]); bl = [float(np.real(np.conj(psi)@s@psi)) for s in (sx, sy, sz)]
chk(15, 'P2: P↑', abs(psi[0])**2, '0.36'); chk(15, 'P2: P↓', abs(psi[1])**2, '0.64'); chk(15, 'P2: ⟨σx⟩', bl[0], '0.0', 1e-12, rel=False); chk(15, 'P2: ⟨σy⟩', bl[1], '0.96'); chk(15, 'P2: ⟨σz⟩', bl[2], '-0.28')
chk(15, 'P2: |b|²', sum(x*x for x in bl), '1.0'); chk(15, 'P2: 0.96² + 0.28²', 0.96**2+0.28**2, '1.0'); chk(15, 'P2: ΔS_z (ħ)', 0.5*math.sqrt(1-0.28**2), '0.48'); chk(15, 'P2: 1 − 0.0784', 1-0.28**2, '0.9216')
chk(15, 'P2: P(S_y = +)', (1+bl[1])/2, '0.98'); chk(15, 'P2: 2·0.48', 2*0.48, '0.96')
# Problema 3: z+ → α → z−
chk(15, 'P3: P(α = 90°)', math.cos(math.pi/4)**2*math.cos(math.pi/4)**2, '0.25'); chk(15, 'P3: sin α cos α', (math.sin(math.pi/2)**2)/4, '0.25')
chk(15, 'P3: P = sin²α/4 (SymPy)', 1.0 if sp.simplify(sp.cos(sp.Symbol('a')/2)**2*sp.cos((sp.pi-sp.Symbol('a'))/2)**2-sp.sin(sp.Symbol('a'))**2/4) == 0 else 0.0, '1.0')
chk(15, 'P3: N = 5: cos¹⁰(18°)', math.cos(math.radians(18))**10, '0.6054'); chk(15, 'P3: N = 10: cos²⁰(9°)', math.cos(math.radians(9))**20, '0.7805'); chk(15, 'P3: N = 2: cos⁴45°', math.cos(math.pi/4)**4, '0.25')
chk(15, 'P3: P ≈ exp(−π²/4N) con N = 100', math.exp(-math.pi**2/400), math.cos(math.pi/200)**200, 1e-4)
# Problema 4
B4 = 0.1; chk(15, 'P4: ω_L (10¹⁰ rad/s)', wL(B4)/1e10, '1.7609'); chk(15, 'P4: f (GHz)', wL(B4)/2/math.pi/1e9, '2.8025'); chk(15, 'P4: t (10⁻¹¹ s)', (math.pi/2)/wL(B4)/1e-11, '8.921'); chk(15, 'P4: t (ps)', (math.pi/2)/wL(B4)*1e12, '89.2'); chk(15, 'P4: periodo (ps)', 2*math.pi/wL(B4)*1e12, '356.8')
# Problema 5
chk(15, 'P5: sin²30°', math.sin(math.radians(30))**2, '0.25', 1e-12); chk(15, 'P5: t del máximo (10⁻¹⁰ s)', math.pi/wL(B4)/1e-10, '1.784'); chk(15, 'P5: t del máximo (ps)', math.pi/wL(B4)*1e12, '178.4'); chk(15, 'P5: P(ω t = π/2)', 0.25*math.sin(math.pi/4)**2, '0.125')
th = math.radians(30); w5 = np.array([math.sin(th), 0, math.cos(th)]); U = lambda t_: linalg.expm(-0.5j*wL(B4)*t_*(w5[0]*sx+w5[2]*sz))
chk(15, 'P5: P↓(t) numérica con expm, ω t = π/2', abs((U(math.pi/2/wL(B4))@np.array([1, 0]))[1])**2, '0.125'); chk(15, 'P5: P↓ máxima con expm', abs((U(math.pi/wL(B4))@np.array([1, 0]))[1])**2, '0.25')
# Problema 6
gn = 1.8324717e8; tt = 0.02/2200; mn = 1.67492749804e-27; hh = 6.62607015e-34
chk(15, 'P6: tiempo de vuelo (µs)', tt*1e6, '9.091'); chk(15, 'P6: B(2π) (mT)', 2*math.pi/(gn*tt)*1e3, '3.772'); chk(15, 'P6: B(4π) (mT)', 4*math.pi/(gn*tt)*1e3, '7.543'); chk(15, 'Sim: B(2π) (mT)', 2*math.pi/(gn*tt)*1e3, '3.77'); chk(15, 'Sim: B(π) (mT)', math.pi/(gn*tt)*1e3, '1.886')
for phi, v in ((math.pi, '0.5'), (2*math.pi, '0.0'), (4*math.pi, '1.0')): chk(15, f'P6: cos²(φ/4), φ = {phi/math.pi:.0f}π', math.cos(phi/4)**2, v, 1e-12, rel=False)
chk(15, 'P6/Sim: λ (Å)', hh/(mn*2200)*1e10, '1.798')
