# -*- coding: utf-8 -*-
# Capítulo 5: Dirac, matrices, Rabi, mecánica matricial (ħ = m = L = 1 en la caja)
from scipy.linalg import expm
E1 = math.pi**2/2
xm = lambda m, n: 0.5 if m == n else (0.0 if (m+n) % 2 == 0 else -8*m*n/(math.pi**2*(m*m-n*n)**2))
x = sp.symbols('x', positive=True)
for (m, n) in ((1, 2), (2, 3), (1, 4), (1, 6), (2, 5)):
    v = float(sp.integrate(2*x*sp.sin(m*sp.pi*x)*sp.sin(n*sp.pi*x), (x, 0, 1)))
    chk(5, f'x_{m}{n} frente a la fórmula (SymPy)', xm(m, n), v, 1e-10)
for (m, n) in ((1, 3), (2, 4)):
    chk(5, f'x_{m}{n} = 0 por paridad (SymPy)', 0.0, float(sp.integrate(2*x*sp.sin(m*sp.pi*x)*sp.sin(n*sp.pi*x), (x, 0, 1))), 1e-12, rel=False)
chk(5, 'Ej. x₁₁', xm(1, 1), '0.5'); chk(5, 'Ej. x₂₁', xm(2, 1), '-0.18013'); chk(5, 'Ej. x₄₁', xm(4, 1), '-0.014410'); chk(5, 'Ej. x₆₁', xm(6, 1), '-0.00397')
chk(5, 'P3: x₂₃', xm(2, 3), '-0.19454'); chk(5, 'P3: x₁₄', xm(1, 4), '-0.014410')
cs = np.cumsum([xm(1, m)**2 for m in range(1, 4000)])
chk(5, 'Ej. clausura m ≤ 1', cs[0], '0.25'); chk(5, 'Ej. clausura m ≤ 2', cs[1], '0.282446'); chk(5, 'Ej. clausura m ≤ 4', cs[3], '0.282653'); chk(5, 'Ej. clausura m ≤ 6', cs[5], '0.282669')
chk(5, 'Ej. clausura completa', cs[-1], '0.282673'); chk(5, 'Ej. 1/3 − 1/(2π²)', 1/3-1/(2*math.pi**2), '0.282673')
chk(5, 'P3: (16/9π²)²', (16/(9*math.pi**2))**2, '0.032446'); chk(5, 'P3: (32/225π²)²', (32/(225*math.pi**2))**2, '0.000208'); chk(5, 'P3: |x₆₁|²', xm(6, 1)**2, '0.000016')
chk(5, 'P3: suma completa', cs[-1], '0.2826727')
# P1
chk(5, 'P1: 1/√7', 1/math.sqrt(7), '0.3780'); chk(5, 'P1: P₁', 2/7, '0.2857'); chk(5, 'P1: P₂', 4/7, '0.5714'); chk(5, 'P1: P₃', 1/7, '0.1429'); chk(5, 'P1: ⟨A⟩ = 19/7', 19/7, '2.714')
cv = np.array([1+1j, 2, -1j]); chk(5, 'P1: ‖ψ‖² = 7', np.vdot(cv, cv).real, '7.0')
# P2
Pp = 0.5*np.array([[1, 1], [1, 1]]); chk(5, 'P2: P² = P', np.linalg.norm(Pp@Pp-Pp), 0.0, 1e-14, rel=False)
w = np.linalg.eigvalsh(Pp); chk(5, 'P2: valores propios 0 y 1 (suma)', w[0]+w[1], '1.0'); chk(5, 'P2: det = 0', np.linalg.det(Pp), 0.0, 1e-14, rel=False)
# P4 Rabi
Om = 2*math.pi*1e6
chk(5, 'P4: t_π (µs)', math.pi/Om*1e6, '0.5'); chk(5, 'P4: Ω_R (10⁶ s⁻¹)', math.sqrt(2)*Om/1e6, '8.886'); chk(5, 'P4: T (µs)', 2*math.pi/(math.sqrt(2)*Om)*1e6, '0.707')
chk(5, 'P4: Ω_R/(2π) (MHz)', math.sqrt(2), '1.4142')
for (O_, D_) in ((1.0, 0.0), (1.0, 1.0), (2.0, 0.0), (1.3, -0.7)):
    sx = np.array([[0, 1], [1, 0]]); sz = np.array([[1, 0], [0, -1]]); H = 0.5*(O_*sx+D_*sz)
    for t in (0.9, 3.1416, 7.7):
        U = expm(-1j*H*t); Pe = abs(U[0, 1])**2   # parte de |g⟩ = (0,1)ᵀ; |e⟩ es el índice 0
        Wr = math.hypot(O_, D_); pr = O_**2/Wr**2*math.sin(Wr*t/2)**2
        chk(5, f'Rabi: P_e(t={t}) con Ω={O_}, Δ={D_} frente a expm', pr, Pe, 1e-9)
