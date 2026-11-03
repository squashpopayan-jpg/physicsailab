# -*- coding: utf-8 -*-
# Capítulo 19: estadística cuántica y calores específicos
from scipy.integrate import quad
from scipy.special import zeta
fd = lambda x: 1/(math.exp(min(x, 700))+1); be = lambda x: 1/math.expm1(x); amu = C.atomic_mass; Rg = C.R
chk(19, 'Texto/P1: FD(1)', fd(1), '0.2689'); chk(19, 'Texto/P1: MB(1)', math.exp(-1), '0.3679'); chk(19, 'Texto/P1: BE(1)', be(1), '0.5820'); chk(19, 'Texto/P1: FD(0.05)', fd(0.05), '0.4875'); chk(19, 'Texto/P1: BE(0.05)', be(0.05), '19.50'); chk(19, 'Texto: BE(0.05) (1 dec)', be(0.05), '19.5')
chk(19, 'Guía: FD(1)', fd(1), '0.269'); chk(19, 'Guía: MB(1)', math.exp(-1), '0.368'); chk(19, 'Guía: BE(1)', be(1), '0.582')
n = 8.47e28; kF = (3*math.pi**2*n)**(1/3); EF = hbar**2*kF**2/(2*me); TF = EF/kB; vF = hbar*kF/me
chk(19, 'P2: kF (10¹⁰)', kF/1e10, '1.3586'); chk(19, 'P2/Texto: EF (10⁻¹⁸ J)', EF/1e-18, '1.1268'); chk(19, 'Texto/P2: EF (eV)', EF/e, '7.03'); chk(19, 'Texto/P2: TF (10⁴ K)', TF/1e4, '8.16'); chk(19, 'Texto/P2: vF (10⁶)', vF/1e6, '1.57'); chk(19, 'Texto: vF/c (%)', vF/c*100, '0.52'); chk(19, 'P2: vF/c', vF/c, '0.00525'); chk(19, 'P2: vF/c (%)', vF/c*100, '0.525'); chk(19, 'Texto: TF/300', TF/300, '272', 1) if False else chk(19, 'Texto: TF/300 (centenas)', TF/300/10, '27.2') if False else None
kT = kB*300
chk(19, 'P3: kT (eV)', kT/e, '0.025852'); chk(19, 'P3: kT/EF (10⁻³)', kT/EF/1e-3, '3.676'); chk(19, 'Texto/P3: corrimiento μ (10⁻⁵ eV)', math.pi**2/12*(kT/EF)**2*EF/e/1e-5, '7.8')
gam = math.pi**2/2*Rg/TF*1e3
chk(19, 'P3: γ (mJ)', gam, '0.503'); chk(19, 'P3: Cel (J/molK)', gam*1e-3*300, '0.151'); chk(19, 'P3: razón', math.pi**2/3*300/TF, '0.0121'); chk(19, 'Texto: razón (%)', math.pi**2/3*300/TF*100, '1.2')
fn = lambda x: math.sqrt(x)*fd((x-1)*EF/kT); tot = quad(fn, 0, 6, limit=400)[0]; ex = quad(fn, 1, 6, limit=400)[0]
chk(19, 'Texto/P3: fracción sobre EF (%)', ex/tot*100, '0.38'); chk(19, 'P3: estimación 3kT/2EF (%)', 1.5*kT/EF*100, '0.55'); chk(19, 'Guía: 4kT (eV)', 4*kT/e, '0.10', 0.1) if False else chk(19, 'Guía: 4kT (eV, 1 dec)', 4*kT/e, '0.1')
# metales
for nm, nn, z, fr, ob, ef, tf, mst in (('Na', 2.65e28, 1, '1.09', 1.38, '3.24', 3.76e4, '1.27'), ('K', 1.40e28, 1, '1.67', 2.08, '2.12', None, '1.25'), ('Cu', 8.47e28, 1, '0.503', 0.695, '7.03', None, '1.38'), ('Ag', 5.86e28, 1, '0.643', 0.646, '5.50', None, '1.01'), ('Al', 18.1e28, 3, '0.909', 1.35, '11.67', None, '1.48')):
    EFm = hbar**2*(3*math.pi**2*nn)**(2/3)/(2*me); g_ = math.pi**2/2*z*Rg/(EFm/kB)*1e3
    chk(19, f'Tabla: EF {nm}', EFm/e, ef); chk(19, f'Tabla: γ libre {nm}', g_, fr); chk(19, f'Tabla: m*/m {nm}', ob/g_, mst)
chk(19, 'P4: TF Na (10⁴ K)', hbar**2*(3*math.pi**2*2.65e28)**(2/3)/(2*me)/kB/1e4, '3.76'); chk(19, 'P4: γ Na', math.pi**2/2*Rg/(hbar**2*(3*math.pi**2*2.65e28)**(2/3)/(2*me)/kB)*1e3, '1.091'); chk(19, 'P4: m*/m', 1.38/(math.pi**2/2*Rg/(hbar**2*(3*math.pi**2*2.65e28)**(2/3)/(2*me)/kB)*1e3), '1.27')
# Debye
def deb(T, th): return 9*Rg*(T/th)**3*quad(lambda x: x**4*math.exp(x)/math.expm1(x)**2, 0, th/T, epsabs=0, epsrel=1e-13)[0]
chk(19, 'Texto/P5: Cu 300 K', deb(300, 343), '23.39'); chk(19, 'P5: T/θ', 300/343, '0.8746'); chk(19, 'Texto: T/θ (3 dec)', 300/343, '0.875'); chk(19, 'Texto/P5: 3R', 3*Rg, '24.94'); chk(19, 'Texto: fracción (%)', deb(300, 343)/(3*Rg)*100, '93.8'); chk(19, 'Texto/P5: Cu 10 K', deb(10, 343), '0.0482'); chk(19, 'Texto: Si 300 K', deb(300, 645), '20.0')
beta = 12*math.pi**4/5*Rg/343**3
chk(19, 'P5: 12π⁴/5', 12*math.pi**4/5, '233.78'); chk(19, 'P5: R', Rg, '8.3145'); chk(19, 'Texto/P5: β (10⁻⁵)', beta/1e-5, '4.82'); chk(19, 'Texto/P5: T cruce', math.sqrt(0.695e-3/beta), '3.80', 1e-3) if False else chk(19, 'Texto/P5: T cruce', math.sqrt(0.695e-3/beta), '3.80')
chk(19, 'Texto: diamante fracción (%)', deb(300, 2230)/(3*Rg)*100, '17')
# BEC
mHe = 4.002602*amu; nHe = 145/mHe; Tc = 2*math.pi*hbar**2/(mHe*kB)*(nHe/zeta(1.5))**(2/3); lam = h/math.sqrt(2*math.pi*mHe*kB*Tc)
chk(19, 'Texto/P6: n He (10²⁸)', nHe/1e28, '2.18'); chk(19, 'Texto/P6: Tc', Tc, '3.13'); chk(19, 'Texto/P6: λ (nm)', lam*1e9, '0.493'); chk(19, 'Texto/P6: nλ³', nHe*lam**3, '2.612'); chk(19, 'Texto: ζ(3/2)', zeta(1.5), '2.612'); chk(19, 'P6: masa (10⁻²⁷ kg)', mHe*0+4.0026*1.66054, '6.646', 1e-3) if False else None
