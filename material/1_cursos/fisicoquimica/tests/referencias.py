"""Referencias independientes para validar la biblioteca del curso (src/core/31-fq.js y siguientes).
Cantera (GRI-Mech 3.0), CoolProp (IAPWS-95), thermo/chemicals (ChemSep, DIPPR), SciPy, NumPy y mpmath.
Escribe tests/referencias.json. Ejecutar: python tests/referencias.py"""
import json, math
import numpy as np
from scipy import special, integrate, optimize
import cantera as ct
from CoolProp.CoolProp import PropsSI as P
R = 8.314462618; kB = 1.380649e-23; h = 6.62607015e-34; c0 = 299792458; NA = 6.02214076e23
ref = {}
gas = ct.Solution('gri30.yaml')

# ============ Cap. 1: potencial químico ============
ref['tsat'] = {str(p): P('T', 'P', p, 'Q', 0, 'Water') for p in [820e2, 101325, 5e5, 2e6]}
w = np.arange(0, 101, 5)
rel = [1.00000,0.99113,0.98361,0.97687,0.97036,0.96339,0.95551,0.94662,0.93684,0.92636,0.91546,0.90418,0.89271,0.88104,0.86920,0.85716,0.84494,0.83242,0.81942,0.80567,0.79074]
rho = np.array(rel) * 0.998203; M1, M2 = 46.069, 18.015
n1 = w / M1; n2 = (100 - w) / M2; x = n1 / (n1 + n2); V = 100 / rho / (n1 + n2)
V1, V2 = V[-1], V[0]; VE = V - x * V1 - (1 - x) * V2
m = (x > 0) & (x < 1); z = 2 * x - 1
c = np.polyfit(z[m], (VE / np.where(m, x * (1 - x), 1))[m], 6)
def VEf(xx): return xx * (1 - xx) * np.polyval(c, 2 * xx - 1)
def Vbar(xx, hh=1e-6):
    d = V1 - V2 + (VEf(xx + hh) - VEf(xx - hh)) / (2 * hh); vm = xx * V1 + (1 - xx) * V2 + VEf(xx)
    return [vm + (1 - xx) * d, vm - xx * d, vm]
ref['etoh'] = {str(xx): Vbar(xx) for xx in [0.05, 0.2, 0.5, 0.8, 0.95]}
def regular(chi):
    f = lambda xx: math.log(xx / (1 - xx)) + chi * (1 - 2 * xx)
    return optimize.brentq(f, 1e-12, 0.5 - 1e-12, xtol=1e-14)
ref['regular'] = {str(chi): regular(chi) for chi in [2.2, 2.5, 3.0, 3.5]}

# ============ NASA-7 y equilibrio de gases ideales (Cantera) ============
ref['nasa'] = {}
for sp in ['H2O', 'CO2', 'CH4', 'NH3', 'N2', 'O2', 'CO', 'H2']:
    for T in [300, 600, 1000, 1500, 2500]:
        gas.TPX = T, 1e5, {sp: 1.0}
        s_std = gas.entropy_mole / 1e3  # a 1 bar, gas puro
        ref['nasa'][f'{sp},{T}'] = [gas.enthalpy_mole / 1e3, s_std, gas.cp_mole / 1e3]
def eq(species, comp, T, Pp):
    sub = ct.Solution(thermo='ideal-gas', species=[gas.species(s) for s in species])
    sub.TPX = T, Pp, comp
    try: sub.equilibrate('TP', solver='gibbs')
    except Exception: sub.TPX = T, Pp, comp; sub.equilibrate('TP', solver='vcs')
    return {s: float(sub.X[sub.species_index(s)]) for s in species}
ref['eq'] = {}
cases = [
    ('Haber 700 K 200 bar', ['N2','H2','NH3'], 'N2:1,H2:3', 700, 2e7),
    ('Haber 500 K 100 bar', ['N2','H2','NH3'], 'N2:1,H2:3', 500, 1e7),
    ('Haber 800 K 1 bar', ['N2','H2','NH3'], 'N2:1,H2:3', 800, 1e5),
    ('Agua 3000 K 1 atm', ['H2O','H2','O2','OH','H','O'], 'H2O:1', 3000, 101325),
    ('Agua 2500 K 1 bar', ['H2O','H2','O2','OH','H','O'], 'H2O:1', 2500, 1e5),
    ('Gas de agua 1100 K', ['CO','H2O','CO2','H2'], 'CO:1,H2O:1', 1100, 1e5),
    ('Gas de agua 700 K', ['CO','H2O','CO2','H2'], 'CO:1,H2O:1', 700, 1e5),
    ('NO del aire 2500 K', ['N2','O2','NO'], 'N2:0.79,O2:0.21', 2500, 1e5),
    ('CO2 2800 K', ['CO2','CO','O2'], 'CO2:1', 2800, 1e5),
    ('Reformado 1100 K 20 bar S/C 3', ['CH4','H2O','CO','CO2','H2'], 'CH4:1,H2O:3', 1100, 2e6),
    ('Reformado 900 K 5 bar S/C 2', ['CH4','H2O','CO','CO2','H2'], 'CH4:1,H2O:2', 900, 5e5),
]
for name, sp, comp, T, Pp in cases: ref['eq'][name] = {'sp': sp, 'comp': comp, 'T': T, 'P': Pp, 'x': eq(sp, comp, T, Pp)}


# ============ Cap. 2: gases reales (thermo PRMIX con las mismas constantes críticas) ============
from thermo.eos_mix import PRMIX
import CoolProp
CPN = {'H2':'Hydrogen','N2':'Nitrogen','CH4':'Methane','CO2':'CO2','C2H6':'Ethane','NH3':'Ammonia'}
def crit(g): return (P('Tcrit', CPN[g]), P('pcrit', CPN[g]), P('acentric', CPN[g]))
ref['prmix'] = {}
for name, sp, y, T, Pp in [('N2/H2/NH3 700 K 200 bar', ['N2','H2','NH3'], [0.25,0.6,0.15], 700, 2e7), ('CO2/CH4 350 K 100 bar', ['CO2','CH4'], [0.5,0.5], 350, 1e7), ('CH4/C2H6 300 K 50 bar', ['CH4','C2H6'], [0.3,0.7], 300, 5e6), ('N2/CO2 400 K 150 bar', ['N2','CO2'], [0.6,0.4], 400, 1.5e7)]:
    cr = [crit(g) for g in sp]
    eos = PRMIX(Tcs=[c[0] for c in cr], Pcs=[c[1] for c in cr], omegas=[c[2] for c in cr], zs=y, T=T, P=Pp)
    gasok = getattr(eos, 'V_g', None) is not None
    phis = eos.phis_g if gasok else eos.phis_l
    Z = (eos.V_g if gasok else eos.V_l) * Pp / (R * T)
    ref['prmix'][name] = {'sp': sp, 'y': y, 'T': T, 'P': Pp, 'phi': list(phis), 'Z': Z}
# Z y fugacidad de CoolProp (comparación con el modelo, tolerancia = exactitud del modelo)
AS = {}
ref['coolprop_phi'] = {}
for g, T, Pp in [('CO2', 320, 2e6), ('CO2', 320, 5e6), ('CH4', 300, 5e6), ('CH4', 300, 1e7), ('N2', 300, 5e6), ('N2', 300, 3e7)]:
    a = CoolProp.AbstractState('HEOS', CPN[g]); a.update(CoolProp.PT_INPUTS, Pp, T)
    ref['coolprop_phi'][f'{g},{T},{Pp}'] = [a.fugacity_coefficient(0), a.compressibility_factor()]
ref['virialB'] = {}
for g in ['N2', 'CH4', 'CO2', 'AR' if False else 'N2']:
    a = CoolProp.AbstractState('HEOS', CPN[g]); a.update(CoolProp.DmolarT_INPUTS, 1e-6, 400); ref['virialB'][f'{g},400'] = a.keyed_output(CoolProp.iBvirial) * 1e6

# ============ Cap. 5: equilibrio ============
ref['lnK'] = {}
for name, nu in {'WGS': {'CO':-1,'H2O':-1,'CO2':1,'H2':1}, 'Haber': {'N2':-0.5,'H2':-1.5,'NH3':1}, 'SMR': {'CH4':-1,'H2O':-1,'CO':1,'H2':3}, 'metanol': {'CO':-1,'H2':-2,'CH3OH':1}}.items():
    sub = ct.Solution(thermo='ideal-gas', species=[gas.species(s) for s in nu])
    for T in [500, 900, 1100, 1500]:
        sub.TP = T, 101325; g0 = sub.standard_gibbs_RT * R * T  # J/mol a 1 atm
        dG = sum(nu[s] * (g0[sub.species_index(s)] - R * T * math.log(1.01325) ) for s in nu)  # a 1 bar
        ref['lnK'][f'{name},{T}'] = [nu, -dG / (R * T)]
def haber_real(T, Pp):
    sp = ['N2','H2','NH3']; cr = [crit(g) for g in sp]
    sub = ct.Solution(thermo='ideal-gas', species=[gas.species(s) for s in sp]); sub.TP = T, 101325
    g0 = sub.standard_gibbs_RT * R * T
    dG = (g0[2] - 0.5 * g0[0] - 1.5 * g0[1]) - R * T * math.log(1.01325) * (1 - 0.5 - 1.5)
    K = math.exp(-dG / (R * T))
    def f(x):
        n = 4 - 2 * x; y = [(1 - x) / n, (3 - 3 * x) / n, 2 * x / n]
        eos = PRMIX(Tcs=[c[0] for c in cr], Pcs=[c[1] for c in cr], omegas=[c[2] for c in cr], zs=y, T=T, P=Pp)
        phis = eos.phis_g if getattr(eos, 'V_g', None) is not None else eos.phis_l
        Kphi = phis[2] / (phis[0] ** 0.5 * phis[1] ** 1.5)
        return math.log(y[2] / (y[0] ** 0.5 * y[1] ** 1.5)) + math.log(Kphi) - math.log(K * Pp / 1e5)
    x = optimize.brentq(f, 1e-9, 1 - 1e-9, xtol=1e-13); return 2 * x / (4 - 2 * x)
ref['haber_real'] = {f'{T},{Pp}': haber_real(T, Pp) for T, Pp in [(700, 2e7), (500, 1e7), (723.15, 300 * 101325), (900, 5e6), (673.15, 100 * 101325)]}

# ============ Cap. 6: ácido–base, solubilidad, sistema del carbono ============
import PyCO2SYS as pyco2
def pH_cb(pkas, z0, C, S):
    Ka = [10 ** -k for k in pkas]
    def q(pH):
        h = 10 ** -pH; terms = [1.0]; pr = 1.0
        for k in Ka: pr *= k / h; terms.append(pr)
        tot = sum(terms); mean = sum((z0 - i) * t / tot for i, t in enumerate(terms))
        return h - 1e-14 / h + S + C * mean
    return optimize.brentq(q, -2, 16, xtol=1e-13)
ref['pH'] = {}
for name, pk, z0, C, S in [('acético 0.1', [4.76], 0, 0.1, 0), ('amonio 0.1', [9.25], 1, 0.1, 0), ('H3PO4 0.1', [2.15, 7.20, 12.35], 0, 0.1, 0), ('Na2HPO4 0.1', [2.15, 7.20, 12.35], 0, 0.1, 0.2), ('NaHCO3 0.1', [6.35, 10.33], 0, 0.1, 0.1), ('Na2CO3 0.1', [6.35, 10.33], 0, 0.1, 0.2), ('cítrico 0.01 + 0.015 NaOH', [3.13, 4.76, 6.40], 0, 0.01, 0.015), ('glicina 0.05 + 0.05 NaOH', [2.35, 9.78], 1, 0.05, 0.05), ('HF 0.01', [3.17], 0, 0.01, 0)]:
    ref['pH'][name] = [pk, z0, C, S, pH_cb(pk, z0, C, S)]
ref['titr'] = {}
for name, pk, z0, S0, sign, Ca, Ct in [('acético/NaOH', [4.76], 0, 0, 1, 0.1, 0.1), ('NH3/HCl', [9.25], 1, 0, -1, 0.05, 0.1), ('Na2CO3/HCl', [6.35, 10.33], 0, 2, -1, 0.1, 0.1), ('fosfórico/NaOH', [2.15, 7.20, 12.35], 0, 0, 1, 0.1, 0.1)]:
    ref['titr'][name] = [[pk, z0, S0, sign, Ca, Ct], [[v, pH_cb(pk, z0, Ca * 25 / (25 + v), (S0 * Ca * 25 + sign * Ct * v) / (25 + v))] for v in [5, 12.5, 24, 25, 26, 37.5, 50, 60]]]
