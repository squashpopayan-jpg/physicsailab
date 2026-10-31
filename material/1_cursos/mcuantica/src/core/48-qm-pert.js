/* ===================================================================
   48-qm-pert.js — Teoría de perturbaciones independiente del tiempo (EM.qm.pert).
   Serie de Rayleigh–Schrödinger a orden arbitrario (recursión de Hirschfelder), oscilador anarmónico λx⁴ (ħ = m = ω = 1),
   sistema de dos niveles y efecto Stark del hidrógeno (unidades atómicas). Requiere EM.P.la (30-linalg.js).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Pt = (qm.pert = {});
  /* Coeficientes E_0, E_1, …, E_K del nivel n0 de H = H0 + g V, con H0 diagonal (E0[i]) y V denso (matriz) en la base de H0 */
  Pt.rs = function (E0, V, n0, K) {
    const M = E0.length, E = [E0[n0]], psi = [Array.from({ length: M }, (_, i) => (i === n0 ? 1 : 0))];
    for (let k = 1; k <= K; k++) {
      const Vp = new Float64Array(M); const prev = psi[k - 1];
      for (let i = 0; i < M; i++) { let s = 0; const row = V[i]; for (let j = 0; j < M; j++) s += row[j] * prev[j]; Vp[i] = s; }
      E.push(Vp[n0]);
      const cur = new Float64Array(M);
      for (let m = 0; m < M; m++) { if (m === n0) continue; let s = Vp[m]; for (let j = 1; j < k; j++) s -= E[j] * psi[k - j][m]; cur[m] = s / (E0[n0] - E0[m]); }
      psi.push(cur);
    }
    return E;
  };
  /* Matrices del oscilador armónico (ħ = m = ω = 1) en la base |0⟩…|M−1⟩: X y su cuarta potencia X⁴ (exacta para filas < M − 4) */
  Pt.hoX = function (M) { const X = EM.P.la.zeros(M); for (let n = 0; n < M - 1; n++) { X[n][n + 1] = X[n + 1][n] = Math.sqrt((n + 1) / 2); } return X; };
  Pt.hoX4 = function (M) { const X = Pt.hoX(M), X2 = EM.P.la.matmul(X, X); return EM.P.la.matmul(X2, X2); };
  /* Energía exacta del estado n de H = p²/2 + x²/2 + g x⁴ por diagonalización en una base de M estados */
  Pt.anharmExact = function (g, M = 160, k = 4) {
    const H = EM.P.la.zeros(M), X4 = Pt.hoX4(M);
    for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) H[i][j] = g * X4[i][j] + (i === j ? i + 0.5 : 0);
    const r = EM.P.la.eigh(H, { vectors: false }); return Array.from(r.values).slice(0, k);
  };
  /* Dos niveles: H = [[0, V], [V, Δ]]; energía exacta del nivel inferior (con V = 0 vale 0) y serie en V/Δ hasta el orden dado */
  Pt.twoExact = (D, V) => D / 2 - Math.sqrt((D * D) / 4 + V * V);
  Pt.twoSeries = function (D, V, order) { const c = [0, -1 / D, 1 / (D ** 3), -2 / (D ** 5), 5 / (D ** 7), -14 / (D ** 9), 42 / (D ** 11)]; let s = 0; for (let k = 1; k <= order; k++) s += c[k] * V ** (2 * k); return s; };
  /* Hidrógeno en un campo eléctrico F (u. at.): segunda orden del estado fundamental E = −1/2 − (9/4)F² (α = 9/2); n = 2, m = 0: E = −1/8 ± 3F */
  Pt.starkGround = (F) => -0.5 - 2.25 * F * F;
  Pt.starkN2 = (F) => [-0.125 - 3 * F, -0.125 + 3 * F];
  if (typeof module !== 'undefined' && module.exports) module.exports = Pt;
})(typeof window !== 'undefined' ? window : globalThis);
