"""Genera src/core/31-tablas.js: tablas de propiedades de agua (IAPWS-95) y R-134a
(Tillner-Roth y Baehr) evaluadas con CoolProp. Ejecutar: python tools/gen_tablas.py"""
import json, math, os
import numpy as np
from CoolProp.CoolProp import PropsSI as P

def r(x, n=7): return float(f'{x:.{n}g}')

def fluid(name, Tlo, Pmin, Pmax, Tmax, nsat=90, nP=44, nth=40):
    Tc = P('Tcrit', name); Pc = P('pcrit', name)
    # saturación: malla más fina cerca del punto crítico
    u = np.linspace(0, 1, nsat)
    Ts = Tlo + (Tc - Tlo) * (1 - (1 - u) ** 1.6)
    Ts[-1] = Tc - 1e-3 * (Tc - Tlo) / 100
    sat = []
    for T in Ts:
        row = [T, P('P', 'T', T, 'Q', 0, name)]
        for q in (0, 1):
            row += [1 / P('D', 'T', T, 'Q', q, name), P('H', 'T', T, 'Q', q, name), P('S', 'T', T, 'Q', q, name), P('U', 'T', T, 'Q', q, name)]
        sat.append([r(x) for x in row])
    # vapor sobrecalentado: filas en log P, columna en theta = ((T-Tsat)/(Tmax-Tsat))^(1/2)
    Ps = np.exp(np.linspace(math.log(Pmin), math.log(Pmax), nP))
    sup = []
    th = np.linspace(0, 1, nth)
    for p in Ps:
        Tsat = P('T', 'P', p, 'Q', 1, name)
        rowv, rowh, rows = [], [], []
        for t in th:
            T = Tsat + (Tmax - Tsat) * t * t
            if t == 0:
                v, h, s = 1 / P('D', 'P', p, 'Q', 1, name), P('H', 'P', p, 'Q', 1, name), P('S', 'P', p, 'Q', 1, name)
            else:
                v, h, s = 1 / P('D', 'P', p, 'T', T, name), P('H', 'P', p, 'T', T, name), P('S', 'P', p, 'T', T, name)
            rowv.append(r(math.log(v))); rowh.append(r(h)); rows.append(r(s))
        sup.append({'P': r(p), 'Tsat': r(Tsat), 'lv': rowv, 'h': rowh, 's': rows})
    return {'name': name, 'Tc': Tc, 'Pc': Pc, 'Tmax': Tmax, 'M': P('M', name), 'sat': sat, 'sup': sup, 'nth': nth}

W = fluid('Water', 273.16, 611.657 * 1.0001, 21.0e6, 1273.15)
R = fluid('R134a', 233.15, 51.2e3, 3.9e6, 453.15)
js = ('/* 29-tablas.js — GENERADO por tools/gen_tablas.py (CoolProp ' + __import__('CoolProp').__version__ +
      '): agua IAPWS-95 y R-134a. No editar a mano. */\n(function () {\n  const root = typeof window !== "undefined" ? window : globalThis;\n'
      '  const EM = (root.EM = root.EM || {});\n  EM.tablas = ' + json.dumps({'agua': W, 'r134a': R}, separators=(',', ':')) +
      ';\n  if (typeof module !== "undefined" && module.exports) module.exports = EM.tablas;\n})();\n')
open(os.path.join(os.path.dirname(__file__), '..', 'src', 'core', '29-tablas.js'), 'w', encoding='utf8').write(js)
print('OK', len(js) // 1024, 'KB')
