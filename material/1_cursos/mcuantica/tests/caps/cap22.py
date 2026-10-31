# -*- coding: utf-8 -*-
# Capítulo 22: WKB
from scipy.integrate import solve_ivp
# P1
En = lambda n: (3*math.pi*(n+0.5)/(4*math.sqrt(2)))**(2/3)
zA = special.ai_zeros(4); ex = sorted((-zA[0]/2**(1/3)).tolist()+(-zA[1]/2**(1/3)).tolist())
for n, v in ((0, '0.8853'), (1, '1.8416'), (2, '2.5888'), (3, '3.2397')): chk(22, f'P1/Sim: E_WKB (n = {n})', En(n), v)
for n, v in ((0, '0.8086'), (1, '1.8558'), (2, '2.5781'), (3, '3.2446')): chk(22, f'P1/Sim: E exacta (n = {n})', ex[n], v)
for v, s in zip(-zA[1][:3], ('1.01879', '3.24820', '4.82010')): chk(22, f'P1: cero de Ai′ {s}', v, s)
for v, s in zip(-zA[0][:2], ('2.33811', '4.08795')): chk(22, f'P1: cero de Ai {s}', v, s)
for n, v in ((0, '9.5'), (1, '0.76'), (2, '0.41'), (3, '0.15')): chk(22, f'P1/Sim: error (n = {n}) %', abs(En(n)-ex[n])/ex[n]*100, v)
chk(22, 'P1: 4√2/3', 4*math.sqrt(2)/3, '1.8856'); chk(22, 'P1: 2√2·(2/3)', 2*math.sqrt(2)*2/3, '1.8856')
x_, E_ = sp.symbols('x E', positive=True); chk(22, 'P1: ∫₀ᴱ √(E − x) dx = (2/3)E^{3/2} (SymPy)', 1.0 if sp.simplify(sp.integrate(sp.sqrt(E_-x_), (x_, 0, E_))-sp.Rational(2, 3)*E_**sp.Rational(3, 2)) == 0 else 0.0, '1.0')
chk(22, 'P1: (3π/(8√2))^{2/3}', (3*math.pi/(8*math.sqrt(2)))**(2/3), '0.8853'); chk(22, 'P1: (9π/(8√2))^{2/3}', (9*math.pi/(8*math.sqrt(2)))**(2/3), '1.8416')
# Sim niveles: cuártico y Morse
h_ = 12/4001; xs = -6+h_*np.arange(1, 4001); t = 1/(2*h_*h_); Eq = linalg.eigh_tridiagonal(2*t+xs**4, -t*np.ones(3999), select='i', select_range=(0, 1), eigvals_only=True)
bs = lambda V, n, Emax: optimize.brentq(lambda E: integrate.quad(lambda x: math.sqrt(max(0, 2*(E-V(x)))), optimize.brentq(lambda x: V(x)-E, -20, 0), optimize.brentq(lambda x: V(x)-E, 0, 20))[0]-(n+.5)*math.pi, 1e-3, Emax)
chk(22, 'Sim: x⁴, E₀ WKB', bs(lambda x: x**4, 0, 30), '0.5463'); chk(22, 'Sim: x⁴, E₀ exacta', Eq[0], '0.668', 1e-3); chk(22, 'Sim: x⁴, error E₀ (%)', abs(bs(lambda x: x**4, 0, 30)-Eq[0])/Eq[0]*100, '18', 2e-2); chk(22, 'Sim: x⁴, E₁ WKB', bs(lambda x: x**4, 1, 30), '2.364'); chk(22, 'Sim: x⁴, E₁ exacta', Eq[1], '2.394'); chk(22, 'Sim: x⁴, error E₁ (%)', abs(bs(lambda x: x**4, 1, 30)-Eq[1])/Eq[1]*100, '1.3', 2e-2)
w = math.sqrt(24); chk(22, 'Sim: Morse n = 0', w*0.5-(w*0.5)**2/48, '2.3245'); chk(22, 'Sim: Morse n = 1', w*1.5-(w*1.5)**2/48, '6.2235'); chk(22, 'Sim: Morse n = 4 < D = 12', w*4.5-(w*4.5)**2/48, '11.9204')
# P2
chk(22, 'P2: área de la elipse π x₀ p₀ = 2πE/ω', 1.0 if sp.simplify(sp.pi*sp.sqrt(2*E_/(sp.Symbol('m', positive=True)*sp.Symbol('w', positive=True)**2))*sp.sqrt(2*sp.Symbol('m', positive=True)*E_)-2*sp.pi*E_/sp.Symbol('w', positive=True)) == 0 else 0.0, '1.0')
# P3
hb = hbar; k = math.sqrt(2*me*4*e)/hb; a = 1e-9
chk(22, 'P3: κ (nm⁻¹)', k*1e-9, '10.246'); chk(22, 'P3: κ (10¹⁰ m⁻¹)', k/1e10, '1.0246'); chk(22, 'P3: 2κa', 2*k*a, '20.493'); chk(22, 'P3: T_WKB (10⁻⁹)', math.exp(-2*k*a)/1e-9, '1.259'); Te = 1/(1+25*math.sinh(k*a)**2/(4*1*4)); chk(22, 'P3: T exacta (10⁻⁹)', Te/1e-9, '3.224'); chk(22, 'P3: cociente', Te/math.exp(-2*k*a), '2.56'); chk(22, 'P3: 16·4/25', 16*4/25, '2.56')
# P4
b = 4*math.sqrt(2*me)*e**1.5/(3*hb*e)*1e-9; chk(22, 'P4/Sec.: 4√(2m)/(3ħe) (V eV^{-3/2} nm^{-1})', b, '6.831'); chk(22, 'P4: 4.5^{3/2}', 4.5**1.5, '9.546'); chk(22, 'P4: 2S', b*4.5**1.5/5, '13.04'); chk(22, 'P4: T (10⁻⁶)', math.exp(-b*4.5**1.5/5)/1e-6, '2.17'); chk(22, 'P4: pendiente (V/nm)', b*4.5**1.5, '65.2')
# P5, Sim alfa
alpha = 7.2973525693e-3; hc = 197.3269804; ke = 1.43996454; amu = 931.494102
def alfa(Z, A, Q, r0=1.2, V0=35):
    Zd, Ad = Z-2, A-4; k = 2*Zd*ke; mA = 4.001506*amu; mD = Ad*amu; mu = mA*mD/(mA+mD); R = r0*(Ad**(1/3)+4**(1/3)); bb = k/Q; x = R/bb; v = math.sqrt(2*Q/mu)
    g2 = 4*k/(hc*v)*(math.acos(math.sqrt(x))-math.sqrt(x*(1-x))); vin = math.sqrt(2*(Q+V0)/mu); f = vin*299792458e15/(2*R)
    return dict(k=k, mu=mu, R=R, b=bb, x=x, v=v, g2=g2, vin=vin, f=f, t=math.log(2)/(f*math.exp(-g2)))
