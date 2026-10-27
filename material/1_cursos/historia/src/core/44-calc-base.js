/* Funciones puras de cálculo histórico (sin DOM): las usan las simulaciones y tests/validar.js */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  EM.calc = EM.calc || {};
  /* Constantes astronómicas (valores medios, días) */
  EM.calc.K = {
    synodic: 29.530588853, draconic: 27.212220817, anomalistic: 27.554549878, tropicalYear: 365.24219, siderealYear: 365.25636,
    AU: 149597870.7, /* km */
    G: 6.67430e-11, c: 299792458, h: 6.62607015e-34, kB: 1.380649e-23, e: 1.602176634e-19, me: 9.1093837015e-31, NA: 6.02214076e23,
    Rearth: 6371.0, /* km, radio medio */
    Msun: 1.98847e30, Mearth: 5.9722e24, Rsun: 6.957e8, g: 9.80665
  };
  /* Rotación de Rodrigues del vector v alrededor del eje unitario k, ángulo a */
  EM.calc.rot = function (v, k, a) {
    const c = Math.cos(a), s = Math.sin(a), d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
    const x = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
    return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)];
  };
})(typeof window !== 'undefined' ? window : global);
