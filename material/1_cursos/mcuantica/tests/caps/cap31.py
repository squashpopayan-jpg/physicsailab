# -*- coding: utf-8 -*-
# Capítulo 31: entrelazamiento y Bell
# P1
E = lambda a, b: -math.cos(a-b)
Es = [E(0, math.pi/4), E(0, 3*math.pi/4), E(math.pi/2, math.pi/4), E(math.pi/2, 3*math.pi/4)]
chk(31, 'P1: E(a,b)', Es[0], '-0.7071'); chk(31, 'P1: E(a,b′)', Es[1], '0.7071'); chk(31, 'P1: E(a′,b)', Es[2], '-0.7071'); chk(31, 'P1: E(a′,b′)', Es[3], '-0.7071'); S = abs(Es[0]-Es[1]+Es[2]+Es[3])
chk(31, 'P1: S', S, '2.8284'); chk(31, 'P1: 2√2', 2*math.sqrt(2), '2.8284'); chk(31, 'P1: exceso (%)', (S/2-1)*100, '41', 1e-2)
# P2
chk(31, 'P2: máximo local por enumeración', max(abs(A*(B-B2)+A2*(B+B2)) for A in (-1, 1) for A2 in (-1, 1) for B in (-1, 1) for B2 in (-1, 1)), '2'); chk(31, 'P2: ejemplo A=A′=B=1, B′=−1', 1*(1+1)+1*(1-1), '2')
# P3: Werner
sy = np.array([[0, -1j], [1j, 0]]); psi = np.array([0, 1, -1, 0])/math.sqrt(2)
def pt(r): return r.reshape(2, 2, 2, 2).transpose(0, 3, 2, 1).reshape(4, 4)
for p in (0.5, 0.85):
    rw = p*np.outer(psi, psi)+(1-p)*np.eye(4)/4; ev = np.sort(np.linalg.eigvalsh(pt(rw)))
    chk(31, f'P3: autovalor negativo (p = {p})', ev[0], f'{(1-3*p)/4:.4f}'); chk(31, f'P3: autovalores positivos (p = {p})', ev[1], f'{(1+p)/4:.4f}'); chk(31, f'P3: negatividad (p = {p})', -ev[ev < 0].sum(), f'{(3*p-1)/4:.4f}')
chk(31, 'P3: autovalores de la transpuesta del singlete', float(np.sum(np.linalg.eigvalsh(pt(np.outer(psi, psi))))), '1.0', 1e-12)
ev1 = np.sort(np.linalg.eigvalsh(pt(np.outer(psi, psi)))); chk(31, 'P3: transpuesta del singlete: autovalor −½', ev1[0], '-0.5'); chk(31, 'P3: transpuesta del singlete: autovalor +½', ev1[-1], '0.5')
chk(31, 'P3: 1/√2', 1/math.sqrt(2), '0.7071'); chk(31, 'P3/Sim: CHSH (p = 0.85)', 2*math.sqrt(2)*0.85, '2.404'); chk(31, 'Sim: exceso (p = 0.85)', 2*math.sqrt(2)*0.85-2, '0.404'); chk(31, 'Sim: C (p = 0.85)', (3*0.85-1)/2, '0.775'); chk(31, 'Sim: C (p = 0.5)', (3*0.5-1)/2, '0.25'); chk(31, 'Sim: CHSH (p = 0.5)', 2*math.sqrt(2)*0.5, '1.414'); chk(31, 'Sim: CHSH (p = 0.2)', 2*math.sqrt(2)*0.2, '0.566')
def Sw(p):
    l1 = p+(1-p)/4; l2 = (1-p)/4; return -l1*math.log2(l1)-3*l2*math.log2(l2)
