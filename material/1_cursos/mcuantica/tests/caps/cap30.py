# -*- coding: utf-8 -*-
# Capítulo 30: matriz densidad
H2b = lambda p: -p*math.log2(p)-(1-p)*math.log2(1-p)
sx = np.array([[0, 1], [1, 0]], complex); sy = np.array([[0, -1j], [1j, 0]]); sz = np.diag([1, -1]).astype(complex)
# P1
rm = np.eye(2)/2; plus = np.array([1, 1])/math.sqrt(2); rp = np.outer(plus, plus)
chk(30, 'P1: pureza mezcla', float(np.trace(rm@rm).real), '0.5'); chk(30, 'P1: pureza puro', float(np.trace(rp@rp).real), '1.0'); chk(30, 'P1: ⟨σz⟩ mezcla', float(np.trace(rm@sz).real), '0.0', 1e-12, rel=False); chk(30, 'P1: ⟨σz⟩ puro', float(np.trace(rp@sz).real), '0.0', 1e-12, rel=False); chk(30, 'P1: ⟨σx⟩ mezcla', float(np.trace(rm@sx).real), '0.0', 1e-12, rel=False); chk(30, 'P1: ⟨σx⟩ puro', float(np.trace(rp@sx).real), '1.0')
# P2
r, th, ph = 0.6, math.radians(50), math.radians(30); x, y, z = r*math.sin(th)*math.cos(ph), r*math.sin(th)*math.sin(ph), r*math.cos(th)
rho = 0.5*(np.eye(2)+x*sx+y*sy+z*sz)
chk(30, 'P2: x', x, '0.3980'); chk(30, 'P2: y', y, '0.2298'); chk(30, 'P2: z', z, '0.3857'); chk(30, 'P2/Sim: ρ₀₀', rho[0, 0].real, '0.6928'); chk(30, 'P2/Sim: Re ρ₀₁', rho[0, 1].real, '0.1990'); chk(30, 'P2/Sim: |Im ρ₀₁|', abs(rho[0, 1].imag), '0.1149'); chk(30, 'P2: ρ₁₁', rho[1, 1].real, '0.3072')
w = np.sort(np.linalg.eigvalsh(rho))[::-1]; chk(30, 'P2: λ₁', w[0], '0.8000'); chk(30, 'P2: λ₂', w[1], '0.2000'); chk(30, 'P2/Sim: pureza', float(np.trace(rho@rho).real), '0.68'); chk(30, 'P2/Sim: S (bits)', float(-np.sum(w*np.log2(w))), '0.7219'); chk(30, 'P2: −0.8 log₂ 0.8', -0.8*math.log2(0.8), '0.2575'); chk(30, 'P2: −0.2 log₂ 0.2', -0.2*math.log2(0.2), '0.4644'); chk(30, 'Sim: P(↑x)', 0.5*(1+x), '0.6990')
# P3
a = math.radians(20); c2 = math.cos(a)**2
chk(30, 'P3: cos²α', c2, '0.8830'); chk(30, 'P3: sen²α', 1-c2, '0.1170'); chk(30, 'P3: Tr ρ_A²', c2**2+(1-c2)**2, '0.7934'); chk(30, 'P3: −p log p (1)', -c2*math.log2(c2), '0.1585'); chk(30, 'P3: −p log p (2)', -(1-c2)*math.log2(1-c2), '0.3621', 1e-3); chk(30, 'P3: S', H2b(c2), '0.5206'); chk(30, 'P3: C = sen 40°', math.sin(2*a), '0.6428'); chk(30, 'P3: I = 2S', 2*H2b(c2), '1.0412')
psi = np.array([math.cos(a), 0, 0, math.sin(a)]); rr = np.outer(psi, psi).reshape(2, 2, 2, 2); rA = np.einsum('ijkj->ik', rr)
chk(30, 'P3: ρ_A de numpy (ρ₀₀)', rA[0, 0], '0.8830'); chk(30, 'P3: ρ_A (ρ₀₁ = 0)', abs(rA[0, 1]), '0.0', 1e-12, rel=False)
# P4
p0 = 1/(1+math.exp(-1)); p1 = 1-p0
chk(30, 'P4: Z', 1+math.exp(-1), '1.3679'); chk(30, 'P4: p₀', p0, '0.7311'); chk(30, 'P4: p₁', p1, '0.2689'); chk(30, 'P4: r = tanh ½', math.tanh(0.5), '0.4621'); chk(30, 'P4: pureza', p0**2+p1**2, '0.6068'); chk(30, 'P4: −p₀ log p₀', -p0*math.log2(p0), '0.3304'); chk(30, 'P4: −p₁ log p₁', -p1*math.log2(p1), '0.5095'); chk(30, 'P4: S', H2b(p0), '0.8399'); chk(30, 'P4: p₀²', p0**2, '0.5344')
nb = 1/math.expm1(1); chk(30, 'P4: n̄', nb, '0.5820'); chk(30, 'P4: S del oscilador', (nb+1)*math.log2(nb+1)-nb*math.log2(nb), '1.5013')
pp = np.exp(-np.arange(3)); pp /= pp.sum(); chk(30, 'Sim: tres niveles p₀', pp[0], '0.6652'); chk(30, 'Sim: p₁', pp[1], '0.2447'); chk(30, 'Sim: p₂', pp[2], '0.0900', 2e-3); chk(30, 'Sim: S (tres niveles)', float(-np.sum(pp*np.log2(pp))), '1.2009'); chk(30, 'Sim: log₂ 3', math.log2(3), '1.585')
# P5
sp_ = np.array([1, -1])/math.sqrt(2); rpm = 0.5*np.outer(plus, plus)+0.5*np.outer(sp_, sp_)
chk(30, 'P5: ½|+⟩⟨+| + ½|−⟩⟨−| = ½·1', float(np.max(np.abs(rpm-np.eye(2)/2))), '0.0', 1e-12, rel=False)
th_ = 0.7; Uu = np.array([[math.cos(th_), -math.sin(th_)], [math.sin(th_), math.cos(th_)]]); a1 = Uu[:, 0]; a2 = Uu[:, 1]; chk(30, 'P5: base ortonormal arbitraria', float(np.max(np.abs(0.5*np.outer(a1, a1)+0.5*np.outer(a2, a2)-np.eye(2)/2))), '0.0', 1e-12, rel=False)
Pst = np.array([[0.6, 0.2], [0.2, 0.4]]); ps = [np.array([1, 0]), np.array([0.6, 0.8])]; pr = [0.5, 0.5]
# HJW: mezcla de estados con pesos rotados por U
pv = np.array([0.5, 0.5]); psis = [np.array([1, 0]), np.array([0.6, 0.8])]; Uh = np.array([[math.cos(0.4), -math.sin(0.4)], [math.sin(0.4), math.cos(0.4)]])
A_ = [math.sqrt(pv[i])*psis[i] for i in range(2)]; tild = [sum(Uh[j, i]*A_[i] for i in range(2)) for j in range(2)]
chk(30, 'P5: HJW, Σ|ψ̃⟩⟨ψ̃| = Σ p|ψ⟩⟨ψ|', float(np.max(np.abs(sum(np.outer(t, t) for t in tild)-sum(pv[i]*np.outer(psis[i], psis[i]) for i in range(2))))), '0.0', 1e-12, rel=False)
# P6
ro = np.array([x, y, z]); wt = math.pi/2; Rz = np.array([[math.cos(wt), -math.sin(wt), 0], [math.sin(wt), math.cos(wt), 0], [0, 0, 1]]); r2 = Rz@ro
chk(30, 'P6: x(t)', r2[0], '-0.2298'); chk(30, 'P6: y(t)', r2[1], '0.3980'); chk(30, 'P6: z(t)', r2[2], '0.3857'); chk(30, 'P6: |r|', float(np.linalg.norm(r2)), '0.6')
U6 = linalg.expm(-1j*wt*sz/2); rho6 = U6@rho@U6.conj().T; b6 = [np.trace(rho6@s).real for s in (sx, sy, sz)]
chk(30, 'P6: Bloch de expm (x)', b6[0], '-0.2298'); chk(30, 'P6: Bloch de expm (y)', b6[1], '0.3980'); chk(30, 'P6: población ρ₀₀', rho6[0, 0].real, '0.6928'); chk(30, 'P6: pureza', float(np.trace(rho6@rho6).real), '0.68')
