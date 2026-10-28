"""Genera src/core/29-basis.js con las bases STO-3G y 6-31G (H–Ne) de Basis Set Exchange."""
import json, basis_set_exchange as bse
out = {}
for name in ('sto-3g', '6-31g'):
    b = json.loads(bse.get_basis(name, elements=list(range(1, 11)), fmt='json'))
    out[name] = {}
    for z, el in b['elements'].items():
        shells = []
        for sh in el['electron_shells']:
            ex = [float(x) for x in sh['exponents']]
            for l, co in zip(sh['angular_momentum'], sh['coefficients']):
                shells.append({'l': l, 'e': ex, 'c': [float(x) for x in co]})
        out[name][z] = shells
js = "/* Generado por tools/gen_basis.py (Basis Set Exchange: STO-3G, Hehre, Stewart y Pople 1969; 6-31G, Hehre, Ditchfield y Pople 1972). No es un archivo editable. */\n(function () {\n  'use strict';\n  const root = typeof window !== 'undefined' ? window : globalThis;\n  const EM = (root.EM = root.EM || {});\n  EM.basis = " + json.dumps(out, separators=(',', ':')) + ";\n  if (typeof module !== 'undefined' && module.exports) module.exports = EM.basis;\n})();\n"
open('src/core/29-basis.js', 'w', encoding='utf-8').write(js)
print(len(js))
