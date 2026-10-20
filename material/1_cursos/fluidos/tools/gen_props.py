"""Genera src/core/29-props.js: tablas de propiedades de fluidos reales con CoolProp.
Agua (IAPWS-95 + viscosidad IAPWS 2008 + tensión superficial IAPWS 1994), aire (Lemmon et al.),
etanol, metanol, tolueno y n-heptano. El curso las interpola con splines cúbicos.
Ejecutar: python tools/gen_props.py"""
import json, os
from CoolProp.CoolProp import PropsSI as P

def sig(x, n=7):
    return float(f'{x:.{n}g}')

out = {}
# Agua líquida a 1 atm (0.01–99 °C) y líquido saturado (100–350 °C)
T1 = [273.16] + [273.15 + t for t in range(1, 100)]
T2 = [273.15 + t for t in range(100, 351, 5)]
w = {'T': [], 'rho': [], 'mu': [], 'k': [], 'cp': [], 'sigma': [], 'psat': [], 'c': []}
for T in T1:
    w['T'].append(sig(T)); w['rho'].append(sig(P('D', 'T', T, 'P', 101325, 'Water')))
    w['mu'].append(sig(P('V', 'T', T, 'P', 101325, 'Water'))); w['k'].append(sig(P('L', 'T', T, 'P', 101325, 'Water')))
    w['cp'].append(sig(P('C', 'T', T, 'P', 101325, 'Water'))); w['sigma'].append(sig(P('I', 'T', T, 'Q', 0, 'Water')))
    w['psat'].append(sig(P('P', 'T', T, 'Q', 0, 'Water'))); w['c'].append(sig(P('A', 'T', T, 'P', 101325, 'Water')))
for T in T2:
    w['T'].append(sig(T)); w['rho'].append(sig(P('D', 'T', T, 'Q', 0, 'Water')))
    w['mu'].append(sig(P('V', 'T', T, 'Q', 0, 'Water'))); w['k'].append(sig(P('L', 'T', T, 'Q', 0, 'Water')))
    w['cp'].append(sig(P('C', 'T', T, 'Q', 0, 'Water'))); w['sigma'].append(sig(P('I', 'T', T, 'Q', 0, 'Water')))
    w['psat'].append(sig(P('P', 'T', T, 'Q', 0, 'Water'))); w['c'].append(sig(P('A', 'T', T, 'Q', 0, 'Water')))
out['water'] = w
# Aire seco a 1 atm
a = {'T': [], 'rho': [], 'mu': [], 'k': [], 'cp': [], 'c': []}
for T in range(200, 1501, 10):
    a['T'].append(T); a['rho'].append(sig(P('D', 'T', T, 'P', 101325, 'Air')))
    a['mu'].append(sig(P('V', 'T', T, 'P', 101325, 'Air'))); a['k'].append(sig(P('L', 'T', T, 'P', 101325, 'Air')))
    a['cp'].append(sig(P('C', 'T', T, 'P', 101325, 'Air'))); a['c'].append(sig(P('A', 'T', T, 'P', 101325, 'Air')))
out['air'] = a
# Líquidos orgánicos a 1 atm, desde 250 K (o la fusión) hasta 2 K por debajo de la ebullición
for name, f in [('etanol', 'Ethanol'), ('metanol', 'Methanol'), ('tolueno', 'Toluene'), ('heptano', 'n-Heptane')]:
    Tb = P('T', 'P', 101325, 'Q', 0, f)
    Tm = max(250.0, P('Tmin', f) + 1)
    d = {'T': [], 'rho': [], 'mu': [], 'sigma': [], 'Tb': sig(Tb)}
    T = Tm
    while T < Tb - 2:
        d['T'].append(sig(T)); d['rho'].append(sig(P('D', 'T', T, 'P', 101325, f)))
        d['mu'].append(sig(P('V', 'T', T, 'P', 101325, f))); d['sigma'].append(sig(P('I', 'T', T, 'Q', 0, f)))
        T += 2
    out[name] = d
dst = os.path.join(os.path.dirname(__file__), '..', 'src', 'core', '29-props.js')
js = ('/* 29-props.js — GENERADO por tools/gen_props.py con CoolProp ' + __import__('CoolProp').__version__ +
      '. No editar a mano. */\n(function () {\n  const T = ' + json.dumps(out, separators=(',', ':')) +
      ';\n  const root = typeof window !== \'undefined\' ? window : globalThis;\n  (root.EM = root.EM || {}).props = T;\n' +
      '  if (typeof module !== \'undefined\' && module.exports) module.exports = T;\n})();\n')
open(dst, 'w', encoding='utf-8').write(js)
print('OK', {k: len(v['T']) for k, v in out.items()}, len(js) // 1024, 'KB')
