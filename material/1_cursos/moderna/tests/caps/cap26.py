# -*- coding: utf-8 -*-
# Capítulo 26: aceleradores
from scipy.integrate import quad as _q5, dblquad as _dq5
mp = 0.93827208816; me_ = 0.00051099895; al = 1/137.035999084
sync = lambda E, m, rho: (e**2/(3*C.epsilon_0))*math.sqrt(1-(m/E)**2)**3*(E/m)**4/rho/e/1e9
chk(26, 'Texto/P1: p LHC', 0.299792458*8.33*2803.95, '7002', 0.5) if False else chk(26, 'Texto/P1: p LHC (GeV, entero)', 0.299792458*8.33*2803.95, '7002'); chk(26, 'Texto/P1: f (Hz)', c/26658.883, '11245.5'); chk(26, 'P1: f (1 dec)', c/26658.883, '11245.5')
chk(26, 'Texto: f ciclotrón (MHz)', e*1.5/(2*math.pi*C.m_p)/1e6, '22.87'); chk(26, 'Texto: periodo (ns)', 2*math.pi*C.m_p/(e*1.5)*1e9, '43.7'); chk(26, 'Texto: p ciclotrón', 0.299792458*1.5*0.5, '0.2248'); chk(26, 'Texto: T ciclotrón (MeV)', (math.sqrt((0.299792458*1.5*0.5)**2+mp**2)-mp)*1e3, '26.6'); chk(26, 'Texto: periodo γ=1.5 (ns)', 2*math.pi*1.5*C.m_p/(e*1.5)*1e9, '65.6'); chk(26, 'Texto: periodo γ=3 (ns)', 2*math.pi*3*C.m_p/(e*1.5)*1e9, '131')
chk(26, 'Texto: (me/mp)^4 (10⁻¹⁴)', (me_/mp)**4/1e-14, '8.8'); chk(26, 'Texto: LEP 100 GeV', sync(100, me_, 3026), '2.92'); chk(26, 'Texto/P2: LEP 104.5', sync(104.5, me_, 3026), '3.49'); chk(26, 'Texto/P2: p 7 TeV (keV)', sync(7000, mp, 2803.95)*1e6, '6.66'); chk(26, 'P2: γ protón', 7000/mp, '7460', 0.5) if False else chk(26, 'P2: γ protón (entero)', 7000/mp, '7461'); chk(26, 'P2: γ electrón (10⁵)', 104.5/me_/1e5, '2.045'); chk(26, 'Texto: LEP fracción (%)', 3.486/104.5*100, '3.3'); chk(26, 'Texto: fracción p', 6.664e-6/7000, '1e-9', 1e-3) if False else chk(26, 'Texto: fracción p (10⁻¹⁰)', 6.664e-6/7000/1e-10, '9.5')
chk(26, 'Texto: potencia LHC (kW)', sync(7000, mp, 2803.95)*1e9*e*11245.5*3.2e14/1e3, '3.8')
chk(26, 'Guía: p 6.8 TeV (keV)', sync(6800, mp, 2803.95)*1e6, '5.9'); chk(26, 'Guía: B para 6.8 TeV', 6800/(0.299792458*2803.95), '8.09'); chk(26, 'Guía: B LEP', 104.5/(0.299792458*3026), '0.115')
# cinemática
chk(26, 'Texto/P3: E blanco fijo (10⁷)', (13600**2-2*0.938272**2)/(2*0.938272)/1e7, '9.86'); chk(26, 'Texto: 98.6 PeV', (13600**2-2*0.938272**2)/(2*0.938272)/1e6, '98.6'); chk(26, 'Texto/P3: T umbral', 6*0.938272, '5.63'); chk(26, 'P3: E umbral=7m', 7*0.938272-0.938272, '5.63')
# luminosidad
Lum = 1.15e11**2*11245.5*2808/(4*math.pi*(16.6e-4)**2)
chk(26, 'Texto/P4: L (10³⁴)', Lum/1e34, '1.2'); chk(26, 'P4: N² (10²²)', 1.15e11**2/1e22, '1.3225', 1e-4) if False else chk(26, 'P4: N² (10²²)', 1.15e11**2/1e22, '1.3225'); chk(26, 'P4: f nb (10⁷)', 11245.5*2808/1e7, '3.158'); chk(26, 'P4: 4πσ² (10⁻⁵ cm²)', 4*math.pi*(16.6e-4)**2/1e-5, '3.463'); chk(26, 'P4: L (4 dec)', Lum/1e34, '1.206'); chk(26, 'Texto: Higgs/s', 55e-36*2e34, '1.1'); chk(26, 'Texto: Higgs/año (10⁷)', 55e-36*2e34*1e7/1e7, '1.1')
# Bethe
def bethe(T, Mp, ZA, I_eV, z=1):
    m = 0.51099895; g = 1+T/Mp; b2 = 1-1/g**2; bg2 = g*g-1; Tmax = 2*m*bg2/(1+2*g*m/Mp+(m/Mp)**2); I = I_eV*1e-6
    return 0.307075*z*z*ZA/b2*(0.5*math.log(2*m*bg2*Tmax/I**2)-b2)
