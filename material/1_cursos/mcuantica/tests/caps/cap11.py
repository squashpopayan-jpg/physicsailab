# -*- coding: utf-8 -*-
# Capítulo 11: bandas (ħ = m = a = 1; unidad de energía ħ²/ma²)
HB2M = hbar**2/me/e*1e18
U = HB2M/0.25     # ħ²/ma² con a = 0.5 nm (eV)
chk(11, 'Ej.: unidad ħ²/ma² (eV)', U, '0.3048'); chk(11, 'P1: ħ²/ma² con a = 0.5 nm', HB2M/0.25, '0.3048')
def f(E, P):
    if E > 1e-14: q = math.sqrt(2*E); return math.cos(q)+P*math.sin(q)/q
    if E < -1e-14: k = math.sqrt(-2*E); return math.cosh(k)+P*math.sinh(k)/k
    return 1+P
def bands(P, Emax, Emin):
    Es = np.linspace(Emin, Emax, 200001); ins = [abs(f(E, P)) <= 1 for E in Es]; out = []; cur = None
    for i in range(1, len(Es)):
        if ins[i] and not ins[i-1]: cur = [optimize.brentq(lambda E: abs(f(E, P))-1, Es[i-1], Es[i], xtol=1e-13)]
        if (not ins[i]) and ins[i-1] and cur: cur.append(optimize.brentq(lambda E: abs(f(E, P))-1, Es[i-1], Es[i], xtol=1e-13)); out.append(cur); cur = None
    return out
