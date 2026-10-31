# -*- coding: utf-8 -*-
# Capítulo 13: potenciales centrales
HB2M = hbar**2/me/e*1e18; H2 = HB2M/2
chk(13, 'ħ²/2mₑ (eV·nm²)', H2, '0.0381'); chk(13, 'P1: ħ²/2mₑ (4 decimales)', H2, '0.03810')
def zero(l, n):
    x = np.linspace(0.05, 60, 120001); f = special.spherical_jn(l, x); i = np.where(np.diff(np.sign(f)) != 0)[0][n-1]
    return optimize.brentq(lambda t: special.spherical_jn(l, t), x[i], x[i+1], xtol=1e-14)
for (l, n, v) in ((0, 1, '3.1416'), (1, 1, '4.4934'), (2, 1, '5.7635'), (0, 2, '6.2832'), (3, 1, '6.9879'), (1, 2, '7.7253'), (4, 1, '8.1826')): chk(13, f'ξ({n},{l})', zero(l, n), v)
for (l, n, v) in ((0, 1, '9.87'), (1, 1, '20.19'), (2, 1, '33.22'), (0, 2, '39.48'), (3, 1, '48.83'), (1, 2, '59.68'), (4, 1, '66.95')): chk(13, f'Orden de niveles: ξ² ({n},{l})', zero(l, n)**2, v)
chk(13, 'P1: tan x = x (raíz de j₁)', math.tan(zero(1, 1))-zero(1, 1), 0.0, 1e-9, rel=False)
# P1: 1 nm
for (l, n, v) in ((0, 1, '0.3760'), (1, 1, '0.7693'), (2, 1, '1.2656'), (0, 2, '1.5041')): chk(13, f'P1: E ({n},{l}) en 1 nm (eV)', H2*zero(l, n)**2, v)
dE = H2*(zero(1, 1)**2-math.pi**2); chk(13, 'P1: ΔE 1s→1p (eV)', dE, '0.3932'); chk(13, 'P1: λ (nm)', hc/dE, '3153')
chk(13, 'Sim: E de 1p, ξ²/2', zero(1, 1)**2/2, '10.095'); chk(13, 'Sim: 2p', zero(1, 2)**2/2, '29.840'); chk(13, 'Sim: 3p', zero(1, 3)**2/2, '59.450'); chk(13, 'Sim: 4p', zero(1, 4)**2/2, '98.929')
chk(13, 'Sim: ξ(3,1)', zero(1, 3), '10.9041'); chk(13, 'Sim: ξ(4,1)', zero(1, 4), '14.0662')
# pozo finito V0 = 30
def well0(V0, a):
    z0 = a*math.sqrt(2*V0); out = []; n = 0
    while (n+0.5)*math.pi < z0:
        lo = (n+0.5)*math.pi+1e-12; hi = min((n+1)*math.pi-1e-12, z0); g = lambda x: -x/math.tan(x)-math.sqrt(max(0, z0*z0-x*x))
        if g(lo)*g(hi) < 0: x = optimize.brentq(g, lo, hi, xtol=1e-14); out.append(-(z0*z0-x*x)/(a*a)/2)
        n += 1
    return out