U = alfa(92, 238, 4.270); chk(22, 'P5: k (MeV fm)', U['k'], '259.19'); chk(22, 'P5: μc² (MeV)', U['mu'], '3664.7'); chk(22, 'P5: R (fm)', U['R'], '9.2996'); chk(22, 'P5: 234^{1/3}', 234**(1/3), '6.1622'); chk(22, 'P5: b (fm)', U['b'], '60.70'); chk(22, 'P5: x', U['x'], '0.15320'); chk(22, 'P5: v/c', U['v'], '0.048274')
chk(22, 'P5: arccos √x', math.acos(math.sqrt(U['x'])), '1.16863'); chk(22, 'P5: √(x(1−x))', math.sqrt(U['x']*(1-U['x'])), '0.36018'); chk(22, 'P5: 2G', U['g2'], '87.99'); chk(22, 'P5: v_in/c', U['vin'], '0.14639'); chk(22, 'P5/Sim: f (10²¹)', U['f']/1e21, '2.36'); chk(22, 'P5/Sim: t½ (10¹⁶ s)', U['t']/1e16, '4.81'); chk(22, 'P5: t½ (10⁹ años)', U['t']/3.156e7/1e9, '1.52', 3e-3); chk(22, 'P5: cociente con la medida', U['t']/1.41e17, '0.34', 2e-2)
chk(22, 'Sim: e^{−2G} (U-238)', math.exp(-U['g2'])/1e-39, '6.1', 2e-2); chk(22, 'P5: [1.16863 − 0.36018]', 1.16863-0.36018, '0.80845'); chk(22, 'P5: 4k/(ħc v/c)', 4*U['k']/(hc*U['v']), '108.84')
Po = alfa(84, 212, 8.954); chk(22, 'Sim: Po-212 2G', Po['g2'], '32.29'); chk(22, 'Sim: Po-212 t½ (10⁻⁸ s)', Po['t']/1e-8, '2.84')
NU = [(84, 212, 8.954, 2.99e-7), (84, 214, 7.833, 1.643e-4), (84, 210, 5.407, 1.196e7), (86, 222, 5.590, 3.30e5), (88, 226, 4.871, 5.05e10), (90, 230, 4.770, 2.38e12), (92, 238, 4.270, 1.41e17), (90, 232, 4.082, 4.43e17)]
ds = [math.log10(alfa(Z, A, Q)['t']/t_) for Z, A, Q, t_ in NU]
chk(22, 'Sim: desviación típica de log₁₀(teoría/medida)', float(np.std(ds)), '0.49', 1e-2); chk(22, 'Sim: media de log₁₀(teoría/medida)', float(np.mean(ds)), '-0.84', 1e-2); chk(22, 'Sim: intervalo de vidas medias (órdenes)', math.log10(max(n[3] for n in NU)/min(n[3] for n in NU)), '24.17', 1e-3)
# P6
mu = 938.272/2; EG = 2*mu*(math.pi*alpha)**2; kT = 8.617333262e-5*1.5e7/1e3; E0 = (EG*1e3*kT**2/4)**(1/3)
chk(22, 'P6: μc² (MeV)', mu, '469.14'); chk(22, 'P6: (πα)² (10⁻⁴)', (math.pi*alpha)**2/1e-4, '5.2557'); chk(22, 'P6: E_G (MeV)', EG, '0.4931'); chk(22, 'P6/Sec.: E_G (keV)', EG*1e3, '493.1'); chk(22, 'P6: k_BT (keV)', kT, '1.2926'); chk(22, 'Sec.: k_BT (keV, 3 cifras)', kT, '1.29'); chk(22, 'P6: (k_BT)²', kT**2, '1.6708'); chk(22, 'P6: E₀ (keV)', E0, '5.906'); chk(22, 'P6: E_G(kT)²/4', EG*1e3*kT**2/4, '205.98'); chk(22, 'P6: E₀/k_BT', E0/kT, '4.6', 1e-2)
chk(22, 'P6: anchura Δ (keV)', 4*math.sqrt(E0*kT/3), '6.38'); chk(22, 'P6: exponente √(E_G/E₀)', math.sqrt(EG*1e3/E0), '9.138'); chk(22, 'P6: e^{−√(E_G/E₀)} (10⁻⁴)', math.exp(-math.sqrt(EG*1e3/E0))/1e-4, '1.08'); chk(22, 'Sec.: barrera a 1.5 fm (MeV)', ke/1.5, '0.96')
# Sim túnel
V0 = 20.0
def Tode(V, E, xl, xr):
    kR = math.sqrt(2*E); sol = solve_ivp(lambda x, y: [y[1], -2*(E-V(x))*y[0]], [xr, xl], [1+0j, 1j*kR], rtol=1e-12, atol=1e-14, method='DOP853'); A = 0.5*(sol.y[0, -1]+sol.y[1, -1]/(1j*kR)); return float(1/abs(A)**2)
