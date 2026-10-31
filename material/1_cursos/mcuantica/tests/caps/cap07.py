# -*- coding: utf-8 -*-
# Capítulo 7: pozo finito, delta, doble pozo
HB2M = hbar**2/me/e*1e18   # ħ²/mₑ en eV·nm²
chk(7, 'ħ²/mₑ (eV·nm²)', HB2M, '0.0762')
def fwell(V0, L, mr):
    z0 = (L/2)*math.sqrt(2*V0*mr/HB2M); out = []; k = 0
    while k*math.pi/2 < z0:
        lo = k*math.pi/2+1e-12; hi = min((k+1)*math.pi/2-1e-12, z0)
        if hi <= lo: break
        f = (lambda z: math.tan(z)-math.sqrt(max(0, z0*z0-z*z))/z) if k % 2 == 0 else (lambda z: -1/math.tan(z)-math.sqrt(max(0, z0*z0-z*z))/z)
        z = optimize.brentq(f, lo, hi, xtol=1e-14); out.append((z, (HB2M/mr)*(z/(L/2))**2/2)); k += 1
    return z0, out
# Ej. GaAs 10 nm
z0, st = fwell(0.25, 10, 0.067)
chk(7, 'Ej. GaAs 10 nm: z₀', z0, '3.315'); chk(7, 'Ej. GaAs: nº de estados', len(st), '3')
for i, v in enumerate(('1.2003', '2.3526', '3.2824')): chk(7, f'Ej. GaAs: z_{i+1}', st[i][0], v)
for i, v in enumerate(('32.8', '125.9', '245.1')): chk(7, f'Ej. GaAs: E_{i+1} (meV)', st[i][1]*1e3, v)
box = lambda n, L, mr: n*n*math.pi**2*HB2M/mr/(2*L**2)
chk(7, 'Ej. GaAs: caja n=1 (meV)', box(1, 10, 0.067)*1e3, '56.1'); chk(7, 'Ej. GaAs: caja n=2 (meV)', box(2, 10, 0.067)*1e3, '224.5'); chk(7, 'Ej. GaAs: caja n=3 (meV)', box(3, 10, 0.067)*1e3, '505.1')
chk(7, 'Ej. GaAs: ΔE 1→2 (meV)', (st[1][1]-st[0][1])*1e3, '93.1'); chk(7, 'Ej. GaAs: λ 1→2 (µm)', hc/((st[1][1]-st[0][1]))/1e3, '13.3')
chk(7, 'Sim: nivel 3 bajo el borde (meV)', (0.25-st[2][1])*1e3, '4.9')
z5, st5 = fwell(0.25, 5, 0.067)
chk(7, 'Ej. GaAs 5 nm: nº de estados', len(st5), '2'); chk(7, 'Ej. GaAs 5 nm: E₁ (meV)', st5[0][1]*1e3, '83.2'); chk(7, 'Ej. GaAs 5 nm: E₂ (meV)', st5[1][1]*1e3, '248.3')
chk(7, 'Ej. GaAs 5 nm: ΔE (meV)', (st5[1][1]-st5[0][1])*1e3, '165.2'); chk(7, 'Ej. GaAs 5 nm: λ (µm)', hc/(st5[1][1]-st5[0][1])/1e3, '7.5')
# P1: electrón 1 nm, 5 eV
z0, st = fwell(5, 1, 1)
chk(7, 'P1: √(2V₀/(ħ²/m)) (nm⁻¹)', math.sqrt(2*5/HB2M), '11.456'); chk(7, 'P1: z₀', z0, '5.728'); chk(7, 'P1: nº de estados', len(st), '4')
chk(7, 'P1: z₁', st[0][0], '1.3355'); z1 = st[0][0]; chk(7, 'P1: z₁ tan z₁', z1*math.tan(z1), '5.5700'); chk(7, 'P1: √(z₀² − z₁²)', math.sqrt(z0**2-z1**2), '5.5700')
chk(7, 'P1: z₀²', z0**2, '32.81'); chk(7, 'P1: z₁²', z1**2, '1.78')
chk(7, 'P1: E₁ desde el fondo (eV)', st[0][1], '0.2718'); chk(7, 'P1: E₁ − V₀ (eV)', st[0][1]-5, '-4.728'); chk(7, 'P1: caja n=1 (eV)', box(1, 1, 1), '0.3760'); chk(7, 'P1: reducción (%)', (1-st[0][1]/box(1, 1, 1))*100, '28')
for i, v in enumerate(('0.272', '1.077', '2.379', '4.059')): chk(7, f'Sim: E_{i+1} (eV)', st[i][1], v)
for i, v in enumerate(('0.376', '1.504', '3.384', '6.016')): chk(7, f'Sim: caja n={i+1} (eV)', box(i+1, 1, 1), v)
chk(7, 'Sim: estado 4 bajo el borde (eV)', 5-st[3][1], '0.94'); chk(7, 'Sim: z₀ de 0.1 eV, 0.2 nm', fwell(0.1, 0.2, 1)[0], '0.162')
# Pozo débil
z0w, stw = fwell(0.1, 0.2, 1)
chk(7, 'P6: z₁ del pozo débil', stw[0][0], '0.15994'); chk(7, 'P6: E₁+V₀ (meV)', stw[0][1]*1e3, '97.46'); chk(7, 'P6: ligadura (meV)', (0.1-stw[0][1])*1e3, '2.54')
al = 0.1*0.2; chk(7, 'P6: α = V₀L (eV·nm)', al, '0.02'); chk(7, 'P6: E₀ de la delta (meV)', -al**2/(2*HB2M)*1e3, '-2.62'); chk(7, 'P6: error relativo (%)', ((0.1-stw[0][1])/(al**2/(2*HB2M))-1)*100, '-3', 1.0) if False else chk(7, 'P6: cociente ligadura/delta', (0.1-stw[0][1])/(al**2/(2*HB2M)), '0.97')
kap = al/HB2M; chk(7, 'P6: 1/κ de la delta (nm)', 1/kap, '3.8'); chk(7, 'Sim: 1/κ ≈ 3.9 nm (pozo exacto)', 1/math.sqrt(2*(0.1-stw[0][1])/HB2M), '3.9'); chk(7, 'Sim: 1/κ / L (19 veces)', 1/math.sqrt(2*(0.1-stw[0][1])/HB2M)/0.2, '19')
# P_out del pozo débil (cuadratura)
a_, k_, q_ = 0.1, math.sqrt(2*stw[0][1]/HB2M), math.sqrt(2*(0.1-stw[0][1])/HB2M)
Nin = a_+math.sin(2*k_*a_)/(2*k_); Nout = math.cos(k_*a_)**2/q_
chk(7, 'Sim: P fuera del pozo débil (%)', Nout/(Nin+Nout)*100, '95.0')
# Delta
k0 = 1/HB2M; E0 = -1/(2*HB2M)
chk(7, 'Ej. delta α=1 eV·nm: κ (nm⁻¹)', k0, '13.12'); chk(7, 'Ej. 1/κ (nm)', 1/k0, '0.0762'); chk(7, 'Ej. E₀ (eV)', E0, '-6.56'); chk(7, 'Ej. T a 2|E₀|', 1/(1+0.5), '0.667'); chk(7, 'P2: ħ²κ²/2m', HB2M/2*k0**2, '6.56'); chk(7, 'P2: κ² (nm⁻²)', k0**2, '172.2')
chk(7, 'Sim: T(|E₀|)', 0.5, '0.5000'); chk(7, 'Sim: T(4|E₀|)', 1/(1+1/4), '0.8000'); chk(7, 'Sim: ΔxΔp/(ħ/2) = √2', math.sqrt(2), '1.4142'); chk(7, 'Sim: Δx (α=1)', 1/math.sqrt(2), '0.7071')
# integrales de la delta con SymPy
x, kk = sp.symbols('x kappa', positive=True)
chk(7, 'P3: ∫ψ² = 1 para ψ = √κ e^{−κ|x|}', float(2*sp.integrate(kk*sp.exp(-2*kk*x), (x, 0, sp.oo)).subs(kk, 3)), '1.0')
chk(7, 'Delta: ⟨x²⟩ = 1/(2κ²)', float(2*sp.integrate(x**2*kk*sp.exp(-2*kk*x), (x, 0, sp.oo)).subs(kk, 2)), 1/(2*4), 1e-12)
chk(7, 'Delta: ⟨p²⟩ = κ² (ħ = 1)', float(2*sp.integrate(kk*kk*kk*sp.exp(-2*kk*x), (x, 0, sp.oo)).subs(kk, 2)), 4.0, 1e-12)
# Transmisión por la delta: verificación simbólica de t
kq, g = sp.symbols('k g', positive=True); t_ = sp.symbols('t'); r_ = sp.symbols('r')
sol = sp.solve([sp.Eq(1+r_, t_), sp.Eq(sp.I*kq*t_-sp.I*kq*(1-r_), g*2*t_)], [t_, r_]); tt = sol[t_]
chk(7, '|t|² = 1/(1 + (mα/ħ²k)²) (SymPy, g = mα/ħ² con el signo +)', float(sp.Abs(tt.subs({kq: 1.7, g: 0.9}))**2), 1/(1+(0.9/1.7)**2), 1e-12)
# Doble delta
def dd(k0_, a):
    fe = lambda k: k*(1+math.tanh(k*a))-2*k0_; fo = lambda k: k*(1+1/math.tanh(k*a))-2*k0_
    return optimize.brentq(fe, 1e-12, 2*k0_), (optimize.brentq(fo, 1e-12, 2*k0_) if 2*k0_*a > 1 else None)
