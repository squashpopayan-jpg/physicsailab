# -*- coding: utf-8 -*-
# Capítulo 33: sistemas abiertos y ecuación de Lindblad (referencia: exponencial del superoperador, scipy)
from scipy.linalg import expm as _expm
_X = np.array([[0, 1], [1, 0]], complex); _Z = np.diag([1, -1]).astype(complex); _sm = np.array([[0, 1], [0, 0]], complex)
def _liou(H, Ls):
    I = np.eye(2); Lm = -1j*(np.kron(H, I)-np.kron(I, H.T))
    for g, A in Ls:
        AdA = A.conj().T@A; Lm = Lm+g*(np.kron(A, A.conj())-0.5*np.kron(AdA, I)-0.5*np.kron(I, AdA.T))
    return Lm
def _ev(r0, H, Ls, t): return (_expm(_liou(H, Ls)*t)@r0.reshape(-1)).reshape(2, 2)
def _bl(r): return [2*r[0, 1].real, -2*r[0, 1].imag, (r[0, 0]-r[1, 1]).real]
def _S(r):
    w = np.linalg.eigvalsh(r); w = w[w > 1e-15]; return float(-(w*np.log2(w)).sum())
# ---- Simulación 33.1: relajación
T1, Tp, w, th = 5, 20, 2, math.radians(70)
r0 = np.array([[(1+math.cos(th))/2, math.sin(th)/2], [math.sin(th)/2, (1-math.cos(th))/2]], complex)
T2 = 1/(0.5/T1+1/Tp); chk(33, 'Sim: T₂', T2, '6.6667'); chk(33, 'Sim: T₂/T₁', T2/T1, '1.3333'); chk(33, 'Sim: 1/T₂ (0.1 + 0.05)', 0.5/T1+1/Tp, '0.15')
Ls = [(1/T1, _sm), (1/(2*Tp), _Z)]; H = 0.5*w*_Z
rf = _ev(r0, H, Ls, 25); b = _bl(rf)
chk(33, 'Sim: x(5T₁)', b[0], '0.0213', 5e-3); chk(33, 'Sim: y(5T₁)', b[1], '-0.0058', 1e-2); chk(33, 'Sim: z(5T₁)', b[2], '0.9956'); chk(33, 'Sim: Tr ρ² (5T₁)', np.trace(rf@rf).real, '0.99582'); chk(33, 'Sim: S (5T₁)', _S(rf), '0.02165', 5e-3)
Smax = max(_S(_ev(r0, H, Ls, t)) for t in np.linspace(0, 25, 1001)); chk(33, 'Sim: entropía máxima', Smax, '0.3417')
chk(33, 'Sim: T₂ con T_φ = 40', 1/(0.5/T1+1/40), '8.0')
# ---- Simulación 33.2: átomo con láser
ree = lambda D, O: (O*O/4)/(D*D+0.25+O*O/2)
chk(33, 'Sim: ρ_ee (Ω = 2, Δ = 0)', ree(0, 2), '0.44444'); chk(33, 'Sim: s₀ (Ω = 2)', 2*4, '8.0'); chk(33, 'Sim: FWHM (Ω = 2)', math.sqrt(1+8), '3.0000'); chk(33, 'Sim: Ω′ (Ω = 2)', math.sqrt(4-1/16), '1.9843')
rr = _ev(np.diag([1, 0]).astype(complex), 0.5*2*_X, [(1, _sm)], 8.0); chk(33, 'Sim: ρ_ee(γt = 8)', rr[1, 1].real, '0.44560'); chk(33, 'Sim: desviación relativa (%)', (rr[1, 1].real/ree(0, 2)-1)*100, '0.26', 5e-2)
chk(33, 'Sim: ρ_ee (Ω = 1, Δ = 0)', ree(0, 1), '0.33333'); chk(33, 'Sim: FWHM (Ω = 1)', math.sqrt(3), '1.7321'); chk(33, 'Sim: ρ_ee (Ω = 1, Δ = 1)', ree(1, 1), '0.14286'); chk(33, 'Sim: ρ_ee (Ω = 2, Δ = 1.5)', ree(1.5, 2), '0.22222'); chk(33, 'Sim: media altura', ree(1.5, 2)/ree(0, 2), '0.5')
# ---- Simulación 33.3: canales
sy = lambda p: math.sqrt(1-p)
chk(33, 'Sim: semieje amplitud (p = 0.4)', sy(0.4), '0.7746')
chk(33, 'Sim: volumen amplitud', (1-0.4)*(1-0.4), '0.36'); chk(33, 'Sim: pureza amplitud', 0.5*(1+0.6+0.16), '0.88'); chk(33, 'Sim: pureza fase', 0.5*(1+0.2**2), '0.52'); chk(33, 'Sim: pureza despolarizante', 0.5*(1+0.6**2), '0.68')
chk(33, 'Sim: volumen fase', 0.2*0.2*1.0, '0.04'); chk(33, 'Sim: volumen despolarizante', 0.6**3, '0.216')
def _out_S(rx, rz): r = np.sqrt(rx*rx+rz*rz); w = np.array([(1+r)/2, (1-r)/2]); return float(-(w*np.log2(w)).sum())
chk(33, 'Sim: S amplitud', _out_S(math.sqrt(0.6), 0.4), '0.34355'); chk(33, 'Sim: S fase', _out_S(0.2, 0.0), '0.97095'); chk(33, 'Sim: S despolarizante', _out_S(0.6, 0.0), '0.72193'); chk(33, 'Sim: autovalor de Choi despolarizante', 0.4/2, '0.2')
# ---- P1
chk(33, 'P1: 1/T₂', 1/10+1/20, '0.15'); chk(33, 'P1: T₂', 1/0.15, '6.667'); chk(33, 'P1: T₂/T₁', (1/0.15)/5, '1.333'); chk(33, 'P1: e^{−2}', math.exp(-2), '0.1353'); chk(33, 'P1: e^{−1.5}', math.exp(-1.5), '0.2231'); chk(33, 'P1: e^{−1}', math.exp(-1), '0.3679'); chk(33, 'P1: cociente de coherencias', math.exp(-1.5)/math.exp(-1), '0.61', 1e-2)
# ---- P2
p = 0.4; K = [np.diag([1, math.sqrt(1-p)]), np.array([[0, math.sqrt(p)], [0, 0]])]; plus = np.array([[.5, .5], [.5, .5]]); o = sum(k@plus@k.conj().T for k in K)
chk(33, 'P2: ρ₀₀', o[0, 0], '0.7'); chk(33, 'P2: ρ₀₁', o[0, 1], '0.3873'); chk(33, 'P2: ρ₁₁', o[1, 1], '0.3'); chk(33, 'P2: z', o[0, 0]-o[1, 1], '0.4'); chk(33, 'P2: x', 2*o[0, 1], '0.7746'); chk(33, 'P2: pureza', np.trace(o@o).real, '0.88')
ev2 = np.linalg.eigvalsh(o); chk(33, 'P2: autovalor mayor', ev2[1], '0.9359'); chk(33, 'P2: autovalor menor', ev2[0], '0.0641'); chk(33, 'P2: S', _S(o), '0.3435'); chk(33, 'P2: γt', -math.log(0.6), '0.5108'); chk(33, 'P2: discriminante', math.sqrt(1-4*0.06), '0.8718')
chk(33, 'P2: −0.9359 log₂ 0.9359', -0.9359*math.log2(0.9359), '0.0894'); chk(33, 'P2: −0.0641 log₂ 0.0641', -0.0641*math.log2(0.0641), '0.2541')
# ---- P3
g = 2*math.pi*6.065e6; chk(33, 'P3: γ (10⁷ s⁻¹)', g/1e7, '3.811'); chk(33, 'P3: ρ_ee', 8/18, '0.4444'); chk(33, 'P3: R (10⁷ s⁻¹)', g*8/18/1e7, '1.694'); chk(33, 'P3: FWHM (MHz)', 3*6.065, '18.2', 5e-3); chk(33, 'P3: media altura (MHz)', 1.5*6.065, '9.10', 5e-3); chk(33, 'P3: Δ₁/₂/γ', math.sqrt(0.25+2), '1.5')
# ---- P4
chk(33, 'P4: p(T_φ)', 0.5*(1-math.exp(-1)), '0.3161'); chk(33, 'P4: p(0.1 T_φ)', 0.5*(1-math.exp(-0.1)), '0.0476'); chk(33, 'P4: e^{−0.1}', math.exp(-0.1), '0.9048')
Ld = _ev(np.array([[0.35, 0.2-0.15j], [0.2+0.15j, 0.65]]), np.zeros((2, 2), complex), [(0.5, _Z)], 1.0); chk(33, 'P4: coherencia tras γ_φt = 1 (Lindblad numérico)', abs(Ld[0, 1])/abs(0.2-0.15j), str(round(math.exp(-1), 4)))
# ---- P5
for lam, ex in ((0.6, [0.2, 0.2, 0.2, 1.4]), (-1/3, [0.0, 2/3, 2/3, 2/3]), (-1.0, [-1.0, 1.0, 1.0, 1.0])):
    J = np.zeros((4, 4), complex)
    for i in range(2):
        for j in range(2):
            E = np.zeros((2, 2), complex); E[i, j] = 1; J[2*i:2*i+2, 2*j:2*j+2] = lam*E+(1-lam)*np.trace(E)*np.eye(2)/2
    evj = np.linalg.eigvalsh(J)
    for k, (a, bb) in enumerate(zip(evj, ex)): chk(33, f'P5: autovalor {k+1} de Choi (λ = {lam:.3f})', a, f'{bb:.4f}', 1e-9, rel=False)
