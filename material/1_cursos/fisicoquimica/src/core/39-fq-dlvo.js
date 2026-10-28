/* ===================================================================
   39-fq-dlvo.js — Coloides: doble capa eléctrica (Poisson–Boltzmann), teoría DLVO, concentración crítica de coagulación y electroforesis (Henry).
   Unidades SI. Electrolito simétrico z:z en agua a 298.15 K.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const D = (FQ.dlvo = {});
  const e = 1.602176634e-19, kB = 1.380649e-23, NA = 6.02214076e23, eps0 = 8.8541878128e-12, EPSR = 78.38;
  /* Inverso de la longitud de Debye κ (1/m) para un electrolito z:z de concentración c (mol/L) */
  D.kappa = (c, z, T) => Math.sqrt((2 * c * 1e3 * NA * z * z * e * e) / (EPSR * eps0 * kB * (T || 298.15)));
  /* Potencial de Gouy–Chapman (solución exacta de Poisson–Boltzmann para una pared): tanh(zeψ/4kT) = tanh(zeψ₀/4kT) e^{−κx} */
  D.gc = (psi0, x, c, z, T) => { T = T || 298.15; const f = (z * e) / (4 * kB * T), g = Math.tanh(f * psi0) * Math.exp(-D.kappa(c, z, T) * x); return Math.atanh(g) / f; };
  /* Carga superficial de Grahame: σ = √(8 c₀ ε ε₀ kT) sinh(zeψ₀/2kT), c₀ en m⁻³ */
  D.sigma = (psi0, c, z, T) => { T = T || 298.15; return Math.sqrt(8 * c * 1e3 * NA * EPSR * eps0 * kB * T) * Math.sinh((z * e * psi0) / (2 * kB * T)); };
  /* Repulsión entre dos esferas iguales de radio a (aproximación de Derjaguin con el potencial de superficie ψ_d): V_R = 64π a n k T γ² κ⁻² e^{−κh} */
  D.VR = (h, a, psi, c, z, T) => { T = T || 298.15; const kap = D.kappa(c, z, T), n = c * 1e3 * NA, gam = Math.tanh((z * e * psi) / (4 * kB * T)); return 64 * Math.PI * a * n * kB * T * gam * gam * Math.exp(-kap * h) / (kap * kap); };
  /* Atracción de Hamaker entre dos esferas iguales (fórmula exacta): V_A = −(A/6)[2a²/(h² + 4ah) + 2a²/(h + 2a)² + ln((h² + 4ah)/(h + 2a)²)] */
  D.VA = (h, a, A) => -(A / 6) * ((2 * a * a) / (h * h + 4 * a * h) + (2 * a * a) / Math.pow(h + 2 * a, 2) + Math.log((h * h + 4 * a * h) / Math.pow(h + 2 * a, 2)));
  D.V = (h, a, psi, c, z, A, T) => D.VR(h, a, psi, c, z, T) + D.VA(h, a, A);
  /* Barrera de energía máxima (en k_BT) y posición, y mínimo secundario */
  D.barrier = function (a, psi, c, z, A, T) {
    T = T || 298.15; const kT = kB * T; let hs = [], vs = []; for (let i = 0; i < 1500; i++) { const h = 0.3e-9 * Math.pow(1.0036, i); hs.push(h); vs.push(D.V(h, a, psi, c, z, A, T) / kT); }
    let imax = 0, vmax = -1e99; for (let i = 0; i < vs.length - 1; i++) if (vs[i] > vmax && vs[i] >= vs[i + 1] && (i === 0 || vs[i] >= vs[i - 1])) { vmax = vs[i]; imax = i; }
    if (vmax < -1e90) vmax = Math.max(...vs); let j = imax; while (j < vs.length - 1 && vs[j + 1] <= vs[j]) j++; return { Vmax: vmax, hmax: hs[imax], Vmin2: vs[j], hmin2: hs[j], h: hs, V: vs };
  };
  /* Concentración crítica de coagulación: V = 0 y dV/dh = 0 simultáneamente (c en mol/L) */
  D.ccc = function (a, psi, z, A, T) {
    T = T || 298.15; const kT = kB * T;
    /* barrera sobre el dominio h ≥ 0.5/κ (la tangencia V = V' = 0 de la teoría ocurre en κh ≈ 1) */
    const maxV = (c) => { const kap = D.kappa(c, z, T); let m = -1e99; for (let i = 0; i < 400; i++) { const h = (0.5 / kap) * Math.pow(1.012, i); m = Math.max(m, D.V(h, a, psi, c, z, A, T) / kT); } return m; };
    let lo = 1e-6, hi = 5; for (let i = 0; i < 80; i++) { const m = Math.sqrt(lo * hi); if (maxV(m) > 0.0) lo = m; else hi = m; } return Math.sqrt(lo * hi);
  };
  /* Movilidad electroforética: μ = (2εζ/3η) f(κa) (Henry), f de Ohshima (1994): 1 para κa → ∞ (Smoluchowski), 2/3·... → 1 en la forma f ∈ [1, 3/2] para μ = εζ f/η */
  D.henry = (ka) => 1 + 1 / (2 * Math.pow(1 + 2.5 / (ka * (1 + 2 * Math.exp(-ka))), 3)); /* μ = (2/3)(εζ/η) f(κa), f(∞) = 3/2, f(0) = 1 */
  D.mobility = (zeta, ka, eta) => ((2 / 3) * (EPSR * eps0 * zeta) / (eta || 8.9e-4)) * D.henry(ka);
  D.zeta = (mu, ka, eta) => (mu * (eta || 8.9e-4)) / ((2 / 3) * EPSR * eps0 * D.henry(ka));

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
