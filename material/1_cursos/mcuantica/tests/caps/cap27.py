# -*- coding: utf-8 -*-
# Capítulo 27: partículas idénticas
import itertools as it
EhV = 27.211386246
# P1
for N, M, c in ((2, 3, (9, 6, 3)), (3, 5, (125, 35, 10))):
    chk(27, f'P1: distinguibles N = {N}, M = {M}', M**N, str(c[0])); chk(27, f'P1: bosones N = {N}, M = {M}', math.comb(M+N-1, N), str(c[1])); chk(27, f'P1: fermiones N = {N}, M = {M}', math.comb(M, N), str(c[2]))
chk(27, 'P1: C(4,2)', math.comb(4, 2), '6'); chk(27, 'P1: C(7,3)', math.comb(7, 3), '35'); chk(27, 'P1: C(5,3)', math.comb(5, 3), '10'); chk(27, 'P1: coincidencia distinguibles', 3/9, '0.3333'); chk(27, 'P1: coincidencia bosones', 3/6, '0.5'); chk(27, 'P1: 2/(M + 1) con M = 3', 2/4, '0.5'); chk(27, 'Sim: 2/(M+1) con M = 5', 2/6, '0.3333')
# P2
x2 = lambda n: 1/3-1/(2*n*n*math.pi**2); x12 = -16/(9*math.pi**2)
chk(27, 'P2: ⟨x²⟩₁', x2(1), '0.28267'); chk(27, 'P2: ⟨x²⟩₂', x2(2), '0.32067'); chk(27, 'P2: ⟨1|x|2⟩', x12, '-0.18013'); chk(27, 'P2: ⟨1|x|2⟩²', x12**2, '0.032446'); d = x2(1)+x2(2)-0.5
chk(27, 'P2: distinguibles', d, '0.10334'); chk(27, 'P2: simétrica', d-2*x12**2, '0.03845'); chk(27, 'P2: antisimétrica', d+2*x12**2, '0.16823')
xs = sp.Symbol('x', positive=True); chk(27, 'P2: ⟨1|x|2⟩ = −16/(9π²) (SymPy)', 1.0 if sp.simplify(2*sp.integrate(xs*sp.sin(sp.pi*xs)*sp.sin(2*sp.pi*xs), (xs, 0, 1))+16/(9*sp.pi**2)) == 0 else 0.0, '1.0')
chk(27, 'Sim: misma mitad, bosones (1,2)', 0.8603, '0.8603', 1e-12)
def mitad(sg):
    ps = lambda x1, x2: (math.sqrt(2)*math.sin(math.pi*x1)*math.sqrt(2)*math.sin(2*math.pi*x2)+sg*math.sqrt(2)*math.sin(2*math.pi*x1)*math.sqrt(2)*math.sin(math.pi*x2))/math.sqrt(2)
    a = integrate.dblquad(lambda x2, x1: ps(x1, x2)**2, 0, 0.5, 0, 0.5)[0]+integrate.dblquad(lambda x2, x1: ps(x1, x2)**2, 0.5, 1, 0.5, 1)[0]; return a
