"""Genera src/core/29-xrd.js con los coeficientes de los factores de dispersión atómica
de rayos X que usa pymatgen (f(s) = Z − 41.78214 s² Σ aₖ exp(−bₖ s²), s = sen θ / λ en Å⁻¹).
Ejecutar una vez: python tools/gen_xrd.py"""
import json, os
from pymatgen.analysis.diffraction.xrd import ATOMIC_SCATTERING_PARAMS as P
from pymatgen.core import Element
els = ['H','Li','Be','C','N','O','F','Na','Mg','Al','Si','P','S','Cl','K','Ca','Ti','Cr','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Sr','Nb','Mo','Ag','Cd','In','Sn','Sb','Te','I','Cs','Ba','W','Pt','Au','Pb']
out = {e: {'Z': Element(e).Z, 'c': [[float(a), float(b)] for a, b in P[e]]} for e in els}
p = os.path.join(os.path.dirname(__file__), '..', 'src', 'core', '29-xrd.js')
with open(p, 'w', encoding='utf8') as f:
    f.write('/* 29-xrd.js — Coeficientes de dispersión atómica de rayos X (generado por tools/gen_xrd.py desde pymatgen) */\n')
    f.write('(function () {\n  const root = typeof window !== "undefined" ? window : globalThis;\n  const EM = (root.EM = root.EM || {});\n')
    f.write('  EM.XRDF = ' + json.dumps(out, separators=(',', ':')) + ';\n')
    f.write('  if (typeof module !== "undefined" && module.exports) module.exports = EM.XRDF;\n})();\n')
print('OK', len(out))
