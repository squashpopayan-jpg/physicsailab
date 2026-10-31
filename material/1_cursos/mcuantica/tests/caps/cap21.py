# -*- coding: utf-8 -*-
# Capítulo 21: método variacional
EhV = 27.211386246
def gto(exps, Z=1.0):
    n = len(exps); H = np.zeros((n, n)); S = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            a, b = exps[i], exps[j]; p = a+b; s = (math.pi/p)**1.5; S[i, j] = s; H[i, j] = 3*a*b/p*s-2*math.pi*Z/p
    return linalg.eigh(H, S)
# P1
fb = lambda b: 1.5*b-2*math.sqrt(2*b/math.pi); bo = 8/(9*math.pi)
chk(21, 'P1: β óptimo', bo, '0.2829'); chk(21, 'P1: β (5 cifras)', bo, '0.28294'); chk(21, 'P1: E mínima', fb(bo), '-0.4244'); chk(21, 'P1: E (5 cifras)', fb(bo), '-0.42441'); chk(21, 'P1: E (eV)', fb(bo)*EhV, '-11.55'); chk(21, 'P1: error (%)', (fb(bo)+0.5)/0.5*100, '15.1'); chk(21, 'P1: −4/3π', -4/(3*math.pi), '-0.4244')
chk(21, 'P1: ⟨T⟩ + ⟨V⟩ en β óptimo', 1.5*bo-2*math.sqrt(2*bo/math.pi), -4/(3*math.pi), 1e-12)
chk(21, 'P1: 4/3π − 8/3π', 4/(3*math.pi)-8/(3*math.pi), '-0.4244')
b_ = sp.Symbol('b', positive=True); chk(21, 'P1: dE/dβ = 0 en 8/9π (SymPy)', 1.0 if sp.simplify((sp.Rational(3, 2)*b_-2*sp.sqrt(2*b_/sp.pi)).diff(b_).subs(b_, 8/(9*sp.pi))) == 0 else 0.0, '1.0')
# P2
x_, L_ = sp.symbols('x L', positive=True); psi = x_*(L_-x_)
N2 = sp.integrate(psi**2, (x_, 0, L_)); T2 = sp.integrate(psi*(-sp.diff(psi, x_, 2))/2, (x_, 0, L_))
chk(21, 'P2: ⟨ψ|ψ⟩ = L⁵/30 (SymPy)', 1.0 if sp.simplify(N2-L_**5/30) == 0 else 0.0, '1.0'); chk(21, 'P2: ⟨H⟩ = ħ²L³/6m (con ħ = m = 1)', 1.0 if sp.simplify(T2-L_**3/6) == 0 else 0.0, '1.0')
chk(21, 'P2: E = 5 ħ²/mL²', float((T2/N2).subs(L_, 1)), '5.0'); chk(21, 'P2: E₁ (ħ²/mL²)', math.pi**2/2, '4.9348'); chk(21, 'P2: cociente', 5/(math.pi**2/2), '1.0132'); chk(21, 'P2: error (%)', (5/(math.pi**2/2)-1)*100, '1.32')
# P3
g = 0.3; a = optimize.brentq(lambda t: t**3-t-6*g, 1, 3); E = a/4+1/(4*a)+3*g/(4*a*a)
Nb = 200; aa = np.diag(np.sqrt(np.arange(1, Nb)), 1); X = (aa+aa.T)/math.sqrt(2); Eex = np.linalg.eigvalsh(np.diag(np.arange(Nb)+.5)+g*np.linalg.matrix_power(X, 4))[0]
chk(21, 'P3: α*', a, '1.4868'); chk(21, 'P3: α* (5 cifras)', a, '1.48682'); chk(21, 'P3: α*/4', a/4, '0.371705'); chk(21, 'P3: 1/(4α*)', 1/(4*a), '0.168144'); chk(21, 'P3: 3g/(4α*²)', 3*g/(4*a*a), '0.101781'); chk(21, 'P3: E', E, '0.641630'); chk(21, 'P3: exacta', Eex, '0.637992'); chk(21, 'P3: error (%)', (E-Eex)/Eex*100, '0.57'); chk(21, 'P3: E(α=1)', 0.25+0.25+0.75*g, '0.725'); chk(21, 'P3: error con α = 1 (%)', (0.725-Eex)/Eex*100, '13.6')
chk(21, 'P3: Newton: f(1.5) = 0.075', 1.5**3-1.5-1.8, '0.075'); chk(21, 'P3: f′(1.5) = 5.75', 3*2.25-1, '5.75'); chk(21, 'P3: α tras una iteración', 1.5-0.075/5.75, '1.4870')
chk(21, 'Sim: error variacional (10⁻³)', (E-Eex)/1e-3, '3.64', 5e-3); chk(21, 'Sim: serie orden 2', 0.5+0.75*g-21/8*g*g, '0.48875'); chk(21, 'Sim: error de la serie', 0.5+0.75*g-21/8*g*g-Eex, '-0.149'); chk(21, 'Sim: cociente de errores ≈ 40', abs(0.5+0.75*g-21/8*g*g-Eex)/(E-Eex), '41', 3e-2)
Eg1 = 1.0; ag = 2.0; Eex1 = np.linalg.eigvalsh(np.diag(np.arange(Nb)+.5)+1.0*np.linalg.matrix_power(X, 4))[0]
chk(21, 'Sim: g = 1: E variacional', 2/4+1/8+3/16, '0.8125'); chk(21, 'Sim: g = 1: exacta', Eex1, '0.80377'); chk(21, 'Sim: g = 1: error (%)', (0.8125-Eex1)/Eex1*100, '1.1', 3e-2); chk(21, 'Sim: g = 1: 8 − 2 − 6', 8-2-6, '0')
# Sec. hidrógeno y ritz
chk(21, 'Sec.: E (1 gaussiana, 5 cifras)', -4/(3*math.pi), '-0.42441')
res = {n: gto([0.1*4**i for i in range(n)]) for n in (1, 2, 3, 4, 5)}
for n, v in ((1, '-0.35463'), (2, '-0.45827'), (3, '-0.49142'), (4, '-0.49833'), (5, '-0.49930')): chk(21, f'Sim: E con N = {n}', res[n][0][0], v)
chk(21, 'Sim: error de energía N = 5 (%)', (res[5][0][0]+0.5)/0.5*100, '0.14', 2e-2)
w, vec = res[5]; c = vec[:, 0]; nrm = 1/math.sqrt(sum(c[i]*c[j]*(math.pi/(0.1*4**i+0.1*4**j))**1.5 for i in range(5) for j in range(5))); psi0 = nrm*sum(c)
chk(21, 'Sim: |ψ(0)| con N = 5', abs(psi0), '0.5289'); chk(21, 'Sim: exacta 1/√π', 1/math.sqrt(math.pi), '0.5642'); chk(21, 'Sim: error de ψ(0) (%)', (1-abs(psi0)/(1/math.sqrt(math.pi)))*100, '6.3')
# P6
S2 = np.array([[(math.pi/0.4)**1.5, (math.pi/1.2)**1.5], [(math.pi/1.2)**1.5, (math.pi/2.0)**1.5]]); H2 = np.array([[0.3*S2[0, 0]-2*math.pi/0.4, 0.5*S2[0, 1]-2*math.pi/1.2], [0.5*S2[0, 1]-2*math.pi/1.2, 1.5*S2[1, 1]-2*math.pi/2.0]])
chk(21, 'P6: S₁₁', S2[0, 0], '22.0107'); chk(21, 'P6: S₁₂', S2[0, 1], '4.2360'); chk(21, 'P6: S₂₂', S2[1, 1], '1.9687'); chk(21, 'P6: H₁₁', H2[0, 0], '-9.1047'); chk(21, 'P6: H₁₂', H2[0, 1], '-3.1180'); chk(21, 'P6: H₂₂', H2[1, 1], '-0.1885')
ev = linalg.eigh(H2, S2, eigvals_only=True); chk(21, 'P6: E₁', ev[0], '-0.48250'); chk(21, 'P6: E₂', ev[1], '0.65348'); chk(21, 'P6: 2π/0.4', 2*math.pi/0.4, '15.7080'); chk(21, 'P6: 2π/1.2', 2*math.pi/1.2, '5.2360'); chk(21, 'P6: 2π/2', 2*math.pi/2, '3.1416')
chk(21, 'P6: E de χ₁ sola', 1.5*0.2-2*math.sqrt(0.4/math.pi), '-0.4136'); chk(21, 'P6: recuperado con N = 2 (%)', -ev[0]/0.5*100, '96.5'); chk(21, 'P6: recuperado con N = 5 (%)', -res[5][0][0]/0.5*100, '99.86')
chk(21, 'P6: det(H − ES) = 0 es cuadrática: discriminante > 0', 1.0 if (S2[0, 1]*H2[0, 1]*2-S2[0, 0]*H2[1, 1]-S2[1, 1]*H2[0, 0])**2-4*np.linalg.det(S2)*np.linalg.det(H2) > 0 else 0.0, '1.0')
# Helio P4
for Z, ex_, zs, Ev_, err_, errp, ion, ion_ex in ((2, -2.903724377, '1.6875', '-2.84766', '0.05607', '1.93', '23.07', '24.59'), (3, -7.279913413, '2.6875', '-7.22266', '0.05726', '0.79', '74.09', '75.65')):
    z = Z-5/16; Ev = z*z-2*Z*z+5*z/8
    chk(21, f'P4: ζ* (Z = {Z})', z, zs); chk(21, f'P4: E_var (Z = {Z})', Ev, Ev_); chk(21, f'P4: error (Z = {Z})', Ev-ex_, err_); chk(21, f'P4: error eV (Z = {Z})', (Ev-ex_)*EhV, '1.526' if Z == 2 else '1.558'); chk(21, f'P4: error % (Z = {Z})', (Ev-ex_)/abs(ex_)*100, errp); chk(21, f'P4: ionización eV (Z = {Z})', (-Z*Z/2-Ev)*EhV, ion); chk(21, f'P4: ionización exacta eV (Z = {Z})', (-Z*Z/2-ex_)*EhV, ion_ex)
