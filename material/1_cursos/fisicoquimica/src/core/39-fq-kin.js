/* ===================================================================
   39-fq-kin.js — Teoría cinética de los gases: distribución de Maxwell–Boltzmann, colisiones, camino libre medio, efusión y propiedades de transporte
   (viscosidad, conductividad térmica y autodifusión de Chapman–Enskog con la integral de colisión de Lennard–Jones).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const K = (FQ.kin2 = {});
  const kB = 1.380649e-23, u = 1.66053906660e-27, R = 8.314462618, NA = 6.02214076e23;
  /* velocidades características: más probable, media y cuadrática media (M en kg/mol) */
  K.vmp = (M, T) => Math.sqrt((2 * R * T) / M); K.vmean = (M, T) => Math.sqrt((8 * R * T) / (Math.PI * M)); K.vrms = (M, T) => Math.sqrt((3 * R * T) / M);
  /* densidad de probabilidad de la rapidez: f(v) = 4π (m/2πkT)^{3/2} v² exp(−mv²/2kT) */
  K.fv = (v, M, T) => { const m = M / NA; return 4 * Math.PI * Math.pow(m / (2 * Math.PI * kB * T), 1.5) * v * v * Math.exp((-m * v * v) / (2 * kB * T)); };
  /* fracción de moléculas con rapidez > v (integral de f) */
  K.fracAbove = (v, M, T) => { const m = M / NA, a = Math.sqrt(m / (2 * kB * T)), x = a * v; return 1 - erf(x) + (2 / Math.sqrt(Math.PI)) * x * Math.exp(-x * x); };
  /* fracción con energía cinética de traslación (a lo largo de 1 coordenada de reacción: 2 grados de libertad) ≥ E0: exp(−E0/RT)(1 + E0/RT) */
  K.fracEnergy2 = (E0, T) => Math.exp(-E0 / (R * T)) * (1 + E0 / (R * T));
  function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  K.erf = erf;
  /* colisiones: diámetro d (m), P (Pa) */
  K.n = (P, T) => P / (kB * T);
  K.mfp = (d, P, T) => kB * T / (Math.SQRT2 * Math.PI * d * d * P);
  K.zColl = (d, M, P, T) => Math.SQRT2 * Math.PI * d * d * K.vmean(M, T) * K.n(P, T); /* colisiones por molécula y por segundo */
  K.Zbin = (d, M, P, T) => 0.5 * K.zColl(d, M, P, T) * K.n(P, T); /* colisiones por m³ y por s (entre moléculas iguales) */
  K.wallFlux = (M, P, T) => P / Math.sqrt(2 * Math.PI * (M / NA) * kB * T); /* moléculas por m² y por s */
  /* integrales de colisión reducidas de Lennard–Jones (Neufeld, Janzen y Aziz, 1972) */
  K.omega22 = (Ts) => 1.16145 * Math.pow(Ts, -0.14874) + 0.52487 * Math.exp(-0.7732 * Ts) + 2.16178 * Math.exp(-2.43787 * Ts);
  K.omega11 = (Ts) => 1.06036 * Math.pow(Ts, -0.15610) + 0.19300 * Math.exp(-0.47635 * Ts) + 1.03587 * Math.exp(-1.52996 * Ts) + 1.76474 * Math.exp(-3.89411 * Ts);
  /* viscosidad (Pa·s): η = (5/16)√(π m kT)/(πσ²Ω₂₂*); σ en m, ε/k en K */
  K.eta = (M, T, sigma, eps) => (5 / 16) * Math.sqrt(Math.PI * (M / NA) * kB * T) / (Math.PI * sigma * sigma * K.omega22(T / eps));
  /* conductividad térmica de un gas monoatómico λ = (15/4)(R/M)η; Eucken modificado para poliatómicos: λ = η(c_v + 9R/4)/M */
  K.lambdaMono = (M, eta) => (15 / 4) * (R / M) * eta;
  K.lambdaEucken = (M, eta, cv) => (eta * (cv + (9 / 4) * R)) / M;
  /* autodifusión (m²/s): D = (3/16)√(2π... ) → D = 3/(8 n σ² Ω₁₁*)·√(kT/(π m)) */
  K.Dself = (M, T, P, sigma, eps) => (3 / (8 * K.n(P, T) * sigma * sigma * K.omega11(T / eps))) * Math.sqrt((kB * T) / (Math.PI * (M / NA)));
  K.LJ = { Ar: { M: 0.039948, sigma: 3.542e-10, eps: 93.3, nm: 'Ar' }, N2: { M: 0.0280134, sigma: 3.798e-10, eps: 71.4, nm: 'N₂' }, He: { M: 0.0040026, sigma: 2.551e-10, eps: 10.22, nm: 'He' }, O2: { M: 0.0319988, sigma: 3.467e-10, eps: 106.7, nm: 'O₂' }, CO2: { M: 0.0440095, sigma: 3.941e-10, eps: 195.2, nm: 'CO₂' }, CH4: { M: 0.0160425, sigma: 3.758e-10, eps: 148.6, nm: 'CH₄' } };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
