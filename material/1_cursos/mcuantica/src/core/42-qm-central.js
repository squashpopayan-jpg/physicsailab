/* ===================================================================
   42-qm-central.js — Potenciales centrales (EM.qm.cen): funciones de Bessel esféricas, ceros, oscilador 3D,
   pozo esférico finito para l = 0 y solución radial por diferencias finitas. ħ = m = 1 salvo indicación.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Cn = (qm.cen = {});
  /* Bessel esférica de primera especie j_l(x) (serie para x pequeño, recurrencia ascendente después) */
  Cn.jl = function (l, x) {
    if (x === 0) return l === 0 ? 1 : 0;
    if (x < 0.5 * (l + 1) && l > 0) { let t = 1; for (let k = 1; k <= l; k++) t *= x / (2 * k + 1); let s = 1, term = 1; const x2 = x * x; for (let k = 1; k < 30; k++) { term *= -x2 / (2 * k * (2 * k + 2 * l + 1)); s += term; if (Math.abs(term) < 1e-17 * Math.abs(s)) break; } return t * s; }
    let j0 = Math.sin(x) / x; if (l === 0) return j0;
    let j1 = Math.sin(x) / (x * x) - Math.cos(x) / x; if (l === 1) return j1;
    for (let k = 1; k < l; k++) { const j2 = ((2 * k + 1) / x) * j1 - j0; j0 = j1; j1 = j2; }
    return j1;
  };
  /* n-ésimo cero (n = 1, 2, …) de j_l por barrido y bisección */
  Cn.zero = function (l, n) {
    let found = 0, a = 0.1 + (l > 0 ? l : 0) * 0.9, fa = Cn.jl(l, a); const h = 0.02;
    for (let x = a + h; x < 200; x += h) { const fx = Cn.jl(l, x); if (fa * fx < 0) { found++; if (found === n) { let lo = x - h, hi = x, flo = fa; for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi), fm = Cn.jl(l, m); if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } } return 0.5 * (lo + hi); } } a = x; fa = fx; }
    return NaN;
  };
  /* Oscilador isótropo 3D: E = ħω(2n_r + l + 3/2); degeneración de la capa N = 2n_r + l: (N+1)(N+2)/2 (sin espín) */
  Cn.hoE = (nr, l) => 2 * nr + l + 1.5;
  Cn.hoDeg = (N) => ((N + 1) * (N + 2)) / 2;
  /* Pozo esférico finito, l = 0, V = −V0 (r < a): raíces de −x cot x = √(z0² − x²) con z0 = a√(2mV0)/ħ; devuelve energías (desde el borde) E = −κ²/2 */
  Cn.well0 = function (V0, a, m = 1, hb = 1) {
    const z0 = (a * Math.sqrt(2 * m * V0)) / hb, out = [];
    for (let n = 0; (n + 0.5) * Math.PI < z0; n++) {
      const lo = (n + 0.5) * Math.PI + 1e-12, hi = Math.min((n + 1) * Math.PI - 1e-12, z0), f = (x) => -x / Math.tan(x) - Math.sqrt(Math.max(0, z0 * z0 - x * x));
      let a1 = lo, b1 = hi, fa = f(a1); if (fa * f(b1) > 0) continue;
      for (let i = 0; i < 200; i++) { const mid = 0.5 * (a1 + b1), fm = f(mid); if (fa * fm <= 0) b1 = mid; else { a1 = mid; fa = fm; } }
      const x = 0.5 * (a1 + b1), kap = Math.sqrt(z0 * z0 - x * x) / a; out.push({ x, E: (-(hb * hb * kap * kap)) / (2 * m), kappa: kap });
    }
    return { z0, states: out };
  };
  /* Soluciones radiales por diferencias finitas: u(r) con u(0) = u(R) = 0, V_eff = V + l(l+1)/2r² */
  Cn.radial = function (V, l, R, N, k) {
    return EM.P.q1d.fdEigen((r) => V(r) + (l * (l + 1)) / (2 * r * r), 0, R, N, k);
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Cn;
})(typeof window !== 'undefined' ? window : globalThis);
