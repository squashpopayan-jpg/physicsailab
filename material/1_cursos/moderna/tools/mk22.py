# -*- coding: utf-8 -*-
# Genera src/core/68-fm-nucdata.js: masas atómicas (u) de los nucleidos estables/naturales y de algunos radiactivos usados en los capítulos 22–24 (periodictable)
import periodictable as pt, json
rows = []
seen = set()
for el in pt.elements:
    if el.number < 1 or el.number > 92: continue
    for A in el.isotopes:
        iso = el[A]
        if iso.abundance and iso.abundance > 0:
            rows.append([el.number, A, iso.mass, 1]); seen.add((el.number, A))
extra = [(42, 99), (1, 3), (6, 14), (11, 22), (11, 24), (15, 32), (19, 40), (27, 60), (38, 90), (53, 131), (55, 137), (84, 210), (86, 222), (88, 226), (90, 232), (92, 234), (92, 235), (92, 236), (92, 238), (94, 239), (43, 99), (6, 11), (7, 13), (8, 15), (9, 18), (2, 6), (4, 7), (4, 10), (5, 8), (3, 8), (5, 12), (14, 28), (81, 208), (82, 210), (83, 210), (84, 212), (88, 224), (36, 85), (56, 140), (95, 241), (94, 240), (92, 233), (90, 234), (88, 228), (90, 230), (91, 234), (82, 212), (84, 214), (82, 214), (20, 41), (16, 35), (53, 129), (75, 187), (37, 87), (13, 26), (17, 36), (26, 59), (31, 68), (25, 54), (7, 16), (11, 23), (92, 239), (93, 239), (94, 238), (96, 244), (84, 216), (86, 220), (88, 226)]
for Z, A in extra:
    if (Z, A) in seen: continue
    try:
        m = pt.elements[Z][A].mass
        if m: rows.append([Z, A, m, 0]); seen.add((Z, A))
    except Exception as ex:
        print('sin dato', Z, A)
rows.sort()
js = '''/* ===================================================================
   68-fm-nucdata.js — masas atómicas (u) de nucleidos: los naturales/estables (s = 1) y algunos radiactivos usados en los cap. 22–24 (s = 0).
   Generado por tools/mk22.py desde periodictable (evaluación de masas atómicas de AME). Formato: [Z, A, masa atómica en u, estable].
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const fm = (EM.fm = EM.fm || {});
  fm.nucdata = { mn: %r, mH: %r, rows: %s };
})(typeof window !== 'undefined' ? window : globalThis);
''' % (pt.neutron.mass, pt.elements[1][1].mass, json.dumps(rows))
open(r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\68-fm-nucdata.js', 'w', encoding='utf-8').write(js)
print(len(rows), sum(1 for r in rows if r[3]))
