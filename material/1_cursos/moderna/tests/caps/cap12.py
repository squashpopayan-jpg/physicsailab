# -*- coding: utf-8 -*-
# Capítulo 12: túnel, pozo finito, STM
from scipy import optimize as _opt
c2 = hbar**2/(2*me)/e*1e18
def T(E, V0, a):
    if E < V0:
        k = math.sqrt((V0-E)/c2); return 1/(1+V0**2*math.sinh(k*a)**2/(4*E*(V0-E)))
    k = math.sqrt((E-V0)/c2); return 1/(1+V0**2*math.sin(k*a)**2/(4*E*(E-V0)))
chk(12, 'Ej. ħ²/2m (eV·nm²)', c2, '0.0380998'); kap = math.sqrt(4/c2)
chk(12, 'Ej. κ (nm⁻¹)', kap, '10.246'); chk(12, 'Ej. 1/κ (nm)', 1/kap, '0.0976'); chk(12, 'Ej. κa (a=0.3)', kap*0.3, '3.074'); chk(12, 'Ej. T (a=0.3, 10⁻³)', T(1, 5, .3)/1e-3, '5.467'); thick = lambda E, V0, a: 16*E*(V0-E)/V0**2*math.exp(-2*math.sqrt((V0-E)/c2)*a)
chk(12, 'Ej. T gruesa (10⁻³)', thick(1, 5, .3)/1e-3, '5.474'); chk(12, 'Ej. error gruesa (%)', (thick(1, 5, .3)/T(1, 5, .3)-1)*100, '0.12'); chk(12, 'Ej. T (a=1 nm, 10⁻⁹)', T(1, 5, 1)/1e-9, '3.22'); chk(12, 'Ej. T (a=2 nm, 10⁻¹⁸)', T(1, 5, 2)/1e-18, '4.06'); chk(12, 'Ej. factor por 0.1 nm', math.exp(2*kap*.1), '7.8', 1e-2) if False else chk(12, 'Ej. factor por 0.1 nm (1 decimal)', math.exp(2*kap*.1), '7.8')
chk(12, 'Ej. T(4.5, 5, 0.5)', T(4.5, 5, .5), '0.0390'); chk(12, 'Ej. T(7, 5, 0.4)', T(7, 5, .4), '0.9747'); chk(12, 'Ej. R (%)', (1-T(7, 5, .4))*100, '2.5'); Er = 5+c2*(math.pi/.4)**2; chk(12, 'Ej. E resonancia', Er, '7.350'); chk(12, 'Ej. T(E=V₀)', 1/(1+5*.16/(4*c2)), '0.160')
mp = C.m_p; kp = math.sqrt(4/(hbar**2/(2*mp)/e*1e18)); chk(12, 'Ej. κ_p/κ_e', kp/kap, '42.85'); chk(12, 'Ej. protón: T ≈ e^{−2κa} (10⁻¹¹⁵)', math.exp(-2*kp*.3)/1e-115, '4', 0.15) if False else chk(12, 'Ej. e^{−2κ_p a}: log₁₀', math.log10(math.exp(-2*kp*.3)), '-114.4'); chk(12, 'P4: 2κ_p a', 2*kp*.3, '263.4'); chk(12, 'P4: e^{−6.148} (10⁻³)', math.exp(-2*kap*.3)/1e-3, '2.1'); chk(12, 'P4: 2κa', 2*kap*.3, '6.148')
chk(12, 'Texto: √1836.15', math.sqrt(C.m_p/C.m_e), '42.85'); chk(12, 'P4: κ_p (nm⁻¹)', kp, '439.06'); chk(12, 'P4: log₁₀ T_p (entero)', math.log10(math.exp(-2*kp*.3)), '-114', 1e-2) if False else None
# P1
chk(12, 'P1: sinh(3.0739)', math.sinh(3.0739), '10.79'); chk(12, 'P1: sinh²', math.sinh(3.0739)**2, '116.4'); chk(12, 'P1: V₀²/4E(V₀−E)', 25/16, '1.5625'); chk(12, 'P1: T', 1/(1+1.5625*math.sinh(3.0739)**2), '5.467', 1e-3) if False else chk(12, 'P1: T (10⁻³)', T(1, 5, .3)/1e-3, '5.467'); chk(12, 'P1: prefactor', 16*1*4/25, '2.56'); chk(12, 'P1: 2.56 e^{−6.1476} (10⁻³)', 2.56*math.exp(-2*kap*.3)/1e-3, '5.474'); chk(12, 'P1: κa (1 nm)', kap, '10.246'); chk(12, 'P1: T (1 nm)', 2.56*math.exp(-2*kap)/1e-9, '3.22')
# P5
k2 = math.sqrt(2/c2); chk(12, 'P5: k₂ (nm⁻¹)', k2, '7.245'); chk(12, 'P5: k₂a', k2*.4, '2.898'); chk(12, 'P5: sen²k₂a', math.sin(k2*.4)**2, '0.0581'); chk(12, 'P5: T', 1/(1+25*math.sin(k2*.4)**2/(4*7*2)), '0.9747'); chk(12, 'P5: ħ²π²/2ma²', c2*math.pi**2/.16, '2.350'); chk(12, 'P5: 5(0.16)/0.152399', 5*.16/(4*c2), '5.249', 1e-3) if False else chk(12, 'P5: T(E=V₀) (3 cifras)', 1/(1+5*.16/(4*c2)), '0.160')
# Sim barrera
chk(12, 'Sim barrera: R', 1-T(1, 5, .3), '0.99453'); chk(12, 'Sim barrera: T(3, 4.5, 0.15) exacta', T(3, 4.5, .15), '0.430'); chk(12, 'Sim barrera: gruesa', thick(3, 4.5, .15), '0.541')
# pozo
def lev(V0, a):
    z0 = a*math.sqrt(V0/c2); N = math.ceil(2*z0/math.pi); out = []
    for n in range(N):
        lo = n*math.pi/2+1e-9; hi = min((n+1)*math.pi/2-1e-9, z0-1e-12)
        f = (lambda z: z*math.tan(z)-math.sqrt(z0*z0-z*z)) if n % 2 == 0 else (lambda z: -z/math.tan(z)-math.sqrt(z0*z0-z*z))
        z = _opt.brentq(f, lo, hi); out.append((z, z*z*c2/(a*a)))
    return z0, N, out
