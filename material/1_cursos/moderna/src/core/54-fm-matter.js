/* ===================================================================
   54-fm-matter.js — Ondas de materia e incertidumbre (EM.fm.mat): de Broglie, doble rendija (Fraunhofer), visibilidad y
   complementariedad, paquete gaussiano libre, estimaciones por incertidumbre. Sin DOM; SI salvo aviso.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const T = (fm.mat = {});
  const { h, hbar, c, e, me, kB } = K;
  T.sinc = (x) => (Math.abs(x) < 1e-8 ? 1 - (x * x) / 6 : Math.sin(x) / x);
  /* Longitud de onda de de Broglie de una partícula de masa m (kg) y energía cinética Kin (J), exacta: hc/√(K(K + 2mc²)) */
  T.lambdaK = (Kin, m) => (h * c) / Math.sqrt(Kin * (Kin + 2 * m * c * c));
  T.lambdaThermal = (m, Temp) => h / Math.sqrt(2 * m * 1.5 * kB * Temp);        /* neutrón térmico: K = (3/2)kT */
  T.lambdaP = (p) => h / p;
  /* Doble rendija de anchura a y separación d (centro a centro) en el límite de Fraunhofer: I(θ)/I(0) = cos²(β)·sinc²(α) con β = πd senθ/λ, α = πa senθ/λ.
     V ∈ [0,1] es la visibilidad: I ∝ [1 + V cos(2β)]/2 · sinc²(α). */
  T.doubleSlit = (th, lam, d, a, V = 1) => { const s = Math.sin(th), beta = (Math.PI * d * s) / lam, alpha = (Math.PI * a * s) / lam; return 0.5 * (1 + V * Math.cos(2 * beta)) * T.sinc(alpha) ** 2; };
  T.fringeAngle = (lam, d) => lam / d;                        /* separación angular de franjas */
  /* Relación de complementariedad de Englert (1996): V² + D² ≤ 1, con D la distinguibilidad de los caminos */
  T.visibility = (D) => Math.sqrt(Math.max(0, 1 - D * D));
  /* Paquete gaussiano libre: σ(t) = σ₀√(1 + (ħt/2mσ₀²)²), Δp = ħ/(2σ₀) constante; tiempo característico de expansión 2mσ₀²/ħ */
  T.sigma = (t, s0, m) => s0 * Math.sqrt(1 + (hbar * t / (2 * m * s0 * s0)) ** 2);
  T.spreadTime = (s0, m) => (2 * m * s0 * s0) / hbar;
  T.dp = (s0) => hbar / (2 * s0);
  /* Densidad del paquete gaussiano en x y t (normalizada) */
  T.gaussDensity = (x, t, s0, m, x0 = 0, v0 = 0) => { const s = T.sigma(t, s0, m), xc = x0 + v0 * t; return Math.exp(-((x - xc) ** 2) / (2 * s * s)) / (Math.sqrt(2 * Math.PI) * s); };
  /* Estimación del estado fundamental del hidrógeno con Δp ≈ ħ/r: E(r) = ħ²/(2 m r²) − e²/(4πε₀ r) (J) */
  T.hEstimate = (r) => (hbar * hbar) / (2 * me * r * r) - (e * e) / (4 * Math.PI * K.eps0 * r);
  T.hEstimateMin = () => ({ r: (4 * Math.PI * K.eps0 * hbar * hbar) / (me * e * e), E: -(me * Math.pow(e * e / (4 * Math.PI * K.eps0), 2)) / (2 * hbar * hbar) });
  /* Anchura natural de un nivel con tasa de desintegración A (s⁻¹): Γ = ħA (energía), Δν = A/(2π) */
  T.naturalWidthEV = (A) => (hbar * A) / e;
  T.naturalWidthHz = (A) => A / (2 * Math.PI);
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(typeof window !== 'undefined' ? window : globalThis);
