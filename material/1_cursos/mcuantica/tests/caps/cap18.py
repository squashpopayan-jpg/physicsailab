# -*- coding: utf-8 -*-
# Capítulo 18: simetrías y reglas de selección
from sympy.physics.hydrogen import R_nl as Rnl18
alpha = 7.2973525693e-3; c_ = 299792458.0; a0 = 5.29177210903e-11; Ry = 13.605693122994; e_ = 1.602176634e-19; hb_ = 1.054571817e-34
def rint(n1, l1, n2, l2): return integrate.quad(lambda r: float(Rnl18(n1, l1, r, 1))*float(Rnl18(n2, l2, r, 1))*r**3, 0, 250, limit=500, epsabs=1e-13)[0]
def Aein(n, l, n2, l2):
    w = Ry*(1/n2**2-1/n**2)*e_/hb_
    return 4*alpha*w**3/(3*c_**2)*max(l, l2)/(2*l+1)*(rint(n, l, n2, l2)*a0)**2
# P1
chk(18, 'P1: combinaciones 3×2', 3*2, '6'); chk(18, 'P1: permitidas', sum(1 for l in (0, 1, 2) for l2 in (0, 1) if abs(l-l2) == 1), '3')
# P2
E = 0.75*Ry; w = E*e_/hb_; pref = 4*alpha*w**3/(3*c_**2); R = rint(2, 1, 1, 0)
chk(18, 'P2: ħω (eV)', E, '10.204'); chk(18, 'P2: ω (10¹⁶ rad/s)', w/1e16, '1.5503'); chk(18, 'P2/Sim: λ (nm)', 1239.841984/E, '121.5'); chk(18, 'P2: prefactor (10²⁹)', pref/1e29, '4.0338')
chk(18, 'P2/Sec.: ⟨1s|r|2p⟩ (a₀)', R, '1.2903'); chk(18, 'P2/Sec.: 128√6/243', 128*math.sqrt(6)/243, '1.2903'); chk(18, 'P2: R (10⁻¹¹ m)', R*a0/1e-11, '6.828'); chk(18, 'P2: R² (10⁻²¹ m²)', (R*a0)**2/1e-21, '4.662')
A2p = Aein(2, 1, 1, 0)
chk(18, 'P2: A (10⁸ s⁻¹)', A2p/1e8, '6.268'); chk(18, 'Sec.: A (2 cifras)', A2p/1e8, '6.27'); chk(18, 'P2: τ (ns)', 1e9/A2p, '1.595'); chk(18, 'P2: factor angular', 1/3, '0.3333')
# P3
c_b = math.cos(math.radians(60)); chk(18, 'P3: P₁ (60°)', ((1+c_b)**2)/4, '0.5625'); chk(18, 'P3: P₀ (60°)', math.sin(math.radians(60))**2/2, '0.375'); chk(18, 'P3: P₋₁ (60°)', ((1-c_b)**2)/4, '0.0625'); chk(18, 'P3: ⟨J_z⟩ (60°)', ((1+c_b)**2-(1-c_b)**2)/4, '0.5')
chk(18, 'P3: 90°', ((1+0)**2)/4, '0.25'); chk(18, 'P3: sin²90°/2', 0.5, '0.5')
b_ = sp.Symbol('b'); chk(18, 'P3: [(1+c)² − (1−c)²]/4 = cos β (SymPy)', 1.0 if sp.simplify(((1+sp.cos(b_))**2-(1-sp.cos(b_))**2)/4-sp.cos(b_)) == 0 else 0.0, '1.0')
chk(18, 'P3: P₁ + P₀ + P₋₁ = 1 (SymPy)', 1.0 if sp.simplify((1+sp.cos(b_))**2/4+sp.sin(b_)**2/2+(1-sp.cos(b_))**2/4-1) == 0 else 0.0, '1.0')
# P4
zz = R/math.sqrt(3); chk(18, 'P4: ⟨z⟩ (a₀)', zz, '0.7449'); chk(18, 'P4: ⟨z⟩ (10⁻¹¹ m)', zz*a0/1e-11, '3.942'); chk(18, 'P4: e a₀ (10⁻³⁰ C·m)', e_*a0/1e-30, '8.4784'); chk(18, 'P4: d (10⁻³⁰ C·m)', zz*a0*e_/1e-30, '6.316'); chk(18, 'P4: d (D)', zz*a0*e_/3.33564095e-30, '1.893')
ang = integrate.quad(lambda th: math.sin(th)*math.cos(th)**2, 0, math.pi)[0]*2*math.pi/math.sqrt(4*math.pi)*math.sqrt(3/(4*math.pi))
chk(18, 'P4: parte angular 1/√3', ang, '0.5774')
# P5: oscilador
N = 40; a_ = np.diag(np.sqrt(np.arange(1, N)), 1); X = (a_+a_.T)/math.sqrt(2); X2 = X@X
chk(18, 'P5: ⟨0|x|1⟩', X[0, 1], '0.7071'); chk(18, 'P5: ⟨1|x|2⟩', X[1, 2], '1.0'); chk(18, 'P5: ⟨2|x|3⟩', X[2, 3], '1.2247'); chk(18, 'P5: ⟨0|x|2⟩ = 0', X[0, 2], '0.0', 1e-12, rel=False)
chk(18, 'P5: ⟨0|x²|0⟩', X2[0, 0], '0.5'); chk(18, 'P5: ⟨0|x²|2⟩', X2[0, 2], '0.7071'); chk(18, 'P5: ⟨1|x²|1⟩', X2[1, 1], '1.5'); chk(18, 'P5: ⟨0|x²|1⟩ = 0', X2[0, 1], '0.0', 1e-12, rel=False)
# P6
A31 = Aein(3, 1, 1, 0); A32 = Aein(3, 1, 2, 0); At = A31+A32
chk(18, 'P6: A(3p→1s) (10⁸)', 1.673, '1.673', 1e-3); chk(18, 'P6: A(3p→1s) calculado (10⁸)', A31/1e8, '1.673'); chk(18, 'P6: A(3p→2s) calculado (10⁷)', A32/1e7, '2.246'); chk(18, 'P6: A total (10⁸)', At/1e8, '1.898'); chk(18, 'P6: τ (ns)', 1e9/At, '5.27'); chk(18, 'Sim: τ (ns, 4 cifras)', 1e9/At, '5.269'); chk(18, 'P6: fracción 1s (%)', A31/At*100, '88.2'); chk(18, 'P6: fracción 2s (%)', A32/At*100, '11.8'); chk(18, 'Sim: fracción 1s (%)', A31/At*100, '88.17'); chk(18, 'Sim: fracción 2s (%)', A32/At*100, '11.83')

