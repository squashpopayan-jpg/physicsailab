/* ===================================================================
   45-qm-couple.js — Suma de momentos angulares (EM.qm.cpl): coeficientes de Clebsch–Gordan (fórmula de Racah),
   acoplamiento L–S, factor de Landé y efecto Zeeman de un término ²P. ħ = 1, energías en las unidades de A y μ_B B.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.cpl = {});
  const fact = (n) => { if (n < 0) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const isInt = (x) => Math.abs(x - Math.round(x)) < 1e-9;
  /* ⟨j1 m1 j2 m2 | J M⟩ */
  K.cg = function (j1, m1, j2, m2, J, M) {
    if (Math.abs(m1 + m2 - M) > 1e-9) return 0;
    if (J < Math.abs(j1 - j2) - 1e-9 || J > j1 + j2 + 1e-9 || !isInt(j1 + j2 - J)) return 0;
    if (Math.abs(m1) > j1 + 1e-9 || Math.abs(m2) > j2 + 1e-9 || Math.abs(M) > J + 1e-9) return 0;
    const pre = Math.sqrt(((2 * J + 1) * fact(Math.round(J + j1 - j2)) * fact(Math.round(J - j1 + j2)) * fact(Math.round(j1 + j2 - J))) / fact(Math.round(j1 + j2 + J + 1)))
      * Math.sqrt(fact(Math.round(J + M)) * fact(Math.round(J - M)) * fact(Math.round(j1 - m1)) * fact(Math.round(j1 + m1)) * fact(Math.round(j2 - m2)) * fact(Math.round(j2 + m2)));
    let s = 0;
    for (let k = 0; k <= 60; k++) {
      const a = [k, j1 + j2 - J - k, j1 - m1 - k, j2 + m2 - k, J - j2 + m1 + k, J - j1 - m2 + k].map((x) => Math.round(x));
      if (a.some((x) => x < 0)) continue;
      s += (k % 2 ? -1 : 1) / a.reduce((p, x) => p * fact(x), 1);
    }
    return pre * s;
  };
  /* Valores de J acoplables: |j1 − j2|, …, j1 + j2 */
  K.Js = (j1, j2) => { const out = []; for (let J = Math.abs(j1 - j2); J <= j1 + j2 + 1e-9; J += 1) out.push(J); return out; };
  /* L·S = ½[J(J+1) − L(L+1) − S(S+1)] */
  K.LS = (L, S, J) => 0.5 * (J * (J + 1) - L * (L + 1) - S * (S + 1));
  /* Factor de Landé g_J (g_s = 2): 1 + [J(J+1) + S(S+1) − L(L+1)]/(2J(J+1)) */
  K.lande = (L, S, J) => (J === 0 ? 0 : 1 + (J * (J + 1) + S * (S + 1) - L * (L + 1)) / (2 * J * (J + 1)));
  /* Término ²P (l = 1, s = ½): H = A L·S + b (L_z + 2 S_z), con b = μ_B B. Devuelve, por M_J, la lista de energías (ordenadas). */
  K.zeemanP = function (A, b) {
    const out = {};
    out['1.5'] = [A / 2 + 2 * b]; out['-1.5'] = [A / 2 - 2 * b];
    const blk = (d1, d2) => { const m = (d1 + d2) / 2, r = Math.sqrt(((d1 - d2) / 2) ** 2 + (A * A) / 2); return [m - r, m + r]; };
    out['0.5'] = blk(-A / 2, b); out['-0.5'] = blk(-b, -A / 2);
    return out;
  };
  /* Energías de los dos niveles de M = ±1/2 en campo débil: E = A·LS(J) + g_J M b */
  K.zeemanWeak = (A, b, M, J) => A * K.LS(1, 0.5, J) + K.lande(1, 0.5, J) * M * b;
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(typeof window !== 'undefined' ? window : globalThis);
