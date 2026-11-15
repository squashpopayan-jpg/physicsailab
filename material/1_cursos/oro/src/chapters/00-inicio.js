/* Portada — cien estrategias sin ventaja */
(function () {
  'use strict';
  const ML = window.ML;
  ML.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.25, maxH: '440px' });
    sim.group('Mundo');
    sim.slider('edge', { label: 'Ventaja verdadera (R por operación)', min: -0.1, max: 0.3, step: 0.01, value: 0, fmt: (v) => ML.R(v, 2) });
    sim.slider('n', { label: 'Operaciones por estrategia', min: 40, max: 400, step: 10, value: 150, fmt: (v) => ML.fix(v, 0) });
    sim.button('Otro sorteo', () => { seed++; build(); }, { primary: true });
    sim.out('best', 'La mejor de las 100', { hl: true });
    sim.out('med', 'Mediana');
    sim.out('worst', 'La peor');
    sim.out('pos', 'Cuántas terminan en positivo');
    let seed = 7, curves = [];
    const B = 1.64;
    function build() {
      const p = sim.p, rng = ML.L.stats.rng(seed * 101 + 5);
      /* acierto tal que E = edge:  p*B - (1-p) = edge  ->  p = (1+edge)/(1+B) */
      const pw = (1 + p.edge) / (1 + B);
      curves = [];
      for (let k = 0; k < 100; k++) {
        const e = new Float64Array(p.n + 1);
        for (let i = 0; i < p.n; i++) e[i + 1] = e[i] + (rng() < pw ? B : -1);
        curves.push(e);
      }
    }
    sim.onChange = (id) => { if (id !== undefined) build(); };
    build();
    sim.onDraw(() => {
      const p = sim.p, n = Math.round(p.n);
      ML.draw.clear(cv);
      const fin = curves.map((e) => e[n]);
      const order = fin.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
      const iBest = order[order.length - 1][1], iWorst = order[0][1];
      let ymin = Infinity, ymax = -Infinity;
      for (const e of curves) for (let i = 0; i <= n; i++) { if (e[i] < ymin) ymin = e[i]; if (e[i] > ymax) ymax = e[i]; }
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: Math.floor(ymin - 2), ymax: Math.ceil(ymax + 2), ml: 46, mb: 40, xlabel: 'Operaciones', ylabel: 'Resultado acumulado (R)' });
      pl.frame();
      curves.forEach((e, k) => {
        if (k === iBest || k === iWorst) return;
        pl.xy(Array.from(e.slice(0, n + 1), (_, i) => i), Array.from(e.slice(0, n + 1)), { color: '--ink-3', width: 1, alpha: 0.28 });
      });
      pl.xy(Array.from(curves[iWorst].slice(0, n + 1), (_, i) => i), Array.from(curves[iWorst].slice(0, n + 1)), { color: '--c2', width: 2.4 });
      pl.xy(Array.from(curves[iBest].slice(0, n + 1), (_, i) => i), Array.from(curves[iBest].slice(0, n + 1)), { color: '--c3', width: 2.8 });
      const sorted = fin.slice().sort((a, b) => a - b);
      sim.set('best', ML.R(sorted[99], 1) + ' <small>(' + ML.usdS(sorted[99] * 125) + ' con 125 USD por R)</small>');
      sim.set('med', ML.R(sorted[49], 1));
      sim.set('worst', ML.R(sorted[0], 1));
      sim.set('pos', fin.filter((v) => v > 0).length + ' de 100');
    });
  });
})();
