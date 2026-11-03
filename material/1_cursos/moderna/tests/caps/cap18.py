# -*- coding: utf-8 -*-
# Capítulo 18: moléculas
import periodictable as pt
amu = C.atomic_mass; hcm = h*c*100; HA = C.physical_constants['Hartree energy in eV'][0]
S = lambda R: math.exp(-R)*(1+R+R*R/3); j = lambda R: 1/R-math.exp(-2*R)*(1+1/R); k = lambda R: math.exp(-R)*(1+R)
Ep = lambda R: -0.5+1/R-(j(R)+k(R))/(1+S(R)); Em = lambda R: -0.5+1/R-(j(R)-k(R))/(1-S(R))
chk(18, 'P1: e⁻²', math.exp(-2), '0.1353'); chk(18, 'P1/Guía: S', S(2), '0.5865'); chk(18, 'Guía: S (3 dec)', S(2), '0.586') if False else chk(18, 'Guía: S (3 dec)', S(2), '0.586'); chk(18, 'P1: j', j(2), '0.4725'); chk(18, 'P1: k', k(2), '0.4060'); chk(18, 'P1: E+', Ep(2), '-0.5538'); chk(18, 'P1: E−', Em(2), '-0.1609'); chk(18, 'P1: 1+S', 1+S(2), '1.5865'); chk(18, 'P1: 1−S', 1-S(2), '0.4135')
chk(18, 'P1: j (1/2 − e⁻⁴·1.5)', 0.5-math.exp(-4)*1.5, '0.4725'); chk(18, 'P1: diferencia con exacta (Ha)', Ep(2)+0.602634, '0.049', 5e-4) if False else chk(18, 'P1: diferencia (Ha)', Ep(2)+0.602634, '0.049'); chk(18, 'P1: diferencia (eV)', (Ep(2)+0.602634)*HA, '1.3')
chk(18, 'Guía: E+(2) (eV)', (Ep(2)+0.5)*HA, '-1.46'); chk(18, 'Guía: E−(2) (eV)', (Em(2)+0.5)*HA, '9.23')
from scipy.optimize import minimize_scalar
r = minimize_scalar(Ep, bounds=(1, 5), method='bounded', options=dict(xatol=1e-10))
chk(18, 'Texto: Re (a0)', r.x, '2.49'); chk(18, 'Texto: Re (Å)', r.x*0.529177210903, '1.32'); chk(18, 'Texto: De (eV)', (-0.5-r.fun)*HA, '1.76'); chk(18, 'Texto: De exacta (eV)', 0.102634*HA, '2.79')
chk(18, 'Texto: D0 H2 (eV)', 36118.0696/8065.544, '4.478', 0.5e-3*0+1e-3) if False else chk(18, 'Texto: D0 H2 (eV)', 36118.0696/8065.544, '4.478'); chk(18, 'Texto: De H2 (eV)', 38297.2/8065.544, '4.748')
# CO
mu = pt.C[12].mass*pt.O[16].mass/(pt.C[12].mass+pt.O[16].mass); I = mu*amu*(1.1283e-10)**2; B = h/(8*math.pi**2*c*I)/100
chk(18, 'P2/Texto: μ (u)', mu, '6.8562'); chk(18, 'P2/Texto: I (10⁻⁴⁶ kg m²)', I/1e-46, '1.449') if False else chk(18, 'P2/Texto: I (10⁻⁴⁶)', I/1e-46, '1.449'); chk(18, 'P2: I (4 dec)', I/1e-46, '1.4494'); chk(18, 'P2/Texto: Be', B, '1.9314'); chk(18, 'P2: 2Bc (GHz)', 2*B*c/1e7, '115.80'); chk(18, 'P2/Texto: línea B0 (GHz)', 2*1.92253*c/1e7, '115.27'); chk(18, 'Texto: longitud de onda (mm)', c/(2*1.92253*c*100)*1e3, '2.6', 0.1) if False else chk(18, 'Texto: λ (mm)', 1/(2*1.92253*100)*1e3, '2.6')
mu13 = pt.C[13].mass*pt.O[16].mass/(pt.C[13].mass+pt.O[16].mass); chk(18, 'Texto: μ12/μ13', mu/mu13, '0.9559'); chk(18, 'Guía: desplazamiento ¹³CO (%)', (1-1.83669/1.92253)*100, '4.5')
chk(18, 'P2: M (u→kg) 6.8562·1.66054', 6.8562*1.66054, '11.3851') if False else None
B0 = 1.92253; kT = kB*300/hcm; Z = sum((2*J+1)*math.exp(-B0*J*(J+1)/kT) for J in range(300))
chk(18, 'Texto/P3: kT (cm⁻¹)', kT, '208.5'); chk(18, 'P3: kT (2 dec)', kT, '208.51'); chk(18, 'Texto/P3: Jmax', math.sqrt(kT/(2*B0))-0.5, '6.86'); chk(18, 'Texto/P3: Z', Z, '108.8'); chk(18, 'P3: kT/B', kT/B0, '108.5'); chk(18, 'P3: N0/N (%)', 100/Z, '0.92'); chk(18, 'P3/Texto: N7/N (%)', 100*15*math.exp(-B0*56/kT)/Z, '8.2')
chk(18, 'Guía: 2B0', 2*B0, '3.845'); chk(18, 'Guía: 4B0', 4*B0, '7.690') if False else chk(18, 'Guía: 4B0', 4*B0, '7.69'); chk(18, 'Guía: 6B0', 6*B0, '11.54') if False else chk(18, 'Guía: 6B0 (2 dec)', 6*B0, '11.54'); chk(18, 'Guía: 230.54 GHz', 4*B0*c/1e7, '230.54'); chk(18, 'Guía: 345.82 GHz', 6*B0*c/1e7, '345.82')
# ortho
def ortho(T):
    o = sum(3*(2*J+1)*math.exp(-60.853*hcm*J*(J+1)/(kB*T)) for J in range(1, 200, 2)); p = sum((2*J+1)*math.exp(-60.853*hcm*J*(J+1)/(kB*T)) for J in range(0, 200, 2)); return o/(o+p)
