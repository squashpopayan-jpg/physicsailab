/* Capítulo 16 — Afinar las entradas */
(function () {
  'use strict';
  const ML = window.ML;
  ML.defineSim('sens-entradas', (sim) => ML.sweepSim(sim, { keys: ['w1m', 'maxdist', 'banda', 'dema', 'w2m'] }));
})();
