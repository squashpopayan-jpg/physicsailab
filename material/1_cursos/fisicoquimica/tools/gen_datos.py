"""Genera src/core/29-datos.js con datos de referencia para el curso (NO editar a mano):
 - NASA-7 de GRI-Mech 3.0 (Cantera) para especies gaseosas
 - (se amplía en secciones siguientes)"""
import json, cantera as ct
g = ct.Solution('gri30.yaml')
gas = g
SP = ['H2','O2','H2O','CO','CO2','N2','NH3','NO','NO2','N2O','CH4','C2H2','C2H4','C2H6','C3H8','CH3OH','CH2O','H2O2','OH','H','O','HCN','N','C','HO2','AR','CH3','HCO','NH2','CH3CHO','HNO','CH']
out = {'ct_version': ct.__version__, 'nasa': {}}
for s in SP:
    sp = g.species(s); d = sp.thermo.input_data
    comp = dict(sp.composition)
    out['nasa'][s] = {'M': sp.molecular_weight, 'comp': comp, 'T': d['temperature-ranges'], 'a': d['data']}

# ---- Constantes críticas y factor acéntrico (CoolProp) ----
import CoolProp
from CoolProp.CoolProp import PropsSI as PS
CPN = {'H2':'Hydrogen','N2':'Nitrogen','O2':'Oxygen','CO':'CO','CO2':'CO2','CH4':'Methane','C2H6':'Ethane','C3H8':'Propane','NH3':'Ammonia','AR':'Argon','HE':'Helium','H2O':'Water','C2H4':'Ethylene'}
out['crit'] = {k: {'Tc': PS('Tcrit', v), 'Pc': PS('pcrit', v), 'w': PS('acentric', v), 'M': PS('molar_mass', v) * 1e3, 'name': v} for k, v in CPN.items()}
def rnd(x, n=6): return float(f'{x:.{n}g}')
# Estados correspondientes: Z de CoolProp en (Tr, Pr)
Trs = [1.1, 1.3, 1.5, 2.0]; Prs = [0.1, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8]
out['zcs'] = {'Tr': Trs, 'Pr': Prs, 'gas': {}}
for g in ['AR', 'N2', 'CH4', 'CO2']:
    c = out['crit'][g]; rows = []
    for Tr in Trs:
        rows.append([rnd(PS('Z', 'T', Tr * c['Tc'], 'P', Pr * c['Pc'], CPN[g])) for Pr in Prs])
    out['zcs']['gas'][g] = rows
# B(T) de CoolProp
out['bvir'] = {}
for g in ['N2', 'CH4', 'CO2', 'AR', 'C2H6', 'NH3', 'H2']:
    AS = CoolProp.AbstractState('HEOS', CPN[g]); c = out['crit'][g]; pts = []
    for Tr in [0.65, 0.75, 0.85, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0]:
        T = Tr * c['Tc']
        if g == 'H2': T = [40, 60, 80, 100, 150, 200, 300, 400, 600, 800][len(pts)]
        AS.update(CoolProp.DmolarT_INPUTS, 1e-6, T); pts.append([rnd(T), rnd(AS.keyed_output(CoolProp.iBvirial) * 1e6)])  # cm3/mol
    out['bvir'][g] = pts
# coeficientes de fugacidad de CoolProp
out['phi'] = {}
for g, Ts in [('CO2', [320, 400, 500]), ('CH4', [200, 300, 400]), ('N2', [150, 300, 500]), ('NH3', [450, 600, 800])]:
    out['phi'][g] = {}
    for T in Ts:
        AS = CoolProp.AbstractState('HEOS', CPN[g]); pts = []
        for Pm in [0.1, 0.5, 1, 2, 5, 10, 20, 30, 50]:
            try:
                AS.update(CoolProp.PT_INPUTS, Pm * 1e6, T); pts.append([Pm, rnd(AS.fugacity_coefficient(0)), rnd(AS.compressibility_factor())])
            except Exception: pass
        out['phi'][g][str(T)] = pts



# ---- Diagramas de fases (CoolProp): líneas de fusión y de vaporización ----
out['ph'] = {}
for g, nm, Pmax in [('H2O', 'Water', 1.0e9), ('CO2', 'CO2', 8.0e8)]:
    AS = CoolProp.AbstractState('HEOS', nm); mel = []; Pt = PS('ptriple', nm)
    for i in range(0, 61):
        P = Pt * 1.0000 * 1.00001 * (Pmax / Pt) ** (i / 60) + (0 if i else 0.01)
        mel.append([rnd(P, 7), rnd(AS.melting_line(CoolProp.iT, CoolProp.iP, P), 7)])
    Tt = PS('Ttriple', nm); Tc = PS('Tcrit', nm); sat = []
    for i in range(0, 81):
        T = Tt + (Tc - Tt) * (i / 80) ** 1.0 * (0.9999 if i == 80 else 1)
        sat.append([rnd(T, 7), rnd(PS('P', 'T', T, 'Q', 0, nm), 7)])
    out['ph'][g] = {'Tt': Tt, 'Pt': Pt, 'Tc': Tc, 'Pc': PS('pcrit', nm), 'mel': mel, 'sat': sat}