w = well0(30, 1.0); chk(13, 'Sim: pozo V₀ = 30, E₁', w[0], '-26.149'); chk(13, 'Sim: pozo V₀ = 30, E₂', w[1], '-14.905'); chk(13, 'Sim: nº de estados (l = 0)', len(w), '2')
# oscilador y Coulomb (valores de la simulación)
chk(13, 'Sim: HO l = 1, n_r = 0…3', 2*0+1+1.5, '2.5'); chk(13, 'Sim: HO l = 2, n_r = 1', 2+2+1.5, '5.5')
for n in (1, 2, 3, 4): chk(13, f'Sim: Coulomb −1/2n² (n = {n})', -0.5/n**2, {1: '-0.5000', 2: '-0.1250', 3: '-0.0556', 4: '-0.0313'}[n])
# ondas parciales
def err(kr, L): return abs(sum((2*l+1)*(1j)**l*special.spherical_jn(l, kr) for l in range(L+1))-np.exp(1j*kr))
chk(13, 'Sim: error con kr = 10 y L = 10', err(10, 10), '0.74'); chk(13, 'Sim: error con kr = 10 y L = 15', err(10, 15), '0.011'); chk(13, 'Sim: error con L = 0, kr = 10', err(10, 0), '0.95')
def Lmin(kr): return [L for L in range(0, 70) if all(err(kr, m) < 1e-6 for m in range(L, 70))][0]
chk(13, 'Sim/P4: L para 10⁻⁶ en kr = 5', Lmin(5.0), '15'); chk(13, 'Sim/P4: L en kr = 10', Lmin(10.0), '23'); chk(13, 'Sim/P4: L en kr = 20', Lmin(20.0), '36')
chk(13, 'P4: promedio angular de e^{ikz} = j₀', float(integrate.quad(lambda x: 0.5*math.cos(7.3*x), -1, 1)[0]), math.sin(7.3)/7.3, 1e-12)
# P2: HO
chk(13, 'P2: degeneraciones con espín (N = 0…4)', 1.0 if [(N+1)*(N+2) for N in range(5)] == [2, 6, 12, 20, 30] else 0.0, '1.0')
cum = np.cumsum([(N+1)*(N+2) for N in range(5)]); chk(13, 'P2: números mágicos del oscilador', 1.0 if list(cum) == [2, 8, 20, 40, 70] else 0.0, '1.0')
chk(13, 'P2: N = 3: 7 + 3 = 10', (2*3+1)+(2*1+1), '10'); chk(13, 'P2: N = 4: 9 + 5 + 1 = 15', 9+5+1, '15')
# P3 SymPy
r = sp.symbols('r', positive=True); u = r*sp.exp(-r**2/2)
chk(13, 'P3: u = r e^{−r²/2}: −u″/2 + r²u/2 = (3/2) u (SymPy)', 1.0 if sp.simplify(-sp.diff(u, r, 2)/2+r**2*u/2-sp.Rational(3, 2)*u) == 0 else 0.0, '1.0')
Rr = sp.Function('R')(r); uu = r*Rr
chk(13, 'P3: (r²R′)′/r² con R = u/r vale u″/r (SymPy)', 1.0 if sp.simplify(sp.diff(r**2*sp.diff(uu/r, r), r)/r**2-sp.diff(uu, r, 2)/r) == 0 else 0.0, '1.0')
chk(13, 'P3: u′ = (1 − r²) e^{−r²/2}', 1.0 if sp.simplify(sp.diff(u, r)-(1-r**2)*sp.exp(-r**2/2)) == 0 else 0.0, '1.0'); chk(13, 'P3: u″ = (r³ − 3r) e^{−r²/2}', 1.0 if sp.simplify(sp.diff(u, r, 2)-(r**3-3*r)*sp.exp(-r**2/2)) == 0 else 0.0, '1.0')
# punto cuántico
me_, mh = 0.13, 0.45
for a, v, dv in ((2, '0.932', '2.672'), (3, '0.4142', '2.154'), (4, '0.2330', '1.973')):
    ec = H2*math.pi**2/a**2*(1/me_+1/mh); chk(13, f'P5: confinamiento (a = {a} nm)', ec, v); chk(13, f'P5: E de absorción (a = {a} nm)', 1.74+ec, dv)
