# -*- coding: utf-8 -*-
# Capítulo 24: reacciones
import periodictable as _pt
from scipy.optimize import brentq as _bq, fsolve as _fs
uMeV = C.physical_constants['atomic mass constant energy equivalent in MeV'][0]; mn = _pt.neutron.mass; M = lambda Z, A: _pt.elements[Z][A].mass
mm = lambda x: mn if x == 'n' else M(*x)
Q = lambda a, b: (sum(mm(x) for x in a)-sum(mm(x) for x in b))*uMeV
chk(24, 'Tabla/P1: Q DT', Q([(1, 2), (1, 3)], [(2, 4), 'n']), '17.589'); chk(24, 'Tabla: Q DD→Tp', Q([(1, 2), (1, 2)], [(1, 3), (1, 1)]), '4.033'); chk(24, 'Tabla: Q DD→He3 n', Q([(1, 2), (1, 2)], [(2, 3), 'n']), '3.269'); chk(24, 'Tabla: Q D He3', Q([(1, 2), (2, 3)], [(2, 4), (1, 1)]), '18.353'); chk(24, 'Tabla: Q p Li7', Q([(1, 1), (3, 7)], [(2, 4), (2, 4)]), '17.346'); chk(24, 'Tabla: Q α Be9', Q([(2, 4), (4, 9)], ['n', (6, 12)]), '5.702'); chk(24, 'Tabla: Q Rutherford', Q([(2, 4), (7, 14)], [(1, 1), (8, 17)]), '-1.192'); chk(24, 'Tabla: Q 4p', Q([(1, 1)]*4, [(2, 4)]), '26.731')
chk(24, 'P1: Q (4 dec masa)', (2.0141018+3.0160493-4.0026033-1.0086649)*uMeV, '17.59'); chk(24, 'P1: defecto (u)', 2.0141018+3.0160493-4.0026033-1.0086649, '0.0188829')
chk(24, 'P2: umbral', -Q([(2, 4), (7, 14)], [(1, 1), (8, 17)])*(4.0026+14.0031)/14.0031, '1.533'); chk(24, 'P2: 18.0057', 4.0026+14.0031, '18.0057'); chk(24, 'Texto: α de Po (MeV)', 5.3, '5.3')
mnM = 939.56542052; ma = 3727.3794066; mp_ = 938.27208816
def kin(m1, m2, E):
    p = _fs(lambda p: [math.sqrt(p[0]**2+m1**2)+math.sqrt(p[0]**2+m2**2)-E], [100.0])[0]; return math.sqrt(p**2+m1**2)-m1, math.sqrt(p**2+m2**2)-m2
t1 = kin(mnM, ma, mnM+ma+17.589); chk(24, 'Texto/P1: Tn', t1[0], '14.03'); chk(24, 'Texto/P1: Tα', t1[1], '3.56')
t2 = kin(mp_, ma, mp_+ma+18.354); chk(24, 'Texto: Tp D He3', t2[0], '14.64'); chk(24, 'Texto: Tα D He3', t2[1], '3.71'); chk(24, 'Texto: α p Li7', kin(ma, ma, 2*ma+17.346)[0], '8.67')
chk(24, 'P1: E/kg DT (10¹⁴)', 17.589*1.602176634e-13/(5.0301*1.66053907e-27)/1e14, '3.37'); chk(24, 'Texto: E/kg U (10¹³)', 200*1.602176634e-13/(235.0439*1.66053907e-27)/1e13, '8.2'); chk(24, 'Texto: cociente', (17.589/5.0301)/(200/235.0439), '4.1') if False else chk(24, 'Texto: cociente DT/U', (17.589/5.0301)/(200/235.0439), '4.1'); chk(24, 'Texto: DT/petróleo (millones)', 3.37e14/4.2e7/1e6, '8.0'); chk(24, 'Texto: U/petróleo (t)', 8.2e13/4.2e10, '1950', 0.5) if False else chk(24, 'Texto: U/petróleo (t, centenas)', 8.2e13/4.2e10/100, '20')
# Gamow
al = 1/137.035999084
def gam(m1, m2, kT, Z1=1, Z2=1):
    mu = m1*m2/(m1+m2); EG = 2*mu*(math.pi*al*Z1*Z2)**2; E0 = (EG*kT**2/4)**(1/3); return mu, EG, E0, 4*math.sqrt(E0*kT/3)