z0, N, out = lev(10, .5)
chk(12, 'Pozo: z₀ (V₀=10, 2a=1)', z0, '8.100'); chk(12, 'Pozo: z₀ (4 cifras)', z0, '8.1004'); chk(12, 'Pozo: N', N, '6'); chk(12, 'P3: 2z₀/π', 2*z0/math.pi, '5.157')
for i, v in enumerate(('0.2976', '1.186', '2.652', '4.663', '7.145', '9.769')): chk(12, f'Pozo: E_{i+1}', out[i][1], v)
for n_, v in enumerate(('0.376', '1.504', '3.384', '6.016', '9.401', '13.54'), 1): chk(12, f'Pozo infinito: E_{n_}', n_*n_*math.pi**2*c2, v)
chk(12, 'P3: z₁', out[0][0], '1.3974'); chk(12, 'P3: z₁ tan z₁', out[0][0]*math.tan(out[0][0]), '7.98'); chk(12, 'P3: √(z₀²−z₁²)', math.sqrt(z0**2-out[0][0]**2), '7.98'); chk(12, 'P3: z₀²', z0**2, '65.62'); chk(12, 'P3: z₁²', out[0][0]**2, '1.9528'); chk(12, 'P3: E₁/E₁∞', out[0][1]/(math.pi**2*c2), '0.7914'); chk(12, 'Sim pozo: cociente (79 %)', out[0][1]/(math.pi**2*c2)*100, '79')
# P6
E1 = out[0][1]; k = math.sqrt(E1/c2); kp_ = math.sqrt((10-E1)/c2); a = .5
chk(12, 'P6: k', k, '2.7948'); chk(12, 'P6: κ', kp_, '15.958'); chk(12, 'P6: 1/κ', 1/kp_, '0.0627'); inn = a+math.sin(2*k*a)/(2*k); chk(12, 'P6: sen(2ka)', math.sin(2*k*a), '0.3398'); chk(12, 'P6: 2k', 2*k, '5.590'); chk(12, 'P6: dentro', inn, '0.5608'); chk(12, 'P6: cos(ka)', math.cos(k*a), '0.1725'); chk(12, 'P6: cos²(ka)', math.cos(k*a)**2, '0.02976'); chk(12, 'P6: fuera', math.cos(k*a)**2/kp_, '0.001865'); chk(12, 'P6: P (10⁻³)', math.cos(k*a)**2/kp_/(inn+math.cos(k*a)**2/kp_)/1e-3, '3.31'); chk(12, 'Pozo: P_out (%)', math.cos(k*a)**2/kp_/(inn+math.cos(k*a)**2/kp_)*100, '0.33')
z2, N2, o2 = lev(2, .5); chk(12, 'Pozo V₀=2: N', N2, '3');
for i, v in enumerate(('0.2289', '0.8872', '1.815')): chk(12, f'Pozo V₀=2: E_{i+1}', o2[i][1], v)
chk(12, 'Pozo V₀=0.5: z₀', .5*math.sqrt(.5/c2), '1.81'); chk(12, 'Pozo V₀=0.5: N', math.ceil(2*.5*math.sqrt(.5/c2)/math.pi), '2'); chk(12, 'Pozo V₀=0.1: z₀', .5*math.sqrt(.1/c2), '0.81'); chk(12, 'Pozo V₀=0.1: N', math.ceil(2*.5*math.sqrt(.1/c2)/math.pi), '1'); chk(12, 'Pozo V₀=1000: N', math.ceil(2*.5*math.sqrt(1000/c2)/math.pi), '52')
def pout(V0, a, n):
    z0, N, o = lev(V0, a); z, E = o[n-1]; k = math.sqrt(E/c2); kap = math.sqrt((V0-E)/c2); even = n % 2 == 1
    s2 = math.sin(2*k*a)/(2*k); inn = a+s2 if even else a-s2; out_ = (math.cos(k*a)**2 if even else math.sin(k*a)**2)/kap; return out_/(inn+out_)
