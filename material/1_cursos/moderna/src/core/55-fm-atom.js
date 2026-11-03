/* ===================================================================
   55-fm-atom.js — Modelos atómicos (EM.fm.atom): dispersión de Rutherford, Bohr con masa reducida (positronio, muónico),
   Franck–Hertz (Monte Carlo) y ajuste de Moseley. Complementa EM.qm.orig (Bohr hidrogenoide). Sin DOM; SI salvo aviso.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const A = (fm.atom = {});
  const { e, me, hbar, c, eps0 } = K;
  A.ke2 = (e * e) / (4 * Math.PI * eps0);                   /* e²/(4πε₀) = 1.44 MeV·fm (en J·m) */
  A.ke2MeVfm = A.ke2 / e / 1e6 / 1e-15;
  /* ---------- Rutherford ---------- */
  /* Distancia de máximo acercamiento en choque frontal: d₀ = Z₁Z₂e²/(4πε₀K) (K en MeV → m) */
  A.d0 = (Z1, Z2, KMeV) => (Z1 * Z2 * A.ke2MeVfm / KMeV) * 1e-15;
  A.scatterAngle = (b, d0) => 2 * Math.atan(d0 / (2 * b));                     /* θ = 2 arctan(d₀/2b) */
  A.impactParameter = (theta, d0) => (d0 / 2) / Math.tan(theta / 2);           /* b = (d₀/2) cot(θ/2) */
  A.closestApproach = (b, d0) => (d0 / 2) * (1 + Math.sqrt(1 + ((2 * b) / d0) ** 2));
  /* Sección diferencial de Rutherford dσ/dΩ = (d₀/4)²/sen⁴(θ/2) y sección acumulada para θ > θ₀: π(d₀/2)² cot²(θ₀/2) */
  A.rutherford = (theta, d0) => (d0 / 4) ** 2 / Math.sin(theta / 2) ** 4;
  A.sigmaAbove = (theta0, d0) => Math.PI * (d0 / 2) ** 2 / Math.tan(theta0 / 2) ** 2;
  /* ---------- Bohr con masa reducida ---------- */
  A.reduced = (m1, m2) => (m1 * m2) / (m1 + m2);
  /* Energía del nivel n (eV) de un sistema de dos cuerpos de carga Z e (una partícula orbita a otra) con masa reducida μ (kg) */
  A.levelEV = (n, mu, Z = 1) => -(mu * Math.pow(Z * A.ke2, 2)) / (2 * hbar * hbar * n * n) / e;
  A.radius = (n, mu, Z = 1) => (n * n * hbar * hbar) / (mu * Z * A.ke2);
  /* ---------- Franck–Hertz: Monte Carlo 1D ---------- */
  /* Electrones acelerados en una región de longitud L (unidades arbitrarias) con campo uniforme V/L. Entre colisiones ganan energía; en cada colisión
     (camino libre medio mfp) pierden Eex con probabilidad pin si Ek ≥ Eex (excitación del átomo) y no pierden nada si no. Devuelve la fracción de electrones
     que llega al ánodo con energía superior al potencial retardador Vr, y la energía media final. rng(): U(0,1). */
  A.franckHertz = (V, o, rng) => {
    const { Eex = 4.887, L = 1, mfp = 0.03, Vr = 1.5, n = 400, pin = 0.9 } = o; let ok = 0, sum = 0; const field = V / L;
    for (let i = 0; i < n; i++) {
      let x = 0, Ek = 0.3 * rng();
      for (;;) {
        const step = -Math.log(1 - rng()) * mfp;
        if (x + step >= L) { Ek += field * (L - x); break; }
        x += step; Ek += field * step;
        if (Ek >= Eex && rng() < pin) Ek -= Eex;
      }
      sum += Ek; if (Ek > Vr) ok++;
    }
    return { frac: ok / n, mean: sum / n };
  };
  /* Energías Kα1 (eV) de elementos de Z = 12 a 79: Elam, Ravel y Sieber (2002), tabuladas en xraydb */
  A.KALPHA = {"Mg": [12, 1253.8], "Ca": [20, 3692.3], "Ti": [22, 4512.2], "Cr": [24, 5414.9], "Fe": [26, 6405.2], "Co": [27, 6930.9], "Cu": [29, 8046.3], "Zn": [30, 8637.2], "Zr": [40, 15775.0], "Mo": [42, 17480.0], "Ag": [47, 22163.0], "Sn": [50, 25271.0], "W": [74, 59318.0], "Au": [79, 68806.0]};
  /* ---------- Moseley: ajuste √E = a(Z − σ) por mínimos cuadrados ---------- */
  A.moseleyFit = (Zs, Es) => {
    const y = Es.map(Math.sqrt), n = Zs.length, mx = Zs.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
    let sxx = 0, sxy = 0; for (let i = 0; i < n; i++) { sxx += (Zs[i] - mx) ** 2; sxy += (Zs[i] - mx) * (y[i] - my); }
    const a = sxy / sxx, b = my - a * mx; return { a, sigma: -b / a };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = A;
})(typeof window !== 'undefined' ? window : globalThis);
