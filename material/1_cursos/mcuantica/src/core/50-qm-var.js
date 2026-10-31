/* ===================================================================
   50-qm-var.js — Método variacional (EM.qm.var), unidades atómicas.
   Oscilador anarmónico con gaussiana de prueba, hidrógeno con base de gaussianas (Rayleigh–Ritz), helio con carga efectiva
   y H₂⁺ en la aproximación LCAO. Requiere EM.P.la (30-linalg.js).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Va = (qm.var = {});
  /* H = p²/2 + x²/2 + g x⁴ con ψ ∝ exp(−αx²/2): E(α) = α/4 + 1/(4α) + 3g/(4α²) */
  Va.gaussE = (g, a) => a / 4 + 1 / (4 * a) + (3 * g) / (4 * a * a);
  /* α óptimo: raíz de α³ − α − 6g = 0 (Newton desde α = 1) */
  Va.gaussOpt = function (g) { let a = 1 + 2 * g; for (let i = 0; i < 80; i++) { const f = a * a * a - a - 6 * g, d = 3 * a * a - 1; a -= f / d; } return a; };
  /* Hidrógeno (hidrogenoide Z) con base de gaussianas s sin normalizar exp(−a_i r²): devuelve {E, c, vals} (energías en hartree) */
  Va.hydrogenGTO = function (exps, Z = 1) {
    const n = exps.length, LA = EM.P.la, H = LA.zeros(n), S = LA.zeros(n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const a = exps[i], b = exps[j], p = a + b, s = Math.pow(Math.PI / p, 1.5);
      S[i][j] = s; H[i][j] = ((3 * a * b) / p) * s - (Z * 2 * Math.PI) / p;
    }
    const r = LA.geneig(H, S); if (!r) return null;
    const c = Array.from({ length: n }, (_, i) => r.vectors[i][0]);
    return { E: r.values[0], c, vals: Array.from(r.values) };
  };
  /* Función radial de la solución con gaussianas, normalizada con ∫|ψ|²4πr²dr = 1 */
  Va.gtoPsi = function (exps, c, r) {
    let s = 0; for (let i = 0; i < exps.length; i++) s += c[i] * Math.exp(-exps[i] * r * r);
    return s;
  };
  Va.gtoNorm = function (exps, c) { let s = 0; for (let i = 0; i < exps.length; i++) for (let j = 0; j < exps.length; j++) s += c[i] * c[j] * Math.pow(Math.PI / (exps[i] + exps[j]), 1.5); return 1 / Math.sqrt(s); };
  /* Helio: E(ζ) = ζ² − 2Zζ + (5/8)ζ con orbital 1s de carga efectiva ζ para ambos electrones */
  Va.heliumE = (zeta, Z = 2) => zeta * zeta - 2 * Z * zeta + (5 / 8) * zeta;
  Va.heliumOpt = (Z = 2) => Z - 5 / 16;
  /* H₂⁺ LCAO (1s), R en a₀: energías electrónicas + 1/R: E± = −½ + 1/R − (j ± k)/(1 ± S) */
  Va.h2plus = function (R) {
    const S = Math.exp(-R) * (1 + R + (R * R) / 3), j = 1 / R - Math.exp(-2 * R) * (1 + 1 / R), k = Math.exp(-R) * (1 + R);
    return { S, j, k, g: -0.5 + 1 / R - (j + k) / (1 + S), u: -0.5 + 1 / R - (j - k) / (1 - S) };
  };
  Va.h2plusMin = function () { let lo = 1.5, hi = 4, f = (R) => Va.h2plus(R).g; for (let i = 0; i < 100; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) hi = m2; else lo = m1; } const R = (lo + hi) / 2; return { R, E: f(R) }; };
  if (typeof module !== 'undefined' && module.exports) module.exports = Va;
})(typeof window !== 'undefined' ? window : globalThis);