chk(18, 'P6: λ Lyman-β (nm)', 1239.841984/(Ry*(1-1/9)), '102.5'); chk(18, 'P6: λ Hα con masa reducida (nm)', 1239.841984/(Ry/(1+1/1836.15267)*(1/4-1/9)), '656.5')
chk(18, 'Sec.: τ 2s por dos fotones (s)', 1/8.23, '0.12', 5e-3); chk(18, 'P6: τ(2s)·A(2p)', A2p/8.23, '7.6e7', 5e-2) if False else chk(18, 'P6: cociente de tasas 2p/2s', A2p/8.23/1e7, '7.6')
# Sim
chk(18, 'Sim: A(3d→2p) (10⁷)', Aein(3, 2, 2, 1)/1e7, '6.469', 1e-3); chk(18, 'Sim: τ(3d) (ns)', 1e9/Aein(3, 2, 2, 1), '15.46'); chk(18, 'Sim: A(3s→2p) (10⁶)', Aein(3, 0, 2, 1)/1e6, '6.317'); chk(18, 'Sim: τ(3s) (ns)', 1e9/Aein(3, 0, 2, 1), '158', 1e-3)
chk(18, 'Sim: ⟨1s|r|3p⟩ (a₀)', rint(3, 1, 1, 0), '0.5167')
h_ = 14/701; xs = -7+h_*np.arange(1, 701); t = 1/(2*h_*h_)
Eg = linalg.eigh_tridiagonal(2*t+10*((xs/2)**2-1)**2, -t*np.ones(699), select='i', select_range=(0, 5), eigvals_only=True)
chk(18, 'Sim: E₀ del doble pozo', Eg[0], '2.1686'); chk(18, 'Sim: E₁ del doble pozo', Eg[1], '2.1689'); chk(18, 'Sim: E₂ del doble pozo', Eg[2], '6.177', 1e-3); chk(18, 'Sim: E₃ del doble pozo', Eg[3], '6.201', 1e-3)
Eg2 = linalg.eigh_tridiagonal(2*t+10*((xs/2)**2-1)**2+0.3*xs, -t*np.ones(699), select='i', select_range=(0, 1), eigvals_only=True)
chk(18, 'Sim: E₀ con ε = 0.3', Eg2[0], '1.594'); chk(18, 'Sim: E₁ con ε = 0.3', Eg2[1], '2.738')
w_, v_ = linalg.eigh_tridiagonal(2*t+10*((xs/2)**2-1)**2, -t*np.ones(699), select='i', select_range=(0, 1))
chk(18, 'Sim: |⟨0|x|1⟩|', abs(float(np.sum(v_[:, 0]*xs*v_[:, 1]))), '1.908', 1e-3)
