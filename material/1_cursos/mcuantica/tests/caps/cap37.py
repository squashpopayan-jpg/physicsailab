# -*- coding: utf-8 -*-
# Capítulo 37: ecuación de Dirac (referencias: numpy, fórmula exacta con mpmath/numpy)
al37 = 7.2973525693e-3; mc2_37 = 510998.95; hb37 = 1.054571817e-34; me37 = 9.1093837015e-31; c37 = 2.99792458e8
def _hyd(n, j, Z):
    za = Z*al37; d = j+0.5-math.sqrt((j+0.5)**2-za*za); return 1/math.sqrt(1+za*za/(n-d)**2)
def _kl(E, V0):
    p = math.sqrt(E*E-1); eps = E-V0
    if eps*eps < 1: return None
    q = math.sqrt(eps*eps-1); k = q if eps > 0 else -q; r = k*(E+1)/(p*(eps+1)); return p, q, r, ((1-r)/(1+r))**2, 4*r/(1+r)**2
def _dirac1d(N, L, sigma, p0, chi, t):
    x = -L/2+np.arange(N)*L/N; g = (2*math.pi*sigma**2)**-0.25*np.exp(-x*x/(4*sigma**2)); a = np.cos(chi)*g*np.exp(1j*p0*x); b = np.sin(chi)*g*np.exp(1j*p0*x)
    nr = math.sqrt((abs(a)**2+abs(b)**2).sum()*L/N); a /= nr; b /= nr; k = 2*np.pi*np.fft.fftfreq(N, L/N); E = np.sqrt(k*k+1); ak = np.fft.fft(a); bk = np.fft.fft(b)
    c, s = np.cos(E*t), np.sin(E*t)/E; ak2 = (c-1j*s)*ak-1j*s*k*bk; bk2 = -1j*s*k*ak+(c+1j*s)*bk; a2 = np.fft.ifft(ak2); b2 = np.fft.ifft(bk2); rho = abs(a2)**2+abs(b2)**2; dx = L/N
    w = np.sum(ak.conj()*ak+bk.conj()*bk)  # norma en k
    return dict(x=float((x*rho).sum()/rho.sum()), sx=float((2*(a2.conj()*b2).real).sum()/rho.sum()), norm=float(rho.sum()*dx))
def _wneg(N, L, sigma, p0, chi):
    x = -L/2+np.arange(N)*L/N; g = (2*math.pi*sigma**2)**-0.25*np.exp(-x*x/(4*sigma**2)); a = np.cos(chi)*g*np.exp(1j*p0*x); b = np.sin(chi)*g*np.exp(1j*p0*x); k = 2*np.pi*np.fft.fftfreq(N, L/N); E = np.sqrt(k*k+1); ak = np.fft.fft(a); bk = np.fft.fft(b)
    num = 0.5*((abs(ak)**2+abs(bk)**2)-(1*(abs(ak)**2-abs(bk)**2)+2*k*(ak.conj()*bk).real)/E); return float(num.sum()/(abs(ak)**2+abs(bk)**2).sum())
