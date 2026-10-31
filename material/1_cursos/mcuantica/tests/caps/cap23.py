# -*- coding: utf-8 -*-
# Capítulo 23: perturbaciones dependientes del tiempo
from scipy.integrate import solve_ivp
hb = hbar; kB_ = 1.380649e-23; h_ = 6.62607015e-34; c_ = 299792458.0; a0 = 5.29177210903e-11
# P1
chk(23, 'P1: (ΩT/2)²', (0.1*12/2)**2, '0.36'); chk(23, 'P1/Sim: P exacta = sin²(0.6)', math.sin(0.6)**2, '0.3188'); chk(23, 'P1: P exacta (5 cifras)', math.sin(0.6)**2, '0.31882'); chk(23, 'P1: error relativo (%)', (0.36-math.sin(0.6)**2)/math.sin(0.6)**2*100, '12.9'); chk(23, 'P1: x²/3 con x = 0.6 (%)', 0.6**2/3*100, '12', 1e-12)
def pulse(kind, T, V, D, exact=True):
    g = {'sq': lambda t: 1.0, 'ga': lambda t: math.exp(-((t-T/2)**2)/(2*(T/4)**2))}[kind]
    if exact:
        sol = solve_ivp(lambda t, y: [-1j*(V/2*g(t)*np.exp(1j*D*t)*y[1]), -1j*(V/2*g(t)*np.exp(-1j*D*t)*y[0])], [0, T], [1+0j, 0j], rtol=1e-11, atol=1e-13, method='DOP853'); return float(abs(sol.y[1, -1])**2)
    re = integrate.quad(lambda t: g(t)*math.cos(D*t), 0, T)[0]; im = integrate.quad(lambda t: g(t)*math.sin(D*t), 0, T)[0]; return (V/2)**2*(re*re+im*im)
chk(23, 'Sim: P primer orden (Δ = 0.2)', pulse('sq', 12, 0.1, 0.2, False), '0.2172'); chk(23, 'Sim: P exacta (Δ = 0.2)', pulse('sq', 12, 0.1, 0.2), '0.1897')
chk(23, 'Sim: gaussiano, primer orden', pulse('ga', 12, 0.1, 0.2, False), '0.0971'); chk(23, 'Sim: gaussiano, exacta', pulse('ga', 12, 0.1, 0.2), '0.0928')
chk(23, 'Sim: con Ω = 0.03: diferencia < 2 %', 1.0 if abs(pulse('sq', 12, 0.03, 0.0, False)-pulse('sq', 12, 0.03, 0.0))/pulse('sq', 12, 0.03, 0.0) < 0.02 else 0.0, '1.0')
# P2
u = optimize.brentq(lambda x: math.sin(x)**2/x**2-0.5, 0.5, 2.0)
chk(23, 'P2: 2π/T (T = 12)', 2*math.pi/12, '0.5236'); chk(23, 'P2: u con sinc²(u) = ½', u, '1.39156'); chk(23, 'P2: 4u', 4*u, '5.566'); chk(23, 'P2: 4u/T (T = 12)', 4*u/12, '0.4639'); chk(23, 'P2: ∫sin²u/u² du', integrate.quad(lambda x: math.sin(x)**2/x**2, 0, np.inf, limit=500)[0]*2, '3.1416', 1e-5)
# P3
V, eps = 0.01, 0.1; G = 2*math.pi*V*V/eps; Tr = 2*math.pi/eps
chk(23, 'P3: ρ', 1/eps, '10.0'); chk(23, 'P3: Γ (10⁻³)', G/1e-3, '6.283'); chk(23, 'P3: τ', 1/G, '159.15'); chk(23, 'P3: T_ret', Tr, '62.83'); chk(23, 'P3: Γ T_ret', G*Tr, '0.3948'); chk(23, 'P3: e^{−ΓT_ret}', math.exp(-G*Tr), '0.674'); chk(23, 'P3: (2π)²V²/ε²', (2*math.pi)**2*V*V/eps**2, '0.3948')
H = np.zeros((201, 201));
for j in range(1, 201): H[j, j] = eps*(j-100.5); H[0, j] = H[j, 0] = V
w_, U_ = np.linalg.eigh(H); Pex = abs(np.sum(U_[0, :]**2*np.exp(-1j*w_*Tr)))**2
chk(23, 'P3/Sim: supervivencia exacta en T_ret', Pex, '0.6744', 1e-3); chk(23, 'P3: Γ/ε', G/eps, '0.0628')
V3 = 0.03; G3 = 2*math.pi*V3*V3/eps; chk(23, 'P3: Γ (V = 0.03)', G3, '0.05655'); chk(23, 'P3: Γ T_ret (V = 0.03)', G3*Tr, '3.553'); chk(23, 'P3: e^{−3.553}', math.exp(-G3*Tr), '0.0286'); chk(23, 'Sim: Γ/ε con V = 0.03', G3/eps, '0.57', 5e-3)
H = np.zeros((201, 201))
for j in range(1, 201): H[j, j] = eps*(j-100.5); H[0, j] = H[j, 0] = V3
w_, U_ = np.linalg.eigh(H); chk(23, 'Sim: supervivencia (V = 0.03) en T_ret', abs(np.sum(U_[0, :]**2*np.exp(-1j*w_*Tr)))**2, '0.029', 2e-2)
# P4
z = 0.7449355*a0; Om = e*1e6*z/hb
chk(23, 'P4: V_fi (10⁻²⁴ J)', e*1e6*z/1e-24, '6.316'); chk(23, 'P4: Ω (10¹⁰ rad/s)', Om/1e10, '5.989'); chk(23, 'P4: t (ps)', 0.2/Om*1e12, '3.34'); chk(23, 'P4: campo atómico (10¹¹ V/m)', 5.14220674763e11/1e11, '5.1')
# P5
for T_, lam, A_, key in ((5800, 656.28e-9, 4.4101e7, 'ha'), (5800, 121.567e-9, 6.2649e8, 'ly')):
    nu = c_/lam; x = h_*nu/(kB_*T_); n = 1/math.expm1(x); om = 2*math.pi*nu; B = math.pi**2*c_**3*A_/(hb*om**3)
    if key == 'ha':
        chk(23, 'P5: ω (10¹⁵ rad/s)', om/1e15, '2.870'); chk(23, 'P5: B₂₁ (10²¹)', B/1e21, '4.703'); chk(23, 'P5/Sim: hν/kT (Hα)', x, '3.780'); chk(23, 'P5/Sim: n̄ (Hα)', n, '0.02336'); chk(23, 'Sim: n̄ (%)', n*100, '2.3', 5e-2)
    else:
        chk(23, 'P5/Sim: hν/kT (Lyα)', x, '20.41'); chk(23, 'P5/Sim: n̄ (Lyα, 10⁻⁹)', n/1e-9, '1.374'); chk(23, 'P5/Sim: W₁₂ (s⁻¹)', 3*n*A_, '2.58'); chk(23, 'P5: n̄ (Lyα, 2 cifras)', n/1e-9, '1.4', 2e-2)