# ---- Presiones de vapor (Antoine ajustada a thermo/DIPPR, P en Pa y T en K) y parámetros NRTL de ChemSep ----
import numpy as np
from scipy.optimize import curve_fit, brentq
from thermo import VaporPressure
from thermo.interaction_parameters import IPDB
from chemicals import CAS_from_any, MW
LIQ = {'benceno':'benzene','tolueno':'toluene','etanol':'ethanol','agua':'water','metanol':'methanol','acetona':'acetone','cloroformo':'chloroform','hexano':'hexane','heptano':'heptane','ciclohexano':'cyclohexane','1-propanol':'1-propanol','acetato de etilo':'ethyl acetate','tetracloruro':'carbon tetrachloride','1-butanol':'1-butanol'}
out['liq'] = {}
for k, n in LIQ.items():
    cas = CAS_from_any(n); vp = VaporPressure(CASRN=cas)
    Tb = brentq(lambda T: vp(T) - 101325, 250, 480)
    Ts = np.linspace(brentq(lambda T: vp(T) - 3e3, 200, Tb), brentq(lambda T: vp(T) - 4e5, Tb, 650), 60)
    Pp = np.array([vp(T) for T in Ts]); f = lambda T, A, B, C: A - B / (T + C)
    po, _ = curve_fit(f, Ts, np.log10(Pp), p0=[10, 1500, -50], maxfev=20000)
    out['liq'][k] = {'cas': cas, 'n': n, 'M': MW(cas), 'A': float(po[0]), 'B': float(po[1]), 'C': float(po[2]), 'Tmin': float(Ts[0]), 'Tmax': float(Ts[-1]), 'Tb': float(Tb)}
out['nrtl'] = {}
for a, b in [('etanol','agua'),('acetona','cloroformo'),('metanol','agua'),('etanol','benceno'),('acetona','agua'),('hexano','etanol'),('acetato de etilo','etanol'),('metanol','acetona'),('benceno','tolueno'),('1-butanol','agua'),('ciclohexano','etanol'),('etanol','tolueno')]:
    ca, cb = out['liq'][a]['cas'], out['liq'][b]['cas']
    try:
        bm = IPDB.get_ip_asymmetric_matrix('ChemSep NRTL', [ca, cb], 'bij'); am = IPDB.get_ip_asymmetric_matrix('ChemSep NRTL', [ca, cb], 'alphaij')
        out['nrtl'][a + '|' + b] = {'b12': float(bm[0][1]), 'b21': float(bm[1][0]), 'alpha': float(am[0][1])}
    except Exception as e:
        print('sin NRTL', a, b)


# ---- Constantes de Henry de gases en agua: ln(H/Pa) = A + B/T, H = P/x (Sander 2015, vía thermo) ----
out['henry'] = {}
wcas = CAS_from_any('water')
for k, n in {'O2':'oxygen','N2':'nitrogen','CO2':'carbon dioxide','CH4':'methane','H2':'hydrogen','Ar':'argon','He':'helium','CO':'carbon monoxide','N2O':'nitrous oxide','H2S':'hydrogen sulfide'}.items():
    c = CAS_from_any(n); t2 = IPDB.tables['Sander T dep']
    key = [kk for kk in t2 if c in kk.split(' ') and wcas in kk.split(' ')]
    if not key: key = [kk for kk in t2 if kk.endswith(wcas) and n in ' '.join([])]
    if key: out['henry'][k] = {'A': t2[key[0]]['A'], 'B': t2[key[0]]['B'], 'M': MW(c)}


# ---- Reacciones elementales de GRI-Mech 3.0: k = A T^b exp(−Ea/RT), A en cm³/(mol·s), Ea en J/mol ----
GRI_EQ = ['H + O2 <=> O + OH', 'H2 + O <=> H + OH', 'H2 + OH <=> H + H2O', 'CO + OH <=> CO2 + H', 'CH4 + OH <=> CH3 + H2O', 'CH4 + H <=> CH3 + H2', 'CH4 + O <=> CH3 + OH', 'NH3 + OH <=> H2O + NH2', 'HCO + O2 <=> CO + HO2', 'CH2O + O2 <=> HCO + HO2', 'CH3 + O2 <=> CH2O + OH', 'CH3OH + OH <=> CH2OH + H2O', 'NCO + NO <=> CO + N2O']
out['gri'] = []
for r in gas.reactions():
    if r.equation in GRI_EQ and r.reaction_type == 'Arrhenius' and not getattr(r, 'duplicate', False):
        out['gri'].append({'eq': r.equation, 'A': r.rate.pre_exponential_factor * 1e3, 'b': r.rate.temperature_exponent, 'Ea': r.rate.activation_energy / 1e3})
assert len(out['gri']) == len(GRI_EQ), [x['eq'] for x in out['gri']]


