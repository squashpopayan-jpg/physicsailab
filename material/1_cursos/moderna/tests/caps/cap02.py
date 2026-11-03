# -*- coding: utf-8 -*-
# Capítulo 2: transformación de Lorentz, muones, suma de velocidades, Fizeau
from particle import Particle
_mu = Particle.from_pdgid(13); tau = float(_mu.lifetime)*1e-9; mmu = float(_mu.mass)
g = lambda b: 1/math.sqrt(1-b*b)
chk(2, 'PDG: τ del muón (µs)', tau*1e6, '2.19698'); chk(2, 'PDG: m del muón (MeV)', mmu, '105.658')
# suceso
b = .6; G = g(b); ct = c*1e-6; x = 300.0
xp = G*(x-b*ct); ctp = G*(ct-b*x)
chk(2, 'Ej. suceso: ct (m)', ct, '299.792'); chk(2, "Ej. suceso: x′ (m)", xp, '150.16'); chk(2, "Ej. suceso: ct′ (m)", ctp, '149.74'); chk(2, "Ej. suceso: t′ (µs)", ctp/c*1e6, '0.4995')
chk(2, 'Ej. suceso: (ct)² (m²)', ct**2, '89875.5'); chk(2, 'Ej. suceso: (ct)²−x²', ct**2-x**2, '-124.5'); chk(2, "Ej. suceso: (ct′)² (m²)", ctp**2, '22422.2'); chk(2, "Ej. suceso: x′² (m²)", xp**2, '22546.7'); chk(2, "Ej. suceso: (ct′)²−x′²", ctp**2-xp**2, '-124.5')
chk(2, 'Ej. suceso: x′ (3 decimales)', xp, '150.156')
chk(2, 'P3: x′', xp, '150.156'); chk(2, "P3: t′ (10⁻⁷ s)", ctp/c*1e7, '4.9948'); chk(2, 'P3: intervalo (m²)', ct**2-x**2, '-124.48'); chk(2, "P3: intervalo en S′ (m²)", ctp**2-xp**2, '-124.48')
# SymPy: la transformación conserva el intervalo
X, T, B = sp.symbols('X T B', positive=True); Gs = 1/sp.sqrt(1-B**2)
chk(2, 'SymPy: (ct′)²−x′² − (ct)² + x² = 0 (β = 0.6)', sp.simplify(((Gs*(T-B*X))**2-(Gs*(X-B*T))**2-(T**2-X**2)).subs(B, sp.Rational(3, 5)).subs({X: 3, T: 7})), 0, 1e-12, False)
chk(2, 'SymPy: γ²(1−β²) = 1 de forma simbólica', sp.simplify(Gs**2*(1-B**2)), 1, 1e-12)
# muones
b = .998; G = g(b); d = b*G*c*tau
chk(2, 'Ej. muón: γ', G, '15.819'); chk(2, 'Ej. muón: βγcτ (km)', d/1e3, '10.398'); chk(2, 'Ej. muón: supervivencia', math.exp(-15e3/d), '0.2363')
chk(2, 'Ej. muón: βcτ (m)', b*c*tau, '657.3'); chk(2, 'Ej. muón: sin dilatación (10⁻¹⁰)', math.exp(-15e3/(b*c*tau))*1e10, '1.2')
chk(2, 'Ej. muón: altura contraída (m)', 15e3/G, '948.2'); chk(2, 'Ej. muón: tiempo (µs)', 15e3/G/(b*c)*1e6, '3.169'); chk(2, 'Ej. muón: t/τ', 15e3/G/(b*c)/tau, '1.4425'); chk(2, 'Ej. muón: exp(−t/τ)', math.exp(-15e3/G/(b*c)/tau), '0.2363')
chk(2, 'Texto: factor sobre el caso clásico (×10⁹)', math.exp(-15e3/d)/math.exp(-15e3/(b*c*tau))/1e9, '1.9')
chk(2, 'Sim muones: 1.67 GeV → γ', 1670/mmu, 15.8, 3e-3); chk(2, 'Sim muones: β a 1.67 GeV', math.sqrt(1-1/(1670/mmu)**2), 0.998, 5e-4)
chk(2, 'Sim muones: altura contraída a 1.67 GeV (km)', 15/(1670/mmu), 0.949, 5e-3)
Gm = 3000/mmu; bm = math.sqrt(1-1/Gm**2); dm = bm*Gm*c*tau
chk(2, 'P1: γ', Gm, '28.393'); chk(2, 'P1: β', bm, '0.999380'); chk(2, 'P1: γτ (µs)', Gm*tau*1e6, '62.38'); chk(2, 'P1: βγcτ (km)', dm/1e3, '18.689'); chk(2, 'P1: βcτ (m)', bm*c*tau, '658.2')
chk(2, 'P1: supervivencia con dilatación', math.exp(-15e3/dm), '0.448'); chk(2, 'P1: sin dilatación (10⁻¹⁰)', math.exp(-15e3/(bm*c*tau))*1e10, '1.3'); chk(2, 'P1: βγcτ (m, entero)', dm, '18689')
Gl = 300/mmu; bl = math.sqrt(1-1/Gl**2); dl = bl*Gl*c*tau
chk(2, 'Sim muones: 0.3 GeV, γ', Gl, '2.84'); chk(2, 'Sim muones: 0.3 GeV, βγcτ (km)', dl/1e3, '1.75'); chk(2, 'Sim muones: 0.3 GeV, supervivencia (%)', math.exp(-15e3/dl)*100, '0.019')
# contracción
b = .8; L = 1/g(b)
chk(2, 'Sim contracción: L (m) a β=0.8', L, '0.6'); chk(2, 'Sim contracción: L/v (ns)', L/(b*c)*1e9, '2.50'); chk(2, 'Sim contracción: L₀/v (ns)', 1/(b*c)*1e9, '4.17'); chk(2, 'Sim contracción: razón γ', (1/(b*c))/(L/(b*c)), '1.667')
chk(2, 'Sim contracción: β=0.99, L/L₀ (%)', 100/g(.99), '14.1'); chk(2, 'Sim contracción: β=0.1, contracción (%)', (1-1/g(.1))*100, '0.5')
# P2
b = .6
chk(2, 'P2a: L (m)', 100/g(b), '80'); chk(2, 'P2a: Δt (10⁻⁷ s)', 80/(b*c)*1e7, '4.4475'); chk(2, 'P2a: Δt′ (10⁻⁷ s)', 100/(b*c)*1e7, '5.5594'); chk(2, 'P2a: razón γ', 100/80, '1.25'); chk(2, 'P2a: Δt (ns)', 80/(b*c)*1e9, '444.8'); chk(2, 'P2a: Δt′ (ns)', 100/(b*c)*1e9, '555.9')
b = .95; Gp = g(b)
chk(2, 'P2b: γ(0.95)', Gp, '3.2026'); chk(2, 'P2b: tiempo en la Tierra (años)', 4.2465/b, '4.470'); chk(2, 'P2b: tiempo en la nave (años)', 4.2465/b/Gp, '1.396'); chk(2, 'P2b: distancia contraída (ly)', 4.2465/Gp, '1.326'); chk(2, 'P2b: comprobación d′/v (años)', 4.2465/Gp/b, '1.396')
# suma de velocidades
chk(2, 'Ej. suma: 1.6/1.64', 1.6/1.64, '0.9756'); chk(2, 'Ej. suma: artanh 0.8', math.atanh(.8), '1.0986'); chk(2, 'Ej. suma: 2 artanh 0.8', 2*math.atanh(.8), '2.1972'); chk(2, 'Ej. suma: tanh', math.tanh(2*math.atanh(.8)), '0.9756')
chk(2, 'P4: 0.9+0.9', 1.8/1.81, '0.99448'); chk(2, 'P4: 0.8+0.8', 1.6/1.64, '0.97561'); chk(2, 'P4: dos impulsos de 0.5', 1.0/1.25, '0.8'); chk(2, 'P4: tres impulsos', 1.3/1.4, '0.92857'); chk(2, 'P4: 13/14', 13/14, '0.92857'); chk(2, 'P4: 3 artanh 0.5', 3*math.atanh(.5), '1.6479'); chk(2, 'P4: tanh(1.6479)', math.tanh(3*math.atanh(.5)), '0.92857')
chk(2, 'Sim suma: exceso de Galileo', 1.6-1.6/1.64, '0.624')
for n_, v_ in ((1, '0.5000'), (2, '0.8000'), (3, '0.9286'), (4, '0.9756'), (5, '0.9918')): chk(2, f'Sim suma: {n_} impulsos de 0.5', math.tanh(n_*math.atanh(.5)), v_)
chk(2, 'Sim suma: 10 impulsos de 0.5', math.tanh(10*math.atanh(.5)), '0.99997'); chk(2, 'Sim suma: 3 impulsos de 0.9', math.tanh(3*math.atanh(.9)), '0.9997')
# Fizeau
n = 1.333; v = 7.059; Lt = 1.4871; lam = 526e-9
chk(2, 'P5: n²', n**2, '1.7769'); chk(2, 'P5: coeficiente', 1-1/n**2, '0.43722'); chk(2, 'Texto: coeficiente (4 cifras)', 1-1/n**2, '0.4372')
chk(2, 'P5: Δu primer orden (m/s)', (1-1/n**2)*v, '3.0863'); uu = (c/n+v)/(1+v/(n*c)); chk(2, 'P5: u − c/n relativista (m/s)', uu-c/n, '3.0863')
chk(2, 'P5: n²−1', n**2-1, '0.7769'); chk(2, 'P5: ΔN', 4*Lt*v*(n**2-1)/(lam*c), '0.2069'); chk(2, 'Texto: ΔN (3 cifras)', 4*Lt*v*(n**2-1)/(lam*c), '0.207')
# P6
p = 3094.0; E = math.hypot(p, mmu); Gs_ = E/mmu; bs = math.sqrt(1-1/Gs_**2)
chk(2, 'P6: E (MeV)', E, '3095.8'); chk(2, 'P6: γ', Gs_, '29.30'); chk(2, 'P6: γτ (µs)', Gs_*tau*1e6, '64.37'); chk(2, 'P6: β', bs, '0.999417'); chk(2, 'P6: 2πR (m)', 2*math.pi*7.112, '44.686')
chk(2, 'P6: vueltas', bs*c*Gs_*tau/(2*math.pi*7.112), '431.6'); chk(2, 'P6: vueltas sin dilatación', bs*c*tau/(2*math.pi*7.112), '14.7')
chk(2, 'Texto: γ=29.3 → vida 64.4 µs', 29.3*tau*1e6, '64.4')
