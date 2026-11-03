/* ===================================================================
   63-fm-laser.js — Emisión estimulada y láser (EM.fm.las): coeficientes de Einstein, ensanchamiento de línea, ganancia y umbral,
   cavidad Fabry–Pérot y haces gaussianos (estabilidad, ABCD), ecuaciones de balance de un láser de cuatro niveles, producto
   tiempo–ancho de banda. Sin DOM; SI.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const La = (fm.las = {});
  const { h, c, kB, e } = K;
  const AMU = K.u;
  /* Einstein: A21/B21 = 8πhν³/c³ (B en m³/(J s²) con la densidad de energía por unidad de frecuencia); g1 B12 = g2 B21 */
  La.AoverB = (nu) => (8 * Math.PI * h * nu ** 3) / (c ** 3);
  /* en equilibrio térmico: razón (emisión espontánea)/(emisión estimulada) = A/(B u) = exp(hν/kT) − 1 */
  La.spontOverStim = (nu, T) => Math.expm1((h * nu) / (kB * T));
  /* densidad espectral de energía recuperada de las tasas: u = (A/B)/[(g1B12/g2B21)exp(hν/kT) − 1] = Planck */
  La.uFromRates = (nu, T) => La.AoverB(nu) / Math.expm1((h * nu) / (kB * T));
  /* cociente de poblaciones de Boltzmann N2/N1 */
  La.boltzRatio = (nu, T, g2 = 1, g1 = 1) => (g2 / g1) * Math.exp(-(h * nu) / (kB * T));
  /* ensanchamientos: Doppler (FWHM, Hz) y natural (1/(2πτ)) */
  La.dopplerFWHM = (nu, T, mAmu) => 2 * nu * Math.sqrt((2 * kB * T * Math.LN2) / (mAmu * AMU * c * c));
  La.naturalFWHM = (A) => A / (2 * Math.PI);
  La.gaussProfile = (nu, nu0, fwhm) => { const s = fwhm / (2 * Math.sqrt(2 * Math.LN2)); return Math.exp(-0.5 * ((nu - nu0) / s) ** 2) / (s * Math.sqrt(2 * Math.PI)); };
  La.lorentzProfile = (nu, nu0, fwhm) => (fwhm / (2 * Math.PI)) / ((nu - nu0) ** 2 + (fwhm / 2) ** 2);
  /* sección eficaz de emisión estimulada: σ(ν) = λ² A g(ν)/(8π n²), con g normalizada (1/Hz) */
  La.sigma = (lam, A, g, n = 1) => (lam * lam * A * g) / (8 * Math.PI * n * n);
  /* ganancia por unidad de longitud: γ = σ (N2 − (g2/g1) N1) */
  La.gain = (sigma, N2, N1 = 0, g2 = 1, g1 = 1) => sigma * (N2 - (g2 / g1) * N1);
  /* cavidad lineal: intervalo espectral libre, umbral de ganancia, tiempo de vida del fotón, Q */
  La.fsr = (Lc, n = 1) => c / (2 * n * Lc);
  La.gammaThreshold = (Lc, R1, R2, alphaI = 0) => alphaI - Math.log(R1 * R2) / (2 * Lc);
  La.photonLifetime = (Lc, R1, R2, alphaI = 0, n = 1) => n / (c * La.gammaThreshold(Lc, R1, R2, alphaI));
  La.Qfactor = (nu, tauc) => 2 * Math.PI * nu * tauc;
  /* modos longitudinales q (ν_q = q c/2L) cuya ganancia gaussiana supera el umbral. Devuelve [{nu, g, on}] */
  La.modes = function (nu0, Lc, fwhm, g0, gth) {
    const d = La.fsr(Lc), q0 = Math.round(nu0 / d), out = [], s = fwhm / (2 * Math.sqrt(2 * Math.LN2));
    for (let q = q0 - 60; q <= q0 + 60; q++) { const nu = q * d, g = g0 * Math.exp(-0.5 * ((nu - nu0) / s) ** 2); if (g > 1e-4 * g0) out.push({ nu, g, on: g > gth }); }
    return out;
  };
  /* ---- Haces gaussianos y resonadores ---- */
  La.zR = (w0, lam, n = 1) => (Math.PI * w0 * w0 * n) / lam;
  La.beamW = (w0, lam, z, n = 1) => w0 * Math.sqrt(1 + (z / La.zR(w0, lam, n)) ** 2);
  La.beamR = (w0, lam, z) => { const zr = La.zR(w0, lam); return z === 0 ? Infinity : z * (1 + (zr / z) ** 2); };
  La.divergence = (w0, lam) => lam / (Math.PI * w0);              /* semiángulo, rad */
  La.gouy = (w0, lam, z) => Math.atan(z / La.zR(w0, lam));
  /* resonador de dos espejos de radios R1, R2 (cóncavo > 0) y longitud L: g = 1 − L/R; estable si 0 ≤ g1 g2 ≤ 1 */
  La.g = (Lc, R) => 1 - Lc / R;
  La.stable = (Lc, R1, R2) => { const p = La.g(Lc, R1) * La.g(Lc, R2); return p >= 0 && p <= 1; };
  /* cintura del modo fundamental: w0² = (λ/π) sqrt[ L (R1 − L)(R2 − L)(R1 + R2 − L) ] / (R1 + R2 − 2L) */
  La.waist = (Lc, R1, R2, lam) => Math.sqrt((lam / Math.PI) * Math.sqrt(Lc * (R1 - Lc) * (R2 - Lc) * (R1 + R2 - Lc)) / (R1 + R2 - 2 * Lc));
  /* posición de la cintura medida desde el espejo 1 */
  La.waistPos = (Lc, R1, R2) => (Lc * (R2 - Lc)) / (R1 + R2 - 2 * Lc);
  /* ---- Ecuaciones de balance de un láser de cuatro niveles ----
     dN/dt = R − N/τ − B N φ ;  dφ/dt = (B N − 1/τc) φ + β N/τ   (N inversión, φ fotones en el modo) */
  La.rateThreshold = (p) => ({ Nth: 1 / (p.B * p.tauc), Rth: 1 / (p.B * p.tauc * p.tau) });
  La.rateSteady = (p) => { const { Nth, Rth } = La.rateThreshold(p); return { N: Nth, phi: p.tauc * (p.R - Rth) }; };
  La.relaxFreq = (p) => { const { Rth } = La.rateThreshold(p), r = p.R / Rth; return { r, w0: Math.sqrt((r - 1) / (p.tau * p.tauc)), damp: r / (2 * p.tau) }; };
  La.rateIntegrate = function (p, T, dt, N0 = 0, phi0 = 1e-3, every = 1) {
    let N = N0, ph = phi0, t = 0; const out = [{ t, N, ph }]; const f = (N, ph) => [p.R - N / p.tau - p.B * N * ph, (p.B * N - 1 / p.tauc) * ph + (p.beta || 0) * N / p.tau];
    const n = Math.round(T / dt);
    for (let i = 1; i <= n; i++) {
      const k1 = f(N, ph), k2 = f(N + 0.5 * dt * k1[0], ph + 0.5 * dt * k1[1]), k3 = f(N + 0.5 * dt * k2[0], ph + 0.5 * dt * k2[1]), k4 = f(N + dt * k3[0], ph + dt * k3[1]);
      N += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); ph += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); t = i * dt;
      if (i % every === 0) out.push({ t, N, ph });
    }
    return out;
  };
  /* ---- Pulsos ultracortos: producto tiempo–ancho de banda (FWHM de intensidad y de espectro) ---- */
  La.TBP = { gauss: (2 * Math.LN2) / Math.PI, sech2: 0.3148 };
  La.pulseFromBandwidth = (dnu, shape = 'gauss') => La.TBP[shape] / dnu;
  La.bandwidthHz = (lam, dlam) => (c * dlam) / (lam * lam);
})(typeof window !== 'undefined' ? window : globalThis);
