/* ===================================================================
   33-qm-orig.js — Física de los orígenes (EM.qm.orig): radiación del cuerpo negro,
   efecto fotoeléctrico, efecto Compton, átomo de Bohr y ondas de de Broglie.
   Sin DOM: se prueba en Node con tests/validar.js. Unidades SI salvo aviso (energías en eV cuando se indica).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const O = (qm.orig = {});
  /* Constantes CODATA 2018 */
  const K = (qm.K = Object.assign(qm.K || {}, {
    h: 6.62607015e-34, hbar: 1.054571817e-34, c: 299792458, e: 1.602176634e-19, me: 9.1093837015e-31,
    mp: 1.67262192369e-27, md: 3.3435837724e-27, mn: 1.67492749804e-27, u: 1.66053906660e-27, kB: 1.380649e-23, NA: 6.02214076e23,
    eps0: 8.8541878128e-12, a0: 5.29177210903e-11, alpha: 7.2973525693e-3, sigma: 5.670374419e-8,
    hc_eVnm: 1239.84198, Ry_eV: 13.605693122994, Ha_eV: 27.211386245988, Rinf: 10973731.568160, b_wien: 2.897771955e-3
  }));
  const { h, c, e, kB, me } = K;

  /* ---------- Cuerpo negro ---------- */
  /* Radiancia espectral por longitud de onda B_λ(T) [W·sr⁻¹·m⁻³]: 2hc²/λ⁵ · 1/(e^{hc/λkT} − 1) */
  O.planckLambda = (lam, T) => { const x = (h * c) / (lam * kB * T); return x > 700 ? 0 : (2 * h * c * c) / Math.pow(lam, 5) / Math.expm1(x); };
  /* Emitancia espectral (flujo por área, hemisferio) M_λ = π B_λ [W·m⁻³] */
  O.exitance = (lam, T) => Math.PI * O.planckLambda(lam, T);
  O.rayleighJeans = (lam, T) => (2 * c * kB * T) / Math.pow(lam, 4);
  O.wienLaw = (lam, T) => (2 * h * c * c) / Math.pow(lam, 5) * Math.exp(-(h * c) / (lam * kB * T));
  O.wienPeak = (T) => K.b_wien / T;
  O.stefanBoltzmann = (T) => K.sigma * Math.pow(T, 4);
  /* σ a partir de h, c, k_B: 2π⁵k⁴/(15h³c²) */
  O.sigmaFromConstants = () => (2 * Math.pow(Math.PI, 5) * Math.pow(kB, 4)) / (15 * Math.pow(h, 3) * c * c);
  /* Fracción de la emitancia total entre λ1 y λ2 por cuadratura de Simpson en x = hc/(λkT) */
  O.bandFraction = function (l1, l2, T, n = 4000) {
    const f = (lam) => O.exitance(lam, T);
    const simpson = (a, b, N) => { const dx = (b - a) / N; let s = f(a) + f(b); for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(a + i * dx); return (s * dx) / 3; };
    return simpson(l1, l2, n) / O.stefanBoltzmann(T);
  };
  /* ∫₀^∞ x³/(eˣ−1) dx = π⁴/15 por cuadratura de Gauss–Laguerre (indirecta): serie Σ 6/k⁴ */
  O.bose3 = () => { let s = 0; for (let k = 1; k < 200000; k++) s += 6 / Math.pow(k, 4); return s; };

  /* ---------- Efecto fotoeléctrico ---------- */
  /* Metales: función de trabajo φ (eV), Michaelson, J. Appl. Phys. 48, 4729 (1977) */
  O.METALS = { Cs: ['Cesio', 2.14], K: ['Potasio', 2.30], Na: ['Sodio', 2.75], Ca: ['Calcio', 2.87], Al: ['Aluminio', 4.28], Zn: ['Cinc', 4.33], Cu: ['Cobre', 4.65], Pt: ['Platino', 5.65] };
  O.photonEnergy = (lamNm) => K.hc_eVnm / lamNm; /* eV */
  O.photoKE = (lamNm, phi) => Math.max(0, O.photonEnergy(lamNm) - phi);
  O.thresholdNm = (phi) => K.hc_eVnm / phi;
  /* Frecuencia umbral en Hz */
  O.thresholdHz = (phi) => (phi * e) / h;

  /* ---------- Efecto Compton ---------- */
  O.comptonWavelength = () => h / (me * c); /* m */
  O.comptonShift = (theta) => O.comptonWavelength() * (1 - Math.cos(theta));
  /* Longitud de onda dispersada λ' = λ + λ_C(1−cosθ) */
  O.comptonLam = (lam, theta) => lam + O.comptonShift(theta);
  /* Energía cinética del electrón (eV) tras dispersar un fotón de λ (m) a θ */
  O.comptonKE = (lam, theta) => (h * c) / e * (1 / lam - 1 / O.comptonLam(lam, theta));
  /* Ángulo de retroceso del electrón: cot(φ) = (1 + hν/mc²) tan(θ/2) */
  O.comptonRecoil = (lam, theta) => Math.atan(1 / ((1 + h / (me * c * lam)) * Math.tan(theta / 2)));

  /* ---------- Átomo de Bohr ---------- */
  /* Masa reducida del electrón con un núcleo de masa M (kg) */
  O.reducedMass = (M) => (me * M) / (me + M);
  /* Constante de Rydberg R_M = R_∞ μ/m_e (m⁻¹) */
  O.rydberg = (M) => (M === Infinity || M === undefined ? K.Rinf : K.Rinf * O.reducedMass(M) / me);
  /* Energía del nivel n del ion hidrogenoide de carga Z (eV) */
  O.bohrE = (n, Z = 1, M) => -(K.Rinf * (M ? O.reducedMass(M) / me : 1) * h * c / e) * Z * Z / (n * n);
  /* Longitud de onda en el vacío (nm) de la transición ni → nf (ni > nf) */
  O.bohrLambdaNm = (ni, nf, Z = 1, M) => 1e9 / (O.rydberg(M) * Z * Z * (1 / (nf * nf) - 1 / (ni * ni)));
  /* Radio de Bohr del nivel n (m) */
  O.bohrRadius = (n, Z = 1, M) => (n * n * K.a0) / Z / (M ? O.reducedMass(M) / me : 1);
  /* Velocidad en la órbita de Bohr (m/s): v = Z α c / n */
  O.bohrSpeed = (n, Z = 1) => (Z * K.alpha * c) / n;

  /* ---------- Ondas de materia ---------- */
  /* Longitud de onda de de Broglie (m) para energía cinética T (J) y masa m (kg): relativista exacta */
  O.deBroglie = function (T, m) {
    const mc2 = m * c * c, pc = Math.sqrt(T * (T + 2 * mc2));
    return (h * c) / pc;
  };
  O.deBroglieNR = (T, m) => h / Math.sqrt(2 * m * T);
  /* Longitud de onda del electrón acelerado por V voltios (m) */
  O.electronLambda = (V) => O.deBroglie(e * V, me);
  /* Difracción de Bragg en una fila de átomos de espaciado d: nλ = d sin φ */
  O.braggAngle = (lam, d, n = 1) => (n * lam / d <= 1 ? Math.asin((n * lam) / d) : NaN);

  if (typeof module !== 'undefined' && module.exports) module.exports = O;
})(typeof window !== 'undefined' ? window : globalThis);
