# -*- coding: utf-8 -*-
# Capítulo 5: Doppler, aberración, Cherenkov, campos en movimiento
D = lambda b, th: 1/((1/math.sqrt(1-b*b))*(1-b*math.cos(th)))
alpha = C.alpha
# Doppler
for z, bb in ((0.1, '0.0950'), (1, '0.6'), (2, '0.8')): chk(5, f'Texto: z = {z} ↔ β', ((1+z)**2-1)/((1+z)**2+1), bb)
chk(5, 'Ej. Doppler: 1+z a β=0.1', math.sqrt(1.1/0.9), '1.10554'); chk(5, 'Ej. Doppler: λ (nm)', 656.28*math.sqrt(1.1/0.9), '725.54'); chk(5, 'Ej. Doppler: z', math.sqrt(1.1/0.9)-1, '0.1055'); chk(5, 'Ej. Doppler: λ (nm, 1 decimal)', 656.28*math.sqrt(1.1/0.9), '725.5')
chk(5, 'Ej. Doppler: error de la fórmula clásica (%)', (math.sqrt(1.1/0.9)-1-0.1)/0.1*100, '5.5')
chk(5, 'Ej. Doppler: 1+z con 700 nm', 700/656.28, '1.0666'); chk(5, 'P1b: 1+z (5 cifras)', 700/656.28, '1.06662'); r = 700/656.28; chk(5, 'P1b: (1+z)²−1', r*r-1, '0.13767'); chk(5, 'P1b: (1+z)²+1', r*r+1, '2.13767'); chk(5, 'P1b: β', (r*r-1)/(r*r+1), '0.0644'); chk(5, 'P1b: v (10⁴ km/s)', (r*r-1)/(r*r+1)*c/1e7, '1.93'); chk(5, 'Ej. Doppler: v (km/s)', (r*r-1)/(r*r+1)*c/1e3, 19300, 1e-3)
vr = 100/3.6; chk(5, 'Ej. radar: Δf (Hz)', 2*24.15e9*vr/c, '4475'); chk(5, 'P1c: v (m/s)', vr, '27.78')
# Ives-Stilwell
b = .005; g = 1/math.sqrt(1-b*b); l0 = 486.13
chk(5, 'P3: λ azul', l0*math.sqrt((1-b)/(1+b)), '483.705'); chk(5, 'P3: λ rojo', l0*math.sqrt((1+b)/(1-b)), '488.567'); chk(5, 'P3: media', (l0*math.sqrt((1-b)/(1+b))+l0*math.sqrt((1+b)/(1-b)))/2, '486.136'); chk(5, 'P3: desplazamiento (pm)', l0*(g-1)*1e3, '6.08'); chk(5, 'P3: γ−1 (10⁻⁵)', (g-1)*1e5, '1.2500')
chk(5, 'P3: clásica azul', l0*(1-b), '483.699'); chk(5, 'P3: clásica roja', l0*(1+b), '488.561'); chk(5, 'Texto: ½β²λ₀ (pm)', 0.5*b*b*l0*1e3, '6.08')
# CMB
bc = 369.82e3/c
chk(5, 'Ej. CMB: β (10⁻³)', bc*1e3, '1.2336'); chk(5, 'Ej. CMB: T₀β (mK)', 2.7255*bc*1e3, '3.362'); chk(5, 'P2: T hacia delante (K)', 2.7255*math.sqrt((1+bc)/(1-bc)), '2.72886'); chk(5, 'P2: exceso (mK)', (2.7255*math.sqrt((1+bc)/(1-bc))-2.7255)*1e3, '3.364'); chk(5, 'P2: ½β²T₀ (µK)', 0.5*bc*bc*2.7255*1e6, '2.07')
# sim doppler
b = .3; chk(5, 'Sim Doppler: f/f₀ aleja', D(b, math.pi), '0.7338'); chk(5, 'Sim Doppler: λ (nm)', 656.28/D(b, math.pi), '894.4'); chk(5, 'Sim Doppler: z', 1/D(b, math.pi)-1, '0.3628'); chk(5, 'Sim Doppler: f/f₀ acerca', D(b, 0), '1.3628'); chk(5, 'Sim Doppler: Hα acerca (nm)', 656.28/D(b, 0), '481.6')
chk(5, 'Sim Doppler: β=0.6, 1/γ', D(.6, math.pi/2), '0.8'); chk(5, 'Sim Doppler: β=0.99, acerca', D(.99, 0), '14.1'); chk(5, 'Sim Doppler: β=0.99, aleja', D(.99, math.pi), '0.0709')
# aberración / faro
b = .8
chk(5, 'Ej. aberración: arccos 0.8 (°)', math.degrees(math.acos(b)), '36.87'); chk(5, 'Sim aberración: desplazamiento (°)', 90-math.degrees(math.acos(b)), '53.1'); chk(5, 'P4: desplazamiento (°)', 90-math.degrees(math.acos(b)), '53.13')
chk(5, 'P4: D² delante', (1+b)/(1-b), '9'); chk(5, 'P4: D² detrás', (1-b)/(1+b), '0.1111'); chk(5, 'P4: D² delante (1.8/0.2)', 1.8/0.2, '9')
chk(5, 'Sim aberración: 1/γ en rad → °', math.degrees(0.6), '34.4'); chk(5, 'Sim aberración: arccos β (°)', math.degrees(math.acos(b)), '36.9')
chk(5, 'Texto: aberración anual (10⁻⁵ rad)', 29.78e3/c*1e5, '9.93'); chk(5, 'Texto: constante de aberración (″)', 29.78e3/c*206264.806, '20.49')
chk(5, 'Sim aberración: β=0.0001 → ″', 1e-4*206264.806, '20.6'); chk(5, 'Sim aberración: β=0.99, semiángulo', math.degrees(math.acos(.99)), '8.1'); chk(5, 'Sim aberración: β=0.99, D² delante', (1.99/0.01), '199')
bj = .98; gj = 1/math.sqrt(1-bj*bj); chk(5, 'Texto: velocidad aparente máxima γβ', gj*bj, '4.92')
# velocidad aparente: máximo con SymPy
th_, b_ = sp.symbols('theta beta', positive=True); vap = b_*sp.sin(th_)/(1-b_*sp.cos(th_))
cs = sp.solve(sp.diff(vap, th_), th_); vmax = [sp.simplify(vap.subs(th_, s_)) for s_ in cs]
chk(5, 'SymPy: v_ap máxima con β = 0.98 (en c) = γβ', abs(float(vmax[0].subs(b_, 0.98))), gj*bj, 1e-9)
# Cherenkov
n = 1.333; gth = 1/math.sqrt(1-1/n**2)
chk(5, 'Texto: γ umbral', gth, '1.5123'); chk(5, 'P5: γ umbral', gth, '1.51234'); chk(5, 'P5: 1/n', 1/n, '0.7502'); chk(5, 'Texto: K_u electrón (MeV)', (gth-1)*0.51099895, '0.2618'); chk(5, 'Texto: K_u muón (MeV)', (gth-1)*105.6583755, '54.1'); chk(5, 'P5: K_u muón (MeV, 2 decimales)', (gth-1)*105.6583755, '54.13'); chk(5, 'Texto: K_u pión (MeV)', (gth-1)*139.57039, '71.5'); chk(5, 'Texto: K_u protón (MeV)', (gth-1)*938.27208816, '480.7')
chk(5, 'Texto: θ máx en agua (°)', math.degrees(math.acos(1/n)), '41.39'); chk(5, 'P5: 0.51234', gth-1, '0.51234')
chk(5, 'P5: 2π/137.036', 2*math.pi*alpha, '0.045851') if False else chk(5, 'P5: 2πα', 2*math.pi*alpha, '0.045851')
chk(5, 'P5: sen²θ = 1−1/n²', 1-1/n**2, '0.43722'); chk(5, 'P5: dN/dx (10⁴ por m)', 2*math.pi*alpha*(1-1/n**2)*(1/300e-9-1/600e-9)/1e4, '3.341'); chk(5, 'Texto: fotones por cm (β=1)', 2*math.pi*alpha*(1-1/n**2)*(1/300e-9-1/600e-9)/100, '334')
g5 = 1+5/0.51099895; b5 = math.sqrt(1-1/g5**2)
chk(5, 'P5: γ electrón 5 MeV', g5, '10.785'); chk(5, 'P5: β', b5, '0.995692'); chk(5, 'P5: cosθ', 1/(n*b5), '0.75343'); chk(5, 'P5: θ (°)', math.degrees(math.acos(1/(n*b5))), '41.11'); chk(5, 'Sim Cherenkov: β electrón 5 MeV', b5, '0.99569')
chk(5, 'Sim Cherenkov: fotones/cm (5 MeV)', 2*math.pi*alpha*(1-1/(n*b5)**2)*(1/300e-9-1/600e-9)/100, '330', 3e-3)
g2 = 1+0.2/0.51099895; chk(5, 'Sim Cherenkov: β electrón 0.2 MeV', math.sqrt(1-1/g2**2), '0.695');
gm = 1+1000/105.6583755; bm = math.sqrt(1-1/gm**2); chk(5, 'Sim Cherenkov: β muón 1 GeV', bm, '0.99542'); chk(5, 'Sim Cherenkov: θ muón 1 GeV (°)', math.degrees(math.acos(1/(n*bm))), '41.09')
chk(5, 'Sim Cherenkov: aerogel θ máx (°)', math.degrees(math.acos(1/1.03)), '13.86'); chk(5, 'Sim Cherenkov: aerogel K_u electrón (MeV)', (1/math.sqrt(1-1/1.03**2)-1)*0.51099895, '1.62'); chk(5, 'Sim Cherenkov: aire θ máx (°)', math.degrees(math.acos(1/1.000293)), '1.39'); chk(5, 'Sim Cherenkov: aire K_u electrón (MeV)', (1/math.sqrt(1-1/1.000293**2)-1)*0.51099895, '20.6')
# campos
bf = .8; gf = 1/math.sqrt(1-bf*bf); chk(5, 'Sim carga: γ', gf, '1.667'); chk(5, 'Sim carga: 1/γ²', 1/gf**2, '0.36'); chk(5, 'Sim carga: E⊥/E_C', gf, '1.667')
# Purcell
I = 100; d = .01; v = 1e6; qe = C.e; Bf = C.mu_0*I/(2*math.pi*d)
chk(5, 'Ej. Purcell: B (mT)', Bf*1e3, '2.000'); chk(5, 'Ej. Purcell: F (10⁻¹⁶ N)', qe*v*Bf/1e-16, '3.204'); chk(5, 'Ej. Purcell: λ′ (10⁻⁹ C/m)', v*I/c**2/1e-9, '1.113'); chk(5, 'Ej. Purcell: E′ (V/m)', v*I/c**2/(2*math.pi*C.epsilon_0*d), '2000'); chk(5, 'Ej. Purcell: F′ (10⁻¹⁶ N)', qe*v*I/c**2/(2*math.pi*C.epsilon_0*d)/1e-16, '3.204')
chk(5, 'Ej. Purcell: γ−1 (10⁻⁶)', (1/math.sqrt(1-(v/c)**2)-1)/1e-6, '5.6') if False else chk(5, 'Ej. Purcell: γ−1 (10⁻⁶)', (1/math.sqrt(1-(v/c)**2)-1)/1e-6, '5.6')
chk(5, 'P6: B (10⁻³ T)', Bf*1e3, '2.000'); chk(5, 'P6: F (10⁻¹⁶ N)', qe*v*Bf/1e-16, '3.204'); chk(5, 'P6: λ′ (10⁻⁹ C/m)', v*I/c**2/1e-9, '1.1127'); chk(5, 'P6: ε₀ (10⁻¹²)', C.epsilon_0/1e-12, '8.854')
