/* ===================================================================
   37-qm-pot.js — Potenciales unidimensionales con solución cerrada (EM.qm.pot): potencial delta,
   doble delta y raíces de las condiciones de cuantización. ħ = m = 1 salvo que se indique.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const P = (qm.pot = {});
  const bis = (f, a, b) => { let fa = f(a); for (let i = 0; i < 300; i++) { const m = 0.5 * (a + b), fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } if (b - a < 1e-15 * Math.max(1, Math.abs(m))) break; } return 0.5 * (a + b); };
  /* V = −α δ(x): κ = mα/ħ², E = −mα²/2ħ², ψ = √κ e^{−κ|x|} */
  P.deltaKappa = (al, m = 1, hb = 1) => (m * al) / (hb * hb);
  P.deltaE = (al, m = 1, hb = 1) => -(m * al * al) / (2 * hb * hb);
  /* Transmisión por V = ±α δ(x): T = 1/(1 + mα²/2ħ²E) */
  P.deltaT = (E, al, m = 1, hb = 1) => 1 / (1 + (m * al * al) / (2 * hb * hb * E));
  /* V = −α[δ(x − a) + δ(x + a)]: con κ₀ = mα/ħ², pares: κ(1 + tanh κa) = 2κ₀; impares: κ(1 + coth κa) = 2κ₀ (existe si 2κ₀a > 1) */
  P.doubleDelta = function (k0, a) {
    const fe = (k) => k * (1 + Math.tanh(k * a)) - 2 * k0, fo = (k) => k * (1 + 1 / Math.tanh(k * a)) - 2 * k0;
    const even = bis(fe, 1e-12, 2 * k0), odd = 2 * k0 * a > 1 ? bis(fo, 1e-12, 2 * k0) : null;
    return { even, odd, Eeven: -even * even / 2, Eodd: odd === null ? null : -odd * odd / 2 };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
