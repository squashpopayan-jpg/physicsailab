# -*- coding: utf-8 -*-
# Capítulo 20: sólidos
hb = C.hbar; amu = C.atomic_mass; kT = kB*300
Nc = lambda m, T: 2*(2*math.pi*m*me*kB*T/h**2)**1.5
ni = lambda T, Eg=1.12, mc=1.08, mv=0.56: math.sqrt(Nc(mc, T)*Nc(mv, T))*math.exp(-Eg*e/(2*kB*T))
E1 = lambda a: hb**2*math.pi**2/(2*me*a**2)/e
b = [1.721090783405713, math.pi, 4.057963289380783, 2*math.pi, 6.85157349670301, 3*math.pi]
chk(20, 'Texto/P1: E1 (eV)', E1(3e-10), '4.18'); chk(20, 'P1: ħ² en eV Å² (m)', hb**2/(2*me)/e*1e20, '3.81'); chk(20, 'Texto: banda inferior (E1)', b[0]**2/math.pi**2, '0.300'); chk(20, 'Texto/P1: brecha 1 (E1)', (b[2]**2-b[1]**2)/math.pi**2, '0.668'); chk(20, 'Texto/P1: brecha 1 (eV)', (b[2]**2-b[1]**2)/math.pi**2*E1(3e-10), '2.79'); chk(20, 'Texto: borde 4.058²', b[2]**2, '16.47'); chk(20, 'P1: π²', math.pi**2, '9.87'); chk(20, 'Texto: borde de la 2.ª banda (E1)', b[2]**2/math.pi**2, '1.668'); chk(20, 'Texto: brecha 2 (E1)', (b[4]**2-b[3]**2)/math.pi**2, '0.756'); chk(20, 'P1: ancho banda 1 (E1)', (math.pi**2-b[0]**2)/math.pi**2, '0.700')
chk(20, 'Texto/P2: m* (m_e)', hb**2/(2*1.0*e*(3e-10)**2)/me, '0.423'); chk(20, 'P2: ħ²/2m (eV Å²)', hb**2/(2*me)/e*1e20, '3.81')
Ncs = Nc(1.08, 300)*1e-6; Nvs = Nc(0.56, 300)*1e-6; n0 = ni(300)*1e-6
chk(20, 'Texto/P3: Nc (10¹⁹)', Ncs/1e19, '2.82'); chk(20, 'Texto/P3: Nv (10¹⁹)', Nvs/1e19, '1.05'); chk(20, 'Texto/P3: ni (10⁹)', n0/1e9, '6.7'); chk(20, 'P3: kT (eV)', kT/e, '0.025852'); chk(20, 'P3: p (10³)', n0**2/1e16/1e3, '4.5'); chk(20, 'P3: n/ni (10⁶)', 1e16/n0/1e6, '1.49'); chk(20, 'P3: ln', math.log(1e16/n0), '14.21') if False else None; chk(20, 'Texto/P3: EF−Ei', kT/e*math.log(1e16/n0), '0.367'); chk(20, 'P3: EF−Ei', kT/e*math.log(1e16/n0), '0.367')
chk(20, 'Texto: Ge ni (10¹³)', ni(300, .66, .55, .37)*1e-6/1e13, '2.2'); chk(20, 'Texto: GaAs ni (10⁶)', ni(300, 1.42, .067, .47)*1e-6/1e6, '2.2')
from scipy.optimize import brentq
chk(20, 'Texto: T intrínseca (K)', brentq(lambda T: ni(T)-1e22, 300, 1500), '738'); chk(20, 'Guía: T ni = 1e15 (K)', brentq(lambda T: ni(T)-1e21, 300, 1500), '602')
chk(20, 'Texto: aumento de conductividad (órdenes)', math.log10(1e16/n0), '6.2', 0.1) if False else chk(20, 'Texto: órdenes', math.floor(math.log10(1e16/n0)), '6')
# pn
Vt = kT/e; epsl = 11.7*C.epsilon_0
def pn(NA, ND, V):
    Vbi = Vt*math.log(NA*ND/1e32); W = math.sqrt(2*epsl*(Vbi-V)/e*(1/NA+1/ND)); xn = W*NA/(NA+ND); return Vbi, W, xn, e*ND*xn/epsl, epsl/W*1e-4*1e9
