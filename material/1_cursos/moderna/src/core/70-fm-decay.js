/* ===================================================================
   70-fm-decay.js — Radiactividad (EM.fm.dec): ley exponencial, actividad, estadística de Poisson (Monte Carlo), cadenas de Bateman, valores Q de las
   desintegraciones α, β⁻, β⁺ y captura electrónica desde masas atómicas, efecto túnel de Gamow (barrera de Coulomb, WKB analítico y numérico),
   espectro β con la función de Fermi, datación radiométrica. Sin DOM; SI salvo indicación (MeV y fm en lo nuclear).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const D = (fm.dec = {});
  const NU = () => fm.nuc;
  const YEAR = 365.25 * 86400, NA = K.NA;
  D.YEAR = YEAR; D.CI = 3.7e10;
  D.lambda = (T12) => Math.LN2 / T12;
  D.N = (N0, lam, t) => N0 * Math.exp(-lam * t);
  D.activity = (N, lam) => lam * N;                                         /* Bq */
  D.atoms = (massG, Amol) => (massG / Amol) * NA;
  /* ---- estadística: Monte Carlo de N núcleos con probabilidad p = 1 − e^{−λΔt} por paso ---- */
  D.mcDecay = function (N0, lam, dt, steps, seed = 1) {
    const rng = EM.P.rng(seed), p = -Math.expm1(-lam * dt), out = [N0]; let N = N0;
    for (let s = 0; s < steps; s++) {
      let k = 0;
      if (N <= 60) { for (let i = 0; i < N; i++) if (rng() < p) k++; } else { const m = N * p, sd = Math.sqrt(N * p * (1 - p)); k = Math.max(0, Math.min(N, Math.round(m + sd * rng.gauss()))); }
      N -= k; out.push(N);
    }
    return out;
  };
  /* ---- Bateman: cadena A₁ → A₂ → … → A_n con constantes λ distintas; N₁(0) = N0, el resto 0 ---- */
  D.bateman = function (lams, N0, t, n) {
    /* N_n(t) = N0 (∏_{i<n} λ_i) Σ_i e^{−λ_i t} / ∏_{j≠i}(λ_j − λ_i), i, j = 1…n */
    let pre = 1; for (let i = 0; i < n - 1; i++) pre *= lams[i];
    let s = 0; for (let i = 0; i < n; i++) { let den = 1; for (let j = 0; j < n; j++) if (j !== i) den *= (lams[j] - lams[i]); s += Math.exp(-lams[i] * t) / den; }
    return N0 * pre * s;
  };
  D.batemanTmax = (l1, l2) => Math.log(l2 / l1) / (l2 - l1);                 /* instante de máxima población (y de actividad igual) del hijo */
  D.transientRatio = (l1, l2) => l2 / (l2 - l1);                              /* A₂/A₁ en equilibrio transitorio (λ₂ > λ₁) */
  /* ---- valores Q (MeV) desde masas atómicas ---- */
  D.Qalpha = (Z, A) => (NU().mass(Z, A) - NU().mass(Z - 2, A - 4) - NU().mass(2, 4)) * NU().u_MeV;
  D.Qbeta = (Z, A) => (NU().mass(Z, A) - NU().mass(Z + 1, A)) * NU().u_MeV;                 /* β⁻: M(Z) − M(Z + 1) */
  D.QEC = (Z, A) => (NU().mass(Z, A) - NU().mass(Z - 1, A)) * NU().u_MeV;
  D.Qbeta_plus = (Z, A) => D.QEC(Z, A) - 2 * NU().meMeV;
  /* ---- túnel de Gamow ---- */
  D.ALPHA_C = 1.43996448;                                                     /* e²/4πε₀ en MeV fm */
  D.coulombBarrier = (Z1, Z2, R) => (D.ALPHA_C * Z1 * Z2) / R;                /* MeV */
  D.turningPoint = (Z1, Z2, Q) => (D.ALPHA_C * Z1 * Z2) / Q;                  /* b (fm) */
  D.reducedMassMeV = (A1, A2) => (A1 * A2 * NU().u_MeV) / (A1 + A2);
  /* exponente de Gamow 2G = 2 ∫_R^b √(2μ(V − Q))/ħ dr  (analítico) */
  D.gamow2G = function (Z1, Z2, A1, A2, Q, R) {
    const mu = D.reducedMassMeV(A1, A2), b = D.turningPoint(Z1, Z2, Q), x = R / b; if (x >= 1) return 0;
    return 2 * (Math.sqrt(2 * mu * Q) / NU().hbarc) * b * (Math.acos(Math.sqrt(x)) - Math.sqrt(x * (1 - x)));
  };
  D.gamow2Gnum = function (Z1, Z2, A1, A2, Q, R, N = 20000) {
    const mu = D.reducedMassMeV(A1, A2), b = D.turningPoint(Z1, Z2, Q); if (R >= b) return 0;
    /* cambio de variable r = b − (b − R)(1 − s²) para suavizar la singularidad de la raíz en r = b */
    let s = 0; const dsx = 1 / N;
    for (let i = 0; i <= N; i++) { const t = i * dsx, r = b - (b - R) * (1 - t * t) * 1, rr = r < R ? R : r; const v = D.ALPHA_C * Z1 * Z2 / rr - Q; const f = Math.sqrt(Math.max(0, 2 * mu * v)) / NU().hbarc * (2 * (b - R) * t); const w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * f; }
    return 2 * (s * dsx / 3);
  };
  /* semivida α estimada: λ = ν₀ e^{−2G}, ν₀ = v/2R con v = √(2(Q + V₀)/μ), V₀ = 35 MeV; R = r₀(A_d^{1/3} + 4^{1/3}) */
  D.alphaHalfLife = function (Z, A, Q, r0 = 1.2, V0 = 35) {
    const Ad = A - 4, Zd = Z - 2, R = r0 * (Math.cbrt(Ad) + Math.cbrt(4)), mu = D.reducedMassMeV(4, Ad), v = Math.sqrt(2 * (Q + V0) / mu) * K.c, nu0 = v / (2 * R * 1e-15), G2 = D.gamow2G(2, Zd, 4, Ad, Q, R);
    return { T12: Math.LN2 / (nu0 * Math.exp(-G2)), G2, R, b: D.turningPoint(2, Zd, Q), barrier: D.coulombBarrier(2, Zd, R), nu0 };
  };
  /* ---- espectro β con función de Fermi no relativista: S(T) ∝ F(Z', W) p W (Q − T)² ---- */
  D.betaSpectrum = function (Zd, Q, sign = -1, n = 400) {
    const me = NU().meMeV, al = 1 / 137.035999084, out = [];
    for (let i = 1; i < n; i++) {
      const T = (Q * i) / n, W = T + me, p = Math.sqrt(W * W - me * me), eta = (-sign) * Zd * al * W / p, x = 2 * Math.PI * eta, F = Math.abs(x) < 1e-8 ? 1 : x / (-Math.expm1(-x));
      out.push({ T, S: F * p * W * (Q - T) ** 2 });
    }
    return out;
  };
  D.betaMean = function (Zd, Q, sign = -1) { const s = D.betaSpectrum(Zd, Q, sign, 2000); let a = 0, b = 0; for (const q of s) { a += q.S; b += q.S * q.T; } return b / a; };
  /* ---- datación ---- */
  D.carbonAge = (ratio, T12 = 5730) => (T12 / Math.LN2) * Math.log(1 / ratio);                 /* ratio = A/A₀ */
  D.KAr = function (ArK, T12 = 1.248e9, br = 0.1072) { const l = Math.LN2 / T12; return (1 / l) * Math.log(1 + (l / (l * br)) * ArK); };   /* ⁴⁰Ar/⁴⁰K = br (e^{λt} − 1) */
})(typeof window !== 'undefined' ? window : globalThis);
