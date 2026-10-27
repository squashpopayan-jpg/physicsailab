(function (root) {
  'use strict';
  const C = root.EM.calc;
  C.EPS0 = 8.8541878128e-12; C.MU0 = 1.25663706212e-6; C.CLIGHT = 299792458;
  C.cFromConstants = (mu, eps) => 1 / Math.sqrt(mu * eps);
  /* Medidas históricas de c (km/s): [año, valor, error estimado, método, quién] */
  C.CMEAS = [
    [1676, 220000, 40000, 'eclipses de Ío', 'Römer / Huygens'],
    [1729, 301000, 6000, 'aberración estelar', 'Bradley'],
    [1849, 315300, 5000, 'rueda dentada', 'Fizeau'],
    [1855, 310740, 5000, 'razón de unidades eléctricas', 'Weber y Kohlrausch'],
    [1862, 298000, 500, 'espejo giratorio', 'Foucault'],
    [1868, 288000, 5000, 'razón de unidades eléctricas', 'Maxwell'],
    [1879, 299910, 50, 'espejo giratorio', 'Michelson'],
    [1926, 299796, 4, 'espejo octogonal', 'Michelson'],
    [1983, 299792.458, 0, 'definición del metro', 'CGPM']
  ];
  /* Un paso de FDTD 1D (Yee) en unidades normalizadas, Courant S = 0.5, con fronteras absorbentes de Mur de primer orden */
  C.fdtdStep = function (E, Hh, epsr, t, src, width) {
    const N = E.length, S = 0.5;
    const e1 = E[1], eN = E[N - 2];
    for (let i = 1; i < N; i++) E[i] += (S / epsr[i]) * (Hh[i] - Hh[i - 1]);
    E[src] += Math.exp(-Math.pow((t - 3 * width) / width, 2));
    const k0 = (S / Math.sqrt(epsr[0]) - 1) / (S / Math.sqrt(epsr[0]) + 1), kN = (S / Math.sqrt(epsr[N - 1]) - 1) / (S / Math.sqrt(epsr[N - 1]) + 1);
    E[0] = e1 + k0 * (E[1] - E[0]);
    E[N - 1] = eN + kN * (E[N - 2] - E[N - 1]);
    for (let i = 0; i < N - 1; i++) Hh[i] += S * (E[i + 1] - E[i]);
  };
  C.fdtd1d = function (N, steps, epsr, src, width, snaps) {
    const E = new Float64Array(N), Hh = new Float64Array(N), out = [];
    for (let t = 0; t < steps; t++) { C.fdtdStep(E, Hh, epsr, t, src, width); if (snaps && snaps.includes(t)) out.push(Float64Array.from(E)); }
    return { E, H: Hh, snaps: out };
  };
  /* Coeficientes de Fresnel a incidencia normal */
  C.fresnelNormal = (n1, n2) => ({ r: (n1 - n2) / (n1 + n2), t: (2 * n1) / (n1 + n2), R: Math.pow((n1 - n2) / (n1 + n2), 2) });
  /* Onda estacionaria entre un emisor y un reflector: nodos separados por λ/2 */
  C.standingNodes = (f, c) => c / (2 * f);
  C.lcFrequency = (L, Cc) => 1 / (2 * Math.PI * Math.sqrt(L * Cc));
})(typeof window !== 'undefined' ? window : global);
