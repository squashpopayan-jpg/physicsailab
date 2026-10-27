(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  C.gamma = (b) => 1 / Math.sqrt(1 - b * b);
  /* Transformación de Lorentz (c = 1): (x, t) en S → (x', t') en S' que se mueve con β */
  C.boost = function (x, t, b) { const g = C.gamma(b); return { x: g * (x - b * t), t: g * (t - b * x) }; };
  C.interval2 = (x, t) => t * t - x * x;
  C.velAdd = (u, v) => (u + v) / (1 + u * v);
  /* Efecto Doppler longitudinal: razón de frecuencias recibida/emitida con la fuente alejándose a β */
  C.dopplerRecede = (b) => Math.sqrt((1 - b) / (1 + b));
  C.dopplerApproach = (b) => Math.sqrt((1 + b) / (1 - b));
  /* Gemelo viajero: ida y vuelta a distancia L (años luz) con velocidad β y giro instantáneo; tiempo propio (años) */
  C.twinProper = (L, b) => (2 * L) / b / C.gamma(b);
  C.twinEarth = (L, b) => (2 * L) / b;
  /* Gemelo con aceleración constante a (en g) hasta la mitad y frenado: tiempo propio para distancia total D (años luz).
     Hiperbólica: τ = (c/a)·acosh(1 + aD/(2c²)) por cada mitad (una de aceleración y otra de frenado): total 4 mitades de D/2 */
  C.rocketProper = (Dly, aG) => { const a = aG * 9.80665, c = K.c, ly = 9.4607304725808e15, yr = 365.25 * 86400; const d = (Dly * ly) / 2; return (2 * (c / a) * Math.acosh(1 + (a * d) / (c * c))) / yr; };
  /* Muones atmosféricos: fracción que llega al suelo desde la altura h con velocidad β y vida media tau (s) */
  C.muonSurvive = (h, b, tau, relativist) => { const t = h / (b * K.c); return Math.exp(-t / (relativist ? C.gamma(b) * tau : tau)); };
  /* Energía y momento relativistas */
  C.restEnergy = (m) => m * K.c * K.c;
  C.kineticRel = (m, b) => (C.gamma(b) - 1) * m * K.c * K.c;
  C.kineticClassical = (m, b) => 0.5 * m * b * b * K.c * K.c;
  C.momentumRel = (m, b) => C.gamma(b) * m * b * K.c;
  /* Masa transversal de Abraham (esfera rígida) en unidades de m0 */
  C.massAbraham = (b) => (3 / (4 * b * b)) * (((1 + b * b) / (2 * b)) * Math.log((1 + b) / (1 - b)) - 1);
  /* Velocidad de un electrón acelerado por una tensión V */
  C.betaFromVolts = (V) => { const g = 1 + (K.e * V) / (K.me * K.c * K.c); return Math.sqrt(1 - 1 / (g * g)); };
})(typeof window !== 'undefined' ? window : globalThis);
