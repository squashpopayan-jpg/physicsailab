/* ===================================================================
   50-fm-rel.js — Relatividad especial (EM.fm.rel): factor de Lorentz, interferómetro de Michelson–Morley,
   reloj de luz, simultaneidad. Sin DOM: se prueba en Node con tests/validar.js. SI salvo aviso.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  K.c = K.c || 299792458;
  const fm = (EM.fm = EM.fm || {});
  const R = (fm.rel = {});
  const c = K.c;

  /* ---------- Cinemática básica ---------- */
  R.gamma = (b) => 1 / Math.sqrt((1 - b) * (1 + b));
  /* β a partir de γ (estable para γ grande): β = √((γ−1)(γ+1))/γ */
  R.betaFromGamma = (g) => Math.sqrt((g - 1) * (g + 1)) / g;
  R.rapidity = (b) => 0.5 * Math.log((1 + b) / (1 - b));
  /* 1 − β en forma estable cuando β → 1: 1/(γ²(1+β)) */
  R.oneMinusBeta = (g) => 1 / (g * g * (1 + R.betaFromGamma(g)));

  /* ---------- Interferómetro de Michelson–Morley ---------- */
  /* Tiempo de ida y vuelta en el sistema del éter para un brazo de longitud L que forma un ángulo θ con el viento de éter
     (el aparato se mueve con velocidad βc): (2L/c)·√(1 − β² sen²θ)/(1 − β²). */
  R.mmTime = (L, b, th) => ((2 * L) / c) * Math.sqrt(1 - b * b * Math.sin(th) ** 2) / (1 - b * b);
  /* Con la contracción de FitzGerald–Lorentz (la componente del brazo a lo largo del movimiento se acorta en √(1 − β²)) */
  R.mmTimeContracted = (L, b, th) => {
    const dx = L * Math.cos(th) * Math.sqrt(1 - b * b), dy = L * Math.sin(th), d2 = dx * dx + dy * dy, v = b * c;
    return (2 * Math.sqrt(v * v * dx * dx + (c * c - v * v) * d2)) / (c * c - v * v);
  };
  /* Posición de las franjas (en franjas) cuando un brazo forma θ con el movimiento y el otro θ + 90° */
  R.mmFringe = (L, lam, b, th, contracted) => {
    const T = contracted ? R.mmTimeContracted : R.mmTime;
    return (c * (T(L, b, th) - T(L, b, th + Math.PI / 2))) / lam;
  };
  /* Desplazamiento al girar el aparato 90° (de θ = 0 a θ = 90°): 2Lβ²/λ a primer orden en β² */
  R.mmRotationShift = (L, lam, b) => R.mmFringe(L, lam, b, 0, false) - R.mmFringe(L, lam, b, Math.PI / 2, false);
  R.mmRotationShiftApprox = (L, lam, b) => (2 * L * b * b) / lam;
  /* Cota de velocidad respecto al éter dada una franja máxima observada dN: β = √(dN·λ/(2L)) */
  R.mmBeta = (L, lam, dN) => Math.sqrt((dN * lam) / (2 * L));

  /* ---------- Reloj de luz ---------- */
  /* Periodo medido en el sistema donde el reloj (brazo L perpendicular al movimiento) se mueve con βc */
  R.lightClockPeriod = (L, b) => (2 * L) / (c * Math.sqrt(1 - b * b));

  /* ---------- Transformación de Lorentz (eje x) y de Galileo ---------- */
  R.boost = (x, t, b) => { const g = R.gamma(b); return [g * (x - b * c * t), g * (t - (b * x) / c)]; };
  R.galileo = (x, t, b) => [x - b * c * t, t];
  /* Desfase entre dos sucesos simultáneos en S separados Δx, visto desde S′ (v = βc): Δt′ = −γ v Δx/c² */
  R.simultaneityShift = (dx, b) => -R.gamma(b) * b * dx / c;

  /* ---------- Transformación de Lorentz: longitudes, velocidades, muones, Fizeau ---------- */
  R.lengthContraction = (L0, b) => L0 / R.gamma(b);
  /* Suma relativista de velocidades (en unidades de c): w = (u + v)/(1 + uv) */
  R.velAdd = (u, v) => (u + v) / (1 + u * v);
  /* N impulsos sucesivos de velocidad b: la rapidez se suma, tanh(N·atanh b) */
  R.velAddN = (n, b) => Math.tanh(n * Math.atanh(b));
  /* Velocidad de la luz en un medio de índice n que se mueve con velocidad v (m/s), en el laboratorio */
  R.fizeauU = (n, v) => (c / n + v) / (1 + v / (n * c));
  R.fizeauCoef = (n) => 1 - 1 / (n * n);
  /* Corrimiento de franjas en el aparato de Fizeau con dos tubos de longitud L por los que el agua fluye en sentidos opuestos */
  R.fizeauFringes = (L, lam, n, v) => (4 * L * v * (n * n - 1)) / (lam * c);
  /* Longitud de desintegración β γ c τ y supervivencia exp(−h/(βγcτ)) (con dilatación) o exp(−h/(βcτ)) (sin ella) */
  R.decayLength = (g, tau) => R.betaFromGamma(g) * g * c * tau;
  R.survival = (h, g, tau, dilated) => Math.exp(-h / (dilated ? R.decayLength(g, tau) : R.betaFromGamma(g) * c * tau));
  /* Cambio de sistema de un suceso (x, t) por una sucesión de impulsos colineales: devuelve [x′, t′] */
  R.boostChain = (x, t, betas) => betas.reduce((s, b) => R.boost(s[0], s[1], b), [x, t]);
  R.interval = (x, t) => c * c * t * t - x * x;

  /* ---------- Espacio-tiempo: intervalos, gemelos, movimiento hiperbólico ---------- */
  K.g0 = 9.80665; K.yr = 365.25 * 86400; K.ly = c * K.yr;
  /* Clasifica el intervalo entre dos sucesos (Δx, cΔt): 'tiempo' (s² > 0), 'espacio' (s² < 0) o 'luz' */
  R.classify = (dx, dct) => { const s2 = dct * dct - dx * dx; return Math.abs(s2) < 1e-12 * (dct * dct + dx * dx + 1e-300) ? 'luz' : s2 > 0 ? 'tiempo' : 'espacio'; };
  /* Gemelos: viaje de ida y vuelta a una distancia d (años luz, en el sistema de la Tierra) a velocidad β, giro instantáneo.
     Devuelve tiempo terrestre, tiempo del viajero, lectura de la Tierra «simultánea» con el giro en cada sistema y el salto. */
  R.twins = (d, b) => {
    const g = R.gamma(b), tE = (2 * d) / b, tauT = tE / g, turn = d / b;
    return { gamma: g, earth: tE, traveler: tauT, earthAtTurnOut: turn - b * d, earthAtTurnIn: turn + b * d, jump: 2 * b * d };
  };
  /* Movimiento con aceleración propia constante a (m/s²) durante un tiempo propio τ (s), partiendo del reposo */
  R.hyp = (a, tau) => { const th = (a * tau) / c; return { t: (c / a) * Math.sinh(th), x: ((c * c) / a) * (Math.cosh(th) - 1), beta: Math.tanh(th), gamma: Math.cosh(th), rapidity: th }; };
  /* Viaje de reposo a reposo a una distancia d (m): acelerar la mitad y frenar la otra mitad con aceleración propia a */
  R.hypTrip = (a, d) => {
    const ch = 1 + (a * d) / (2 * c * c), th = Math.acosh(ch);
    return { tau: (2 * c / a) * th, t: (2 * c / a) * Math.sqrt(ch * ch - 1), gammaMax: ch, betaMax: Math.sqrt(1 - 1 / (ch * ch)) };
  };
  /* Cuadrivelocidad (en unidades de c): [γ, γβ] y producto escalar de Minkowski (signatura + −) */
  R.fourVelocity = (b) => { const g = R.gamma(b); return [g, g * b]; };
  R.dot = (u, w) => u[0] * w[0] - u[1] * w[1];

  /* ---------- Dinámica relativista (unidades naturales: energías en MeV, masas en MeV/c², momentos en MeV/c) ---------- */
  /* Masas (MeV/c²): CODATA 2018 (e, p, n, d) y PDG 2022 (π, μ, K, W, Z, H) */
  R.MASS = { e: 0.51099895, mu: 105.6583755, pi: 139.57039, pi0: 134.9768, K: 493.677, p: 938.27208816, n: 939.56542052, d: 1875.61294257, W: 80377, Z: 91187.6, H: 125250, top: 172690, tau: 1776.86, gamma: 0 };
  R.energy = (m, g) => g * m;                                  /* E = γmc² */
  R.kinetic = (m, g) => (g - 1) * m;                           /* K = (γ − 1)mc² */
  R.gammaFromK = (K, m) => 1 + K / m;
  R.momentumFromK = (K, m) => Math.sqrt(K * (K + 2 * m));      /* pc = √(K(K + 2mc²)) */
  R.betaFromK = (K, m) => R.momentumFromK(K, m) / (K + m);
  R.classicalK = (m, b) => 0.5 * m * b * b;                    /* ½mv² */
  R.classicalV = (K, m) => Math.sqrt((2 * K) / m);             /* v/c que daría la energía cinética clásica */
  /* Invariante s = (E₁ + E₂)² − |p₁ + p₂|² de dos partículas con ángulo θ entre sus momentos */
  R.s2 = (m1, E1, m2, E2, th) => m1 * m1 + m2 * m2 + 2 * (E1 * E2 - Math.sqrt(E1 * E1 - m1 * m1) * Math.sqrt(E2 * E2 - m2 * m2) * Math.cos(th));
  /* Energía disponible en el centro de masas (√s): blanco fijo (la partícula 2 en reposo) y colisionador frontal */
  R.sqrtsFixed = (m1, E1, m2) => Math.sqrt(m1 * m1 + m2 * m2 + 2 * E1 * m2);
  R.sqrtsCollider = (m1, E1, m2, E2) => Math.sqrt(R.s2(m1, E1, m2, E2, Math.PI));
  /* Energía de umbral (cinética del proyectil sobre blanco en reposo) para producir una masa final Mf */
  R.thresholdFixedK = (m1, m2, Mf) => (Mf * Mf - (m1 + m2) * (m1 + m2)) / (2 * m2);
  /* Energía total del haz de un blanco fijo que da el mismo √s que un colisionador simétrico de haces de energía E */
  R.fixedEquivalentE = (m, E) => (4 * E * E - 2 * m * m) / (2 * m);
  /* Momento de cada producto en la desintegración en reposo M → m₁ + m₂ */
  R.twoBodyP = (M, m1, m2) => Math.sqrt((M * M - (m1 + m2) * (m1 + m2)) * (M * M - (m1 - m2) * (m1 - m2))) / (2 * M);
  /* π⁰ → γγ: intervalo de energías de los fotones y ángulo mínimo de apertura para un π⁰ de energía E (m en MeV) */
  R.pi0Photons = (m, E) => { const g = E / m, b = Math.sqrt(1 - 1 / (g * g)); return { Emin: (E * (1 - b)) / 2, Emax: (E * (1 + b)) / 2, thetaMin: 2 * Math.asin(1 / g), gamma: g, beta: b }; };
  /* Masa invariante a partir de dos fotones: m² = 2E₁E₂(1 − cos θ) */
  R.twoPhotonMass = (E1, E2, th) => Math.sqrt(2 * E1 * E2 * (1 - Math.cos(th)));
  /* Q de una reacción a partir de masas atómicas (u): (Σ_in − Σ_out) · 931.494 MeV/u */
  R.U_MEV = 931.49410242;
  R.qValue = (inU, outU) => (inU.reduce((a, b) => a + b, 0) - outU.reduce((a, b) => a + b, 0)) * R.U_MEV;

  /* ---------- Doppler, aberración, Cherenkov y campos en movimiento ---------- */
  /* Factor de Doppler f_obs/f_fuente = 1/(γ(1 − β cos θ)); θ = ángulo, en el sistema del observador, entre la velocidad de la fuente y la dirección de la luz hacia el observador */
  R.doppler = (b, th) => 1 / (R.gamma(b) * (1 - b * Math.cos(th)));
  R.dopplerRecede = (b) => Math.sqrt((1 - b) / (1 + b));
  R.dopplerApproach = (b) => Math.sqrt((1 + b) / (1 - b));
  R.redshiftBeta = (z) => ((1 + z) * (1 + z) - 1) / ((1 + z) * (1 + z) + 1);
  R.betaRedshift = (b) => Math.sqrt((1 + b) / (1 - b)) - 1;
  /* Aberración: ángulo observado α′ de una estrella cuya dirección forma el ángulo α con la velocidad del observador (medido en el sistema en reposo respecto de las estrellas) */
  R.aberrate = (b, al) => Math.acos((Math.cos(al) + b) / (1 + b * Math.cos(al)));
  /* Efecto faro: ángulo en el laboratorio de un fotón emitido a θ* en el sistema de la fuente */
  R.headlight = (b, thStar) => Math.acos((Math.cos(thStar) + b) / (1 + b * Math.cos(thStar)));
  /* Fotones por unidad de ángulo sólido de una fuente isótropa en movimiento: (1/4π)·D² (normalizado a 1 sobre la esfera) */
  R.beamDensity = (b, th) => { const D = R.doppler(b, th); return (D * D) / (4 * Math.PI); };
  /* Radiación de Cherenkov: cos θ_c = 1/(nβ); umbral β = 1/n; energía cinética umbral (MeV) para una masa m (MeV); fotones por metro entre λ₁ y λ₂ (m) */
  R.cherenkovAngle = (n, b) => (n * b > 1 ? Math.acos(1 / (n * b)) : NaN);
  R.cherenkovThresholdK = (n, m) => m * (1 / Math.sqrt(1 - 1 / (n * n)) - 1);
  R.cherenkovYield = (n, b, l1, l2) => { const s2 = 1 - 1 / (n * n * b * b); return n * b > 1 ? 2 * Math.PI * K.alpha * s2 * (1 / l1 - 1 / l2) : 0; };
  /* Transformación de los campos E y B (impulso a lo largo de x con velocidad βc): devuelve {E: [Ex, Ey, Ez], B: [Bx, By, Bz]} en S′ */
  R.fieldBoost = (E, B, b) => {
    const g = R.gamma(b), v = b * c;
    return { E: [E[0], g * (E[1] - v * B[2]), g * (E[2] + v * B[1])], B: [B[0], g * (B[1] + (v * E[2]) / (c * c)), g * (B[2] - (v * E[1]) / (c * c))] };
  };
  /* Campo eléctrico de una carga con velocidad uniforme, relativo al de Coulomb a la misma distancia desde la posición PRESENTE; θ = ángulo entre r y v */
  R.movingChargeE = (b, th) => (1 - b * b) / Math.pow(1 - b * b * Math.sin(th) ** 2, 1.5);
  /* Invariantes: E² − c²B² y E·B */
  R.fieldInvariants = (E, B) => [E[0] ** 2 + E[1] ** 2 + E[2] ** 2 - c * c * (B[0] ** 2 + B[1] ** 2 + B[2] ** 2), E[0] * B[0] + E[1] * B[1] + E[2] * B[2]];
})(typeof window !== 'undefined' ? window : globalThis);