ref['co2sys'] = {}
for TA, f in [(2300, 400), (2300, 280), (2300, 900), (2200, 425), (2400, 1200), (2100, 200)]:
    r = pyco2.sys(par1=TA, par1_type=1, par2=f, par2_type=5, salinity=35, temperature=25, opt_pH_scale=1, opt_k_carbonic=10, total_sulfate=0, total_fluoride=0, total_borate=416.0, total_phosphate=0, total_silicate=0)
    ref['co2sys'][f'{TA},{f}'] = [float(r['pH_total']), float(r['dic']), float(r['carbonate']), float(r['saturation_calcite']), float(r['revelle_factor'])]
ref['ksp'] = {'AgCl': 10 ** -9.75}

# ============ Cap. 7: fases ============
def dPdT(T, f='Water'):
    h = 0.01; return (P('P','T',T+h,'Q',0,f) - P('P','T',T-h,'Q',0,f)) / (2*h)
ref['clap'] = {str(T): [dPdT(T), P('H','T',T,'Q',1,'Water') - P('H','T',T,'Q',0,'Water'), 1/P('D','T',T,'Q',1,'Water') - 1/P('D','T',T,'Q',0,'Water')] for T in [300, 373.15, 450, 550]}
ref['psat_co2'] = {str(T): P('P','T',T,'Q',0,'CO2') for T in [220, 240, 260, 280, 300]}
ref['ice_sub'] = {}

# ============ Cap. 8: Raoult, Antoine, NRTL, McCabe–Thiele, Henry ============
from thermo import VaporPressure, NRTL
from chemicals import CAS_from_any
LQ = {'benceno':'benzene','tolueno':'toluene','etanol':'ethanol','agua':'water','metanol':'methanol','acetona':'acetone','cloroformo':'chloroform','hexano':'hexane','heptano':'heptane','1-propanol':'1-propanol'}
ref['antoine'] = {}
for k, n in LQ.items():
    vp = VaporPressure(CASRN=CAS_from_any(n))
    for T in [330, 350, 370]:
        ref['antoine'][f'{k},{T}'] = vp(T)
vpB, vpT = VaporPressure(CASRN=CAS_from_any('benzene')), VaporPressure(CASRN=CAS_from_any('toluene'))
def bT(x, Pp): return optimize.brentq(lambda T: x * vpB(T) + (1 - x) * vpT(T) - Pp, 300, 450)
ref['bubbleT'] = {str(x): bT(x, 101325) for x in [0.1, 0.4, 0.7, 0.9]}
from chemicals import CAS_from_any as cas
import re as _re
_txt = open('src/core/29-datos.js', encoding='utf8').read()
_D = json.loads(_re.search(r'EM\.dat = (\{.*\});\s+if', _txt, _re.S).group(1))
ref['nrtl'] = {}
for key, T in [('etanol|agua', 350), ('acetona|cloroformo', 330), ('hexano|etanol', 330), ('metanol|acetona', 330), ('etanol|benceno', 340), ('acetato de etilo|etanol', 340)]:
    d = _D['nrtl'][key]
    for x1 in [0.2, 0.6]:
        n = NRTL(T=T, xs=[x1, 1 - x1], tau_bs=[[0, d['b12']], [d['b21'], 0]], alpha_cs=[[0, d['alpha']], [d['alpha'], 0]])
        ref['nrtl'][f'{key},{T},{x1}'] = list(n.gammas())
ref['henry_ref'] = {}
ref['mccabe'] = {}
def mc(alpha, zF, q, Rr, xD, xB):
    eq = lambda x: alpha * x / (1 + (alpha - 1) * x); inv = lambda y: y / (alpha - (alpha - 1) * y)
    sR, bR = Rr / (Rr + 1), xD / (Rr + 1)
    if abs(q - 1) < 1e-9: xi = zF
    else: sq = q / (q - 1); bq = -zF / (q - 1); xi = (bq - bR) / (sR - sq)
    yi = sR * xi + bR; sS = (yi - xB) / (xi - xB); bS = xB - sS * xB
    y = xD; n = 0
    for _ in range(300):
        x = inv(y); n += 1
        if x <= xB: break
        y = sR * x + bR if x > xi else sS * x + bS
    return n
for args in [(2.4, 0.5, 1, 2, 0.95, 0.05), (2.4, 0.5, 1, 1.5, 0.95, 0.05), (1.8, 0.4, 1, 4, 0.9, 0.1), (3.0, 0.3, 1, 2.5, 0.98, 0.02), (1.5, 0.6, 1.2, 8, 0.9, 0.1)]:
    ref['mccabe'][','.join(map(str, args))] = mc(*args)

# ============ Cap. 9: modelos de G^E (SymPy), LLE (scipy) ============
import sympy as sp
n1, n2, A12s, A21s, als = sp.symbols('n1 n2 A12 A21 al', positive=True)
nt = n1 + n2; X1, X2 = n1 / nt, n2 / nt
def lng(nGE):
    return [sp.diff(nGE, n1), sp.diff(nGE, n2)]
mods = {
  'margules': nt * X1 * X2 * (A21s * X1 + A12s * X2),
  'vanlaar': nt * A12s * A21s * X1 * X2 / (A12s * X1 + A21s * X2),
  'wilson': nt * (-X1 * sp.log(X1 + A12s * X2) - X2 * sp.log(X2 + A21s * X1)),
  'nrtl': nt * (X1 * X2 * (A21s * sp.exp(-als * A21s) / (X1 + X2 * sp.exp(-als * A21s)) + A12s * sp.exp(-als * A12s) / (X2 + X1 * sp.exp(-als * A12s)))),
}
ref['gE'] = {}
for name, expr in mods.items():
    ders = lng(expr)
    for (a12, a21, al, x1) in [(1.2, 0.8, 0.3, 0.3), (0.6, 1.5, 0.3, 0.7), (0.5, 0.9, 0.3, 0.5)]:
        sub = {A12s: a12, A21s: a21, als: al, n1: x1, n2: 1 - x1}
        ref['gE'][f'{name},{a12},{a21},{al},{x1}'] = [float(ders[0].subs(sub)), float(ders[1].subs(sub))]
def vl_lle(A12, A21):
    def f(v):
        xa, xb = v
        def l(x):
            d = A12 * x + A21 * (1 - x); return [A12 * (A21 * (1 - x) / d) ** 2, A21 * (A12 * x / d) ** 2]
        la, lb = l(xa), l(xb)
        return [math.log(xa) + la[0] - math.log(xb) - lb[0], math.log(1 - xa) + la[1] - math.log(1 - xb) - lb[1]]
    return optimize.fsolve(f, [0.02, 0.48], xtol=1e-13)
ref['lle'] = {'vanlaar 3.9216,1.1003': list(vl_lle(3.9216, 1.1003)), 'vanlaar 3.2,1.6 a 0.8': list(vl_lle(3.2 * 0.8, 1.6 * 0.8)) if False else list(vl_lle(3.9216 * 0.8, 1.1003 * 0.8)) }

# ============ Cap. 11: Schröder–van Laar ============
def eutP(A, B):
    f = lambda T: math.exp(-(A[1] / R) * (1 / T - 1 / A[0])) + math.exp(-(B[1] / R) * (1 / T - 1 / B[0])) - 1
    T = optimize.brentq(f, 150, min(A[0], B[0]), xtol=1e-12)
    return [T, math.exp(-(A[1] / R) * (1 / T - 1 / A[0])), math.exp(-(B[1] / R) * (1 / T - 1 / B[0]))]
ref['eutectic'] = {'Bi-Cd': eutP((544.55, 11300), (594.22, 6190)), 'Pb-Sn': eutP((600.61, 4770), (505.08, 7030)), 'naf-bif': eutP((353.35, 18800), (342.4, 18580))}

# ============ Cap. 16: cinética (solve_ivp) ============
from scipy.integrate import solve_ivp
def ivp(f, y0, ts): return solve_ivp(f, [0, ts[-1]], y0, t_eval=ts, method='LSODA', rtol=1e-11, atol=1e-14).y
ref['kin'] = {}
ref['kin']['bateman'] = ivp(lambda t, y: [-1.0 * y[0], 1.0 * y[0] - 0.4 * y[1], 0.4 * y[1]], [1, 0, 0], [0.5, 1.5, 4, 9]).tolist()
ref['kin']['rev'] = ivp(lambda t, y: [-2 * y[0] + 0.5 * y[1], 2 * y[0] - 0.5 * y[1]], [1, 0], [0.1, 0.4, 1, 3]).tolist()
ref['kin']['ab'] = ivp(lambda t, y: [-0.8 * y[0] * y[1], -0.8 * y[0] * y[1]], [0.02, 0.05], [0.5, 3, 10, 40]).tolist()
ref['kin']['second'] = ivp(lambda t, y: [-0.3 * y[0] ** 2], [1.5], [0.5, 2, 8]).tolist()
ref['kin']['stiff'] = ivp(lambda t, y: [-1000 * y[0] + 3000 - 2000 * math.exp(-t), -y[1] + 1000 * y[0]], [0, 0], [0.01, 0.1, 1, 5]).tolist()

# ============ Cap. 17: Arrhenius, colisiones, Eyring ============
ref['gri_k'] = {}
for r in gas.reactions():
    if r.reaction_type == 'Arrhenius' and not getattr(r, 'duplicate', False) and r.equation in [x['eq'] for x in _D['gri']]:
        idx = gas.reaction_equations().index(r.equation)
        row = {}
        for T in [300, 800, 1500, 2500]:
            gas.TP = T, 101325; row[str(T)] = gas.forward_rate_constants[idx] * 1e3  # cm3/mol/s
        ref['gri_k'][r.equation] = row
from scipy import integrate as _int
def kcoll_numeric(sig, mu, E0, T):
    kT = kB * T
    # k = ∫ σ(E) v(E) f(E) dE con σ(E) = σ(1 − E0/E), v = √(2E/μ), f(E) = 2√(E/π)(kT)^-3/2 exp(−E/kT)
    f = lambda E: sig * (1 - E0 / E) * math.sqrt(2 * E / mu) * 2 * math.sqrt(E / math.pi) * kT ** -1.5 * math.exp(-E / kT)
    return _int.quad(f, E0, E0 + 60 * kT, epsabs=0, epsrel=1e-10)[0] * NA
ref['coll'] = {f'{T},{E0}': [kcoll_numeric(0.3e-18, 2.0e-26, E0 * 1e3 / NA, T), 0.3e-18 * math.sqrt(8 * kB * T / (math.pi * 2.0e-26)) * NA * math.exp(-E0 * 1e3 / (R * T))] for T, E0 in [(300, 20), (1000, 70), (2000, 150)]}

ref['psat_pr'] = {'N2,100': P('P','T',100,'Q',0,'Nitrogen'), 'CO2,280': P('P','T',280,'Q',0,'CO2')}
def bv():
    out={}
    return out
ref['bvir'] = {}

# ============ Cap. 3: termoquímica ============
import sys; sys.path.insert(0, 'tools')
from datos_termo import TAB
from chemicals import CAS_from_any
from chemicals import reaction as rx
NM = {'H2O(g)':'water','CO(g)':'carbon monoxide','CO2(g)':'carbon dioxide','CH4(g)':'methane','NH3(g)':'ammonia','C2H6(g)':'ethane','C2H4(g)':'ethylene','C2H2(g)':'acetylene','NO(g)':'nitric oxide','NO2(g)':'nitrogen dioxide','HCl(g)':'hydrogen chloride','SO2(g)':'sulfur dioxide','H2S(g)':'hydrogen sulfide','C3H8(g)':'propane','CH3OH(g)':'methanol','C2H5OH(g)':'ethanol','C6H6(g)':'benzene'}
NL = {'H2O(l)':'water','CH3OH(l)':'methanol','C2H5OH(l)':'ethanol','C6H6(l)':'benzene','CH3COOH(l)':'acetic acid'}
ref['atct'] = {}
for k, n in NM.items():
    c = CAS_from_any(n); ref['atct'][k] = [rx.Hfg(c) / 1e3, rx.S0g(c)]
