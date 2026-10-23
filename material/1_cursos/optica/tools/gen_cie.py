"""Genera src/core/29-cie.js con las tablas oficiales de la CIE tomadas de colour-science:
funciones de igualación de color del observador patrón CIE 1931 (2°) y el iluminante D65,
de 380 a 780 nm cada 5 nm. La función de eficiencia luminosa fotópica V(λ) es ȳ(λ).
Ejecutar: python tools/gen_cie.py"""
import os, json
import colour

cmf = colour.MSDS_CMFS['CIE 1931 2 Degree Standard Observer']
d65 = colour.SDS_ILLUMINANTS['D65']
L = list(range(380, 781, 5))
x = [float(cmf[l][0]) for l in L]
y = [float(cmf[l][1]) for l in L]
z = [float(cmf[l][2]) for l in L]
d = [float(d65[l]) for l in L]
js = f"""/* ===================================================================
   29-cie.js — Tablas de la CIE (generadas con tools/gen_cie.py desde colour-science {colour.__version__})
   Observador patrón CIE 1931 de 2°: x̄, ȳ, z̄ de 380 a 780 nm cada 5 nm.
   Iluminante D65 (distribución espectral relativa, 100 en 560 nm).
   V(λ) fotópica = ȳ(λ).
   =================================================================== */
(function () {{
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const T = {{
    l0: 380, dl: 5, n: {len(L)},
    x: {json.dumps(x)},
    y: {json.dumps(y)},
    z: {json.dumps(z)},
    d65: {json.dumps(d)}
  }};
  root.EM = root.EM || {{}};
  root.EM.CIE = T;
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
}})();
"""
out = os.path.join(os.path.dirname(__file__), '..', 'src', 'core', '29-cie.js')
open(out, 'w', encoding='utf8').write(js)
print('OK', out, len(L), 'longitudes de onda')