chk(5, 'Sim: Ω_R con Δ = Ω = 1', math.sqrt(2), '1.414'); chk(5, 'Sim: periodo con Δ = Ω = 1', 2*math.pi/math.sqrt(2), '4.443'); chk(5, 'Sim: periodo resonante', 2*math.pi, '6.283'); chk(5, 'Sim: π/Ω (Ω=2)', math.pi/2, '1.5708'); chk(5, 'Sim: π/Ω', math.pi, '3.1416')
# P6
H2 = np.array([[E1, 10*xm(1, 2)], [10*xm(1, 2), 4*E1]]); w2 = np.linalg.eigvalsh(H2)
chk(5, 'P6: E₁⁽⁰⁾', E1, '4.9348'); chk(5, 'P6: E₂⁽⁰⁾', 4*E1, '19.7392'); chk(5, 'P6: V₁₂', 10*xm(1, 2), '-1.80127'); chk(5, 'P6: media', (H2[0, 0]+H2[1, 1])/2, '12.3370'); chk(5, 'P6: semidiferencia', (H2[1, 1]-H2[0, 0])/2, '7.4022')
chk(5, 'P6: δ²', ((H2[1, 1]-H2[0, 0])/2)**2, '54.7926'); chk(5, 'P6: V₁₂²', H2[0, 1]**2, '3.2446'); chk(5, 'P6: raíz', math.sqrt(((H2[1, 1]-H2[0, 0])/2)**2+H2[0, 1]**2), '7.6182'); chk(5, 'P6: E₋ (2×2)', w2[0], '4.7188')
chk(5, 'P6: 2.º orden', E1-H2[0, 1]**2/(3*E1), '4.7156')
def ham(N, F):
    H = np.zeros((N, N))
    for m in range(1, N+1):
        H[m-1, m-1] = E1*m*m
        for n in range(1, N+1):
            if m != n: H[m-1, n-1] = F*xm(m, n)
    return H
N_ = 4000; h_ = 1/(N_+1); xg = h_*np.arange(1, N_+1); t_ = 1/(2*h_*h_)
ex = linalg.eigh_tridiagonal(2*t_+10*(xg-0.5), -t_*np.ones(N_-1), select='i', select_range=(0, 0), eigvals_only=True)[0]
chk(5, 'P6: exacto (FD 4000 puntos)', ex, '4.71709'); chk(5, 'P6: N=3', np.linalg.eigvalsh(ham(3, 10))[0], '4.71743'); chk(5, 'P6: N=4', np.linalg.eigvalsh(ham(4, 10))[0], '4.71711')
chk(5, 'P6: error 2×2', w2[0]-ex, '0.0017'); chk(5, 'P6: error 2.º orden', (E1-H2[0, 1]**2/(3*E1))-ex, '-0.0015')
for N, v in ((1, '4.935'), (2, '3.172'), (3, '3.090')):
    chk(5, f'Sim lineal F=30, N={N}', np.linalg.eigvalsh(ham(N, 30))[0], v)
chk(5, 'Sim lineal F=30, N=6 (4 decimales)', np.linalg.eigvalsh(ham(6, 30))[0], '3.0828')
chk(5, 'Sim: H₁₂ = F x₁₂ con F = 30', 30*xm(1, 2), '-5.404'); chk(5, 'Sim: 2g con g = 50 (ψ₁(½)² = 2)', 2*50, '100')
# P5: oscilador de Heisenberg
om, t = sp.symbols('omega t', positive=True)
chk(5, 'P5: x_H = x cos ωt + (p/mω) sin ωt resuelve x¨ = −ω² x', 1.0 if sp.simplify(sp.diff(sp.cos(om*t), t, 2)+om**2*sp.cos(om*t)) == 0 and sp.simplify(sp.diff(sp.sin(om*t), t, 2)+om**2*sp.sin(om*t)) == 0 else 0.0, '1.0')
