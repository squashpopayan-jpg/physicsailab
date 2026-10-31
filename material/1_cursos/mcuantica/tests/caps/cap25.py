# -*- coding: utf-8 -*-
# Capítulo 25: dispersión
nrm = lambda d: d-math.pi*round(d/math.pi)
hd = lambda l, x: nrm(math.atan2(special.spherical_jn(l, x), special.spherical_yn(l, x)))
sig = lambda k, L, f=hd: 4*math.pi/k**2*sum((2*l+1)*math.sin(f(l, k))**2 for l in range(L))
# P1
d0, d1 = hd(0, 0.1), hd(1, 0.1)
chk(25, 'P1: δ₀', d0, '-0.1', 1e-12); chk(25, 'P1: δ₁ (10⁻⁴)', d1/1e-4, '-3.313'); chk(25, 'P1: j₁(0.1)', special.spherical_jn(1, 0.1), '0.0333'); chk(25, 'P1: y₁(0.1)', special.spherical_yn(1, 0.1), '-100.5')
chk(25, 'P1: sin²δ₀', math.sin(0.1)**2, '0.0099667'); chk(25, 'P1: σ/a²', sig(0.1, 6), '12.525'); chk(25, 'P1/Sim: σ/πa²', sig(0.1, 6)/math.pi, '3.987'); chk(25, 'P1: aprox. δ_l ≈ −x^{2l+1}/[(2l+1)!!(2l−1)!!] (l = 1)', -0.1**3/3, d1, 1e-2)
chk(25, 'Sim: δ₁ (ka = 0.1) (10⁻⁴)', d1/1e-4, '-3.3', 5e-3)
# P2 / Rutherford
KE = 1.43996454; E = 5.3; Z = 79; d = 2*Z*KE/E
chk(25, 'P2: d (fm)', d, '42.93'); chk(25, 'P2: b a 90° (fm)', d/2, '21.46'); chk(25, 'P2: (d/4)²', (d/4)**2, '115.17'); chk(25, 'P2: dσ/dΩ (fm²/sr)', (d/4)**2/math.sin(math.pi/4)**4, '460.7'); chk(25, 'P2: dσ/dΩ (b/sr)', (d/4)**2/math.sin(math.pi/4)**4/100, '4.607'); chk(25, 'P2: σ(>90°) (fm²)', math.pi*(d/2)**2, '1447', 1e-3)
fr = 5.9e28*1e-6*math.pi*(d/2*1e-15)**2; chk(25, 'P2: fracción (10⁻⁵)', fr/1e-5, '8.54'); chk(25, 'Sim: 1 de cada 11 700 (≈, 11 711)', 1/fr, 11700, 2e-3); chk(25, 'Sim: 1 de cada 11 711', 1/fr, '11711', 2e-3)
chk(25, 'Sec.: d a 30 MeV (Au) (fm)', 2*79*KE/30, '7.6'); chk(25, 'Sec.: d a 30 MeV (C) (fm)', 2*6*KE/30, '0.6')
chk(25, 'Sim: 90° → r_min = (d/2)(1 + csc 45°) (fm)', d/2*(1+math.sqrt(2)), '51.8')
# Sim esfera dura
for ka, v in ((1.0, '3.382'), (8.0, '2.455')): chk(25, f'Sim: σ/πa² (ka = {ka})', sig(ka, int(ka+16))/math.pi, v)
d1l = [hd(l, 1.0) for l in range(4)]
for l, v in enumerate(('-1.000', '-0.2146', '-0.0172')): chk(25, f'Sim/P4: δ_{l} (ka = 1)', d1l[l], v)
chk(25, 'Sim: δ₃ (10⁻⁴) (ka = 1)', d1l[3]/1e-4, '-5.4'); chk(25, 'Sim: σ (ka = 1) (a²)', sig(1.0, 12), '10.63')
# P4
ds = [hd(l, 1.0) for l in range(6)]; tm = [(2*l+1)*math.sin(x)**2 for l, x in enumerate(ds)]
for t_, v in zip(tm[:3], ('0.70807', '0.13605', '0.001480')): chk(25, f'P4: término {v}', t_, v)
chk(25, 'P4: término 4 (10⁻⁶)', tm[3]/1e-6, '2.05'); chk(25, 'P4: suma', sum(tm), '0.84561'); chk(25, 'P4: σ', 4*math.pi*sum(tm), '10.626'); chk(25, 'P4: δ₄ (10⁻⁶)', ds[4]/1e-6, '-9.0', 5e-3)
chk(25, 'P4: Im[e^{iδ} sin δ] = sin²δ (SymPy)', 1.0 if sp.simplify(sp.im(sp.exp(sp.I*sp.Symbol('d', real=True))*sp.sin(sp.Symbol('d', real=True)))-sp.sin(sp.Symbol('d', real=True))**2) == 0 else 0.0, '1.0')
# P3 (Yukawa) con SymPy
r, q, a, V0 = sp.symbols('r q a V0', positive=True)
I1 = sp.integrate(sp.exp(-r/a)*sp.sin(q*r), (r, 0, sp.oo)); chk(25, 'P3: ∫e^{−r/a} sin(qr) dr = q/(q² + a⁻²) (SymPy)', 1.0 if sp.simplify(I1-q/(q**2+1/a**2)) == 0 else 0.0, '1.0')
k = sp.Symbol('k', positive=True); fB = 2*V0*a/(q**2+1/a**2); sB = sp.simplify((2*sp.pi/k**2)*sp.integrate(fB**2*q, (q, 0, 2*k)))
chk(25, 'P3: σ_B = 16πV₀²a⁶/(1 + 4k²a²) (SymPy)', 1.0 if sp.simplify(sB-16*sp.pi*V0**2*a**6/(1+4*k**2*a**2)) == 0 else 0.0, '1.0')
sY = lambda V, kk: 16*math.pi*V**2/(1+4*kk*kk); chk(25, 'P3: σ_B (k = 1)', sY(0.5, 1), '2.513'); chk(25, 'P3: σ_B (k = 4)', sY(0.5, 4), '0.1933'); chk(25, 'Sim: σ_B (V₀ = 3, k = 1)', sY(3, 1), '90.5')
chk(25, 'P3: 16π·0.25/5', 16*math.pi*0.25/5, '2.513'); chk(25, 'P3: 16π·0.25/65', 16*math.pi*0.25/65, '0.1933')
# exactas por ODE
def dele(l, k, V, a):
    from scipy.integrate import solve_ivp
    f = lambda r, y: [y[1], (l*(l+1)/r**2+2*V(r)-k*k)*y[0]]
    sol = solve_ivp(f, [1e-6, a], [1e-6**(l+1), (l+1)*1e-6**l], rtol=1e-11, atol=1e-30, method='DOP853'); u, du = sol.y[0, -1], sol.y[1, -1]; beta = a*du/u-1; x = k*a
    return nrm(math.atan2(x*special.spherical_jn(l, x, derivative=True)-beta*special.spherical_jn(l, x), x*special.spherical_yn(l, x, derivative=True)-beta*special.spherical_yn(l, x)))