b3 = bands(3, 60, 1e-4)
for i, (lo, hi) in enumerate((('1.9532', '4.9348'), ('9.4580', '19.7392'), ('25.0939', '44.4132'))): chk(11, f'Ej./P4: banda {i+1} (P = 3) borde inferior', b3[i][0], lo); chk(11, f'Ej./P4: banda {i+1} (P = 3) borde superior', b3[i][1], hi)
chk(11, 'P1/P4: π²/2', math.pi**2/2, '4.9348'); chk(11, 'P4: 2π²', 2*math.pi**2, '19.7392'); chk(11, 'P4: brecha 1 (P = 3)', b3[1][0]-b3[0][1], '4.5232'); chk(11, 'Sim: brecha 1 (3 cifras)', b3[1][0]-b3[0][1], '4.523'); chk(11, 'P4: ancho de la banda 1', b3[0][1]-b3[0][0], '2.9816'); chk(11, 'Sim: ancho de la banda 1', b3[0][1]-b3[0][0], '2.982')
qlo = optimize.brentq(lambda q: math.cos(q)+3*math.sin(q)/q-1, 1.0, 3.0); chk(11, 'P4: q del borde inferior', qlo, '1.9765'); chk(11, 'P4: E del borde inferior', qlo**2/2, '1.9532')
q2 = optimize.brentq(lambda q: math.cos(q)+3*math.sin(q)/q+1, math.pi+0.01, 2*math.pi-0.01); chk(11, 'P4: q de la banda 2', q2, '4.3493'); chk(11, 'P4: E de la banda 2', q2**2/2, '9.4580')
chk(11, 'P4: f(π) = −1', math.cos(math.pi)+3*math.sin(math.pi)/math.pi, '-1.0'); chk(11, 'P4: f(2π) = +1', math.cos(2*math.pi)+3*math.sin(2*math.pi)/(2*math.pi), '1.0'); chk(11, 'P4: f(0) = 1 + P', 1+3, '4.0')
chk(11, 'Ej.: banda 1 inferior (eV)', b3[0][0]*U, '0.595'); chk(11, 'Ej.: banda 1 superior (eV)', b3[0][1]*U, '1.504'); chk(11, 'Ej.: ancho de la banda 1 (eV)', (b3[0][1]-b3[0][0])*U, '0.909'); chk(11, 'Ej.: brecha (eV)', (b3[1][0]-b3[0][1])*U, '1.379'); chk(11, 'Ej.: banda 2 inferior (eV)', b3[1][0]*U, '2.883'); chk(11, 'Ej.: banda 2 superior (eV)', b3[1][1]*U, '6.016')
chk(11, 'Ej.: brecha × unidad', 4.5232*0.3048, '1.379')
# masa efectiva
def Ek(k, P, lo, hi): return optimize.brentq(lambda E: f(E, P)-math.cos(k), lo, hi, xtol=1e-14)
h_ = 0.01; lo, hi = b3[0]
curv0 = 2*(Ek(h_, 3, lo, hi)-lo)/h_**2; curvp = 2*(Ek(math.pi-h_, 3, lo, hi)-hi)/h_**2
chk(11, 'Sim: m* en el fondo (P = 3)', 1/curv0, '1.125', 5e-3); chk(11, 'Sim: m* en el borde (P = 3)', 1/curvp, '-0.30', 2e-2)
# P = 0.5 y -6
b05 = bands(0.5, 60, 1e-4); chk(11, 'Sim: P = 0.5 banda 1 inferior', b05[0][0], '0.461'); chk(11, 'Sim: P = 0.5 banda 2 inferior', b05[1][0], '5.886'); chk(11, 'Sim: P = 0.5 brecha', b05[1][0]-b05[0][1], '0.951'); chk(11, 'Sim: 2P', 2*0.5, '1.0')
bm = bands(-6, 10, -25)
chk(11, 'Sim/P5: P = −6 banda 1 inferior', bm[0][0], '-18.174'); chk(11, 'Sim/P5: P = −6 banda 1 superior', bm[0][1], '-17.817'); chk(11, 'Sim: P = −6 banda 2 inferior', bm[1][0], '4.935'); chk(11, 'Sim: ancho (P = −6)', bm[0][1]-bm[0][0], '0.357'); chk(11, 'P5: ancho exacto', bm[0][1]-bm[0][0], '0.3573')
e1 = Ek(h_, -6, *bm[0]); chk(11, 'Sim/P5: m* (P = −6)', 1/(2*(e1-bm[0][0])/h_**2), '5.85', 5e-3)
t = 2*18*math.exp(-6); chk(11, 'P5: t = 2|E₀| e^{−6}', t, '0.0892'); chk(11, 'P5: t (4 cifras)', t, '0.08924'); chk(11, 'P5: 4t', 4*t, '0.3569'); chk(11, 'P5: m* = 1/(2t)', 1/(2*t), '5.60'); chk(11, 'P5: error del ancho (%)', ((bm[0][1]-bm[0][0])/(4*t)-1)*100, '0.1'); chk(11, 'P5: E₀ = −P²/2', -36/2, '-18.0')
# casi libres
def nfe(k, V1, M=8):
    n = 2*M+1; A = np.zeros((n, n))
    for i in range(n):
        A[i, i] = 0.5*(k+2*math.pi*(i-M))**2
        if i+1 < n: A[i, i+1] = V1; A[i+1, i] = V1
    return linalg.eigvalsh(A)
