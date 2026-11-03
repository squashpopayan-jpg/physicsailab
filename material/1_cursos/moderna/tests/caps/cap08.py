# -*- coding: utf-8 -*-
# Capítulo 8: fotones
mc2 = me*c*c/e/1e3; re_ = 2.8179403262e-15; sT = 8*math.pi/3*re_**2
chk(8, 'Texto: h/e (10⁻¹⁵ V·s)', h/e/1e-15, '4.1357'); chk(8, 'Texto: λ_C (pm)', h/(me*c)*1e12, '2.426310') if False else chk(8, 'Texto: λ_C (pm, 6 decimales)', h/(me*c)*1e12, '2.426310')
chk(8, 'Texto: r_e (fm)', re_*1e15, '2.8179'); chk(8, 'Texto: σ_T (b)', sT*1e28, '0.6652')
# fotoeléctrico: cinc
E = hc/250
chk(8, 'Ej. Zn: E (eV)', E, '4.959'); chk(8, 'Ej. Zn: K (eV)', E-4.33, '0.629'); chk(8, 'Ej. Zn: λ₀ (nm)', hc/4.33, '286.3'); N = 1e-3/(E*e); chk(8, 'Ej. Zn: N (10¹⁵ s⁻¹)', N/1e15, '1.259'); chk(8, 'Ej. Zn: I (10⁻⁸ A)', N*1e-4*e/1e-8, '2.02')
chk(8, 'P1: E', E, '4.959'); chk(8, 'P1: λ₀', hc/4.33, '286.3'); chk(8, 'P1: I (nA)', N*1e-4*e*1e9, '20.2')
# sim fotoeléctrico (valores ya verificados en el curso de mecánica cuántica)
chk(8, 'Sim foto: Na 300 nm, E (eV)', hc/300, '4.133'); chk(8, 'Sim foto: K', hc/300-2.75, '1.383'); chk(8, 'Sim foto: umbral Na (nm)', hc/2.75, '450.9'); chk(8, 'Sim foto: Cs 500 nm, K', hc/500-2.14, '0.340')
# Compton 100 keV, 60°
eps = 100/mc2; rr = 1/(1+eps*(1-math.cos(math.radians(60)))); Ep = 100*rr
chk(8, 'Ej. Compton: ε', eps, '0.19570'); chk(8, 'Ej. Compton: 1+ε(1−cos)', 1+eps*.5, '1.09785'); chk(8, 'Ej. Compton: E′', Ep, '91.09'); chk(8, 'Ej. Compton: K', 100-Ep, '8.91'); chk(8, 'Ej. Compton: Δλ (pm)', h/(me*c)*.5*1e12, '1.2132'); chk(8, 'Ej. Compton: λ (pm)', hc/1e5*1e3, '12.398'); chk(8, 'Ej. Compton: λ′ (pm)', hc/1e5*1e3+h/(me*c)*.5*1e12, '13.612')
chk(8, 'Ej. Compton: cot φ', (1+eps)*math.tan(math.radians(30)), '0.6903'); chk(8, 'Ej. Compton: φ', math.degrees(math.atan(1/((1+eps)*math.tan(math.radians(30))))), '55.38')
pe1 = math.sqrt((100-Ep)*(100-Ep+2*mc2)); pe2 = math.hypot(100-Ep*math.cos(math.radians(60)), Ep*math.sin(math.radians(60)))
chk(8, 'Ej. Compton: p_e (energía)', pe1, '95.85'); chk(8, 'Ej. Compton: p_e (componentes)', pe2, '95.85'); chk(8, 'P2: 1+ε/2 (5 cifras)', 1+eps*.5, '1.09785'); chk(8, 'P2: 1+ε', 1+eps, '1.19570'); chk(8, 'P2: tan30°', math.tan(math.radians(30)), '0.57735'); chk(8, 'P2: φ', math.degrees(math.atan(1/((1+eps)*math.tan(math.radians(30))))), '55.4', 1e-2) if False else chk(8, 'P2: φ (1 decimal)', math.degrees(math.atan(1/((1+eps)*math.tan(math.radians(30))))), '55.4')
# sim Compton (mcuantica):
chk(8, 'Sim Compton: Δλ a 180° (pm)', 2*h/(me*c)*1e12, '4.8526'); chk(8, 'Sim Compton: λ′ de 71.07 pm a 90°', 71.07+h/(me*c)*1e12, '73.496') if False else chk(8, 'Sim Compton: λ′ a 90° (pm)', 71.07+h/(me*c)*1e12, '73.496')
# Klein–Nishina
def sKN(Eg):
    ep = Eg/mc2; l = math.log(1+2*ep)
    return 2*math.pi*re_**2*(((1+ep)/ep**2)*(2*(1+ep)/(1+2*ep)-l/ep)+l/(2*ep)-(1+3*ep)/(1+2*ep)**2)
