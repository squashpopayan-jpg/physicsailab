# -*- coding: utf-8 -*-
# Capítulo 24: adiabático, Berry, Landau–Zener
from scipy.integrate import solve_ivp
muB = 9.2740100783e-24; gs = 2.00231930436
# P1 / Sim
g = 0.5; chk(24, 'P1: 2πg²', 2*math.pi*g*g, '1.5708')
for v, s in ((0.5, '0.0432'), (2.0, '0.4559'), (8.0, '0.8217'), (12.0, '0.8773')): chk(24, f'P1/Sim: P_dia (v = {v})', math.exp(-2*math.pi*g*g/v), s)
chk(24, 'P1: exponente 3.1416 (v = 0.5)', 2*math.pi*g*g/0.5, '3.1416'); chk(24, 'P1: exponente 0.7854', 2*math.pi*g*g/2, '0.7854'); chk(24, 'P1: exponente 0.19635', 2*math.pi*g*g/8, '0.19635'); chk(24, 'P1: v_c', 2*math.pi*g*g, '1.5708'); chk(24, 'P1/Sim: 1/e', math.exp(-1), '0.368')
chk(24, 'Sim: 1 − P (v = 2)', 1-math.exp(-2*math.pi*g*g/2), '0.5441'); chk(24, 'Sim: 1 − P (v = 0.5)', 1-math.exp(-2*math.pi*g*g/0.5), '0.9568')
# Landau–Zener numérico independiente para la guía (v = 2, intervalos finitos)
def lz(g, v, T):
    sol = solve_ivp(lambda t, y: [-1j*(v*t/2*y[0]+g*y[1]), -1j*(g*y[0]-v*t/2*y[1])], [-T, T], [1+0j, 0j], rtol=1e-10, atol=1e-12, method='DOP853'); return float(abs(sol.y[0, -1])**2)
vals = [lz(0.5, 2.0, T) for T in (20, 30, 40)]
chk(24, 'Sim: LZ numérico (v = 2) entre 0.44 y 0.48 en T = 20, 30, 40', 1.0 if all(0.435 < x < 0.485 for x in vals) else 0.0, '1.0')
# P2
th60 = math.radians(60); Om = 2*math.pi*(1-math.cos(th60))
chk(24, 'P2: Ω (60°)', Om, '3.1416'); chk(24, 'P2: −Ω/2 (60°)', -Om/2, '-1.5708'); chk(24, 'P2: γ(m = −½) (60°)', Om/2, '1.5708'); chk(24, 'P2: Ω (90°)', 2*math.pi, '6.2832'); chk(24, 'P2: γ (90°)', -math.pi, '-3.1416')
chk(24, 'P2: γ ≈ −πθ²/2 con θ = 0.05', -math.pi*(1-math.cos(0.05)), -math.pi*0.05**2/2, 1e-3)
chk(24, 'Sim: γ en grados (60°)', math.degrees(-Om/2), '-90.0')
# P3
v = gs*muB/hbar*1e3; gg = gs*muB/hbar*1e-5/2
chk(24, 'P3: g_sμ_B/ħ (10¹¹)', gs*muB/hbar/1e11, '1.7609'); chk(24, 'P3: v (10¹⁴ rad/s²)', v/1e14, '1.7609'); chk(24, 'P3: g (10⁵ rad/s)', gg/1e5, '8.804'); chk(24, 'P3: g² (10¹¹)', gg**2/1e11, '7.752'); chk(24, 'P3: 2πg²/v', 2*math.pi*gg*gg/v, '0.02766'); chk(24, 'P3: P_dia', math.exp(-2*math.pi*gg*gg/v), '0.9727'); chk(24, 'P3: P_dia (%)', math.exp(-2*math.pi*gg*gg/v)*100, '97.3'); chk(24, 'P3: 1 − P (%)', (1-math.exp(-2*math.pi*gg*gg/v))*100, '2.7')
Bc = 2*hbar/(gs*muB)*math.sqrt(v/(2*math.pi)); chk(24, 'P3: B⊥ crítico (µT)', Bc*1e6, '60.1'); chk(24, 'P3: exponente con 1 mT', 2*math.pi*(gs*muB/hbar*1e-3/2)**2/v, '276.6', 2e-3)
# P4
chk(24, 'P4/Sim: P brusco (ω₁ = 2ω₀)', 2*math.sqrt(2)/3, '0.9428'); chk(24, 'P4: 2√2/3', 2*math.sqrt(2)/3, '0.9428'); chk(24, 'P4: E brusca (ħω₀)', 0.25+1.0, '1.25'); chk(24, 'P4/Sim: E brusca / ħω₁', (1+4)/(4*2), '0.625'); chk(24, 'P4: diferencia', 1.25-1.0, '0.25')
# Oscilador numérico independiente (Sim): P0 con τ = 20 y τ = 0.05 por solve_ivp en base truncada
NB = 28; Xm = np.zeros((NB, NB)); Dm = np.zeros((NB, NB))
for n in range(NB-1): Xm[n, n+1] = Xm[n+1, n] = math.sqrt((n+1)/2); Dm[n+1, n] = math.sqrt(n+1); Dm[n, n+1] = -math.sqrt(n+1)
X2 = Xm@Xm; P2 = -0.5*Dm@Dm
def hoP0(r, tau):
    Hf = lambda t: 0.5*P2+0.5*(1+(r-1)*min(1, max(0, t/tau)))**2*X2
    sol = solve_ivp(lambda t, y: -1j*(Hf(t)@y), [0, tau], np.eye(NB, dtype=complex)[0], rtol=1e-9, atol=1e-11, method='DOP853')
    w, U = np.linalg.eigh(Hf(tau)); return float(abs(np.vdot(U[:, 0], sol.y[:, -1]))**2), float(np.real(np.vdot(sol.y[:, -1], Hf(tau)@sol.y[:, -1]))/r)