chk(13, 'P5: 0.0381 π²/4', H2*math.pi**2/4, '0.09401'); chk(13, 'P5: 1/0.13 + 1/0.45', 1/me_+1/mh, '9.915'); chk(13, 'P5: 1/0.13', 1/me_, '7.692'); chk(13, 'P5: 1/0.45', 1/mh, '2.222')
for a, v in ((2, '464'), (3, '576'), (4, '628')): chk(13, f'P5: λ (a = {a} nm)', hc/(1.74+H2*math.pi**2/a**2*(1/me_+1/mh)), v)
chk(13, 'Ej.: λ con a = 1.5 nm', hc/(1.74+H2*math.pi**2/1.5**2*(1/me_+1/mh)), '365'); chk(13, 'Ej.: E con a = 1.5 nm', 1.74+H2*math.pi**2/1.5**2*(1/me_+1/mh), '3.397')
d1p = H2/(me_*4)*(zero(1, 1)**2-math.pi**2); chk(13, 'P5: 1s→1p del electrón (eV)', d1p, '0.756'); chk(13, 'P5: λ (µm)', hc/d1p/1e3, '1.64'); chk(13, 'P5: 0.0381/(0.13·4)', H2/(me_*4), '0.07327'); chk(13, 'P5: ξ² diferencia', zero(1, 1)**2-math.pi**2, '10.321')
# deuterón
mp_ = C.m_p; mn_ = C.m_n; mu = mp_*mn_/(mp_+mn_); MeV = e*1e6; h2mu = hbar**2/(2*mu)/MeV*1e30
chk(13, 'Ej.: μ (u)', mu/C.u, '0.50399'); chk(13, 'Ej./P6: ħ²/2μ (MeV fm²)', h2mu, '41.471'); kap = math.sqrt(2.2246/h2mu)
chk(13, 'Ej./P6: κ (fm⁻¹)', kap, '0.2316'); chk(13, 'Ej.: 1/κ (fm)', 1/kap, '4.32'); chk(13, 'P6: 1/κ (3 decimales)', 1/kap, '4.318')
Vth = math.pi**2*h2mu/(4*4.0); chk(13, 'Ej./P6: V₀ umbral (MeV)', Vth, '25.58'); chk(13, 'P6: π²·82.94/32', math.pi**2*2*h2mu/32, '25.58')
fV = lambda V0: math.sqrt((V0-2.2246)/h2mu)/math.tan(math.sqrt((V0-2.2246)/h2mu)*2.0)+kap
V0 = optimize.brentq(fV, Vth+2.2246+1e-6, 4*Vth+2.2246-1e-6); k_ = math.sqrt((V0-2.2246)/h2mu)
chk(13, 'Ej./P6: V₀ del deuterón (MeV)', V0, '36.57'); chk(13, 'Ej./P6: k (fm⁻¹)', k_, '0.9100'); chk(13, 'Ej./P6: ka', k_*2, '1.820')
Nin = 1.0-math.sin(2*k_*2.0)/(4*k_); Nout = math.sin(k_*2.0)**2/(2*kap); chk(13, 'Ej./P6: P(r > a) (%)', Nout/(Nin+Nout)*100, '64.2'); chk(13, 'P6: P (3 decimales)', Nout/(Nin+Nout), '0.642')
def Bfor(V0_, a=2.0):
    z0 = a*math.sqrt(V0_/h2mu); g = lambda x: -x/math.tan(x)-math.sqrt(max(0, z0*z0-x*x)); x = optimize.brentq(g, math.pi/2+1e-9, min(math.pi-1e-9, z0)); return (z0*z0-x*x)/(a*a)*h2mu
chk(13, 'Ej.: B con V₀ = 35', Bfor(35), '1.69'); chk(13, 'Ej.: B con V₀ = 38', Bfor(38), '2.76'); chk(13, 'Ej.: B con V₀ = 36.57', Bfor(36.567421974976774), '2.2244', 1e-3) if False else chk(13, 'Ej.: B con V₀ = 36.5674 (≈ 2.2246)', Bfor(V0), '2.2246')
chk(13, 'Ej.: variación relativa de B con −4 % en V₀ (%)', (Bfor(35)/2.2246-1)*100, '-24', 3e-2) if False else chk(13, 'Ej.: B(35)/B(36.57) − 1 (%)', (Bfor(35)/2.2246-1)*100, '-24', 0.1, rel=False)
# umbral con z0 = π/2: no hay ligado justo por debajo
chk(13, 'Umbral: z₀ = π/2 ↔ V₀ a² = π²ħ²/8m', (math.pi/2)**2/2, math.pi**2/8, 1e-12)
