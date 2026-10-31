/* ===================================================================
   53-qm-scat3d.js — Dispersión por potenciales centrales en 3D (EM.qm.s3), ħ = m = 1 (E = k²/2, 2m/ħ² = 2).
   Desplazamientos de fase por Numerov, secciones eficaces por ondas parciales, aproximación de Born y esfera dura/pozo cuadrado.
   Requiere EM.qm.cen (42-qm-central.js) para j_l.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const S3 = (qm.s3 = {});
  const jl = (l, x) => qm.cen.jl(l, x);
  /* y_l (Neumann esférica) por recursión ascendente (estable) */
  const yl = (l, x) => { let y0 = -Math.cos(x) / x; if (l === 0) return y0; let y1 = -Math.cos(x) / (x * x) - Math.sin(x) / x; for (let k = 1; k < l; k++) { const y2 = ((2 * k + 1) / x) * y1 - y0; y0 = y1; y1 = y2; } return y1; };
  const nrm = (d) => d - Math.PI * Math.round(d / Math.PI);
  S3.norm = nrm; S3.jl = jl; S3.yl = yl;
  S3.jlp = (l, x) => (l === 0 ? -jl(1, x) : jl(l - 1, x) - ((l + 1) / x) * jl(l, x));
  S3.ylp = (l, x) => (l === 0 ? -yl(1, x) : yl(l - 1, x) - ((l + 1) / x) * yl(l, x));
  /* Desplazamiento de fase δ_l (módulo π, en (−π/2, π/2]) por integración de Numerov de u'' = [l(l+1)/r² + 2V − k²]u hasta r = a (V = 0 para r ≥ a) */
  S3.delta = function (l, k, V, a, h = 0.002) {
    const N = Math.round(a / h), g = (r) => (l * (l + 1)) / (r * r) + 2 * V(r) - k * k;
    const c = (h * h) / 12, us = new Float64Array(N + 3); us[0] = 0; us[1] = Math.pow(h, l + 1);
    let gm = 0, g0 = g(h);
    for (let n = 1; n < N + 2; n++) {
      const gp = g((n + 1) * h);
      us[n + 1] = (2 * us[n] * (1 + 5 * c * g0) - us[n - 1] * (1 - c * gm)) / (1 - c * gp);
      gm = g0; g0 = gp;
      /* reescala para evitar desbordamiento en regiones prohibidas */
      if (Math.abs(us[n + 1]) > 1e100) for (let m = 0; m <= n + 1; m++) us[m] *= 1e-100;
    }
    /* derivada logarítmica de u en r = a (índice N) por cinco puntos */
    const du = (us[N - 2] - 8 * us[N - 1] + 8 * us[N + 1] - us[N + 2]) / (12 * h), beta = (a * du) / us[N] - 1, x = k * a;
    return nrm(Math.atan2(x * S3.jlp(l, x) - beta * jl(l, x), x * S3.ylp(l, x) - beta * yl(l, x)));
  };
  /* Esfera dura: tan δ_l = j_l(ka)/y_l(ka) */
  S3.hardDelta = (l, k, a) => nrm(Math.atan2(jl(l, k * a), yl(l, k * a)));
  /* Pozo esférico atractivo V = −V0 (r < a), con K = √(k² + 2V0): tan δ_l = [k j_l′(ka) j_l(Ka) − K j_l(ka) j_l′(Ka)] / [k y_l′(ka) j_l(Ka) − K y_l(ka) j_l′(Ka)] */
  S3.wellDelta = function (l, k, V0, a) {
    const K = Math.sqrt(k * k + 2 * V0), x = k * a, X = K * a;
    return nrm(Math.atan2(k * S3.jlp(l, x) * jl(l, X) - K * jl(l, x) * S3.jlp(l, X), k * S3.ylp(l, x) * jl(l, X) - K * yl(l, x) * S3.jlp(l, X)));
  };
  /* Desplazamiento continuo en k (de mayor a menor k, partiendo de δ → 0 en k → ∞): ks decreciente; devuelve δ sin saltos de π */
  S3.unwrap = (ds) => { const out = [ds[0]]; for (let i = 1; i < ds.length; i++) { let d = ds[i]; const p = out[i - 1]; d += Math.PI * Math.round((p - d) / Math.PI); out.push(d); } return out; };
  /* Longitud de dispersión del pozo (l = 0): a_s = a[1 − tan(K0 a)/(K0 a)], K0 = √(2V0) */
  S3.wellScatLength = (V0, a) => { const K0 = Math.sqrt(2 * V0); return a * (1 - Math.tan(K0 * a) / (K0 * a)); };
  /* Sección eficaz por ondas parciales: σ = (4π/k²) Σ (2l + 1) sin²δ_l; deltas: arreglo de δ_l */
  S3.sigma = (k, deltas) => (4 * Math.PI / (k * k)) * deltas.reduce((s, d, l) => s + (2 * l + 1) * Math.sin(d) ** 2, 0);
  /* Amplitud f(θ) = (1/k) Σ (2l + 1) e^{iδ} sin δ P_l(cos θ) → [re, im] */
  S3.amp = function (k, deltas, th) {
    const c = Math.cos(th); let p0 = 1, p1 = c, re = 0, im = 0;
    deltas.forEach((d, l) => { const P = l === 0 ? 1 : l === 1 ? c : (() => { const p2 = ((2 * l - 1) * c * p1 - (l - 1) * p0) / l; p0 = p1; p1 = p2; return p2; })(), w = (2 * l + 1) * Math.sin(d); re += w * Math.cos(d) * P; im += w * Math.sin(d) * P; });
    return [re / k, im / k];
  };
  /* Born: f_B(q) = −(2/q) ∫₀^∞ r V(r) sin(qr) dr (2m/ħ² = 2); Simpson sobre [0, rmax] */
  S3.bornF = function (q, V, rmax, N = 4000) { const h = rmax / N; let s = 0; for (let i = 1; i <= N; i++) { const r = i * h, w = i === N ? 1 : i % 2 ? 4 : 2; s += w * r * V(r) * Math.sin(q * r); } return (-2 / q) * ((s * h) / 3); };
  S3.bornSigma = function (k, V, rmax, N = 400) { const h = (2 * k) / N; let s = 0; for (let i = 1; i <= N; i++) { const q = i * h, w = i === N ? 1 : i % 2 ? 4 : 2, f = S3.bornF(q, V, rmax, 1500); s += w * f * f * q; } return ((2 * Math.PI) / (k * k)) * ((s * h) / 3); };
  if (typeof module !== 'undefined' && module.exports) module.exports = S3;
})(typeof window !== 'undefined' ? window : globalThis);
