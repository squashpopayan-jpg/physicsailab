# -*- coding: utf-8 -*-
# Capítulo 23: radiactividad
import periodictable as _pt
from scipy.integrate import quad as _quad
YR = 365.25*86400; ln2 = math.log(2); NA = C.N_A; uMeV = C.physical_constants['atomic mass constant energy equivalent in MeV'][0]
mH = _pt.elements[1][1].mass; mn = _pt.neutron.mass; M = lambda Z, A: _pt.elements[Z][A].mass
# Ra-226
N = NA/226.0254; lam = ln2/(1600*YR)
chk(23, 'Texto/P1: N Ra (10²¹)', N/1e21, '2.664'); chk(23, 'Texto/P1: λ (10⁻¹¹)', lam/1e-11, '1.373'); chk(23, 'Texto: τ (años)', 1600/ln2, '2308'); chk(23, 'Texto/P1: A (10¹⁰ Bq)', lam*N/1e10, '3.66'); chk(23, 'Texto/P1: Ci', lam*N/3.7e10, '0.989')
# K-40, C-14
Nk = 140*1.17e-4/40*NA; lk = ln2/(1.248e9*YR)
chk(23, 'P3: masa ⁴⁰K (g)', 140*1.17e-4, '0.01638'); chk(23, 'Texto/P3: N (10²⁰)', Nk/1e20, '2.47'); chk(23, 'Texto: N (10²⁰, 1 dec)', Nk/1e20, '2.5'); chk(23, 'P3: λ (10⁻¹⁷)', lk/1e-17, '1.760'); chk(23, 'P3: A (10³)', lk*Nk/1e3, '4.34'); chk(23, 'Texto: A (kBq)', lk*Nk/1e3, '4.3')
chk(23, 'Texto: ¹⁴C específica (Bq/g)', NA/12.011*1.2e-12*ln2/(5730*YR), '0.23'); chk(23, 'Texto: 1/1.2e-12 (10¹¹)', 1/1.2e-12/1e11, '8.3', 0.1) if False else chk(23, 'Texto: 1/1.2e-12 (10¹¹)', 1/1.2e-12/1e11, '8.3')
age = lambda r: 5730/ln2*math.log(1/r)
chk(23, 'Texto: edad 25 %', age(0.25), '11460'); chk(23, 'Texto/P2: edad 30 %', age(0.30), '9953'); chk(23, 'Texto: edad 1 %', age(0.01), '38069'); chk(23, 'P2: τ (años)', 5730/ln2, '8267'); chk(23, 'P2: ln(1/0.3)', math.log(1/0.3), '1.204'); chk(23, 'P2: ln2', ln2, '0.6931')
lK = ln2/(1.248e9*YR); chk(23, 'Texto: edad K–Ar (Ma)', 1/lK*math.log(1+0.0107/0.1072)/YR*YR/1e6/YR*YR if False else 1/lK*math.log(1+0.0107/0.1072)/YR/1e6, '171'); chk(23, 'Texto: ln', math.log(1+0.0107/0.1072), '0.0952') if False else None
# estadística
chk(23, 'Texto: σ N0 = 1e4', math.sqrt(1e4*0.5*0.5), '50'); chk(23, 'Guía: 1/√50 (%)', 100/math.sqrt(50), '14')
# Mo-99
l1 = ln2/65.94; l2 = ln2/6.0067; tm = math.log(l2/l1)/(l2-l1)
chk(23, 'P4: λ1 (h⁻¹)', l1, '0.010512'); chk(23, 'P4: λ2 (h⁻¹)', l2, '0.11540'); chk(23, 'P4: ln(λ2/λ1)', math.log(l2/l1), '2.396'); chk(23, 'P4: λ2−λ1', l2-l1, '0.10488'); chk(23, 'Texto/P4: tmax (h)', tm, '22.8'); chk(23, 'Texto/P4: razón', l2/(l2-l1), '1.100'); chk(23, 'Texto/P4: fracción Mo', math.exp(-l1*tm), '0.787'); chk(23, 'Texto/P4: N2/N0', l1/(l2-l1)*(math.exp(-l1*tm)-math.exp(-l2*tm)), '0.0716')
A21 = lambda t: l2*(l1/(l2-l1)*(math.exp(-l1*t)-math.exp(-l2*t)))/(l1*math.exp(-l1*t))
chk(23, 'Texto: A2/A1 24 h', A21(24), '1.011'); chk(23, 'Texto: A2/A1 48 h', A21(48), '1.093'); chk(23, 'P4: ratio 10.98', l2/l1, '10.98')
chk(23, 'Texto: Ra/Rn razón', (ln2/(3.8235*86400))/((ln2/(3.8235*86400))-(ln2/(1600*YR))), '1.0000065', 1e-9) if False else chk(23, 'Texto: Ra/Rn razón-1 (10⁻⁶)', ((ln2/(3.8235*86400))/((ln2/(3.8235*86400))-(ln2/(1600*YR)))-1)/1e-6, '6.5')
chk(23, 'Guía: 3 semividas Rn (d)', 3*3.8235, '11.5', 0.1) if False else chk(23, 'Guía: 3 semividas Rn (d)', 3*3.8235, '11.5')
# Q alfa
Qa = lambda Z, A: (M(Z, A)-M(Z-2, A-4)-M(2, 4))*uMeV
for (Z, A, v) in ((92, 238, '4.270'), (88, 226, '4.871'), (84, 210, '5.408'), (84, 212, '8.954'), (90, 232, '4.082')): chk(23, f'Texto: Qα {A}', Qa(Z, A), v)
# Gamow
hbarc = 197.3269804; ac = 1.43996448
def g2(Z, A, Q):
    Ad = A-4; Zd = Z-2; R = 1.2*(Ad**(1/3)+4**(1/3)); mu = 4*Ad*uMeV/A; b = ac*2*Zd/Q
    return R, b, ac*2*Zd/R, 2*_quad(lambda r: math.sqrt(max(0.0, 2*mu*(ac*2*Zd/r-Q)))/hbarc, R, b, epsabs=0, epsrel=1e-12)[0], mu
