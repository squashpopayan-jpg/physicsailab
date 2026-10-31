/* ===================================================================
   56-qm-secq.js — Segunda cuantización y gases cuánticos (EM.qm.sq), SI donde se indica.
   Operadores de Fock por Jordan–Wigner, modelo de Hubbard de dos sitios, gas ideal de Fermi y condensación de Bose–Einstein.
   Requiere EM.P.la (30-linalg.js).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Sq = (qm.sq = {});
  const K = { hbar: 1.054571817e-34, kB: 1.380649e-23, u: 1.66053906660e-27, me: 9.1093837015e-31, e: 1.602176634e-19 };
  Sq.K = K;
  /* Matrices de aniquilación fermiónicas de M modos (dimensión 2^M) por Jordan–Wigner: c_j = Z⊗…⊗Z⊗σ⁻⊗1⊗…⊗1 */
  Sq.fermi = function (M) {
    const D = 1 << M, ops = [];
    for (let j = 0; j < M; j++) { const c = EM.P.la.zeros(D); for (let s = 0; s < D; s++) { if (!((s >> j) & 1)) continue; let sign = 1; for (let k = 0; k < j; k++) if ((s >> k) & 1) sign = -sign; c[s ^ (1 << j)][s] = sign; } ops.push(c); }
    return ops;
  };
  const mm = (A, B) => EM.P.la.matmul(A, B), tr = (A) => EM.P.la.transpose(A);
  const add = (A, B, s = 1) => A.map((r, i) => Float64Array.from(r, (x, j) => x + s * B[i][j]));
  Sq.anticomm = (A, B) => add(mm(A, B), mm(B, A));
  /* Hubbard de 2 sitios con espín: modos 0 = (sitio 1, ↑), 1 = (1, ↓), 2 = (2, ↑), 3 = (2, ↓); H = −t Σ_σ (c†_{1σ}c_{2σ} + h.c.) + U Σ_i n_{i↑}n_{i↓}. Devuelve la matriz 16×16. */
  Sq.hubbard2 = function (t, U) {
    const c = Sq.fermi(4), d = c.map(tr), n = c.map((ci, i) => mm(d[i], ci)); let H = EM.P.la.zeros(16);
    for (const [a, b] of [[0, 2], [1, 3]]) { H = add(H, mm(d[a], c[b]), -t); H = add(H, mm(d[b], c[a]), -t); }
    H = add(H, mm(n[0], n[1]), U); H = add(H, mm(n[2], n[3]), U); return { H, n, c, d };
  };
  /* Espectro exacto del sector N = 2, S_z = 0: singlete ligado E_S = U/2 − √(U²/4 + 4t²), triplete 0, y los estados U/2 + √(…) y U */
  Sq.hubbard2Levels = (t, U) => { const r = Math.sqrt((U * U) / 4 + 4 * t * t); return { singlet: U / 2 - r, triplet: 0, dpl: U, upper: U / 2 + r }; };
  /* Doble ocupación en el fundamental: ⟨D⟩ = ⟨n_{1↑}n_{1↓} + n_{2↑}n_{2↓}⟩ = 2 sin²(φ/…) con tan 2θ = 4t/U */
  Sq.hubbard2Double = (t, U) => { const r = Math.sqrt((U * U) / 4 + 4 * t * t); return 0.5 * (1 - (U / 2) / r); };
  /* Gas de Fermi 3D (g = 2): E_F = (ħ²/2m)(3π²n)^{2/3} (J); T_F = E_F/k_B; μ(T) ≈ E_F[1 − (π²/12)(kT/E_F)²] */
  Sq.fermiE = (n, m, g = 2) => ((K.hbar ** 2) / (2 * m)) * Math.pow((6 * Math.PI * Math.PI * n) / g, 2 / 3);
  Sq.fermiMu = (EF, T) => EF * (1 - (Math.PI ** 2 / 12) * ((K.kB * T) / EF) ** 2);
  /* Condensación de Bose–Einstein de un gas ideal homogéneo: T_c = (2πħ²/m k_B)(n/ζ(3/2))^{2/3}; fracción condensada 1 − (T/T_c)^{3/2} */
  Sq.zeta32 = 2.6123753486854883; Sq.zeta3 = 1.2020569031595942;
  Sq.bec = (n, m) => ((2 * Math.PI * K.hbar ** 2) / (m * K.kB)) * Math.pow(n / Sq.zeta32, 2 / 3);
  Sq.becFraction = (T, Tc) => (T >= Tc ? 0 : 1 - Math.pow(T / Tc, 1.5));
  /* Trampa armónica isótropa: T_c = ħω̄/k_B (N/ζ(3))^{1/3}; fracción 1 − (T/T_c)³ */
  Sq.becTrap = (N, wbar) => ((K.hbar * wbar) / K.kB) * Math.pow(N / Sq.zeta3, 1 / 3);
  /* Longitud de onda térmica de de Broglie λ = h/√(2π m k_B T) */
  Sq.lambdaT = (m, T) => (2 * Math.PI * K.hbar) / Math.sqrt(2 * Math.PI * m * K.kB * T);
  if (typeof module !== 'undefined' && module.exports) module.exports = Sq;
})(typeof window !== 'undefined' ? window : globalThis);
