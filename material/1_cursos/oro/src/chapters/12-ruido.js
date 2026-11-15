/* Capítulo 12 — Ruido y señal */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, B = () => ML.L.lab, St = () => ML.L.stats;

  /* ======================================================================
     12.1 Potencia
     ====================================================================== */
  ML.defineSim('potencia', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Parámetros');
    sim.slider('sd', { label: 'Desviación de R por operación', min: 0.5, max: 1.6, step: 0.02, value: 0.88, fmt: (v) => ML.fix(v, 2) });
    sim.slider('pw', { label: 'Potencia deseada', min: 0.5, max: 0.95, step: 0.05, value: 0.8, fmt: (v) => ML.pct(v, 0) });
    sim.slider('rate', { label: 'Operaciones por día', min: 0.2, max: 2, step: 0.1, value: 0.8, fmt: (v) => ML.fix(v, 1) });
    sim.out('n10', 'Operaciones para detectar +0.10 R', { hl: true });
    sim.out('t10', 'Tiempo para detectar +0.10 R');
    sim.out('m1', 'Ventaja mínima detectable con 59 · 71 · 184 operaciones');
    const minEdge = (n, sd, pw) => (St().normInv(0.975) + St().normInv(pw)) * sd / Math.sqrt(n);
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const p = sim.p, z = St().normInv(0.975) + St().normInv(p.pw);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.03, xmax: 0.5, ymin: 20, ymax: 8000, ylog: true, ml: 58, mb: 44, xlabel: 'Ventaja verdadera Δ (R por operación)', ylabel: 'Operaciones necesarias' });
      pl.frame();
      pl.fn((d) => Math.pow(z * p.sd / d, 2), { color: '--accent', width: 2.8 });
      [[59, 'M1'], [71, 'M5'], [184, 'M15']].forEach(([n, lab]) => { pl.hline(n, { color: '--ink-3', dash: [4, 4], width: 1.2, label: lab + ' (' + n + ')', labelRight: true }); const d = minEdge(n, p.sd, p.pw); pl.dot(d, n, { r: 5, color: '--c2' }); });
      const n10 = Math.ceil(Math.pow(z * p.sd / 0.1, 2));
      sim.set('n10', ML.fix(n10, 0));
      sim.set('t10', ML.fix(n10 / p.rate / 252, 1) + ' años a ' + ML.fix(p.rate, 1) + ' operaciones por día');
      sim.set('m1', [59, 71, 184].map((n) => '+' + ML.fix(minEdge(n, p.sd, p.pw), 2)).join(' · ') + ' R');
    });
  });

  /* ======================================================================
     12.2 Mil estrategias sin ventaja
     ====================================================================== */
  ML.defineSim('mil-estrategias', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, maxH: '420px' });
    sim.group('Experimento');
    sim.slider('n', { label: 'Operaciones por estrategia', min: 20, max: 300, step: 10, value: 70, fmt: (v) => ML.fix(v, 0) });
    sim.slider('K', { label: 'Estrategias sin ventaja', min: 20, max: 2000, step: 20, value: 1000, fmt: (v) => ML.fix(v, 0) });
    sim.check('best', { label: 'Mostrar la mejor', value: false });
    sim.button('Otro sorteo', () => { seed++; }, { primary: true });
    sim.out('out', 'Con |t| > 2', { hl: true });
    sim.out('mx', 'Mejor t · peor t');
    sim.out('bon', 'Umbral de Bonferroni para K pruebas');
    let shape = null, seed = 1;
    sim.withData(['m5'], (D) => {
      const { S, X } = B().get(D, 'm5'), tr = E().run(S, X, E().params({ modo: 'ema', maxdist: 12, rechazo: false })), m = tr.reduce((a, t) => a + t.R, 0) / tr.length;
      shape = tr.map((t) => t.R - m); sim.redraw();
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!shape) return;
      const p = sim.p, n = Math.round(p.n), K = Math.round(p.K), rng = St().rng(seed * 6701 + 1);
      const ts = new Float64Array(K), sums = [];
      let ib = 0;
      for (let k = 0; k < K; k++) {
        let s = 0, s2 = 0;
        const path = p.best ? [0] : null;
        for (let i = 0; i < n; i++) { const r = shape[rng.int(shape.length)]; s += r; s2 += r * r; }
        const m = s / n, sd = Math.sqrt((s2 - n * m * m) / (n - 1));
        ts[k] = m / (sd / Math.sqrt(n));
        if (ts[k] > ts[ib]) ib = k;
      }
      const lo = -4.5, hi = 4.5, bins = 36, h = St().histogram(ts, lo, hi, bins), bw = (hi - lo) / bins;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h * (p.best ? 0.55 : 1), xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(...h) * 1.15, ml: 50, mb: 40, xlabel: 'Estadístico t de cada estrategia', ylabel: 'Estrategias' });
      pl.frame();
      const xs = h.map((_, i) => lo + (i + 0.5) * bw);
      ML.draw.bars(pl, xs, h, bw * 0.92, { colors: xs.map((x) => (Math.abs(x) > 1.96 ? '--c2' : '--accent')), alpha: 0.8 });
      pl.vline(-1.96, { color: '--ink-2', dash: [4, 3] }); pl.vline(1.96, { color: '--ink-2', dash: [4, 3] });
      const out = Array.from(ts).filter((t) => Math.abs(t) > 1.96).length;
      sim.set('out', out + ' de ' + K + ' (' + ML.pct(out / K, 1) + '); esperado 5 %');
      sim.set('mx', ML.fix(Math.max(...ts), 2) + ' · ' + ML.fix(Math.min(...ts), 2));
      sim.set('bon', '|t| > ' + ML.fix(St().normInv(1 - 0.05 / (2 * K)), 2));
      if (p.best) {
        /* regenera la mejor: repite el sorteo hasta la estrategia ib con el mismo generador */
        const rng2 = St().rng(seed * 6701 + 1);
        let path = null;
        for (let k = 0; k <= ib; k++) { const e = [0]; for (let i = 0; i < n; i++) { const r = shape[rng2.int(shape.length)]; e.push(e[i] + r); } if (k === ib) path = e; }
        const p2 = new ML.Plot(cv.ctx, { x: 0, y: cv.h * 0.57, w: cv.w, h: cv.h * 0.43, xmin: 0, xmax: n, ymin: Math.min(...path) - 1, ymax: Math.max(...path) + 1, ml: 50, mb: 36, xlabel: 'Operaciones de la «mejor» estrategia sin ventaja', ylabel: 'R acumulado' });
        p2.frame();
        p2.hline(0, { color: '--ink-3', dash: [4, 3] });
        p2.xy(path.map((_, i) => i), path, { color: '--c3', width: 2.6 });
      }
    });
  });
})();
