/* Capítulo 19 — Cuánto arriesgar */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, B = () => ML.L.lab, St = () => ML.L.stats;
  /* forma real de R (variante EMA en M5, media restada) */
  ML.realShape = function (D) {
    if (ML._shape) return ML._shape;
    const { S, X } = B().get(D, 'm5'), P = E().params({ modo: 'ema', maxdist: 12, rechazo: false }), tr = E().run(S, X, P), m = tr.reduce((a, t) => a + t.R, 0) / tr.length;
    ML._shape = { R: tr.map((t) => t.R - m), tp: tr.map((t) => t.reason === 'TP'), sd: St().sd(tr.map((t) => t.R)) };
    return ML._shape;
  };

  ML.defineSim('kelly-curva', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Ventaja medida');
    sim.slider('e', { label: 'Ventaja estimada (R por operación)', min: 0.02, max: 0.3, step: 0.01, value: 0.1, fmt: (v) => ML.R(v, 2) });
    sim.slider('sd', { label: 'Desviación de R', min: 0.5, max: 1.5, step: 0.02, value: 0.88, fmt: (v) => ML.fix(v, 2) });
    sim.slider('n', { label: 'Operaciones en que se midió', min: 30, max: 1000, step: 10, value: 71, fmt: (v) => ML.fix(v, 0) });
    sim.out('k', 'Kelly completo · medio · cuarto', { hl: true });
    sim.out('lo', 'Ventaja en el límite inferior del IC 95 %');
    sim.out('g0', 'Crecimiento con el riesgo del manual (0.125 %)');
    const g = (f, e, sd) => f * e - 0.5 * f * f * sd * sd;
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const p = sim.p, kf = p.e / (p.sd * p.sd), se = p.sd / Math.sqrt(p.n), lo = p.e - 1.96 * se, hi = p.e + 1.96 * se;
      const fmax = Math.min(0.6, kf * 2.4), ymax = Math.max(g(kf, p.e, p.sd), g(Math.min(fmax, hi / (p.sd * p.sd)), hi, p.sd)) * 100 * 1.15;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: fmax * 100, ymin: -ymax * 0.8, ymax, ml: 56, mb: 46, xlabel: 'Riesgo por operación (% de la cuenta)', ylabel: 'Crecimiento por operación (‰ de la cuenta)', yfmt: (v) => ML.fix(v * 10, 0) });
      pl.frame();
      const ctx = cv.ctx;
      pl.clip(() => {
        ctx.fillStyle = ML.alpha('--accent', 0.15); ctx.beginPath();
        const N = 80;
        for (let i = 0; i <= N; i++) { const f = (fmax * i) / N; const y = g(f, hi, p.sd) * 100; (i ? ctx.lineTo : ctx.moveTo).call(ctx, pl.X(f * 100), pl.Y(y)); }
        for (let i = N; i >= 0; i--) { const f = (fmax * i) / N; ctx.lineTo(pl.X(f * 100), pl.Y(g(f, lo, p.sd) * 100)); }
        ctx.closePath(); ctx.fill();
      });
      pl.hline(0, { color: '--ink', width: 1.3, dash: [] });
      pl.fn((x) => g(x / 100, p.e, p.sd) * 100, { color: '--c3', width: 2.8, from: 0, to: fmax * 100 });
      pl.fn((x) => g(x / 100, lo, p.sd) * 100, { color: '--c2', width: 1.4, dash: [5, 4], from: 0, to: fmax * 100 });
      [[0.125, 'manual', '--c4'], [kf * 25, '¼ Kelly', '--c1'], [kf * 50, '½ Kelly', '--c5'], [kf * 100, 'Kelly', '--ink']].forEach(([x, lab, col]) => { if (x <= fmax * 100) pl.vline(x, { color: col, dash: [3, 3], label: lab, labelY: 14 }); });
      pl.legend([{ label: 'ventaja estimada', color: '--c3' }, { label: 'límite inferior del IC', color: '--c2', dash: [5, 4] }, { label: 'rango del IC 95 %', color: '--accent', kind: 'sq' }], 'br');
      sim.set('k', ML.pct(kf, 1) + ' · ' + ML.pct(kf / 2, 1) + ' · ' + ML.pct(kf / 4, 1));
      sim.set('lo', ML.R(lo, 3) + (lo < 0 ? ' <small>(no se sabe si la estrategia crece)</small>' : ''));
      sim.set('g0', ML.fix(g(0.00125, p.e, p.sd) * 100 * 1000, 2) + ' milésimas de % por operación');
    });
  });

  ML.defineSim('abanico-riesgo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Escenario');
    sim.slider('e', { label: 'Ventaja verdadera (R por operación)', min: -0.1, max: 0.3, step: 0.01, value: 0.1, fmt: (v) => ML.R(v, 2) });
    sim.slider('f', { label: 'Riesgo por operación (%)', min: 0.125, max: 3, step: 0.125, value: 0.5, fmt: (v) => ML.fix(v, 3) });
    sim.slider('n', { label: 'Operaciones', min: 50, max: 500, step: 10, value: 250, fmt: (v) => ML.fix(v, 0) });
    sim.button('Otro sorteo', () => { seed++; }, { primary: true });
    sim.out('med', 'Resultado final: mediana (5 %–95 %)', { hl: true });
    sim.out('neg', 'Terminan en pérdida');
    sim.out('dd', 'Caída máxima mediana');
    sim.out('d10', 'Pasan por una caída > 10 % · > 20 %');
    let D = null, seed = 1;
    sim.withData(['m5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const sh = ML.realShape(D), p = sim.p, n = Math.round(p.n), NS = 800, rng = St().rng(seed * 8123 + 1), f = p.f / 100;
      const paths = [], dds = [], fin = [];
      for (let s = 0; s < NS; s++) {
        let c = 1, pk = 1, dd = 0; const e = new Float64Array(n + 1); e[0] = 0;
        for (let i = 0; i < n; i++) { c *= 1 + f * (sh.R[rng.int(sh.R.length)] + p.e); if (c > pk) pk = c; if (1 - c / pk > dd) dd = 1 - c / pk; e[i + 1] = (c - 1) * 100; }
        paths.push(e); dds.push(dd); fin.push(c - 1);
      }
      const q = (i, a) => St().quantile(paths.map((e) => e[i]), a);
      const xs = [], l5 = [], l25 = [], m = [], l75 = [], l95 = [], st = Math.max(1, Math.floor(n / 50));
      for (let i = 0; i <= n; i += st) { xs.push(i); l5.push(q(i, 0.05)); l25.push(q(i, 0.25)); m.push(q(i, 0.5)); l75.push(q(i, 0.75)); l95.push(q(i, 0.95)); }
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: Math.min(-2, ...l5) - 1, ymax: Math.max(2, ...l95) + 1, ml: 56, mb: 44, xlabel: 'Operaciones', ylabel: 'Resultado acumulado (% de la cuenta)' });
      pl.frame();
      const ctx = cv.ctx, band = (a, b, al) => { pl.clip(() => { ctx.fillStyle = ML.alpha('--accent', al); ctx.beginPath(); xs.forEach((x, i) => (i ? ctx.lineTo(pl.X(x), pl.Y(b[i])) : ctx.moveTo(pl.X(x), pl.Y(b[i])))); for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(pl.X(xs[i]), pl.Y(a[i])); ctx.closePath(); ctx.fill(); }); };
      band(l5, l95, 0.12); band(l25, l75, 0.2);
      pl.hline(0, { color: '--ink-3', dash: [4, 3] });
      pl.xy(xs, m, { color: '--accent', width: 3 });
      sim.set('med', ML.fix(100 * St().quantile(fin, 0.5), 1) + ' % (' + ML.fix(100 * St().quantile(fin, 0.05), 1) + ' a ' + ML.fix(100 * St().quantile(fin, 0.95), 1) + ')');
      sim.set('neg', ML.pct(fin.filter((v) => v < 0).length / NS, 0));
      sim.set('dd', ML.pct(St().quantile(dds, 0.5), 1));
      sim.set('d10', ML.pct(dds.filter((v) => v > 0.1).length / NS, 0) + ' · ' + ML.pct(dds.filter((v) => v > 0.2).length / NS, 0));
    });
  });
})();
