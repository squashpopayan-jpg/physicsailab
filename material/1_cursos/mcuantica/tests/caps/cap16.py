# -*- coding: utf-8 -*-
# Capítulo 16: suma de momentos angulares
from sympy.physics.wigner import clebsch_gordan as sp_cg16
from sympy import Rational as R16
cgn = lambda j1, j2, J, m1, m2, M: float(sp_cg16(R16(int(2*j1), 2), R16(int(2*j2), 2), R16(int(2*J), 2), R16(int(2*m1), 2), R16(int(2*m2), 2), R16(int(2*M), 2)))
chk(16, 'Ej.: ⟨S₁·S₂⟩ triplete (ħ²)', 0.5*(2-1.5), '0.25'); chk(16, 'Ej.: ⟨S₁·S₂⟩ singlete (ħ²)', 0.5*(0-1.5), '-0.75')
chk(16, 'Ej.: CG |1,0⟩ componente ↑↓', cgn(0.5, 0.5, 1, 0.5, -0.5, 0), '0.7071'); chk(16, 'Ej.: CG |0,0⟩ componente ↓↑ (signo)', cgn(0.5, 0.5, 0, -0.5, 0.5, 0), '-0.7071')
# Sim cg-tabla
chk(16, 'Sim: 1/√3', cgn(1, 0.5, 1.5, 1, -0.5, 0.5), '0.5774'); chk(16, 'Sim: √(2/3)', cgn(1, 0.5, 1.5, 0, 0.5, 0.5), '0.8165'); chk(16, 'Sim: −1/√3', cgn(1, 0.5, 0.5, 0, 0.5, 0.5), '-0.5774'); chk(16, 'Sim: √(2/3) de J = 1/2', cgn(1, 0.5, 0.5, 1, -0.5, 0.5), '0.8165')
chk(16, 'Sim: J = 0 de 1⊗1, componente (1,−1)', cgn(1, 1, 0, 1, -1, 0), '0.5774'); chk(16, 'Sim: J = 0 de 1⊗1, componente (0,0)', cgn(1, 1, 0, 0, 0, 0), '-0.5774')
chk(16, 'Sim: 6 = 4 + 2', 4+2, '6'); chk(16, 'Sim: 9 = 5 + 3 + 1', 5+3+1, '9')
# Sim acople-ls y Sec.
LSf = lambda L, S, J: 0.5*(J*(J+1)-L*(L+1)-S*(S+1)); ang = lambda L, S, J: math.degrees(math.acos((J*(J+1)-L*(L+1)-S*(S+1))/(2*math.sqrt(L*(L+1)*S*(S+1)))))
chk(16, 'Sim: L·S de ²P₁/₂', LSf(1, 0.5, 0.5), '-1.0'); chk(16, 'Sim: L·S de ²P₃/₂', LSf(1, 0.5, 1.5), '0.5'); chk(16, 'Sim: ángulo ²P₁/₂', ang(1, 0.5, 0.5), '144.7'); chk(16, 'Sim: ángulo ²P₃/₂', ang(1, 0.5, 1.5), '65.9')
chk(16, 'Sim: intervalos ³D (J=2 − J=1)', LSf(2, 1, 2)-LSf(2, 1, 1), '2.0'); chk(16, 'Sim: intervalos ³D (J=3 − J=2)', LSf(2, 1, 3)-LSf(2, 1, 2), '3.0')
chk(16, 'Sec.: E(²P₃/₂) = A/2', LSf(1, 0.5, 1.5), '0.5'); chk(16, 'Sec.: E(²P₁/₂) = −A', LSf(1, 0.5, 0.5), '-1.0'); chk(16, 'Sec.: separación 3A/2', LSf(1, 0.5, 1.5)-LSf(1, 0.5, 0.5), '1.5')
chk(16, 'Sec.: Σ(2J+1) = (2L+1)(2S+1) con L = 1, S = 1/2', 2+4, '6')
lande = lambda L, S, J: 1+(J*(J+1)+S*(S+1)-L*(L+1))/(2*J*(J+1))
chk(16, 'Sec.: g(²P₃/₂)', lande(1, 0.5, 1.5), '1.3333'); chk(16, 'Sec.: g(²P₁/₂)', lande(1, 0.5, 0.5), '0.6667'); chk(16, 'Sec.: g(²S₁/₂)', lande(0, 0.5, 0.5), '2.0')
# P1
chk(16, 'P1: P(triplete) de |↑↓⟩', cgn(0.5, 0.5, 1, 0.5, -0.5, 0)**2, '0.5'); chk(16, 'P1: P(singlete) de |↑↓⟩', cgn(0.5, 0.5, 0, 0.5, -0.5, 0)**2, '0.5'); chk(16, 'P1: ⟨S²⟩ (ħ²)', 0.5*2, '1.0')
# P2: l = 1 ⊗ s = 1/2
c1 = cgn(1, 0.5, 1.5, 0, 0.5, 0.5); c2 = cgn(1, 0.5, 1.5, 1, -0.5, 0.5)
chk(16, 'P2: J = 3/2: coeficiente de |0,↑⟩', c1**2, '0.6667'); chk(16, 'P2: J = 3/2: coeficiente de |1,↓⟩', c2**2, '0.3333')
chk(16, 'P2: ⟨L_z⟩ en J = 3/2', c2**2, '0.3333'); chk(16, 'P2: ⟨S_z⟩ en J = 3/2', c1**2*0.5-c2**2*0.5, '0.1667')
d1 = cgn(1, 0.5, 0.5, 1, -0.5, 0.5); d2 = cgn(1, 0.5, 0.5, 0, 0.5, 0.5)
chk(16, 'P2: ⟨L_z⟩ en J = 1/2', d1**2, '0.6667'); chk(16, 'P2: ⟨S_z⟩ en J = 1/2', -0.5*d1**2+0.5*d2**2, '-0.1667')
chk(16, 'P2: teorema de la proyección ⟨L_z⟩ (J = 3/2)', 0.5*(15/4+2-3/4)/(2*15/4), '0.3333')
# P3: Na D
h_ = 6.62607015e-34; c_ = 299792458.0; e_ = 1.602176634e-19
dE = h_*c_*(1/588.995e-9-1/589.592e-9)/e_
chk(16, 'P3: Δν̃ (cm⁻¹)', (1/588.995e-9-1/589.592e-9)/100, '17.19'); chk(16, 'P3: ΔE (meV)', dE*1e3, '2.131'); chk(16, 'P3: A (meV)', 2/3*dE*1e3, '1.421'); chk(16, 'P3: A (cm⁻¹)', 2/3*(1/588.995e-9-1/589.592e-9)/100, '11.46')
chk(16, 'P3: E(²P₃/₂) (meV)', dE*1e3/3, '0.710'); chk(16, 'P3: E(²P₁/₂) (meV)', -2/3*dE*1e3, '-1.421'); chk(16, 'P3: baricentro', 4*0.5+2*(-1.0), '0.0', 1e-12, rel=False)
chk(16, 'P3: ¼·15 − ¼·11', 15/4-11/4, '1.0'); chk(16, 'P3: ¾ − 11/4', 3/4-11/4, '-2.0')
# P4: D1 en 1 T
muB = 9.2740100783e-24; gu, gl = lande(1, 0.5, 0.5), lande(0, 0.5, 0.5)
shifts = sorted(round(gu*mu-gl*ml, 6) for mu in (0.5, -0.5) for ml in (0.5, -0.5))
chk(16, 'P4: desplazamientos D₁ (μ_B B)', 1.0 if shifts == sorted([-4/3, -2/3, 2/3, 4/3]) or max(abs(np.array(shifts)-np.array(sorted([-4/3, -2/3, 2/3, 4/3])))) < 1e-5 else 0.0, '1.0')
nu = muB/h_
chk(16, 'P4: μ_B/h (GHz/T)', nu/1e9, '13.996'); chk(16, 'P4: 2/3 μ_B B/h (GHz)', 2/3*nu/1e9, '9.331'); chk(16, 'P4: 4/3 μ_B B/h (GHz)', 4/3*nu/1e9, '18.662')
chk(16, 'P4: Δλ (2/3) en nm', (589.592e-9)**2*(2/3*nu)/c_*1e9, '0.01082'); chk(16, 'P4: Δλ (4/3) en nm', (589.592e-9)**2*(4/3*nu)/c_*1e9, '0.02164'); chk(16, 'P4: μ_B B (µeV)', muB/e_*1e6, '57.88'); chk(16, 'P4: μ_B B/A', muB/e_*1e3/(2/3*dE*1e3), '0.041', 0.02)
chk(16, 'P4: g(P₁/₂) con el numerador', (3/4+3/4-2)/(2*3/4)+1, '0.6667'); chk(16, 'P4: g(S₁/₂) con el numerador', (3/4+3/4-0)/(2*3/4)+1, '2.0')
# P5: np²
from itertools import combinations
from collections import Counter
orb = [(ml, ms) for ml in (1, 0, -1) for ms in (0.5, -0.5)]
tab = Counter((sum(o[0] for o in c), sum(o[1] for o in c)) for c in combinations(orb, 2))
chk(16, 'P5: nº de estados np²', sum(tab.values()), '15'); chk(16, 'P5: C(6,2)', math.comb(6, 2), '15'); chk(16, 'P5: M_S = 0: multiplicidades', 1.0 if [tab[(m, 0.0)] for m in (2, 1, 0, -1, -2)] == [1, 2, 3, 2, 1] else 0.0, '1.0'); chk(16, 'P5: M_S = ±1', 1.0 if [tab[(m, 1.0)] for m in (1, 0, -1)] == [1, 1, 1] else 0.0, '1.0')
chk(16, 'P5: no equivalentes 1+3+3+9+5+15', 1+3+3+9+5+15, '36'); chk(16, 'P5: 6 × 6', 6*6, '36'); chk(16, 'P5: ³P + ¹D + ¹S', 9+5+1, '15'); chk(16, 'P5: 9 + 6', 9+6, '15')
# Zeeman: pendientes de Paschen–Back
chk(16, 'Sim: pendientes m_l + 2m_s', 1.0 if sorted(ml+2*ms for ml in (1, 0, -1) for ms in (0.5, -0.5)) == [-2, -1, 0, 0, 1, 2] else 0.0, '1.0')
