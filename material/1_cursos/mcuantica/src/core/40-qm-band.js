/* ===================================================================
   40-qm-band.js — Bandas de energía en potenciales periódicos (EM.qm.band), unidades ħ = m = a = 1.
   · Peine de deltas V = (P) Σ δ(x − n) con P = mαa/ħ² (P &lt; 0: atractivo): cos k = cos q + (P/q) sen q, E = q²/2.
   · Electrones casi libres: V = 2V₁ cos 2πx, diagonalización en ondas planas.
   · Enlace fuerte: E(k) = E₀ − 2t cos k.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const B = (qm.band = {});
  /* f(E) = cos q + (P/q) sin q para E > 0 (q = √(2E)); cosh κ + (P/κ) sinh κ para E < 0 (κ = √(−2E)) */
  B.kpF = (E, P) => {
    if (E > 1e-14) { const q = Math.sqrt(2 * E); return Math.cos(q) + (P / q) * Math.sin(q); }
    if (E < -1e-14) { const k = Math.sqrt(-2 * E); return Math.cosh(k) + (P / k) * Math.sinh(k); }
    return 1 + P;
  };
  /* Bordes de las bandas permitidas (|f| ≤ 1) en [Emin, Emax]: pares [E_inf, E_sup], por barrido y bisección */
  B.kpBands = function (P, Emax, Emin = P < 0 ? -0.5 * P * P * 1.2 - 1 : 0, N = 20000) {
    const out = []; let cur = null;
    const inside = (E) => Math.abs(B.kpF(E, P)) <= 1;
    const edge = (a, b) => { let lo = a, hi = b; const ia = inside(a); for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi); if (inside(m) === ia) lo = m; else hi = m; } return 0.5 * (lo + hi); };
    let prev = Emin, pin = inside(prev);
    if (pin) cur = [Emin, null];
    for (let i = 1; i <= N; i++) {
      const E = Emin + ((Emax - Emin) * i) / N, cin = inside(E);
      if (cin && !pin) cur = [edge(prev, E), null];
      if (!cin && pin && cur) { cur[1] = edge(prev, E); out.push(cur); cur = null; }
      prev = E; pin = cin;
    }
    if (cur) { cur[1] = Emax; out.push(cur); }
    return out;
  };
  /* Energía de la banda nb (0, 1, …) para el número de onda de Bloch k ∈ [0, π]: raíz de f(E) = cos k dentro de la banda */
  B.kpE = function (k, P, nb, Emax = 80) {
    const bands = B.kpBands(P, Emax), b = bands[nb]; if (!b) return NaN;
    const g = (E) => B.kpF(E, P) - Math.cos(k);
    let lo = b[0], hi = b[1], glo = g(lo), ghi = g(hi);
    if (glo * ghi > 0) return NaN;
    for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi), gm = g(m); if (glo * gm <= 0) { hi = m; ghi = gm; } else { lo = m; glo = gm; } }
    return 0.5 * (lo + hi);
  };
  /* Casi libres: autovalores (ordenados) de H_{mm'} = ½(k + 2πm)² δ + V₁ (δ_{m,m'+1} + δ_{m+1,m'}) con |m| ≤ M */
  B.nfe = function (k, V1, M = 8) {
    const n = 2 * M + 1, A = EM.P.la.zeros(n);
    for (let i = 0; i < n; i++) { const g = 2 * Math.PI * (i - M); A[i][i] = 0.5 * (k + g) * (k + g); if (i + 1 < n) { A[i][i + 1] = V1; A[i + 1][i] = V1; } }
    return EM.P.la.eigh(A);
  };
  B.tb = (k, E0, t) => E0 - 2 * t * Math.cos(k);
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(typeof window !== 'undefined' ? window : globalThis);
