# -*- coding: utf-8 -*-
# Genera src/core/61-fm-ptdata.js: datos de los 54 primeros elementos (energía de ionización NIST, radio empírico de Slater, electronegatividad de Pauling, configuración)
import json
from pymatgen.core import Element
rows = []
for Z in range(1, 55):
    el = Element.from_Z(Z)
    ie = float(el.ionization_energies[0])
    r = el.atomic_radius
    r = float(r) if r is not None else None
    X = el.X
    X = None if X != X else float(X)
    cfg = el.electronic_structure
    rows.append(dict(Z=Z, s=el.symbol, ie=ie, r=r, X=X, cfg=cfg))
js = '''/* ===================================================================
   61-fm-ptdata.js — datos de los 54 primeros elementos (generado por tools/mk16.py desde pymatgen/NIST ASD):
   energía de primera ionización (eV), radio atómico empírico de Slater (Å), electronegatividad de Pauling y configuración del estado fundamental.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const fm = (EM.fm = EM.fm || {});
  fm.ptdata = %s;
})(typeof window !== 'undefined' ? window : globalThis);
''' % json.dumps(rows, ensure_ascii=False)
open(r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\61-fm-ptdata.js', 'w', encoding='utf-8').write(js)
print(len(rows), rows[0], rows[23], rows[28], sum(1 for r in rows if r['r'] is None), sum(1 for r in rows if r['X'] is None))
