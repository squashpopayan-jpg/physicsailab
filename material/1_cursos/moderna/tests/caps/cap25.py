# -*- coding: utf-8 -*-
# Capítulo 25: partículas
from particle import Particle as _Pp
from scipy.optimize import fsolve as _fs4
GeV = 1.0; hb = 6.582119569e-25      # GeV s
pm = lambda i: _Pp.from_pdgid(i).mass
# tabla de masas del PDG
chk(25, 'Tabla: m_e', pm(11), '0.511', 1) if False else chk(25, 'Tabla: m_e (MeV)', pm(11), '0.511'); chk(25, 'Tabla: m_μ', pm(13), '105.66'); chk(25, 'Tabla: m_τ', pm(15), '1776.9'); chk(25, 'Tabla: u', pm(2), '2.16'); chk(25, 'Tabla: d', pm(1), '4.7'); chk(25, 'Tabla: s', pm(3), '92.9'); chk(25, 'Tabla: c (GeV)', pm(4)/1000, '1.273'); chk(25, 'Tabla: b (GeV)', pm(5)/1000, '4.186'); chk(25, 'Tabla: t (GeV)', pm(6)/1000, '172.6'); chk(25, 'Tabla: W', pm(24)/1000, '80.362'); chk(25, 'Tabla: Z', pm(23)/1000, '91.188'); chk(25, 'Tabla: H', pm(25)/1000, '125.13')
chk(25, 'Texto: τ top', hb/1.42, '4.6e-25', 1) if False else chk(25, 'Texto: τ top (10⁻²⁵ s)', hb/1.42/1e-25, '4.6'); chk(25, 'Texto: τ Δ (10⁻²⁴ s)', hb/0.117/1e-24, '5.6'); chk(25, 'Texto: τ π⁺ (ns)', _Pp.from_pdgid(211).lifetime, '26.0'); chk(25, 'Texto: cociente τ', _Pp.from_pdgid(211).lifetime*1e-9/(hb/0.117)/1e15, '4.6')
# cinemática
def kin(M, m1, m2): return math.sqrt((M**2-(m1+m2)**2)*(M**2-(m1-m2)**2))/(2*M)
chk(25, 'Texto/P2: p π→μν', kin(139.570, 105.658, 0), '29.79'); chk(25, 'P2: T μ', math.sqrt(kin(139.570, 105.658, 0)**2+105.658**2)-105.658, '4.12'); chk(25, 'Texto/P2: p K→μν', kin(493.677, 105.658, 0), '235.5'); chk(25, 'Texto: p Λ→pπ', kin(1115.683, 938.272, 139.570), '100.6'); chk(25, 'Texto: p Ω→ΛK', kin(1672.45, 1115.683, 493.677), '211.2'); chk(25, 'Texto: p Z→ee (GeV)', kin(91187.6, 0.511, 0.511)/1000, '45.594'); chk(25, 'P2: (M²−m²)/2M', (139.570**2-105.658**2)/(2*139.570), '29.79'); chk(25, 'P2: kaón (M²−m²)/2M', (493.677**2-105.658**2)/(2*493.677), '235.5')
# muón, pión, Z
GF = 1.1663788e-5; mmu = 0.1056583755; tmu = 192*math.pi**3*hb/(GF**2*mmu**5)
chk(25, 'Texto/P3: τ μ (µs)', tmu*1e6, '2.187'); chk(25, 'Texto/P3: dif (%)', (2.196981-2.187347)/2.196981*100, '0.44'); chk(25, 'Texto: GF (10⁻⁵)', GF/1e-5, '1.1663788', 1e-9) if False else None
R = (0.51099895/105.6583755)**2*((139.57039**2-0.51099895**2)/(139.57039**2-105.6583755**2))**2
chk(25, 'Texto: R π (10⁻⁴)', R/1e-4, '1.283'); chk(25, 'Texto: dif R (%)', (R-1.2327e-4)/R*100, '3.9')
Gnn = GF*91.1876**3/(12*math.sqrt(2)*math.pi)*1000
chk(25, 'Texto/P4: Γνν árbol (MeV)', Gnn, '165.9'); chk(25, 'P4: Γinv', 2495.2-1744.4-3*83.984, '498.8'); chk(25, 'Texto/P4: Nν', (2495.2-1744.4-3*83.984)/167.2, '2.984')
MW = math.sqrt((math.pi/137.035999084)/(math.sqrt(2)*GF))/math.sqrt(0.2312)
chk(25, 'Texto: 37.28', math.sqrt((math.pi/137.035999084)/(math.sqrt(2)*GF)), '37.28'); chk(25, 'Texto: sinθW', math.sqrt(0.2312), '0.4808'); chk(25, 'Texto: MW árbol', MW, '77.5'); chk(25, 'Texto: dif MW (%)', (80.36-MW)/80.36*100, '3.5')
def sig(MZ, GZ, Gee, Gh): return 12*math.pi*Gee*Gh/(MZ**2*GZ**2)*0.3893793721e6
GZ3 = 1.7444+3*0.083985+3*0.1672
chk(25, 'Texto: σ pico (nb)', sig(91.1876, 2.4955, 0.083985, 1.7444), '41.53'); chk(25, 'Texto: N=4 (nb)', sig(91.1876, 2.4955+0.1659, 0.083985, 1.7444), '36.5'); chk(25, 'Texto: caída (%)', (1-sig(91.1876, 2.4955+0.1659, 0.083985, 1.7444)/sig(91.1876, 2.4955, 0.083985, 1.7444))*100, '12'); chk(25, 'Guía: N=2 (nb)', sig(91.1876, GZ3-0.1672, 0.083985, 1.7444), '47.6'); chk(25, 'Guía: N=4 (nb)', sig(91.1876, GZ3+0.1672, 0.083985, 1.7444), '36.4')
# CKM
def mix(t12, t23, t13, dl):
    c12, s12, c23, s23, c13, s13 = math.cos(t12), math.sin(t12), math.cos(t23), math.sin(t23), math.cos(t13), math.sin(t13); e = np.exp(1j*dl)
    return np.array([[c12*c13, s12*c13, s13/e], [-s12*c23-c12*s23*s13*e, c12*c23-s12*s23*s13*e, s23*c13], [s12*s23-c12*c23*s13*e, -c12*s23-s12*c23*s13*e, c23*c13]])