nu21 = c_/0.21106; n21 = 1/math.expm1(h_*nu21/(kB_*2.725)); chk(23, 'Sim: hν/kT (21 cm, 2.725 K)', h_*nu21/(kB_*2.725), '0.0250'); chk(23, 'Sim: n̄ (21 cm)', n21, '39.5', 5e-3); chk(23, 'Sim: tasa estimulada (10⁻¹³ s⁻¹)', n21*2.8843e-15/1e-13, '1.1', 2e-2); chk(23, 'Sim: A (10⁻¹⁵)', 2.8843, '2.9', 5e-3)
chk(23, 'Sim: B₂₁ de Hα (10²¹)', math.pi**2*c_**3*4.4101e7/(hb*(2*math.pi*c_/656.28e-9)**3)/1e21, '4.70')
# Relación de Einstein con SymPy: Planck desde A/B y detalle de balance
x_, T_, A_, B_, w_ = sp.symbols('x T A B w', positive=True)
rho = sp.Symbol('A')/sp.Symbol('B')/(sp.exp(x_)-1)  # g1 B12 = g2 B21 → denominador e^x − 1
chk(23, 'P5: equilibrio N₁B₁₂ρ = N₂(A + B₂₁ρ) da ρ = (A/B)/(e^x − 1) (SymPy)', 1.0 if sp.simplify(sp.solve(sp.Eq(sp.exp(x_)*B_*sp.Symbol('r'), B_*sp.Symbol('r')+A_), sp.Symbol('r'))[0]-A_/(B_*(sp.exp(x_)-1))) == 0 else 0.0, '1.0')
# P6
chk(23, 'P6: ∫ sin²(xt/2)/(x/2)² dx con t = 5', 2*math.pi*5, '31.416'); chk(23, 'P6: t = 5, numérica', integrate.quad(lambda x: math.sin(2.5*x)**2/(x/2)**2, -600, 600, limit=6000, points=[0])[0], '31.4', 5e-3)