# ---- Simulación 37.1
ps = _dirac1d(512, 80.0, 1.0, 0.0, math.pi/4, 3.0)
chk(37, 'Sim: peso negativo (σ = 1, χ = 45°) (%)', _wneg(512, 80.0, 1.0, 0.0, math.pi/4)*100, '50.00'); chk(37, 'Sim: 2E₀ (p₀ = 0)', 2.0, '2.0000'); chk(37, 'Sim: π/E₀', math.pi, '3.1416'); chk(37, 'Sim: ⟨σ_x⟩ (t = 3)', ps['sx'], '0.8609'); chk(37, 'Sim: norma', ps['norm'], '1.000000')
xs = [_dirac1d(512, 80.0, 1.0, 0.0, math.pi/4, 0.1*i)['x'] for i in range(121)]; chk(37, 'Sim: ⟨x⟩ mínimo (σ = 1)', min(xs), '-0.0227'); chk(37, 'Sim: ⟨x⟩ máximo (σ = 1)', max(xs), '1.7952')
xs3 = [_dirac1d(512, 80.0, 3.0, 0.0, math.pi/4, 0.1*i)['x'] for i in range(121)]; chk(37, 'Sim: ⟨x⟩ mínimo (σ = 3)', min(xs3), '-0.4196'); chk(37, 'Sim: ⟨x⟩ máximo (σ = 3)', max(xs3), '0.7142')
xs0 = [_dirac1d(512, 80.0, 0.4, 1.0, 0.0, 0.1*i)['x'] for i in range(121)]; chk(37, 'Sim: ⟨x⟩ máximo (σ = 0.4, p₀ = 1, χ = 0)', max(xs0), '2.8019')
# ---- Simulación 37.2
for (E, V0, vals) in ((2.0, 0.5, ('0.7746', '0.98387', '0.01613')), (2.0, 5.0, ('2.4495', '0.82343', '0.17657'))):
    p, q, r, R, T = _kl(E, V0); chk(37, f'Sim: r (E = 2, V₀ = {V0})', r, vals[0]); chk(37, f'Sim: T (V₀ = {V0})', T, vals[1], ); chk(37, f'Sim: R (V₀ = {V0})', R, vals[2])
chk(37, 'Sim: q (V₀ = 5)', _kl(2.0, 5.0)[1], '2.8284'); chk(37, 'Sim: T∞ (E = 2)', 4*math.sqrt(3)*3/(math.sqrt(3)+3)**2, '0.92820'); chk(37, 'Sim: R + T', sum(_kl(2.0, 5.0)[3:]), '1.0')
# ---- P1
E = math.sqrt(2); nrm = math.sqrt((E+1)/(2*E)); low = 1/(E+1)
chk(37, 'P1: E (mc²)', E, '1.4142'); chk(37, 'P1: E (keV)', E*mc2_37/1e3, '722.66'); chk(37, 'P1: norma', nrm, '0.9239'); chk(37, 'P1: razón pequeña/grande', low, '0.4142'); chk(37, 'P1: componente 3', nrm*low, '0.3827'); chk(37, 'P1: u†u', nrm**2*(1+low**2), '1.0', 1e-12)
chk(37, 'P1: m u₁ + p u₃', nrm+nrm*low, '1.3066'); chk(37, 'P1: E u₁', E*nrm, '1.3066'); chk(37, 'P1: p u₁ − m u₃', nrm-nrm*low, '0.5412'); chk(37, 'P1: E u₃', E*nrm*low, '0.5412'); chk(37, 'P1: 0.9239² + 0.3827²', 0.9239**2+0.3827**2, '1.0', 1e-3)
chk(37, 'P1: √(2.4142/2.8284)', math.sqrt(2.4142/2.8284), '0.9239')
# ---- P2
w = 2*me37*c37**2/hb37; chk(37, 'P2: 2mc² (10⁻¹³ J)', 2*me37*c37**2/1e-13, '1.637'); chk(37, 'P2: ω (10²¹ s⁻¹)', w/1e21, '1.553'); chk(37, 'P2: periodo (10⁻²¹ s)', 2*math.pi/w/1e-21, '4.05'); chk(37, 'P2: ħ/2mc (10⁻¹³ m)', hb37/(2*me37*c37)/1e-13, '1.931'); chk(37, 'P2: ħ/mc (10⁻¹³ m)', hb37/(me37*c37)/1e-13, '3.862'); chk(37, 'P2: mc² (10⁻¹⁴ J)', me37*c37**2/1e-14, '8.187')
# ---- P3 (además de los de la simulación)
p, q, r, R, T = _kl(2.0, 5.0); chk(37, 'P3: p', p, '1.7321'); chk(37, 'P3: (1 − r)/(1 + r)', (1-r)/(1+r), '-0.4202'); chk(37, 'P3: 4r/(1+r)²', T, '0.82343'); chk(37, 'P3: r (V₀ → ∞)', 3/math.sqrt(3), '1.7321'); chk(37, 'P3: q (V₀ = 0.5)', _kl(2.0, 0.5)[1], '1.1180')
chk(37, 'P3: r numerador', -2.8284*3, '-8.4852', 1e-3); chk(37, 'P3: r denominador', 1.7321*(-2), '-3.4642')
# ---- P4
for Z, (B, Bn, rat) in ((92, ('132.28', '115.16', '1.1487')), (1, ('13.6059', '13.6057', '1.00001'))):
    Bk = (1-_hyd(1, 0.5, Z))*mc2_37; Bnk = 0.5*(Z*al37)**2*mc2_37
    if Z == 92: chk(37, 'P4: ligadura 1s (keV) Z = 92', Bk/1e3, B); chk(37, 'P4: no relativista (keV) Z = 92', Bnk/1e3, Bn); chk(37, 'P4: cociente Z = 92', Bk/Bnk, rat)
    else: chk(37, 'P4: ligadura 1s (eV) Z = 1', Bk, B, 1e-5); chk(37, 'P4: no relativista (eV) Z = 1', Bnk, Bn, 1e-5); chk(37, 'P4: cociente Z = 1', Bk/Bnk, rat)