for k, n in NL.items():
    c = CAS_from_any(n); ref['atct'][k] = [rx.Hfl(c) / 1e3, rx.S0l(c)]
ref['atct_s'] = {}
for k, n in {'NaCl(s)': 'sodium chloride', 'LiF': 'lithium fluoride', 'KCl': 'potassium chloride', 'LiCl': 'lithium chloride', 'KBr': 'potassium bromide', 'NaBr': 'sodium bromide', 'KF': 'potassium fluoride', 'LiBr': 'lithium bromide'}.items():
    ref['atct_s'][k] = rx.Hfs(CAS_from_any(n)) / 1e3
# Kirchhoff: ΔH(T) − ΔH(298) = ∫ΔCp dT con scipy.quad sobre los cp de Cantera
def drCp(nu, T):
    s = 0
    for sp, v in nu.items():
        gas.TPX = T, 1e5, {sp: 1.0}; s += v * gas.cp_mole / 1e3
    return s
ref['kirch'] = {}
for name, nu in {'WGS': {'CO': -1, 'H2O': -1, 'CO2': 1, 'H2': 1}, 'Haber': {'N2': -1, 'H2': -3, 'NH3': 2}, 'SMR': {'CH4': -1, 'H2O': -1, 'CO': 1, 'H2': 3}}.items():
    for T in [500, 1000, 2000]:
        ref['kirch'][f'{name},{T}'] = [nu, integrate.quad(lambda t: drCp(nu, t), 298.15, T, epsabs=1e-8, epsrel=1e-10)[0]]


# ============ Cap. 4: entropía de Debye, Gibbs–Helmholtz, Ellingham ============
def D3(x): return 3 / x**3 * integrate.quad(lambda t: t**3 / np.expm1(t), 0, x, epsabs=1e-13, epsrel=1e-13)[0]
ref['debye'] = {}
for T, th in [(10, 343), (50, 343), (100, 428), (298.15, 343), (298.15, 105), (300, 645), (800, 400)]:
    x = th / T; ref['debye'][f'{T},{th}'] = [R * (4 * D3(x) - 3 * np.log1p(-np.exp(-x))), 3 * R * (4 * D3(x) - 3 * x / np.expm1(x))]

# ============ Cap. 18: mecanismo H2/O2 de Li et al. 2004 (Cantera h2o2.yaml) ============
_g = ct.Solution('h2o2.yaml')
def _comp(s): return {a.split(':')[0]: float(a.split(':')[1]) for a in s.split(',')}
ref['h2o2'] = {}
for name, T, Pp, X, times in [('a', 1000, 101325, 'H2:2,O2:1,N2:3.76', [1e-5, 1e-4, 5e-4, 1e-3, 3e-3]), ('b', 900, 30397.5, 'H2:2,O2:1,N2:3.76', [1e-4, 1e-3, 1e-2, 5e-2]), ('c', 1100, 202650, 'H2:2,O2:1,AR:7', [1e-5, 5e-5, 2e-4, 1e-3])]:
    _g.TPX = T, Pp, X
    r = ct.IdealGasReactor(_g, energy='off'); net = ct.ReactorNet([r]); net.rtol = 1e-10; net.atol = 1e-20
    rows = []
    for t in times:
        net.advance(t); rows.append({s: float(x) for s, x in zip(_g.species_names, r.thermo.X)})
    ref['h2o2'][name] = {'T': T, 'P': Pp, 'X': _comp(X), 'times': times, 'rows': rows}
_eq = [q.equation for q in _g.reactions()]
_i1 = _eq.index('H + O2 <=> O + OH'); _i5 = [i for i, e in enumerate(_eq) if e.startswith('H + O2') and 'HO2' in e]
def _crit(T, X):
    def f(Pa):
        _g.TPX = T, Pa * 101325, {**X, 'H': 1e-9}; c = _g.concentrations; HO2 = c[_g.species_index('H')] * c[_g.species_index('O2')]
        fw = _g.forward_rates_of_progress; return 2 * fw[_i1] / HO2 - sum(fw[i] for i in _i5) / HO2
    return optimize.brentq(f, 1e-4, 1e3, xtol=1e-12, rtol=1e-12)
ref['h2o2_crit'] = {f'{n},{T}': _crit(T, X) for n, X in [('air', {'H2': 2, 'O2': 1, 'N2': 3.76}), ('ar', {'H2': 2, 'O2': 1, 'AR': 7}), ('rich', {'H2': 4, 'O2': 1, 'N2': 3.76})] for T in (700, 800, 900, 1000, 1100)}
_ifo = [i for i, q in enumerate(_g.reactions()) if 'H2O2' in q.equation and '2 OH' in q.equation and '(+M)' in q.equation][0]
ref['h2o2_fo'] = {}
for T, Pa in [(500, 1), (700, 1), (1000, 0.01), (1000, 1), (1000, 100), (1200, 10)]:
    _g.TPX = T, Pa * 101325, {'N2': 1}; ref['h2o2_fo'][f'{T},{Pa}'] = float(_g.forward_rate_constants[_ifo])

# ============ Cap. 19: catálisis (SciPy, SymPy, enumeración explícita) ============
from scipy.special import lambertw
ref['lambertw'] = {repr(x): float(lambertw(x).real) for x in [0.01, 0.5, 1.0, 10.0, 1e3, 1e6, 1e12]}
# curva de progreso de Michaelis–Menten reducida (QSSA): ODE de alta precisión frente a la solución con W de Lambert
ref['mm_prog'] = {}
for S0, Km, Vm in [(100.0, 50.0, 1.0), (10.0, 50.0, 1.0), (500.0, 5.0, 2.0)]:
    ts = [0.1 * S0 / Vm, 0.5 * S0 / Vm, 1.0 * S0 / Vm, 2.0 * S0 / Vm, 4 * S0 / Vm]
    sol = solve_ivp(lambda t, y: [-Vm * y[0] / (Km + y[0])], [0, ts[-1]], [S0], method='Radau', t_eval=ts, rtol=1e-12, atol=1e-14)
    ref['mm_prog'][f'{S0},{Km},{Vm}'] = [ts, [float(v) for v in sol.y[0]]]
# mecanismo completo E + S ⇌ ES → E + P (LSODA/Radau): [S]+[ES] y [P]
ref['mm_full'] = {}
for E0, S0, k1, km1, kc in [(0.1, 100.0, 1.0, 40.0, 10.0), (10.0, 100.0, 1.0, 40.0, 10.0), (50.0, 20.0, 1.0, 9.0, 1.0)]:
    ts = [0.05, 0.2, 1.0, 3.0, 10.0, 30.0]
    f = lambda t, y: [-k1 * y[0] * y[1] + km1 * y[2], -k1 * y[0] * y[1] + (km1 + kc) * y[2], k1 * y[0] * y[1] - (km1 + kc) * y[2], kc * y[2]]
    sol = solve_ivp(f, [0, ts[-1]], [S0, E0, 0.0, 0.0], method='Radau', t_eval=ts, rtol=1e-11, atol=1e-14)
    ref['mm_full'][f'{E0},{S0},{k1},{km1},{kc}'] = [ts, [[float(v) for v in col] for col in sol.y.T]]
# Haldane: E + S ⇌ ES ⇌ E + P integrado hasta el equilibrio; razón [P]/[S]
ref['haldane'] = {}
for k1, km1, k2, km2 in [(1.0, 40.0, 10.0, 2.0), (3.0, 5.0, 8.0, 0.5)]:
    f = lambda t, y: [-k1 * y[0] * y[1] + km1 * y[2], -k1 * y[0] * y[1] + km1 * y[2] + k2 * y[2] - km2 * y[1] * y[3], k1 * y[0] * y[1] - km1 * y[2] - k2 * y[2] + km2 * y[1] * y[3], k2 * y[2] - km2 * y[1] * y[3]]
    sol = solve_ivp(f, [0, 2e4], [10.0, 0.5, 0.0, 0.0], method='Radau', rtol=1e-12, atol=1e-14)
    y = sol.y[:, -1]; ref['haldane'][f'{k1},{km1},{k2},{km2}'] = float(y[3] / y[0])
# inhibición mixta: balance de E, ES, EI, ESI con I en equilibrio rápido, resuelto simbólicamente con SymPy
import sympy as sp
E_, ES_, S_, I_, Km_, Ki_, Kip_, E0_, kc_ = sp.symbols('E ES S I Km Ki Kip E0 kc', positive=True)
sol_ = sp.solve([sp.Eq(E_ * S_, Km_ * ES_), sp.Eq(E0_, E_ * (1 + I_ / Ki_) + ES_ * (1 + I_ / Kip_))], [E_, ES_], dict=True)[0]
v_sym = sp.lambdify((S_, I_, Km_, Ki_, Kip_, E0_, kc_), kc_ * sol_[ES_])
ref['inhib'] = {}
for S, I, Km, Ki, Kip in [(50, 50, 50, 25, 1e30), (50, 50, 50, 25, 25), (50, 50, 50, 1e30, 25), (20, 40, 50, 25, 125), (500, 10, 30, 5, 80)]:
    ref['inhib'][f'{S},{I},{Km},{Ki},{Kip}'] = float(v_sym(S, I, Km, Ki, Kip, 1.0, 100.0))
# MWC: enumeración explícita de las 2^4 configuraciones de ocupación en los dos estados
import itertools
def mwc_enum(x, n, KR, c, L):
    num = den = 0.0
    for state, w, K in (('R', 1.0, KR), ('T', L, KR / c)):
        for conf in itertools.product([0, 1], repeat=n):
            wt = w * (x / K) ** sum(conf); num += wt * sum(conf) / n; den += wt
    return num / den
ref['mwc'] = {f'{x},{KR},{c},{L}': mwc_enum(x, 4, KR, c, L) for x, KR, c, L in [(10.0, 0.8, 0.0063, 8e5), (26.0, 0.8, 0.0063, 8e5), (100.0, 0.8, 0.0063, 8e5), (5.0, 2.0, 0.05, 1000.0), (30.0, 5.0, 0.2, 50.0)]}
# volcán: la distribución estacionaria de las dos coberturas (matriz de tasas) y el óptimo (SciPy)
def volc(E, T, Etot, G0, a, Sg=130.0):
    R_, kB_, h_ = 8.314462618e-3, 1.380649e-23, 6.62607015e-34; RT = R_ * T; nu = kB_ * T / h_
    dG1 = -E + T * Sg / 1e3; dG2 = E - Etot - T * Sg / 1e3; bar = lambda g: max(g, 0, G0 + a * g)
    k1 = nu * np.exp(-bar(dG1) / RT); km1 = nu * np.exp(-(bar(dG1) - dG1) / RT); k2 = nu * np.exp(-bar(dG2) / RT)
    Q = np.array([[-k1, k1], [km1 + k2, -(km1 + k2)]]); w, v = np.linalg.eig(Q.T); i = np.argmin(abs(w)); pi = np.real(v[:, i]); pi = pi / pi.sum()
    return float(k2 * pi[1])
ref['volcan'] = {}
for T, Etot, G0, a in [(500, 100, 60, 0.5), (700, 100, 60, 0.5), (500, 200, 60, 0.8), (400, 60, 50, 0.3)]:
    row = {str(E): volc(E, T, Etot, G0, a) for E in (10, 50, 90, 130, 200)}
    opt = optimize.minimize_scalar(lambda e: -np.log(volc(e, T, Etot, G0, a)), bounds=(Etot * 0.2 + 0.04 * T, Etot + 200), method='bounded', options={'xatol': 1e-4})
    ref['volcan'][f'{T},{Etot},{G0},{a}'] = {'tof': row, 'opt': float(opt.x)}

# ============ Cap. 20: oscilaciones, biestabilidad, Turing ============
def _period(ts, xs):
    pk = [ts[i] for i in range(1, len(xs) - 1) if xs[i] > xs[i - 1] and xs[i] >= xs[i + 1]]
    pk = pk[-6:]; return (pk[-1] - pk[0]) / (len(pk) - 1)