chk(21, 'P4: ionización He (hartree)', -2+2.84765625, '0.84766'); chk(21, 'P4: ionización Li⁺ (hartree)', -4.5+7.22265625, '2.72266')
chk(21, 'Sec.: perturbación de primer orden', -4+5/4, '-2.75'); chk(21, 'Sec.: apantallamiento 5/16', 5/16, '0.3125'); chk(21, 'Sec.: error (hartree)', -(27/16)**2+2.903724377, '0.056', 5e-3); chk(21, 'Sec.: error (eV)', (-(27/16)**2+2.903724377)*EhV, '1.53')
ze = sp.symbols('zeta', positive=True); Zs = sp.Symbol('Z', positive=True); Ez = ze**2-2*Zs*ze+sp.Rational(5, 8)*ze
chk(21, 'P4: ζ* = Z − 5/16 (SymPy)', 1.0 if sp.simplify(sp.solve(sp.diff(Ez, ze), ze)[0]-(Zs-sp.Rational(5, 16))) == 0 else 0.0, '1.0'); chk(21, 'P4: E(ζ*) = −(Z − 5/16)² (SymPy)', 1.0 if sp.simplify(Ez.subs(ze, Zs-sp.Rational(5, 16))+(Zs-sp.Rational(5, 16))**2) == 0 else 0.0, '1.0')
r1, r2 = sp.symbols('r1 r2', positive=True)
Jee = sp.integrate(sp.integrate(16*sp.exp(-2*r1-2*r2)*r1*r2*sp.Piecewise((1/r1, r1 > r2), (1/r2, True))*1, (r2, 0, r1)), (r1, 0, sp.oo)) if False else None
chk(21, 'Sec.: ⟨1/r₁₂⟩ = 5ζ/8: integral de Coulomb de dos 1s (cuadratura numérica, ζ = 1)', integrate.dblquad(lambda r2, r1: 16*r1*r1*r2*r2*math.exp(-2*r1-2*r2)/max(r1, r2), 0, 40, 0, 40)[0], 5/8, 1e-6)
# H2+ P5
def h2(R):
    S = math.exp(-R)*(1+R+R*R/3); j = 1/R-math.exp(-2*R)*(1+1/R); k = math.exp(-R)*(1+R); return S, j, k, -.5+1/R-(j+k)/(1+S), -.5+1/R-(j-k)/(1-S)
