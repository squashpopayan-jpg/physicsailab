/* Capítulo 17 — Afinar las salidas */
(function () {
  'use strict';
  const ML = window.ML;
  ML.defineSim('sens-salidas', (sim) => ML.sweepSim(sim, { keys: ['slk', 'tpk', 'sldact', 'sldpips', 'beratio', 'bemargin', 'stagmin'] }));
})();
