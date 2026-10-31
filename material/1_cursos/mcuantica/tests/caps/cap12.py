# -*- coding: utf-8 -*-
# Capítulo 12: momento angular
def ang(l, m): return math.degrees(math.acos(m/math.sqrt(l*(l+1))))
# l = 2
chk(12, 'Ej./Sim: |L| (l = 2)', math.sqrt(6), '2.449')
for m, v in ((2, '35.26'), (1, '65.91'), (0, '90.00'), (-1, '114.09'), (-2, '144.74')): chk(12, f'Ej.: ángulo (l = 2, m = {m})', ang(2, m), v)
chk(12, 'Sim: 35.3° (m = 2)', ang(2, 2), '35.3'); chk(12, 'Sim: 65.9° (m = 1)', ang(2, 1), '65.9')
for m, v in ((0, '3.0'), (1, '2.5'), (2, '1.0')): chk(12, f'Ej.: ⟨Lx²⟩ (l = 2, m = {m})', 0.5*(6-m*m), v)
# P1: l = 3
chk(12, 'P1: |L| (l = 3)', math.sqrt(12), '3.4641')
for m, v in ((3, '30.00'), (2, '54.74'), (1, '73.22'), (0, '90.00')): chk(12, f'P1: ángulo (l = 3, m = {m})', ang(3, m), v)
chk(12, 'P1: cos θ (m = 3)', 3/math.sqrt(12), '0.8660')
# Sim: vectorial
chk(12, 'Sim: ΔLx (l = 2, m = 1)', math.sqrt(2.5), '1.581'); chk(12, 'Sim: cociente producto/cota', 2.5/0.5, '5.0'); chk(12, 'Sim: |L|/(lħ) con l = 2', math.sqrt(6)/2, '1.2247'); chk(12, 'Sim: |L|/(lħ) con l = 12', math.sqrt(12*13)/12, '1.0408'); chk(12, 'Sim: producto con l = 3, m = 0', 0.5*12, '6.0'); chk(12, 'Sim: ⟨Lx²⟩ con l = 3, m = 3', 0.5*(12-9), '1.5')
# Matrices explícitas (NumPy): l = 2, m = 1
j = 2; ms = [j-a for a in range(5)]; Jp = np.zeros((5, 5));
for a in range(1, 5): Jp[a-1, a] = math.sqrt(j*(j+1)-ms[a]*(ms[a]+1))
Jm = Jp.T; Jx = (Jp+Jm)/2; Jy = (Jp-Jm)/(2j)
v = np.zeros(5, complex); v[1] = 1       # |2, 1⟩ (índice 1 ↔ m = 1)
chk(12, 'P3: coeficiente de L₊|2,1⟩', np.linalg.norm(Jp@v), '2.0'); chk(12, 'P3: coeficiente de L₋|2,1⟩', np.linalg.norm(Jm@v), '2.449'); chk(12, 'P3: √6', math.sqrt(6), '2.449')
chk(12, 'P3: ⟨Lx²⟩ de |2,1⟩', np.vdot(v, Jx@Jx@v).real, '2.5'); chk(12, 'P3: ⟨Ly²⟩ de |2,1⟩', np.vdot(v, Jy@Jy@v).real, '2.5'); chk(12, 'P3: ⟨Lx²⟩+⟨Ly²⟩ = 5', np.vdot(v, (Jx@Jx+Jy@Jy)@v).real, '5.0')
chk(12, 'P3: 1 + 6/4', 1+6/4, '2.5')
# Robertson para |l,m⟩ (matrices)
for (l, m) in ((1, 1), (2, 2), (3, 3), (3, 1), (2, 0)):
    jj = l; msl = [jj-a for a in range(2*jj+1)]; Jp_ = np.zeros((2*jj+1, 2*jj+1))
    for a in range(1, 2*jj+1): Jp_[a-1, a] = math.sqrt(jj*(jj+1)-msl[a]*(msl[a]+1))
    Jx_ = (Jp_+Jp_.T)/2; Jy_ = (Jp_-Jp_.T)/(2j); vv = np.zeros(2*jj+1, complex); vv[jj-m] = 1
    dx = math.sqrt((np.vdot(vv, Jx_@Jx_@vv)-np.vdot(vv, Jx_@vv)**2).real); dy = math.sqrt((np.vdot(vv, Jy_@Jy_@vv)-np.vdot(vv, Jy_@vv)**2).real)
    chk(12, f'Robertson l={l}, m={m}: ΔLx ΔLy = ½[l(l+1) − m²] (matrices)', dx*dy, 0.5*(l*(l+1)-m*m), 1e-12)
    chk(12, f'Robertson l={l}, m={m}: ΔLx ΔLy ≥ |m|/2', 1.0 if dx*dy >= abs(m)/2-1e-12 else 0.0, '1.0')