Vp = lambda x: V0*(1-x*x) if abs(x) < 1 else 0.0
Sx = integrate.quad(lambda x: math.sqrt(2*(V0*(1-x*x)-8)), -math.sqrt(.6), math.sqrt(.6))[0]
chk(22, 'Sim: S (E = 0.4V₀)', Sx, '5.961'); chk(22, 'Sim: T_WKB (E = 0.4V₀, 10⁻⁶)', math.exp(-2*Sx)/1e-6, '6.65'); chk(22, 'Sim: T exacta (10⁻⁶)', Tode(Vp, 8.0, -3, 3)/1e-6, '8.98', 2e-3); chk(22, 'Sim: cociente WKB/exacta', math.exp(-2*Sx)/Tode(Vp, 8.0, -3, 3), '0.74', 1e-2)
S9 = integrate.quad(lambda x: math.sqrt(2*(V0*(1-x*x)-18)), -math.sqrt(.1), math.sqrt(.1))[0]
chk(22, 'Sim: S (E = 0.9V₀)', S9, '0.9935'); chk(22, 'Sim: T exacta (E = 0.9V₀)', Tode(Vp, 18.0, -3, 3), '0.1221', 3e-3); chk(22, 'Sim: T_WKB (E = 0.9V₀)', math.exp(-2*S9), '0.1371'); chk(22, 'Sim: T Kemble (E = 0.9V₀)', 1/(1+math.exp(2*S9)), '0.1206')
Vt = lambda x: V0*(1-x) if 0 < x < 1 else 0.0; St = integrate.quad(lambda x: math.sqrt(2*(V0*(1-x)-8)), 0, 0.6)[0]
chk(22, 'Sim: triangular, cociente WKB/exacta', math.exp(-2*St)/Tode(Vt, 8.0, -1, 2), '0.52', 1e-2)