chk(33, 'P5: (1 + 3λ)/2 en λ = 0.6', (1+3*0.6)/2, '1.4'); chk(33, 'P5: (1 − λ)/2 en λ = 0.6', (1-0.6)/2, '0.2'); chk(33, 'P5: (1 + 3λ)/2 en λ = −1', (1-3)/2, '-1.0'); chk(33, 'P5: fidelidad óptima', (1+1/3)/2, str(round(2/3, 4)))
# ---- P6
Om = 2.0; Op = math.sqrt(Om**2-1/16); rs = Om**2/(1+2*Om**2)
chk(33, 'P6: Ω′', Op, '1.9843'); chk(33, 'P6: ρ_ee estacionario', rs, '0.4444'); chk(33, 'P6: 3γ/(4Ω′)', 0.75/Op, '0.378', 1e-2); chk(33, 'P6: γt del primer máximo', math.pi/Op, '1.5832', 1e-3)
chk(33, 'P6: e^{−3π/(4Ω′)}', math.exp(-0.75*math.pi/Op), '0.3050', 1e-3); chk(33, 'P6: ρ_ee máximo', rs*(1+math.exp(-0.75*math.pi/Op)), '0.5800'); chk(33, 'P6: exceso (%)', math.exp(-0.75*math.pi/Op)*100, '30.5', 2e-3)
fnum = lambda t: _ev(np.diag([1, 0]).astype(complex), 0.5*Om*_X, [(1, _sm)], t)[1, 1].real
chk(33, 'P6: ρ_ee(γt = 1) (exponencial del superoperador)', fnum(1.0), '0.4561'); chk(33, 'P6: ρ_ee(γt = 8) (exponencial del superoperador)', fnum(8.0), '0.4456'); chk(33, 'P6: ρ_ee en el primer máximo (numérico)', fnum(math.pi/Op), '0.5800')
tm = optimize.minimize_scalar(lambda t: -fnum(t), bounds=(1.0, 2.2), method='bounded', options=dict(xatol=1e-9)).x; chk(33, 'P6: instante del máximo (optimización numérica)', tm, '1.5832', 1e-3)
chk(33, 'P6: e^{−6}', math.exp(-6)*100, '0.25', 1e-2); chk(33, 'P6: Ω crítico', 0.25, '0.25')
# polinomio característico (resonancia): raíces de λ² + 3γ/2 λ + γ²/2 + Ω²
rts = np.roots([1, 1.5, 0.5+Om**2]); chk(33, 'P6: parte real de las raíces', rts[0].real, '-0.75'); chk(33, 'P6: parte imaginaria de las raíces', abs(rts[0].imag), '1.9843')