ke, ko = dd(1, 1)
chk(7, 'P4: κ par (a=1)', ke, '1.10886'); chk(7, 'P4: E par (a=1)', -ke**2/2, '-0.61478'); chk(7, 'P4: κ impar (a=1)', ko, '0.79681'); chk(7, 'P4: E impar (a=1)', -ko**2/2, '-0.31745')
chk(7, 'P4: ΔE (a=1)', ke**2/2-ko**2/2, '0.29733'); chk(7, 'P4: 4|E₀|e^{−2} (a=1)', 2*math.exp(-2), '0.27067'); chk(7, 'P4: error (%) (a=1)', (ke**2/2-ko**2/2-2*math.exp(-2))/(ke**2/2-ko**2/2)*100, '9', 0.1) if False else chk(7, 'P4: error relativo (a=1, %)', (2*math.exp(-2)/(ke**2/2-ko**2/2)-1)*100, '-9')
ke2, ko2 = dd(1, 2)
chk(7, 'P4: κ par (a=2)', ke2, '1.01710'); chk(7, 'P4: E par (a=2)', -ke2**2/2, '-0.51725'); chk(7, 'P4: κ impar (a=2)', ko2, '0.98017'); chk(7, 'P4: E impar (a=2)', -ko2**2/2, '-0.48037')
chk(7, 'P4: ΔE (a=2)', ke2**2/2-ko2**2/2, '0.036882'); chk(7, 'P4: 2e^{−4}', 2*math.exp(-4), '0.036631'); chk(7, 'P4: error (a=2, %)', (1-2*math.exp(-4)/(ke2**2/2-ko2**2/2))*100, '0.7')
k04, _ = dd(1, 0.4)
chk(7, 'P4: κ par (a=0.4)', k04, '1.3418'); chk(7, 'P4: E par (a=0.4)', -k04**2/2, '-0.9002'); chk(7, 'P4: 2κ₀a (a=0.4)', 2*0.4, '0.8'); chk(7, 'P4: 1/a − 2κ₀ (a=0.4)', 1/0.4-2, '0.5')
# FD doble pozo
def fd_dw(V0, a, N=3000):
    xa = -3*a-3; xb = 3*a+3; h = (xb-xa)/(N+1); xg = xa+h*np.arange(1, N+1); t = 1/(2*h*h)
    return linalg.eigh_tridiagonal(2*t+V0*((xg/a)**2-1)**2, -t*np.ones(N-1), select='i', select_range=(0, 1), eigvals_only=True)
