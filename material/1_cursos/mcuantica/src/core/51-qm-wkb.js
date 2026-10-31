/* ===================================================================
   51-qm-wkb.js — Aproximación WKB (EM.qm.wkb): puntos de retorno, integral de acción, regla de Bohr–Sommerfeld,
   transmisión por una barrera y exponente de Gamow. Unidades arbitrarias con ħ y m dados (por defecto 1).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const W = (qm.wkb = {});
  /* Raíz de V(x) = E en [a, b] por bisección (V − E cambia de signo) */
  W.root = function (V, E, a, b) {
    let fa = V(a) - E, fb = V(b) - E; if (fa * fb > 0) return NaN;
    for (let i = 0; i < 200; i++) { const m = 0.5 * (a + b), fm = V(m) - E; if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; } }
    return 0.5 * (a + b);
  };
  /* ∫_{x1}^{x2} √(2m|E − V|) dx/ħ con x = x1 + (x2 − x1)(1 − cos θ)/2, θ ∈ [0, π] (regulariza los extremos); signo de E − V arbitrario */
  W.action = function (V, E, x1, x2, m = 1, hb = 1, N = 4000) {
    const h = Math.PI / N; let s = 0;
    for (let i = 0; i <= N; i++) { const th = i * h, x = x1 + ((x2 - x1) * (1 - Math.cos(th))) / 2, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * Math.sqrt(Math.max(0, 2 * m * Math.abs(E - V(x)))) * (((x2 - x1) / 2) * Math.sin(th)); }
    return (s * h) / 3 / hb;
  };
  /* Energía n-ésima de Bohr–Sommerfeld: ∫_{x1}^{x2} p dx = (n + ½)πħ. Se busca E por bisección con puntos de retorno hallados desde el mínimo xm hacia ambos lados (hasta ±L). */
  W.level = function (V, n, xm, L, m = 1, hb = 1, Emax = 1e4) {
    const act = (E) => { let x1 = xm, x2 = xm, st = L / 4000; while (V(x1) < E && xm - x1 < L) x1 -= st; while (V(x2) < E && x2 - xm < L) x2 += st; x1 = W.root(V, E, x1, x1 + st) ; x2 = W.root(V, E, x2 - st, x2); return W.action(V, E, x1, x2, m, hb, 1500); };
    let lo = V(xm) + 1e-9, hi = V(xm) + 1, target = (n + 0.5) * Math.PI;
    while (act(hi) < target && hi < Emax) hi = V(xm) + 2 * (hi - V(xm));
    for (let i = 0; i < 80; i++) { const mid = 0.5 * (lo + hi); if (act(mid) < target) lo = mid; else hi = mid; }
    return 0.5 * (lo + hi);
  };
  /* Transmisión WKB T ≈ exp(−2∫κ dx) con κ = √(2m(V − E))/ħ entre los puntos de retorno x1, x2 */
  W.tunnel = (V, E, x1, x2, m = 1, hb = 1) => Math.exp(-2 * W.action(V, E, x1, x2, m, hb));
  /* Exponente de Gamow para la barrera de Coulomb V = k/r (k = Z₁Z₂e²/4πε₀) desde R hasta b = k/E: 2G = (4k/ħv)[arccos√x − √(x(1−x))], x = R/b, v = √(2E/μ) */
  W.gamow = function (k, mu, E, R, hb = 1) {
    const b = k / E, x = R / b, v = Math.sqrt((2 * E) / mu);
    return ((4 * k) / (hb * v)) * (Math.acos(Math.sqrt(x)) - Math.sqrt(x * (1 - x)));
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = W;
})(typeof window !== 'undefined' ? window : globalThis);