ref['brus'] = {}
for A, B in [(1.0, 3.0), (1.0, 2.2), (2.0, 5.5), (1.0, 1.5)]:
    J = np.array([[B - 1, A * A], [-B, -A * A]]); ev = np.linalg.eigvals(J)
    ts = np.linspace(0, 400 / A, 40001)
    sol = solve_ivp(lambda t, y: [A - (B + 1) * y[0] + y[0] ** 2 * y[1], B * y[0] - y[0] ** 2 * y[1]], [0, ts[-1]], [A * 1.05 + 0.05, B / A * 0.95], method='Radau', t_eval=ts, rtol=1e-11, atol=1e-13)
    n0 = len(ts) // 2; x = sol.y[0][n0:]
    ref['brus'][f'{A},{B}'] = {'ev': [float(ev[0].real), float(abs(ev[0].imag)), float(ev[1].real)], 'period': _period(ts[n0:], x) if (B > 1 + A * A) else None, 'amp': float(x.max() - x.min()) if (B > 1 + A * A) else None}
ref['bdisp'] = {}
for A, B, Dx, Dy in [(2.0, 3.2, 1.0, 8.0), (1.0, 2.5, 1.0, 8.0), (2.0, 4.0, 1.0, 16.0)]:
    ks = np.linspace(0, 2.5, 26); out = []
    for k in ks:
        Jk = np.array([[B - 1 - Dx * k * k, A * A], [-B, -A * A - Dy * k * k]]); out.append(float(np.linalg.eigvals(Jk).real.max()))
    kk = np.linspace(0, 3, 30001); Jk_ = np.zeros((len(kk), 2, 2)); Jk_[:, 0, 0] = B - 1 - Dx * kk**2; Jk_[:, 0, 1] = A * A; Jk_[:, 1, 0] = -B; Jk_[:, 1, 1] = -A * A - Dy * kk**2; lam = np.linalg.eigvals(Jk_).real.max(axis=1)
    ref['bdisp'][f'{A},{B},{Dx},{Dy}'] = {'ks': [float(k) for k in ks], 'lam': out, 'kmax': float(kk[int(np.argmax(lam))]), 'lmax': float(max(lam))}
# umbral de Turing: B mínimo con max_k Re λ > 0 (barrido numérico con numpy)
def _bturing(A, Dx, Dy):
    kk = np.linspace(0.01, 3, 600)
    for B in np.arange(1.0, 1 + A * A, 0.001):
        J = np.zeros((len(kk), 2, 2)); J[:, 0, 0] = B - 1 - Dx * kk**2; J[:, 0, 1] = A * A; J[:, 1, 0] = -B; J[:, 1, 1] = -A * A - Dy * kk**2
        if np.linalg.eigvals(J).real.max() > 1e-9: return float(B)
    return None
ref['bturing'] = {f'{A},{Dx},{Dy}': _bturing(A, Dx, Dy) for A, Dx, Dy in [(2.0, 1.0, 8.0), (1.0, 1.0, 8.0), (1.5, 1.0, 16.0)]}
# Brusselator 1D: longitud de onda del patrón (nº de máximos tras t = 400) con LSODA
def _rd(A, B, Dx, Dy, L=60.0, N=200, T=400.0, seed=11):
    dx = L / N; rng = np.random.default_rng(seed)
    y0 = np.concatenate([A + 0.02 * (rng.random(N) - 0.5), B / A + 0.02 * (rng.random(N) - 0.5)])
    def f(t, y):
        x, yy = y[:N], y[N:]; lx = (np.roll(x, 1) - 2 * x + np.roll(x, -1)) / dx**2; ly = (np.roll(yy, 1) - 2 * yy + np.roll(yy, -1)) / dx**2
        return np.concatenate([A - (B + 1) * x + x * x * yy + Dx * lx, B * x - x * x * yy + Dy * ly])
    sol = solve_ivp(f, [0, T], y0, method='LSODA', rtol=1e-6, atol=1e-8); x = sol.y[:N, -1]; m = x.mean()
    return int(sum(1 for i in range(N) if x[i] > x[i - 1] and x[i] >= x[(i + 1) % N] and x[i] > m)), float(x.max() - x.min())
ref['rd1d'] = {f'{A},{B},{Dx},{Dy}': list(_rd(A, B, Dx, Dy)) for A, B, Dx, Dy in [(2.0, 3.2, 1.0, 8.0), (2.0, 3.2, 1.0, 16.0)]}
# Oregonator de Tyson (3 variables): período del ciclo (Radau)
ref['oreg'] = {}
for fpar in [0.7, 1.0, 1.5, 2.0, 2.4]:
    eps, epsp, q = 0.04, 4e-4, 8e-4; ts = np.linspace(0, 60, 60001)
    sol = solve_ivp(lambda t, y: [(q * y[1] - y[0] * y[1] + y[0] * (1 - y[0])) / eps, (-q * y[1] - y[0] * y[1] + fpar * y[2]) / epsp, y[0] - y[2]], [0, 60], [0.01, 0.002, 0.05], method='Radau', t_eval=ts, rtol=1e-9, atol=1e-13)
    z = sol.y[2]; n0 = 20000; osc = bool(z[n0:].max() / z[n0:].min() > 1.5 and z[n0:].max() - z[n0:].min() > 0.02)
    ref['oreg'][str(fpar)] = {'osc': osc, 'period': _period(ts[n0:], z[n0:]) if osc else None, 'zmax': float(z[n0:].max()) if osc else None}
# Lotka químico
ref['lotka'] = {}
for k1a, x0, y0 in [(1.0, 0.6, 1.2), (1.0, 0.2, 0.2), (1.5, 2.5, 2.5)]:
    ts = np.linspace(0, 14 * 2 * np.pi / np.sqrt(k1a), 14001)
    sol = solve_ivp(lambda t, y: [k1a * y[0] - y[0] * y[1], y[0] * y[1] - y[1]], [0, ts[-1]], [x0, y0], method='DOP853', t_eval=ts, rtol=1e-12, atol=1e-14)
    ref['lotka'][f'{k1a},{x0},{y0}'] = {'period': _period(ts, sol.y[0]), 'xmax': float(sol.y[0].max())}
# Schlögl: raíces de la cúbica (numpy.roots)
ref['schlogl'] = {str(b): sorted(float(r.real) for r in np.roots([-1, 3, -2, b]) if abs(r.imag) < 1e-9 and r.real > 0) for b in (0.05, 0.2, 0.35, 0.5)}
# Gray–Scott: estados homogéneos (fsolve) y evolución de la malla con numpy
from scipy.optimize import fsolve
ref['gs_steady'] = {}
for F, k in [(0.03, 0.055), (0.02, 0.045), (0.05, 0.05)]:
    s = F + k; disc = 1 - 4 * s * s / F
    roots = []
    if disc >= 0:
        for g in ([0.5, 0.25], [0.9, 0.1]):
            r_ = fsolve(lambda y: [-y[0] * y[1] ** 2 + F * (1 - y[0]), y[0] * y[1] ** 2 - s * y[1]], g, xtol=1e-13)
            if r_[1] > 1e-6 and not any(abs(r_[1] - q[1]) < 1e-6 for q in roots): roots.append([float(r_[0]), float(r_[1])])
    ref['gs_steady'][f'{F},{k}'] = sorted(roots, key=lambda q: q[1])
rng = np.random.default_rng(3); N0 = 32
u0 = (1 - 0.3 * rng.random((N0, N0))).astype(np.float32); v0 = (0.25 * rng.random((N0, N0))).astype(np.float32)
u, v = u0.copy(), v0.copy(); F, k, Du, Dv = 0.04, 0.06, 0.16, 0.08
lap = lambda a: np.roll(a, 1, 0) + np.roll(a, -1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 1) - 4 * a
for _ in range(300):
    uvv = u * v * v; u, v = u + (Du * lap(u) - uvv + F * (1 - u)), v + (Dv * lap(v) + uvv - (F + k) * v)
ref['gs_grid'] = {'N': N0, 'F': F, 'k': k, 'u0': u0.ravel().tolist(), 'v0': v0.ravel().tolist(), 'u': u.ravel().tolist(), 'v': v.ravel().tolist()}

# ============ Cap. 21: disoluciones y fotoquímica ============
from scipy import constants as _c
from scipy.integrate import solve_bvp
_NA, _kB, _e, _e0 = _c.N_A, _c.k, _c.e, _c.epsilon_0
# Smoluchowski: flujo estacionario con frontera absorbente (solve_bvp) y factor de Debye (cuadratura)
ref['smol'] = {}
for T, eta, rA, rB in [(298.15, 0.890e-3, 0.25e-9, 0.25e-9), (298.15, 0.544e-3, 0.2e-9, 0.4e-9), (310.0, 2.0e-3, 0.3e-9, 0.1e-9)]:
    DA, DB = _kB * T / (6 * np.pi * eta * rA), _kB * T / (6 * np.pi * eta * rB); D = DA + DB; Rr = rA + rB
    xs = np.geomspace(Rr, 1e5 * Rr, 600)
    sol = solve_bvp(lambda r, y: np.vstack([y[1], -2 * y[1] / r]), lambda ya, yb: np.array([ya[0], yb[0] - 1.0]), xs, np.vstack([1 - Rr / xs, Rr / xs**2]), tol=1e-10, max_nodes=100000)
    k_num = 4 * np.pi * Rr**2 * D * sol.sol(Rr)[1] * _NA * 1e3
    ref['smol'][f'{T},{eta},{rA},{rB}'] = float(k_num)
ref['debye_f'] = {}
for T, epsr, zz, Rr in [(298.15, 78.4, -1, 0.5e-9), (298.15, 78.4, 2, 0.5e-9), (298.15, 78.4, -2, 0.7e-9), (298.15, 35.9, 1, 0.4e-9), (298.15, 1.89, -1, 0.5e-9)]:
    lB = zz * _e**2 / (4 * np.pi * _e0 * epsr * _kB * T)  # r_c con signo
    d_ = lB / Rr; num = integrate.quad(lambda s_: np.exp(d_ * s_), 0, 1, epsabs=0, epsrel=1e-13)[0]  # u = 1/r: ∫_R^∞ e^{lB/r}/r² dr = (1/R)∫_0^1 e^{d s} ds
    ref['debye_f'][f'{T},{epsr},{zz},{Rr}'] = float(1 / num)  # k/k_D(sin carga)
# control mixto: mecanismo con par de encuentro A + B ⇌ AB → P (B en exceso), constante observada de la cola lenta
ref['collins'] = {}
for kD, kmD, kr in [(1e10, 1e10, 1e9), (5e9, 1e9, 1e11), (1e9, 1e12, 1e12)]:
    B0 = 1e-6; A = np.array([[-(kD * B0), kmD], [kD * B0, -(kmD + kr)]])
    w = np.linalg.eigvals(A); k_slow = -max(w.real) / B0
    ref['collins'][f'{kD},{kmD},{kr}'] = float(k_slow)
# Marcus: intersección numérica de las dos parábolas (brentq)
ref['marcus'] = {}
for lam, dG in [(100.0, -40.0), (100.0, 0.0), (100.0, -200.0), (50.0, -150.0), (200.0, -120.0)]:
    x = optimize.brentq(lambda x: lam * x**2 - (lam * (x - 1)**2 + dG), -50, 50) if lam + dG != 0 else 0.0
    xs_ = (lam + dG) / (2 * lam)
    ref['marcus'][f'{lam},{dG}'] = float(lam * (optimize.fsolve(lambda x: lam * x[0]**2 - (lam * (x[0] - 1)**2 + dG), [0.3], xtol=1e-14)[0])**2)
# Stern–Volmer: población de S1 con excitación constante (ODE hasta el estado estacionario) y decaimiento tras un pulso
ref['sv'] = {}
for kr, knr, kisc, kq, Q in [(2.9e7, 2e7, 3.6e6, 6e9, 0.01), (1e8, 3e8, 5e7, 1e10, 0.02), (5e6, 1e6, 1e6, 1e8, 0.05)]:
    G = 1e20; k0 = kr + knr + kisc; kt = k0 + kq * Q
    sol0 = solve_ivp(lambda t, y: [G - k0 * y[0]], [0, 60 / k0], [0.0], method='LSODA', rtol=1e-11, atol=1e-8); S0 = sol0.y[0, -1]
    sol1 = solve_ivp(lambda t, y: [G - kt * y[0]], [0, 60 / kt], [0.0], method='LSODA', rtol=1e-11, atol=1e-8); S1 = sol1.y[0, -1]
    tt = np.linspace(0, 5 / kt, 2001); dec = solve_ivp(lambda t, y: [-kt * y[0]], [0, tt[-1]], [1.0], t_eval=tt, rtol=1e-12, atol=1e-14)
    tau = -1 / np.polyfit(tt, np.log(dec.y[0]), 1)[0]
    ref['sv'][f'{kr},{knr},{kisc},{kq},{Q}'] = {'F0F': float(S0 / S1), 'tau': float(tau)}
