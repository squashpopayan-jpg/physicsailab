/* ===================================================================
   52-fm-bb.js — Radiación térmica (EM.fm.bb): espectro en frecuencia, gas de fotones, estrellas, color del cuerpo negro.
   Complementa EM.qm.orig (33-qm-orig.js: Planck en λ, Stefan–Boltzmann, Wien). Sin DOM; SI salvo aviso.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const B = (fm.bb = {});
  const { h, c, kB, sigma } = K;
  const ZETA3 = 1.2020569031595942;
  B.ZETA3 = ZETA3;
  B.a = (4 * sigma) / c;                                   /* constante de radiación: 7.5657×10⁻¹⁶ J m⁻³ K⁻⁴ */
  /* Radiancia espectral por frecuencia B_ν = 2hν³/c² / (e^{hν/kT} − 1) [W m⁻² Hz⁻¹ sr⁻¹] */
  B.planckNu = (nu, T) => { const x = (h * nu) / (kB * T); return x > 700 ? 0 : (2 * h * nu ** 3) / (c * c) / Math.expm1(x); };
  /* Densidad espectral de energía u_ν = 4π B_ν / c [J m⁻³ Hz⁻¹] y densidad de modos 8πν²/c³ [m⁻³ Hz⁻¹] */
  B.uNu = (nu, T) => (4 * Math.PI * B.planckNu(nu, T)) / c;
  B.modeDensity = (nu) => (8 * Math.PI * nu * nu) / (c * c * c);
  /* Energía media por modo: hν/(e^{hν/kT} − 1) (Planck) frente a kT (equipartición) */
  B.meanModeEnergy = (nu, T) => { const x = (h * nu) / (kB * T); return x > 700 ? 0 : (h * nu) / Math.expm1(x); };
  /* Raíz de Wien para la frecuencia: x = 3(1 − e^{−x}) → 2.821439; ν_máx = x kT/h */
  B.wienNuX = (() => { let x = 3; for (let i = 0; i < 100; i++) x = 3 * (1 - Math.exp(-x)); return x; })();
  B.wienNuConst = (B.wienNuX * kB) / h;                    /* Hz/K: 5.8789×10¹⁰ */
  B.nuPeak = (T) => B.wienNuConst * T;
  /* Densidad numérica y energía media del gas de fotones */
  B.photonDensity = (T) => 16 * Math.PI * ZETA3 * Math.pow((kB * T) / (h * c), 3);
  B.energyDensity = (T) => B.a * Math.pow(T, 4);
  B.meanPhotonEnergy = (T) => B.energyDensity(T) / B.photonDensity(T);
  B.pressure = (T) => B.energyDensity(T) / 3;
  B.entropyDensity = (T) => (4 / 3) * B.a * Math.pow(T, 3);
  /* Luminosidad de una esfera negra: L = 4πR²σT⁴ */
  B.luminosity = (R, T) => 4 * Math.PI * R * R * sigma * Math.pow(T, 4);
  /* Potencia neta radiada por un cuerpo gris de área A, emisividad ε a temperatura T en un entorno a T₀ */
  B.netPower = (A, eps, T, T0) => A * eps * sigma * (Math.pow(T, 4) - Math.pow(T0, 4));
  /* Número de modos de la cavidad de volumen V en [ν₁, ν₂] (dos polarizaciones): (8πV/3c³)(ν₂³ − ν₁³) */
  B.modesInBand = (V, nu1, nu2) => ((8 * Math.PI * V) / (3 * c ** 3)) * (nu2 ** 3 - nu1 ** 3);
  /* Color del cuerpo negro: integra B_λ con los ajustes gaussianos de Wyman, Sloan y Shirley (2013) de las funciones CIE 1931 → XYZ y cromaticidad xy */
  const g = (x, mu, s1, s2) => { const t = (x - mu) / (x < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
  B.cie = (nm) => [1.056 * g(nm, 599.8, 37.9, 31.0) + 0.362 * g(nm, 442.0, 16.0, 26.7) - 0.065 * g(nm, 501.1, 20.4, 26.2), 0.821 * g(nm, 568.8, 46.9, 40.5) + 0.286 * g(nm, 530.9, 16.3, 31.1), 1.217 * g(nm, 437.0, 11.8, 36.0) + 0.681 * g(nm, 459.0, 26.0, 13.8)];
  B.xyz = (T) => { let X = 0, Y = 0, Z = 0; for (let nm = 360; nm <= 830; nm += 1) { const s = qm.orig.planckLambda(nm * 1e-9, T), v = B.cie(nm); X += s * v[0]; Y += s * v[1]; Z += s * v[2]; } return [X, Y, Z]; };
  B.xy = (T) => { const [X, Y, Z] = B.xyz(T), s = X + Y + Z; return [X / s, Y / s]; };
  /* sRGB (0–255) con normalización al canal máximo, para dibujar el color aparente */
  B.rgb = (T) => {
    const [X, Y, Z] = B.xyz(T), m = [[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]];
    let lin = m.map((r) => r[0] * X + r[1] * Y + r[2] * Z); const mx = Math.max(...lin); lin = lin.map((v) => Math.max(0, v / mx));
    return lin.map((v) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)));
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(typeof window !== 'undefined' ? window : globalThis);
