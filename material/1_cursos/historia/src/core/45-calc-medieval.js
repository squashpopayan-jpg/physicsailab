(function (root) {
  'use strict';
  const C = root.EM.calc;
  const DEG = Math.PI / 180;
  /* Gota de lluvia: desviación total tras k reflexiones internas para incidencia i (rad) e índice n */
  C.dropDeviation = function (i, n, k) {
    const r = Math.asin(Math.sin(i) / n);
    return k * Math.PI + 2 * i - 2 * (k + 1) * r;
  };
  /* Incidencia de desviación mínima (arcoíris): cos²i = (n²−1)/(k(k+2)) */
  C.rainbowIncidence = (n, k) => Math.acos(Math.sqrt((n * n - 1) / (k * (k + 2))));
  /* Ángulo del arcoíris respecto del punto antisolar (grados) */
  C.rainbowAngle = function (n, k) {
    const D = C.dropDeviation(C.rainbowIncidence(n, k), n, k) / DEG;
    return k === 1 ? 180 - D : D - 180;
  };
  /* Regla de Merton: distancias recorridas en intervalos iguales con aceleración constante (en unidades de la primera) */
  C.oddDistances = function (n) {
    const out = [];
    for (let i = 1; i <= n; i++) out.push((i * i - (i - 1) * (i - 1)));
    return out;
  };
  /* Distancia con velocidad lineal v = a t: área bajo la curva y velocidad media (regla de Merton) */
  C.mertonDistance = (a, t) => 0.5 * a * t * t;
  C.meanSpeedDistance = (v0, v1, t) => ((v0 + v1) / 2) * t;
  /* Serie armónica: Oresme demostró que diverge agrupando términos; suma parcial y cota */
  C.harmonic = (n) => { let s = 0; for (let i = 1; i <= n; i++) s += 1 / i; return s; };
  C.oresmeBound = (n) => 1 + Math.floor(Math.log2(n)) / 2;
})(typeof window !== 'undefined' ? window : global);
