/* ===================================================================
   59-fm-hyd.js — Transiciones del hidrógeno (EM.fm.hyd): integrales radiales dipolares, coeficientes de Einstein A, vidas medias.
   Usa EM.qm.hyd (43-qm-hyd.js, unidades atómicas). Sin DOM.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const Y = (fm.hyd = {});
  const Hy = () => qm.hyd;
  Y.alpha = K.alpha || 7.2973525693e-3;
  Y.rateUnit = 4.1341373336e16;                              /* hartree/ħ en s⁻¹ */
  /* Integral radial dipolar ∫ r³ R_{nl}R_{n′l′} dr (en a₀) por Simpson sobre [0, r_max] */
  Y.radial = (n, l, n2, l2, mu = 1) => {
    const a = 1 / mu, rmax = 90 * Math.max(n, n2) ** 2 * a * 0.5, N = 20000, hh = rmax / N; let s = 0;
    for (let i = 0; i <= N; i++) { const r = Math.max(i * hh, 1e-12), w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * Math.pow(r, 3) * Hy().R(n, l, r, 1, mu) * Hy().R(n2, l2, r, 1, mu); }
    return (s * hh) / 3;
  };
  /* Coeficiente de Einstein A (s⁻¹) de (n, l) → (n′, l′) con l′ = l ± 1: A = (4/3) α³ ω³ [l_> /(2l + 1)] |⟨r⟩|² en unidades atómicas, ω en hartree */
  Y.A = (n, l, n2, l2, mu = 1) => {
    if (Math.abs(l - l2) !== 1) return 0;
    const w = Math.abs(Hy().E(n, 1, mu) - Hy().E(n2, 1, mu)), R = Y.radial(n, l, n2, l2, mu), lmax = Math.max(l, l2);
    return (4 / 3) * Math.pow(Y.alpha, 3) * w ** 3 * (lmax / (2 * l + 1)) * R * R * Y.rateUnit;
  };
  /* Suma sobre los estados finales permitidos (n′ < n, l′ = l ± 1) y vida media (s); devuelve {A, tau, list} */
  Y.decay = (n, l, mu = 1) => {
    const list = []; let tot = 0;
    for (let n2 = 1; n2 < n; n2++) for (const l2 of [l - 1, l + 1]) if (l2 >= 0 && l2 < n2) { const a = Y.A(n, l, n2, l2, mu); list.push({ n2, l2, A: a }); tot += a; }
    return { A: tot, tau: tot > 0 ? 1 / tot : Infinity, list };
  };
  /* Energía (eV) del nivel n con masa reducida mu (en m_e) y longitud de onda en el vacío (nm) de n → n′ */
  Y.levelEV = (n, mu = 1) => -(K.Ry_eV * mu) / (n * n);
  Y.lineNm = (n, n2, mu = 1) => K.hc_eVnm / Math.abs(Y.levelEV(n, mu) - Y.levelEV(n2, mu));
  if (typeof module !== 'undefined' && module.exports) module.exports = Y;
})(typeof window !== 'undefined' ? window : globalThis);
