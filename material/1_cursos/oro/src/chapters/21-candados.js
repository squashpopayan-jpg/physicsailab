/* Capítulo 21 — Candados diarios */
(function () {
  'use strict';
  const ML = window.ML, St = () => ML.L.stats, Rk = () => ML.L.risk;
  const POL = [
    ['5 balas sin candados', { balas: 5, onedone: false, meta: 1e9, maxloss: 1e9 }],
    ['2 balas sin candados', { balas: 2, onedone: false, meta: 1e9, maxloss: 1e9 }],
    ['Manual', { balas: 2, onedone: true, meta: 180, maxloss: 250 }],
    ['1 sola bala', { balas: 1, onedone: true, meta: 180, maxloss: 250 }],
    ['Manual, meta 90', { balas: 2, onedone: true, meta: 90, maxloss: 250 }]
  ];
  function days(shape, edge, lam, pol, seed) {
    const rng = St().rng(seed);
    const smp = () => { const i = rng.int(shape.R.length); return { R: shape.R[i] + edge, tp: shape.tp[i] }; };
    return Rk().dayStats(Object.assign({ sampler: smp, lambda: lam, ndays: 30000, risk: 125, seed: seed + 1 }, pol));
  }

  ML.defineSim('candados-comparar', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '380px' });
    sim.group('Escenario');
    sim.slider('e', { label: 'Ventaja verdadera (R por operación)', min: 0, max: 0.3, step: 0.01, value: 0.1, fmt: (v) => ML.R(v, 2) });
    sim.slider('lam', { label: 'Señales por día', min: 0.2, max: 2, step: 0.1, value: 0.8, fmt: (v) => ML.fix(v, 1) });
    POL.forEach((q, i) => sim.out('p' + i, q[0], { wide: true }));
    let D = null;
    sim.withData(['m5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, sh = ML.realShape(D), rows = POL.map((q, i) => days(sh, p.e, p.lam, q[1], 100 + i));
      const w2 = cv.w / 2;
      const p1 = new ML.Plot(cv.ctx, { x: 0, y: 0, w: w2, h: cv.h, xmin: 0.4, xmax: 5.6, ymin: 0, ymax: Math.max(5, ...rows.map((r) => r.mean)) * 1.25, ml: 50, mb: 62, ylabel: 'Resultado medio por día (USD)', xticks: [1, 2, 3, 4, 5], xfmt: (v) => ['5 balas', '2 balas', 'manual', '1 bala', 'meta 90'][v - 1] || '' });
      p1.frame();
      ML.draw.bars(p1, rows.map((_, i) => i + 1), rows.map((r) => Math.max(0, r.mean)), 0.6, { color: '--accent', alpha: 0.85 });
      rows.forEach((r, i) => ML.text(cv.ctx, ML.fix(r.mean, 1), p1.X(i + 1), p1.Y(Math.max(0, r.mean)) - 6, { size: 10.5, mono: true, color: '--ink-2', align: 'center' }));
      const p2 = new ML.Plot(cv.ctx, { x: w2, y: 0, w: w2, h: cv.h, xmin: 0.4, xmax: 5.6, ymin: -600, ymax: 0, ml: 50, mb: 62, ylabel: 'Peor día simulado (USD)', xticks: [1, 2, 3, 4, 5], xfmt: (v) => ['5 balas', '2 balas', 'manual', '1 bala', 'meta 90'][v - 1] || '' });
      p2.frame();
      ML.draw.bars(p2, rows.map((_, i) => i + 1), rows.map((r) => r.worst), 0.6, { color: '--c2', alpha: 0.85 });
      rows.forEach((r, i) => sim.set('p' + i, 'media ' + ML.usdS(r.mean, 1) + ' · verdes ' + ML.pct(r.pGreen, 0) + ' · rojos ' + ML.pct(r.pRed, 0) + ' · peor día ' + ML.usd(r.worst) + ' · sd ' + ML.fix(r.sd, 0)));
    });
  });

  ML.defineSim('candados-libre', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '380px' });
    sim.group('Política');
    sim.slider('e', { label: 'Ventaja verdadera (R)', min: 0, max: 0.3, step: 0.01, value: 0.1, fmt: (v) => ML.R(v, 2) });
    sim.slider('lam', { label: 'Señales por día', min: 0.2, max: 2.5, step: 0.1, value: 0.8, fmt: (v) => ML.fix(v, 1) });
    sim.slider('balas', { label: 'Balas', min: 1, max: 5, step: 1, value: 2, fmt: (v) => ML.fix(v, 0) });
    sim.check('one', { label: 'One and Done', value: true });
    sim.slider('meta', { label: 'Meta diaria (USD)', min: 50, max: 600, step: 10, value: 180, fmt: (v) => ML.usd(v) });
    sim.slider('cap', { label: 'Tope de pérdida (USD)', min: 100, max: 700, step: 10, value: 250, fmt: (v) => ML.usd(v) });
    sim.out('m', 'Media por día', { hl: true });
    sim.out('g', 'Verdes · rojos · sin operar');
    sim.out('w', 'Peor día · desviación');
    let D = null;
    sim.withData(['m5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, r = days(ML.realShape(D), p.e, p.lam, { balas: Math.round(p.balas), onedone: p.one, meta: p.meta, maxloss: p.cap }, 7);
      const lo = -700, hi = 500, bins = 48, h = St().histogram(r.values, lo, hi, bins), bw = (hi - lo) / bins, N = r.values.length;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(...h.slice(0, 22), ...h.slice(24)) / N * 1.2, ml: 56, mb: 44, xlabel: 'Resultado del día (USD)', ylabel: 'Fracción de los días (sin el cero)', yfmt: (v) => ML.fix(100 * v, 1) + ' %' });
      pl.frame();
      const xs = h.map((_, i) => lo + (i + 0.5) * bw);
      ML.draw.bars(pl, xs, h.map((v, i) => (Math.abs(xs[i]) < bw ? 0 : v / N)), bw * 0.9, { colors: xs.map((x) => (x > 0 ? '--c3' : '--c2')), alpha: 0.85 });
      pl.vline(0, { color: '--ink', width: 1.3, dash: [] });
      pl.vline(r.mean, { color: '--accent', width: 2, dash: [4, 3], label: 'media ' + ML.fix(r.mean, 1) });
      sim.set('m', ML.usdS(r.mean, 1) + ' por día');
      sim.set('g', ML.pct(r.pGreen, 0) + ' · ' + ML.pct(r.pRed, 0) + ' · ' + ML.pct(r.pFlat, 0));
      sim.set('w', ML.usd(r.worst) + ' · ' + ML.usd(r.sd));
    });
  });
})();