f1 = (_hyd(2, 1.5, 1)-_hyd(2, 0.5, 1))*mc2_37; chk(37, 'P4: fina Z = 1 (10⁻⁵ eV)', f1/1e-5, '4.5284'); chk(37, 'P4: fina Z = 1 (GHz)', f1/4.135667696e-15/1e9, '10.950'); chk(37, 'P4: α⁴mc²/32 (10⁻⁵ eV)', al37**4*mc2_37/32/1e-5, '4.5283')
f92 = (_hyd(2, 1.5, 92)-_hyd(2, 0.5, 92))*mc2_37; chk(37, 'P4: fina Z = 92 (eV)', f92, '4565.6'); chk(37, 'P4: α⁴ Z = 92 (eV)', 92**4*al37**4*mc2_37/32, '3244.0'); chk(37, 'P4: Zα (Z = 92)', 92*al37, '0.67136'); chk(37, 'P4: (Zα)²', (92*al37)**2, '0.45072'); chk(37, 'P4: E_1s (mc²)', _hyd(1, 0.5, 92), '0.74113'); chk(37, 'P4: 1 − (Zα)²', 1-(92*al37)**2, '0.54928')
chk(37, 'P4: exceso relativo Z = 1 (10⁻⁵)', ((1-_hyd(1, 0.5, 1))/(0.5*al37**2)-1)/1e-5, '1.3', 5e-2)
chk(37, 'P4: degeneración 2s½ − 2p½', _hyd(2, 0.5, 30)-_hyd(2, 0.5, 30), '0.0', 1e-15, rel=False)
# ---- P5
for n, v in ((1, '1.2649'), (2, '1.4832'), (3, '1.6733'), (4, '1.8439')): chk(37, f'P5: E_{n}', math.sqrt(1+0.6*n), v)
for n, v in ((1, '1.3'), (2, '1.6'), (3, '1.9'), (4, '2.2')): chk(37, f'P5: no relativista {n}', 1+0.3*n, v)
for n, v in ((1, '1.255'), (2, '1.420'), (3, '1.495'), (4, '1.480')): chk(37, f'P5: segundo orden {n}', 1+0.3*n-(0.3*n)**2/2, v)
chk(37, 'P5: √1.6', math.sqrt(1.6), '1.2649'); chk(37, 'P5: √2.2', math.sqrt(2.2), '1.4832')
# ---- P6
chk(37, 'P6: a₀/Z (10⁻¹³ m)', 5.29177210903e-11/92/1e-13, '5.75'); chk(37, 'P6: a₀/Z (fm)', 5.29177210903e-11/92/1e-15, '575', 1e-3); chk(37, 'P6: cociente con el radio nuclear', 5.29177210903e-11/92/7.4e-15, '78', 1e-2)
chk(37, 'P6: Zα (E = ½)', math.sqrt(0.75), '0.8660'); chk(37, 'P6: Z (E = ½)', math.sqrt(0.75)/al37, '118.68'); chk(37, 'P6: Z crítico', 1/al37, '137.04'); chk(37, 'P6: 2mc² (keV)', 2*mc2_37/1e3, '1021.998', 1e-6); chk(37, 'P6: positronio (eV)', -13.605693123/2, '-6.8028')