# ciclo de Leighton: integración de referencia (Radau) y raíz de la cuadrática del estado fotoestacionario
ref['leighton'] = {}
k3p = 1.95e-14 * 2.46e10
for J, kp, no2, no in [(0.008, 0.0, 30.0, 10.0), (0.0008, 0.0, 10.0, 40.0), (0.008, 0.004, 30.0, 10.0), (0.005, 0.01, 20.0, 5.0)]:
    f = lambda t, y: [-J * y[0] + k3p * y[1] * y[2] + kp * y[1], J * y[0] - k3p * y[1] * y[2] - kp * y[1], J * y[0] - k3p * y[1] * y[2]]
    sol = solve_ivp(f, [0, 3600], [no2, no, 0.0], method='Radau', rtol=1e-11, atol=1e-13)
    row = {'y': [float(v) for v in sol.y[:, -1]]}
    if kp == 0.0:
        N_, Dl = no2 + no, 0.0 - no; a_, b_, c_ = k3p, J - k3p * Dl, -J * (N_ + Dl); row['o3'] = float((-b_ + np.sqrt(b_**2 - 4 * a_ * c_)) / (2 * a_))
    ref['leighton'][f'{J},{kp},{no2},{no}'] = row

# ============ Cap. 22: mecánica cuántica (u.a.) ============
ref['box'] = {}
for n in (1, 2, 3, 5):
    psi2 = lambda x: 2 * np.sin(n * np.pi * x)**2
    x1 = integrate.quad(lambda x: x * psi2(x), 0, 1)[0]; x2 = integrate.quad(lambda x: x * x * psi2(x), 0, 1)[0]
    p2 = integrate.quad(lambda x: 2 * (n * np.pi * np.cos(n * np.pi * x))**2, 0, 1)[0]  # <p²> = ∫|ψ'|²
    ref['box'][str(n)] = float(np.sqrt((x2 - x1**2) * p2) / 0.5)
def _tunnel_num(E, V0, a, m, parab=False, w=None):
    if not parab:
        k = np.sqrt(2 * m * E + 0j); V = lambda x: V0 if 0 <= x <= a else 0.0
        xs = (-0.0, a)
        kk = lambda x: np.sqrt(2 * m * (E - V(x)) + 0j)
        # integra de derecha a izquierda con onda saliente e^{ikx}
        y0 = [np.exp(1j * k * a), 1j * k * np.exp(1j * k * a)]
        def f(x, y, V0=V0): return [y[1], -2 * m * (E - (V0 if 0 <= x <= a else 0.0)) * y[0]]
        s1 = solve_ivp(f, [a, 0], y0, rtol=1e-11, atol=1e-13, method='DOP853'); yl = s1.y[:, -1]
        A = 0.5 * (yl[0] + yl[1] / (1j * k))  # coeficiente de e^{ikx} a la izquierda
        return float(1 / abs(A)**2)
    X = 12.0 / np.sqrt(m * w)
    k = lambda x: np.sqrt(2 * m * (E - V0 + 0.5 * m * w * w * x * x) + 0j)
    kr = k(X); y0 = [1 + 0j, 1j * kr]
    f = lambda x, y: [y[1], -2 * m * (E - V0 + 0.5 * m * w * w * x * x) * y[0]]
    s = solve_ivp(f, [X, -X], y0, rtol=1e-11, atol=1e-13, method='DOP853'); yl = s.y[:, -1]; kl = k(-X)
    A = 0.5 * (yl[0] + yl[1] / (1j * kl)); return float(kr.real / kl.real / abs(A)**2) if False else float((kr.real / kl.real) / abs(A)**2)
ref['tun_rect'] = {f'{E},{V0},{a},{m}': _tunnel_num(E, V0, a, m) for E, V0, a, m in [(0.5, 1.0, 2.0, 1.0), (0.2, 1.0, 3.0, 1.0), (1.5, 1.0, 2.0, 1.0), (0.01, 0.04, 5.0, 10.0), (2.0, 1.0, 1.0, 5.0)]}
ref['tun_parab'] = {f'{E},{V0},{w}': _tunnel_num(E, V0, 0, 1.0, True, w) for E, V0, w in [(0.5, 1.0, 0.3), (0.8, 1.0, 0.5), (1.0, 1.0, 0.4), (1.3, 1.0, 0.6)]}
ref['bell'] = {str(u): float(integrate.quad(lambda e: np.exp(-e) / (1 + np.exp(-2 * np.pi * e / u)), -80, 80, limit=500)[0]) for u in (0.5, 1.5, 3.0, 5.0)}
ref['ho'] = {}
for v, y in [(0, 0.3), (2, 0.7), (5, -1.1), (8, 2.0)]:
    m_, w_ = 1.0, 1.0; N = 1 / np.sqrt(2.0**v * float(__import__('math').factorial(v))) * (m_ * w_ / np.pi)**0.25
    ref['ho'][f'{v},{y}'] = float(N * np.exp(-0.5 * y * y) * special.eval_hermite(v, y))
# Morse (HCl, u.a.): diagonalización por diferencias finitas
from scipy.linalg import eigh_tridiagonal
_mu = 0.97959 * 1822.888486209; _w = 2990.95 / 219474.6313632; _D = 2990.95**2 / (4 * 52.82) / 219474.6313632; _a = _w * np.sqrt(_mu / (2 * _D)); _re = 2.409
_r = np.linspace(0.8, 12.0, 6001); _h = _r[1] - _r[0]
_V = _D * (1 - np.exp(-_a * (_r - _re)))**2
_ev = eigh_tridiagonal(1 / (_mu * _h**2) + _V, -1 / (2 * _mu * _h**2) * np.ones(len(_r) - 1), select='i', select_range=(0, 7))[0]
ref['morse'] = {'mu': _mu, 'D': _D, 'a': _a, 're': _re, 'E': [float(x) for x in _ev]}
import math as _m
_pts = [(1, 0.3, 0.0), (2, 1.1, 0.7), (3, 2.0, 2.9)]
ref['ylm'] = {f'{l},{mm},{th},{ph}': float(np.sqrt(2) * np.real(special.sph_harm(mm, l, ph, th)) if mm > 0 else np.real(special.sph_harm(mm, l, ph, th))) for l, mm, th, ph in [(1, 0, 0.3, 0.0), (2, 1, 1.1, 0.7), (3, 2, 2.0, 0.9), (4, 3, 0.8, 1.9), (2, 0, 2.5, 0.0)]}

# ============ Cap. 23: átomos ============
import math as _m2
ref['hydR'] = {}
for n, l, Z, r in [(1, 0, 1, 0.8), (2, 0, 1, 3.0), (2, 1, 1, 2.0), (3, 1, 2, 1.7), (3, 2, 1, 6.0), (4, 2, 3, 2.2), (5, 3, 1, 10.0)]:
    rho = 2 * Z * r / n; Nn = np.sqrt((2 * Z / n)**3 * _m2.factorial(n - l - 1) / (2 * n * _m2.factorial(n + l)))
    ref['hydR'][f'{n},{l},{Z},{r}'] = float(Nn * np.exp(-rho / 2) * rho**l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho))
# energías del hidrogenoide: diagonalización de la ecuación radial u'' (diferencias finitas)
ref['hydE'] = {}
for l in (0, 1, 2):
    rr = np.linspace(0, 200, 20001)[1:]; h_ = rr[1] - rr[0]; Vr = -1.0 / rr + l * (l + 1) / (2 * rr**2)
    ev = eigh_tridiagonal(1 / h_**2 + Vr, -1 / (2 * h_**2) * np.ones(len(rr) - 1), select='i', select_range=(0, 2))[0]
    ref['hydE'][str(l)] = [float(x) for x in ev]
# helio: <1/r12> para 1s·1s por cuadratura doble con el promedio angular 1/max(r1, r2)
def _J(z):
    rho = lambda r: z**3 / np.pi * np.exp(-2 * z * r)
    f = lambda r2, r1: (4 * np.pi * r1**2 * rho(r1)) * (4 * np.pi * r2**2 * rho(r2)) / max(r1, r2)
    inner = lambda r1: integrate.quad(lambda r2: f(r2, r1), 0, r1, epsabs=1e-13)[0] + integrate.quad(lambda r2: f(r2, r1), r1, 60 / z, epsabs=1e-13)[0]
    return integrate.quad(inner, 0, 60 / z, epsabs=1e-11, limit=200)[0]
ref['heJ'] = {str(z): float(_J(z)) for z in (1.0, 1.6875, 2.5)}
ref['heMin'] = {str(Z): float(optimize.minimize_scalar(lambda z: z * z - 2 * Z * z + 5 * z / 8, bounds=(0.1, 10), method='bounded', options={'xatol': 1e-10}).fun) for Z in (1, 2, 3, 4)}
# términos: nº de términos con (L, S) por la fórmula de Hund con la tabla de microestados (independiente del algoritmo voraz)
import itertools
def _terms(l, n):
    orb = [(ml, ms) for ml in range(-l, l + 1) for ms in (1, -1)]; tab = {}
    for c in itertools.combinations(orb, n):
        key = (sum(o[0] for o in c), sum(o[1] for o in c)); tab[key] = tab.get(key, 0) + 1
    g = lambda ML, MS: tab.get((ML, MS), 0); out = []
    for L in range(0, n * l + 1):
        for S2 in range(0, n + 1):
            cnt = g(L, S2) - g(L + 1, S2) - g(L, S2 + 2) + g(L + 1, S2 + 2)
            out += [[S2 / 2, L]] * cnt
    return out
ref['terms'] = {f'{l},{n}': _terms(l, n) for l, n in [(1, 2), (1, 3), (1, 4), (2, 2), (2, 3), (2, 5), (2, 7)]}

# ============ Cap. 24: enlace químico ============
from scipy.linalg import eigh as _eigh
def _h2p_num(R, z):
    # integrales por cuadratura en coordenadas cilíndricas (ρ, z) con los núcleos en ±R/2
    ra = lambda rho, zz: np.hypot(rho, zz + R / 2); rb = lambda rho, zz: np.hypot(rho, zz - R / 2)
    N = (z**3 / np.pi)**0.5; pa = lambda rho, zz: N * np.exp(-z * ra(rho, zz)); pb = lambda rho, zz: N * np.exp(-z * rb(rho, zz))
    I = lambda f: integrate.dblquad(lambda rho, zz: 2 * np.pi * rho * f(rho, zz), -30, 30, 0, 30, epsabs=1e-10, epsrel=1e-10)[0]
    S = I(lambda r, q: pa(r, q) * pb(r, q))
    T_aa = I(lambda r, q: 0.5 * z**2 * pa(r, q)**2)  # ∇φ·∇φ = ζ²φ²
    T_ab = I(lambda r, q: 0.5 * z**2 * pa(r, q) * pb(r, q) * ((r * r + (q + R / 2) * (q - R / 2)) / (ra(r, q) * rb(r, q))))
    Vaa = I(lambda r, q: -pa(r, q)**2 * (1 / ra(r, q) + 1 / rb(r, q)))
    Vab = I(lambda r, q: -pa(r, q) * pb(r, q) * (1 / ra(r, q) + 1 / rb(r, q)))
    Haa, Hab = T_aa + Vaa, T_ab + Vab
    return {'S': S, 'Haa': Haa, 'Hab': Hab, 'Eg': (Haa + Hab) / (1 + S) + 1 / R, 'Eu': (Haa - Hab) / (1 - S) + 1 / R}
