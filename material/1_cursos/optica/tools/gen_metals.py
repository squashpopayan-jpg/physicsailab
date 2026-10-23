"""Genera src/core/29-metals.js con el índice complejo n + iκ de metales, tomado de la base de datos
de refractiveindex.info (paquete refractiveindex): plata, oro y cobre de Johnson y Christy (1972),
aluminio de Rakić (1995). De 380 a 800 nm cada 10 nm.
Ejecutar: python tools/gen_metals.py"""
import os, json
from refractiveindex import RefractiveIndexMaterial

SRC = {
    'Ag': ('Johnson', 'Plata', 'P. B. Johnson y R. W. Christy, Phys. Rev. B 6, 4370 (1972)'),
    'Au': ('Johnson', 'Oro', 'P. B. Johnson y R. W. Christy, Phys. Rev. B 6, 4370 (1972)'),
    'Cu': ('Johnson', 'Cobre', 'P. B. Johnson y R. W. Christy, Phys. Rev. B 6, 4370 (1972)'),
    'Al': ('Rakic', 'Aluminio', 'A. D. Rakić, Appl. Opt. 34, 4755 (1995)'),
}
L = list(range(380, 801, 10))
out = {}
for k, (page, name, ref) in SRC.items():
    m = RefractiveIndexMaterial(shelf='main', book=k, page=page)
    n = [round(float(m.get_refractive_index(l)), 5) for l in L]
    kap = [round(float(m.get_extinction_coefficient(l)), 5) for l in L]
    out[k] = {'name': name, 'ref': ref, 'n': n, 'k': kap}
js = f"""/* ===================================================================
   29-metals.js — Índices complejos de metales (generado con tools/gen_metals.py
   desde la base de datos de refractiveindex.info). λ de 380 a 800 nm cada 10 nm.
   =================================================================== */
(function () {{
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const T = {{ l0: 380, dl: 10, n: {len(L)}, data: {json.dumps(out, ensure_ascii=False)} }};
  root.EM = root.EM || {{}};
  root.EM.METALS = T;
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
}})();
"""
p = os.path.join(os.path.dirname(__file__), '..', 'src', 'core', '29-metals.js')
open(p, 'w', encoding='utf8').write(js)
print('OK', p)
