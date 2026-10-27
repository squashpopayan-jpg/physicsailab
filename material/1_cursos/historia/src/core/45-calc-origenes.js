(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  /* Ciclo de Saros: desfase en días entre N lunaciones y el múltiplo entero más cercano de otro mes lunar */
  C.cycleMismatch = function (N, month) {
    const T = N * K.synodic;
    const k = Math.round(T / month);
    return { T, k, dev: T - k * month };
  };
  /* Raíz cuadrada por el método babilónico (Herón): x ← (x + a/x)/2 */
  C.babSqrt = function (a, x0, n) {
    const xs = [x0];
    for (let i = 0; i < n; i++) { const x = xs[xs.length - 1]; xs.push((x + a / x) / 2); }
    return xs;
  };
  /* Expansión sexagesimal de un número positivo: [entero, d1, d2, …] */
  C.sexagesimal = function (x, nd) {
    const out = [Math.floor(x)];
    let f = x - out[0];
    for (let i = 0; i < nd; i++) { f *= 60; const d = Math.floor(f + 1e-12); out.push(d); f -= d; }
    return out;
  };
  C.sexToNumber = function (d) { return d.reduce((s, v, i) => s + v / Math.pow(60, i), 0); };
  /* Filas de Plimpton 322 (corregidas): [anchura b, diagonal d, altura h] */
  C.plimpton = [[119, 169, 120], [3367, 4825, 3456], [4601, 6649, 4800], [12709, 18541, 13500], [65, 97, 72], [319, 481, 360], [2291, 3541, 2700], [799, 1249, 960], [481, 769, 600], [4961, 8161, 6480], [45, 75, 60], [1679, 2929, 2400], [161, 289, 240], [1771, 3229, 2700], [56, 106, 90]];
  /* Longitud de Venus: calendario maya (584 d) frente al periodo sinódico real */
  C.venusSynodic = 583.92;
})(typeof window !== 'undefined' ? window : global);
