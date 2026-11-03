# -*- coding: utf-8 -*-
# Capítulo 15: momento angular, espín y estructura fina
muB = C.physical_constants['Bohr magneton'][0]; al = C.alpha; Ry = 13.605693122994; kT300 = kB*300/e
chk(15, 'Texto: μ_B (10⁻²⁴ J/T)', muB/1e-24, '9.2740'); chk(15, 'Texto: μ_B (10⁻⁵ eV/T)', muB/e/1e-5, '5.7884'); chk(15, 'Texto: μ_B/h (GHz/T)', muB/h/1e9, '13.996')
chk(15, 'P1: Δν (GHz)', muB/h/1e9, '13.996'); chk(15, 'P1: Δλ (nm)', (643.8e-9)**2*(muB/h)/c*1e9, '0.01935'); chk(15, 'P1: Δλ (10⁻¹¹ m)', (643.8e-9)**2*(muB/h)/c/1e-11, '1.935'); chk(15, 'P1: Δν (10¹⁰ Hz)', muB/h/1e10, '1.3996')
# g_e
chk(15, 'Texto: g−2 (10⁻³)', (-C.physical_constants['electron g factor'][0]-2)/1e-3, '2.3'); chk(15, 'Texto: a_e (10⁻³)', C.physical_constants['electron mag. mom. anomaly'][0]/-1/1e-3, '1.159652') if False else chk(15, 'Texto: a_e (10⁻³)', abs(C.physical_constants['electron mag. mom. anomaly'][0])/1e-3, '1.159652'); chk(15, 'Texto: g_e', -C.physical_constants['electron g factor'][0], '2.0023193')
# Stern–Gerlach
m = 107.868*C.u; v = math.sqrt(8*kB*1200/(math.pi*m)); a = muB*1000/m; z = a*0.035*(0.035/2+0.01)/v**2
chk(15, 'Ej./P3: masa (10⁻²⁵ kg)', m/1e-25, '1.7912'); chk(15, 'Ej./P3: v̄ (m/s)', v, '485.3'); chk(15, 'Ej.: F (10⁻²¹ N)', muB*1000/1e-21, '9.274'); chk(15, 'Ej./P3: a (10⁴ m/s²)', a/1e4, '5.178'); chk(15, 'P3: v̄² (entero)', v*v, '235539'); chk(15, 'Ej./P3: z (mm)', z*1e3, '0.2116'); chk(15, 'P3: z (10⁻⁴ m)', z/1e-4, '2.116'); chk(15, 'Ej./P3: separación (mm)', 2*z*1e3, '0.423')
chk(15, 'P3: 8kT/πm (cuenta intermedia)', 8*kB*1200/(math.pi*m), '235539', 1) if False else None
# Landé y Zeeman anómalo
g = lambda J, L, S: 1+(J*(J+1)+S*(S+1)-L*(L+1))/(2*J*(J+1))
chk(15, 'P2: g(²S½)', g(.5, 0, .5), '2.000'); chk(15, 'P2: g(²P½)', g(.5, 1, .5), '0.667'); chk(15, 'P2: g(²P3/2)', g(1.5, 1, .5), '1.333')
comp = lambda gp, gl, mp_, ml: gp*mp_-gl*ml
D2 = sorted(set(round(comp(4/3, 2, mp_, ml), 6) for mp_ in (1.5, .5, -.5, -1.5) for ml in (.5, -.5) if abs(mp_-ml) <= 1)); D1 = sorted(set(round(comp(2/3, 2, mp_, ml), 6) for mp_ in (.5, -.5) for ml in (.5, -.5)))
chk(15, 'P2: n.º de componentes D2', len(D2), '6'); chk(15, 'P2: n.º de componentes D1', len(D1), '4'); chk(15, 'P2: D2 extremo 5/3', max(D2), '1.667'); chk(15, 'P2: D2 intermedio 1', sorted(D2)[-2], '1.000'); chk(15, 'P2: D2 interno 1/3', sorted(D2)[-3], '0.333'); chk(15, 'P2: D1 extremo 4/3', max(D1), '1.333'); chk(15, 'P2: D1 interno 2/3', sorted(D1)[-2], '0.667')
chk(15, 'Ej./P2: μ_B B a 1 T (µeV)', muB/e*1e6, '57.88'); chk(15, 'Ej./P2: (5/3) μ_B B (µeV)', 5/3*muB/e*1e6, '96.5'); chk(15, 'P2: (5/3) μ_B B (µeV, 2 dec)', 5/3*muB/e*1e6, '96.47'); chk(15, 'P2: (5/3) μ_B B (GHz)', 5/3*muB/h/1e9, '23.33'); chk(15, 'Ej.: (5/3) μ_B B (GHz, 1 dec)', 5/3*muB/h/1e9, '23.3'); chk(15, 'Ej.: (4/3) μ_B B (µeV)', 4/3*muB/e*1e6, '77.2')
# estructura fina
fs = al**2*Ry/16
chk(15, 'Texto/P4: α²Ry/16 (10⁻⁵ eV)', fs/1e-5, '4.528'); chk(15, 'Texto/P4: GHz', fs*e/h/1e9, '10.95'); chk(15, 'P4: cm⁻¹', fs*e/h/c/100, '0.3652'); chk(15, 'P4: α² (10⁻⁵)', al**2/1e-5, '5.3251'); chk(15, 'P4: Ry', Ry, '13.6057')
chk(15, 'Texto: Lamb (µeV)', 1057.845e6*h/e*1e6, '4.37')
# hiperfina
mu3 = (C.m_p/(C.m_p+me))**3; gp_ = C.physical_constants['proton g factor'][0]; Ehf = 4/3*gp_*(me/C.m_p)*al**4*me*c*c*mu3
chk(15, 'Texto: g_p', gp_, '5.5857'); chk(15, 'P5: g_p', gp_, '5.58569'); chk(15, 'Texto: μ_B/μ_N', muB/C.physical_constants['nuclear magneton'][0], '1836', 1) if False else chk(15, 'Texto: m_p/m_e', C.m_p/me, '1836')
chk(15, 'P5: m_e/m_p (10⁻⁴)', me/C.m_p/1e-4, '5.4462'); chk(15, 'P5: α⁴ (10⁻⁹)', al**4/1e-9, '2.8357'); chk(15, 'P5: m_e c² (eV, entero)', me*c*c/e, '510999'); chk(15, 'P5/Texto: (μ/m_e)³', mu3, '0.99837'); chk(15, 'P5: ΔE_hf (10⁻⁶ eV)', Ehf/e/1e-6, '5.868'); chk(15, 'Texto: ΔE_hf (µeV)', Ehf/e*1e6, '5.87'); chk(15, 'P5: ν_Fermi (MHz)', Ehf/h/1e6, '1418.84')
nu_m = 1420.405751768e6
chk(15, 'P5: error relativo (%)', (Ehf/h/nu_m-1)*100, '-0.11'); chk(15, 'Texto: error (%)', abs(Ehf/h/nu_m-1)*100, '0.11'); chk(15, 'P5: λ (cm)', c/nu_m*100, '21.106'); chk(15, 'P5: ΔE medida (µeV)', h*nu_m/e*1e6, '5.874'); chk(15, 'P5: T (K)', h*nu_m/kB, '0.068') if False else chk(15, 'P5: T (K)', h*nu_m/kB, '0.068')
chk(15, 'Texto: λ 21 cm (cm, 3 dec)', c/nu_m*100, '21.106'); chk(15, 'Texto: vida media (10⁷ años)', 1/2.869e-15/3.15576e7/1e7, '1.1')
# resonancia magnética
gp = C.physical_constants['proton gyromag. ratio in MHz/T'][0]; gn = abs(C.physical_constants['neutron gyromag. ratio in MHz/T'][0]); ge = C.physical_constants['electron gyromag. ratio in MHz/T'][0]
chk(15, 'Texto: γ_p/2π (MHz/T)', gp, '42.5775'); chk(15, 'Texto: γ_e/2π (GHz/T)', ge/1e3, '28.0250')
for B, s in ((1.5, '63.87'), (3, '127.73'), (7, '298.04')): chk(15, f'Texto/P6: ν_p a {B} T (MHz)', gp*B, s)
chk(15, 'Guía: ν_n a 3 T (MHz)', gn*3, '87.49'); chk(15, 'Guía: ν_e a 3 T (GHz)', ge*3/1e3, '84.07'); chk(15, 'Texto: ESR a 0.339 T (GHz)', ge*0.339/1e3, '9.5'); chk(15, 'Guía: γ_e/γ_p', ge/gp, '658')
chk(15, 'Texto/P6: ΔE a 3 T (µeV)', h*gp*1e6*3/e*1e6, '0.528'); chk(15, 'P6: ΔE (10⁻²⁶ J)', h*gp*1e6*3/1e-26, '8.464') if False else chk(15, 'P6: ΔE (10⁻²⁶ J)', h*gp*1e6*3/1e-26, '8.464'); chk(15, 'Texto: k_BT a 300 K (meV)', kT300*1e3, '25.9'); chk(15, 'P6: kT (meV, 2 dec)', kT300*1e3, '25.85')
P = lambda B, T: math.tanh(h*gp*1e6*B/(2*kB*T))
chk(15, 'Texto/P6: P a 3 T (10⁻⁵)', P(3, 300)/1e-5, '1.02'); chk(15, 'Guía: P a 1.5 T (10⁻⁶)', P(1.5, 300)/1e-6, '5.1'); chk(15, 'Guía: P a 7 T (10⁻⁵)', P(7, 300)/1e-5, '2.4'); chk(15, 'Guía: P a 3 T y 4 K (10⁻⁴)', P(3, 4)/1e-4, '7.7'); chk(15, 'Guía: P a 3 T (ppm)', P(3, 300)*1e6, '10.2')
chk(15, 'P6: λ (m)', c/(gp*1e6*3), '2.347'); chk(15, 'P6: λ (m, 2 dec)', c/(gp*1e6*3), '2.35')
# crossover
A_Na = 2/3*2.132e-3; A_H = 2/3*fs
chk(15, 'P7: A_Na (meV)', A_Na*1e3, '1.4213'); chk(15, 'P7: B*_Na (T)', A_Na/(muB/e), '24.55'); chk(15, 'P7: A_H (10⁻⁵ eV)', A_H/1e-5, '3.019'); chk(15, 'P7: B*_H (T)', A_H/(muB/e), '0.5215'); chk(15, 'P7: 5/B*_Na', 5/(A_Na/(muB/e)), '0.20'); chk(15, 'P7: 5/B*_H', 5/(A_H/(muB/e)), '9.6'); chk(15, 'Texto: B*_Na (T, 1 dec)', A_Na/(muB/e), '24.6'); chk(15, 'Texto: B*_H (T)', A_H/(muB/e), '0.52'); chk(15, 'Guía: μ_B B a 5 T (meV)', 5*muB/e*1e3, '0.29'); chk(15, 'P7: suma energías', 4*(A_Na/2)+2*(-A_Na), 0, 1e-12, False)
chk(15, 'Texto: ΔE_fs Na (meV)', 3*A_Na/2*1e3, '2.132')