p1, e1 = hoP0(2.0, 0.05); p2, e2 = hoP0(2.0, 20.0)
chk(24, 'Sim: P₀ con τ = 0.05', p1, '0.9429'); chk(24, 'Sim: E/ħω₁ con τ = 0.05', e1, '0.6248', 5e-4); chk(24, 'Sim: P₀ con τ = 20', p2, '0.99988', 5e-4); chk(24, 'Sim: E/ħω₁ con τ = 20', e2, '0.5002')
# P5
th = math.radians(60); om = 0.1; W = math.hypot(math.sin(th), math.cos(th)-om)
chk(24, 'P5: w_eff,z', math.cos(th)-om, '0.4'); chk(24, 'P5: w_eff,x', math.sin(th), '0.8660'); chk(24, 'P5: W', W, '0.95394'); chk(24, 'P5: sin χ', om*math.sin(th)/W, '0.09078'); chk(24, 'P5: sin²χ', (om*math.sin(th)/W)**2, '0.008242'); chk(24, 'P5/Sim: P_min', 1-(om*math.sin(th)/W)**2, '0.99176')
chk(24, 'P5: W² = 0.75 + 0.16', 0.75+0.16, '0.91'); chk(24, 'P5: ω = ω_L, θ = 90°: W', math.hypot(1, 0-1), '1.4142'); chk(24, 'P5: sin²χ (ω = ω_L, θ = 90°)', (1*1/math.hypot(1, 1))**2, '0.5'); chk(24, 'P5/Sim: P_min (ω = ω_L, 90°)', 1-0.5, '0.5')
# |n × w| = ω sinθ simbólico
t_, o_ = sp.symbols('theta omega', positive=True); n = sp.Matrix([sp.sin(t_), 0, sp.cos(t_)]); w = sp.Matrix([sp.sin(t_), 0, sp.cos(t_)-o_])
chk(24, 'P5: |n × w_eff|² = ω² sin²θ (SymPy)', 1.0 if sp.simplify((n.cross(w)).dot(n.cross(w))-o_**2*sp.sin(t_)**2) == 0 else 0.0, '1.0')
# P6
sx = np.array([[0, 1], [1, 0]], complex); sz = np.diag([1, -1]).astype(complex)
def phi(th, om):
    T = 2*math.pi/om; Hr = 0.5*(math.sin(th)*sx+(math.cos(th)-om)*sz); p0 = np.array([math.cos(th/2), math.sin(th/2)], complex)
    U = linalg.expm(-0.5j*om*T*sz)@linalg.expm(-1j*Hr*T); return float(np.angle(np.vdot(p0, U@p0)))
chk(24, 'P6: γ (60°)', -math.pi*(1-math.cos(th)), '-1.5708')
for om_, s_ in ((0.1, '-1.695'), (0.01, '-1.5826'), (0.002, '-1.5732')): chk(24, f'P6: fase exacta (ω = {om_})', phi(th, om_), s_)
chk(24, 'P6: ω_LT/2 = π/ω (ω = 0.1)', math.pi/0.1, '31.416'); chk(24, 'Sim: −ω_LT/2 (ω = 0.1)', -math.pi/0.1, '-31.416'); chk(24, 'Sim: T (ω = 0.1)', 2*math.pi/0.1, '62.832')
chk(24, 'P6: π(1 + cos 60°) ≡ −π/2 (mod 2π)', (math.pi*1.5+math.pi) % (2*math.pi)-math.pi, '-1.5708', 1e-6)
