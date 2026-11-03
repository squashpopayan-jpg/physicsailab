# -*- coding: utf-8 -*-
# Genera src/core/72-fm-pdg.js con datos del PDG (paquete `particle`): masa (MeV), ancho (MeV), vida media (s), carga, espín y contenido de quarks
import json
from particle import Particle
ids = [11, 13, 15, 1, 2, 3, 4, 5, 6, 22, 23, 24, 25, 211, 111, 321, 311, 221, 213, 223, 333, 443, 553, 2212, 2112, 3122, 3222, 3212, 3112, 3312, 3322, 2224, 2214, 1114, 3224, 3214, 3114, 3324, 3314, 3334]
rows = []
def num(x):
    try:
        v = float(x)
        return None if v != v or v in (float('inf'),) else v
    except Exception: return None
for pid in ids:
    p = Particle.from_pdgid(pid)
    life = None if p.lifetime is None else (float(p.lifetime)*1e-9)      # ns → s
    if life is not None and life == float('inf'): life = None
    rows.append(dict(id=pid, name=p.name, m=num(p.mass), w=num(p.width), tau=life, q3=int(round(float(p.charge)*3)), J=float(p.J), quarks=str(p.quarks) if p.quarks else ''))
js = '''/* ===================================================================
   72-fm-pdg.js — datos del Particle Data Group (paquete `particle` de scikit-hep, generado por tools/mk25.py):
   masa (MeV/c²), ancho (MeV), vida media (s), carga (en tercios de e), espín J y contenido de quarks (mayúscula = antiquark).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const fm = (EM.fm = EM.fm || {});
  fm.pdg = %s;
})(typeof window !== 'undefined' ? window : globalThis);
''' % json.dumps(rows, ensure_ascii=False)
open(r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\72-fm-pdg.js', 'w', encoding='utf-8').write(js)
print(len(rows))