ref['h2p'] = {f'{R},{z}': _h2p_num(R, z) for R, z in [(2.0, 1.0), (2.5, 1.0), (4.0, 1.0), (2.0, 1.238)]}
_hk = {}
for name, (A_, N_) in {'butadieno': (np.diag(np.ones(3), 1) + np.diag(np.ones(3), -1), 4), 'benceno': (np.roll(np.eye(6), 1, 0) + np.roll(np.eye(6), -1, 0), 6), 'hexatrieno': (np.diag(np.ones(5), 1) + np.diag(np.ones(5), -1), 6)}.items():
    w, v = np.linalg.eigh(A_); w, v = w[::-1], v[:, ::-1]; occ = np.zeros(len(w)); occ[:N_ // 2] = 2
    if name == 'benceno': occ[:] = [2, 1, 1, 1, 1, 0]  # HOMO degenerada: reparto igual (2 electrones entre 2 orbitales ⇒ 2,2 al estar llenos): se corrige abajo
    if name == 'benceno': occ[:] = [2, 2, 2, 0, 0, 0]
    _hk[name] = {'x': [float(a) for a in w], 'Epi': float((occ * w).sum()), 'p12': float((occ * v[0] * v[1]).sum())}
ref['huckel'] = _hk
w, v = np.linalg.eigh(np.array([[1 if (i, j) in [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0), (5, 6), (6, 7), (7, 8), (8, 9), (9, 4)] or (j, i) in [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0), (5, 6), (6, 7), (7, 8), (8, 9), (9, 4)] else 0 for j in range(10)] for i in range(10)])); w, v = w[::-1], v[:, ::-1]
ref['naft'] = {'Epi': float(2 * w[:5].sum()), 'p01': float(2 * (v[0, :5] * v[1, :5]).sum()), 'p12': float(2 * (v[1, :5] * v[2, :5]).sum()), 'p49': float(2 * (v[4, :5] * v[9, :5]).sum()), 'gap': float(w[4] - w[5])}

# ============ Cap. 25: integrales de gaussianas. Las s se calculan con las fórmulas cerradas de Szabo–Ostlund (apéndice A);
# las p por derivación numérica respecto del centro: p_x(A) = (1/2a) ∂/∂A_x s(A)  ============
from scipy.special import erf as _erf
def _F0(x): return 0.5 * np.sqrt(np.pi / x) * _erf(np.sqrt(x)) if x > 1e-12 else 1.0
def _s_ovl(a, A, b, B): p = a + b; R2 = np.sum((A - B)**2); return (np.pi / p)**1.5 * np.exp(-a * b / p * R2)
def _s_kin(a, A, b, B): p = a + b; R2 = np.sum((A - B)**2); q = a * b / p; return q * (3 - 2 * q * R2) * _s_ovl(a, A, b, B)
def _s_nuc(a, A, b, B, C, Z): p = a + b; P = (a * A + b * B) / p; R2 = np.sum((A - B)**2); return -Z * 2 * np.pi / p * np.exp(-a * b / p * R2) * _F0(p * np.sum((P - C)**2))
def _s_eri(a, A, b, B, c, C, d, D):
    p, q = a + b, c + d; P, Q = (a * A + b * B) / p, (c * C + d * D) / q; al = p * q / (p + q)
    return 2 * np.pi**2.5 / (p * q * np.sqrt(p + q)) * np.exp(-a * b / p * np.sum((A - B)**2) - c * d / q * np.sum((C - D)**2)) * _F0(al * np.sum((P - Q)**2))
def _dx(f, X, k, h=1e-3):  # derivada numérica central respecto de la coordenada k de X
    e = np.zeros(3); e[k] = h; return (f(X + e) - f(X - e)) / (2 * h)
_A, _B, _C = np.array([0.1, -0.2, 0.3]), np.array([0.9, 0.4, -0.5]), np.array([-0.3, 0.6, 0.8]); _a, _b, _c, _d = 0.8, 1.3, 0.6, 1.9
ref['gint'] = {
    'S_sA_sB': _s_ovl(_a, _A, _b, _B), 'T_sA_sB': _s_kin(_a, _A, _b, _B), 'V_sA_sB': _s_nuc(_a, _A, _b, _B, _C, 2.0),
    'S_pxA_sB': _dx(lambda X: _s_ovl(_a, X, _b, _B), _A, 0) / (2 * _a),
    'S_pxA_pyB': _dx(lambda Y: _dx(lambda X: _s_ovl(_a, X, _b, Y), _A, 0), _B, 1, 1e-3) / (4 * _a * _b),
    'T_pyA_sB': _dx(lambda X: _s_kin(_a, X, _b, _B), _A, 1) / (2 * _a),
    'V_pzA_sB': _dx(lambda X: _s_nuc(_a, X, _b, _B, _C, 2.0), _A, 2) / (2 * _a),
    'V_pxA_pxB': _dx(lambda Y: _dx(lambda X: _s_nuc(_a, X, _b, Y, _C, 2.0), _A, 0), _B, 0) / (4 * _a * _b),
    'E_ssss': _s_eri(_a, _A, _b, _B, _c, _C, _d, _A + 0.2),
    'E_pxsss': _dx(lambda X: _s_eri(_a, X, _b, _B, _c, _C, _d, _A + 0.2), _A, 0) / (2 * _a),
    'E_pxs_pxs': _dx(lambda Y: _dx(lambda X: _s_eri(_a, X, _b, _B, _c, Y, _d, _A + 0.2), _A, 0), _C, 0) / (4 * _a * _c),
}
ref['gint_geo'] = {'A': _A.tolist(), 'B': _B.tolist(), 'C': _C.tolist(), 'a': _a, 'b': _b, 'c': _c, 'd': _d}

# ============ Cap. 26: simetría molecular (pymatgen PointGroupAnalyzer) ============
from pymatgen.core import Molecule as _Mol
from pymatgen.symmetry.analyzer import PointGroupAnalyzer as _PGA
_th = np.arccos(np.sqrt((np.cos(np.radians(106.7)) + 0.5) / 1.5))
_mols = {
    'H2O': (['O', 'H', 'H'], [[0, 0, 0], [0, 0.757, -0.587], [0, -0.757, -0.587]]),
    'CH2O': (['C', 'O', 'H', 'H'], [[0, 0, 0], [0, 0, 1.205], [0, 0.943, -0.587], [0, -0.943, -0.587]]),
    'NH3': (['N', 'H', 'H', 'H'], [[0, 0, 0.116]] + [[1.012 * np.sin(np.pi - _th) * np.cos(2 * np.pi * k / 3), 1.012 * np.sin(np.pi - _th) * np.sin(2 * np.pi * k / 3), 1.012 * np.cos(np.pi - _th) + 0.116] for k in range(3)]),
    'CH4': (['C', 'H', 'H', 'H', 'H'], [[0, 0, 0]] + [[x * 0.6276 for x in v] for v in ([1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1])]),
    'C2H4': (['C', 'C', 'H', 'H', 'H', 'H'], [[0, 0, 0.667], [0, 0, -0.667]] + [[0, 0.923 * a, 1.238 * b] for a, b in ((1, 1), (1, -1), (-1, 1), (-1, -1))]),
    'BF3': (['B', 'F', 'F', 'F'], [[0, 0, 0]] + [[1.313 * np.cos(2 * np.pi * k / 3), 1.313 * np.sin(2 * np.pi * k / 3), 0] for k in range(3)]),
    'CO2': (['C', 'O', 'O'], [[0, 0, 0], [0, 0, 1.16], [0, 0, -1.16]]),
}
ref['pg'] = {}
for k, (el, xyz) in _mols.items():
    a = _PGA(_Mol(el, xyz), tolerance=0.01); ref['pg'][k] = [a.sch_symbol, len(a.get_symmetry_operations())]

# ============ Cap. 27: vibración–rotación del oscilador de Morse (diagonalización numérica con término rotacional) ============
_mu2 = 0.97959 * 1822.888486209; _w2 = 2990.946 / 219474.6313632; _D2 = 2990.946**2 / (4 * 52.8186) / 219474.6313632; _a2 = _w2 * np.sqrt(_mu2 / (2 * _D2)); _Be2 = 10.5934; _re2 = np.sqrt(16.8576 / (0.97959 * _Be2)) / 0.529177210903
_r2 = np.linspace(0.8, 14.0, 7001); _h2 = _r2[1] - _r2[0]
def _levels(J):
    V_ = _D2 * (1 - np.exp(-_a2 * (_r2 - _re2)))**2 + J * (J + 1) / (2 * _mu2 * _r2**2)
    return eigh_tridiagonal(1 / (_mu2 * _h2**2) + V_, -1 / (2 * _mu2 * _h2**2) * np.ones(len(_r2) - 1), select='i', select_range=(0, 2))[0] * 219474.6313632
_E0, _E1 = _levels(0), _levels(1)
ref['rv_morse'] = {'Bv': [float((_E1[v] - _E0[v]) / 2) for v in range(3)], 'Be': _Be2, 'we': 2990.946, 'wx': 52.8186}
# estadística de espín nuclear: dimensiones de los subespacios simétrico y antisimétrico del producto de dos espines I (enumeración)
ref['spin'] = {}
for I2 in (0, 1, 2, 3):  # 2I
    n = I2 + 1; basis = list(itertools.product(range(n), repeat=2)); sym = len({tuple(sorted(b)) for b in basis}); asym = len(basis) - sym
    ref['spin'][str(I2 / 2)] = [sym, asym]

# ============ Cap. 28: espectroscopía electrónica y RMN ============
from scipy.special import comb as _comb, eval_hermite as _eh
from scipy import constants as _c2
def _hofn(v, x): return (1 / np.pi**0.25) / np.sqrt(2.0**v * float(__import__('math').factorial(v))) * np.exp(-x * x / 2) * _eh(v, x)
ref['fc'] = {}
for S_ in (0.5, 1.5, 3.0):
    x0 = np.sqrt(2 * S_)  # desplazamiento adimensional (S = x0²/2)
    ref['fc'][str(S_)] = [float(integrate.quad(lambda x: _hofn(0, x) * _hofn(v, x - x0), -30, 30, epsabs=1e-13, epsrel=1e-13)[0]**2) for v in range(6)]
# sistema AB con matrices de Pauli y producto de Kronecker (independiente de la base escrita a mano)
_sx = np.array([[0, 1], [1, 0]]) / 2; _sy = np.array([[0, -1j], [1j, 0]]) / 2; _sz = np.array([[1, 0], [0, -1]]) / 2; _e2 = np.eye(2)
def _ab(nuA, nuB, J):
    H = nuA * np.kron(_sz, _e2) + nuB * np.kron(_e2, _sz) + J * (np.kron(_sx, _sx) + np.kron(_sy, _sy) + np.kron(_sz, _sz))
    w, v = np.linalg.eigh(H.real if np.allclose(H.imag, 0) else H); Fx = np.kron(_sx, _e2) + np.kron(_e2, _sx); out = []
    for i in range(4):
        for j in range(i + 1, 4):
            I = abs(v[:, i].conj() @ Fx @ v[:, j])**2
            if I > 1e-9: out.append([float(abs(w[j] - w[i])), float(I)])
    return sorted(out)