chk(27, 'Sim: misma mitad, bosones', mitad(1), '0.860'); chk(27, 'Sim: misma mitad, fermiones', mitad(-1), '0.140')
# P3
chk(27, 'P3: ∫φ₁⁴ = 4/L² · 3L/8', 4*3/8, '1.5'); chk(27, 'P3: ∫φ₁²φ₂² (distinguibles)', integrate.quad(lambda x: 4*math.sin(math.pi*x)**2*math.sin(2*math.pi*x)**2, 0, 1)[0], '1.0'); chk(27, 'P3: simétrica', 2*integrate.quad(lambda x: 4*math.sin(math.pi*x)**2*math.sin(2*math.pi*x)**2, 0, 1)[0], '2.0')
chk(27, 'P3: ∫sin⁴ = 3/8', integrate.quad(lambda x: math.sin(math.pi*x)**4, 0, 1)[0], '0.375')
# P4: helio
Z = 2; J = 17*Z/81; K = 16*Z/729
chk(27, 'P4: J', J, '0.41975'); chk(27, 'P4: J (4 cifras)', J, '0.4198'); chk(27, 'P4: K', K, '0.043896'); chk(27, 'P4: K (4 cifras)', K, '0.04390'); chk(27, 'P4: 2K (hartree)', 2*K, '0.087791'); chk(27, 'P4: 2K (eV)', 2*K*EhV, '2.389'); chk(27, 'P4: cociente con el experimento', 2*K*EhV/0.796, '3.0', 5e-3); chk(27, 'P4: 34/81', 34/81, '0.41975'); chk(27, 'P4: 32/729', 32/729, '0.043896'); chk(27, 'Sec.: desdoblamiento medido (eV)', 20.616-19.820, '0.796')
def Rn1(r): return 2*2**1.5*math.exp(-2*r)
def Rn2(r): return 2**1.5/math.sqrt(2)*(1-r)*math.exp(-r)
chk(27, 'P4: normalización de 1s (Z = 2)', integrate.quad(lambda r: Rn1(r)**2*r*r, 0, 40)[0], '1.0'); chk(27, 'P4: normalización de 2s (Z = 2)', integrate.quad(lambda r: Rn2(r)**2*r*r, 0, 40)[0], '1.0'); chk(27, 'P4: ortogonalidad 1s–2s', integrate.quad(lambda r: Rn1(r)*Rn2(r)*r*r, 0, 40)[0], '0.0', 1e-9, rel=False)
# Sim helio Z2 = 1 y 0.6
import importlib
def JK(Z1, Z2):
    inner = lambda f, r1: integrate.quad(lambda r2: f(r2)/max(r1, r2), 0, r1)[0]+integrate.quad(lambda r2: f(r2)/max(r1, r2), r1, 60)[0]
    R1 = lambda r: 2*Z1**1.5*math.exp(-Z1*r); R2 = lambda r: Z2**1.5/math.sqrt(2)*(1-Z2*r/2)*math.exp(-Z2*r/2)
    f2 = lambda r: R2(r)**2*r*r; g = lambda r: R1(r)*R2(r)*r*r
    return integrate.quad(lambda r1: R1(r1)**2*r1*r1*inner(f2, r1), 0, 60, limit=100)[0], integrate.quad(lambda r1: g(r1)*inner(g, r1), 0, 60, limit=100)[0]
J1, K1 = JK(2, 1); chk(27, 'Sim: J (Z₂ = 1)', J1, '0.22848'); chk(27, 'Sim: K (Z₂ = 1)', K1, '0.05407'); chk(27, 'Sim: E₀ (Z₂ = 1)', -2-1/8, '-2.125'); chk(27, 'Sim: triplete', -2.125+J1-K1, '-1.95059'); chk(27, 'Sim: singlete', -2.125+J1+K1, '-1.84245'); chk(27, 'Sim: 2K (Z₂ = 1) (eV)', 2*K1*EhV, '2.942', 1e-3)
J2, K2 = JK(2, 0.6); chk(27, 'Sim: 2K (Z₂ = 0.6) (eV)', 2*K2*EhV, '1.681', 2e-3)
# P5
chk(27, 'P5: N = 3 fermiones', 2*0.5+1.5, '2.5'); chk(27, 'P5: N = 4', 2*0.5+2*1.5, '4.0'); chk(27, 'P5: tres bosones', 3*0.5, '1.5'); chk(27, 'P5: diferencia', 2.5-1.5, '1.0'); chk(27, 'P5: E_F (N = 4)', 4/2-0.5, '1.5')
# P6: Slater 3 orbitales en una caja (Gauss–Legendre)
xg, wg = np.polynomial.legendre.leggauss(40); xg = (xg+1)/2; wg = wg/2
def norm3(ns):
    tot = 0.0
    for i, x1 in enumerate(xg):
        for j, x2 in enumerate(xg):
            for k, x3 in enumerate(xg):
                M_ = np.array([[math.sqrt(2)*math.sin(n*math.pi*x) for x in (x1, x2, x3)] for n in ns]); tot += wg[i]*wg[j]*wg[k]*np.linalg.det(M_)**2/6
    return tot
chk(27, 'P6: normalización del determinante (n = 1, 2, 3)', norm3((1, 2, 3)), '1.0', 1e-6); chk(27, 'P6: n = (1, 2, 2) → 0', norm3((1, 2, 2)), '0.0', 1e-9, rel=False); chk(27, 'P6: nº de permutaciones', math.factorial(3), '6'); chk(27, 'P6: 1/√6', 1/math.sqrt(6), '0.40825')
# Sim: distribuciones
chk(27, 'Sim: FD (x = 1)', 1/(math.e+1), '0.2689'); chk(27, 'Sim: MB (x = 1)', math.exp(-1), '0.3679'); chk(27, 'Sim: BE (x = 1)', 1/(math.e-1), '0.5820')