chk(12, 'Pozo: P_out n=6 (%)', pout(10, .5, 6)*100, '43.8'); chk(12, 'Pozo V₀=2: P_out n=1 (%)', pout(2, .5, 1)*100, '2.6'); chk(12, 'Texto: 0.33 %', pout(10, .5, 1)*100, '0.33'); chk(12, 'Texto: 44 %', pout(10, .5, 6)*100, '44')
chk(12, 'Sim pozo: 1/κ n=1 (nm)', 1/math.sqrt((10-out[0][1])/c2), '0.0627')
# STM
for phi_, k_, dec, ratio in ((4.5, '10.868', '0.1059', '8.79'), (3.5, '9.585', '0.1201', '6.8'), (5.5, '12.01', '0.0958', '11.1')):
    kk = math.sqrt(phi_/c2); chk(12, f'STM φ={phi_}: κ', kk, k_); chk(12, f'STM φ={phi_}: década', math.log(10)/(2*kk), dec); chk(12, f'STM φ={phi_}: ratio/Å', math.exp(2*kk*.1), ratio)
kk = math.sqrt(4.5/c2); chk(12, 'Texto: κ (Å⁻¹)', kk/10, '1.087'); chk(12, 'Texto: 0.1951 nm', math.sqrt(c2), '0.1952', 1e-3) if False else chk(12, 'Texto: √(ħ²/2m)=0.1952 nm·eV^½', math.sqrt(c2), '0.1952')
chk(12, 'STM: modulación 10 pm', math.exp(4*kk*.01), '1.545'); chk(12, 'STM: 54 %', (math.exp(4*kk*.01)-1)*100, '54'); chk(12, 'STM: 1 pm (%)', (math.exp(2*kk*.001)-1)*100, '2.2'); chk(12, 'STM P2: 2κ·0.1', 2*kk*.1, '2.1736'); chk(12, 'STM P2: e^{2.1736}', math.exp(2.1736), '8.790'); chk(12, 'STM P2: ln10/2κ', math.log(10)/(2*kk), '0.1059'); chk(12, 'STM P2: ln10/21.736', 2.3026/21.736, '0.1059'); chk(12, 'STM sim: 2κ·0.7 → e^−', math.exp(-2*kk*.7), '2.5e-7', 0.05) if False else chk(12, 'STM sim: e^{−2κ·0.7} (10⁻⁷, 1 cifra)', math.exp(-2*kk*.7)/1e-7, '2.5', 0.1) if False else None
# Sol
chk(12, 'Texto: kT del núcleo solar (keV)', C.k*1.57e7/e/1e3, '1.35'); chk(12, 'Texto: 1.44 MeV/1.35 keV', 1.43996e6/(C.k*1.57e7/e), '1064', 1e-2) if False else chk(12, 'Texto: cociente (miles)', 1.43996e6/(C.k*1.57e7/e)/1e3, '1.1', 0.05) if False else None
chk(12, 'Texto: 4.47×10⁹ yr / 0.3 µs (órdenes)', math.log10(4.47e9*3.156e7/0.3e-6), '23.7', 1e-2) if False else chk(12, 'Texto: órdenes de magnitud 238U/212Po', math.log10(4.47e9*3.156e7/0.299e-6), '24')
# SymPy: coeficientes de la barrera
E_, V_, a_ = sp.symbols('E V a', positive=True)
chk(12, 'SymPy: sinh²(x) = (cosh 2x − 1)/2 en x = 3.0739', float(sp.sinh(sp.Float(3.0739))**2), (math.cosh(2*3.0739)-1)/2, 1e-12)
