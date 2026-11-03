# -*- coding: utf-8 -*-
# Capítulo 4: momento, energía, umbrales, desintegraciones, E = mc²
from particle import Particle
me_ = 0.51099895; mp_ = 938.27208816; mn_ = 939.56542052; md_ = 1875.61294257; mmu = 105.6583755; mpi = 139.57039; mpi0 = 134.9768; mZ = 91187.6; mtau = 1776.86
chk(4, 'Masa del electrón (MeV)', C.physical_constants['electron mass energy equivalent in MeV'][0], '0.510999')
# Colisión elástica con boost
chk(4, 'Texto: Σmv antes (unidades mc)', 0.8461538461538461-0.14285714285714282, '0.7033'); chk(4, 'Texto: Σmv después', 0.7803027013706685+0.05242019351296073, '0.8327'); chk(4, 'Texto: Σmv_y después', 0.27158775286535003-0.433664011360981, '-0.162')
chk(4, 'Texto: v antes (x) del primero', (0.6+0.5)/(1+0.3), '0.8462'); chk(4, 'Texto: v antes (x) del segundo', (-0.6+0.5)/(1-0.3), '-0.1429')
g1 = 1/math.sqrt(1-0.8461538461538461**2); g2 = 1/math.sqrt(1-0.14285714285714282**2)
chk(4, 'Texto: Σγmv_x antes', g1*0.8461538461538461-g2*0.14285714285714282, '1.4434')
# LHC bend
chk(4, 'Texto: p = 0.29979 B R (LHC 7 TeV, B = 8.33 T, R = 2804 m)', 0.29979*8.33*2804/1e3, '7.00', 5e-3) if False else chk(4, 'Texto: p = 0.29979 B R en TeV (B = 8.33 T, R = 2804 m)', 0.299792458*8.33*2804/1e3, '7.00')
# Ej. electrón 1 MeV
K = 1.0; g = 1+K/me_; b = math.sqrt(1-1/g**2); pc = math.sqrt(K*(K+2*me_)); pcl = math.sqrt(2*me_*K); vcl = math.sqrt(2*K/me_)
chk(4, 'Ej. e: γ', g, '2.9570'); chk(4, 'Ej. e: β', b, '0.94108'); chk(4, 'Ej. e: K+2mc²', K+2*me_, '2.02200'); chk(4, 'Ej. e: pc', pc, '1.4220'); chk(4, 'Ej. e: pc clásico', pcl, '1.0109'); chk(4, 'Ej. e: v clásica/c', vcl, '1.978'); chk(4, 'Ej. e: ½mv² (MeV)', 0.5*me_*b*b, '0.2263'); chk(4, 'Ej. e: fracción %', 0.5*me_*b*b*100, '22.6')
chk(4, 'P1: v clásica/c (4 cifras)', vcl, '1.9784'); chk(4, 'P1: error %', (1-0.5*me_*b*b)*100, '77', 0.01) if False else chk(4, 'P1: error relativo (%) entero', (1-0.5*me_*b*b/K)*100, '77', 0.01)
K = 15.0; g = 1+K/me_; b = math.sqrt(1-1/g**2)
chk(4, 'P1: γ(15 MeV)', g, '30.354'); chk(4, 'P1: β(15 MeV)', b, '0.999457'); chk(4, 'P1: v clásica(15 MeV)', math.sqrt(2*K/me_), '7.662'); chk(4, 'Texto Bertozzi: 7.66c', math.sqrt(2*K/me_), '7.66'); chk(4, 'Texto Bertozzi: β', b, '0.99946'); chk(4, 'Texto Bertozzi: γ', g, '30.35')
# sim energía
x = 1.957; g = 1+x; b = math.sqrt(1-1/g**2)
chk(4, 'Sim energía: γ', g, '2.957'); chk(4, 'Sim energía: β', b, '0.9411'); chk(4, 'Sim energía: pc', math.sqrt(x*(x+2))*me_, '1.422'); chk(4, 'Sim energía: pc clásico', math.sqrt(2*x)*me_, '1.011'); chk(4, 'Sim energía: v clásica/c', math.sqrt(2*x), '1.978')
x = .01; g = 1+x; b = math.sqrt(1-1/g**2); chk(4, 'Sim energía: β a K=0.01 mc²', b, '0.1404'); chk(4, 'Sim energía: error clásico (%)', (1-0.5*b*b/x)*100, '1.5'); chk(4, 'Sim energía: 5.1 keV', 0.01*me_*1000, '5.1')
chk(4, 'Sim energía: 1−β a γ=1001 (10⁻⁷)', 1/(2*1001**2)*1e7, '5.0'); chk(4, 'Sim energía: K protón 1000 mc² (GeV)', 1000*mp_/1000, '938')
# umbrales
Ku = lambda m1, m2, Mf: (Mf**2-(m1+m2)**2)/(2*m2)
k = Ku(mp_, mp_, 4*mp_); chk(4, 'Ej. pbar: K_u (MeV)', k, '5629.6'); chk(4, 'Ej. pbar: 6mp', 6*mp_, '5629.6'); chk(4, 'Ej. pbar: E por haz (MeV)', 2*mp_, '1876.5'); chk(4, 'Ej. pbar: cociente', (k+mp_)/(2*mp_), '3.5'); chk(4, 'Sim umbral: M = 4mp (MeV)', 4*mp_, '3753'); chk(4, 'Sim: Bevatron/umbral', 6200/k, '1.10')
s = (13600e3)**2; Eeq = (s-2*(mp_)**2)/(2*mp_)/1e3
chk(4, 'Ej. LHC: √s (TeV)', 13.6, '13.6'); chk(4, 'Ej. LHC: s (10⁸ GeV²)', 13600**2/1e8, '1.8496'); chk(4, 'Ej. LHC: E equiv (10⁷ GeV)', Eeq/1e7, '9.856'); chk(4, 'Ej. LHC: K (10¹⁶ eV)', (Eeq-mp_/1000)*1e9/1e16, '9.856')
kz = Ku(me_, me_, mZ); chk(4, 'Ej. Z: K_u (10⁹ MeV)', kz/1e9, '8.136'); chk(4, 'Ej. Z: E por haz (GeV)', mZ/2/1000, '45.59'); chk(4, 'Ej. Z: cociente (10⁵)', (kz+me_)/(mZ/2)/1e5, '1.8'); chk(4, 'Ej. Z: K_u (10⁶ GeV)', kz/1e6/1e3*1e3/1e3, '8', 0.02) if False else chk(4, 'Ej. Z: K_u (10⁶ GeV)', kz/1e3/1e6, '8.1')
kmm = Ku(me_, me_, 2*mmu); chk(4, 'Sim umbral: μμ K_u (GeV)', kmm/1e3, '43.69'); chk(4, 'Sim umbral: μμ E por haz (MeV)', mmu, '105.66'); chk(4, 'Sim umbral: μμ cociente', (kmm+me_)/mmu, '413.5')
ktt = Ku(me_, me_, 2*mtau); chk(4, 'Sim umbral: ττ cociente', (ktt+me_)/mtau, '6954', 1e-3)
chk(4, 'Sim umbral: pbar K_u (MeV)', k, '5629.6')
kp = Ku(mp_, mp_, 2*mp_+mpi0); chk(4, 'P4: π⁰ K_u', kp, '279.66'); chk(4, 'P4: factor (4mp+mπ)', 4*mp_+mpi0, '3888.07'); chk(4, 'P4: 2mp', 2*mp_, '1876.54'); chk(4, 'P4: Ku por la fórmula corta', mpi0*(4*mp_+mpi0)/(2*mp_), '279.66')
# desintegración π→μν
ps = (mpi**2-mmu**2)/(2*mpi); Em = math.hypot(ps, mmu)
chk(4, 'P5: mπ²', mpi**2, '19479.9'); chk(4, 'P5: mμ²', mmu**2, '11163.7'); chk(4, 'P5: p', ps, '29.792'); chk(4, 'P5: 2mπ', 2*mpi, '279.14'); chk(4, 'P5: E_μ', Em, '109.778'); chk(4, 'P5: K_μ', Em-mmu, '4.120'); chk(4, 'P5: β_μ', ps/Em, '0.2714'); chk(4, 'P5: suma de energías', Em+ps, '139.570')
chk(4, 'Texto: mπ/2 del π⁰ (MeV)', mpi0/2, '67.49')
# π⁰ γγ
g = 1000/mpi0; b = math.sqrt(1-1/g**2)
chk(4, 'P6: γ', g, '7.4087'); chk(4, 'P6: β', b, '0.99085'); chk(4, 'P6: Emin', 500*(1-b), '4.576'); chk(4, 'P6: Emax', 500*(1+b), '995.42'); chk(4, 'P6: 1/γ', 1/g, '0.13498'); chk(4, 'P6: θmín', 2*math.degrees(math.asin(1/g)), '15.51')
chk(4, 'P6: m²', mpi0**2, '18218.7'); chk(4, 'P6: 1−cosθ', mpi0**2/(2*800*200), '0.056934'); chk(4, 'P6: θ', math.degrees(math.acos(1-mpi0**2/(2*800*200))), '19.43'); chk(4, 'P6: m', math.sqrt(2*800*200*(mpi0**2/(2*800*200))), '134.977')
chk(4, 'Sim π⁰: E₁ a cosθ*=0.6', 500*(1+b*0.6), '797.3'); chk(4, 'Sim π⁰: E₂', 1000-500*(1+b*0.6), '202.7')
g5 = 5000/mpi0; chk(4, 'Sim π⁰: θmín a 5 GeV', 2*math.degrees(math.asin(1/g5)), '3.09')
# E = mc²
mdef = mp_+mn_-md_; chk(4, 'Ej. deuterón: B (MeV)', mdef, '2.2246'); chk(4, 'P3: B con masas redondeadas', 938.2721+939.5654-1875.6129, '2.2246')
chk(4, 'Texto: fotón de captura (MeV, 4 cifras)', mdef - mdef**2/(2*md_), '2.2232')
Q = (7.016003+1.007825-2*4.002603)*931.494; chk(4, 'P3: Δm (u)', 7.016003+1.007825-2*4.002603, '0.018622'); chk(4, 'P3: Q (MeV)', Q, '17.346'); chk(4, 'P3: Q/2', Q/2, '8.67'); chk(4, 'P3: masas iniciales', 7.016003+1.007825, '8.023828'); chk(4, 'P3: masas finales', 2*4.002603, '8.005206')
Lsun = 3.828e26; mdot = Lsun/c**2
chk(4, 'Ej. Sol: c² (10¹⁶)', c**2/1e16, '8.98755'); chk(4, 'Ej. Sol: ṁ (10⁹ kg/s)', mdot/1e9, '4.259'); chk(4, 'Ej. Sol: ṁ por año (10¹⁷ kg)', mdot*365.25*86400/1e17, '1.344'); chk(4, 'Ej. Sol: fracción por año (10⁻¹⁴)', mdot*365.25*86400/1.989e30/1e-14, '6.8', 0.01)
chk(4, 'Ej. 1 g: E (10¹³ J)', 1e-3*c**2/1e13, '8.988'); chk(4, 'Ej. 1 g: kt', 1e-3*c**2/4.184e12, '21.48'); chk(4, 'Texto: 21.5 kt', 1e-3*c**2/4.184e12, '21.5')
chk(4, 'P2: 4.6×10⁹ años (10¹⁷ s)', 4.6e9*365.25*86400/1e17, '1.452'); chk(4, 'P2: Δm (10²⁶ kg)', mdot*4.6e9*365.25*86400/1e26, '6.18'); chk(4, 'P2: fracción (10⁻⁴)', mdot*4.6e9*365.25*86400/1.989e30/1e-4, '3.1'); chk(4, 'P2: fracción (%)', mdot*4.6e9*365.25*86400/1.989e30*100, '0.031')
# SymPy: K = (γ−1)mc² a partir de ∫ v d(γv)
v, cc = sp.symbols('v c', positive=True); gam = 1/sp.sqrt(1-v**2/cc**2)
Kint = sp.simplify(sp.integrate(v*sp.diff(gam*v, v), (v, 0, sp.Rational(3, 5)*cc)))
chk(4, 'SymPy: ∫ v d(γv) de 0 a 0.6c = (γ−1)c² = 0.25 c²', float(Kint.subs(cc, 1)), 0.25, 1e-12)
chk(4, 'SymPy: γ³ = (1 − v²/c²)^(−3/2) = dp/dv/m en v = 0.6c', float(sp.diff(gam*v, v).subs({v: 0.6, cc: 1})), 1.25**3, 1e-12)