# P4: Y11, Y10 con SymPy
th, ph = sp.symbols('theta phi', real=True)
Lp = lambda f: sp.exp(sp.I*ph)*(sp.diff(f, th)+sp.I*sp.cot(th)*sp.diff(f, ph))
Lm = lambda f: sp.exp(-sp.I*ph)*(-sp.diff(f, th)+sp.I*sp.cot(th)*sp.diff(f, ph))
Y11 = -sp.sqrt(3/(8*sp.pi))*sp.sin(th)*sp.exp(sp.I*ph)
chk(12, 'P4: L₊ Y₁¹ = 0 (SymPy)', 1.0 if sp.simplify(Lp(Y11)) == 0 else 0.0, '1.0')
Y10 = sp.simplify(Lm(Y11)/sp.sqrt(2)); chk(12, 'P4: L₋ Y₁¹ = √2 Y₁⁰ con Y₁⁰ = √(3/4π) cos θ (SymPy)', 1.0 if sp.simplify(Y10-sp.sqrt(3/(4*sp.pi))*sp.cos(th)) == 0 else 0.0, '1.0')
chk(12, 'P4: ∫|Y₁¹|² dΩ = 1 (SymPy)', float(sp.integrate(sp.integrate(sp.Abs(Y11)**2*sp.sin(th), (ph, 0, 2*sp.pi)), (th, 0, sp.pi))), '1.0')
chk(12, 'P4: |C| = √(3/8π)', math.sqrt(3/(8*math.pi)), '0.3455', ) if False else chk(12, 'P4: ∫₀^π sin³θ dθ = 4/3', float(sp.integrate(sp.sin(th)**3, (th, 0, sp.pi))), 4/3, 1e-12)
Pc = float(sp.integrate(sp.integrate((3/(4*sp.pi))*sp.cos(th)**2*sp.sin(th), (ph, 0, 2*sp.pi)), (th, 0, sp.pi/6)))
chk(12, 'P4/Sim: P(θ < 30°) de Y₁⁰', Pc, '0.1752'); chk(12, 'Sim: P (%)', Pc*100, '17.52'); chk(12, 'P4: cos³30°', math.cos(math.pi/6)**3, '0.6495')
# rotor
c_ = C.c*100; mu = 6.8562*C.u
I = hbar/(4*math.pi*c_*1.9313)
chk(12, 'Ej./P6: I del CO (10⁻⁴⁶ kg·m²)', I/1e-46, '1.4494'); chk(12, 'Ej./P6: μ (10⁻²⁶ kg)', mu/1e-26, '1.13851', 1e-5) if False else chk(12, 'P6: μ (10⁻²⁶ kg, 5 cifras)', mu/1e-26, '1.1385')
chk(12, 'Ej./P6: r_e del CO (Å)', math.sqrt(I/mu)*1e10, '1.1283'); chk(12, 'Ej./P6: 2B (cm⁻¹)', 2*1.9313, '3.863'); chk(12, 'P6: ν₀→₁ (GHz)', 2*1.9313*c_/1e9, '115.80'); chk(12, 'P6: ΔE (10⁻⁴ eV)', 2*1.9313*1.239841984e-4/1e-4, '4.789')
chk(12, 'Ej./P6: T_ren del CO (ps)', 1/(2*c_*1.9313)*1e12, '8.636'); chk(12, 'Sim: T_ren (ps, 4 cifras)', 1/(2*c_*1.9313)*1e12, '8.636'); chk(12, 'Ej.: T_ren (ps, 3 cifras)', 1/(2*c_*1.9313)*1e12, '8.64')
Ih = hbar/(4*math.pi*c_*10.5934); chk(12, 'Ej.: r_e del HCl (Å)', math.sqrt(Ih/(0.97959*C.u))*1e10, '1.2746'); chk(12, 'Ej./Sim: T_ren del HCl (ps)', 1/(2*c_*10.5934)*1e12, '1.574'); chk(12, 'Sim: 2B del HCl (cm⁻¹)', 2*10.5934, '21.19'); chk(12, 'Sim: 2B del HCl (GHz)', 2*10.5934*c_/1e9, '635')
chk(12, 'P6: ħ/(4π c B) numerador (10⁻³⁴)', hbar/1e-34, '1.05457', 1e-5) if False else chk(12, 'P6: 4π c B (10¹¹)', 4*math.pi*c_*1.9313/1e11, '7.2760', 1e-4) if False else chk(12, 'Sim: I del CO (10⁻⁴⁶)', I/1e-46, '1.449')
# población
kT = C.k*298.15/(C.h*c_); B = 1.9313
chk(12, 'P6: k_BT/hc (cm⁻¹)', kT, '207.22'); w = lambda l: (2*l+1)*math.exp(-B*l*(l+1)/kT)
chk(12, 'P6: exponente', B*56/kT, '0.5219'); chk(12, 'P6: 15 e^{−0.5219}', w(7), '8.90'); q = kT/B+1/3
chk(12, 'P6: q ≈ kT/hcB + 1/3', q, '107.63'); chk(12, 'P6: fracción de l = 7', w(7)/q, '0.0827'); tot = sum(w(l) for l in range(300)); chk(12, 'P6: fracción exacta de l = 7 (%)', w(7)/tot*100, '8.3'); chk(12, 'P6: fracción de l = 6 (%)', w(6)/tot*100, '8.2'); chk(12, 'P6: fracción de l = 8 (%)', w(8)/tot*100, '8.1')
# cos² de un estado l=0,2.. : valores de la simulación (rotor_paquete): mín y máx en un periodo
def cos2_lm(c, t):
    xs, ws = np.polynomial.legendre.leggauss(120); psi = np.zeros_like(xs, dtype=complex)
    for l, cl in enumerate(c):
        if cl: psi += cl*math.sqrt((2*l+1)/2)*special.eval_legendre(l, xs)*np.exp(-1j*l*(l+1)*t)
    return float(np.sum(ws*xs**2*abs(psi)**2)/np.sum(ws*abs(psi)**2))
