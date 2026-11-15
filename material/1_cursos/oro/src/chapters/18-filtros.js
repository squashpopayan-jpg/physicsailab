/* Capítulo 18 — Horario y filtros */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, B = () => ML.L.lab, St = () => ML.L.stats;
  const PIP = 0.1;
  const DAYS = ['lun', 'mar', 'mié', 'jue', 'vie'];
  ML.defineSim('sens-horario', (sim) => ML.sweepSim(sim, { keys: ['ws', 'we', 'tstop'] }));

  ML.defineSim('desglose', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Desglose');
    sim.seg('by', { label: 'Agrupar por', options: [['h', 'Hora de entrada'], ['d', 'Día de la semana'], ['v', 'Volatilidad (ATR)']], value: 'h' });
    sim.seg('win', { label: 'Ventana de entradas', options: [['man', 'Londres 08:57–13:00'], ['all', 'Todo el día 02:00–19:00']], value: 'man' });
    sim.seg('v', { label: 'Regla', options: [['ema', 'EMA sin rechazo'], ['tocar', 'Manual (tocar)']], value: 'ema' });
    sim.out('n', 'Operaciones', { hl: true });
    sim.out('note', 'Lectura', { wide: true });
    let D = null;
    sim.withData(['m5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, { S, X } = B().get(D, 'm5');
      const P = E().params(Object.assign(p.v === 'ema' ? { modo: 'ema', maxdist: 12, rechazo: false } : {}, p.win === 'all' ? { ws: 120, we: 1140 } : {}));
      const tr = E().run(S, X, P);
      let key, labels;
      if (p.by === 'h') { const hs = p.win === 'all' ? [...Array(17).keys()].map((i) => i + 2) : [9, 10, 11, 12]; labels = hs.map((h) => String(h).padStart(2, '0') + ':00'); key = (t) => hs.indexOf(Math.floor(X.mm[t.i] / 60)); }
      else if (p.by === 'd') { labels = DAYS; key = (t) => X.wd[t.i]; }
      else { const at = tr.map((t) => X.atr14[X.im[t.i]] / PIP), q1 = St().quantile(at, 1 / 3), q2 = St().quantile(at, 2 / 3); labels = ['baja (≤ ' + ML.fix(q1, 0) + ')', 'media', 'alta (> ' + ML.fix(q2, 0) + ')']; key = (t) => { const a = X.atr14[X.im[t.i]] / PIP; return a <= q1 ? 0 : a <= q2 ? 1 : 2; }; }
      const groups = labels.map(() => []);
      tr.forEach((t) => { const k = key(t); if (k >= 0 && k < groups.length) groups[k].push(t.R); });
      const items = groups.map((g, i) => { const n = g.length, m = n ? St().mean(g) : NaN, se = n > 1 ? St().sd(g) / Math.sqrt(n) : NaN; return { x: i, m, lo: m - 1.96 * se, hi: m + 1.96 * se, n, color: m >= 0 ? '--c3' : '--c2' }; }).filter((it) => it.n > 1);
      const ymax = Math.max(0.5, ...items.map((i) => i.hi)) + 0.05, ymin = Math.min(-0.5, ...items.map((i) => i.lo)) - 0.05;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.6, xmax: labels.length - 0.4, ymin, ymax, ml: 56, mb: 52, ylabel: 'R medio (IC 95 %)', xticks: labels.map((_, i) => i), xfmt: (i) => labels[i] || '' });
      pl.frame();
      pl.hline(0, { color: '--ink', width: 1.3, dash: [] });
      ML.draw.errbars(pl, items);
      items.forEach((it) => ML.text(cv.ctx, 'n=' + it.n, pl.X(it.x), pl.iy + pl.ih - 6, { size: 10, mono: true, color: '--ink-3', align: 'center' }));
      const st = E().stats(tr, P);
      sim.set('n', st.n + ' · R medio ' + ML.R(st.avgR, 3) + ' ± ' + ML.fix(1.96 * st.seR, 3));
      const worst = items.reduce((a, b) => (b.m < a.m ? b : a), items[0]);
      sim.set('note', items.length ? 'El grupo más negativo es «' + labels[worst.x] + '» con ' + ML.R(worst.m, 2) + ' (t = ' + ML.fix(worst.m / ((worst.hi - worst.lo) / 3.92), 1) + ')' : '—');
    });
  });
})();
