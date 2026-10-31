/* ===================================================================
   38-qm-scat.js — Dispersión unidimensional por potenciales constantes a trozos (EM.qm.scat).
   Se integra hacia atrás desde la derecha: (ψ, ψ′) cambia en cada capa con la matriz [[C, S], [−q²S, C]],
   donde q² = 2m(E − V)/ħ², C = cos qΔ o cosh, S = sen(qΔ)/q o senh(κΔ)/κ. Incidencia desde la izquierda.
   bounds = [b₁ < … < b_n] (interfaces), Vs = [V₀, V₁, …, V_n] (V₀ a la izquierda de b₁ y V_n a la derecha de b_n).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const S = (qm.scat = {});
  const CS = (q2, d) => (q2 > 1e-300 ? [Math.cos(Math.sqrt(q2) * d), Math.sin(Math.sqrt(q2) * d) / Math.sqrt(q2)] : q2 < -1e-300 ? [Math.cosh(Math.sqrt(-q2) * d), Math.sinh(Math.sqrt(-q2) * d) / Math.sqrt(-q2)] : [1, d]);
  /* Devuelve {T, R, psi(x) → [re, im]} con amplitud incidente 1 */
  S.solve = function (E, bounds, Vs, m = 1, hb = 1) {
    const n = bounds.length, f = (2 * m) / (hb * hb), q2 = Vs.map((V) => f * (E - V));
    const kL = Math.sqrt(q2[0]);
    let pr, pi, dr, di; /* ψ y ψ′ en b_n, parte real e imaginaria */
    if (q2[n] > 0) { pr = 1; pi = 0; dr = 0; di = Math.sqrt(q2[n]); } else { pr = 1; pi = 0; dr = -Math.sqrt(-q2[n]); di = 0; }
    const rightVals = new Array(n + 1); rightVals[n] = [pr, pi, dr, di];
    for (let j = n - 1; j >= 1; j--) { /* capa j entre b_j y b_{j+1} (índice de V = j) */
      rightVals[j] = [pr, pi, dr, di]; /* valores en su frontera derecha, antes de propagar */
      const [C, Sx] = CS(q2[j], bounds[j - 1] - bounds[j]);
      const npr = C * pr + Sx * dr, npi = C * pi + Sx * di, ndr = -q2[j] * Sx * pr + C * dr, ndi = -q2[j] * Sx * pi + C * di;
      pr = npr; pi = npi; dr = ndr; di = ndi;
    }
    /* en b_1: descomposición en ondas de la región izquierda */
    const A = [0.5 * (pr + di / kL), 0.5 * (pi - dr / kL)], B = [0.5 * (pr - di / kL), 0.5 * (pi + dr / kL)];
    const A2 = A[0] * A[0] + A[1] * A[1], B2 = B[0] * B[0] + B[1] * B[1];
    const kR = q2[n] > 0 ? Math.sqrt(q2[n]) : 0, T = q2[n] > 0 ? kR / kL / A2 : 0, R = B2 / A2;
    const sc = 1 / A2; /* ψ/A: A* / |A|² */
    const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
    const Ainv = [A[0] / A2, -A[1] / A2];
    const psi = (x) => {
      let v;
      if (x < bounds[0]) { const a = x - bounds[0], c = Math.cos(kL * a), s = Math.sin(kL * a); v = [A[0] * c - A[1] * s + B[0] * c + B[1] * s, A[0] * s + A[1] * c + B[1] * c - B[0] * s]; }
      else if (x >= bounds[n - 1]) { const a = x - bounds[n - 1]; if (q2[n] > 0) { const c = Math.cos(kR * a), s = Math.sin(kR * a); v = [pr0() * c - pi0() * s, pr0() * s + pi0() * c]; } else { const e = Math.exp(-Math.sqrt(-q2[n]) * a); v = [e, 0]; } }
      else { let j = 1; while (j < n && x >= bounds[j]) j++; /* capa j: b_{j} ≤ x < b_{j+1}, j = índice de V */ const rv = rightVals[j], [C, Sx] = CS(q2[j], x - bounds[j]); v = [C * rv[0] + Sx * rv[2], C * rv[1] + Sx * rv[3]]; }
      return mul(v, Ainv);
    };
    const pr0 = () => 1, pi0 = () => 0;
    return { T, R, kL, kR, psi, A: Math.sqrt(A2), sc };
  };
  S.T = (E, bounds, Vs, m = 1, hb = 1) => S.solve(E, bounds, Vs, m, hb).T;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
