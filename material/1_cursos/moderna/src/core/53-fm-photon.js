/* ===================================================================
   53-fm-photon.js — Fotones (EM.fm.ph): sección eficaz de Klein–Nishina, borde Compton, tubo de rayos X (Duane–Hunt, Kramers),
   líneas K, producción de pares. Complementa EM.qm.orig (fotoeléctrico y Compton). Sin DOM; SI salvo aviso (energías en keV cuando se indica).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const P = (fm.ph = {});
  const { h, c, e, me } = K;
  P.re = 2.8179403262e-15;                                   /* radio clásico del electrón (CODATA 2018): 2.8179×10⁻¹⁵ m */
  P.mc2keV = (me * c * c) / e / 1e3;                     /* 510.999 keV */
  /* Datos de líneas K (eV): [Z, Kα1, Kβ1, borde K]; Elam, Ravel y Sieber (2002), tabulados en xraydb */
  P.KLINES = {"Cr": [24, 5414.9, 5946.8, 5989.0], "Fe": [26, 6405.2, 7059.3, 7112.0], "Cu": [29, 8046.3, 8903.9, 8979.0], "Mo": [42, 17480.0, 19606.0, 20000.0], "Ag": [47, 22163.0, 24941.0, 25514.0], "W": [74, 59318.0, 67244.0, 69525.0]};
  /* ---------- Klein–Nishina ---------- */
  /* Cociente de energías del fotón dispersado k′/k = 1/(1 + ε(1 − cos θ)), ε = E/mc² */
  P.ratio = (eps, th) => 1 / (1 + eps * (1 - Math.cos(th)));
  /* Sección eficaz diferencial por electrón libre [m²/sr] */
  P.kn = (eps, th) => { const r = P.ratio(eps, th); return 0.5 * P.re * P.re * r * r * (r + 1 / r - Math.sin(th) ** 2); };
  /* Sección eficaz total por electrón [m²] (forma cerrada) */
  P.knTotal = (eps) => {
    if (eps < 0.02) { /* serie de Taylor (la forma cerrada pierde cifras por cancelación): σ/σ_T = Σ a_k ε^k */
      const A = [1, -2, 26 / 5, -133 / 10, 1144 / 35, -544 / 7, 3784 / 21, -6148 / 15, 151552 / 165, -111872 / 55, 637952 / 143]; let s = 0, p = 1; for (const a of A) { s += a * p; p *= eps; }
      return (8 * Math.PI / 3) * P.re * P.re * s;
    }
    const l = Math.log(1 + 2 * eps);
    return 2 * Math.PI * P.re * P.re * (((1 + eps) / (eps * eps)) * ((2 * (1 + eps)) / (1 + 2 * eps) - l / eps) + l / (2 * eps) - (1 + 3 * eps) / Math.pow(1 + 2 * eps, 2));
  };
  P.thomson = () => (8 * Math.PI / 3) * P.re * P.re;
  /* Coeficiente másico de atenuación Compton μ/ρ [cm²/g] = N_A (Z/A) σ_KN con Z/A de un material */
  P.massAtt = (eps, ZoverA) => K.NA * ZoverA * P.knTotal(eps) * 1e4;
  /* Borde Compton: máxima energía cinética del electrón (keV) para un fotón de energía E (keV) */
  P.comptonEdge = (E) => (2 * E * E) / (P.mc2keV + 2 * E);
  P.backscatter = (E) => E / (1 + 2 * E / P.mc2keV);
  /* ---------- Tubo de rayos X ---------- */
  P.lambdaMin = (V) => (h * c) / (e * V);                /* Duane–Hunt (m) para V en voltios */
  /* Espectro continuo de Kramers por longitud de onda (u. arbitrarias): I(λ) ∝ (λ/λ_min − 1)/λ² para λ > λ_min */
  P.kramers = (lam, lmin) => (lam > lmin ? (lam / lmin - 1) / (lam * lam) : 0);
  P.lambdaPeak = (lmin) => 2 * lmin;                     /* máximo de la curva de Kramers: dI/dλ = 0 en λ = 2λ_min */
  P.moseleyKa = (Z) => 0.75 * K.Ry_eV * (Z - 1) ** 2;   /* Kα ≈ (3/4) Ry (Z − 1)² [eV] */
  /* ---------- Pares ---------- */
  P.pairThresholdNucleus = () => 2 * P.mc2keV;           /* keV */
  P.pairThresholdElectron = () => 4 * P.mc2keV;          /* triplete */
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