mu, EG, E0, D = gam(938.27208816, 938.27208816, 1.29e-3)
chk(24, 'P3: μc² (MeV)', mu, '469.14'); chk(24, 'Texto/P3: EG pp (keV)', EG*1e3, '493.1'); chk(24, 'Texto: BG pp', math.sqrt(EG*1e3), '22.2'); chk(24, 'P3: πα', math.pi*al, '0.022925'); chk(24, 'Texto/P3: E0 pp (keV)', E0*1e3, '5.90'); chk(24, 'P3: (…)^{1/3}', (EG*1e3*1.29**2/4)**(1/3), '5.90'); chk(24, 'Texto: E0/kT', E0/1.29e-3, '4.6'); chk(24, 'Texto: E0/EG (%)', E0/EG*100, '1.2'); chk(24, 'Texto/P3: Δ pp (keV)', D*1e3, '6.4'); chk(24, 'P3: Δ (2 dec)', D*1e3, '6.37'); chk(24, 'P3: E0/barrera (%)', E0*1e3/1440*100, '0.4'); chk(24, 'P3: 205.15', EG*1e3*1.29**2/4, '205.15'); chk(24, 'Texto: kT Sol (keV)', 8.617333262e-8*1.5e7, '1.29')
mu, EG, E0, D = gam(1875.612928, 2808.921136, 0.020); chk(24, 'Texto: EG DT (keV)', EG*1e3, '1182.2'); chk(24, 'Texto: BG DT', math.sqrt(EG*1e3), '34.38'); chk(24, 'Texto: E0 DT', E0*1e3, '49.1'); chk(24, 'Texto: Δ DT', D*1e3, '72'); chk(24, 'Guía: E0/kT DT', E0/0.020, '2.5'); chk(24, 'Guía: T DT (10⁸ K)', 0.020/8.617333262e-11/1e8, '2.3')
chk(24, 'Texto: EG DD', gam(1875.612928, 1875.612928, 0.020)[1]*1e3, '985.8'); chk(24, 'Texto: EG pB', gam(938.272, 10252.55, 0.1, 1, 5)[1], '22.6'); chk(24, 'Texto: E0 pB', gam(938.272, 10252.55, 0.1, 1, 5)[2]*1e3, '384')
# Sol
Lsun = 3.828e26; Qeff = 26.731-0.52; rate = Lsun/(Qeff*1.602176634e-13)
chk(24, 'P4: Qeff (MeV)', 26.731-0.52, '26.211'); chk(24, 'P4: Qeff (J, 10⁻¹²)', Qeff*1.602176634e-13/1e-12, '4.199'); chk(24, 'Texto/P4: ciclos (10³⁷)', rate/1e37, '9.1'); chk(24, 'Texto/P4: masa (10¹¹ kg/s)', rate*4*1.00727646688*1.66053907e-27/1e11, '6.1'); chk(24, 'Texto: Mt/s', rate*4*1.00727646688*1.66053907e-27/1e9, '610', 0.01) if False else chk(24, 'Texto: millones de toneladas', rate*4*1.00727646688*1.66053907e-27/1e9, '610'); chk(24, 'Texto/P4: flujo ν (10¹⁰ cm⁻²s⁻¹)', rate*2/(4*math.pi*(1.495978707e11)**2)*1e-4/1e10, '6.5'); chk(24, 'P4: flujo (10¹⁴ m⁻²s⁻¹)', rate*2/(4*math.pi*(1.496e11)**2)/1e14, '6.5')
# fisión
aS, aC = 18.177195910190814, 0.716749869979648
chk(24, 'Texto/P5: ES', aS*236**(2/3), '694.2'); chk(24, 'Texto/P5: EC', aC*92*91/236**(1/3), '971.0'); chk(24, 'Texto/P5: x', aC*92*91/236**(1/3)/(2*aS*236**(2/3)), '0.699'); chk(24, 'Texto: Z²/A', 92**2/236, '35.9'); chk(24, 'Texto: crítico', 2*aS/aC, '50.7'); chk(24, 'P5: 236^{2/3}', 236**(2/3), '38.19'); chk(24, 'P5: 236^{1/3}', 236**(1/3), '6.180'); chk(24, 'Texto: x Pu240', aC*94*93/240**(1/3)/(2*aS*240**(2/3)), '0.718'); chk(24, 'Texto: x Pb208', aC*82*81/208**(1/3)/(2*aS*208**(2/3)), '0.63'); chk(24, 'Texto: x Fe56', aC*26*25/56**(1/3)/(2*aS*56**(2/3)), '0.23'); chk(24, 'P5/Texto: ΔB/A × 236', 0.9*236, '212')
# cadena
for k, v in ((1.05, '0.906'), (1.1, '0.824'), (1.5, '0.417'), (2.0, '0.203'), (2.43, '0.117')): chk(24, f'Texto: q (k = {k})', _bq(lambda q: q-math.exp(k*(q-1)), 0, 1-1e-9), v)
chk(24, 'Texto: 1−q (1.05, %)', (1-_bq(lambda q: q-math.exp(1.05*(q-1)), 0, 1-1e-9))*100, '9.4'); chk(24, 'Texto: 1−q (2.43)', 1-_bq(lambda q: q-math.exp(2.43*(q-1)), 0, 1-1e-9), '0.883'); chk(24, 'P6/Texto: 1−q (1.1)', 1-_bq(lambda q: q-math.exp(1.1*(q-1)), 0, 1-1e-9), '0.176'); chk(24, 'Guía: q⁵', _bq(lambda q: q-math.exp(1.1*(q-1)), 0, 1-1e-9)**5, '0.38'); chk(24, 'Texto: e^{10}', math.exp(1e4*math.log(1.001)), '22000', 1) if False else chk(24, 'Texto: ln(1.001)·10⁴', 1e4*math.log(1.001), '10.0', 0.1) if False else chk(24, 'Texto: ln(1.001)·10⁴', 1e4*math.log(1.001), '10.0')
# reactor
inh = lambda rho: _bq(lambda w: 1e-4*w+0.0065*w/(w+0.08)-rho, 1e-9, 1e6) if rho > 0 else _bq(lambda w: 1e-4*w+0.0065*w/(w+0.08)-rho, -0.08+1e-9, -1e-12)
chk(24, 'Texto: T ρ=0.001', 1/inh(0.001), '68.9'); chk(24, 'Texto/P6: T ρ=0.003', 1/inh(0.003), '14.6'); chk(24, 'Texto: T ρ=0.005', 1/inh(0.005), '3.84'); chk(24, 'Texto: T ρ=β', 1/inh(0.0065), '0.45'); chk(24, 'Texto/P6: T ρ=0.0075 (ms)', 1/inh(0.0075)*1e3, '95'); chk(24, 'Texto: T ρ=−0.002', -1/inh(-0.002), '53'); chk(24, 'P6: ω 0.003', inh(0.003), '0.0683'); chk(24, 'P6: ω 0.0075', inh(0.0075), '10.49'); chk(24, 'Texto: ρ/β 0.001 ($)', 0.001/0.0065, '0.15'); chk(24, 'Texto: ρ/β 0.003', 0.003/0.0065, '0.46'); chk(24, 'Texto: ρ/β 0.0075', 0.0075/0.0065, '1.15'); chk(24, 'Guía: ×20 s', math.exp(inh(0.001)*20), '1.3')
