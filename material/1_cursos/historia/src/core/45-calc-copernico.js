(function (root) {
  'use strict';
  const C = root.EM.calc;
  const TAU = 2 * Math.PI;
  /* Datos modernos de los planetas: periodo sidéreo (días) y semieje (UA) */
  C.SOLAR = { mercurio: { P: 87.969, a: 0.38710 }, venus: { P: 224.701, a: 0.72333 }, tierra: { P: 365.256, a: 1 }, marte: { P: 686.980, a: 1.52368 }, jupiter: { P: 4332.589, a: 5.2026 }, saturno: { P: 10759.22, a: 9.5549 } };
  /* Planeta inferior: la elongación máxima ε da el radio de su órbita, a = sen ε */
  C.copernicusInferior = (epsDeg) => Math.sin((epsDeg * Math.PI) / 180);
  /* Planeta superior: en cuadratura el ángulo Sol-Tierra-planeta es 90°; el ángulo en el Sol es
     φ = 2π t (1/Pt − 1/Pp) tras t días desde la oposición, y a = 1/cos φ */
  C.copernicusSuperior = function (t, Pe, Pp) {
    const phi = TAU * t * (1 / Pe - 1 / Pp);
    return { phi, a: 1 / Math.cos(phi) };
  };
  /* Tiempo teórico entre oposición y cuadratura para un planeta superior con radio a */
  C.quadratureTime = (a, Pe, Pp) => Math.acos(1 / a) / (TAU * (1 / Pe - 1 / Pp));
  /* Periodo sinódico */
  C.synodic = (P1, P2) => 1 / Math.abs(1 / P1 - 1 / P2);
  /* Paralaje: distancia = línea de base / tan(paralaje) */
  C.parallaxDistance = (baselineKm, parallaxArcsec) => baselineKm / Math.tan((parallaxArcsec / 3600) * Math.PI / 180);
  C.KM = { earthRadius: 6371.0, AU: 149597870.7, lightYear: 9.4607304725808e12, parsec: 3.0856775814914e13 };
  /* Posición geocéntrica de Marte (circulos): Ptolomeo (deferente + epiciclo), Copérnico (órbitas en torno al Sol) y Tycho */
  C.marsModels = function (tYears, RM, TM) {
    const e = TAU * tYears, m = (TAU * tYears) / TM;
    const cop = [RM * Math.cos(m) - Math.cos(e), RM * Math.sin(m) - Math.sin(e)];
    const sunE = [Math.cos(e + Math.PI) * -1, Math.sin(e + Math.PI) * -1]; /* Sol visto desde la Tierra: opuesto a la Tierra */
    const tyc = [-Math.cos(e) + RM * Math.cos(m), -Math.sin(e) + RM * Math.sin(m)];
    const pto = [RM * Math.cos(m) + (-Math.cos(e)), RM * Math.sin(m) + (-Math.sin(e))];
    return { cop, tyc, pto };
  };
})(typeof window !== 'undefined' ? window : global);