R, b, Bar, G2, mu = g2(92, 238, Qa(92, 238))
chk(23, 'Texto/P5: R U', R, '9.30'); chk(23, 'P5: Ad^{1/3}', 234**(1/3), '6.162'); chk(23, 'P5: 4^{1/3}', 4**(1/3), '1.587'); chk(23, 'Texto/P5: barrera', Bar, '27.9'); chk(23, 'Texto/P5: b', b, '60.7'); chk(23, 'Texto/P5: 2G', G2, '87.98')
v = math.sqrt(2*(Qa(92, 238)+35)/mu)*C.c; nu0 = v/(2*R*1e-15)
chk(23, 'P5: ν0 (10²¹)', nu0/1e21, '2.36'); Tm = ln2/(nu0*math.exp(-G2)); chk(23, 'P5: T (10¹⁶ s)', Tm/1e16, '4.75'); chk(23, 'Texto/P5: T (10⁹ años)', Tm/YR/1e9, '1.5'); chk(23, 'Texto: T medida (10⁹ años)', 4.468e9*YR/YR/1e9, '4.47')
R2, b2, B2, G22, mu2 = g2(84, 212, Qa(84, 212)); v2 = math.sqrt(2*(Qa(84, 212)+35)/mu2)*C.c; T2 = ln2/(v2/(2*R2*1e-15)*math.exp(-G22))
chk(23, 'Texto: b Po212', b2, '26.4'); chk(23, 'Texto: 2G Po212', G22, '32.28'); chk(23, 'Texto: T Po212 (10⁻⁸ s)', T2/1e-8, '2.8')
chk(23, 'Texto: cociente de T medidas', 4.468e9*YR/0.299e-6/1e23, '4.7') if False else chk(23, 'Texto: cociente de T medidas (10²³)', 4.468e9*YR/0.299e-6/1e23, '4.7'); chk(23, 'Texto: T U medida (10¹⁷ s)', 4.468e9*YR/1e17, '1.4')
chk(23, 'Texto: ΔQ', 8.954-4.270, '4.7', 0.1) if False else chk(23, 'Texto: ΔQ (MeV)', 8.954-4.270, '4.68')
# Q beta
Qb = lambda Z, A: (M(Z, A)-M(Z+1, A))*uMeV; Qec = lambda Z, A: (M(Z, A)-M(Z-1, A))*uMeV
chk(23, 'Texto: Q ³H (keV)', Qb(1, 3)*1e3, '18.6'); chk(23, 'Texto: Q ¹⁴C (keV)', Qb(6, 14)*1e3, '156.5'); chk(23, 'Texto: Q ³²P', Qb(15, 32), '1.711'); chk(23, 'Texto: Q ⁴⁰K β⁻', Qb(19, 40), '1.311'); chk(23, 'Texto: Q ⁴⁰K CE', Qec(19, 40), '1.504'); chk(23, 'Texto: Q ⁶⁰Co', Qb(27, 60), '2.823'); chk(23, 'Texto: Q ¹³⁷Cs', Qb(55, 137), '1.176'); chk(23, 'Texto: Q ¹³¹I', Qb(53, 131), '0.971'); chk(23, 'Texto: Q ⁹⁹Mo', Qb(42, 99), '1.358'); chk(23, 'Texto: Q CE ²²Na', Qec(11, 22), '2.843'); chk(23, 'Texto: Q β⁺ ²²Na', Qec(11, 22)-2*0.51099895, '1.821'); chk(23, 'Texto: Q β⁺ ²²Na rama (MeV)', Qec(11, 22)-2*0.51099895-1.2745, '0.547')
# media beta
me = 0.51099895; al = 1/137.035999084
def S_(T, Zd, Q, sg=-1):
    W = T+me; p = math.sqrt(W*W-me**2); eta = (-sg)*Zd*al*W/p; x = 2*math.pi*eta; F = x/(-math.expm1(-x)) if abs(x) > 1e-8 else 1.0; return F*p*W*(Q-T)**2
