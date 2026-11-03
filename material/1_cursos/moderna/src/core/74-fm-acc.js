/* ===================================================================
   74-fm-acc.js — Aceleradores y detectores (EM.fm.acc): rigidez magnética, sincrotrón, radiación de sincrotrón, colisionador frente a blanco fijo,
   umbrales, luminosidad, pérdida de energía por ionización (Bethe–Bloch) y rango (curva de Bragg), cociente R de e⁺e⁻, sección eficaz e⁺e⁻ → μ⁺μ⁻,
   evolución de la constante de estructura fina. Sin DOM. GeV, MeV, m, T.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const A = (fm.acc = {});
  const c = K.c, e = K.e, alpha = 1 / 137.035999084;
  A.MeV = 1.602176634e-13;
  /* rigidez: p[GeV/c] = c·B·ρ·10⁻⁹/(1 [e]) = 0.299792458 B[T] ρ[m] (carga unidad) */
  A.pFromB = (B, rho, q = 1) => (q * c * B * rho) / 1e9;
  A.revFreq = (Lring, beta = 1) => (beta * c) / Lring;
  A.cyclotronFreq = (B, mMeV, q = 1, gamma = 1) => (q * e * B) / (2 * Math.PI * gamma * mMeV * A.MeV / (c * c));
  /* radiación de sincrotrón por vuelta: ΔE = (e²/3ε₀)β³γ⁴/ρ  (J) → GeV */
  A.syncLoss = (EGeV, mGeV, rho) => { const g = EGeV / mGeV, b = Math.sqrt(1 - 1 / (g * g)); return ((e * e / (3 * K.eps0)) * Math.pow(b, 3) * Math.pow(g, 4)) / rho / e / 1e9; };
  /* ---- cinemática ---- */
  A.sqrtsCollider = (E1, E2) => 2 * Math.sqrt(E1 * E2);                                           /* de frente, masas despreciables */
  A.sqrtsFixed = (E, m1, m2) => Math.sqrt(m1 * m1 + m2 * m2 + 2 * E * m2);                       /* E total del proyectil, blanco en reposo (GeV) */
  A.fixedEnergyForSqrts = (rs, m1, m2) => (rs * rs - m1 * m1 - m2 * m2) / (2 * m2);               /* E total del proyectil */
  A.thresholdKinetic = (mProj, mTarget, mSum) => (mSum * mSum - (mProj + mTarget) ** 2) / (2 * mTarget);    /* energía cinética umbral */
  /* ---- luminosidad de dos haces gaussianos de colisión frontal: L = N₁N₂ f n_b/(4π σ_x σ_y) (cm⁻² s⁻¹) ---- */
  A.luminosity = (N1, N2, f, nb, sx_m, sy_m) => (N1 * N2 * f * nb) / (4 * Math.PI * sx_m * 100 * sy_m * 100);
  A.eventRate = (sigma_pb, L) => sigma_pb * 1e-36 * L;                                           /* s⁻¹ */
  /* ---- Bethe–Bloch (sin corrección de densidad ni de capas): MeV cm²/g ---- */
  A.bethe = function (T_MeV, Mp_MeV, ZoverA, I_eV, z = 1) {
    const me = 0.51099895, g = 1 + T_MeV / Mp_MeV, b2 = 1 - 1 / (g * g), bg2 = g * g - 1, Tmax = (2 * me * bg2) / (1 + (2 * g * me) / Mp_MeV + (me / Mp_MeV) ** 2), I = I_eV * 1e-6;
    return 0.307075 * z * z * ZoverA * (1 / b2) * (0.5 * Math.log((2 * me * bg2 * Tmax) / (I * I)) - b2);
  };
  /* rango CSDA (g/cm²) = ∫ dT/S(T) desde T₀ = 0.5 MeV (por debajo, el rango residual es ≲ 10⁻³ g/cm² y Bethe–Bloch deja de valer) */
  A.range = function (T_MeV, Mp_MeV, ZoverA, I_eV, n = 4000) {
    const T0 = 0.5; let s = 0; const dT = (T_MeV - T0) / n;
    for (let i = 0; i <= n; i++) { const T = T0 + i * dT, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; s += w / A.bethe(T, Mp_MeV, ZoverA, I_eV); }
    return (s * dT) / 3;
  };
  /* ---- e⁺e⁻ ---- */
  A.sigmaMuMu = (rs_GeV) => ((4 * Math.PI * alpha * alpha) / (3 * rs_GeV * rs_GeV)) * 0.3893793721e6;       /* nb */
  A.Rratio = (rs) => { const Q2 = [[4 / 9, 0.0], [1 / 9, 0.0], [1 / 9, 0.0], [4 / 9, 3.0], [1 / 9, 9.5], [4 / 9, 350]]; let s = 0; for (const [q2, th] of Q2) if (rs > th) s += q2; return 3 * s; };    /* umbrales 2m_q aproximados */
  /* constante de estructura fina con un lazo: 1/α(Q) = 1/α₀ − (1/3π) Σ N_c Q_f² ln(Q²/m_f²) con las masas por encima de umbral */
  A.alphaRun = (Q_GeV, masses = [[0.000511, 1, 1], [0.1057, 1, 1], [1.777, 1, 1], [0.3, 3, 4 / 9], [0.3, 3, 1 / 9], [0.5, 3, 1 / 9], [1.5, 3, 4 / 9], [4.5, 3, 1 / 9]]) => {
    let inv = 1 / alpha; for (const [m, Nc, q2] of masses) if (Q_GeV > m) inv -= (Nc * q2 / (3 * Math.PI)) * Math.log((Q_GeV * Q_GeV) / (m * m)); return 1 / inv;
  };
})(typeof window !== 'undefined' ? window : globalThis);