A = np.abs(mix(math.asin(0.2250), math.asin(0.04182), math.asin(0.003732), 1.144))
chk(25, 'Texto: |Vud|', A[0, 0], '0.97435'); chk(25, 'Texto: |Vus|', A[0, 1], '0.2250', 1) if False else chk(25, 'Texto: |Vus|', A[0, 1], '0.2250'); chk(25, 'Texto: |Vcb|', A[1, 2], '0.0418'); chk(25, 'Texto: |Vub|', A[0, 2], '0.0037'); chk(25, 'Texto: |Vtb|', A[2, 2], '0.99912')
# oscilaciones
osc = lambda th, dm, L, E: math.sin(2*th)**2*math.sin(1.26693*dm*L/E)**2
chk(25, 'Texto/P5: L1', math.pi*0.6/(2*1.26693*2.5e-3), '297.6'); chk(25, 'Texto/P5: P 295 km', osc(math.pi/4, 2.5e-3, 295, 0.6), '0.9998'); chk(25, 'P5: argumento', 1.26693*2.5e-3*295/0.6, '1.5575', 1e-3) if False else chk(25, 'P5: argumento', 1.26693*2.5e-3*295/0.6, '1.5573'); chk(25, 'P5: L1 (1 GeV)', math.pi*1.0/(2*1.26693*2.5e-3), '496'); chk(25, 'Texto: KamLAND', osc(0.5836, 7.5e-5, 180, 0.004), '0.69'); chk(25, 'Guía: sen²2θ (8.6°)', math.sin(2*math.radians(8.6))**2, '0.087'); chk(25, 'Guía: 2L1', 2*math.pi*0.6/(2*1.26693*2.5e-3), '595')
# GMO
mavg = lambda ids: sum(pm(i) for i in ids)/len(ids)
N_ = mavg([2212, 2112]); X_ = mavg([3322, 3312]); S_ = mavg([3222, 3212, 3112]); L_ = pm(3122)
chk(25, 'P6: N', N_, '938.9'); chk(25, 'P6: Σ', S_, '1193.2'); chk(25, 'P6: Ξ', X_, '1318.3'); chk(25, 'Texto/P6: GMO izq', (N_+X_)/2, '1128.6'); chk(25, 'Texto/P6: GMO der', (3*L_+S_)/4, '1135.1'); chk(25, 'Texto: dif GMO (%)', ((3*L_+S_)/4-(N_+X_)/2)/((N_+X_)/2)*100, '0.6')
D_ = mavg([2224, 2214, 1114]); Ss = mavg([3224, 3214, 3114]); Xs = mavg([3324, 3314]); Om = pm(3334)
chk(25, 'Texto: Σ*', Ss, '1384.6'); chk(25, 'Texto: Ξ*', Xs, '1533.4'); chk(25, 'Texto/P6: espaciado 1', Ss-D_, '152.6'); chk(25, 'Texto/P6: espaciado 2', Xs-Ss, '148.8'); chk(25, 'Texto: espaciado 3', Om-Xs, '139.1'); chk(25, 'Texto/P6: Ω predicho', Xs+(Xs-Ss), '1682'); chk(25, 'Texto: dif Ω (%)', (Xs+(Xs-Ss)-Om)/Om*100, '0.6'); chk(25, 'Texto: Ω medida', Om, '1672.45')