def sexact(V, k, a, L): return 4*math.pi/k**2*sum((2*l+1)*math.sin(dele(l, k, V, a))**2 for l in range(L))
yk = lambda V0: (lambda rr: -V0*math.exp(-rr)/rr)
chk(25, 'Sim/P3: σ exacta Yukawa (V₀ = 0.5, k = 1)', sexact(yk(0.5), 1.0, 25, 6), '3.227', 2e-3); chk(25, 'Sim/P3: σ exacta (V₀ = 0.5, k = 4)', sexact(yk(0.5), 4.0, 25, 16), '0.1967', 3e-3); chk(25, 'Sim: σ exacta (V₀ = 3, k = 1)', sexact(yk(3.0), 1.0, 25, 6), '34.73', 5e-3)
chk(25, 'Sim: Born/exacta (V₀ = 0.5, k = 1)', sY(0.5, 1)/sexact(yk(0.5), 1.0, 25, 6), '0.779', 5e-3); chk(25, 'Sim: subestima un 22 %', (1-sY(0.5, 1)/sexact(yk(0.5), 1.0, 25, 6))*100, '22', 5e-2); chk(25, 'Sim: Born/exacta (V₀ = 3)', sY(3, 1)/sexact(yk(3.0), 1.0, 25, 6), '2.6', 1e-2); chk(25, 'Sim: error a k = 4 (%)', (sexact(yk(0.5), 4.0, 25, 16)/sY(0.5, 4)-1)*100, '1.7', 6e-2)
gk = lambda V0: (lambda rr: -V0*math.exp(-rr*rr)); sG = lambda V, kk: math.pi**2*V*V*(1-math.exp(-2*kk*kk))/(2*kk*kk)
chk(25, 'P5/Sim: σ_B gaussiano (V₀ = 0.5, k = 2)', sG(0.5, 2), '0.3083'); chk(25, 'P5: π²·0.25/8', math.pi**2*0.25/8, '0.30843'); chk(25, 'P5: 1 − e⁻⁸', 1-math.exp(-8), '0.99966'); chk(25, 'P5/Sim: σ exacta gaussiano', sexact(gk(0.5), 2.0, 8, 10), '0.3125', 3e-3); chk(25, 'P5: error (%)', (sexact(gk(0.5), 2.0, 8, 10)/sG(0.5, 2)-1)*100, '1.4')
x_, aa, V_ = sp.symbols('x a V', positive=True); chk(25, 'P5: ∫₀^∞ r e^{−r²/a²} sin(qr) dr = (√π a³ q/4) e^{−q²a²/4} (SymPy)', 1.0 if sp.simplify(sp.integrate(r*sp.exp(-r**2/a**2)*sp.sin(q*r), (r, 0, sp.oo))-sp.sqrt(sp.pi)*a**3*q/4*sp.exp(-q**2*a**2/4)) == 0 else 0.0, '1.0')
# P6: Born de Yukawa → Rutherford numérico
Ee = 3.0; kk = math.sqrt(2*Ee); th = 1.1; qq = 2*kk*math.sin(th/2); lam = 1e6
fl = 2/(qq**2+lam**-2); fr_ = 1/(4*Ee*math.sin(th/2)**2); chk(25, 'P6: f_B (λ → ∞) = Z e²/[4E sin²(θ/2)] (en unidades ħ = μ = 1, Ze² = 1)', fl, fr_, 1e-9)
