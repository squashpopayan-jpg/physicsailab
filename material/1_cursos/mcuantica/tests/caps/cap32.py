# -*- coding: utf-8 -*-
# Capítulo 32: medida y decoherencia
h2 = lambda p: -p*math.log2(p)-(1-p)*math.log2(1-p)
# P1
V = math.exp(-1.125); r01 = 0.5*V
chk(32, 'P1: V', V, '0.3247'); chk(32, 'P1: ρ₀₁', r01, '0.1623'); chk(32, 'P1: D', math.sqrt(1-V**2), '0.9458'); chk(32, 'P1: V²', V**2, '0.1054'); chk(32, 'P1: 0.5 + ρ₀₁', 0.5+r01, '0.6623'); chk(32, 'P1: 0.5 − ρ₀₁', 0.5-r01, '0.3377'); chk(32, 'P1: −0.6623 log₂', -0.6623*math.log2(0.6623), '0.3937'); chk(32, 'P1: −0.3377 log₂', -0.3377*math.log2(0.3377), '0.5289'); chk(32, 'P1: S', h2(0.5+r01), '0.9226'); chk(32, 'Sim: P(0) con c = 0.71', 0.71**2, '0.5041')
# P2
d = math.sqrt(2*math.log(100)); chk(32, 'P2: d²/2σ² = ln 100', math.log(100), '4.605'); chk(32, 'P2: d/σ', d, '3.035'); chk(32, 'P2: D', math.sqrt(1-1e-4), '0.99995'); chk(32, 'Sim: V (d = 4)', math.exp(-8), '3.4e-4', 5e-2); chk(32, 'Sim: coherencia (d = 4) (10⁻⁴)', 0.5*math.exp(-8)/1e-4, '1.7')
# P3
chk(32, 'P3: T₂', 1/math.sqrt(20), '0.2236'); chk(32, 'P3: cos(T₂)', math.cos(1/math.sqrt(20)), '0.97510'); chk(32, 'P3: cos²⁰(T₂)', math.cos(1/math.sqrt(20))**20, '0.6040'); chk(32, 'P3: e^{−1/2}', math.exp(-0.5), '0.6065'); chk(32, 'P3: diferencia (%)', (math.exp(-0.5)/math.cos(1/math.sqrt(20))**20-1)*100, '0.4', 5e-2); chk(32, 'P3: π/g en unidades de T₂', math.pi*math.sqrt(20), '14', 1e-2)
chk(32, 'Sim: N = 3, T₂', 1/math.sqrt(3), '0.577'); chk(32, 'Sim: gaussiana a 1/2 (N = 3)', math.sqrt(2*math.log(2))/math.sqrt(3), '0.680'); tt = optimize.brentq(lambda t: abs(math.cos(t))**3-0.5, 0.01, 1.2); chk(32, 'Sim: |cos t|³ = ½ en t', tt, '0.654')
# P4
for a, gt, v in ((2, 0.05, '0.6769'), (2, 0.5, '0.04295'), (0.5, 0.5, '0.8214')): chk(32, f'P4: coherencia (α = {a}, γt = {gt})', math.exp(-0.5*(4*a*a)*(1-math.exp(-gt))), v)
chk(32, 'P4: τ_Dγ (α = 2)', 1/(2*4), '0.125'); chk(32, 'P4: τ_Dγ (α = 0.5)', 1/(2*0.25), '2.0'); chk(32, 'P4: exponente 0.3902', 8*(1-math.exp(-0.05)), '0.3902'); chk(32, 'P4: exponente 3.1478', 8*(1-math.exp(-0.5)), '3.1478'); chk(32, 'P4: exponente 0.1967', 0.5*(1-math.exp(-0.5)), '0.1967'); chk(32, 'P4: población e^{−0.5}', math.exp(-0.5), '0.6065')
chk(32, 'Sim: 100 fotones → 200 veces', 2*100, '200')
# P5
chk(32, 'P5: P = (1 + D)/2', 0.5*(1+math.sqrt(1-V**2)), '0.9729')
psi0 = np.array([1, 0]); psi1 = np.array([V, math.sqrt(1-V**2)]); ev = np.linalg.eigvalsh(np.outer(psi0, psi0)-np.outer(psi1, psi1)); chk(32, 'P5: distancia de traza', 0.5*np.abs(ev).sum(), '0.9458')
# P6
kB = 1.380649e-23; lam = hbar/math.sqrt(2*1e-3*kB*300)
chk(32, 'P6: √(2mk_BT) (10⁻¹²)', math.sqrt(2*1e-3*kB*300)/1e-12, '2.878'); chk(32, 'P6: λ_dB (10⁻²³ m)', lam/1e-23, '3.664'); chk(32, 'P6: (λ/Δx)²', (lam/0.01)**2, '1.34e-41', 5e-3)
lam_e = hbar/math.sqrt(2*me*kB*300); chk(32, 'P6: √(2mk_BT) electrón (10⁻²⁶)', math.sqrt(2*me*kB*300)/1e-26, '8.69'); chk(32, 'P6: λ_dB electrón (nm)', lam_e*1e9, '1.21'); chk(32, 'P6: (λ/Δx)² electrón', (lam_e/1e-9)**2, '1.5', 5e-2)
