/* ===================================================================
   46-qm-mag.js — Partícula cargada en un campo magnético (EM.qm.mag), SI.
   Niveles de Landau, longitud magnética, fase de Aharonov–Bohm y un modelo mínimo del efecto Hall cuántico entero.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Mg = (qm.mag = {});
  const K = { e: 1.602176634e-19, me: 9.1093837015e-31, h: 6.62607015e-34, hbar: 1.054571817e-34 };
  Mg.K = K;
  /* Frecuencia ciclotrón ω_c = qB/m (rad/s) */
  Mg.wc = (B, m = K.me, q = K.e) => (q * B) / m;
  /* E_n = ħω_c (n + ½) (J) */
  Mg.landauE = (n, B, m = K.me, q = K.e) => K.hbar * Mg.wc(B, m, q) * (n + 0.5);
  /* Longitud magnética ℓ = √(ħ/qB) (m) */
  Mg.ell = (B, q = K.e) => Math.sqrt(K.hbar / (q * B));
  /* Degeneración por unidad de área de cada nivel (por espín): qB/h */
  Mg.degArea = (B, q = K.e) => (q * B) / K.h;
  /* Cuanto de flujo h/q */
  Mg.phi0 = (q = K.e) => K.h / q;
  /* Estado de Landau en la gauge de Landau A = (0, Bx, 0): ψ = e^{iky} φ_n((x − x₀)/ℓ)/√ℓ con x₀ = −kℓ² (la parte en x es un oscilador armónico) */
  Mg.psi = (n, x, x0, ell) => EM.P.sf.hoPsi(n, (x - x0) / ell) / Math.sqrt(ell);
  /* Intensidad normalizada (0 a 1) de dos rendijas con un flujo Φ entre ellas, en unidades de h/e: I = cos²(π d y/(λL) − πΦ/Φ₀) */
  Mg.abPattern = (y, d, lam, L, fluxQuanta) => Math.cos((Math.PI * d * y) / (lam * L) - Math.PI * fluxQuanta) ** 2;
  /* Fase de Aharonov–Bohm 2πΦ/Φ₀ */
  Mg.abPhase = (fluxQuanta) => 2 * Math.PI * fluxQuanta;
  /* Factor de llenado ν = n h/(eB) */
  Mg.filling = (n, B) => (n * K.h) / (K.e * B);
  /* Modelo mínimo del efecto Hall entero con espín resuelto: la fracción de llenado del nivel n es f_n = clamp(ν − n, 0, 1) y
     solo los estados cercanos al centro (f ≈ 1/2) transportan corriente; ν_T = Σ_n s(f_n), con s una sigmoide en (f_n − ½)/w normalizada de modo que s(0) = 0 y s(1) = 1. Resistencias en unidades de h/e².
     ρ_xy = 1/ν_T (ρ_xy clásico: 1/ν); ρ_xx ∝ Σ_n exp(−((f_n − ½)/w)²) (picos en los centros). */
  Mg.hallModel = function (nu, w) {
    let nuT = 0, rxx = 0;
    const sg = (x) => 1 / (1 + Math.exp(-x / w)), s0 = sg(-0.5), s1 = sg(0.5);
    for (let n = 0; n < 60; n++) { const f = Math.min(1, Math.max(0, nu - n)), s = (sg(f - 0.5) - s0) / (s1 - s0); nuT += s; rxx += Math.exp(-(((f - 0.5) / w) ** 2)) * (f > 0 && f < 1 ? 1 : 0); }
    return { nuT, rxy: 1 / Math.max(nuT, 1e-3), rxx };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Mg;
})(typeof window !== 'undefined' ? window : globalThis);