w = fd_dw(12, 1.5)
chk(7, 'Sim: E₀ (V₀=12, a=1.5)', w[0], '3.1430'); chk(7, 'Sim: E₁', w[1], '3.1458'); chk(7, 'Sim: ΔE (10⁻³)', (w[1]-w[0])/1e-3, '2.80'); chk(7, 'Sim: periodo ≈ 2.2×10³', 2*math.pi/(w[1]-w[0])/1e3, '2.2'); chk(7, 'Sim: ω/2', math.sqrt(8*12)/1.5/2, '3.27')
w2 = fd_dw(24, 1.5); chk(7, 'Sim: ΔE (V₀=24) (10⁻⁵)', (w2[1]-w2[0])/1e-5, '8.4'); chk(7, 'Sim: periodo (10⁴)', 2*math.pi/(w2[1]-w2[0])/1e4, '7.4'); chk(7, 'Sim: cociente de periodos', (w[1]-w[0])/(w2[1]-w2[0]), '33')
w3 = fd_dw(12, 2.5); chk(7, 'Sim: ΔE (a=2.5) (10⁻⁶)', (w3[1]-w3[0])/1e-6, '3.3')
# NH3
nu = 0.7934*100*c
chk(7, 'Ej. NH₃: ΔE (10⁻⁵ eV)', h*nu/e/1e-5, '9.837'); chk(7, 'Ej. NH₃: ν (GHz)', nu/1e9, '23.786'); chk(7, 'Ej. NH₃: T (ps)', 1/nu*1e12, '42.0'); chk(7, 'Ej. NH₃: λ (cm)', c/nu*100, '1.26'); chk(7, 'P5: T (ps, 2 cifras)', 1/nu*1e12, '42.04'); chk(7, 'P5: ν (GHz)', nu/1e9, '23.79'); chk(7, 'Ej. NH₃: inversiones por segundo (10¹⁰)', nu/1e10, '2.4', 0.0) if False else chk(7, 'Ej. NH₃: 24 mil millones', nu/1e9, '23.8')
chk(7, 'Ej. NH₃: barrera 2000 cm⁻¹ (eV)', 2000*100*h*c/e, '0.25')