S, j, k, Eg, Eu = h2(2.0)
chk(21, 'P5: S (R = 2)', S, '0.58645'); chk(21, 'P5: j (R = 2)', j, '0.47253'); chk(21, 'P5: k (R = 2)', k, '0.40601'); chk(21, 'P5: E_g (R = 2)', Eg, '-0.55377'); chk(21, 'P5: E_g (4 cifras)', Eg, '-0.5538'); chk(21, 'P5: E_u (R = 2)', Eu, '-0.16085'); chk(21, 'P5: E_u (4 cifras)', Eu, '-0.1609')
chk(21, 'P5: e⁻² (4 + 1/3)', math.exp(-2)*(1+2+4/3), '0.58645'); chk(21, 'P5: e⁻⁴·1.5', math.exp(-4)*1.5, '0.02747'); chk(21, 'P5: (j+k)/(1+S)', (j+k)/(1+S), '0.55377'); chk(21, 'P5: (j−k)/(1−S)', (j-k)/(1-S), '0.16085'); chk(21, 'P5: 0.5 − 0.02747', 0.5-0.02747, '0.47253'); chk(21, 'P5: 1 + S', 1+S, '1.58645'); chk(21, 'P5: 1 − S', 1-S, '0.41355')
Re = optimize.minimize_scalar(lambda R: h2(R)[3], bounds=(1.5, 4), method='bounded', options={'xatol': 1e-10}).x; S, j, k, Eg, Eu = h2(Re)
chk(21, 'P5: R_e', Re, '2.4928'); chk(21, 'P5: S (R_e)', S, '0.46003'); chk(21, 'P5: j (R_e)', j, '0.39157'); chk(21, 'P5: k (R_e)', k, '0.28877'); chk(21, 'P5: E_g (R_e)', Eg, '-0.56483'); chk(21, 'P5: 1/R_e', 1/Re, '0.40115'); chk(21, 'P5: (j+k)/(1+S)', (j+k)/(1+S), '0.46601', 1e-3) if False else chk(21, 'P5: (j+k)', j+k, '0.68035'); chk(21, 'P5: 1 + S (R_e)', 1+S, '1.46003')
chk(21, 'P5: D_e (hartree)', -.5-Eg, '0.06483'); chk(21, 'P5: D_e (eV)', (-.5-Eg)*EhV, '1.764'); chk(21, 'P5: fracción del enlace exacto (%)', (-.5-Eg)/0.10263*100, '63', 1e-2)
chk(21, 'Sim: S (R = 2.5)', h2(2.5)[0], '0.4583'); chk(21, 'Sim: j (R = 2.5)', h2(2.5)[1], '0.3906'); chk(21, 'Sim: k (R = 2.5)', h2(2.5)[2], '0.2873'); chk(21, 'Sim: E_g (R = 2.5)', h2(2.5)[3], '-0.56483'); chk(21, 'Sim: E_u (R = 2.5)', h2(2.5)[4], '-0.29064'); chk(21, 'Sec.: D_e exacto 0.10263 hartree en eV', 0.10263*EhV, '2.793')