ref['ab'] = {f'{a},{b},{J}': _ab(a, b, J) for a, b, J in [(300.0, 260.0, 12.0), (1000.0, 1000.0 - 15, 7.0), (500.0, 470.0, 3.0), (800.0, 600.0, 10.0)]}
ref['nmr'] = {'gamma_p': float(_c2.physical_constants['proton gyromag. ratio over 2 pi'][0]), 'dN': float(_c2.h * 400e6 / (2 * _c2.k * 298.15)), 'pascal': {str(n): [int(_comb(n, k)) for k in range(n + 1)] for n in range(0, 7)}}
ref['hk_chain'] = {str(N): float(2 * np.cos(N // 2 * np.pi / (N + 1)) - (-2 * np.cos(N // 2 * np.pi / (N + 1)))) for N in (2, 4, 6, 8, 22)}

# ============ Cap. 29: mecánica estadística ============
_kc = 0.6950348004
def _lnq_h2(T, B=60.853):
    th = B / _kc; return np.log(sum((3 if J % 2 else 1) * (2 * J + 1) * np.exp(-th * J * (J + 1) / T) for J in range(80)))
def _U_h2(T, d=1e-3): return 8.314462618 * T * T * (_lnq_h2(T + d) - _lnq_h2(T - d)) / (2 * d)
ref['h2rot'] = {str(T): float((_U_h2(T + 1e-2) - _U_h2(T - 1e-2)) / 2e-2) for T in (30.0, 60.0, 120.0, 300.0)}
def _schot(g1, D, T, d=1e-4):
    lnq = lambda t: np.log(1 + g1 * np.exp(-D / (_kc * t)))
    U = lambda t: 8.314462618 * t * t * (lnq(t + d) - lnq(t - d)) / (2 * d)
    return float((U(T + 0.01) - U(T - 0.01)) / 0.02)
ref['schot'] = {f'{g1},{D},{T}': _schot(g1, D, T) for g1, D, T in [(1, 300.0, 100.0), (1, 300.0, 180.0), (3, 300.0, 150.0), (2, 1000.0, 400.0), (1, 121.1, 298.15)]}
_x = optimize.minimize_scalar(lambda x: -(x**2 * np.exp(x) / (1 + np.exp(x))**2) if False else -(x**2 * np.exp(-x) / (1 + np.exp(-x))**2), bounds=(0.5, 6), method='bounded', options={'xatol': 1e-12})
ref['schot_max'] = {'x': float(_x.x), 'cv': float(-_x.fun)}

# ============ Cap. 30: Saha (scipy.constants) ============
def _saha(T, I_eV, g0, gi):
    return 2 * gi / g0 * (2 * np.pi * _c2.m_e * _c2.k * T / _c2.h**2)**1.5 * np.exp(-I_eV * _c2.e / (_c2.k * T))
ref['saha'] = {f'{T},{I},{g0},{gi}': float(_saha(T, I, g0, gi)) for T, I, g0, gi in [(5772, 13.598, 2, 1), (10000, 13.598, 2, 1), (20000, 24.587, 1, 2), (5000, 5.139, 2, 1)]}

# ============ Cap. 31: líquido de Lennard–Jones (MC independiente en numpy) y B2 (scipy.quad) ============
def _lj_mc(N, rho, T, eq=400, prod=1200, seed=7):
    rng = np.random.default_rng(seed); nc = round((N / 4) ** (1 / 3)); n = 4 * nc**3; Lb = (n / rho) ** (1 / 3); rc = min(Lb / 2, 3.0); a = Lb / nc
    bas = np.array([[0, 0, 0], [.5, .5, 0], [.5, 0, .5], [0, .5, .5]]); x = np.array([(np.array([i, j, k]) + b) * a for i in range(nc) for j in range(nc) for k in range(nc) for b in bas])
    def eone(i, p):
        d = x - p; d -= Lb * np.round(d / Lb); r2 = (d**2).sum(1); r2[i] = np.inf; m = r2 < rc * rc; s6 = 1 / r2[m]**3; return (4 * (s6 * s6 - s6)).sum()
    delta = 0.12 * a; acc = tot = 0; U = []; W = []
    for sw in range(eq + prod):
        for _ in range(n):
            i = rng.integers(n); new = x[i] + (rng.random(3) - .5) * 2 * delta; dE = eone(i, new) - eone(i, x[i]); tot += 1
            if dE <= 0 or rng.random() < np.exp(-dE / T): x[i] = new % Lb; acc += 1
        if sw < eq and sw % 20 == 19: delta *= 1.1 if acc / tot > .5 else .9; acc = tot = 0
        if sw >= eq:
            d = x[:, None, :] - x[None, :, :]; d -= Lb * np.round(d / Lb); r2 = (d**2).sum(2)[np.triu_indices(n, 1)]; m = r2 < rc * rc; s6 = 1 / r2[m]**3
            U.append((4 * (s6 * s6 - s6)).sum() / n); W.append((24 * (2 * s6 * s6 - s6)).sum())
    tu = (8 / 3) * np.pi * rho * ((1 / rc)**9 / 3 - (1 / rc)**3); tp = (16 / 3) * np.pi * rho**2 * (2 / 3 * (1 / rc)**9 - (1 / rc)**3)
    return float(np.mean(U) + tu), float(rho * T + np.mean(W) / (3 * Lb**3) + tp)
ref['ljmc'] = {f'{rho},{T}': list(_lj_mc(108, rho, T)) for rho, T in [(0.8, 1.5), (0.3, 2.0)]}
ref['ljB2'] = {str(T): float(-2 * np.pi * integrate.quad(lambda r: (np.exp(-4 * (r**-12 - r**-6) / T) - 1) * r * r, 0, np.inf, limit=400)[0]) for T in (0.8, 1.0, 2.0, 5.0)}
ref['ljBoyle'] = float(optimize.brentq(lambda T: -2 * np.pi * integrate.quad(lambda r: (np.exp(-4 * (r**-12 - r**-6) / T) - 1) * r * r, 0, np.inf, limit=400)[0], 2.5, 5.0, xtol=1e-10))

# ============ Cap. 32: superficies ============
ref['sigmaW'] = {str(T): float(P('I', 'T', T, 'Q', 0, 'Water')) for T in (275.0, 298.15, 323.15, 373.15, 473.15)}
def _rise(gam, rho, a):  # ascenso capilar con θ = 0: menisco axisimétrico de Young–Laplace parametrizado por el radio de curvatura b en el vértice
    g_ = 9.80665
    def wall(b):
        h = 2 * gam / (rho * g_ * b); r0 = 1e-9 * b
        def f(s, y):
            r, z, psi = y; return [np.cos(psi), np.sin(psi), rho * g_ * (h + z) / gam - np.sin(psi) / r]
        ev = lambda s, y: y[2] - np.pi / 2; ev.terminal = True
        sol = solve_ivp(f, [0, 50 * b], [r0, 0.0, r0 / b], events=ev, rtol=1e-11, atol=1e-14, max_step=b / 400)
        return sol.y_events[0][0][0], h
    h0 = 2 * gam / (rho * g_ * a); bmin, bmax = a * 0.7, 1.5 * a
    b_ = optimize.brentq(lambda b: wall(b)[0] - a, bmin, bmax, xtol=1e-12 * a)
    return float(wall(b_)[1])
ref['rise'] = {f'{a}': [_rise(0.07197, 997.05, a * 1e-3), 2 * 0.07197 / (997.05 * 9.80665 * a * 1e-3)] for a in (0.2, 0.5, 1.0)}
ref['gibbs'] = {}
for G_, a_, c_ in [(3.2e-6, 1.1e-4, 1e-3), (3.2e-6, 1.1e-4, 5e-5), (5e-6, 1e-3, 2e-3)]:
    gam = lambda lc: -8.314462618 * 298.15 * G_ * np.log(1 + np.exp(lc) / a_); lc = np.log(c_); d = 1e-5
    ref['gibbs'][f'{G_},{a_},{c_}'] = float(-(gam(lc + d) - gam(lc - d)) / (2 * d) / (8.314462618 * 298.15))
ref['kelvin'] = {}
for r_nm, T in [(1.0, 298.15), (10.0, 298.15), (100.0, 298.15), (5.0, 323.15)]:
    gam = float(P('I', 'T', T, 'Q', 0, 'Water')); Vm = 0.018015268 / float(P('D', 'T', T, 'Q', 0, 'Water')); PL = lambda x: x  # ΔP_L = 2γ/r; ln(P/P0) = ∫ V dP/RT (V constante)
    ref['kelvin'][f'{r_nm},{T}'] = float(np.exp(integrate.quad(lambda x: Vm / (8.314462618 * T), 0, 2 * gam / (r_nm * 1e-9))[0]))
ref['young'] = {}
for glv, gsv, gsl in [(0.072, 0.040, 0.030), (0.072, 0.070, 0.010), (0.030, 0.050, 0.020), (0.072, 0.020, 0.060)]:
    V = 1e-9; res = optimize.minimize_scalar(lambda t: (lambda th: glv * 2 * np.pi * (V / (np.pi * (2 - 3 * np.cos(th) + np.cos(th)**3) / 3))**(2 / 3) * (1 - np.cos(th)) + (gsl - gsv) * np.pi * (np.sin(th))**2 * (V / (np.pi * (2 - 3 * np.cos(th) + np.cos(th)**3) / 3))**(2 / 3))(t), bounds=(1e-3, np.pi - 1e-3), method='bounded', options={'xatol': 1e-12})
    ref['young'][f'{glv},{gsv},{gsl}'] = float(np.degrees(res.x)) if abs((gsv - gsl) / glv) < 1 else None

# ============ Cap. 33: adsorción ============
_x = np.array([0.02 + i * 0.58 / 29 for i in range(30)]); _nm0 = 57.4
_n = np.array([_nm0 * (C_ * x / ((1 - x) * (1 + (C_ - 1) * x))) * (1 + 0.01 * np.sin(37 * i + 3)) for i, x in enumerate(_x) for C_ in [90.0]])
ref['bet'] = {}
for lo, hi in [(0.05, 0.30), (0.05, 0.20), (0.10, 0.35)]:
    m = (_x >= lo - 1e-9) & (_x <= hi + 1e-9); y = _x[m] / (_n[m] * (1 - _x[m])); sl, ic = np.polyfit(_x[m], y, 1)
    ref['bet'][f'{lo},{hi}'] = {'nm': float(1 / (sl + ic)), 'C': float(sl / ic + 1)}
ref['bet_data'] = {'x': _x.tolist(), 'n': _n.tolist()}
def _tpd_peak(E, nu, beta):
    sol = solve_ivp(lambda T, th: [-nu * np.exp(-E / (8.314462618 * T)) * th[0] / beta], [150, 1200], [1.0], method='LSODA', rtol=1e-11, atol=1e-14, dense_output=True)
    Ts = np.linspace(200, 800, 60001); th = sol.sol(Ts)[0]; rate = nu * np.exp(-E / (8.314462618 * Ts)) * th
    return float(Ts[np.argmax(rate)])
ref['tpd'] = {f'{E},{nu},{b}': _tpd_peak(E, nu, b) for E, nu, b in [(120e3, 1e13, 2.0), (60e3, 1e13, 2.0), (60e3, 1e13, 20.0), (60e3, 1e10, 2.0)]}
# calor isostérico de Langmuir: ajuste lineal de ln P frente a 1/T a θ fijo
_q = 25e3; _Ts = np.array([280.0, 300.0, 320.0, 340.0]); _K = lambda T: 3e-7 * np.exp(_q / (8.314462618 * T)); _th = 0.4
_P = _th / ((1 - _th) * _K(_Ts)); ref['isost'] = float(-8.314462618 * np.polyfit(1 / _Ts, np.log(_P), 1)[0])

# ============ Cap. 34: coloides ============
_e, _kB, _NA, _e0, _er = 1.602176634e-19, 1.380649e-23, 6.02214076e23, 8.8541878128e-12, 78.38
def _pb(psi0, c, z=1, T=298.15):  # Poisson–Boltzmann 1D para un electrolito z:z (solve_bvp), potencial en x
    n = c * 1e3 * _NA; kap = np.sqrt(2 * n * z * z * _e * _e / (_er * _e0 * _kB * T)); L = 15 / kap
    f = lambda x, y: np.vstack([y[1], (2 * n * z * _e / (_er * _e0)) * np.sinh(z * _e * y[0] / (_kB * T))])
    bc = lambda ya, yb: np.array([ya[0] - psi0, yb[0]]); xs = np.linspace(0, L, 400); y0 = np.vstack([psi0 * np.exp(-kap * xs), -kap * psi0 * np.exp(-kap * xs)])
    sol = solve_bvp(f, bc, xs, y0, tol=1e-10, max_nodes=100000); return sol, kap
ref['pb'] = {}
for psi0, c in [(0.08, 0.01), (0.05, 0.001), (0.15, 0.1)]:
    sol, kap = _pb(psi0, c); ref['pb'][f'{psi0},{c}'] = [[float(k / kap), float(sol.sol(k / kap)[0])] for k in (0.5, 1.0, 2.0, 4.0)]
ref['ccc_analytic'] = {}
for z in (1, 2, 3):
    A = 1e-20; kT = _kB * 298.15
    n = (768 * np.pi * kT / (np.e * A))**2 * (_er * _e0 * kT / (2 * z * z * _e * _e))**3
    ref['ccc_analytic'][str(z)] = float(n / (1e3 * _NA))

# ============ Cap. 35: polímeros ============
from scipy.spatial import ConvexHull
def _fFH(phi, N, chi): return phi * np.log(phi) / N + (1 - phi) * np.log(1 - phi) + chi * phi * (1 - phi)
def _binodal_hull(N, chi, n=40001):
    phi = np.linspace(1e-9, 1 - 1e-9, n); f = _fFH(phi, N, chi); pts = np.column_stack([phi, f]); h = ConvexHull(pts)
    idx = sorted(set(h.vertices)); low = [i for i in idx]
    # tramo de la envolvente inferior con mayor salto de φ
    low.sort(); gaps = [(phi[low[k + 1]] - phi[low[k]], k) for k in range(len(low) - 1) if f[low[k]] < 0.0 or True]
    g, k = max(gaps); return float(phi[low[k]]), float(phi[low[k + 1]])
ref['fh_binodal'] = {f'{N},{chi}': list(_binodal_hull(N, chi)) for N, chi in [(1, 2.5), (10, 1.0), (100, 0.7)]}
ref['fh_crit'] = {str(N): float(optimize.minimize_scalar(lambda x: 0.5 * (1 / (N * x) + 1 / (1 - x)), bounds=(1e-4, 0.9999), method='bounded', options={'xatol': 1e-12}).fun) for N in (1, 10, 100, 1000)}
import itertools as _it
def _zb(N, sig, s):
    Z = th = 0.0
    for st in _it.product([0, 1], repeat=N):
        w = 1.0; prev = 0
        for x in st:
            if x == 1: w *= s * (sig if prev == 0 else 1.0)
            prev = x
        Z += w; th += w * sum(st)
    return float(th / Z / N)
ref['zb'] = {f'{N},{sig},{s_}': _zb(N, sig, s_) for N, sig, s_ in [(12, 1e-2, 0.7), (12, 1e-2, 1.0), (12, 1e-2, 1.5), (10, 1e-3, 1.2)]}
ref['langevin'] = {str(x): float(optimize.brentq(lambda b: 1 / np.tanh(b) - 1 / b - x, 1e-6, 1e4)) for x in (0.1, 0.5, 0.9, 0.99)}
ref['flory'] = {str(pp): [float(sum(n * (1 - pp) * pp**(n - 1) for n in range(1, 20001))), float(sum(n * n * (1 - pp) * pp**(n - 1) for n in range(1, 20001)) / sum(n * (1 - pp) * pp**(n - 1) for n in range(1, 20001)))] for pp in (0.9, 0.99, 0.995)}

# ============ Cap. 36: teoría cinética ============
ref['transp'] = {}
for k, f in [('Ar', 'Argon'), ('N2', 'Nitrogen'), ('He', 'Helium'), ('O2', 'Oxygen'), ('CO2', 'CO2'), ('CH4', 'Methane')]:
    ref['transp'][k] = {str(T): [float(P('V', 'T', T, 'P', 101325, f)), float(P('L', 'T', T, 'P', 101325, f))] for T in (300, 500, 800)}
_kb, _mu = 1.380649e-23, 1.66053906660e-27
def _mb(M, T, v0):
    m = M / 6.02214076e23; a = m / (2 * np.pi * _kb * T); f = lambda v: 4 * np.pi * (a**1.5) * v * v * np.exp(-a * m / m * 0 - m * v * v / (2 * _kb * T))
    mean = integrate.quad(lambda v: v * f(v), 0, np.inf)[0]; rms = np.sqrt(integrate.quad(lambda v: v * v * f(v), 0, np.inf)[0]); above = integrate.quad(f, v0, np.inf)[0]
    # flujo sobre una pared: ∫_{vz>0} vz f3(v) d³v / n, con coordenadas esféricas
    flux = integrate.dblquad(lambda th, v: v * np.cos(th) * (a**1.5) * np.exp(-m * v * v / (2 * _kb * T)) * 2 * np.pi * np.sin(th) * v * v, 0, 30000, 0, np.pi / 2, epsabs=1e-10, epsrel=1e-10)[0]
    return [float(mean), float(rms), float(above), float(flux)]
ref['mb'] = {f'{M},{T},{v0}': _mb(M, T, v0) for M, T, v0 in [(0.0280134, 298.15, 1000.0), (0.0040026, 500.0, 2500.0), (0.0440095, 1000.0, 900.0)]}

# ============ Cap. 37: difusión ============
from scipy.sparse import diags as _diags
from scipy.sparse.linalg import expm_multiply as _expm
ref['dif_erf'] = {str(x): float(special.erf(x)) for x in (0.05, 0.3, 0.8, 1.5, 2.4, 3.2, 4.5)}
def _mol_neumann(n, L, c0, D, t, x0=0.0):
    h = L / (n - 1); main = -2 * np.ones(n); main[0] = main[-1] = -2; up = np.ones(n - 1); lo = np.ones(n - 1); up[0] = 2; lo[-1] = 2
    A = _diags([lo, main, up], [-1, 0, 1], format='csc') * (D / h**2)
    return np.linspace(x0, x0 + L, n), _expm(A * t, c0)
_g = np.linspace(-1000, 1000, 4001); _x, _c = _mol_neumann(4001, 2000.0, np.where(_g < 0, 1.0, np.where(_g == 0, 0.5, 0.0)), 100.0, 5.0, -1000.0)
_xi = [-100.0, -50.0, -20.0, 0.0, 20.0, 50.0, 100.0]
ref['dif_step'] = {str(x): float(np.interp(x, _x, _c)) for x in _xi}
_x, _c = _mol_neumann(401, 400.0, np.where(np.linspace(0, 400, 401) < 200, 1.0, np.where(np.linspace(0, 400, 401) == 200, 0.5, 0.0)), 100.0, 5.0, 0.0)
ref['dif_slab'] = {str(x): float(np.interp(x, _x, _c)) for x in (0.0, 100.0, 180.0, 200.0, 220.0, 300.0, 400.0)}
def _perm(tau):
    n = 801; h = 1.0 / (n - 1)
    def f(t, y):
        c = np.concatenate(([1.0], y[:-1], [0.0])); d = np.zeros(n - 2); d = (c[:-2] - 2 * c[1:-1] + c[2:]) / h**2
        J = (4 * c[-2] - c[-3]) / (2 * h)
        return np.concatenate((d, [J]))
    from scipy.sparse import lil_matrix
    S = lil_matrix((n - 1, n - 1))
    for i in range(n - 2):
        S[i, i] = 1
        if i > 0: S[i, i - 1] = 1
        if i < n - 3: S[i, i + 1] = 1
    for j in (n - 4, n - 3): S[n - 2, j] = 1
    sol = solve_ivp(f, [0, tau], np.zeros(n - 1), method='BDF', rtol=1e-10, atol=1e-13, jac_sparsity=S)
    return float(sol.y[-1, -1])
ref['dif_perm'] = {str(t): _perm(t) for t in (0.03, 0.06, 0.1, 0.2, 0.5, 1.0, 2.0)}
ref['dif_visc'] = {str(T): float(P('V', 'T', T, 'P', 101325, 'Water')) for T in (275.0, 285.0, 298.15, 320.0, 350.0, 370.0)}
def _thiele(phi):
    f = lambda x, y: np.vstack((y[1], phi**2 * y[0])); bc = lambda ya, yb: np.array([ya[0] - 1, yb[1]])
    xs = np.linspace(0, 1, 400); y0 = np.vstack((np.cosh(phi * (1 - xs)) / np.cosh(phi), np.zeros_like(xs)))
    sol = solve_bvp(f, bc, xs, y0, tol=1e-10, max_nodes=100000)
    return [float(integrate.quad(lambda x: sol.sol(x)[0], 0, 1, epsabs=1e-12)[0]), float(sol.sol(0.5)[0])]
ref['dif_thiele'] = {str(ph): _thiele(ph) for ph in (0.1, 0.5, 1.0, 2.0, 5.0, 10.0)}
_rng = np.random.default_rng(37)
def _nwalk(d, D, dt, n, npart):
    x = np.cumsum(_rng.normal(0, np.sqrt(2 * D * dt), size=(n, npart, d)), axis=0); return float((x[-1] ** 2).sum(axis=1).mean())
ref['dif_walk'] = {str(d): _nwalk(d, 10.0, 0.01, 500, 4000) for d in (1, 2, 3)}
ref['dif_pulse_norm'] = float(integrate.quad(lambda x: np.exp(-x * x / (4 * 100 * 5)) / np.sqrt(4 * np.pi * 100 * 5), -np.inf, np.inf)[0])

# ============ Cap. 38: bioenergética y membranas ============
from scipy.signal import find_peaks as _fp
from scipy.optimize import brentq as _bq
def _hh_rhs(Tc, gNa=120.0, gK=36.0):
    phi = 3.0 ** ((Tc - 6.3) / 10.0)
    def f(t, y, I):
        V, m, h, n = y
        am = 0.1 * (V + 40) / (1 - np.exp(-(V + 40) / 10)); bm = 4 * np.exp(-(V + 65) / 18)
        ah = 0.07 * np.exp(-(V + 65) / 20); bh = 1 / (1 + np.exp(-(V + 35) / 10))
        an = 0.01 * (V + 55) / (1 - np.exp(-(V + 55) / 10)); bn = 0.125 * np.exp(-(V + 65) / 80)
        dV = I - gNa * m**3 * h * (V - 50) - gK * n**4 * (V + 77) - 0.3 * (V + 54.387)
        return [dV, phi * (am * (1 - m) - bm * m), phi * (ah * (1 - h) - bh * h), phi * (an * (1 - n) - bn * n)]
    return f
def _hh_spikes(I, Tc, tmax=80.0, **kw):
    am = lambda V: 0.1 * (V + 40) / (1 - np.exp(-(V + 40) / 10)); bm = lambda V: 4 * np.exp(-(V + 65) / 18)
    ah = lambda V: 0.07 * np.exp(-(V + 65) / 20); bh = lambda V: 1 / (1 + np.exp(-(V + 35) / 10))
    an = lambda V: 0.01 * (V + 55) / (1 - np.exp(-(V + 55) / 10)); bn = lambda V: 0.125 * np.exp(-(V + 65) / 80)
    V0 = -65.0; y0 = [V0, am(V0) / (am(V0) + bm(V0)), ah(V0) / (ah(V0) + bh(V0)), an(V0) / (an(V0) + bn(V0))]
    t = np.arange(0, tmax + 1e-9, 0.01); f = _hh_rhs(Tc, **kw)
    sol = solve_ivp(lambda tt, yy: f(tt, yy, I), [0, tmax], y0, method='Radau', t_eval=t, rtol=1e-10, atol=1e-12)
    V = sol.y[0]; pk, _ = _fp(V, height=0.0, prominence=20.0)
    return [[float(t[i]), float(V[i])] for i in pk], float(V.min())
ref['hh'] = {}
for _I, _Tc in [(10.0, 6.3), (20.0, 6.3), (10.0, 18.5)]:
    _sp, _mn = _hh_spikes(_I, _Tc); ref['hh'][f'{_I},{_Tc}'] = {'spikes': _sp[:6], 'min': _mn, 'n': len(_sp)}
ref['hh']['ttx'] = _hh_spikes(10.0, 6.3, gNa=0.0)[0]
ref['hh']['tea'] = _hh_spikes(10.0, 6.3, gK=0.0)[0][:3]
def _rheo():
    lo, hi = 0.0, 20.0
    for _ in range(30):
        mid = (lo + hi) / 2
        if len(_hh_spikes(mid, 6.3, tmax=300.0)[0]) >= 3: hi = mid
        else: lo = mid
    return (lo + hi) / 2
ref['hh_rheo'] = float(_rheo())
_F, _R = 96485.33212, 8.314462618
def _ghk_zero(T, Ko, Ki, Nao, Nai, Clo, Cli, pna, pcl):
    def I(V):
        u = _F * V / (_R * T)
        cur = lambda z, P, ci, co: P * z * z * _F * u * (ci - co * np.exp(-z * u)) / (1 - np.exp(-z * u)) if abs(u) > 1e-12 else P * z * _F * (ci - co)
        return cur(1, 1.0, Ki, Ko) + cur(1, pna, Nai, Nao) + cur(-1, pcl, Cli, Clo)
    return float(_bq(I, -0.2, 0.2, xtol=1e-14))
ref['ghk'] = {k: _ghk_zero(*v) for k, v in {'rest': (310.15, 5, 140, 145, 15, 110, 10, 0.04, 0.45), 'k20': (310.15, 20, 140, 145, 15, 110, 10, 0.04, 0.45), 'pna': (310.15, 5, 140, 145, 15, 110, 10, 1.0, 0.45), 'squid': (291.15, 20, 400, 440, 50, 560, 40, 0.04, 0.45)}.items()}
ref['bio_const'] = {'R': float(_c.R), 'F': float(_c.physical_constants['Faraday constant'][0])}

json.dump(ref, open('tests/referencias.json', 'w'), indent=0)
print('referencias.json escrito:', {k: (len(v) if hasattr(v, '__len__') else 1) for k, v in ref.items()})