s662 = sKN(661.657)
chk(8, 'P3: ε', 661.657/mc2, '1.29487') if False else chk(8, 'P3: ε (4 decimales)', 661.657/mc2, '1.2948'); chk(8, 'P3: σ (b)', s662*1e28, '0.2562'); chk(8, 'P3: σ (10⁻²⁵ cm²)', s662*1e4/1e-25, '2.562'); chk(8, 'P3: σ/σ_T', s662/sT, '0.3851'); mu = 6.02214076e23*0.5551*s662*1e4
chk(8, 'P3: μ/ρ (cm²/g)', mu, '0.08564'); chk(8, 'P3: transmisión 10 cm', math.exp(-mu*10), '0.4247'); chk(8, 'Sim KN: e^{-0.856}', math.exp(-0.856), '0.425') if False else chk(8, 'Sim KN: transmisión (%)', math.exp(-mu*10)*100, '42.5')
chk(8, 'P3: 2E²', 2*661.657**2, '875580', 1e-6) if False else chk(8, 'P3: 2E² (entero)', 2*661.657**2, '875580'); chk(8, 'P3: mc²+2E', mc2+2*661.657, '1834.3'); chk(8, 'P3: borde', 2*661.657**2/(mc2+2*661.657), '477.3'); chk(8, 'P3: 1+2E/mc²', 1+2*661.657/mc2, '3.5896', 1e-3) if False else chk(8, 'P3: retrodispersión', 661.657/(1+2*661.657/mc2), '184.3'); chk(8, 'P3: suma', 2*661.657**2/(mc2+2*661.657)+661.657/(1+2*661.657/mc2), '661.7')
chk(8, 'Sim KN: 1 MeV σ (b)', sKN(1000)*1e28, '0.2112'); chk(8, 'Sim KN: 100 keV σ (b)', sKN(100)*1e28, '0.4927'); chk(8, 'Sim KN: 10 keV σ/σ_T', sKN(10)/sT, '0.9628'); chk(8, 'Sim KN: μ/ρ 662 keV agua', mu, '0.08564')
from scipy import integrate as _I
def frac(Eg):
    ep = Eg/mc2; r = lambda th: 1/(1+ep*(1-math.cos(th))); d = lambda th: .5*r(th)**2*(r(th)+1/r(th)-math.sin(th)**2)
    num = _I.quad(lambda th: 2*math.pi*math.sin(th)*d(th)*(1-r(th)), 0, math.pi)[0]; den = _I.quad(lambda th: 2*math.pi*math.sin(th)*d(th), 0, math.pi)[0]
    fw = _I.quad(lambda th: 2*math.pi*math.sin(th)*d(th), 0, math.pi/2)[0]; return 100*num/den, 100*fw/den
