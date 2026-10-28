/* ===================================================================
   39-fq-fot.js — Reacciones en disolución (control por difusión, efecto salino, Marcus) y fotoquímica (fluorescencia, Stern–Volmer, estado fotoestacionario).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const F = (FQ.sol2 = {});
  const { R, kB, NA, e, eps0 } = FQ;

  /* Difusión de Stokes–Einstein (m²/s) para una esfera de radio r (m) en un líquido de viscosidad η (Pa·s) */
  F.D = (T, eta, r) => (kB * T) / (6 * Math.PI * eta * r);
  /* Constante de Smoluchowski k_D = 4π(D_A + D_B) R N_A, en L/(mol·s); R = r_A + r_B (m). Si se dan los radios, usa Stokes–Einstein */
  F.kD = (T, eta, rA, rB) => 4 * Math.PI * (F.D(T, eta, rA) + F.D(T, eta, rB)) * (rA + rB) * NA * 1e3;
  /* Caso de dos esferas iguales: k_D = 8RT/(3η) */
  F.kD8 = (T, eta) => (8 * R * T) / (3 * eta) * 1e3;
  /* Factor de Debye–Smoluchowski para iones: k = k_D·δ/(e^δ − 1), δ = r_c/R con la longitud r_c = z_A z_B e²/(4π ε₀ ε_r k_B T) */
  F.debyeFactor = (T, epsr, zA, zB, Rm) => { const d = (zA * zB * e * e) / (4 * Math.PI * eps0 * epsr * kB * T * Rm); return Math.abs(d) < 1e-9 ? 1 : d / Math.expm1(d); };
  /* Control mixto (Collins y Kimball / Noyes): 1/k = 1/k_D + 1/k_act */
  F.kMixed = (kD, kAct) => (kD * kAct) / (kD + kAct);
  /* Efecto salino cinético primario: log(k/k₀) = 2 A z_A z_B f(I) (Davies) */
  F.saltLog = (zA, zB, I, T) => { const A = FQ.Adh(T || 298.15), s = Math.sqrt(I); return 2 * A * zA * zB * (s / (1 + s) - 0.3 * I); };
  F.saltLimit = (zA, zB, I, T) => 2 * FQ.Adh(T || 298.15) * zA * zB * Math.sqrt(I);

  /* Teoría de Marcus de la transferencia de electrones */
  F.marcusBarrier = (dG0, lam) => ((lam + dG0) * (lam + dG0)) / (4 * lam);
  F.marcusK = (dG0, lam, T, Z) => Z * Math.exp(-F.marcusBarrier(dG0, lam) / (R * T)); /* dG0, lam en J/mol */
  F.marcusCross = (k11, k22, K12, Z) => { const L = Math.log((k11 * k22) / (Z * Z)), lnK = Math.log(K12), f = Math.exp((lnK * lnK) / (4 * L)); return Math.sqrt(k11 * k22 * K12 * f); };

  /* Fotofísica del estado excitado S₁: Φ_F = k_r/(k_r + k_nr + k_isc + k_q[Q]), τ = 1/(suma) */
  F.photo = (kr, knr, kisc, kq, Q) => { const k = kr + knr + kisc + kq * Q, k0 = kr + knr + kisc; return { tau: 1 / k, tau0: 1 / k0, phiF: kr / k, phiF0: kr / k0, phiIsc: kisc / k, kSV: kq / k0 }; };
  F.sternVolmer = (kq, tau0, Q) => 1 + kq * tau0 * Q;

  /* Ciclo de Leighton: NO₂ + hν → NO + O (→ O₃); NO + O₃ → NO₂; y NO + RO₂ → NO₂ + RO con tasa efectiva kp (s⁻¹, kp = k[RO₂]).
     y = [NO₂, NO, O₃] en cualquier unidad de concentración (con k3 en esa unidad⁻¹ s⁻¹) */
  F.leightonRHS = (J, k3, kp) => (t, y) => { const r = k3 * y[1] * y[2], q = (kp || 0) * y[1]; return [-J * y[0] + r + q, J * y[0] - r - q, J * y[0] - r]; };
  /* Estado estacionario con kp = 0: [O₃] = J[NO₂]/(k₃[NO]) */
  F.leightonO3 = (J, k3, NO2, NO) => (J * NO2) / (k3 * NO);

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