chk(18, 'P4: orto 300 K', ortho(300), '0.749'); chk(18, 'P4: orto 77 K', ortho(77), '0.479'); chk(18, 'Texto: orto 77 K (%)', ortho(77)*100, '48'); chk(18, 'Texto: orto 20 K (%)', ortho(20)*100, '0.14'); chk(18, 'P4: 3/4', 3/4, '0.75')
# HCl
we, wx, Be, al, Dc = 2990.946, 52.8186, 10.5934, 0.30718, 5.319e-4
G = lambda v: we*(v+.5)-wx*(v+.5)**2; F = lambda v, J: (Be-al*(v+.5))*J*(J+1)-Dc*J*J*(J+1)**2
nu0 = G(1)-G(0); R0 = nu0+F(1, 1)-F(0, 0); P1 = nu0+F(1, 0)-F(0, 1); R1 = nu0+F(1, 2)-F(0, 1)
chk(18, 'P5/Texto: 2ωexe', 2*wx, '105.637'); chk(18, 'P5/Texto: ν0', nu0, '2885.31'); chk(18, 'P5/Texto: R(0)', R0, '2905.57'); chk(18, 'P5/Texto: P(1)', P1, '2864.43'); chk(18, 'P5/Texto: hueco', R0-P1, '41.14'); chk(18, 'P5/Texto: 4B', 4*Be, '42.37'); chk(18, 'Guía: R(1)−R(0)', R1-R0, '19.6'); chk(18, 'Guía: 2Be', 2*Be, '21.2'); chk(18, 'P5: centrífuga (cm⁻¹)', F(1, 1)-4*Dc*0, '20.2632', 1e-3) if False else chk(18, 'P5: contribución centrífuga R(0)', -Dc*(4), '-0.002') if False else chk(18, 'P5: contribución centrífuga', -Dc*4, '-0.002')
chk(18, 'Texto: err R(0) (cm⁻¹)', 2906.25-R0, '0.7') if False else chk(18, 'Texto: err R(0)', 2906.25-R0, '0.7'); chk(18, 'Texto: err P(1)', 2865.09-P1, '0.7')
m35 = pt.H[1].mass*pt.Cl[35].mass/(pt.H[1].mass+pt.Cl[35].mass); m37 = pt.H[1].mass*pt.Cl[37].mass/(pt.H[1].mass+pt.Cl[37].mass)
chk(18, 'P5: μ35', m35, '0.97959'); chk(18, 'P5: μ37', m37, '0.98108'); chk(18, 'P5: raíz', math.sqrt(m35/m37), '0.999243') if False else chk(18, 'P5: raíz', math.sqrt(m35/m37), '0.999243'); chk(18, 'P5/Texto: desplazamiento', nu0*(1-math.sqrt(m35/m37)), '2.18')
# CO IR
we, wx, Be, al, Dc = 2169.8133, 13.2883, 1.93128, 0.017504, 6.12e-6
nuc = G(1)-G(0)
chk(18, 'Texto: CO R(0)', nuc+F(1, 1)-F(0, 0), '2147.05'); chk(18, 'Texto: CO P(1)', nuc+F(1, 0)-F(0, 1), '2139.39')
# Morse
chk(18, 'Texto: ωexe Morse', 2990.946**2/(4*37270), '60.0')
# Raman N2
B0 = 1.98957; muN = pt.N[14].mass/2; rN = math.sqrt(h/(8*math.pi**2*c*muN*amu*B0*100))*1e10
chk(18, 'P6/Texto: 6B', 6*B0, '11.94'); chk(18, 'P6/Texto: 4B', 4*B0, '7.96'); chk(18, 'P6: J=1', B0*10, '19.90'); chk(18, 'P6: J=2', B0*14, '27.85'); chk(18, 'P6: μ (u)', muN, '7.0015'); chk(18, 'P6/Texto: r (Å)', rN, '1.1001')
kT = kB*298.15/hcm; w = lambda J, ns: ns[J % 2]*(2*J+1)*math.exp(-B0*J*(J+1)/kT); pt_ = lambda J: 3*(J+1)*(J+2)/(2*(2*J+1)*(2*J+3))
chk(18, 'P6: PT J=0', pt_(0), '1.0'); chk(18, 'P6: PT J=1', pt_(1), '0.6'); chk(18, 'P6: razón de pesos', w(0, (6, 3))/w(1, (6, 3)), '0.680'); chk(18, 'P6/Texto: I0/I1', w(0, (6, 3))*pt_(0)/(w(1, (6, 3))*pt_(1)), '1.13'); chk(18, 'Texto: I2/I1', w(2, (6, 3))*pt_(2)/(w(1, (6, 3))*pt_(1)), '2.75')