# ---- Mecanismo H2/O2 de Li, Zhao, Kazakov y Dryer (2004), vía Cantera (h2o2.yaml): unidades Cantera (kmol, m, s, J/kmol) ----
h2 = ct.Solution('h2o2.yaml')
mech = {'species': {}, 'reactions': []}
for sp in h2.species():
    d = sp.thermo.input_data
    mech['species'][sp.name] = {'M': sp.molecular_weight, 'T': d['temperature-ranges'], 'a': d['data'], 'comp': dict(sp.composition)}
for r in h2.reactions():
    e = {'eq': r.equation, 'R': dict(r.reactants), 'P': dict(r.products), 'rev': r.reversible}
    if r.reaction_type == 'falloff-Troe':
        e.update({'t': 'fo', 'lo': [r.rate.low_rate.pre_exponential_factor, r.rate.low_rate.temperature_exponent, r.rate.low_rate.activation_energy], 'hi': [r.rate.high_rate.pre_exponential_factor, r.rate.high_rate.temperature_exponent, r.rate.high_rate.activation_energy], 'troe': list(r.rate.falloff_coeffs), 'eff': dict(r.third_body.efficiencies), 'def': r.third_body.default_efficiency})
    elif r.reaction_type == 'three-body-Arrhenius':
        e.update({'t': 'tb', 'k': [r.rate.pre_exponential_factor, r.rate.temperature_exponent, r.rate.activation_energy], 'eff': dict(r.third_body.efficiencies), 'def': r.third_body.default_efficiency, 'M': '+ M' in r.equation or ' M ' in r.equation or r.equation.endswith('M')})
    else:
        e.update({'t': 'el', 'k': [r.rate.pre_exponential_factor, r.rate.temperature_exponent, r.rate.activation_energy]})
    mech['reactions'].append(e)
out['h2o2'] = mech

# ---- Tabla termodinámica a 298.15 K (NBS/CODATA/CRC) ----
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from datos_termo import TAB
bad = __import__('datos_termo').check()
assert not bad, bad
out['tt'] = {k: {'f': v[0], 'z': v[1], 'st': v[2], 'H': v[3], 'G': v[4], 'S': v[5], 'Cp': v[6]} for k, v in TAB.items()}
# ---- Ciclo de Born–Haber: ΔfH(sal), ΔsubH(M), IE1(M), ΔfH(X, g), EA(X), radios de Shannon (pm), kJ/mol ----
out['born'] = {
  'M': {'Li': {'sub': 159.3, 'IE': 520.2, 'r': 76}, 'Na': {'sub': 107.5, 'IE': 495.8, 'r': 102}, 'K': {'sub': 89.0, 'IE': 418.8, 'r': 138}},
  'X': {'F': {'atom': 79.4, 'EA': -328.0, 'r': 133}, 'Cl': {'atom': 121.3, 'EA': -349.0, 'r': 181}, 'Br': {'atom': 111.9, 'EA': -324.6, 'r': 196}},
  'Hf': {'LiF': -616.0, 'NaF': -573.6, 'KF': -567.3, 'LiCl': -408.6, 'NaCl': -411.15, 'KCl': -436.5, 'LiBr': -351.2, 'NaBr': -361.1, 'KBr': -393.8},
}
# ---- Entalpías medias de enlace (kJ/mol; Atkins, CRC) ----
out['bond'] = {'H-H': 436, 'C-H': 413, 'C-C': 348, 'C=C': 612, 'C#C': 837, 'C-O': 360, 'C=O': 743, 'O-H': 463, 'O=O': 497, 'N#N': 945, 'N-H': 391, 'C-N': 305, 'H-Cl': 431, 'Cl-Cl': 242, 'C-Cl': 339, 'C=O(CO2)': 799, 'O-O': 146}

# Etanol–agua a 20 °C: densidad relativa al agua a 20 °C vs % en masa (Lange's Handbook of Chemistry, 10.ª ed., 1967; tabla reproducida en Wikipedia «Ethanol (data page)»)
out['etoh'] = {'w': list(range(0, 101, 5)), 'rel': [1.00000,0.99113,0.98361,0.97687,0.97036,0.96339,0.95551,0.94662,0.93684,0.92636,0.91546,0.90418,0.89271,0.88104,0.86920,0.85716,0.84494,0.83242,0.81942,0.80567,0.79074], 'rho_w20': 0.998203, 'M1': 46.069, 'M2': 18.015}
js = '/* 29-datos.js — GENERADO por tools/gen_datos.py. No editar a mano. */\n(function () {\n  const root = typeof window !== "undefined" ? window : globalThis;\n  const EM = (root.EM = root.EM || {});\n  EM.dat = ' + json.dumps(out, separators=(',', ':')) + ';\n  if (typeof module !== "undefined" && module.exports) module.exports = EM.dat;\n})();\n'
open('src/core/29-datos.js', 'w', encoding='utf8').write(js)
print(len(js))