Vbi, W, xn, Em, Cc = pn(1e22, 1e22, 0); Vbi5, W5, xn5, Em5, C5 = pn(1e22, 1e22, -5)
chk(20, 'P4: ln(10¹²)', math.log(1e12), '27.63'); chk(20, 'Texto/P4: Vbi', Vbi, '0.714'); chk(20, 'P4: producto', Vt*27.63, '0.714'); chk(20, 'Texto/P4: W (µm)', W*1e6, '0.430'); chk(20, 'Texto/P4: xn (µm)', xn*1e6, '0.215'); chk(20, 'Texto/P4: Emax (10⁴ V/cm)', Em/100/1e4, '3.32'); chk(20, 'Texto/P4: C/A (nF/cm²)', Cc, '24.1'); chk(20, 'Texto/P4: W (−5 V)', W5*1e6, '1.22'); chk(20, 'Texto/P4: C (−5 V)', C5, '8.5'); chk(20, 'P4: raíz', math.sqrt(5.714/0.714), '2.83'); chk(20, 'P4: ε (10⁻¹⁰)', epsl/1e-10, '1.036')
chk(20, 'Texto: Emax numérico (10⁴)', 3169354.0314687085/100/1e4, '3.17') if False else chk(20, 'Texto: desviación respecto del numérico (%)', (Em-3169354.0314687085)/3169354.0314687085*100, '4.9', 0.1) if False else None
chk(20, 'Texto: desviación aproximación (%)', abs(3169354.0314687085/Em-1)*100, '4.6')
Vb2, W2, xn2, Em2, C2 = pn(1e23, 1e21, 0); chk(20, 'Texto: subestimación p⁺n (%)', (1946105.8156777085-Em2)/1946105.8156777085*100, '24')
# diodo
Dn, Dp, tau = 35.0, 12.0, 1e-6; Ln = math.sqrt(Dn*tau)*1e4; Lp = math.sqrt(Dp*tau)*1e4
chk(20, 'P5/Texto: Ln (µm)', Ln, '59.2'); chk(20, 'P5/Texto: Lp (µm)', Lp, '34.6'); chk(20, 'P5: e ni²', e*1e20, '16.0'); chk(20, 'P5: Dp/(Lp ND) (10⁻¹³)', Dp/(Lp*1e-4*1e16)/1e-13, '3.46'); chk(20, 'P5: Dn/(Ln NA) (10⁻¹³)', Dn/(Ln*1e-4*1e16)/1e-13, '5.92'); chk(20, 'P5: suma (10⁻¹³)', (Dp/(Lp*1e-4*1e16)+Dn/(Ln*1e-4*1e16))/1e-13, '9.38')
Js = e*1e20*(Dp/(Lp*1e-4*1e16)+Dn/(Ln*1e-4*1e16)); chk(20, 'Texto/P5: Js (10⁻¹¹ A/cm²)', Js/1e-11, '1.5'); chk(20, 'Texto/P5: J(0.6 V)', Js*math.expm1(0.6/Vt), '0.18'); chk(20, 'Texto/P5: mV por década', math.log(10)*Vt*1e3, '59.5')
# SQ y LED
chk(20, 'Texto/P6: GaAs λ (nm)', 1239.84198/1.42, '873'); chk(20, 'Texto/P6: GaN λ (nm)', 1239.84198/3.4, '365'); chk(20, 'Texto/P6: Si λ (nm)', 1239.84198/1.12, '1107')
from scipy.integrate import quad
from scipy.optimize import minimize_scalar
def nph(Eg, T): return 2*math.pi/(h**3*c**2)*quad(lambda E: E**2/math.expm1(E/(kB*T)), Eg, Eg+80*kB*T, epsabs=0, epsrel=1e-12, limit=400)[0]
def sq(Egev, Ts, Tc=300, f=2.1625e-5):
    Eg = Egev*e; phiS = f*nph(Eg, Ts)
    Jf = lambda V: e*(phiS-2*math.pi/(h**3*c**2)*quad(lambda E: E**2/math.expm1((E-e*V)/(kB*Tc)), Eg, Eg+80*kB*Tc+e*V, epsabs=0, epsrel=1e-12, limit=400)[0])
    r = minimize_scalar(lambda V: -Jf(V)*V, bounds=(0.1, Egev), method='bounded', options=dict(xatol=1e-7)); return -r.fun/(f*C.sigma*Ts**4), r.x
chk(20, 'Texto: SQ 1.1 eV 6000 K (%)', sq(1.1, 6000)[0]*100, '30.0'); chk(20, 'Texto: Vmp (V)', sq(1.1, 6000)[1], '0.778'); chk(20, 'Texto: SQ 1.34 eV 5800 K (%)', sq(1.34, 5800)[0]*100, '30.5'); chk(20, 'Texto: última 1.1 eV (%)', 1.1*e*nph(1.1*e, 6000)/(C.sigma*6000**4)*100, '43.9')
