(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const PI = Math.PI;
  C.RINF = 10973731.568160; /* m⁻¹ */
  C.ALPHA = 7.2973525693e-3;
  C.EV_RY = 13.605693122994; /* eV */
  C.MP_OVER_ME = 1836.15267343;
  /* Balmer (1885): λ = 364.56 nm · m²/(m²−4), m = 3, 4, 5… */
  C.balmerNm = (m) => (364.56 * m * m) / (m * m - 4);
  /* Rydberg: 1/λ = R_M Z² (1/n1² − 1/n2²), con masa reducida del núcleo (A = M/m_p aprox. por la razón de masas) */
  C.rydbergMass = (massRatio) => C.RINF / (1 + 1 / massRatio); /* massRatio = M_núcleo/m_e */
  C.lineVacuumNm = (n1, n2, Z, massRatio) => 1e9 / (C.rydbergMass(massRatio || 1e12) * Z * Z * (1 / (n1 * n1) - 1 / (n2 * n2)));
  C.levelEv = (n, Z, massRatio) => (-C.EV_RY * Z * Z * (massRatio ? 1 / (1 + 1 / massRatio) : 1)) / (n * n);
  C.bohrRadius = (n, Z) => (n * n * 5.29177210903e-11) / Z;
  C.orbitSpeed = (n, Z) => (Z * C.ALPHA * K.c) / n;
  /* Aire: índice 1.000277 (λ_aire = λ_vac / n) */
  C.vacToAir = (nm) => nm / 1.000277;
  /* Moseley: energía de la línea K-alfa (eV) ≈ (3/4) Ry (Z − 1)² */
  C.moseleyKalphaEv = (Z) => 0.75 * C.EV_RY * (Z - 1) * (Z - 1);
  C.moseleyZ = (EkeV) => 1 + Math.sqrt((EkeV * 1000) / (0.75 * C.EV_RY));
  /* Estructura fina del nivel n = 2 del hidrógeno (2p3/2 − 2p1/2): α² Ry / 16 */
  C.fineSplit2p = () => (C.ALPHA * C.ALPHA * C.EV_RY) / 16;
  /* Franck–Hertz (mercurio): corriente relativa con pérdidas de 4.9 eV, retardo 1.5 V y dispersión térmica σ */
  C.franckHertz = function (V, E1, Vr, sigma) {
    const q = 0.75, nc = Math.floor(V / E1), r = V - nc * E1;
    const pass = (x) => 0.5 * (1 + C.erf((x - Vr) / (sigma * Math.SQRT2))) * Math.max(0, x);
    /* una parte de los electrones no choca (f(V)); el resto pierde E1 en cada colisión y llega con el residuo r */
    return (1 - q) * pass(V) + q * (nc > 0 ? pass(r + 0.0) * (1 + 0.15 * nc) : pass(V));
  };
  C.erf = function (x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  /* Datos K-alfa (keV) de la literatura moderna, elemento: [Z, Kα1] */
  C.KALPHA = [['Al', 13, 1.4867], ['Ca', 20, 3.6917], ['Ti', 22, 4.5108], ['Fe', 26, 6.4039], ['Co', 27, 6.9303], ['Cu', 29, 8.0478], ['Mo', 42, 17.4793], ['Ag', 47, 22.1629], ['Sn', 50, 25.2713], ['W', 74, 59.3182]];
})(typeof window !== 'undefined' ? window : globalThis);