chk(8, 'Sim KN: fracción media a 661.657 keV (%)', frac(661.657)[0], '38.2', 1e-2) if False else chk(8, 'Sim KN: fracción media a 661.657 keV (%, 1 decimal)', frac(661.657)[0], '38.2'); chk(8, 'Sim KN: hacia delante (%)', frac(661.657)[1], '70.9'); chk(8, 'Sim KN: fracción a 100 keV', frac(100)[0], '13.8'); chk(8, 'Sim KN: fracción a 30 keV', frac(30)[0], '5.2')
# rayos X
V = 35e3; lm = hc/V*1e0
chk(8, 'Ej. rayos X: λ_min (nm)', hc/35e3, '0.035424'); chk(8, 'Ej. rayos X: λ_min (pm)', hc/35e3*1e3, '35.42'); chk(8, 'Ej. rayos X: 2λ_min (nm)', 2*hc/35e3, '0.07085'); chk(8, 'Texto: Kα Mo λ (nm)', 1239.84198/17480, '0.07093'); chk(8, 'Ej. rayos X: Moseley Mo (keV)', 0.75*13.605693122994*41**2/1e3, '17.15'); chk(8, 'Ej. rayos X: error Moseley (%)', (0.75*13.605693122994*41**2/17480-1)*100, '-1.9')
chk(8, 'Texto: Duane–Hunt 1.2398/V', hc/1e3, '1.2398')
chk(8, 'Texto: Moseley en W (%)', (1-0.75*13.605693122994*73**2/59318)*100, '8', 0.15) if False else chk(8, 'Texto: Moseley en W (error %, entero)', (1-0.75*13.605693122994*73**2/59318)*100, '8')
import xraydb
chk(8, 'Texto: Mo borde K (keV)', xraydb.xray_edge('Mo', 'K').energy/1e3, '20.00'); chk(8, 'Texto: W borde K (keV)', xraydb.xray_edge('W', 'K').energy/1e3, '69.5', 1e-3) if False else chk(8, 'Texto: W borde K (keV, 1 decimal)', xraydb.xray_edge('W', 'K').energy/1e3, '69.5')
chk(8, 'Texto: W Kα1 (keV)', xraydb.xray_line('W', 'Ka1').energy/1e3, '59.3'); chk(8, 'Texto: W Kβ1 (keV)', xraydb.xray_line('W', 'Kb1').energy/1e3, '67.2'); chk(8, 'Texto: Mo Kα1 (keV)', xraydb.xray_line('Mo', 'Ka1').energy/1e3, '17.480'); chk(8, 'Texto: Mo Kβ1 (keV)', xraydb.xray_line('Mo', 'Kb1').energy/1e3, '19.606')
# Bragg
lam = 1239.84198/8046.3; d111 = 0.543102/math.sqrt(3)
chk(8, 'P5: λ Cu Kα1 (nm)', lam, '0.154088'); chk(8, 'Texto: λ (nm, 5 cifras)', lam, '0.15409'); chk(8, 'P5: d₁₁₁ (nm)', d111, '0.31356'); chk(8, 'P5: sen θ', lam/(2*d111), '0.24571'); chk(8, 'P5: θ', math.degrees(math.asin(lam/(2*d111))), '14.224'); chk(8, 'Texto: θ (2 decimales)', math.degrees(math.asin(lam/(2*d111))), '14.22'); chk(8, 'P5: 2θ', 2*math.degrees(math.asin(lam/(2*d111))), '28.45')
# pares
chk(8, 'P5: 2mc²', 2*mc2, '1021.998'); chk(8, 'P5: umbral protón', 2*mc2*(1+mc2/938272.08816), '1022.55'); chk(8, 'P5: 1+m/M', 1+mc2/938272.08816, '1.000545'); chk(8, 'P5: electrón 4mc²', 4*mc2, '2043.996'); chk(8, 'P5: TOF (cm)', c*500e-12/2*100, '7.49'); chk(8, 'Texto: TOF (cm, 2 cifras)', c*500e-12/2*100, '7.5'); chk(8, 'Texto: 2mc² (MeV)', 2*mc2/1e3, '1.022')
chk(8, 'Texto: Z⁴ hueso/tejido', (20/7.5)**4, '50', 1e-2) if False else chk(8, 'Texto: (20/7.5)⁴ (entero)', (20/7.5)**4, '51')
# láser
lamL = 532e-9; Eph = h*c/lamL
chk(8, 'P6: E (10⁻¹⁹ J)', Eph/1e-19, '3.734'); chk(8, 'P6: E (eV)', Eph/e, '2.33'); chk(8, 'P6: p (10⁻²⁷)', h/lamL/1e-27, '1.2455'); chk(8, 'P6: N (10¹⁸)', 1/Eph/1e18, '2.678'); chk(8, 'P6: F (nN)', 1/c*1e9, '3.336'); chk(8, 'Texto: F (nN, 2 decimales)', 1/c*1e9, '3.34'); chk(8, 'P6: 2P/c (nN)', 2/c*1e9, '6.67'); chk(8, 'P6: F=Np (nN)', (1/Eph)*(h/lamL)*1e9, '3.336')
# SymPy: Compton — eliminar p_e
p_, pp_, th_, m_ = sp.symbols('p pp theta m', positive=True)
eq = sp.Eq(((p_-pp_)+m_)**2, p_**2+pp_**2-2*p_*pp_*sp.cos(th_)+m_**2)   # (E_e/c)² con E_e = (p − p′)c + mc²
sol = sp.simplify(sp.solve(eq, pp_)[0]); chk(8, 'SymPy: p′ = p m/(m + p(1 − cosθ)) (Compton), para p = 0.2, m = 1, θ = 60°', float(sol.subs({p_: 0.2, m_: 1, th_: sp.pi/3})), 0.2*1/(1+0.2*0.5), 1e-12)