chk(31, 'Sim: S (p = 0.5)', Sw(0.5), '1.5488'); chk(31, 'Sim: S (p = 0.2)', Sw(0.2), '1.9219'); chk(31, 'Sim: cos45° − ½', math.cos(math.pi/4)-0.5, '0.207'); chk(31, 'Sim: N (p = 0.5)', (3*0.5-1)/4, '0.125')
# Sim MC
chk(31, 'Sim: error estadístico 2/√N (N = 20000)', 2/math.sqrt(20000), '0.014'); chk(31, 'Sim: teoría 2√2', 2*math.sqrt(2), '2.8284'); chk(31, 'Sim: pendiente del modelo local (2/π) a 45°: E = −(1 − 2θ/π)', -(1-2*(math.pi/4)/math.pi), '-0.5')
# P4
chk(31, 'P4: σ_E (|E| = 0.7071)', math.sqrt((1-0.5)), '0.7071'); chk(31, 'P4: σ_S (N = 20000)', 1.414/math.sqrt(20000), '0.0100'); chk(31, 'P4: N mínimo (5σ, σ_S = 1.414/√N)', (5*1.414/0.828)**2, '73', 1e-2); chk(31, 'P4: N mínimo con 2/√N', (5*2/0.828)**2, '146', 1e-2)
# P5 GHZ / Mermin con numpy
X = np.array([[0, 1], [1, 0]], complex); Y = sy; k3 = lambda a, b, c: np.kron(np.kron(a, b), c)
ghz = np.zeros(8, complex); ghz[0] = ghz[7] = 1/math.sqrt(2); rg = np.outer(ghz, ghz.conj())
ex = lambda r, a, b, c: np.trace(r@k3(a, b, c)).real
chk(31, 'P5: ⟨XXX⟩', ex(rg, X, X, X), '1.0'); chk(31, 'P5: ⟨XYY⟩', ex(rg, X, Y, Y), '-1.0'); chk(31, 'P5: ⟨YXY⟩', ex(rg, Y, X, Y), '-1.0'); chk(31, 'P5: ⟨YYX⟩', ex(rg, Y, Y, X), '-1.0')
Mm = lambda r: ex(r, X, X, X)-ex(r, X, Y, Y)-ex(r, Y, X, Y)-ex(r, Y, Y, X)
chk(31, 'P5: M (GHZ)', Mm(rg), '4.0'); chk(31, 'P5: M (p = 0.3)', Mm(0.7*rg+0.3*np.eye(8)/8), '2.8'); chk(31, 'P5: p crítico', 1-2/4, '0.5')
# P6 W
w3 = np.zeros(8, complex); w3[1] = w3[2] = w3[4] = 1/math.sqrt(3); rW = np.outer(w3, w3.conj()).reshape(4, 2, 4, 2); rAB = np.einsum('ijkj->ik', rW)
pp = np.array([0, 1, 1, 0])/math.sqrt(2); expect = (2/3)*np.outer(pp, pp)+(1/3)*np.diag([1, 0, 0, 0])
chk(31, 'P6: ρ_AB del W = ⅔|ψ⁺⟩⟨ψ⁺| + ⅓|00⟩⟨00|', float(np.max(np.abs(rAB-expect))), '0.0', 1e-12, rel=False)
evw = np.sort(np.linalg.eigvalsh(pt(rAB))); chk(31, 'P6: negatividad W', -evw[evw < 0].sum(), '0.2060'); chk(31, 'P6: autovalor negativo (1 − √17... )', evw[0], '-0.2060')
chk(31, 'P6: entropía de un qubit del W', -(2/3)*math.log2(2/3)-(1/3)*math.log2(1/3), '0.9183')
rGHZ = np.outer(ghz, ghz.conj()).reshape(4, 2, 4, 2); rg2 = np.einsum('ijkj->ik', rGHZ); chk(31, 'P6: ρ_AB del GHZ = ½(|00⟩⟨00| + |11⟩⟨11|)', float(np.max(np.abs(rg2-np.diag([0.5, 0, 0, 0.5])))), '0.0', 1e-12, rel=False)
