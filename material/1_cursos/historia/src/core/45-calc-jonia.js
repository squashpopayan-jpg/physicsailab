(function (root) {
  'use strict';
  const C = root.EM.calc;
  /* Cuerda vibrante: frecuencia fundamental f = (1/2L) sqrt(T/mu); armónicos n f. Razón de longitudes -> razón de frecuencias */
  C.stringFreq = function (L, T, mu, n) { return (n || 1) * Math.sqrt(T / mu) / (2 * L); };
  /* Intervalos pitagóricos (razones de longitudes de cuerda iguales a razones de frecuencias inversas) */
  C.intervals = [['unísono', 1, 1], ['octava', 2, 1], ['quinta', 3, 2], ['cuarta', 4, 3], ['tono', 9, 8], ['tercera mayor pitagórica', 81, 64]];
  C.cents = (r) => 1200 * Math.log2(r);
  /* Paradoja de Aquiles: instante de alcance con velocidades va > vt y ventaja d */
  C.achilles = function (va, vt, d, n) {
    let pos = d, t = 0, steps = [];
    for (let i = 0; i < n; i++) { const dt = pos / va; t += dt; pos = vt * dt; steps.push({ t, gap: pos }); }
    return { steps, tExact: d / (va - vt) };
  };
  /* Thales: altura de un objeto por semejanza de triángulos con su propia sombra */
  C.shadowHeight = (hRef, sRef, s) => (hRef * s) / sRef;
  /* Escala pitagórica: apila quintas 3:2 y las reduce a una octava; el "comma" tras 12 quintas */
  C.pythComma = () => Math.pow(1.5, 12) / Math.pow(2, 7);
})(typeof window !== 'undefined' ? window : global);