rng = lambda T: _q5(lambda t: 1/bethe(t, 938.272, 0.5551, 75), 0.5, T, epsabs=0, epsrel=1e-12)[0]
chk(26, 'Texto/P5: S 100 MeV', bethe(100, 938.272, 0.5551, 75), '7.291')
for T, v in ((10, '0.121'), (50, '2.221'), (100, '7.710'), (150, '15.77'), (200, '25.95')): chk(26, f'Texto: R {T} MeV', rng(T), v)
chk(26, 'P5: R 100 MeV (2 dec)', rng(100), '7.71'); chk(26, 'Texto: S a 1 MeV', bethe(1, 938.272, 0.5551, 75), '270', 0.5) if False else chk(26, 'Texto: S a 1 MeV', bethe(1, 938.272, 0.5551, 75), '270'); chk(26, 'Texto: S(1)/S(100)', bethe(1, 938.272, 0.5551, 75)/bethe(100, 938.272, 0.5551, 75), '37')
from scipy.optimize import brentq as _bq5
T1 = _bq5(lambda T: rng(T)-1, 0.6, 100); chk(26, 'Texto/P5: T a 1 cm', T1, '32.2'); chk(26, 'Texto: fracción último cm (%)', T1, '32', 0.5) if False else chk(26, 'Texto: fracción último cm (%)', T1/100*100, '32')
def mi(ZA, I):
    best = 1e9
    for bg in np.arange(2, 6, 0.01):
        g = math.sqrt(1+bg*bg); v = bethe((g-1)*105.6583755, 105.6583755, ZA, I); best = min(best, v)
    return best
for nm, ZA, I, v in (('agua', 0.5551, 75, '2.04'), ('Si', 0.4985, 173, '1.69'), ('Fe', 0.4656, 286, '1.50'), ('Cu', 0.4564, 322, '1.46'), ('Pb', 0.3959, 823, '1.14'), ('Al', 0.4818, 166, '1.64')): chk(26, f'Texto: mínimo {nm}', mi(ZA, I), v)
# e+e-
sg = lambda rs: 4*math.pi*al**2/(3*rs**2)*0.3893793721e6
chk(26, 'Texto: 86.8 nb GeV²', 4*math.pi*al**2/3*0.3893793721e6, '86.9'); chk(26, 'Texto/P6: σ 10 GeV', sg(10), '0.869'); chk(26, 'Texto: σ 3 GeV', sg(3), '9.65'); chk(26, 'Texto: σ 30 GeV', sg(30), '0.0965'); chk(26, 'P6: 4πα²/3s (10⁻⁶ GeV⁻²)', 4*math.pi*al**2/(300)/1e-6, '2.23')
chk(26, 'Texto/P6: R uds', 3*(4/9+1/9+1/9), '2'); chk(26, 'Texto/P6: R c', 3*(4/9+1/9+1/9+4/9), '3.3333333333333335', 1) if False else chk(26, 'Texto/P6: R c (3 dec)', 3*(4/9+1/9+1/9+4/9), '3.333'); chk(26, 'Texto: R b', 3*(4/9+1/9+1/9+4/9+1/9), '3.667')
ms = [(0.000511, 1, 1), (0.1057, 1, 1), (1.777, 1, 1), (0.3, 3, 4/9), (0.3, 3, 1/9), (0.5, 3, 1/9), (1.5, 3, 4/9), (4.5, 3, 1/9)]
def inv(Q): return 1/al-sum(Nc*q2/(3*math.pi)*math.log(Q*Q/(m*m)) for m, Nc, q2 in ms if Q > m)
chk(26, 'Texto: 1/α(1 GeV)', inv(1.0), '134.5'); chk(26, 'Texto/P6: 1/α(MZ)', inv(91.1876), '128.4'); chk(26, 'Texto: α(MZ)/α(0)', 137.035999084/inv(91.1876), '1.067')