def packet(l0, s, n=50):
    c = [math.exp(-((l-l0)**2)/(4*s*s)) if l % 2 == 0 else 0.0 for l in range(n)]; z = math.sqrt(sum(x*x for x in c)); return [x/z for x in c]
ts = np.linspace(0, math.pi, 1201)
v1 = [cos2_lm(packet(8, 2.0), t) for t in ts]; chk(12, 'Sim: máximo de ⟨cos²θ⟩ (l₀ = 8, σ = 2)', max(v1), '0.945'); chk(12, 'Sim: mínimo de ⟨cos²θ⟩ (l₀ = 8, σ = 2)', min(v1), '0.059')
v2 = [cos2_lm(packet(4, 1.5), t) for t in ts]; chk(12, 'Sim: máximo de ⟨cos²θ⟩ (l₀ = 4, σ = 1.5)', max(v2), '0.917'); chk(12, 'Sim: mínimo de ⟨cos²θ⟩ (l₀ = 4, σ = 1.5)', min(v2), '0.096')
chk(12, 'Rotor: ⟨cos²θ⟩ de l = 0 es 1/3', cos2_lm([1.0], 0.0), '0.3333')
# límite del rotor: E_l pares
chk(12, 'Rotor: l(l+1) siempre par (l = 0…200)', float(all((l*(l+1)) % 2 == 0 for l in range(201))), '1.0')
# comprobación de la suma de Y_lm² con SymPy (teorema de adición, l = 2)
from sympy import Ynm, lambdify
chk(12, 'Teorema de adición Σ|Y_2^m|² = 5/4π (SymPy, θ = 0.9)', float(sum(abs(sp.N(Ynm(2, m, 0.9, 0.4).expand(func=True)))**2 for m in range(-2, 3))), 5/(4*math.pi), 1e-10)