w5 = nfe(math.pi, 0.5); chk(11, 'Sim: brecha con V₁ = 0.5', w5[1]-w5[0], '0.99984'); chk(11, 'Sim: borde inferior (V₁ = 0.5)', w5[0], '4.4285'); chk(11, 'Sim: borde superior (V₁ = 0.5)', w5[1], '5.4284'); chk(11, 'Sim: desviación del centro', math.pi**2/2-(w5[0]+w5[1])/2, '0.0063')
w8 = nfe(math.pi, 0.8); chk(11, 'P2/Sim: brecha con V₁ = 0.8', w8[1]-w8[0], '1.5993'); chk(11, 'P2: E₋', w8[0], '4.1189'); chk(11, 'P2: E₊', w8[1], '5.7183'); chk(11, 'P2: E₋ primer orden', math.pi**2/2-0.8, '4.1348'); chk(11, 'P2: E₊ primer orden', math.pi**2/2+0.8, '5.7348'); chk(11, 'P2: desplazamiento hacia abajo', math.pi**2/2-(w8[0]+w8[1])/2, '0.016'); chk(11, 'P2: diferencia de la brecha (%)', (1-(w8[1]-w8[0])/1.6)*100, '0.04')
chk(11, 'P2: E₋ (eV)', w8[0]*U, '1.2554'); chk(11, 'P2: E₊ (eV)', w8[1]*U, '1.7429'); chk(11, 'P2: brecha (eV)', (w8[1]-w8[0])*U, '0.4875'); chk(11, 'P2: brecha (eV, 3 cifras)', (w8[1]-w8[0])*U, '0.487')
w15 = nfe(math.pi, 1.5); chk(11, 'Sim: brecha con V₁ = 1.5', w15[1]-w15[0], '2.9957')
# P1
chk(11, 'P1: π/a (nm⁻¹)', math.pi/0.5, '6.283'); chk(11, 'P1: E libre (eV)', math.pi**2/2*U, '1.504'); chk(11, 'P1: λ = 2a (nm)', 2*0.5, '1.0')
# TB y Bloch
chk(11, 'Sim: ancho 4t con t = 0.4', 4*0.4, '1.6'); chk(11, 'Sim: m* = 1/(2t)', 1/(2*0.4), '1.25'); chk(11, 'Sim: v máx = 2t', 2*0.4, '0.8'); chk(11, 'Sim: T_B = 2π/F', 2*math.pi/0.1, '62.83'); chk(11, 'Sim: amplitud 4t/F', 4*0.4/0.1, '16.0')
d_ = 10e-9; Fd = e*1e6*d_/e   # eV (F d con E = 1e6 V/m)
chk(11, 'Ej./P6: F d (meV)', 1e6*d_*1e3, '10.0'); chk(11, 'Ej./P6: T_B (ps)', C.h/(1e6*d_*e)*1e12, '0.414'); chk(11, 'Ej.: T_B (ps, 4 cifras)', C.h/(1e6*d_*e)*1e12, '0.4136'); chk(11, 'P6: h (10⁻¹⁵ eV·s)', C.h/e/1e-15, '4.1357'); chk(11, 'P6: frecuencia (THz)', 1/(C.h/(1e6*d_*e))/1e12, '2.42'); chk(11, 'Ej.: frecuencia (THz, 2 cifras)', 1/(C.h/(1e6*d_*e))/1e12, '2.4'); chk(11, 'Ej./P6: amplitud (nm)', 20e-3/1e6*1e9, '20.0'); chk(11, 'P6: F (10⁻¹³ N)', e*1e6/1e-13, '1.602')
# Bloch: simbólico
tt, FF, hb_, a_ = sp.symbols('t F hbar a', positive=True)
xs_ = (2*sp.Symbol('tt', positive=True)/FF)*(1-sp.cos(FF*a_*tt/hb_))
vs_ = sp.diff(xs_, tt); chk(11, 'P6: v = (2ta/ħ) sen(Fat/ħ) (SymPy)', 1.0 if sp.simplify(vs_-(2*sp.Symbol('tt', positive=True)*a_/hb_)*sp.sin(FF*a_*tt/hb_)) == 0 else 0.0, '1.0')
# densidad de estados del enlace fuerte frente a histograma
Nk = 200000; ks = np.linspace(-math.pi, math.pi, Nk, endpoint=False); Ek_ = -2*0.3*np.cos(ks)
hist, edges = np.histogram(Ek_, bins=400, density=True); cen = 0.5*(edges[1:]+edges[:-1]); gth = 1/(math.pi*np.sqrt(4*0.3**2-cen**2))
chk(11, 'P5: g(E) = 1/(π√(4t²−E²)) frente al histograma (banda central)', float(np.median(hist[150:250]/gth[150:250])), 1.0, 1e-2)
chk(11, 'Brillouin: N valores de k', len([1 for j in range(-20, 20) if -math.pi < 2*math.pi*j/10 <= math.pi]), '10')