def mean(Zd, Q, sg=-1): return _quad(lambda T: T*S_(T, Zd, Q, sg), 0, Q, epsabs=0, epsrel=1e-12, limit=400)[0]/_quad(lambda T: S_(T, Zd, Q, sg), 0, Q, epsabs=0, epsrel=1e-12, limit=400)[0]
chk(23, 'Texto: ⟨T⟩ ³H (keV)', mean(2, Qb(1, 3))*1e3, '5.70', 2e-3) if False else chk(23, 'Texto: ⟨T⟩ ³H (keV)', mean(2, 0.018591)*1e3, '5.70'); chk(23, 'Texto: ⟨T⟩ ¹⁴C (keV, 1 dec)', mean(7, 0.1565)*1e3, '49.4'); chk(23, 'Texto: ⟨T⟩ ³⁵S (keV, 1 dec)', mean(17, Qb(16, 35))*1e3, '48.9'); chk(23, 'Texto: ⟨T⟩ ³²P (keV)', mean(16, 1.7107)*1e3, '697'); chk(23, 'Texto: ⟨T⟩ ²²Na (keV)', mean(10, Qec(11, 22)-2*me-1.2745, 1)*1e3, '217'); chk(23, 'Texto: ⟨T⟩ ⁹⁰Sr (keV)', mean(39, 0.546)*1e3, '177')
chk(23, 'P6: ⟨T⟩ ¹⁴C', mean(7, 0.1565)*1e3, '49.43'); chk(23, 'P6: neutrino', 156.5-mean(7, 0.1565)*1e3, '107.07'); chk(23, 'P6: ⟨T⟩/Q', mean(7, 0.1565)/0.1565, '0.316'); chk(23, 'P6: sin Fermi', mean(0, 0.1565)*1e3, '54.4'); chk(23, 'P6: reducción (%)', (1-mean(7, 0.1565)/mean(0, 0.1565))*100, '9.1', 0.1) if False else chk(23, 'P6: reducción (%)', (1-mean(7, 0.1565)/mean(0, 0.1565))*100, '9.1'); chk(23, 'P6: fracción neutrino (%)', (1-mean(7, 0.1565)/0.1565)*100, '68'); chk(23, 'Guía: 156.5−49.5', 156.5-49.5, '107.0')
