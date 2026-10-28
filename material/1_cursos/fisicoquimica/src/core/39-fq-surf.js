/* ===================================================================
   39-fq-surf.js — Superficies: tensión superficial, ecuación de Young–Laplace, capilaridad, ecuación de Kelvin, adsorción de Gibbs
   y tensioactivos, ángulo de contacto de Young, rugosidad (Wenzel, Cassie). Unidades SI.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const S = (FQ.surf = {});
  const R = 8.314462618, g = 9.80665;
  /* Tensión superficial del agua (IAPWS 1994, N/m) */
  S.gammaWater = (T) => { const tau = 1 - T / 647.096; return 0.2358 * Math.pow(tau, 1.256) * (1 - 0.625 * tau); };
  /* Líquidos (25 °C): γ (N/m), ρ (kg/m³), M (kg/mol), ángulo de contacto con vidrio limpio (°) */
  S.LIQ = { agua: { nm: 'Agua', gamma: 0.07197, rho: 997.05, M: 0.018015, th: 0 }, etanol: { nm: 'Etanol', gamma: 0.02189, rho: 785, M: 0.04607, th: 0 }, hg: { nm: 'Mercurio', gamma: 0.4860, rho: 13534, M: 0.2006, th: 140 }, hexano: { nm: 'Hexano', gamma: 0.01790, rho: 655, M: 0.08618, th: 0 }, glic: { nm: 'Glicerol', gamma: 0.0634, rho: 1258, M: 0.09209, th: 0 } };
  /* Young–Laplace: ΔP = γ(1/R₁ + 1/R₂); esfera: 2γ/r; burbuja de jabón (dos caras): 4γ/r */
  S.laplace = (gam, r, faces) => ((faces || 1) * 2 * gam) / r;
  /* Longitud capilar l_c = √(γ/ρg) */
  S.lc = (gam, rho) => Math.sqrt(gam / (rho * g));
  /* Ascenso capilar de Jurin h = 2γcosθ/(ρgr), con la corrección de Rayleigh para el volumen del menisco h ≈ h₀ − r/3 (cosθ = 1) */
  S.jurin = (gam, th, rho, r) => (2 * gam * Math.cos((th * Math.PI) / 180)) / (rho * g * r);
  S.jurinCorr = (gam, th, rho, r) => S.jurin(gam, th, rho, r) - r / 3;
  /* Kelvin: ln(P_r/P_0) = 2γV_m cosθ/(rRT) (gota: r > 0; poro mojante: r < 0 en el signo del radio de curvatura) */
  S.kelvin = (gam, M, rho, r, T) => Math.exp((2 * gam * (M / rho)) / (r * R * T));
  S.kelvinR = (gam, M, rho, RH, T) => (2 * gam * (M / rho)) / (R * T * Math.log(RH)); /* radio de la gota en equilibrio con la humedad relativa RH */
  /* Szyszkowski–Langmuir: Γ = Γ∞ c/(a + c); γ = γ₀ − RTΓ∞ ln(1 + c/a). Gibbs: Γ = −(1/RT) dγ/d ln c */
  S.szyszkowski = (gam0, Gmax, a, c, T) => gam0 - R * T * Gmax * Math.log(1 + c / a);
  S.gibbsGamma = (Gmax, a, c) => (Gmax * c) / (a + c);
  S.areaPerMol = (Gmax) => 1 / (Gmax * 6.02214076e23) * 1e20; /* Å² */
  /* Young: cosθ = (γ_sv − γ_sl)/γ_lv; trabajo de adhesión W = γ_lv(1 + cosθ); coeficiente de esparcimiento S = γ_sv − γ_sl − γ_lv */
  S.young = (gsv, gsl, glv) => { const c = (gsv - gsl) / glv; return { cos: c, th: c >= 1 ? 0 : c <= -1 ? 180 : (Math.acos(c) * 180) / Math.PI, W: glv * (1 + c), S: gsv - gsl - glv }; };
  S.wenzel = (cosTh, rr) => Math.max(-1, Math.min(1, rr * cosTh)); /* r ≥ 1 */
  S.cassie = (cos1, cos2, f1) => f1 * cos1 + (1 - f1) * cos2;
  /* Energía de una gota casquete de volumen V con ángulo θ: E = γ_lv A_lv + (γ_sl − γ_sv) A_sl (mínimo en el ángulo de Young) */
  S.capEnergy = (V, th, glv, gsl, gsv) => { const t = th, f = (2 - 3 * Math.cos(t) + Math.pow(Math.cos(t), 3)) / 3, R0 = Math.cbrt(V / (Math.PI * f)), a = R0 * Math.sin(t), Alv = 2 * Math.PI * R0 * R0 * (1 - Math.cos(t)), Asl = Math.PI * a * a; return glv * Alv + (gsl - gsv) * Asl; };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
